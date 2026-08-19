/** 预览卡片状态机 —— 纯 reducer，无 DSH 依赖 */

import type { OptimizeErrorKind } from './optimizer.js';

export type PreviewStatus = 'idle' | 'optimizing' | 'preview' | 'error' | 'guide';

export interface PreviewState {
  status: PreviewStatus;
  result: string;
  errorKind: OptimizeErrorKind | null;
  /** 原始错误细节（宿主通道失败等原因，卡片显示出来便于诊断） */
  errorDetail: string | null;
  generation: number;
  /** 流式优化中的增量文本（optimizing 态实时更新；非流式全程为空串） */
  draft: string;
  /** 流式优化中的推理过程文本（模型先产 reasoning 再产答案；随 SSE 实时滚动） */
  reasoning: string;
  /** 发起优化的会话 id（null = 未绑定/全局）：预览窗口只属于该会话，切走不跟随 */
  sessionId: string | null;
  /** 宿主通道当前步骤（'model' | 'start' | 'poll' | null）：卡片显示进度，定位卡点 */
  step: 'model' | 'start' | 'poll' | null;
}

/** 只读共享常量：reducer 永不写回它或返回可变的新对象；消费者（Task 4 store 胶水）必须以 { ...INITIAL_PREVIEW } 为每会话种子 */
export const INITIAL_PREVIEW: PreviewState = {
  status: 'idle',
  result: '',
  errorKind: null,
  errorDetail: null,
  generation: 0,
  draft: '',
  reasoning: '',
  sessionId: null,
  step: null,
};

export type PreviewAction =
  | { type: 'begin'; sessionId?: string | null }
  | { type: 'show'; result: string }
  | { type: 'fail'; kind: OptimizeErrorKind; detail?: string }
  | { type: 'guide' }
  | { type: 'close' }
  | { type: 'draft'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'step'; step: 'model' | 'start' | 'poll' | null };

export function reducePreview(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'begin':
      if (state.status === 'optimizing') return state;
      return {
        ...state,
        status: 'optimizing',
        errorKind: null,
        errorDetail: null,
        draft: '',
        sessionId: action.sessionId ?? null,
        step: 'model',
        generation: state.generation + 1,
      };
    case 'show':
      return state.status === 'optimizing'
        ? { ...state, status: 'preview', result: action.result, draft: '' }
        : state;
    case 'fail':
      return state.status === 'optimizing'
        ? { ...state, status: 'error', errorKind: action.kind, errorDetail: action.detail ?? null }
        : state;
    case 'guide':
      return state.status === 'optimizing' ? state : { ...state, status: 'guide' };
    case 'close':
      return INITIAL_PREVIEW;
    case 'draft':
      return state.status === 'optimizing' ? { ...state, draft: action.text } : state;
    case 'reasoning':
      return state.status === 'optimizing' ? { ...state, reasoning: action.text } : state;
    case 'step':
      return state.status === 'optimizing' ? { ...state, step: action.step } : state;
    default:
      return state;
  }
}

/** 计划规定的公开 API（Task 4 起存在；canTrigger 的 !busy 半边承担并发把关职责，其余保留以备后续消费者） */
export function canOptimizeFrom(status: PreviewStatus): boolean {
  return status !== 'optimizing';
}
