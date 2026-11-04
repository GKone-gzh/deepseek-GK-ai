/**
 * 插件冲突说明对话（openDoctorConversation）单测：
 * 用假 agents 服务验证「有冲突 → 新建会话 + steer 一条说明消息」，
 * 以及 agents 服务不可用 / 创建失败时安全降级。
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'gk-doc-chat-'));
process.env.GK_COCKPIT_STATE = join(dir, 'state.json');

const state = await import('../host/state.js');
const { openDoctorConversation } = await import('../index.js');

let failures = 0;
const expect = (ok, message) => {
  if (ok) console.log('ok:', message);
  else {
    failures += 1;
    console.log('FAIL:', message);
  }
};

const doctor = {
  status: 'pending',
  profile: 'desktop',
  scannedAt: Date.now(),
  conflicts: [
    { code: 'duplicate-context', severity: 'high', title: '检测到独立安装的 dsh-context', detail: '重复引擎', fixable: true },
  ],
};

/* 1) 正常路径：创建会话 + steer 说明消息 */
const steered = [];
const created = [];
const fakeCtx = {
  get(name) {
    if (name !== 'agents') return undefined;
    return {
      async create(options) {
        created.push(options);
        return {
          agent: { id: options.sessionId, steer(message) { steered.push(message); } },
          async dispose() {},
        };
      },
    };
  },
};
const sessionId = await openDoctorConversation(fakeCtx, doctor);
expect(typeof sessionId === 'string' && sessionId.indexOf('session-gk-doctor-') === 0, '创建了体检会话 id');
expect(created.length === 1 && created[0].meta && typeof created[0].meta.cwd === 'string', 'agents.create 参数含绝对 cwd');
expect(steered.length === 1, '向新会话 steer 了一条消息');
expect(steered[0] && steered[0].role === 'user', '消息角色为 user');
const text = steered[0].content && steered[0].content[0] ? steered[0].content[0].text : '';
expect(text.indexOf('插件冲突') >= 0 && text.indexOf('自主修复') >= 0 && text.indexOf('不使用') >= 0, '消息包含冲突说明与两个选项');
expect(state.getDoctor().conversationId === sessionId, '会话 id 已写入 doctor 状态');

/* 2) 已有 conversationId 不重复建 */
const second = await openDoctorConversation(fakeCtx, { ...doctor, conversationId: sessionId });
expect(second === sessionId && created.length === 1, '已有会话时不重复创建');

/* 3) agents 服务不可用：返回 undefined 不抛错 */
const noAgents = { get: () => undefined };
const none = await openDoctorConversation(noAgents, doctor);
expect(none === undefined, 'agents 不可用时安全降级');

/* 4) create 抛错：返回 undefined，触发 dispose */
let disposed = 0;
const boomCtx = {
  get: () => ({
    async create() {
      return {
        agent: undefined,
        async dispose() { disposed += 1; },
      };
    },
  }),
};
const boom = await openDoctorConversation(boomCtx, doctor);
expect(boom === undefined && disposed === 1, '无 steer 能力时 dispose 并降级');

rmSync(dir, { recursive: true, force: true });
console.log(failures === 0 ? 'DOCTOR CONVERSATION TEST OK' : 'DOCTOR CONVERSATION TEST FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
