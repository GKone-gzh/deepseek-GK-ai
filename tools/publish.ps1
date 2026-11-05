# 发布到 GitHub（需要已安装 git + gh 并登录）
#
#   winget install --id GitHub.cli -e
#   gh auth login
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\publish.ps1 -Repo gk-assist-workbench
#
param(
  [string]$Repo = 'gk-assist-workbench',
  [string]$Owner = '',
  [switch]$Private
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $git = (Get-Command git -ErrorAction SilentlyContinue).Source
  if (-not $git) { throw '找不到 git。先 winget install --id Git.Git -e' }
  $gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
  if (-not $gh) { throw '找不到 gh。先 winget install --id GitHub.cli -e，并 gh auth login' }

  & $gh auth status *> $null
  if ($LASTEXITCODE -ne 0) { throw 'gh 尚未登录：先执行 gh auth login（浏览器授权）' }

  if (-not (Test-Path (Join-Path $root '.git'))) {
    & $git init *> $null
    & $git add .
    & $git -c user.name='GK' -c user.email='gk@local' commit -m 'GK协助工作台 v1.2.0' *> $null
    & $git branch -M main
  }

  $target = if ($Owner) { "$Owner/$Repo" } else { $Repo }
  $visibility = if ($Private) { '--private' } else { '--public' }
  $existing = (& $gh repo view $target 2>$null)
  if ($LASTEXITCODE -ne 0) {
    & $gh repo create $target $visibility --source . --remote origin --push --description 'GK协助工作台：可观察、可控制、可算成本的多 Agent 协作工作台（DeepSeek Harness 插件）'
    if ($LASTEXITCODE -ne 0) { throw "gh repo create 失败（$target）" }
  } else {
    & $git remote remove origin 2>$null
    & $git remote add origin ("https://github.com/$target.git")
    & $git push -u origin main
  }

  $tag = 'v1.2.0'
  & $git tag $tag 2>$null
  & $git push origin $tag 2>$null

  $url = (& $gh repo view $target --json url --jq .url)
  Write-Host "已发布: $url"
} finally {
  Pop-Location
}
