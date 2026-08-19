/**
 * 宿主通道优化（临时对话 + 当前会话模型，零配置）。
 *
 * 渲染进程没有「一次性生成拿结果」的 RPC，因此用一个可复用的临时会话承载优化：
 *   session.create（固定 sessionId，幂等）→ session.selectModel（继承当前会话模型）
 *   → session.prompt（queue 注入带规则的文本）→ 轮询 session.history 增量取正文（近似流式）
 *   → 完成/连续无变化（settle）结束；中止走 session.cancel。
 *
 * 事件契约做宽匹配（宿主 data 形状未完全公开）：只收 message/assistant 类事件的
 * text 块，跳过 user 事件（防回显我们注入的 prompt），settle 兜底防卡死。
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

/**
 * 把 history 事件列表折叠为累积正文（按 seq 稳定排序；只收 message/assistant 类事件）。
 * 返回空文本不视为失败（多轮轮询自然累积）。
 */
export function foldSessionText(events: Array<{ event?: unknown }> | undefined): string {
  if (!Array.isArray(events)) return '';
  type Ev = { type?: string; seq?: number; data?: HostTextBlock };
  const sorted: Ev[] = events
    .map((entry) => (entry && typeof entry === 'object' ? ((entry as { event?: unknown }).event as Ev) : undefined))
    .filter((e): e is Ev => !!e && typeof e === 'object');
  sorted.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const texts: string[] = [];
  for (const ev of sorted) {
    const type = typeof ev.type === 'string' ? ev.type : '';
    // 只关心消息/助手类事件；明确跳过 user 与纯工具/系统事件
    if (type.includes('user') && !type.includes('assistant')) continue;
    if (!/(message|assistant|text|answer|reply|completion)/i.test(type)) continue;
    collectTexts(ev.data, texts, true);
  }
  return texts.join('');
}

/** 累积文本按字符前缀计算增量（轮询近似流式用）。 */
export function prefixDelta(prev: string, next: string): string {
  const n = Math.min(prev.length, next.length);
  let i = 0;
  while (i < n && prev.charCodeAt(i) === next.charCodeAt(i)) i += 1;
  return next.slice(i);
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
  /** 文本不再增长 N 轮后视为完成（契约兜底）。 */
  settleRounds?: number;
}

const DEFAULT_INTERVAL_MS = 400;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_SETTLE_ROUNDS = 3;

/**
 * 宿主通道全流程：创建/复用临时会话 → 继承当前会话模型 → 注入优化 prompt
 * → 轮询 history 直至文本 settle（或 abort / 超时）。返回最终正文。
 */
export async function runHostOptimize(opts: RunHostOptimizeOptions): Promise<string> {
  const { api, parentSessionId, sessionId, lang, text, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const settleRounds = opts.settleRounds ?? DEFAULT_SETTLE_ROUNDS;
  if (signal.aborted) throw new Error('aborted');

  // 1. 临时会话（幂等：已存在则忽略失败）
  try {
    await api.create?.({ sessionId });
  } catch {
    // 已存在（复用）或宿主暂不允许——继续，history 会告诉我们能不能用
  }

  // 2. 继承当前会话的模型（provider + model）
  try {
    const parent = await api.models?.({ sessionId: parentSessionId });
    if (parent?.current?.model) {
      await api.selectModel?.({
        sessionId,
        provider: parent.current.provider ?? 'deepseek-official',
        model: parent.current.model,
      });
    }
  } catch {
    // 模型继承失败：临时会话用其默认模型继续
  }

  // 3. 注入优化指令（规则拼进 user 文本——临时会话无持久 system）
  const system = buildSystemPrompt(lang);
  const content = `${system}\n\n${text}`;
  const accepted = await api.prompt?.({ sessionId, mode: 'queue', content: [{ type: 'text', text: content }] });
  if (accepted === undefined) throw new Error('host-prompt-unavailable');

  // 4. 轮询 history 增量取正文
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
    let current = '';
    try {
      const page = await api.history?.({ sessionId });
      current = foldSessionText(page?.events);
    } catch {
      // 单次取失败不致命，下一轮再试
    }
    if (current !== lastText) {
      idleRounds = 0;
      const delta = prefixDelta(lastText, current);
      lastText = current;
      if (delta) onDelta(lastText);
    } else {
      idleRounds += 1;
      if (idleRounds >= settleRounds) break;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return lastText;
}