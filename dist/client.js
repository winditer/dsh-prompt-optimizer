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
  if (!Array.isArray(events)) return "";
  const sorted = events.map((entry) => entry && typeof entry === "object" ? entry.event : void 0).filter((e) => !!e && typeof e === "object");
  sorted.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const texts = [];
  for (const ev of sorted) {
    const type = typeof ev.type === "string" ? ev.type : "";
    if (type.includes("user") && !type.includes("assistant")) continue;
    if (!/(message|assistant|text|answer|reply|completion)/i.test(type)) continue;
    collectTexts(ev.data, texts, true);
  }
  return texts.join("");
}
function prefixDelta(prev, next) {
  const n = Math.min(prev.length, next.length);
  let i = 0;
  while (i < n && prev.charCodeAt(i) === next.charCodeAt(i)) i += 1;
  return next.slice(i);
}
var DEFAULT_INTERVAL_MS = 400;
var DEFAULT_TIMEOUT_MS = 12e4;
var DEFAULT_SETTLE_ROUNDS = 3;
async function runHostOptimize(opts) {
  const { api, parentSessionId, sessionId, lang, text, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const settleRounds = opts.settleRounds ?? DEFAULT_SETTLE_ROUNDS;
  if (signal.aborted) throw new Error("aborted");
  try {
    await api.create?.({ sessionId });
  } catch {
  }
  try {
    const parent = await api.models?.({ sessionId: parentSessionId });
    if (parent?.current?.model) {
      await api.selectModel?.({
        sessionId,
        provider: parent.current.provider ?? "deepseek-official",
        model: parent.current.model
      });
    }
  } catch {
  }
  const system = buildSystemPrompt(lang);
  const content = `${system}

${text}`;
  const accepted = await api.prompt?.({ sessionId, mode: "queue", content: [{ type: "text", text: content }] });
  if (accepted === void 0) throw new Error("host-prompt-unavailable");
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
    let current = "";
    try {
      const page = await api.history?.({ sessionId });
      current = foldSessionText(page?.events);
    } catch {
    }
    if (current !== lastText) {
      idleRounds = 0;
      const delta = prefixDelta(lastText, current);
      lastText = current;
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
  if (!checkConfig(config).ok) {
    dispatchPreview({ type: "guide" });
    return;
  }
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
      !expanded && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", children: [
        " \xB7 ",
        t("settings.sessionModelEnabled")
      ] })
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
  const PO_HOST_SESSION_ID = "po-optimizer";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnLCByZXNvbHZlU2Vzc2lvbk1vZGVsIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIGNvbnN0IGdldFNlc3Npb25Nb2RlbCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+ID0+IHtcbiAgICBjb25zdCBzZXNzaW9uSWQgPSBnZXRBY3RpdmVTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzaW9uSWQpIHJldHVybiBudWxsO1xuICAgIHJldHVybiByZXNvbHZlU2Vzc2lvbk1vZGVsKGN0eC5jb25uZWN0aW9uLmFwaSBhcyBuZXZlciwgeyBzZXNzaW9uSWQgfSk7XG4gIH07XG5cbiAgLy8gMi42IFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOFx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERCArIFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1RkYxQVxuICAvLyBcdTUzRUZcdTU5MERcdTc1MjhcdTc2ODRcdTU2RkFcdTVCOUFcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdTYyN0ZcdThGN0RcdTRGMThcdTUzMTZcdUZGMUJcdTZBMjFcdTU3OEJcdTdFRTdcdTYyN0ZcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdUZGMDhzZWxlY3RNb2RlbFx1RkYwOVx1RkYwQ1xuICAvLyBcdTdFRDNcdTY3OUNcdTdFQ0Ygc2Vzc2lvbi5oaXN0b3J5IFx1OEY2RVx1OEJFMlx1NTg5RVx1OTFDRlx1NTQ0OFx1NzNCMFx1RkYwOFx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1RkYwOVxuICBjb25zdCBQT19IT1NUX1NFU1NJT05fSUQgPSAncG8tb3B0aW1pemVyJztcbiAgY29uc3QgaG9zdEFwaSA9IChjdHguY29ubmVjdGlvbi5hcGkgYXMgbmV2ZXIpIGFzIHtcbiAgICBjcmVhdGUocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx1bmtub3duPjtcbiAgICBzZWxlY3RNb2RlbChwOiB7IHNlc3Npb25JZDogc3RyaW5nOyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0pOiBQcm9taXNlPHVua25vd24+O1xuICAgIHByb21wdChwOiB7IHNlc3Npb25JZDogc3RyaW5nOyBtb2RlOiAncXVldWUnOyBjb250ZW50OiBBcnJheTx7IHR5cGU6ICd0ZXh0JzsgdGV4dDogc3RyaW5nIH0+IH0pOiBQcm9taXNlPHVua25vd24+O1xuICAgIGhpc3RvcnkocDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KTogUHJvbWlzZTx7IGV2ZW50cz86IHVua25vd24gfT47XG4gICAgY2FuY2VsKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSk6IFByb21pc2U8dW5rbm93bj47XG4gICAgbW9kZWxzKHA6IHsgc2Vzc2lvbklkOiBzdHJpbmcgfSk6IFByb21pc2U8eyBjdXJyZW50PzogeyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG4gIH07XG4gIGNvbnN0IGdldEhvc3QgPSAoKTogeyBhcGk6IHR5cGVvZiBob3N0QXBpOyBwYXJlbnRTZXNzaW9uSWQ6IHN0cmluZzsgc2Vzc2lvbklkOiBzdHJpbmcgfSB8IG51bGwgPT4ge1xuICAgIGNvbnN0IHBhcmVudFNlc3Npb25JZCA9IGdldEFjdGl2ZVNlc3Npb24oKTtcbiAgICBpZiAoIXBhcmVudFNlc3Npb25JZCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHsgYXBpOiBob3N0QXBpLCBwYXJlbnRTZXNzaW9uSWQsIHNlc3Npb25JZDogUE9fSE9TVF9TRVNTSU9OX0lEIH07XG4gIH07XG5cbiAgLy8gMy4gXHU4QkVEXHU4QTAwXHU5NTVDXHU1MENGXG4gIGxldCBsYW5nOiBMYW5nID0gbGFuZ09mKGN0eC5sb2NhbGUuZ2V0TG9jYWxlKCkuYWN0aXZlKTtcbiAgY3R4Lm9uKCdsb2NhbGUvY2hhbmdlJywgKHNuYXA6IHsgYWN0aXZlOiBzdHJpbmcgfSkgPT4ge1xuICAgIGxhbmcgPSBsYW5nT2Yoc25hcC5hY3RpdmUpO1xuICB9KTtcblxuICAvLyA0LiBcdTRGMUFcdThCRERcdTY5RkRcdTRGNERcdUZGMUFcdTYzMDlcdTk0QUUgKyBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcbiAgY3R4LmluamVjdChbJ3Nsb3RzJywgJ3Nlc3Npb25zJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWJ1dHRvbicsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgb3BlblNldHRpbmdzOiAoKSA9PiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUHJldmlld0NhcmQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDYuIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYwOHJvb3QgXHU0RjVDXHU3NTI4XHU1N0RGXHVGRjA5XG4gIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSgpO1xuICBjb25zdCBzYXZlQ29uZmlnID0gYXN5bmMgKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VDb25maWcoeyAuLi5jb25maWdNaXJyb3IsIC4uLnJhdyB9KTtcbiAgICBjb25zdCB3cml0dGVuOiBQcm9tcHRDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiBtZXJnZWQuYmFzZVVybCxcbiAgICAgIGFwaUtleTogbWVyZ2VkLmFwaUtleS50cmltKCksXG4gICAgICBtb2RlbDogbWVyZ2VkLm1vZGVsLFxuICAgICAgdXNlU2Vzc2lvbk1vZGVsOiBtZXJnZWQudXNlU2Vzc2lvbk1vZGVsLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7IHBhdGNoOiB7IGJhc2VVcmw6IHdyaXR0ZW4uYmFzZVVybCwgYXBpS2V5OiB3cml0dGVuLmFwaUtleSwgbW9kZWw6IHdyaXR0ZW4ubW9kZWwgfSB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVzZXRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCxcbiAgICAgICAgICBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogREVGQVVMVFMubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG5cbiAgY3R4LmluamVjdChbJ3Nsb3RzJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLXNldHRpbmdzJyxcbiAgICAgICAgICBvcmRlcjogMzAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBzdG9yZTogc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIHNhdmVDb25maWcsXG4gICAgICAgICAgICByZXNldENvbmZpZyxcbiAgICAgICAgICAgIGdldEVwb2NoOiAoKSA9PiBjb25maWdFcG9jaCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgU2V0dGluZ3NSb3csXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDcuIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYxQUFsdCtPXHVGRjA4XHU3MTI2XHU3MEI5XHU1NzI4IHRleHRhcmVhIFx1NTE4NVx1NjVGNlx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1RkYwOVxuICBjb25zdCBvbktleWRvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGlmICghZS5hbHRLZXkgfHwgZS5jb2RlICE9PSAnS2V5TycpIHJldHVybjtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlbWl0T3B0aW1pemVSZXF1ZXN0KCk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pO1xufVxuXG4vLyBcdTVGMTVcdTc1MjhcdTVCODhcdTUzNkJcdUZGMUFcdTkwN0ZcdTUxNEQgdHJlZS1zaGFrZSBcdTYzODlcdTdDN0JcdTU3OEJcdUZGMDhcdTRFQzVcdTY1ODdcdTY4NjNcdTYwMjdcdUZGMUJcdTY1RTBcdThGRDBcdTg4NENcdTY1RjZcdTg4NENcdTRFM0FcdUZGMDlcbmV4cG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9OyIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjgzOFx1NUZDM1x1RkYxQVx1OTE0RFx1N0Y2RVx1NjgyMVx1OUE4Q1x1MzAwMU9wZW5BSSBcdTUxN0NcdTVCQjlcdThDMDNcdTc1MjhcdTMwMDFcdTdFRDNcdTY3OUNcdTYzRDBcdTUzRDYgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1OTZGNiBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvbXB0Q29uZmlnIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdUZGMUFcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUUzogUHJvbXB0Q29uZmlnID0ge1xuICBiYXNlVXJsOiAnaHR0cHM6Ly9hcGkuZGVlcHNlZWsuY29tJyxcbiAgYXBpS2V5OiAnJyxcbiAgbW9kZWw6ICdkZWVwc2Vlay12NC1mbGFzaCcsXG4gIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbn07XG5cbmV4cG9ydCB0eXBlIExhbmcgPSAnemgnIHwgJ2VuJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJhc2VVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdXJsLnRyaW0oKS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQ29uZmlnKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IFByb21wdENvbmZpZyB7XG4gIGNvbnN0IGJhc2VVcmwgPSB0eXBlb2YgcmF3Py5iYXNlVXJsID09PSAnc3RyaW5nJyAmJiByYXcuYmFzZVVybC50cmltKCkgPyByYXcuYmFzZVVybC50cmltKCkgOiBERUZBVUxUUy5iYXNlVXJsO1xuICBjb25zdCBhcGlLZXkgPSB0eXBlb2YgcmF3Py5hcGlLZXkgPT09ICdzdHJpbmcnID8gcmF3LmFwaUtleSA6IERFRkFVTFRTLmFwaUtleTtcbiAgLy8gXHU2NUU3XHU5RUQ4XHU4QkE0XHU4RkMxXHU3OUZCXHVGRjFBXHU5RUQ4XHU4QkE0IGJhc2VVcmwgXHU0RTBCXHU2QjhCXHU3NTU5XHU3Njg0IGRlZXBzZWVrLWNoYXRcdUZGMDh2MSBcdTlFRDhcdThCQTRcdUZGMDlcdTg5QzZcdTRFM0FcdTY3MkFcdThCQkVcdTdGNkVcdUZGMENcdTg0M0RcdTUyMzBcdTY1QjBcdTlFRDhcdThCQTQgZGVlcHNlZWstdjQtZmxhc2hcdUZGMUJcbiAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU4RkM3IGJhc2VVcmxcdUZGMDhcdTY2M0VcdTVGMEZcdTkwMDlcdTYyRTlcdUZGMDlcdTUyMTlcdTRGRERcdTc1NTlcdTUzOUZcdTZBMjFcdTU3OEJcdTU0MERcbiAgY29uc3QgcmF3TW9kZWwgPSB0eXBlb2YgcmF3Py5tb2RlbCA9PT0gJ3N0cmluZycgJiYgcmF3Lm1vZGVsLnRyaW0oKSA/IHJhdy5tb2RlbC50cmltKCkgOiBERUZBVUxUUy5tb2RlbDtcbiAgY29uc3QgbWlncmF0ZWREZWZhdWx0ID1cbiAgICByYXdNb2RlbCA9PT0gJ2RlZXBzZWVrLWNoYXQnICYmIG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCkgPT09IERFRkFVTFRTLmJhc2VVcmwgPyBERUZBVUxUUy5tb2RlbCA6IHJhd01vZGVsO1xuICBjb25zdCBtb2RlbCA9IG1pZ3JhdGVkRGVmYXVsdDtcbiAgY29uc3QgdXNlU2Vzc2lvbk1vZGVsID0gdHlwZW9mIHJhdz8udXNlU2Vzc2lvbk1vZGVsID09PSAnYm9vbGVhbicgPyByYXcudXNlU2Vzc2lvbk1vZGVsIDogREVGQVVMVFMudXNlU2Vzc2lvbk1vZGVsO1xuICByZXR1cm4geyBiYXNlVXJsOiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpLCBhcGlLZXksIG1vZGVsLCB1c2VTZXNzaW9uTW9kZWwgfTtcbn1cblxuZXhwb3J0IHR5cGUgQ29uZmlnUHJvYmxlbSA9ICdtaXNzaW5nLWtleScgfCAnbWlzc2luZy1tb2RlbCcgfCAnYmFkLXVybCc7XG5leHBvcnQgdHlwZSBDb25maWdDaGVjayA9IHsgb2s6IHRydWU7IGNvbmZpZzogUHJvbXB0Q29uZmlnIH0gfCB7IG9rOiBmYWxzZTsgcmVhc29uOiBDb25maWdQcm9ibGVtIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZyhjb25maWc6IFByb21wdENvbmZpZyk6IENvbmZpZ0NoZWNrIHtcbiAgaWYgKCFjb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLWtleScgfTtcbiAgLy8gXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2NUY2XHU2NUUwXHU5NzAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjFCXHU0RUM1XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1RjBGXHU4OTgxXHU2QzQyIG1vZGVsIFx1OTc1RVx1N0E3QVxuICBpZiAoIWNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgIWNvbmZpZy5tb2RlbC50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1tb2RlbCcgfTtcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKSk7XG4gICAgaWYgKHUucHJvdG9jb2wgIT09ICdodHRwczonICYmIHUucHJvdG9jb2wgIT09ICdodHRwOicpIHRocm93IG5ldyBFcnJvcigncHJvdG9jb2wnKTtcbiAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdiYWQtdXJsJyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBjb25maWcgfTtcbn1cblxuY29uc3QgWkhfU1lTVEVNID1cbiAgJ1x1NEY2MFx1NjYyRlx1NEUwMFx1NTQwRCBwcm9tcHQgXHU0RjE4XHU1MzE2XHU0RTEzXHU1QkI2XHUzMDAyXHU3NTI4XHU2MjM3XHU0RjFBXHU3RUQ5XHU0RjYwXHU0RTAwXHU2QkI1XHU4MzQ5XHU3QTNGIHByb21wdFx1RkYwQ1x1OEJGN1x1NTcyOFx1NEUwRFx1NjUzOVx1NTNEOFx1NTE3Nlx1NjEwRlx1NTZGRVx1NzY4NFx1NTI0RFx1NjNEMFx1NEUwQlx1NUMwNlx1NTE3Nlx1NjUzOVx1NTE5OVx1NEUzQVx1NjZGNFx1NkUwNVx1NjY3MFx1MzAwMVx1NjZGNFx1N0VEM1x1Njc4NFx1NTMxNlx1NzY4NFx1OUFEOFx1OEQyOFx1OTFDRiBwcm9tcHRcdUZGMUEnICtcbiAgJ1x1ODg2NVx1NTE0NVx1N0YzQVx1NTkzMVx1NzY4NFx1NzZFRVx1NjgwN1x1MzAwMVx1N0VBNlx1Njc1Rlx1NEUwRVx1NjcxRlx1NjcxQlx1OEY5M1x1NTFGQVx1NjgzQ1x1NUYwRlx1RkYwOFx1NTNFRlx1NEVDRVx1NEUwQVx1NEUwQlx1NjU4N1x1NTQwOFx1NzQwNlx1NjNBOFx1NjVBRFx1RkYwOVx1RkYwQ1x1NEY3Rlx1NzUyOFx1N0I4MFx1NkQwMVx1NjYwRVx1Nzg2RVx1NzY4NFx1OEJFRFx1OEEwMFx1RkYwQ1x1NTNCQlx1NjM4OVx1NTE5N1x1NEY1OVx1MzAwMicgK1xuICAnXHU0RTBEXHU1Rjk3XHU3RjE2XHU5MDIwXHU4MzQ5XHU3QTNGXHU0RTJEXHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU0RThCXHU1QjlFXHU2MjE2XHU2MjgwXHU2NzJGXHU3RUM2XHU4MjgyXHUzMDAyXHU1M0VBXHU4RjkzXHU1MUZBXHU0RjE4XHU1MzE2XHU1NDBFXHU3Njg0IHByb21wdCBcdTZCNjNcdTY1ODdcdUZGMENcdTRFMERcdTg5ODFcdTRFRkJcdTRGNTVcdTg5RTNcdTkxQ0FcdTMwMDFcdTUyNERcdTdGMDBcdTYyMTZcdTRFRTNcdTc4MDFcdTU3NTdcdTUzMDVcdTg4RjlcdTMwMDInO1xuXG5jb25zdCBFTl9TWVNURU0gPVxuICAnWW91IGFyZSBhIHByb21wdCBvcHRpbWl6YXRpb24gZXhwZXJ0LiBSZXdyaXRlIHRoZSB1c2VyXFwncyBkcmFmdCBwcm9tcHQgaW50byBhIGNsZWFyZXIsIG1vcmUgc3RydWN0dXJlZCwgaGlnaC1xdWFsaXR5IHByb21wdCAnICtcbiAgJ3dpdGhvdXQgY2hhbmdpbmcgaXRzIGludGVudDogZmlsbCBpbiBtaXNzaW5nIGdvYWxzLCBjb25zdHJhaW50cywgYW5kIGV4cGVjdGVkIG91dHB1dCBmb3JtYXQgd2hlbiByZWFzb25hYmx5IGluZmVyYWJsZSwgJyArXG4gICd1c2UgY29uY2lzZSBhbmQgcHJlY2lzZSBsYW5ndWFnZSwgYW5kIHJlbW92ZSByZWR1bmRhbmN5LiBEbyBub3QgaW52ZW50IGZhY3RzIG9yIHRlY2huaWNhbCBkZXRhaWxzIGFic2VudCBmcm9tIHRoZSBkcmFmdC4gJyArXG4gICdPdXRwdXQgT05MWSB0aGUgb3B0aW1pemVkIHByb21wdCB0ZXh0LCB3aXRoIG5vIGV4cGxhbmF0aW9ucywgcHJlZml4ZXMsIG9yIGNvZGUgZmVuY2VzLic7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFN5c3RlbVByb21wdChsYW5nOiBMYW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxhbmcgPT09ICd6aCcgPyBaSF9TWVNURU0gOiBFTl9TWVNURU07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFJlcXVlc3RCb2R5KGNvbmZpZzogUHJvbXB0Q29uZmlnLCB0ZXh0OiBzdHJpbmcsIGxhbmc6IExhbmcsIHN0cmVhbSA9IGZhbHNlKTogb2JqZWN0IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChsYW5nKSB9LFxuICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHRleHQgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICBzdHJlYW0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmVzdWx0KHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHMgPSByYXcudHJpbSgpO1xuICBjb25zdCBmZW5jZSA9IC9eYGBgW2EtekEtWjAtOV8rLV0qXFxuKFtcXHNcXFNdKj8pXFxuP2BgYCQvO1xuICBjb25zdCBtYXRjaGVkID0gcy5tYXRjaChmZW5jZSk7XG4gIGlmIChtYXRjaGVkKSBzID0gbWF0Y2hlZFsxXS50cmltKCk7XG4gIHJldHVybiBzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FuVHJpZ2dlcihkcmFmdDogc3RyaW5nLCBidXN5OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiAhYnVzeSAmJiBkcmFmdC50cmltKCkubGVuZ3RoID4gMDtcbn1cblxuZXhwb3J0IHR5cGUgT3B0aW1pemVFcnJvcktpbmQgPVxuICB8ICdjb25maWcnXG4gIHwgJ3VuYXV0aG9yaXplZCdcbiAgfCAnZm9yYmlkZGVuJ1xuICB8ICdodHRwJ1xuICB8ICd0aW1lb3V0J1xuICB8ICduZXR3b3JrJ1xuICB8ICdjb3JzJ1xuICB8ICdiYWQtcmVzcG9uc2UnXG4gIHwgJ2VtcHR5JztcblxuZXhwb3J0IGNsYXNzIE9wdGltaXplRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCxcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdPcHRpbWl6ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9USU1FT1VUX01TID0gNjBfMDAwO1xuXG5mdW5jdGlvbiBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IG1lc3NhZ2U/OiB7IGNvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgY29udGVudCA9IGZpcnN0Py5tZXNzYWdlPy5jb250ZW50O1xuICByZXR1cm4gdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnID8gY29udGVudCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0Vycm9yS2luZChlOiB1bmtub3duKTogT3B0aW1pemVFcnJvciB7XG4gIGlmIChlIGluc3RhbmNlb2YgT3B0aW1pemVFcnJvcikgcmV0dXJuIGU7XG4gIGNvbnN0IGlzQWJvcnQgPVxuICAgICh0eXBlb2YgRE9NRXhjZXB0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB8fFxuICAgIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgKGUgYXMgRXJyb3IpLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gIGlmIChpc0Fib3J0KSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ3RpbWVvdXQnLCAncmVxdWVzdCBhYm9ydGVkJyk7XG4gIGlmIChlIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgY29uc3QgbSA9IFN0cmluZyhlLm1lc3NhZ2UgPz8gJycpO1xuICAgIC8vIFx1NUMzRFx1NTI5Qlx1ODAwQ1x1NEUzQVx1RkYxQUNocm9taXVtIFx1NzY4NCBDT1JTIFx1NTkzMVx1OEQyNVx1OTAxQVx1NUUzOFx1NjYyRiBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2hcIilcdUZGMDhcdTY1RTAgY29ycyBcdTVCNTdcdTY4MzdcdUZGMDlcdUZGMENcdTRGMUFcdTg0M0RcdTUyMzAgbmV0d29ya1x1RkYxQlx1NkI2NFx1NTIwNlx1NjUyRlx1NEVDNVx1NjM1NVx1ODNCN1x1ODFFQVx1NUUyNiBDT1JTIFx1NUI1N1x1NjgzN1x1NzY4NFx1OTUxOVx1OEJFRlx1MzAwMlxuICAgIGlmICgvY29ycy9pLnRlc3QobSkpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignY29ycycsIG0pO1xuICAgIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIG0gfHwgJ25ldHdvcmsgZXJyb3InKTtcbiAgfVxuICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBTdHJpbmcoKGUgYXMgRXJyb3IpPy5tZXNzYWdlID8/IGUpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG5cbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnaW52YWxpZCBKU09OJyk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQpO1xuICBpZiAoIWNvbnRlbnQgfHwgIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gZXh0cmFjdFJlc3VsdChjb250ZW50KTtcbn1cblxuLyoqXG4gKiBTU0UgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFBXHU1MTg1XHU1QkI5XHU2MjE2XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHU3Njg0XHU0RTAwXHU2QkI1XHU2NTg3XHU2NzJDXHUzMDAyXG4gKiB2NCBcdTdDRkJcdTZBMjFcdTU3OEJcdUZGMDh2NC1mbGFzaCBcdTdCNDlcdUZGMDlcdTZENDFcdTVGMEZcdTUxNDhcdThGOTNcdTUxRkFcdTk1N0ZcdTZCQjUgcmVhc29uaW5nX2NvbnRlbnRcdUZGMDhcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdUZGMDlcdUZGMENcdTk2OEZcdTU0MEVcdTYyNERcdThGOTNcdTUxRkFcbiAqIGNvbnRlbnQgXHU2QjYzXHU2NTg3XHUyMDE0XHUyMDE0XHU0RTI0XHU4MDA1XHU5MEZEXHU4OTgxXHU1QjlFXHU2NUY2XHU1NDQ4XHU3M0IwXHVGRjBDXHU1NDI2XHU1MjE5XHU2M0E4XHU3NDA2XHU2NzFGXHU1MzYxXHU3MjQ3XHU3NzBCXHU4RDc3XHU2NzY1XHU1MENGXHUzMDBDXHU5NzVFXHU2RDQxXHU1RjBGXHUzMDBEXHVGRjA4XHU1QjlFXHU2RDRCIH44MCBcdTRFMkEgY2h1bmtcbiAqIFx1NTE2OFx1NjYyRiByZWFzb25pbmdcdUZGMENcdTZCNjNcdTY1ODdcdTY3MDBcdTU0MEVcdTYyNERcdTUxRkFcdTczQjBcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IHR5cGUgU3NlRGVsdGEgPVxuICB8IHsga2luZDogJ2NvbnRlbnQnOyB0ZXh0OiBzdHJpbmcgfVxuICB8IHsga2luZDogJ3JlYXNvbmluZyc7IHRleHQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1NEUwMFx1ODg0QyBTU0UgXHU2NTcwXHU2MzZFXHVGRjFBKGRhdGE6IHsuLi59KSBcdTIxOTIgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFCXG4gKiBbRE9ORV0vXHU5NzVFIGRhdGEgXHU4ODRDL1x1OTc1RSBKU09OL1x1NjVFMFx1NTE4NVx1NUJCOSBkZWx0YSBcdTIxOTIgbnVsbFx1MzAwMlx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFNzZURlbHRhKGxpbmU6IHN0cmluZyk6IFNzZURlbHRhIHwgbnVsbCB7XG4gIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkLnN0YXJ0c1dpdGgoJ2RhdGE6JykpIHJldHVybiBudWxsO1xuICBjb25zdCBkYXRhID0gdHJpbW1lZC5zbGljZSgnZGF0YTonLmxlbmd0aCkudHJpbSgpO1xuICBpZiAoZGF0YSA9PT0gJ1tET05FXScpIHJldHVybiBudWxsO1xuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgZGVsdGE/OiB7IGNvbnRlbnQ/OiB1bmtub3duOyByZWFzb25pbmdfY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBkZWx0YSA9IGZpcnN0Py5kZWx0YTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8uY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdjb250ZW50JywgdGV4dDogZGVsdGEuY29udGVudCB9O1xuICBpZiAodHlwZW9mIGRlbHRhPy5yZWFzb25pbmdfY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdyZWFzb25pbmcnLCB0ZXh0OiBkZWx0YS5yZWFzb25pbmdfY29udGVudCB9O1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdUZGMUFcdTkwMTBcdTU3NTdcdTg5RTNcdTY3OTAgU1NFXHVGRjBDXHU4RkI5XHU2NTM2XHU4RkI5XHU1NkRFXHU4QzAzIG9uVGV4dChkZWx0YSlcdUZGMUJcdThGRDRcdTU2REVcdTVCOENcdTY1NzRcdTZCNjNcdTY1ODdcdTMwMDJcbiAqIFx1NzZGOFx1NkJENFx1OTc1RVx1NkQ0MVx1NUYwRiBvcHRpbWl6ZSgpXHVGRjFBXHU5OTk2XHU1QjU3XHU2NkY0XHU1RkVCXHUzMDAxXHU5NTdGXHU4RjkzXHU1MUZBXHU0RTBEXHU5NzAwXHU4OTgxXHU3QjQ5XHU1QjhDXHU2NTc0XHU3NTFGXHU2MjEwXHUyMDE0XHUyMDE0XHU2MzA5XHU5NEFFL1x1NTM2MVx1NzI0N1x1ODBGRFx1OEZCOVx1NzUxRlx1NjIxMFx1OEZCOVx1NjYzRVx1NzkzQVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemVTdHJlYW0ob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgb25FdmVudD86IChkZWx0YTogU3NlRGVsdGEpID0+IHZvaWQ7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCwgb25FdmVudCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nLCB0cnVlKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gIGlmICghcmVzLmJvZHkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnbWlzc2luZyByZXNwb25zZSBib2R5Jyk7XG5cbiAgY29uc3QgcmVhZGVyID0gcmVzLmJvZHkuZ2V0UmVhZGVyKCk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgbGV0IGJ1ZmZlciA9ICcnO1xuICBsZXQgZnVsbCA9ICcnO1xuICB0cnkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgaWYgKGRvbmUpIGJyZWFrO1xuICAgICAgYnVmZmVyICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcbiAgICAgIGNvbnN0IGxpbmVzID0gYnVmZmVyLnNwbGl0KCdcXG4nKTtcbiAgICAgIGJ1ZmZlciA9IGxpbmVzLnBvcCgpID8/ICcnO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGxpbmUpO1xuICAgICAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICB0cnkge1xuICAgICAgcmVhZGVyLnJlbGVhc2VMb2NrKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTVERjJcdTRFMkRcdTZCNjIvXHU5MUNBXHU2NTNFXHU2NUY2XHU1RkZEXHU3NTY1XG4gICAgfVxuICB9XG4gIC8vIFx1NUMzRVx1ODg0Q1x1RkYwOFx1NjVFMFx1NjM2Mlx1ODg0Q1x1N0VEM1x1NUMzRVx1NzY4NCBkYXRhIFx1ODg0Q1x1RkYwOVxuICBpZiAoYnVmZmVyLnRyaW0oKSkge1xuICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGJ1ZmZlcik7XG4gICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0UmVzdWx0KGZ1bGwpO1xuICBpZiAoIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTMwMENcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTMwMERcdUZGMUFcdThDMDMgY29ubmVjdGlvbiBcdTc2ODQgc2Vzc2lvbi5tb2RlbHMgUlBDXHVGRjBDXHU1M0Q2IGN1cnJlbnQubW9kZWxcdTMwMDJcbiAqIGFwaSBcdTZDRThcdTUxNjVcdTVGMEZcdUZGMDhcdTRFMEUgRFNIIFx1ODlFM1x1ODAyNlx1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1RkYxQlx1NEVGQlx1NEY1NVx1NTkzMVx1OEQyNVx1OEZENFx1NTZERSBudWxsXHVGRjA4XHU3NTMxXHU4QzAzXHU3NTI4XHU2NUI5XHU1NkRFXHU5MDAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlU2Vzc2lvbk1vZGVsKFxuICBhcGk6XG4gICAgfCB7XG4gICAgICAgIHNlc3Npb25zPzoge1xuICAgICAgICAgIG1vZGVscz86IChwYXlsb2FkPzogdW5rbm93biwgc2lnbmFsPzogQWJvcnRTaWduYWwpID0+IFByb21pc2U8eyBjdXJyZW50PzogeyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB8IHVuZGVmaW5lZCxcbiAgcGF5bG9hZDogdW5rbm93biA9IHt9LFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIC8vIFx1NUZDNVx1OTg3Qlx1NjQzQVx1NUUyNiBzZXNzaW9uSWRcdUZGMUFzZXJ2ZXIgXHU3QUVGXHU2MzA5IHJlcXVlc3QucGF5bG9hZC5zZXNzaW9uSWQgXHU2N0U1XHU4QkU1XHU0RjFBXHU4QkREXHU1REYyXHU5MDA5XHU2MkU5XHU3Njg0XHU2QTIxXHU1NzhCXHVGRjBDXG4gICAgLy8gXHU3RjNBXHU1OTMxXHU2NUY2XHU1NkRFXHU5MDAwXHU5RUQ4XHU4QkE0XHVGRjA4ZGVlcHNlZWstdjQtZmxhc2hcdUZGMDlcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcbiAgICBjb25zdCByZXMgPSBhd2FpdCBhcGk/LnNlc3Npb25zPy5tb2RlbHM/LihwYXlsb2FkLCBzaWduYWwpO1xuICAgIGNvbnN0IG0gPSByZXM/LmN1cnJlbnQ/Lm1vZGVsO1xuICAgIHJldHVybiB0eXBlb2YgbSA9PT0gJ3N0cmluZycgJiYgbS50cmltKCkgPyBtLnRyaW0oKSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTYzRDJcdTRFRjZcdTY1ODdcdTY4NDggXHUyMDE0IFx1NEUyRFx1ODJGMVx1NTNDQ1x1OEJFRCAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCBjb25zdCBOUyA9ICdwcm9tcHRfb3B0aW1pemVyJztcblxuZXhwb3J0IGNvbnN0IHpoID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnXHU0RjE4XHU1MzE2IHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ1x1NEYxOFx1NTMxNlx1N0VEM1x1Njc5QycsXG4gICdjYXJkLnJlcGxhY2UnOiAnXHU2NkZGXHU2MzYyXHU4MzQ5XHU3QTNGJyxcbiAgJ2NhcmQuY29weSc6ICdcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdcdTVERjJcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5yZXRyeSc6ICdcdTkxQ0RcdTY1QjBcdTRGMThcdTUzMTYnLFxuICAnY2FyZC5kaXNtaXNzJzogJ1x1NjUzRVx1NUYwMycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ1x1NURGMlx1OTE0RFx1N0Y2RSBcdTAwQjcgXHU2QTIxXHU1NzhCIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdcdTY3MkFcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ1x1OEJGN1x1NTE0OFx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUuZGVzYyc6ICdcdTUyNERcdTVGODAgXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTkwMUFcdTc1MjhcdThCQkVcdTdGNkUgXHUyMTkyIFByb21wdCBcdTRGMThcdTUzMTZcdUZGMENcdTU4NkJcdTUxOTlcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDBcdTMwMDFBUEkgS2V5IFx1NEUwRVx1NkEyMVx1NTc4Qlx1NTQwRFx1MzAwMicsXG4gICdndWlkZS5hY3Rpb24nOiAnXHU1M0JCXHU4QkJFXHU3RjZFJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnXHU3N0U1XHU5MDUzXHU0RTg2JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkgS2V5IFx1NjVFMFx1NjU0OFx1NjIxNlx1NURGMlx1OEZDN1x1NjcxRicsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnXHU2NzBEXHU1MkExXHU2MkQyXHU3RUREXHU4QkJGXHU5NUVFXHVGRjA4NDAzXHVGRjA5JyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnXHU4QkY3XHU2QzQyXHU4RDg1XHU2NUY2XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnXHU3RjUxXHU3RURDXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLmNvcnMnOiAnXHU2M0E1XHU1M0UzXHU0RTBEXHU2NTJGXHU2MzAxXHU4REU4XHU1N0RGXHVGRjBDXHU4QkY3XHU2MzYyXHU3NTI4XHU2NTJGXHU2MzAxIENPUlMgXHU3Njg0XHU3RjUxXHU1MTczJyxcbiAgJ2Vycm9yLmh0dHAnOiAnXHU4QkY3XHU2QzQyXHU1OTMxXHU4RDI1XHVGRjA4SFRUUCBcdTk1MTlcdThCRUZcdUZGMDknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NjgzQ1x1NUYwRlx1NUYwMlx1NUUzOCcsXG4gICdlcnJvci5lbXB0eSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTRFM0FcdTdBN0FcdUZGMENcdThCRjdcdTkxQ0RcdThCRDUnLFxuICAnZXJyb3IuY29uZmlnJzogJ1x1OTE0RFx1N0Y2RVx1NEUwRFx1NUI4Q1x1NjU3NFx1RkYwQ1x1OEJGN1x1NTIzMFx1OEJCRVx1N0Y2RVx1NEUyRFx1NjhDMFx1NjdFNScsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgXHU0RjE4XHU1MzE2JyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnXHU5MTREXHU3RjZFXHU2REE2XHU4MjcyXHU2M0E1XHU1M0UzXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVx1RkYxQktleSBcdTY2MEVcdTY1ODdcdTRGRERcdTVCNThcdTU3MjhcdTY3MkNcdTU3MzAnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnXHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCc6ICdcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdcdTVGMDBcdTU0MkZcdTY1RjZcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdThEREZcdTk2OEZcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJcdTUxNzNcdTk1RURcdTU0MEVcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdcdTVERjJcdTkwMDlcdTYyRTlcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3Muc2F2ZSc6ICdcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnXHU2MDYyXHU1OTBEXHU5RUQ4XHU4QkE0JyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1x1NURGMlx1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1x1NEZERFx1NUI1OFx1NTkzMVx1OEQyNScsXG4gICdzZXR0aW5ncy5yZXNldEZhaWxlZCc6ICdcdTkxQ0RcdTdGNkVcdTU5MzFcdThEMjUnLFxuICBcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBlbjogTG9jYWxlRGljdCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ09wdGltaXplIHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ09wdGltaXplZCBwcm9tcHQnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1VzZSBkcmFmdCcsXG4gICdjYXJkLmNvcHknOiAnQ29weScsXG4gICdjYXJkLmNvcHlEb25lJzogJ0NvcGllZCcsXG4gICdjYXJkLnJldHJ5JzogJ1JldHJ5JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdEaXNtaXNzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdPcHRpbWl6aW5nXHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ0NvbmZpZ3VyZWQgXHUwMEI3IG1vZGVsIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdObyBBUEkgY29uZmlndXJlZCcsXG4gICdndWlkZS50aXRsZSc6ICdDb25maWd1cmUgdGhlIEFQSSBmaXJzdCcsXG4gICdndWlkZS5kZXNjJzogJ0dvIHRvIFNldHRpbmdzIFx1MjE5MiBHZW5lcmFsIFx1MjE5MiBQcm9tcHQgT3B0aW1pemVyIGFuZCBmaWxsIGluIHRoZSBlbmRwb2ludCwgQVBJIGtleSwgYW5kIG1vZGVsLicsXG4gICdndWlkZS5hY3Rpb24nOiAnR28gdG8gc2V0dGluZ3MnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdHb3QgaXQnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBrZXkgaXMgaW52YWxpZCBvciBleHBpcmVkJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdBY2Nlc3MgZm9yYmlkZGVuICg0MDMpJyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnUmVxdWVzdCB0aW1lZCBvdXQ7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IubmV0d29yayc6ICdOZXR3b3JrIGVycm9yOyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLmNvcnMnOiAnRW5kcG9pbnQgYmxvY2tzIENPUlM7IHVzZSBhIGdhdGV3YXkgdGhhdCBhbGxvd3MgaXQnLFxuICAnZXJyb3IuaHR0cCc6ICdSZXF1ZXN0IGZhaWxlZCAoSFRUUCBlcnJvciknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgZm9ybWF0JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ0VtcHR5IHJlc3VsdDsgcGxlYXNlIHJldHJ5JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdJbmNvbXBsZXRlIGNvbmZpZ3VyYXRpb247IGNoZWNrIHNldHRpbmdzJyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBPcHRpbWl6ZXInLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdDb25maWd1cmUgdGhlIHJld3JpdGUgZW5kcG9pbnQgKE9wZW5BSS1jb21wYXRpYmxlKTsga2V5IGlzIHN0b3JlZCBsb2NhbGx5IGluIHBsYWluIHRleHQnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdCYXNlIFVSTCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdNb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnVXNlIGN1cnJlbnQgc2Vzc2lvbiBtb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1doZW4gb24sIG9wdGltaXphdGlvbiByZXF1ZXN0cyBmb2xsb3cgdGhlIHNlc3Npb24gbW9kZWw7IHdoZW4gb2ZmLCB0aGUgY3VzdG9tIG1vZGVsIGJlbG93IGlzIHVzZWQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdTZXNzaW9uIGRlZmF1bHQgbW9kZWwgc2VsZWN0ZWQnLFxuICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1Jlc2V0IHRvIGRlZmF1bHRzJyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1NhdmVkJyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnU2F2ZSBmYWlsZWQnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnUmVzZXQgZmFpbGVkJyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBMb2NhbGVLZXkgPSBrZXlvZiB0eXBlb2Ygemg7XG5leHBvcnQgdHlwZSBMb2NhbGVEaWN0ID0geyBbSyBpbiBMb2NhbGVLZXldOiBzdHJpbmcgfTtcblxuLyoqIFx1NkZDMFx1NkQzQiBsb2NhbGUgXHUyMTkyIFx1NzU0Q1x1OTc2Mlx1OEJFRFx1OEEwMFx1RkYwOHpoIFx1NTI0RFx1N0YwMFx1NUY1MiB6aFx1RkYwQ1x1NTE3Nlx1NEY1OVx1NUY1MiBlblx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhbmdPZihhY3RpdmU6IHN0cmluZyk6IExhbmcge1xuICByZXR1cm4gdHlwZW9mIGFjdGl2ZSA9PT0gJ3N0cmluZycgJiYgYWN0aXZlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnemgnKSA/ICd6aCcgOiAnZW4nO1xufVxuIiwgIi8qKiBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMUJcdTkwN0ZcdTUxNEQgaW5kZXggXHUyMTk0IFx1N0VDNFx1NEVGNlx1NUZBQVx1NzNBRlx1NEY5RFx1OEQ1Nlx1RkYwOVx1RkYxQVxuICogIC0gb3B0aW1pemVSZXF1ZXN0XHVGRjFBXHU1RkVCXHU2Mzc3XHU5NTJFIEFsdCtPIFx1MjE5MiBcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdTg5RTZcdTUzRDFcbiAqICAtIG9wZW5TZXR0aW5nc1JlcXVlc3RcdUZGMUFcdTk4ODRcdTg5QzhcdTUzNjFcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdTIxOTIgXHU4QkJFXHU3RjZFXHU4ODRDXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwICovXG5cbmNvbnN0IG9wdGltaXplUmVxdWVzdExpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3B0aW1pemVSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3B0aW1pemVSZXF1ZXN0KCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGZuIG9mIG9wdGltaXplUmVxdWVzdExpc3RlbmVycykgZm4oKTtcbn1cblxuY29uc3Qgb3BlblNldHRpbmdzTGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wZW5TZXR0aW5nc0xpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3BlblNldHRpbmdzTGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMpIGZuKCk7XG59XG4iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NjgwRlx1NTNGM1x1NEZBN1x1MzAwQ1x1NEYxOFx1NTMxNlx1MzAwRFx1NjMwOVx1OTRBRSBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMENcdTcyQjZcdTYwMDFcdThENzBcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkYgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGdldFByZXZpZXdCdXNTdGF0ZSwgc3Vic2NyaWJlUHJldmlld0J1cyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuaW1wb3J0IHsgb25PcHRpbWl6ZVJlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW1pemVCdXR0b25Qcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgYXBpOiB1bmtub3duOyBwYXJlbnRTZXNzaW9uSWQ6IHN0cmluZzsgc2Vzc2lvbklkOiBzdHJpbmcgfSB8IG51bGw7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9idXR0b24uY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMnB4IDZweDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMTtcbiAgb3BhY2l0eTogMC44NTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xufVxuLmRzaC1wby1idG46aG92ZXI6bm90KDpkaXNhYmxlZCkge1xuICBvcGFjaXR5OiAxO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xMikpO1xufVxuLmRzaC1wby1idG46ZGlzYWJsZWQge1xuICBvcGFjaXR5OiAwLjM1O1xuICBjdXJzb3I6IGRlZmF1bHQ7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuLyoqXG4gKiBcdThCRkJcdTUzRDZcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMUFcdTRGMThcdTUxNDhcdTUzRDZcdTcxMjZcdTcwQjkgdGV4dGFyZWFcdUZGMUJcdTU0MjZcdTUyMTlcdTU2REVcdTkwMDBcdTUyMzBcdTk4NzVcdTk3NjJcdTRFMkRcdTMwMENcdTUwM0NcdTk3NUVcdTdBN0FcdTMwMERcdTc2ODQgdGV4dGFyZWFcbiAqIFx1RkYwOFx1NzUyOFx1NjIzN1x1NTcyOFx1OEY5M1x1NTE2NVx1NzY4NFx1NTM3M1x1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYwOVx1MzAwMlx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERFx1NjgwN1x1NTFDNiBraXQgXHU3Njg0IGlucHV0IGhvb2tcdTIwMTRcdTIwMTRcdTVCOUVcdTZENEJcbiAqIGlucHV0LnJpZ2h0IFx1NkUzMlx1NjdEM1x1NjVGNlx1OEJFNVx1NjgwN1x1NTFDNiBwcm9wcyBcdTY3MkFcdTYzRDBcdTRGOUJcdUZGMENcdTdFQzRcdTRFRjZcdTRGMUFcdTU2RTBcdThDMDNcdTc1MjggdW5kZWZpbmVkIGhvb2tcbiAqIFx1NUQyOVx1NkU4M1x1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1RkYwOFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjggXHU0RTBEXHU1M0VGXHU4OUMxXHVGRjA5XHUzMDAyXG4gKi9cbmZ1bmN0aW9uIHJlYWREcmFmdCgpOiBzdHJpbmcge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgcmV0dXJuIGFjdGl2ZS52YWx1ZTtcbiAgY29uc3QgYWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWEnKTtcbiAgZm9yIChjb25zdCB0YSBvZiBhbGwpIHtcbiAgICBpZiAodGEudmFsdWUudHJpbSgpKSByZXR1cm4gdGEudmFsdWU7XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gT3B0aW1pemVCdXR0b24ocHJvcHM6IE9wdGltaXplQnV0dG9uUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBnZXRDb25maWcsIGdldExhbmcsIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU3RTQxXHU1RkQ5XHU2MDAxXHVGRjFBXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKCgpID0+IGdldFByZXZpZXdCdXNTdGF0ZSgpLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0QnVzeShnZXRQcmV2aWV3QnVzU3RhdGUoKS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykpLFxuICAgIFtdLFxuICApO1xuXG4gIC8vIG1vdXNlZG93biBcdTk4ODRcdThCRkJcdTgzNDlcdTdBM0ZcdUZGMUFcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcdTc3QUNcdTk1RjRcdTcxMjZcdTcwQjlcdTRGMUFcdTUyMDdcdTUyMzBcdTYzMDlcdTk0QUVcdUZGMDhhY3RpdmVFbGVtZW50IFx1NEUwRFx1NTE4RFx1NjYyRiB0ZXh0YXJlYVx1RkYwOVx1RkYwQ1xuICAvLyBcdTRGNDYgbW91c2Vkb3duIFx1NjVFOVx1NEU4RVx1NzEyNlx1NzBCOVx1NTIwN1x1NjM2Mlx1MjAxNFx1MjAxNFx1NkI2NFx1NTIzQlx1OEJGQlx1NTIzMFx1NzY4NCBhY3RpdmVFbGVtZW50IFx1NEVDRFx1NjYyRlx1OEY5M1x1NTE2NVx1Njg0Nlx1MzAwMlxuICBjb25zdCBkcmFmdFJlZiA9IFJlYWN0LnVzZVJlZignJyk7XG4gIGNvbnN0IHN5bmNEcmFmdCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBkcmFmdFJlZi5jdXJyZW50ID0gcmVhZERyYWZ0KCk7XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBoYW5kbGVDbGljayA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoYnVzeSkgcmV0dXJuO1xuICAgIGNvbnN0IGRyYWZ0ID0gZHJhZnRSZWYuY3VycmVudCB8fCByZWFkRHJhZnQoKTtcbiAgICBpZiAoIWRyYWZ0LnRyaW0oKSkgcmV0dXJuO1xuICAgIHZvaWQgcnVuT3B0aW1pemUoe1xuICAgICAgZ2V0Q29uZmlnLFxuICAgICAgZ2V0TGFuZyxcbiAgICAgIGdldERyYWZ0OiAoKSA9PiBkcmFmdCxcbiAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgIGdldEhvc3QsXG4gICAgfSk7XG4gIH0sIFtidXN5LCBnZXRDb25maWcsIGdldExhbmddKTtcblxuICAvLyBBbHQrTyBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMDhpbmRleC50cyBcdTUxNjhcdTVDNDBcdTc2RDFcdTU0MkNcdUZGMDlcdTIxOTIgXHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wdGltaXplUmVxdWVzdChoYW5kbGVDbGljayksIFtoYW5kbGVDbGlja10pO1xuXG4gIHJldHVybiAoXG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBjbGFzc05hbWU9XCJkc2gtcG8tYnRuXCJcbiAgICAgIGFyaWEtbGFiZWw9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICB0aXRsZT17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIGFyaWEtYnVzeT17YnVzeX1cbiAgICAgIGRpc2FibGVkPXtidXN5fVxuICAgICAgZGF0YS1idXN5PXtidXN5fVxuICAgICAgb25Nb3VzZURvd249e3N5bmNEcmFmdH1cbiAgICAgIG9uRm9jdXM9e3N5bmNEcmFmdH1cbiAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgID5cbiAgICAgIHtidXN5ID8gJ1x1MjNGMycgOiAnXHUyNzI4J31cbiAgICA8L2J1dHRvbj5cbiAgKTtcbn0iLCAiLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRGMThcdTUzMTZcdUZGMDhcdTRFMzRcdTY1RjZcdTVCRjlcdThCREQgKyBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMENcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdTMwMDJcbiAqXG4gKiBcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTZDQTFcdTY3MDlcdTMwMENcdTRFMDBcdTZCMjFcdTYwMjdcdTc1MUZcdTYyMTBcdTYyRkZcdTdFRDNcdTY3OUNcdTMwMERcdTc2ODQgUlBDXHVGRjBDXHU1NkUwXHU2QjY0XHU3NTI4XHU0RTAwXHU0RTJBXHU1M0VGXHU1OTBEXHU3NTI4XHU3Njg0XHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU2MjdGXHU4RjdEXHU0RjE4XHU1MzE2XHVGRjFBXG4gKiAgIHNlc3Npb24uY3JlYXRlXHVGRjA4XHU1NkZBXHU1QjlBIHNlc3Npb25JZFx1RkYwQ1x1NUU0Mlx1N0I0OVx1RkYwOVx1MjE5MiBzZXNzaW9uLnNlbGVjdE1vZGVsXHVGRjA4XHU3RUU3XHU2MjdGXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA5XG4gKiAgIFx1MjE5MiBzZXNzaW9uLnByb21wdFx1RkYwOHF1ZXVlIFx1NkNFOFx1NTE2NVx1NUUyNlx1ODlDNFx1NTIxOVx1NzY4NFx1NjU4N1x1NjcyQ1x1RkYwOVx1MjE5MiBcdThGNkVcdThCRTIgc2Vzc2lvbi5oaXN0b3J5IFx1NTg5RVx1OTFDRlx1NTNENlx1NkI2M1x1NjU4N1x1RkYwOFx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1RkYwOVxuICogICBcdTIxOTIgXHU1QjhDXHU2MjEwL1x1OEZERVx1N0VFRFx1NjVFMFx1NTNEOFx1NTMxNlx1RkYwOHNldHRsZVx1RkYwOVx1N0VEM1x1Njc1Rlx1RkYxQlx1NEUyRFx1NkI2Mlx1OEQ3MCBzZXNzaW9uLmNhbmNlbFx1MzAwMlxuICpcbiAqIFx1NEU4Qlx1NEVGNlx1NTk1MVx1N0VBNlx1NTA1QVx1NUJCRFx1NTMzOVx1OTE0RFx1RkYwOFx1NUJCRlx1NEUzQiBkYXRhIFx1NUY2Mlx1NzJCNlx1NjcyQVx1NUI4Q1x1NTE2OFx1NTE2Q1x1NUYwMFx1RkYwOVx1RkYxQVx1NTNFQVx1NjUzNiBtZXNzYWdlL2Fzc2lzdGFudCBcdTdDN0JcdTRFOEJcdTRFRjZcdTc2ODRcbiAqIHRleHQgXHU1NzU3XHVGRjBDXHU4REYzXHU4RkM3IHVzZXIgXHU0RThCXHU0RUY2XHVGRjA4XHU5NjMyXHU1NkRFXHU2NjNFXHU2MjExXHU0RUVDXHU2Q0U4XHU1MTY1XHU3Njg0IHByb21wdFx1RkYwOVx1RkYwQ3NldHRsZSBcdTUxNUNcdTVFOTVcdTk2MzJcdTUzNjFcdTZCN0JcdTMwMDJcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBidWlsZFN5c3RlbVByb21wdCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuLyoqIGNvbm5lY3Rpb24uYXBpLnNlc3Npb25zIFx1NzY4NFx1NjcwMFx1NUMwRlx1OTc2Mlx1RkYwOFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0U2Vzc2lvbkFwaSB7XG4gIGNyZWF0ZT86IChwYXlsb2FkOiB7IHNlc3Npb25JZD86IHN0cmluZzsgd29ya3NwYWNlSWQ/OiBzdHJpbmc7IGN3ZD86IHN0cmluZyB9KSA9PiBQcm9taXNlPHVua25vd24+O1xuICBzZWxlY3RNb2RlbD86IChwYXlsb2FkOiB7XG4gICAgc2Vzc2lvbklkOiBzdHJpbmc7XG4gICAgcHJvdmlkZXI6IHN0cmluZztcbiAgICBtb2RlbDogc3RyaW5nO1xuICAgIHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZztcbiAgfSkgPT4gUHJvbWlzZTx1bmtub3duPjtcbiAgcHJvbXB0PzogKHBheWxvYWQ6IHsgc2Vzc2lvbklkOiBzdHJpbmc7IG1vZGU6ICdxdWV1ZScgfCAnc3RlZXInOyBjb250ZW50OiBBcnJheTx7IHR5cGU6ICd0ZXh0JzsgdGV4dDogc3RyaW5nIH0+IH0pID0+IFByb21pc2U8dW5rbm93bj47XG4gIGhpc3Rvcnk/OiAocGF5bG9hZDogeyBzZXNzaW9uSWQ6IHN0cmluZyB9KSA9PiBQcm9taXNlPHsgZXZlbnRzPzogQXJyYXk8eyBldmVudD86IHVua25vd24gfT4gfT47XG4gIGNhbmNlbD86IChwYXlsb2FkOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pID0+IFByb21pc2U8dW5rbm93bj47XG4gIG1vZGVscz86IChwYXlsb2FkOiB7IHNlc3Npb25JZDogc3RyaW5nIH0pID0+IFByb21pc2U8eyBjdXJyZW50PzogeyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdFRleHRCbG9jayB7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIHRleHQ/OiBzdHJpbmc7XG4gIHJvbGU/OiBzdHJpbmc7XG4gIGNvbnRlbnQ/OiBIb3N0VGV4dEJsb2NrW10gfCBzdHJpbmc7XG4gIFtrOiBzdHJpbmddOiB1bmtub3duO1xufVxuXG4vKiogXHU0RUNFXHU0RThCXHU0RUY2IGRhdGEgXHU2REYxXHU2NDFDXHU2NTM2XHU5NkM2XHU2NTg3XHU2NzJDXHU1NzU3XHVGRjA4YHt0eXBlOid0ZXh0Jyx0ZXh0fWBcdUZGMDlcdUZGMEN1c2VyIFx1NEU4Qlx1NEVGNlx1NjU3NFx1NEY1M1x1OERGM1x1OEZDN1x1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RUZXh0cyhkYXRhOiBIb3N0VGV4dEJsb2NrIHwgdW5kZWZpbmVkIHwgbnVsbCwgb3V0OiBzdHJpbmdbXSwgc2tpcFJvbGVVc2VyOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghZGF0YSB8fCB0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHJldHVybjtcbiAgaWYgKGRhdGEucm9sZSA9PT0gJ3VzZXInICYmIHNraXBSb2xlVXNlcikgcmV0dXJuO1xuICBpZiAodHlwZW9mIGRhdGEudHlwZSA9PT0gJ3N0cmluZycgJiYgZGF0YS50eXBlICE9PSAndXNlcicgJiYgdHlwZW9mIGRhdGEudGV4dCA9PT0gJ3N0cmluZycgJiYgZGF0YS50ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICBvdXQucHVzaChkYXRhLnRleHQpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmNvbnRlbnQpKSB7XG4gICAgZm9yIChjb25zdCBwYXJ0IG9mIGRhdGEuY29udGVudCkgY29sbGVjdFRleHRzKHBhcnQgYXMgSG9zdFRleHRCbG9jaywgb3V0LCBza2lwUm9sZVVzZXIpO1xuICB9XG59XG5cbi8qKlxuICogXHU2MjhBIGhpc3RvcnkgXHU0RThCXHU0RUY2XHU1MjE3XHU4ODY4XHU2Mjk4XHU1M0UwXHU0RTNBXHU3RDJGXHU3OUVGXHU2QjYzXHU2NTg3XHVGRjA4XHU2MzA5IHNlcSBcdTdBMzNcdTVCOUFcdTYzOTJcdTVFOEZcdUZGMUJcdTUzRUFcdTY1MzYgbWVzc2FnZS9hc3Npc3RhbnQgXHU3QzdCXHU0RThCXHU0RUY2XHVGRjA5XHUzMDAyXG4gKiBcdThGRDRcdTU2REVcdTdBN0FcdTY1ODdcdTY3MkNcdTRFMERcdTg5QzZcdTRFM0FcdTU5MzFcdThEMjVcdUZGMDhcdTU5MUFcdThGNkVcdThGNkVcdThCRTJcdTgxRUFcdTcxMzZcdTdEMkZcdTc5RUZcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvbGRTZXNzaW9uVGV4dChldmVudHM6IEFycmF5PHsgZXZlbnQ/OiB1bmtub3duIH0+IHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGV2ZW50cykpIHJldHVybiAnJztcbiAgdHlwZSBFdiA9IHsgdHlwZT86IHN0cmluZzsgc2VxPzogbnVtYmVyOyBkYXRhPzogSG9zdFRleHRCbG9jayB9O1xuICBjb25zdCBzb3J0ZWQ6IEV2W10gPSBldmVudHNcbiAgICAubWFwKChlbnRyeSkgPT4gKGVudHJ5ICYmIHR5cGVvZiBlbnRyeSA9PT0gJ29iamVjdCcgPyAoKGVudHJ5IGFzIHsgZXZlbnQ/OiB1bmtub3duIH0pLmV2ZW50IGFzIEV2KSA6IHVuZGVmaW5lZCkpXG4gICAgLmZpbHRlcigoZSk6IGUgaXMgRXYgPT4gISFlICYmIHR5cGVvZiBlID09PSAnb2JqZWN0Jyk7XG4gIHNvcnRlZC5zb3J0KChhLCBiKSA9PiAoYS5zZXEgPz8gMCkgLSAoYi5zZXEgPz8gMCkpO1xuICBjb25zdCB0ZXh0czogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBldiBvZiBzb3J0ZWQpIHtcbiAgICBjb25zdCB0eXBlID0gdHlwZW9mIGV2LnR5cGUgPT09ICdzdHJpbmcnID8gZXYudHlwZSA6ICcnO1xuICAgIC8vIFx1NTNFQVx1NTE3M1x1NUZDM1x1NkQ4OFx1NjA2Ri9cdTUyQTlcdTYyNEJcdTdDN0JcdTRFOEJcdTRFRjZcdUZGMUJcdTY2MEVcdTc4NkVcdThERjNcdThGQzcgdXNlciBcdTRFMEVcdTdFQUZcdTVERTVcdTUxNzcvXHU3Q0ZCXHU3RURGXHU0RThCXHU0RUY2XG4gICAgaWYgKHR5cGUuaW5jbHVkZXMoJ3VzZXInKSAmJiAhdHlwZS5pbmNsdWRlcygnYXNzaXN0YW50JykpIGNvbnRpbnVlO1xuICAgIGlmICghLyhtZXNzYWdlfGFzc2lzdGFudHx0ZXh0fGFuc3dlcnxyZXBseXxjb21wbGV0aW9uKS9pLnRlc3QodHlwZSkpIGNvbnRpbnVlO1xuICAgIGNvbGxlY3RUZXh0cyhldi5kYXRhLCB0ZXh0cywgdHJ1ZSk7XG4gIH1cbiAgcmV0dXJuIHRleHRzLmpvaW4oJycpO1xufVxuXG4vKiogXHU3RDJGXHU3OUVGXHU2NTg3XHU2NzJDXHU2MzA5XHU1QjU3XHU3QjI2XHU1MjREXHU3RjAwXHU4QkExXHU3Qjk3XHU1ODlFXHU5MUNGXHVGRjA4XHU4RjZFXHU4QkUyXHU4RkQxXHU0RjNDXHU2RDQxXHU1RjBGXHU3NTI4XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcHJlZml4RGVsdGEocHJldjogc3RyaW5nLCBuZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBuID0gTWF0aC5taW4ocHJldi5sZW5ndGgsIG5leHQubGVuZ3RoKTtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IG4gJiYgcHJldi5jaGFyQ29kZUF0KGkpID09PSBuZXh0LmNoYXJDb2RlQXQoaSkpIGkgKz0gMTtcbiAgcmV0dXJuIG5leHQuc2xpY2UoaSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSG9zdE9wdGltaXplT3B0aW9ucyB7XG4gIGFwaTogSG9zdFNlc3Npb25BcGk7XG4gIC8qKiBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdUZGMDhcdTZBMjFcdTU3OEJcdTY3NjVcdTZFOTBcdUZGMDlcdTMwMDIgKi9cbiAgcGFyZW50U2Vzc2lvbklkOiBzdHJpbmc7XG4gIHNlc3Npb25JZDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNpZ25hbDogQWJvcnRTaWduYWw7XG4gIG9uRGVsdGE6ICh0ZXh0OiBzdHJpbmcpID0+IHZvaWQ7XG4gIGludGVydmFsTXM/OiBudW1iZXI7XG4gIHRpbWVvdXRNcz86IG51bWJlcjtcbiAgLyoqIFx1NjU4N1x1NjcyQ1x1NEUwRFx1NTE4RFx1NTg5RVx1OTU3RiBOIFx1OEY2RVx1NTQwRVx1ODlDNlx1NEUzQVx1NUI4Q1x1NjIxMFx1RkYwOFx1NTk1MVx1N0VBNlx1NTE1Q1x1NUU5NVx1RkYwOVx1MzAwMiAqL1xuICBzZXR0bGVSb3VuZHM/OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfSU5URVJWQUxfTVMgPSA0MDA7XG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSAxMjBfMDAwO1xuY29uc3QgREVGQVVMVF9TRVRUTEVfUk9VTkRTID0gMztcblxuLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTUxNjhcdTZENDFcdTdBMEJcdUZGMUFcdTUyMUJcdTVFRkEvXHU1OTBEXHU3NTI4XHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREIFx1MjE5MiBcdTdFRTdcdTYyN0ZcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEIgXHUyMTkyIFx1NkNFOFx1NTE2NVx1NEYxOFx1NTMxNiBwcm9tcHRcbiAqIFx1MjE5MiBcdThGNkVcdThCRTIgaGlzdG9yeSBcdTc2RjRcdTgxRjNcdTY1ODdcdTY3MkMgc2V0dGxlXHVGRjA4XHU2MjE2IGFib3J0IC8gXHU4RDg1XHU2NUY2XHVGRjA5XHUzMDAyXHU4RkQ0XHU1NkRFXHU2NzAwXHU3RUM4XHU2QjYzXHU2NTg3XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Ib3N0T3B0aW1pemUob3B0czogUnVuSG9zdE9wdGltaXplT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgYXBpLCBwYXJlbnRTZXNzaW9uSWQsIHNlc3Npb25JZCwgbGFuZywgdGV4dCwgc2lnbmFsLCBvbkRlbHRhIH0gPSBvcHRzO1xuICBjb25zdCBpbnRlcnZhbE1zID0gb3B0cy5pbnRlcnZhbE1zID8/IERFRkFVTFRfSU5URVJWQUxfTVM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdHMudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUztcbiAgY29uc3Qgc2V0dGxlUm91bmRzID0gb3B0cy5zZXR0bGVSb3VuZHMgPz8gREVGQVVMVF9TRVRUTEVfUk9VTkRTO1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuXG4gIC8vIDEuIFx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1RkYwOFx1NUU0Mlx1N0I0OVx1RkYxQVx1NURGMlx1NUI1OFx1NTcyOFx1NTIxOVx1NUZGRFx1NzU2NVx1NTkzMVx1OEQyNVx1RkYwOVxuICB0cnkge1xuICAgIGF3YWl0IGFwaS5jcmVhdGU/Lih7IHNlc3Npb25JZCB9KTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gXHU1REYyXHU1QjU4XHU1NzI4XHVGRjA4XHU1OTBEXHU3NTI4XHVGRjA5XHU2MjE2XHU1QkJGXHU0RTNCXHU2NjgyXHU0RTBEXHU1MTQxXHU4QkI4XHUyMDE0XHUyMDE0XHU3RUU3XHU3RUVEXHVGRjBDaGlzdG9yeSBcdTRGMUFcdTU0NEFcdThCQzlcdTYyMTFcdTRFRUNcdTgwRkRcdTRFMERcdTgwRkRcdTc1MjhcbiAgfVxuXG4gIC8vIDIuIFx1N0VFN1x1NjI3Rlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwOHByb3ZpZGVyICsgbW9kZWxcdUZGMDlcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJlbnQgPSBhd2FpdCBhcGkubW9kZWxzPy4oeyBzZXNzaW9uSWQ6IHBhcmVudFNlc3Npb25JZCB9KTtcbiAgICBpZiAocGFyZW50Py5jdXJyZW50Py5tb2RlbCkge1xuICAgICAgYXdhaXQgYXBpLnNlbGVjdE1vZGVsPy4oe1xuICAgICAgICBzZXNzaW9uSWQsXG4gICAgICAgIHByb3ZpZGVyOiBwYXJlbnQuY3VycmVudC5wcm92aWRlciA/PyAnZGVlcHNlZWstb2ZmaWNpYWwnLFxuICAgICAgICBtb2RlbDogcGFyZW50LmN1cnJlbnQubW9kZWwsXG4gICAgICB9KTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIFx1NkEyMVx1NTc4Qlx1N0VFN1x1NjI3Rlx1NTkzMVx1OEQyNVx1RkYxQVx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NzUyOFx1NTE3Nlx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1N0VFN1x1N0VFRFxuICB9XG5cbiAgLy8gMy4gXHU2Q0U4XHU1MTY1XHU0RjE4XHU1MzE2XHU2MzA3XHU0RUU0XHVGRjA4XHU4OUM0XHU1MjE5XHU2MkZDXHU4RkRCIHVzZXIgXHU2NTg3XHU2NzJDXHUyMDE0XHUyMDE0XHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU2NUUwXHU2MzAxXHU0RTQ1IHN5c3RlbVx1RkYwOVxuICBjb25zdCBzeXN0ZW0gPSBidWlsZFN5c3RlbVByb21wdChsYW5nKTtcbiAgY29uc3QgY29udGVudCA9IGAke3N5c3RlbX1cXG5cXG4ke3RleHR9YDtcbiAgY29uc3QgYWNjZXB0ZWQgPSBhd2FpdCBhcGkucHJvbXB0Py4oeyBzZXNzaW9uSWQsIG1vZGU6ICdxdWV1ZScsIGNvbnRlbnQ6IFt7IHR5cGU6ICd0ZXh0JywgdGV4dDogY29udGVudCB9XSB9KTtcbiAgaWYgKGFjY2VwdGVkID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcignaG9zdC1wcm9tcHQtdW5hdmFpbGFibGUnKTtcblxuICAvLyA0LiBcdThGNkVcdThCRTIgaGlzdG9yeSBcdTU4OUVcdTkxQ0ZcdTUzRDZcdTZCNjNcdTY1ODdcbiAgY29uc3Qgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gIGxldCBsYXN0VGV4dCA9ICcnO1xuICBsZXQgaWRsZVJvdW5kcyA9IDA7XG4gIGZvciAoOzspIHtcbiAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5jYW5jZWw/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTVDM0RcdTUyOUJcdTUzRDZcdTZEODhcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuICAgIH1cbiAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ZWQgPiB0aW1lb3V0TXMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFwaS5jYW5jZWw/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTVDM0RcdTUyOUJcdTUzRDZcdTZEODhcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCcpO1xuICAgIH1cbiAgICBsZXQgY3VycmVudCA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgYXBpLmhpc3Rvcnk/Lih7IHNlc3Npb25JZCB9KTtcbiAgICAgIGN1cnJlbnQgPSBmb2xkU2Vzc2lvblRleHQocGFnZT8uZXZlbnRzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTM1NVx1NkIyMVx1NTNENlx1NTkzMVx1OEQyNVx1NEUwRFx1ODFGNFx1NTQ3RFx1RkYwQ1x1NEUwQlx1NEUwMFx1OEY2RVx1NTE4RFx1OEJENVxuICAgIH1cbiAgICBpZiAoY3VycmVudCAhPT0gbGFzdFRleHQpIHtcbiAgICAgIGlkbGVSb3VuZHMgPSAwO1xuICAgICAgY29uc3QgZGVsdGEgPSBwcmVmaXhEZWx0YShsYXN0VGV4dCwgY3VycmVudCk7XG4gICAgICBsYXN0VGV4dCA9IGN1cnJlbnQ7XG4gICAgICBpZiAoZGVsdGEpIG9uRGVsdGEobGFzdFRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZGxlUm91bmRzICs9IDE7XG4gICAgICBpZiAoaWRsZVJvdW5kcyA+PSBzZXR0bGVSb3VuZHMpIGJyZWFrO1xuICAgIH1cbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSk7XG4gIH1cbiAgcmV0dXJuIGxhc3RUZXh0O1xufSIsICIvKiogXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHU3MkI2XHU2MDAxXHU2NzNBIFx1MjAxNFx1MjAxNCBcdTdFQUYgcmVkdWNlclx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmltcG9ydCB0eXBlIHsgT3B0aW1pemVFcnJvcktpbmQgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdTdGF0dXMgPSAnaWRsZScgfCAnb3B0aW1pemluZycgfCAncHJldmlldycgfCAnZXJyb3InIHwgJ2d1aWRlJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U3RhdGUge1xuICBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBlcnJvcktpbmQ6IE9wdGltaXplRXJyb3JLaW5kIHwgbnVsbDtcbiAgZ2VuZXJhdGlvbjogbnVtYmVyO1xuICAvKiogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHU0RTJEXHU3Njg0XHU1ODlFXHU5MUNGXHU2NTg3XHU2NzJDXHVGRjA4b3B0aW1pemluZyBcdTYwMDFcdTVCOUVcdTY1RjZcdTY2RjRcdTY1QjBcdUZGMUJcdTk3NUVcdTZENDFcdTVGMEZcdTUxNjhcdTdBMEJcdTRFM0FcdTdBN0FcdTRFMzJcdUZGMDkgKi9cbiAgZHJhZnQ6IHN0cmluZztcbn1cblxuLyoqIFx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYxQXJlZHVjZXIgXHU2QzM4XHU0RTBEXHU1MTk5XHU1NkRFXHU1QjgzXHU2MjE2XHU4RkQ0XHU1NkRFXHU1M0VGXHU1M0Q4XHU3Njg0XHU2NUIwXHU1QkY5XHU4QzYxXHVGRjFCXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA4VGFzayA0IHN0b3JlIFx1ODBGNlx1NkMzNFx1RkYwOVx1NUZDNVx1OTg3Qlx1NEVFNSB7IC4uLklOSVRJQUxfUFJFVklFVyB9IFx1NEUzQVx1NkJDRlx1NEYxQVx1OEJERFx1NzlDRFx1NUI1MCAqL1xuZXhwb3J0IGNvbnN0IElOSVRJQUxfUFJFVklFVzogUHJldmlld1N0YXRlID0ge1xuICBzdGF0dXM6ICdpZGxlJyxcbiAgcmVzdWx0OiAnJyxcbiAgZXJyb3JLaW5kOiBudWxsLFxuICBnZW5lcmF0aW9uOiAwLFxuICBkcmFmdDogJycsXG59O1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3QWN0aW9uID1cbiAgfCB7IHR5cGU6ICdiZWdpbicgfVxuICB8IHsgdHlwZTogJ3Nob3cnOyByZXN1bHQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kIH1cbiAgfCB7IHR5cGU6ICdndWlkZScgfVxuICB8IHsgdHlwZTogJ2Nsb3NlJyB9XG4gIHwgeyB0eXBlOiAnZHJhZnQnOyB0ZXh0OiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHN0YXR1czogJ29wdGltaXppbmcnLCBlcnJvcktpbmQ6IG51bGwsIGRyYWZ0OiAnJywgZ2VuZXJhdGlvbjogc3RhdGUuZ2VuZXJhdGlvbiArIDEgfTtcbiAgICBjYXNlICdzaG93JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ3ByZXZpZXcnLCByZXN1bHQ6IGFjdGlvbi5yZXN1bHQsIGRyYWZ0OiAnJyB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdlcnJvcicsIGVycm9yS2luZDogYWN0aW9uLmtpbmQgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2d1aWRlJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHN0YXRlIDogeyAuLi5zdGF0ZSwgc3RhdHVzOiAnZ3VpZGUnIH07XG4gICAgY2FzZSAnY2xvc2UnOlxuICAgICAgcmV0dXJuIElOSVRJQUxfUFJFVklFVztcbiAgICBjYXNlICdkcmFmdCc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyB7IC4uLnN0YXRlLCBkcmFmdDogYWN0aW9uLnRleHQgfSA6IHN0YXRlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1ODlDNFx1NUI5QVx1NzY4NFx1NTE2Q1x1NUYwMCBBUElcdUZGMDhUYXNrIDQgXHU4RDc3XHU1QjU4XHU1NzI4XHVGRjFCY2FuVHJpZ2dlciBcdTc2ODQgIWJ1c3kgXHU1MzRBXHU4RkI5XHU2MjdGXHU2MkM1XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU4MDRDXHU4RDIzXHVGRjBDXHU1MTc2XHU0RjU5XHU0RkREXHU3NTU5XHU0RUU1XHU1OTA3XHU1NDBFXHU3RUVEXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2FuT3B0aW1pemVGcm9tKHN0YXR1czogUHJldmlld1N0YXR1cyk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3RhdHVzICE9PSAnb3B0aW1pemluZyc7XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMVx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRiBcdTIwMTRcdTIwMTQgXHU2MzA5XHU5NEFFL1x1OTg4NFx1ODlDOFx1NTM2MS9ydW5PcHRpbWl6ZSBcdTUxNzFcdTRFQUJcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayAqL1xuXG5pbXBvcnQge1xuICBJTklUSUFMX1BSRVZJRVcsXG4gIHJlZHVjZVByZXZpZXcsXG4gIHR5cGUgUHJldmlld0FjdGlvbixcbiAgdHlwZSBQcmV2aWV3U3RhdGUsXG59IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTZBMjFcdTU3NTdcdTdFQTdcdTUzNTVcdTRGOEJcdTcyQjZcdTYwMDFcdUZGMDhcdTZCQ0ZcdTYzRDJcdTRFRjZcdTVCOUVcdTRGOEJcdTRFMDBcdTRFRkRcdUZGMUFcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTUxODVcdTUxNjhcdTVDNDBcdTU1MkZcdTRFMDBcdUZGMDkgKi9cbmxldCBzdGF0ZTogUHJldmlld1N0YXRlID0geyAuLi5JTklUSUFMX1BSRVZJRVcgfTtcbmNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuLyoqIFx1OEJGQlx1NUY1M1x1NTI0RFx1NUZFQlx1NzE2N1x1RkYwOFx1N0EzM1x1NUI5QVx1NUYxNVx1NzUyOFx1NzZGNFx1NTIzMFx1NEUwQlx1NEUwMFx1NkIyMSBkaXNwYXRjaFx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdCdXNTdGF0ZSgpOiBQcmV2aWV3U3RhdGUge1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8qKiBcdTZEM0VcdTUzRDFcdTcyQjZcdTYwMDFcdTY3M0FcdTUyQThcdTRGNUNcdTVFNzZcdTkwMUFcdTc3RTVcdThCQTJcdTk2MDVcdTgwMDUgKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaFByZXZpZXcoYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gIHN0YXRlID0gcmVkdWNlUHJldmlldyhzdGF0ZSwgYWN0aW9uKTtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIGxpc3RlbmVyKCk7XG59XG5cbi8qKiBcdThCQTJcdTk2MDVcdTUzRDhcdTUzMTZcdUZGMUJcdThGRDRcdTU2REVcdTkwMDBcdThCQTJcdTUxRkRcdTY1NzAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVQcmV2aWV3QnVzKGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9O1xufSIsICIvKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICsgXHU2QTIxXHU1NzU3XHU3RUE3XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2IFx1MjAxNFx1MjAxNCBcdTcyQjZcdTYwMDFcdTdFQ0ZcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1NTNEMVx1NUUwM1x1RkYwQ1xuICogIFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjA4XHU2ODRDXHU5NzYyXHU2RTMyXHU2N0QzXHU1QzQyXHU1QkY5IGlucHV0LnJpZ2h0L292ZXJsYXkgXHU2OUZEXHU0RjREXHU0RTBEXHU2M0QwXHU0RjlCXHU4RkQ5XHU0RTlCXHU2ODA3XHU1MUM2IHByb3BzXHVGRjBDXG4gKiAgXHU3RUM0XHU0RUY2XHU0RjlEXHU4RDU2XHU1QjgzXHU0RUVDXHU0RjFBXHU1RDI5XHU1RTc2XHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHUyMDE0XHUyMDE0UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOC9cdTk4ODRcdTg5QzhcdTUzNjFcdTRFMERcdTUzRUZcdTg5QzFcdTc2ODRcdTVCOUVcdTZENEJcdTVCOUFcdThCQkFcdUZGMDlcdTMwMDIgKi9cblxuaW1wb3J0IHtcbiAgY2hlY2tDb25maWcsXG4gIG9wdGltaXplU3RyZWFtLFxuICByZXNvbHZlU2Vzc2lvbk1vZGVsLFxuICBSRVFVRVNUX1RJTUVPVVRfTVMsXG4gIHRvRXJyb3JLaW5kLFxuICB0eXBlIExhbmcsXG4gIHR5cGUgT3B0aW1pemVFcnJvcktpbmQsXG4gIHR5cGUgUHJvbXB0Q29uZmlnLFxufSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5Ib3N0T3B0aW1pemUsIHR5cGUgSG9zdFNlc3Npb25BcGkgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGRpc3BhdGNoUHJldmlldyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG4vKipcbiAqIFx1NUY1M1x1NTI0RCBpbi1mbGlnaHQgXHU4QkY3XHU2QzQyXHU3Njg0XHU2M0E3XHU1MjM2XHU1NjY4XHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjA5XHVGRjFBXG4gKiAtIFx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1NjVGNlx1NEUyRFx1NkI2Mlx1NUI4M1x1RkYwQ1x1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzaG93KCkvZmFpbCgpIFx1NTkwRFx1NkQzQlx1NURGMlx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1RkYxQlxuICogLSBydW5PcHRpbWl6ZSBcdTRFRTVcdTMwMENcdTVCNThcdTU3MjhcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzZcdTU2NjhcdTMwMERcdTRFM0FcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDhcdTU0MENcdTRFMDBcdTY1RjZcdTUyM0JcdTUzRUFcdTUxNDFcdThCQjhcdTRFMDBcdTRFMkFcdThCRjdcdTZDNDJcdTU3MjhcdTkwMTRcdUZGMDlcdTMwMDJcbiAqIFx1NkNFOFx1RkYxQVx1NkEyMVx1NTc1N1x1N0VBN1x1NjEwRlx1NTQ3M1x1Nzc0MFx1NTkxQVx1NEYxQVx1OEJERFx1NTQwQ1x1NjVGNlx1NEYxOFx1NTMxNlx1NEYxQVx1NEU5Mlx1NzZGOFx1OEJBOVx1OERFRlx1MjAxNFx1MjAxNFx1OEY5M1x1NTE2NVx1NjgwRlx1NTM1NVx1NEYxQVx1OEJERFx1ODA1QVx1NzEyNlx1NzY4NFx1NEVBNFx1NEU5Mlx1NEUwQlx1NTNFRlx1NjNBNVx1NTNEN1x1NkI2NFx1N0I4MFx1NTMxNlx1MzAwMlxuICovXG5sZXQgYWN0aXZlQ29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbi8qKiBcdTUxNzNcdTk1RURcdTk4ODRcdTg5QzhcdTUzNjFcdUZGMDhcdTVFNzZcdTRFMkRcdTZCNjJcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVByZXZpZXcoKTogdm9pZCB7XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSB7XG4gICAgYWN0aXZlQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICB9XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdjbG9zZScgfSk7XG59XG5cbi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTJcdUZGMUFcdTkxNERcdTdGNkVcdTdGM0FcdTU5MzEgXHUyMTkyIGd1aWRlXHVGRjFCXHU4MzQ5XHU3QTNGXHU3QTdBIFx1MjE5MiBcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcdUZGMUJcdTVFNzZcdTUzRDEgXHUyMTkyIFx1NEUyMlx1NUYwM1x1RkYxQlx1OEQ4NVx1NjVGNi9cdTUzRDZcdTZEODggXHUyMTkyIHRpbWVvdXQgXHU2MjE2XHU5NzU5XHU5RUQ4ICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuT3B0aW1pemUoY3R4OiB7XG4gIGdldENvbmZpZygpOiBQcm9tcHRDb25maWc7XG4gIGdldExhbmcoKTogTGFuZztcbiAgZ2V0RHJhZnQoKTogc3RyaW5nO1xuICAvKiogXHU4OUUzXHU2NzkwXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4dXNlU2Vzc2lvbk1vZGVsIFx1NUYwMFx1NTQyRlx1NjVGNlx1NEYxOFx1NTE0OFx1RkYwOVx1RkYwQ1x1NEUwRFx1NTNFRlx1NUY5N1x1NjVGNlx1OEZENFx1NTZERSBudWxsXHVGRjA4XHU1NkRFXHU5MDAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjA5ICovXG4gIGdldFNlc3Npb25Nb2RlbD8oKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTc1MjhcdUZGMDlcdUZGMUFcdTRFMzRcdTY1RjZcdTVCRjlcdThCREQgKyBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMENcdTk2RjZcdTkxNERcdTdGNkUgKi9cbiAgaG9zdD86IHtcbiAgICBhcGk6IEhvc3RTZXNzaW9uQXBpO1xuICAgIHBhcmVudFNlc3Npb25JZDogc3RyaW5nO1xuICAgIHNlc3Npb25JZDogc3RyaW5nO1xuICB9O1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjb25maWcgPSBjdHguZ2V0Q29uZmlnKCk7XG4gIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdndWlkZScgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBpZiAoIWRyYWZ0KSByZXR1cm47XG5cbiAgLy8gXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjFBXHU1REYyXHU2NzA5XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHU1MjE5XHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHVGRjA4XHU2MzA5XHU5NEFFIGJ1c3kgXHU2MDAxXHU1REYyXHU3OTgxXHU3NTI4XHU3MEI5XHU1MUZCXHVGRjBDXHU4RkQ5XHU5MUNDXHU2NjJGXHU3QURFXHU2MDAxXHU3Njg0XHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHVGRjA5XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSByZXR1cm47XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdiZWdpbicgfSk7XG5cbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgYWN0aXZlQ29udHJvbGxlciA9IGNvbnRyb2xsZXI7IC8vIFx1NkNFOFx1NTE4Q1x1N0VEOSBjbG9zZVByZXZpZXcoKVx1RkYwQ1x1NEY5Qlx1NTM2MVx1NzI0N1x1NTE3M1x1OTVFRFx1NjVGNlx1NTNENlx1NkQ4OFx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0MlxuICBsZXQgdGltZWRPdXQgPSBmYWxzZTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgY29udHJvbGxlci5hYm9ydCgpO1xuICB9LCBSRVFVRVNUX1RJTUVPVVRfTVMpO1xuXG4gIHRyeSB7XG4gICAgLy8gXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREXHU5MDFBXHU5MDUzXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGF3YWl0IHJ1bkhvc3RPcHRpbWl6ZSh7XG4gICAgICAgIGFwaTogY3R4Lmhvc3QuYXBpLFxuICAgICAgICBwYXJlbnRTZXNzaW9uSWQ6IGN0eC5ob3N0LnBhcmVudFNlc3Npb25JZCxcbiAgICAgICAgc2Vzc2lvbklkOiBjdHguaG9zdC5zZXNzaW9uSWQsXG4gICAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkRlbHRhOiAodGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2RyYWZ0JywgdGV4dCB9KSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSksXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjFBXHU2RDRGXHU4OUM4XHU1NjY4IGZldGNoIFx1NzZGNFx1OEZERVx1ODFFQVx1OTE0RCBBUElcdUZGMDhcdTZENDFcdTVGMEZcdUZGMDlcbiAgICAvLyBcdTZBMjFcdTU3OEJcdTg5RTNcdTY3OTBcdUZGMUF1c2VTZXNzaW9uTW9kZWxcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdTIxOTIgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU0RUM1XHU0RjVDIG1vZGVsIFx1NTQwRFx1NTZERVx1OTAwMFx1NEY3Rlx1NzUyOFx1RkYwOVx1RkYxQlx1NTQyNlx1NTIxOSBcdTIxOTIgXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXG4gICAgbGV0IG1vZGVsID0gY29uZmlnLm1vZGVsO1xuICAgIGlmIChjb25maWcudXNlU2Vzc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBzZXNzaW9uTW9kZWwgPSBhd2FpdCBjdHguZ2V0U2Vzc2lvbk1vZGVsPy4oKTtcbiAgICAgIGlmIChzZXNzaW9uTW9kZWwpIG1vZGVsID0gc2Vzc2lvbk1vZGVsO1xuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAgIC8vIFx1NUM1NVx1NzkzQVx1N0QyRlx1NzlFRlx1RkYxQVx1NkI2M1x1NjU4N1x1NEYxOFx1NTE0OFx1RkYxQlx1NkI2M1x1NjU4N1x1NUMxQVx1NjcyQVx1NTFGQVx1NzNCMFx1RkYwOHY0IFx1N0NGQlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNVx1NjNBOFx1NzQwNlx1RkYwOVx1NjVGNlx1NUM1NVx1NzkzQVx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwQ1x1OEJBOVx1NkQ0MVx1NUYwRlx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgIGxldCByZWFzb25pbmcgPSAnJztcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzaG93biA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcHRpbWl6ZVN0cmVhbSh7XG4gICAgICAgIGNvbmZpZzogZWZmZWN0aXZlLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgY29udGVudCArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFzb25pbmcgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0OiBzaG93biB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gXHU1MTQ4XHU1MjI0XHU1QjlBXHU0RTJEXHU2QjYyXHVGRjFBXHU3NTI4XHU2MjM3L1x1N0VDNFx1NEVGNlx1NTNENlx1NkQ4OFx1NEUwRVx1OEQ4NVx1NjVGNlx1OTBGRFx1ODg2OFx1NzNCMFx1NEUzQSBBYm9ydEVycm9yXHVGRjFCXHU0RUM1XHU4RDg1XHU2NUY2XHU1MTk5XHU1MTY1XHU5NTE5XHU4QkVGXHU2MDAxXG4gICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBcdTk4NzZcdTVDNDJcdTUxNUNcdTVFOTVcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTMgcmVqZWN0IFx1NURGMlx1ODhBQiAudGhlbiBcdTZEODhcdTUzMTZcdUZGMUJcdTZCNjRcdTU5MDRcdTRGRERcdTYyQTQgZmV0Y2ggXHU1MjA2XHU2NTJGXHU0RUU1XHU1OTE2XHU3Njg0XHU2MTBGXHU1OTE2XHU1RjAyXHU1RTM4XHVGRjA5XG4gICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhY3RpdmVDb250cm9sbGVyID09PSBjb250cm9sbGVyKSBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG59IiwgIi8qKiBcdThGOTNcdTUxNjVcdTUzM0FcdTZENkVcdTVDNDJcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcdUZGMUFndWlkZSAvIG9wdGltaXppbmcgLyBwcmV2aWV3IC8gZXJyb3IgXHU1NkRCXHU3OUNEXHU1MTg1XHU1QkI5XHU2MDAxXG4gKiAgXHU3MkI2XHU2MDAxXHU2NzY1XHU4MUVBXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wcyAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSwgY2xvc2VQcmV2aWV3IH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZ2V0UHJldmlld0J1c1N0YXRlLCBzdWJzY3JpYmVQcmV2aWV3QnVzIH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld0NhcmRQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgb3BlblNldHRpbmdzOiAoKSA9PiB2b2lkO1xuICBnZXRTZXNzaW9uTW9kZWw/OiAoKSA9PiBQcm9taXNlPHN0cmluZyB8IG51bGw+O1xuICBnZXRIb3N0PzogKCkgPT4geyBhcGk6IHVua25vd247IHBhcmVudFNlc3Npb25JZDogc3RyaW5nOyBzZXNzaW9uSWQ6IHN0cmluZyB9IHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2NhcmQuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWNhcmQge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDEycHg7XG4gIHJpZ2h0OiAxMnB4O1xuICBib3R0b206IGNhbGMoMTAwJSArIDhweCk7XG4gIHotaW5kZXg6IDQwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctb3ZlcmxheSwgI2ZmZik7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsIHJnYmEoMTI4LDEyOCwxMjgsMC4zKSk7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIGJveC1zaGFkb3c6IDAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjE2KTtcbiAgcGFkZGluZzogMTJweCAxNHB4O1xuICBtYXgtaGVpZ2h0OiAzMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4uZHNoLXBvLWNhcmQtaGVhZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuLmRzaC1wby1jYXJkLWJvZHkge1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzQ0NCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDEuNjtcbiAgbWF4LWhlaWdodDogMjAwcHg7XG59XG4uZHNoLXBvLWNhcmQtZXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLmRzaC1wby1jYXJkLXJvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBmbGV4LXdyYXA6IHdyYXA7XG59XG4uZHNoLXBvLWNhcmQtYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMHB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbn1cbi5kc2gtcG8tY2FyZC1idG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQS0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnkgXHU1NzI4XHU2REYxXHU1OTFDXHU2QTIxXHU1RjBGXHU4OUUzXHU2NzkwXHU0RTNBXHU2RDQ1XHU4MjcyIFx1MjE5MiBcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTRFMERcdTUzRUZcdThCRkJcdUZGMDhcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDkgKi9cbiAgY29sb3I6ICNmZmY7XG4gIGJhY2tncm91bmQ6ICMxNjc3ZmY7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuLyoqIFx1NjI3RSBjb21wb3NlciBcdThGOTNcdTUxNjVcdTY4NDZcdUZGMUFcdTRGMThcdTUxNDhcdTcxMjZcdTcwQjlcdUZGMENcdTU0MjZcdTUyMTlcdTdCMkNcdTRFMDBcdTRFMkFcdTk3NUUgZGlzYWJsZWQgdGV4dGFyZWEgKi9cbmZ1bmN0aW9uIGZpbmRDb21wb3NlcigpOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50ICYmICFhY3RpdmUuZGlzYWJsZWQpIHJldHVybiBhY3RpdmU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKCF0YS5kaXNhYmxlZCkgcmV0dXJuIHRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkQ29tcG9zZXJUZXh0KCk6IHN0cmluZyB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIHJldHVybiB0YSA/IHRhLnZhbHVlIDogJyc7XG59XG5cbi8qKiBcdTc1MjhcdTUzOUZcdTc1MUYgdmFsdWUgc2V0dGVyIFx1NTE5OVx1NTZERVx1RkYwQ1x1OEJBOSBSZWFjdCBcdTUzRDdcdTYzQTdcdTdFQzRcdTRFRjZcdTYxMUZcdTc3RTVcdUZGMDhcdTUxOERcdTZEM0VcdTUzRDEgaW5wdXQgXHU0RThCXHU0RUY2XHU4OUU2XHU1M0QxIG9uQ2hhbmdlXHVGRjA5ICovXG5mdW5jdGlvbiB3cml0ZUNvbXBvc2VyVGV4dCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgdGEgPSBmaW5kQ29tcG9zZXIoKTtcbiAgaWYgKCF0YSkgcmV0dXJuO1xuICBjb25zdCBzZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxUZXh0QXJlYUVsZW1lbnQucHJvdG90eXBlLCAndmFsdWUnKT8uc2V0O1xuICBpZiAoc2V0dGVyKSB7XG4gICAgc2V0dGVyLmNhbGwodGEsIHRleHQpO1xuICB9IGVsc2Uge1xuICAgIHRhLnZhbHVlID0gdGV4dDtcbiAgfVxuICB0YS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICB0YS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBlcnJvcktleShraW5kOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHtcbiAgc3dpdGNoIChraW5kKSB7XG4gICAgLy8ga2luZCBcdTIxOTIgbG9jYWxlIGtleVx1RkYxQidjb25maWcnIFx1NTcyOCBVSSBcdTRFMEFcdTRFMERcdTUzRUZcdThGQkVcdUZGMDhydW5PcHRpbWl6ZSBcdTUxNDhcdThENzAgZ3VpZGVcdUZGMDlcdUZGMENBYm9ydEVycm9yXHUyMTkydGltZW91dCBcdTc1MzEgcnVuT3B0aW1pemUgXHU1MTQ4XHU4ODRDXHU2MkU2XHU2MjJBXHVGRjBDXHU0RkREXHU3NTU5XHU1M0NDXHU0RkREXHU5NjY5XG4gICAgY2FzZSAndW5hdXRob3JpemVkJzogY2FzZSAnZm9yYmlkZGVuJzogY2FzZSAndGltZW91dCc6IGNhc2UgJ25ldHdvcmsnOiBjYXNlICdjb3JzJzogY2FzZSAnaHR0cCc6IGNhc2UgJ2JhZC1yZXNwb25zZSc6IGNhc2UgJ2VtcHR5JzogY2FzZSAnY29uZmlnJzpcbiAgICAgIHJldHVybiBgZXJyb3IuJHtraW5kfWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnZXJyb3IubmV0d29yayc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByZXZpZXdDYXJkKHByb3BzOiBQcmV2aWV3Q2FyZFByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBvcGVuU2V0dGluZ3MsIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRTdGF0ZShnZXRQcmV2aWV3QnVzU3RhdGUoKSkpLFxuICAgIFtdLFxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHsgc3RhdHVzLCByZXN1bHQsIGVycm9yS2luZCB9ID0gc3RhdGU7XG4gIGNvbnN0IFtjb3BpZWQsIHNldENvcGllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNvcHlUaW1lclJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICBpZiAoc3RhdHVzID09PSAnaWRsZScpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHJldHJ5ID0gKCkgPT4ge1xuICAgIHZvaWQgcnVuT3B0aW1pemUoeyBnZXRDb25maWcsIGdldExhbmcsIGdldERyYWZ0OiAoKSA9PiByZWFkQ29tcG9zZXJUZXh0KCksIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCB9KTtcbiAgfTtcblxuICBjb25zdCByZXBsYWNlID0gKCkgPT4ge1xuICAgIHdyaXRlQ29tcG9zZXJUZXh0KHJlc3VsdCk7XG4gICAgY2xvc2VQcmV2aWV3KCk7XG4gIH07XG5cbiAgY29uc3QgY29weSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIHJldHVybjsgLy8gXHU5NzVFXHU1Qjg5XHU1MTY4XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4aHR0cCBcdTdCNDlcdUZGMDlcdUZGMUFcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjBDXHU0RkREXHU2MzAxXHU1M0VGXHU5MUNEXHU4QkQ1XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHJlc3VsdCk7XG4gICAgICBpZiAoIW1vdW50ZWRSZWYuY3VycmVudCkgcmV0dXJuOyAvLyBhd2FpdCBcdTY3MUZcdTk1RjRcdTdFQzRcdTRFRjZcdTVERjJcdTUzNzhcdThGN0RcdUZGMUFcdTRFMERcdTUxOEQgc2V0U3RhdGVcbiAgICAgIHNldENvcGllZCh0cnVlKTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRDb3BpZWQoZmFsc2UpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAxMjAwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTE5OVx1NTE2NVx1NTkzMVx1OEQyNVx1RkYxQVx1OTc1OVx1OUVEOFx1RkYwOFx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMDlcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1oZWFkXCI+XG4gICAgICAgIDxzcGFuPnt0KCdjYXJkLnRpdGxlJyl9PC9zcGFuPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgXHUyNzE1XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtzdGF0dXMgPT09ICdndWlkZScgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS50aXRsZScpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS5kZXNjJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17KCkgPT4geyBjbG9zZVByZXZpZXcoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdvcHRpbWl6aW5nJyAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPlxuICAgICAgICAgIHtzdGF0ZS5kcmFmdCA/IDxzcGFuIHN0eWxlPXt7IHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcgfX0+e3N0YXRlLmRyYWZ0fTwvc3Bhbj4gOiB0KCdjYXJkLm9wdGltaXppbmcnKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAncHJldmlldycgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPntyZXN1bHR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmVwbGFjZX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJlcGxhY2UnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gdm9pZCBjb3B5KCl9PlxuICAgICAgICAgICAgICB7Y29waWVkID8gdCgnY2FyZC5jb3B5RG9uZScpIDogdCgnY2FyZC5jb3B5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnZXJyb3InICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyclwiPnt0KGVycm9yS2V5KGVycm9yS2luZCkpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSIsICIvKiogXHU4QkJFXHU3RjZFIFx1MjE5MiBHZW5lcmFsIFx1NTMzQVx1MzAwQ1Byb21wdCBcdTRGMThcdTUzMTZcdTMwMERcdThCQkVcdTdGNkVcdTg4NENcdUZGMUFcdTY4MDdcdTk4OThcdTY0NThcdTg5ODEgKyBcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1TdGF0ZSwgU2V0dGluZ3NGb3JtVmFsdWVzIH0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtQWN0aW9ucyB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHsgb25PcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUm93UHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFNldHRpbmdzRm9ybVN0YXRlKSA9PiBUKSA9PiBUO1xuICBhY3Rpb25zOiBTZXR0aW5nc0Zvcm1BY3Rpb25zO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgc2F2ZUNvbmZpZzogKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiBQcm9taXNlPHZvaWQ+O1xuICByZXNldENvbmZpZzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0RXBvY2g6ICgpID0+IG51bWJlcjtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL3NldHRpbmdzLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLm9wdGlTZXR0aW5ncyB7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgcGFkZGluZzogMTZweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5vcHRpU2V0dGluZ3NUaXRsZSB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDIycHg7XG59XG4ub3B0aVNldHRpbmdzSGludCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzRm9ybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzRmllbGQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NMYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0lucHV0IHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ub3B0aVNldHRpbmdzUm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG4ub3B0aVNldHRpbmdzQnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMnB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQVx1NEUzQlx1OTg5OFx1NTNEOFx1OTFDRlx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1NEYxQVx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NS9cdTZERjFcdTY3ODFcdTdBRUZcdTgyNzJcdUZGMDhcdTlFRDFcdTVFOTVcdTlFRDFcdTVCNTdcdTMwMDFcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTU3NDdcdTg4QUJcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDlcdUZGMENcbiAgICAgXHU1NkZBXHU1QjlBXHU1NEMxXHU3MjRDXHU4NEREICsgXHU3NjdEXHU1QjU3XHU0RkREXHU4QkMxXHU0RUZCXHU0RjU1XHU0RTNCXHU5ODk4XHU1M0VGXHU4QkZCICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuLm9wdGlTZXR0aW5nc0VyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2V0dGluZ3NSb3cocHJvcHM6IFNldHRpbmdzUm93UHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBzYXZlQ29uZmlnLCByZXNldENvbmZpZywgZ2V0RXBvY2ggfSA9IHByb3BzO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIGdldEVwb2NoKCksXG4gICAgKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIH0sIFtjb25maWcuYmFzZVVybCwgY29uZmlnLmFwaUtleSwgY29uZmlnLm1vZGVsLCBnZXRFcG9jaF0pO1xuXG4gIC8vIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1RkYwOFx1OTg4NFx1ODlDOFx1NTM2MVx1NjcyQVx1OTE0RFx1N0Y2RVx1NUYxNVx1NUJGQ1x1RkYwOVx1MjE5MiBcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3BlblNldHRpbmdzUmVxdWVzdCgoKSA9PiBzZXRFeHBhbmRlZCh0cnVlKSksIFtdKTtcblxuICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIGNvbnN0IGVycm9ycyA9IGFjdGlvbnMudmFsaWRhdGUodmFsdWVzKTtcbiAgICBpZiAoZXJyb3JzKSB7XG4gICAgICBhY3Rpb25zLmZhaWwoT2JqZWN0LnZhbHVlcyhlcnJvcnMpWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNhdmVDb25maWcodmFsdWVzKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgICAvLyBcdTRFMEVcdTY1NDhcdTVFOTRcdTU2REVcdThERDFcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTdFQUFcdTUxNDNcdUZGMDlcdTVCRjlcdTlGNTBcdUZGMENcdTRGN0ZcdTRGRERcdTVCNThcdTU0MEVcdTc2ODRcdTkxQ0RcdTY0QURcdTc5Q0RcdTg4QUJcdTYyOTFcdTUyMzZcbiAgICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5zYXZlRmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZXNldENvbmZpZygpO1xuICAgICAgYWN0aW9ucy5zZWVkKFxuICAgICAgICB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfSxcbiAgICAgICAgc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSxcbiAgICAgICk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5yZXNldEZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KCdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJyl9PC9zcGFuPn1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7ZXhwYW5kZWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0Zvcm1cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICBjaGVja2VkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCd1c2VTZXNzaW9uTW9kZWwnLCBlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgLz57JyAnfVxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJyl9XG4gICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50Jyl9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2Jhc2VVcmwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWFwaS1rZXlcIj57dCgnc2V0dGluZ3MuYXBpS2V5Jyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYXBpLWtleVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5hcGlLZXl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwic2stXHUyMDI2XCJcbiAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAnXHUyMDE0JyA6IERFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ21vZGVsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1Jvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuIHByaW1hcnlcIiBvbkNsaWNrPXtoYW5kbGVTYXZlfT5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnNhdmUnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuXCIgb25DbGljaz17aGFuZGxlUmVzZXR9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MucmVzZXQnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAge3NhdmVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3Muc2F2ZWQnKX08L3NwYW4+fVxuICAgICAgICAgICAge3JwY0Vycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPntycGNFcnJvcn08L3NwYW4+fVxuICAgICAgICAgICAgeyFycGNFcnJvciAmJiBlcnJvciAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NFcnJcIj57dChlcnJvcil9PC9zcGFuPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuZGVzYycpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOVx1RkYxQVx1ODM0OVx1N0EzRiArIFx1NjgyMVx1OUE4QyArIFx1NEZERFx1NUI1OFx1NTJBOFx1NEY1QyAqL1xuXG5pbXBvcnQgeyBkZWZpbmVTdG9yZSB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB7XG4gIElOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgcmVkdWNlU2V0dGluZ3NGb3JtLFxuICB2YWxpZGF0ZVNldHRpbmdzRm9ybSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1TdGF0ZSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1WYWx1ZXMsXG59IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtQWN0aW9ucyB7XG4gIHNlZWQodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBlZGl0KGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBjb21taXQocmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGZhaWwobWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbiAgLyoqIFx1NEZERFx1NUI1OFx1NTI0RFx1NjgyMVx1OUE4Q1x1RkYxQlx1OEZENFx1NTZERVx1OTUxOVx1OEJFRlx1NUI1N1x1NTE3OFx1RkYxQlx1NjVFMFx1OTUxOVx1OEJFRlx1NjVGNlx1OEZENFx1NTZERSBudWxsICovXG4gIHZhbGlkYXRlKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw7XG59XG5cbi8qKiBkZWZpbmVTdG9yZSBcdThGRDRcdTU2REVcdTc2ODQgc3RvcmUgXHU1M0U1XHU2N0M0XHVGRjA4XHU1NDBDXHU2NUY2XHU1M0VGXHU0RjVDXHU3QzdCXHU1NzhCXHU1MzYwXHU0RjREXHVGRjBDXHU0RjlCXHU2Q0U4XHU1MThDXHU2NUY2IGBzdG9yZTpgIFx1NEY3Rlx1NzUyOFx1RkYwOSAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSB7XG4gIC8vIFx1OEZEMFx1ODg0Q1x1NjVGNlx1NUY2Mlx1NzJCNlx1NzUzMSBEU0ggXHU2M0QwXHU0RjlCXHVGRjFCXHU2QjY0XHU1OTA0XHU0RUM1XHU0RTNBXHU2NTg3XHU2ODYzXHU2MDI3XHU3QzdCXHU1NzhCXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSA9ICgpOiBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSA9PiB7XG4gIGNvbnN0IGhhbmRsZSA9IGRlZmluZVN0b3JlKHtcbiAgICBpbml0OiAoKTogU2V0dGluZ3NGb3JtU3RhdGUgPT4gKHtcbiAgICAgIC8vIFx1NkJDRlx1NUI5RVx1NEY4Qlx1NTI2Rlx1NjcyQ1x1RkYxQUlOSVRJQUxfU0VUVElOR1NfRk9STSBcdTY2MkZcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMENcdTUyRkZcdThERThcdTVCOUVcdTRGOEJcdTUxNzFcdTRFQUJcdTVGMTVcdTc1MjhcdUZGMDhyZWR1Y2VyIFx1NzY4NCBkcmFmdCBcdTUxOTlcdTUxNjVcdTk3MDBcdTUzRDdcdTRGRERcdTYyQTRcdUZGMDlcbiAgICAgIC4uLklOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgICAgIHZhbHVlczogeyAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0udmFsdWVzIH0sXG4gICAgfSksXG4gICAgYWN0aW9uczoge1xuICAgICAgc2VlZDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnc2VlZCcsIHZhbHVlcywgcmV2aXNpb24gfSkpLFxuICAgICAgZWRpdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdlZGl0JywgZmllbGQsIHZhbHVlIH0pKSxcbiAgICAgIGNvbW1pdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdjb21taXQnLCByZXZpc2lvbiB9KSksXG4gICAgICBmYWlsOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIG1lc3NhZ2U6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZmFpbCcsIG1lc3NhZ2UgfSkpLFxuICAgICAgdmFsaWRhdGU6IChfZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlcnJvcnMpLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBlcnJvcnM7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTVcdTY4MjFcdTlBOEMgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtVmFsdWVzIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMUFcdTRGMThcdTUzMTZcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOCBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCB1cmwgPSB2YWx1ZXMuYmFzZVVybC50cmltKCk7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG4gICAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgICB9XG4gIH1cblxuICBpZiAoIXZhbHVlcy5hcGlLZXkudHJpbSgpKSBlcnJvcnMuYXBpS2V5ID0gJ3NldHRpbmdzLmFwaUtleSc7XG4gIGlmICghdmFsdWVzLnVzZVNlc3Npb25Nb2RlbCAmJiAhdmFsdWVzLm1vZGVsLnRyaW0oKSkgZXJyb3JzLm1vZGVsID0gJ3NldHRpbmdzLm1vZGVsJztcblxuICByZXR1cm4gZXJyb3JzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7XG4gIGRpcnR5OiBib29sZWFuO1xuICBzYXZlZDogYm9vbGVhbjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHJldmlzaW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBJTklUSUFMX1NFVFRJTkdTX0ZPUk06IFNldHRpbmdzRm9ybVN0YXRlID0ge1xuICB2YWx1ZXM6IHsgYmFzZVVybDogJycsIGFwaUtleTogJycsIG1vZGVsOiAnJywgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlIH0sXG4gIGRpcnR5OiBmYWxzZSxcbiAgc2F2ZWQ6IGZhbHNlLFxuICBlcnJvcjogbnVsbCxcbiAgcmV2aXNpb246IC0xLFxufTtcblxuZXhwb3J0IHR5cGUgU2V0dGluZ3NGb3JtQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdzZWVkJzsgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2VkaXQnOyBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzOyB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB9XG4gIHwgeyB0eXBlOiAnY29tbWl0JzsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlU2V0dGluZ3NGb3JtKHN0YXRlOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgYWN0aW9uOiBTZXR0aW5nc0Zvcm1BY3Rpb24pOiBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzZWVkJzpcbiAgICAgIHJldHVybiBhY3Rpb24ucmV2aXNpb24gPD0gc3RhdGUucmV2aXNpb25cbiAgICAgICAgPyBzdGF0ZVxuICAgICAgICA6IHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5hY3Rpb24udmFsdWVzIH0sIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5zdGF0ZS52YWx1ZXMsIFthY3Rpb24uZmllbGRdOiBhY3Rpb24udmFsdWUgfSwgZGlydHk6IHRydWUsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgICBjYXNlICdjb21taXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IHRydWUsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZXJyb3I6IGFjdGlvbi5tZXNzYWdlIH07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNVTyxJQUFNLFdBQXlCO0FBQUEsRUFDcEMsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsaUJBQWlCO0FBQ25CO0FBSU8sU0FBUyxpQkFBaUIsS0FBcUI7QUFDcEQsU0FBTyxJQUFJLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0QztBQUVPLFNBQVMsWUFBWSxLQUE2RDtBQUN2RixRQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksWUFBWSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksU0FBUztBQUN2RyxRQUFNLFNBQVMsT0FBTyxLQUFLLFdB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ZCxZQUFNLElBQUksTUFBTSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLLENBQUM7QUFBQSxJQUN4RTtBQUFBLEVBQ0Y7QUFFQSxNQUFJLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVO0FBQy9CLFVBQU0sTUFBTTtBQUFBLE1BQU87QUFBQSxNQUF5QixNQUMxQyxNQUFNLE1BQU07QUFBQSxRQUNWO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixJQUFJO0FBQUEsVUFDSixPQUFPO0FBQUEsVUFDUCxRQUFRO0FBQUEsVUFDUixPQUFPO0FBQUEsVUFDUCxRQUFRLE9BQU87QUFBQSxZQUNiLFdBQVcsTUFBTTtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
