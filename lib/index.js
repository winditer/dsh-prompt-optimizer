// dsh-prompt-optimizer —— 节点侧（server half）。
// 配置持久化采用与 dsh-sticky-note（先例、已在运行）相同的模式：server half 直接读写
// `~/.dsh/prompt-optimizer-config.json`，并通过 loopback RPC 通道 `/dsh-prompt-optimizer`
// 向 client 提供 get/set。
// 为什么不用 settingsScope/settings 注册：client 侧 settingsScope（loopback host 面）需要
// namespace 事先注册进桌面应用 host 的 settings 注册表（官方插件由 host 内置注册，第三方走
// 市场安装流程注册）；手工装配进 profile 的插件没有该注册，describe 返回 unavailable，
// settingsScope.set 静默失效（实测 status:"unavailable", mode:"host"）。
// 客户端功能全部在 dist/client.js（exports["./client"]）。

// 「会话默认模型」流式通道（零配置）采用 dsh-elf 已验证的宿主服务面：
//   agentDefaultModel.currentSelection() → 当前会话/agent 默认模型（免配置取模型）
//   llm.stream({ provider, model, messages, system }) → 服务端真流式（text-delta/finish）
// 不碰 session.create/fork/prompt：渲染进程无法让后台会话执行生成（fork 子会话不在前台
// 不触发模型），自编 sessionId 会被静默拒绝（实测「永远正在优化」的根因）。

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const CHANNEL = '/dsh-prompt-optimizer';
const CONFIG_PATH = join(homedir(), '.dsh', 'prompt-optimizer-config.json');
// 调试日志（诊断宿主流式通道）：每次调用追加一行，定位「正在优化…无产出」
const DEBUG_LOG = join(homedir(), '.dsh', 'prompt-optimizer-debug.log');
async function dbg(...args) {
  try {
    await appendFile(DEBUG_LOG, `[${new Date().toISOString()}] ${args.map(String).join(' ')}
`);
  } catch {
    // 日志失败不影响主流程
  }
}

// 在途流式任务（Web Client 半经 RPC 轮询取增量；abort 标记让后台流尽快停下）
const tasks = new Map();
let taskSeq = 0;

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

function ok(value) {
  return { ok: true, value };
}

function err(code, details) {
  return { ok: false, error: { code, details } };
}

/** RPC handler：{ok,value}/{ok:false,error}。endpoint: get | set | sessionModel | optimize.start | optimize.poll | optimize.abort */
function makeHandler(ctx) {
  return async (endpoint, payload = {}) => {
    try {
      switch (endpoint) {
        case 'get': {
          return ok(await readConfig());
        }
        case 'set': {
          const current = await readConfig();
          const next = { ...current, ...(payload.patch ?? {}) };
          await writeConfig(next);
          return ok(next);
        }
        case 'sessionModel': {
          // 当前会话/agent 默认模型（零配置取模型；宿主无该服务或无可选模型时明确报错）
          await dbg('sessionModel called');
          const agentDefaultModel = ctx.get('agentDefaultModel');
          if (!agentDefaultModel) { await dbg('sessionModel -> no-agent-model'); return err('no-agent-model', 'agentDefaultModel service unavailable'); }
          const sel = agentDefaultModel.currentSelection();
          if (!sel || !sel.model) { await dbg('sessionModel -> no-model'); return err('no-model', 'no current model selected'); }
          const value = { provider: sel.provider, model: sel.model };
          if (sel.reasoningEffort !== undefined) value.reasoningEffort = sel.reasoningEffort;
          await dbg('sessionModel ok', JSON.stringify(value));
          return ok(value);
        }
        case 'optimize.start': {
          const llm = ctx.get('llm');
          if (!llm) { await dbg('start -> no-llm'); return err('no-llm', 'llm service unavailable'); }
          const text = payload.text;
          const provider = payload.provider;
          const model = payload.model;
          if (typeof text !== 'string' || !text.trim()) return err('no-text', 'empty text');
          if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) {
            return err('no-model', 'provider/model required');
          }
          const taskId = `po-${Date.now()}-${taskSeq++}`;
          const entry = { text: '', done: false, error: null, abort: false };
          tasks.set(taskId, entry);
          const options = {
            provider,
            model,
            messages: [{ role: 'user', content: [{ type: 'text', text }] }],
            system: typeof payload.system === 'string' && payload.system ? payload.system : undefined,
          };
          if (typeof payload.reasoningEffort === 'string' && payload.reasoningEffort) {
            options.reasoningEffort = payload.reasoningEffort;
          }
          await dbg('start', taskId, 'provider=' + provider, 'model=' + model, 'textLen=' + text.length);
          (async () => {
            try {
              let deltaCount = 0;
              let reasoningCount = 0;
              for await (const chunk of llm.stream(options)) {
                if (entry.abort) { await dbg('stream', taskId, 'aborted by client'); break; }
                if (chunk.type === 'text-delta') {
                  entry.text += chunk.text;
                  deltaCount += 1;
                } else if (chunk.type === 'reasoning-delta' || (chunk.type === 'delta' && chunk.blockType === 'reasoning')) {
                  reasoningCount += 1;
                } else if (chunk.type === 'finish') {
                  await dbg('stream', taskId, 'finish', JSON.stringify(chunk.reason || {}));
                  if (chunk.reason && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
                    entry.error = (chunk.reason.failure && chunk.reason.failure.message) || chunk.reason.kind;
                  }
                  entry.done = true;
                }
              }
              await dbg('stream', taskId, 'ended deltaCount=' + deltaCount, 'reasoningCount=' + reasoningCount, 'textLen=' + entry.text.length);
              if (!entry.done) entry.done = true;
            } catch (error) {
              await dbg('stream', taskId, 'THREW:', String((error && error.message) || error));
              entry.error = String((error && error.message) || error);
              entry.done = true;
            }
          })();
          return ok({ taskId });
        }
        case 'optimize.poll': {
          const entry = typeof payload.taskId === 'string' ? tasks.get(payload.taskId) : undefined;
          if (!entry) { await dbg('poll unknown task', String(payload.taskId)); return err('no-task', 'unknown task'); }
          if (entry.pollCount === undefined) entry.pollCount = 0;
          entry.pollCount += 1;
          if (entry.pollCount % 10 === 1) {
            await dbg('poll', String(payload.taskId), '#' + entry.pollCount, 'done=' + entry.done, 'textLen=' + entry.text.length, 'err=' + (entry.error || '-'));
          }
          return ok({ done: entry.done, text: entry.text, error: entry.error });
        }
        case 'optimize.abort': {
          const entry = typeof payload.taskId === 'string' ? tasks.get(payload.taskId) : undefined;
          if (entry) { entry.abort = true; await dbg('abort', String(payload.taskId), 'textLen=' + entry.text.length); }
          return ok(true);
        }
        default:
          return err('unknown', endpoint);
      }
    } catch (error) {
      return err('error', error instanceof Error ? error.message : String(error));
    }
  };
}

export const name = 'dsh-prompt-optimizer';

export function apply(ctx) {
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(
      () => connectionCtx.connection.rpc.handle(CHANNEL, makeHandler(ctx), { authority: 'loopback' }),
      'dsh-prompt-optimizer: rpc',
    );
  });
}