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
import { classifyRefresh } from './settings-epoch.js';

/** settings namespace（与插件 id 一致） */
const SETTINGS_NS = 'prompt-optimizer';

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
  // 外部配置变化纪元：驱动设置表单的 seed 修订号（见 SettingsRow）——表单 seed 修订号 = 本地提交序号
  // + configEpoch；configEpoch 仅在「外部配置变化」（非自身写回）时递增（宿主逐字段回显经收敛判定排除）。
  // 已知边界：自身写入回合中发生的外部字段编辑可能被吞（回合收敛判定不匹配），镜像照常更新，下次自身写入自愈
  let configEpoch = 0;
  // 自身写入的目标（pending 平衡标记）：保存/重置时先于 set 置为写入目标；宿主逐字段回显收敛
  // （classifyRefresh 返回 'converged'，当前快照与目标全字段相等）后置空——据此把自身写入的回声
  // 与真正的外部配置变化区分开，自身写入不递增 configEpoch
  let pendingSelfBalance: PromptConfig | null = null;
  function refreshConfig(): void {
    const cur = mergeConfig(settingsScope.getSnapshot()?.value);
    const kind = classifyRefresh(cur, pendingSelfBalance);
    if (kind === 'converged') pendingSelfBalance = null; // 收敛：本轮全部回显完毕
    if (kind === 'external') configEpoch += 1;
    configMirror = cur;
  }
  // 启动直接赋值（不递增纪元）：宿主异步初始加载的回显 → subscribe → refreshConfig 会递增一次，属预期
  configMirror = mergeConfig(settingsScope.getSnapshot()?.value);
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
    const written: PromptConfig = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model,
    };
    // pending 置目标（先于 set；目标=实际落盘值，apiKey 已 trim）：set 为异步逐字段 RPC，落盘后经
    // settingsScope.subscribe → refreshConfig 回显；回显收敛前一律 classifyRefresh='in-progress'，
    // 不递增 configEpoch。注意：此处不调用 refreshConfig()——同步读到的仍是写入前的旧快照（RPC 未落盘），
    // 镜像更新统一走 subscribe 回声路径。
    pendingSelfBalance = written;
    settingsScope.set('baseUrl', written.baseUrl);
    settingsScope.set('apiKey', written.apiKey);
    settingsScope.set('model', written.model);
  };
  const resetConfig = () => {
    // pending 置目标（先于 set）：恢复默认值的逐字段回显同样按收敛判定，不递增 configEpoch
    pendingSelfBalance = { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model };
    settingsScope.set('baseUrl', DEFAULTS.baseUrl);
    settingsScope.set('apiKey', DEFAULTS.apiKey);
    settingsScope.set('model', DEFAULTS.model);
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