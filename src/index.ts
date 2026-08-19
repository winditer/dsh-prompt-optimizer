/** dsh-prompt-optimizer 插件入口 — apply(ctx) */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { Lang, PromptConfig } from './optimizer.js';
import { DEFAULTS, mergeConfig, resolveSessionModel } from './optimizer.js';
import { NS, zh, en, langOf } from './locales.js';
import type { OptimizerActions } from './optimizer-store.js';
import { emitOptimizeRequest, emitOpenSettingsRequest } from './events.js';
import { OptimizeButton } from './OptimizeButton.tsx';
import { PreviewCard } from './PreviewCard.tsx';
import { SettingsRow } from './SettingsRow.tsx';
import { createSettingsFormStore } from './settings-store.js';

/**
 * 声明插件依赖的客户端服务（cordis service keys）：apply 内经 `ctx.<service>` 访问的服务必须在此声明。
 * 值须为服务名而非包 id——与同形态先例一致（dsh-message-rail: ["slots","sessions"]；
 * dsh-better-sidebar 亦声明 locale）；错误声明会让 fiber 永久 PENDING，启动审计直接判失败。
 */
export const inject = ['slots', 'sessions', 'locale', 'connection'];

export function apply(ctx: ClientContext) {
  // 1. 文案
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'prompt-optimizer: locale registration');

  // 2. 配置镜像：自持 RPC 配置（server half 读写 ~/.dsh/prompt-optimizer-config.json，通道
  // '/dsh-prompt-optimizer'——同 dsh-sticky-note 模式）。不用 settingsScope：桌面应用的 host
  // settings 注册表对未注册 namespace 返回 unavailable，set 静默失效（实测）。
  let configMirror: PromptConfig = mergeConfig(undefined);
  let configEpoch = 0;
  const rpcConfig = async (endpoint: string, payload?: Record<string, unknown>): Promise<unknown> => {
    const result = await ctx.connection.rpc.call('/dsh-prompt-optimizer', endpoint, payload ?? {});
    if (!result.ok) {
      throw new Error(
        `config rpc ${endpoint} failed: ${(result.error && (result.error.details || result.error.code)) || 'rpc failed'}`,
      );
    }
    return result.value;
  };
  const loadConfig = async (): Promise<void> => {
    try {
      const value = await rpcConfig('get');
      configMirror = mergeConfig(value as Partial<PromptConfig> | undefined);
    } catch {
      // 初次连接未就绪时保持默认；下次保存后镜像即更新
    }
  };
  void loadConfig();

  // 2.5 当前会话解析：先取激活会话 id（sessions.currentProvideInfo），
  // 再查 session.models —— 不传 sessionId 时服务端回退默认模型而非会话模型（实测 bug）
  const getActiveSession = (): string | null => {
    const info = (
      ctx.sessions as {
        currentProvideInfo?: { getSnapshot?: () => { sessionId?: string } };
      } | undefined
    )?.currentProvideInfo?.getSnapshot?.();
    const sessionId = info?.sessionId;
    return typeof sessionId === 'string' && sessionId.length > 0 ? sessionId : null;
  };
  const getSessionModel = async (): Promise<string | null> => {
    const sessionId = getActiveSession();
    if (!sessionId) return null;
    return resolveSessionModel(ctx.connection.api as never, { sessionId });
  };

  // 2.6 宿主通道（临时对话 + 当前会话模型，零配置）：
  // 可复用的固定临时会话承载优化；模型继承当前会话（selectModel），
  // 结果经 session.history 轮询增量呈现（近似流式）
  // 临时会话 id：宿主按 session-<uuid> 约定校验，普通短 id 会被 create 拒绝（实测无会话 → 一直空轮询）
  const PO_HOST_SESSION_ID = 'session-po-optimizer-9f3c2a7e-1b4d-4c8a-9e6f-2a5b7d1c3e9f';
  const hostApi = (ctx.connection.api as never) as {
    create(p: { sessionId: string }): Promise<unknown>;
    selectModel(p: { sessionId: string; provider: string; model: string }): Promise<unknown>;
    prompt(p: { sessionId: string; mode: 'queue'; content: Array<{ type: 'text'; text: string }> }): Promise<unknown>;
    history(p: { sessionId: string }): Promise<{ events?: unknown }>;
    cancel(p: { sessionId: string }): Promise<unknown>;
    models(p: { sessionId: string }): Promise<{ current?: { provider?: string; model?: string } } | null>;
  };
  const getHost = (): { api: typeof hostApi; parentSessionId: string; sessionId: string } | null => {
    const parentSessionId = getActiveSession();
    if (!parentSessionId) return null;
    return { api: hostApi, parentSessionId, sessionId: PO_HOST_SESSION_ID };
  };

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
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            getSessionModel,
            getHost,
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
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            openSettings: () => emitOpenSettingsRequest(),
            getSessionModel,
            getHost,
          }),
        },
        PreviewCard,
      ),
    );
  });

  // 6. 设置行（root 作用域）
  const settingsStore = createSettingsFormStore();
  const saveConfig = async (raw: Partial<PromptConfig>): Promise<void> => {
    const merged = mergeConfig({ ...configMirror, ...raw });
    const written: PromptConfig = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model,
      useSessionModel: merged.useSessionModel,
    };
    try {
      const saved = await rpcConfig('set', { patch: { baseUrl: written.baseUrl, apiKey: written.apiKey, model: written.model } });
      configMirror = mergeConfig(saved as Partial<PromptConfig> | undefined);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };
  const resetConfig = async (): Promise<void> => {
    try {
      const saved = await rpcConfig('set', {
        patch: {
          baseUrl: DEFAULTS.baseUrl,
          apiKey: DEFAULTS.apiKey,
          model: DEFAULTS.model,
          useSessionModel: true,
        },
      });
      configMirror = mergeConfig(saved as Partial<PromptConfig> | undefined);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
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