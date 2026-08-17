/** 优化编排 runOptimize + 模块级在途控制 —— 状态经模块级事件总线（preview-bus）发布，
 *  不依赖会话 store/hook props（桌面渲染层对 input.right/overlay 槽位不提供这些标准 props，
 *  组件依赖它们会崩并被错误边界吞掉——PO-RIGHT-OK 探针可见而 ✨/预览卡不可见的实测定论）。 */

import {
  checkConfig,
  optimizeStream,
  REQUEST_TIMEOUT_MS,
  toErrorKind,
  type Lang,
  type OptimizeErrorKind,
  type PromptConfig,
} from './optimizer.js';
import { dispatchPreview } from './preview-bus.js';

/**
 * 当前 in-flight 请求的控制器（模块级）：
 * - 关闭卡片时中止它，防止迟到的 show()/fail() 复活已关闭卡片；
 * - runOptimize 以「存在在途控制器」为并发把关（同一时刻只允许一个请求在途）。
 * 注：模块级意味着多会话同时优化会互相让路——输入栏单会话聚焦的交互下可接受此简化。
 */
let activeController: AbortController | null = null;

/** 关闭预览卡（并中止在途请求） */
export function closePreview(): void {
  if (activeController !== null) {
    activeController.abort();
    activeController = null;
  }
  dispatchPreview({ type: 'close' });
}

/** 优化编排：配置缺失 → guide；草稿空 → 直接返回；并发 → 丢弃；超时/取消 → timeout 或静默 */
export async function runOptimize(ctx: {
  getConfig(): PromptConfig;
  getLang(): Lang;
  getDraft(): string;
}): Promise<void> {
  const config = ctx.getConfig();
  if (!checkConfig(config).ok) {
    dispatchPreview({ type: 'guide' });
    return;
  }
  const draft = ctx.getDraft().trim();
  if (!draft) return;

  // 并发把关：已有在途请求则丢弃本次触发（按钮 busy 态已禁用点击，这里是竞态的最后防线）
  if (activeController !== null) return;
  dispatchPreview({ type: 'begin' });

  const controller = new AbortController();
  activeController = controller; // 注册给 closePreview()，供卡片关闭时取消在途请求
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  // 展示累积：正文优先；正文尚未出现（v4 系先输出长段推理）时展示推理过程，让流式立即可见
  let reasoning = '';
  let content = '';
  let shown = '';
  try {
    const result = await optimizeStream({
      config,
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
  } finally {
    if (activeController === controller) activeController = null;
    clearTimeout(timer);
  }
}