/**
 * GK协助工作台 v1.0.0 一键验收：宿主单测 + 客户端渲染冒烟 + 线上接口。
 *
 * 用法：
 *   node test/verify-all.mjs [guiUrl]
 * 默认 GUI：http://127.0.0.1:49866（可用 GK_GUI 环境变量覆盖）。
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const node = process.execPath;
const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, '\\');
const pluginRoot = join(here, '..');
const gui = process.argv[2] || process.env.GK_GUI || 'http://127.0.0.1:49866';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log((ok ? 'ok  ' : 'FAIL') + '  ' + name + (detail ? '  [' + detail + ']' : ''));
}

function runScript(name, file) {
  if (!existsSync(file)) {
    record(name, false, 'missing ' + file);
    return;
  }
  const child = spawnSync(node, [file], { cwd: pluginRoot, encoding: 'utf8', timeout: 120000 });
  const output = String(child.stdout || '') + String(child.stderr || '');
  const last = output.trim().split('\n').filter(Boolean).pop() || '';
  record(name, child.status === 0, last.slice(0, 120));
}

const unitTests = [
  ['state', join(pluginRoot, 'test', 'state-test.mjs')],
  ['usage-since', join(pluginRoot, 'test', 'usage-since-test.mjs')],
  ['coordination', join(pluginRoot, 'test', 'coordination-test.mjs')],
  ['client-smoke2', join(pluginRoot, 'test', 'client-smoke2.mjs')],
  ['client-smoke3', join(pluginRoot, 'test', 'client-smoke3.mjs')],
  ['doctor', join(pluginRoot, 'test', 'doctor-test.mjs')],
  ['doctor-conversation', join(pluginRoot, 'test', 'doctor-conversation-test.mjs')],
];
for (const [name, file] of unitTests) runScript(name, file);

async function getJson(url, init) {
  const response = await fetch(url, Object.assign({ signal: AbortSignal.timeout(20000) }, init));
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, json, text };
}

async function liveChecks() {
  let sessionId;
  try {
    const insights = await getJson(gui + '/agent-cockpit/insights?limit=1');
    sessionId = insights.json && insights.json.sessions && insights.json.sessions[0] ? insights.json.sessions[0].id : undefined;
    record('live: insights', insights.status === 200 && Array.isArray(insights.json.sessions), 'sessions=' + (insights.json && insights.json.sessions ? insights.json.sessions.length : '?'));
  } catch (error) {
    record('live: insights', false, String(error && error.message ? error.message : error));
  }

  try {
    const doctor = await getJson(gui + '/agent-cockpit/doctor');
    record('live: doctor', doctor.status === 200 && doctor.json && doctor.json.doctor && ['clean', 'pending', 'dismissed', 'fix-applied', 'opted-out'].indexOf(doctor.json.doctor.status) >= 0, 'status=' + (doctor.json && doctor.json.doctor ? doctor.json.doctor.status : '?'));
    const state = await getJson(gui + '/agent-cockpit/state?session=session-e2e000001');
    record('live: state GET', state.status === 200 && state.json && ['auto', 'ask', 'off'].indexOf(state.json.mode) >= 0 && Array.isArray(state.json.archived), 'mode=' + (state.json && state.json.mode));
  } catch (error) {
    record('live: state GET', false, String(error && error.message ? error.message : error));
  }

  try {
    const post = await getJson(gui + '/agent-cockpit/state', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session: 'session-e2e000001', mode: 'auto', budget: null, archived: ['session-e2e000002'] }),
    });
    const state = post.json || {};
    record('live: state POST', post.status === 200 && state.mode === 'auto' && Array.isArray(state.archived) && state.archived.length === 1, 'archived=' + JSON.stringify(state.archived));
  } catch (error) {
    record('live: state POST', false, String(error && error.message ? error.message : error));
  }

  if (sessionId) {
    try {
      const family = await getJson(gui + '/agent-cockpit/family?lead=' + encodeURIComponent(sessionId));
      record('live: family', family.status === 200 && family.json && Array.isArray(family.json.agents), 'agents=' + (family.json && Array.isArray(family.json.agents) ? family.json.agents.length : '?'));
      const taskcost = await getJson(gui + '/agent-cockpit/taskcost?lead=' + encodeURIComponent(sessionId));
      record('live: taskcost', taskcost.status === 200 && taskcost.json && taskcost.json.totals && typeof taskcost.json.totals.steps === 'number', 'steps=' + (taskcost.json && taskcost.json.totals ? taskcost.json.totals.steps : '?'));
    } catch (error) {
      record('live: family/taskcost', false, String(error && error.message ? error.message : error));
    }
  }
}

await liveChecks();

// 清掉线上验收写入的假会话状态（只影响我们自己的 state.json）
try {
  await getJson(gui + '/agent-cockpit/state', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ session: 'session-e2e000001', mode: 'auto', budget: null, archived: [] }),
  });
} catch {
  /* 清理失败不影响验收结论 */
}

const failed = results.filter((row) => !row.ok);
const passed = results.length - failed.length;
console.log('\n—— 汇总 ——');
console.log('通过: ' + passed + ' 失败: ' + failed.length + ' 总计: ' + results.length);
if (failed.length > 0) {
  for (const row of failed) console.log('  - ' + row.name + ': ' + row.detail);
  process.exitCode = 1;
} else {
  console.log('VERIFY ALL OK');
}
