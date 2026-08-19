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
  "settings.hostProbe": "\u5BBF\u4E3B\u901A\u9053\u63A2\u6D4B\u4E2D\u2026",
  "settings.hostOk": "\u4F1A\u8BDD\u6A21\u578B\u901A\u9053 \u2713",
  "settings.hostFail": "\u4F1A\u8BDD\u6A21\u578B\u901A\u9053\u4E0D\u53EF\u7528\uFF1A",
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
  "settings.hostProbe": "probing host channel\u2026",
  "settings.hostOk": "session model channel \u2713",
  "settings.hostFail": "session model channel unavailable: ",
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
async function callHost(method, args) {
  const response = await fetch(`/dsh-prompt-optimizer/api/${encodeURIComponent(method)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args)
  });
  return await response.json();
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
async function readSseFrames(response, onFrame) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("no-stream");
  const decoder = new TextDecoder();
  let buffer = "";
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (; ; ) {
      const idx = buffer.indexOf("\n\n");
      if (idx === -1) break;
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      onFrame(event, data);
    }
  }
}
async function streamHostOptimize(opts) {
  const { rpc, text, system, signal, onDelta, onReasoning, onStep } = opts;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (signal.aborted) throw new Error("aborted");
  onStep?.("model");
  const session = await resolveHostSessionModel(rpc, opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS);
  if (!session) throw new Error("host-unavailable");
  onStep?.("start");
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener("abort", onAbort);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let out = "";
  try {
    const response = await fetch("/dsh-prompt-optimizer/api/optimize.stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: session.provider,
        model: session.model,
        text,
        system,
        ...session.reasoningEffort ? { reasoningEffort: session.reasoningEffort } : {}
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`http-${response.status}`);
    onStep?.("poll");
    let reasoning = "";
    await readSseFrames(response, (event, data) => {
      if (data === "{}" || data === "[DONE]") return;
      if (event === "reasoning") {
        reasoning += data;
        onReasoning?.(reasoning);
      } else if (event === "delta") {
        out += data;
        onDelta(out);
      }
    });
    if (signal.aborted) throw new Error("aborted");
    return out;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", onAbort);
  }
}

// src/preview-state.ts
var INITIAL_PREVIEW = {
  status: "idle",
  result: "",
  errorKind: null,
  errorDetail: null,
  generation: 0,
  draft: "",
  reasoning: "",
  sessionId: null,
  step: null
};
function reducePreview(state2, action) {
  switch (action.type) {
    case "begin":
      if (state2.status === "optimizing") return state2;
      return {
        ...state2,
        status: "optimizing",
        errorKind: null,
        errorDetail: null,
        draft: "",
        sessionId: action.sessionId ?? null,
        step: "model",
        generation: state2.generation + 1
      };
    case "show":
      return state2.status === "optimizing" ? { ...state2, status: "preview", result: action.result, draft: "" } : state2;
    case "fail":
      return state2.status === "optimizing" ? { ...state2, status: "error", errorKind: action.kind, errorDetail: action.detail ?? null } : state2;
    case "guide":
      return state2.status === "optimizing" ? state2 : { ...state2, status: "guide" };
    case "close":
      return INITIAL_PREVIEW;
    case "draft":
      return state2.status === "optimizing" ? { ...state2, draft: action.text } : state2;
    case "reasoning":
      return state2.status === "optimizing" ? { ...state2, reasoning: action.text } : state2;
    case "step":
      return state2.status === "optimizing" ? { ...state2, step: action.step } : state2;
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
  if (!draft) {
    return;
  }
  const sessionId = ctx.getSessionId?.() ?? null;
  if (activeController !== null) {
    if (sessionId === activeSessionId) {
      return;
    }
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
      await streamHostOptimize({
        rpc: ctx.host.rpc,
        text: draft,
        system: buildSystemPrompt(ctx.getLang()),
        signal: controller.signal,
        rpcTimeoutMs: 5e3,
        onDelta: (text) => dispatchPreview({ type: "draft", text }),
        onReasoning: (text) => dispatchPreview({ type: "reasoning", text }),
        onStep: (step) => dispatchPreview({ type: "step", step })
      }).then(
        (finalText) => {
          dispatchPreview({ type: "show", result: finalText });
        },
        (e) => {
          const isAbort = e instanceof DOMException && e.name === "AbortError" || typeof e?.name === "string" && e.name === "AbortError";
          if (isAbort) {
            if (timedOut) dispatchPreview({ type: "fail", kind: "timeout" });
            return;
          }
          const kind = toErrorKind(e).kind;
          dispatchPreview({ type: "fail", kind, detail: String(e?.message ?? e) });
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
      host: getHost?.(),
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
.dsh-po-card-step {
  color: var(--dsw-alias-text-secondary, #8c93a1);
  font-size: 12px;
  margin-left: 4px;
}
.dsh-po-card-err-detail {
  margin-top: 4px;
  color: var(--dsw-alias-text-secondary, #8c93a1);
  font-size: 12px;
  word-break: break-all;
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
    void runOptimize({
      getConfig,
      getLang,
      getDraft: () => readComposerText(),
      getSessionModel,
      host: getHost?.() ?? void 0,
      getSessionId
    });
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
    status === "optimizing" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-body", children: [
      state2.reasoning && !state2.draft ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "span",
        {
          style: {
            whiteSpace: "pre-wrap",
            color: "var(--dsw-alias-text-secondary, #8c93a1)",
            fontSize: "12px"
          },
          children: state2.reasoning
        }
      ) : null,
      state2.draft ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { whiteSpace: "pre-wrap" }, children: state2.draft }) : null,
      !state2.draft && !state2.reasoning ? t("card.optimizing") : null
    ] }),
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
      errorDetail ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-err-detail", children: errorDetail }) : null,
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
  const { t, useStore, actions, getConfig, saveConfig, resetConfig, getEpoch, getHostStatus } = props;
  const [hostStatus, setHostStatus] = (0, import_react3.useState)(null);
  (0, import_react3.useEffect)(() => {
    if (!getHostStatus) return;
    let alive = true;
    getHostStatus().then((st) => {
      if (alive) setHostStatus(st);
    }).catch(() => {
      if (alive) setHostStatus({ available: false, error: "rpc-failed" });
    });
    return () => {
      alive = false;
    };
  }, [getHostStatus]);
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
      { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model, useSessionModel: config.useSessionModel },
      submitRevision + getEpoch()
    );
  }, [config.baseUrl, config.apiKey, config.model, config.useSessionModel, getEpoch]);
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
      getHostStatus && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "optiSettingsField", style: { flexDirection: "row" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "span",
        {
          className: "optiSettingsHint",
          style: {
            color: hostStatus?.available ? "var(--dsw-alias-state-success-primary, #2f9e63)" : "var(--dsw-alias-state-error-primary, #d03050)"
          },
          children: hostStatus === null ? t("settings.hostProbe") : hostStatus.available ? `${t("settings.hostOk")} ${hostStatus.provider}/${hostStatus.model}` : `${t("settings.hostFail")} ${hostStatus.error ?? ""}`
        }
      ) }),
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
    call: (endpoint, payload) => callHost(endpoint, payload ?? {})
  };
  const getHost = () => ({ rpc: hostRpc });
  const getSessionModel = async () => {
    try {
      const res = await withTimeout(callHost("sessionModel", {}), 5e3, "sessionModel");
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
            getEpoch: () => configEpoch,
            getHostStatus: async () => {
              try {
                const res = await withTimeout(callHost("sessionModel", {}), 5e3, "sessionModel");
                if (res.ok && res.value && typeof res.value === "object") {
                  const v = res.value;
                  if (typeof v.provider === "string" && typeof v.model === "string") {
                    return { available: true, provider: v.provider, model: v.model };
                  }
                  return { available: false, error: res.error && (res.error.details ?? res.error.code) || "no-model" };
                }
                return { available: false, error: res.error && (res.error.details ?? res.error.code) || "rpc-failed" };
              } catch (e) {
                return { available: false, error: String(e?.message ?? e) };
              }
            }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL3NldHRpbmdzLXN0b3JlLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1mb3JtLXN0YXRlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKiogZHNoLXByb21wdC1vcHRpbWl6ZXIgXHU2M0QyXHU0RUY2XHU1MTY1XHU1M0UzIFx1MjAxNCBhcHBseShjdHgpICovXG5cbmltcG9ydCB0eXBlIHsgQ2xpZW50Q29udGV4dCB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMsIG1lcmdlQ29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgTlMsIHpoLCBlbiwgbGFuZ09mIH0gZnJvbSAnLi9sb2NhbGVzLmpzJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB0eXBlIHsgSG9zdFJwYyB9IGZyb20gJy4vc2Vzc2lvbi1vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgd2l0aFRpbWVvdXQsIGNhbGxIb3N0IH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5cbi8qKlxuICogXHU1OEYwXHU2NjBFXHU2M0QyXHU0RUY2XHU0RjlEXHU4RDU2XHU3Njg0XHU1QkEyXHU2MjM3XHU3QUVGXHU2NzBEXHU1MkExXHVGRjA4Y29yZGlzIHNlcnZpY2Uga2V5c1x1RkYwOVx1RkYxQWFwcGx5IFx1NTE4NVx1N0VDRiBgY3R4LjxzZXJ2aWNlPmAgXHU4QkJGXHU5NUVFXHU3Njg0XHU2NzBEXHU1MkExXHU1RkM1XHU5ODdCXHU1NzI4XHU2QjY0XHU1OEYwXHU2NjBFXHUzMDAyXG4gKiBcdTUwM0NcdTk4N0JcdTRFM0FcdTY3MERcdTUyQTFcdTU0MERcdTgwMENcdTk3NUVcdTUzMDUgaWRcdTIwMTRcdTIwMTRcdTRFMEVcdTU0MENcdTVGNjJcdTYwMDFcdTUxNDhcdTRGOEJcdTRFMDBcdTgxRjRcdUZGMDhkc2gtbWVzc2FnZS1yYWlsOiBbXCJzbG90c1wiLFwic2Vzc2lvbnNcIl1cdUZGMUJcbiAqIGRzaC1iZXR0ZXItc2lkZWJhciBcdTRFQTZcdTU4RjBcdTY2MEUgbG9jYWxlXHVGRjA5XHVGRjFCXHU5NTE5XHU4QkVGXHU1OEYwXHU2NjBFXHU0RjFBXHU4QkE5IGZpYmVyIFx1NkMzOFx1NEU0NSBQRU5ESU5HXHVGRjBDXHU1NDJGXHU1MkE4XHU1QkExXHU4QkExXHU3NkY0XHU2M0E1XHU1MjI0XHU1OTMxXHU4RDI1XHUzMDAyXG4gKi9cbmV4cG9ydCBjb25zdCBpbmplY3QgPSBbJ3Nsb3RzJywgJ3Nlc3Npb25zJywgJ2xvY2FsZScsICdjb25uZWN0aW9uJ107XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpIHtcbiAgLy8gMS4gXHU2NTg3XHU2ODQ4XG4gIGN0eC5lZmZlY3QoKCkgPT4gY3R4LmxvY2FsZS5yZWdpc3RlcihOUywgeyB6aCwgZW4gfSksICdwcm9tcHQtb3B0aW1pemVyOiBsb2NhbGUgcmVnaXN0cmF0aW9uJyk7XG5cbiAgLy8gMi4gXHU5MTREXHU3RjZFXHU5NTVDXHU1MENGXHVGRjFBXHU4MUVBXHU2MzAxIFJQQyBcdTkxNERcdTdGNkVcdUZGMDhzZXJ2ZXIgaGFsZiBcdThCRkJcdTUxOTkgfi8uZHNoL3Byb21wdC1vcHRpbWl6ZXItY29uZmlnLmpzb25cdUZGMENcdTkwMUFcdTkwNTNcbiAgLy8gJy9kc2gtcHJvbXB0LW9wdGltaXplcidcdTIwMTRcdTIwMTRcdTU0MEMgZHNoLXN0aWNreS1ub3RlIFx1NkEyMVx1NUYwRlx1RkYwOVx1MzAwMlx1NEUwRFx1NzUyOCBzZXR0aW5nc1Njb3BlXHVGRjFBXHU2ODRDXHU5NzYyXHU1RTk0XHU3NTI4XHU3Njg0IGhvc3RcbiAgLy8gc2V0dGluZ3MgXHU2Q0U4XHU1MThDXHU4ODY4XHU1QkY5XHU2NzJBXHU2Q0U4XHU1MThDIG5hbWVzcGFjZSBcdThGRDRcdTU2REUgdW5hdmFpbGFibGVcdUZGMENzZXQgXHU5NzU5XHU5RUQ4XHU1OTMxXHU2NTQ4XHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XHUzMDAyXG4gIGxldCBjb25maWdNaXJyb3I6IFByb21wdENvbmZpZyA9IG1lcmdlQ29uZmlnKHVuZGVmaW5lZCk7XG4gIGxldCBjb25maWdFcG9jaCA9IDA7XG4gIGNvbnN0IHJwY0NvbmZpZyA9IGFzeW5jIChlbmRwb2ludDogc3RyaW5nLCBwYXlsb2FkPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBQcm9taXNlPHVua25vd24+ID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjdHguY29ubmVjdGlvbi5ycGMuY2FsbCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyJywgZW5kcG9pbnQsIHBheWxvYWQgPz8ge30pO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBjb25maWcgcnBjICR7ZW5kcG9pbnR9IGZhaWxlZDogJHsocmVzdWx0LmVycm9yICYmIChyZXN1bHQuZXJyb3IuZGV0YWlscyB8fCByZXN1bHQuZXJyb3IuY29kZSkpIHx8ICdycGMgZmFpbGVkJ31gLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcbiAgY29uc3QgbG9hZENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBycGNDb25maWcoJ2dldCcpO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcodmFsdWUgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTIxRFx1NkIyMVx1OEZERVx1NjNBNVx1NjcyQVx1NUMzMVx1N0VFQVx1NjVGNlx1NEZERFx1NjMwMVx1OUVEOFx1OEJBNFx1RkYxQlx1NEUwQlx1NkIyMVx1NEZERFx1NUI1OFx1NTQwRVx1OTU1Q1x1NTBDRlx1NTM3M1x1NjZGNFx1NjVCMFxuICAgIH1cbiAgfTtcbiAgdm9pZCBsb2FkQ29uZmlnKCk7XG5cbiAgLy8gMi41IFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1ODlFM1x1Njc5MFx1RkYxQVx1NTE0OFx1NTNENlx1NkZDMFx1NkQzQlx1NEYxQVx1OEJERCBpZFx1RkYwOHNlc3Npb25zLmN1cnJlbnRQcm92aWRlSW5mb1x1RkYwOVx1RkYwQ1xuICAvLyBcdTUxOERcdTY3RTUgc2Vzc2lvbi5tb2RlbHMgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEYyMCBzZXNzaW9uSWQgXHU2NUY2XHU2NzBEXHU1MkExXHU3QUVGXHU1NkRFXHU5MDAwXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCIGJ1Z1x1RkYwOVxuICBjb25zdCBnZXRBY3RpdmVTZXNzaW9uID0gKCk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIGNvbnN0IGluZm8gPSAoXG4gICAgICBjdHguc2Vzc2lvbnMgYXMge1xuICAgICAgICBjdXJyZW50UHJvdmlkZUluZm8/OiB7IGdldFNuYXBzaG90PzogKCkgPT4geyBzZXNzaW9uSWQ/OiBzdHJpbmcgfSB9O1xuICAgICAgfSB8IHVuZGVmaW5lZFxuICAgICk/LmN1cnJlbnRQcm92aWRlSW5mbz8uZ2V0U25hcHNob3Q/LigpO1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IGluZm8/LnNlc3Npb25JZDtcbiAgICByZXR1cm4gdHlwZW9mIHNlc3Npb25JZCA9PT0gJ3N0cmluZycgJiYgc2Vzc2lvbklkLmxlbmd0aCA+IDAgPyBzZXNzaW9uSWQgOiBudWxsO1xuICB9O1xuICAvLyAyLjYgXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCICsgc2VydmVyIFx1NTM0QSBsbG0uc3RyZWFtXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHVGRjFBXG4gIC8vIFx1OTAxQVx1OTA1M1x1NTM3M1x1ODFFQVx1NjcwOSBSUENcdUZGMDgvZHNoLXByb21wdC1vcHRpbWl6ZXJcdUZGMDlcdUZGMUJzZXJ2ZXIgaGFsZiBcdTc1MjggYWdlbnREZWZhdWx0TW9kZWwgXHU1M0Q2XHU1RjUzXHU1MjREXG4gIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1MzAwMWxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA4XHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU1REYyXHU5QThDXHU4QkMxXHU3Njg0XHU1QkJGXHU0RTNCXHU2NzBEXHU1MkExXHU5NzYyXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNlc3Npb24uY3JlYXRlL1xuICAvLyBmb3JrXHVGRjFBXHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU4MUVBXHU3RjE2IGlkIFx1ODhBQlx1OTc1OVx1OUVEOFx1NjJEMlx1N0VERCBcdTIxOTIgXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XHUzMDAyXG4gIGNvbnN0IGhvc3RScGM6IEhvc3RScGMgPSB7XG4gICAgY2FsbDogKGVuZHBvaW50LCBwYXlsb2FkKSA9PiBjYWxsSG9zdChlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSksXG4gIH07XG4gIGNvbnN0IGdldEhvc3QgPSAoKTogeyBycGM6IEhvc3RScGMgfSA9PiAoeyBycGM6IGhvc3RScGMgfSk7XG4gIGNvbnN0IGdldFNlc3Npb25Nb2RlbCA9IGFzeW5jICgpOiBQcm9taXNlPHsgcHJvdmlkZXI6IHN0cmluZzsgbW9kZWw6IHN0cmluZyB9IHwgbnVsbD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCB3aXRoVGltZW91dChjYWxsSG9zdCgnc2Vzc2lvbk1vZGVsJywge30pLCA1MDAwLCAnc2Vzc2lvbk1vZGVsJyk7XG4gICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSAmJiB0eXBlb2YgcmVzLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjb25zdCB2ID0gcmVzLnZhbHVlIGFzIHsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nIH07XG4gICAgICAgIGlmICh0eXBlb2Ygdi5wcm92aWRlciA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHYubW9kZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuIHsgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9O1xuXG4gIC8vIDIuNWIgXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU0RjFBXHU4QkREXHU3RUQxXHU1QjlBXHVGRjFBXHU1MzYxXHU3MjQ3XHU1M0VBXHU1NzI4XHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHU2NjNFXHU3OTNBXHVGRjA4XHU1MjA3XHU4RDcwXHU0RTBEXHU4RERGXHU5NjhGXHVGRjA5XG4gIGNvbnN0IGdldFNlc3Npb25JZCA9ICgpOiBzdHJpbmcgfCBudWxsID0+IGdldEFjdGl2ZVNlc3Npb24oKTtcblxuICAvLyAzLiBcdThCRURcdThBMDBcdTk1NUNcdTUwQ0ZcbiAgbGV0IGxhbmc6IExhbmcgPSBsYW5nT2YoY3R4LmxvY2FsZS5nZXRMb2NhbGUoKS5hY3RpdmUpO1xuICBjdHgub24oJ2xvY2FsZS9jaGFuZ2UnLCAoc25hcDogeyBhY3RpdmU6IHN0cmluZyB9KSA9PiB7XG4gICAgbGFuZyA9IGxhbmdPZihzbmFwLmFjdGl2ZSk7XG4gIH0pO1xuXG4gIC8vIDQuIFx1NEYxQVx1OEJERFx1NjlGRFx1NEY0RFx1RkYxQVx1NjMwOVx1OTRBRSArIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1xuICBjdHguaW5qZWN0KFsnc2xvdHMnLCAnc2Vzc2lvbnMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItYnV0dG9uJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICAgIGdldEhvc3QsXG4gICAgICAgICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE9wdGltaXplQnV0dG9uLFxuICAgICAgKSxcbiAgICApO1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0Lm92ZXJsYXknLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1jYXJkJyxcbiAgICAgICAgICBvcmRlcjogMTAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBvcGVuU2V0dGluZ3M6ICgpID0+IGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCksXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBQcmV2aWV3Q2FyZCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNi4gXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjA4cm9vdCBcdTRGNUNcdTc1MjhcdTU3REZcdUZGMDlcbiAgY29uc3Qgc2V0dGluZ3NTdG9yZSA9IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlKCk7XG4gIGNvbnN0IHNhdmVDb25maWcgPSBhc3luYyAocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBtZXJnZWQgPSBtZXJnZUNvbmZpZyh7IC4uLmNvbmZpZ01pcnJvciwgLi4ucmF3IH0pO1xuICAgIGNvbnN0IHdyaXR0ZW46IFByb21wdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVcmw6IG1lcmdlZC5iYXNlVXJsLFxuICAgICAgYXBpS2V5OiBtZXJnZWQuYXBpS2V5LnRyaW0oKSxcbiAgICAgIG1vZGVsOiBtZXJnZWQubW9kZWwsXG4gICAgICB1c2VTZXNzaW9uTW9kZWw6IG1lcmdlZC51c2VTZXNzaW9uTW9kZWwsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiB3cml0dGVuLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiB3cml0dGVuLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogd3JpdHRlbi5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHdyaXR0ZW4udXNlU2Vzc2lvbk1vZGVsLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHJlc2V0Q29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0Jywge1xuICAgICAgICBwYXRjaDoge1xuICAgICAgICAgIGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsXG4gICAgICAgICAgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IERFRkFVTFRTLm1vZGVsLFxuICAgICAgICAgIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuXG4gIGN0eC5pbmplY3QoWydzbG90cyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1zZXR0aW5ncycsXG4gICAgICAgICAgb3JkZXI6IDMwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IHNldHRpbmdzU3RvcmUsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBzYXZlQ29uZmlnLFxuICAgICAgICAgICAgcmVzZXRDb25maWcsXG4gICAgICAgICAgICBnZXRFcG9jaDogKCkgPT4gY29uZmlnRXBvY2gsXG4gICAgICAgICAgICBnZXRIb3N0U3RhdHVzOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1ODFFQVx1NjhDMFx1RkYxQVx1OTZGNlx1OTE0RFx1N0Y2RVx1NkEyMVx1NUYwRlx1ODBGRFx1NTQyNlx1NEVDRSBzZXJ2ZXIgaGFsZiBcdTYyRkZcdTUyMzBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCB3aXRoVGltZW91dChjYWxsSG9zdCgnc2Vzc2lvbk1vZGVsJywge30pLCA1MDAwLCAnc2Vzc2lvbk1vZGVsJyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcy5vayAmJiByZXMudmFsdWUgJiYgdHlwZW9mIHJlcy52YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSByZXMudmFsdWUgYXMgeyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmcgfTtcbiAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygdi5wcm92aWRlciA9PT0gJ3N0cmluZycgJiYgdHlwZW9mIHYubW9kZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogdHJ1ZSwgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogKHJlcy5lcnJvciAmJiAocmVzLmVycm9yLmRldGFpbHMgPz8gcmVzLmVycm9yLmNvZGUpKSB8fCAnbm8tbW9kZWwnIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogZmFsc2UsIGVycm9yOiAocmVzLmVycm9yICYmIChyZXMuZXJyb3IuZGV0YWlscyA/PyByZXMuZXJyb3IuY29kZSkpIHx8ICdycGMtZmFpbGVkJyB9O1xuICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6IFN0cmluZygoZSBhcyB7IG1lc3NhZ2U/OiB1bmtub3duIH0pPy5tZXNzYWdlID8/IGUpIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFNldHRpbmdzUm93LFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA3LiBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMUFBbHQrT1x1RkYwOFx1NzEyNlx1NzBCOVx1NTcyOCB0ZXh0YXJlYSBcdTUxODVcdTY1RjZcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdUZGMDlcbiAgY29uc3Qgb25LZXlkb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICBpZiAoIWUuYWx0S2V5IHx8IGUuY29kZSAhPT0gJ0tleU8nKSByZXR1cm47XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgIGlmICghKGVsIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZW1pdE9wdGltaXplUmVxdWVzdCgpO1xuICB9O1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlkb3duKTtcbn1cblxuLy8gXHU1RjE1XHU3NTI4XHU1Qjg4XHU1MzZCXHVGRjFBXHU5MDdGXHU1MTREIHRyZWUtc2hha2UgXHU2Mzg5XHU3QzdCXHU1NzhCXHVGRjA4XHU0RUM1XHU2NTg3XHU2ODYzXHU2MDI3XHVGRjFCXHU2NUUwXHU4RkQwXHU4ODRDXHU2NUY2XHU4ODRDXHU0RTNBXHVGRjA5XG5leHBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfTsiLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTY4MzhcdTVGQzNcdUZGMUFcdTkxNERcdTdGNkVcdTY4MjFcdTlBOENcdTMwMDFPcGVuQUkgXHU1MTdDXHU1QkI5XHU4QzAzXHU3NTI4XHUzMDAxXHU3RUQzXHU2NzlDXHU2M0QwXHU1M0Q2IFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTk2RjYgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb21wdENvbmZpZyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIC8qKiB0cnVlXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHVGRjFBXHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU2QTIxXHU1NzhCXHVGRjFCZmFsc2VcdUZGMUFcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWwgKi9cbiAgdXNlU2Vzc2lvbk1vZGVsOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstdjQtZmxhc2gnLFxuICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIC8vIFx1NjVFN1x1OUVEOFx1OEJBNFx1OEZDMVx1NzlGQlx1RkYxQVx1OUVEOFx1OEJBNCBiYXNlVXJsIFx1NEUwQlx1NkI4Qlx1NzU1OVx1NzY4NCBkZWVwc2Vlay1jaGF0XHVGRjA4djEgXHU5RUQ4XHU4QkE0XHVGRjA5XHU4OUM2XHU0RTNBXHU2NzJBXHU4QkJFXHU3RjZFXHVGRjBDXHU4NDNEXHU1MjMwXHU2NUIwXHU5RUQ4XHU4QkE0IGRlZXBzZWVrLXY0LWZsYXNoXHVGRjFCXG4gIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1OEZDNyBiYXNlVXJsXHVGRjA4XHU2NjNFXHU1RjBGXHU5MDA5XHU2MkU5XHVGRjA5XHU1MjE5XHU0RkREXHU3NTU5XHU1MzlGXHU2QTIxXHU1NzhCXHU1NDBEXG4gIGNvbnN0IHJhd01vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIGNvbnN0IG1pZ3JhdGVkRGVmYXVsdCA9XG4gICAgcmF3TW9kZWwgPT09ICdkZWVwc2Vlay1jaGF0JyAmJiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpID09PSBERUZBVUxUUy5iYXNlVXJsID8gREVGQVVMVFMubW9kZWwgOiByYXdNb2RlbDtcbiAgY29uc3QgbW9kZWwgPSBtaWdyYXRlZERlZmF1bHQ7XG4gIGNvbnN0IHVzZVNlc3Npb25Nb2RlbCA9IHR5cGVvZiByYXc/LnVzZVNlc3Npb25Nb2RlbCA9PT0gJ2Jvb2xlYW4nID8gcmF3LnVzZVNlc3Npb25Nb2RlbCA6IERFRkFVTFRTLnVzZVNlc3Npb25Nb2RlbDtcbiAgcmV0dXJuIHsgYmFzZVVybDogbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSwgYXBpS2V5LCBtb2RlbCwgdXNlU2Vzc2lvbk1vZGVsIH07XG59XG5cbmV4cG9ydCB0eXBlIENvbmZpZ1Byb2JsZW0gPSAnbWlzc2luZy1rZXknIHwgJ21pc3NpbmctbW9kZWwnIHwgJ2JhZC11cmwnO1xuZXhwb3J0IHR5cGUgQ29uZmlnQ2hlY2sgPSB7IG9rOiB0cnVlOyBjb25maWc6IFByb21wdENvbmZpZyB9IHwgeyBvazogZmFsc2U7IHJlYXNvbjogQ29uZmlnUHJvYmxlbSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb25maWcoY29uZmlnOiBQcm9tcHRDb25maWcpOiBDb25maWdDaGVjayB7XG4gIGlmICghY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1rZXknIH07XG4gIC8vIFx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NjVGNlx1NjVFMFx1OTcwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYxQlx1NEVDNVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NUYwRlx1ODk4MVx1NkM0MiBtb2RlbCBcdTk3NUVcdTdBN0FcbiAgaWYgKCFjb25maWcudXNlU2Vzc2lvbk1vZGVsICYmICFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nLCBzdHJlYW0gPSBmYWxzZSk6IG9iamVjdCB7XG4gIHJldHVybiB7XG4gICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZykgfSxcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB0ZXh0IH0sXG4gICAgXSxcbiAgICB0ZW1wZXJhdHVyZTogMC43LFxuICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgc3RyZWFtLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG5cbi8qKlxuICogU1NFIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQVx1NTE4NVx1NUJCOVx1NjIxNlx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1NzY4NFx1NEUwMFx1NkJCNVx1NjU4N1x1NjcyQ1x1MzAwMlxuICogdjQgXHU3Q0ZCXHU2QTIxXHU1NzhCXHVGRjA4djQtZmxhc2ggXHU3QjQ5XHVGRjA5XHU2RDQxXHU1RjBGXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1IHJlYXNvbmluZ19jb250ZW50XHVGRjA4XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjA5XHVGRjBDXHU5NjhGXHU1NDBFXHU2MjREXHU4RjkzXHU1MUZBXG4gKiBjb250ZW50IFx1NkI2M1x1NjU4N1x1MjAxNFx1MjAxNFx1NEUyNFx1ODAwNVx1OTBGRFx1ODk4MVx1NUI5RVx1NjVGNlx1NTQ0OFx1NzNCMFx1RkYwQ1x1NTQyNlx1NTIxOVx1NjNBOFx1NzQwNlx1NjcxRlx1NTM2MVx1NzI0N1x1NzcwQlx1OEQ3N1x1Njc2NVx1NTBDRlx1MzAwQ1x1OTc1RVx1NkQ0MVx1NUYwRlx1MzAwRFx1RkYwOFx1NUI5RVx1NkQ0QiB+ODAgXHU0RTJBIGNodW5rXG4gKiBcdTUxNjhcdTY2MkYgcmVhc29uaW5nXHVGRjBDXHU2QjYzXHU2NTg3XHU2NzAwXHU1NDBFXHU2MjREXHU1MUZBXHU3M0IwXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCB0eXBlIFNzZURlbHRhID1cbiAgfCB7IGtpbmQ6ICdjb250ZW50JzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IGtpbmQ6ICdyZWFzb25pbmcnOyB0ZXh0OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTRFMDBcdTg4NEMgU1NFIFx1NjU3MFx1NjM2RVx1RkYxQShkYXRhOiB7Li4ufSkgXHUyMTkyIFx1NTg5RVx1OTFDRlx1NEU4Qlx1NEVGNlx1RkYxQlxuICogW0RPTkVdL1x1OTc1RSBkYXRhIFx1ODg0Qy9cdTk3NUUgSlNPTi9cdTY1RTBcdTUxODVcdTVCQjkgZGVsdGEgXHUyMTkyIG51bGxcdTMwMDJcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RTc2VEZWx0YShsaW5lOiBzdHJpbmcpOiBTc2VEZWx0YSB8IG51bGwge1xuICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gIGlmICghdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZGF0YSA9IHRyaW1tZWQuc2xpY2UoJ2RhdGE6Jy5sZW5ndGgpLnRyaW0oKTtcbiAgaWYgKGRhdGEgPT09ICdbRE9ORV0nKSByZXR1cm4gbnVsbDtcbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IGRlbHRhPzogeyBjb250ZW50PzogdW5rbm93bjsgcmVhc29uaW5nX2NvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgZGVsdGEgPSBmaXJzdD8uZGVsdGE7XG4gIGlmICh0eXBlb2YgZGVsdGE/LmNvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAnY29udGVudCcsIHRleHQ6IGRlbHRhLmNvbnRlbnQgfTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8ucmVhc29uaW5nX2NvbnRlbnQgPT09ICdzdHJpbmcnKSByZXR1cm4geyBraW5kOiAncmVhc29uaW5nJywgdGV4dDogZGVsdGEucmVhc29uaW5nX2NvbnRlbnQgfTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHVGRjFBXHU5MDEwXHU1NzU3XHU4OUUzXHU2NzkwIFNTRVx1RkYwQ1x1OEZCOVx1NjUzNlx1OEZCOVx1NTZERVx1OEMwMyBvblRleHQoZGVsdGEpXHVGRjFCXHU4RkQ0XHU1NkRFXHU1QjhDXHU2NTc0XHU2QjYzXHU2NTg3XHUzMDAyXG4gKiBcdTc2RjhcdTZCRDRcdTk3NUVcdTZENDFcdTVGMEYgb3B0aW1pemUoKVx1RkYxQVx1OTk5Nlx1NUI1N1x1NjZGNFx1NUZFQlx1MzAwMVx1OTU3Rlx1OEY5M1x1NTFGQVx1NEUwRFx1OTcwMFx1ODk4MVx1N0I0OVx1NUI4Q1x1NjU3NFx1NzUxRlx1NjIxMFx1MjAxNFx1MjAxNFx1NjMwOVx1OTRBRS9cdTUzNjFcdTcyNDdcdTgwRkRcdThGQjlcdTc1MUZcdTYyMTBcdThGQjlcdTY2M0VcdTc5M0FcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplU3RyZWFtKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIG9uRXZlbnQ/OiAoZGVsdGE6IFNzZURlbHRhKSA9PiB2b2lkO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwsIG9uRXZlbnQgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZywgdHJ1ZSkpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuICBpZiAoIXJlcy5ib2R5KSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ21pc3NpbmcgcmVzcG9uc2UgYm9keScpO1xuXG4gIGNvbnN0IHJlYWRlciA9IHJlcy5ib2R5LmdldFJlYWRlcigpO1xuICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGxldCBidWZmZXIgPSAnJztcbiAgbGV0IGZ1bGwgPSAnJztcbiAgdHJ5IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICAgIGlmIChkb25lKSBicmVhaztcbiAgICAgIGJ1ZmZlciArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gICAgICBjb25zdCBsaW5lcyA9IGJ1ZmZlci5zcGxpdCgnXFxuJyk7XG4gICAgICBidWZmZXIgPSBsaW5lcy5wb3AoKSA/PyAnJztcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShsaW5lKTtcbiAgICAgICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1REYyXHU0RTJEXHU2QjYyL1x1OTFDQVx1NjUzRVx1NjVGNlx1NUZGRFx1NzU2NVxuICAgIH1cbiAgfVxuICAvLyBcdTVDM0VcdTg4NENcdUZGMDhcdTY1RTBcdTYzNjJcdTg4NENcdTdFRDNcdTVDM0VcdTc2ODQgZGF0YSBcdTg4NENcdUZGMDlcbiAgaWYgKGJ1ZmZlci50cmltKCkpIHtcbiAgICBjb25zdCBkZWx0YSA9IGV4dHJhY3RTc2VEZWx0YShidWZmZXIpO1xuICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgb25FdmVudD8uKGRlbHRhKTtcbiAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdFJlc3VsdChmdWxsKTtcbiAgaWYgKCFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHUzMDBDXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDBEXHVGRjFBXHU4QzAzIGNvbm5lY3Rpb24gXHU3Njg0IHNlc3Npb24ubW9kZWxzIFJQQ1x1RkYwQ1x1NTNENiBjdXJyZW50Lm1vZGVsXHUzMDAyXG4gKiBhcGkgXHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjA4XHU0RTBFIERTSCBcdTg5RTNcdTgwMjZcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdUZGMUJcdTRFRkJcdTRGNTVcdTU5MzFcdThEMjVcdThGRDRcdTU2REUgbnVsbFx1RkYwOFx1NzUzMVx1OEMwM1x1NzUyOFx1NjVCOVx1NTZERVx1OTAwMFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVNlc3Npb25Nb2RlbChcbiAgYXBpOlxuICAgIHwge1xuICAgICAgICBzZXNzaW9ucz86IHtcbiAgICAgICAgICBtb2RlbHM/OiAocGF5bG9hZD86IHVua25vd24sIHNpZ25hbD86IEFib3J0U2lnbmFsKSA9PiBQcm9taXNlPHsgY3VycmVudD86IHsgbW9kZWw/OiBzdHJpbmcgfSB9IHwgbnVsbD47XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfCB1bmRlZmluZWQsXG4gIHBheWxvYWQ6IHVua25vd24gPSB7fSxcbiAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICAvLyBcdTVGQzVcdTk4N0JcdTY0M0FcdTVFMjYgc2Vzc2lvbklkXHVGRjFBc2VydmVyIFx1N0FFRlx1NjMwOSByZXF1ZXN0LnBheWxvYWQuc2Vzc2lvbklkIFx1NjdFNVx1OEJFNVx1NEYxQVx1OEJERFx1NURGMlx1OTAwOVx1NjJFOVx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYwQ1xuICAgIC8vIFx1N0YzQVx1NTkzMVx1NjVGNlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1RkYwOGRlZXBzZWVrLXY0LWZsYXNoXHVGRjA5XHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYXBpPy5zZXNzaW9ucz8ubW9kZWxzPy4ocGF5bG9hZCwgc2lnbmFsKTtcbiAgICBjb25zdCBtID0gcmVzPy5jdXJyZW50Py5tb2RlbDtcbiAgICByZXR1cm4gdHlwZW9mIG0gPT09ICdzdHJpbmcnICYmIG0udHJpbSgpID8gbS50cmltKCkgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2M0QyXHU0RUY2XHU2NTg3XHU2ODQ4IFx1MjAxNCBcdTRFMkRcdTgyRjFcdTUzQ0NcdThCRUQgKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgY29uc3QgTlMgPSAncHJvbXB0X29wdGltaXplcic7XG5cbmV4cG9ydCBjb25zdCB6aCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ1x1NEYxOFx1NTMxNiBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdcdTRGMThcdTUzMTZcdTdFRDNcdTY3OUMnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1x1NjZGRlx1NjM2Mlx1ODM0OVx1N0EzRicsXG4gICdjYXJkLmNvcHknOiAnXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnXHU1REYyXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQucmV0cnknOiAnXHU5MUNEXHU2NUIwXHU0RjE4XHU1MzE2JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdcdTY1M0VcdTVGMDMnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdcdTVERjJcdTkxNERcdTdGNkUgXHUwMEI3IFx1NkEyMVx1NTc4QiB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnXHU2NzJBXHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS50aXRsZSc6ICdcdThCRjdcdTUxNDhcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLmRlc2MnOiAnXHU1MjREXHU1RjgwIFx1OEJCRVx1N0Y2RSBcdTIxOTIgXHU5MDFBXHU3NTI4XHU4QkJFXHU3RjZFIFx1MjE5MiBQcm9tcHQgXHU0RjE4XHU1MzE2XHVGRjBDXHU1ODZCXHU1MTk5XHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwXHUzMDAxQVBJIEtleSBcdTRFMEVcdTZBMjFcdTU3OEJcdTU0MERcdTMwMDInLFxuICAnZ3VpZGUuYWN0aW9uJzogJ1x1NTNCQlx1OEJCRVx1N0Y2RScsXG4gICdndWlkZS5kaXNtaXNzJzogJ1x1NzdFNVx1OTA1M1x1NEU4NicsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIEtleSBcdTY1RTBcdTY1NDhcdTYyMTZcdTVERjJcdThGQzdcdTY3MUYnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ1x1NjcwRFx1NTJBMVx1NjJEMlx1N0VERFx1OEJCRlx1OTVFRVx1RkYwODQwM1x1RkYwOScsXG4gICdlcnJvci50aW1lb3V0JzogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ1x1N0Y1MVx1N0VEQ1x1OTUxOVx1OEJFRlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5jb3JzJzogJ1x1NjNBNVx1NTNFM1x1NEUwRFx1NjUyRlx1NjMwMVx1OERFOFx1NTdERlx1RkYwQ1x1OEJGN1x1NjM2Mlx1NzUyOFx1NjUyRlx1NjMwMSBDT1JTIFx1NzY4NFx1N0Y1MVx1NTE3MycsXG4gICdlcnJvci5odHRwJzogJ1x1OEJGN1x1NkM0Mlx1NTkzMVx1OEQyNVx1RkYwOEhUVFAgXHU5NTE5XHU4QkVGXHVGRjA5JyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTY4M0NcdTVGMEZcdTVGMDJcdTVFMzgnLFxuICAnZXJyb3IuZW1wdHknOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU0RTNBXHU3QTdBXHVGRjBDXHU4QkY3XHU5MUNEXHU4QkQ1JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdcdTkxNERcdTdGNkVcdTRFMERcdTVCOENcdTY1NzRcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTY4QzBcdTY3RTUnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IFx1NEYxOFx1NTMxNicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ1x1OTE0RFx1N0Y2RVx1NkRBNlx1ODI3Mlx1NjNBNVx1NTNFM1x1RkYwOE9wZW5BSSBcdTUxN0NcdTVCQjlcdUZGMDlcdUZGMUJLZXkgXHU2NjBFXHU2NTg3XHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU1NzMwJyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ1x1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnXHU1RjAwXHU1NDJGXHU2NUY2XHU0RjE4XHU1MzE2XHU4QkY3XHU2QzQyXHU4RERGXHU5NjhGXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCXHU1MTczXHU5NUVEXHU1NDBFXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnXHU1REYyXHU5MDA5XHU2MkU5XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCJyxcbiAgJ3NldHRpbmdzLmhvc3RQcm9iZSc6ICdcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTYzQTJcdTZENEJcdTRFMkRcdTIwMjYnLFxuICAnc2V0dGluZ3MuaG9zdE9rJzogJ1x1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1OTAxQVx1OTA1MyBcdTI3MTMnLFxuICAnc2V0dGluZ3MuaG9zdEZhaWwnOiAnXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU5MDFBXHU5MDUzXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjFBJyxcblxuICAnc2V0dGluZ3Muc2F2ZSc6ICdcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnXHU2MDYyXHU1OTBEXHU5RUQ4XHU4QkE0JyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1x1NURGMlx1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1x1NEZERFx1NUI1OFx1NTkzMVx1OEQyNScsXG4gICdzZXR0aW5ncy5yZXNldEZhaWxlZCc6ICdcdTkxQ0RcdTdGNkVcdTU5MzFcdThEMjUnLFxuICBcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBlbjogTG9jYWxlRGljdCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ09wdGltaXplIHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ09wdGltaXplZCBwcm9tcHQnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1VzZSBkcmFmdCcsXG4gICdjYXJkLmNvcHknOiAnQ29weScsXG4gICdjYXJkLmNvcHlEb25lJzogJ0NvcGllZCcsXG4gICdjYXJkLnJldHJ5JzogJ1JldHJ5JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdEaXNtaXNzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdPcHRpbWl6aW5nXHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ0NvbmZpZ3VyZWQgXHUwMEI3IG1vZGVsIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdObyBBUEkgY29uZmlndXJlZCcsXG4gICdndWlkZS50aXRsZSc6ICdDb25maWd1cmUgdGhlIEFQSSBmaXJzdCcsXG4gICdndWlkZS5kZXNjJzogJ0dvIHRvIFNldHRpbmdzIFx1MjE5MiBHZW5lcmFsIFx1MjE5MiBQcm9tcHQgT3B0aW1pemVyIGFuZCBmaWxsIGluIHRoZSBlbmRwb2ludCwgQVBJIGtleSwgYW5kIG1vZGVsLicsXG4gICdndWlkZS5hY3Rpb24nOiAnR28gdG8gc2V0dGluZ3MnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdHb3QgaXQnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBrZXkgaXMgaW52YWxpZCBvciBleHBpcmVkJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdBY2Nlc3MgZm9yYmlkZGVuICg0MDMpJyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnUmVxdWVzdCB0aW1lZCBvdXQ7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IubmV0d29yayc6ICdOZXR3b3JrIGVycm9yOyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLmNvcnMnOiAnRW5kcG9pbnQgYmxvY2tzIENPUlM7IHVzZSBhIGdhdGV3YXkgdGhhdCBhbGxvd3MgaXQnLFxuICAnZXJyb3IuaHR0cCc6ICdSZXF1ZXN0IGZhaWxlZCAoSFRUUCBlcnJvciknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgZm9ybWF0JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ0VtcHR5IHJlc3VsdDsgcGxlYXNlIHJldHJ5JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdJbmNvbXBsZXRlIGNvbmZpZ3VyYXRpb247IGNoZWNrIHNldHRpbmdzJyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBPcHRpbWl6ZXInLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdDb25maWd1cmUgdGhlIHJld3JpdGUgZW5kcG9pbnQgKE9wZW5BSS1jb21wYXRpYmxlKTsga2V5IGlzIHN0b3JlZCBsb2NhbGx5IGluIHBsYWluIHRleHQnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdCYXNlIFVSTCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdNb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnVXNlIGN1cnJlbnQgc2Vzc2lvbiBtb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1doZW4gb24sIG9wdGltaXphdGlvbiByZXF1ZXN0cyBmb2xsb3cgdGhlIHNlc3Npb24gbW9kZWw7IHdoZW4gb2ZmLCB0aGUgY3VzdG9tIG1vZGVsIGJlbG93IGlzIHVzZWQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdTZXNzaW9uIGRlZmF1bHQgbW9kZWwgc2VsZWN0ZWQnLFxuICAnc2V0dGluZ3MuaG9zdFByb2JlJzogJ3Byb2JpbmcgaG9zdCBjaGFubmVsXHUyMDI2JyxcbiAgJ3NldHRpbmdzLmhvc3RPayc6ICdzZXNzaW9uIG1vZGVsIGNoYW5uZWwgXHUyNzEzJyxcbiAgJ3NldHRpbmdzLmhvc3RGYWlsJzogJ3Nlc3Npb24gbW9kZWwgY2hhbm5lbCB1bmF2YWlsYWJsZTogJyxcblxuICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1Jlc2V0IHRvIGRlZmF1bHRzJyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1NhdmVkJyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnU2F2ZSBmYWlsZWQnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnUmVzZXQgZmFpbGVkJyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBMb2NhbGVLZXkgPSBrZXlvZiB0eXBlb2Ygemg7XG5leHBvcnQgdHlwZSBMb2NhbGVEaWN0ID0geyBbSyBpbiBMb2NhbGVLZXldOiBzdHJpbmcgfTtcblxuLyoqIFx1NkZDMFx1NkQzQiBsb2NhbGUgXHUyMTkyIFx1NzU0Q1x1OTc2Mlx1OEJFRFx1OEEwMFx1RkYwOHpoIFx1NTI0RFx1N0YwMFx1NUY1MiB6aFx1RkYwQ1x1NTE3Nlx1NEY1OVx1NUY1MiBlblx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhbmdPZihhY3RpdmU6IHN0cmluZyk6IExhbmcge1xuICByZXR1cm4gdHlwZW9mIGFjdGl2ZSA9PT0gJ3N0cmluZycgJiYgYWN0aXZlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnemgnKSA/ICd6aCcgOiAnZW4nO1xufVxuIiwgIi8qKiBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMUJcdTkwN0ZcdTUxNEQgaW5kZXggXHUyMTk0IFx1N0VDNFx1NEVGNlx1NUZBQVx1NzNBRlx1NEY5RFx1OEQ1Nlx1RkYwOVx1RkYxQVxuICogIC0gb3B0aW1pemVSZXF1ZXN0XHVGRjFBXHU1RkVCXHU2Mzc3XHU5NTJFIEFsdCtPIFx1MjE5MiBcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdTg5RTZcdTUzRDFcbiAqICAtIG9wZW5TZXR0aW5nc1JlcXVlc3RcdUZGMUFcdTk4ODRcdTg5QzhcdTUzNjFcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdTIxOTIgXHU4QkJFXHU3RjZFXHU4ODRDXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwICovXG5cbmNvbnN0IG9wdGltaXplUmVxdWVzdExpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3B0aW1pemVSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3B0aW1pemVSZXF1ZXN0KCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGZuIG9mIG9wdGltaXplUmVxdWVzdExpc3RlbmVycykgZm4oKTtcbn1cblxuY29uc3Qgb3BlblNldHRpbmdzTGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wZW5TZXR0aW5nc0xpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3BlblNldHRpbmdzTGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMpIGZuKCk7XG59XG4iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NjgwRlx1NTNGM1x1NEZBN1x1MzAwQ1x1NEYxOFx1NTMxNlx1MzAwRFx1NjMwOVx1OTRBRSBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMENcdTcyQjZcdTYwMDFcdThENzBcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkYgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGdldFByZXZpZXdCdXNTdGF0ZSwgc3Vic2NyaWJlUHJldmlld0J1cyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuaW1wb3J0IHsgb25PcHRpbWl6ZVJlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW1pemVCdXR0b25Qcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+O1xuICBnZXRIb3N0PzogKCkgPT4geyBycGM6IHsgY2FsbDogKGU6IHN0cmluZywgcD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBQcm9taXNlPHsgb2s6IGJvb2xlYW47IHZhbHVlPzogdW5rbm93bjsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmcgfSB9PiB9IH0gfCBudWxsO1xuICBnZXRTZXNzaW9uSWQ/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjFBXHU0RjE4XHU1MTQ4XHU1M0Q2XHU3MTI2XHU3MEI5IHRleHRhcmVhXHVGRjFCXHU1NDI2XHU1MjE5XHU1NkRFXHU5MDAwXHU1MjMwXHU5ODc1XHU5NzYyXHU0RTJEXHUzMDBDXHU1MDNDXHU5NzVFXHU3QTdBXHUzMDBEXHU3Njg0IHRleHRhcmVhXG4gKiBcdUZGMDhcdTc1MjhcdTYyMzdcdTU3MjhcdThGOTNcdTUxNjVcdTc2ODRcdTUzNzNcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMDlcdTMwMDJcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NzY4NCBpbnB1dCBob29rXHUyMDE0XHUyMDE0XHU1QjlFXHU2RDRCXG4gKiBpbnB1dC5yaWdodCBcdTZFMzJcdTY3RDNcdTY1RjZcdThCRTVcdTY4MDdcdTUxQzYgcHJvcHMgXHU2NzJBXHU2M0QwXHU0RjlCXHVGRjBDXHU3RUM0XHU0RUY2XHU0RjFBXHU1NkUwXHU4QzAzXHU3NTI4IHVuZGVmaW5lZCBob29rXG4gKiBcdTVEMjlcdTZFODNcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdUZGMDhQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4IFx1NEUwRFx1NTNFRlx1ODlDMVx1RkYwOVx1MzAwMlxuICovXG5mdW5jdGlvbiByZWFkRHJhZnQoKTogc3RyaW5nIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHJldHVybiBhY3RpdmUudmFsdWU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKHRhLnZhbHVlLnRyaW0oKSkgcmV0dXJuIHRhLnZhbHVlO1xuICB9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU3RTQxXHU1RkQ5XHU2MDAxXHVGRjFBXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XHVGRjFCXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1MjAxNFx1MjAxNFx1NTIwN1x1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NjMwOVx1OTRBRVx1NEUwRFx1NTE4RCBidXN5XHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHVGRjA5XG4gIGNvbnN0IGJ1c3lGb3IgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSBnZXRQcmV2aWV3QnVzU3RhdGUoKTtcbiAgICBpZiAoc3Quc3RhdHVzICE9PSAnb3B0aW1pemluZycpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzaWQgPSBnZXRTZXNzaW9uSWQ/LigpO1xuICAgIHJldHVybiBzdC5zZXNzaW9uSWQgPT09IG51bGwgfHwgc3Quc2Vzc2lvbklkID09PSBzaWQ7XG4gIH07XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKGJ1c3lGb3IpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRCdXN5KGJ1c3lGb3IoKSkpLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGJ1c3kpIHJldHVybjtcbiAgICBjb25zdCBkcmFmdCA9IGRyYWZ0UmVmLmN1cnJlbnQgfHwgcmVhZERyYWZ0KCk7XG4gICAgaWYgKCFkcmFmdC50cmltKCkpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gZHJhZnQsXG4gICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICBob3N0OiBnZXRIb3N0Py4oKSxcbiAgICAgIGdldFNlc3Npb25JZCxcbiAgICB9KTtcbiAgfSwgW2J1c3ksIGdldENvbmZpZywgZ2V0TGFuZ10pO1xuXG4gIC8vIEFsdCtPIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYwOGluZGV4LnRzIFx1NTE2OFx1NUM0MFx1NzZEMVx1NTQyQ1x1RkYwOVx1MjE5MiBcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3B0aW1pemVSZXF1ZXN0KGhhbmRsZUNsaWNrKSwgW2hhbmRsZUNsaWNrXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgYXJpYS1sYWJlbD17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIHRpdGxlPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgZGlzYWJsZWQ9e2J1c3l9XG4gICAgICBkYXRhLWJ1c3k9e2J1c3l9XG4gICAgICBvbk1vdXNlRG93bj17c3luY0RyYWZ0fVxuICAgICAgb25Gb2N1cz17c3luY0RyYWZ0fVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgPlxuICAgICAge2J1c3kgPyAnXHUyM0YzJyA6ICdcdTI3MjgnfVxuICAgIDwvYnV0dG9uPlxuICApO1xufSIsICIvKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NEYxOFx1NTMxNlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYxQXNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCArIGxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NEU1Rlx1NEUwRFx1OEJFNVx1NzUyOCBzZXNzaW9uLmNyZWF0ZS9mb3JrIFx1NTIxQlx1NUVGQVx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFxuICogXHVGRjA4XHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU1QjlFXHU2RDRCXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyXHU2QjYzXHU4OUUzXHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU3Njg0XHU1QkJGXHU0RTNCXG4gKiBcdTY3MERcdTUyQTFcdTk3NjJcdUZGMUFzZXJ2ZXIgaGFsZlx1RkYwOGxpYi9pbmRleC5qc1x1RkYwOVx1NjMwMVx1NjcwOSBsbG0gXHU0RTBFIGFnZW50RGVmYXVsdE1vZGVsIFx1NjcwRFx1NTJBMVx1MjAxNFx1MjAxNFxuICogICBzZXNzaW9uTW9kZWwgICAgICAgXHUyMTkyIFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERC9hZ2VudCBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhwcm92aWRlciArIG1vZGVsXHVGRjA5XG4gKiAgIG9wdGltaXplLnN0cmVhbSAgICBcdTIxOTIgU1NFIFx1NzcxRlx1NkQ0MVx1NUYwRlx1RkYxQWxsbS5zdHJlYW0gXHU2QkNGXHU0RTJBIHRleHQtZGVsdGEgXHU1MzczXHU2NUY2XHU2M0E4XHU5MDAxXHVGRjA4XHU5MDEwIHRva2VuXHVGRjA5XG4gKiAgIG9wdGltaXplLnN0YXJ0ICAgICBcdTIxOTIgXHU1NDBFXHU1M0YwXHU2RDQxXHU1RjBGXHU3RDJGXHU3OUVGXHVGRjA4XHU5NjREXHU3RUE3XHU2NUI5XHU2ODQ4XHVGRjA5XG4gKiAgIG9wdGltaXplLnBvbGwgICAgICBcdTIxOTIgXHU1M0Q2IHsgZG9uZSwgdGV4dCB9XHVGRjA4XHU5NjREXHU3RUE3XHU2NUI5XHU2ODQ4XHVGRjA5XG4gKiBjbGllbnQgXHU3RUNGIEhUVFAgU1NFXHVGRjA4L2RzaC1wcm9tcHQtb3B0aW1pemVyL2FwaS9vcHRpbWl6ZS5zdHJlYW1cdUZGMDlcdTkwMTAgdG9rZW4gXHU1NDQ4XHU3M0IwXHUzMDAyXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogXHU4MUVBXHU2NzA5XHU5MDFBXHU5MDUzXHU3Njg0XHU2NzAwXHU1QzBGXHU5NzYyXHVGRjA4XHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHUzMDAyICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RScGMge1xuICBjYWxsKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8e1xuICAgIG9rOiBib29sZWFuO1xuICAgIHZhbHVlPzogdW5rbm93bjtcbiAgICBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfTtcbiAgfT47XG59XG5cbi8qKlxuICogSFRUUCBKU09OIEFQSSBcdTkwMUFcdTkwNTNcdUZGMDhkc2gtZWxmIFx1NjVCOVx1NUYwRlx1RkYwOVx1RkYxQVx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1OTg3NVx1OTc2Mlx1NzUzMVx1NUJCRlx1NEUzQiB3ZWJTZXJ2ZXIgXHU2M0QwXHU0RjlCXHVGRjBDXHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0IGZldGNoXG4gKiBcdTc2RjRcdThGQkUgYC9kc2gtcHJvbXB0LW9wdGltaXplci9hcGkvPG1ldGhvZD5gXHVGRjBDXHU1QjhDXHU1MTY4XHU3RUQ1XHU1RjAwIGNvbm5lY3Rpb24ucnBjLmNhbGxcdTIwMTRcdTIwMTRcbiAqIGRlc2t0b3AgXHU3Njg0IHJwYy5jYWxsIFx1NTcyOFx1NTQwQ1x1NEUwMFx1NkQ0MVx1N0EwQlx1N0IyQ1x1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NEYxQVx1NjMwMlx1NkI3Qlx1RkYwOFx1NUI5RVx1NkQ0QiBzZXNzaW9uTW9kZWwgXHU2MjEwXHU1MjlGXHUzMDAxXHU3QjJDXHU0RThDXHU2QjIxXHU2QzM4XHU0RTBEXHU4RkJFXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsSG9zdDxSID0gdW5rbm93bj4oXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmdzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFByb21pc2U8eyBvazogYm9vbGVhbjsgdmFsdWU/OiBSOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9PiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYC9kc2gtcHJvbXB0LW9wdGltaXplci9hcGkvJHtlbmNvZGVVUklDb21wb25lbnQobWV0aG9kKX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYXJncyksXG4gIH0pO1xuICByZXR1cm4gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkgYXMgeyBvazogYm9vbGVhbjsgdmFsdWU/OiBSOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9O1xufVxuXG4vKiogXHU3RUQ5XHU2MzAyXHU4RDc3XHU3Njg0IFJQQyBcdThDMDNcdTc1MjhcdTUyQTBcdThEODVcdTY1RjZcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRFRkJcdTRGNTVcdTRFMDBcdTZCNjVcdTkwRkRcdTRFMERcdTUxNDFcdThCQjhcdTY1RTBcdTk2NTBcdTk2M0JcdTU4NUUgXHUyMTkyXHUzMDBDXHU0RTAwXHU3NkY0XHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKGAke2xhYmVsfS10aW1lb3V0YCkpLCBtcyk7XG4gICAgcHJvbWlzZS50aGVuKFxuICAgICAgKHYpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0sXG4gICAgICAoZSkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RTZXNzaW9uSW5mbyB7XG4gIHByb3ZpZGVyOiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5Ib3N0T3B0aW1pemVPcHRpb25zIHtcbiAgcnBjOiBIb3N0UnBjO1xuICBsYW5nOiBMYW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN5c3RlbTogc3RyaW5nO1xuICBzaWduYWw6IEFib3J0U2lnbmFsO1xuICBvbkRlbHRhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU2QjY1XHU5QUE0XHU4RkRCXHU1RUE2XHVGRjA4XHU1MzYxXHU3MjQ3XHU2NjNFXHU3OTNBXHVGRjBDXHU1QjlBXHU0RjREXHU1MzYxXHU3MEI5XHVGRjA5ICovXG4gIG9uU3RlcD86IChzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJykgPT4gdm9pZDtcbiAgaW50ZXJ2YWxNcz86IG51bWJlcjtcbiAgdGltZW91dE1zPzogbnVtYmVyO1xuICBycGNUaW1lb3V0TXM/OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfSU5URVJWQUxfTVMgPSAxMDA7XG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSAxMjBfMDAwO1xuY29uc3QgREVGQVVMVF9SUENfVElNRU9VVF9NUyA9IDVfMDAwO1xuXG5mdW5jdGlvbiBjYWxsUnBjPFIgPSBuZXZlcj4oXG4gIHJwYzogSG9zdFJwYyxcbiAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIG1zOiBudW1iZXIsXG4pOiBQcm9taXNlPHsgb2s6IHRydWU7IHZhbHVlOiBSIH0gfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfT4ge1xuICByZXR1cm4gd2l0aFRpbWVvdXQoXG4gICAgcnBjLmNhbGwoZW5kcG9pbnQsIHBheWxvYWQpLFxuICAgIG1zLFxuICAgIGVuZHBvaW50LFxuICApIGFzIFByb21pc2U8eyBvazogdHJ1ZTsgdmFsdWU6IFIgfSB8IHsgb2s6IGZhbHNlOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9Pjtcbn1cblxuLyoqIFx1NTNENlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERC9hZ2VudCBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdTMwMDJcdTRFMERcdTUzRUZcdTVGOTdcdTY1RjZcdThGRDRcdTU2REUgbnVsbFx1MzAwMiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVIb3N0U2Vzc2lvbk1vZGVsKFxuICBycGM6IEhvc3RScGMsXG4gIHJwY1RpbWVvdXRNcyA9IERFRkFVTFRfUlBDX1RJTUVPVVRfTVMsXG4pOiBQcm9taXNlPEhvc3RTZXNzaW9uSW5mbyB8IG51bGw+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgY2FsbFJwYyhycGMsICdzZXNzaW9uTW9kZWwnLCB7fSwgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFyZXMub2sgfHwgIXJlcy52YWx1ZSB8fCB0eXBlb2YgcmVzLnZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHYgPSByZXMudmFsdWUgYXMgeyBwcm92aWRlcj86IHVua25vd247IG1vZGVsPzogdW5rbm93biB9O1xuICBpZiAodHlwZW9mIHYucHJvdmlkZXIgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2Lm1vZGVsICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGluZm86IEhvc3RTZXNzaW9uSW5mbyA9IHsgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gIGlmICh0eXBlb2YgKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHVua25vd24gfSkucmVhc29uaW5nRWZmb3J0ID09PSAnc3RyaW5nJykge1xuICAgIGluZm8ucmVhc29uaW5nRWZmb3J0ID0gKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZyB9KS5yZWFzb25pbmdFZmZvcnQ7XG4gIH1cbiAgcmV0dXJuIGluZm87XG59XG5cbi8qKiBcdTY1ODdcdTY3MkNcdTU4OUVcdTkxQ0ZcdUZGMDhcdTVCNTdcdTdCMjZcdTUyNERcdTdGMDBcdTZCRDRcdThGODNcdUZGMUJcdThGNkVcdThCRTJcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdTc1MjhcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVmaXhEZWx0YShwcmV2OiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG4gPSBNYXRoLm1pbihwcmV2Lmxlbmd0aCwgbmV4dC5sZW5ndGgpO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgbiAmJiBwcmV2LmNoYXJDb2RlQXQoaSkgPT09IG5leHQuY2hhckNvZGVBdChpKSkgaSArPSAxO1xuICByZXR1cm4gbmV4dC5zbGljZShpKTtcbn1cblxuLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTUxNjhcdTZENDFcdTdBMEJcdUZGMDhcdTUzNTVcdTZCMjEgUlBDIFx1NEVBNFx1NEVEOFx1RkYwOVx1RkYxQXNlcnZlciBoYWxmIFx1ODlFM1x1Njc5MFx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QiBcdTIxOTIgbGxtLnN0cmVhbSBcdThERDFcdTVCOENcbiAqIFx1MjE5MiBcdTRFMDBcdTZCMjFcdTYwMjdcdThGRDRcdTU2REVcdTUxNjhcdTY1ODdcdTMwMDJcdTRFMERcdTc1MjhcdTMwMENzdGFydCArIFx1OEY2RVx1OEJFMiBwb2xsXHUzMDBEXHU3Njg0XHU1MjA2XHU2QjY1XHU1MzRGXHU4QkFFXHVGRjFBZGVza3RvcCBcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTc2ODRcbiAqIHJwYy5jYWxsIFx1NTcyOFx1NTQwQ1x1NEUwMFx1NkQ0MVx1N0EwQlx1NzY4NFx1N0IyQ1x1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NEYxQVx1NjMwMlx1NkI3Qlx1RkYwOFx1NUI5RVx1NkQ0QiBzZXNzaW9uTW9kZWwgXHU2MjEwXHU1MjlGXHUzMDAxc3RhcnQgXHU2QzM4XHU0RTBEXHU4RkJFXHVGRjA5XHVGRjBDXG4gKiBcdTUzNTVcdTZCMjFcdThDMDNcdTc1MjhcdTdFRDVcdTVGMDBcdThCRTVcdTk2NTBcdTUyMzZcdTMwMDJcdTUzNjFcdTcyNDdcdTY1RTBcdTkwMTBcdTVCNTdcdTZFREFcdTUyQThcdUZGMDhcdTZENDFcdTVGMEZcdTgwRkRcdTUyOUJcdTRGRERcdTc1NTlcdTU3MjggZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3RyZWFtSG9zdE9wdGltaXplT3B0aW9ucyB7XG4gIHJwYzogSG9zdFJwYztcbiAgdGV4dDogc3RyaW5nO1xuICBzeXN0ZW06IHN0cmluZztcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgb25EZWx0YSh0ZXh0OiBzdHJpbmcpOiB2b2lkO1xuICBvblJlYXNvbmluZz8odGV4dDogc3RyaW5nKTogdm9pZDtcbiAgb25TdGVwPyhzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyk6IHZvaWQ7XG4gIHRpbWVvdXRNcz86IG51bWJlcjtcbn1cblxuLyoqIFx1ODlFM1x1Njc5MCBTU0UgXHU1RTI3XHVGRjFBXHU4RkQ0XHU1NkRFIHsgZXZlbnQsIGRhdGEgfVx1RkYwOFxcblxcbiBcdTUyMDZcdTVFMjdcdUZGMDlcdTMwMDIgKi9cbmFzeW5jIGZ1bmN0aW9uIHJlYWRTc2VGcmFtZXMoXG4gIHJlc3BvbnNlOiBSZXNwb25zZSxcbiAgb25GcmFtZTogKGV2ZW50OiBzdHJpbmcsIGRhdGE6IHN0cmluZykgPT4gdm9pZCxcbik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCByZWFkZXIgPSByZXNwb25zZS5ib2R5Py5nZXRSZWFkZXIoKTtcbiAgaWYgKCFyZWFkZXIpIHRocm93IG5ldyBFcnJvcignbm8tc3RyZWFtJyk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgbGV0IGJ1ZmZlciA9ICcnO1xuICBmb3IgKDs7KSB7XG4gICAgY29uc3QgeyBkb25lLCB2YWx1ZSB9ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcbiAgICBpZiAoZG9uZSkgYnJlYWs7XG4gICAgYnVmZmVyICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcbiAgICBmb3IgKDs7KSB7XG4gICAgICBjb25zdCBpZHggPSBidWZmZXIuaW5kZXhPZignXFxuXFxuJyk7XG4gICAgICBpZiAoaWR4ID09PSAtMSkgYnJlYWs7XG4gICAgICBjb25zdCBmcmFtZSA9IGJ1ZmZlci5zbGljZSgwLCBpZHgpO1xuICAgICAgYnVmZmVyID0gYnVmZmVyLnNsaWNlKGlkeCArIDIpO1xuICAgICAgbGV0IGV2ZW50ID0gJ21lc3NhZ2UnO1xuICAgICAgbGV0IGRhdGEgPSAnJztcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBmcmFtZS5zcGxpdCgnXFxuJykpIHtcbiAgICAgICAgaWYgKGxpbmUuc3RhcnRzV2l0aCgnZXZlbnQ6JykpIGV2ZW50ID0gbGluZS5zbGljZSg2KS50cmltKCk7XG4gICAgICAgIGVsc2UgaWYgKGxpbmUuc3RhcnRzV2l0aCgnZGF0YTonKSkgZGF0YSA9IGxpbmUuc2xpY2UoNSkudHJpbSgpO1xuICAgICAgfVxuICAgICAgb25GcmFtZShldmVudCwgZGF0YSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjFBZmV0Y2ggU1NFXHVGRjBDXHU5MDEwIHRva2VuIG9uRGVsdGFcdTMwMDJcdTdFRDVcdTVGMDAgcnBjLmNhbGxcdUZGMDhkZXNrdG9wIFx1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NjMwMlx1NkI3Qlx1RkYwOVx1RkYwQ1xuICogXHU0RTVGXHU3RUQ1XHU1RjAwXHU4RjZFXHU4QkUyXHU1RkVCXHU3MTY3XHVGRjA4XHU1RkVCXHU2QTIxXHU1NzhCXHU0RUNEXHU2NjNFXHU0RTAwXHU2QjIxXHU2MDI3XHVGRjA5XHUzMDAyYWJvcnQgPSBzaWduYWwgKyBmZXRjaCBhYm9ydFx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RyZWFtSG9zdE9wdGltaXplKG9wdHM6IFN0cmVhbUhvc3RPcHRpbWl6ZU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IHJwYywgdGV4dCwgc3lzdGVtLCBzaWduYWwsIG9uRGVsdGEsIG9uUmVhc29uaW5nLCBvblN0ZXAgfSA9IG9wdHM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdHMudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUztcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgb25TdGVwPy4oJ21vZGVsJyk7XG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCByZXNvbHZlSG9zdFNlc3Npb25Nb2RlbChycGMsIG9wdHMucnBjVGltZW91dE1zID8/IERFRkFVTFRfUlBDX1RJTUVPVVRfTVMpO1xuICBpZiAoIXNlc3Npb24pIHRocm93IG5ldyBFcnJvcignaG9zdC11bmF2YWlsYWJsZScpO1xuICBvblN0ZXA/Lignc3RhcnQnKTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBjb25zdCBvbkFib3J0ID0gKCkgPT4gY29udHJvbGxlci5hYm9ydCgpO1xuICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0KTtcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aW1lb3V0TXMpO1xuICBsZXQgb3V0ID0gJyc7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyL2FwaS9vcHRpbWl6ZS5zdHJlYW0nLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBwcm92aWRlcjogc2Vzc2lvbi5wcm92aWRlcixcbiAgICAgICAgbW9kZWw6IHNlc3Npb24ubW9kZWwsXG4gICAgICAgIHRleHQsXG4gICAgICAgIHN5c3RlbSxcbiAgICAgICAgLi4uKHNlc3Npb24ucmVhc29uaW5nRWZmb3J0ID8geyByZWFzb25pbmdFZmZvcnQ6IHNlc3Npb24ucmVhc29uaW5nRWZmb3J0IH0gOiB7fSksXG4gICAgICB9KSxcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgfSk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKGBodHRwLSR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgIG9uU3RlcD8uKCdwb2xsJyk7XG4gICAgbGV0IHJlYXNvbmluZyA9ICcnO1xuICAgIGF3YWl0IHJlYWRTc2VGcmFtZXMocmVzcG9uc2UsIChldmVudCwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGRhdGEgPT09ICd7fScgfHwgZGF0YSA9PT0gJ1tET05FXScpIHJldHVybjtcbiAgICAgIGlmIChldmVudCA9PT0gJ3JlYXNvbmluZycpIHtcbiAgICAgICAgcmVhc29uaW5nICs9IGRhdGE7XG4gICAgICAgIG9uUmVhc29uaW5nPy4ocmVhc29uaW5nKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQgPT09ICdkZWx0YScpIHtcbiAgICAgICAgb3V0ICs9IGRhdGE7XG4gICAgICAgIG9uRGVsdGEob3V0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBcdTY3MERcdTUyQTFcdTdBRUZcdTU5Q0JcdTdFQzhcdTRFRTUgZXZlbnQ6ZG9uZSBcdTY1MzZcdTVDM0VcdUZGMENcdTY1RTBcdTY2M0VcdTVGMEZcdTk1MTlcdThCRUZcdTVFMjdcdTUzNzNcdTYyMTBcdTUyOUZcbiAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuICAgIHJldHVybiBvdXQ7XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIHNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQWJvcnQpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Ib3N0T3B0aW1pemUob3B0czogUnVuSG9zdE9wdGltaXplT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgcnBjLCBsYW5nOiBfbGFuZywgdGV4dCwgc3lzdGVtLCBzaWduYWwsIG9uRGVsdGEsIG9uU3RlcCB9ID0gb3B0cztcbiAgY29uc3QgaW50ZXJ2YWxNcyA9IG9wdHMuaW50ZXJ2YWxNcyA/PyBERUZBVUxUX0lOVEVSVkFMX01TO1xuICBjb25zdCB0aW1lb3V0TXMgPSBvcHRzLnRpbWVvdXRNcyA/PyBERUZBVUxUX1RJTUVPVVRfTVM7XG4gIGNvbnN0IHJwY1RpbWVvdXRNcyA9IG9wdHMucnBjVGltZW91dE1zID8/IERFRkFVTFRfUlBDX1RJTUVPVVRfTVM7XG4gIGlmIChzaWduYWwuYWJvcnRlZCkgdGhyb3cgbmV3IEVycm9yKCdhYm9ydGVkJyk7XG5cbiAgLy8gMS4gXHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XG4gIG9uU3RlcD8uKCdtb2RlbCcpO1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgcmVzb2x2ZUhvc3RTZXNzaW9uTW9kZWwocnBjLCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXNlc3Npb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvc3QtdW5hdmFpbGFibGUnKTtcbiAgfVxuXG4gIC8vIDIuIFx1NTQyRlx1NTJBOFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlxuICBvblN0ZXA/Lignc3RhcnQnKTtcbiAgY29uc3Qgc3RhcnRQYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBwcm92aWRlcjogc2Vzc2lvbi5wcm92aWRlcixcbiAgICBtb2RlbDogc2Vzc2lvbi5tb2RlbCxcbiAgICB0ZXh0LFxuICAgIHN5c3RlbSxcbiAgfTtcbiAgaWYgKHNlc3Npb24ucmVhc29uaW5nRWZmb3J0KSBzdGFydFBheWxvYWQucmVhc29uaW5nRWZmb3J0ID0gc2Vzc2lvbi5yZWFzb25pbmdFZmZvcnQ7XG4gIGNvbnN0IHN0YXJ0ID0gYXdhaXQgY2FsbFJwYzx7IHRhc2tJZD86IHN0cmluZyB9PihycGMsICdvcHRpbWl6ZS5zdGFydCcsIHN0YXJ0UGF5bG9hZCwgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFzdGFydC5vayB8fCAhc3RhcnQudmFsdWUgfHwgdHlwZW9mIHN0YXJ0LnZhbHVlLnRhc2tJZCAhPT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBjb2RlID0gKCFzdGFydC5vayAmJiBzdGFydC5lcnJvciAmJiBzdGFydC5lcnJvci5jb2RlKSB8fCAnJztcbiAgICBjb25zdCBkZXRhaWxzID0gKCFzdGFydC5vayAmJiBzdGFydC5lcnJvciAmJiBzdGFydC5lcnJvci5kZXRhaWxzKSB8fCAnJztcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGhvc3Qtc3RhcnQtcmVqZWN0ZWQke2NvZGUgPyBgOiAke2NvZGV9ICR7ZGV0YWlscyB8fCAnJ31gLnRyaW0oKSA6ICcnfWApO1xuICB9XG4gIGNvbnN0IHRhc2tJZCA9IHN0YXJ0LnZhbHVlLnRhc2tJZDtcblxuICAvLyAzLiBcdThGNkVcdThCRTJcdTU4OUVcdTkxQ0ZcdTc2RjRcdTgxRjMgZG9uZVx1RkYwOFx1NjcwRFx1NTJBMVx1N0FFRlx1NjYzRVx1NUYwRlx1NUI4Q1x1NjIxMFx1NEZFMVx1NTNGN1x1RkYwQ1x1NjVFMCBzZXR0bGUgXHU1MTVDXHU1RTk1XHVGRjA5XG4gIG9uU3RlcD8uKCdwb2xsJyk7XG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGxldCBsYXN0ID0gJyc7XG4gIHRyeSB7XG4gICAgZm9yICg7Oykge1xuICAgICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnRlZEF0ID4gdGltZW91dE1zKSB0aHJvdyBuZXcgRXJyb3IoJ3RpbWVvdXQnKTtcbiAgICAgIGxldCBwb2xsOiB7IGRvbmU/OiBib29sZWFuOyB0ZXh0Pzogc3RyaW5nOyBlcnJvcj86IHN0cmluZyB8IG51bGwgfSB8IG51bGwgPSBudWxsO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgY2FsbFJwYzx7IGRvbmU/OiBib29sZWFuOyB0ZXh0Pzogc3RyaW5nOyBlcnJvcj86IHN0cmluZyB8IG51bGwgfT4oXG4gICAgICAgICAgcnBjLFxuICAgICAgICAgICdvcHRpbWl6ZS5wb2xsJyxcbiAgICAgICAgICB7IHRhc2tJZCB9LFxuICAgICAgICAgIHJwY1RpbWVvdXRNcyxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHJlcy5vayAmJiByZXMudmFsdWUpIHBvbGwgPSByZXMudmFsdWU7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gXHU1MzU1XHU2QjIxXHU4RjZFXHU4QkUyXHU1OTMxXHU4RDI1XHU0RTBEXHU4MUY0XHU1NDdEXHVGRjBDXHU0RTBCXHU0RTAwXHU4RjZFXHU1MThEXHU4QkQ1XG4gICAgICB9XG4gICAgICBpZiAocG9sbCkge1xuICAgICAgICBpZiAocG9sbC5lcnJvcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihwb2xsLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0Tm93ID0gcG9sbC50ZXh0ID8/ICcnO1xuICAgICAgICBpZiAodGV4dE5vdyAhPT0gbGFzdCkge1xuICAgICAgICAgIG9uRGVsdGEodGV4dE5vdyk7XG4gICAgICAgICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICAgICAgICBsYXN0ID0gdGV4dE5vdztcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9sbC5kb25lKSB7XG4gICAgICAgICAgcmV0dXJuIHRleHROb3c7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJwYy5jYWxsKCdvcHRpbWl6ZS5hYm9ydCcsIHsgdGFza0lkIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1QzNEXHU1MjlCXG4gICAgfVxuICB9XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIC8qKiBcdTUzOUZcdTU5Q0JcdTk1MTlcdThCRUZcdTdFQzZcdTgyODJcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTU5MzFcdThEMjVcdTdCNDlcdTUzOUZcdTU2RTBcdUZGMENcdTUzNjFcdTcyNDdcdTY2M0VcdTc5M0FcdTUxRkFcdTY3NjVcdTRGQkZcdTRFOEVcdThCQ0FcdTY1QURcdUZGMDkgKi9cbiAgZXJyb3JEZXRhaWw6IHN0cmluZyB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbiAgLyoqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1NEUyRFx1NzY4NFx1NTg5RVx1OTFDRlx1NjU4N1x1NjcyQ1x1RkYwOG9wdGltaXppbmcgXHU2MDAxXHU1QjlFXHU2NUY2XHU2NkY0XHU2NUIwXHVGRjFCXHU5NzVFXHU2RDQxXHU1RjBGXHU1MTY4XHU3QTBCXHU0RTNBXHU3QTdBXHU0RTMyXHVGRjA5ICovXG4gIGRyYWZ0OiBzdHJpbmc7XG4gIC8qKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdTRFMkRcdTc2ODRcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdTY1ODdcdTY3MkNcdUZGMDhcdTZBMjFcdTU3OEJcdTUxNDhcdTRFQTcgcmVhc29uaW5nIFx1NTE4RFx1NEVBN1x1N0I1NFx1Njg0OFx1RkYxQlx1OTY4RiBTU0UgXHU1QjlFXHU2NUY2XHU2RURBXHU1MkE4XHVGRjA5ICovXG4gIHJlYXNvbmluZzogc3RyaW5nO1xuICAvKiogXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHU3Njg0XHU0RjFBXHU4QkREIGlkXHVGRjA4bnVsbCA9IFx1NjcyQVx1N0VEMVx1NUI5QS9cdTUxNjhcdTVDNDBcdUZGMDlcdUZGMUFcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTUzRUFcdTVDNUVcdTRFOEVcdThCRTVcdTRGMUFcdThCRERcdUZGMENcdTUyMDdcdThENzBcdTRFMERcdThEREZcdTk2OEYgKi9cbiAgc2Vzc2lvbklkOiBzdHJpbmcgfCBudWxsO1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU1RjUzXHU1MjREXHU2QjY1XHU5QUE0XHVGRjA4J21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcgfCBudWxsXHVGRjA5XHVGRjFBXHU1MzYxXHU3MjQ3XHU2NjNFXHU3OTNBXHU4RkRCXHU1RUE2XHVGRjBDXHU1QjlBXHU0RjREXHU1MzYxXHU3MEI5ICovXG4gIHN0ZXA6ICdtb2RlbCcgfCAnc3RhcnQnIHwgJ3BvbGwnIHwgbnVsbDtcbn1cblxuLyoqIFx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYxQXJlZHVjZXIgXHU2QzM4XHU0RTBEXHU1MTk5XHU1NkRFXHU1QjgzXHU2MjE2XHU4RkQ0XHU1NkRFXHU1M0VGXHU1M0Q4XHU3Njg0XHU2NUIwXHU1QkY5XHU4QzYxXHVGRjFCXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA4VGFzayA0IHN0b3JlIFx1ODBGNlx1NkMzNFx1RkYwOVx1NUZDNVx1OTg3Qlx1NEVFNSB7IC4uLklOSVRJQUxfUFJFVklFVyB9IFx1NEUzQVx1NkJDRlx1NEYxQVx1OEJERFx1NzlDRFx1NUI1MCAqL1xuZXhwb3J0IGNvbnN0IElOSVRJQUxfUFJFVklFVzogUHJldmlld1N0YXRlID0ge1xuICBzdGF0dXM6ICdpZGxlJyxcbiAgcmVzdWx0OiAnJyxcbiAgZXJyb3JLaW5kOiBudWxsLFxuICBlcnJvckRldGFpbDogbnVsbCxcbiAgZ2VuZXJhdGlvbjogMCxcbiAgZHJhZnQ6ICcnLFxuICByZWFzb25pbmc6ICcnLFxuICBzZXNzaW9uSWQ6IG51bGwsXG4gIHN0ZXA6IG51bGwsXG59O1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3QWN0aW9uID1cbiAgfCB7IHR5cGU6ICdiZWdpbic7IHNlc3Npb25JZD86IHN0cmluZyB8IG51bGwgfVxuICB8IHsgdHlwZTogJ3Nob3cnOyByZXN1bHQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kOyBkZXRhaWw/OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2d1aWRlJyB9XG4gIHwgeyB0eXBlOiAnY2xvc2UnIH1cbiAgfCB7IHR5cGU6ICdkcmFmdCc7IHRleHQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAncmVhc29uaW5nJzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdzdGVwJzsgc3RlcDogJ21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcgfCBudWxsIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VQcmV2aWV3KHN0YXRlOiBQcmV2aWV3U3RhdGUsIGFjdGlvbjogUHJldmlld0FjdGlvbik6IFByZXZpZXdTdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdiZWdpbic6XG4gICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycpIHJldHVybiBzdGF0ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBzdGF0dXM6ICdvcHRpbWl6aW5nJyxcbiAgICAgICAgZXJyb3JLaW5kOiBudWxsLFxuICAgICAgICBlcnJvckRldGFpbDogbnVsbCxcbiAgICAgICAgZHJhZnQ6ICcnLFxuICAgICAgICBzZXNzaW9uSWQ6IGFjdGlvbi5zZXNzaW9uSWQgPz8gbnVsbCxcbiAgICAgICAgc3RlcDogJ21vZGVsJyxcbiAgICAgICAgZ2VuZXJhdGlvbjogc3RhdGUuZ2VuZXJhdGlvbiArIDEsXG4gICAgICB9O1xuICAgIGNhc2UgJ3Nob3cnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAncHJldmlldycsIHJlc3VsdDogYWN0aW9uLnJlc3VsdCwgZHJhZnQ6ICcnIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCwgZXJyb3JEZXRhaWw6IGFjdGlvbi5kZXRhaWwgPz8gbnVsbCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGNhc2UgJ2RyYWZ0JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIGRyYWZ0OiBhY3Rpb24udGV4dCB9IDogc3RhdGU7XG4gICAgY2FzZSAncmVhc29uaW5nJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIHJlYXNvbmluZzogYWN0aW9uLnRleHQgfSA6IHN0YXRlO1xuICAgIGNhc2UgJ3N0ZXAnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8geyAuLi5zdGF0ZSwgc3RlcDogYWN0aW9uLnN0ZXAgfSA6IHN0YXRlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1ODlDNFx1NUI5QVx1NzY4NFx1NTE2Q1x1NUYwMCBBUElcdUZGMDhUYXNrIDQgXHU4RDc3XHU1QjU4XHU1NzI4XHVGRjFCY2FuVHJpZ2dlciBcdTc2ODQgIWJ1c3kgXHU1MzRBXHU4RkI5XHU2MjdGXHU2MkM1XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU4MDRDXHU4RDIzXHVGRjBDXHU1MTc2XHU0RjU5XHU0RkREXHU3NTU5XHU0RUU1XHU1OTA3XHU1NDBFXHU3RUVEXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2FuT3B0aW1pemVGcm9tKHN0YXR1czogUHJldmlld1N0YXR1cyk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3RhdHVzICE9PSAnb3B0aW1pemluZyc7XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMVx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRiBcdTIwMTRcdTIwMTQgXHU2MzA5XHU5NEFFL1x1OTg4NFx1ODlDOFx1NTM2MS9ydW5PcHRpbWl6ZSBcdTUxNzFcdTRFQUJcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayAqL1xuXG5pbXBvcnQge1xuICBJTklUSUFMX1BSRVZJRVcsXG4gIHJlZHVjZVByZXZpZXcsXG4gIHR5cGUgUHJldmlld0FjdGlvbixcbiAgdHlwZSBQcmV2aWV3U3RhdGUsXG59IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTZBMjFcdTU3NTdcdTdFQTdcdTUzNTVcdTRGOEJcdTcyQjZcdTYwMDFcdUZGMDhcdTZCQ0ZcdTYzRDJcdTRFRjZcdTVCOUVcdTRGOEJcdTRFMDBcdTRFRkRcdUZGMUFcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTUxODVcdTUxNjhcdTVDNDBcdTU1MkZcdTRFMDBcdUZGMDkgKi9cbmxldCBzdGF0ZTogUHJldmlld1N0YXRlID0geyAuLi5JTklUSUFMX1BSRVZJRVcgfTtcbmNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuLyoqIFx1OEJGQlx1NUY1M1x1NTI0RFx1NUZFQlx1NzE2N1x1RkYwOFx1N0EzM1x1NUI5QVx1NUYxNVx1NzUyOFx1NzZGNFx1NTIzMFx1NEUwQlx1NEUwMFx1NkIyMSBkaXNwYXRjaFx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdCdXNTdGF0ZSgpOiBQcmV2aWV3U3RhdGUge1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8qKiBcdTZEM0VcdTUzRDFcdTcyQjZcdTYwMDFcdTY3M0FcdTUyQThcdTRGNUNcdTVFNzZcdTkwMUFcdTc3RTVcdThCQTJcdTk2MDVcdTgwMDUgKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaFByZXZpZXcoYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gIHN0YXRlID0gcmVkdWNlUHJldmlldyhzdGF0ZSwgYWN0aW9uKTtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIGxpc3RlbmVyKCk7XG59XG5cbi8qKiBcdThCQTJcdTk2MDVcdTUzRDhcdTUzMTZcdUZGMUJcdThGRDRcdTU2REVcdTkwMDBcdThCQTJcdTUxRkRcdTY1NzAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVQcmV2aWV3QnVzKGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9O1xufSIsICIvKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICsgXHU2QTIxXHU1NzU3XHU3RUE3XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2IFx1MjAxNFx1MjAxNCBcdTcyQjZcdTYwMDFcdTdFQ0ZcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1NTNEMVx1NUUwM1x1RkYwQ1xuICogIFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjA4XHU2ODRDXHU5NzYyXHU2RTMyXHU2N0QzXHU1QzQyXHU1QkY5IGlucHV0LnJpZ2h0L292ZXJsYXkgXHU2OUZEXHU0RjREXHU0RTBEXHU2M0QwXHU0RjlCXHU4RkQ5XHU0RTlCXHU2ODA3XHU1MUM2IHByb3BzXHVGRjBDXG4gKiAgXHU3RUM0XHU0RUY2XHU0RjlEXHU4RDU2XHU1QjgzXHU0RUVDXHU0RjFBXHU1RDI5XHU1RTc2XHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHUyMDE0XHUyMDE0UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOC9cdTk4ODRcdTg5QzhcdTUzNjFcdTRFMERcdTUzRUZcdTg5QzFcdTc2ODRcdTVCOUVcdTZENEJcdTVCOUFcdThCQkFcdUZGMDlcdTMwMDIgKi9cblxuaW1wb3J0IHtcbiAgY2hlY2tDb25maWcsXG4gIG9wdGltaXplU3RyZWFtLFxuICByZXNvbHZlU2Vzc2lvbk1vZGVsLFxuICBSRVFVRVNUX1RJTUVPVVRfTVMsXG4gIHRvRXJyb3JLaW5kLFxuICB0eXBlIExhbmcsXG4gIHR5cGUgT3B0aW1pemVFcnJvcktpbmQsXG4gIHR5cGUgUHJvbXB0Q29uZmlnLFxufSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5Ib3N0T3B0aW1pemUsIHN0cmVhbUhvc3RPcHRpbWl6ZSwgdHlwZSBIb3N0UnBjIH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5pbXBvcnQgeyBidWlsZFN5c3RlbVByb21wdCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGRpc3BhdGNoUHJldmlldyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG4vKipcbiAqIFx1NUY1M1x1NTI0RCBpbi1mbGlnaHQgXHU4QkY3XHU2QzQyXHU3Njg0XHU2M0E3XHU1MjM2XHU1NjY4XHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjA5XHVGRjFBXG4gKiAtIFx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1NjVGNlx1NEUyRFx1NkI2Mlx1NUI4M1x1RkYwQ1x1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzaG93KCkvZmFpbCgpIFx1NTkwRFx1NkQzQlx1NURGMlx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1RkYxQlxuICogLSBydW5PcHRpbWl6ZSBcdTRFRTVcdTMwMENcdTVCNThcdTU3MjhcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzZcdTU2NjhcdTMwMERcdTRFM0FcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDhcdTU0MENcdTRFMDBcdTY1RjZcdTUyM0JcdTUzRUFcdTUxNDFcdThCQjhcdTRFMDBcdTRFMkFcdThCRjdcdTZDNDJcdTU3MjhcdTkwMTRcdUZGMDlcdTMwMDJcbiAqIFx1NkNFOFx1RkYxQVx1NkEyMVx1NTc1N1x1N0VBN1x1NjEwRlx1NTQ3M1x1Nzc0MFx1NTkxQVx1NEYxQVx1OEJERFx1NTQwQ1x1NjVGNlx1NEYxOFx1NTMxNlx1NEYxQVx1NEU5Mlx1NzZGOFx1OEJBOVx1OERFRlx1MjAxNFx1MjAxNFx1OEY5M1x1NTE2NVx1NjgwRlx1NTM1NVx1NEYxQVx1OEJERFx1ODA1QVx1NzEyNlx1NzY4NFx1NEVBNFx1NEU5Mlx1NEUwQlx1NTNFRlx1NjNBNVx1NTNEN1x1NkI2NFx1N0I4MFx1NTMxNlx1MzAwMlxuICovXG5sZXQgYWN0aXZlQ29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG4vKiogXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHU3Njg0XHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHVGRjA4XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU2MzA5XHU0RjFBXHU4QkREXHVGRjFBXHU1NDBDXHU0RjFBXHU4QkREXHU5NjMyXHU2Mjk2XHVGRjFCXHU1RjAyXHU0RjFBXHU4QkREXHU4QkE5XHU4REVGXHVGRjA5ICovXG5sZXQgYWN0aXZlU2Vzc2lvbklkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLyoqIFx1NTE3M1x1OTVFRFx1OTg4NFx1ODlDOFx1NTM2MVx1RkYwOFx1NUU3Nlx1NEUyRFx1NkI2Mlx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlUHJldmlldygpOiB2b2lkIHtcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHtcbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gIH1cbiAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2Nsb3NlJyB9KTtcbn1cblxuLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5Mlx1RkYxQVx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1MjE5MiBcdTgzNDlcdTdBM0ZcdTdBN0EgXHUyMTkyIFx1NzZGNFx1NjNBNVx1OEZENFx1NTZERVx1RkYxQlx1OTE0RFx1N0Y2RVx1N0YzQVx1NTkzMVx1RkYwOGZldGNoIFx1OTAxQVx1OTA1M1x1RkYwOVx1MjE5MiBndWlkZVx1RkYxQlx1NUU3Nlx1NTNEMSBcdTIxOTIgXHU0RTIyXHU1RjAzXHVGRjFCXHU4RDg1XHU2NUY2L1x1NTNENlx1NkQ4OCBcdTIxOTIgdGltZW91dCBcdTYyMTZcdTk3NTlcdTlFRDggKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5PcHRpbWl6ZShjdHg6IHtcbiAgZ2V0Q29uZmlnKCk6IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZygpOiBMYW5nO1xuICBnZXREcmFmdCgpOiBzdHJpbmc7XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTZBMjFcdTU3OEJcdUZGMDhVSSBcdTY4MDdcdTdCN0VcdUZGMDlcdUZGMUJcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTUxODVcdTkwRThcdTgxRUFcdTg4NENcdTg5RTNcdTY3OTAgKi9cbiAgZ2V0U2Vzc2lvbk1vZGVsPygpOiBQcm9taXNlPHsgcHJvdmlkZXI6IHN0cmluZzsgbW9kZWw6IHN0cmluZyB9IHwgbnVsbD47XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDh1c2VTZXNzaW9uTW9kZWwgXHU1RjAwXHU1NDJGXHU2NUY2XHU3NTI4XHVGRjA5XHVGRjFBXHU4MUVBXHU2NzA5IFJQQyBcdTIxOTIgc2VydmVyIGhhbGYgXHU3Njg0IGxsbS5zdHJlYW1cdUZGMENcdTk2RjZcdTkxNERcdTdGNkUgKi9cbiAgaG9zdD86IHtcbiAgICBycGM6IEhvc3RScGM7XG4gIH07XG4gIC8qKiBcdTUzRDFcdThENzdcdTRGMThcdTUzMTZcdTc2ODRcdTRGMUFcdThCREQgaWRcdUZGMDhcdTdFRDFcdTVCOUFcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdUZGMENcdTUyMDdcdTRGMUFcdThCRERcdTRFMERcdThEREZcdTk2OEZcdUZGMDkgKi9cbiAgZ2V0U2Vzc2lvbklkPygpOiBzdHJpbmcgfCBudWxsO1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjb25maWcgPSBjdHguZ2V0Q29uZmlnKCk7XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBpZiAoIWRyYWZ0KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjFBXHU1NDBDXHU0RjFBXHU4QkREXHU1NzI4XHU5MDE0IFx1MjE5MiBcdTRFMjJcdTVGMDNcdTY3MkNcdTZCMjFcdTg5RTZcdTUzRDFcdUZGMDhcdTYzMDlcdTk0QUUgYnVzeSBcdTVERjJcdTc5ODFcdTc1MjhcdTcwQjlcdTUxRkJcdUZGMENcdThGRDlcdTkxQ0NcdTY2MkZcdTdBREVcdTYwMDFcdTY3MDBcdTU0MEVcdTk2MzJcdTdFQkZcdUZGMDlcdUZGMUJcbiAgLy8gXHU1MjA3XHU2MzYyXHU0RjFBXHU4QkREXHU1NDBFXHU1M0QxXHU4RDc3IFx1MjE5MiBcdTRFMkRcdTZCNjJcdTY1RTdcdThCRjdcdTZDNDJcdThCQTlcdThERUZcdUZGMDhcdTU0MDRcdTRGMUFcdThCRERcdTUzRUZcdTcyRUNcdTdBQ0JcdTRGMThcdTUzMTZcdUZGMENcdTVCQkZcdTRFM0JcdTRFMzRcdTY1RjZcdTRGMUFcdThCRERcdTc1MzEgY2FuY2VsIFx1NjUzNlx1NUMzRVx1RkYwOVxuICBjb25zdCBzZXNzaW9uSWQgPSBjdHguZ2V0U2Vzc2lvbklkPy4oKSA/PyBudWxsO1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGlmIChzZXNzaW9uSWQgPT09IGFjdGl2ZVNlc3Npb25JZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgfVxuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnYmVnaW4nLCBzZXNzaW9uSWQgfSk7XG5cbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgYWN0aXZlQ29udHJvbGxlciA9IGNvbnRyb2xsZXI7IC8vIFx1NkNFOFx1NTE4Q1x1N0VEOSBjbG9zZVByZXZpZXcoKVx1RkYwQ1x1NEY5Qlx1NTM2MVx1NzI0N1x1NTE3M1x1OTVFRFx1NjVGNlx1NTNENlx1NkQ4OFx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0MlxuICBhY3RpdmVTZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gIGxldCB0aW1lZE91dCA9IGZhbHNlO1xuICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRpbWVkT3V0ID0gdHJ1ZTtcbiAgICBjb250cm9sbGVyLmFib3J0KCk7XG4gIH0sIFJFUVVFU1RfVElNRU9VVF9NUyk7XG5cbiAgdHJ5IHtcbiAgICAvLyBcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdUZGMUFcdTVCQkZcdTRFM0JcdTRFMzRcdTY1RjZcdTVCRjlcdThCRERcdTkwMUFcdTkwNTMgXHUyMDE0XHUyMDE0IFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwQ1x1NjVFMFx1OTcwMCBjaGVja0NvbmZpZ1xuICAgIGlmIChjb25maWcudXNlU2Vzc2lvbk1vZGVsICYmIGN0eC5ob3N0KSB7XG4gICAgICBhd2FpdCBzdHJlYW1Ib3N0T3B0aW1pemUoe1xuICAgICAgICBycGM6IGN0eC5ob3N0LnJwYyxcbiAgICAgICAgdGV4dDogZHJhZnQsXG4gICAgICAgIHN5c3RlbTogYnVpbGRTeXN0ZW1Qcm9tcHQoY3R4LmdldExhbmcoKSksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIHJwY1RpbWVvdXRNczogNTAwMCxcbiAgICAgICAgb25EZWx0YTogKHRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQgfSksXG4gICAgICAgIG9uUmVhc29uaW5nOiAodGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3JlYXNvbmluZycsIHRleHQgfSksXG4gICAgICAgIG9uU3RlcDogKHN0ZXApID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzdGVwJywgc3RlcCB9KSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IHtcbiAgICAgICAgICAvLyBTU0UgXHU1REYyXHU5MDEwIHRva2VuIFx1NkQ0MVx1OEZDNyBkcmFmdFx1RkYxQlx1NjUzNlx1NUMzRVx1NEVDNVx1NTIwN1x1NTIzMFx1N0VEM1x1Njc5Q1x1NjAwMVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGtpbmQgPSB0b0Vycm9yS2luZChlKS5raW5kO1xuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZCwgZGV0YWlsOiBTdHJpbmcoKGUgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZSA/PyBlKSB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA4XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCL1x1NUJCRlx1NEUzQlx1NEUwRFx1NTNFRlx1NzUyOFx1OTY0RFx1N0VBN1x1RkYwOVx1NjI0RFx1ODk4MVx1NkM0Mlx1OTE0RFx1N0Y2RVxuICAgIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2d1aWRlJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMUFcdTZENEZcdTg5QzhcdTU2NjggZmV0Y2ggXHU3NkY0XHU4RkRFXHU4MUVBXHU5MTREIEFQSVx1RkYwOFx1NkQ0MVx1NUYwRlx1RkYwOVxuICAgIC8vIFx1NkEyMVx1NTc4Qlx1ODlFM1x1Njc5MFx1RkYxQXVzZVNlc3Npb25Nb2RlbFx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1MjE5MiBcdTVCQkZcdTRFM0JcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTRFQzVcdTRGNUMgbW9kZWwgXHU1NDBEXHU1NkRFXHU5MDAwXHU0RjdGXHU3NTI4XHVGRjBDXHU5NzAwXHU5MTREXHU3RjZFXHU1REYyXHU1QzMxXHU3RUVBXHVGRjA5XHVGRjFCXHU1NDI2XHU1MjE5IFx1MjE5MiBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcbiAgICBsZXQgbW9kZWwgPSBjb25maWcubW9kZWw7XG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25Nb2RlbCA9IGF3YWl0IGN0eC5nZXRTZXNzaW9uTW9kZWw/LigpO1xuICAgICAgaWYgKHNlc3Npb25Nb2RlbCAmJiBzZXNzaW9uTW9kZWwubW9kZWwpIG1vZGVsID0gc2Vzc2lvbk1vZGVsLm1vZGVsO1xuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAgIC8vIFx1NUM1NVx1NzkzQVx1N0QyRlx1NzlFRlx1RkYxQVx1NkI2M1x1NjU4N1x1NEYxOFx1NTE0OFx1RkYxQlx1NkI2M1x1NjU4N1x1NUMxQVx1NjcyQVx1NTFGQVx1NzNCMFx1RkYwOHY0IFx1N0NGQlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNVx1NjNBOFx1NzQwNlx1RkYwOVx1NjVGNlx1NUM1NVx1NzkzQVx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwQ1x1OEJBOVx1NkQ0MVx1NUYwRlx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgIGxldCByZWFzb25pbmcgPSAnJztcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzaG93biA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcHRpbWl6ZVN0cmVhbSh7XG4gICAgICAgIGNvbmZpZzogZWZmZWN0aXZlLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgY29udGVudCArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFzb25pbmcgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0OiBzaG93biB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gXHU1MTQ4XHU1MjI0XHU1QjlBXHU0RTJEXHU2QjYyXHVGRjFBXHU3NTI4XHU2MjM3L1x1N0VDNFx1NEVGNlx1NTNENlx1NkQ4OFx1NEUwRVx1OEQ4NVx1NjVGNlx1OTBGRFx1ODg2OFx1NzNCMFx1NEUzQSBBYm9ydEVycm9yXHVGRjFCXHU0RUM1XHU4RDg1XHU2NUY2XHU1MTk5XHU1MTY1XHU5NTE5XHU4QkVGXHU2MDAxXG4gICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBcdTk4NzZcdTVDNDJcdTUxNUNcdTVFOTVcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTMgcmVqZWN0IFx1NURGMlx1ODhBQiAudGhlbiBcdTZEODhcdTUzMTZcdUZGMUJcdTZCNjRcdTU5MDRcdTRGRERcdTYyQTQgZmV0Y2ggXHU1MjA2XHU2NTJGXHU0RUU1XHU1OTE2XHU3Njg0XHU2MTBGXHU1OTE2XHU1RjAyXHU1RTM4XHVGRjA5XG4gICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhY3RpdmVDb250cm9sbGVyID09PSBjb250cm9sbGVyKSB7XG4gICAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2NhcmQuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWNhcmQge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDEycHg7XG4gIHJpZ2h0OiAxMnB4O1xuICBib3R0b206IGNhbGMoMTAwJSArIDhweCk7XG4gIHotaW5kZXg6IDQwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctb3ZlcmxheSwgI2ZmZik7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsIHJnYmEoMTI4LDEyOCwxMjgsMC4zKSk7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIGJveC1zaGFkb3c6IDAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjE2KTtcbiAgcGFkZGluZzogMTJweCAxNHB4O1xuICBtYXgtaGVpZ2h0OiAzMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4uZHNoLXBvLWNhcmQtaGVhZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuLmRzaC1wby1jYXJkLWJvZHkge1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzQ0NCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDEuNjtcbiAgbWF4LWhlaWdodDogMjAwcHg7XG59XG4uZHNoLXBvLWNhcmQtZXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLmRzaC1wby1jYXJkLXN0ZXAge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKTtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBtYXJnaW4tbGVmdDogNHB4O1xufVxuLmRzaC1wby1jYXJkLWVyci1kZXRhaWwge1xuICBtYXJnaW4tdG9wOiA0cHg7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtdGV4dC1zZWNvbmRhcnksICM4YzkzYTEpO1xuICBmb250LXNpemU6IDEycHg7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLWFsbDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUEtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5IFx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NVx1ODI3MiBcdTIxOTIgXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU0RTBEXHU1M0VGXHU4QkZCXHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5ICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRTdGF0ZShnZXRQcmV2aWV3QnVzU3RhdGUoKSkpLFxuICAgIFtdLFxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHsgc3RhdHVzLCByZXN1bHQsIGVycm9yS2luZCB9ID0gc3RhdGU7XG4gIGNvbnN0IFtjb3BpZWQsIHNldENvcGllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNvcHlUaW1lclJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMUFcdTUyMDdcdTYzNjJcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTRFMERcdThEREZcdTk2OEZcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdTU2REVcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTYwNjJcdTU5MERcdUZGMDlcbiAgaWYgKHN0YXR1cyAhPT0gJ2lkbGUnICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNpZCA9IGdldFNlc3Npb25JZD8uKCk7XG4gICAgaWYgKHNpZCAhPT0gbnVsbCAmJiBzdGF0ZS5zZXNzaW9uSWQgIT09IHNpZCkgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZXRyeSA9ICgpID0+IHtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gcmVhZENvbXBvc2VyVGV4dCgpLFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgaG9zdDogZ2V0SG9zdD8uKCkgPz8gdW5kZWZpbmVkLFxuICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgd3JpdGVDb21wb3NlclRleHQocmVzdWx0KTtcbiAgICBjbG9zZVByZXZpZXcoKTtcbiAgfTtcblxuICBjb25zdCBjb3B5ID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuOyAvLyBcdTk3NUVcdTVCODlcdTUxNjhcdTRFMEFcdTRFMEJcdTY1ODdcdUZGMDhodHRwIFx1N0I0OVx1RkYwOVx1RkYxQVx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMENcdTRGRERcdTYzMDFcdTUzRUZcdTkxQ0RcdThCRDVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0KTtcbiAgICAgIGlmICghbW91bnRlZFJlZi5jdXJyZW50KSByZXR1cm47IC8vIGF3YWl0IFx1NjcxRlx1OTVGNFx1N0VDNFx1NEVGNlx1NURGMlx1NTM3OFx1OEY3RFx1RkYxQVx1NEUwRFx1NTE4RCBzZXRTdGF0ZVxuICAgICAgc2V0Q29waWVkKHRydWUpO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHNldENvcGllZChmYWxzZSk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH0sIDEyMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjZBXHU4RDM0XHU2NzdGXHU1MTk5XHU1MTY1XHU1OTMxXHU4RDI1XHVGRjFBXHU5NzU5XHU5RUQ4XHVGRjA4XHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwOVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmRcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWhlYWRcIj5cbiAgICAgICAgPHNwYW4+e3QoJ2NhcmQudGl0bGUnKX08L3NwYW4+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGNsb3NlUHJldmlldygpOyBvcGVuU2V0dGluZ3MoKTsgfX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5hY3Rpb24nKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ29wdGltaXppbmcnICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+XG4gICAgICAgICAge3N0YXRlLnJlYXNvbmluZyAmJiAhc3RhdGUuZHJhZnQgPyAoXG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcsXG4gICAgICAgICAgICAgICAgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtdGV4dC1zZWNvbmRhcnksICM4YzkzYTEpJyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7c3RhdGUucmVhc29uaW5nfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICkgOiBudWxsfVxuICAgICAgICAgIHtzdGF0ZS5kcmFmdCA/IDxzcGFuIHN0eWxlPXt7IHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcgfX0+e3N0YXRlLmRyYWZ0fTwvc3Bhbj4gOiBudWxsfVxuICAgICAgICAgIHshc3RhdGUuZHJhZnQgJiYgIXN0YXRlLnJlYXNvbmluZyA/IHQoJ2NhcmQub3B0aW1pemluZycpIDogbnVsbH1cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAncHJldmlldycgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPntyZXN1bHR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmVwbGFjZX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJlcGxhY2UnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gdm9pZCBjb3B5KCl9PlxuICAgICAgICAgICAgICB7Y29waWVkID8gdCgnY2FyZC5jb3B5RG9uZScpIDogdCgnY2FyZC5jb3B5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnZXJyb3InICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyclwiPnt0KGVycm9yS2V5KGVycm9yS2luZCkpfTwvZGl2PlxuICAgICAgICAgIHtlcnJvckRldGFpbCA/IDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyLWRldGFpbFwiPntlcnJvckRldGFpbH08L2Rpdj4gOiBudWxsfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSIsICIvKiogXHU4QkJFXHU3RjZFIFx1MjE5MiBHZW5lcmFsIFx1NTMzQVx1MzAwQ1Byb21wdCBcdTRGMThcdTUzMTZcdTMwMERcdThCQkVcdTdGNkVcdTg4NENcdUZGMUFcdTY4MDdcdTk4OThcdTY0NThcdTg5ODEgKyBcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1TdGF0ZSwgU2V0dGluZ3NGb3JtVmFsdWVzIH0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtQWN0aW9ucyB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHsgb25PcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUm93UHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFNldHRpbmdzRm9ybVN0YXRlKSA9PiBUKSA9PiBUO1xuICBhY3Rpb25zOiBTZXR0aW5nc0Zvcm1BY3Rpb25zO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgc2F2ZUNvbmZpZzogKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiBQcm9taXNlPHZvaWQ+O1xuICByZXNldENvbmZpZzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0RXBvY2g6ICgpID0+IG51bWJlcjtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1ODFFQVx1NjhDMFx1RkYxQVx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NjYyRlx1NTQyNlx1NTNFRlx1N0VDRiBzZXJ2ZXIgaGFsZiBcdTgzQjdcdTUzRDZcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdTkwMUFcdTkwNTNcdTc2ODRcdTUwNjVcdTVFQjdcdTYzQTJcdTk0ODhcdUZGMDkgKi9cbiAgZ2V0SG9zdFN0YXR1cz86ICgpID0+IFByb21pc2U8eyBhdmFpbGFibGU6IGJvb2xlYW47IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfSB8IG51bGw+O1xufVxuXG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9zZXR0aW5ncy5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5vcHRpU2V0dGluZ3Mge1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIHBhZGRpbmc6IDE2cHggMDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4ub3B0aVNldHRpbmdzVGl0bGUge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAyMnB4O1xufVxuLm9wdGlTZXR0aW5nc0hpbnQge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0Zvcm0ge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0ZpZWxkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzTGFiZWwge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NJbnB1dCB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1sYXllci0yKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgcGFkZGluZzogNnB4IDhweDtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLm9wdGlTZXR0aW5nc1JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuLm9wdGlTZXR0aW5nc0J0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTJweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG59XG4ub3B0aVNldHRpbmdzQnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUFcdTRFM0JcdTk4OThcdTUzRDhcdTkxQ0ZcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTRGMUFcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDUvXHU2REYxXHU2NzgxXHU3QUVGXHU4MjcyXHVGRjA4XHU5RUQxXHU1RTk1XHU5RUQxXHU1QjU3XHUzMDAxXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU1NzQ3XHU4OEFCXHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5XHVGRjBDXG4gICAgIFx1NTZGQVx1NUI5QVx1NTRDMVx1NzI0Q1x1ODRERCArIFx1NzY3RFx1NUI1N1x1NEZERFx1OEJDMVx1NEVGQlx1NEY1NVx1NEUzQlx1OTg5OFx1NTNFRlx1OEJGQiAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbi5vcHRpU2V0dGluZ3NFcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEycHg7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNldHRpbmdzUm93KHByb3BzOiBTZXR0aW5nc1Jvd1Byb3BzKSB7XG4gIGNvbnN0IHsgdCwgdXNlU3RvcmUsIGFjdGlvbnMsIGdldENvbmZpZywgc2F2ZUNvbmZpZywgcmVzZXRDb25maWcsIGdldEVwb2NoLCBnZXRIb3N0U3RhdHVzIH0gPSBwcm9wcztcbiAgY29uc3QgW2hvc3RTdGF0dXMsIHNldEhvc3RTdGF0dXNdID0gdXNlU3RhdGU8eyBhdmFpbGFibGU6IGJvb2xlYW47IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfSB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFnZXRIb3N0U3RhdHVzKSByZXR1cm47XG4gICAgbGV0IGFsaXZlID0gdHJ1ZTtcbiAgICBnZXRIb3N0U3RhdHVzKCkudGhlbigoc3QpID0+IHsgaWYgKGFsaXZlKSBzZXRIb3N0U3RhdHVzKHN0KTsgfSkuY2F0Y2goKCkgPT4geyBpZiAoYWxpdmUpIHNldEhvc3RTdGF0dXMoeyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogJ3JwYy1mYWlsZWQnIH0pOyB9KTtcbiAgICByZXR1cm4gKCkgPT4geyBhbGl2ZSA9IGZhbHNlOyB9O1xuICB9LCBbZ2V0SG9zdFN0YXR1c10pO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsLCB1c2VTZXNzaW9uTW9kZWw6IGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgfSxcbiAgICAgIHN1Ym1pdFJldmlzaW9uICsgZ2V0RXBvY2goKSxcbiAgICApO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgfSwgW2NvbmZpZy5iYXNlVXJsLCBjb25maWcuYXBpS2V5LCBjb25maWcubW9kZWwsIGNvbmZpZy51c2VTZXNzaW9uTW9kZWwsIGdldEVwb2NoXSk7XG5cbiAgLy8gXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHVGRjA4XHU5ODg0XHU4OUM4XHU1MzYxXHU2NzJBXHU5MTREXHU3RjZFXHU1RjE1XHU1QkZDXHVGRjA5XHUyMTkyIFx1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KCgpID0+IHNldEV4cGFuZGVkKHRydWUpKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZVNhdmUgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgY29uc3QgZXJyb3JzID0gYWN0aW9ucy52YWxpZGF0ZSh2YWx1ZXMpO1xuICAgIGlmIChlcnJvcnMpIHtcbiAgICAgIGFjdGlvbnMuZmFpbChPYmplY3QudmFsdWVzKGVycm9ycylbMF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2F2ZUNvbmZpZyh2YWx1ZXMpO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICAgIC8vIFx1NEUwRVx1NjU0OFx1NUU5NFx1NTZERVx1OEREMVx1NzY4NCBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwOFx1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1N0VBQVx1NTE0M1x1RkYwOVx1NUJGOVx1OUY1MFx1RkYwQ1x1NEY3Rlx1NEZERFx1NUI1OFx1NTQwRVx1NzY4NFx1OTFDRFx1NjRBRFx1NzlDRFx1ODhBQlx1NjI5MVx1NTIzNlxuICAgICAgYWN0aW9ucy5jb21taXQoc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnNhdmVGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUmVzZXQgPSBhc3luYyAoKSA9PiB7XG4gICAgc2V0UnBjRXJyb3IobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJlc2V0Q29uZmlnKCk7XG4gICAgICBhY3Rpb25zLnNlZWQoXG4gICAgICAgIHsgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCwgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksIG1vZGVsOiBERUZBVUxUUy5tb2RlbCB9LFxuICAgICAgICBzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpLFxuICAgICAgKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgfSBjYXRjaCAob3V0ZXIpIHtcbiAgICAgIHNldFJwY0Vycm9yKGAke3QoJ3NldHRpbmdzLnJlc2V0RmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzVGl0bGVcIiBvbkNsaWNrPXsoKSA9PiBzZXRFeHBhbmRlZCgodikgPT4gIXYpfSBzdHlsZT17eyBjdXJzb3I6ICdwb2ludGVyJyB9fT5cbiAgICAgICAge3QoJ3NldHRpbmdzLnRpdGxlJyl9XG4gICAgICAgIHshZXhwYW5kZWQgJiZcbiAgICAgICAgICAodmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KCdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJyl9PC9zcGFuPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCh2YWx1ZXMuYXBpS2V5ID8gJ2NhcmQuY29uZmlndXJlZC5oaW50JyA6ICdjYXJkLnVuY29uZmlndXJlZC5oaW50JykucmVwbGFjZSgne21vZGVsfScsIG1vZGVsTGFiZWwpfTwvc3Bhbj5cbiAgICAgICAgICApKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7ZXhwYW5kZWQgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0Zvcm1cIj5cbiAgICAgICAgICB7Z2V0SG9zdFN0YXR1cyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCIgc3R5bGU9e3sgZmxleERpcmVjdGlvbjogJ3JvdycgfX0+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiBob3N0U3RhdHVzPy5hdmFpbGFibGUgPyAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLXN1Y2Nlc3MtcHJpbWFyeSwgIzJmOWU2MyknIDogJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKScsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHtob3N0U3RhdHVzID09PSBudWxsXG4gICAgICAgICAgICAgICAgICA/IHQoJ3NldHRpbmdzLmhvc3RQcm9iZScpXG4gICAgICAgICAgICAgICAgICA6IGhvc3RTdGF0dXMuYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgID8gYCR7dCgnc2V0dGluZ3MuaG9zdE9rJyl9ICR7aG9zdFN0YXR1cy5wcm92aWRlcn0vJHtob3N0U3RhdHVzLm1vZGVsfWBcbiAgICAgICAgICAgICAgICAgICAgOiBgJHt0KCdzZXR0aW5ncy5ob3N0RmFpbCcpfSAke2hvc3RTdGF0dXMuZXJyb3IgPz8gJyd9YH1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICBjaGVja2VkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCd1c2VTZXNzaW9uTW9kZWwnLCBlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgLz57JyAnfVxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJyl9XG4gICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50Jyl9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdiYXNlVXJsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1hcGkta2V5XCI+e3QoJ3NldHRpbmdzLmFwaUtleScpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWFwaS1rZXlcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYXBpS2V5fVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cInNrLVx1MjAyNlwiXG4gICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYXBpS2V5JywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1tb2RlbFwiPnt0KCdzZXR0aW5ncy5tb2RlbCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLW1vZGVsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLm1vZGVsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/ICdcdTIwMTQnIDogREVGQVVMVFMubW9kZWx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYxQVx1NEYxOFx1NTMxNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVybCA9IHZhbHVlcy5iYXNlVXJsLnRyaW0oKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdmFsdWVzLmFwaUtleS50cmltKCkpIGVycm9ycy5hcGlLZXkgPSAnc2V0dGluZ3MuYXBpS2V5JztcbiAgaWYgKCF2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsICYmICF2YWx1ZXMubW9kZWwudHJpbSgpKSBlcnJvcnMubW9kZWwgPSAnc2V0dGluZ3MubW9kZWwnO1xuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RhdGUge1xuICB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcztcbiAgZGlydHk6IGJvb2xlYW47XG4gIHNhdmVkOiBib29sZWFuO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aXNpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IElOSVRJQUxfU0VUVElOR1NfRk9STTogU2V0dGluZ3NGb3JtU3RhdGUgPSB7XG4gIHZhbHVlczogeyBiYXNlVXJsOiAnJywgYXBpS2V5OiAnJywgbW9kZWw6ICcnLCB1c2VTZXNzaW9uTW9kZWw6IHRydWUgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIH1cbiAgfCB7IHR5cGU6ICdjb21taXQnOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsgbWVzc2FnZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VTZXR0aW5nc0Zvcm0oc3RhdGU6IFNldHRpbmdzRm9ybVN0YXRlLCBhY3Rpb246IFNldHRpbmdzRm9ybUFjdGlvbik6IFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ3NlZWQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5yZXZpc2lvbiA8PSBzdGF0ZS5yZXZpc2lvblxuICAgICAgICA/IHN0YXRlXG4gICAgICAgIDogeyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLmFjdGlvbi52YWx1ZXMgfSwgZGlydHk6IGZhbHNlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZWRpdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLnN0YXRlLnZhbHVlcywgW2FjdGlvbi5maWVsZF06IGFjdGlvbi52YWx1ZSB9LCBkaXJ0eTogdHJ1ZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xuICAgIGNhc2UgJ2NvbW1pdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBlcnJvcjogYWN0aW9uLm1lc3NhZ2UgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1VPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxpQkFBaUI7QUFDbkI7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFPLEtBQUssV0FBVyxXQUFXLElBQUksU0FBUyxTQUFTO0FBR3ZFLFFBQU0sV0FBVyxPQUFPLEtBQUssVUFBVSxZQUFZLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUssSUFBSSxTQUFTO0FBQ2xHLFFBQU0sa0JBQ0osYUFBYSxtQkFBbUIsaUJBQWlCLE9BQU8sTUFBTSxTQUFTLFVBQVUsU0FBUyxRQUFRO0FBQ3BHLFFBQU0sUUFBUTtBQUNkLFFBQU0sa0JBQWtCLE9BQU8sS0FBSyxvQkFBb0IsWUFBWSxJQUFJLGtCQUFrQixTQUFTO0FBQ25HLFNBQU8sRUFBRSxTQUFTLGlCQUFpQixPQUFPLEdBQUcsUUFBUSxPQUFPLGdCQUFnQjtBQUM5RTtBQUtPLFNBQVMsWUFBWSxRQUFtQztBQUM3RCxNQUFJLENBQUMsT0FBTyxPQUFPLEtBQUssRUFBRyxRQUFPLEVBQUUsSUFBSSxPQUFPLFFBQVEsY0FBYztBQUVyRSxNQUFJLENBQUMsT0FBTyxtQkFBbUIsQ0FBQyxP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QUk7QUFDZCxzQkFBSSxPQUFPLEVBQUUsYUFBYSxZQUFZLE9BQU8sRUFBRSxVQUFVLFVBQVU7QUFDakUsMkJBQU8sRUFBRSxXQUFXLE1BQU0sVUFBVSxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU07QUFBQSxrQkFDakU7QUFDQSx5QkFBTyxFQUFFLFdBQVcsT0FBTyxPQUFRLElBQUksVUFBVSxJQUFJLE1BQU0sV0FBVyxJQUFJLE1BQU0sU0FBVSxXQUFXO0FBQUEsZ0JBQ3ZHO0FBQ0EsdUJBQU8sRUFBRSxXQUFXLE9BQU8sT0FBUSxJQUFJLFVBQVUsSUFBSSxNQUFNLFdBQVcsSUFBSSxNQUFNLFNBQVUsYUFBYTtBQUFBLGNBQ3pHLFNBQVMsR0FBRztBQUNWLHVCQUFPLEVBQUUsV0FBVyxPQUFPLE9BQU8sT0FBUSxHQUE2QixXQUFXLENBQUMsRUFBRTtBQUFBLGNBQ3ZGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
