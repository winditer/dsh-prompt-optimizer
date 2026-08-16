/** 设置镜像刷新分类 —— 纯函数：区分「自身写入回显收敛 / 回显进行中 / 外部变化」 */
import type { PromptConfig } from './optimizer.js';

export type RefreshKind = 'converged' | 'in-progress' | 'external';

/** 收敛判定：当前快照与「自身写入目标」全字段相等 → 本轮回显完毕；pending 为 null → 外部/引导变化 */
export function classifyRefresh(cur: PromptConfig, pending: PromptConfig | null): RefreshKind {
  if (pending === null) return 'external';
  const converged =
    cur.baseUrl === pending.baseUrl &&
    cur.apiKey === pending.apiKey &&
    cur.model === pending.model;
  return converged ? 'converged' : 'in-progress';
}