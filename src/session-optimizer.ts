/**
 * 宿主通道优化（临时对话 + 当前会话模型，零配置）。
 *
 * 渲染进程没有「一次性生成拿结果」的 RPC，因此用一个可复用的临时会话承载优化：
 *   session.create（固定 sessionId，幂等）→ session.selectModel（继承当前会话模型）
 *   → session.prompt（queue 注入带规则的文本）→ 轮询 session.history 增量取正文（近似流式）
 *   → assistant/message 事件出现（完成信号）或连续无变化（settle）结束；中止走 session.cancel。
 *
 * 事件契约以真实持久化样本校准（~/.dsh/sessions 下各 session 目录的 session.jsonl.zstd）：
 *   - user 消息：{type:'user/message', data:{role:'user', content:[{type:'text',text}]}}
 *   - 助手流式增量：{type:'assistant/chunk', data:{chunk:{type:'delta', blockType:'text', text}}}
 *   - 助手消息完成：{type:'assistant/message', data:{message:{role, content:[...]}}}（完成信号）
 */

import type { Lang } from './optimizer.js';
import { buildSystemPrompt } from './optimizer.js';

/** connection.api.sessions 的最小面（注入式，便于单测）。 */
export interface HostSessionApi {
  create?: (payload: { sessionId?: string; workspaceId?: string; cwd?: string }) => Promise<unknown>;
  selectModel?: (payload: {
    sessionId: string;
    provider: string;
    model: string;
    reasoningEffort?: string;
  }) => Promise<unknown>;
  prompt?: (payload: { sessionId: string; mode: 'queue' | 'steer'; content: Array<{ type: 'text'; text: string }> }) => Promise<unknown>;
  history?: (payload: { sessionId: string }) => Promise<{ events?: Array<{ event?: unknown }> }>;
  cancel?: (payload: { sessionId: string }) => Promise<unknown>;
  models?: (payload: { sessionId: string }) => Promise<{ current?: { provider?: string; model?: string } } | null>;
}

export interface HostTextBlock {
  type?: string;
  text?: string;
  role?: string;
  content?: HostTextBlock[] | string;
  [k: string]: unknown;
}

/** 从事件 data 深搜收集文本块（`{type:'text',text}`），user 事件整体跳过。 */
export function collectTexts(data: HostTextBlock | undefined | null, out: string[], skipRoleUser: boolean): void {
  if (!data || typeof data !== 'object') return;
  if (data.role === 'user' && skipRoleUser) return;
  if (typeof data.type === 'string' && data.type !== 'user' && typeof data.text === 'string' && data.text.length > 0) {
    out.push(data.text);
    return;
  }
  if (Array.isArray(data.content)) {
    for (const part of data.content) collectTexts(part as HostTextBlock, out, skipRoleUser);
  }
}

export interface SessionFold {
  /** 已收集的助手正文（流式 delta 增量拼接；若没有 delta 则用完成消息的全文兜底）。 */
  text: string;
  /** 是否出现 assistant/message 完成信号。 */
  completed: boolean;
}

/** 把 history 事件列表折叠为 { 累积正文, 完成信号 }（按 seq 稳定排序；跳过 user 事件）。 */
export function foldSessionText(events: Array<{ event?: unknown }> | undefined): SessionFold {
  const empty: SessionFold = { text: '', completed: false };
  if (!Array.isArray(events)) return empty;
  type Ev = { type?: string; seq?: number; data?: HostTextBlock };
  const sorted: Ev[] = events
    .map((entry) => (entry && typeof entry === 'object' ? ((entry as { event?: unknown }).event as Ev) : undefined))
    .filter((e): e is Ev => !!e && typeof e === 'object');
  sorted.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const texts: string[] = [];
  let completed = false;
  let fallback = '';
  for (const ev of sorted) {
    const type = typeof ev.type === 'string' ? ev.type : '';
    if (type.includes('user') && !type.includes('assistant')) continue;
    if (type === 'assistant/chunk') {
      // 流式增量：data.chunk = { type:'delta', blockType:'text', text }
      const chunk = (ev.data as { chunk?: HostTextBlock } | undefined)?.chunk;
      if (chunk && chunk.type === 'delta' && chunk.blockType === 'text' && typeof chunk.text === 'string' && chunk.text) {
        texts.push(chunk.text);
      }
      continue;
    }
    if (type === 'assistant/message') {
      // 完成信号；消息全文作为 delta 缺失时的兜底（避免与增量重复，仅无 delta 时使用）
      completed = true;
      const message = (ev.data as { message?: HostTextBlock } | undefined)?.message;
      if (message && typeof message === 'object') {
        const buf: string[] = [];
        collectTexts(message, buf, false);
        fallback += buf.join('');
      }
      continue;
    }
  }
  // 完成信号时优先完整消息全文（流式增量轮询快照可能未到最终 delta，消息全文更完整）
  const text = completed ? fallback || texts.join('') : texts.join('');
  return { text, completed };
}

/** 累积文本按字符前缀计算增量（轮询近似流式用）。 */
export function prefixDelta(prev: string, next: string): string {
  const n = Math.min(prev.length, next.length);
  let i = 0;
  while (i < n && prev.charCodeAt(i) === next.charCodeAt(i)) i += 1;
  return next.slice(i);
}

/** 给挂起的 RPC 调用加超时（宿主通道任何一步都不允许无限阻塞 →「一直正在优化」）。 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export interface RunHostOptimizeOptions {
  api: HostSessionApi;
  /** 当前会话（模型来源）。 */
  parentSessionId: string;
  sessionId: string;
  lang: Lang;
  text: string;
  signal: AbortSignal;
  onDelta: (text: string) => void;
  intervalMs?: number;
  timeoutMs?: number;
  /** 无完成信号时，文本不再增长 N 轮后视为完成（契约兜底）。 */
  settleRounds?: number;
  /** 单步 RPC 挂起上限（默认 5s）。 */
  rpcTimeoutMs?: number;
}

const DEFAULT_INTERVAL_MS = 400;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_SETTLE_ROUNDS = 3;
const DEFAULT_RPC_TIMEOUT_MS = 5_000;

/**
 * 宿主通道全流程：创建/复用临时会话 → 继承当前会话模型 → 注入优化 prompt
 * → 轮询 history 直至 assistant/message 完成信号（或 settle / abort / 超时）。返回最终正文。
 */
export async function runHostOptimize(opts: RunHostOptimizeOptions): Promise<string> {
  const { api, parentSessionId, sessionId, lang, text, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const settleRounds = opts.settleRounds ?? DEFAULT_SETTLE_ROUNDS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error('aborted');

  // 1. 临时会话（幂等：已存在则忽略失败）
  try {
    await withTimeout(api.create?.({ sessionId }) ?? Promise.resolve(), rpcTimeoutMs, 'create');
  } catch {
    // 已存在（复用）或宿主暂不允许——继续，history 会告诉我们能不能用
  }

  // 2. 继承当前会话的模型（provider + model）
  try {
    const parent = await withTimeout(api.models?.({ sessionId: parentSessionId }) ?? Promise.resolve(), rpcTimeoutMs, 'models');
    if (parent?.current?.model) {
      await withTimeout(
        api.selectModel?.({
          sessionId,
          provider: parent.current.provider ?? 'deepseek-official',
          model: parent.current.model,
        }) ?? Promise.resolve(),
        rpcTimeoutMs,
        'selectModel',
      );
    }
  } catch {
    // 模型继承失败：临时会话用其默认模型继续
  }

  // 3. 注入优化指令（规则拼进 user 文本——临时会话无持久 system）
  const system = buildSystemPrompt(lang);
  const content = `${system}\n\n${text}`;
  await withTimeout(
    api.prompt?.({ sessionId, mode: 'queue', content: [{ type: 'text', text: content }] }) ?? Promise.resolve(),
    rpcTimeoutMs,
    'prompt',
  );

  // 4. 轮询 history：delta 增量流式呈现；assistant/message 完成信号到达立即收尾
  const started = Date.now();
  let lastText = '';
  let idleRounds = 0;
  for (;;) {
    if (signal.aborted) {
      try {
        await api.cancel?.({ sessionId });
      } catch {
        // 尽力取消
      }
      throw new Error('aborted');
    }
    if (Date.now() - started > timeoutMs) {
      try {
        await api.cancel?.({ sessionId });
      } catch {
        // 尽力取消
      }
      throw new Error('timeout');
    }
    let fold: SessionFold = { text: '', completed: false };
    try {
      const page = await api.history?.({ sessionId });
      fold = foldSessionText(page?.events);
    } catch {
      // 单次取失败不致命，下一轮再试
    }
    if (fold.completed) {
      // 完成信号：以当前（含最终 delta/全文兜底）文本收尾
      if (fold.text !== lastText && fold.text) onDelta(fold.text);
      return fold.text;
    }
    if (fold.text !== lastText) {
      idleRounds = 0;
      const delta = prefixDelta(lastText, fold.text);
      lastText = fold.text;
      if (delta) onDelta(lastText);
    } else {
      idleRounds += 1;
      if (idleRounds >= settleRounds) break;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return lastText;
}