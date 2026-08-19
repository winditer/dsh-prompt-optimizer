/** 优化编排 runOptimize + 模块级在途控制 —— 状态经模块级事件总线（preview-bus）发布，
 *  不依赖会话 store/hook props（桌面渲染层对 input.right/overlay 槽位不提供这些标准 props，
 *  组件依赖它们会崩并被错误边界吞掉——PO-RIGHT-OK 探针可见而 ✨/预览卡不可见的实测定论）。 */

import {
  checkConfig,
  optimizeStream,
  resolveSessionModel,
  REQUEST_TIMEOUT_MS,
  toErrorKind,
  type Lang,
  type OptimizeErrorKind,
  type PromptConfig,
} from './optimizer.js';
import { runHostOptimize, type HostRpc } from './session-optimizer.js';
import { buildSystemPrompt } from './optimizer.js';
import { dispatchPreview } from './preview-bus.js';

/**
 * 当前 in-flight 请求的控制器（模块级）：
 * - 关闭卡片时中止它，防止迟到的 show()/fail() 复活已关闭卡片；
 * - runOptimize 以「存在在途控制器」为并发把关（同一时刻只允许一个请求在途）。
 * 注：模块级意味着多会话同时优化会互相让路——输入栏单会话聚焦的交互下可接受此简化。
 */
let activeController: AbortController | null = null;
/** 在途请求的发起会话（并发把关按会话：同会话防抖；异会话让路） */
let activeSessionId: string | null = null;

/** 关闭预览卡（并中止在途请求） */
export function closePreview(): void {
  if (activeController !== null) {
    activeController.abort();
    activeController = null;
  }
  activeSessionId = null;
  dispatchPreview({ type: 'close' });
}

/** 优化编排：宿主通道（零配置）→ 草稿空 → 直接返回；配置缺失（fetch 通道）→ guide；并发 → 丢弃；超时/取消 → timeout 或静默 */
export async function runOptimize(ctx: {
  getConfig(): PromptConfig;
  getLang(): Lang;
  getDraft(): string;
  /** 宿主模型（UI 标签）；宿主通道内部自行解析 */
  getSessionModel?(): Promise<{ provider: string; model: string } | null>;
  /** 宿主通道（useSessionModel 开启时用）：自有 RPC → server half 的 llm.stream，零配置 */
  host?: {
    rpc: HostRpc;
  };
  /** 发起优化的会话 id（绑定预览窗口，切会话不跟随） */
  getSessionId?(): string | null;
}): Promise<void> {
  const config = ctx.getConfig();
  const draft = ctx.getDraft().trim();
  if (!draft) return;

  // 并发把关：同会话在途 → 丢弃本次触发（按钮 busy 已禁用点击，这里是竞态最后防线）；
  // 切换会话后发起 → 中止旧请求让路（各会话可独立优化，宿主临时会话由 cancel 收尾）
  const sessionId = ctx.getSessionId?.() ?? null;
  if (activeController !== null) {
    if (sessionId === activeSessionId) return;
    activeController.abort();
    activeController = null;
    activeSessionId = null;
  }
  dispatchPreview({ type: 'begin', sessionId });

  const controller = new AbortController();
  activeController = controller; // 注册给 closePreview()，供卡片关闭时取消在途请求
  activeSessionId = sessionId;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    // 会话模型模式（默认）：宿主临时对话通道 —— 零配置，无需 checkConfig
    if (config.useSessionModel && ctx.host) {
      await runHostOptimize({
        rpc: ctx.host.rpc,
        lang: ctx.getLang(),
        text: draft,
        system: buildSystemPrompt(ctx.getLang()),
        signal: controller.signal,
        onDelta: (text) => dispatchPreview({ type: 'draft', text }),
        onStep: (step) => dispatchPreview({ type: 'step', step }),
      }).then(
        (finalText) => dispatchPreview({ type: 'show', result: finalText }),
        (e) => {
          const isAbort =
            (e instanceof DOMException && e.name === 'AbortError') ||
            (typeof (e as { name?: unknown } | null)?.name === 'string' &&
              (e as { name: string }).name === 'AbortError');
          if (isAbort) {
            if (timedOut) dispatchPreview({ type: 'fail', kind: 'timeout' as OptimizeErrorKind });
            return;
          }
          const kind = toErrorKind(e).kind;
          dispatchPreview({ type: 'fail', kind, detail: String((e as { message?: unknown })?.message ?? e) });
        },
      );
      return;
    }

    // fetch 通道（自定义模型/宿主不可用降级）才要求配置
    if (!checkConfig(config).ok) {
      dispatchPreview({ type: 'guide' });
      return;
    }

    // 自定义模型模式：浏览器 fetch 直连自配 API（流式）
    // 模型解析：useSessionModel（默认）→ 宿主会话模型（仅作 model 名回退使用，需配置已就绪）；否则 → 自定义 model
    let model = config.model;
    if (config.useSessionModel) {
      const sessionModel = await ctx.getSessionModel?.();
      if (sessionModel && sessionModel.model) model = sessionModel.model;
    }
    const effective = { ...config, model };

    // 展示累积：正文优先；正文尚未出现（v4 系先输出长段推理）时展示推理过程，让流式立即可见
    let reasoning = '';
    let content = '';
    let shown = '';
    try {
      const result = await optimizeStream({
        config: effective,
        text: draft,
        lang: ctx.getLang(),
        signal: controller.signal,
        onEvent: (delta) => {
          if (delta.kind === 'content') {
            content += delta.text;
            shown = content;
          } else {
            reasoning += delta.text;
            shown = reasoning;
          }
          dispatchPreview({ type: 'draft', text: shown });
        },
      });
      dispatchPreview({ type: 'show', result });
    } catch (e) {
      // 先判定中止：用户/组件取消与超时都表现为 AbortError；仅超时写入错误态
      const isAbort =
        (e instanceof DOMException && e.name === 'AbortError') ||
        (typeof (e as { name?: unknown } | null)?.name === 'string' &&
          (e as { name: string }).name === 'AbortError');
      if (isAbort) {
        if (timedOut) dispatchPreview({ type: 'fail', kind: 'timeout' as OptimizeErrorKind });
        return;
      }
      dispatchPreview({ type: 'fail', kind: toErrorKind(e).kind });
    }
  } catch (e) {
    // 顶层兜底（宿主通道 reject 已被 .then 消化；此处保护 fetch 分支以外的意外异常）
    dispatchPreview({ type: 'fail', kind: toErrorKind(e).kind });
  } finally {
    if (activeController === controller) {
      activeController = null;
      activeSessionId = null;
    }
    clearTimeout(timer);
  }
}