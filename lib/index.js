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

// HTTP JSON API（dsh-elf 方式）：渲染进程用相对路径 fetch 直达宿主 webServer，
// 完全绕开 connection.rpc.call —— desktop 的 rpc.call 在同一流程第二次调用会挂死
// （实测 sessionModel 成功、optimize.start 永不达 server）。配置读写保留 RPC（单次调用无碍）。
const HTTP_PREFIX = '/dsh-prompt-optimizer/api';
const MAX_BODY_BYTES = 1 << 20;

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
export function makeHandler(ctx) {
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
        case 'optimize.run': {
          // 单次 RPC 全流程（desktop 渲染进程的 rpc.call 在同流程第二次调用会挂死——
          // 实测 sessionModel 成功、optimize.start 永不达 server）。模型由 agentDefaultModel
          // 提供或 payload 显式传；服务端跑完整个 llm.stream 后一次性返回全文。
          const llm = ctx.get('llm');
          if (!llm) return err('no-llm', 'llm service unavailable');
          const text = payload.text;
          if (typeof text !== 'string' || !text.trim()) return err('no-text', 'empty text');
          let provider = payload.provider;
          let model = payload.model;
          if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) {
            const agentDefaultModel = ctx.get('agentDefaultModel');
            const sel = agentDefaultModel && agentDefaultModel.currentSelection
              ? agentDefaultModel.currentSelection()
              : undefined;
            if (sel && sel.model) {
              provider = provider || sel.provider;
              model = model || sel.model;
            }
          }
          if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) {
            return err('no-model', 'provider/model required');
          }
          const options = {
            provider,
            model,
            messages: [{ role: 'user', content: [{ type: 'text', text }] }],
            system: typeof payload.system === 'string' && payload.system ? payload.system : undefined,
          };
          if (typeof payload.reasoningEffort === 'string' && payload.reasoningEffort) {
            options.reasoningEffort = payload.reasoningEffort;
          }
          await dbg('optimize.run provider=' + provider, 'model=' + model, 'textLen=' + text.length);
          let out = '';
          let error = null;
          try {
            for await (const chunk of llm.stream(options)) {
              if (chunk.type === 'text-delta') {
                out += chunk.text;
              } else if (chunk.type === 'finish') {
                if (chunk.reason && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
                  error = (chunk.reason.failure && chunk.reason.failure.message) || chunk.reason.kind;
                }
              }
            }
          } catch (streamError) {
            error = String((streamError && streamError.message) || streamError);
          }
          await dbg('optimize.run done textLen=' + out.length, 'error=' + (error || '-'));
          if (error) return err('stream-error', error);
          return ok({ text: out });
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

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) throw new Error('body too large');
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('bad json');
  }
}

function writeJson(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

/** HTTP JSON API 路由（dsh-elf 形态）：POST /dsh-prompt-optimizer/api/<method> */
function createApiRoute(getCtx) {
  return async (req, res) => {
    let args = {};
    try {
      args = await readJsonBody(req);
    } catch (error) {
      writeJson(res, 400, { ok: false, error: String((error && error.message) || error) });
      return;
    }
    if (req.method !== 'POST') {
      writeJson(res, 405, { ok: false, error: 'post only' });
      return;
    }
    const pathname = new URL(req.url || '/', 'http://dsh.internal').pathname;
    const method = pathname.startsWith(HTTP_PREFIX + '/')
      ? decodeURIComponent(pathname.slice(HTTP_PREFIX.length + 1))
      : '';
    if (!method || method.includes('/')) {
      writeJson(res, 404, { ok: false, error: 'unknown' });
      return;
    }
    const ctx = getCtx();
    const llm = ctx.get('llm');
    const agentDefaultModel = ctx.get('agentDefaultModel');
    try {
      switch (method) {
        case 'optimize.stream': {
          // 真流式：SSE 直出。请求保持打开，llm.stream 的每个 text-delta 即时 write，
          // finish 后 [DONE]。客户端 fetch + reader 逐 chunk 呈现（逐 token 滚动）。
          if (!llm) {
            writeJson(res, 200, { ok: false, error: { code: 'no-llm', details: 'llm unavailable' } });
            return;
          }
          const text = args.text;
          const provider = args.provider;
          const model = args.model;
          if (typeof text !== 'string' || !text.trim()) {
            writeJson(res, 200, { ok: false, error: { code: 'no-text', details: 'empty text' } });
            return;
          }
          if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) {
            writeJson(res, 200, { ok: false, error: { code: 'no-model', details: 'provider/model required' } });
            return;
          }
          const options = {
            provider,
            model,
            messages: [{ role: 'user', content: [{ type: 'text', text }] }],
            system: typeof args.system === 'string' && args.system ? args.system : undefined,
          };
          if (typeof args.reasoningEffort === 'string' && args.reasoningEffort) {
            options.reasoningEffort = args.reasoningEffort;
          }
          res.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-cache',
            connection: 'keep-alive',
          });
          res.write('event: start\ndata: {}\n\n');
          let textLen = 0;
          let deltaCount = 0;
          try {
            for await (const chunk of llm.stream(options)) {
              if (chunk.type === 'text-delta') {
                textLen += chunk.text.length;
                deltaCount += 1;
                const safe = String(chunk.text).replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                res.write(`event: delta\ndata: ${safe}\n\n`);
              } else if (chunk.type === 'finish') {
                if (chunk.reason && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
                  const msg = (chunk.reason.failure && chunk.reason.failure.message) || chunk.reason.kind;
                  res.write(`event: error\ndata: ${String(msg).replace(/\n/g, ' ').replace(/\r/g, ' ')}\n\n`);
                }
                break;
              }
            }
            await dbg('sse', provider, model, 'ended deltaCount=' + deltaCount, 'textLen=' + textLen);
            res.write('event: done\ndata: {}\n\n');
          } catch (error) {
            await dbg('sse', provider, model, 'THREW:', String((error && error.message) || error));
            res.write(`event: error\ndata: ${String((error && error.message) || error).replace(/\n/g, ' ').replace(/\r/g, ' ')}\n\n`);
            res.write('event: done\ndata: {}\n\n');
          } finally {
            res.end();
          }
          return;
        }
        case 'sessionModel': {
          if (!agentDefaultModel) {
            writeJson(res, 200, { ok: false, error: { code: 'no-agent-model', details: 'agentDefaultModel unavailable' } });
            return;
          }
          const sel = agentDefaultModel.currentSelection();
          if (!sel || !sel.model) {
            writeJson(res, 200, { ok: false, error: { code: 'no-model', details: 'no model selected' } });
            return;
          }
          const value = { provider: sel.provider, model: sel.model };
          if (sel.reasoningEffort !== undefined) value.reasoningEffort = sel.reasoningEffort;
          writeJson(res, 200, { ok: true, value });
          return;
        }
        case 'optimize.start': {
          if (!llm) {
            writeJson(res, 200, { ok: false, error: { code: 'no-llm', details: 'llm unavailable' } });
            return;
          }
          const text = args.text;
          const provider = args.provider;
          const model = args.model;
          if (typeof text !== 'string' || !text.trim()) {
            writeJson(res, 200, { ok: false, error: { code: 'no-text', details: 'empty text' } });
            return;
          }
          if (typeof provider !== 'string' || !provider || typeof model !== 'string' || !model) {
            writeJson(res, 200, { ok: false, error: { code: 'no-model', details: 'provider/model required' } });
            return;
          }
          const taskId = `po-${Date.now()}-${taskSeq++}`;
          const entry = { text: '', done: false, error: null, abort: false };
          tasks.set(taskId, entry);
          const options = {
            provider,
            model,
            messages: [{ role: 'user', content: [{ type: 'text', text }] }],
            system: typeof args.system === 'string' && args.system ? args.system : undefined,
          };
          if (typeof args.reasoningEffort === 'string' && args.reasoningEffort) {
            options.reasoningEffort = args.reasoningEffort;
          }
          await dbg('http start', taskId, provider, model, 'textLen=' + text.length);
          (async () => {
            try {
              for await (const chunk of llm.stream(options)) {
                if (entry.abort) break;
                if (chunk.type === 'text-delta') {
                  entry.text += chunk.text;
                } else if (chunk.type === 'finish') {
                  if (chunk.reason && (chunk.reason.kind === 'error' || chunk.reason.kind === 'aborted')) {
                    entry.error = (chunk.reason.failure && chunk.reason.failure.message) || chunk.reason.kind;
                  }
                  entry.done = true;
                }
              }
              await dbg('http stream', taskId, 'ended textLen=' + entry.text.length, 'err=' + (entry.error || '-'));
              if (!entry.done) entry.done = true;
            } catch (streamError) {
              await dbg('http stream', taskId, 'THREW:', String((streamError && streamError.message) || streamError));
              entry.error = String((streamError && streamError.message) || streamError);
              entry.done = true;
            }
          })();
          writeJson(res, 200, { ok: true, value: { taskId } });
          return;
        }
        case 'optimize.poll': {
          const entry = typeof args.taskId === 'string' ? tasks.get(args.taskId) : undefined;
          if (!entry) {
            writeJson(res, 200, { ok: false, error: { code: 'no-task', details: 'unknown task' } });
            return;
          }
          if (entry.pollCount === undefined) entry.pollCount = 0;
          entry.pollCount += 1;
          if (entry.pollCount % 10 === 1) {
            await dbg('http poll', String(args.taskId), '#' + entry.pollCount, 'done=' + entry.done, 'textLen=' + entry.text.length);
          }
          writeJson(res, 200, { ok: true, value: { done: entry.done, text: entry.text, error: entry.error } });
          return;
        }
        case 'optimize.abort': {
          const entry = typeof args.taskId === 'string' ? tasks.get(args.taskId) : undefined;
          if (entry) entry.abort = true;
          writeJson(res, 200, { ok: true, value: true });
          return;
        }
        default:
          writeJson(res, 404, { ok: false, error: { code: 'unknown', details: method } });
      }
    } catch (error) {
      writeJson(res, 500, { ok: false, error: String((error && error.message) || error) });
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
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () => webCtx.webServer.register({
        kind: 'prefix',
        path: HTTP_PREFIX,
        handler: createApiRoute(() => ctx),
      }),
      'dsh-prompt-optimizer: http api',
    );
  });
}