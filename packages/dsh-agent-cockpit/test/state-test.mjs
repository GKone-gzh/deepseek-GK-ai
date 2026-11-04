/**
 * host/state.js 单测：默认值、归一化、持久化、缓存失效。
 * 用 GK_COCKPIT_STATE 指向临时文件，不碰真实 profile。
 */
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'gk-state-'));
process.env.GK_COCKPIT_STATE = join(dir, 'state.json');

const state = await import('../host/state.js');

let failures = 0;
const expect = (ok, message) => {
  if (ok) console.log('ok:', message);
  else {
    failures += 1;
    console.log('FAIL:', message);
  }
};

/* 1) 默认值 */
expect(state.getSessionState('session-aaaa').mode === 'ask', '默认模式 ask（先问用户）');
expect(state.getSessionState('session-aaaa').budget === null, '默认无预算');
expect(state.getSessionState('').mode === 'ask', '空会话返回默认 ask');

/* 2) 写入模式 + 预算 */
const saved = state.setSessionState('session-aaaa', { mode: 'off', budget: { steps: 50, output: 1000 } });
expect(saved.mode === 'off', 'mode 写入 off');
expect(saved.budget.steps === 50 && saved.budget.output === 1000, 'budget 写入');
const loaded = state.getSessionState('session-aaaa');
expect(loaded.mode === 'off', '重新读取 mode');
expect(loaded.budget.steps === 50, '重新读取 budget');

/* 3) 归一化：非法 mode 回 auto；预算 0/负数清空 */
state.setSessionState('session-bbbb', { mode: 'weird', budget: { steps: -1, output: 0 } });
const weird = state.getSessionState('session-bbbb');
expect(weird.mode === 'ask', '非法 mode 归一为默认 ask');
expect(weird.budget === null, '非法预算归一为 null');

/* 4) 部分更新：只改预算不动模式 */
state.setSessionState('session-aaaa', { budget: { steps: 80 } });
const partial = state.getSessionState('session-aaaa');
expect(partial.mode === 'off', '部分更新保留 mode');
expect(partial.budget.steps === 80 && partial.budget.output === 0, '部分更新预算');

/* 5) 磁盘确实是 JSON，且外部修改会被缓存失效读到 */
const raw = JSON.parse(readFileSync(process.env.GK_COCKPIT_STATE, 'utf8'));
expect(raw.sessions['session-aaaa'].mode === 'off', '文件内容正确');
raw.sessions['session-cccc'] = { mode: 'off', budget: null, updatedAt: Date.now() };
writeFileSync(process.env.GK_COCKPIT_STATE, JSON.stringify(raw, null, 2));
state.resetStateCache();
expect(state.getMode('session-cccc') === 'off', '外部写入可被读取');

/* 6) 清预算 */
state.setSessionState('session-aaaa', { budget: null });
expect(state.getSessionState('session-aaaa').budget === null, '清空预算');
expect(state.budgetSessionIds().length === 0, '预算会话列表为空');

/* 6b) 归档成员：合法 id 保留、非法过滤、去重；部分更新不丢归档 */
state.setSessionState('session-aaaa', { archived: ['session-mate0001', 'bad id', 'session-mate0001', ''] });
const archived = state.getSessionState('session-aaaa').archived;
expect(archived.length === 1 && archived[0] === 'session-mate0001', '归档 id 过滤非法/去重');
state.setSessionState('session-aaaa', { mode: 'auto' });
expect(state.getSessionState('session-aaaa').archived.length === 1, '改 mode 不影响归档');
state.setSessionState('session-aaaa', { archived: [] });
expect(state.getSessionState('session-aaaa').archived.length === 0, '清空归档');
expect(Array.isArray(state.getSessionState('session-zzzz').archived), '默认归档为空数组');

/* 7) 持久化到新 id */
state.setSessionState('session-dddd', { budget: { output: 5000 } });
expect(state.budgetSessionIds().indexOf('session-dddd') >= 0, '预算会话 id 可枚举');

rmSync(dir, { recursive: true, force: true });
console.log(failures === 0 ? 'STATE TEST OK' : 'STATE TEST FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
