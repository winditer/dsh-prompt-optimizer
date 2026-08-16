/** 单测入口 — 所有任务在此汇总断言（esbuild 打包后由 scripts/test.mjs 执行） */

import assert from 'node:assert';

export function run(): boolean {
  const results: string[] = [];
  const failures: string[] = [];
  const check = (name: string, fn: () => void) => {
    try {
      fn();
      results.push(`✓ ${name}`);
    } catch (e) {
      failures.push(`✗ ${name}: ${(e as Error).message}`);
    }
  };

  check('harness self-test', () => {
    assert.strictEqual(1 + 1, 2);
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