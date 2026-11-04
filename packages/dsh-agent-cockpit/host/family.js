/**
 * 编队数据：把「本会话所属的 Agent 家族」摊平成卡片数据。
 *
 * 家族 = 主控（Lead）+ 团队队友 + 它们派生出来的子 Agent（一次性/多轮都算），
 * 每张卡片带上该会话的真实 token 用量（来自 host/usage.js 的会话日志汇总）。
 *
 * 只读：不写任何会话、不调 LLM。拿不到某个服务时返回空数组，由客户端回退到
 * 团队投影（agentTeam）里的成员列表。
 */
import { isSessionId, sessionUsage } from './usage.js';

function safe(fn, fallback) {
  try {
    const value = fn();
    return value === undefined ? fallback : value;
  } catch {
    return fallback;
  }
}

/**
 * 列表接口既可能是同步数组，也可能是 Promise（subagents.listDescendants /
 * listChildren 都是 async）。统一成 await 后的数组；任何同步异常或拒绝都吞成空数组，
 * 因为 DSH 会把未处理的 SessionQueryError 当致命错误（宿主直接退出）。
 */
async function settleList(run) {
  let value;
  try {
    value = run();
  } catch {
    return [];
  }
  if (value !== null && value !== undefined && typeof value.then === 'function') {
    try {
      value = await value;
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return typeof value === 'string' ? value : '';
}

function usageOf(sessions, id) {
  const live = safe(() => (sessions && typeof sessions.get === 'function' ? sessions.get(id) : undefined), undefined);
  const result = safe(() => sessionUsage(id, live), undefined);
  const usage = result && result.usage ? result.usage : undefined;
  return {
    usage: usage || { steps: 0, tools: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, errors: 0 },
    mtime: result && typeof result.mtime === 'number' ? result.mtime : undefined,
    source: result && result.source ? result.source : undefined,
  };
}

/**
 * @param {{sessions?: any, agents?: any, agentTeams?: any, subagents?: any}} scope
 * @param {string} leadId  主控会话 id（客户端已解析）
 * @param {string} currentId 当前会话 id（用于标出「当前」）
 */
export async function collectFamily(scope, leadId, currentId) {
  const sessions = scope ? scope.sessions : undefined;
  const agents = scope ? scope.agents : undefined;
  const agentTeams = scope ? scope.agentTeams : undefined;
  const subagents = scope ? scope.subagents : undefined;

  const lead = isSessionId(leadId) ? leadId : '';
  const rows = [];
  const seen = new Set();

  const add = (row) => {
    if (!row || !isSessionId(row.id) || seen.has(row.id)) return;
    seen.add(row.id);
    rows.push(row);
  };

  /* 1) 团队：主控 + 队友（agentTeams 给出名字、角色、状态、职责） */
  const leadAgent = lead ? safe(() => (agents && typeof agents.get === 'function' ? agents.get(lead) : undefined), undefined) : undefined;
  const members = safe(() => (leadAgent && agentTeams && typeof agentTeams.listMembers === 'function'
    ? agentTeams.listMembers(leadAgent)
    : []), []);
  for (const member of Array.isArray(members) ? members : []) {
    const id = text(member && member.id);
    if (!isSessionId(id)) continue;
    const measured = usageOf(sessions, id);
    add({
      id,
      name: text(member && member.name) || id.slice(0, 14),
      role: text(member && member.role) || (id === lead ? 'lead' : 'teammate'),
      status: text(member && member.status) || 'inactive',
      model: text(member && member.model),
      provider: text(member && member.provider),
      description: text(member && member.description),
      context: text(member && member.context),
      mode: 'continuable',
      parentId: id === lead ? '' : lead,
      current: id === currentId,
      usage: measured.usage,
      mtime: measured.mtime,
      usageSource: measured.source,
    });
  }

  /* 2) 子 Agent：主控的所有后代 + 各成员的直接子级（去重）
   *
   * 只能在「主控是活 agent」时向下查：subagents.listDescendants/ listChildren 对
   * 不存在的 session 会以 SessionQueryError 拒绝，而 DSH 把它当致命错误处理
   * （实测 /agent-cockpit/family?lead=nope 会让整个宿主退出）。这里既用
   * leadAgent 做前置门槛，也给可能返回 Promise 的调用挂上 catch，双重兜底。 */
  const descendants = await settleList(() => (
    leadAgent && subagents && typeof subagents.listDescendants === 'function'
      ? subagents.listDescendants(lead)
      : []
  ));
  const collectChild = (entry) => {
    if (entry === undefined || entry === null) return;
    const row = typeof entry === 'string' ? { id: entry } : entry;
    const id = text(row.id) || text(row.sessionId);
    if (!isSessionId(id) || seen.has(id)) return;
    const measured = usageOf(sessions, id);
    add({
      id,
      name: text(row.name) || text(row.label) || id.slice(0, 14),
      role: 'subagent',
      status: text(row.status) || '',
      model: text(row.model) || text(row.agentModel),
      provider: text(row.provider) || text(row.agentProvider),
      description: text(row.description) || text(row.persona),
      context: text(row.context) || text(row.mode),
      mode: text(row.mode) === 'continuable' ? 'continuable' : 'one-shot',
      parentId: text(row.parentId) || lead,
      current: id === currentId,
      usage: measured.usage,
      mtime: measured.mtime,
      usageSource: measured.source,
    });
  };
  for (const entry of Array.isArray(descendants) ? descendants : []) collectChild(entry);
  for (const row of rows.slice()) {
    if (row.role !== 'lead' && row.role !== 'teammate') continue;
    // 只对仍然活着的 agent 查子级；已回收的 session 会让 listChildren 拒绝。
    const live = safe(() => (agents && typeof agents.get === 'function' ? agents.get(row.id) : undefined), undefined);
    if (!live) continue;
    const children = await settleList(() => (subagents && typeof subagents.listChildren === 'function'
      ? subagents.listChildren(row.id)
      : []));
    for (const entry of children) collectChild(entry);
  }

  /* 3) 排序：主控 → 队友 → 子 Agent，同组内保持发现顺序 */
  const rank = { lead: 0, teammate: 1, subagent: 2 };
  rows.sort((a, b) => (rank[a.role] === undefined ? 9 : rank[a.role]) - (rank[b.role] === undefined ? 9 : rank[b.role]));

  const totals = { steps: 0, tools: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, errors: 0, agents: rows.length };
  let running = 0;
  let lastActive = 0;
  for (const row of rows) {
    for (const key of ['steps', 'tools', 'input', 'output', 'cacheRead', 'cacheWrite', 'reasoning', 'errors']) {
      totals[key] += Number(row.usage[key]) || 0;
    }
    const status = row.status === 'active' ? 'running' : row.status;
    if (status === 'running') running += 1;
    if (typeof row.mtime === 'number' && row.mtime > lastActive) lastActive = row.mtime;
  }
  const ratio = totals.input + totals.output > 0 ? totals.cacheRead / (totals.input + totals.output) : 0;

  return {
    at: Date.now(),
    lead,
    current: currentId || '',
    agents: rows,
    totals,
    ratio,
    running,
    idle: rows.length - running,
    lastActive: lastActive > 0 ? lastActive : undefined,
    source: rows.length > 0 ? 'live' : 'empty',
  };
}
