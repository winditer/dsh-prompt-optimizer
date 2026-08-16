/** dsh-prompt-optimizer 插件入口 — apply(ctx) */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { Lang, PromptConfig } from './optimizer.js';
import { mergeConfig } from './optimizer.js';
import { NS, zh, en, langOf } from './locales.js';
import { createOptimizerStore, type OptimizerActions } from './optimizer-store.js';
import { emitOptimizeRequest } from './events.js';
import { OptimizeButton } from './OptimizeButton.tsx';
import { PreviewCard } from './PreviewCard.tsx';

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

/** 「去设置」信号：root 级轻量通知（设置行订阅后自动展开；Task 5 接线） */
const signalListeners = new Set<() => void>();
let signalValue = 0;
const signal = {
  getSnapshot: () => signalValue,
  subscribe: (fn: () => void) => {
    signalListeners.add(fn);
    return () => signalListeners.delete(fn);
  },
  set: (next: number) => {
    signalValue = next;
    for (const fn of signalListeners) fn();
  },
};

export function apply(ctx: ClientContext) {
  // 1. 文案
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'prompt-optimizer: locale registration');

  // 2. 配置镜像（settingsScope 为唯一事实源）
  const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  let configMirror: PromptConfig = mergeConfig(undefined);
  const refreshConfig = () => {
    configMirror = mergeConfig(settingsScope.getSnapshot().value);
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
            openSettings: () => signal.set(signal.getSnapshot() + 1),
          }),
        },
        PreviewCard,
      ),
    );
  });
}

// 引用守卫：避免 tree-shake 掉类型（仅文档性；无运行时行为）
export type { OptimizerActions };