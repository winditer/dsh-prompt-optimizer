/** 设置 → General 区「Prompt 优化」设置行：标题摘要 + 展开表单 */

import React, { useEffect, useState } from 'react';
import type { PromptConfig } from './optimizer.js';
import { DEFAULTS } from './optimizer.js';
import type { SettingsFormState, SettingsFormValues } from './settings-form-state.js';
import type { SettingsFormActions } from './settings-store.js';
import { onOpenSettingsRequest } from './events.js';

export interface SettingsRowProps {
  t: (key: string) => string;
  useStore: <T>(selector: (s: SettingsFormState) => T) => T;
  actions: SettingsFormActions;
  getConfig: () => PromptConfig;
  saveConfig: (values: SettingsFormValues) => Promise<void>;
  resetConfig: () => Promise<void>;
  getEpoch: () => number;
  /** 宿主通道自检：当前会话模型是否可经 server half 获取（零配置通道的健康探针） */
  getHostStatus?: () => Promise<{ available: boolean; provider?: string; model?: string; error?: string } | null>;
}

import { BUILD_ID } from './build-id.js';

const CSS_ID = 'dsh-prompt-optimizer/settings.css';
function injectCss() {
  if (typeof document === 'undefined' || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement('style');
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.optiSettings {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.optiSettingsTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.optiSettingsHint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.optiSettingsForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.optiSettingsField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.optiSettingsLabel {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.optiSettingsInput {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  padding: 6px 8px;
  font-size: 13px;
}
.optiSettingsRow {
  display: flex;
  gap: 8px;
  align-items: center;
}
.optiSettingsBtn {
  border: 0;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
  color: var(--dsw-alias-label-primary);
}
.optiSettingsBtn.primary {
  /* 写死主色：主题变量在深夜模式会解析为浅/深极端色（黑底黑字、白底白字均被用户实测），
     固定品牌蓝 + 白字保证任何主题可读 */
  color: #fff;
  background: #1677ff;
}
.optiSettingsErr {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 12px;
}
`;
  document.head.appendChild(style);
}

export function SettingsRow(props: SettingsRowProps) {
  const { t, useStore, actions, getConfig, saveConfig, resetConfig, getEpoch, getHostStatus } = props;
  const [hostStatus, setHostStatus] = useState<{ available: boolean; provider?: string; model?: string; error?: string } | null>(null);

  useEffect(() => {
    if (!getHostStatus) return;
    let alive = true;
    getHostStatus().then((st) => { if (alive) setHostStatus(st); }).catch(() => { if (alive) setHostStatus({ available: false, error: 'rpc-failed' }); });
    return () => { alive = false; };
  }, [getHostStatus]);
  const [expanded, setExpanded] = useState(false);
  const [submitRevision, setSubmitRevision] = useState(0);

  const values = useStore((s) => s.values);
  const saved = useStore((s) => s.saved);
  const error = useStore((s) => s.error);
  // 保存/重置 RPC 失败时显示的原始错误（不再静默失败：settings 写入出错必须让用户看得到）
  const [rpcError, setRpcError] = useState<string | null>(null);

  useEffect(() => injectCss(), []);

  const config = getConfig();
  const modelLabel = config.model ? config.model : '—';

  // 首次挂载 / 配置变化时把当前配置播种进表单。
  // seed 修订号 = 本地提交序号 submitRevision + configEpoch（外部配置变化纪元）：
  //  - 外部配置变化（跨标签页/外部写入 → index.ts refreshConfig 的纪元递增）令修订号超过
  //    state.revision，重播种生效，表单跟上归一化后的镜像；
  //  - 保存/重置已通过 commit/seed 写入「新本地序号 + 当时纪元」的修订号，紧接的本次效应
  //    回跑（纪元未变）修订号相等被 reducer 抑制 → 保住用户原始输入与「已保存」提示；
  //    下次本地动作（edit/commit）再把 state.revision 抬到与纪元一致。
  useEffect(() => {
    actions.seed(
      { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
      submitRevision + getEpoch(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.baseUrl, config.apiKey, config.model, getEpoch]);

  // 「去设置」（预览卡未配置引导）→ 自动展开表单
  useEffect(() => onOpenSettingsRequest(() => setExpanded(true)), []);

  const handleSave = async () => {
    setRpcError(null);
    const errors = actions.validate(values);
    if (errors) {
      actions.fail(Object.values(errors)[0]);
      return;
    }
    try {
      await saveConfig(values);
      setSubmitRevision((r) => r + 1);
      // 与效应回跑的 seed 修订号（新本地序号 + 纪元）对齐，使保存后的重播种被抑制
      actions.commit(submitRevision + 1 + getEpoch());
    } catch (outer) {
      setRpcError(`${t('settings.saveFailed')}：${outer instanceof Error ? outer.message : String(outer)}`);
    }
  };

  const handleReset = async () => {
    setRpcError(null);
    try {
      await resetConfig();
      actions.seed(
        { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model },
        submitRevision + 1 + getEpoch(),
      );
      setSubmitRevision((r) => r + 1);
    } catch (outer) {
      setRpcError(`${t('settings.resetFailed')}：${outer instanceof Error ? outer.message : String(outer)}`);
    }
  };

  return (
    <div className="optiSettings">
      <div className="optiSettingsTitle" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
        {t('settings.title')}
        {!expanded &&
          (values.useSessionModel ? (
            <span className="optiSettingsHint"> · {t('settings.sessionModelEnabled')}</span>
          ) : (
            <span className="optiSettingsHint"> · {t(values.apiKey ? 'card.configured.hint' : 'card.unconfigured.hint').replace('{model}', modelLabel)}</span>
          ))}
      </div>

      {expanded && (
        <div className="optiSettingsForm">
          {getHostStatus && (
            <div className="optiSettingsField" style={{ flexDirection: 'row' }}>
              <span
                className="optiSettingsHint"
                style={{
                  color: hostStatus?.available ? 'var(--dsw-alias-state-success-primary, #2f9e63)' : 'var(--dsw-alias-state-error-primary, #d03050)',
                }}
              >
                <span style={{ color: 'var(--dsw-alias-text-secondary, #8c93a1)' }}>{` · build ${BUILD_ID}`}</span>
                {hostStatus === null
                  ? t('settings.hostProbe')
                  : hostStatus.available
                    ? `${t('settings.hostOk')} ${hostStatus.provider}/${hostStatus.model}`
                    : `${t('settings.hostFail')} ${hostStatus.error ?? ''}`}
              </span>
            </div>
          )}
          <div className="optiSettingsField">
            <label className="optiSettingsLabel">
              <input
                type="checkbox"
                checked={values.useSessionModel}
                onChange={(e) => actions.edit('useSessionModel', e.target.checked)}
              />{' '}
              {t('settings.useSessionModel')}
            </label>
            <span className="optiSettingsHint">{t('settings.useSessionModelHint')}</span>
          </div>
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-base-url">{t('settings.baseUrl')}</label>
            <input
              id="opti-base-url"
              className="optiSettingsInput"
              value={values.baseUrl}
              placeholder={DEFAULTS.baseUrl}
              disabled={values.useSessionModel}
              onChange={(e) => actions.edit('baseUrl', e.target.value)}
            />
          </div>
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-api-key">{t('settings.apiKey')}</label>
            <input
              id="opti-api-key"
              className="optiSettingsInput"
              type="password"
              value={values.apiKey}
              placeholder="sk-…"
              autoComplete="off"
              disabled={values.useSessionModel}
              onChange={(e) => actions.edit('apiKey', e.target.value)}
            />
          </div>
          <div className="optiSettingsField">
            <label className="optiSettingsLabel" htmlFor="opti-model">{t('settings.model')}</label>
            <input
              id="opti-model"
              className="optiSettingsInput"
              value={values.model}
              placeholder={values.useSessionModel ? '—' : DEFAULTS.model}
              disabled={values.useSessionModel}
              onChange={(e) => actions.edit('model', e.target.value)}
            />
          </div>
          <div className="optiSettingsRow">
            <button type="button" className="optiSettingsBtn primary" onClick={handleSave}>
              {t('settings.save')}
            </button>
            <button type="button" className="optiSettingsBtn" onClick={handleReset}>
              {t('settings.reset')}
            </button>
            {saved && <span className="optiSettingsHint">{t('settings.saved')}</span>}
            {rpcError && <span className="optiSettingsErr">{rpcError}</span>}
            {!rpcError && error && <span className="optiSettingsErr">{t(error)}</span>}
          </div>
          <div className="optiSettingsHint">{t('settings.desc')}</div>
        </div>
      )}
    </div>
  );
}
