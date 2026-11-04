/**
 * 客户端渲染冒烟（0.4.0：上下文页 / 编队页 / 洞察页）
 * Node 里伪造 window/document/React/module-loader/fetch，加载 client.js，
 * 调用每个 slot 注册组件；useState 对「loading 快照」返回可渲染的假数据，
 * 以便把「有数据」分支也跑一遍（不是只跑 loading 分支）。
 */
import { readFileSync } from 'node:fs';

const LEAD = 'session-lead0001';
const MATE = 'session-mate0001';

const numbers = {
  steps: 12, tools: 9, input: 200, output: 3400, cacheRead: 99000, cacheWrite: 0, reasoning: 0, errors: 0, agents: 2,
};

function genericAgent(index) {
  return {
    id: index === 0 ? LEAD : MATE,
    name: index === 0 ? 'lead' : 'game-core',
    role: index === 0 ? 'lead' : 'teammate',
    status: 'running',
    model: 'deepseek-flash',
    provider: 'deepseek-account',
    description: '负责核心模块',
    context: 'fresh',
    mode: 'continuable',
    parentId: index === 0 ? undefined : LEAD,
    current: index === 0,
    usage: { steps: 12 - index * 4, tools: 9, output: 3400, cacheRead: 99000 },
  };
}

const sample = { time: Date.now() - 30000, seq: 12, turn: 3, step: 4, input: 180, output: 450, cacheRead: 201000, cacheWrite: 0, reasoning: 0, model: 'deepseek-flash' };

const fakeData = new Proxy({}, {
  get(target, key) {
    switch (String(key)) {
      case 'agents': return [genericAgent(0), genericAgent(1)];
      case 'samples': return [sample, { ...sample, time: Date.now(), output: 900 }];
      case 'sessions': return [
        { id: LEAD, title: 'Grok', model: 'deepseek-flash', route: { model: 'deepseek-flash' }, mtime: Date.now() - 60000, usage: { ...numbers } },
        { id: MATE, title: '表现层', model: 'deepseek-flash', route: { model: 'deepseek-flash' }, mtime: Date.now() - 600000, usage: { ...numbers, steps: 146, output: 171547 } },
      ];
      case 'route': return { provider: 'deepseek-account', model: 'deepseek-flash', contextWindow: 1048576 };
      case 'title': return 'Grok';
      case 'total': return 380;
      case 'at': return Date.now();
      case 'rat1o':
      case 'ratio': return 34.25;
      case 'source': return 'disk';
      case 'totals': return { ...numbers };
      case 'usage': return { ...numbers };
      case 'lead': return LEAD;
      case 'current': return LEAD;
      default: return undefined;
    }
  },
});

let captured = null;
const styles = [];
globalThis.window = { __ModuleLoader__: { load(entry) { captured = entry; } } };

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
  const payload = target.indexOf('/agent-cockpit/insights') >= 0
    ? { at: Date.now(), sessions: fakeData.sessions }
    : target.indexOf('/agent-cockpit/context') >= 0
      ? { at: Date.now(), session: LEAD, source: 'disk', title: 'Grok', route: fakeData.route, total: 380, samples: fakeData.samples }
      : { at: Date.now(), lead: LEAD, current: LEAD, agents: fakeData.agents, totals: numbers, ratio: 34.25 };
  return { ok: true, status: 200, async json() { return payload; } };
};
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

function makeReact() {
  const h = (type, props, ...children) => ({ type, props: props || {}, children });
  return {
    createElement: h,
    useState(initial) {
      if (initial && typeof initial === 'object' && initial.phase === 'loading') {
        return [{ phase: 'ready', data: fakeData, error: null }, () => {}];
      }
      return [typeof initial === 'function' ? initial() : initial, () => {}];
    },
    useEffect(fn) {
      try { const cleanup = fn(); if (typeof cleanup === 'function') { /* 保留计时器语义，不实际清理 */ } } catch (err) { console.log('effect error:', err && err.message); }
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
console.log('exports:', Object.keys(moduleExports).join(','), '| inject:', JSON.stringify(moduleExports.inject));

const registrations = [];
let dicts = null;
const ctx = {
  locale: {
    register(ns, value) { dicts = value; },
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
console.log('DEBUG entries:', registrations.map((item) => {
  const entry = item.entry;
  return item.key + '|' + typeof entry + '|' + (entry && entry.options ? 'opts:' + entry.options.name : 'no-opts') + '|' + (entry && entry.options ? 'id:' + String(entry.options.id || entry.options.key) : '');
}).join(' ; '));

const t = (key) => key;
const team = {
  members: [
    { id: LEAD, name: 'lead', phase: 'active', model: 'deepseek-flash' },
    { id: MATE, name: 'game-core', phase: 'active', model: 'deepseek-flash' },
  ],
  tasks: [
    { id: 'task-1', subject: '核心引擎', status: 'in_progress', ownerName: 'game-core', ready: true, blockedBy: [], writeScopes: ['js/engine.js'] },
  ],
};
const useSessions = (selector) => selector({ phase: 'ready', byId: {}, projectionsBySession: { [LEAD]: { values: { agentTeam: team } } } });
const useSession = (selector) => selector(undefined);
const useSessionStatus = (selector) => selector({ get: () => undefined });
const useProjection = (key) => ({
  contextPressure: { pressureTokens: 198000, projectedTokens: 212000, contextWindow: 1048576 },
  contextBreakdown: { systemTokens: 12000, toolsTokens: 34000, messageTokens: 150000 },
  tokenUsage: { uncachedInputTokens: 250000, outputTokens: 680000, cacheReadTokens: 56000000, cacheWriteTokens: 0 },
}[key]);

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

const props = {
  sessionId: LEAD, t, useSessions, useSession, useSessionStatus, useProjection,
  openMember() {}, openView() {}, refresh() {}, openSession() {},
};

let failures = 0;
for (const { key, entry } of registrations) {
  const name = entry.options.name + ':' + (entry.options.id || entry.options.key || '');
  try {
    const tree = entry.component(props);
    const { classes, text } = collect(tree);
    console.log('·', name, '| key', key);
    console.log('   classes:', classes.slice(0, 12).join(' '));
    console.log('   text:', text.slice(0, 240));
    if (!text && entry.options.name !== 'sidebar.panellist') { console.log('   WARN: rendered no text'); failures += 1; }
  } catch (err) {
    failures += 1;
    console.log('·', name, 'THREW:', err && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : err);
  }
}

console.log('locale keys zh/en:', dicts ? Object.keys(dicts.zh).length + '/' + Object.keys(dicts.en).length : 'missing');
const missing = dicts ? Object.keys(dicts.zh).filter((key) => !(key in dicts.en)) : [];
console.log('zh keys missing in en:', missing.length ? missing.join(',') : 'none');
console.log('style tags injected:', styles.length);
console.log('registrations:', registrations.map((item) => {
  const options = (item.entry && item.entry.options) || {};
  return String(options.name || '?') + ':' + String(options.id || options.key || '?');
}).join(', '));
console.log(failures === 0 ? 'SMOKE OK' : 'SMOKE FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
