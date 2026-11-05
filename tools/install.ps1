# GK协助工作台 · 一键安装（Windows / PowerShell）
#
# 做四件事：
#   1) 把 packages/dsh-agent-cockpit 复制到 <DSH_HOME>\plugins\dsh-agent-cockpit
#   2) 把 packages/dsh-context-core 复制到 <profile>\node_modules\dsh-context-core
#   3) 把 dsh-agent-cockpit 登记到 profile package.json 的 dsh.profile.bundles
#   4) 在 profile\node_modules 下建立 dsh-agent-cockpit 目录联接（Junction）
#
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\install.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\install.ps1 -Profile desktop

param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$pluginSrc = Join-Path $repo 'packages\dsh-agent-cockpit'
$engineSrc = Join-Path $repo 'packages\dsh-context-core'
$profileDir = Join-Path $DshHome "profiles\$Profile"

foreach ($dir in @($pluginSrc, $engineSrc)) {
  if (-not (Test-Path -LiteralPath $dir)) { throw "缺少源码目录: $dir" }
}
if (-not (Test-Path -LiteralPath $profileDir)) { throw "找不到 profile: $profileDir（确认 DSH 已安装并启动过）" }

$pluginDst = Join-Path $DshHome 'plugins\dsh-agent-cockpit'
$engineDst = Join-Path $profileDir 'node_modules\dsh-context-core'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pluginDst) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $engineDst) | Out-Null

Write-Host "同步工作台 -> $pluginDst"
& robocopy $pluginSrc $pluginDst /MIR /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 失败（agent-cockpit）: $LASTEXITCODE" }

Write-Host "同步上下文引擎 -> $engineDst"
& robocopy $engineSrc $engineDst /MIR /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 失败（context-core）: $LASTEXITCODE" }

# 登记 bundle
$pkgPath = Join-Path $profileDir 'package.json'
$pkg = Get-Content -LiteralPath $pkgPath -Raw | ConvertFrom-Json
if (-not $pkg.dsh) { $pkg | Add-Member -NotePropertyName dsh -NotePropertyValue ([pscustomobject]@{}) }
if (-not $pkg.dsh.profile) { $pkg.dsh | Add-Member -NotePropertyName profile -NotePropertyValue ([pscustomobject]@{}) }
if (-not $pkg.dsh.profile.PSObject.Properties['bundles']) {
  $pkg.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @()
}
$bundles = @($pkg.dsh.profile.bundles)

# 已安装独立 dsh-context 时先移除：它与本插件内置的 dsh-context-core 重复，
# 同时加载会重复注册上下文页/路由，用户侧表现就是一堆重复标签或加载报错。
if ($bundles -contains 'dsh-context') {
  $conflictBackup = $pkgPath + '.bak-gk-conflict-' + (Get-Date -Format 'yyyyMMddHHmmss')
  Copy-Item -LiteralPath $pkgPath -Destination $conflictBackup
  $pkg.dsh.profile.bundles = @($bundles | Where-Object { $_ -ne 'dsh-context' })
  if ($pkg.dependencies -and $pkg.dependencies.PSObject.Properties['dsh-context']) {
    $pkg.dependencies.PSObject.Properties.Remove('dsh-context')
  }
  if ($pkg.dependencies -and -not $pkg.dependencies.PSObject.Properties.Count) {
    $pkg.PSObject.Properties.Remove('dependencies')
  }
  $pkg | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $pkgPath -Encoding utf8
  $bundles = @($pkg.dsh.profile.bundles)
  Write-Host "检测到独立 dsh-context，已移除（备份: $conflictBackup）"
}
if ($bundles -notcontains 'dsh-agent-cockpit') {
  $backup = $pkgPath + '.bak-gk-install-' + (Get-Date -Format 'yyyyMMddHHmmss')
  Copy-Item -LiteralPath $pkgPath -Destination $backup
  $pkg.dsh.profile.bundles = @($bundles + 'dsh-agent-cockpit')
  $pkg | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $pkgPath -Encoding utf8
  Write-Host "已登记 bundle（备份: $backup）"
} else {
  Write-Host "bundle 已登记，跳过"
}

# 目录联接
$link = Join-Path $profileDir 'node_modules\dsh-agent-cockpit'
if (Test-Path -LiteralPath $link) {
  $item = Get-Item -LiteralPath $link -Force
  if ($item.LinkType -ne 'Junction' -and $item.LinkType -ne 'SymbolicLink') {
    throw "目标已存在且不是链接，请先手动处理: $link"
  }
  Write-Host "目录联接已存在: $link"
} else {
  New-Item -ItemType Junction -Path $link -Target $pluginDst | Out-Null
  Write-Host "已建立目录联接: $link -> $pluginDst"
}

Write-Host ''
Write-Host '安装完成。重启 DSH（或刷新页面）后，会话标签会显示「GK协助工作台」。'
Write-Host '首次加载会扫描插件冲突；有冲突时会自动弹窗并开一个「插件体检」对话。'
