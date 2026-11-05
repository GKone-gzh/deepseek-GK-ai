/**
 * GK协助工作台 · 协作模式与预算熔断（宿主侧真执行）。
 *
 * v1.1.1 起改成「全局注册」：
 *  - 工具 guard 注册在插件自己的（非 agent）context 上 → 对所有 Agent 生效，单条注册、生命周期跟随插件；
 *  - 系统提示段同样全局注册，text 是接收 AssembleContext 的函数，按 scope.id 动态读取模式；
 *  - 不再给每个 Agent 装 guard/section。旧做法在插件热重载时会残留旧注册，且被 agent scope 的同名
 *    section 遮蔽，导致新代码不生效；改全局后热重载只需重装一次。
 *
 * 模式：
 *  - ask（默认）：AI 判断需要协作时，必须先用 ask_user_question 征得用户同意；宿主按
 *    「最近一条人类消息之后是否调用过 ask_user_question」判定，未询问前拒绝协作类工具；
 *  - auto：模型自己决定；
 *  - off：拒绝全部协作类工具。
 *
 * 预算：每 10 秒按「本次任务」统计成员用量，超预算的 running 队友会被 agentTeams.interrupt；
 * 熔断状态下 guard 拒绝继续派活。
 */
import { collectFamily } from './family.js';
import { budgetSessionIds, getMode, getSessionState } from './state.js';
import { sessionTaskStart, sessionUsageSince } from './usage.js';

const BUDGET_TICK_MS = 10000;
const INTERRUPT_COOLDOWN_MS = 90000;
const SECTION_NAME = 'gk-cockpit:coordination:v2';

/** 协作类工具：ask/off 模式下需要门禁的工具。 */
export const COLLAB_TOOLS = Object.freeze([
  'spawn_teammate',
  'send_message',
  'list_agents',
  'wait_agent',
  'interrupt_agent',
  'team_task_create',
  'team_task_get',
  'team_task_list',
  'team_task_update',
  'subagent',
  'subagent_fork',
  'workflow',
]);

const COLLAB_SET = new Set(COLLAB_TOOLS);

const OFF_MODE_PROMPT = '协作模式已关闭（GK协助工作台）：本会话只做单 agent 任务，不要调用 spawn_teammate、send_message、list_agents、wait_agent、interrupt_agent、team_task_*、subagent、subagent_fork、workflow。用户要协作时会在工作台把模式切回询问或自动。';

const NAMING_PROMPT = '命名约定（GK协助工作台）：主控对用户显示为「主管」；派队友时用中文部门名，例如 技术部门、图像部门、测试部门、文档部门、数据部门、调研部门。';

const ASK_MODE_PROMPT = '协作模式=询问（GK协助工作台）：单 agent 能完成的任务直接做，不要问。只有当你判断任务确实需要多个 agent 协同时，才先用 ask_user_question 向用户确认（说明为什么需要协作、打算派几个 agent、各自负责什么）；用户明确同意后再调用 spawn_teammate 等协作工具。在得到同意之前不要组队。派队友时用中文部门名（技术部门/图像部门/测试部门/文档部门/数据部门/调研部门）。';

const COUNCIL_MODE_PROMPT = '协作模式=计划商讨（GK协助工作台），固定两阶段，不要跳步：\n1) 商讨：收到任务后，先派 2-3 个 council 子 agent（spawn_teammate，名字 council-a / council-b / council-c），分别从「最省事的可行方案」「风险、反例与边界」「实现与验收」三个角度独立给出方案；用 send_message 收集后合并成一份《实施计划》：目标、范围、关键决策与默认假设、步骤、验收标准、风险与回退、预算估计。把计划完整展示给用户，明确写「请确认计划；确认后我会一次做到验收，不再中途询问」，然后结束本轮等待用户回复。\n2) 执行：用户确认后，按计划从第一步做到验收，不调用 ask_user_question、不中途征求许可；遇到不确定处按计划里的默认假设继续；阶段完成更新任务板；最后跑验收并给出结果与证据。除非用户主动打断，否则不要停。\n本模式禁止 ask_user_question（宿主会拒绝）：需要用户决策的内容必须在计划里一次性写清。建议在完全权限（danger-full-access）下使用，避免沙箱拦截导致中断。派 council 成员时用中文部门名（技术部门/图像部门/测试部门等）。';

function safe(fn, fallback) {
  try {
    const value = fn();
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

export function createCoordinator(ctx) {
  const svc = (name) => {
    try {
      return ctx.get(name);
    } catch {
      return undefined;
    }
  };

  const askedState = new Map(); // sessionId -> { lastHumanAt, lastAskAt }
  const budgetStatus = new Map(); // rootSessionId -> { at, since, over, totals, members }
  const lastInterrupt = new Map(); // root|name -> timestamp
  let ticking = false;
  let started = false;
  let guardInstalled = false;
  let promptInstalled = false;

  function agentIdOf(scope) {
    if (!scope || typeof scope !== 'object') return '';
    const id = scope.id !== undefined ? scope.id : scope.sessionId;
    return typeof id === 'string' ? id : '';
  }

  /** 把任意 agent/session 解析成根会话 id（Team Lead 的会话）。 */
  function rootIdOf(agentLike) {
    const agentTeams = svc('agentTeams');
    const membership = safe(() => (
      agentTeams && typeof agentTeams.tryMembership === 'function' && agentLike
        ? agentTeams.tryMembership(agentLike)
        : undefined
    ), undefined);
    if (membership && membership.root && membership.root.id) return String(membership.root.id);
    return agentIdOf(agentLike);
  }

  function coordinationText(scope) {
    const root = rootIdOf(scope);
    if (!root) return '';
    const mode = getMode(root);
    if (mode === 'off') return OFF_MODE_PROMPT;
    if (mode === 'ask') return ASK_MODE_PROMPT;
    if (mode === 'council') return COUNCIL_MODE_PROMPT;
    if (mode === 'auto') return NAMING_PROMPT;
    return '';
  }

  /** 记录每个会话的「最近人类消息时间」与「最近 ask_user_question 时间」。 */
  function noteSessionEvent(session, event) {
    try {
      if (!session || !event || !session.id) return;
      const id = String(session.id);
      const entry = askedState.get(id) || { lastHumanAt: 0, lastAskAt: 0 };
      if (event.type === 'user/message') {
        const source = event.data && event.data.source;
        const kind = source && typeof source.kind === 'string' ? source.kind : '';
        if (kind === 'user' || kind === '') {
          entry.lastHumanAt = Math.max(entry.lastHumanAt, Number(event.time) || 0);
        }
      } else if (event.type === 'tool/call') {
        const name = event.data && event.data.name;
        if (name === 'ask_user_question') {
          entry.lastAskAt = Math.max(entry.lastAskAt, Number(event.time) || 0);
        }
      }
      askedState.set(id, entry);
    } catch {
      /* 观察失败不影响宿主 */
    }
  }

  /** 本次任务（最近一条人类消息之后）是否已经问过用户。 */
  function askedInCurrentTask(sessionId) {
    const entry = askedState.get(String(sessionId));
    if (!entry) return false;
    return entry.lastAskAt > entry.lastHumanAt;
  }

  function budgetRejection(root) {
    const status = budgetStatus.get(root);
    if (!status || !status.over) return undefined;
    const used = status.totals || {};
    return '预算已熔断：本次任务已经超过预算（步数 '
      + String(used.steps || 0) + ' / 输出 ' + String(used.output || 0)
      + '），宿主已中断超预算成员并拒绝继续派活。请在工作台调整或清除预算后再继续。';
  }

  /** 全局 guard：协作门禁 + 计划商讨的「禁止中途询问」+ 预算熔断。 */
  function guardExecution(execution) {
    try {
      const agent = execution && execution.agent;
      if (!agent) return undefined;
      const name = String(execution.name || '');
      const root = rootIdOf(agent);
      if (!root) return undefined;
      const mode = getMode(root);
      if (mode === 'council' && name === 'ask_user_question') {
        return '计划商讨模式禁止中途询问（GK协助工作台）：需要用户决定的内容请在《实施计划》里一次性写清，展示后等待用户确认；执行阶段直接做到验收。';
      }
      if (!COLLAB_SET.has(name)) return undefined;
      if (mode === 'off') {
        return '协作模式已关闭（GK协助工作台）：本会话只做单 agent 任务，不组队。要协作请先在工作台把「协作模式」切回询问、自动或计划商讨。';
      }
      if (mode === 'ask' && !askedInCurrentTask(root)) {
        return '协作模式=询问（GK协助工作台）：先用 ask_user_question 向用户确认是否开启协作（说明为什么需要、打算派几个 agent、各自负责什么）；用户同意后再调用协作工具。单 agent 能做完就不要问。';
      }
      return budgetRejection(root);
    } catch {
      return undefined;
    }
  }

  /** 重新计算一个根会话的预算状态；会中断超预算且仍在运行的成员。 */
  async function refreshBudget(rootId) {
    const state = getSessionState(rootId);
    if (!state.budget) {
      budgetStatus.delete(rootId);
      return undefined;
    }
    const agents = svc('agents');
    const leadAgent = safe(() => (agents && typeof agents.get === 'function' ? agents.get(rootId) : undefined), undefined);
    if (!leadAgent) {
      budgetStatus.delete(rootId);
      return undefined;
    }
    const agentTeams = svc('agentTeams');
    const sessions = svc('sessions');
    const scope = {
      sessions,
      agents,
      agentTeams,
      subagents: svc('subagents'),
    };
    const live = (id) => safe(() => (sessions && typeof sessions.get === 'function' ? sessions.get(id) : undefined), undefined);
    const family = await collectFamily(scope, rootId, rootId);
    const task = sessionTaskStart(rootId, live(rootId));
    const since = task.since;
    const members = [];
    for (const row of family.agents) {
      const measured = sessionUsageSince(row.id, live(row.id), since);
      const steps = measured.usage.steps;
      const output = measured.usage.output;
      const over = (state.budget.steps > 0 && steps > state.budget.steps)
        || (state.budget.output > 0 && output > state.budget.output);
      members.push({
        id: row.id,
        name: row.name,
        role: row.role,
        status: row.status,
        steps,
        output,
        cacheRead: measured.usage.cacheRead,
        over,
        interrupted: false,
      });
    }
    const totals = members.reduce((acc, row) => {
      acc.steps += row.steps;
      acc.output += row.output;
      acc.cacheRead += row.cacheRead;
      return acc;
    }, { steps: 0, output: 0, cacheRead: 0 });
    const over = members.some((row) => row.over);
    let interruptedCount = 0;
    for (const member of members) {
      if (member.role === 'lead' || !member.over || member.status !== 'running') continue;
      const key = rootId + '|' + member.name;
      const last = lastInterrupt.get(key) || 0;
      if (Date.now() - last < INTERRUPT_COOLDOWN_MS) {
        member.interrupted = true;
        interruptedCount += 1;
        continue;
      }
      try {
        if (agentTeams && typeof agentTeams.interrupt === 'function') {
          agentTeams.interrupt(leadAgent, member.name);
          lastInterrupt.set(key, Date.now());
          member.interrupted = true;
          interruptedCount += 1;
        }
      } catch {
        /* 成员可能刚好结束 */
      }
    }
    const status = {
      at: Date.now(),
      since,
      sinceSource: task.source,
      over,
      totals,
      members,
      interruptedCount,
      budget: state.budget,
    };
    budgetStatus.set(rootId, status);
    return status;
  }

  async function tick() {
    if (ticking) return;
    ticking = true;
    try {
      for (const rootId of budgetSessionIds()) {
        await refreshBudget(rootId);
      }
    } finally {
      ticking = false;
    }
  }

  /** 注册到宿主生命周期：一次全局 guard + 一次全局提示段 + 事件观察 + 预算定时器。 */
  function start() {
    if (started) return;
    started = true;

    const tools = svc('tools');
    if (tools && typeof tools.guard === 'function') {
      try {
        ctx.effect(() => tools.guard(guardExecution), 'agent-cockpit: coordination guard');
        guardInstalled = true;
      } catch {
        /* 服务不可用时静默降级 */
      }
    }

    const prompts = svc('systemPrompt');
    if (prompts && typeof prompts.section === 'function') {
      try {
        let order = 0;
        try {
          order = prompts.getSectionOrder('TEAM_POLICY') - 1;
        } catch {
          order = 0;
        }
        ctx.effect(() => prompts.section({
          name: SECTION_NAME,
          order,
          text: (context) => coordinationText(context && context.scope),
          interpolate: false,
        }), 'agent-cockpit: coordination prompt');
        promptInstalled = true;
      } catch {
        /* 服务不可用时静默降级 */
      }
    }

    ctx.on('session/event', (session, event) => noteSessionEvent(session, event));

    // 插件加载时已有的会话：把历史事件喂进 askedState（只关心最近人类消息与最近提问）
    const sessions = svc('sessions');
    const agents = svc('agents');
    for (const agent of safe(() => (agents && typeof agents.list === 'function' ? agents.list() : []), [])) {
      const session = safe(() => (sessions && typeof sessions.get === 'function' ? sessions.get(agent.id) : undefined), undefined);
      const events = session && typeof session.ownEvents === 'function' ? safe(() => session.ownEvents(), []) : [];
      for (const event of events) noteSessionEvent(session, event);
    }

    ctx.effect(() => {
      const timer = setInterval(() => {
        void tick();
      }, BUDGET_TICK_MS);
      void tick();
      return () => clearInterval(timer);
    }, 'agent-cockpit: budget breaker');
  }

  return {
    start,
    refreshBudget,
    statusOf(rootId) {
      return budgetStatus.get(String(rootId));
    },
    isCollaborationTool(name) {
      return COLLAB_SET.has(String(name));
    },
    debugInfo() {
      return {
        version: '1.7.0',
        started,
        guardInstalled,
        promptInstalled,
        sectionName: SECTION_NAME,
        askedState: Array.from(askedState.entries()).slice(0, 8).map(([id, entry]) => ({
          id,
          lastHumanAt: entry.lastHumanAt,
          lastAskAt: entry.lastAskAt,
          askedInTask: entry.lastAskAt > entry.lastHumanAt,
        })),
        budgetRoots: Array.from(budgetStatus.keys()),
      };
    },
  };
}
