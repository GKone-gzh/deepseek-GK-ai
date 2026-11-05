# 一键验收：宿主单测 + 客户端渲染冒烟 + 线上接口（需要 DSH 正在运行）
#
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\verify.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\verify.ps1 -Gui http://127.0.0.1:49866

param(
  [string]$Gui = $(if ($env:GK_GUI) { $env:GK_GUI } else { 'http://127.0.0.1:49866' })
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$test = Join-Path $repo 'packages\dsh-agent-cockpit\test\verify-all.mjs'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw '找不到 node 命令（把 DSH 自带的 node 加入 PATH，或直接运行 node test/verify-all.mjs）' }
if (-not (Test-Path -LiteralPath $test)) { throw "缺少 $test" }

Push-Location (Join-Path $repo 'packages\dsh-agent-cockpit')
try {
  & $node $test $Gui
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
