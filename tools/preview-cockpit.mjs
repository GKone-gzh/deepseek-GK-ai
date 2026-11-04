/**
 * 把 GK协助工作台的 React 树渲染成静态 HTML，用于截图检查视觉。
 * 复用 client-smoke3 的伪造环境；不依赖真实 DSH。
 *
 * 用法：node preview-cockpit.mjs [light|dark]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const theme = process.argv[2] === 'dark' ? 'dark' : 'light';
const mode = process.argv[3] === 'empty' ? 'empty' : process.argv[3] === 'doctor' ? 'doctor' : 'team';
const LEAD = 'session-lead0001';
const MATE1 = 'session-mate0001';
const MATE2 = 'session-mate0002';
const MATE3 = 'session-mate0003';

const agent = (id, name, status, role, steps, output, cacheRead, agoMs, parentId) => ({
  id,
  name,
  role,
  status,
  model: 'deepseek-flash',
  description: role === 'lead' ? '负责集成、验收与对外汇报' : '负责 ' + name + ' 模块的实现与自测',
  mode: 'continuable',
  parentId: parentId || '',
  current: id === LEAD,
  usage: { steps, tools: Math.round(steps * 1.1), input: 40000, output, cacheRead, cacheWrite: 0, reasoning: 0, errors: 0 },
  mtime: Date.now() - agoMs,
});

const agents = mode === 'empty' ? [
  agent(LEAD, 'lead', 'inactive', 'lead', 66, 93480, 12400000, 40 * 60000),
] : [
  agent(LEAD, 'lead', 'inactive', 'lead', 66, 93480, 12400000, 40 * 60000),
  agent(MATE1, 'game-core', 'running', 'teammate', 36, 79513, 1925888, 60 * 1000),
  agent(MATE2, 'game-presentation', 'inactive', 'teammate', 146, 171547, 12340352, 180 * 60000),
  agent(MATE3, 'game-qa', 'inactive', 'subagent', 18, 88233, 1104768, 240 * 60000, MATE1),
];

const tasks = mode === 'empty' ? [] : [
  { id: 'task-1', subject: '核心引擎与循环', status: 'completed', ownerName: 'game-core', ready: true, blockedBy: [], writeScopes: ['js/engine.js'], writeScopeWarnings: [] },
  { id: 'task-2', subject: '系统层（武器 / 敌人 / 分数）', status: 'in_progress', ownerName: 'game-core', ready: true, blockedBy: ['task-1'], writeScopes: ['js/systems.js'], writeScopeWarnings: [] },
  { id: 'task-3', subject: '表现层：粒子与震屏', status: 'in_progress', ownerName: 'game-presentation', ready: true, blockedBy: ['task-1'], writeScopes: ['js/fx.js'], writeScopeWarnings: [] },
  { id: 'task-4', subject: '集成验收与 34 项断言', status: 'pending', ownerName: 'game-qa', ready: false, blockedBy: ['task-2', 'task-3'], writeScopes: ['test/harness.mjs'], writeScopeWarnings: [] },
  { id: 'task-5', subject: 'README 与操作说明', status: 'pending', ownerName: '', ready: true, blockedBy: [], writeScopes: ['README.md'], writeScopeWarnings: [] },
  { id: 'task-6', subject: '排行榜与设置面板', status: 'pending', ownerName: 'game-presentation', ready: true, blockedBy: [], writeScopes: ['js/ui.js'], writeScopeWarnings: [] },
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
  idle: 3,
  lastActive: Date.now() - 60 * 1000,
  source: 'live',
};

let captured = null;
globalThis.window = { __ModuleLoader__: { load(entry) { captured = entry; } } };
const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};
store.set('agent-cockpit:budget:' + LEAD, JSON.stringify({ steps: 120, output: 150000 }));

const styles = [];
function makeElement(tag) {
  return {
    tagName: tag, attrs: {}, textContent: '',
    setAttribute(name, value) { this.attrs[name] = value; },
    appendChild() {}, remove() {},
  };
}
globalThis.document = {
  head: { appendChild() {}, removeChild() {} },
  createElement(tag) { const el = makeElement(tag); styles.push(el); return el; },
};
globalThis.fetch = async () => ({ ok: true, status: 200, async json() { return family; } });
globalThis.setInterval = () => 0;
globalThis.clearInterval = () => {};

function makeReact() {
  const h = (type, props, ...children) => ({ type, props: props || {}, children });
  return {
    createElement: h,
    useState(initial) {
      const value = typeof initial === 'function' ? initial() : initial;
      if (value && typeof value === 'object' && value.phase === 'loading') {
        if ('doctor' in value) {
          if (mode !== 'doctor') return [{ phase: 'ready', doctor: null, result: null, busy: false }, () => {}];
          return [{
            phase: 'ready',
            result: null,
            busy: false,
            doctor: {
              version: '1.2.0', status: 'pending', profile: 'desktop', scannedAt: Date.now(),
              conversationsId: 'session-gk-doctor0001', conversationId: 'session-gk-doctor0001',
              conflicts: [
                { code: 'duplicate-context', severity: 'high', title: '检测到独立安装的 dsh-context', detail: '本插件已内置同一套上下文分析引擎，两者会重复注册上下文页与 /context。', fixable: true },
                { code: 'duplicate-team-tools', severity: 'medium', title: '检测到多个团队工具提供者', detail: '两个 bundle 都插入了 agent-team/tool-agent-team 行，spawn_teammate 可能注册失败。', fixable: false },
              ],
            },
          }, () => {}];
        }
        if ('mode' in value) {
          return [{
            phase: 'ready',
            mode: 'ask',
            budget: { steps: 120, output: 150000 },
            archived: ['session-mate0002'],
            status: { over: true, interruptedCount: 1, since: Date.now() - 60000, totals: { steps: 66, output: 430000 } },
          }, () => {}];
        }
        if ('error' in value) {
          return [{ phase: 'ready', data: family, error: null }, () => {}];
        }
        if ('data' in value) {
          return [{
            phase: 'ready',
            data: {
              at: Date.now(),
              lead: LEAD,
              since: Date.now() - 60000,
              sinceSource: 'user-message',
              totals: { steps: 66, tools: 78, input: 42000, output: 430000, cacheRead: 27700000 },
              ratio: 30.2,
              agents: [],
            },
          }, () => {}];
        }
        return [{ phase: 'ready', data: family, error: null }, () => {}];
      }
      return [value, () => {}];
    },
    useEffect(fn) {
      try { const cleanup = fn(); if (typeof cleanup === 'function') { /* noop */ } } catch (err) { console.log('effect error:', err && err.message); }
    },
    useMemo(fn) { return fn(); },
    useRef(value) { return { current: value }; },
  };
}

const react = makeReact();
const requireStub = (name) => {
  if (name === 'react') return react;
  throw new Error('unexpected require: ' + name);
};

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const sourcePath = join(repoRoot, 'packages', 'dsh-agent-cockpit', 'client.js');
const outDir = join(repoRoot, '.preview');
mkdirSync(outDir, { recursive: true });
const source = readFileSync(sourcePath, 'utf8');
new Function('window', 'document', 'fetch', source)(globalThis.window, globalThis.document, globalThis.fetch);
const moduleExports = captured.factory(requireStub);

const registrations = [];
const ctx = {
  locale: {
    register() {},
    bind() { return (key) => key; },
    getLocale() { return theme === 'dark' ? 'zh' : 'zh'; },
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

const dictSource = source.slice(source.indexOf('const zh = {'), source.indexOf('const en = {'));
const zh = new Function(dictSource + '; return zh;')();

const team = {
  members: mode === 'empty' ? [
    { id: LEAD, name: 'lead', role: 'lead', phase: 'active' },
  ] : [
    { id: LEAD, name: 'lead', role: 'lead', phase: 'active' },
    { id: MATE1, name: 'game-core', role: 'teammate', phase: 'active' },
    { id: MATE2, name: 'game-presentation', role: 'teammate', phase: 'inactive' },
    { id: MATE3, name: 'game-qa', role: 'teammate', phase: 'inactive' },
  ],
  tasks,
};
const useSessions = (selector) => selector({
  phase: 'ready',
  byId: { [MATE1]: { running: true } },
  projectionsBySession: { [LEAD]: { values: { agentTeam: team } } },
});
const useSession = (selector) => selector(undefined);
const useSessionStatus = (selector) => selector({ get: () => undefined });
const useProjection = () => undefined;
const t = (key) => (zh[key] !== undefined ? zh[key] : key);
const props = {
  sessionId: LEAD, t, useSessions, useSession, useSessionStatus, useProjection,
  openMember() {}, openView() {}, refresh() {}, openSession() {},
};

function walk(node, visit) {
  if (node === null || node === undefined || node === false || node === true) return;
  if (typeof node !== 'object') { visit(node); return; }
  if (Array.isArray(node)) { for (const child of node) walk(child, visit); return; }
  if (typeof node.type === 'function') {
    walk(node.type({ ...node.props, children: node.children }), visit);
    return;
  }
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

const cockpit = registrations.filter((item) => item.key === 'conversation.view')[0];
const tree = cockpit.entry.component(props);

const escape = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const BOOL_ATTRS = new Set(['disabled']);
const SKIP_ATTRS = new Set(['key', 'children', 'onClick', 'onChange', 'onFocus', 'onBlur', 'onKeyDown', 'ref', 'value']);

function attrsOf(propsArg) {
  const parts = [];
  for (const [name, value] of Object.entries(propsArg || {})) {
    if (SKIP_ATTRS.has(name) || value === undefined || value === null || typeof value === 'function') continue;
    if (BOOL_ATTRS.has(name)) { if (value) parts.push(name); continue; }
    if (name === 'style') {
      if (typeof value !== 'object') continue;
      const css = Object.entries(value).map(([k, v]) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + ':' + v).join(';');
      if (css) parts.push('style="' + escape(css) + '"');
      continue;
    }
    const attrName = name === 'className' ? 'class' : name === 'htmlFor' ? 'for' : name;
    parts.push(attrName + '="' + escape(value) + '"');
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}
function html(node) {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (typeof node !== 'object') return escape(node);
  if (Array.isArray(node)) return node.map(html).join('');
  if (typeof node.type === 'function') return html(node.type({ ...node.props, children: node.children }));
  const tag = node.type;
  const inner = (node.children || []).map(html).join('');
  return '<' + tag + attrsOf(node.props) + '>' + inner + '</' + tag + '>';
}

// 取出 client.js 里的 CSS 模板
const cssStart = source.indexOf('const CSS = `') + 'const CSS = `'.length;
const cssEnd = source.indexOf('`;', cssStart);
const clientCss = source.slice(cssStart, cssEnd);

const themeCss = theme === 'dark'
  ? `
:root{color-scheme:dark}
:root{
--dsw-alias-bg-base:#151517;--dsw-alias-bg-layer-1:#1b1b1c;--dsw-alias-bg-layer-2:#232324;--dsw-alias-bg-layer-3:#2c2c2e;
--dsw-alias-label-primary:#f5f5f5;--dsw-alias-label-secondary:#adb2b8;--dsw-alias-label-tertiary:#979da6;--dsw-alias-label-caption:#81858c;
--dsw-alias-border-l1:#ffffff14;--dsw-alias-border-l2:#ffffff24;--dsw-alias-border-l3:#ffffff2e;--dsw-alias-border-l4:#ffffff3d;
--dsw-alias-state-success-primary:#4ed17e;--dsw-alias-state-warn-primary:#f7ad31;--dsw-alias-state-error-primary:#f25a5a;
--dsw-alias-interactive-bg-hover:#ffffff14;--dsw-alias-bg-mask-1:#0000007a;--dsw-alias-markdown-tag:#ffffff14;
--dsw-alias-link:#7aaaff;--dsw-alias-scrollbar-bg-l1:#ffffff1f;--dsw-alias-scrollbar-bg-l2:#ffffff1f;
}`
  : `
:root{
--dsw-alias-bg-base:#ffffff;--dsw-alias-bg-layer-1:#ffffff;--dsw-alias-bg-layer-2:#ffffff;--dsw-alias-bg-layer-3:#ffffff;
--dsw-alias-label-primary:#0f1115;--dsw-alias-label-secondary:#61666b;--dsw-alias-label-tertiary:#81858c;--dsw-alias-label-caption:#adb2b8;
--dsw-alias-border-l1:#0000000f;--dsw-alias-border-l2:#0000001a;--dsw-alias-border-l3:#0000001f;--dsw-alias-border-l4:#00000029;
--dsw-alias-state-success-primary:#22c55e;--dsw-alias-state-warn-primary:#f59e0b;--dsw-alias-state-error-primary:#ec1313;
--dsw-alias-interactive-bg-hover:#2631480f;--dsw-alias-bg-mask-1:#0000003d;--dsw-alias-markdown-tag:#f1f3f5;
--dsw-alias-link:#4176e6;--dsw-alias-scrollbar-bg-l1:#e5e5e5;--dsw-alias-scrollbar-bg-l2:#e5e5e5;
--dsw-radius-sm:6px;--dsw-radius-md:8px;--dsw-radius-lg:12px;
--dsw-font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
}`;

const out = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>GK协助工作台 preview</title>
<style>
${themeCss}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:var(--dsw-font-family);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
#stage{width:1180px;min-height:920px;margin:0 auto;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;overflow:hidden;display:flex}
#stage>.acp_root{flex:1 1 auto;min-width:0;height:auto}
#stage .acp_body{overflow:visible}
${clientCss}
</style></head>
<body><div id="stage" data-theme="${theme}">${html(tree)}</div></body></html>`;

writeFileSync(join(outDir, 'cockpit-preview-' + mode + '-' + theme + '.html'), out, 'utf8');
console.log('wrote ' + join(outDir, 'cockpit-preview-' + mode + '-' + theme + '.html'), out.length, 'chars');
