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