/**
 * host/usage.js 增量口径单测：latestUserMessageTime / usageSinceEvents / usageSinceLogText。
 * 不读真实会话日志，全部用合成事件。
 */
import { latestUserMessageTime, usageSinceEvents, usageSinceLogText, emptyUsage } from '../host/usage.js';

let failures = 0;
const expect = (ok, message) => {
  if (ok) console.log('ok:', message);
  else {
    failures += 1;
    console.log('FAIL:', message);
  }
};

const userText = (time, text) => ({
  type: 'user/message',
  time,
  data: { source: { kind: 'user' }, content: [{ type: 'text', text }] },
});
const userOther = (time, kind) => ({
  type: 'user/message',
  time,
  data: { source: { kind }, content: [{ type: 'text', text: 'x' }] },
});
const step = (time) => ({ type: 'step/start', time, data: {} });
const call = (time) => ({ type: 'tool/call', time, data: { name: 'read' } });
const message = (time, input, output, cacheRead) => ({
  type: 'assistant/message',
  time,
  data: { usage: { inputTokens: input, outputTokens: output, cacheReadTokens: cacheRead } },
});

const events = [
  userText(1000, '旧任务'),
  step(1100),
  message(1200, 10, 20, 100),
  userOther(1300, 'time-context'),
  userOther(1400, 'agent-message'),
  userText(2000, '新任务开始'),
  step(2100),
  call(2200),
  message(2300, 30, 40, 200),
  step(2400),
  message(2500, 50, 60, 300),
];

/* latestUserMessageTime：只认人类消息，忽略 time-context / agent-message */
expect(latestUserMessageTime(events) === 2000, '最近人类消息时间=2000');
expect(latestUserMessageTime([]) === undefined, '空事件返回 undefined');
expect(latestUserMessageTime([userOther(1, 'time-context')]) === undefined, '非人类消息不计起点');

/* usageSinceEvents：只统计 >= since */
const since = latestUserMessageTime(events);
const acc = usageSinceEvents(events, since);
expect(acc.steps === 2, 'since 之后 step=2');
expect(acc.tools === 1, 'since 之后 tool=1');
expect(acc.input === 80 && acc.output === 100 && acc.cacheRead === 500, 'since 之后 usage 正确');

const all = usageSinceEvents(events, 0);
expect(all.steps === 3, 'since=0 统计全部 step');
expect(all.input === 90 && all.output === 120 && all.cacheRead === 600, 'since=0 统计全部 usage');

/* usageSinceLogText：与事件版一致 */
const text = events.map((event) => JSON.stringify(event)).join('\n') + '\n{"broken line';
const fromText = usageSinceLogText(text, since);
expect(fromText.steps === acc.steps && fromText.output === acc.output, '日志文本口径与事件一致');
expect(fromText.errors === 0, '错误计数保持 0');

/* emptyUsage 不被共享污染 */
const fresh = emptyUsage();
fresh.steps = 99;
expect(emptyUsage().steps === 0, 'emptyUsage 返回新对象');

console.log(failures === 0 ? 'USAGE SINCE TEST OK' : 'USAGE SINCE TEST FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
