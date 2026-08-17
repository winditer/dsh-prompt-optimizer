/** 皮肤选择行 store — 追踪当前皮肤选择状态 */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';

/** 皮肤选择行状态 */
export interface SkinRowState {
  /** 当前选中的皮肤 id（'system' 或具体皮肤 id） */
  skin: string;
  /** 自增版本号，用于 store 变更检测 */
  revision: number;
}

/** 创建皮肤行 store */
export function createSkinRowStore() {
  return defineStore({
    init: (): SkinRowState => ({
      skin: 'system',
      revision: -1,
    }),
    actions: {
      sync: (d: SkinRowState, skin: string, revision: number) => {
        if (revision <= d.revision) return;
        d.skin = skin;
        d.revision = revision;
      },
    },
  });
}