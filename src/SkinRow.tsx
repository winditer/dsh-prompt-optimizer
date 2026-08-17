/** 皮肤选择行 React 组件 — 与官方外观行同款 cube 布局 */

import React from 'react';
import { IconFollowsystemOutline16 } from '@deepseek-ai/dsh-client-ui-primitives';
import type { SkinRowState } from './skin-store.js';
import type { SkinId } from './themes.js';

/** 注入的写接口 */
export interface SkinRowInjected {
  setSkin: (id: SkinId) => void;
}

/** 组件 props */
export interface SkinRowProps {
  t: (key: string) => string;
  useStore: <T>(selector: (s: SkinRowState) => T) => T;
  setSkin: (id: SkinId) => void;
}

/** 每个 skin 选项的数据 */
interface SkinCube {
  id: SkinId;
  labelKey: string;
  /** 指示色（CSS 颜色值，用于 cube 上方色点） */
  indicator: string;
}

/** 皮肤选项列表 */
const CUBES: SkinCube[] = [
  { id: 'system', labelKey: 'skin.system', indicator: 'transparent' },
  { id: 'skin-forest-light', labelKey: 'skin.forest-light', indicator: 'rgb(52,133,96)' },
  { id: 'skin-forest-dark', labelKey: 'skin.forest-dark', indicator: 'rgb(94,185,142)' },
  { id: 'skin-amber', labelKey: 'skin.amber', indicator: 'rgb(191,120,42)' },
  { id: 'skin-cyber', labelKey: 'skin.cyber', indicator: 'rgb(167,90,255)' },
];

/** 注入 CSS 样式（仅一次） */
const CSS_ID = 'dsh-skin-pack/skin-row.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const css = `
._skinGroup {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
  display: flex;
}
._skinTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
}
._skinCubeRow {
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  display: flex;
}
._skinCube {
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l2);
  font: inherit;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  background: 0 0;
  border-radius: 16px;
  flex-direction: column;
  flex: 1 1 120px;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  font-size: 13px;
  line-height: 20px;
  display: flex;
  min-width: 80px;
}
._skinCube:hover:not(._skinSelected) {
  background: var(--dsw-alias-interactive-bg-hover);
}
._skinSelected {
  background: var(--dsw-alias-bg-module-platform);
  border-color: var(--dsw-static-neutral-bluish-400);
}
._skinIndicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}
._skinLabel {
  text-align: center;
  word-break: keep-all;
}
`;
  const tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-skin-pack';
  tag.dataset.pluginCss = CSS_ID;
  tag.textContent = css;
  document.head.appendChild(tag);
}

/** 皮肤选择行组件 */
export function SkinRow({ t, useStore, setSkin }: SkinRowProps) {
  injectCss();
  const skin = useStore((s: SkinRowState) => s.skin);

  return React.createElement('div', { className: '_skinGroup' },
    React.createElement('div', { className: '_skinTitle' }, t('skin.title')),
    React.createElement('div', { className: '_skinCubeRow' },
      CUBES.map(({ id, labelKey, indicator }) => {
        const selected = skin === id;
        return React.createElement(
          'button',
          {
            key: id,
            type: 'button',
            className: '_skinCube' + (selected ? ' _skinSelected' : ''),
            'aria-pressed': selected,
            onClick: () => setSkin(id),
          },
          indicator === 'transparent'
            ? React.createElement(IconFollowsystemOutline16, { size: 20 })
            : React.createElement('span', {
                className: '_skinIndicator',
                style: { backgroundColor: indicator },
              }),
          React.createElement('span', { className: '_skinLabel' }, t(labelKey)),
        );
      }),
    ),
  );
}