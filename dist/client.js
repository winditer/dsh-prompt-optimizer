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
  trace?.("runHostOptimize: step model (call sessionModel)");
  const session = await resolveHostSessionModel(rpc, rpcTimeoutMs);
  if (!session) {
    trace?.("runHostOptimize: sessionModel FAILED -> host-unavailable");
    throw new Error("host-unavailable");
  }
  trace?.("runHostOptimize: sessionModel ok " + session.provider + "/" + session.model);
  onStep?.("start");
  trace?.("runHostOptimize: step start (call optimize.start)");
  const startedPayload = {
    provider: session.provider,
    model: session.model,
    text,
    system
  };
  if (session.reasoningEffort) startedPayload.reasoningEffort = session.reasoningEffort;
  const start = await callRpc(rpc, "optimize.start", startedPayload, rpcTimeoutMs);
  if (!start.ok || !start.value || typeof start.value.taskId !== "string") {
    trace?.("runHostOptimize: optimize.start FAILED -> host-start-rejected");
    throw new Error("host-start-rejected");
  }
  const taskId = start.value.taskId;
  trace?.("runHostOptimize: optimize.start ok task=" + taskId);
  onStep?.("poll");
  trace?.("runHostOptimize: step poll (loop start)");
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
        if (poll.error) {
          trace?.("runHostOptimize: poll error -> " + poll.error);
          throw new Error(poll.error);
        }
        const textNow = poll.text ?? "";
        if (textNow !== last) {
          onDelta(textNow);
          last = textNow;
        }
        if (poll.done) {
          trace?.("runHostOptimize: poll done textLen=" + textNow.length);
          return textNow;
        }
        trace?.("runHostOptimize: poll # textLen=" + textNow.length);
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
          void ctx.host?.rpc.call("debug.log", { msg }).catch(() => void 0);
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
        void getHost?.()?.rpc.call("debug.log", { msg }).catch(() => void 0);
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
var BUILD_ID = "f2ecc25";

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
            getEpoch: () => configEpoch,
            getHostStatus: async () => {
              try {
                const res = await withTimeout(
                  ctx.connection.rpc.call("/dsh-prompt-optimizer", "sessionModel", {}),
                  5e3,
                  "sessionModel"
                );
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvUHJldmlld0NhcmQudHN4IiwgIi4uL3NyYy9TZXR0aW5nc1Jvdy50c3giLCAiLi4vc3JjL2J1aWxkLWlkLnRzIiwgIi4uL3NyYy9zZXR0aW5ncy1zdG9yZS50cyIsICIuLi9zcmMvc2V0dGluZ3MtZm9ybS1zdGF0ZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqIGRzaC1wcm9tcHQtb3B0aW1pemVyIFx1NjNEMlx1NEVGNlx1NTE2NVx1NTNFMyBcdTIwMTQgYXBwbHkoY3R4KSAqL1xuXG5pbXBvcnQgdHlwZSB7IENsaWVudENvbnRleHQgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTLCBtZXJnZUNvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IE5TLCB6aCwgZW4sIGxhbmdPZiB9IGZyb20gJy4vbG9jYWxlcy5qcyc7XG5pbXBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBlbWl0T3B0aW1pemVSZXF1ZXN0LCBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcbmltcG9ydCB7IE9wdGltaXplQnV0dG9uIH0gZnJvbSAnLi9PcHRpbWl6ZUJ1dHRvbi50c3gnO1xuaW1wb3J0IHsgUHJldmlld0NhcmQgfSBmcm9tICcuL1ByZXZpZXdDYXJkLnRzeCc7XG5pbXBvcnQgeyBTZXR0aW5nc1JvdyB9IGZyb20gJy4vU2V0dGluZ3NSb3cudHN4JztcbmltcG9ydCB7IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgdHlwZSB7IEhvc3RScGMgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHdpdGhUaW1lb3V0IH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5cbi8qKlxuICogXHU1OEYwXHU2NjBFXHU2M0QyXHU0RUY2XHU0RjlEXHU4RDU2XHU3Njg0XHU1QkEyXHU2MjM3XHU3QUVGXHU2NzBEXHU1MkExXHVGRjA4Y29yZGlzIHNlcnZpY2Uga2V5c1x1RkYwOVx1RkYxQWFwcGx5IFx1NTE4NVx1N0VDRiBgY3R4LjxzZXJ2aWNlPmAgXHU4QkJGXHU5NUVFXHU3Njg0XHU2NzBEXHU1MkExXHU1RkM1XHU5ODdCXHU1NzI4XHU2QjY0XHU1OEYwXHU2NjBFXHUzMDAyXG4gKiBcdTUwM0NcdTk4N0JcdTRFM0FcdTY3MERcdTUyQTFcdTU0MERcdTgwMENcdTk3NUVcdTUzMDUgaWRcdTIwMTRcdTIwMTRcdTRFMEVcdTU0MENcdTVGNjJcdTYwMDFcdTUxNDhcdTRGOEJcdTRFMDBcdTgxRjRcdUZGMDhkc2gtbWVzc2FnZS1yYWlsOiBbXCJzbG90c1wiLFwic2Vzc2lvbnNcIl1cdUZGMUJcbiAqIGRzaC1iZXR0ZXItc2lkZWJhciBcdTRFQTZcdTU4RjBcdTY2MEUgbG9jYWxlXHVGRjA5XHVGRjFCXHU5NTE5XHU4QkVGXHU1OEYwXHU2NjBFXHU0RjFBXHU4QkE5IGZpYmVyIFx1NkMzOFx1NEU0NSBQRU5ESU5HXHVGRjBDXHU1NDJGXHU1MkE4XHU1QkExXHU4QkExXHU3NkY0XHU2M0E1XHU1MjI0XHU1OTMxXHU4RDI1XHUzMDAyXG4gKi9cbmV4cG9ydCBjb25zdCBpbmplY3QgPSBbJ3Nsb3RzJywgJ3Nlc3Npb25zJywgJ2xvY2FsZScsICdjb25uZWN0aW9uJ107XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpIHtcbiAgLy8gMS4gXHU2NTg3XHU2ODQ4XG4gIGN0eC5lZmZlY3QoKCkgPT4gY3R4LmxvY2FsZS5yZWdpc3RlcihOUywgeyB6aCwgZW4gfSksICdwcm9tcHQtb3B0aW1pemVyOiBsb2NhbGUgcmVnaXN0cmF0aW9uJyk7XG5cbiAgLy8gMi4gXHU5MTREXHU3RjZFXHU5NTVDXHU1MENGXHVGRjFBXHU4MUVBXHU2MzAxIFJQQyBcdTkxNERcdTdGNkVcdUZGMDhzZXJ2ZXIgaGFsZiBcdThCRkJcdTUxOTkgfi8uZHNoL3Byb21wdC1vcHRpbWl6ZXItY29uZmlnLmpzb25cdUZGMENcdTkwMUFcdTkwNTNcbiAgLy8gJy9kc2gtcHJvbXB0LW9wdGltaXplcidcdTIwMTRcdTIwMTRcdTU0MEMgZHNoLXN0aWNreS1ub3RlIFx1NkEyMVx1NUYwRlx1RkYwOVx1MzAwMlx1NEUwRFx1NzUyOCBzZXR0aW5nc1Njb3BlXHVGRjFBXHU2ODRDXHU5NzYyXHU1RTk0XHU3NTI4XHU3Njg0IGhvc3RcbiAgLy8gc2V0dGluZ3MgXHU2Q0U4XHU1MThDXHU4ODY4XHU1QkY5XHU2NzJBXHU2Q0U4XHU1MThDIG5hbWVzcGFjZSBcdThGRDRcdTU2REUgdW5hdmFpbGFibGVcdUZGMENzZXQgXHU5NzU5XHU5RUQ4XHU1OTMxXHU2NTQ4XHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XHUzMDAyXG4gIGxldCBjb25maWdNaXJyb3I6IFByb21wdENvbmZpZyA9IG1lcmdlQ29uZmlnKHVuZGVmaW5lZCk7XG4gIGxldCBjb25maWdFcG9jaCA9IDA7XG4gIGNvbnN0IHJwY0NvbmZpZyA9IGFzeW5jIChlbmRwb2ludDogc3RyaW5nLCBwYXlsb2FkPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBQcm9taXNlPHVua25vd24+ID0+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjdHguY29ubmVjdGlvbi5ycGMuY2FsbCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyJywgZW5kcG9pbnQsIHBheWxvYWQgPz8ge30pO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBjb25maWcgcnBjICR7ZW5kcG9pbnR9IGZhaWxlZDogJHsocmVzdWx0LmVycm9yICYmIChyZXN1bHQuZXJyb3IuZGV0YWlscyB8fCByZXN1bHQuZXJyb3IuY29kZSkpIHx8ICdycGMgZmFpbGVkJ31gLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcbiAgY29uc3QgbG9hZENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBycGNDb25maWcoJ2dldCcpO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcodmFsdWUgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTIxRFx1NkIyMVx1OEZERVx1NjNBNVx1NjcyQVx1NUMzMVx1N0VFQVx1NjVGNlx1NEZERFx1NjMwMVx1OUVEOFx1OEJBNFx1RkYxQlx1NEUwQlx1NkIyMVx1NEZERFx1NUI1OFx1NTQwRVx1OTU1Q1x1NTBDRlx1NTM3M1x1NjZGNFx1NjVCMFxuICAgIH1cbiAgfTtcbiAgdm9pZCBsb2FkQ29uZmlnKCk7XG5cbiAgLy8gMi41IFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1ODlFM1x1Njc5MFx1RkYxQVx1NTE0OFx1NTNENlx1NkZDMFx1NkQzQlx1NEYxQVx1OEJERCBpZFx1RkYwOHNlc3Npb25zLmN1cnJlbnRQcm92aWRlSW5mb1x1RkYwOVx1RkYwQ1xuICAvLyBcdTUxOERcdTY3RTUgc2Vzc2lvbi5tb2RlbHMgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEYyMCBzZXNzaW9uSWQgXHU2NUY2XHU2NzBEXHU1MkExXHU3QUVGXHU1NkRFXHU5MDAwXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHU4MDBDXHU5NzVFXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU1QjlFXHU2RDRCIGJ1Z1x1RkYwOVxuICBjb25zdCBnZXRBY3RpdmVTZXNzaW9uID0gKCk6IHN0cmluZyB8IG51bGwgPT4ge1xuICAgIGNvbnN0IGluZm8gPSAoXG4gICAgICBjdHguc2Vzc2lvbnMgYXMge1xuICAgICAgICBjdXJyZW50UHJvdmlkZUluZm8/OiB7IGdldFNuYXBzaG90PzogKCkgPT4geyBzZXNzaW9uSWQ/OiBzdHJpbmcgfSB9O1xuICAgICAgfSB8IHVuZGVmaW5lZFxuICAgICk/LmN1cnJlbnRQcm92aWRlSW5mbz8uZ2V0U25hcHNob3Q/LigpO1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IGluZm8/LnNlc3Npb25JZDtcbiAgICByZXR1cm4gdHlwZW9mIHNlc3Npb25JZCA9PT0gJ3N0cmluZycgJiYgc2Vzc2lvbklkLmxlbmd0aCA+IDAgPyBzZXNzaW9uSWQgOiBudWxsO1xuICB9O1xuICAvLyAyLjYgXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU0RjFBXHU4QkREXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCICsgc2VydmVyIFx1NTM0QSBsbG0uc3RyZWFtXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHVGRjFBXG4gIC8vIFx1OTAxQVx1OTA1M1x1NTM3M1x1ODFFQVx1NjcwOSBSUENcdUZGMDgvZHNoLXByb21wdC1vcHRpbWl6ZXJcdUZGMDlcdUZGMUJzZXJ2ZXIgaGFsZiBcdTc1MjggYWdlbnREZWZhdWx0TW9kZWwgXHU1M0Q2XHU1RjUzXHU1MjREXG4gIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1MzAwMWxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA4XHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU1REYyXHU5QThDXHU4QkMxXHU3Njg0XHU1QkJGXHU0RTNCXHU2NzBEXHU1MkExXHU5NzYyXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNlc3Npb24uY3JlYXRlL1xuICAvLyBmb3JrXHVGRjFBXHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU4MUVBXHU3RjE2IGlkIFx1ODhBQlx1OTc1OVx1OUVEOFx1NjJEMlx1N0VERCBcdTIxOTIgXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA4XHU1QjlFXHU2RDRCXHVGRjA5XHUzMDAyXG4gIGNvbnN0IGhvc3RScGM6IEhvc3RScGMgPSB7XG4gICAgY2FsbDogKGVuZHBvaW50LCBwYXlsb2FkKSA9PlxuICAgICAgY3R4LmNvbm5lY3Rpb24ucnBjLmNhbGwoJy9kc2gtcHJvbXB0LW9wdGltaXplcicsIGVuZHBvaW50LCBwYXlsb2FkID8/IHt9KSxcbiAgfTtcbiAgY29uc3QgZ2V0SG9zdCA9ICgpOiB7IHJwYzogSG9zdFJwYyB9ID0+ICh7IHJwYzogaG9zdFJwYyB9KTtcbiAgY29uc3QgZ2V0U2Vzc2lvbk1vZGVsID0gYXN5bmMgKCk6IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHdpdGhUaW1lb3V0KFxuICAgICAgICBjdHguY29ubmVjdGlvbi5ycGMuY2FsbCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyJywgJ3Nlc3Npb25Nb2RlbCcsIHt9KSxcbiAgICAgICAgNTAwMCxcbiAgICAgICAgJ3Nlc3Npb25Nb2RlbCcsXG4gICAgICApO1xuICAgICAgaWYgKHJlcy5vayAmJiByZXMudmFsdWUgJiYgdHlwZW9mIHJlcy52YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgY29uc3QgdiA9IHJlcy52YWx1ZSBhcyB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9O1xuICAgICAgICBpZiAodHlwZW9mIHYucHJvdmlkZXIgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2Lm1vZGVsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJldHVybiB7IHByb3ZpZGVyOiB2LnByb3ZpZGVyLCBtb2RlbDogdi5tb2RlbCB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfTtcblxuICAvLyAyLjViIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1NEYxQVx1OEJERFx1N0VEMVx1NUI5QVx1RkYxQVx1NTM2MVx1NzI0N1x1NTNFQVx1NTcyOFx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1NjYzRVx1NzkzQVx1RkYwOFx1NTIwN1x1OEQ3MFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOVxuICBjb25zdCBnZXRTZXNzaW9uSWQgPSAoKTogc3RyaW5nIHwgbnVsbCA9PiBnZXRBY3RpdmVTZXNzaW9uKCk7XG5cbiAgLy8gMy4gXHU4QkVEXHU4QTAwXHU5NTVDXHU1MENGXG4gIGxldCBsYW5nOiBMYW5nID0gbGFuZ09mKGN0eC5sb2NhbGUuZ2V0TG9jYWxlKCkuYWN0aXZlKTtcbiAgY3R4Lm9uKCdsb2NhbGUvY2hhbmdlJywgKHNuYXA6IHsgYWN0aXZlOiBzdHJpbmcgfSkgPT4ge1xuICAgIGxhbmcgPSBsYW5nT2Yoc25hcC5hY3RpdmUpO1xuICB9KTtcblxuICAvLyA0LiBcdTRGMUFcdThCRERcdTY5RkRcdTRGNERcdUZGMUFcdTYzMDlcdTk0QUUgKyBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcbiAgY3R4LmluamVjdChbJ3Nsb3RzJywgJ3Nlc3Npb25zJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWJ1dHRvbicsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICAgICAgICBnZXRIb3N0LFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgb3BlblNldHRpbmdzOiAoKSA9PiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICAgIGdldFNlc3Npb25JZCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUHJldmlld0NhcmQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDYuIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYwOHJvb3QgXHU0RjVDXHU3NTI4XHU1N0RGXHVGRjA5XG4gIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSgpO1xuICBjb25zdCBzYXZlQ29uZmlnID0gYXN5bmMgKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VDb25maWcoeyAuLi5jb25maWdNaXJyb3IsIC4uLnJhdyB9KTtcbiAgICBjb25zdCB3cml0dGVuOiBQcm9tcHRDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiBtZXJnZWQuYmFzZVVybCxcbiAgICAgIGFwaUtleTogbWVyZ2VkLmFwaUtleS50cmltKCksXG4gICAgICBtb2RlbDogbWVyZ2VkLm1vZGVsLFxuICAgICAgdXNlU2Vzc2lvbk1vZGVsOiBtZXJnZWQudXNlU2Vzc2lvbk1vZGVsLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogd3JpdHRlbi5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogd3JpdHRlbi5hcGlLZXksXG4gICAgICAgICAgbW9kZWw6IHdyaXR0ZW4ubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB3cml0dGVuLnVzZVNlc3Npb25Nb2RlbCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZXNldENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHtcbiAgICAgICAgICBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLFxuICAgICAgICAgIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LFxuICAgICAgICAgIG1vZGVsOiBERUZBVUxUUy5tb2RlbCxcbiAgICAgICAgICB1c2VTZXNzaW9uTW9kZWw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcblxuICBjdHguaW5qZWN0KFsnc2xvdHMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItc2V0dGluZ3MnLFxuICAgICAgICAgIG9yZGVyOiAzMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIHN0b3JlOiBzZXR0aW5nc1N0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgc2F2ZUNvbmZpZyxcbiAgICAgICAgICAgIHJlc2V0Q29uZmlnLFxuICAgICAgICAgICAgZ2V0RXBvY2g6ICgpID0+IGNvbmZpZ0Vwb2NoLFxuICAgICAgICAgICAgZ2V0SG9zdFN0YXR1czogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAvLyBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTgxRUFcdTY4QzBcdUZGMUFcdTk2RjZcdTkxNERcdTdGNkVcdTZBMjFcdTVGMEZcdTgwRkRcdTU0MjZcdTRFQ0Ugc2VydmVyIGhhbGYgXHU2MkZGXHU1MjMwXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgd2l0aFRpbWVvdXQoXG4gICAgICAgICAgICAgICAgICBjdHguY29ubmVjdGlvbi5ycGMuY2FsbCgnL2RzaC1wcm9tcHQtb3B0aW1pemVyJywgJ3Nlc3Npb25Nb2RlbCcsIHt9KSxcbiAgICAgICAgICAgICAgICAgIDUwMDAsXG4gICAgICAgICAgICAgICAgICAnc2Vzc2lvbk1vZGVsJyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmIChyZXMub2sgJiYgcmVzLnZhbHVlICYmIHR5cGVvZiByZXMudmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2ID0gcmVzLnZhbHVlIGFzIHsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nIH07XG4gICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHYucHJvdmlkZXIgPT09ICdzdHJpbmcnICYmIHR5cGVvZiB2Lm1vZGVsID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IHRydWUsIHByb3ZpZGVyOiB2LnByb3ZpZGVyLCBtb2RlbDogdi5tb2RlbCB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6IChyZXMuZXJyb3IgJiYgKHJlcy5lcnJvci5kZXRhaWxzID8/IHJlcy5lcnJvci5jb2RlKSkgfHwgJ25vLW1vZGVsJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogKHJlcy5lcnJvciAmJiAocmVzLmVycm9yLmRldGFpbHMgPz8gcmVzLmVycm9yLmNvZGUpKSB8fCAncnBjLWZhaWxlZCcgfTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogZmFsc2UsIGVycm9yOiBTdHJpbmcoKGUgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZSA/PyBlKSB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBTZXR0aW5nc1JvdyxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNy4gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBQWx0K09cdUZGMDhcdTcxMjZcdTcwQjlcdTU3MjggdGV4dGFyZWEgXHU1MTg1XHU2NUY2XHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHVGRjA5XG4gIGNvbnN0IG9uS2V5ZG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKCFlLmFsdEtleSB8fCBlLmNvZGUgIT09ICdLZXlPJykgcmV0dXJuO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTtcbiAgfTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bik7XG59XG5cbi8vIFx1NUYxNVx1NzUyOFx1NUI4OFx1NTM2Qlx1RkYxQVx1OTA3Rlx1NTE0RCB0cmVlLXNoYWtlIFx1NjM4OVx1N0M3Qlx1NTc4Qlx1RkYwOFx1NEVDNVx1NjU4N1x1Njg2M1x1NjAyN1x1RkYxQlx1NjVFMFx1OEZEMFx1ODg0Q1x1NjVGNlx1ODg0Q1x1NEUzQVx1RkYwOVxuZXhwb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH07IiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2ODM4XHU1RkMzXHVGRjFBXHU5MTREXHU3RjZFXHU2ODIxXHU5QThDXHUzMDAxT3BlbkFJIFx1NTE3Q1x1NUJCOVx1OEMwM1x1NzUyOFx1MzAwMVx1N0VEM1x1Njc5Q1x1NjNEMFx1NTNENiBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU5NkY2IERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9tcHRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NzY4NFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4XHU0RTBCXHU2NUI5XHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRTOiBQcm9tcHRDb25maWcgPSB7XG4gIGJhc2VVcmw6ICdodHRwczovL2FwaS5kZWVwc2Vlay5jb20nLFxuICBhcGlLZXk6ICcnLFxuICBtb2RlbDogJ2RlZXBzZWVrLXY0LWZsYXNoJyxcbiAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxufTtcblxuZXhwb3J0IHR5cGUgTGFuZyA9ICd6aCcgfCAnZW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQmFzZVVybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB1cmwudHJpbSgpLnJlcGxhY2UoL1xcLyskLywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VDb25maWcocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbXB0Q29uZmlnIHtcbiAgY29uc3QgYmFzZVVybCA9IHR5cGVvZiByYXc/LmJhc2VVcmwgPT09ICdzdHJpbmcnICYmIHJhdy5iYXNlVXJsLnRyaW0oKSA/IHJhdy5iYXNlVXJsLnRyaW0oKSA6IERFRkFVTFRTLmJhc2VVcmw7XG4gIGNvbnN0IGFwaUtleSA9IHR5cGVvZiByYXc/LmFwaUtleSA9PT0gJ3N0cmluZycgPyByYXcuYXBpS2V5IDogREVGQVVMVFMuYXBpS2V5O1xuICAvLyBcdTY1RTdcdTlFRDhcdThCQTRcdThGQzFcdTc5RkJcdUZGMUFcdTlFRDhcdThCQTQgYmFzZVVybCBcdTRFMEJcdTZCOEJcdTc1NTlcdTc2ODQgZGVlcHNlZWstY2hhdFx1RkYwOHYxIFx1OUVEOFx1OEJBNFx1RkYwOVx1ODlDNlx1NEUzQVx1NjcyQVx1OEJCRVx1N0Y2RVx1RkYwQ1x1ODQzRFx1NTIzMFx1NjVCMFx1OUVEOFx1OEJBNCBkZWVwc2Vlay12NC1mbGFzaFx1RkYxQlxuICAvLyBcdTgxRUFcdTVCOUFcdTRFNDlcdThGQzcgYmFzZVVybFx1RkYwOFx1NjYzRVx1NUYwRlx1OTAwOVx1NjJFOVx1RkYwOVx1NTIxOVx1NEZERFx1NzU1OVx1NTM5Rlx1NkEyMVx1NTc4Qlx1NTQwRFxuICBjb25zdCByYXdNb2RlbCA9IHR5cGVvZiByYXc/Lm1vZGVsID09PSAnc3RyaW5nJyAmJiByYXcubW9kZWwudHJpbSgpID8gcmF3Lm1vZGVsLnRyaW0oKSA6IERFRkFVTFRTLm1vZGVsO1xuICBjb25zdCBtaWdyYXRlZERlZmF1bHQgPVxuICAgIHJhd01vZGVsID09PSAnZGVlcHNlZWstY2hhdCcgJiYgbm9ybWFsaXplQmFzZVVybChiYXNlVXJsKSA9PT0gREVGQVVMVFMuYmFzZVVybCA/IERFRkFVTFRTLm1vZGVsIDogcmF3TW9kZWw7XG4gIGNvbnN0IG1vZGVsID0gbWlncmF0ZWREZWZhdWx0O1xuICBjb25zdCB1c2VTZXNzaW9uTW9kZWwgPSB0eXBlb2YgcmF3Py51c2VTZXNzaW9uTW9kZWwgPT09ICdib29sZWFuJyA/IHJhdy51c2VTZXNzaW9uTW9kZWwgOiBERUZBVUxUUy51c2VTZXNzaW9uTW9kZWw7XG4gIHJldHVybiB7IGJhc2VVcmw6IG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCksIGFwaUtleSwgbW9kZWwsIHVzZVNlc3Npb25Nb2RlbCB9O1xufVxuXG5leHBvcnQgdHlwZSBDb25maWdQcm9ibGVtID0gJ21pc3Npbmcta2V5JyB8ICdtaXNzaW5nLW1vZGVsJyB8ICdiYWQtdXJsJztcbmV4cG9ydCB0eXBlIENvbmZpZ0NoZWNrID0geyBvazogdHJ1ZTsgY29uZmlnOiBQcm9tcHRDb25maWcgfSB8IHsgb2s6IGZhbHNlOyByZWFzb246IENvbmZpZ1Byb2JsZW0gfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQ29uZmlnKGNvbmZpZzogUHJvbXB0Q29uZmlnKTogQ29uZmlnQ2hlY2sge1xuICBpZiAoIWNvbmZpZy5hcGlLZXkudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3Npbmcta2V5JyB9O1xuICAvLyBcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTY1RjZcdTY1RTBcdTk3MDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMUJcdTRFQzVcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTVGMEZcdTg5ODFcdTZDNDIgbW9kZWwgXHU5NzVFXHU3QTdBXG4gIGlmICghY29uZmlnLnVzZVNlc3Npb25Nb2RlbCAmJiAhY29uZmlnLm1vZGVsLnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLW1vZGVsJyB9O1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKG5vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpKTtcbiAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ2JhZC11cmwnIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGNvbmZpZyB9O1xufVxuXG5jb25zdCBaSF9TWVNURU0gPVxuICAnXHU0RjYwXHU2NjJGXHU0RTAwXHU1NDBEIHByb21wdCBcdTRGMThcdTUzMTZcdTRFMTNcdTVCQjZcdTMwMDJcdTc1MjhcdTYyMzdcdTRGMUFcdTdFRDlcdTRGNjBcdTRFMDBcdTZCQjVcdTgzNDlcdTdBM0YgcHJvbXB0XHVGRjBDXHU4QkY3XHU1NzI4XHU0RTBEXHU2NTM5XHU1M0Q4XHU1MTc2XHU2MTBGXHU1NkZFXHU3Njg0XHU1MjREXHU2M0QwXHU0RTBCXHU1QzA2XHU1MTc2XHU2NTM5XHU1MTk5XHU0RTNBXHU2NkY0XHU2RTA1XHU2NjcwXHUzMDAxXHU2NkY0XHU3RUQzXHU2Nzg0XHU1MzE2XHU3Njg0XHU5QUQ4XHU4RDI4XHU5MUNGIHByb21wdFx1RkYxQScgK1xuICAnXHU4ODY1XHU1MTQ1XHU3RjNBXHU1OTMxXHU3Njg0XHU3NkVFXHU2ODA3XHUzMDAxXHU3RUE2XHU2NzVGXHU0RTBFXHU2NzFGXHU2NzFCXHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHVGRjA4XHU1M0VGXHU0RUNFXHU0RTBBXHU0RTBCXHU2NTg3XHU1NDA4XHU3NDA2XHU2M0E4XHU2NUFEXHVGRjA5XHVGRjBDXHU0RjdGXHU3NTI4XHU3QjgwXHU2RDAxXHU2NjBFXHU3ODZFXHU3Njg0XHU4QkVEXHU4QTAwXHVGRjBDXHU1M0JCXHU2Mzg5XHU1MTk3XHU0RjU5XHUzMDAyJyArXG4gICdcdTRFMERcdTVGOTdcdTdGMTZcdTkwMjBcdTgzNDlcdTdBM0ZcdTRFMkRcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTRFOEJcdTVCOUVcdTYyMTZcdTYyODBcdTY3MkZcdTdFQzZcdTgyODJcdTMwMDJcdTUzRUFcdThGOTNcdTUxRkFcdTRGMThcdTUzMTZcdTU0MEVcdTc2ODQgcHJvbXB0IFx1NkI2M1x1NjU4N1x1RkYwQ1x1NEUwRFx1ODk4MVx1NEVGQlx1NEY1NVx1ODlFM1x1OTFDQVx1MzAwMVx1NTI0RFx1N0YwMFx1NjIxNlx1NEVFM1x1NzgwMVx1NTc1N1x1NTMwNVx1ODhGOVx1MzAwMic7XG5cbmNvbnN0IEVOX1NZU1RFTSA9XG4gICdZb3UgYXJlIGEgcHJvbXB0IG9wdGltaXphdGlvbiBleHBlcnQuIFJld3JpdGUgdGhlIHVzZXJcXCdzIGRyYWZ0IHByb21wdCBpbnRvIGEgY2xlYXJlciwgbW9yZSBzdHJ1Y3R1cmVkLCBoaWdoLXF1YWxpdHkgcHJvbXB0ICcgK1xuICAnd2l0aG91dCBjaGFuZ2luZyBpdHMgaW50ZW50OiBmaWxsIGluIG1pc3NpbmcgZ29hbHMsIGNvbnN0cmFpbnRzLCBhbmQgZXhwZWN0ZWQgb3V0cHV0IGZvcm1hdCB3aGVuIHJlYXNvbmFibHkgaW5mZXJhYmxlLCAnICtcbiAgJ3VzZSBjb25jaXNlIGFuZCBwcmVjaXNlIGxhbmd1YWdlLCBhbmQgcmVtb3ZlIHJlZHVuZGFuY3kuIERvIG5vdCBpbnZlbnQgZmFjdHMgb3IgdGVjaG5pY2FsIGRldGFpbHMgYWJzZW50IGZyb20gdGhlIGRyYWZ0LiAnICtcbiAgJ091dHB1dCBPTkxZIHRoZSBvcHRpbWl6ZWQgcHJvbXB0IHRleHQsIHdpdGggbm8gZXhwbGFuYXRpb25zLCBwcmVmaXhlcywgb3IgY29kZSBmZW5jZXMuJztcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmc6IExhbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbGFuZyA9PT0gJ3poJyA/IFpIX1NZU1RFTSA6IEVOX1NZU1RFTTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnOiBQcm9tcHRDb25maWcsIHRleHQ6IHN0cmluZywgbGFuZzogTGFuZywgc3RyZWFtID0gZmFsc2UpOiBvYmplY3Qge1xuICByZXR1cm4ge1xuICAgIG1vZGVsOiBjb25maWcubW9kZWwsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgIHsgcm9sZTogJ3N5c3RlbScsIGNvbnRlbnQ6IGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmcpIH0sXG4gICAgICB7IHJvbGU6ICd1c2VyJywgY29udGVudDogdGV4dCB9LFxuICAgIF0sXG4gICAgdGVtcGVyYXR1cmU6IDAuNyxcbiAgICBtYXhfdG9rZW5zOiAyMDQ4LFxuICAgIHN0cmVhbSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSZXN1bHQocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcyA9IHJhdy50cmltKCk7XG4gIGNvbnN0IGZlbmNlID0gL15gYGBbYS16QS1aMC05XystXSpcXG4oW1xcc1xcU10qPylcXG4/YGBgJC87XG4gIGNvbnN0IG1hdGNoZWQgPSBzLm1hdGNoKGZlbmNlKTtcbiAgaWYgKG1hdGNoZWQpIHMgPSBtYXRjaGVkWzFdLnRyaW0oKTtcbiAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5UcmlnZ2VyKGRyYWZ0OiBzdHJpbmcsIGJ1c3k6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuICFidXN5ICYmIGRyYWZ0LnRyaW0oKS5sZW5ndGggPiAwO1xufVxuXG5leHBvcnQgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCA9XG4gIHwgJ2NvbmZpZydcbiAgfCAndW5hdXRob3JpemVkJ1xuICB8ICdmb3JiaWRkZW4nXG4gIHwgJ2h0dHAnXG4gIHwgJ3RpbWVvdXQnXG4gIHwgJ25ldHdvcmsnXG4gIHwgJ2NvcnMnXG4gIHwgJ2JhZC1yZXNwb25zZSdcbiAgfCAnZW1wdHknO1xuXG5leHBvcnQgY2xhc3MgT3B0aW1pemVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ09wdGltaXplRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVRfTVMgPSA2MF8wMDA7XG5cbmZ1bmN0aW9uIGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQ6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgbWVzc2FnZT86IHsgY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBjb250ZW50ID0gZmlyc3Q/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycgPyBjb250ZW50IDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JLaW5kKGU6IHVua25vd24pOiBPcHRpbWl6ZUVycm9yIHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBPcHRpbWl6ZUVycm9yKSByZXR1cm4gZTtcbiAgY29uc3QgaXNBYm9ydCA9XG4gICAgKHR5cGVvZiBET01FeGNlcHRpb24gIT09ICd1bmRlZmluZWQnICYmIGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiAoZSBhcyBFcnJvcikubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgaWYgKGlzQWJvcnQpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcigndGltZW91dCcsICdyZXF1ZXN0IGFib3J0ZWQnKTtcbiAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICBjb25zdCBtID0gU3RyaW5nKGUubWVzc2FnZSA/PyAnJyk7XG4gICAgLy8gXHU1QzNEXHU1MjlCXHU4MDBDXHU0RTNBXHVGRjFBQ2hyb21pdW0gXHU3Njg0IENPUlMgXHU1OTMxXHU4RDI1XHU5MDFBXHU1RTM4XHU2NjJGIFR5cGVFcnJvcihcIkZhaWxlZCB0byBmZXRjaFwiKVx1RkYwOFx1NjVFMCBjb3JzIFx1NUI1N1x1NjgzN1x1RkYwOVx1RkYwQ1x1NEYxQVx1ODQzRFx1NTIzMCBuZXR3b3JrXHVGRjFCXHU2QjY0XHU1MjA2XHU2NTJGXHU0RUM1XHU2MzU1XHU4M0I3XHU4MUVBXHU1RTI2IENPUlMgXHU1QjU3XHU2ODM3XHU3Njg0XHU5NTE5XHU4QkVGXHUzMDAyXG4gICAgaWYgKC9jb3JzL2kudGVzdChtKSkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCdjb3JzJywgbSk7XG4gICAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgbSB8fCAnbmV0d29yayBlcnJvcicpO1xuICB9XG4gIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIFN0cmluZygoZSBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemUob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsIH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcblxuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdpbnZhbGlkIEpTT04nKTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZCk7XG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBleHRyYWN0UmVzdWx0KGNvbnRlbnQpO1xufVxuXG4vKipcbiAqIFNTRSBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUFcdTUxODVcdTVCQjlcdTYyMTZcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdTc2ODRcdTRFMDBcdTZCQjVcdTY1ODdcdTY3MkNcdTMwMDJcbiAqIHY0IFx1N0NGQlx1NkEyMVx1NTc4Qlx1RkYwOHY0LWZsYXNoIFx1N0I0OVx1RkYwOVx1NkQ0MVx1NUYwRlx1NTE0OFx1OEY5M1x1NTFGQVx1OTU3Rlx1NkJCNSByZWFzb25pbmdfY29udGVudFx1RkYwOFx1NjNBOFx1NzQwNlx1OEZDN1x1N0EwQlx1RkYwOVx1RkYwQ1x1OTY4Rlx1NTQwRVx1NjI0RFx1OEY5M1x1NTFGQVxuICogY29udGVudCBcdTZCNjNcdTY1ODdcdTIwMTRcdTIwMTRcdTRFMjRcdTgwMDVcdTkwRkRcdTg5ODFcdTVCOUVcdTY1RjZcdTU0NDhcdTczQjBcdUZGMENcdTU0MjZcdTUyMTlcdTYzQThcdTc0MDZcdTY3MUZcdTUzNjFcdTcyNDdcdTc3MEJcdThENzdcdTY3NjVcdTUwQ0ZcdTMwMENcdTk3NUVcdTZENDFcdTVGMEZcdTMwMERcdUZGMDhcdTVCOUVcdTZENEIgfjgwIFx1NEUyQSBjaHVua1xuICogXHU1MTY4XHU2NjJGIHJlYXNvbmluZ1x1RkYwQ1x1NkI2M1x1NjU4N1x1NjcwMFx1NTQwRVx1NjI0RFx1NTFGQVx1NzNCMFx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgdHlwZSBTc2VEZWx0YSA9XG4gIHwgeyBraW5kOiAnY29udGVudCc7IHRleHQ6IHN0cmluZyB9XG4gIHwgeyBraW5kOiAncmVhc29uaW5nJzsgdGV4dDogc3RyaW5nIH07XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwXHU0RTAwXHU4ODRDIFNTRSBcdTY1NzBcdTYzNkVcdUZGMUEoZGF0YTogey4uLn0pIFx1MjE5MiBcdTU4OUVcdTkxQ0ZcdTRFOEJcdTRFRjZcdUZGMUJcbiAqIFtET05FXS9cdTk3NUUgZGF0YSBcdTg4NEMvXHU5NzVFIEpTT04vXHU2NUUwXHU1MTg1XHU1QkI5IGRlbHRhIFx1MjE5MiBudWxsXHUzMDAyXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHUzMDAyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3NlRGVsdGEobGluZTogc3RyaW5nKTogU3NlRGVsdGEgfCBudWxsIHtcbiAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICBpZiAoIXRyaW1tZWQuc3RhcnRzV2l0aCgnZGF0YTonKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGRhdGEgPSB0cmltbWVkLnNsaWNlKCdkYXRhOicubGVuZ3RoKS50cmltKCk7XG4gIGlmIChkYXRhID09PSAnW0RPTkVdJykgcmV0dXJuIG51bGw7XG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBkZWx0YT86IHsgY29udGVudD86IHVua25vd247IHJlYXNvbmluZ19jb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGRlbHRhID0gZmlyc3Q/LmRlbHRhO1xuICBpZiAodHlwZW9mIGRlbHRhPy5jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ2NvbnRlbnQnLCB0ZXh0OiBkZWx0YS5jb250ZW50IH07XG4gIGlmICh0eXBlb2YgZGVsdGE/LnJlYXNvbmluZ19jb250ZW50ID09PSAnc3RyaW5nJykgcmV0dXJuIHsga2luZDogJ3JlYXNvbmluZycsIHRleHQ6IGRlbHRhLnJlYXNvbmluZ19jb250ZW50IH07XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1RkYxQVx1OTAxMFx1NTc1N1x1ODlFM1x1Njc5MCBTU0VcdUZGMENcdThGQjlcdTY1MzZcdThGQjlcdTU2REVcdThDMDMgb25UZXh0KGRlbHRhKVx1RkYxQlx1OEZENFx1NTZERVx1NUI4Q1x1NjU3NFx1NkI2M1x1NjU4N1x1MzAwMlxuICogXHU3NkY4XHU2QkQ0XHU5NzVFXHU2RDQxXHU1RjBGIG9wdGltaXplKClcdUZGMUFcdTk5OTZcdTVCNTdcdTY2RjRcdTVGRUJcdTMwMDFcdTk1N0ZcdThGOTNcdTUxRkFcdTRFMERcdTk3MDBcdTg5ODFcdTdCNDlcdTVCOENcdTY1NzRcdTc1MUZcdTYyMTBcdTIwMTRcdTIwMTRcdTYzMDlcdTk0QUUvXHU1MzYxXHU3MjQ3XHU4MEZEXHU4RkI5XHU3NTFGXHU2MjEwXHU4RkI5XHU2NjNFXHU3OTNBXHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZVN0cmVhbShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBvbkV2ZW50PzogKGRlbHRhOiBTc2VEZWx0YSkgPT4gdm9pZDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsLCBvbkV2ZW50IH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcsIHRydWUpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgaWYgKCFyZXMuYm9keSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdtaXNzaW5nIHJlc3BvbnNlIGJvZHknKTtcblxuICBjb25zdCByZWFkZXIgPSByZXMuYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuICBsZXQgYnVmZmVyID0gJyc7XG4gIGxldCBmdWxsID0gJyc7XG4gIHRyeSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICBpZiAoZG9uZSkgYnJlYWs7XG4gICAgICBidWZmZXIgKz0gZGVjb2Rlci5kZWNvZGUodmFsdWUsIHsgc3RyZWFtOiB0cnVlIH0pO1xuICAgICAgY29uc3QgbGluZXMgPSBidWZmZXIuc3BsaXQoJ1xcbicpO1xuICAgICAgYnVmZmVyID0gbGluZXMucG9wKCkgPz8gJyc7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEobGluZSk7XG4gICAgICAgIGlmIChkZWx0YSAhPT0gbnVsbCkge1xuICAgICAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHRyeSB7XG4gICAgICByZWFkZXIucmVsZWFzZUxvY2soKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NURGMlx1NEUyRFx1NkI2Mi9cdTkxQ0FcdTY1M0VcdTY1RjZcdTVGRkRcdTc1NjVcbiAgICB9XG4gIH1cbiAgLy8gXHU1QzNFXHU4ODRDXHVGRjA4XHU2NUUwXHU2MzYyXHU4ODRDXHU3RUQzXHU1QzNFXHU3Njg0IGRhdGEgXHU4ODRDXHVGRjA5XG4gIGlmIChidWZmZXIudHJpbSgpKSB7XG4gICAgY29uc3QgZGVsdGEgPSBleHRyYWN0U3NlRGVsdGEoYnVmZmVyKTtcbiAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgIG9uRXZlbnQ/LihkZWx0YSk7XG4gICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSBmdWxsICs9IGRlbHRhLnRleHQ7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RSZXN1bHQoZnVsbCk7XG4gIGlmICghY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1MzAwQ1x1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1MzAwRFx1RkYxQVx1OEMwMyBjb25uZWN0aW9uIFx1NzY4NCBzZXNzaW9uLm1vZGVscyBSUENcdUZGMENcdTUzRDYgY3VycmVudC5tb2RlbFx1MzAwMlxuICogYXBpIFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwOFx1NEUwRSBEU0ggXHU4OUUzXHU4MDI2XHU0RkJGXHU0RThFXHU1MzU1XHU2RDRCXHVGRjA5XHVGRjFCXHU0RUZCXHU0RjU1XHU1OTMxXHU4RDI1XHU4RkQ0XHU1NkRFIG51bGxcdUZGMDhcdTc1MzFcdThDMDNcdTc1MjhcdTY1QjlcdTU2REVcdTkwMDBcdTgxRUFcdTVCOUFcdTRFNDkgbW9kZWxcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVTZXNzaW9uTW9kZWwoXG4gIGFwaTpcbiAgICB8IHtcbiAgICAgICAgc2Vzc2lvbnM/OiB7XG4gICAgICAgICAgbW9kZWxzPzogKHBheWxvYWQ/OiB1bmtub3duLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkgPT4gUHJvbWlzZTx7IGN1cnJlbnQ/OiB7IG1vZGVsPzogc3RyaW5nIH0gfSB8IG51bGw+O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIHwgdW5kZWZpbmVkLFxuICBwYXlsb2FkOiB1bmtub3duID0ge30sXG4gIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgLy8gXHU1RkM1XHU5ODdCXHU2NDNBXHU1RTI2IHNlc3Npb25JZFx1RkYxQXNlcnZlciBcdTdBRUZcdTYzMDkgcmVxdWVzdC5wYXlsb2FkLnNlc3Npb25JZCBcdTY3RTVcdThCRTVcdTRGMUFcdThCRERcdTVERjJcdTkwMDlcdTYyRTlcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMENcbiAgICAvLyBcdTdGM0FcdTU5MzFcdTY1RjZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdUZGMDhkZWVwc2Vlay12NC1mbGFzaFx1RkYwOVx1ODAwQ1x1OTc1RVx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGFwaT8uc2Vzc2lvbnM/Lm1vZGVscz8uKHBheWxvYWQsIHNpZ25hbCk7XG4gICAgY29uc3QgbSA9IHJlcz8uY3VycmVudD8ubW9kZWw7XG4gICAgcmV0dXJuIHR5cGVvZiBtID09PSAnc3RyaW5nJyAmJiBtLnRyaW0oKSA/IG0udHJpbSgpIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjNEMlx1NEVGNlx1NjU4N1x1Njg0OCBcdTIwMTQgXHU0RTJEXHU4MkYxXHU1M0NDXHU4QkVEICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuZXhwb3J0IGNvbnN0IE5TID0gJ3Byb21wdF9vcHRpbWl6ZXInO1xuXG5leHBvcnQgY29uc3QgemggPSB7XG4gICdidXR0b24uYXJpYSc6ICdcdTRGMThcdTUzMTYgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnXHU0RjE4XHU1MzE2XHU3RUQzXHU2NzlDJyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdcdTY2RkZcdTYzNjJcdTgzNDlcdTdBM0YnLFxuICAnY2FyZC5jb3B5JzogJ1x1NTkwRFx1NTIzNicsXG4gICdjYXJkLmNvcHlEb25lJzogJ1x1NURGMlx1NTkwRFx1NTIzNicsXG4gICdjYXJkLnJldHJ5JzogJ1x1OTFDRFx1NjVCMFx1NEYxOFx1NTMxNicsXG4gICdjYXJkLmRpc21pc3MnOiAnXHU2NTNFXHU1RjAzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnXHU1REYyXHU5MTREXHU3RjZFIFx1MDBCNyBcdTZBMjFcdTU3OEIge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ1x1NjcyQVx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUudGl0bGUnOiAnXHU4QkY3XHU1MTQ4XHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS5kZXNjJzogJ1x1NTI0RFx1NUY4MCBcdThCQkVcdTdGNkUgXHUyMTkyIFx1OTAxQVx1NzUyOFx1OEJCRVx1N0Y2RSBcdTIxOTIgUHJvbXB0IFx1NEYxOFx1NTMxNlx1RkYwQ1x1NTg2Qlx1NTE5OVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MFx1MzAwMUFQSSBLZXkgXHU0RTBFXHU2QTIxXHU1NzhCXHU1NDBEXHUzMDAyJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdcdTUzQkJcdThCQkVcdTdGNkUnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdcdTc3RTVcdTkwNTNcdTRFODYnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBLZXkgXHU2NUUwXHU2NTQ4XHU2MjE2XHU1REYyXHU4RkM3XHU2NzFGJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdcdTY3MERcdTUyQTFcdTYyRDJcdTdFRERcdThCQkZcdTk1RUVcdUZGMDg0MDNcdUZGMDknLFxuICAnZXJyb3IudGltZW91dCc6ICdcdThCRjdcdTZDNDJcdThEODVcdTY1RjZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IubmV0d29yayc6ICdcdTdGNTFcdTdFRENcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdTRFMEVcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnZXJyb3IuY29ycyc6ICdcdTYzQTVcdTUzRTNcdTRFMERcdTY1MkZcdTYzMDFcdThERThcdTU3REZcdUZGMENcdThCRjdcdTYzNjJcdTc1MjhcdTY1MkZcdTYzMDEgQ09SUyBcdTc2ODRcdTdGNTFcdTUxNzMnLFxuICAnZXJyb3IuaHR0cCc6ICdcdThCRjdcdTZDNDJcdTU5MzFcdThEMjVcdUZGMDhIVFRQIFx1OTUxOVx1OEJFRlx1RkYwOScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU2ODNDXHU1RjBGXHU1RjAyXHU1RTM4JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NEUzQVx1N0E3QVx1RkYwQ1x1OEJGN1x1OTFDRFx1OEJENScsXG4gICdlcnJvci5jb25maWcnOiAnXHU5MTREXHU3RjZFXHU0RTBEXHU1QjhDXHU2NTc0XHVGRjBDXHU4QkY3XHU1MjMwXHU4QkJFXHU3RjZFXHU0RTJEXHU2OEMwXHU2N0U1JyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBcdTRGMThcdTUzMTYnLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdcdTkxNERcdTdGNkVcdTZEQTZcdTgyNzJcdTYzQTVcdTUzRTNcdUZGMDhPcGVuQUkgXHU1MTdDXHU1QkI5XHVGRjA5XHVGRjFCS2V5IFx1NjYwRVx1NjU4N1x1NEZERFx1NUI1OFx1NTcyOFx1NjcyQ1x1NTczMCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ1x1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1x1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1x1NUYwMFx1NTQyRlx1NjVGNlx1NEYxOFx1NTMxNlx1OEJGN1x1NkM0Mlx1OERERlx1OTY4Rlx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQlx1NTE3M1x1OTVFRFx1NTQwRVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJzogJ1x1NURGMlx1OTAwOVx1NjJFOVx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QicsXG4gICdzZXR0aW5ncy5ob3N0UHJvYmUnOiAnXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU2M0EyXHU2RDRCXHU0RTJEXHUyMDI2JyxcbiAgJ3NldHRpbmdzLmhvc3RPayc6ICdcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTkwMUFcdTkwNTMgXHUyNzEzJyxcbiAgJ3NldHRpbmdzLmhvc3RGYWlsJzogJ1x1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1OTAxQVx1OTA1M1x1NEUwRFx1NTNFRlx1NzUyOFx1RkYxQScsXG5cbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdcdTRGRERcdTVCNThcdTU5MzFcdThEMjUnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnXHU5MUNEXHU3RjZFXHU1OTMxXHU4RDI1JyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgY29uc3QgZW46IExvY2FsZURpY3QgPSB7XG4gICdidXR0b24uYXJpYSc6ICdPcHRpbWl6ZSBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdPcHRpbWl6ZWQgcHJvbXB0JyxcbiAgJ2NhcmQucmVwbGFjZSc6ICdVc2UgZHJhZnQnLFxuICAnY2FyZC5jb3B5JzogJ0NvcHknLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdDb3BpZWQnLFxuICAnY2FyZC5yZXRyeSc6ICdSZXRyeScsXG4gICdjYXJkLmRpc21pc3MnOiAnRGlzbWlzcycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnT3B0aW1pemluZ1x1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdDb25maWd1cmVkIFx1MDBCNyBtb2RlbCB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnTm8gQVBJIGNvbmZpZ3VyZWQnLFxuICAnZ3VpZGUudGl0bGUnOiAnQ29uZmlndXJlIHRoZSBBUEkgZmlyc3QnLFxuICAnZ3VpZGUuZGVzYyc6ICdHbyB0byBTZXR0aW5ncyBcdTIxOTIgR2VuZXJhbCBcdTIxOTIgUHJvbXB0IE9wdGltaXplciBhbmQgZmlsbCBpbiB0aGUgZW5kcG9pbnQsIEFQSSBrZXksIGFuZCBtb2RlbC4nLFxuICAnZ3VpZGUuYWN0aW9uJzogJ0dvIHRvIHNldHRpbmdzJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnR290IGl0JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkga2V5IGlzIGludmFsaWQgb3IgZXhwaXJlZCcsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnQWNjZXNzIGZvcmJpZGRlbiAoNDAzKScsXG4gICdlcnJvci50aW1lb3V0JzogJ1JlcXVlc3QgdGltZWQgb3V0OyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnTmV0d29yayBlcnJvcjsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5jb3JzJzogJ0VuZHBvaW50IGJsb2NrcyBDT1JTOyB1c2UgYSBnYXRld2F5IHRoYXQgYWxsb3dzIGl0JyxcbiAgJ2Vycm9yLmh0dHAnOiAnUmVxdWVzdCBmYWlsZWQgKEhUVFAgZXJyb3IpJyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdVbmV4cGVjdGVkIHJlc3BvbnNlIGZvcm1hdCcsXG4gICdlcnJvci5lbXB0eSc6ICdFbXB0eSByZXN1bHQ7IHBsZWFzZSByZXRyeScsXG4gICdlcnJvci5jb25maWcnOiAnSW5jb21wbGV0ZSBjb25maWd1cmF0aW9uOyBjaGVjayBzZXR0aW5ncycsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgT3B0aW1pemVyJyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnQ29uZmlndXJlIHRoZSByZXdyaXRlIGVuZHBvaW50IChPcGVuQUktY29tcGF0aWJsZSk7IGtleSBpcyBzdG9yZWQgbG9jYWxseSBpbiBwbGFpbiB0ZXh0JyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnQmFzZSBVUkwnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnTW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJzogJ1VzZSBjdXJyZW50IHNlc3Npb24gbW9kZWwnLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdXaGVuIG9uLCBvcHRpbWl6YXRpb24gcmVxdWVzdHMgZm9sbG93IHRoZSBzZXNzaW9uIG1vZGVsOyB3aGVuIG9mZiwgdGhlIGN1c3RvbSBtb2RlbCBiZWxvdyBpcyB1c2VkJyxcbiAgJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnOiAnU2Vzc2lvbiBkZWZhdWx0IG1vZGVsIHNlbGVjdGVkJyxcbiAgJ3NldHRpbmdzLmhvc3RQcm9iZSc6ICdwcm9iaW5nIGhvc3QgY2hhbm5lbFx1MjAyNicsXG4gICdzZXR0aW5ncy5ob3N0T2snOiAnc2Vzc2lvbiBtb2RlbCBjaGFubmVsIFx1MjcxMycsXG4gICdzZXR0aW5ncy5ob3N0RmFpbCc6ICdzZXNzaW9uIG1vZGVsIGNoYW5uZWwgdW5hdmFpbGFibGU6ICcsXG5cbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgZ2V0SG9zdD86ICgpID0+IHsgcnBjOiB7IGNhbGw6IChlOiBzdHJpbmcsIHA/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTx7IG9rOiBib29sZWFuOyB2YWx1ZT86IHVua25vd247IGVycm9yPzogeyBjb2RlPzogc3RyaW5nIH0gfT4gfSB9IHwgbnVsbDtcbiAgZ2V0U2Vzc2lvbklkPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2J1dHRvbi5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAycHggNnB4O1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAxO1xuICBvcGFjaXR5OiAwLjg1O1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG59XG4uZHNoLXBvLWJ0bjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG4gIG9wYWNpdHk6IDE7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjEyKSk7XG59XG4uZHNoLXBvLWJ0bjpkaXNhYmxlZCB7XG4gIG9wYWNpdHk6IDAuMzU7XG4gIGN1cnNvcjogZGVmYXVsdDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKipcbiAqIFx1OEJGQlx1NTNENlx1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYxQVx1NEYxOFx1NTE0OFx1NTNENlx1NzEyNlx1NzBCOSB0ZXh0YXJlYVx1RkYxQlx1NTQyNlx1NTIxOVx1NTZERVx1OTAwMFx1NTIzMFx1OTg3NVx1OTc2Mlx1NEUyRFx1MzAwQ1x1NTAzQ1x1OTc1RVx1N0E3QVx1MzAwRFx1NzY4NCB0ZXh0YXJlYVxuICogXHVGRjA4XHU3NTI4XHU2MjM3XHU1NzI4XHU4RjkzXHU1MTY1XHU3Njg0XHU1MzczXHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjA5XHUzMDAyXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREXHU2ODA3XHU1MUM2IGtpdCBcdTc2ODQgaW5wdXQgaG9va1x1MjAxNFx1MjAxNFx1NUI5RVx1NkQ0QlxuICogaW5wdXQucmlnaHQgXHU2RTMyXHU2N0QzXHU2NUY2XHU4QkU1XHU2ODA3XHU1MUM2IHByb3BzIFx1NjcyQVx1NjNEMFx1NEY5Qlx1RkYwQ1x1N0VDNFx1NEVGNlx1NEYxQVx1NTZFMFx1OEMwM1x1NzUyOCB1bmRlZmluZWQgaG9va1xuICogXHU1RDI5XHU2RTgzXHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHVGRjA4UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOCBcdTRFMERcdTUzRUZcdTg5QzFcdUZGMDlcdTMwMDJcbiAqL1xuZnVuY3Rpb24gcmVhZERyYWZ0KCk6IHN0cmluZyB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSByZXR1cm4gYWN0aXZlLnZhbHVlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICh0YS52YWx1ZS50cmltKCkpIHJldHVybiB0YS52YWx1ZTtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBPcHRpbWl6ZUJ1dHRvbihwcm9wczogT3B0aW1pemVCdXR0b25Qcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0LCBnZXRTZXNzaW9uSWQgfSA9IHByb3BzO1xuXG4gIC8vIFx1N0U0MVx1NUZEOVx1NjAwMVx1RkYxQVx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVx1RkYxQlxuICAvLyBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTdFRDFcdTVCOUFcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTIwMTRcdTIwMTRcdTUyMDdcdTUyMzBcdTUyMkJcdTc2ODRcdTRGMUFcdThCRERcdTY1RjZcdTYzMDlcdTk0QUVcdTRFMERcdTUxOEQgYnVzeVx1RkYwOFx1NTQwNFx1NEYxQVx1OEJERFx1NTNFRlx1NzJFQ1x1N0FDQlx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1RkYwOVxuICBjb25zdCBidXN5Rm9yID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0ID0gZ2V0UHJldmlld0J1c1N0YXRlKCk7XG4gICAgaWYgKHN0LnN0YXR1cyAhPT0gJ29wdGltaXppbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3Qgc2lkID0gZ2V0U2Vzc2lvbklkPy4oKTtcbiAgICByZXR1cm4gc3Quc2Vzc2lvbklkID09PSBudWxsIHx8IHN0LnNlc3Npb25JZCA9PT0gc2lkO1xuICB9O1xuICBjb25zdCBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZShidXN5Rm9yKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0QnVzeShidXN5Rm9yKCkpKSxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gICAgW10sXG4gICk7XG5cbiAgLy8gbW91c2Vkb3duIFx1OTg4NFx1OEJGQlx1ODM0OVx1N0EzRlx1RkYxQVx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVx1NzdBQ1x1OTVGNFx1NzEyNlx1NzBCOVx1NEYxQVx1NTIwN1x1NTIzMFx1NjMwOVx1OTRBRVx1RkYwOGFjdGl2ZUVsZW1lbnQgXHU0RTBEXHU1MThEXHU2NjJGIHRleHRhcmVhXHVGRjA5XHVGRjBDXG4gIC8vIFx1NEY0NiBtb3VzZWRvd24gXHU2NUU5XHU0RThFXHU3MTI2XHU3MEI5XHU1MjA3XHU2MzYyXHUyMDE0XHUyMDE0XHU2QjY0XHU1MjNCXHU4QkZCXHU1MjMwXHU3Njg0IGFjdGl2ZUVsZW1lbnQgXHU0RUNEXHU2NjJGXHU4RjkzXHU1MTY1XHU2ODQ2XHUzMDAyXG4gIGNvbnN0IGRyYWZ0UmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3Qgc3luY0RyYWZ0ID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRyYWZ0UmVmLmN1cnJlbnQgPSByZWFkRHJhZnQoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChidXN5KSByZXR1cm47XG4gICAgY29uc3QgZHJhZnQgPSBkcmFmdFJlZi5jdXJyZW50IHx8IHJlYWREcmFmdCgpO1xuICAgIGlmICghZHJhZnQudHJpbSgpKSByZXR1cm47XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IGRyYWZ0LFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgZ2V0SG9zdCxcbiAgICAgIGdldFNlc3Npb25JZCxcbiAgICB9KTtcbiAgfSwgW2J1c3ksIGdldENvbmZpZywgZ2V0TGFuZ10pO1xuXG4gIC8vIEFsdCtPIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYwOGluZGV4LnRzIFx1NTE2OFx1NUM0MFx1NzZEMVx1NTQyQ1x1RkYwOVx1MjE5MiBcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3B0aW1pemVSZXF1ZXN0KGhhbmRsZUNsaWNrKSwgW2hhbmRsZUNsaWNrXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgYXJpYS1sYWJlbD17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIHRpdGxlPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgZGlzYWJsZWQ9e2J1c3l9XG4gICAgICBkYXRhLWJ1c3k9e2J1c3l9XG4gICAgICBvbk1vdXNlRG93bj17c3luY0RyYWZ0fVxuICAgICAgb25Gb2N1cz17c3luY0RyYWZ0fVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgPlxuICAgICAge2J1c3kgPyAnXHUyM0YzJyA6ICdcdTI3MjgnfVxuICAgIDwvYnV0dG9uPlxuICApO1xufSIsICIvKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NEYxOFx1NTMxNlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYxQXNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCArIGxsbS5zdHJlYW0gXHU3NzFGXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKlxuICogXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU2Q0ExXHU2NzA5XHUzMDBDXHU0RTAwXHU2QjIxXHU2MDI3XHU3NTFGXHU2MjEwXHU2MkZGXHU3RUQzXHU2NzlDXHUzMDBEXHU3Njg0IFJQQ1x1RkYwQ1x1NEU1Rlx1NEUwRFx1OEJFNVx1NzUyOCBzZXNzaW9uLmNyZWF0ZS9mb3JrIFx1NTIxQlx1NUVGQVx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFxuICogXHVGRjA4XHU1NDBFXHU1M0YwXHU0RjFBXHU4QkREXHU0RTBEXHU1NzI4XHU1MjREXHU1M0YwXHU0RTBEXHU4OUU2XHU1M0QxXHU2QTIxXHU1NzhCXHU2MjY3XHU4ODRDXHVGRjBDXHU1QjlFXHU2RDRCXHUzMDBDXHU2QzM4XHU4RkRDXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUzMDBEXHVGRjA5XHUzMDAyXHU2QjYzXHU4OUUzXHU1M0Q2XHU4MUVBIGRzaC1lbGYgXHU3Njg0XHU1QkJGXHU0RTNCXG4gKiBcdTY3MERcdTUyQTFcdTk3NjJcdUZGMUFzZXJ2ZXIgaGFsZlx1RkYwOGxpYi9pbmRleC5qc1x1RkYwOVx1NjMwMVx1NjcwOSBsbG0gXHU0RTBFIGFnZW50RGVmYXVsdE1vZGVsIFx1NjcwRFx1NTJBMVx1MjAxNFx1MjAxNFxuICogICBzZXNzaW9uTW9kZWwgICAgIFx1MjE5MiBcdTVGNTNcdTUyNERcdTRGMUFcdThCREQvYWdlbnQgXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHVGRjA4cHJvdmlkZXIgKyBtb2RlbFx1RkYwOVxuICogICBvcHRpbWl6ZS5zdGFydCAgIFx1MjE5MiBsbG0uc3RyZWFtIFx1NTQwRVx1NTNGMFx1NkQ0MVx1NUYwRlx1RkYwQ1x1NTg5RVx1OTFDRlx1N0QyRlx1NzlFRlx1NTIzMFx1NEVGQlx1NTJBMVxuICogICBvcHRpbWl6ZS5wb2xsICAgIFx1MjE5MiBcdTUzRDYgeyBkb25lLCB0ZXh0IH1cdUZGMDhcdTYzQTVcdThGRDEgMjUwbXMgXHU0RTAwXHU2QjIxXHVGRjA5XG4gKiAgIG9wdGltaXplLmFib3J0ICAgXHUyMTkyIFx1NjgwN1x1OEJCMFx1NEUyRFx1NkI2Mlx1RkYwQ1x1NTQwRVx1NTNGMFx1NkQ0MVx1NUMzRFx1NUZFQlx1NTA1Q1xuICogY2xpZW50IFx1N0VDRlx1ODFFQVx1NjcwOSBSUEMgXHU5MDFBXHU5MDUzXHVGRjA4L2RzaC1wcm9tcHQtb3B0aW1pemVyXHVGRjA5XHU4RjZFXHU4QkUyXHU1ODlFXHU5MUNGXHU1NDQ4XHU3M0IwXHVGRjA4XHU4RkQxXHU0RjNDXHU2RDQxXHU1RjBGXHVGRjA5XHUzMDAyXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG4vKiogXHU4MUVBXHU2NzA5IFJQQyBcdTkwMUFcdTkwNTNcdTc2ODRcdTY3MDBcdTVDMEZcdTk3NjJcdUZGMDhcdTZDRThcdTUxNjVcdTVGMEZcdUZGMENcdTRGQkZcdTRFOEVcdTUzNTVcdTZENEJcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdFJwYyB7XG4gIGNhbGwoZW5kcG9pbnQ6IHN0cmluZywgcGF5bG9hZD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx7XG4gICAgb2s6IGJvb2xlYW47XG4gICAgdmFsdWU/OiB1bmtub3duO1xuICAgIGVycm9yPzogeyBjb2RlPzogc3RyaW5nOyBkZXRhaWxzPzogdW5rbm93biB9O1xuICB9Pjtcbn1cblxuLyoqIFx1N0VEOVx1NjMwMlx1OEQ3N1x1NzY4NCBSUEMgXHU4QzAzXHU3NTI4XHU1MkEwXHU4RDg1XHU2NUY2XHVGRjA4XHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RUZCXHU0RjU1XHU0RTAwXHU2QjY1XHU5MEZEXHU0RTBEXHU1MTQxXHU4QkI4XHU2NUUwXHU5NjUwXHU5NjNCXHU1ODVFIFx1MjE5Mlx1MzAwQ1x1NEUwMFx1NzZGNFx1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MzAwRFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhUaW1lb3V0PFQ+KHByb21pc2U6IFByb21pc2U8VD4sIG1zOiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgJHtsYWJlbH0tdGltZW91dGApKSwgbXMpO1xuICAgIHByb21pc2UudGhlbihcbiAgICAgICh2KSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHJlc29sdmUodik7XG4gICAgICB9LFxuICAgICAgKGUpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfSxcbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0U2Vzc2lvbkluZm8ge1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICByZWFzb25pbmdFZmZvcnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSG9zdE9wdGltaXplT3B0aW9ucyB7XG4gIHJwYzogSG9zdFJwYztcbiAgbGFuZzogTGFuZztcbiAgdGV4dDogc3RyaW5nO1xuICBzeXN0ZW06IHN0cmluZztcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgb25EZWx0YTogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NkI2NVx1OUFBNFx1OEZEQlx1NUVBNlx1RkYwOFx1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1RkYwQ1x1NUI5QVx1NEY0RFx1NTM2MVx1NzBCOVx1RkYwOSAqL1xuICBvblN0ZXA/OiAoc3RlcDogJ21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcpID0+IHZvaWQ7XG4gIC8qKiBjbGllbnQgXHU0RkE3XHU4QkNBXHU2NUFEXHU1N0NCXHU3MEI5XHVGRjA4ZmlyZS1hbmQtZm9yZ2V0IFx1NTE5OVx1NTE2NSBzZXJ2ZXIgXHU2NUU1XHU1RkQ3XHVGRjBDXHU4RkQ4XHU1MzlGXHU1MzYxXHU3MEI5XHVGRjA5ICovXG4gIHRyYWNlPzogKG1zZzogc3RyaW5nKSA9PiB2b2lkO1xuICBpbnRlcnZhbE1zPzogbnVtYmVyO1xuICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gIHJwY1RpbWVvdXRNcz86IG51bWJlcjtcbn1cblxuY29uc3QgREVGQVVMVF9JTlRFUlZBTF9NUyA9IDI1MDtcbmNvbnN0IERFRkFVTFRfVElNRU9VVF9NUyA9IDEyMF8wMDA7XG5jb25zdCBERUZBVUxUX1JQQ19USU1FT1VUX01TID0gNV8wMDA7XG5cbmZ1bmN0aW9uIGNhbGxScGM8UiA9IG5ldmVyPihcbiAgcnBjOiBIb3N0UnBjLFxuICBlbmRwb2ludDogc3RyaW5nLFxuICBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgbXM6IG51bWJlcixcbik6IFByb21pc2U8eyBvazogdHJ1ZTsgdmFsdWU6IFIgfSB8IHsgb2s6IGZhbHNlOyBlcnJvcj86IHsgY29kZT86IHN0cmluZzsgZGV0YWlscz86IHVua25vd24gfSB9PiB7XG4gIHJldHVybiB3aXRoVGltZW91dChcbiAgICBycGMuY2FsbChlbmRwb2ludCwgcGF5bG9hZCksXG4gICAgbXMsXG4gICAgZW5kcG9pbnQsXG4gICkgYXMgUHJvbWlzZTx7IG9rOiB0cnVlOyB2YWx1ZTogUiB9IHwgeyBvazogZmFsc2U7IGVycm9yPzogeyBjb2RlPzogc3RyaW5nOyBkZXRhaWxzPzogdW5rbm93biB9IH0+O1xufVxuXG4vKiogXHU1M0Q2XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREL2FnZW50IFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYwOVx1MzAwMlx1NEUwRFx1NTNFRlx1NUY5N1x1NjVGNlx1OEZENFx1NTZERSBudWxsXHUzMDAyICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUhvc3RTZXNzaW9uTW9kZWwoXG4gIHJwYzogSG9zdFJwYyxcbiAgcnBjVGltZW91dE1zID0gREVGQVVMVF9SUENfVElNRU9VVF9NUyxcbik6IFByb21pc2U8SG9zdFNlc3Npb25JbmZvIHwgbnVsbD4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBjYWxsUnBjKHJwYywgJ3Nlc3Npb25Nb2RlbCcsIHt9LCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXJlcy5vayB8fCAhcmVzLnZhbHVlIHx8IHR5cGVvZiByZXMudmFsdWUgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdiA9IHJlcy52YWx1ZSBhcyB7IHByb3ZpZGVyPzogdW5rbm93bjsgbW9kZWw/OiB1bmtub3duIH07XG4gIGlmICh0eXBlb2Ygdi5wcm92aWRlciAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHYubW9kZWwgIT09ICdzdHJpbmcnKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgaW5mbzogSG9zdFNlc3Npb25JbmZvID0geyBwcm92aWRlcjogdi5wcm92aWRlciwgbW9kZWw6IHYubW9kZWwgfTtcbiAgaWYgKHR5cGVvZiAocmVzLnZhbHVlIGFzIHsgcmVhc29uaW5nRWZmb3J0PzogdW5rbm93biB9KS5yZWFzb25pbmdFZmZvcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgaW5mby5yZWFzb25pbmdFZmZvcnQgPSAocmVzLnZhbHVlIGFzIHsgcmVhc29uaW5nRWZmb3J0Pzogc3RyaW5nIH0pLnJlYXNvbmluZ0VmZm9ydDtcbiAgfVxuICByZXR1cm4gaW5mbztcbn1cblxuLyoqIFx1NjU4N1x1NjcyQ1x1NTg5RVx1OTFDRlx1RkYwOFx1NUI1N1x1N0IyNlx1NTI0RFx1N0YwMFx1NkJENFx1OEY4M1x1RkYxQlx1OEY2RVx1OEJFMlx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1NzUyOFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpeERlbHRhKHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbiA9IE1hdGgubWluKHByZXYubGVuZ3RoLCBuZXh0Lmxlbmd0aCk7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBuICYmIHByZXYuY2hhckNvZGVBdChpKSA9PT0gbmV4dC5jaGFyQ29kZUF0KGkpKSBpICs9IDE7XG4gIHJldHVybiBuZXh0LnNsaWNlKGkpO1xufVxuXG4vKipcbiAqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTE2OFx1NkQ0MVx1N0EwQlx1RkYxQVx1NTNENlx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4QiBcdTIxOTIgXHU1NDBFXHU1M0YwIGxsbS5zdHJlYW0gXHU1NDJGXHU1MkE4IFx1MjE5MiBcdThGNkVcdThCRTJcdTU4OUVcdTkxQ0ZcdTc2RjRcdTgxRjMgZG9uZVxuICogXHVGRjA4YWJvcnQgXHUyMTkyIFx1OTAxQVx1NzdFNSBzZXJ2ZXIgXHU0RTJEXHU2QjYyXHU1NDBFXHU2MjlCXHU5NTE5XHVGRjFCXHU2NTc0XHU0RjUzXHU4RDg1XHU2NUY2XHU1MTVDXHU1RTk1XHVGRjA5XHUzMDAyXHU4RkQ0XHU1NkRFXHU2NzAwXHU3RUM4XHU2QjYzXHU2NTg3XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Ib3N0T3B0aW1pemUob3B0czogUnVuSG9zdE9wdGltaXplT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgcnBjLCBsYW5nOiBfbGFuZywgdGV4dCwgc3lzdGVtLCBzaWduYWwsIG9uRGVsdGEsIG9uU3RlcCwgdHJhY2UgfSA9IG9wdHM7XG4gIGNvbnN0IGludGVydmFsTXMgPSBvcHRzLmludGVydmFsTXMgPz8gREVGQVVMVF9JTlRFUlZBTF9NUztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0cy50aW1lb3V0TXMgPz8gREVGQVVMVF9USU1FT1VUX01TO1xuICBjb25zdCBycGNUaW1lb3V0TXMgPSBvcHRzLnJwY1RpbWVvdXRNcyA/PyBERUZBVUxUX1JQQ19USU1FT1VUX01TO1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuXG4gIC8vIDEuIFx1NEYxQVx1OEJERFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1RkYwOFx1OTZGNlx1OTE0RFx1N0Y2RVx1RkYxQlx1NUJCRlx1NEUzQlx1NjcwRFx1NTJBMVx1NEUwRFx1NTNFRlx1NzUyOFx1NjIxNlx1NjVFMFx1NkEyMVx1NTc4QiBcdTIxOTIgXHU2NjBFXHU3ODZFXHU1OTMxXHU4RDI1XHVGRjBDXHU0RTBEXHU5NzU5XHU5RUQ4XHVGRjA5XG4gIG9uU3RlcD8uKCdtb2RlbCcpO1xuICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHN0ZXAgbW9kZWwgKGNhbGwgc2Vzc2lvbk1vZGVsKScpO1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgcmVzb2x2ZUhvc3RTZXNzaW9uTW9kZWwocnBjLCBycGNUaW1lb3V0TXMpO1xuICBpZiAoIXNlc3Npb24pIHtcbiAgICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHNlc3Npb25Nb2RlbCBGQUlMRUQgLT4gaG9zdC11bmF2YWlsYWJsZScpO1xuICAgIHRocm93IG5ldyBFcnJvcignaG9zdC11bmF2YWlsYWJsZScpO1xuICB9XG4gIHRyYWNlPy4oJ3J1bkhvc3RPcHRpbWl6ZTogc2Vzc2lvbk1vZGVsIG9rICcgKyBzZXNzaW9uLnByb3ZpZGVyICsgJy8nICsgc2Vzc2lvbi5tb2RlbCk7XG5cbiAgLy8gMi4gXHU1NDJGXHU1MkE4XHU1NDBFXHU1M0YwXHU2RDQxXHU1RjBGXHU0RUZCXHU1MkExXG4gIG9uU3RlcD8uKCdzdGFydCcpO1xuICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHN0ZXAgc3RhcnQgKGNhbGwgb3B0aW1pemUuc3RhcnQpJyk7XG4gIGNvbnN0IHN0YXJ0ZWRQYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHtcbiAgICBwcm92aWRlcjogc2Vzc2lvbi5wcm92aWRlcixcbiAgICBtb2RlbDogc2Vzc2lvbi5tb2RlbCxcbiAgICB0ZXh0LFxuICAgIHN5c3RlbSxcbiAgfTtcbiAgaWYgKHNlc3Npb24ucmVhc29uaW5nRWZmb3J0KSBzdGFydGVkUGF5bG9hZC5yZWFzb25pbmdFZmZvcnQgPSBzZXNzaW9uLnJlYXNvbmluZ0VmZm9ydDtcbiAgY29uc3Qgc3RhcnQgPSBhd2FpdCBjYWxsUnBjPHsgdGFza0lkPzogc3RyaW5nIH0+KHJwYywgJ29wdGltaXplLnN0YXJ0Jywgc3RhcnRlZFBheWxvYWQsIHJwY1RpbWVvdXRNcyk7XG4gIGlmICghc3RhcnQub2sgfHwgIXN0YXJ0LnZhbHVlIHx8IHR5cGVvZiBzdGFydC52YWx1ZS50YXNrSWQgIT09ICdzdHJpbmcnKSB7XG4gICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBvcHRpbWl6ZS5zdGFydCBGQUlMRUQgLT4gaG9zdC1zdGFydC1yZWplY3RlZCcpO1xuICAgIHRocm93IG5ldyBFcnJvcignaG9zdC1zdGFydC1yZWplY3RlZCcpO1xuICB9XG4gIGNvbnN0IHRhc2tJZCA9IHN0YXJ0LnZhbHVlLnRhc2tJZDtcbiAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBvcHRpbWl6ZS5zdGFydCBvayB0YXNrPScgKyB0YXNrSWQpO1xuXG4gIC8vIDMuIFx1OEY2RVx1OEJFMlx1NTg5RVx1OTFDRlx1NzZGNFx1ODFGMyBkb25lXG4gIG9uU3RlcD8uKCdwb2xsJyk7XG4gIHRyYWNlPy4oJ3J1bkhvc3RPcHRpbWl6ZTogc3RlcCBwb2xsIChsb29wIHN0YXJ0KScpO1xuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBsZXQgbGFzdCA9ICcnO1xuICB0cnkge1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJwYy5jYWxsKCdvcHRpbWl6ZS5hYm9ydCcsIHsgdGFza0lkIH0pO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBcdTVDM0RcdTUyOUJcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcbiAgICAgIH1cbiAgICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnRlZEF0ID4gdGltZW91dE1zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcnBjLmNhbGwoJ29wdGltaXplLmFib3J0JywgeyB0YXNrSWQgfSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIC8vIFx1NUMzRFx1NTI5QlxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndGltZW91dCcpO1xuICAgICAgfVxuICAgICAgbGV0IHBvbGw6IHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9IHwgbnVsbCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBjYWxsUnBjPHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9PihcbiAgICAgICAgICBycGMsXG4gICAgICAgICAgJ29wdGltaXplLnBvbGwnLFxuICAgICAgICAgIHsgdGFza0lkIH0sXG4gICAgICAgICAgcnBjVGltZW91dE1zLFxuICAgICAgICApO1xuICAgICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSkgcG9sbCA9IHJlcy52YWx1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTUzNTVcdTZCMjFcdThGNkVcdThCRTJcdTU5MzFcdThEMjVcdTRFMERcdTgxRjRcdTU0N0RcdUZGMENcdTRFMEJcdTRFMDBcdThGNkVcdTUxOERcdThCRDVcbiAgICAgIH1cbiAgICAgIGlmIChwb2xsKSB7XG4gICAgICAgIGlmIChwb2xsLmVycm9yKSB7XG4gICAgICAgICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBwb2xsIGVycm9yIC0+ICcgKyBwb2xsLmVycm9yKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocG9sbC5lcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dE5vdyA9IHBvbGwudGV4dCA/PyAnJztcbiAgICAgICAgaWYgKHRleHROb3cgIT09IGxhc3QpIHtcbiAgICAgICAgICBvbkRlbHRhKHRleHROb3cpO1xuICAgICAgICAgIGxhc3QgPSB0ZXh0Tm93O1xuICAgICAgICB9XG4gICAgICAgIGlmIChwb2xsLmRvbmUpIHtcbiAgICAgICAgICB0cmFjZT8uKCdydW5Ib3N0T3B0aW1pemU6IHBvbGwgZG9uZSB0ZXh0TGVuPScgKyB0ZXh0Tm93Lmxlbmd0aCk7XG4gICAgICAgICAgcmV0dXJuIHRleHROb3c7XG4gICAgICAgIH1cbiAgICAgICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBwb2xsICMnICsgJyB0ZXh0TGVuPScgKyB0ZXh0Tm93Lmxlbmd0aCk7XG4gICAgICB9XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBpbnRlcnZhbE1zKSk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIC8vIFx1NEVGQlx1NEY1NVx1OTAwMFx1NTFGQVx1OERFRlx1NUY4NFx1OTBGRFx1OTAxQVx1NzdFNVx1NjcwRFx1NTJBMVx1N0FFRlx1NTA1Q1x1NkI2Mlx1NTQwRVx1NTNGMFx1NEVGQlx1NTJBMVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBycGMuY2FsbCgnb3B0aW1pemUuYWJvcnQnLCB7IHRhc2tJZCB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NUMzRFx1NTI5QlxuICAgIH1cbiAgfVxufSIsICIvKiogXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHU3MkI2XHU2MDAxXHU2NzNBIFx1MjAxNFx1MjAxNCBcdTdFQUYgcmVkdWNlclx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmltcG9ydCB0eXBlIHsgT3B0aW1pemVFcnJvcktpbmQgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdTdGF0dXMgPSAnaWRsZScgfCAnb3B0aW1pemluZycgfCAncHJldmlldycgfCAnZXJyb3InIHwgJ2d1aWRlJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U3RhdGUge1xuICBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBlcnJvcktpbmQ6IE9wdGltaXplRXJyb3JLaW5kIHwgbnVsbDtcbiAgLyoqIFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1N0VDNlx1ODI4Mlx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTkzMVx1OEQyNVx1N0I0OVx1NTM5Rlx1NTZFMFx1RkYwQ1x1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1NTFGQVx1Njc2NVx1NEZCRlx1NEU4RVx1OEJDQVx1NjVBRFx1RkYwOSAqL1xuICBlcnJvckRldGFpbDogc3RyaW5nIHwgbnVsbDtcbiAgZ2VuZXJhdGlvbjogbnVtYmVyO1xuICAvKiogXHU2RDQxXHU1RjBGXHU0RjE4XHU1MzE2XHU0RTJEXHU3Njg0XHU1ODlFXHU5MUNGXHU2NTg3XHU2NzJDXHVGRjA4b3B0aW1pemluZyBcdTYwMDFcdTVCOUVcdTY1RjZcdTY2RjRcdTY1QjBcdUZGMUJcdTk3NUVcdTZENDFcdTVGMEZcdTUxNjhcdTdBMEJcdTRFM0FcdTdBN0FcdTRFMzJcdUZGMDkgKi9cbiAgZHJhZnQ6IHN0cmluZztcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOG51bGwgPSBcdTY3MkFcdTdFRDFcdTVCOUEvXHU1MTY4XHU1QzQwXHVGRjA5XHVGRjFBXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU1M0VBXHU1QzVFXHU0RThFXHU4QkU1XHU0RjFBXHU4QkREXHVGRjBDXHU1MjA3XHU4RDcwXHU0RTBEXHU4RERGXHU5NjhGICovXG4gIHNlc3Npb25JZDogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NUY1M1x1NTI0RFx1NkI2NVx1OUFBNFx1RkYwOCdtb2RlbCcgfCAnc3RhcnQnIHwgJ3BvbGwnIHwgbnVsbFx1RkYwOVx1RkYxQVx1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1OEZEQlx1NUVBNlx1RkYwQ1x1NUI5QVx1NEY0RFx1NTM2MVx1NzBCOSAqL1xuICBzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyB8IG51bGw7XG59XG5cbi8qKiBcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMUFyZWR1Y2VyIFx1NkMzOFx1NEUwRFx1NTE5OVx1NTZERVx1NUI4M1x1NjIxNlx1OEZENFx1NTZERVx1NTNFRlx1NTNEOFx1NzY4NFx1NjVCMFx1NUJGOVx1OEM2MVx1RkYxQlx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOFRhc2sgNCBzdG9yZSBcdTgwRjZcdTZDMzRcdUZGMDlcdTVGQzVcdTk4N0JcdTRFRTUgeyAuLi5JTklUSUFMX1BSRVZJRVcgfSBcdTRFM0FcdTZCQ0ZcdTRGMUFcdThCRERcdTc5Q0RcdTVCNTAgKi9cbmV4cG9ydCBjb25zdCBJTklUSUFMX1BSRVZJRVc6IFByZXZpZXdTdGF0ZSA9IHtcbiAgc3RhdHVzOiAnaWRsZScsXG4gIHJlc3VsdDogJycsXG4gIGVycm9yS2luZDogbnVsbCxcbiAgZXJyb3JEZXRhaWw6IG51bGwsXG4gIGdlbmVyYXRpb246IDAsXG4gIGRyYWZ0OiAnJyxcbiAgc2Vzc2lvbklkOiBudWxsLFxuICBzdGVwOiBudWxsLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nOyBzZXNzaW9uSWQ/OiBzdHJpbmcgfCBudWxsIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZDsgZGV0YWlsPzogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdndWlkZScgfVxuICB8IHsgdHlwZTogJ2Nsb3NlJyB9XG4gIHwgeyB0eXBlOiAnZHJhZnQnOyB0ZXh0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ3N0ZXAnOyBzdGVwOiAnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyB8IG51bGwgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgIHN0YXR1czogJ29wdGltaXppbmcnLFxuICAgICAgICBlcnJvcktpbmQ6IG51bGwsXG4gICAgICAgIGVycm9yRGV0YWlsOiBudWxsLFxuICAgICAgICBkcmFmdDogJycsXG4gICAgICAgIHNlc3Npb25JZDogYWN0aW9uLnNlc3Npb25JZCA/PyBudWxsLFxuICAgICAgICBzdGVwOiAnbW9kZWwnLFxuICAgICAgICBnZW5lcmF0aW9uOiBzdGF0ZS5nZW5lcmF0aW9uICsgMSxcbiAgICAgIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0LCBkcmFmdDogJycgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAnZXJyb3InLCBlcnJvcktpbmQ6IGFjdGlvbi5raW5kLCBlcnJvckRldGFpbDogYWN0aW9uLmRldGFpbCA/PyBudWxsIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdndWlkZSc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyBzdGF0ZSA6IHsgLi4uc3RhdGUsIHN0YXR1czogJ2d1aWRlJyB9O1xuICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgIHJldHVybiBJTklUSUFMX1BSRVZJRVc7XG4gICAgY2FzZSAnZHJhZnQnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8geyAuLi5zdGF0ZSwgZHJhZnQ6IGFjdGlvbi50ZXh0IH0gOiBzdGF0ZTtcbiAgICBjYXNlICdzdGVwJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIHN0ZXA6IGFjdGlvbi5zdGVwIH0gOiBzdGF0ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHN0YXRlO1xuICB9XG59XG5cbi8qKiBcdThCQTFcdTUyMTJcdTg5QzRcdTVCOUFcdTc2ODRcdTUxNkNcdTVGMDAgQVBJXHVGRjA4VGFzayA0IFx1OEQ3N1x1NUI1OFx1NTcyOFx1RkYxQmNhblRyaWdnZXIgXHU3Njg0ICFidXN5IFx1NTM0QVx1OEZCOVx1NjI3Rlx1NjJDNVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1ODA0Q1x1OEQyM1x1RkYwQ1x1NTE3Nlx1NEY1OVx1NEZERFx1NzU1OVx1NEVFNVx1NTkwN1x1NTQwRVx1N0VFRFx1NkQ4OFx1OEQzOVx1ODAwNVx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbk9wdGltaXplRnJvbShzdGF0dXM6IFByZXZpZXdTdGF0dXMpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0YXR1cyAhPT0gJ29wdGltaXppbmcnO1xufVxuIiwgIi8qKiBcdTk4ODRcdTg5QzhcdTcyQjZcdTYwMDFcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkYgXHUyMDE0XHUyMDE0IFx1NjMwOVx1OTRBRS9cdTk4ODRcdTg5QzhcdTUzNjEvcnVuT3B0aW1pemUgXHU1MTcxXHU0RUFCXHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgKi9cblxuaW1wb3J0IHtcbiAgSU5JVElBTF9QUkVWSUVXLFxuICByZWR1Y2VQcmV2aWV3LFxuICB0eXBlIFByZXZpZXdBY3Rpb24sXG4gIHR5cGUgUHJldmlld1N0YXRlLFxufSBmcm9tICcuL3ByZXZpZXctc3RhdGUuanMnO1xuXG4vKiogXHU2QTIxXHU1NzU3XHU3RUE3XHU1MzU1XHU0RjhCXHU3MkI2XHU2MDAxXHVGRjA4XHU2QkNGXHU2M0QyXHU0RUY2XHU1QjlFXHU0RjhCXHU0RTAwXHU0RUZEXHVGRjFBXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU1MTg1XHU1MTY4XHU1QzQwXHU1NTJGXHU0RTAwXHVGRjA5ICovXG5sZXQgc3RhdGU6IFByZXZpZXdTdGF0ZSA9IHsgLi4uSU5JVElBTF9QUkVWSUVXIH07XG5jb25zdCBsaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbi8qKiBcdThCRkJcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdUZGMDhcdTdBMzNcdTVCOUFcdTVGMTVcdTc1MjhcdTc2RjRcdTUyMzBcdTRFMEJcdTRFMDBcdTZCMjEgZGlzcGF0Y2hcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aWV3QnVzU3RhdGUoKTogUHJldmlld1N0YXRlIHtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vKiogXHU2RDNFXHU1M0QxXHU3MkI2XHU2MDAxXHU2NzNBXHU1MkE4XHU0RjVDXHU1RTc2XHU5MDFBXHU3N0U1XHU4QkEyXHU5NjA1XHU4MDA1ICovXG5leHBvcnQgZnVuY3Rpb24gZGlzcGF0Y2hQcmV2aWV3KGFjdGlvbjogUHJldmlld0FjdGlvbik6IHZvaWQge1xuICBzdGF0ZSA9IHJlZHVjZVByZXZpZXcoc3RhdGUsIGFjdGlvbik7XG4gIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSBsaXN0ZW5lcigpO1xufVxuXG4vKiogXHU4QkEyXHU5NjA1XHU1M0Q4XHU1MzE2XHVGRjFCXHU4RkQ0XHU1NkRFXHU5MDAwXHU4QkEyXHU1MUZEXHU2NTcwICovXG5leHBvcnQgZnVuY3Rpb24gc3Vic2NyaWJlUHJldmlld0J1cyhsaXN0ZW5lcjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfTtcbn0iLCAiLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5MiBydW5PcHRpbWl6ZSArIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNiBcdTIwMTRcdTIwMTQgXHU3MkI2XHU2MDAxXHU3RUNGXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdTUzRDFcdTVFMDNcdUZGMENcbiAqICBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwOFx1Njg0Q1x1OTc2Mlx1NkUzMlx1NjdEM1x1NUM0Mlx1NUJGOSBpbnB1dC5yaWdodC9vdmVybGF5IFx1NjlGRFx1NEY0RFx1NEUwRFx1NjNEMFx1NEY5Qlx1OEZEOVx1NEU5Qlx1NjgwN1x1NTFDNiBwcm9wc1x1RkYwQ1xuICogIFx1N0VDNFx1NEVGNlx1NEY5RFx1OEQ1Nlx1NUI4M1x1NEVFQ1x1NEYxQVx1NUQyOVx1NUU3Nlx1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1MjAxNFx1MjAxNFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjgvXHU5ODg0XHU4OUM4XHU1MzYxXHU0RTBEXHU1M0VGXHU4OUMxXHU3Njg0XHU1QjlFXHU2RDRCXHU1QjlBXHU4QkJBXHVGRjA5XHUzMDAyICovXG5cbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZVN0cmVhbSxcbiAgcmVzb2x2ZVNlc3Npb25Nb2RlbCxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuSG9zdE9wdGltaXplLCB0eXBlIEhvc3RScGMgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGJ1aWxkU3lzdGVtUHJvbXB0IH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgZGlzcGF0Y2hQcmV2aWV3IH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbi8qKlxuICogXHU1RjUzXHU1MjREIGluLWZsaWdodCBcdThCRjdcdTZDNDJcdTc2ODRcdTYzQTdcdTUyMzZcdTU2NjhcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMDlcdUZGMUFcbiAqIC0gXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHU2NUY2XHU0RTJEXHU2QjYyXHU1QjgzXHVGRjBDXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHVGRjFCXG4gKiAtIHJ1bk9wdGltaXplIFx1NEVFNVx1MzAwQ1x1NUI1OFx1NTcyOFx1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNlx1NTY2OFx1MzAwRFx1NEUzQVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYwOFx1NTQwQ1x1NEUwMFx1NjVGNlx1NTIzQlx1NTNFQVx1NTE0MVx1OEJCOFx1NEUwMFx1NEUyQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1RkYwOVx1MzAwMlxuICogXHU2Q0U4XHVGRjFBXHU2QTIxXHU1NzU3XHU3RUE3XHU2MTBGXHU1NDczXHU3NzQwXHU1OTFBXHU0RjFBXHU4QkREXHU1NDBDXHU2NUY2XHU0RjE4XHU1MzE2XHU0RjFBXHU0RTkyXHU3NkY4XHU4QkE5XHU4REVGXHUyMDE0XHUyMDE0XHU4RjkzXHU1MTY1XHU2ODBGXHU1MzU1XHU0RjFBXHU4QkREXHU4MDVBXHU3MTI2XHU3Njg0XHU0RUE0XHU0RTkyXHU0RTBCXHU1M0VGXHU2M0E1XHU1M0Q3XHU2QjY0XHU3QjgwXHU1MzE2XHUzMDAyXG4gKi9cbmxldCBhY3RpdmVDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcbi8qKiBcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdTc2ODRcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdUZGMDhcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTYzMDlcdTRGMUFcdThCRERcdUZGMUFcdTU0MENcdTRGMUFcdThCRERcdTk2MzJcdTYyOTZcdUZGMUJcdTVGMDJcdTRGMUFcdThCRERcdThCQTlcdThERUZcdUZGMDkgKi9cbmxldCBhY3RpdmVTZXNzaW9uSWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUyMTkyIFx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxXHVGRjA4ZmV0Y2ggXHU5MDFBXHU5MDUzXHVGRjA5XHUyMTkyIGd1aWRlXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbiAgLyoqIFx1NUJCRlx1NEUzQlx1NkEyMVx1NTc4Qlx1RkYwOFVJIFx1NjgwN1x1N0I3RVx1RkYwOVx1RkYxQlx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NTE4NVx1OTBFOFx1ODFFQVx1ODg0Q1x1ODlFM1x1Njc5MCAqL1xuICBnZXRTZXNzaW9uTW9kZWw/KCk6IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPjtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1RkYwOHVzZVNlc3Npb25Nb2RlbCBcdTVGMDBcdTU0MkZcdTY1RjZcdTc1MjhcdUZGMDlcdUZGMUFcdTgxRUFcdTY3MDkgUlBDIFx1MjE5MiBzZXJ2ZXIgaGFsZiBcdTc2ODQgbGxtLnN0cmVhbVx1RkYwQ1x1OTZGNlx1OTE0RFx1N0Y2RSAqL1xuICBob3N0Pzoge1xuICAgIHJwYzogSG9zdFJwYztcbiAgfTtcbiAgLyoqIFx1NTNEMVx1OEQ3N1x1NEYxOFx1NTMxNlx1NzY4NFx1NEYxQVx1OEJERCBpZFx1RkYwOFx1N0VEMVx1NUI5QVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1RkYwQ1x1NTIwN1x1NEYxQVx1OEJERFx1NEUwRFx1OERERlx1OTY4Rlx1RkYwOSAqL1xuICBnZXRTZXNzaW9uSWQ/KCk6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBjbGllbnQgXHU0RkE3XHU4QkNBXHU2NUFEXHU1N0NCXHU3MEI5XHVGRjA4XHU1MTk5XHU1MTY1IHNlcnZlciBcdThDMDNcdThCRDVcdTY1RTVcdTVGRDdcdUZGMENcdTVCOUFcdTRGNERcdTUzNjFcdTcwQjlcdUZGMDkgKi9cbiAgdHJhY2U/KG1zZzogc3RyaW5nKTogdm9pZDtcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBjb25zdCBkcmFmdCA9IGN0eC5nZXREcmFmdCgpLnRyaW0oKTtcbiAgY3R4LnRyYWNlPy4oYHJ1bk9wdGltaXplOiBjYWxsZWQgZHJhZnRMZW49JHtkcmFmdC5sZW5ndGh9IHVzZVNlc3Npb25Nb2RlbD0ke2NvbmZpZy51c2VTZXNzaW9uTW9kZWx9YCk7XG4gIGlmICghZHJhZnQpIHtcbiAgICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGVtcHR5IGRyYWZ0IC0+IHJldHVybicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYxQVx1NTQwQ1x1NEYxQVx1OEJERFx1NTcyOFx1OTAxNCBcdTIxOTIgXHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHVGRjA4XHU2MzA5XHU5NEFFIGJ1c3kgXHU1REYyXHU3OTgxXHU3NTI4XHU3MEI5XHU1MUZCXHVGRjBDXHU4RkQ5XHU5MUNDXHU2NjJGXHU3QURFXHU2MDAxXHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHVGRjA5XHVGRjFCXG4gIC8vIFx1NTIwN1x1NjM2Mlx1NEYxQVx1OEJERFx1NTQwRVx1NTNEMVx1OEQ3NyBcdTIxOTIgXHU0RTJEXHU2QjYyXHU2NUU3XHU4QkY3XHU2QzQyXHU4QkE5XHU4REVGXHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU0RjE4XHU1MzE2XHVGRjBDXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU3NTMxIGNhbmNlbCBcdTY1MzZcdTVDM0VcdUZGMDlcbiAgY29uc3Qgc2Vzc2lvbklkID0gY3R4LmdldFNlc3Npb25JZD8uKCkgPz8gbnVsbDtcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHtcbiAgICBpZiAoc2Vzc2lvbklkID09PSBhY3RpdmVTZXNzaW9uSWQpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogc2FtZS1zZXNzaW9uIGluZmxpZ2h0IC0+IGRlYm91bmNlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogZGlmZmVyZW50IHNlc3Npb24gLT4gYWJvcnQgc3RhbGUnKTtcbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgfVxuICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGRpc3BhdGNoIGJlZ2luJyk7XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdiZWdpbicsIHNlc3Npb25JZCB9KTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlUHJldmlldygpXHVGRjBDXHU0RjlCXHU1MzYxXHU3MjQ3XHU1MTczXHU5NUVEXHU2NUY2XHU1M0Q2XHU2RDg4XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXG4gIGFjdGl2ZVNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERFx1OTAxQVx1OTA1MyBcdTIwMTRcdTIwMTQgXHU5NkY2XHU5MTREXHU3RjZFXHVGRjBDXHU2NUUwXHU5NzAwIGNoZWNrQ29uZmlnXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogaG9zdCBicmFuY2ggLT4gcnVuSG9zdE9wdGltaXplJyk7XG4gICAgICBhd2FpdCBydW5Ib3N0T3B0aW1pemUoe1xuICAgICAgICBycGM6IGN0eC5ob3N0LnJwYyxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgdGV4dDogZHJhZnQsXG4gICAgICAgIHN5c3RlbTogYnVpbGRTeXN0ZW1Qcm9tcHQoY3R4LmdldExhbmcoKSksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIG9uRGVsdGE6ICh0ZXh0KSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0IH0pLFxuICAgICAgICBvblN0ZXA6IChzdGVwKSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc3RlcCcsIHN0ZXAgfSksXG4gICAgICAgIHRyYWNlOiAobXNnKSA9PiB7XG4gICAgICAgICAgdm9pZCBjdHguaG9zdD8ucnBjLmNhbGwoJ2RlYnVnLmxvZycsIHsgbXNnIH0pLmNhdGNoKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgICAgIH0sXG4gICAgICB9KS50aGVuKFxuICAgICAgICAoZmluYWxUZXh0KSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdDogZmluYWxUZXh0IH0pLFxuICAgICAgICAoZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAgICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgICAgICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICAgICAgICBpZiAodGltZWRPdXQpIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogJ3RpbWVvdXQnIGFzIE9wdGltaXplRXJyb3JLaW5kIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBraW5kID0gdG9FcnJvcktpbmQoZSkua2luZDtcbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQsIGRldGFpbDogU3RyaW5nKChlIGFzIHsgbWVzc2FnZT86IHVua25vd24gfSk/Lm1lc3NhZ2UgPz8gZSkgfSk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGZldGNoIFx1OTAxQVx1OTA1M1x1RkYwOFx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qi9cdTVCQkZcdTRFM0JcdTRFMERcdTUzRUZcdTc1MjhcdTk2NERcdTdFQTdcdUZGMDlcdTYyNERcdTg5ODFcdTZDNDJcdTkxNERcdTdGNkVcbiAgICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdndWlkZScgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1NzhCXHU2QTIxXHU1RjBGXHVGRjFBXHU2RDRGXHU4OUM4XHU1NjY4IGZldGNoIFx1NzZGNFx1OEZERVx1ODFFQVx1OTE0RCBBUElcdUZGMDhcdTZENDFcdTVGMEZcdUZGMDlcbiAgICAvLyBcdTZBMjFcdTU3OEJcdTg5RTNcdTY3OTBcdUZGMUF1c2VTZXNzaW9uTW9kZWxcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdTIxOTIgXHU1QkJGXHU0RTNCXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4XHU0RUM1XHU0RjVDIG1vZGVsIFx1NTQwRFx1NTZERVx1OTAwMFx1NEY3Rlx1NzUyOFx1RkYwQ1x1OTcwMFx1OTE0RFx1N0Y2RVx1NURGMlx1NUMzMVx1N0VFQVx1RkYwOVx1RkYxQlx1NTQyNlx1NTIxOSBcdTIxOTIgXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXG4gICAgbGV0IG1vZGVsID0gY29uZmlnLm1vZGVsO1xuICAgIGlmIChjb25maWcudXNlU2Vzc2lvbk1vZGVsKSB7XG4gICAgICBjb25zdCBzZXNzaW9uTW9kZWwgPSBhd2FpdCBjdHguZ2V0U2Vzc2lvbk1vZGVsPy4oKTtcbiAgICAgIGlmIChzZXNzaW9uTW9kZWwgJiYgc2Vzc2lvbk1vZGVsLm1vZGVsKSBtb2RlbCA9IHNlc3Npb25Nb2RlbC5tb2RlbDtcbiAgICB9XG4gICAgY29uc3QgZWZmZWN0aXZlID0geyAuLi5jb25maWcsIG1vZGVsIH07XG5cbiAgICAvLyBcdTVDNTVcdTc5M0FcdTdEMkZcdTc5RUZcdUZGMUFcdTZCNjNcdTY1ODdcdTRGMThcdTUxNDhcdUZGMUJcdTZCNjNcdTY1ODdcdTVDMUFcdTY3MkFcdTUxRkFcdTczQjBcdUZGMDh2NCBcdTdDRkJcdTUxNDhcdThGOTNcdTUxRkFcdTk1N0ZcdTZCQjVcdTYzQThcdTc0MDZcdUZGMDlcdTY1RjZcdTVDNTVcdTc5M0FcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdUZGMENcdThCQTlcdTZENDFcdTVGMEZcdTdBQ0JcdTUzNzNcdTUzRUZcdTg5QzFcbiAgICBsZXQgcmVhc29uaW5nID0gJyc7XG4gICAgbGV0IGNvbnRlbnQgPSAnJztcbiAgICBsZXQgc2hvd24gPSAnJztcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3B0aW1pemVTdHJlYW0oe1xuICAgICAgICBjb25maWc6IGVmZmVjdGl2ZSxcbiAgICAgICAgdGV4dDogZHJhZnQsXG4gICAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIG9uRXZlbnQ6IChkZWx0YSkgPT4ge1xuICAgICAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgICAgIHNob3duID0gY29udGVudDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVhc29uaW5nICs9IGRlbHRhLnRleHQ7XG4gICAgICAgICAgICBzaG93biA9IHJlYXNvbmluZztcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2RyYWZ0JywgdGV4dDogc2hvd24gfSk7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzaG93JywgcmVzdWx0IH0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFx1NTE0OFx1NTIyNFx1NUI5QVx1NEUyRFx1NkI2Mlx1RkYxQVx1NzUyOFx1NjIzNy9cdTdFQzRcdTRFRjZcdTUzRDZcdTZEODhcdTRFMEVcdThEODVcdTY1RjZcdTkwRkRcdTg4NjhcdTczQjBcdTRFM0EgQWJvcnRFcnJvclx1RkYxQlx1NEVDNVx1OEQ4NVx1NjVGNlx1NTE5OVx1NTE2NVx1OTUxOVx1OEJFRlx1NjAwMVxuICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgIChlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB8fFxuICAgICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgIChlIGFzIHsgbmFtZTogc3RyaW5nIH0pLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gICAgICBpZiAoaXNBYm9ydCkge1xuICAgICAgICBpZiAodGltZWRPdXQpIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogJ3RpbWVvdXQnIGFzIE9wdGltaXplRXJyb3JLaW5kIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gXHU5ODc2XHU1QzQyXHU1MTVDXHU1RTk1XHVGRjA4XHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzIHJlamVjdCBcdTVERjJcdTg4QUIgLnRoZW4gXHU2RDg4XHU1MzE2XHVGRjFCXHU2QjY0XHU1OTA0XHU0RkREXHU2MkE0IGZldGNoIFx1NTIwNlx1NjUyRlx1NEVFNVx1NTkxNlx1NzY4NFx1NjEwRlx1NTkxNlx1NUYwMlx1NUUzOFx1RkYwOVxuICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogdG9FcnJvcktpbmQoZSkua2luZCB9KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoYWN0aXZlQ29udHJvbGxlciA9PT0gY29udHJvbGxlcikge1xuICAgICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gICAgICBhY3RpdmVTZXNzaW9uSWQgPSBudWxsO1xuICAgIH1cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG59IiwgIi8qKiBcdThGOTNcdTUxNjVcdTUzM0FcdTZENkVcdTVDNDJcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcdUZGMUFndWlkZSAvIG9wdGltaXppbmcgLyBwcmV2aWV3IC8gZXJyb3IgXHU1NkRCXHU3OUNEXHU1MTg1XHU1QkI5XHU2MDAxXG4gKiAgXHU3MkI2XHU2MDAxXHU2NzY1XHU4MUVBXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4cHJldmlldy1idXNcdUZGMDlcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wcyAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VSZWYsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSwgY2xvc2VQcmV2aWV3IH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZ2V0UHJldmlld0J1c1N0YXRlLCBzdWJzY3JpYmVQcmV2aWV3QnVzIH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld0NhcmRQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgb3BlblNldHRpbmdzOiAoKSA9PiB2b2lkO1xuICBnZXRTZXNzaW9uTW9kZWw/OiAoKSA9PiBQcm9taXNlPHsgcHJvdmlkZXI6IHN0cmluZzsgbW9kZWw6IHN0cmluZyB9IHwgbnVsbD47XG4gIGdldEhvc3Q/OiAoKSA9PiB7IHJwYzogeyBjYWxsOiAoZTogc3RyaW5nLCBwPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IFByb21pc2U8eyBvazogYm9vbGVhbjsgdmFsdWU/OiB1bmtub3duOyBlcnJvcj86IHsgY29kZT86IHN0cmluZyB9IH0+IH0gfSB8IG51bGw7XG4gIGdldFNlc3Npb25JZD86ICgpID0+IHN0cmluZyB8IG51bGw7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1zdGVwIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy10ZXh0LXNlY29uZGFyeSwgIzhjOTNhMSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgbWFyZ2luLWxlZnQ6IDRweDtcbn1cbi5kc2gtcG8tY2FyZC1lcnItZGV0YWlsIHtcbiAgbWFyZ2luLXRvcDogNHB4O1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKTtcbiAgZm9udC1zaXplOiAxMnB4O1xuICB3b3JkLWJyZWFrOiBicmVhay1hbGw7XG59XG4uZHNoLXBvLWNhcmQtcm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGZsZXgtd3JhcDogd3JhcDtcbn1cbi5kc2gtcG8tY2FyZC1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgcGFkZGluZzogNHB4IDEwcHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICMyMjIpO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xNCkpO1xufVxuLmRzaC1wby1jYXJkLWJ0bi5wcmltYXJ5IHtcbiAgLyogXHU1MTk5XHU2QjdCXHU0RTNCXHU4MjcyXHVGRjFBLS1kc3ctYWxpYXMtYnJhbmQtcHJpbWFyeSBcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDVcdTgyNzIgXHUyMTkyIFx1NzY3RFx1NUU5NVx1NzY3RFx1NUI1N1x1NEUwRFx1NTNFRlx1OEJGQlx1RkYwOFx1NzUyOFx1NjIzN1x1NUI5RVx1NkQ0Qlx1RkYwOSAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKiogXHU2MjdFIGNvbXBvc2VyIFx1OEY5M1x1NTE2NVx1Njg0Nlx1RkYxQVx1NEYxOFx1NTE0OFx1NzEyNlx1NzBCOVx1RkYwQ1x1NTQyNlx1NTIxOVx1N0IyQ1x1NEUwMFx1NEUyQVx1OTc1RSBkaXNhYmxlZCB0ZXh0YXJlYSAqL1xuZnVuY3Rpb24gZmluZENvbXBvc2VyKCk6IEhUTUxUZXh0QXJlYUVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQgJiYgIWFjdGl2ZS5kaXNhYmxlZCkgcmV0dXJuIGFjdGl2ZTtcbiAgY29uc3QgYWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWEnKTtcbiAgZm9yIChjb25zdCB0YSBvZiBhbGwpIHtcbiAgICBpZiAoIXRhLmRpc2FibGVkKSByZXR1cm4gdGE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRDb21wb3NlclRleHQoKTogc3RyaW5nIHtcbiAgY29uc3QgdGEgPSBmaW5kQ29tcG9zZXIoKTtcbiAgcmV0dXJuIHRhID8gdGEudmFsdWUgOiAnJztcbn1cblxuLyoqIFx1NzUyOFx1NTM5Rlx1NzUxRiB2YWx1ZSBzZXR0ZXIgXHU1MTk5XHU1NkRFXHVGRjBDXHU4QkE5IFJlYWN0IFx1NTNEN1x1NjNBN1x1N0VDNFx1NEVGNlx1NjExRlx1NzdFNVx1RkYwOFx1NTE4RFx1NkQzRVx1NTNEMSBpbnB1dCBcdTRFOEJcdTRFRjZcdTg5RTZcdTUzRDEgb25DaGFuZ2VcdUZGMDkgKi9cbmZ1bmN0aW9uIHdyaXRlQ29tcG9zZXJUZXh0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICBpZiAoIXRhKSByZXR1cm47XG4gIGNvbnN0IHNldHRlciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoSFRNTFRleHRBcmVhRWxlbWVudC5wcm90b3R5cGUsICd2YWx1ZScpPy5zZXQ7XG4gIGlmIChzZXR0ZXIpIHtcbiAgICBzZXR0ZXIuY2FsbCh0YSwgdGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdGEudmFsdWUgPSB0ZXh0O1xuICB9XG4gIHRhLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG4gIHRhLmZvY3VzKCk7XG59XG5cbmZ1bmN0aW9uIGVycm9yS2V5KGtpbmQ6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAvLyBraW5kIFx1MjE5MiBsb2NhbGUga2V5XHVGRjFCJ2NvbmZpZycgXHU1NzI4IFVJIFx1NEUwQVx1NEUwRFx1NTNFRlx1OEZCRVx1RkYwOHJ1bk9wdGltaXplIFx1NTE0OFx1OEQ3MCBndWlkZVx1RkYwOVx1RkYwQ0Fib3J0RXJyb3JcdTIxOTJ0aW1lb3V0IFx1NzUzMSBydW5PcHRpbWl6ZSBcdTUxNDhcdTg4NENcdTYyRTZcdTYyMkFcdUZGMENcdTRGRERcdTc1NTlcdTUzQ0NcdTRGRERcdTk2NjlcbiAgICBjYXNlICd1bmF1dGhvcml6ZWQnOiBjYXNlICdmb3JiaWRkZW4nOiBjYXNlICd0aW1lb3V0JzogY2FzZSAnbmV0d29yayc6IGNhc2UgJ2NvcnMnOiBjYXNlICdodHRwJzogY2FzZSAnYmFkLXJlc3BvbnNlJzogY2FzZSAnZW1wdHknOiBjYXNlICdjb25maWcnOlxuICAgICAgcmV0dXJuIGBlcnJvci4ke2tpbmR9YDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdlcnJvci5uZXR3b3JrJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUHJldmlld0NhcmQocHJvcHM6IFByZXZpZXdDYXJkUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBnZXRDb25maWcsIGdldExhbmcsIG9wZW5TZXR0aW5ncywgZ2V0U2Vzc2lvbk1vZGVsLCBnZXRIb3N0LCBnZXRTZXNzaW9uSWQgfSA9IHByb3BzO1xuXG4gIC8vIFx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVxuICBjb25zdCBbc3RhdGUsIHNldFN0YXRlXSA9IHVzZVN0YXRlKCgpID0+IGdldFByZXZpZXdCdXNTdGF0ZSgpKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0U3RhdGUoZ2V0UHJldmlld0J1c1N0YXRlKCkpKSxcbiAgICBbXSxcbiAgKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICAvLyBcdTUzNzhcdThGN0RcdTY1RjZcdTZFMDVcdTc0MDZcdUZGMUFcdTZFMDVcdTk2NjRcdTYzMDJcdThENzdcdTc2ODQgY29waWVkIFx1NTkwRFx1NEY0RFx1NUI5QVx1NjVGNlx1NTY2OFx1RkYwQ1x1NUU3Nlx1NjgwN1x1OEJCMFx1NjcyQVx1NjMwMlx1OEY3RFx1RkYwQ1xuICAvLyBcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2V0Q29waWVkKHRydWUpXHVGRjA4Y29weSBcdTc2ODQgYXdhaXQgXHU2NzFGXHU5NUY0XHU1Mzc4XHU4RjdEXHVGRjA5XHU1NzI4XHU1Mzc4XHU4RjdEXHU1NDBFXHU4OUU2XHU1M0QxXHUzMDAyXG4gIGNvbnN0IG1vdW50ZWRSZWYgPSB1c2VSZWYodHJ1ZSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbW91bnRlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgbW91bnRlZFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCB7IHN0YXR1cywgcmVzdWx0LCBlcnJvcktpbmQgfSA9IHN0YXRlO1xuICBjb25zdCBbY29waWVkLCBzZXRDb3BpZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjb3B5VGltZXJSZWYgPSB1c2VSZWY8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU3RUQxXHU1QjlBXHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHVGRjFBXHU1MjA3XHU2MzYyXHU1MjMwXHU1MjJCXHU3Njg0XHU0RjFBXHU4QkREXHU2NUY2XHU0RTBEXHU4RERGXHU5NjhGXHU2NjNFXHU3OTNBXHVGRjA4XHU1MjA3XHU1NkRFXHU1M0QxXHU4RDc3XHU0RjFBXHU4QkREXHU2MDYyXHU1OTBEXHVGRjA5XG4gIGlmIChzdGF0dXMgIT09ICdpZGxlJyAmJiBzdGF0ZS5zZXNzaW9uSWQgIT09IG51bGwpIHtcbiAgICBjb25zdCBzaWQgPSBnZXRTZXNzaW9uSWQ/LigpO1xuICAgIGlmIChzaWQgIT09IG51bGwgJiYgc3RhdGUuc2Vzc2lvbklkICE9PSBzaWQpIHJldHVybiBudWxsO1xuICB9XG4gIGlmIChzdGF0dXMgPT09ICdpZGxlJykgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IHJlYWRDb21wb3NlclRleHQoKSxcbiAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgIGdldEhvc3QsXG4gICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICB0cmFjZTogKG1zZykgPT4ge1xuICAgICAgICB2b2lkIGdldEhvc3Q/LigpPy5ycGMuY2FsbCgnZGVidWcubG9nJywgeyBtc2cgfSkuY2F0Y2goKCkgPT4gdW5kZWZpbmVkKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgcmVwbGFjZSA9ICgpID0+IHtcbiAgICB3cml0ZUNvbXBvc2VyVGV4dChyZXN1bHQpO1xuICAgIGNsb3NlUHJldmlldygpO1xuICB9O1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFuYXZpZ2F0b3IuY2xpcGJvYXJkKSByZXR1cm47IC8vIFx1OTc1RVx1NUI4OVx1NTE2OFx1NEUwQVx1NEUwQlx1NjU4N1x1RkYwOGh0dHAgXHU3QjQ5XHVGRjA5XHVGRjFBXHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwQ1x1NEZERFx1NjMwMVx1NTNFRlx1OTFDRFx1OEJENVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChyZXN1bHQpO1xuICAgICAgaWYgKCFtb3VudGVkUmVmLmN1cnJlbnQpIHJldHVybjsgLy8gYXdhaXQgXHU2NzFGXHU5NUY0XHU3RUM0XHU0RUY2XHU1REYyXHU1Mzc4XHU4RjdEXHVGRjFBXHU0RTBEXHU1MThEIHNldFN0YXRlXG4gICAgICBzZXRDb3BpZWQodHJ1ZSk7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0Q29waWVkKGZhbHNlKTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMTIwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyNkFcdThEMzRcdTY3N0ZcdTUxOTlcdTUxNjVcdTU5MzFcdThEMjVcdUZGMUFcdTk3NTlcdTlFRDhcdUZGMDhcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjA5XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZFwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtaGVhZFwiPlxuICAgICAgICA8c3Bhbj57dCgnY2FyZC50aXRsZScpfTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgIFx1MjcxNVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7c3RhdHVzID09PSAnZ3VpZGUnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUudGl0bGUnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUuZGVzYycpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9eygpID0+IHsgY2xvc2VQcmV2aWV3KCk7IG9wZW5TZXR0aW5ncygpOyB9fT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmFjdGlvbicpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnb3B0aW1pemluZycgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj5cbiAgICAgICAgICB7c3RhdGUuZHJhZnQgPyA8c3BhbiBzdHlsZT17eyB3aGl0ZVNwYWNlOiAncHJlLXdyYXAnIH19PntzdGF0ZS5kcmFmdH08L3NwYW4+IDogdCgnY2FyZC5vcHRpbWl6aW5nJyl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ3ByZXZpZXcnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57cmVzdWx0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JlcGxhY2V9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXBsYWNlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weSgpfT5cbiAgICAgICAgICAgICAge2NvcGllZCA/IHQoJ2NhcmQuY29weURvbmUnKSA6IHQoJ2NhcmQuY29weScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ2Vycm9yJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1lcnJcIj57dChlcnJvcktleShlcnJvcktpbmQpKX08L2Rpdj5cbiAgICAgICAgICB7ZXJyb3JEZXRhaWwgPyA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyci1kZXRhaWxcIj57ZXJyb3JEZXRhaWx9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn0iLCAiLyoqIFx1OEJCRVx1N0Y2RSBcdTIxOTIgR2VuZXJhbCBcdTUzM0FcdTMwMENQcm9tcHQgXHU0RjE4XHU1MzE2XHUzMDBEXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjFBXHU2ODA3XHU5ODk4XHU2NDU4XHU4OTgxICsgXHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1ICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtU3RhdGUsIFNldHRpbmdzRm9ybVZhbHVlcyB9IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybUFjdGlvbnMgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB7IG9uT3BlblNldHRpbmdzUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1Jvd1Byb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBTZXR0aW5nc0Zvcm1TdGF0ZSkgPT4gVCkgPT4gVDtcbiAgYWN0aW9uczogU2V0dGluZ3NGb3JtQWN0aW9ucztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIHNhdmVDb25maWc6ICh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcmVzZXRDb25maWc6ICgpID0+IFByb21pc2U8dm9pZD47XG4gIGdldEVwb2NoOiAoKSA9PiBudW1iZXI7XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTgxRUFcdTY4QzBcdUZGMUFcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTY2MkZcdTU0MjZcdTUzRUZcdTdFQ0Ygc2VydmVyIGhhbGYgXHU4M0I3XHU1M0Q2XHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHU5MDFBXHU5MDUzXHU3Njg0XHU1MDY1XHU1RUI3XHU2M0EyXHU5NDg4XHVGRjA5ICovXG4gIGdldEhvc3RTdGF0dXM/OiAoKSA9PiBQcm9taXNlPHsgYXZhaWxhYmxlOiBib29sZWFuOyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIH0gfCBudWxsPjtcbn1cblxuaW1wb3J0IHsgQlVJTERfSUQgfSBmcm9tICcuL2J1aWxkLWlkLmpzJztcblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL3NldHRpbmdzLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLm9wdGlTZXR0aW5ncyB7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgcGFkZGluZzogMTZweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5vcHRpU2V0dGluZ3NUaXRsZSB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDIycHg7XG59XG4ub3B0aVNldHRpbmdzSGludCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzRm9ybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzRmllbGQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NMYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0lucHV0IHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ub3B0aVNldHRpbmdzUm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG4ub3B0aVNldHRpbmdzQnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMnB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQVx1NEUzQlx1OTg5OFx1NTNEOFx1OTFDRlx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1NEYxQVx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NS9cdTZERjFcdTY3ODFcdTdBRUZcdTgyNzJcdUZGMDhcdTlFRDFcdTVFOTVcdTlFRDFcdTVCNTdcdTMwMDFcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTU3NDdcdTg4QUJcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDlcdUZGMENcbiAgICAgXHU1NkZBXHU1QjlBXHU1NEMxXHU3MjRDXHU4NEREICsgXHU3NjdEXHU1QjU3XHU0RkREXHU4QkMxXHU0RUZCXHU0RjU1XHU0RTNCXHU5ODk4XHU1M0VGXHU4QkZCICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuLm9wdGlTZXR0aW5nc0VyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2V0dGluZ3NSb3cocHJvcHM6IFNldHRpbmdzUm93UHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBzYXZlQ29uZmlnLCByZXNldENvbmZpZywgZ2V0RXBvY2gsIGdldEhvc3RTdGF0dXMgfSA9IHByb3BzO1xuICBjb25zdCBbaG9zdFN0YXR1cywgc2V0SG9zdFN0YXR1c10gPSB1c2VTdGF0ZTx7IGF2YWlsYWJsZTogYm9vbGVhbjsgcHJvdmlkZXI/OiBzdHJpbmc7IG1vZGVsPzogc3RyaW5nOyBlcnJvcj86IHN0cmluZyB9IHwgbnVsbD4obnVsbCk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFnZXRIb3N0U3RhdHVzKSByZXR1cm47XG4gICAgbGV0IGFsaXZlID0gdHJ1ZTtcbiAgICBnZXRIb3N0U3RhdHVzKCkudGhlbigoc3QpID0+IHsgaWYgKGFsaXZlKSBzZXRIb3N0U3RhdHVzKHN0KTsgfSkuY2F0Y2goKCkgPT4geyBpZiAoYWxpdmUpIHNldEhvc3RTdGF0dXMoeyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogJ3JwYy1mYWlsZWQnIH0pOyB9KTtcbiAgICByZXR1cm4gKCkgPT4geyBhbGl2ZSA9IGZhbHNlOyB9O1xuICB9LCBbZ2V0SG9zdFN0YXR1c10pO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIGdldEVwb2NoKCksXG4gICAgKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIH0sIFtjb25maWcuYmFzZVVybCwgY29uZmlnLmFwaUtleSwgY29uZmlnLm1vZGVsLCBnZXRFcG9jaF0pO1xuXG4gIC8vIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1RkYwOFx1OTg4NFx1ODlDOFx1NTM2MVx1NjcyQVx1OTE0RFx1N0Y2RVx1NUYxNVx1NUJGQ1x1RkYwOVx1MjE5MiBcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3BlblNldHRpbmdzUmVxdWVzdCgoKSA9PiBzZXRFeHBhbmRlZCh0cnVlKSksIFtdKTtcblxuICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIGNvbnN0IGVycm9ycyA9IGFjdGlvbnMudmFsaWRhdGUodmFsdWVzKTtcbiAgICBpZiAoZXJyb3JzKSB7XG4gICAgICBhY3Rpb25zLmZhaWwoT2JqZWN0LnZhbHVlcyhlcnJvcnMpWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNhdmVDb25maWcodmFsdWVzKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgICAvLyBcdTRFMEVcdTY1NDhcdTVFOTRcdTU2REVcdThERDFcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTdFQUFcdTUxNDNcdUZGMDlcdTVCRjlcdTlGNTBcdUZGMENcdTRGN0ZcdTRGRERcdTVCNThcdTU0MEVcdTc2ODRcdTkxQ0RcdTY0QURcdTc5Q0RcdTg4QUJcdTYyOTFcdTUyMzZcbiAgICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5zYXZlRmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZXNldENvbmZpZygpO1xuICAgICAgYWN0aW9ucy5zZWVkKFxuICAgICAgICB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfSxcbiAgICAgICAgc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSxcbiAgICAgICk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5yZXNldEZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmXG4gICAgICAgICAgKHZhbHVlcy51c2VTZXNzaW9uTW9kZWwgPyAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+IFx1MDBCNyB7dCgnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCcpfTwvc3Bhbj5cbiAgICAgICAgICApIDogKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QodmFsdWVzLmFwaUtleSA/ICdjYXJkLmNvbmZpZ3VyZWQuaGludCcgOiAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCcpLnJlcGxhY2UoJ3ttb2RlbH0nLCBtb2RlbExhYmVsKX08L3NwYW4+XG4gICAgICAgICAgKSl9XG4gICAgICA8L2Rpdj5cblxuICAgICAge2V4cGFuZGVkICYmIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGb3JtXCI+XG4gICAgICAgICAge2dldEhvc3RTdGF0dXMgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiIHN0eWxlPXt7IGZsZXhEaXJlY3Rpb246ICdyb3cnIH19PlxuICAgICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIlxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgICAgICBjb2xvcjogaG9zdFN0YXR1cz8uYXZhaWxhYmxlID8gJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1zdWNjZXNzLXByaW1hcnksICMyZjllNjMpJyA6ICd2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCknLFxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWRzdy1hbGlhcy10ZXh0LXNlY29uZGFyeSwgIzhjOTNhMSknIH19PntgIFx1MDBCNyBidWlsZCAke0JVSUxEX0lEfWB9PC9zcGFuPlxuICAgICAgICAgICAgICAgIHtob3N0U3RhdHVzID09PSBudWxsXG4gICAgICAgICAgICAgICAgICA/IHQoJ3NldHRpbmdzLmhvc3RQcm9iZScpXG4gICAgICAgICAgICAgICAgICA6IGhvc3RTdGF0dXMuYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgID8gYCR7dCgnc2V0dGluZ3MuaG9zdE9rJyl9ICR7aG9zdFN0YXR1cy5wcm92aWRlcn0vJHtob3N0U3RhdHVzLm1vZGVsfWBcbiAgICAgICAgICAgICAgICAgICAgOiBgJHt0KCdzZXR0aW5ncy5ob3N0RmFpbCcpfSAke2hvc3RTdGF0dXMuZXJyb3IgPz8gJyd9YH1cbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICBjaGVja2VkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCd1c2VTZXNzaW9uTW9kZWwnLCBlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgLz57JyAnfVxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsJyl9XG4gICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50Jyl9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdiYXNlVXJsJywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1hcGkta2V5XCI+e3QoJ3NldHRpbmdzLmFwaUtleScpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWFwaS1rZXlcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHR5cGU9XCJwYXNzd29yZFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMuYXBpS2V5fVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cInNrLVx1MjAyNlwiXG4gICAgICAgICAgICAgIGF1dG9Db21wbGV0ZT1cIm9mZlwiXG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYXBpS2V5JywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1tb2RlbFwiPnt0KCdzZXR0aW5ncy5tb2RlbCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLW1vZGVsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLm1vZGVsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/ICdcdTIwMTQnIDogREVGQVVMVFMubW9kZWx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU2Nzg0XHU1RUZBIElEXHVGRjFBXHU1MzYwXHU0RjREXHU3QjI2XHU3NTMxIHNjcmlwdHMvYnVpbGQubWpzIFx1NTcyOFx1Njc4NFx1NUVGQVx1NjVGNlx1NjZGRlx1NjM2Mlx1NEUzQVx1NUY1M1x1NTI0RCBnaXQgXHU3N0VEXHU1NEM4XHU1RTBDXHVGRjA4XHU2NjNFXHU3OTNBXHU1NzI4XHU4QkJFXHU3RjZFXHU5NzYyXHU2NzdGXHVGRjBDXHU3ODZFXHU4QkE0XHU2ODRDXHU5NzYyXHU1MkEwXHU4RjdEXHU3Njg0XHU2NjJGXHU2NzAwXHU2NUIwIGRpc3RcdUZGMDlcdTMwMDIgKi9cbmV4cG9ydCBjb25zdCBCVUlMRF9JRCA9ICdfX0JVSUxEX0lEX18nO1xuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTUgc3RvcmVcdUZGMDhkZWZpbmVTdG9yZSBcdTg1ODRcdTVDMDFcdTg4QzVcdUZGMDlcdUZGMUFcdTgzNDlcdTdBM0YgKyBcdTY4MjFcdTlBOEMgKyBcdTRGRERcdTVCNThcdTUyQThcdTRGNUMgKi9cblxuaW1wb3J0IHsgZGVmaW5lU3RvcmUgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCc7XG5pbXBvcnQge1xuICBJTklUSUFMX1NFVFRJTkdTX0ZPUk0sXG4gIHJlZHVjZVNldHRpbmdzRm9ybSxcbiAgdmFsaWRhdGVTZXR0aW5nc0Zvcm0sXG4gIHR5cGUgU2V0dGluZ3NGb3JtU3RhdGUsXG4gIHR5cGUgU2V0dGluZ3NGb3JtVmFsdWVzLFxufSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybUFjdGlvbnMge1xuICBzZWVkKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZWRpdChmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgY29tbWl0KHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBmYWlsKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG4gIC8qKiBcdTRGRERcdTVCNThcdTUyNERcdTY4MjFcdTlBOENcdUZGMUJcdThGRDRcdTU2REVcdTk1MTlcdThCRUZcdTVCNTdcdTUxNzhcdUZGMUJcdTY1RTBcdTk1MTlcdThCRUZcdTY1RjZcdThGRDRcdTU2REUgbnVsbCAqL1xuICB2YWxpZGF0ZSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBudWxsO1xufVxuXG4vKiogZGVmaW5lU3RvcmUgXHU4RkQ0XHU1NkRFXHU3Njg0IHN0b3JlIFx1NTNFNVx1NjdDNFx1RkYwOFx1NTQwQ1x1NjVGNlx1NTNFRlx1NEY1Q1x1N0M3Qlx1NTc4Qlx1NTM2MFx1NEY0RFx1RkYwQ1x1NEY5Qlx1NkNFOFx1NTE4Q1x1NjVGNiBgc3RvcmU6YCBcdTRGN0ZcdTc1MjhcdUZGMDkgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGUge1xuICAvLyBcdThGRDBcdTg4NENcdTY1RjZcdTVGNjJcdTcyQjZcdTc1MzEgRFNIIFx1NjNEMFx1NEY5Qlx1RkYxQlx1NkI2NFx1NTkwNFx1NEVDNVx1NEUzQVx1NjU4N1x1Njg2M1x1NjAyN1x1N0M3Qlx1NTc4QlxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgPSAoKTogU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGUgPT4ge1xuICBjb25zdCBoYW5kbGUgPSBkZWZpbmVTdG9yZSh7XG4gICAgaW5pdDogKCk6IFNldHRpbmdzRm9ybVN0YXRlID0+ICh7XG4gICAgICAvLyBcdTZCQ0ZcdTVCOUVcdTRGOEJcdTUyNkZcdTY3MkNcdUZGMUFJTklUSUFMX1NFVFRJTkdTX0ZPUk0gXHU2NjJGXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjBDXHU1MkZGXHU4REU4XHU1QjlFXHU0RjhCXHU1MTcxXHU0RUFCXHU1RjE1XHU3NTI4XHVGRjA4cmVkdWNlciBcdTc2ODQgZHJhZnQgXHU1MTk5XHU1MTY1XHU5NzAwXHU1M0Q3XHU0RkREXHU2MkE0XHVGRjA5XG4gICAgICAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0sXG4gICAgICB2YWx1ZXM6IHsgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLnZhbHVlcyB9LFxuICAgIH0pLFxuICAgIGFjdGlvbnM6IHtcbiAgICAgIHNlZWQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ3NlZWQnLCB2YWx1ZXMsIHJldmlzaW9uIH0pKSxcbiAgICAgIGVkaXQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZWRpdCcsIGZpZWxkLCB2YWx1ZSB9KSksXG4gICAgICBjb21taXQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnY29tbWl0JywgcmV2aXNpb24gfSkpLFxuICAgICAgZmFpbDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBtZXNzYWdlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2ZhaWwnLCBtZXNzYWdlIH0pKSxcbiAgICAgIHZhbGlkYXRlOiAoX2Q6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcykgPT4ge1xuICAgICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXMpO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JzKS5sZW5ndGggPT09IDAgPyBudWxsIDogZXJyb3JzO1xuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIGhhbmRsZSBhcyBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1XHU2ODIxXHU5QThDIFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVZhbHVlcyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG4gIC8qKiB0cnVlXHVGRjFBXHU0RjE4XHU1MzE2XHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCZmFsc2VcdUZGMUFcdTRGN0ZcdTc1MjggbW9kZWwgKi9cbiAgdXNlU2Vzc2lvbk1vZGVsOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgY29uc3QgdXJsID0gdmFsdWVzLmJhc2VVcmwudHJpbSgpO1xuICBpZiAoIXVybCkge1xuICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1ID0gbmV3IFVSTCh1cmwpO1xuICAgICAgaWYgKHUucHJvdG9jb2wgIT09ICdodHRwczonICYmIHUucHJvdG9jb2wgIT09ICdodHRwOicpIHRocm93IG5ldyBFcnJvcigncHJvdG9jb2wnKTtcbiAgICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF2YWx1ZXMuYXBpS2V5LnRyaW0oKSkgZXJyb3JzLmFwaUtleSA9ICdzZXR0aW5ncy5hcGlLZXknO1xuICBpZiAoIXZhbHVlcy51c2VTZXNzaW9uTW9kZWwgJiYgIXZhbHVlcy5tb2RlbC50cmltKCkpIGVycm9ycy5tb2RlbCA9ICdzZXR0aW5ncy5tb2RlbCc7XG5cbiAgcmV0dXJuIGVycm9ycztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzO1xuICBkaXJ0eTogYm9vbGVhbjtcbiAgc2F2ZWQ6IGJvb2xlYW47XG4gIGVycm9yOiBzdHJpbmcgfCBudWxsO1xuICByZXZpc2lvbjogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgSU5JVElBTF9TRVRUSU5HU19GT1JNOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9IHtcbiAgdmFsdWVzOiB7IGJhc2VVcmw6ICcnLCBhcGlLZXk6ICcnLCBtb2RlbDogJycsIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSB9LFxuICBkaXJ0eTogZmFsc2UsXG4gIHNhdmVkOiBmYWxzZSxcbiAgZXJyb3I6IG51bGwsXG4gIHJldmlzaW9uOiAtMSxcbn07XG5cbmV4cG9ydCB0eXBlIFNldHRpbmdzRm9ybUFjdGlvbiA9XG4gIHwgeyB0eXBlOiAnc2VlZCc7IHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdlZGl0JzsgZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlczsgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfVxuICB8IHsgdHlwZTogJ2NvbW1pdCc7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBtZXNzYWdlOiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVNldHRpbmdzRm9ybShzdGF0ZTogU2V0dGluZ3NGb3JtU3RhdGUsIGFjdGlvbjogU2V0dGluZ3NGb3JtQWN0aW9uKTogU2V0dGluZ3NGb3JtU3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnc2VlZCc6XG4gICAgICByZXR1cm4gYWN0aW9uLnJldmlzaW9uIDw9IHN0YXRlLnJldmlzaW9uXG4gICAgICAgID8gc3RhdGVcbiAgICAgICAgOiB7IC4uLnN0YXRlLCB2YWx1ZXM6IHsgLi4uYWN0aW9uLnZhbHVlcyB9LCBkaXJ0eTogZmFsc2UsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdlZGl0JzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCB2YWx1ZXM6IHsgLi4uc3RhdGUudmFsdWVzLCBbYWN0aW9uLmZpZWxkXTogYWN0aW9uLnZhbHVlIH0sIGRpcnR5OiB0cnVlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsIH07XG4gICAgY2FzZSAnY29tbWl0JzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBkaXJ0eTogZmFsc2UsIHNhdmVkOiB0cnVlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGVycm9yOiBhY3Rpb24ubWVzc2FnZSB9O1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDVU8sSUFBTSxXQUF5QjtBQUFBLEVBQ3BDLFNBQVM7QUFBQSxFQUNULFFBQVE7QUFBQSxFQUNSLE9BQU87QUFBQSxFQUNQLGlCQUFpQjtBQUNuQjtBQUlPLFNBQVMsaUJBQWlCLEtBQXFCO0FBQ3BELFNBQU8sSUFBSSxLQUFLLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFDdEM7QUFFTyxTQUFTLFlBQVksS0FBNkQ7QUFDdkYsUUFBTSxVQUFVLE9BQU8sS0FBSyxZQUFZLFlBQVksSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLFNBQVM7QUFDdkcsUUFBTSxTQUFTLE9BQU8sS0FBSyxXQUFXLFdBQVcsSUFBSSxTQUFTLFNBQVM7QUFHdkUsUUFBTSxXQUFXLE9BQU8sS0FBSyxVQUFVLFlBQVksSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxJQUFJLFNBQVM7QUFDbEcsUUFBTSxrQkFDSixhQUFhLG1CQUFtQixpQkFBaUIsT0FBTyxNQUFNLFNBQVMsVUFBVSxT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QUFBQSxZQUNiLFdBQVcsTUFBTTtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsWUFDaEIsZUFBZSxZQUFZO0FBRXpCLGtCQUFJO0FBQ0Ysc0JBQU0sTUFBTSxNQUFNO0FBQUEsa0JBQ2hCLElBQUksV0FBVyxJQUFJLEtBQUsseUJBQXlCLGdCQUFnQixDQUFDLENBQUM7QUFBQSxrQkFDbkU7QUFBQSxrQkFDQTtBQUFBLGdCQUNGO0FBQ0Esb0JBQUksSUFBSSxNQUFNLElBQUksU0FBUyxPQUFPLElBQUksVUFBVSxVQUFVO0FBQ3hELHdCQUFNLElBQUksSUFBSTtBQUNkLHNCQUFJLE9BQU8sRUFBRSxhQUFhLFlBQVksT0FBTyxFQUFFLFVBQVUsVUFBVTtBQUNqRSwyQkFBTyxFQUFFLFdBQVcsTUFBTSxVQUFVLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTTtBQUFBLGtCQUNqRTtBQUNBLHlCQUFPLEVBQUUsV0FBVyxPQUFPLE9BQVEsSUFBSSxVQUFVLElBQUksTUFBTSxXQUFXLElBQUksTUFBTSxTQUFVLFdBQVc7QUFBQSxnQkFDdkc7QUFDQSx1QkFBTyxFQUFFLFdBQVcsT0FBTyxPQUFRLElBQUksVUFBVSxJQUFJLE1BQU0sV0FBVyxJQUFJLE1BQU0sU0FBVSxhQUFhO0FBQUEsY0FDekcsU0FBUyxHQUFHO0FBQ1YsdUJBQU8sRUFBRSxXQUFXLE9BQU8sT0FBTyxPQUFRLEdBQTZCLFdBQVcsQ0FBQyxFQUFFO0FBQUEsY0FDdkY7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFHRCxRQUFNLFlBQVksQ0FBQyxNQUFxQjtBQUN0QyxRQUFJLENBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxPQUFRO0FBQ3BDLFVBQU0sS0FBSyxTQUFTO0FBQ3BCLFFBQUksRUFBRSxjQUFjLHFCQUFzQjtBQUMxQyxNQUFFLGVBQWU7QUFDakIsd0JBQW9CO0FBQUEsRUFDdEI7QUFDQSxXQUFTLGlCQUFpQixXQUFXLFNBQVM7QUFDaEQ7IiwKICAibmFtZXMiOiBbInN0YXRlIiwgIlJlYWN0IiwgImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJzdGF0ZSIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiXQp9Cg==

    return module.exports;
  }
});
