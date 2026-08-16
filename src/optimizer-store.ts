/** 会话预览状态 store（defineStore 薄封装）+ 优化编排 runOptimize */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
import {
  reducePreview,
  INITIAL_PREVIEW,
  type PreviewState,
} from './preview-state.js';
import {
  checkConfig,
  optimize,
  REQUEST_TIMEOUT_MS,
  toErrorKind,
  type Lang,
  type OptimizeErrorKind,
  type PromptConfig,
} from './optimizer.js';

export interface OptimizerActions {
  /** 进入 optimizing；已在优化中时返回 false（并发把关）。
   *  注意：defineStore 的动作包装器丢弃 mutator 的返回值（运行时 `actions.begin()` 实际返回 undefined），
   *  运行时并发把关由 runOptimize 内的模块级 activeController 承担（见 runOptimize）。 */
  begin(): boolean;
  show(result: string): void;
  fail(kind: OptimizeErrorKind): void;
  guide(): void;
  close(): void;
}

/** defineStore 返回的 store 句柄（同时可作类型占位，供注册时 `store:` 使用） */
export interface OptimizerStoreHandle {
  // 运行时形状由 DSH 提供；此处仅为文档性类型
}

type CreateOptimizerStore = () => OptimizerStoreHandle;

/**
 * 当前 in-flight 请求的控制器（模块级）：
 * - `close()` 中止它，防止迟到的 show()/fail() 复活已关闭卡片；
 * - runOptimize 以「存在在途控制器」为并发把关（同一时刻只允许一个请求在途）。
 * 注：模块级意味着多会话同时优化会互相让路——输入栏单会话聚焦的交互下可接受此简化。
 */
let activeController: AbortController | null = null;

export const createOptimizerStore: CreateOptimizerStore = () => {
  const handle = defineStore({
    init: () => ({ ...INITIAL_PREVIEW }), // 每会话副本：INITIAL_PREVIEW 是只读共享常量，勿跨会话共享引用
    actions: {
      begin: (d: PreviewState) => {
        const next = reducePreview(d, { type: 'begin' });
        if (next === d) return false;
        Object.assign(d, next);
        return true;
      },
      show: (d: PreviewState, result: string) => Object.assign(d, reducePreview(d, { type: 'show', result })),
      fail: (d: PreviewState, kind: OptimizeErrorKind) => Object.assign(d, reducePreview(d, { type: 'fail', kind })),
      guide: (d: PreviewState) => Object.assign(d, reducePreview(d, { type: 'guide' })),
      close: (d: PreviewState) => {
        // 卡片被关闭/放弃：若请求在途则取消，迟到的 show()/fail() 不得复活已关闭卡片
        activeController?.abort();
        activeController = null;
        return Object.assign(d, reducePreview(d, { type: 'close' }));
      },
    },
  });
  return handle as OptimizerStoreHandle;
};

/** 优化编排：配置缺失 → guide；草稿空 → 直接返回；并发 → 丢弃；超时/取消 → timeout 或静默 */
export async function runOptimize(
  actions: OptimizerActions,
  ctx: { getConfig(): PromptConfig; getLang(): Lang; getDraft(): string },
): Promise<void> {
  const config = ctx.getConfig();
  if (!checkConfig(config).ok) {
    actions.guide();
    return;
  }
  const draft = ctx.getDraft().trim();
  if (!draft) return;

  // 并发把关：已有在途请求则丢弃本次触发。
  // 不能依赖 actions.begin() 的返回值——defineStore 动作包装器丢弃 mutator 返回值（恒为 undefined）；
  // 组件层的按钮 busy 态已禁用点击，这里是对快捷键/竞态触发的最后防线。
  if (activeController !== null) return;
  actions.begin();

  const controller = new AbortController();
  activeController = controller; // 注册给 close()，供卡片关闭时取消在途请求
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const result = await optimize({ config, text: draft, lang: ctx.getLang(), signal: controller.signal });
    actions.show(result);
  } catch (e) {
    // 先判定中止：用户/组件取消与超时都表现为 AbortError；仅超时写入错误态
    const isAbort =
      (e instanceof DOMException && e.name === 'AbortError') ||
      (typeof (e as { name?: unknown } | null)?.name === 'string' &&
        (e as { name: string }).name === 'AbortError');
    if (isAbort) {
      if (timedOut) actions.fail('timeout');
      return;
    }
    actions.fail(toErrorKind(e).kind);
  } finally {
    if (activeController === controller) activeController = null;
    clearTimeout(timer);
  }
}