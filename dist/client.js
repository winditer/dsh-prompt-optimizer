window.__ModuleLoader__.load({
  id: "dsh-prompt-optimizer",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
function canTrigger(draft, busy) {
  return !busy && draft.trim().length > 0;
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
  "settings.clickToEdit": "Click to configure"
};
function langOf(active) {
  return typeof active === "string" && active.toLowerCase().startsWith("zh") ? "zh" : "en";
}

// src/optimizer-store.ts
var import_client = require("@deepseek-ai/dsh-client-runtime/client");

// src/preview-state.ts
var INITIAL_PREVIEW = {
  status: "idle",
  result: "",
  errorKind: null,
  generation: 0
};
function reducePreview(state, action) {
  switch (action.type) {
    case "begin":
      if (state.status === "optimizing") return state;
      return { ...state, status: "optimizing", errorKind: null, generation: state.generation + 1 };
    case "show":
      return state.status === "optimizing" ? { ...state, status: "preview", result: action.result } : state;
    case "fail":
      return state.status === "optimizing" ? { ...state, status: "error", errorKind: action.kind } : state;
    case "guide":
      return state.status === "optimizing" ? state : { ...state, status: "guide" };
    case "close":
      return INITIAL_PREVIEW;
    default:
      return state;
  }
}

// src/optimizer-store.ts
var activeController = null;
var createOptimizerStore = () => {
  const handle = (0, import_client.defineStore)({
    init: () => ({ ...INITIAL_PREVIEW }),
    // 每会话副本：INITIAL_PREVIEW 是只读共享常量，勿跨会话共享引用
    actions: {
      begin: (d) => {
        const next = reducePreview(d, { type: "begin" });
        if (next === d) return;
        Object.assign(d, next);
      },
      show: (d, result) => Object.assign(d, reducePreview(d, { type: "show", result })),
      fail: (d, kind) => Object.assign(d, reducePreview(d, { type: "fail", kind })),
      guide: (d) => Object.assign(d, reducePreview(d, { type: "guide" })),
      close: (d) => {
        if (d.status === "optimizing") {
          activeController?.abort();
          activeController = null;
        }
        return Object.assign(d, reducePreview(d, { type: "close" }));
      }
    }
  });
  return handle;
};
async function runOptimize(actions, ctx) {
  const config = ctx.getConfig();
  if (!checkConfig(config).ok) {
    actions.guide();
    return;
  }
  const draft = ctx.getDraft().trim();
  if (!draft) return;
  if (activeController !== null) return;
  actions.begin();
  const controller = new AbortController();
  activeController = controller;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const result = await optimize({ config, text: draft, lang: ctx.getLang(), signal: controller.signal });
    actions.show(result);
  } catch (e) {
    const isAbort = e instanceof DOMException && e.name === "AbortError" || typeof e?.name === "string" && e.name === "AbortError";
    if (isAbort) {
      if (timedOut) actions.fail("timeout");
      return;
    }
    actions.fail(toErrorKind(e).kind);
  } finally {
    if (activeController === controller) activeController = null;
    clearTimeout(timer);
  }
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
var import_react = require("react");
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
function OptimizeButton(props) {
  const { t, useInput, useStore, actions, getConfig, getLang } = props;
  const input = useInput();
  const status = useStore((s) => s.status);
  const busy = status === "optimizing";
  const disabled = !canTrigger(input.draft, busy);
  (0, import_react.useEffect)(() => injectCss(), []);
  const handleClick = (0, import_react.useCallback)(() => {
    if (disabled) return;
    void runOptimize(actions, {
      getConfig,
      getLang,
      getDraft: () => input.draft
    });
  }, [disabled, actions, getConfig, getLang, input.draft]);
  (0, import_react.useEffect)(() => onOptimizeRequest(handleClick), [handleClick]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: "dsh-po-btn",
      "aria-label": t("button.aria"),
      title: t("button.aria"),
      "aria-busy": busy,
      disabled,
      "data-busy": busy,
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
  color: var(--dsw-alias-brand-primary-invert, #fff);
  background: var(--dsw-alias-brand-primary, #1677ff);
}
`;
  document.head.appendChild(style);
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
  const { t, useInput, inputActions, useStore, actions, getConfig, getLang, openSettings } = props;
  (0, import_react2.useEffect)(() => injectCss2(), []);
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
  const input = useInput();
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const errorKind = useStore((s) => s.errorKind);
  const [copied, setCopied] = (0, import_react2.useState)(false);
  const copyTimerRef = (0, import_react2.useRef)(null);
  const mountedRef = (0, import_react2.useRef)(true);
  if (status === "idle") return null;
  const retry = () => {
    void runOptimize(actions, { getConfig, getLang, getDraft: () => input.draft });
  };
  const replace = () => {
    inputActions.setDraft(result);
    actions.close();
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
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => actions.close(), children: "\u2715" })
    ] }),
    status === "guide" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("guide.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("guide.desc") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: () => {
          actions.close();
          openSettings();
        }, children: t("guide.action") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => actions.close(), children: t("guide.dismiss") })
      ] })
    ] }),
    status === "optimizing" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: t("card.optimizing") }),
    status === "preview" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-body", children: result }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: replace, children: t("card.replace") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => void copy(), children: copied ? t("card.copyDone") : t("card.copy") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: retry, children: t("card.retry") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => actions.close(), children: t("card.dismiss") })
      ] })
    ] }),
    status === "error" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsh-po-card-err", children: t(errorKey(errorKind)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsh-po-card-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn primary", onClick: retry, children: t("card.retry") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsh-po-card-btn", onClick: () => actions.close(), children: t("card.dismiss") })
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
  const handleSave = () => {
    const errors = actions.validate(values);
    if (errors) {
      actions.fail(Object.values(errors)[0]);
      return;
    }
    saveConfig(values);
    setSubmitRevision((r) => r + 1);
    actions.commit(submitRevision + 1 + getEpoch());
  };
  const handleReset = () => {
    resetConfig();
    actions.seed(
      { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model },
      submitRevision + 1 + getEpoch()
    );
    setSubmitRevision((r) => r + 1);
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
        error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "optiSettingsErr", children: t(error) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "optiSettingsHint", children: t("settings.desc") })
    ] })
  ] });
}

// src/settings-store.ts
var import_client2 = require("@deepseek-ai/dsh-client-runtime/client");

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
function reduceSettingsForm(state, action) {
  switch (action.type) {
    case "seed":
      return action.revision <= state.revision ? state : { ...state, values: { ...action.values }, dirty: false, saved: false, error: null, revision: action.revision };
    case "edit":
      return { ...state, values: { ...state.values, [action.field]: action.value }, dirty: true, saved: false, error: null };
    case "commit":
      return { ...state, dirty: false, saved: true, error: null, revision: action.revision };
    case "fail":
      return { ...state, error: action.message };
  }
}

// src/settings-store.ts
var createSettingsFormStore = () => {
  const handle = (0, import_client2.defineStore)({
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

// src/settings-epoch.ts
function classifyRefresh(cur, pending) {
  if (pending === null) return "external";
  const converged = cur.baseUrl === pending.baseUrl && cur.apiKey === pending.apiKey && cur.model === pending.model;
  return converged ? "converged" : "in-progress";
}

// src/index.ts
var SETTINGS_NS = "prompt-optimizer";
var inject = ["slots", "sessions", "locale", "settingsScope"];
var optimizerStore = createOptimizerStore();
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "prompt-optimizer: locale registration");
  const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  let configMirror = mergeConfig(void 0);
  let configEpoch = 0;
  let pendingSelfBalance = null;
  function refreshConfig() {
    const cur = mergeConfig(settingsScope.getSnapshot()?.value);
    const kind = classifyRefresh(cur, pendingSelfBalance);
    if (kind === "converged") pendingSelfBalance = null;
    if (kind === "external") configEpoch += 1;
    configMirror = cur;
  }
  configMirror = mergeConfig(settingsScope.getSnapshot()?.value);
  ctx.effect(
    () => settingsScope.subscribe(() => refreshConfig()),
    "prompt-optimizer: settings subscription"
  );
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
          store: optimizerStore,
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
          store: optimizerStore,
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
  const saveConfig = (raw) => {
    const merged = mergeConfig({ ...configMirror, ...raw });
    const written = {
      baseUrl: merged.baseUrl,
      apiKey: merged.apiKey.trim(),
      model: merged.model
    };
    pendingSelfBalance = written;
    settingsScope.set("baseUrl", written.baseUrl);
    settingsScope.set("apiKey", written.apiKey);
    settingsScope.set("model", written.model);
  };
  const resetConfig = () => {
    pendingSelfBalance = { baseUrl: DEFAULTS.baseUrl, apiKey: DEFAULTS.apiKey, model: DEFAULTS.model };
    settingsScope.set("baseUrl", DEFAULTS.baseUrl);
    settingsScope.set("apiKey", DEFAULTS.apiKey);
    settingsScope.set("model", DEFAULTS.model);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvZXZlbnRzLnRzIiwgIi4uL3NyYy9PcHRpbWl6ZUJ1dHRvbi50c3giLCAiLi4vc3JjL1ByZXZpZXdDYXJkLnRzeCIsICIuLi9zcmMvU2V0dGluZ3NSb3cudHN4IiwgIi4uL3NyYy9zZXR0aW5ncy1zdG9yZS50cyIsICIuLi9zcmMvc2V0dGluZ3MtZm9ybS1zdGF0ZS50cyIsICIuLi9zcmMvc2V0dGluZ3MtZXBvY2gudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKiBkc2gtcHJvbXB0LW9wdGltaXplciBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyMDE0IGFwcGx5KGN0eCkgKi9cblxuaW1wb3J0IHR5cGUgeyBDbGllbnRDb250ZXh0IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBERUZBVUxUUywgbWVyZ2VDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBOUywgemgsIGVuLCBsYW5nT2YgfSBmcm9tICcuL2xvY2FsZXMuanMnO1xuaW1wb3J0IHsgY3JlYXRlT3B0aW1pemVyU3RvcmUsIHR5cGUgT3B0aW1pemVyQWN0aW9ucyB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB7IGVtaXRPcHRpbWl6ZVJlcXVlc3QsIGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0IHsgT3B0aW1pemVCdXR0b24gfSBmcm9tICcuL09wdGltaXplQnV0dG9uLnRzeCc7XG5pbXBvcnQgeyBQcmV2aWV3Q2FyZCB9IGZyb20gJy4vUHJldmlld0NhcmQudHN4JztcbmltcG9ydCB7IFNldHRpbmdzUm93IH0gZnJvbSAnLi9TZXR0aW5nc1Jvdy50c3gnO1xuaW1wb3J0IHsgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgfSBmcm9tICcuL3NldHRpbmdzLXN0b3JlLmpzJztcbmltcG9ydCB7IGNsYXNzaWZ5UmVmcmVzaCB9IGZyb20gJy4vc2V0dGluZ3MtZXBvY2guanMnO1xuXG4vKiogc2V0dGluZ3MgbmFtZXNwYWNlXHVGRjA4XHU0RTBFXHU2M0QyXHU0RUY2IGlkIFx1NEUwMFx1ODFGNFx1RkYwOSAqL1xuY29uc3QgU0VUVElOR1NfTlMgPSAncHJvbXB0LW9wdGltaXplcic7XG5cbi8qKlxuICogXHU1OEYwXHU2NjBFXHU2M0QyXHU0RUY2XHU0RjlEXHU4RDU2XHU3Njg0XHU1QkEyXHU2MjM3XHU3QUVGXHU2NzBEXHU1MkExXHVGRjA4Y29yZGlzIHNlcnZpY2Uga2V5c1x1RkYwOVx1RkYxQWFwcGx5IFx1NTE4NVx1N0VDRiBgY3R4LjxzZXJ2aWNlPmAgXHU4QkJGXHU5NUVFXHU3Njg0XHU2NzBEXHU1MkExXHU1RkM1XHU5ODdCXHU1NzI4XHU2QjY0XHU1OEYwXHU2NjBFXHUzMDAyXG4gKiBcdTUwM0NcdTk4N0JcdTRFM0FcdTY3MERcdTUyQTFcdTU0MERcdTgwMENcdTk3NUVcdTUzMDUgaWRcdTIwMTRcdTIwMTRcdTRFMEVcdTU0MENcdTVGNjJcdTYwMDFcdTUxNDhcdTRGOEJcdTRFMDBcdTgxRjRcdUZGMDhkc2gtbWVzc2FnZS1yYWlsOiBbXCJzbG90c1wiLFwic2Vzc2lvbnNcIl1cdUZGMUJcbiAqIGRzaC1iZXR0ZXItc2lkZWJhciBcdTRFQTZcdTU4RjBcdTY2MEUgbG9jYWxlXHVGRjA5XHVGRjFCXHU5NTE5XHU4QkVGXHU1OEYwXHU2NjBFXHU0RjFBXHU4QkE5IGZpYmVyIFx1NkMzOFx1NEU0NSBQRU5ESU5HXHVGRjBDXHU1NDJGXHU1MkE4XHU1QkExXHU4QkExXHU3NkY0XHU2M0E1XHU1MjI0XHU1OTMxXHU4RDI1XHUzMDAyXG4gKi9cbmV4cG9ydCBjb25zdCBpbmplY3QgPSBbJ3Nsb3RzJywgJ3Nlc3Npb25zJywgJ2xvY2FsZScsICdzZXR0aW5nc1Njb3BlJ107XG5cbi8qKiBcdTRGMUFcdThCRERcdTRGNUNcdTc1MjhcdTU3REYgbGlzdCBzbG90IFx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTYzMDlcdTk0QUVcdTRFMEVcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcdTUxNzFcdTRFQUIgcGVyLXNlc3Npb24gXHU1QjlFXHU0RjhCXHVGRjA5ICovXG5jb25zdCBvcHRpbWl6ZXJTdG9yZSA9IGNyZWF0ZU9wdGltaXplclN0b3JlKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseShjdHg6IENsaWVudENvbnRleHQpIHtcbiAgLy8gMS4gXHU2NTg3XHU2ODQ4XG4gIGN0eC5lZmZlY3QoKCkgPT4gY3R4LmxvY2FsZS5yZWdpc3RlcihOUywgeyB6aCwgZW4gfSksICdwcm9tcHQtb3B0aW1pemVyOiBsb2NhbGUgcmVnaXN0cmF0aW9uJyk7XG5cbiAgLy8gMi4gXHU5MTREXHU3RjZFXHU5NTVDXHU1MENGXHVGRjA4c2V0dGluZ3NTY29wZSBcdTRFM0FcdTU1MkZcdTRFMDBcdTRFOEJcdTVCOUVcdTZFOTBcdUZGMDlcbiAgY29uc3Qgc2V0dGluZ3NTY29wZSA9IGN0eC5zZXR0aW5nc1Njb3BlLmJpbmQoeyBuYW1lc3BhY2U6IFNFVFRJTkdTX05TIH0pO1xuICBsZXQgY29uZmlnTWlycm9yOiBQcm9tcHRDb25maWcgPSBtZXJnZUNvbmZpZyh1bmRlZmluZWQpO1xuICAvLyBcdTU5MTZcdTkwRThcdTkxNERcdTdGNkVcdTUzRDhcdTUzMTZcdTdFQUFcdTUxNDNcdUZGMUFcdTlBNzFcdTUyQThcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTVcdTc2ODQgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjdcdUZGMDhcdTg5QzEgU2V0dGluZ3NSb3dcdUZGMDlcdTIwMTRcdTIwMTRcdTg4NjhcdTUzNTUgc2VlZCBcdTRGRUVcdThCQTJcdTUzRjcgPSBcdTY3MkNcdTU3MzBcdTYzRDBcdTRFQTRcdTVFOEZcdTUzRjdcbiAgLy8gKyBjb25maWdFcG9jaFx1RkYxQmNvbmZpZ0Vwb2NoIFx1NEVDNVx1NTcyOFx1MzAwQ1x1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1MzAwRFx1RkYwOFx1OTc1RVx1ODFFQVx1OEVBQlx1NTE5OVx1NTZERVx1RkYwOVx1NjVGNlx1OTAxMlx1NTg5RVx1RkYwOFx1NUJCRlx1NEUzQlx1OTAxMFx1NUI1N1x1NkJCNVx1NTZERVx1NjYzRVx1N0VDRlx1NjUzNlx1NjU1Qlx1NTIyNFx1NUI5QVx1NjM5Mlx1OTY2NFx1RkYwOVx1MzAwMlxuICAvLyBcdTVERjJcdTc3RTVcdThGQjlcdTc1NENcdUZGMUFcdTgxRUFcdThFQUJcdTUxOTlcdTUxNjVcdTU2REVcdTU0MDhcdTRFMkRcdTUzRDFcdTc1MUZcdTc2ODRcdTU5MTZcdTkwRThcdTVCNTdcdTZCQjVcdTdGMTZcdThGOTFcdTUzRUZcdTgwRkRcdTg4QUJcdTU0MUVcdUZGMDhcdTU2REVcdTU0MDhcdTY1MzZcdTY1NUJcdTUyMjRcdTVCOUFcdTRFMERcdTUzMzlcdTkxNERcdUZGMDlcdUZGMENcdTRFMTQgcGVuZGluZyBcdTRGMUFcdTk0ODlcdTU3MjhcdTY1RTdcdTc2RUVcdTY4MDdcdTRFMEFcdUZGMENcbiAgLy8gXHU0RjdGXHU5NjhGXHU1NDBFXHU2MjQwXHU2NzA5XHU1OTE2XHU5MEU4XHU1M0Q4XHU1MzE2XHU5MEZEXHU1MjI0XHU0RTNBICdpbi1wcm9ncmVzcydcdUZGMDhlcG9jaCBcdTUxQkJcdTdFRDNcdUZGMDlcdTIwMTRcdTIwMTRcdTk1NUNcdTUwQ0ZcdTcxNjdcdTVFMzhcdTY2RjRcdTY1QjBcdUZGMENcdTRFMEJcdTZCMjFcdTgxRUFcdThFQUJcdTUxOTlcdTUxNjVcdUZGMDhcdTRGRERcdTVCNTgvXHU5MUNEXHU3RjZFXHVGRjA5XHU1MzczXHU4MUVBXHU2MTA4XHUzMDAyXG4gIGxldCBjb25maWdFcG9jaCA9IDA7XG4gIC8vIFx1ODFFQVx1OEVBQlx1NTE5OVx1NTE2NVx1NzY4NFx1NzZFRVx1NjgwN1x1RkYwOHBlbmRpbmcgXHU1RTczXHU4ODYxXHU2ODA3XHU4QkIwXHVGRjA5XHVGRjFBXHU0RkREXHU1QjU4L1x1OTFDRFx1N0Y2RVx1NjVGNlx1NTE0OFx1NEU4RSBzZXQgXHU3RjZFXHU0RTNBXHU1MTk5XHU1MTY1XHU3NkVFXHU2ODA3XHVGRjFCXHU1QkJGXHU0RTNCXHU5MDEwXHU1QjU3XHU2QkI1XHU1NkRFXHU2NjNFXHU2NTM2XHU2NTVCXG4gIC8vIFx1RkYwOGNsYXNzaWZ5UmVmcmVzaCBcdThGRDRcdTU2REUgJ2NvbnZlcmdlZCdcdUZGMENcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdTRFMEVcdTc2RUVcdTY4MDdcdTUxNjhcdTVCNTdcdTZCQjVcdTc2RjhcdTdCNDlcdUZGMDlcdTU0MEVcdTdGNkVcdTdBN0FcdTIwMTRcdTIwMTRcdTYzNkVcdTZCNjRcdTYyOEFcdTgxRUFcdThFQUJcdTUxOTlcdTUxNjVcdTc2ODRcdTU2REVcdTU4RjBcbiAgLy8gXHU0RTBFXHU3NzFGXHU2QjYzXHU3Njg0XHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU1MzNBXHU1MjA2XHU1RjAwXHVGRjBDXHU4MUVBXHU4RUFCXHU1MTk5XHU1MTY1XHU0RTBEXHU5MDEyXHU1ODlFIGNvbmZpZ0Vwb2NoXG4gIGxldCBwZW5kaW5nU2VsZkJhbGFuY2U6IFByb21wdENvbmZpZyB8IG51bGwgPSBudWxsO1xuICBmdW5jdGlvbiByZWZyZXNoQ29uZmlnKCk6IHZvaWQge1xuICAgIGNvbnN0IGN1ciA9IG1lcmdlQ29uZmlnKHNldHRpbmdzU2NvcGUuZ2V0U25hcHNob3QoKT8udmFsdWUpO1xuICAgIGNvbnN0IGtpbmQgPSBjbGFzc2lmeVJlZnJlc2goY3VyLCBwZW5kaW5nU2VsZkJhbGFuY2UpO1xuICAgIGlmIChraW5kID09PSAnY29udmVyZ2VkJykgcGVuZGluZ1NlbGZCYWxhbmNlID0gbnVsbDsgLy8gXHU2NTM2XHU2NTVCXHVGRjFBXHU2NzJDXHU4RjZFXHU1MTY4XHU5MEU4XHU1NkRFXHU2NjNFXHU1QjhDXHU2QkQ1XG4gICAgaWYgKGtpbmQgPT09ICdleHRlcm5hbCcpIGNvbmZpZ0Vwb2NoICs9IDE7XG4gICAgY29uZmlnTWlycm9yID0gY3VyO1xuICB9XG4gIC8vIFx1NTQyRlx1NTJBOFx1NzZGNFx1NjNBNVx1OEQ0Qlx1NTAzQ1x1RkYwOFx1NEUwRFx1OTAxMlx1NTg5RVx1N0VBQVx1NTE0M1x1RkYwOVx1RkYxQVx1NUJCRlx1NEUzQlx1NUYwMlx1NkI2NVx1NTIxRFx1NTlDQlx1NTJBMFx1OEY3RFx1NzY4NFx1NTZERVx1NjYzRSBcdTIxOTIgc3Vic2NyaWJlIFx1MjE5MiByZWZyZXNoQ29uZmlnIFx1NEYxQVx1OTAxMlx1NTg5RVx1NEUwMFx1NkIyMVx1RkYwQ1x1NUM1RVx1OTg4NFx1NjcxRlxuICBjb25maWdNaXJyb3IgPSBtZXJnZUNvbmZpZyhzZXR0aW5nc1Njb3BlLmdldFNuYXBzaG90KCk/LnZhbHVlKTtcbiAgY3R4LmVmZmVjdChcbiAgICAoKSA9PiBzZXR0aW5nc1Njb3BlLnN1YnNjcmliZSgoKSA9PiByZWZyZXNoQ29uZmlnKCkpLFxuICAgICdwcm9tcHQtb3B0aW1pemVyOiBzZXR0aW5ncyBzdWJzY3JpcHRpb24nLFxuICApO1xuXG4gIC8vIDMuIFx1OEJFRFx1OEEwMFx1OTU1Q1x1NTBDRlxuICBsZXQgbGFuZzogTGFuZyA9IGxhbmdPZihjdHgubG9jYWxlLmdldExvY2FsZSgpLmFjdGl2ZSk7XG4gIGN0eC5vbignbG9jYWxlL2NoYW5nZScsIChzbmFwOiB7IGFjdGl2ZTogc3RyaW5nIH0pID0+IHtcbiAgICBsYW5nID0gbGFuZ09mKHNuYXAuYWN0aXZlKTtcbiAgfSk7XG5cbiAgLy8gNC4gXHU0RjFBXHU4QkREXHU2OUZEXHU0RjREXHVGRjFBXHU2MzA5XHU5NEFFICsgXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XG4gIGN0eC5pbmplY3QoWydzbG90cycsICdzZXNzaW9ucyddLCAoc2NvcGUpID0+IHtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQucmlnaHQnLFxuICAgICAgICAgIGlkOiAncHJvbXB0LW9wdGltaXplci1idXR0b24nLFxuICAgICAgICAgIG9yZGVyOiAwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IG9wdGltaXplclN0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3B0aW1pemVCdXR0b24sXG4gICAgICApLFxuICAgICk7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsICgpID0+XG4gICAgICBzY29wZS5zbG90cy5yZWdpc3RlcihcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdjb252ZXJzYXRpb24uaW5wdXQub3ZlcmxheScsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWNhcmQnLFxuICAgICAgICAgIG9yZGVyOiAxMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIHN0b3JlOiBvcHRpbWl6ZXJTdG9yZSxcbiAgICAgICAgICBpbmplY3Q6ICgpID0+ICh7XG4gICAgICAgICAgICBnZXRDb25maWc6ICgpID0+IGNvbmZpZ01pcnJvcixcbiAgICAgICAgICAgIGdldExhbmc6ICgpID0+IGxhbmcsXG4gICAgICAgICAgICBvcGVuU2V0dGluZ3M6ICgpID0+IGVtaXRPcGVuU2V0dGluZ3NSZXF1ZXN0KCksXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFByZXZpZXdDYXJkLFxuICAgICAgKSxcbiAgICApO1xuICB9KTtcblxuICAvLyA2LiBcdThCQkVcdTdGNkVcdTg4NENcdUZGMDhyb290IFx1NEY1Q1x1NzUyOFx1NTdERlx1RkYwOVxuICBjb25zdCBzZXR0aW5nc1N0b3JlID0gY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUoKTtcbiAgY29uc3Qgc2F2ZUNvbmZpZyA9IChyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPikgPT4ge1xuICAgIGNvbnN0IG1lcmdlZCA9IG1lcmdlQ29uZmlnKHsgLi4uY29uZmlnTWlycm9yLCAuLi5yYXcgfSk7XG4gICAgY29uc3Qgd3JpdHRlbjogUHJvbXB0Q29uZmlnID0ge1xuICAgICAgYmFzZVVybDogbWVyZ2VkLmJhc2VVcmwsXG4gICAgICBhcGlLZXk6IG1lcmdlZC5hcGlLZXkudHJpbSgpLFxuICAgICAgbW9kZWw6IG1lcmdlZC5tb2RlbCxcbiAgICB9O1xuICAgIC8vIHBlbmRpbmcgXHU3RjZFXHU3NkVFXHU2ODA3XHVGRjA4XHU1MTQ4XHU0RThFIHNldFx1RkYxQlx1NzZFRVx1NjgwNz1cdTVCOUVcdTk2NDVcdTg0M0RcdTc2RDhcdTUwM0NcdUZGMENhcGlLZXkgXHU1REYyIHRyaW1cdUZGMDlcdUZGMUFzZXQgXHU0RTNBXHU1RjAyXHU2QjY1XHU5MDEwXHU1QjU3XHU2QkI1IFJQQ1x1RkYwQ1x1ODQzRFx1NzZEOFx1NTQwRVx1N0VDRlxuICAgIC8vIHNldHRpbmdzU2NvcGUuc3Vic2NyaWJlIFx1MjE5MiByZWZyZXNoQ29uZmlnIFx1NTZERVx1NjYzRVx1RkYxQlx1NTZERVx1NjYzRVx1NjUzNlx1NjU1Qlx1NTI0RFx1NEUwMFx1NUY4QiBjbGFzc2lmeVJlZnJlc2g9J2luLXByb2dyZXNzJ1x1RkYwQ1xuICAgIC8vIFx1NEUwRFx1OTAxMlx1NTg5RSBjb25maWdFcG9jaFx1MzAwMlx1NkNFOFx1NjEwRlx1RkYxQVx1NkI2NFx1NTkwNFx1NEUwRFx1OEMwM1x1NzUyOCByZWZyZXNoQ29uZmlnKClcdTIwMTRcdTIwMTRcdTU0MENcdTZCNjVcdThCRkJcdTUyMzBcdTc2ODRcdTRFQ0RcdTY2MkZcdTUxOTlcdTUxNjVcdTUyNERcdTc2ODRcdTY1RTdcdTVGRUJcdTcxNjdcdUZGMDhSUEMgXHU2NzJBXHU4NDNEXHU3NkQ4XHVGRjA5XHVGRjBDXG4gICAgLy8gXHU5NTVDXHU1MENGXHU2NkY0XHU2NUIwXHU3RURGXHU0RTAwXHU4RDcwIHN1YnNjcmliZSBcdTU2REVcdTU4RjBcdThERUZcdTVGODRcdTMwMDJcbiAgICBwZW5kaW5nU2VsZkJhbGFuY2UgPSB3cml0dGVuO1xuICAgIHNldHRpbmdzU2NvcGUuc2V0KCdiYXNlVXJsJywgd3JpdHRlbi5iYXNlVXJsKTtcbiAgICBzZXR0aW5nc1Njb3BlLnNldCgnYXBpS2V5Jywgd3JpdHRlbi5hcGlLZXkpO1xuICAgIHNldHRpbmdzU2NvcGUuc2V0KCdtb2RlbCcsIHdyaXR0ZW4ubW9kZWwpO1xuICB9O1xuICBjb25zdCByZXNldENvbmZpZyA9ICgpID0+IHtcbiAgICAvLyBwZW5kaW5nIFx1N0Y2RVx1NzZFRVx1NjgwN1x1RkYwOFx1NTE0OFx1NEU4RSBzZXRcdUZGMDlcdUZGMUFcdTYwNjJcdTU5MERcdTlFRDhcdThCQTRcdTUwM0NcdTc2ODRcdTkwMTBcdTVCNTdcdTZCQjVcdTU2REVcdTY2M0VcdTU0MENcdTY4MzdcdTYzMDlcdTY1MzZcdTY1NUJcdTUyMjRcdTVCOUFcdUZGMENcdTRFMERcdTkwMTJcdTU4OUUgY29uZmlnRXBvY2hcbiAgICBwZW5kaW5nU2VsZkJhbGFuY2UgPSB7IGJhc2VVcmw6IERFRkFVTFRTLmJhc2VVcmwsIGFwaUtleTogREVGQVVMVFMuYXBpS2V5LCBtb2RlbDogREVGQVVMVFMubW9kZWwgfTtcbiAgICBzZXR0aW5nc1Njb3BlLnNldCgnYmFzZVVybCcsIERFRkFVTFRTLmJhc2VVcmwpO1xuICAgIHNldHRpbmdzU2NvcGUuc2V0KCdhcGlLZXknLCBERUZBVUxUUy5hcGlLZXkpO1xuICAgIHNldHRpbmdzU2NvcGUuc2V0KCdtb2RlbCcsIERFRkFVTFRTLm1vZGVsKTtcbiAgfTtcblxuICBjdHguaW5qZWN0KFsnc2xvdHMnXSwgKHNjb3BlKSA9PiB7XG4gICAgc2NvcGUuc2xvdHMuaW5qZWN0KCdzZXR0aW5ncy5nZW5lcmFsLml0ZW0nLCAoKSA9PlxuICAgICAgc2NvcGUuc2xvdHMucmVnaXN0ZXIoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc2V0dGluZ3MuZ2VuZXJhbC5pdGVtJyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItc2V0dGluZ3MnLFxuICAgICAgICAgIG9yZGVyOiAzMCxcbiAgICAgICAgICBsb2NhbGU6IE5TLFxuICAgICAgICAgIHN0b3JlOiBzZXR0aW5nc1N0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgc2F2ZUNvbmZpZyxcbiAgICAgICAgICAgIHJlc2V0Q29uZmlnLFxuICAgICAgICAgICAgZ2V0RXBvY2g6ICgpID0+IGNvbmZpZ0Vwb2NoLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBTZXR0aW5nc1JvdyxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gNy4gXHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBQWx0K09cdUZGMDhcdTcxMjZcdTcwQjlcdTU3MjggdGV4dGFyZWEgXHU1MTg1XHU2NUY2XHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHVGRjA5XG4gIGNvbnN0IG9uS2V5ZG93biA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gICAgaWYgKCFlLmFsdEtleSB8fCBlLmNvZGUgIT09ICdLZXlPJykgcmV0dXJuO1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoIShlbCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVtaXRPcHRpbWl6ZVJlcXVlc3QoKTtcbiAgfTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5ZG93bik7XG59XG5cbi8vIFx1NUYxNVx1NzUyOFx1NUI4OFx1NTM2Qlx1RkYxQVx1OTA3Rlx1NTE0RCB0cmVlLXNoYWtlIFx1NjM4OVx1N0M3Qlx1NTc4Qlx1RkYwOFx1NEVDNVx1NjU4N1x1Njg2M1x1NjAyN1x1RkYxQlx1NjVFMFx1OEZEMFx1ODg0Q1x1NjVGNlx1ODg0Q1x1NEUzQVx1RkYwOVxuZXhwb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH07IiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2ODM4XHU1RkMzXHVGRjFBXHU5MTREXHU3RjZFXHU2ODIxXHU5QThDXHUzMDAxT3BlbkFJIFx1NTE3Q1x1NUJCOVx1OEMwM1x1NzUyOFx1MzAwMVx1N0VEM1x1Njc5Q1x1NjNEMFx1NTNENiBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU5NkY2IERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9tcHRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstY2hhdCcsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIGNvbnN0IG1vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIHJldHVybiB7IGJhc2VVcmw6IG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCksIGFwaUtleSwgbW9kZWwgfTtcbn1cblxuZXhwb3J0IHR5cGUgQ29uZmlnUHJvYmxlbSA9ICdtaXNzaW5nLWtleScgfCAnbWlzc2luZy1tb2RlbCcgfCAnYmFkLXVybCc7XG5leHBvcnQgdHlwZSBDb25maWdDaGVjayA9IHsgb2s6IHRydWU7IGNvbmZpZzogUHJvbXB0Q29uZmlnIH0gfCB7IG9rOiBmYWxzZTsgcmVhc29uOiBDb25maWdQcm9ibGVtIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZyhjb25maWc6IFByb21wdENvbmZpZyk6IENvbmZpZ0NoZWNrIHtcbiAgaWYgKCFjb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLWtleScgfTtcbiAgaWYgKCFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nKTogb2JqZWN0IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChsYW5nKSB9LFxuICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHRleHQgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICBzdHJlYW06IGZhbHNlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG4iLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTYzRDJcdTRFRjZcdTY1ODdcdTY4NDggXHUyMDE0IFx1NEUyRFx1ODJGMVx1NTNDQ1x1OEJFRCAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCBjb25zdCBOUyA9ICdwcm9tcHRfb3B0aW1pemVyJztcblxuZXhwb3J0IGNvbnN0IHpoID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnXHU0RjE4XHU1MzE2IHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ1x1NEYxOFx1NTMxNlx1N0VEM1x1Njc5QycsXG4gICdjYXJkLnJlcGxhY2UnOiAnXHU2NkZGXHU2MzYyXHU4MzQ5XHU3QTNGJyxcbiAgJ2NhcmQuY29weSc6ICdcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdcdTVERjJcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5yZXRyeSc6ICdcdTkxQ0RcdTY1QjBcdTRGMThcdTUzMTYnLFxuICAnY2FyZC5kaXNtaXNzJzogJ1x1NjUzRVx1NUYwMycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ1x1NURGMlx1OTE0RFx1N0Y2RSBcdTAwQjcgXHU2QTIxXHU1NzhCIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdcdTY3MkFcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ1x1OEJGN1x1NTE0OFx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUuZGVzYyc6ICdcdTUyNERcdTVGODAgXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTkwMUFcdTc1MjhcdThCQkVcdTdGNkUgXHUyMTkyIFByb21wdCBcdTRGMThcdTUzMTZcdUZGMENcdTU4NkJcdTUxOTlcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDBcdTMwMDFBUEkgS2V5IFx1NEUwRVx1NkEyMVx1NTc4Qlx1NTQwRFx1MzAwMicsXG4gICdndWlkZS5hY3Rpb24nOiAnXHU1M0JCXHU4QkJFXHU3RjZFJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnXHU3N0U1XHU5MDUzXHU0RTg2JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkgS2V5IFx1NjVFMFx1NjU0OFx1NjIxNlx1NURGMlx1OEZDN1x1NjcxRicsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnXHU2NzBEXHU1MkExXHU2MkQyXHU3RUREXHU4QkJGXHU5NUVFXHVGRjA4NDAzXHVGRjA5JyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnXHU4QkY3XHU2QzQyXHU4RDg1XHU2NUY2XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnXHU3RjUxXHU3RURDXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLmNvcnMnOiAnXHU2M0E1XHU1M0UzXHU0RTBEXHU2NTJGXHU2MzAxXHU4REU4XHU1N0RGXHVGRjBDXHU4QkY3XHU2MzYyXHU3NTI4XHU2NTJGXHU2MzAxIENPUlMgXHU3Njg0XHU3RjUxXHU1MTczJyxcbiAgJ2Vycm9yLmh0dHAnOiAnXHU4QkY3XHU2QzQyXHU1OTMxXHU4RDI1XHVGRjA4SFRUUCBcdTk1MTlcdThCRUZcdUZGMDknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NjgzQ1x1NUYwRlx1NUYwMlx1NUUzOCcsXG4gICdlcnJvci5lbXB0eSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTRFM0FcdTdBN0FcdUZGMENcdThCRjdcdTkxQ0RcdThCRDUnLFxuICAnZXJyb3IuY29uZmlnJzogJ1x1OTE0RFx1N0Y2RVx1NEUwRFx1NUI4Q1x1NjU3NFx1RkYwQ1x1OEJGN1x1NTIzMFx1OEJCRVx1N0Y2RVx1NEUyRFx1NjhDMFx1NjdFNScsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgXHU0RjE4XHU1MzE2JyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnXHU5MTREXHU3RjZFXHU2REE2XHU4MjcyXHU2M0E1XHU1M0UzXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVx1RkYxQktleSBcdTY2MEVcdTY1ODdcdTRGRERcdTVCNThcdTU3MjhcdTY3MkNcdTU3MzAnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnXHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3MuY2xpY2tUb0VkaXQnOiAnXHU3MEI5XHU1MUZCXHU5MTREXHU3RjZFJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBlbjogTG9jYWxlRGljdCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ09wdGltaXplIHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ09wdGltaXplZCBwcm9tcHQnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1VzZSBkcmFmdCcsXG4gICdjYXJkLmNvcHknOiAnQ29weScsXG4gICdjYXJkLmNvcHlEb25lJzogJ0NvcGllZCcsXG4gICdjYXJkLnJldHJ5JzogJ1JldHJ5JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdEaXNtaXNzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdPcHRpbWl6aW5nXHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ0NvbmZpZ3VyZWQgXHUwMEI3IG1vZGVsIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdObyBBUEkgY29uZmlndXJlZCcsXG4gICdndWlkZS50aXRsZSc6ICdDb25maWd1cmUgdGhlIEFQSSBmaXJzdCcsXG4gICdndWlkZS5kZXNjJzogJ0dvIHRvIFNldHRpbmdzIFx1MjE5MiBHZW5lcmFsIFx1MjE5MiBQcm9tcHQgT3B0aW1pemVyIGFuZCBmaWxsIGluIHRoZSBlbmRwb2ludCwgQVBJIGtleSwgYW5kIG1vZGVsLicsXG4gICdndWlkZS5hY3Rpb24nOiAnR28gdG8gc2V0dGluZ3MnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdHb3QgaXQnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBrZXkgaXMgaW52YWxpZCBvciBleHBpcmVkJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdBY2Nlc3MgZm9yYmlkZGVuICg0MDMpJyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnUmVxdWVzdCB0aW1lZCBvdXQ7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IubmV0d29yayc6ICdOZXR3b3JrIGVycm9yOyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLmNvcnMnOiAnRW5kcG9pbnQgYmxvY2tzIENPUlM7IHVzZSBhIGdhdGV3YXkgdGhhdCBhbGxvd3MgaXQnLFxuICAnZXJyb3IuaHR0cCc6ICdSZXF1ZXN0IGZhaWxlZCAoSFRUUCBlcnJvciknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgZm9ybWF0JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ0VtcHR5IHJlc3VsdDsgcGxlYXNlIHJldHJ5JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdJbmNvbXBsZXRlIGNvbmZpZ3VyYXRpb247IGNoZWNrIHNldHRpbmdzJyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBPcHRpbWl6ZXInLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdDb25maWd1cmUgdGhlIHJld3JpdGUgZW5kcG9pbnQgKE9wZW5BSS1jb21wYXRpYmxlKTsga2V5IGlzIHN0b3JlZCBsb2NhbGx5IGluIHBsYWluIHRleHQnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdCYXNlIFVSTCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdNb2RlbCcsXG4gICdzZXR0aW5ncy5zYXZlJzogJ1NhdmUnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnUmVzZXQgdG8gZGVmYXVsdHMnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnU2F2ZWQnLFxuICAnc2V0dGluZ3MuY2xpY2tUb0VkaXQnOiAnQ2xpY2sgdG8gY29uZmlndXJlJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIExvY2FsZUtleSA9IGtleW9mIHR5cGVvZiB6aDtcbmV4cG9ydCB0eXBlIExvY2FsZURpY3QgPSB7IFtLIGluIExvY2FsZUtleV06IHN0cmluZyB9O1xuXG4vKiogXHU2RkMwXHU2RDNCIGxvY2FsZSBcdTIxOTIgXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwXHVGRjA4emggXHU1MjREXHU3RjAwXHU1RjUyIHpoXHVGRjBDXHU1MTc2XHU0RjU5XHU1RjUyIGVuXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZ09mKGFjdGl2ZTogc3RyaW5nKTogTGFuZyB7XG4gIHJldHVybiB0eXBlb2YgYWN0aXZlID09PSAnc3RyaW5nJyAmJiBhY3RpdmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCd6aCcpID8gJ3poJyA6ICdlbic7XG59XG4iLCAiLyoqIFx1NEYxQVx1OEJERFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOSsgXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgcmVkdWNlUHJldmlldyxcbiAgSU5JVElBTF9QUkVWSUVXLFxuICB0eXBlIFByZXZpZXdTdGF0ZSxcbn0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZSxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplckFjdGlvbnMge1xuICAvKiogXHU4RkRCXHU1MTY1IG9wdGltaXppbmdcdTMwMDJcdTZDRThcdTYxMEZcdUZGMUFkZWZpbmVTdG9yZSBcdTc2ODRcdTUzMDVcdTg4QzVcdTRFMjJcdTVGMDMgbXV0YXRvciBcdThGRDRcdTU2REVcdTUwM0NcdUZGMDhcdThGRDBcdTg4NENcdTY1RjYgYGFjdGlvbnMuYmVnaW4oKWAgXHU0RTNBIHVuZGVmaW5lZFx1RkYwOVx1RkYwQ1xuICAgKiAgXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHU1QjlFXHU5NjQ1XHU3NTMxIHJ1bk9wdGltaXplIFx1NTE4NVx1NzY4NFx1NkEyMVx1NTc1N1x1N0VBNyBhY3RpdmVDb250cm9sbGVyIFx1NjI3Rlx1NjJDNVx1RkYwOFx1ODlDMSBydW5PcHRpbWl6ZVx1RkYwOVx1MzAwMiAqL1xuICBiZWdpbigpOiB2b2lkO1xuICBzaG93KHJlc3VsdDogc3RyaW5nKTogdm9pZDtcbiAgZmFpbChraW5kOiBPcHRpbWl6ZUVycm9yS2luZCk6IHZvaWQ7XG4gIGd1aWRlKCk6IHZvaWQ7XG4gIGNsb3NlKCk6IHZvaWQ7XG59XG5cbi8qKiBkZWZpbmVTdG9yZSBcdThGRDRcdTU2REVcdTc2ODQgc3RvcmUgXHU1M0U1XHU2N0M0XHVGRjA4XHU1NDBDXHU2NUY2XHU1M0VGXHU0RjVDXHU3QzdCXHU1NzhCXHU1MzYwXHU0RjREXHVGRjBDXHU0RjlCXHU2Q0U4XHU1MThDXHU2NUY2IGBzdG9yZTpgIFx1NEY3Rlx1NzUyOFx1RkYwOSAqL1xuZXhwb3J0IGludGVyZmFjZSBPcHRpbWl6ZXJTdG9yZUhhbmRsZSB7XG4gIC8vIFx1OEZEMFx1ODg0Q1x1NjVGNlx1NUY2Mlx1NzJCNlx1NzUzMSBEU0ggXHU2M0QwXHU0RjlCXHVGRjFCXHU2QjY0XHU1OTA0XHU0RUM1XHU0RTNBXHU2NTg3XHU2ODYzXHU2MDI3XHU3QzdCXHU1NzhCXG59XG5cbnR5cGUgQ3JlYXRlT3B0aW1pemVyU3RvcmUgPSAoKSA9PiBPcHRpbWl6ZXJTdG9yZUhhbmRsZTtcblxuLyoqXG4gKiBcdTVGNTNcdTUyNEQgaW4tZmxpZ2h0IFx1OEJGN1x1NkM0Mlx1NzY4NFx1NjNBN1x1NTIzNlx1NTY2OFx1RkYwOFx1NkEyMVx1NTc1N1x1N0VBN1x1RkYwOVx1RkYxQVxuICogLSBgY2xvc2UoKWAgXHU0RTJEXHU2QjYyXHU1QjgzXHVGRjBDXHU5NjMyXHU2QjYyXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XHVGRjFCXG4gKiAtIHJ1bk9wdGltaXplIFx1NEVFNVx1MzAwQ1x1NUI1OFx1NTcyOFx1NTcyOFx1OTAxNFx1NjNBN1x1NTIzNlx1NTY2OFx1MzAwRFx1NEUzQVx1NUU3Nlx1NTNEMVx1NjI4QVx1NTE3M1x1RkYwOFx1NTQwQ1x1NEUwMFx1NjVGNlx1NTIzQlx1NTNFQVx1NTE0MVx1OEJCOFx1NEUwMFx1NEUyQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1RkYwOVx1MzAwMlxuICogXHU2Q0U4XHVGRjFBXHU2QTIxXHU1NzU3XHU3RUE3XHU2MTBGXHU1NDczXHU3NzQwXHU1OTFBXHU0RjFBXHU4QkREXHU1NDBDXHU2NUY2XHU0RjE4XHU1MzE2XHU0RjFBXHU0RTkyXHU3NkY4XHU4QkE5XHU4REVGXHUyMDE0XHUyMDE0XHU4RjkzXHU1MTY1XHU2ODBGXHU1MzU1XHU0RjFBXHU4QkREXHU4MDVBXHU3MTI2XHU3Njg0XHU0RUE0XHU0RTkyXHU0RTBCXHU1M0VGXHU2M0E1XHU1M0Q3XHU2QjY0XHU3QjgwXHU1MzE2XHUzMDAyXG4gKi9cbmxldCBhY3RpdmVDb250cm9sbGVyOiBBYm9ydENvbnRyb2xsZXIgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU9wdGltaXplclN0b3JlOiBDcmVhdGVPcHRpbWl6ZXJTdG9yZSA9ICgpID0+IHtcbiAgY29uc3QgaGFuZGxlID0gZGVmaW5lU3RvcmUoe1xuICAgIGluaXQ6ICgpID0+ICh7IC4uLklOSVRJQUxfUFJFVklFVyB9KSwgLy8gXHU2QkNGXHU0RjFBXHU4QkREXHU1MjZGXHU2NzJDXHVGRjFBSU5JVElBTF9QUkVWSUVXIFx1NjYyRlx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYwQ1x1NTJGRlx1OERFOFx1NEYxQVx1OEJERFx1NTE3MVx1NEVBQlx1NUYxNVx1NzUyOFxuICAgIGFjdGlvbnM6IHtcbiAgICAgIGJlZ2luOiAoZDogUHJldmlld1N0YXRlKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSByZWR1Y2VQcmV2aWV3KGQsIHsgdHlwZTogJ2JlZ2luJyB9KTtcbiAgICAgICAgLy8gXHU1REYyXHU1NzI4IG9wdGltaXppbmcgXHU2NUY2IHJlZHVjZXIgXHU4RkQ0XHU1NkRFXHU1MzlGXHU1RjE1XHU3NTI4XHVGRjA4aW1tZXIgXHU1RjBGIG5vLW9wXHVGRjA5XHVGRjBDXHU4REYzXHU4RkM3XHU1MTk5XHU1NkRFXG4gICAgICAgIGlmIChuZXh0ID09PSBkKSByZXR1cm47XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgbmV4dCk7XG4gICAgICB9LFxuICAgICAgc2hvdzogKGQ6IFByZXZpZXdTdGF0ZSwgcmVzdWx0OiBzdHJpbmcpID0+IE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlUHJldmlldyhkLCB7IHR5cGU6ICdzaG93JywgcmVzdWx0IH0pKSxcbiAgICAgIGZhaWw6IChkOiBQcmV2aWV3U3RhdGUsIGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kKSA9PiBPYmplY3QuYXNzaWduKGQsIHJlZHVjZVByZXZpZXcoZCwgeyB0eXBlOiAnZmFpbCcsIGtpbmQgfSkpLFxuICAgICAgZ3VpZGU6IChkOiBQcmV2aWV3U3RhdGUpID0+IE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlUHJldmlldyhkLCB7IHR5cGU6ICdndWlkZScgfSkpLFxuICAgICAgY2xvc2U6IChkOiBQcmV2aWV3U3RhdGUpID0+IHtcbiAgICAgICAgLy8gXHU0RUM1XHU1RjUzXHU2NzJDIHN0b3JlIFx1NTkwNFx1NEU4RSBvcHRpbWl6aW5nIFx1NjVGNlx1NjI0RFx1NTNENlx1NkQ4OFx1NTcyOFx1OTAxNFx1OEJGN1x1NkM0Mlx1RkYxQVx1NkEyMVx1NTc1N1x1N0VBNyBhY3RpdmVDb250cm9sbGVyIFx1NUM1RVx1NEU4RVxuICAgICAgICAvLyBcdTZCNjNcdTU3MjhcdTRGMThcdTUzMTZcdTc2ODRcdTkwQTNcdTRFMkEgc3RvcmVcdUZGMDhcdTZBMjFcdTU3NTdcdTdFQTdcdTk1RThcdTk2MzJcdTZCNjJcdTdCMkNcdTRFOENcdTRFMkEgc3RvcmUgXHU4RkRCXHU1MTY1IGJlZ2luXHVGRjA5XHVGRjBDXHU1MTc2XHU0RUQ2XHU0RjFBXHU4QkREXHU1MTczXHU1MzYxXHU3MjQ3XHU0RTBEXHU1Rjk3XHU4QkVGXHU2NzQwXHUzMDAyXG4gICAgICAgIGlmIChkLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKSB7XG4gICAgICAgICAgYWN0aXZlQ29udHJvbGxlcj8uYWJvcnQoKTtcbiAgICAgICAgICBhY3RpdmVDb250cm9sbGVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VQcmV2aWV3KGQsIHsgdHlwZTogJ2Nsb3NlJyB9KSk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIE9wdGltaXplclN0b3JlSGFuZGxlO1xufTtcblxuLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5Mlx1RkYxQVx1OTE0RFx1N0Y2RVx1N0YzQVx1NTkzMSBcdTIxOTIgZ3VpZGVcdUZGMUJcdTgzNDlcdTdBM0ZcdTdBN0EgXHUyMTkyIFx1NzZGNFx1NjNBNVx1OEZENFx1NTZERVx1RkYxQlx1NUU3Nlx1NTNEMSBcdTIxOTIgXHU0RTIyXHU1RjAzXHVGRjFCXHU4RDg1XHU2NUY2L1x1NTNENlx1NkQ4OCBcdTIxOTIgdGltZW91dCBcdTYyMTZcdTk3NTlcdTlFRDggKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5PcHRpbWl6ZShcbiAgYWN0aW9uczogT3B0aW1pemVyQWN0aW9ucyxcbiAgY3R4OiB7IGdldENvbmZpZygpOiBQcm9tcHRDb25maWc7IGdldExhbmcoKTogTGFuZzsgZ2V0RHJhZnQoKTogc3RyaW5nIH0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICBhY3Rpb25zLmd1aWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBpZiAoIWRyYWZ0KSByZXR1cm47XG5cbiAgLy8gXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjFBXHU1REYyXHU2NzA5XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHU1MjE5XHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHUzMDAyXG4gIC8vIFx1NEUwRFx1ODBGRFx1NEY5RFx1OEQ1NiBhY3Rpb25zLmJlZ2luKCkgXHU3Njg0XHU4RkQ0XHU1NkRFXHU1MDNDXHUyMDE0XHUyMDE0ZGVmaW5lU3RvcmUgXHU1MkE4XHU0RjVDXHU1MzA1XHU4OEM1XHU1NjY4XHU0RTIyXHU1RjAzIG11dGF0b3IgXHU4RkQ0XHU1NkRFXHU1MDNDXHVGRjA4XHU2MDUyXHU0RTNBIHVuZGVmaW5lZFx1RkYwOVx1RkYxQlxuICAvLyBcdTdFQzRcdTRFRjZcdTVDNDJcdTc2ODRcdTYzMDlcdTk0QUUgYnVzeSBcdTYwMDFcdTVERjJcdTc5ODFcdTc1MjhcdTcwQjlcdTUxRkJcdUZGMENcdThGRDlcdTkxQ0NcdTY2MkZcdTVCRjlcdTVGRUJcdTYzNzdcdTk1MkUvXHU3QURFXHU2MDAxXHU4OUU2XHU1M0QxXHU3Njg0XHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHUzMDAyXG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSByZXR1cm47XG4gIGFjdGlvbnMuYmVnaW4oKTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlKClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplKHsgY29uZmlnLCB0ZXh0OiBkcmFmdCwgbGFuZzogY3R4LmdldExhbmcoKSwgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICBhY3Rpb25zLnNob3cocmVzdWx0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1NTE0OFx1NTIyNFx1NUI5QVx1NEUyRFx1NkI2Mlx1RkYxQVx1NzUyOFx1NjIzNy9cdTdFQzRcdTRFRjZcdTUzRDZcdTZEODhcdTRFMEVcdThEODVcdTY1RjZcdTkwRkRcdTg4NjhcdTczQjBcdTRFM0EgQWJvcnRFcnJvclx1RkYxQlx1NEVDNVx1OEQ4NVx1NjVGNlx1NTE5OVx1NTE2NVx1OTUxOVx1OEJFRlx1NjAwMVxuICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICBpZiAodGltZWRPdXQpIGFjdGlvbnMuZmFpbCgndGltZW91dCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhY3Rpb25zLmZhaWwodG9FcnJvcktpbmQoZSkua2luZCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn1cbiIsICIvKiogXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHU3MkI2XHU2MDAxXHU2NzNBIFx1MjAxNFx1MjAxNCBcdTdFQUYgcmVkdWNlclx1RkYwQ1x1NjVFMCBEU0ggXHU0RjlEXHU4RDU2ICovXG5cbmltcG9ydCB0eXBlIHsgT3B0aW1pemVFcnJvcktpbmQgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCB0eXBlIFByZXZpZXdTdGF0dXMgPSAnaWRsZScgfCAnb3B0aW1pemluZycgfCAncHJldmlldycgfCAnZXJyb3InIHwgJ2d1aWRlJztcblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3U3RhdGUge1xuICBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBlcnJvcktpbmQ6IE9wdGltaXplRXJyb3JLaW5kIHwgbnVsbDtcbiAgZ2VuZXJhdGlvbjogbnVtYmVyO1xufVxuXG4vKiogXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjFBcmVkdWNlciBcdTZDMzhcdTRFMERcdTUxOTlcdTU2REVcdTVCODNcdTYyMTZcdThGRDRcdTU2REVcdTUzRUZcdTUzRDhcdTc2ODRcdTY1QjBcdTVCRjlcdThDNjFcdUZGMUJcdTZEODhcdThEMzlcdTgwMDVcdUZGMDhUYXNrIDQgc3RvcmUgXHU4MEY2XHU2QzM0XHVGRjA5XHU1RkM1XHU5ODdCXHU0RUU1IHsgLi4uSU5JVElBTF9QUkVWSUVXIH0gXHU0RTNBXHU2QkNGXHU0RjFBXHU4QkREXHU3OUNEXHU1QjUwICovXG5leHBvcnQgY29uc3QgSU5JVElBTF9QUkVWSUVXOiBQcmV2aWV3U3RhdGUgPSB7XG4gIHN0YXR1czogJ2lkbGUnLFxuICByZXN1bHQ6ICcnLFxuICBlcnJvcktpbmQ6IG51bGwsXG4gIGdlbmVyYXRpb246IDAsXG59O1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3QWN0aW9uID1cbiAgfCB7IHR5cGU6ICdiZWdpbicgfVxuICB8IHsgdHlwZTogJ3Nob3cnOyByZXN1bHQ6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kIH1cbiAgfCB7IHR5cGU6ICdndWlkZScgfVxuICB8IHsgdHlwZTogJ2Nsb3NlJyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlUHJldmlldyhzdGF0ZTogUHJldmlld1N0YXRlLCBhY3Rpb246IFByZXZpZXdBY3Rpb24pOiBQcmV2aWV3U3RhdGUge1xuICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XG4gICAgY2FzZSAnYmVnaW4nOlxuICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnKSByZXR1cm4gc3RhdGU7XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgc3RhdHVzOiAnb3B0aW1pemluZycsIGVycm9yS2luZDogbnVsbCwgZ2VuZXJhdGlvbjogc3RhdGUuZ2VuZXJhdGlvbiArIDEgfTtcbiAgICBjYXNlICdzaG93JzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ3ByZXZpZXcnLCByZXN1bHQ6IGFjdGlvbi5yZXN1bHQgfVxuICAgICAgICA6IHN0YXRlO1xuICAgIGNhc2UgJ2ZhaWwnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnXG4gICAgICAgID8geyAuLi5zdGF0ZSwgc3RhdHVzOiAnZXJyb3InLCBlcnJvcktpbmQ6IGFjdGlvbi5raW5kIH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdndWlkZSc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZycgPyBzdGF0ZSA6IHsgLi4uc3RhdGUsIHN0YXR1czogJ2d1aWRlJyB9O1xuICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgIHJldHVybiBJTklUSUFMX1BSRVZJRVc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBzdGF0ZTtcbiAgfVxufVxuXG4vKiogXHU4QkExXHU1MjEyXHU4OUM0XHU1QjlBXHU3Njg0XHU1MTZDXHU1RjAwIEFQSVx1RkYwOFRhc2sgNCBcdThENzdcdTVCNThcdTU3MjhcdUZGMUJjYW5UcmlnZ2VyIFx1NzY4NCAhYnVzeSBcdTUzNEFcdThGQjlcdTYyN0ZcdTYyQzVcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTgwNENcdThEMjNcdUZGMENcdTUxNzZcdTRGNTlcdTRGRERcdTc1NTlcdTRFRTVcdTU5MDdcdTU0MEVcdTdFRURcdTZEODhcdThEMzlcdTgwMDVcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5PcHRpbWl6ZUZyb20oc3RhdHVzOiBQcmV2aWV3U3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGF0dXMgIT09ICdvcHRpbWl6aW5nJztcbn1cbiIsICIvKiogXHU2M0QyXHU0RUY2XHU1MTg1XHU5MEU4XHU0RThCXHU0RUY2XHU2MDNCXHU3RUJGXHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjFCXHU5MDdGXHU1MTREIGluZGV4IFx1MjE5NCBcdTdFQzRcdTRFRjZcdTVGQUFcdTczQUZcdTRGOURcdThENTZcdUZGMDlcdUZGMUFcbiAqICAtIG9wdGltaXplUmVxdWVzdFx1RkYxQVx1NUZFQlx1NjM3N1x1OTUyRSBBbHQrTyBcdTIxOTIgXHU0RjE4XHU1MzE2XHU2MzA5XHU5NEFFXHU4OUU2XHU1M0QxXG4gKiAgLSBvcGVuU2V0dGluZ3NSZXF1ZXN0XHVGRjFBXHU5ODg0XHU4OUM4XHU1MzYxXHUzMDBDXHU1M0JCXHU4QkJFXHU3RjZFXHUzMDBEXHUyMTkyIFx1OEJCRVx1N0Y2RVx1ODg0Q1x1ODFFQVx1NTJBOFx1NUM1NVx1NUYwMCAqL1xuXG5jb25zdCBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBvbk9wdGltaXplUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wdGltaXplUmVxdWVzdExpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wdGltaXplUmVxdWVzdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBmbiBvZiBvcHRpbWl6ZVJlcXVlc3RMaXN0ZW5lcnMpIGZuKCk7XG59XG5cbmNvbnN0IG9wZW5TZXR0aW5nc0xpc3RlbmVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uT3BlblNldHRpbmdzUmVxdWVzdChmbjogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQge1xuICBvcGVuU2V0dGluZ3NMaXN0ZW5lcnMuYWRkKGZuKTtcbiAgcmV0dXJuICgpID0+IG9wZW5TZXR0aW5nc0xpc3RlbmVycy5kZWxldGUoZm4pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdE9wZW5TZXR0aW5nc1JlcXVlc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgZm4gb2Ygb3BlblNldHRpbmdzTGlzdGVuZXJzKSBmbigpO1xufVxuIiwgIi8qKiBcdThGOTNcdTUxNjVcdTY4MEZcdTUzRjNcdTRGQTdcdTMwMENcdTRGMThcdTUzMTZcdTMwMERcdTYzMDlcdTk0QUUgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUNhbGxiYWNrLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGNhblRyaWdnZXIgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB0eXBlIHsgUHJldmlld1N0YXRlIH0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcbmltcG9ydCB7IG9uT3B0aW1pemVSZXF1ZXN0IH0gZnJvbSAnLi9ldmVudHMuanMnO1xuXG4vKiogXHU0RjFBXHU4QkREXHU2ODA3XHU1MUM2IGtpdCBcdTYzRDBcdTRGOUJcdTc2ODRcdTUzRUFcdThCRkJcdThGOTNcdTUxNjVcdTVGRUJcdTcxNjdcdUZGMDhpbnB1dCBob29rXHVGRjA5ICovXG5pbnRlcmZhY2UgSW5wdXRTbmFwc2hvdCB7XG4gIGRyYWZ0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW1pemVCdXR0b25Qcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICB1c2VJbnB1dDogKCkgPT4gSW5wdXRTbmFwc2hvdDtcbiAgdXNlU3RvcmU6IDxUPihzZWxlY3RvcjogKHM6IFByZXZpZXdTdGF0ZSkgPT4gVCkgPT4gVDtcbiAgYWN0aW9uczogT3B0aW1pemVyQWN0aW9ucztcbiAgZ2V0Q29uZmlnOiAoKSA9PiBQcm9tcHRDb25maWc7XG4gIGdldExhbmc6ICgpID0+IExhbmc7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9idXR0b24uY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4uZHNoLXBvLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgcGFkZGluZzogMnB4IDZweDtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMTtcbiAgb3BhY2l0eTogMC44NTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xufVxuLmRzaC1wby1idG46aG92ZXI6bm90KDpkaXNhYmxlZCkge1xuICBvcGFjaXR5OiAxO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xMikpO1xufVxuLmRzaC1wby1idG46ZGlzYWJsZWQge1xuICBvcGFjaXR5OiAwLjM1O1xuICBjdXJzb3I6IGRlZmF1bHQ7XG59XG5gO1xuICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIE9wdGltaXplQnV0dG9uKHByb3BzOiBPcHRpbWl6ZUJ1dHRvblByb3BzKSB7XG4gIGNvbnN0IHsgdCwgdXNlSW5wdXQsIHVzZVN0b3JlLCBhY3Rpb25zLCBnZXRDb25maWcsIGdldExhbmcgfSA9IHByb3BzO1xuXG4gIGNvbnN0IGlucHV0ID0gdXNlSW5wdXQoKTtcbiAgY29uc3Qgc3RhdHVzID0gdXNlU3RvcmUoKHMpID0+IHMuc3RhdHVzKTtcbiAgY29uc3QgYnVzeSA9IHN0YXR1cyA9PT0gJ29wdGltaXppbmcnO1xuICBjb25zdCBkaXNhYmxlZCA9ICFjYW5UcmlnZ2VyKGlucHV0LmRyYWZ0LCBidXN5KTtcblxuICAvLyBcdTUzNzhcdThGN0RcdTY1RjZcdTY1RTBcdTk3MDBcdTY2M0VcdTVGMEZcdTUzRDZcdTZEODhcdUZGMUFcdThCRjdcdTZDNDJcdTU3MjhcdTkwMTRcdTY1RjZcdTdFQzRcdTRFRjZcdTY4MTFcdTVERjJcdTRFMERcdTZFMzJcdTY3RDNcdUZGMUJcdTRGMUFcdThCRERcdTUyMDdcdTYzNjJcdTU0MEUgc3RvcmUgXHU1QjlFXHU0RjhCXHU5NjhGXG4gIC8vIFx1NEYxQVx1OEJERCBzY29wZSBcdTZFMDVcdTc0MDZcdUZGMDhcdTYyMTZcdTUxQkJcdTdFRDNcdUZGMDlcdUZGMENydW5PcHRpbWl6ZSBcdTc2ODRcdThGREZcdTUyMzBcdTUxOTlcdTUxNjVcdTY1RTBcdTRFQkFcdThCQTJcdTk2MDVcdUZGMENcdTY1RTBcdTUyNkZcdTRGNUNcdTc1MjhcdTMwMDJcbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKGRpc2FibGVkKSByZXR1cm47XG4gICAgdm9pZCBydW5PcHRpbWl6ZShhY3Rpb25zLCB7XG4gICAgICBnZXRDb25maWcsXG4gICAgICBnZXRMYW5nLFxuICAgICAgZ2V0RHJhZnQ6ICgpID0+IGlucHV0LmRyYWZ0LFxuICAgIH0pO1xuICB9LCBbZGlzYWJsZWQsIGFjdGlvbnMsIGdldENvbmZpZywgZ2V0TGFuZywgaW5wdXQuZHJhZnRdKTtcblxuICAvLyBBbHQrTyBcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMDhpbmRleC50cyBcdTUxNjhcdTVDNDBcdTc2RDFcdTU0MkNcdUZGMDlcdTIxOTIgXHU3QjQ5XHU2NTQ4XHU3MEI5XHU1MUZCXHU2MzA5XHU5NEFFXHVGRjFCXG4gIC8vIGhhbmRsZUNsaWNrIFx1OTY4Rlx1NEY5RFx1OEQ1Nlx1NTNEOFx1NTMxNlx1OTFDRFx1NUVGQVx1RkYwQ1x1OEJBMlx1OTYwNVx1NTlDQlx1N0VDOFx1NjMwN1x1NTQxMVx1NjcwMFx1NjVCMFx1OTVFRFx1NTMwNVx1RkYwOFx1NTQyQlx1NjcwMFx1NjVCMCBkcmFmdC9kaXNhYmxlZFx1RkYwOVx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4gb25PcHRpbWl6ZVJlcXVlc3QoaGFuZGxlQ2xpY2spLCBbaGFuZGxlQ2xpY2tdKTtcblxuICByZXR1cm4gKFxuICAgIDxidXR0b25cbiAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgY2xhc3NOYW1lPVwiZHNoLXBvLWJ0blwiXG4gICAgICBhcmlhLWxhYmVsPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgdGl0bGU9e3QoJ2J1dHRvbi5hcmlhJyl9XG4gICAgICBhcmlhLWJ1c3k9e2J1c3l9XG4gICAgICBkaXNhYmxlZD17ZGlzYWJsZWR9XG4gICAgICBkYXRhLWJ1c3k9e2J1c3l9XG4gICAgICBvbkNsaWNrPXtoYW5kbGVDbGlja31cbiAgICA+XG4gICAgICB7YnVzeSA/ICdcdTIzRjMnIDogJ1x1MjcyOCd9XG4gICAgPC9idXR0b24+XG4gICk7XG59XG4iLCAiLyoqIFx1OEY5M1x1NTE2NVx1NTMzQVx1NkQ2RVx1NUM0Mlx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1RkYxQWd1aWRlIC8gb3B0aW1pemluZyAvIHByZXZpZXcgLyBlcnJvciBcdTU2REJcdTc5Q0RcdTUxODVcdTVCQjlcdTYwMDEgKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCwgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFByZXZpZXdTdGF0ZSB9IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NjNEMFx1NEY5Qlx1NzY4NFx1OEY5M1x1NTE2NSBhY3Rpb24gXHU5NzYyICovXG5pbnRlcmZhY2UgSW5wdXRBY3Rpb25zIHtcbiAgc2V0RHJhZnQodGV4dDogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHVzZUlucHV0OiAoKSA9PiB7IGRyYWZ0OiBzdHJpbmcgfTtcbiAgaW5wdXRBY3Rpb25zOiBJbnB1dEFjdGlvbnM7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBQcmV2aWV3U3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IE9wdGltaXplckFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnktaW52ZXJ0LCAjZmZmKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMxNjc3ZmYpO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbmZ1bmN0aW9uIGVycm9yS2V5KGtpbmQ6IFByZXZpZXdTdGF0ZVsnZXJyb3JLaW5kJ10pOiBzdHJpbmcge1xuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAvLyBraW5kIFx1MjE5MiBsb2NhbGUga2V5XHVGRjFCJ2NvbmZpZycgXHU1NzI4IFVJIFx1NEUwQVx1NEUwRFx1NTNFRlx1OEZCRVx1RkYwOHJ1bk9wdGltaXplIFx1NTE0OFx1OEQ3MCBndWlkZVx1RkYwOVx1RkYwQ0Fib3J0RXJyb3JcdTIxOTJ0aW1lb3V0IFx1NzUzMSBydW5PcHRpbWl6ZSBcdTUxNDhcdTg4NENcdTYyRTZcdTYyMkFcdUZGMENcdTRGRERcdTc1NTlcdTUzQ0NcdTRGRERcdTk2NjlcbiAgICBjYXNlICd1bmF1dGhvcml6ZWQnOiBjYXNlICdmb3JiaWRkZW4nOiBjYXNlICd0aW1lb3V0JzogY2FzZSAnbmV0d29yayc6IGNhc2UgJ2NvcnMnOiBjYXNlICdodHRwJzogY2FzZSAnYmFkLXJlc3BvbnNlJzogY2FzZSAnZW1wdHknOiBjYXNlICdjb25maWcnOlxuICAgICAgcmV0dXJuIGBlcnJvci4ke2tpbmR9YDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdlcnJvci5uZXR3b3JrJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gUHJldmlld0NhcmQocHJvcHM6IFByZXZpZXdDYXJkUHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VJbnB1dCwgaW5wdXRBY3Rpb25zLCB1c2VTdG9yZSwgYWN0aW9ucywgZ2V0Q29uZmlnLCBnZXRMYW5nLCBvcGVuU2V0dGluZ3MgfSA9IHByb3BzO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiBpbmplY3RDc3MoKSwgW10pO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NkUwNVx1NzQwNlx1RkYxQVx1NkUwNVx1OTY2NFx1NjMwMlx1OEQ3N1x1NzY4NCBjb3BpZWQgXHU1OTBEXHU0RjREXHU1QjlBXHU2NUY2XHU1NjY4XHVGRjBDXHU1RTc2XHU2ODA3XHU4QkIwXHU2NzJBXHU2MzAyXHU4RjdEXHVGRjBDXG4gIC8vIFx1OTYzMlx1NkI2Mlx1OEZERlx1NTIzMFx1NzY4NCBzZXRDb3BpZWQodHJ1ZSlcdUZGMDhjb3B5IFx1NzY4NCBhd2FpdCBcdTY3MUZcdTk1RjRcdTUzNzhcdThGN0RcdUZGMDlcdTU3MjhcdTUzNzhcdThGN0RcdTU0MEVcdTg5RTZcdTUzRDFcdTMwMDJcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSB0cnVlO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBtb3VudGVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcbiAgICAgIGlmIChjb3B5VGltZXJSZWYuY3VycmVudCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoY29weVRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGlucHV0ID0gdXNlSW5wdXQoKTtcbiAgY29uc3Qgc3RhdHVzID0gdXNlU3RvcmUoKHMpID0+IHMuc3RhdHVzKTtcbiAgY29uc3QgcmVzdWx0ID0gdXNlU3RvcmUoKHMpID0+IHMucmVzdWx0KTtcbiAgY29uc3QgZXJyb3JLaW5kID0gdXNlU3RvcmUoKHMpID0+IHMuZXJyb3JLaW5kKTtcbiAgY29uc3QgW2NvcGllZCwgc2V0Q29waWVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgY29weVRpbWVyUmVmID0gdXNlUmVmPG51bWJlciB8IG51bGw+KG51bGwpO1xuICBjb25zdCBtb3VudGVkUmVmID0gdXNlUmVmKHRydWUpO1xuXG4gIGlmIChzdGF0dXMgPT09ICdpZGxlJykgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgdm9pZCBydW5PcHRpbWl6ZShhY3Rpb25zLCB7IGdldENvbmZpZywgZ2V0TGFuZywgZ2V0RHJhZnQ6ICgpID0+IGlucHV0LmRyYWZ0IH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgaW5wdXRBY3Rpb25zLnNldERyYWZ0KHJlc3VsdCk7XG4gICAgYWN0aW9ucy5jbG9zZSgpO1xuICB9O1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFuYXZpZ2F0b3IuY2xpcGJvYXJkKSByZXR1cm47IC8vIFx1OTc1RVx1NUI4OVx1NTE2OFx1NEUwQVx1NEUwQlx1NjU4N1x1RkYwOGh0dHAgXHU3QjQ5XHVGRjA5XHVGRjFBXHU0RTBEXHU3RkZCXHU4RjZDIGNvcGllZFx1RkYwQ1x1NEZERFx1NjMwMVx1NTNFRlx1OTFDRFx1OEJENVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChyZXN1bHQpO1xuICAgICAgaWYgKCFtb3VudGVkUmVmLmN1cnJlbnQpIHJldHVybjsgLy8gYXdhaXQgXHU2NzFGXHU5NUY0XHU3RUM0XHU0RUY2XHU1REYyXHU1Mzc4XHU4RjdEXHVGRjFBXHU0RTBEXHU1MThEIHNldFN0YXRlXG4gICAgICBzZXRDb3BpZWQodHJ1ZSk7XG4gICAgICBpZiAoY29weVRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIGNsZWFyVGltZW91dChjb3B5VGltZXJSZWYuY3VycmVudCk7XG4gICAgICBjb3B5VGltZXJSZWYuY3VycmVudCA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgc2V0Q29waWVkKGZhbHNlKTtcbiAgICAgICAgY29weVRpbWVyUmVmLmN1cnJlbnQgPSBudWxsO1xuICAgICAgfSwgMTIwMCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBcdTUyNkFcdThEMzRcdTY3N0ZcdTUxOTlcdTUxNjVcdTU5MzFcdThEMjVcdUZGMUFcdTk3NTlcdTlFRDhcdUZGMDhcdTRFMERcdTdGRkJcdThGNkMgY29waWVkXHVGRjA5XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZFwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtaGVhZFwiPlxuICAgICAgICA8c3Bhbj57dCgnY2FyZC50aXRsZScpfTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gYWN0aW9ucy5jbG9zZSgpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGFjdGlvbnMuY2xvc2UoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGFjdGlvbnMuY2xvc2UoKX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnb3B0aW1pemluZycgJiYgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2NhcmQub3B0aW1pemluZycpfTwvZGl2Pn1cblxuICAgICAge3N0YXR1cyA9PT0gJ3ByZXZpZXcnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57cmVzdWx0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JlcGxhY2V9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXBsYWNlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weSgpfT5cbiAgICAgICAgICAgICAge2NvcGllZCA/IHQoJ2NhcmQuY29weURvbmUnKSA6IHQoJ2NhcmQuY29weScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGFjdGlvbnMuY2xvc2UoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyXCI+e3QoZXJyb3JLZXkoZXJyb3JLaW5kKSl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBhY3Rpb25zLmNsb3NlKCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkUgXHUyMTkyIEdlbmVyYWwgXHU1MzNBXHUzMDBDUHJvbXB0IFx1NEYxOFx1NTMxNlx1MzAwRFx1OEJCRVx1N0Y2RVx1ODg0Q1x1RkYxQVx1NjgwN1x1OTg5OFx1NjQ1OFx1ODk4MSArIFx1NUM1NVx1NUYwMFx1ODg2OFx1NTM1NSAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHsgREVGQVVMVFMgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzRm9ybVN0YXRlLCBTZXR0aW5nc0Zvcm1WYWx1ZXMgfSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuaW1wb3J0IHR5cGUgeyBTZXR0aW5nc0Zvcm1BY3Rpb25zIH0gZnJvbSAnLi9zZXR0aW5ncy1zdG9yZS5qcyc7XG5pbXBvcnQgeyBvbk9wZW5TZXR0aW5nc1JlcXVlc3QgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NSb3dQcm9wcyB7XG4gIHQ6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nO1xuICB1c2VTdG9yZTogPFQ+KHNlbGVjdG9yOiAoczogU2V0dGluZ3NGb3JtU3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IFNldHRpbmdzRm9ybUFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBzYXZlQ29uZmlnOiAodmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMpID0+IHZvaWQ7XG4gIHJlc2V0Q29uZmlnOiAoKSA9PiB2b2lkO1xuICBnZXRFcG9jaDogKCkgPT4gbnVtYmVyO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvc2V0dGluZ3MuY3NzJztcbmZ1bmN0aW9uIGluamVjdENzcygpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbZGF0YS1wbHVnaW4tY3NzPVwiJHtDU1NfSUR9XCJdYCkpIHJldHVybjtcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5kYXRhc2V0LnBsdWdpbkNzcyA9IENTU19JRDtcbiAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4ub3B0aVNldHRpbmdzIHtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWRzdy1hbGlhcy1ib3JkZXItbDIpO1xuICBwYWRkaW5nOiAxNnB4IDA7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLm9wdGlTZXR0aW5nc1RpdGxlIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1wcmltYXJ5KTtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBsaW5lLWhlaWdodDogMjJweDtcbn1cbi5vcHRpU2V0dGluZ3NIaW50IHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC10ZXJ0aWFyeSk7XG4gIGZvbnQtc2l6ZTogMTJweDtcbn1cbi5vcHRpU2V0dGluZ3NGb3JtIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiA4cHg7XG4gIG1hcmdpbi10b3A6IDRweDtcbn1cbi5vcHRpU2V0dGluZ3NGaWVsZCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogNHB4O1xufVxuLm9wdGlTZXR0aW5nc0xhYmVsIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnkpO1xuICBmb250LXNpemU6IDEycHg7XG59XG4ub3B0aVNldHRpbmdzSW5wdXQge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyKTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYmctbGF5ZXItMik7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSk7XG4gIHBhZGRpbmc6IDZweCA4cHg7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5vcHRpU2V0dGluZ3NSb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5vcHRpU2V0dGluZ3NCdG4ge1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgcGFkZGluZzogNHB4IDEycHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtaW50ZXJhY3RpdmUtYmctaG92ZXIsIHJnYmEoMTI4LDEyOCwxMjgsMC4xNCkpO1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWxhYmVsLXByaW1hcnkpO1xufVxuLm9wdGlTZXR0aW5nc0J0bi5wcmltYXJ5IHtcbiAgLyogXHU0RTBEXHU3NTI4IC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnktaW52ZXJ0XHVGRjFBXHU1MTc2XHU1NzI4XHU2Njk3XHU4MjcyXHU0RTNCXHU5ODk4XHU0RTBCXHU0RjFBXHU4OUUzXHU2NzkwXHU0RTNBXHU2REYxXHU4MjcyIFx1MjE5MiBcdTlFRDFcdTVFOTVcdTlFRDFcdTVCNTdcdUZGMDhcdTc1MjhcdTYyMzdcdTVCOUVcdTZENEJcdUZGMDlcdUZGMUJcbiAgICAgXHU3NjdEXHU1QjU3ICsgXHU0RTNCXHU5ODk4XHU0RTNCXHU4MjcyXHVGRjA4XHU1RTI2XHU3QTMzXHU1QjlBIGZhbGxiYWNrXHVGRjA5XHU0RkREXHU4QkMxXHU0RUZCXHU0RjU1XHU0RTNCXHU5ODk4XHU0RTBCXHU1M0VGXHU4QkZCICovXG4gIGNvbG9yOiAjZmZmO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1kc3ctYWxpYXMtYnJhbmQtcHJpbWFyeSwgIzE2NzdmZik7XG59XG4ub3B0aVNldHRpbmdzRXJyIHtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1zdGF0ZS1lcnJvci1wcmltYXJ5LCAjZDAzMDUwKTtcbiAgZm9udC1zaXplOiAxMnB4O1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBTZXR0aW5nc1Jvdyhwcm9wczogU2V0dGluZ3NSb3dQcm9wcykge1xuICBjb25zdCB7IHQsIHVzZVN0b3JlLCBhY3Rpb25zLCBnZXRDb25maWcsIHNhdmVDb25maWcsIHJlc2V0Q29uZmlnLCBnZXRFcG9jaCB9ID0gcHJvcHM7XG4gIGNvbnN0IFtleHBhbmRlZCwgc2V0RXhwYW5kZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc3VibWl0UmV2aXNpb24sIHNldFN1Ym1pdFJldmlzaW9uXSA9IHVzZVN0YXRlKDApO1xuXG4gIGNvbnN0IHZhbHVlcyA9IHVzZVN0b3JlKChzKSA9PiBzLnZhbHVlcyk7XG4gIGNvbnN0IHNhdmVkID0gdXNlU3RvcmUoKHMpID0+IHMuc2F2ZWQpO1xuICBjb25zdCBlcnJvciA9IHVzZVN0b3JlKChzKSA9PiBzLmVycm9yKTtcblxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoKTtcbiAgY29uc3QgbW9kZWxMYWJlbCA9IGNvbmZpZy5tb2RlbCA/IGNvbmZpZy5tb2RlbCA6ICdcdTIwMTQnO1xuXG4gIC8vIFx1OTk5Nlx1NkIyMVx1NjMwMlx1OEY3RCAvIFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1NjVGNlx1NjI4QVx1NUY1M1x1NTI0RFx1OTE0RFx1N0Y2RVx1NjRBRFx1NzlDRFx1OEZEQlx1ODg2OFx1NTM1NVx1MzAwMlxuICAvLyBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGNyA9IFx1NjcyQ1x1NTczMFx1NjNEMFx1NEVBNFx1NUU4Rlx1NTNGNyBzdWJtaXRSZXZpc2lvbiArIGNvbmZpZ0Vwb2NoXHVGRjA4XHU1OTE2XHU5MEU4XHU5MTREXHU3RjZFXHU1M0Q4XHU1MzE2XHU3RUFBXHU1MTQzXHVGRjA5XHVGRjFBXG4gIC8vICAtIFx1NTkxNlx1OTBFOFx1OTE0RFx1N0Y2RVx1NTNEOFx1NTMxNlx1RkYwOFx1OERFOFx1NjgwN1x1N0I3RVx1OTg3NS9cdTU5MTZcdTkwRThcdTUxOTlcdTUxNjUgXHUyMTkyIGluZGV4LnRzIHJlZnJlc2hDb25maWcgXHU3Njg0XHU3RUFBXHU1MTQzXHU5MDEyXHU1ODlFXHVGRjA5XHU0RUU0XHU0RkVFXHU4QkEyXHU1M0Y3XHU4RDg1XHU4RkM3XG4gIC8vICAgIHN0YXRlLnJldmlzaW9uXHVGRjBDXHU5MUNEXHU2NEFEXHU3OUNEXHU3NTFGXHU2NTQ4XHVGRjBDXHU4ODY4XHU1MzU1XHU4RERGXHU0RTBBXHU1RjUyXHU0RTAwXHU1MzE2XHU1NDBFXHU3Njg0XHU5NTVDXHU1MENGXHVGRjFCXG4gIC8vICAtIFx1NEZERFx1NUI1OC9cdTkxQ0RcdTdGNkVcdTVERjJcdTkwMUFcdThGQzcgY29tbWl0L3NlZWQgXHU1MTk5XHU1MTY1XHUzMDBDXHU2NUIwXHU2NzJDXHU1NzMwXHU1RThGXHU1M0Y3ICsgXHU1RjUzXHU2NUY2XHU3RUFBXHU1MTQzXHUzMDBEXHU3Njg0XHU0RkVFXHU4QkEyXHU1M0Y3XHVGRjBDXHU3RDI3XHU2M0E1XHU3Njg0XHU2NzJDXHU2QjIxXHU2NTQ4XHU1RTk0XG4gIC8vICAgIFx1NTZERVx1OEREMVx1RkYwOFx1N0VBQVx1NTE0M1x1NjcyQVx1NTNEOFx1RkYwOVx1NEZFRVx1OEJBMlx1NTNGN1x1NzZGOFx1N0I0OVx1ODhBQiByZWR1Y2VyIFx1NjI5MVx1NTIzNiBcdTIxOTIgXHU0RkREXHU0RjRGXHU3NTI4XHU2MjM3XHU1MzlGXHU1OUNCXHU4RjkzXHU1MTY1XHU0RTBFXHUzMDBDXHU1REYyXHU0RkREXHU1QjU4XHUzMDBEXHU2M0QwXHU3OTNBXHVGRjFCXG4gIC8vICAgIFx1NEUwQlx1NkIyMVx1NjcyQ1x1NTczMFx1NTJBOFx1NEY1Q1x1RkYwOGVkaXQvY29tbWl0XHVGRjA5XHU1MThEXHU2MjhBIHN0YXRlLnJldmlzaW9uIFx1NjJBQ1x1NTIzMFx1NEUwRVx1N0VBQVx1NTE0M1x1NEUwMFx1ODFGNFx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGFjdGlvbnMuc2VlZChcbiAgICAgIHsgYmFzZVVybDogY29uZmlnLmJhc2VVcmwsIGFwaUtleTogY29uZmlnLmFwaUtleSwgbW9kZWw6IGNvbmZpZy5tb2RlbCB9LFxuICAgICAgc3VibWl0UmV2aXNpb24gKyBnZXRFcG9jaCgpLFxuICAgICk7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHJlYWN0LWhvb2tzL2V4aGF1c3RpdmUtZGVwc1xuICB9LCBbY29uZmlnLmJhc2VVcmwsIGNvbmZpZy5hcGlLZXksIGNvbmZpZy5tb2RlbCwgZ2V0RXBvY2hdKTtcblxuICAvLyBcdTMwMENcdTUzQkJcdThCQkVcdTdGNkVcdTMwMERcdUZGMDhcdTk4ODRcdTg5QzhcdTUzNjFcdTY3MkFcdTkxNERcdTdGNkVcdTVGMTVcdTVCRkNcdUZGMDlcdTIxOTIgXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwXHU4ODY4XHU1MzU1XG4gIHVzZUVmZmVjdCgoKSA9PiBvbk9wZW5TZXR0aW5nc1JlcXVlc3QoKCkgPT4gc2V0RXhwYW5kZWQodHJ1ZSkpLCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlU2F2ZSA9ICgpID0+IHtcbiAgICBjb25zdCBlcnJvcnMgPSBhY3Rpb25zLnZhbGlkYXRlKHZhbHVlcyk7XG4gICAgaWYgKGVycm9ycykge1xuICAgICAgYWN0aW9ucy5mYWlsKE9iamVjdC52YWx1ZXMoZXJyb3JzKVswXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNhdmVDb25maWcodmFsdWVzKTtcbiAgICBzZXRTdWJtaXRSZXZpc2lvbigocikgPT4gciArIDEpO1xuICAgIC8vIFx1NEUwRVx1NjU0OFx1NUU5NFx1NTZERVx1OEREMVx1NzY4NCBzZWVkIFx1NEZFRVx1OEJBMlx1NTNGN1x1RkYwOFx1NjVCMFx1NjcyQ1x1NTczMFx1NUU4Rlx1NTNGNyArIFx1N0VBQVx1NTE0M1x1RkYwOVx1NUJGOVx1OUY1MFx1RkYwQ1x1NEY3Rlx1NEZERFx1NUI1OFx1NTQwRVx1NzY4NFx1OTFDRFx1NjRBRFx1NzlDRFx1ODhBQlx1NjI5MVx1NTIzNlxuICAgIGFjdGlvbnMuY29tbWl0KHN1Ym1pdFJldmlzaW9uICsgMSArIGdldEVwb2NoKCkpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlc2V0ID0gKCkgPT4ge1xuICAgIHJlc2V0Q29uZmlnKCk7XG4gICAgYWN0aW9ucy5zZWVkKFxuICAgICAgeyBiYXNlVXJsOiBERUZBVUxUUy5iYXNlVXJsLCBhcGlLZXk6IERFRkFVTFRTLmFwaUtleSwgbW9kZWw6IERFRkFVTFRTLm1vZGVsIH0sXG4gICAgICBzdWJtaXRSZXZpc2lvbiArIDEgKyBnZXRFcG9jaCgpLFxuICAgICk7XG4gICAgc2V0U3VibWl0UmV2aXNpb24oKHIpID0+IHIgKyAxKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc1RpdGxlXCIgb25DbGljaz17KCkgPT4gc2V0RXhwYW5kZWQoKHYpID0+ICF2KX0gc3R5bGU9e3sgY3Vyc29yOiAncG9pbnRlcicgfX0+XG4gICAgICAgIHt0KCdzZXR0aW5ncy50aXRsZScpfVxuICAgICAgICB7IWV4cGFuZGVkICYmIDxzcGFuIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj4gXHUwMEI3IHt0KGNvbmZpZy5hcGlLZXkgPyAnY2FyZC5jb25maWd1cmVkLmhpbnQnIDogJ2NhcmQudW5jb25maWd1cmVkLmhpbnQnKS5yZXBsYWNlKCd7bW9kZWx9JywgbW9kZWxMYWJlbCl9PC9zcGFuPn1cbiAgICAgIDwvZGl2PlxuICAgICAgeyFleHBhbmRlZCAmJiA8ZGl2IGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0hpbnRcIj57dCgnc2V0dGluZ3MuY2xpY2tUb0VkaXQnKX08L2Rpdj59XG5cbiAgICAgIHtleHBhbmRlZCAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRm9ybVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWJhc2UtdXJsXCI+e3QoJ3NldHRpbmdzLmJhc2VVcmwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1iYXNlLXVybFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5iYXNlVXJsfVxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17REVGQVVMVFMuYmFzZVVybH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2Jhc2VVcmwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRmllbGRcIj5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NMYWJlbFwiIGh0bWxGb3I9XCJvcHRpLWFwaS1rZXlcIj57dCgnc2V0dGluZ3MuYXBpS2V5Jyl9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICBpZD1cIm9wdGktYXBpLWtleVwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdHlwZT1cInBhc3N3b3JkXCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5hcGlLZXl9XG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwic2stXHUyMDI2XCJcbiAgICAgICAgICAgICAgYXV0b0NvbXBsZXRlPVwib2ZmXCJcbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBhY3Rpb25zLmVkaXQoJ2FwaUtleScsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NGaWVsZFwiPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0xhYmVsXCIgaHRtbEZvcj1cIm9wdGktbW9kZWxcIj57dCgnc2V0dGluZ3MubW9kZWwnKX08L2xhYmVsPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIGlkPVwib3B0aS1tb2RlbFwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cIm9wdGlTZXR0aW5nc0lucHV0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3ZhbHVlcy5tb2RlbH1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e0RFRkFVTFRTLm1vZGVsfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IGFjdGlvbnMuZWRpdCgnbW9kZWwnLCBlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzUm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG4gcHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNhdmV9PlxuICAgICAgICAgICAgICB7dCgnc2V0dGluZ3Muc2F2ZScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NCdG5cIiBvbkNsaWNrPXtoYW5kbGVSZXNldH0+XG4gICAgICAgICAgICAgIHt0KCdzZXR0aW5ncy5yZXNldCcpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICB7c2F2ZWQgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzSGludFwiPnt0KCdzZXR0aW5ncy5zYXZlZCcpfTwvc3Bhbj59XG4gICAgICAgICAgICB7ZXJyb3IgJiYgPHNwYW4gY2xhc3NOYW1lPVwib3B0aVNldHRpbmdzRXJyXCI+e3QoZXJyb3IpfTwvc3Bhbj59XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvcHRpU2V0dGluZ3NIaW50XCI+e3QoJ3NldHRpbmdzLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufVxuIiwgIi8qKiBcdThCQkVcdTdGNkVcdTg4NjhcdTUzNTUgc3RvcmVcdUZGMDhkZWZpbmVTdG9yZSBcdTg1ODRcdTVDMDFcdTg4QzVcdUZGMDlcdUZGMUFcdTgzNDlcdTdBM0YgKyBcdTY4MjFcdTlBOEMgKyBcdTRGRERcdTVCNThcdTUyQThcdTRGNUMgKi9cblxuaW1wb3J0IHsgZGVmaW5lU3RvcmUgfSBmcm9tICdAZGVlcHNlZWstYWkvZHNoLWNsaWVudC1ydW50aW1lL2NsaWVudCc7XG5pbXBvcnQge1xuICBJTklUSUFMX1NFVFRJTkdTX0ZPUk0sXG4gIHJlZHVjZVNldHRpbmdzRm9ybSxcbiAgdmFsaWRhdGVTZXR0aW5nc0Zvcm0sXG4gIHR5cGUgU2V0dGluZ3NGb3JtU3RhdGUsXG4gIHR5cGUgU2V0dGluZ3NGb3JtVmFsdWVzLFxufSBmcm9tICcuL3NldHRpbmdzLWZvcm0tc3RhdGUuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybUFjdGlvbnMge1xuICBzZWVkKHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzLCByZXZpc2lvbjogbnVtYmVyKTogdm9pZDtcbiAgZWRpdChmaWVsZDoga2V5b2YgU2V0dGluZ3NGb3JtVmFsdWVzLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgY29tbWl0KHJldmlzaW9uOiBudW1iZXIpOiB2b2lkO1xuICBmYWlsKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG4gIC8qKiBcdTRGRERcdTVCNThcdTUyNERcdTY4MjFcdTlBOENcdUZGMUJcdThGRDRcdTU2REVcdTk1MTlcdThCRUZcdTVCNTdcdTUxNzhcdUZGMUJcdTY1RTBcdTk1MTlcdThCRUZcdTY1RjZcdThGRDRcdTU2REUgbnVsbCAqL1xuICB2YWxpZGF0ZSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBudWxsO1xufVxuXG4vKiogZGVmaW5lU3RvcmUgXHU4RkQ0XHU1NkRFXHU3Njg0IHN0b3JlIFx1NTNFNVx1NjdDNFx1RkYwOFx1NTQwQ1x1NjVGNlx1NTNFRlx1NEY1Q1x1N0M3Qlx1NTc4Qlx1NTM2MFx1NEY0RFx1RkYwQ1x1NEY5Qlx1NkNFOFx1NTE4Q1x1NjVGNiBgc3RvcmU6YCBcdTRGN0ZcdTc1MjhcdUZGMDkgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGUge1xuICAvLyBcdThGRDBcdTg4NENcdTY1RjZcdTVGNjJcdTcyQjZcdTc1MzEgRFNIIFx1NjNEMFx1NEY5Qlx1RkYxQlx1NkI2NFx1NTkwNFx1NEVDNVx1NEUzQVx1NjU4N1x1Njg2M1x1NjAyN1x1N0M3Qlx1NTc4QlxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlU2V0dGluZ3NGb3JtU3RvcmUgPSAoKTogU2V0dGluZ3NGb3JtU3RvcmVIYW5kbGUgPT4ge1xuICBjb25zdCBoYW5kbGUgPSBkZWZpbmVTdG9yZSh7XG4gICAgaW5pdDogKCk6IFNldHRpbmdzRm9ybVN0YXRlID0+ICh7XG4gICAgICAvLyBcdTZCQ0ZcdTVCOUVcdTRGOEJcdTUyNkZcdTY3MkNcdUZGMUFJTklUSUFMX1NFVFRJTkdTX0ZPUk0gXHU2NjJGXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjBDXHU1MkZGXHU4REU4XHU1QjlFXHU0RjhCXHU1MTcxXHU0RUFCXHU1RjE1XHU3NTI4XHVGRjA4cmVkdWNlciBcdTc2ODQgZHJhZnQgXHU1MTk5XHU1MTY1XHU5NzAwXHU1M0Q3XHU0RkREXHU2MkE0XHVGRjA5XG4gICAgICAuLi5JTklUSUFMX1NFVFRJTkdTX0ZPUk0sXG4gICAgICB2YWx1ZXM6IHsgLi4uSU5JVElBTF9TRVRUSU5HU19GT1JNLnZhbHVlcyB9LFxuICAgIH0pLFxuICAgIGFjdGlvbnM6IHtcbiAgICAgIHNlZWQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXMsIHJldmlzaW9uOiBudW1iZXIpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ3NlZWQnLCB2YWx1ZXMsIHJldmlzaW9uIH0pKSxcbiAgICAgIGVkaXQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlcywgdmFsdWU6IHN0cmluZykgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnZWRpdCcsIGZpZWxkLCB2YWx1ZSB9KSksXG4gICAgICBjb21taXQ6IChkOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgcmV2aXNpb246IG51bWJlcikgPT5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VTZXR0aW5nc0Zvcm0oZCwgeyB0eXBlOiAnY29tbWl0JywgcmV2aXNpb24gfSkpLFxuICAgICAgZmFpbDogKGQ6IFNldHRpbmdzRm9ybVN0YXRlLCBtZXNzYWdlOiBzdHJpbmcpID0+XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlU2V0dGluZ3NGb3JtKGQsIHsgdHlwZTogJ2ZhaWwnLCBtZXNzYWdlIH0pKSxcbiAgICAgIHZhbGlkYXRlOiAoX2Q6IFNldHRpbmdzRm9ybVN0YXRlLCB2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcykgPT4ge1xuICAgICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXMpO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZXJyb3JzKS5sZW5ndGggPT09IDAgPyBudWxsIDogZXJyb3JzO1xuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIGhhbmRsZSBhcyBTZXR0aW5nc0Zvcm1TdG9yZUhhbmRsZTtcbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU4ODY4XHU1MzU1XHU2ODIxXHU5QThDIFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVZhbHVlcyB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgYXBpS2V5OiBzdHJpbmc7XG4gIG1vZGVsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNldHRpbmdzRm9ybSh2YWx1ZXM6IFNldHRpbmdzRm9ybVZhbHVlcyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBlcnJvcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcblxuICBjb25zdCB1cmwgPSB2YWx1ZXMuYmFzZVVybC50cmltKCk7XG4gIGlmICghdXJsKSB7XG4gICAgZXJyb3JzLmJhc2VVcmwgPSAnc2V0dGluZ3MuYmFzZVVybCc7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCk7XG4gICAgICBpZiAodS5wcm90b2NvbCAhPT0gJ2h0dHBzOicgJiYgdS5wcm90b2NvbCAhPT0gJ2h0dHA6JykgdGhyb3cgbmV3IEVycm9yKCdwcm90b2NvbCcpO1xuICAgICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMuYmFzZVVybCA9ICdzZXR0aW5ncy5iYXNlVXJsJztcbiAgICB9XG4gIH1cblxuICBpZiAoIXZhbHVlcy5hcGlLZXkudHJpbSgpKSBlcnJvcnMuYXBpS2V5ID0gJ3NldHRpbmdzLmFwaUtleSc7XG4gIGlmICghdmFsdWVzLm1vZGVsLnRyaW0oKSkgZXJyb3JzLm1vZGVsID0gJ3NldHRpbmdzLm1vZGVsJztcblxuICByZXR1cm4gZXJyb3JzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzRm9ybVN0YXRlIHtcbiAgdmFsdWVzOiBTZXR0aW5nc0Zvcm1WYWx1ZXM7XG4gIGRpcnR5OiBib29sZWFuO1xuICBzYXZlZDogYm9vbGVhbjtcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIHJldmlzaW9uOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBJTklUSUFMX1NFVFRJTkdTX0ZPUk06IFNldHRpbmdzRm9ybVN0YXRlID0ge1xuICB2YWx1ZXM6IHsgYmFzZVVybDogJycsIGFwaUtleTogJycsIG1vZGVsOiAnJyB9LFxuICBkaXJ0eTogZmFsc2UsXG4gIHNhdmVkOiBmYWxzZSxcbiAgZXJyb3I6IG51bGwsXG4gIHJldmlzaW9uOiAtMSxcbn07XG5cbmV4cG9ydCB0eXBlIFNldHRpbmdzRm9ybUFjdGlvbiA9XG4gIHwgeyB0eXBlOiAnc2VlZCc7IHZhbHVlczogU2V0dGluZ3NGb3JtVmFsdWVzOyByZXZpc2lvbjogbnVtYmVyIH1cbiAgfCB7IHR5cGU6ICdlZGl0JzsgZmllbGQ6IGtleW9mIFNldHRpbmdzRm9ybVZhbHVlczsgdmFsdWU6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnY29tbWl0JzsgcmV2aXNpb246IG51bWJlciB9XG4gIHwgeyB0eXBlOiAnZmFpbCc7IG1lc3NhZ2U6IHN0cmluZyB9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlU2V0dGluZ3NGb3JtKHN0YXRlOiBTZXR0aW5nc0Zvcm1TdGF0ZSwgYWN0aW9uOiBTZXR0aW5nc0Zvcm1BY3Rpb24pOiBTZXR0aW5nc0Zvcm1TdGF0ZSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdzZWVkJzpcbiAgICAgIHJldHVybiBhY3Rpb24ucmV2aXNpb24gPD0gc3RhdGUucmV2aXNpb25cbiAgICAgICAgPyBzdGF0ZVxuICAgICAgICA6IHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5hY3Rpb24udmFsdWVzIH0sIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IGZhbHNlLCBlcnJvcjogbnVsbCwgcmV2aXNpb246IGFjdGlvbi5yZXZpc2lvbiB9O1xuICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHZhbHVlczogeyAuLi5zdGF0ZS52YWx1ZXMsIFthY3Rpb24uZmllbGRdOiBhY3Rpb24udmFsdWUgfSwgZGlydHk6IHRydWUsIHNhdmVkOiBmYWxzZSwgZXJyb3I6IG51bGwgfTtcbiAgICBjYXNlICdjb21taXQnOlxuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIGRpcnR5OiBmYWxzZSwgc2F2ZWQ6IHRydWUsIGVycm9yOiBudWxsLCByZXZpc2lvbjogYWN0aW9uLnJldmlzaW9uIH07XG4gICAgY2FzZSAnZmFpbCc6XG4gICAgICByZXR1cm4geyAuLi5zdGF0ZSwgZXJyb3I6IGFjdGlvbi5tZXNzYWdlIH07XG4gIH1cbn1cbiIsICIvKiogXHU4QkJFXHU3RjZFXHU5NTVDXHU1MENGXHU1MjM3XHU2NUIwXHU1MjA2XHU3QzdCIFx1MjAxNFx1MjAxNCBcdTdFQUZcdTUxRkRcdTY1NzBcdUZGMUFcdTUzM0FcdTUyMDZcdTMwMENcdTgxRUFcdThFQUJcdTUxOTlcdTUxNjVcdTU2REVcdTY2M0VcdTY1MzZcdTY1NUIgLyBcdTU2REVcdTY2M0VcdThGREJcdTg4NENcdTRFMkQgLyBcdTU5MTZcdTkwRThcdTUzRDhcdTUzMTZcdTMwMEQgKi9cbmltcG9ydCB0eXBlIHsgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBSZWZyZXNoS2luZCA9ICdjb252ZXJnZWQnIHwgJ2luLXByb2dyZXNzJyB8ICdleHRlcm5hbCc7XG5cbi8qKiBcdTY1MzZcdTY1NUJcdTUyMjRcdTVCOUFcdUZGMUFcdTVGNTNcdTUyNERcdTVGRUJcdTcxNjdcdTRFMEVcdTMwMENcdTgxRUFcdThFQUJcdTUxOTlcdTUxNjVcdTc2RUVcdTY4MDdcdTMwMERcdTUxNjhcdTVCNTdcdTZCQjVcdTc2RjhcdTdCNDkgXHUyMTkyIFx1NjcyQ1x1OEY2RVx1NTZERVx1NjYzRVx1NUI4Q1x1NkJENVx1RkYxQnBlbmRpbmcgXHU0RTNBIG51bGwgXHUyMTkyIFx1NTkxNlx1OTBFOC9cdTVGMTVcdTVCRkNcdTUzRDhcdTUzMTYgKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeVJlZnJlc2goY3VyOiBQcm9tcHRDb25maWcsIHBlbmRpbmc6IFByb21wdENvbmZpZyB8IG51bGwpOiBSZWZyZXNoS2luZCB7XG4gIGlmIChwZW5kaW5nID09PSBudWxsKSByZXR1cm4gJ2V4dGVybmFsJztcbiAgY29uc3QgY29udmVyZ2VkID1cbiAgICBjdXIuYmFzZVVybCA9PT0gcGVuZGluZy5iYXNlVXJsICYmXG4gICAgY3VyLmFwaUtleSA9PT0gcGVuZGluZy5hcGlLZXkgJiZcbiAgICBjdXIubW9kZWwgPT09IHBlbmRpbmcubW9kZWw7XG4gIHJldHVybiBjb252ZXJnZWQgPyAnY29udmVyZ2VkJyA6ICdpbi1wcm9ncmVzcyc7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOzs7QUNRTyxJQUFNLFdBQXlCO0FBQUEsRUFDcEMsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUNUO0FBSU8sU0FBUyxpQkFBaUIsS0FBcUI7QUFDcEQsU0FBTyxJQUFJLEtBQUssRUFBRSxRQUFRLFFBQVEsRUFBRTtBQUN0QztBQUVPLFNBQVMsWUFBWSxLQUE2RDtBQUN2RixRQUFNLFVBQVUsT0FBTyxLQUFLLFlBQVksWUFBWSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksU0FBUztBQUN2RyxRQUFNLFNBQVMsT0FBTyxLQUFLLFdBQVcsV0FBVyxJQUFJLFNBQVMsU0FBUztBQUN2RSxRQUFNLFFBQVEsT0FBTyxLQUFLLFVBQVUsWUFBWSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksU0FBUztBQUMvRixTQUFPLEVBQUUsU0FBUyxpQkFBaUIsT0FBTyxHQUFHLFFBQVEsTUFBTTtBQUM3RDtBQUtPLFNBQVMsWUFBWSxRQUFtQztBQUM3RCxNQUFJLENBQUMsT0FBTyxPQUFPLEtBQUssRUFBRyxRQUFPLEVBQUUsSUFBSSxPQUFPLFFBQVEsY0FBYztBQUNyRSxNQUFJLENBQUMsT0FBTyxNQUFNLEtBQUssRUFBRyxRQUFPLEVBQUUsSUFBSSxPQUFPLFFBQVEsZ0JBQWdCO0FBQ3RFLE1BQUk7QUFDRixVQUFNLElBQUksSUFBSSxJQUFJLGlCQUFpQixPQUFPLE9BQU8sQ0FBQztBQUNsRCxRQUFJLEVBQUUsYUFBYSxZQUFZLEVBQUUsYUFBYSxRQUFTLE9BQU0sSUFBSSxNQUFNLFVBQVU7QUFDakYsUUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFNLE9BQU0sSUFBSSxNQUFNLGVBQWU7QUFBQSxFQUN6RCxRQUFRO0FBQ04sV0FB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LElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFHRCxRQUFNLGdCQUFnQix3QkFBd0I7QUFDOUMsUUFBTSxhQUFhLENBQUMsUUFBK0I7QUFDakQsVUFBTSxTQUFTLFlBQVksRUFBRSxHQUFHLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDdEQsVUFBTSxVQUF3QjtBQUFBLE1BQzVCLFNBQVMsT0FBTztBQUFBLE1BQ2hCLFFBQVEsT0FBTyxPQUFPLEtBQUs7QUFBQSxNQUMzQixPQUFPLE9BQU87QUFBQSxJQUNoQjtBQUtBLHlCQUFxQjtBQUNyQixrQkFBYyxJQUFJLFdBQVcsUUFBUSxPQUFPO0FBQzVDLGtCQUFjLElBQUksVUFBVSxRQUFRLE1BQU07QUFDMUMsa0JBQWMsSUFBSSxTQUFTLFFBQVEsS0FBSztBQUFBLEVBQzFDO0FBQ0EsUUFBTSxjQUFjLE1BQU07QUFFeEIseUJBQXFCLEVBQUUsU0FBUyxTQUFTLFNBQVMsUUFBUSxTQUFTLFFBQVEsT0FBTyxTQUFTLE1BQU07QUFDakcsa0JBQWMsSUFBSSxXQUFXLFNBQVMsT0FBTztBQUM3QyxrQkFBYyxJQUFJLFVBQVUsU0FBUyxNQUFNO0FBQzNDLGtCQUFjLElBQUksU0FBUyxTQUFTLEtBQUs7QUFBQSxFQUMzQztBQUVBLE1BQUksT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFDLFVBQVU7QUFDL0IsVUFBTSxNQUFNO0FBQUEsTUFBTztBQUFBLE1BQXlCLE1BQzFDLE1BQU0sTUFBTTtBQUFBLFFBQ1Y7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLElBQUk7QUFBQSxVQUNKLE9BQU87QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLE9BQU87QUFBQSxVQUNQLFFBQVEsT0FBTztBQUFBLFlBQ2IsV0FBVyxNQUFNO0FBQUEsWUFDakI7QUFBQSxZQUNBO0FBQUEsWUFDQSxVQUFVLE1BQU07QUFBQSxVQUNsQjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFHRCxRQUFNLFlBQVksQ0FBQyxNQUFxQjtBQUN0QyxRQUFJLENBQUMsRUFBRSxVQUFVLEVBQUUsU0FBUyxPQUFRO0FBQ3BDLFVBQU0sS0FBSyxTQUFTO0FBQ3BCLFFBQUksRUFBRSxjQUFjLHFCQUFzQjtBQUMxQyxNQUFFLGVBQWU7QUFDakIsd0JBQW9CO0FBQUEsRUFDdEI7QUFDQSxXQUFTLGlCQUFpQixXQUFXLFNBQVM7QUFDaEQ7IiwKICAibmFtZXMiOiBbImltcG9ydF9yZWFjdCIsICJpbXBvcnRfanN4X3J1bnRpbWUiLCAiQ1NTX0lEIiwgImluamVjdENzcyIsICJpbXBvcnRfcmVhY3QiLCAiaW1wb3J0X2pzeF9ydW50aW1lIiwgIkNTU19JRCIsICJpbmplY3RDc3MiLCAiaW1wb3J0X2NsaWVudCJdCn0K

    return module.exports;
  }
});
