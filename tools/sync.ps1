# 把仓库里的源码同步到已安装的运行位置（不重新登记 bundle）
#
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\sync.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\sync.ps1 -Profile desktop

param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [string]$Profile = 'desktop'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$pluginSrc = Join-Path $repo 'packages\dsh-agent-cockpit'
$pluginDst = Join-Path $DshHome 'plugins\dsh-agent-cockpit'

foreach ($dir in @($pluginSrc, $pluginDst)) {
  if (-not (Test-Path -LiteralPath $dir)) { throw "目录不存在: $dir" }
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if ($node) {
  foreach ($file in @('index.js', 'client.js', 'host\usage.js', 'host\family.js', 'host\state.js', 'host\coordination.js', 'host\doctor.js')) {
    & $node --check (Join-Path $pluginSrc $file)
    if ($LASTEXITCODE -ne 0) { throw "语法检查失败: $file" }
  }
}

& robocopy $pluginSrc $pluginDst /MIR /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 失败（agent-cockpit）: $LASTEXITCODE" }

Write-Host '已同步。'
Write-Host 'host 代码需要重载插件生效：plugin_manager set_plugin target=include:agent-cockpit enabled=false → true；client 代码刷新页面即可。'
