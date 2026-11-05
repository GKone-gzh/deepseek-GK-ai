/**
 * 首次加载的插件冲突体检（doctor）。
 *
 * 目标：插件第一次在本 profile 加载时，扫描 profile 里已安装的 bundle 是否与本插件冲突；
 * 有冲突就生成报告（state.json 的 doctor 字段），由客户端弹出说明并让用户选择：
 *   - 自主修复（fix）：从 profile 的 dsh.profile.bundles / dependencies 里移除已知冲突项（先备份 package.json）
 *   - 不使用我们的插件（optout）：把本插件从 bundles 移除（先备份），重启后生效
 *   - 暂不处理（dismiss）
 * 同时尝试新建一个「插件体检」对话把情况说明给用户（见 index.js 的 maybeOpenDoctorConversation）。
 *
 * 只读扫描默认安全；修复类动作一律先备份 profile package.json。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { getDoctor, setDoctor } from './state.js';

const OUR_BUNDLE = 'dsh-agent-cockpit';
const OUR_PACKAGES = new Set(['dsh-agent-cockpit', 'dsh-context-core', '@deepseek-ai/dsh-agent-cockpit']);
const OUR_ROW_IDS = new Set(['agent-cockpit', 'agent-cockpit-context']);
const TEAM_ROW_IDS = new Set(['agent-team', 'tool-agent-team']);

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh');
}

function profilesRoot() {
  return join(dshHome(), 'profiles');
}

function safeReadJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/** 找到当前安装了我们插件的 profile（dsh.profile.bundles 含 dsh-agent-cockpit）。 */
export function findProfile() {
  let entries;
  try {
    entries = readdirSync(profilesRoot(), { withFileTypes: true });
  } catch {
    return undefined;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(profilesRoot(), entry.name);
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = safeReadJson(pkgPath);
    if (!pkg) continue;
    const bundles = pkg.dsh && pkg.dsh.profile && Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : [];
    if (bundles.indexOf(OUR_BUNDLE) >= 0) return { name: entry.name, dir, pkgPath, pkg };
  }
  return undefined;
}

function resolveBundleDir(profileDir, bundleName) {
  const inProfile = join(profileDir, 'node_modules', bundleName);
  if (existsSync(inProfile)) return inProfile;
  const inPlugins = join(dshHome(), 'plugins', bundleName.replace(/^@[^/]+\//, ''));
  if (existsSync(inPlugins)) return inPlugins;
  return undefined;
}

/** 解析 bundle 的 package.json 与 patch 里插入的行 id/name（粗略但够冲突检测）。 */
function inspectBundle(profileDir, bundleName) {
  const dir = resolveBundleDir(profileDir, bundleName);
  if (!dir) return { bundle: bundleName, found: false, rowIds: [], packageName: '' };
  const pkg = safeReadJson(join(dir, 'package.json'));
  const patchRel = pkg && pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch ? pkg.dsh.bundle.patch : undefined;
  const rowIds = [];
  if (patchRel) {
    try {
      const text = readFileSync(join(dir, patchRel), 'utf8');
      for (const line of text.split('\n')) {
        const idMatch = line.match(/^\s*-?\s*id:\s*['"]?([A-Za-z0-9_.@/-]+)['"]?\s*$/);
        if (idMatch) rowIds.push(idMatch[1]);
      }
    } catch {
      /* patch 不可读就当没有 */
    }
  }
  return {
    bundle: bundleName,
    found: true,
    dir,
    packageName: pkg && typeof pkg.name === 'string' ? pkg.name : bundleName,
    rowIds,
  };
}

/** 扫描当前 profile；返回 { profile, conflicts, scannedAt }。 */
export function scanConflicts() {
  const profile = findProfile();
  const scannedAt = Date.now();
  if (!profile) {
    return {
      profile: undefined,
      conflicts: [{
        code: 'profile-not-found',
        severity: 'high',
        title: '找不到安装本插件的 profile',
        detail: '在 ~/.dsh/profiles/*/package.json 的 dsh.profile.bundles 里没有找到 dsh-agent-cockpit，插件可能没有正确挂载。',
        fixable: false,
        action: 'manual',
      }],
      scannedAt,
    };
  }

  const bundles = profile.pkg.dsh.profile.bundles || [];
  const conflicts = [];
  const inspected = new Map();

  const bundleMeta = (name) => {
    if (!inspected.has(name)) inspected.set(name, inspectBundle(profile.dir, name));
    return inspected.get(name);
  };

  /* 2) 重复的宿主行 id / 同名包 */
  for (const name of bundles) {
    if (name === OUR_BUNDLE) continue;
    const meta = bundleMeta(name);
    if (!meta) continue;
    if (OUR_PACKAGES.has(meta.packageName)) {
      conflicts.push({
        code: 'duplicate-package',
        severity: 'high',
        title: '另一个 bundle 使用了本插件的包名',
        detail: name + '（' + meta.packageName + '）与 GK协助工作台 的包名重复。',
        fixable: true,
        action: 'fix',
        toggle: name,
      });
    }
    const collide = meta.rowIds.filter((id) => OUR_ROW_IDS.has(id));
    if (collide.length > 0) {
      conflicts.push({
        code: 'duplicate-row',
        severity: 'high',
        title: '另一个 bundle 插入了相同的宿主行',
        detail: name + ' 插入了 ' + collide.join(', ') + '，会与 GK协助工作台 的两个宿主行冲突。',
        fixable: true,
        action: 'fix',
        toggle: name,
      });
    }
  }

  /* 3) 多个 bundle 同时声明 team 工具行（团队工具重复注册） */
  const teamProviders = bundles.filter((name) => {
    const meta = bundleMeta(name);
    return meta && meta.rowIds.some((id) => TEAM_ROW_IDS.has(id));
  });
  if (teamProviders.length > 1) {
    conflicts.push({
      code: 'duplicate-team-tools',
      severity: 'medium',
      title: '检测到多个团队工具提供者',
      detail: '以下 bundle 都插入了 agent-team/tool-agent-team 行：' + teamProviders.join(', ') + '。工具名会重复，spawn_teammate 等可能注册失败。',
      fixable: false,
      action: 'manual',
    });
  }

  return {
    profile: profile.name,
    profileDir: profile.dir,
    conflicts,
    scannedAt,
  };
}

/** 第一次加载时扫描；同一版本只扫一次（除非手动 rescan）。 */
export function scanIfNeeded(version) {
  const current = getDoctor();
  if (current && current.version === version && current.scannedAt && current.status) return current;
  const result = scanConflicts();
  const status = result.conflicts.length > 0 ? 'pending' : 'clean';
  return setDoctor({
    version,
    status,
    profile: result.profile,
    conflicts: result.conflicts,
    scannedAt: result.scannedAt,
    dismissed: false,
    fixApplied: false,
    restartRequired: false,
    conversationId: current && current.conversationId ? current.conversationId : undefined,
  });
}

function backupProfile(profile) {
  const backup = profile.pkgPath + '.bak-doctor-' + Date.now();
  copyFileSync(profile.pkgPath, backup);
  return backup;
}

function writeProfile(profile, pkg) {
  writeFileSync(profile.pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

/**
 * 执行 doctor 动作。
 * action: 'fix' | 'optout' | 'dismiss' | 'rescan'
 */
export function applyDoctorAction(action) {
  if (action === 'rescan') {
    const current = getDoctor();
    const result = scanConflicts();
    const status = result.conflicts.length > 0 ? 'pending' : 'clean';
    const next = setDoctor({
      version: (current && current.version) || '0.0.0',
      status,
      profile: result.profile,
      conflicts: result.conflicts,
      scannedAt: result.scannedAt,
      dismissed: false,
      fixApplied: false,
      restartRequired: false,
    });
    return { ok: true, action, doctor: next };
  }

  if (action === 'dismiss') {
    const next = setDoctor({ status: 'dismissed', dismissed: true, dismissedAt: Date.now() });
    return { ok: true, action, doctor: next };
  }

  const profile = findProfile();
  if (!profile) return { ok: false, error: '找不到安装本插件的 profile' };

  if (action === 'optout') {
    const backup = backupProfile(profile);
    const pkg = safeReadJson(profile.pkgPath) || profile.pkg;
    const bundles = pkg.dsh.profile.bundles || [];
    pkg.dsh.profile.bundles = bundles.filter((name) => name !== OUR_BUNDLE);
    writeProfile(profile, pkg);
    const next = setDoctor({
      status: 'opted-out',
      optedOutAt: Date.now(),
      restartRequired: true,
      backup,
    });
    return { ok: true, action, restartRequired: true, backup, doctor: next };
  }

  if (action === 'fix') {
    const backup = backupProfile(profile);
    const pkg = safeReadJson(profile.pkgPath) || profile.pkg;
    const bundles = pkg.dsh.profile.bundles || [];
    const removed = [];
    const keep = [];
    for (const name of bundles) {
      if (name === OUR_BUNDLE) {
        keep.push(name);
        continue;
      }
      const meta = inspectBundle(profile.dir, name);
      const conflict = meta.found && (OUR_PACKAGES.has(meta.packageName) || meta.rowIds.some((id) => OUR_ROW_IDS.has(id)));
      if (conflict) removed.push(name);
      else keep.push(name);
    }
    pkg.dsh.profile.bundles = keep;
    writeProfile(profile, pkg);
    const next = setDoctor({
      status: removed.length > 0 ? 'fix-applied' : 'manual',
      fixApplied: removed.length > 0,
      removed,
      restartRequired: removed.length > 0,
      backup,
      fixedAt: Date.now(),
    });
    return { ok: true, action, removed, restartRequired: removed.length > 0, backup, doctor: next };
  }

  return { ok: false, error: '未知动作: ' + String(action) };
}

/** 给「插件体检」对话用的说明文本。 */
export function doctorPrompt(doctor) {
  const lines = [];
  lines.push('【GK协助工作台 · 首次加载插件冲突检查】');
  lines.push('检测时间：' + new Date(doctor.scannedAt || Date.now()).toLocaleString());
  lines.push('当前 profile：' + (doctor.profile || '未知'));
  const conflicts = Array.isArray(doctor.conflicts) ? doctor.conflicts : [];
  if (conflicts.length === 0) {
    lines.push('没有发现冲突。');
  } else {
    lines.push('发现 ' + conflicts.length + ' 个冲突：');
    conflicts.forEach((item, index) => {
      lines.push((index + 1) + '. [' + item.severity + '] ' + item.title + '：' + item.detail + (item.fixable ? '（可自主修复）' : '（需要手动处理）'));
    });
    lines.push('');
    lines.push('请向用户说明以上冲突，并告知两个选择：A. 自主修复（我会备份 profile 的 package.json 后移除冲突项，重启生效）；B. 不使用 GK协助工作台（从 profile bundles 移除本插件，重启后生效）。');
    lines.push('用户可以直接在 GK协助工作台 的冲突弹窗里点按钮，也可以在这条对话里回答。不要自行修改 profile 文件，等用户明确选择后再操作。');
  }
  return lines.join('\n');
}

export { OUR_BUNDLE };
