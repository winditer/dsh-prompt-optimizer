# dsh-skin-pack：DeepSeek Harness Web GUI 皮肤插件 — 设计文档

日期：2026-08-14
状态：已确认（用户逐节审阅通过）
DSH 版本：0.1.0-rc.6（运行于 http://127.0.0.1:3080）

## 1. 目标

为 DeepSeek Harness Web GUI 提供一个**独立 client 皮肤插件包**，注册 4 套可切换主题（护眼绿·浅 / 护眼绿·深 / 暖阳 / 赛博紫），在设置-外观下方新增「皮肤」选择入口，支持跟随系统明暗联动，选择持久化，界面文案中英双语。

## 2. 背景与约束（已验证的官方机制）

- DSH 内置主题体系：`ctx.theme.register({id, colorScheme, tokens})` 注册主题；`setTheme(id)` 切换；`theme/change` 事件广播快照。内置仅有 light/dark/system 三态。
- 内置「外观」设置行（`dsh-client-ui-theme`）是**硬编码**的浅色/深色/跟随系统三块，第三方主题不会自动出现在其中 → 插件必须自带「皮肤」选择入口。
- `setTheme(第三方id)` 不会写入内置 settings scope（`isThemePreference` 只认 light/dark/system）→ 插件需用自己的 settings namespace 持久化选择。
- 插件包契约（`dsh-client-modules` 验证）：
  - `package.json` 声明 `dsh.client = { platform: "web", inject: [...], immediately: true }`
  - `exports["./client"]` 指向构建产物，格式为 `window.__ModuleLoader__.load({id, factory})`
  - client-modules 扫描 host Loader 条目中声明 `dsh.client` 的包，注入 `window.__DSH_BOOT__` 并 serve `/plugins/<id>/client.js`
- 令牌体系：`--dsw-static-*`（静态色板，不覆盖）+ `--dsw-alias-*` / `--dsw-specific-*`（语义层，主题覆盖目标）。主题注册的 `tokens` 是语义层别名覆盖，值写具体 rgb。
- 设置 namespace scope API：`ctx.settingsScope.bind({namespace})` → `getSnapshot()/subscribe()/set(field, value)/unset(field)`。
- 设置行 slot：`ctx.slots.inject('settings.general.item', () => ctx.slots.register({name, id, order, store, locale, inject}, Component))`。
- 中英双语：`ctx.locale.register(ns, {zh, en})`，组件通过 `t` seat 取文案。
- 工具链：node v26 + pnpm 8.15.9 + esbuild 可用。

## 3. 包结构

```
dsh/                                  # /Users/haifeng/Documents/dsh
├── package.json                      # dsh.client 声明 + exports["./client"] → dist/client.js
├── src/
│   ├── index.ts                      # client 插件入口 apply(ctx)
│   ├── themes.ts                     # 4 套皮肤定义（id/colorScheme/tokens）
│   ├── tokens.ts                     # 核心令牌清单常量（语义层令牌名）
│   ├── SkinRow.tsx                   # 「皮肤」设置行组件（官方同款方块布局）
│   ├── settings-store.ts             # 皮肤选择 store（defineStore）
│   └── locales.ts                    # zh/en 文案字典
├── scripts/
│   └── build.mjs                     # esbuild 打包为官方 client.js 格式
├── dist/client.js                    # 构建产物
└── README.md                         # 安装/构建/卸载说明
```

## 4. 数据模型

### 4.1 主题 id 与命名空间

- 主题 id（`skin-` 前缀防冲突）：`skin-forest-light`、`skin-forest-dark`、`skin-amber`、`skin-cyber`
- settings namespace：`skin-pack`，字段 `skin`，合法值：上述 4 个 id 或 `"system"`

### 4.2 核心令牌清单（约 50 个语义令牌，4 套皮肤统一覆盖）

- 背景：`bg-base`、`bg-layer-1/2/3`、`bg-module-platform`、`bg-overlay`、`bg-multi-select`、`bg-skeleton`、`bg-mask-1/2/3`
- 品牌/主色：`brand-primary`、`brand-primary-invert`、`brand-text`、`brand-primary-new-colorprimary-new-color`
- 文字：`label-primary`、`label-secondary`、`label-tertiary`、`label-dimmed`、`label-caption`、`label-primary-bluish`、`label-primary-foreground`、`label-primary-inverted`
- 边框：`border-l1/l2/l3/l4`、`border-inverted`、`border-inverted2`、`border-l2-darkmode-thin`
- 按钮：`button-primary-fill`、`button-primary-hover`、`button-primary-dimmed`、`button-info-fill`、`button-info-hover`、`button-elevated-fill`、`button-floating-fill`、`button-floating-hover`、`button-contrast-fill`、`button-ghost-active-border`、`button-ghost-active-fill`、`button-ghost-active-hover`
- 交互态：`interactive-bg-hover`、`interactive-bg-active`、`interactive-bg-hover-accent`、`interactive-bg-hover-solid`、`interactive-bg-hover-danger`
- 状态色：`state-success-primary/secondary/tertiary`、`state-warn-primary/secondary/tertiary/label`、`state-error-primary/secondary`、`state-business-primary/tertiary`
- Markdown：`markdown-inline-code`、`markdown-code-block`、`markdown-code-block-banner`、`markdown-citation`、`markdown-tag`、`markdown-placeholder`、`markdown-code-segment-selected`、`markdown-code-segment-unselected`
- 组件特定：`specific-bubble`、`specific-bubble-highlight`、`specific-input-major`、`specific-sidebar-fill`、`specific-sidebar-nav-item-active`、`specific-sidebar-nav-item-active-accent`、`specific-sidebar-nav-item-hover`、`specific-menu`、`specific-selector`、`specific-tip`
- 其他：`toast-bg`、`tooltip-bg`、`scrollbar-bg-l1/l2`、`scrollbar-hover-l1/l2`

> `--dsw-static-*` 静态色板不覆盖。值直接写 rgb()/rgba()。

### 4.3 四套皮肤色板

**① 护眼绿·浅 `skin-forest-light`（colorScheme: light）**
- 背景：`bg-base rgb(246,248,243)`；layer 递进 `rgb(250,251,247)` → `rgb(240,243,236)`
- 主色：`rgb(52,133,96)`；hover `rgb(60,150,108)`；主按钮文字 `#fff`
- 文字：主 `rgb(45,55,48)` / 次 `rgb(96,110,100)` / 弱 `rgb(130,142,132)`
- 边框：`rgba(52,80,60,0.12)` 递进；代码块 `rgb(240,244,238)`；气泡 `rgb(232,240,231)`
- 状态：成功深绿、警告沿用琥珀、错误沿用红

**② 护眼绿·深 `skin-forest-dark`（colorScheme: dark）**
- 背景：`bg-base rgb(22,28,24)`；layer `rgb(28,35,30)` → `rgb(35,43,37)`
- 主色：`rgb(94,185,142)`；hover `rgb(110,200,158)`；主按钮文字 `rgb(15,22,17)`
- 文字：主 `rgb(225,233,226)` / 次 `rgb(168,182,172)` / 弱 `rgb(120,134,124)`
- 边框：`rgba(160,200,170,0.14)` 递进；代码块 `rgb(26,34,28)`

**③ 暖阳·浅 `skin-amber`（colorScheme: light）**
- 背景：`bg-base rgb(252,249,242)`；layer `rgb(255,252,246)` → `rgb(246,240,229)`
- 主色：`rgb(191,120,42)`；hover `rgb(205,134,52)`；主按钮文字 `#fff`
- 文字：主 `rgb(62,52,40)` / 次 `rgb(122,106,86)` / 弱 `rgb(160,146,126)`
- 边框：`rgba(120,90,50,0.12)` 递进；代码块 `rgb(246,240,230)`

**④ 赛博紫·深 `skin-cyber`（colorScheme: dark）**
- 背景：`bg-base rgb(17,15,26)`；layer `rgb(24,21,36)` → `rgb(31,27,46)`
- 主色：`rgb(167,90,255)`；hover `rgb(180,112,255)`；主按钮文字 `rgb(20,14,30)`
- 文字：主 `rgb(230,225,242)` / 次 `rgb(178,170,198)` / 弱 `rgb(128,120,148)`
- 边框：`rgba(180,140,255,0.16)` 递进；代码块 `rgb(24,20,34)`；气泡 `rgb(28,23,40)`

### 4.4 跟随系统映射

- 设置项共 5 个选项：跟随系统 / 护眼绿·浅 / 护眼绿·深 / 暖阳 / 赛博紫
- 选具体皮肤 → `ctx.theme.setTheme(id)` + 持久化 `skin-pack.skin = id`
- 选「跟随系统」→ 持久化 `'system'`，监听 matchMedia `(prefers-color-scheme: dark)`：亮 → `skin-forest-light`，暗 → `skin-forest-dark`（暖阳/赛博紫不参与自动映射）；启动时先读持久化值再应用

## 5. UI 入口

- 位置：设置 → General 区 item slot，`order: 20`（排在官方「外观」行 `order: 10` 之后）
- 外观：与官方「外观」行同款（标题 + 方块按钮横排），5 块：跟随系统、护眼绿·浅、护眼绿·深、暖阳、赛博紫
- 图标：优先复用官方 primitives 图标（`IconFollowsystemOutline16` 等）；无对应图标时用色块/首字符，不自造图标库
- 文案：`ctx.locale.register('settings.skin', {zh, en})`，跟随 DSH 语言设置

## 6. 数据流

启动顺序（apply）：

1. `ctx.theme.register()` 依次注册 4 套皮肤
2. `ctx.settingsScope.bind({namespace: 'skin-pack'})` 绑定持久化 scope
3. 读 scope 快照 `skin` 字段：有效 id → `ctx.theme.setTheme(id)`；`'system'`/未设置 → 跟随模式
4. `ctx.locale.register('settings.skin', {zh, en})`
5. `ctx.slots.inject('settings.general.item', ...)` 注册皮肤行
6. 订阅 `theme/change` → 同步 store 选中值
7. 跟随模式下订阅 matchMedia 变化 → 重新映射

用户点击：

```
点击方块 → setSkin(id) → settingsScope.set('skin', id)（持久化）
         → ctx.theme.setTheme(id) → theme/change → store 同步高亮
```

点击「跟随系统」：持久化 `'system'`，立即按当前系统明暗应用，之后实时跟随。

持久化写入失败：仍应用本次选择（会话内生效），仅不记住。

## 7. 错误处理

| 场景 | 处理 |
|---|---|
| 主题 id 冲突 | id 带 `skin-` 前缀 + 注册前 try/catch，冲突跳过该套并 console.warn |
| `setTheme` 遇未注册 id（持久化值过期） | try/catch，回退「跟随系统」并清除过期字段 |
| settings scope 不可用（memory 模式） | 降级会话内生效，皮肤行仍可用 |
| locale/slots 注入失败 | 仅皮肤行不显示，主题注册不受影响 |
| bundle 加载失败 | 官方 client 加载器隔离失败插件，GUI 其余功能不受影响 |

## 8. 安装与启用

```bash
npm run build                          # 构建 dist/client.js
dsh plugin --profile web add <包路径>  # 装入 profile node_modules
# ~/.dsh/profiles/web/cordis.patch.yml 插入：
# - id: skin-pack
#   name: dsh-skin-pack
重启 dsh web → GUI 生效
```

## 9. 测试

- 令牌完整性：脚本校验 4 套皮肤覆盖的令牌集合一致且均为真实存在的语义令牌
- 单元测试（如可行）：皮肤 id 校验、跟随系统映射函数、持久化值恢复逻辑
- 手工验证清单：
  - 4 套皮肤在设置-皮肤中可见、可切换、高亮正确
  - 刷新后选择保持
  - 跟随系统：切换系统明暗实时换肤（护眼绿浅/深）
  - 深色皮肤下文字/边框/代码块对比度可读
  - 中英文切换后皮肤行文案正确
  - 卸载插件（移除 patch 行）后 GUI 恢复正常

## 10. 范围外（YAGNI）

- 不做自定义 CSS 深度定制（字体/圆角/密度/动效）——仅令牌级换肤
- 不做用户自定义色板/编辑功能
- 不做皮肤市场/在线下载
- 不发布 npm（本地安装；如需发布后续再说）
