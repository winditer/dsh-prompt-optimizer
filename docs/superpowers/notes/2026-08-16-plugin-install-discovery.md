# 安装契约发现 — dsh-prompt-optimizer Task 1

日期：2026-08-16
范围：只读发现（未改任何 profile 配置、未运行安装命令）
环境：macOS；node v26.0.0（engines ^22.19 || >=24 满足）；工作区仅装 esbuild 0.25.12

## 结论：契约 α（profile 直链工作区）

**profile 通过 `file:` 依赖直链到工作区；安装时工作区 `package.json` 以硬链接形态落进 web profile 的 `dsh-skin-pack/`；Loader 扫描带 `dsh.client` 的包，按其 `exports["./client"]` 在 `/plugins/<id>/client.js` 提供 bundle。**

## 1) 皮肤插件在 profile 中的真实形态 — 硬链接（同一 inode）

```bash
$ ls -la ~/.dsh/profiles/web/node_modules/dsh-skin-pack/
# 仅两项：docs/ 与 package.json（无 src/、scripts/、dist/）

$ stat ~/.dsh/profiles/web/node_modules/dsh-skin-pack/package.json /Users/haifeng/Documents/dsh/package.json
# 16777231 226657463 -rw-r--r-- 2 haifeng staff 7594 ...  (profile)
# 16777231 226657463 -rw-r--r-- 2 haifeng staff 7594 ...  (workspace)
#   ↑ 同一 inode 226657463、link count = 2 → 硬链接，同一物理文件
```

Profile 侧 `package.json`（web profile 根）：

```json
"dependencies": {
  "dsh-skin-pack": "file:/Users/haifeng/Documents/dsh",   // file: 直链工作区
  "dshmarket": "^1.2.4"
}
```

→ 安装命令 `dsh plugin --profile web add .` 等价于在 profile 目录执行 pnpm add，按 `file:` 协议把工作区接入，pnpm（hoisted linker）以硬链接形式把工作区 `package.json` 落进 `node_modules/dsh-skin-pack/package.json`。docs/ 子目录同样硬链了 1 个文件（spec md，link count 2）。**注意：dist/、scripts/、src/ 没有进 profile 目录**（工作区 `files` 字段不含 dist/，见下文「意外发现」）。

## 2) profile 补丁层 cordis.patch.yml

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: skin-pack
  name: dsh-skin-pack
```

→ 插件以 patch 条目激活：`id`（bundle 注册 id）与 `name`（profile 中依赖名）。

## 3) dsh CLI 插件子命令

`dsh` 不在 shell PATH（runtime-commands/bin 只有 pnpm），但存在于 profile 的 `.bin`：

```bash
$ ~/.dsh/profiles/web/node_modules/.bin/dsh --help
# Commands:
#   plugin [options] [args...]  manage a profile's plugins by forwarding the
#                               remaining arguments to pnpm in the profile directory
# Examples:
#   dsh plugin --profile tui add <package>     install a plugin into the tui profile

$ ~/.dsh/profiles/web/node_modules/.bin/dsh plugin --profile web --help
# → pnpm help（Version 10.34.1）…确认 plugin 子命令 = 在 profile 目录转发 pnpm
```

→ 安装路径 `dsh plugin --profile web add .` 即「在 `~/.dsh/profiles/web/` 里 pnpm add 工作区路径」。

## 4) 运行中 GUI（60179）的插件 bundle 服务路径

```bash
$ curl -s http://127.0.0.1:60179/assets/index-*.js | grep -o '/plugins/[a-zA-Z0-9._/-]*' | sort -u
# /plugins/
# /plugins/dsh-better-sidebar/client.js
# /plugins/dsh-message-rail/client.js
# /plugins/dsh-plugin-desktop/client.js
# /plugins/dsh-sticky-note/client.js
# /plugins/dshmarket/client.js
```

- `/plugins/dsh-plugin-desktop/client.js` → **HTTP 200**，md5 `53b3233b…` 与 `~/.dsh/profiles/node_modules/dsh-plugin-desktop/lib/client.js` 完全一致（`window.__ModuleLoader__.load({id: "dsh-plugin-desktop", factory…})`）。
- `/plugins/dsh-skin-pack/client.js` → **HTTP 404**（web profile 的 skin-pack 目录没有 dist/，且当前 GUI 未加载 web profile 的皮肤插件）。

Loader 契约（`@deepseek-ai/dsh-client-modules/lib/client.js` 源码注释直接证实）：

```
* A plugin bundle IS its package's client half: `<id>/client` (the exports
* subpath external bundles emit) and the bare graph id name the same
```

→ 即「插件的 client bundle 就是其包的 `exports["./client"]` 指向的产物，以 `/plugins/<id>/client.js` 提供」。

## 5) HMR dev watcher

`ps aux | grep -i "dev:web\|vite\|esbuild.*watch"` 被本地沙箱拦截（`Operation not permitted`）；fallback `pgrep -fl "vite|esbuild|dev:web"` → **未发现任何 vite / esbuild / dev:web 进程**。60179 服务的 bundle 与磁盘上已构建产物 md5 一致 → **当前无 HMR dev watcher，bundle 为静态提供**。

## 意外发现 / 注意点（记录给后续任务）

1. **工作区 `package.json` 的 `name` 是 `dsh-plugin-desktop`**（旧桌面壳包名），而 profile 中的依赖键 / patch name 是 `dsh-skin-pack`——profile 侧别名来自依赖键与 patch 条目，不要求与包内 name 相等。Task 1 按任务要求「其余字段不动」，不改 name。
2. **工作区 `files` 字段不含 `dist/`**：`file:` 安装只把 package.json（+ files 列到的 docs）带进 profile，dist/ 不跟包 → 本轮改造后如需 profile 生效，Task 6 安装时需确保 bundle 可达（`exports["./client"]` 指向 `./dist/client.js`，Loader 按该路径提供）。
3. **当前 60179 GUI 加载的是 desktop profile 那一组插件**（better-sidebar / message-rail / sticky-note / dshmarket / dsh-plugin-desktop），web profile 的 skin-pack 未在服务中——不影响契约结论，但意味着「改工作区 package.json 后 GUI 立即生效」无法在本轮验证（安装/重启属 Task 6）。
4. `dsh` CLI 在系统 PATH 上不存在；实际可用的是 `~/.dsh/profiles/web/node_modules/.bin/dsh`。
5. **编辑工作区 package.json 会切断硬链接（重要）**：本任务 Step 2 用文本编辑改写 `/Users/haifeng/Documents/dsh/package.json` 后，inode 变为 227174157（link count 1），而 profile 侧 `dsh-skin-pack/package.json` 仍是原 inode 226657463（link count 1）。即：编辑工具以「原子替换」写文件 → 硬链接断开，profile 侧**保持编辑前的旧内容**（`dsh.client.inject` 仍为 runtime + ui-theme、`./client` 仍指 `./lib/client.js`）。这符合「本任务不改 ~/.dsh」的约束（profile 未被触碰），但意味着：**想让 profile 曝光新元数据，必须在安装步骤（Task 6）重新执行 `dsh plugin --profile web add .` / pnpm add，让安装器基于工作区 package.json 重新落链**。硬链接只保证「安装那一刻」两侧同一物理文件，不保证「后续编辑同步」。

## 对 Task 1 的决策含义

契约 α → **直接改造工作区 `/Users/haifeng/Documents/dsh/package.json`**：替换 `dsh` 字段、确保 `exports["./client"]` 指向 `./dist/client.js`（保留其余 exports 条目）、新增 `scripts` 字段。安装路径（Task 6）：`dsh plugin --profile web add .`（实为 profile 内 pnpm add）；**安装必须在构建产物就绪后重新执行**，以让 profile 获得新的 package.json 元数据与 `./dist/client.js` bundle（`files` 字段当前不含 `dist/`，Task 6 需另行处理，见上「意外发现 2」）。

**Task 1 fixes（review 修复提交）：** `files` 现含 `dist/`（bundle 随 `file:` 安装送达 profile）；`exports["./client"]` 改为裸字符串（不再指向不存在的 `dist/client.d.ts`）；`.gitignore` 改为 `dist/*` + `!dist/client.js`（重建的 bundle 不会被 `git add -A` 静默跳过）。