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

// 注入构建 ID（当前 git 短哈希）
const BUILD_ID = (
  await (async () => {
    try {
      const { execSync } = await import('node:child_process');
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'dev';
    }
  })()
).trim();

const bundle = readFileSync(outRaw, 'utf8').split('__BUILD_ID__').join(BUILD_ID);

// 运行时约束（Task 6 实证）：bundle 的 load id 必须等于安装包名（图行 id = entry.options.name），
// 否则 arrive() 抛出 "bundle loaded without registering <id>"。包名即 dsh-prompt-optimizer。
const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-prompt-optimizer",
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