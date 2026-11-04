/**
 * GK协助工作台 · Host 半边。
 *
 * 只读数据接口（不写会话、不调 LLM）：
 *   GET  /agent-cockpit/usage?lead=<sessionId>&ids=<id,id,...>   团队 token 用量
 *   GET  /agent-cockpit/family?lead=<sessionId>&session=<id>     Agent 编队（主控/队友/子 Agent）
 *   GET  /agent-cockpit/context?session=<id>&limit=<n>           上下文页：路由 + 最近调用样本
 *   GET  /agent-cockpit/insights?limit=<n>                       最近会话清单与用量
 *   GET  /agent-cockpit/taskcost?lead=<sessionId>                「本次任务」增量成本（最近人类消息之后）
 *   GET  /agent-cockpit/state?session=<id>                      协作模式 + 预算 + 熔断状态
 *   POST /agent-cockpit/state { session, mode?, budget? }       设置协作模式 / 预算（触发一次熔断检查）
 *
 * 另：apply() 会启动 coordination.js 的宿主侧守卫 —— 协作模式 off 时拒绝协作类工具，
 * 预算是真的会 interrupt 超预算成员（只影响本插件 profile，不改 DSH 核心）。
 */
import {
  collectUsage,
  isSessionId,
  listSessionSummaries,
  sessionTaskStart,
  sessionTimeline,
  sessionUsageSince,
} from './host/usage.js';
import { collectFamily } from './host/family.js';
import { createCoordinator } from './host/coordination.js';
import { getDoctor, getSessionState, normalizeSessionId, setDoctor, setSessionState } from './host/state.js';
import { applyDoctorAction, doctorPrompt, scanIfNeeded } from './host/doctor.js';

const ROUTE_PREFIX = '/agent-cockpit';
const DOCTOR_VERSION = '1.2.0';
const ROUTES = {
  usage: '/usage',
  family: '/family',
  context: '/context',
  insights: '/insights',
  projection: '/projection',
  taskcost: '/taskcost',
  state: '/state',
  coorddebug: '/coorddebug',
  doctor: '/doctor',
};

function sendJson(res, status, payload) {
  try {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(JSON.stringify(payload));
  } catch {
    /* 连接已断开 */
  }
}

function readBody(req, limit = 65536) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function liveSession(sessions, sessionId) {
  try {
    return sessions && typeof sessions.get === 'function' ? sessions.get(sessionId) : undefined;
  } catch {
    return undefined;
  }
}

/** 3 秒 TTL 的结果缓存：family/taskcost 会被客户端与多个面板同时轮询，避免重复解码日志。 */
const resultCache = new Map();
function cachedResult(key, ttlMs, build) {
  const now = Date.now();
  const hit = resultCache.get(key);
  if (hit && now - hit.at < ttlMs) return hit.value;
  const value = Promise.resolve().then(build);
  resultCache.set(key, { at: now, value });
  value.catch(() => resultCache.delete(key));
  if (resultCache.size > 32) {
    const first = resultCache.keys().next().value;
    resultCache.delete(first);
  }
  return value;
}

/** 新建一个「插件体检」对话，把冲突说明发给用户（真实会话，会用一次模型）。 */
export async function openDoctorConversation(ctx, doctor) {
  if (!doctor || !Array.isArray(doctor.conflicts) || doctor.conflicts.length === 0) return undefined;
  if (doctor.conversationId) return doctor.conversationId;
  let agents;
  try {
    agents = ctx.get('agents');
  } catch {
    agents = undefined;
  }
  if (!agents || typeof agents.create !== 'function') return undefined;
  let handle;
  try {
    const sessionId = 'session-gk-doctor-' + Date.now().toString(36);
    handle = await agents.create({
      sessionId,
      meta: { cwd: process.cwd() },
    });
    const agent = handle && handle.agent;
    if (!agent || typeof agent.steer !== 'function') {
      if (handle && typeof handle.dispose === 'function') await handle.dispose();
      return undefined;
    }
    const message = {
      id: 'msg-gk-doctor-' + Date.now().toString(36),
      role: 'user',
      source: { kind: 'user' },
      content: [{ type: 'text', text: doctorPrompt(doctor) }],
    };
    agent.steer(message);
    setDoctor({ conversationId: sessionId, conversationOpenedAt: Date.now() });
    return sessionId;
  } catch {
    if (handle && typeof handle.dispose === 'function') {
      try {
        await handle.dispose();
      } catch {
        /* ignore */
      }
    }
    return undefined;
  }
}

export function apply(ctx) {
  let coordinator;
  try {
    coordinator = createCoordinator(ctx);
    coordinator.start();
  } catch {
    coordinator = undefined;
  }

  /* ── 首次加载：插件冲突体检 + 自动开一个说明对话 ── */
  let doctor = undefined;
  try {
    doctor = scanIfNeeded(DOCTOR_VERSION);
  } catch {
    doctor = undefined;
  }
  let doctorOpening = false;
  const maybeOpenDoctorConversation = async () => {
    if (doctorOpening) return;
    const current = (() => { try { return getDoctor(); } catch { return undefined; } })();
    if (!current || current.status !== 'pending' || current.conversationId) return;
    if (!Array.isArray(current.conflicts) || current.conflicts.length === 0) return;
    doctorOpening = true;
    try {
      await openDoctorConversation(ctx, current);
    } finally {
      doctorOpening = false;
    }
  };
  if (doctor && doctor.status === 'pending') {
    const timer = setTimeout(() => { void maybeOpenDoctorConversation(); }, 4000);
    if (timer && typeof timer.unref === 'function') timer.unref();
  }

  ctx.inject(['webServer', 'sessions', 'sessionProjections'], (sub) => {
    let server;
    let sessions;
    let projections;
    try {
      server = sub.webServer ?? (typeof sub.get === 'function' ? sub.get('webServer') : undefined);
      sessions = sub.sessions ?? (typeof sub.get === 'function' ? sub.get('sessions') : undefined);
      projections = sub.sessionProjections
        ?? (typeof sub.get === 'function' ? sub.get('sessionProjections') : undefined);
    } catch {
      server = undefined;
      sessions = undefined;
      projections = undefined;
    }
    if (!server || typeof server.register !== 'function') return;

    /* agentTeams / agents / subagents 是可选依赖：缺失时 family 空降级，usage 照常 */
    const optional = (name) => {
      try {
        return ctx.get(name);
      } catch {
        return undefined;
      }
    };
    const scope = () => ({
      sessions,
      agents: optional('agents'),
      agentTeams: optional('agentTeams'),
      subagents: optional('subagents'),
    });

    async function taskCost(lead) {
      const at = Date.now();
      if (!isSessionId(lead)) {
        return { at, lead, since: 0, sinceSource: 'invalid', agents: [], totals: { steps: 0, tools: 0, input: 0, output: 0, cacheRead: 0 }, ratio: 0 };
      }
      const task = sessionTaskStart(lead, liveSession(sessions, lead));
      const family = await collectFamily(scope(), lead, lead);
      const rows = [];
      for (const row of family.agents) {
        const measured = sessionUsageSince(row.id, liveSession(sessions, row.id), task.since);
        rows.push({
          id: row.id,
          name: row.name,
          role: row.role,
          status: row.status,
          live: measured.live === true,
          source: measured.source,
          ...measured.usage,
        });
      }
      const totals = { steps: 0, tools: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, errors: 0 };
      for (const row of rows) {
        for (const key of Object.keys(totals)) totals[key] += Number(row[key]) || 0;
      }
      const ratio = totals.input + totals.output > 0 ? totals.cacheRead / (totals.input + totals.output) : 0;
      return {
        at,
        lead,
        since: task.since,
        sinceSource: task.source,
        agents: rows,
        totals,
        ratio: Math.round(ratio * 100) / 100,
      };
    }

    function statePayload(sessionId) {
      const id = normalizeSessionId(sessionId);
      const state = id ? getSessionState(id) : { mode: 'auto', budget: null };
      const status = id && coordinator ? coordinator.statusOf(id) : undefined;
      return {
        at: Date.now(),
        session: id,
        mode: state.mode,
        budget: state.budget,
        archived: state.archived,
        status: status
          ? {
            at: status.at,
            since: status.since,
            sinceSource: status.sinceSource,
            over: status.over,
            totals: status.totals,
            members: status.members,
            interruptedCount: status.interruptedCount,
          }
          : null,
      };
    }

    ctx.effect(() => server.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: async (req, res) => {
        let url;
        try {
          url = new URL(String(req.url || ROUTE_PREFIX), 'http://local');
        } catch {
          sendJson(res, 400, { error: 'bad url' });
          return;
        }
        const path = url.pathname;
        const routeName = Object.keys(ROUTES).find((name) => path === ROUTE_PREFIX + ROUTES[name]);
        if (!routeName) {
          sendJson(res, 404, { error: 'not found', path });
          return;
        }
        const mutable = routeName === 'state' || routeName === 'doctor';
        const method = req.method === 'POST' ? 'POST' : req.method === 'GET' ? 'GET' : String(req.method || 'GET');
        if (mutable) {
          if (method !== 'GET' && method !== 'POST') {
            sendJson(res, 405, { error: 'only GET/POST are supported here' });
            return;
          }
        } else if (method !== 'GET') {
          sendJson(res, 405, { error: 'only GET is supported' });
          return;
        }

        const lead = url.searchParams.get('lead') || '';
        try {
          if (routeName === 'usage') {
            const ids = String(url.searchParams.get('ids') || '')
              .split(',')
              .map((value) => value.trim())
              .filter((value) => isSessionId(value));
            sendJson(res, 200, collectUsage(scope(), lead, ids));
            return;
          }
          if (routeName === 'context') {
            const sessionId = url.searchParams.get('session') || lead;
            const limit = Number(url.searchParams.get('limit') || 24);
            sendJson(res, 200, sessionTimeline(sessionId, liveSession(sessions, sessionId), limit));
            return;
          }
          if (routeName === 'projection') {
            const sessionId = url.searchParams.get('session') || lead;
            const key = url.searchParams.get('key') || 'contextTimeline';
            const out = { session: sessionId, key, found: false };
            try {
              const session = liveSession(sessions, sessionId);
              if (session && projections && typeof projections.stateOf === 'function') {
                const value = projections.stateOf(session, key);
                out.found = value !== undefined && value !== null;
                out.unsupported = value && value.unsupported ? value.unsupported : null;
                out.keys = value && typeof value === 'object' ? Object.keys(value).slice(0, 24) : null;
                out.head = value && value.current ? value.current : null;
                out.ok = value && typeof value.ok === 'boolean' ? value.ok : null;
              }
            } catch (error) {
              out.error = String(error && error.message ? error.message : error);
            }
            sendJson(res, 200, out);
            return;
          }
          if (routeName === 'insights') {
            const limit = Number(url.searchParams.get('limit') || 12);
            sendJson(res, 200, listSessionSummaries(limit));
            return;
          }
          if (routeName === 'doctor') {
            if (method === 'POST') {
              let body;
              try {
                body = JSON.parse(await readBody(req));
              } catch {
                sendJson(res, 400, { error: 'body is not JSON' });
                return;
              }
              const result = applyDoctorAction(body && body.action ? String(body.action) : '');
              sendJson(res, 200, result);
              if (result && result.ok) void maybeOpenDoctorConversation();
              return;
            }
            let current = (() => { try { return getDoctor(); } catch { return undefined; } })();
            if (!current) {
              try {
                current = scanIfNeeded(DOCTOR_VERSION);
              } catch {
                current = undefined;
              }
            }
            if (current && current.status === 'pending') void maybeOpenDoctorConversation();
            sendJson(res, 200, { at: Date.now(), doctor: current });
            return;
          }
          if (routeName === 'coorddebug') {
            sendJson(res, 200, coordinator && typeof coordinator.debugInfo === 'function'
              ? Object.assign({ at: Date.now() }, coordinator.debugInfo())
              : { at: Date.now(), error: 'coordinator not started' });
            return;
          }
          if (routeName === 'taskcost') {
            const leadParam = url.searchParams.get('lead') || '';
            sendJson(res, 200, await cachedResult('taskcost:' + leadParam, 3000, () => taskCost(leadParam)));
            return;
          }
          if (routeName === 'state') {
            if (method === 'POST') {
              let body;
              try {
                body = JSON.parse(await readBody(req));
              } catch {
                sendJson(res, 400, { error: 'body is not JSON' });
                return;
              }
              const sessionId = normalizeSessionId(body && body.session);
              if (!sessionId) {
                sendJson(res, 400, { error: 'missing session' });
                return;
              }
              const patch = {};
              if (body.mode !== undefined) {
                patch.mode = body.mode === 'off' ? 'off' : body.mode === 'ask' ? 'ask' : 'auto';
              }
              if (body.budget !== undefined) patch.budget = body.budget;
              if (body.archived !== undefined) patch.archived = body.archived;
              setSessionState(sessionId, patch);
              if (coordinator && patch.budget !== undefined) {
                try {
                  await coordinator.refreshBudget(sessionId);
                } catch {
                  /* 熔断检查失败不影响配置保存 */
                }
              }
              sendJson(res, 200, statePayload(sessionId));
              return;
            }
            sendJson(res, 200, statePayload(url.searchParams.get('session') || lead));
            return;
          }
          const current = url.searchParams.get('session') || lead;
          sendJson(res, 200, await cachedResult('family:' + lead + '|' + current, 3000, () => collectFamily(scope(), lead, current)));
        } catch (error) {
          sendJson(res, 200, {
            error: String(error && error.message ? error.message : error),
            at: Date.now(),
          });
        }
      },
    }), 'agent-cockpit: usage + family + taskcost + state routes');
  });
}
