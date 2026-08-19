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
  const { api, parentSessionId, lang, text, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const settleRounds = opts.settleRounds ?? DEFAULT_SETTLE_ROUNDS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error("aborted");
  const forked = await withTimeout(api.fork?.({ sessionId: parentSessionId }) ?? Promise.resolve(), rpcTimeoutMs, "fork");
  const sessionId = forked?.sessionId;
  if (!sessionId) throw new Error("host-unavailable");
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
  const hostApi = ctx.connection.api;
  const getHost = () => {
    const parentSessionId = getActiveSession();
    if (!parentSessionId) return null;
    return { api: hostApi, parentSessionId };
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnLCByZXNvbHZlU2Vzc2lvbk1vZGVsIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIGNvbnN0IGdldFNlc3Npb25Nb2RlbCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgICBjb25zdCBzZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiByZXNvbHZlU2Vzc2lvbk1vZGVsKGN0eC5jb25uZWN0aW9uLmFwaSBhcyBuZXZlciwgeyBzZXNzaW9uSWQgfSk7XG4gIH07XG5cbiAgLy8gMi41YiBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTRGMUFcdThCRERcdTdFRDFcdTVCOUFcdUZGMUFcdTUzNjFcdTcyNDdcdTUzRUFcdTU3MjhcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdThENzBcdTRFMERcdThEREZcdTk2OEZcdUZGMDlcbiAgY29uc3QgZ2V0U2Vzc2lvbklkID0gKCk6IHN0cmluZyB8IG51bGwgPT4gZ2V0QWN0aXZlU2Vzc2lvbigpO1xuXG4gIC8vIDIuNiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDhcdTRFMzRcdTY1RjZcdTVCRjlcdThCREQgKyBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMENcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdUZGMUFcbiAgLy8gXHU2QkNGXHU2QjIxXHU0RjE4XHU1MzE2XHU0RUNFXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREIGZvcmsgXHU0RTAwXHU0RTJBXHU0RTM0XHU2NUY2XHU1QjUwXHU0RjFBXHU4QkREXHVGRjA4XHU1QkJGXHU0RTNCXHU3NTFGXHU2MjEwXHU1NDA4XHU2Q0Q1IHNlc3Npb25JZFx1RkYxQlx1NEUwRFx1NzUyOCBzZXNzaW9uLmNyZWF0ZVx1MjAxNFx1MjAxNFxuICAvLyBcdTgxRUFcdTdGMTYgaWQgXHU4OEFCXHU1QkJGXHU0RTNCXHU2MkQyXHU3RUREXHU0RjFBXHU5NzU5XHU5RUQ4XHU1OTMxXHU4RDI1IFx1MjE5MiBcdTdBN0FcdThGNkVcdThCRTJcdTMwMENcdTZDMzhcdThGRENcdTRGMThcdTUzMTZcdTRFMkRcdTMwMERcdUZGMENcdTVCOUVcdTZENEJcdUZGMDlcdUZGMUJcdTZBMjFcdTU3OEJcdTdFQ0YgZm9yayBcdTdFRTdcdTYyN0ZcdUZGMENcbiAgLy8gXHU3RUQzXHU2NzlDXHU3RUNGIHNlc3Npb24uaGlzdG9yeSBcdThGNkVcdThCRTJcdTU4OUVcdTkxQ0ZcdTU0NDhcdTczQjBcdUZGMDhcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdUZGMDlcbiAgY29uc3QgaG9zdEFwaSA9IChjdHguY29ubmVjdGlvbi5hcGkgYXMgbmV2ZXIpIGFzIHtcbiAgICBmb3JrKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSk6IFByb21pc2U8eyBzZXNzaW9uSWQ/OiBzdHJpbmcgfSB8IG51bGw+O1xuICAgIHNlbGVjdE1vZGVsKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmc7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgcHJvbXB0KHA6IHsgc2Vzc2lvbklkOiBzdHJpbmc7IG1vZGU6ICdxdWV1ZSc7IGNvbnRlbnQ6IEFycmF5PHsgdHlwZTogJ3RleHQnOyB0ZXh0OiBzdHJpbmcgfT4gfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgaGlzdG9yeShwOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pOiBQcm9taXNlPHsgZXZlbnRzPzogdW5rbm93biB9PjtcbiAgICBjYW5jZWwocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx1bmtub3duPjtcbiAgICBtb2RlbHMocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbiAgfTtcbiAgY29uc3QgZ2V0SG9zdCA9ICgpOiB7IGFwaTogdHlwZW9mIGhvc3RBcGk7IHBhcmVudFNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsID0+IHtcbiAgICBjb25zdCBwYXJlbnRTZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFwYXJlbnRTZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7IGFwaTogaG9zdEFwaSwgcGFyZW50U2Vzc2lvbklkIH07XG4gIH07XG5cbiAgLy8gMy4gXHU4QkVEXHU4QTAwXHU5NTVDXHU1MENGXG4gIGxldCBsYW5nOiBMYW5nID0gbGFuZ09mKGN0eC5sb2NhbGUuZ2V0TG9jYWxlKCkuYWN0aXZlKTtcbiAgY3R4Lm9uKCdsb2NhbGUvY2hhbmdlJywgKHNuYXA6IHsgYWN0aXZlOiBzdHJpbmcgfSkgPT4ge1xuICAgIGxhbmcgPSBsYW5nT2Yoc25hcC5hY3RpdmUpO1xuICB9KTtcblxuICAvLyA0LiBcdTRGMUFcdThCRERcdTY5RkRcdTRGNERcdUZGMUFcdTYzMDlcdTk0QUUgKyBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcbiAgY3R4LmluamVjdChbJ3Nsb3RzJywgJ3Nlc3Npb25zJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWJ1dHRvbicsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgb3BlblNldHRpbmdzOiAoKSA9PiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICAgIGdldFNlc3Npb25JZCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUHJldmlld0NhcmQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDYuIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYwOHJvb3QgXHU0RjVDXHU3NTI4XHU1N0RGXHVGRjA5XG4gIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSgpO1xuICBjb25zdCBzYXZlQ29uZmlnID0gYXN5bmMgKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VDb25maWcoeyAuLi5jb25maWdNaXJyb3IsIC4uLnJhdyB9KTtcbiAgICBjb25zdCB3cml0dGVuOiBQcm9tcHRDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiBtZXJnZWQuYmFzZVVybCxcbiAgICAgIGFwaUtleTogbWVyZ2VkLmFwaUtleS50cmltKCksXG4gICAgICBtb2RlbDogbWVyZ2VkLm1vZGVsLFxuICAgICAgdXNlU2Vzc2lvbk1vZGVsOiBtZXJnZWQudXNlU2Vzc2lvbk1vZGVsLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogd3JpdHRlbi5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogd3JpdHRlbi5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IHdyaXR0ZW4ubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB3cml0dGVuLnVzZVNlc3Npb25Nb2RlbCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZXNldENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LFxuICAgICAgICAgIG1vZGVsOiBERUZBVUxUUy5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcblxuICBjdHguaW5qZWN0KFsnc2xvdHMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItc2V0dGluZ3MnLFxuICAgICAgICAgIG9yZGVyOiAzMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIHN0b3JlOiBzZXR0aW5nc1N0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgc2F2ZUNvbmZpZyxcbiAgICAgICAgICAgIHJlc2V0Q29uZmlnLFxuICAgICAgICAgICAgZ2V0RXBvY2g6ICgpID0+IGNvbmZpZ0Vwb2NoLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBTZXR0aW5nc1JvdyxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNy4gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBQWx0K09cdUZGMDhcdTcxMjZcdTcwQjlcdTU3MjggdGV4dGFyZWEgXHU1MTg1XHU2NUY2XHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHVGRjA5XG4gIGNvbnN0IG9uS2V5ZG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKCFlLmFsdEtleSB8fCBlLmNvZGUgIT09ICdLZXlPJykgcmV0dXJuO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTtcbiAgfTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bik7XG59XG5cbi8vIFx1NUYxNVx1NzUyOFx1NUI4OFx1NTM2Qlx1RkYxQVx1OTA3Rlx1NTE0RCB0cmVlLXNoYWtlIFx1NjM4OVx1N0M3Qlx1NTc4Qlx1RkYwOFx1NEVDNVx1NjU4N1x1Njg2M1x1NjAyN1x1RkYxQlx1NjVFMFx1OEZEMFx1ODg0Q1x1NjVGNlx1ODg0Q1x1NEUzQVx1RkYwOVxuZXhwb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH07IiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2ODM4XHU1RkMzXHVGRjFBXHU5MTREXHU3RjZFXHU2ODIxXHU5QThDXHUzMDAxT3BlbkFJIFx1NTE3Q1x1NUJCOVx1OEMwM1x1NzUyOFx1MzAwMVx1N0VEM1x1Njc5Q1x1NjNEMFx1NTNENiBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU5NkY2IERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9tcHRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRTOiBQcm9tcHRDb25maWcgPSB7XG4gIGJhc2VVcmw6ICdodHRwczovL2FwaS5kZWVwc2Vlay5jb20nLFxuICBhcGlLZXk6ICcnLFxuICBtb2RlbDogJ2RlZXBzZWVrLXY0LWZsYXNoJyxcbiAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxufTtcblxuZXhwb3J0IHR5cGUgTGFuZyA9ICd6aCcgfCAnZW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQmFzZVVybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB1cmwudHJpbSgpLnJlcGxhY2UoL1xcLyskLywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VDb25maWcocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbXB0Q29uZmlnIHtcbiAgY29uc3QgYmFzZVVybCA9IHR5cGVvZiByYXc/LmJhc2VVcmwgPT09ICdzdHJpbmcnICYmIHJhdy5iYXNlVXJsLnRyaW0oKSA/IHJhdy5iYXNlVXJsLnRyaW0oKSA6IERFRkFVTFRTLmJhc2VVcmw7XG4gIGNvbnN0IGFwaUtleSA9IHR5cGVvZiByYXc/LmFwaUtleSA9PT0gJ3N0cmluZycgPyByYXcuYXBpS2V5IDogREVGQVVMVFMuYXBpS2V5O1xuICAvLyBcdTY1RTdcdTlFRDhcdThCQTRcdThGQzFcdTc5RkJcdUZGMUFcdTlFRDhcdThCQTQgYmFzZVVybCBcdTRFMEJcdTZCOEJcdTc1NTlcdTc2ODQgZGVlcHNlZWstY2hhdFx1RkYwOHYxIFx1OUVEOFx1OEJBNFx1RkYwOVx1ODlDNlx1NEUzQVx1NjcyQVx1OEJCRVx1N0Y2RVx1RkYwQ1x1ODQzRFx1NTIzMFx1NjVCMFx1OUVEOFx1OEJBNCBkZWVwc2Vlay12NC1mbGFzaFx1RkYxQlxuICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdThGQzcgYmFzZVVybFx1RkYwOFx1NjYzRVx1NUYwRlx1OTAwOVx1NjJFOVx1RkYwOVx1NTIxOVx1NEZERFx1NzU1OVx1NTM5Rlx1NkEyMVx1NTc4Qlx1NTQwRFxuICBjb25zdCByYXdNb2RlbCA9IHR5cGVvZiByYXc/Lm1vZGVsID09PSAnc3RyaW5nJyAmJiByYXcubW9kZWwudHJpbSgpID8gcmF3Lm1vZGVsLnRyaW0oKSA6IERFRkFVTFRTLm1vZGVsO1xuICBjb25zdCBtaWdyYXRlZERlZmF1bHQgPVxuICAgIHJhd01vZGVsID09PSAnZGVlcHNlZWstY2hhdCcgJiYgbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSA9PT0gREVGQVVMVFMuYmFzZVVybCA/IERFRkFVTFRTLm1vZGVsIDogcmF3TW9kZWw7XG4gIGNvbnN0IG1vZGVsID0gbWlncmF0ZWREZWZhdWx0O1xuICBjb25zdCB1c2VTZXNzaW9uTW9kZWwgPSB0eXBlb2YgcmF3Py51c2VTZXNzaW9uTW9kZWwgPT09ICdib29sZWFuJyA/IHJhdy51c2VTZXNzaW9uTW9kZWwgOiBERUZBVUxUUy51c2VTZXNzaW9uTW9kZWw7XG4gIHJldHVybiB7IGJhc2VVcmw6IG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCksIGFwaUtleSwgbW9kZWwsIHVzZVNlc3Npb25Nb2RlbCB9O1xufVxuXG5leHBvcnQgdHlwZSBDb25maWdQcm9ibGVtID0gJ21pc3Npbmcta2V5JyB8ICdtaXNzaW5nLW1vZGVsJyB8ICdiYWQtdXJsJztcbmV4cG9ydCB0eXBlIENvbmZpZ0NoZWNrID0geyBvazogdHJ1ZTsgY29uZmlnOiBQcm9tcHRDb25maWcgfSB8IHsgb2s6IGZhbHNlOyByZWFzb246IENvbmZpZ1Byb2JsZW0gfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQ29uZmlnKGNvbmZpZzogUHJvbXB0Q29uZmlnKTogQ29uZmlnQ2hlY2sge1xuICBpZiAoIWNvbmZpZy5hcGlLZXkudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3Npbmcta2V5JyB9O1xuICAvLyBcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTY1RjZcdTY1RTBcdTk3MDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMUJcdTRFQzVcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTVGMEZcdTg5ODFcdTZDNDIgbW9kZWwgXHU5NzVFXHU3QTdBXG4gIGlmICghY29uZmlnLnVzZVNlc3Npb25Nb2RlbCAmJiAhY29uZmlnLm1vZGVsLnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLW1vZGVsJyB9O1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKG5vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpKTtcbiAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ2JhZC11cmwnIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGNvbmZpZyB9O1xufVxuXG5jb25zdCBaSF9TWVNURU0gPVxuICAnXHU0RjYwXHU2NjJGXHU0RTAwXHU1NDBEIHByb21wdCBcdTRGMThcdTUzMTZcdTRFMTNcdTVCQjZcdTMwMDJcdTc1MjhcdTYyMzdcdTRGMUFcdTdFRDlcdTRGNjBcdTRFMDBcdTZCQjVcdTgzNDlcdTdBM0YgcHJvbXB0XHVGRjBDXHU4QkY3XHU1NzI4XHU0RTBEXHU2NTM5XHU1M0Q4XHU1MTc2XHU2MTBGXHU1NkZFXHU3Njg0XHU1MjREXHU2M0QwXHU0RTBCXHU1QzA2XHU1MTc2XHU2NTM5XHU1MTk5XHU0RTNBXHU2NkY0XHU2RTA1XHU2NjcwXHUzMDAxXHU2NkY0XHU3RUQzXHU2Nzg0XHU1MzE2XHU3Njg0XHU5QUQ4XHU4RDI4XHU5MUNGIHByb21wdFx1RkYxQScgK1xuICAnXHU4ODY1XHU1MTQ1XHU3RjNBXHU1OTMxXHU3Njg0XHU3NkVFXHU2ODA3XHUzMDAxXHU3RUE2XHU2NzVGXHU0RTBFXHU2NzFGXHU2NzFCXHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHVGRjA4XHU1M0VGXHU0RUNFXHU0RTBBXHU0RTBCXHU2NTg3XHU1NDA4XHU3NDA2XHU2M0E4XHU2NUFEXHVGRjA5XHVGRjBDXHU0RjdGXHU3NTI4XHU3QjgwXHU2RDAxXHU2NjBFXHU3ODZFXHU3Njg0XHU4QkVEXHU4QTAwXHVGRjBDXHU1M0JCXHU2Mzg5XHU1MTk3XHU0RjU5XHUzMDAyJyArXG4gICdcdTRFMERcdTVGOTdcdTdGMTZcdTkwMjBcdTgzNDlcdTdBM0ZcdTRFMkRcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTRFOEJcdTVCOUVcdTYyMTZcdTYyODBcdTY3MkZcdTdFQzZcdTgyODJcdTMwMDJcdTUzRUFcdThGOTNcdTUxRkFcdTRGMThcdTUzMTZcdTU0MEVcdTc2ODQgcHJvbXB0IFx1NkI2M1x1NjU4N1x1RkYwQ1x1NEUwRFx1ODk4MVx1NEVGQlx1NEY1NVx1ODlFM1x1OTFDQVx1MzAwMVx1NTI0RFx1N0YwMFx1NjIxNlx1NEVFM1x1NzgwMVx1NTc1N1x1NTMwNVx1ODhGOVx1MzAwMic7XG5cbmNvbnN0IEVOX1NZU1RFTSA9XG4gICdZb3UgYXJlIGEgcHJvbXB0IG9wdGltaXphdGlvbiBleHBlcnQuIFJld3JpdGUgdGhlIHVzZXJcXCdzIGRyYWZ0IHByb21wdCBpbnRvIGEgY2xlYXJlciwgbW9yZSBzdHJ1Y3R1cmVkLCBoaWdoLXF1YWxpdHkgcHJvbXB0ICcgK1xuICAnd2l0aG91dCBjaGFuZ2luZyBpdHMgaW50ZW50OiBmaWxsIGluIG1pc3NpbmcgZ29hbHMsIGNvbnN0cmFpbnRzLCBhbmQgZXhwZWN0ZWQgb3V0cHV0IGZvcm1hdCB3aGVuIHJlYXNvbmFibHkgaW5mZXJhYmxlLCAnICtcbiAgJ3VzZSBjb25jaXNlIGFuZCBwcmVjaXNlIGxhbmd1YWdlLCBhbmQgcmVtb3ZlIHJlZHVuZGFuY3kuIERvIG5vdCBpbnZlbnQgZmFjdHMgb3IgdGVjaG5pY2FsIGRldGFpbHMgYWJzZW50IGZyb20gdGhlIGRyYWZ0LiAnICtcbiAgJ091dHB1dCBPTkxZIHRoZSBvcHRpbWl6ZWQgcHJvbXB0IHRleHQsIHdpdGggbm8gZXhwbGFuYXRpb25zLCBwcmVmaXhlcywgb3IgY29kZSBmZW5jZXMuJztcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmc6IExhbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbGFuZyA9PT0gJ3poJyA/IFpIX1NZU1RFTSA6IEVOX1NZU1RFTTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnOiBQcm9tcHRDb25maWcsIHRleHQ6IHN0cmluZywgbGFuZzogTGFuZywgc3RyZWFtID0gZmFsc2UpOiBvYmplY3Qge1xuICByZXR1cm4ge1xuICAgIG1vZGVsOiBjb25maWcubW9kZWwsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmcpIH0sXG4gICAgICB7IHJvbGU6ICd1c2VyJywgY29udGVudDogdGV4dCB9LFxuICAgIF0sXG4gICAgdGVtcGVyYXR1cmU6IDAuNyxcbiAgICBtYXhfdG9rZW5zOiAyMDQ4LFxuICAgIHN0cmVhbSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSZXN1bHQocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcyA9IHJhdy50cmltKCk7XG4gIGNvbnN0IGZlbmNlID0gL15gYGBbYS16QS1aMC05XystXSpcXG4oW1xcc1xcU10qPylcXG4/YGBgJC87XG4gIGNvbnN0IG1hdGNoZWQgPSBzLm1hdGNoKGZlbmNlKTtcbiAgaWYgKG1hdGNoZWQpIHMgPSBtYXRjaGVkWzFdLnRyaW0oKTtcbiAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5UcmlnZ2VyKGRyYWZ0OiBzdHJpbmcsIGJ1c3k6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuICFidXN5ICYmIGRyYWZ0LnRyaW0oKS5sZW5ndGggPiAwO1xufVxuXG5leHBvcnQgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCA9XG4gIHwgJ2NvbmZpZydcbiAgfCAndW5hdXRob3JpemVkJ1xuICB8ICdmb3JiaWRkZW4nXG4gIHwgJ2h0dHAnXG4gIHwgJ3RpbWVvdXQnXG4gIHwgJ25ldHdvcmsnXG4gIHwgJ2NvcnMnXG4gIHwgJ2JhZC1yZXNwb25zZSdcbiAgfCAnZW1wdHknO1xuXG5leHBvcnQgY2xhc3MgT3B0aW1pemVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ09wdGltaXplRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVRfTVMgPSA2MF8wMDA7XG5cbmZ1bmN0aW9uIGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQ6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgbWVzc2FnZT86IHsgY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBjb250ZW50ID0gZmlyc3Q/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycgPyBjb250ZW50IDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JLaW5kKGU6IHVua25vd24pOiBPcHRpbWl6ZUVycm9yIHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBPcHRpbWl6ZUVycm9yKSByZXR1cm4gZTtcbiAgY29uc3QgaXNBYm9ydCA9XG4gICAgKHR5cGVvZiBET01FeGNlcHRpb24gIT09ICd1bmRlZmluZWQnICYmIGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiAoZSBhcyBFcnJvcikubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgaWYgKGlzQWJvcnQpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcigndGltZW91dCcsICdyZXF1ZXN0IGFib3J0ZWQnKTtcbiAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICBjb25zdCBtID0gU3RyaW5nKGUubWVzc2FnZSA/PyAnJyk7XG4gICAgLy8gXHU1QzNEXHU1MjlCXHU4MDBDXHU0RTNBXHVGRjFBQ2hyb21pdW0gXHU3Njg0IENPUlMgXHU1OTMxXHU4RDI1XHU5MDFBXHU1RTM4XHU2NjJGIFR5cGVFcnJvcihcIkZhaWxlZCB0byBmZXRjaFwiKVx1RkYwOFx1NjVFMCBjb3JzIFx1NUI1N1x1NjgzN1x1RkYwOVx1RkYwQ1x1NEYxQVx1ODQzRFx1NTIzMCBuZXR3b3JrXHVGRjFCXHU2QjY0XHU1MjA2XHU2NTJGXHU0RUM1XHU2MzU1XHU4M0I3XHU4MUVBXHU1RTI2IENPUlMgXHU1QjU3XHU2ODM3XHU3Njg0XHU5NTE5XHU4QkVGXHUzMDAyXG4gICAgaWYgKC9jb3JzL2kudGVzdChtKSkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCdjb3JzJywgbSk7XG4gICAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgbSB8fCAnbmV0d29yayBlcnJvcicpO1xuICB9XG4gIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIFN0cmluZygoZSBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemUob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsIH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcblxuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdpbnZhbGlkIEpTT04nKTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZCk7XG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBleHRyYWN0UmVzdWx0KGNvbnRlbnQpO1xufVxuXG4vKipcbiAqIFNTRSBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUFcdTUxODVcdTVCQjlcdTYyMTZcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdTc2ODRcdTRFMDBcdTZCQjVcdTY1ODdcdTY3MkNcdTMwMDJcbiAqIHY0IFx1N0NGQlx1NkEyMVx1NTc4Qlx1RkYwOHY0LWZsYXNoIFx1N0I0OVx1RkYwOVx1NkQ0MVx1NUYwRlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNSByZWFzb25pbmdfY29udGVudFx1RkYwOFx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwOVx1RkYwQ1x1OTY4Rlx1NTQwRVx1NjI0RFx1OEY5M1x1NTFGQVxuICogY29udGVudCBcdTZCNjNcdTY1ODdcdTIwMTRcdTIwMTRcdTRFMjRcdTgwMDVcdTkwRkRcdTg5ODFcdTVCOUVcdTY1RjZcdTU0NDhcdTczQjBcdUZGMENcdTU0MjZcdTUyMTlcdTYzQThcdTc0MDZcdTY3MUZcdTUzNjFcdTcyNDdcdTc3MEJcdThENzdcdTY3NjVcdTUwQ0ZcdTMwMENcdTk3NUVcdTZENDFcdTVGMEZcdTMwMERcdUZGMDhcdTVCOUVcdTZENEIgfjgwIFx1NEUyQSBjaHVua1xuICogXHU1MTY4XHU2NjJGIHJlYXNvbmluZ1x1RkYwQ1x1NkI2M1x1NjU4N1x1NjcwMFx1NTQwRVx1NjI0RFx1NTFGQVx1NzNCMFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgdHlwZSBTc2VEZWx0YSA9XG4gIHwgeyBraW5kOiAnY29udGVudCc7IHRleHQ6IHN0cmluZyB9XG4gIHwgeyBraW5kOiAncmVhc29uaW5nJzsgdGV4dDogc3RyaW5nIH07XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHU0RTAwXHU4ODRDIFNTRSBcdTY1NzBcdTYzNkVcdUZGMUEoZGF0YTogey4uLn0pIFx1MjE5MiBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUJcbiAqIFtET05FXS9cdTk3NUUgZGF0YSBcdTg4NEMvXHU5NzVFIEpTT04vXHU2NUUwXHU1MTg1XHU1QkI5IGRlbHRhIFx1MjE5MiBudWxsXHUzMDAyXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3NlRGVsdGEobGluZTogc3RyaW5nKTogU3NlRGVsdGEgfCBudWxsIHtcbiAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQuc3RhcnRzV2l0aCgnZGF0YTonKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGRhdGEgPSB0cmltbWVkLnNsaWNlKCdkYXRhOicubGVuZ3RoKS50cmltKCk7XG4gIGlmIChkYXRhID09PSAnW0RPTkVdJykgcmV0dXJuIG51bGw7XG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBkZWx0YT86IHsgY29udGVudD86IHVua25vd247IHJlYXNvbmluZ19jb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGRlbHRhID0gZmlyc3Q/LmRlbHRhO1xuICBpZiAodHlwZW9mIGRlbHRhPy5jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ2NvbnRlbnQnLCB0ZXh0OiBkZWx0YS5jb250ZW50IH07XG4gIGlmICh0eXBlb2YgZGVsdGE/LnJlYXNvbmluZ19jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ3JlYXNvbmluZycsIHRleHQ6IGRlbHRhLnJlYXNvbmluZ19jb250ZW50IH07XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1RkYxQVx1OTAxMFx1NTc1N1x1ODlFM1x1Njc5MCBTU0VcdUZGMENcdThGQjlcdTY1MzZcdThGQjlcdTU2REVcdThDMDMgb25UZXh0KGRlbHRhKVx1RkYxQlx1OEZENFx1NTZERVx1NUI4Q1x1NjU3NFx1NkI2M1x1NjU4N1x1MzAwMlxuICogXHU3NkY4XHU2QkQ0XHU5NzVFXHU2RDQxXHU1RjBGIG9wdGltaXplKClcdUZGMUFcdTk5OTZcdTVCNTdcdTY2RjRcdTVGRUJcdTMwMDFcdTk1N0ZcdThGOTNcdTUxRkFcdTRFMERcdTk3MDBcdTg5ODFcdTdCNDlcdTVCOENcdTY1NzRcdTc1MUZcdTYyMTBcdTIwMTRcdTIwMTRcdTYzMDlcdTk0QUUvXHU1MzYxXHU3MjQ3XHU4MEZEXHU4RkI5XHU3NTFGXHU2MjEwXHU4RkI5XHU2NjNFXHU3OTNBXHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZVN0cmVhbShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBvbkV2ZW50PzogKGRlbHRhOiBTc2VEZWx0YSkgPT4gdm9pZDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsLCBvbkV2ZW50IH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcsIHRydWUpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgaWYgKCFyZXMuYm9keSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdtaXNzaW5nIHJlc3BvbnNlIGJvZHknKTtcblxuICBjb25zdCByZWFkZXIgPSByZXMuYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBsZXQgYnVmZmVyID0gJyc7XG4gIGxldCBmdWxsID0gJyc7XG4gIHRyeSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICBpZiAoZG9uZSkgYnJlYWs7XG4gICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xuICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoJ1xcbicpO1xuICAgICAgYnVmZmVyID0gbGluZXMucG9wKCkgPz8gJyc7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEobGluZSk7XG4gICAgICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHRyeSB7XG4gICAgICByZWFkZXIucmVsZWFzZUxvY2soKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NURGMlx1NEUyRFx1NkI2Mi9cdTkxQ0FcdTY1M0VcdTY1RjZcdTVGRkRcdTc1NjVcbiAgICB9XG4gIH1cbiAgLy8gXHU1QzNFXHU4ODRDXHVGRjA4XHU2NUUwXHU2MzYyXHU4ODRDXHU3RUQzXHU1QzNFXHU3Njg0IGRhdGEgXHU4ODRDXHVGRjA5XG4gIGlmIChidWZmZXIudHJpbSgpKSB7XG4gICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEoYnVmZmVyKTtcbiAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RSZXN1bHQoZnVsbCk7XG4gIGlmICghY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1MzAwQ1x1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1MzAwRFx1RkYxQVx1OEMwMyBjb25uZWN0aW9uIFx1NzY4NCBzZXNzaW9uLm1vZGVscyBSUENcdUZGMENcdTUzRDYgY3VycmVudC5tb2RlbFx1MzAwMlxuICogYXBpIFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwOFx1NEUwRSBEU0ggXHU4OUUzXHU4MDI2XHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHVGRjFCXHU0RUZCXHU0RjU1XHU1OTMxXHU4RDI1XHU4RkQ0XHU1NkRFIG51bGxcdUZGMDhcdTc1MzFcdThDMDNcdTc1MjhcdTY1QjlcdTU2REVcdTkwMDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTZXNzaW9uTW9kZWwoXG4gIGFwaTpcbiAgICB8IHtcbiAgICAgICAgc2Vzc2lvbnM/OiB7XG4gICAgICAgICAgbW9kZWxzPzogKHBheWxvYWQ/OiB1bmtub3duLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IG1vZGVsPzogc3RyaW5nIH0gfSB8IG51bGw+O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIHwgdW5kZWZpbmVkLFxuICBwYXlsb2FkOiB1bmtub3duID0ge30sXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgLy8gXHU1RkM1XHU5ODdCXHU2NDNBXHU1RTI2IHNlc3Npb25JZFx1RkYxQXNlcnZlciBcdTdBRUZcdTYzMDkgcmVxdWVzdC5wYXlsb2FkLnNlc3Npb25JZCBcdTY3RTVcdThCRTVcdTRGMUFcdThCRERcdTVERjJcdTkwMDlcdTYyRTlcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMENcbiAgICAvLyBcdTdGM0FcdTU5MzFcdTY1RjZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdUZGMDhkZWVwc2Vlay12NC1mbGFzaFx1RkYwOVx1ODAwQ1x1OTc1RVx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaT8uc2Vzc2lvbnM/Lm1vZGVscz8uKHBheWxvYWQsIHNpZ25hbCk7XG4gICAgY29uc3QgbSA9IHJlcz8uY3VycmVudD8ubW9kZWw7XG4gICAgcmV0dXJuIHR5cGVvZiBtID09PSAnc3RyaW5nJyAmJiBtLnRyaW0oKSA/IG0udHJpbSgpIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjNEMlx1NEVGNlx1NjU4N1x1Njg0OCBcdTIwMTQgXHU0RTJEXHU4MkYxXHU1M0NDXHU4QkVEICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuZXhwb3J0IGNvbnN0IE5TID0gJ3Byb21wdF9vcHRpbWl6ZXInO1xuXG5leHBvcnQgY29uc3QgemggPSB7XG4gICdidXR0b24uYXJpYSc6ICdcdTRGMThcdTUzMTYgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnXHU0RjE4XHU1MzE2XHU3RUQzXHU2NzlDJyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdcdTY2RkZcdTYzNjJcdTgzNDlcdTdBM0YnLFxuICAnY2FyZC5jb3B5JzogJ1x1NTkwRFx1NTIzNicsXG4gICdjYXJkLmNvcHlEb25lJzogJ1x1NURGMlx1NTkwRFx1NTIzNicsXG4gICdjYXJkLnJldHJ5JzogJ1x1OTFDRFx1NjVCMFx1NEYxOFx1NTMxNicsXG4gICdjYXJkLmRpc21pc3MnOiAnXHU2NTNFXHU1RjAzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnXHU1REYyXHU5MTREXHU3RjZFIFx1MDBCNyBcdTZBMjFcdTU3OEIge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ1x1NjcyQVx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUudGl0bGUnOiAnXHU4QkY3XHU1MTQ4XHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS5kZXNjJzogJ1x1NTI0RFx1NUY4MCBcdThCQkVcdTdGNkUgXHUyMTkyIFx1OTAxQVx1NzUyOFx1OEJCRVx1N0Y2RSBcdTIxOTIgUHJvbXB0IFx1NEYxOFx1NTMxNlx1RkYwQ1x1NTg2Qlx1NTE5OVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MFx1MzAwMUFQSSBLZXkgXHU0RTBFXHU2QTIxXHU1NzhCXHU1NDBEXHUzMDAyJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdcdTUzQkJcdThCQkVcdTdGNkUnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdcdTc3RTVcdTkwNTNcdTRFODYnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBLZXkgXHU2NUUwXHU2NTQ4XHU2MjE2XHU1REYyXHU4RkM3XHU2NzFGJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdcdTY3MERcdTUyQTFcdTYyRDJcdTdFRERcdThCQkZcdTk1RUVcdUZGMDg0MDNcdUZGMDknLFxuICAnZXJyb3IudGltZW91dCc6ICdcdThCRjdcdTZDNDJcdThEODVcdTY1RjZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IubmV0d29yayc6ICdcdTdGNTFcdTdFRENcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IuY29ycyc6ICdcdTYzQTVcdTUzRTNcdTRFMERcdTY1MkZcdTYzMDFcdThERThcdTU3REZcdUZGMENcdThCRjdcdTYzNjJcdTc1MjhcdTY1MkZcdTYzMDEgQ09SUyBcdTc2ODRcdTdGNTFcdTUxNzMnLFxuICAnZXJyb3IuaHR0cCc6ICdcdThCRjdcdTZDNDJcdTU5MzFcdThEMjVcdUZGMDhIVFRQIFx1OTUxOVx1OEJFRlx1RkYwOScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU2ODNDXHU1RjBGXHU1RjAyXHU1RTM4JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NEUzQVx1N0E3QVx1RkYwQ1x1OEJGN1x1OTFDRFx1OEJENScsXG4gICdlcnJvci5jb25maWcnOiAnXHU5MTREXHU3RjZFXHU0RTBEXHU1QjhDXHU2NTc0XHVGRjBDXHU4QkY3XHU1MjMwXHU4QkJFXHU3RjZFXHU0RTJEXHU2OEMwXHU2N0U1JyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBcdTRGMThcdTUzMTYnLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdcdTkxNERcdTdGNkVcdTZEQTZcdTgyNzJcdTYzQTVcdTUzRTNcdUZGMDhPcGVuQUkgXHU1MTdDXHU1QkI5XHVGRjA5XHVGRjFCS2V5IFx1NjYwRVx1NjU4N1x1NEZERFx1NUI1OFx1NTcyOFx1NjcyQ1x1NTczMCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ1x1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1x1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1x1NUYwMFx1NTQyRlx1NjVGNlx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1OERERlx1OTY4Rlx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQlx1NTE3M1x1OTVFRFx1NTQwRVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJzogJ1x1NURGMlx1OTAwOVx1NjJFOVx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy5zYXZlJzogJ1x1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdcdTYwNjJcdTU5MERcdTlFRDhcdThCQTQnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnXHU1REYyXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnXHU0RkREXHU1QjU4XHU1OTMxXHU4RDI1JyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1x1OTFDRFx1N0Y2RVx1NTkzMVx1OEQyNScsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IGNvbnN0IGVuOiBMb2NhbGVEaWN0ID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnT3B0aW1pemUgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnT3B0aW1pemVkIHByb21wdCcsXG4gICdjYXJkLnJlcGxhY2UnOiAnVXNlIGRyYWZ0JyxcbiAgJ2NhcmQuY29weSc6ICdDb3B5JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnQ29waWVkJyxcbiAgJ2NhcmQucmV0cnknOiAnUmV0cnknLFxuICAnY2FyZC5kaXNtaXNzJzogJ0Rpc21pc3MnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ09wdGltaXppbmdcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnQ29uZmlndXJlZCBcdTAwQjcgbW9kZWwge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ05vIEFQSSBjb25maWd1cmVkJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ0NvbmZpZ3VyZSB0aGUgQVBJIGZpcnN0JyxcbiAgJ2d1aWRlLmRlc2MnOiAnR28gdG8gU2V0dGluZ3MgXHUyMTkyIEdlbmVyYWwgXHUyMTkyIFByb21wdCBPcHRpbWl6ZXIgYW5kIGZpbGwgaW4gdGhlIGVuZHBvaW50LCBBUEkga2V5LCBhbmQgbW9kZWwuJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdHbyB0byBzZXR0aW5ncycsXG4gICdndWlkZS5kaXNtaXNzJzogJ0dvdCBpdCcsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIGtleSBpcyBpbnZhbGlkIG9yIGV4cGlyZWQnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ0FjY2VzcyBmb3JiaWRkZW4gKDQwMyknLFxuICAnZXJyb3IudGltZW91dCc6ICdSZXF1ZXN0IHRpbWVkIG91dDsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ05ldHdvcmsgZXJyb3I7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IuY29ycyc6ICdFbmRwb2ludCBibG9ja3MgQ09SUzsgdXNlIGEgZ2F0ZXdheSB0aGF0IGFsbG93cyBpdCcsXG4gICdlcnJvci5odHRwJzogJ1JlcXVlc3QgZmFpbGVkIChIVFRQIGVycm9yKScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnVW5leHBlY3RlZCByZXNwb25zZSBmb3JtYXQnLFxuICAnZXJyb3IuZW1wdHknOiAnRW1wdHkgcmVzdWx0OyBwbGVhc2UgcmV0cnknLFxuICAnZXJyb3IuY29uZmlnJzogJ0luY29tcGxldGUgY29uZmlndXJhdGlvbjsgY2hlY2sgc2V0dGluZ3MnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IE9wdGltaXplcicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ0NvbmZpZ3VyZSB0aGUgcmV3cml0ZSBlbmRwb2ludCAoT3BlbkFJLWNvbXBhdGlibGUpOyBrZXkgaXMgc3RvcmVkIGxvY2FsbHkgaW4gcGxhaW4gdGV4dCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ0Jhc2UgVVJMJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ01vZGVsJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCc6ICdVc2UgY3VycmVudCBzZXNzaW9uIG1vZGVsJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnV2hlbiBvbiwgb3B0aW1pemF0aW9uIHJlcXVlc3RzIGZvbGxvdyB0aGUgc2Vzc2lvbiBtb2RlbDsgd2hlbiBvZmYsIHRoZSBjdXN0b20gbW9kZWwgYmVsb3cgaXMgdXNlZCcsXG4gICdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJzogJ1Nlc3Npb24gZGVmYXVsdCBtb2RlbCBzZWxlY3RlZCcsXG4gICdzZXR0aW5ncy5zYXZlJzogJ1NhdmUnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnUmVzZXQgdG8gZGVmYXVsdHMnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnU2F2ZWQnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdTYXZlIGZhaWxlZCcsXG4gICdzZXR0aW5ncy5yZXNldEZhaWxlZCc6ICdSZXNldCBmYWlsZWQnLFxuICBcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIExvY2FsZUtleSA9IGtleW9mIHR5cGVvZiB6aDtcbmV4cG9ydCB0eXBlIExvY2FsZURpY3QgPSB7IFtLIGluIExvY2FsZUtleV06IHN0cmluZyB9O1xuXG4vKiogXHU2RkMwXHU2RDNCIGxvY2FsZSBcdTIxOTIgXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwXHVGRjA4emggXHU1MjREXHU3RjAwXHU1RjUyIHpoXHVGRjBDXHU1MTc2XHU0RjU5XHU1RjUyIGVuXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZ09mKGFjdGl2ZTogc3RyaW5nKTogTGFuZyB7XG4gIHJldHVybiB0eXBlb2YgYWN0aXZlID09PSAnc3RyaW5nJyAmJiBhY3RpdmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCd6aCcpID8gJ3poJyA6ICdlbic7XG59XG4iLCAiLyoqIFx1NjNEMlx1NEVGNlx1NTE4NVx1OTBFOFx1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRlx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYxQlx1OTA3Rlx1NTE0RCBpbmRleCBcdTIxOTQgXHU3RUM0XHU0RUY2XHU1RkFBXHU3M0FGXHU0RjlEXHU4RDU2XHVGRjA5XHVGRjFBXG4gKiAgLSBvcHRpbWl6ZVJlcXVlc3RcdUZGMUFcdTVGRUJcdTYzNzdcdTk1MkUgQWx0K08gXHUyMTkyIFx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1ODlFNlx1NTNEMVxuICogIC0gb3BlblNldHRpbmdzUmVxdWVzdFx1RkYxQVx1OTg4NFx1ODlDOFx1NTM2MVx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1MjE5MiBcdThCQkVcdTdGNkVcdTg4NENcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDAgKi9cblxuY29uc3Qgb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gb25PcHRpbWl6ZVJlcXVlc3QoZm46ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzLmFkZChmbik7XG4gIHJldHVybiAoKSA9PiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuZGVsZXRlKGZuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzKSBmbigpO1xufVxuXG5jb25zdCBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoZm46ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgb3BlblNldHRpbmdzTGlzdGVuZXJzLmFkZChmbik7XG4gIHJldHVybiAoKSA9PiBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuZGVsZXRlKGZuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGZuIG9mIG9wZW5TZXR0aW5nc0xpc3RlbmVycykgZm4oKTtcbn1cbiIsICIvKiogXHU4RjkzXHU1MTY1XHU2ODBGXHU1M0YzXHU0RkE3XHUzMDBDXHU0RjE4XHU1MzE2XHUzMDBEXHU2MzA5XHU5NEFFIFx1MjAxNFx1MjAxNCBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwQ1x1NzJCNlx1NjAwMVx1OEQ3MFx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRiAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZ2V0UHJldmlld0J1c1N0YXRlLCBzdWJzY3JpYmVQcmV2aWV3QnVzIH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5pbXBvcnQgeyBvbk9wdGltaXplUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBPcHRpbWl6ZUJ1dHRvblByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBnZXRTZXNzaW9uTW9kZWw/OiAoKSA9PiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuICBnZXRIb3N0PzogKCkgPT4geyBhcGk6IHVua25vd247IHBhcmVudFNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsO1xuICBnZXRTZXNzaW9uSWQ/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjFBXHU0RjE4XHU1MTQ4XHU1M0Q2XHU3MTI2XHU3MEI5IHRleHRhcmVhXHVGRjFCXHU1NDI2XHU1MjE5XHU1NkRFXHU5MDAwXHU1MjMwXHU5ODc1XHU5NzYyXHU0RTJEXHUzMDBDXHU1MDNDXHU5NzVFXHU3QTdBXHUzMDBEXHU3Njg0IHRleHRhcmVhXG4gKiBcdUZGMDhcdTc1MjhcdTYyMzdcdTU3MjhcdThGOTNcdTUxNjVcdTc2ODRcdTUzNzNcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMDlcdTMwMDJcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NzY4NCBpbnB1dCBob29rXHUyMDE0XHUyMDE0XHU1QjlFXHU2RDRCXG4gKiBpbnB1dC5yaWdodCBcdTZFMzJcdTY3RDNcdTY1RjZcdThCRTVcdTY4MDdcdTUxQzYgcHJvcHMgXHU2NzJBXHU2M0QwXHU0RjlCXHVGRjBDXHU3RUM0XHU0RUY2XHU0RjFBXHU1NkUwXHU4QzAzXHU3NTI4IHVuZGVmaW5lZCBob29rXG4gKiBcdTVEMjlcdTZFODNcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdUZGMDhQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4IFx1NEUwRFx1NTNFRlx1ODlDMVx1RkYwOVx1MzAwMlxuICovXG5mdW5jdGlvbiByZWFkRHJhZnQoKTogc3RyaW5nIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHJldHVybiBhY3RpdmUudmFsdWU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKHRhLnZhbHVlLnRyaW0oKSkgcmV0dXJuIHRhLnZhbHVlO1xuICB9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU3RTQxXHU1RkQ5XHU2MDAxXHVGRjFBXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XHVGRjFCXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1MjAxNFx1MjAxNFx1NTIwN1x1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NjMwOVx1OTRBRVx1NEUwRFx1NTE4RCBidXN5XHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHVGRjA5XG4gIGNvbnN0IGJ1c3lGb3IgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSBnZXRQcmV2aWV3QnVzU3RhdGUoKTtcbiAgICBpZiAoc3Quc3RhdHVzICE9PSAnb3B0aW1pemluZycpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzaWQgPSBnZXRTZXNzaW9uSWQ/LigpO1xuICAgIHJldHVybiBzdC5zZXNzaW9uSWQgPT09IG51bGwgfHwgc3Quc2Vzc2lvbklkID09PSBzaWQ7XG4gIH07XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKGJ1c3lGb3IpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRCdXN5KGJ1c3lGb3IoKSkpLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGJ1c3kpIHJldHVybjtcbiAgICBjb25zdCBkcmFmdCA9IGRyYWZ0UmVmLmN1cnJlbnQgfHwgcmVhZERyYWZ0KCk7XG4gICAgaWYgKCFkcmFmdC50cmltKCkpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gZHJhZnQsXG4gICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICBnZXRIb3N0LFxuICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgIH0pO1xuICB9LCBbYnVzeSwgZ2V0Q29uZmlnLCBnZXRMYW5nXSk7XG5cbiAgLy8gQWx0K08gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjA4aW5kZXgudHMgXHU1MTY4XHU1QzQwXHU3NkQxXHU1NDJDXHVGRjA5XHUyMTkyIFx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcHRpbWl6ZVJlcXVlc3QoaGFuZGxlQ2xpY2spLCBbaGFuZGxlQ2xpY2tdKTtcblxuICByZXR1cm4gKFxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPVwiZHNoLXBvLWJ0blwiXG4gICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgdGl0bGU9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICBhcmlhLWJ1c3k9e2J1c3l9XG4gICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgIGRhdGEtYnVzeT17YnVzeX1cbiAgICAgIG9uTW91c2VEb3duPXtzeW5jRHJhZnR9XG4gICAgICBvbkZvY3VzPXtzeW5jRHJhZnR9XG4gICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICA+XG4gICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgPC9idXR0b24+XG4gICk7XG59IiwgIi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RjE4XHU1MzE2XHVGRjA4XHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREICsgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NTZFMFx1NkI2NFx1NkJDRlx1NkIyMVx1NEYxOFx1NTMxNlx1NEVDRVx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERCBmb3JrIFx1NEUwMFx1NEUyQVx1NEUzNFx1NjVGNlx1NUI1MFx1NEYxQVx1OEJERFx1RkYxQVxuICogICBzZXNzaW9uLmZvcmtcdUZGMDhcdTVCQkZcdTRFM0JcdTc1MUZcdTYyMTBcdTU0MDhcdTZDRDUgc2Vzc2lvbklkXHVGRjBDXHU3RUU3XHU2MjdGXHU2QTIxXHU1NzhCL1x1NURFNVx1NEY1Q1x1NTMzQVx1RkYwOVx1MjE5MiBzZXNzaW9uLnByb21wdFx1RkYwOHF1ZXVlIFx1NkNFOFx1NTE2NVx1NUUyNlx1ODlDNFx1NTIxOVx1NzY4NFx1NjU4N1x1NjcyQ1x1RkYwOVxuICogICBcdTIxOTIgXHU4RjZFXHU4QkUyIHNlc3Npb24uaGlzdG9yeSBcdTU4OUVcdTkxQ0ZcdTUzRDZcdTZCNjNcdTY1ODdcdUZGMDhcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdUZGMDlcbiAqICAgXHUyMTkyIGFzc2lzdGFudC9tZXNzYWdlIFx1NEU4Qlx1NEVGNlx1NTFGQVx1NzNCMFx1RkYwOFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOVx1NjIxNlx1OEZERVx1N0VFRFx1NjVFMFx1NTNEOFx1NTMxNlx1RkYwOHNldHRsZVx1RkYwOVx1N0VEM1x1Njc1Rlx1RkYxQlx1NEUyRFx1NkI2Mlx1OEQ3MCBzZXNzaW9uLmNhbmNlbFx1MzAwMlxuICogICBcdTRFMERcdTc1Mjggc2Vzc2lvbi5jcmVhdGVcdUZGMUFcdTgxRUFcdTdGMTYgc2Vzc2lvbklkIFx1NEYxQVx1ODhBQlx1NUJCRlx1NEUzQlx1NjJEMlx1N0VERFx1RkYwQ2NyZWF0ZSBcdTk3NTlcdTlFRDhcdTU5MzFcdThEMjVcdTVCRkNcdTgxRjRcdTdBN0FcdThGNkVcdThCRTJcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAqXG4gKiBcdTRFOEJcdTRFRjZcdTU5NTFcdTdFQTZcdTRFRTVcdTc3MUZcdTVCOUVcdTYzMDFcdTRFNDVcdTUzMTZcdTY4MzdcdTY3MkNcdTY4MjFcdTUxQzZcdUZGMDh+Ly5kc2gvc2Vzc2lvbnMgXHU0RTBCXHU1NDA0IHNlc3Npb24gXHU3NkVFXHU1RjU1XHU3Njg0IHNlc3Npb24uanNvbmwuenN0ZFx1RkYwOVx1RkYxQVxuICogICAtIHVzZXIgXHU2RDg4XHU2MDZGXHVGRjFBe3R5cGU6J3VzZXIvbWVzc2FnZScsIGRhdGE6e3JvbGU6J3VzZXInLCBjb250ZW50Olt7dHlwZTondGV4dCcsdGV4dH1dfX1cbiAqICAgLSBcdTUyQTlcdTYyNEJcdTZENDFcdTVGMEZcdTU4OUVcdTkxQ0ZcdUZGMUF7dHlwZTonYXNzaXN0YW50L2NodW5rJywgZGF0YTp7Y2h1bms6e3R5cGU6J2RlbHRhJywgYmxvY2tUeXBlOid0ZXh0JywgdGV4dH19fVxuICogICAtIFx1NTJBOVx1NjI0Qlx1NkQ4OFx1NjA2Rlx1NUI4Q1x1NjIxMFx1RkYxQXt0eXBlOidhc3Npc3RhbnQvbWVzc2FnZScsIGRhdGE6e21lc3NhZ2U6e3JvbGUsIGNvbnRlbnQ6Wy4uLl19fX1cdUZGMDhcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMDlcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBidWlsZFN5c3RlbVByb21wdCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuLyoqIGNvbm5lY3Rpb24uYXBpLnNlc3Npb25zIFx1NzY4NFx1NjcwMFx1NUMwRlx1OTc2Mlx1RkYwOFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0U2Vzc2lvbkFwaSB7XG4gIC8qKiBcdTRFQ0VcdTVGNTNcdTUyNERcdTRGMUFcdThCREQgZm9yayBcdTRFMzRcdTY1RjZcdTVCNTBcdTRGMUFcdThCRERcdUZGMDhcdTVCQkZcdTRFM0JcdTc1MUZcdTYyMTBcdTU0MDhcdTZDRDUgc2Vzc2lvbklkXHVGRjFCXHU2QkNGXHU2QjIxXHU0RjE4XHU1MzE2XHU0RTAwXHU0RTJBXHU1RTcyXHU1MUMwXHU0RjFBXHU4QkREXHVGRjA5ICovXG4gIGZvcms/OiAocGF5bG9hZDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgYXRTZXE/OiBudW1iZXIgfSkgPT4gUHJvbWlzZTx7IHNlc3Npb25JZD86IHN0cmluZyB9IHwgbnVsbD47XG4gIHNlbGVjdE1vZGVsPzogKHBheWxvYWQ6IHtcbiAgICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgICBwcm92aWRlcjogc3RyaW5nO1xuICAgIG1vZGVsOiBzdHJpbmc7XG4gICAgcmVhc29uaW5nRWZmb3J0Pzogc3RyaW5nO1xuICB9KSA9PiBQcm9taXNlPHVua25vd24+O1xuICBwcm9tcHQ/OiAocGF5bG9hZDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgbW9kZTogJ3F1ZXVlJyB8ICdzdGVlcic7IGNvbnRlbnQ6IEFycmF5PHsgdHlwZTogJ3RleHQnOyB0ZXh0OiBzdHJpbmcgfT4gfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgaGlzdG9yeT86IChwYXlsb2FkOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pID0+IFByb21pc2U8eyBldmVudHM/OiBBcnJheTx7IGV2ZW50PzogdW5rbm93biB9PiB9PjtcbiAgY2FuY2VsPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgbW9kZWxzPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0VGV4dEJsb2NrIHtcbiAgdHlwZT86IHN0cmluZztcbiAgdGV4dD86IHN0cmluZztcbiAgcm9sZT86IHN0cmluZztcbiAgY29udGVudD86IEhvc3RUZXh0QmxvY2tbXSB8IHN0cmluZztcbiAgW2s6IHN0cmluZ106IHVua25vd247XG59XG5cbi8qKiBcdTRFQ0VcdTRFOEJcdTRFRjYgZGF0YSBcdTZERjFcdTY0MUNcdTY1MzZcdTk2QzZcdTY1ODdcdTY3MkNcdTU3NTdcdUZGMDhge3R5cGU6J3RleHQnLHRleHR9YFx1RkYwOVx1RkYwQ3VzZXIgXHU0RThCXHU0RUY2XHU2NTc0XHU0RjUzXHU4REYzXHU4RkM3XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFRleHRzKGRhdGE6IEhvc3RUZXh0QmxvY2sgfCB1bmRlZmluZWQgfCBudWxsLCBvdXQ6IHN0cmluZ1tdLCBza2lwUm9sZVVzZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICBpZiAoZGF0YS5yb2xlID09PSAndXNlcicgJiYgc2tpcFJvbGVVc2VyKSByZXR1cm47XG4gIGlmICh0eXBlb2YgZGF0YS50eXBlID09PSAnc3RyaW5nJyAmJiBkYXRhLnR5cGUgIT09ICd1c2VyJyAmJiB0eXBlb2YgZGF0YS50ZXh0ID09PSAnc3RyaW5nJyAmJiBkYXRhLnRleHQubGVuZ3RoID4gMCkge1xuICAgIG91dC5wdXNoKGRhdGEudGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGRhdGEuY29udGVudCkpIHtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgZGF0YS5jb250ZW50KSBjb2xsZWN0VGV4dHMocGFydCBhcyBIb3N0VGV4dEJsb2NrLCBvdXQsIHNraXBSb2xlVXNlcik7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRm9sZCB7XG4gIC8qKiBcdTVERjJcdTY1MzZcdTk2QzZcdTc2ODRcdTUyQTlcdTYyNEJcdTZCNjNcdTY1ODdcdUZGMDhcdTZENDFcdTVGMEYgZGVsdGEgXHU1ODlFXHU5MUNGXHU2MkZDXHU2M0E1XHVGRjFCXHU4MkU1XHU2Q0ExXHU2NzA5IGRlbHRhIFx1NTIxOVx1NzUyOFx1NUI4Q1x1NjIxMFx1NkQ4OFx1NjA2Rlx1NzY4NFx1NTE2OFx1NjU4N1x1NTE1Q1x1NUU5NVx1RkYwOVx1MzAwMiAqL1xuICB0ZXh0OiBzdHJpbmc7XG4gIC8qKiBcdTY2MkZcdTU0MjZcdTUxRkFcdTczQjAgYXNzaXN0YW50L21lc3NhZ2UgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHUzMDAyICovXG4gIGNvbXBsZXRlZDogYm9vbGVhbjtcbn1cblxuLyoqIFx1NjI4QSBoaXN0b3J5IFx1NEU4Qlx1NEVGNlx1NTIxN1x1ODg2OFx1NjI5OFx1NTNFMFx1NEUzQSB7IFx1N0QyRlx1NzlFRlx1NkI2M1x1NjU4NywgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3IH1cdUZGMDhcdTYzMDkgc2VxIFx1N0EzM1x1NUI5QVx1NjM5Mlx1NUU4Rlx1RkYxQlx1OERGM1x1OEZDNyB1c2VyIFx1NEU4Qlx1NEVGNlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvbGRTZXNzaW9uVGV4dChldmVudHM6IEFycmF5PHsgZXZlbnQ/OiB1bmtub3duIH0+IHwgdW5kZWZpbmVkKTogU2Vzc2lvbkZvbGQge1xuICBjb25zdCBlbXB0eTogU2Vzc2lvbkZvbGQgPSB7IHRleHQ6ICcnLCBjb21wbGV0ZWQ6IGZhbHNlIH07XG4gIGlmICghQXJyYXkuaXNBcnJheShldmVudHMpKSByZXR1cm4gZW1wdHk7XG4gIHR5cGUgRXYgPSB7IHR5cGU/OiBzdHJpbmc7IHNlcT86IG51bWJlcjsgZGF0YT86IEhvc3RUZXh0QmxvY2sgfTtcbiAgY29uc3Qgc29ydGVkOiBFdltdID0gZXZlbnRzXG4gICAgLm1hcCgoZW50cnkpID0+IChlbnRyeSAmJiB0eXBlb2YgZW50cnkgPT09ICdvYmplY3QnID8gKChlbnRyeSBhcyB7IGV2ZW50PzogdW5rbm93biB9KS5ldmVudCBhcyBFdikgOiB1bmRlZmluZWQpKVxuICAgIC5maWx0ZXIoKGUpOiBlIGlzIEV2ID0+ICEhZSAmJiB0eXBlb2YgZSA9PT0gJ29iamVjdCcpO1xuICBzb3J0ZWQuc29ydCgoYSwgYikgPT4gKGEuc2VxID8/IDApIC0gKGIuc2VxID8/IDApKTtcbiAgY29uc3QgdGV4dHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjb21wbGV0ZWQgPSBmYWxzZTtcbiAgbGV0IGZhbGxiYWNrID0gJyc7XG4gIGZvciAoY29uc3QgZXYgb2Ygc29ydGVkKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBldi50eXBlID09PSAnc3RyaW5nJyA/IGV2LnR5cGUgOiAnJztcbiAgICBpZiAodHlwZS5pbmNsdWRlcygndXNlcicpICYmICF0eXBlLmluY2x1ZGVzKCdhc3Npc3RhbnQnKSkgY29udGludWU7XG4gICAgaWYgKHR5cGUgPT09ICdhc3Npc3RhbnQvY2h1bmsnKSB7XG4gICAgICAvLyBcdTZENDFcdTVGMEZcdTU4OUVcdTkxQ0ZcdUZGMUFkYXRhLmNodW5rID0geyB0eXBlOidkZWx0YScsIGJsb2NrVHlwZTondGV4dCcsIHRleHQgfVxuICAgICAgY29uc3QgY2h1bmsgPSAoZXYuZGF0YSBhcyB7IGNodW5rPzogSG9zdFRleHRCbG9jayB9IHwgdW5kZWZpbmVkKT8uY2h1bms7XG4gICAgICBpZiAoY2h1bmsgJiYgY2h1bmsudHlwZSA9PT0gJ2RlbHRhJyAmJiBjaHVuay5ibG9ja1R5cGUgPT09ICd0ZXh0JyAmJiB0eXBlb2YgY2h1bmsudGV4dCA9PT0gJ3N0cmluZycgJiYgY2h1bmsudGV4dCkge1xuICAgICAgICB0ZXh0cy5wdXNoKGNodW5rLnRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnYXNzaXN0YW50L21lc3NhZ2UnKSB7XG4gICAgICAvLyBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMUJcdTZEODhcdTYwNkZcdTUxNjhcdTY1ODdcdTRGNUNcdTRFM0EgZGVsdGEgXHU3RjNBXHU1OTMxXHU2NUY2XHU3Njg0XHU1MTVDXHU1RTk1XHVGRjA4XHU5MDdGXHU1MTREXHU0RTBFXHU1ODlFXHU5MUNGXHU5MUNEXHU1OTBEXHVGRjBDXHU0RUM1XHU2NUUwIGRlbHRhIFx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYwOVxuICAgICAgY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAoZXYuZGF0YSBhcyB7IG1lc3NhZ2U/OiBIb3N0VGV4dEJsb2NrIH0gfCB1bmRlZmluZWQpPy5tZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UgJiYgdHlwZW9mIG1lc3NhZ2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29sbGVjdFRleHRzKG1lc3NhZ2UsIGJ1ZiwgZmFsc2UpO1xuICAgICAgICBmYWxsYmFjayArPSBidWYuam9pbignJyk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU2NUY2XHU0RjE4XHU1MTQ4XHU1QjhDXHU2NTc0XHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHVGRjA4XHU2RDQxXHU1RjBGXHU1ODlFXHU5MUNGXHU4RjZFXHU4QkUyXHU1RkVCXHU3MTY3XHU1M0VGXHU4MEZEXHU2NzJBXHU1MjMwXHU2NzAwXHU3RUM4IGRlbHRhXHVGRjBDXHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHU2NkY0XHU1QjhDXHU2NTc0XHVGRjA5XG4gIGNvbnN0IHRleHQgPSBjb21wbGV0ZWQgPyBmYWxsYmFjayB8fCB0ZXh0cy5qb2luKCcnKSA6IHRleHRzLmpvaW4oJycpO1xuICByZXR1cm4geyB0ZXh0LCBjb21wbGV0ZWQgfTtcbn1cblxuLyoqIFx1N0QyRlx1NzlFRlx1NjU4N1x1NjcyQ1x1NjMwOVx1NUI1N1x1N0IyNlx1NTI0RFx1N0YwMFx1OEJBMVx1N0I5N1x1NTg5RVx1OTFDRlx1RkYwOFx1OEY2RVx1OEJFMlx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1NzUyOFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpeERlbHRhKHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbiA9IE1hdGgubWluKHByZXYubGVuZ3RoLCBuZXh0Lmxlbmd0aCk7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBuICYmIHByZXYuY2hhckNvZGVBdChpKSA9PT0gbmV4dC5jaGFyQ29kZUF0KGkpKSBpICs9IDE7XG4gIHJldHVybiBuZXh0LnNsaWNlKGkpO1xufVxuXG4vKiogXHU3RUQ5XHU2MzAyXHU4RDc3XHU3Njg0IFJQQyBcdThDMDNcdTc1MjhcdTUyQTBcdThEODVcdTY1RjZcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRFRkJcdTRGNTVcdTRFMDBcdTZCNjVcdTkwRkRcdTRFMERcdTUxNDFcdThCQjhcdTY1RTBcdTk2NTBcdTk2M0JcdTU4NUUgXHUyMTkyXHUzMDBDXHU0RTAwXHU3NkY0XHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKGAke2xhYmVsfS10aW1lb3V0YCkpLCBtcyk7XG4gICAgcHJvbWlzZS50aGVuKFxuICAgICAgKHYpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0sXG4gICAgICAoZSkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMge1xuICBhcGk6IEhvc3RTZXNzaW9uQXBpO1xuICAvKiogXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHVGRjA4Zm9yayBcdTZFOTAgKyBcdTZBMjFcdTU3OEJcdTY3NjVcdTZFOTBcdUZGMDlcdTMwMDIgKi9cbiAgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgb25EZWx0YTogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgaW50ZXJ2YWxNcz86IG51bWJlcjtcbiAgdGltZW91dE1zPzogbnVtYmVyO1xuICAvKiogXHU2NUUwXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU2NUY2XHVGRjBDXHU2NTg3XHU2NzJDXHU0RTBEXHU1MThEXHU1ODlFXHU5NTdGIE4gXHU4RjZFXHU1NDBFXHU4OUM2XHU0RTNBXHU1QjhDXHU2MjEwXHVGRjA4XHU1OTUxXHU3RUE2XHU1MTVDXHU1RTk1XHVGRjA5XHUzMDAyICovXG4gIHNldHRsZVJvdW5kcz86IG51bWJlcjtcbiAgLyoqIFx1NTM1NVx1NkI2NSBSUEMgXHU2MzAyXHU4RDc3XHU0RTBBXHU5NjUwXHVGRjA4XHU5RUQ4XHU4QkE0IDVzXHVGRjA5XHUzMDAyICovXG4gIHJwY1RpbWVvdXRNcz86IG51bWJlcjtcbn1cblxuY29uc3QgREVGQVVMVF9JTlRFUlZBTF9NUyA9IDQwMDtcbmNvbnN0IERFRkFVTFRfVElNRU9VVF9NUyA9IDEyMF8wMDA7XG5jb25zdCBERUZBVUxUX1NFVFRMRV9ST1VORFMgPSAzO1xuY29uc3QgREVGQVVMVF9SUENfVElNRU9VVF9NUyA9IDVfMDAwO1xuXG4vKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTE2OFx1NkQ0MVx1N0EwQlx1RkYxQVx1NTIxQlx1NUVGQS9cdTU5MERcdTc1MjhcdTRFMzRcdTY1RjZcdTRGMUFcdThCREQgXHUyMTkyIFx1N0VFN1x1NjI3Rlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4QiBcdTIxOTIgXHU2Q0U4XHU1MTY1XHU0RjE4XHU1MzE2IHByb21wdFxuICogXHUyMTkyIFx1OEY2RVx1OEJFMiBoaXN0b3J5IFx1NzZGNFx1ODFGMyBhc3Npc3RhbnQvbWVzc2FnZSBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMDhcdTYyMTYgc2V0dGxlIC8gYWJvcnQgLyBcdThEODVcdTY1RjZcdUZGMDlcdTMwMDJcdThGRDRcdTU2REVcdTY3MDBcdTdFQzhcdTZCNjNcdTY1ODdcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkhvc3RPcHRpbWl6ZShvcHRzOiBSdW5Ib3N0T3B0aW1pemVPcHRpb25zKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBhcGksIHBhcmVudFNlc3Npb25JZCwgbGFuZywgdGV4dCwgc2lnbmFsLCBvbkRlbHRhIH0gPSBvcHRzO1xuICBjb25zdCBpbnRlcnZhbE1zID0gb3B0cy5pbnRlcnZhbE1zID8/IERFRkFVTFRfSU5URVJWQUxfTVM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdHMudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUztcbiAgY29uc3Qgc2V0dGxlUm91bmRzID0gb3B0cy5zZXR0bGVSb3VuZHMgPz8gREVGQVVMVF9TRVRUTEVfUk9VTkRTO1xuICBjb25zdCBycGNUaW1lb3V0TXMgPSBvcHRzLnJwY1RpbWVvdXRNcyA/PyBERUZBVUxUX1JQQ19USU1FT1VUX01TO1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuXG4gIC8vIDEuIGZvcmsgXHU0RTM0XHU2NUY2XHU1QjUwXHU0RjFBXHU4QkREXHVGRjA4XHU1QkJGXHU0RTNCXHU3NTFGXHU2MjEwXHU1NDA4XHU2Q0Q1IGlkXHVGRjFCXHU1OTMxXHU4RDI1XHU2NjBFXHU3ODZFXHU2MkE1XHU5NTE5XHVGRjBDXHU0RTBEXHU1MThEXHU5NzU5XHU5RUQ4XHU3QTdBXHU4RjZDXHVGRjA5XG4gIGNvbnN0IGZvcmtlZCA9IGF3YWl0IHdpdGhUaW1lb3V0KGFwaS5mb3JrPy4oeyBzZXNzaW9uSWQ6IHBhcmVudFNlc3Npb25JZCB9KSA/PyBQcm9taXNlLnJlc29sdmUoKSwgcnBjVGltZW91dE1zLCAnZm9yaycpO1xuICBjb25zdCBzZXNzaW9uSWQgPSBmb3JrZWQ/LnNlc3Npb25JZDtcbiAgaWYgKCFzZXNzaW9uSWQpIHRocm93IG5ldyBFcnJvcignaG9zdC11bmF2YWlsYWJsZScpO1xuXG4gIC8vIDIuIFx1NUMxRFx1OEJENVx1N0VFN1x1NjI3Rlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwOGZvcmsgXHU5MDFBXHU1RTM4XHU1REYyXHU3RUU3XHU2MjdGXHVGRjFCXHU1OTMxXHU4RDI1XHU3NTI4XHU1QjUwXHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHU3RUU3XHU3RUVEXHVGRjA5XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyZW50ID0gYXdhaXQgd2l0aFRpbWVvdXQoYXBpLm1vZGVscz8uKHsgc2Vzc2lvbklkOiBwYXJlbnRTZXNzaW9uSWQgfSkgPz8gUHJvbWlzZS5yZXNvbHZlKCksIHJwY1RpbWVvdXRNcywgJ21vZGVscycpO1xuICAgIGlmIChwYXJlbnQ/LmN1cnJlbnQ/Lm1vZGVsKSB7XG4gICAgICBhd2FpdCB3aXRoVGltZW91dChcbiAgICAgICAgYXBpLnNlbGVjdE1vZGVsPy4oe1xuICAgICAgICAgIHNlc3Npb25JZCxcbiAgICAgICAgICBwcm92aWRlcjogcGFyZW50LmN1cnJlbnQucHJvdmlkZXIgPz8gJ2RlZXBzZWVrLW9mZmljaWFsJyxcbiAgICAgICAgICBtb2RlbDogcGFyZW50LmN1cnJlbnQubW9kZWwsXG4gICAgICAgIH0pID8/IFByb21pc2UucmVzb2x2ZSgpLFxuICAgICAgICBycGNUaW1lb3V0TXMsXG4gICAgICAgICdzZWxlY3RNb2RlbCcsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gXHU1RkZEXHU3NTY1XG4gIH1cblxuICAvLyAzLiBcdTZDRThcdTUxNjVcdTRGMThcdTUzMTZcdTYzMDdcdTRFRTRcdUZGMDhcdTg5QzRcdTUyMTlcdTYyRkNcdThGREIgdXNlciBcdTY1ODdcdTY3MkNcdTIwMTRcdTIwMTRcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdTY1RTBcdTYzMDFcdTRFNDUgc3lzdGVtXHVGRjA5XG4gIGNvbnN0IHN5c3RlbSA9IGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmcpO1xuICBjb25zdCBjb250ZW50ID0gYCR7c3lzdGVtfVxcblxcbiR7dGV4dH1gO1xuICBhd2FpdCB3aXRoVGltZW91dChcbiAgICBhcGkucHJvbXB0Py4oeyBzZXNzaW9uSWQsIG1vZGU6ICdxdWV1ZScsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dDogY29udGVudCB9XSB9KSA/PyBQcm9taXNlLnJlc29sdmUoKSxcbiAgICBycGNUaW1lb3V0TXMsXG4gICAgJ3Byb21wdCcsXG4gICk7XG5cbiAgLy8gNC4gXHU4RjZFXHU4QkUyIGhpc3RvcnlcdUZGMUFkZWx0YSBcdTU4OUVcdTkxQ0ZcdTZENDFcdTVGMEZcdTU0NDhcdTczQjBcdUZGMUJhc3Npc3RhbnQvbWVzc2FnZSBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdTUyMzBcdThGQkVcdTdBQ0JcdTUzNzNcdTY1MzZcdTVDM0VcbiAgY29uc3Qgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gIGxldCBsYXN0VGV4dCA9ICcnO1xuICBsZXQgaWRsZVJvdW5kcyA9IDA7XG4gIGZvciAoOzspIHtcbiAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5jYW5jZWw/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTVDM0RcdTUyOUJcdTUzRDZcdTZEODhcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuICAgIH1cbiAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ZWQgPiB0aW1lb3V0TXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5jYW5jZWw/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTVDM0RcdTUyOUJcdTUzRDZcdTZEODhcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCcpO1xuICAgIH1cbiAgICBsZXQgZm9sZDogU2Vzc2lvbkZvbGQgPSB7IHRleHQ6ICcnLCBjb21wbGV0ZWQ6IGZhbHNlIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCBhcGkuaGlzdG9yeT8uKHsgc2Vzc2lvbklkIH0pO1xuICAgICAgZm9sZCA9IGZvbGRTZXNzaW9uVGV4dChwYWdlPy5ldmVudHMpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MzU1XHU2QjIxXHU1M0Q2XHU1OTMxXHU4RDI1XHU0RTBEXHU4MUY0XHU1NDdEXHVGRjBDXHU0RTBCXHU0RTAwXHU4RjZFXHU1MThEXHU4QkQ1XG4gICAgfVxuICAgIGlmIChmb2xkLmNvbXBsZXRlZCkge1xuICAgICAgLy8gXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHVGRjFBXHU0RUU1XHU1RjUzXHU1MjREXHVGRjA4XHU1NDJCXHU2NzAwXHU3RUM4IGRlbHRhL1x1NTE2OFx1NjU4N1x1NTE1Q1x1NUU5NVx1RkYwOVx1NjU4N1x1NjcyQ1x1NjUzNlx1NUMzRVxuICAgICAgaWYgKGZvbGQudGV4dCAhPT0gbGFzdFRleHQgJiYgZm9sZC50ZXh0KSBvbkRlbHRhKGZvbGQudGV4dCk7XG4gICAgICByZXR1cm4gZm9sZC50ZXh0O1xuICAgIH1cbiAgICBpZiAoZm9sZC50ZXh0ICE9PSBsYXN0VGV4dCkge1xuICAgICAgaWRsZVJvdW5kcyA9IDA7XG4gICAgICBjb25zdCBkZWx0YSA9IHByZWZpeERlbHRhKGxhc3RUZXh0LCBmb2xkLnRleHQpO1xuICAgICAgbGFzdFRleHQgPSBmb2xkLnRleHQ7XG4gICAgICBpZiAoZGVsdGEpIG9uRGVsdGEobGFzdFRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZGxlUm91bmRzICs9IDE7XG4gICAgICBpZiAoaWRsZVJvdW5kcyA+PSBzZXR0bGVSb3VuZHMpIGJyZWFrO1xuICAgIH1cbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSk7XG4gIH1cbiAgcmV0dXJuIGxhc3RUZXh0O1xufSIsICIvKiogXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHU3MkI2XHU2MDAxXHU2NzNBIFx1MjAxNFx1MjAxNCBcdTdFQUYgcmVkdWNlclx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmltcG9ydCB0eXBlIHsgT3B0aW1pemVFcnJvcktpbmQgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdTdGF0dXMgPSAnaWRsZScgfCAnb3B0aW1pemluZycgfCAncHJldmlldycgfCAnZXJyb3InIHwgJ2d1aWRlJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U3RhdGUge1xuICBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBlcnJvcktpbmQ6IE9wdGltaXplRXJyb3JLaW5kIHwgbnVsbDtcbiAgZ2VuZXJhdGlvbjogbnVtYmVyO1xuICAvKiogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHU0RTJEXHU3Njg0XHU1ODlFXHU5MUNGXHU2NTg3XHU2NzJDXHVGRjA4b3B0aW1pemluZyBcdTYwMDFcdTVCOUVcdTY1RjZcdTY2RjRcdTY1QjBcdUZGMUJcdTk3NUVcdTZENDFcdTVGMEZcdTUxNjhcdTdBMEJcdTRFM0FcdTdBN0FcdTRFMzJcdUZGMDkgKi9cbiAgZHJhZnQ6IHN0cmluZztcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOG51bGwgPSBcdTY3MkFcdTdFRDFcdTVCOUEvXHU1MTY4XHU1QzQwXHVGRjA5XHVGRjFBXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU1M0VBXHU1QzVFXHU0RThFXHU4QkU1XHU0RjFBXHU4QkREXHVGRjBDXHU1MjA3XHU4RDcwXHU0RTBEXHU4RERGXHU5NjhGICovXG4gIHNlc3Npb25JZDogc3RyaW5nIHwgbnVsbDtcbn1cblxuLyoqIFx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYxQXJlZHVjZXIgXHU2QzM4XHU0RTBEXHU1MTk5XHU1NkRFXHU1QjgzXHU2MjE2XHU4RkQ0XHU1NkRFXHU1M0VGXHU1M0Q4XHU3Njg0XHU2NUIwXHU1QkY5XHU4QzYxXHVGRjFCXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA4VGFzayA0IHN0b3JlIFx1ODBGNlx1NkMzNFx1RkYwOVx1NUZDNVx1OTg3Qlx1NEVFNSB7IC4uLklOSVRJQUxfUFJFVklFVyB9IFx1NEUzQVx1NkJDRlx1NEYxQVx1OEJERFx1NzlDRFx1NUI1MCAqL1xuZXhwb3J0IGNvbnN0IElOSVRJQUxfUFJFVklFVzogUHJldmlld1N0YXRlID0ge1xuICBzdGF0dXM6ICdpZGxlJyxcbiAgcmVzdWx0OiAnJyxcbiAgZXJyb3JLaW5kOiBudWxsLFxuICBnZW5lcmF0aW9uOiAwLFxuICBkcmFmdDogJycsXG4gIHNlc3Npb25JZDogbnVsbCxcbn07XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdBY3Rpb24gPVxuICB8IHsgdHlwZTogJ2JlZ2luJzsgc2Vzc2lvbklkPzogc3RyaW5nIHwgbnVsbCB9XG4gIHwgeyB0eXBlOiAnc2hvdyc7IHJlc3VsdDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsga2luZDogT3B0aW1pemVFcnJvcktpbmQgfVxuICB8IHsgdHlwZTogJ2d1aWRlJyB9XG4gIHwgeyB0eXBlOiAnY2xvc2UnIH1cbiAgfCB7IHR5cGU6ICdkcmFmdCc7IHRleHQ6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlUHJldmlldyhzdGF0ZTogUHJldmlld1N0YXRlLCBhY3Rpb246IFByZXZpZXdBY3Rpb24pOiBQcmV2aWV3U3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnYmVnaW4nOlxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKSByZXR1cm4gc3RhdGU7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgc3RhdHVzOiAnb3B0aW1pemluZycsXG4gICAgICAgIGVycm9yS2luZDogbnVsbCxcbiAgICAgICAgZHJhZnQ6ICcnLFxuICAgICAgICBzZXNzaW9uSWQ6IGFjdGlvbi5zZXNzaW9uSWQgPz8gbnVsbCxcbiAgICAgICAgZ2VuZXJhdGlvbjogc3RhdGUuZ2VuZXJhdGlvbiArIDEsXG4gICAgICB9O1xuICAgIGNhc2UgJ3Nob3cnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAncHJldmlldycsIHJlc3VsdDogYWN0aW9uLnJlc3VsdCwgZHJhZnQ6ICcnIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGNhc2UgJ2RyYWZ0JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIGRyYWZ0OiBhY3Rpb24udGV4dCB9IDogc3RhdGU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKiogXHU4QkExXHU1MjEyXHU4OUM0XHU1QjlBXHU3Njg0XHU1MTZDXHU1RjAwIEFQSVx1RkYwOFRhc2sgNCBcdThENzdcdTVCNThcdTU3MjhcdUZGMUJjYW5UcmlnZ2VyIFx1NzY4NCAhYnVzeSBcdTUzNEFcdThGQjlcdTYyN0ZcdTYyQzVcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTgwNENcdThEMjNcdUZGMENcdTUxNzZcdTRGNTlcdTRGRERcdTc1NTlcdTRFRTVcdTU5MDdcdTU0MEVcdTdFRURcdTZEODhcdThEMzlcdTgwMDVcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5PcHRpbWl6ZUZyb20oc3RhdHVzOiBQcmV2aWV3U3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGF0dXMgIT09ICdvcHRpbWl6aW5nJztcbn1cbiIsICIvKiogXHU5ODg0XHU4OUM4XHU3MkI2XHU2MDAxXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGIFx1MjAxNFx1MjAxNCBcdTYzMDlcdTk0QUUvXHU5ODg0XHU4OUM4XHU1MzYxL3J1bk9wdGltaXplIFx1NTE3MVx1NEVBQlx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rICovXG5cbmltcG9ydCB7XG4gIElOSVRJQUxfUFJFVklFVyxcbiAgcmVkdWNlUHJldmlldyxcbiAgdHlwZSBQcmV2aWV3QWN0aW9uLFxuICB0eXBlIFByZXZpZXdTdGF0ZSxcbn0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcblxuLyoqIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTM1NVx1NEY4Qlx1NzJCNlx1NjAwMVx1RkYwOFx1NkJDRlx1NjNEMlx1NEVGNlx1NUI5RVx1NEY4Qlx1NEUwMFx1NEVGRFx1RkYxQVx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1NTE4NVx1NTE2OFx1NUM0MFx1NTUyRlx1NEUwMFx1RkYwOSAqL1xubGV0IHN0YXRlOiBQcmV2aWV3U3RhdGUgPSB7IC4uLklOSVRJQUxfUFJFVklFVyB9O1xuY29uc3QgbGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4vKiogXHU4QkZCXHU1RjUzXHU1MjREXHU1RkVCXHU3MTY3XHVGRjA4XHU3QTMzXHU1QjlBXHU1RjE1XHU3NTI4XHU3NkY0XHU1MjMwXHU0RTBCXHU0RTAwXHU2QjIxIGRpc3BhdGNoXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlld0J1c1N0YXRlKCk6IFByZXZpZXdTdGF0ZSB7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLyoqIFx1NkQzRVx1NTNEMVx1NzJCNlx1NjAwMVx1NjczQVx1NTJBOFx1NEY1Q1x1NUU3Nlx1OTAxQVx1NzdFNVx1OEJBMlx1OTYwNVx1ODAwNSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoUHJldmlldyhhY3Rpb246IFByZXZpZXdBY3Rpb24pOiB2b2lkIHtcbiAgc3RhdGUgPSByZWR1Y2VQcmV2aWV3KHN0YXRlLCBhY3Rpb24pO1xuICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykgbGlzdGVuZXIoKTtcbn1cblxuLyoqIFx1OEJBMlx1OTYwNVx1NTNEOFx1NTMxNlx1RkYxQlx1OEZENFx1NTZERVx1OTAwMFx1OEJBMlx1NTFGRFx1NjU3MCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1YnNjcmliZVByZXZpZXdCdXMobGlzdGVuZXI6ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgbGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH07XG59IiwgIi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTIgcnVuT3B0aW1pemUgKyBcdTZBMjFcdTU3NTdcdTdFQTdcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzYgXHUyMDE0XHUyMDE0IFx1NzJCNlx1NjAwMVx1N0VDRlx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRlx1RkYwOHByZXZpZXctYnVzXHVGRjA5XHU1M0QxXHU1RTAzXHVGRjBDXG4gKiAgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMDhcdTY4NENcdTk3NjJcdTZFMzJcdTY3RDNcdTVDNDJcdTVCRjkgaW5wdXQucmlnaHQvb3ZlcmxheSBcdTY5RkRcdTRGNERcdTRFMERcdTYzRDBcdTRGOUJcdThGRDlcdTRFOUJcdTY4MDdcdTUxQzYgcHJvcHNcdUZGMENcbiAqICBcdTdFQzRcdTRFRjZcdTRGOURcdThENTZcdTVCODNcdTRFRUNcdTRGMUFcdTVEMjlcdTVFNzZcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdTIwMTRcdTIwMTRQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4L1x1OTg4NFx1ODlDOFx1NTM2MVx1NEUwRFx1NTNFRlx1ODlDMVx1NzY4NFx1NUI5RVx1NkQ0Qlx1NUI5QVx1OEJCQVx1RkYwOVx1MzAwMiAqL1xuXG5pbXBvcnQge1xuICBjaGVja0NvbmZpZyxcbiAgb3B0aW1pemVTdHJlYW0sXG4gIHJlc29sdmVTZXNzaW9uTW9kZWwsXG4gIFJFUVVFU1RfVElNRU9VVF9NUyxcbiAgdG9FcnJvcktpbmQsXG4gIHR5cGUgTGFuZyxcbiAgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCxcbiAgdHlwZSBQcm9tcHRDb25maWcsXG59IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bkhvc3RPcHRpbWl6ZSwgdHlwZSBIb3N0U2Vzc2lvbkFwaSB9IGZyb20gJy4vc2Vzc2lvbi1vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgZGlzcGF0Y2hQcmV2aWV3IH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbi8qKlxuICogXHU1RjUzXHU1MjREIGluLWZsaWdodCBcdThCRjdcdTZDNDJcdTc2ODRcdTYzQTdcdTUyMzZcdTU2NjhcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMDlcdUZGMUFcbiAqIC0gXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHU2NUY2XHU0RTJEXHU2QjYyXHU1QjgzXHVGRjBDXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHVGRjFCXG4gKiAtIHJ1bk9wdGltaXplIFx1NEVFNVx1MzAwQ1x1NUI1OFx1NTcyOFx1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNlx1NTY2OFx1MzAwRFx1NEUzQVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYwOFx1NTQwQ1x1NEUwMFx1NjVGNlx1NTIzQlx1NTNFQVx1NTE0MVx1OEJCOFx1NEUwMFx1NEUyQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1RkYwOVx1MzAwMlxuICogXHU2Q0U4XHVGRjFBXHU2QTIxXHU1NzU3XHU3RUE3XHU2MTBGXHU1NDczXHU3NzQwXHU1OTFBXHU0RjFBXHU4QkREXHU1NDBDXHU2NUY2XHU0RjE4XHU1MzE2XHU0RjFBXHU0RTkyXHU3NkY4XHU4QkE5XHU4REVGXHUyMDE0XHUyMDE0XHU4RjkzXHU1MTY1XHU2ODBGXHU1MzU1XHU0RjFBXHU4QkREXHU4MDVBXHU3MTI2XHU3Njg0XHU0RUE0XHU0RTkyXHU0RTBCXHU1M0VGXHU2M0E1XHU1M0Q3XHU2QjY0XHU3QjgwXHU1MzE2XHUzMDAyXG4gKi9cbmxldCBhY3RpdmVDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbi8qKiBcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdTc2ODRcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMDhcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTYzMDlcdTRGMUFcdThCRERcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTk2MzJcdTYyOTZcdUZGMUJcdTVGMDJcdTRGMUFcdThCRERcdThCQTlcdThERUZcdUZGMDkgKi9cbmxldCBhY3RpdmVTZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUyMTkyIFx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxXHVGRjA4ZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUyMTkyIGd1aWRlXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbiAgLyoqIFx1ODlFM1x1Njc5MFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTRGMThcdTUxNDhcdUZGMDlcdUZGMENcdTRFMERcdTUzRUZcdTVGOTdcdTY1RjZcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOSAqL1xuICBnZXRTZXNzaW9uTW9kZWw/KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDh1c2VTZXNzaW9uTW9kZWwgXHU1RjAwXHU1NDJGXHU2NUY2XHU3NTI4XHVGRjA5XHVGRjFBXHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREICsgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFICovXG4gIGhvc3Q/OiB7XG4gICAgYXBpOiBIb3N0U2Vzc2lvbkFwaTtcbiAgICBwYXJlbnRTZXNzaW9uSWQ6IHN0cmluZztcbiAgfTtcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOFx1N0VEMVx1NUI5QVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1RkYwQ1x1NTIwN1x1NEYxQVx1OEJERFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOSAqL1xuICBnZXRTZXNzaW9uSWQ/KCk6IHN0cmluZyB8IG51bGw7XG59KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbmZpZyA9IGN0eC5nZXRDb25maWcoKTtcbiAgY29uc3QgZHJhZnQgPSBjdHguZ2V0RHJhZnQoKS50cmltKCk7XG4gIGlmICghZHJhZnQpIHJldHVybjtcblxuICAvLyBcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTU3MjhcdTkwMTQgXHUyMTkyIFx1NEUyMlx1NUYwM1x1NjcyQ1x1NkIyMVx1ODlFNlx1NTNEMVx1RkYwOFx1NjMwOVx1OTRBRSBidXN5IFx1NURGMlx1Nzk4MVx1NzUyOFx1NzBCOVx1NTFGQlx1RkYwQ1x1OEZEOVx1OTFDQ1x1NjYyRlx1N0FERVx1NjAwMVx1NjcwMFx1NTQwRVx1OTYzMlx1N0VCRlx1RkYwOVx1RkYxQlxuICAvLyBcdTUyMDdcdTYzNjJcdTRGMUFcdThCRERcdTU0MEVcdTUzRDFcdThENzcgXHUyMTkyIFx1NEUyRFx1NkI2Mlx1NjVFN1x1OEJGN1x1NkM0Mlx1OEJBOVx1OERFRlx1RkYwOFx1NTQwNFx1NEYxQVx1OEJERFx1NTNFRlx1NzJFQ1x1N0FDQlx1NEYxOFx1NTMxNlx1RkYwQ1x1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NzUzMSBjYW5jZWwgXHU2NTM2XHU1QzNFXHVGRjA5XG4gIGNvbnN0IHNlc3Npb25JZCA9IGN0eC5nZXRTZXNzaW9uSWQ/LigpID8/IG51bGw7XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSB7XG4gICAgaWYgKHNlc3Npb25JZCA9PT0gYWN0aXZlU2Vzc2lvbklkKSByZXR1cm47XG4gICAgYWN0aXZlQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gIH1cbiAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2JlZ2luJywgc2Vzc2lvbklkIH0pO1xuXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGFjdGl2ZUNvbnRyb2xsZXIgPSBjb250cm9sbGVyOyAvLyBcdTZDRThcdTUxOENcdTdFRDkgY2xvc2VQcmV2aWV3KClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgYWN0aXZlU2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICBsZXQgdGltZWRPdXQgPSBmYWxzZTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgY29udHJvbGxlci5hYm9ydCgpO1xuICB9LCBSRVFVRVNUX1RJTUVPVVRfTVMpO1xuXG4gIHRyeSB7XG4gICAgLy8gXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREXHU5MDFBXHU5MDUzIFx1MjAxNFx1MjAxNCBcdTk2RjZcdTkxNERcdTdGNkVcdUZGMENcdTY1RTBcdTk3MDAgY2hlY2tDb25maWdcbiAgICBpZiAoY29uZmlnLnVzZVNlc3Npb25Nb2RlbCAmJiBjdHguaG9zdCkge1xuICAgICAgYXdhaXQgcnVuSG9zdE9wdGltaXplKHtcbiAgICAgICAgYXBpOiBjdHguaG9zdC5hcGksXG4gICAgICAgIHBhcmVudFNlc3Npb25JZDogY3R4Lmhvc3QucGFyZW50U2Vzc2lvbklkLFxuICAgICAgICBsYW5nOiBjdHguZ2V0TGFuZygpLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25EZWx0YTogKHRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQgfSksXG4gICAgICB9KS50aGVuKFxuICAgICAgICAoZmluYWxUZXh0KSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdDogZmluYWxUZXh0IH0pLFxuICAgICAgICAoZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgICAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgICAgICBpZiAodGltZWRPdXQpIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogJ3RpbWVvdXQnIGFzIE9wdGltaXplRXJyb3JLaW5kIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGZldGNoIFx1OTAxQVx1OTA1M1x1RkYwOFx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qi9cdTVCQkZcdTRFM0JcdTRFMERcdTUzRUZcdTc1MjhcdTk2NERcdTdFQTdcdUZGMDlcdTYyNERcdTg5ODFcdTZDNDJcdTkxNERcdTdGNkVcbiAgICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdndWlkZScgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjFBXHU2RDRGXHU4OUM4XHU1NjY4IGZldGNoIFx1NzZGNFx1OEZERVx1ODFFQVx1OTE0RCBBUElcdUZGMDhcdTZENDFcdTVGMEZcdUZGMDlcbiAgICAvLyBcdTZBMjFcdTU3OEJcdTg5RTNcdTY3OTBcdUZGMUF1c2VTZXNzaW9uTW9kZWxcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdTIxOTIgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU0RUM1XHU0RjVDIG1vZGVsIFx1NTQwRFx1NTZERVx1OTAwMFx1NEY3Rlx1NzUyOFx1RkYwOVx1RkYxQlx1NTQyNlx1NTIxOSBcdTIxOTIgXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXG4gICAgbGV0IG1vZGVsID0gY29uZmlnLm1vZGVsO1xuICAgIGlmIChjb25maWcudXNlU2Vzc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBzZXNzaW9uTW9kZWwgPSBhd2FpdCBjdHguZ2V0U2Vzc2lvbk1vZGVsPy4oKTtcbiAgICAgIGlmIChzZXNzaW9uTW9kZWwpIG1vZGVsID0gc2Vzc2lvbk1vZGVsO1xuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAgIC8vIFx1NUM1NVx1NzkzQVx1N0QyRlx1NzlFRlx1RkYxQVx1NkI2M1x1NjU4N1x1NEYxOFx1NTE0OFx1RkYxQlx1NkI2M1x1NjU4N1x1NUMxQVx1NjcyQVx1NTFGQVx1NzNCMFx1RkYwOHY0IFx1N0NGQlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNVx1NjNBOFx1NzQwNlx1RkYwOVx1NjVGNlx1NUM1NVx1NzkzQVx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwQ1x1OEJBOVx1NkQ0MVx1NUYwRlx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgIGxldCByZWFzb25pbmcgPSAnJztcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzaG93biA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcHRpbWl6ZVN0cmVhbSh7XG4gICAgICAgIGNvbmZpZzogZWZmZWN0aXZlLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgY29udGVudCArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFzb25pbmcgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0OiBzaG93biB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gXHU1MTQ4XHU1MjI0XHU1QjlBXHU0RTJEXHU2QjYyXHVGRjFBXHU3NTI4XHU2MjM3L1x1N0VDNFx1NEVGNlx1NTNENlx1NkQ4OFx1NEUwRVx1OEQ4NVx1NjVGNlx1OTBGRFx1ODg2OFx1NzNCMFx1NEUzQSBBYm9ydEVycm9yXHVGRjFCXHU0RUM1XHU4RDg1XHU2NUY2XHU1MTk5XHU1MTY1XHU5NTE5XHU4QkVGXHU2MDAxXG4gICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBcdTk4NzZcdTVDNDJcdTUxNUNcdTVFOTVcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTMgcmVqZWN0IFx1NURGMlx1ODhBQiAudGhlbiBcdTZEODhcdTUzMTZcdUZGMUJcdTZCNjRcdTU5MDRcdTRGRERcdTYyQTQgZmV0Y2ggXHU1MjA2XHU2NTJGXHU0RUU1XHU1OTE2XHU3Njg0XHU2MTBGXHU1OTE2XHU1RjAyXHU1RTM4XHVGRjA5XG4gICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhY3RpdmVDb250cm9sbGVyID09PSBjb250cm9sbGVyKSB7XG4gICAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIGdldEhvc3Q/OiAoKSA9PiB7IGFwaTogdW5rbm93bjsgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmcgfSB8IG51bGw7XG4gIGdldFNlc3Npb25JZD86ICgpID0+IHN0cmluZyB8IG51bGw7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUEtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5IFx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NVx1ODI3MiBcdTIxOTIgXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU0RTBEXHU1M0VGXHU4QkZCXHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5ICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRTdGF0ZShnZXRQcmV2aWV3QnVzU3RhdGUoKSkpLFxuICAgIFtdLFxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHsgc3RhdHVzLCByZXN1bHQsIGVycm9yS2luZCB9ID0gc3RhdGU7XG4gIGNvbnN0IFtjb3BpZWQsIHNldENvcGllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNvcHlUaW1lclJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMUFcdTUyMDdcdTYzNjJcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTRFMERcdThEREZcdTk2OEZcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdTU2REVcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTYwNjJcdTU5MERcdUZGMDlcbiAgaWYgKHN0YXR1cyAhPT0gJ2lkbGUnICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNpZCA9IGdldFNlc3Npb25JZD8uKCk7XG4gICAgaWYgKHNpZCAhPT0gbnVsbCAmJiBzdGF0ZS5zZXNzaW9uSWQgIT09IHNpZCkgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZXRyeSA9ICgpID0+IHtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHsgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXREcmFmdDogKCkgPT4gcmVhZENvbXBvc2VyVGV4dCgpLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9KTtcbiAgfTtcblxuICBjb25zdCByZXBsYWNlID0gKCkgPT4ge1xuICAgIHdyaXRlQ29tcG9zZXJUZXh0KHJlc3VsdCk7XG4gICAgY2xvc2VQcmV2aWV3KCk7XG4gIH07XG5cbiAgY29uc3QgY29weSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIHJldHVybjsgLy8gXHU5NzVFXHU1Qjg5XHU1MTY4XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4aHR0cCBcdTdCNDlcdUZGMDlcdUZGMUFcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjBDXHU0RkREXHU2MzAxXHU1M0VGXHU5MUNEXHU4QkQ1XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHJlc3VsdCk7XG4gICAgICBpZiAoIW1vdW50ZWRSZWYuY3VycmVudCkgcmV0dXJuOyAvLyBhd2FpdCBcdTY3MUZcdTk1RjRcdTdFQzRcdTRFRjZcdTVERjJcdTUzNzhcdThGN0RcdUZGMUFcdTRFMERcdTUxOEQgc2V0U3RhdGVcbiAgICAgIHNldENvcGllZCh0cnVlKTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRDb3BpZWQoZmFsc2UpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAxMjAwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTE5OVx1NTE2NVx1NTkzMVx1OEQyNVx1RkYxQVx1OTc1OVx1OUVEOFx1RkYwOFx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMDlcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1oZWFkXCI+XG4gICAgICAgIDxzcGFuPnt0KCdjYXJkLnRpdGxlJyl9PC9zcGFuPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgXHUyNzE1XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtzdGF0dXMgPT09ICdndWlkZScgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS50aXRsZScpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS5kZXNjJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17KCkgPT4geyBjbG9zZVByZXZpZXcoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdvcHRpbWl6aW5nJyAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPlxuICAgICAgICAgIHtzdGF0ZS5kcmFmdCA/IDxzcGFuIHN0eWxlPXt7IHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcgfX0+e3N0YXRlLmRyYWZ0fTwvc3Bhbj4gOiB0KCdjYXJkLm9wdGltaXppbmcnKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAncHJldmlldycgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPntyZXN1bHR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmVwbGFjZX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJlcGxhY2UnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gdm9pZCBjb3B5KCl9PlxuICAgICAgICAgICAgICB7Y29waWVkID8gdCgnY2FyZC5jb3B5RG9uZScpIDogdCgnY2FyZC5jb3B5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnZXJyb3InICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyclwiPnt0KGVycm9yS2V5KGVycm9yS2luZCkpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSIsICIvKiogXHU4QkJFXHU3RjZFIFx1MjE5MiBHZW5lcmFsIFx1NTMzQVx1MzAwQ1Byb21wdCBcdTRGMThcdTUzMTZcdTMwMERcdThCQkVcdTdGNkVcdTg4NENcdUZGMUFcdTY4MDdcdTk4OThcdTY0NThcdTg5ODEgKyBcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1TdGF0ZSwgU2V0dGluZ3NGb3JtVmFsdWVzIH0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtQWN0aW9ucyB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHsgb25PcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUm93UHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFNldHRpbmdzRm9ybVN0YXRlKSA9PiBUKSA9PiBUO1xuICBhY3Rpb25zOiBTZXR0aW5nc0Zvcm1BY3Rpb25zO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgc2F2ZUNvbmZpZzogKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiBQcm9taXNlPHZvaWQ+O1xuICByZXNldENvbmZpZzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0RXBvY2g6ICgpID0+IG51bWJlcjtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL3NldHRpbmdzLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLm9wdGlTZXR0aW5ncyB7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgcGFkZGluZzogMTZweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5vcHRpU2V0dGluZ3NUaXRsZSB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDIycHg7XG59XG4ub3B0aVNldHRpbmdzSGludCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzRm9ybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzRmllbGQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NMYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0lucHV0IHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ub3B0aVNldHRpbmdzUm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG4ub3B0aVNldHRpbmdzQnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMnB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQVx1NEUzQlx1OTg5OFx1NTNEOFx1OTFDRlx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1NEYxQVx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NS9cdTZERjFcdTY3ODFcdTdBRUZcdTgyNzJcdUZGMDhcdTlFRDFcdTVFOTVcdTlFRDFcdTVCNTdcdTMwMDFcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTU3NDdcdTg4QUJcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDlcdUZGMENcbiAgICAgXHU1NkZBXHU1QjlBXHU1NEMxXHU3MjRDXHU4NEREICsgXHU3NjdEXHU1QjU3XHU0RkREXHU4QkMxXHU0RUZCXHU0RjU1XHU0RTNCXHU5ODk4XHU1M0VGXHU4QkZCICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuLm9wdGlTZXR0aW5nc0VyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2V0dGluZ3NSb3cocHJvcHM6IFNldHRpbmdzUm93UHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBzYXZlQ29uZmlnLCByZXNldENvbmZpZywgZ2V0RXBvY2ggfSA9IHByb3BzO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIGdldEVwb2NoKCksXG4gICAgKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIH0sIFtjb25maWcuYmFzZVVybCwgY29uZmlnLmFwaUtleSwgY29uZmlnLm1vZGVsLCBnZXRFcG9jaF0pO1xuXG4gIC8vIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1RkYwOFx1OTg4NFx1ODlDOFx1NTM2MVx1NjcyQVx1OTE0RFx1N0Y2RVx1NUYxNVx1NUJGQ1x1RkYwOVx1MjE5MiBcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3BlblNldHRpbmdzUmVxdWVzdCgoKSA9PiBzZXRFeHBhbmRlZCh0cnVlKSksIFtdKTtcblxuICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIGNvbnN0IGVycm9ycyA9IGFjdGlvbnMudmFsaWRhdGUodmFsdWVzKTtcbiAgICBpZiAoZXJyb3JzKSB7XG4gICAgICBhY3Rpb25zLmZhaWwoT2JqZWN0LnZhbHVlcyhlcnJvcnMpWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNhdmVDb25maWcodmFsdWVzKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgICAvLyBcdTRFMEVcdTY1NDhcdTVFOTRcdTU2REVcdThERDFcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTdFQUFcdTUxNDNcdUZGMDlcdTVCRjlcdTlGNTBcdUZGMENcdTRGN0ZcdTRGRERcdTVCNThcdTU0MEVcdTc2ODRcdTkxQ0RcdTY0QURcdTc5Q0RcdTg4QUJcdTYyOTFcdTUyMzZcbiAgICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5zYXZlRmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZXNldENvbmZpZygpO1xuICAgICAgYWN0aW9ucy5zZWVkKFxuICAgICAgICB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfSxcbiAgICAgICAgc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSxcbiAgICAgICk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5yZXNldEZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmXG4gICAgICAgICAgKHZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCgnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCcpfTwvc3Bhbj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QodmFsdWVzLmFwaUtleSA/ICdjYXJkLmNvbmZpZ3VyZWQuaGludCcgOiAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCcpLnJlcGxhY2UoJ3ttb2RlbH0nLCBtb2RlbExhYmVsKX08L3NwYW4+XG4gICAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cblxuICAgICAge2V4cGFuZGVkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGb3JtXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCI+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgY2hlY2tlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgndXNlU2Vzc2lvbk1vZGVsJywgZS50YXJnZXQuY2hlY2tlZCl9XG4gICAgICAgICAgICAgIC8+eycgJ31cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCcpfVxuICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCcpfTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1iYXNlLXVybFwiPnt0KCdzZXR0aW5ncy5iYXNlVXJsJyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYmFzZS11cmxcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYmFzZVVybH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e0RFRkFVTFRTLmJhc2VVcmx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYmFzZVVybCcsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYXBpLWtleVwiPnt0KCdzZXR0aW5ncy5hcGlLZXknKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1hcGkta2V5XCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmFwaUtleX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJzay1cdTIwMjZcIlxuICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAnXHUyMDE0JyA6IERFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ21vZGVsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1Jvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuIHByaW1hcnlcIiBvbkNsaWNrPXtoYW5kbGVTYXZlfT5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnNhdmUnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuXCIgb25DbGljaz17aGFuZGxlUmVzZXR9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MucmVzZXQnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAge3NhdmVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3Muc2F2ZWQnKX08L3NwYW4+fVxuICAgICAgICAgICAge3JwY0Vycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPntycGNFcnJvcn08L3NwYW4+fVxuICAgICAgICAgICAgeyFycGNFcnJvciAmJiBlcnJvciAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NFcnJcIj57dChlcnJvcil9PC9zcGFuPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuZGVzYycpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOVx1RkYxQVx1ODM0OVx1N0EzRiArIFx1NjgyMVx1OUE4QyArIFx1NEZERFx1NUI1OFx1NTJBOFx1NEY1QyAqL1xuXG5pbXBvcnQgeyBkZWZpbmVTdG9yZSB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB7XG4gIElOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgcmVkdWNlU2V0dGluZ3NGb3JtLFxuICB2YWxpZGF0ZVNldHRpbmdzRm9ybSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1TdGF0ZSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1WYWx1ZXMsXG59IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtQWN0aW9ucyB7XG4gIHNlZWQodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBlZGl0KGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBjb21taXQocmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGZhaWwobWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbiAgLyoqIFx1NEZERFx1NUI1OFx1NTI0RFx1NjgyMVx1OUE4Q1x1RkYxQlx1OEZENFx1NTZERVx1OTUxOVx1OEJFRlx1NUI1N1x1NTE3OFx1RkYxQlx1NjVFMFx1OTUxOVx1OEJFRlx1NjVGNlx1OEZENFx1NTZERSBudWxsICovXG4gIHZhbGlkYXRlKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw7XG59XG5cbi8qKiBkZWZpbmVTdG9yZSBcdThGRDRcdTU2REVcdTc2ODQgc3RvcmUgXHU1M0U1XHU2N0M0XHVGRjA4XHU1NDBDXHU2NUY2XHU1M0VGXHU0RjVDXHU3QzdCXHU1NzhCXHU1MzYwXHU0RjREXHVGRjBDXHU0RjlCXHU2Q0U4XHU1MThDXHU2NUY2IGBzdG9yZTpgIFx1NEY3Rlx1NzUyOFx1RkYwOSAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSB7XG4gIC8vIFx1OEZEMFx1ODg0Q1x1NjVGNlx1NUY2Mlx1NzJCNlx1NzUzMSBEU0ggXHU2M0QwXHU0RjlCXHVGRjFCXHU2QjY0XHU1OTA0XHU0RUM1XHU0RTNBXHU2NTg3XHU2ODYzXHU2MDI3XHU3QzdCXHU1NzhCXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSA9ICgpOiBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSA9PiB7XG4gIGNvbnN0IGhhbmRsZSA9IGRlZmluZVN0b3JlKHtcbiAgICBpbml0OiAoKTogU2V0dGluZ3NGb3JtU3RhdGUgPT4gKHtcbiAgICAgIC8vIFx1NkJDRlx1NUI5RVx1NEY4Qlx1NTI2Rlx1NjcyQ1x1RkYxQUlOSVRJQUxfU0VUVElOR1NfRk9STSBcdTY2MkZcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMENcdTUyRkZcdThERThcdTVCOUVcdTRGOEJcdTUxNzFcdTRFQUJcdTVGMTVcdTc1MjhcdUZGMDhyZWR1Y2VyIFx1NzY4NCBkcmFmdCBcdTUxOTlcdTUxNjVcdTk3MDBcdTUzRDdcdTRGRERcdTYyQTRcdUZGMDlcbiAgICAgIC4uLklOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgICAgIHZhbHVlczogeyAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0udmFsdWVzIH0sXG4gICAgfSksXG4gICAgYWN0aW9uczoge1xuICAgICAgc2VlZDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnc2VlZCcsIHZhbHVlcywgcmV2aXNpb24gfSkpLFxuICAgICAgZWRpdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdlZGl0JywgZmllbGQsIHZhbHVlIH0pKSxcbiAgICAgIGNvbW1pdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdjb21taXQnLCByZXZpc2lvbiB9KSksXG4gICAgICBmYWlsOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIG1lc3NhZ2U6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZmFpbCcsIG1lc3NhZ2UgfSkpLFxuICAgICAgdmFsaWRhdGU6IChfZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlcnJvcnMpLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBlcnJvcnM7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTVcdTY4MjFcdTlBOEMgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtVmFsdWVzIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMUFcdTRGMThcdTUzMTZcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOCBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCB1cmwgPSB2YWx1ZXMuYmFzZVVybC50cmltKCk7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG4gICAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgICB9XG4gIH1cblxuICBpZiAoIXZhbHVlcy5hcGlLZXkudHJpbSgpKSBlcnJvcnMuYXBpS2V5ID0gJ3NldHRpbmdzLmFwaUtleSc7XG4gIGlmICghdmFsdWVzLnVzZVNlc3Npb25Nb2RlbCAmJiAhdmFsdWVzLm1vZGVsLnRyaW0oKSkgZXJyb3JzLm1vZGVsID0gJ3NldHRpbmdzLm1vZGVsJztcblxuICByZXR1cm4gZXJyb3JzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7XG4gIGRpcnR5OiBib29sZWFuO1xuICBzYXZlZDogYm9vbGVhbjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHJldmlzaW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBJTklUSUFMX1NFVFRJTkdTX0ZPUk06IFNldHRpbmdzRm9ybVN0YXRlID0ge1xuICB2YWx1ZXM6IHsgYmFzZVVybDogJycsIGFwaUtleTogJycsIG1vZGVsOiAnJywgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlIH0sXG4gIGRpcnR5OiBmYWxzZSxcbiAgc2F2ZWQ6IGZhbHNlLFxuICBlcnJvcjogbnVsbCxcbiAgcmV2aXNpb246IC0xLFxufTtcblxuZXhwb3J0IHR5cGUgU2V0dGluZ3NGb3JtQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdzZWVkJzsgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2VkaXQnOyBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzOyB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB9XG4gIHwgeyB0eXBlOiAnY29tbWl0JzsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlU2V0dGluZ3NGb3JtKHN0YXRlOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgYWN0aW9uOiBTZXR0aW5nc0Zvcm1BY3Rpb24pOiBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzZWVkJzpcbiAgICAgIHJldHVybiBhY3Rpb24ucmV2aXNpb24gPD0gc3RhdGUucmV2aXNpb25cbiAgICAgICAgPyBzdGF0ZVxuICAgICAgICA6IHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5hY3Rpb24udmFsdWVzIH0sIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5zdGF0ZS52YWx1ZXMsIFthY3Rpb24uZmllbGRdOiBhY3Rpb24udmFsdWUgfSwgZGlydHk6IHRydWUsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgICBjYXNlICdjb21taXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IHRydWUsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZXJyb3I6IGFjdGlvbi5tZXNzYWdlIH07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNVTyxJQUFNLFdBQXlCO0FBQUEsRUFDcEMsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsaUJBQWlCO0FBQ25CO0FBSU8sU0FBUyxpQkFBaUIsS0FBcUI7QUFDcEQsU0FBTyxJQUFJLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0QztBQUVPLFNBQVMsWUFBWSxLQUE2RDtBQUN2RixRQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksWUFBWSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksU0FBUztBQUN2RyxRQUFNLFNBQVMsT0FBTyxLQUFLLFdBQVcsV0FBVyxJQUFJLFNBQVMsU0FBUztBQUd2RSxRQUFNLFdBQVcsT0FBTyxLQUFLLFVBQVUsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksU0FBUztBQUNsRyxRQUFNLGtCQUNKLGFBQWEsbUJBQW1CLGlCQUFpQixPQUFPLE1BQU0sU0FBUyxVQUFVLFNBQVMsUUFBUTtBQUNwRyxRQUFNLFFBQVE7QUFDZCxRQUFNLGtCQUFrQixPQUFPLEtBQUssb0JBQW9CLFlBQVksSUFBSSxrQkFBa0IsU0FBUztBQUNuRyxTQUFPLEVBQUUsU0FBUyxpQkFBaUIs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QUFPO0FBQUEsWUFDYixXQUFXLE1BQU07QUFBQSxZQUNqQjtBQUFBLFlBQ0E7QUFBQSxZQUNBLFVBQVUsTUFBTTtBQUFBLFVBQ2xCO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUdELFFBQU0sWUFBWSxDQUFDLE1BQXFCO0FBQ3RDLFFBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLE9BQVE7QUFDcEMsVUFBTSxLQUFLLFNBQVM7QUFDcEIsUUFBSSxFQUFFLGNBQWMscUJBQXNCO0FBQzFDLE1BQUUsZUFBZTtBQUNqQix3QkFBb0I7QUFBQSxFQUN0QjtBQUNBLFdBQVMsaUJBQWlCLFdBQVcsU0FBUztBQUNoRDsiLAogICJuYW1lcyI6IFsic3RhdGUiLCAiUmVhY3QiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIiwgImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJzdGF0ZSJdCn0K

    return module.exports;
  }
});
