# dsh-prompt-optimizer：DSH 输入框 Prompt 优化插件 — 设计文档

日期：2026-08-16
状态：已确认（用户逐节审阅通过）
DSH 版本：0.1.0-rc.6（运行于 http://127.0.0.1:60179）
前置项目：`dsh-skin-pack`（同目录先例，插件形态与构建链路复用其成熟模式）

## 1. 目标

为 DeepSeek Harness Web GUI 提供一个**纯 client 插件**「Prompt 优化」：

- 输入栏提供「✨ 优化」按钮 + 键盘快捷键（`Alt+O`），触发对**当前草稿**的润色改写
- 润色含义（用户已确认）：**保持原意不变**，把草稿改写为更清晰、结构更完整的 prompt，可补全缺失的目标 / 约束 / 输出格式等信息；不编造事实，不改变用户意图
- 优化结果以**预览卡片**（输入区上方 overlay）呈现，提供：替换草稿 / 复制 / 重新优化 / 放弃
- 模型来源（用户已确认）：**插件自配 OpenAI 兼容 API**（接口地址 / API Key / 模型名），浏览器侧直接调用，不依赖 DSH 宿主
- 设置 → General 新增「Prompt 优化」设置行，点击展开配置表单；配置经 settingsScope 持久化
- 界面文案中英双语；交互与既有皮肤插件同构

## 2. 背景与约束（已验证的官方机制）

- 插件包契约（`dsh-client-modules` 验证）：`package.json` 声明 `dsh.client = {platform: "web", inject: [...], immediately: true}`；`exports["./client"]` 指向构建产物，格式为 `window.__ModuleLoader__.load({id, factory})`。既有 `dsh-skin-pack` 已按此打通 build → install → 生效链路（`scripts/build.mjs` + `dist/client.js`）
- 输入栏扩展槽（`dsh-client-ui-conversation` 声明）：
  - `conversation.input.right`：list slot，输入栏右侧扩展区，可挂「优化」按钮
  - `conversation.input.overlay`：list slot，会话 scope，输入区浮层 —— 预览卡片挂载点（官方 `MenuView` 也挂这里，互不冲突）
- 会话输入状态 provide-channel 提供 per-session `actions`，含 `setDraft(text)` 与 `submit()`（`SessionInputShell.actions`，lib 中已确认）——替换草稿的官方通道；实施时确认该 provide-channel 的导入路径/类型
- 设置行 slot：`ctx.slots.inject('settings.general.item', ...)` + `ctx.slots.register({name, id, order, store, locale, inject}, Component)`（皮肤插件同款，order 30，排在官方外观行 order 10 与皮肤行 order 20 之后）
- settings namespace：`ctx.settingsScope.bind({namespace})` → `getSnapshot()/subscribe()/set(field, value)/unset(field)`
- 中英双语：`ctx.locale.register(ns, {zh, en})`，组件经 `t` seat 取文案
- 工具链：node v26 + pnpm + esbuild 可用（皮肤插件已用）

## 3. 包结构与命名

- 包名：`dsh-prompt-optimizer`
- 插件 id：`prompt-optimizer`（bundle 的 `load({id})` 与 patch 行统一）
- settings namespace：`prompt-optimizer`
- locale namespace：`prompt_optimizer`

```
dsh/                                  # /Users/haifeng/Documents/dsh
├── package.json                      # 名称 dsh-prompt-optimizer + dsh.client 声明 + exports["./client"]
├── src/
│   ├── index.ts                      # 客户端插件入口 apply(ctx) + inject 声明
│   ├── optimizer.ts                  # 纯函数：配置校验、OpenAI 兼容调用（fetch+AbortSignal）、结果提取
│   ├── OptimizeButton.tsx            # 输入栏右侧「优化」按钮（loading/禁用态）
│   ├── PreviewCard.tsx               # overlay 预览卡片（替换/复制/重试/放弃）
│   ├── SettingsRow.tsx               # 设置行 + 展开表单
│   ├── settings-store.ts             # 配置 store（defineStore + settingsScope 绑定/订阅）
│   └── locales.ts                    # zh/en 文案字典
├── scripts/build.mjs                 # 复用皮肤插件脚本，id 改为 prompt-optimizer
├── dist/client.js                    # 构建产物
└── README.md                         # 安装/构建/配置/卸载说明
```

## 4. 数据模型

### 4.1 settings 字段（namespace `prompt-optimizer`）

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `baseUrl` | string | `https://api.deepseek.com` | OpenAI 兼容接口根地址，无需 `/v1` 后缀，调用时拼 `/chat/completions` |
| `apiKey` | string | 空 | API Key，password 输入框；明文本地存储（DSH settings 文件，文档注明） |
| `model` | string | `deepseek-chat` | 模型名 |

未配置（apiKey 为空）时「优化」按钮仍可点，但点击后在预览卡片位置提示「请先在设置中配置 API」并附「去设置」操作，引导展开设置行表单。

### 4.2 请求与系统提示词

- 请求：`POST {baseUrl}/chat/completions`，Header `Authorization: Bearer {apiKey}`、`Content-Type: application/json`；body：`{model, messages, temperature: 0.7, max_tokens: 2048, stream: false}`
- 系统提示词（按界面语言选 zh/en 一套；纯函数 `buildSystemPrompt(lang)` 组装）：

> zh：你是一名 prompt 优化专家。用户会给你一段草稿 prompt，请在不改变其意图的前提下将其改写为更清晰、更结构化的高质量 prompt：补充缺失的目标、约束与期望输出格式（可从上下文合理推断），使用简洁明确的语言，去掉冗余。不得编造草稿中不存在的事实或技术细节。只输出优化后的 prompt 正文，不要任何解释、前缀或代码块包裹。

（en 为对应英文版）

- 用户消息：`{role: "user", content: 草稿原文}`
- 结果提取：取 `choices[0].message.content`，剥离首尾空白；若整体被 ``` 代码块包裹则解除包裹（纯函数 `extractResult(raw)`）

## 5. UI 设计

### 5.1 「优化」按钮（`conversation.input.right`，order 0）

- 「✨」文本图标 + 无文字（或 aria-label「优化 prompt」，避免占用输入栏空间）
- 状态机：`idle`（可点）→ `loading`（转圈 disabled，防重复触发）→ `idle`
- 输入框为空 / 无当前会话：disabled
- 图标策略同皮肤插件：优先复用官方 primitives 图标，无对应则用文本 emoji，不自造图标库

### 5.2 快捷键 `Alt+O`

- 作用域：焦点位于 composer textarea 内时全局 keydown（`e.altKey && e.code === 'KeyO'`）
- 行为：等同点击按钮；无当前会话/空草稿时忽略
- 实施时确认与 DSH 既有快捷键无冲突（如有冲突则改用 `Alt+Shift+O` 并在 README 注明）

### 5.3 预览卡片（`conversation.input.overlay`）

- 卡片式浮层：标题「优化结果」+ 正文（可滚动、保留换行，最多 ~12 行显示）+ 操作行
- 操作：**替换草稿**（`actions.setDraft(结果)`，关闭卡片）、**复制**（navigator.clipboard，短暂「已复制」反馈）、**重新优化**（重新请求）、**放弃**（关闭卡片）
- 请求进行中：卡片底部显示轻量 loading 态
- 失败：卡片内错误提示（见 §6）+「重试」按钮
- 空/未配置引导：见 §4.1

### 5.4 设置行（`settings.general.item`，order 30）

- 与皮肤插件同款设置行外观：标题「Prompt 优化」+ 一行说明（当前模型/是否已配置 key 摘要）
- 点击展开内联表单：`baseUrl` / `apiKey`（password）/ `model` 三字段 + 保存 / 恢复默认
- 保存写入 settingsScope；失败则提示并保留会话内值

### 5.5 文案（locale ns `prompt_optimizer`）

覆盖：按钮 aria-label、卡片标题/四个操作、loading、各类错误文案、设置行标题/说明/字段 label/保存/恢复默认、未配置引导等，zh/en 各一套。

## 6. 错误处理

| 场景 | 处理 |
|---|---|
| apiKey 未配置 | 不发起请求；预览卡片位置显示引导文案 +「去设置」 |
| 草稿为空 / 无会话 | 按钮 disabled；快捷键忽略 |
| HTTP 401/403 | 错误文案「API Key 无效或已过期」+ 重试 |
| 网络失败 / 超时（60s） | 「请求失败/超时，请检查网络与接口地址」+ 重试；AbortController 取消与超时 |
| 其他 4xx/5xx | 显示 HTTP 状态码与出错阶段 + 重试 |
| 服务端禁止 CORS | 提示「接口不支持跨域，请换用支持 CORS 的网关（如 one-api 类）」 |
| 结果为空 / 非 200 JSON 结构异常 | 「返回内容为空或格式异常」+ 重试 |
| settings 写入失败 | 本次会话内生效，不阻塞功能 |
| 插件 bundle 加载失败 | 官方客户端加载器隔离失败插件，GUI 其余功能不受影响（不额外处理） |

所有请求可随时由新请求 / 组件卸载取消（AbortController + generation 把关，防过期响应覆盖新结果）。

## 7. 数据流

启动（apply）：

1. `ctx.inject` 声明的服务就绪后，绑定 settingsScope（ns `prompt-optimizer`）
2. `ctx.locale.register('prompt_optimizer', {zh, en})`
3. 订阅 settings 变化 → 更新配置 store（含跨标签页）
4. `ctx.slots.inject('conversation.input.right', ...)` 注册按钮
5. `ctx.slots.inject('conversation.input.overlay', ...)` 注册预览卡片（会话 scope；卡片挂载期间读当前会话 input-state draft）
6. `ctx.slots.inject('settings.general.item', ...)` 注册设置行（order 30）
7. 注册全局快捷键监听（Alt+O，textarea 焦点内）

用户点击：

```
按钮/快捷键 → store 读配置与 draft
  ├─ 无 key → 引导卡片
  └─ 有 key → loading → optimizer.optimize({config, text, lang, signal})
       ├─ 成功 → 预览卡片（含结果）→ 操作：
       │    替换 → actions.setDraft(result)  // 会话输入状态官方通道
       │    复制 → clipboard
       │    重试 → 重新 optimize
       │    放弃 → 关闭卡片
       └─ 失败 → 卡片错误态 + 重试
```

## 8. 测试

- 单元（纯函数 `optimizer.ts`）：
  - `validateConfig`：URL 非法 / apiKey 空 / model 空 的判定
  - `buildSystemPrompt(lang)`：zh/en 各返回非空且不含占位符
  - `extractResult(raw)`：普通文本、``` 包裹、首尾空白、空字符串
  - 请求体组装（含 baseUrl 去尾斜杠、拼接 `/chat/completions`）
- 手工验证清单：
  - 按钮在输入栏右侧出现；无会话 / 空草稿 disabled
  - 配置后点击 → loading → 预览卡片出现；四操作各自生效（替换后输入框内容变化、复制到剪贴板、重试再次请求、放弃关闭）
  - Alt+O 在 textarea 焦点内触发、焦点在外不触发
  - 未配置 key → 引导提示 +「去设置」可展开表单
  - 设置保存后刷新页面配置保持；表单恢复默认生效
  - 401 / 网络断开 / 60s 超时 → 对应错误文案 + 重试
  - 中英文切换后按钮、卡片、设置行文案正确
  - 与皮肤插件共存：两者设置行、槽位互不干扰；卸载本插件（patch 移除行）后 GUI 恢复正常

## 9. 安装与启用

```bash
npm run build                          # 构建 dist/client.js
dsh plugin --profile web add <包路径>  # 装入 profile node_modules
# ~/.dsh/profiles/web/cordis.patch.yml 插入：
# - id: prompt-optimizer
#   name: dsh-prompt-optimizer
重启 dsh web → GUI 生效
```

## 10. 范围外（YAGNI）

- 斜杠命令 `/optimize` 入口（方案 B，已排除；作为后续迭代候选）
- 自动发送优化结果、多策略（扩写/翻译/精简）、多版本候选
- 流式输出（SSE）——后续迭代候选
- 优化历史/收藏、代理配置、加密存储 API Key
- 宿主侧配套（本插件为纯 client，无 host 代码）