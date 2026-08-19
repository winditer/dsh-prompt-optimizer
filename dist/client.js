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
var DEFAULT_INTERVAL_MS = 250;
var DEFAULT_TIMEOUT_MS = 12e4;
var DEFAULT_RPC_TIMEOUT_MS = 5e3;
function callRpc(rpc, endpoint, payload, ms) {
  return withTimeout(
    rpc.call(endpoint, payload),
    ms,
    endpoint
  );
}
async function resolveHostSessionModel(rpc, rpcTimeoutMs = DEFAULT_RPC_TIMEOUT_MS) {
  const res = await callRpc(rpc, "sessionModel", {}, rpcTimeoutMs);
  if (!res.ok || !res.value || typeof res.value !== "object") return null;
  const v = res.value;
  if (typeof v.provider !== "string" || typeof v.model !== "string") return null;
  const info = { provider: v.provider, model: v.model };
  if (typeof res.value.reasoningEffort === "string") {
    info.reasoningEffort = res.value.reasoningEffort;
  }
  return info;
}
async function runHostOptimize(opts) {
  const { rpc, lang: _lang, text, system, signal, onDelta } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error("aborted");
  const session = await resolveHostSessionModel(rpc, rpcTimeoutMs);
  if (!session) throw new Error("host-unavailable");
  const startedPayload = {
    provider: session.provider,
    model: session.model,
    text,
    system
  };
  if (session.reasoningEffort) startedPayload.reasoningEffort = session.reasoningEffort;
  const start = await callRpc(rpc, "optimize.start", startedPayload, rpcTimeoutMs);
  if (!start.ok || !start.value || typeof start.value.taskId !== "string") {
    throw new Error("host-start-rejected");
  }
  const taskId = start.value.taskId;
  const startedAt = Date.now();
  let last = "";
  try {
    for (; ; ) {
      if (signal.aborted) {
        try {
          await rpc.call("optimize.abort", { taskId });
        } catch {
        }
        throw new Error("aborted");
      }
      if (Date.now() - startedAt > timeoutMs) {
        try {
          await rpc.call("optimize.abort", { taskId });
        } catch {
        }
        throw new Error("timeout");
      }
      let poll = null;
      try {
        const res = await callRpc(
          rpc,
          "optimize.poll",
          { taskId },
          rpcTimeoutMs
        );
        if (res.ok && res.value) poll = res.value;
      } catch {
      }
      if (poll) {
        if (poll.error) throw new Error(poll.error);
        const textNow = poll.text ?? "";
        if (textNow !== last) {
          onDelta(textNow);
          last = textNow;
        }
        if (poll.done) return textNow;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } finally {
    try {
      await rpc.call("optimize.abort", { taskId });
    } catch {
    }
  }
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
        rpc: ctx.host.rpc,
        lang: ctx.getLang(),
        text: draft,
        system: buildSystemPrompt(ctx.getLang()),
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
      if (sessionModel && sessionModel.model) model = sessionModel.model;
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
  const hostRpc = {
    call: (endpoint, payload) => ctx.connection.rpc.call("/dsh-prompt-optimizer", endpoint, payload ?? {})
  };
  const getHost = () => ({ rpc: hostRpc });
  const getSessionModel = async () => {
    try {
      const res = await withTimeout(
        ctx.connection.rpc.call("/dsh-prompt-optimizer", "sessionModel", {}),
        5e3,
        "sessionModel"
      );
      if (res.ok && res.value && typeof res.value === "object") {
        const v = res.value;
        if (typeof v.provider === "string" && typeof v.model === "string") {
          return { provider: v.provider, model: v.model };
        }
      }
      return null;
    } catch {
      return null;
    }
  };
  const getSessionId = () => getActiveSession();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB0eXBlIHsgSG9zdFJwYyB9IGZyb20gJy4vc2Vzc2lvbi1vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgd2l0aFRpbWVvdXQgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIC8vIDIuNiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDhcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEIgKyBzZXJ2ZXIgXHU1MzRBIGxsbS5zdHJlYW1cdUZGMENcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdUZGMUFcbiAgLy8gXHU5MDFBXHU5MDUzXHU1MzczXHU4MUVBXHU2NzA5IFJQQ1x1RkYwOC9kc2gtcHJvbXB0LW9wdGltaXplclx1RkYwOVx1RkYxQnNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCBcdTUzRDZcdTVGNTNcdTUyNERcbiAgLy8gXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDAxbGxtLnN0cmVhbSBcdTc3MUZcdTZENDFcdTVGMEZcdUZGMDhcdTUzRDZcdTgxRUEgZHNoLWVsZiBcdTVERjJcdTlBOENcdThCQzFcdTc2ODRcdTVCQkZcdTRFM0JcdTY3MERcdTUyQTFcdTk3NjJcdUZGMDlcdTMwMDJcdTRFMERcdTc1Mjggc2Vzc2lvbi5jcmVhdGUvXG4gIC8vIGZvcmtcdUZGMUFcdTU0MEVcdTUzRjBcdTRGMUFcdThCRERcdTRFMERcdTU3MjhcdTUyNERcdTUzRjBcdTRFMERcdTg5RTZcdTUzRDFcdTZBMjFcdTU3OEJcdTYyNjdcdTg4NENcdUZGMENcdTgxRUFcdTdGMTYgaWQgXHU4OEFCXHU5NzU5XHU5RUQ4XHU2MkQyXHU3RUREIFx1MjE5MiBcdTMwMENcdTZDMzhcdThGRENcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTMwMERcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgY29uc3QgaG9zdFJwYzogSG9zdFJwYyA9IHtcbiAgICBjYWxsOiAoZW5kcG9pbnQsIHBheWxvYWQpID0+XG4gICAgICBjdHguY29ubmVjdGlvbi5ycGMuY2FsbCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyJywgZW5kcG9pbnQsIHBheWxvYWQgPz8ge30pLFxuICB9O1xuICBjb25zdCBnZXRIb3N0ID0gKCk6IHsgcnBjOiBIb3N0UnBjIH0gPT4gKHsgcnBjOiBob3N0UnBjIH0pO1xuICBjb25zdCBnZXRTZXNzaW9uTW9kZWwgPSBhc3luYyAoKTogUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgICAgIGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCAnc2Vzc2lvbk1vZGVsJywge30pLFxuICAgICAgICA1MDAwLFxuICAgICAgICAnc2Vzc2lvbk1vZGVsJyxcbiAgICAgICk7XG4gICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSAmJiB0eXBlb2YgcmVzLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCB2ID0gcmVzLnZhbHVlIGFzIHsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nIH07XG4gICAgICAgIGlmICh0eXBlb2Ygdi5wcm92aWRlciA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHYubW9kZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHsgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuNWIgXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU0RjFBXHU4QkREXHU3RUQxXHU1QjlBXHVGRjFBXHU1MzYxXHU3MjQ3XHU1M0VBXHU1NzI4XHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHU2NjNFXHU3OTNBXHVGRjA4XHU1MjA3XHU4RDcwXHU0RTBEXHU4RERGXHU5NjhGXHVGRjA5XG4gIGNvbnN0IGdldFNlc3Npb25JZCA9ICgpOiBzdHJpbmcgfCBudWxsID0+IGdldEFjdGl2ZVNlc3Npb24oKTtcblxuICAvLyAzLiBcdThCRURcdThBMDBcdTk1NUNcdTUwQ0ZcbiAgbGV0IGxhbmc6IExhbmcgPSBsYW5nT2YoY3R4LmxvY2FsZS5nZXRMb2NhbGUoKS5hY3RpdmUpO1xuICBjdHgub24oJ2xvY2FsZS9jaGFuZ2UnLCAoc25hcDogeyBhY3RpdmU6IHN0cmluZyB9KSA9PiB7XG4gICAgbGFuZyA9IGxhbmdPZihzbmFwLmFjdGl2ZSk7XG4gIH0pO1xuXG4gIC8vIDQuIFx1NEYxQVx1OEJERFx1NjlGRFx1NEY0RFx1RkYxQVx1NjMwOVx1OTRBRSArIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1xuICBjdHguaW5qZWN0KFsnc2xvdHMnLCAnc2Vzc2lvbnMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItYnV0dG9uJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICAgIGdldEhvc3QsXG4gICAgICAgICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE9wdGltaXplQnV0dG9uLFxuICAgICAgKSxcbiAgICApO1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1jYXJkJyxcbiAgICAgICAgICBvcmRlcjogMTAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBvcGVuU2V0dGluZ3M6ICgpID0+IGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCksXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBQcmV2aWV3Q2FyZCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNi4gXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjA4cm9vdCBcdTRGNUNcdTc1MjhcdTU3REZcdUZGMDlcbiAgY29uc3Qgc2V0dGluZ3NTdG9yZSA9IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlKCk7XG4gIGNvbnN0IHNhdmVDb25maWcgPSBhc3luYyAocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBtZXJnZWQgPSBtZXJnZUNvbmZpZyh7IC4uLmNvbmZpZ01pcnJvciwgLi4ucmF3IH0pO1xuICAgIGNvbnN0IHdyaXR0ZW46IFByb21wdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVcmw6IG1lcmdlZC5iYXNlVXJsLFxuICAgICAgYXBpS2V5OiBtZXJnZWQuYXBpS2V5LnRyaW0oKSxcbiAgICAgIG1vZGVsOiBtZXJnZWQubW9kZWwsXG4gICAgICB1c2VTZXNzaW9uTW9kZWw6IG1lcmdlZC51c2VTZXNzaW9uTW9kZWwsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiB3cml0dGVuLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiB3cml0dGVuLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogd3JpdHRlbi5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHdyaXR0ZW4udXNlU2Vzc2lvbk1vZGVsLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlc2V0Q29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0Jywge1xuICAgICAgICBwYXRjaDoge1xuICAgICAgICAgIGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IERFRkFVTFRTLm1vZGVsLFxuICAgICAgICAgIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuXG4gIGN0eC5pbmplY3QoWydzbG90cyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1zZXR0aW5ncycsXG4gICAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IHNldHRpbmdzU3RvcmUsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBzYXZlQ29uZmlnLFxuICAgICAgICAgICAgcmVzZXRDb25maWcsXG4gICAgICAgICAgICBnZXRFcG9jaDogKCkgPT4gY29uZmlnRXBvY2gsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFNldHRpbmdzUm93LFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA3LiBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMUFBbHQrT1x1RkYwOFx1NzEyNlx1NzBCOVx1NTcyOCB0ZXh0YXJlYSBcdTUxODVcdTY1RjZcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdUZGMDlcbiAgY29uc3Qgb25LZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoIWUuYWx0S2V5IHx8IGUuY29kZSAhPT0gJ0tleU8nKSByZXR1cm47XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIGlmICghKGVsIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZW1pdE9wdGltaXplUmVxdWVzdCgpO1xuICB9O1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKTtcbn1cblxuLy8gXHU1RjE1XHU3NTI4XHU1Qjg4XHU1MzZCXHVGRjFBXHU5MDdGXHU1MTREIHRyZWUtc2hha2UgXHU2Mzg5XHU3QzdCXHU1NzhCXHVGRjA4XHU0RUM1XHU2NTg3XHU2ODYzXHU2MDI3XHVGRjFCXHU2NUUwXHU4RkQwXHU4ODRDXHU2NUY2XHU4ODRDXHU0RTNBXHVGRjA5XG5leHBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfTsiLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTY4MzhcdTVGQzNcdUZGMUFcdTkxNERcdTdGNkVcdTY4MjFcdTlBOENcdTMwMDFPcGVuQUkgXHU1MTdDXHU1QkI5XHU4QzAzXHU3NTI4XHUzMDAxXHU3RUQzXHU2NzlDXHU2M0QwXHU1M0Q2IFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTk2RjYgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb21wdENvbmZpZyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIC8qKiB0cnVlXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjFCZmFsc2VcdUZGMUFcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWwgKi9cbiAgdXNlU2Vzc2lvbk1vZGVsOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstdjQtZmxhc2gnLFxuICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIC8vIFx1NjVFN1x1OUVEOFx1OEJBNFx1OEZDMVx1NzlGQlx1RkYxQVx1OUVEOFx1OEJBNCBiYXNlVXJsIFx1NEUwQlx1NkI4Qlx1NzU1OVx1NzY4NCBkZWVwc2Vlay1jaGF0XHVGRjA4djEgXHU5RUQ4XHU4QkE0XHVGRjA5XHU4OUM2XHU0RTNBXHU2NzJBXHU4QkJFXHU3RjZFXHVGRjBDXHU4NDNEXHU1MjMwXHU2NUIwXHU5RUQ4XHU4QkE0IGRlZXBzZWVrLXY0LWZsYXNoXHVGRjFCXG4gIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1OEZDNyBiYXNlVXJsXHVGRjA4XHU2NjNFXHU1RjBGXHU5MDA5XHU2MkU5XHVGRjA5XHU1MjE5XHU0RkREXHU3NTU5XHU1MzlGXHU2QTIxXHU1NzhCXHU1NDBEXG4gIGNvbnN0IHJhd01vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIGNvbnN0IG1pZ3JhdGVkRGVmYXVsdCA9XG4gICAgcmF3TW9kZWwgPT09ICdkZWVwc2Vlay1jaGF0JyAmJiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpID09PSBERUZBVUxUUy5iYXNlVXJsID8gREVGQVVMVFMubW9kZWwgOiByYXdNb2RlbDtcbiAgY29uc3QgbW9kZWwgPSBtaWdyYXRlZERlZmF1bHQ7XG4gIGNvbnN0IHVzZVNlc3Npb25Nb2RlbCA9IHR5cGVvZiByYXc/LnVzZVNlc3Npb25Nb2RlbCA9PT0gJ2Jvb2xlYW4nID8gcmF3LnVzZVNlc3Npb25Nb2RlbCA6IERFRkFVTFRTLnVzZVNlc3Npb25Nb2RlbDtcbiAgcmV0dXJuIHsgYmFzZVVybDogbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSwgYXBpS2V5LCBtb2RlbCwgdXNlU2Vzc2lvbk1vZGVsIH07XG59XG5cbmV4cG9ydCB0eXBlIENvbmZpZ1Byb2JsZW0gPSAnbWlzc2luZy1rZXknIHwgJ21pc3NpbmctbW9kZWwnIHwgJ2JhZC11cmwnO1xuZXhwb3J0IHR5cGUgQ29uZmlnQ2hlY2sgPSB7IG9rOiB0cnVlOyBjb25maWc6IFByb21wdENvbmZpZyB9IHwgeyBvazogZmFsc2U7IHJlYXNvbjogQ29uZmlnUHJvYmxlbSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb25maWcoY29uZmlnOiBQcm9tcHRDb25maWcpOiBDb25maWdDaGVjayB7XG4gIGlmICghY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1rZXknIH07XG4gIC8vIFx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NjVGNlx1NjVFMFx1OTcwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYxQlx1NEVDNVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NUYwRlx1ODk4MVx1NkM0MiBtb2RlbCBcdTk3NUVcdTdBN0FcbiAgaWYgKCFjb25maWcudXNlU2Vzc2lvbk1vZGVsICYmICFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nLCBzdHJlYW0gPSBmYWxzZSk6IG9iamVjdCB7XG4gIHJldHVybiB7XG4gICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZykgfSxcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB0ZXh0IH0sXG4gICAgXSxcbiAgICB0ZW1wZXJhdHVyZTogMC43LFxuICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgc3RyZWFtLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG5cbi8qKlxuICogU1NFIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQVx1NTE4NVx1NUJCOVx1NjIxNlx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1NzY4NFx1NEUwMFx1NkJCNVx1NjU4N1x1NjcyQ1x1MzAwMlxuICogdjQgXHU3Q0ZCXHU2QTIxXHU1NzhCXHVGRjA4djQtZmxhc2ggXHU3QjQ5XHVGRjA5XHU2RDQxXHU1RjBGXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1IHJlYXNvbmluZ19jb250ZW50XHVGRjA4XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjA5XHVGRjBDXHU5NjhGXHU1NDBFXHU2MjREXHU4RjkzXHU1MUZBXG4gKiBjb250ZW50IFx1NkI2M1x1NjU4N1x1MjAxNFx1MjAxNFx1NEUyNFx1ODAwNVx1OTBGRFx1ODk4MVx1NUI5RVx1NjVGNlx1NTQ0OFx1NzNCMFx1RkYwQ1x1NTQyNlx1NTIxOVx1NjNBOFx1NzQwNlx1NjcxRlx1NTM2MVx1NzI0N1x1NzcwQlx1OEQ3N1x1Njc2NVx1NTBDRlx1MzAwQ1x1OTc1RVx1NkQ0MVx1NUYwRlx1MzAwRFx1RkYwOFx1NUI5RVx1NkQ0QiB+ODAgXHU0RTJBIGNodW5rXG4gKiBcdTUxNjhcdTY2MkYgcmVhc29uaW5nXHVGRjBDXHU2QjYzXHU2NTg3XHU2NzAwXHU1NDBFXHU2MjREXHU1MUZBXHU3M0IwXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCB0eXBlIFNzZURlbHRhID1cbiAgfCB7IGtpbmQ6ICdjb250ZW50JzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6ICdyZWFzb25pbmcnOyB0ZXh0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTRFMDBcdTg4NEMgU1NFIFx1NjU3MFx1NjM2RVx1RkYxQShkYXRhOiB7Li4ufSkgXHUyMTkyIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQlxuICogW0RPTkVdL1x1OTc1RSBkYXRhIFx1ODg0Qy9cdTk3NUUgSlNPTi9cdTY1RTBcdTUxODVcdTVCQjkgZGVsdGEgXHUyMTkyIG51bGxcdTMwMDJcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTc2VEZWx0YShsaW5lOiBzdHJpbmcpOiBTc2VEZWx0YSB8IG51bGwge1xuICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gIGlmICghdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGF0YSA9IHRyaW1tZWQuc2xpY2UoJ2RhdGE6Jy5sZW5ndGgpLnRyaW0oKTtcbiAgaWYgKGRhdGEgPT09ICdbRE9ORV0nKSByZXR1cm4gbnVsbDtcbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IGRlbHRhPzogeyBjb250ZW50PzogdW5rbm93bjsgcmVhc29uaW5nX2NvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgZGVsdGEgPSBmaXJzdD8uZGVsdGE7XG4gIGlmICh0eXBlb2YgZGVsdGE/LmNvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAnY29udGVudCcsIHRleHQ6IGRlbHRhLmNvbnRlbnQgfTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8ucmVhc29uaW5nX2NvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAncmVhc29uaW5nJywgdGV4dDogZGVsdGEucmVhc29uaW5nX2NvbnRlbnQgfTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHVGRjFBXHU5MDEwXHU1NzU3XHU4OUUzXHU2NzkwIFNTRVx1RkYwQ1x1OEZCOVx1NjUzNlx1OEZCOVx1NTZERVx1OEMwMyBvblRleHQoZGVsdGEpXHVGRjFCXHU4RkQ0XHU1NkRFXHU1QjhDXHU2NTc0XHU2QjYzXHU2NTg3XHUzMDAyXG4gKiBcdTc2RjhcdTZCRDRcdTk3NUVcdTZENDFcdTVGMEYgb3B0aW1pemUoKVx1RkYxQVx1OTk5Nlx1NUI1N1x1NjZGNFx1NUZFQlx1MzAwMVx1OTU3Rlx1OEY5M1x1NTFGQVx1NEUwRFx1OTcwMFx1ODk4MVx1N0I0OVx1NUI4Q1x1NjU3NFx1NzUxRlx1NjIxMFx1MjAxNFx1MjAxNFx1NjMwOVx1OTRBRS9cdTUzNjFcdTcyNDdcdTgwRkRcdThGQjlcdTc1MUZcdTYyMTBcdThGQjlcdTY2M0VcdTc5M0FcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplU3RyZWFtKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIG9uRXZlbnQ/OiAoZGVsdGE6IFNzZURlbHRhKSA9PiB2b2lkO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwsIG9uRXZlbnQgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZywgdHJ1ZSkpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuICBpZiAoIXJlcy5ib2R5KSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ21pc3NpbmcgcmVzcG9uc2UgYm9keScpO1xuXG4gIGNvbnN0IHJlYWRlciA9IHJlcy5ib2R5LmdldFJlYWRlcigpO1xuICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGxldCBidWZmZXIgPSAnJztcbiAgbGV0IGZ1bGwgPSAnJztcbiAgdHJ5IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgIGlmIChkb25lKSBicmVhaztcbiAgICAgIGJ1ZmZlciArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci5zcGxpdCgnXFxuJyk7XG4gICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSA/PyAnJztcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShsaW5lKTtcbiAgICAgICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1REYyXHU0RTJEXHU2QjYyL1x1OTFDQVx1NjUzRVx1NjVGNlx1NUZGRFx1NzU2NVxuICAgIH1cbiAgfVxuICAvLyBcdTVDM0VcdTg4NENcdUZGMDhcdTY1RTBcdTYzNjJcdTg4NENcdTdFRDNcdTVDM0VcdTc2ODQgZGF0YSBcdTg4NENcdUZGMDlcbiAgaWYgKGJ1ZmZlci50cmltKCkpIHtcbiAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShidWZmZXIpO1xuICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdFJlc3VsdChmdWxsKTtcbiAgaWYgKCFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHUzMDBDXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDBEXHVGRjFBXHU4QzAzIGNvbm5lY3Rpb24gXHU3Njg0IHNlc3Npb24ubW9kZWxzIFJQQ1x1RkYwQ1x1NTNENiBjdXJyZW50Lm1vZGVsXHUzMDAyXG4gKiBhcGkgXHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjA4XHU0RTBFIERTSCBcdTg5RTNcdTgwMjZcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdUZGMUJcdTRFRkJcdTRGNTVcdTU5MzFcdThEMjVcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNlc3Npb25Nb2RlbChcbiAgYXBpOlxuICAgIHwge1xuICAgICAgICBzZXNzaW9ucz86IHtcbiAgICAgICAgICBtb2RlbHM/OiAocGF5bG9hZD86IHVua25vd24sIHNpZ25hbD86IEFib3J0U2lnbmFsKSA9PiBQcm9taXNlPHsgY3VycmVudD86IHsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQsXG4gIHBheWxvYWQ6IHVua25vd24gPSB7fSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICAvLyBcdTVGQzVcdTk4N0JcdTY0M0FcdTVFMjYgc2Vzc2lvbklkXHVGRjFBc2VydmVyIFx1N0FFRlx1NjMwOSByZXF1ZXN0LnBheWxvYWQuc2Vzc2lvbklkIFx1NjdFNVx1OEJFNVx1NEYxQVx1OEJERFx1NURGMlx1OTAwOVx1NjJFOVx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwQ1xuICAgIC8vIFx1N0YzQVx1NTkzMVx1NjVGNlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1RkYwOGRlZXBzZWVrLXY0LWZsYXNoXHVGRjA5XHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpPy5zZXNzaW9ucz8ubW9kZWxzPy4ocGF5bG9hZCwgc2lnbmFsKTtcbiAgICBjb25zdCBtID0gcmVzPy5jdXJyZW50Py5tb2RlbDtcbiAgICByZXR1cm4gdHlwZW9mIG0gPT09ICdzdHJpbmcnICYmIG0udHJpbSgpID8gbS50cmltKCkgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2M0QyXHU0RUY2XHU2NTg3XHU2ODQ4IFx1MjAxNCBcdTRFMkRcdTgyRjFcdTUzQ0NcdThCRUQgKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgY29uc3QgTlMgPSAncHJvbXB0X29wdGltaXplcic7XG5cbmV4cG9ydCBjb25zdCB6aCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ1x1NEYxOFx1NTMxNiBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdcdTRGMThcdTUzMTZcdTdFRDNcdTY3OUMnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1x1NjZGRlx1NjM2Mlx1ODM0OVx1N0EzRicsXG4gICdjYXJkLmNvcHknOiAnXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnXHU1REYyXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQucmV0cnknOiAnXHU5MUNEXHU2NUIwXHU0RjE4XHU1MzE2JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdcdTY1M0VcdTVGMDMnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdcdTVERjJcdTkxNERcdTdGNkUgXHUwMEI3IFx1NkEyMVx1NTc4QiB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnXHU2NzJBXHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS50aXRsZSc6ICdcdThCRjdcdTUxNDhcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLmRlc2MnOiAnXHU1MjREXHU1RjgwIFx1OEJCRVx1N0Y2RSBcdTIxOTIgXHU5MDFBXHU3NTI4XHU4QkJFXHU3RjZFIFx1MjE5MiBQcm9tcHQgXHU0RjE4XHU1MzE2XHVGRjBDXHU1ODZCXHU1MTk5XHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwXHUzMDAxQVBJIEtleSBcdTRFMEVcdTZBMjFcdTU3OEJcdTU0MERcdTMwMDInLFxuICAnZ3VpZGUuYWN0aW9uJzogJ1x1NTNCQlx1OEJCRVx1N0Y2RScsXG4gICdndWlkZS5kaXNtaXNzJzogJ1x1NzdFNVx1OTA1M1x1NEU4NicsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIEtleSBcdTY1RTBcdTY1NDhcdTYyMTZcdTVERjJcdThGQzdcdTY3MUYnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ1x1NjcwRFx1NTJBMVx1NjJEMlx1N0VERFx1OEJCRlx1OTVFRVx1RkYwODQwM1x1RkYwOScsXG4gICdlcnJvci50aW1lb3V0JzogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ1x1N0Y1MVx1N0VEQ1x1OTUxOVx1OEJFRlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5jb3JzJzogJ1x1NjNBNVx1NTNFM1x1NEUwRFx1NjUyRlx1NjMwMVx1OERFOFx1NTdERlx1RkYwQ1x1OEJGN1x1NjM2Mlx1NzUyOFx1NjUyRlx1NjMwMSBDT1JTIFx1NzY4NFx1N0Y1MVx1NTE3MycsXG4gICdlcnJvci5odHRwJzogJ1x1OEJGN1x1NkM0Mlx1NTkzMVx1OEQyNVx1RkYwOEhUVFAgXHU5NTE5XHU4QkVGXHVGRjA5JyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTY4M0NcdTVGMEZcdTVGMDJcdTVFMzgnLFxuICAnZXJyb3IuZW1wdHknOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU0RTNBXHU3QTdBXHVGRjBDXHU4QkY3XHU5MUNEXHU4QkQ1JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdcdTkxNERcdTdGNkVcdTRFMERcdTVCOENcdTY1NzRcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTY4QzBcdTY3RTUnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IFx1NEYxOFx1NTMxNicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ1x1OTE0RFx1N0Y2RVx1NkRBNlx1ODI3Mlx1NjNBNVx1NTNFM1x1RkYwOE9wZW5BSSBcdTUxN0NcdTVCQjlcdUZGMDlcdUZGMUJLZXkgXHU2NjBFXHU2NTg3XHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU1NzMwJyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ1x1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnXHU1RjAwXHU1NDJGXHU2NUY2XHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU4RERGXHU5NjhGXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCXHU1MTczXHU5NUVEXHU1NDBFXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnXHU1REYyXHU5MDA5XHU2MkU5XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdcdTRGRERcdTVCNThcdTU5MzFcdThEMjUnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnXHU5MUNEXHU3RjZFXHU1OTMxXHU4RDI1JyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgY29uc3QgZW46IExvY2FsZURpY3QgPSB7XG4gICdidXR0b24uYXJpYSc6ICdPcHRpbWl6ZSBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdPcHRpbWl6ZWQgcHJvbXB0JyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdVc2UgZHJhZnQnLFxuICAnY2FyZC5jb3B5JzogJ0NvcHknLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdDb3BpZWQnLFxuICAnY2FyZC5yZXRyeSc6ICdSZXRyeScsXG4gICdjYXJkLmRpc21pc3MnOiAnRGlzbWlzcycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnT3B0aW1pemluZ1x1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdDb25maWd1cmVkIFx1MDBCNyBtb2RlbCB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnTm8gQVBJIGNvbmZpZ3VyZWQnLFxuICAnZ3VpZGUudGl0bGUnOiAnQ29uZmlndXJlIHRoZSBBUEkgZmlyc3QnLFxuICAnZ3VpZGUuZGVzYyc6ICdHbyB0byBTZXR0aW5ncyBcdTIxOTIgR2VuZXJhbCBcdTIxOTIgUHJvbXB0IE9wdGltaXplciBhbmQgZmlsbCBpbiB0aGUgZW5kcG9pbnQsIEFQSSBrZXksIGFuZCBtb2RlbC4nLFxuICAnZ3VpZGUuYWN0aW9uJzogJ0dvIHRvIHNldHRpbmdzJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnR290IGl0JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkga2V5IGlzIGludmFsaWQgb3IgZXhwaXJlZCcsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnQWNjZXNzIGZvcmJpZGRlbiAoNDAzKScsXG4gICdlcnJvci50aW1lb3V0JzogJ1JlcXVlc3QgdGltZWQgb3V0OyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnTmV0d29yayBlcnJvcjsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5jb3JzJzogJ0VuZHBvaW50IGJsb2NrcyBDT1JTOyB1c2UgYSBnYXRld2F5IHRoYXQgYWxsb3dzIGl0JyxcbiAgJ2Vycm9yLmh0dHAnOiAnUmVxdWVzdCBmYWlsZWQgKEhUVFAgZXJyb3IpJyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdVbmV4cGVjdGVkIHJlc3BvbnNlIGZvcm1hdCcsXG4gICdlcnJvci5lbXB0eSc6ICdFbXB0eSByZXN1bHQ7IHBsZWFzZSByZXRyeScsXG4gICdlcnJvci5jb25maWcnOiAnSW5jb21wbGV0ZSBjb25maWd1cmF0aW9uOyBjaGVjayBzZXR0aW5ncycsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgT3B0aW1pemVyJyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnQ29uZmlndXJlIHRoZSByZXdyaXRlIGVuZHBvaW50IChPcGVuQUktY29tcGF0aWJsZSk7IGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBwbGFpbiB0ZXh0JyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnQmFzZSBVUkwnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnTW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1VzZSBjdXJyZW50IHNlc3Npb24gbW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdXaGVuIG9uLCBvcHRpbWl6YXRpb24gcmVxdWVzdHMgZm9sbG93IHRoZSBzZXNzaW9uIG1vZGVsOyB3aGVuIG9mZiwgdGhlIGN1c3RvbSBtb2RlbCBiZWxvdyBpcyB1c2VkJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnU2Vzc2lvbiBkZWZhdWx0IG1vZGVsIHNlbGVjdGVkJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2J1dHRvbi5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAycHggNnB4O1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAxO1xuICBvcGFjaXR5OiAwLjg1O1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG59XG4uZHNoLXBvLWJ0bjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG4gIG9wYWNpdHk6IDE7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjEyKSk7XG59XG4uZHNoLXBvLWJ0bjpkaXNhYmxlZCB7XG4gIG9wYWNpdHk6IDAuMzU7XG4gIGN1cnNvcjogZGVmYXVsdDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKipcbiAqIFx1OEJGQlx1NTNENlx1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYxQVx1NEYxOFx1NTE0OFx1NTNENlx1NzEyNlx1NzBCOSB0ZXh0YXJlYVx1RkYxQlx1NTQyNlx1NTIxOVx1NTZERVx1OTAwMFx1NTIzMFx1OTg3NVx1OTc2Mlx1NEUyRFx1MzAwQ1x1NTAzQ1x1OTc1RVx1N0E3QVx1MzAwRFx1NzY4NCB0ZXh0YXJlYVxuICogXHVGRjA4XHU3NTI4XHU2MjM3XHU1NzI4XHU4RjkzXHU1MTY1XHU3Njg0XHU1MzczXHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjA5XHUzMDAyXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREXHU2ODA3XHU1MUM2IGtpdCBcdTc2ODQgaW5wdXQgaG9va1x1MjAxNFx1MjAxNFx1NUI5RVx1NkQ0QlxuICogaW5wdXQucmlnaHQgXHU2RTMyXHU2N0QzXHU2NUY2XHU4QkU1XHU2ODA3XHU1MUM2IHByb3BzIFx1NjcyQVx1NjNEMFx1NEY5Qlx1RkYwQ1x1N0VDNFx1NEVGNlx1NEYxQVx1NTZFMFx1OEMwM1x1NzUyOCB1bmRlZmluZWQgaG9va1xuICogXHU1RDI5XHU2RTgzXHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHVGRjA4UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOCBcdTRFMERcdTUzRUZcdTg5QzFcdUZGMDlcdTMwMDJcbiAqL1xuZnVuY3Rpb24gcmVhZERyYWZ0KCk6IHN0cmluZyB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSByZXR1cm4gYWN0aXZlLnZhbHVlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICh0YS52YWx1ZS50cmltKCkpIHJldHVybiB0YS52YWx1ZTtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBPcHRpbWl6ZUJ1dHRvbihwcm9wczogT3B0aW1pemVCdXR0b25Qcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0LCBnZXRTZXNzaW9uSWQgfSA9IHByb3BzO1xuXG4gIC8vIFx1N0U0MVx1NUZEOVx1NjAwMVx1RkYxQVx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVx1RkYxQlxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTIwMTRcdTIwMTRcdTUyMDdcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTYzMDlcdTk0QUVcdTRFMERcdTUxOEQgYnVzeVx1RkYwOFx1NTQwNFx1NEYxQVx1OEJERFx1NTNFRlx1NzJFQ1x1N0FDQlx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1RkYwOVxuICBjb25zdCBidXN5Rm9yID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0ID0gZ2V0UHJldmlld0J1c1N0YXRlKCk7XG4gICAgaWYgKHN0LnN0YXR1cyAhPT0gJ29wdGltaXppbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3Qgc2lkID0gZ2V0U2Vzc2lvbklkPy4oKTtcbiAgICByZXR1cm4gc3Quc2Vzc2lvbklkID09PSBudWxsIHx8IHN0LnNlc3Npb25JZCA9PT0gc2lkO1xuICB9O1xuICBjb25zdCBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZShidXN5Rm9yKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0QnVzeShidXN5Rm9yKCkpKSxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgW10sXG4gICk7XG5cbiAgLy8gbW91c2Vkb3duIFx1OTg4NFx1OEJGQlx1ODM0OVx1N0EzRlx1RkYxQVx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVx1NzdBQ1x1OTVGNFx1NzEyNlx1NzBCOVx1NEYxQVx1NTIwN1x1NTIzMFx1NjMwOVx1OTRBRVx1RkYwOGFjdGl2ZUVsZW1lbnQgXHU0RTBEXHU1MThEXHU2NjJGIHRleHRhcmVhXHVGRjA5XHVGRjBDXG4gIC8vIFx1NEY0NiBtb3VzZWRvd24gXHU2NUU5XHU0RThFXHU3MTI2XHU3MEI5XHU1MjA3XHU2MzYyXHUyMDE0XHUyMDE0XHU2QjY0XHU1MjNCXHU4QkZCXHU1MjMwXHU3Njg0IGFjdGl2ZUVsZW1lbnQgXHU0RUNEXHU2NjJGXHU4RjkzXHU1MTY1XHU2ODQ2XHUzMDAyXG4gIGNvbnN0IGRyYWZ0UmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3Qgc3luY0RyYWZ0ID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRyYWZ0UmVmLmN1cnJlbnQgPSByZWFkRHJhZnQoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChidXN5KSByZXR1cm47XG4gICAgY29uc3QgZHJhZnQgPSBkcmFmdFJlZi5jdXJyZW50IHx8IHJlYWREcmFmdCgpO1xuICAgIGlmICghZHJhZnQudHJpbSgpKSByZXR1cm47XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IGRyYWZ0LFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgZ2V0SG9zdCxcbiAgICAgIGdldFNlc3Npb25JZCxcbiAgICB9KTtcbiAgfSwgW2J1c3ksIGdldENvbmZpZywgZ2V0TGFuZ10pO1xuXG4gIC8vIEFsdCtPIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYwOGluZGV4LnRzIFx1NTE2OFx1NUM0MFx1NzZEMVx1NTQyQ1x1RkYwOVx1MjE5MiBcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3B0aW1pemVSZXF1ZXN0KGhhbmRsZUNsaWNrKSwgW2hhbmRsZUNsaWNrXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgYXJpYS1sYWJlbD17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIHRpdGxlPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgZGlzYWJsZWQ9e2J1c3l9XG4gICAgICBkYXRhLWJ1c3k9e2J1c3l9XG4gICAgICBvbk1vdXNlRG93bj17c3luY0RyYWZ0fVxuICAgICAgb25Gb2N1cz17c3luY0RyYWZ0fVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgPlxuICAgICAge2J1c3kgPyAnXHUyM0YzJyA6ICdcdTI3MjgnfVxuICAgIDwvYnV0dG9uPlxuICApO1xufSIsICIvKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NEYxOFx1NTMxNlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYxQXNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCArIGxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NEU1Rlx1NEUwRFx1OEJFNVx1NzUyOCBzZXNzaW9uLmNyZWF0ZS9mb3JrIFx1NTIxQlx1NUVGQVx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFxuICogXHVGRjA4XHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU1QjlFXHU2RDRCXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyXHU2QjYzXHU4OUUzXHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU3Njg0XHU1QkJGXHU0RTNCXG4gKiBcdTY3MERcdTUyQTFcdTk3NjJcdUZGMUFzZXJ2ZXIgaGFsZlx1RkYwOGxpYi9pbmRleC5qc1x1RkYwOVx1NjMwMVx1NjcwOSBsbG0gXHU0RTBFIGFnZW50RGVmYXVsdE1vZGVsIFx1NjcwRFx1NTJBMVx1MjAxNFx1MjAxNFxuICogICBzZXNzaW9uTW9kZWwgICAgIFx1MjE5MiBcdTVGNTNcdTUyNERcdTRGMUFcdThCREQvYWdlbnQgXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHVGRjA4cHJvdmlkZXIgKyBtb2RlbFx1RkYwOVxuICogICBvcHRpbWl6ZS5zdGFydCAgIFx1MjE5MiBsbG0uc3RyZWFtIFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlx1RkYwQ1x1NTg5RVx1OTFDRlx1N0QyRlx1NzlFRlx1NTIzMFx1NEVGQlx1NTJBMVxuICogICBvcHRpbWl6ZS5wb2xsICAgIFx1MjE5MiBcdTUzRDYgeyBkb25lLCB0ZXh0IH1cdUZGMDhcdTYzQTVcdThGRDEgMjUwbXMgXHU0RTAwXHU2QjIxXHVGRjA5XG4gKiAgIG9wdGltaXplLmFib3J0ICAgXHUyMTkyIFx1NjgwN1x1OEJCMFx1NEUyRFx1NkI2Mlx1RkYwQ1x1NTQwRVx1NTNGMFx1NkQ0MVx1NUMzRFx1NUZFQlx1NTA1Q1xuICogY2xpZW50IFx1N0VDRlx1ODFFQVx1NjcwOSBSUEMgXHU5MDFBXHU5MDUzXHVGRjA4L2RzaC1wcm9tcHQtb3B0aW1pemVyXHVGRjA5XHU4RjZFXHU4QkUyXHU1ODlFXHU5MUNGXHU1NDQ4XHU3M0IwXHVGRjA4XHU4RkQxXHU0RjNDXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogXHU4MUVBXHU2NzA5IFJQQyBcdTkwMUFcdTkwNTNcdTc2ODRcdTY3MDBcdTVDMEZcdTk3NjJcdUZGMDhcdTZDRThcdTUxNjVcdTVGMEZcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdFJwYyB7XG4gIGNhbGwoZW5kcG9pbnQ6IHN0cmluZywgcGF5bG9hZD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx7XG4gICAgb2s6IGJvb2xlYW47XG4gICAgdmFsdWU/OiB1bmtub3duO1xuICAgIGVycm9yPzogeyBjb2RlPzogc3RyaW5nOyBkZXRhaWxzPzogdW5rbm93biB9O1xuICB9Pjtcbn1cblxuLyoqIFx1N0VEOVx1NjMwMlx1OEQ3N1x1NzY4NCBSUEMgXHU4QzAzXHU3NTI4XHU1MkEwXHU4RDg1XHU2NUY2XHVGRjA4XHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RUZCXHU0RjU1XHU0RTAwXHU2QjY1XHU5MEZEXHU0RTBEXHU1MTQxXHU4QkI4XHU2NUUwXHU5NjUwXHU5NjNCXHU1ODVFIFx1MjE5Mlx1MzAwQ1x1NEUwMFx1NzZGNFx1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MzAwRFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhUaW1lb3V0PFQ+KHByb21pc2U6IFByb21pc2U8VD4sIG1zOiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgJHtsYWJlbH0tdGltZW91dGApKSwgbXMpO1xuICAgIHByb21pc2UudGhlbihcbiAgICAgICh2KSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHJlc29sdmUodik7XG4gICAgICB9LFxuICAgICAgKGUpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfSxcbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0U2Vzc2lvbkluZm8ge1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICByZWFzb25pbmdFZmZvcnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSG9zdE9wdGltaXplT3B0aW9ucyB7XG4gIHJwYzogSG9zdFJwYztcbiAgbGFuZzogTGFuZztcbiAgdGV4dDogc3RyaW5nO1xuICBzeXN0ZW06IHN0cmluZztcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgb25EZWx0YTogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgaW50ZXJ2YWxNcz86IG51bWJlcjtcbiAgdGltZW91dE1zPzogbnVtYmVyO1xuICBycGNUaW1lb3V0TXM/OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfSU5URVJWQUxfTVMgPSAyNTA7XG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSAxMjBfMDAwO1xuY29uc3QgREVGQVVMVF9SUENfVElNRU9VVF9NUyA9IDVfMDAwO1xuXG5mdW5jdGlvbiBjYWxsUnBjPFIgPSBuZXZlcj4oXG4gIHJwYzogSG9zdFJwYyxcbiAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIG1zOiBudW1iZXIsXG4pOiBQcm9taXNlPHsgb2s6IHRydWU7IHZhbHVlOiBSIH0gfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfT4ge1xuICByZXR1cm4gd2l0aFRpbWVvdXQoXG4gICAgcnBjLmNhbGwoZW5kcG9pbnQsIHBheWxvYWQpLFxuICAgIG1zLFxuICAgIGVuZHBvaW50LFxuICApIGFzIFByb21pc2U8eyBvazogdHJ1ZTsgdmFsdWU6IFIgfSB8IHsgb2s6IGZhbHNlOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9Pjtcbn1cblxuLyoqIFx1NTNENlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERC9hZ2VudCBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdTMwMDJcdTRFMERcdTUzRUZcdTVGOTdcdTY1RjZcdThGRDRcdTU2REUgbnVsbFx1MzAwMiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVIb3N0U2Vzc2lvbk1vZGVsKFxuICBycGM6IEhvc3RScGMsXG4gIHJwY1RpbWVvdXRNcyA9IERFRkFVTFRfUlBDX1RJTUVPVVRfTVMsXG4pOiBQcm9taXNlPEhvc3RTZXNzaW9uSW5mbyB8IG51bGw+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgY2FsbFJwYyhycGMsICdzZXNzaW9uTW9kZWwnLCB7fSwgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFyZXMub2sgfHwgIXJlcy52YWx1ZSB8fCB0eXBlb2YgcmVzLnZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHYgPSByZXMudmFsdWUgYXMgeyBwcm92aWRlcj86IHVua25vd247IG1vZGVsPzogdW5rbm93biB9O1xuICBpZiAodHlwZW9mIHYucHJvdmlkZXIgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2Lm1vZGVsICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGluZm86IEhvc3RTZXNzaW9uSW5mbyA9IHsgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gIGlmICh0eXBlb2YgKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHVua25vd24gfSkucmVhc29uaW5nRWZmb3J0ID09PSAnc3RyaW5nJykge1xuICAgIGluZm8ucmVhc29uaW5nRWZmb3J0ID0gKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZyB9KS5yZWFzb25pbmdFZmZvcnQ7XG4gIH1cbiAgcmV0dXJuIGluZm87XG59XG5cbi8qKiBcdTY1ODdcdTY3MkNcdTU4OUVcdTkxQ0ZcdUZGMDhcdTVCNTdcdTdCMjZcdTUyNERcdTdGMDBcdTZCRDRcdThGODNcdUZGMUJcdThGNkVcdThCRTJcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdTc1MjhcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVmaXhEZWx0YShwcmV2OiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG4gPSBNYXRoLm1pbihwcmV2Lmxlbmd0aCwgbmV4dC5sZW5ndGgpO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgbiAmJiBwcmV2LmNoYXJDb2RlQXQoaSkgPT09IG5leHQuY2hhckNvZGVBdChpKSkgaSArPSAxO1xuICByZXR1cm4gbmV4dC5zbGljZShpKTtcbn1cblxuLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTUxNjhcdTZENDFcdTdBMEJcdUZGMUFcdTUzRDZcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEIgXHUyMTkyIFx1NTQwRVx1NTNGMCBsbG0uc3RyZWFtIFx1NTQyRlx1NTJBOCBcdTIxOTIgXHU4RjZFXHU4QkUyXHU1ODlFXHU5MUNGXHU3NkY0XHU4MUYzIGRvbmVcbiAqIFx1RkYwOGFib3J0IFx1MjE5MiBcdTkwMUFcdTc3RTUgc2VydmVyIFx1NEUyRFx1NkI2Mlx1NTQwRVx1NjI5Qlx1OTUxOVx1RkYxQlx1NjU3NFx1NEY1M1x1OEQ4NVx1NjVGNlx1NTE1Q1x1NUU5NVx1RkYwOVx1MzAwMlx1OEZENFx1NTZERVx1NjcwMFx1N0VDOFx1NkI2M1x1NjU4N1x1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSG9zdE9wdGltaXplKG9wdHM6IFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IHJwYywgbGFuZzogX2xhbmcsIHRleHQsIHN5c3RlbSwgc2lnbmFsLCBvbkRlbHRhIH0gPSBvcHRzO1xuICBjb25zdCBpbnRlcnZhbE1zID0gb3B0cy5pbnRlcnZhbE1zID8/IERFRkFVTFRfSU5URVJWQUxfTVM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdHMudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUztcbiAgY29uc3QgcnBjVGltZW91dE1zID0gb3B0cy5ycGNUaW1lb3V0TXMgPz8gREVGQVVMVF9SUENfVElNRU9VVF9NUztcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcblxuICAvLyAxLiBcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMUJcdTVCQkZcdTRFM0JcdTY3MERcdTUyQTFcdTRFMERcdTUzRUZcdTc1MjhcdTYyMTZcdTY1RTBcdTZBMjFcdTU3OEIgXHUyMTkyIFx1NjYwRVx1Nzg2RVx1NTkzMVx1OEQyNVx1RkYwQ1x1NEUwRFx1OTc1OVx1OUVEOFx1RkYwOVxuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgcmVzb2x2ZUhvc3RTZXNzaW9uTW9kZWwocnBjLCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXNlc3Npb24pIHRocm93IG5ldyBFcnJvcignaG9zdC11bmF2YWlsYWJsZScpO1xuXG4gIC8vIDIuIFx1NTQyRlx1NTJBOFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlx1NEVGQlx1NTJBMVxuICBjb25zdCBzdGFydGVkUGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgcHJvdmlkZXI6IHNlc3Npb24ucHJvdmlkZXIsXG4gICAgbW9kZWw6IHNlc3Npb24ubW9kZWwsXG4gICAgdGV4dCxcbiAgICBzeXN0ZW0sXG4gIH07XG4gIGlmIChzZXNzaW9uLnJlYXNvbmluZ0VmZm9ydCkgc3RhcnRlZFBheWxvYWQucmVhc29uaW5nRWZmb3J0ID0gc2Vzc2lvbi5yZWFzb25pbmdFZmZvcnQ7XG4gIGNvbnN0IHN0YXJ0ID0gYXdhaXQgY2FsbFJwYzx7IHRhc2tJZD86IHN0cmluZyB9PihycGMsICdvcHRpbWl6ZS5zdGFydCcsIHN0YXJ0ZWRQYXlsb2FkLCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXN0YXJ0Lm9rIHx8ICFzdGFydC52YWx1ZSB8fCB0eXBlb2Ygc3RhcnQudmFsdWUudGFza0lkICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignaG9zdC1zdGFydC1yZWplY3RlZCcpO1xuICB9XG4gIGNvbnN0IHRhc2tJZCA9IHN0YXJ0LnZhbHVlLnRhc2tJZDtcblxuICAvLyAzLiBcdThGNkVcdThCRTJcdTU4OUVcdTkxQ0ZcdTc2RjRcdTgxRjMgZG9uZVxuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBsZXQgbGFzdCA9ICcnO1xuICB0cnkge1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJwYy5jYWxsKCdvcHRpbWl6ZS5hYm9ydCcsIHsgdGFza0lkIH0pO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBcdTVDM0RcdTUyOUJcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICAgIH1cbiAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnRlZEF0ID4gdGltZW91dE1zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcnBjLmNhbGwoJ29wdGltaXplLmFib3J0JywgeyB0YXNrSWQgfSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIFx1NUMzRFx1NTI5QlxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCcpO1xuICAgICAgfVxuICAgICAgbGV0IHBvbGw6IHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9IHwgbnVsbCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBjYWxsUnBjPHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9PihcbiAgICAgICAgICBycGMsXG4gICAgICAgICAgJ29wdGltaXplLnBvbGwnLFxuICAgICAgICAgIHsgdGFza0lkIH0sXG4gICAgICAgICAgcnBjVGltZW91dE1zLFxuICAgICAgICApO1xuICAgICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSkgcG9sbCA9IHJlcy52YWx1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTUzNTVcdTZCMjFcdThGNkVcdThCRTJcdTU5MzFcdThEMjVcdTRFMERcdTgxRjRcdTU0N0RcdUZGMENcdTRFMEJcdTRFMDBcdThGNkVcdTUxOERcdThCRDVcbiAgICAgIH1cbiAgICAgIGlmIChwb2xsKSB7XG4gICAgICAgIGlmIChwb2xsLmVycm9yKSB0aHJvdyBuZXcgRXJyb3IocG9sbC5lcnJvcik7XG4gICAgICAgIGNvbnN0IHRleHROb3cgPSBwb2xsLnRleHQgPz8gJyc7XG4gICAgICAgIGlmICh0ZXh0Tm93ICE9PSBsYXN0KSB7XG4gICAgICAgICAgb25EZWx0YSh0ZXh0Tm93KTtcbiAgICAgICAgICBsYXN0ID0gdGV4dE5vdztcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9sbC5kb25lKSByZXR1cm4gdGV4dE5vdztcbiAgICAgIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgLy8gXHU0RUZCXHU0RjU1XHU5MDAwXHU1MUZBXHU4REVGXHU1Rjg0XHU5MEZEXHU5MDFBXHU3N0U1XHU2NzBEXHU1MkExXHU3QUVGXHU1MDVDXHU2QjYyXHU1NDBFXHU1M0YwXHU0RUZCXHU1MkExXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJwYy5jYWxsKCdvcHRpbWl6ZS5hYm9ydCcsIHsgdGFza0lkIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1QzNEXHU1MjlCXG4gICAgfVxuICB9XG59IiwgIi8qKiBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcdTcyQjZcdTYwMDFcdTY3M0EgXHUyMDE0XHUyMDE0IFx1N0VBRiByZWR1Y2VyXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZUVycm9yS2luZCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuZXhwb3J0IHR5cGUgUHJldmlld1N0YXR1cyA9ICdpZGxlJyB8ICdvcHRpbWl6aW5nJyB8ICdwcmV2aWV3JyB8ICdlcnJvcicgfCAnZ3VpZGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByZXZpZXdTdGF0ZSB7XG4gIHN0YXR1czogUHJldmlld1N0YXR1cztcbiAgcmVzdWx0OiBzdHJpbmc7XG4gIGVycm9yS2luZDogT3B0aW1pemVFcnJvcktpbmQgfCBudWxsO1xuICBnZW5lcmF0aW9uOiBudW1iZXI7XG4gIC8qKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdTRFMkRcdTc2ODRcdTU4OUVcdTkxQ0ZcdTY1ODdcdTY3MkNcdUZGMDhvcHRpbWl6aW5nIFx1NjAwMVx1NUI5RVx1NjVGNlx1NjZGNFx1NjVCMFx1RkYxQlx1OTc1RVx1NkQ0MVx1NUYwRlx1NTE2OFx1N0EwQlx1NEUzQVx1N0E3QVx1NEUzMlx1RkYwOSAqL1xuICBkcmFmdDogc3RyaW5nO1xuICAvKiogXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHU3Njg0XHU0RjFBXHU4QkREIGlkXHVGRjA4bnVsbCA9IFx1NjcyQVx1N0VEMVx1NUI5QS9cdTUxNjhcdTVDNDBcdUZGMDlcdUZGMUFcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTUzRUFcdTVDNUVcdTRFOEVcdThCRTVcdTRGMUFcdThCRERcdUZGMENcdTUyMDdcdThENzBcdTRFMERcdThEREZcdTk2OEYgKi9cbiAgc2Vzc2lvbklkOiBzdHJpbmcgfCBudWxsO1xufVxuXG4vKiogXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjFBcmVkdWNlciBcdTZDMzhcdTRFMERcdTUxOTlcdTU2REVcdTVCODNcdTYyMTZcdThGRDRcdTU2REVcdTUzRUZcdTUzRDhcdTc2ODRcdTY1QjBcdTVCRjlcdThDNjFcdUZGMUJcdTZEODhcdThEMzlcdTgwMDVcdUZGMDhUYXNrIDQgc3RvcmUgXHU4MEY2XHU2QzM0XHVGRjA5XHU1RkM1XHU5ODdCXHU0RUU1IHsgLi4uSU5JVElBTF9QUkVWSUVXIH0gXHU0RTNBXHU2QkNGXHU0RjFBXHU4QkREXHU3OUNEXHU1QjUwICovXG5leHBvcnQgY29uc3QgSU5JVElBTF9QUkVWSUVXOiBQcmV2aWV3U3RhdGUgPSB7XG4gIHN0YXR1czogJ2lkbGUnLFxuICByZXN1bHQ6ICcnLFxuICBlcnJvcktpbmQ6IG51bGwsXG4gIGdlbmVyYXRpb246IDAsXG4gIGRyYWZ0OiAnJyxcbiAgc2Vzc2lvbklkOiBudWxsLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nOyBzZXNzaW9uSWQ/OiBzdHJpbmcgfCBudWxsIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCB9XG4gIHwgeyB0eXBlOiAnZ3VpZGUnIH1cbiAgfCB7IHR5cGU6ICdjbG9zZScgfVxuICB8IHsgdHlwZTogJ2RyYWZ0JzsgdGV4dDogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VQcmV2aWV3KHN0YXRlOiBQcmV2aWV3U3RhdGUsIGFjdGlvbjogUHJldmlld0FjdGlvbik6IFByZXZpZXdTdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdiZWdpbic6XG4gICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycpIHJldHVybiBzdGF0ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBzdGF0dXM6ICdvcHRpbWl6aW5nJyxcbiAgICAgICAgZXJyb3JLaW5kOiBudWxsLFxuICAgICAgICBkcmFmdDogJycsXG4gICAgICAgIHNlc3Npb25JZDogYWN0aW9uLnNlc3Npb25JZCA/PyBudWxsLFxuICAgICAgICBnZW5lcmF0aW9uOiBzdGF0ZS5nZW5lcmF0aW9uICsgMSxcbiAgICAgIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0LCBkcmFmdDogJycgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAnZXJyb3InLCBlcnJvcktpbmQ6IGFjdGlvbi5raW5kIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdndWlkZSc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyBzdGF0ZSA6IHsgLi4uc3RhdGUsIHN0YXR1czogJ2d1aWRlJyB9O1xuICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgIHJldHVybiBJTklUSUFMX1BSRVZJRVc7XG4gICAgY2FzZSAnZHJhZnQnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8geyAuLi5zdGF0ZSwgZHJhZnQ6IGFjdGlvbi50ZXh0IH0gOiBzdGF0ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHN0YXRlO1xuICB9XG59XG5cbi8qKiBcdThCQTFcdTUyMTJcdTg5QzRcdTVCOUFcdTc2ODRcdTUxNkNcdTVGMDAgQVBJXHVGRjA4VGFzayA0IFx1OEQ3N1x1NUI1OFx1NTcyOFx1RkYxQmNhblRyaWdnZXIgXHU3Njg0ICFidXN5IFx1NTM0QVx1OEZCOVx1NjI3Rlx1NjJDNVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1ODA0Q1x1OEQyM1x1RkYwQ1x1NTE3Nlx1NEY1OVx1NEZERFx1NzU1OVx1NEVFNVx1NTkwN1x1NTQwRVx1N0VFRFx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbk9wdGltaXplRnJvbShzdGF0dXM6IFByZXZpZXdTdGF0dXMpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0YXR1cyAhPT0gJ29wdGltaXppbmcnO1xufVxuIiwgIi8qKiBcdTk4ODRcdTg5QzhcdTcyQjZcdTYwMDFcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkYgXHUyMDE0XHUyMDE0IFx1NjMwOVx1OTRBRS9cdTk4ODRcdTg5QzhcdTUzNjEvcnVuT3B0aW1pemUgXHU1MTcxXHU0RUFCXHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgKi9cblxuaW1wb3J0IHtcbiAgSU5JVElBTF9QUkVWSUVXLFxuICByZWR1Y2VQcmV2aWV3LFxuICB0eXBlIFByZXZpZXdBY3Rpb24sXG4gIHR5cGUgUHJldmlld1N0YXRlLFxufSBmcm9tICcuL3ByZXZpZXctc3RhdGUuanMnO1xuXG4vKiogXHU2QTIxXHU1NzU3XHU3RUE3XHU1MzU1XHU0RjhCXHU3MkI2XHU2MDAxXHVGRjA4XHU2QkNGXHU2M0QyXHU0RUY2XHU1QjlFXHU0RjhCXHU0RTAwXHU0RUZEXHVGRjFBXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU1MTg1XHU1MTY4XHU1QzQwXHU1NTJGXHU0RTAwXHVGRjA5ICovXG5sZXQgc3RhdGU6IFByZXZpZXdTdGF0ZSA9IHsgLi4uSU5JVElBTF9QUkVWSUVXIH07XG5jb25zdCBsaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbi8qKiBcdThCRkJcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdUZGMDhcdTdBMzNcdTVCOUFcdTVGMTVcdTc1MjhcdTc2RjRcdTUyMzBcdTRFMEJcdTRFMDBcdTZCMjEgZGlzcGF0Y2hcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3QnVzU3RhdGUoKTogUHJldmlld1N0YXRlIHtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vKiogXHU2RDNFXHU1M0QxXHU3MkI2XHU2MDAxXHU2NzNBXHU1MkE4XHU0RjVDXHU1RTc2XHU5MDFBXHU3N0U1XHU4QkEyXHU5NjA1XHU4MDA1ICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hQcmV2aWV3KGFjdGlvbjogUHJldmlld0FjdGlvbik6IHZvaWQge1xuICBzdGF0ZSA9IHJlZHVjZVByZXZpZXcoc3RhdGUsIGFjdGlvbik7XG4gIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSBsaXN0ZW5lcigpO1xufVxuXG4vKiogXHU4QkEyXHU5NjA1XHU1M0Q4XHU1MzE2XHVGRjFCXHU4RkQ0XHU1NkRFXHU5MDAwXHU4QkEyXHU1MUZEXHU2NTcwICovXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlUHJldmlld0J1cyhsaXN0ZW5lcjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfTtcbn0iLCAiLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5MiBydW5PcHRpbWl6ZSArIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNiBcdTIwMTRcdTIwMTQgXHU3MkI2XHU2MDAxXHU3RUNGXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdTUzRDFcdTVFMDNcdUZGMENcbiAqICBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwOFx1Njg0Q1x1OTc2Mlx1NkUzMlx1NjdEM1x1NUM0Mlx1NUJGOSBpbnB1dC5yaWdodC9vdmVybGF5IFx1NjlGRFx1NEY0RFx1NEUwRFx1NjNEMFx1NEY5Qlx1OEZEOVx1NEU5Qlx1NjgwN1x1NTFDNiBwcm9wc1x1RkYwQ1xuICogIFx1N0VDNFx1NEVGNlx1NEY5RFx1OEQ1Nlx1NUI4M1x1NEVFQ1x1NEYxQVx1NUQyOVx1NUU3Nlx1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1MjAxNFx1MjAxNFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjgvXHU5ODg0XHU4OUM4XHU1MzYxXHU0RTBEXHU1M0VGXHU4OUMxXHU3Njg0XHU1QjlFXHU2RDRCXHU1QjlBXHU4QkJBXHVGRjA5XHUzMDAyICovXG5cbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZVN0cmVhbSxcbiAgcmVzb2x2ZVNlc3Npb25Nb2RlbCxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuSG9zdE9wdGltaXplLCB0eXBlIEhvc3RScGMgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGJ1aWxkU3lzdGVtUHJvbXB0IH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgZGlzcGF0Y2hQcmV2aWV3IH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbi8qKlxuICogXHU1RjUzXHU1MjREIGluLWZsaWdodCBcdThCRjdcdTZDNDJcdTc2ODRcdTYzQTdcdTUyMzZcdTU2NjhcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMDlcdUZGMUFcbiAqIC0gXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHU2NUY2XHU0RTJEXHU2QjYyXHU1QjgzXHVGRjBDXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHVGRjFCXG4gKiAtIHJ1bk9wdGltaXplIFx1NEVFNVx1MzAwQ1x1NUI1OFx1NTcyOFx1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNlx1NTY2OFx1MzAwRFx1NEUzQVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYwOFx1NTQwQ1x1NEUwMFx1NjVGNlx1NTIzQlx1NTNFQVx1NTE0MVx1OEJCOFx1NEUwMFx1NEUyQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1RkYwOVx1MzAwMlxuICogXHU2Q0U4XHVGRjFBXHU2QTIxXHU1NzU3XHU3RUE3XHU2MTBGXHU1NDczXHU3NzQwXHU1OTFBXHU0RjFBXHU4QkREXHU1NDBDXHU2NUY2XHU0RjE4XHU1MzE2XHU0RjFBXHU0RTkyXHU3NkY4XHU4QkE5XHU4REVGXHUyMDE0XHUyMDE0XHU4RjkzXHU1MTY1XHU2ODBGXHU1MzU1XHU0RjFBXHU4QkREXHU4MDVBXHU3MTI2XHU3Njg0XHU0RUE0XHU0RTkyXHU0RTBCXHU1M0VGXHU2M0E1XHU1M0Q3XHU2QjY0XHU3QjgwXHU1MzE2XHUzMDAyXG4gKi9cbmxldCBhY3RpdmVDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbi8qKiBcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdTc2ODRcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMDhcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTYzMDlcdTRGMUFcdThCRERcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTk2MzJcdTYyOTZcdUZGMUJcdTVGMDJcdTRGMUFcdThCRERcdThCQTlcdThERUZcdUZGMDkgKi9cbmxldCBhY3RpdmVTZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUyMTkyIFx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxXHVGRjA4ZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUyMTkyIGd1aWRlXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbiAgLyoqIFx1NUJCRlx1NEUzQlx1NkEyMVx1NTc4Qlx1RkYwOFVJIFx1NjgwN1x1N0I3RVx1RkYwOVx1RkYxQlx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTE4NVx1OTBFOFx1ODFFQVx1ODg0Q1x1ODlFM1x1Njc5MCAqL1xuICBnZXRTZXNzaW9uTW9kZWw/KCk6IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTc1MjhcdUZGMDlcdUZGMUFcdTgxRUFcdTY3MDkgUlBDIFx1MjE5MiBzZXJ2ZXIgaGFsZiBcdTc2ODQgbGxtLnN0cmVhbVx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RSAqL1xuICBob3N0Pzoge1xuICAgIHJwYzogSG9zdFJwYztcbiAgfTtcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOFx1N0VEMVx1NUI5QVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1RkYwQ1x1NTIwN1x1NEYxQVx1OEJERFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOSAqL1xuICBnZXRTZXNzaW9uSWQ/KCk6IHN0cmluZyB8IG51bGw7XG59KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbmZpZyA9IGN0eC5nZXRDb25maWcoKTtcbiAgY29uc3QgZHJhZnQgPSBjdHguZ2V0RHJhZnQoKS50cmltKCk7XG4gIGlmICghZHJhZnQpIHJldHVybjtcblxuICAvLyBcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTU3MjhcdTkwMTQgXHUyMTkyIFx1NEUyMlx1NUYwM1x1NjcyQ1x1NkIyMVx1ODlFNlx1NTNEMVx1RkYwOFx1NjMwOVx1OTRBRSBidXN5IFx1NURGMlx1Nzk4MVx1NzUyOFx1NzBCOVx1NTFGQlx1RkYwQ1x1OEZEOVx1OTFDQ1x1NjYyRlx1N0FERVx1NjAwMVx1NjcwMFx1NTQwRVx1OTYzMlx1N0VCRlx1RkYwOVx1RkYxQlxuICAvLyBcdTUyMDdcdTYzNjJcdTRGMUFcdThCRERcdTU0MEVcdTUzRDFcdThENzcgXHUyMTkyIFx1NEUyRFx1NkI2Mlx1NjVFN1x1OEJGN1x1NkM0Mlx1OEJBOVx1OERFRlx1RkYwOFx1NTQwNFx1NEYxQVx1OEJERFx1NTNFRlx1NzJFQ1x1N0FDQlx1NEYxOFx1NTMxNlx1RkYwQ1x1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NEYxQVx1OEJERFx1NzUzMSBjYW5jZWwgXHU2NTM2XHU1QzNFXHVGRjA5XG4gIGNvbnN0IHNlc3Npb25JZCA9IGN0eC5nZXRTZXNzaW9uSWQ/LigpID8/IG51bGw7XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSB7XG4gICAgaWYgKHNlc3Npb25JZCA9PT0gYWN0aXZlU2Vzc2lvbklkKSByZXR1cm47XG4gICAgYWN0aXZlQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gIH1cbiAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2JlZ2luJywgc2Vzc2lvbklkIH0pO1xuXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGFjdGl2ZUNvbnRyb2xsZXIgPSBjb250cm9sbGVyOyAvLyBcdTZDRThcdTUxOENcdTdFRDkgY2xvc2VQcmV2aWV3KClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgYWN0aXZlU2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICBsZXQgdGltZWRPdXQgPSBmYWxzZTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgY29udHJvbGxlci5hYm9ydCgpO1xuICB9LCBSRVFVRVNUX1RJTUVPVVRfTVMpO1xuXG4gIHRyeSB7XG4gICAgLy8gXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU1QkY5XHU4QkREXHU5MDFBXHU5MDUzIFx1MjAxNFx1MjAxNCBcdTk2RjZcdTkxNERcdTdGNkVcdUZGMENcdTY1RTBcdTk3MDAgY2hlY2tDb25maWdcbiAgICBpZiAoY29uZmlnLnVzZVNlc3Npb25Nb2RlbCAmJiBjdHguaG9zdCkge1xuICAgICAgYXdhaXQgcnVuSG9zdE9wdGltaXplKHtcbiAgICAgICAgcnBjOiBjdHguaG9zdC5ycGMsXG4gICAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBzeXN0ZW06IGJ1aWxkU3lzdGVtUHJvbXB0KGN0eC5nZXRMYW5nKCkpLFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkRlbHRhOiAodGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2RyYWZ0JywgdGV4dCB9KSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSksXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA4XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCL1x1NUJCRlx1NEUzQlx1NEUwRFx1NTNFRlx1NzUyOFx1OTY0RFx1N0VBN1x1RkYwOVx1NjI0RFx1ODk4MVx1NkM0Mlx1OTE0RFx1N0Y2RVxuICAgIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2d1aWRlJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMUFcdTZENEZcdTg5QzhcdTU2NjggZmV0Y2ggXHU3NkY0XHU4RkRFXHU4MUVBXHU5MTREIEFQSVx1RkYwOFx1NkQ0MVx1NUYwRlx1RkYwOVxuICAgIC8vIFx1NkEyMVx1NTc4Qlx1ODlFM1x1Njc5MFx1RkYxQXVzZVNlc3Npb25Nb2RlbFx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1MjE5MiBcdTVCQkZcdTRFM0JcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTRFQzVcdTRGNUMgbW9kZWwgXHU1NDBEXHU1NkRFXHU5MDAwXHU0RjdGXHU3NTI4XHVGRjBDXHU5NzAwXHU5MTREXHU3RjZFXHU1REYyXHU1QzMxXHU3RUVBXHVGRjA5XHVGRjFCXHU1NDI2XHU1MjE5IFx1MjE5MiBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcbiAgICBsZXQgbW9kZWwgPSBjb25maWcubW9kZWw7XG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25Nb2RlbCA9IGF3YWl0IGN0eC5nZXRTZXNzaW9uTW9kZWw/LigpO1xuICAgICAgaWYgKHNlc3Npb25Nb2RlbCAmJiBzZXNzaW9uTW9kZWwubW9kZWwpIG1vZGVsID0gc2Vzc2lvbk1vZGVsLm1vZGVsO1xuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAgIC8vIFx1NUM1NVx1NzkzQVx1N0QyRlx1NzlFRlx1RkYxQVx1NkI2M1x1NjU4N1x1NEYxOFx1NTE0OFx1RkYxQlx1NkI2M1x1NjU4N1x1NUMxQVx1NjcyQVx1NTFGQVx1NzNCMFx1RkYwOHY0IFx1N0NGQlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNVx1NjNBOFx1NzQwNlx1RkYwOVx1NjVGNlx1NUM1NVx1NzkzQVx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwQ1x1OEJBOVx1NkQ0MVx1NUYwRlx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgIGxldCByZWFzb25pbmcgPSAnJztcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzaG93biA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcHRpbWl6ZVN0cmVhbSh7XG4gICAgICAgIGNvbmZpZzogZWZmZWN0aXZlLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgY29udGVudCArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFzb25pbmcgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0OiBzaG93biB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gXHU1MTQ4XHU1MjI0XHU1QjlBXHU0RTJEXHU2QjYyXHVGRjFBXHU3NTI4XHU2MjM3L1x1N0VDNFx1NEVGNlx1NTNENlx1NkQ4OFx1NEUwRVx1OEQ4NVx1NjVGNlx1OTBGRFx1ODg2OFx1NzNCMFx1NEUzQSBBYm9ydEVycm9yXHVGRjFCXHU0RUM1XHU4RDg1XHU2NUY2XHU1MTk5XHU1MTY1XHU5NTE5XHU4QkVGXHU2MDAxXG4gICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBcdTk4NzZcdTVDNDJcdTUxNUNcdTVFOTVcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTMgcmVqZWN0IFx1NURGMlx1ODhBQiAudGhlbiBcdTZEODhcdTUzMTZcdUZGMUJcdTZCNjRcdTU5MDRcdTRGRERcdTYyQTQgZmV0Y2ggXHU1MjA2XHU2NTJGXHU0RUU1XHU1OTE2XHU3Njg0XHU2MTBGXHU1OTE2XHU1RjAyXHU1RTM4XHVGRjA5XG4gICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhY3RpdmVDb250cm9sbGVyID09PSBjb250cm9sbGVyKSB7XG4gICAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2NhcmQuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWNhcmQge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDEycHg7XG4gIHJpZ2h0OiAxMnB4O1xuICBib3R0b206IGNhbGMoMTAwJSArIDhweCk7XG4gIHotaW5kZXg6IDQwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctb3ZlcmxheSwgI2ZmZik7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsIHJnYmEoMTI4LDEyOCwxMjgsMC4zKSk7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIGJveC1zaGFkb3c6IDAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjE2KTtcbiAgcGFkZGluZzogMTJweCAxNHB4O1xuICBtYXgtaGVpZ2h0OiAzMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4uZHNoLXBvLWNhcmQtaGVhZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuLmRzaC1wby1jYXJkLWJvZHkge1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzQ0NCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDEuNjtcbiAgbWF4LWhlaWdodDogMjAwcHg7XG59XG4uZHNoLXBvLWNhcmQtZXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLmRzaC1wby1jYXJkLXJvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBmbGV4LXdyYXA6IHdyYXA7XG59XG4uZHNoLXBvLWNhcmQtYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMHB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbn1cbi5kc2gtcG8tY2FyZC1idG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQS0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnkgXHU1NzI4XHU2REYxXHU1OTFDXHU2QTIxXHU1RjBGXHU4OUUzXHU2NzkwXHU0RTNBXHU2RDQ1XHU4MjcyIFx1MjE5MiBcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTRFMERcdTUzRUZcdThCRkJcdUZGMDhcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDkgKi9cbiAgY29sb3I6ICNmZmY7XG4gIGJhY2tncm91bmQ6ICMxNjc3ZmY7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuLyoqIFx1NjI3RSBjb21wb3NlciBcdThGOTNcdTUxNjVcdTY4NDZcdUZGMUFcdTRGMThcdTUxNDhcdTcxMjZcdTcwQjlcdUZGMENcdTU0MjZcdTUyMTlcdTdCMkNcdTRFMDBcdTRFMkFcdTk3NUUgZGlzYWJsZWQgdGV4dGFyZWEgKi9cbmZ1bmN0aW9uIGZpbmRDb21wb3NlcigpOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50ICYmICFhY3RpdmUuZGlzYWJsZWQpIHJldHVybiBhY3RpdmU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKCF0YS5kaXNhYmxlZCkgcmV0dXJuIHRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkQ29tcG9zZXJUZXh0KCk6IHN0cmluZyB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIHJldHVybiB0YSA/IHRhLnZhbHVlIDogJyc7XG59XG5cbi8qKiBcdTc1MjhcdTUzOUZcdTc1MUYgdmFsdWUgc2V0dGVyIFx1NTE5OVx1NTZERVx1RkYwQ1x1OEJBOSBSZWFjdCBcdTUzRDdcdTYzQTdcdTdFQzRcdTRFRjZcdTYxMUZcdTc3RTVcdUZGMDhcdTUxOERcdTZEM0VcdTUzRDEgaW5wdXQgXHU0RThCXHU0RUY2XHU4OUU2XHU1M0QxIG9uQ2hhbmdlXHVGRjA5ICovXG5mdW5jdGlvbiB3cml0ZUNvbXBvc2VyVGV4dCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgdGEgPSBmaW5kQ29tcG9zZXIoKTtcbiAgaWYgKCF0YSkgcmV0dXJuO1xuICBjb25zdCBzZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxUZXh0QXJlYUVsZW1lbnQucHJvdG90eXBlLCAndmFsdWUnKT8uc2V0O1xuICBpZiAoc2V0dGVyKSB7XG4gICAgc2V0dGVyLmNhbGwodGEsIHRleHQpO1xuICB9IGVsc2Uge1xuICAgIHRhLnZhbHVlID0gdGV4dDtcbiAgfVxuICB0YS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICB0YS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBlcnJvcktleShraW5kOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHtcbiAgc3dpdGNoIChraW5kKSB7XG4gICAgLy8ga2luZCBcdTIxOTIgbG9jYWxlIGtleVx1RkYxQidjb25maWcnIFx1NTcyOCBVSSBcdTRFMEFcdTRFMERcdTUzRUZcdThGQkVcdUZGMDhydW5PcHRpbWl6ZSBcdTUxNDhcdThENzAgZ3VpZGVcdUZGMDlcdUZGMENBYm9ydEVycm9yXHUyMTkydGltZW91dCBcdTc1MzEgcnVuT3B0aW1pemUgXHU1MTQ4XHU4ODRDXHU2MkU2XHU2MjJBXHVGRjBDXHU0RkREXHU3NTU5XHU1M0NDXHU0RkREXHU5NjY5XG4gICAgY2FzZSAndW5hdXRob3JpemVkJzogY2FzZSAnZm9yYmlkZGVuJzogY2FzZSAndGltZW91dCc6IGNhc2UgJ25ldHdvcmsnOiBjYXNlICdjb3JzJzogY2FzZSAnaHR0cCc6IGNhc2UgJ2JhZC1yZXNwb25zZSc6IGNhc2UgJ2VtcHR5JzogY2FzZSAnY29uZmlnJzpcbiAgICAgIHJldHVybiBgZXJyb3IuJHtraW5kfWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnZXJyb3IubmV0d29yayc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByZXZpZXdDYXJkKHByb3BzOiBQcmV2aWV3Q2FyZFByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBvcGVuU2V0dGluZ3MsIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCwgZ2V0U2Vzc2lvbklkIH0gPSBwcm9wcztcblxuICAvLyBcdThCQTJcdTk2MDVcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhcdTY2RkZcdTRFRTNcdTRGMUFcdThCREQgc3RvcmUgcHJvcHNcdUZGMDlcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKSk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldFN0YXRlKGdldFByZXZpZXdCdXNTdGF0ZSgpKSksXG4gICAgW10sXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgLy8gXHU1Mzc4XHU4RjdEXHU2NUY2XHU2RTA1XHU3NDA2XHVGRjFBXHU2RTA1XHU5NjY0XHU2MzAyXHU4RDc3XHU3Njg0IGNvcGllZCBcdTU5MERcdTRGNERcdTVCOUFcdTY1RjZcdTU2NjhcdUZGMENcdTVFNzZcdTY4MDdcdThCQjBcdTY3MkFcdTYzMDJcdThGN0RcdUZGMENcbiAgLy8gXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNldENvcGllZCh0cnVlKVx1RkYwOGNvcHkgXHU3Njg0IGF3YWl0IFx1NjcxRlx1OTVGNFx1NTM3OFx1OEY3RFx1RkYwOVx1NTcyOFx1NTM3OFx1OEY3RFx1NTQwRVx1ODlFNlx1NTNEMVx1MzAwMlxuICBjb25zdCBtb3VudGVkUmVmID0gdXNlUmVmKHRydWUpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgY29uc3QgeyBzdGF0dXMsIHJlc3VsdCwgZXJyb3JLaW5kIH0gPSBzdGF0ZTtcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29weVRpbWVyUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1RkYxQVx1NTIwN1x1NjM2Mlx1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NEUwRFx1OERERlx1OTY4Rlx1NjYzRVx1NzkzQVx1RkYwOFx1NTIwN1x1NTZERVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1NjA2Mlx1NTkwRFx1RkYwOVxuICBpZiAoc3RhdHVzICE9PSAnaWRsZScgJiYgc3RhdGUuc2Vzc2lvbklkICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc2lkID0gZ2V0U2Vzc2lvbklkPy4oKTtcbiAgICBpZiAoc2lkICE9PSBudWxsICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gc2lkKSByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoc3RhdHVzID09PSAnaWRsZScpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHJldHJ5ID0gKCkgPT4ge1xuICAgIHZvaWQgcnVuT3B0aW1pemUoeyBnZXRDb25maWcsIGdldExhbmcsIGdldERyYWZ0OiAoKSA9PiByZWFkQ29tcG9zZXJUZXh0KCksIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCwgZ2V0U2Vzc2lvbklkIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgd3JpdGVDb21wb3NlclRleHQocmVzdWx0KTtcbiAgICBjbG9zZVByZXZpZXcoKTtcbiAgfTtcblxuICBjb25zdCBjb3B5ID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuOyAvLyBcdTk3NUVcdTVCODlcdTUxNjhcdTRFMEFcdTRFMEJcdTY1ODdcdUZGMDhodHRwIFx1N0I0OVx1RkYwOVx1RkYxQVx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMENcdTRGRERcdTYzMDFcdTUzRUZcdTkxQ0RcdThCRDVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0KTtcbiAgICAgIGlmICghbW91bnRlZFJlZi5jdXJyZW50KSByZXR1cm47IC8vIGF3YWl0IFx1NjcxRlx1OTVGNFx1N0VDNFx1NEVGNlx1NURGMlx1NTM3OFx1OEY3RFx1RkYxQVx1NEUwRFx1NTE4RCBzZXRTdGF0ZVxuICAgICAgc2V0Q29waWVkKHRydWUpO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHNldENvcGllZChmYWxzZSk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH0sIDEyMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjZBXHU4RDM0XHU2NzdGXHU1MTk5XHU1MTY1XHU1OTMxXHU4RDI1XHVGRjFBXHU5NzU5XHU5RUQ4XHVGRjA4XHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwOVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmRcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWhlYWRcIj5cbiAgICAgICAgPHNwYW4+e3QoJ2NhcmQudGl0bGUnKX08L3NwYW4+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGNsb3NlUHJldmlldygpOyBvcGVuU2V0dGluZ3MoKTsgfX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5hY3Rpb24nKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ29wdGltaXppbmcnICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+XG4gICAgICAgICAge3N0YXRlLmRyYWZ0ID8gPHNwYW4gc3R5bGU9e3sgd2hpdGVTcGFjZTogJ3ByZS13cmFwJyB9fT57c3RhdGUuZHJhZnR9PC9zcGFuPiA6IHQoJ2NhcmQub3B0aW1pemluZycpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdwcmV2aWV3JyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3Jlc3VsdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXBsYWNlfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmVwbGFjZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiB2b2lkIGNvcHkoKX0+XG4gICAgICAgICAgICAgIHtjb3BpZWQgPyB0KCdjYXJkLmNvcHlEb25lJykgOiB0KCdjYXJkLmNvcHknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyXCI+e3QoZXJyb3JLZXkoZXJyb3JLaW5kKSl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59IiwgIi8qKiBcdThCQkVcdTdGNkUgXHUyMTkyIEdlbmVyYWwgXHU1MzNBXHUzMDBDUHJvbXB0IFx1NEYxOFx1NTMxNlx1MzAwRFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYxQVx1NjgwN1x1OTg5OFx1NjQ1OFx1ODk4MSArIFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NSAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybVN0YXRlLCBTZXR0aW5nc0Zvcm1WYWx1ZXMgfSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1BY3Rpb25zIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgeyBvbk9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NSb3dQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICB1c2VTdG9yZTogPFQ+KHNlbGVjdG9yOiAoczogU2V0dGluZ3NGb3JtU3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IFNldHRpbmdzRm9ybUFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBzYXZlQ29uZmlnOiAodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IFByb21pc2U8dm9pZD47XG4gIHJlc2V0Q29uZmlnOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBnZXRFcG9jaDogKCkgPT4gbnVtYmVyO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvc2V0dGluZ3MuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4ub3B0aVNldHRpbmdzIHtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBwYWRkaW5nOiAxNnB4IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLm9wdGlTZXR0aW5nc1RpdGxlIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMjJweDtcbn1cbi5vcHRpU2V0dGluZ3NIaW50IHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NGb3JtIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG4gIG1hcmdpbi10b3A6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NGaWVsZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0xhYmVsIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzSW5wdXQge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctbGF5ZXItMik7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIHBhZGRpbmc6IDZweCA4cHg7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5vcHRpU2V0dGluZ3NSb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ge1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgcGFkZGluZzogNHB4IDEycHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xNCkpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xufVxuLm9wdGlTZXR0aW5nc0J0bi5wcmltYXJ5IHtcbiAgLyogXHU1MTk5XHU2QjdCXHU0RTNCXHU4MjcyXHVGRjFBXHU0RTNCXHU5ODk4XHU1M0Q4XHU5MUNGXHU1NzI4XHU2REYxXHU1OTFDXHU2QTIxXHU1RjBGXHU0RjFBXHU4OUUzXHU2NzkwXHU0RTNBXHU2RDQ1L1x1NkRGMVx1Njc4MVx1N0FFRlx1ODI3Mlx1RkYwOFx1OUVEMVx1NUU5NVx1OUVEMVx1NUI1N1x1MzAwMVx1NzY3RFx1NUU5NVx1NzY3RFx1NUI1N1x1NTc0N1x1ODhBQlx1NzUyOFx1NjIzN1x1NUI5RVx1NkQ0Qlx1RkYwOVx1RkYwQ1xuICAgICBcdTU2RkFcdTVCOUFcdTU0QzFcdTcyNENcdTg0REQgKyBcdTc2N0RcdTVCNTdcdTRGRERcdThCQzFcdTRFRkJcdTRGNTVcdTRFM0JcdTk4OThcdTUzRUZcdThCRkIgKi9cbiAgY29sb3I6ICNmZmY7XG4gIGJhY2tncm91bmQ6ICMxNjc3ZmY7XG59XG4ub3B0aVNldHRpbmdzRXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZXR0aW5nc1Jvdyhwcm9wczogU2V0dGluZ3NSb3dQcm9wcykge1xuICBjb25zdCB7IHQsIHVzZVN0b3JlLCBhY3Rpb25zLCBnZXRDb25maWcsIHNhdmVDb25maWcsIHJlc2V0Q29uZmlnLCBnZXRFcG9jaCB9ID0gcHJvcHM7XG4gIGNvbnN0IFtleHBhbmRlZCwgc2V0RXhwYW5kZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc3VibWl0UmV2aXNpb24sIHNldFN1Ym1pdFJldmlzaW9uXSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IHZhbHVlcyA9IHVzZVN0b3JlKChzKSA9PiBzLnZhbHVlcyk7XG4gIGNvbnN0IHNhdmVkID0gdXNlU3RvcmUoKHMpID0+IHMuc2F2ZWQpO1xuICBjb25zdCBlcnJvciA9IHVzZVN0b3JlKChzKSA9PiBzLmVycm9yKTtcbiAgLy8gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RSBSUEMgXHU1OTMxXHU4RDI1XHU2NUY2XHU2NjNFXHU3OTNBXHU3Njg0XHU1MzlGXHU1OUNCXHU5NTE5XHU4QkVGXHVGRjA4XHU0RTBEXHU1MThEXHU5NzU5XHU5RUQ4XHU1OTMxXHU4RDI1XHVGRjFBc2V0dGluZ3MgXHU1MTk5XHU1MTY1XHU1MUZBXHU5NTE5XHU1RkM1XHU5ODdCXHU4QkE5XHU3NTI4XHU2MjM3XHU3NzBCXHU1Rjk3XHU1MjMwXHVGRjA5XG4gIGNvbnN0IFtycGNFcnJvciwgc2V0UnBjRXJyb3JdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgY29uZmlnID0gZ2V0Q29uZmlnKCk7XG4gIGNvbnN0IG1vZGVsTGFiZWwgPSBjb25maWcubW9kZWwgPyBjb25maWcubW9kZWwgOiAnXHUyMDE0JztcblxuICAvLyBcdTk5OTZcdTZCMjFcdTYzMDJcdThGN0QgLyBcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTY1RjZcdTYyOEFcdTVGNTNcdTUyNERcdTkxNERcdTdGNkVcdTY0QURcdTc5Q0RcdThGREJcdTg4NjhcdTUzNTVcdTMwMDJcbiAgLy8gc2VlZCBcdTRGRUVcdThCQTJcdTUzRjcgPSBcdTY3MkNcdTU3MzBcdTYzRDBcdTRFQTRcdTVFOEZcdTUzRjcgc3VibWl0UmV2aXNpb24gKyBjb25maWdFcG9jaFx1RkYwOFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1N0VBQVx1NTE0M1x1RkYwOVx1RkYxQVxuICAvLyAgLSBcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdUZGMDhcdThERThcdTY4MDdcdTdCN0VcdTk4NzUvXHU1OTE2XHU5MEU4XHU1MTk5XHU1MTY1IFx1MjE5MiBpbmRleC50cyByZWZyZXNoQ29uZmlnIFx1NzY4NFx1N0VBQVx1NTE0M1x1OTAxMlx1NTg5RVx1RkYwOVx1NEVFNFx1NEZFRVx1OEJBMlx1NTNGN1x1OEQ4NVx1OEZDN1xuICAvLyAgICBzdGF0ZS5yZXZpc2lvblx1RkYwQ1x1OTFDRFx1NjRBRFx1NzlDRFx1NzUxRlx1NjU0OFx1RkYwQ1x1ODg2OFx1NTM1NVx1OERERlx1NEUwQVx1NUY1Mlx1NEUwMFx1NTMxNlx1NTQwRVx1NzY4NFx1OTU1Q1x1NTBDRlx1RkYxQlxuICAvLyAgLSBcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFXHU1REYyXHU5MDFBXHU4RkM3IGNvbW1pdC9zZWVkIFx1NTE5OVx1NTE2NVx1MzAwQ1x1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1NUY1M1x1NjVGNlx1N0VBQVx1NTE0M1x1MzAwRFx1NzY4NFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwQ1x1N0QyN1x1NjNBNVx1NzY4NFx1NjcyQ1x1NkIyMVx1NjU0OFx1NUU5NFxuICAvLyAgICBcdTU2REVcdThERDFcdUZGMDhcdTdFQUFcdTUxNDNcdTY3MkFcdTUzRDhcdUZGMDlcdTRGRUVcdThCQTJcdTUzRjdcdTc2RjhcdTdCNDlcdTg4QUIgcmVkdWNlciBcdTYyOTFcdTUyMzYgXHUyMTkyIFx1NEZERFx1NEY0Rlx1NzUyOFx1NjIzN1x1NTM5Rlx1NTlDQlx1OEY5M1x1NTE2NVx1NEUwRVx1MzAwQ1x1NURGMlx1NEZERFx1NUI1OFx1MzAwRFx1NjNEMFx1NzkzQVx1RkYxQlxuICAvLyAgICBcdTRFMEJcdTZCMjFcdTY3MkNcdTU3MzBcdTUyQThcdTRGNUNcdUZGMDhlZGl0L2NvbW1pdFx1RkYwOVx1NTE4RFx1NjI4QSBzdGF0ZS5yZXZpc2lvbiBcdTYyQUNcdTUyMzBcdTRFMEVcdTdFQUFcdTUxNDNcdTRFMDBcdTgxRjRcdTMwMDJcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBhY3Rpb25zLnNlZWQoXG4gICAgICB7IGJhc2VVcmw6IGNvbmZpZy5iYXNlVXJsLCBhcGlLZXk6IGNvbmZpZy5hcGlLZXksIG1vZGVsOiBjb25maWcubW9kZWwgfSxcbiAgICAgIHN1Ym1pdFJldmlzaW9uICsgZ2V0RXBvY2goKSxcbiAgICApO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgfSwgW2NvbmZpZy5iYXNlVXJsLCBjb25maWcuYXBpS2V5LCBjb25maWcubW9kZWwsIGdldEVwb2NoXSk7XG5cbiAgLy8gXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHVGRjA4XHU5ODg0XHU4OUM4XHU1MzYxXHU2NzJBXHU5MTREXHU3RjZFXHU1RjE1XHU1QkZDXHVGRjA5XHUyMTkyIFx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KCgpID0+IHNldEV4cGFuZGVkKHRydWUpKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgY29uc3QgZXJyb3JzID0gYWN0aW9ucy52YWxpZGF0ZSh2YWx1ZXMpO1xuICAgIGlmIChlcnJvcnMpIHtcbiAgICAgIGFjdGlvbnMuZmFpbChPYmplY3QudmFsdWVzKGVycm9ycylbMF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2F2ZUNvbmZpZyh2YWx1ZXMpO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICAgIC8vIFx1NEUwRVx1NjU0OFx1NUU5NFx1NTZERVx1OEREMVx1NzY4NCBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwOFx1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1N0VBQVx1NTE0M1x1RkYwOVx1NUJGOVx1OUY1MFx1RkYwQ1x1NEY3Rlx1NEZERFx1NUI1OFx1NTQwRVx1NzY4NFx1OTFDRFx1NjRBRFx1NzlDRFx1ODhBQlx1NjI5MVx1NTIzNlxuICAgICAgYWN0aW9ucy5jb21taXQoc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnNhdmVGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUmVzZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJlc2V0Q29uZmlnKCk7XG4gICAgICBhY3Rpb25zLnNlZWQoXG4gICAgICAgIHsgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCwgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksIG1vZGVsOiBERUZBVUxUUy5tb2RlbCB9LFxuICAgICAgICBzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpLFxuICAgICAgKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnJlc2V0RmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzVGl0bGVcIiBvbkNsaWNrPXsoKSA9PiBzZXRFeHBhbmRlZCgodikgPT4gIXYpfSBzdHlsZT17eyBjdXJzb3I6ICdwb2ludGVyJyB9fT5cbiAgICAgICAge3QoJ3NldHRpbmdzLnRpdGxlJyl9XG4gICAgICAgIHshZXhwYW5kZWQgJiZcbiAgICAgICAgICAodmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KCdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJyl9PC9zcGFuPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCh2YWx1ZXMuYXBpS2V5ID8gJ2NhcmQuY29uZmlndXJlZC5oaW50JyA6ICdjYXJkLnVuY29uZmlndXJlZC5oaW50JykucmVwbGFjZSgne21vZGVsfScsIG1vZGVsTGFiZWwpfTwvc3Bhbj5cbiAgICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7ZXhwYW5kZWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0Zvcm1cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICBjaGVja2VkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCd1c2VTZXNzaW9uTW9kZWwnLCBlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgLz57JyAnfVxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJyl9XG4gICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50Jyl9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdiYXNlVXJsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1hcGkta2V5XCI+e3QoJ3NldHRpbmdzLmFwaUtleScpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWFwaS1rZXlcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYXBpS2V5fVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cInNrLVx1MjAyNlwiXG4gICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYXBpS2V5JywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1tb2RlbFwiPnt0KCdzZXR0aW5ncy5tb2RlbCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLW1vZGVsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLm1vZGVsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/ICdcdTIwMTQnIDogREVGQVVMVFMubW9kZWx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYxQVx1NEYxOFx1NTMxNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVybCA9IHZhbHVlcy5iYXNlVXJsLnRyaW0oKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdmFsdWVzLmFwaUtleS50cmltKCkpIGVycm9ycy5hcGlLZXkgPSAnc2V0dGluZ3MuYXBpS2V5JztcbiAgaWYgKCF2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsICYmICF2YWx1ZXMubW9kZWwudHJpbSgpKSBlcnJvcnMubW9kZWwgPSAnc2V0dGluZ3MubW9kZWwnO1xuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RhdGUge1xuICB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcztcbiAgZGlydHk6IGJvb2xlYW47XG4gIHNhdmVkOiBib29sZWFuO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aXNpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IElOSVRJQUxfU0VUVElOR1NfRk9STTogU2V0dGluZ3NGb3JtU3RhdGUgPSB7XG4gIHZhbHVlczogeyBiYXNlVXJsOiAnJywgYXBpS2V5OiAnJywgbW9kZWw6ICcnLCB1c2VTZXNzaW9uTW9kZWw6IHRydWUgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIH1cbiAgfCB7IHR5cGU6ICdjb21taXQnOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsgbWVzc2FnZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VTZXR0aW5nc0Zvcm0oc3RhdGU6IFNldHRpbmdzRm9ybVN0YXRlLCBhY3Rpb246IFNldHRpbmdzRm9ybUFjdGlvbik6IFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ3NlZWQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5yZXZpc2lvbiA8PSBzdGF0ZS5yZXZpc2lvblxuICAgICAgICA/IHN0YXRlXG4gICAgICAgIDogeyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLmFjdGlvbi52YWx1ZXMgfSwgZGlydHk6IGZhbHNlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZWRpdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLnN0YXRlLnZhbHVlcywgW2FjdGlvbi5maWVsZF06IGFjdGlvbi52YWx1ZSB9LCBkaXJ0eTogdHJ1ZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xuICAgIGNhc2UgJ2NvbW1pdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBlcnJvcjogYWN0aW9uLm1lc3NhZ2UgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1VPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxpQkFBaUI7QUFDbkI7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFP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O0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
