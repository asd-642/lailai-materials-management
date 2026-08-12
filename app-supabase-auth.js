(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuth = api;
  if (root && root.document) api.bootstrapBrowserRuntime(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const FORMAL_PUSH_CONFIRMATION = "å•Ÿç”¨å”¯ä¸€æ­£å¼æŽ¨é€";
  const AUTH_RUNTIME_VERSION = "20260812-login-session-continuation-001";
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

  function errorResult(code) {
    return Object.freeze({ ok: false, code: String(code || "SUPABASE_AUTH_REJECTED") });
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
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
    const sessionStorage = çM5¶‰žËkºwµç]•É…Í” ¤€„ôô½É…¹¥é…Ñ¥½¹%(€€€€€€€ñðMÑÉ¥¹œ¡Ù…±Õ”¹É½±”ñð€ˆˆ¤€„ôô€‰½Ý¹•Èˆ¤ì(€€€€€€€É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}=]9I}	==QMQIA}IMU1Q}%9Y1%ˆ¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì½¬èÑÉÕ”°½‘”è€ˆˆ°É½±”è€‰½Ý¹•Èˆ°½É…¹¥é…Ñ¥½¹%ô¤ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸Í¥¹=ÕÐ ¤ì(€€€€€¥˜€ …ÕÉÉ•¹ÑM•ÍÍ¥½¸¤ÕÉÉ•¹ÑM•ÍÍ¥½¸€ôÉ•…‘MÑ½É•‘M•ÍÍ¥½¸ ¤ì(€€€€€½¹ÍÐ…•ÍÍQ½­•¸€ôÕÉÉ•¹ÑM•ÍÍ¥½¸ü¹…•ÍÍ}Ñ½­•¸ñð€ˆˆì(€€€€€±•ÐÉ•µ½Ñ•=¬€ôÑÉÕ”ì(€€€€€¥˜€¡…•ÍÍQ½­•¸¤ì(€€€€€€€½¹ÍÐÉ•ÍÁ½¹Í”€ô…Ý…¥ÐÁ½ÍÐ ˆ½…ÕÑ ½ØÄ½±½½ÕÐýÍ½Á”õ±½…°ˆ°Õ¹‘•™¥¹•°…•ÍÍQ½­•¸¤ì(€€€€€€€É•µ½Ñ•=¬€ôÉ•ÍÁ½¹Í”¹½¬€ôôôÑÉÕ”ñðÉ•ÍÁ½¹Í”¹ÍÑ…ÑÕÌ€ôôô€ÐÀÄì(€€€€€ô(€€€€€±•…ÉMÑ½É•‘M•ÍÍ¥½¸ ¤ì(€€€€€•µ¥Ð ‰M%9}=UPˆ¤ì(€€€€€É•ÑÕÉ¸É•µ½Ñ•=¬(€€€€€€€€ü=‰©•Ð¹™É••é”¡ì½¬èÑÉÕ”°½‘”è€ˆˆô¤(€€€€€€€€è•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}1==UQ}I5=Q}%1ˆ¤ì(€€€ô((€€€™Õ¹Ñ¥½¸½¹ÕÑ¡MÑ…Ñ•¡…¹”¡…±±‰…¬¤ì(€€€€€¥˜€¡ÑåÁ•½˜…±±‰…¬€„ôô€‰™Õ¹Ñ¥½¸ˆ¤É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ìÕ¹ÍÕ‰ÍÉ¥‰” ¤íôô¤ì(€€€€€±¥ÍÑ•¹•ÉÌ¹…‘¡…±±‰…¬¤ì(€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ìÕ¹ÍÕ‰ÍÉ¥‰”è€ ¤€ôø±¥ÍÑ•¹•ÉÌ¹‘•±•Ñ”¡…±±‰…¬¤ô¤ì(€€€ô((€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€€€Í¥¹%¹]¥Ñ¡A…ÍÍÝ½É°(€€€€€Í•ÑM•ÍÍ¥½¸°(€€€€€•á¡…¹•½‘•½ÉM•ÍÍ¥½¸°(€€€€€•ÍÑ…‰±¥Í¡5…¥1¥¹­M•ÍÍ¥½¸°(€€€€€Í¥¹=ÕÐ°(€€€€€É•ÍÑ½É•M•ÍÍ¥½¸°(€€€€€É•™É•Í¡M•ÍÍ¥½¸°(€€€€€•Ñ•ÍÍQ½­•¸°(€€€€€Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À°(€€€€€‰½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È°(€€€€€½¹ÕÑ¡MÑ…Ñ•¡…¹”°(€€€€€ÍÑ…ÑÕÌ°(€€€€€Í•ÍÍ¥½¹MÑ½É…•-•äèÍ•ÍÍ¥½¹-•ä°(€€€ô¤ì(€ô((€™Õ¹Ñ¥½¸É•…Ñ•U¹…Ù…¥±…‰±•AÉ½Ù¥‘•È¡½‘”¤ì(€€€½¹ÍÐÕ¹…Ù…¥±…‰±”€ô€ ¤€ôøAÉ½µ¥Í”¹É•Í½±Ù”¡•ÉÉ½ÉI•ÍÕ±Ð¡½‘”¤¤ì(€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€€€Í¥¹%¹]¥Ñ¡A…ÍÍÝ½ÉèÕ¹…Ù…¥±…‰±”°(€€€€€Í•ÑM•ÍÍ¥½¸èÕ¹…Ù…¥±…‰±”°(€€€€€•á¡…¹•½‘•½ÉM•ÍÍ¥½¸èÕ¹…Ù…¥±…‰±”°(€€€€€•ÍÑ…‰±¥Í¡5…¥1¥¹­M•ÍÍ¥½¸èÕ¹…Ù…¥±…‰±”°(€€€€€Í¥¹=ÕÐèÕ¹…Ù…¥±…‰±”°(€€€€€É•ÍÑ½É•M•ÍÍ¥½¸èÕ¹…Ù…¥±…‰±”°(€€€€€É•™É•Í¡M•ÍÍ¥½¸èÕ¹…Ù…¥±…‰±”°(€€€€€•Ñ•ÍÍQ½­•¸è…Íå¹Œ€ ¤€ôø€ˆˆ°(€€€€€Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥ÀèÕ¹…Ù…¥±…‰±”°(€€€€€‰½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•ÈèÕ¹…Ù…¥±…‰±”°(€€€€€½¹ÕÑ¡MÑ…Ñ•¡…¹”è€ ¤€ôø=‰©•Ð¹™É••é”¡ìÕ¹ÍÕ‰ÍÉ¥‰” ¤íôô¤°(€€€€€ÍÑ…ÑÕÌè€ ¤€ôø=‰©•Ð¹™É••é”¡ì½¹™¥ÕÉ•è™…±Í”°Í¥¹•‘%¸è™…±Í”°ÕÍ•Èè¹Õ±°°•áÁ¥É•ÍÐè¹Õ±°°Í•ÍÍ¥½¹MÑ½É…•-•äè€ˆˆô¤°(€€€€€Í•ÍÍ¥½¹MÑ½É…•-•äè€ˆˆ°(€€€ô¤ì(€ô((€™Õ¹Ñ¥½¸É•…Ñ•IÕ¹Ñ¥µ•ÕÑ¡%¹Ñ•É…Ñ¥½¸¡ì½¹™¥œ°…ÕÑ¡AÉ½Ù¥‘•È°½¹™¥Á¤°™•Ñ¡%µÁ°°•Ù•¹ÑQ…É•Ð°…±±‰…­¥…¹½ÍÑ¥MÑ½É…”ô€ôíô¤ì(€€€½¹ÍÐÁÉ½Ù¥‘•È€ô…ÕÑ¡AÉ½Ù¥‘•ÈñðÉ•…Ñ•U¹…Ù…¥±…‰±•AÉ½Ù¥‘•È ‰MUA	M}AU	1%}=9%}IEU%Iˆ¤ì(€€€½¹ÍÐÁÕ‰±¥½¹™¥œ€ô½¹™¥œ€˜˜ÑåÁ•½˜½¹™¥œ€ôôô€‰½‰©•Ðˆ€ü½¹™¥œ€è¹Õ±°ì(€€€½¹ÍÐÑ…É•Ð€ô•Ù•¹ÑQ…É•Ðñð¹Õ±°ì(€€€½¹ÍÐ…±±‰…­¥…¹½ÍÑ¥Ì€ôÉ•…Ñ•…±±‰…­¥…¹½ÍÑ¥MÑ½É”¡…±±‰…­¥…¹½ÍÑ¥MÑ½É…”¤ì(€€€±•Ð½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€±•Ð…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥‘±”ˆì(€€€±•Ð½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ô€‰¥‘±”ˆì(€€€±•Ð±…ÍÑ½‘”€ôÁÕ‰±¥½¹™¥œ€ü€‰MUA	M}UQ!}M%9}=UPˆ€è€‰MUA	M}AU	1%}=9%}IEU%Iˆì(€€€±•Ð…±±‰…­MÑ…”€ô€ˆˆì(€€€±•Ð±…ÍÑAÕÍ¡I•ÍÕ±Ð€ô¹Õ±°ì((€€€™Õ¹Ñ¥½¸Íå¹½¹™¥ÕÉ…Ñ¥½¸¡•¹…‰±•€ô…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰…ÕÑ¡½É¥é•ˆñð…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰¥¸µ™±¥¡Ðˆ¤ì(€€€€€¥˜€ …ÁÕ‰±¥½¹™¥œ¤ì(€€€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì•¹…‰±•è™…±Í”°µ½‘”è€‰±½…°µ½¹±äˆ°½‘”è€‰MUA	M}AU	1%}=9%}IEU%Iˆ°•áÁ•Ñ•‘AÉ•Ù¥½ÕÍI•Ù¥Í¥½¸è€Àô¤ì(€€€€€ô(€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€€€€€•¹…‰±•è•¹…‰±•€ôôôÑÉÕ”°(€€€€€€€µ½‘”è•¹…‰±•€ôôôÑÉÕ”€ü€‰ÁÕÍ µ½¹±äˆ€è€‰±½…°µ½¹±äˆ°(€€€€€€€½‘”è•¹…‰±•€ôôôÑÉÕ”€ü€ˆˆ€è±…ÍÑ½‘”ñð€‰MUA	M}=I51}AUM!}9=Q}UQ!=I%iˆ°(€€€€€€€ÕÉ°èMÑÉ¥¹œ¡ÁÕ‰±¥½¹™¥œ¹ÁÉ½©•ÑUÉ°ñð€ˆˆ¤°(€€€€€€€…¹½¹-•äèMÑÉ¥¹œ¡ÁÕ‰±¥½¹™¥œ¹ÁÕ‰±¥Í¡…‰±•-•äñð€ˆˆ¤°(€€€€€€€½É…¹¥é…Ñ¥½¹%èMÑÉ¥¹œ¡ÁÕ‰±¥½¹™¥œ¹½É…¹¥é…Ñ¥½¹%ñð€ˆˆ¤°(€€€€€€€½É…¹¥é…Ñ¥½¹M±ÕœèMÑÉ¥¹œ¡ÁÕ‰±¥½¹™¥œ¹½É…¹¥é…Ñ¥½¹M±Õœñð€ˆˆ¤°(€€€€€€€•áÁ•Ñ•‘AÉ•Ù¥½ÕÍI•Ù¥Í¥½¸è9Õµ‰•È¡ÁÕ‰±¥½¹™¥œ¹•áÁ•Ñ•‘AÉ•Ù¥½ÕÍI•Ù¥Í¥½¸¤°(€€€€€€€•Ñ•ÍÍQ½­•¸èÁÉ½Ù¥‘•È¹•Ñ•ÍÍQ½­•¸°(€€€€€€€™•Ñ¡%µÁ°èÑåÁ•½˜™•Ñ¡%µÁ°€ôôô€‰™Õ¹Ñ¥½¸ˆ€ü™•Ñ¡%µÁ°€èÕ¹‘•™¥¹•°(€€€€€ô¤ì(€€€ô((€€€™Õ¹Ñ¥½¸ÁÕ‰±¥MÑ…ÑÕÌ ¤ì(€€€€€½¹ÍÐ…ÕÑ €ôÁÉ½Ù¥‘•È¹ÍÑ…ÑÕÌ ¤ì(€€€€€½¹ÍÐ…¹	½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È€ô	½½±•…¸ (€€€€€€€ÁÕ‰±¥½¹™¥œ(€€€€€€€€˜˜…ÕÑ ¹Í¥¹•‘%¸(€€€€€€€€˜˜€…½Ý¹•ÉY•É¥™¥•(€€€€€€€€˜˜½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ôôô€‰¥‘±”ˆ(€€€€€€€€˜˜±…ÍÑ½‘”€ôôô€‰MUA	M}UQ!}55	IM!%A}%9Y1%ˆ(€€€€€€¤ì(€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€€€€€½¹™¥ÕÉ•è	½½±•…¸¡ÁÕ‰±¥½¹™¥œ€˜˜…ÕÑ ¹½¹™¥ÕÉ•¤°(€€€€€€€½¹™¥½‘”èÁÕ‰±¥½¹™¥œ€ü€ˆˆ€è€‰MUA	M}AU	1%}=9%}IEU%Iˆ°(€€€€€€€Í¥¹•‘%¸è…ÕÑ ¹Í¥¹•‘%¸€ôôôÑÉÕ”°(€€€€€€€ÕÍ•Èè…ÕÑ ¹ÕÍ•Èñð¹Õ±°°(€€€€€€€½Ý¹•ÉY•É¥™¥•°(€€€€€€€™½Éµ…±ÕÑ¡½É¥é•è…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰…ÕÑ¡½É¥é•ˆ°(€€€€€€€Á¡…Í”è…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”°(€€€€€€€…¹ÕÑ¡½É¥é”è	½½±•…¸¡ÁÕ‰±¥½¹™¥œ€˜˜…ÕÑ ¹Í¥¹•‘%¸€˜˜½Ý¹•ÉY•É¥™¥•€˜˜…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰¥‘±”ˆ¤°(€€€€€€€…¹AÕÍ è	½½±•…¸¡ÁÕ‰±¥½¹™¥œ€˜˜…ÕÑ ¹Í¥¹•‘%¸€˜˜½Ý¹•ÉY•É¥™¥•€˜˜…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰…ÕÑ¡½É¥é•ˆ¤°(€€€€€€€…¹	½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È°(€€€€€€€½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”°(€€€€€€€½‘”èMÑÉ¥¹œ¡±…ÍÑ½‘”ñð€ˆˆ¤°(€€€€€€€…±±‰…­MÑ…”°(€€€€€€€±…ÍÑAÕÍ¡=¬è±…ÍÑAÕÍ¡I•ÍÕ±Ðü¹½¬€ôôôÑÉÕ”°(€€€€€ô¤ì(€€€ô((€€€™Õ¹Ñ¥½¸ÁÕ‰±¥Í  ¤ì(€€€€€½¹ÍÐ™……‘”€ôÍå¹½¹™¥ÕÉ…Ñ¥½¸ ¤ì(€€€€€¥˜€¡½¹™¥Á¤€˜˜ÑåÁ•½˜½¹™¥Á¤¹ÁÕ‰±¥Í¡Må¹……‘”€ôôô€‰™Õ¹Ñ¥½¸ˆ¤½¹™¥Á¤¹ÁÕ‰±¥Í¡Må¹……‘”¡™……‘”¤ì(€€€€€½¹ÍÐÍÑ…ÑÕÌ€ôÁÕ‰±¥MÑ…ÑÕÌ ¤ì(€€€€€¥˜€¡Ñ…É•Ð€˜˜ÑåÁ•½˜Ñ…É•Ð¹‘¥ÍÁ…Ñ¡Ù•¹Ð€ôôô€‰™Õ¹Ñ¥½¸ˆ€˜˜ÑåÁ•½˜É½½Ðü¹ÕÍÑ½µÙ•¹Ð€ôôô€‰™Õ¹Ñ¥½¸ˆ¤ì(€€€€€€€ÑÉäì(€€€€€€€€€Ñ…É•Ð¹‘¥ÍÁ…Ñ¡Ù•¹Ð¡¹•ÜÉ½½Ð¹ÕÍÑ½µÙ•¹Ð ‰µ…Ñ•É¥…±ÌµÅÕ½Ñ”µÍÕÁ…‰…Í”µ…ÕÑ µ¡…¹”ˆ°ì‘•Ñ…¥°èÍÑ…ÑÕÌô¤¤ì(€€€€€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€€€€€€¼¼U$¹½Ñ¥™¥…Ñ¥½¸™…¥±ÕÉ”µÕÍÐ¹½Ð…±Ñ•È…ÕÑ¡½É¥é…Ñ¥½¸¸(€€€€€€€ô(€€€€€ô(€€€€€É•ÑÕÉ¸ÍÑ…ÑÕÌì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸¥¹¥Ñ¥…±¥é”¡…±±‰…­M½ÕÉ”€ô¹Õ±°¤ì(€€€€€½¹ÍÐ¡…‘…±±‰…¬€ô	½½±•…¸¡…±±‰…­M½ÕÉ”¤ì(€€€€€½¹ÍÐÉ•ÍÑ½É•€ô…±±‰…­M½ÕÉ”(€€€€€€€€ü…Ý…¥ÐÁÉ½Ù¥‘•È¹•ÍÑ…‰±¥Í¡5…¥1¥¹­M•ÍÍ¥½¸¡…±±‰…­M½ÕÉ”¤(€€€€€€€€è…Ý…¥ÐÁÉ½Ù¥‘•È¹É•ÍÑ½É•M•ÍÍ¥½¸ ¤ì(€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥‘±”ˆì(€€€€€¥˜€¡¡…‘…±±‰…¬¤ì(€€€€€€€½¹ÍÐ‘¥…¹½ÍÑ¥Œ€ô…±±‰…­¥…¹½ÍÑ¥Ì¹ÝÉ¥Ñ”¡…±±‰…­¥…¹½ÍÑ¥½ÉI•ÍÕ±Ð¡…±±‰…­M½ÕÉ”°É•ÍÑ½É•¤¤ì(€€€€€€€±…ÍÑ½‘”€ô‘¥…¹½ÍÑ¥Œ¹½‘”ì(€€€€€€€…±±‰…­MÑ…”€ô‘¥…¹½ÍÑ¥Œ¹ÍÑ…”ì(€€€€€ô•±Í”¥˜€ …É•ÍÑ½É•¹½¬¤ì(€€€€€€€½¹ÍÐÁÉ•Ù¥½ÕÌ€ô…±±‰…­¥…¹½ÍÑ¥Ì¹É•… ¤ì(€€€€€€€½¹ÍÐ‘¥…¹½ÍÑ¥Œ€ôÁÉ•Ù¥½ÕÌñð…±±‰…­¥…¹½ÍÑ¥Ì¹ÝÉ¥Ñ” (€€€€€€€€€É•ÍÑ½É•¹½‘”€ôôô€‰MUA	M}UQ!}MMM%=9}MQ=I}%1ˆ(€€€€€€€€€€€€ü11	-}%9=MQ%}MQQUML¹ÍÑ½É…”(€€€€€€€€€€€€è11	-}%9=MQ%}MQQUML¹¹½…±±‰…¬°(€€€€€€€€¤ì(€€€€€€€±…ÍÑ½‘”€ô‘¥…¹½ÍÑ¥Œ¹½‘”ì(€€€€€€€…±±‰…­MÑ…”€ô‘¥…¹½ÍÑ¥Œ¹ÍÑ…”ì(€€€€€ô•±Í”ì(€€€€€€€±…ÍÑ½‘”€ô€‰MUA	M}UQ!}=]9I}Q}IEU%Iˆì(€€€€€€€…±±‰…­MÑ…”€ô€ˆˆì(€€€€€ô(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸É•ÍÑ½É•ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸Í¥¹%¹]¥Ñ¡A…ÍÍÝ½É¡•µ…¥°°Á…ÍÍÝ½É¤ì(€€€€€…±±‰…­¥…¹½ÍÑ¥Ì¹±•…È ¤ì(€€€€€…±±‰…­MÑ…”€ô€ˆˆì(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥‘±”ˆì(€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€¥˜€¡½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€„ôô€‰½¹ÍÕµ•ˆ¤½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ô€‰¥‘±”ˆì(€€€€€±…ÍÑAÕÍ¡I•ÍÕ±Ð€ô¹Õ±°ì(€€€€€½¹ÍÐÍ¥¹•‘%¸€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹Í¥¹%¹]¥Ñ¡A…ÍÍÝ½É¡•µ…¥°°Á…ÍÍÝ½É¤ì(€€€€€¥˜€ …Í¥¹•‘%¸¹½¬¤ì(€€€€€€€±…ÍÑ½‘”€ôÍ¥¹•‘%¸¹½‘”ì(€€€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€€€É•ÑÕÉ¸Í¥¹•‘%¸ì(€€€€€ô(€€€€€½¹ÍÐ…Ñ”€ô…Ý…¥ÐÙ•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€É•ÑÕÉ¸…Ñ”¹½¬€üÍ¥¹•‘%¸€è…Ñ”ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸Í¥¹=ÕÐ ¤ì(€€€€€…±±‰…­¥…¹½ÍÑ¥Ì¹±•…È ¤ì(€€€€€…±±‰…­MÑ…”€ô€ˆˆì(€€€€€±…ÍÑ½‘”€ô€‰MUA	M}UQ!}M%9}=UPˆì(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥‘±”ˆì(€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€±…ÍÑAÕÍ¡I•ÍÕ±Ð€ô¹Õ±°ì(€€€€€½¹ÍÐÉ•ÍÕ±Ð€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹Í¥¹=ÕÐ ¤ì(€€€€€±…ÍÑ½‘”€ôÉ•ÍÕ±Ð¹½¬€ü€‰MUA	M}UQ!}M%9}=UPˆ€èÉ•ÍÕ±Ð¹½‘”ì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸É•ÍÕ±Ðì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€¥˜€ …ÁÕ‰±¥½¹™¥œ¤ì(€€€€€€€±…ÍÑ½‘”€ô€‰MUA	M}AU	1%}=9%}IEU%Iˆì(€€€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€€€É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð¡±…ÍÑ½‘”¤ì(€€€€€ô(€€€€€½¹ÍÐ…Ñ”€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€½Ý¹•ÉY•É¥™¥•€ô…Ñ”¹½¬€ôôôÑÉÕ”ì(€€€€€±…ÍÑ½‘”€ô…Ñ”¹½¬€ü€‰MUA	M}=I51}AUM!}=9%I5Q%=9}IEU%Iˆ€è…Ñ”¹½‘”ì(€€€€€¥˜€ ……Ñ”¹½¬¤…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰½¹ÍÕµ•ˆ€ü€‰½¹ÍÕµ•ˆ€è€‰¥‘±”ˆì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸…Ñ”ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸‰½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È ¤ì(€€€€€½¹ÍÐ…ÕÑ €ôÁÉ½Ù¥‘•È¹ÍÑ…ÑÕÌ ¤ì(€€€€€¥˜€ …ÁÕ‰±¥½¹™¥œ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}AU	1%}=9%}IEU%Iˆ¤ì(€€€€€¥˜€ ……ÕÑ ¹Í¥¹•‘%¸¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}M%9}=UPˆ¤ì(€€€€€¥˜€¡½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ôôô€‰¥¸µ™±¥¡Ðˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}=]9I}	==QMQIA}%9}1%!Pˆ¤ì(€€€€€¥˜€¡½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ôôô€‰½¹ÍÕµ•ˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}=]9I}	==QMQIA}1Ie}=9MU5ˆ¤ì(€€€€€¥˜€¡½Ý¹•ÉY•É¥™¥•ñð±…ÍÑ½‘”€„ôô€‰MUA	M}UQ!}55	IM!%A}%9Y1%ˆ¤ì(€€€€€€€É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}UQ!}=]9I}	==QMQIA}9=Q}Y%1	1ˆ¤ì(€€€€€ô(€€€€€½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ô€‰¥¸µ™±¥¡Ðˆì(€€€€€±…ÍÑ½‘”€ô€‰MUA	M}UQ!}=]9I}	==QMQIA}%9}1%!Pˆì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€½¹ÍÐÉ•…Ñ•€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹‰½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È ¤ì(€€€€€½Ý¹•É	½½ÑÍÑÉ…ÁA¡…Í”€ô€‰½¹ÍÕµ•ˆì(€€€€€¥˜€ …É•…Ñ•¹½¬¤ì(€€€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€€€±…ÍÑ½‘”€ôÉ•…Ñ•¹½‘”ì(€€€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€€€É•ÑÕÉ¸É•…Ñ•ì(€€€€€ô(€€€€€½¹ÍÐ…Ñ”€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€½Ý¹•ÉY•É¥™¥•€ô…Ñ”¹½¬€ôôôÑÉÕ”ì(€€€€€±…ÍÑ½‘”€ô…Ñ”¹½¬(€€€€€€€€ü€‰MUA	M}=I51}AUM!}=9%I5Q%=9}IEU%Iˆ(€€€€€€€€è€‰MUA	M}UQ!}=]9I}	==QMQIA}A=MQ!-}%1ˆì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸…Ñ”¹½¬(€€€€€€€€ü=‰©•Ð¹™É••é”¡ì½¬èÑÉÕ”°½‘”è€ˆˆ°É½±”è€‰½Ý¹•Èˆ°½É…¹¥é…Ñ¥½¹%èMÑÉ¥¹œ¡ÁÕ‰±¥½¹™¥œ¹½É…¹¥é…Ñ¥½¹%ñð€ˆˆ¤ô¤(€€€€€€€€è•ÉÉ½ÉI•ÍÕ±Ð¡±…ÍÑ½‘”¤ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸…ÕÑ¡½É¥é•½Éµ…±AÕÍ¡=¹”¡ì½¹™¥Éµ…Ñ¥½¸°…ÉÑ¥™…Ñ…Ñ•Í•ÁÑ•ô€ôíô¤ì(€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰¥¸µ™±¥¡Ðˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}%9}1%!Pˆ¤ì(€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰½¹ÍÕµ•ˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}1Ie}=9MU5ˆ¤ì(€€€€€¥˜€ …ÁÕ‰±¥½¹™¥œ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}AU	1%}=9%}IEU%Iˆ¤ì(€€€€€¥˜€¡½¹™¥Éµ…Ñ¥½¸€„ôô=I51}AUM!}=9%I5Q%=8ñð…ÉÑ¥™…Ñ…Ñ•Í•ÁÑ•€„ôôÑÉÕ”¤ì(€€€€€€€±…ÍÑ½‘”€ô€‰MUA	M}=I51}AUM!}=9%I5Q%=9}IEU%Iˆì(€€€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€€€É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð¡±…ÍÑ½‘”¤ì(€€€€€ô(€€€€€½¹ÍÐ…Ñ”€ô…Ý…¥ÐÙ•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€¥˜€ ……Ñ”¹½¬¤É•ÑÕÉ¸…Ñ”ì(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰…ÕÑ¡½É¥é•ˆì(€€€€€±…ÍÑ½‘”€ô€ˆˆì(€€€€€±…ÍÑAÕÍ¡I•ÍÕ±Ð€ô¹Õ±°ì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì½¬èÑÉÕ”°½‘”è€ˆˆô¤ì(€€€ô((€€€…Íå¹Œ™Õ¹Ñ¥½¸•á•ÕÑ•½Éµ…±AÕÍ ¡ÁÕÍ ¤ì(€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰¥¸µ™±¥¡Ðˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}%9}1%!Pˆ¤ì(€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ôôô€‰½¹ÍÕµ•ˆ¤É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}1Ie}=9MU5ˆ¤ì(€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€„ôô€‰…ÕÑ¡½É¥é•ˆñðÑåÁ•½˜ÁÕÍ €„ôô€‰™Õ¹Ñ¥½¸ˆ¤ì(€€€€€€€É•ÑÕÉ¸•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}9=Q}UQ!=I%iˆ¤ì(€€€€€ô(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥¸µ™±¥¡Ðˆì(€€€€€±…ÍÑ½‘”€ô€ˆˆì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€½¹ÍÐ…Ñ”€ô…Ý…¥ÐÁÉ½Ù¥‘•È¹Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À ¤ì(€€€€€½Ý¹•ÉY•É¥™¥•€ô…Ñ”¹½¬€ôôôÑÉÕ”ì(€€€€€¥˜€ ……Ñ”¹½¬¤ì(€€€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰½¹ÍÕµ•ˆì(€€€€€€€±…ÍÑ½‘”€ô…Ñ”¹½‘”ì(€€€€€€€±…ÍÑAÕÍ¡I•ÍÕ±Ð€ô…Ñ”ì(€€€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€€€É•ÑÕÉ¸…Ñ”ì(€€€€€ô(€€€€€±•ÐÉ•ÍÕ±Ðì(€€€€€ÑÉäì(€€€€€€€É•ÍÕ±Ð€ô…Ý…¥ÐÁÕÍ  ¤ì(€€€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€€€É•ÍÕ±Ð€ô•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}%1ˆ¤ì(€€€€€ô(€€€€€¥˜€ …É•ÍÕ±ÐñðÑåÁ•½˜É•ÍÕ±Ð€„ôô€‰½‰©•Ðˆ¤É•ÍÕ±Ð€ô•ÉÉ½ÉI•ÍÕ±Ð ‰MUA	M}=I51}AUM!}IMU1Q}%9Y1%ˆ¤ì(€€€€€…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰½¹ÍÕµ•ˆì(€€€€€±…ÍÑ½‘”€ôÉ•ÍÕ±Ð¹½¬€ü€ˆˆ€èMÑÉ¥¹œ¡É•ÍÕ±Ð¹½‘”ñð€‰MUA	M}=I51}AUM!}%1ˆ¤ì(€€€€€±…ÍÑAÕÍ¡I•ÍÕ±Ð€ôÉ•ÍÕ±Ðì(€€€€€ÁÕ‰±¥Í  ¤ì(€€€€€É•ÑÕÉ¸É•ÍÕ±Ðì(€€€ô((€€€ÁÉ½Ù¥‘•È¹½¹ÕÑ¡MÑ…Ñ•¡…¹” ¡•Ù•¹Ð¤€ôøì(€€€€€¥˜€¡•Ù•¹Ð€ôôô€‰M%9}=UPˆ¤ì(€€€€€€€½Ý¹•ÉY•É¥™¥•€ô™…±Í”ì(€€€€€€€¥˜€¡…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€„ôô€‰½¹ÍÕµ•ˆ¤…ÕÑ¡½É¥é…Ñ¥½¹A¡…Í”€ô€‰¥‘±”ˆì(€€€€€€€½¹ÍÐ‘¥…¹½ÍÑ¥Œ€ô11	-}%9=MQ%}	e}=¹•Ð¡±…ÍÑ½‘”¤ì(€€€€€€€¥˜€ …‘¥…¹½ÍÑ¥Œñð‘¥…¹½ÍÑ¥Œ€ôôô11	-}%9=MQ%}MQQUML¹ÍÕ•ÍÌ¤ì(€€€€€€€€€±…ÍÑ½‘”€ô€‰MUA	M}UQ!}M%9}=UPˆì(€€€€€€€€€…±±‰…­MÑ…”€ô€ˆˆì(€€€€€€€ô(€€€€€ô(€€€€€ÁÕ‰±¥Í  ¤ì(€€€ô¤ì((€€€ÁÕ‰±¥Í  ¤ì((€€€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€€€¥¹¥Ñ¥…±¥é”°(€€€€€Í¥¹%¹]¥Ñ¡A…ÍÍÝ½É°(€€€€€Í¥¹=ÕÐ°(€€€€€Ù•É¥™å=Ý¹•É5•µ‰•ÉÍ¡¥À°(€€€€€‰½½ÑÍÑÉ…Á¥ÉÍÑ=Ý¹•È°(€€€€€…ÕÑ¡½É¥é•½Éµ…±AÕÍ¡=¹”°(€€€€€•á•ÕÑ•½Éµ…±AÕÍ °(€€€€€•ÑMå¹½¹™¥ÕÉ…Ñ¥½¸èÍå¹½¹™¥ÕÉ…Ñ¥½¸°(€€€€€ÍÑ…ÑÕÌèÁÕ‰±¥MÑ…ÑÕÌ°(€€€€€…ÕÑ¡AÉ½Ù¥‘•ÈèÁÉ½Ù¥‘•È°(€€€ô¤ì(€ô((€™Õ¹Ñ¥½¸‰½½ÑÍÑÉ…Á	É½ÝÍ•ÉIÕ¹Ñ¥µ”¡‰É½ÝÍ•ÉI½½Ð€ôÉ½½Ð¤ì(€€€¥˜€ …‰É½ÝÍ•ÉI½½Ðñð‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•IÕ¹Ñ¥µ”¤É•ÑÕÉ¸‰É½ÝÍ•ÉI½½Ðü¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•IÕ¹Ñ¥µ”ñð¹Õ±°ì(€€€½¹ÍÐ½¹™¥Á¤€ô‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•IÕ¹Ñ¥µ•½¹™¥œì(€€€½¹ÍÐ½¹™¥œ€ô½¹™¥Á¤ü¹•ÑÕÉÉ•¹Ñ½¹™¥ÕÉ…Ñ¥½¸ü¸ ¤ñð¹Õ±°ì(€€€½¹ÍÐ™•Ñ¡%µÁ°€ôÑåÁ•½˜‰É½ÝÍ•ÉI½½Ð¹™•Ñ €ôôô€‰™Õ¹Ñ¥½¸ˆ€ü‰É½ÝÍ•ÉI½½Ð¹™•Ñ ¹‰¥¹¡‰É½ÝÍ•ÉI½½Ð¤€è¹Õ±°ì(€€€±•Ð‰É½ÝÍ•ÉMÑ½É…”€ô¹Õ±°ì(€€€±•Ð…±±‰…­¥…¹½ÍÑ¥MÑ½É…”€ô¹Õ±°ì(€€€ÑÉäì(€€€€€‰É½ÝÍ•ÉMÑ½É…”€ô‰É½ÝÍ•ÉI½½Ð¹±½…±MÑ½É…”ì(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€‰É½ÝÍ•ÉMÑ½É…”€ô¹Õ±°ì(€€€ô(€€€ÑÉäì(€€€€€…±±‰…­¥…¹½ÍÑ¥MÑ½É…”€ô‰É½ÝÍ•ÉI½½Ð¹Í•ÍÍ¥½¹MÑ½É…”ì(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€…±±‰…­¥…¹½ÍÑ¥MÑ½É…”€ô¹Õ±°ì(€€€ô(€€€½¹ÍÐÁÉ½Ù¥‘•È€ô½¹™¥œ(€€€€€€üÉ•…Ñ•MÕÁ…‰…Í•ÕÑ¡AÉ½Ù¥‘•È¡ì½¹™¥œ°™•Ñ¡%µÁ°°ÍÑ½É…”è‰É½ÝÍ•ÉMÑ½É…”ô¤(€€€€€€èÉ•…Ñ•U¹…Ù…¥±…‰±•AÉ½Ù¥‘•È¡½¹™¥Á¤ü¹ÍÑ…ÑÕÌü¸ ¤¹½‘”ñð€‰MUA	M}AU	1%}=9%}IEU%Iˆ¤ì(€€€½¹ÍÐ¥¹Ñ•É…Ñ¥½¸€ôÉ•…Ñ•IÕ¹Ñ¥µ•ÕÑ¡%¹Ñ•É…Ñ¥½¸¡ì(€€€€€½¹™¥œ°(€€€€€…ÕÑ¡AÉ½Ù¥‘•ÈèÁÉ½Ù¥‘•È°(€€€€€½¹™¥Á¤°(€€€€€™•Ñ¡%µÁ°°(€€€€€•Ù•¹ÑQ…É•Ðè‰É½ÝÍ•ÉI½½Ð°(€€€€€…±±‰…­¥…¹½ÍÑ¥MÑ½É…”°(€€€ô¤ì(€€€‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•IÕ¹Ñ¥µ”€ô¥¹Ñ•É…Ñ¥½¸ì(€€€‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•Må¹½¹™¥œ€ô¥¹Ñ•É…Ñ¥½¸¹•ÑMå¹½¹™¥ÕÉ…Ñ¥½¸ ¤ì(€€€±•Ð…±±‰…­M½ÕÉ”€ô‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•ÕÑ¡…±±‰…¬ñð¹Õ±°ì(€€€ÑÉäì(€€€€€‘•±•Ñ”‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•ÕÑ¡…±±‰…¬ì(€€€ô…Ñ €¡•ÉÉ½È¤ì(€€€€€ÑÉäì(€€€€€€€‰É½ÝÍ•ÉI½½Ð¹5…Ñ•É¥…±ÍEÕ½Ñ•MÕÁ…‰…Í•ÕÑ¡…±±‰…¬€ô¹Õ±°ì(€€€€€ô…Ñ €¡¥¹½É•¤ì(€€€€€€€€¼¼Q¡”ÁÉ½Ù¥‘•ÈÍÑ¥±°•¹™½É•Ì„Í¥¹±”…±±‰…¬½¹ÍÕµÁÑ¥½¸¸(€€€€€ô(€€€ô(€€€AÉ½µ¥Í”¹É•Í½±Ù”¡¥¹Ñ•É…Ñ¥½¸¹¥¹¥Ñ¥…±¥é”¡…±±‰…­M½ÕÉ”¤¤¹Ñ¡•¸ ¡É•ÍÕ±Ð¤€ôøì(€€€€€…±±‰…­M½ÕÉ”€ô¹Õ±°ì(€€€€€¥˜€¡É•ÍÕ±Ðü¹½¬€ôôôÑÉÕ”€˜˜É•ÍÕ±Ð¹…±±‰…¬€˜˜‰É½ÝÍ•ÉI½½Ð¹±½…Ñ¥½¸¤ì(€€€€€€€‰É½ÝÍ•ÉI½½Ð¹±½…Ñ¥½¸¹¡…Í €ô€ˆŒ½Í•ÑÑ¥¹Ì½½µÁ…¹äˆì(€€€€€ô(€€€ô¤ì(€€€¥˜€¡½¹™¥œ€˜˜ÑåÁ•½˜‰É½ÝÍ•ÉI½½Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È€ôôô€‰™Õ¹Ñ¥½¸ˆ¤ì(€€€€€‰É½ÝÍ•ÉI½½Ð¹…‘‘Ù•¹Ñ1¥ÍÑ•¹•È ‰ÍÑ½É…”ˆ°€¡•Ù•¹Ð¤€ôøì(€€€€€€€¥˜€¡•Ù•¹Ðü¹­•ä€ôôôÁÉ½Ù¥‘•È¹Í•ÍÍ¥½¹MÑ½É…•-•ä¤¥¹Ñ•É…Ñ¥½¸¹¥¹¥Ñ¥…±¥é” ¤ì(€€€€€ô¤ì(€€€ô(€€€É•ÑÕÉ¸¥¹Ñ•É…Ñ¥½¸ì(€ô((€É•ÑÕÉ¸=‰©•Ð¹™É••é”¡ì(€€€=I51}AUM!}=9%I5Q%=8°(€€€UQ!}IU9Q%5}YIM%=8°(€€€5%}1%9-}11	-}UI0°(€€€5%}1%9-}11	-}UI1L°(€€€11	-}%9=MQ%}MQ=I}-d°(€€€11	-}%9=MQ%}MQQUML°(€€€Á…ÉÍ•5…¥1¥¹­…±±‰…¬°(€€€Ù…±¥‘…Ñ•5…¥1¥¹­•ÍÍQ½­•¸°(€€€É•…Ñ•MÕÁ…‰…Í•ÕÑ¡AÉ½Ù¥‘•È°(€€€É•…Ñ•IÕ¹Ñ¥µ•ÕÑ¡%¹Ñ•É…Ñ¥½¸°(€€€‰½½ÑÍÑÉ…Á	É½ÝÍ•ÉIÕ¹Ñ¥µ”°(€ô¤ì)ô¤ì(