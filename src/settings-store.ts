/** 设置表单 store（defineStore 薄封装）：草稿 + 校验 + 保存动作 */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';
import {
  INITIAL_SETTINGS_FORM,
  reduceSettingsForm,
  validateSettingsForm,
  type SettingsFormState,
  type SettingsFormValues,
} from './settings-form-state.js';

export interface SettingsFormActions {
  seed(values: SettingsFormValues, revision: number): void;
  edit(field: keyof SettingsFormValues, value: string): void;
  commit(revision: number): void;
  fail(message: string): void;
  /** 保存前校验；返回错误字典；无错误时返回 null */
  validate(values: SettingsFormValues): Record<string, string> | null;
}

export const createSettingsFormStore = (): unknown => {
  const handle = defineStore({
    init: (): SettingsFormState => INITIAL_SETTINGS_FORM,
    actions: {
      seed: (d: SettingsFormState, values: SettingsFormValues, revision: number) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'seed', values, revision })),
      edit: (d: SettingsFormState, field: keyof SettingsFormValues, value: string) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'edit', field, value })),
      commit: (d: SettingsFormState, revision: number) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'commit', revision })),
      fail: (d: SettingsFormState, message: string) =>
        Object.assign(d, reduceSettingsForm(d, { type: 'fail', message })),
      validate: (_d: SettingsFormState, values: SettingsFormValues) => {
        const errors = validateSettingsForm(values);
        return Object.keys(errors).length === 0 ? null : errors;
      },
    },
  });
  return handle;
};