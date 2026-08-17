/** 4 套皮肤定义 — 每条覆盖 ~50 个 --dsw-alias-* 语义令牌 */

import type { ThemeDefinition } from './types.js';

type TokenMap = Record<string, string>;

/** 拼接完整 CSS 变量名（alias 层） */
const a = (name: string) => `--dsw-alias-${name}`;
/** 拼接完整 CSS 变量名（specific 层） */
const s = (name: string) => `--dsw-specific-${name}`;

// ── 工具：按类别构建令牌映射 ─────────────────────────────

interface TokenBuilder {
  set: (name: string, value: string) => this;
  done: () => TokenMap;
}

function tokens(): TokenBuilder {
  const map: TokenMap = {};
  return {
    set(name: string, value: string) { map[a(name)] = value; return this; },
    done() { return map; },
  };
}

// ── ① 护眼绿 · 浅 (colorScheme: light) ─────────────────

const forestLightTokens = tokens()
  // 背景
  .set('bg-base', 'rgb(246,248,243)')
  .set('bg-layer-1', 'rgb(249,250,246)')
  .set('bg-layer-2', 'rgb(243,245,238)')
  .set('bg-layer-3', 'rgb(240,243,236)')
  .set('bg-module-platform', 'rgb(245,247,241)')
  .set('bg-overlay', 'rgb(237,241,233)')
  .set('bg-multi-select', 'rgb(245,247,241)')
  .set('bg-skeleton', 'rgba(52,133,96,0.06)')
  .set('bg-mask-1', 'rgba(30,60,40,0.24)')
  .set('bg-mask-2', 'rgba(30,60,40,0.12)')
  .set('bg-mask-3', 'rgba(30,60,40,0.48)')
  // 品牌
  .set('brand-primary', 'rgb(52,133,96)')
  .set('brand-primary-invert', 'rgb(246,248,243)')
  .set('brand-text', 'rgb(52,133,96)')
  .set('brand-primary-new-colorprimary-new-color', 'rgb(52,133,96)')
  // 文字
  .set('label-primary', 'rgb(45,55,48)')
  .set('label-secondary', 'rgb(96,110,100)')
  .set('label-tertiary', 'rgb(130,142,132)')
  .set('label-dimmed', 'rgb(160,170,160)')
  .set('label-caption', 'rgb(180,190,178)')
  .set('label-primary-bluish', 'rgb(40,75,80)')
  .set('label-primary-foreground', 'rgb(255,255,255)')
  .set('label-primary-inverted', 'rgb(255,255,255)')
  // 边框
  .set('border-l1', 'rgba(52,80,60,0.06)')
  .set('border-l2', 'rgba(52,80,60,0.10)')
  .set('border-l3', 'rgba(52,80,60,0.14)')
  .set('border-l4', 'rgba(52,80,60,0.18)')
  .set('border-inverted', 'rgba(255,255,255,0.06)')
  .set('border-inverted2', 'rgba(255,255,255,0.08)')
  .set('border-l2-darkmode-thin', 'rgba(52,80,60,0.10)')
  // 按钮
  .set('button-primary-fill', 'rgb(52,133,96)')
  .set('button-primary-hover', 'rgb(60,150,108)')
  .set('button-primary-dimmed', 'rgb(232,240,230)')
  .set('button-info-fill', 'rgb(52,133,96)')
  .set('button-info-hover', 'rgb(60,150,108)')
  .set('button-elevated-fill', 'rgb(255,255,255)')
  .set('button-floating-fill', 'rgb(255,255,255)')
  .set('button-floating-hover', 'rgb(249,250,246)')
  .set('button-contrast-fill', 'rgb(45,55,48)')
  .set('button-ghost-active-border', 'rgb(52,133,96)')
  .set('button-ghost-active-fill', 'rgb(240,244,238)')
  .set('button-ghost-active-hover', 'rgb(235,240,232)')
  .set('button-tool-bar-fill', 'rgba(84,85,87,0.5)')
  .set('button-tool-bar-fill-invisible', 'rgba(31,31,31,0.36)')
  .set('button-tool-bar-hover', 'rgba(84,85,87,0.6)')
  // 交互态
  .set('interactive-bg-hover', 'rgba(52,80,60,0.06)')
  .set('interactive-bg-active', 'rgba(52,80,60,0.10)')
  .set('interactive-bg-hover-accent', 'rgba(52,80,60,0.14)')
  .set('interactive-bg-hover-solid', 'rgb(249,250,246)')
  .set('interactive-bg-hover-danger', 'rgba(236,19,19,0.05)')
  // 状态色 — 保持官方默认（成功/警告/错误语义色不变）
  .set('state-success-primary', 'rgb(34,197,94)')
  .set('state-success-secondary', 'rgb(78,209,126)')
  .set('state-success-tertiary', 'rgb(230,250,237)')
  .set('state-warn-primary', 'rgb(245,158,11)')
  .set('state-warn-secondary', 'rgb(247,173,49)')
  .set('state-warn-tertiary', 'rgb(254,245,231)')
  .set('state-warn-label', 'rgb(221,134,41)')
  .set('state-error-primary', 'rgb(236,19,19)')
  .set('state-error-secondary', 'rgb(242,90,90)')
  .set('state-business-primary', 'rgb(52,133,96)')
  .set('state-business-tertiary', 'rgb(232,240,230)')
  // Markdown
  .set('markdown-inline-code', 'rgb(240,244,238)')
  .set('markdown-code-block', 'rgb(240,244,238)')
  .set('markdown-code-block-banner', 'rgb(245,247,241)')
  .set('markdown-citation', 'rgb(243,245,238)')
  .set('markdown-tag', 'rgb(245,247,241)')
  .set('markdown-placeholder', 'rgb(249,250,246)')
  .set('markdown-code-segment-selected', 'rgb(255,255,255)')
  .set('markdown-code-segment-unselected', 'rgb(249,250,246)')
  // 组件特定（specific）
  .set('toast-bg', 'rgb(45,55,48)')
  .set('tooltip-bg', 'rgb(45,55,48)')
  .set('scrollbar-bg-l1', 'rgb(212,218,208)')
  .set('scrollbar-bg-l2', 'rgb(212,218,208)')
  .set('scrollbar-hover-l1', 'rgb(196,204,190)')
  .set('scrollbar-hover-l2', 'rgb(196,204,190)')
  .done();

// ── ② 护眼绿 · 深 (colorScheme: dark) ──────────────────

const forestDarkTokens = tokens()
  .set('bg-base', 'rgb(22,28,24)')
  .set('bg-layer-1', 'rgb(28,35,30)')
  .set('bg-layer-2', 'rgb(33,41,35)')
  .set('bg-layer-3', 'rgb(38,47,40)')
  .set('bg-module-platform', 'rgb(33,41,35)')
  .set('bg-overlay', 'rgb(44,55,47)')
  .set('bg-multi-select', 'rgb(38,47,40)')
  .set('bg-skeleton', 'rgba(255,255,255,0.06)')
  .set('bg-mask-1', 'rgba(0,0,0,0.5)')
  .set('bg-mask-2', 'rgba(0,0,0,0.2)')
  .set('bg-mask-3', 'rgba(0,0,0,0.48)')
  .set('brand-primary', 'rgb(94,185,142)')
  .set('brand-primary-invert', 'rgb(22,28,24)')
  .set('brand-text', 'rgb(94,185,142)')
  .set('brand-primary-new-colorprimary-new-color', 'rgb(94,185,142)')
  .set('label-primary', 'rgb(225,233,226)')
  .set('label-secondary', 'rgb(168,182,172)')
  .set('label-tertiary', 'rgb(120,134,124)')
  .set('label-dimmed', 'rgb(90,106,94)')
  .set('label-caption', 'rgb(70,86,74)')
  .set('label-primary-bluish', 'rgb(200,215,200)')
  .set('label-primary-foreground', 'rgb(15,22,17)')
  .set('label-primary-inverted', 'rgb(200,215,200)')
  .set('border-l1', 'rgba(160,200,170,0.06)')
  .set('border-l2', 'rgba(160,200,170,0.12)')
  .set('border-l3', 'rgba(160,200,170,0.16)')
  .set('border-l4', 'rgba(160,200,170,0.20)')
  .set('border-inverted', 'rgba(255,255,255,0.06)')
  .set('border-inverted2', 'rgba(255,255,255,0.08)')
  .set('border-l2-darkmode-thin', 'rgba(160,200,170,0.06)')
  .set('button-primary-fill', 'rgb(94,185,142)')
  .set('button-primary-hover', 'rgb(110,200,158)')
  .set('button-primary-dimmed', 'rgb(33,55,40)')
  .set('button-info-fill', 'rgb(94,185,142)')
  .set('button-info-hover', 'rgb(110,200,158)')
  .set('button-elevated-fill', 'rgb(33,41,35)')
  .set('button-floating-fill', 'rgb(28,35,30)')
  .set('button-floating-hover', 'rgb(33,41,35)')
  .set('button-contrast-fill', 'rgb(225,233,226)')
  .set('button-ghost-active-border', 'rgb(94,185,142)')
  .set('button-ghost-active-fill', 'rgb(33,41,35)')
  .set('button-ghost-active-hover', 'rgb(38,47,40)')
  .set('button-tool-bar-fill', 'rgba(84,85,87,0.5)')
  .set('button-tool-bar-fill-invisible', 'rgba(31,31,31,0.36)')
  .set('button-tool-bar-hover', 'rgba(84,85,87,0.6)')
  .set('interactive-bg-hover', 'rgba(160,200,170,0.08)')
  .set('interactive-bg-active', 'rgba(160,200,170,0.14)')
  .set('interactive-bg-hover-accent', 'rgba(160,200,170,0.24)')
  .set('interactive-bg-hover-solid', 'rgb(33,41,35)')
  .set('interactive-bg-hover-danger', 'rgba(242,90,90,0.15)')
  .set('state-success-primary', 'rgb(34,197,94)')
  .set('state-success-secondary', 'rgb(78,209,126)')
  .set('state-success-tertiary', 'rgb(35,60,44)')
  .set('state-warn-primary', 'rgb(245,158,11)')
  .set('state-warn-secondary', 'rgb(247,173,49)')
  .set('state-warn-tertiary', 'rgb(39,36,31)')
  .set('state-warn-label', 'rgb(221,134,41)')
  .set('state-error-primary', 'rgb(242,90,90)')
  .set('state-error-secondary', 'rgb(242,90,90)')
  .set('state-business-primary', 'rgb(94,185,142)')
  .set('state-business-tertiary', 'rgb(33,55,40)')
  .set('markdown-inline-code', 'rgb(26,34,28)')
  .set('markdown-code-block', 'rgb(26,34,28)')
  .set('markdown-code-block-banner', 'rgb(28,35,30)')
  .set('markdown-citation', 'rgb(28,35,30)')
  .set('markdown-tag', 'rgb(28,35,30)')
  .set('markdown-placeholder', 'rgb(28,35,30)')
  .set('markdown-code-segment-selected', 'rgb(33,41,35)')
  .set('markdown-code-segment-unselected', 'rgb(26,34,28)')
  .set('toast-bg', 'rgb(33,41,35)')
  .set('tooltip-bg', 'rgb(33,41,35)')
  .set('scrollbar-bg-l1', 'rgb(50,60,52)')
  .set('scrollbar-bg-l2', 'rgb(50,60,52)')
  .set('scrollbar-hover-l1', 'rgb(60,72,64)')
  .set('scrollbar-hover-l2', 'rgb(60,72,64)')
  .done();

// ── ③ 暖阳 · 浅 (colorScheme: light) ───────────────────

const amberTokens = tokens()
  .set('bg-base', 'rgb(252,249,242)')
  .set('bg-layer-1', 'rgb(255,252,246)')
  .set('bg-layer-2', 'rgb(249,245,236)')
  .set('bg-layer-3', 'rgb(246,240,229)')
  .set('bg-module-platform', 'rgb(250,247,238)')
  .set('bg-overlay', 'rgb(243,236,222)')
  .set('bg-multi-select', 'rgb(250,247,238)')
  .set('bg-skeleton', 'rgba(191,120,42,0.06)')
  .set('bg-mask-1', 'rgba(40,30,15,0.24)')
  .set('bg-mask-2', 'rgba(40,30,15,0.12)')
  .set('bg-mask-3', 'rgba(40,30,15,0.48)')
  .set('brand-primary', 'rgb(191,120,42)')
  .set('brand-primary-invert', 'rgb(252,249,242)')
  .set('brand-text', 'rgb(191,120,42)')
  .set('brand-primary-new-colorprimary-new-color', 'rgb(191,120,42)')
  .set('label-primary', 'rgb(62,52,40)')
  .set('label-secondary', 'rgb(122,106,86)')
  .set('label-tertiary', 'rgb(160,146,126)')
  .set('label-dimmed', 'rgb(186,174,156)')
  .set('label-caption', 'rgb(206,196,178)')
  .set('label-primary-bluish', 'rgb(80,72,58)')
  .set('label-primary-foreground', 'rgb(255,255,255)')
  .set('label-primary-inverted', 'rgb(255,255,255)')
  .set('border-l1', 'rgba(120,90,50,0.06)')
  .set('border-l2', 'rgba(120,90,50,0.10)')
  .set('border-l3', 'rgba(120,90,50,0.14)')
  .set('border-l4', 'rgba(120,90,50,0.18)')
  .set('border-inverted', 'rgba(255,255,255,0.06)')
  .set('border-inverted2', 'rgba(255,255,255,0.08)')
  .set('border-l2-darkmode-thin', 'rgba(120,90,50,0.10)')
  .set('button-primary-fill', 'rgb(191,120,42)')
  .set('button-primary-hover', 'rgb(205,134,52)')
  .set('button-primary-dimmed', 'rgb(246,240,230)')
  .set('button-info-fill', 'rgb(191,120,42)')
  .set('button-info-hover', 'rgb(205,134,52)')
  .set('button-elevated-fill', 'rgb(255,255,255)')
  .set('button-floating-fill', 'rgb(255,255,255)')
  .set('button-floating-hover', 'rgb(255,252,246)')
  .set('button-contrast-fill', 'rgb(62,52,40)')
  .set('button-ghost-active-border', 'rgb(191,120,42)')
  .set('button-ghost-active-fill', 'rgb(246,240,230)')
  .set('button-ghost-active-hover', 'rgb(240,234,220)')
  .set('button-tool-bar-fill', 'rgba(84,85,87,0.5)')
  .set('button-tool-bar-fill-invisible', 'rgba(31,31,31,0.36)')
  .set('button-tool-bar-hover', 'rgba(84,85,87,0.6)')
  .set('interactive-bg-hover', 'rgba(120,90,50,0.06)')
  .set('interactive-bg-active', 'rgba(120,90,50,0.10)')
  .set('interactive-bg-hover-accent', 'rgba(120,90,50,0.14)')
  .set('interactive-bg-hover-solid', 'rgb(255,252,246)')
  .set('interactive-bg-hover-danger', 'rgba(236,19,19,0.05)')
  .set('state-success-primary', 'rgb(34,197,94)')
  .set('state-success-secondary', 'rgb(78,209,126)')
  .set('state-success-tertiary', 'rgb(230,250,237)')
  .set('state-warn-primary', 'rgb(245,158,11)')
  .set('state-warn-secondary', 'rgb(247,173,49)')
  .set('state-warn-tertiary', 'rgb(254,245,231)')
  .set('state-warn-label', 'rgb(221,134,41)')
  .set('state-error-primary', 'rgb(236,19,19)')
  .set('state-error-secondary', 'rgb(242,90,90)')
  .set('state-business-primary', 'rgb(191,120,42)')
  .set('state-business-tertiary', 'rgb(246,240,230)')
  .set('markdown-inline-code', 'rgb(246,240,230)')
  .set('markdown-code-block', 'rgb(246,240,230)')
  .set('markdown-code-block-banner', 'rgb(250,247,238)')
  .set('markdown-citation', 'rgb(249,245,236)')
  .set('markdown-tag', 'rgb(250,247,238)')
  .set('markdown-placeholder', 'rgb(255,252,246)')
  .set('markdown-code-segment-selected', 'rgb(255,255,255)')
  .set('markdown-code-segment-unselected', 'rgb(255,252,246)')
  .set('toast-bg', 'rgb(62,52,40)')
  .set('tooltip-bg', 'rgb(62,52,40)')
  .set('scrollbar-bg-l1', 'rgb(220,214,202)')
  .set('scrollbar-bg-l2', 'rgb(220,214,202)')
  .set('scrollbar-hover-l1', 'rgb(206,198,184)')
  .set('scrollbar-hover-l2', 'rgb(206,198,184)')
  .done();

// ── ④ 赛博紫 · 深 (colorScheme: dark) ──────────────────

const cyberTokens = tokens()
  .set('bg-base', 'rgb(17,15,26)')
  .set('bg-layer-1', 'rgb(24,21,36)')
  .set('bg-layer-2', 'rgb(31,27,46)')
  .set('bg-layer-3', 'rgb(38,33,56)')
  .set('bg-module-platform', 'rgb(31,27,46)')
  .set('bg-overlay', 'rgb(48,42,68)')
  .set('bg-multi-select', 'rgb(38,33,56)')
  .set('bg-skeleton', 'rgba(255,255,255,0.06)')
  .set('bg-mask-1', 'rgba(0,0,0,0.5)')
  .set('bg-mask-2', 'rgba(0,0,0,0.2)')
  .set('bg-mask-3', 'rgba(0,0,0,0.48)')
  .set('brand-primary', 'rgb(167,90,255)')
  .set('brand-primary-invert', 'rgb(17,15,26)')
  .set('brand-text', 'rgb(167,90,255)')
  .set('brand-primary-new-colorprimary-new-color', 'rgb(167,90,255)')
  .set('label-primary', 'rgb(230,225,242)')
  .set('label-secondary', 'rgb(178,170,198)')
  .set('label-tertiary', 'rgb(128,120,148)')
  .set('label-dimmed', 'rgb(98,90,118)')
  .set('label-caption', 'rgb(78,70,98)')
  .set('label-primary-bluish', 'rgb(196,190,210)')
  .set('label-primary-foreground', 'rgb(20,14,30)')
  .set('label-primary-inverted', 'rgb(196,190,210)')
  .set('border-l1', 'rgba(180,140,255,0.06)')
  .set('border-l2', 'rgba(180,140,255,0.12)')
  .set('border-l3', 'rgba(180,140,255,0.16)')
  .set('border-l4', 'rgba(180,140,255,0.20)')
  .set('border-inverted', 'rgba(255,255,255,0.06)')
  .set('border-inverted2', 'rgba(255,255,255,0.08)')
  .set('border-l2-darkmode-thin', 'rgba(180,140,255,0.06)')
  .set('button-primary-fill', 'rgb(167,90,255)')
  .set('button-primary-hover', 'rgb(180,112,255)')
  .set('button-primary-dimmed', 'rgb(38,30,60)')
  .set('button-info-fill', 'rgb(167,90,255)')
  .set('button-info-hover', 'rgb(180,112,255)')
  .set('button-elevated-fill', 'rgb(31,27,46)')
  .set('button-floating-fill', 'rgb(24,21,36)')
  .set('button-floating-hover', 'rgb(31,27,46)')
  .set('button-contrast-fill', 'rgb(230,225,242)')
  .set('button-ghost-active-border', 'rgb(167,90,255)')
  .set('button-ghost-active-fill', 'rgb(31,27,46)')
  .set('button-ghost-active-hover', 'rgb(38,33,56)')
  .set('button-tool-bar-fill', 'rgba(84,85,87,0.5)')
  .set('button-tool-bar-fill-invisible', 'rgba(31,31,31,0.36)')
  .set('button-tool-bar-hover', 'rgba(84,85,87,0.6)')
  .set('interactive-bg-hover', 'rgba(180,140,255,0.08)')
  .set('interactive-bg-active', 'rgba(180,140,255,0.14)')
  .set('interactive-bg-hover-accent', 'rgba(180,140,255,0.24)')
  .set('interactive-bg-hover-solid', 'rgb(31,27,46)')
  .set('interactive-bg-hover-danger', 'rgba(242,90,90,0.15)')
  .set('state-success-primary', 'rgb(34,197,94)')
  .set('state-success-secondary', 'rgb(78,209,126)')
  .set('state-success-tertiary', 'rgb(35,60,44)')
  .set('state-warn-primary', 'rgb(245,158,11)')
  .set('state-warn-secondary', 'rgb(247,173,49)')
  .set('state-warn-tertiary', 'rgb(39,36,31)')
  .set('state-warn-label', 'rgb(221,134,41)')
  .set('state-error-primary', 'rgb(242,90,90)')
  .set('state-error-secondary', 'rgb(242,90,90)')
  .set('state-business-primary', 'rgb(167,90,255)')
  .set('state-business-tertiary', 'rgb(48,42,68)')
  .set('markdown-inline-code', 'rgb(24,20,34)')
  .set('markdown-code-block', 'rgb(24,20,34)')
  .set('markdown-code-block-banner', 'rgb(28,24,42)')
  .set('markdown-citation', 'rgb(28,24,42)')
  .set('markdown-tag', 'rgb(28,24,42)')
  .set('markdown-placeholder', 'rgb(28,24,42)')
  .set('markdown-code-segment-selected', 'rgb(31,27,46)')
  .set('markdown-code-segment-unselected', 'rgb(24,20,34)')
  .set('toast-bg', 'rgb(38,33,56)')
  .set('tooltip-bg', 'rgb(38,33,56)')
  .set('scrollbar-bg-l1', 'rgb(48,42,64)')
  .set('scrollbar-bg-l2', 'rgb(48,42,64)')
  .set('scrollbar-hover-l1', 'rgb(58,52,76)')
  .set('scrollbar-hover-l2', 'rgb(58,52,76)')
  .done();

// ── 导出主题定义 ───────────────────────────────────────

export const SKIN_THEMES: ThemeDefinition[] = [
  {
    id: 'skin-forest-light',
    colorScheme: 'light',
    tokens: forestLightTokens,
  },
  {
    id: 'skin-forest-dark',
    colorScheme: 'dark',
    tokens: forestDarkTokens,
  },
  {
    id: 'skin-amber',
    colorScheme: 'light',
    tokens: amberTokens,
  },
  {
    id: 'skin-cyber',
    colorScheme: 'dark',
    tokens: cyberTokens,
  },
];

export const SKIN_IDS = SKIN_THEMES.map(t => t.id);
export const FOLLOW_SYSTEM = 'system';
export type SkinId = typeof SKIN_IDS[number] | typeof FOLLOW_SYSTEM;