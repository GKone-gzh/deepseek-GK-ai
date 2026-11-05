# Changelog

## 1.7.0 (2026-11-05)

- 编队新增 All / Running / Idle 过滤与成员搜索，归档入口移到过滤条。
- 协作星图新增缩放（− / 百分比 / +，60%–160%）。
- 界面动效：卡片/节点淡入、进度条生长、运行态脉冲、弹窗缩放、按钮按压反馈；支持 prefers-reduced-motion。
- 英文界面回归冒烟（上下文用量 / 协作星图 / 筛选标签）。

## 1.6.4 (2026-11-05)

- 修复英文界面残留中文：星图步数、上下文卡步数/总计等硬编码文案改用字典。
- 任务板负责人改为中文部门名（与星图/分工计划一致），原始 spawn 名保留 tooltip。
- 安装脚本支持自动探测唯一 profile，不再死认 desktop。
- 新增 tools/uninstall.ps1：从 bundles 移除、删除 junction 与插件目录。

## 1.6.3 (2026-11-05)

- 修复宿主插件未声明 inject：插件可能在 tools/systemPrompt 服务就绪前加载，导致 guard 与协作提示段静默缺失（coorddebug 显示 guard=false/prompt=false）。现在声明 webServer/sessions/agents/systemPrompt/tools，等就绪后再 apply。

## 1.6.2 (2026-11-05)

- 分工 Agent 的显示名改为中文部门：主管 / 技术部门 / 图像部门 / 测试部门 / 文档部门 / 数据部门 / 调研部门；同名部门自动加 A/B 后缀。
- 协作星图、成员卡、上下文卡、分工计划、效率表统一使用部门名，原始 spawn 名保留在 tooltip。
- 系统提示要求后续 spawn 使用中文部门名。

## 1.6.1 (2026-11-05)

- 上下文用量改成彩色卡片：每个 Agent 一张卡，显示上下文 token、计量消耗、用时；卡片按消耗量排序，配 8 色渐变。
- usage/family 增加会话时间范围与 duration（首个/最后事件时间），用于「用时」。

## 1.6.0 (2026-11-05)

- 拆掉内置的 dsh-context 引擎与「上下文」标签页，插件只保留自己的会话级工作台。
- 新增「上下文地形」：按 Agent 堆叠 input / cacheWrite / cacheRead / output 的柱状图，替代旧上下文页。
- 顶部「上下文」按钮改为滚动定位到上下文地形。
- 冲突体检不再检测 dsh-context / 引擎缺失（已不再内置引擎）。

## 1.5.0 (2026-11-05)

- 新增协作星图与上下文脉搏；编队卡片升级，顶部统计与 family 对齐。

## 1.4.0 (2026-11-04)

- 新增 `preset-council` agent preset：新对话的模式下拉里出现「计划商讨模式」，选中后该会话由 `council-preset` 行注入商讨协议，并把工作台协作模式切到 council。
- 新增 `council-preset.js`（preset-scoped 行）：同名遮盖默认协作提示，首轮组装时写入 mode=council，宿主 guard 拒绝 `ask_user_question`。
- 新增诊断接口 `GET /agent-cockpit/presets`（preset 名册 + 组合检查）。

## 1.3.0 (2026-11-04)

- 新增「计划商讨」协作模式：收到不明确任务后，先派 2-3 个 council 子 agent 从可行方案 / 风险反例 / 实现验收三个角度讨论，合并成《实施计划》展示给用户；用户确认后一次做到验收，不再中途询问。
- 宿主在 council 模式下拒绝 `ask_user_question`（避免执行期反复打断），需要用户决策的内容必须在计划里一次写清。
- 工作台协作模式变为四态循环：询问 → 自动 → 商讨 → 关闭；商讨模式页内提示建议开启完全权限。
- 新增 council 单测覆盖（提示词、ask 门禁、组队放行）。

## 1.2.0 (2026-11-04)

- 首次加载插件冲突体检（doctor）：扫描 profile 内已安装 bundle，检测重复的 dsh-context、重复包名、重复宿主行、多个团队工具提供者、内置引擎缺失。
- 检测到冲突时自动新建「插件体检」对话（`agents.create` + `steer`，失败则只保留弹窗），并在工作台自动弹出冲突说明。
- 用户动作：自主修复（移除已知冲突项，备份 profile package.json）、不使用本插件（从 bundles 移除，备份）、暂不处理、重新扫描。
- 新接口：`GET/POST /agent-cockpit/doctor`；`state.json` 增加全局 `doctor` 报告。
- 新增 `test/doctor-test.mjs`，verify-all 加入 doctor 单测与线上检查。

## 1.1.1 (2026-11-04)

- 修复 v1.1.0 的 ask 门禁在热重载后不生效：旧做法给每个 Agent 的 scope 装 guard + 同名 section，插件重载时旧注册会残留并遮蔽新逻辑。改为**全局注册一次**（`tools.guard` + 系统提示段 `gk-cockpit:coordination:v2`），对所有 Agent 立即生效，热重载不再依赖 agent 生命周期。
- 新增诊断接口 `GET /agent-cockpit/coorddebug`（版本、guard/section 是否装上、每个会话的人类消息/提问时间、预算根列表），用于确认线上门禁状态。
- 单测改为覆盖全局注册 + ask 判定 + debugInfo。

## 1.1.0 (2026-11-04)

- 新增「询问」协作模式并设为默认（`mode=ask`）：AI 判断任务需要多 agent 时，必须先调用 `ask_user_question` 向用户说明协作方案，用户同意后才允许 spawn/team 等协作工具；新任务需要重新询问。
- 协作模式按钮改为三态循环：询问 → 自动 → 关闭；`state.json` 新增 `ask` 取值，旧 `auto` 会话不受影响。
- 宿主新增 `session/event` 观察器，按「最近人类消息之后是否调用过 ask_user_question」判定询问状态；单测新增 ask 场景。
- `verify-all` 支持 ask 模式校验。

## 1.0.0 (2026-11-04)

- 历史团队归档：空闲成员可一键归档，编队卡片/分工计划隐藏，可展开「已归档」并恢复；只写 `state.json`，不删会话。
- `family` / `taskcost` 增加 3 秒 TTL 结果缓存，降低多面板轮询时的重复日志解码。
- 新增一键验收 `test/verify-all.mjs`：宿主单测 + 客户端冒烟 + 线上接口（state GET/POST、family、taskcost）。
- 文档更新为 v1.0.0。

## 0.7.0 (2026-11-04)

- 协作模式开关：`state.json` 按根会话持久化 `mode=auto|off`；off 时在 agent scope 注册 `tools.guard` 拒绝协作类工具，并注入单 agent 系统提示，切换即时生效。
- 预算熔断：宿主每 10 秒按「本次任务」统计成员用量，超预算的 running 队友会被 `agentTeams.interrupt`，熔断状态下拒绝继续 spawn/send。
- 本次任务增量成本：`GET /agent-cockpit/taskcost`，以最近一条人类消息为起点聚合；工作台新增对应 KPI 区块。
- `GET/POST /agent-cockpit/state`：模式、预算、熔断状态读写；状态文件写入走临时文件 + rename。
- 新增宿主单测：`state-test` / `usage-since-test` / `coordination-test`。

## 0.6.1 (2026-11-04)

- 修复 `/agent-cockpit/family?lead=<无效 id>` 让宿主以 `SessionQueryError` 致命退出：只对活着的 Lead 查子级，列表接口统一 await 并吞拒绝。
- 清理 profile 依赖里已不存在的 `maodie-ds-armor`（启动警告）。

## 0.6.0 (2026-11-04)

- 改名 **GK协助工作台**，UI 整体重做（品牌头、深色/浅色、空状态）。
- 活跃度分层：运行中展开、空闲成员折叠；全队空闲提示。
- 效率体检：会话累计 KPI + 逐成员明细。
- 分工计划：按成员列任务 + 关键路径 + 未分配/阻塞/写范围冲突。
- 输入框徽章降噪：无团队不显示、全空闲不显示数字。
- 编队卡片并入工作台；引擎「编队」标签页默认关闭（`fleetTab: hide`）。

## 0.5.x (2026-11-04 及更早)

- 合并 dsh-context：上下文页、编队页、上下文洞察、`/context`、侧边栏面板、提示词前后缀并入本插件；dsh-context 不再单独安装。
- 只读接口：`/agent-cockpit/usage|family|context|insights|projection`。
