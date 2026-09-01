/** 设置表单 store：自实现 defineStore，零 @deepseek-ai 运行时依赖（桌面渲染器兼容） */
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

export interface SettingsFormStoreHandle {
  spec: {
    init: () => SettingsFormState;
    actions: Record<string, (d: SettingsFormState, ...args: any[]) => void>;
  };
  create(scopeKey?: string): {
    actions: SettingsFormActions;
    getSnapshot: () => SettingsFormState;
    subscribe: (fn: () => void) => () => void;
    store: unknown;
    clearPersisted: () => void;
  };
}

/** 自实现 defineStore —— 避免 @deepseek-ai/dsh-client-runtime/client 的 require 在桌面渲染器无法解析 */
function defineStore(decl: {
  init: () => SettingsFormState;
  actions: Record<string, (d: SettingsFormState, ...args: any[]) => void>;
}) {
  return {
    spec: decl,
    create(_scopeKey?: string): {
      actions: SettingsFormActions;
      getSnapshot: () => SettingsFormState;
      subscribe: (fn: () => void) => () => void;
      store: unknown;
      clearPersisted: () => void;
    } {
      let state = decl.init();
      const listeners = new Set<() => void>();
      const notify = () => { for (const fn of listeners) fn(); };
      const store = {
        getSnapshot: () => state,
        subscribe: (fn: () => void) => { listeners.add(fn); return () => void listeners.delete(fn); },
        update: (mutator: (draft: SettingsFormState) => void) => {
          const draft = { ...state, values: { ...state.values } };
          mutator(draft);
          state = draft;
          notify();
        },
      };
      const actions: Record<string, (...args: any[]) => void> = {};
      for (const key of Object.keys(decl.actions)) {
        const mutate = decl.actions[key];
        actions[key] = (...params: any[]) => {
          store.update((draft: SettingsFormState) => { mutate(draft, ...params); });
        };
      }
      return {
        actions: actions as unknown as SettingsFormActions,
        getSnapshot: store.getSnapshot,
        subscribe: store.subscribe,
        store,
        clearPersisted: () => {
          if (typeof localStorage !== 'undefined') {
            try { localStorage.removeItem('dsh-prompt-optimizer/settings'); } catch {}
          }
        },
      };
    },
  };
}

export const createSettingsFormStore = (): SettingsFormStoreHandle => {
  return defineStore({
    init: (): SettingsFormState => ({
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
};