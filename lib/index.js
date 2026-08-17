// dsh-prompt-optimizer —— 节点侧（server half）。
// 职责（实证自官方 dsh-client-locale/lib/index.js）：在 Host settings 服务上注册本插件的
// namespace schema。纯 client 的 settingsScope.set/getSnapshot 走 RPC → server 端
// SettingsProvider.update/get：**未注册的 namespace 会被 RPC 端直接拒绝**
// （`settings namespace "..." is not registered`，静默不落盘），注册后读写才生效。
// 客户端功能全部在 dist/client.js（exports["./client"]）。

import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';

/** 本插件 settings namespace（与客户端 settingsScope.bind 的命名空间一致）。 */
const PROMPT_SETTINGS_NAMESPACE = 'prompt-optimizer';

/** Durable settings schema：三个字段均为宽松字符串；缺失即默认。 */
const PROMPT_SETTINGS_SCHEMA = z.object({
  baseUrl: z.string().required(false),
  apiKey: z.string().required(false),
  model: z.string().required(false),
});

export const name = 'dsh-prompt-optimizer';

/** 注册 namespace 当 settings 服务存在时（fiber dispose 自动注销）。 */
export function apply(ctx) {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(PROMPT_SETTINGS_NAMESPACE), PROMPT_SETTINGS_SCHEMA);
  });
}