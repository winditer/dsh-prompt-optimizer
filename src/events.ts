/** 插件内部事件总线（模块级；避免 index ↔ 组件循环依赖）：
 *  - optimizeRequest：快捷键 Alt+O → 优化按钮触发
 *  - openSettingsRequest：预览卡「去设置」→ 设置行自动展开 */

const optimizeRequestListeners = new Set<() => void>();

export function onOptimizeRequest(fn: () => void): () => void {
  optimizeRequestListeners.add(fn);
  return () => optimizeRequestListeners.delete(fn);
}

export function emitOptimizeRequest(): void {
  for (const fn of optimizeRequestListeners) fn();
}

const openSettingsListeners = new Set<() => void>();

export function onOpenSettingsRequest(fn: () => void): () => void {
  openSettingsListeners.add(fn);
  return () => openSettingsListeners.delete(fn);
}

export function emitOpenSettingsRequest(): void {
  for (const fn of openSettingsListeners) fn();
}
