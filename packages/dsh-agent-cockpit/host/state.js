/**
 * GK协助工作台 · 持久状态（协作模式 + 预算）。
 *
 * 存到 <DSH_HOME>/plugins/dsh-agent-cockpit/state.json，按「根会话 id」记录：
 *   { mode: 'auto' | 'off', budget: { steps?: number, output?: number } | null }
 *
 * - mode=auto：默认行为，模型自己决定要不要组队；
 * - mode=off ：对本会话的所有 agent 安装工具 guard，拒绝 spawn/team/subagent/workflow，
 *              并注入一段系统提示；新开会话恢复 auto。
 * - budget  ：团队预算，宿主侧监控「本次任务」用量，超了会 interrupt 超预算成员。
 *
 * 不写会话日志、不联网。文件写入走临时文件 + rename，避免半截 JSON。
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const DEFAULT = Object.freeze({ mode: 'ask', budget: null, archived: [] });
const cache = { path: undefined, mtime: 0, size: -1, data: undefined };

export function statePath() {
  const override = process.env.GK_COCKPIT_STATE;
  if (override && override.length > 0) return override;
  const home = process.env.DSH_HOME || join(homedir(), '.dsh');
  return join(home, 'plugins', 'dsh-agent-cockpit', 'state.json');
}

function emptyStore() {
  return { version: 1, sessions: {}, doctor: null };
}

function readStore() {
  const path = statePath();
  let stat;
  try {
    stat = statSync(path);
  } catch {
    cache.path = path;
    cache.mtime = 0;
    cache.size = -1;
    cache.data = emptyStore();
    return cache.data;
  }
  if (cache.path === path && cache.mtime === stat.mtimeMs && cache.size === stat.size && cache.data) {
    return cache.data;
  }
  let data;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    data = parsed && typeof parsed === 'object' && parsed.sessions && typeof parsed.sessions === 'object' ? parsed : emptyStore();
    if (!data.doctor || typeof data.doctor !== 'object') data.doctor = null;
  } catch {
    data = emptyStore();
  }
  cache.path = path;
  cache.mtime = stat.mtimeMs;
  cache.size = stat.size;
  cache.data = data;
  return data;
}

function writeStore(store) {
  const path = statePath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + '.tmp-' + process.pid;
  writeFileSync(tmp, JSON.stringify(store, null, 2) + '\n', 'utf8');
  renameSync(tmp, path);
  try {
    const stat = statSync(path);
    cache.path = path;
    cache.mtime = stat.mtimeMs;
    cache.size = stat.size;
    cache.data = store;
  } catch {
    cache.path = undefined;
  }
}

export function normalizeSessionId(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^[A-Za-z0-9._-]{4,128}$/.test(trimmed) ? trimmed : '';
}

function normalizeMode(value) {
  if (value === 'off') return 'off';
  if (value === 'auto') return 'auto';
  return 'ask';
}

function normalizeBudget(value) {
  if (value === null || value === undefined) return null;
  const steps = Number(value.steps);
  const output = Number(value.output);
  const keepSteps = Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 0;
  const keepOutput = Number.isFinite(output) && output > 0 ? Math.round(output) : 0;
  if (keepSteps === 0 && keepOutput === 0) return null;
  return { steps: keepSteps, output: keepOutput };
}

/** 已归档（从工作台卡片里隐藏）的成员会话 id，最多 128 个。 */
function normalizeArchived(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of value) {
    const id = normalizeSessionId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= 128) break;
  }
  return result;
}

function normalizeEntry(entry) {
  return {
    mode: normalizeMode(entry && entry.mode),
    budget: normalizeBudget(entry && entry.budget),
    archived: normalizeArchived(entry && entry.archived),
    updatedAt: entry && typeof entry.updatedAt === 'number' ? entry.updatedAt : 0,
  };
}

export function getSessionState(sessionId) {
  const id = normalizeSessionId(sessionId);
  if (!id) return { ...DEFAULT, archived: [] };
  const store = readStore();
  const entry = store.sessions[id];
  return entry ? normalizeEntry(entry) : { ...DEFAULT, archived: [] };
}

export function getMode(sessionId) {
  return getSessionState(sessionId).mode;
}

export function setSessionState(sessionId, patch) {
  const id = normalizeSessionId(sessionId);
  if (!id) return { ...DEFAULT };
  const store = readStore();
  const current = normalizeEntry(store.sessions[id]);
  const next = {
    mode: patch && patch.mode !== undefined ? normalizeMode(patch.mode) : current.mode,
    budget: patch && patch.budget !== undefined ? normalizeBudget(patch.budget) : current.budget,
    archived: patch && patch.archived !== undefined ? normalizeArchived(patch.archived) : current.archived,
    updatedAt: Date.now(),
  };
  store.sessions[id] = next;
  pruneStore(store);
  writeStore(store);
  return next;
}

function pruneStore(store) {
  const ids = Object.keys(store.sessions);
  if (ids.length <= 200) return;
  ids.sort((left, right) => (store.sessions[left].updatedAt || 0) - (store.sessions[right].updatedAt || 0));
  for (const id of ids.slice(0, ids.length - 200)) delete store.sessions[id];
}

/** 所有带预算的会话 id（监控循环用）。 */
export function budgetSessionIds() {
  const store = readStore();
  return Object.keys(store.sessions).filter((id) => normalizeEntry(store.sessions[id]).budget !== null);
}

/** 首次加载的插件冲突体检报告（全局，不按会话）。 */
export function getDoctor() {
  const store = readStore();
  return store.doctor && typeof store.doctor === 'object' ? store.doctor : null;
}

export function setDoctor(patch) {
  const store = readStore();
  const current = store.doctor && typeof store.doctor === 'object' ? store.doctor : {};
  const next = Object.assign({}, current, patch || {}, { updatedAt: Date.now() });
  store.doctor = next;
  writeStore(store);
  return next;
}

export function resetStateCache() {
  cache.path = undefined;
  cache.mtime = 0;
  cache.size = -1;
  cache.data = undefined;
}
