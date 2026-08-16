/** 预览卡片状态机 —— 纯 reducer，无 DSH 依赖 */

import type { OptimizeErrorKind } from './optimizer.js';

export type PreviewStatus = 'idle' | 'optimizing' | 'preview' | 'error' | 'guide';

export interface PreviewState {
  status: PreviewStatus;
  result: string;
  errorKind: OptimizeErrorKind | null;
  generation: number;
}

/** 只读共享常量：reducer 永不写回它或返回可变的新对象；消费者（Task 4 store 胶水）必须以 { ...INITIAL_PREVIEW } 为每会话种子 */
export const INITIAL_PREVIEW: PreviewState = {
  status: 'idle',
  result: '',
  errorKind: null,
  generation: 0,
};

export type PreviewAction =
  | { type: 'begin' }
  | { type: 'show'; result: string }
  | { type: 'fail'; kind: OptimizeErrorKind }
  | { type: 'guide' }
  | { type: 'close' };

export function reducePreview(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'begin':
      if (state.status === 'optimizing') return state;
      return { ...state, status: 'optimizing', errorKind: null, generation: state.generation + 1 };
    case 'show':
      return state.status === 'optimizing'
        ? { ...state, status: 'preview', result: action.result }
        : state;
    case 'fail':
      return state.status === 'optimizing'
        ? { ...state, status: 'error', errorKind: action.kind }
        : state;
    case 'guide':
      return state.status === 'optimizing' ? state : { ...state, status: 'guide' };
    case 'close':
      return INITIAL_PREVIEW;
    default:
      return state;
  }
}

/** 是否允许发起新一轮优化：不在 optimizing 态即可（按钮/重试的并发把关） */
export function canOptimizeFrom(status: PreviewStatus): boolean {
  return status !== 'optimizing';
}
