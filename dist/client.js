window.__ModuleLoader__.load({
  id: "dsh-prompt-optimizer",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/optimizer.ts
var DEFAULTS = {
  baseUrl: "https://api.deepseek.com",
  apiKey: "",
  model: "deepseek-v4-flash",
  useSessionModel: true
};
function normalizeBaseUrl(url) {
  return url.trim().replace(/\/+$/, "");
}
function mergeConfig(raw) {
  const baseUrl = typeof raw?.baseUrl === "string" && raw.baseUrl.trim() ? raw.baseUrl.trim() : DEFAULTS.baseUrl;
  const apiKey = typeof raw?.apiKey === "string" ? raw.apiKey : DEFAULTS.apiKey;
  const rawModel = typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULTS.model;
  const migratedDefault = rawModel === "deepseek-chat" && normalizeBaseUrl(baseUrl) === DEFAULTS.baseUrl ? DEFAULTS.model : rawModel;
  const model = migratedDefault;
  const useSessionModel = typeof raw?.useSessionModel === "boolean" ? raw.useSessionModel : DEFAULTS.useSessionModel;
  return { baseUrl: normalizeBaseUrl(baseUrl), apiKey, model, useSessionModel };
}
function checkConfig(config) {
  if (!config.apiKey.trim()) return { ok: false, reason: "missing-key" };
  if (!config.useSessionModel && !config.model.trim()) return { ok: false, reason: "missing-model" };
  try {
    const u = new URL(normalizeBaseUrl(config.baseUrl));
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("protocol");
    if (u.search || u.hash) throw new Error("query-or-hash");
  } catch {
    return { ok: false, reason: "bad-url" };
  }
  return { ok: true, config };
}
var ZH_SYSTEM = "\u4F60\u662F\u4E00\u540D prompt \u4F18\u5316\u4E13\u5BB6\u3002\u7528\u6237\u4F1A\u7ED9\u4F60\u4E00\u6BB5\u8349\u7A3F prompt\uFF0C\u8BF7\u5728\u4E0D\u6539\u53D8\u5176\u610F\u56FE\u7684\u524D\u63D0\u4E0B\u5C06\u5176\u6539\u5199\u4E3A\u66F4\u6E05\u6670\u3001\u66F4\u7ED3\u6784\u5316\u7684\u9AD8\u8D28\u91CF prompt\uFF1A\u8865\u5145\u7F3A\u5931\u7684\u76EE\u6807\u3001\u7EA6\u675F\u4E0E\u671F\u671B\u8F93\u51FA\u683C\u5F0F\uFF08\u53EF\u4ECE\u4E0A\u4E0B\u6587\u5408\u7406\u63A8\u65AD\uFF09\uFF0C\u4F7F\u7528\u7B80\u6D01\u660E\u786E\u7684\u8BED\u8A00\uFF0C\u53BB\u6389\u5197\u4F59\u3002\u4E0D\u5F97\u7F16\u9020\u8349\u7A3F\u4E2D\u4E0D\u5B58\u5728\u7684\u4E8B\u5B9E\u6216\u6280\u672F\u7EC6\u8282\u3002\u53EA\u8F93\u51FA\u4F18\u5316\u540E\u7684 prompt \u6B63\u6587\uFF0C\u4E0D\u8981\u4EFB\u4F55\u89E3\u91CA\u3001\u524D\u7F00\u6216\u4EE3\u7801\u5757\u5305\u88F9\u3002";
var EN_SYSTEM = "You are a prompt optimization expert. Rewrite the user's draft prompt into a clearer, more structured, high-quality prompt without changing its intent: fill in missing goals, constraints, and expected output format when reasonably inferable, use concise and precise language, and remove redundancy. Do not invent facts or technical details absent from the draft. Output ONLY the optimized prompt text, with no explanations, prefixes, or code fences.";
function buildSystemPrompt(lang) {
  return lang === "zh" ? ZH_SYSTEM : EN_SYSTEM;
}
function buildRequestBody(config, text, lang, stream = false) {
  return {
    model: config.model,
    messages: [
      { role: "system", content: buildSystemPrompt(lang) },
      { role: "user", content: text }
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream
  };
}
function extractResult(raw) {
  let s = raw.trim();
  const fence = /^```[a-zA-Z0-9_+-]*\n([\s\S]*?)\n?```$/;
  const matched = s.match(fence);
  if (matched) s = matched[1].trim();
  return s;
}
var OptimizeError = class extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
    this.name = "OptimizeError";
  }
};
var REQUEST_TIMEOUT_MS = 6e4;
function toErrorKind(e) {
  if (e instanceof OptimizeError) return e;
  const isAbort = typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError" || e instanceof Error && e.name === "AbortError";
  if (isAbort) return new OptimizeError("timeout", "request aborted");
  if (e instanceof TypeError) {
    const m = String(e.message ?? "");
    if (/cors/i.test(m)) return new OptimizeError("cors", m);
    return new OptimizeError("network", m || "network error");
  }
  return new OptimizeError("network", String(e?.message ?? e));
}
function extractSseDelta(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const data = trimmed.slice("data:".length).trim();
  if (data === "[DONE]") return null;
  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  const delta = first?.delta;
  if (typeof delta?.content === "string") return { kind: "content", text: delta.content };
  if (typeof delta?.reasoning_content === "string") return { kind: "reasoning", text: delta.reasoning_content };
  return null;
}
async function optimizeStream(opts) {
  const { config, text, lang, signal, onEvent } = opts;
  const check = checkConfig(config);
  if (!check.ok) throw new OptimizeError("config", check.reason);
  let res;
  try {
    res = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(buildRequestBody(config, text, lang, true)),
      signal
    });
  } catch (e) {
    throw toErrorKind(e);
  }
  if (res.status === 401) throw new OptimizeError("unauthorized", `HTTP 401`);
  if (res.status === 403) throw new OptimizeError("forbidden", `HTTP 403`);
  if (!res.ok) throw new OptimizeError("http", `HTTP ${res.status}`);
  if (!res.body) throw new OptimizeError("bad-response", "missing response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const delta = extractSseDelta(line);
        if (delta !== null) {
          onEvent?.(delta);
          if (delta.kind === "content") full += delta.text;
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
  if (buffer.trim()) {
    const delta = extractSseDelta(buffer);
    if (delta !== null) {
      onEvent?.(delta);
      if (delta.kind === "content") full += delta.text;
    }
  }
  const content = extractResult(full);
  if (!content.trim()) throw new OptimizeError("empty", "empty completion");
  return content;
}
async function resolveSessionModel(api, payload = {}, signal) {
  try {
    const res = await api?.sessions?.models?.(payload, signal);
    const m = res?.current?.model;
    return typeof m === "string" && m.trim() ? m.trim() : null;
  } catch {
    return null;
  }
}

// src/locales.ts
var NS = "prompt_optimizer";
var zh = {
  "button.aria": "\u4F18\u5316 prompt",
  "card.title": "\u4F18\u5316\u7ED3\u679C",
  "card.replace": "\u66FF\u6362\u8349\u7A3F",
  "card.copy": "\u590D\u5236",
  "card.copyDone": "\u5DF2\u590D\u5236",
  "card.retry": "\u91CD\u65B0\u4F18\u5316",
  "card.dismiss": "\u653E\u5F03",
  "card.optimizing": "\u6B63\u5728\u4F18\u5316\u2026",
  "card.configured.hint": "\u5DF2\u914D\u7F6E \xB7 \u6A21\u578B {model}",
  "card.unconfigured.hint": "\u672A\u914D\u7F6E API",
  "guide.title": "\u8BF7\u5148\u914D\u7F6E API",
  "guide.desc": "\u524D\u5F80 \u8BBE\u7F6E \u2192 \u901A\u7528\u8BBE\u7F6E \u2192 Prompt \u4F18\u5316\uFF0C\u586B\u5199\u63A5\u53E3\u5730\u5740\u3001API Key \u4E0E\u6A21\u578B\u540D\u3002",
  "guide.action": "\u53BB\u8BBE\u7F6E",
  "guide.dismiss": "\u77E5\u9053\u4E86",
  "error.unauthorized": "API Key \u65E0\u6548\u6216\u5DF2\u8FC7\u671F",
  "error.forbidden": "\u670D\u52A1\u62D2\u7EDD\u8BBF\u95EE\uFF08403\uFF09",
  "error.timeout": "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u4E0E\u63A5\u53E3\u5730\u5740",
  "error.network": "\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u4E0E\u63A5\u53E3\u5730\u5740",
  "error.cors": "\u63A5\u53E3\u4E0D\u652F\u6301\u8DE8\u57DF\uFF0C\u8BF7\u6362\u7528\u652F\u6301 CORS \u7684\u7F51\u5173",
  "error.http": "\u8BF7\u6C42\u5931\u8D25\uFF08HTTP \u9519\u8BEF\uFF09",
  "error.bad-response": "\u8FD4\u56DE\u5185\u5BB9\u683C\u5F0F\u5F02\u5E38",
  "error.empty": "\u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8BF7\u91CD\u8BD5",
  "error.config": "\u914D\u7F6E\u4E0D\u5B8C\u6574\uFF0C\u8BF7\u5230\u8BBE\u7F6E\u4E2D\u68C0\u67E5",
  "settings.title": "Prompt \u4F18\u5316",
  "settings.desc": "\u914D\u7F6E\u6DA6\u8272\u63A5\u53E3\uFF08OpenAI \u517C\u5BB9\uFF09\uFF1BKey \u660E\u6587\u4FDD\u5B58\u5728\u672C\u5730",
  "settings.baseUrl": "\u63A5\u53E3\u5730\u5740",
  "settings.apiKey": "API Key",
  "settings.model": "\u6A21\u578B\u540D",
  "settings.useSessionModel": "\u4F7F\u7528\u5F53\u524D\u4F1A\u8BDD\u6A21\u578B",
  "settings.useSessionModelHint": "\u5F00\u542F\u65F6\u4F18\u5316\u8BF7\u6C42\u8DDF\u968F\u4F1A\u8BDD\u6A21\u578B\uFF1B\u5173\u95ED\u540E\u4F7F\u7528\u4E0B\u65B9\u81EA\u5B9A\u4E49\u6A21\u578B\u540D",
  "settings.sessionModelEnabled": "\u5DF2\u9009\u62E9\u4F1A\u8BDD\u9ED8\u8BA4\u6A21\u578B",
  "settings.save": "\u4FDD\u5B58",
  "settings.reset": "\u6062\u590D\u9ED8\u8BA4",
  "settings.saved": "\u5DF2\u4FDD\u5B58",
  "settings.saveFailed": "\u4FDD\u5B58\u5931\u8D25",
  "settings.resetFailed": "\u91CD\u7F6E\u5931\u8D25"
};
var en = {
  "button.aria": "Optimize prompt",
  "card.title": "Optimized prompt",
  "card.replace": "Use draft",
  "card.copy": "Copy",
  "card.copyDone": "Copied",
  "card.retry": "Retry",
  "card.dismiss": "Dismiss",
  "card.optimizing": "Optimizing\u2026",
  "card.configured.hint": "Configured \xB7 model {model}",
  "card.unconfigured.hint": "No API configured",
  "guide.title": "Configure the API first",
  "guide.desc": "Go to Settings \u2192 General \u2192 Prompt Optimizer and fill in the endpoint, API key, and model.",
  "guide.action": "Go to settings",
  "guide.dismiss": "Got it",
  "error.unauthorized": "API key is invalid or expired",
  "error.forbidden": "Access forbidden (403)",
  "error.timeout": "Request timed out; check your network and endpoint",
  "error.network": "Network error; check your network and endpoint",
  "error.cors": "Endpoint blocks CORS; use a gateway that allows it",
  "error.http": "Request failed (HTTP error)",
  "error.bad-response": "Unexpected response format",
  "error.empty": "Empty result; please retry",
  "error.config": "Incomplete configuration; check settings",
  "settings.title": "Prompt Optimizer",
  "settings.desc": "Configure the rewrite endpoint (OpenAI-compatible); key is stored locally in plain text",
  "settings.baseUrl": "Base URL",
  "settings.apiKey": "API Key",
  "settings.model": "Model",
  "settings.useSessionModel": "Use current session model",
  "settings.useSessionModelHint": "When on, optimization requests follow the session model; when off, the custom model below is used",
  "settings.sessionModelEnabled": "Session default model selected",
  "settings.save": "Save",
  "settings.reset": "Reset to defaults",
  "settings.saved": "Saved",
  "settings.saveFailed": "Save failed",
  "settings.resetFailed": "Reset failed"
};
function langOf(active) {
  return typeof active === "string" && active.toLowerCase().startsWith("zh") ? "zh" : "en";
}

// src/events.ts
var optimizeRequestListeners = /* @__PURE__ */ new Set();
function onOptimizeRequest(fn) {
  optimizeRequestListeners.add(fn);
  return () => optimizeRequestListeners.delete(fn);
}
function emitOptimizeRequest() {
  for (const fn of optimizeRequestListeners) fn();
}
var openSettingsListeners = /* @__PURE__ */ new Set();
function onOpenSettingsRequest(fn) {
  openSettingsListeners.add(fn);
  return () => openSettingsListeners.delete(fn);
}
function emitOpenSettingsRequest() {
  for (const fn of openSettingsListeners) fn();
}

// src/OptimizeButton.tsx
var import_react = __toESM(require("react"), 1);

// src/session-optimizer.ts
function collectTexts(data, out, skipRoleUser) {
  if (!data || typeof data !== "object") return;
  if (data.role === "user" && skipRoleUser) return;
  if (typeof data.type === "string" && data.type !== "user" && typeof data.text === "string" && data.text.length > 0) {
    out.push(data.text);
    return;
  }
  if (Array.isArray(data.content)) {
    for (const part of data.content) collectTexts(part, out, skipRoleUser);
  }
}
function foldSessionText(events) {
  const empty = { text: "", completed: false };
  if (!Array.isArray(events)) return empty;
  const sorted = events.map((entry) => entry && typeof entry === "object" ? entry.event : void 0).filter((e) => !!e && typeof e === "object");
  sorted.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const texts = [];
  let completed = false;
  let fallback = "";
  for (const ev of sorted) {
    const type = typeof ev.type === "string" ? ev.type : "";
    if (type.includes("user") && !type.includes("assistant")) continue;
    if (type === "assistant/chunk") {
      const chunk = ev.data?.chunk;
      if (chunk && chunk.type === "delta" && chunk.blockType === "text" && typeof chunk.text === "string" && chunk.text) {
        texts.push(chunk.text);
      }
      continue;
    }
    if (type === "assistant/message") {
      completed = true;
      const message = ev.data?.message;
      if (message && typeof message === "object") {
        const buf = [];
        collectTexts(message, buf, false);
        fallback += buf.join("");
      }
      continue;
    }
  }
  const text = completed ? fallback || texts.join("") : texts.join("");
  return { text, completed };
}
function prefixDelta(prev, next) {
  const n = Math.min(prev.length, next.length);
  let i = 0;
  while (i < n && prev.charCodeAt(i) === next.charCodeAt(i)) i += 1;
  return next.slice(i);
}
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}
var DEFAULT_INTERVAL_MS = 400;
var DEFAULT_TIMEOUT_MS = 12e4;
var DEFAULT_SETTLE_ROUNDS = 3;
var DEFAULT_RPC_TIMEOUT_MS = 5e3;
async function runHostOptimize(opts) {
  const { api, parentSessionId, sessionId, lang, text, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const settleRounds = opts.settleRounds ?? DEFAULT_SETTLE_ROUNDS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error("aborted");
  try {
    await withTimeout(api.create?.({ sessionId }) ?? Promise.resolve(), rpcTimeoutMs, "create");
  } catch {
  }
  try {
    const parent = await withTimeout(api.models?.({ sessionId: parentSessionId }) ?? Promise.resolve(), rpcTimeoutMs, "models");
    if (parent?.current?.model) {
      await withTimeout(
        api.selectModel?.({
          sessionId,
          provider: parent.current.provider ?? "deepseek-official",
          model: parent.current.model
        }) ?? Promise.resolve(),
        rpcTimeoutMs,
        "selectModel"
      );
    }
  } catch {
  }
  const system = buildSystemPrompt(lang);
  const content = `${system}

${text}`;
  await withTimeout(
    api.prompt?.({ sessionId, mode: "queue", content: [{ type: "text", text: content }] }) ?? Promise.resolve(),
    rpcTimeoutMs,
    "prompt"
  );
  const started = Date.now();
  let lastText = "";
  let idleRounds = 0;
  for (; ; ) {
    if (signal.aborted) {
      try {
        await api.cancel?.({ sessionId });
      } catch {
      }
      throw new Error("aborted");
    }
    if (Date.now() - started > timeoutMs) {
      try {
        await api.cancel?.({ sessionId });
      } catch {
      }
      throw new Error("timeout");
    }
    let fold = { text: "", completed: false };
    try {
      const page = await api.history?.({ sessionId });
      fold = foldSessionText(page?.events);
    } catch {
    }
    if (fold.completed) {
      if (fold.text !== lastText && fold.text) onDelta(fold.text);
      return fold.text;
    }
    if (fold.text !== lastText) {
      idleRounds = 0;
      const delta = prefixDelta(lastText, fold.text);
      lastText = fold.text;
      if (delta) onDelta(lastText);
    } else {
      idleRounds += 1;
      if (idleRounds >= settleRounds) break;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return lastText;
}

// src/preview-state.ts
var INITIAL_PREVIEW = {
  status: "idle",
  result: "",
  errorKind: null,
  generation: 0,
  draft: "",
  sessionId: null
};
function reducePreview(state2, action) {
  switch (action.type) {
    case "begin":
      if (state2.status === "optimizing") return state2;
      return {
        ...state2,
        status: "optimizing",
        errorKind: null,
        draft: "",
        sessionId: action.sessionId ?? null,
        generation: state2.generation + 1
      };
    case "show":
      return state2.status === "optimizing" ? { ...state2, status: "preview", result: action.result, draft: "" } : state2;
    case "fail":
      return state2.status === "optimizing" ? { ...state2, status: "error", errorKind: action.kind } : state2;
    case "guide":
      return state2.status === "optimizing" ? state2 : { ...state2, status: "guide" };
    case "close":
      return INITIAL_PREVIEW;
    case "draft":
      return state2.status === "optimizing" ? { ...state2, draft: action.text } : state2;
    default:
      return state2;
  }
}

// src/preview-bus.ts
var state = { ...INITIAL_PREVIEW };
var listeners = /* @__PURE__ */ new Set();
function getPreviewBusState() {
  return state;
}
function dispatchPreview(action) {
  state = reducePreview(state, action);
  for (const listener of listeners) listener();
}
function subscribePreviewBus(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// src/optimizer-store.ts
var activeController = null;
var activeSessionId = null;
function closePreview() {
  if (activeController !== null) {
    activeController.abort();
    activeController = null;
  }
  activeSessionId = null;
  dispatchPreview({ type: "close" });
}
async function runOptimize(ctx) {
  const config = ctx.getConfig();
  const draft = ctx.getDraft().trim();
  if (!draft) return;
  const sessionId = ctx.getSessionId?.() ?? null;
  if (activeController !== null) {
    if (sessionId === activeSessionId) return;
    activeController.abort();
    activeController = null;
    activeSessionId = null;
  }
  dispatchPreview({ type: "begin", sessionId });
  const controller = new AbortController();
  activeController = controller;
  activeSessionId = sessionId;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    if (config.useSessionModel && ctx.host) {
      await runHostOptimize({
        api: ctx.host.api,
        parentSessionId: ctx.host.parentSessionId,
        sessionId: ctx.host.sessionId,
        lang: ctx.getLang(),
        text: draft,
        signal: controller.signal,
        onDelta: (text) => dispatchPreview({ type: "draft", text })
      }).then(
        (finalText) => dispatchPreview({ type: "show", result: finalText }),
        (e) => {
          const isAbort = e instanceof DOMException && e.name === "AbortError" || typeof e?.name === "string" && e.name === "AbortError";
          if (isAbort) {
            if (timedOut) dispatchPreview({ type: "fail", kind: "timeout" });
            return;
          }
          dispatchPreview({ type: "fail", kind: toErrorKind(e).kind });
        }
      );
      return;
    }
    if (!checkConfig(config).ok) {
      dispatchPreview({ type: "guide" });
      return;
    }
    let model = config.model;
    if (config.useSessionModel) {
      const sessionModel = await ctx.getSessionModel?.();
      if (sessionModel) model = sessionModel;
    }
    const effective = { ...config, model };
    let reasoning = "";
    let content = "";
    let shown = "";
    try {
      const result = await optimizeStream({
        config: effective,
        text: draft,
        lang: ctx.getLang(),
        signal: controller.signal,
        onEvent: (delta) => {
          if (delta.kind === "content") {
            content += delta.text;
            shown = content;
          } else {
            reasoning += delta.text;
            shown = reasoning;
          }
          dispatchPreview({ type: "draft", text: shown });
        }
      });
      dispatchPreview({ type: "show", result });
    } catch (e) {
      const isAbort = e instanceof DOMException && e.name === "AbortError" || typeof e?.name === "string" && e.name === "AbortError";
      if (isAbort) {
        if (timedOut) dispatchPreview({ type: "fail", kind: "timeout" });
        return;
      }
      dispatchPreview({ type: "fail", kind: toErrorKind(e).kind });
    }
  } catch (e) {
    dispatchPreview({ type: "fail", kind: toErrorKind(e).kind });
  } finally {
    if (activeController === controller) {
      activeController = null;
      activeSessionId = null;
    }
    clearTimeout(timer);
  }
}

// src/OptimizeButton.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var CSS_ID = "dsh-prompt-optimizer/button.css";
function injectCss() {
  if (typeof document === "undefined" || document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = CSS_ID;
  style.textContent = `
.dsh-po-btn {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.85;
  border-radius: 6px;
}
.dsh-po-btn:hover:not(:disabled) {
  opacity: 1;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.12));
}
.dsh-po-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
`;
  document.head.appendChild(style);
}
function readDraft() {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement) return active.value;
  const all = document.querySelectorAll("textarea");
  for (const ta of all) {
    if (ta.value.trim()) return ta.value;
  }
  return "";
}
function OptimizeButton(props) {
  const { t, getConfig, getLang, getSessionModel, getHost, getSessionId } = props;
  const busyFor = () => {
    const st = getPreviewBusState();
    if (st.status !== "optimizing") return false;
    const sid = getSessionId?.();
    return st.sessionId === null || st.sessionId === sid;
  };
  const [busy, setBusy] = (0, import_react.useState)(busyFor);
  (0, import_react.useEffect)(
    () => subscribePreviewBus(() => setBusy(busyFor())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const draftRef = import_react.default.useRef("");
  const syncDraft = import_react.default.useCallback(() => {
    draftRef.current = readDraft();
  }, []);
  (0, import_react.useEffect)(() => injectCss(), []);
  const handleClick = (0, import_react.useCallback)(() => {
    if (busy) return;
    const draft = draftRef.current || readDraft();
    if (!draft.trim()) return;
    void runOptimize({
      getConfig,
      getLang,
      getDraft: () => draft,
      getSessionModel,
      getHost,
      getSessionId
    });
  }, [busy, getConfig, getLang]);
  (0, import_react.useEffect)(() => onOptimizeRequest(handleClick), [handleClick]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: "dsh-po-btn",
      "aria-label": t("button.aria"),
      title: t("button.aria"),
      "aria-busy": busy,
      disabled: busy,
      "data-busy": busy,
      onMouseDown: syncDraft,
      onFocus: syncDraft,
      onClick: handleClick,
      children: busy ? "\u23F3" : "\u2728"
    }
  );
}

// src/PreviewCard.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var CSS_ID2 = "dsh-prompt-optimizer/card.css";
function injectCss2() {
  if (typeof document === "undefined" || document.querySelector(`style[data-plugin-css="${CSS_ID2}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = CSS_ID2;
  style.textContent = `
.dsh-po-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(100% + 8px);
  z-index: 40;
  background: var(--dsw-alias-bg-overlay, #fff);
  border: 1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.3));
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  padding: 12px 14px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dsh-po-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--dsw-alias-label-primary, #222);
  font-size: 13px;
  font-weight: 600;
}
.dsh-po-card-body {
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-secondary, #444);
  font-size: 13px;
  line-height: 1.6;
  max-height: 200px;
}
.dsh-po-card-err {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 13px;
}
.dsh-po-card-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dsh-po-card-btn {
  border: 0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: var(--dsw-alias-label-primary, #222);
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
}
.dsh-po-card-btn.primary {
  /* \u5199\u6B7B\u4E3B\u8272\uFF1A--dsw-alias-brand-primary \u5728\u6DF1\u591C\u6A21\u5F0F\u89E3\u6790\u4E3A\u6D45\u8272 \u2192 \u767D\u5E95\u767D\u5B57\u4E0D\u53EF\u8BFB\uFF08\u7528\u6237\u5B9E\u6D4B\uFF09 */
  color: #fff;
  background: #1677ff;
}
`;
  document.head.appendChild(style);
}
function findComposer() {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && !active.disabled) return active;
  const all = document.querySelectorAll("textarea");
  for (const ta of all) {
    if (!ta.disabled) return ta;
  }
  return null;
}
function readComposerText() {
  const ta = findComposer();
  return ta ? ta.value : "";
}
function writeComposerText(text) {
  const ta = findComposer();
  if (!ta) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) {
    setter.call(ta, text);
  } else {
    ta.value = text;
  }
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
}
function errorKey(kind) {
  switch (kind) {
    // kind → locale key；'config' 在 UI 上不可达（runOptimize 先走 guide），AbortError→timeout 由 runOptimize 先行拦截，保留双保险
    case "unauthorized":
    case "forbidden":
    case "timeout":
    case "network":
    case "cors":
    case "http":
    case "bad-response":
    case "empty":
    case "config":
      return `error.${kind}`;
    default:
      return "error.network";
  }
}
function PreviewCard(props) {
  const { t, getConfig, getLang, openSettings, getSessionModel, getHost, getSessionId } = props;
  const [state2, setState] = (0, import_react2.useState)(() => getPreviewBusState());
  (0, import_react2.useEffect)(
    () => subscribePreviewBus(() => setState(getPreviewBusState())),
    []
  );
  (0, import_react2.useEffect)(() => injectCss2(), []);
  const mountedRef = (0, import_react2.useRef)(true);
  (0, import_react2.useEffect)(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (copyTimerRef.current !== null) {
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);
  const { status, result, errorKind } = state2;
  const [copied, setCopied] = (0, import_react2.useState)(false);
  const copyTimerRef = (0, import_react2.useRef)(null);
  if (status !== "idle" && state2.sessionId !== null) {
    const sid = getSessionId?.();
    if (sid !== null && state2.sessionId !== sid) return null;
  }
  if (status === "idle") return null;
  const retry = () => {
    void runOptimize({ getConfig, getLang, getDraft: () => readComposerText(), getSessionModel, getHost, getSessionId });
  };
  const replace = () => {
    writeComposerText(result);
    closePreview();
  };
  const copy = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(result);
      if (!mountedRef.current) return;
      setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 1200);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card", role: "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("card.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => closePreview(), children: "\u2715" })
    ] }),
    status === "guide" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("guide.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("guide.desc") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: () => {
          closePreview();
          openSettings();
        }, children: t("guide.action") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => closePreview(), children: t("guide.dismiss") })
      ] })
    ] }),
    status === "optimizing" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: state2.draft ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { whiteSpace: "pre-wrap" }, children: state2.draft }) : t("card.optimizing") }),
    status === "preview" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: result }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: replace, children: t("card.replace") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => void copy(), children: copied ? t("card.copyDone") : t("card.copy") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: retry, children: t("card.retry") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => closePreview(), children: t("card.dismiss") })
      ] })
    ] }),
    status === "error" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-err", children: t(errorKey(errorKind)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: retry, children: t("card.retry") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => closePreview(), children: t("card.dismiss") })
      ] })
    ] })
  ] });
}

// src/SettingsRow.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var CSS_ID3 = "dsh-prompt-optimizer/settings.css";
function injectCss3() {
  if (typeof document === "undefined" || document.querySelector(`style[data-plugin-css="${CSS_ID3}"]`)) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = CSS_ID3;
  style.textContent = `
.optiSettings {
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.optiSettingsTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.optiSettingsHint {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.optiSettingsForm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.optiSettingsField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.optiSettingsLabel {
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.optiSettingsInput {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  padding: 6px 8px;
  font-size: 13px;
}
.optiSettingsRow {
  display: flex;
  gap: 8px;
  align-items: center;
}
.optiSettingsBtn {
  border: 0;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.14));
  color: var(--dsw-alias-label-primary);
}
.optiSettingsBtn.primary {
  /* \u5199\u6B7B\u4E3B\u8272\uFF1A\u4E3B\u9898\u53D8\u91CF\u5728\u6DF1\u591C\u6A21\u5F0F\u4F1A\u89E3\u6790\u4E3A\u6D45/\u6DF1\u6781\u7AEF\u8272\uFF08\u9ED1\u5E95\u9ED1\u5B57\u3001\u767D\u5E95\u767D\u5B57\u5747\u88AB\u7528\u6237\u5B9E\u6D4B\uFF09\uFF0C
     \u56FA\u5B9A\u54C1\u724C\u84DD + \u767D\u5B57\u4FDD\u8BC1\u4EFB\u4F55\u4E3B\u9898\u53EF\u8BFB */
  color: #fff;
  background: #1677ff;
}
.optiSettingsErr {
  color: var(--dsw-alias-state-error-primary, #d03050);
  font-size: 12px;
}
`;
  document.head.appendChild(style);
}
function SettingsRow(props) {
  const { t, useStore, actions, getConfig, saveConfig, resetConfig, getEpoch } = props;
  const [expanded, setExpanded] = (0, import_react3.useState)(false);
  const [submitRevision, setSubmitRevision] = (0, import_react3.useState)(0);
  const values = useStore((s) => s.values);
  const saved = useStore((s) => s.saved);
  const error = useStore((s) => s.error);
  const [rpcError, setRpcError] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => injectCss3(), []);
  const config = getConfig();
  const modelLabel = config.model ? config.model : "\u2014";
  (0, import_react3.useEffect)(() => {
    actions.seed(
      { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
      submitRevision + getEpoch()
    );
  }, [config.baseUrl, config.apiKey, config.model, getEpoch]);
  (0, import_react3.useEffect)(() => onOpenSettingsRequest(() => setExpanded(true)), []);
  const handleSave = async () => {
    setRpcError(null);
    const errors = actions.validate(values);
    if (errors) {
      actions.fail(Object.values(errors)[0]);
      return;
    }
    try {
      await saveConfig(values);
      setSubmitRevision((r) => r + 1);
      actions.commit(submitRevision + 1 + getEpoch());
    } catch (outer) {
      setRpcError(`${t("settings.saveFailed")}\uFF1A${outer instanceof Error ? outer.message : String(outer)}`);
    }
  };
  const handleReset = async () => {
    setRpcError(null);
    try {
      await resetConfig();
      actions.seed(
        { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model },
        submitRevision + 1 + getEpoch()
      );
      setSubmitRevision((r) => r + 1);
    } catch (outer) {
      setRpcError(`${t("settings.resetFailed")}\uFF1A${outer instanceof Error ? outer.message : String(outer)}`);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettings", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsTitle", onClick: () => setExpanded((v) => !v), style: { cursor: "pointer" }, children: [
      t("settings.title"),
      !expanded && (values.useSessionModel ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", children: [
        " \xB7 ",
        t("settings.sessionModelEnabled")
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", children: [
        " \xB7 ",
        t(values.apiKey ? "card.configured.hint" : "card.unconfigured.hint").replace("{model}", modelLabel)
      ] }))
    ] }),
    expanded && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsForm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "optiSettingsLabel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "input",
            {
              type: "checkbox",
              checked: values.useSessionModel,
              onChange: (e) => actions.edit("useSessionModel", e.target.checked)
            }
          ),
          " ",
          t("settings.useSessionModel")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "optiSettingsHint", children: t("settings.useSessionModelHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "optiSettingsLabel", htmlFor: "opti-base-url", children: t("settings.baseUrl") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "opti-base-url",
            className: "optiSettingsInput",
            value: values.baseUrl,
            placeholder: DEFAULTS.baseUrl,
            disabled: values.useSessionModel,
            onChange: (e) => actions.edit("baseUrl", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "optiSettingsLabel", htmlFor: "opti-api-key", children: t("settings.apiKey") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "opti-api-key",
            className: "optiSettingsInput",
            type: "password",
            value: values.apiKey,
            placeholder: "sk-\u2026",
            autoComplete: "off",
            disabled: values.useSessionModel,
            onChange: (e) => actions.edit("apiKey", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsField", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("label", { className: "optiSettingsLabel", htmlFor: "opti-model", children: t("settings.model") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "opti-model",
            className: "optiSettingsInput",
            value: values.model,
            placeholder: values.useSessionModel ? "\u2014" : DEFAULTS.model,
            disabled: values.useSessionModel,
            onChange: (e) => actions.edit("model", e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "optiSettingsBtn primary", onClick: handleSave, children: t("settings.save") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "optiSettingsBtn", onClick: handleReset, children: t("settings.reset") }),
        saved && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "optiSettingsHint", children: t("settings.saved") }),
        rpcError && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "optiSettingsErr", children: rpcError }),
        !rpcError && error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "optiSettingsErr", children: t(error) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "optiSettingsHint", children: t("settings.desc") })
    ] })
  ] });
}

// src/settings-store.ts
var import_client = require("@deepseek-ai/dsh-client-runtime/client");

// src/settings-form-state.ts
function validateSettingsForm(values) {
  const errors = {};
  const url = values.baseUrl.trim();
  if (!url) {
    errors.baseUrl = "settings.baseUrl";
  } else {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("protocol");
      if (u.search || u.hash) throw new Error("query-or-hash");
    } catch {
      errors.baseUrl = "settings.baseUrl";
    }
  }
  if (!values.apiKey.trim()) errors.apiKey = "settings.apiKey";
  if (!values.useSessionModel && !values.model.trim()) errors.model = "settings.model";
  return errors;
}
var INITIAL_SETTINGS_FORM = {
  values: { baseUrl: "", apiKey: "", model: "", useSessionModel: true },
  dirty: false,
  saved: false,
  error: null,
  revision: -1
};
function reduceSettingsForm(state2, action) {
  switch (action.type) {
    case "seed":
      return action.revision <= state2.revision ? state2 : { ...state2, values: { ...action.values }, dirty: false, saved: false, error: null, revision: action.revision };
    case "edit":
      return { ...state2, values: { ...state2.values, [action.field]: action.value }, dirty: true, saved: false, error: null };
    case "commit":
      return { ...state2, dirty: false, saved: true, error: null, revision: action.revision };
    case "fail":
      return { ...state2, error: action.message };
  }
}

// src/settings-store.ts
var createSettingsFormStore = () => {
  const handle = (0, import_client.defineStore)({
    init: () => ({
      // 每实例副本：INITIAL_SETTINGS_FORM 是只读共享常量，勿跨实例共享引用（reducer 的 draft 写入需受保护）
      ...INITIAL_SETTINGS_FORM,
      values: { ...INITIAL_SETTINGS_FORM.values }
    }),
    actions: {
      seed: (d, values, revision) => Object.assign(d, reduceSettingsForm(d, { type: "seed", values, revision })),
      edit: (d, field, value) => Object.assign(d, reduceSettingsForm(d, { type: "edit", field, value })),
      commit: (d, revision) => Object.assign(d, reduceSettingsForm(d, { type: "commit", revision })),
      fail: (d, message) => Object.assign(d, reduceSettingsForm(d, { type: "fail", message })),
      validate: (_d, values) => {
        const errors = validateSettingsForm(values);
        return Object.keys(errors).length === 0 ? null : errors;
      }
    }
  });
  return handle;
};

// src/index.ts
var inject = ["slots", "sessions", "locale", "connection"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "prompt-optimizer: locale registration");
  let configMirror = mergeConfig(void 0);
  let configEpoch = 0;
  const rpcConfig = async (endpoint, payload) => {
    const result = await ctx.connection.rpc.call("/dsh-prompt-optimizer", endpoint, payload ?? {});
    if (!result.ok) {
      throw new Error(
        `config rpc ${endpoint} failed: ${result.error && (result.error.details || result.error.code) || "rpc failed"}`
      );
    }
    return result.value;
  };
  const loadConfig = async () => {
    try {
      const value = await rpcConfig("get");
      configMirror = mergeConfig(value);
    } catch {
    }
  };
  void loadConfig();
  const getActiveSession = () => {
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.();
    const sessionId = info?.sessionId;
    return typeof sessionId === "string" && sessionId.length > 0 ? sessionId : null;
  };
  const getSessionModel = async () => {
    const sessionId = getActiveSession();
    if (!sessionId) return null;
    return resolveSessionModel(ctx.connection.api, { sessionId });
  };
  const getSessionId = () => getActiveSession();
  const PO_HOST_SESSION_ID = "session-po-optimizer-9f3c2a7e-1b4d-4c8a-9e6f-2a5b7d1c3e9f";
  const hostApi = ctx.connection.api;
  const getHost = () => {
    const parentSessionId = getActiveSession();
    if (!parentSessionId) return null;
    return { api: hostApi, parentSessionId, sessionId: PO_HOST_SESSION_ID };
  };
  let lang = langOf(ctx.locale.getLocale().active);
  ctx.on("locale/change", (snap) => {
    lang = langOf(snap.active);
  });
  ctx.inject(["slots", "sessions"], (scope) => {
    scope.slots.inject(
      "conversation.input.right",
      () => scope.slots.register(
        {
          name: "conversation.input.right",
          id: "prompt-optimizer-button",
          order: 0,
          locale: NS,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            getSessionModel,
            getHost,
            getSessionId
          })
        },
        OptimizeButton
      )
    );
    scope.slots.inject(
      "conversation.input.overlay",
      () => scope.slots.register(
        {
          name: "conversation.input.overlay",
          id: "prompt-optimizer-card",
          order: 10,
          locale: NS,
          inject: () => ({
            getConfig: () => configMirror,
            getLang: () => lang,
            openSettings: () => emitOpenSettingsRequest(),
            getSessionModel,
            getHost,
            getSessionId
          })
        },
        PreviewCard
      )
    );
  });
  const settingsStore = createSettingsFormStore();
  const saveConfig = async (raw) => {
    const merged = mergeConfig({ ...configMirror, ...raw });
    const written = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model,
      useSessionModel: merged.useSessionModel
    };
    try {
      const saved = await rpcConfig("set", {
        patch: {
          baseUrl: written.baseUrl,
          apiKey: written.apiKey,
          model: written.model,
          useSessionModel: written.useSessionModel
        }
      });
      configMirror = mergeConfig(saved);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };
  const resetConfig = async () => {
    try {
      const saved = await rpcConfig("set", {
        patch: {
          baseUrl: DEFAULTS.baseUrl,
          apiKey: DEFAULTS.apiKey,
          model: DEFAULTS.model,
          useSessionModel: true
        }
      });
      configMirror = mergeConfig(saved);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };
  ctx.inject(["slots"], (scope) => {
    scope.slots.inject(
      "settings.general.item",
      () => scope.slots.register(
        {
          name: "settings.general.item",
          id: "prompt-optimizer-settings",
          order: 30,
          locale: NS,
          store: settingsStore,
          inject: () => ({
            getConfig: () => configMirror,
            saveConfig,
            resetConfig,
            getEpoch: () => configEpoch
          })
        },
        SettingsRow
      )
    );
  });
  const onKeydown = (e) => {
    if (!e.altKey || e.code !== "KeyO") return;
    const el = document.activeElement;
    if (!(el instanceof HTMLTextAreaElement)) return;
    e.preventDefault();
    emitOptimizeRequest();
  };
  document.addEventListener("keydown", onKeydown);
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnLCByZXNvbHZlU2Vzc2lvbk1vZGVsIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIGNvbnN0IGdldFNlc3Npb25Nb2RlbCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgICBjb25zdCBzZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiByZXNvbHZlU2Vzc2lvbk1vZGVsKGN0eC5jb25uZWN0aW9uLmFwaSBhcyBuZXZlciwgeyBzZXNzaW9uSWQgfSk7XG4gIH07XG5cbiAgLy8gMi41YiBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTRGMUFcdThCRERcdTdFRDFcdTVCOUFcdUZGMUFcdTUzNjFcdTcyNDdcdTUzRUFcdTU3MjhcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdThENzBcdTRFMERcdThEREZcdTk2OEZcdUZGMDlcbiAgY29uc3QgZ2V0U2Vzc2lvbklkID0gKCk6IHN0cmluZyB8IG51bGwgPT4gZ2V0QWN0aXZlU2Vzc2lvbigpO1xuXG4gIC8vIDIuNiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDhcdTRFMzRcdTY1RjZcdTVCRjlcdThCREQgKyBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMENcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdUZGMUFcbiAgLy8gXHU1M0VGXHU1OTBEXHU3NTI4XHU3Njg0XHU1NkZBXHU1QjlBXHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU2MjdGXHU4RjdEXHU0RjE4XHU1MzE2XHVGRjFCXHU2QTIxXHU1NzhCXHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHVGRjA4c2VsZWN0TW9kZWxcdUZGMDlcdUZGMENcbiAgLy8gXHU3RUQzXHU2NzlDXHU3RUNGIHNlc3Npb24uaGlzdG9yeSBcdThGNkVcdThCRTJcdTU4OUVcdTkxQ0ZcdTU0NDhcdTczQjBcdUZGMDhcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdUZGMDlcbiAgLy8gXHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREIGlkXHVGRjFBXHU1QkJGXHU0RTNCXHU2MzA5IHNlc3Npb24tPHV1aWQ+IFx1N0VBNlx1NUI5QVx1NjgyMVx1OUE4Q1x1RkYwQ1x1NjY2RVx1OTAxQVx1NzdFRCBpZCBcdTRGMUFcdTg4QUIgY3JlYXRlIFx1NjJEMlx1N0VERFx1RkYwOFx1NUI5RVx1NkQ0Qlx1NjVFMFx1NEYxQVx1OEJERCBcdTIxOTIgXHU0RTAwXHU3NkY0XHU3QTdBXHU4RjZFXHU4QkUyXHVGRjA5XG4gIGNvbnN0IFBPX0hPU1RfU0VTU0lPTl9JRCA9ICdzZXNzaW9uLXBvLW9wdGltaXplci05ZjNjMmE3ZS0xYjRkLTRjOGEtOWU2Zi0yYTViN2QxYzNlOWYnO1xuICBjb25zdCBob3N0QXBpID0gKGN0eC5jb25uZWN0aW9uLmFwaSBhcyBuZXZlcikgYXMge1xuICAgIGNyZWF0ZShwOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pOiBQcm9taXNlPHVua25vd24+O1xuICAgIHNlbGVjdE1vZGVsKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmc7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgcHJvbXB0KHA6IHsgc2Vzc2lvbklkOiBzdHJpbmc7IG1vZGU6ICdxdWV1ZSc7IGNvbnRlbnQ6IEFycmF5PHsgdHlwZTogJ3RleHQnOyB0ZXh0OiBzdHJpbmcgfT4gfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgaGlzdG9yeShwOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pOiBQcm9taXNlPHsgZXZlbnRzPzogdW5rbm93biB9PjtcbiAgICBjYW5jZWwocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx1bmtub3duPjtcbiAgICBtb2RlbHMocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbiAgfTtcbiAgY29uc3QgZ2V0SG9zdCA9ICgpOiB7IGFwaTogdHlwZW9mIGhvc3RBcGk7IHBhcmVudFNlc3Npb25JZDogc3RyaW5nOyBzZXNzaW9uSWQ6IHN0cmluZyB9IHwgbnVsbCA9PiB7XG4gICAgY29uc3QgcGFyZW50U2Vzc2lvbklkID0gZ2V0QWN0aXZlU2Vzc2lvbigpO1xuICAgIGlmICghcGFyZW50U2Vzc2lvbklkKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4geyBhcGk6IGhvc3RBcGksIHBhcmVudFNlc3Npb25JZCwgc2Vzc2lvbklkOiBQT19IT1NUX1NFU1NJT05fSUQgfTtcbiAgfTtcblxuICAvLyAzLiBcdThCRURcdThBMDBcdTk1NUNcdTUwQ0ZcbiAgbGV0IGxhbmc6IExhbmcgPSBsYW5nT2YoY3R4LmxvY2FsZS5nZXRMb2NhbGUoKS5hY3RpdmUpO1xuICBjdHgub24oJ2xvY2FsZS9jaGFuZ2UnLCAoc25hcDogeyBhY3RpdmU6IHN0cmluZyB9KSA9PiB7XG4gICAgbGFuZyA9IGxhbmdPZihzbmFwLmFjdGl2ZSk7XG4gIH0pO1xuXG4gIC8vIDQuIFx1NEYxQVx1OEJERFx1NjlGRFx1NEY0RFx1RkYxQVx1NjMwOVx1OTRBRSArIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1xuICBjdHguaW5qZWN0KFsnc2xvdHMnLCAnc2Vzc2lvbnMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItYnV0dG9uJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICAgIGdldEhvc3QsXG4gICAgICAgICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE9wdGltaXplQnV0dG9uLFxuICAgICAgKSxcbiAgICApO1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1jYXJkJyxcbiAgICAgICAgICBvcmRlcjogMTAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBvcGVuU2V0dGluZ3M6ICgpID0+IGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCksXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBQcmV2aWV3Q2FyZCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNi4gXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjA4cm9vdCBcdTRGNUNcdTc1MjhcdTU3REZcdUZGMDlcbiAgY29uc3Qgc2V0dGluZ3NTdG9yZSA9IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlKCk7XG4gIGNvbnN0IHNhdmVDb25maWcgPSBhc3luYyAocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBtZXJnZWQgPSBtZXJnZUNvbmZpZyh7IC4uLmNvbmZpZ01pcnJvciwgLi4ucmF3IH0pO1xuICAgIGNvbnN0IHdyaXR0ZW46IFByb21wdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVcmw6IG1lcmdlZC5iYXNlVXJsLFxuICAgICAgYXBpS2V5OiBtZXJnZWQuYXBpS2V5LnRyaW0oKSxcbiAgICAgIG1vZGVsOiBtZXJnZWQubW9kZWwsXG4gICAgICB1c2VTZXNzaW9uTW9kZWw6IG1lcmdlZC51c2VTZXNzaW9uTW9kZWwsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiB3cml0dGVuLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiB3cml0dGVuLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogd3JpdHRlbi5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHdyaXR0ZW4udXNlU2Vzc2lvbk1vZGVsLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlc2V0Q29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0Jywge1xuICAgICAgICBwYXRjaDoge1xuICAgICAgICAgIGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IERFRkFVTFRTLm1vZGVsLFxuICAgICAgICAgIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuXG4gIGN0eC5pbmplY3QoWydzbG90cyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1zZXR0aW5ncycsXG4gICAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IHNldHRpbmdzU3RvcmUsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBzYXZlQ29uZmlnLFxuICAgICAgICAgICAgcmVzZXRDb25maWcsXG4gICAgICAgICAgICBnZXRFcG9jaDogKCkgPT4gY29uZmlnRXBvY2gsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFNldHRpbmdzUm93LFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA3LiBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMUFBbHQrT1x1RkYwOFx1NzEyNlx1NzBCOVx1NTcyOCB0ZXh0YXJlYSBcdTUxODVcdTY1RjZcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdUZGMDlcbiAgY29uc3Qgb25LZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoIWUuYWx0S2V5IHx8IGUuY29kZSAhPT0gJ0tleU8nKSByZXR1cm47XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIGlmICghKGVsIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZW1pdE9wdGltaXplUmVxdWVzdCgpO1xuICB9O1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKTtcbn1cblxuLy8gXHU1RjE1XHU3NTI4XHU1Qjg4XHU1MzZCXHVGRjFBXHU5MDdGXHU1MTREIHRyZWUtc2hha2UgXHU2Mzg5XHU3QzdCXHU1NzhCXHVGRjA4XHU0RUM1XHU2NTg3XHU2ODYzXHU2MDI3XHVGRjFCXHU2NUUwXHU4RkQwXHU4ODRDXHU2NUY2XHU4ODRDXHU0RTNBXHVGRjA5XG5leHBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfTsiLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTY4MzhcdTVGQzNcdUZGMUFcdTkxNERcdTdGNkVcdTY4MjFcdTlBOENcdTMwMDFPcGVuQUkgXHU1MTdDXHU1QkI5XHU4QzAzXHU3NTI4XHUzMDAxXHU3RUQzXHU2NzlDXHU2M0QwXHU1M0Q2IFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTk2RjYgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb21wdENvbmZpZyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIC8qKiB0cnVlXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjFCZmFsc2VcdUZGMUFcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWwgKi9cbiAgdXNlU2Vzc2lvbk1vZGVsOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstdjQtZmxhc2gnLFxuICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIC8vIFx1NjVFN1x1OUVEOFx1OEJBNFx1OEZDMVx1NzlGQlx1RkYxQVx1OUVEOFx1OEJBNCBiYXNlVXJsIFx1NEUwQlx1NkI4Qlx1NzU1OVx1NzY4NCBkZWVwc2Vlay1jaGF0XHVGRjA4djEgXHU5RUQ4XHU4QkE0XHVGRjA5XHU4OUM2XHU0RTNBXHU2NzJBXHU4QkJFXHU3RjZFXHVGRjBDXHU4NDNEXHU1MjMwXHU2NUIwXHU5RUQ4XHU4QkE0IGRlZXBzZWVrLXY0LWZsYXNoXHVGRjFCXG4gIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1OEZDNyBiYXNlVXJsXHVGRjA4XHU2NjNFXHU1RjBGXHU5MDA5XHU2MkU5XHVGRjA5XHU1MjE5XHU0RkREXHU3NTU5XHU1MzlGXHU2QTIxXHU1NzhCXHU1NDBEXG4gIGNvbnN0IHJhd01vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIGNvbnN0IG1pZ3JhdGVkRGVmYXVsdCA9XG4gICAgcmF3TW9kZWwgPT09ICdkZWVwc2Vlay1jaGF0JyAmJiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpID09PSBERUZBVUxUUy5iYXNlVXJsID8gREVGQVVMVFMubW9kZWwgOiByYXdNb2RlbDtcbiAgY29uc3QgbW9kZWwgPSBtaWdyYXRlZERlZmF1bHQ7XG4gIGNvbnN0IHVzZVNlc3Npb25Nb2RlbCA9IHR5cGVvZiByYXc/LnVzZVNlc3Npb25Nb2RlbCA9PT0gJ2Jvb2xlYW4nID8gcmF3LnVzZVNlc3Npb25Nb2RlbCA6IERFRkFVTFRTLnVzZVNlc3Npb25Nb2RlbDtcbiAgcmV0dXJuIHsgYmFzZVVybDogbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSwgYXBpS2V5LCBtb2RlbCwgdXNlU2Vzc2lvbk1vZGVsIH07XG59XG5cbmV4cG9ydCB0eXBlIENvbmZpZ1Byb2JsZW0gPSAnbWlzc2luZy1rZXknIHwgJ21pc3NpbmctbW9kZWwnIHwgJ2JhZC11cmwnO1xuZXhwb3J0IHR5cGUgQ29uZmlnQ2hlY2sgPSB7IG9rOiB0cnVlOyBjb25maWc6IFByb21wdENvbmZpZyB9IHwgeyBvazogZmFsc2U7IHJlYXNvbjogQ29uZmlnUHJvYmxlbSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb25maWcoY29uZmlnOiBQcm9tcHRDb25maWcpOiBDb25maWdDaGVjayB7XG4gIGlmICghY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1rZXknIH07XG4gIC8vIFx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NjVGNlx1NjVFMFx1OTcwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYxQlx1NEVDNVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NUYwRlx1ODk4MVx1NkM0MiBtb2RlbCBcdTk3NUVcdTdBN0FcbiAgaWYgKCFjb25maWcudXNlU2Vzc2lvbk1vZGVsICYmICFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nLCBzdHJlYW0gPSBmYWxzZSk6IG9iamVjdCB7XG4gIHJldHVybiB7XG4gICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZykgfSxcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB0ZXh0IH0sXG4gICAgXSxcbiAgICB0ZW1wZXJhdHVyZTogMC43LFxuICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgc3RyZWFtLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG5cbi8qKlxuICogU1NFIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQVx1NTE4NVx1NUJCOVx1NjIxNlx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1NzY4NFx1NEUwMFx1NkJCNVx1NjU4N1x1NjcyQ1x1MzAwMlxuICogdjQgXHU3Q0ZCXHU2QTIxXHU1NzhCXHVGRjA4djQtZmxhc2ggXHU3QjQ5XHVGRjA5XHU2RDQxXHU1RjBGXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1IHJlYXNvbmluZ19jb250ZW50XHVGRjA4XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjA5XHVGRjBDXHU5NjhGXHU1NDBFXHU2MjREXHU4RjkzXHU1MUZBXG4gKiBjb250ZW50IFx1NkI2M1x1NjU4N1x1MjAxNFx1MjAxNFx1NEUyNFx1ODAwNVx1OTBGRFx1ODk4MVx1NUI5RVx1NjVGNlx1NTQ0OFx1NzNCMFx1RkYwQ1x1NTQyNlx1NTIxOVx1NjNBOFx1NzQwNlx1NjcxRlx1NTM2MVx1NzI0N1x1NzcwQlx1OEQ3N1x1Njc2NVx1NTBDRlx1MzAwQ1x1OTc1RVx1NkQ0MVx1NUYwRlx1MzAwRFx1RkYwOFx1NUI5RVx1NkQ0QiB+ODAgXHU0RTJBIGNodW5rXG4gKiBcdTUxNjhcdTY2MkYgcmVhc29uaW5nXHVGRjBDXHU2QjYzXHU2NTg3XHU2NzAwXHU1NDBFXHU2MjREXHU1MUZBXHU3M0IwXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCB0eXBlIFNzZURlbHRhID1cbiAgfCB7IGtpbmQ6ICdjb250ZW50JzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6ICdyZWFzb25pbmcnOyB0ZXh0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTRFMDBcdTg4NEMgU1NFIFx1NjU3MFx1NjM2RVx1RkYxQShkYXRhOiB7Li4ufSkgXHUyMTkyIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQlxuICogW0RPTkVdL1x1OTc1RSBkYXRhIFx1ODg0Qy9cdTk3NUUgSlNPTi9cdTY1RTBcdTUxODVcdTVCQjkgZGVsdGEgXHUyMTkyIG51bGxcdTMwMDJcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTc2VEZWx0YShsaW5lOiBzdHJpbmcpOiBTc2VEZWx0YSB8IG51bGwge1xuICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gIGlmICghdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGF0YSA9IHRyaW1tZWQuc2xpY2UoJ2RhdGE6Jy5sZW5ndGgpLnRyaW0oKTtcbiAgaWYgKGRhdGEgPT09ICdbRE9ORV0nKSByZXR1cm4gbnVsbDtcbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IGRlbHRhPzogeyBjb250ZW50PzogdW5rbm93bjsgcmVhc29uaW5nX2NvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgZGVsdGEgPSBmaXJzdD8uZGVsdGE7XG4gIGlmICh0eXBlb2YgZGVsdGE/LmNvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAnY29udGVudCcsIHRleHQ6IGRlbHRhLmNvbnRlbnQgfTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8ucmVhc29uaW5nX2NvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAncmVhc29uaW5nJywgdGV4dDogZGVsdGEucmVhc29uaW5nX2NvbnRlbnQgfTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHVGRjFBXHU5MDEwXHU1NzU3XHU4OUUzXHU2NzkwIFNTRVx1RkYwQ1x1OEZCOVx1NjUzNlx1OEZCOVx1NTZERVx1OEMwMyBvblRleHQoZGVsdGEpXHVGRjFCXHU4RkQ0XHU1NkRFXHU1QjhDXHU2NTc0XHU2QjYzXHU2NTg3XHUzMDAyXG4gKiBcdTc2RjhcdTZCRDRcdTk3NUVcdTZENDFcdTVGMEYgb3B0aW1pemUoKVx1RkYxQVx1OTk5Nlx1NUI1N1x1NjZGNFx1NUZFQlx1MzAwMVx1OTU3Rlx1OEY5M1x1NTFGQVx1NEUwRFx1OTcwMFx1ODk4MVx1N0I0OVx1NUI4Q1x1NjU3NFx1NzUxRlx1NjIxMFx1MjAxNFx1MjAxNFx1NjMwOVx1OTRBRS9cdTUzNjFcdTcyNDdcdTgwRkRcdThGQjlcdTc1MUZcdTYyMTBcdThGQjlcdTY2M0VcdTc5M0FcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplU3RyZWFtKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIG9uRXZlbnQ/OiAoZGVsdGE6IFNzZURlbHRhKSA9PiB2b2lkO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwsIG9uRXZlbnQgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZywgdHJ1ZSkpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuICBpZiAoIXJlcy5ib2R5KSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ21pc3NpbmcgcmVzcG9uc2UgYm9keScpO1xuXG4gIGNvbnN0IHJlYWRlciA9IHJlcy5ib2R5LmdldFJlYWRlcigpO1xuICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGxldCBidWZmZXIgPSAnJztcbiAgbGV0IGZ1bGwgPSAnJztcbiAgdHJ5IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgIGlmIChkb25lKSBicmVhaztcbiAgICAgIGJ1ZmZlciArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci5zcGxpdCgnXFxuJyk7XG4gICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSA/PyAnJztcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShsaW5lKTtcbiAgICAgICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1REYyXHU0RTJEXHU2QjYyL1x1OTFDQVx1NjUzRVx1NjVGNlx1NUZGRFx1NzU2NVxuICAgIH1cbiAgfVxuICAvLyBcdTVDM0VcdTg4NENcdUZGMDhcdTY1RTBcdTYzNjJcdTg4NENcdTdFRDNcdTVDM0VcdTc2ODQgZGF0YSBcdTg4NENcdUZGMDlcbiAgaWYgKGJ1ZmZlci50cmltKCkpIHtcbiAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShidWZmZXIpO1xuICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdFJlc3VsdChmdWxsKTtcbiAgaWYgKCFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHUzMDBDXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDBEXHVGRjFBXHU4QzAzIGNvbm5lY3Rpb24gXHU3Njg0IHNlc3Npb24ubW9kZWxzIFJQQ1x1RkYwQ1x1NTNENiBjdXJyZW50Lm1vZGVsXHUzMDAyXG4gKiBhcGkgXHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjA4XHU0RTBFIERTSCBcdTg5RTNcdTgwMjZcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdUZGMUJcdTRFRkJcdTRGNTVcdTU5MzFcdThEMjVcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNlc3Npb25Nb2RlbChcbiAgYXBpOlxuICAgIHwge1xuICAgICAgICBzZXNzaW9ucz86IHtcbiAgICAgICAgICBtb2RlbHM/OiAocGF5bG9hZD86IHVua25vd24sIHNpZ25hbD86IEFib3J0U2lnbmFsKSA9PiBQcm9taXNlPHsgY3VycmVudD86IHsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQsXG4gIHBheWxvYWQ6IHVua25vd24gPSB7fSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICAvLyBcdTVGQzVcdTk4N0JcdTY0M0FcdTVFMjYgc2Vzc2lvbklkXHVGRjFBc2VydmVyIFx1N0FFRlx1NjMwOSByZXF1ZXN0LnBheWxvYWQuc2Vzc2lvbklkIFx1NjdFNVx1OEJFNVx1NEYxQVx1OEJERFx1NURGMlx1OTAwOVx1NjJFOVx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwQ1xuICAgIC8vIFx1N0YzQVx1NTkzMVx1NjVGNlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1RkYwOGRlZXBzZWVrLXY0LWZsYXNoXHVGRjA5XHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpPy5zZXNzaW9ucz8ubW9kZWxzPy4ocGF5bG9hZCwgc2lnbmFsKTtcbiAgICBjb25zdCBtID0gcmVzPy5jdXJyZW50Py5tb2RlbDtcbiAgICByZXR1cm4gdHlwZW9mIG0gPT09ICdzdHJpbmcnICYmIG0udHJpbSgpID8gbS50cmltKCkgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2M0QyXHU0RUY2XHU2NTg3XHU2ODQ4IFx1MjAxNCBcdTRFMkRcdTgyRjFcdTUzQ0NcdThCRUQgKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgY29uc3QgTlMgPSAncHJvbXB0X29wdGltaXplcic7XG5cbmV4cG9ydCBjb25zdCB6aCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ1x1NEYxOFx1NTMxNiBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdcdTRGMThcdTUzMTZcdTdFRDNcdTY3OUMnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1x1NjZGRlx1NjM2Mlx1ODM0OVx1N0EzRicsXG4gICdjYXJkLmNvcHknOiAnXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnXHU1REYyXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQucmV0cnknOiAnXHU5MUNEXHU2NUIwXHU0RjE4XHU1MzE2JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdcdTY1M0VcdTVGMDMnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdcdTVERjJcdTkxNERcdTdGNkUgXHUwMEI3IFx1NkEyMVx1NTc4QiB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnXHU2NzJBXHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS50aXRsZSc6ICdcdThCRjdcdTUxNDhcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLmRlc2MnOiAnXHU1MjREXHU1RjgwIFx1OEJCRVx1N0Y2RSBcdTIxOTIgXHU5MDFBXHU3NTI4XHU4QkJFXHU3RjZFIFx1MjE5MiBQcm9tcHQgXHU0RjE4XHU1MzE2XHVGRjBDXHU1ODZCXHU1MTk5XHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwXHUzMDAxQVBJIEtleSBcdTRFMEVcdTZBMjFcdTU3OEJcdTU0MERcdTMwMDInLFxuICAnZ3VpZGUuYWN0aW9uJzogJ1x1NTNCQlx1OEJCRVx1N0Y2RScsXG4gICdndWlkZS5kaXNtaXNzJzogJ1x1NzdFNVx1OTA1M1x1NEU4NicsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIEtleSBcdTY1RTBcdTY1NDhcdTYyMTZcdTVERjJcdThGQzdcdTY3MUYnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ1x1NjcwRFx1NTJBMVx1NjJEMlx1N0VERFx1OEJCRlx1OTVFRVx1RkYwODQwM1x1RkYwOScsXG4gICdlcnJvci50aW1lb3V0JzogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ1x1N0Y1MVx1N0VEQ1x1OTUxOVx1OEJFRlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5jb3JzJzogJ1x1NjNBNVx1NTNFM1x1NEUwRFx1NjUyRlx1NjMwMVx1OERFOFx1NTdERlx1RkYwQ1x1OEJGN1x1NjM2Mlx1NzUyOFx1NjUyRlx1NjMwMSBDT1JTIFx1NzY4NFx1N0Y1MVx1NTE3MycsXG4gICdlcnJvci5odHRwJzogJ1x1OEJGN1x1NkM0Mlx1NTkzMVx1OEQyNVx1RkYwOEhUVFAgXHU5NTE5XHU4QkVGXHVGRjA5JyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTY4M0NcdTVGMEZcdTVGMDJcdTVFMzgnLFxuICAnZXJyb3IuZW1wdHknOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU0RTNBXHU3QTdBXHVGRjBDXHU4QkY3XHU5MUNEXHU4QkQ1JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdcdTkxNERcdTdGNkVcdTRFMERcdTVCOENcdTY1NzRcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTY4QzBcdTY3RTUnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IFx1NEYxOFx1NTMxNicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ1x1OTE0RFx1N0Y2RVx1NkRBNlx1ODI3Mlx1NjNBNVx1NTNFM1x1RkYwOE9wZW5BSSBcdTUxN0NcdTVCQjlcdUZGMDlcdUZGMUJLZXkgXHU2NjBFXHU2NTg3XHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU1NzMwJyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ1x1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnXHU1RjAwXHU1NDJGXHU2NUY2XHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU4RERGXHU5NjhGXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCXHU1MTczXHU5NUVEXHU1NDBFXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnXHU1REYyXHU5MDA5XHU2MkU5XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdcdTRGRERcdTVCNThcdTU5MzFcdThEMjUnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnXHU5MUNEXHU3RjZFXHU1OTMxXHU4RDI1JyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgY29uc3QgZW46IExvY2FsZURpY3QgPSB7XG4gICdidXR0b24uYXJpYSc6ICdPcHRpbWl6ZSBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdPcHRpbWl6ZWQgcHJvbXB0JyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdVc2UgZHJhZnQnLFxuICAnY2FyZC5jb3B5JzogJ0NvcHknLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdDb3BpZWQnLFxuICAnY2FyZC5yZXRyeSc6ICdSZXRyeScsXG4gICdjYXJkLmRpc21pc3MnOiAnRGlzbWlzcycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnT3B0aW1pemluZ1x1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdDb25maWd1cmVkIFx1MDBCNyBtb2RlbCB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnTm8gQVBJIGNvbmZpZ3VyZWQnLFxuICAnZ3VpZGUudGl0bGUnOiAnQ29uZmlndXJlIHRoZSBBUEkgZmlyc3QnLFxuICAnZ3VpZGUuZGVzYyc6ICdHbyB0byBTZXR0aW5ncyBcdTIxOTIgR2VuZXJhbCBcdTIxOTIgUHJvbXB0IE9wdGltaXplciBhbmQgZmlsbCBpbiB0aGUgZW5kcG9pbnQsIEFQSSBrZXksIGFuZCBtb2RlbC4nLFxuICAnZ3VpZGUuYWN0aW9uJzogJ0dvIHRvIHNldHRpbmdzJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnR290IGl0JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkga2V5IGlzIGludmFsaWQgb3IgZXhwaXJlZCcsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnQWNjZXNzIGZvcmJpZGRlbiAoNDAzKScsXG4gICdlcnJvci50aW1lb3V0JzogJ1JlcXVlc3QgdGltZWQgb3V0OyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnTmV0d29yayBlcnJvcjsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5jb3JzJzogJ0VuZHBvaW50IGJsb2NrcyBDT1JTOyB1c2UgYSBnYXRld2F5IHRoYXQgYWxsb3dzIGl0JyxcbiAgJ2Vycm9yLmh0dHAnOiAnUmVxdWVzdCBmYWlsZWQgKEhUVFAgZXJyb3IpJyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdVbmV4cGVjdGVkIHJlc3BvbnNlIGZvcm1hdCcsXG4gICdlcnJvci5lbXB0eSc6ICdFbXB0eSByZXN1bHQ7IHBsZWFzZSByZXRyeScsXG4gICdlcnJvci5jb25maWcnOiAnSW5jb21wbGV0ZSBjb25maWd1cmF0aW9uOyBjaGVjayBzZXR0aW5ncycsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgT3B0aW1pemVyJyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnQ29uZmlndXJlIHRoZSByZXdyaXRlIGVuZHBvaW50IChPcGVuQUktY29tcGF0aWJsZSk7IGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBwbGFpbiB0ZXh0JyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnQmFzZSBVUkwnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnTW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1VzZSBjdXJyZW50IHNlc3Npb24gbW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdXaGVuIG9uLCBvcHRpbWl6YXRpb24gcmVxdWVzdHMgZm9sbG93IHRoZSBzZXNzaW9uIG1vZGVsOyB3aGVuIG9mZiwgdGhlIGN1c3RvbSBtb2RlbCBiZWxvdyBpcyB1c2VkJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnU2Vzc2lvbiBkZWZhdWx0IG1vZGVsIHNlbGVjdGVkJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIGdldEhvc3Q/OiAoKSA9PiB7IGFwaTogdW5rbm93bjsgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7IHNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsO1xuICBnZXRTZXNzaW9uSWQ/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjFBXHU0RjE4XHU1MTQ4XHU1M0Q2XHU3MTI2XHU3MEI5IHRleHRhcmVhXHVGRjFCXHU1NDI2XHU1MjE5XHU1NkRFXHU5MDAwXHU1MjMwXHU5ODc1XHU5NzYyXHU0RTJEXHUzMDBDXHU1MDNDXHU5NzVFXHU3QTdBXHUzMDBEXHU3Njg0IHRleHRhcmVhXG4gKiBcdUZGMDhcdTc1MjhcdTYyMzdcdTU3MjhcdThGOTNcdTUxNjVcdTc2ODRcdTUzNzNcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMDlcdTMwMDJcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NzY4NCBpbnB1dCBob29rXHUyMDE0XHUyMDE0XHU1QjlFXHU2RDRCXG4gKiBpbnB1dC5yaWdodCBcdTZFMzJcdTY3RDNcdTY1RjZcdThCRTVcdTY4MDdcdTUxQzYgcHJvcHMgXHU2NzJBXHU2M0QwXHU0RjlCXHVGRjBDXHU3RUM0XHU0RUY2XHU0RjFBXHU1NkUwXHU4QzAzXHU3NTI4IHVuZGVmaW5lZCBob29rXG4gKiBcdTVEMjlcdTZFODNcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdUZGMDhQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4IFx1NEUwRFx1NTNFRlx1ODlDMVx1RkYwOVx1MzAwMlxuICovXG5mdW5jdGlvbiByZWFkRHJhZnQoKTogc3RyaW5nIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHJldHVybiBhY3RpdmUudmFsdWU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKHRhLnZhbHVlLnRyaW0oKSkgcmV0dXJuIHRhLnZhbHVlO1xuICB9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU3RTQxXHU1RkQ5XHU2MDAxXHVGRjFBXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XHVGRjFCXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1MjAxNFx1MjAxNFx1NTIwN1x1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NjMwOVx1OTRBRVx1NEUwRFx1NTE4RCBidXN5XHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHVGRjA5XG4gIGNvbnN0IGJ1c3lGb3IgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSBnZXRQcmV2aWV3QnVzU3RhdGUoKTtcbiAgICBpZiAoc3Quc3RhdHVzICE9PSAnb3B0aW1pemluZycpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzaWQgPSBnZXRTZXNzaW9uSWQ/LigpO1xuICAgIHJldHVybiBzdC5zZXNzaW9uSWQgPT09IG51bGwgfHwgc3Quc2Vzc2lvbklkID09PSBzaWQ7XG4gIH07XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKGJ1c3lGb3IpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRCdXN5KGJ1c3lGb3IoKSkpLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGJ1c3kpIHJldHVybjtcbiAgICBjb25zdCBkcmFmdCA9IGRyYWZ0UmVmLmN1cnJlbnQgfHwgcmVhZERyYWZ0KCk7XG4gICAgaWYgKCFkcmFmdC50cmltKCkpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gZHJhZnQsXG4gICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICBnZXRIb3N0LFxuICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgIH0pO1xuICB9LCBbYnVzeSwgZ2V0Q29uZmlnLCBnZXRMYW5nXSk7XG5cbiAgLy8gQWx0K08gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjA4aW5kZXgudHMgXHU1MTY4XHU1QzQwXHU3NkQxXHU1NDJDXHVGRjA5XHUyMTkyIFx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcHRpbWl6ZVJlcXVlc3QoaGFuZGxlQ2xpY2spLCBbaGFuZGxlQ2xpY2tdKTtcblxuICByZXR1cm4gKFxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPVwiZHNoLXBvLWJ0blwiXG4gICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgdGl0bGU9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICBhcmlhLWJ1c3k9e2J1c3l9XG4gICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgIGRhdGEtYnVzeT17YnVzeX1cbiAgICAgIG9uTW91c2VEb3duPXtzeW5jRHJhZnR9XG4gICAgICBvbkZvY3VzPXtzeW5jRHJhZnR9XG4gICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICA+XG4gICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgPC9idXR0b24+XG4gICk7XG59IiwgIi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RjE4XHU1MzE2XHVGRjA4XHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREICsgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NTZFMFx1NkI2NFx1NzUyOFx1NEUwMFx1NEUyQVx1NTNFRlx1NTkwRFx1NzUyOFx1NzY4NFx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NjI3Rlx1OEY3RFx1NEYxOFx1NTMxNlx1RkYxQVxuICogICBzZXNzaW9uLmNyZWF0ZVx1RkYwOFx1NTZGQVx1NUI5QSBzZXNzaW9uSWRcdUZGMENcdTVFNDJcdTdCNDlcdUZGMDlcdTIxOTIgc2Vzc2lvbi5zZWxlY3RNb2RlbFx1RkYwOFx1N0VFN1x1NjI3Rlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOVxuICogICBcdTIxOTIgc2Vzc2lvbi5wcm9tcHRcdUZGMDhxdWV1ZSBcdTZDRThcdTUxNjVcdTVFMjZcdTg5QzRcdTUyMTlcdTc2ODRcdTY1ODdcdTY3MkNcdUZGMDlcdTIxOTIgXHU4RjZFXHU4QkUyIHNlc3Npb24uaGlzdG9yeSBcdTU4OUVcdTkxQ0ZcdTUzRDZcdTZCNjNcdTY1ODdcdUZGMDhcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdUZGMDlcbiAqICAgXHUyMTkyIGFzc2lzdGFudC9tZXNzYWdlIFx1NEU4Qlx1NEVGNlx1NTFGQVx1NzNCMFx1RkYwOFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOVx1NjIxNlx1OEZERVx1N0VFRFx1NjVFMFx1NTNEOFx1NTMxNlx1RkYwOHNldHRsZVx1RkYwOVx1N0VEM1x1Njc1Rlx1RkYxQlx1NEUyRFx1NkI2Mlx1OEQ3MCBzZXNzaW9uLmNhbmNlbFx1MzAwMlxuICpcbiAqIFx1NEU4Qlx1NEVGNlx1NTk1MVx1N0VBNlx1NEVFNVx1NzcxRlx1NUI5RVx1NjMwMVx1NEU0NVx1NTMxNlx1NjgzN1x1NjcyQ1x1NjgyMVx1NTFDNlx1RkYwOH4vLmRzaC9zZXNzaW9ucyBcdTRFMEJcdTU0MDQgc2Vzc2lvbiBcdTc2RUVcdTVGNTVcdTc2ODQgc2Vzc2lvbi5qc29ubC56c3RkXHVGRjA5XHVGRjFBXG4gKiAgIC0gdXNlciBcdTZEODhcdTYwNkZcdUZGMUF7dHlwZTondXNlci9tZXNzYWdlJywgZGF0YTp7cm9sZTondXNlcicsIGNvbnRlbnQ6W3t0eXBlOid0ZXh0Jyx0ZXh0fV19fVxuICogICAtIFx1NTJBOVx1NjI0Qlx1NkQ0MVx1NUYwRlx1NTg5RVx1OTFDRlx1RkYxQXt0eXBlOidhc3Npc3RhbnQvY2h1bmsnLCBkYXRhOntjaHVuazp7dHlwZTonZGVsdGEnLCBibG9ja1R5cGU6J3RleHQnLCB0ZXh0fX19XG4gKiAgIC0gXHU1MkE5XHU2MjRCXHU2RDg4XHU2MDZGXHU1QjhDXHU2MjEwXHVGRjFBe3R5cGU6J2Fzc2lzdGFudC9tZXNzYWdlJywgZGF0YTp7bWVzc2FnZTp7cm9sZSwgY29udGVudDpbLi4uXX19fVx1RkYwOFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOVxuICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGJ1aWxkU3lzdGVtUHJvbXB0IH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogY29ubmVjdGlvbi5hcGkuc2Vzc2lvbnMgXHU3Njg0XHU2NzAwXHU1QzBGXHU5NzYyXHVGRjA4XHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHUzMDAyICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RTZXNzaW9uQXBpIHtcbiAgY3JlYXRlPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkPzogc3RyaW5nOyB3b3Jrc3BhY2VJZD86IHN0cmluZzsgY3dkPzogc3RyaW5nIH0pID0+IFByb21pc2U8dW5rbm93bj47XG4gIHNlbGVjdE1vZGVsPzogKHBheWxvYWQ6IHtcbiAgICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgICBwcm92aWRlcjogc3RyaW5nO1xuICAgIG1vZGVsOiBzdHJpbmc7XG4gICAgcmVhc29uaW5nRWZmb3J0Pzogc3RyaW5nO1xuICB9KSA9PiBQcm9taXNlPHVua25vd24+O1xuICBwcm9tcHQ/OiAocGF5bG9hZDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgbW9kZTogJ3F1ZXVlJyB8ICdzdGVlcic7IGNvbnRlbnQ6IEFycmF5PHsgdHlwZTogJ3RleHQnOyB0ZXh0OiBzdHJpbmcgfT4gfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgaGlzdG9yeT86IChwYXlsb2FkOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pID0+IFByb21pc2U8eyBldmVudHM/OiBBcnJheTx7IGV2ZW50PzogdW5rbm93biB9PiB9PjtcbiAgY2FuY2VsPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgbW9kZWxzPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0VGV4dEJsb2NrIHtcbiAgdHlwZT86IHN0cmluZztcbiAgdGV4dD86IHN0cmluZztcbiAgcm9sZT86IHN0cmluZztcbiAgY29udGVudD86IEhvc3RUZXh0QmxvY2tbXSB8IHN0cmluZztcbiAgW2s6IHN0cmluZ106IHVua25vd247XG59XG5cbi8qKiBcdTRFQ0VcdTRFOEJcdTRFRjYgZGF0YSBcdTZERjFcdTY0MUNcdTY1MzZcdTk2QzZcdTY1ODdcdTY3MkNcdTU3NTdcdUZGMDhge3R5cGU6J3RleHQnLHRleHR9YFx1RkYwOVx1RkYwQ3VzZXIgXHU0RThCXHU0RUY2XHU2NTc0XHU0RjUzXHU4REYzXHU4RkM3XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFRleHRzKGRhdGE6IEhvc3RUZXh0QmxvY2sgfCB1bmRlZmluZWQgfCBudWxsLCBvdXQ6IHN0cmluZ1tdLCBza2lwUm9sZVVzZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICBpZiAoZGF0YS5yb2xlID09PSAndXNlcicgJiYgc2tpcFJvbGVVc2VyKSByZXR1cm47XG4gIGlmICh0eXBlb2YgZGF0YS50eXBlID09PSAnc3RyaW5nJyAmJiBkYXRhLnR5cGUgIT09ICd1c2VyJyAmJiB0eXBlb2YgZGF0YS50ZXh0ID09PSAnc3RyaW5nJyAmJiBkYXRhLnRleHQubGVuZ3RoID4gMCkge1xuICAgIG91dC5wdXNoKGRhdGEudGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGRhdGEuY29udGVudCkpIHtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgZGF0YS5jb250ZW50KSBjb2xsZWN0VGV4dHMocGFydCBhcyBIb3N0VGV4dEJsb2NrLCBvdXQsIHNraXBSb2xlVXNlcik7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRm9sZCB7XG4gIC8qKiBcdTVERjJcdTY1MzZcdTk2QzZcdTc2ODRcdTUyQTlcdTYyNEJcdTZCNjNcdTY1ODdcdUZGMDhcdTZENDFcdTVGMEYgZGVsdGEgXHU1ODlFXHU5MUNGXHU2MkZDXHU2M0E1XHVGRjFCXHU4MkU1XHU2Q0ExXHU2NzA5IGRlbHRhIFx1NTIxOVx1NzUyOFx1NUI4Q1x1NjIxMFx1NkQ4OFx1NjA2Rlx1NzY4NFx1NTE2OFx1NjU4N1x1NTE1Q1x1NUU5NVx1RkYwOVx1MzAwMiAqL1xuICB0ZXh0OiBzdHJpbmc7XG4gIC8qKiBcdTY2MkZcdTU0MjZcdTUxRkFcdTczQjAgYXNzaXN0YW50L21lc3NhZ2UgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHUzMDAyICovXG4gIGNvbXBsZXRlZDogYm9vbGVhbjtcbn1cblxuLyoqIFx1NjI4QSBoaXN0b3J5IFx1NEU4Qlx1NEVGNlx1NTIxN1x1ODg2OFx1NjI5OFx1NTNFMFx1NEUzQSB7IFx1N0QyRlx1NzlFRlx1NkI2M1x1NjU4NywgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3IH1cdUZGMDhcdTYzMDkgc2VxIFx1N0EzM1x1NUI5QVx1NjM5Mlx1NUU4Rlx1RkYxQlx1OERGM1x1OEZDNyB1c2VyIFx1NEU4Qlx1NEVGNlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvbGRTZXNzaW9uVGV4dChldmVudHM6IEFycmF5PHsgZXZlbnQ/OiB1bmtub3duIH0+IHwgdW5kZWZpbmVkKTogU2Vzc2lvbkZvbGQge1xuICBjb25zdCBlbXB0eTogU2Vzc2lvbkZvbGQgPSB7IHRleHQ6ICcnLCBjb21wbGV0ZWQ6IGZhbHNlIH07XG4gIGlmICghQXJyYXkuaXNBcnJheShldmVudHMpKSByZXR1cm4gZW1wdHk7XG4gIHR5cGUgRXYgPSB7IHR5cGU/OiBzdHJpbmc7IHNlcT86IG51bWJlcjsgZGF0YT86IEhvc3RUZXh0QmxvY2sgfTtcbiAgY29uc3Qgc29ydGVkOiBFdltdID0gZXZlbnRzXG4gICAgLm1hcCgoZW50cnkpID0+IChlbnRyeSAmJiB0eXBlb2YgZW50cnkgPT09ICdvYmplY3QnID8gKChlbnRyeSBhcyB7IGV2ZW50PzogdW5rbm93biB9KS5ldmVudCBhcyBFdikgOiB1bmRlZmluZWQpKVxuICAgIC5maWx0ZXIoKGUpOiBlIGlzIEV2ID0+ICEhZSAmJiB0eXBlb2YgZSA9PT0gJ29iamVjdCcpO1xuICBzb3J0ZWQuc29ydCgoYSwgYikgPT4gKGEuc2VxID8/IDApIC0gKGIuc2VxID8/IDApKTtcbiAgY29uc3QgdGV4dHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjb21wbGV0ZWQgPSBmYWxzZTtcbiAgbGV0IGZhbGxiYWNrID0gJyc7XG4gIGZvciAoY29uc3QgZXYgb2Ygc29ydGVkKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBldi50eXBlID09PSAnc3RyaW5nJyA/IGV2LnR5cGUgOiAnJztcbiAgICBpZiAodHlwZS5pbmNsdWRlcygndXNlcicpICYmICF0eXBlLmluY2x1ZGVzKCdhc3Npc3RhbnQnKSkgY29udGludWU7XG4gICAgaWYgKHR5cGUgPT09ICdhc3Npc3RhbnQvY2h1bmsnKSB7XG4gICAgICAvLyBcdTZENDFcdTVGMEZcdTU4OUVcdTkxQ0ZcdUZGMUFkYXRhLmNodW5rID0geyB0eXBlOidkZWx0YScsIGJsb2NrVHlwZTondGV4dCcsIHRleHQgfVxuICAgICAgY29uc3QgY2h1bmsgPSAoZXYuZGF0YSBhcyB7IGNodW5rPzogSG9zdFRleHRCbG9jayB9IHwgdW5kZWZpbmVkKT8uY2h1bms7XG4gICAgICBpZiAoY2h1bmsgJiYgY2h1bmsudHlwZSA9PT0gJ2RlbHRhJyAmJiBjaHVuay5ibG9ja1R5cGUgPT09ICd0ZXh0JyAmJiB0eXBlb2YgY2h1bmsudGV4dCA9PT0gJ3N0cmluZycgJiYgY2h1bmsudGV4dCkge1xuICAgICAgICB0ZXh0cy5wdXNoKGNodW5rLnRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnYXNzaXN0YW50L21lc3NhZ2UnKSB7XG4gICAgICAvLyBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMUJcdTZEODhcdTYwNkZcdTUxNjhcdTY1ODdcdTRGNUNcdTRFM0EgZGVsdGEgXHU3RjNBXHU1OTMxXHU2NUY2XHU3Njg0XHU1MTVDXHU1RTk1XHVGRjA4XHU5MDdGXHU1MTREXHU0RTBFXHU1ODlFXHU5MUNGXHU5MUNEXHU1OTBEXHVGRjBDXHU0RUM1XHU2NUUwIGRlbHRhIFx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYwOVxuICAgICAgY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAoZXYuZGF0YSBhcyB7IG1lc3NhZ2U/OiBIb3N0VGV4dEJsb2NrIH0gfCB1bmRlZmluZWQpPy5tZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UgJiYgdHlwZW9mIG1lc3NhZ2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29sbGVjdFRleHRzKG1lc3NhZ2UsIGJ1ZiwgZmFsc2UpO1xuICAgICAgICBmYWxsYmFjayArPSBidWYuam9pbignJyk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU2NUY2XHU0RjE4XHU1MTQ4XHU1QjhDXHU2NTc0XHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHVGRjA4XHU2RDQxXHU1RjBGXHU1ODlFXHU5MUNGXHU4RjZFXHU4QkUyXHU1RkVCXHU3MTY3XHU1M0VGXHU4MEZEXHU2NzJBXHU1MjMwXHU2NzAwXHU3RUM4IGRlbHRhXHVGRjBDXHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHU2NkY0XHU1QjhDXHU2NTc0XHVGRjA5XG4gIGNvbnN0IHRleHQgPSBjb21wbGV0ZWQgPyBmYWxsYmFjayB8fCB0ZXh0cy5qb2luKCcnKSA6IHRleHRzLmpvaW4oJycpO1xuICByZXR1cm4geyB0ZXh0LCBjb21wbGV0ZWQgfTtcbn1cblxuLyoqIFx1N0QyRlx1NzlFRlx1NjU4N1x1NjcyQ1x1NjMwOVx1NUI1N1x1N0IyNlx1NTI0RFx1N0YwMFx1OEJBMVx1N0I5N1x1NTg5RVx1OTFDRlx1RkYwOFx1OEY2RVx1OEJFMlx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1NzUyOFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpeERlbHRhKHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbiA9IE1hdGgubWluKHByZXYubGVuZ3RoLCBuZXh0Lmxlbmd0aCk7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBuICYmIHByZXYuY2hhckNvZGVBdChpKSA9PT0gbmV4dC5jaGFyQ29kZUF0KGkpKSBpICs9IDE7XG4gIHJldHVybiBuZXh0LnNsaWNlKGkpO1xufVxuXG4vKiogXHU3RUQ5XHU2MzAyXHU4RDc3XHU3Njg0IFJQQyBcdThDMDNcdTc1MjhcdTUyQTBcdThEODVcdTY1RjZcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRFRkJcdTRGNTVcdTRFMDBcdTZCNjVcdTkwRkRcdTRFMERcdTUxNDFcdThCQjhcdTY1RTBcdTk2NTBcdTk2M0JcdTU4NUUgXHUyMTkyXHUzMDBDXHU0RTAwXHU3NkY0XHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKGAke2xhYmVsfS10aW1lb3V0YCkpLCBtcyk7XG4gICAgcHJvbWlzZS50aGVuKFxuICAgICAgKHYpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0sXG4gICAgICAoZSkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMge1xuICBhcGk6IEhvc3RTZXNzaW9uQXBpO1xuICAvKiogXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHVGRjA4XHU2QTIxXHU1NzhCXHU2NzY1XHU2RTkwXHVGRjA5XHUzMDAyICovXG4gIHBhcmVudFNlc3Npb25JZDogc3RyaW5nO1xuICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgdGV4dDogc3RyaW5nO1xuICBzaWduYWw6IEFib3J0U2lnbmFsO1xuICBvbkRlbHRhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBpbnRlcnZhbE1zPzogbnVtYmVyO1xuICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gIC8qKiBcdTY1RTBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdTY1RjZcdUZGMENcdTY1ODdcdTY3MkNcdTRFMERcdTUxOERcdTU4OUVcdTk1N0YgTiBcdThGNkVcdTU0MEVcdTg5QzZcdTRFM0FcdTVCOENcdTYyMTBcdUZGMDhcdTU5NTFcdTdFQTZcdTUxNUNcdTVFOTVcdUZGMDlcdTMwMDIgKi9cbiAgc2V0dGxlUm91bmRzPzogbnVtYmVyO1xuICAvKiogXHU1MzU1XHU2QjY1IFJQQyBcdTYzMDJcdThENzdcdTRFMEFcdTk2NTBcdUZGMDhcdTlFRDhcdThCQTQgNXNcdUZGMDlcdTMwMDIgKi9cbiAgcnBjVGltZW91dE1zPzogbnVtYmVyO1xufVxuXG5jb25zdCBERUZBVUxUX0lOVEVSVkFMX01TID0gNDAwO1xuY29uc3QgREVGQVVMVF9USU1FT1VUX01TID0gMTIwXzAwMDtcbmNvbnN0IERFRkFVTFRfU0VUVExFX1JPVU5EUyA9IDM7XG5jb25zdCBERUZBVUxUX1JQQ19USU1FT1VUX01TID0gNV8wMDA7XG5cbi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU1MTY4XHU2RDQxXHU3QTBCXHVGRjFBXHU1MjFCXHU1RUZBL1x1NTkwRFx1NzUyOFx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERCBcdTIxOTIgXHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCIFx1MjE5MiBcdTZDRThcdTUxNjVcdTRGMThcdTUzMTYgcHJvbXB0XG4gKiBcdTIxOTIgXHU4RjZFXHU4QkUyIGhpc3RvcnkgXHU3NkY0XHU4MUYzIGFzc2lzdGFudC9tZXNzYWdlIFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOFx1NjIxNiBzZXR0bGUgLyBhYm9ydCAvIFx1OEQ4NVx1NjVGNlx1RkYwOVx1MzAwMlx1OEZENFx1NTZERVx1NjcwMFx1N0VDOFx1NkI2M1x1NjU4N1x1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSG9zdE9wdGltaXplKG9wdHM6IFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGFwaSwgcGFyZW50U2Vzc2lvbklkLCBzZXNzaW9uSWQsIGxhbmcsIHRleHQsIHNpZ25hbCwgb25EZWx0YSB9ID0gb3B0cztcbiAgY29uc3QgaW50ZXJ2YWxNcyA9IG9wdHMuaW50ZXJ2YWxNcyA/PyBERUZBVUxUX0lOVEVSVkFMX01TO1xuICBjb25zdCB0aW1lb3V0TXMgPSBvcHRzLnRpbWVvdXRNcyA/PyBERUZBVUxUX1RJTUVPVVRfTVM7XG4gIGNvbnN0IHNldHRsZVJvdW5kcyA9IG9wdHMuc2V0dGxlUm91bmRzID8/IERFRkFVTFRfU0VUVExFX1JPVU5EUztcbiAgY29uc3QgcnBjVGltZW91dE1zID0gb3B0cy5ycGNUaW1lb3V0TXMgPz8gREVGQVVMVF9SUENfVElNRU9VVF9NUztcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcblxuICAvLyAxLiBcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdUZGMDhcdTVFNDJcdTdCNDlcdUZGMUFcdTVERjJcdTVCNThcdTU3MjhcdTUyMTlcdTVGRkRcdTc1NjVcdTU5MzFcdThEMjVcdUZGMDlcbiAgdHJ5IHtcbiAgICBhd2FpdCB3aXRoVGltZW91dChhcGkuY3JlYXRlPy4oeyBzZXNzaW9uSWQgfSkgPz8gUHJvbWlzZS5yZXNvbHZlKCksIHJwY1RpbWVvdXRNcywgJ2NyZWF0ZScpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBcdTVERjJcdTVCNThcdTU3MjhcdUZGMDhcdTU5MERcdTc1MjhcdUZGMDlcdTYyMTZcdTVCQkZcdTRFM0JcdTY2ODJcdTRFMERcdTUxNDFcdThCQjhcdTIwMTRcdTIwMTRcdTdFRTdcdTdFRURcdUZGMENoaXN0b3J5IFx1NEYxQVx1NTQ0QVx1OEJDOVx1NjIxMVx1NEVFQ1x1ODBGRFx1NEUwRFx1ODBGRFx1NzUyOFxuICB9XG5cbiAgLy8gMi4gXHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjA4cHJvdmlkZXIgKyBtb2RlbFx1RkYwOVxuICB0cnkge1xuICAgIGNvbnN0IHBhcmVudCA9IGF3YWl0IHdpdGhUaW1lb3V0KGFwaS5tb2RlbHM/Lih7IHNlc3Npb25JZDogcGFyZW50U2Vzc2lvbklkIH0pID8/IFByb21pc2UucmVzb2x2ZSgpLCBycGNUaW1lb3V0TXMsICdtb2RlbHMnKTtcbiAgICBpZiAocGFyZW50Py5jdXJyZW50Py5tb2RlbCkge1xuICAgICAgYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgICAgIGFwaS5zZWxlY3RNb2RlbD8uKHtcbiAgICAgICAgICBzZXNzaW9uSWQsXG4gICAgICAgICAgcHJvdmlkZXI6IHBhcmVudC5jdXJyZW50LnByb3ZpZGVyID8/ICdkZWVwc2Vlay1vZmZpY2lhbCcsXG4gICAgICAgICAgbW9kZWw6IHBhcmVudC5jdXJyZW50Lm1vZGVsLFxuICAgICAgICB9KSA/PyBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAgICAgcnBjVGltZW91dE1zLFxuICAgICAgICAnc2VsZWN0TW9kZWwnLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIFx1NkEyMVx1NTc4Qlx1N0VFN1x1NjI3Rlx1NTkzMVx1OEQyNVx1RkYxQVx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NzUyOFx1NTE3Nlx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1N0VFN1x1N0VFRFxuICB9XG5cbiAgLy8gMy4gXHU2Q0U4XHU1MTY1XHU0RjE4XHU1MzE2XHU2MzA3XHU0RUU0XHVGRjA4XHU4OUM0XHU1MjE5XHU2MkZDXHU4RkRCIHVzZXIgXHU2NTg3XHU2NzJDXHUyMDE0XHUyMDE0XHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU2NUUwXHU2MzAxXHU0RTQ1IHN5c3RlbVx1RkYwOVxuICBjb25zdCBzeXN0ZW0gPSBidWlsZFN5c3RlbVByb21wdChsYW5nKTtcbiAgY29uc3QgY29udGVudCA9IGAke3N5c3RlbX1cXG5cXG4ke3RleHR9YDtcbiAgYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgYXBpLnByb21wdD8uKHsgc2Vzc2lvbklkLCBtb2RlOiAncXVldWUnLCBjb250ZW50OiBbeyB0eXBlOiAndGV4dCcsIHRleHQ6IGNvbnRlbnQgfV0gfSkgPz8gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgcnBjVGltZW91dE1zLFxuICAgICdwcm9tcHQnLFxuICApO1xuXG4gIC8vIDQuIFx1OEY2RVx1OEJFMiBoaXN0b3J5XHVGRjFBZGVsdGEgXHU1ODlFXHU5MUNGXHU2RDQxXHU1RjBGXHU1NDQ4XHU3M0IwXHVGRjFCYXNzaXN0YW50L21lc3NhZ2UgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU1MjMwXHU4RkJFXHU3QUNCXHU1MzczXHU2NTM2XHU1QzNFXG4gIGNvbnN0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICBsZXQgbGFzdFRleHQgPSAnJztcbiAgbGV0IGlkbGVSb3VuZHMgPSAwO1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhcGkuY2FuY2VsPy4oeyBzZXNzaW9uSWQgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gXHU1QzNEXHU1MjlCXHU1M0Q2XHU2RDg4XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICB9XG4gICAgaWYgKERhdGUubm93KCkgLSBzdGFydGVkID4gdGltZW91dE1zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhcGkuY2FuY2VsPy4oeyBzZXNzaW9uSWQgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gXHU1QzNEXHU1MjlCXHU1M0Q2XHU2RDg4XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RpbWVvdXQnKTtcbiAgICB9XG4gICAgbGV0IGZvbGQ6IFNlc3Npb25Gb2xkID0geyB0ZXh0OiAnJywgY29tcGxldGVkOiBmYWxzZSB9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgYXBpLmhpc3Rvcnk/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIGZvbGQgPSBmb2xkU2Vzc2lvblRleHQocGFnZT8uZXZlbnRzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTM1NVx1NkIyMVx1NTNENlx1NTkzMVx1OEQyNVx1NEUwRFx1ODFGNFx1NTQ3RFx1RkYwQ1x1NEUwQlx1NEUwMFx1OEY2RVx1NTE4RFx1OEJENVxuICAgIH1cbiAgICBpZiAoZm9sZC5jb21wbGV0ZWQpIHtcbiAgICAgIC8vIFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYxQVx1NEVFNVx1NUY1M1x1NTI0RFx1RkYwOFx1NTQyQlx1NjcwMFx1N0VDOCBkZWx0YS9cdTUxNjhcdTY1ODdcdTUxNUNcdTVFOTVcdUZGMDlcdTY1ODdcdTY3MkNcdTY1MzZcdTVDM0VcbiAgICAgIGlmIChmb2xkLnRleHQgIT09IGxhc3RUZXh0ICYmIGZvbGQudGV4dCkgb25EZWx0YShmb2xkLnRleHQpO1xuICAgICAgcmV0dXJuIGZvbGQudGV4dDtcbiAgICB9XG4gICAgaWYgKGZvbGQudGV4dCAhPT0gbGFzdFRleHQpIHtcbiAgICAgIGlkbGVSb3VuZHMgPSAwO1xuICAgICAgY29uc3QgZGVsdGEgPSBwcmVmaXhEZWx0YShsYXN0VGV4dCwgZm9sZC50ZXh0KTtcbiAgICAgIGxhc3RUZXh0ID0gZm9sZC50ZXh0O1xuICAgICAgaWYgKGRlbHRhKSBvbkRlbHRhKGxhc3RUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWRsZVJvdW5kcyArPSAxO1xuICAgICAgaWYgKGlkbGVSb3VuZHMgPj0gc2V0dGxlUm91bmRzKSBicmVhaztcbiAgICB9XG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgaW50ZXJ2YWxNcykpO1xuICB9XG4gIHJldHVybiBsYXN0VGV4dDtcbn0iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbiAgLyoqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1NEUyRFx1NzY4NFx1NTg5RVx1OTFDRlx1NjU4N1x1NjcyQ1x1RkYwOG9wdGltaXppbmcgXHU2MDAxXHU1QjlFXHU2NUY2XHU2NkY0XHU2NUIwXHVGRjFCXHU5NzVFXHU2RDQxXHU1RjBGXHU1MTY4XHU3QTBCXHU0RTNBXHU3QTdBXHU0RTMyXHVGRjA5ICovXG4gIGRyYWZ0OiBzdHJpbmc7XG4gIC8qKiBcdTUzRDFcdThENzdcdTRGMThcdTUzMTZcdTc2ODRcdTRGMUFcdThCREQgaWRcdUZGMDhudWxsID0gXHU2NzJBXHU3RUQxXHU1QjlBL1x1NTE2OFx1NUM0MFx1RkYwOVx1RkYxQVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1NTNFQVx1NUM1RVx1NEU4RVx1OEJFNVx1NEYxQVx1OEJERFx1RkYwQ1x1NTIwN1x1OEQ3MFx1NEUwRFx1OERERlx1OTY4RiAqL1xuICBzZXNzaW9uSWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbi8qKiBcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMUFyZWR1Y2VyIFx1NkMzOFx1NEUwRFx1NTE5OVx1NTZERVx1NUI4M1x1NjIxNlx1OEZENFx1NTZERVx1NTNFRlx1NTNEOFx1NzY4NFx1NjVCMFx1NUJGOVx1OEM2MVx1RkYxQlx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOFRhc2sgNCBzdG9yZSBcdTgwRjZcdTZDMzRcdUZGMDlcdTVGQzVcdTk4N0JcdTRFRTUgeyAuLi5JTklUSUFMX1BSRVZJRVcgfSBcdTRFM0FcdTZCQ0ZcdTRGMUFcdThCRERcdTc5Q0RcdTVCNTAgKi9cbmV4cG9ydCBjb25zdCBJTklUSUFMX1BSRVZJRVc6IFByZXZpZXdTdGF0ZSA9IHtcbiAgc3RhdHVzOiAnaWRsZScsXG4gIHJlc3VsdDogJycsXG4gIGVycm9yS2luZDogbnVsbCxcbiAgZ2VuZXJhdGlvbjogMCxcbiAgZHJhZnQ6ICcnLFxuICBzZXNzaW9uSWQ6IG51bGwsXG59O1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3QWN0aW9uID1cbiAgfCB7IHR5cGU6ICdiZWdpbic7IHNlc3Npb25JZD86IHN0cmluZyB8IG51bGwgfVxuICB8IHsgdHlwZTogJ3Nob3cnOyByZXN1bHQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kIH1cbiAgfCB7IHR5cGU6ICdndWlkZScgfVxuICB8IHsgdHlwZTogJ2Nsb3NlJyB9XG4gIHwgeyB0eXBlOiAnZHJhZnQnOyB0ZXh0OiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgIHN0YXR1czogJ29wdGltaXppbmcnLFxuICAgICAgICBlcnJvcktpbmQ6IG51bGwsXG4gICAgICAgIGRyYWZ0OiAnJyxcbiAgICAgICAgc2Vzc2lvbklkOiBhY3Rpb24uc2Vzc2lvbklkID8/IG51bGwsXG4gICAgICAgIGdlbmVyYXRpb246IHN0YXRlLmdlbmVyYXRpb24gKyAxLFxuICAgICAgfTtcbiAgICBjYXNlICdzaG93JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ3ByZXZpZXcnLCByZXN1bHQ6IGFjdGlvbi5yZXN1bHQsIGRyYWZ0OiAnJyB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdlcnJvcicsIGVycm9yS2luZDogYWN0aW9uLmtpbmQgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2d1aWRlJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHN0YXRlIDogeyAuLi5zdGF0ZSwgc3RhdHVzOiAnZ3VpZGUnIH07XG4gICAgY2FzZSAnY2xvc2UnOlxuICAgICAgcmV0dXJuIElOSVRJQUxfUFJFVklFVztcbiAgICBjYXNlICdkcmFmdCc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyB7IC4uLnN0YXRlLCBkcmFmdDogYWN0aW9uLnRleHQgfSA6IHN0YXRlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1ODlDNFx1NUI5QVx1NzY4NFx1NTE2Q1x1NUYwMCBBUElcdUZGMDhUYXNrIDQgXHU4RDc3XHU1QjU4XHU1NzI4XHVGRjFCY2FuVHJpZ2dlciBcdTc2ODQgIWJ1c3kgXHU1MzRBXHU4RkI5XHU2MjdGXHU2MkM1XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU4MDRDXHU4RDIzXHVGRjBDXHU1MTc2XHU0RjU5XHU0RkREXHU3NTU5XHU0RUU1XHU1OTA3XHU1NDBFXHU3RUVEXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2FuT3B0aW1pemVGcm9tKHN0YXR1czogUHJldmlld1N0YXR1cyk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3RhdHVzICE9PSAnb3B0aW1pemluZyc7XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMVx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRiBcdTIwMTRcdTIwMTQgXHU2MzA5XHU5NEFFL1x1OTg4NFx1ODlDOFx1NTM2MS9ydW5PcHRpbWl6ZSBcdTUxNzFcdTRFQUJcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayAqL1xuXG5pbXBvcnQge1xuICBJTklUSUFMX1BSRVZJRVcsXG4gIHJlZHVjZVByZXZpZXcsXG4gIHR5cGUgUHJldmlld0FjdGlvbixcbiAgdHlwZSBQcmV2aWV3U3RhdGUsXG59IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTZBMjFcdTU3NTdcdTdFQTdcdTUzNTVcdTRGOEJcdTcyQjZcdTYwMDFcdUZGMDhcdTZCQ0ZcdTYzRDJcdTRFRjZcdTVCOUVcdTRGOEJcdTRFMDBcdTRFRkRcdUZGMUFcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTUxODVcdTUxNjhcdTVDNDBcdTU1MkZcdTRFMDBcdUZGMDkgKi9cbmxldCBzdGF0ZTogUHJldmlld1N0YXRlID0geyAuLi5JTklUSUFMX1BSRVZJRVcgfTtcbmNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuLyoqIFx1OEJGQlx1NUY1M1x1NTI0RFx1NUZFQlx1NzE2N1x1RkYwOFx1N0EzM1x1NUI5QVx1NUYxNVx1NzUyOFx1NzZGNFx1NTIzMFx1NEUwQlx1NEUwMFx1NkIyMSBkaXNwYXRjaFx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdCdXNTdGF0ZSgpOiBQcmV2aWV3U3RhdGUge1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8qKiBcdTZEM0VcdTUzRDFcdTcyQjZcdTYwMDFcdTY3M0FcdTUyQThcdTRGNUNcdTVFNzZcdTkwMUFcdTc3RTVcdThCQTJcdTk2MDVcdTgwMDUgKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaFByZXZpZXcoYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gIHN0YXRlID0gcmVkdWNlUHJldmlldyhzdGF0ZSwgYWN0aW9uKTtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIGxpc3RlbmVyKCk7XG59XG5cbi8qKiBcdThCQTJcdTk2MDVcdTUzRDhcdTUzMTZcdUZGMUJcdThGRDRcdTU2REVcdTkwMDBcdThCQTJcdTUxRkRcdTY1NzAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVQcmV2aWV3QnVzKGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9O1xufSIsICIvKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICsgXHU2QTIxXHU1NzU3XHU3RUE3XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2IFx1MjAxNFx1MjAxNCBcdTcyQjZcdTYwMDFcdTdFQ0ZcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1NTNEMVx1NUUwM1x1RkYwQ1xuICogIFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjA4XHU2ODRDXHU5NzYyXHU2RTMyXHU2N0QzXHU1QzQyXHU1QkY5IGlucHV0LnJpZ2h0L292ZXJsYXkgXHU2OUZEXHU0RjREXHU0RTBEXHU2M0QwXHU0RjlCXHU4RkQ5XHU0RTlCXHU2ODA3XHU1MUM2IHByb3BzXHVGRjBDXG4gKiAgXHU3RUM0XHU0RUY2XHU0RjlEXHU4RDU2XHU1QjgzXHU0RUVDXHU0RjFBXHU1RDI5XHU1RTc2XHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHUyMDE0XHUyMDE0UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOC9cdTk4ODRcdTg5QzhcdTUzNjFcdTRFMERcdTUzRUZcdTg5QzFcdTc2ODRcdTVCOUVcdTZENEJcdTVCOUFcdThCQkFcdUZGMDlcdTMwMDIgKi9cblxuaW1wb3J0IHtcbiAgY2hlY2tDb25maWcsXG4gIG9wdGltaXplU3RyZWFtLFxuICByZXNvbHZlU2Vzc2lvbk1vZGVsLFxuICBSRVFVRVNUX1RJTUVPVVRfTVMsXG4gIHRvRXJyb3JLaW5kLFxuICB0eXBlIExhbmcsXG4gIHR5cGUgT3B0aW1pemVFcnJvcktpbmQsXG4gIHR5cGUgUHJvbXB0Q29uZmlnLFxufSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5Ib3N0T3B0aW1pemUsIHR5cGUgSG9zdFNlc3Npb25BcGkgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGRpc3BhdGNoUHJldmlldyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG4vKipcbiAqIFx1NUY1M1x1NTI0RCBpbi1mbGlnaHQgXHU4QkY3XHU2QzQyXHU3Njg0XHU2M0E3XHU1MjM2XHU1NjY4XHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjA5XHVGRjFBXG4gKiAtIFx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1NjVGNlx1NEUyRFx1NkI2Mlx1NUI4M1x1RkYwQ1x1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzaG93KCkvZmFpbCgpIFx1NTkwRFx1NkQzQlx1NURGMlx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1RkYxQlxuICogLSBydW5PcHRpbWl6ZSBcdTRFRTVcdTMwMENcdTVCNThcdTU3MjhcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzZcdTU2NjhcdTMwMERcdTRFM0FcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDhcdTU0MENcdTRFMDBcdTY1RjZcdTUyM0JcdTUzRUFcdTUxNDFcdThCQjhcdTRFMDBcdTRFMkFcdThCRjdcdTZDNDJcdTU3MjhcdTkwMTRcdUZGMDlcdTMwMDJcbiAqIFx1NkNFOFx1RkYxQVx1NkEyMVx1NTc1N1x1N0VBN1x1NjEwRlx1NTQ3M1x1Nzc0MFx1NTkxQVx1NEYxQVx1OEJERFx1NTQwQ1x1NjVGNlx1NEYxOFx1NTMxNlx1NEYxQVx1NEU5Mlx1NzZGOFx1OEJBOVx1OERFRlx1MjAxNFx1MjAxNFx1OEY5M1x1NTE2NVx1NjgwRlx1NTM1NVx1NEYxQVx1OEJERFx1ODA1QVx1NzEyNlx1NzY4NFx1NEVBNFx1NEU5Mlx1NEUwQlx1NTNFRlx1NjNBNVx1NTNEN1x1NkI2NFx1N0I4MFx1NTMxNlx1MzAwMlxuICovXG5sZXQgYWN0aXZlQ29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4vKiogXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHU3Njg0XHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHVGRjA4XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU2MzA5XHU0RjFBXHU4QkREXHVGRjFBXHU1NDBDXHU0RjFBXHU4QkREXHU5NjMyXHU2Mjk2XHVGRjFCXHU1RjAyXHU0RjFBXHU4QkREXHU4QkE5XHU4REVGXHVGRjA5ICovXG5sZXQgYWN0aXZlU2Vzc2lvbklkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLyoqIFx1NTE3M1x1OTVFRFx1OTg4NFx1ODlDOFx1NTM2MVx1RkYwOFx1NUU3Nlx1NEUyRFx1NkI2Mlx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlUHJldmlldygpOiB2b2lkIHtcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHtcbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gIH1cbiAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2Nsb3NlJyB9KTtcbn1cblxuLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5Mlx1RkYxQVx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1MjE5MiBcdTgzNDlcdTdBM0ZcdTdBN0EgXHUyMTkyIFx1NzZGNFx1NjNBNVx1OEZENFx1NTZERVx1RkYxQlx1OTE0RFx1N0Y2RVx1N0YzQVx1NTkzMVx1RkYwOGZldGNoIFx1OTAxQVx1OTA1M1x1RkYwOVx1MjE5MiBndWlkZVx1RkYxQlx1NUU3Nlx1NTNEMSBcdTIxOTIgXHU0RTIyXHU1RjAzXHVGRjFCXHU4RDg1XHU2NUY2L1x1NTNENlx1NkQ4OCBcdTIxOTIgdGltZW91dCBcdTYyMTZcdTk3NTlcdTlFRDggKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5PcHRpbWl6ZShjdHg6IHtcbiAgZ2V0Q29uZmlnKCk6IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZygpOiBMYW5nO1xuICBnZXREcmFmdCgpOiBzdHJpbmc7XG4gIC8qKiBcdTg5RTNcdTY3OTBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDh1c2VTZXNzaW9uTW9kZWwgXHU1RjAwXHU1NDJGXHU2NUY2XHU0RjE4XHU1MTQ4XHVGRjA5XHVGRjBDXHU0RTBEXHU1M0VGXHU1Rjk3XHU2NUY2XHU4RkQ0XHU1NkRFIG51bGxcdUZGMDhcdTU2REVcdTkwMDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMDkgKi9cbiAgZ2V0U2Vzc2lvbk1vZGVsPygpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4dXNlU2Vzc2lvbk1vZGVsIFx1NUYwMFx1NTQyRlx1NjVGNlx1NzUyOFx1RkYwOVx1RkYxQVx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERCArIFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RSAqL1xuICBob3N0Pzoge1xuICAgIGFwaTogSG9zdFNlc3Npb25BcGk7XG4gICAgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7XG4gICAgc2Vzc2lvbklkOiBzdHJpbmc7XG4gIH07XG4gIC8qKiBcdTUzRDFcdThENzdcdTRGMThcdTUzMTZcdTc2ODRcdTRGMUFcdThCREQgaWRcdUZGMDhcdTdFRDFcdTVCOUFcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdUZGMENcdTUyMDdcdTRGMUFcdThCRERcdTRFMERcdThEREZcdTk2OEZcdUZGMDkgKi9cbiAgZ2V0U2Vzc2lvbklkPygpOiBzdHJpbmcgfCBudWxsO1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjb25maWcgPSBjdHguZ2V0Q29uZmlnKCk7XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBpZiAoIWRyYWZ0KSByZXR1cm47XG5cbiAgLy8gXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjFBXHU1NDBDXHU0RjFBXHU4QkREXHU1NzI4XHU5MDE0IFx1MjE5MiBcdTRFMjJcdTVGMDNcdTY3MkNcdTZCMjFcdTg5RTZcdTUzRDFcdUZGMDhcdTYzMDlcdTk0QUUgYnVzeSBcdTVERjJcdTc5ODFcdTc1MjhcdTcwQjlcdTUxRkJcdUZGMENcdThGRDlcdTkxQ0NcdTY2MkZcdTdBREVcdTYwMDFcdTY3MDBcdTU0MEVcdTk2MzJcdTdFQkZcdUZGMDlcdUZGMUJcbiAgLy8gXHU1MjA3XHU2MzYyXHU0RjFBXHU4QkREXHU1NDBFXHU1M0QxXHU4RDc3IFx1MjE5MiBcdTRFMkRcdTZCNjJcdTY1RTdcdThCRjdcdTZDNDJcdThCQTlcdThERUZcdUZGMDhcdTU0MDRcdTRGMUFcdThCRERcdTUzRUZcdTcyRUNcdTdBQ0JcdTRGMThcdTUzMTZcdUZGMENcdTVCQkZcdTRFM0JcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdTc1MzEgY2FuY2VsIFx1NjUzNlx1NUMzRVx1RkYwOVxuICBjb25zdCBzZXNzaW9uSWQgPSBjdHguZ2V0U2Vzc2lvbklkPy4oKSA/PyBudWxsO1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGlmIChzZXNzaW9uSWQgPT09IGFjdGl2ZVNlc3Npb25JZCkgcmV0dXJuO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICB9XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdiZWdpbicsIHNlc3Npb25JZCB9KTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlUHJldmlldygpXHVGRjBDXHU0RjlCXHU1MzYxXHU3MjQ3XHU1MTczXHU5NUVEXHU2NUY2XHU1M0Q2XHU2RDg4XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXG4gIGFjdGl2ZVNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERFx1OTAxQVx1OTA1MyBcdTIwMTRcdTIwMTQgXHU5NkY2XHU5MTREXHU3RjZFXHVGRjBDXHU2NUUwXHU5NzAwIGNoZWNrQ29uZmlnXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGF3YWl0IHJ1bkhvc3RPcHRpbWl6ZSh7XG4gICAgICAgIGFwaTogY3R4Lmhvc3QuYXBpLFxuICAgICAgICBwYXJlbnRTZXNzaW9uSWQ6IGN0eC5ob3N0LnBhcmVudFNlc3Npb25JZCxcbiAgICAgICAgc2Vzc2lvbklkOiBjdHguaG9zdC5zZXNzaW9uSWQsXG4gICAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkRlbHRhOiAodGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2RyYWZ0JywgdGV4dCB9KSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSksXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA4XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCL1x1NUJCRlx1NEUzQlx1NEUwRFx1NTNFRlx1NzUyOFx1OTY0RFx1N0VBN1x1RkYwOVx1NjI0RFx1ODk4MVx1NkM0Mlx1OTE0RFx1N0Y2RVxuICAgIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2d1aWRlJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMUFcdTZENEZcdTg5QzhcdTU2NjggZmV0Y2ggXHU3NkY0XHU4RkRFXHU4MUVBXHU5MTREIEFQSVx1RkYwOFx1NkQ0MVx1NUYwRlx1RkYwOVxuICAgIC8vIFx1NkEyMVx1NTc4Qlx1ODlFM1x1Njc5MFx1RkYxQXVzZVNlc3Npb25Nb2RlbFx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1MjE5MiBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTRFQzVcdTRGNUMgbW9kZWwgXHU1NDBEXHU1NkRFXHU5MDAwXHU0RjdGXHU3NTI4XHVGRjA5XHVGRjFCXHU1NDI2XHU1MjE5IFx1MjE5MiBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcbiAgICBsZXQgbW9kZWwgPSBjb25maWcubW9kZWw7XG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25Nb2RlbCA9IGF3YWl0IGN0eC5nZXRTZXNzaW9uTW9kZWw/LigpO1xuICAgICAgaWYgKHNlc3Npb25Nb2RlbCkgbW9kZWwgPSBzZXNzaW9uTW9kZWw7XG4gICAgfVxuICAgIGNvbnN0IGVmZmVjdGl2ZSA9IHsgLi4uY29uZmlnLCBtb2RlbCB9O1xuXG4gICAgLy8gXHU1QzU1XHU3OTNBXHU3RDJGXHU3OUVGXHVGRjFBXHU2QjYzXHU2NTg3XHU0RjE4XHU1MTQ4XHVGRjFCXHU2QjYzXHU2NTg3XHU1QzFBXHU2NzJBXHU1MUZBXHU3M0IwXHVGRjA4djQgXHU3Q0ZCXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1XHU2M0E4XHU3NDA2XHVGRjA5XHU2NUY2XHU1QzU1XHU3OTNBXHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjBDXHU4QkE5XHU2RDQxXHU1RjBGXHU3QUNCXHU1MzczXHU1M0VGXHU4OUMxXG4gICAgbGV0IHJlYXNvbmluZyA9ICcnO1xuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgbGV0IHNob3duID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplU3RyZWFtKHtcbiAgICAgICAgY29uZmlnOiBlZmZlY3RpdmUsXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBsYW5nOiBjdHguZ2V0TGFuZygpLFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkV2ZW50OiAoZGVsdGEpID0+IHtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgICBjb250ZW50ICs9IGRlbHRhLnRleHQ7XG4gICAgICAgICAgICBzaG93biA9IGNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYXNvbmluZyArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSByZWFzb25pbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQ6IHNob3duIH0pO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdCB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBcdTUxNDhcdTUyMjRcdTVCOUFcdTRFMkRcdTZCNjJcdUZGMUFcdTc1MjhcdTYyMzcvXHU3RUM0XHU0RUY2XHU1M0Q2XHU2RDg4XHU0RTBFXHU4RDg1XHU2NUY2XHU5MEZEXHU4ODY4XHU3M0IwXHU0RTNBIEFib3J0RXJyb3JcdUZGMUJcdTRFQzVcdThEODVcdTY1RjZcdTUxOTlcdTUxNjVcdTk1MTlcdThCRUZcdTYwMDFcbiAgICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgKHR5cGVvZiAoZSBhcyB7IG5hbWU/OiB1bmtub3duIH0gfCBudWxsKT8ubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgaWYgKHRpbWVkT3V0KSBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6ICd0aW1lb3V0JyBhcyBPcHRpbWl6ZUVycm9yS2luZCB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1OTg3Nlx1NUM0Mlx1NTE1Q1x1NUU5NVx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1MyByZWplY3QgXHU1REYyXHU4OEFCIC50aGVuIFx1NkQ4OFx1NTMxNlx1RkYxQlx1NkI2NFx1NTkwNFx1NEZERFx1NjJBNCBmZXRjaCBcdTUyMDZcdTY1MkZcdTRFRTVcdTU5MTZcdTc2ODRcdTYxMEZcdTU5MTZcdTVGMDJcdTVFMzhcdUZGMDlcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIHtcbiAgICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgICB9XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufSIsICIvKiogXHU4RjkzXHU1MTY1XHU1MzNBXHU2RDZFXHU1QzQyXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHVGRjFBZ3VpZGUgLyBvcHRpbWl6aW5nIC8gcHJldmlldyAvIGVycm9yIFx1NTZEQlx1NzlDRFx1NTE4NVx1NUJCOVx1NjAwMVxuICogIFx1NzJCNlx1NjAwMVx1Njc2NVx1ODFFQVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOHByZXZpZXctYnVzXHVGRjA5XHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHMgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUsIGNsb3NlUHJldmlldyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGdldFByZXZpZXdCdXNTdGF0ZSwgc3Vic2NyaWJlUHJldmlld0J1cyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByZXZpZXdDYXJkUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIG9wZW5TZXR0aW5nczogKCkgPT4gdm9pZDtcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgYXBpOiB1bmtub3duOyBwYXJlbnRTZXNzaW9uSWQ6IHN0cmluZzsgc2Vzc2lvbklkOiBzdHJpbmcgfSB8IG51bGw7XG4gIGdldFNlc3Npb25JZD86ICgpID0+IHN0cmluZyB8IG51bGw7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUEtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5IFx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NVx1ODI3MiBcdTIxOTIgXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU0RTBEXHU1M0VGXHU4QkZCXHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5ICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRTdGF0ZShnZXRQcmV2aWV3QnVzU3RhdGUoKSkpLFxuICAgIFtdLFxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHsgc3RhdHVzLCByZXN1bHQsIGVycm9yS2luZCB9ID0gc3RhdGU7XG4gIGNvbnN0IFtjb3BpZWQsIHNldENvcGllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNvcHlUaW1lclJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMUFcdTUyMDdcdTYzNjJcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTRFMERcdThEREZcdTk2OEZcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdTU2REVcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTYwNjJcdTU5MERcdUZGMDlcbiAgaWYgKHN0YXR1cyAhPT0gJ2lkbGUnICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNpZCA9IGdldFNlc3Npb25JZD8uKCk7XG4gICAgaWYgKHNpZCAhPT0gbnVsbCAmJiBzdGF0ZS5zZXNzaW9uSWQgIT09IHNpZCkgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZXRyeSA9ICgpID0+IHtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHsgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXREcmFmdDogKCkgPT4gcmVhZENvbXBvc2VyVGV4dCgpLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9KTtcbiAgfTtcblxuICBjb25zdCByZXBsYWNlID0gKCkgPT4ge1xuICAgIHdyaXRlQ29tcG9zZXJUZXh0KHJlc3VsdCk7XG4gICAgY2xvc2VQcmV2aWV3KCk7XG4gIH07XG5cbiAgY29uc3QgY29weSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIHJldHVybjsgLy8gXHU5NzVFXHU1Qjg5XHU1MTY4XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4aHR0cCBcdTdCNDlcdUZGMDlcdUZGMUFcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjBDXHU0RkREXHU2MzAxXHU1M0VGXHU5MUNEXHU4QkQ1XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHJlc3VsdCk7XG4gICAgICBpZiAoIW1vdW50ZWRSZWYuY3VycmVudCkgcmV0dXJuOyAvLyBhd2FpdCBcdTY3MUZcdTk1RjRcdTdFQzRcdTRFRjZcdTVERjJcdTUzNzhcdThGN0RcdUZGMUFcdTRFMERcdTUxOEQgc2V0U3RhdGVcbiAgICAgIHNldENvcGllZCh0cnVlKTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRDb3BpZWQoZmFsc2UpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAxMjAwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTE5OVx1NTE2NVx1NTkzMVx1OEQyNVx1RkYxQVx1OTc1OVx1OUVEOFx1RkYwOFx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMDlcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1oZWFkXCI+XG4gICAgICAgIDxzcGFuPnt0KCdjYXJkLnRpdGxlJyl9PC9zcGFuPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgXHUyNzE1XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtzdGF0dXMgPT09ICdndWlkZScgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS50aXRsZScpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS5kZXNjJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17KCkgPT4geyBjbG9zZVByZXZpZXcoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdvcHRpbWl6aW5nJyAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPlxuICAgICAgICAgIHtzdGF0ZS5kcmFmdCA/IDxzcGFuIHN0eWxlPXt7IHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcgfX0+e3N0YXRlLmRyYWZ0fTwvc3Bhbj4gOiB0KCdjYXJkLm9wdGltaXppbmcnKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAncHJldmlldycgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPntyZXN1bHR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmVwbGFjZX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJlcGxhY2UnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gdm9pZCBjb3B5KCl9PlxuICAgICAgICAgICAgICB7Y29waWVkID8gdCgnY2FyZC5jb3B5RG9uZScpIDogdCgnY2FyZC5jb3B5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnZXJyb3InICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyclwiPnt0KGVycm9yS2V5KGVycm9yS2luZCkpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSIsICIvKiogXHU4QkJFXHU3RjZFIFx1MjE5MiBHZW5lcmFsIFx1NTMzQVx1MzAwQ1Byb21wdCBcdTRGMThcdTUzMTZcdTMwMERcdThCQkVcdTdGNkVcdTg4NENcdUZGMUFcdTY4MDdcdTk4OThcdTY0NThcdTg5ODEgKyBcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1TdGF0ZSwgU2V0dGluZ3NGb3JtVmFsdWVzIH0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtQWN0aW9ucyB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHsgb25PcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUm93UHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFNldHRpbmdzRm9ybVN0YXRlKSA9PiBUKSA9PiBUO1xuICBhY3Rpb25zOiBTZXR0aW5nc0Zvcm1BY3Rpb25zO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgc2F2ZUNvbmZpZzogKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiBQcm9taXNlPHZvaWQ+O1xuICByZXNldENvbmZpZzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0RXBvY2g6ICgpID0+IG51bWJlcjtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL3NldHRpbmdzLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLm9wdGlTZXR0aW5ncyB7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgcGFkZGluZzogMTZweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5vcHRpU2V0dGluZ3NUaXRsZSB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDIycHg7XG59XG4ub3B0aVNldHRpbmdzSGludCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzRm9ybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzRmllbGQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NMYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0lucHV0IHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ub3B0aVNldHRpbmdzUm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG4ub3B0aVNldHRpbmdzQnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMnB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQVx1NEUzQlx1OTg5OFx1NTNEOFx1OTFDRlx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1NEYxQVx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NS9cdTZERjFcdTY3ODFcdTdBRUZcdTgyNzJcdUZGMDhcdTlFRDFcdTVFOTVcdTlFRDFcdTVCNTdcdTMwMDFcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTU3NDdcdTg4QUJcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDlcdUZGMENcbiAgICAgXHU1NkZBXHU1QjlBXHU1NEMxXHU3MjRDXHU4NEREICsgXHU3NjdEXHU1QjU3XHU0RkREXHU4QkMxXHU0RUZCXHU0RjU1XHU0RTNCXHU5ODk4XHU1M0VGXHU4QkZCICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuLm9wdGlTZXR0aW5nc0VyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2V0dGluZ3NSb3cocHJvcHM6IFNldHRpbmdzUm93UHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBzYXZlQ29uZmlnLCByZXNldENvbmZpZywgZ2V0RXBvY2ggfSA9IHByb3BzO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIGdldEVwb2NoKCksXG4gICAgKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIH0sIFtjb25maWcuYmFzZVVybCwgY29uZmlnLmFwaUtleSwgY29uZmlnLm1vZGVsLCBnZXRFcG9jaF0pO1xuXG4gIC8vIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1RkYwOFx1OTg4NFx1ODlDOFx1NTM2MVx1NjcyQVx1OTE0RFx1N0Y2RVx1NUYxNVx1NUJGQ1x1RkYwOVx1MjE5MiBcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3BlblNldHRpbmdzUmVxdWVzdCgoKSA9PiBzZXRFeHBhbmRlZCh0cnVlKSksIFtdKTtcblxuICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIGNvbnN0IGVycm9ycyA9IGFjdGlvbnMudmFsaWRhdGUodmFsdWVzKTtcbiAgICBpZiAoZXJyb3JzKSB7XG4gICAgICBhY3Rpb25zLmZhaWwoT2JqZWN0LnZhbHVlcyhlcnJvcnMpWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNhdmVDb25maWcodmFsdWVzKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgICAvLyBcdTRFMEVcdTY1NDhcdTVFOTRcdTU2REVcdThERDFcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTdFQUFcdTUxNDNcdUZGMDlcdTVCRjlcdTlGNTBcdUZGMENcdTRGN0ZcdTRGRERcdTVCNThcdTU0MEVcdTc2ODRcdTkxQ0RcdTY0QURcdTc5Q0RcdTg4QUJcdTYyOTFcdTUyMzZcbiAgICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5zYXZlRmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZXNldENvbmZpZygpO1xuICAgICAgYWN0aW9ucy5zZWVkKFxuICAgICAgICB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfSxcbiAgICAgICAgc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSxcbiAgICAgICk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5yZXNldEZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmXG4gICAgICAgICAgKHZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCgnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCcpfTwvc3Bhbj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QodmFsdWVzLmFwaUtleSA/ICdjYXJkLmNvbmZpZ3VyZWQuaGludCcgOiAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCcpLnJlcGxhY2UoJ3ttb2RlbH0nLCBtb2RlbExhYmVsKX08L3NwYW4+XG4gICAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cblxuICAgICAge2V4cGFuZGVkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGb3JtXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCI+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgY2hlY2tlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgndXNlU2Vzc2lvbk1vZGVsJywgZS50YXJnZXQuY2hlY2tlZCl9XG4gICAgICAgICAgICAgIC8+eycgJ31cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCcpfVxuICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCcpfTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1iYXNlLXVybFwiPnt0KCdzZXR0aW5ncy5iYXNlVXJsJyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYmFzZS11cmxcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYmFzZVVybH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e0RFRkFVTFRTLmJhc2VVcmx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYmFzZVVybCcsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYXBpLWtleVwiPnt0KCdzZXR0aW5ncy5hcGlLZXknKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1hcGkta2V5XCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmFwaUtleX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJzay1cdTIwMjZcIlxuICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAnXHUyMDE0JyA6IERFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ21vZGVsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1Jvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuIHByaW1hcnlcIiBvbkNsaWNrPXtoYW5kbGVTYXZlfT5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnNhdmUnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuXCIgb25DbGljaz17aGFuZGxlUmVzZXR9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MucmVzZXQnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAge3NhdmVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3Muc2F2ZWQnKX08L3NwYW4+fVxuICAgICAgICAgICAge3JwY0Vycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPntycGNFcnJvcn08L3NwYW4+fVxuICAgICAgICAgICAgeyFycGNFcnJvciAmJiBlcnJvciAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NFcnJcIj57dChlcnJvcil9PC9zcGFuPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuZGVzYycpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOVx1RkYxQVx1ODM0OVx1N0EzRiArIFx1NjgyMVx1OUE4QyArIFx1NEZERFx1NUI1OFx1NTJBOFx1NEY1QyAqL1xuXG5pbXBvcnQgeyBkZWZpbmVTdG9yZSB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB7XG4gIElOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgcmVkdWNlU2V0dGluZ3NGb3JtLFxuICB2YWxpZGF0ZVNldHRpbmdzRm9ybSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1TdGF0ZSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1WYWx1ZXMsXG59IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtQWN0aW9ucyB7XG4gIHNlZWQodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBlZGl0KGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBjb21taXQocmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGZhaWwobWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbiAgLyoqIFx1NEZERFx1NUI1OFx1NTI0RFx1NjgyMVx1OUE4Q1x1RkYxQlx1OEZENFx1NTZERVx1OTUxOVx1OEJFRlx1NUI1N1x1NTE3OFx1RkYxQlx1NjVFMFx1OTUxOVx1OEJFRlx1NjVGNlx1OEZENFx1NTZERSBudWxsICovXG4gIHZhbGlkYXRlKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw7XG59XG5cbi8qKiBkZWZpbmVTdG9yZSBcdThGRDRcdTU2REVcdTc2ODQgc3RvcmUgXHU1M0U1XHU2N0M0XHVGRjA4XHU1NDBDXHU2NUY2XHU1M0VGXHU0RjVDXHU3QzdCXHU1NzhCXHU1MzYwXHU0RjREXHVGRjBDXHU0RjlCXHU2Q0U4XHU1MThDXHU2NUY2IGBzdG9yZTpgIFx1NEY3Rlx1NzUyOFx1RkYwOSAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSB7XG4gIC8vIFx1OEZEMFx1ODg0Q1x1NjVGNlx1NUY2Mlx1NzJCNlx1NzUzMSBEU0ggXHU2M0QwXHU0RjlCXHVGRjFCXHU2QjY0XHU1OTA0XHU0RUM1XHU0RTNBXHU2NTg3XHU2ODYzXHU2MDI3XHU3QzdCXHU1NzhCXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSA9ICgpOiBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSA9PiB7XG4gIGNvbnN0IGhhbmRsZSA9IGRlZmluZVN0b3JlKHtcbiAgICBpbml0OiAoKTogU2V0dGluZ3NGb3JtU3RhdGUgPT4gKHtcbiAgICAgIC8vIFx1NkJDRlx1NUI5RVx1NEY4Qlx1NTI2Rlx1NjcyQ1x1RkYxQUlOSVRJQUxfU0VUVElOR1NfRk9STSBcdTY2MkZcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMENcdTUyRkZcdThERThcdTVCOUVcdTRGOEJcdTUxNzFcdTRFQUJcdTVGMTVcdTc1MjhcdUZGMDhyZWR1Y2VyIFx1NzY4NCBkcmFmdCBcdTUxOTlcdTUxNjVcdTk3MDBcdTUzRDdcdTRGRERcdTYyQTRcdUZGMDlcbiAgICAgIC4uLklOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgICAgIHZhbHVlczogeyAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0udmFsdWVzIH0sXG4gICAgfSksXG4gICAgYWN0aW9uczoge1xuICAgICAgc2VlZDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnc2VlZCcsIHZhbHVlcywgcmV2aXNpb24gfSkpLFxuICAgICAgZWRpdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdlZGl0JywgZmllbGQsIHZhbHVlIH0pKSxcbiAgICAgIGNvbW1pdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdjb21taXQnLCByZXZpc2lvbiB9KSksXG4gICAgICBmYWlsOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIG1lc3NhZ2U6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZmFpbCcsIG1lc3NhZ2UgfSkpLFxuICAgICAgdmFsaWRhdGU6IChfZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlcnJvcnMpLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBlcnJvcnM7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTVcdTY4MjFcdTlBOEMgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtVmFsdWVzIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMUFcdTRGMThcdTUzMTZcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOCBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCB1cmwgPSB2YWx1ZXMuYmFzZVVybC50cmltKCk7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG4gICAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgICB9XG4gIH1cblxuICBpZiAoIXZhbHVlcy5hcGlLZXkudHJpbSgpKSBlcnJvcnMuYXBpS2V5ID0gJ3NldHRpbmdzLmFwaUtleSc7XG4gIGlmICghdmFsdWVzLnVzZVNlc3Npb25Nb2RlbCAmJiAhdmFsdWVzLm1vZGVsLnRyaW0oKSkgZXJyb3JzLm1vZGVsID0gJ3NldHRpbmdzLm1vZGVsJztcblxuICByZXR1cm4gZXJyb3JzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7XG4gIGRpcnR5OiBib29sZWFuO1xuICBzYXZlZDogYm9vbGVhbjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHJldmlzaW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBJTklUSUFMX1NFVFRJTkdTX0ZPUk06IFNldHRpbmdzRm9ybVN0YXRlID0ge1xuICB2YWx1ZXM6IHsgYmFzZVVybDogJycsIGFwaUtleTogJycsIG1vZGVsOiAnJywgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlIH0sXG4gIGRpcnR5OiBmYWxzZSxcbiAgc2F2ZWQ6IGZhbHNlLFxuICBlcnJvcjogbnVsbCxcbiAgcmV2aXNpb246IC0xLFxufTtcblxuZXhwb3J0IHR5cGUgU2V0dGluZ3NGb3JtQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdzZWVkJzsgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2VkaXQnOyBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzOyB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB9XG4gIHwgeyB0eXBlOiAnY29tbWl0JzsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlU2V0dGluZ3NGb3JtKHN0YXRlOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgYWN0aW9uOiBTZXR0aW5nc0Zvcm1BY3Rpb24pOiBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzZWVkJzpcbiAgICAgIHJldHVybiBhY3Rpb24ucmV2aXNpb24gPD0gc3RhdGUucmV2aXNpb25cbiAgICAgICAgPyBzdGF0ZVxuICAgICAgICA6IHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5hY3Rpb24udmFsdWVzIH0sIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5zdGF0ZS52YWx1ZXMsIFthY3Rpb24uZmllbGRdOiBhY3Rpb24udmFsdWUgfSwgZGlydHk6IHRydWUsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgICBjYXNlICdjb21taXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IHRydWUsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZXJyb3I6IGFjdGlvbi5tZXNzYWdlIH07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNVTyxJQUFNLFdBQXlCO0FBQUEsRUFDcEMsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsaUJBQWlCO0FBQ25CO0FBSU8sU0FBUyxpQkFBaUIsS0FBcUI7QUFDcEQsU0FBTyxJQUFJLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0QztBQUVPLFNBQVMsWUFBWSxLQUE2RDtBQUN2RixRQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksWUFBWSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksU0FBUztBQUN2RyxRQUFNLFNBQVMsT0FBTyxLQUFLLFdBQVcsV0FBVyxJQUFJLFNBQVMsU0FBUztBQUd2RSxRQUFNLFdBQVcsT0FBTyxLQUFLLFVBQVUsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksU0FBUztBQUNsRyxRQUFNLGtCQUNKLGFBQWEsbUJBQW1CLGlCQUFpQixPQUFPLE1BQU0sU0FBUyxVQUFVLFNBQVMsUUFBUTtBQUNwRyxRQUFNLFFBQVE7QUFDZCxRQUFNLGtCQUFrQixPQUFPLEtBQUssb0JBQW9CLFlBQVksSUFBSSxrQkFBa0IsU0FBUztBQUNuRyxTQUFPLEVBQUUsU0FBUyxpQkFBaUIsT0FBTyxHQUFHLFFBQVEsT0FBTyxnQkFBZ0I7QUFDOUU7QUFLTyxTQUFTLFlBQVksUUFBbUM7QUFDN0QsTUFBSSxDQUFDLE9BQU8sT0FBTyxLQUFLLEVBQUcsUUFBTyxFQUFFLElBQUksT0FBTyxRQUFRLGNBQWM7QUFFckUsTUFBSSxDQUFD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QUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sVUFBVSxPQUFPO0FBQUEsUUFDbkMsT0FBTztBQUFBLFVBQ0wsU0FBUyxRQUFRO0FBQUEsVUFDakIsUUFBUSxRQUFRO0FBQUEsVUFDaEIsT0FBTyxRQUFRO0FBQUEsVUFDZixpQkFBaUIsUUFBUTtBQUFBLFFBQzNCO0FBQUEsTUFDRixDQUFDO0FBQ0QscUJBQWUsWUFBWSxLQUEwQztBQUFBLElBQ3ZFLFNBQVMsT0FBTztBQUNkLFlBQU0sSUFBSSxNQUFNLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUssQ0FBQztBQUFBLElBQ3hFO0FBQUEsRUFDRjtBQUNBLFFBQU0sY0FBYyxZQUEyQjtBQUM3QyxRQUFJO0FBQ0YsWUFBTSxRQUFRLE1BQU0sVUFBVSxPQUFPO0FBQUEsUUFDbkMsT0FBTztBQUFBLFVBQ0wsU0FBUyxTQUFTO0FBQUEsVUFDbEIsUUFBUSxTQUFTO0FBQUEsVUFDakIsT0FBTyxTQUFTO0FBQUEsVUFDaEIsaUJBQWlCO0FBQUEsUUFDbkI7QUFBQSxNQUNGLENBQUM7QUFDRCxxQkFBZSxZQUFZLEtBQTBDO0FBQUEsSUFDdkUsU0FBUyxPQUFPO0FBQ2QsWUFBTSxJQUFJLE1BQU0saUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSyxDQUFDO0FBQUEsSUFDeEU7QUFBQSxFQUNGO0FBRUEsTUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsVUFBVTtBQUMvQixVQUFNLE1BQU07QUFBQSxNQUFPO0FBQUEsTUFBeUIsTUFDMUMsTUFBTSxNQUFNO0FBQUEsUUFDVjtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sSUFBSTtBQUFBLFVBQ0osT0FBTztBQUFBLFVBQ1AsUUFBUTtBQUFBLFVBQ1IsT0FBTztBQUFBLFVBQ1AsUUFBUSxPQUFPO0FBQUEsWUFDYixXQUFXLE1BQU07QUFBQSxZQUNqQjtBQUFBLFlBQ0E7QUFBQSxZQUNBLFVBQVUsTUFBTTtBQUFBLFVBQ2xCO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUdELFFBQU0sWUFBWSxDQUFDLE1BQXFCO0FBQ3RDLFFBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLE9BQVE7QUFDcEMsVUFBTSxLQUFLLFNBQVM7QUFDcEIsUUFBSSxFQUFFLGNBQWMscUJBQXNCO0FBQzFDLE1BQUUsZUFBZTtBQUNqQix3QkFBb0I7QUFBQSxFQUN0QjtBQUNBLFdBQVMsaUJBQWlCLFdBQVcsU0FBUztBQUNoRDsiLAogICJuYW1lcyI6IFsic3RhdGUiLCAiUmVhY3QiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIiwgImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJzdGF0ZSJdCn0K

    return module.exports;
  }
});
