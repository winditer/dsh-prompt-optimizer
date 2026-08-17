# dsh-prompt-optimizer

输入框 prompt 优化插件：一键把草稿润色为更清晰完整的 prompt（OpenAI 兼容 API，自配 Key）。

## 安装
```bash
npm run build
dsh plugin --profile web add .        # 契约 α：直接 add .（契约 β 场景则改为：dsh plugin --profile web add ./plugin）
```
`dsh plugin add .` 会按本包名（`dsh-prompt-optimizer`）写入 profile 依赖并把工作区链接进
`~/.dsh/profiles/web/node_modules/`。随后确认/追加 profile 的入口声明（`~/.dsh/profiles/web/cordis.patch.yml`，与本体 `cordis.patch.yml` 一致，**新建条目必须用 `insert:`**）：
```yaml
- insert:
    - id: prompt-optimizer
      name: dsh-prompt-optimizer
```
并在 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 中加入 `"dsh-prompt-optimizer"`。
重启 dsh web，刷新页面。

> 运行时注意：bundle 的 `load({id})` 必须等于**安装包名**（`dsh-prompt-optimizer`）——
> 图行 id = loader 入口的 `options.name`，`arrive()` 校验 bundle 恰注册该 id；本仓库 build 已按此产出。

## 使用
1. 设置 → 通用设置 → Prompt 优化：填接口地址（默认 https://api.deepseek.com）、API Key、模型名（默认 deepseek-chat），保存
2. 输入草稿 → 点输入栏右侧 ✨ 或按 Alt+O
3. 预览卡片：替换草稿 / 复制 / 重新优化 / 放弃

## 说明
- API Key 明文保存在本地 DSH 配置中（settings scope `prompt-optimizer`）
- 接口需支持 CORS（自建网关可参考 one-api 类方案）
- 卸载：移除 patch 行并 `rm -rf ~/.dsh/profiles/web/node_modules/dsh-prompt-optimizer`

## 开发
- `npm run build`：esbuild 打包 `dist/client.js`
- `npm test`：node 运行 `tests/entry.ts` 纯函数单测