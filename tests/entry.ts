/** 单测入口 — 所有任务在此汇总断言（esbuild 打包后由 scripts/test.mjs 执行） */

import assert from 'node:assert';
import { DEFAULTS, mergeConfig, normalizeBaseUrl, checkConfig, buildSystemPrompt, buildRequestBody, extractResult, canTrigger, optimize, OptimizeError, toErrorKind, extractSseDelta, resolveSessionModel } from '../src/optimizer.js';
import { prefixDelta, resolveHostSessionModel, runHostOptimize } from '../src/session-optimizer.js';
import { NS, zh, en, langOf } from '../src/locales.js';
import { INITIAL_PREVIEW, reducePreview, canOptimizeFrom } from '../src/preview-state.js';
import { validateSettingsForm } from '../src/settings-form-state.js';
import { INITIAL_SETTINGS_FORM, reduceSettingsForm } from '../src/settings-form-state.js';
import { classifyRefresh } from '../src/settings-epoch.js';
import { getPreviewBusState, dispatchPreview, subscribePreviewBus } from '../src/preview-bus.js';
import { runOptimize } from '../src/optimizer-store.js';

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
      { baseUrl: 'http://a', apiKey: ' k ', model: 'm', useSessionModel: true });
    assert.deepStrictEqual(mergeConfig({ baseUrl: '', apiKey: '', model: '' }), DEFAULTS);
    // useSessionModel 布尔透传；非布尔回退默认 true
    assert.strictEqual(mergeConfig({ useSessionModel: false }).useSessionModel, false);
    assert.strictEqual(mergeConfig({ useSessionModel: 'x' as never }).useSessionModel, true);
    // 旧默认 deepseek-chat 迁移到新默认 deepseek-v4-flash
    assert.strictEqual(mergeConfig({ model: 'deepseek-chat' }).model, DEFAULTS.model);
    // 用户自定义的 deepseek-chat 保留（显式选择不被迁移）
    assert.strictEqual(mergeConfig({ baseUrl: 'http://x', model: 'deepseek-chat' }).model, 'deepseek-chat');
  });

  await check('checkConfig: useSessionModel skips model requirement; resolveSessionModel reads current.model', async () => {
    // 会话模型模式：model 可空
    assert.strictEqual(checkConfig({ ...DEFAULTS, apiKey: 'k', model: '' }).ok, true);
    // 自定义模式：model 必填
    assert.strictEqual(
      checkConfig({ ...DEFAULTS, apiKey: 'k', model: '', useSessionModel: false }).ok,
      false,
    );
    // resolveSessionModel：正常返回 current.model，且 trim
    const api = { sessions: { models: async () => ({ current: { model: ' deepseek-v4-flash ' } }) } };
    assert.strictEqual(await resolveSessionModel(api as never), 'deepseek-v4-flash');
    // 异常/缺面/空值 → null（调用方回退自定义 model）
    assert.strictEqual(await resolveSessionModel(undefined), null);
    assert.strictEqual(await resolveSessionModel({ sessions: {} } as never), null);
    assert.strictEqual(
      await resolveSessionModel({ sessions: { models: async () => null } } as never),
      null,
    );
    assert.strictEqual(
      await resolveSessionModel({ sessions: { models: async () => { throw new Error('x') } } } as never),
      null,
    );
  });

  await check('extractSseDelta: content/reasoning events, [DONE], non-data and malformed lines', () => {
    assert.deepStrictEqual(extractSseDelta('data: {"choices":[{"delta":{"content":"你"}}]}'), { kind: 'content', text: '你' });
    assert.deepStrictEqual(extractSseDelta('data: {"choices":[{"delta":{"content":""}}]}'), { kind: 'content', text: '' });
    assert.deepStrictEqual(extractSseDelta('data: {"choices":[{"delta":{"reasoning_content":"We"}}]}'), { kind: 'reasoning', text: 'We' });
    assert.strictEqual(extractSseDelta('data: [DONE]'), null);
    assert.strictEqual(extractSseDelta('data: {"choices":[{"delta":{"role":"assistant"}}]}'), null);
    assert.strictEqual(extractSseDelta(': keep-alive comment'), null);
    assert.strictEqual(extractSseDelta(''), null);
    assert.strictEqual(extractSseDelta('data: {not json'), null);
    assert.strictEqual(extractSseDelta('data: {"choices":[]}'), null);
    // content 优先于 reasoning（两者同 chunk 时）
    assert.deepStrictEqual(
      extractSseDelta('data: {"choices":[{"delta":{"content":"正文","reasoning_content":"推理"}}]}'),
      { kind: 'content', text: '正文' },
    );
  });

  await check('checkConfig rejects missing key/model/bad url', () => {
    assert.strictEqual(checkConfig({ ...DEFAULTS, apiKey: '' }).ok, false);
    const noKey = checkConfig({ ...DEFAULTS, apiKey: '' });
    if (noKey.ok === false) assert.strictEqual(noKey.reason, 'missing-key');
    const noModel = checkConfig({ ...DEFAULTS, apiKey: 'k', model: '', useSessionModel: false });
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
    assert.strictEqual(body.model, DEFAULTS.model);
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

async function runStateTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('reducePreview begin → optimizing, generation bump, idempotent', () => {
    const once = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.strictEqual(once.status, 'optimizing');
    assert.strictEqual(once.generation, 1);
    const twice = reducePreview(once, { type: 'begin' });
    assert.strictEqual(twice, once, 'double begin returns same reference');
  });

  await check('show/fail only apply while optimizing; close resets', () => {
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

  await check('guide transitions from any non-optimizing state', () => {
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'guide' }).status, 'guide');
    const fromError = reducePreview(
      reducePreview(INITIAL_PREVIEW, { type: 'begin' }),
      { type: 'fail', kind: 'http' },
    );
    assert.strictEqual(reducePreview(fromError, { type: 'guide' }).status, 'guide');
  });

  await check('guide while optimizing returns same reference', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.strictEqual(reducePreview(began, { type: 'guide' }), began);
  });

  await check('reducePreview draft accumulates only while optimizing', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    const one = reducePreview(began, { type: 'draft', text: '你' });
    assert.strictEqual(one.draft, '你');
    assert.strictEqual(one.status, 'optimizing');
    const two = reducePreview(one, { type: 'draft', text: '你好' });
    assert.strictEqual(two.draft, '你好');
    assert.strictEqual(reducePreview(two, { type: 'show', result: 'R' }).draft, '');
    // idle 态丢弃 draft
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'draft', text: 'x' }).draft, '');
    // begin 清空历史 draft
    const re = reducePreview({ ...INITIAL_PREVIEW, status: 'error', draft: 'stale' }, { type: 'begin' });
    assert.strictEqual(re.draft, '');
  });

  await check('begin after fail resets errorKind and bumps generation', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    const failed = reducePreview(began, { type: 'fail', kind: 'http' });
    const retried = reducePreview(failed, { type: 'begin' });
    assert.strictEqual(retried.status, 'optimizing');
    assert.strictEqual(retried.errorKind, null);
    assert.strictEqual(retried.generation, began.generation + 1);
  });

  await check('real transitions never alias INITIAL_PREVIEW', () => {
    const began = reducePreview(INITIAL_PREVIEW, { type: 'begin' });
    assert.notStrictEqual(began, INITIAL_PREVIEW);
    const shown = reducePreview(began, { type: 'show', result: 'R' });
    assert.notStrictEqual(shown, INITIAL_PREVIEW);
    const failed = reducePreview(began, { type: 'fail', kind: 'http' });
    assert.notStrictEqual(failed, INITIAL_PREVIEW);
  });

  await check('validateSettingsForm', () => {
    assert.deepStrictEqual(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: 'k', model: 'm', useSessionModel: true }), {});
    assert.ok(validateSettingsForm({ baseUrl: '', apiKey: 'k', model: 'm', useSessionModel: true }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: '', model: 'm', useSessionModel: true }).apiKey);
    // 会话模型模式：model 可空
    assert.ok(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: 'k', model: '', useSessionModel: true }).model === undefined);
    // 自定义模式：model 必填
    assert.ok(validateSettingsForm({ baseUrl: 'https://a.com', apiKey: 'k', model: '', useSessionModel: false }).model);
    const bad = validateSettingsForm({ baseUrl: 'nonsense', apiKey: 'k', model: 'm', useSessionModel: true });
    assert.ok(bad.baseUrl);
  });

  await check('validateSettingsForm rejects ftp and query/hash', () => {
    assert.ok(validateSettingsForm({ baseUrl: 'ftp://x.y', apiKey: 'k', model: 'm' }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://x.y/v1?k=1', apiKey: 'k', model: 'm' }).baseUrl);
    assert.ok(validateSettingsForm({ baseUrl: 'https://x.y/v1#frag', apiKey: 'k', model: 'm' }).baseUrl);
  });

  await check('validateSettingsForm rejects whitespace-only values', () => {
    const blank = validateSettingsForm({ baseUrl: '  ', apiKey: ' ', model: '\t' });
    assert.ok(blank.baseUrl);
    assert.ok(blank.apiKey);
    assert.ok(blank.model);
  });
}

async function runLocaleTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('NS value', () => {
    assert.strictEqual(NS, 'prompt_optimizer');
  });
  await check('zh/en have identical key sets', () => {
    const keys = (d: Record<string, unknown>) => Object.keys(d).sort();
    assert.deepStrictEqual(keys(zh), keys(en));
    assert.ok(keys(zh).length >= 15, `expected >=15 keys, got ${keys(zh).length}`);
  });
  await check('all values non-empty', () => {
    for (const [k, v] of Object.entries(zh)) assert.ok(String(v).trim().length > 0, `zh.${k} empty`);
    for (const [k, v] of Object.entries(en)) assert.ok(String(v).trim().length > 0, `en.${k} empty`);
  });
  await check('zh/en placeholder tokens match per key', () => {
    const tokens = (v: string) => [...(v.match(/\{\w+\}/g) ?? [])].sort();
    for (const k of Object.keys(zh) as Array<keyof typeof zh>) {
      assert.deepStrictEqual(tokens(zh[k]), tokens(en[k]), `placeholder drift at ${k}`);
    }
  });
}

async function runOptimizeStoreTests(check: (name: string, fn: () => void | Promise<void>) => void | Promise<void>) {
  await check('langOf maps zh variants and defaults to en', () => {
    assert.strictEqual(langOf('zh'), 'zh');
    assert.strictEqual(langOf('zh-Hans-CN'), 'zh');
    assert.strictEqual(langOf('en'), 'en');
    assert.strictEqual(langOf('fr'), 'en');
    assert.strictEqual(langOf(''), 'en');
  });

  await check('canOptimizeFrom: idle/preview/error/guide allow, optimizing blocks', () => {
    assert.strictEqual(canOptimizeFrom('idle'), true);
    assert.strictEqual(canOptimizeFrom('preview'), true);
    assert.strictEqual(canOptimizeFrom('error'), true);
    assert.strictEqual(canOptimizeFrom('guide'), true);
    assert.strictEqual(canOptimizeFrom('optimizing'), false);
  });

  await check('runOptimize: host channel runs with ZERO config — empty apiKey must not trigger guide', async () => {
    dispatchPreview({ type: 'close' });
    const rpc = {
      call: async (endpoint: string) => {
        if (endpoint === 'sessionModel') return { ok: true, value: { provider: 'deepseek-official', model: 'm' } };
        if (endpoint === 'optimize.start') return { ok: true, value: { taskId: 't' } };
        if (endpoint === 'optimize.poll') return { ok: true, value: { done: true, text: '优化结果' } };
        return { ok: true, value: true };
      },
    };
    await runOptimize({
      getConfig: () => ({ ...DEFAULTS, apiKey: '', useSessionModel: true }),
      getLang: () => 'zh',
      getDraft: () => '  草稿  ',
      host: { rpc: rpc as never },
    });
    const st = getPreviewBusState();
    assert.strictEqual(st.status, 'preview', 'host channel should reach preview without config');
    assert.strictEqual(st.result, '优化结果');
    dispatchPreview({ type: 'close' });
  });
}

async function runSettingsStoreTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('reduceSettingsForm: seed, edit, commit, fail', () => {
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

  await check('reduceSettingsForm: stale seed ignored, edit keeps dirty', () => {
    const seeded = reduceSettingsForm(INITIAL_SETTINGS_FORM, {
      type: 'seed',
      values: { baseUrl: 'https://a.com', apiKey: 'k', model: 'm' },
      revision: 2,
    });
    const stale = reduceSettingsForm(seeded, {
      type: 'seed',
      values: { baseUrl: 'https://b.com', apiKey: 'x', model: 'y' },
      revision: 1,
    });
    assert.strictEqual(stale, seeded, 'older revision must return same reference');
    assert.strictEqual(stale.values.baseUrl, 'https://a.com');
  });

  await check('reduceSettingsForm: newer seed applies and advances revision', () => {
    const seeded = reduceSettingsForm(INITIAL_SETTINGS_FORM, {
      type: 'seed',
      values: { baseUrl: 'https://a.com', apiKey: 'k', model: 'm' },
      revision: 2,
    });
    const newer = reduceSettingsForm(seeded, {
      type: 'seed',
      values: { baseUrl: 'https://c.com', apiKey: 'z', model: 'n' },
      revision: 3,
    });
    assert.notStrictEqual(newer, seeded, 'newer revision must apply (new reference)');
    assert.strictEqual(newer.values.baseUrl, 'https://c.com');
    assert.strictEqual(newer.values.apiKey, 'z');
    assert.strictEqual(newer.revision, 3);
  });
}

async function runPreviewBusTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('host channel: runtime-host rpc — polls increments and streams deltas', async () => {
    let pollCalls = 0;
    const abortCalls: string[] = [];
    const rpc = {
      call: async (endpoint: string, payload?: Record<string, unknown>) => {
        if (endpoint === 'sessionModel') return { ok: true, value: { provider: 'deepseek-official', model: 'deepseek-v4-flash-cmp' } };
        if (endpoint === 'optimize.start') return { ok: true, value: { taskId: 'po-task-1' } };
        if (endpoint === 'optimize.poll') {
          pollCalls += 1;
          const progress = Math.min(pollCalls, 3);
          return { ok: true, value: { done: progress === 3, text: progress === 1 ? 'tok1' : progress === 2 ? 'tok1tok2' : 'tok1tok2tok3' } };
        }
        if (endpoint === 'optimize.abort') { abortCalls.push(String(payload?.taskId)); return { ok: true, value: true }; }
        return { ok: false, error: { code: 'unknown' } };
      },
    };
    const deltas: string[] = [];
    const result = await runHostOptimize({
      rpc: rpc as never,
      lang: 'zh',
      text: '草稿',
      system: 'optimize',
      signal: new AbortController().signal,
      onDelta: (text) => deltas.push(text),
      intervalMs: 1,
      timeoutMs: 5000,
    });
    assert.strictEqual(result, 'tok1tok2tok3');
    assert.deepStrictEqual(deltas, ['tok1', 'tok1tok2', 'tok1tok2tok3']);
    assert.ok(pollCalls >= 3, `polled until done, got ${pollCalls}`);
    assert.deepStrictEqual(abortCalls, ['po-task-1'], 'cleanup aborts the background task');
  });

  await check('host channel: rrpc poll done on first round returns immediately', async () => {
    let pollCalls = 0;
    const rpc = {
      call: async (endpoint: string) => {
        if (endpoint === 'sessionModel') return { ok: true, value: { provider: 'p', model: 'm' } };
        if (endpoint === 'optimize.start') return { ok: true, value: { taskId: 't' } };
        if (endpoint === 'optimize.poll') { pollCalls += 1; return { ok: true, value: { done: true, text: '完整结果' } }; }
        return { ok: true, value: true };
      },
    };
    const deltas: string[] = [];
    const result = await runHostOptimize({
      rpc: rpc as never,
      lang: 'zh',
      text: 'd',
      system: 's',
      signal: new AbortController().signal,
      onDelta: (text) => deltas.push(text),
      intervalMs: 1,
      timeoutMs: 5000,
    });
    assert.strictEqual(result, '完整结果');
    assert.deepStrictEqual(deltas, ['完整结果']);
    assert.strictEqual(pollCalls, 1, 'done → single poll, no waiting');
  });

  await check('host channel: resolveHostSessionModel parses provider/model, null on failure', async () => {
    assert.deepStrictEqual(
      await resolveHostSessionModel({ call: async () => ({ ok: true, value: { provider: 'p', model: 'm', reasoningEffort: 'high' } }) } as never),
      { provider: 'p', model: 'm', reasoningEffort: 'high' },
    );
    assert.strictEqual(await resolveHostSessionModel({ call: async () => ({ ok: false, error: { code: 'no-model' } }) } as never), null);
    assert.strictEqual(await resolveHostSessionModel({ call: async () => ({ ok: true, value: {} }) } as never), null);
  });

  await check('host channel: sessionModel unavailable fails loud (no silent polling)', async () => {
    const rpc = { call: async () => ({ ok: false, error: { code: 'no-agent-model' } }) };
    await assert.rejects(
      runHostOptimize({
        rpc: rpc as never,
        lang: 'zh',
        text: 'x',
        system: 's',
        signal: new AbortController().signal,
        onDelta: () => undefined,
      }),
      /host-unavailable/,
    );
  });

  await check('host channel: abort notifies server and rejects', async () => {
    const controller = new AbortController();
    const abortCalls: string[] = [];
    const rpc = {
      call: async (endpoint: string, payload?: Record<string, unknown>) => {
        if (endpoint === 'sessionModel') return { ok: true, value: { provider: 'p', model: 'm' } };
        if (endpoint === 'optimize.start') return { ok: true, value: { taskId: 't' } };
        if (endpoint === 'optimize.poll') return { ok: true, value: { done: false, text: '' } };
        if (endpoint === 'optimize.abort') { abortCalls.push(String(payload?.taskId)); return { ok: true, value: true }; }
        return { ok: false, error: { code: 'unknown' } };
      },
    };
    const run = runHostOptimize({
      rpc: rpc as never,
      lang: 'zh',
      text: 'x',
      system: 's',
      signal: controller.signal,
      onDelta: () => undefined,
      intervalMs: 5,
      timeoutMs: 50_000,
    });
    setTimeout(() => controller.abort(), 10);
    await assert.rejects(run, /aborted/);
    assert.ok(abortCalls.includes('t'), 'abort notifies server (loop + finally cleanup)');
  });

  // 模块级单例：先回到 idle，避免污染其他用例
  dispatchPreview({ type: 'close' });

  await check('preview-state: begin binds sessionId; card belongs to origin session', () => {
    const begun = reducePreview(INITIAL_PREVIEW, { type: 'begin', sessionId: 'sess-a' });
    assert.strictEqual(begun.status, 'optimizing');
    assert.strictEqual(begun.sessionId, 'sess-a');
    // draft/show 保持绑定；close 清空
    const drafted = reducePreview(begun, { type: 'draft', text: 'x' });
    assert.strictEqual(drafted.sessionId, 'sess-a');
    const shown = reducePreview(begun, { type: 'show', result: 'R' });
    assert.strictEqual(shown.sessionId, 'sess-a');
    assert.strictEqual(reducePreview(shown, { type: 'close' }).sessionId, null);
    // 无 sessionId 的 begin（未提供）→ null
    assert.strictEqual(reducePreview(INITIAL_PREVIEW, { type: 'begin' }).sessionId, null);
  });

  await check('preview-bus: dispatch drives state via reducer and notifies subscribers', () => {
    let notified = 0;
    const off = subscribePreviewBus(() => { notified += 1; });
    try {
      dispatchPreview({ type: 'begin' });
      assert.strictEqual(getPreviewBusState().status, 'optimizing');
      assert.strictEqual(notified, 1);
      dispatchPreview({ type: 'show', result: 'x' });
      assert.strictEqual(getPreviewBusState().status, 'preview');
      assert.strictEqual(getPreviewBusState().result, 'x');
      assert.strictEqual(notified, 2);
    } finally {
      off();
      dispatchPreview({ type: 'close' });
    }
    assert.strictEqual(getPreviewBusState().status, 'idle');
  });

  await check('preview-bus: unsubscribed listener no longer notified', () => {
    let notified = 0;
    const off = subscribePreviewBus(() => { notified += 1; });
    off();
    dispatchPreview({ type: 'begin' });
    assert.strictEqual(notified, 0);
    dispatchPreview({ type: 'close' });
    assert.strictEqual(getPreviewBusState().status, 'idle');
  });
}

async function runEpochTests(check: (name: string, fn: () => void | Promise<void>) => void) {
  await check('classifyRefresh: external when no pending write', () => {
    const cur = { baseUrl: 'https://a.com', apiKey: 'k', model: 'm' };
    assert.strictEqual(classifyRefresh(cur, null), 'external');
  });

  await check('classifyRefresh: in-progress during partial echoes, converged at full target', () => {
    const target = { baseUrl: 'https://new.com', apiKey: 'k2', model: 'm2' };
    const partials = [
      { baseUrl: 'https://new.com', apiKey: 'k', model: 'm' },      // echo1: baseUrl only
      { baseUrl: 'https://new.com', apiKey: 'k2', model: 'm' },     // echo2: baseUrl+apiKey
    ];
    for (const p of partials) assert.strictEqual(classifyRefresh(p, target), 'in-progress');
    assert.strictEqual(classifyRefresh(target, target), 'converged');
  });

  await check('classifyRefresh: external edit mid-round is not converged', () => {
    const target = { baseUrl: 'https://new.com', apiKey: 'k2', model: 'm2' };
    const ext = { baseUrl: 'https://new.com', apiKey: 'k2', model: 'external' };
    assert.strictEqual(classifyRefresh(ext, target), 'in-progress');
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

  await runStateTests(check);
  await runLocaleTests(check);
  await runOptimizeStoreTests(check);
  await runSettingsStoreTests(check);
  await runPreviewBusTests(check);
  await runEpochTests(check);

  for (const r of results) console.log(r);
  if (failures.length > 0) {
    for (const f of failures) console.error(f);
    console.error(`FAILED: ${failures.length}`);
    return false;
  }
  console.log(`ALL PASS (${results.length})`);
  return true;
}
