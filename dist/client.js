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
  const model = typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULTS.model;
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
  let model = config.model;
  if (config.useSessionModel) {
    const sessionModel = await ctx.getSessionModel?.();
    if (sessionModel) model = sessionModel;
  }
  const effective = { ...config, model };
  if (activeController !== null) return;
  dispatchPreview({ type: "begin" });
  const controller = new AbortController();
  activeController = controller;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
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
  const { t, getConfig, getLang, getSessionModel } = props;
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
      getSessionModel
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
  const { t, getConfig, getLang, openSettings, getSessionModel } = props;
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
    void runOptimize({ getConfig, getLang, getDraft: () => readComposerText(), getSessionModel });
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
      !expanded && (config.useSessionModel ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", children: [
        " \xB7 ",
        t("settings.sessionModelEnabled")
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "optiSettingsHint", children: [
        " \xB7 ",
        t(config.apiKey ? "card.configured.hint" : "card.unconfigured.hint").replace("{model}", modelLabel)
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
  const getSessionModel = async () => {
    const info = ctx.sessions?.currentProvideInfo?.getSnapshot?.();
    const sessionId = info?.sessionId;
    if (!sessionId) return null;
    return resolveSessionModel(ctx.connection.api, { sessionId });
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
            getSessionModel
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
            getSessionModel
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9wcmV2aWV3LXN0YXRlLnRzIiwgIi4uL3NyYy9wcmV2aWV3LWJ1cy50cyIsICIuLi9zcmMvb3B0aW1pemVyLXN0b3JlLnRzIiwgIi4uL3NyYy9QcmV2aWV3Q2FyZC50c3giLCAiLi4vc3JjL1NldHRpbmdzUm93LnRzeCIsICIuLi9zcmMvc2V0dGluZ3Mtc3RvcmUudHMiLCAiLi4vc3JjL3NldHRpbmdzLWZvcm0tc3RhdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKiBkc2gtcHJvbXB0LW9wdGltaXplciBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyMDE0IGFwcGx5KGN0eCkgKi9cblxuaW1wb3J0IHR5cGUgeyBDbGllbnRDb250ZXh0IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUywgbWVyZ2VDb25maWcsIHJlc29sdmVTZXNzaW9uTW9kZWwgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBOUywgemgsIGVuLCBsYW5nT2YgfSBmcm9tICcuL2xvY2FsZXMuanMnO1xuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZW1pdE9wdGltaXplUmVxdWVzdCwgZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5pbXBvcnQgeyBPcHRpbWl6ZUJ1dHRvbiB9IGZyb20gJy4vT3B0aW1pemVCdXR0b24udHN4JztcbmltcG9ydCB7IFByZXZpZXdDYXJkIH0gZnJvbSAnLi9QcmV2aWV3Q2FyZC50c3gnO1xuaW1wb3J0IHsgU2V0dGluZ3NSb3cgfSBmcm9tICcuL1NldHRpbmdzUm93LnRzeCc7XG5pbXBvcnQgeyBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuXG4vKipcbiAqIFx1NThGMFx1NjYwRVx1NjNEMlx1NEVGNlx1NEY5RFx1OEQ1Nlx1NzY4NFx1NUJBMlx1NjIzN1x1N0FFRlx1NjcwRFx1NTJBMVx1RkYwOGNvcmRpcyBzZXJ2aWNlIGtleXNcdUZGMDlcdUZGMUFhcHBseSBcdTUxODVcdTdFQ0YgYGN0eC48c2VydmljZT5gIFx1OEJCRlx1OTVFRVx1NzY4NFx1NjcwRFx1NTJBMVx1NUZDNVx1OTg3Qlx1NTcyOFx1NkI2NFx1NThGMFx1NjYwRVx1MzAwMlxuICogXHU1MDNDXHU5ODdCXHU0RTNBXHU2NzBEXHU1MkExXHU1NDBEXHU4MDBDXHU5NzVFXHU1MzA1IGlkXHUyMDE0XHUyMDE0XHU0RTBFXHU1NDBDXHU1RjYyXHU2MDAxXHU1MTQ4XHU0RjhCXHU0RTAwXHU4MUY0XHVGRjA4ZHNoLW1lc3NhZ2UtcmFpbDogW1wic2xvdHNcIixcInNlc3Npb25zXCJdXHVGRjFCXG4gKiBkc2gtYmV0dGVyLXNpZGViYXIgXHU0RUE2XHU1OEYwXHU2NjBFIGxvY2FsZVx1RkYwOVx1RkYxQlx1OTUxOVx1OEJFRlx1NThGMFx1NjYwRVx1NEYxQVx1OEJBOSBmaWJlciBcdTZDMzhcdTRFNDUgUEVORElOR1x1RkYwQ1x1NTQyRlx1NTJBOFx1NUJBMVx1OEJBMVx1NzZGNFx1NjNBNVx1NTIyNFx1NTkzMVx1OEQyNVx1MzAwMlxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gWydzbG90cycsICdzZXNzaW9ucycsICdsb2NhbGUnLCAnY29ubmVjdGlvbiddO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHkoY3R4OiBDbGllbnRDb250ZXh0KSB7XG4gIC8vIDEuIFx1NjU4N1x1Njg0OFxuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIHsgemgsIGVuIH0pLCAncHJvbXB0LW9wdGltaXplcjogbG9jYWxlIHJlZ2lzdHJhdGlvbicpO1xuXG4gIC8vIDIuIFx1OTE0RFx1N0Y2RVx1OTU1Q1x1NTBDRlx1RkYxQVx1ODFFQVx1NjMwMSBSUEMgXHU5MTREXHU3RjZFXHVGRjA4c2VydmVyIGhhbGYgXHU4QkZCXHU1MTk5IH4vLmRzaC9wcm9tcHQtb3B0aW1pemVyLWNvbmZpZy5qc29uXHVGRjBDXHU5MDFBXHU5MDUzXG4gIC8vICcvZHNoLXByb21wdC1vcHRpbWl6ZXInXHUyMDE0XHUyMDE0XHU1NDBDIGRzaC1zdGlja3ktbm90ZSBcdTZBMjFcdTVGMEZcdUZGMDlcdTMwMDJcdTRFMERcdTc1Mjggc2V0dGluZ3NTY29wZVx1RkYxQVx1Njg0Q1x1OTc2Mlx1NUU5NFx1NzUyOFx1NzY4NCBob3N0XG4gIC8vIHNldHRpbmdzIFx1NkNFOFx1NTE4Q1x1ODg2OFx1NUJGOVx1NjcyQVx1NkNFOFx1NTE4QyBuYW1lc3BhY2UgXHU4RkQ0XHU1NkRFIHVuYXZhaWxhYmxlXHVGRjBDc2V0IFx1OTc1OVx1OUVEOFx1NTkzMVx1NjU0OFx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVx1MzAwMlxuICBsZXQgY29uZmlnTWlycm9yOiBQcm9tcHRDb25maWcgPSBtZXJnZUNvbmZpZyh1bmRlZmluZWQpO1xuICBsZXQgY29uZmlnRXBvY2ggPSAwO1xuICBjb25zdCBycGNDb25maWcgPSBhc3luYyAoZW5kcG9pbnQ6IHN0cmluZywgcGF5bG9hZD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx1bmtub3duPiA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3R4LmNvbm5lY3Rpb24ucnBjLmNhbGwoJy9kc2gtcHJvbXB0LW9wdGltaXplcicsIGVuZHBvaW50LCBwYXlsb2FkID8/IHt9KTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgY29uZmlnIHJwYyAke2VuZHBvaW50fSBmYWlsZWQ6ICR7KHJlc3VsdC5lcnJvciAmJiAocmVzdWx0LmVycm9yLmRldGFpbHMgfHwgcmVzdWx0LmVycm9yLmNvZGUpKSB8fCAncnBjIGZhaWxlZCd9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG4gIGNvbnN0IGxvYWRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnBjQ29uZmlnKCdnZXQnKTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHZhbHVlIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyMURcdTZCMjFcdThGREVcdTYzQTVcdTY3MkFcdTVDMzFcdTdFRUFcdTY1RjZcdTRGRERcdTYzMDFcdTlFRDhcdThCQTRcdUZGMUJcdTRFMEJcdTZCMjFcdTRGRERcdTVCNThcdTU0MEVcdTk1NUNcdTUwQ0ZcdTUzNzNcdTY2RjRcdTY1QjBcbiAgICB9XG4gIH07XG4gIHZvaWQgbG9hZENvbmZpZygpO1xuXG4gIC8vIDIuNSBcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTg5RTNcdTY3OTBcdTU2NjhcdUZGMUFcdTUxNDhcdTUzRDZcdTVGNTNcdTUyNERcdTRGMUFcdThCREQgaWRcdUZGMDhzZXNzaW9ucy5jdXJyZW50UHJvdmlkZUluZm9cdUZGMDlcdUZGMENcbiAgLy8gXHU1MThEXHU2N0U1IHNlc3Npb24ubW9kZWxzIFx1MjAxNFx1MjAxNCBcdTRFMERcdTRGMjAgc2Vzc2lvbklkIFx1NjVGNlx1NjcwRFx1NTJBMVx1N0FFRlx1NTZERVx1OTAwMFx1OUVEOFx1OEJBNFx1NkEyMVx1NTc4Qlx1ODAwQ1x1OTc1RVx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYwOFx1NUI5RVx1NkQ0QiBidWdcdUZGMDlcbiAgY29uc3QgZ2V0U2Vzc2lvbk1vZGVsID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4gPT4ge1xuICAgIGNvbnN0IGluZm8gPSAoXG4gICAgICBjdHguc2Vzc2lvbnMgYXMge1xuICAgICAgICBjdXJyZW50UHJvdmlkZUluZm8/OiB7IGdldFNuYXBzaG90PzogKCkgPT4geyBzZXNzaW9uSWQ/OiBzdHJpbmcgfSB9O1xuICAgICAgfSB8IHVuZGVmaW5lZFxuICAgICk/LmN1cnJlbnRQcm92aWRlSW5mbz8uZ2V0U25hcHNob3Q/LigpO1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IGluZm8/LnNlc3Npb25JZDtcbiAgICBpZiAoIXNlc3Npb25JZCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHJlc29sdmVTZXNzaW9uTW9kZWwoY3R4LmNvbm5lY3Rpb24uYXBpIGFzIG5ldmVyLCB7IHNlc3Npb25JZCB9KTtcbiAgfTtcblxuICAvLyAzLiBcdThCRURcdThBMDBcdTk1NUNcdTUwQ0ZcbiAgbGV0IGxhbmc6IExhbmcgPSBsYW5nT2YoY3R4LmxvY2FsZS5nZXRMb2NhbGUoKS5hY3RpdmUpO1xuICBjdHgub24oJ2xvY2FsZS9jaGFuZ2UnLCAoc25hcDogeyBhY3RpdmU6IHN0cmluZyB9KSA9PiB7XG4gICAgbGFuZyA9IGxhbmdPZihzbmFwLmFjdGl2ZSk7XG4gIH0pO1xuXG4gIC8vIDQuIFx1NEYxQVx1OEJERFx1NjlGRFx1NEY0RFx1RkYxQVx1NjMwOVx1OTRBRSArIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1xuICBjdHguaW5qZWN0KFsnc2xvdHMnLCAnc2Vzc2lvbnMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItYnV0dG9uJyxcbiAgICAgICAgICBvcmRlcjogMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3B0aW1pemVCdXR0b24sXG4gICAgICApLFxuICAgICk7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWNhcmQnLFxuICAgICAgICAgIG9yZGVyOiAxMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIG9wZW5TZXR0aW5nczogKCkgPT4gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKSxcbiAgICAgICAgICAgIGdldFNlc3Npb25Nb2RlbCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUHJldmlld0NhcmQsXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDYuIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYwOHJvb3QgXHU0RjVDXHU3NTI4XHU1N0RGXHVGRjA5XG4gIGNvbnN0IHNldHRpbmdzU3RvcmUgPSBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSgpO1xuICBjb25zdCBzYXZlQ29uZmlnID0gYXN5bmMgKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgY29uc3QgbWVyZ2VkID0gbWVyZ2VDb25maWcoeyAuLi5jb25maWdNaXJyb3IsIC4uLnJhdyB9KTtcbiAgICBjb25zdCB3cml0dGVuOiBQcm9tcHRDb25maWcgPSB7XG4gICAgICBiYXNlVXJsOiBtZXJnZWQuYmFzZVVybCxcbiAgICAgIGFwaUtleTogbWVyZ2VkLmFwaUtleS50cmltKCksXG4gICAgICBtb2RlbDogbWVyZ2VkLm1vZGVsLFxuICAgICAgdXNlU2Vzc2lvbk1vZGVsOiBtZXJnZWQudXNlU2Vzc2lvbk1vZGVsLFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7IHBhdGNoOiB7IGJhc2VVcmw6IHdyaXR0ZW4uYmFzZVVybCwgYXBpS2V5OiB3cml0dGVuLmFwaUtleSwgbW9kZWw6IHdyaXR0ZW4ubW9kZWwgfSB9KTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHNhdmVkIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcikpO1xuICAgIH1cbiAgfTtcbiAgY29uc3QgcmVzZXRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgcnBjQ29uZmlnKCdzZXQnLCB7XG4gICAgICAgIHBhdGNoOiB7XG4gICAgICAgICAgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCxcbiAgICAgICAgICBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSxcbiAgICAgICAgICBtb2RlbDogREVGQVVMVFMubW9kZWwsXG4gICAgICAgICAgdXNlU2Vzc2lvbk1vZGVsOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG5cbiAgY3R4LmluamVjdChbJ3Nsb3RzJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLXNldHRpbmdzJyxcbiAgICAgICAgICBvcmRlcjogMzAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBzdG9yZTogc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIHNhdmVDb25maWcsXG4gICAgICAgICAgICByZXNldENvbmZpZyxcbiAgICAgICAgICAgIGdldEVwb2NoOiAoKSA9PiBjb25maWdFcG9jaCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgU2V0dGluZ3NSb3csXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDcuIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYxQUFsdCtPXHVGRjA4XHU3MTI2XHU3MEI5XHU1NzI4IHRleHRhcmVhIFx1NTE4NVx1NjVGNlx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1RkYwOVxuICBjb25zdCBvbktleWRvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGlmICghZS5hbHRLZXkgfHwgZS5jb2RlICE9PSAnS2V5TycpIHJldHVybjtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlbWl0T3B0aW1pemVSZXF1ZXN0KCk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pO1xufVxuXG4vLyBcdTVGMTVcdTc1MjhcdTVCODhcdTUzNkJcdUZGMUFcdTkwN0ZcdTUxNEQgdHJlZS1zaGFrZSBcdTYzODlcdTdDN0JcdTU3OEJcdUZGMDhcdTRFQzVcdTY1ODdcdTY4NjNcdTYwMjdcdUZGMUJcdTY1RTBcdThGRDBcdTg4NENcdTY1RjZcdTg4NENcdTRFM0FcdUZGMDlcbmV4cG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9OyIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjgzOFx1NUZDM1x1RkYxQVx1OTE0RFx1N0Y2RVx1NjgyMVx1OUE4Q1x1MzAwMU9wZW5BSSBcdTUxN0NcdTVCQjlcdThDMDNcdTc1MjhcdTMwMDFcdTdFRDNcdTY3OUNcdTYzRDBcdTUzRDYgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1OTZGNiBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvbXB0Q29uZmlnIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbiAgLyoqIHRydWVcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdUZGMUFcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTc2ODRcdTZBMjFcdTU3OEJcdUZGMUJmYWxzZVx1RkYxQVx1NEY3Rlx1NzUyOFx1NEUwQlx1NjVCOVx1ODFFQVx1NUI5QVx1NEU0OSBtb2RlbCAqL1xuICB1c2VTZXNzaW9uTW9kZWw6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUUzogUHJvbXB0Q29uZmlnID0ge1xuICBiYXNlVXJsOiAnaHR0cHM6Ly9hcGkuZGVlcHNlZWsuY29tJyxcbiAgYXBpS2V5OiAnJyxcbiAgbW9kZWw6ICdkZWVwc2Vlay12NC1mbGFzaCcsXG4gIHVzZVNlc3Npb25Nb2RlbDogdHJ1ZSxcbn07XG5cbmV4cG9ydCB0eXBlIExhbmcgPSAnemgnIHwgJ2VuJztcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUJhc2VVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdXJsLnRyaW0oKS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlQ29uZmlnKHJhdzogUGFydGlhbDxQcm9tcHRDb25maWc+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IFByb21wdENvbmZpZyB7XG4gIGNvbnN0IGJhc2VVcmwgPSB0eXBlb2YgcmF3Py5iYXNlVXJsID09PSAnc3RyaW5nJyAmJiByYXcuYmFzZVVybC50cmltKCkgPyByYXcuYmFzZVVybC50cmltKCkgOiBERUZBVUxUUy5iYXNlVXJsO1xuICBjb25zdCBhcGlLZXkgPSB0eXBlb2YgcmF3Py5hcGlLZXkgPT09ICdzdHJpbmcnID8gcmF3LmFwaUtleSA6IERFRkFVTFRTLmFwaUtleTtcbiAgY29uc3QgbW9kZWwgPSB0eXBlb2YgcmF3Py5tb2RlbCA9PT0gJ3N0cmluZycgJiYgcmF3Lm1vZGVsLnRyaW0oKSA/IHJhdy5tb2RlbC50cmltKCkgOiBERUZBVUxUUy5tb2RlbDtcbiAgY29uc3QgdXNlU2Vzc2lvbk1vZGVsID0gdHlwZW9mIHJhdz8udXNlU2Vzc2lvbk1vZGVsID09PSAnYm9vbGVhbicgPyByYXcudXNlU2Vzc2lvbk1vZGVsIDogREVGQVVMVFMudXNlU2Vzc2lvbk1vZGVsO1xuICByZXR1cm4geyBiYXNlVXJsOiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpLCBhcGlLZXksIG1vZGVsLCB1c2VTZXNzaW9uTW9kZWwgfTtcbn1cblxuZXhwb3J0IHR5cGUgQ29uZmlnUHJvYmxlbSA9ICdtaXNzaW5nLWtleScgfCAnbWlzc2luZy1tb2RlbCcgfCAnYmFkLXVybCc7XG5leHBvcnQgdHlwZSBDb25maWdDaGVjayA9IHsgb2s6IHRydWU7IGNvbmZpZzogUHJvbXB0Q29uZmlnIH0gfCB7IG9rOiBmYWxzZTsgcmVhc29uOiBDb25maWdQcm9ibGVtIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZyhjb25maWc6IFByb21wdENvbmZpZyk6IENvbmZpZ0NoZWNrIHtcbiAgaWYgKCFjb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLWtleScgfTtcbiAgLy8gXHU0RjdGXHU3NTI4XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHU2NUY2XHU2NUUwXHU5NzAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjFCXHU0RUM1XHU4MUVBXHU1QjlBXHU0RTQ5XHU2QTIxXHU1RjBGXHU4OTgxXHU2QzQyIG1vZGVsIFx1OTc1RVx1N0E3QVxuICBpZiAoIWNvbmZpZy51c2VTZXNzaW9uTW9kZWwgJiYgIWNvbmZpZy5tb2RlbC50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1tb2RlbCcgfTtcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKSk7XG4gICAgaWYgKHUucHJvdG9jb2wgIT09ICdodHRwczonICYmIHUucHJvdG9jb2wgIT09ICdodHRwOicpIHRocm93IG5ldyBFcnJvcigncHJvdG9jb2wnKTtcbiAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdiYWQtdXJsJyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBjb25maWcgfTtcbn1cblxuY29uc3QgWkhfU1lTVEVNID1cbiAgJ1x1NEY2MFx1NjYyRlx1NEUwMFx1NTQwRCBwcm9tcHQgXHU0RjE4XHU1MzE2XHU0RTEzXHU1QkI2XHUzMDAyXHU3NTI4XHU2MjM3XHU0RjFBXHU3RUQ5XHU0RjYwXHU0RTAwXHU2QkI1XHU4MzQ5XHU3QTNGIHByb21wdFx1RkYwQ1x1OEJGN1x1NTcyOFx1NEUwRFx1NjUzOVx1NTNEOFx1NTE3Nlx1NjEwRlx1NTZGRVx1NzY4NFx1NTI0RFx1NjNEMFx1NEUwQlx1NUMwNlx1NTE3Nlx1NjUzOVx1NTE5OVx1NEUzQVx1NjZGNFx1NkUwNVx1NjY3MFx1MzAwMVx1NjZGNFx1N0VEM1x1Njc4NFx1NTMxNlx1NzY4NFx1OUFEOFx1OEQyOFx1OTFDRiBwcm9tcHRcdUZGMUEnICtcbiAgJ1x1ODg2NVx1NTE0NVx1N0YzQVx1NTkzMVx1NzY4NFx1NzZFRVx1NjgwN1x1MzAwMVx1N0VBNlx1Njc1Rlx1NEUwRVx1NjcxRlx1NjcxQlx1OEY5M1x1NTFGQVx1NjgzQ1x1NUYwRlx1RkYwOFx1NTNFRlx1NEVDRVx1NEUwQVx1NEUwQlx1NjU4N1x1NTQwOFx1NzQwNlx1NjNBOFx1NjVBRFx1RkYwOVx1RkYwQ1x1NEY3Rlx1NzUyOFx1N0I4MFx1NkQwMVx1NjYwRVx1Nzg2RVx1NzY4NFx1OEJFRFx1OEEwMFx1RkYwQ1x1NTNCQlx1NjM4OVx1NTE5N1x1NEY1OVx1MzAwMicgK1xuICAnXHU0RTBEXHU1Rjk3XHU3RjE2XHU5MDIwXHU4MzQ5XHU3QTNGXHU0RTJEXHU0RTBEXHU1QjU4XHU1NzI4XHU3Njg0XHU0RThCXHU1QjlFXHU2MjE2XHU2MjgwXHU2NzJGXHU3RUM2XHU4MjgyXHUzMDAyXHU1M0VBXHU4RjkzXHU1MUZBXHU0RjE4XHU1MzE2XHU1NDBFXHU3Njg0IHByb21wdCBcdTZCNjNcdTY1ODdcdUZGMENcdTRFMERcdTg5ODFcdTRFRkJcdTRGNTVcdTg5RTNcdTkxQ0FcdTMwMDFcdTUyNERcdTdGMDBcdTYyMTZcdTRFRTNcdTc4MDFcdTU3NTdcdTUzMDVcdTg4RjlcdTMwMDInO1xuXG5jb25zdCBFTl9TWVNURU0gPVxuICAnWW91IGFyZSBhIHByb21wdCBvcHRpbWl6YXRpb24gZXhwZXJ0LiBSZXdyaXRlIHRoZSB1c2VyXFwncyBkcmFmdCBwcm9tcHQgaW50byBhIGNsZWFyZXIsIG1vcmUgc3RydWN0dXJlZCwgaGlnaC1xdWFsaXR5IHByb21wdCAnICtcbiAgJ3dpdGhvdXQgY2hhbmdpbmcgaXRzIGludGVudDogZmlsbCBpbiBtaXNzaW5nIGdvYWxzLCBjb25zdHJhaW50cywgYW5kIGV4cGVjdGVkIG91dHB1dCBmb3JtYXQgd2hlbiByZWFzb25hYmx5IGluZmVyYWJsZSwgJyArXG4gICd1c2UgY29uY2lzZSBhbmQgcHJlY2lzZSBsYW5ndWFnZSwgYW5kIHJlbW92ZSByZWR1bmRhbmN5LiBEbyBub3QgaW52ZW50IGZhY3RzIG9yIHRlY2huaWNhbCBkZXRhaWxzIGFic2VudCBmcm9tIHRoZSBkcmFmdC4gJyArXG4gICdPdXRwdXQgT05MWSB0aGUgb3B0aW1pemVkIHByb21wdCB0ZXh0LCB3aXRoIG5vIGV4cGxhbmF0aW9ucywgcHJlZml4ZXMsIG9yIGNvZGUgZmVuY2VzLic7XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFN5c3RlbVByb21wdChsYW5nOiBMYW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxhbmcgPT09ICd6aCcgPyBaSF9TWVNURU0gOiBFTl9TWVNURU07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFJlcXVlc3RCb2R5KGNvbmZpZzogUHJvbXB0Q29uZmlnLCB0ZXh0OiBzdHJpbmcsIGxhbmc6IExhbmcsIHN0cmVhbSA9IGZhbHNlKTogb2JqZWN0IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChsYW5nKSB9LFxuICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHRleHQgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICBzdHJlYW0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0UmVzdWx0KHJhdzogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHMgPSByYXcudHJpbSgpO1xuICBjb25zdCBmZW5jZSA9IC9eYGBgW2EtekEtWjAtOV8rLV0qXFxuKFtcXHNcXFNdKj8pXFxuP2BgYCQvO1xuICBjb25zdCBtYXRjaGVkID0gcy5tYXRjaChmZW5jZSk7XG4gIGlmIChtYXRjaGVkKSBzID0gbWF0Y2hlZFsxXS50cmltKCk7XG4gIHJldHVybiBzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FuVHJpZ2dlcihkcmFmdDogc3RyaW5nLCBidXN5OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiAhYnVzeSAmJiBkcmFmdC50cmltKCkubGVuZ3RoID4gMDtcbn1cblxuZXhwb3J0IHR5cGUgT3B0aW1pemVFcnJvcktpbmQgPVxuICB8ICdjb25maWcnXG4gIHwgJ3VuYXV0aG9yaXplZCdcbiAgfCAnZm9yYmlkZGVuJ1xuICB8ICdodHRwJ1xuICB8ICd0aW1lb3V0J1xuICB8ICduZXR3b3JrJ1xuICB8ICdjb3JzJ1xuICB8ICdiYWQtcmVzcG9uc2UnXG4gIHwgJ2VtcHR5JztcblxuZXhwb3J0IGNsYXNzIE9wdGltaXplRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCxcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdPcHRpbWl6ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9USU1FT1VUX01TID0gNjBfMDAwO1xuXG5mdW5jdGlvbiBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgcGF5bG9hZCAhPT0gJ29iamVjdCcgfHwgcGF5bG9hZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGNob2ljZXMgPSAocGF5bG9hZCBhcyB7IGNob2ljZXM/OiB1bmtub3duIH0pLmNob2ljZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShjaG9pY2VzKSB8fCBjaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZpcnN0ID0gY2hvaWNlc1swXSBhcyB7IG1lc3NhZ2U/OiB7IGNvbnRlbnQ/OiB1bmtub3duIH0gfTtcbiAgY29uc3QgY29udGVudCA9IGZpcnN0Py5tZXNzYWdlPy5jb250ZW50O1xuICByZXR1cm4gdHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnID8gY29udGVudCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0Vycm9yS2luZChlOiB1bmtub3duKTogT3B0aW1pemVFcnJvciB7XG4gIGlmIChlIGluc3RhbmNlb2YgT3B0aW1pemVFcnJvcikgcmV0dXJuIGU7XG4gIGNvbnN0IGlzQWJvcnQgPVxuICAgICh0eXBlb2YgRE9NRXhjZXB0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGUubmFtZSA9PT0gJ0Fib3J0RXJyb3InKSB8fFxuICAgIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgKGUgYXMgRXJyb3IpLm5hbWUgPT09ICdBYm9ydEVycm9yJyk7XG4gIGlmIChpc0Fib3J0KSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ3RpbWVvdXQnLCAncmVxdWVzdCBhYm9ydGVkJyk7XG4gIGlmIChlIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgY29uc3QgbSA9IFN0cmluZyhlLm1lc3NhZ2UgPz8gJycpO1xuICAgIC8vIFx1NUMzRFx1NTI5Qlx1ODAwQ1x1NEUzQVx1RkYxQUNocm9taXVtIFx1NzY4NCBDT1JTIFx1NTkzMVx1OEQyNVx1OTAxQVx1NUUzOFx1NjYyRiBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gZmV0Y2hcIilcdUZGMDhcdTY1RTAgY29ycyBcdTVCNTdcdTY4MzdcdUZGMDlcdUZGMENcdTRGMUFcdTg0M0RcdTUyMzAgbmV0d29ya1x1RkYxQlx1NkI2NFx1NTIwNlx1NjUyRlx1NEVDNVx1NjM1NVx1ODNCN1x1ODFFQVx1NUUyNiBDT1JTIFx1NUI1N1x1NjgzN1x1NzY4NFx1OTUxOVx1OEJFRlx1MzAwMlxuICAgIGlmICgvY29ycy9pLnRlc3QobSkpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignY29ycycsIG0pO1xuICAgIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIG0gfHwgJ25ldHdvcmsgZXJyb3InKTtcbiAgfVxuICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBTdHJpbmcoKGUgYXMgRXJyb3IpPy5tZXNzYWdlID8/IGUpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9wdGltaXplKG9wdHM6IHtcbiAgY29uZmlnOiBQcm9tcHRDb25maWc7XG4gIHRleHQ6IHN0cmluZztcbiAgbGFuZzogTGFuZztcbiAgc2lnbmFsPzogQWJvcnRTaWduYWw7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG5cbiAgbGV0IHBheWxvYWQ6IHVua25vd247XG4gIHRyeSB7XG4gICAgcGF5bG9hZCA9IGF3YWl0IHJlcy5qc29uKCk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnaW52YWxpZCBKU09OJyk7XG4gIH1cbiAgY29uc3QgY29udGVudCA9IGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQpO1xuICBpZiAoIWNvbnRlbnQgfHwgIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gZXh0cmFjdFJlc3VsdChjb250ZW50KTtcbn1cblxuLyoqXG4gKiBTU0UgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFBXHU1MTg1XHU1QkI5XHU2MjE2XHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHU3Njg0XHU0RTAwXHU2QkI1XHU2NTg3XHU2NzJDXHUzMDAyXG4gKiB2NCBcdTdDRkJcdTZBMjFcdTU3OEJcdUZGMDh2NC1mbGFzaCBcdTdCNDlcdUZGMDlcdTZENDFcdTVGMEZcdTUxNDhcdThGOTNcdTUxRkFcdTk1N0ZcdTZCQjUgcmVhc29uaW5nX2NvbnRlbnRcdUZGMDhcdTYzQThcdTc0MDZcdThGQzdcdTdBMEJcdUZGMDlcdUZGMENcdTk2OEZcdTU0MEVcdTYyNERcdThGOTNcdTUxRkFcbiAqIGNvbnRlbnQgXHU2QjYzXHU2NTg3XHUyMDE0XHUyMDE0XHU0RTI0XHU4MDA1XHU5MEZEXHU4OTgxXHU1QjlFXHU2NUY2XHU1NDQ4XHU3M0IwXHVGRjBDXHU1NDI2XHU1MjE5XHU2M0E4XHU3NDA2XHU2NzFGXHU1MzYxXHU3MjQ3XHU3NzBCXHU4RDc3XHU2NzY1XHU1MENGXHUzMDBDXHU5NzVFXHU2RDQxXHU1RjBGXHUzMDBEXHVGRjA4XHU1QjlFXHU2RDRCIH44MCBcdTRFMkEgY2h1bmtcbiAqIFx1NTE2OFx1NjYyRiByZWFzb25pbmdcdUZGMENcdTZCNjNcdTY1ODdcdTY3MDBcdTU0MEVcdTYyNERcdTUxRkFcdTczQjBcdUZGMDlcdTMwMDJcbiAqL1xuZXhwb3J0IHR5cGUgU3NlRGVsdGEgPVxuICB8IHsga2luZDogJ2NvbnRlbnQnOyB0ZXh0OiBzdHJpbmcgfVxuICB8IHsga2luZDogJ3JlYXNvbmluZyc7IHRleHQ6IHN0cmluZyB9O1xuXG4vKipcbiAqIFx1ODlFM1x1Njc5MFx1NEUwMFx1ODg0QyBTU0UgXHU2NTcwXHU2MzZFXHVGRjFBKGRhdGE6IHsuLi59KSBcdTIxOTIgXHU1ODlFXHU5MUNGXHU0RThCXHU0RUY2XHVGRjFCXG4gKiBbRE9ORV0vXHU5NzVFIGRhdGEgXHU4ODRDL1x1OTc1RSBKU09OL1x1NjVFMFx1NTE4NVx1NUJCOSBkZWx0YSBcdTIxOTIgbnVsbFx1MzAwMlx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFNzZURlbHRhKGxpbmU6IHN0cmluZyk6IFNzZURlbHRhIHwgbnVsbCB7XG4gIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgaWYgKCF0cmltbWVkLnN0YXJ0c1dpdGgoJ2RhdGE6JykpIHJldHVybiBudWxsO1xuICBjb25zdCBkYXRhID0gdHJpbW1lZC5zbGljZSgnZGF0YTonLmxlbmd0aCkudHJpbSgpO1xuICBpZiAoZGF0YSA9PT0gJ1tET05FXScpIHJldHVybiBudWxsO1xuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgZGVsdGE/OiB7IGNvbnRlbnQ/OiB1bmtub3duOyByZWFzb25pbmdfY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBkZWx0YSA9IGZpcnN0Py5kZWx0YTtcbiAgaWYgKHR5cGVvZiBkZWx0YT8uY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdjb250ZW50JywgdGV4dDogZGVsdGEuY29udGVudCB9O1xuICBpZiAodHlwZW9mIGRlbHRhPy5yZWFzb25pbmdfY29udGVudCA9PT0gJ3N0cmluZycpIHJldHVybiB7IGtpbmQ6ICdyZWFzb25pbmcnLCB0ZXh0OiBkZWx0YS5yZWFzb25pbmdfY29udGVudCB9O1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdUZGMUFcdTkwMTBcdTU3NTdcdTg5RTNcdTY3OTAgU1NFXHVGRjBDXHU4RkI5XHU2NTM2XHU4RkI5XHU1NkRFXHU4QzAzIG9uVGV4dChkZWx0YSlcdUZGMUJcdThGRDRcdTU2REVcdTVCOENcdTY1NzRcdTZCNjNcdTY1ODdcdTMwMDJcbiAqIFx1NzZGOFx1NkJENFx1OTc1RVx1NkQ0MVx1NUYwRiBvcHRpbWl6ZSgpXHVGRjFBXHU5OTk2XHU1QjU3XHU2NkY0XHU1RkVCXHUzMDAxXHU5NTdGXHU4RjkzXHU1MUZBXHU0RTBEXHU5NzAwXHU4OTgxXHU3QjQ5XHU1QjhDXHU2NTc0XHU3NTFGXHU2MjEwXHUyMDE0XHUyMDE0XHU2MzA5XHU5NEFFL1x1NTM2MVx1NzI0N1x1ODBGRFx1OEZCOVx1NzUxRlx1NjIxMFx1OEZCOVx1NjYzRVx1NzkzQVx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemVTdHJlYW0ob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgb25FdmVudD86IChkZWx0YTogU3NlRGVsdGEpID0+IHZvaWQ7XG59KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBjb25maWcsIHRleHQsIGxhbmcsIHNpZ25hbCwgb25FdmVudCB9ID0gb3B0cztcbiAgY29uc3QgY2hlY2sgPSBjaGVja0NvbmZpZyhjb25maWcpO1xuICBpZiAoIWNoZWNrLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignY29uZmlnJywgY2hlY2sucmVhc29uKTtcblxuICBsZXQgcmVzOiBSZXNwb25zZTtcbiAgdHJ5IHtcbiAgICByZXMgPSBhd2FpdCBmZXRjaChgJHtub3JtYWxpemVCYXNlVXJsKGNvbmZpZy5iYXNlVXJsKX0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBBdXRob3JpemF0aW9uOiBgQmVhcmVyICR7Y29uZmlnLmFwaUtleX1gLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnLCB0ZXh0LCBsYW5nLCB0cnVlKSksXG4gICAgICBzaWduYWwsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyB0b0Vycm9yS2luZChlKTtcbiAgfVxuXG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDEpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCd1bmF1dGhvcml6ZWQnLCBgSFRUUCA0MDFgKTtcbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2ZvcmJpZGRlbicsIGBIVFRQIDQwM2ApO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2h0dHAnLCBgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gIGlmICghcmVzLmJvZHkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdiYWQtcmVzcG9uc2UnLCAnbWlzc2luZyByZXNwb25zZSBib2R5Jyk7XG5cbiAgY29uc3QgcmVhZGVyID0gcmVzLmJvZHkuZ2V0UmVhZGVyKCk7XG4gIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgbGV0IGJ1ZmZlciA9ICcnO1xuICBsZXQgZnVsbCA9ICcnO1xuICB0cnkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgaWYgKGRvbmUpIGJyZWFrO1xuICAgICAgYnVmZmVyICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcbiAgICAgIGNvbnN0IGxpbmVzID0gYnVmZmVyLnNwbGl0KCdcXG4nKTtcbiAgICAgIGJ1ZmZlciA9IGxpbmVzLnBvcCgpID8/ICcnO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGxpbmUpO1xuICAgICAgICBpZiAoZGVsdGEgIT09IG51bGwpIHtcbiAgICAgICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIGZ1bGwgKz0gZGVsdGEudGV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICB0cnkge1xuICAgICAgcmVhZGVyLnJlbGVhc2VMb2NrKCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTVERjJcdTRFMkRcdTZCNjIvXHU5MUNBXHU2NTNFXHU2NUY2XHU1RkZEXHU3NTY1XG4gICAgfVxuICB9XG4gIC8vIFx1NUMzRVx1ODg0Q1x1RkYwOFx1NjVFMFx1NjM2Mlx1ODg0Q1x1N0VEM1x1NUMzRVx1NzY4NCBkYXRhIFx1ODg0Q1x1RkYwOVxuICBpZiAoYnVmZmVyLnRyaW0oKSkge1xuICAgIGNvbnN0IGRlbHRhID0gZXh0cmFjdFNzZURlbHRhKGJ1ZmZlcik7XG4gICAgaWYgKGRlbHRhICE9PSBudWxsKSB7XG4gICAgICBvbkV2ZW50Py4oZGVsdGEpO1xuICAgICAgaWYgKGRlbHRhLmtpbmQgPT09ICdjb250ZW50JykgZnVsbCArPSBkZWx0YS50ZXh0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0UmVzdWx0KGZ1bGwpO1xuICBpZiAoIWNvbnRlbnQudHJpbSgpKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZW1wdHknLCAnZW1wdHkgY29tcGxldGlvbicpO1xuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTBcdTMwMENcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdTMwMERcdUZGMUFcdThDMDMgY29ubmVjdGlvbiBcdTc2ODQgc2Vzc2lvbi5tb2RlbHMgUlBDXHVGRjBDXHU1M0Q2IGN1cnJlbnQubW9kZWxcdTMwMDJcbiAqIGFwaSBcdTZDRThcdTUxNjVcdTVGMEZcdUZGMDhcdTRFMEUgRFNIIFx1ODlFM1x1ODAyNlx1NEZCRlx1NEU4RVx1NTM1NVx1NkQ0Qlx1RkYwOVx1RkYxQlx1NEVGQlx1NEY1NVx1NTkzMVx1OEQyNVx1OEZENFx1NTZERSBudWxsXHVGRjA4XHU3NTMxXHU4QzAzXHU3NTI4XHU2NUI5XHU1NkRFXHU5MDAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjA5XHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlU2Vzc2lvbk1vZGVsKFxuICBhcGk6XG4gICAgfCB7XG4gICAgICAgIHNlc3Npb25zPzoge1xuICAgICAgICAgIG1vZGVscz86IChwYXlsb2FkPzogdW5rbm93biwgc2lnbmFsPzogQWJvcnRTaWduYWwpID0+IFByb21pc2U8eyBjdXJyZW50PzogeyBtb2RlbD86IHN0cmluZyB9IH0gfCBudWxsPjtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB8IHVuZGVmaW5lZCxcbiAgcGF5bG9hZDogdW5rbm93biA9IHt9LFxuICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICB0cnkge1xuICAgIC8vIFx1NUZDNVx1OTg3Qlx1NjQzQVx1NUUyNiBzZXNzaW9uSWRcdUZGMUFzZXJ2ZXIgXHU3QUVGXHU2MzA5IHJlcXVlc3QucGF5bG9hZC5zZXNzaW9uSWQgXHU2N0U1XHU4QkU1XHU0RjFBXHU4QkREXHU1REYyXHU5MDA5XHU2MkU5XHU3Njg0XHU2QTIxXHU1NzhCXHVGRjBDXG4gICAgLy8gXHU3RjNBXHU1OTMxXHU2NUY2XHU1NkRFXHU5MDAwXHU5RUQ4XHU4QkE0XHVGRjA4ZGVlcHNlZWstdjQtZmxhc2hcdUZGMDlcdTgwMENcdTk3NUVcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMDhcdTVCOUVcdTZENEJcdUZGMDlcbiAgICBjb25zdCByZXMgPSBhd2FpdCBhcGk/LnNlc3Npb25zPy5tb2RlbHM/LihwYXlsb2FkLCBzaWduYWwpO1xuICAgIGNvbnN0IG0gPSByZXM/LmN1cnJlbnQ/Lm1vZGVsO1xuICAgIHJldHVybiB0eXBlb2YgbSA9PT0gJ3N0cmluZycgJiYgbS50cmltKCkgPyBtLnRyaW0oKSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTYzRDJcdTRFRjZcdTY1ODdcdTY4NDggXHUyMDE0IFx1NEUyRFx1ODJGMVx1NTNDQ1x1OEJFRCAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCBjb25zdCBOUyA9ICdwcm9tcHRfb3B0aW1pemVyJztcblxuZXhwb3J0IGNvbnN0IHpoID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnXHU0RjE4XHU1MzE2IHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ1x1NEYxOFx1NTMxNlx1N0VEM1x1Njc5QycsXG4gICdjYXJkLnJlcGxhY2UnOiAnXHU2NkZGXHU2MzYyXHU4MzQ5XHU3QTNGJyxcbiAgJ2NhcmQuY29weSc6ICdcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdcdTVERjJcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5yZXRyeSc6ICdcdTkxQ0RcdTY1QjBcdTRGMThcdTUzMTYnLFxuICAnY2FyZC5kaXNtaXNzJzogJ1x1NjUzRVx1NUYwMycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ1x1NURGMlx1OTE0RFx1N0Y2RSBcdTAwQjcgXHU2QTIxXHU1NzhCIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdcdTY3MkFcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ1x1OEJGN1x1NTE0OFx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUuZGVzYyc6ICdcdTUyNERcdTVGODAgXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTkwMUFcdTc1MjhcdThCQkVcdTdGNkUgXHUyMTkyIFByb21wdCBcdTRGMThcdTUzMTZcdUZGMENcdTU4NkJcdTUxOTlcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDBcdTMwMDFBUEkgS2V5IFx1NEUwRVx1NkEyMVx1NTc4Qlx1NTQwRFx1MzAwMicsXG4gICdndWlkZS5hY3Rpb24nOiAnXHU1M0JCXHU4QkJFXHU3RjZFJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnXHU3N0U1XHU5MDUzXHU0RTg2JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkgS2V5IFx1NjVFMFx1NjU0OFx1NjIxNlx1NURGMlx1OEZDN1x1NjcxRicsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnXHU2NzBEXHU1MkExXHU2MkQyXHU3RUREXHU4QkJGXHU5NUVFXHVGRjA4NDAzXHVGRjA5JyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnXHU4QkY3XHU2QzQyXHU4RDg1XHU2NUY2XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnXHU3RjUxXHU3RURDXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLmNvcnMnOiAnXHU2M0E1XHU1M0UzXHU0RTBEXHU2NTJGXHU2MzAxXHU4REU4XHU1N0RGXHVGRjBDXHU4QkY3XHU2MzYyXHU3NTI4XHU2NTJGXHU2MzAxIENPUlMgXHU3Njg0XHU3RjUxXHU1MTczJyxcbiAgJ2Vycm9yLmh0dHAnOiAnXHU4QkY3XHU2QzQyXHU1OTMxXHU4RDI1XHVGRjA4SFRUUCBcdTk1MTlcdThCRUZcdUZGMDknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NjgzQ1x1NUYwRlx1NUYwMlx1NUUzOCcsXG4gICdlcnJvci5lbXB0eSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTRFM0FcdTdBN0FcdUZGMENcdThCRjdcdTkxQ0RcdThCRDUnLFxuICAnZXJyb3IuY29uZmlnJzogJ1x1OTE0RFx1N0Y2RVx1NEUwRFx1NUI4Q1x1NjU3NFx1RkYwQ1x1OEJGN1x1NTIzMFx1OEJCRVx1N0Y2RVx1NEUyRFx1NjhDMFx1NjdFNScsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgXHU0RjE4XHU1MzE2JyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnXHU5MTREXHU3RjZFXHU2REE2XHU4MjcyXHU2M0E1XHU1M0UzXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVx1RkYxQktleSBcdTY2MEVcdTY1ODdcdTRGRERcdTVCNThcdTU3MjhcdTY3MkNcdTU3MzAnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnXHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbCc6ICdcdTRGN0ZcdTc1MjhcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3MudXNlU2Vzc2lvbk1vZGVsSGludCc6ICdcdTVGMDBcdTU0MkZcdTY1RjZcdTRGMThcdTUzMTZcdThCRjdcdTZDNDJcdThEREZcdTk2OEZcdTRGMUFcdThCRERcdTZBMjFcdTU3OEJcdUZGMUJcdTUxNzNcdTk1RURcdTU0MEVcdTRGN0ZcdTc1MjhcdTRFMEJcdTY1QjlcdTgxRUFcdTVCOUFcdTRFNDlcdTZBMjFcdTU3OEJcdTU0MEQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdcdTVERjJcdTkwMDlcdTYyRTlcdTRGMUFcdThCRERcdTlFRDhcdThCQTRcdTZBMjFcdTU3OEInLFxuICAnc2V0dGluZ3Muc2F2ZSc6ICdcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnXHU2MDYyXHU1OTBEXHU5RUQ4XHU4QkE0JyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1x1NURGMlx1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1x1NEZERFx1NUI1OFx1NTkzMVx1OEQyNScsXG4gICdzZXR0aW5ncy5yZXNldEZhaWxlZCc6ICdcdTkxQ0RcdTdGNkVcdTU5MzFcdThEMjUnLFxuICBcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBlbjogTG9jYWxlRGljdCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ09wdGltaXplIHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ09wdGltaXplZCBwcm9tcHQnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1VzZSBkcmFmdCcsXG4gICdjYXJkLmNvcHknOiAnQ29weScsXG4gICdjYXJkLmNvcHlEb25lJzogJ0NvcGllZCcsXG4gICdjYXJkLnJldHJ5JzogJ1JldHJ5JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdEaXNtaXNzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdPcHRpbWl6aW5nXHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ0NvbmZpZ3VyZWQgXHUwMEI3IG1vZGVsIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdObyBBUEkgY29uZmlndXJlZCcsXG4gICdndWlkZS50aXRsZSc6ICdDb25maWd1cmUgdGhlIEFQSSBmaXJzdCcsXG4gICdndWlkZS5kZXNjJzogJ0dvIHRvIFNldHRpbmdzIFx1MjE5MiBHZW5lcmFsIFx1MjE5MiBQcm9tcHQgT3B0aW1pemVyIGFuZCBmaWxsIGluIHRoZSBlbmRwb2ludCwgQVBJIGtleSwgYW5kIG1vZGVsLicsXG4gICdndWlkZS5hY3Rpb24nOiAnR28gdG8gc2V0dGluZ3MnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdHb3QgaXQnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBrZXkgaXMgaW52YWxpZCBvciBleHBpcmVkJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdBY2Nlc3MgZm9yYmlkZGVuICg0MDMpJyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnUmVxdWVzdCB0aW1lZCBvdXQ7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IubmV0d29yayc6ICdOZXR3b3JrIGVycm9yOyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLmNvcnMnOiAnRW5kcG9pbnQgYmxvY2tzIENPUlM7IHVzZSBhIGdhdGV3YXkgdGhhdCBhbGxvd3MgaXQnLFxuICAnZXJyb3IuaHR0cCc6ICdSZXF1ZXN0IGZhaWxlZCAoSFRUUCBlcnJvciknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgZm9ybWF0JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ0VtcHR5IHJlc3VsdDsgcGxlYXNlIHJldHJ5JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdJbmNvbXBsZXRlIGNvbmZpZ3VyYXRpb247IGNoZWNrIHNldHRpbmdzJyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBPcHRpbWl6ZXInLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdDb25maWd1cmUgdGhlIHJld3JpdGUgZW5kcG9pbnQgKE9wZW5BSS1jb21wYXRpYmxlKTsga2V5IGlzIHN0b3JlZCBsb2NhbGx5IGluIHBsYWluIHRleHQnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdCYXNlIFVSTCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdNb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnOiAnVXNlIGN1cnJlbnQgc2Vzc2lvbiBtb2RlbCcsXG4gICdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWxIaW50JzogJ1doZW4gb24sIG9wdGltaXphdGlvbiByZXF1ZXN0cyBmb2xsb3cgdGhlIHNlc3Npb24gbW9kZWw7IHdoZW4gb2ZmLCB0aGUgY3VzdG9tIG1vZGVsIGJlbG93IGlzIHVzZWQnLFxuICAnc2V0dGluZ3Muc2Vzc2lvbk1vZGVsRW5hYmxlZCc6ICdTZXNzaW9uIGRlZmF1bHQgbW9kZWwgc2VsZWN0ZWQnLFxuICAnc2V0dGluZ3Muc2F2ZSc6ICdTYXZlJyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1Jlc2V0IHRvIGRlZmF1bHRzJyxcbiAgJ3NldHRpbmdzLnNhdmVkJzogJ1NhdmVkJyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnU2F2ZSBmYWlsZWQnLFxuICAnc2V0dGluZ3MucmVzZXRGYWlsZWQnOiAnUmVzZXQgZmFpbGVkJyxcbiAgXG59IGFzIGNvbnN0O1xuXG5leHBvcnQgdHlwZSBMb2NhbGVLZXkgPSBrZXlvZiB0eXBlb2Ygemg7XG5leHBvcnQgdHlwZSBMb2NhbGVEaWN0ID0geyBbSyBpbiBMb2NhbGVLZXldOiBzdHJpbmcgfTtcblxuLyoqIFx1NkZDMFx1NkQzQiBsb2NhbGUgXHUyMTkyIFx1NzU0Q1x1OTc2Mlx1OEJFRFx1OEEwMFx1RkYwOHpoIFx1NTI0RFx1N0YwMFx1NUY1MiB6aFx1RkYwQ1x1NTE3Nlx1NEY1OVx1NUY1MiBlblx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhbmdPZihhY3RpdmU6IHN0cmluZyk6IExhbmcge1xuICByZXR1cm4gdHlwZW9mIGFjdGl2ZSA9PT0gJ3N0cmluZycgJiYgYWN0aXZlLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCgnemgnKSA/ICd6aCcgOiAnZW4nO1xufVxuIiwgIi8qKiBcdTYzRDJcdTRFRjZcdTUxODVcdTkwRThcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdUZGMUJcdTkwN0ZcdTUxNEQgaW5kZXggXHUyMTk0IFx1N0VDNFx1NEVGNlx1NUZBQVx1NzNBRlx1NEY5RFx1OEQ1Nlx1RkYwOVx1RkYxQVxuICogIC0gb3B0aW1pemVSZXF1ZXN0XHVGRjFBXHU1RkVCXHU2Mzc3XHU5NTJFIEFsdCtPIFx1MjE5MiBcdTRGMThcdTUzMTZcdTYzMDlcdTk0QUVcdTg5RTZcdTUzRDFcbiAqICAtIG9wZW5TZXR0aW5nc1JlcXVlc3RcdUZGMUFcdTk4ODRcdTg5QzhcdTUzNjFcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdTIxOTIgXHU4QkJFXHU3RjZFXHU4ODRDXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwICovXG5cbmNvbnN0IG9wdGltaXplUmVxdWVzdExpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3B0aW1pemVSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3B0aW1pemVSZXF1ZXN0TGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3B0aW1pemVSZXF1ZXN0KCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGZuIG9mIG9wdGltaXplUmVxdWVzdExpc3RlbmVycykgZm4oKTtcbn1cblxuY29uc3Qgb3BlblNldHRpbmdzTGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gb25PcGVuU2V0dGluZ3NSZXF1ZXN0KGZuOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIG9wZW5TZXR0aW5nc0xpc3RlbmVycy5hZGQoZm4pO1xuICByZXR1cm4gKCkgPT4gb3BlblNldHRpbmdzTGlzdGVuZXJzLmRlbGV0ZShmbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMpIGZuKCk7XG59XG4iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NjgwRlx1NTNGM1x1NEZBN1x1MzAwQ1x1NEYxOFx1NTMxNlx1MzAwRFx1NjMwOVx1OTRBRSBcdTIwMTRcdTIwMTQgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMENcdTcyQjZcdTYwMDFcdThENzBcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkYgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGdldFByZXZpZXdCdXNTdGF0ZSwgc3Vic2NyaWJlUHJldmlld0J1cyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuaW1wb3J0IHsgb25PcHRpbWl6ZVJlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW1pemVCdXR0b25Qcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgZ2V0TGFuZzogKCkgPT4gTGFuZztcbiAgZ2V0U2Vzc2lvbk1vZGVsPzogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL2J1dHRvbi5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5kc2gtcG8tYnRuIHtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBwYWRkaW5nOiAycHggNnB4O1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAxO1xuICBvcGFjaXR5OiAwLjg1O1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG59XG4uZHNoLXBvLWJ0bjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG4gIG9wYWNpdHk6IDE7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjEyKSk7XG59XG4uZHNoLXBvLWJ0bjpkaXNhYmxlZCB7XG4gIG9wYWNpdHk6IDAuMzU7XG4gIGN1cnNvcjogZGVmYXVsdDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG4vKipcbiAqIFx1OEJGQlx1NTNENlx1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYxQVx1NEYxOFx1NTE0OFx1NTNENlx1NzEyNlx1NzBCOSB0ZXh0YXJlYVx1RkYxQlx1NTQyNlx1NTIxOVx1NTZERVx1OTAwMFx1NTIzMFx1OTg3NVx1OTc2Mlx1NEUyRFx1MzAwQ1x1NTAzQ1x1OTc1RVx1N0E3QVx1MzAwRFx1NzY4NCB0ZXh0YXJlYVxuICogXHVGRjA4XHU3NTI4XHU2MjM3XHU1NzI4XHU4RjkzXHU1MTY1XHU3Njg0XHU1MzczXHU1RjUzXHU1MjREXHU4MzQ5XHU3QTNGXHVGRjA5XHUzMDAyXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREXHU2ODA3XHU1MUM2IGtpdCBcdTc2ODQgaW5wdXQgaG9va1x1MjAxNFx1MjAxNFx1NUI5RVx1NkQ0QlxuICogaW5wdXQucmlnaHQgXHU2RTMyXHU2N0QzXHU2NUY2XHU4QkU1XHU2ODA3XHU1MUM2IHByb3BzIFx1NjcyQVx1NjNEMFx1NEY5Qlx1RkYwQ1x1N0VDNFx1NEVGNlx1NEYxQVx1NTZFMFx1OEMwM1x1NzUyOCB1bmRlZmluZWQgaG9va1xuICogXHU1RDI5XHU2RTgzXHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHVGRjA4UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOCBcdTRFMERcdTUzRUZcdTg5QzFcdUZGMDlcdTMwMDJcbiAqL1xuZnVuY3Rpb24gcmVhZERyYWZ0KCk6IHN0cmluZyB7XG4gIGNvbnN0IGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gIGlmIChhY3RpdmUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSByZXR1cm4gYWN0aXZlLnZhbHVlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICh0YS52YWx1ZS50cmltKCkpIHJldHVybiB0YS52YWx1ZTtcbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBPcHRpbWl6ZUJ1dHRvbihwcm9wczogT3B0aW1pemVCdXR0b25Qcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgZ2V0U2Vzc2lvbk1vZGVsIH0gPSBwcm9wcztcblxuICAvLyBcdTdFNDFcdTVGRDlcdTYwMDFcdUZGMUFcdThCQTJcdTk2MDVcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhcdTY2RkZcdTRFRTNcdTRGMUFcdThCREQgc3RvcmUgcHJvcHNcdUZGMDlcbiAgY29uc3QgW2J1c3ksIHNldEJ1c3ldID0gdXNlU3RhdGUoKCkgPT4gZ2V0UHJldmlld0J1c1N0YXRlKCkuc3RhdHVzID09PSAnb3B0aW1pemluZycpO1xuICB1c2VFZmZlY3QoXG4gICAgKCkgPT4gc3Vic2NyaWJlUHJldmlld0J1cygoKSA9PiBzZXRCdXN5KGdldFByZXZpZXdCdXNTdGF0ZSgpLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKSksXG4gICAgW10sXG4gICk7XG5cbiAgLy8gbW91c2Vkb3duIFx1OTg4NFx1OEJGQlx1ODM0OVx1N0EzRlx1RkYxQVx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVx1NzdBQ1x1OTVGNFx1NzEyNlx1NzBCOVx1NEYxQVx1NTIwN1x1NTIzMFx1NjMwOVx1OTRBRVx1RkYwOGFjdGl2ZUVsZW1lbnQgXHU0RTBEXHU1MThEXHU2NjJGIHRleHRhcmVhXHVGRjA5XHVGRjBDXG4gIC8vIFx1NEY0NiBtb3VzZWRvd24gXHU2NUU5XHU0RThFXHU3MTI2XHU3MEI5XHU1MjA3XHU2MzYyXHUyMDE0XHUyMDE0XHU2QjY0XHU1MjNCXHU4QkZCXHU1MjMwXHU3Njg0IGFjdGl2ZUVsZW1lbnQgXHU0RUNEXHU2NjJGXHU4RjkzXHU1MTY1XHU2ODQ2XHUzMDAyXG4gIGNvbnN0IGRyYWZ0UmVmID0gUmVhY3QudXNlUmVmKCcnKTtcbiAgY29uc3Qgc3luY0RyYWZ0ID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRyYWZ0UmVmLmN1cnJlbnQgPSByZWFkRHJhZnQoKTtcbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChidXN5KSByZXR1cm47XG4gICAgY29uc3QgZHJhZnQgPSBkcmFmdFJlZi5jdXJyZW50IHx8IHJlYWREcmFmdCgpO1xuICAgIGlmICghZHJhZnQudHJpbSgpKSByZXR1cm47XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IGRyYWZ0LFxuICAgICAgZ2V0U2Vzc2lvbk1vZGVsLFxuICAgIH0pO1xuICB9LCBbYnVzeSwgZ2V0Q29uZmlnLCBnZXRMYW5nXSk7XG5cbiAgLy8gQWx0K08gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjA4aW5kZXgudHMgXHU1MTY4XHU1QzQwXHU3NkQxXHU1NDJDXHVGRjA5XHUyMTkyIFx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NjMwOVx1OTRBRVxuICB1c2VFZmZlY3QoKCkgPT4gb25PcHRpbWl6ZVJlcXVlc3QoaGFuZGxlQ2xpY2spLCBbaGFuZGxlQ2xpY2tdKTtcblxuICByZXR1cm4gKFxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPVwiZHNoLXBvLWJ0blwiXG4gICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgdGl0bGU9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICBhcmlhLWJ1c3k9e2J1c3l9XG4gICAgICBkaXNhYmxlZD17YnVzeX1cbiAgICAgIGRhdGEtYnVzeT17YnVzeX1cbiAgICAgIG9uTW91c2VEb3duPXtzeW5jRHJhZnR9XG4gICAgICBvbkZvY3VzPXtzeW5jRHJhZnR9XG4gICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICA+XG4gICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgPC9idXR0b24+XG4gICk7XG59IiwgIi8qKiBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcdTcyQjZcdTYwMDFcdTY3M0EgXHUyMDE0XHUyMDE0IFx1N0VBRiByZWR1Y2VyXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZUVycm9yS2luZCB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcblxuZXhwb3J0IHR5cGUgUHJldmlld1N0YXR1cyA9ICdpZGxlJyB8ICdvcHRpbWl6aW5nJyB8ICdwcmV2aWV3JyB8ICdlcnJvcicgfCAnZ3VpZGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByZXZpZXdTdGF0ZSB7XG4gIHN0YXR1czogUHJldmlld1N0YXR1cztcbiAgcmVzdWx0OiBzdHJpbmc7XG4gIGVycm9yS2luZDogT3B0aW1pemVFcnJvcktpbmQgfCBudWxsO1xuICBnZW5lcmF0aW9uOiBudW1iZXI7XG4gIC8qKiBcdTZENDFcdTVGMEZcdTRGMThcdTUzMTZcdTRFMkRcdTc2ODRcdTU4OUVcdTkxQ0ZcdTY1ODdcdTY3MkNcdUZGMDhvcHRpbWl6aW5nIFx1NjAwMVx1NUI5RVx1NjVGNlx1NjZGNFx1NjVCMFx1RkYxQlx1OTc1RVx1NkQ0MVx1NUYwRlx1NTE2OFx1N0EwQlx1NEUzQVx1N0E3QVx1NEUzMlx1RkYwOSAqL1xuICBkcmFmdDogc3RyaW5nO1xufVxuXG4vKiogXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjFBcmVkdWNlciBcdTZDMzhcdTRFMERcdTUxOTlcdTU2REVcdTVCODNcdTYyMTZcdThGRDRcdTU2REVcdTUzRUZcdTUzRDhcdTc2ODRcdTY1QjBcdTVCRjlcdThDNjFcdUZGMUJcdTZEODhcdThEMzlcdTgwMDVcdUZGMDhUYXNrIDQgc3RvcmUgXHU4MEY2XHU2QzM0XHVGRjA5XHU1RkM1XHU5ODdCXHU0RUU1IHsgLi4uSU5JVElBTF9QUkVWSUVXIH0gXHU0RTNBXHU2QkNGXHU0RjFBXHU4QkREXHU3OUNEXHU1QjUwICovXG5leHBvcnQgY29uc3QgSU5JVElBTF9QUkVWSUVXOiBQcmV2aWV3U3RhdGUgPSB7XG4gIHN0YXR1czogJ2lkbGUnLFxuICByZXN1bHQ6ICcnLFxuICBlcnJvcktpbmQ6IG51bGwsXG4gIGdlbmVyYXRpb246IDAsXG4gIGRyYWZ0OiAnJyxcbn07XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdBY3Rpb24gPVxuICB8IHsgdHlwZTogJ2JlZ2luJyB9XG4gIHwgeyB0eXBlOiAnc2hvdyc7IHJlc3VsdDogc3RyaW5nIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsga2luZDogT3B0aW1pemVFcnJvcktpbmQgfVxuICB8IHsgdHlwZTogJ2d1aWRlJyB9XG4gIHwgeyB0eXBlOiAnY2xvc2UnIH1cbiAgfCB7IHR5cGU6ICdkcmFmdCc7IHRleHQ6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlUHJldmlldyhzdGF0ZTogUHJldmlld1N0YXRlLCBhY3Rpb246IFByZXZpZXdBY3Rpb24pOiBQcmV2aWV3U3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnYmVnaW4nOlxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKSByZXR1cm4gc3RhdGU7XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgc3RhdHVzOiAnb3B0aW1pemluZycsIGVycm9yS2luZDogbnVsbCwgZHJhZnQ6ICcnLCBnZW5lcmF0aW9uOiBzdGF0ZS5nZW5lcmF0aW9uICsgMSB9O1xuICAgIGNhc2UgJ3Nob3cnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAncHJldmlldycsIHJlc3VsdDogYWN0aW9uLnJlc3VsdCwgZHJhZnQ6ICcnIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGNhc2UgJ2RyYWZ0JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyA/IHsgLi4uc3RhdGUsIGRyYWZ0OiBhY3Rpb24udGV4dCB9IDogc3RhdGU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKiogXHU4QkExXHU1MjEyXHU4OUM0XHU1QjlBXHU3Njg0XHU1MTZDXHU1RjAwIEFQSVx1RkYwOFRhc2sgNCBcdThENzdcdTVCNThcdTU3MjhcdUZGMUJjYW5UcmlnZ2VyIFx1NzY4NCAhYnVzeSBcdTUzNEFcdThGQjlcdTYyN0ZcdTYyQzVcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTgwNENcdThEMjNcdUZGMENcdTUxNzZcdTRGNTlcdTRGRERcdTc1NTlcdTRFRTVcdTU5MDdcdTU0MEVcdTdFRURcdTZEODhcdThEMzlcdTgwMDVcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5PcHRpbWl6ZUZyb20oc3RhdHVzOiBQcmV2aWV3U3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGF0dXMgIT09ICdvcHRpbWl6aW5nJztcbn1cbiIsICIvKiogXHU5ODg0XHU4OUM4XHU3MkI2XHU2MDAxXHU2QTIxXHU1NzU3XHU3RUE3XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGIFx1MjAxNFx1MjAxNCBcdTYzMDlcdTk0QUUvXHU5ODg0XHU4OUM4XHU1MzYxL3J1bk9wdGltaXplIFx1NTE3MVx1NEVBQlx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rICovXG5cbmltcG9ydCB7XG4gIElOSVRJQUxfUFJFVklFVyxcbiAgcmVkdWNlUHJldmlldyxcbiAgdHlwZSBQcmV2aWV3QWN0aW9uLFxuICB0eXBlIFByZXZpZXdTdGF0ZSxcbn0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcblxuLyoqIFx1NkEyMVx1NTc1N1x1N0VBN1x1NTM1NVx1NEY4Qlx1NzJCNlx1NjAwMVx1RkYwOFx1NkJDRlx1NjNEMlx1NEVGNlx1NUI5RVx1NEY4Qlx1NEUwMFx1NEVGRFx1RkYxQVx1NkUzMlx1NjdEM1x1OEZEQlx1N0EwQlx1NTE4NVx1NTE2OFx1NUM0MFx1NTUyRlx1NEUwMFx1RkYwOSAqL1xubGV0IHN0YXRlOiBQcmV2aWV3U3RhdGUgPSB7IC4uLklOSVRJQUxfUFJFVklFVyB9O1xuY29uc3QgbGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4vKiogXHU4QkZCXHU1RjUzXHU1MjREXHU1RkVCXHU3MTY3XHVGRjA4XHU3QTMzXHU1QjlBXHU1RjE1XHU3NTI4XHU3NkY0XHU1MjMwXHU0RTBCXHU0RTAwXHU2QjIxIGRpc3BhdGNoXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlld0J1c1N0YXRlKCk6IFByZXZpZXdTdGF0ZSB7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLyoqIFx1NkQzRVx1NTNEMVx1NzJCNlx1NjAwMVx1NjczQVx1NTJBOFx1NEY1Q1x1NUU3Nlx1OTAxQVx1NzdFNVx1OEJBMlx1OTYwNVx1ODAwNSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoUHJldmlldyhhY3Rpb246IFByZXZpZXdBY3Rpb24pOiB2b2lkIHtcbiAgc3RhdGUgPSByZWR1Y2VQcmV2aWV3KHN0YXRlLCBhY3Rpb24pO1xuICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykgbGlzdGVuZXIoKTtcbn1cblxuLyoqIFx1OEJBMlx1OTYwNVx1NTNEOFx1NTMxNlx1RkYxQlx1OEZENFx1NTZERVx1OTAwMFx1OEJBMlx1NTFGRFx1NjU3MCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN1YnNjcmliZVByZXZpZXdCdXMobGlzdGVuZXI6ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgbGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH07XG59IiwgIi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTIgcnVuT3B0aW1pemUgKyBcdTZBMjFcdTU3NTdcdTdFQTdcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzYgXHUyMDE0XHUyMDE0IFx1NzJCNlx1NjAwMVx1N0VDRlx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRlx1RkYwOHByZXZpZXctYnVzXHVGRjA5XHU1M0QxXHU1RTAzXHVGRjBDXG4gKiAgXHU0RTBEXHU0RjlEXHU4RDU2XHU0RjFBXHU4QkREIHN0b3JlL2hvb2sgcHJvcHNcdUZGMDhcdTY4NENcdTk3NjJcdTZFMzJcdTY3RDNcdTVDNDJcdTVCRjkgaW5wdXQucmlnaHQvb3ZlcmxheSBcdTY5RkRcdTRGNERcdTRFMERcdTYzRDBcdTRGOUJcdThGRDlcdTRFOUJcdTY4MDdcdTUxQzYgcHJvcHNcdUZGMENcbiAqICBcdTdFQzRcdTRFRjZcdTRGOURcdThENTZcdTVCODNcdTRFRUNcdTRGMUFcdTVEMjlcdTVFNzZcdTg4QUJcdTk1MTlcdThCRUZcdThGQjlcdTc1NENcdTU0MUVcdTYzODlcdTIwMTRcdTIwMTRQTy1SSUdIVC1PSyBcdTYzQTJcdTk0ODhcdTUzRUZcdTg5QzFcdTgwMEMgXHUyNzI4L1x1OTg4NFx1ODlDOFx1NTM2MVx1NEUwRFx1NTNFRlx1ODlDMVx1NzY4NFx1NUI5RVx1NkQ0Qlx1NUI5QVx1OEJCQVx1RkYwOVx1MzAwMiAqL1xuXG5pbXBvcnQge1xuICBjaGVja0NvbmZpZyxcbiAgb3B0aW1pemVTdHJlYW0sXG4gIHJlc29sdmVTZXNzaW9uTW9kZWwsXG4gIFJFUVVFU1RfVElNRU9VVF9NUyxcbiAgdG9FcnJvcktpbmQsXG4gIHR5cGUgTGFuZyxcbiAgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCxcbiAgdHlwZSBQcm9tcHRDb25maWcsXG59IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGRpc3BhdGNoUHJldmlldyB9IGZyb20gJy4vcHJldmlldy1idXMuanMnO1xuXG4vKipcbiAqIFx1NUY1M1x1NTI0RCBpbi1mbGlnaHQgXHU4QkY3XHU2QzQyXHU3Njg0XHU2M0E3XHU1MjM2XHU1NjY4XHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjA5XHVGRjFBXG4gKiAtIFx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1NjVGNlx1NEUyRFx1NkI2Mlx1NUI4M1x1RkYwQ1x1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzaG93KCkvZmFpbCgpIFx1NTkwRFx1NkQzQlx1NURGMlx1NTE3M1x1OTVFRFx1NTM2MVx1NzI0N1x1RkYxQlxuICogLSBydW5PcHRpbWl6ZSBcdTRFRTVcdTMwMENcdTVCNThcdTU3MjhcdTU3MjhcdTkwMTRcdTYzQTdcdTUyMzZcdTU2NjhcdTMwMERcdTRFM0FcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDhcdTU0MENcdTRFMDBcdTY1RjZcdTUyM0JcdTUzRUFcdTUxNDFcdThCQjhcdTRFMDBcdTRFMkFcdThCRjdcdTZDNDJcdTU3MjhcdTkwMTRcdUZGMDlcdTMwMDJcbiAqIFx1NkNFOFx1RkYxQVx1NkEyMVx1NTc1N1x1N0VBN1x1NjEwRlx1NTQ3M1x1Nzc0MFx1NTkxQVx1NEYxQVx1OEJERFx1NTQwQ1x1NjVGNlx1NEYxOFx1NTMxNlx1NEYxQVx1NEU5Mlx1NzZGOFx1OEJBOVx1OERFRlx1MjAxNFx1MjAxNFx1OEY5M1x1NTE2NVx1NjgwRlx1NTM1NVx1NEYxQVx1OEJERFx1ODA1QVx1NzEyNlx1NzY4NFx1NEVBNFx1NEU5Mlx1NEUwQlx1NTNFRlx1NjNBNVx1NTNEN1x1NkI2NFx1N0I4MFx1NTMxNlx1MzAwMlxuICovXG5sZXQgYWN0aXZlQ29udHJvbGxlcjogQWJvcnRDb250cm9sbGVyIHwgbnVsbCA9IG51bGw7XG5cbi8qKiBcdTUxNzNcdTk1RURcdTk4ODRcdTg5QzhcdTUzNjFcdUZGMDhcdTVFNzZcdTRFMkRcdTZCNjJcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZVByZXZpZXcoKTogdm9pZCB7XG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSB7XG4gICAgYWN0aXZlQ29udHJvbGxlci5hYm9ydCgpO1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICB9XG4gIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdjbG9zZScgfSk7XG59XG5cbi8qKiBcdTRGMThcdTUzMTZcdTdGMTZcdTYzOTJcdUZGMUFcdTkxNERcdTdGNkVcdTdGM0FcdTU5MzEgXHUyMTkyIGd1aWRlXHVGRjFCXHU4MzQ5XHU3QTNGXHU3QTdBIFx1MjE5MiBcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcdUZGMUJcdTVFNzZcdTUzRDEgXHUyMTkyIFx1NEUyMlx1NUYwM1x1RkYxQlx1OEQ4NVx1NjVGNi9cdTUzRDZcdTZEODggXHUyMTkyIHRpbWVvdXQgXHU2MjE2XHU5NzU5XHU5RUQ4ICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuT3B0aW1pemUoY3R4OiB7XG4gIGdldENvbmZpZygpOiBQcm9tcHRDb25maWc7XG4gIGdldExhbmcoKTogTGFuZztcbiAgZ2V0RHJhZnQoKTogc3RyaW5nO1xuICAvKiogXHU4OUUzXHU2NzkwXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjA4dXNlU2Vzc2lvbk1vZGVsIFx1NUYwMFx1NTQyRlx1NjVGNlx1NEYxOFx1NTE0OFx1RkYwOVx1RkYwQ1x1NEUwRFx1NTNFRlx1NUY5N1x1NjVGNlx1OEZENFx1NTZERSBudWxsXHVGRjA4XHU1NkRFXHU5MDAwXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXHVGRjA5ICovXG4gIGdldFNlc3Npb25Nb2RlbD8oKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPjtcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZ3VpZGUnIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkcmFmdCA9IGN0eC5nZXREcmFmdCgpLnRyaW0oKTtcbiAgaWYgKCFkcmFmdCkgcmV0dXJuO1xuICAvLyBcdTZBMjFcdTU3OEJcdTg5RTNcdTY3OTBcdUZGMUF1c2VTZXNzaW9uTW9kZWxcdUZGMDhcdTlFRDhcdThCQTRcdUZGMDlcdTIxOTIgXHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU2QTIxXHU1NzhCXHVGRjFCXHU1NDI2XHU1MjE5L1x1NEUwRFx1NTNFRlx1NUY5NyBcdTIxOTIgXHU4MUVBXHU1QjlBXHU0RTQ5IG1vZGVsXG4gIGxldCBtb2RlbCA9IGNvbmZpZy5tb2RlbDtcbiAgaWYgKGNvbmZpZy51c2VTZXNzaW9uTW9kZWwpIHtcbiAgICBjb25zdCBzZXNzaW9uTW9kZWwgPSBhd2FpdCBjdHguZ2V0U2Vzc2lvbk1vZGVsPy4oKTtcbiAgICBpZiAoc2Vzc2lvbk1vZGVsKSBtb2RlbCA9IHNlc3Npb25Nb2RlbDtcbiAgfVxuICBjb25zdCBlZmZlY3RpdmUgPSB7IC4uLmNvbmZpZywgbW9kZWwgfTtcblxuICAvLyBcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMUFcdTVERjJcdTY3MDlcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcdTUyMTlcdTRFMjJcdTVGMDNcdTY3MkNcdTZCMjFcdTg5RTZcdTUzRDFcdUZGMDhcdTYzMDlcdTk0QUUgYnVzeSBcdTYwMDFcdTVERjJcdTc5ODFcdTc1MjhcdTcwQjlcdTUxRkJcdUZGMENcdThGRDlcdTkxQ0NcdTY2MkZcdTdBREVcdTYwMDFcdTc2ODRcdTY3MDBcdTU0MEVcdTk2MzJcdTdFQkZcdUZGMDlcbiAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgIT09IG51bGwpIHJldHVybjtcbiAgZGlzcGF0Y2hQcmV2aWV3KHsgdHlwZTogJ2JlZ2luJyB9KTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlUHJldmlldygpXHVGRjBDXHU0RjlCXHU1MzYxXHU3MjQ3XHU1MTczXHU5NUVEXHU2NUY2XHU1M0Q2XHU2RDg4XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXG4gIGxldCB0aW1lZE91dCA9IGZhbHNlO1xuICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRpbWVkT3V0ID0gdHJ1ZTtcbiAgICBjb250cm9sbGVyLmFib3J0KCk7XG4gIH0sIFJFUVVFU1RfVElNRU9VVF9NUyk7XG5cbiAgLy8gXHU1QzU1XHU3OTNBXHU3RDJGXHU3OUVGXHVGRjFBXHU2QjYzXHU2NTg3XHU0RjE4XHU1MTQ4XHVGRjFCXHU2QjYzXHU2NTg3XHU1QzFBXHU2NzJBXHU1MUZBXHU3M0IwXHVGRjA4djQgXHU3Q0ZCXHU1MTQ4XHU4RjkzXHU1MUZBXHU5NTdGXHU2QkI1XHU2M0E4XHU3NDA2XHVGRjA5XHU2NUY2XHU1QzU1XHU3OTNBXHU2M0E4XHU3NDA2XHU4RkM3XHU3QTBCXHVGRjBDXHU4QkE5XHU2RDQxXHU1RjBGXHU3QUNCXHU1MzczXHU1M0VGXHU4OUMxXG4gIGxldCByZWFzb25pbmcgPSAnJztcbiAgbGV0IGNvbnRlbnQgPSAnJztcbiAgbGV0IHNob3duID0gJyc7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3B0aW1pemVTdHJlYW0oe1xuICAgICAgY29uZmlnOiBlZmZlY3RpdmUsXG4gICAgICB0ZXh0OiBkcmFmdCxcbiAgICAgIGxhbmc6IGN0eC5nZXRMYW5nKCksXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgb25FdmVudDogKGRlbHRhKSA9PiB7XG4gICAgICAgIGlmIChkZWx0YS5raW5kID09PSAnY29udGVudCcpIHtcbiAgICAgICAgICBjb250ZW50ICs9IGRlbHRhLnRleHQ7XG4gICAgICAgICAgc2hvd24gPSBjb250ZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlYXNvbmluZyArPSBkZWx0YS50ZXh0O1xuICAgICAgICAgIHNob3duID0gcmVhc29uaW5nO1xuICAgICAgICB9XG4gICAgICAgIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdkcmFmdCcsIHRleHQ6IHNob3duIH0pO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdCB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1NTE0OFx1NTIyNFx1NUI5QVx1NEUyRFx1NkI2Mlx1RkYxQVx1NzUyOFx1NjIzNy9cdTdFQzRcdTRFRjZcdTUzRDZcdTZEODhcdTRFMEVcdThEODVcdTY1RjZcdTkwRkRcdTg4NjhcdTczQjBcdTRFM0EgQWJvcnRFcnJvclx1RkYxQlx1NEVDNVx1OEQ4NVx1NjVGNlx1NTE5OVx1NTE2NVx1OTUxOVx1OEJFRlx1NjAwMVxuICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICBpZiAodGltZWRPdXQpIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogJ3RpbWVvdXQnIGFzIE9wdGltaXplRXJyb3JLaW5kIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG4gIGdldFNlc3Npb25Nb2RlbD86ICgpID0+IFByb21pc2U8c3RyaW5nIHwgbnVsbD47XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUEtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5IFx1NTcyOFx1NkRGMVx1NTkxQ1x1NkEyMVx1NUYwRlx1ODlFM1x1Njc5MFx1NEUzQVx1NkQ0NVx1ODI3MiBcdTIxOTIgXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU0RTBEXHU1M0VGXHU4QkZCXHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5ICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiAjMTY3N2ZmO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzLCBnZXRTZXNzaW9uTW9kZWwgfSA9IHByb3BzO1xuXG4gIC8vIFx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVxuICBjb25zdCBbc3RhdGUsIHNldFN0YXRlXSA9IHVzZVN0YXRlKCgpID0+IGdldFByZXZpZXdCdXNTdGF0ZSgpKTtcbiAgdXNlRWZmZWN0KFxuICAgICgpID0+IHN1YnNjcmliZVByZXZpZXdCdXMoKCkgPT4gc2V0U3RhdGUoZ2V0UHJldmlld0J1c1N0YXRlKCkpKSxcbiAgICBbXSxcbiAgKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICAvLyBcdTUzNzhcdThGN0RcdTY1RjZcdTZFMDVcdTc0MDZcdUZGMUFcdTZFMDVcdTk2NjRcdTYzMDJcdThENzdcdTc2ODQgY29waWVkIFx1NTkwRFx1NEY0RFx1NUI5QVx1NjVGNlx1NTY2OFx1RkYwQ1x1NUU3Nlx1NjgwN1x1OEJCMFx1NjcyQVx1NjMwMlx1OEY3RFx1RkYwQ1xuICAvLyBcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2V0Q29waWVkKHRydWUpXHVGRjA4Y29weSBcdTc2ODQgYXdhaXQgXHU2NzFGXHU5NUY0XHU1Mzc4XHU4RjdEXHVGRjA5XHU1NzI4XHU1Mzc4XHU4RjdEXHU1NDBFXHU4OUU2XHU1M0QxXHUzMDAyXG4gIGNvbnN0IG1vdW50ZWRSZWYgPSB1c2VSZWYodHJ1ZSk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbW91bnRlZFJlZi5jdXJyZW50ID0gdHJ1ZTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgbW91bnRlZFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH0sIFtdKTtcblxuICBjb25zdCB7IHN0YXR1cywgcmVzdWx0LCBlcnJvcktpbmQgfSA9IHN0YXRlO1xuICBjb25zdCBbY29waWVkLCBzZXRDb3BpZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBjb3B5VGltZXJSZWYgPSB1c2VSZWY8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG5cbiAgaWYgKHN0YXR1cyA9PT0gJ2lkbGUnKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZXRyeSA9ICgpID0+IHtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHsgZ2V0Q29uZmlnLCBnZXRMYW5nLCBnZXREcmFmdDogKCkgPT4gcmVhZENvbXBvc2VyVGV4dCgpLCBnZXRTZXNzaW9uTW9kZWwgfSk7XG4gIH07XG5cbiAgY29uc3QgcmVwbGFjZSA9ICgpID0+IHtcbiAgICB3cml0ZUNvbXBvc2VyVGV4dChyZXN1bHQpO1xuICAgIGNsb3NlUHJldmlldygpO1xuICB9O1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFuYXZpZ2F0b3IuY2xpcGJvYXJkKSByZXR1cm47IC8vIFx1OTc1RVx1NUI4OVx1NTE2OFx1NEUwQVx1NEUwQlx1NjU4N1x1RkYwOGh0dHAgXHU3QjQ5XHVGRjA5XHVGRjFBXHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwQ1x1NEZERFx1NjMwMVx1NTNFRlx1OTFDRFx1OEJENVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChyZXN1bHQpO1xuICAgICAgaWYgKCFtb3VudGVkUmVmLmN1cnJlbnQpIHJldHVybjsgLy8gYXdhaXQgXHU2NzFGXHU5NUY0XHU3RUM0XHU0RUY2XHU1REYyXHU1Mzc4XHU4RjdEXHVGRjFBXHU0RTBEXHU1MThEIHNldFN0YXRlXG4gICAgICBzZXRDb3BpZWQodHJ1ZSk7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0Q29waWVkKGZhbHNlKTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMTIwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyNkFcdThEMzRcdTY3N0ZcdTUxOTlcdTUxNjVcdTU5MzFcdThEMjVcdUZGMUFcdTk3NTlcdTlFRDhcdUZGMDhcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjA5XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZFwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtaGVhZFwiPlxuICAgICAgICA8c3Bhbj57dCgnY2FyZC50aXRsZScpfTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgIFx1MjcxNVxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7c3RhdHVzID09PSAnZ3VpZGUnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUudGl0bGUnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnZ3VpZGUuZGVzYycpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9eygpID0+IHsgY2xvc2VQcmV2aWV3KCk7IG9wZW5TZXR0aW5ncygpOyB9fT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmFjdGlvbicpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnb3B0aW1pemluZycgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj5cbiAgICAgICAgICB7c3RhdGUuZHJhZnQgPyA8c3BhbiBzdHlsZT17eyB3aGl0ZVNwYWNlOiAncHJlLXdyYXAnIH19PntzdGF0ZS5kcmFmdH08L3NwYW4+IDogdCgnY2FyZC5vcHRpbWl6aW5nJyl9XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ3ByZXZpZXcnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57cmVzdWx0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JlcGxhY2V9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXBsYWNlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weSgpfT5cbiAgICAgICAgICAgICAge2NvcGllZCA/IHQoJ2NhcmQuY29weURvbmUnKSA6IHQoJ2NhcmQuY29weScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cblxuICAgICAge3N0YXR1cyA9PT0gJ2Vycm9yJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1lcnJcIj57dChlcnJvcktleShlcnJvcktpbmQpKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQuZGlzbWlzcycpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn0iLCAiLyoqIFx1OEJCRVx1N0Y2RSBcdTIxOTIgR2VuZXJhbCBcdTUzM0FcdTMwMENQcm9tcHQgXHU0RjE4XHU1MzE2XHUzMDBEXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjFBXHU2ODA3XHU5ODk4XHU2NDU4XHU4OTgxICsgXHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1ICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHR5cGUgeyBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtU3RhdGUsIFNldHRpbmdzRm9ybVZhbHVlcyB9IGZyb20gJy4vc2V0dGluZ3MtZm9ybS1zdGF0ZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybUFjdGlvbnMgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB7IG9uT3BlblNldHRpbmdzUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1Jvd1Byb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBTZXR0aW5nc0Zvcm1TdGF0ZSkgPT4gVCkgPT4gVDtcbiAgYWN0aW9uczogU2V0dGluZ3NGb3JtQWN0aW9ucztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIHNhdmVDb25maWc6ICh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgcmVzZXRDb25maWc6ICgpID0+IFByb21pc2U8dm9pZD47XG4gIGdldEVwb2NoOiAoKSA9PiBudW1iZXI7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9zZXR0aW5ncy5jc3MnO1xuZnVuY3Rpb24gaW5qZWN0Q3NzKCkge1xuICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJyB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVtkYXRhLXBsdWdpbi1jc3M9XCIke0NTU19JRH1cIl1gKSkgcmV0dXJuO1xuICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIHN0eWxlLmRhdGFzZXQucGx1Z2luQ3NzID0gQ1NTX0lEO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbi5vcHRpU2V0dGluZ3Mge1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIHBhZGRpbmc6IDE2cHggMDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG59XG4ub3B0aVNldHRpbmdzVGl0bGUge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBmb250LXNpemU6IDE0cHg7XG4gIGxpbmUtaGVpZ2h0OiAyMnB4O1xufVxuLm9wdGlTZXR0aW5nc0hpbnQge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXRlcnRpYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0Zvcm0ge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0ZpZWxkIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzTGFiZWwge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXNlY29uZGFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NJbnB1dCB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1iZy1sYXllci0yKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgcGFkZGluZzogNnB4IDhweDtcbiAgZm9udC1zaXplOiAxM3B4O1xufVxuLm9wdGlTZXR0aW5nc1JvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogOHB4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuLm9wdGlTZXR0aW5nc0J0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTJweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG59XG4ub3B0aVNldHRpbmdzQnRuLnByaW1hcnkge1xuICAvKiBcdTUxOTlcdTZCN0JcdTRFM0JcdTgyNzJcdUZGMUFcdTRFM0JcdTk4OThcdTUzRDhcdTkxQ0ZcdTU3MjhcdTZERjFcdTU5MUNcdTZBMjFcdTVGMEZcdTRGMUFcdTg5RTNcdTY3OTBcdTRFM0FcdTZENDUvXHU2REYxXHU2NzgxXHU3QUVGXHU4MjcyXHVGRjA4XHU5RUQxXHU1RTk1XHU5RUQxXHU1QjU3XHUzMDAxXHU3NjdEXHU1RTk1XHU3NjdEXHU1QjU3XHU1NzQ3XHU4OEFCXHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5XHVGRjBDXG4gICAgIFx1NTZGQVx1NUI5QVx1NTRDMVx1NzI0Q1x1ODRERCArIFx1NzY3RFx1NUI1N1x1NEZERFx1OEJDMVx1NEVGQlx1NEY1NVx1NEUzQlx1OTg5OFx1NTNFRlx1OEJGQiAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogIzE2NzdmZjtcbn1cbi5vcHRpU2V0dGluZ3NFcnIge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLXN0YXRlLWVycm9yLXByaW1hcnksICNkMDMwNTApO1xuICBmb250LXNpemU6IDEycHg7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFNldHRpbmdzUm93KHByb3BzOiBTZXR0aW5nc1Jvd1Byb3BzKSB7XG4gIGNvbnN0IHsgdCwgdXNlU3RvcmUsIGFjdGlvbnMsIGdldENvbmZpZywgc2F2ZUNvbmZpZywgcmVzZXRDb25maWcsIGdldEVwb2NoIH0gPSBwcm9wcztcbiAgY29uc3QgW2V4cGFuZGVkLCBzZXRFeHBhbmRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtzdWJtaXRSZXZpc2lvbiwgc2V0U3VibWl0UmV2aXNpb25dID0gdXNlU3RhdGUoMCk7XG5cbiAgY29uc3QgdmFsdWVzID0gdXNlU3RvcmUoKHMpID0+IHMudmFsdWVzKTtcbiAgY29uc3Qgc2F2ZWQgPSB1c2VTdG9yZSgocykgPT4gcy5zYXZlZCk7XG4gIGNvbnN0IGVycm9yID0gdXNlU3RvcmUoKHMpID0+IHMuZXJyb3IpO1xuICAvLyBcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFIFJQQyBcdTU5MzFcdThEMjVcdTY1RjZcdTY2M0VcdTc5M0FcdTc2ODRcdTUzOUZcdTU5Q0JcdTk1MTlcdThCRUZcdUZGMDhcdTRFMERcdTUxOERcdTk3NTlcdTlFRDhcdTU5MzFcdThEMjVcdUZGMUFzZXR0aW5ncyBcdTUxOTlcdTUxNjVcdTUxRkFcdTk1MTlcdTVGQzVcdTk4N0JcdThCQTlcdTc1MjhcdTYyMzdcdTc3MEJcdTVGOTdcdTUyMzBcdUZGMDlcbiAgY29uc3QgW3JwY0Vycm9yLCBzZXRScGNFcnJvcl0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGNvbmZpZy5tb2RlbCA/IGNvbmZpZy5tb2RlbCA6ICdcdTIwMTQnO1xuXG4gIC8vIFx1OTk5Nlx1NkIyMVx1NjMwMlx1OEY3RCAvIFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1NjVGNlx1NjI4QVx1NUY1M1x1NTI0RFx1OTE0RFx1N0Y2RVx1NjRBRFx1NzlDRFx1OEZEQlx1ODg2OFx1NTM1NVx1MzAwMlxuICAvLyBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGNyA9IFx1NjcyQ1x1NTczMFx1NjNEMFx1NEVBNFx1NUU4Rlx1NTNGNyBzdWJtaXRSZXZpc2lvbiArIGNvbmZpZ0Vwb2NoXHVGRjA4XHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU3RUFBXHU1MTQzXHVGRjA5XHVGRjFBXG4gIC8vICAtIFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1RkYwOFx1OERFOFx1NjgwN1x1N0I3RVx1OTg3NS9cdTU5MTZcdTkwRThcdTUxOTlcdTUxNjUgXHUyMTkyIGluZGV4LnRzIHJlZnJlc2hDb25maWcgXHU3Njg0XHU3RUFBXHU1MTQzXHU5MDEyXHU1ODlFXHVGRjA5XHU0RUU0XHU0RkVFXHU4QkEyXHU1M0Y3XHU4RDg1XHU4RkM3XG4gIC8vICAgIHN0YXRlLnJldmlzaW9uXHVGRjBDXHU5MUNEXHU2NEFEXHU3OUNEXHU3NTFGXHU2NTQ4XHVGRjBDXHU4ODY4XHU1MzU1XHU4RERGXHU0RTBBXHU1RjUyXHU0RTAwXHU1MzE2XHU1NDBFXHU3Njg0XHU5NTVDXHU1MENGXHVGRjFCXG4gIC8vICAtIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkVcdTVERjJcdTkwMUFcdThGQzcgY29tbWl0L3NlZWQgXHU1MTk5XHU1MTY1XHUzMDBDXHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU1RjUzXHU2NUY2XHU3RUFBXHU1MTQzXHUzMDBEXHU3Njg0XHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjBDXHU3RDI3XHU2M0E1XHU3Njg0XHU2NzJDXHU2QjIxXHU2NTQ4XHU1RTk0XG4gIC8vICAgIFx1NTZERVx1OEREMVx1RkYwOFx1N0VBQVx1NTE0M1x1NjcyQVx1NTNEOFx1RkYwOVx1NEZFRVx1OEJBMlx1NTNGN1x1NzZGOFx1N0I0OVx1ODhBQiByZWR1Y2VyIFx1NjI5MVx1NTIzNiBcdTIxOTIgXHU0RkREXHU0RjRGXHU3NTI4XHU2MjM3XHU1MzlGXHU1OUNCXHU4RjkzXHU1MTY1XHU0RTBFXHUzMDBDXHU1REYyXHU0RkREXHU1QjU4XHUzMDBEXHU2M0QwXHU3OTNBXHVGRjFCXG4gIC8vICAgIFx1NEUwQlx1NkIyMVx1NjcyQ1x1NTczMFx1NTJBOFx1NEY1Q1x1RkYwOGVkaXQvY29tbWl0XHVGRjA5XHU1MThEXHU2MjhBIHN0YXRlLnJldmlzaW9uIFx1NjJBQ1x1NTIzMFx1NEUwRVx1N0VBQVx1NTE0M1x1NEUwMFx1ODFGNFx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFjdGlvbnMuc2VlZChcbiAgICAgIHsgYmFzZVVybDogY29uZmlnLmJhc2VVcmwsIGFwaUtleTogY29uZmlnLmFwaUtleSwgbW9kZWw6IGNvbmZpZy5tb2RlbCB9LFxuICAgICAgc3VibWl0UmV2aXNpb24gKyBnZXRFcG9jaCgpLFxuICAgICk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB9LCBbY29uZmlnLmJhc2VVcmwsIGNvbmZpZy5hcGlLZXksIGNvbmZpZy5tb2RlbCwgZ2V0RXBvY2hdKTtcblxuICAvLyBcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdUZGMDhcdTk4ODRcdTg5QzhcdTUzNjFcdTY3MkFcdTkxNERcdTdGNkVcdTVGMTVcdTVCRkNcdUZGMDlcdTIxOTIgXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1XG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoKCkgPT4gc2V0RXhwYW5kZWQodHJ1ZSkpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlU2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICBjb25zdCBlcnJvcnMgPSBhY3Rpb25zLnZhbGlkYXRlKHZhbHVlcyk7XG4gICAgaWYgKGVycm9ycykge1xuICAgICAgYWN0aW9ucy5mYWlsKE9iamVjdC52YWx1ZXMoZXJyb3JzKVswXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzYXZlQ29uZmlnKHZhbHVlcyk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgICAgLy8gXHU0RTBFXHU2NTQ4XHU1RTk0XHU1NkRFXHU4REQxXHU3Njg0IHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjA4XHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU3RUFBXHU1MTQzXHVGRjA5XHU1QkY5XHU5RjUwXHVGRjBDXHU0RjdGXHU0RkREXHU1QjU4XHU1NDBFXHU3Njg0XHU5MUNEXHU2NEFEXHU3OUNEXHU4OEFCXHU2MjkxXHU1MjM2XG4gICAgICBhY3Rpb25zLmNvbW1pdChzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3Muc2F2ZUZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBoYW5kbGVSZXNldCA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRScGNFcnJvcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcmVzZXRDb25maWcoKTtcbiAgICAgIGFjdGlvbnMuc2VlZChcbiAgICAgICAgeyBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLCBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSwgbW9kZWw6IERFRkFVTFRTLm1vZGVsIH0sXG4gICAgICAgIHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCksXG4gICAgICApO1xuICAgICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgICB9IGNhdGNoIChvdXRlcikge1xuICAgICAgc2V0UnBjRXJyb3IoYCR7dCgnc2V0dGluZ3MucmVzZXRGYWlsZWQnKX1cdUZGMUEke291dGVyIGluc3RhbmNlb2YgRXJyb3IgPyBvdXRlci5tZXNzYWdlIDogU3RyaW5nKG91dGVyKX1gKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NUaXRsZVwiIG9uQ2xpY2s9eygpID0+IHNldEV4cGFuZGVkKCh2KSA9PiAhdil9IHN0eWxlPXt7IGN1cnNvcjogJ3BvaW50ZXInIH19PlxuICAgICAgICB7dCgnc2V0dGluZ3MudGl0bGUnKX1cbiAgICAgICAgeyFleHBhbmRlZCAmJlxuICAgICAgICAgIChjb25maWcudXNlU2Vzc2lvbk1vZGVsID8gKFxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPiBcdTAwQjcge3QoJ3NldHRpbmdzLnNlc3Npb25Nb2RlbEVuYWJsZWQnKX08L3NwYW4+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KGNvbmZpZy5hcGlLZXkgPyAnY2FyZC5jb25maWd1cmVkLmhpbnQnIDogJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnKS5yZXBsYWNlKCd7bW9kZWx9JywgbW9kZWxMYWJlbCl9PC9zcGFuPlxuICAgICAgICAgICkpfVxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtleHBhbmRlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRm9ybVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiPlxuICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3ZhbHVlcy51c2VTZXNzaW9uTW9kZWx9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ3VzZVNlc3Npb25Nb2RlbCcsIGUudGFyZ2V0LmNoZWNrZWQpfVxuICAgICAgICAgICAgICAvPnsnICd9XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy51c2VTZXNzaW9uTW9kZWwnKX1cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+e3QoJ3NldHRpbmdzLnVzZVNlc3Npb25Nb2RlbEhpbnQnKX08L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYmFzZS11cmxcIj57dCgnc2V0dGluZ3MuYmFzZVVybCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLWJhc2UtdXJsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmJhc2VVcmx9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtERUZBVUxUUy5iYXNlVXJsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYmFzZVVybCcsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktYXBpLWtleVwiPnt0KCdzZXR0aW5ncy5hcGlLZXknKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1hcGkta2V5XCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB0eXBlPVwicGFzc3dvcmRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLmFwaUtleX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJzay1cdTIwMjZcIlxuICAgICAgICAgICAgICBhdXRvQ29tcGxldGU9XCJvZmZcIlxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnYXBpS2V5JywgZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0ZpZWxkXCI+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzTGFiZWxcIiBodG1sRm9yPVwib3B0aS1tb2RlbFwiPnt0KCdzZXR0aW5ncy5tb2RlbCcpfTwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgaWQ9XCJvcHRpLW1vZGVsXCJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSW5wdXRcIlxuICAgICAgICAgICAgICB2YWx1ZT17dmFsdWVzLm1vZGVsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17dmFsdWVzLnVzZVNlc3Npb25Nb2RlbCA/ICdcdTIwMTQnIDogREVGQVVMVFMubW9kZWx9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXt2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xuICAvKiogdHJ1ZVx1RkYxQVx1NEYxOFx1NTMxNlx1NEY3Rlx1NzUyOFx1NUY1M1x1NTI0RFx1NEYxQVx1OEJERFx1NkEyMVx1NTc4Qlx1RkYxQmZhbHNlXHVGRjFBXHU0RjdGXHU3NTI4IG1vZGVsICovXG4gIHVzZVNlc3Npb25Nb2RlbDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2V0dGluZ3NGb3JtKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGVycm9yczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVybCA9IHZhbHVlcy5iYXNlVXJsLnRyaW0oKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdSA9IG5ldyBVUkwodXJsKTtcbiAgICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgICBpZiAodS5zZWFyY2ggfHwgdS5oYXNoKSB0aHJvdyBuZXcgRXJyb3IoJ3F1ZXJ5LW9yLWhhc2gnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICAgIH1cbiAgfVxuXG4gIGlmICghdmFsdWVzLmFwaUtleS50cmltKCkpIGVycm9ycy5hcGlLZXkgPSAnc2V0dGluZ3MuYXBpS2V5JztcbiAgaWYgKCF2YWx1ZXMudXNlU2Vzc2lvbk1vZGVsICYmICF2YWx1ZXMubW9kZWwudHJpbSgpKSBlcnJvcnMubW9kZWwgPSAnc2V0dGluZ3MubW9kZWwnO1xuXG4gIHJldHVybiBlcnJvcnM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RhdGUge1xuICB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcztcbiAgZGlydHk6IGJvb2xlYW47XG4gIHNhdmVkOiBib29sZWFuO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgcmV2aXNpb246IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IElOSVRJQUxfU0VUVElOR1NfRk9STTogU2V0dGluZ3NGb3JtU3RhdGUgPSB7XG4gIHZhbHVlczogeyBiYXNlVXJsOiAnJywgYXBpS2V5OiAnJywgbW9kZWw6ICcnLCB1c2VTZXNzaW9uTW9kZWw6IHRydWUgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIH1cbiAgfCB7IHR5cGU6ICdjb21taXQnOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdmYWlsJzsgbWVzc2FnZTogc3RyaW5nIH07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VTZXR0aW5nc0Zvcm0oc3RhdGU6IFNldHRpbmdzRm9ybVN0YXRlLCBhY3Rpb246IFNldHRpbmdzRm9ybUFjdGlvbik6IFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ3NlZWQnOlxuICAgICAgcmV0dXJuIGFjdGlvbi5yZXZpc2lvbiA8PSBzdGF0ZS5yZXZpc2lvblxuICAgICAgICA/IHN0YXRlXG4gICAgICAgIDogeyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLmFjdGlvbi52YWx1ZXMgfSwgZGlydHk6IGZhbHNlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZWRpdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgdmFsdWVzOiB7IC4uLnN0YXRlLnZhbHVlcywgW2FjdGlvbi5maWVsZF06IGFjdGlvbi52YWx1ZSB9LCBkaXJ0eTogdHJ1ZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCB9O1xuICAgIGNhc2UgJ2NvbW1pdCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBlcnJvcjogYWN0aW9uLm1lc3NhZ2UgfTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1VPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxpQkFBaUI7QUFDbkI7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFPLEtBQUssV0FBVyxXQUFXLElBQUksU0FBUyxTQUFTO0FBQ3ZFLFFBQU0sUUFBUSxPQUFPLEtBQUssVUFBVSxZQUFZLElBQUks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Q0FBQztBQUNELHFCQUFlLFlBQVksS0FBMEM7QUFBQSxJQUN2RSxTQUFTLE9BQU87QUFDZCxZQUFNLElBQUksTUFBTSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLLENBQUM7QUFBQSxJQUN4RTtBQUFBLEVBQ0Y7QUFFQSxNQUFJLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVO0FBQy9CLFVBQU0sTUFBTTtBQUFBLE1BQU87QUFBQSxNQUF5QixNQUMxQyxNQUFNLE1BQU07QUFBQSxRQUNWO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixJQUFJO0FBQUEsVUFDSixPQUFPO0FBQUEsVUFDUCxRQUFRO0FBQUEsVUFDUixPQUFPO0FBQUEsVUFDUCxRQUFRLE9BQU87QUFBQSxZQUNiLFdBQVcsTUFBTTtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
