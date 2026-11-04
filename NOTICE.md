# 第三方组件与致谢

本仓库的 `packages/dsh-agent-cockpit` 为原创代码，使用 MIT 许可证（见根目录 `LICENSE`）。

## dsh-context-core（内置上下文分析引擎）

`packages/dsh-context-core` 来自开源项目 **dsh-context v0.79.0**，使用 **Apache License 2.0**。

- 原始项目：https://github.com/deepseek-ai （dsh-context，具体发布地址以作者为准）
- 本仓库的修改（见 `packages/dsh-context-core/NOTICE.md`）：
  - `package.json` 的 `name` 改为 `dsh-context-core`，移除 `dsh.bundle`（不再自带宿主行）
  - `lib/index.js` 导出的 `name` 改为 `dsh-context-core`
  - `lib/client.js` 的 `__ModuleLoader__` 注册 id 与配置命名空间改为插件内使用的名字
  - 其余宿主逻辑、客户端 UI、接口与投影保持原样
- 完整许可证文本：`packages/dsh-context-core/LICENSE`

## DeepSeek Harness

本插件是 DeepSeek Harness（DSH）的第三方插件，未修改 DSH 本体。DSH 的版权归其作者所有。
