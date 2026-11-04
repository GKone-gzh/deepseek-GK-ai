/**
 * host/coordination.js 单测（v1.1.1 全局注册版）：
 * 全局 guard / 全局系统提示段 / ask 模式询问门禁 / 预算熔断中断。
 * 用假 ctx + 假 services，不碰真实 DSH 运行时。
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'gk-coord-'));
process.env.GK_COCKPIT_STATE = join(dir, 'state.json');

const { createCoordinator } = await import('../host/coordination.js');
const state = await import('../host/state.js');

let failures = 0;
const expect = (ok, message) => {
  if (ok) console.log('ok:', message);
  else {
    failures += 1;
    console.log('FAIL:', message);
  }
};

/* ── 假会话事件 ── */
const userMsg = (time) => ({ type: 'user/message', time, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '做点东西' }] } });
const step = (time) => ({ type: 'step/start', time, data: {} });
const assistant = (time, output) => ({
  type: 'assistant/message',
  time,
  data: { usage: { inputTokens: 10, outputTokens: output, cacheReadTokens: output * 10 }, message: { source: { model: 'deepseek-flash' } } },
});

const leadEvents = [userMsg(1000), step(1100), assistant(1200, 200)];
const workerEvents = [step(1500), assistant(1600, 500), step(1700)];
const liveSessions = new Map([
  ['lead-1', { id: 'lead-1', header: { cwd: 'D:/x' }, ownEvents: () => leadEvents }],
  ['worker-1', { id: 'worker-1', header: {}, ownEvents: () => workerEvents }],
]);
const agentOf = (id) => (id === 'lead-1' ? { id: 'lead-1' } : id === 'worker-1' ? { id: 'worker-1' } : undefined);

/* ── 假 services：全局 guard / 全局 section ── */
const guards = [];
const sections = [];
const interrupts = [];
const services = {
  tools: {
    guard(fn) { guards.push(fn); return () => { /* dispose */ }; },
  },
  systemPrompt: {
    getSectionOrder() { return 100; },
    section(section) { sections.push(section); return () => { /* dispose */ }; },
  },
  agents: {
    list: () => [agentOf('lead-1'), agentOf('worker-1')],
    get: (id) => agentOf(id),
  },
  agentTeams: {
    tryMembership: (agent) => (agent && (agent.id === 'lead-1' || agent.id === 'worker-1') ? { root: { id: 'lead-1' }, role: agent.id === 'lead-1' ? 'lead' : 'teammate' } : undefined),
    listMembers: () => [
      { id: 'lead-1', name: 'lead', role: 'lead', status: 'running' },
      { id: 'worker-1', name: 'worker', role: 'teammate', status: 'running' },
    ],
    interrupt: (caller, target) => { interrupts.push([caller.id, target]); return { previousStatus: 'running' }; },
  },
  subagents: {
    listDescendants: () => Promise.resolve([]),
    listChildren: () => Promise.resolve([]),
  },
  sessions: {
    get: (id) => liveSessions.get(id),
  },
};
const eventHandlers = new Map();
const effects = [];
const ctx = {
  get: (name) => services[name],
  on: (event, handler) => { eventHandlers.set(event, handler); },
  effect: (fn) => { effects.push(fn()); },
};

/* ── 启动：全局注册一次 ── */
state.setSessionState('lead-1', { mode: 'off', budget: null });
const coordinator = createCoordinator(ctx);
coordinator.start();
expect(guards.length === 1, '全局只注册一个 guard');
expect(sections.length === 1, '全局只注册一个系统提示段');
const guard = guards[0];
const section = sections[0];
const leadScope = { id: 'lead-1' };
const textOf = () => section.text({ scope: leadScope });

/* ── 场景 A：off ── */
const denyOff = guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' });
expect(typeof denyOff === 'string' && denyOff.indexOf('协作模式已关闭') >= 0, 'mode=off 时 spawn_teammate 被拒绝');
expect(guard({ agent: agentOf('lead-1'), name: 'read' }) === undefined, 'mode=off 时普通工具不拦截');
expect(section.name === 'gk-cockpit:coordination:v2', '全局提示段名带 v2（避免旧 scoped 段遮蔽）');
expect(textOf().indexOf('协作模式已关闭') >= 0, 'mode=off 时注入单 agent 提示');

/* ── 场景 A2：ask（默认）先问再组队 ── */
state.setSessionState('lead-1', { mode: 'ask', budget: null });
expect(textOf().indexOf('ask_user_question') >= 0, 'ask 模式提示要求先询问用户');
const sessionEventHandler = eventHandlers.get('session/event');
expect(typeof sessionEventHandler === 'function', '注册了 session/event 观察器');
const denyAsk = guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' });
expect(typeof denyAsk === 'string' && denyAsk.indexOf('ask_user_question') >= 0, 'ask 模式：未询问前拒绝 spawn');
sessionEventHandler({ id: 'lead-1' }, userMsg(5000));
const denyAsk2 = guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' });
expect(typeof denyAsk2 === 'string' && denyAsk2.indexOf('ask_user_question') >= 0, 'ask 模式：新任务后仍需先问');
sessionEventHandler({ id: 'lead-1' }, { type: 'tool/call', time: 5100, data: { name: 'ask_user_question' } });
expect(guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' }) === undefined, 'ask 模式：问过用户后放行协作工具');
sessionEventHandler({ id: 'lead-1' }, userMsg(6000));
const denyAsk3 = guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' });
expect(typeof denyAsk3 === 'string' && denyAsk3.indexOf('ask_user_question') >= 0, 'ask 模式：下一条任务重新要求询问');

/* ── 场景 A3：council 计划商讨 ── */
state.setSessionState('lead-1', { mode: 'council' });
expect(textOf().indexOf('计划商讨') >= 0, 'council 模式注入两阶段提示');
const denyAskQuestion = guard({ agent: agentOf('lead-1'), name: 'ask_user_question' });
expect(typeof denyAskQuestion === 'string' && denyAskQuestion.indexOf('禁止中途询问') >= 0, 'council 模式禁止中途询问');
expect(guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' }) === undefined, 'council 模式允许组队商讨');
expect(guard({ agent: agentOf('lead-1'), name: 'read' }) === undefined, 'council 模式不拦普通工具');

/* ── 场景 B：auto ── */
state.setSessionState('lead-1', { mode: 'auto' });
expect(textOf() === '', 'mode=auto 时提示为空（动态生效）');
expect(guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' }) === undefined, 'mode=auto 时放行 spawn_teammate');

/* ── 场景 C：预算熔断 ── */
state.setSessionState('lead-1', { mode: 'auto', budget: { steps: 0, output: 100 } });
const status = await coordinator.refreshBudget('lead-1');
expect(status && status.over === true, '预算检查判定超预算');
expect(status.members.length === 2, '预算检查覆盖两名成员');
expect(status.totals.output >= 700, '本次任务输出按 since 累计');
expect(interrupts.length === 1 && interrupts[0][0] === 'lead-1' && interrupts[0][1] === 'worker', '超预算 running 成员被 interrupt');
expect(status.interruptedCount === 1, '中断计数=1');
const denyBudget = guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' });
expect(typeof denyBudget === 'string' && denyBudget.indexOf('预算已熔断') >= 0, '熔断后拒绝继续 spawn');
expect(guard({ agent: agentOf('lead-1'), name: 'read' }) === undefined, '熔断不拦普通工具');

/* ── 场景 D：清预算恢复；全局 guard 覆盖新 agent ── */
state.setSessionState('lead-1', { budget: null });
const cleared = await coordinator.refreshBudget('lead-1');
expect(cleared === undefined, '清预算后状态清空');
expect(guard({ agent: agentOf('lead-1'), name: 'spawn_teammate' }) === undefined, '清预算后恢复放行');
state.setSessionState('lead-1', { mode: 'off' });
const lateAgent = { id: 'late-1' };
expect(typeof guard({ agent: lateAgent, name: 'subagent' }) === 'string', '全局 guard 对未见过的新 agent 同样生效');

/* ── 场景 E：debugInfo 可用 ── */
const debug = coordinator.debugInfo();
expect(debug && debug.version && Array.isArray(debug.askedState), 'debugInfo 返回版本与询问状态');

for (const cleanup of effects) {
  if (typeof cleanup === 'function') cleanup();
}
rmSync(dir, { recursive: true, force: true });
console.log(failures === 0 ? 'COORDINATION TEST OK' : 'COORDINATION TEST FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
