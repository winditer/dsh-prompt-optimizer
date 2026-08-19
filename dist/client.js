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
  const { rpc, lang: _lang, text, system, signal, onDelta, onStep, trace } = opts;
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const rpcTimeoutMs = opts.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  if (signal.aborted) throw new Error("aborted");
  onStep?.("model");
  trace?.(`runHostOptimize: sessionModel textLen=${text.length}`);
  const session = await resolveHostSessionModel(rpc, rpcTimeoutMs);
  if (!session) {
    trace?.("runHostOptimize: sessionModel FAILED");
    throw new Error("host-unavailable");
  }
  onStep?.("start");
  const startPayload = {
    provider: session.provider,
    model: session.model,
    text,
    system
  };
  if (session.reasoningEffort) startPayload.reasoningEffort = session.reasoningEffort;
  const start = await callRpc(rpc, "optimize.start", startPayload, rpcTimeoutMs);
  if (!start.ok || !start.value || typeof start.value.taskId !== "string") {
    const code = !start.ok && start.error && start.error.code || "";
    const details = !start.ok && start.error && start.error.details || "";
    trace?.("runHostOptimize: start FAILED");
    throw new Error(`host-start-rejected${code ? `: ${code} ${details || ""}`.trim() : ""}`);
  }
  const taskId = start.value.taskId;
  trace?.(`runHostOptimize: start ok task=${taskId}`);
  onStep?.("poll");
  const startedAt = Date.now();
  let last = "";
  try {
    for (; ; ) {
      if (signal.aborted) throw new Error("aborted");
      if (Date.now() - startedAt > timeoutMs) throw new Error("timeout");
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
        if (poll.error) {
          trace?.("runHostOptimize: poll error " + poll.error);
          throw new Error(poll.error);
        }
        const textNow = poll.text ?? "";
        if (textNow !== last) {
          onDelta(textNow);
          if (signal.aborted) throw new Error("aborted");
          last = textNow;
        }
        if (poll.done) {
          trace?.(`runHostOptimize: done textLen=${textNow.length}`);
          return textNow;
        }
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
  errorDetail: null,
  generation: 0,
  draft: "",
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
  ctx.trace?.(`runOptimize: called draftLen=${draft.length} useSessionModel=${config.useSessionModel}`);
  if (!draft) {
    ctx.trace?.("runOptimize: empty draft -> return");
    return;
  }
  const sessionId = ctx.getSessionId?.() ?? null;
  if (activeController !== null) {
    if (sessionId === activeSessionId) {
      ctx.trace?.("runOptimize: same-session inflight -> debounce");
      return;
    }
    ctx.trace?.("runOptimize: different session -> abort stale");
    activeController.abort();
    activeController = null;
    activeSessionId = null;
  }
  ctx.trace?.("runOptimize: dispatch begin");
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
      ctx.trace?.("runOptimize: host branch -> runHostOptimize");
      await runHostOptimize({
        rpc: ctx.host.rpc,
        lang: ctx.getLang(),
        text: draft,
        system: buildSystemPrompt(ctx.getLang()),
        signal: controller.signal,
        onDelta: (text) => dispatchPreview({ type: "draft", text }),
        onStep: (step) => dispatchPreview({ type: "step", step }),
        trace: (msg) => {
          console.warn("[dsh-prompt-optimizer]", msg);
        }
      }).then(
        (finalText) => dispatchPreview({ type: "show", result: finalText }),
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
      getHost,
      getSessionId,
      trace: (msg) => {
        console.warn("[dsh-prompt-optimizer]", msg);
      }
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

// src/build-id.ts
var BUILD_ID = "402a923";

// src/SettingsRow.tsx
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
      getHostStatus && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "optiSettingsField", style: { flexDirection: "row" }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "span",
        {
          className: "optiSettingsHint",
          style: {
            color: hostStatus?.available ? "var(--dsw-alias-state-success-primary, #2f9e63)" : "var(--dsw-alias-state-error-primary, #d03050)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "var(--dsw-alias-text-secondary, #8c93a1)" }, children: ` \xB7 build ${BUILD_ID}` }),
            hostStatus === null ? t("settings.hostProbe") : hostStatus.available ? `${t("settings.hostOk")} ${hostStatus.provider}/${hostStatus.model}` : `${t("settings.hostFail")} ${hostStatus.error ?? ""}`
          ]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL2J1aWxkLWlkLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1zdG9yZS50cyIsICIuLi9zcmMvc2V0dGluZ3MtZm9ybS1zdGF0ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqIGRzaC1wcm9tcHQtb3B0aW1pemVyIFx1NjNEMlx1NEVGNlx1NTE2NVx1NTNFMyBcdTIwMTQgYXBwbHkoY3R4KSAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTLCBtZXJnZUNvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IE5TLCB6aCwgZW4sIGxhbmdPZiB9IGZyb20gJy4vbG9jYWxlcy5qcyc7XG5pbXBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBlbWl0T3B0aW1pemVSZXF1ZXN0LCBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcbmltcG9ydCB7IE9wdGltaXplQnV0dG9uIH0gZnJvbSAnLi9PcHRpbWl6ZUJ1dHRvbi50c3gnO1xuaW1wb3J0IHsgUHJldmlld0NhcmQgfSBmcm9tICcuL1ByZXZpZXdDYXJkLnRzeCc7XG5pbXBvcnQgeyBTZXR0aW5nc1JvdyB9IGZyb20gJy4vU2V0dGluZ3NSb3cudHN4JztcbmltcG9ydCB7IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgdHlwZSB7IEhvc3RScGMgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHdpdGhUaW1lb3V0LCBjYWxsSG9zdCB9IGZyb20gJy4vc2Vzc2lvbi1vcHRpbWl6ZXIuanMnO1xuXG4vKipcbiAqIFx1NThGMFx1NjYwRVx1NjNEMlx1NEVGNlx1NEY5RFx1OEQ1Nlx1NzY4NFx1NUJBMlx1NjIzN1x1N0FFRlx1NjcwRFx1NTJBMVx1RkYwOGNvcmRpcyBzZXJ2aWNlIGtleXNcdUZGMDlcdUZGMUFhcHBseSBcdTUxODVcdTdFQ0YgYGN0eC48c2VydmljZT5gIFx1OEJCRlx1OTVFRVx1NzY4NFx1NjcwRFx1NTJBMVx1NUZDNVx1OTg3Qlx1NTcyOFx1NkI2NFx1NThGMFx1NjYwRVx1MzAwMlxuICogXHU1MDNDXHU5ODdCXHU0RTNBXHU2NzBEXHU1MkExXHU1NDBEXHU4MDBDXHU5NzVFXHU1MzA1IGlkXHUyMDE0XHUyMDE0XHU0RTBFXHU1NDBDXHU1RjYyXHU2MDAxXHU1MTQ4XHU0RjhCXHU0RTAwXHU4MUY0XHVGRjA4ZHNoLW1lc3NhZ2UtcmFpbDogW1wic2xvdHNcIixcInNlc3Npb25zXCJdXHVGRjFCXG4gKiBkc2gtYmV0dGVyLXNpZGViYXIgXHU0RUE2XHU1OEYwXHU2NjBFIGxvY2FsZVx1RkYwOVx1RkYxQlx1OTUxOVx1OEJFRlx1NThGMFx1NjYwRVx1NEYxQVx1OEJBOSBmaWJlciBcdTZDMzhcdTRFNDUgUEVORElOR1x1RkYwQ1x1NTQyRlx1NTJBOFx1NUJBMVx1OEJBMVx1NzZGNFx1NjNBNVx1NTIyNFx1NTkzMVx1OEQyNVx1MzAwMlxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gWydzbG90cycsICdzZXNzaW9ucycsICdsb2NhbGUnLCAnY29ubmVjdGlvbiddO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHkoY3R4OiBDbGllbnRDb250ZXh0KSB7XG4gIC8vIDEuIFx1NjU4N1x1Njg0OFxuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIHsgemgsIGVuIH0pLCAncHJvbXB0LW9wdGltaXplcjogbG9jYWxlIHJlZ2lzdHJhdGlvbicpO1xuXG4gIC8vIDIuIFx1OTE0RFx1N0Y2RVx1OTU1Q1x1NTBDRlx1RkYxQVx1ODFFQVx1NjMwMSBSUEMgXHU5MTREXHU3RjZFXHVGRjA4c2VydmVyIGhhbGYgXHU4QkZCXHU1MTk5IH4vLmRzaC9wcm9tcHQtb3B0aW1pemVyLWNvbmZpZy5qc29uXHVGRjBDXHU5MDFBXHU5MDUzXG4gIC8vICcvZHNoLXByb21wdC1vcHRpbWl6ZXInXHUyMDE0XHUyMDE0XHU1NDBDIGRzaC1zdGlja3ktbm90ZSBcdTZBMjFcdTVGMEZcdUZGMDlcdTMwMDJcdTRFMERcdTc1Mjggc2V0dGluZ3NTY29wZVx1RkYxQVx1Njg0Q1x1OTc2Mlx1NUU5NFx1NzUyOFx1NzY4NCBob3N0XG4gIC8vIHNldHRpbmdzIFx1NkNFOFx1NTE4Q1x1ODg2OFx1NUJGOVx1NjcyQVx1NkNFOFx1NTE4QyBuYW1lc3BhY2UgXHU4RkQ0XHU1NkRFIHVuYXZhaWxhYmxlXHVGRjBDc2V0IFx1OTc1OVx1OUVEOFx1NTkzMVx1NjU0OFx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVx1MzAwMlxuICBsZXQgY29uZmlnTWlycm9yOiBQcm9tcHRDb25maWcgPSBtZXJnZUNvbmZpZyh1bmRlZmluZWQpO1xuICBsZXQgY29uZmlnRXBvY2ggPSAwO1xuICBjb25zdCBycGNDb25maWcgPSBhc3luYyAoZW5kcG9pbnQ6IHN0cmluZywgcGF5bG9hZD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx1bmtub3duPiA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3R4LmNvbm5lY3Rpb24ucnBjLmNhbGwoJy9kc2gtcHJvbXB0LW9wdGltaXplcicsIGVuZHBvaW50LCBwYXlsb2FkID8/IHt9KTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgY29uZmlnIHJwYyAke2VuZHBvaW50fSBmYWlsZWQ6ICR7KHJlc3VsdC5lcnJvciAmJiAocmVzdWx0LmVycm9yLmRldGFpbHMgfHwgcmVzdWx0LmVycm9yLmNvZGUpKSB8fCAncnBjIGZhaWxlZCd9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG4gIGNvbnN0IGxvYWRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnBjQ29uZmlnKCdnZXQnKTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHZhbHVlIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyMURcdTZCMjFcdThGREVcdTYzQTVcdTY3MkFcdTVDMzFcdTdFRUFcdTY1RjZcdTRGRERcdTYzMDFcdTlFRDhcdThCQTRcdUZGMUJcdTRFMEJcdTZCMjFcdTRGRERcdTVCNThcdTU0MEVcdTk1NUNcdTUwQ0ZcdTUzNzNcdTY2RjRcdTY1QjBcbiAgICB9XG4gIH07XG4gIHZvaWQgbG9hZENvbmZpZygpO1xuXG4gIC8vIDIuNSBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTg5RTNcdTY3OTBcdUZGMUFcdTUxNDhcdTUzRDZcdTZGQzBcdTZEM0JcdTRGMUFcdThCREQgaWRcdUZGMDhzZXNzaW9ucy5jdXJyZW50UHJvdmlkZUluZm9cdUZGMDlcdUZGMENcbiAgLy8gXHU1MThEXHU2N0U1IHNlc3Npb24ubW9kZWxzIFx1MjAxNFx1MjAxNCBcdTRFMERcdTRGMjAgc2Vzc2lvbklkIFx1NjVGNlx1NjcwRFx1NTJBMVx1N0FFRlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1ODAwQ1x1OTc1RVx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NUI5RVx1NkQ0QiBidWdcdUZGMDlcbiAgY29uc3QgZ2V0QWN0aXZlU2Vzc2lvbiA9ICgpOiBzdHJpbmcgfCBudWxsID0+IHtcbiAgICBjb25zdCBpbmZvID0gKFxuICAgICAgY3R4LnNlc3Npb25zIGFzIHtcbiAgICAgICAgY3VycmVudFByb3ZpZGVJbmZvPzogeyBnZXRTbmFwc2hvdD86ICgpID0+IHsgc2Vzc2lvbklkPzogc3RyaW5nIH0gfTtcbiAgICAgIH0gfCB1bmRlZmluZWRcbiAgICApPy5jdXJyZW50UHJvdmlkZUluZm8/LmdldFNuYXBzaG90Py4oKTtcbiAgICBjb25zdCBzZXNzaW9uSWQgPSBpbmZvPy5zZXNzaW9uSWQ7XG4gICAgcmV0dXJuIHR5cGVvZiBzZXNzaW9uSWQgPT09ICdzdHJpbmcnICYmIHNlc3Npb25JZC5sZW5ndGggPiAwID8gc2Vzc2lvbklkIDogbnVsbDtcbiAgfTtcbiAgLy8gMi42IFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOFx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QiArIHNlcnZlciBcdTUzNEEgbGxtLnN0cmVhbVx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1RkYxQVxuICAvLyBcdTkwMUFcdTkwNTNcdTUzNzNcdTgxRUFcdTY3MDkgUlBDXHVGRjA4L2RzaC1wcm9tcHQtb3B0aW1pemVyXHVGRjA5XHVGRjFCc2VydmVyIGhhbGYgXHU3NTI4IGFnZW50RGVmYXVsdE1vZGVsIFx1NTNENlx1NUY1M1x1NTI0RFxuICAvLyBcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTMwMDFsbG0uc3RyZWFtIFx1NzcxRlx1NkQ0MVx1NUYwRlx1RkYwOFx1NTNENlx1ODFFQSBkc2gtZWxmIFx1NURGMlx1OUE4Q1x1OEJDMVx1NzY4NFx1NUJCRlx1NEUzQlx1NjcwRFx1NTJBMVx1OTc2Mlx1RkYwOVx1MzAwMlx1NEUwRFx1NzUyOCBzZXNzaW9uLmNyZWF0ZS9cbiAgLy8gZm9ya1x1RkYxQVx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFx1NEUwRFx1NTcyOFx1NTI0RFx1NTNGMFx1NEUwRFx1ODlFNlx1NTNEMVx1NkEyMVx1NTc4Qlx1NjI2N1x1ODg0Q1x1RkYwQ1x1ODFFQVx1N0YxNiBpZCBcdTg4QUJcdTk3NTlcdTlFRDhcdTYyRDJcdTdFREQgXHUyMTkyIFx1MzAwQ1x1NkMzOFx1OEZEQ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MzAwRFx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVx1MzAwMlxuICBjb25zdCBob3N0UnBjOiBIb3N0UnBjID0ge1xuICAgIGNhbGw6IChlbmRwb2ludCwgcGF5bG9hZCkgPT4gY2FsbEhvc3QoZW5kcG9pbnQsIHBheWxvYWQgPz8ge30pLFxuICB9O1xuICBjb25zdCBnZXRIb3N0ID0gKCk6IHsgcnBjOiBIb3N0UnBjIH0gPT4gKHsgcnBjOiBob3N0UnBjIH0pO1xuICBjb25zdCBnZXRTZXNzaW9uTW9kZWwgPSBhc3luYyAoKTogUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgd2l0aFRpbWVvdXQoY2FsbEhvc3QoJ3Nlc3Npb25Nb2RlbCcsIHt9KSwgNTAwMCwgJ3Nlc3Npb25Nb2RlbCcpO1xuICAgICAgaWYgKHJlcy5vayAmJiByZXMudmFsdWUgJiYgdHlwZW9mIHJlcy52YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc3QgdiA9IHJlcy52YWx1ZSBhcyB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9O1xuICAgICAgICBpZiAodHlwZW9mIHYucHJvdmlkZXIgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2Lm1vZGVsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiB7IHByb3ZpZGVyOiB2LnByb3ZpZGVyLCBtb2RlbDogdi5tb2RlbCB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuICAvLyAyLjViIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1NEYxQVx1OEJERFx1N0VEMVx1NUI5QVx1RkYxQVx1NTM2MVx1NzI0N1x1NTNFQVx1NTcyOFx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1NjYzRVx1NzkzQVx1RkYwOFx1NTIwN1x1OEQ3MFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOVxuICBjb25zdCBnZXRTZXNzaW9uSWQgPSAoKTogc3RyaW5nIHwgbnVsbCA9PiBnZXRBY3RpdmVTZXNzaW9uKCk7XG5cbiAgLy8gMy4gXHU4QkVEXHU4QTAwXHU5NTVDXHU1MENGXG4gIGxldCBsYW5nOiBMYW5nID0gbGFuZ09mKGN0eC5sb2NhbGUuZ2V0TG9jYWxlKCkuYWN0aXZlKTtcbiAgY3R4Lm9uKCdsb2NhbGUvY2hhbmdlJywgKHNuYXA6IHsgYWN0aXZlOiBzdHJpbmcgfSkgPT4ge1xuICAgIGxhbmcgPSBsYW5nT2Yoc25hcC5hY3RpdmUpO1xuICB9KTtcblxuICAvLyA0LiBcdTRGMUFcdThCRERcdTY5RkRcdTRGNERcdUZGMUFcdTYzMDlcdTk0QUUgKyBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcbiAgY3R4LmluamVjdChbJ3Nsb3RzJywgJ3Nlc3Npb25zJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWJ1dHRvbicsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgb3BlblNldHRpbmdzOiAoKSA9PiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICAgIGdldFNlc3Npb25JZCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUHJldmlld0NhcmQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDYuIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYwOHJvb3QgXHU0RjVDXHU3NTI4XHU1N0RGXHVGRjA5XG4gIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSgpO1xuICBjb25zdCBzYXZlQ29uZmlnID0gYXN5bmMgKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VDb25maWcoeyAuLi5jb25maWdNaXJyb3IsIC4uLnJhdyB9KTtcbiAgICBjb25zdCB3cml0dGVuOiBQcm9tcHRDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiBtZXJnZWQuYmFzZVVybCxcbiAgICAgIGFwaUtleTogbWVyZ2VkLmFwaUtleS50cmltKCksXG4gICAgICBtb2RlbDogbWVyZ2VkLm1vZGVsLFxuICAgICAgdXNlU2Vzc2lvbk1vZGVsOiBtZXJnZWQudXNlU2Vzc2lvbk1vZGVsLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogd3JpdHRlbi5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogd3JpdHRlbi5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IHdyaXR0ZW4ubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB3cml0dGVuLnVzZVNlc3Npb25Nb2RlbCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZXNldENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LFxuICAgICAgICAgIG1vZGVsOiBERUZBVUxUUy5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcblxuICBjdHguaW5qZWN0KFsnc2xvdHMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItc2V0dGluZ3MnLFxuICAgICAgICAgIG9yZGVyOiAzMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIHN0b3JlOiBzZXR0aW5nc1N0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgc2F2ZUNvbmZpZyxcbiAgICAgICAgICAgIHJlc2V0Q29uZmlnLFxuICAgICAgICAgICAgZ2V0RXBvY2g6ICgpID0+IGNvbmZpZ0Vwb2NoLFxuICAgICAgICAgICAgZ2V0SG9zdFN0YXR1czogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAvLyBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTgxRUFcdTY4QzBcdUZGMUFcdTk2RjZcdTkxNERcdTdGNkVcdTZBMjFcdTVGMEZcdTgwRkRcdTU0MjZcdTRFQ0Ugc2VydmVyIGhhbGYgXHU2MkZGXHU1MjMwXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgd2l0aFRpbWVvdXQoY2FsbEhvc3QoJ3Nlc3Npb25Nb2RlbCcsIHt9KSwgNTAwMCwgJ3Nlc3Npb25Nb2RlbCcpO1xuICAgICAgICAgICAgICAgIGlmIChyZXMub2sgJiYgcmVzLnZhbHVlICYmIHR5cGVvZiByZXMudmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2ID0gcmVzLnZhbHVlIGFzIHsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nIH07XG4gICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHYucHJvdmlkZXIgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2Lm1vZGVsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IHRydWUsIHByb3ZpZGVyOiB2LnByb3ZpZGVyLCBtb2RlbDogdi5tb2RlbCB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6IChyZXMuZXJyb3IgJiYgKHJlcy5lcnJvci5kZXRhaWxzID8/IHJlcy5lcnJvci5jb2RlKSkgfHwgJ25vLW1vZGVsJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogKHJlcy5lcnJvciAmJiAocmVzLmVycm9yLmRldGFpbHMgPz8gcmVzLmVycm9yLmNvZGUpKSB8fCAncnBjLWZhaWxlZCcgfTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogZmFsc2UsIGVycm9yOiBTdHJpbmcoKGUgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZSA/PyBlKSB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBTZXR0aW5nc1JvdyxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNy4gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBQWx0K09cdUZGMDhcdTcxMjZcdTcwQjlcdTU3MjggdGV4dGFyZWEgXHU1MTg1XHU2NUY2XHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHVGRjA5XG4gIGNvbnN0IG9uS2V5ZG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKCFlLmFsdEtleSB8fCBlLmNvZGUgIT09ICdLZXlPJykgcmV0dXJuO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTtcbiAgfTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bik7XG59XG5cbi8vIFx1NUYxNVx1NzUyOFx1NUI4OFx1NTM2Qlx1RkYxQVx1OTA3Rlx1NTE0RCB0cmVlLXNoYWtlIFx1NjM4OVx1N0M3Qlx1NTc4Qlx1RkYwOFx1NEVDNVx1NjU4N1x1Njg2M1x1NjAyN1x1RkYxQlx1NjVFMFx1OEZEMFx1ODg0Q1x1NjVGNlx1ODg0Q1x1NEUzQVx1RkYwOVxuZXhwb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH07IiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2ODM4XHU1RkMzXHVGRjFBXHU5MTREXHU3RjZFXHU2ODIxXHU5QThDXHUzMDAxT3BlbkFJIFx1NTE3Q1x1NUJCOVx1OEMwM1x1NzUyOFx1MzAwMVx1N0VEM1x1Njc5Q1x1NjNEMFx1NTNENiBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU5NkY2IERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9tcHRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRTOiBQcm9tcHRDb25maWcgPSB7XG4gIGJhc2VVcmw6ICdodHRwczovL2FwaS5kZWVwc2Vlay5jb20nLFxuICBhcGlLZXk6ICcnLFxuICBtb2RlbDogJ2RlZXBzZWVrLXY0LWZsYXNoJyxcbiAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxufTtcblxuZXhwb3J0IHR5cGUgTGFuZyA9ICd6aCcgfCAnZW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQmFzZVVybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB1cmwudHJpbSgpLnJlcGxhY2UoL1xcLyskLywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VDb25maWcocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbXB0Q29uZmlnIHtcbiAgY29uc3QgYmFzZVVybCA9IHR5cGVvZiByYXc/LmJhc2VVcmwgPT09ICdzdHJpbmcnICYmIHJhdy5iYXNlVXJsLnRyaW0oKSA/IHJhdy5iYXNlVXJsLnRyaW0oKSA6IERFRkFVTFRTLmJhc2VVcmw7XG4gIGNvbnN0IGFwaUtleSA9IHR5cGVvZiByYXc/LmFwaUtleSA9PT0gJ3N0cmluZycgPyByYXcuYXBpS2V5IDogREVGQVVMVFMuYXBpS2V5O1xuICAvLyBcdTY1RTdcdTlFRDhcdThCQTRcdThGQzFcdTc5RkJcdUZGMUFcdTlFRDhcdThCQTQgYmFzZVVybCBcdTRFMEJcdTZCOEJcdTc1NTlcdTc2ODQgZGVlcHNlZWstY2hhdFx1RkYwOHYxIFx1OUVEOFx1OEJBNFx1RkYwOVx1ODlDNlx1NEUzQVx1NjcyQVx1OEJCRVx1N0Y2RVx1RkYwQ1x1ODQzRFx1NTIzMFx1NjVCMFx1OUVEOFx1OEJBNCBkZWVwc2Vlay12NC1mbGFzaFx1RkYxQlxuICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdThGQzcgYmFzZVVybFx1RkYwOFx1NjYzRVx1NUYwRlx1OTAwOVx1NjJFOVx1RkYwOVx1NTIxOVx1NEZERFx1NzU1OVx1NTM5Rlx1NkEyMVx1NTc4Qlx1NTQwRFxuICBjb25zdCByYXdNb2RlbCA9IHR5cGVvZiByYXc/Lm1vZGVsID09PSAnc3RyaW5nJyAmJiByYXcubW9kZWwudHJpbSgpID8gcmF3Lm1vZGVsLnRyaW0oKSA6IERFRkFVTFRTLm1vZGVsO1xuICBjb25zdCBtaWdyYXRlZERlZmF1bHQgPVxuICAgIHJhd01vZGVsID09PSAnZGVlcHNlZWstY2hhdCcgJiYgbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSA9PT0gREVGQVVMVFMuYmFzZVVybCA/IERFRkFVTFRTLm1vZGVsIDogcmF3TW9kZWw7XG4gIGNvbnN0IG1vZGVsID0gbWlncmF0ZWREZWZhdWx0O1xuICBjb25zdCB1c2VTZXNzaW9uTW9kZWwgPSB0eXBlb2YgcmF3Py51c2VTZXNzaW9uTW9kZWwgPT09ICdib29sZWFuJyA/IHJhdy51c2VTZXNzaW9uTW9kZWwgOiBERUZBVUxUUy51c2VTZXNzaW9uTW9kZWw7XG4gIHJldHVybiB7IGJhc2VVcmw6IG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCksIGFwaUtleSwgbW9kZWwsIHVzZVNlc3Npb25Nb2RlbCB9O1xufVxuXG5leHBvcnQgdHlwZSBDb25maWdQcm9ibGVtID0gJ21pc3Npbmcta2V5JyB8ICdtaXNzaW5nLW1vZGVsJyB8ICdiYWQtdXJsJztcbmV4cG9ydCB0eXBlIENvbmZpZ0NoZWNrID0geyBvazogdHJ1ZTsgY29uZmlnOiBQcm9tcHRDb25maWcgfSB8IHsgb2s6IGZhbHNlOyByZWFzb246IENvbmZpZ1Byb2JsZW0gfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQ29uZmlnKGNvbmZpZzogUHJvbXB0Q29uZmlnKTogQ29uZmlnQ2hlY2sge1xuICBpZiAoIWNvbmZpZy5hcGlLZXkudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3Npbmcta2V5JyB9O1xuICAvLyBcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTY1RjZcdTY1RTBcdTk3MDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMUJcdTRFQzVcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTVGMEZcdTg5ODFcdTZDNDIgbW9kZWwgXHU5NzVFXHU3QTdBXG4gIGlmICghY29uZmlnLnVzZVNlc3Npb25Nb2RlbCAmJiAhY29uZmlnLm1vZGVsLnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLW1vZGVsJyB9O1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKG5vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpKTtcbiAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ2JhZC11cmwnIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGNvbmZpZyB9O1xufVxuXG5jb25zdCBaSF9TWVNURU0gPVxuICAnXHU0RjYwXHU2NjJGXHU0RTAwXHU1NDBEIHByb21wdCBcdTRGMThcdTUzMTZcdTRFMTNcdTVCQjZcdTMwMDJcdTc1MjhcdTYyMzdcdTRGMUFcdTdFRDlcdTRGNjBcdTRFMDBcdTZCQjVcdTgzNDlcdTdBM0YgcHJvbXB0XHVGRjBDXHU4QkY3XHU1NzI4XHU0RTBEXHU2NTM5XHU1M0Q4XHU1MTc2XHU2MTBGXHU1NkZFXHU3Njg0XHU1MjREXHU2M0QwXHU0RTBCXHU1QzA2XHU1MTc2XHU2NTM5XHU1MTk5XHU0RTNBXHU2NkY0XHU2RTA1XHU2NjcwXHUzMDAxXHU2NkY0XHU3RUQzXHU2Nzg0XHU1MzE2XHU3Njg0XHU5QUQ4XHU4RDI4XHU5MUNGIHByb21wdFx1RkYxQScgK1xuICAnXHU4ODY1XHU1MTQ1XHU3RjNBXHU1OTMxXHU3Njg0XHU3NkVFXHU2ODA3XHUzMDAxXHU3RUE2XHU2NzVGXHU0RTBFXHU2NzFGXHU2NzFCXHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHVGRjA4XHU1M0VGXHU0RUNFXHU0RTBBXHU0RTBCXHU2NTg3XHU1NDA4XHU3NDA2XHU2M0E4XHU2NUFEXHVGRjA5XHVGRjBDXHU0RjdGXHU3NTI4XHU3QjgwXHU2RDAxXHU2NjBFXHU3ODZFXHU3Njg0XHU4QkVEXHU4QTAwXHVGRjBDXHU1M0JCXHU2Mzg5XHU1MTk3XHU0RjU5XHUzMDAyJyArXG4gICdcdTRFMERcdTVGOTdcdTdGMTZcdTkwMjBcdTgzNDlcdTdBM0ZcdTRFMkRcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTRFOEJcdTVCOUVcdTYyMTZcdTYyODBcdTY3MkZcdTdFQzZcdTgyODJcdTMwMDJcdTUzRUFcdThGOTNcdTUxRkFcdTRGMThcdTUzMTZcdTU0MEVcdTc2ODQgcHJvbXB0IFx1NkI2M1x1NjU4N1x1RkYwQ1x1NEUwRFx1ODk4MVx1NEVGQlx1NEY1NVx1ODlFM1x1OTFDQVx1MzAwMVx1NTI0RFx1N0YwMFx1NjIxNlx1NEVFM1x1NzgwMVx1NTc1N1x1NTMwNVx1ODhGOVx1MzAwMic7XG5cbmNvbnN0IEVOX1NZU1RFTSA9XG4gICdZb3UgYXJlIGEgcHJvbXB0IG9wdGltaXphdGlvbiBleHBlcnQuIFJld3JpdGUgdGhlIHVzZXJcXCdzIGRyYWZ0IHByb21wdCBpbnRvIGEgY2xlYXJlciwgbW9yZSBzdHJ1Y3R1cmVkLCBoaWdoLXF1YWxpdHkgcHJvbXB0ICcgK1xuICAnd2l0aG91dCBjaGFuZ2luZyBpdHMgaW50ZW50OiBmaWxsIGluIG1pc3NpbmcgZ29hbHMsIGNvbnN0cmFpbnRzLCBhbmQgZXhwZWN0ZWQgb3V0cHV0IGZvcm1hdCB3aGVuIHJlYXNvbmFibHkgaW5mZXJhYmxlLCAnICtcbiAgJ3VzZSBjb25jaXNlIGFuZCBwcmVjaXNlIGxhbmd1YWdlLCBhbmQgcmVtb3ZlIHJlZHVuZGFuY3kuIERvIG5vdCBpbnZlbnQgZmFjdHMgb3IgdGVjaG5pY2FsIGRldGFpbHMgYWJzZW50IGZyb20gdGhlIGRyYWZ0LiAnICtcbiAgJ091dHB1dCBPTkxZIHRoZSBvcHRpbWl6ZWQgcHJvbXB0IHRleHQsIHdpdGggbm8gZXhwbGFuYXRpb25zLCBwcmVmaXhlcywgb3IgY29kZSBmZW5jZXMuJztcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmc6IExhbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbGFuZyA9PT0gJ3poJyA/IFpIX1NZU1RFTSA6IEVOX1NZU1RFTTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnOiBQcm9tcHRDb25maWcsIHRleHQ6IHN0cmluZywgbGFuZzogTGFuZywgc3RyZWFtID0gZmFsc2UpOiBvYmplY3Qge1xuICByZXR1cm4ge1xuICAgIG1vZGVsOiBjb25maWcubW9kZWwsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmcpIH0sXG4gICAgICB7IHJvbGU6ICd1c2VyJywgY29udGVudDogdGV4dCB9LFxuICAgIF0sXG4gICAgdGVtcGVyYXR1cmU6IDAuNyxcbiAgICBtYXhfdG9rZW5zOiAyMDQ4LFxuICAgIHN0cmVhbSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSZXN1bHQocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcyA9IHJhdy50cmltKCk7XG4gIGNvbnN0IGZlbmNlID0gL15gYGBbYS16QS1aMC05XystXSpcXG4oW1xcc1xcU10qPylcXG4/YGBgJC87XG4gIGNvbnN0IG1hdGNoZWQgPSBzLm1hdGNoKGZlbmNlKTtcbiAgaWYgKG1hdGNoZWQpIHMgPSBtYXRjaGVkWzFdLnRyaW0oKTtcbiAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5UcmlnZ2VyKGRyYWZ0OiBzdHJpbmcsIGJ1c3k6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuICFidXN5ICYmIGRyYWZ0LnRyaW0oKS5sZW5ndGggPiAwO1xufVxuXG5leHBvcnQgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCA9XG4gIHwgJ2NvbmZpZydcbiAgfCAndW5hdXRob3JpemVkJ1xuICB8ICdmb3JiaWRkZW4nXG4gIHwgJ2h0dHAnXG4gIHwgJ3RpbWVvdXQnXG4gIHwgJ25ldHdvcmsnXG4gIHwgJ2NvcnMnXG4gIHwgJ2JhZC1yZXNwb25zZSdcbiAgfCAnZW1wdHknO1xuXG5leHBvcnQgY2xhc3MgT3B0aW1pemVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ09wdGltaXplRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVRfTVMgPSA2MF8wMDA7XG5cbmZ1bmN0aW9uIGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQ6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgbWVzc2FnZT86IHsgY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBjb250ZW50ID0gZmlyc3Q/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycgPyBjb250ZW50IDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JLaW5kKGU6IHVua25vd24pOiBPcHRpbWl6ZUVycm9yIHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBPcHRpbWl6ZUVycm9yKSByZXR1cm4gZTtcbiAgY29uc3QgaXNBYm9ydCA9XG4gICAgKHR5cGVvZiBET01FeGNlcHRpb24gIT09ICd1bmRlZmluZWQnICYmIGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiAoZSBhcyBFcnJvcikubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgaWYgKGlzQWJvcnQpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcigndGltZW91dCcsICdyZXF1ZXN0IGFib3J0ZWQnKTtcbiAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICBjb25zdCBtID0gU3RyaW5nKGUubWVzc2FnZSA/PyAnJyk7XG4gICAgLy8gXHU1QzNEXHU1MjlCXHU4MDBDXHU0RTNBXHVGRjFBQ2hyb21pdW0gXHU3Njg0IENPUlMgXHU1OTMxXHU4RDI1XHU5MDFBXHU1RTM4XHU2NjJGIFR5cGVFcnJvcihcIkZhaWxlZCB0byBmZXRjaFwiKVx1RkYwOFx1NjVFMCBjb3JzIFx1NUI1N1x1NjgzN1x1RkYwOVx1RkYwQ1x1NEYxQVx1ODQzRFx1NTIzMCBuZXR3b3JrXHVGRjFCXHU2QjY0XHU1MjA2XHU2NTJGXHU0RUM1XHU2MzU1XHU4M0I3XHU4MUVBXHU1RTI2IENPUlMgXHU1QjU3XHU2ODM3XHU3Njg0XHU5NTE5XHU4QkVGXHUzMDAyXG4gICAgaWYgKC9jb3JzL2kudGVzdChtKSkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCdjb3JzJywgbSk7XG4gICAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgbSB8fCAnbmV0d29yayBlcnJvcicpO1xuICB9XG4gIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIFN0cmluZygoZSBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemUob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsIH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcblxuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdpbnZhbGlkIEpTT04nKTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZCk7XG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBleHRyYWN0UmVzdWx0KGNvbnRlbnQpO1xufVxuXG4vKipcbiAqIFNTRSBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUFcdTUxODVcdTVCQjlcdTYyMTZcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdTc2ODRcdTRFMDBcdTZCQjVcdTY1ODdcdTY3MkNcdTMwMDJcbiAqIHY0IFx1N0NGQlx1NkEyMVx1NTc4Qlx1RkYwOHY0LWZsYXNoIFx1N0I0OVx1RkYwOVx1NkQ0MVx1NUYwRlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNSByZWFzb25pbmdfY29udGVudFx1RkYwOFx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwOVx1RkYwQ1x1OTY4Rlx1NTQwRVx1NjI0RFx1OEY5M1x1NTFGQVxuICogY29udGVudCBcdTZCNjNcdTY1ODdcdTIwMTRcdTIwMTRcdTRFMjRcdTgwMDVcdTkwRkRcdTg5ODFcdTVCOUVcdTY1RjZcdTU0NDhcdTczQjBcdUZGMENcdTU0MjZcdTUyMTlcdTYzQThcdTc0MDZcdTY3MUZcdTUzNjFcdTcyNDdcdTc3MEJcdThENzdcdTY3NjVcdTUwQ0ZcdTMwMENcdTk3NUVcdTZENDFcdTVGMEZcdTMwMERcdUZGMDhcdTVCOUVcdTZENEIgfjgwIFx1NEUyQSBjaHVua1xuICogXHU1MTY4XHU2NjJGIHJlYXNvbmluZ1x1RkYwQ1x1NkI2M1x1NjU4N1x1NjcwMFx1NTQwRVx1NjI0RFx1NTFGQVx1NzNCMFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgdHlwZSBTc2VEZWx0YSA9XG4gIHwgeyBraW5kOiAnY29udGVudCc7IHRleHQ6IHN0cmluZyB9XG4gIHwgeyBraW5kOiAncmVhc29uaW5nJzsgdGV4dDogc3RyaW5nIH07XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHU0RTAwXHU4ODRDIFNTRSBcdTY1NzBcdTYzNkVcdUZGMUEoZGF0YTogey4uLn0pIFx1MjE5MiBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUJcbiAqIFtET05FXS9cdTk3NUUgZGF0YSBcdTg4NEMvXHU5NzVFIEpTT04vXHU2NUUwXHU1MTg1XHU1QkI5IGRlbHRhIFx1MjE5MiBudWxsXHUzMDAyXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3NlRGVsdGEobGluZTogc3RyaW5nKTogU3NlRGVsdGEgfCBudWxsIHtcbiAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQuc3RhcnRzV2l0aCgnZGF0YTonKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGRhdGEgPSB0cmltbWVkLnNsaWNlKCdkYXRhOicubGVuZ3RoKS50cmltKCk7XG4gIGlmIChkYXRhID09PSAnW0RPTkVdJykgcmV0dXJuIG51bGw7XG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBkZWx0YT86IHsgY29udGVudD86IHVua25vd247IHJlYXNvbmluZ19jb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGRlbHRhID0gZmlyc3Q/LmRlbHRhO1xuICBpZiAodHlwZW9mIGRlbHRhPy5jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ2NvbnRlbnQnLCB0ZXh0OiBkZWx0YS5jb250ZW50IH07XG4gIGlmICh0eXBlb2YgZGVsdGE/LnJlYXNvbmluZ19jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ3JlYXNvbmluZycsIHRleHQ6IGRlbHRhLnJlYXNvbmluZ19jb250ZW50IH07XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1RkYxQVx1OTAxMFx1NTc1N1x1ODlFM1x1Njc5MCBTU0VcdUZGMENcdThGQjlcdTY1MzZcdThGQjlcdTU2REVcdThDMDMgb25UZXh0KGRlbHRhKVx1RkYxQlx1OEZENFx1NTZERVx1NUI4Q1x1NjU3NFx1NkI2M1x1NjU4N1x1MzAwMlxuICogXHU3NkY4XHU2QkQ0XHU5NzVFXHU2RDQxXHU1RjBGIG9wdGltaXplKClcdUZGMUFcdTk5OTZcdTVCNTdcdTY2RjRcdTVGRUJcdTMwMDFcdTk1N0ZcdThGOTNcdTUxRkFcdTRFMERcdTk3MDBcdTg5ODFcdTdCNDlcdTVCOENcdTY1NzRcdTc1MUZcdTYyMTBcdTIwMTRcdTIwMTRcdTYzMDlcdTk0QUUvXHU1MzYxXHU3MjQ3XHU4MEZEXHU4RkI5XHU3NTFGXHU2MjEwXHU4RkI5XHU2NjNFXHU3OTNBXHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZVN0cmVhbShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBvbkV2ZW50PzogKGRlbHRhOiBTc2VEZWx0YSkgPT4gdm9pZDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsLCBvbkV2ZW50IH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcsIHRydWUpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgaWYgKCFyZXMuYm9keSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdtaXNzaW5nIHJlc3BvbnNlIGJvZHknKTtcblxuICBjb25zdCByZWFkZXIgPSByZXMuYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBsZXQgYnVmZmVyID0gJyc7XG4gIGxldCBmdWxsID0gJyc7XG4gIHRyeSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICBpZiAoZG9uZSkgYnJlYWs7XG4gICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xuICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoJ1xcbicpO1xuICAgICAgYnVmZmVyID0gbGluZXMucG9wKCkgPz8gJyc7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEobGluZSk7XG4gICAgICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHRyeSB7XG4gICAgICByZWFkZXIucmVsZWFzZUxvY2soKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NURGMlx1NEUyRFx1NkI2Mi9cdTkxQ0FcdTY1M0VcdTY1RjZcdTVGRkRcdTc1NjVcbiAgICB9XG4gIH1cbiAgLy8gXHU1QzNFXHU4ODRDXHVGRjA4XHU2NUUwXHU2MzYyXHU4ODRDXHU3RUQzXHU1QzNFXHU3Njg0IGRhdGEgXHU4ODRDXHVGRjA5XG4gIGlmIChidWZmZXIudHJpbSgpKSB7XG4gICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEoYnVmZmVyKTtcbiAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RSZXN1bHQoZnVsbCk7XG4gIGlmICghY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1MzAwQ1x1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1MzAwRFx1RkYxQVx1OEMwMyBjb25uZWN0aW9uIFx1NzY4NCBzZXNzaW9uLm1vZGVscyBSUENcdUZGMENcdTUzRDYgY3VycmVudC5tb2RlbFx1MzAwMlxuICogYXBpIFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwOFx1NEUwRSBEU0ggXHU4OUUzXHU4MDI2XHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHVGRjFCXHU0RUZCXHU0RjU1XHU1OTMxXHU4RDI1XHU4RkQ0XHU1NkRFIG51bGxcdUZGMDhcdTc1MzFcdThDMDNcdTc1MjhcdTY1QjlcdTU2REVcdTkwMDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTZXNzaW9uTW9kZWwoXG4gIGFwaTpcbiAgICB8IHtcbiAgICAgICAgc2Vzc2lvbnM/OiB7XG4gICAgICAgICAgbW9kZWxzPzogKHBheWxvYWQ/OiB1bmtub3duLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IG1vZGVsPzogc3RyaW5nIH0gfSB8IG51bGw+O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIHwgdW5kZWZpbmVkLFxuICBwYXlsb2FkOiB1bmtub3duID0ge30sXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgLy8gXHU1RkM1XHU5ODdCXHU2NDNBXHU1RTI2IHNlc3Npb25JZFx1RkYxQXNlcnZlciBcdTdBRUZcdTYzMDkgcmVxdWVzdC5wYXlsb2FkLnNlc3Npb25JZCBcdTY3RTVcdThCRTVcdTRGMUFcdThCRERcdTVERjJcdTkwMDlcdTYyRTlcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMENcbiAgICAvLyBcdTdGM0FcdTU5MzFcdTY1RjZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdUZGMDhkZWVwc2Vlay12NC1mbGFzaFx1RkYwOVx1ODAwQ1x1OTc1RVx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaT8uc2Vzc2lvbnM/Lm1vZGVscz8uKHBheWxvYWQsIHNpZ25hbCk7XG4gICAgY29uc3QgbSA9IHJlcz8uY3VycmVudD8ubW9kZWw7XG4gICAgcmV0dXJuIHR5cGVvZiBtID09PSAnc3RyaW5nJyAmJiBtLnRyaW0oKSA/IG0udHJpbSgpIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjNEMlx1NEVGNlx1NjU4N1x1Njg0OCBcdTIwMTQgXHU0RTJEXHU4MkYxXHU1M0NDXHU4QkVEICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuZXhwb3J0IGNvbnN0IE5TID0gJ3Byb21wdF9vcHRpbWl6ZXInO1xuXG5leHBvcnQgY29uc3QgemggPSB7XG4gICdidXR0b24uYXJpYSc6ICdcdTRGMThcdTUzMTYgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnXHU0RjE4XHU1MzE2XHU3RUQzXHU2NzlDJyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdcdTY2RkZcdTYzNjJcdTgzNDlcdTdBM0YnLFxuICAnY2FyZC5jb3B5JzogJ1x1NTkwRFx1NTIzNicsXG4gICdjYXJkLmNvcHlEb25lJzogJ1x1NURGMlx1NTkwRFx1NTIzNicsXG4gICdjYXJkLnJldHJ5JzogJ1x1OTFDRFx1NjVCMFx1NEYxOFx1NTMxNicsXG4gICdjYXJkLmRpc21pc3MnOiAnXHU2NTNFXHU1RjAzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnXHU1REYyXHU5MTREXHU3RjZFIFx1MDBCNyBcdTZBMjFcdTU3OEIge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ1x1NjcyQVx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUudGl0bGUnOiAnXHU4QkY3XHU1MTQ4XHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS5kZXNjJzogJ1x1NTI0RFx1NUY4MCBcdThCQkVcdTdGNkUgXHUyMTkyIFx1OTAxQVx1NzUyOFx1OEJCRVx1N0Y2RSBcdTIxOTIgUHJvbXB0IFx1NEYxOFx1NTMxNlx1RkYwQ1x1NTg2Qlx1NTE5OVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MFx1MzAwMUFQSSBLZXkgXHU0RTBFXHU2QTIxXHU1NzhCXHU1NDBEXHUzMDAyJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdcdTUzQkJcdThCQkVcdTdGNkUnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdcdTc3RTVcdTkwNTNcdTRFODYnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBLZXkgXHU2NUUwXHU2NTQ4XHU2MjE2XHU1REYyXHU4RkM3XHU2NzFGJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdcdTY3MERcdTUyQTFcdTYyRDJcdTdFRERcdThCQkZcdTk1RUVcdUZGMDg0MDNcdUZGMDknLFxuICAnZXJyb3IudGltZW91dCc6ICdcdThCRjdcdTZDNDJcdThEODVcdTY1RjZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IubmV0d29yayc6ICdcdTdGNTFcdTdFRENcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IuY29ycyc6ICdcdTYzQTVcdTUzRTNcdTRFMERcdTY1MkZcdTYzMDFcdThERThcdTU3REZcdUZGMENcdThCRjdcdTYzNjJcdTc1MjhcdTY1MkZcdTYzMDEgQ09SUyBcdTc2ODRcdTdGNTFcdTUxNzMnLFxuICAnZXJyb3IuaHR0cCc6ICdcdThCRjdcdTZDNDJcdTU5MzFcdThEMjVcdUZGMDhIVFRQIFx1OTUxOVx1OEJFRlx1RkYwOScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU2ODNDXHU1RjBGXHU1RjAyXHU1RTM4JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NEUzQVx1N0E3QVx1RkYwQ1x1OEJGN1x1OTFDRFx1OEJENScsXG4gICdlcnJvci5jb25maWcnOiAnXHU5MTREXHU3RjZFXHU0RTBEXHU1QjhDXHU2NTc0XHVGRjBDXHU4QkY3XHU1MjMwXHU4QkJFXHU3RjZFXHU0RTJEXHU2OEMwXHU2N0U1JyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBcdTRGMThcdTUzMTYnLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdcdTkxNERcdTdGNkVcdTZEQTZcdTgyNzJcdTYzQTVcdTUzRTNcdUZGMDhPcGVuQUkgXHU1MTdDXHU1QkI5XHVGRjA5XHVGRjFCS2V5IFx1NjYwRVx1NjU4N1x1NEZERFx1NUI1OFx1NTcyOFx1NjcyQ1x1NTczMCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ1x1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1x1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1x1NUYwMFx1NTQyRlx1NjVGNlx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1OERERlx1OTY4Rlx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQlx1NTE3M1x1OTVFRFx1NTQwRVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJzogJ1x1NURGMlx1OTAwOVx1NjJFOVx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy5ob3N0UHJvYmUnOiAnXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU2M0EyXHU2RDRCXHU0RTJEXHUyMDI2JyxcbiAgJ3NldHRpbmdzLmhvc3RPayc6ICdcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTkwMUFcdTkwNTMgXHUyNzEzJyxcbiAgJ3NldHRpbmdzLmhvc3RGYWlsJzogJ1x1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1OTAxQVx1OTA1M1x1NEUwRFx1NTNFRlx1NzUyOFx1RkYxQScsXG5cbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdcdTRGRERcdTVCNThcdTU5MzFcdThEMjUnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnXHU5MUNEXHU3RjZFXHU1OTMxXHU4RDI1JyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgY29uc3QgZW46IExvY2FsZURpY3QgPSB7XG4gICdidXR0b24uYXJpYSc6ICdPcHRpbWl6ZSBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdPcHRpbWl6ZWQgcHJvbXB0JyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdVc2UgZHJhZnQnLFxuICAnY2FyZC5jb3B5JzogJ0NvcHknLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdDb3BpZWQnLFxuICAnY2FyZC5yZXRyeSc6ICdSZXRyeScsXG4gICdjYXJkLmRpc21pc3MnOiAnRGlzbWlzcycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnT3B0aW1pemluZ1x1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdDb25maWd1cmVkIFx1MDBCNyBtb2RlbCB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnTm8gQVBJIGNvbmZpZ3VyZWQnLFxuICAnZ3VpZGUudGl0bGUnOiAnQ29uZmlndXJlIHRoZSBBUEkgZmlyc3QnLFxuICAnZ3VpZGUuZGVzYyc6ICdHbyB0byBTZXR0aW5ncyBcdTIxOTIgR2VuZXJhbCBcdTIxOTIgUHJvbXB0IE9wdGltaXplciBhbmQgZmlsbCBpbiB0aGUgZW5kcG9pbnQsIEFQSSBrZXksIGFuZCBtb2RlbC4nLFxuICAnZ3VpZGUuYWN0aW9uJzogJ0dvIHRvIHNldHRpbmdzJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnR290IGl0JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkga2V5IGlzIGludmFsaWQgb3IgZXhwaXJlZCcsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnQWNjZXNzIGZvcmJpZGRlbiAoNDAzKScsXG4gICdlcnJvci50aW1lb3V0JzogJ1JlcXVlc3QgdGltZWQgb3V0OyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnTmV0d29yayBlcnJvcjsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5jb3JzJzogJ0VuZHBvaW50IGJsb2NrcyBDT1JTOyB1c2UgYSBnYXRld2F5IHRoYXQgYWxsb3dzIGl0JyxcbiAgJ2Vycm9yLmh0dHAnOiAnUmVxdWVzdCBmYWlsZWQgKEhUVFAgZXJyb3IpJyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdVbmV4cGVjdGVkIHJlc3BvbnNlIGZvcm1hdCcsXG4gICdlcnJvci5lbXB0eSc6ICdFbXB0eSByZXN1bHQ7IHBsZWFzZSByZXRyeScsXG4gICdlcnJvci5jb25maWcnOiAnSW5jb21wbGV0ZSBjb25maWd1cmF0aW9uOyBjaGVjayBzZXR0aW5ncycsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgT3B0aW1pemVyJyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnQ29uZmlndXJlIHRoZSByZXdyaXRlIGVuZHBvaW50IChPcGVuQUktY29tcGF0aWJsZSk7IGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBwbGFpbiB0ZXh0JyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnQmFzZSBVUkwnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnTW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1VzZSBjdXJyZW50IHNlc3Npb24gbW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdXaGVuIG9uLCBvcHRpbWl6YXRpb24gcmVxdWVzdHMgZm9sbG93IHRoZSBzZXNzaW9uIG1vZGVsOyB3aGVuIG9mZiwgdGhlIGN1c3RvbSBtb2RlbCBiZWxvdyBpcyB1c2VkJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnU2Vzc2lvbiBkZWZhdWx0IG1vZGVsIHNlbGVjdGVkJyxcbiAgJ3NldHRpbmdzLmhvc3RQcm9iZSc6ICdwcm9iaW5nIGhvc3QgY2hhbm5lbFx1MjAyNicsXG4gICdzZXR0aW5ncy5ob3N0T2snOiAnc2Vzc2lvbiBtb2RlbCBjaGFubmVsIFx1MjcxMycsXG4gICdzZXR0aW5ncy5ob3N0RmFpbCc6ICdzZXNzaW9uIG1vZGVsIGNoYW5uZWwgdW5hdmFpbGFibGU6ICcsXG5cbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2J1dHRvbi5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAycHggNnB4O1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAxO1xuICBvcGFjaXR5OiAwLjg1O1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG59XG4uZHNoLXBvLWJ0bjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG4gIG9wYWNpdHk6IDE7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjEyKSk7XG59XG4uZHNoLXBvLWJ0bjpkaXNhYmxlZCB7XG4gIG9wYWNpdHk6IDAuMzU7XG4gIGN1cnNvcjogZGVmYXVsdDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKipcbiAqIFx1OEJGQlx1NTNENlx1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYxQVx1NEYxOFx1NTE0OFx1NTNENlx1NzEyNlx1NzBCOSB0ZXh0YXJlYVx1RkYxQlx1NTQyNlx1NTIxOVx1NTZERVx1OTAwMFx1NTIzMFx1OTg3NVx1OTc2Mlx1NEUyRFx1MzAwQ1x1NTAzQ1x1OTc1RVx1N0E3QVx1MzAwRFx1NzY4NCB0ZXh0YXJlYVxuICogXHVGRjA4XHU3NTI4XHU2MjM3XHU1NzI4XHU4RjkzXHU1MTY1XHU3Njg0XHU1MzczXHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjA5XHUzMDAyXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREXHU2ODA3XHU1MUM2IGtpdCBcdTc2ODQgaW5wdXQgaG9va1x1MjAxNFx1MjAxNFx1NUI5RVx1NkQ0QlxuICogaW5wdXQucmlnaHQgXHU2RTMyXHU2N0QzXHU2NUY2XHU4QkU1XHU2ODA3XHU1MUM2IHByb3BzIFx1NjcyQVx1NjNEMFx1NEY5Qlx1RkYwQ1x1N0VDNFx1NEVGNlx1NEYxQVx1NTZFMFx1OEMwM1x1NzUyOCB1bmRlZmluZWQgaG9va1xuICogXHU1RDI5XHU2RTgzXHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHVGRjA4UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOCBcdTRFMERcdTUzRUZcdTg5QzFcdUZGMDlcdTMwMDJcbiAqL1xuZnVuY3Rpb24gcmVhZERyYWZ0KCk6IHN0cmluZyB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSByZXR1cm4gYWN0aXZlLnZhbHVlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICh0YS52YWx1ZS50cmltKCkpIHJldHVybiB0YS52YWx1ZTtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBPcHRpbWl6ZUJ1dHRvbihwcm9wczogT3B0aW1pemVCdXR0b25Qcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0LCBnZXRTZXNzaW9uSWQgfSA9IHByb3BzO1xuXG4gIC8vIFx1N0U0MVx1NUZEOVx1NjAwMVx1RkYxQVx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVx1RkYxQlxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTIwMTRcdTIwMTRcdTUyMDdcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTYzMDlcdTk0QUVcdTRFMERcdTUxOEQgYnVzeVx1RkYwOFx1NTQwNFx1NEYxQVx1OEJERFx1NTNFRlx1NzJFQ1x1N0FDQlx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1RkYwOVxuICBjb25zdCBidXN5Rm9yID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0ID0gZ2V0UHJldmlld0J1c1N0YXRlKCk7XG4gICAgaWYgKHN0LnN0YXR1cyAhPT0gJ29wdGltaXppbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3Qgc2lkID0gZ2V0U2Vzc2lvbklkPy4oKTtcbiAgICByZXR1cm4gc3Quc2Vzc2lvbklkID09PSBudWxsIHx8IHN0LnNlc3Npb25JZCA9PT0gc2lkO1xuICB9O1xuICBjb25zdCBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZShidXN5Rm9yKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0QnVzeShidXN5Rm9yKCkpKSxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgW10sXG4gICk7XG5cbiAgLy8gbW91c2Vkb3duIFx1OTg4NFx1OEJGQlx1ODM0OVx1N0EzRlx1RkYxQVx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVx1NzdBQ1x1OTVGNFx1NzEyNlx1NzBCOVx1NEYxQVx1NTIwN1x1NTIzMFx1NjMwOVx1OTRBRVx1RkYwOGFjdGl2ZUVsZW1lbnQgXHU0RTBEXHU1MThEXHU2NjJGIHRleHRhcmVhXHVGRjA5XHVGRjBDXG4gIC8vIFx1NEY0NiBtb3VzZWRvd24gXHU2NUU5XHU0RThFXHU3MTI2XHU3MEI5XHU1MjA3XHU2MzYyXHUyMDE0XHUyMDE0XHU2QjY0XHU1MjNCXHU4QkZCXHU1MjMwXHU3Njg0IGFjdGl2ZUVsZW1lbnQgXHU0RUNEXHU2NjJGXHU4RjkzXHU1MTY1XHU2ODQ2XHUzMDAyXG4gIGNvbnN0IGRyYWZ0UmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3Qgc3luY0RyYWZ0ID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRyYWZ0UmVmLmN1cnJlbnQgPSByZWFkRHJhZnQoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChidXN5KSByZXR1cm47XG4gICAgY29uc3QgZHJhZnQgPSBkcmFmdFJlZi5jdXJyZW50IHx8IHJlYWREcmFmdCgpO1xuICAgIGlmICghZHJhZnQudHJpbSgpKSByZXR1cm47XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IGRyYWZ0LFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgZ2V0SG9zdCxcbiAgICAgIGdldFNlc3Npb25JZCxcbiAgICB9KTtcbiAgfSwgW2J1c3ksIGdldENvbmZpZywgZ2V0TGFuZ10pO1xuXG4gIC8vIEFsdCtPIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYwOGluZGV4LnRzIFx1NTE2OFx1NUM0MFx1NzZEMVx1NTQyQ1x1RkYwOVx1MjE5MiBcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3B0aW1pemVSZXF1ZXN0KGhhbmRsZUNsaWNrKSwgW2hhbmRsZUNsaWNrXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgYXJpYS1sYWJlbD17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIHRpdGxlPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgZGlzYWJsZWQ9e2J1c3l9XG4gICAgICBkYXRhLWJ1c3k9e2J1c3l9XG4gICAgICBvbk1vdXNlRG93bj17c3luY0RyYWZ0fVxuICAgICAgb25Gb2N1cz17c3luY0RyYWZ0fVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgPlxuICAgICAge2J1c3kgPyAnXHUyM0YzJyA6ICdcdTI3MjgnfVxuICAgIDwvYnV0dG9uPlxuICApO1xufSIsICIvKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NEYxOFx1NTMxNlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYxQXNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCArIGxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NEU1Rlx1NEUwRFx1OEJFNVx1NzUyOCBzZXNzaW9uLmNyZWF0ZS9mb3JrIFx1NTIxQlx1NUVGQVx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFxuICogXHVGRjA4XHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU1QjlFXHU2RDRCXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyXHU2QjYzXHU4OUUzXHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU3Njg0XHU1QkJGXHU0RTNCXG4gKiBcdTY3MERcdTUyQTFcdTk3NjJcdUZGMUFzZXJ2ZXIgaGFsZlx1RkYwOGxpYi9pbmRleC5qc1x1RkYwOVx1NjMwMVx1NjcwOSBsbG0gXHU0RTBFIGFnZW50RGVmYXVsdE1vZGVsIFx1NjcwRFx1NTJBMVx1MjAxNFx1MjAxNFxuICogICBzZXNzaW9uTW9kZWwgICAgIFx1MjE5MiBcdTVGNTNcdTUyNERcdTRGMUFcdThCREQvYWdlbnQgXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHVGRjA4cHJvdmlkZXIgKyBtb2RlbFx1RkYwOVxuICogICBvcHRpbWl6ZS5zdGFydCAgIFx1MjE5MiBsbG0uc3RyZWFtIFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlx1RkYwQ1x1NTg5RVx1OTFDRlx1N0QyRlx1NzlFRlx1NTIzMFx1NEVGQlx1NTJBMVxuICogICBvcHRpbWl6ZS5wb2xsICAgIFx1MjE5MiBcdTUzRDYgeyBkb25lLCB0ZXh0IH1cdUZGMDhcdTYzQTVcdThGRDEgMjUwbXMgXHU0RTAwXHU2QjIxXHVGRjA5XG4gKiAgIG9wdGltaXplLmFib3J0ICAgXHUyMTkyIFx1NjgwN1x1OEJCMFx1NEUyRFx1NkI2Mlx1RkYwQ1x1NTQwRVx1NTNGMFx1NkQ0MVx1NUMzRFx1NUZFQlx1NTA1Q1xuICogY2xpZW50IFx1N0VDRlx1ODFFQVx1NjcwOSBSUEMgXHU5MDFBXHU5MDUzXHVGRjA4L2RzaC1wcm9tcHQtb3B0aW1pemVyXHVGRjA5XHU4RjZFXHU4QkUyXHU1ODlFXHU5MUNGXHU1NDQ4XHU3M0IwXHVGRjA4XHU4RkQxXHU0RjNDXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogXHU4MUVBXHU2NzA5XHU5MDFBXHU5MDUzXHU3Njg0XHU2NzAwXHU1QzBGXHU5NzYyXHVGRjA4XHU2Q0U4XHU1MTY1XHU1RjBGXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHUzMDAyICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RScGMge1xuICBjYWxsKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8e1xuICAgIG9rOiBib29sZWFuO1xuICAgIHZhbHVlPzogdW5rbm93bjtcbiAgICBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfTtcbiAgfT47XG59XG5cbi8qKlxuICogSFRUUCBKU09OIEFQSSBcdTkwMUFcdTkwNTNcdUZGMDhkc2gtZWxmIFx1NjVCOVx1NUYwRlx1RkYwOVx1RkYxQVx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1OTg3NVx1OTc2Mlx1NzUzMVx1NUJCRlx1NEUzQiB3ZWJTZXJ2ZXIgXHU2M0QwXHU0RjlCXHVGRjBDXHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0IGZldGNoXG4gKiBcdTc2RjRcdThGQkUgYC9kc2gtcHJvbXB0LW9wdGltaXplci9hcGkvPG1ldGhvZD5gXHVGRjBDXHU1QjhDXHU1MTY4XHU3RUQ1XHU1RjAwIGNvbm5lY3Rpb24ucnBjLmNhbGxcdTIwMTRcdTIwMTRcbiAqIGRlc2t0b3AgXHU3Njg0IHJwYy5jYWxsIFx1NTcyOFx1NTQwQ1x1NEUwMFx1NkQ0MVx1N0EwQlx1N0IyQ1x1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NEYxQVx1NjMwMlx1NkI3Qlx1RkYwOFx1NUI5RVx1NkQ0QiBzZXNzaW9uTW9kZWwgXHU2MjEwXHU1MjlGXHUzMDAxXHU3QjJDXHU0RThDXHU2QjIxXHU2QzM4XHU0RTBEXHU4RkJFXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsSG9zdDxSID0gdW5rbm93bj4oXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmdzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFByb21pc2U8eyBvazogYm9vbGVhbjsgdmFsdWU/OiBSOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9PiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYC9kc2gtcHJvbXB0LW9wdGltaXplci9hcGkvJHtlbmNvZGVVUklDb21wb25lbnQobWV0aG9kKX1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgaGVhZGVyczogeyAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYXJncyksXG4gIH0pO1xuICByZXR1cm4gKGF3YWl0IHJlc3BvbnNlLmpzb24oKSkgYXMgeyBvazogYm9vbGVhbjsgdmFsdWU/OiBSOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9O1xufVxuXG4vKiogXHU3RUQ5XHU2MzAyXHU4RDc3XHU3Njg0IFJQQyBcdThDMDNcdTc1MjhcdTUyQTBcdThEODVcdTY1RjZcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRFRkJcdTRGNTVcdTRFMDBcdTZCNjVcdTkwRkRcdTRFMERcdTUxNDFcdThCQjhcdTY1RTBcdTk2NTBcdTk2M0JcdTU4NUUgXHUyMTkyXHUzMDBDXHU0RTAwXHU3NkY0XHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aFRpbWVvdXQ8VD4ocHJvbWlzZTogUHJvbWlzZTxUPiwgbXM6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QobmV3IEVycm9yKGAke2xhYmVsfS10aW1lb3V0YCkpLCBtcyk7XG4gICAgcHJvbWlzZS50aGVuKFxuICAgICAgKHYpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVzb2x2ZSh2KTtcbiAgICAgIH0sXG4gICAgICAoZSkgPT4ge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH0pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhvc3RTZXNzaW9uSW5mbyB7XG4gIHByb3ZpZGVyOiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5Ib3N0T3B0aW1pemVPcHRpb25zIHtcbiAgcnBjOiBIb3N0UnBjO1xuICBsYW5nOiBMYW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN5c3RlbTogc3RyaW5nO1xuICBzaWduYWw6IEFib3J0U2lnbmFsO1xuICBvbkRlbHRhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU2QjY1XHU5QUE0XHU4RkRCXHU1RUE2XHVGRjA4XHU1MzYxXHU3MjQ3XHU2NjNFXHU3OTNBXHVGRjBDXHU1QjlBXHU0RjREXHU1MzYxXHU3MEI5XHVGRjA5ICovXG4gIG9uU3RlcD86IChzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJykgPT4gdm9pZDtcbiAgLyoqIGNsaWVudCBcdTRGQTdcdThCQ0FcdTY1QURcdTU3Q0JcdTcwQjlcdUZGMDhcdTY3MkNcdTU3MzAgY29uc29sZVx1RkYwQ1x1NEUwRFx1NTE4RFx1OEQ3MCBSUENcdTIwMTRcdTIwMTRkZXNrdG9wIHJwYy5jYWxsIFx1NTQwQ1x1NkQ0MVx1N0EwQlx1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NEYxQVx1NjMwMlx1RkYwOSAqL1xuICB0cmFjZT86IChtc2c6IHN0cmluZykgPT4gdm9pZDtcbiAgaW50ZXJ2YWxNcz86IG51bWJlcjtcbiAgdGltZW91dE1zPzogbnVtYmVyO1xuICBycGNUaW1lb3V0TXM/OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfSU5URVJWQUxfTVMgPSAyNTA7XG5jb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSAxMjBfMDAwO1xuY29uc3QgREVGQVVMVF9SUENfVElNRU9VVF9NUyA9IDVfMDAwO1xuXG5mdW5jdGlvbiBjYWxsUnBjPFIgPSBuZXZlcj4oXG4gIHJwYzogSG9zdFJwYyxcbiAgZW5kcG9pbnQ6IHN0cmluZyxcbiAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIG1zOiBudW1iZXIsXG4pOiBQcm9taXNlPHsgb2s6IHRydWU7IHZhbHVlOiBSIH0gfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfT4ge1xuICByZXR1cm4gd2l0aFRpbWVvdXQoXG4gICAgcnBjLmNhbGwoZW5kcG9pbnQsIHBheWxvYWQpLFxuICAgIG1zLFxuICAgIGVuZHBvaW50LFxuICApIGFzIFByb21pc2U8eyBvazogdHJ1ZTsgdmFsdWU6IFIgfSB8IHsgb2s6IGZhbHNlOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9Pjtcbn1cblxuLyoqIFx1NTNENlx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERC9hZ2VudCBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdTMwMDJcdTRFMERcdTUzRUZcdTVGOTdcdTY1RjZcdThGRDRcdTU2REUgbnVsbFx1MzAwMiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVIb3N0U2Vzc2lvbk1vZGVsKFxuICBycGM6IEhvc3RScGMsXG4gIHJwY1RpbWVvdXRNcyA9IERFRkFVTFRfUlBDX1RJTUVPVVRfTVMsXG4pOiBQcm9taXNlPEhvc3RTZXNzaW9uSW5mbyB8IG51bGw+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgY2FsbFJwYyhycGMsICdzZXNzaW9uTW9kZWwnLCB7fSwgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFyZXMub2sgfHwgIXJlcy52YWx1ZSB8fCB0eXBlb2YgcmVzLnZhbHVlICE9PSAnb2JqZWN0JykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHYgPSByZXMudmFsdWUgYXMgeyBwcm92aWRlcj86IHVua25vd247IG1vZGVsPzogdW5rbm93biB9O1xuICBpZiAodHlwZW9mIHYucHJvdmlkZXIgIT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2Lm1vZGVsICE9PSAnc3RyaW5nJykgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGluZm86IEhvc3RTZXNzaW9uSW5mbyA9IHsgcHJvdmlkZXI6IHYucHJvdmlkZXIsIG1vZGVsOiB2Lm1vZGVsIH07XG4gIGlmICh0eXBlb2YgKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHVua25vd24gfSkucmVhc29uaW5nRWZmb3J0ID09PSAnc3RyaW5nJykge1xuICAgIGluZm8ucmVhc29uaW5nRWZmb3J0ID0gKHJlcy52YWx1ZSBhcyB7IHJlYXNvbmluZ0VmZm9ydD86IHN0cmluZyB9KS5yZWFzb25pbmdFZmZvcnQ7XG4gIH1cbiAgcmV0dXJuIGluZm87XG59XG5cbi8qKiBcdTY1ODdcdTY3MkNcdTU4OUVcdTkxQ0ZcdUZGMDhcdTVCNTdcdTdCMjZcdTUyNERcdTdGMDBcdTZCRDRcdThGODNcdUZGMUJcdThGNkVcdThCRTJcdThGRDFcdTRGM0NcdTZENDFcdTVGMEZcdTc1MjhcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVmaXhEZWx0YShwcmV2OiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG4gPSBNYXRoLm1pbihwcmV2Lmxlbmd0aCwgbmV4dC5sZW5ndGgpO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgbiAmJiBwcmV2LmNoYXJDb2RlQXQoaSkgPT09IG5leHQuY2hhckNvZGVBdChpKSkgaSArPSAxO1xuICByZXR1cm4gbmV4dC5zbGljZShpKTtcbn1cblxuLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTUxNjhcdTZENDFcdTdBMEJcdUZGMDhcdTUzNTVcdTZCMjEgUlBDIFx1NEVBNFx1NEVEOFx1RkYwOVx1RkYxQXNlcnZlciBoYWxmIFx1ODlFM1x1Njc5MFx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QiBcdTIxOTIgbGxtLnN0cmVhbSBcdThERDFcdTVCOENcbiAqIFx1MjE5MiBcdTRFMDBcdTZCMjFcdTYwMjdcdThGRDRcdTU2REVcdTUxNjhcdTY1ODdcdTMwMDJcdTRFMERcdTc1MjhcdTMwMENzdGFydCArIFx1OEY2RVx1OEJFMiBwb2xsXHUzMDBEXHU3Njg0XHU1MjA2XHU2QjY1XHU1MzRGXHU4QkFFXHVGRjFBZGVza3RvcCBcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTc2ODRcbiAqIHJwYy5jYWxsIFx1NTcyOFx1NTQwQ1x1NEUwMFx1NkQ0MVx1N0EwQlx1NzY4NFx1N0IyQ1x1NEU4Q1x1NkIyMVx1OEMwM1x1NzUyOFx1NEYxQVx1NjMwMlx1NkI3Qlx1RkYwOFx1NUI5RVx1NkQ0QiBzZXNzaW9uTW9kZWwgXHU2MjEwXHU1MjlGXHUzMDAxc3RhcnQgXHU2QzM4XHU0RTBEXHU4RkJFXHVGRjA5XHVGRjBDXG4gKiBcdTUzNTVcdTZCMjFcdThDMDNcdTc1MjhcdTdFRDVcdTVGMDBcdThCRTVcdTk2NTBcdTUyMzZcdTMwMDJcdTUzNjFcdTcyNDdcdTY1RTBcdTkwMTBcdTVCNTdcdTZFREFcdTUyQThcdUZGMDhcdTZENDFcdTVGMEZcdTgwRkRcdTUyOUJcdTRGRERcdTc1NTlcdTU3MjggZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Ib3N0T3B0aW1pemUob3B0czogUnVuSG9zdE9wdGltaXplT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgcnBjLCBsYW5nOiBfbGFuZywgdGV4dCwgc3lzdGVtLCBzaWduYWwsIG9uRGVsdGEsIG9uU3RlcCwgdHJhY2UgfSA9IG9wdHM7XG4gIGNvbnN0IGludGVydmFsTXMgPSBvcHRzLmludGVydmFsTXMgPz8gREVGQVVMVF9JTlRFUlZBTF9NUztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0cy50aW1lb3V0TXMgPz8gREVGQVVMVF9USU1FT1VUX01TO1xuICBjb25zdCBycGNUaW1lb3V0TXMgPSBvcHRzLnJwY1RpbWVvdXRNcyA/PyBERUZBVUxUX1JQQ19USU1FT1VUX01TO1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuXG4gIC8vIDEuIFx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVxuICBvblN0ZXA/LignbW9kZWwnKTtcbiAgdHJhY2U/LihgcnVuSG9zdE9wdGltaXplOiBzZXNzaW9uTW9kZWwgdGV4dExlbj0ke3RleHQubGVuZ3RofWApO1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgcmVzb2x2ZUhvc3RTZXNzaW9uTW9kZWwocnBjLCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXNlc3Npb24pIHtcbiAgICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHNlc3Npb25Nb2RlbCBGQUlMRUQnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2hvc3QtdW5hdmFpbGFibGUnKTtcbiAgfVxuXG4gIC8vIDIuIFx1NTQyRlx1NTJBOFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlxuICBvblN0ZXA/Lignc3RhcnQnKTtcbiAgY29uc3Qgc3RhcnRQYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBwcm92aWRlcjogc2Vzc2lvbi5wcm92aWRlcixcbiAgICBtb2RlbDogc2Vzc2lvbi5tb2RlbCxcbiAgICB0ZXh0LFxuICAgIHN5c3RlbSxcbiAgfTtcbiAgaWYgKHNlc3Npb24ucmVhc29uaW5nRWZmb3J0KSBzdGFydFBheWxvYWQucmVhc29uaW5nRWZmb3J0ID0gc2Vzc2lvbi5yZWFzb25pbmdFZmZvcnQ7XG4gIGNvbnN0IHN0YXJ0ID0gYXdhaXQgY2FsbFJwYzx7IHRhc2tJZD86IHN0cmluZyB9PihycGMsICdvcHRpbWl6ZS5zdGFydCcsIHN0YXJ0UGF5bG9hZCwgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFzdGFydC5vayB8fCAhc3RhcnQudmFsdWUgfHwgdHlwZW9mIHN0YXJ0LnZhbHVlLnRhc2tJZCAhPT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBjb2RlID0gKCFzdGFydC5vayAmJiBzdGFydC5lcnJvciAmJiBzdGFydC5lcnJvci5jb2RlKSB8fCAnJztcbiAgICBjb25zdCBkZXRhaWxzID0gKCFzdGFydC5vayAmJiBzdGFydC5lcnJvciAmJiBzdGFydC5lcnJvci5kZXRhaWxzKSB8fCAnJztcbiAgICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHN0YXJ0IEZBSUxFRCcpO1xuICAgIHRocm93IG5ldyBFcnJvcihgaG9zdC1zdGFydC1yZWplY3RlZCR7Y29kZSA/IGA6ICR7Y29kZX0gJHtkZXRhaWxzIHx8ICcnfWAudHJpbSgpIDogJyd9YCk7XG4gIH1cbiAgY29uc3QgdGFza0lkID0gc3RhcnQudmFsdWUudGFza0lkO1xuICB0cmFjZT8uKGBydW5Ib3N0T3B0aW1pemU6IHN0YXJ0IG9rIHRhc2s9JHt0YXNrSWR9YCk7XG5cbiAgLy8gMy4gXHU4RjZFXHU4QkUyXHU1ODlFXHU5MUNGXHU3NkY0XHU4MUYzIGRvbmVcdUZGMDhcdTY3MERcdTUyQTFcdTdBRUZcdTY2M0VcdTVGMEZcdTVCOENcdTYyMTBcdTRGRTFcdTUzRjdcdUZGMENcdTY1RTAgc2V0dGxlIFx1NTE1Q1x1NUU5NVx1RkYwOVxuICBvblN0ZXA/LigncG9sbCcpO1xuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBsZXQgbGFzdCA9ICcnO1xuICB0cnkge1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkgdGhyb3cgbmV3IEVycm9yKCdhYm9ydGVkJyk7XG4gICAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0ZWRBdCA+IHRpbWVvdXRNcykgdGhyb3cgbmV3IEVycm9yKCd0aW1lb3V0Jyk7XG4gICAgICBsZXQgcG9sbDogeyBkb25lPzogYm9vbGVhbjsgdGV4dD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfCBudWxsIH0gfCBudWxsID0gbnVsbDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNhbGxScGM8eyBkb25lPzogYm9vbGVhbjsgdGV4dD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfCBudWxsIH0+KFxuICAgICAgICAgIHJwYyxcbiAgICAgICAgICAnb3B0aW1pemUucG9sbCcsXG4gICAgICAgICAgeyB0YXNrSWQgfSxcbiAgICAgICAgICBycGNUaW1lb3V0TXMsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChyZXMub2sgJiYgcmVzLnZhbHVlKSBwb2xsID0gcmVzLnZhbHVlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFx1NTM1NVx1NkIyMVx1OEY2RVx1OEJFMlx1NTkzMVx1OEQyNVx1NEUwRFx1ODFGNFx1NTQ3RFx1RkYwQ1x1NEUwQlx1NEUwMFx1OEY2RVx1NTE4RFx1OEJENVxuICAgICAgfVxuICAgICAgaWYgKHBvbGwpIHtcbiAgICAgICAgaWYgKHBvbGwuZXJyb3IpIHtcbiAgICAgICAgICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHBvbGwgZXJyb3IgJyArIHBvbGwuZXJyb3IpO1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihwb2xsLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0Tm93ID0gcG9sbC50ZXh0ID8/ICcnO1xuICAgICAgICBpZiAodGV4dE5vdyAhPT0gbGFzdCkge1xuICAgICAgICAgIG9uRGVsdGEodGV4dE5vdyk7XG4gICAgICAgICAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICAgICAgICBsYXN0ID0gdGV4dE5vdztcbiAgICAgICAgfVxuICAgICAgICBpZiAocG9sbC5kb25lKSB7XG4gICAgICAgICAgdHJhY2U/LihgcnVuSG9zdE9wdGltaXplOiBkb25lIHRleHRMZW49JHt0ZXh0Tm93Lmxlbmd0aH1gKTtcbiAgICAgICAgICByZXR1cm4gdGV4dE5vdztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgaW50ZXJ2YWxNcykpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcnBjLmNhbGwoJ29wdGltaXplLmFib3J0JywgeyB0YXNrSWQgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTVDM0RcdTUyOUJcbiAgICB9XG4gIH1cbn1cbiIsICIvKiogXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHU3MkI2XHU2MDAxXHU2NzNBIFx1MjAxNFx1MjAxNCBcdTdFQUYgcmVkdWNlclx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmltcG9ydCB0eXBlIHsgT3B0aW1pemVFcnJvcktpbmQgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdTdGF0dXMgPSAnaWRsZScgfCAnb3B0aW1pemluZycgfCAncHJldmlldycgfCAnZXJyb3InIHwgJ2d1aWRlJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U3RhdGUge1xuICBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBlcnJvcktpbmQ6IE9wdGltaXplRXJyb3JLaW5kIHwgbnVsbDtcbiAgLyoqIFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1N0VDNlx1ODI4Mlx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTkzMVx1OEQyNVx1N0I0OVx1NTM5Rlx1NTZFMFx1RkYwQ1x1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1NTFGQVx1Njc2NVx1NEZCRlx1NEU4RVx1OEJDQVx1NjVBRFx1RkYwOSAqL1xuICBlcnJvckRldGFpbDogc3RyaW5nIHwgbnVsbDtcbiAgZ2VuZXJhdGlvbjogbnVtYmVyO1xuICAvKiogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHU0RTJEXHU3Njg0XHU1ODlFXHU5MUNGXHU2NTg3XHU2NzJDXHVGRjA4b3B0aW1pemluZyBcdTYwMDFcdTVCOUVcdTY1RjZcdTY2RjRcdTY1QjBcdUZGMUJcdTk3NUVcdTZENDFcdTVGMEZcdTUxNjhcdTdBMEJcdTRFM0FcdTdBN0FcdTRFMzJcdUZGMDkgKi9cbiAgZHJhZnQ6IHN0cmluZztcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOG51bGwgPSBcdTY3MkFcdTdFRDFcdTVCOUEvXHU1MTY4XHU1QzQwXHVGRjA5XHVGRjFBXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU1M0VBXHU1QzVFXHU0RThFXHU4QkU1XHU0RjFBXHU4QkREXHVGRjBDXHU1MjA3XHU4RDcwXHU0RTBEXHU4RERGXHU5NjhGICovXG4gIHNlc3Npb25JZDogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NUY1M1x1NTI0RFx1NkI2NVx1OUFBNFx1RkYwOCdtb2RlbCcgfCAnc3RhcnQnIHwgJ3BvbGwnIHwgbnVsbFx1RkYwOVx1RkYxQVx1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1OEZEQlx1NUVBNlx1RkYwQ1x1NUI5QVx1NEY0RFx1NTM2MVx1NzBCOSAqL1xuICBzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyB8IG51bGw7XG59XG5cbi8qKiBcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMUFyZWR1Y2VyIFx1NkMzOFx1NEUwRFx1NTE5OVx1NTZERVx1NUI4M1x1NjIxNlx1OEZENFx1NTZERVx1NTNFRlx1NTNEOFx1NzY4NFx1NjVCMFx1NUJGOVx1OEM2MVx1RkYxQlx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOFRhc2sgNCBzdG9yZSBcdTgwRjZcdTZDMzRcdUZGMDlcdTVGQzVcdTk4N0JcdTRFRTUgeyAuLi5JTklUSUFMX1BSRVZJRVcgfSBcdTRFM0FcdTZCQ0ZcdTRGMUFcdThCRERcdTc5Q0RcdTVCNTAgKi9cbmV4cG9ydCBjb25zdCBJTklUSUFMX1BSRVZJRVc6IFByZXZpZXdTdGF0ZSA9IHtcbiAgc3RhdHVzOiAnaWRsZScsXG4gIHJlc3VsdDogJycsXG4gIGVycm9yS2luZDogbnVsbCxcbiAgZXJyb3JEZXRhaWw6IG51bGwsXG4gIGdlbmVyYXRpb246IDAsXG4gIGRyYWZ0OiAnJyxcbiAgc2Vzc2lvbklkOiBudWxsLFxuICBzdGVwOiBudWxsLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nOyBzZXNzaW9uSWQ/OiBzdHJpbmcgfCBudWxsIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZDsgZGV0YWlsPzogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdndWlkZScgfVxuICB8IHsgdHlwZTogJ2Nsb3NlJyB9XG4gIHwgeyB0eXBlOiAnZHJhZnQnOyB0ZXh0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ3N0ZXAnOyBzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyB8IG51bGwgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgIHN0YXR1czogJ29wdGltaXppbmcnLFxuICAgICAgICBlcnJvcktpbmQ6IG51bGwsXG4gICAgICAgIGVycm9yRGV0YWlsOiBudWxsLFxuICAgICAgICBkcmFmdDogJycsXG4gICAgICAgIHNlc3Npb25JZDogYWN0aW9uLnNlc3Npb25JZCA/PyBudWxsLFxuICAgICAgICBzdGVwOiAnbW9kZWwnLFxuICAgICAgICBnZW5lcmF0aW9uOiBzdGF0ZS5nZW5lcmF0aW9uICsgMSxcbiAgICAgIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0LCBkcmFmdDogJycgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAnZXJyb3InLCBlcnJvcktpbmQ6IGFjdGlvbi5raW5kLCBlcnJvckRldGFpbDogYWN0aW9uLmRldGFpbCA/PyBudWxsIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdndWlkZSc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyBzdGF0ZSA6IHsgLi4uc3RhdGUsIHN0YXR1czogJ2d1aWRlJyB9O1xuICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgIHJldHVybiBJTklUSUFMX1BSRVZJRVc7XG4gICAgY2FzZSAnZHJhZnQnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8geyAuLi5zdGF0ZSwgZHJhZnQ6IGFjdGlvbi50ZXh0IH0gOiBzdGF0ZTtcbiAgICBjYXNlICdzdGVwJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIHN0ZXA6IGFjdGlvbi5zdGVwIH0gOiBzdGF0ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHN0YXRlO1xuICB9XG59XG5cbi8qKiBcdThCQTFcdTUyMTJcdTg5QzRcdTVCOUFcdTc2ODRcdTUxNkNcdTVGMDAgQVBJXHVGRjA4VGFzayA0IFx1OEQ3N1x1NUI1OFx1NTcyOFx1RkYxQmNhblRyaWdnZXIgXHU3Njg0ICFidXN5IFx1NTM0QVx1OEZCOVx1NjI3Rlx1NjJDNVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1ODA0Q1x1OEQyM1x1RkYwQ1x1NTE3Nlx1NEY1OVx1NEZERFx1NzU1OVx1NEVFNVx1NTkwN1x1NTQwRVx1N0VFRFx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbk9wdGltaXplRnJvbShzdGF0dXM6IFByZXZpZXdTdGF0dXMpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0YXR1cyAhPT0gJ29wdGltaXppbmcnO1xufVxuIiwgIi8qKiBcdTk4ODRcdTg5QzhcdTcyQjZcdTYwMDFcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkYgXHUyMDE0XHUyMDE0IFx1NjMwOVx1OTRBRS9cdTk4ODRcdTg5QzhcdTUzNjEvcnVuT3B0aW1pemUgXHU1MTcxXHU0RUFCXHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgKi9cblxuaW1wb3J0IHtcbiAgSU5JVElBTF9QUkVWSUVXLFxuICByZWR1Y2VQcmV2aWV3LFxuICB0eXBlIFByZXZpZXdBY3Rpb24sXG4gIHR5cGUgUHJldmlld1N0YXRlLFxufSBmcm9tICcuL3ByZXZpZXctc3RhdGUuanMnO1xuXG4vKiogXHU2QTIxXHU1NzU3XHU3RUE3XHU1MzU1XHU0RjhCXHU3MkI2XHU2MDAxXHVGRjA4XHU2QkNGXHU2M0QyXHU0RUY2XHU1QjlFXHU0RjhCXHU0RTAwXHU0RUZEXHVGRjFBXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU1MTg1XHU1MTY4XHU1QzQwXHU1NTJGXHU0RTAwXHVGRjA5ICovXG5sZXQgc3RhdGU6IFByZXZpZXdTdGF0ZSA9IHsgLi4uSU5JVElBTF9QUkVWSUVXIH07XG5jb25zdCBsaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbi8qKiBcdThCRkJcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdUZGMDhcdTdBMzNcdTVCOUFcdTVGMTVcdTc1MjhcdTc2RjRcdTUyMzBcdTRFMEJcdTRFMDBcdTZCMjEgZGlzcGF0Y2hcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3QnVzU3RhdGUoKTogUHJldmlld1N0YXRlIHtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vKiogXHU2RDNFXHU1M0QxXHU3MkI2XHU2MDAxXHU2NzNBXHU1MkE4XHU0RjVDXHU1RTc2XHU5MDFBXHU3N0U1XHU4QkEyXHU5NjA1XHU4MDA1ICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hQcmV2aWV3KGFjdGlvbjogUHJldmlld0FjdGlvbik6IHZvaWQge1xuICBzdGF0ZSA9IHJlZHVjZVByZXZpZXcoc3RhdGUsIGFjdGlvbik7XG4gIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSBsaXN0ZW5lcigpO1xufVxuXG4vKiogXHU4QkEyXHU5NjA1XHU1M0Q4XHU1MzE2XHVGRjFCXHU4RkQ0XHU1NkRFXHU5MDAwXHU4QkEyXHU1MUZEXHU2NTcwICovXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlUHJldmlld0J1cyhsaXN0ZW5lcjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfTtcbn0iLCAiLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5MiBydW5PcHRpbWl6ZSArIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNiBcdTIwMTRcdTIwMTQgXHU3MkI2XHU2MDAxXHU3RUNGXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdTUzRDFcdTVFMDNcdUZGMENcbiAqICBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwOFx1Njg0Q1x1OTc2Mlx1NkUzMlx1NjdEM1x1NUM0Mlx1NUJGOSBpbnB1dC5yaWdodC9vdmVybGF5IFx1NjlGRFx1NEY0RFx1NEUwRFx1NjNEMFx1NEY5Qlx1OEZEOVx1NEU5Qlx1NjgwN1x1NTFDNiBwcm9wc1x1RkYwQ1xuICogIFx1N0VDNFx1NEVGNlx1NEY5RFx1OEQ1Nlx1NUI4M1x1NEVFQ1x1NEYxQVx1NUQyOVx1NUU3Nlx1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1MjAxNFx1MjAxNFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjgvXHU5ODg0XHU4OUM4XHU1MzYxXHU0RTBEXHU1M0VGXHU4OUMxXHU3Njg0XHU1QjlFXHU2RDRCXHU1QjlBXHU4QkJBXHVGRjA5XHUzMDAyICovXG5cbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZVN0cmVhbSxcbiAgcmVzb2x2ZVNlc3Npb25Nb2RlbCxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuSG9zdE9wdGltaXplLCB0eXBlIEhvc3RScGMgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGJ1aWxkU3lzdGVtUHJvbXB0IH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgZGlzcGF0Y2hQcmV2aWV3IH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbi8qKlxuICogXHU1RjUzXHU1MjREIGluLWZsaWdodCBcdThCRjdcdTZDNDJcdTc2ODRcdTYzQTdcdTUyMzZcdTU2NjhcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMDlcdUZGMUFcbiAqIC0gXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHU2NUY2XHU0RTJEXHU2QjYyXHU1QjgzXHVGRjBDXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHVGRjFCXG4gKiAtIHJ1bk9wdGltaXplIFx1NEVFNVx1MzAwQ1x1NUI1OFx1NTcyOFx1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNlx1NTY2OFx1MzAwRFx1NEUzQVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYwOFx1NTQwQ1x1NEUwMFx1NjVGNlx1NTIzQlx1NTNFQVx1NTE0MVx1OEJCOFx1NEUwMFx1NEUyQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1RkYwOVx1MzAwMlxuICogXHU2Q0U4XHVGRjFBXHU2QTIxXHU1NzU3XHU3RUE3XHU2MTBGXHU1NDczXHU3NzQwXHU1OTFBXHU0RjFBXHU4QkREXHU1NDBDXHU2NUY2XHU0RjE4XHU1MzE2XHU0RjFBXHU0RTkyXHU3NkY4XHU4QkE5XHU4REVGXHUyMDE0XHUyMDE0XHU4RjkzXHU1MTY1XHU2ODBGXHU1MzU1XHU0RjFBXHU4QkREXHU4MDVBXHU3MTI2XHU3Njg0XHU0RUE0XHU0RTkyXHU0RTBCXHU1M0VGXHU2M0E1XHU1M0Q3XHU2QjY0XHU3QjgwXHU1MzE2XHUzMDAyXG4gKi9cbmxldCBhY3RpdmVDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbi8qKiBcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdTc2ODRcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMDhcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTYzMDlcdTRGMUFcdThCRERcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTk2MzJcdTYyOTZcdUZGMUJcdTVGMDJcdTRGMUFcdThCRERcdThCQTlcdThERUZcdUZGMDkgKi9cbmxldCBhY3RpdmVTZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUyMTkyIFx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxXHVGRjA4ZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUyMTkyIGd1aWRlXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbiAgLyoqIFx1NUJCRlx1NEUzQlx1NkEyMVx1NTc4Qlx1RkYwOFVJIFx1NjgwN1x1N0I3RVx1RkYwOVx1RkYxQlx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTE4NVx1OTBFOFx1ODFFQVx1ODg0Q1x1ODlFM1x1Njc5MCAqL1xuICBnZXRTZXNzaW9uTW9kZWw/KCk6IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTc1MjhcdUZGMDlcdUZGMUFcdTgxRUFcdTY3MDkgUlBDIFx1MjE5MiBzZXJ2ZXIgaGFsZiBcdTc2ODQgbGxtLnN0cmVhbVx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RSAqL1xuICBob3N0Pzoge1xuICAgIHJwYzogSG9zdFJwYztcbiAgfTtcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOFx1N0VEMVx1NUI5QVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1RkYwQ1x1NTIwN1x1NEYxQVx1OEJERFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOSAqL1xuICBnZXRTZXNzaW9uSWQ/KCk6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBjbGllbnQgXHU0RkE3XHU4QkNBXHU2NUFEXHU1N0NCXHU3MEI5XHVGRjA4XHU1MTk5XHU1MTY1IHNlcnZlciBcdThDMDNcdThCRDVcdTY1RTVcdTVGRDdcdUZGMENcdTVCOUFcdTRGNERcdTUzNjFcdTcwQjlcdUZGMDkgKi9cbiAgdHJhY2U/KG1zZzogc3RyaW5nKTogdm9pZDtcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBjb25zdCBkcmFmdCA9IGN0eC5nZXREcmFmdCgpLnRyaW0oKTtcbiAgY3R4LnRyYWNlPy4oYHJ1bk9wdGltaXplOiBjYWxsZWQgZHJhZnRMZW49JHtkcmFmdC5sZW5ndGh9IHVzZVNlc3Npb25Nb2RlbD0ke2NvbmZpZy51c2VTZXNzaW9uTW9kZWx9YCk7XG4gIGlmICghZHJhZnQpIHtcbiAgICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGVtcHR5IGRyYWZ0IC0+IHJldHVybicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYxQVx1NTQwQ1x1NEYxQVx1OEJERFx1NTcyOFx1OTAxNCBcdTIxOTIgXHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHVGRjA4XHU2MzA5XHU5NEFFIGJ1c3kgXHU1REYyXHU3OTgxXHU3NTI4XHU3MEI5XHU1MUZCXHVGRjBDXHU4RkQ5XHU5MUNDXHU2NjJGXHU3QURFXHU2MDAxXHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHVGRjA5XHVGRjFCXG4gIC8vIFx1NTIwN1x1NjM2Mlx1NEYxQVx1OEJERFx1NTQwRVx1NTNEMVx1OEQ3NyBcdTIxOTIgXHU0RTJEXHU2QjYyXHU2NUU3XHU4QkY3XHU2QzQyXHU4QkE5XHU4REVGXHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU0RjE4XHU1MzE2XHVGRjBDXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU3NTMxIGNhbmNlbCBcdTY1MzZcdTVDM0VcdUZGMDlcbiAgY29uc3Qgc2Vzc2lvbklkID0gY3R4LmdldFNlc3Npb25JZD8uKCkgPz8gbnVsbDtcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHtcbiAgICBpZiAoc2Vzc2lvbklkID09PSBhY3RpdmVTZXNzaW9uSWQpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogc2FtZS1zZXNzaW9uIGluZmxpZ2h0IC0+IGRlYm91bmNlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogZGlmZmVyZW50IHNlc3Npb24gLT4gYWJvcnQgc3RhbGUnKTtcbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgfVxuICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGRpc3BhdGNoIGJlZ2luJyk7XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdiZWdpbicsIHNlc3Npb25JZCB9KTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlUHJldmlldygpXHVGRjBDXHU0RjlCXHU1MzYxXHU3MjQ3XHU1MTczXHU5NUVEXHU2NUY2XHU1M0Q2XHU2RDg4XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXG4gIGFjdGl2ZVNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERFx1OTAxQVx1OTA1MyBcdTIwMTRcdTIwMTQgXHU5NkY2XHU5MTREXHU3RjZFXHVGRjBDXHU2NUUwXHU5NzAwIGNoZWNrQ29uZmlnXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogaG9zdCBicmFuY2ggLT4gcnVuSG9zdE9wdGltaXplJyk7XG4gICAgICBhd2FpdCBydW5Ib3N0T3B0aW1pemUoe1xuICAgICAgICBycGM6IGN0eC5ob3N0LnJwYyxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgdGV4dDogZHJhZnQsXG4gICAgICAgIHN5c3RlbTogYnVpbGRTeXN0ZW1Qcm9tcHQoY3R4LmdldExhbmcoKSksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIG9uRGVsdGE6ICh0ZXh0KSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0IH0pLFxuICAgICAgICBvblN0ZXA6IChzdGVwKSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc3RlcCcsIHN0ZXAgfSksXG4gICAgICAgIHRyYWNlOiAobXNnKSA9PiB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbZHNoLXByb21wdC1vcHRpbWl6ZXJdJywgbXNnKTtcbiAgICAgICAgfSxcbiAgICAgIH0pLnRoZW4oXG4gICAgICAgIChmaW5hbFRleHQpID0+IGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0OiBmaW5hbFRleHQgfSksXG4gICAgICAgIChlKSA9PiB7XG4gICAgICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGtpbmQgPSB0b0Vycm9yS2luZChlKS5raW5kO1xuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZCwgZGV0YWlsOiBTdHJpbmcoKGUgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZSA/PyBlKSB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA4XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCL1x1NUJCRlx1NEUzQlx1NEUwRFx1NTNFRlx1NzUyOFx1OTY0RFx1N0VBN1x1RkYwOVx1NjI0RFx1ODk4MVx1NkM0Mlx1OTE0RFx1N0Y2RVxuICAgIGlmICghY2hlY2tDb25maWcoY29uZmlnKS5vaykge1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2d1aWRlJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTZBMjFcdTVGMEZcdUZGMUFcdTZENEZcdTg5QzhcdTU2NjggZmV0Y2ggXHU3NkY0XHU4RkRFXHU4MUVBXHU5MTREIEFQSVx1RkYwOFx1NkQ0MVx1NUYwRlx1RkYwOVxuICAgIC8vIFx1NkEyMVx1NTc4Qlx1ODlFM1x1Njc5MFx1RkYxQXVzZVNlc3Npb25Nb2RlbFx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1MjE5MiBcdTVCQkZcdTRFM0JcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTRFQzVcdTRGNUMgbW9kZWwgXHU1NDBEXHU1NkRFXHU5MDAwXHU0RjdGXHU3NTI4XHVGRjBDXHU5NzAwXHU5MTREXHU3RjZFXHU1REYyXHU1QzMxXHU3RUVBXHVGRjA5XHVGRjFCXHU1NDI2XHU1MjE5IFx1MjE5MiBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcbiAgICBsZXQgbW9kZWwgPSBjb25maWcubW9kZWw7XG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICAgIGNvbnN0IHNlc3Npb25Nb2RlbCA9IGF3YWl0IGN0eC5nZXRTZXNzaW9uTW9kZWw/LigpO1xuICAgICAgaWYgKHNlc3Npb25Nb2RlbCAmJiBzZXNzaW9uTW9kZWwubW9kZWwpIG1vZGVsID0gc2Vzc2lvbk1vZGVsLm1vZGVsO1xuICAgIH1cbiAgICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAgIC8vIFx1NUM1NVx1NzkzQVx1N0QyRlx1NzlFRlx1RkYxQVx1NkI2M1x1NjU4N1x1NEYxOFx1NTE0OFx1RkYxQlx1NkI2M1x1NjU4N1x1NUMxQVx1NjcyQVx1NTFGQVx1NzNCMFx1RkYwOHY0IFx1N0NGQlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNVx1NjNBOFx1NzQwNlx1RkYwOVx1NjVGNlx1NUM1NVx1NzkzQVx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwQ1x1OEJBOVx1NkQ0MVx1NUYwRlx1N0FDQlx1NTM3M1x1NTNFRlx1ODlDMVxuICAgIGxldCByZWFzb25pbmcgPSAnJztcbiAgICBsZXQgY29udGVudCA9ICcnO1xuICAgIGxldCBzaG93biA9ICcnO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcHRpbWl6ZVN0cmVhbSh7XG4gICAgICAgIGNvbmZpZzogZWZmZWN0aXZlLFxuICAgICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50Jykge1xuICAgICAgICAgICAgY29udGVudCArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWFzb25pbmcgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0OiBzaG93biB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gXHU1MTQ4XHU1MjI0XHU1QjlBXHU0RTJEXHU2QjYyXHVGRjFBXHU3NTI4XHU2MjM3L1x1N0VDNFx1NEVGNlx1NTNENlx1NkQ4OFx1NEUwRVx1OEQ4NVx1NjVGNlx1OTBGRFx1ODg2OFx1NzNCMFx1NEUzQSBBYm9ydEVycm9yXHVGRjFCXHU0RUM1XHU4RDg1XHU2NUY2XHU1MTk5XHU1MTY1XHU5NTE5XHU4QkVGXHU2MDAxXG4gICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICh0eXBlb2YgKGUgYXMgeyBuYW1lPzogdW5rbm93biB9IHwgbnVsbCk/Lm5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgIGlmICh0aW1lZE91dCkgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiAndGltZW91dCcgYXMgT3B0aW1pemVFcnJvcktpbmQgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBcdTk4NzZcdTVDNDJcdTUxNUNcdTVFOTVcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTMgcmVqZWN0IFx1NURGMlx1ODhBQiAudGhlbiBcdTZEODhcdTUzMTZcdUZGMUJcdTZCNjRcdTU5MDRcdTRGRERcdTYyQTQgZmV0Y2ggXHU1MjA2XHU2NTJGXHU0RUU1XHU1OTE2XHU3Njg0XHU2MTBGXHU1OTE2XHU1RjAyXHU1RTM4XHVGRjA5XG4gICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChhY3RpdmVDb250cm9sbGVyID09PSBjb250cm9sbGVyKSB7XG4gICAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICAgIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gICAgfVxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2NhcmQuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWNhcmQge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDEycHg7XG4gIHJpZ2h0OiAxMnB4O1xuICBib3R0b206IGNhbGMoMTAwJSArIDhweCk7XG4gIHotaW5kZXg6IDQwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctb3ZlcmxheSwgI2ZmZik7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIsIHJnYmEoMTI4LDEyOCwxMjgsMC4zKSk7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIGJveC1zaGFkb3c6IDAgOHB4IDI0cHggcmdiYSgwLCAwLCAwLCAwLjE2KTtcbiAgcGFkZGluZzogMTJweCAxNHB4O1xuICBtYXgtaGVpZ2h0OiAzMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4uZHNoLXBvLWNhcmQtaGVhZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBmb250LXdlaWdodDogNjAwO1xufVxuLmRzaC1wby1jYXJkLWJvZHkge1xuICBvdmVyZmxvdzogYXV0bztcbiAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSwgIzQ0NCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDEuNjtcbiAgbWF4LWhlaWdodDogMjAwcHg7XG59XG4uZHNoLXBvLWNhcmQtZXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLmRzaC1wby1jYXJkLXN0ZXAge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKTtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBtYXJnaW4tbGVmdDogNHB4O1xufVxuLmRzaC1wby1jYXJkLWVyci1kZXRhaWwge1xuICBtYXJnaW4tdG9wOiA0cHg7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtdGV4dC1zZWNvbmRhcnksICM4YzkzYTEpO1xuICBmb250LXNpemU6IDEycHg7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLWFsbDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUEtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5IFx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NVx1ODI3MiBcdTIxOTIgXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU0RTBEXHU1M0VGXHU4QkZCXHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5ICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRTdGF0ZShnZXRQcmV2aWV3QnVzU3RhdGUoKSkpLFxuICAgIFtdLFxuICApO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgY29uc3QgbW91bnRlZFJlZiA9IHVzZVJlZih0cnVlKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IHsgc3RhdHVzLCByZXN1bHQsIGVycm9yS2luZCB9ID0gc3RhdGU7XG4gIGNvbnN0IFtjb3BpZWQsIHNldENvcGllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGNvcHlUaW1lclJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcblxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMUFcdTUyMDdcdTYzNjJcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTRFMERcdThEREZcdTk2OEZcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdTU2REVcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTYwNjJcdTU5MERcdUZGMDlcbiAgaWYgKHN0YXR1cyAhPT0gJ2lkbGUnICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNpZCA9IGdldFNlc3Npb25JZD8uKCk7XG4gICAgaWYgKHNpZCAhPT0gbnVsbCAmJiBzdGF0ZS5zZXNzaW9uSWQgIT09IHNpZCkgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZXRyeSA9ICgpID0+IHtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gcmVhZENvbXBvc2VyVGV4dCgpLFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgZ2V0SG9zdCxcbiAgICAgIGdldFNlc3Npb25JZCxcbiAgICAgIHRyYWNlOiAobXNnKSA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybignW2RzaC1wcm9tcHQtb3B0aW1pemVyXScsIG1zZyk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgd3JpdGVDb21wb3NlclRleHQocmVzdWx0KTtcbiAgICBjbG9zZVByZXZpZXcoKTtcbiAgfTtcblxuICBjb25zdCBjb3B5ID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuOyAvLyBcdTk3NUVcdTVCODlcdTUxNjhcdTRFMEFcdTRFMEJcdTY1ODdcdUZGMDhodHRwIFx1N0I0OVx1RkYwOVx1RkYxQVx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMENcdTRGRERcdTYzMDFcdTUzRUZcdTkxQ0RcdThCRDVcbiAgICB0cnkge1xuICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0KTtcbiAgICAgIGlmICghbW91bnRlZFJlZi5jdXJyZW50KSByZXR1cm47IC8vIGF3YWl0IFx1NjcxRlx1OTVGNFx1N0VDNFx1NEVGNlx1NURGMlx1NTM3OFx1OEY3RFx1RkYxQVx1NEUwRFx1NTE4RCBzZXRTdGF0ZVxuICAgICAgc2V0Q29waWVkKHRydWUpO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHNldENvcGllZChmYWxzZSk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH0sIDEyMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjZBXHU4RDM0XHU2NzdGXHU1MTk5XHU1MTY1XHU1OTMxXHU4RDI1XHVGRjFBXHU5NzU5XHU5RUQ4XHVGRjA4XHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwOVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmRcIiByb2xlPVwic3RhdHVzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWhlYWRcIj5cbiAgICAgICAgPHNwYW4+e3QoJ2NhcmQudGl0bGUnKX08L3NwYW4+XG4gICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGNsb3NlUHJldmlldygpOyBvcGVuU2V0dGluZ3MoKTsgfX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5hY3Rpb24nKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ29wdGltaXppbmcnICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+XG4gICAgICAgICAge3N0YXRlLmRyYWZ0ID8gPHNwYW4gc3R5bGU9e3sgd2hpdGVTcGFjZTogJ3ByZS13cmFwJyB9fT57c3RhdGUuZHJhZnR9PC9zcGFuPiA6IHQoJ2NhcmQub3B0aW1pemluZycpfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdwcmV2aWV3JyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3Jlc3VsdH08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXBsYWNlfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmVwbGFjZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiB2b2lkIGNvcHkoKX0+XG4gICAgICAgICAgICAgIHtjb3BpZWQgPyB0KCdjYXJkLmNvcHlEb25lJykgOiB0KCdjYXJkLmNvcHknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyXCI+e3QoZXJyb3JLZXkoZXJyb3JLaW5kKSl9PC9kaXY+XG4gICAgICAgICAge2Vycm9yRGV0YWlsID8gPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1lcnItZGV0YWlsXCI+e2Vycm9yRGV0YWlsfTwvZGl2PiA6IG51bGx9XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59IiwgIi8qKiBcdThCQkVcdTdGNkUgXHUyMTkyIEdlbmVyYWwgXHU1MzNBXHUzMDBDUHJvbXB0IFx1NEYxOFx1NTMxNlx1MzAwRFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYxQVx1NjgwN1x1OTg5OFx1NjQ1OFx1ODk4MSArIFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NSAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybVN0YXRlLCBTZXR0aW5nc0Zvcm1WYWx1ZXMgfSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1BY3Rpb25zIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgeyBvbk9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NSb3dQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICB1c2VTdG9yZTogPFQ+KHNlbGVjdG9yOiAoczogU2V0dGluZ3NGb3JtU3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IFNldHRpbmdzRm9ybUFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBzYXZlQ29uZmlnOiAodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IFByb21pc2U8dm9pZD47XG4gIHJlc2V0Q29uZmlnOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBnZXRFcG9jaDogKCkgPT4gbnVtYmVyO1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU4MUVBXHU2OEMwXHVGRjFBXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2NjJGXHU1NDI2XHU1M0VGXHU3RUNGIHNlcnZlciBoYWxmIFx1ODNCN1x1NTNENlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1OTAxQVx1OTA1M1x1NzY4NFx1NTA2NVx1NUVCN1x1NjNBMlx1OTQ4OFx1RkYwOSAqL1xuICBnZXRIb3N0U3RhdHVzPzogKCkgPT4gUHJvbWlzZTx7IGF2YWlsYWJsZTogYm9vbGVhbjsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nOyBlcnJvcj86IHN0cmluZyB9IHwgbnVsbD47XG59XG5cbmltcG9ydCB7IEJVSUxEX0lEIH0gZnJvbSAnLi9idWlsZC1pZC5qcyc7XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9zZXR0aW5ncy5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5vcHRpU2V0dGluZ3Mge1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIHBhZGRpbmc6IDE2cHggMDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4ub3B0aVNldHRpbmdzVGl0bGUge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAyMnB4O1xufVxuLm9wdGlTZXR0aW5nc0hpbnQge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0Zvcm0ge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0ZpZWxkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzTGFiZWwge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NJbnB1dCB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1sYXllci0yKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgcGFkZGluZzogNnB4IDhweDtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLm9wdGlTZXR0aW5nc1JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuLm9wdGlTZXR0aW5nc0J0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTJweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG59XG4ub3B0aVNldHRpbmdzQnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUFcdTRFM0JcdTk4OThcdTUzRDhcdTkxQ0ZcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTRGMUFcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDUvXHU2REYxXHU2NzgxXHU3QUVGXHU4MjcyXHVGRjA4XHU5RUQxXHU1RTk1XHU5RUQxXHU1QjU3XHUzMDAxXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU1NzQ3XHU4OEFCXHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5XHVGRjBDXG4gICAgIFx1NTZGQVx1NUI5QVx1NTRDMVx1NzI0Q1x1ODRERCArIFx1NzY3RFx1NUI1N1x1NEZERFx1OEJDMVx1NEVGQlx1NEY1NVx1NEUzQlx1OTg5OFx1NTNFRlx1OEJGQiAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbi5vcHRpU2V0dGluZ3NFcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEycHg7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNldHRpbmdzUm93KHByb3BzOiBTZXR0aW5nc1Jvd1Byb3BzKSB7XG4gIGNvbnN0IHsgdCwgdXNlU3RvcmUsIGFjdGlvbnMsIGdldENvbmZpZywgc2F2ZUNvbmZpZywgcmVzZXRDb25maWcsIGdldEVwb2NoLCBnZXRIb3N0U3RhdHVzIH0gPSBwcm9wcztcbiAgY29uc3QgW2hvc3RTdGF0dXMsIHNldEhvc3RTdGF0dXNdID0gdXNlU3RhdGU8eyBhdmFpbGFibGU6IGJvb2xlYW47IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfSB8IG51bGw+KG51bGwpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZ2V0SG9zdFN0YXR1cykgcmV0dXJuO1xuICAgIGxldCBhbGl2ZSA9IHRydWU7XG4gICAgZ2V0SG9zdFN0YXR1cygpLnRoZW4oKHN0KSA9PiB7IGlmIChhbGl2ZSkgc2V0SG9zdFN0YXR1cyhzdCk7IH0pLmNhdGNoKCgpID0+IHsgaWYgKGFsaXZlKSBzZXRIb3N0U3RhdHVzKHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6ICdycGMtZmFpbGVkJyB9KTsgfSk7XG4gICAgcmV0dXJuICgpID0+IHsgYWxpdmUgPSBmYWxzZTsgfTtcbiAgfSwgW2dldEhvc3RTdGF0dXNdKTtcbiAgY29uc3QgW2V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzdWJtaXRSZXZpc2lvbiwgc2V0U3VibWl0UmV2aXNpb25dID0gdXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgdmFsdWVzID0gdXNlU3RvcmUoKHMpID0+IHMudmFsdWVzKTtcbiAgY29uc3Qgc2F2ZWQgPSB1c2VTdG9yZSgocykgPT4gcy5zYXZlZCk7XG4gIGNvbnN0IGVycm9yID0gdXNlU3RvcmUoKHMpID0+IHMuZXJyb3IpO1xuICAvLyBcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFIFJQQyBcdTU5MzFcdThEMjVcdTY1RjZcdTY2M0VcdTc5M0FcdTc2ODRcdTUzOUZcdTU5Q0JcdTk1MTlcdThCRUZcdUZGMDhcdTRFMERcdTUxOERcdTk3NTlcdTlFRDhcdTU5MzFcdThEMjVcdUZGMUFzZXR0aW5ncyBcdTUxOTlcdTUxNjVcdTUxRkFcdTk1MTlcdTVGQzVcdTk4N0JcdThCQTlcdTc1MjhcdTYyMzdcdTc3MEJcdTVGOTdcdTUyMzBcdUZGMDlcbiAgY29uc3QgW3JwY0Vycm9yLCBzZXRScGNFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGNvbmZpZy5tb2RlbCA/IGNvbmZpZy5tb2RlbCA6ICdcdTIwMTQnO1xuXG4gIC8vIFx1OTk5Nlx1NkIyMVx1NjMwMlx1OEY3RCAvIFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1NjVGNlx1NjI4QVx1NUY1M1x1NTI0RFx1OTE0RFx1N0Y2RVx1NjRBRFx1NzlDRFx1OEZEQlx1ODg2OFx1NTM1NVx1MzAwMlxuICAvLyBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGNyA9IFx1NjcyQ1x1NTczMFx1NjNEMFx1NEVBNFx1NUU4Rlx1NTNGNyBzdWJtaXRSZXZpc2lvbiArIGNvbmZpZ0Vwb2NoXHVGRjA4XHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU3RUFBXHU1MTQzXHVGRjA5XHVGRjFBXG4gIC8vICAtIFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1RkYwOFx1OERFOFx1NjgwN1x1N0I3RVx1OTg3NS9cdTU5MTZcdTkwRThcdTUxOTlcdTUxNjUgXHUyMTkyIGluZGV4LnRzIHJlZnJlc2hDb25maWcgXHU3Njg0XHU3RUFBXHU1MTQzXHU5MDEyXHU1ODlFXHVGRjA5XHU0RUU0XHU0RkVFXHU4QkEyXHU1M0Y3XHU4RDg1XHU4RkM3XG4gIC8vICAgIHN0YXRlLnJldmlzaW9uXHVGRjBDXHU5MUNEXHU2NEFEXHU3OUNEXHU3NTFGXHU2NTQ4XHVGRjBDXHU4ODY4XHU1MzU1XHU4RERGXHU0RTBBXHU1RjUyXHU0RTAwXHU1MzE2XHU1NDBFXHU3Njg0XHU5NTVDXHU1MENGXHVGRjFCXG4gIC8vICAtIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkVcdTVERjJcdTkwMUFcdThGQzcgY29tbWl0L3NlZWQgXHU1MTk5XHU1MTY1XHUzMDBDXHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU1RjUzXHU2NUY2XHU3RUFBXHU1MTQzXHUzMDBEXHU3Njg0XHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjBDXHU3RDI3XHU2M0E1XHU3Njg0XHU2NzJDXHU2QjIxXHU2NTQ4XHU1RTk0XG4gIC8vICAgIFx1NTZERVx1OEREMVx1RkYwOFx1N0VBQVx1NTE0M1x1NjcyQVx1NTNEOFx1RkYwOVx1NEZFRVx1OEJBMlx1NTNGN1x1NzZGOFx1N0I0OVx1ODhBQiByZWR1Y2VyIFx1NjI5MVx1NTIzNiBcdTIxOTIgXHU0RkREXHU0RjRGXHU3NTI4XHU2MjM3XHU1MzlGXHU1OUNCXHU4RjkzXHU1MTY1XHU0RTBFXHUzMDBDXHU1REYyXHU0RkREXHU1QjU4XHUzMDBEXHU2M0QwXHU3OTNBXHVGRjFCXG4gIC8vICAgIFx1NEUwQlx1NkIyMVx1NjcyQ1x1NTczMFx1NTJBOFx1NEY1Q1x1RkYwOGVkaXQvY29tbWl0XHVGRjA5XHU1MThEXHU2MjhBIHN0YXRlLnJldmlzaW9uIFx1NjJBQ1x1NTIzMFx1NEUwRVx1N0VBQVx1NTE0M1x1NEUwMFx1ODFGNFx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFjdGlvbnMuc2VlZChcbiAgICAgIHsgYmFzZVVybDogY29uZmlnLmJhc2VVcmwsIGFwaUtleTogY29uZmlnLmFwaUtleSwgbW9kZWw6IGNvbmZpZy5tb2RlbCB9LFxuICAgICAgc3VibWl0UmV2aXNpb24gKyBnZXRFcG9jaCgpLFxuICAgICk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB9LCBbY29uZmlnLmJhc2VVcmwsIGNvbmZpZy5hcGlLZXksIGNvbmZpZy5tb2RlbCwgZ2V0RXBvY2hdKTtcblxuICAvLyBcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdUZGMDhcdTk4ODRcdTg5QzhcdTUzNjFcdTY3MkFcdTkxNERcdTdGNkVcdTVGMTVcdTVCRkNcdUZGMDlcdTIxOTIgXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1XG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoKCkgPT4gc2V0RXhwYW5kZWQodHJ1ZSkpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlU2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICBjb25zdCBlcnJvcnMgPSBhY3Rpb25zLnZhbGlkYXRlKHZhbHVlcyk7XG4gICAgaWYgKGVycm9ycykge1xuICAgICAgYWN0aW9ucy5mYWlsKE9iamVjdC52YWx1ZXMoZXJyb3JzKVswXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzYXZlQ29uZmlnKHZhbHVlcyk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgICAgLy8gXHU0RTBFXHU2NTQ4XHU1RTk0XHU1NkRFXHU4REQxXHU3Njg0IHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjA4XHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU3RUFBXHU1MTQzXHVGRjA5XHU1QkY5XHU5RjUwXHVGRjBDXHU0RjdGXHU0RkREXHU1QjU4XHU1NDBFXHU3Njg0XHU5MUNEXHU2NEFEXHU3OUNEXHU4OEFCXHU2MjkxXHU1MjM2XG4gICAgICBhY3Rpb25zLmNvbW1pdChzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3Muc2F2ZUZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVSZXNldCA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcmVzZXRDb25maWcoKTtcbiAgICAgIGFjdGlvbnMuc2VlZChcbiAgICAgICAgeyBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLCBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSwgbW9kZWw6IERFRkFVTFRTLm1vZGVsIH0sXG4gICAgICAgIHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCksXG4gICAgICApO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3MucmVzZXRGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NUaXRsZVwiIG9uQ2xpY2s9eygpID0+IHNldEV4cGFuZGVkKCh2KSA9PiAhdil9IHN0eWxlPXt7IGN1cnNvcjogJ3BvaW50ZXInIH19PlxuICAgICAgICB7dCgnc2V0dGluZ3MudGl0bGUnKX1cbiAgICAgICAgeyFleHBhbmRlZCAmJlxuICAgICAgICAgICh2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsID8gKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QoJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnKX08L3NwYW4+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KHZhbHVlcy5hcGlLZXkgPyAnY2FyZC5jb25maWd1cmVkLmhpbnQnIDogJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnKS5yZXBsYWNlKCd7bW9kZWx9JywgbW9kZWxMYWJlbCl9PC9zcGFuPlxuICAgICAgICAgICkpfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtleHBhbmRlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRm9ybVwiPlxuICAgICAgICAgIHtnZXRIb3N0U3RhdHVzICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIiBzdHlsZT17eyBmbGV4RGlyZWN0aW9uOiAncm93JyB9fT5cbiAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCJcbiAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgY29sb3I6IGhvc3RTdGF0dXM/LmF2YWlsYWJsZSA/ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtc3VjY2Vzcy1wcmltYXJ5LCAjMmY5ZTYzKScgOiAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApJyxcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kc3ctYWxpYXMtdGV4dC1zZWNvbmRhcnksICM4YzkzYTEpJyB9fT57YCBcdTAwQjcgYnVpbGQgJHtCVUlMRF9JRH1gfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICB7aG9zdFN0YXR1cyA9PT0gbnVsbFxuICAgICAgICAgICAgICAgICAgPyB0KCdzZXR0aW5ncy5ob3N0UHJvYmUnKVxuICAgICAgICAgICAgICAgICAgOiBob3N0U3RhdHVzLmF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICA/IGAke3QoJ3NldHRpbmdzLmhvc3RPaycpfSAke2hvc3RTdGF0dXMucHJvdmlkZXJ9LyR7aG9zdFN0YXR1cy5tb2RlbH1gXG4gICAgICAgICAgICAgICAgICAgIDogYCR7dCgnc2V0dGluZ3MuaG9zdEZhaWwnKX0gJHtob3N0U3RhdHVzLmVycm9yID8/ICcnfWB9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCI+XG4gICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXG4gICAgICAgICAgICAgICAgY2hlY2tlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgndXNlU2Vzc2lvbk1vZGVsJywgZS50YXJnZXQuY2hlY2tlZCl9XG4gICAgICAgICAgICAgIC8+eycgJ31cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCcpfVxuICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCcpfTwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1iYXNlLXVybFwiPnt0KCdzZXR0aW5ncy5iYXNlVXJsJyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYmFzZS11cmxcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYmFzZVVybH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e0RFRkFVTFRTLmJhc2VVcmx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYmFzZVVybCcsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYXBpLWtleVwiPnt0KCdzZXR0aW5ncy5hcGlLZXknKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1hcGkta2V5XCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmFwaUtleX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJzay1cdTIwMjZcIlxuICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAnXHUyMDE0JyA6IERFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ21vZGVsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1Jvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuIHByaW1hcnlcIiBvbkNsaWNrPXtoYW5kbGVTYXZlfT5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnNhdmUnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzQnRuXCIgb25DbGljaz17aGFuZGxlUmVzZXR9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MucmVzZXQnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAge3NhdmVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3Muc2F2ZWQnKX08L3NwYW4+fVxuICAgICAgICAgICAge3JwY0Vycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPntycGNFcnJvcn08L3NwYW4+fVxuICAgICAgICAgICAgeyFycGNFcnJvciAmJiBlcnJvciAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NFcnJcIj57dChlcnJvcil9PC9zcGFuPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuZGVzYycpfTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG4iLCAiLyoqIFx1Njc4NFx1NUVGQSBJRFx1RkYxQVx1NTM2MFx1NEY0RFx1N0IyNlx1NzUzMSBzY3JpcHRzL2J1aWxkLm1qcyBcdTU3MjhcdTY3ODRcdTVFRkFcdTY1RjZcdTY2RkZcdTYzNjJcdTRFM0FcdTVGNTNcdTUyNEQgZ2l0IFx1NzdFRFx1NTRDOFx1NUUwQ1x1RkYwOFx1NjYzRVx1NzkzQVx1NTcyOFx1OEJCRVx1N0Y2RVx1OTc2Mlx1Njc3Rlx1RkYwQ1x1Nzg2RVx1OEJBNFx1Njg0Q1x1OTc2Mlx1NTJBMFx1OEY3RFx1NzY4NFx1NjYyRlx1NjcwMFx1NjVCMCBkaXN0XHVGRjA5XHUzMDAyICovXG5leHBvcnQgY29uc3QgQlVJTERfSUQgPSAnX19CVUlMRF9JRF9fJztcbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYxQVx1NEYxOFx1NTMxNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVybCA9IHZhbHVlcy5iYXNlVXJsLnRyaW0oKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdmFsdWVzLmFwaUtleS50cmltKCkpIGVycm9ycy5hcGlLZXkgPSAnc2V0dGluZ3MuYXBpS2V5JztcbiAgaWYgKCF2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsICYmICF2YWx1ZXMubW9kZWwudHJpbSgpKSBlcnJvcnMubW9kZWwgPSAnc2V0dGluZ3MubW9kZWwnO1xuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RhdGUge1xuICB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcztcbiAgZGlydHk6IGJvb2xlYW47XG4gIHNhdmVkOiBib29sZWFuO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aXNpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IElOSVRJQUxfU0VUVElOR1NfRk9STTogU2V0dGluZ3NGb3JtU3RhdGUgPSB7XG4gIHZhbHVlczogeyBiYXNlVXJsOiAnJywgYXBpS2V5OiAnJywgbW9kZWw6ICcnLCB1c2VTZXNzaW9uTW9kZWw6IHRydWUgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIH1cbiAgfCB7IHR5cGU6ICdjb21taXQnOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsgbWVzc2FnZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VTZXR0aW5nc0Zvcm0oc3RhdGU6IFNldHRpbmdzRm9ybVN0YXRlLCBhY3Rpb246IFNldHRpbmdzRm9ybUFjdGlvbik6IFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ3NlZWQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5yZXZpc2lvbiA8PSBzdGF0ZS5yZXZpc2lvblxuICAgICAgICA/IHN0YXRlXG4gICAgICAgIDogeyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLmFjdGlvbi52YWx1ZXMgfSwgZGlydHk6IGZhbHNlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZWRpdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLnN0YXRlLnZhbHVlcywgW2FjdGlvbi5maWVsZF06IGFjdGlvbi52YWx1ZSB9LCBkaXJ0eTogdHJ1ZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xuICAgIGNhc2UgJ2NvbW1pdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBlcnJvcjogYWN0aW9uLm1lc3NhZ2UgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1VPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxpQkFBaUI7QUFDbkI7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFPLEtBQUssV0FBVyxXQUFXLElBQUksU0FBUyxTQUFTO0FBR3ZFLFFBQU0sV0FBVyxPQUFPLEtBQUssVUFBVSxZQUFZLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUssSUFBSSxTQUFTO0FBQ2xHLFFBQU0sa0JBQ0osYUFBYSxtQkFBbUIsaUJBQWlCLE9BQU8sTUFBTSxTQUFTLFVBQVUsU0FBUyxRQUFRO0FBQ3BHLFFBQU0sUUFBUTtBQUNkLFFBQU0sa0JBQWtCLE9BQU8sS0FBSyxvQkFBb0IsWUFBWSxJQUFJLGtCQUFrQixTQUFTO0FBQ25HLFNBQU8sRUFBRSxTQUFTLGlCQUFpQixPQUFPLEdBQUcsUUFBUSxPQUFPLGdCQUFnQjtBQUM5RTtBQUtPLFNBQVMsWUFBWSxRQUFtQztBQUM3RCxNQUFJLENBQUMsT0FBTyxPQUFPLEtBQUssRUFBRyxRQUFPLEVBQUUsSUFBSSxPQUFPLFFBQVEsY0FBYztBQUVyRSxNQUFJLENBQUMsT0FBTyxtQkFBbUIsQ0FBQyxPQUFPLE1BQU0sS0FBSyxFQUFHLFFB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QUFPLEVBQUUsV0FBVyxNQUFNLFVBQVUsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNO0FBQUEsa0JBQ2pFO0FBQ0EseUJBQU8sRUFBRSxXQUFXLE9BQU8sT0FBUSxJQUFJLFVBQVUsSUFBSSxNQUFNLFdBQVcsSUFBSSxNQUFNLFNBQVUsV0FBVztBQUFBLGdCQUN2RztBQUNBLHVCQUFPLEVBQUUsV0FBVyxPQUFPLE9BQVEsSUFBSSxVQUFVLElBQUksTUFBTSxXQUFXLElBQUksTUFBTSxTQUFVLGFBQWE7QUFBQSxjQUN6RyxTQUFTLEdBQUc7QUFDVix1QkFBTyxFQUFFLFdBQVcsT0FBTyxPQUFPLE9BQVEsR0FBNkIsV0FBVyxDQUFDLEVBQUU7QUFBQSxjQUN2RjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUdELFFBQU0sWUFBWSxDQUFDLE1BQXFCO0FBQ3RDLFFBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLE9BQVE7QUFDcEMsVUFBTSxLQUFLLFNBQVM7QUFDcEIsUUFBSSxFQUFFLGNBQWMscUJBQXNCO0FBQzFDLE1BQUUsZUFBZTtBQUNqQix3QkFBb0I7QUFBQSxFQUN0QjtBQUNBLFdBQVMsaUJBQWlCLFdBQVcsU0FBUztBQUNoRDsiLAogICJuYW1lcyI6IFsic3RhdGUiLCAiUmVhY3QiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIiwgImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJzdGF0ZSJdCn0K

    return module.exports;
  }
});
