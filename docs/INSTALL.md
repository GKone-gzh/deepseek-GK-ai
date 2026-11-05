# 安装 / 升级 / 卸载

## 前置

- Windows 10/11
- 已安装并至少启动过一次 DeepSeek Harness（DSH）
- Node 只用于跑验收；插件运行不需要你单独装 Node

## 一键安装

```powershell
git clone <this-repo> gk-assist-workbench
cd gk-assist-workbench
powershell -NoProfile -ExecutionPolicy Bypass -File tools\install.ps1
```

`install.ps1` 做三件事：

1. `packages/dsh-agent-cockpit` → `<DSH_HOME>\plugins\dsh-agent-cockpit`
2. 把 `dsh-agent-cockpit` 加进 profile `package.json` 的 `dsh.profile.bundles`（改前备份 `package.json.bak-gk-install-*`）
3. 在 profile `node_modules` 下建立 `dsh-agent-cockpit` → 插件目录的 Junction

装完**重启 DSH**。

自定义路径：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\install.ps1 -Profile desktop
$env:DSH_HOME = 'D:\dsh-home'
```

## 手动安装

1. 复制 `packages/dsh-agent-cockpit` → `<DSH_HOME>\plugins\dsh-agent-cockpit`
2. 编辑 `<profile>\package.json`，在 `dsh.profile.bundles` 加入 `dsh-agent-cockpit`
3. 建立目录联接：

```powershell
New-Item -ItemType Junction `
  -Path   "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-agent-cockpit" `
  -Target "$env:USERPROFILE\.dsh\plugins\dsh-agent-cockpit"
```

4. 重启 DSH

## 升级

```powershell
git pull
powershell -NoProfile -ExecutionPolicy Bypass -File tools\sync.ps1
```

host 代码需要重载插件：

```
plugin_manager set_plugin target=include:agent-cockpit enabled=false
plugin_manager set_plugin target=include:agent-cockpit enabled=true
```

client 代码刷新页面即可。

## 卸载

1. **推荐**：在工作台冲突/设置里选「不使用我们的插件」，或手动从 profile `package.json` 的 `dsh.profile.bundles` 移除 `dsh-agent-cockpit`
2. 删除目录联接：`profiles\<profile>\node_modules\dsh-agent-cockpit`
3. 删除 `<DSH_HOME>\plugins\dsh-agent-cockpit`
4. 删除 `<DSH_HOME>\plugins\dsh-agent-cockpit\state.json`（如保留目录）
5. 重启 DSH


## 排错

**装完看不到标签页**

- 看 profile `package.json` 的 `dsh.profile.bundles` 是否有 `dsh-agent-cockpit`
- 看 `profiles\<profile>\node_modules\dsh-agent-cockpit` 是否存在且是 Junction
- 重启 DSH；仍不行看 `<DSH_HOME>\logs` / `%APPDATA%\@deepseek-ai\dsh-desktop\logs`

**`ERR_PNPM_UNEXPECTED_STORE`**

本机 pnpm store v10/v11 不一致，DSH 的插件安装/卸载 UI 不可用。本插件就是为这种情况设计成「目录 + Junction」手动安装的，不要用 UI 装。

**冲突体检一直提示**

- 到 `<DSH_HOME>\plugins\dsh-agent-cockpit\state.json` 看 `doctor.conflicts`
- 处理后在冲突弹窗点「重新扫描」
- 想暂时不弹：点「暂不处理」

**协作模式切了没生效**

- 模式按根会话记录；确认你改的是当前会话的 Lead 会话
- `GET /agent-cockpit/state?session=<id>` 看实际值
- host 代码更新后需要重载插件（见「升级」）

**预算没中断**

- 预算按「本次任务」统计（最近一条人类消息之后）；发新消息会重置窗口
- 只有 `running` 且超预算的成员会被 interrupt；已结束成员不会
- 每 10 秒检查一次，最坏延迟一个 tick
