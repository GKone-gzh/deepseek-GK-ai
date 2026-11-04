/**
 * v0.6 客户端渲染冒烟：活跃度分层 / 关键路径 / 写范围冲突 / 预算。
 * 复用 client-smoke2 的伪造环境，但给：
 *   - 1 个运行中 + 2 个空闲成员（验证空闲折叠与统计）
 *   - 一条 3 环依赖链（验证关键路径）
 *   - 两个不同 owner 写同一文件（验证写范围冲突）
 *   - localStorage 预算（验证超预算提示）
 */
import { readFileSync } from 'node:fs';

const LEAD = 'session-lead0001';
const MATE1 = 'session-mate0001';
const MATE2 = 'session-mate0002';

const agent = (id, name, status, role, steps, output, agoMs) => ({
  id,
  name,
  role,
  status,
  model: 'deepseek-flash',
  description: name === 'lead' ? '负责集成与验收' : '负责模块 ' + name,
  mode: 'continuable',
  parentId: id === LEAD ? '' : LEAD,
  current: id === LEAD,
  usage: { steps, tools: 9, input: 200, output, cacheRead: output * 20, cacheWrite: 0, reasoning: 0, errors: 0 },
  mtime: Date.now() - agoMs,
});

const agents = [
  agent(LEAD, 'lead', 'inactive', 'lead', 40, 60000, 30 * 60000),
  agent(MATE1, 'game-core', 'running', 'teammate', 36, 79513, 60 * 1000),
  agent(MATE2, 'game-qa', 'inactive', 'teammate', 18, 88233, 120 * 60000),
];

const tasks = [
  { id: 'task-1', subject: '核心引擎', status: 'completed', ownerName: 'game-core', ready: true, blockedBy: [], writeScopes: ['js/engine.js'], writeScopeWarnings: [] },
  { id: 'task-2', subject: '系统层', status: 'in_progress', ownerName: 'game-core', ready: true, blockedBy: ['task-1'], writeScopes: ['js/systems.js'], writeScopeWarnings: [] },
  { id: 'task-3', subject: '验收报告', status: 'pending', ownerName: 'game-qa', ready: false, blockedBy: ['task-2'], writeScopes: ['test/report.md'], writeScopeWarnings: [] },
  { id: 'task-4', subject: '配置文件', status: 'pending', ownerName: '', ready: true, blockedBy: [], writeScopes: ['src/x.js'], writeScopeWarnings: [] },
  { id: 'task-5', subject: '另一份配置', status: 'in_progress', ownerName: 'game-core', ready: true, blockedBy: [], writeScopes: ['src/x.js'], writeScopeWarnings: [] },
];

const totals = agents.reduce((acc, row) => {
  for (const key of ['steps', 'tools', 'input', 'output', 'cacheRead', 'cacheWrite']) acc[key] += row.usage[key];
  return acc;
}, { steps: 0, tools: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, errors: 0 });

const family = {
  at: Date.now(),
  lead: LEAD,
  current: LEAD,
  agents,
  totals: { ...totals, agents: agents.length },
  ratio: 30.5,
  running: 1,
  idle: 2,
  lastActive: Date.now() - 60 * 1000,
  source: 'live',
};

let captured = null;
const styles = [];
globalThis.window = { __ModuleLoader__: { load(entry) { captured = entry; } } };
const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};
store.set('agent-cockpit:budget:' + LEAD, JSON.stringify({ steps: 20, output: 1000 }));

function makeElement(tag) {
  return {
    tagName: tag, attrs: {}, children: [], textContent: '',
    setAttribute(name, value) { this.attrs[name] = value; },
    appendChild(child) { this.children.push(child); },
    remove() {},
  };
}
globalThis.document = {
  head: { appendChild() {}, removeChild() {} },
  createElement(tag) { const el = makeElement(tag); styles.push(el); return el; },
};
globalThis.fetch = async (url) => {
  const target = String(url);
  const payload = target.indexOf('/agent-cockpit/family') >= 0
    ? family
    : { at: Date.now(), lead: LEAD, current: LEAD, agents, totals, ratio: 30.5 };
  return { ok: true, status: 200, async json() { return payload; } };
};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

function makeReact() {
  const h = (type, props, ...children) => ({ type, props: props || {}, children });
  return {
    createElement: h,
    useState(initial) {
      const value = typeof initial === 'function' ? initial() : initial;
      if (value && typeof value === 'object' && value.phase === 'loading') {
        // useCockpitState（协作模式/预算）
        if ('doctor' in value) {
          return [{
            phase: 'ready',
            doctor: {
              version: 'test', status: 'pending', profile: 'desktop',
              scannedAt: Date.now(),
              conflicts: [
                { code: 'duplicate-context', severity: 'high', title: '检测到独立安装的 dsh-context', detail: '重复引擎', fixable: true },
              ],
              conversationId: 'session-gk-doctor0001',
            },
            result: null,
            busy: false,
          }, () => {}];
        }
        if ('mode' in value) {
          return [{
            phase: 'ready',
            mode: 'off',
            budget: { steps: 20, output: 1000 },
            archived: [MATE2],
            status: { over: true, interruptedCount: 1, since: Date.now() - 120000, totals: { steps: 44, output: 2600 } },
          }, () => {}];
        }
        // useFamilySnapshot 的初始值带 error 字段；useTaskCost 只有 data
        if ('error' in value) {
          return [{ phase: 'ready', data: family, error: null }, () => {}];
        }
        // useTaskCost
        if ('data' in value) {
          return [{
            phase: 'ready',
            data: {
              at: Date.now(),
              lead: LEAD,
              since: Date.now() - 120000,
              sinceSource: 'user-message',
              totals: { steps: 9, tools: 12, input: 900, output: 4000, cacheRead: 80000 },
              ratio: 20,
              agents: [],
            },
          }, () => {}];
        }
        return [{ phase: 'ready', data: family, error: null }, () => {}];
      }
      return [value, () => {}];
    },
    useEffect(fn) {
      try { const cleanup = fn(); if (typeof cleanup === 'function') { /* 不清理 */ } } catch (err) { console.log('effect error:', err && err.message); }
    },
    useMemo(fn) { return fn(); },
    useRef(value) { return { current: value }; },
  };
}

const react = makeReact();
const requireStub = (name) => {
  if (name === 'react') return react;
  if (name === 'react-dom') return { createPortal: (node) => node };
  throw new Error('unexpected require: ' + name);
};

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
new Function('window', 'document', 'fetch', source)(globalThis.window, globalThis.document, globalThis.fetch);

const moduleExports = captured.factory(requireStub);
const registrations = [];
const ctx = {
  locale: {
    register(ns, value) { /* dictionaries */ },
    bind() { return (key) => key; },
    getLocale() { return 'zh'; },
  },
  effect(fn) { return fn(); },
  slots: {
    inject(key, register) { registrations.push({ key, entry: register() }); },
    register(options, component) { return { options, component }; },
  },
  sessions: { binding() { return undefined; }, refreshProjections() {} },
  uiWorkspace: { openSession() {} },
};
moduleExports.apply(ctx);

const t = (key) => key;
const team = {
  members: [
    { id: LEAD, name: 'lead', role: 'lead', phase: 'active' },
    { id: MATE1, name: 'game-core', role: 'teammate', phase: 'active' },
    { id: MATE2, name: 'game-qa', role: 'teammate', phase: 'inactive' },
  ],
  tasks,
};
const useSessions = (selector) => selector({ phase: 'ready', byId: { [MATE1]: { running: true } }, projectionsBySession: { [LEAD]: { values: { agentTeam: team } } } });
const useSession = (selector) => selector(undefined);
const useSessionStatus = (selector) => selector({ get: () => undefined });
const useProjection = () => undefined;

const props = {
  sessionId: LEAD, t, useSessions, useSession, useSessionStatus, useProjection,
  openMember() {}, openView() {}, refresh() {}, openSession() {},
};

function walk(node, visit) {
  if (node === null || node === undefined || node === false) return;
  if (typeof node !== 'object') { visit(node); return; }
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return; }
  if (typeof node.type === 'function') {
    const nested = node.type({ ...node.props, children: node.children });
    walk(nested, visit);
    return;
  }
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

function collect(tree) {
  const classes = new Set();
  const texts = [];
  walk(tree, (node) => {
    if (typeof node === 'string') { texts.push(node); return; }
    if (!node || typeof node !== 'object') return;
    if (node.props && typeof node.props.className === 'string') classes.add(node.props.className);
  });
  return { classes: Array.from(classes), text: texts.join(' ').replace(/\s+/g, ' ').trim() };
}

let failures = 0;
const expect = (condition, message) => {
  if (!condition) { failures += 1; console.log('FAIL:', message); }
  else console.log('ok:', message);
};

for (const { key, entry } of registrations) {
  const name = entry.options.name + ':' + (entry.options.id || '');
  try {
    const { classes, text } = collect(entry.component(props));
    console.log('·', name, '| classes', classes.length, '| text', text.slice(0, 120));
    if (key === 'conversation.view') {
      expect(classes.indexOf('acp_onboard') < 0, '团队存在时不显示空状态');
      expect(text.indexOf('2 statusIdleGroup') >= 0 || text.indexOf('statusIdleGroup (2)') >= 0, '空闲成员数量出现');
      expect(text.indexOf('task-3') >= 0 || text.indexOf('验收报告') >= 0, '分工计划列出任务');
      expect(text.indexOf('criticalBadge') >= 0, '关键路径徽章出现');
      expect(text.indexOf('planConflict') >= 0, '写范围冲突出现');
      expect(text.indexOf('1 budgetOver') >= 0 || text.indexOf('budgetOver') >= 0, '超预算提示出现');
      expect(text.indexOf('colEff') >= 0, '效率表出现');
      expect(text.indexOf('game-qa') >= 0, '空闲成员出现在统计/分工里');
      expect(text.indexOf('modeOff') >= 0 || text.indexOf('modeAuto') >= 0, '协作模式按钮出现');
      expect(text.indexOf('taskCost') >= 0 && text.indexOf('taskCostHint') >= 0, '本次任务成本区块出现');
      expect(classes.join(' ').indexOf('acp_modeDot') >= 0, '协作模式状态点渲染');
      expect(text.indexOf('interruptedMembers') >= 0, '预算熔断中断提示出现');
      expect(text.indexOf('archivedGroup') >= 0, '已归档分组出现');
      expect(text.indexOf('archiveIdle') >= 0, '归档空闲成员按钮出现');
      expect(text.indexOf('restoreArchived') >= 0, '恢复归档按钮出现');
      expect(text.indexOf('doctorTitle') >= 0, '插件冲突弹窗出现');
      expect(text.indexOf('doctorFix') >= 0 && text.indexOf('doctorOptout') >= 0, '冲突弹窗含修复/停用按钮');
      expect(text.indexOf('doctorOpenConversation') >= 0, '冲突弹窗含打开说明对话');
    }
    if (key === 'conversation.input.dock') {
      expect(text.indexOf('1 statusRunning') >= 0, '徽章只显示运行中的数量');
    }
  } catch (err) {
    failures += 1;
    console.log('·', name, 'THREW:', err && err.stack ? err.stack.split('\n').slice(0, 5).join(' | ') : err);
  }
}

// 无团队时徽章应完全隐藏
const badgeEntry = registrations.filter((item) => item.key === 'conversation.input.dock')[0];
const emptyTeam = { members: [{ id: LEAD, name: 'lead', role: 'lead', phase: 'active' }], tasks: [] };
const emptyUseSessions = (selector) => selector({ phase: 'ready', byId: {}, projectionsBySession: { [LEAD]: { values: { agentTeam: emptyTeam } } } });
const emptyTree = badgeEntry.entry.component({ ...props, useSessions: emptyUseSessions });
expect(emptyTree === null || emptyTree === undefined, '无团队时徽章返回 null');

console.log(failures === 0 ? 'SMOKE3 OK' : 'SMOKE3 FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
