/**
 * host/doctor.js 单测：冲突扫描 / 修复 / 停用 / 重扫，全部在临时 DSH_HOME 里做。
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'gk-doctor-'));
process.env.DSH_HOME = home;
process.env.GK_COCKPIT_STATE = join(home, 'plugins', 'dsh-agent-cockpit', 'state.json');

const profileDir = join(home, 'profiles', 'desktop');
mkdirSync(join(profileDir, 'node_modules', 'dsh-agent-cockpit'), { recursive: true });
mkdirSync(join(profileDir, 'node_modules', 'evil-bundle'), { recursive: true });

writeFileSync(join(profileDir, 'package.json'), JSON.stringify({
  name: 'desktop',
  dsh: { profile: { bundles: ['dsh-agent-cockpit', 'evil-bundle'] } },
}, null, 2));
writeFileSync(join(profileDir, 'node_modules', 'dsh-agent-cockpit', 'package.json'), JSON.stringify({
  name: 'dsh-agent-cockpit',
  version: '1.6.0',
  dsh: { bundle: { patch: './cordis.patch.yml' } },
}, null, 2));
writeFileSync(join(profileDir, 'node_modules', 'dsh-agent-cockpit', 'cordis.patch.yml'), [
  '- insert:',
  '    - id: agent-cockpit',
  '      name: dsh-agent-cockpit',
].join('\n'));
writeFileSync(join(profileDir, 'node_modules', 'evil-bundle', 'package.json'), JSON.stringify({
  name: 'evil-cockpit',
  dsh: { bundle: { patch: './cordis.patch.yml' } },
}, null, 2));
writeFileSync(join(profileDir, 'node_modules', 'evil-bundle', 'cordis.patch.yml'), [
  '- insert:',
  '    - id: agent-cockpit',
  '      name: evil-cockpit',
].join('\n'));

const doctor = await import('../host/doctor.js');
const state = await import('../host/state.js');

let failures = 0;
const expect = (ok, message) => {
  if (ok) console.log('ok:', message);
  else { failures += 1; console.log('FAIL:', message); }
};

/* 1) 扫描：应发现重复宿主行 */
const scan = doctor.scanConflicts();
expect(scan.profile === 'desktop', '识别 profile');
expect(scan.conflicts.some((item) => item.code === 'duplicate-row'), '发现重复宿主行冲突');

/* 2) scanIfNeeded 落状态 */
const first = doctor.scanIfNeeded('1.6.0');
expect(first.status === 'pending' && first.conflicts.length > 0, '首次扫描状态 pending');
const again = doctor.scanIfNeeded('1.6.0');
expect(again.scannedAt === first.scannedAt, '同版本不重复扫描');

/* 3) 自主修复：移除冲突 bundle（先备份） */
const fix = doctor.applyDoctorAction('fix');
expect(fix.ok === true, 'fix 执行成功');
expect(fix.removed.indexOf('evil-bundle') >= 0, '移除冲突 bundle');
expect(existsSync(fix.backup), '修复前已备份 package.json');
const pkgAfterFix = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'));
expect(pkgAfterFix.dsh.profile.bundles.indexOf('evil-bundle') < 0, 'bundles 不再含冲突 bundle');
expect(fix.restartRequired === true, '修复需要重启生效');

/* 4) 重扫应为 clean */
const rescan = doctor.applyDoctorAction('rescan');
expect(rescan.ok && rescan.doctor.status === 'clean', '修复后重扫为 clean');
expect(Array.isArray(rescan.doctor.conflicts) && rescan.doctor.conflicts.length === 0, '重扫无冲突');

/* 5) 停用我们的插件（先备份） */
const optout = doctor.applyDoctorAction('optout');
expect(optout.ok === true, 'optout 执行成功');
expect(existsSync(optout.backup), 'optout 前已备份');
const pkgAfterOpt = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'));
expect(pkgAfterOpt.dsh.profile.bundles.indexOf('dsh-agent-cockpit') < 0, 'bundles 不再含本插件');
expect(state.getDoctor().status === 'opted-out', '停用状态已落盘');

/* 6) dismiss */
const dismissed = doctor.applyDoctorAction('dismiss');
expect(dismissed.ok && state.getDoctor().status === 'dismissed', 'dismiss 状态已落盘');

rmSync(home, { recursive: true, force: true });
console.log(failures === 0 ? 'DOCTOR TEST OK' : 'DOCTOR TEST FAILURES: ' + failures);
process.exitCode = failures === 0 ? 0 : 1;
