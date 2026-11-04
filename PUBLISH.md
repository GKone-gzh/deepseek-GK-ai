# 发布到 GitHub

仓库源码已经在一个干净的目录里：

```
D:\Deepseek\deliver\gk-assist-workbench
```

## 方式 A：有 GitHub CLI（推荐）

```powershell
winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements
gh auth login          # 选 GitHub.com → HTTPS → 浏览器登录
cd D:\Deepseek\deliver\gk-assist-workbench
powershell -NoProfile -ExecutionPolicy Bypass -File tools\publish.ps1 -Repo gk-assist-workbench
```

`publish.ps1` 会：初始化 git（如果还没有）→ 提交 → 用 `gh repo create --public --source . --push` 建仓库并推送 → 打 `v1.2.0` tag 并推送。

私有仓库把 `-Public` 换成 `-Private`。

## 方式 B：手工建仓库

1. 在 GitHub 网页 New repository：名字 `gk-assist-workbench`，不要勾 README/.gitignore/License
2. 本地：

```powershell
cd D:\Deepseek\deliver\gk-assist-workbench
git init
git add .
git commit -m "GK协助工作台 v1.2.0"
git branch -M main
git remote add origin https://github.com/GKone-gzh/gk-assist-workbench.git
git push -u origin main
git tag v1.2.0 && git push origin v1.2.0
```

3. 把 `packages/dsh-agent-cockpit/package.json` 里的 `repository.url` / `homepage` 里的 `<your-account>` 换成你的账号后再提交一次。

## 方式 C：直接上传 ZIP

如果本机无法登录 GitHub，直接上传 `gk-assist-workbench-v1.2.0.zip`（发布目录旁边），在 GitHub 网页用 “uploading an existing file” 拖进去，或解压后按方式 B 推送。

## 发布前检查

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\verify.ps1
# 期望：13/13 通过
```

## 说明

- `.gitignore` 已排除 `state.json`、`node_modules`、`.preview`、备份文件。
- `packages/dsh-context-core` 是 Apache-2.0 第三方代码，LICENSE 与 NOTICE 已随包保留；根目录 `NOTICE.md` 有署名与修改说明。
- 不要提交任何 `<DSH_HOME>` 下的运行数据（会话日志、state.json、插件备份）。
