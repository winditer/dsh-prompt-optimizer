/** 设置表单校验 —— 纯函数，无 DSH 依赖 */

export interface SettingsFormValues {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** true：优化使用当前会话模型；false：使用 model */
  useSessionModel: boolean;
}

export function validateSettingsForm(values: SettingsFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  const url = values.baseUrl.trim();
  if (!url) {
    errors.baseUrl = 'settings.baseUrl';
  } else {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('protocol');
      if (u.search || u.hash) throw new Error('query-or-hash');
    } catch {
      errors.baseUrl = 'settings.baseUrl';
    }
  }

  if (!values.apiKey.trim()) errors.apiKey = 'settings.apiKey';
  if (!values.useSessionModel && !values.model.trim()) errors.model = 'settings.model';

  return errors;
}

export interface SettingsFormState {
  values: SettingsFormValues;
  dirty: boolean;
  saved: boolean;
  error: string | null;
  revision: number;
}

export const INITIAL_SETTINGS_FORM: SettingsFormState = {
  values: { baseUrl: '', apiKey: '', model: '', useSessionModel: true },
  dirty: false,
  saved: false,
  error: null,
  revision: -1,
};

export type SettingsFormAction =
  | { type: 'seed'; values: SettingsFormValues; revision: number }
  | { type: 'edit'; field: keyof SettingsFormValues; value: string | boolean }
  | { type: 'commit'; revision: number }
  | { type: 'fail'; message: string };

export function reduceSettingsForm(state: SettingsFormState, action: SettingsFormAction): SettingsFormState {
  switch (action.type) {
    case 'seed':
      return action.revision <= state.revision
        ? state
        : { ...state, values: { ...action.values }, dirty: false, saved: false, error: null, revision: action.revision };
    case 'edit':
      return { ...state, values: { ...state.values, [action.field]: action.value }, dirty: true, saved: false, error: null };
    case 'commit':
      return { ...state, dirty: false, saved: true, error: null, revision: action.revision };
    case 'fail':
      return { ...state, error: action.message };
  }
}
