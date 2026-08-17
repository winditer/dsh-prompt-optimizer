/** 皮肤插件内部类型定义 — 与官方 TypeScript 类型对齐 */

/** 主题定义（与 @deepseek-ai/dsh-client-ui-theme 的 ThemeDefinition 对齐） */
export interface ThemeDefinition {
  /** 主题 id（注册时唯一） */
  id: string;
  /** 基于哪个色板构建：'light' | 'dark' */
  colorScheme: 'light' | 'dark';
  /** 别名层令牌覆盖 { '--dsw-alias-xxx': 'value' } */
  tokens: Record<string, string>;
}