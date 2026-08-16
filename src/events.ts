/** 插件内部事件总线（模块级；避免 index ↔ 组件循环依赖）：快捷键 → 按钮 */

const optimizeRequestListeners = new Set<() => void>();

export function onOptimizeRequest(fn: () => void): () => void {
  optimizeRequestListeners.add(fn);
  return () => optimizeRequestListeners.delete(fn);
}

export function emitOptimizeRequest(): void {
  for (const fn of optimizeRequestListeners) fn();
}