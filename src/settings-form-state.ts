/** 设置表单校验 —— 纯函数，无 DSH 依赖 */

export interface SettingsFormValues {
  baseUrl: string;
  apiKey: string;
  model: string;
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
    } catch {
      errors.baseUrl = 'settings.baseUrl';
    }
  }

  if (!values.apiKey.trim()) errors.apiKey = 'settings.apiKey';
  if (!values.model.trim()) errors.model = 'settings.model';

  return errors;
}