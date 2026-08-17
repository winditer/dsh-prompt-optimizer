# dsh-prompt-optimizer

输入框 prompt 优化插件：一键把草稿润色为更清晰完整的 prompt（OpenAI 兼容 API，自配 Key）。

## 安装（目标：桌面应用所在的 profile —— 经实证是 **desktop**，不是 web）
```bash
npm run build
dsh plugin --profile desktop add .     # 按包名 dsh-prompt-optimizer 写入 deps + 物化链接
```
`dsh plugin add .` 会把工作区以 `link:`（实时 symlink）装进 profile。随后在
`~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 末尾加入
`"dsh-prompt-optimizer"`（入口由本体 `cordis.patch.yml` 的 `insert:` 自声明，见下）。
注意（两个坑，均已实证踩过）：
- **user 层（`cordis.patch.yml`）不要重复 insert 同 id**——loader 装载抛
  `duplicate loader entry id: prompt-optimizer`，整层失败、插件不进树；
- **依赖 spec 用 `link:` 而非 `file:`**——`file:` 装的是**复制**，工作区改动不生效、一直陈旧；
  `link:` 是 symlink，rebuild 后即时可见。
本体 `cordis.patch.yml`（入口声明，随包分发）：
```yaml
- insert:
    - id: prompt-optimizer
      name: dsh-prompt-optimizer
```
重启桌面应用（完全退出再打开），刷新页面。

> **配置持久化（实测架构）**：不走 client 的 settingsScope——桌面应用 host 的 settings 注册表只对
> 内置/市场安装注册的 namespace 返回可用状态；手工装配进 profile 的插件没有该注册，
> `getSnapshot()` 返回 `{status:"unavailable", mode:"host"}`、`set()` 静默失效（已实测定位）。
> 改用与 dsh-sticky-note（先例、运行中）相同的自持模式：
> - `lib/index.js`（server half）直接读写 `~/.dsh/prompt-optimizer-config.json`（node fs，无第三方依赖），
>   并经 loopback RPC 通道 `/dsh-prompt-optimizer` 暴露 `get`/`set`；
> - client 通过 `connection.rpc.call('/dsh-prompt-optimizer', ...)` 读写，配置镜像即时更新。
> 配置文件与用户的其他 DSH 配置同目录，卸载时随插件清理。

> 运行环境备注：桌面应用（Electron）内嵌的 dsh 服务走 **desktop profile**（其组合含
> dsh-better-sidebar/dshmarket 等）；`dsh-plugin-desktop` 等宿主条目需要 `desktopRuntime`
> 服务、只能在桌面应用进程内激活，所以**不要用裸 `dsh web` CLI 验证桌面插件**。
> desktop 安装时 `dsh plugin add` 可能被 profile 的 supply-chain 策略
> （minimumReleaseAge，存量 violation）拦下——属现网既有状态，可手工
> 改 package.json（deps + bundles）并 `ln -s` 等效安装。

> 运行时注意：bundle 的 `load({id})` 必须等于**安装包名**（`dsh-prompt-optimizer`）——
> 图行 id = loader 入口的 `options.name`，`arrive()` 校验 bundle 恰注册该 id；本仓库 build 已按此产出。

## 使用
1. 设置 → 通用设置 → Prompt 优化：填接口地址（默认 https://api.deepseek.com）、API Key、模型名（默认 deepseek-chat），保存
2. 输入草稿 → 点输入栏右侧 ✨ 或按 Alt+O
3. 预览卡片：替换草稿 / 复制 / 重新优化 / 放弃

## 说明
- API Key 明文保存在 `~/.dsh/prompt-optimizer-config.json`（与便签的 `sticky-note-config.json` 同款自持模式）
- 接口需支持 CORS（自建网关可参考 one-api 类方案）
- 卸载：从 `~/.dsh/profiles/desktop/package.json`（deps + `dsh.profile.bundles`）移除并以 `pnpm --filter dsh-prompt-optimizer remove --dir ~/.dsh/profiles/desktop` 清除链接（或直接 `rm -rf ~/.dsh/profiles/desktop/node_modules/dsh-prompt-optimizer` + `~/.dsh/prompt-optimizer-config.json`）

## 开发
- `npm run build`：esbuild 打包 `dist/client.js`
- `npm test`：node 运行 `tests/entry.ts` 纯函数单测