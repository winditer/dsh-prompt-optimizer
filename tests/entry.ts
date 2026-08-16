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