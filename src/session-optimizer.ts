/**
 * 宿主通道优化（零配置：server half 用 agentDefaultModel + llm.stream 真流式）。
 *
 * 渲染进程没有「一次性生成拿结果」的 RPC，也不该用 session.create/fork 创建后台会话
 * （后台会话不在前台不触发模型执行，实测「永远正在优化」）。正解取自 dsh-elf 的宿主
 * 服务面：server half（lib/index.js）持有 llm 与 agentDefaultModel 服务——
 *   sessionModel       → 当前会话/agent 默认模型（provider + model）
 *   optimize.stream    → SSE 真流式：llm.stream 每个 text-delta 即时推送（逐 token）
 *   optimize.start     → 后台流式累积（降级方案）
 *   optimize.poll      → 取 { done, text }（降级方案）
 * client 经 HTTP SSE（/dsh-prompt-optimizer/api/optimize.stream）逐 token 呈现。
 */

import type { Lang } from './optimizer.js';

/** 自有通道的最小面（注入式，便于单测）。 */
export interface HostRpc {
  call(endpoint: string, payload?: Record<string, unknown>): Promise<{
    ok: boolean;
    value?: unknown;
    error?: { code?: string; details?: unknown };
  }>;
}

/**
 * HTTP JSON API 通道（dsh-elf 方式）：渲染进程页面由宿主 webServer 提供，相对路径 fetch
 * 直达 `/dsh-prompt-optimizer/api/<method>`，完全绕开 connection.rpc.call——
 * desktop 的 rpc.call 在同一流程第二次调用会挂死（实测 sessionModel 成功、第二次永不达）。
 */
export async function callHost<R = unknown>(
  method: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; value?: R; error?: { code?: string; details?: unknown } }> {
  const response = await fetch(`/dsh-prompt-optimizer/api/${encodeURIComponent(method)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(args),
  });
  return (await response.json()) as { ok: boolean; value?: R; error?: { code?: string; details?: unknown } };
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
  intervalMs?: number;
  timeoutMs?: number;
  rpcTimeoutMs?: number;
}

const DEFAULT_INTERVAL_MS = 100;
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
export interface StreamHostOptimizeOptions {
  rpc: HostRpc;
  text: string;
  system: string;
  signal: AbortSignal;
  onDelta(text: string): void;
  onReasoning?(text: string): void;
  onStep?(step: 'model' | 'start' | 'poll'): void;
  timeoutMs?: number;
}

/** 解析 SSE 帧：返回 { event, data }（\n\n 分帧）。 */
async function readSseFrames(
  response: Response,
  onFrame: (event: string, data: string) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('no-stream');
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (;;) {
      const idx = buffer.indexOf('\n\n');
      if (idx === -1) break;
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data = line.slice(5).trim();
      }
      onFrame(event, data);
    }
  }
}

/**
 * 宿主通道真流式：fetch SSE，逐 token onDelta。绕开 rpc.call（desktop 二次调用挂死），
 * 也绕开轮询快照（快模型仍显一次性）。abort = signal + fetch abort。
 */
export async function streamHostOptimize(opts: StreamHostOptimizeOptions): Promise<string> {
  const { rpc, text, system, signal, onDelta, onReasoning, onStep } = opts;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (signal.aborted) throw new Error('aborted');
  onStep?.('model');
  const session = await resolveHostSessionModel(rpc, opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS);
  if (!session) throw new Error('host-unavailable');
  onStep?.('start');

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let out = '';
  try {
    const response = await fetch('/dsh-prompt-optimizer/api/optimize.stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: session.provider,
        model: session.model,
        text,
        system,
        ...(session.reasoningEffort ? { reasoningEffort: session.reasoningEffort } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`http-${response.status}`);
    onStep?.('poll');
    let reasoning = '';
    await readSseFrames(response, (event, data) => {
      if (data === '{}' || data === '[DONE]') return;
      if (event === 'reasoning') {
        reasoning += data;
        onReasoning?.(reasoning);
      } else if (event === 'delta') {
        out += data;
        onDelta(out);
      }
    });
    // 服务端始终以 event:done 收尾，无显式错误帧即成功
    if (signal.aborted) throw new Error('aborted');
    return out;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', onAbort);
  }
}

export async function runHostOptimize(opts: RunHostOptimizeOptions): Promise<string> {
  const { rpc, lang: _lang, text, system, signal, onDelta, onStep } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error('aborted');

  // 1. 会话默认模型（零配置）
  onStep?.('model');
  const session = await resolveHostSessionModel(rpc, rpcTimeoutMs);
  if (!session) {
    throw new Error('host-unavailable');
  }

  // 2. 启动后台流式
  onStep?.('start');
  const startPayload: Record<string, unknown> = {
    provider: session.provider,
    model: session.model,
    text,
    system,
  };
  if (session.reasoningEffort) startPayload.reasoningEffort = session.reasoningEffort;
  const start = await callRpc<{ taskId?: string }>(rpc, 'optimize.start', startPayload, rpcTimeoutMs);
  if (!start.ok || !start.value || typeof start.value.taskId !== 'string') {
    const code = (!start.ok && start.error && start.error.code) || '';
    const details = (!start.ok && start.error && start.error.details) || '';
    throw new Error(`host-start-rejected${code ? `: ${code} ${details || ''}`.trim() : ''}`);
  }
  const taskId = start.value.taskId;

  // 3. 轮询增量直至 done（服务端显式完成信号，无 settle 兜底）
  onStep?.('poll');
  const startedAt = Date.now();
  let last = '';
  try {
    for (;;) {
      if (signal.aborted) throw new Error('aborted');
      if (Date.now() - startedAt > timeoutMs) throw new Error('timeout');
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
        if (poll.error) {
          throw new Error(poll.error);
        }
        const textNow = poll.text ?? '';
        if (textNow !== last) {
          onDelta(textNow);
          if (signal.aborted) throw new Error('aborted');
          last = textNow;
        }
        if (poll.done) {
          return textNow;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } finally {
    try {
      await rpc.call('optimize.abort', { taskId });
    } catch {
      // 尽力
    }
  }
}
