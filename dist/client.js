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
  model: "deepseek-chat"
};
function normalizeBaseUrl(url) {
  return url.trim().replace(/\/+$/, "");
}
function mergeConfig(raw) {
  const baseUrl = typeof raw?.baseUrl === "string" && raw.baseUrl.trim() ? raw.baseUrl.trim() : DEFAULTS.baseUrl;
  const apiKey = typeof raw?.apiKey === "string" ? raw.apiKey : DEFAULTS.apiKey;
  const model = typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : DEFAULTS.model;
  return { baseUrl: normalizeBaseUrl(baseUrl), apiKey, model };
}
function checkConfig(config) {
  if (!config.apiKey.trim()) return { ok: false, reason: "missing-key" };
  if (!config.model.trim()) return { ok: false, reason: "missing-model" };
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
function buildRequestBody(config, text, lang) {
  return {
    model: config.model,
    messages: [
      { role: "system", content: buildSystemPrompt(lang) },
      { role: "user", content: text }
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: false
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
function extractChoiceContent(payload) {
  if (typeof payload !== "object" || payload === null) return null;
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  const content = first?.message?.content;
  return typeof content === "string" ? content : null;
}
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
async function optimize(opts) {
  const { config, text, lang, signal } = opts;
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
      body: JSON.stringify(buildRequestBody(config, text, lang)),
      signal
    });
  } catch (e) {
    throw toErrorKind(e);
  }
  if (res.status === 401) throw new OptimizeError("unauthorized", `HTTP 401`);
  if (res.status === 403) throw new OptimizeError("forbidden", `HTTP 403`);
  if (!res.ok) throw new OptimizeError("http", `HTTP ${res.status}`);
  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new OptimizeError("bad-response", "invalid JSON");
  }
  const content = extractChoiceContent(payload);
  if (!content || !content.trim()) throw new OptimizeError("empty", "empty completion");
  return extractResult(content);
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
  "settings.save": "\u4FDD\u5B58",
  "settings.reset": "\u6062\u590D\u9ED8\u8BA4",
  "settings.saved": "\u5DF2\u4FDD\u5B58",
  "settings.saveFailed": "\u4FDD\u5B58\u5931\u8D25",
  "settings.resetFailed": "\u91CD\u7F6E\u5931\u8D25",
  "settings.clickToEdit": "\u70B9\u51FB\u914D\u7F6E"
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
  "settings.save": "Save",
  "settings.reset": "Reset to defaults",
  "settings.saved": "Saved",
  "settings.saveFailed": "Save failed",
  "settings.resetFailed": "Reset failed",
  "settings.clickToEdit": "Click to configure"
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
  generation: 0
};
function reducePreview(state2, action) {
  switch (action.type) {
    case "begin":
      if (state2.status === "optimizing") return state2;
      return { ...state2, status: "optimizing", errorKind: null, generation: state2.generation + 1 };
    case "show":
      return state2.status === "optimizing" ? { ...state2, status: "preview", result: action.result } : state2;
    case "fail":
      return state2.status === "optimizing" ? { ...state2, status: "error", errorKind: action.kind } : state2;
    case "guide":
      return state2.status === "optimizing" ? state2 : { ...state2, status: "guide" };
    case "close":
      return INITIAL_PREVIEW;
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
    const result = await optimize({ config, text: draft, lang: ctx.getLang(), signal: controller.signal });
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
  const { t, getConfig, getLang } = props;
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
      getDraft: () => draft
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
  color: #fff;
  background: var(--dsw-alias-brand-primary, #1677ff);
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
  const { t, getConfig, getLang, openSettings } = props;
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
    void runOptimize({ getConfig, getLang, getDraft: () => readComposerText() });
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
    status === "optimizing" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("card.optimizing") }),
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
  /* \u4E0D\u7528 --dsw-alias-brand-primary-invert\uFF1A\u5176\u5728\u6697\u8272\u4E3B\u9898\u4E0B\u4F1A\u89E3\u6790\u4E3A\u6DF1\u8272 \u2192 \u9ED1\u5E95\u9ED1\u5B57\uFF08\u7528\u6237\u5B9E\u6D4B\uFF09\uFF1B
     \u767D\u5B57 + \u4E3B\u9898\u4E3B\u8272\uFF08\u5E26\u7A33\u5B9A fallback\uFF09\u4FDD\u8BC1\u4EFB\u4F55\u4E3B\u9898\u4E0B\u53EF\u8BFB */
  color: #fff;
  background: var(--dsw-alias-brand-primary, #1677ff);
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
        t(config.apiKey ? "card.configured.hint" : "card.unconfigured.hint").replace("{model}", modelLabel)
      ] })
    ] }),
    !expanded && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "optiSettingsHint", children: t("settings.clickToEdit") }),
    expanded && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "optiSettingsForm", children: [
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
            placeholder: DEFAULTS.model,
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
  if (!values.model.trim()) errors.model = "settings.model";
  return errors;
}
var INITIAL_SETTINGS_FORM = {
  values: { baseUrl: "", apiKey: "", model: "" },
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
            getLang: () => lang
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
            openSettings: () => emitOpenSettingsRequest()
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
      model: merged.model
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
        patch: { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9wcmV2aWV3LXN0YXRlLnRzIiwgIi4uL3NyYy9wcmV2aWV3LWJ1cy50cyIsICIuLi9zcmMvb3B0aW1pemVyLXN0b3JlLnRzIiwgIi4uL3NyYy9QcmV2aWV3Q2FyZC50c3giLCAiLi4vc3JjL1NldHRpbmdzUm93LnRzeCIsICIuLi9zcmMvc2V0dGluZ3Mtc3RvcmUudHMiLCAiLi4vc3JjL3NldHRpbmdzLWZvcm0tc3RhdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKiBkc2gtcHJvbXB0LW9wdGltaXplciBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyMDE0IGFwcGx5KGN0eCkgKi9cblxuaW1wb3J0IHR5cGUgeyBDbGllbnRDb250ZXh0IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUywgbWVyZ2VDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBOUywgemgsIGVuLCBsYW5nT2YgfSBmcm9tICcuL2xvY2FsZXMuanMnO1xuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZW1pdE9wdGltaXplUmVxdWVzdCwgZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5pbXBvcnQgeyBPcHRpbWl6ZUJ1dHRvbiB9IGZyb20gJy4vT3B0aW1pemVCdXR0b24udHN4JztcbmltcG9ydCB7IFByZXZpZXdDYXJkIH0gZnJvbSAnLi9QcmV2aWV3Q2FyZC50c3gnO1xuaW1wb3J0IHsgU2V0dGluZ3NSb3cgfSBmcm9tICcuL1NldHRpbmdzUm93LnRzeCc7XG5pbXBvcnQgeyBjcmVhdGVTZXR0aW5nc0Zvcm1TdG9yZSB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuXG4vKipcbiAqIFx1NThGMFx1NjYwRVx1NjNEMlx1NEVGNlx1NEY5RFx1OEQ1Nlx1NzY4NFx1NUJBMlx1NjIzN1x1N0FFRlx1NjcwRFx1NTJBMVx1RkYwOGNvcmRpcyBzZXJ2aWNlIGtleXNcdUZGMDlcdUZGMUFhcHBseSBcdTUxODVcdTdFQ0YgYGN0eC48c2VydmljZT5gIFx1OEJCRlx1OTVFRVx1NzY4NFx1NjcwRFx1NTJBMVx1NUZDNVx1OTg3Qlx1NTcyOFx1NkI2NFx1NThGMFx1NjYwRVx1MzAwMlxuICogXHU1MDNDXHU5ODdCXHU0RTNBXHU2NzBEXHU1MkExXHU1NDBEXHU4MDBDXHU5NzVFXHU1MzA1IGlkXHUyMDE0XHUyMDE0XHU0RTBFXHU1NDBDXHU1RjYyXHU2MDAxXHU1MTQ4XHU0RjhCXHU0RTAwXHU4MUY0XHVGRjA4ZHNoLW1lc3NhZ2UtcmFpbDogW1wic2xvdHNcIixcInNlc3Npb25zXCJdXHVGRjFCXG4gKiBkc2gtYmV0dGVyLXNpZGViYXIgXHU0RUE2XHU1OEYwXHU2NjBFIGxvY2FsZVx1RkYwOVx1RkYxQlx1OTUxOVx1OEJFRlx1NThGMFx1NjYwRVx1NEYxQVx1OEJBOSBmaWJlciBcdTZDMzhcdTRFNDUgUEVORElOR1x1RkYwQ1x1NTQyRlx1NTJBOFx1NUJBMVx1OEJBMVx1NzZGNFx1NjNBNVx1NTIyNFx1NTkzMVx1OEQyNVx1MzAwMlxuICovXG5leHBvcnQgY29uc3QgaW5qZWN0ID0gWydzbG90cycsICdzZXNzaW9ucycsICdsb2NhbGUnLCAnY29ubmVjdGlvbiddO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHkoY3R4OiBDbGllbnRDb250ZXh0KSB7XG4gIC8vIDEuIFx1NjU4N1x1Njg0OFxuICBjdHguZWZmZWN0KCgpID0+IGN0eC5sb2NhbGUucmVnaXN0ZXIoTlMsIHsgemgsIGVuIH0pLCAncHJvbXB0LW9wdGltaXplcjogbG9jYWxlIHJlZ2lzdHJhdGlvbicpO1xuXG4gIC8vIDIuIFx1OTE0RFx1N0Y2RVx1OTU1Q1x1NTBDRlx1RkYxQVx1ODFFQVx1NjMwMSBSUEMgXHU5MTREXHU3RjZFXHVGRjA4c2VydmVyIGhhbGYgXHU4QkZCXHU1MTk5IH4vLmRzaC9wcm9tcHQtb3B0aW1pemVyLWNvbmZpZy5qc29uXHVGRjBDXHU5MDFBXHU5MDUzXG4gIC8vICcvZHNoLXByb21wdC1vcHRpbWl6ZXInXHUyMDE0XHUyMDE0XHU1NDBDIGRzaC1zdGlja3ktbm90ZSBcdTZBMjFcdTVGMEZcdUZGMDlcdTMwMDJcdTRFMERcdTc1Mjggc2V0dGluZ3NTY29wZVx1RkYxQVx1Njg0Q1x1OTc2Mlx1NUU5NFx1NzUyOFx1NzY4NCBob3N0XG4gIC8vIHNldHRpbmdzIFx1NkNFOFx1NTE4Q1x1ODg2OFx1NUJGOVx1NjcyQVx1NkNFOFx1NTE4QyBuYW1lc3BhY2UgXHU4RkQ0XHU1NkRFIHVuYXZhaWxhYmxlXHVGRjBDc2V0IFx1OTc1OVx1OUVEOFx1NTkzMVx1NjU0OFx1RkYwOFx1NUI5RVx1NkQ0Qlx1RkYwOVx1MzAwMlxuICBsZXQgY29uZmlnTWlycm9yOiBQcm9tcHRDb25maWcgPSBtZXJnZUNvbmZpZyh1bmRlZmluZWQpO1xuICBsZXQgY29uZmlnRXBvY2ggPSAwO1xuICBjb25zdCBycGNDb25maWcgPSBhc3luYyAoZW5kcG9pbnQ6IHN0cmluZywgcGF5bG9hZD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx1bmtub3duPiA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3R4LmNvbm5lY3Rpb24ucnBjLmNhbGwoJy9kc2gtcHJvbXB0LW9wdGltaXplcicsIGVuZHBvaW50LCBwYXlsb2FkID8/IHt9KTtcbiAgICBpZiAoIXJlc3VsdC5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgY29uZmlnIHJwYyAke2VuZHBvaW50fSBmYWlsZWQ6ICR7KHJlc3VsdC5lcnJvciAmJiAocmVzdWx0LmVycm9yLmRldGFpbHMgfHwgcmVzdWx0LmVycm9yLmNvZGUpKSB8fCAncnBjIGZhaWxlZCd9YCxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG4gIGNvbnN0IGxvYWRDb25maWcgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnBjQ29uZmlnKCdnZXQnKTtcbiAgICAgIGNvbmZpZ01pcnJvciA9IG1lcmdlQ29uZmlnKHZhbHVlIGFzIFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IHVuZGVmaW5lZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyMURcdTZCMjFcdThGREVcdTYzQTVcdTY3MkFcdTVDMzFcdTdFRUFcdTY1RjZcdTRGRERcdTYzMDFcdTlFRDhcdThCQTRcdUZGMUJcdTRFMEJcdTZCMjFcdTRGRERcdTVCNThcdTU0MEVcdTk1NUNcdTUwQ0ZcdTUzNzNcdTY2RjRcdTY1QjBcbiAgICB9XG4gIH07XG4gIHZvaWQgbG9hZENvbmZpZygpO1xuXG4gIC8vIDMuIFx1OEJFRFx1OEEwMFx1OTU1Q1x1NTBDRlxuICBsZXQgbGFuZzogTGFuZyA9IGxhbmdPZihjdHgubG9jYWxlLmdldExvY2FsZSgpLmFjdGl2ZSk7XG4gIGN0eC5vbignbG9jYWxlL2NoYW5nZScsIChzbmFwOiB7IGFjdGl2ZTogc3RyaW5nIH0pID0+IHtcbiAgICBsYW5nID0gbGFuZ09mKHNuYXAuYWN0aXZlKTtcbiAgfSk7XG5cbiAgLy8gNC4gXHU0RjFBXHU4QkREXHU2OUZEXHU0RjREXHVGRjFBXHU2MzA5XHU5NEFFICsgXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XG4gIGN0eC5pbmplY3QoWydzbG90cycsICdzZXNzaW9ucyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1idXR0b24nLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgICAgb3BlblNldHRpbmdzOiAoKSA9PiBlbWl0T3BlblNldHRpbmdzUmVxdWVzdCgpLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBQcmV2aWV3Q2FyZCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNi4gXHU4QkJFXHU3RjZFXHU4ODRDXHVGRjA4cm9vdCBcdTRGNUNcdTc1MjhcdTU3REZcdUZGMDlcbiAgY29uc3Qgc2V0dGluZ3NTdG9yZSA9IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlKCk7XG4gIGNvbnN0IHNhdmVDb25maWcgPSBhc3luYyAocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4pOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICBjb25zdCBtZXJnZWQgPSBtZXJnZUNvbmZpZyh7IC4uLmNvbmZpZ01pcnJvciwgLi4ucmF3IH0pO1xuICAgIGNvbnN0IHdyaXR0ZW46IFByb21wdENvbmZpZyA9IHtcbiAgICAgIGJhc2VVcmw6IG1lcmdlZC5iYXNlVXJsLFxuICAgICAgYXBpS2V5OiBtZXJnZWQuYXBpS2V5LnRyaW0oKSxcbiAgICAgIG1vZGVsOiBtZXJnZWQubW9kZWwsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHsgcGF0Y2g6IHsgYmFzZVVybDogd3JpdHRlbi5iYXNlVXJsLCBhcGlLZXk6IHdyaXR0ZW4uYXBpS2V5LCBtb2RlbDogd3JpdHRlbi5tb2RlbCB9IH0pO1xuICAgICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2F2ZWQgYXMgUGFydGlhbDxQcm9tcHRDb25maWc+IHwgdW5kZWZpbmVkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSk7XG4gICAgfVxuICB9O1xuICBjb25zdCByZXNldENvbmZpZyA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2F2ZWQgPSBhd2FpdCBycGNDb25maWcoJ3NldCcsIHtcbiAgICAgICAgcGF0Y2g6IHsgYmFzZVVybDogREVGQVVMVFMuYmFzZVVybCwgYXBpS2V5OiBERUZBVUxUUy5hcGlLZXksIG1vZGVsOiBERUZBVUxUUy5tb2RlbCB9LFxuICAgICAgfSk7XG4gICAgICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzYXZlZCBhcyBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCB1bmRlZmluZWQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpKTtcbiAgICB9XG4gIH07XG5cbiAgY3R4LmluamVjdChbJ3Nsb3RzJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ3NldHRpbmdzLmdlbmVyYWwuaXRlbScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLXNldHRpbmdzJyxcbiAgICAgICAgICBvcmRlcjogMzAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBzdG9yZTogc2V0dGluZ3NTdG9yZSxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIHNhdmVDb25maWcsXG4gICAgICAgICAgICByZXNldENvbmZpZyxcbiAgICAgICAgICAgIGdldEVwb2NoOiAoKSA9PiBjb25maWdFcG9jaCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgU2V0dGluZ3NSb3csXG4gICAgICApLFxuICAgICk7XG4gIH0pO1xuXG4gIC8vIDcuIFx1NUZFQlx1NjM3N1x1OTUyRVx1RkYxQUFsdCtPXHVGRjA4XHU3MTI2XHU3MEI5XHU1NzI4IHRleHRhcmVhIFx1NTE4NVx1NjVGNlx1N0I0OVx1NjU0OFx1NzBCOVx1NTFGQlx1NEYxOFx1NTMxNlx1NjMwOVx1OTRBRVx1RkYwOVxuICBjb25zdCBvbktleWRvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGlmICghZS5hbHRLZXkgfHwgZS5jb2RlICE9PSAnS2V5TycpIHJldHVybjtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCEoZWwgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlbWl0T3B0aW1pemVSZXF1ZXN0KCk7XG4gIH07XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleWRvd24pO1xufVxuXG4vLyBcdTVGMTVcdTc1MjhcdTVCODhcdTUzNkJcdUZGMUFcdTkwN0ZcdTUxNEQgdHJlZS1zaGFrZSBcdTYzODlcdTdDN0JcdTU3OEJcdUZGMDhcdTRFQzVcdTY1ODdcdTY4NjNcdTYwMjdcdUZGMUJcdTY1RTBcdThGRDBcdTg4NENcdTY1RjZcdTg4NENcdTRFM0FcdUZGMDlcbmV4cG9ydCB0eXBlIHsgT3B0aW1pemVyQWN0aW9ucyB9OyIsICIvKiogUHJvbXB0IFx1NEYxOFx1NTMxNlx1NjgzOFx1NUZDM1x1RkYxQVx1OTE0RFx1N0Y2RVx1NjgyMVx1OUE4Q1x1MzAwMU9wZW5BSSBcdTUxN0NcdTVCQjlcdThDMDNcdTc1MjhcdTMwMDFcdTdFRDNcdTY3OUNcdTYzRDBcdTUzRDYgXHUyMDE0XHUyMDE0IFx1N0VBRlx1NTFGRFx1NjU3MFx1RkYwQ1x1OTZGNiBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvbXB0Q29uZmlnIHtcbiAgYmFzZVVybDogc3RyaW5nO1xuICBhcGlLZXk6IHN0cmluZztcbiAgbW9kZWw6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRTOiBQcm9tcHRDb25maWcgPSB7XG4gIGJhc2VVcmw6ICdodHRwczovL2FwaS5kZWVwc2Vlay5jb20nLFxuICBhcGlLZXk6ICcnLFxuICBtb2RlbDogJ2RlZXBzZWVrLWNoYXQnLFxufTtcblxuZXhwb3J0IHR5cGUgTGFuZyA9ICd6aCcgfCAnZW4nO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQmFzZVVybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB1cmwudHJpbSgpLnJlcGxhY2UoL1xcLyskLywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VDb25maWcocmF3OiBQYXJ0aWFsPFByb21wdENvbmZpZz4gfCBudWxsIHwgdW5kZWZpbmVkKTogUHJvbXB0Q29uZmlnIHtcbiAgY29uc3QgYmFzZVVybCA9IHR5cGVvZiByYXc/LmJhc2VVcmwgPT09ICdzdHJpbmcnICYmIHJhdy5iYXNlVXJsLnRyaW0oKSA/IHJhdy5iYXNlVXJsLnRyaW0oKSA6IERFRkFVTFRTLmJhc2VVcmw7XG4gIGNvbnN0IGFwaUtleSA9IHR5cGVvZiByYXc/LmFwaUtleSA9PT0gJ3N0cmluZycgPyByYXcuYXBpS2V5IDogREVGQVVMVFMuYXBpS2V5O1xuICBjb25zdCBtb2RlbCA9IHR5cGVvZiByYXc/Lm1vZGVsID09PSAnc3RyaW5nJyAmJiByYXcubW9kZWwudHJpbSgpID8gcmF3Lm1vZGVsLnRyaW0oKSA6IERFRkFVTFRTLm1vZGVsO1xuICByZXR1cm4geyBiYXNlVXJsOiBub3JtYWxpemVCYXNlVXJsKGJhc2VVcmwpLCBhcGlLZXksIG1vZGVsIH07XG59XG5cbmV4cG9ydCB0eXBlIENvbmZpZ1Byb2JsZW0gPSAnbWlzc2luZy1rZXknIHwgJ21pc3NpbmctbW9kZWwnIHwgJ2JhZC11cmwnO1xuZXhwb3J0IHR5cGUgQ29uZmlnQ2hlY2sgPSB7IG9rOiB0cnVlOyBjb25maWc6IFByb21wdENvbmZpZyB9IHwgeyBvazogZmFsc2U7IHJlYXNvbjogQ29uZmlnUHJvYmxlbSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tDb25maWcoY29uZmlnOiBQcm9tcHRDb25maWcpOiBDb25maWdDaGVjayB7XG4gIGlmICghY29uZmlnLmFwaUtleS50cmltKCkpIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnbWlzc2luZy1rZXknIH07XG4gIGlmICghY29uZmlnLm1vZGVsLnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLW1vZGVsJyB9O1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKG5vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpKTtcbiAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ2JhZC11cmwnIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGNvbmZpZyB9O1xufVxuXG5jb25zdCBaSF9TWVNURU0gPVxuICAnXHU0RjYwXHU2NjJGXHU0RTAwXHU1NDBEIHByb21wdCBcdTRGMThcdTUzMTZcdTRFMTNcdTVCQjZcdTMwMDJcdTc1MjhcdTYyMzdcdTRGMUFcdTdFRDlcdTRGNjBcdTRFMDBcdTZCQjVcdTgzNDlcdTdBM0YgcHJvbXB0XHVGRjBDXHU4QkY3XHU1NzI4XHU0RTBEXHU2NTM5XHU1M0Q4XHU1MTc2XHU2MTBGXHU1NkZFXHU3Njg0XHU1MjREXHU2M0QwXHU0RTBCXHU1QzA2XHU1MTc2XHU2NTM5XHU1MTk5XHU0RTNBXHU2NkY0XHU2RTA1XHU2NjcwXHUzMDAxXHU2NkY0XHU3RUQzXHU2Nzg0XHU1MzE2XHU3Njg0XHU5QUQ4XHU4RDI4XHU5MUNGIHByb21wdFx1RkYxQScgK1xuICAnXHU4ODY1XHU1MTQ1XHU3RjNBXHU1OTMxXHU3Njg0XHU3NkVFXHU2ODA3XHUzMDAxXHU3RUE2XHU2NzVGXHU0RTBFXHU2NzFGXHU2NzFCXHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHVGRjA4XHU1M0VGXHU0RUNFXHU0RTBBXHU0RTBCXHU2NTg3XHU1NDA4XHU3NDA2XHU2M0E4XHU2NUFEXHVGRjA5XHVGRjBDXHU0RjdGXHU3NTI4XHU3QjgwXHU2RDAxXHU2NjBFXHU3ODZFXHU3Njg0XHU4QkVEXHU4QTAwXHVGRjBDXHU1M0JCXHU2Mzg5XHU1MTk3XHU0RjU5XHUzMDAyJyArXG4gICdcdTRFMERcdTVGOTdcdTdGMTZcdTkwMjBcdTgzNDlcdTdBM0ZcdTRFMkRcdTRFMERcdTVCNThcdTU3MjhcdTc2ODRcdTRFOEJcdTVCOUVcdTYyMTZcdTYyODBcdTY3MkZcdTdFQzZcdTgyODJcdTMwMDJcdTUzRUFcdThGOTNcdTUxRkFcdTRGMThcdTUzMTZcdTU0MEVcdTc2ODQgcHJvbXB0IFx1NkI2M1x1NjU4N1x1RkYwQ1x1NEUwRFx1ODk4MVx1NEVGQlx1NEY1NVx1ODlFM1x1OTFDQVx1MzAwMVx1NTI0RFx1N0YwMFx1NjIxNlx1NEVFM1x1NzgwMVx1NTc1N1x1NTMwNVx1ODhGOVx1MzAwMic7XG5cbmNvbnN0IEVOX1NZU1RFTSA9XG4gICdZb3UgYXJlIGEgcHJvbXB0IG9wdGltaXphdGlvbiBleHBlcnQuIFJld3JpdGUgdGhlIHVzZXJcXCdzIGRyYWZ0IHByb21wdCBpbnRvIGEgY2xlYXJlciwgbW9yZSBzdHJ1Y3R1cmVkLCBoaWdoLXF1YWxpdHkgcHJvbXB0ICcgK1xuICAnd2l0aG91dCBjaGFuZ2luZyBpdHMgaW50ZW50OiBmaWxsIGluIG1pc3NpbmcgZ29hbHMsIGNvbnN0cmFpbnRzLCBhbmQgZXhwZWN0ZWQgb3V0cHV0IGZvcm1hdCB3aGVuIHJlYXNvbmFibHkgaW5mZXJhYmxlLCAnICtcbiAgJ3VzZSBjb25jaXNlIGFuZCBwcmVjaXNlIGxhbmd1YWdlLCBhbmQgcmVtb3ZlIHJlZHVuZGFuY3kuIERvIG5vdCBpbnZlbnQgZmFjdHMgb3IgdGVjaG5pY2FsIGRldGFpbHMgYWJzZW50IGZyb20gdGhlIGRyYWZ0LiAnICtcbiAgJ091dHB1dCBPTkxZIHRoZSBvcHRpbWl6ZWQgcHJvbXB0IHRleHQsIHdpdGggbm8gZXhwbGFuYXRpb25zLCBwcmVmaXhlcywgb3IgY29kZSBmZW5jZXMuJztcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU3lzdGVtUHJvbXB0KGxhbmc6IExhbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbGFuZyA9PT0gJ3poJyA/IFpIX1NZU1RFTSA6IEVOX1NZU1RFTTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUmVxdWVzdEJvZHkoY29uZmlnOiBQcm9tcHRDb25maWcsIHRleHQ6IHN0cmluZywgbGFuZzogTGFuZyk6IG9iamVjdCB7XG4gIHJldHVybiB7XG4gICAgbW9kZWw6IGNvbmZpZy5tb2RlbCxcbiAgICBtZXNzYWdlczogW1xuICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZykgfSxcbiAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB0ZXh0IH0sXG4gICAgXSxcbiAgICB0ZW1wZXJhdHVyZTogMC43LFxuICAgIG1heF90b2tlbnM6IDIwNDgsXG4gICAgc3RyZWFtOiBmYWxzZSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RSZXN1bHQocmF3OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcyA9IHJhdy50cmltKCk7XG4gIGNvbnN0IGZlbmNlID0gL15gYGBbYS16QS1aMC05XystXSpcXG4oW1xcc1xcU10qPylcXG4/YGBgJC87XG4gIGNvbnN0IG1hdGNoZWQgPSBzLm1hdGNoKGZlbmNlKTtcbiAgaWYgKG1hdGNoZWQpIHMgPSBtYXRjaGVkWzFdLnRyaW0oKTtcbiAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5UcmlnZ2VyKGRyYWZ0OiBzdHJpbmcsIGJ1c3k6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuICFidXN5ICYmIGRyYWZ0LnRyaW0oKS5sZW5ndGggPiAwO1xufVxuXG5leHBvcnQgdHlwZSBPcHRpbWl6ZUVycm9yS2luZCA9XG4gIHwgJ2NvbmZpZydcbiAgfCAndW5hdXRob3JpemVkJ1xuICB8ICdmb3JiaWRkZW4nXG4gIHwgJ2h0dHAnXG4gIHwgJ3RpbWVvdXQnXG4gIHwgJ25ldHdvcmsnXG4gIHwgJ2NvcnMnXG4gIHwgJ2JhZC1yZXNwb25zZSdcbiAgfCAnZW1wdHknO1xuXG5leHBvcnQgY2xhc3MgT3B0aW1pemVFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHJlYWRvbmx5IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kLFxuICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ09wdGltaXplRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVRfTVMgPSA2MF8wMDA7XG5cbmZ1bmN0aW9uIGV4dHJhY3RDaG9pY2VDb250ZW50KHBheWxvYWQ6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkICE9PSAnb2JqZWN0JyB8fCBwYXlsb2FkID09PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgY2hvaWNlcyA9IChwYXlsb2FkIGFzIHsgY2hvaWNlcz86IHVua25vd24gfSkuY2hvaWNlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNob2ljZXMpIHx8IGNob2ljZXMubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZmlyc3QgPSBjaG9pY2VzWzBdIGFzIHsgbWVzc2FnZT86IHsgY29udGVudD86IHVua25vd24gfSB9O1xuICBjb25zdCBjb250ZW50ID0gZmlyc3Q/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIHJldHVybiB0eXBlb2YgY29udGVudCA9PT0gJ3N0cmluZycgPyBjb250ZW50IDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRvRXJyb3JLaW5kKGU6IHVua25vd24pOiBPcHRpbWl6ZUVycm9yIHtcbiAgaWYgKGUgaW5zdGFuY2VvZiBPcHRpbWl6ZUVycm9yKSByZXR1cm4gZTtcbiAgY29uc3QgaXNBYm9ydCA9XG4gICAgKHR5cGVvZiBET01FeGNlcHRpb24gIT09ICd1bmRlZmluZWQnICYmIGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgKGUgaW5zdGFuY2VvZiBFcnJvciAmJiAoZSBhcyBFcnJvcikubmFtZSA9PT0gJ0Fib3J0RXJyb3InKTtcbiAgaWYgKGlzQWJvcnQpIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcigndGltZW91dCcsICdyZXF1ZXN0IGFib3J0ZWQnKTtcbiAgaWYgKGUgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICBjb25zdCBtID0gU3RyaW5nKGUubWVzc2FnZSA/PyAnJyk7XG4gICAgLy8gXHU1QzNEXHU1MjlCXHU4MDBDXHU0RTNBXHVGRjFBQ2hyb21pdW0gXHU3Njg0IENPUlMgXHU1OTMxXHU4RDI1XHU5MDFBXHU1RTM4XHU2NjJGIFR5cGVFcnJvcihcIkZhaWxlZCB0byBmZXRjaFwiKVx1RkYwOFx1NjVFMCBjb3JzIFx1NUI1N1x1NjgzN1x1RkYwOVx1RkYwQ1x1NEYxQVx1ODQzRFx1NTIzMCBuZXR3b3JrXHVGRjFCXHU2QjY0XHU1MjA2XHU2NTJGXHU0RUM1XHU2MzU1XHU4M0I3XHU4MUVBXHU1RTI2IENPUlMgXHU1QjU3XHU2ODM3XHU3Njg0XHU5NTE5XHU4QkVGXHUzMDAyXG4gICAgaWYgKC9jb3JzL2kudGVzdChtKSkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCdjb3JzJywgbSk7XG4gICAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgbSB8fCAnbmV0d29yayBlcnJvcicpO1xuICB9XG4gIHJldHVybiBuZXcgT3B0aW1pemVFcnJvcignbmV0d29yaycsIFN0cmluZygoZSBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3B0aW1pemUob3B0czoge1xuICBjb25maWc6IFByb21wdENvbmZpZztcbiAgdGV4dDogc3RyaW5nO1xuICBsYW5nOiBMYW5nO1xuICBzaWduYWw/OiBBYm9ydFNpZ25hbDtcbn0pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IGNvbmZpZywgdGV4dCwgbGFuZywgc2lnbmFsIH0gPSBvcHRzO1xuICBjb25zdCBjaGVjayA9IGNoZWNrQ29uZmlnKGNvbmZpZyk7XG4gIGlmICghY2hlY2sub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdjb25maWcnLCBjaGVjay5yZWFzb24pO1xuXG4gIGxldCByZXM6IFJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IGZldGNoKGAke25vcm1hbGl6ZUJhc2VVcmwoY29uZmlnLmJhc2VVcmwpfS9jaGF0L2NvbXBsZXRpb25zYCwge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHtjb25maWcuYXBpS2V5fWAsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYnVpbGRSZXF1ZXN0Qm9keShjb25maWcsIHRleHQsIGxhbmcpKSxcbiAgICAgIHNpZ25hbCxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IHRvRXJyb3JLaW5kKGUpO1xuICB9XG5cbiAgaWYgKHJlcy5zdGF0dXMgPT09IDQwMSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ3VuYXV0aG9yaXplZCcsIGBIVFRQIDQwMWApO1xuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAzKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignZm9yYmlkZGVuJywgYEhUVFAgNDAzYCk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignaHR0cCcsIGBIVFRQICR7cmVzLnN0YXR1c31gKTtcblxuICBsZXQgcGF5bG9hZDogdW5rbm93bjtcbiAgdHJ5IHtcbiAgICBwYXlsb2FkID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2JhZC1yZXNwb25zZScsICdpbnZhbGlkIEpTT04nKTtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZCk7XG4gIGlmICghY29udGVudCB8fCAhY29udGVudC50cmltKCkpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdlbXB0eScsICdlbXB0eSBjb21wbGV0aW9uJyk7XG4gIHJldHVybiBleHRyYWN0UmVzdWx0KGNvbnRlbnQpO1xufVxuIiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2M0QyXHU0RUY2XHU2NTg3XHU2ODQ4IFx1MjAxNCBcdTRFMkRcdTgyRjFcdTUzQ0NcdThCRUQgKi9cblxuaW1wb3J0IHR5cGUgeyBMYW5nIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgY29uc3QgTlMgPSAncHJvbXB0X29wdGltaXplcic7XG5cbmV4cG9ydCBjb25zdCB6aCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ1x1NEYxOFx1NTMxNiBwcm9tcHQnLFxuICAnY2FyZC50aXRsZSc6ICdcdTRGMThcdTUzMTZcdTdFRDNcdTY3OUMnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1x1NjZGRlx1NjM2Mlx1ODM0OVx1N0EzRicsXG4gICdjYXJkLmNvcHknOiAnXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnXHU1REYyXHU1OTBEXHU1MjM2JyxcbiAgJ2NhcmQucmV0cnknOiAnXHU5MUNEXHU2NUIwXHU0RjE4XHU1MzE2JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdcdTY1M0VcdTVGMDMnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ1x1NkI2M1x1NTcyOFx1NEYxOFx1NTMxNlx1MjAyNicsXG4gICdjYXJkLmNvbmZpZ3VyZWQuaGludCc6ICdcdTVERjJcdTkxNERcdTdGNkUgXHUwMEI3IFx1NkEyMVx1NTc4QiB7bW9kZWx9JyxcbiAgJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnOiAnXHU2NzJBXHU5MTREXHU3RjZFIEFQSScsXG4gICdndWlkZS50aXRsZSc6ICdcdThCRjdcdTUxNDhcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLmRlc2MnOiAnXHU1MjREXHU1RjgwIFx1OEJCRVx1N0Y2RSBcdTIxOTIgXHU5MDFBXHU3NTI4XHU4QkJFXHU3RjZFIFx1MjE5MiBQcm9tcHQgXHU0RjE4XHU1MzE2XHVGRjBDXHU1ODZCXHU1MTk5XHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwXHUzMDAxQVBJIEtleSBcdTRFMEVcdTZBMjFcdTU3OEJcdTU0MERcdTMwMDInLFxuICAnZ3VpZGUuYWN0aW9uJzogJ1x1NTNCQlx1OEJCRVx1N0Y2RScsXG4gICdndWlkZS5kaXNtaXNzJzogJ1x1NzdFNVx1OTA1M1x1NEU4NicsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIEtleSBcdTY1RTBcdTY1NDhcdTYyMTZcdTVERjJcdThGQzdcdTY3MUYnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ1x1NjcwRFx1NTJBMVx1NjJEMlx1N0VERFx1OEJCRlx1OTVFRVx1RkYwODQwM1x1RkYwOScsXG4gICdlcnJvci50aW1lb3V0JzogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ1x1N0Y1MVx1N0VEQ1x1OTUxOVx1OEJFRlx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1N0Y1MVx1N0VEQ1x1NEUwRVx1NjNBNVx1NTNFM1x1NTczMFx1NTc0MCcsXG4gICdlcnJvci5jb3JzJzogJ1x1NjNBNVx1NTNFM1x1NEUwRFx1NjUyRlx1NjMwMVx1OERFOFx1NTdERlx1RkYwQ1x1OEJGN1x1NjM2Mlx1NzUyOFx1NjUyRlx1NjMwMSBDT1JTIFx1NzY4NFx1N0Y1MVx1NTE3MycsXG4gICdlcnJvci5odHRwJzogJ1x1OEJGN1x1NkM0Mlx1NTkzMVx1OEQyNVx1RkYwOEhUVFAgXHU5NTE5XHU4QkVGXHVGRjA5JyxcbiAgJ2Vycm9yLmJhZC1yZXNwb25zZSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTY4M0NcdTVGMEZcdTVGMDJcdTVFMzgnLFxuICAnZXJyb3IuZW1wdHknOiAnXHU4RkQ0XHU1NkRFXHU1MTg1XHU1QkI5XHU0RTNBXHU3QTdBXHVGRjBDXHU4QkY3XHU5MUNEXHU4QkQ1JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdcdTkxNERcdTdGNkVcdTRFMERcdTVCOENcdTY1NzRcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTY4QzBcdTY3RTUnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IFx1NEYxOFx1NTMxNicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ1x1OTE0RFx1N0Y2RVx1NkRBNlx1ODI3Mlx1NjNBNVx1NTNFM1x1RkYwOE9wZW5BSSBcdTUxN0NcdTVCQjlcdUZGMDlcdUZGMUJLZXkgXHU2NjBFXHU2NTg3XHU0RkREXHU1QjU4XHU1NzI4XHU2NzJDXHU1NzMwJyxcbiAgJ3NldHRpbmdzLmJhc2VVcmwnOiAnXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ1x1NkEyMVx1NTc4Qlx1NTQwRCcsXG4gICdzZXR0aW5ncy5zYXZlJzogJ1x1NEZERFx1NUI1OCcsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdcdTYwNjJcdTU5MERcdTlFRDhcdThCQTQnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnXHU1REYyXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnNhdmVGYWlsZWQnOiAnXHU0RkREXHU1QjU4XHU1OTMxXHU4RDI1JyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1x1OTFDRFx1N0Y2RVx1NTkzMVx1OEQyNScsXG4gICdzZXR0aW5ncy5jbGlja1RvRWRpdCc6ICdcdTcwQjlcdTUxRkJcdTkxNERcdTdGNkUnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IGNvbnN0IGVuOiBMb2NhbGVEaWN0ID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnT3B0aW1pemUgcHJvbXB0JyxcbiAgJ2NhcmQudGl0bGUnOiAnT3B0aW1pemVkIHByb21wdCcsXG4gICdjYXJkLnJlcGxhY2UnOiAnVXNlIGRyYWZ0JyxcbiAgJ2NhcmQuY29weSc6ICdDb3B5JyxcbiAgJ2NhcmQuY29weURvbmUnOiAnQ29waWVkJyxcbiAgJ2NhcmQucmV0cnknOiAnUmV0cnknLFxuICAnY2FyZC5kaXNtaXNzJzogJ0Rpc21pc3MnLFxuICAnY2FyZC5vcHRpbWl6aW5nJzogJ09wdGltaXppbmdcdTIwMjYnLFxuICAnY2FyZC5jb25maWd1cmVkLmhpbnQnOiAnQ29uZmlndXJlZCBcdTAwQjcgbW9kZWwge21vZGVsfScsXG4gICdjYXJkLnVuY29uZmlndXJlZC5oaW50JzogJ05vIEFQSSBjb25maWd1cmVkJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ0NvbmZpZ3VyZSB0aGUgQVBJIGZpcnN0JyxcbiAgJ2d1aWRlLmRlc2MnOiAnR28gdG8gU2V0dGluZ3MgXHUyMTkyIEdlbmVyYWwgXHUyMTkyIFByb21wdCBPcHRpbWl6ZXIgYW5kIGZpbGwgaW4gdGhlIGVuZHBvaW50LCBBUEkga2V5LCBhbmQgbW9kZWwuJyxcbiAgJ2d1aWRlLmFjdGlvbic6ICdHbyB0byBzZXR0aW5ncycsXG4gICdndWlkZS5kaXNtaXNzJzogJ0dvdCBpdCcsXG4gICdlcnJvci51bmF1dGhvcml6ZWQnOiAnQVBJIGtleSBpcyBpbnZhbGlkIG9yIGV4cGlyZWQnLFxuICAnZXJyb3IuZm9yYmlkZGVuJzogJ0FjY2VzcyBmb3JiaWRkZW4gKDQwMyknLFxuICAnZXJyb3IudGltZW91dCc6ICdSZXF1ZXN0IHRpbWVkIG91dDsgY2hlY2sgeW91ciBuZXR3b3JrIGFuZCBlbmRwb2ludCcsXG4gICdlcnJvci5uZXR3b3JrJzogJ05ldHdvcmsgZXJyb3I7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IuY29ycyc6ICdFbmRwb2ludCBibG9ja3MgQ09SUzsgdXNlIGEgZ2F0ZXdheSB0aGF0IGFsbG93cyBpdCcsXG4gICdlcnJvci5odHRwJzogJ1JlcXVlc3QgZmFpbGVkIChIVFRQIGVycm9yKScsXG4gICdlcnJvci5iYWQtcmVzcG9uc2UnOiAnVW5leHBlY3RlZCByZXNwb25zZSBmb3JtYXQnLFxuICAnZXJyb3IuZW1wdHknOiAnRW1wdHkgcmVzdWx0OyBwbGVhc2UgcmV0cnknLFxuICAnZXJyb3IuY29uZmlnJzogJ0luY29tcGxldGUgY29uZmlndXJhdGlvbjsgY2hlY2sgc2V0dGluZ3MnLFxuICAnc2V0dGluZ3MudGl0bGUnOiAnUHJvbXB0IE9wdGltaXplcicsXG4gICdzZXR0aW5ncy5kZXNjJzogJ0NvbmZpZ3VyZSB0aGUgcmV3cml0ZSBlbmRwb2ludCAoT3BlbkFJLWNvbXBhdGlibGUpOyBrZXkgaXMgc3RvcmVkIGxvY2FsbHkgaW4gcGxhaW4gdGV4dCcsXG4gICdzZXR0aW5ncy5iYXNlVXJsJzogJ0Jhc2UgVVJMJyxcbiAgJ3NldHRpbmdzLmFwaUtleSc6ICdBUEkgS2V5JyxcbiAgJ3NldHRpbmdzLm1vZGVsJzogJ01vZGVsJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnU2F2ZScsXG4gICdzZXR0aW5ncy5yZXNldCc6ICdSZXNldCB0byBkZWZhdWx0cycsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdTYXZlZCcsXG4gICdzZXR0aW5ncy5zYXZlRmFpbGVkJzogJ1NhdmUgZmFpbGVkJyxcbiAgJ3NldHRpbmdzLnJlc2V0RmFpbGVkJzogJ1Jlc2V0IGZhaWxlZCcsXG4gICdzZXR0aW5ncy5jbGlja1RvRWRpdCc6ICdDbGljayB0byBjb25maWd1cmUnLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgTG9jYWxlS2V5ID0ga2V5b2YgdHlwZW9mIHpoO1xuZXhwb3J0IHR5cGUgTG9jYWxlRGljdCA9IHsgW0sgaW4gTG9jYWxlS2V5XTogc3RyaW5nIH07XG5cbi8qKiBcdTZGQzBcdTZEM0IgbG9jYWxlIFx1MjE5MiBcdTc1NENcdTk3NjJcdThCRURcdThBMDBcdUZGMDh6aCBcdTUyNERcdTdGMDBcdTVGNTIgemhcdUZGMENcdTUxNzZcdTRGNTlcdTVGNTIgZW5cdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBsYW5nT2YoYWN0aXZlOiBzdHJpbmcpOiBMYW5nIHtcbiAgcmV0dXJuIHR5cGVvZiBhY3RpdmUgPT09ICdzdHJpbmcnICYmIGFjdGl2ZS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ3poJykgPyAnemgnIDogJ2VuJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgXHUyMDE0XHUyMDE0IFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjBDXHU3MkI2XHU2MDAxXHU4RDcwXHU2QTIxXHU1NzU3XHU3RUE3XHU5ODg0XHU4OUM4XHU2MDNCXHU3RUJGICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VDYWxsYmFjaywgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9idXR0b24uY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMnB4IDZweDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMTtcbiAgb3BhY2l0eTogMC44NTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xufVxuLmRzaC1wby1idG46aG92ZXI6bm90KDpkaXNhYmxlZCkge1xuICBvcGFjaXR5OiAxO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xMikpO1xufVxuLmRzaC1wby1idG46ZGlzYWJsZWQge1xuICBvcGFjaXR5OiAwLjM1O1xuICBjdXJzb3I6IGRlZmF1bHQ7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuLyoqXG4gKiBcdThCRkJcdTUzRDZcdTVGNTNcdTUyNERcdTgzNDlcdTdBM0ZcdUZGMUFcdTRGMThcdTUxNDhcdTUzRDZcdTcxMjZcdTcwQjkgdGV4dGFyZWFcdUZGMUJcdTU0MjZcdTUyMTlcdTU2REVcdTkwMDBcdTUyMzBcdTk4NzVcdTk3NjJcdTRFMkRcdTMwMENcdTUwM0NcdTk3NUVcdTdBN0FcdTMwMERcdTc2ODQgdGV4dGFyZWFcbiAqIFx1RkYwOFx1NzUyOFx1NjIzN1x1NTcyOFx1OEY5M1x1NTE2NVx1NzY4NFx1NTM3M1x1NUY1M1x1NTI0RFx1ODM0OVx1N0EzRlx1RkYwOVx1MzAwMlx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERFx1NjgwN1x1NTFDNiBraXQgXHU3Njg0IGlucHV0IGhvb2tcdTIwMTRcdTIwMTRcdTVCOUVcdTZENEJcbiAqIGlucHV0LnJpZ2h0IFx1NkUzMlx1NjdEM1x1NjVGNlx1OEJFNVx1NjgwN1x1NTFDNiBwcm9wcyBcdTY3MkFcdTYzRDBcdTRGOUJcdUZGMENcdTdFQzRcdTRFRjZcdTRGMUFcdTU2RTBcdThDMDNcdTc1MjggdW5kZWZpbmVkIGhvb2tcbiAqIFx1NUQyOVx1NkU4M1x1ODhBQlx1OTUxOVx1OEJFRlx1OEZCOVx1NzU0Q1x1NTQxRVx1NjM4OVx1RkYwOFBPLVJJR0hULU9LIFx1NjNBMlx1OTQ4OFx1NTNFRlx1ODlDMVx1ODAwQyBcdTI3MjggXHU0RTBEXHU1M0VGXHU4OUMxXHVGRjA5XHUzMDAyXG4gKi9cbmZ1bmN0aW9uIHJlYWREcmFmdCgpOiBzdHJpbmcge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgcmV0dXJuIGFjdGl2ZS52YWx1ZTtcbiAgY29uc3QgYWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MVGV4dEFyZWFFbGVtZW50PigndGV4dGFyZWEnKTtcbiAgZm9yIChjb25zdCB0YSBvZiBhbGwpIHtcbiAgICBpZiAodGEudmFsdWUudHJpbSgpKSByZXR1cm4gdGEudmFsdWU7XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gT3B0aW1pemVCdXR0b24ocHJvcHM6IE9wdGltaXplQnV0dG9uUHJvcHMpIHtcbiAgY29uc3QgeyB0LCBnZXRDb25maWcsIGdldExhbmcgfSA9IHByb3BzO1xuXG4gIC8vIFx1N0U0MVx1NUZEOVx1NjAwMVx1RkYxQVx1OEJBMlx1OTYwNVx1NkEyMVx1NTc1N1x1N0VBN1x1OTg4NFx1ODlDOFx1NjAzQlx1N0VCRlx1RkYwOFx1NjZGRlx1NEVFM1x1NEYxQVx1OEJERCBzdG9yZSBwcm9wc1x1RkYwOVxuICBjb25zdCBbYnVzeSwgc2V0QnVzeV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJyk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldEJ1c3koZ2V0UHJldmlld0J1c1N0YXRlKCkuc3RhdHVzID09PSAnb3B0aW1pemluZycpKSxcbiAgICBbXSxcbiAgKTtcblxuICAvLyBtb3VzZWRvd24gXHU5ODg0XHU4QkZCXHU4MzQ5XHU3QTNGXHVGRjFBXHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHU3N0FDXHU5NUY0XHU3MTI2XHU3MEI5XHU0RjFBXHU1MjA3XHU1MjMwXHU2MzA5XHU5NEFFXHVGRjA4YWN0aXZlRWxlbWVudCBcdTRFMERcdTUxOERcdTY2MkYgdGV4dGFyZWFcdUZGMDlcdUZGMENcbiAgLy8gXHU0RjQ2IG1vdXNlZG93biBcdTY1RTlcdTRFOEVcdTcxMjZcdTcwQjlcdTUyMDdcdTYzNjJcdTIwMTRcdTIwMTRcdTZCNjRcdTUyM0JcdThCRkJcdTUyMzBcdTc2ODQgYWN0aXZlRWxlbWVudCBcdTRFQ0RcdTY2MkZcdThGOTNcdTUxNjVcdTY4NDZcdTMwMDJcbiAgY29uc3QgZHJhZnRSZWYgPSBSZWFjdC51c2VSZWYoJycpO1xuICBjb25zdCBzeW5jRHJhZnQgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgZHJhZnRSZWYuY3VycmVudCA9IHJlYWREcmFmdCgpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGJ1c3kpIHJldHVybjtcbiAgICBjb25zdCBkcmFmdCA9IGRyYWZ0UmVmLmN1cnJlbnQgfHwgcmVhZERyYWZ0KCk7XG4gICAgaWYgKCFkcmFmdC50cmltKCkpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gZHJhZnQsXG4gICAgfSk7XG4gIH0sIFtidXN5LCBnZXRDb25maWcsIGdldExhbmddKTtcblxuICAvLyBBbHQrTyBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMDhpbmRleC50cyBcdTUxNjhcdTVDNDBcdTc2RDFcdTU0MkNcdUZGMDlcdTIxOTIgXHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wdGltaXplUmVxdWVzdChoYW5kbGVDbGljayksIFtoYW5kbGVDbGlja10pO1xuXG4gIHJldHVybiAoXG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBjbGFzc05hbWU9XCJkc2gtcG8tYnRuXCJcbiAgICAgIGFyaWEtbGFiZWw9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICB0aXRsZT17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIGFyaWEtYnVzeT17YnVzeX1cbiAgICAgIGRpc2FibGVkPXtidXN5fVxuICAgICAgZGF0YS1idXN5PXtidXN5fVxuICAgICAgb25Nb3VzZURvd249e3N5bmNEcmFmdH1cbiAgICAgIG9uRm9jdXM9e3N5bmNEcmFmdH1cbiAgICAgIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfVxuICAgID5cbiAgICAgIHtidXN5ID8gJ1x1MjNGMycgOiAnXHUyNzI4J31cbiAgICA8L2J1dHRvbj5cbiAgKTtcbn0iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbn1cblxuLyoqIFx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYxQXJlZHVjZXIgXHU2QzM4XHU0RTBEXHU1MTk5XHU1NkRFXHU1QjgzXHU2MjE2XHU4RkQ0XHU1NkRFXHU1M0VGXHU1M0Q4XHU3Njg0XHU2NUIwXHU1QkY5XHU4QzYxXHVGRjFCXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA4VGFzayA0IHN0b3JlIFx1ODBGNlx1NkMzNFx1RkYwOVx1NUZDNVx1OTg3Qlx1NEVFNSB7IC4uLklOSVRJQUxfUFJFVklFVyB9IFx1NEUzQVx1NkJDRlx1NEYxQVx1OEJERFx1NzlDRFx1NUI1MCAqL1xuZXhwb3J0IGNvbnN0IElOSVRJQUxfUFJFVklFVzogUHJldmlld1N0YXRlID0ge1xuICBzdGF0dXM6ICdpZGxlJyxcbiAgcmVzdWx0OiAnJyxcbiAgZXJyb3JLaW5kOiBudWxsLFxuICBnZW5lcmF0aW9uOiAwLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCB9XG4gIHwgeyB0eXBlOiAnZ3VpZGUnIH1cbiAgfCB7IHR5cGU6ICdjbG9zZScgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHN0YXR1czogJ29wdGltaXppbmcnLCBlcnJvcktpbmQ6IG51bGwsIGdlbmVyYXRpb246IHN0YXRlLmdlbmVyYXRpb24gKyAxIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0IH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuLyoqIFx1OEJBMVx1NTIxMlx1ODlDNFx1NUI5QVx1NzY4NFx1NTE2Q1x1NUYwMCBBUElcdUZGMDhUYXNrIDQgXHU4RDc3XHU1QjU4XHU1NzI4XHVGRjFCY2FuVHJpZ2dlciBcdTc2ODQgIWJ1c3kgXHU1MzRBXHU4RkI5XHU2MjdGXHU2MkM1XHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU4MDRDXHU4RDIzXHVGRjBDXHU1MTc2XHU0RjU5XHU0RkREXHU3NTU5XHU0RUU1XHU1OTA3XHU1NDBFXHU3RUVEXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2FuT3B0aW1pemVGcm9tKHN0YXR1czogUHJldmlld1N0YXR1cyk6IGJvb2xlYW4ge1xuICByZXR1cm4gc3RhdHVzICE9PSAnb3B0aW1pemluZyc7XG59XG4iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMVx1NkEyMVx1NTc1N1x1N0VBN1x1NEU4Qlx1NEVGNlx1NjAzQlx1N0VCRiBcdTIwMTRcdTIwMTQgXHU2MzA5XHU5NEFFL1x1OTg4NFx1ODlDOFx1NTM2MS9ydW5PcHRpbWl6ZSBcdTUxNzFcdTRFQUJcdUZGMENcdTRFMERcdTRGOURcdThENTZcdTRGMUFcdThCREQgc3RvcmUvaG9vayAqL1xuXG5pbXBvcnQge1xuICBJTklUSUFMX1BSRVZJRVcsXG4gIHJlZHVjZVByZXZpZXcsXG4gIHR5cGUgUHJldmlld0FjdGlvbixcbiAgdHlwZSBQcmV2aWV3U3RhdGUsXG59IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTZBMjFcdTU3NTdcdTdFQTdcdTUzNTVcdTRGOEJcdTcyQjZcdTYwMDFcdUZGMDhcdTZCQ0ZcdTYzRDJcdTRFRjZcdTVCOUVcdTRGOEJcdTRFMDBcdTRFRkRcdUZGMUFcdTZFMzJcdTY3RDNcdThGREJcdTdBMEJcdTUxODVcdTUxNjhcdTVDNDBcdTU1MkZcdTRFMDBcdUZGMDkgKi9cbmxldCBzdGF0ZTogUHJldmlld1N0YXRlID0geyAuLi5JTklUSUFMX1BSRVZJRVcgfTtcbmNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuLyoqIFx1OEJGQlx1NUY1M1x1NTI0RFx1NUZFQlx1NzE2N1x1RkYwOFx1N0EzM1x1NUI5QVx1NUYxNVx1NzUyOFx1NzZGNFx1NTIzMFx1NEUwQlx1NEUwMFx1NkIyMSBkaXNwYXRjaFx1RkYwOSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpZXdCdXNTdGF0ZSgpOiBQcmV2aWV3U3RhdGUge1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8qKiBcdTZEM0VcdTUzRDFcdTcyQjZcdTYwMDFcdTY3M0FcdTUyQThcdTRGNUNcdTVFNzZcdTkwMUFcdTc3RTVcdThCQTJcdTk2MDVcdTgwMDUgKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNwYXRjaFByZXZpZXcoYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogdm9pZCB7XG4gIHN0YXRlID0gcmVkdWNlUHJldmlldyhzdGF0ZSwgYWN0aW9uKTtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIGxpc3RlbmVyKCk7XG59XG5cbi8qKiBcdThCQTJcdTk2MDVcdTUzRDhcdTUzMTZcdUZGMUJcdThGRDRcdTU2REVcdTkwMDBcdThCQTJcdTUxRkRcdTY1NzAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzdWJzY3JpYmVQcmV2aWV3QnVzKGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogKCkgPT4gdm9pZCB7XG4gIGxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIGxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9O1xufSIsICIvKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICsgXHU2QTIxXHU1NzU3XHU3RUE3XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2IFx1MjAxNFx1MjAxNCBcdTcyQjZcdTYwMDFcdTdFQ0ZcdTZBMjFcdTU3NTdcdTdFQTdcdTRFOEJcdTRFRjZcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1NTNEMVx1NUUwM1x1RkYwQ1xuICogIFx1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzXHVGRjA4XHU2ODRDXHU5NzYyXHU2RTMyXHU2N0QzXHU1QzQyXHU1QkY5IGlucHV0LnJpZ2h0L292ZXJsYXkgXHU2OUZEXHU0RjREXHU0RTBEXHU2M0QwXHU0RjlCXHU4RkQ5XHU0RTlCXHU2ODA3XHU1MUM2IHByb3BzXHVGRjBDXG4gKiAgXHU3RUM0XHU0RUY2XHU0RjlEXHU4RDU2XHU1QjgzXHU0RUVDXHU0RjFBXHU1RDI5XHU1RTc2XHU4OEFCXHU5NTE5XHU4QkVGXHU4RkI5XHU3NTRDXHU1NDFFXHU2Mzg5XHUyMDE0XHUyMDE0UE8tUklHSFQtT0sgXHU2M0EyXHU5NDg4XHU1M0VGXHU4OUMxXHU4MDBDIFx1MjcyOC9cdTk4ODRcdTg5QzhcdTUzNjFcdTRFMERcdTUzRUZcdTg5QzFcdTc2ODRcdTVCOUVcdTZENEJcdTVCOUFcdThCQkFcdUZGMDlcdTMwMDIgKi9cblxuaW1wb3J0IHtcbiAgY2hlY2tDb25maWcsXG4gIG9wdGltaXplLFxuICBSRVFVRVNUX1RJTUVPVVRfTVMsXG4gIHRvRXJyb3JLaW5kLFxuICB0eXBlIExhbmcsXG4gIHR5cGUgT3B0aW1pemVFcnJvcktpbmQsXG4gIHR5cGUgUHJvbXB0Q29uZmlnLFxufSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBkaXNwYXRjaFByZXZpZXcgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuLyoqXG4gKiBcdTVGNTNcdTUyNEQgaW4tZmxpZ2h0IFx1OEJGN1x1NkM0Mlx1NzY4NFx1NjNBN1x1NTIzNlx1NTY2OFx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYwOVx1RkYxQVxuICogLSBcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdTY1RjZcdTRFMkRcdTZCNjJcdTVCODNcdUZGMENcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2hvdygpL2ZhaWwoKSBcdTU5MERcdTZEM0JcdTVERjJcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdUZGMUJcbiAqIC0gcnVuT3B0aW1pemUgXHU0RUU1XHUzMDBDXHU1QjU4XHU1NzI4XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2XHU1NjY4XHUzMDBEXHU0RTNBXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjA4XHU1NDBDXHU0RTAwXHU2NUY2XHU1MjNCXHU1M0VBXHU1MTQxXHU4QkI4XHU0RTAwXHU0RTJBXHU4QkY3XHU2QzQyXHU1NzI4XHU5MDE0XHVGRjA5XHUzMDAyXG4gKiBcdTZDRThcdUZGMUFcdTZBMjFcdTU3NTdcdTdFQTdcdTYxMEZcdTU0NzNcdTc3NDBcdTU5MUFcdTRGMUFcdThCRERcdTU0MENcdTY1RjZcdTRGMThcdTUzMTZcdTRGMUFcdTRFOTJcdTc2RjhcdThCQTlcdThERUZcdTIwMTRcdTIwMTRcdThGOTNcdTUxNjVcdTY4MEZcdTUzNTVcdTRGMUFcdThCRERcdTgwNUFcdTcxMjZcdTc2ODRcdTRFQTRcdTRFOTJcdTRFMEJcdTUzRUZcdTYzQTVcdTUzRDdcdTZCNjRcdTdCODBcdTUzMTZcdTMwMDJcbiAqL1xubGV0IGFjdGl2ZUNvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG4vKiogXHU1MTczXHU5NUVEXHU5ODg0XHU4OUM4XHU1MzYxXHVGRjA4XHU1RTc2XHU0RTJEXHU2QjYyXHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VQcmV2aWV3KCk6IHZvaWQge1xuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkge1xuICAgIGFjdGl2ZUNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgfVxuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnY2xvc2UnIH0pO1xufVxuXG4vKiogXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyXHVGRjFBXHU5MTREXHU3RjZFXHU3RjNBXHU1OTMxIFx1MjE5MiBndWlkZVx1RkYxQlx1ODM0OVx1N0EzRlx1N0E3QSBcdTIxOTIgXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXHVGRjFCXHU1RTc2XHU1M0QxIFx1MjE5MiBcdTRFMjJcdTVGMDNcdUZGMUJcdThEODVcdTY1RjYvXHU1M0Q2XHU2RDg4IFx1MjE5MiB0aW1lb3V0IFx1NjIxNlx1OTc1OVx1OUVEOCAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bk9wdGltaXplKGN0eDoge1xuICBnZXRDb25maWcoKTogUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nKCk6IExhbmc7XG4gIGdldERyYWZ0KCk6IHN0cmluZztcbn0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZ3VpZGUnIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkcmFmdCA9IGN0eC5nZXREcmFmdCgpLnRyaW0oKTtcbiAgaWYgKCFkcmFmdCkgcmV0dXJuO1xuXG4gIC8vIFx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYxQVx1NURGMlx1NjcwOVx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1NTIxOVx1NEUyMlx1NUYwM1x1NjcyQ1x1NkIyMVx1ODlFNlx1NTNEMVx1RkYwOFx1NjMwOVx1OTRBRSBidXN5IFx1NjAwMVx1NURGMlx1Nzk4MVx1NzUyOFx1NzBCOVx1NTFGQlx1RkYwQ1x1OEZEOVx1OTFDQ1x1NjYyRlx1N0FERVx1NjAwMVx1NzY4NFx1NjcwMFx1NTQwRVx1OTYzMlx1N0VCRlx1RkYwOVxuICBpZiAoYWN0aXZlQ29udHJvbGxlciAhPT0gbnVsbCkgcmV0dXJuO1xuICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnYmVnaW4nIH0pO1xuXG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGFjdGl2ZUNvbnRyb2xsZXIgPSBjb250cm9sbGVyOyAvLyBcdTZDRThcdTUxOENcdTdFRDkgY2xvc2VQcmV2aWV3KClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplKHsgY29uZmlnLCB0ZXh0OiBkcmFmdCwgbGFuZzogY3R4LmdldExhbmcoKSwgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnc2hvdycsIHJlc3VsdCB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1NTE0OFx1NTIyNFx1NUI5QVx1NEUyRFx1NkI2Mlx1RkYxQVx1NzUyOFx1NjIzNy9cdTdFQzRcdTRFRjZcdTUzRDZcdTZEODhcdTRFMEVcdThEODVcdTY1RjZcdTkwRkRcdTg4NjhcdTczQjBcdTRFM0EgQWJvcnRFcnJvclx1RkYxQlx1NEVDNVx1OEQ4NVx1NjVGNlx1NTE5OVx1NTE2NVx1OTUxOVx1OEJFRlx1NjAwMVxuICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICBpZiAodGltZWRPdXQpIGRpc3BhdGNoUHJldmlldyh7IHR5cGU6ICdmYWlsJywga2luZDogJ3RpbWVvdXQnIGFzIE9wdGltaXplRXJyb3JLaW5kIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwYXRjaFByZXZpZXcoeyB0eXBlOiAnZmFpbCcsIGtpbmQ6IHRvRXJyb3JLaW5kKGUpLmtpbmQgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDFcbiAqICBcdTcyQjZcdTYwMDFcdTY3NjVcdTgxRUFcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhwcmV2aWV3LWJ1c1x1RkYwOVx1RkYwQ1x1NEUwRFx1NEY5RFx1OEQ1Nlx1NEYxQVx1OEJERCBzdG9yZS9ob29rIHByb3BzICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IHJ1bk9wdGltaXplLCBjbG9zZVByZXZpZXcgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBnZXRQcmV2aWV3QnVzU3RhdGUsIHN1YnNjcmliZVByZXZpZXdCdXMgfSBmcm9tICcuL3ByZXZpZXctYnVzLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMxNjc3ZmYpO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbi8qKiBcdTYyN0UgY29tcG9zZXIgXHU4RjkzXHU1MTY1XHU2ODQ2XHVGRjFBXHU0RjE4XHU1MTQ4XHU3MTI2XHU3MEI5XHVGRjBDXHU1NDI2XHU1MjE5XHU3QjJDXHU0RTAwXHU0RTJBXHU5NzVFIGRpc2FibGVkIHRleHRhcmVhICovXG5mdW5jdGlvbiBmaW5kQ29tcG9zZXIoKTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICBpZiAoYWN0aXZlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCAmJiAhYWN0aXZlLmRpc2FibGVkKSByZXR1cm4gYWN0aXZlO1xuICBjb25zdCBhbGwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUZXh0QXJlYUVsZW1lbnQ+KCd0ZXh0YXJlYScpO1xuICBmb3IgKGNvbnN0IHRhIG9mIGFsbCkge1xuICAgIGlmICghdGEuZGlzYWJsZWQpIHJldHVybiB0YTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVhZENvbXBvc2VyVGV4dCgpOiBzdHJpbmcge1xuICBjb25zdCB0YSA9IGZpbmRDb21wb3NlcigpO1xuICByZXR1cm4gdGEgPyB0YS52YWx1ZSA6ICcnO1xufVxuXG4vKiogXHU3NTI4XHU1MzlGXHU3NTFGIHZhbHVlIHNldHRlciBcdTUxOTlcdTU2REVcdUZGMENcdThCQTkgUmVhY3QgXHU1M0Q3XHU2M0E3XHU3RUM0XHU0RUY2XHU2MTFGXHU3N0U1XHVGRjA4XHU1MThEXHU2RDNFXHU1M0QxIGlucHV0IFx1NEU4Qlx1NEVGNlx1ODlFNlx1NTNEMSBvbkNoYW5nZVx1RkYwOSAqL1xuZnVuY3Rpb24gd3JpdGVDb21wb3NlclRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRhID0gZmluZENvbXBvc2VyKCk7XG4gIGlmICghdGEpIHJldHVybjtcbiAgY29uc3Qgc2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MVGV4dEFyZWFFbGVtZW50LnByb3RvdHlwZSwgJ3ZhbHVlJyk/LnNldDtcbiAgaWYgKHNldHRlcikge1xuICAgIHNldHRlci5jYWxsKHRhLCB0ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0YS52YWx1ZSA9IHRleHQ7XG4gIH1cbiAgdGEuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2lucHV0JywgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgdGEuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gZXJyb3JLZXkoa2luZDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIC8vIGtpbmQgXHUyMTkyIGxvY2FsZSBrZXlcdUZGMUInY29uZmlnJyBcdTU3MjggVUkgXHU0RTBBXHU0RTBEXHU1M0VGXHU4RkJFXHVGRjA4cnVuT3B0aW1pemUgXHU1MTQ4XHU4RDcwIGd1aWRlXHVGRjA5XHVGRjBDQWJvcnRFcnJvclx1MjE5MnRpbWVvdXQgXHU3NTMxIHJ1bk9wdGltaXplIFx1NTE0OFx1ODg0Q1x1NjJFNlx1NjIyQVx1RkYwQ1x1NEZERFx1NzU1OVx1NTNDQ1x1NEZERFx1OTY2OVxuICAgIGNhc2UgJ3VuYXV0aG9yaXplZCc6IGNhc2UgJ2ZvcmJpZGRlbic6IGNhc2UgJ3RpbWVvdXQnOiBjYXNlICduZXR3b3JrJzogY2FzZSAnY29ycyc6IGNhc2UgJ2h0dHAnOiBjYXNlICdiYWQtcmVzcG9uc2UnOiBjYXNlICdlbXB0eSc6IGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIGdldENvbmZpZywgZ2V0TGFuZywgb3BlblNldHRpbmdzIH0gPSBwcm9wcztcblxuICAvLyBcdThCQTJcdTk2MDVcdTZBMjFcdTU3NTdcdTdFQTdcdTk4ODRcdTg5QzhcdTYwM0JcdTdFQkZcdUZGMDhcdTY2RkZcdTRFRTNcdTRGMUFcdThCREQgc3RvcmUgcHJvcHNcdUZGMDlcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZSgoKSA9PiBnZXRQcmV2aWV3QnVzU3RhdGUoKSk7XG4gIHVzZUVmZmVjdChcbiAgICAoKSA9PiBzdWJzY3JpYmVQcmV2aWV3QnVzKCgpID0+IHNldFN0YXRlKGdldFByZXZpZXdCdXNTdGF0ZSgpKSksXG4gICAgW10sXG4gICk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgLy8gXHU1Mzc4XHU4RjdEXHU2NUY2XHU2RTA1XHU3NDA2XHVGRjFBXHU2RTA1XHU5NjY0XHU2MzAyXHU4RDc3XHU3Njg0IGNvcGllZCBcdTU5MERcdTRGNERcdTVCOUFcdTY1RjZcdTU2NjhcdUZGMENcdTVFNzZcdTY4MDdcdThCQjBcdTY3MkFcdTYzMDJcdThGN0RcdUZGMENcbiAgLy8gXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNldENvcGllZCh0cnVlKVx1RkYwOGNvcHkgXHU3Njg0IGF3YWl0IFx1NjcxRlx1OTVGNFx1NTM3OFx1OEY3RFx1RkYwOVx1NTcyOFx1NTM3OFx1OEY3RFx1NTQwRVx1ODlFNlx1NTNEMVx1MzAwMlxuICBjb25zdCBtb3VudGVkUmVmID0gdXNlUmVmKHRydWUpO1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIG1vdW50ZWRSZWYuY3VycmVudCA9IGZhbHNlO1xuICAgICAgaWYgKGNvcHlUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgY29uc3QgeyBzdGF0dXMsIHJlc3VsdCwgZXJyb3JLaW5kIH0gPSBzdGF0ZTtcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29weVRpbWVyUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuXG4gIGlmIChzdGF0dXMgPT09ICdpZGxlJykgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgdm9pZCBydW5PcHRpbWl6ZSh7IGdldENvbmZpZywgZ2V0TGFuZywgZ2V0RHJhZnQ6ICgpID0+IHJlYWRDb21wb3NlclRleHQoKSB9KTtcbiAgfTtcblxuICBjb25zdCByZXBsYWNlID0gKCkgPT4ge1xuICAgIHdyaXRlQ29tcG9zZXJUZXh0KHJlc3VsdCk7XG4gICAgY2xvc2VQcmV2aWV3KCk7XG4gIH07XG5cbiAgY29uc3QgY29weSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIHJldHVybjsgLy8gXHU5NzVFXHU1Qjg5XHU1MTY4XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4aHR0cCBcdTdCNDlcdUZGMDlcdUZGMUFcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjBDXHU0RkREXHU2MzAxXHU1M0VGXHU5MUNEXHU4QkQ1XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHJlc3VsdCk7XG4gICAgICBpZiAoIW1vdW50ZWRSZWYuY3VycmVudCkgcmV0dXJuOyAvLyBhd2FpdCBcdTY3MUZcdTk1RjRcdTdFQzRcdTRFRjZcdTVERjJcdTUzNzhcdThGN0RcdUZGMUFcdTRFMERcdTUxOEQgc2V0U3RhdGVcbiAgICAgIHNldENvcGllZCh0cnVlKTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkgY2xlYXJUaW1lb3V0KGNvcHlUaW1lclJlZi5jdXJyZW50KTtcbiAgICAgIGNvcHlUaW1lclJlZi5jdXJyZW50ID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBzZXRDb3BpZWQoZmFsc2UpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9LCAxMjAwKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTE5OVx1NTE2NVx1NTkzMVx1OEQyNVx1RkYxQVx1OTc1OVx1OUVEOFx1RkYwOFx1NEUwRFx1N0ZGQlx1OEY2QyBjb3BpZWRcdUZGMDlcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1oZWFkXCI+XG4gICAgICAgIDxzcGFuPnt0KCdjYXJkLnRpdGxlJyl9PC9zcGFuPlxuICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBjbG9zZVByZXZpZXcoKX0+XG4gICAgICAgICAgXHUyNzE1XG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtzdGF0dXMgPT09ICdndWlkZScgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS50aXRsZScpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPnt0KCdndWlkZS5kZXNjJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17KCkgPT4geyBjbG9zZVByZXZpZXcoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGNsb3NlUHJldmlldygpfT5cbiAgICAgICAgICAgICAge3QoJ2d1aWRlLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdvcHRpbWl6aW5nJyAmJiA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57dCgnY2FyZC5vcHRpbWl6aW5nJyl9PC9kaXY+fVxuXG4gICAgICB7c3RhdHVzID09PSAncHJldmlldycgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYm9keVwiPntyZXN1bHR9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmVwbGFjZX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJlcGxhY2UnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gdm9pZCBjb3B5KCl9PlxuICAgICAgICAgICAgICB7Y29waWVkID8gdCgnY2FyZC5jb3B5RG9uZScpIDogdCgnY2FyZC5jb3B5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnZXJyb3InICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWVyclwiPnt0KGVycm9yS2V5KGVycm9yS2luZCkpfTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JldHJ5fT5cbiAgICAgICAgICAgICAge3QoJ2NhcmQucmV0cnknKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gY2xvc2VQcmV2aWV3KCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSIsICIvKiogXHU4QkJFXHU3RjZFIFx1MjE5MiBHZW5lcmFsIFx1NTMzQVx1MzAwQ1Byb21wdCBcdTRGMThcdTUzMTZcdTMwMERcdThCQkVcdTdGNkVcdTg4NENcdUZGMUFcdTY4MDdcdTk4OThcdTY0NThcdTg5ODEgKyBcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IERFRkFVTFRTIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1TdGF0ZSwgU2V0dGluZ3NGb3JtVmFsdWVzIH0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcbmltcG9ydCB0eXBlIHsgU2V0dGluZ3NGb3JtQWN0aW9ucyB9IGZyb20gJy4vc2V0dGluZ3Mtc3RvcmUuanMnO1xuaW1wb3J0IHsgb25PcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUm93UHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFNldHRpbmdzRm9ybVN0YXRlKSA9PiBUKSA9PiBUO1xuICBhY3Rpb25zOiBTZXR0aW5nc0Zvcm1BY3Rpb25zO1xuICBnZXRDb25maWc6ICgpID0+IFByb21wdENvbmZpZztcbiAgc2F2ZUNvbmZpZzogKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzKSA9PiBQcm9taXNlPHZvaWQ+O1xuICByZXNldENvbmZpZzogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0RXBvY2g6ICgpID0+IG51bWJlcjtcbn1cblxuY29uc3QgQ1NTX0lEID0gJ2RzaC1wcm9tcHQtb3B0aW1pemVyL3NldHRpbmdzLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLm9wdGlTZXR0aW5ncyB7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgcGFkZGluZzogMTZweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDhweDtcbn1cbi5vcHRpU2V0dGluZ3NUaXRsZSB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDIycHg7XG59XG4ub3B0aVNldHRpbmdzSGludCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtdGVydGlhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzRm9ybSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG4ub3B0aVNldHRpbmdzRmllbGQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBnYXA6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NMYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtc2Vjb25kYXJ5KTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuLm9wdGlTZXR0aW5nc0lucHV0IHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tZHN3LWFsaWFzLWJvcmRlci1sMik7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLWxheWVyLTIpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBmb250LXNpemU6IDEzcHg7XG59XG4ub3B0aVNldHRpbmdzUm93IHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiA4cHg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG4ub3B0aVNldHRpbmdzQnRuIHtcbiAgYm9yZGVyOiAwO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDRweCAxMnB4O1xuICBmb250LXNpemU6IDEycHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTQpKTtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ucHJpbWFyeSB7XG4gIC8qIFx1NEUwRFx1NzUyOCAtLWRzdy1hbGlhcy1icmFuZC1wcmltYXJ5LWludmVydFx1RkYxQVx1NTE3Nlx1NTcyOFx1NjY5N1x1ODI3Mlx1NEUzQlx1OTg5OFx1NEUwQlx1NEYxQVx1ODlFM1x1Njc5MFx1NEUzQVx1NkRGMVx1ODI3MiBcdTIxOTIgXHU5RUQxXHU1RTk1XHU5RUQxXHU1QjU3XHVGRjA4XHU3NTI4XHU2MjM3XHU1QjlFXHU2RDRCXHVGRjA5XHVGRjFCXG4gICAgIFx1NzY3RFx1NUI1NyArIFx1NEUzQlx1OTg5OFx1NEUzQlx1ODI3Mlx1RkYwOFx1NUUyNlx1N0EzM1x1NUI5QSBmYWxsYmFja1x1RkYwOVx1NEZERFx1OEJDMVx1NEVGQlx1NEY1NVx1NEUzQlx1OTg5OFx1NEUwQlx1NTNFRlx1OEJGQiAqL1xuICBjb2xvcjogI2ZmZjtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMxNjc3ZmYpO1xufVxuLm9wdGlTZXR0aW5nc0VyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gU2V0dGluZ3NSb3cocHJvcHM6IFNldHRpbmdzUm93UHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBzYXZlQ29uZmlnLCByZXNldENvbmZpZywgZ2V0RXBvY2ggfSA9IHByb3BzO1xuICBjb25zdCBbZXhwYW5kZWQsIHNldEV4cGFuZGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3N1Ym1pdFJldmlzaW9uLCBzZXRTdWJtaXRSZXZpc2lvbl0gPSB1c2VTdGF0ZSgwKTtcblxuICBjb25zdCB2YWx1ZXMgPSB1c2VTdG9yZSgocykgPT4gcy52YWx1ZXMpO1xuICBjb25zdCBzYXZlZCA9IHVzZVN0b3JlKChzKSA9PiBzLnNhdmVkKTtcbiAgY29uc3QgZXJyb3IgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcik7XG4gIC8vIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkUgUlBDIFx1NTkzMVx1OEQyNVx1NjVGNlx1NjYzRVx1NzkzQVx1NzY4NFx1NTM5Rlx1NTlDQlx1OTUxOVx1OEJFRlx1RkYwOFx1NEUwRFx1NTE4RFx1OTc1OVx1OUVEOFx1NTkzMVx1OEQyNVx1RkYxQXNldHRpbmdzIFx1NTE5OVx1NTE2NVx1NTFGQVx1OTUxOVx1NUZDNVx1OTg3Qlx1OEJBOVx1NzUyOFx1NjIzN1x1NzcwQlx1NUY5N1x1NTIzMFx1RkYwOVxuICBjb25zdCBbcnBjRXJyb3IsIHNldFJwY0Vycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZygpO1xuICBjb25zdCBtb2RlbExhYmVsID0gY29uZmlnLm1vZGVsID8gY29uZmlnLm1vZGVsIDogJ1x1MjAxNCc7XG5cbiAgLy8gXHU5OTk2XHU2QjIxXHU2MzAyXHU4RjdEIC8gXHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU2NUY2XHU2MjhBXHU1RjUzXHU1MjREXHU5MTREXHU3RjZFXHU2NEFEXHU3OUNEXHU4RkRCXHU4ODY4XHU1MzU1XHUzMDAyXG4gIC8vIHNlZWQgXHU0RkVFXHU4QkEyXHU1M0Y3ID0gXHU2NzJDXHU1NzMwXHU2M0QwXHU0RUE0XHU1RThGXHU1M0Y3IHN1Ym1pdFJldmlzaW9uICsgY29uZmlnRXBvY2hcdUZGMDhcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMDlcdUZGMUFcbiAgLy8gIC0gXHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHVGRjA4XHU4REU4XHU2ODA3XHU3QjdFXHU5ODc1L1x1NTkxNlx1OTBFOFx1NTE5OVx1NTE2NSBcdTIxOTIgaW5kZXgudHMgcmVmcmVzaENvbmZpZyBcdTc2ODRcdTdFQUFcdTUxNDNcdTkwMTJcdTU4OUVcdUZGMDlcdTRFRTRcdTRGRUVcdThCQTJcdTUzRjdcdThEODVcdThGQzdcbiAgLy8gICAgc3RhdGUucmV2aXNpb25cdUZGMENcdTkxQ0RcdTY0QURcdTc5Q0RcdTc1MUZcdTY1NDhcdUZGMENcdTg4NjhcdTUzNTVcdThEREZcdTRFMEFcdTVGNTJcdTRFMDBcdTUzMTZcdTU0MEVcdTc2ODRcdTk1NUNcdTUwQ0ZcdUZGMUJcbiAgLy8gIC0gXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NURGMlx1OTAxQVx1OEZDNyBjb21taXQvc2VlZCBcdTUxOTlcdTUxNjVcdTMwMENcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTVGNTNcdTY1RjZcdTdFQUFcdTUxNDNcdTMwMERcdTc2ODRcdTRGRUVcdThCQTJcdTUzRjdcdUZGMENcdTdEMjdcdTYzQTVcdTc2ODRcdTY3MkNcdTZCMjFcdTY1NDhcdTVFOTRcbiAgLy8gICAgXHU1NkRFXHU4REQxXHVGRjA4XHU3RUFBXHU1MTQzXHU2NzJBXHU1M0Q4XHVGRjA5XHU0RkVFXHU4QkEyXHU1M0Y3XHU3NkY4XHU3QjQ5XHU4OEFCIHJlZHVjZXIgXHU2MjkxXHU1MjM2IFx1MjE5MiBcdTRGRERcdTRGNEZcdTc1MjhcdTYyMzdcdTUzOUZcdTU5Q0JcdThGOTNcdTUxNjVcdTRFMEVcdTMwMENcdTVERjJcdTRGRERcdTVCNThcdTMwMERcdTYzRDBcdTc5M0FcdUZGMUJcbiAgLy8gICAgXHU0RTBCXHU2QjIxXHU2NzJDXHU1NzMwXHU1MkE4XHU0RjVDXHVGRjA4ZWRpdC9jb21taXRcdUZGMDlcdTUxOERcdTYyOEEgc3RhdGUucmV2aXNpb24gXHU2MkFDXHU1MjMwXHU0RTBFXHU3RUFBXHU1MTQzXHU0RTAwXHU4MUY0XHUzMDAyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBjb25maWcuYmFzZVVybCwgYXBpS2V5OiBjb25maWcuYXBpS2V5LCBtb2RlbDogY29uZmlnLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIGdldEVwb2NoKCksXG4gICAgKTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcmVhY3QtaG9va3MvZXhoYXVzdGl2ZS1kZXBzXG4gIH0sIFtjb25maWcuYmFzZVVybCwgY29uZmlnLmFwaUtleSwgY29uZmlnLm1vZGVsLCBnZXRFcG9jaF0pO1xuXG4gIC8vIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1RkYwOFx1OTg4NFx1ODlDOFx1NTM2MVx1NjcyQVx1OTE0RFx1N0Y2RVx1NUYxNVx1NUJGQ1x1RkYwOVx1MjE5MiBcdTgxRUFcdTUyQThcdTVDNTVcdTVGMDBcdTg4NjhcdTUzNTVcbiAgdXNlRWZmZWN0KCgpID0+IG9uT3BlblNldHRpbmdzUmVxdWVzdCgoKSA9PiBzZXRFeHBhbmRlZCh0cnVlKSksIFtdKTtcblxuICBjb25zdCBoYW5kbGVTYXZlID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIGNvbnN0IGVycm9ycyA9IGFjdGlvbnMudmFsaWRhdGUodmFsdWVzKTtcbiAgICBpZiAoZXJyb3JzKSB7XG4gICAgICBhY3Rpb25zLmZhaWwoT2JqZWN0LnZhbHVlcyhlcnJvcnMpWzBdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHNhdmVDb25maWcodmFsdWVzKTtcbiAgICAgIHNldFN1Ym1pdFJldmlzaW9uKChyKSA9PiByICsgMSk7XG4gICAgICAvLyBcdTRFMEVcdTY1NDhcdTVFOTRcdTU2REVcdThERDFcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTY1QjBcdTY3MkNcdTU3MzBcdTVFOEZcdTUzRjcgKyBcdTdFQUFcdTUxNDNcdUZGMDlcdTVCRjlcdTlGNTBcdUZGMENcdTRGN0ZcdTRGRERcdTVCNThcdTU0MEVcdTc2ODRcdTkxQ0RcdTY0QURcdTc5Q0RcdTg4QUJcdTYyOTFcdTUyMzZcbiAgICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5zYXZlRmFpbGVkJyl9XHVGRjFBJHtvdXRlciBpbnN0YW5jZW9mIEVycm9yID8gb3V0ZXIubWVzc2FnZSA6IFN0cmluZyhvdXRlcil9YCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gYXN5bmMgKCkgPT4ge1xuICAgIHNldFJwY0Vycm9yKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCByZXNldENvbmZpZygpO1xuICAgICAgYWN0aW9ucy5zZWVkKFxuICAgICAgICB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfSxcbiAgICAgICAgc3VibWl0UmV2aXNpb24gKyAxICsgZ2V0RXBvY2goKSxcbiAgICAgICk7XG4gICAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIH0gY2F0Y2ggKG91dGVyKSB7XG4gICAgICBzZXRScGNFcnJvcihgJHt0KCdzZXR0aW5ncy5yZXNldEZhaWxlZCcpfVx1RkYxQSR7b3V0ZXIgaW5zdGFuY2VvZiBFcnJvciA/IG91dGVyLm1lc3NhZ2UgOiBTdHJpbmcob3V0ZXIpfWApO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KGNvbmZpZy5hcGlLZXkgPyAnY2FyZC5jb25maWd1cmVkLmhpbnQnIDogJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnKS5yZXBsYWNlKCd7bW9kZWx9JywgbW9kZWxMYWJlbCl9PC9zcGFuPn1cbiAgICAgIDwvZGl2PlxuICAgICAgeyFleHBhbmRlZCAmJiA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuY2xpY2tUb0VkaXQnKX08L2Rpdj59XG5cbiAgICAgIHtleHBhbmRlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRm9ybVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2Jhc2VVcmwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWFwaS1rZXlcIj57dCgnc2V0dGluZ3MuYXBpS2V5Jyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYXBpLWtleVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5hcGlLZXl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwic2stXHUyMDI2XCJcbiAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e0RFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7cnBjRXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3JwY0Vycm9yfTwvc3Bhbj59XG4gICAgICAgICAgICB7IXJwY0Vycm9yICYmIGVycm9yICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0VyclwiPnt0KGVycm9yKX08L3NwYW4+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5kZXNjJyl9PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1IHN0b3JlXHVGRjA4ZGVmaW5lU3RvcmUgXHU4NTg0XHU1QzAxXHU4OEM1XHVGRjA5XHVGRjFBXHU4MzQ5XHU3QTNGICsgXHU2ODIxXHU5QThDICsgXHU0RkREXHU1QjU4XHU1MkE4XHU0RjVDICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICByZWR1Y2VTZXR0aW5nc0Zvcm0sXG4gIHZhbGlkYXRlU2V0dGluZ3NGb3JtLFxuICB0eXBlIFNldHRpbmdzRm9ybVN0YXRlLFxuICB0eXBlIFNldHRpbmdzRm9ybVZhbHVlcyxcbn0gZnJvbSAnLi9zZXR0aW5ncy1mb3JtLXN0YXRlLmpzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1BY3Rpb25zIHtcbiAgc2VlZCh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcywgcmV2aXNpb246IG51bWJlcik6IHZvaWQ7XG4gIGVkaXQoZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gIGNvbW1pdChyZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZmFpbChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAvKiogXHU0RkREXHU1QjU4XHU1MjREXHU2ODIxXHU5QThDXHVGRjFCXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHU1QjU3XHU1MTc4XHVGRjFCXHU2NUUwXHU5NTE5XHU4QkVGXHU2NUY2XHU4RkQ0XHU1NkRFIG51bGwgKi9cbiAgdmFsaWRhdGUodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgbnVsbDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVNldHRpbmdzRm9ybVN0b3JlID0gKCk6IFNldHRpbmdzRm9ybVN0b3JlSGFuZGxlID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9PiAoe1xuICAgICAgLy8gXHU2QkNGXHU1QjlFXHU0RjhCXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9TRVRUSU5HU19GT1JNIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NUI5RVx1NEY4Qlx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFx1RkYwOHJlZHVjZXIgXHU3Njg0IGRyYWZ0IFx1NTE5OVx1NTE2NVx1OTcwMFx1NTNEN1x1NEZERFx1NjJBNFx1RkYwOVxuICAgICAgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLFxuICAgICAgdmFsdWVzOiB7IC4uLklOSVRJQUxfU0VUVElOR1NfRk9STS52YWx1ZXMgfSxcbiAgICB9KSxcbiAgICBhY3Rpb25zOiB7XG4gICAgICBzZWVkOiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdzZWVkJywgdmFsdWVzLCByZXZpc2lvbiB9KSksXG4gICAgICBlZGl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2VkaXQnLCBmaWVsZCwgdmFsdWUgfSkpLFxuICAgICAgY29tbWl0OiAoZDogU2V0dGluZ3NGb3JtU3RhdGUsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2NvbW1pdCcsIHJldmlzaW9uIH0pKSxcbiAgICAgIGZhaWw6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgbWVzc2FnZTogc3RyaW5nKSA9PlxuICAgICAgICBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVNldHRpbmdzRm9ybShkLCB7IHR5cGU6ICdmYWlsJywgbWVzc2FnZSB9KSksXG4gICAgICB2YWxpZGF0ZTogKF9kOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzKTtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGVycm9ycykubGVuZ3RoID09PSAwID8gbnVsbCA6IGVycm9ycztcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG4gIHJldHVybiBoYW5kbGUgYXMgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGU7XG59XG4iLCAiLyoqIFx1OEJCRVx1N0Y2RVx1ODg2OFx1NTM1NVx1NjgyMVx1OUE4QyBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU2NUUwIERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1WYWx1ZXMge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVTZXR0aW5nc0Zvcm0odmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgZXJyb3JzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG5cbiAgY29uc3QgdXJsID0gdmFsdWVzLmJhc2VVcmwudHJpbSgpO1xuICBpZiAoIXVybCkge1xuICAgIGVycm9ycy5iYXNlVXJsID0gJ3NldHRpbmdzLmJhc2VVcmwnO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1ID0gbmV3IFVSTCh1cmwpO1xuICAgICAgaWYgKHUucHJvdG9jb2wgIT09ICdodHRwczonICYmIHUucHJvdG9jb2wgIT09ICdodHRwOicpIHRocm93IG5ldyBFcnJvcigncHJvdG9jb2wnKTtcbiAgICAgIGlmICh1LnNlYXJjaCB8fCB1Lmhhc2gpIHRocm93IG5ldyBFcnJvcigncXVlcnktb3ItaGFzaCcpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gICAgfVxuICB9XG5cbiAgaWYgKCF2YWx1ZXMuYXBpS2V5LnRyaW0oKSkgZXJyb3JzLmFwaUtleSA9ICdzZXR0aW5ncy5hcGlLZXknO1xuICBpZiAoIXZhbHVlcy5tb2RlbC50cmltKCkpIGVycm9ycy5tb2RlbCA9ICdzZXR0aW5ncy5tb2RlbCc7XG5cbiAgcmV0dXJuIGVycm9ycztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzO1xuICBkaXJ0eTogYm9vbGVhbjtcbiAgc2F2ZWQ6IGJvb2xlYW47XG4gIGVycm9yOiBzdHJpbmcgfCBudWxsO1xuICByZXZpc2lvbjogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgSU5JVElBTF9TRVRUSU5HU19GT1JNOiBTZXR0aW5nc0Zvcm1TdGF0ZSA9IHtcbiAgdmFsdWVzOiB7IGJhc2VVcmw6ICcnLCBhcGlLZXk6ICcnLCBtb2RlbDogJycgfSxcbiAgZGlydHk6IGZhbHNlLFxuICBzYXZlZDogZmFsc2UsXG4gIGVycm9yOiBudWxsLFxuICByZXZpc2lvbjogLTEsXG59O1xuXG5leHBvcnQgdHlwZSBTZXR0aW5nc0Zvcm1BY3Rpb24gPVxuICB8IHsgdHlwZTogJ3NlZWQnOyB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlczsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZWRpdCc7IGZpZWxkOiBrZXlvZiBTZXR0aW5nc0Zvcm1WYWx1ZXM7IHZhbHVlOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2NvbW1pdCc7IHJldmlzaW9uOiBudW1iZXIgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBtZXNzYWdlOiBzdHJpbmcgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVNldHRpbmdzRm9ybShzdGF0ZTogU2V0dGluZ3NGb3JtU3RhdGUsIGFjdGlvbjogU2V0dGluZ3NGb3JtQWN0aW9uKTogU2V0dGluZ3NGb3JtU3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnc2VlZCc6XG4gICAgICByZXR1cm4gYWN0aW9uLnJldmlzaW9uIDw9IHN0YXRlLnJldmlzaW9uXG4gICAgICAgID8gc3RhdGVcbiAgICAgICAgOiB7IC4uLnN0YXRlLCB2YWx1ZXM6IHsgLi4uYWN0aW9uLnZhbHVlcyB9LCBkaXJ0eTogZmFsc2UsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwsIHJldmlzaW9uOiBhY3Rpb24ucmV2aXNpb24gfTtcbiAgICBjYXNlICdlZGl0JzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCB2YWx1ZXM6IHsgLi4uc3RhdGUudmFsdWVzLCBbYWN0aW9uLmZpZWxkXTogYWN0aW9uLnZhbHVlIH0sIGRpcnR5OiB0cnVlLCBzYXZlZDogZmFsc2UsIGVycm9yOiBudWxsIH07XG4gICAgY2FzZSAnY29tbWl0JzpcbiAgICAgIHJldHVybiB7IC4uLnN0YXRlLCBkaXJ0eTogZmFsc2UsIHNhdmVkOiB0cnVlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGVycm9yOiBhY3Rpb24ubWVzc2FnZSB9O1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7O0FDUU8sSUFBTSxXQUF5QjtBQUFBLEVBQ3BDLFNBQVM7QUFBQSxFQUNULFFBQVE7QUFBQSxFQUNSLE9BQU87QUFDVDtBQUlPLFNBQVMsaUJBQWlCLEtBQXFCO0FBQ3BELFNBQU8sSUFBSSxLQUFLLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFDdEM7QUFFTyxTQUFTLFlBQVksS0FBNkQ7QUFDdkYsUUFBTSxVQUFVLE9BQU8sS0FBSyxZQUFZLFlBQVksSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLFNBQVM7QUFDdkcsUUFBTSxTQUFTLE9BQU8sS0FBSyxXQUFXLFdBQVcsSUFBSSxTQUFTLFNBQVM7QUFDdkUsUUFBTSxRQUFRLE9BQU8sS0FBSyxVQUFVLFlBQVksSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxJQUFJLFNBQVM7QUFDL0YsU0FBTyxFQUFFLFNBQVMsaUJBQWlCLE9BQU8sR0FBRyxR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T0FBTyxFQUFFLFNBQVMsU0FBUyxTQUFTLFFBQVEsU0FBUyxRQUFRLE9BQU8sU0FBUyxNQUFNO0FBQUEsTUFDckYsQ0FBQztBQUNELHFCQUFlLFlBQVksS0FBMEM7QUFBQSxJQUN2RSxTQUFTLE9BQU87QUFDZCxZQUFNLElBQUksTUFBTSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLLENBQUM7QUFBQSxJQUN4RTtBQUFBLEVBQ0Y7QUFFQSxNQUFJLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxVQUFVO0FBQy9CLFVBQU0sTUFBTTtBQUFBLE1BQU87QUFBQSxNQUF5QixNQUMxQyxNQUFNLE1BQU07QUFBQSxRQUNWO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixJQUFJO0FBQUEsVUFDSixPQUFPO0FBQUEsVUFDUCxRQUFRO0FBQUEsVUFDUixPQUFPO0FBQUEsVUFDUCxRQUFRLE9BQU87QUFBQSxZQUNiLFdBQVcsTUFBTTtBQUFBLFlBQ2pCO0FBQUEsWUFDQTtBQUFBLFlBQ0EsVUFBVSxNQUFNO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRixDQUFDO0FBR0QsUUFBTSxZQUFZLENBQUMsTUFBcUI7QUFDdEMsUUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLFNBQVMsT0FBUTtBQUNwQyxVQUFNLEtBQUssU0FBUztBQUNwQixRQUFJLEVBQUUsY0FBYyxxQkFBc0I7QUFDMUMsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQjtBQUFBLEVBQ3RCO0FBQ0EsV0FBUyxpQkFBaUIsV0FBVyxTQUFTO0FBQ2hEOyIsCiAgIm5hbWVzIjogWyJzdGF0ZSIsICJSZWFjdCIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAic3RhdGUiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIiwgInN0YXRlIl0KfQo=

    return module.exports;
  }
});
