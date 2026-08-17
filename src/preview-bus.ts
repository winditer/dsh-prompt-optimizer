/** 预览状态模块级事件总线 —— 按钮/预览卡/runOptimize 共享，不依赖会话 store/hook */

import {
  INITIAL_PREVIEW,
  reducePreview,
  type PreviewAction,
  type PreviewState,
} from './preview-state.js';

/** 模块级单例状态（每插件实例一份：渲染进程内全局唯一） */
let state: PreviewState = { ...INITIAL_PREVIEW };
const listeners = new Set<() => void>();

/** 读当前快照（稳定引用直到下一次 dispatch） */
export function getPreviewBusState(): PreviewState {
  return state;
}

/** 派发状态机动作并通知订阅者 */
export function dispatchPreview(action: PreviewAction): void {
  state = reducePreview(state, action);
  for (const listener of listeners) listener();
}

/** 订阅变化；返回退订函数 */
export function subscribePreviewBus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}