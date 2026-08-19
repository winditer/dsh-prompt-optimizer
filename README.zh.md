<p align="center">
  <img src="assets/screenshot.png" width="70%" alt="dsh-prompt-optimizer 预览卡片">
</p>

# dsh-prompt-optimizer

[English](README.md) | 中文

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-339933.svg)](package.json)
[![npm](https://img.shields.io/npm/v/dsh-prompt-optimizer.svg)](https://www.npmjs.com/package/dsh-prompt-optimizer)

DSH 输入框 prompt 优化插件：无需选中任何内容，直接输入草稿然后按 **✨**（或 `Alt+O`），插件会把它润色成更清晰、更结构化的高质量 prompt。**默认零配置**：直接经宿主服务复用当前会话模型，无需任何 API Key；也支持自配任意 OpenAI 兼容接口。

## ✨ 功能

- **一键优化**：输入栏右侧 ✨ 按钮，`Alt+O`（焦点在输入框内）等效触发
- **真·流式预览**：经宿主 `webServer` 的 SSE 推送（`llm.stream` 每个 `text-delta` 即时到达、逐 token 呈现）；**推理过程（reasoning）先出**，等待阶段就能看到模型思考
- **零配置默认**：复用当前会话/agent 默认模型（宿主 `agentDefaultModel` + `llm` 服务），无需 API Key
- **自配接口模式**：取消「使用当前会话模型」后，可填任意 OpenAI 兼容 `/chat/completions` 端点（地址 + Key + 模型名）
- **完成操作行**：替换草稿 / 一键复制 / 重新优化 / 放弃
- **双语界面**：跟随 DSH 语言（中文 / English）实时切换，无需刷新
- **配置自持持久化**：`~/.dsh/prompt-optimizer-config.json`（loopback RPC 读写，不依赖宿主 settings 注册表）
- **深色模式**：配色跟随 DSH 主题变量，深夜模式固定品牌蓝 + 白字保证可读
- **纯本地凭据**：API Key（仅自配模式）只存本地配置文件，只发往你配置的接口

## 截图

<p align="center">
  <img src="assets/screenshot.png" width="90%" alt="优化预览卡片：推理 + 流式结果">
</p>

## 环境要求

- [DSH](https://github.com/deepseek-ai/deepseek-harness)，`web` 或 `desktop` profile
- Node.js `^22.19.0` 或 `>=24.0.0`（仅源码构建需要）
- 装入 profile 时推荐 [pnpm](https://pnpm.io)

## 📦 安装

> Bundle 入口（`id: prompt-optimizer`）由本包的 `cordis.patch.yml` 自声明，无需手工补丁文件。

### 从 npm 安装

```sh
dsh plugin --profile desktop add dsh-prompt-optimizer
```

Web profile 用 `--profile web`。安装后重启 DSH（完全退出再打开），输入栏右侧会出现 ✨ 按钮。

### 源码开发方式

```sh
git clone https://github.com/winditer/dsh-prompt-optimizer.git && cd dsh-prompt-optimizer
npm install
npm run build          # 生成 dist/client.js
dsh plugin --profile desktop add .    # 按包名把工作区 link 进 profile
```

手工安装：在目标 profile 的 `package.json`（如 `~/.dsh/profiles/desktop/package.json`）中：

```jsonc
{
  "dependencies": {
    "dsh-prompt-optimizer": "link:/absolute/path/to/dsh-prompt-optimizer"
    // ...
  },
  "dsh": {
    "profile": {
      "bundles": [ /* ... */, "dsh-prompt-optimizer" ]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install` 并重启 DSH。

### 卸载

从 profile 的 `dependencies` 与 `dsh.profile.bundles` 移除 `dsh-prompt-optimizer`，清理安装目录，如不再需要可删除配置文件 `~/.dsh/prompt-optimizer-config.json`。

## 使用

- 在输入框输入草稿，点 **✨**（或 `Alt+O`）——输入区上方出现预览卡片
- 优化中：先是灰色小字实时滚动推理过程，随后润色结果逐 token 流入
- 完成：**替换草稿** 把结果写回输入框 · **复制** 复制到剪贴板 · **重新优化** 再来一次 · **放弃** 关闭
- 预览卡片绑定发起会话：切到别的会话自动隐藏，切回恢复

## ⚙️ 配置

打开 **设置 → 通用设置 → Prompt 优化**：

| 设置项 | 默认 | 说明 |
| --- | --- | --- |
| 使用当前会话模型 | 开 | 复用会话/agent 默认模型（零配置）。关闭后启用下列字段 |
| 接口地址 | `https://api.deepseek.com` | 任意 OpenAI 兼容 `/chat/completions` 端点 |
| API Key | — | 自配模式的密钥（跟随模式忽略） |
| 模型名 | `deepseek-v4-flash` | 模型名（跟随模式忽略） |

配置保存于 `~/.dsh/prompt-optimizer-config.json`（与 DSH 其他配置同目录，卸载插件时一并清理）。

> 自配接口需支持 CORS 与 SSE 流式（官方 DeepSeek / OneAPI 类网关均可）。

## 🏗️ 架构

一个包、两半：

- **server half**（`lib/index.js`）：经 loopback RPC 通道（`/dsh-prompt-optimizer`，`get`/`set`）持久化配置；并经宿主 `webServer` 服务注册 HTTP JSON API（`/dsh-prompt-optimizer/api`）。经 `llm.stream` 跑会话默认优化；后台流存于内存 `Map`，插件卸载即清。
- **client half**（`src/*.ts`，esbuild 打包为 `dist/client.js`，包 `__ModuleLoader__.load({ id: "dsh-prompt-optimizer", … })`——id **必须等于**安装包名）。渲染进 `conversation.input.right`（按钮）、`conversation.input.overlay`（预览卡）与 `settings.general.item`（设置行）；与 host 用 `fetch` POST 通信。

### Host API

全部为 `POST /dsh-prompt-optimizer/api/<method>`；响应均为 `{ ok: true, value }` 或 `{ ok: false, error }`。

| 方法 | Body | 返回 |
| --- | --- | --- |
| `sessionModel` | `{}` | `{ provider, model, reasoningEffort? }` — 会话默认模型 |
| `optimize.stream` | `{ provider, model, text, system?, reasoningEffort? }` | `text/event-stream` — 先 `event: reasoning` 帧，再逐 token `event: delta`，结束 `event: done` |
| `optimize.start` | `{ provider, model, text, system?, reasoningEffort? }` | `{ taskId }` — 后台累积（降级路径） |
| `optimize.poll` | `{ taskId }` | `{ done, text, error? }` — 流式过程中的累积文本 |
| `optimize.abort` | `{ taskId }` | `{ ok }` |

协议细节：仅接受 `POST`（否则 405）；body 为 JSON，上限 1 MB；未知方法返回 404。

## 🔒 安全说明

- **默认通道不发送任何凭据**——直接复用 harness 配置的 provider。
- **自配模式的 API Key 只留本地**（`~/.dsh/prompt-optimizer-config.json`），只发往你配置的接口。
- 优化内容只出现在预览卡片；只有按 **替换草稿** 才会写入会话。

## 🔧 开发

```sh
npm run build   # esbuild：src/index.ts → dist/client.js（__ModuleLoader__ bundle）
npm test        # node 运行 tests/entry.ts（状态机、通道、SSE 解析）
```

### 目录结构

```
src/index.ts          客户端入口 — 槽位接续、RPC/配置胶水、宿主探针
src/OptimizeButton.tsx / PreviewCard.tsx / SettingsRow.tsx
src/optimizer.ts      配置默认值、系统提示词、OpenAI 兼容 fetch/SSE 客户端
src/session-optimizer.ts  宿主通道：sessionModel + SSE 流 + 降级轮询
src/preview-state.ts  预览卡片状态机（纯 reducer）
src/preview-bus.ts    模块级事件总线（按钮/卡片/编排共享）
lib/index.js          server half — 配置持久化 + HTTP JSON API（makeHandler + createApiRoute）
dist/client.js        构建产物（__ModuleLoader__ 格式，load id = dsh-prompt-optimizer）
cordis.patch.yml      bundle 入口声明（insert: { id: prompt-optimizer, name: dsh-prompt-optimizer }）
scripts/build.mjs     构建脚本（esbuild + bundle 包装）
tests/entry.ts        单元 + 集成测试（61）
assets/               截图
```

### 踩过的坑

- **Bundle id 必须等于包名**——否则 `arrive()` 抛 `bundle loaded without registering <id>`。`scripts/build.mjs` 写死了正确 id。
- **Profile bundle 拿不到 cordis `timer` 服务**——用浏览器原生 `setInterval`/`setTimeout`（在 React effect 清理中释放），与姊妹包 `dsh-elf` 一致。
- **不要用 `session.create/fork` 做生成**——后台会话不会执行（渲染进程自编 id 被静默拒绝、fork 子会话不在前台不触发模型），实测表现是「永远正在优化」。改为由 server half 经 `llm.stream` 驱动模型。
- **不要把流式协议跑在 `connection.rpc.call` 上**——desktop 渲染进程的 rpc.call 在同一流程**第二次调用挂死**（实测 `sessionModel` 成功、下一次调用永不达）。宿主通道走 HTTP（`webServer`）。
- **优先 `link:` 而非 `file:`** 安装工作区副本——`file:` 是拷贝，改动/重构建后会过期。
- **client 改动刷新即生效；host（lib）改动需完整重启 DSH。**
- **构建脚本坏了会静默保留旧 bundle**——`npm run build` 必须打印 `✓ Built`；若只打印 Node 版本号就是脚本失败（曾有一次回归留下看起来「最新」的过期 `dist/client.js`）。
- **新发布可能触发 profile 的 `minimumReleaseAge` 策略**——若 profile 启用了 pnpm 的上架时效检查，发布于 ~24 小时内的版本执行 `dsh plugin … add <pkg>` 会报 `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`。把精确的 `name@version` 加进 profile 的 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`（每次发新版本记得更新）：

  ```yaml
  minimumReleaseAgeExclude:
    - dsh-prompt-optimizer@2.0.0
  ```

## 📄 License

[MIT](LICENSE)