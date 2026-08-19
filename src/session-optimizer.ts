/**
 * 宿主通道优化（零配置：server half 用 agentDefaultModel + llm.stream 真流式）。
 *
 * 渲染进程没有「一次性生成拿结果」的 RPC，也不该用 session.create/fork 创建后台会话
 * （后台会话不在前台不触发模型执行，实测「永远正在优化」）。正解取自 dsh-elf 的宿主
 * 服务面：server half（lib/index.js）持有 llm 与 agentDefaultModel 服务——
 *   sessionModel     → 当前会话/agent 默认模型（provider + model）
 *   optimize.start   → llm.stream 后台流式，增量累积到任务
 *   optimize.poll    → 取 { done, text }（接近 250ms 一次）
 *   optimize.abort   → 标记中止，后台流尽快停
 * client 经自有 RPC 通道（/dsh-prompt-optimizer）轮询增量呈现（近似流式）。
 */

import type { Lang } from './optimizer.js';

/** 自有 RPC 通道的最小面（注入式，便于单测）。 */
export interface HostRpc {
  call(endpoint: string, payload?: Record<string, unknown>): Promise<{
    ok: boolean;
    value?: unknown;
    error?: { code?: string; details?: unknown };
  }>;
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

export interface HostSessionInfo {
  provider: string;
  model: string;
  reasoningEffort?: string;
}

export interface RunHostOptimizeOptions {
  rpc: HostRpc;
  lang: Lang;
  text: string;
  system: string;
  signal: AbortSignal;
  onDelta: (text: string) => void;
  intervalMs?: number;
  timeoutMs?: number;
  rpcTimeoutMs?: number;
}

const DEFAULT_INTERVAL_MS = 250;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_RPC_TIMEOUT_MS = 5_000;

function callRpc<R = never>(
  rpc: HostRpc,
  endpoint: string,
  payload: Record<string, unknown>,
  ms: number,
): Promise<{ ok: true; value: R } | { ok: false; error?: { code?: string; details?: unknown } }> {
  return withTimeout(
    rpc.call(endpoint, payload),
    ms,
    endpoint,
  ) as Promise<{ ok: true; value: R } | { ok: false; error?: { code?: string; details?: unknown } }>;
}

/** 取当前会话/agent 默认模型（零配置）。不可得时返回 null。 */
export async function resolveHostSessionModel(
  rpc: HostRpc,
  rpcTimeoutMs = DEFAULT_RPC_TIMEOUT_MS,
): Promise<HostSessionInfo | null> {
  const res = await callRpc(rpc, 'sessionModel', {}, rpcTimeoutMs);
  if (!res.ok || !res.value || typeof res.value !== 'object') return null;
  const v = res.value as { provider?: unknown; model?: unknown };
  if (typeof v.provider !== 'string' || typeof v.model !== 'string') return null;
  const info: HostSessionInfo = { provider: v.provider, model: v.model };
  if (typeof (res.value as { reasoningEffort?: unknown }).reasoningEffort === 'string') {
    info.reasoningEffort = (res.value as { reasoningEffort?: string }).reasoningEffort;
  }
  return info;
}

/** 文本增量（字符前缀比较；轮询近似流式用）。 */
export function prefixDelta(prev: string, next: string): string {
  const n = Math.min(prev.length, next.length);
  let i = 0;
  while (i < n && prev.charCodeAt(i) === next.charCodeAt(i)) i += 1;
  return next.slice(i);
}

/**
 * 宿主通道全流程：取会话默认模型 → 后台 llm.stream 启动 → 轮询增量直至 done
 * （abort → 通知 server 中止后抛错；整体超时兜底）。返回最终正文。
 */
export async function runHostOptimize(opts: RunHostOptimizeOptions): Promise<string> {
  const { rpc, lang: _lang, text, system, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error('aborted');

  // 1. 会话默认模型（零配置；宿主服务不可用或无模型 → 明确失败，不静默）
  const session = await resolveHostSessionModel(rpc, rpcTimeoutMs);
  if (!session) throw new Error('host-unavailable');

  // 2. 启动后台流式任务
  const startedPayload: Record<string, unknown> = {
    provider: session.provider,
    model: session.model,
    text,
    system,
  };
  if (session.reasoningEffort) startedPayload.reasoningEffort = session.reasoningEffort;
  const start = await callRpc<{ taskId?: string }>(rpc, 'optimize.start', startedPayload, rpcTimeoutMs);
  if (!start.ok || !start.value || typeof start.value.taskId !== 'string') {
    throw new Error('host-start-rejected');
  }
  const taskId = start.value.taskId;

  // 3. 轮询增量直至 done
  const startedAt = Date.now();
  let last = '';
  try {
    for (;;) {
      if (signal.aborted) {
        try {
          await rpc.call('optimize.abort', { taskId });
        } catch {
          // 尽力
        }
        throw new Error('aborted');
      }
      if (Date.now() - startedAt > timeoutMs) {
        try {
          await rpc.call('optimize.abort', { taskId });
        } catch {
          // 尽力
        }
        throw new Error('timeout');
      }
      let poll: { done?: boolean; text?: string; error?: string | null } | null = null;
      try {
        const res = await callRpc<{ done?: boolean; text?: string; error?: string | null }>(
          rpc,
          'optimize.poll',
          { taskId },
          rpcTimeoutMs,
        );
        if (res.ok && res.value) poll = res.value;
      } catch {
        // 单次轮询失败不致命，下一轮再试
      }
      if (poll) {
        if (poll.error) throw new Error(poll.error);
        const textNow = poll.text ?? '';
        if (textNow !== last) {
          onDelta(textNow);
          last = textNow;
        }
        if (poll.done) return textNow;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } finally {
    // 任何退出路径都通知服务端停止后台任务
    try {
      await rpc.call('optimize.abort', { taskId });
    } catch {
      // 尽力
    }
  }
}