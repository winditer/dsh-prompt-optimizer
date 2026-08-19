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
  draft: ""
};
function reducePreview(state2, action) {
  switch (action.type) {
    case "begin":
      if (state2.status === "optimizing") return state2;
      return { ...state2, status: "optimizing", errorKind: null, draft: "", generation: state2.generation + 1 };
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
function closePreview() {
  if (activeController !== null) {
    activeController.abort();
    activeController = null;
  }
  dispatchPreview({ type: "close" });
}
async function runOptimize(ctx) {
  const config = ctx.getConfig();
  const draft = ctx.getDraft().trim();
  if (!draft) return;
  if (activeController !== null) return;
  dispatchPreview({ type: "begin" });
  const controller = new AbortController();
  activeController = controller;
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
    if (activeController === controller) activeController = null;
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
  const { t, getConfig, getLang, getSessionModel, getHost } = props;
  const [busy, setBusy] = (0, import_react.useState)(() => getPreviewBusState().status === "optimizing");
  (0, import_react.useEffect)(
    () => subscribePreviewBus(() => setBusy(getPreviewBusState().status === "optimizing")),
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
      getHost
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
  const { t, getConfig, getLang, openSettings, getSessionModel, getHost } = props;
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
  if (status === "idle") return null;
  const retry = () => {
    void runOptimize({ getConfig, getLang, getDraft: () => readComposerText(), getSessionModel, getHost });
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
            getHost
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
            getHost
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
      const saved = await rpcConfig("set", { patch: { baseUrl: written.baseUrl, apiKey: written.apiKey, model: written.model } });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnLCByZXNvbHZlU2Vzc2lvbk1vZGVsIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIGNvbnN0IGdldFNlc3Npb25Nb2RlbCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgICBjb25zdCBzZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiByZXNvbHZlU2Vzc2lvbk1vZGVsKGN0eC5jb25uZWN0aW9uLmFwaSBhcyBuZXZlciwgeyBzZXNzaW9uSWQgfSk7XG4gIH07XG5cbiAgLy8gMi42IFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOFx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERCArIFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1RkYxQVxuICAvLyBcdTUzRUZcdTU5MERcdTc1MjhcdTc2ODRcdTU2RkFcdTVCOUFcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdTYyN0ZcdThGN0RcdTRGMThcdTUzMTZcdUZGMUJcdTZBMjFcdTU3OEJcdTdFRTdcdTYyN0ZcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdUZGMDhzZWxlY3RNb2RlbFx1RkYwOVx1RkYwQ1xuICAvLyBcdTdFRDNcdTY3OUNcdTdFQ0Ygc2Vzc2lvbi5oaXN0b3J5IFx1OEY2RVx1OEJFMlx1NTg5RVx1OTFDRlx1NTQ0OFx1NzNCMFx1RkYwOFx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1RkYwOVxuICAvLyBcdTRFMzRcdTY1RjZcdTRGMUFcdThCREQgaWRcdUZGMUFcdTVCQkZcdTRFM0JcdTYzMDkgc2Vzc2lvbi08dXVpZD4gXHU3RUE2XHU1QjlBXHU2ODIxXHU5QThDXHVGRjBDXHU2NjZFXHU5MDFBXHU3N0VEIGlkIFx1NEYxQVx1ODhBQiBjcmVhdGUgXHU2MkQyXHU3RUREXHVGRjA4XHU1QjlFXHU2RDRCXHU2NUUwXHU0RjFBXHU4QkREIFx1MjE5MiBcdTRFMDBcdTc2RjRcdTdBN0FcdThGNkVcdThCRTJcdUZGMDlcbiAgY29uc3QgUE9fSE9TVF9TRVNTSU9OX0lEID0gJ3Nlc3Npb24tcG8tb3B0aW1pemVyLTlmM2MyYTdlLTFiNGQtNGM4YS05ZTZmLTJhNWI3ZDFjM2U5Zic7XG4gIGNvbnN0IGhvc3RBcGkgPSAoY3R4LmNvbm5lY3Rpb24uYXBpIGFzIG5ldmVyKSBhcyB7XG4gICAgY3JlYXRlKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgc2VsZWN0TW9kZWwocDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgcHJvdmlkZXI6IHN0cmluZzsgbW9kZWw6IHN0cmluZyB9KTogUHJvbWlzZTx1bmtub3duPjtcbiAgICBwcm9tcHQocDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgbW9kZTogJ3F1ZXVlJzsgY29udGVudDogQXJyYXk8eyB0eXBlOiAndGV4dCc7IHRleHQ6IHN0cmluZyB9PiB9KTogUHJvbWlzZTx1bmtub3duPjtcbiAgICBoaXN0b3J5KHA6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSk6IFByb21pc2U8eyBldmVudHM/OiB1bmtub3duIH0+O1xuICAgIGNhbmNlbChwOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pOiBQcm9taXNlPHVua25vd24+O1xuICAgIG1vZGVscyhwOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pOiBQcm9taXNlPHsgY3VycmVudD86IHsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nIH0gfSB8IG51bGw+O1xuICB9O1xuICBjb25zdCBnZXRIb3N0ID0gKCk6IHsgYXBpOiB0eXBlb2YgaG9zdEFwaTsgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7IHNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsID0+IHtcbiAgICBjb25zdCBwYXJlbnRTZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFwYXJlbnRTZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7IGFwaTogaG9zdEFwaSwgcGFyZW50U2Vzc2lvbklkLCBzZXNzaW9uSWQ6IFBPX0hPU1RfU0VTU0lPTl9JRCB9O1xuICB9O1xuXG4gIC8vIDMuIFx1OEJFRFx1OEEwMFx1OTU1Q1x1NTBDRlxuICBsZXQgbGFuZzogTGFuZyA9IGxhbmdPZihjdHgubG9jYWxlLmdldExvY2FsZSgpLmFjdGl2ZSk7XG4gIGN0eC5vbignbG9jYWxlL2NoYW5nZScsIChzbmFwOiB7IGFjdGl2ZTogc3RyaW5nIH0pID0+IHtcbiAgICBsYW5nID0gbGFuZ09mKHNuYXAuYWN0aXZlKTtcbiAgfSk7XG5cbiAgLy8gNC4gXHU0RjFBXHU4QkREXHU2OUZEXHU0RjREXHVGRjFBXHU2MzA5XHU5NEFFICsgXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XG4gIGN0eC5pbmplY3QoWydzbG90cycsICdzZXNzaW9ucyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1idXR0b24nLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3B0aW1pemVCdXR0b24sXG4gICAgICApLFxuICAgICk7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWNhcmQnLFxuICAgICAgICAgIG9yZGVyOiAxMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIG9wZW5TZXR0aW5nczogKCkgPT4gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKSxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICAgIGdldEhvc3QsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFByZXZpZXdDYXJkLFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA2LiBcdThCQkVcdTdGNkVcdTg4NENcdUZGMDhyb290IFx1NEY1Q1x1NzUyOFx1NTdERlx1RkYwOVxuICBjb25zdCBzZXR0aW5nc1N0b3JlID0gY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUoKTtcbiAgY29uc3Qgc2F2ZUNvbmZpZyA9IGFzeW5jIChyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPik6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IG1lcmdlZCA9IG1lcmdlQ29uZmlnKHsgLi4uY29uZmlnTWlycm9yLCAuLi5yYXcgfSk7XG4gICAgY29uc3Qgd3JpdHRlbjogUHJvbXB0Q29uZmlnID0ge1xuICAgICAgYmFzZVVybDogbWVyZ2VkLmJhc2VVcmwsXG4gICAgICBhcGlLZXk6IG1lcmdlZC5hcGlLZXkudHJpbSgpLFxuICAgICAgbW9kZWw6IG1lcmdlZC5tb2RlbCxcbiAgICAgIHVzZVNlc3Npb25Nb2RlbDogbWVyZ2VkLnVzZVNlc3Npb25Nb2RlbCxcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0JywgeyBwYXRjaDogeyBiYXNlVXJsOiB3cml0dGVuLmJhc2VVcmwsIGFwaUtleTogd3JpdHRlbi5hcGlLZXksIG1vZGVsOiB3cml0dGVuLm1vZGVsIH0gfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlc2V0Q29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0Jywge1xuICAgICAgICBwYXRjaDoge1xuICAgICAgICAgIGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IERFRkFVTFRTLm1vZGVsLFxuICAgICAgICAgIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuXG4gIGN0eC5pbmplY3QoWydzbG90cyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1zZXR0aW5ncycsXG4gICAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IHNldHRpbmdzU3RvcmUsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBzYXZlQ29uZmlnLFxuICAgICAgICAgICAgcmVzZXRDb25maWcsXG4gICAgICAgICAgICBnZXRFcG9jaDogKCkgPT4gY29uZmlnRXBvY2gsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFNldHRpbmdzUm93LFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA3LiBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMUFBbHQrT1x1RkYwOFx1NzEyNlx1NzBCOVx1NTcyOCB0ZXh0YXJlYSBcdTUxODVcdTY1RjZcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdUZGMDlcbiAgY29uc3Qgb25LZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoIWUuYWx0S2V5IHx8IGUuY29kZSAhPT0gJ0tleU8nKSByZXR1cm47XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIGlmICghKGVsIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZW1pdE9wdGltaXplUmVxdWVzdCgpO1xuICB9O1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKTtcbn1cblxuLy8gXHU1RjE1XHU3NTI4XHU1Qjg4XHU1MzZCXHVGRjFBXHU5MDdGXHU1MTREIHRyZWUtc2hha2UgXHU2Mzg5XHU3QzdCXHU1NzhCXHVGRjA4XHU0RUM1XHU2NTg3XHU2ODYzXHU2MDI3XHVGRjFCXHU2NUUwXHU4RkQwXHU4ODRDXHU2NUY2XHU4ODRDXHU0RTNBXHVGRjA5XG5leHBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfTsiLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTY4MzhcdTVGQzNcdUZGMUFcdTkxNERcdTdGNkVcdTY4MjFcdTlBOENcdTMwMDFPcGVuQUkgXHU1MTdDXHU1QkI5XHU4QzAzXHU3NTI4XHUzMDAxXHU3RUQzXHU2NzlDXHU2M0QwXHU1M0Q2IFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTk2RjYgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb21wdENvbmZpZyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIC8qKiB0cnVlXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjFCZmFsc2VcdUZGMUFcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWwgKi9cbiAgdXNlU2Vzc2lvbk1vZGVsOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstdjQtZmxhc2gnLFxuICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIC8vIFx1NjVFN1x1OUVEOFx1OEJBNFx1OEZDMVx1NzlGQlx1RkYxQVx1OUVEOFx1OEJBNCBiYXNlVXJsIFx1NEUwQlx1NkI4Qlx1NzU1OVx1NzY4NCBkZWVwc2Vlay1jaGF0XHVGRjA4djEgXHU5RUQ4XHU4QkE0XHVGRjA5XHU4OUM2XHU0RTNBXHU2NzJBXHU4QkJFXHU3RjZFXHVGRjBDXHU4NDNEXHU1MjMwXHU2NUIwXHU5RUQ4XHU4QkE0IGRlZXBzZWVrLXY0LWZsYXNoXHVGRjFCXG4gIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1OEZDNyBiYXNlVXJsXHVGRjA4XHU2NjNFXHU1RjBGXHU5MDA5XHU2MkU5XHVGRjA5XHU1MjE5XHU0RkREXHU3NTU5XHU1MzlGXHU2QTIxXHU1NzhCXHU1NDBEXG4gIGNvbnN0IHJhd01vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIGNvbnN0IG1pZ3JhdGVkRGVmYXVsdCA9XG4gICAgcmF3TW9kZWwgPT09ICdkZWVwc2Vlay1jaGF0JyAmJiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpID09PSBERUZBVUxUUy5iYXNlVXJsID8gREVGQVVMVFMubW9kZWwgOiByYXdNb2RlbDtcbiAgY29uc3QgbW9kZWwgPSBtaWdyYXRlZERlZmF1bHQ7XG4gIGNvbnN0IHVzZVNlc3Npb25Nb2RlbCA9IHR5cGVvZiByYXc/LnVzZVNlc3Npb25Nb2RlbCA9PT0gJ2Jvb2xlYW4nID8gcmF3LnVzZVNlc3Npb25Nb2RlbCA6IERFRkFVTFRTLnVzZVNlc3Npb25Nb2RlbDtcbiAgcmV0dXJuIHsgYmFzZVVybDogbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSwgYXBpS2V5LCBtb2RlbCwgdXNlU2Vzc2lvbk1vZGVsIH07XG59XG5cbmV4cG9ydCB0eXBlIENvbmZpZ1Byb2JsZW0gPSAnbWlzc2luZy1rZXknIHwgJ21pc3NpbmctbW9kZWwnIHwgJ2JhZC11cmwnO1xuZXhwb3J0IHR5cGUgQ29uZmlnQ2hlY2sgPSB7IG9rOiB0cnVlOyBjb25maWc6IFByb21wdENvbmZpZyB9IHwgeyBvazogZmFsc2U7IHJlYXNvbjogQ29uZmlnUHJvYmxlbSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb25maWcoY29uZmlnOiBQcm9tcHRDb25maWcpOiBDb25maWdDaGVjayB7XG4gIGlmICghY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1rZXknIH07XG4gIC8vIFx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NjVGNlx1NjVFMFx1OTcwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYxQlx1NEVDNVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NUYwRlx1ODk4MVx1NkM0MiBtb2RlbCBcdTk3NUVcdTdBN0FcbiAgaWYgKCFjb25maWcudXNlU2Vzc2lvbk1vZGVsICYmICFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nLCBzdHJlYW0gPSBmYWxzZSk6IG9iamVjdCB7XG4gIHJldHVybiB7XG4gICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZykgfSxcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB0ZXh0IH0sXG4gICAgXSxcbiAgICB0ZW1wZXJhdHVyZTogMC43LFxuICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgc3RyZWFtLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG5cbi8qKlxuICogU1NFIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQVx1NTE4NVx1NUJCOVx1NjIxNlx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1NzY4NFx1NEUwMFx1NkJCNVx1NjU4N1x1NjcyQ1x1MzAwMlxuICogdjQgXHU3Q0ZCXHU2QTIxXHU1NzhCXHVGRjA4djQtZmxhc2ggXHU3QjQ5XHVGRjA5XHU2RDQxXHU1RjBGXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1IHJlYXNvbmluZ19jb250ZW50XHVGRjA4XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjA5XHVGRjBDXHU5NjhGXHU1NDBFXHU2MjREXHU4RjkzXHU1MUZBXG4gKiBjb250ZW50IFx1NkI2M1x1NjU4N1x1MjAxNFx1MjAxNFx1NEUyNFx1ODAwNVx1OTBGRFx1ODk4MVx1NUI5RVx1NjVGNlx1NTQ0OFx1NzNCMFx1RkYwQ1x1NTQyNlx1NTIxOVx1NjNBOFx1NzQwNlx1NjcxRlx1NTM2MVx1NzI0N1x1NzcwQlx1OEQ3N1x1Njc2NVx1NTBDRlx1MzAwQ1x1OTc1RVx1NkQ0MVx1NUYwRlx1MzAwRFx1RkYwOFx1NUI5RVx1NkQ0QiB+ODAgXHU0RTJBIGNodW5rXG4gKiBcdTUxNjhcdTY2MkYgcmVhc29uaW5nXHVGRjBDXHU2QjYzXHU2NTg3XHU2NzAwXHU1NDBFXHU2MjREXHU1MUZBXHU3M0IwXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCB0eXBlIFNzZURlbHRhID1cbiAgfCB7IGtpbmQ6ICdjb250ZW50JzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6ICdyZWFzb25pbmcnOyB0ZXh0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTRFMDBcdTg4NEMgU1NFIFx1NjU3MFx1NjM2RVx1RkYxQShkYXRhOiB7Li4ufSkgXHUyMTkyIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQlxuICogW0RPTkVdL1x1OTc1RSBkYXRhIFx1ODg0Qy9cdTk3NUUgSlNPTi9cdTY1RTBcdTUxODVcdTVCQjkgZGVsdGEgXHUyMTkyIG51bGxcdTMwMDJcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTc2VEZWx0YShsaW5lOiBzdHJpbmcpOiBTc2VEZWx0YSB8IG51bGwge1xuICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gIGlmICghdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGF0YSA9IHRyaW1tZWQuc2xpY2UoJ2RhdGE6Jy5sZW5ndGgpLnRyaW0oKTtcbiAgaWYgKGRhdGEgPT09ICdbRE9ORV0nKSByZXR1cm4gbnVsbDtcbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IGRlbHRhPzogeyBjb250ZW50PzogdW5rbm93bjsgcmVhc29uaW5nX2NvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgZGVsdGEgPSBmaXJzdD8uZGVsdGE7XG4gIGlmICh0eXBlb2YgZGVsdGE/LmNvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAnY29udGVudCcsIHRleHQ6IGRlbHRhLmNvbnRlbnQgfTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8ucmVhc29uaW5nX2NvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAncmVhc29uaW5nJywgdGV4dDogZGVsdGEucmVhc29uaW5nX2NvbnRlbnQgfTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHVGRjFBXHU5MDEwXHU1NzU3XHU4OUUzXHU2NzkwIFNTRVx1RkYwQ1x1OEZCOVx1NjUzNlx1OEZCOVx1NTZERVx1OEMwMyBvblRleHQoZGVsdGEpXHVGRjFCXHU4RkQ0XHU1NkRFXHU1QjhDXHU2NTc0XHU2QjYzXHU2NTg3XHUzMDAyXG4gKiBcdTc2RjhcdTZCRDRcdTk3NUVcdTZENDFcdTVGMEYgb3B0aW1pemUoKVx1RkYxQVx1OTk5Nlx1NUI1N1x1NjZGNFx1NUZFQlx1MzAwMVx1OTU3Rlx1OEY5M1x1NTFGQVx1NEUwRFx1OTcwMFx1ODk4MVx1N0I0OVx1NUI4Q1x1NjU3NFx1NzUxRlx1NjIxMFx1MjAxNFx1MjAxNFx1NjMwOVx1OTRBRS9cdTUzNjFcdTcyNDdcdTgwRkRcdThGQjlcdTc1MUZcdTYyMTBcdThGQjlcdTY2M0VcdTc5M0FcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplU3RyZWFtKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIG9uRXZlbnQ/OiAoZGVsdGE6IFNzZURlbHRhKSA9PiB2b2lkO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwsIG9uRXZlbnQgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZywgdHJ1ZSkpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuICBpZiAoIXJlcy5ib2R5KSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ21pc3NpbmcgcmVzcG9uc2UgYm9keScpO1xuXG4gIGNvbnN0IHJlYWRlciA9IHJlcy5ib2R5LmdldFJlYWRlcigpO1xuICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGxldCBidWZmZXIgPSAnJztcbiAgbGV0IGZ1bGwgPSAnJztcbiAgdHJ5IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgIGlmIChkb25lKSBicmVhaztcbiAgICAgIGJ1ZmZlciArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci5zcGxpdCgnXFxuJyk7XG4gICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSA/PyAnJztcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShsaW5lKTtcbiAgICAgICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1REYyXHU0RTJEXHU2QjYyL1x1OTFDQVx1NjUzRVx1NjVGNlx1NUZGRFx1NzU2NVxuICAgIH1cbiAgfVxuICAvLyBcdTVDM0VcdTg4NENcdUZGMDhcdTY1RTBcdTYzNjJcdTg4NENcdTdFRDNcdTVDM0VcdTc2ODQgZGF0YSBcdTg4NENcdUZGMDlcbiAgaWYgKGJ1ZmZlci50cmltKCkpIHtcbiAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShidWZmZXIpO1xuICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdFJlc3VsdChmdWxsKTtcbiAgaWYgKCFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHUzMDBDXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDBEXHVGRjFBXHU4QzAzIGNvbm5lY3Rpb24gXHU3Njg0IHNlc3Npb24ubW9kZWxzIFJQQ1x1RkYwQ1x1NTNENiBjdXJyZW50Lm1vZGVsXHUzMDAyXG4gKiBhcGkgXHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjA4XHU0RTBFIERTSCBcdTg5RTNcdTgwMjZcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdUZGMUJcdTRFRkJcdTRGNTVcdTU5MzFcdThEMjVcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNlc3Npb25Nb2RlbChcbiAgYXBpOlxuICAgIHwge1xuICAgICAgICBzZXNzaW9ucz86IHtcbiAgICAgICAgICBtb2RlbHM/OiAocGF5bG9hZD86IHVua25vd24sIHNpZ25hbD86IEFib3J0U2lnbmFsKSA9PiBQcm9taXNlPHsgY3VycmVudD86IHsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQsXG4gIHBheWxvYWQ6IHVua25vd24gPSB7fSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICAvLyBcdTVGQzVcdTk4N0JcdTY0M0FcdTVFMjYgc2Vzc2lvbklkXHVGRjFBc2VydmVyIFx1N0FFRlx1NjMwOSByZXF1ZXN0LnBheWxvYWQuc2Vzc2lvbklkIFx1NjdFNVx1OEJFNVx1NEYxQVx1OEJERFx1NURGMlx1OTAwOVx1NjJFOVx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwQ1xuICAgIC8vIFx1N0YzQVx1NTkzMVx1NjVGNlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1RkYwOGRlZXBzZWVrLXY0LWZsYXNoXHVGRjA5XHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpPy5zZXNzaW9ucz8ubW9kZWxzPy4ocGF5bG9hZCwgc2lnbmFsKTtcbiAgICBjb25zdCBtID0gcmVzPy5jdXJyZW50Py5tb2RlbDtcbiAgICByZXR1cm4gdHlwZW9mIG0gPT09ICdzdHJpbmcnICYmIG0udHJpbSgpID8gbS50cmltKCkgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2M0QyXHU0RUY2XHU2NTg3XHU2ODQ4IFx1MjAxNCBcdTRFMkRcdTgyRjFcdTUzQ0NcdThCRUQgKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgY29uc3QgTlMgPSAncHJvbXB0X29wdGltaXplcic7XG5cbmV4cG9ydCBjb25zdCB6aCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ1x1NEYxOFx1NTMxNiBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdcdTRGMThcdTUzMTZcdTdFRDNcdTY3OUMnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1x1NjZGRlx1NjM2Mlx1ODM0OVx1N0EzRicsXG4gICdjYXJkLmNvcHknOiAnXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnXHU1REYyXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQucmV0cnknOiAnXHU5MUNEXHU2NUIwXHU0RjE4XHU1MzE2JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdcdTY1M0VcdTVGMDMnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdcdTVERjJcdTkxNERcdTdGNkUgXHUwMEI3IFx1NkEyMVx1NTc4QiB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnXHU2NzJBXHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS50aXRsZSc6ICdcdThCRjdcdTUxNDhcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLmRlc2MnOiAnXHU1MjREXHU1RjgwIFx1OEJCRVx1N0Y2RSBcdTIxOTIgXHU5MDFBXHU3NTI4XHU4QkJFXHU3RjZFIFx1MjE5MiBQcm9tcHQgXHU0RjE4XHU1MzE2XHVGRjBDXHU1ODZCXHU1MTk5XHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwXHUzMDAxQVBJIEtleSBcdTRFMEVcdTZBMjFcdTU3OEJcdTU0MERcdTMwMDInLFxuICAnZ3VpZGUuYWN0aW9uJzogJ1x1NTNCQlx1OEJCRVx1N0Y2RScsXG4gICdndWlkZS5kaXNtaXNzJzogJ1x1NzdFNVx1OTA1M1x1NEU4NicsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIEtleSBcdTY1RTBcdTY1NDhcdTYyMTZcdTVERjJcdThGQzdcdTY3MUYnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ1x1NjcwRFx1NTJBMVx1NjJEMlx1N0VERFx1OEJCRlx1OTVFRVx1RkYwODQwM1x1RkYwOScsXG4gICdlcnJvci50aW1lb3V0JzogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ1x1N0Y1MVx1N0VEQ1x1OTUxOVx1OEJFRlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5jb3JzJzogJ1x1NjNBNVx1NTNFM1x1NEUwRFx1NjUyRlx1NjMwMVx1OERFOFx1NTdERlx1RkYwQ1x1OEJGN1x1NjM2Mlx1NzUyOFx1NjUyRlx1NjMwMSBDT1JTIFx1NzY4NFx1N0Y1MVx1NTE3MycsXG4gICdlcnJvci5odHRwJzogJ1x1OEJGN1x1NkM0Mlx1NTkzMVx1OEQyNVx1RkYwOEhUVFAgXHU5NTE5XHU4QkVGXHVGRjA5JyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTY4M0NcdTVGMEZcdTVGMDJcdTVFMzgnLFxuICAnZXJyb3IuZW1wdHknOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU0RTNBXHU3QTdBXHVGRjBDXHU4QkY3XHU5MUNEXHU4QkQ1JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdcdTkxNERcdTdGNkVcdTRFMERcdTVCOENcdTY1NzRcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTY4QzBcdTY3RTUnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IFx1NEYxOFx1NTMxNicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ1x1OTE0RFx1N0Y2RVx1NkRBNlx1ODI3Mlx1NjNBNVx1NTNFM1x1RkYwOE9wZW5BSSBcdTUxN0NcdTVCQjlcdUZGMDlcdUZGMUJLZXkgXHU2NjBFXHU2NTg3XHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU1NzMwJyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ1x1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnXHU1RjAwXHU1NDJGXHU2NUY2XHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU4RERGXHU5NjhGXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCXHU1MTczXHU5NUVEXHU1NDBFXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnXHU1REYyXHU5MDA5XHU2MkU5XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdcdTRGRERcdTVCNThcdTU5MzFcdThEMjUnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnXHU5MUNEXHU3RjZFXHU1OTMxXHU4RDI1JyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgY29uc3QgZW46IExvY2FsZURpY3QgPSB7XG4gICdidXR0b24uYXJpYSc6ICdPcHRpbWl6ZSBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdPcHRpbWl6ZWQgcHJvbXB0JyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdVc2UgZHJhZnQnLFxuICAnY2FyZC5jb3B5JzogJ0NvcHknLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdDb3BpZWQnLFxuICAnY2FyZC5yZXRyeSc6ICdSZXRyeScsXG4gICdjYXJkLmRpc21pc3MnOiAnRGlzbWlzcycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnT3B0aW1pemluZ1x1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdDb25maWd1cmVkIFx1MDBCNyBtb2RlbCB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnTm8gQVBJIGNvbmZpZ3VyZWQnLFxuICAnZ3VpZGUudGl0bGUnOiAnQ29uZmlndXJlIHRoZSBBUEkgZmlyc3QnLFxuICAnZ3VpZGUuZGVzYyc6ICdHbyB0byBTZXR0aW5ncyBcdTIxOTIgR2VuZXJhbCBcdTIxOTIgUHJvbXB0IE9wdGltaXplciBhbmQgZmlsbCBpbiB0aGUgZW5kcG9pbnQsIEFQSSBrZXksIGFuZCBtb2RlbC4nLFxuICAnZ3VpZGUuYWN0aW9uJzogJ0dvIHRvIHNldHRpbmdzJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnR290IGl0JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkga2V5IGlzIGludmFsaWQgb3IgZXhwaXJlZCcsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnQWNjZXNzIGZvcmJpZGRlbiAoNDAzKScsXG4gICdlcnJvci50aW1lb3V0JzogJ1JlcXVlc3QgdGltZWQgb3V0OyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnTmV0d29yayBlcnJvcjsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5jb3JzJzogJ0VuZHBvaW50IGJsb2NrcyBDT1JTOyB1c2UgYSBnYXRld2F5IHRoYXQgYWxsb3dzIGl0JyxcbiAgJ2Vycm9yLmh0dHAnOiAnUmVxdWVzdCBmYWlsZWQgKEhUVFAgZXJyb3IpJyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdVbmV4cGVjdGVkIHJlc3BvbnNlIGZvcm1hdCcsXG4gICdlcnJvci5lbXB0eSc6ICdFbXB0eSByZXN1bHQ7IHBsZWFzZSByZXRyeScsXG4gICdlcnJvci5jb25maWcnOiAnSW5jb21wbGV0ZSBjb25maWd1cmF0aW9uOyBjaGVjayBzZXR0aW5ncycsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgT3B0aW1pemVyJyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnQ29uZmlndXJlIHRoZSByZXdyaXRlIGVuZHBvaW50IChPcGVuQUktY29tcGF0aWJsZSk7IGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBwbGFpbiB0ZXh0JyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnQmFzZSBVUkwnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnTW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1VzZSBjdXJyZW50IHNlc3Npb24gbW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdXaGVuIG9uLCBvcHRpbWl6YXRpb24gcmVxdWVzdHMgZm9sbG93IHRoZSBzZXNzaW9uIG1vZGVsOyB3aGVuIG9mZiwgdGhlIGN1c3RvbSBtb2RlbCBiZWxvdyBpcyB1c2VkJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnU2Vzc2lvbiBkZWZhdWx0IG1vZGVsIHNlbGVjdGVkJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIGdldEhvc3Q/OiAoKSA9PiB7IGFwaTogdW5rbm93bjsgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7IHNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjFBXHU0RjE4XHU1MTQ4XHU1M0Q2XHU3MTI2XHU3MEI5IHRleHRhcmVhXHVGRjFCXHU1NDI2XHU1MjE5XHU1NkRFXHU5MDAwXHU1MjMwXHU5ODc1XHU5NzYyXHU0RTJEXHUzMDBDXHU1MDNDXHU5NzVFXHU3QTdBXHUzMDBEXHU3Njg0IHRleHRhcmVhXG4gKiBcdUZGMDhcdTc1MjhcdTYyMzdcdTU3MjhcdThGOTNcdTUxNjVcdTc2ODRcdTUzNzNcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMDlcdTMwMDJcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NzY4NCBpbnB1dCBob29rXHUyMDE0XHUyMDE0XHU1QjlFXHU2RDRCXG4gKiBpbnB1dC5yaWdodCBcdTZFMzJcdTY3RDNcdTY1RjZcdThCRTVcdTY4MDdcdTUxQzYgcHJvcHMgXHU2NzJBXHU2M0QwXHU0RjlCXHVGRjBDXHU3RUM0XHU0RUY2XHU0RjFBXHU1NkUwXHU4QzAzXHU3NTI4IHVuZGVmaW5lZCBob29rXG4gKiBcdTVEMjlcdTZFODNcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdUZGMDhQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4IFx1NEUwRFx1NTNFRlx1ODlDMVx1RkYwOVx1MzAwMlxuICovXG5mdW5jdGlvbiByZWFkRHJhZnQoKTogc3RyaW5nIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHJldHVybiBhY3RpdmUudmFsdWU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKHRhLnZhbHVlLnRyaW0oKSkgcmV0dXJuIHRhLnZhbHVlO1xuICB9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QgfSA9IHByb3BzO1xuXG4gIC8vIFx1N0U0MVx1NUZEOVx1NjAwMVx1RkYxQVx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVxuICBjb25zdCBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldEJ1c3koZ2V0UHJldmlld0J1c1N0YXRlKCkuc3RhdHVzID09PSAnb3B0aW1pemluZycpKSxcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGJ1c3kpIHJldHVybjtcbiAgICBjb25zdCBkcmFmdCA9IGRyYWZ0UmVmLmN1cnJlbnQgfHwgcmVhZERyYWZ0KCk7XG4gICAgaWYgKCFkcmFmdC50cmltKCkpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gZHJhZnQsXG4gICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICBnZXRIb3N0LFxuICAgIH0pO1xuICB9LCBbYnVzeSwgZ2V0Q29uZmlnLCBnZXRMYW5nXSk7XG5cbiAgLy8gQWx0K08gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjA4aW5kZXgudHMgXHU1MTY4XHU1QzQwXHU3NkQxXHU1NDJDXHVGRjA5XHUyMTkyIFx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcHRpbWl6ZVJlcXVlc3QoaGFuZGxlQ2xpY2spLCBbaGFuZGxlQ2xpY2tdKTtcblxuICByZXR1cm4gKFxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPVwiZHNoLXBvLWJ0blwiXG4gICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgdGl0bGU9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICBhcmlhLWJ1c3k9e2J1c3l9XG4gICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgIGRhdGEtYnVzeT17YnVzeX1cbiAgICAgIG9uTW91c2VEb3duPXtzeW5jRHJhZnR9XG4gICAgICBvbkZvY3VzPXtzeW5jRHJhZnR9XG4gICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICA+XG4gICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgPC9idXR0b24+XG4gICk7XG59IiwgIi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RjE4XHU1MzE2XHVGRjA4XHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREICsgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NTZFMFx1NkI2NFx1NzUyOFx1NEUwMFx1NEUyQVx1NTNFRlx1NTkwRFx1NzUyOFx1NzY4NFx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NjI3Rlx1OEY3RFx1NEYxOFx1NTMxNlx1RkYxQVxuICogICBzZXNzaW9uLmNyZWF0ZVx1RkYwOFx1NTZGQVx1NUI5QSBzZXNzaW9uSWRcdUZGMENcdTVFNDJcdTdCNDlcdUZGMDlcdTIxOTIgc2Vzc2lvbi5zZWxlY3RNb2RlbFx1RkYwOFx1N0VFN1x1NjI3Rlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOVxuICogICBcdTIxOTIgc2Vzc2lvbi5wcm9tcHRcdUZGMDhxdWV1ZSBcdTZDRThcdTUxNjVcdTVFMjZcdTg5QzRcdTUyMTlcdTc2ODRcdTY1ODdcdTY3MkNcdUZGMDlcdTIxOTIgXHU4RjZFXHU4QkUyIHNlc3Npb24uaGlzdG9yeSBcdTU4OUVcdTkxQ0ZcdTUzRDZcdTZCNjNcdTY1ODdcdUZGMDhcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdUZGMDlcbiAqICAgXHUyMTkyIGFzc2lzdGFudC9tZXNzYWdlIFx1NEU4Qlx1NEVGNlx1NTFGQVx1NzNCMFx1RkYwOFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOVx1NjIxNlx1OEZERVx1N0VFRFx1NjVFMFx1NTNEOFx1NTMxNlx1RkYwOHNldHRsZVx1RkYwOVx1N0VEM1x1Njc1Rlx1RkYxQlx1NEUyRFx1NkI2Mlx1OEQ3MCBzZXNzaW9uLmNhbmNlbFx1MzAwMlxuICpcbiAqIFx1NEU4Qlx1NEVGNlx1NTk1MVx1N0VBNlx1NEVFNVx1NzcxRlx1NUI5RVx1NjMwMVx1NEU0NVx1NTMxNlx1NjgzN1x1NjcyQ1x1NjgyMVx1NTFDNlx1RkYwOH4vLmRzaC9zZXNzaW9ucyBcdTRFMEJcdTU0MDQgc2Vzc2lvbiBcdTc2RUVcdTVGNTVcdTc2ODQgc2Vzc2lvbi5qc29ubC56c3RkXHVGRjA5XHVGRjFBXG4gKiAgIC0gdXNlciBcdTZEODhcdTYwNkZcdUZGMUF7dHlwZTondXNlci9tZXNzYWdlJywgZGF0YTp7cm9sZTondXNlcicsIGNvbnRlbnQ6W3t0eXBlOid0ZXh0Jyx0ZXh0fV19fVxuICogICAtIFx1NTJBOVx1NjI0Qlx1NkQ0MVx1NUYwRlx1NTg5RVx1OTFDRlx1RkYxQXt0eXBlOidhc3Npc3RhbnQvY2h1bmsnLCBkYXRhOntjaHVuazp7dHlwZTonZGVsdGEnLCBibG9ja1R5cGU6J3RleHQnLCB0ZXh0fX19XG4gKiAgIC0gXHU1MkE5XHU2MjRCXHU2RDg4XHU2MDZGXHU1QjhDXHU2MjEwXHVGRjFBe3R5cGU6J2Fzc2lzdGFudC9tZXNzYWdlJywgZGF0YTp7bWVzc2FnZTp7cm9sZSwgY29udGVudDpbLi4uXX19fVx1RkYwOFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOVxuICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGJ1aWxkU3lzdGVtUHJvbXB0IH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogY29ubmVjdGlvbi5hcGkuc2Vzc2lvbnMgXHU3Njg0XHU2NzAwXHU1QzBGXHU5NzYyXHVGRjA4XHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHUzMDAyICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RTZXNzaW9uQXBpIHtcbiAgY3JlYXRlPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkPzogc3RyaW5nOyB3b3Jrc3BhY2VJZD86IHN0cmluZzsgY3dkPzogc3RyaW5nIH0pID0+IFByb21pc2U8dW5rbm93bj47XG4gIHNlbGVjdE1vZGVsPzogKHBheWxvYWQ6IHtcbiAgICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgICBwcm92aWRlcjogc3RyaW5nO1xuICAgIG1vZGVsOiBzdHJpbmc7XG4gICAgcmVhc29uaW5nRWZmb3J0Pzogc3RyaW5nO1xuICB9KSA9PiBQcm9taXNlPHVua25vd24+O1xuICBwcm9tcHQ/OiAocGF5bG9hZDogeyBzZXNzaW9uSWQ6IHN0cmluZzsgbW9kZTogJ3F1ZXVlJyB8ICdzdGVlcic7IGNvbnRlbnQ6IEFycmF5PHsgdHlwZTogJ3RleHQnOyB0ZXh0OiBzdHJpbmcgfT4gfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgaGlzdG9yeT86IChwYXlsb2FkOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pID0+IFByb21pc2U8eyBldmVudHM/OiBBcnJheTx7IGV2ZW50PzogdW5rbm93biB9PiB9PjtcbiAgY2FuY2VsPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgbW9kZWxzPzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0VGV4dEJsb2NrIHtcbiAgdHlwZT86IHN0cmluZztcbiAgdGV4dD86IHN0cmluZztcbiAgcm9sZT86IHN0cmluZztcbiAgY29udGVudD86IEhvc3RUZXh0QmxvY2tbXSB8IHN0cmluZztcbiAgW2s6IHN0cmluZ106IHVua25vd247XG59XG5cbi8qKiBcdTRFQ0VcdTRFOEJcdTRFRjYgZGF0YSBcdTZERjFcdTY0MUNcdTY1MzZcdTk2QzZcdTY1ODdcdTY3MkNcdTU3NTdcdUZGMDhge3R5cGU6J3RleHQnLHRleHR9YFx1RkYwOVx1RkYwQ3VzZXIgXHU0RThCXHU0RUY2XHU2NTc0XHU0RjUzXHU4REYzXHU4RkM3XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFRleHRzKGRhdGE6IEhvc3RUZXh0QmxvY2sgfCB1bmRlZmluZWQgfCBudWxsLCBvdXQ6IHN0cmluZ1tdLCBza2lwUm9sZVVzZXI6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFkYXRhIHx8IHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0JykgcmV0dXJuO1xuICBpZiAoZGF0YS5yb2xlID09PSAndXNlcicgJiYgc2tpcFJvbGVVc2VyKSByZXR1cm47XG4gIGlmICh0eXBlb2YgZGF0YS50eXBlID09PSAnc3RyaW5nJyAmJiBkYXRhLnR5cGUgIT09ICd1c2VyJyAmJiB0eXBlb2YgZGF0YS50ZXh0ID09PSAnc3RyaW5nJyAmJiBkYXRhLnRleHQubGVuZ3RoID4gMCkge1xuICAgIG91dC5wdXNoKGRhdGEudGV4dCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KGRhdGEuY29udGVudCkpIHtcbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgZGF0YS5jb250ZW50KSBjb2xsZWN0VGV4dHMocGFydCBhcyBIb3N0VGV4dEJsb2NrLCBvdXQsIHNraXBSb2xlVXNlcik7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uRm9sZCB7XG4gIC8qKiBcdTVERjJcdTY1MzZcdTk2QzZcdTc2ODRcdTUyQTlcdTYyNEJcdTZCNjNcdTY1ODdcdUZGMDhcdTZENDFcdTVGMEYgZGVsdGEgXHU1ODlFXHU5MUNGXHU2MkZDXHU2M0E1XHVGRjFCXHU4MkU1XHU2Q0ExXHU2NzA5IGRlbHRhIFx1NTIxOVx1NzUyOFx1NUI4Q1x1NjIxMFx1NkQ4OFx1NjA2Rlx1NzY4NFx1NTE2OFx1NjU4N1x1NTE1Q1x1NUU5NVx1RkYwOVx1MzAwMiAqL1xuICB0ZXh0OiBzdHJpbmc7XG4gIC8qKiBcdTY2MkZcdTU0MjZcdTUxRkFcdTczQjAgYXNzaXN0YW50L21lc3NhZ2UgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHUzMDAyICovXG4gIGNvbXBsZXRlZDogYm9vbGVhbjtcbn1cblxuLyoqIFx1NjI4QSBoaXN0b3J5IFx1NEU4Qlx1NEVGNlx1NTIxN1x1ODg2OFx1NjI5OFx1NTNFMFx1NEUzQSB7IFx1N0QyRlx1NzlFRlx1NkI2M1x1NjU4NywgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3IH1cdUZGMDhcdTYzMDkgc2VxIFx1N0EzM1x1NUI5QVx1NjM5Mlx1NUU4Rlx1RkYxQlx1OERGM1x1OEZDNyB1c2VyIFx1NEU4Qlx1NEVGNlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvbGRTZXNzaW9uVGV4dChldmVudHM6IEFycmF5PHsgZXZlbnQ/OiB1bmtub3duIH0+IHwgdW5kZWZpbmVkKTogU2Vzc2lvbkZvbGQge1xuICBjb25zdCBlbXB0eTogU2Vzc2lvbkZvbGQgPSB7IHRleHQ6ICcnLCBjb21wbGV0ZWQ6IGZhbHNlIH07XG4gIGlmICghQXJyYXkuaXNBcnJheShldmVudHMpKSByZXR1cm4gZW1wdHk7XG4gIHR5cGUgRXYgPSB7IHR5cGU/OiBzdHJpbmc7IHNlcT86IG51bWJlcjsgZGF0YT86IEhvc3RUZXh0QmxvY2sgfTtcbiAgY29uc3Qgc29ydGVkOiBFdltdID0gZXZlbnRzXG4gICAgLm1hcCgoZW50cnkpID0+IChlbnRyeSAmJiB0eXBlb2YgZW50cnkgPT09ICdvYmplY3QnID8gKChlbnRyeSBhcyB7IGV2ZW50PzogdW5rbm93biB9KS5ldmVudCBhcyBFdikgOiB1bmRlZmluZWQpKVxuICAgIC5maWx0ZXIoKGUpOiBlIGlzIEV2ID0+ICEhZSAmJiB0eXBlb2YgZSA9PT0gJ29iamVjdCcpO1xuICBzb3J0ZWQuc29ydCgoYSwgYikgPT4gKGEuc2VxID8/IDApIC0gKGIuc2VxID8/IDApKTtcbiAgY29uc3QgdGV4dHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBjb21wbGV0ZWQgPSBmYWxzZTtcbiAgbGV0IGZhbGxiYWNrID0gJyc7XG4gIGZvciAoY29uc3QgZXYgb2Ygc29ydGVkKSB7XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBldi50eXBlID09PSAnc3RyaW5nJyA/IGV2LnR5cGUgOiAnJztcbiAgICBpZiAodHlwZS5pbmNsdWRlcygndXNlcicpICYmICF0eXBlLmluY2x1ZGVzKCdhc3Npc3RhbnQnKSkgY29udGludWU7XG4gICAgaWYgKHR5cGUgPT09ICdhc3Npc3RhbnQvY2h1bmsnKSB7XG4gICAgICAvLyBcdTZENDFcdTVGMEZcdTU4OUVcdTkxQ0ZcdUZGMUFkYXRhLmNodW5rID0geyB0eXBlOidkZWx0YScsIGJsb2NrVHlwZTondGV4dCcsIHRleHQgfVxuICAgICAgY29uc3QgY2h1bmsgPSAoZXYuZGF0YSBhcyB7IGNodW5rPzogSG9zdFRleHRCbG9jayB9IHwgdW5kZWZpbmVkKT8uY2h1bms7XG4gICAgICBpZiAoY2h1bmsgJiYgY2h1bmsudHlwZSA9PT0gJ2RlbHRhJyAmJiBjaHVuay5ibG9ja1R5cGUgPT09ICd0ZXh0JyAmJiB0eXBlb2YgY2h1bmsudGV4dCA9PT0gJ3N0cmluZycgJiYgY2h1bmsudGV4dCkge1xuICAgICAgICB0ZXh0cy5wdXNoKGNodW5rLnRleHQpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSAnYXNzaXN0YW50L21lc3NhZ2UnKSB7XG4gICAgICAvLyBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMUJcdTZEODhcdTYwNkZcdTUxNjhcdTY1ODdcdTRGNUNcdTRFM0EgZGVsdGEgXHU3RjNBXHU1OTMxXHU2NUY2XHU3Njg0XHU1MTVDXHU1RTk1XHVGRjA4XHU5MDdGXHU1MTREXHU0RTBFXHU1ODlFXHU5MUNGXHU5MUNEXHU1OTBEXHVGRjBDXHU0RUM1XHU2NUUwIGRlbHRhIFx1NjVGNlx1NEY3Rlx1NzUyOFx1RkYwOVxuICAgICAgY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAoZXYuZGF0YSBhcyB7IG1lc3NhZ2U/OiBIb3N0VGV4dEJsb2NrIH0gfCB1bmRlZmluZWQpPy5tZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UgJiYgdHlwZW9mIG1lc3NhZ2UgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IGJ1Zjogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29sbGVjdFRleHRzKG1lc3NhZ2UsIGJ1ZiwgZmFsc2UpO1xuICAgICAgICBmYWxsYmFjayArPSBidWYuam9pbignJyk7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbiAgLy8gXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU2NUY2XHU0RjE4XHU1MTQ4XHU1QjhDXHU2NTc0XHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHVGRjA4XHU2RDQxXHU1RjBGXHU1ODlFXHU5MUNGXHU4RjZFXHU4QkUyXHU1RkVCXHU3MTY3XHU1M0VGXHU4MEZEXHU2NzJBXHU1MjMwXHU2NzAwXHU3RUM4IGRlbHRhXHVGRjBDXHU2RDg4XHU2MDZGXHU1MTY4XHU2NTg3XHU2NkY0XHU1QjhDXHU2NTc0XHVGRjA5XG4gIGNvbnN0IHRleHQgPSBjb21wbGV0ZWQgPyBmYWxsYmFjayB8fCB0ZXh0cy5qb2luKCcnKSA6IHRleHRzLmpvaW4oJycpO1xuICByZXR1cm4geyB0ZXh0LCBjb21wbGV0ZWQgfTtcbn1cblxuLyoqIFx1N0QyRlx1NzlFRlx1NjU4N1x1NjcyQ1x1NjMwOVx1NUI1N1x1N0IyNlx1NTI0RFx1N0YwMFx1OEJBMVx1N0I5N1x1NTg5RVx1OTFDRlx1RkYwOFx1OEY2RVx1OEJFMlx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1NzUyOFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpeERlbHRhKHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbiA9IE1hdGgubWluKHByZXYubGVuZ3RoLCBuZXh0Lmxlbmd0aCk7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBuICYmIHByZXYuY2hhckNvZGVBdChpKSA9PT0gbmV4dC5jaGFyQ29kZUF0KGkpKSBpICs9IDE7XG4gIHJldHVybiBuZXh0LnNsaWNlKGkpO1xufVxuXG4vKiogXHU3RUQ5XHU2MzAyXHU4RDc3XHU3Njg0IFJQQyBcdThDMDNcdTc1MjhcdTUyQTBcdThEODVcdTY1RjZcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRFRkJcdTRGNTVcdTRFMDBcdTZCNjVcdTkwRkRcdTRFMERcdTUxNDFcdThCQjhcdTY1RTBcdTk2NTBcdTk2M0JcdTU4NUUgXHUyMTkyXHUzMDBDXHU0RTAwXHU3NkY0XHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKGAke2xhYmVsfS10aW1lb3V0YCkpLCBtcyk7XG4gICAgcHJvbWlzZS50aGVuKFxuICAgICAgKHYpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0sXG4gICAgICAoZSkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMge1xuICBhcGk6IEhvc3RTZXNzaW9uQXBpO1xuICAvKiogXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHVGRjA4XHU2QTIxXHU1NzhCXHU2NzY1XHU2RTkwXHVGRjA5XHUzMDAyICovXG4gIHBhcmVudFNlc3Npb25JZDogc3RyaW5nO1xuICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgdGV4dDogc3RyaW5nO1xuICBzaWduYWw6IEFib3J0U2lnbmFsO1xuICBvbkRlbHRhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBpbnRlcnZhbE1zPzogbnVtYmVyO1xuICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gIC8qKiBcdTY1RTBcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdTY1RjZcdUZGMENcdTY1ODdcdTY3MkNcdTRFMERcdTUxOERcdTU4OUVcdTk1N0YgTiBcdThGNkVcdTU0MEVcdTg5QzZcdTRFM0FcdTVCOENcdTYyMTBcdUZGMDhcdTU5NTFcdTdFQTZcdTUxNUNcdTVFOTVcdUZGMDlcdTMwMDIgKi9cbiAgc2V0dGxlUm91bmRzPzogbnVtYmVyO1xuICAvKiogXHU1MzU1XHU2QjY1IFJQQyBcdTYzMDJcdThENzdcdTRFMEFcdTk2NTBcdUZGMDhcdTlFRDhcdThCQTQgNXNcdUZGMDlcdTMwMDIgKi9cbiAgcnBjVGltZW91dE1zPzogbnVtYmVyO1xufVxuXG5jb25zdCBERUZBVUxUX0lOVEVSVkFMX01TID0gNDAwO1xuY29uc3QgREVGQVVMVF9USU1FT1VUX01TID0gMTIwXzAwMDtcbmNvbnN0IERFRkFVTFRfU0VUVExFX1JPVU5EUyA9IDM7XG5jb25zdCBERUZBVUxUX1JQQ19USU1FT1VUX01TID0gNV8wMDA7XG5cbi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU1MTY4XHU2RDQxXHU3QTBCXHVGRjFBXHU1MjFCXHU1RUZBL1x1NTkwRFx1NzUyOFx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERCBcdTIxOTIgXHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCIFx1MjE5MiBcdTZDRThcdTUxNjVcdTRGMThcdTUzMTYgcHJvbXB0XG4gKiBcdTIxOTIgXHU4RjZFXHU4QkUyIGhpc3RvcnkgXHU3NkY0XHU4MUYzIGFzc2lzdGFudC9tZXNzYWdlIFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwOFx1NjIxNiBzZXR0bGUgLyBhYm9ydCAvIFx1OEQ4NVx1NjVGNlx1RkYwOVx1MzAwMlx1OEZENFx1NTZERVx1NjcwMFx1N0VDOFx1NkI2M1x1NjU4N1x1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSG9zdE9wdGltaXplKG9wdHM6IFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGFwaSwgcGFyZW50U2Vzc2lvbklkLCBzZXNzaW9uSWQsIGxhbmcsIHRleHQsIHNpZ25hbCwgb25EZWx0YSB9ID0gb3B0cztcbiAgY29uc3QgaW50ZXJ2YWxNcyA9IG9wdHMuaW50ZXJ2YWxNcyA/PyBERUZBVUxUX0lOVEVSVkFMX01TO1xuICBjb25zdCB0aW1lb3V0TXMgPSBvcHRzLnRpbWVvdXRNcyA/PyBERUZBVUxUX1RJTUVPVVRfTVM7XG4gIGNvbnN0IHNldHRsZVJvdW5kcyA9IG9wdHMuc2V0dGxlUm91bmRzID8/IERFRkFVTFRfU0VUVExFX1JPVU5EUztcbiAgY29uc3QgcnBjVGltZW91dE1zID0gb3B0cy5ycGNUaW1lb3V0TXMgPz8gREVGQVVMVF9SUENfVElNRU9VVF9NUztcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcblxuICAvLyAxLiBcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdUZGMDhcdTVFNDJcdTdCNDlcdUZGMUFcdTVERjJcdTVCNThcdTU3MjhcdTUyMTlcdTVGRkRcdTc1NjVcdTU5MzFcdThEMjVcdUZGMDlcbiAgdHJ5IHtcbiAgICBhd2FpdCB3aXRoVGltZW91dChhcGkuY3JlYXRlPy4oeyBzZXNzaW9uSWQgfSkgPz8gUHJvbWlzZS5yZXNvbHZlKCksIHJwY1RpbWVvdXRNcywgJ2NyZWF0ZScpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBcdTVERjJcdTVCNThcdTU3MjhcdUZGMDhcdTU5MERcdTc1MjhcdUZGMDlcdTYyMTZcdTVCQkZcdTRFM0JcdTY2ODJcdTRFMERcdTUxNDFcdThCQjhcdTIwMTRcdTIwMTRcdTdFRTdcdTdFRURcdUZGMENoaXN0b3J5IFx1NEYxQVx1NTQ0QVx1OEJDOVx1NjIxMVx1NEVFQ1x1ODBGRFx1NEUwRFx1ODBGRFx1NzUyOFxuICB9XG5cbiAgLy8gMi4gXHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjA4cHJvdmlkZXIgKyBtb2RlbFx1RkYwOVxuICB0cnkge1xuICAgIGNvbnN0IHBhcmVudCA9IGF3YWl0IHdpdGhUaW1lb3V0KGFwaS5tb2RlbHM/Lih7IHNlc3Npb25JZDogcGFyZW50U2Vzc2lvbklkIH0pID8/IFByb21pc2UucmVzb2x2ZSgpLCBycGNUaW1lb3V0TXMsICdtb2RlbHMnKTtcbiAgICBpZiAocGFyZW50Py5jdXJyZW50Py5tb2RlbCkge1xuICAgICAgYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgICAgIGFwaS5zZWxlY3RNb2RlbD8uKHtcbiAgICAgICAgICBzZXNzaW9uSWQsXG4gICAgICAgICAgcHJvdmlkZXI6IHBhcmVudC5jdXJyZW50LnByb3ZpZGVyID8/ICdkZWVwc2Vlay1vZmZpY2lhbCcsXG4gICAgICAgICAgbW9kZWw6IHBhcmVudC5jdXJyZW50Lm1vZGVsLFxuICAgICAgICB9KSA/PyBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAgICAgcnBjVGltZW91dE1zLFxuICAgICAgICAnc2VsZWN0TW9kZWwnLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIFx1NkEyMVx1NTc4Qlx1N0VFN1x1NjI3Rlx1NTkzMVx1OEQyNVx1RkYxQVx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NzUyOFx1NTE3Nlx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1N0VFN1x1N0VFRFxuICB9XG5cbiAgLy8gMy4gXHU2Q0U4XHU1MTY1XHU0RjE4XHU1MzE2XHU2MzA3XHU0RUU0XHVGRjA4XHU4OUM0XHU1MjE5XHU2MkZDXHU4RkRCIHVzZXIgXHU2NTg3XHU2NzJDXHUyMDE0XHUyMDE0XHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU2NUUwXHU2MzAxXHU0RTQ1IHN5c3RlbVx1RkYwOVxuICBjb25zdCBzeXN0ZW0gPSBidWlsZFN5c3RlbVByb21wdChsYW5nKTtcbiAgY29uc3QgY29udGVudCA9IGAke3N5c3RlbX1cXG5cXG4ke3RleHR9YDtcbiAgYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgYXBpLnByb21wdD8uKHsgc2Vzc2lvbklkLCBtb2RlOiAncXVldWUnLCBjb250ZW50OiBbeyB0eXBlOiAndGV4dCcsIHRleHQ6IGNvbnRlbnQgfV0gfSkgPz8gUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgcnBjVGltZW91dE1zLFxuICAgICdwcm9tcHQnLFxuICApO1xuXG4gIC8vIDQuIFx1OEY2RVx1OEJFMiBoaXN0b3J5XHVGRjFBZGVsdGEgXHU1ODlFXHU5MUNGXHU2RDQxXHU1RjBGXHU1NDQ4XHU3M0IwXHVGRjFCYXNzaXN0YW50L21lc3NhZ2UgXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHU1MjMwXHU4RkJFXHU3QUNCXHU1MzczXHU2NTM2XHU1QzNFXG4gIGNvbnN0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICBsZXQgbGFzdFRleHQgPSAnJztcbiAgbGV0IGlkbGVSb3VuZHMgPSAwO1xuICBmb3IgKDs7KSB7XG4gICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhcGkuY2FuY2VsPy4oeyBzZXNzaW9uSWQgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gXHU1QzNEXHU1MjlCXHU1M0Q2XHU2RDg4XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICB9XG4gICAgaWYgKERhdGUubm93KCkgLSBzdGFydGVkID4gdGltZW91dE1zKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhcGkuY2FuY2VsPy4oeyBzZXNzaW9uSWQgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gXHU1QzNEXHU1MjlCXHU1M0Q2XHU2RDg4XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RpbWVvdXQnKTtcbiAgICB9XG4gICAgbGV0IGZvbGQ6IFNlc3Npb25Gb2xkID0geyB0ZXh0OiAnJywgY29tcGxldGVkOiBmYWxzZSB9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgYXBpLmhpc3Rvcnk/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIGZvbGQgPSBmb2xkU2Vzc2lvblRleHQocGFnZT8uZXZlbnRzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTM1NVx1NkIyMVx1NTNENlx1NTkzMVx1OEQyNVx1NEUwRFx1ODFGNFx1NTQ3RFx1RkYwQ1x1NEUwQlx1NEUwMFx1OEY2RVx1NTE4RFx1OEJENVxuICAgIH1cbiAgICBpZiAoZm9sZC5jb21wbGV0ZWQpIHtcbiAgICAgIC8vIFx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYxQVx1NEVFNVx1NUY1M1x1NTI0RFx1RkYwOFx1NTQyQlx1NjcwMFx1N0VDOCBkZWx0YS9cdTUxNjhcdTY1ODdcdTUxNUNcdTVFOTVcdUZGMDlcdTY1ODdcdTY3MkNcdTY1MzZcdTVDM0VcbiAgICAgIGlmIChmb2xkLnRleHQgIT09IGxhc3RUZXh0ICYmIGZvbGQudGV4dCkgb25EZWx0YShmb2xkLnRleHQpO1xuICAgICAgcmV0dXJuIGZvbGQudGV4dDtcbiAgICB9XG4gICAgaWYgKGZvbGQudGV4dCAhPT0gbGFzdFRleHQpIHtcbiAgICAgIGlkbGVSb3VuZHMgPSAwO1xuICAgICAgY29uc3QgZGVsdGEgPSBwcmVmaXhEZWx0YShsYXN0VGV4dCwgZm9sZC50ZXh0KTtcbiAgICAgIGxhc3RUZXh0ID0gZm9sZC50ZXh0O1xuICAgICAgaWYgKGRlbHRhKSBvbkRlbHRhKGxhc3RUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWRsZVJvdW5kcyArPSAxO1xuICAgICAgaWYgKGlkbGVSb3VuZHMgPj0gc2V0dGxlUm91bmRzKSBicmVhaztcbiAgICB9XG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgaW50ZXJ2YWxNcykpO1xuICB9XG4gIHJldHVybiBsYXN0VGV4dDtcbn0iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbiAgLyoqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1NEUyRFx1NzY4NFx1NTg5RVx1OTFDRlx1NjU4N1x1NjcyQ1x1RkYwOG9wdGltaXppbmcgXHU2MDAxXHU1QjlFXHU2NUY2XHU2NkY0XHU2NUIwXHVGRjFCXHU5NzVFXHU2RDQxXHU1RjBGXHU1MTY4XHU3QTBCXHU0RTNBXHU3QTdBXHU0RTMyXHVGRjA5ICovXG4gIGRyYWZ0OiBzdHJpbmc7XG59XG5cbi8qKiBcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMUFyZWR1Y2VyIFx1NkMzOFx1NEUwRFx1NTE5OVx1NTZERVx1NUI4M1x1NjIxNlx1OEZENFx1NTZERVx1NTNFRlx1NTNEOFx1NzY4NFx1NjVCMFx1NUJGOVx1OEM2MVx1RkYxQlx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOFRhc2sgNCBzdG9yZSBcdTgwRjZcdTZDMzRcdUZGMDlcdTVGQzVcdTk4N0JcdTRFRTUgeyAuLi5JTklUSUFMX1BSRVZJRVcgfSBcdTRFM0FcdTZCQ0ZcdTRGMUFcdThCRERcdTc5Q0RcdTVCNTAgKi9cbmV4cG9ydCBjb25zdCBJTklUSUFMX1BSRVZJRVc6IFByZXZpZXdTdGF0ZSA9IHtcbiAgc3RhdHVzOiAnaWRsZScsXG4gIHJlc3VsdDogJycsXG4gIGVycm9yS2luZDogbnVsbCxcbiAgZ2VuZXJhdGlvbjogMCxcbiAgZHJhZnQ6ICcnLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCB9XG4gIHwgeyB0eXBlOiAnZ3VpZGUnIH1cbiAgfCB7IHR5cGU6ICdjbG9zZScgfVxuICB8IHsgdHlwZTogJ2RyYWZ0JzsgdGV4dDogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VQcmV2aWV3KHN0YXRlOiBQcmV2aWV3U3RhdGUsIGFjdGlvbjogUHJldmlld0FjdGlvbik6IFByZXZpZXdTdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdiZWdpbic6XG4gICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycpIHJldHVybiBzdGF0ZTtcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdvcHRpbWl6aW5nJywgZXJyb3JLaW5kOiBudWxsLCBkcmFmdDogJycsIGdlbmVyYXRpb246IHN0YXRlLmdlbmVyYXRpb24gKyAxIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0LCBkcmFmdDogJycgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAnZXJyb3InLCBlcnJvcktpbmQ6IGFjdGlvbi5raW5kIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdndWlkZSc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyBzdGF0ZSA6IHsgLi4uc3RhdGUsIHN0YXR1czogJ2d1aWRlJyB9O1xuICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgIHJldHVybiBJTklUSUFMX1BSRVZJRVc7XG4gICAgY2FzZSAnZHJhZnQnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8geyAuLi5zdGF0ZSwgZHJhZnQ6IGFjdGlvbi50ZXh0IH0gOiBzdGF0ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHN0YXRlO1xuICB9XG59XG5cbi8qKiBcdThCQTFcdTUyMTJcdTg5QzRcdTVCOUFcdTc2ODRcdTUxNkNcdTVGMDAgQVBJXHVGRjA4VGFzayA0IFx1OEQ3N1x1NUI1OFx1NTcyOFx1RkYxQmNhblRyaWdnZXIgXHU3Njg0ICFidXN5IFx1NTM0QVx1OEZCOVx1NjI3Rlx1NjJDNVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1ODA0Q1x1OEQyM1x1RkYwQ1x1NTE3Nlx1NEY1OVx1NEZERFx1NzU1OVx1NEVFNVx1NTkwN1x1NTQwRVx1N0VFRFx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbk9wdGltaXplRnJvbShzdGF0dXM6IFByZXZpZXdTdGF0dXMpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0YXR1cyAhPT0gJ29wdGltaXppbmcnO1xufVxuIiwgIi8qKiBcdTk4ODRcdTg5QzhcdTcyQjZcdTYwMDFcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkYgXHUyMDE0XHUyMDE0IFx1NjMwOVx1OTRBRS9cdTk4ODRcdTg5QzhcdTUzNjEvcnVuT3B0aW1pemUgXHU1MTcxXHU0RUFCXHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgKi9cblxuaW1wb3J0IHtcbiAgSU5JVElBTF9QUkVWSUVXLFxuICByZWR1Y2VQcmV2aWV3LFxuICB0eXBlIFByZXZpZXdBY3Rpb24sXG4gIHR5cGUgUHJldmlld1N0YXRlLFxufSBmcm9tICcuL3ByZXZpZXctc3RhdGUuanMnO1xuXG4vKiogXHU2QTIxXHU1NzU3XHU3RUE3XHU1MzU1XHU0RjhCXHU3MkI2XHU2MDAxXHVGRjA4XHU2QkNGXHU2M0QyXHU0RUY2XHU1QjlFXHU0RjhCXHU0RTAwXHU0RUZEXHVGRjFBXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU1MTg1XHU1MTY4XHU1QzQwXHU1NTJGXHU0RTAwXHVGRjA5ICovXG5sZXQgc3RhdGU6IFByZXZpZXdTdGF0ZSA9IHsgLi4uSU5JVElBTF9QUkVWSUVXIH07XG5jb25zdCBsaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbi8qKiBcdThCRkJcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdUZGMDhcdTdBMzNcdTVCOUFcdTVGMTVcdTc1MjhcdTc2RjRcdTUyMzBcdTRFMEJcdTRFMDBcdTZCMjEgZGlzcGF0Y2hcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3QnVzU3RhdGUoKTogUHJldmlld1N0YXRlIHtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vKiogXHU2RDNFXHU1M0QxXHU3MkI2XHU2MDAxXHU2NzNBXHU1MkE4XHU0RjVDXHU1RTc2XHU5MDFBXHU3N0U1XHU4QkEyXHU5NjA1XHU4MDA1ICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hQcmV2aWV3KGFjdGlvbjogUHJldmlld0FjdGlvbik6IHZvaWQge1xuICBzdGF0ZSA9IHJlZHVjZVByZXZpZXcoc3RhdGUsIGFjdGlvbik7XG4gIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSBsaXN0ZW5lcigpO1xufVxuXG4vKiogXHU4QkEyXHU5NjA1XHU1M0Q4XHU1MzE2XHVGRjFCXHU4RkQ0XHU1NkRFXHU5MDAwXHU4QkEyXHU1MUZEXHU2NTcwICovXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlUHJldmlld0J1cyhsaXN0ZW5lcjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfTtcbn0iLCAiLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5MiBydW5PcHRpbWl6ZSArIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNiBcdTIwMTRcdTIwMTQgXHU3MkI2XHU2MDAxXHU3RUNGXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdTUzRDFcdTVFMDNcdUZGMENcbiAqICBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwOFx1Njg0Q1x1OTc2Mlx1NkUzMlx1NjdEM1x1NUM0Mlx1NUJGOSBpbnB1dC5yaWdodC9vdmVybGF5IFx1NjlGRFx1NEY0RFx1NEUwRFx1NjNEMFx1NEY5Qlx1OEZEOVx1NEU5Qlx1NjgwN1x1NTFDNiBwcm9wc1x1RkYwQ1xuICogIFx1N0VDNFx1NEVGNlx1NEY5RFx1OEQ1Nlx1NUI4M1x1NEVFQ1x1NEYxQVx1NUQyOVx1NUU3Nlx1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1MjAxNFx1MjAxNFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjgvXHU5ODg0XHU4OUM4XHU1MzYxXHU0RTBEXHU1M0VGXHU4OUMxXHU3Njg0XHU1QjlFXHU2RDRCXHU1QjlBXHU4QkJBXHVGRjA5XHUzMDAyICovXG5cbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZVN0cmVhbSxcbiAgcmVzb2x2ZVNlc3Npb25Nb2RlbCxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuSG9zdE9wdGltaXplLCB0eXBlIEhvc3RTZXNzaW9uQXBpIH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5pbXBvcnQgeyBkaXNwYXRjaFByZXZpZXcgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuLyoqXG4gKiBcdTVGNTNcdTUyNEQgaW4tZmxpZ2h0IFx1OEJGN1x1NkM0Mlx1NzY4NFx1NjNBN1x1NTIzNlx1NTY2OFx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYwOVx1RkYxQVxuICogLSBcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdTY1RjZcdTRFMkRcdTZCNjJcdTVCODNcdUZGMENcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2hvdygpL2ZhaWwoKSBcdTU5MERcdTZEM0JcdTVERjJcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdUZGMUJcbiAqIC0gcnVuT3B0aW1pemUgXHU0RUU1XHUzMDBDXHU1QjU4XHU1NzI4XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2XHU1NjY4XHUzMDBEXHU0RTNBXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjA4XHU1NDBDXHU0RTAwXHU2NUY2XHU1MjNCXHU1M0VBXHU1MTQxXHU4QkI4XHU0RTAwXHU0RTJBXHU4QkY3XHU2QzQyXHU1NzI4XHU5MDE0XHVGRjA5XHUzMDAyXG4gKiBcdTZDRThcdUZGMUFcdTZBMjFcdTU3NTdcdTdFQTdcdTYxMEZcdTU0NzNcdTc3NDBcdTU5MUFcdTRGMUFcdThCRERcdTU0MENcdTY1RjZcdTRGMThcdTUzMTZcdTRGMUFcdTRFOTJcdTc2RjhcdThCQTlcdThERUZcdTIwMTRcdTIwMTRcdThGOTNcdTUxNjVcdTY4MEZcdTUzNTVcdTRGMUFcdThCRERcdTgwNUFcdTcxMjZcdTc2ODRcdTRFQTRcdTRFOTJcdTRFMEJcdTUzRUZcdTYzQTVcdTUzRDdcdTZCNjRcdTdCODBcdTUzMTZcdTMwMDJcbiAqL1xubGV0IGFjdGl2ZUNvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUyMTkyIFx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxXHVGRjA4ZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUyMTkyIGd1aWRlXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbiAgLyoqIFx1ODlFM1x1Njc5MFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTRGMThcdTUxNDhcdUZGMDlcdUZGMENcdTRFMERcdTUzRUZcdTVGOTdcdTY1RjZcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOSAqL1xuICBnZXRTZXNzaW9uTW9kZWw/KCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDh1c2VTZXNzaW9uTW9kZWwgXHU1RjAwXHU1NDJGXHU2NUY2XHU3NTI4XHVGRjA5XHVGRjFBXHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREICsgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFICovXG4gIGhvc3Q/OiB7XG4gICAgYXBpOiBIb3N0U2Vzc2lvbkFwaTtcbiAgICBwYXJlbnRTZXNzaW9uSWQ6IHN0cmluZztcbiAgICBzZXNzaW9uSWQ6IHN0cmluZztcbiAgfTtcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBjb25zdCBkcmFmdCA9IGN0eC5nZXREcmFmdCgpLnRyaW0oKTtcbiAgaWYgKCFkcmFmdCkgcmV0dXJuO1xuXG4gIC8vIFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYxQVx1NURGMlx1NjcwOVx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1NTIxOVx1NEUyMlx1NUYwM1x1NjcyQ1x1NkIyMVx1ODlFNlx1NTNEMVx1RkYwOFx1NjMwOVx1OTRBRSBidXN5IFx1NjAwMVx1NURGMlx1Nzk4MVx1NzUyOFx1NzBCOVx1NTFGQlx1RkYwQ1x1OEZEOVx1OTFDQ1x1NjYyRlx1N0FERVx1NjAwMVx1NzY4NFx1NjcwMFx1NTQwRVx1OTYzMlx1N0VCRlx1RkYwOVxuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkgcmV0dXJuO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnYmVnaW4nIH0pO1xuXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGFjdGl2ZUNvbnRyb2xsZXIgPSBjb250cm9sbGVyOyAvLyBcdTZDRThcdTUxOENcdTdFRDkgY2xvc2VQcmV2aWV3KClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERFx1OTAxQVx1OTA1MyBcdTIwMTRcdTIwMTQgXHU5NkY2XHU5MTREXHU3RjZFXHVGRjBDXHU2NUUwXHU5NzAwIGNoZWNrQ29uZmlnXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGF3YWl0IHJ1bkhvc3RPcHRpbWl6ZSh7XG4gICAgICAgIGFwaTogY3R4Lmhvc3QuYXBpLFxuICAgICAgICBwYXJlbnRTZXNzaW9uSWQ6IGN0eC5ob3N0LnBhcmVudFNlc3Npb25JZCxcbiAgICAgICAgc2Vzc2lvbklkOiBjdHguaG9zdC5zZXNzaW9uSWQsXG4gICAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkRlbHRhOiAodGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2RyYWZ0JywgdGV4dCB9KSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSksXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA4XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCL1x1NUJCRlx1NEUzQlx1NEUwRFx1NTNFRlx1NzUyOFx1OTY0RFx1N0VBN1x1RkYwOVx1NjI0RFx1ODk4MVx1NkM0Mlx1OTE0RFx1N0Y2RVxuICAgIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2d1aWRlJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMUFcdTZENEZcdTg5QzhcdTU2NjggZmV0Y2ggXHU3NkY0XHU4RkRFXHU4MUVBXHU5MTREIEFQSVx1RkYwOFx1NkQ0MVx1NUYwRlx1RkYwOVxuICAgIC8vIFx1NkEyMVx1NTc4Qlx1ODlFM1x1Njc5MFx1RkYxQXVzZVNlc3Npb25Nb2RlbFx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1MjE5MiBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTRFQzVcdTRGNUMgbW9kZWwgXHU1NDBEXHU1NkRFXHU5MDAwXHU0RjdGXHU3NTI4XHVGRjA5XHVGRjFCXHU1NDI2XHU1MjE5IFx1MjE5MiBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcbiAgICBsZXQgbW9kZWwgPSBjb25maWcubW9kZWw7XG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25Nb2RlbCA9IGF3YWl0IGN0eC5nZXRTZXNzaW9uTW9kZWw/LigpO1xuICAgICAgaWYgKHNlc3Npb25Nb2RlbCkgbW9kZWwgPSBzZXNzaW9uTW9kZWw7XG4gICAgfVxuICAgIGNvbnN0IGVmZmVjdGl2ZSA9IHsgLi4uY29uZmlnLCBtb2RlbCB9O1xuXG4gICAgLy8gXHU1QzU1XHU3OTNBXHU3RDJGXHU3OUVGXHVGRjFBXHU2QjYzXHU2NTg3XHU0RjE4XHU1MTQ4XHVGRjFCXHU2QjYzXHU2NTg3XHU1QzFBXHU2NzJBXHU1MUZBXHU3M0IwXHVGRjA4djQgXHU3Q0ZCXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1XHU2M0E4XHU3NDA2XHVGRjA5XHU2NUY2XHU1QzU1XHU3OTNBXHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjBDXHU4QkE5XHU2RDQxXHU1RjBGXHU3QUNCXHU1MzczXHU1M0VGXHU4OUMxXG4gICAgbGV0IHJlYXNvbmluZyA9ICcnO1xuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgbGV0IHNob3duID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplU3RyZWFtKHtcbiAgICAgICAgY29uZmlnOiBlZmZlY3RpdmUsXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBsYW5nOiBjdHguZ2V0TGFuZygpLFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkV2ZW50OiAoZGVsdGEpID0+IHtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgICBjb250ZW50ICs9IGRlbHRhLnRleHQ7XG4gICAgICAgICAgICBzaG93biA9IGNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYXNvbmluZyArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSByZWFzb25pbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQ6IHNob3duIH0pO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdCB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBcdTUxNDhcdTUyMjRcdTVCOUFcdTRFMkRcdTZCNjJcdUZGMUFcdTc1MjhcdTYyMzcvXHU3RUM0XHU0RUY2XHU1M0Q2XHU2RDg4XHU0RTBFXHU4RDg1XHU2NUY2XHU5MEZEXHU4ODY4XHU3M0IwXHU0RTNBIEFib3J0RXJyb3JcdUZGMUJcdTRFQzVcdThEODVcdTY1RjZcdTUxOTlcdTUxNjVcdTk1MTlcdThCRUZcdTYwMDFcbiAgICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgKHR5cGVvZiAoZSBhcyB7IG5hbWU/OiB1bmtub3duIH0gfCBudWxsKT8ubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgaWYgKHRpbWVkT3V0KSBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6ICd0aW1lb3V0JyBhcyBPcHRpbWl6ZUVycm9yS2luZCB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1OTg3Nlx1NUM0Mlx1NTE1Q1x1NUU5NVx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1MyByZWplY3QgXHU1REYyXHU4OEFCIC50aGVuIFx1NkQ4OFx1NTMxNlx1RkYxQlx1NkI2NFx1NTkwNFx1NEZERFx1NjJBNCBmZXRjaCBcdTUyMDZcdTY1MkZcdTRFRTVcdTU5MTZcdTc2ODRcdTYxMEZcdTU5MTZcdTVGMDJcdTVFMzhcdUZGMDlcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG4gIGdldEhvc3Q/OiAoKSA9PiB7IGFwaTogdW5rbm93bjsgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7IHNlc3Npb25JZDogc3RyaW5nIH0gfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvY2FyZC5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tY2FyZCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogMTJweDtcbiAgcmlnaHQ6IDEycHg7XG4gIGJvdHRvbTogY2FsYygxMDAlICsgOHB4KTtcbiAgei1pbmRleDogNDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1vdmVybGF5LCAjZmZmKTtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgcmdiYSgxMjgsMTI4LDEyOCwwLjMpKTtcbiAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgYm94LXNoYWRvdzogMCA4cHggMjRweCByZ2JhKDAsIDAsIDAsIDAuMTYpO1xuICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gIG1heC1oZWlnaHQ6IDMyMHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5kc2gtcG8tY2FyZC1oZWFkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICMyMjIpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG4uZHNoLXBvLWNhcmQtYm9keSB7XG4gIG92ZXJmbG93OiBhdXRvO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5LCAjNDQ0KTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMS42O1xuICBtYXgtaGVpZ2h0OiAyMDBweDtcbn1cbi5kc2gtcG8tY2FyZC1lcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEzcHg7XG59XG4uZHNoLXBvLWNhcmQtcm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGZsZXgtd3JhcDogd3JhcDtcbn1cbi5kc2gtcG8tY2FyZC1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgcGFkZGluZzogNHB4IDEwcHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICMyMjIpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xNCkpO1xufVxuLmRzaC1wby1jYXJkLWJ0bi5wcmltYXJ5IHtcbiAgLyogXHU1MTk5XHU2QjdCXHU0RTNCXHU4MjcyXHVGRjFBLS1kc3ctYWxpYXMtYnJhbmQtcHJpbWFyeSBcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDVcdTgyNzIgXHUyMTkyIFx1NzY3RFx1NUU5NVx1NzY3RFx1NUI1N1x1NEUwRFx1NTNFRlx1OEJGQlx1RkYwOFx1NzUyOFx1NjIzN1x1NUI5RVx1NkQ0Qlx1RkYwOSAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKiogXHU2MjdFIGNvbXBvc2VyIFx1OEY5M1x1NTE2NVx1Njg0Nlx1RkYxQVx1NEYxOFx1NTE0OFx1NzEyNlx1NzBCOVx1RkYwQ1x1NTQyNlx1NTIxOVx1N0IyQ1x1NEUwMFx1NEUyQVx1OTc1RSBkaXNhYmxlZCB0ZXh0YXJlYSAqL1xuZnVuY3Rpb24gZmluZENvbXBvc2VyKCk6IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQgJiYgIWFjdGl2ZS5kaXNhYmxlZCkgcmV0dXJuIGFjdGl2ZTtcbiAgY29uc3QgYWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWEnKTtcbiAgZm9yIChjb25zdCB0YSBvZiBhbGwpIHtcbiAgICBpZiAoIXRhLmRpc2FibGVkKSByZXR1cm4gdGE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb21wb3NlclRleHQoKTogc3RyaW5nIHtcbiAgY29uc3QgdGEgPSBmaW5kQ29tcG9zZXIoKTtcbiAgcmV0dXJuIHRhID8gdGEudmFsdWUgOiAnJztcbn1cblxuLyoqIFx1NzUyOFx1NTM5Rlx1NzUxRiB2YWx1ZSBzZXR0ZXIgXHU1MTk5XHU1NkRFXHVGRjBDXHU4QkE5IFJlYWN0IFx1NTNEN1x1NjNBN1x1N0VDNFx1NEVGNlx1NjExRlx1NzdFNVx1RkYwOFx1NTE4RFx1NkQzRVx1NTNEMSBpbnB1dCBcdTRFOEJcdTRFRjZcdTg5RTZcdTUzRDEgb25DaGFuZ2VcdUZGMDkgKi9cbmZ1bmN0aW9uIHdyaXRlQ29tcG9zZXJUZXh0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICBpZiAoIXRhKSByZXR1cm47XG4gIGNvbnN0IHNldHRlciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoSFRNTFRleHRBcmVhRWxlbWVudC5wcm90b3R5cGUsICd2YWx1ZScpPy5zZXQ7XG4gIGlmIChzZXR0ZXIpIHtcbiAgICBzZXR0ZXIuY2FsbCh0YSwgdGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdGEudmFsdWUgPSB0ZXh0O1xuICB9XG4gIHRhLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gIHRhLmZvY3VzKCk7XG59XG5cbmZ1bmN0aW9uIGVycm9yS2V5KGtpbmQ6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAvLyBraW5kIFx1MjE5MiBsb2NhbGUga2V5XHVGRjFCJ2NvbmZpZycgXHU1NzI4IFVJIFx1NEUwQVx1NEUwRFx1NTNFRlx1OEZCRVx1RkYwOHJ1bk9wdGltaXplIFx1NTE0OFx1OEQ3MCBndWlkZVx1RkYwOVx1RkYwQ0Fib3J0RXJyb3JcdTIxOTJ0aW1lb3V0IFx1NzUzMSBydW5PcHRpbWl6ZSBcdTUxNDhcdTg4NENcdTYyRTZcdTYyMkFcdUZGMENcdTRGRERcdTc1NTlcdTUzQ0NcdTRGRERcdTk2NjlcbiAgICBjYXNlICd1bmF1dGhvcml6ZWQnOiBjYXNlICdmb3JiaWRkZW4nOiBjYXNlICd0aW1lb3V0JzogY2FzZSAnbmV0d29yayc6IGNhc2UgJ2NvcnMnOiBjYXNlICdodHRwJzogY2FzZSAnYmFkLXJlc3BvbnNlJzogY2FzZSAnZW1wdHknOiBjYXNlICdjb25maWcnOlxuICAgICAgcmV0dXJuIGBlcnJvci4ke2tpbmR9YDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdlcnJvci5uZXR3b3JrJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUHJldmlld0NhcmQocHJvcHM6IFByZXZpZXdDYXJkUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBnZXRDb25maWcsIGdldExhbmcsIG9wZW5TZXR0aW5ncywgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0IH0gPSBwcm9wcztcblxuICAvLyBcdThCQTJcdTk2MDVcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhcdTY2RkZcdTRFRTNcdTRGMUFcdThCREQgc3RvcmUgcHJvcHNcdUZGMDlcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKSk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldFN0YXRlKGdldFByZXZpZXdCdXNTdGF0ZSgpKSksXG4gICAgW10sXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgLy8gXHU1Mzc4XHU4RjdEXHU2NUY2XHU2RTA1XHU3NDA2XHVGRjFBXHU2RTA1XHU5NjY0XHU2MzAyXHU4RDc3XHU3Njg0IGNvcGllZCBcdTU5MERcdTRGNERcdTVCOUFcdTY1RjZcdTU2NjhcdUZGMENcdTVFNzZcdTY4MDdcdThCQjBcdTY3MkFcdTYzMDJcdThGN0RcdUZGMENcbiAgLy8gXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNldENvcGllZCh0cnVlKVx1RkYwOGNvcHkgXHU3Njg0IGF3YWl0IFx1NjcxRlx1OTVGNFx1NTM3OFx1OEY3RFx1RkYwOVx1NTcyOFx1NTM3OFx1OEY3RFx1NTQwRVx1ODlFNlx1NTNEMVx1MzAwMlxuICBjb25zdCBtb3VudGVkUmVmID0gdXNlUmVmKHRydWUpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgY29uc3QgeyBzdGF0dXMsIHJlc3VsdCwgZXJyb3JLaW5kIH0gPSBzdGF0ZTtcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29weVRpbWVyUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuXG4gIGlmIChzdGF0dXMgPT09ICdpZGxlJykgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7IGdldENvbmZpZywgZ2V0TGFuZywgZ2V0RHJhZnQ6ICgpID0+IHJlYWRDb21wb3NlclRleHQoKSwgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0IH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgd3JpdGVDb21wb3NlclRleHQocmVzdWx0KTtcbiAgICBjbG9zZVByZXZpZXcoKTtcbiAgfTtcblxuICBjb25zdCBjb3B5ID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuOyAvLyBcdTk3NUVcdTVCODlcdTUxNjhcdTRFMEFcdTRFMEJcdTY1ODdcdUZGMDhodHRwIFx1N0I0OVx1RkYwOVx1RkYxQVx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMENcdTRGRERcdTYzMDFcdTUzRUZcdTkxQ0RcdThCRDVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0KTtcbiAgICAgIGlmICghbW91bnRlZFJlZi5jdXJyZW50KSByZXR1cm47IC8vIGF3YWl0IFx1NjcxRlx1OTVGNFx1N0VDNFx1NEVGNlx1NURGMlx1NTM3OFx1OEY3RFx1RkYxQVx1NEUwRFx1NTE4RCBzZXRTdGF0ZVxuICAgICAgc2V0Q29waWVkKHRydWUpO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHNldENvcGllZChmYWxzZSk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH0sIDEyMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjZBXHU4RDM0XHU2NzdGXHU1MTk5XHU1MTY1XHU1OTMxXHU4RDI1XHVGRjFBXHU5NzU5XHU5RUQ4XHVGRjA4XHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwOVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmRcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWhlYWRcIj5cbiAgICAgICAgPHNwYW4+e3QoJ2NhcmQudGl0bGUnKX08L3NwYW4+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGNsb3NlUHJldmlldygpOyBvcGVuU2V0dGluZ3MoKTsgfX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5hY3Rpb24nKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ29wdGltaXppbmcnICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+XG4gICAgICAgICAge3N0YXRlLmRyYWZ0ID8gPHNwYW4gc3R5bGU9e3sgd2hpdGVTcGFjZTogJ3ByZS13cmFwJyB9fT57c3RhdGUuZHJhZnR9PC9zcGFuPiA6IHQoJ2NhcmQub3B0aW1pemluZycpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdwcmV2aWV3JyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3Jlc3VsdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXBsYWNlfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmVwbGFjZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiB2b2lkIGNvcHkoKX0+XG4gICAgICAgICAgICAgIHtjb3BpZWQgPyB0KCdjYXJkLmNvcHlEb25lJykgOiB0KCdjYXJkLmNvcHknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyXCI+e3QoZXJyb3JLZXkoZXJyb3JLaW5kKSl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59IiwgIi8qKiBcdThCQkVcdTdGNkUgXHUyMTkyIEdlbmVyYWwgXHU1MzNBXHUzMDBDUHJvbXB0IFx1NEYxOFx1NTMxNlx1MzAwRFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYxQVx1NjgwN1x1OTg5OFx1NjQ1OFx1ODk4MSArIFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NSAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybVN0YXRlLCBTZXR0aW5nc0Zvcm1WYWx1ZXMgfSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1BY3Rpb25zIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgeyBvbk9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NSb3dQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICB1c2VTdG9yZTogPFQ+KHNlbGVjdG9yOiAoczogU2V0dGluZ3NGb3JtU3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IFNldHRpbmdzRm9ybUFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBzYXZlQ29uZmlnOiAodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IFByb21pc2U8dm9pZD47XG4gIHJlc2V0Q29uZmlnOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBnZXRFcG9jaDogKCkgPT4gbnVtYmVyO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvc2V0dGluZ3MuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4ub3B0aVNldHRpbmdzIHtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBwYWRkaW5nOiAxNnB4IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLm9wdGlTZXR0aW5nc1RpdGxlIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMjJweDtcbn1cbi5vcHRpU2V0dGluZ3NIaW50IHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NGb3JtIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG4gIG1hcmdpbi10b3A6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NGaWVsZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0xhYmVsIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzSW5wdXQge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctbGF5ZXItMik7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIHBhZGRpbmc6IDZweCA4cHg7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5vcHRpU2V0dGluZ3NSb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ge1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgcGFkZGluZzogNHB4IDEycHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xNCkpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xufVxuLm9wdGlTZXR0aW5nc0J0bi5wcmltYXJ5IHtcbiAgLyogXHU1MTk5XHU2QjdCXHU0RTNCXHU4MjcyXHVGRjFBXHU0RTNCXHU5ODk4XHU1M0Q4XHU5MUNGXHU1NzI4XHU2REYxXHU1OTFDXHU2QTIxXHU1RjBGXHU0RjFBXHU4OUUzXHU2NzkwXHU0RTNBXHU2RDQ1L1x1NkRGMVx1Njc4MVx1N0FFRlx1ODI3Mlx1RkYwOFx1OUVEMVx1NUU5NVx1OUVEMVx1NUI1N1x1MzAwMVx1NzY3RFx1NUU5NVx1NzY3RFx1NUI1N1x1NTc0N1x1ODhBQlx1NzUyOFx1NjIzN1x1NUI5RVx1NkQ0Qlx1RkYwOVx1RkYwQ1xuICAgICBcdTU2RkFcdTVCOUFcdTU0QzFcdTcyNENcdTg0REQgKyBcdTc2N0RcdTVCNTdcdTRGRERcdThCQzFcdTRFRkJcdTRGNTVcdTRFM0JcdTk4OThcdTUzRUZcdThCRkIgKi9cbiAgY29sb3I6ICNmZmY7XG4gIGJhY2tncm91bmQ6ICMxNjc3ZmY7XG59XG4ub3B0aVNldHRpbmdzRXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZXR0aW5nc1Jvdyhwcm9wczogU2V0dGluZ3NSb3dQcm9wcykge1xuICBjb25zdCB7IHQsIHVzZVN0b3JlLCBhY3Rpb25zLCBnZXRDb25maWcsIHNhdmVDb25maWcsIHJlc2V0Q29uZmlnLCBnZXRFcG9jaCB9ID0gcHJvcHM7XG4gIGNvbnN0IFtleHBhbmRlZCwgc2V0RXhwYW5kZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc3VibWl0UmV2aXNpb24sIHNldFN1Ym1pdFJldmlzaW9uXSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IHZhbHVlcyA9IHVzZVN0b3JlKChzKSA9PiBzLnZhbHVlcyk7XG4gIGNvbnN0IHNhdmVkID0gdXNlU3RvcmUoKHMpID0+IHMuc2F2ZWQpO1xuICBjb25zdCBlcnJvciA9IHVzZVN0b3JlKChzKSA9PiBzLmVycm9yKTtcbiAgLy8gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RSBSUEMgXHU1OTMxXHU4RDI1XHU2NUY2XHU2NjNFXHU3OTNBXHU3Njg0XHU1MzlGXHU1OUNCXHU5NTE5XHU4QkVGXHVGRjA4XHU0RTBEXHU1MThEXHU5NzU5XHU5RUQ4XHU1OTMxXHU4RDI1XHVGRjFBc2V0dGluZ3MgXHU1MTk5XHU1MTY1XHU1MUZBXHU5NTE5XHU1RkM1XHU5ODdCXHU4QkE5XHU3NTI4XHU2MjM3XHU3NzBCXHU1Rjk3XHU1MjMwXHVGRjA5XG4gIGNvbnN0IFtycGNFcnJvciwgc2V0UnBjRXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgY29uZmlnID0gZ2V0Q29uZmlnKCk7XG4gIGNvbnN0IG1vZGVsTGFiZWwgPSBjb25maWcubW9kZWwgPyBjb25maWcubW9kZWwgOiAnXHUyMDE0JztcblxuICAvLyBcdTk5OTZcdTZCMjFcdTYzMDJcdThGN0QgLyBcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTY1RjZcdTYyOEFcdTVGNTNcdTUyNERcdTkxNERcdTdGNkVcdTY0QURcdTc5Q0RcdThGREJcdTg4NjhcdTUzNTVcdTMwMDJcbiAgLy8gc2VlZCBcdTRGRUVcdThCQTJcdTUzRjcgPSBcdTY3MkNcdTU3MzBcdTYzRDBcdTRFQTRcdTVFOEZcdTUzRjcgc3VibWl0UmV2aXNpb24gKyBjb25maWdFcG9jaFx1RkYwOFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1N0VBQVx1NTE0M1x1RkYwOVx1RkYxQVxuICAvLyAgLSBcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdUZGMDhcdThERThcdTY4MDdcdTdCN0VcdTk4NzUvXHU1OTE2XHU5MEU4XHU1MTk5XHU1MTY1IFx1MjE5MiBpbmRleC50cyByZWZyZXNoQ29uZmlnIFx1NzY4NFx1N0VBQVx1NTE0M1x1OTAxMlx1NTg5RVx1RkYwOVx1NEVFNFx1NEZFRVx1OEJBMlx1NTNGN1x1OEQ4NVx1OEZDN1xuICAvLyAgICBzdGF0ZS5yZXZpc2lvblx1RkYwQ1x1OTFDRFx1NjRBRFx1NzlDRFx1NzUxRlx1NjU0OFx1RkYwQ1x1ODg2OFx1NTM1NVx1OERERlx1NEUwQVx1NUY1Mlx1NEUwMFx1NTMxNlx1NTQwRVx1NzY4NFx1OTU1Q1x1NTBDRlx1RkYxQlxuICAvLyAgLSBcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFXHU1REYyXHU5MDFBXHU4RkM3IGNvbW1pdC9zZWVkIFx1NTE5OVx1NTE2NVx1MzAwQ1x1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1NUY1M1x1NjVGNlx1N0VBQVx1NTE0M1x1MzAwRFx1NzY4NFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwQ1x1N0QyN1x1NjNBNVx1NzY4NFx1NjcyQ1x1NkIyMVx1NjU0OFx1NUU5NFxuICAvLyAgICBcdTU2REVcdThERDFcdUZGMDhcdTdFQUFcdTUxNDNcdTY3MkFcdTUzRDhcdUZGMDlcdTRGRUVcdThCQTJcdTUzRjdcdTc2RjhcdTdCNDlcdTg4QUIgcmVkdWNlciBcdTYyOTFcdTUyMzYgXHUyMTkyIFx1NEZERFx1NEY0Rlx1NzUyOFx1NjIzN1x1NTM5Rlx1NTlDQlx1OEY5M1x1NTE2NVx1NEUwRVx1MzAwQ1x1NURGMlx1NEZERFx1NUI1OFx1MzAwRFx1NjNEMFx1NzkzQVx1RkYxQlxuICAvLyAgICBcdTRFMEJcdTZCMjFcdTY3MkNcdTU3MzBcdTUyQThcdTRGNUNcdUZGMDhlZGl0L2NvbW1pdFx1RkYwOVx1NTE4RFx1NjI4QSBzdGF0ZS5yZXZpc2lvbiBcdTYyQUNcdTUyMzBcdTRFMEVcdTdFQUFcdTUxNDNcdTRFMDBcdTgxRjRcdTMwMDJcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhY3Rpb25zLnNlZWQoXG4gICAgICB7IGJhc2VVcmw6IGNvbmZpZy5iYXNlVXJsLCBhcGlLZXk6IGNvbmZpZy5hcGlLZXksIG1vZGVsOiBjb25maWcubW9kZWwgfSxcbiAgICAgIHN1Ym1pdFJldmlzaW9uICsgZ2V0RXBvY2goKSxcbiAgICApO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgfSwgW2NvbmZpZy5iYXNlVXJsLCBjb25maWcuYXBpS2V5LCBjb25maWcubW9kZWwsIGdldEVwb2NoXSk7XG5cbiAgLy8gXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHVGRjA4XHU5ODg0XHU4OUM4XHU1MzYxXHU2NzJBXHU5MTREXHU3RjZFXHU1RjE1XHU1QkZDXHVGRjA5XHUyMTkyIFx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KCgpID0+IHNldEV4cGFuZGVkKHRydWUpKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgY29uc3QgZXJyb3JzID0gYWN0aW9ucy52YWxpZGF0ZSh2YWx1ZXMpO1xuICAgIGlmIChlcnJvcnMpIHtcbiAgICAgIGFjdGlvbnMuZmFpbChPYmplY3QudmFsdWVzKGVycm9ycylbMF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2F2ZUNvbmZpZyh2YWx1ZXMpO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICAgIC8vIFx1NEUwRVx1NjU0OFx1NUU5NFx1NTZERVx1OEREMVx1NzY4NCBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwOFx1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1N0VBQVx1NTE0M1x1RkYwOVx1NUJGOVx1OUY1MFx1RkYwQ1x1NEY3Rlx1NEZERFx1NUI1OFx1NTQwRVx1NzY4NFx1OTFDRFx1NjRBRFx1NzlDRFx1ODhBQlx1NjI5MVx1NTIzNlxuICAgICAgYWN0aW9ucy5jb21taXQoc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnNhdmVGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUmVzZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJlc2V0Q29uZmlnKCk7XG4gICAgICBhY3Rpb25zLnNlZWQoXG4gICAgICAgIHsgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCwgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksIG1vZGVsOiBERUZBVUxUUy5tb2RlbCB9LFxuICAgICAgICBzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpLFxuICAgICAgKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnJlc2V0RmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzVGl0bGVcIiBvbkNsaWNrPXsoKSA9PiBzZXRFeHBhbmRlZCgodikgPT4gIXYpfSBzdHlsZT17eyBjdXJzb3I6ICdwb2ludGVyJyB9fT5cbiAgICAgICAge3QoJ3NldHRpbmdzLnRpdGxlJyl9XG4gICAgICAgIHshZXhwYW5kZWQgJiZcbiAgICAgICAgICAodmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KCdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJyl9PC9zcGFuPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCh2YWx1ZXMuYXBpS2V5ID8gJ2NhcmQuY29uZmlndXJlZC5oaW50JyA6ICdjYXJkLnVuY29uZmlndXJlZC5oaW50JykucmVwbGFjZSgne21vZGVsfScsIG1vZGVsTGFiZWwpfTwvc3Bhbj5cbiAgICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7ZXhwYW5kZWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0Zvcm1cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICBjaGVja2VkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCd1c2VTZXNzaW9uTW9kZWwnLCBlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgLz57JyAnfVxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJyl9XG4gICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50Jyl9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdiYXNlVXJsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1hcGkta2V5XCI+e3QoJ3NldHRpbmdzLmFwaUtleScpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWFwaS1rZXlcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYXBpS2V5fVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cInNrLVx1MjAyNlwiXG4gICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYXBpS2V5JywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1tb2RlbFwiPnt0KCdzZXR0aW5ncy5tb2RlbCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLW1vZGVsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLm1vZGVsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/ICdcdTIwMTQnIDogREVGQVVMVFMubW9kZWx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYxQVx1NEYxOFx1NTMxNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVybCA9IHZhbHVlcy5iYXNlVXJsLnRyaW0oKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdmFsdWVzLmFwaUtleS50cmltKCkpIGVycm9ycy5hcGlLZXkgPSAnc2V0dGluZ3MuYXBpS2V5JztcbiAgaWYgKCF2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsICYmICF2YWx1ZXMubW9kZWwudHJpbSgpKSBlcnJvcnMubW9kZWwgPSAnc2V0dGluZ3MubW9kZWwnO1xuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RhdGUge1xuICB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcztcbiAgZGlydHk6IGJvb2xlYW47XG4gIHNhdmVkOiBib29sZWFuO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aXNpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IElOSVRJQUxfU0VUVElOR1NfRk9STTogU2V0dGluZ3NGb3JtU3RhdGUgPSB7XG4gIHZhbHVlczogeyBiYXNlVXJsOiAnJywgYXBpS2V5OiAnJywgbW9kZWw6ICcnLCB1c2VTZXNzaW9uTW9kZWw6IHRydWUgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIH1cbiAgfCB7IHR5cGU6ICdjb21taXQnOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsgbWVzc2FnZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VTZXR0aW5nc0Zvcm0oc3RhdGU6IFNldHRpbmdzRm9ybVN0YXRlLCBhY3Rpb246IFNldHRpbmdzRm9ybUFjdGlvbik6IFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ3NlZWQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5yZXZpc2lvbiA8PSBzdGF0ZS5yZXZpc2lvblxuICAgICAgICA/IHN0YXRlXG4gICAgICAgIDogeyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLmFjdGlvbi52YWx1ZXMgfSwgZGlydHk6IGZhbHNlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZWRpdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLnN0YXRlLnZhbHVlcywgW2FjdGlvbi5maWVsZF06IGFjdGlvbi52YWx1ZSB9LCBkaXJ0eTogdHJ1ZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xuICAgIGNhc2UgJ2NvbW1pdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBlcnJvcjogYWN0aW9uLm1lc3NhZ2UgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1VPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxpQkFBaUI7QUFDbkI7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFPLEtBQUssV0FBVyxXQUFXLElBQUksU0FBUyxTQUFTO0FBR3ZFLFFBQU0sV0FBVyxPQUFPLEtBQUssVUFBVSxZQUFZLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUssSUFBSSxTQUFTO0FBQ2xHLFFBQU0sa0JBQ0osYUFBYSxtQkFBbUIsaUJBQWlCLE9BQU8sTUFBTSxTQUFTLFVBQVUsU0FBUyxRQUFRO0FBQ3BHLFFBQU0sUUFBUTtBQUNkLFFBQU0sa0JBQWtCLE9BQU8sS0FBSyxvQkFBb0IsWUFBWSxJQUFJLGtCQUFrQixTQUFTO0FBQ25HLFNBQU8sRUFBRSxTQUFTLGlCQUFpQixPQUFPLEdBQUcsUUFBUSxPQUFPLGdCQUFnQjtBQUM5RTtBQUtPLFNBQVMsWUFBWSxRQUFtQztBQUM3RCxNQUFJLENBQUMsT0FBTyxPQUFPLEtBQUssRUFBRyxRQUFP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QSxJQUN4RTtBQUFBLEVBQ0Y7QUFFQSxNQUFJLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVO0FBQy9CLFVBQU0sTUFBTTtBQUFBLE1BQU87QUFBQSxNQUF5QixNQUMxQyxNQUFNLE1BQU07QUFBQSxRQUNWO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixJQUFJO0FBQUEsVUFDSixPQUFPO0FBQUEsVUFDUCxRQUFRO0FBQUEsVUFDUixPQUFPO0FBQUEsVUFDUCxRQUFRLE9BQU87QUFBQSxZQUNiLFdBQVcsTUFBTTtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
