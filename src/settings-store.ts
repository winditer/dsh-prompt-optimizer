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

/** defineStore 返回的 store 句柄（同时可作类型占位，供注册时 `store:` 使用） */
export interface SettingsFormStoreHandle {
  // 运行时形状由 DSH 提供；此处仅为文档性类型
}

export const createSettingsFormStore = (): SettingsFormStoreHandle => {
  const handle = defineStore({
    init: (): SettingsFormState => ({
      // 每实例副本：INITIAL_SETTINGS_FORM 是只读共享常量，勿跨实例共享引用（reducer 的 draft 写入需受保护）
      ...INITIAL_SETTINGS_FORM,
      values: { ...INITIAL_SETTINGS_FORM.values },
    }),
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
  return handle as SettingsFormStoreHandle;
}
