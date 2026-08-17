// dsh-prompt-optimizer —— 节点侧（server half）。
// 配置持久化采用与 dsh-sticky-note（先例、已在运行）相同的模式：server half 直接读写
// `~/.dsh/prompt-optimizer-config.json`，并通过 loopback RPC 通道 `/dsh-prompt-optimizer`
// 向 client 提供 get/set。
// 为什么不用 settingsScope/settings 注册：client 侧 settingsScope（loopback host 面）需要
// namespace 事先注册进桌面应用 host 的 settings 注册表（官方插件由 host 内置注册，第三方走
// 市场安装流程注册）；手工装配进 profile 的插件没有该注册，describe 返回 unavailable，
// settingsScope.set 静默失效（实测 status:"unavailable", mode:"host"）。
// 客户端功能全部在 dist/client.js（exports["./client"]）。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const CHANNEL = '/dsh-prompt-optimizer';
const CONFIG_PATH = join(homedir(), '.dsh', 'prompt-optimizer-config.json');

async function readConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function writeConfig(config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

/** RPC handler：{ok,value}/{ok:false,error}。endpoint: 'get' | 'set' */
async function handler(endpoint, payload) {
  try {
    switch (endpoint) {
      case 'get': {
        return { ok: true, value: await readConfig() };
      }
      case 'set': {
        const current = await readConfig();
        const next = { ...current, ...(payload?.patch ?? {}) };
        await writeConfig(next);
        return { ok: true, value: next };
      }
      default:
        return { ok: false, error: { code: 'unknown', details: endpoint } };
    }
  } catch (error) {
    return { ok: false, error: { code: 'error', details: error instanceof Error ? error.message : String(error) } };
  }
}

export const name = 'dsh-prompt-optimizer';

export function apply(ctx) {
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(
      () => connectionCtx.connection.rpc.handle(CHANNEL, handler, { authority: 'loopback' }),
      'dsh-prompt-optimizer: rpc',
    );
  });
}