/** Prompt 优化核心：配置校验、OpenAI 兼容调用、结果提取 —— 纯函数，零 DSH 依赖 */

export interface PromptConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** true（默认）：优化请求使用当前会话的模型；false：使用下方自定义 model */
  useSessionModel: boolean;
}

export const DEFAULTS: PromptConfig = {
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat',
  useSessionModel: true,
};

export type Lang = 'zh' | 'en';

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function mergeConfig(raw: Partial<PromptConfig> | null | undefined): PromptConfig {
  const baseUrl = typeof raw?.baseUrl === 'string' && raw.baseUrl.trim() ? raw.baseUrl.trim() : DEFAULTS.baseUrl;
  const apiKey = typeof raw?.apiKey === 'string' ? raw.apiKey : DEFAULTS.apiKey;
  const model = typeof raw?.model === 'string' && raw.model.trim() ? raw.model.trim() : DEFAULTS.model;
  const useSessionModel = typeof raw?.useSessionModel === 'boolean' ? raw.useSessionModel : DEFAULTS.useSessionModel;
  return { baseUrl: normalizeBaseUrl(baseUrl), apiKey, model, useSessionModel };
}

export type ConfigProblem = 'missing-key' | 'missing-model' | 'bad-url';
export type ConfigCheck = { ok: true; config: PromptConfig } | { ok: false; reason: ConfigProblem };

export function checkConfig(config: PromptConfig): ConfigCheck {
  if (!config.apiKey.trim()) return { ok: false, reason: 'missing-key' };
  // 使用当前会话模型时无需自定义 model；仅自定义模式要求 model 非空
  if (!config.useSessionModel && !config.model.trim()) return { ok: false, reason: 'missing-model' };
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

export function buildRequestBody(config: PromptConfig, text: string, lang: Lang, stream = false): object {
  return {
    model: config.model,
    messages: [
      { role: 'system', content: buildSystemPrompt(lang) },
      { role: 'user', content: text },
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream,
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
    // 尽力而为：Chromium 的 CORS 失败通常是 TypeError("Failed to fetch")（无 cors 字样），会落到 network；此分支仅捕获自带 CORS 字样的错误。
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

/**
 * SSE 增量事件：内容或推理过程的一段文本。
 * v4 系模型（v4-flash 等）流式先输出长段 reasoning_content（推理过程），随后才输出
 * content 正文——两者都要实时呈现，否则推理期卡片看起来像「非流式」（实测 ~80 个 chunk
 * 全是 reasoning，正文最后才出现）。
 */
export type SseDelta =
  | { kind: 'content'; text: string }
  | { kind: 'reasoning'; text: string };

/**
 * 解析一行 SSE 数据：(data: {...}) → 增量事件；
 * [DONE]/非 data 行/非 JSON/无内容 delta → null。纯函数，便于单测。
 */
export function extractSseDelta(line: string): SseDelta | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const data = trimmed.slice('data:'.length).trim();
  if (data === '[DONE]') return null;
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { delta?: { content?: unknown; reasoning_content?: unknown } };
  const delta = first?.delta;
  if (typeof delta?.content === 'string') return { kind: 'content', text: delta.content };
  if (typeof delta?.reasoning_content === 'string') return { kind: 'reasoning', text: delta.reasoning_content };
  return null;
}

/**
 * 流式优化：逐块解析 SSE，边收边回调 onText(delta)；返回完整正文。
 * 相比非流式 optimize()：首字更快、长输出不需要等完整生成——按钮/卡片能边生成边显示。
 */
export async function optimizeStream(opts: {
  config: PromptConfig;
  text: string;
  lang: Lang;
  signal?: AbortSignal;
  onEvent?: (delta: SseDelta) => void;
}): Promise<string> {
  const { config, text, lang, signal, onEvent } = opts;
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
      body: JSON.stringify(buildRequestBody(config, text, lang, true)),
      signal,
    });
  } catch (e) {
    throw toErrorKind(e);
  }

  if (res.status === 401) throw new OptimizeError('unauthorized', `HTTP 401`);
  if (res.status === 403) throw new OptimizeError('forbidden', `HTTP 403`);
  if (!res.ok) throw new OptimizeError('http', `HTTP ${res.status}`);
  if (!res.body) throw new OptimizeError('bad-response', 'missing response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const delta = extractSseDelta(line);
        if (delta !== null) {
          onEvent?.(delta);
          if (delta.kind === 'content') full += delta.text;
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // 已中止/释放时忽略
    }
  }
  // 尾行（无换行结尾的 data 行）
  if (buffer.trim()) {
    const delta = extractSseDelta(buffer);
    if (delta !== null) {
      onEvent?.(delta);
      if (delta.kind === 'content') full += delta.text;
    }
  }

  const content = extractResult(full);
  if (!content.trim()) throw new OptimizeError('empty', 'empty completion');
  return content;
}

/**
 * 解析「当前会话模型」：调 connection 的 session.models RPC，取 current.model。
 * api 注入式（与 DSH 解耦便于单测）；任何失败返回 null（由调用方回退自定义 model）。
 */
export async function resolveSessionModel(
  api:
    | {
        sessions?: {
          models?: (payload?: unknown, signal?: AbortSignal) => Promise<{ current?: { model?: string } } | null>;
        };
      }
    | undefined,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const res = await api?.sessions?.models?.({}, signal);
    const m = res?.current?.model;
    return typeof m === 'string' && m.trim() ? m.trim() : null;
  } catch {
    return null;
  }
}
