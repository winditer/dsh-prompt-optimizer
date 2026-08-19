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

// src/debug-probe.ts
var probe = {
  clicks: 0,
  lastClickAt: "",
  lastStep: "",
  lastError: ""
};

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
  probe.lastStep = "run";
  probe.lastError = "";
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
        onStep: (step) => {
          probe.lastStep = step;
          dispatchPreview({ type: "step", step });
        },
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
          probe.lastStep = "";
          probe.lastError = String(e?.message ?? e);
          dispatchPreview({ type: "fail", kind, detail: probe.lastError });
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
    probe.clicks += 1;
    probe.lastClickAt = (/* @__PURE__ */ new Date()).toISOString();
    if (busy) {
      probe.lastError = "busy";
      probe.lastStep = "";
      return;
    }
    const draft = draftRef.current || readDraft();
    if (!draft.trim()) {
      probe.lastError = "empty-draft";
      probe.lastStep = "";
      return;
    }
    probe.lastError = "";
    void runOptimize({
      getConfig,
      getLang,
      getDraft: () => draft,
      getSessionModel,
      getHost,
      getSessionId,
      trace: (msg) => console.warn("[dsh-prompt-optimizer]", msg)
    });
  }, [busy, getConfig, getLang]);
  (0, import_react.useEffect)(() => onOptimizeRequest(handleClick), [handleClick]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: "6px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dsh-po-btn",
        "aria-label": t("button.aria"),
        title: `${t("button.aria")} | clicks:${probe.clicks} step:${probe.lastStep || "-"} err:${probe.lastError || "-"}`,
        "aria-busy": busy,
        disabled: busy,
        "data-busy": busy,
        onMouseDown: syncDraft,
        onFocus: syncDraft,
        onClick: handleClick,
        children: busy ? "\u23F3" : "\u2728"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "span",
      {
        style: {
          fontSize: "10px",
          lineHeight: 1,
          color: "var(--dsw-alias-text-secondary, #8c93a1)",
          userSelect: "none",
          whiteSpace: "nowrap"
        },
        children: probe.clicks > 0 ? `c${probe.clicks}${probe.lastStep ? ` ${probe.lastStep}` : ""}` : ""
      }
    )
  ] });
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
var BUILD_ID = "dda3fc7";

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
  const [, force] = (0, import_react3.useState)(0);
  (0, import_react3.useEffect)(() => {
    const timer = setInterval(() => force((n) => n + 1), 1e3);
    return () => clearInterval(timer);
  }, []);
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
      getHostStatus && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsField", style: { flexDirection: "row" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", style: { color: "var(--dsw-alias-text-secondary, #8c93a1)" }, children: [
          "clicks: ",
          probe.clicks,
          probe.lastClickAt ? ` \xB7 ${probe.lastClickAt.slice(11, 19)}` : "",
          probe.lastStep ? ` \xB7 step: ${probe.lastStep}` : "",
          probe.lastError ? ` \xB7 err: ${probe.lastError}` : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
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
        )
      ] }),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9zZXNzaW9uLW9wdGltaXplci50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvcHJldmlldy1idXMudHMiLCAiLi4vc3JjL2RlYnVnLXByb2JlLnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXItc3RvcmUudHMiLCAiLi4vc3JjL1ByZXZpZXdDYXJkLnRzeCIsICIuLi9zcmMvU2V0dGluZ3NSb3cudHN4IiwgIi4uL3NyYy9idWlsZC1pZC50cyIsICIuLi9zcmMvc2V0dGluZ3Mtc3RvcmUudHMiLCAiLi4vc3JjL3NldHRpbmdzLWZvcm0tc3RhdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKiBkc2gtcHJvbXB0LW9wdGltaXplciBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyMDE0IGFwcGx5KGN0eCkgKi9cblxuaW1wb3J0IHR5cGUgeyBDbGllbnRDb250ZXh0IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUywgbWVyZ2VDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBOUywgemgsIGVuLCBsYW5nT2YgfSBmcm9tICcuL2xvY2FsZXMuanMnO1xuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZW1pdE9wdGltaXplUmVxdWVzdCwgZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5pbXBvcnQgeyBPcHRpbWl6ZUJ1dHRvbiB9IGZyb20gJy4vT3B0aW1pemVCdXR0b24udHN4JztcbmltcG9ydCB7IFByZXZpZXdDYXJkIH0gZnJvbSAnLi9QcmV2aWV3Q2FyZC50c3gnO1xuaW1wb3J0IHsgU2V0dGluZ3NSb3cgfSBmcm9tICcuL1NldHRpbmdzUm93LnRzeCc7XG5pbXBvcnQgeyBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHR5cGUgeyBIb3N0UnBjIH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5pbXBvcnQgeyB3aXRoVGltZW91dCwgY2FsbEhvc3QgfSBmcm9tICcuL3Nlc3Npb24tb3B0aW1pemVyLmpzJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ2Nvbm5lY3Rpb24nXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMUFcdTgxRUFcdTYzMDEgUlBDIFx1OTE0RFx1N0Y2RVx1RkYwOHNlcnZlciBoYWxmIFx1OEJGQlx1NTE5OSB+Ly5kc2gvcHJvbXB0LW9wdGltaXplci1jb25maWcuanNvblx1RkYwQ1x1OTAxQVx1OTA1M1xuICAvLyAnL2RzaC1wcm9tcHQtb3B0aW1pemVyJ1x1MjAxNFx1MjAxNFx1NTQwQyBkc2gtc3RpY2t5LW5vdGUgXHU2QTIxXHU1RjBGXHVGRjA5XHUzMDAyXHU0RTBEXHU3NTI4IHNldHRpbmdzU2NvcGVcdUZGMUFcdTY4NENcdTk3NjJcdTVFOTRcdTc1MjhcdTc2ODQgaG9zdFxuICAvLyBzZXR0aW5ncyBcdTZDRThcdTUxOENcdTg4NjhcdTVCRjlcdTY3MkFcdTZDRThcdTUxOEMgbmFtZXNwYWNlIFx1OEZENFx1NTZERSB1bmF2YWlsYWJsZVx1RkYwQ3NldCBcdTk3NTlcdTlFRDhcdTU5MzFcdTY1NDhcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgbGV0IGNvbmZpZ01pcnJvcjogUHJvbXB0Q29uZmlnID0gbWVyZ2VDb25maWcodW5kZWZpbmVkKTtcbiAgbGV0IGNvbmZpZ0Vwb2NoID0gMDtcbiAgY29uc3QgcnBjQ29uZmlnID0gYXN5bmMgKGVuZHBvaW50OiBzdHJpbmcsIHBheWxvYWQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN0eC5jb25uZWN0aW9uLnJwYy5jYWxsKCcvZHNoLXByb21wdC1vcHRpbWl6ZXInLCBlbmRwb2ludCwgcGF5bG9hZCA/PyB7fSk7XG4gICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYGNvbmZpZyBycGMgJHtlbmRwb2ludH0gZmFpbGVkOiAkeyhyZXN1bHQuZXJyb3IgJiYgKHJlc3VsdC5lcnJvci5kZXRhaWxzIHx8IHJlc3VsdC5lcnJvci5jb2RlKSkgfHwgJ3JwYyBmYWlsZWQnfWAsXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuICBjb25zdCBsb2FkQ29uZmlnID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHJwY0NvbmZpZygnZ2V0Jyk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyh2YWx1ZSBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjFEXHU2QjIxXHU4RkRFXHU2M0E1XHU2NzJBXHU1QzMxXHU3RUVBXHU2NUY2XHU0RkREXHU2MzAxXHU5RUQ4XHU4QkE0XHVGRjFCXHU0RTBCXHU2QjIxXHU0RkREXHU1QjU4XHU1NDBFXHU5NTVDXHU1MENGXHU1MzczXHU2NkY0XHU2NUIwXG4gICAgfVxuICB9O1xuICB2b2lkIGxvYWRDb25maWcoKTtcblxuICAvLyAyLjUgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU4OUUzXHU2NzkwXHVGRjFBXHU1MTQ4XHU1M0Q2XHU2RkMwXHU2RDNCXHU0RjFBXHU4QkREIGlkXHVGRjA4c2Vzc2lvbnMuY3VycmVudFByb3ZpZGVJbmZvXHVGRjA5XHVGRjBDXG4gIC8vIFx1NTE4RFx1NjdFNSBzZXNzaW9uLm1vZGVscyBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjIwIHNlc3Npb25JZCBcdTY1RjZcdTY3MERcdTUyQTFcdTdBRUZcdTU2REVcdTkwMDBcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEIgYnVnXHVGRjA5XG4gIGNvbnN0IGdldEFjdGl2ZVNlc3Npb24gPSAoKTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgY29uc3QgaW5mbyA9IChcbiAgICAgIGN0eC5zZXNzaW9ucyBhcyB7XG4gICAgICAgIGN1cnJlbnRQcm92aWRlSW5mbz86IHsgZ2V0U25hcHNob3Q/OiAoKSA9PiB7IHNlc3Npb25JZD86IHN0cmluZyB9IH07XG4gICAgICB9IHwgdW5kZWZpbmVkXG4gICAgKT8uY3VycmVudFByb3ZpZGVJbmZvPy5nZXRTbmFwc2hvdD8uKCk7XG4gICAgY29uc3Qgc2Vzc2lvbklkID0gaW5mbz8uc2Vzc2lvbklkO1xuICAgIHJldHVybiB0eXBlb2Ygc2Vzc2lvbklkID09PSAnc3RyaW5nJyAmJiBzZXNzaW9uSWQubGVuZ3RoID4gMCA/IHNlc3Npb25JZCA6IG51bGw7XG4gIH07XG4gIC8vIDIuNiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDhcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEIgKyBzZXJ2ZXIgXHU1MzRBIGxsbS5zdHJlYW1cdUZGMENcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdUZGMUFcbiAgLy8gXHU5MDFBXHU5MDUzXHU1MzczXHU4MUVBXHU2NzA5IFJQQ1x1RkYwOC9kc2gtcHJvbXB0LW9wdGltaXplclx1RkYwOVx1RkYxQnNlcnZlciBoYWxmIFx1NzUyOCBhZ2VudERlZmF1bHRNb2RlbCBcdTUzRDZcdTVGNTNcdTUyNERcbiAgLy8gXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHUzMDAxbGxtLnN0cmVhbSBcdTc3MUZcdTZENDFcdTVGMEZcdUZGMDhcdTUzRDZcdTgxRUEgZHNoLWVsZiBcdTVERjJcdTlBOENcdThCQzFcdTc2ODRcdTVCQkZcdTRFM0JcdTY3MERcdTUyQTFcdTk3NjJcdUZGMDlcdTMwMDJcdTRFMERcdTc1Mjggc2Vzc2lvbi5jcmVhdGUvXG4gIC8vIGZvcmtcdUZGMUFcdTU0MEVcdTUzRjBcdTRGMUFcdThCRERcdTRFMERcdTU3MjhcdTUyNERcdTUzRjBcdTRFMERcdTg5RTZcdTUzRDFcdTZBMjFcdTU3OEJcdTYyNjdcdTg4NENcdUZGMENcdTgxRUFcdTdGMTYgaWQgXHU4OEFCXHU5NzU5XHU5RUQ4XHU2MkQyXHU3RUREIFx1MjE5MiBcdTMwMENcdTZDMzhcdThGRENcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTMwMERcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcdTMwMDJcbiAgY29uc3QgaG9zdFJwYzogSG9zdFJwYyA9IHtcbiAgICBjYWxsOiAoZW5kcG9pbnQsIHBheWxvYWQpID0+IGNhbGxIb3N0KGVuZHBvaW50LCBwYXlsb2FkID8/IHt9KSxcbiAgfTtcbiAgY29uc3QgZ2V0SG9zdCA9ICgpOiB7IHJwYzogSG9zdFJwYyB9ID0+ICh7IHJwYzogaG9zdFJwYyB9KTtcbiAgY29uc3QgZ2V0U2Vzc2lvbk1vZGVsID0gYXN5bmMgKCk6IFByb21pc2U8eyBwcm92aWRlcjogc3RyaW5nOyBtb2RlbDogc3RyaW5nIH0gfCBudWxsPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHdpdGhUaW1lb3V0KGNhbGxIb3N0KCdzZXNzaW9uTW9kZWwnLCB7fSksIDUwMDAsICdzZXNzaW9uTW9kZWwnKTtcbiAgICAgIGlmIChyZXMub2sgJiYgcmVzLnZhbHVlICYmIHR5cGVvZiByZXMudmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGNvbnN0IHYgPSByZXMudmFsdWUgYXMgeyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmcgfTtcbiAgICAgICAgaWYgKHR5cGVvZiB2LnByb3ZpZGVyID09PSAnc3RyaW5nJyAmJiB0eXBlb2Ygdi5tb2RlbCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICByZXR1cm4geyBwcm92aWRlcjogdi5wcm92aWRlciwgbW9kZWw6IHYubW9kZWwgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi41YiBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTRGMUFcdThCRERcdTdFRDFcdTVCOUFcdUZGMUFcdTUzNjFcdTcyNDdcdTUzRUFcdTU3MjhcdTUzRDFcdThENzdcdTRGMUFcdThCRERcdTY2M0VcdTc5M0FcdUZGMDhcdTUyMDdcdThENzBcdTRFMERcdThEREZcdTk2OEZcdUZGMDlcbiAgY29uc3QgZ2V0U2Vzc2lvbklkID0gKCk6IHN0cmluZyB8IG51bGwgPT4gZ2V0QWN0aXZlU2Vzc2lvbigpO1xuXG4gIC8vIDMuIFx1OEJFRFx1OEEwMFx1OTU1Q1x1NTBDRlxuICBsZXQgbGFuZzogTGFuZyA9IGxhbmdPZihjdHgubG9jYWxlLmdldExvY2FsZSgpLmFjdGl2ZSk7XG4gIGN0eC5vbignbG9jYWxlL2NoYW5nZScsIChzbmFwOiB7IGFjdGl2ZTogc3RyaW5nIH0pID0+IHtcbiAgICBsYW5nID0gbGFuZ09mKHNuYXAuYWN0aXZlKTtcbiAgfSk7XG5cbiAgLy8gNC4gXHU0RjFBXHU4QkREXHU2OUZEXHU0RjREXHVGRjFBXHU2MzA5XHU5NEFFICsgXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XG4gIGN0eC5pbmplY3QoWydzbG90cycsICdzZXNzaW9ucyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1idXR0b24nLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgICAgICAgICAgZ2V0SG9zdCxcbiAgICAgICAgICAgIGdldFNlc3Npb25JZCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3B0aW1pemVCdXR0b24sXG4gICAgICApLFxuICAgICk7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWNhcmQnLFxuICAgICAgICAgIG9yZGVyOiAxMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIG9wZW5TZXR0aW5nczogKCkgPT4gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKSxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICAgIGdldEhvc3QsXG4gICAgICAgICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFByZXZpZXdDYXJkLFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA2LiBcdThCQkVcdTdGNkVcdTg4NENcdUZGMDhyb290IFx1NEY1Q1x1NzUyOFx1NTdERlx1RkYwOVxuICBjb25zdCBzZXR0aW5nc1N0b3JlID0gY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUoKTtcbiAgY29uc3Qgc2F2ZUNvbmZpZyA9IGFzeW5jIChyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPik6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgIGNvbnN0IG1lcmdlZCA9IG1lcmdlQ29uZmlnKHsgLi4uY29uZmlnTWlycm9yLCAuLi5yYXcgfSk7XG4gICAgY29uc3Qgd3JpdHRlbjogUHJvbXB0Q29uZmlnID0ge1xuICAgICAgYmFzZVVybDogbWVyZ2VkLmJhc2VVcmwsXG4gICAgICBhcGlLZXk6IG1lcmdlZC5hcGlLZXkudHJpbSgpLFxuICAgICAgbW9kZWw6IG1lcmdlZC5tb2RlbCxcbiAgICAgIHVzZVNlc3Npb25Nb2RlbDogbWVyZ2VkLnVzZVNlc3Npb25Nb2RlbCxcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYXZlZCA9IGF3YWl0IHJwY0NvbmZpZygnc2V0Jywge1xuICAgICAgICBwYXRjaDoge1xuICAgICAgICAgIGJhc2VVcmw6IHdyaXR0ZW4uYmFzZVVybCxcbiAgICAgICAgICBhcGlLZXk6IHdyaXR0ZW4uYXBpS2V5LFxuICAgICAgICAgIG1vZGVsOiB3cml0dGVuLm1vZGVsLFxuICAgICAgICAgIHVzZVNlc3Npb25Nb2RlbDogd3JpdHRlbi51c2VTZXNzaW9uTW9kZWwsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVzZXRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCxcbiAgICAgICAgICBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogREVGQVVMVFMubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG5cbiAgY3R4LmluamVjdChbJ3Nsb3RzJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLXNldHRpbmdzJyxcbiAgICAgICAgICBvcmRlcjogMzAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBzdG9yZTogc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIHNhdmVDb25maWcsXG4gICAgICAgICAgICByZXNldENvbmZpZyxcbiAgICAgICAgICAgIGdldEVwb2NoOiAoKSA9PiBjb25maWdFcG9jaCxcbiAgICAgICAgICAgIGdldEhvc3RTdGF0dXM6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgLy8gXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU4MUVBXHU2OEMwXHVGRjFBXHU5NkY2XHU5MTREXHU3RjZFXHU2QTIxXHU1RjBGXHU4MEZEXHU1NDI2XHU0RUNFIHNlcnZlciBoYWxmIFx1NjJGRlx1NTIzMFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4QlxuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHdpdGhUaW1lb3V0KGNhbGxIb3N0KCdzZXNzaW9uTW9kZWwnLCB7fSksIDUwMDAsICdzZXNzaW9uTW9kZWwnKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSAmJiB0eXBlb2YgcmVzLnZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgdiA9IHJlcy52YWx1ZSBhcyB7IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZyB9O1xuICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2LnByb3ZpZGVyID09PSAnc3RyaW5nJyAmJiB0eXBlb2Ygdi5tb2RlbCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiB0cnVlLCBwcm92aWRlcjogdi5wcm92aWRlciwgbW9kZWw6IHYubW9kZWwgfTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogZmFsc2UsIGVycm9yOiAocmVzLmVycm9yICYmIChyZXMuZXJyb3IuZGV0YWlscyA/PyByZXMuZXJyb3IuY29kZSkpIHx8ICduby1tb2RlbCcgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6IChyZXMuZXJyb3IgJiYgKHJlcy5lcnJvci5kZXRhaWxzID8/IHJlcy5lcnJvci5jb2RlKSkgfHwgJ3JwYy1mYWlsZWQnIH07XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBhdmFpbGFibGU6IGZhbHNlLCBlcnJvcjogU3RyaW5nKChlIGFzIHsgbWVzc2FnZT86IHVua25vd24gfSk/Lm1lc3NhZ2UgPz8gZSkgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgU2V0dGluZ3NSb3csXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDcuIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYxQUFsdCtPXHVGRjA4XHU3MTI2XHU3MEI5XHU1NzI4IHRleHRhcmVhIFx1NTE4NVx1NjVGNlx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1RkYwOVxuICBjb25zdCBvbktleWRvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGlmICghZS5hbHRLZXkgfHwgZS5jb2RlICE9PSAnS2V5TycpIHJldHVybjtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlbWl0T3B0aW1pemVSZXF1ZXN0KCk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pO1xufVxuXG4vLyBcdTVGMTVcdTc1MjhcdTVCODhcdTUzNkJcdUZGMUFcdTkwN0ZcdTUxNEQgdHJlZS1zaGFrZSBcdTYzODlcdTdDN0JcdTU3OEJcdUZGMDhcdTRFQzVcdTY1ODdcdTY4NjNcdTYwMjdcdUZGMUJcdTY1RTBcdThGRDBcdTg4NENcdTY1RjZcdTg4NENcdTRFM0FcdUZGMDlcbmV4cG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9OyIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjgzOFx1NUZDM1x1RkYxQVx1OTE0RFx1N0Y2RVx1NjgyMVx1OUE4Q1x1MzAwMU9wZW5BSSBcdTUxN0NcdTVCQjlcdThDMDNcdTc1MjhcdTMwMDFcdTdFRDNcdTY3OUNcdTYzRDBcdTUzRDYgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1OTZGNiBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvbXB0Q29uZmlnIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdUZGMUFcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUUzogUHJvbXB0Q29uZmlnID0ge1xuICBiYXNlVXJsOiAnaHR0cHM6Ly9hcGkuZGVlcHNlZWsuY29tJyxcbiAgYXBpS2V5OiAnJyxcbiAgbW9kZWw6ICdkZWVwc2Vlay12NC1mbGFzaCcsXG4gIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbn07XG5cbmV4cG9ydCB0eXBlIExhbmcgPSAnemgnIHwgJ2VuJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJhc2VVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdXJsLnRyaW0oKS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQ29uZmlnKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IFByb21wdENvbmZpZyB7XG4gIGNvbnN0IGJhc2VVcmwgPSB0eXBlb2YgcmF3Py5iYXNlVXJsID09PSAnc3RyaW5nJyAmJiByYXcuYmFzZVVybC50cmltKCkgPyByYXcuYmFzZVVybC50cmltKCkgOiBERUZBVUxUUy5iYXNlVXJsO1xuICBjb25zdCBhcGlLZXkgPSB0eXBlb2YgcmF3Py5hcGlLZXkgPT09ICdzdHJpbmcnID8gcmF3LmFwaUtleSA6IERFRkFVTFRTLmFwaUtleTtcbiAgLy8gXHU2NUU3XHU5RUQ4XHU4QkE0XHU4RkMxXHU3OUZCXHVGRjFBXHU5RUQ4XHU4QkE0IGJhc2VVcmwgXHU0RTBCXHU2QjhCXHU3NTU5XHU3Njg0IGRlZXBzZWVrLWNoYXRcdUZGMDh2MSBcdTlFRDhcdThCQTRcdUZGMDlcdTg5QzZcdTRFM0FcdTY3MkFcdThCQkVcdTdGNkVcdUZGMENcdTg0M0RcdTUyMzBcdTY1QjBcdTlFRDhcdThCQTQgZGVlcHNlZWstdjQtZmxhc2hcdUZGMUJcbiAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU4RkM3IGJhc2VVcmxcdUZGMDhcdTY2M0VcdTVGMEZcdTkwMDlcdTYyRTlcdUZGMDlcdTUyMTlcdTRGRERcdTc1NTlcdTUzOUZcdTZBMjFcdTU3OEJcdTU0MERcbiAgY29uc3QgcmF3TW9kZWwgPSB0eXBlb2YgcmF3Py5tb2RlbCA9PT0gJ3N0cmluZycgJiYgcmF3Lm1vZGVsLnRyaW0oKSA/IHJhdy5tb2RlbC50cmltKCkgOiBERUZBVUxUUy5tb2RlbDtcbiAgY29uc3QgbWlncmF0ZWREZWZhdWx0ID1cbiAgICByYXdNb2RlbCA9PT0gJ2RlZXBzZWVrLWNoYXQnICYmIG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCkgPT09IERFRkFVTFRTLmJhc2VVcmwgPyBERUZBVUxUUy5tb2RlbCA6IHJhd01vZGVsO1xuICBjb25zdCBtb2RlbCA9IG1pZ3JhdGVkRGVmYXVsdDtcbiAgY29uc3QgdXNlU2Vzc2lvbk1vZGVsID0gdHlwZW9mIHJhdz8udXNlU2Vzc2lvbk1vZGVsID09PSAnYm9vbGVhbicgPyByYXcudXNlU2Vzc2lvbk1vZGVsIDogREVGQVVMVFMudXNlU2Vzc2lvbk1vZGVsO1xuICByZXR1cm4geyBiYXNlVXJsOiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpLCBhcGlLZXksIG1vZGVsLCB1c2VTZXNzaW9uTW9kZWwgfTtcbn1cblxuZXhwb3J0IHR5cGUgQ29uZmlnUHJvYmxlbSA9ICdtaXNzaW5nLWtleScgfCAnbWlzc2luZy1tb2RlbCcgfCAnYmFkLXVybCc7XG5leHBvcnQgdHlwZSBDb25maWdDaGVjayA9IHsgb2s6IHRydWU7IGNvbmZpZzogUHJvbXB0Q29uZmlnIH0gfCB7IG9rOiBmYWxzZTsgcmVhc29uOiBDb25maWdQcm9ibGVtIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZyhjb25maWc6IFByb21wdENvbmZpZyk6IENvbmZpZ0NoZWNrIHtcbiAgaWYgKCFjb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLWtleScgfTtcbiAgLy8gXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2NUY2XHU2NUUwXHU5NzAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjFCXHU0RUM1XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1RjBGXHU4OTgxXHU2QzQyIG1vZGVsIFx1OTc1RVx1N0E3QVxuICBpZiAoIWNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgIWNvbmZpZy5tb2RlbC50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1tb2RlbCcgfTtcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKSk7XG4gICAgaWYgKHUucHJvdG9jb2wgIT09ICdodHRwczonICYmIHUucHJvdG9jb2wgIT09ICdodHRwOicpIHRocm93IG5ldyBFcnJvcigncHJvdG9jb2wnKTtcbiAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdiYWQtdXJsJyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBjb25maWcgfTtcbn1cblxuY29uc3QgWkhfU1lTVEVNID1cbiAgJ1x1NEY2MFx1NjYyRlx1NEUwMFx1NTQwRCBwcm9tcHQgXHU0RjE4XHU1MzE2XHU0RTEzXHU1QkI2XHUzMDAyXHU3NTI4XHU2MjM3XHU0RjFBXHU3RUQ5XHU0RjYwXHU0RTAwXHU2QkI1XHU4MzQ5XHU3QTNGIHByb21wdFx1RkYwQ1x1OEJGN1x1NTcyOFx1NEUwRFx1NjUzOVx1NTNEOFx1NTE3Nlx1NjEwRlx1NTZGRVx1NzY4NFx1NTI0RFx1NjNEMFx1NEUwQlx1NUMwNlx1NTE3Nlx1NjUzOVx1NTE5OVx1NEUzQVx1NjZGNFx1NkUwNVx1NjY3MFx1MzAwMVx1NjZGNFx1N0VEM1x1Njc4NFx1NTMxNlx1NzY4NFx1OUFEOFx1OEQyOFx1OTFDRiBwcm9tcHRcdUZGMUEnICtcbiAgJ1x1ODg2NVx1NTE0NVx1N0YzQVx1NTkzMVx1NzY4NFx1NzZFRVx1NjgwN1x1MzAwMVx1N0VBNlx1Njc1Rlx1NEUwRVx1NjcxRlx1NjcxQlx1OEY5M1x1NTFGQVx1NjgzQ1x1NUYwRlx1RkYwOFx1NTNFRlx1NEVDRVx1NEUwQVx1NEUwQlx1NjU4N1x1NTQwOFx1NzQwNlx1NjNBOFx1NjVBRFx1RkYwOVx1RkYwQ1x1NEY3Rlx1NzUyOFx1N0I4MFx1NkQwMVx1NjYwRVx1Nzg2RVx1NzY4NFx1OEJFRFx1OEEwMFx1RkYwQ1x1NTNCQlx1NjM4OVx1NTE5N1x1NEY1OVx1MzAwMicgK1xuICAnXHU0RTBEXHU1Rjk3XHU3RjE2XHU5MDIwXHU4MzQ5XHU3QTNGXHU0RTJEXHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU0RThCXHU1QjlFXHU2MjE2XHU2MjgwXHU2NzJGXHU3RUM2XHU4MjgyXHUzMDAyXHU1M0VBXHU4RjkzXHU1MUZBXHU0RjE4XHU1MzE2XHU1NDBFXHU3Njg0IHByb21wdCBcdTZCNjNcdTY1ODdcdUZGMENcdTRFMERcdTg5ODFcdTRFRkJcdTRGNTVcdTg5RTNcdTkxQ0FcdTMwMDFcdTUyNERcdTdGMDBcdTYyMTZcdTRFRTNcdTc4MDFcdTU3NTdcdTUzMDVcdTg4RjlcdTMwMDInO1xuXG5jb25zdCBFTl9TWVNURU0gPVxuICAnWW91IGFyZSBhIHByb21wdCBvcHRpbWl6YXRpb24gZXhwZXJ0LiBSZXdyaXRlIHRoZSB1c2VyXFwncyBkcmFmdCBwcm9tcHQgaW50byBhIGNsZWFyZXIsIG1vcmUgc3RydWN0dXJlZCwgaGlnaC1xdWFsaXR5IHByb21wdCAnICtcbiAgJ3dpdGhvdXQgY2hhbmdpbmcgaXRzIGludGVudDogZmlsbCBpbiBtaXNzaW5nIGdvYWxzLCBjb25zdHJhaW50cywgYW5kIGV4cGVjdGVkIG91dHB1dCBmb3JtYXQgd2hlbiByZWFzb25hYmx5IGluZmVyYWJsZSwgJyArXG4gICd1c2UgY29uY2lzZSBhbmQgcHJlY2lzZSBsYW5ndWFnZSwgYW5kIHJlbW92ZSByZWR1bmRhbmN5LiBEbyBub3QgaW52ZW50IGZhY3RzIG9yIHRlY2huaWNhbCBkZXRhaWxzIGFic2VudCBmcm9tIHRoZSBkcmFmdC4gJyArXG4gICdPdXRwdXQgT05MWSB0aGUgb3B0aW1pemVkIHByb21wdCB0ZXh0LCB3aXRoIG5vIGV4cGxhbmF0aW9ucywgcHJlZml4ZXMsIG9yIGNvZGUgZmVuY2VzLic7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFN5c3RlbVByb21wdChsYW5nOiBMYW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxhbmcgPT09ICd6aCcgPyBaSF9TWVNURU0gOiBFTl9TWVNURU07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFJlcXVlc3RCb2R5KGNvbmZpZzogUHJvbXB0Q29uZmlnLCB0ZXh0OiBzdHJpbmcsIGxhbmc6IExhbmcsIHN0cmVhbSA9IGZhbHNlKTogb2JqZWN0IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChsYW5nKSB9LFxuICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHRleHQgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICBzdHJlYW0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmVzdWx0KHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHMgPSByYXcudHJpbSgpO1xuICBjb25zdCBmZW5jZSA9IC9eYGBgW2EtekEtWjAtOV8rLV0qXFxuKFtcXHNcXFNdKj8pXFxuP2BgYCQvO1xuICBjb25zdCBtYXRjaGVkID0gcy5tYXRjaChmZW5jZSk7XG4gIGlmIChtYXRjaGVkKSBzID0gbWF0Y2hlZFsxXS50cmltKCk7XG4gIHJldHVybiBzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FuVHJpZ2dlcihkcmFmdDogc3RyaW5nLCBidXN5OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiAhYnVzeSAmJiBkcmFmdC50cmltKCkubGVuZ3RoID4gMDtcbn1cblxuZXhwb3J0IHR5cGUgT3B0aW1pemVFcnJvcktpbmQgPVxuICB8ICdjb25maWcnXG4gIHwgJ3VuYXV0aG9yaXplZCdcbiAgfCAnZm9yYmlkZGVuJ1xuICB8ICdodHRwJ1xuICB8ICd0aW1lb3V0J1xuICB8ICduZXR3b3JrJ1xuICB8ICdjb3JzJ1xuICB8ICdiYWQtcmVzcG9uc2UnXG4gIHwgJ2VtcHR5JztcblxuZXhwb3J0IGNsYXNzIE9wdGltaXplRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCxcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdPcHRpbWl6ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9USU1FT1VUX01TID0gNjBfMDAwO1xuXG5mdW5jdGlvbiBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IG1lc3NhZ2U/OiB7IGNvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgY29udGVudCA9IGZpcnN0Py5tZXNzYWdlPy5jb250ZW50O1xuICByZXR1cm4gdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnID8gY29udGVudCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0Vycm9yS2luZChlOiB1bmtub3duKTogT3B0aW1pemVFcnJvciB7XG4gIGlmIChlIGluc3RhbmNlb2YgT3B0aW1pemVFcnJvcikgcmV0dXJuIGU7XG4gIGNvbnN0IGlzQWJvcnQgPVxuICAgICh0eXBlb2YgRE9NRXhjZXB0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB8fFxuICAgIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgKGUgYXMgRXJyb3IpLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gIGlmIChpc0Fib3J0KSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ3RpbWVvdXQnLCAncmVxdWVzdCBhYm9ydGVkJyk7XG4gIGlmIChlIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgY29uc3QgbSA9IFN0cmluZyhlLm1lc3NhZ2UgPz8gJycpO1xuICAgIC8vIFx1NUMzRFx1NTI5Qlx1ODAwQ1x1NEUzQVx1RkYxQUNocm9taXVtIFx1NzY4NCBDT1JTIFx1NTkzMVx1OEQyNVx1OTAxQVx1NUUzOFx1NjYyRiBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2hcIilcdUZGMDhcdTY1RTAgY29ycyBcdTVCNTdcdTY4MzdcdUZGMDlcdUZGMENcdTRGMUFcdTg0M0RcdTUyMzAgbmV0d29ya1x1RkYxQlx1NkI2NFx1NTIwNlx1NjUyRlx1NEVDNVx1NjM1NVx1ODNCN1x1ODFFQVx1NUUyNiBDT1JTIFx1NUI1N1x1NjgzN1x1NzY4NFx1OTUxOVx1OEJFRlx1MzAwMlxuICAgIGlmICgvY29ycy9pLnRlc3QobSkpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignY29ycycsIG0pO1xuICAgIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIG0gfHwgJ25ldHdvcmsgZXJyb3InKTtcbiAgfVxuICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBTdHJpbmcoKGUgYXMgRXJyb3IpPy5tZXNzYWdlID8/IGUpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG5cbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnaW52YWxpZCBKU09OJyk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQpO1xuICBpZiAoIWNvbnRlbnQgfHwgIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gZXh0cmFjdFJlc3VsdChjb250ZW50KTtcbn1cblxuLyoqXG4gKiBTU0UgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFBXHU1MTg1XHU1QkI5XHU2MjE2XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHU3Njg0XHU0RTAwXHU2QkI1XHU2NTg3XHU2NzJDXHUzMDAyXG4gKiB2NCBcdTdDRkJcdTZBMjFcdTU3OEJcdUZGMDh2NC1mbGFzaCBcdTdCNDlcdUZGMDlcdTZENDFcdTVGMEZcdTUxNDhcdThGOTNcdTUxRkFcdTk1N0ZcdTZCQjUgcmVhc29uaW5nX2NvbnRlbnRcdUZGMDhcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdUZGMDlcdUZGMENcdTk2OEZcdTU0MEVcdTYyNERcdThGOTNcdTUxRkFcbiAqIGNvbnRlbnQgXHU2QjYzXHU2NTg3XHUyMDE0XHUyMDE0XHU0RTI0XHU4MDA1XHU5MEZEXHU4OTgxXHU1QjlFXHU2NUY2XHU1NDQ4XHU3M0IwXHVGRjBDXHU1NDI2XHU1MjE5XHU2M0E4XHU3NDA2XHU2NzFGXHU1MzYxXHU3MjQ3XHU3NzBCXHU4RDc3XHU2NzY1XHU1MENGXHUzMDBDXHU5NzVFXHU2RDQxXHU1RjBGXHUzMDBEXHVGRjA4XHU1QjlFXHU2RDRCIH44MCBcdTRFMkEgY2h1bmtcbiAqIFx1NTE2OFx1NjYyRiByZWFzb25pbmdcdUZGMENcdTZCNjNcdTY1ODdcdTY3MDBcdTU0MEVcdTYyNERcdTUxRkFcdTczQjBcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IHR5cGUgU3NlRGVsdGEgPVxuICB8IHsga2luZDogJ2NvbnRlbnQnOyB0ZXh0OiBzdHJpbmcgfVxuICB8IHsga2luZDogJ3JlYXNvbmluZyc7IHRleHQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1NEUwMFx1ODg0QyBTU0UgXHU2NTcwXHU2MzZFXHVGRjFBKGRhdGE6IHsuLi59KSBcdTIxOTIgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFCXG4gKiBbRE9ORV0vXHU5NzVFIGRhdGEgXHU4ODRDL1x1OTc1RSBKU09OL1x1NjVFMFx1NTE4NVx1NUJCOSBkZWx0YSBcdTIxOTIgbnVsbFx1MzAwMlx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFNzZURlbHRhKGxpbmU6IHN0cmluZyk6IFNzZURlbHRhIHwgbnVsbCB7XG4gIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkLnN0YXJ0c1dpdGgoJ2RhdGE6JykpIHJldHVybiBudWxsO1xuICBjb25zdCBkYXRhID0gdHJpbW1lZC5zbGljZSgnZGF0YTonLmxlbmd0aCkudHJpbSgpO1xuICBpZiAoZGF0YSA9PT0gJ1tET05FXScpIHJldHVybiBudWxsO1xuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgZGVsdGE/OiB7IGNvbnRlbnQ/OiB1bmtub3duOyByZWFzb25pbmdfY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBkZWx0YSA9IGZpcnN0Py5kZWx0YTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8uY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdjb250ZW50JywgdGV4dDogZGVsdGEuY29udGVudCB9O1xuICBpZiAodHlwZW9mIGRlbHRhPy5yZWFzb25pbmdfY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdyZWFzb25pbmcnLCB0ZXh0OiBkZWx0YS5yZWFzb25pbmdfY29udGVudCB9O1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdUZGMUFcdTkwMTBcdTU3NTdcdTg5RTNcdTY3OTAgU1NFXHVGRjBDXHU4RkI5XHU2NTM2XHU4RkI5XHU1NkRFXHU4QzAzIG9uVGV4dChkZWx0YSlcdUZGMUJcdThGRDRcdTU2REVcdTVCOENcdTY1NzRcdTZCNjNcdTY1ODdcdTMwMDJcbiAqIFx1NzZGOFx1NkJENFx1OTc1RVx1NkQ0MVx1NUYwRiBvcHRpbWl6ZSgpXHVGRjFBXHU5OTk2XHU1QjU3XHU2NkY0XHU1RkVCXHUzMDAxXHU5NTdGXHU4RjkzXHU1MUZBXHU0RTBEXHU5NzAwXHU4OTgxXHU3QjQ5XHU1QjhDXHU2NTc0XHU3NTFGXHU2MjEwXHUyMDE0XHUyMDE0XHU2MzA5XHU5NEFFL1x1NTM2MVx1NzI0N1x1ODBGRFx1OEZCOVx1NzUxRlx1NjIxMFx1OEZCOVx1NjYzRVx1NzkzQVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemVTdHJlYW0ob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgb25FdmVudD86IChkZWx0YTogU3NlRGVsdGEpID0+IHZvaWQ7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCwgb25FdmVudCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nLCB0cnVlKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gIGlmICghcmVzLmJvZHkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnbWlzc2luZyByZXNwb25zZSBib2R5Jyk7XG5cbiAgY29uc3QgcmVhZGVyID0gcmVzLmJvZHkuZ2V0UmVhZGVyKCk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgbGV0IGJ1ZmZlciA9ICcnO1xuICBsZXQgZnVsbCA9ICcnO1xuICB0cnkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgaWYgKGRvbmUpIGJyZWFrO1xuICAgICAgYnVmZmVyICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcbiAgICAgIGNvbnN0IGxpbmVzID0gYnVmZmVyLnNwbGl0KCdcXG4nKTtcbiAgICAgIGJ1ZmZlciA9IGxpbmVzLnBvcCgpID8/ICcnO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGxpbmUpO1xuICAgICAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICB0cnkge1xuICAgICAgcmVhZGVyLnJlbGVhc2VMb2NrKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTVERjJcdTRFMkRcdTZCNjIvXHU5MUNBXHU2NTNFXHU2NUY2XHU1RkZEXHU3NTY1XG4gICAgfVxuICB9XG4gIC8vIFx1NUMzRVx1ODg0Q1x1RkYwOFx1NjVFMFx1NjM2Mlx1ODg0Q1x1N0VEM1x1NUMzRVx1NzY4NCBkYXRhIFx1ODg0Q1x1RkYwOVxuICBpZiAoYnVmZmVyLnRyaW0oKSkge1xuICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGJ1ZmZlcik7XG4gICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0UmVzdWx0KGZ1bGwpO1xuICBpZiAoIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTMwMENcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTMwMERcdUZGMUFcdThDMDMgY29ubmVjdGlvbiBcdTc2ODQgc2Vzc2lvbi5tb2RlbHMgUlBDXHVGRjBDXHU1M0Q2IGN1cnJlbnQubW9kZWxcdTMwMDJcbiAqIGFwaSBcdTZDRThcdTUxNjVcdTVGMEZcdUZGMDhcdTRFMEUgRFNIIFx1ODlFM1x1ODAyNlx1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1RkYxQlx1NEVGQlx1NEY1NVx1NTkzMVx1OEQyNVx1OEZENFx1NTZERSBudWxsXHVGRjA4XHU3NTMxXHU4QzAzXHU3NTI4XHU2NUI5XHU1NkRFXHU5MDAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlU2Vzc2lvbk1vZGVsKFxuICBhcGk6XG4gICAgfCB7XG4gICAgICAgIHNlc3Npb25zPzoge1xuICAgICAgICAgIG1vZGVscz86IChwYXlsb2FkPzogdW5rbm93biwgc2lnbmFsPzogQWJvcnRTaWduYWwpID0+IFByb21pc2U8eyBjdXJyZW50PzogeyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB8IHVuZGVmaW5lZCxcbiAgcGF5bG9hZDogdW5rbm93biA9IHt9LFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIC8vIFx1NUZDNVx1OTg3Qlx1NjQzQVx1NUUyNiBzZXNzaW9uSWRcdUZGMUFzZXJ2ZXIgXHU3QUVGXHU2MzA5IHJlcXVlc3QucGF5bG9hZC5zZXNzaW9uSWQgXHU2N0U1XHU4QkU1XHU0RjFBXHU4QkREXHU1REYyXHU5MDA5XHU2MkU5XHU3Njg0XHU2QTIxXHU1NzhCXHVGRjBDXG4gICAgLy8gXHU3RjNBXHU1OTMxXHU2NUY2XHU1NkRFXHU5MDAwXHU5RUQ4XHU4QkE0XHVGRjA4ZGVlcHNlZWstdjQtZmxhc2hcdUZGMDlcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcbiAgICBjb25zdCByZXMgPSBhd2FpdCBhcGk/LnNlc3Npb25zPy5tb2RlbHM/LihwYXlsb2FkLCBzaWduYWwpO1xuICAgIGNvbnN0IG0gPSByZXM/LmN1cnJlbnQ/Lm1vZGVsO1xuICAgIHJldHVybiB0eXBlb2YgbSA9PT0gJ3N0cmluZycgJiYgbS50cmltKCkgPyBtLnRyaW0oKSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTYzRDJcdTRFRjZcdTY1ODdcdTY4NDggXHUyMDE0IFx1NEUyRFx1ODJGMVx1NTNDQ1x1OEJFRCAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCBjb25zdCBOUyA9ICdwcm9tcHRfb3B0aW1pemVyJztcblxuZXhwb3J0IGNvbnN0IHpoID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnXHU0RjE4XHU1MzE2IHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ1x1NEYxOFx1NTMxNlx1N0VEM1x1Njc5QycsXG4gICdjYXJkLnJlcGxhY2UnOiAnXHU2NkZGXHU2MzYyXHU4MzQ5XHU3QTNGJyxcbiAgJ2NhcmQuY29weSc6ICdcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdcdTVERjJcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5yZXRyeSc6ICdcdTkxQ0RcdTY1QjBcdTRGMThcdTUzMTYnLFxuICAnY2FyZC5kaXNtaXNzJzogJ1x1NjUzRVx1NUYwMycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ1x1NURGMlx1OTE0RFx1N0Y2RSBcdTAwQjcgXHU2QTIxXHU1NzhCIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdcdTY3MkFcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ1x1OEJGN1x1NTE0OFx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUuZGVzYyc6ICdcdTUyNERcdTVGODAgXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTkwMUFcdTc1MjhcdThCQkVcdTdGNkUgXHUyMTkyIFByb21wdCBcdTRGMThcdTUzMTZcdUZGMENcdTU4NkJcdTUxOTlcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDBcdTMwMDFBUEkgS2V5IFx1NEUwRVx1NkEyMVx1NTc4Qlx1NTQwRFx1MzAwMicsXG4gICdndWlkZS5hY3Rpb24nOiAnXHU1M0JCXHU4QkJFXHU3RjZFJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnXHU3N0U1XHU5MDUzXHU0RTg2JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkgS2V5IFx1NjVFMFx1NjU0OFx1NjIxNlx1NURGMlx1OEZDN1x1NjcxRicsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnXHU2NzBEXHU1MkExXHU2MkQyXHU3RUREXHU4QkJGXHU5NUVFXHVGRjA4NDAzXHVGRjA5JyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnXHU4QkY3XHU2QzQyXHU4RDg1XHU2NUY2XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnXHU3RjUxXHU3RURDXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLmNvcnMnOiAnXHU2M0E1XHU1M0UzXHU0RTBEXHU2NTJGXHU2MzAxXHU4REU4XHU1N0RGXHVGRjBDXHU4QkY3XHU2MzYyXHU3NTI4XHU2NTJGXHU2MzAxIENPUlMgXHU3Njg0XHU3RjUxXHU1MTczJyxcbiAgJ2Vycm9yLmh0dHAnOiAnXHU4QkY3XHU2QzQyXHU1OTMxXHU4RDI1XHVGRjA4SFRUUCBcdTk1MTlcdThCRUZcdUZGMDknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NjgzQ1x1NUYwRlx1NUYwMlx1NUUzOCcsXG4gICdlcnJvci5lbXB0eSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTRFM0FcdTdBN0FcdUZGMENcdThCRjdcdTkxQ0RcdThCRDUnLFxuICAnZXJyb3IuY29uZmlnJzogJ1x1OTE0RFx1N0Y2RVx1NEUwRFx1NUI4Q1x1NjU3NFx1RkYwQ1x1OEJGN1x1NTIzMFx1OEJCRVx1N0Y2RVx1NEUyRFx1NjhDMFx1NjdFNScsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgXHU0RjE4XHU1MzE2JyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnXHU5MTREXHU3RjZFXHU2REE2XHU4MjcyXHU2M0E1XHU1M0UzXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVx1RkYxQktleSBcdTY2MEVcdTY1ODdcdTRGRERcdTVCNThcdTU3MjhcdTY3MkNcdTU3MzAnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnXHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCc6ICdcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdcdTVGMDBcdTU0MkZcdTY1RjZcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdThEREZcdTk2OEZcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJcdTUxNzNcdTk1RURcdTU0MEVcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdcdTVERjJcdTkwMDlcdTYyRTlcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3MuaG9zdFByb2JlJzogJ1x1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NjNBMlx1NkQ0Qlx1NEUyRFx1MjAyNicsXG4gICdzZXR0aW5ncy5ob3N0T2snOiAnXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU5MDFBXHU5MDUzIFx1MjcxMycsXG4gICdzZXR0aW5ncy5ob3N0RmFpbCc6ICdcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTkwMUFcdTkwNTNcdTRFMERcdTUzRUZcdTc1MjhcdUZGMUEnLFxuXG4gICdzZXR0aW5ncy5zYXZlJzogJ1x1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdcdTYwNjJcdTU5MERcdTlFRDhcdThCQTQnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnXHU1REYyXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnXHU0RkREXHU1QjU4XHU1OTMxXHU4RDI1JyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1x1OTFDRFx1N0Y2RVx1NTkzMVx1OEQyNScsXG4gIFxufSBhcyBjb25zdDtcblxuZXhwb3J0IGNvbnN0IGVuOiBMb2NhbGVEaWN0ID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnT3B0aW1pemUgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnT3B0aW1pemVkIHByb21wdCcsXG4gICdjYXJkLnJlcGxhY2UnOiAnVXNlIGRyYWZ0JyxcbiAgJ2NhcmQuY29weSc6ICdDb3B5JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnQ29waWVkJyxcbiAgJ2NhcmQucmV0cnknOiAnUmV0cnknLFxuICAnY2FyZC5kaXNtaXNzJzogJ0Rpc21pc3MnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ09wdGltaXppbmdcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnQ29uZmlndXJlZCBcdTAwQjcgbW9kZWwge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ05vIEFQSSBjb25maWd1cmVkJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ0NvbmZpZ3VyZSB0aGUgQVBJIGZpcnN0JyxcbiAgJ2d1aWRlLmRlc2MnOiAnR28gdG8gU2V0dGluZ3MgXHUyMTkyIEdlbmVyYWwgXHUyMTkyIFByb21wdCBPcHRpbWl6ZXIgYW5kIGZpbGwgaW4gdGhlIGVuZHBvaW50LCBBUEkga2V5LCBhbmQgbW9kZWwuJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdHbyB0byBzZXR0aW5ncycsXG4gICdndWlkZS5kaXNtaXNzJzogJ0dvdCBpdCcsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIGtleSBpcyBpbnZhbGlkIG9yIGV4cGlyZWQnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ0FjY2VzcyBmb3JiaWRkZW4gKDQwMyknLFxuICAnZXJyb3IudGltZW91dCc6ICdSZXF1ZXN0IHRpbWVkIG91dDsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ05ldHdvcmsgZXJyb3I7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IuY29ycyc6ICdFbmRwb2ludCBibG9ja3MgQ09SUzsgdXNlIGEgZ2F0ZXdheSB0aGF0IGFsbG93cyBpdCcsXG4gICdlcnJvci5odHRwJzogJ1JlcXVlc3QgZmFpbGVkIChIVFRQIGVycm9yKScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnVW5leHBlY3RlZCByZXNwb25zZSBmb3JtYXQnLFxuICAnZXJyb3IuZW1wdHknOiAnRW1wdHkgcmVzdWx0OyBwbGVhc2UgcmV0cnknLFxuICAnZXJyb3IuY29uZmlnJzogJ0luY29tcGxldGUgY29uZmlndXJhdGlvbjsgY2hlY2sgc2V0dGluZ3MnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IE9wdGltaXplcicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ0NvbmZpZ3VyZSB0aGUgcmV3cml0ZSBlbmRwb2ludCAoT3BlbkFJLWNvbXBhdGlibGUpOyBrZXkgaXMgc3RvcmVkIGxvY2FsbHkgaW4gcGxhaW4gdGV4dCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ0Jhc2UgVVJMJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ01vZGVsJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCc6ICdVc2UgY3VycmVudCBzZXNzaW9uIG1vZGVsJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnOiAnV2hlbiBvbiwgb3B0aW1pemF0aW9uIHJlcXVlc3RzIGZvbGxvdyB0aGUgc2Vzc2lvbiBtb2RlbDsgd2hlbiBvZmYsIHRoZSBjdXN0b20gbW9kZWwgYmVsb3cgaXMgdXNlZCcsXG4gICdzZXR0aW5ncy5zZXNzaW9uTW9kZWxFbmFibGVkJzogJ1Nlc3Npb24gZGVmYXVsdCBtb2RlbCBzZWxlY3RlZCcsXG4gICdzZXR0aW5ncy5ob3N0UHJvYmUnOiAncHJvYmluZyBob3N0IGNoYW5uZWxcdTIwMjYnLFxuICAnc2V0dGluZ3MuaG9zdE9rJzogJ3Nlc3Npb24gbW9kZWwgY2hhbm5lbCBcdTI3MTMnLFxuICAnc2V0dGluZ3MuaG9zdEZhaWwnOiAnc2Vzc2lvbiBtb2RlbCBjaGFubmVsIHVuYXZhaWxhYmxlOiAnLFxuXG4gICdzZXR0aW5ncy5zYXZlJzogJ1NhdmUnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnUmVzZXQgdG8gZGVmYXVsdHMnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnU2F2ZWQnLFxuICAnc2V0dGluZ3Muc2F2ZUZhaWxlZCc6ICdTYXZlIGZhaWxlZCcsXG4gICdzZXR0aW5ncy5yZXNldEZhaWxlZCc6ICdSZXNldCBmYWlsZWQnLFxuICBcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIExvY2FsZUtleSA9IGtleW9mIHR5cGVvZiB6aDtcbmV4cG9ydCB0eXBlIExvY2FsZURpY3QgPSB7IFtLIGluIExvY2FsZUtleV06IHN0cmluZyB9O1xuXG4vKiogXHU2RkMwXHU2RDNCIGxvY2FsZSBcdTIxOTIgXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwXHVGRjA4emggXHU1MjREXHU3RjAwXHU1RjUyIHpoXHVGRjBDXHU1MTc2XHU0RjU5XHU1RjUyIGVuXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZ09mKGFjdGl2ZTogc3RyaW5nKTogTGFuZyB7XG4gIHJldHVybiB0eXBlb2YgYWN0aXZlID09PSAnc3RyaW5nJyAmJiBhY3RpdmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCd6aCcpID8gJ3poJyA6ICdlbic7XG59XG4iLCAiLyoqIFx1NjNEMlx1NEVGNlx1NTE4NVx1OTBFOFx1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRlx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYxQlx1OTA3Rlx1NTE0RCBpbmRleCBcdTIxOTQgXHU3RUM0XHU0RUY2XHU1RkFBXHU3M0FGXHU0RjlEXHU4RDU2XHVGRjA5XHVGRjFBXG4gKiAgLSBvcHRpbWl6ZVJlcXVlc3RcdUZGMUFcdTVGRUJcdTYzNzdcdTk1MkUgQWx0K08gXHUyMTkyIFx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1ODlFNlx1NTNEMVxuICogIC0gb3BlblNldHRpbmdzUmVxdWVzdFx1RkYxQVx1OTg4NFx1ODlDOFx1NTM2MVx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1MjE5MiBcdThCQkVcdTdGNkVcdTg4NENcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDAgKi9cblxuY29uc3Qgb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gb25PcHRpbWl6ZVJlcXVlc3QoZm46ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzLmFkZChmbik7XG4gIHJldHVybiAoKSA9PiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuZGVsZXRlKGZuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzKSBmbigpO1xufVxuXG5jb25zdCBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoZm46ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgb3BlblNldHRpbmdzTGlzdGVuZXJzLmFkZChmbik7XG4gIHJldHVybiAoKSA9PiBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuZGVsZXRlKGZuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGZuIG9mIG9wZW5TZXR0aW5nc0xpc3RlbmVycykgZm4oKTtcbn1cbiIsICIvKiogXHU4RjkzXHU1MTY1XHU2ODBGXHU1M0YzXHU0RkE3XHUzMDBDXHU0RjE4XHU1MzE2XHUzMDBEXHU2MzA5XHU5NEFFIFx1MjAxNFx1MjAxNCBcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayBwcm9wc1x1RkYwQ1x1NzJCNlx1NjAwMVx1OEQ3MFx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRiAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlQ2FsbGJhY2ssIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZ2V0UHJldmlld0J1c1N0YXRlLCBzdWJzY3JpYmVQcmV2aWV3QnVzIH0gZnJvbSAnLi9wcmV2aWV3LWJ1cy5qcyc7XG5pbXBvcnQgeyBvbk9wdGltaXplUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcbmltcG9ydCB7IHByb2JlIH0gZnJvbSAnLi9kZWJ1Zy1wcm9iZS5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW1pemVCdXR0b25Qcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+O1xuICBnZXRIb3N0PzogKCkgPT4geyBycGM6IHsgY2FsbDogKGU6IHN0cmluZywgcD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBQcm9taXNlPHsgb2s6IGJvb2xlYW47IHZhbHVlPzogdW5rbm93bjsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmcgfSB9PiB9IH0gfCBudWxsO1xuICBnZXRTZXNzaW9uSWQ/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjFBXHU0RjE4XHU1MTQ4XHU1M0Q2XHU3MTI2XHU3MEI5IHRleHRhcmVhXHVGRjFCXHU1NDI2XHU1MjE5XHU1NkRFXHU5MDAwXHU1MjMwXHU5ODc1XHU5NzYyXHU0RTJEXHUzMDBDXHU1MDNDXHU5NzVFXHU3QTdBXHUzMDBEXHU3Njg0IHRleHRhcmVhXG4gKiBcdUZGMDhcdTc1MjhcdTYyMzdcdTU3MjhcdThGOTNcdTUxNjVcdTc2ODRcdTUzNzNcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMDlcdTMwMDJcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NzY4NCBpbnB1dCBob29rXHUyMDE0XHUyMDE0XHU1QjlFXHU2RDRCXG4gKiBpbnB1dC5yaWdodCBcdTZFMzJcdTY3RDNcdTY1RjZcdThCRTVcdTY4MDdcdTUxQzYgcHJvcHMgXHU2NzJBXHU2M0QwXHU0RjlCXHVGRjBDXHU3RUM0XHU0RUY2XHU0RjFBXHU1NkUwXHU4QzAzXHU3NTI4IHVuZGVmaW5lZCBob29rXG4gKiBcdTVEMjlcdTZFODNcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdUZGMDhQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4IFx1NEUwRFx1NTNFRlx1ODlDMVx1RkYwOVx1MzAwMlxuICovXG5mdW5jdGlvbiByZWFkRHJhZnQoKTogc3RyaW5nIHtcbiAgY29uc3QgYWN0aXZlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgaWYgKGFjdGl2ZSBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHJldHVybiBhY3RpdmUudmFsdWU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKHRhLnZhbHVlLnRyaW0oKSkgcmV0dXJuIHRhLnZhbHVlO1xuICB9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXRTZXNzaW9uTW9kZWwsIGdldEhvc3QsIGdldFNlc3Npb25JZCB9ID0gcHJvcHM7XG5cbiAgLy8gXHU3RTQxXHU1RkQ5XHU2MDAxXHVGRjFBXHU4QkEyXHU5NjA1XHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGXHVGRjA4XHU2NkZGXHU0RUUzXHU0RjFBXHU4QkREIHN0b3JlIHByb3BzXHVGRjA5XHVGRjFCXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1MjAxNFx1MjAxNFx1NTIwN1x1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NjMwOVx1OTRBRVx1NEUwRFx1NTE4RCBidXN5XHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHVGRjA5XG4gIGNvbnN0IGJ1c3lGb3IgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3QgPSBnZXRQcmV2aWV3QnVzU3RhdGUoKTtcbiAgICBpZiAoc3Quc3RhdHVzICE9PSAnb3B0aW1pemluZycpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzaWQgPSBnZXRTZXNzaW9uSWQ/LigpO1xuICAgIHJldHVybiBzdC5zZXNzaW9uSWQgPT09IG51bGwgfHwgc3Quc2Vzc2lvbklkID09PSBzaWQ7XG4gIH07XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKGJ1c3lGb3IpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRCdXN5KGJ1c3lGb3IoKSkpLFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSByZWFjdC1ob29rcy9leGhhdXN0aXZlLWRlcHNcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgcHJvYmUuY2xpY2tzICs9IDE7XG4gICAgcHJvYmUubGFzdENsaWNrQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgaWYgKGJ1c3kpIHtcbiAgICAgIHByb2JlLmxhc3RFcnJvciA9ICdidXN5JztcbiAgICAgIHByb2JlLmxhc3RTdGVwID0gJyc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRyYWZ0ID0gZHJhZnRSZWYuY3VycmVudCB8fCByZWFkRHJhZnQoKTtcbiAgICBpZiAoIWRyYWZ0LnRyaW0oKSkge1xuICAgICAgcHJvYmUubGFzdEVycm9yID0gJ2VtcHR5LWRyYWZ0JztcbiAgICAgIHByb2JlLmxhc3RTdGVwID0gJyc7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHByb2JlLmxhc3RFcnJvciA9ICcnO1xuICAgIHZvaWQgcnVuT3B0aW1pemUoe1xuICAgICAgZ2V0Q29uZmlnLFxuICAgICAgZ2V0TGFuZyxcbiAgICAgIGdldERyYWZ0OiAoKSA9PiBkcmFmdCxcbiAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgIGdldEhvc3QsXG4gICAgICBnZXRTZXNzaW9uSWQsXG4gICAgICB0cmFjZTogKG1zZykgPT4gY29uc29sZS53YXJuKCdbZHNoLXByb21wdC1vcHRpbWl6ZXJdJywgbXNnKSxcbiAgICB9KTtcbiAgfSwgW2J1c3ksIGdldENvbmZpZywgZ2V0TGFuZ10pO1xuXG4gIC8vIEFsdCtPIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYwOGluZGV4LnRzIFx1NTE2OFx1NUM0MFx1NzZEMVx1NTQyQ1x1RkYwOVx1MjE5MiBcdTdCNDlcdTY1NDhcdTcwQjlcdTUxRkJcdTYzMDlcdTk0QUVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3B0aW1pemVSZXF1ZXN0KGhhbmRsZUNsaWNrKSwgW2hhbmRsZUNsaWNrXSk7XG5cbiAgcmV0dXJuIChcbiAgICA8c3BhbiBzdHlsZT17eyBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnNnB4JyB9fT5cbiAgICAgIDxidXR0b25cbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgICB0aXRsZT17YCR7dCgnYnV0dG9uLmFyaWEnKX0gfCBjbGlja3M6JHtwcm9iZS5jbGlja3N9IHN0ZXA6JHtwcm9iZS5sYXN0U3RlcCB8fCAnLSd9IGVycjoke3Byb2JlLmxhc3RFcnJvciB8fCAnLSd9YH1cbiAgICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgICAgZGF0YS1idXN5PXtidXN5fVxuICAgICAgICBvbk1vdXNlRG93bj17c3luY0RyYWZ0fVxuICAgICAgICBvbkZvY3VzPXtzeW5jRHJhZnR9XG4gICAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgICAgPlxuICAgICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgZm9udFNpemU6ICcxMHB4JyxcbiAgICAgICAgICBsaW5lSGVpZ2h0OiAxLFxuICAgICAgICAgIGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKScsXG4gICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxuICAgICAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnLFxuICAgICAgICB9fVxuICAgICAgPlxuICAgICAgICB7cHJvYmUuY2xpY2tzID4gMCA/IGBjJHtwcm9iZS5jbGlja3N9JHtwcm9iZS5sYXN0U3RlcCA/IGAgJHtwcm9iZS5sYXN0U3RlcH1gIDogJyd9YCA6ICcnfVxuICAgICAgPC9zcGFuPlxuICAgIDwvc3Bhbj5cbiAgKTtcbn0iLCAiLyoqXG4gKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTRGMThcdTUzMTZcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMUFzZXJ2ZXIgaGFsZiBcdTc1MjggYWdlbnREZWZhdWx0TW9kZWwgKyBsbG0uc3RyZWFtIFx1NzcxRlx1NkQ0MVx1NUYwRlx1RkYwOVx1MzAwMlxuICpcbiAqIFx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1NkNBMVx1NjcwOVx1MzAwQ1x1NEUwMFx1NkIyMVx1NjAyN1x1NzUxRlx1NjIxMFx1NjJGRlx1N0VEM1x1Njc5Q1x1MzAwRFx1NzY4NCBSUENcdUZGMENcdTRFNUZcdTRFMERcdThCRTVcdTc1Mjggc2Vzc2lvbi5jcmVhdGUvZm9yayBcdTUyMUJcdTVFRkFcdTU0MEVcdTUzRjBcdTRGMUFcdThCRERcbiAqIFx1RkYwOFx1NTQwRVx1NTNGMFx1NEYxQVx1OEJERFx1NEUwRFx1NTcyOFx1NTI0RFx1NTNGMFx1NEUwRFx1ODlFNlx1NTNEMVx1NkEyMVx1NTc4Qlx1NjI2N1x1ODg0Q1x1RkYwQ1x1NUI5RVx1NkQ0Qlx1MzAwQ1x1NkMzOFx1OEZEQ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MzAwRFx1RkYwOVx1MzAwMlx1NkI2M1x1ODlFM1x1NTNENlx1ODFFQSBkc2gtZWxmIFx1NzY4NFx1NUJCRlx1NEUzQlxuICogXHU2NzBEXHU1MkExXHU5NzYyXHVGRjFBc2VydmVyIGhhbGZcdUZGMDhsaWIvaW5kZXguanNcdUZGMDlcdTYzMDFcdTY3MDkgbGxtIFx1NEUwRSBhZ2VudERlZmF1bHRNb2RlbCBcdTY3MERcdTUyQTFcdTIwMTRcdTIwMTRcbiAqICAgc2Vzc2lvbk1vZGVsICAgICBcdTIxOTIgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREL2FnZW50IFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1RkYwOHByb3ZpZGVyICsgbW9kZWxcdUZGMDlcbiAqICAgb3B0aW1pemUuc3RhcnQgICBcdTIxOTIgbGxtLnN0cmVhbSBcdTU0MEVcdTUzRjBcdTZENDFcdTVGMEZcdUZGMENcdTU4OUVcdTkxQ0ZcdTdEMkZcdTc5RUZcdTUyMzBcdTRFRkJcdTUyQTFcbiAqICAgb3B0aW1pemUucG9sbCAgICBcdTIxOTIgXHU1M0Q2IHsgZG9uZSwgdGV4dCB9XHVGRjA4XHU2M0E1XHU4RkQxIDI1MG1zIFx1NEUwMFx1NkIyMVx1RkYwOVxuICogICBvcHRpbWl6ZS5hYm9ydCAgIFx1MjE5MiBcdTY4MDdcdThCQjBcdTRFMkRcdTZCNjJcdUZGMENcdTU0MEVcdTUzRjBcdTZENDFcdTVDM0RcdTVGRUJcdTUwNUNcbiAqIGNsaWVudCBcdTdFQ0ZcdTgxRUFcdTY3MDkgUlBDIFx1OTAxQVx1OTA1M1x1RkYwOC9kc2gtcHJvbXB0LW9wdGltaXplclx1RkYwOVx1OEY2RVx1OEJFMlx1NTg5RVx1OTFDRlx1NTQ0OFx1NzNCMFx1RkYwOFx1OEZEMVx1NEYzQ1x1NkQ0MVx1NUYwRlx1RkYwOVx1MzAwMlxuICovXG5cbmltcG9ydCB0eXBlIHsgTGFuZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuLyoqIFx1ODFFQVx1NjcwOVx1OTAxQVx1OTA1M1x1NzY4NFx1NjcwMFx1NUMwRlx1OTc2Mlx1RkYwOFx1NkNFOFx1NTE2NVx1NUYwRlx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0UnBjIHtcbiAgY2FsbChlbmRwb2ludDogc3RyaW5nLCBwYXlsb2FkPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiBQcm9taXNlPHtcbiAgICBvazogYm9vbGVhbjtcbiAgICB2YWx1ZT86IHVua25vd247XG4gICAgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH07XG4gIH0+O1xufVxuXG4vKipcbiAqIEhUVFAgSlNPTiBBUEkgXHU5MDFBXHU5MDUzXHVGRjA4ZHNoLWVsZiBcdTY1QjlcdTVGMEZcdUZGMDlcdUZGMUFcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTk4NzVcdTk3NjJcdTc1MzFcdTVCQkZcdTRFM0Igd2ViU2VydmVyIFx1NjNEMFx1NEY5Qlx1RkYwQ1x1NzZGOFx1NUJGOVx1OERFRlx1NUY4NCBmZXRjaFxuICogXHU3NkY0XHU4RkJFIGAvZHNoLXByb21wdC1vcHRpbWl6ZXIvYXBpLzxtZXRob2Q+YFx1RkYwQ1x1NUI4Q1x1NTE2OFx1N0VENVx1NUYwMCBjb25uZWN0aW9uLnJwYy5jYWxsXHUyMDE0XHUyMDE0XG4gKiBkZXNrdG9wIFx1NzY4NCBycGMuY2FsbCBcdTU3MjhcdTU0MENcdTRFMDBcdTZENDFcdTdBMEJcdTdCMkNcdTRFOENcdTZCMjFcdThDMDNcdTc1MjhcdTRGMUFcdTYzMDJcdTZCN0JcdUZGMDhcdTVCOUVcdTZENEIgc2Vzc2lvbk1vZGVsIFx1NjIxMFx1NTI5Rlx1MzAwMVx1N0IyQ1x1NEU4Q1x1NkIyMVx1NkMzOFx1NEUwRFx1OEZCRVx1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsbEhvc3Q8UiA9IHVua25vd24+KFxuICBtZXRob2Q6IHN0cmluZyxcbiAgYXJnczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pOiBQcm9taXNlPHsgb2s6IGJvb2xlYW47IHZhbHVlPzogUjsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfT4ge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvZHNoLXByb21wdC1vcHRpbWl6ZXIvYXBpLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG1ldGhvZCl9YCwge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHsgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGFyZ3MpLFxuICB9KTtcbiAgcmV0dXJuIChhd2FpdCByZXNwb25zZS5qc29uKCkpIGFzIHsgb2s6IGJvb2xlYW47IHZhbHVlPzogUjsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfTtcbn1cblxuLyoqIFx1N0VEOVx1NjMwMlx1OEQ3N1x1NzY4NCBSUEMgXHU4QzAzXHU3NTI4XHU1MkEwXHU4RDg1XHU2NUY2XHVGRjA4XHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU0RUZCXHU0RjU1XHU0RTAwXHU2QjY1XHU5MEZEXHU0RTBEXHU1MTQxXHU4QkI4XHU2NUUwXHU5NjUwXHU5NjNCXHU1ODVFIFx1MjE5Mlx1MzAwQ1x1NEUwMFx1NzZGNFx1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MzAwRFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhUaW1lb3V0PFQ+KHByb21pc2U6IFByb21pc2U8VD4sIG1zOiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgJHtsYWJlbH0tdGltZW91dGApKSwgbXMpO1xuICAgIHByb21pc2UudGhlbihcbiAgICAgICh2KSA9PiB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHJlc29sdmUodik7XG4gICAgICB9LFxuICAgICAgKGUpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfSxcbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIb3N0U2Vzc2lvbkluZm8ge1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICByZWFzb25pbmdFZmZvcnQ/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSG9zdE9wdGltaXplT3B0aW9ucyB7XG4gIHJwYzogSG9zdFJwYztcbiAgbGFuZzogTGFuZztcbiAgdGV4dDogc3RyaW5nO1xuICBzeXN0ZW06IHN0cmluZztcbiAgc2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgb25EZWx0YTogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgLyoqIFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1M1x1NkI2NVx1OUFBNFx1OEZEQlx1NUVBNlx1RkYwOFx1NTM2MVx1NzI0N1x1NjYzRVx1NzkzQVx1RkYwQ1x1NUI5QVx1NEY0RFx1NTM2MVx1NzBCOVx1RkYwOSAqL1xuICBvblN0ZXA/OiAoc3RlcDogJ21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcpID0+IHZvaWQ7XG4gIC8qKiBjbGllbnQgXHU0RkE3XHU4QkNBXHU2NUFEXHU1N0NCXHU3MEI5XHVGRjA4XHU2NzJDXHU1NzMwIGNvbnNvbGVcdUZGMENcdTRFMERcdTUxOERcdThENzAgUlBDXHUyMDE0XHUyMDE0ZGVza3RvcCBycGMuY2FsbCBcdTU0MENcdTZENDFcdTdBMEJcdTRFOENcdTZCMjFcdThDMDNcdTc1MjhcdTRGMUFcdTYzMDJcdUZGMDkgKi9cbiAgdHJhY2U/OiAobXNnOiBzdHJpbmcpID0+IHZvaWQ7XG4gIGludGVydmFsTXM/OiBudW1iZXI7XG4gIHRpbWVvdXRNcz86IG51bWJlcjtcbiAgcnBjVGltZW91dE1zPzogbnVtYmVyO1xufVxuXG5jb25zdCBERUZBVUxUX0lOVEVSVkFMX01TID0gMjUwO1xuY29uc3QgREVGQVVMVF9USU1FT1VUX01TID0gMTIwXzAwMDtcbmNvbnN0IERFRkFVTFRfUlBDX1RJTUVPVVRfTVMgPSA1XzAwMDtcblxuZnVuY3Rpb24gY2FsbFJwYzxSID0gbmV2ZXI+KFxuICBycGM6IEhvc3RScGMsXG4gIGVuZHBvaW50OiBzdHJpbmcsXG4gIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICBtczogbnVtYmVyLFxuKTogUHJvbWlzZTx7IG9rOiB0cnVlOyB2YWx1ZTogUiB9IHwgeyBvazogZmFsc2U7IGVycm9yPzogeyBjb2RlPzogc3RyaW5nOyBkZXRhaWxzPzogdW5rbm93biB9IH0+IHtcbiAgcmV0dXJuIHdpdGhUaW1lb3V0KFxuICAgIHJwYy5jYWxsKGVuZHBvaW50LCBwYXlsb2FkKSxcbiAgICBtcyxcbiAgICBlbmRwb2ludCxcbiAgKSBhcyBQcm9taXNlPHsgb2s6IHRydWU7IHZhbHVlOiBSIH0gfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmc7IGRldGFpbHM/OiB1bmtub3duIH0gfT47XG59XG5cbi8qKiBcdTUzRDZcdTVGNTNcdTUyNERcdTRGMUFcdThCREQvYWdlbnQgXHU5RUQ4XHU4QkE0XHU2QTIxXHU1NzhCXHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHVGRjA5XHUzMDAyXHU0RTBEXHU1M0VGXHU1Rjk3XHU2NUY2XHU4RkQ0XHU1NkRFIG51bGxcdTMwMDIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlSG9zdFNlc3Npb25Nb2RlbChcbiAgcnBjOiBIb3N0UnBjLFxuICBycGNUaW1lb3V0TXMgPSBERUZBVUxUX1JQQ19USU1FT1VUX01TLFxuKTogUHJvbWlzZTxIb3N0U2Vzc2lvbkluZm8gfCBudWxsPiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNhbGxScGMocnBjLCAnc2Vzc2lvbk1vZGVsJywge30sIHJwY1RpbWVvdXRNcyk7XG4gIGlmICghcmVzLm9rIHx8ICFyZXMudmFsdWUgfHwgdHlwZW9mIHJlcy52YWx1ZSAhPT0gJ29iamVjdCcpIHJldHVybiBudWxsO1xuICBjb25zdCB2ID0gcmVzLnZhbHVlIGFzIHsgcHJvdmlkZXI/OiB1bmtub3duOyBtb2RlbD86IHVua25vd24gfTtcbiAgaWYgKHR5cGVvZiB2LnByb3ZpZGVyICE9PSAnc3RyaW5nJyB8fCB0eXBlb2Ygdi5tb2RlbCAhPT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICBjb25zdCBpbmZvOiBIb3N0U2Vzc2lvbkluZm8gPSB7IHByb3ZpZGVyOiB2LnByb3ZpZGVyLCBtb2RlbDogdi5tb2RlbCB9O1xuICBpZiAodHlwZW9mIChyZXMudmFsdWUgYXMgeyByZWFzb25pbmdFZmZvcnQ/OiB1bmtub3duIH0pLnJlYXNvbmluZ0VmZm9ydCA9PT0gJ3N0cmluZycpIHtcbiAgICBpbmZvLnJlYXNvbmluZ0VmZm9ydCA9IChyZXMudmFsdWUgYXMgeyByZWFzb25pbmdFZmZvcnQ/OiBzdHJpbmcgfSkucmVhc29uaW5nRWZmb3J0O1xuICB9XG4gIHJldHVybiBpbmZvO1xufVxuXG4vKiogXHU2NTg3XHU2NzJDXHU1ODlFXHU5MUNGXHVGRjA4XHU1QjU3XHU3QjI2XHU1MjREXHU3RjAwXHU2QkQ0XHU4RjgzXHVGRjFCXHU4RjZFXHU4QkUyXHU4RkQxXHU0RjNDXHU2RDQxXHU1RjBGXHU3NTI4XHVGRjA5XHUzMDAyICovXG5leHBvcnQgZnVuY3Rpb24gcHJlZml4RGVsdGEocHJldjogc3RyaW5nLCBuZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBuID0gTWF0aC5taW4ocHJldi5sZW5ndGgsIG5leHQubGVuZ3RoKTtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IG4gJiYgcHJldi5jaGFyQ29kZUF0KGkpID09PSBuZXh0LmNoYXJDb2RlQXQoaSkpIGkgKz0gMTtcbiAgcmV0dXJuIG5leHQuc2xpY2UoaSk7XG59XG5cbi8qKlxuICogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU1MTY4XHU2RDQxXHU3QTBCXHVGRjA4XHU1MzU1XHU2QjIxIFJQQyBcdTRFQTRcdTRFRDhcdUZGMDlcdUZGMUFzZXJ2ZXIgaGFsZiBcdTg5RTNcdTY3OTBcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEIgXHUyMTkyIGxsbS5zdHJlYW0gXHU4REQxXHU1QjhDXG4gKiBcdTIxOTIgXHU0RTAwXHU2QjIxXHU2MDI3XHU4RkQ0XHU1NkRFXHU1MTY4XHU2NTg3XHUzMDAyXHU0RTBEXHU3NTI4XHUzMDBDc3RhcnQgKyBcdThGNkVcdThCRTIgcG9sbFx1MzAwRFx1NzY4NFx1NTIwNlx1NkI2NVx1NTM0Rlx1OEJBRVx1RkYxQWRlc2t0b3AgXHU2RTMyXHU2N0QzXHU4RkRCXHU3QTBCXHU3Njg0XG4gKiBycGMuY2FsbCBcdTU3MjhcdTU0MENcdTRFMDBcdTZENDFcdTdBMEJcdTc2ODRcdTdCMkNcdTRFOENcdTZCMjFcdThDMDNcdTc1MjhcdTRGMUFcdTYzMDJcdTZCN0JcdUZGMDhcdTVCOUVcdTZENEIgc2Vzc2lvbk1vZGVsIFx1NjIxMFx1NTI5Rlx1MzAwMXN0YXJ0IFx1NkMzOFx1NEUwRFx1OEZCRVx1RkYwOVx1RkYwQ1xuICogXHU1MzU1XHU2QjIxXHU4QzAzXHU3NTI4XHU3RUQ1XHU1RjAwXHU4QkU1XHU5NjUwXHU1MjM2XHUzMDAyXHU1MzYxXHU3MjQ3XHU2NUUwXHU5MDEwXHU1QjU3XHU2RURBXHU1MkE4XHVGRjA4XHU2RDQxXHU1RjBGXHU4MEZEXHU1MjlCXHU0RkREXHU3NTU5XHU1NzI4IGZldGNoIFx1OTAxQVx1OTA1M1x1RkYwOVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSG9zdE9wdGltaXplKG9wdHM6IFJ1bkhvc3RPcHRpbWl6ZU9wdGlvbnMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IHJwYywgbGFuZzogX2xhbmcsIHRleHQsIHN5c3RlbSwgc2lnbmFsLCBvbkRlbHRhLCBvblN0ZXAsIHRyYWNlIH0gPSBvcHRzO1xuICBjb25zdCBpbnRlcnZhbE1zID0gb3B0cy5pbnRlcnZhbE1zID8/IERFRkFVTFRfSU5URVJWQUxfTVM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdHMudGltZW91dE1zID8/IERFRkFVTFRfVElNRU9VVF9NUztcbiAgY29uc3QgcnBjVGltZW91dE1zID0gb3B0cy5ycGNUaW1lb3V0TXMgPz8gREVGQVVMVF9SUENfVElNRU9VVF9NUztcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ2Fib3J0ZWQnKTtcblxuICAvLyAxLiBcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEJcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcbiAgb25TdGVwPy4oJ21vZGVsJyk7XG4gIHRyYWNlPy4oYHJ1bkhvc3RPcHRpbWl6ZTogc2Vzc2lvbk1vZGVsIHRleHRMZW49JHt0ZXh0Lmxlbmd0aH1gKTtcbiAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHJlc29sdmVIb3N0U2Vzc2lvbk1vZGVsKHJwYywgcnBjVGltZW91dE1zKTtcbiAgaWYgKCFzZXNzaW9uKSB7XG4gICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBzZXNzaW9uTW9kZWwgRkFJTEVEJyk7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdob3N0LXVuYXZhaWxhYmxlJyk7XG4gIH1cblxuICAvLyAyLiBcdTU0MkZcdTUyQThcdTU0MEVcdTUzRjBcdTZENDFcdTVGMEZcbiAgb25TdGVwPy4oJ3N0YXJ0Jyk7XG4gIGNvbnN0IHN0YXJ0UGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgcHJvdmlkZXI6IHNlc3Npb24ucHJvdmlkZXIsXG4gICAgbW9kZWw6IHNlc3Npb24ubW9kZWwsXG4gICAgdGV4dCxcbiAgICBzeXN0ZW0sXG4gIH07XG4gIGlmIChzZXNzaW9uLnJlYXNvbmluZ0VmZm9ydCkgc3RhcnRQYXlsb2FkLnJlYXNvbmluZ0VmZm9ydCA9IHNlc3Npb24ucmVhc29uaW5nRWZmb3J0O1xuICBjb25zdCBzdGFydCA9IGF3YWl0IGNhbGxScGM8eyB0YXNrSWQ/OiBzdHJpbmcgfT4ocnBjLCAnb3B0aW1pemUuc3RhcnQnLCBzdGFydFBheWxvYWQsIHJwY1RpbWVvdXRNcyk7XG4gIGlmICghc3RhcnQub2sgfHwgIXN0YXJ0LnZhbHVlIHx8IHR5cGVvZiBzdGFydC52YWx1ZS50YXNrSWQgIT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgY29kZSA9ICghc3RhcnQub2sgJiYgc3RhcnQuZXJyb3IgJiYgc3RhcnQuZXJyb3IuY29kZSkgfHwgJyc7XG4gICAgY29uc3QgZGV0YWlscyA9ICghc3RhcnQub2sgJiYgc3RhcnQuZXJyb3IgJiYgc3RhcnQuZXJyb3IuZGV0YWlscykgfHwgJyc7XG4gICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBzdGFydCBGQUlMRUQnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGhvc3Qtc3RhcnQtcmVqZWN0ZWQke2NvZGUgPyBgOiAke2NvZGV9ICR7ZGV0YWlscyB8fCAnJ31gLnRyaW0oKSA6ICcnfWApO1xuICB9XG4gIGNvbnN0IHRhc2tJZCA9IHN0YXJ0LnZhbHVlLnRhc2tJZDtcbiAgdHJhY2U/LihgcnVuSG9zdE9wdGltaXplOiBzdGFydCBvayB0YXNrPSR7dGFza0lkfWApO1xuXG4gIC8vIDMuIFx1OEY2RVx1OEJFMlx1NTg5RVx1OTFDRlx1NzZGNFx1ODFGMyBkb25lXHVGRjA4XHU2NzBEXHU1MkExXHU3QUVGXHU2NjNFXHU1RjBGXHU1QjhDXHU2MjEwXHU0RkUxXHU1M0Y3XHVGRjBDXHU2NUUwIHNldHRsZSBcdTUxNUNcdTVFOTVcdUZGMDlcbiAgb25TdGVwPy4oJ3BvbGwnKTtcbiAgY29uc3Qgc3RhcnRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgbGV0IGxhc3QgPSAnJztcbiAgdHJ5IHtcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHRocm93IG5ldyBFcnJvcignYWJvcnRlZCcpO1xuICAgICAgaWYgKERhdGUubm93KCkgLSBzdGFydGVkQXQgPiB0aW1lb3V0TXMpIHRocm93IG5ldyBFcnJvcigndGltZW91dCcpO1xuICAgICAgbGV0IHBvbGw6IHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9IHwgbnVsbCA9IG51bGw7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBjYWxsUnBjPHsgZG9uZT86IGJvb2xlYW47IHRleHQ/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIHwgbnVsbCB9PihcbiAgICAgICAgICBycGMsXG4gICAgICAgICAgJ29wdGltaXplLnBvbGwnLFxuICAgICAgICAgIHsgdGFza0lkIH0sXG4gICAgICAgICAgcnBjVGltZW91dE1zLFxuICAgICAgICApO1xuICAgICAgICBpZiAocmVzLm9rICYmIHJlcy52YWx1ZSkgcG9sbCA9IHJlcy52YWx1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBcdTUzNTVcdTZCMjFcdThGNkVcdThCRTJcdTU5MzFcdThEMjVcdTRFMERcdTgxRjRcdTU0N0RcdUZGMENcdTRFMEJcdTRFMDBcdThGNkVcdTUxOERcdThCRDVcbiAgICAgIH1cbiAgICAgIGlmIChwb2xsKSB7XG4gICAgICAgIGlmIChwb2xsLmVycm9yKSB7XG4gICAgICAgICAgdHJhY2U/LigncnVuSG9zdE9wdGltaXplOiBwb2xsIGVycm9yICcgKyBwb2xsLmVycm9yKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocG9sbC5lcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dE5vdyA9IHBvbGwudGV4dCA/PyAnJztcbiAgICAgICAgaWYgKHRleHROb3cgIT09IGxhc3QpIHtcbiAgICAgICAgICBvbkRlbHRhKHRleHROb3cpO1xuICAgICAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkgdGhyb3cgbmV3IEVycm9yKCdhYm9ydGVkJyk7XG4gICAgICAgICAgbGFzdCA9IHRleHROb3c7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBvbGwuZG9uZSkge1xuICAgICAgICAgIHRyYWNlPy4oYHJ1bkhvc3RPcHRpbWl6ZTogZG9uZSB0ZXh0TGVuPSR7dGV4dE5vdy5sZW5ndGh9YCk7XG4gICAgICAgICAgcmV0dXJuIHRleHROb3c7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGludGVydmFsTXMpKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHJwYy5jYWxsKCdvcHRpbWl6ZS5hYm9ydCcsIHsgdGFza0lkIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1QzNEXHU1MjlCXG4gICAgfVxuICB9XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIC8qKiBcdTUzOUZcdTU5Q0JcdTk1MTlcdThCRUZcdTdFQzZcdTgyODJcdUZGMDhcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTU5MzFcdThEMjVcdTdCNDlcdTUzOUZcdTU2RTBcdUZGMENcdTUzNjFcdTcyNDdcdTY2M0VcdTc5M0FcdTUxRkFcdTY3NjVcdTRGQkZcdTRFOEVcdThCQ0FcdTY1QURcdUZGMDkgKi9cbiAgZXJyb3JEZXRhaWw6IHN0cmluZyB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbiAgLyoqIFx1NkQ0MVx1NUYwRlx1NEYxOFx1NTMxNlx1NEUyRFx1NzY4NFx1NTg5RVx1OTFDRlx1NjU4N1x1NjcyQ1x1RkYwOG9wdGltaXppbmcgXHU2MDAxXHU1QjlFXHU2NUY2XHU2NkY0XHU2NUIwXHVGRjFCXHU5NzVFXHU2RDQxXHU1RjBGXHU1MTY4XHU3QTBCXHU0RTNBXHU3QTdBXHU0RTMyXHVGRjA5ICovXG4gIGRyYWZ0OiBzdHJpbmc7XG4gIC8qKiBcdTUzRDFcdThENzdcdTRGMThcdTUzMTZcdTc2ODRcdTRGMUFcdThCREQgaWRcdUZGMDhudWxsID0gXHU2NzJBXHU3RUQxXHU1QjlBL1x1NTE2OFx1NUM0MFx1RkYwOVx1RkYxQVx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1NTNFQVx1NUM1RVx1NEU4RVx1OEJFNVx1NEYxQVx1OEJERFx1RkYwQ1x1NTIwN1x1OEQ3MFx1NEUwRFx1OERERlx1OTY4RiAqL1xuICBzZXNzaW9uSWQ6IHN0cmluZyB8IG51bGw7XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTVGNTNcdTUyNERcdTZCNjVcdTlBQTRcdUZGMDgnbW9kZWwnIHwgJ3N0YXJ0JyB8ICdwb2xsJyB8IG51bGxcdUZGMDlcdUZGMUFcdTUzNjFcdTcyNDdcdTY2M0VcdTc5M0FcdThGREJcdTVFQTZcdUZGMENcdTVCOUFcdTRGNERcdTUzNjFcdTcwQjkgKi9cbiAgc3RlcDogJ21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcgfCBudWxsO1xufVxuXG4vKiogXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjFBcmVkdWNlciBcdTZDMzhcdTRFMERcdTUxOTlcdTU2REVcdTVCODNcdTYyMTZcdThGRDRcdTU2REVcdTUzRUZcdTUzRDhcdTc2ODRcdTY1QjBcdTVCRjlcdThDNjFcdUZGMUJcdTZEODhcdThEMzlcdTgwMDVcdUZGMDhUYXNrIDQgc3RvcmUgXHU4MEY2XHU2QzM0XHVGRjA5XHU1RkM1XHU5ODdCXHU0RUU1IHsgLi4uSU5JVElBTF9QUkVWSUVXIH0gXHU0RTNBXHU2QkNGXHU0RjFBXHU4QkREXHU3OUNEXHU1QjUwICovXG5leHBvcnQgY29uc3QgSU5JVElBTF9QUkVWSUVXOiBQcmV2aWV3U3RhdGUgPSB7XG4gIHN0YXR1czogJ2lkbGUnLFxuICByZXN1bHQ6ICcnLFxuICBlcnJvcktpbmQ6IG51bGwsXG4gIGVycm9yRGV0YWlsOiBudWxsLFxuICBnZW5lcmF0aW9uOiAwLFxuICBkcmFmdDogJycsXG4gIHNlc3Npb25JZDogbnVsbCxcbiAgc3RlcDogbnVsbCxcbn07XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdBY3Rpb24gPVxuICB8IHsgdHlwZTogJ2JlZ2luJzsgc2Vzc2lvbklkPzogc3RyaW5nIHwgbnVsbCB9XG4gIHwgeyB0eXBlOiAnc2hvdyc7IHJlc3VsdDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsga2luZDogT3B0aW1pemVFcnJvcktpbmQ7IGRldGFpbD86IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnZ3VpZGUnIH1cbiAgfCB7IHR5cGU6ICdjbG9zZScgfVxuICB8IHsgdHlwZTogJ2RyYWZ0JzsgdGV4dDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdzdGVwJzsgc3RlcDogJ21vZGVsJyB8ICdzdGFydCcgfCAncG9sbCcgfCBudWxsIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VQcmV2aWV3KHN0YXRlOiBQcmV2aWV3U3RhdGUsIGFjdGlvbjogUHJldmlld0FjdGlvbik6IFByZXZpZXdTdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdiZWdpbic6XG4gICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycpIHJldHVybiBzdGF0ZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBzdGF0dXM6ICdvcHRpbWl6aW5nJyxcbiAgICAgICAgZXJyb3JLaW5kOiBudWxsLFxuICAgICAgICBlcnJvckRldGFpbDogbnVsbCxcbiAgICAgICAgZHJhZnQ6ICcnLFxuICAgICAgICBzZXNzaW9uSWQ6IGFjdGlvbi5zZXNzaW9uSWQgPz8gbnVsbCxcbiAgICAgICAgc3RlcDogJ21vZGVsJyxcbiAgICAgICAgZ2VuZXJhdGlvbjogc3RhdGUuZ2VuZXJhdGlvbiArIDEsXG4gICAgICB9O1xuICAgIGNhc2UgJ3Nob3cnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAncHJldmlldycsIHJlc3VsdDogYWN0aW9uLnJlc3VsdCwgZHJhZnQ6ICcnIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCwgZXJyb3JEZXRhaWw6IGFjdGlvbi5kZXRhaWwgPz8gbnVsbCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGNhc2UgJ2RyYWZ0JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIGRyYWZ0OiBhY3Rpb24udGV4dCB9IDogc3RhdGU7XG4gICAgY2FzZSAnc3RlcCc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyB7IC4uLnN0YXRlLCBzdGVwOiBhY3Rpb24uc3RlcCB9IDogc3RhdGU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKiogXHU4QkExXHU1MjEyXHU4OUM0XHU1QjlBXHU3Njg0XHU1MTZDXHU1RjAwIEFQSVx1RkYwOFRhc2sgNCBcdThENzdcdTVCNThcdTU3MjhcdUZGMUJjYW5UcmlnZ2VyIFx1NzY4NCAhYnVzeSBcdTUzNEFcdThGQjlcdTYyN0ZcdTYyQzVcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTgwNENcdThEMjNcdUZGMENcdTUxNzZcdTRGNTlcdTRGRERcdTc1NTlcdTRFRTVcdTU5MDdcdTU0MEVcdTdFRURcdTZEODhcdThEMzlcdTgwMDVcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5PcHRpbWl6ZUZyb20oc3RhdHVzOiBQcmV2aWV3U3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGF0dXMgIT09ICdvcHRpbWl6aW5nJztcbn1cbiIsICIvKiogXHU5ODg0XHU4OUM4XHU3MkI2XHU2MDAxXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGIFx1MjAxNFx1MjAxNCBcdTYzMDlcdTk0QUUvXHU5ODg0XHU4OUM4XHU1MzYxL3J1bk9wdGltaXplIFx1NTE3MVx1NEVBQlx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rICovXG5cbmltcG9ydCB7XG4gIElOSVRJQUxfUFJFVklFVyxcbiAgcmVkdWNlUHJldmlldyxcbiAgdHlwZSBQcmV2aWV3QWN0aW9uLFxuICB0eXBlIFByZXZpZXdTdGF0ZSxcbn0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcblxuLyoqIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTM1NVx1NEY4Qlx1NzJCNlx1NjAwMVx1RkYwOFx1NkJDRlx1NjNEMlx1NEVGNlx1NUI5RVx1NEY4Qlx1NEUwMFx1NEVGRFx1RkYxQVx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1NTE4NVx1NTE2OFx1NUM0MFx1NTUyRlx1NEUwMFx1RkYwOSAqL1xubGV0IHN0YXRlOiBQcmV2aWV3U3RhdGUgPSB7IC4uLklOSVRJQUxfUFJFVklFVyB9O1xuY29uc3QgbGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4vKiogXHU4QkZCXHU1RjUzXHU1MjREXHU1RkVCXHU3MTY3XHVGRjA4XHU3QTMzXHU1QjlBXHU1RjE1XHU3NTI4XHU3NkY0XHU1MjMwXHU0RTBCXHU0RTAwXHU2QjIxIGRpc3BhdGNoXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlld0J1c1N0YXRlKCk6IFByZXZpZXdTdGF0ZSB7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLyoqIFx1NkQzRVx1NTNEMVx1NzJCNlx1NjAwMVx1NjczQVx1NTJBOFx1NEY1Q1x1NUU3Nlx1OTAxQVx1NzdFNVx1OEJBMlx1OTYwNVx1ODAwNSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoUHJldmlldyhhY3Rpb246IFByZXZpZXdBY3Rpb24pOiB2b2lkIHtcbiAgc3RhdGUgPSByZWR1Y2VQcmV2aWV3KHN0YXRlLCBhY3Rpb24pO1xuICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykgbGlzdGVuZXIoKTtcbn1cblxuLyoqIFx1OEJBMlx1OTYwNVx1NTNEOFx1NTMxNlx1RkYxQlx1OEZENFx1NTZERVx1OTAwMFx1OEJBMlx1NTFGRFx1NjU3MCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1YnNjcmliZVByZXZpZXdCdXMobGlzdGVuZXI6ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgbGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH07XG59IiwgIi8qKiBcdTUzRUZcdTg5QzFcdThDMDNcdThCRDVcdTYzQTJcdTk0ODhcdUZGMUFcdTcwQjlcdTUxRkIvXHU2RDQxXHU3QTBCXHU4QkExXHU2NTcwXHU3NkY0XHU2M0E1XHU2NjNFXHU3OTNBXHU1NzI4XHU4QkJFXHU3RjZFXHU5NzYyXHU2NzdGXHVGRjA4XHU0RTBEXHU0RjlEXHU4RDU2IGNvbnNvbGUvXHU2NUU1XHU1RkQ3XHVGRjBDXHU3NTI4XHU0RThFXHU2ODRDXHU5NzYyXHU3M0FGXHU1ODgzXHU1QjlBXHU0RjREXHVGRjA5XHUzMDAyICovXG5leHBvcnQgY29uc3QgcHJvYmUgPSB7XG4gIGNsaWNrczogMCxcbiAgbGFzdENsaWNrQXQ6ICcnLFxuICBsYXN0U3RlcDogJycsXG4gIGxhc3RFcnJvcjogJycsXG59O1xuIiwgIi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTIgcnVuT3B0aW1pemUgKyBcdTZBMjFcdTU3NTdcdTdFQTdcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzYgXHUyMDE0XHUyMDE0IFx1NzJCNlx1NjAwMVx1N0VDRlx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRlx1RkYwOHByZXZpZXctYnVzXHVGRjA5XHU1M0QxXHU1RTAzXHVGRjBDXG4gKiAgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMDhcdTY4NENcdTk3NjJcdTZFMzJcdTY3RDNcdTVDNDJcdTVCRjkgaW5wdXQucmlnaHQvb3ZlcmxheSBcdTY5RkRcdTRGNERcdTRFMERcdTYzRDBcdTRGOUJcdThGRDlcdTRFOUJcdTY4MDdcdTUxQzYgcHJvcHNcdUZGMENcbiAqICBcdTdFQzRcdTRFRjZcdTRGOURcdThENTZcdTVCODNcdTRFRUNcdTRGMUFcdTVEMjlcdTVFNzZcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdTIwMTRcdTIwMTRQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4L1x1OTg4NFx1ODlDOFx1NTM2MVx1NEUwRFx1NTNFRlx1ODlDMVx1NzY4NFx1NUI5RVx1NkQ0Qlx1NUI5QVx1OEJCQVx1RkYwOVx1MzAwMiAqL1xuXG5pbXBvcnQge1xuICBjaGVja0NvbmZpZyxcbiAgb3B0aW1pemVTdHJlYW0sXG4gIHJlc29sdmVTZXNzaW9uTW9kZWwsXG4gIFJFUVVFU1RfVElNRU9VVF9NUyxcbiAgdG9FcnJvcktpbmQsXG4gIHR5cGUgTGFuZyxcbiAgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCxcbiAgdHlwZSBQcm9tcHRDb25maWcsXG59IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bkhvc3RPcHRpbWl6ZSwgdHlwZSBIb3N0UnBjIH0gZnJvbSAnLi9zZXNzaW9uLW9wdGltaXplci5qcyc7XG5pbXBvcnQgeyBidWlsZFN5c3RlbVByb21wdCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGRpc3BhdGNoUHJldmlldyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuaW1wb3J0IHsgcHJvYmUgfSBmcm9tICcuL2RlYnVnLXByb2JlLmpzJztcblxuLyoqXG4gKiBcdTVGNTNcdTUyNEQgaW4tZmxpZ2h0IFx1OEJGN1x1NkM0Mlx1NzY4NFx1NjNBN1x1NTIzNlx1NTY2OFx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYwOVx1RkYxQVxuICogLSBcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdTY1RjZcdTRFMkRcdTZCNjJcdTVCODNcdUZGMENcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2hvdygpL2ZhaWwoKSBcdTU5MERcdTZEM0JcdTVERjJcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdUZGMUJcbiAqIC0gcnVuT3B0aW1pemUgXHU0RUU1XHUzMDBDXHU1QjU4XHU1NzI4XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2XHU1NjY4XHUzMDBEXHU0RTNBXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjA4XHU1NDBDXHU0RTAwXHU2NUY2XHU1MjNCXHU1M0VBXHU1MTQxXHU4QkI4XHU0RTAwXHU0RTJBXHU4QkY3XHU2QzQyXHU1NzI4XHU5MDE0XHVGRjA5XHUzMDAyXG4gKiBcdTZDRThcdUZGMUFcdTZBMjFcdTU3NTdcdTdFQTdcdTYxMEZcdTU0NzNcdTc3NDBcdTU5MUFcdTRGMUFcdThCRERcdTU0MENcdTY1RjZcdTRGMThcdTUzMTZcdTRGMUFcdTRFOTJcdTc2RjhcdThCQTlcdThERUZcdTIwMTRcdTIwMTRcdThGOTNcdTUxNjVcdTY4MEZcdTUzNTVcdTRGMUFcdThCRERcdTgwNUFcdTcxMjZcdTc2ODRcdTRFQTRcdTRFOTJcdTRFMEJcdTUzRUZcdTYzQTVcdTUzRDdcdTZCNjRcdTdCODBcdTUzMTZcdTMwMDJcbiAqL1xubGV0IGFjdGl2ZUNvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuLyoqIFx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1NzY4NFx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1RkYwOFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1NjMwOVx1NEYxQVx1OEJERFx1RkYxQVx1NTQwQ1x1NEYxQVx1OEJERFx1OTYzMlx1NjI5Nlx1RkYxQlx1NUYwMlx1NEYxQVx1OEJERFx1OEJBOVx1OERFRlx1RkYwOSAqL1xubGV0IGFjdGl2ZVNlc3Npb25JZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbi8qKiBcdTUxNzNcdTk1RURcdTk4ODRcdTg5QzhcdTUzNjFcdUZGMDhcdTVFNzZcdTRFMkRcdTZCNjJcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVByZXZpZXcoKTogdm9pZCB7XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSB7XG4gICAgYWN0aXZlQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICB9XG4gIGFjdGl2ZVNlc3Npb25JZCA9IG51bGw7XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdjbG9zZScgfSk7XG59XG5cbi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTJcdUZGMUFcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdUZGMDhcdTk2RjZcdTkxNERcdTdGNkVcdUZGMDlcdTIxOTIgXHU4MzQ5XHU3QTNGXHU3QTdBIFx1MjE5MiBcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcdUZGMUJcdTkxNERcdTdGNkVcdTdGM0FcdTU5MzFcdUZGMDhmZXRjaCBcdTkwMUFcdTkwNTNcdUZGMDlcdTIxOTIgZ3VpZGVcdUZGMUJcdTVFNzZcdTUzRDEgXHUyMTkyIFx1NEUyMlx1NUYwM1x1RkYxQlx1OEQ4NVx1NjVGNi9cdTUzRDZcdTZEODggXHUyMTkyIHRpbWVvdXQgXHU2MjE2XHU5NzU5XHU5RUQ4ICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuT3B0aW1pemUoY3R4OiB7XG4gIGdldENvbmZpZygpOiBQcm9tcHRDb25maWc7XG4gIGdldExhbmcoKTogTGFuZztcbiAgZ2V0RHJhZnQoKTogc3RyaW5nO1xuICAvKiogXHU1QkJGXHU0RTNCXHU2QTIxXHU1NzhCXHVGRjA4VUkgXHU2ODA3XHU3QjdFXHVGRjA5XHVGRjFCXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHU1MTg1XHU5MEU4XHU4MUVBXHU4ODRDXHU4OUUzXHU2NzkwICovXG4gIGdldFNlc3Npb25Nb2RlbD8oKTogUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+O1xuICAvKiogXHU1QkJGXHU0RTNCXHU5MDFBXHU5MDUzXHVGRjA4dXNlU2Vzc2lvbk1vZGVsIFx1NUYwMFx1NTQyRlx1NjVGNlx1NzUyOFx1RkYwOVx1RkYxQVx1ODFFQVx1NjcwOSBSUEMgXHUyMTkyIHNlcnZlciBoYWxmIFx1NzY4NCBsbG0uc3RyZWFtXHVGRjBDXHU5NkY2XHU5MTREXHU3RjZFICovXG4gIGhvc3Q/OiB7XG4gICAgcnBjOiBIb3N0UnBjO1xuICB9O1xuICAvKiogXHU1M0QxXHU4RDc3XHU0RjE4XHU1MzE2XHU3Njg0XHU0RjFBXHU4QkREIGlkXHVGRjA4XHU3RUQxXHU1QjlBXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHVGRjBDXHU1MjA3XHU0RjFBXHU4QkREXHU0RTBEXHU4RERGXHU5NjhGXHVGRjA5ICovXG4gIGdldFNlc3Npb25JZD8oKTogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIGNsaWVudCBcdTRGQTdcdThCQ0FcdTY1QURcdTU3Q0JcdTcwQjlcdUZGMDhcdTUxOTlcdTUxNjUgc2VydmVyIFx1OEMwM1x1OEJENVx1NjVFNVx1NUZEN1x1RkYwQ1x1NUI5QVx1NEY0RFx1NTM2MVx1NzBCOVx1RkYwOSAqL1xuICB0cmFjZT8obXNnOiBzdHJpbmcpOiB2b2lkO1xufSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBjb25maWcgPSBjdHguZ2V0Q29uZmlnKCk7XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBwcm9iZS5sYXN0U3RlcCA9ICdydW4nO1xuICBwcm9iZS5sYXN0RXJyb3IgPSAnJztcbiAgY3R4LnRyYWNlPy4oYHJ1bk9wdGltaXplOiBjYWxsZWQgZHJhZnRMZW49JHtkcmFmdC5sZW5ndGh9IHVzZVNlc3Npb25Nb2RlbD0ke2NvbmZpZy51c2VTZXNzaW9uTW9kZWx9YCk7XG4gIGlmICghZHJhZnQpIHtcbiAgICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGVtcHR5IGRyYWZ0IC0+IHJldHVybicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYxQVx1NTQwQ1x1NEYxQVx1OEJERFx1NTcyOFx1OTAxNCBcdTIxOTIgXHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHVGRjA4XHU2MzA5XHU5NEFFIGJ1c3kgXHU1REYyXHU3OTgxXHU3NTI4XHU3MEI5XHU1MUZCXHVGRjBDXHU4RkQ5XHU5MUNDXHU2NjJGXHU3QURFXHU2MDAxXHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHVGRjA5XHVGRjFCXG4gIC8vIFx1NTIwN1x1NjM2Mlx1NEYxQVx1OEJERFx1NTQwRVx1NTNEMVx1OEQ3NyBcdTIxOTIgXHU0RTJEXHU2QjYyXHU2NUU3XHU4QkY3XHU2QzQyXHU4QkE5XHU4REVGXHVGRjA4XHU1NDA0XHU0RjFBXHU4QkREXHU1M0VGXHU3MkVDXHU3QUNCXHU0RjE4XHU1MzE2XHVGRjBDXHU1QkJGXHU0RTNCXHU0RTM0XHU2NUY2XHU0RjFBXHU4QkREXHU3NTMxIGNhbmNlbCBcdTY1MzZcdTVDM0VcdUZGMDlcbiAgY29uc3Qgc2Vzc2lvbklkID0gY3R4LmdldFNlc3Npb25JZD8uKCkgPz8gbnVsbDtcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHtcbiAgICBpZiAoc2Vzc2lvbklkID09PSBhY3RpdmVTZXNzaW9uSWQpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogc2FtZS1zZXNzaW9uIGluZmxpZ2h0IC0+IGRlYm91bmNlJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogZGlmZmVyZW50IHNlc3Npb24gLT4gYWJvcnQgc3RhbGUnKTtcbiAgICBhY3RpdmVDb250cm9sbGVyLmFib3J0KCk7XG4gICAgYWN0aXZlQ29udHJvbGxlciA9IG51bGw7XG4gICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgfVxuICBjdHgudHJhY2U/LigncnVuT3B0aW1pemU6IGRpc3BhdGNoIGJlZ2luJyk7XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdiZWdpbicsIHNlc3Npb25JZCB9KTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlUHJldmlldygpXHVGRjBDXHU0RjlCXHU1MzYxXHU3MjQ3XHU1MTczXHU5NUVEXHU2NUY2XHU1M0Q2XHU2RDg4XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXG4gIGFjdGl2ZVNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIC8vIFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYwOFx1OUVEOFx1OEJBNFx1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NEUzNFx1NjVGNlx1NUJGOVx1OEJERFx1OTAxQVx1OTA1MyBcdTIwMTRcdTIwMTQgXHU5NkY2XHU5MTREXHU3RjZFXHVGRjBDXHU2NUUwXHU5NzAwIGNoZWNrQ29uZmlnXG4gICAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgY3R4Lmhvc3QpIHtcbiAgICAgIGN0eC50cmFjZT8uKCdydW5PcHRpbWl6ZTogaG9zdCBicmFuY2ggLT4gcnVuSG9zdE9wdGltaXplJyk7XG4gICAgICBhd2FpdCBydW5Ib3N0T3B0aW1pemUoe1xuICAgICAgICBycGM6IGN0eC5ob3N0LnJwYyxcbiAgICAgICAgbGFuZzogY3R4LmdldExhbmcoKSxcbiAgICAgICAgdGV4dDogZHJhZnQsXG4gICAgICAgIHN5c3RlbTogYnVpbGRTeXN0ZW1Qcm9tcHQoY3R4LmdldExhbmcoKSksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIG9uRGVsdGE6ICh0ZXh0KSA9PiBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZHJhZnQnLCB0ZXh0IH0pLFxuICAgICAgICBvblN0ZXA6IChzdGVwKSA9PiB7XG4gICAgICAgICAgcHJvYmUubGFzdFN0ZXAgPSBzdGVwO1xuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdzdGVwJywgc3RlcCB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdHJhY2U6IChtc2cpID0+IHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1tkc2gtcHJvbXB0LW9wdGltaXplcl0nLCBtc2cpO1xuICAgICAgICB9LFxuICAgICAgfSkudGhlbihcbiAgICAgICAgKGZpbmFsVGV4dCkgPT4gZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ3Nob3cnLCByZXN1bHQ6IGZpbmFsVGV4dCB9KSxcbiAgICAgICAgKGUpID0+IHtcbiAgICAgICAgICBjb25zdCBpc0Fib3J0ID1cbiAgICAgICAgICAgIChlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB8fFxuICAgICAgICAgICAgKHR5cGVvZiAoZSBhcyB7IG5hbWU/OiB1bmtub3duIH0gfCBudWxsKT8ubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgICAgKGUgYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgICAgICAgICBpZiAoaXNBYm9ydCkge1xuICAgICAgICAgICAgaWYgKHRpbWVkT3V0KSBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6ICd0aW1lb3V0JyBhcyBPcHRpbWl6ZUVycm9yS2luZCB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qga2luZCA9IHRvRXJyb3JLaW5kKGUpLmtpbmQ7XG4gICAgICAgICAgcHJvYmUubGFzdFN0ZXAgPSAnJztcbiAgICAgICAgICBwcm9iZS5sYXN0RXJyb3IgPSBTdHJpbmcoKGUgYXMgeyBtZXNzYWdlPzogdW5rbm93biB9KT8ubWVzc2FnZSA/PyBlKTtcbiAgICAgICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQsIGRldGFpbDogcHJvYmUubGFzdEVycm9yIH0pO1xuICAgICAgICB9LFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmZXRjaCBcdTkwMUFcdTkwNTNcdUZGMDhcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEIvXHU1QkJGXHU0RTNCXHU0RTBEXHU1M0VGXHU3NTI4XHU5NjREXHU3RUE3XHVGRjA5XHU2MjREXHU4OTgxXHU2QzQyXHU5MTREXHU3RjZFXG4gICAgaWYgKCFjaGVja0NvbmZpZyhjb25maWcpLm9rKSB7XG4gICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZ3VpZGUnIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1NkEyMVx1NTc4Qlx1NkEyMVx1NUYwRlx1RkYxQVx1NkQ0Rlx1ODlDOFx1NTY2OCBmZXRjaCBcdTc2RjRcdThGREVcdTgxRUFcdTkxNEQgQVBJXHVGRjA4XHU2RDQxXHU1RjBGXHVGRjA5XG4gICAgLy8gXHU2QTIxXHU1NzhCXHU4OUUzXHU2NzkwXHVGRjFBdXNlU2Vzc2lvbk1vZGVsXHVGRjA4XHU5RUQ4XHU4QkE0XHVGRjA5XHUyMTkyIFx1NUJCRlx1NEUzQlx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NEVDNVx1NEY1QyBtb2RlbCBcdTU0MERcdTU2REVcdTkwMDBcdTRGN0ZcdTc1MjhcdUZGMENcdTk3MDBcdTkxNERcdTdGNkVcdTVERjJcdTVDMzFcdTdFRUFcdUZGMDlcdUZGMUJcdTU0MjZcdTUyMTkgXHUyMTkyIFx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbFxuICAgIGxldCBtb2RlbCA9IGNvbmZpZy5tb2RlbDtcbiAgICBpZiAoY29uZmlnLnVzZVNlc3Npb25Nb2RlbCkge1xuICAgICAgY29uc3Qgc2Vzc2lvbk1vZGVsID0gYXdhaXQgY3R4LmdldFNlc3Npb25Nb2RlbD8uKCk7XG4gICAgICBpZiAoc2Vzc2lvbk1vZGVsICYmIHNlc3Npb25Nb2RlbC5tb2RlbCkgbW9kZWwgPSBzZXNzaW9uTW9kZWwubW9kZWw7XG4gICAgfVxuICAgIGNvbnN0IGVmZmVjdGl2ZSA9IHsgLi4uY29uZmlnLCBtb2RlbCB9O1xuXG4gICAgLy8gXHU1QzU1XHU3OTNBXHU3RDJGXHU3OUVGXHVGRjFBXHU2QjYzXHU2NTg3XHU0RjE4XHU1MTQ4XHVGRjFCXHU2QjYzXHU2NTg3XHU1QzFBXHU2NzJBXHU1MUZBXHU3M0IwXHVGRjA4djQgXHU3Q0ZCXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1XHU2M0E4XHU3NDA2XHVGRjA5XHU2NUY2XHU1QzU1XHU3OTNBXHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjBDXHU4QkE5XHU2RDQxXHU1RjBGXHU3QUNCXHU1MzczXHU1M0VGXHU4OUMxXG4gICAgbGV0IHJlYXNvbmluZyA9ICcnO1xuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgbGV0IHNob3duID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplU3RyZWFtKHtcbiAgICAgICAgY29uZmlnOiBlZmZlY3RpdmUsXG4gICAgICAgIHRleHQ6IGRyYWZ0LFxuICAgICAgICBsYW5nOiBjdHguZ2V0TGFuZygpLFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICBvbkV2ZW50OiAoZGVsdGEpID0+IHtcbiAgICAgICAgICBpZiAoZGVsdGEua2luZCA9PT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgICBjb250ZW50ICs9IGRlbHRhLnRleHQ7XG4gICAgICAgICAgICBzaG93biA9IGNvbnRlbnQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlYXNvbmluZyArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgICAgc2hvd24gPSByZWFzb25pbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQ6IHNob3duIH0pO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdCB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBcdTUxNDhcdTUyMjRcdTVCOUFcdTRFMkRcdTZCNjJcdUZGMUFcdTc1MjhcdTYyMzcvXHU3RUM0XHU0RUY2XHU1M0Q2XHU2RDg4XHU0RTBFXHU4RDg1XHU2NUY2XHU5MEZEXHU4ODY4XHU3M0IwXHU0RTNBIEFib3J0RXJyb3JcdUZGMUJcdTRFQzVcdThEODVcdTY1RjZcdTUxOTlcdTUxNjVcdTk1MTlcdThCRUZcdTYwMDFcbiAgICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgICAoZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAgICAgKHR5cGVvZiAoZSBhcyB7IG5hbWU/OiB1bmtub3duIH0gfCBudWxsKT8ubmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgICAgaWYgKGlzQWJvcnQpIHtcbiAgICAgICAgaWYgKHRpbWVkT3V0KSBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6ICd0aW1lb3V0JyBhcyBPcHRpbWl6ZUVycm9yS2luZCB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2ZhaWwnLCBraW5kOiB0b0Vycm9yS2luZChlKS5raW5kIH0pO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1OTg3Nlx1NUM0Mlx1NTE1Q1x1NUU5NVx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxQVx1OTA1MyByZWplY3QgXHU1REYyXHU4OEFCIC50aGVuIFx1NkQ4OFx1NTMxNlx1RkYxQlx1NkI2NFx1NTkwNFx1NEZERFx1NjJBNCBmZXRjaCBcdTUyMDZcdTY1MkZcdTRFRTVcdTU5MTZcdTc2ODRcdTYxMEZcdTU5MTZcdTVGMDJcdTVFMzhcdUZGMDlcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIHtcbiAgICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgYWN0aXZlU2Vzc2lvbklkID0gbnVsbDtcbiAgICB9XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgfVxufSIsICIvKiogXHU4RjkzXHU1MTY1XHU1MzNBXHU2RDZFXHU1QzQyXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHVGRjFBZ3VpZGUgLyBvcHRpbWl6aW5nIC8gcHJldmlldyAvIGVycm9yIFx1NTZEQlx1NzlDRFx1NTE4NVx1NUJCOVx1NjAwMVxuICogIFx1NzJCNlx1NjAwMVx1Njc2NVx1ODFFQVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOHByZXZpZXctYnVzXHVGRjA5XHVGRjBDXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHMgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUsIGNsb3NlUHJldmlldyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGdldFByZXZpZXdCdXNTdGF0ZSwgc3Vic2NyaWJlUHJldmlld0J1cyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByZXZpZXdDYXJkUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG4gIG9wZW5TZXR0aW5nczogKCkgPT4gdm9pZDtcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTx7IHByb3ZpZGVyOiBzdHJpbmc7IG1vZGVsOiBzdHJpbmcgfSB8IG51bGw+O1xuICBnZXRIb3N0PzogKCkgPT4geyBycGM6IHsgY2FsbDogKGU6IHN0cmluZywgcD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBQcm9taXNlPHsgb2s6IGJvb2xlYW47IHZhbHVlPzogdW5rbm93bjsgZXJyb3I/OiB7IGNvZGU/OiBzdHJpbmcgfSB9PiB9IH0gfCBudWxsO1xuICBnZXRTZXNzaW9uSWQ/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvY2FyZC5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tY2FyZCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogMTJweDtcbiAgcmlnaHQ6IDEycHg7XG4gIGJvdHRvbTogY2FsYygxMDAlICsgOHB4KTtcbiAgei1pbmRleDogNDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1vdmVybGF5LCAjZmZmKTtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMiwgcmdiYSgxMjgsMTI4LDEyOCwwLjMpKTtcbiAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgYm94LXNoYWRvdzogMCA4cHggMjRweCByZ2JhKDAsIDAsIDAsIDAuMTYpO1xuICBwYWRkaW5nOiAxMnB4IDE0cHg7XG4gIG1heC1oZWlnaHQ6IDMyMHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5kc2gtcG8tY2FyZC1oZWFkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnksICMyMjIpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG4uZHNoLXBvLWNhcmQtYm9keSB7XG4gIG92ZXJmbG93OiBhdXRvO1xuICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5LCAjNDQ0KTtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMS42O1xuICBtYXgtaGVpZ2h0OiAyMDBweDtcbn1cbi5kc2gtcG8tY2FyZC1lcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEzcHg7XG59XG4uZHNoLXBvLWNhcmQtc3RlcCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtdGV4dC1zZWNvbmRhcnksICM4YzkzYTEpO1xuICBmb250LXNpemU6IDEycHg7XG4gIG1hcmdpbi1sZWZ0OiA0cHg7XG59XG4uZHNoLXBvLWNhcmQtZXJyLWRldGFpbCB7XG4gIG1hcmdpbi10b3A6IDRweDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy10ZXh0LXNlY29uZGFyeSwgIzhjOTNhMSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgd29yZC1icmVhazogYnJlYWstYWxsO1xufVxuLmRzaC1wby1jYXJkLXJvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBmbGV4LXdyYXA6IHdyYXA7XG59XG4uZHNoLXBvLWNhcmQtYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMHB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5LCAjMjIyKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbn1cbi5kc2gtcG8tY2FyZC1idG4ucHJpbWFyeSB7XG4gIC8qIFx1NTE5OVx1NkI3Qlx1NEUzQlx1ODI3Mlx1RkYxQS0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnkgXHU1NzI4XHU2REYxXHU1OTFDXHU2QTIxXHU1RjBGXHU4OUUzXHU2NzkwXHU0RTNBXHU2RDQ1XHU4MjcyIFx1MjE5MiBcdTc2N0RcdTVFOTVcdTc2N0RcdTVCNTdcdTRFMERcdTUzRUZcdThCRkJcdUZGMDhcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDkgKi9cbiAgY29sb3I6ICNmZmY7XG4gIGJhY2tncm91bmQ6ICMxNjc3ZmY7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuLyoqIFx1NjI3RSBjb21wb3NlciBcdThGOTNcdTUxNjVcdTY4NDZcdUZGMUFcdTRGMThcdTUxNDhcdTcxMjZcdTcwQjlcdUZGMENcdTU0MjZcdTUyMTlcdTdCMkNcdTRFMDBcdTRFMkFcdTk3NUUgZGlzYWJsZWQgdGV4dGFyZWEgKi9cbmZ1bmN0aW9uIGZpbmRDb21wb3NlcigpOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50ICYmICFhY3RpdmUuZGlzYWJsZWQpIHJldHVybiBhY3RpdmU7XG4gIGNvbnN0IGFsbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTFRleHRBcmVhRWxlbWVudD4oJ3RleHRhcmVhJyk7XG4gIGZvciAoY29uc3QgdGEgb2YgYWxsKSB7XG4gICAgaWYgKCF0YS5kaXNhYmxlZCkgcmV0dXJuIHRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkQ29tcG9zZXJUZXh0KCk6IHN0cmluZyB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIHJldHVybiB0YSA/IHRhLnZhbHVlIDogJyc7XG59XG5cbi8qKiBcdTc1MjhcdTUzOUZcdTc1MUYgdmFsdWUgc2V0dGVyIFx1NTE5OVx1NTZERVx1RkYwQ1x1OEJBOSBSZWFjdCBcdTUzRDdcdTYzQTdcdTdFQzRcdTRFRjZcdTYxMUZcdTc3RTVcdUZGMDhcdTUxOERcdTZEM0VcdTUzRDEgaW5wdXQgXHU0RThCXHU0RUY2XHU4OUU2XHU1M0QxIG9uQ2hhbmdlXHVGRjA5ICovXG5mdW5jdGlvbiB3cml0ZUNvbXBvc2VyVGV4dCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgdGEgPSBmaW5kQ29tcG9zZXIoKTtcbiAgaWYgKCF0YSkgcmV0dXJuO1xuICBjb25zdCBzZXR0ZXIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxUZXh0QXJlYUVsZW1lbnQucHJvdG90eXBlLCAndmFsdWUnKT8uc2V0O1xuICBpZiAoc2V0dGVyKSB7XG4gICAgc2V0dGVyLmNhbGwodGEsIHRleHQpO1xuICB9IGVsc2Uge1xuICAgIHRhLnZhbHVlID0gdGV4dDtcbiAgfVxuICB0YS5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xuICB0YS5mb2N1cygpO1xufVxuXG5mdW5jdGlvbiBlcnJvcktleShraW5kOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHtcbiAgc3dpdGNoIChraW5kKSB7XG4gICAgLy8ga2luZCBcdTIxOTIgbG9jYWxlIGtleVx1RkYxQidjb25maWcnIFx1NTcyOCBVSSBcdTRFMEFcdTRFMERcdTUzRUZcdThGQkVcdUZGMDhydW5PcHRpbWl6ZSBcdTUxNDhcdThENzAgZ3VpZGVcdUZGMDlcdUZGMENBYm9ydEVycm9yXHUyMTkydGltZW91dCBcdTc1MzEgcnVuT3B0aW1pemUgXHU1MTQ4XHU4ODRDXHU2MkU2XHU2MjJBXHVGRjBDXHU0RkREXHU3NTU5XHU1M0NDXHU0RkREXHU5NjY5XG4gICAgY2FzZSAndW5hdXRob3JpemVkJzogY2FzZSAnZm9yYmlkZGVuJzogY2FzZSAndGltZW91dCc6IGNhc2UgJ25ldHdvcmsnOiBjYXNlICdjb3JzJzogY2FzZSAnaHR0cCc6IGNhc2UgJ2JhZC1yZXNwb25zZSc6IGNhc2UgJ2VtcHR5JzogY2FzZSAnY29uZmlnJzpcbiAgICAgIHJldHVybiBgZXJyb3IuJHtraW5kfWA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnZXJyb3IubmV0d29yayc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFByZXZpZXdDYXJkKHByb3BzOiBQcmV2aWV3Q2FyZFByb3BzKSB7XG4gIGNvbnN0IHsgdCwgZ2V0Q29uZmlnLCBnZXRMYW5nLCBvcGVuU2V0dGluZ3MsIGdldFNlc3Npb25Nb2RlbCwgZ2V0SG9zdCwgZ2V0U2Vzc2lvbklkIH0gPSBwcm9wcztcblxuICAvLyBcdThCQTJcdTk2MDVcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhcdTY2RkZcdTRFRTNcdTRGMUFcdThCREQgc3RvcmUgcHJvcHNcdUZGMDlcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKSk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldFN0YXRlKGdldFByZXZpZXdCdXNTdGF0ZSgpKSksXG4gICAgW10sXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgLy8gXHU1Mzc4XHU4RjdEXHU2NUY2XHU2RTA1XHU3NDA2XHVGRjFBXHU2RTA1XHU5NjY0XHU2MzAyXHU4RDc3XHU3Njg0IGNvcGllZCBcdTU5MERcdTRGNERcdTVCOUFcdTY1RjZcdTU2NjhcdUZGMENcdTVFNzZcdTY4MDdcdThCQjBcdTY3MkFcdTYzMDJcdThGN0RcdUZGMENcbiAgLy8gXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNldENvcGllZCh0cnVlKVx1RkYwOGNvcHkgXHU3Njg0IGF3YWl0IFx1NjcxRlx1OTVGNFx1NTM3OFx1OEY3RFx1RkYwOVx1NTcyOFx1NTM3OFx1OEY3RFx1NTQwRVx1ODlFNlx1NTNEMVx1MzAwMlxuICBjb25zdCBtb3VudGVkUmVmID0gdXNlUmVmKHRydWUpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgY29uc3QgeyBzdGF0dXMsIHJlc3VsdCwgZXJyb3JLaW5kIH0gPSBzdGF0ZTtcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29weVRpbWVyUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuXG4gIC8vIFx1OTg4NFx1ODlDOFx1N0E5N1x1NTNFM1x1N0VEMVx1NUI5QVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1RkYxQVx1NTIwN1x1NjM2Mlx1NTIzMFx1NTIyQlx1NzY4NFx1NEYxQVx1OEJERFx1NjVGNlx1NEUwRFx1OERERlx1OTY4Rlx1NjYzRVx1NzkzQVx1RkYwOFx1NTIwN1x1NTZERVx1NTNEMVx1OEQ3N1x1NEYxQVx1OEJERFx1NjA2Mlx1NTkwRFx1RkYwOVxuICBpZiAoc3RhdHVzICE9PSAnaWRsZScgJiYgc3RhdGUuc2Vzc2lvbklkICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc2lkID0gZ2V0U2Vzc2lvbklkPy4oKTtcbiAgICBpZiAoc2lkICE9PSBudWxsICYmIHN0YXRlLnNlc3Npb25JZCAhPT0gc2lkKSByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoc3RhdHVzID09PSAnaWRsZScpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHJldHJ5ID0gKCkgPT4ge1xuICAgIHZvaWQgcnVuT3B0aW1pemUoe1xuICAgICAgZ2V0Q29uZmlnLFxuICAgICAgZ2V0TGFuZyxcbiAgICAgIGdldERyYWZ0OiAoKSA9PiByZWFkQ29tcG9zZXJUZXh0KCksXG4gICAgICBnZXRTZXNzaW9uTW9kZWwsXG4gICAgICBnZXRIb3N0LFxuICAgICAgZ2V0U2Vzc2lvbklkLFxuICAgICAgdHJhY2U6IChtc2cpID0+IHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbZHNoLXByb21wdC1vcHRpbWl6ZXJdJywgbXNnKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgcmVwbGFjZSA9ICgpID0+IHtcbiAgICB3cml0ZUNvbXBvc2VyVGV4dChyZXN1bHQpO1xuICAgIGNsb3NlUHJldmlldygpO1xuICB9O1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFuYXZpZ2F0b3IuY2xpcGJvYXJkKSByZXR1cm47IC8vIFx1OTc1RVx1NUI4OVx1NTE2OFx1NEUwQVx1NEUwQlx1NjU4N1x1RkYwOGh0dHAgXHU3QjQ5XHVGRjA5XHVGRjFBXHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwQ1x1NEZERFx1NjMwMVx1NTNFRlx1OTFDRFx1OEJENVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChyZXN1bHQpO1xuICAgICAgaWYgKCFtb3VudGVkUmVmLmN1cnJlbnQpIHJldHVybjsgLy8gYXdhaXQgXHU2NzFGXHU5NUY0XHU3RUM0XHU0RUY2XHU1REYyXHU1Mzc4XHU4RjdEXHVGRjFBXHU0RTBEXHU1MThEIHNldFN0YXRlXG4gICAgICBzZXRDb3BpZWQodHJ1ZSk7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0Q29waWVkKGZhbHNlKTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMTIwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyNkFcdThEMzRcdTY3N0ZcdTUxOTlcdTUxNjVcdTU5MzFcdThEMjVcdUZGMUFcdTk3NTlcdTlFRDhcdUZGMDhcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjA5XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZFwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtaGVhZFwiPlxuICAgICAgICA8c3Bhbj57dCgnY2FyZC50aXRsZScpfTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgIFx1MjcxNVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7c3RhdHVzID09PSAnZ3VpZGUnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUudGl0bGUnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUuZGVzYycpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9eygpID0+IHsgY2xvc2VQcmV2aWV3KCk7IG9wZW5TZXR0aW5ncygpOyB9fT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmFjdGlvbicpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnb3B0aW1pemluZycgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj5cbiAgICAgICAgICB7c3RhdGUuZHJhZnQgPyA8c3BhbiBzdHlsZT17eyB3aGl0ZVNwYWNlOiAncHJlLXdyYXAnIH19PntzdGF0ZS5kcmFmdH08L3NwYW4+IDogdCgnY2FyZC5vcHRpbWl6aW5nJyl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ3ByZXZpZXcnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57cmVzdWx0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JlcGxhY2V9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXBsYWNlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weSgpfT5cbiAgICAgICAgICAgICAge2NvcGllZCA/IHQoJ2NhcmQuY29weURvbmUnKSA6IHQoJ2NhcmQuY29weScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ2Vycm9yJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1lcnJcIj57dChlcnJvcktleShlcnJvcktpbmQpKX08L2Rpdj5cbiAgICAgICAgICB7ZXJyb3JEZXRhaWwgPyA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyci1kZXRhaWxcIj57ZXJyb3JEZXRhaWx9PC9kaXY+IDogbnVsbH1cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn0iLCAiLyoqIFx1OEJCRVx1N0Y2RSBcdTIxOTIgR2VuZXJhbCBcdTUzM0FcdTMwMENQcm9tcHQgXHU0RjE4XHU1MzE2XHUzMDBEXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjFBXHU2ODA3XHU5ODk4XHU2NDU4XHU4OTgxICsgXHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1ICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtU3RhdGUsIFNldHRpbmdzRm9ybVZhbHVlcyB9IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybUFjdGlvbnMgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB7IG9uT3BlblNldHRpbmdzUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1Jvd1Byb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBTZXR0aW5nc0Zvcm1TdGF0ZSkgPT4gVCkgPT4gVDtcbiAgYWN0aW9uczogU2V0dGluZ3NGb3JtQWN0aW9ucztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIHNhdmVDb25maWc6ICh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcmVzZXRDb25maWc6ICgpID0+IFByb21pc2U8dm9pZD47XG4gIGdldEVwb2NoOiAoKSA9PiBudW1iZXI7XG4gIC8qKiBcdTVCQkZcdTRFM0JcdTkwMUFcdTkwNTNcdTgxRUFcdTY4QzBcdUZGMUFcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTY2MkZcdTU0MjZcdTUzRUZcdTdFQ0Ygc2VydmVyIGhhbGYgXHU4M0I3XHU1M0Q2XHVGRjA4XHU5NkY2XHU5MTREXHU3RjZFXHU5MDFBXHU5MDUzXHU3Njg0XHU1MDY1XHU1RUI3XHU2M0EyXHU5NDg4XHVGRjA5ICovXG4gIGdldEhvc3RTdGF0dXM/OiAoKSA9PiBQcm9taXNlPHsgYXZhaWxhYmxlOiBib29sZWFuOyBwcm92aWRlcj86IHN0cmluZzsgbW9kZWw/OiBzdHJpbmc7IGVycm9yPzogc3RyaW5nIH0gfCBudWxsPjtcbn1cblxuaW1wb3J0IHsgQlVJTERfSUQgfSBmcm9tICcuL2J1aWxkLWlkLmpzJztcbmltcG9ydCB7IHByb2JlIH0gZnJvbSAnLi9kZWJ1Zy1wcm9iZS5qcyc7XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9zZXR0aW5ncy5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5vcHRpU2V0dGluZ3Mge1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIHBhZGRpbmc6IDE2cHggMDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4ub3B0aVNldHRpbmdzVGl0bGUge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAyMnB4O1xufVxuLm9wdGlTZXR0aW5nc0hpbnQge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0Zvcm0ge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0ZpZWxkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzTGFiZWwge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NJbnB1dCB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1sYXllci0yKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgcGFkZGluZzogNnB4IDhweDtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLm9wdGlTZXR0aW5nc1JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuLm9wdGlTZXR0aW5nc0J0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTJweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG59XG4ub3B0aVNldHRpbmdzQnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUFcdTRFM0JcdTk4OThcdTUzRDhcdTkxQ0ZcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTRGMUFcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDUvXHU2REYxXHU2NzgxXHU3QUVGXHU4MjcyXHVGRjA4XHU5RUQxXHU1RTk1XHU5RUQxXHU1QjU3XHUzMDAxXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU1NzQ3XHU4OEFCXHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5XHVGRjBDXG4gICAgIFx1NTZGQVx1NUI5QVx1NTRDMVx1NzI0Q1x1ODRERCArIFx1NzY3RFx1NUI1N1x1NEZERFx1OEJDMVx1NEVGQlx1NEY1NVx1NEUzQlx1OTg5OFx1NTNFRlx1OEJGQiAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbi5vcHRpU2V0dGluZ3NFcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEycHg7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNldHRpbmdzUm93KHByb3BzOiBTZXR0aW5nc1Jvd1Byb3BzKSB7XG4gIGNvbnN0IHsgdCwgdXNlU3RvcmUsIGFjdGlvbnMsIGdldENvbmZpZywgc2F2ZUNvbmZpZywgcmVzZXRDb25maWcsIGdldEVwb2NoLCBnZXRIb3N0U3RhdHVzIH0gPSBwcm9wcztcbiAgY29uc3QgW2hvc3RTdGF0dXMsIHNldEhvc3RTdGF0dXNdID0gdXNlU3RhdGU8eyBhdmFpbGFibGU6IGJvb2xlYW47IHByb3ZpZGVyPzogc3RyaW5nOyBtb2RlbD86IHN0cmluZzsgZXJyb3I/OiBzdHJpbmcgfSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbLCBmb3JjZV0gPSB1c2VTdGF0ZSgwKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB0aW1lciA9IHNldEludGVydmFsKCgpID0+IGZvcmNlKChuKSA9PiBuICsgMSksIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgfSwgW10pO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZ2V0SG9zdFN0YXR1cykgcmV0dXJuO1xuICAgIGxldCBhbGl2ZSA9IHRydWU7XG4gICAgZ2V0SG9zdFN0YXR1cygpLnRoZW4oKHN0KSA9PiB7IGlmIChhbGl2ZSkgc2V0SG9zdFN0YXR1cyhzdCk7IH0pLmNhdGNoKCgpID0+IHsgaWYgKGFsaXZlKSBzZXRIb3N0U3RhdHVzKHsgYXZhaWxhYmxlOiBmYWxzZSwgZXJyb3I6ICdycGMtZmFpbGVkJyB9KTsgfSk7XG4gICAgcmV0dXJuICgpID0+IHsgYWxpdmUgPSBmYWxzZTsgfTtcbiAgfSwgW2dldEhvc3RTdGF0dXNdKTtcbiAgY29uc3QgW2V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzdWJtaXRSZXZpc2lvbiwgc2V0U3VibWl0UmV2aXNpb25dID0gdXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgdmFsdWVzID0gdXNlU3RvcmUoKHMpID0+IHMudmFsdWVzKTtcbiAgY29uc3Qgc2F2ZWQgPSB1c2VTdG9yZSgocykgPT4gcy5zYXZlZCk7XG4gIGNvbnN0IGVycm9yID0gdXNlU3RvcmUoKHMpID0+IHMuZXJyb3IpO1xuICAvLyBcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFIFJQQyBcdTU5MzFcdThEMjVcdTY1RjZcdTY2M0VcdTc5M0FcdTc2ODRcdTUzOUZcdTU5Q0JcdTk1MTlcdThCRUZcdUZGMDhcdTRFMERcdTUxOERcdTk3NTlcdTlFRDhcdTU5MzFcdThEMjVcdUZGMUFzZXR0aW5ncyBcdTUxOTlcdTUxNjVcdTUxRkFcdTk1MTlcdTVGQzVcdTk4N0JcdThCQTlcdTc1MjhcdTYyMzdcdTc3MEJcdTVGOTdcdTUyMzBcdUZGMDlcbiAgY29uc3QgW3JwY0Vycm9yLCBzZXRScGNFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGNvbmZpZy5tb2RlbCA/IGNvbmZpZy5tb2RlbCA6ICdcdTIwMTQnO1xuXG4gIC8vIFx1OTk5Nlx1NkIyMVx1NjMwMlx1OEY3RCAvIFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1NjVGNlx1NjI4QVx1NUY1M1x1NTI0RFx1OTE0RFx1N0Y2RVx1NjRBRFx1NzlDRFx1OEZEQlx1ODg2OFx1NTM1NVx1MzAwMlxuICAvLyBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGNyA9IFx1NjcyQ1x1NTczMFx1NjNEMFx1NEVBNFx1NUU4Rlx1NTNGNyBzdWJtaXRSZXZpc2lvbiArIGNvbmZpZ0Vwb2NoXHVGRjA4XHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU3RUFBXHU1MTQzXHVGRjA5XHVGRjFBXG4gIC8vICAtIFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1RkYwOFx1OERFOFx1NjgwN1x1N0I3RVx1OTg3NS9cdTU5MTZcdTkwRThcdTUxOTlcdTUxNjUgXHUyMTkyIGluZGV4LnRzIHJlZnJlc2hDb25maWcgXHU3Njg0XHU3RUFBXHU1MTQzXHU5MDEyXHU1ODlFXHVGRjA5XHU0RUU0XHU0RkVFXHU4QkEyXHU1M0Y3XHU4RDg1XHU4RkM3XG4gIC8vICAgIHN0YXRlLnJldmlzaW9uXHVGRjBDXHU5MUNEXHU2NEFEXHU3OUNEXHU3NTFGXHU2NTQ4XHVGRjBDXHU4ODY4XHU1MzU1XHU4RERGXHU0RTBBXHU1RjUyXHU0RTAwXHU1MzE2XHU1NDBFXHU3Njg0XHU5NTVDXHU1MENGXHVGRjFCXG4gIC8vICAtIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkVcdTVERjJcdTkwMUFcdThGQzcgY29tbWl0L3NlZWQgXHU1MTk5XHU1MTY1XHUzMDBDXHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU1RjUzXHU2NUY2XHU3RUFBXHU1MTQzXHUzMDBEXHU3Njg0XHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjBDXHU3RDI3XHU2M0E1XHU3Njg0XHU2NzJDXHU2QjIxXHU2NTQ4XHU1RTk0XG4gIC8vICAgIFx1NTZERVx1OEREMVx1RkYwOFx1N0VBQVx1NTE0M1x1NjcyQVx1NTNEOFx1RkYwOVx1NEZFRVx1OEJBMlx1NTNGN1x1NzZGOFx1N0I0OVx1ODhBQiByZWR1Y2VyIFx1NjI5MVx1NTIzNiBcdTIxOTIgXHU0RkREXHU0RjRGXHU3NTI4XHU2MjM3XHU1MzlGXHU1OUNCXHU4RjkzXHU1MTY1XHU0RTBFXHUzMDBDXHU1REYyXHU0RkREXHU1QjU4XHUzMDBEXHU2M0QwXHU3OTNBXHVGRjFCXG4gIC8vICAgIFx1NEUwQlx1NkIyMVx1NjcyQ1x1NTczMFx1NTJBOFx1NEY1Q1x1RkYwOGVkaXQvY29tbWl0XHVGRjA5XHU1MThEXHU2MjhBIHN0YXRlLnJldmlzaW9uIFx1NjJBQ1x1NTIzMFx1NEUwRVx1N0VBQVx1NTE0M1x1NEUwMFx1ODFGNFx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFjdGlvbnMuc2VlZChcbiAgICAgIHsgYmFzZVVybDogY29uZmlnLmJhc2VVcmwsIGFwaUtleTogY29uZmlnLmFwaUtleSwgbW9kZWw6IGNvbmZpZy5tb2RlbCB9LFxuICAgICAgc3VibWl0UmV2aXNpb24gKyBnZXRFcG9jaCgpLFxuICAgICk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB9LCBbY29uZmlnLmJhc2VVcmwsIGNvbmZpZy5hcGlLZXksIGNvbmZpZy5tb2RlbCwgZ2V0RXBvY2hdKTtcblxuICAvLyBcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdUZGMDhcdTk4ODRcdTg5QzhcdTUzNjFcdTY3MkFcdTkxNERcdTdGNkVcdTVGMTVcdTVCRkNcdUZGMDlcdTIxOTIgXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1XG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoKCkgPT4gc2V0RXhwYW5kZWQodHJ1ZSkpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlU2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICBjb25zdCBlcnJvcnMgPSBhY3Rpb25zLnZhbGlkYXRlKHZhbHVlcyk7XG4gICAgaWYgKGVycm9ycykge1xuICAgICAgYWN0aW9ucy5mYWlsKE9iamVjdC52YWx1ZXMoZXJyb3JzKVswXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzYXZlQ29uZmlnKHZhbHVlcyk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgICAgLy8gXHU0RTBFXHU2NTQ4XHU1RTk0XHU1NkRFXHU4REQxXHU3Njg0IHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjA4XHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU3RUFBXHU1MTQzXHVGRjA5XHU1QkY5XHU5RjUwXHVGRjBDXHU0RjdGXHU0RkREXHU1QjU4XHU1NDBFXHU3Njg0XHU5MUNEXHU2NEFEXHU3OUNEXHU4OEFCXHU2MjkxXHU1MjM2XG4gICAgICBhY3Rpb25zLmNvbW1pdChzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3Muc2F2ZUZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVSZXNldCA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcmVzZXRDb25maWcoKTtcbiAgICAgIGFjdGlvbnMuc2VlZChcbiAgICAgICAgeyBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLCBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSwgbW9kZWw6IERFRkFVTFRTLm1vZGVsIH0sXG4gICAgICAgIHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCksXG4gICAgICApO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3MucmVzZXRGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NUaXRsZVwiIG9uQ2xpY2s9eygpID0+IHNldEV4cGFuZGVkKCh2KSA9PiAhdil9IHN0eWxlPXt7IGN1cnNvcjogJ3BvaW50ZXInIH19PlxuICAgICAgICB7dCgnc2V0dGluZ3MudGl0bGUnKX1cbiAgICAgICAgeyFleHBhbmRlZCAmJlxuICAgICAgICAgICh2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsID8gKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QoJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnKX08L3NwYW4+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KHZhbHVlcy5hcGlLZXkgPyAnY2FyZC5jb25maWd1cmVkLmhpbnQnIDogJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnKS5yZXBsYWNlKCd7bW9kZWx9JywgbW9kZWxMYWJlbCl9PC9zcGFuPlxuICAgICAgICAgICkpfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtleHBhbmRlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRm9ybVwiPlxuICAgICAgICAgIHtnZXRIb3N0U3RhdHVzICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIiBzdHlsZT17eyBmbGV4RGlyZWN0aW9uOiAncm93JyB9fT5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKScgfX0+XG4gICAgICAgICAgICAgICAgY2xpY2tzOiB7cHJvYmUuY2xpY2tzfVxuICAgICAgICAgICAgICAgIHtwcm9iZS5sYXN0Q2xpY2tBdCA/IGAgXHUwMEI3ICR7cHJvYmUubGFzdENsaWNrQXQuc2xpY2UoMTEsIDE5KX1gIDogJyd9XG4gICAgICAgICAgICAgICAge3Byb2JlLmxhc3RTdGVwID8gYCBcdTAwQjcgc3RlcDogJHtwcm9iZS5sYXN0U3RlcH1gIDogJyd9XG4gICAgICAgICAgICAgICAge3Byb2JlLmxhc3RFcnJvciA/IGAgXHUwMEI3IGVycjogJHtwcm9iZS5sYXN0RXJyb3J9YCA6ICcnfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgIGNvbG9yOiBob3N0U3RhdHVzPy5hdmFpbGFibGUgPyAndmFyKC0tZHN3LWFsaWFzLXN0YXRlLXN1Y2Nlc3MtcHJpbWFyeSwgIzJmOWU2MyknIDogJ3ZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKScsXG4gICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tZHN3LWFsaWFzLXRleHQtc2Vjb25kYXJ5LCAjOGM5M2ExKScgfX0+e2AgXHUwMEI3IGJ1aWxkICR7QlVJTERfSUR9YH08L3NwYW4+XG4gICAgICAgICAgICAgICAge2hvc3RTdGF0dXMgPT09IG51bGxcbiAgICAgICAgICAgICAgICAgID8gdCgnc2V0dGluZ3MuaG9zdFByb2JlJylcbiAgICAgICAgICAgICAgICAgIDogaG9zdFN0YXR1cy5hdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgPyBgJHt0KCdzZXR0aW5ncy5ob3N0T2snKX0gJHtob3N0U3RhdHVzLnByb3ZpZGVyfS8ke2hvc3RTdGF0dXMubW9kZWx9YFxuICAgICAgICAgICAgICAgICAgICA6IGAke3QoJ3NldHRpbmdzLmhvc3RGYWlsJyl9ICR7aG9zdFN0YXR1cy5lcnJvciA/PyAnJ31gfVxuICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ3VzZVNlc3Npb25Nb2RlbCcsIGUudGFyZ2V0LmNoZWNrZWQpfVxuICAgICAgICAgICAgICAvPnsnICd9XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnKX1cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+e3QoJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnKX08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYmFzZS11cmxcIj57dCgnc2V0dGluZ3MuYmFzZVVybCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWJhc2UtdXJsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmJhc2VVcmx9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtERUZBVUxUUy5iYXNlVXJsfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2Jhc2VVcmwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWFwaS1rZXlcIj57dCgnc2V0dGluZ3MuYXBpS2V5Jyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYXBpLWtleVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5hcGlLZXl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwic2stXHUyMDI2XCJcbiAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdhcGlLZXknLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLW1vZGVsXCI+e3QoJ3NldHRpbmdzLm1vZGVsJyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktbW9kZWxcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NJbnB1dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXt2YWx1ZXMubW9kZWx9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsID8gJ1x1MjAxNCcgOiBERUZBVUxUUy5tb2RlbH1cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gYWN0aW9ucy5lZGl0KCdtb2RlbCcsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NSb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0J0biBwcmltYXJ5XCIgb25DbGljaz17aGFuZGxlU2F2ZX0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5zYXZlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0J0blwiIG9uQ2xpY2s9e2hhbmRsZVJlc2V0fT5cbiAgICAgICAgICAgICAge3QoJ3NldHRpbmdzLnJlc2V0Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIHtzYXZlZCAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+e3QoJ3NldHRpbmdzLnNhdmVkJyl9PC9zcGFuPn1cbiAgICAgICAgICAgIHtycGNFcnJvciAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NFcnJcIj57cnBjRXJyb3J9PC9zcGFuPn1cbiAgICAgICAgICAgIHshcnBjRXJyb3IgJiYgZXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3QoZXJyb3IpfTwvc3Bhbj59XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+e3QoJ3NldHRpbmdzLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIiwgIi8qKiBcdTY3ODRcdTVFRkEgSURcdUZGMUFcdTUzNjBcdTRGNERcdTdCMjZcdTc1MzEgc2NyaXB0cy9idWlsZC5tanMgXHU1NzI4XHU2Nzg0XHU1RUZBXHU2NUY2XHU2NkZGXHU2MzYyXHU0RTNBXHU1RjUzXHU1MjREIGdpdCBcdTc3RURcdTU0QzhcdTVFMENcdUZGMDhcdTY2M0VcdTc5M0FcdTU3MjhcdThCQkVcdTdGNkVcdTk3NjJcdTY3N0ZcdUZGMENcdTc4NkVcdThCQTRcdTY4NENcdTk3NjJcdTUyQTBcdThGN0RcdTc2ODRcdTY2MkZcdTY3MDBcdTY1QjAgZGlzdFx1RkYwOVx1MzAwMiAqL1xuZXhwb3J0IGNvbnN0IEJVSUxEX0lEID0gJ19fQlVJTERfSURfXyc7XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOVx1RkYxQVx1ODM0OVx1N0EzRiArIFx1NjgyMVx1OUE4QyArIFx1NEZERFx1NUI1OFx1NTJBOFx1NEY1QyAqL1xuXG5pbXBvcnQgeyBkZWZpbmVTdG9yZSB9IGZyb20gJ0BkZWVwc2Vlay1haS9kc2gtY2xpZW50LXJ1bnRpbWUvY2xpZW50JztcbmltcG9ydCB7XG4gIElOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgcmVkdWNlU2V0dGluZ3NGb3JtLFxuICB2YWxpZGF0ZVNldHRpbmdzRm9ybSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1TdGF0ZSxcbiAgdHlwZSBTZXR0aW5nc0Zvcm1WYWx1ZXMsXG59IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtQWN0aW9ucyB7XG4gIHNlZWQodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBlZGl0KGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICBjb21taXQocmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGZhaWwobWVzc2FnZTogc3RyaW5nKTogdm9pZDtcbiAgLyoqIFx1NEZERFx1NUI1OFx1NTI0RFx1NjgyMVx1OUE4Q1x1RkYxQlx1OEZENFx1NTZERVx1OTUxOVx1OEJFRlx1NUI1N1x1NTE3OFx1RkYxQlx1NjVFMFx1OTUxOVx1OEJFRlx1NjVGNlx1OEZENFx1NTZERSBudWxsICovXG4gIHZhbGlkYXRlKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IG51bGw7XG59XG5cbi8qKiBkZWZpbmVTdG9yZSBcdThGRDRcdTU2REVcdTc2ODQgc3RvcmUgXHU1M0U1XHU2N0M0XHVGRjA4XHU1NDBDXHU2NUY2XHU1M0VGXHU0RjVDXHU3QzdCXHU1NzhCXHU1MzYwXHU0RjREXHVGRjBDXHU0RjlCXHU2Q0U4XHU1MThDXHU2NUY2IGBzdG9yZTpgIFx1NEY3Rlx1NzUyOFx1RkYwOSAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSB7XG4gIC8vIFx1OEZEMFx1ODg0Q1x1NjVGNlx1NUY2Mlx1NzJCNlx1NzUzMSBEU0ggXHU2M0QwXHU0RjlCXHVGRjFCXHU2QjY0XHU1OTA0XHU0RUM1XHU0RTNBXHU2NTg3XHU2ODYzXHU2MDI3XHU3QzdCXHU1NzhCXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSA9ICgpOiBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZSA9PiB7XG4gIGNvbnN0IGhhbmRsZSA9IGRlZmluZVN0b3JlKHtcbiAgICBpbml0OiAoKTogU2V0dGluZ3NGb3JtU3RhdGUgPT4gKHtcbiAgICAgIC8vIFx1NkJDRlx1NUI5RVx1NEY4Qlx1NTI2Rlx1NjcyQ1x1RkYxQUlOSVRJQUxfU0VUVElOR1NfRk9STSBcdTY2MkZcdTUzRUFcdThCRkJcdTUxNzFcdTRFQUJcdTVFMzhcdTkxQ0ZcdUZGMENcdTUyRkZcdThERThcdTVCOUVcdTRGOEJcdTUxNzFcdTRFQUJcdTVGMTVcdTc1MjhcdUZGMDhyZWR1Y2VyIFx1NzY4NCBkcmFmdCBcdTUxOTlcdTUxNjVcdTk3MDBcdTUzRDdcdTRGRERcdTYyQTRcdUZGMDlcbiAgICAgIC4uLklOSVRJQUxfU0VUVElOR1NfRk9STSxcbiAgICAgIHZhbHVlczogeyAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0udmFsdWVzIH0sXG4gICAgfSksXG4gICAgYWN0aW9uczoge1xuICAgICAgc2VlZDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnc2VlZCcsIHZhbHVlcywgcmV2aXNpb24gfSkpLFxuICAgICAgZWRpdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdlZGl0JywgZmllbGQsIHZhbHVlIH0pKSxcbiAgICAgIGNvbW1pdDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdjb21taXQnLCByZXZpc2lvbiB9KSksXG4gICAgICBmYWlsOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIG1lc3NhZ2U6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZmFpbCcsIG1lc3NhZ2UgfSkpLFxuICAgICAgdmFsaWRhdGU6IChfZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlcyk7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhlcnJvcnMpLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBlcnJvcnM7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTVcdTY4MjFcdTlBOEMgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtVmFsdWVzIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMUFcdTRGMThcdTUzMTZcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOCBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCB1cmwgPSB2YWx1ZXMuYmFzZVVybC50cmltKCk7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG4gICAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgICB9XG4gIH1cblxuICBpZiAoIXZhbHVlcy5hcGlLZXkudHJpbSgpKSBlcnJvcnMuYXBpS2V5ID0gJ3NldHRpbmdzLmFwaUtleSc7XG4gIGlmICghdmFsdWVzLnVzZVNlc3Npb25Nb2RlbCAmJiAhdmFsdWVzLm1vZGVsLnRyaW0oKSkgZXJyb3JzLm1vZGVsID0gJ3NldHRpbmdzLm1vZGVsJztcblxuICByZXR1cm4gZXJyb3JzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7XG4gIGRpcnR5OiBib29sZWFuO1xuICBzYXZlZDogYm9vbGVhbjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHJldmlzaW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBJTklUSUFMX1NFVFRJTkdTX0ZPUk06IFNldHRpbmdzRm9ybVN0YXRlID0ge1xuICB2YWx1ZXM6IHsgYmFzZVVybDogJycsIGFwaUtleTogJycsIG1vZGVsOiAnJywgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlIH0sXG4gIGRpcnR5OiBmYWxzZSxcbiAgc2F2ZWQ6IGZhbHNlLFxuICBlcnJvcjogbnVsbCxcbiAgcmV2aXNpb246IC0xLFxufTtcblxuZXhwb3J0IHR5cGUgU2V0dGluZ3NGb3JtQWN0aW9uID1cbiAgfCB7IHR5cGU6ICdzZWVkJzsgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2VkaXQnOyBmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzOyB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB9XG4gIHwgeyB0eXBlOiAnY29tbWl0JzsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlU2V0dGluZ3NGb3JtKHN0YXRlOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgYWN0aW9uOiBTZXR0aW5nc0Zvcm1BY3Rpb24pOiBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzZWVkJzpcbiAgICAgIHJldHVybiBhY3Rpb24ucmV2aXNpb24gPD0gc3RhdGUucmV2aXNpb25cbiAgICAgICAgPyBzdGF0ZVxuICAgICAgICA6IHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5hY3Rpb24udmFsdWVzIH0sIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5zdGF0ZS52YWx1ZXMsIFthY3Rpb24uZmllbGRdOiBhY3Rpb24udmFsdWUgfSwgZGlydHk6IHRydWUsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgICBjYXNlICdjb21taXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IHRydWUsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZXJyb3I6IGFjdGlvbi5tZXNzYWdlIH07XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNVTyxJQUFNLFdBQXlCO0FBQUEsRUFDcEMsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsaUJBQWlCO0FBQ25CO0FBSU8sU0FBUyxpQkFBaUIsS0FBcUI7QUFDcEQsU0FBTyxJQUFJLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0QztBQUVPLFNBQVMsWUFBWSxLQUE2RDtBQUN2RixRQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksWUFBWSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksU0FBUztBQUN2RyxRQUFNLFNBQVMsT0FBTyxLQUFLLFdBQVcsV0FBVyxJQUFJLFNBQVMsU0FBUztBQUd2RSxRQUFNLFdBQVcsT0FBTyxLQUFLLFVBQVUsWUFBWSxJQUFJLE1BQU0s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QUFDVix1QkFBTyxFQUFFLFdBQVcsT0FBTyxPQUFPLE9BQVEsR0FBNkIsV0FBVyxDQUFDLEVBQUU7QUFBQSxjQUN2RjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUdELFFBQU0sWUFBWSxDQUFDLE1BQXFCO0FBQ3RDLFFBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLE9BQVE7QUFDcEMsVUFBTSxLQUFLLFNBQVM7QUFDcEIsUUFBSSxFQUFFLGNBQWMscUJBQXNCO0FBQzFDLE1BQUUsZUFBZTtBQUNqQix3QkFBb0I7QUFBQSxFQUN0QjtBQUNBLFdBQVMsaUJBQWlCLFdBQVcsU0FBUztBQUNoRDsiLAogICJuYW1lcyI6IFsic3RhdGUiLCAiUmVhY3QiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIiwgImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJzdGF0ZSJdCn0K

    return module.exports;
  }
});
