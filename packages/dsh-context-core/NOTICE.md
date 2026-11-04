# NOTICE — 内置的上下文分析引擎

这个目录里的代码是 **dsh-context v0.79.0**（作者 bowenliang123，Apache-2.0）的副本，
作为 `dsh-agent-cockpit` 的内置引擎使用（宿主行 id `agent-cockpit-context`、
包名 `dsh-context-core`），不再作为独立插件安装。

上游：https://github.com/bowenliang123/dsh-context
许可证：见同目录 `LICENSE`（Apache License 2.0），原始版权与署名保留在源码头部注释中。

## 相对上游的修改（Apache-2.0 §4(b) 要求声明）

1. `package.json`
   - `name`: `dsh-context` → `dsh-context-core`
   - 删除 `dsh.bundle`（不再自带 `cordis.patch.yml` 宿主行，改由 `dsh-agent-cockpit` 的
     patch 插入 `agent-cockpit-context` 行）
   - 保留 `dsh.client`（platform/inject）与 `dsh.compatibility`
2. `lib/index.js`
   - 导出名 `name`: `dsh-context` → `dsh-context-core`（宿主行标识）
   - 其余逻辑未改
3. `lib/client.js`
   - `window.__ModuleLoader__.load({ id: 'dsh-context' , ... })` → `id: 'dsh-context-core'`
   - 配置/文案命名空间 `zm = 'dsh-context'` → `zm = 'agent-cockpit-context'`
     （使「设置 → 插件」里的配置卡片绑定到本插件实际存在的宿主行）
   - 其余逻辑未改

如需核对差异，可将本目录与 npm 包 `dsh-context@0.79.0` 的 `lib/` 逐字节比较（除上述改动外应一致）。
