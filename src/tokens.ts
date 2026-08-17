/** 核心令牌清单 — 4 套皮肤统一覆盖的 --dsw-alias-* 和 --dsw-specific-* 令牌名 */

/** 背景层 */
export const BG = [
  'bg-base',
  'bg-layer-1',
  'bg-layer-2',
  'bg-layer-3',
  'bg-module-platform',
  'bg-overlay',
  'bg-multi-select',
  'bg-skeleton',
  'bg-mask-1',
  'bg-mask-2',
  'bg-mask-3',
] as const;

/** 品牌/主色 */
export const BRAND = [
  'brand-primary',
  'brand-primary-invert',
  'brand-text',
  'brand-primary-new-colorprimary-new-color',
] as const;

/** 文字 */
export const LABEL = [
  'label-primary',
  'label-secondary',
  'label-tertiary',
  'label-dimmed',
  'label-caption',
  'label-primary-bluish',
  'label-primary-foreground',
  'label-primary-inverted',
] as const;

/** 边框 */
export const BORDER = [
  'border-l1',
  'border-l2',
  'border-l3',
  'border-l4',
  'border-inverted',
  'border-inverted2',
  'border-l2-darkmode-thin',
] as const;

/** 按钮 */
export const BUTTON = [
  'button-primary-fill',
  'button-primary-hover',
  'button-primary-dimmed',
  'button-info-fill',
  'button-info-hover',
  'button-elevated-fill',
  'button-floating-fill',
  'button-floating-hover',
  'button-contrast-fill',
  'button-ghost-active-border',
  'button-ghost-active-fill',
  'button-ghost-active-hover',
  'button-tool-bar-fill',
  'button-tool-bar-fill-invisible',
  'button-tool-bar-hover',
] as const;

/** 交互态 */
export const INTERACTIVE = [
  'interactive-bg-hover',
  'interactive-bg-active',
  'interactive-bg-hover-accent',
  'interactive-bg-hover-solid',
  'interactive-bg-hover-danger',
] as const;

/** 状态色 */
export const STATE = [
  'state-success-primary',
  'state-success-secondary',
  'state-success-tertiary',
  'state-warn-primary',
  'state-warn-secondary',
  'state-warn-tertiary',
  'state-warn-label',
  'state-error-primary',
  'state-error-secondary',
  'state-business-primary',
  'state-business-tertiary',
] as const;

/** Markdown / 代码块 */
export const MD = [
  'markdown-inline-code',
  'markdown-code-block',
  'markdown-code-block-banner',
  'markdown-citation',
  'markdown-tag',
  'markdown-placeholder',
  'markdown-code-segment-selected',
  'markdown-code-segment-unselected',
] as const;

/** 组件特定 */
export const SPECIFIC = [
  'specific-bubble',
  'specific-bubble-highlight',
  'specific-input-major',
  'specific-sidebar-fill',
  'specific-sidebar-nav-item-active',
  'specific-sidebar-nav-item-active-accent',
  'specific-sidebar-nav-item-hover',
  'specific-menu',
  'specific-selector',
  'specific-tip',
] as const;

/** 其他 */
export const MISC = [
  'toast-bg',
  'tooltip-bg',
  'scrollbar-bg-l1',
  'scrollbar-bg-l2',
  'scrollbar-hover-l1',
  'scrollbar-hover-l2',
] as const;

/** 全部核心令牌（去重后） */
export const ALL_TOKENS = [
  ...BG, ...BRAND, ...LABEL, ...BORDER,
  ...BUTTON, ...INTERACTIVE, ...STATE,
  ...MD, ...SPECIFIC, ...MISC,
] as readonly string[];