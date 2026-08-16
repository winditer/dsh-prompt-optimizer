window.__ModuleLoader__.load({
  id: "prompt-optimizer",
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
  const { config, text, lang, signal: signal2 } = opts;
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
      signal: signal2
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
        if (next === d) return false;
        Object.assign(d, next);
        return true;
      },
      show: (d, result) => Object.assign(d, reducePreview(d, { type: "show", result })),
      fail: (d, kind) => Object.assign(d, reducePreview(d, { type: "fail", kind })),
      guide: (d) => Object.assign(d, reducePreview(d, { type: "guide" })),
      close: (d) => {
        activeController?.abort();
        activeController = null;
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
.dsh-po-btn[data-busy="true"]::before {
  content: "\u23F3";
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
  const handleClick = () => {
    if (disabled) return;
    void runOptimize(actions, {
      getConfig,
      getLang,
      getDraft: () => input.draft
    });
  };
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
    case "unauthorized":
    case "forbidden":
      return `error.${kind}`;
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
  const input = useInput();
  const status = useStore((s) => s.status);
  const result = useStore((s) => s.result);
  const errorKind = useStore((s) => s.errorKind);
  const [copied, setCopied] = (0, import_react2.useState)(false);
  if (status === "idle") return null;
  const retry = () => {
    void runOptimize(actions, { getConfig, getLang, getDraft: () => input.draft });
  };
  const replace = () => {
    inputActions.setDraft(result);
    actions.close();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
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

// src/index.ts
var SETTINGS_NS = "prompt-optimizer";
var inject = ["slots", "sessions", "locale", "settingsScope"];
var optimizerStore = createOptimizerStore();
var signalListeners = /* @__PURE__ */ new Set();
var signalValue = 0;
var signal = {
  getSnapshot: () => signalValue,
  subscribe: (fn) => {
    signalListeners.add(fn);
    return () => signalListeners.delete(fn);
  },
  set: (next) => {
    signalValue = next;
    for (const fn of signalListeners) fn();
  }
};
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "prompt-optimizer: locale registration");
  const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  let configMirror = mergeConfig(void 0);
  const refreshConfig = () => {
    configMirror = mergeConfig(settingsScope.getSnapshot().value);
  };
  refreshConfig();
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
            openSettings: () => signal.set(signal.getSnapshot() + 1)
          })
        },
        PreviewCard
      )
    );
  });
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9vcHRpbWl6ZXIudHMiLCAiLi4vc3JjL2xvY2FsZXMudHMiLCAiLi4vc3JjL29wdGltaXplci1zdG9yZS50cyIsICIuLi9zcmMvcHJldmlldy1zdGF0ZS50cyIsICIuLi9zcmMvT3B0aW1pemVCdXR0b24udHN4IiwgIi4uL3NyYy9QcmV2aWV3Q2FyZC50c3giXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKiBkc2gtcHJvbXB0LW9wdGltaXplciBcdTYzRDJcdTRFRjZcdTUxNjVcdTUzRTMgXHUyMDE0IGFwcGx5KGN0eCkgKi9cblxuaW1wb3J0IHR5cGUgeyBDbGllbnRDb250ZXh0IH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHR5cGUgeyBMYW5nLCBQcm9tcHRDb25maWcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgeyBtZXJnZUNvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IE5TLCB6aCwgZW4sIGxhbmdPZiB9IGZyb20gJy4vbG9jYWxlcy5qcyc7XG5pbXBvcnQgeyBjcmVhdGVPcHRpbWl6ZXJTdG9yZSwgdHlwZSBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgZW1pdE9wdGltaXplUmVxdWVzdCB9IGZyb20gJy4vZXZlbnRzLmpzJztcbmltcG9ydCB7IE9wdGltaXplQnV0dG9uIH0gZnJvbSAnLi9PcHRpbWl6ZUJ1dHRvbi50c3gnO1xuaW1wb3J0IHsgUHJldmlld0NhcmQgfSBmcm9tICcuL1ByZXZpZXdDYXJkLnRzeCc7XG5cbi8qKiBzZXR0aW5ncyBuYW1lc3BhY2VcdUZGMDhcdTRFMEVcdTYzRDJcdTRFRjYgaWQgXHU0RTAwXHU4MUY0XHVGRjA5ICovXG5jb25zdCBTRVRUSU5HU19OUyA9ICdwcm9tcHQtb3B0aW1pemVyJztcblxuLyoqXG4gKiBcdTU4RjBcdTY2MEVcdTYzRDJcdTRFRjZcdTRGOURcdThENTZcdTc2ODRcdTVCQTJcdTYyMzdcdTdBRUZcdTY3MERcdTUyQTFcdUZGMDhjb3JkaXMgc2VydmljZSBrZXlzXHVGRjA5XHVGRjFBYXBwbHkgXHU1MTg1XHU3RUNGIGBjdHguPHNlcnZpY2U+YCBcdThCQkZcdTk1RUVcdTc2ODRcdTY3MERcdTUyQTFcdTVGQzVcdTk4N0JcdTU3MjhcdTZCNjRcdTU4RjBcdTY2MEVcdTMwMDJcbiAqIFx1NTAzQ1x1OTg3Qlx1NEUzQVx1NjcwRFx1NTJBMVx1NTQwRFx1ODAwQ1x1OTc1RVx1NTMwNSBpZFx1MjAxNFx1MjAxNFx1NEUwRVx1NTQwQ1x1NUY2Mlx1NjAwMVx1NTE0OFx1NEY4Qlx1NEUwMFx1ODFGNFx1RkYwOGRzaC1tZXNzYWdlLXJhaWw6IFtcInNsb3RzXCIsXCJzZXNzaW9uc1wiXVx1RkYxQlxuICogZHNoLWJldHRlci1zaWRlYmFyIFx1NEVBNlx1NThGMFx1NjYwRSBsb2NhbGVcdUZGMDlcdUZGMUJcdTk1MTlcdThCRUZcdTU4RjBcdTY2MEVcdTRGMUFcdThCQTkgZmliZXIgXHU2QzM4XHU0RTQ1IFBFTkRJTkdcdUZGMENcdTU0MkZcdTUyQThcdTVCQTFcdThCQTFcdTc2RjRcdTYzQTVcdTUyMjRcdTU5MzFcdThEMjVcdTMwMDJcbiAqL1xuZXhwb3J0IGNvbnN0IGluamVjdCA9IFsnc2xvdHMnLCAnc2Vzc2lvbnMnLCAnbG9jYWxlJywgJ3NldHRpbmdzU2NvcGUnXTtcblxuLyoqIFx1NEYxQVx1OEJERFx1NEY1Q1x1NzUyOFx1NTdERiBsaXN0IHNsb3QgXHU3Njg0IHN0b3JlIFx1NTNFNVx1NjdDNFx1RkYwOFx1NjMwOVx1OTRBRVx1NEUwRVx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NTE3MVx1NEVBQiBwZXItc2Vzc2lvbiBcdTVCOUVcdTRGOEJcdUZGMDkgKi9cbmNvbnN0IG9wdGltaXplclN0b3JlID0gY3JlYXRlT3B0aW1pemVyU3RvcmUoKTtcblxuLyoqIFx1MzAwQ1x1NTNCQlx1OEJCRVx1N0Y2RVx1MzAwRFx1NEZFMVx1NTNGN1x1RkYxQXJvb3QgXHU3RUE3XHU4RjdCXHU5MUNGXHU5MDFBXHU3N0U1XHVGRjA4XHU4QkJFXHU3RjZFXHU4ODRDXHU4QkEyXHU5NjA1XHU1NDBFXHU4MUVBXHU1MkE4XHU1QzU1XHU1RjAwXHVGRjFCVGFzayA1IFx1NjNBNVx1N0VCRlx1RkYwOSAqL1xuY29uc3Qgc2lnbmFsTGlzdGVuZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xubGV0IHNpZ25hbFZhbHVlID0gMDtcbmNvbnN0IHNpZ25hbCA9IHtcbiAgZ2V0U25hcHNob3Q6ICgpID0+IHNpZ25hbFZhbHVlLFxuICBzdWJzY3JpYmU6IChmbjogKCkgPT4gdm9pZCkgPT4ge1xuICAgIHNpZ25hbExpc3RlbmVycy5hZGQoZm4pO1xuICAgIHJldHVybiAoKSA9PiBzaWduYWxMaXN0ZW5lcnMuZGVsZXRlKGZuKTtcbiAgfSxcbiAgc2V0OiAobmV4dDogbnVtYmVyKSA9PiB7XG4gICAgc2lnbmFsVmFsdWUgPSBuZXh0O1xuICAgIGZvciAoY29uc3QgZm4gb2Ygc2lnbmFsTGlzdGVuZXJzKSBmbigpO1xuICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5KGN0eDogQ2xpZW50Q29udGV4dCkge1xuICAvLyAxLiBcdTY1ODdcdTY4NDhcbiAgY3R4LmVmZmVjdCgoKSA9PiBjdHgubG9jYWxlLnJlZ2lzdGVyKE5TLCB7IHpoLCBlbiB9KSwgJ3Byb21wdC1vcHRpbWl6ZXI6IGxvY2FsZSByZWdpc3RyYXRpb24nKTtcblxuICAvLyAyLiBcdTkxNERcdTdGNkVcdTk1NUNcdTUwQ0ZcdUZGMDhzZXR0aW5nc1Njb3BlIFx1NEUzQVx1NTUyRlx1NEUwMFx1NEU4Qlx1NUI5RVx1NkU5MFx1RkYwOVxuICBjb25zdCBzZXR0aW5nc1Njb3BlID0gY3R4LnNldHRpbmdzU2NvcGUuYmluZCh7IG5hbWVzcGFjZTogU0VUVElOR1NfTlMgfSk7XG4gIGxldCBjb25maWdNaXJyb3I6IFByb21wdENvbmZpZyA9IG1lcmdlQ29uZmlnKHVuZGVmaW5lZCk7XG4gIGNvbnN0IHJlZnJlc2hDb25maWcgPSAoKSA9PiB7XG4gICAgY29uZmlnTWlycm9yID0gbWVyZ2VDb25maWcoc2V0dGluZ3NTY29wZS5nZXRTbmFwc2hvdCgpLnZhbHVlKTtcbiAgfTtcbiAgcmVmcmVzaENvbmZpZygpO1xuICBjdHguZWZmZWN0KFxuICAgICgpID0+IHNldHRpbmdzU2NvcGUuc3Vic2NyaWJlKCgpID0+IHJlZnJlc2hDb25maWcoKSksXG4gICAgJ3Byb21wdC1vcHRpbWl6ZXI6IHNldHRpbmdzIHN1YnNjcmlwdGlvbicsXG4gICk7XG5cbiAgLy8gMy4gXHU4QkVEXHU4QTAwXHU5NTVDXHU1MENGXG4gIGxldCBsYW5nOiBMYW5nID0gbGFuZ09mKGN0eC5sb2NhbGUuZ2V0TG9jYWxlKCkuYWN0aXZlKTtcbiAgY3R4Lm9uKCdsb2NhbGUvY2hhbmdlJywgKHNuYXA6IHsgYWN0aXZlOiBzdHJpbmcgfSkgPT4ge1xuICAgIGxhbmcgPSBsYW5nT2Yoc25hcC5hY3RpdmUpO1xuICB9KTtcblxuICAvLyA0LiBcdTRGMUFcdThCRERcdTY5RkRcdTRGNERcdUZGMUFcdTYzMDlcdTk0QUUgKyBcdTk4ODRcdTg5QzhcdTUzNjFcdTcyNDdcbiAgY3R4LmluamVjdChbJ3Nsb3RzJywgJ3Nlc3Npb25zJ10sIChzY29wZSkgPT4ge1xuICAgIHNjb3BlLnNsb3RzLmluamVjdCgnY29udmVyc2F0aW9uLmlucHV0LnJpZ2h0JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5yaWdodCcsXG4gICAgICAgICAgaWQ6ICdwcm9tcHQtb3B0aW1pemVyLWJ1dHRvbicsXG4gICAgICAgICAgb3JkZXI6IDAsXG4gICAgICAgICAgbG9jYWxlOiBOUyxcbiAgICAgICAgICBzdG9yZTogb3B0aW1pemVyU3RvcmUsXG4gICAgICAgICAgaW5qZWN0OiAoKSA9PiAoe1xuICAgICAgICAgICAgZ2V0Q29uZmlnOiAoKSA9PiBjb25maWdNaXJyb3IsXG4gICAgICAgICAgICBnZXRMYW5nOiAoKSA9PiBsYW5nLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBPcHRpbWl6ZUJ1dHRvbixcbiAgICAgICksXG4gICAgKTtcbiAgICBzY29wZS5zbG90cy5pbmplY3QoJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JywgKCkgPT5cbiAgICAgIHNjb3BlLnNsb3RzLnJlZ2lzdGVyKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ2NvbnZlcnNhdGlvbi5pbnB1dC5vdmVybGF5JyxcbiAgICAgICAgICBpZDogJ3Byb21wdC1vcHRpbWl6ZXItY2FyZCcsXG4gICAgICAgICAgb3JkZXI6IDEwLFxuICAgICAgICAgIGxvY2FsZTogTlMsXG4gICAgICAgICAgc3RvcmU6IG9wdGltaXplclN0b3JlLFxuICAgICAgICAgIGluamVjdDogKCkgPT4gKHtcbiAgICAgICAgICAgIGdldENvbmZpZzogKCkgPT4gY29uZmlnTWlycm9yLFxuICAgICAgICAgICAgZ2V0TGFuZzogKCkgPT4gbGFuZyxcbiAgICAgICAgICAgIG9wZW5TZXR0aW5nczogKCkgPT4gc2lnbmFsLnNldChzaWduYWwuZ2V0U25hcHNob3QoKSArIDEpLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICBQcmV2aWV3Q2FyZCxcbiAgICAgICksXG4gICAgKTtcbiAgfSk7XG59XG5cbi8vIFx1NUYxNVx1NzUyOFx1NUI4OFx1NTM2Qlx1RkYxQVx1OTA3Rlx1NTE0RCB0cmVlLXNoYWtlIFx1NjM4OVx1N0M3Qlx1NTc4Qlx1RkYwOFx1NEVDNVx1NjU4N1x1Njg2M1x1NjAyN1x1RkYxQlx1NjVFMFx1OEZEMFx1ODg0Q1x1NjVGNlx1ODg0Q1x1NEUzQVx1RkYwOVxuZXhwb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH07IiwgIi8qKiBQcm9tcHQgXHU0RjE4XHU1MzE2XHU2ODM4XHU1RkMzXHVGRjFBXHU5MTREXHU3RjZFXHU2ODIxXHU5QThDXHUzMDAxT3BlbkFJIFx1NTE3Q1x1NUJCOVx1OEMwM1x1NzUyOFx1MzAwMVx1N0VEM1x1Njc5Q1x1NjNEMFx1NTNENiBcdTIwMTRcdTIwMTQgXHU3RUFGXHU1MUZEXHU2NTcwXHVGRjBDXHU5NkY2IERTSCBcdTRGOURcdThENTYgKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9tcHRDb25maWcge1xuICBiYXNlVXJsOiBzdHJpbmc7XG4gIGFwaUtleTogc3RyaW5nO1xuICBtb2RlbDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVFM6IFByb21wdENvbmZpZyA9IHtcbiAgYmFzZVVybDogJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbScsXG4gIGFwaUtleTogJycsXG4gIG1vZGVsOiAnZGVlcHNlZWstY2hhdCcsXG59O1xuXG5leHBvcnQgdHlwZSBMYW5nID0gJ3poJyB8ICdlbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCYXNlVXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHVybC50cmltKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUNvbmZpZyhyYXc6IFBhcnRpYWw8UHJvbXB0Q29uZmlnPiB8IG51bGwgfCB1bmRlZmluZWQpOiBQcm9tcHRDb25maWcge1xuICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIHJhdz8uYmFzZVVybCA9PT0gJ3N0cmluZycgJiYgcmF3LmJhc2VVcmwudHJpbSgpID8gcmF3LmJhc2VVcmwudHJpbSgpIDogREVGQVVMVFMuYmFzZVVybDtcbiAgY29uc3QgYXBpS2V5ID0gdHlwZW9mIHJhdz8uYXBpS2V5ID09PSAnc3RyaW5nJyA/IHJhdy5hcGlLZXkgOiBERUZBVUxUUy5hcGlLZXk7XG4gIGNvbnN0IG1vZGVsID0gdHlwZW9mIHJhdz8ubW9kZWwgPT09ICdzdHJpbmcnICYmIHJhdy5tb2RlbC50cmltKCkgPyByYXcubW9kZWwudHJpbSgpIDogREVGQVVMVFMubW9kZWw7XG4gIHJldHVybiB7IGJhc2VVcmw6IG5vcm1hbGl6ZUJhc2VVcmwoYmFzZVVybCksIGFwaUtleSwgbW9kZWwgfTtcbn1cblxuZXhwb3J0IHR5cGUgQ29uZmlnUHJvYmxlbSA9ICdtaXNzaW5nLWtleScgfCAnbWlzc2luZy1tb2RlbCcgfCAnYmFkLXVybCc7XG5leHBvcnQgdHlwZSBDb25maWdDaGVjayA9IHsgb2s6IHRydWU7IGNvbmZpZzogUHJvbXB0Q29uZmlnIH0gfCB7IG9rOiBmYWxzZTsgcmVhc29uOiBDb25maWdQcm9ibGVtIH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbmZpZyhjb25maWc6IFByb21wdENvbmZpZyk6IENvbmZpZ0NoZWNrIHtcbiAgaWYgKCFjb25maWcuYXBpS2V5LnRyaW0oKSkgcmV0dXJuIHsgb2s6IGZhbHNlLCByZWFzb246ICdtaXNzaW5nLWtleScgfTtcbiAgaWYgKCFjb25maWcubW9kZWwudHJpbSgpKSByZXR1cm4geyBvazogZmFsc2UsIHJlYXNvbjogJ21pc3NpbmctbW9kZWwnIH07XG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwobm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCkpO1xuICAgIGlmICh1LnByb3RvY29sICE9PSAnaHR0cHM6JyAmJiB1LnByb3RvY29sICE9PSAnaHR0cDonKSB0aHJvdyBuZXcgRXJyb3IoJ3Byb3RvY29sJyk7XG4gICAgaWYgKHUuc2VhcmNoIHx8IHUuaGFzaCkgdGhyb3cgbmV3IEVycm9yKCdxdWVyeS1vci1oYXNoJyk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcmVhc29uOiAnYmFkLXVybCcgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgY29uZmlnIH07XG59XG5cbmNvbnN0IFpIX1NZU1RFTSA9XG4gICdcdTRGNjBcdTY2MkZcdTRFMDBcdTU0MEQgcHJvbXB0IFx1NEYxOFx1NTMxNlx1NEUxM1x1NUJCNlx1MzAwMlx1NzUyOFx1NjIzN1x1NEYxQVx1N0VEOVx1NEY2MFx1NEUwMFx1NkJCNVx1ODM0OVx1N0EzRiBwcm9tcHRcdUZGMENcdThCRjdcdTU3MjhcdTRFMERcdTY1MzlcdTUzRDhcdTUxNzZcdTYxMEZcdTU2RkVcdTc2ODRcdTUyNERcdTYzRDBcdTRFMEJcdTVDMDZcdTUxNzZcdTY1MzlcdTUxOTlcdTRFM0FcdTY2RjRcdTZFMDVcdTY2NzBcdTMwMDFcdTY2RjRcdTdFRDNcdTY3ODRcdTUzMTZcdTc2ODRcdTlBRDhcdThEMjhcdTkxQ0YgcHJvbXB0XHVGRjFBJyArXG4gICdcdTg4NjVcdTUxNDVcdTdGM0FcdTU5MzFcdTc2ODRcdTc2RUVcdTY4MDdcdTMwMDFcdTdFQTZcdTY3NUZcdTRFMEVcdTY3MUZcdTY3MUJcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdUZGMDhcdTUzRUZcdTRFQ0VcdTRFMEFcdTRFMEJcdTY1ODdcdTU0MDhcdTc0MDZcdTYzQThcdTY1QURcdUZGMDlcdUZGMENcdTRGN0ZcdTc1MjhcdTdCODBcdTZEMDFcdTY2MEVcdTc4NkVcdTc2ODRcdThCRURcdThBMDBcdUZGMENcdTUzQkJcdTYzODlcdTUxOTdcdTRGNTlcdTMwMDInICtcbiAgJ1x1NEUwRFx1NUY5N1x1N0YxNlx1OTAyMFx1ODM0OVx1N0EzRlx1NEUyRFx1NEUwRFx1NUI1OFx1NTcyOFx1NzY4NFx1NEU4Qlx1NUI5RVx1NjIxNlx1NjI4MFx1NjcyRlx1N0VDNlx1ODI4Mlx1MzAwMlx1NTNFQVx1OEY5M1x1NTFGQVx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NCBwcm9tcHQgXHU2QjYzXHU2NTg3XHVGRjBDXHU0RTBEXHU4OTgxXHU0RUZCXHU0RjU1XHU4OUUzXHU5MUNBXHUzMDAxXHU1MjREXHU3RjAwXHU2MjE2XHU0RUUzXHU3ODAxXHU1NzU3XHU1MzA1XHU4OEY5XHUzMDAyJztcblxuY29uc3QgRU5fU1lTVEVNID1cbiAgJ1lvdSBhcmUgYSBwcm9tcHQgb3B0aW1pemF0aW9uIGV4cGVydC4gUmV3cml0ZSB0aGUgdXNlclxcJ3MgZHJhZnQgcHJvbXB0IGludG8gYSBjbGVhcmVyLCBtb3JlIHN0cnVjdHVyZWQsIGhpZ2gtcXVhbGl0eSBwcm9tcHQgJyArXG4gICd3aXRob3V0IGNoYW5naW5nIGl0cyBpbnRlbnQ6IGZpbGwgaW4gbWlzc2luZyBnb2FscywgY29uc3RyYWludHMsIGFuZCBleHBlY3RlZCBvdXRwdXQgZm9ybWF0IHdoZW4gcmVhc29uYWJseSBpbmZlcmFibGUsICcgK1xuICAndXNlIGNvbmNpc2UgYW5kIHByZWNpc2UgbGFuZ3VhZ2UsIGFuZCByZW1vdmUgcmVkdW5kYW5jeS4gRG8gbm90IGludmVudCBmYWN0cyBvciB0ZWNobmljYWwgZGV0YWlscyBhYnNlbnQgZnJvbSB0aGUgZHJhZnQuICcgK1xuICAnT3V0cHV0IE9OTFkgdGhlIG9wdGltaXplZCBwcm9tcHQgdGV4dCwgd2l0aCBubyBleHBsYW5hdGlvbnMsIHByZWZpeGVzLCBvciBjb2RlIGZlbmNlcy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTeXN0ZW1Qcm9tcHQobGFuZzogTGFuZyk6IHN0cmluZyB7XG4gIHJldHVybiBsYW5nID09PSAnemgnID8gWkhfU1lTVEVNIDogRU5fU1lTVEVNO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRSZXF1ZXN0Qm9keShjb25maWc6IFByb21wdENvbmZpZywgdGV4dDogc3RyaW5nLCBsYW5nOiBMYW5nKTogb2JqZWN0IHtcbiAgcmV0dXJuIHtcbiAgICBtb2RlbDogY29uZmlnLm1vZGVsLFxuICAgIG1lc3NhZ2VzOiBbXG4gICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBidWlsZFN5c3RlbVByb21wdChsYW5nKSB9LFxuICAgICAgeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IHRleHQgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgbWF4X3Rva2VuczogMjA0OCxcbiAgICBzdHJlYW06IGZhbHNlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFJlc3VsdChyYXc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBzID0gcmF3LnRyaW0oKTtcbiAgY29uc3QgZmVuY2UgPSAvXmBgYFthLXpBLVowLTlfKy1dKlxcbihbXFxzXFxTXSo/KVxcbj9gYGAkLztcbiAgY29uc3QgbWF0Y2hlZCA9IHMubWF0Y2goZmVuY2UpO1xuICBpZiAobWF0Y2hlZCkgcyA9IG1hdGNoZWRbMV0udHJpbSgpO1xuICByZXR1cm4gcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhblRyaWdnZXIoZHJhZnQ6IHN0cmluZywgYnVzeTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gIWJ1c3kgJiYgZHJhZnQudHJpbSgpLmxlbmd0aCA+IDA7XG59XG5cbmV4cG9ydCB0eXBlIE9wdGltaXplRXJyb3JLaW5kID1cbiAgfCAnY29uZmlnJ1xuICB8ICd1bmF1dGhvcml6ZWQnXG4gIHwgJ2ZvcmJpZGRlbidcbiAgfCAnaHR0cCdcbiAgfCAndGltZW91dCdcbiAgfCAnbmV0d29yaydcbiAgfCAnY29ycydcbiAgfCAnYmFkLXJlc3BvbnNlJ1xuICB8ICdlbXB0eSc7XG5cbmV4cG9ydCBjbGFzcyBPcHRpbWl6ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgcmVhZG9ubHkga2luZDogT3B0aW1pemVFcnJvcktpbmQsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICApIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnT3B0aW1pemVFcnJvcic7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVF9NUyA9IDYwXzAwMDtcblxuZnVuY3Rpb24gZXh0cmFjdENob2ljZUNvbnRlbnQocGF5bG9hZDogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHBheWxvYWQgIT09ICdvYmplY3QnIHx8IHBheWxvYWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICBjb25zdCBjaG9pY2VzID0gKHBheWxvYWQgYXMgeyBjaG9pY2VzPzogdW5rbm93biB9KS5jaG9pY2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoY2hvaWNlcykgfHwgY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBmaXJzdCA9IGNob2ljZXNbMF0gYXMgeyBtZXNzYWdlPzogeyBjb250ZW50PzogdW5rbm93biB9IH07XG4gIGNvbnN0IGNvbnRlbnQgPSBmaXJzdD8ubWVzc2FnZT8uY29udGVudDtcbiAgcmV0dXJuIHR5cGVvZiBjb250ZW50ID09PSAnc3RyaW5nJyA/IGNvbnRlbnQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FcnJvcktpbmQoZTogdW5rbm93bik6IE9wdGltaXplRXJyb3Ige1xuICBpZiAoZSBpbnN0YW5jZW9mIE9wdGltaXplRXJyb3IpIHJldHVybiBlO1xuICBjb25zdCBpc0Fib3J0ID1cbiAgICAodHlwZW9mIERPTUV4Y2VwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlLm5hbWUgPT09ICdBYm9ydEVycm9yJykgfHxcbiAgICAoZSBpbnN0YW5jZW9mIEVycm9yICYmIChlIGFzIEVycm9yKS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICBpZiAoaXNBYm9ydCkgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCd0aW1lb3V0JywgJ3JlcXVlc3QgYWJvcnRlZCcpO1xuICBpZiAoZSBpbnN0YW5jZW9mIFR5cGVFcnJvcikge1xuICAgIGNvbnN0IG0gPSBTdHJpbmcoZS5tZXNzYWdlID8/ICcnKTtcbiAgICAvLyBcdTVDM0RcdTUyOUJcdTgwMENcdTRFM0FcdUZGMUFDaHJvbWl1bSBcdTc2ODQgQ09SUyBcdTU5MzFcdThEMjVcdTkwMUFcdTVFMzhcdTY2MkYgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGZldGNoXCIpXHVGRjA4XHU2NUUwIGNvcnMgXHU1QjU3XHU2ODM3XHVGRjA5XHVGRjBDXHU0RjFBXHU4NDNEXHU1MjMwIG5ldHdvcmtcdUZGMUJcdTZCNjRcdTUyMDZcdTY1MkZcdTRFQzVcdTYzNTVcdTgzQjdcdTgxRUFcdTVFMjYgQ09SUyBcdTVCNTdcdTY4MzdcdTc2ODRcdTk1MTlcdThCRUZcdTMwMDJcbiAgICBpZiAoL2NvcnMvaS50ZXN0KG0pKSByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ2NvcnMnLCBtKTtcbiAgICByZXR1cm4gbmV3IE9wdGltaXplRXJyb3IoJ25ldHdvcmsnLCBtIHx8ICduZXR3b3JrIGVycm9yJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBPcHRpbWl6ZUVycm9yKCduZXR3b3JrJywgU3RyaW5nKChlIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcHRpbWl6ZShvcHRzOiB7XG4gIGNvbmZpZzogUHJvbXB0Q29uZmlnO1xuICB0ZXh0OiBzdHJpbmc7XG4gIGxhbmc6IExhbmc7XG4gIHNpZ25hbD86IEFib3J0U2lnbmFsO1xufSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgY29uZmlnLCB0ZXh0LCBsYW5nLCBzaWduYWwgfSA9IG9wdHM7XG4gIGNvbnN0IGNoZWNrID0gY2hlY2tDb25maWcoY29uZmlnKTtcbiAgaWYgKCFjaGVjay5vaykgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2NvbmZpZycsIGNoZWNrLnJlYXNvbik7XG5cbiAgbGV0IHJlczogUmVzcG9uc2U7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgZmV0Y2goYCR7bm9ybWFsaXplQmFzZVVybChjb25maWcuYmFzZVVybCl9L2NoYXQvY29tcGxldGlvbnNgLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2NvbmZpZy5hcGlLZXl9YCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShidWlsZFJlcXVlc3RCb2R5KGNvbmZpZywgdGV4dCwgbGFuZykpLFxuICAgICAgc2lnbmFsLFxuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgdG9FcnJvcktpbmQoZSk7XG4gIH1cblxuICBpZiAocmVzLnN0YXR1cyA9PT0gNDAxKSB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcigndW5hdXRob3JpemVkJywgYEhUVFAgNDAxYCk7XG4gIGlmIChyZXMuc3RhdHVzID09PSA0MDMpIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdmb3JiaWRkZW4nLCBgSFRUUCA0MDNgKTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBPcHRpbWl6ZUVycm9yKCdodHRwJywgYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuXG4gIGxldCBwYXlsb2FkOiB1bmtub3duO1xuICB0cnkge1xuICAgIHBheWxvYWQgPSBhd2FpdCByZXMuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgT3B0aW1pemVFcnJvcignYmFkLXJlc3BvbnNlJywgJ2ludmFsaWQgSlNPTicpO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSBleHRyYWN0Q2hvaWNlQ29udGVudChwYXlsb2FkKTtcbiAgaWYgKCFjb250ZW50IHx8ICFjb250ZW50LnRyaW0oKSkgdGhyb3cgbmV3IE9wdGltaXplRXJyb3IoJ2VtcHR5JywgJ2VtcHR5IGNvbXBsZXRpb24nKTtcbiAgcmV0dXJuIGV4dHJhY3RSZXN1bHQoY29udGVudCk7XG59XG4iLCAiLyoqIFByb21wdCBcdTRGMThcdTUzMTZcdTYzRDJcdTRFRjZcdTY1ODdcdTY4NDggXHUyMDE0IFx1NEUyRFx1ODJGMVx1NTNDQ1x1OEJFRCAqL1xuXG5pbXBvcnQgdHlwZSB7IExhbmcgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5cbmV4cG9ydCBjb25zdCBOUyA9ICdwcm9tcHRfb3B0aW1pemVyJztcblxuZXhwb3J0IGNvbnN0IHpoID0ge1xuICAnYnV0dG9uLmFyaWEnOiAnXHU0RjE4XHU1MzE2IHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ1x1NEYxOFx1NTMxNlx1N0VEM1x1Njc5QycsXG4gICdjYXJkLnJlcGxhY2UnOiAnXHU2NkZGXHU2MzYyXHU4MzQ5XHU3QTNGJyxcbiAgJ2NhcmQuY29weSc6ICdcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5jb3B5RG9uZSc6ICdcdTVERjJcdTU5MERcdTUyMzYnLFxuICAnY2FyZC5yZXRyeSc6ICdcdTkxQ0RcdTY1QjBcdTRGMThcdTUzMTYnLFxuICAnY2FyZC5kaXNtaXNzJzogJ1x1NjUzRVx1NUYwMycsXG4gICdjYXJkLm9wdGltaXppbmcnOiAnXHU2QjYzXHU1NzI4XHU0RjE4XHU1MzE2XHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ1x1NURGMlx1OTE0RFx1N0Y2RSBcdTAwQjcgXHU2QTIxXHU1NzhCIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdcdTY3MkFcdTkxNERcdTdGNkUgQVBJJyxcbiAgJ2d1aWRlLnRpdGxlJzogJ1x1OEJGN1x1NTE0OFx1OTE0RFx1N0Y2RSBBUEknLFxuICAnZ3VpZGUuZGVzYyc6ICdcdTUyNERcdTVGODAgXHU4QkJFXHU3RjZFIFx1MjE5MiBcdTkwMUFcdTc1MjhcdThCQkVcdTdGNkUgXHUyMTkyIFByb21wdCBcdTRGMThcdTUzMTZcdUZGMENcdTU4NkJcdTUxOTlcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDBcdTMwMDFBUEkgS2V5IFx1NEUwRVx1NkEyMVx1NTc4Qlx1NTQwRFx1MzAwMicsXG4gICdndWlkZS5hY3Rpb24nOiAnXHU1M0JCXHU4QkJFXHU3RjZFJyxcbiAgJ2d1aWRlLmRpc21pc3MnOiAnXHU3N0U1XHU5MDUzXHU0RTg2JyxcbiAgJ2Vycm9yLnVuYXV0aG9yaXplZCc6ICdBUEkgS2V5IFx1NjVFMFx1NjU0OFx1NjIxNlx1NURGMlx1OEZDN1x1NjcxRicsXG4gICdlcnJvci5mb3JiaWRkZW4nOiAnXHU2NzBEXHU1MkExXHU2MkQyXHU3RUREXHU4QkJGXHU5NUVFXHVGRjA4NDAzXHVGRjA5JyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnXHU4QkY3XHU2QzQyXHU4RDg1XHU2NUY2XHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLm5ldHdvcmsnOiAnXHU3RjUxXHU3RURDXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU0RTBFXHU2M0E1XHU1M0UzXHU1NzMwXHU1NzQwJyxcbiAgJ2Vycm9yLmNvcnMnOiAnXHU2M0E1XHU1M0UzXHU0RTBEXHU2NTJGXHU2MzAxXHU4REU4XHU1N0RGXHVGRjBDXHU4QkY3XHU2MzYyXHU3NTI4XHU2NTJGXHU2MzAxIENPUlMgXHU3Njg0XHU3RjUxXHU1MTczJyxcbiAgJ2Vycm9yLmh0dHAnOiAnXHU4QkY3XHU2QzQyXHU1OTMxXHU4RDI1XHVGRjA4SFRUUCBcdTk1MTlcdThCRUZcdUZGMDknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1x1OEZENFx1NTZERVx1NTE4NVx1NUJCOVx1NjgzQ1x1NUYwRlx1NUYwMlx1NUUzOCcsXG4gICdlcnJvci5lbXB0eSc6ICdcdThGRDRcdTU2REVcdTUxODVcdTVCQjlcdTRFM0FcdTdBN0FcdUZGMENcdThCRjdcdTkxQ0RcdThCRDUnLFxuICAnZXJyb3IuY29uZmlnJzogJ1x1OTE0RFx1N0Y2RVx1NEUwRFx1NUI4Q1x1NjU3NFx1RkYwQ1x1OEJGN1x1NTIzMFx1OEJCRVx1N0Y2RVx1NEUyRFx1NjhDMFx1NjdFNScsXG4gICdzZXR0aW5ncy50aXRsZSc6ICdQcm9tcHQgXHU0RjE4XHU1MzE2JyxcbiAgJ3NldHRpbmdzLmRlc2MnOiAnXHU5MTREXHU3RjZFXHU2REE2XHU4MjcyXHU2M0E1XHU1M0UzXHVGRjA4T3BlbkFJIFx1NTE3Q1x1NUJCOVx1RkYwOVx1RkYxQktleSBcdTY2MEVcdTY1ODdcdTRGRERcdTVCNThcdTU3MjhcdTY3MkNcdTU3MzAnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdcdTYzQTVcdTUzRTNcdTU3MzBcdTU3NDAnLFxuICAnc2V0dGluZ3MuYXBpS2V5JzogJ0FQSSBLZXknLFxuICAnc2V0dGluZ3MubW9kZWwnOiAnXHU2QTIxXHU1NzhCXHU1NDBEJyxcbiAgJ3NldHRpbmdzLnNhdmUnOiAnXHU0RkREXHU1QjU4JyxcbiAgJ3NldHRpbmdzLnJlc2V0JzogJ1x1NjA2Mlx1NTkwRFx1OUVEOFx1OEJBNCcsXG4gICdzZXR0aW5ncy5zYXZlZCc6ICdcdTVERjJcdTRGRERcdTVCNTgnLFxuICAnc2V0dGluZ3MuY2xpY2tUb0VkaXQnOiAnXHU3MEI5XHU1MUZCXHU5MTREXHU3RjZFJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCBjb25zdCBlbjogTG9jYWxlRGljdCA9IHtcbiAgJ2J1dHRvbi5hcmlhJzogJ09wdGltaXplIHByb21wdCcsXG4gICdjYXJkLnRpdGxlJzogJ09wdGltaXplZCBwcm9tcHQnLFxuICAnY2FyZC5yZXBsYWNlJzogJ1VzZSBkcmFmdCcsXG4gICdjYXJkLmNvcHknOiAnQ29weScsXG4gICdjYXJkLmNvcHlEb25lJzogJ0NvcGllZCcsXG4gICdjYXJkLnJldHJ5JzogJ1JldHJ5JyxcbiAgJ2NhcmQuZGlzbWlzcyc6ICdEaXNtaXNzJyxcbiAgJ2NhcmQub3B0aW1pemluZyc6ICdPcHRpbWl6aW5nXHUyMDI2JyxcbiAgJ2NhcmQuY29uZmlndXJlZC5oaW50JzogJ0NvbmZpZ3VyZWQgXHUwMEI3IG1vZGVsIHttb2RlbH0nLFxuICAnY2FyZC51bmNvbmZpZ3VyZWQuaGludCc6ICdObyBBUEkgY29uZmlndXJlZCcsXG4gICdndWlkZS50aXRsZSc6ICdDb25maWd1cmUgdGhlIEFQSSBmaXJzdCcsXG4gICdndWlkZS5kZXNjJzogJ0dvIHRvIFNldHRpbmdzIFx1MjE5MiBHZW5lcmFsIFx1MjE5MiBQcm9tcHQgT3B0aW1pemVyIGFuZCBmaWxsIGluIHRoZSBlbmRwb2ludCwgQVBJIGtleSwgYW5kIG1vZGVsLicsXG4gICdndWlkZS5hY3Rpb24nOiAnR28gdG8gc2V0dGluZ3MnLFxuICAnZ3VpZGUuZGlzbWlzcyc6ICdHb3QgaXQnLFxuICAnZXJyb3IudW5hdXRob3JpemVkJzogJ0FQSSBrZXkgaXMgaW52YWxpZCBvciBleHBpcmVkJyxcbiAgJ2Vycm9yLmZvcmJpZGRlbic6ICdBY2Nlc3MgZm9yYmlkZGVuICg0MDMpJyxcbiAgJ2Vycm9yLnRpbWVvdXQnOiAnUmVxdWVzdCB0aW1lZCBvdXQ7IGNoZWNrIHlvdXIgbmV0d29yayBhbmQgZW5kcG9pbnQnLFxuICAnZXJyb3IubmV0d29yayc6ICdOZXR3b3JrIGVycm9yOyBjaGVjayB5b3VyIG5ldHdvcmsgYW5kIGVuZHBvaW50JyxcbiAgJ2Vycm9yLmNvcnMnOiAnRW5kcG9pbnQgYmxvY2tzIENPUlM7IHVzZSBhIGdhdGV3YXkgdGhhdCBhbGxvd3MgaXQnLFxuICAnZXJyb3IuaHR0cCc6ICdSZXF1ZXN0IGZhaWxlZCAoSFRUUCBlcnJvciknLFxuICAnZXJyb3IuYmFkLXJlc3BvbnNlJzogJ1VuZXhwZWN0ZWQgcmVzcG9uc2UgZm9ybWF0JyxcbiAgJ2Vycm9yLmVtcHR5JzogJ0VtcHR5IHJlc3VsdDsgcGxlYXNlIHJldHJ5JyxcbiAgJ2Vycm9yLmNvbmZpZyc6ICdJbmNvbXBsZXRlIGNvbmZpZ3VyYXRpb247IGNoZWNrIHNldHRpbmdzJyxcbiAgJ3NldHRpbmdzLnRpdGxlJzogJ1Byb21wdCBPcHRpbWl6ZXInLFxuICAnc2V0dGluZ3MuZGVzYyc6ICdDb25maWd1cmUgdGhlIHJld3JpdGUgZW5kcG9pbnQgKE9wZW5BSS1jb21wYXRpYmxlKTsga2V5IGlzIHN0b3JlZCBsb2NhbGx5IGluIHBsYWluIHRleHQnLFxuICAnc2V0dGluZ3MuYmFzZVVybCc6ICdCYXNlIFVSTCcsXG4gICdzZXR0aW5ncy5hcGlLZXknOiAnQVBJIEtleScsXG4gICdzZXR0aW5ncy5tb2RlbCc6ICdNb2RlbCcsXG4gICdzZXR0aW5ncy5zYXZlJzogJ1NhdmUnLFxuICAnc2V0dGluZ3MucmVzZXQnOiAnUmVzZXQgdG8gZGVmYXVsdHMnLFxuICAnc2V0dGluZ3Muc2F2ZWQnOiAnU2F2ZWQnLFxuICAnc2V0dGluZ3MuY2xpY2tUb0VkaXQnOiAnQ2xpY2sgdG8gY29uZmlndXJlJyxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIExvY2FsZUtleSA9IGtleW9mIHR5cGVvZiB6aDtcbmV4cG9ydCB0eXBlIExvY2FsZURpY3QgPSB7IFtLIGluIExvY2FsZUtleV06IHN0cmluZyB9O1xuXG4vKiogXHU2RkMwXHU2RDNCIGxvY2FsZSBcdTIxOTIgXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwXHVGRjA4emggXHU1MjREXHU3RjAwXHU1RjUyIHpoXHVGRjBDXHU1MTc2XHU0RjU5XHU1RjUyIGVuXHVGRjA5ICovXG5leHBvcnQgZnVuY3Rpb24gbGFuZ09mKGFjdGl2ZTogc3RyaW5nKTogTGFuZyB7XG4gIHJldHVybiB0eXBlb2YgYWN0aXZlID09PSAnc3RyaW5nJyAmJiBhY3RpdmUudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKCd6aCcpID8gJ3poJyA6ICdlbic7XG59XG4iLCAiLyoqIFx1NEYxQVx1OEJERFx1OTg4NFx1ODlDOFx1NzJCNlx1NjAwMSBzdG9yZVx1RkYwOGRlZmluZVN0b3JlIFx1ODU4NFx1NUMwMVx1ODhDNVx1RkYwOSsgXHU0RjE4XHU1MzE2XHU3RjE2XHU2MzkyIHJ1bk9wdGltaXplICovXG5cbmltcG9ydCB7IGRlZmluZVN0b3JlIH0gZnJvbSAnQGRlZXBzZWVrLWFpL2RzaC1jbGllbnQtcnVudGltZS9jbGllbnQnO1xuaW1wb3J0IHtcbiAgcmVkdWNlUHJldmlldyxcbiAgSU5JVElBTF9QUkVWSUVXLFxuICB0eXBlIFByZXZpZXdTdGF0ZSxcbn0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcbmltcG9ydCB7XG4gIGNoZWNrQ29uZmlnLFxuICBvcHRpbWl6ZSxcbiAgUkVRVUVTVF9USU1FT1VUX01TLFxuICB0b0Vycm9yS2luZCxcbiAgdHlwZSBMYW5nLFxuICB0eXBlIE9wdGltaXplRXJyb3JLaW5kLFxuICB0eXBlIFByb21wdENvbmZpZyxcbn0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplckFjdGlvbnMge1xuICAvKiogXHU4RkRCXHU1MTY1IG9wdGltaXppbmdcdUZGMUJcdTVERjJcdTU3MjhcdTRGMThcdTUzMTZcdTRFMkRcdTY1RjZcdThGRDRcdTU2REUgZmFsc2VcdUZGMDhcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDlcdTMwMDJcbiAgICogIFx1NkNFOFx1NjEwRlx1RkYxQWRlZmluZVN0b3JlIFx1NzY4NFx1NTJBOFx1NEY1Q1x1NTMwNVx1ODhDNVx1NTY2OFx1NEUyMlx1NUYwMyBtdXRhdG9yIFx1NzY4NFx1OEZENFx1NTZERVx1NTAzQ1x1RkYwOFx1OEZEMFx1ODg0Q1x1NjVGNiBgYWN0aW9ucy5iZWdpbigpYCBcdTVCOUVcdTk2NDVcdThGRDRcdTU2REUgdW5kZWZpbmVkXHVGRjA5XHVGRjBDXG4gICAqICBcdThGRDBcdTg4NENcdTY1RjZcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdTc1MzEgcnVuT3B0aW1pemUgXHU1MTg1XHU3Njg0XHU2QTIxXHU1NzU3XHU3RUE3IGFjdGl2ZUNvbnRyb2xsZXIgXHU2MjdGXHU2MkM1XHVGRjA4XHU4OUMxIHJ1bk9wdGltaXplXHVGRjA5XHUzMDAyICovXG4gIGJlZ2luKCk6IGJvb2xlYW47XG4gIHNob3cocmVzdWx0OiBzdHJpbmcpOiB2b2lkO1xuICBmYWlsKGtpbmQ6IE9wdGltaXplRXJyb3JLaW5kKTogdm9pZDtcbiAgZ3VpZGUoKTogdm9pZDtcbiAgY2xvc2UoKTogdm9pZDtcbn1cblxuLyoqIGRlZmluZVN0b3JlIFx1OEZENFx1NTZERVx1NzY4NCBzdG9yZSBcdTUzRTVcdTY3QzRcdUZGMDhcdTU0MENcdTY1RjZcdTUzRUZcdTRGNUNcdTdDN0JcdTU3OEJcdTUzNjBcdTRGNERcdUZGMENcdTRGOUJcdTZDRThcdTUxOENcdTY1RjYgYHN0b3JlOmAgXHU0RjdGXHU3NTI4XHVGRjA5ICovXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplclN0b3JlSGFuZGxlIHtcbiAgLy8gXHU4RkQwXHU4ODRDXHU2NUY2XHU1RjYyXHU3MkI2XHU3NTMxIERTSCBcdTYzRDBcdTRGOUJcdUZGMUJcdTZCNjRcdTU5MDRcdTRFQzVcdTRFM0FcdTY1ODdcdTY4NjNcdTYwMjdcdTdDN0JcdTU3OEJcbn1cblxudHlwZSBDcmVhdGVPcHRpbWl6ZXJTdG9yZSA9ICgpID0+IE9wdGltaXplclN0b3JlSGFuZGxlO1xuXG4vKipcbiAqIFx1NUY1M1x1NTI0RCBpbi1mbGlnaHQgXHU4QkY3XHU2QzQyXHU3Njg0XHU2M0E3XHU1MjM2XHU1NjY4XHVGRjA4XHU2QTIxXHU1NzU3XHU3RUE3XHVGRjA5XHVGRjFBXG4gKiAtIGBjbG9zZSgpYCBcdTRFMkRcdTZCNjJcdTVCODNcdUZGMENcdTk2MzJcdTZCNjJcdThGREZcdTUyMzBcdTc2ODQgc2hvdygpL2ZhaWwoKSBcdTU5MERcdTZEM0JcdTVERjJcdTUxNzNcdTk1RURcdTUzNjFcdTcyNDdcdUZGMUJcbiAqIC0gcnVuT3B0aW1pemUgXHU0RUU1XHUzMDBDXHU1QjU4XHU1NzI4XHU1NzI4XHU5MDE0XHU2M0E3XHU1MjM2XHU1NjY4XHUzMDBEXHU0RTNBXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjA4XHU1NDBDXHU0RTAwXHU2NUY2XHU1MjNCXHU1M0VBXHU1MTQxXHU4QkI4XHU0RTAwXHU0RTJBXHU4QkY3XHU2QzQyXHU1NzI4XHU5MDE0XHVGRjA5XHUzMDAyXG4gKiBcdTZDRThcdUZGMUFcdTZBMjFcdTU3NTdcdTdFQTdcdTYxMEZcdTU0NzNcdTc3NDBcdTU5MUFcdTRGMUFcdThCRERcdTU0MENcdTY1RjZcdTRGMThcdTUzMTZcdTRGMUFcdTRFOTJcdTc2RjhcdThCQTlcdThERUZcdTIwMTRcdTIwMTRcdThGOTNcdTUxNjVcdTY4MEZcdTUzNTVcdTRGMUFcdThCRERcdTgwNUFcdTcxMjZcdTc2ODRcdTRFQTRcdTRFOTJcdTRFMEJcdTUzRUZcdTYzQTVcdTUzRDdcdTZCNjRcdTdCODBcdTUzMTZcdTMwMDJcbiAqL1xubGV0IGFjdGl2ZUNvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgY3JlYXRlT3B0aW1pemVyU3RvcmU6IENyZWF0ZU9wdGltaXplclN0b3JlID0gKCkgPT4ge1xuICBjb25zdCBoYW5kbGUgPSBkZWZpbmVTdG9yZSh7XG4gICAgaW5pdDogKCkgPT4gKHsgLi4uSU5JVElBTF9QUkVWSUVXIH0pLCAvLyBcdTZCQ0ZcdTRGMUFcdThCRERcdTUyNkZcdTY3MkNcdUZGMUFJTklUSUFMX1BSRVZJRVcgXHU2NjJGXHU1M0VBXHU4QkZCXHU1MTcxXHU0RUFCXHU1RTM4XHU5MUNGXHVGRjBDXHU1MkZGXHU4REU4XHU0RjFBXHU4QkREXHU1MTcxXHU0RUFCXHU1RjE1XHU3NTI4XG4gICAgYWN0aW9uczoge1xuICAgICAgYmVnaW46IChkOiBQcmV2aWV3U3RhdGUpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IHJlZHVjZVByZXZpZXcoZCwgeyB0eXBlOiAnYmVnaW4nIH0pO1xuICAgICAgICBpZiAobmV4dCA9PT0gZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBPYmplY3QuYXNzaWduKGQsIG5leHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBzaG93OiAoZDogUHJldmlld1N0YXRlLCByZXN1bHQ6IHN0cmluZykgPT4gT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VQcmV2aWV3KGQsIHsgdHlwZTogJ3Nob3cnLCByZXN1bHQgfSkpLFxuICAgICAgZmFpbDogKGQ6IFByZXZpZXdTdGF0ZSwga2luZDogT3B0aW1pemVFcnJvcktpbmQpID0+IE9iamVjdC5hc3NpZ24oZCwgcmVkdWNlUHJldmlldyhkLCB7IHR5cGU6ICdmYWlsJywga2luZCB9KSksXG4gICAgICBndWlkZTogKGQ6IFByZXZpZXdTdGF0ZSkgPT4gT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VQcmV2aWV3KGQsIHsgdHlwZTogJ2d1aWRlJyB9KSksXG4gICAgICBjbG9zZTogKGQ6IFByZXZpZXdTdGF0ZSkgPT4ge1xuICAgICAgICAvLyBcdTUzNjFcdTcyNDdcdTg4QUJcdTUxNzNcdTk1RUQvXHU2NTNFXHU1RjAzXHVGRjFBXHU4MkU1XHU4QkY3XHU2QzQyXHU1NzI4XHU5MDE0XHU1MjE5XHU1M0Q2XHU2RDg4XHVGRjBDXHU4RkRGXHU1MjMwXHU3Njg0IHNob3coKS9mYWlsKCkgXHU0RTBEXHU1Rjk3XHU1OTBEXHU2RDNCXHU1REYyXHU1MTczXHU5NUVEXHU1MzYxXHU3MjQ3XG4gICAgICAgIGFjdGl2ZUNvbnRyb2xsZXI/LmFib3J0KCk7XG4gICAgICAgIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihkLCByZWR1Y2VQcmV2aWV3KGQsIHsgdHlwZTogJ2Nsb3NlJyB9KSk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGFuZGxlIGFzIE9wdGltaXplclN0b3JlSGFuZGxlO1xufTtcblxuLyoqIFx1NEYxOFx1NTMxNlx1N0YxNlx1NjM5Mlx1RkYxQVx1OTE0RFx1N0Y2RVx1N0YzQVx1NTkzMSBcdTIxOTIgZ3VpZGVcdUZGMUJcdTgzNDlcdTdBM0ZcdTdBN0EgXHUyMTkyIFx1NzZGNFx1NjNBNVx1OEZENFx1NTZERVx1RkYxQlx1NUU3Nlx1NTNEMSBcdTIxOTIgXHU0RTIyXHU1RjAzXHVGRjFCXHU4RDg1XHU2NUY2L1x1NTNENlx1NkQ4OCBcdTIxOTIgdGltZW91dCBcdTYyMTZcdTk3NTlcdTlFRDggKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5PcHRpbWl6ZShcbiAgYWN0aW9uczogT3B0aW1pemVyQWN0aW9ucyxcbiAgY3R4OiB7IGdldENvbmZpZygpOiBQcm9tcHRDb25maWc7IGdldExhbmcoKTogTGFuZzsgZ2V0RHJhZnQoKTogc3RyaW5nIH0sXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29uZmlnID0gY3R4LmdldENvbmZpZygpO1xuICBpZiAoIWNoZWNrQ29uZmlnKGNvbmZpZykub2spIHtcbiAgICBhY3Rpb25zLmd1aWRlKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGRyYWZ0ID0gY3R4LmdldERyYWZ0KCkudHJpbSgpO1xuICBpZiAoIWRyYWZ0KSByZXR1cm47XG5cbiAgLy8gXHU1RTc2XHU1M0QxXHU2MjhBXHU1MTczXHVGRjFBXHU1REYyXHU2NzA5XHU1NzI4XHU5MDE0XHU4QkY3XHU2QzQyXHU1MjE5XHU0RTIyXHU1RjAzXHU2NzJDXHU2QjIxXHU4OUU2XHU1M0QxXHUzMDAyXG4gIC8vIFx1NEUwRFx1ODBGRFx1NEY5RFx1OEQ1NiBhY3Rpb25zLmJlZ2luKCkgXHU3Njg0XHU4RkQ0XHU1NkRFXHU1MDNDXHUyMDE0XHUyMDE0ZGVmaW5lU3RvcmUgXHU1MkE4XHU0RjVDXHU1MzA1XHU4OEM1XHU1NjY4XHU0RTIyXHU1RjAzIG11dGF0b3IgXHU4RkQ0XHU1NkRFXHU1MDNDXHVGRjA4XHU2MDUyXHU0RTNBIHVuZGVmaW5lZFx1RkYwOVx1RkYxQlxuICAvLyBcdTdFQzRcdTRFRjZcdTVDNDJcdTc2ODRcdTYzMDlcdTk0QUUgYnVzeSBcdTYwMDFcdTVERjJcdTc5ODFcdTc1MjhcdTcwQjlcdTUxRkJcdUZGMENcdThGRDlcdTkxQ0NcdTY2MkZcdTVCRjlcdTVGRUJcdTYzNzdcdTk1MkUvXHU3QURFXHU2MDAxXHU4OUU2XHU1M0QxXHU3Njg0XHU2NzAwXHU1NDBFXHU5NjMyXHU3RUJGXHUzMDAyXG4gIGlmIChhY3RpdmVDb250cm9sbGVyICE9PSBudWxsKSByZXR1cm47XG4gIGFjdGlvbnMuYmVnaW4oKTtcblxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBhY3RpdmVDb250cm9sbGVyID0gY29udHJvbGxlcjsgLy8gXHU2Q0U4XHU1MThDXHU3RUQ5IGNsb3NlKClcdUZGMENcdTRGOUJcdTUzNjFcdTcyNDdcdTUxNzNcdTk1RURcdTY1RjZcdTUzRDZcdTZEODhcdTU3MjhcdTkwMTRcdThCRjdcdTZDNDJcbiAgbGV0IHRpbWVkT3V0ID0gZmFsc2U7XG4gIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgdGltZWRPdXQgPSB0cnVlO1xuICAgIGNvbnRyb2xsZXIuYWJvcnQoKTtcbiAgfSwgUkVRVUVTVF9USU1FT1VUX01TKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9wdGltaXplKHsgY29uZmlnLCB0ZXh0OiBkcmFmdCwgbGFuZzogY3R4LmdldExhbmcoKSwgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICBhY3Rpb25zLnNob3cocmVzdWx0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFx1NTE0OFx1NTIyNFx1NUI5QVx1NEUyRFx1NkI2Mlx1RkYxQVx1NzUyOFx1NjIzNy9cdTdFQzRcdTRFRjZcdTUzRDZcdTZEODhcdTRFMEVcdThEODVcdTY1RjZcdTkwRkRcdTg4NjhcdTczQjBcdTRFM0EgQWJvcnRFcnJvclx1RkYxQlx1NEVDNVx1OEQ4NVx1NjVGNlx1NTE5OVx1NTE2NVx1OTUxOVx1OEJFRlx1NjAwMVxuICAgIGNvbnN0IGlzQWJvcnQgPVxuICAgICAgKGUgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZS5uYW1lID09PSAnQWJvcnRFcnJvcicpIHx8XG4gICAgICAodHlwZW9mIChlIGFzIHsgbmFtZT86IHVua25vd24gfSB8IG51bGwpPy5uYW1lID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAoZSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lID09PSAnQWJvcnRFcnJvcicpO1xuICAgIGlmIChpc0Fib3J0KSB7XG4gICAgICBpZiAodGltZWRPdXQpIGFjdGlvbnMuZmFpbCgndGltZW91dCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhY3Rpb25zLmZhaWwodG9FcnJvcktpbmQoZSkua2luZCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGFjdGl2ZUNvbnRyb2xsZXIgPT09IGNvbnRyb2xsZXIpIGFjdGl2ZUNvbnRyb2xsZXIgPSBudWxsO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cbn0iLCAiLyoqIFx1OTg4NFx1ODlDOFx1NTM2MVx1NzI0N1x1NzJCNlx1NjAwMVx1NjczQSBcdTIwMTRcdTIwMTQgXHU3RUFGIHJlZHVjZXJcdUZGMENcdTY1RTAgRFNIIFx1NEY5RFx1OEQ1NiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9wdGltaXplRXJyb3JLaW5kIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuXG5leHBvcnQgdHlwZSBQcmV2aWV3U3RhdHVzID0gJ2lkbGUnIHwgJ29wdGltaXppbmcnIHwgJ3ByZXZpZXcnIHwgJ2Vycm9yJyB8ICdndWlkZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJldmlld1N0YXRlIHtcbiAgc3RhdHVzOiBQcmV2aWV3U3RhdHVzO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXJyb3JLaW5kOiBPcHRpbWl6ZUVycm9yS2luZCB8IG51bGw7XG4gIGdlbmVyYXRpb246IG51bWJlcjtcbn1cblxuLyoqIFx1NTNFQVx1OEJGQlx1NTE3MVx1NEVBQlx1NUUzOFx1OTFDRlx1RkYxQXJlZHVjZXIgXHU2QzM4XHU0RTBEXHU1MTk5XHU1NkRFXHU1QjgzXHU2MjE2XHU4RkQ0XHU1NkRFXHU1M0VGXHU1M0Q4XHU3Njg0XHU2NUIwXHU1QkY5XHU4QzYxXHVGRjFCXHU2RDg4XHU4RDM5XHU4MDA1XHVGRjA4VGFzayA0IHN0b3JlIFx1ODBGNlx1NkMzNFx1RkYwOVx1NUZDNVx1OTg3Qlx1NEVFNSB7IC4uLklOSVRJQUxfUFJFVklFVyB9IFx1NEUzQVx1NkJDRlx1NEYxQVx1OEJERFx1NzlDRFx1NUI1MCAqL1xuZXhwb3J0IGNvbnN0IElOSVRJQUxfUFJFVklFVzogUHJldmlld1N0YXRlID0ge1xuICBzdGF0dXM6ICdpZGxlJyxcbiAgcmVzdWx0OiAnJyxcbiAgZXJyb3JLaW5kOiBudWxsLFxuICBnZW5lcmF0aW9uOiAwLFxufTtcblxuZXhwb3J0IHR5cGUgUHJldmlld0FjdGlvbiA9XG4gIHwgeyB0eXBlOiAnYmVnaW4nIH1cbiAgfCB7IHR5cGU6ICdzaG93JzsgcmVzdWx0OiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2ZhaWwnOyBraW5kOiBPcHRpbWl6ZUVycm9yS2luZCB9XG4gIHwgeyB0eXBlOiAnZ3VpZGUnIH1cbiAgfCB7IHR5cGU6ICdjbG9zZScgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVByZXZpZXcoc3RhdGU6IFByZXZpZXdTdGF0ZSwgYWN0aW9uOiBQcmV2aWV3QWN0aW9uKTogUHJldmlld1N0YXRlIHtcbiAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgIGNhc2UgJ2JlZ2luJzpcbiAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJykgcmV0dXJuIHN0YXRlO1xuICAgICAgcmV0dXJuIHsgLi4uc3RhdGUsIHN0YXR1czogJ29wdGltaXppbmcnLCBlcnJvcktpbmQ6IG51bGwsIGdlbmVyYXRpb246IHN0YXRlLmdlbmVyYXRpb24gKyAxIH07XG4gICAgY2FzZSAnc2hvdyc6XG4gICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSAnb3B0aW1pemluZydcbiAgICAgICAgPyB7IC4uLnN0YXRlLCBzdGF0dXM6ICdwcmV2aWV3JywgcmVzdWx0OiBhY3Rpb24ucmVzdWx0IH1cbiAgICAgICAgOiBzdGF0ZTtcbiAgICBjYXNlICdmYWlsJzpcbiAgICAgIHJldHVybiBzdGF0ZS5zdGF0dXMgPT09ICdvcHRpbWl6aW5nJ1xuICAgICAgICA/IHsgLi4uc3RhdGUsIHN0YXR1czogJ2Vycm9yJywgZXJyb3JLaW5kOiBhY3Rpb24ua2luZCB9XG4gICAgICAgIDogc3RhdGU7XG4gICAgY2FzZSAnZ3VpZGUnOlxuICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gJ29wdGltaXppbmcnID8gc3RhdGUgOiB7IC4uLnN0YXRlLCBzdGF0dXM6ICdndWlkZScgfTtcbiAgICBjYXNlICdjbG9zZSc6XG4gICAgICByZXR1cm4gSU5JVElBTF9QUkVWSUVXO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuLyoqIFx1NjYyRlx1NTQyNlx1NTE0MVx1OEJCOFx1NTNEMVx1OEQ3N1x1NjVCMFx1NEUwMFx1OEY2RVx1NEYxOFx1NTMxNlx1RkYxQVx1NEUwRFx1NTcyOCBvcHRpbWl6aW5nIFx1NjAwMVx1NTM3M1x1NTNFRlx1RkYwOFx1NjMwOVx1OTRBRS9cdTkxQ0RcdThCRDVcdTc2ODRcdTVFNzZcdTUzRDFcdTYyOEFcdTUxNzNcdUZGMDkgKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5PcHRpbWl6ZUZyb20oc3RhdHVzOiBQcmV2aWV3U3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdGF0dXMgIT09ICdvcHRpbWl6aW5nJztcbn1cbiIsICIvKiogXHU4RjkzXHU1MTY1XHU2ODBGXHU1M0YzXHU0RkE3XHUzMDBDXHU0RjE4XHU1MzE2XHUzMDBEXHU2MzA5XHU5NEFFICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgdHlwZSB7IExhbmcsIFByb21wdENvbmZpZyB9IGZyb20gJy4vb3B0aW1pemVyLmpzJztcbmltcG9ydCB7IGNhblRyaWdnZXIgfSBmcm9tICcuL29wdGltaXplci5qcyc7XG5pbXBvcnQgdHlwZSB7IE9wdGltaXplckFjdGlvbnMgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgeyBydW5PcHRpbWl6ZSB9IGZyb20gJy4vb3B0aW1pemVyLXN0b3JlLmpzJztcbmltcG9ydCB0eXBlIHsgUHJldmlld1N0YXRlIH0gZnJvbSAnLi9wcmV2aWV3LXN0YXRlLmpzJztcblxuLyoqIFx1NEYxQVx1OEJERFx1NjgwN1x1NTFDNiBraXQgXHU2M0QwXHU0RjlCXHU3Njg0XHU1M0VBXHU4QkZCXHU4RjkzXHU1MTY1XHU1RkVCXHU3MTY3XHVGRjA4aW5wdXQgaG9va1x1RkYwOSAqL1xuaW50ZXJmYWNlIElucHV0U25hcHNob3Qge1xuICBkcmFmdDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wdGltaXplQnV0dG9uUHJvcHMge1xuICB0OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZztcbiAgdXNlSW5wdXQ6ICgpID0+IElucHV0U25hcHNob3Q7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBQcmV2aWV3U3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IE9wdGltaXplckFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xufVxuXG5jb25zdCBDU1NfSUQgPSAnZHNoLXByb21wdC1vcHRpbWl6ZXIvYnV0dG9uLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1idG4ge1xuICBib3JkZXI6IDA7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIHBhZGRpbmc6IDJweCA2cHg7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgbGluZS1oZWlnaHQ6IDE7XG4gIG9wYWNpdHk6IDAuODU7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbn1cbi5kc2gtcG8tYnRuOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcbiAgb3BhY2l0eTogMTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWludGVyYWN0aXZlLWJnLWhvdmVyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMTIpKTtcbn1cbi5kc2gtcG8tYnRuOmRpc2FibGVkIHtcbiAgb3BhY2l0eTogMC4zNTtcbiAgY3Vyc29yOiBkZWZhdWx0O1xufVxuLmRzaC1wby1idG5bZGF0YS1idXN5PVwidHJ1ZVwiXTo6YmVmb3JlIHtcbiAgY29udGVudDogXCJcdTIzRjNcIjtcbn1cbmA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gT3B0aW1pemVCdXR0b24ocHJvcHM6IE9wdGltaXplQnV0dG9uUHJvcHMpIHtcbiAgY29uc3QgeyB0LCB1c2VJbnB1dCwgdXNlU3RvcmUsIGFjdGlvbnMsIGdldENvbmZpZywgZ2V0TGFuZyB9ID0gcHJvcHM7XG5cbiAgY29uc3QgaW5wdXQgPSB1c2VJbnB1dCgpO1xuICBjb25zdCBzdGF0dXMgPSB1c2VTdG9yZSgocykgPT4gcy5zdGF0dXMpO1xuICBjb25zdCBidXN5ID0gc3RhdHVzID09PSAnb3B0aW1pemluZyc7XG4gIGNvbnN0IGRpc2FibGVkID0gIWNhblRyaWdnZXIoaW5wdXQuZHJhZnQsIGJ1c3kpO1xuXG4gIC8vIFx1NTM3OFx1OEY3RFx1NjVGNlx1NjVFMFx1OTcwMFx1NjYzRVx1NUYwRlx1NTNENlx1NkQ4OFx1RkYxQVx1OEJGN1x1NkM0Mlx1NTcyOFx1OTAxNFx1NjVGNlx1N0VDNFx1NEVGNlx1NjgxMVx1NURGMlx1NEUwRFx1NkUzMlx1NjdEM1x1RkYxQlx1NEYxQVx1OEJERFx1NTIwN1x1NjM2Mlx1NTQwRSBzdG9yZSBcdTVCOUVcdTRGOEJcdTk2OEZcbiAgLy8gXHU0RjFBXHU4QkREIHNjb3BlIFx1NkUwNVx1NzQwNlx1RkYwOFx1NjIxNlx1NTFCQlx1N0VEM1x1RkYwOVx1RkYwQ3J1bk9wdGltaXplIFx1NzY4NFx1OEZERlx1NTIzMFx1NTE5OVx1NTE2NVx1NjVFMFx1NEVCQVx1OEJBMlx1OTYwNVx1RkYwQ1x1NjVFMFx1NTI2Rlx1NEY1Q1x1NzUyOFx1MzAwMlxuICB1c2VFZmZlY3QoKCkgPT4gaW5qZWN0Q3NzKCksIFtdKTtcblxuICBjb25zdCBoYW5kbGVDbGljayA9ICgpID0+IHtcbiAgICBpZiAoZGlzYWJsZWQpIHJldHVybjtcbiAgICB2b2lkIHJ1bk9wdGltaXplKGFjdGlvbnMsIHtcbiAgICAgIGdldENvbmZpZyxcbiAgICAgIGdldExhbmcsXG4gICAgICBnZXREcmFmdDogKCkgPT4gaW5wdXQuZHJhZnQsXG4gICAgfSk7XG4gIH07XG5cbiAgcmV0dXJuIChcbiAgICA8YnV0dG9uXG4gICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgIGNsYXNzTmFtZT1cImRzaC1wby1idG5cIlxuICAgICAgYXJpYS1sYWJlbD17dCgnYnV0dG9uLmFyaWEnKX1cbiAgICAgIHRpdGxlPXt0KCdidXR0b24uYXJpYScpfVxuICAgICAgYXJpYS1idXN5PXtidXN5fVxuICAgICAgZGlzYWJsZWQ9e2Rpc2FibGVkfVxuICAgICAgZGF0YS1idXN5PXtidXN5fVxuICAgICAgb25DbGljaz17aGFuZGxlQ2xpY2t9XG4gICAgPlxuICAgICAge2J1c3kgPyAnXHUyM0YzJyA6ICdcdTI3MjgnfVxuICAgIDwvYnV0dG9uPlxuICApO1xufSIsICIvKiogXHU4RjkzXHU1MTY1XHU1MzNBXHU2RDZFXHU1QzQyXHU5ODg0XHU4OUM4XHU1MzYxXHU3MjQ3XHVGRjFBZ3VpZGUgLyBvcHRpbWl6aW5nIC8gcHJldmlldyAvIGVycm9yIFx1NTZEQlx1NzlDRFx1NTE4NVx1NUJCOVx1NjAwMSAqL1xuXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB0eXBlIHsgTGFuZywgUHJvbXB0Q29uZmlnIH0gZnJvbSAnLi9vcHRpbWl6ZXIuanMnO1xuaW1wb3J0IHR5cGUgeyBPcHRpbWl6ZXJBY3Rpb25zIH0gZnJvbSAnLi9vcHRpbWl6ZXItc3RvcmUuanMnO1xuaW1wb3J0IHsgcnVuT3B0aW1pemUgfSBmcm9tICcuL29wdGltaXplci1zdG9yZS5qcyc7XG5pbXBvcnQgdHlwZSB7IFByZXZpZXdTdGF0ZSB9IGZyb20gJy4vcHJldmlldy1zdGF0ZS5qcyc7XG5cbi8qKiBcdTRGMUFcdThCRERcdTY4MDdcdTUxQzYga2l0IFx1NjNEMFx1NEY5Qlx1NzY4NFx1OEY5M1x1NTE2NSBhY3Rpb24gXHU5NzYyICovXG5pbnRlcmZhY2UgSW5wdXRBY3Rpb25zIHtcbiAgc2V0RHJhZnQodGV4dDogc3RyaW5nKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcmV2aWV3Q2FyZFByb3BzIHtcbiAgdDogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHVzZUlucHV0OiAoKSA9PiB7IGRyYWZ0OiBzdHJpbmcgfTtcbiAgaW5wdXRBY3Rpb25zOiBJbnB1dEFjdGlvbnM7XG4gIHVzZVN0b3JlOiA8VD4oc2VsZWN0b3I6IChzOiBQcmV2aWV3U3RhdGUpID0+IFQpID0+IFQ7XG4gIGFjdGlvbnM6IE9wdGltaXplckFjdGlvbnM7XG4gIGdldENvbmZpZzogKCkgPT4gUHJvbXB0Q29uZmlnO1xuICBnZXRMYW5nOiAoKSA9PiBMYW5nO1xuICBvcGVuU2V0dGluZ3M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IENTU19JRCA9ICdkc2gtcHJvbXB0LW9wdGltaXplci9jYXJkLmNzcyc7XG5mdW5jdGlvbiBpbmplY3RDc3MoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYHN0eWxlW2RhdGEtcGx1Z2luLWNzcz1cIiR7Q1NTX0lEfVwiXWApKSByZXR1cm47XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgc3R5bGUuZGF0YXNldC5wbHVnaW5Dc3MgPSBDU1NfSUQ7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuLmRzaC1wby1jYXJkIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiAxMnB4O1xuICByaWdodDogMTJweDtcbiAgYm90dG9tOiBjYWxjKDEwMCUgKyA4cHgpO1xuICB6LWluZGV4OiA0MDtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJnLW92ZXJsYXksICNmZmYpO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1kc3ctYWxpYXMtYm9yZGVyLWwyLCByZ2JhKDEyOCwxMjgsMTI4LDAuMykpO1xuICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYmEoMCwgMCwgMCwgMC4xNik7XG4gIHBhZGRpbmc6IDEycHggMTRweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogOHB4O1xufVxuLmRzaC1wby1jYXJkLWhlYWQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbn1cbi5kc2gtcG8tY2FyZC1ib2R5IHtcbiAgb3ZlcmZsb3c6IGF1dG87XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgY29sb3I6IHZhcigtLWRzdy1hbGlhcy1sYWJlbC1zZWNvbmRhcnksICM0NDQpO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxLjY7XG4gIG1heC1oZWlnaHQ6IDIwMHB4O1xufVxuLmRzaC1wby1jYXJkLWVyciB7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtc3RhdGUtZXJyb3ItcHJpbWFyeSwgI2QwMzA1MCk7XG4gIGZvbnQtc2l6ZTogMTNweDtcbn1cbi5kc2gtcG8tY2FyZC1yb3cge1xuICBkaXNwbGF5OiBmbGV4O1xuICBnYXA6IDhweDtcbiAgZmxleC13cmFwOiB3cmFwO1xufVxuLmRzaC1wby1jYXJkLWJ0biB7XG4gIGJvcmRlcjogMDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiA0cHggMTBweDtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiB2YXIoLS1kc3ctYWxpYXMtbGFiZWwtcHJpbWFyeSwgIzIyMik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWRzdy1hbGlhcy1pbnRlcmFjdGl2ZS1iZy1ob3ZlciwgcmdiYSgxMjgsMTI4LDEyOCwwLjE0KSk7XG59XG4uZHNoLXBvLWNhcmQtYnRuLnByaW1hcnkge1xuICBjb2xvcjogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnktaW52ZXJ0LCAjZmZmKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tZHN3LWFsaWFzLWJyYW5kLXByaW1hcnksICMxNjc3ZmYpO1xufVxuYDtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG5cbmZ1bmN0aW9uIGVycm9yS2V5KGtpbmQ6IFByZXZpZXdTdGF0ZVsnZXJyb3JLaW5kJ10pOiBzdHJpbmcge1xuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICBjYXNlICd1bmF1dGhvcml6ZWQnOlxuICAgIGNhc2UgJ2ZvcmJpZGRlbic6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGNhc2UgJ3RpbWVvdXQnOlxuICAgIGNhc2UgJ25ldHdvcmsnOlxuICAgIGNhc2UgJ2NvcnMnOlxuICAgIGNhc2UgJ2h0dHAnOlxuICAgIGNhc2UgJ2JhZC1yZXNwb25zZSc6XG4gICAgY2FzZSAnZW1wdHknOlxuICAgIGNhc2UgJ2NvbmZpZyc6XG4gICAgICByZXR1cm4gYGVycm9yLiR7a2luZH1gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ2Vycm9yLm5ldHdvcmsnO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQcmV2aWV3Q2FyZChwcm9wczogUHJldmlld0NhcmRQcm9wcykge1xuICBjb25zdCB7IHQsIHVzZUlucHV0LCBpbnB1dEFjdGlvbnMsIHVzZVN0b3JlLCBhY3Rpb25zLCBnZXRDb25maWcsIGdldExhbmcsIG9wZW5TZXR0aW5ncyB9ID0gcHJvcHM7XG5cbiAgdXNlRWZmZWN0KCgpID0+IGluamVjdENzcygpLCBbXSk7XG5cbiAgY29uc3QgaW5wdXQgPSB1c2VJbnB1dCgpO1xuICBjb25zdCBzdGF0dXMgPSB1c2VTdG9yZSgocykgPT4gcy5zdGF0dXMpO1xuICBjb25zdCByZXN1bHQgPSB1c2VTdG9yZSgocykgPT4gcy5yZXN1bHQpO1xuICBjb25zdCBlcnJvcktpbmQgPSB1c2VTdG9yZSgocykgPT4gcy5lcnJvcktpbmQpO1xuICBjb25zdCBbY29waWVkLCBzZXRDb3BpZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIGlmIChzdGF0dXMgPT09ICdpZGxlJykgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmV0cnkgPSAoKSA9PiB7XG4gICAgdm9pZCBydW5PcHRpbWl6ZShhY3Rpb25zLCB7IGdldENvbmZpZywgZ2V0TGFuZywgZ2V0RHJhZnQ6ICgpID0+IGlucHV0LmRyYWZ0IH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlcGxhY2UgPSAoKSA9PiB7XG4gICAgaW5wdXRBY3Rpb25zLnNldERyYWZ0KHJlc3VsdCk7XG4gICAgYWN0aW9ucy5jbG9zZSgpO1xuICB9O1xuXG4gIGNvbnN0IGNvcHkgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHJlc3VsdCk7XG4gICAgICBzZXRDb3BpZWQodHJ1ZSk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHNldENvcGllZChmYWxzZSksIDEyMDApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gXHU1MjZBXHU4RDM0XHU2NzdGXHU0RTBEXHU1M0VGXHU3NTI4XHU2NUY2XHU5NzU5XHU5RUQ4XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZFwiIHJvbGU9XCJzdGF0dXNcIj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtaGVhZFwiPlxuICAgICAgICA8c3Bhbj57dCgnY2FyZC50aXRsZScpfTwvc3Bhbj5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuXCIgb25DbGljaz17KCkgPT4gYWN0aW9ucy5jbG9zZSgpfT5cbiAgICAgICAgICBcdTI3MTVcbiAgICAgICAgPC9idXR0b24+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3N0YXR1cyA9PT0gJ2d1aWRlJyAmJiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLnRpdGxlJyl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2d1aWRlLmRlc2MnKX08L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLXJvd1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtYnRuIHByaW1hcnlcIiBvbkNsaWNrPXsoKSA9PiB7IGFjdGlvbnMuY2xvc2UoKTsgb3BlblNldHRpbmdzKCk7IH19PlxuICAgICAgICAgICAgICB7dCgnZ3VpZGUuYWN0aW9uJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGFjdGlvbnMuY2xvc2UoKX0+XG4gICAgICAgICAgICAgIHt0KCdndWlkZS5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuXG4gICAgICB7c3RhdHVzID09PSAnb3B0aW1pemluZycgJiYgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1ib2R5XCI+e3QoJ2NhcmQub3B0aW1pemluZycpfTwvZGl2Pn1cblxuICAgICAge3N0YXR1cyA9PT0gJ3ByZXZpZXcnICYmIChcbiAgICAgICAgPD5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJvZHlcIj57cmVzdWx0fTwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtcm93XCI+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG4gcHJpbWFyeVwiIG9uQ2xpY2s9e3JlcGxhY2V9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXBsYWNlJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IHZvaWQgY29weSgpfT5cbiAgICAgICAgICAgICAge2NvcGllZCA/IHQoJ2NhcmQuY29weURvbmUnKSA6IHQoJ2NhcmQuY29weScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXtyZXRyeX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLnJldHJ5Jyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0blwiIG9uQ2xpY2s9eygpID0+IGFjdGlvbnMuY2xvc2UoKX0+XG4gICAgICAgICAgICAgIHt0KCdjYXJkLmRpc21pc3MnKX1cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8Lz5cbiAgICAgICl9XG5cbiAgICAgIHtzdGF0dXMgPT09ICdlcnJvcicgJiYgKFxuICAgICAgICA8PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHNoLXBvLWNhcmQtZXJyXCI+e3QoZXJyb3JLZXkoZXJyb3JLaW5kKSl9PC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1yb3dcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImRzaC1wby1jYXJkLWJ0biBwcmltYXJ5XCIgb25DbGljaz17cmV0cnl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5yZXRyeScpfVxuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJkc2gtcG8tY2FyZC1idG5cIiBvbkNsaWNrPXsoKSA9PiBhY3Rpb25zLmNsb3NlKCl9PlxuICAgICAgICAgICAgICB7dCgnY2FyZC5kaXNtaXNzJyl9XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC8+XG4gICAgICApfVxuICAgIDwvZGl2PlxuICApO1xufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ1FPLElBQU0sV0FBeUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQ1Q7QUFJTyxTQUFTLGlCQUFpQixLQUFxQjtBQUNwRCxTQUFPLElBQUksS0FBSyxFQUFFLFFBQVEsUUFBUSxFQUFFO0FBQ3RDO0FBRU8sU0FBUyxZQUFZLEtBQTZEO0FBQ3ZGLFFBQU0sVUFBVSxPQUFPLEtBQUssWUFBWSxZQUFZLElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxTQUFTO0FBQ3ZHLFFBQU0sU0FBUyxPQUFPLEtBQUssV0FBVyxXQUFXLElBQUksU0FBUyxTQUFTO0FBQ3ZFLFFBQU0sUUFBUSxPQUFPLEtBQUssVUFBVSxZQUFZLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLEtBQUssSUFBSSxTQUFTO0FB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QUcsQ0FBQyxHQUFHLHVDQUF1QztBQUc3RixRQUFNLGdCQUFnQixJQUFJLGNBQWMsS0FBSyxFQUFFLFdBQVcsWUFBWSxDQUFDO0FBQ3ZFLE1BQUksZUFBNkIsWUFBWSxNQUFTO0FBQ3RELFFBQU0sZ0JBQWdCLE1BQU07QUFDMUIsbUJBQWUsWUFBWSxjQUFjLFlBQVksRUFBRSxLQUFLO0FBQUEsRUFDOUQ7QUFDQSxnQkFBYztBQUNkLE1BQUk7QUFBQSxJQUNGLE1BQU0sY0FBYyxVQUFVLE1BQU0sY0FBYyxDQUFDO0FBQUEsSUFDbkQ7QUFBQSxFQUNGO0FBR0EsTUFBSSxPQUFhLE9BQU8sSUFBSSxPQUFPLFVBQVUsRUFBRSxNQUFNO0FBQ3JELE1BQUksR0FBRyxpQkFBaUIsQ0FBQyxTQUE2QjtBQUNwRCxXQUFPLE9BQU8sS0FBSyxNQUFNO0FBQUEsRUFDM0IsQ0FBQztBQUdELE1BQUksT0FBTyxDQUFDLFNBQVMsVUFBVSxHQUFHLENBQUMsVUFBVTtBQUMzQyxVQUFNLE1BQU07QUFBQSxNQUFPO0FBQUEsTUFBNEIsTUFDN0MsTUFBTSxNQUFNO0FBQUEsUUFDVjtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sSUFBSTtBQUFBLFVBQ0osT0FBTztBQUFBLFVBQ1AsUUFBUTtBQUFBLFVBQ1IsT0FBTztBQUFBLFVBQ1AsUUFBUSxPQUFPO0FBQUEsWUFDYixXQUFXLE1BQU07QUFBQSxZQUNqQixTQUFTLE1BQU07QUFBQSxVQUNqQjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxVQUFNLE1BQU07QUFBQSxNQUFPO0FBQUEsTUFBOEIsTUFDL0MsTUFBTSxNQUFNO0FBQUEsUUFDVjtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sSUFBSTtBQUFBLFVBQ0osT0FBTztBQUFBLFVBQ1AsUUFBUTtBQUFBLFVBQ1IsT0FBTztBQUFBLFVBQ1AsUUFBUSxPQUFPO0FBQUEsWUFDYixXQUFXLE1BQU07QUFBQSxZQUNqQixTQUFTLE1BQU07QUFBQSxZQUNmLGNBQWMsTUFBTSxPQUFPLElBQUksT0FBTyxZQUFZLElBQUksQ0FBQztBQUFBLFVBQ3pEO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJzaWduYWwiLCAiaW1wb3J0X3JlYWN0IiwgImltcG9ydF9qc3hfcnVudGltZSIsICJDU1NfSUQiLCAiaW5qZWN0Q3NzIl0KfQo=

    return module.exports;
  }
});
