# GK协助工作台 · 卸载（Windows / PowerShell）
#
# 做三件事：
#   1) 从 profile package.json 的 dsh.profile.bundles 移除 dsh-agent-cockpit（先备份）
#   2) 删除 profile\node_modules\dsh-agent-cockpit 目录联接
#   3) 删除 <DSH_HOME>\plugins\dsh-agent-cockpit（含 state.json）
#
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\uninstall.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\uninstall.ps1 -Profile desktop

param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
$profileDir = Join-Path $DshHome "profiles\$Profile"
if (-not (Test-Path -LiteralPath $profileDir)) {
  throw "找不到 profile: $profileDir（用 -Profile <名字> 指定）"
}

$pkgPath = Join-Path $profileDir 'package.json'
$pluginDst = Join-Path $DshHome 'plugins\dsh-agent-cockpit'
$link = Join-Path $profileDir 'node_modules\dsh-agent-cockpit'

# 1) 从 bundles 移除
if (Test-Path -LiteralPath $pkgPath) {
  $pkg = Get-Content -LiteralPath $pkgPath -Raw | ConvertFrom-Json
  $bundles = @($pkg.dsh.profile.bundles)
  if ($bundles -contains 'dsh-agent-cockpit') {
    $backup = $pkgPath + '.bak-gk-uninstall-' + (Get-Date -Format 'yyyyMMddHHmmss')
    Copy-Item -LiteralPath $pkgPath -Destination $backup
    $pkg.dsh.profile.bundles = @($bundles | Where-Object { $_ -ne 'dsh-agent-cockpit' })
    $pkg | ConvertTo-Json -Depth 32 | Set-Content -LiteralPath $pkgPath -Encoding utf8
    Write-Host "已从 bundles 移除（备份: $backup）"
  } else {
    Write-Host "bundles 未登记，跳过"
  }
}

# 2) 删除目录联接（只删链接，不删目标目录）
if (Test-Path -LiteralPath $link) {
  $item = Get-Item -LiteralPath $link -Force
  if ($item.LinkType -eq 'Junction' -or $item.LinkType -eq 'SymbolicLink') {
    & cmd /c rmdir "$link" 2>$null
    if (Test-Path -LiteralPath $link) {
      [System.IO.Directory]::Delete($link, $false)
    }
    Write-Host "已删除目录联接: $link"
  } else {
    Write-Host "目标不是链接，跳过: $link"
  }
}

# 3) 删除插件目录
if (Test-Path -LiteralPath $pluginDst) {
  Remove-Item -LiteralPath $pluginDst -Recurse -Force
  Write-Host "已删除插件目录: $pluginDst"
}

# 旧版本可能留下独立引擎目录，仅提示，不自动删
$legacyEngine = Join-Path $profileDir 'node_modules\dsh-context-core'
if (Test-Path -LiteralPath $legacyEngine) {
  Write-Host "检测到旧引擎目录（已不再使用，可手动删除）: $legacyEngine"
}

Write-Host ''
Write-Host '卸载完成，重启 DSH 生效。'
