# dsh-prompt-optimizer 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 DSH Web GUI 实现纯 client 插件 `dsh-prompt-optimizer`：输入栏「✨ 优化」按钮 + `Alt+O` 快捷键，把当前草稿经用户自配的 OpenAI 兼容 API 润色改写，结果以预览卡片呈现（替换草稿 / 复制 / 重新优化 / 放弃），设置页提供 API 配置入口，文案中英双语。

**Architecture:** 单 esbuild bundle 的 client 插件（先例：同目录 `dsh-skin-pack` 已验证的形态）——`src/index.ts` 为 `apply(ctx)` 入口；纯函数核心（`optimizer.ts`、`preview-state.ts`、`settings-form-state.ts`、`locales.ts`）零 DSH 依赖、可 Node 单测；薄胶水层（defineStore 包装、组件）只做状态接线。按钮挂 `conversation.input.right`、预览卡片挂 `conversation.input.overlay`（两个会话作用域 list slot 共享同一 per-session store 实例，`resolveStore` 按 sessionId 键控已核实）、设置行挂 `settings.general.item`（root 作用域）。

**Tech Stack:** TypeScript、React 18（jsx automatic）、esbuild（bundle + 测试运行器）、`window.__ModuleLoader__.load({id, factory})` 模块格式、`@deepseek-ai/dsh-client-runtime/client`（defineStore / settingsScope / 标准 kit）。

## Global Constraints

- 插件 id / settings namespace：`prompt-optimizer`；locale namespace：`prompt_optimizer`；包名：`dsh-prompt-optimizer`
- 构建产物：`dist/client.js`，`load({id: "prompt-optimizer", factory})` 包装（scripts/build.mjs 模式，先例 dsh-skin-pack）
- esbuild `external` 必须含：`react`、`react/jsx-runtime`、`react/jsx-dev-runtime`、`@deepseek-ai/*`、`clsx`（运行时由 DSH loader 提供；工作区 node_modules 只有 esbuild，**不要** `pnpm install` 任何 @deepseek-ai 包）
- 无 TypeScript 编译器可用（不存在 tsc）：类型注解是文档性约束，正确性以 build + 手工验证为准
- 设置行 `order: 30`（官方外观行 10、皮肤行 20 之后）；按钮 `order: 0`；预览卡片 `order: 10`
- 默认配置：baseUrl `https://api.deepseek.com`、model `deepseek-chat`、apiKey 空；超时 60s；`temperature 0.7`、`max_tokens 2048`、`stream: false`
- 快捷键 `Alt+O`（`e.altKey && e.code === 'KeyO'`），仅当焦点在 composer textarea 内（以最近容器内 `document.activeElement` 是否为 textarea 判定）生效
- 所有变更先写失败测试 → 跑测试确认失败 → 最小实现 → 跑测试确认通过 → commit（每任务末尾提交）
- 不触碰 `<package.json>` 的桌面壳字段之外的无关内容；发现的安装契约变更以 Task 1 结果为准
- API Key 明文本地存储（README 与设置表单注明）

---

## Task 1: 安装契约发现 + 脚手架（package.json 插件元数据 + build/test 脚本基线）

**Files:**
- Modify: `package.json`（仅 dsh 元数据与 exports 增量）
- Create: `scripts/build.mjs`（改造为 prompt-optimizer）
- Create: `scripts/test.mjs`
- Create: `tests/entry.ts`（测试运行入口基线）
- Create: `.gitignore`
- Create: `dist/`（构建产物目录，Task 1 末产出 dist/client.js）

**Interfaces:**
- Consumes: 无（发现既有 `dsh-skin-pack` 安装事实）
- Produces: `npm run build` → `dist/client.js`（ModuleLoader 格式、id `prompt-optimizer`）；`npm test` → 退出码 0/1；后续任务通过 `npm test` 运行所有单测

- [ ] **Step 1: 安装契约发现（只读，不改任何配置）**

运行以下命令并记录结果（写入 `docs/superpowers/notes/2026-08-16-plugin-install-discovery.md`，先 `mkdir -p docs/superpowers/notes`）：

```bash
# 1) 现有皮肤插件在 profile 中的真实形态（硬链接？软链？）
ls -la ~/.dsh/profiles/web/node_modules/dsh-skin-pack/
ls -laR ~/.dsh/profiles/web/node_modules/dsh-skin-pack/ | head -40
stat ~/.dsh/profiles/web/node_modules/dsh-skin-pack/package.json /Users/haifeng/Documents/dsh/package.json
# 2) profile 补丁层
cat ~/.dsh/profiles/web/cordis.patch.yml
# 3) dsh CLI 插件子命令
dsh plugin --help 2>&1 | head -60 || dsh --help 2>&1 | grep -i plugin | head
# 4) 运行中 GUI 的插件 bundle 服务路径（找 /plugins/ 字样）
curl -s http://127.0.0.1:60179/assets/index-*.js | grep -o '/plugins/[a-zA-Z0-9._/-]*' | sort -u | head
```

期望记录到发现文档里的关键结论（任选其一）：
- **契约 α（profile 直链工作区）**：`dsh plugin --profile web add .` 把工作区 package.json 硬链接进 profile 的 `dsh-skin-pack/`，Loader 扫描该 package 的 `dsh.client` 并按其 `exports["./client"]` 提供 bundle
- **契约 β（独立插件子包）**：Loader 需要独立 package 目录（含自己的 package.json）才能发现
- 运行 60179 的 web 服务是否启用 HMR dev watcher（`pnpm run dev:web` 是否在跑：`ps aux | grep -i "dev:web\|vite\|esbuild.*watch"`）

- [ ] **Step 2: 依据发现结果添加插件元数据**

若发现结论为**契约 α**（profile 通过工作区 package.json 曝光插件，与皮肤插件一致），改造工作区 `package.json`（保持其余字段不动；用 `node -e "const p=require('./package.json'); ..."` 或文本编辑精准替换两处）：

```jsonc
// package.json 中 "dsh" 字段整体替换为：
"dsh": {
  "client": {
    "platform": "web",
    "inject": [
      "@deepseek-ai/dsh-client-runtime",
      "@deepseek-ai/dsh-client-locale",
      "@deepseek-ai/dsh-client-ui-conversation",
      "@deepseek-ai/dsh-client-ui-settings"
    ],
    "immediately": true
  },
  "bundle": {
    "patch": "./cordis.patch.yml"
  }
},
// "exports" 对象中追加（保留既有所有条目）：
"./client": {
  "types": "./dist/client.d.ts",
  "default": "./dist/client.js"
}
```

并在 `scripts` 字段追加：

```jsonc
"scripts": {
  "build": "node scripts/build.mjs",
  "test": "node scripts/test.mjs"
}
```

若发现结论为**契约 β**：新建 `plugin/` 子目录，`plugin/package.json` 含 name `dsh-prompt-optimizer`、`"exports": {"./client": {"default": "../dist/client.js"}, "./package.json": "./package.json"}`、与上相同的 `dsh.client`；安装路径为 `dsh plugin --profile web add ./plugin`。两种情况都需把最终结论写进发现文档。

- [ ] **Step 3: 改造构建脚本 `scripts/build.mjs`**

把现有 `scripts/build.mjs`（皮肤插件版）整体替换为（仅 id 与注释不同）：

```js
/** dsh-prompt-optimizer 构建脚本 — esbuild 打包为官方 client.js 格式 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const entry = resolve(ROOT, 'src/index.ts');
const outDir = resolve(ROOT, 'dist');
const outRaw = resolve(outDir, '_bundle.js');
const outFinal = resolve(outDir, 'client.js');

mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'react',
  external: [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    '@deepseek-ai/*',
    'clsx',
  ],
  outfile: outRaw,
  sourcemap: 'inline',
});

const bundle = readFileSync(outRaw, 'utf8');

const wrapped = `window.__ModuleLoader__.load({
  id: "prompt-optimizer",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${bundle}
    return module.exports;
  }
});
`;

writeFileSync(outFinal, wrapped, 'utf8');
rmSync(outRaw, { force: true });

console.log(`✓ Built: ${outFinal} (${(wrapped.length / 1024).toFixed(1)} KB)`);
```

- [ ] **Step 4: 创建测试运行器 `scripts/test.mjs`**

```js
/** 单测运行器：esbuild 打包 tests/entry.ts → node 执行 → 按 run() 返回值设置退出码 */

import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const outDir = resolve(ROOT, '.tmp');
const outFile = resolve(outDir, 'tests.cjs');

mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [resolve(ROOT, 'tests/entry.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'es2022',
  outfile: outFile,
  sourcemap: false,
});

const { run } = await import(outFile);
const ok = await run();
process.exitCode = ok ? 0 : 1;
```

- [ ] **Step 5: 创建测试入口基线 `tests/entry.ts`**

```ts
/** 单测入口 — 所有任务在此汇总断言（esbuild 打包后由 scripts/test.mjs 执行） */

import assert from 'node:assert';

export async function run(): Promise<boolean> {
  const results: string[] = [];
  const failures: string[] = [];
  const check = async (name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      results.push(`✓ ${name}`);
    } catch (e) {
      failures.push(`✗ ${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  await check('harness self-test', () => {
    assert.strictEqual(1 + 1, 2);
  });

  // 验证异步失败确实被捕获（真实回归测试，不许删除）
  await check('harness catches async failures', async () => {
    let caught = false;
    const probe = async () => {
      await check('(probe)', async () => {
        throw new Error('boom');
      });
    };
    const before = failures.length;
    const beforeResults = results.length;
    await probe();
    caught = failures.length === before + 1;
    assert.ok(caught, 'async failure was not recorded');
    // 探针的失败与结果条目是预期内的：只验证「异步失败会被 check 记录」这一机制，
    // 随后撤回归档，避免基座套件恒红（探针外的真实断言失败仍由外层 check 捕获并计入门禁）
    failures.length = before;
    results.length = beforeResults;
  });

  for (const r of results) console.log(r);
  if (failures.length > 0) {
    for (const f of failures) console.error(f);
    console.error(`FAILED: ${failures.length}`);
    return false;
  }
  console.log(`ALL PASS (${results.length})`);
  return true;
}
```

- [ ] **Step 6: 创建 `.gitignore`**

```
node_modules/
.pnpm-store/
dist/*
!dist/client.js
.tmp/
```

- [ ] **Step 7: 验证脚手架**

```bash
npm test
# 期望：  ✓ harness self-test / ALL PASS (1) / 退出码 0
echo $?
```

- [ ] **Step 8: 暂存空 `src/index.ts` 并验证 build 能跑通管线**

（src/index.ts 的内容在 Task 4 才填入；此处先放最小占位以便验证构建链路——注意：占位只存在于本步骤，Task 4 会整体替换；**本计划其余任何步骤不得出现占位代码**）

```bash
mkdir -p src
printf 'export const inject = [];\nexport function apply(_ctx) {}\n' > src/index.ts
npm run build
# 期望： ✓ Built: dist/client.js (...KB) ; head 显示 id: "prompt-optimizer"
head -3 dist/client.js
git add package.json scripts/build.mjs scripts/test.mjs tests/entry.ts .gitignore src/index.ts dist/client.js
git commit -m "feat: scaffold prompt-optimizer plugin (build, tests, metadata)"
```

---

## Task 2: `optimizer.ts` 纯函数核心（校验 / 请求组装 / 结果提取）

**Files:**
- Create: `src/optimizer.ts`
- Modify: `tests/entry.ts`（追加 `runOptimizerTests` 调用）

**Interfaces:**
- Consumes: 无（纯 TS + 全局 fetch/URL/AbortSignal，零 DSH 依赖）
- Produces:
  - `interface PromptConfig { baseUrl: string; apiKey: string; model: string }`
  - `const DEFAULTS: PromptConfig`
  - `function normalizeBaseUrl(url: string): string`
  - `function mergeConfig(raw: Partial<PromptConfig> | null | undefined): PromptConfig`
  - `type Lang = 'zh' | 'en'`
  - `type ConfigProblem = 'missing-key' | 'missing-model' | 'bad-url'`
  - `type ConfigCheck = { ok: true; config: PromptConfig } | { ok: false; reason: ConfigProblem }`
  - `function checkConfig(config: PromptConfig): ConfigCheck`
  - `function buildSystemPrompt(lang: Lang): string`
  - `function buildRequestBody(config: PromptConfig, text: string, lang: Lang): object`
  - `function extractResult(raw: string): string`
  - `function canTrigger(draft: string, busy: boolean): boolean`
  - `type OptimizeErrorKind = 'config' | 'unauthorized' | 'forbidden' | 'http' | 'timeout' | 'network' | 'cors' | 'bad-response' | 'empty'`
  - `class OptimizeError extends Error { constructor(public kind: OptimizeErrorKind, message: string) }`
  - `const REQUEST_TIMEOUT_MS = 60_000`
  - `async function optimize(opts: { config: PromptConfig; text: string; lang: Lang; signal?: AbortSignal }): Promise<string>`
  - `function toErrorKind(e: unknown): OptimizeError`

- [ ] **Step 1: 写失败测试（tests/entry.ts 追加）**

```ts
import { DEFAULTS, mergeConfig, normalizeBaseUrl, checkConfig, buildSystemPrompt, buildRequestBody, extractResult, canTrigger, optimize, OptimizeError, toErrorKind } from '../src/optimizer.js';

async function runOptimizerTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('normalizeBaseUrl trims trailing slashes', () => {
    assert.strictEqual(normalizeBaseUrl('https://api.deepseek.com/'), 'https://api.deepseek.com');
    assert.strictEqual(normalizeBaseUrl('https://api.deepseek.com///'), 'https://api.deepseek.com');
    assert.strictEqual(normalizeBaseUrl(' https://x.y '), 'https://x.y');
  });

  check('mergeConfig applies defaults and trims', () => {
    assert.deepStrictEqual(mergeConfig(undefined), DEFAULTS);
    assert.strictEqual(mergeConfig({}).baseUrl, DEFAULTS.baseUrl);
    assert.deepStrictEqual(mergeConfig({ baseUrl: ' http://a/ ', apiKey: ' k ', model: ' m ' }),
      { baseUrl: 'http://a', apiKey: ' k ', model: 'm' });
    assert.deepStrictEqual(mergeConfig({ baseUrl: '', apiKey: '', model: '' }), DEFAULTS);
  });

  check('checkConfig rejects missing key/model/bad url', () => {
    assert.strictEqual(checkConfig({ ...DEFAULTS, apiKey: '' }).ok, false);
    const noKey = checkConfig({ ...DEFAULTS, apiKey: '' });
    if (noKey.ok === false) assert.strictEqual(noKey.reason, 'missing-key');
    const noModel = checkConfig({ ...DEFAULTS, apiKey: 'k', model: '' });
    if (noModel.ok === false) assert.strictEqual(noModel.reason, 'missing-model');
    const badUrl = checkConfig({ ...DEFAULTS, apiKey: 'k', baseUrl: 'not a url' });
    if (badUrl.ok === false) assert.strictEqual(badUrl.reason, 'bad-url');
    const ok = checkConfig({ ...DEFAULTS, apiKey: 'k' });
    assert.strictEqual(ok.ok, true);
  });

  check('buildSystemPrompt zh/en non-empty and distinct', () => {
    assert.ok(buildSystemPrompt('zh').length > 40);
    assert.ok(buildSystemPrompt('en').length > 40);
    assert.notStrictEqual(buildSystemPrompt('zh'), buildSystemPrompt('en'));
  });

  check('buildRequestBody shape', () => {
    const body = buildRequestBody({ ...DEFAULTS, apiKey: 'k' }, '写个计划', 'zh') as Record<string, unknown>;
    assert.strictEqual(body.model, 'deepseek-chat');
    assert.strictEqual((body as { stream: boolean }).stream, false);
    const messages = body.messages as Array<{ role: string; content: string }>;
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].role, 'system');
    assert.strictEqual(messages[1].content, '写个计划');
  });

  check('extractResult unwraps fences and trims', () => {
    assert.strictEqual(extractResult('  你好  '), '你好');
    assert.strictEqual(extractResult('```\n优化后正文\n```'), '优化后正文');
    assert.strictEqual(extractResult('```markdown\nA\nB\n```'), 'A\nB');
    assert.strictEqual(extractResult('```\n```'), '');
  });

  check('canTrigger', () => {
    assert.strictEqual(canTrigger(' ', false), false);
    assert.strictEqual(canTrigger('', false), false);
    assert.strictEqual(canTrigger('x', true), false);
    assert.strictEqual(canTrigger('x', false), true);
  });

  check('optimize success path (stubbed fetch)', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '```\n优化后\n```' } }] }), { status: 200 });
    try {
      const out = await optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'draft', lang: 'zh' });
      assert.strictEqual(out, '优化后');
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  check('optimize 401 → unauthorized', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () => new Response('{}', { status: 401 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'bad' }, text: 'd', lang: 'en' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'unauthorized',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  check('optimize empty content → empty', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), { status: 200 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'zh' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'empty',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  check('toErrorKind maps TypeError to network, OptimizeError passthrough', () => {
    assert.strictEqual(toErrorKind(new TypeError('Failed to fetch')).kind, 'network');
    assert.strictEqual(toErrorKind(new OptimizeError('timeout', 't')).kind, 'timeout');
    assert.strictEqual(toErrorKind(new Error('boom')).kind, 'network');
  });
}
```

- [ ] **Step 2: 在 `run()` 中接线并验证失败**

`tests/entry.ts` 的 `run()` 中，`check('harness self-test', ...)` 之后插入：`runOptimizerTests(check);`，并修正 import。注意：Task 1 起 `run()` 已是 `async`（`check` 接受 `() => void | Promise<void>` 并 `await`），但 `check(...)` 调用模式不变——`runOptimizerTests(check)` 直接传函数引用即可；**同步 test fn 下 `check(...)` 无需 await；异步 test fn 必须 `await check(...)`（或让分组函数为 `async` 并逐条 await），否则失败记录在 `run()` 尾部检查之后才落盘，仍会出现假绿**。运行：

```bash
npm test
```

期望：FAILED（`optimizer.js` 模块不存在 → 打包报错）：`Could not resolve "../src/optimizer.js"`。

- [ ] **Step 3: 实现 `src/optimizer.ts`**

```ts
/** Prompt 优化核心：配置校验、OpenAI 兼容调用、结果提取 —— 纯函数，零 DSH 依赖 */

export interface PromptConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULTS: PromptConfig = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat',
};

export type Lang = 'zh' | 'en';

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function mergeConfig(raw: Partial<PromptConfig> | null | undefined): PromptConfig {
  const baseUrl = typeof raw?.baseUrl === 'string' && raw.baseUrl.trim() ? raw.baseUrl.trim() : DEFAULTS.baseUrl;
  const apiKey = typeof raw?.apiKey === 'string' ? raw.apiKey : DEFAULTS.apiKey;
  const model = typeof raw?.model === 'string' && raw.model.trim() ? raw.model.trim() : DEFAULTS.model;
  return { baseUrl: normalizeBaseUrl(baseUrl), apiKey, model };
}

export type ConfigProblem = 'missing-key' | 'missing-model' | 'bad-url';
export type ConfigCheck = { ok: true; config: PromptConfig } | { ok: false; reason: ConfigProblem };

export function checkConfig(config: PromptConfig): ConfigCheck {
  if (!config.apiKey.trim()) return { ok: false, reason: 'missing-key' };
  if (!config.model.trim()) return { ok: false, reason: 'missing-model' };
  try {
    const u = new URL(normalizeBaseUrl(config.baseUrl));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
    if (u.search || u.hash) throw new Error('query-or-hash');
  } catch {
    return { ok: false, reason: 'bad-url' };
  }
  return { ok: true, config };
}

const ZH_SYSTEM =
  '你是一名 prompt 优化专家。用户会给你一段草稿 prompt，请在不改变其意图的前提下将其改写为更清晰、更结构化的高质量 prompt：' +
  '补充缺失的目标、约束与期望输出格式（可从上下文合理推断），使用简洁明确的语言，去掉冗余。' +
  '不得编造草稿中不存在的事实或技术细节。只输出优化后的 prompt 正文，不要任何解释、前缀或代码块包裹。';

const EN_SYSTEM =
  'You are a prompt optimization expert. Rewrite the user\'s draft prompt into a clearer, more structured, high-quality prompt ' +
  'without changing its intent: fill in missing goals, constraints, and expected output format when reasonably inferable, ' +
  'use concise and precise language, and remove redundancy. Do not invent facts or technical details absent from the draft. ' +
  'Output ONLY the optimized prompt text, with no explanations, prefixes, or code fences.';

export function buildSystemPrompt(lang: Lang): string {
  return lang === 'zh' ? ZH_SYSTEM : EN_SYSTEM;
}

export function buildRequestBody(config: PromptConfig, text: string, lang: Lang): object {
  return {
    model: config.model,
    messages: [
      { role: 'system', content: buildSystemPrompt(lang) },
      { role: 'user', content: text },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: false,
  };
}

export function extractResult(raw: string): string {
  let s = raw.trim();
  const fence = /^```[a-zA-Z0-9_+-]*\n([\s\S]*?)\n?```$/;
  const matched = s.match(fence);
  if (matched) s = matched[1].trim();
  return s;
}

export function canTrigger(draft: string, busy: boolean): boolean {
  return !busy && draft.trim().length > 0;
}

export type OptimizeErrorKind =
  | 'config'
  | 'unauthorized'
  | 'forbidden'
  | 'http'
  | 'timeout'
  | 'network'
  | 'cors'
  | 'bad-response'
  | 'empty';

export class OptimizeError extends Error {
  constructor(
    public readonly kind: OptimizeErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'OptimizeError';
  }
}

export const REQUEST_TIMEOUT_MS = 60_000;

function extractChoiceContent(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: { content?: unknown } };
  const content = first?.message?.content;
  return typeof content === 'string' ? content : null;
}

export function toErrorKind(e: unknown): OptimizeError {
  if (e instanceof OptimizeError) return e;
  const isAbort =
    (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && (e as Error).name === 'AbortError');
  if (isAbort) return new OptimizeError('timeout', 'request aborted');
  if (e instanceof TypeError) {
    const m = String(e.message ?? '');
    if (/cors/i.test(m)) return new OptimizeError('cors', m);
    return new OptimizeError('network', m || 'network error');
  }
  return new OptimizeError('network', String((e as Error)?.message ?? e));
}

export async function optimize(opts: {
  config: PromptConfig;
  text: string;
  lang: Lang;
  signal?: AbortSignal;
}): Promise<string> {
  const { config, text, lang, signal } = opts;
  const check = checkConfig(config);
  if (!check.ok) throw new OptimizeError('config', check.reason);

  let res: Response;
  try {
    res = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(config, text, lang)),
      signal,
    });
  } catch (e) {
    throw toErrorKind(e);
  }

  if (res.status === 401) throw new OptimizeError('unauthorized', `HTTP 401`);
  if (res.status === 403) throw new OptimizeError('forbidden', `HTTP 403`);
  if (!res.ok) throw new OptimizeError('http', `HTTP ${res.status}`);

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new OptimizeError('bad-response', 'invalid JSON');
  }
  const content = extractChoiceContent(payload);
  if (!content || !content.trim()) throw new OptimizeError('empty', 'empty completion');
  return extractResult(content);
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test
```

期望：所有 `runOptimizerTests` 断言通过，`ALL PASS (N)`，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add src/optimizer.ts tests/entry.ts
git commit -m "feat: prompt optimizer core pure functions with tests"
```

---

## Task 3: `locales.ts` + 两个纯状态机（preview / settings-form）

**Files:**
- Create: `src/locales.ts`
- Create: `src/preview-state.ts`
- Create: `src/settings-form-state.ts`
- Modify: `tests/entry.ts`（追加 `runStateTests` 与 `runLocaleTests` 调用）

**Interfaces:**
- Consumes: `Lang`、`OptimizeErrorKind`（自 `./optimizer.js`）；`PromptConfig`（自 `./optimizer.js`）
- Produces:
  - `const NS = 'prompt_optimizer'`；`zh`、`en` 字典；`type LocaleKey = keyof typeof zh`（全部键见 Step 1 表）
  - `type PreviewStatus = 'idle' | 'optimizing' | 'preview' | 'error' | 'guide'`
  - `interface PreviewState { status: PreviewStatus; result: string; errorKind: OptimizeErrorKind | null; generation: number }`
  - `const INITIAL_PREVIEW: PreviewState`
  - `type PreviewAction = { type: 'begin' } | { type: 'show'; result: string } | { type: 'fail'; kind: OptimizeErrorKind } | { type: 'guide' } | { type: 'close' }`
  - `function reducePreview(state: PreviewState, action: PreviewAction): PreviewState`（begin：已在 optimizing 时返回原引用；show/fail 仅在 optimizing 态生效；close 返回 INITIAL_PREVIEW）
  - `function validateSettingsForm(values: { baseUrl: string; apiKey: string; model: string }): Record<string, string>`（key→错误文案 key；空对象 = 合法）

- [ ] **Step 1: 写失败测试（tests/entry.ts 追加）**

```ts
import { NS, zh, en } from '../src/locales.js';
import { INITIAL_PREVIEW, reducePreview, type PreviewState } from '../src/preview-state.js';
import { validateSettingsForm } from '../src/settings-form-state.js';

function runStateTests(check: (name: string, fn: () => void) => void) {
  check('reducePreview begin → optimizing, generation bump, idempotent', () => {
    const once = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.strictEqual(once.status, 'optimizing');
    assert.strictEqual(once.generation, 1);
    const twice = reducePreview(once, { type: 'begin' });
    assert.strictEqual(twice, once, 'double begin returns same reference');
  });

  check('show/fail only apply while optimizing; close resets', () => {
    const shown = reducePreview(reducePreview(INITIAL_PREVIEW, { type: 'begin' }), { type: 'show', result: 'R' });
    assert.strictEqual(shown.status, 'preview');
    assert.strictEqual(shown.result, 'R');
    const failed = reducePreview(reducePreview(INITIAL_PREVIEW, { type: 'begin' }), { type: 'fail', kind: 'unauthorized' });
    assert.strictEqual(failed.status, 'error');
    assert.strictEqual(failed.errorKind, 'unauthorized');
    // 未处于 optimizing 时 show/fail 被丢弃
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'show', result: 'X' }), INITIAL_PREVIEW);
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'fail', kind: 'http' }), INITIAL_PREVIEW);
    assert.strictEqual(reducePreview(shown, { type: 'close' }), INITIAL_PREVIEW);
  });

  check('guide transitions from any non-optimizing state', () => {
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'guide' }).status, 'guide');
    const fromError = reducePreview(
      reducePreview(INITIAL_PREVIEW, { type: 'begin' }),
      { type: 'fail', kind: 'http' },
    );
    assert.strictEqual(reducePreview(fromError, { type: 'guide' }).status, 'guide');
  });

  check('guide while optimizing returns same reference', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.strictEqual(reducePreview(began, { type: 'guide' }), began);
  });

  check('begin after fail resets errorKind and bumps generation', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    const failed = reducePreview(began, { type: 'fail', kind: 'http' });
    const retried = reducePreview(failed, { type: 'begin' });
    assert.strictEqual(retried.status, 'optimizing');
    assert.strictEqual(retried.errorKind, null);
    assert.strictEqual(retried.generation, began.generation + 1);
  });

  check('real transitions never alias INITIAL_PREVIEW', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.notStrictEqual(began, INITIAL_PREVIEW);
    const shown = reducePreview(began, { type: 'show', result: 'R' });
    assert.notStrictEqual(shown, INITIAL_PREVIEW);
    const failed = reducePreview(began, { type: 'fail', kind: 'http' });
    assert.notStrictEqual(failed, INITIAL_PREVIEW);
  });

  check('validateSettingsForm', () => {
    assert.deepStrictEqual(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: 'k', model: 'm' }), {});
    assert.ok(validateSettingsForm({ baseUrl: '', apiKey: 'k', model: 'm' }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: '', model: 'm' }).apiKey);
    assert.ok(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: 'k', model: '' }).model);
    const bad = validateSettingsForm({ baseUrl: 'nonsense', apiKey: 'k', model: 'm' });
    assert.ok(bad.baseUrl);
  });

  check('validateSettingsForm rejects ftp and query/hash', () => {
    assert.ok(validateSettingsForm({ baseUrl: 'ftp://x.y', apiKey: 'k', model: 'm' }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://x.y/v1?k=1', apiKey: 'k', model: 'm' }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://x.y/v1#frag', apiKey: 'k', model: 'm' }).baseUrl);
  });

  check('validateSettingsForm rejects whitespace-only values', () => {
    const blank = validateSettingsForm({ baseUrl: '  ', apiKey: ' ', model: '\t' });
    assert.ok(blank.baseUrl);
    assert.ok(blank.apiKey);
    assert.ok(blank.model);
  });
}

function runLocaleTests(check: (name: string, fn: () => void) => void) {
  check('NS value', () => {
    assert.strictEqual(NS, 'prompt_optimizer');
  });
  check('zh/en have identical key sets', () => {
    const keys = (d: Record<string, unknown>) => Object.keys(d).sort();
    assert.deepStrictEqual(keys(zh), keys(en));
    assert.ok(keys(zh).length >= 15, `expected >=15 keys, got ${keys(zh).length}`);
  });
  check('all values non-empty', () => {
    for (const [k, v] of Object.entries(zh)) assert.ok(String(v).trim().length > 0, `zh.${k} empty`);
    for (const [k, v] of Object.entries(en)) assert.ok(String(v).trim().length > 0, `en.${k} empty`);
  });
  check('zh/en placeholder tokens match per key', () => {
    const tokens = (v: string) => [...(v.match(/\{\w+\}/g) ?? [])].sort();
    for (const k of Object.keys(zh) as Array<keyof typeof zh>) {
      assert.deepStrictEqual(tokens(zh[k]), tokens(en[k]), `placeholder drift at ${k}`);
    }
  });
}
```

- [ ] **Step 2: 接线并验证失败**

`run()` 中插入 `runStateTests(check); runLocaleTests(check);`。运行 `npm test` → 期望 FAILED（`locales.js` / `preview-state.js` / `settings-form-state.js` 解析失败）。

- [ ] **Step 3: 实现 `src/locales.ts`**

键表（zh/en 必须完全一致）：

| key | zh | en |
|---|---|---|
| button.aria | 优化 prompt | Optimize prompt |
| card.title | 优化结果 | Optimized prompt |
| card.replace | 替换草稿 | Use draft |
| card.copy | 复制 | Copy |
| card.copyDone | 已复制 | Copied |
| card.retry | 重新优化 | Retry |
| card.dismiss | 放弃 | Dismiss |
| card.optimizing | 正在优化… | Optimizing… |
| card.configured.hint | （保留给设置行摘要，见 Task 5）"已配置 · 模型 {model}" | "Configured · model {model}" |
| card.unconfigured.hint | 未配置 API | No API configured |
| guide.title | 请先配置 API | Configure the API first |
| guide.desc | 前往 设置 → 通用设置 → Prompt 优化，填写接口地址、API Key 与模型名。 | Go to Settings → General → Prompt Optimizer and fill in the endpoint, API key, and model. |
| guide.action | 去设置 | Go to settings |
| guide.dismiss | 知道了 | Got it |
| error.unauthorized | API Key 无效或已过期 | API key is invalid or expired |
| error.forbidden | 服务拒绝访问（403） | Access forbidden (403) |
| error.timeout | 请求超时，请检查网络与接口地址 | Request timed out; check your network and endpoint |
| error.network | 网络错误，请检查网络与接口地址 | Network error; check your network and endpoint |
| error.cors | 接口不支持跨域，请换用支持 CORS 的网关 | Endpoint blocks CORS; use a gateway that allows it |
| error.http | 请求失败（HTTP 错误） | Request failed (HTTP error) |
| error.bad-response | 返回内容格式异常 | Unexpected response format |
| error.empty | 返回内容为空，请重试 | Empty result; please retry |
| error.config | 配置不完整，请到设置中检查 | Incomplete configuration; check settings |
| settings.title | Prompt 优化 | Prompt Optimizer |
| settings.desc | 配置润色接口（OpenAI 兼容）；Key 明文保存在本地 | Configure the rewrite endpoint (OpenAI-compatible); key is stored locally in plain text |
| settings.baseUrl | 接口地址 | Base URL |
| settings.apiKey | API Key | API Key |
| settings.model | 模型名 | Model |
| settings.save | 保存 | Save |
| settings.reset | 恢复默认 | Reset to defaults |
| settings.saved | 已保存 | Saved |
| settings.clickToEdit | 点击配置 | Click to configure |

```ts
/** Prompt 优化插件文案 — 中英双语 */

export const NS = 'prompt_optimizer';

export const zh = {
  'button.aria': '优化 prompt',
  'card.title': '优化结果',
  'card.replace': '替换草稿',
  'card.copy': '复制',
  'card.copyDone': '已复制',
  'card.retry': '重新优化',
  'card.dismiss': '放弃',
  'card.optimizing': '正在优化…',
  'card.configured.hint': '已配置 · 模型 {model}',
  'card.unconfigured.hint': '未配置 API',
  'guide.title': '请先配置 API',
  'guide.desc': '前往 设置 → 通用设置 → Prompt 优化，填写接口地址、API Key 与模型名。',
  'guide.action': '去设置',
  'guide.dismiss': '知道了',
  'error.unauthorized': 'API Key 无效或已过期',
  'error.forbidden': '服务拒绝访问（403）',
  'error.timeout': '请求超时，请检查网络与接口地址',
  'error.network': '网络错误，请检查网络与接口地址',
  'error.cors': '接口不支持跨域，请换用支持 CORS 的网关',
  'error.http': '请求失败（HTTP 错误）',
  'error.bad-response': '返回内容格式异常',
  'error.empty': '返回内容为空，请重试',
  'error.config': '配置不完整，请到设置中检查',
  'settings.title': 'Prompt 优化',
  'settings.desc': '配置润色接口（OpenAI 兼容）；Key 明文保存在本地',
  'settings.baseUrl': '接口地址',
  'settings.apiKey': 'API Key',
  'settings.model': '模型名',
  'settings.save': '保存',
  'settings.reset': '恢复默认',
  'settings.saved': '已保存',
  'settings.clickToEdit': '点击配置',
} as const;

export const en: LocaleDict = {
  'button.aria': 'Optimize prompt',
  'card.title': 'Optimized prompt',
  'card.replace': 'Use draft',
  'card.copy': 'Copy',
  'card.copyDone': 'Copied',
  'card.retry': 'Retry',
  'card.dismiss': 'Dismiss',
  'card.optimizing': 'Optimizing…',
  'card.configured.hint': 'Configured · model {model}',
  'card.unconfigured.hint': 'No API configured',
  'guide.title': 'Configure the API first',
  'guide.desc': 'Go to Settings → General → Prompt Optimizer and fill in the endpoint, API key, and model.',
  'guide.action': 'Go to settings',
  'guide.dismiss': 'Got it',
  'error.unauthorized': 'API key is invalid or expired',
  'error.forbidden': 'Access forbidden (403)',
  'error.timeout': 'Request timed out; check your network and endpoint',
  'error.network': 'Network error; check your network and endpoint',
  'error.cors': 'Endpoint blocks CORS; use a gateway that allows it',
  'error.http': 'Request failed (HTTP error)',
  'error.bad-response': 'Unexpected response format',
  'error.empty': 'Empty result; please retry',
  'error.config': 'Incomplete configuration; check settings',
  'settings.title': 'Prompt Optimizer',
  'settings.desc': 'Configure the rewrite endpoint (OpenAI-compatible); key is stored locally in plain text',
  'settings.baseUrl': 'Base URL',
  'settings.apiKey': 'API Key',
  'settings.model': 'Model',
  'settings.save': 'Save',
  'settings.reset': 'Reset to defaults',
  'settings.saved': 'Saved',
  'settings.clickToEdit': 'Click to configure',
} as const;

export type LocaleKey = keyof typeof zh;
export type LocaleDict = { [K in LocaleKey]: string };
```

- [ ] **Step 4: 实现 `src/preview-state.ts`**

```ts
/** 预览卡片状态机 —— 纯 reducer，无 DSH 依赖 */

import type { OptimizeErrorKind } from './optimizer.js';

export type PreviewStatus = 'idle' | 'optimizing' | 'preview' | 'error' | 'guide';

export interface PreviewState {
  status: PreviewStatus;
  result: string;
  errorKind: OptimizeErrorKind | null;
  generation: number;
}

export const INITIAL_PREVIEW: PreviewState = {
  status: 'idle',
  result: '',
  errorKind: null,
  generation: 0,
};

export type PreviewAction =
  | { type: 'begin' }
  | { type: 'show'; result: string }
  | { type: 'fail'; kind: OptimizeErrorKind }
  | { type: 'guide' }
  | { type: 'close' };

export function reducePreview(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'begin':
      if (state.status === 'optimizing') return state;
      return { ...state, status: 'optimizing', errorKind: null, generation: state.generation + 1 };
    case 'show':
      return state.status === 'optimizing'
        ? { ...state, status: 'preview', result: action.result }
        : state;
    case 'fail':
      return state.status === 'optimizing'
        ? { ...state, status: 'error', errorKind: action.kind }
        : state;
    case 'guide':
      return state.status === 'optimizing' ? state : { ...state, status: 'guide' };
    case 'close':
      return INITIAL_PREVIEW;
  }
}
```

- [ ] **Step 5: 实现 `src/settings-form-state.ts`**

```ts
/** 设置表单校验 —— 纯函数，无 DSH 依赖 */

export interface SettingsFormValues {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function validateSettingsForm(values: SettingsFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  const url = values.baseUrl.trim();
  if (!url) {
    errors.baseUrl = 'settings.baseUrl';
  } else {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
      if (u.search || u.hash) throw new Error('query-or-hash');
    } catch {
      errors.baseUrl = 'settings.baseUrl';
    }
  }

  if (!values.apiKey.trim()) errors.apiKey = 'settings.apiKey';
  if (!values.model.trim()) errors.model = 'settings.model';

  return errors;
}
```

- [ ] **Step 6: 运行测试确认通过 + 提交**

```bash
npm test
# 期望： ALL PASS，退出码 0
git add src/locales.ts src/preview-state.ts src/settings-form-state.ts tests/entry.ts
git commit -m "feat: locales and pure state machines (preview, settings form) with tests"
```

---

## Task 4: 会话槽位组件（store 胶水 + OptimizeButton + PreviewCard + index.ts 骨架）

**Files:**
- Create: `src/optimizer-store.ts`（defineStore 薄封装 + runOptimize 编排）
- Create: `src/events.ts`（插件内部事件总线：快捷键 → 按钮）
- Create: `src/OptimizeButton.tsx`
- Create: `src/PreviewCard.tsx`
- Modify: `src/index.ts`（整体替换为插件入口骨架，含 config 镜像与两个会话槽位注册）
- Modify: `tests/entry.ts`（追加 `runOptimizeStoreTests`：仅测纯逻辑路径；defineStore 包装本身不单测）

**Interfaces:**
- Consumes: `reducePreview`/`INITIAL_PREVIEW`/`PreviewState`（`./preview-state.js`）、`optimize`/`checkConfig`/`optimize` 相关（`./optimizer.js`）、`NS`（`./locales.js`）、`PromptConfig`/`Lang`（`./optimizer.js`）
- Produces:
  - `interface OptimizerActions { begin(): void; show(result: string): void; fail(kind: OptimizeErrorKind): void; guide(): void; close(): void }`
  - `function createOptimizerStore(): StoreHandle`（defineStore；作为 `store:` 选项挂在两个会话槽位，per-session 共享实例）
  - `async function runOptimize(actions: OptimizerActions, ctx: { getConfig(): PromptConfig; getLang(): Lang; getDraft(): string }): Promise<void>`
  - `function langOf(active: string): Lang`（位于 `./locales.js`）
  - `OptimizeButton`（props：`t`、`useInput`、`useStore`、`actions`、`getConfig`、`getLang`）
  - `PreviewCard`（props：多 `inputActions`）
  - `src/index.ts` 导出 `inject`、`apply(ctx)`

- [ ] **Step 1: 写失败测试（tests/entry.ts 追加）**

`langOf` 放在 **`src/locales.ts`**（纯模块，可被测试 bundle 解析；`src/index.ts` 从 `./locales.js` 导入它——`index.ts` 因导入 `@deepseek-ai/*` 不能被测试 bundle 直接解析，故不从中导入任何被测函数）。`canOptimizeFrom` 加在 `src/preview-state.ts`。

```ts
import { langOf } from '../src/locales.js';
import { canOptimizeFrom } from '../src/preview-state.js';

function runOptimizeStoreTests(check: (name: string, fn: () => void) => void) {
  check('langOf maps zh variants and defaults to en', () => {
    assert.strictEqual(langOf('zh'), 'zh');
    assert.strictEqual(langOf('zh-Hans-CN'), 'zh');
    assert.strictEqual(langOf('en'), 'en');
    assert.strictEqual(langOf('fr'), 'en');
    assert.strictEqual(langOf(''), 'en');
  });

  check('canOptimizeFrom: idle/preview/error/guide allow, optimizing blocks', () => {
    assert.strictEqual(canOptimizeFrom('idle'), true);
    assert.strictEqual(canOptimizeFrom('preview'), true);
    assert.strictEqual(canOptimizeFrom('error'), true);
    assert.strictEqual(canOptimizeFrom('guide'), true);
    assert.strictEqual(canOptimizeFrom('optimizing'), false);
  });
}
```

> 接口说明：`canOptimizeFrom(status: PreviewStatus): boolean`（`return status !== 'optimizing'`，用于按钮/重试的并发把关）；`langOf(active: string): Lang`（`active.toLowercase().startsWith('zh') ? 'zh' : 'en'`）。

- [ ] **Step 2: 接线并验证失败**

`run()` 插入 `runOptimizeStoreTests(check);`。`npm test` → 期望 FAILED（`canOptimizeFrom` 未定义 / `../src/locales.js` 无 `langOf` 导出）。

- [ ] **Step 3: `preview-state.ts` 追加 `canOptimizeFrom`，`locales.ts` 追加 `langOf`**

```ts
// src/preview-state.ts 末尾追加：
export function canOptimizeFrom(status: PreviewStatus): boolean {
  return status !== 'optimizing';
}
```

```ts
// src/locales.ts 末尾追加：
/** 激活 locale → 界面语言（zh 前缀归 zh，其余归 en） */
export function langOf(active: string): Lang {
  return typeof active === 'string' && active.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
```

> `locales.ts` 需在顶部导入 `Lang` 类型：`import type { Lang } from './optimizer.js';`

> 注（评审确认，下列实现以此为最终依据，不再按早期描述）：三处与原始计划的核实差异——(a) `export const inject` = `['slots','sessions','locale','settingsScope']`（Cordis 服务键；包 id 会使 fiber 永久 PENDING → web 启动审计失败，已对照 dsh-client-runtime/client.js defineStore 与 dsh-client-web assertEntriesActive 验证）；(b) runOptimize 并发门控用模块级 `activeController` 而非 `if (!actions.begin()) return;`（defineStore 包装丢弃 mutator 返回值，`begin()` 运行时为 undefined）；(c) CSS 类名 `dsh-po-*`、卡片槽位 id `prompt-optimizer-card`（Step 5/6 代码片段已按此更新）。

- [ ] **Step 4: 实现 `src/optimizer-store.ts`**

```ts
/** 会话预览状态 store（defineStore 薄封装）+ 优化编排 runOptimize */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
import {
  reducePreview,
  INITIAL_PREVIEW,
  type PreviewState,
} from './preview-state.js';
import {
  checkConfig,
  optimize,
  REQUEST_TIMEOUT_MS,
  toErrorKind,
  type Lang,
  type OptimizeErrorKind,
  type PromptConfig,
} from './optimizer.js';

export interface OptimizerActions {
  /** 进入 optimizing。注意：defineStore 的包装丢弃 mutator 返回值（运行时 `actions.begin()` 为 undefined），
   *  并发把关实际由 runOptimize 内的模块级 activeController 承担（见 runOptimize）。 */
  begin(): void;
  show(result: string): void;
  fail(kind: OptimizeErrorKind): void;
  guide(): void;
  close(): void;
}

/** defineStore 返回的 store 句柄（同时可作类型占位，供注册时 `store:` 使用） */
export interface OptimizerStoreHandle {
  // 运行时形状由 DSH 提供；此处仅为文档性类型
}

type CreateOptimizerStore = () => OptimizerStoreHandle;

/** 当前 in-flight 请求的控制器（模块级）：close 时中止，防止迟到 show() 复活已关闭卡片 */
let activeController: AbortController | null = null;

export const createOptimizerStore: CreateOptimizerStore = () => {
  const handle = defineStore({
    init: () => ({ ...INITIAL_PREVIEW }), // 每会话副本：INITIAL_PREVIEW 是只读共享常量，勿跨会话共享引用
    actions: {
      begin: (d: PreviewState) => {
        const next = reducePreview(d, { type: 'begin' });
        // 已在 optimizing 时 reducer 返回原引用（immer 式 no-op），跳过写回
        if (next === d) return;
        Object.assign(d, next);
      },
      show: (d: PreviewState, result: string) => Object.assign(d, reducePreview(d, { type: 'show', result })),
      fail: (d: PreviewState, kind: OptimizeErrorKind) => Object.assign(d, reducePreview(d, { type: 'fail', kind })),
      guide: (d: PreviewState) => Object.assign(d, reducePreview(d, { type: 'guide' })),
      close: (d: PreviewState) => {
        // 仅当本 store 处于 optimizing 时才取消在途请求：模块级 activeController 属于
        // 正在优化的那个 store（模块级门防止第二个 store 进入 begin），其他会话关卡片不得误杀。
        if (d.status === 'optimizing') {
          activeController?.abort();
          activeController = null;
        }
        return Object.assign(d, reducePreview(d, { type: 'close' }));
      },
    },
  });
  return handle as OptimizerStoreHandle;
};

/** 优化编排：配置缺失 → guide；草稿空 → 直接返回；并发 → 丢弃；超时/取消 → timeout 或静默 */
export async function runOptimize(
  actions: OptimizerActions,
  ctx: { getConfig(): PromptConfig; getLang(): Lang; getDraft(): string },
): Promise<void> {
  const config = ctx.getConfig();
  if (!checkConfig(config).ok) {
    actions.guide();
    return;
  }
  const draft = ctx.getDraft().trim();
  if (!draft) return;

  // 并发把关：已有在途请求则丢弃本次触发。
  // 不能依赖 actions.begin() 的返回值——defineStore 动作包装器丢弃 mutator 返回值（恒为 undefined）；
  // 组件层的按钮 busy 态已禁用点击，这里是对快捷键/竞态触发的最后防线。
  if (activeController !== null) return;
  actions.begin();

  const controller = new AbortController();
  activeController = controller; // 注册给 close()，供卡片关闭时取消在途请求
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const result = await optimize({ config, text: draft, lang: ctx.getLang(), signal: controller.signal });
    actions.show(result);
  } catch (e) {
    // 先判定中止：用户/组件取消与超时都表现为 AbortError；仅超时写入错误态
    const isAbort =
      (e instanceof DOMException && e.name === 'AbortError') ||
      (typeof (e as { name?: unknown } | null)?.name === 'string' &&
        (e as { name: string }).name === 'AbortError');
    if (isAbort) {
      if (timedOut) actions.fail('timeout');
      return;
    }
    actions.fail(toErrorKind(e).kind);
  } finally {
    if (activeController === controller) activeController = null;
    clearTimeout(timer);
  }
}
```

> 注（评审补充）：`INITIAL_PREVIEW` 为只读共享常量（reducer 永不写回它，`close` 直接返回它），store 的 `init` 必须返回 `{ ...INITIAL_PREVIEW }` 每会话副本，且 `close` 须仅在**本 store 处于 optimizing 态**时经模块级 `activeController?.abort()` 取消在途请求（模块级门保证该 store 拥有此控制器）——否则跨会话共享同一对象引用、迟到的 `show()` 会把已关闭卡片复活为 preview 态、或误杀其他会话的在途请求。

- [ ] **Step 5: 实现 `src/OptimizeButton.tsx`**

```tsx
/** 输入栏右侧「优化」按钮 */

import React, { useEffect } from 'react';
import type { Lang, PromptConfig } from './optimizer.js';
import { canTrigger } from './optimizer.js';
import type { OptimizerActions } from './optimizer-store.js';
import { runOptimize } from './optimizer-store.js';
import type { PreviewState } from './preview-state.js';

/** 会话标准 kit 提供的只读输入快照（input hook） */
interface InputSnapshot {
  draft: string;
}

export interface OptimizeButtonProps {
  t: (key: string) => string;
  useInput: () => InputSnapshot;
  useStore: <T>(selector: (s: PreviewState) => T) => T;
  actions: OptimizerActions;
  getConfig: () => PromptConfig;
  getLang: () => Lang;
}

const CSS_ID = 'dsh-prompt-optimizer/button.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.dsh-po-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.85;
  border-radius: 6px;
}
.dsh-po-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12));
}
.dsh-po-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
`;
  document.head.appendChild(style);
}

export function OptimizeButton(props: OptimizeButtonProps) {
  const { t, useInput, useStore, actions, getConfig, getLang } = props;

  const input = useInput();
  const status = useStore((s) => s.status);
  const busy = status === 'optimizing';
  const disabled = !canTrigger(input.draft, busy);

  // 卸载时无需显式取消：请求在途时组件树已不渲染；会话切换后 store 实例随
  // 会话 scope 清理（或冻结），runOptimize 的迟到写入无人订阅，无副作用。
  useEffect(() => injectCss(), []);

  const handleClick = () => {
    if (disabled) return;
    void runOptimize(actions, {
      getConfig,
      getLang,
      getDraft: () => input.draft,
    });
  };

  return (
    <button
      type="button"
      className="dsh-po-btn"
      aria-label={t('button.aria')}
      title={t('button.aria')}
      aria-busy={busy}
      disabled={disabled}
      data-busy={busy}
      onClick={handleClick}
    >
      {busy ? '⏳' : '✨'}
    </button>
  );
}
```

- [ ] **Step 6: 实现 `src/PreviewCard.tsx`**

```tsx
/** 输入区浮层预览卡片：guide / optimizing / preview / error 四种内容态 */

import React, { useEffect, useState } from 'react';
import type { Lang, PromptConfig } from './optimizer.js';
import type { OptimizerActions } from './optimizer-store.js';
import { runOptimize } from './optimizer-store.js';
import type { PreviewState } from './preview-state.js';

/** 会话标准 kit 提供的输入 action 面 */
interface InputActions {
  setDraft(text: string): void;
}

export interface PreviewCardProps {
  t: (key: string) => string;
  useInput: () => { draft: string };
  inputActions: InputActions;
  useStore: <T>(selector: (s: PreviewState) => T) => T;
  actions: OptimizerActions;
  getConfig: () => PromptConfig;
  getLang: () => Lang;
  openSettings: () => void;
}

const CSS_ID = 'dsh-prompt-optimizer/card.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.dsh-po-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(100% + 8px);
  z-index: 40;
  background: var(--dsw-alias-bg-overlay, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.3));
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  padding: 12px 14px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dsh-po-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--dsw-alias-label-primary, #222);
  font-size: 13px;
  font-weight: 600;
}
.dsh-po-card-body {
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-secondary, #444);
  font-size: 13px;
  line-height: 1.6;
  max-height: 200px;
}
.dsh-po-card-err {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 13px;
}
.dsh-po-card-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dsh-po-card-btn {
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--dsw-alias-label-primary, #222);
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
}
.dsh-po-card-btn.primary {
  color: var(--dsw-alias-brand-primary-invert, #fff);
  background: var(--dsw-alias-brand-primary, #1677ff);
}
`;
  document.head.appendChild(style);
}

function errorKey(kind: PreviewState['errorKind']): string {
  switch (kind) {
    case 'unauthorized':
    case 'forbidden':
      return `error.${kind}`;
    case 'timeout':
    case 'network':
    case 'cors':
    case 'http':
    case 'bad-response':
    case 'empty':
    case 'config':
      return `error.${kind}`;
    default:
      return 'error.network';
  }
}

export function PreviewCard(props: PreviewCardProps) {
  const { t, useInput, inputActions, useStore, actions, getConfig, getLang, openSettings } = props;

  useEffect(() => injectCss(), []);

  const input = useInput();
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const errorKind = useStore((s) => s.errorKind);
  const [copied, setCopied] = useState(false);

  if (status === 'idle') return null;

  const retry = () => {
    void runOptimize(actions, { getConfig, getLang, getDraft: () => input.draft });
  };

  const replace = () => {
    inputActions.setDraft(result);
    actions.close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // 剪贴板不可用时静默
    }
  };

  return (
    <div className="dsh-po-card" role="status">
      <div className="dsh-po-card-head">
        <span>{t('card.title')}</span>
        <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
          ✕
        </button>
      </div>

      {status === 'guide' && (
        <>
          <div className="dsh-po-card-body">{t('guide.title')}</div>
          <div className="dsh-po-card-body">{t('guide.desc')}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={() => { actions.close(); openSettings(); }}>
              {t('guide.action')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('guide.dismiss')}
            </button>
          </div>
        </>
      )}

      {status === 'optimizing' && <div className="dsh-po-card-body">{t('card.optimizing')}</div>}

      {status === 'preview' && (
        <>
          <div className="dsh-po-card-body">{result}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={replace}>
              {t('card.replace')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => void copy()}>
              {copied ? t('card.copyDone') : t('card.copy')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={retry}>
              {t('card.retry')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('card.dismiss')}
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="dsh-po-card-err">{t(errorKey(errorKind))}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={retry}>
              {t('card.retry')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('card.dismiss')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7: 创建 `src/events.ts`，然后整体替换 `src/index.ts`**

```ts
// src/events.ts — 插件内部事件总线（模块级；避免 index ↔ 组件循环依赖）
const optimizeRequestListeners = new Set<() => void>();
export function onOptimizeRequest(fn: () => void): () => void {
  optimizeRequestListeners.add(fn);
  return () => optimizeRequestListeners.delete(fn);
}
export function emitOptimizeRequest(): void {
  for (const fn of optimizeRequestListeners) fn();
}
```

`src/index.ts` 整体替换为：

```ts
/** dsh-prompt-optimizer 插件入口 — apply(ctx) */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { Lang, PromptConfig } from './optimizer.js';
import { mergeConfig } from './optimizer.js';
import { NS, zh, en, langOf } from './locales.js';
import { createOptimizerStore, type OptimizerActions } from './optimizer-store.js';
import { emitOptimizeRequest } from './events.js';
import { OptimizeButton } from './OptimizeButton.tsx';
import { PreviewCard } from './PreviewCard.tsx';

/** settings namespace（与插件 id 一致） */
const SETTINGS_NS = 'prompt-optimizer';

/** 声明注入的依赖服务 */
export const inject = [
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-settings',
];

/** 会话作用域 list slot 的 store 句柄（按钮与预览卡片共享 per-session 实例） */
const optimizerStore = createOptimizerStore();

/** 「去设置」信号：root 级轻量通知（设置行订阅后自动展开；Task 5 接线） */
const signalListeners = new Set<() => void>();
let signalValue = 0;
const signal = {
  getSnapshot: () => signalValue,
  subscribe: (fn: () => void) => {
    signalListeners.add(fn);
    return () => signalListeners.delete(fn);
  },
  set: (next: number) => {
    signalValue = next;
    for (const fn of signalListeners) fn();
  },
};

export function apply(ctx: ClientContext) {
  // 1. 文案
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'prompt-optimizer: locale registration');

  // 2. 配置镜像（settingsScope 为唯一事实源）
  const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  let configMirror: PromptConfig = mergeConfig(undefined);
  const refreshConfig = () => {
    configMirror = mergeConfig(settingsScope.getSnapshot().value);
  };
  refreshConfig();
  ctx.effect(
    () => settingsScope.subscribe(() => refreshConfig()),
    'prompt-optimizer: settings subscription',
  );

  // 3. 语言镜像
  let lang: Lang = langOf(ctx.locale.getLocale().active);
  ctx.on('locale/change', (snap: { active: string }) => {
    lang = langOf(snap.active);
  });

  // 4. 会话槽位：按钮 + 预览卡片
  ctx.inject(['slots', 'sessions'], (scope) => {
    scope.slots.inject('conversation.input.right', () =>
      scope.slots.register(
        {
          name: 'conversation.input.right',
          id: 'prompt-optimizer-button',
          order: 0,
          locale: NS,
          store: optimizerStore,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
          }),
        },
        OptimizeButton,
      ),
    );
    scope.slots.inject('conversation.input.overlay', () =>
      scope.slots.register(
        {
          name: 'conversation.input.overlay',
          id: 'prompt-optimizer-card',
          order: 10,
          locale: NS,
          store: optimizerStore,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            openSettings: () => signal.set(signal.getSnapshot() + 1),
          }),
        },
        PreviewCard,
      ),
    );
  });
}

// 引用守卫：避免 tree-shake 掉类型（仅文档性；无运行时行为）
export type { OptimizerActions };
```

> 注：`signal` 模块级变量为「去设置」轻量通知通道（Task 5 设置行注册前无订阅方，仅作预留语义）。

- [ ] **Step 8: 构建验证 + 手工检查点**

```bash
npm run build
# 期望： ✓ Built: dist/client.js；无报错
npm test
# 期望： ALL PASS（含 runOptimizeStoreTests）
```

手工检查点（记录到 Task 6 的验证清单，不在本任务内实施）：GUI 中按钮出现在输入栏右侧、点击未配置时显示引导卡、配置后显示结果卡。

- [ ] **Step 9: 提交**

```bash
git add src/optimizer-store.ts src/OptimizeButton.tsx src/PreviewCard.tsx src/index.ts src/preview-state.ts tests/entry.ts dist/client.js
git commit -m "feat: optimize button + preview card wired into conversation input slots"
```

---

## Task 5: 设置行（SettingsRow + 表单 store 胶水 + 快捷键）

**Files:**
- Create: `src/settings-store.ts`（defineStore 薄封装：表单草稿 + 信号订阅）
- Create: `src/SettingsRow.tsx`
- Modify: `src/index.ts`（注册 `settings.general.item` + 快捷键监听）
- Modify: `tests/entry.ts`（追加 `runSettingsStoreTests`：仍只测纯函数）

**Interfaces:**
- Consumes: `validateSettingsForm`（`./settings-form-state.js`）、`mergeConfig`/`DEFAULTS`（`./optimizer.js`）、`NS`（`./locales.js`）、`SettingsFormValues`
- Produces:
  - `interface SettingsFormState { values: SettingsFormValues; dirty: boolean; saved: boolean; error: string | null; revision: number }`
  - `function createSettingsFormStore(): StoreHandle`
  - `SettingsRow`（组件，root 作用域 entry；props：`t`、`useStore`、`actions`、`getConfig`、`saveConfig(values)`、`resetConfig()`）
  - `src/index.ts` 追加注册：`settings.general.item`（id `prompt-optimizer-settings`、order 30、locale NS、store 表单句柄）+ 全局 `Alt+O` 监听（经 `document.addEventListener('keydown', ...)`，条件：`e.altKey && e.code === 'KeyO'` 且焦点在 textarea；回调通过 `ctx.emit('prompt-optimizer/optimize-request', {})` → button 组件订阅？—— 见 Step 5 的落地方式：**按钮组件自订阅一次点击事件**，避免跨组件耦合）

- [ ] **Step 1: 写失败测试（tests/entry.ts 追加）**

```ts
import { INITIAL_SETTINGS_FORM, reduceSettingsForm, type SettingsFormState } from '../src/settings-form-state.js';

function runSettingsStoreTests(check: (name: string, fn: () => void) => void) {
  check('reduceSettingsForm: seed, edit, commit, fail', () => {
    const seeded = reduceSettingsForm(INITIAL_SETTINGS_FORM, {
      type: 'seed',
      values: { baseUrl: 'https://a.com', apiKey: 'k', model: 'm' },
      revision: 1,
    });
    assert.strictEqual(seeded.values.baseUrl, 'https://a.com');
    assert.strictEqual(seeded.dirty, false);

    const edited = reduceSettingsForm(seeded, { type: 'edit', field: 'model', value: 'm2' });
    assert.strictEqual(edited.dirty, true);
    assert.strictEqual(edited.values.model, 'm2');

    const committed = reduceSettingsForm(edited, { type: 'commit', revision: 2 });
    assert.strictEqual(committed.dirty, false);
    assert.strictEqual(committed.saved, true);

    const failed = reduceSettingsForm(edited, { type: 'fail', message: 'boom' });
    assert.strictEqual(failed.error, 'boom');
  });
}
```

- [ ] **Step 2: 接线验证失败 + 实现 `settings-form-state.ts` 扩展**

`run()` 插入 `runSettingsStoreTests(check);` → `npm test` FAILED（`INITIAL_SETTINGS_FORM` 不存在）。

在 `src/settings-form-state.ts` 追加：

```ts
export interface SettingsFormState {
  values: SettingsFormValues;
  dirty: boolean;
  saved: boolean;
  error: string | null;
  revision: number;
}

export const INITIAL_SETTINGS_FORM: SettingsFormState = {
  values: { baseUrl: '', apiKey: '', model: '' },
  dirty: false,
  saved: false,
  error: null,
  revision: -1,
};

export type SettingsFormAction =
  | { type: 'seed'; values: SettingsFormValues; revision: number }
  | { type: 'edit'; field: keyof SettingsFormValues; value: string }
  | { type: 'commit'; revision: number }
  | { type: 'fail'; message: string };

export function reduceSettingsForm(state: SettingsFormState, action: SettingsFormAction): SettingsFormState {
  switch (action.type) {
    case 'seed':
      return action.revision <= state.revision
        ? state
        : { ...state, values: { ...action.values }, dirty: false, saved: false, error: null, revision: action.revision };
    case 'edit':
      return { ...state, values: { ...state.values, [action.field]: action.value }, dirty: true, saved: false, error: null };
    case 'commit':
      return { ...state, dirty: false, saved: true, error: null, revision: action.revision };
    case 'fail':
      return { ...state, error: action.message };
  }
}
```

- [ ] **Step 3: `npm test` 通过后再实现 `src/settings-store.ts`**

```ts
/** 设置表单 store（defineStore 薄封装）：草稿 + 校验 + 保存动作 */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
import {
  INITIAL_SETTINGS_FORM,
  reduceSettingsForm,
  validateSettingsForm,
  type SettingsFormState,
  type SettingsFormValues,
} from './settings-form-state.js';

export interface SettingsFormActions {
  seed(values: SettingsFormValues, revision: number): void;
  edit(field: keyof SettingsFormValues, value: string): void;
  commit(revision: number): void;
  fail(message: string): void;
  /** 保存前校验；返回错误字典；无错误时返回 null */
  validate(values: SettingsFormValues): Record<string, string> | null;
}

/** defineStore 返回的 store 句柄（同时可作类型占位，供注册时 `store:` 使用） */
export interface SettingsFormStoreHandle {
  // 运行时形状由 DSH 提供；此处仅为文档性类型
}

export const createSettingsFormStore = (): SettingsFormStoreHandle => {
  const handle = defineStore({
    init: (): SettingsFormState => ({
      // 每实例副本：INITIAL_SETTINGS_FORM 是只读共享常量，勿跨实例共享引用（reducer 的 draft 写入需受保护）
      ...INITIAL_SETTINGS_FORM,
      values: { ...INITIAL_SETTINGS_FORM.values },
    }),
    actions: {
      seed: (d: SettingsFormState, values: SettingsFormValues, revision: number) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'seed', values, revision })),
      edit: (d: SettingsFormState, field: keyof SettingsFormValues, value: string) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'edit', field, value })),
      commit: (d: SettingsFormState, revision: number) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'commit', revision })),
      fail: (d: SettingsFormState, message: string) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'fail', message })),
      validate: (_d: SettingsFormState, values: SettingsFormValues) => {
        const errors = validateSettingsForm(values);
        return Object.keys(errors).length === 0 ? null : errors;
      },
    },
  });
  return handle as SettingsFormStoreHandle;
};
```

- [ ] **Step 4: 实现 `src/SettingsRow.tsx`**

```tsx
/** 设置 → General 区「Prompt 优化」设置行：标题摘要 + 展开表单 */

import React, { useEffect, useState } from 'react';
import type { PromptConfig } from './optimizer.js';
import { DEFAULTS } from './optimizer.js';
import type { SettingsFormState, SettingsFormValues } from './settings-form-state.js';
import type { SettingsFormActions } from './settings-store.js';

export interface SettingsRowProps {
  t: (key: string) => string;
  useStore: <T>(selector: (s: SettingsFormState) => T) => T;
  actions: SettingsFormActions;
  getConfig: () => PromptConfig;
  saveConfig: (values: SettingsFormValues) => void;
  resetConfig: () => void;
  getEpoch: () => number;
}

const CSS_ID = 'dsh-prompt-optimizer/settings.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.optiSettings {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.optiSettingsTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.optiSettingsHint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.optiSettingsForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.optiSettingsField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.optiSettingsLabel {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.optiSettingsInput {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  padding: 6px 8px;
  font-size: 13px;
}
.optiSettingsRow {
  display: flex;
  gap: 8px;
  align-items: center;
}
.optiSettingsBtn {
  border: 0;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
  color: var(--dsw-alias-label-primary);
}
.optiSettingsBtn.primary {
  color: var(--dsw-alias-brand-primary-invert, #fff);
  background: var(--dsw-alias-brand-primary, #1677ff);
}
.optiSettingsErr {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 12px;
}
`;
  document.head.appendChild(style);
}

export function SettingsRow(props: SettingsRowProps) {
  const { t, useStore, actions, getConfig, saveConfig, resetConfig } = props;
  const [expanded, setExpanded] = useState(false);
  const [submitRevision, setSubmitRevision] = useState(0);

  const values = useStore((s) => s.values);
  const saved = useStore((s) => s.saved);
  const error = useStore((s) => s.error);

  useEffect(() => injectCss(), []);

  const config = getConfig();
  const modelLabel = config.model ? config.model : '—';

  // 首次挂载 / 配置变化时把当前配置播种进表单。
  // seed 修订号 = 本地提交序号 submitRevision + configEpoch（外部配置变化纪元）：
  //  - 外部配置变化（跨标签页/外部写入 → index.ts refreshConfig 的纪元递增）令修订号超过
  //    state.revision，重播种生效，表单跟上归一化后的镜像；
  //  - 保存/重置已通过 commit/seed 写入「新本地序号 + 当时纪元」的修订号，紧接的本次效应
  //    回跑（纪元未变）修订号相等被 reducer 抑制 → 保住用户原始输入与「已保存」提示；
  //    下次本地动作（edit/commit）再把 state.revision 抬到与纪元一致。
  useEffect(() => {
    actions.seed(
      { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
      submitRevision + getEpoch(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseUrl, config.apiKey, config.model, getEpoch]);

  const handleSave = () => {
    const errors = actions.validate(values);
    if (errors) {
      actions.fail(Object.values(errors)[0]);
      return;
    }
    saveConfig(values);
    setSubmitRevision((r) => r + 1);
    // 与效应回跑的 seed 修订号（新本地序号 + 纪元）对齐，使保存后的重播种被抑制
    actions.commit(submitRevision + 1 + getEpoch());
  };

  const handleReset = () => {
    resetConfig();
    actions.seed(
      { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model },
      submitRevision + 1 + getEpoch(),
    );
    setSubmitRevision((r) => r + 1);
  };

  return (
    <div className="optiSettings">
      <div className="optiSettingsTitle" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
        {t('settings.title')}
        {!expanded && <span className="optiSettingsHint"> · {t(config.apiKey ? 'card.configured.hint' : 'card.unconfigured.hint').replace('{model}', modelLabel)}</span>}
      </div>
      {!expanded && <div className="optiSettingsHint">{t('settings.clickToEdit')}</div>}

      {expanded && (
        <div className="optiSettingsForm">
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-base-url">{t('settings.baseUrl')}</label>
            <input
              id="opti-base-url"
              className="optiSettingsInput"
              value={values.baseUrl}
              placeholder={DEFAULTS.baseUrl}
              onChange={(e) => actions.edit('baseUrl', e.target.value)}
            />
          </div>
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-api-key">{t('settings.apiKey')}</label>
            <input
              id="opti-api-key"
              className="optiSettingsInput"
              type="password"
              value={values.apiKey}
              placeholder="sk-…"
              autoComplete="off"
              onChange={(e) => actions.edit('apiKey', e.target.value)}
            />
          </div>
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-model">{t('settings.model')}</label>
            <input
              id="opti-model"
              className="optiSettingsInput"
              value={values.model}
              placeholder={DEFAULTS.model}
              onChange={(e) => actions.edit('model', e.target.value)}
            />
          </div>
          <div className="optiSettingsRow">
            <button type="button" className="optiSettingsBtn primary" onClick={handleSave}>
              {t('settings.save')}
            </button>
            <button type="button" className="optiSettingsBtn" onClick={handleReset}>
              {t('settings.reset')}
            </button>
            {saved && <span className="optiSettingsHint">{t('settings.saved')}</span>}
            {error && <span className="optiSettingsErr">{t(error)}</span>}
          </div>
          <div className="optiSettingsHint">{t('settings.desc')}</div>
        </div>
      )}
    </div>
  );
}
```

> 注（评审补充）：表单校验已与 `checkConfig` 对齐（baseUrl 拒绝 query/hash）。
>
> 注（Task 5 评审补充）：表单 seed 修订号 = 本地提交序号 + configEpoch（外部配置变化（跨标签页/外部写入）经 epoch 重播种；保存后的抑制仍由本地序号守卫）。

- [ ] **Step 5: `src/index.ts` 追加设置行注册与快捷键**

在 `apply()` 中、会话槽位注册之后追加（`src/index.ts` 编辑）；并在 `apply()` 的配置镜像区（Task 3 所建）追加外部配置变化纪元：

```ts
  // 2.（Task 3 配置镜像区追加）外部配置变化纪元：驱动设置表单的 seed 修订号（见 Step 4/5 注）
  let configEpoch = 0;
  // 最近一次本地保存/重置的写入目标：区分 refreshConfig 的自回声（自身写入）与外部变化，
  // 只有外部变化才递增 configEpoch，保证保存后的表单抑制不被自身写入的回声破坏
  let lastSelfWrite: PromptConfig | null = null;
  const refreshConfig = () => {
    const next = mergeConfig(settingsScope.getSnapshot().value);
    if (lastSelfWrite === null || !configEquals(next, lastSelfWrite)) {
      configEpoch += 1; // 外部配置变化 → 纪元 +1，设置表单据此重播种
      lastSelfWrite = null;
    }
    configMirror = next;
  };
```

```ts
  // 6. 设置行（root 作用域）
  const settingsStore = createSettingsFormStore();
  const saveConfig = (raw: Partial<PromptConfig>) => {
    const merged = mergeConfig({ ...configMirror, ...raw });
    // 记录实际落盘值（apiKey 已 trim）：set 为异步 RPC，落盘后经 subscribe → refreshConfig
    // 回声；与 lastSelfWrite 一致则不计入 configEpoch。此处不调用 refreshConfig()——
    // 同步读到的仍是写入前的旧快照，镜像更新统一走 subscribe 回声路径。
    const written: PromptConfig = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model,
    };
    settingsScope.set('baseUrl', written.baseUrl);
    settingsScope.set('apiKey', written.apiKey);
    settingsScope.set('model', written.model);
    lastSelfWrite = written;
  };
  const resetConfig = () => {
    const written: PromptConfig = {
      baseUrl: DEFAULTS.baseUrl,
      apiKey: DEFAULTS.apiKey,
      model: DEFAULTS.model,
    };
    settingsScope.set('baseUrl', written.baseUrl);
    settingsScope.set('apiKey', written.apiKey);
    settingsScope.set('model', written.model);
    lastSelfWrite = written;
  };

  ctx.inject(['slots'], (scope) => {
    scope.slots.inject('settings.general.item', () =>
      scope.slots.register(
        {
          name: 'settings.general.item',
          id: 'prompt-optimizer-settings',
          order: 30,
          locale: NS,
          store: settingsStore,
          inject: () => ({
            getConfig: () => configMirror,
            saveConfig,
            resetConfig,
            getEpoch: () => configEpoch,
          }),
        },
        SettingsRow,
      ),
    );
  });

  // 7. 快捷键：Alt+O（焦点在 textarea 内时等效点击优化按钮）
  const onKeydown = (e: KeyboardEvent) => {
    if (!e.altKey || e.code !== 'KeyO') return;
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) return;
    e.preventDefault();
    emitOptimizeRequest();
  };
  document.addEventListener('keydown', onKeydown);
```

`index.ts` 依赖导入补全（含 `emitOptimizeRequest` 与 Task 5 新增依赖）：

```ts
import { emitOptimizeRequest } from './events.js';
import { DEFAULTS } from './optimizer.js';
import { createSettingsFormStore } from './settings-store.js';
import { SettingsRow } from './SettingsRow.tsx';
```

`OptimizeButton.tsx` 追加订阅（组件内；从 `./events.js` 导入避免循环依赖）：

```ts
import { onOptimizeRequest } from './events.js';
// 组件体内：
useEffect(() => onOptimizeRequest(handleClick), [handleClick, disabled]);
```

`index.ts` 的快捷键处理改为调用事件总线（替换原 `for (const fn of optimizeRequestListeners) fn();`）：

```ts
    // 通过按钮组件副作用触发优化请求
    emitOptimizeRequest();
```

`index.ts` 依赖导入补全：

```ts
import { DEFAULTS } from './optimizer.js';
import { createSettingsFormStore } from './settings-store.js';
import { SettingsRow } from './SettingsRow.tsx';
```

> 注：`signal`（Task 4 定义）当前仅作为「去设置」的轻量通知通道；设置行自动展开联动在本次交付中简化——「去设置」点击 = 关闭引导卡 + 触发信号（信号暂无订阅方，为后续设置页导航保留）。这符合 spec「引导 + 去设置」的文案与交互（用户随后自行到设置页展开）。

> 注（Task 2 评审补充）：保存配置时对 `apiKey` 做 `trim()`——`mergeConfig` 刻意保留 apiKey 原样（其测试断言 `' k '` 不变），`checkConfig` 用 `apiKey.trim()` 校验，若原样保存会在 `Authorization: Bearer  k ` 中夹带空格导致 401；由本任务保存层负责清理。在 `saveConfig` 中写入前对 `raw.apiKey` 执行 `raw.apiKey.trim()`。

- [ ] **Step 6: 构建 + 测试验证**

```bash
npm run build
# 期望： ✓ Built；无报错（若组件导入 @deepseek-ai 路径全部 external，无解析错误）
npm test
# 期望： ALL PASS
```

- [ ] **Step 7: 提交**

```bash
git add src/settings-form-state.ts src/settings-store.ts src/SettingsRow.tsx src/index.ts src/OptimizeButton.tsx tests/entry.ts dist/client.js
git commit -m "feat: settings row with expandable API config form + Alt+O shortcut"
```

---

## Task 6: 收尾（README、最终验证、安装到 profile）

**Files:**
- Create: `README.md`（安装/构建/配置/卸载，zh/en）
- Modify: `docs/superpowers/notes/2026-08-16-plugin-install-discovery.md`（补最终结论）
- 运行: `npm test`、`npm run build`、安装命令、手工验证清单

**Interfaces:**
- Consumes: 全部前序产物；Task 1 发现的安装契约
- Produces: 可安装交付物 `dist/client.js` + 安装步骤文档 + 通过清单

- [ ] **Step 1: 编写 `README.md`**

含并仅含以下区块（中英双语）：

```markdown
# dsh-prompt-optimizer

输入框 prompt 优化插件：一键把草稿润色为更清晰完整的 prompt（OpenAI 兼容 API，自配 Key）。

## 安装
```bash
npm run build
dsh plugin --profile web add .        # 若 Task 1 结论为契约 β，则改为：dsh plugin --profile web add ./plugin
```
编辑 `~/.dsh/profiles/web/cordis.patch.yml` 追加：
```yaml
- id: prompt-optimizer
  name: dsh-prompt-optimizer
```
重启 dsh web，刷新页面。

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
```

- [ ] **Step 2: 全量验证（构建 + 测试 + 产物形状）**

```bash
npm test
# 期望： ALL PASS (N)，退出码 0
npm run build
head -3 dist/client.js
# 期望： window.__ModuleLoader__.load({ id: "prompt-optimizer", ...
git status --short
# 期望： 无未提交源代码变更（dist/client.js 追踪与否依 Task 1 结论）
```

- [ ] **Step 3: 安装到 profile（改动运行环境，需与用户确认后执行）**

```bash
dsh plugin --profile web add .          # 契约 α；β 则 `add ./plugin`
# 期望： profile node_modules 出现 dsh-prompt-optimizer
printf -- '- id: prompt-optimizer\n  name: dsh-prompt-optimizer\n' >> ~/.dsh/profiles/web/cordis.patch.yml
tail -3 ~/.dsh/profiles/web/cordis.patch.yml
```

> 安装后需重启 dsh web 才生效（属用户操作；在交付说明中给出，不在此自动重启）。

- [ ] **Step 4: 建档手工验证清单（交付时逐项核对）**

| # | 检查项 | 预期 |
|---|---|---|
| 1 | 输入栏右侧出现 ✨ 按钮；无会话/空草稿时禁用 | 通过/失败 |
| 2 | 输入草稿点按钮 → optimizing → 预览卡片 | 通过/失败 |
| 3 | 替换草稿：输入框内容变为优化结果 | 通过/失败 |
| 4 | 复制/重新优化/放弃 各自生效 | 通过/失败 |
| 5 | Alt+O 焦点在输入框内触发；焦点在外不触发 | 通过/失败 |
| 6 | 未配置 key → 引导卡（去设置/知道了） | 通过/失败 |
| 7 | 设置行保存后刷新页面配置保持；恢复默认生效 | 通过/失败 |
| 8 | 401/断网/超时 → 对应文案 + 重试 | 通过/失败 |
| 9 | 中日…（中英）语言切换后文案正确 | 通过/失败 |
| 10 | 与皮肤插件共存、卸载后 GUI 恢复 | 通过/失败 |

- [ ] **Step 5: 提交**

```bash
git add README.md docs/superpowers/notes/2026-08-16-plugin-install-discovery.md
git commit -m "docs: README and install verification for prompt-optimizer"
```