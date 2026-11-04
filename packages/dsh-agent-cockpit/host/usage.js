/**
 * dsh-agent-cockpit · host 半边的只读用量统计。
 *
 * 数据来源只有一处：会话日志里 `assistant/message` 事件上的 `usage`（TokenUsage）。
 * 优先读内存里的 live Session（ctx.sessions.get），拿不到（已被回收）就回落到磁盘上的
 * session.v*.jsonl.zstd —— 多帧 zstd，需要逐帧解。
 *
 * 这里刻意不依赖 agentTeams / agents 服务：只按会话 id 记账，
 * 因此已结束的团队、历史会话、甚至别的 agent 都能统计。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { zstdDecompressSync } from 'node:zlib';

const ZSTD_MAGIC = 0xfd2fb528; // LE uint32 of 28 B5 2F FD

const EMPTY = Object.freeze({
  steps: 0,
  tools: 0,
  errors: 0,
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  reasoning: 0,
  turns: 0,
});

/** 把多帧 zstd 拼接的文件解成文本；单帧解压器遇到后续帧会报未知帧描述，所以逐帧找魔数。 */
export function decodeZstdFrames(buf) {
  const offsets = [];
  for (let i = 0; i + 4 <= buf.length; i += 1) {
    if (buf.readUInt32LE(i) === ZSTD_MAGIC) offsets.push(i);
  }
  const parts = [];
  for (const offset of offsets) {
    try {
      const out = zstdDecompressSync(buf.subarray(offset));
      if (out.length > 0) parts.push(out.toString('utf8'));
    } catch {
      /* 魔数偶然出现在压缩数据内部，跳过即可 */
    }
  }
  return parts.join('');
}

function addUsage(acc, usage) {
  if (!usage || typeof usage !== 'object') return;
  const pick = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  acc.input += pick(usage.inputTokens);
  acc.output += pick(usage.outputTokens);
  acc.cacheRead += pick(usage.cacheReadTokens);
  acc.cacheWrite += pick(usage.cacheWriteTokens);
  acc.reasoning += pick(usage.reasoningTokens);
}

export function emptyUsage() {
  return { ...EMPTY };
}

/** 从一串会话事件里累计用量。事件形状：{ type, data }。 */
export function usageFromEvents(events, into) {
  const acc = into || emptyUsage();
  for (const event of events || []) {
    const type = event && event.type;
    const data = event && event.data;
    if (!data) continue;
    if (type === 'step/start') acc.steps += 1;
    else if (type === 'tool/call') acc.tools += 1;
    else if (type === 'tool/result' && data.error) acc.errors += 1;
    else if (type === 'turn/start') acc.turns += 1;
    else if (type === 'assistant/message') addUsage(acc, data.usage);
  }
  return acc;
}

export function usageFromLogText(text) {
  const acc = emptyUsage();
  for (const line of String(text).split('\n')) {
    if (!line) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === 'step/start') acc.steps += 1;
    else if (event.type === 'tool/call') acc.tools += 1;
    else if (event.type === 'tool/result' && event.data && event.data.error) acc.errors += 1;
    else if (event.type === 'turn/start') acc.turns += 1;
    else if (event.type === 'assistant/message') addUsage(acc, event.data && event.data.usage);
  }
  return acc;
}

function dshHome() {
  const fromEnv = process.env.DSH_HOME;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return join(homedir(), '.dsh');
}

export function sessionsRoot() {
  return join(dshHome(), 'sessions');
}

const diskCache = new Map(); // sessionId -> { key, usage }
const rootCache = { at: 0, index: null }; // sessionId -> file path

function listSessionLogs(root) {
  const index = new Map();
  let workspaces;
  try {
    workspaces = readdirSync(root, { withFileTypes: true });
  } catch {
    return index;
  }
  for (const workspace of workspaces) {
    if (!workspace.isDirectory()) continue;
    const workspaceDir = join(root, workspace.name);
    let sessions;
    try {
      sessions = readdirSync(workspaceDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const session of sessions) {
      if (!session.isDirectory()) continue;
      const sessionDir = join(workspaceDir, session.name);
      let files;
      try {
        files = readdirSync(sessionDir);
      } catch {
        continue;
      }
      const log = files.find((name) => name.endsWith('.jsonl.zstd'));
      if (log) index.set(session.name, join(sessionDir, log));
    }
  }
  return index;
}

function sessionLogIndex() {
  const now = Date.now();
  if (rootCache.index && now - rootCache.at < 4000) return rootCache.index;
  rootCache.index = listSessionLogs(sessionsRoot());
  rootCache.at = now;
  return rootCache.index;
}

/** 会话 id 允许的字符；拒绝路径穿越。 */
export function isSessionId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9._-]{4,128}$/.test(value);
}

/** 读一个会话的累计用量：live 事件优先，其次磁盘日志。
 *  mtime 永远指向会话日志文件的最后写入时间（live 会话同样 stat），
 *  供工作台显示「最后活动」，不额外读日志内容。 */
export function sessionUsage(sessionId, liveSession) {
  if (!isSessionId(sessionId)) return { usage: emptyUsage(), source: 'invalid', live: false };
  const file = sessionLogIndex().get(sessionId);
  let stat;
  if (file) {
    try {
      stat = statSync(file);
    } catch {
      stat = undefined;
    }
  }
  const mtime = stat ? stat.mtimeMs : undefined;
  if (liveSession && typeof liveSession.ownEvents === 'function') {
    try {
      const events = liveSession.ownEvents();
      const usage = usageFromEvents(events);
      const header = liveSession.header || {};
      return {
        usage,
        source: 'live',
        live: true,
        model: lastModel(events),
        cwd: header.cwd,
        title: header.title,
        createdAt: header.createdAt,
        mtime,
      };
    } catch {
      /* 回落磁盘 */
    }
  }
  if (!file || !stat) return { usage: emptyUsage(), source: 'missing', live: false, mtime };
  const key = String(stat.mtimeMs) + ':' + String(stat.size);
  const cached = diskCache.get(sessionId);
  if (cached && cached.key === key) {
    if (mtime !== undefined) cached.value.mtime = mtime;
    return cached.value;
  }
  let text = '';
  try {
    text = decodeZstdFrames(readFileSync(file));
  } catch {
    return { usage: emptyUsage(), source: 'error', live: false, mtime };
  }
  const value = {
    usage: usageFromLogText(text),
    source: 'disk',
    live: false,
    model: lastModelFromText(text),
    createdAt: createdAtFromText(text),
    mtime,
  };
  diskCache.set(sessionId, { key, value });
  return value;
}

function lastModel(events) {
  for (let index = (events ? events.length : 0) - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event && event.type === 'assistant/message') {
      const source = event.data && event.data.message && event.data.message.source;
      if (source && source.model) return source.model;
    }
  }
  return undefined;
}

function lastModelFromText(text) {
  const lines = String(text).split('\n');
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].indexOf('"assistant/message"') < 0) continue;
    try {
      const event = JSON.parse(lines[index]);
      const source = event.data && event.data.message && event.data.message.source;
      if (source && source.model) return source.model;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function createdAtFromText(text) {
  const first = String(text).split('\n')[0];
  try {
    const header = JSON.parse(first);
    return header.createdAt;
  } catch {
    return undefined;
  }
}

/** 汇总一个团队的用量。ids 里包含 Lead 和成员；leadId 单列。 */
export function collectUsage(ctx, leadId, ids) {
  const sessions = ctx && ctx.sessions;
  const live = (id) => {
    try {
      return sessions && typeof sessions.get === 'function' ? sessions.get(id) : undefined;
    } catch {
      return undefined;
    }
  };
  const one = (id) => {
    const result = sessionUsage(id, live(id));
    return {
      id,
      live: result.live === true,
      source: result.source,
      model: result.model,
      cwd: result.cwd,
      mtime: result.mtime,
      ...result.usage,
    };
  };
  const members = [];
  const seen = new Set();
  for (const id of ids || []) {
    if (!isSessionId(id) || seen.has(id)) continue;
    seen.add(id);
    if (id === leadId) continue;
    members.push(one(id));
  }
  const lead = isSessionId(leadId) ? one(leadId) : undefined;
  const totals = emptyUsage();
  for (const row of members) {
    for (const key of Object.keys(totals)) totals[key] += row[key] || 0;
  }
  if (lead) for (const key of Object.keys(totals)) totals[key] += lead[key] || 0;
  const denominator = members.length + (lead ? 1 : 0);
  const outputPerAgent = denominator > 0 ? Math.round(totals.output / denominator) : 0;
  return {
    at: Date.now(),
    lead,
    members,
    totals,
    averages: { outputPerAgent },
    // 一行可读的结论：上下文重读通常是输入+输出的数十倍，说明步数比字数更贵。
    ratio: totals.output > 0 ? Math.round((totals.cacheRead / (totals.input + totals.output)) * 100) / 100 : 0,
  };
}

/** 可测入口：直接按 id 列表统计，不依赖 ctx。 */
export function collectUsageOffline(leadId, ids) {
  return collectUsage({ sessions: undefined }, leadId, ids);
}

export function hasSessionLog(sessionId) {
  return sessionLogIndex().has(sessionId) || existsSync(join(sessionsRoot()));
}

/* ── 上下文页与洞察页的补充数据 ────────────────────────────────────────
 *
 * 这两个视图原先由 dsh-context 提供；现在并进本插件，数据仍旧只读会话日志。
 * 上下文「压力 / 构成 / 窗口」由客户端读会话投影（token-meter 注册的
 * contextPressure / contextBreakdown / tokenUsage），这里只补日志侧的
 * 逐次调用样本与会话清单。
 */

function numeric(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function eventsFromLogText(text) {
  const events = [];
  for (const line of String(text).split('\n')) {
    if (!line) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      /* 半行/截断行直接跳过 */
    }
  }
  return events;
}

function logEvents(sessionId, liveSession) {
  if (liveSession && typeof liveSession.ownEvents === 'function') {
    try {
      const events = liveSession.ownEvents();
      if (Array.isArray(events) && events.length > 0) return { events, source: 'live' };
    } catch {
      /* 回落到磁盘 */
    }
  }
  const file = sessionLogIndex().get(sessionId);
  if (!file) return { events: [], source: 'missing' };
  try {
    return { events: eventsFromLogText(decodeZstdFrames(readFileSync(file))), source: 'disk' };
  } catch {
    return { events: [], source: 'error' };
  }
}

function routeOf(events) {
  let route = null;
  for (const event of events || []) {
    if (!event) continue;
    if (event.type === 'request/context') {
      const data = event.data || {};
      route = {
        provider: typeof data.provider === 'string' ? data.provider : route ? route.provider : undefined,
        model: typeof data.model === 'string' ? data.model : route ? route.model : undefined,
        contextWindow:
          typeof data.contextWindow === 'number' ? data.contextWindow : route ? route.contextWindow : undefined,
      };
    } else if (event.type === 'request/header' && route === null) {
      const config = event.data && event.data.header && event.data.header.config;
      if (config && typeof config === 'object') {
        route = {
          provider: typeof config.provider === 'string' ? config.provider : undefined,
          model: typeof config.model === 'string' ? config.model : undefined,
          contextWindow: undefined,
        };
      }
    }
  }
  return route;
}

function titleOfEvents(events) {
  let title;
  for (const event of events || []) {
    if (!event || event.type !== 'session/title') continue;
    const data = event.data || {};
    const candidate =
      typeof data.title === 'string' ? data.title
        : typeof data.text === 'string' ? data.text
          : typeof data.value === 'string' ? data.value
            : undefined;
    if (candidate && candidate.trim().length > 0) title = candidate.trim();
  }
  return title;
}

function firstUserText(events) {
  for (const event of events || []) {
    if (!event || event.type !== 'user/message') continue;
    const data = event.data || {};
    const kind = data.source && data.source.kind;
    if (kind === 'user-approval' || kind === 'system' || kind === 'notice') continue;
    const content = Array.isArray(data.content) ? data.content : [];
    const text = content
      .filter((part) => part && part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text)
      .join(' ')
      .trim();
    if (text.length > 0) return text.length > 90 ? text.slice(0, 90) + '…' : text;
  }
  return undefined;
}

function sampleOf(event) {
  const data = event.data || {};
  const usage = data.usage;
  if (!usage || typeof usage !== 'object') return undefined;
  const source = data.message && data.message.source;
  return {
    time: typeof event.time === 'number' ? event.time : undefined,
    seq: typeof event.seq === 'number' ? event.seq : undefined,
    turn: typeof data.turn === 'number' ? data.turn : undefined,
    step: typeof data.step === 'number' ? data.step : undefined,
    input: numeric(usage.inputTokens),
    output: numeric(usage.outputTokens),
    cacheRead: numeric(usage.cacheReadTokens),
    cacheWrite: numeric(usage.cacheWriteTokens),
    reasoning: numeric(usage.reasoningTokens),
    model: source && typeof source.model === 'string' ? source.model : undefined,
  };
}

/** 单个会话：模型路由 + 最近 limit 次模型调用样本（上下文页趋势）。 */
export function sessionTimeline(sessionId, liveSession, limit) {
  const max = Math.max(1, Math.min(120, Number(limit) || 24));
  if (!isSessionId(sessionId)) {
    return { at: Date.now(), session: sessionId, source: 'invalid', samples: [], total: 0 };
  }
  const { events, source } = logEvents(sessionId, liveSession);
  const samples = [];
  for (const event of events) {
    if (!event || event.type !== 'assistant/message') continue;
    const sample = sampleOf(event);
    if (sample) samples.push(sample);
  }
  return {
    at: Date.now(),
    session: sessionId,
    source,
    title: titleOfEvents(events) || firstUserText(events),
    route: routeOf(events),
    total: samples.length,
    samples: samples.slice(-max),
  };
}

const summaryCache = new Map(); // sessionId -> { key, value }

/** 最近若干会话（按日志 mtime 倒序）：标题 + 模型 + 累计用量（洞察页）。 */
export function listSessionSummaries(limit) {
  const max = Math.max(1, Math.min(50, Number(limit) || 12));
  const index = sessionLogIndex();
  const rows = [];
  for (const [id, file] of index) {
    let stat;
    try {
      stat = statSync(file);
    } catch {
      continue;
    }
    rows.push({ id, file, mtime: stat.mtimeMs, size: stat.size });
  }
  rows.sort((left, right) => right.mtime - left.mtime);
  const sessions = [];
  for (const row of rows.slice(0, max)) {
    const key = String(row.mtime) + ':' + String(row.size);
    const cached = summaryCache.get(row.id);
    let value;
    if (cached && cached.key === key) {
      value = cached.value;
    } else {
      let events = [];
      try {
        events = eventsFromLogText(decodeZstdFrames(readFileSync(row.file)));
      } catch {
        events = [];
      }
      const usage = usageFromEvents(events);
      value = {
        id: row.id,
        title: titleOfEvents(events) || firstUserText(events),
        model: lastModel(events),
        route: routeOf(events),
        usage,
        mtime: row.mtime,
        size: row.size,
      };
      summaryCache.set(row.id, { key, value });
    }
    sessions.push(value);
  }
  return { at: Date.now(), sessions };
}


/* ── 本次任务增量：从最近一条人类消息开始算 ──────────────────────────────
 *
 * 工作台过去的成本都是「整段会话累计」，会把测试前的历史也算进去。
 * 这里提供按时间过滤的统计：since = 该会话最近一条人类 user/message 的时间。
 */

const sinceCache = new Map(); // sessionId -> { key, value }

/** 最近一条人类 user/message 的时间戳（ms）；没有则 undefined。 */
export function latestUserMessageTime(events) {
  let latest;
  for (const event of events || []) {
    if (!event || event.type !== 'user/message') continue;
    const source = event.data && event.data.source;
    const kind = source && typeof source.kind === 'string' ? source.kind : '';
    if (kind !== '' && kind !== 'user') continue;
    const content = event.data && Array.isArray(event.data.content) ? event.data.content : [];
    const hasText = content.some((part) => part && part.type === 'text' && typeof part.text === 'string' && part.text.trim().length > 0);
    if (!hasText) continue;
    const time = typeof event.time === 'number' ? event.time : undefined;
    if (time !== undefined && (latest === undefined || time > latest)) latest = time;
  }
  return latest;
}

/** 只累计 time >= sinceMs 的事件（step/tool/turn/assistant usage）。 */
export function usageSinceEvents(events, sinceMs) {
  const acc = emptyUsage();
  const since = typeof sinceMs === 'number' && Number.isFinite(sinceMs) ? sinceMs : 0;
  for (const event of events || []) {
    if (!event) continue;
    const time = typeof event.time === 'number' ? event.time : undefined;
    if (time === undefined || time < since) continue;
    const type = event.type;
    const data = event.data;
    if (!data) continue;
    if (type === 'step/start') acc.steps += 1;
    else if (type === 'tool/call') acc.tools += 1;
    else if (type === 'tool/result' && data.error) acc.errors += 1;
    else if (type === 'turn/start') acc.turns += 1;
    else if (type === 'assistant/message') addUsage(acc, data.usage);
  }
  return acc;
}

export function usageSinceLogText(text, sinceMs) {
  const acc = emptyUsage();
  const since = typeof sinceMs === 'number' && Number.isFinite(sinceMs) ? sinceMs : 0;
  for (const line of String(text).split('\n')) {
    if (!line) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const time = typeof event.time === 'number' ? event.time : undefined;
    if (time === undefined || time < since) continue;
    if (event.type === 'step/start') acc.steps += 1;
    else if (event.type === 'tool/call') acc.tools += 1;
    else if (event.type === 'tool/result' && event.data && event.data.error) acc.errors += 1;
    else if (event.type === 'turn/start') acc.turns += 1;
    else if (event.type === 'assistant/message') addUsage(acc, event.data && event.data.usage);
  }
  return acc;
}

export function sessionEvents(sessionId, liveSession) {
  if (!isSessionId(sessionId)) return { events: [], source: 'invalid' };
  return logEvents(sessionId, liveSession);
}

/** 本次任务起点：最近一条人类消息时间；没有则 0（从会话开头算）。 */
export function sessionTaskStart(sessionId, liveSession) {
  const { events, source } = logEvents(sessionId, liveSession);
  const latest = latestUserMessageTime(events);
  return { since: latest === undefined ? 0 : latest, source: latest === undefined ? 'fallback' : 'user-message', eventsSource: source };
}

/** 一个会话 since 之后的增量用量（live 优先，磁盘兜底 + 按 mtime/size/since 缓存）。 */
export function sessionUsageSince(sessionId, liveSession, sinceMs) {
  const since = typeof sinceMs === 'number' && Number.isFinite(sinceMs) ? sinceMs : 0;
  if (!isSessionId(sessionId)) return { usage: emptyUsage(), source: 'invalid', live: false, since };
  if (liveSession && typeof liveSession.ownEvents === 'function') {
    try {
      const events = liveSession.ownEvents();
      return { usage: usageSinceEvents(events, since), source: 'live', live: true, since };
    } catch {
      /* 回落磁盘 */
    }
  }
  const file = sessionLogIndex().get(sessionId);
  if (!file) return { usage: emptyUsage(), source: 'missing', live: false, since };
  let stat;
  try {
    stat = statSync(file);
  } catch {
    return { usage: emptyUsage(), source: 'missing', live: false, since };
  }
  const key = String(stat.mtimeMs) + ':' + String(stat.size) + ':' + String(since);
  const cached = sinceCache.get(sessionId);
  if (cached && cached.key === key) return cached.value;
  let text = '';
  try {
    text = decodeZstdFrames(readFileSync(file));
  } catch {
    return { usage: emptyUsage(), source: 'error', live: false, since, mtime: stat.mtimeMs };
  }
  const value = { usage: usageSinceLogText(text, since), source: 'disk', live: false, since, mtime: stat.mtimeMs };
  sinceCache.set(sessionId, { key, value });
  if (sinceCache.size > 12) {
    const first = sinceCache.keys().next().value;
    sinceCache.delete(first);
  }
  return value;
}
