/** 输入区浮层预览卡片：guide / optimizing / preview / error 四种内容态
 *  状态来自模块级预览总线（preview-bus），不依赖会话 store/hook props */

import React, { useEffect, useRef, useState } from 'react';
import type { Lang, PromptConfig } from './optimizer.js';
import { runOptimize, closePreview } from './optimizer-store.js';
import { getPreviewBusState, subscribePreviewBus } from './preview-bus.js';

export interface PreviewCardProps {
  t: (key: string) => string;
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
  /* 写死主色：--dsw-alias-brand-primary 在深夜模式解析为浅色 → 白底白字不可读（用户实测） */
  color: #fff;
  background: #1677ff;
}
`;
  document.head.appendChild(style);
}

/** 找 composer 输入框：优先焦点，否则第一个非 disabled textarea */
function findComposer(): HTMLTextAreaElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && !active.disabled) return active;
  const all = document.querySelectorAll<HTMLTextAreaElement>('textarea');
  for (const ta of all) {
    if (!ta.disabled) return ta;
  }
  return null;
}

function readComposerText(): string {
  const ta = findComposer();
  return ta ? ta.value : '';
}

/** 用原生 value setter 写回，让 React 受控组件感知（再派发 input 事件触发 onChange） */
function writeComposerText(text: string): void {
  const ta = findComposer();
  if (!ta) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(ta, text);
  } else {
    ta.value = text;
  }
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
}

function errorKey(kind: string | null): string {
  switch (kind) {
    // kind → locale key；'config' 在 UI 上不可达（runOptimize 先走 guide），AbortError→timeout 由 runOptimize 先行拦截，保留双保险
    case 'unauthorized': case 'forbidden': case 'timeout': case 'network': case 'cors': case 'http': case 'bad-response': case 'empty': case 'config':
      return `error.${kind}`;
    default:
      return 'error.network';
  }
}

export function PreviewCard(props: PreviewCardProps) {
  const { t, getConfig, getLang, openSettings } = props;

  // 订阅模块级预览总线（替代会话 store props）
  const [state, setState] = useState(() => getPreviewBusState());
  useEffect(
    () => subscribePreviewBus(() => setState(getPreviewBusState())),
    [],
  );

  useEffect(() => injectCss(), []);

  // 卸载时清理：清除挂起的 copied 复位定时器，并标记未挂载，
  // 防止迟到的 setCopied(true)（copy 的 await 期间卸载）在卸载后触发。
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  const { status, result, errorKind } = state;
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  if (status === 'idle') return null;

  const retry = () => {
    void runOptimize({ getConfig, getLang, getDraft: () => readComposerText() });
  };

  const replace = () => {
    writeComposerText(result);
    closePreview();
  };

  const copy = async () => {
    if (!navigator.clipboard) return; // 非安全上下文（http 等）：不翻转 copied，保持可重试
    try {
      await navigator.clipboard.writeText(result);
      if (!mountedRef.current) return; // await 期间组件已卸载：不再 setState
      setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 1200);
    } catch {
      // 剪贴板写入失败：静默（不翻转 copied）
    }
  };

  return (
    <div className="dsh-po-card" role="status">
      <div className="dsh-po-card-head">
        <span>{t('card.title')}</span>
        <button type="button" className="dsh-po-card-btn" onClick={() => closePreview()}>
          ✕
        </button>
      </div>

      {status === 'guide' && (
        <>
          <div className="dsh-po-card-body">{t('guide.title')}</div>
          <div className="dsh-po-card-body">{t('guide.desc')}</div>
          <div className="dsh-po-card-row">
            <button type="button" className="dsh-po-card-btn primary" onClick={() => { closePreview(); openSettings(); }}>
              {t('guide.action')}
            </button>
            <button type="button" className="dsh-po-card-btn" onClick={() => closePreview()}>
              {t('guide.dismiss')}
            </button>
          </div>
        </>
      )}

      {status === 'optimizing' && (
        <div className="dsh-po-card-body">
          {state.draft ? <span style={{ whiteSpace: 'pre-wrap' }}>{state.draft}</span> : t('card.optimizing')}
        </div>
      )}

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
            <button type="button" className="dsh-po-card-btn" onClick={() => closePreview()}>
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
            <button type="button" className="dsh-po-card-btn" onClick={() => closePreview()}>
              {t('card.dismiss')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}