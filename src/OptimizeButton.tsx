/** 输入栏右侧「优化」按钮 */

import React, { useEffect } from 'react';
import type { Lang, PromptConfig } from './optimizer.js';
import { canTrigger } from './optimizer.js';
import type { OptimizerActions } from './optimizer-store.js';
import { runOptimize } from './optimizer-store.js';
import type { PreviewState } from './preview-state.js';

/** 会话标准 kit 提供的只读输入快照（input hook） */
interface InputSnapshot {
  draft: string;
}

export interface OptimizeButtonProps {
  t: (key: string) => string;
  useInput: () => InputSnapshot;
  useStore: <T>(selector: (s: PreviewState) => T) => T;
  actions: OptimizerActions;
  getConfig: () => PromptConfig;
  getLang: () => Lang;
}

const CSS_ID = 'dsh-prompt-optimizer/button.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.dsh-po-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.85;
  border-radius: 6px;
}
.dsh-po-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12));
}
.dsh-po-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.dsh-po-btn[data-busy="true"]::before {
  content: "⏳";
}
`;
  document.head.appendChild(style);
}

export function OptimizeButton(props: OptimizeButtonProps) {
  const { t, useInput, useStore, actions, getConfig, getLang } = props;

  const input = useInput();
  const status = useStore((s) => s.status);
  const busy = status === 'optimizing';
  const disabled = !canTrigger(input.draft, busy);

  // 卸载时无需显式取消：请求在途时组件树已不渲染；会话切换后 store 实例随
  // 会话 scope 清理（或冻结），runOptimize 的迟到写入无人订阅，无副作用。
  useEffect(() => injectCss(), []);

  const handleClick = () => {
    if (disabled) return;
    void runOptimize(actions, {
      getConfig,
      getLang,
      getDraft: () => input.draft,
    });
  };

  return (
    <button
      type="button"
      className="dsh-po-btn"
      aria-label={t('button.aria')}
      title={t('button.aria')}
      aria-busy={busy}
      disabled={disabled}
      data-busy={busy}
      onClick={handleClick}
    >
      {busy ? '⏳' : '✨'}
    </button>
  );
}