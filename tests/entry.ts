/** 单测入口 — 所有任务在此汇总断言（esbuild 打包后由 scripts/test.mjs 执行） */

import assert from 'node:assert';
import { DEFAULTS, mergeConfig, normalizeBaseUrl, checkConfig, buildSystemPrompt, buildRequestBody, extractResult, canTrigger, optimize, OptimizeError, toErrorKind } from '../src/optimizer.js';

async function runOptimizerTests(check: (name: string, fn: () => void | Promise<void>) => void | Promise<void>) {
  await check('normalizeBaseUrl trims trailing slashes', () => {
    assert.strictEqual(normalizeBaseUrl('https://api.deepseek.com/'), 'https://api.deepseek.com');
    assert.strictEqual(normalizeBaseUrl('https://api.deepseek.com///'), 'https://api.deepseek.com');
    assert.strictEqual(normalizeBaseUrl(' https://x.y '), 'https://x.y');
  });

  await check('mergeConfig applies defaults and trims', () => {
    assert.deepStrictEqual(mergeConfig(undefined), DEFAULTS);
    assert.strictEqual(mergeConfig({}).baseUrl, DEFAULTS.baseUrl);
    assert.deepStrictEqual(mergeConfig({ baseUrl: ' http://a/ ', apiKey: ' k ', model: ' m ' }),
      { baseUrl: 'http://a', apiKey: ' k ', model: 'm' });
    assert.deepStrictEqual(mergeConfig({ baseUrl: '', apiKey: '', model: '' }), DEFAULTS);
  });

  await check('checkConfig rejects missing key/model/bad url', () => {
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

  await check('checkConfig rejects baseUrl with query/hash', () => {
    assert.strictEqual(checkConfig({ ...DEFAULTS, apiKey: 'k', baseUrl: 'https://x.y?a=1' }).ok, false);
    assert.strictEqual(checkConfig({ ...DEFAULTS, apiKey: 'k', baseUrl: 'https://x.y#frag' }).ok, false);
    const clean = checkConfig({ ...DEFAULTS, apiKey: 'k', baseUrl: 'https://x.y' });
    assert.strictEqual(clean.ok, true);
  });

  await check('buildSystemPrompt zh/en non-empty and distinct', () => {
    assert.ok(buildSystemPrompt('zh').length > 40);
    assert.ok(buildSystemPrompt('en').length > 40);
    assert.notStrictEqual(buildSystemPrompt('zh'), buildSystemPrompt('en'));
  });

  await check('buildRequestBody shape', () => {
    const body = buildRequestBody({ ...DEFAULTS, apiKey: 'k' }, '写个计划', 'zh') as Record<string, unknown>;
    assert.strictEqual(body.model, 'deepseek-chat');
    assert.strictEqual((body as { stream: boolean }).stream, false);
    const messages = body.messages as Array<{ role: string; content: string }>;
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].role, 'system');
    assert.strictEqual(messages[1].content, '写个计划');
  });

  await check('extractResult unwraps fences and trims', () => {
    assert.strictEqual(extractResult('  你好  '), '你好');
    assert.strictEqual(extractResult('```\n优化后正文\n```'), '优化后正文');
    assert.strictEqual(extractResult('```markdown\nA\nB\n```'), 'A\nB');
    assert.strictEqual(extractResult('```\n```'), '');
  });

  await check('extractResult preserves 4-backtick fences (no corruption)', () => {
    assert.strictEqual(extractResult('````\nfoo\n````'), '````\nfoo\n````');
  });

  await check('extractResult unwraps tagged fence without trailing newline', () => {
    assert.strictEqual(extractResult('```json\n{"a":1}```'), '{"a":1}');
  });

  await check('canTrigger', () => {
    assert.strictEqual(canTrigger(' ', false), false);
    assert.strictEqual(canTrigger('', false), false);
    assert.strictEqual(canTrigger('x', true), false);
    assert.strictEqual(canTrigger('x', false), true);
  });

  await check('optimize success path (stubbed fetch)', async () => {
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

  await check('optimize 401 → unauthorized', async () => {
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

  await check('optimize empty content → empty', async () => {
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

  await check('toErrorKind maps TypeError to network, OptimizeError passthrough', () => {
    assert.strictEqual(toErrorKind(new TypeError('Failed to fetch')).kind, 'network');
    assert.strictEqual(toErrorKind(new OptimizeError('timeout', 't')).kind, 'timeout');
    assert.strictEqual(toErrorKind(new Error('boom')).kind, 'network');
  });

  await check('toErrorKind maps CORS TypeError to cors', () => {
    assert.strictEqual(toErrorKind(new TypeError('Failed to fetch: CORS policy blocks...')).kind, 'cors');
  });

  await check('optimize 403 → forbidden', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () => new Response('{}', { status: 403 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'en' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'forbidden',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize 500 → http', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () => new Response('oops', { status: 500 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'en' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'http',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize 200 invalid JSON → bad-response', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () => new Response('not json', { status: 200 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'zh' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'bad-response',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize 200 empty choices → empty', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () =>
      new Response(JSON.stringify({ choices: [] }), { status: 200 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'zh' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'empty',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize 200 non-string content → empty', async () => {
    const original = globalThis.fetch;
    (globalThis as { fetch: unknown }).fetch = async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 42 } }] }), { status: 200 });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'zh' }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'empty',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize aborted signal → timeout', async () => {
    const original = globalThis.fetch;
    const ac = new AbortController();
    ac.abort();
    // 永不 resolve 的 stub：仅当 signal 中止时 reject（AbortError），让 optimize 的 catch 落 toErrorKind → timeout
    (globalThis as { fetch: unknown }).fetch = (_url: unknown, init?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) reject(new DOMException('aborted', 'AbortError'));
        else signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    try {
      await assert.rejects(
        optimize({ config: { ...DEFAULTS, apiKey: 'k' }, text: 'd', lang: 'zh', signal: ac.signal }),
        (e: unknown) => e instanceof OptimizeError && e.kind === 'timeout',
      );
    } finally {
      (globalThis as { fetch: unknown }).fetch = original;
    }
  });

  await check('optimize invalid config (empty apiKey) → config', async () => {
    await assert.rejects(
      optimize({ config: { ...DEFAULTS, apiKey: '' }, text: 'd', lang: 'zh' }),
      (e: unknown) => e instanceof OptimizeError && e.kind === 'config',
    );
  });
}

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

  await runOptimizerTests(check);

  for (const r of results) console.log(r);
  if (failures.length > 0) {
    for (const f of failures) console.error(f);
    console.error(`FAILED: ${failures.length}`);
    return false;
  }
  console.log(`ALL PASS (${results.length})`);
  return true;
}