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
  /** 宿主通道步骤进度（卡片显示，定位卡点） */
  onStep?: (step: 'model' | 'start' | 'poll') => void;
  /** client 侧诊断埋点（本地 console，不再走 RPC——desktop rpc.call 同流程二次调用会挂） */
  trace?: (msg: string) => void;
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
 * 宿主通道全流程（单次 RPC 交付）：server half 解析会话默认模型 → llm.stream 跑完
 * → 一次性返回全文。不用「start + 轮询 poll」的分步协议：desktop 渲染进程的
 * rpc.call 在同一流程的第二次调用会挂死（实测 sessionModel 成功、start 永不达），
 * 单次调用绕开该限制。卡片无逐字滚动（流式能力保留在 fetch 通道）。
 */
export async function runHostOptimize(opts: RunHostOptimizeOptions): Promise<string> {
  const { rpc, lang: _lang, text, system, signal, onDelta, onStep, trace } = opts;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error('aborted');
  onStep?.('model');
  trace?.(`runHostOptimize: single-call optimize.run textLen=${text.length}`);

  // 单次 RPC：server 内部解析会话模型 + 跑完整流（超时对齐外层 deadline）
  const run = await callRpc<{ text?: string }>(rpc, 'optimize.run', { text, system }, Math.max(timeoutMs, rpcTimeoutMs) + 5_000);
  if (!run.ok || !run.value || typeof run.value.text !== 'string') {
    trace?.('runHostOptimize: optimize.run FAILED');
    const code = (!run.ok && run.error && run.error.code) || '';
    const details = (!run.ok && run.error && run.error.details) || '';
    throw new Error(`host-start-rejected${code ? `: ${code} ${details || ''}`.trim() : ''}`);
  }
  onStep?.('poll');
  trace?.(`runHostOptimize: optimize.run ok textLen=${run.value.text.length}`);
  if (signal.aborted) throw new Error('aborted');
  onDelta(run.value.text);
  return run.value.text;
}
