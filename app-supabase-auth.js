(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuth = api;
  if (root && root.document) api.bootstrapBrowserRuntime(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const FORMAL_PUSH_CONFIRMATION = "啟用唯一正式推送";
  const AUTH_RUNTIME_VERSION = "20260813-password-login-session-race-001";
  const SESSION_REFRESH_MARGIN_SECONDS = 60;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAGIC_LINK_CALLBACK_ROOT_URL = "https://asd-642.github.io/lailai-materials-management/";
  const MAGIC_LINK_CALLBACK_INDEX_URL = `${MAGIC_LINK_CALLBACK_ROOT_URL}index.html`;
  const MAGIC_LINK_CALLBACK_URL = MAGIC_LINK_CALLBACK_INDEX_URL;
  const MAGIC_LINK_CALLBACK_URLS = Object.freeze([MAGIC_LINK_CALLBACK_ROOT_URL, MAGIC_LINK_CALLBACK_INDEX_URL]);
  const MAGIC_LINK_CALLBACK_ORIGIN = "https://asd-642.github.io";
  const MAGIC_LINK_CALLBACK_PATHS = Object.freeze(new Set([
    "/lailai-materials-management/",
    "/lailai-materials-management/index.html",
  ]));
  const CALLBACK_DIAGNOSTIC_STORAGE_KEY = "materials_quote_supabase_callback_status_v1";
  const CALLBACK_DIAGNOSTIC_SCHEMA = "materials-quote-supabase-callback-status/v1";
  const CALLBACK_DIAGNOSTIC_STATUSES = Object.freeze({
    noCallback: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_NOT_PRESENT", stage: "bridge" }),
    shape: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_SHAPE_REJECTED", stage: "callback-shape" }),
    pkce: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_PKCE_REJECTED", stage: "pkce" }),
    project: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_REJECTED", stage: "project-identity" }),
    user: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_USER_PROBE_REJECTED", stage: "user-probe" }),
    storage: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_STORAGE_REJECTED", stage: "session-storage" }),
    success: Object.freeze({ code: "SUPABASE_AUTH_CALLBACK_SUCCESS", stage: "complete" }),
  });
  const CALLBACK_DIAGNOSTIC_BY_CODE = Object.freeze(new Map(
    Object.values(CALLBACK_DIAGNOSTIC_STATUSES).map((value) => [value.code, value]),
  ));
  const CALLBACK_MAX_LENGTH = 16384;
  const TOKEN_MAX_LENGTH = 8192;
  const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const AUTH_CODE_PATTERN = /^[A-Za-z0-9._~-]{20,2048}$/;
  const PKCE_VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;
  const CALLBACK_QUERY_FIELDS = Object.freeze(new Set(["code", "type"]));
  const CALLBACK_FRAGMENT_FIELDS = Object.freeze(new Set([
    "access_token",
    "expires_at",
    "expires_in",
    "refresh_token",
    "token_type",
    "type",
  ]));
  const CALLBACK_TELEMETRY_PARAMETER_NAMES = Object.freeze([
    "access_token",
    "code",
    "error",
    "error_code",
    "error_description",
    "expires_at",
    "expires_in",
    "provider_refresh_token",
    "provider_token",
    "refresh_token",
    "token",
    "token_hash",
    "token_type",
    "type",
    "unknown",
  ]);
  const CALLBACK_TELEMETRY_PRESENCE_NAMES = Object.freeze([
    "query",
    "hash",
    ...CALLBACK_TELEMETRY_PARAMETER_NAMES,
    "duplicate",
  ]);
  const CALLBACK_TELEMETRY_TRANSPORTS = Object.freeze(new Set(["query", "hash", "none"]));
  const CALLBACK_TELEMETRY_STAGES = Object.freeze(new Set([
    "bridge",
    "callback-shape",
    "pkce",
    "project-identity",
    "user-probe",
    "session-storage",
    "complete",
  ]));

  function errorResult(code) {
    return Object.freeze({ ok: false, code: String(code || "SUPABASE_AUTH_REJECTED") });
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function emptyCallbackTelemetry() {
    const presence = {};
    for (const name of CALLBACK_TELEMETRY_PRESENCE_NAMES) presence[name] = false;
    return Object.freeze({
      transport: "none",
      parameterNames: Object.freeze([]),
      presence: Object.freeze(presence),
      parseStage: "bridge",
      rejectReason: "NOT_PRESENT",
    });
  }

  function normalizeCallbackTelemetry(value) {
    if (!isRecord(value)) return emptyCallbackTelemetry();
    const transport = CALLBACK_TELEMETRY_TRANSPORTS.has(String(value.transport || ""))
      ? String(value.transport)
      : "none";
    const allowedNames = new Set(CALLBACK_TELEMETRY_PARAMETER_NAMES);
    const parameterNames = Array.isArray(value.parameterNames)
      ? Array.from(new Set(value.parameterNames.filter((name) => allowedNames.has(String(name))).map(String))).sort()
      : [];
    const inputPresence = isRecord(value.presence) ? value.presence : {};
    const presence = {};
    for (const name of CALLBACK_TELEMETRY_PRESENCE_NAMES) {
      presence[name] = inputPresence[name] === true;
    }
    for (const name of parameterNames) presence[name] = true;
    return Object.freeze({
      transport,
      parameterNames: Object.freeze(parameterNames),
      presence: Object.freeze(presence),
      parseStage: "bridge",
      rejectReason: "PENDING",
    });
  }

  function callbackRejectReason(result) {
    if (result?.ok === true) return "SUCCESS";
    const code = String(result?.code || "");
    const exact = {
      SUPABASE_AUTH_CALLBACK_ENCODING_INVALID: "ENCODING_INVALID",
      SUPABASE_AUTH_CALLBACK_FIELDS_INVALID: "FIELDS_INVALID",
      SUPABASE_AUTH_CALLBACK_CONFLICT: "MIXED_TRANSPORT",
      SUPABASE_AUTH_CALLBACK_MISSING: "FIELDS_MISSING",
      SUPABASE_AUTH_CALLBACK_PAGE_IDENTITY_INVALID: "PAGE_IDENTITY_INVALID",
      SUPABASE_AUTH_CALLBACK_SESSION_INVALID: "SESSION_INVALID",
      SUPABASE_AUTH_CALLBACK_ALREADY_CONSUMED: "ALREADY_CONSUMED",
      SUPABASE_AUTH_PKCE_CONTEXT_UNAVAILABLE: "PKCE_CONTEXT_UNAVAILABLE",
      SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_INVALID: "PROJECT_IDENTITY_INVALID",
      SUPABASE_AUTH_CALLBACK_USER_INVALID: "USER_INVALID",
      SUPABASE_AUTH_SESSION_STORAGE_FAILED: "STORAGE_FAILED",
      SUPABASE_AUTH_NETWORK_ERROR: "NETWORK_REJECTED",
      SUPABASE_AUTH_RESPONSE_IDENTITY_INVALID: "RESPONSE_IDENTITY_INVALID",
    };
    if (hasOwn(exact, code)) return exact[code];
    if (code.startsWith("SUPABASE_AUTH_PKCE_HTTP_")) return "PKCE_HTTP_REJECTED";
    return "REJECTED";
  }

  function finalizeCallbackTelemetry(telemetry, diagnostic, result) {
    const normalized = normalizeCallbackTelemetry(telemetry);
    const parseStage = CALLBACK_TELEMETRY_STAGES.has(String(diagnostic?.stage || ""))
      ? String(diagnostic.stage)
      : "callback-shape";
    return Object.freeze({
      transport: normalized.transport,
      parameterNames: normalized.parameterNames,
      presence: normalized.presence,
      parseStage,
      rejectReason: callbackRejectReason(result),
    });
  }

  function createCallbackDiagnosticStore(storage) {
    let inMemory = null;

    function normalize(value) {
      if (!isRecord(value)
        || value.schema !== CALLBACK_DIAGNOSTIC_SCHEMA
        || Object.keys(value).sort().join(",") !== "code,schema,stage") return null;
      const allowed = CALLBACK_DIAGNOSTIC_BY_CODE.get(String(value.code || ""));
      if (!allowed || allowed.stage !== String(value.stage || "")) return null;
      return Object.freeze({ schema: CALLBACK_DIAGNOSTIC_SCHEMA, code: allowed.code, stage: allowed.stage });
    }

    function read() {
      if (inMemory) return inMemory;
      if (!storage || typeof storage.getItem !== "function") return null;
      try {
        const raw = storage.getItem(CALLBACK_DIAGNOSTIC_STORAGE_KEY);
        inMemory = raw ? normalize(JSON.parse(raw)) : null;
      } catch (error) {
        inMemory = null;
      }
      return inMemory;
    }

    function write(statusValue) {
      const allowed = CALLBACK_DIAGNOSTIC_BY_CODE.get(String(statusValue?.code || ""));
      if (!allowed || allowed.stage !== String(statusValue?.stage || "")) return read();
      inMemory = Object.freeze({ schema: CALLBACK_DIAGNOSTIC_SCHEMA, code: allowed.code, stage: allowed.stage });
      if (storage && typeof storage.setItem === "function") {
        try {
          storage.setItem(CALLBACK_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(inMemory));
        } catch (error) {
          // The in-memory enum remains available without exposing callback data.
        }
      }
      return inMemory;
    }

    function clear() {
      inMemory = null;
      if (storage && typeof storage.removeItem === "function") {
        try {
          storage.removeItem(CALLBACK_DIAGNOSTIC_STORAGE_KEY);
        } catch (error) {
          // A denied cleanup does not alter Auth state.
        }
      }
    }

    return Object.freeze({ read, write, clear });
  }

  function callbackDiagnosticForResult(callbackSource, result) {
    if (!callbackSource) return CALLBACK_DIAGNOSTIC_STATUSES.noCallback;
    if (result?.ok === true) return CALLBACK_DIAGNOSTIC_STATUSES.success;
    const code = String(result?.code || "");
    const stage = String(result?.callbackStage || "");
    if (stage === "pkce" || code === "SUPABASE_AUTH_PKCE_CONTEXT_UNAVAILABLE" || code.startsWith("SUPABASE_AUTH_PKCE_HTTP_")) {
      return CALLBACK_DIAGNOSTIC_STATUSES.pkce;
    }
    if (stage === "project-identity" || code === "SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_INVALID") {
      return CALLBACK_DIAGNOSTIC_STATUSES.project;
    }
    if (stage === "session-storage" || code === "SUPABASE_AUTH_SESSION_STORAGE_FAILED") {
      return CALLBACK_DIAGNOSTIC_STATUSES.storage;
    }
    if (stage === "user-probe"
      || code === "SUPABASE_AUTH_CALLBACK_USER_INVALID"
      || code === "SUPABASE_AUTH_NETWORK_ERROR"
      || code === "SUPABASE_AUTH_RESPONSE_IDENTITY_INVALID") {
      return CALLBACK_DIAGNOSTIC_STATUSES.user;
    }
    return CALLBACK_DIAGNOSTIC_STATUSES.shape;
  }

  function decodeBase64UrlJson(segment) {
    const source = String(segment || "");
    if (!source || source.length > TOKEN_MAX_LENGTH || !/^[A-Za-z0-9_-]+$/.test(source) || source.length % 4 === 1) return null;
    try {
      const base64 = source.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      let json;
      let canonical;
      if (typeof Buffer !== "undefined") {
        const bytes = Buffer.from(padded, "base64");
        canonical = bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        json = bytes.toString("utf8");
        if (!Buffer.from(json, "utf8").equals(bytes)) return null;
      } else {
        const binary = root.atob(padded);
        canonical = root.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        json = decodeURIComponent(Array.from(binary, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
      }
      if (canonical !== source) return null;
      const value = JSON.parse(json);
      return isRecord(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function parseCallbackParameters(rawValue, prefix, allowedFields) {
    const raw = String(rawValue || "");
    if (!raw) return Object.freeze({ ok: true, values: Object.freeze({}), count: 0 });
    if (raw.length > CALLBACK_MAX_LENGTH || raw[0] !== prefix || raw === prefix || /%(?![0-9A-Fa-f]{2})/.test(raw)) {
      return errorResult("SUPABASE_AUTH_CALLBACK_ENCODING_INVALID");
    }
    const values = {};
    let count = 0;
    try {
      const params = new URLSearchParams(raw.slice(1));
      for (const [key, value] of params.entries()) {
        count += 1;
        if (!allowedFields.has(key)
          || hasOwn(values, key)
          || value === ""
          || value.length > TOKEN_MAX_LENGTH
          || /[\u0000-\u001F\u007F]/.test(value)) {
          return errorResult("SUPABASE_AUTH_CALLBACK_FIELDS_INVALID");
        }
        values[key] = value;
      }
    } catch (error) {
      return errorResult("SUPABASE_AUTH_CALLBACK_ENCODING_INVALID");
    }
    if (count === 0) return errorResult("SUPABASE_AUTH_CALLBACK_FIELDS_INVALID");
    return Object.freeze({ ok: true, values: Object.freeze(values), count });
  }

  function exactMagicLinkPageIdentity(callbackSource) {
    if (!callbackSource || callbackSource.scrubbed !== true || callbackSource.oversized === true) return false;
    return String(callbackSource.origin || "") === MAGIC_LINK_CALLBACK_ORIGIN
      && MAGIC_LINK_CALLBACK_PATHS.has(String(callbackSource.pathname || ""));
  }

  function parseMagicLinkCallback(callbackSource) {
    if (!exactMagicLinkPageIdentity(callbackSource)) {
      return errorResult("SUPABASE_AUTH_CALLBACK_PAGE_IDENTITY_INVALID");
    }
    const query = parseCallbackParameters(callbackSource.search, "?", CALLBACK_QUERY_FIELDS);
    const fragment = parseCallbackParameters(callbackSource.hash, "#", CALLBACK_FRAGMENT_FIELDS);
    if (!query.ok) return query;
    if (!fragment.ok) return fragment;
    if (query.count > 0 && fragment.count > 0) return errorResult("SUPABASE_AUTH_CALLBACK_CONFLICT");
    if (query.count === 0 && fragment.count === 0) return errorResult("SUPABASE_AUTH_CALLBACK_MISSING");

    if (query.count > 0) {
      const values = query.values;
      const keys = Object.keys(values).sort();
      if (!keys.every((key) => ["code", "type"].includes(key))
        || !hasOwn(values, "code")
        || !AUTH_CODE_PATTERN.test(values.code)
        || (hasOwn(values, "type") && values.type !== "magiclink")) {
        return errorResult("SUPABASE_AUTH_CALLBACK_FIELDS_INVALID");
      }
      return Object.freeze({ ok: true, code: "", mode: "pkce", authCode: values.code });
    }

    const values = fragment.values;
    const required = ["access_token", "expires_in", "refresh_token", "token_type", "type"];
    if (!required.every((key) => hasOwn(values, key))
      || !Object.keys(values).every((key) => required.includes(key) || key === "expires_at")
      || values.type !== "magiclink"
      || String(values.token_type).toLowerCase() !== "bearer") {
      return errorResult("SUPABASE_AUTH_CALLBACK_FIELDS_INVALID");
    }
    const expiresIn = Number(values.expires_in);
    const expiresAt = hasOwn(values, "expires_at") ? Number(values.expires_at) : null;
    if (!Number.isSafeInteger(expiresIn)
      || expiresIn < 1
      || expiresIn > 86400
      || (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt < 1))
      || String(values.access_token).length > TOKEN_MAX_LENGTH
      || String(values.refresh_token).length < 20
      || String(values.refresh_token).length > TOKEN_MAX_LENGTH) {
      return errorResult("SUPABASE_AUTH_CALLBACK_SESSION_INVALID");
    }
    return Object.freeze({
      ok: true,
      code: "",
      mode: "implicit",
      accessToken: values.access_token,
      refreshToken: values.refresh_token,
      expiresAt,
    });
  }

  function validateMagicLinkAccessToken(accessToken, config, nowSeconds) {
    const token = String(accessToken || "");
    const projectRef = String(config?.expectedProjectRef || "");
    const projectUrl = normalizeUrl(config?.projectUrl);
    if (!PROJECT_REF_PATTERN.test(projectRef)
      || projectUrl !== `https://${projectRef}.supabase.co`
      || token.length > TOKEN_MAX_LENGTH) {
      return null;
    }
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[2] || !/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
    const header = decodeBase64UrlJson(parts[0]);
    const payload = decodeBase64UrlJson(parts[1]);
    if (!header
      || !payload
      || !["HS256", "RS256", "ES256"].includes(header.alg)
      || (hasOwn(header, "typ") && header.typ !== "JWT")
      || payload.iss !== `${projectUrl}/auth/v1`
      || payload.role !== "authenticated"
      || !UUID_PATTERN.test(String(payload.sub || ""))
      || (hasOwn(payload, "ref") && payload.ref !== projectRef)) {
      return null;
    }
    const audience = payload.aud;
    if (audience !== "authenticated"
      && !(Array.isArray(audience) && audience.length > 0 && audience.every((entry) => entry === "authenticated"))) {
      return null;
    }
    const expiresAt = Number(payload.exp);
    return Number.isSafeInteger(expiresAt) && expiresAt > nowSeconds ? payload : null;
  }

  function normalizeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.origin : "";
    } catch (error) {
      return "";
    }
  }

  function normalizeSession(source, issuedAtSeconds = null) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return null;
    const accessToken = String(source.access_token || "");
    const refreshToken = String(source.refresh_token || "");
    const expiresIn = Number(source.expires_in);
    const expiresAt = hasOwn(source, "expires_at")
      ? Number(source.expires_at)
      : (Number.isSafeInteger(issuedAtSeconds)
        && Number.isSafeInteger(expiresIn)
        && expiresIn > 0
        && expiresIn <= 86400
          ? issuedAtSeconds + expiresIn
          : Number.NaN);
    const user = source.user && typeof source.user === "object" ? source.user : null;
    const userId = String(user?.id || "");
    if (accessToken.length < 32 || refreshToken.length < 20 || !Number.isFinite(expiresAt) || expiresAt <= 0 || !userId) {
      return null;
    }
    return Object.freeze({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(expiresAt),
      expires_in: Number.isFinite(expiresIn) ? expiresIn : 0,
      token_type: String(source.token_type || "bearer"),
      user: Object.freeze({
        id: userId,
        email: String(user.email || ""),
      }),
    });
  }

  function safeSession(session) {
    if (!session) return null;
    return Object.freeze({
      user: Object.freeze({ id: session.user.id, email: session.user.email }),
      expiresAt: session.expires_at,
    });
  }

  async function responseJson(response) {
    if (!response || typeof response !== "object") return null;
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function createSupabaseAuthProvider({ config, fetchImpl, storage, now } = {}) {
    const projectUrl = normalizeUrl(config?.projectUrl);
    const publishableKey = String(config?.publishableKey || "");
    const projectRef = String(config?.expectedProjectRef || "");
    const organizationId = String(config?.organizationId || "").toLowerCase();
    const request = typeof fetchImpl === "function"
      ? fetchImpl
      : (typeof root?.fetch === "function" ? root.fetch.bind(root) : null);
    const sessionStorage = storage !== undefined ? storage : (root?.localStorage || null);
    const nowMs = typeof now === "function" ? now : () => Date.now();
    const sessionKey = projectRef ? `sb-${projectRef}-auth-token` : "";
    const pkceVerifierKey = sessionKey ? `${sessionKey}-code-verifier` : "";
    const listeners = new Set();
    let currentSession = null;
    let sessionRevision = 0;
    let refreshing = null;
    let callbackConsumed = false;
    let lastSessionReadStatus = "missing";

    function emit(event) {
      const snapshot = safeSession(currentSession);
      for (const listener of listeners) {
        try {
          listener(String(event), snapshot);
        } catch (error) {
          // Subscriber failures must not change Auth or sync state.
        }
      }
    }

    function replaceCurrentSession(sessionValue) {
      currentSession = sessionValue || null;
      sessionRevision += 1;
      return currentSession;
    }

    function readStoredSession() {
      if (!sessionStorage || !sessionKey) {
        lastSessionReadStatus = "unavailable";
        return null;
      }
      try {
        const raw = sessionStorage.getItem(sessionKey);
        if (!raw) {
          lastSessionReadStatus = "missing";
          return null;
        }
        const value = normalizeSession(JSON.parse(raw));
        lastSessionReadStatus = value ? "ok" : "invalid";
        return value;
      } catch (error) {
        lastSessionReadStatus = "failed";
        return null;
      }
    }

    function writeStoredSession(sessionValue) {
      if (!sessionStorage || !sessionKey) return false;
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionValue));
        return true;
      } catch (error) {
        return false;
      }
    }

    function clearStoredSession() {
      replaceCurrentSession(null);
      if (!sessionStorage || !sessionKey) return;
      try {
        sessionStorage.removeItem(sessionKey);
      } catch (error) {
        // Storage denial already leaves the provider signed out in memory.
      }
    }

    function sessionIsFresh(sessionValue) {
      const nowSeconds = Math.floor(Number(nowMs()) / 1000);
      return Boolean(sessionValue && sessionValue.expires_at > nowSeconds + SESSION_REFRESH_MARGIN_SECONDS);
    }

    function status() {
      const snapshot = safeSession(currentSession);
      return Object.freeze({
        configured: Boolean(projectUrl && publishableKey && projectRef && organizationId && request && sessionStorage),
        signedIn: Boolean(snapshot),
        user: snapshot?.user || null,
        expiresAt: snapshot?.expiresAt || null,
        sessionStorageKey: sessionKey,
      });
    }

    async function post(path, body, accessToken) {
      if (!request || !projectUrl || !publishableKey) return errorResult("SUPABASE_AUTH_CONFIGURATION_INVALID");
      const headers = {
        apikey: publishableKey,
        "Content-Type": "application/json",
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      try {
        const response = await request(`${projectUrl}${path}`, {
          method: "POST",
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
        });
        const value = await responseJson(response);
        return { ok: response.ok === true, status: Number(response.status), value };
      } catch (error) {
        return errorResult("SUPABASE_AUTH_NETWORK_ERROR");
      }
    }

    async function exactAuthRequest(path, { method, body, accessToken } = {}) {
      if (!request || !projectUrl || !publishableKey) return errorResult("SUPABASE_AUTH_CONFIGURATION_INVALID");
      const url = `${projectUrl}${path}`;
      const headers = { apikey: publishableKey };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      let response;
      try {
        response = await request(url, {
          method: String(method || "GET"),
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
        });
      } catch (error) {
        return errorResult("SUPABASE_AUTH_NETWORK_ERROR");
      }
      if (!response || response.redirected !== false || response.url !== url) {
        return errorResult("SUPABASE_AUTH_RESPONSE_IDENTITY_INVALID");
      }
      const value = await responseJson(response);
      return Object.freeze({ ok: response.ok === true, status: Number(response.status), value });
    }

    async function setSession(source) {
      if (!isRecord(source)) return errorResult("SUPABASE_AUTH_CALLBACK_SESSION_INVALID");
      const accessToken = String(source.access_token || "");
      const refreshToken = String(source.refresh_token || "");
      const nowSeconds = Math.floor(Number(nowMs()) / 1000);
      const claims = validateMagicLinkAccessToken(accessToken, config, nowSeconds);
      if (!claims
        || refreshToken.length < 20
        || refreshToken.length > TOKEN_MAX_LENGTH) {
        return errorResult("SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_INVALID");
      }

      const verified = await exactAuthRequest("/auth/v1/user", { method: "GET", accessToken });
      const user = verified.ok && isRecord(verified.value) ? verified.value : null;
      if (!user || String(user.id || "") !== String(claims.sub)) {
        return errorResult(verified.code || "SUPABASE_AUTH_CALLBACK_USER_INVALID");
      }
      const sessionValue = normalizeSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Number(claims.exp),
        expires_in: Math.max(0, Number(claims.exp) - nowSeconds),
        token_type: "bearer",
        user: {
          id: String(user.id),
          email: String(user.email || ""),
        },
      });
      if (!sessionValue || !writeStoredSession(sessionValue)) {
        return errorResult("SUPABASE_AUTH_SESSION_STORAGE_FAILED");
      }
      replaceCurrentSession(sessionValue);
      emit("SIGNED_IN");
      return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
    }

    function consumePkceVerifier() {
      if (!sessionStorage || !pkceVerifierKey) return null;
      let stored = "";
      try {
        stored = String(sessionStorage.getItem(pkceVerifierKey) || "");
        sessionStorage.removeItem(pkceVerifierKey);
      } catch (error) {
        return null;
      }
      const parts = stored.split("/");
      if (parts.length > 2
        || !PKCE_VERIFIER_PATTERN.test(parts[0] || "")
        || (parts.length === 2 && parts[1] !== "MAGIC_LINK")) {
        return null;
      }
      return parts[0];
    }

    async function exchangeCodeForSession(authCode) {
      const code = String(authCode || "");
      if (!AUTH_CODE_PATTERN.test(code)) return errorResult("SUPABASE_AUTH_CALLBACK_FIELDS_INVALID");
      const codeVerifier = consumePkceVerifier();
      if (!codeVerifier) return errorResult("SUPABASE_AUTH_PKCE_CONTEXT_UNAVAILABLE");
      const exchanged = await exactAuthRequest("/auth/v1/token?grant_type=pkce", {
        method: "POST",
        body: { auth_code: code, code_verifier: codeVerifier },
      });
      if (!exchanged.ok || !isRecord(exchanged.value)) {
        return errorResult(exchanged.code || `SUPABASE_AUTH_PKCE_HTTP_${exchanged.status || 0}`);
      }
      const nowSeconds = Math.floor(Number(nowMs()) / 1000);
      const claims = validateMagicLinkAccessToken(exchanged.value.access_token, config, nowSeconds);
      const sessionValue = normalizeSession({
        ...exchanged.value,
        expires_at: Number(exchanged.value.expires_at || claims?.exp),
      });
      if (!claims) return errorResult("SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_INVALID");
      if (!sessionValue || sessionValue.user.id !== String(claims.sub)) {
        return errorResult("SUPABASE_AUTH_CALLBACK_USER_INVALID");
      }
      if (!writeStoredSession(sessionValue)) return errorResult("SUPABASE_AUTH_SESSION_STORAGE_FAILED");
      replaceCurrentSession(sessionValue);
      emit("SIGNED_IN");
      return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
    }

    async function establishMagicLinkSession(callbackSource) {
      if (callbackConsumed) return errorResult("SUPABASE_AUTH_CALLBACK_ALREADY_CONSUMED");
      callbackConsumed = true;
      const parsed = parseMagicLinkCallback(callbackSource);
      if (!parsed.ok) return Object.freeze({ ...parsed, callbackStage: "callback-shape" });
      const result = parsed.mode === "implicit"
        ? await setSession({ access_token: parsed.accessToken, refresh_token: parsed.refreshToken })
        : await exchangeCodeForSession(parsed.authCode);
      if (!result.ok) {
        const code = String(result.code || "");
        let callbackStage = parsed.mode === "pkce" ? "pkce" : "user-probe";
        if (code === "SUPABASE_AUTH_CALLBACK_PROJECT_IDENTITY_INVALID") callbackStage = "project-identity";
        else if (code === "SUPABASE_AUTH_SESSION_STORAGE_FAILED") callbackStage = "session-storage";
        return Object.freeze({ ...result, callbackStage });
      }
      return Object.freeze({ ok: true, code: "", callback: parsed.mode, session: result.session });
    }

    async function refreshSession() {
      if (refreshing) return refreshing;
      const source = currentSession || readStoredSession();
      if (!source?.refresh_token) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult("SUPABASE_AUTH_SESSION_EXPIRED");
      }
      const refreshRevision = sessionRevision;
      refreshing = (async () => {
        const response = await post("/auth/v1/token?grant_type=refresh_token", {
          refresh_token: source.refresh_token,
        });
        if (sessionRevision !== refreshRevision) {
          return currentSession
            ? Object.freeze({ ok: true, code: "", session: safeSession(currentSession), superseded: true })
            : errorResult("SUPABASE_AUTH_SESSION_SUPERSEDED");
        }
        const renewed = response.ok
          ? normalizeSession(response.value, Math.floor(Number(nowMs()) / 1000))
          : null;
        if (!renewed || !writeStoredSession(renewed)) {
          clearStoredSession();
          emit("SIGNED_OUT");
          return errorResult("SUPABASE_AUTH_SESSION_EXPIRED");
        }
        replaceCurrentSession(renewed);
        emit("TOKEN_REFRESHED");
        return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
      })();
      try {
        return await refreshing;
      } finally {
        refreshing = null;
      }
    }

    async function restoreSession() {
      const stored = readStoredSession();
      if (!stored) {
        clearStoredSession();
        emit("INITIAL_SESSION");
        return errorResult(["invalid", "failed", "unavailable"].includes(lastSessionReadStatus)
          ? "SUPABASE_AUTH_SESSION_STORAGE_FAILED"
          : "SUPABASE_AUTH_SIGNED_OUT");
      }
      replaceCurrentSession(stored);
      if (!sessionIsFresh(currentSession)) return refreshSession();
      emit("INITIAL_SESSION");
      return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
    }

    async function signInWithPassword(email, password) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const suppliedPassword = String(password || "");
      if (!EMAIL_PATTERN.test(normalizedEmail) || suppliedPassword.length < 8) {
        return errorResult("SUPABASE_AUTH_CREDENTIAL_INPUT_INVALID");
      }
      const response = await post("/auth/v1/token?grant_type=password", {
        email: normalizedEmail,
        password: suppliedPassword,
      });
      const signedInSession = response.ok
        ? normalizeSession(response.value, Math.floor(Number(nowMs()) / 1000))
        : null;
      if (!signedInSession) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult(response.ok
          ? "SUPABASE_AUTH_LOGIN_RESPONSE_INVALID"
          : (response.code || `SUPABASE_AUTH_HTTP_${response.status || 0}`));
      }
      if (!writeStoredSession(signedInSession)) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult("SUPABASE_AUTH_SESSION_STORAGE_FAILED");
      }
      replaceCurrentSession(signedInSession);
      emit("SIGNED_IN");
      return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
    }

    async function getAccessToken() {
      if (!currentSession) replaceCurrentSession(readStoredSession());
      if (!currentSession) return "";
      if (!sessionIsFresh(currentSession)) {
        const refreshed = await refreshSession();
        if (!refreshed.ok) return "";
      }
      return String(currentSession?.access_token || "");
    }

    async function verifyOwnerMembership() {
      const accessToken = await getAccessToken();
      if (!accessToken) return errorResult("SUPABASE_AUTH_SIGNED_OUT");
      const response = await post("/rest/v1/rpc/get_my_app_context", {
        p_organization_id: organizationId,
      }, accessToken);
      if (!response.ok) {
        if (response.status === 401) return errorResult("SUPABASE_AUTH_TOKEN_EXPIRED");
        if (response.status === 403) return errorResult("SUPABASE_AUTH_OWNER_REQUIRED");
        return errorResult(response.code || `SUPABASE_AUTH_OWNER_GATE_HTTP_${response.status || 0}`);
      }
      const value = response.value && typeof response.value === "object" ? response.value : null;
      if (!value || value.ok !== true) return errorResult("SUPABASE_AUTH_MEMBERSHIP_INVALID");
      if (String(value.organization_id || "").toLowerCase() !== organizationId) {
        return errorResult("SUPABASE_AUTH_ORGANIZATION_MISMATCH");
      }
      if (String(value.role || "") !== "owner") return errorResult("SUPABASE_AUTH_OWNER_REQUIRED");
      return Object.freeze({ ok: true, code: "", role: "owner", organizationId });
    }

    async function bootstrapFirstOwner() {
      const accessToken = await getAccessToken();
      if (!accessToken) return errorResult("SUPABASE_AUTH_SIGNED_OUT");
      const response = await post("/rest/v1/rpc/bootstrap_authenticated_first_owner_v1", {}, accessToken);
      if (!response.ok) {
        if (response.status === 401) return errorResult("SUPABASE_AUTH_TOKEN_EXPIRED");
        if (response.status === 403) return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_DENIED");
        return errorResult(`SUPABASE_AUTH_OWNER_BOOTSTRAP_HTTP_${response.status || 0}`);
      }
      const value = response.value && typeof response.value === "object" ? response.value : null;
      if (!value || value.ok !== true) {
        const code = String(value?.code || "");
        if (code === "BOOTSTRAP_CLOSED") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_CLOSED");
        if (code === "AUTH_REQUIRED") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_AUTH_REQUIRED");
        if (code === "AUTH_EMAIL_REQUIRED") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_EMAIL_REQUIRED");
        if (code === "ORGANIZATION_NOT_FOUND") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_ORGANIZATION_NOT_FOUND");
        return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_RESULT_INVALID");
      }
      if (String(value.organization_id || "").toLowerCase() !== organizationId
        || String(value.role || "") !== "owner") {
        return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_RESULT_INVALID");
      }
      return Object.freeze({ ok: true, code: "", role: "owner", organizationId });
    }

    async function signOut() {
      if (!currentSession) replaceCurrentSession(readStoredSession());
      const accessToken = currentSession?.access_token || "";
      let remoteOk = true;
      if (accessToken) {
        const response = await post("/auth/v1/logout?scope=local", undefined, accessToken);
        remoteOk = response.ok === true || response.status === 401;
      }
      clearStoredSession();
      emit("SIGNED_OUT");
      return remoteOk
        ? Object.freeze({ ok: true, code: "" })
        : errorResult("SUPABASE_AUTH_LOGOUT_REMOTE_FAILED");
    }

    function onAuthStateChange(callback) {
      if (typeof callback !== "function") return Object.freeze({ unsubscribe() {} });
      listeners.add(callback);
      return Object.freeze({ unsubscribe: () => listeners.delete(callback) });
    }

    return Object.freeze({
      signInWithPassword,
      setSession,
      exchangeCodeForSession,
      establishMagicLinkSession,
      signOut,
      restoreSession,
      refreshSession,
      getAccessToken,
      verifyOwnerMembership,
      bootstrapFirstOwner,
      onAuthStateChange,
      status,
      sessionStorageKey: sessionKey,
    });
  }

  function createUnavailableProvider(code) {
    const unavailable = () => Promise.resolve(errorResult(code));
    return Object.freeze({
      signInWithPassword: unavailable,
      setSession: unavailable,
      exchangeCodeForSession: unavailable,
      establishMagicLinkSession: unavailable,
      signOut: unavailable,
      restoreSession: unavailable,
      refreshSession: unavailable,
      getAccessToken: async () => "",
      verifyOwnerMembership: unavailable,
      bootstrapFirstOwner: unavailable,
      onAuthStateChange: () => Object.freeze({ unsubscribe() {} }),
      status: () => Object.freeze({ configured: false, signedIn: false, user: null, expiresAt: null, sessionStorageKey: "" }),
      sessionStorageKey: "",
    });
  }

  function createRuntimeAuthIntegration({ config, authProvider, configApi, fetchImpl, eventTarget, callbackDiagnosticStorage, callbackTelemetryPublisher, initialCallbackTelemetry } = {}) {
    const provider = authProvider || createUnavailableProvider("SUPABASE_PUBLIC_CONFIG_REQUIRED");
    const publicConfig = config && typeof config === "object" ? config : null;
    const target = eventTarget || null;
    const callbackDiagnostics = createCallbackDiagnosticStore(callbackDiagnosticStorage);
    let ownerVerified = false;
    let authorizationPhase = "idle";
    let ownerBootstrapPhase = "idle";
    let lastCode = publicConfig ? "SUPABASE_AUTH_SIGNED_OUT" : "SUPABASE_PUBLIC_CONFIG_REQUIRED";
    let loginStage = "idle";
    let callbackStage = "";
    let callbackTelemetry = initialCallbackTelemetry
      ? normalizeCallbackTelemetry(initialCallbackTelemetry)
      : emptyCallbackTelemetry();
    let lastPushResult = null;
    let authTransitionRevision = 0;
    let initializeRevision = 0;

    function syncConfiguration(enabled = authorizationPhase === "authorized" || authorizationPhase === "in-flight") {
      if (!publicConfig) {
        return Object.freeze({ enabled: false, mode: "local-only", code: "SUPABASE_PUBLIC_CONFIG_REQUIRED", expectedPreviousRevision: 0 });
      }
      return Object.freeze({
        enabled: enabled === true,
        mode: enabled === true ? "push-only" : "local-only",
        code: enabled === true ? "" : lastCode || "SUPABASE_FORMAL_PUSH_NOT_AUTHORIZED",
        url: String(publicConfig.projectUrl || ""),
        anonKey: String(publicConfig.publishableKey || ""),
        organizationId: String(publicConfig.organizationId || ""),
        organizationSlug: String(publicConfig.organizationSlug || ""),
        expectedPreviousRevision: Number(publicConfig.expectedPreviousRevision),
        getAccessToken: provider.getAccessToken,
        fetchImpl: typeof fetchImpl === "function" ? fetchImpl : undefined,
      });
    }

    function publicStatus() {
      const auth = provider.status();
      const canBootstrapFirstOwner = Boolean(
        publicConfig
        && auth.signedIn
        && !ownerVerified
        && ownerBootstrapPhase === "idle"
        && lastCode === "SUPABASE_AUTH_MEMBERSHIP_INVALID"
      );
      return Object.freeze({
        configured: Boolean(publicConfig && auth.configured),
        configCode: publicConfig ? "" : "SUPABASE_PUBLIC_CONFIG_REQUIRED",
        signedIn: auth.signedIn === true,
        user: auth.user || null,
        ownerVerified,
        formalAuthorized: authorizationPhase === "authorized",
        phase: authorizationPhase,
        canAuthorize: Boolean(publicConfig && auth.signedIn && ownerVerified && authorizationPhase === "idle"),
        canPush: Boolean(publicConfig && auth.signedIn && ownerVerified && authorizationPhase === "authorized"),
        canBootstrapFirstOwner,
        ownerBootstrapPhase,
        code: String(lastCode || ""),
        loginStage,
        callbackStage,
        callbackTelemetry,
        lastPushOk: lastPushResult?.ok === true,
      });
    }

    function publish() {
      const facade = syncConfiguration();
      if (configApi && typeof configApi.publishSyncFacade === "function") configApi.publishSyncFacade(facade);
      const status = publicStatus();
      if (typeof callbackTelemetryPublisher === "function") {
        try {
          callbackTelemetryPublisher(status.callbackTelemetry, status);
        } catch (error) {
          // Diagnostic rendering cannot alter Auth or authorization state.
        }
      }
      if (target && typeof target.dispatchEvent === "function" && typeof root?.CustomEvent === "function") {
        try {
          target.dispatchEvent(new root.CustomEvent("materials-quote-supabase-auth-change", { detail: status }));
        } catch (error) {
          // A UI notification failure must not alter authorization.
        }
      }
      return status;
    }

    async function initialize(callbackSource = null) {
      const transitionAtStart = authTransitionRevision;
      const currentInitializeRevision = ++initializeRevision;
      const hadCallback = Boolean(callbackSource);
      callbackTelemetry = hadCallback
        ? normalizeCallbackTelemetry(callbackSource?.telemetry)
        : emptyCallbackTelemetry();
      const restored = callbackSource
        ? await provider.establishMagicLinkSession(callbackSource)
        : await provider.restoreSession();
      if (transitionAtStart !== authTransitionRevision || currentInitializeRevision !== initializeRevision) {
        return restored;
      }
      ownerVerified = false;
      authorizationPhase = "idle";
      if (hadCallback) {
        const diagnostic = callbackDiagnostics.write(callbackDiagnosticForResult(callbackSource, restored));
        lastCode = diagnostic.code;
        callbackStage = diagnostic.stage;
        callbackTelemetry = finalizeCallbackTelemetry(callbackTelemetry, diagnostic, restored);
      } else if (!restored.ok) {
        const previous = callbackDiagnostics.read();
        const diagnostic = previous || callbackDiagnostics.write(
          restored.code === "SUPABASE_AUTH_SESSION_STORAGE_FAILED"
            ? CALLBACK_DIAGNOSTIC_STATUSES.storage
            : CALLBACK_DIAGNOSTIC_STATUSES.noCallback,
        );
        lastCode = diagnostic.code;
        callbackStage = diagnostic.stage;
      } else {
        lastCode = "SUPABASE_AUTH_OWNER_GATE_REQUIRED";
        callbackStage = "";
      }
      publish();
      return restored;
    }

    async function signInWithPassword(email, password) {
      authTransitionRevision += 1;
      callbackDiagnostics.clear();
      callbackStage = "";
      callbackTelemetry = emptyCallbackTelemetry();
      authorizationPhase = "idle";
      ownerVerified = false;
      if (ownerBootstrapPhase !== "consumed") ownerBootstrapPhase = "idle";
      lastPushResult = null;
      loginStage = "request-pending";
      publish();
      const signedIn = await provider.signInWithPassword(email, password);
      if (!signedIn.ok) {
        lastCode = signedIn.code;
        loginStage = signedIn.code === "SUPABASE_AUTH_LOGIN_RESPONSE_INVALID"
          ? "response-invalid"
          : (signedIn.code === "SUPABASE_AUTH_SESSION_STORAGE_FAILED" ? "storage-rejected" : "request-rejected");
        publish();
        return signedIn;
      }
      loginStage = "session-established";
      publish();
      const gate = await verifyOwnerMembership();
      loginStage = "owner-gate-complete";
      publish();
      return gate.ok ? signedIn : gate;
    }

    async function signOut() {
      authTransitionRevision += 1;
      callbackDiagnostics.clear();
      callbackStage = "";
      loginStage = "idle";
      lastCode = "SUPABASE_AUTH_SIGNED_OUT";
      authorizationPhase = "idle";
      ownerVerified = false;
      lastPushResult = null;
      const result = await provider.signOut();
      lastCode = result.ok ? "SUPABASE_AUTH_SIGNED_OUT" : result.code;
      publish();
      return result;
    }

    async function verifyOwnerMembership() {
      if (!publicConfig) {
        lastCode = "SUPABASE_PUBLIC_CONFIG_REQUIRED";
        ownerVerified = false;
        publish();
        return errorResult(lastCode);
      }
      const gate = await provider.verifyOwnerMembership();
      ownerVerified = gate.ok === true;
      lastCode = gate.ok ? "SUPABASE_FORMAL_PUSH_CONFIRMATION_REQUIRED" : gate.code;
      if (!gate.ok) authorizationPhase = authorizationPhase === "consumed" ? "consumed" : "idle";
      publish();
      return gate;
    }

    async function bootstrapFirstOwner() {
      const auth = provider.status();
      if (!publicConfig) return errorResult("SUPABASE_PUBLIC_CONFIG_REQUIRED");
      if (!auth.signedIn) return errorResult("SUPABASE_AUTH_SIGNED_OUT");
      if (ownerBootstrapPhase === "in-flight") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_IN_FLIGHT");
      if (ownerBootstrapPhase === "consumed") return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_ALREADY_CONSUMED");
      if (ownerVerified || lastCode !== "SUPABASE_AUTH_MEMBERSHIP_INVALID") {
        return errorResult("SUPABASE_AUTH_OWNER_BOOTSTRAP_NOT_AVAILABLE");
      }
      ownerBootstrapPhase = "in-flight";
      lastCode = "SUPABASE_AUTH_OWNER_BOOTSTRAP_IN_FLIGHT";
      publish();
      const created = await provider.bootstrapFirstOwner();
      ownerBootstrapPhase = "consumed";
      if (!created.ok) {
        ownerVerified = false;
        lastCode = created.code;
        publish();
        return created;
      }
      const gate = await provider.verifyOwnerMembership();
      ownerVerified = gate.ok === true;
      lastCode = gate.ok
        ? "SUPABASE_FORMAL_PUSH_CONFIRMATION_REQUIRED"
        : "SUPABASE_AUTH_OWNER_BOOTSTRAP_POSTCHECK_FAILED";
      publish();
      return gate.ok
        ? Object.freeze({ ok: true, code: "", role: "owner", organizationId: String(publicConfig.organizationId || "") })
        : errorResult(lastCode);
    }

    async function authorizeFormalPushOnce({ confirmation, artifactGatesAccepted } = {}) {
      if (authorizationPhase === "in-flight") return errorResult("SUPABASE_FORMAL_PUSH_IN_FLIGHT");
      if (authorizationPhase === "consumed") return errorResult("SUPABASE_FORMAL_PUSH_ALREADY_CONSUMED");
      if (!publicConfig) return errorResult("SUPABASE_PUBLIC_CONFIG_REQUIRED");
      if (confirmation !== FORMAL_PUSH_CONFIRMATION || artifactGatesAccepted !== true) {
        lastCode = "SUPABASE_FORMAL_PUSH_CONFIRMATION_REQUIRED";
        publish();
        return errorResult(lastCode);
      }
      const gate = await verifyOwnerMembership();
      if (!gate.ok) return gate;
      authorizationPhase = "authorized";
      lastCode = "";
      lastPushResult = null;
      publish();
      return Object.freeze({ ok: true, code: "" });
    }

    async function executeFormalPush(push) {
      if (authorizationPhase === "in-flight") return errorResult("SUPABASE_FORMAL_PUSH_IN_FLIGHT");
      if (authorizationPhase === "consumed") return errorResult("SUPABASE_FORMAL_PUSH_ALREADY_CONSUMED");
      if (authorizationPhase !== "authorized" || typeof push !== "function") {
        return errorResult("SUPABASE_FORMAL_PUSH_NOT_AUTHORIZED");
      }
      authorizationPhase = "in-flight";
      lastCode = "";
      publish();
      const gate = await provider.verifyOwnerMembership();
      ownerVerified = gate.ok === true;
      if (!gate.ok) {
        authorizationPhase = "consumed";
        lastCode = gate.code;
        lastPushResult = gate;
        publish();
        return gate;
      }
      let result;
      try {
        result = await push();
      } catch (error) {
        result = errorResult("SUPABASE_FORMAL_PUSH_FAILED");
      }
      if (!result || typeof result !== "object") result = errorResult("SUPABASE_FORMAL_PUSH_RESULT_INVALID");
      authorizationPhase = "consumed";
      lastCode = result.ok ? "" : String(result.code || "SUPABASE_FORMAL_PUSH_FAILED");
      lastPushResult = result;
      publish();
      return result;
    }

    provider.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        ownerVerified = false;
        if (authorizationPhase !== "consumed") authorizationPhase = "idle";
        const diagnostic = CALLBACK_DIAGNOSTIC_BY_CODE.get(lastCode);
        if (!diagnostic || diagnostic === CALLBACK_DIAGNOSTIC_STATUSES.success) {
          lastCode = "SUPABASE_AUTH_SIGNED_OUT";
          callbackStage = "";
        }
      }
      publish();
    });

    publish();

    return Object.freeze({
      initialize,
      signInWithPassword,
      signOut,
      verifyOwnerMembership,
      bootstrapFirstOwner,
      authorizeFormalPushOnce,
      executeFormalPush,
      getSyncConfiguration: syncConfiguration,
      status: publicStatus,
      authProvider: provider,
    });
  }

  function bootstrapBrowserRuntime(browserRoot = root) {
    if (!browserRoot || browserRoot.MaterialsQuoteSupabaseRuntime) return browserRoot?.MaterialsQuoteSupabaseRuntime || null;
    const configApi = browserRoot.MaterialsQuoteSupabaseRuntimeConfig;
    const config = configApi?.getCurrentConfiguration?.() || null;
    const fetchImpl = typeof browserRoot.fetch === "function" ? browserRoot.fetch.bind(browserRoot) : null;
    let browserStorage = null;
    let callbackDiagnosticStorage = null;
    try {
      browserStorage = browserRoot.localStorage;
    } catch (error) {
      browserStorage = null;
    }
    try {
      callbackDiagnosticStorage = browserRoot.sessionStorage;
    } catch (error) {
      callbackDiagnosticStorage = null;
    }
    let callbackSource = browserRoot.MaterialsQuoteSupabaseAuthCallback || null;
    const provider = config
      ? createSupabaseAuthProvider({ config, fetchImpl, storage: browserStorage })
      : createUnavailableProvider(configApi?.status?.().code || "SUPABASE_PUBLIC_CONFIG_REQUIRED");
    const integration = createRuntimeAuthIntegration({
      config,
      authProvider: provider,
      configApi,
      fetchImpl,
      eventTarget: browserRoot,
      callbackDiagnosticStorage,
      initialCallbackTelemetry: callbackSource?.telemetry || null,
      callbackTelemetryPublisher: (telemetry, status) => {
        const bridge = browserRoot.MaterialsQuoteSupabaseAuthCallbackBridge;
        if (bridge && typeof bridge.writeGlobalTelemetry === "function") {
          bridge.writeGlobalTelemetry(browserRoot, telemetry, status?.signedIn === true ? "signed-in" : "signed-out");
        }
      },
    });
    browserRoot.MaterialsQuoteSupabaseRuntime = integration;
    browserRoot.MaterialsQuoteSupabaseSyncConfig = integration.getSyncConfiguration();
    try {
      delete browserRoot.MaterialsQuoteSupabaseAuthCallback;
    } catch (error) {
      try {
        browserRoot.MaterialsQuoteSupabaseAuthCallback = null;
      } catch (ignored) {
        // The provider still enforces a single callback consumption.
      }
    }
    Promise.resolve(integration.initialize(callbackSource)).then((result) => {
      callbackSource = null;
      if (result?.ok === true && result.callback && browserRoot.location) {
        browserRoot.location.hash = "#/settings/company";
      }
    });
    if (config && typeof browserRoot.addEventListener === "function") {
      browserRoot.addEventListener("storage", (event) => {
        if (event?.key === provider.sessionStorageKey) integration.initialize();
      });
    }
    return integration;
  }

  return Object.freeze({
    FORMAL_PUSH_CONFIRMATION,
    AUTH_RUNTIME_VERSION,
    MAGIC_LINK_CALLBACK_URL,
    MAGIC_LINK_CALLBACK_URLS,
    CALLBACK_DIAGNOSTIC_STORAGE_KEY,
    CALLBACK_DIAGNOSTIC_STATUSES,
    parseMagicLinkCallback,
    validateMagicLinkAccessToken,
    createSupabaseAuthProvider,
    createRuntimeAuthIntegration,
    bootstrapBrowserRuntime,
  });
});
