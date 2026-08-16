/** dsh-prompt-optimizer 插件入口 — apply(ctx) */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { Lang, PromptConfig } from './optimizer.js';
import { DEFAULTS, mergeConfig } from './optimizer.js';
import { NS, zh, en, langOf } from './locales.js';
import { createOptimizerStore, type OptimizerActions } from './optimizer-store.js';
import { emitOptimizeRequest, emitOpenSettingsRequest } from './events.js';
import { OptimizeButton } from './OptimizeButton.tsx';
import { PreviewCard } from './PreviewCard.tsx';
import { SettingsRow } from './SettingsRow.tsx';
import { createSettingsFormStore } from './settings-store.js';

/** settings namespace（与插件 id 一致） */
const SETTINGS_NS = 'prompt-optimizer';

/** 配置三字段逐一相等（mergeConfig 产物已归一化，浅比较即可；用于自回声判定） */
function configEquals(a: PromptConfig, b: PromptConfig): boolean {
  return a.baseUrl === b.baseUrl && a.apiKey === b.apiKey && a.model === b.model;
}

/**
 * 声明插件依赖的客户端服务（cordis service keys）：apply 内经 `ctx.<service>` 访问的服务必须在此声明。
 * 值须为服务名而非包 id——与同形态先例一致（dsh-message-rail: ["slots","sessions"]；
 * dsh-better-sidebar 亦声明 locale）；错误声明会让 fiber 永久 PENDING，启动审计直接判失败。
 */
export const inject = ['slots', 'sessions', 'locale', 'settingsScope'];

/** 会话作用域 list slot 的 store 句柄（按钮与预览卡片共享 per-session 实例） */
const optimizerStore = createOptimizerStore();

export function apply(ctx: ClientContext) {
  // 1. 文案
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'prompt-optimizer: locale registration');

  // 2. 配置镜像（settingsScope 为唯一事实源）
  const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  let configMirror: PromptConfig = mergeConfig(undefined);
  // 外部配置变化纪元：驱动设置表单的 seed 修订号（见 SettingsRow）——外部变化令纪元递增从而使表单重播种
  let configEpoch = 0;
  // 最近一次本地保存/重置的写入目标：用于区分 refreshConfig 的自回声（自身写入）与外部变化，
  // 只有外部变化才递增 configEpoch，保证保存后的表单抑制不被自身写入的回声破坏
  let lastSelfWrite: PromptConfig | null = null;
  const refreshConfig = () => {
    const next = mergeConfig(settingsScope.getSnapshot().value);
    // 自回声（next 与本地刚写入的目标一致）不计纪元；与目标不一致（或本无目标）的外部变化 → 纪元 +1
    if (lastSelfWrite === null || !configEquals(next, lastSelfWrite)) {
      configEpoch += 1;
      lastSelfWrite = null;
    }
    configMirror = next;
  };
  refreshConfig();
  ctx.effect(
    () => settingsScope.subscribe(() => refreshConfig()),
    'prompt-optimizer: settings subscription',
  );

  // 3. 语言镜像
  let lang: Lang = langOf(ctx.locale.getLocale().active);
  ctx.on('locale/change', (snap: { active: string }) => {
    lang = langOf(snap.active);
  });

  // 4. 会话槽位：按钮 + 预览卡片
  ctx.inject(['slots', 'sessions'], (scope) => {
    scope.slots.inject('conversation.input.right', () =>
      scope.slots.register(
        {
          name: 'conversation.input.right',
          id: 'prompt-optimizer-button',
          order: 0,
          locale: NS,
          store: optimizerStore,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
          }),
        },
        OptimizeButton,
      ),
    );
    scope.slots.inject('conversation.input.overlay', () =>
      scope.slots.register(
        {
          name: 'conversation.input.overlay',
          id: 'prompt-optimizer-card',
          order: 10,
          locale: NS,
          store: optimizerStore,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            openSettings: () => emitOpenSettingsRequest(),
          }),
        },
        PreviewCard,
      ),
    );
  });

  // 6. 设置行（root 作用域）
  const settingsStore = createSettingsFormStore();
  const saveConfig = (raw: Partial<PromptConfig>) => {
    const merged = mergeConfig({ ...configMirror, ...raw });
    // 写入目标记录为实际落盘值（apiKey 已 trim）：settingsScope.set 为异步 RPC，落盘后经
    // settingsScope.subscribe → refreshConfig 回声；与 lastSelfWrite 一致则不计入 configEpoch。
    // 注意：此处不调用 refreshConfig()——同步读到的仍是写入前的旧快照（RPC 未落盘），
    // 镜像更新统一走 subscribe 回声路径。
    const written: PromptConfig = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model,
    };
    settingsScope.set('baseUrl', written.baseUrl);
    settingsScope.set('apiKey', written.apiKey);
    settingsScope.set('model', written.model);
    lastSelfWrite = written;
  };
  const resetConfig = () => {
    const written: PromptConfig = {
      baseUrl: DEFAULTS.baseUrl,
      apiKey: DEFAULTS.apiKey,
      model: DEFAULTS.model,
    };
    settingsScope.set('baseUrl', written.baseUrl);
    settingsScope.set('apiKey', written.apiKey);
    settingsScope.set('model', written.model);
    lastSelfWrite = written;
  };

  ctx.inject(['slots'], (scope) => {
    scope.slots.inject('settings.general.item', () =>
      scope.slots.register(
        {
          name: 'settings.general.item',
          id: 'prompt-optimizer-settings',
          order: 30,
          locale: NS,
          store: settingsStore,
          inject: () => ({
            getConfig: () => configMirror,
            saveConfig,
            resetConfig,
            getEpoch: () => configEpoch,
          }),
        },
        SettingsRow,
      ),
    );
  });

  // 7. 快捷键：Alt+O（焦点在 textarea 内时等效点击优化按钮）
  const onKeydown = (e: KeyboardEvent) => {
    if (!e.altKey || e.code !== 'KeyO') return;
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) return;
    e.preventDefault();
    emitOptimizeRequest();
  };
  document.addEventListener('keydown', onKeydown);
}

// 引用守卫：避免 tree-shake 掉类型（仅文档性；无运行时行为）
export type { OptimizerActions };