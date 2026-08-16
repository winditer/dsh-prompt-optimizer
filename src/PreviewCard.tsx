/** 输入区浮层预览卡片：guide / optimizing / preview / error 四种内容态 */

import React, { useEffect, useState } from 'react';
import type { Lang, PromptConfig } from './optimizer.js';
import type { OptimizerActions } from './optimizer-store.js';
import { runOptimize } from './optimizer-store.js';
import type { PreviewState } from './preview-state.js';

/** 会话标准 kit 提供的输入 action 面 */
interface InputActions {
  setDraft(text: string): void;
}

export interface PreviewCardProps {
  t: (key: string) => string;
  useInput: () => { draft: string };
  inputActions: InputActions;
  useStore: <T>(selector: (s: PreviewState) => T) => T;
  actions: OptimizerActions;
  getConfig: () => PromptConfig;
  getLang: () => Lang;
  openSettings: () => void;
}

const CSS_ID = 'dsh-prompt-optimizer/card.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.dsh-po-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(100% + 8px);
  z-index: 40;
  background: var(--dsw-alias-bg-overlay, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.3));
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  padding: 12px 14px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dsh-po-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--dsw-alias-label-primary, #222);
  font-size: 13px;
  font-weight: 600;
}
.dsh-po-card-body {
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-secondary, #444);
  font-size: 13px;
  line-height: 1.6;
  max-height: 200px;
}
.dsh-po-card-err {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 13px;
}
.dsh-po-card-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dsh-po-card-btn {
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--dsw-alias-label-primary, #222);
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
}
.dsh-po-card-btn.primary {
  color: var(--dsw-alias-brand-primary-invert, #fff);
  background: var(--dsw-alias-brand-primary, #1677ff);
}
`;
  document.head.appendChild(style);
}

function errorKey(kind: PreviewState['errorKind']): string {
  switch (kind) {
    case 'unauthorized':
    case 'forbidden':
      return `error.${kind}`;
    case 'timeout':
    case 'network':
    case 'cors':
    case 'http':
    case 'bad-response':
    case 'empty':
    case 'config':
      return `error.${kind}`;
    default:
      return 'error.network';
  }
}

export function PreviewCard(props: PreviewCardProps) {
  const { t, useInput, inputActions, useStore, actions, getConfig, getLang, openSettings } = props;

  useEffect(() => injectCss(), []);

  const input = useInput();
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const errorKind = useStore((s) => s.errorKind);
  const [copied, setCopied] = useState(false);

  if (status === 'idle') return null;

  const retry = () => {
    void runOptimize(actions, { getConfig, getLang, getDraft: () => input.draft });
  };

  const replace = () => {
    inputActions.setDraft(result);
    actions.close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // 剪贴板不可用时静默
    }
  };

  return (
    <div className="dsh-po-card" role="status">
      <div className="dsh-po-card-head">
        <span>{t('card.title')}</span>
        <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
          ✕
        </button>
      </div>

      {status === 'guide' && (
        <>
          <div className="dsh-po-card-body">{t('guide.title')}</div>
          <div className="dsh-po-card-body">{t('guide.desc')}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={() => { actions.close(); openSettings(); }}>
              {t('guide.action')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('guide.dismiss')}
            </button>
          </div>
        </>
      )}

      {status === 'optimizing' && <div className="dsh-po-card-body">{t('card.optimizing')}</div>}

      {status === 'preview' && (
        <>
          <div className="dsh-po-card-body">{result}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={replace}>
              {t('card.replace')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => void copy()}>
              {copied ? t('card.copyDone') : t('card.copy')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={retry}>
              {t('card.retry')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('card.dismiss')}
            </button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="dsh-po-card-err">{t(errorKey(errorKind))}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={retry}>
              {t('card.retry')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => actions.close()}>
              {t('card.dismiss')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}