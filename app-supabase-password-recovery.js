Exit code: 0
Wall time: 0.2 seconds
Output:
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabasePasswordRecovery = api;
  if (root && root.document) api.bootstrapBrowserRuntime(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const RECOVERY_RUNTIME_VERSION = "20260813-server-validated-recovery-session-001";
  const FORMAL_SITE_BASE_URL = "https://asd-642.github.io/lailai-materials-management/";
  const PASSWORD_RECOVERY_REDIRECT_URL = `${FORMAL_SITE_BASE_URL}supabase-password-recovery.html`;
  const PASSWORD_RECOVERY_SUCCESS_URL = `${FORMAL_SITE_BASE_URL}index.html#/login`;
  const PASSWORD_MIN_LENGTH = 8;
  const PASSWORD_MAX_LENGTH = 128;
  const EMAIL_MAX_LENGTH = 254;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const RECOVERY_REQUEST_NEUTRAL_MESSAGE = "?亙董???剁?隢???圈?閮凋縑";
  const CALLBACK_MAX_LENGTH = 16384;
  const TOKEN_MAX_LENGTH = 8192;
  const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{20,1024}$/;
  const QUERY_FIELDS = Object.freeze(new Set([
    "code",
    "error",
    "error_code",
    "error_description",
    "token",
    "token_hash",
    "type",
  ]));
  const FRAGMENT_FIELDS = Object.freeze(new Set([
    "access_token",
    "error",
    "error_code",
    "error_description",
    "expires_at",
    "expires_in",
    "refresh_token",
    "token_type",
    "type",
  ]));
  const ERROR_FIELDS = Object.freeze(new Set(["error", "error_code", "error_description", "type"]));

  function resultError(code, state = "invalid") {
    return Object.freeze({ ok: false, code: String(code || "SUPABASE_RECOVERY_INVALID"), state });
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function decodeBase64UrlJson(segment) {
    const source = String(segment || "");
    if (!source || source.length > TOKEN_MAX_LENGTH || !/^[A-Za-z0-9_-]+$/.test(source) || source.length % 4 === 1) {
      return null;
    }
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

  function parseParameterBag(rawValue, prefix, allowedFields) {
    const raw = String(rawValue || "");
    if (!raw) return Object.freeze({ ok: true, values: Object.freeze({}), count: 0 });
    if (raw.length > CALLBACK_MAX_LENGTH || raw[0] !== prefix || raw === prefix || /%(?![0-9A-Fa-f]{2})/.test(raw)) {
      return resultError("SUPABASE_RECOVERY_CALLBACK_ENCODING_INVALID");
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
          return resultError("SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID");
        }
        values[key] = value;
      }
    } catch (error) {
      return resultError("SUPABASE_RECOVERY_CALLBACK_ENCODING_INVALID");
    }
    if (count === 0) return resultError("SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID");
    return Object.freeze({ ok: true, values: Object.freeze(values), count });
  }

  function exactRecoveryPageIdentity(callbackSource, expectedRedirectUrl) {
    if (!callbackSource || callbackSource.scrubbed !== true) return false;
    try {
      const expected = new URL(String(expectedRedirectUrl || ""));
      return expected.href === PASSWORD_RECOVERY_REDIRECT_URL
        && expected.protocol === "https:"
        && !expected.username
        && !expected.password
        && !expected.port
        && !expected.search
        && !expected.hash
        && String(callbackSource.origin || "") === expected.origin
        && String(callbackSource.pathname || "") === expected.pathname;
    } catch (error) {
      return false;
    }
  }

  function terminalErrorResult(values) {
    const keys = Object.keys(values);
    if (!keys.some((key) => key === "error" || key === "error_code" || key === "error_description")) return null;
    if (!keys.every((key) => ERROR_FIELDS.has(key))) return resultError("SUPABASE_RECOVERY_CALLBACK_CONFLICT");
    if (hasOwn(values, "type") && values.type !== "recovery") {
      return resultError("SUPABASE_RECOVERY_TYPE_INVALID");
    }
    const errorCode = String(values.error_code || "").toLowerCase();
    return errorCode === "otp_expired" || errorCode === "token_expired"
      ? resultError("SUPABASE_RECOVERY_EXPIRED", "expired")
      : resultError("SUPABASE_RECOVERY_INVALID", "invalid");
  }

  function parseRecoveryCallback(callbackSource, expectedRedirectUrl = PASSWORD_RECOVERY_REDIRECT_URL) {
    if (!exactRecoveryPageIdentity(callbackSource, expectedRedirectUrl)) {
      return resultError("SUPABASE_RECOVERY_PAGE_IDENTITY_INVALID");
    }
    const query = parseParameterBag(callbackSource.search, "?", QUERY_FIELDS);
    const fragment = parseParameterBag(callbackSource.hash, "#", FRAGMENT_FIELDS);
    if (!query.ok) return query;
    if (!fragment.ok) return fragment;
    if (query.count > 0 && fragment.count > 0) return resultError("SUPABASE_RECOVERY_CALLBACK_CONFLICT");
    if (query.count === 0 && fragment.count === 0) return resultError("SUPABASE_RECOVERY_CALLBACK_MISSING");

    const values = query.count > 0 ? query.values : fragment.values;
    const terminalError = terminalErrorResult(values);
    if (terminalError) return terminalError;

    if (query.count > 0) {
      const keys = Object.keys(values).sort();
      if ((keys.length === 1 && keys[0] === "code")
        || (keys.length === 2 && keys[0] === "code" && keys[1] === "type")) {
        if (hasOwn(values, "type") && values.type !== "recovery") {
          return resultError("SUPABASE_RECOVERY_TYPE_INVALID");
        }
        return resultError("SUPABASE_RECOVERY_PKCE_CONTEXT_UNAVAILABLE");
      }
      if (values.type !== "recovery") return resultError("SUPABASE_RECOVERY_TYPE_INVALID");
      if (keys.length === 2 && keys[0] === "token_hash" && keys[1] === "type" && TOKEN_HASH_PATTERN.test(values.token_hash)) {
        return Object.freeze({ ok: true, code: "", state: "validating", mode: "token-hash", tokenHash: values.token_hash });
      }
      if (hasOwn(values, "token")) return resultError("SUPABASE_RECOVERY_RAW_TOKEN_CONTEXT_INVALID");
      return resultError("SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID");
    }

    if (values.type !== "recovery") return resultError("SUPABASE_RECOVERY_TYPE_INVALID");

    const required = ["access_token", "expires_in", "refresh_token", "token_type", "type"];
    if (!required.every((key) => hasOwn(values, key))) return resultError("SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID");
    if (!Object.keys(values).every((key) => required.includes(key) || key === "expires_at")) {
      return resultError("SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID");
    }
    const expiresIn = Number(values.expires_in);
    const expiresAt = hasOwn(values, "expires_at") ? Number(values.expires_at) : null;
    if (String(values.token_type).toLowerCase() !== "bearer"
      || !Number.isSafeInteger(expiresIn)
      || expiresIn < 1
      || expiresIn > 86400
      || (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt < 1))
      || String(values.access_token).length > TOKEN_MAX_LENGTH
      || String(values.refresh_token).length < 20
      || String(values.refresh_token).length > TOKEN_MAX_LENGTH) {
      return resultError("SUPABASE_RECOVERY_SESSION_INVALID");
    }
    return Object.freeze({
      ok: true,
      code: "",
      state: "validating",
      mode: "implicit",
      accessToken: values.access_token,
      refreshToken: values.refresh_token,
      expiresAt,
    });
  }

  function captureAndRedactLocation(browserRoot) {
    const location = browserRoot?.location;
    const history = browserRoot?.history;
    if (!location || !history || typeof history.replaceState !== "function") {
      return Object.freeze({ origin: "", pathname: "", search: "", hash: "", scrubbed: false });
    }
    const callbackSource = {
      origin: String(location.origin || ""),
      pathname: String(location.pathname || ""),
      search: String(location.search || ""),
      hash: String(location.hash || ""),
      scrubbed: false,
    };
    try {
      history.replaceState(null, "", callbackSource.pathname);
      callbackSource.scrubbed = true;
    } catch (error) {
      callbackSource.scrubbed = false;
    }
    return Object.freeze(callbackSource);
  }

  function validateRecoveryAccessToken(accessToken, config, nowSeconds) {
    const token = String(accessToken || "");
    const expectedRef = String(config?.expectedProjectRef || "");
    const projectUrl = String(config?.projectUrl || "");
    if (!PROJECT_REF_PATTERN.test(expectedRef) || projectUrl !== `https://${expectedRef}.supabase.co` || token.length > TOKEN_MAX_LENGTH) {
      return false;
    }
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[2]) return false;
    const header = decodeBase64UrlJson(parts[0]);
    const payload = decodeBase64UrlJson(parts[1]);
    if (!header || !payload || !["HS256", "RS256", "ES256"].includes(header.alg)) return false;
    if (payload.iss !== `${projectUrl}/auth/v1`
      || payload.role !== "authenticated"
      || !UUID_PATTERN.test(String(payload.sub || ""))) {
      return false;
    }
    if (hasOwn(payload, "ref") && payload.ref !== expectedRef) return false;
    const audience = payload.aud;
    if (audience !== "authenticated"
      && !(Array.isArray(audience) && audience.length > 0 && audience.every((entry) => entry === "authenticated"))) {
      return false;
    }
    const expiresAt = Number(payload.exp);
    return Number.isSafeInteger(expiresAt) && expiresAt > nowSeconds;
  }

  function validRecoveryConfiguration(config) {
    if (!isRecord(config)
      || config.passwordRecoveryRedirectUrl !== PASSWORD_RECOVERY_REDIRECT_URL
      || !PROJECT_REF_PATTERN.test(String(config.expectedProjectRef || ""))
      || typeof config.publishableKey !== "string"
      || config.publishableKey.length < 20) {
      return false;
    }
    try {
      const project = new URL(String(config.projectUrl || ""));
      return project.href === `https://${config.expectedProjectRef}.supabase.co/`;
    } catch (error) {
      return false;
    }
  }

  function createRecoveryClient({ config, fetchImpl, now } = {}) {
    const request = typeof fetchImpl === "function"
      ? fetchImpl
      : (typeof root?.fetch === "function" ? root.fetch.bind(root) : null);
    const nowMs = typeof now === "function" ? now : () => Date.now();
    const configured = validRecoveryConfiguration(config) && typeof request === "function";
    const projectUrl = configured ? String(config.projectUrl) : "";
    const publishableKey = configured ? String(config.publishableKey) : "";
    let accessToken = "";
    let phase = configured ? "idle" : "invalid";
    let lastCode = configured ? "" : "SUPABASE_RECOVERY_CONFIGURATION_INVALID";
    let recoveryRequestConsumed = false;

    function clearSensitive() {
      accessToken = "";
    }

    function status() {
      return Object.freeze({
        configured,
        phase,
        code: lastCode,
        ready: phase === "ready",
        hasSensitiveContext: accessToken !== "",
        recoveryRequestConsumed,
      });
    }

    async function authRequest(path, method, body, bearerToken = "") {
      if (!configured) return resultError("SUPABASE_RECOVERY_CONFIGURATION_INVALID");
      const url = `${projectUrl}${path}`;
      const headers = {
        apikey: publishableKey,
        "Content-Type": "application/json",
      };
      if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
      let response;
      try {
        response = await request(url, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
        });
      } catch (error) {
        return resultError("SUPABASE_RECOVERY_NETWORK_ERROR", "update-failed");
      }
      if (!response || response.redirected !== false || response.url !== url) {
        return resultError("SUPABASE_RECOVERY_RESPONSE_IDENTITY_INVALID", "update-failed");
      }
      let value = null;
      if (Number(response.status) !== 204) {
        try {
          value = await response.json();
        } catch (error) {
          value = null;
        }
      }
      return Object.freeze({ ok: response.ok === true, status: Number(response.status), value });
    }

    function acceptSession(source) {
      if (!isRecord(source)) return false;
      const token = String(source.access_token || "");
      const refreshToken = String(source.refresh_token || "");
      const currentSeconds = Math.floor(Number(nowMs()) / 1000);
      if (refreshToken.length < 20
        || refreshToken.length > TOKEN_MAX_LENGTH
        || !validateRecoveryAccessToken(token, config, currentSeconds)) {
        return false;
      }
      accessToken = token;
      return true;
    }

    function extractServerValidatedSession(source) {
      if (!isRecord(source)) return null;
      const candidates = [
        source,
        source.session,
        source.data,
        isRecord(source.data) ? source.data.session : null,
      ].filter((candidate) => isRecord(candidate)
        && (Object.prototype.hasOwnProperty.call(candidate, "access_token")
          || Object.prototype.hasOwnProperty.call(candidate, "refresh_token")));
      return candidates.length === 1 ? candidates[0] : null;
    }

    async function acceptServerValidatedSession(source) {
      const session = extractServerValidatedSession(source);
      if (!session) return false;
      const token = String(session.access_token || "");
      const refreshToken = String(session.refresh_token || "");
      if (token.length < 32
        || token.length > TOKEN_MAX_LENGTH
        || refreshToken.length < 20
        || refreshToken.length > TOKEN_MAX_LENGTH
        || /[\u0000-\u001F\u007F]/.test(token)
        || /[\u0000-\u001F\u007F]/.test(refreshToken)) {
        return false;
      }
      if (acceptSession(session)) return true;

      const userProbe = await authRequest("/auth/v1/user", "GET", undefined, token);
      if (!userProbe.ok
        || !isRecord(userProbe.value)
        || !UUID_PATTERN.test(String(userProbe.value.id || ""))) {
        return false;
      }
      accessToken = token;
      return true;
    }

    async function establishRecovery(callbackSource) {
      if (!configured) return resultError(lastCode);
      if (phase !== "idle") return resultError("SUPABASE_RECOVERY_ALREADY_CONSUMED");
      const parsed = parseRecoveryCallback(callbackSource, config.passwordRecoveryRedirectUrl);
      if (!parsed.ok) {
        phase = parsed.state === "expired" ? "expired" : "invalid";
        lastCode = parsed.code;
        clearSensitive();
        return parsed;
      }
      phase = "validating";
      if (parsed.mode === "implicit") {
        const session = {
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken,
        };
        if (!await acceptServerValidatedSession(session)) {
          phase = "invalid";
          lastCode = "SUPABASE_RECOVERY_SESSION_INVALID";
          clearSensitive();
          return resultError(lastCode);
        }
      } else if (parsed.mode === "token-hash") {
        const tokenHash = parsed.tokenHash;
        const verified = await authRequest("/auth/v1/verify", "POST", {
          type: "recovery",
          token_hash: tokenHash,
        });
        if (!verified.ok || !await acceptServerValidatedSession(verified.value)) {
          phase = [400, 401, 403, 410, 422].includes(verified.status) ? "expired" : "invalid";
          lastCode = phase === "expired" ? "SUPABASE_RECOVERY_EXPIRED" : "SUPABASE_RECOVERY_VERIFY_FAILED";
          clearSensitive();
          return resultError(lastCode, phase);
        }
      } else {
        phase = "invalid";
        lastCode = "SUPABASE_RECOVERY_CALLBACK_FIELDS_INVALID";
        clearSensitive();
        return resultError(lastCode);
      }
      phase = "ready";
      lastCode = "";
      return Object.freeze({ ok: true, code: "", state: "ready" });
    }

    async function resetPasswordForEmail(email, { redirectTo } = {}) {
      if (!configured) return resultError("SUPABASE_RECOVERY_CONFIGURATION_INVALID", "request-unavailable");
      if (!["invalid", "expired"].includes(phase)) {
        const code = phase === "request-pending"
          ? "SUPABASE_RECOVERY_REQUEST_IN_FLIGHT"
          : "SUPABASE_RECOVERY_REQUEST_NOT_AVAILABLE";
        return resultError(code, phase);
      }
      if (recoveryRequestConsumed) return resultError("SUPABASE_RECOVERY_REQUEST_ALREADY_CONSUMED", phase);
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (normalizedEmail.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(normalizedEmail)) {
        return resultError("SUPABASE_RECOVERY_EMAIL_INVALID", "request");
      }
      if (String(redirectTo || "") !== PASSWORD_RECOVERY_REDIRECT_URL) {
        return resultError("SUPABASE_RECOVERY_REDIRECT_INVALID", "request");
      }

      recoveryRequestConsumed = true;
      phase = "request-pending";
      lastCode = "";
      const path = `/auth/v1/recover?redirect_to=${encodeURIComponent(PASSWORD_RECOVERY_REDIRECT_URL)}`;
      const sent = await authRequest(path, "POST", { email: normalizedEmail });
      phase = "request-complete";
      const accepted = sent.ok === true && sent.status === 200;
      lastCode = accepted ? "" : "SUPABASE_RECOVERY_REQUEST_RESULT_PRIVATE";
      return Object.freeze({
        ok: accepted,
        code: lastCode,
        state: "request-complete",
        message: RECOVERY_REQUEST_NEUTRAL_MESSAGE,
      });
    }

    function validatePasswords(password, confirmation) {
      const next = String(password || "");
      const repeated = String(confirmation || "");
      if (next !== repeated) return resultError("SUPABASE_RECOVERY_PASSWORD_MISMATCH", "ready");
      if (next.length < PASSWORD_MIN_LENGTH
        || next.length > PASSWORD_MAX_LENGTH
        || /^\s+$/.test(next)) {
        return resultError("SUPABASE_RECOVERY_PASSWORD_POLICY_INVALID", "ready");
      }
      return Object.freeze({ ok: true, code: "", state: "ready" });
    }

    async function updatePassword(password, confirmation) {
      if (phase !== "ready" || !accessToken) return resultError("SUPABASE_RECOVERY_SESSION_REQUIRED", phase);
      const passwordValidation = validatePasswords(password, confirmation);
      if (!passwordValidation.ok) {
        lastCode = passwordValidation.code;
        return passwordValidation;
      }
      phase = "updating";
      lastCode = "";
      const tokenForRequest = accessToken;
      const updated = await authRequest("/auth/v1/user", "PUT", { password: String(password) }, tokenForRequest);
      if (!updated.ok || !isRecord(updated.value) || !UUID_PATTERN.test(String(updated.value.id || ""))) {
        if ([401, 403].includes(updated.status)) {
          phase = "expired";
          lastCode = "SUPABASE_RECOVERY_EXPIRED";
          clearSensitive();
          return resultError(lastCode, phase);
        }
        phase = "ready";
        lastCode = [400, 422].includes(updated.status)
          ? "SUPABASE_RECOVERY_PASSWORD_REJECTED"
          : "SUPABASE_RECOVERY_UPDATE_FAILED";
        return resultError(lastCode, "update-failed");
      }

      await authRequest("/auth/v1/logout?scope=local", "POST", undefined, tokenForRequest);
      clearSensitive();
      phase = "success";
      lastCode = "";
      return Object.freeze({ ok: true, code: "", state: "success" });
    }

    return Object.freeze({
      establishRecovery,
      resetPasswordForEmail,
      updatePassword,
      clearSensitive,
      status,
    });
  }

  function bootstrapBrowserRuntime(browserRoot = root) {
    if (!browserRoot || !browserRoot.document) return null;
    if (browserRoot.MaterialsQuoteSupabasePasswordRecoveryRuntime) {
      return browserRoot.MaterialsQuoteSupabasePasswordRecoveryRuntime;
    }
    let callbackSource = browserRoot.MaterialsQuoteSupabaseRecoveryCallback || captureAndRedactLocation(browserRoot);
    try {
      delete browserRoot.MaterialsQuoteSupabaseRecoveryCallback;
    } catch (error) {
      browserRoot.MaterialsQuoteSupabaseRecoveryCallback = null;
    }

    const document = browserRoot.document;
    const statusNode = document.getElementById("recovery-status");
    const form = document.getElementById("recovery-form");
    const requestForm = document.getElementById("recovery-request-form");
    const requestEmailInput = document.getElementById("recovery-request-email");
    const requestSubmitButton = document.getElementById("recovery-request-submit");
    const passwordInput = document.getElementById("recovery-password");
    const confirmationInput = document.getElementById("recovery-password-confirmation");
    const submitButton = document.getElementById("recovery-submit");
    const loginLink = document.getElementById("recovery-login-link");
    const configApi = browserRoot.MaterialsQuoteSupabaseRuntimeConfig;
    const config = configApi?.getCurrentConfiguration?.() || null;
    const fetchImpl = typeof browserRoot.fetch === "function" ? browserRoot.fetch.bind(browserRoot) : null;
    const client = createRecoveryClient({ config, fetchImpl });

    function render(state) {
      if (!statusNode || !form || !requestForm) return;
      const messages = {
        validating: "甇?撽?撖Ⅳ?身?????,
        ready: "???撌脤?霅?頛詨?啁? Supabase 撣唾?撖Ⅳ??,
        updating: "甇?摰?湔撖Ⅳ??,
        success: "撖Ⅳ撌脫?堆?甇?餈?甇??蝬脩??餃??,
        invalid: "甇文?蝣潮?閮剝???⊥?嚗?脰?隞颱?霈??,
        "update-failed": "撖Ⅳ?湔憭望???蝣箄?撖Ⅳ閬?敺?閰虫?甈～?,
        request: "隢撓??Supabase 撣唾? Email 隞亙?敺??蝣潮?閮凋縑??,
        "request-input-error": "隢撓?交??? Supabase 撣唾? Email??,
        "request-pending": "甇??撖Ⅳ?身閬???,
        "request-complete": RECOVERY_REQUEST_NEUTRAL_MESSAGE,
      };
      statusNode.textContent = messages[state] || messages.invalid;
      statusNode.dataset.state = state;
      form.hidden = state !== "ready" && state !== "update-failed";
      requestForm.hidden = state !== "request" && state !== "request-input-error";
      if (submitButton) submitButton.disabled = state === "updating";
      if (requestSubmitButton) requestSubmitButton.disabled = state === "request-pending" || state === "request-complete";
      if (loginLink) loginLink.hidden = !["invalid", "request-complete"].includes(state);
    }

    const runtime = Object.freeze({
      status: client.status,
      clearSensitive: client.clearSensitive,
    });
    browserRoot.MaterialsQuoteSupabasePasswordRecoveryRuntime = runtime;
    render("validating");

    Promise.resolve().then(async () => {
      const established = await client.establishRecovery(callbackSource);
      callbackSource = null;
      if (!established.ok) {
        render(established.code === "SUPABASE_RECOVERY_CONFIGURATION_INVALID" ? "invalid" : "request");
        return;
      }
      render("ready");
    });

    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = String(passwordInput?.value || "");
        const confirmation = String(confirmationInput?.value || "");
        render("updating");
        const result = await client.updatePassword(password, confirmation);
        if (passwordInput) passwordInput.value = "";
        if (confirmationInput) confirmationInput.value = "";
        if (!result.ok) {
          render(result.state === "expired" ? "request" : "update-failed");
          return;
        }
        render("success");
        browserRoot.setTimeout(() => browserRoot.location.replace(PASSWORD_RECOVERY_SUCCESS_URL), 1200);
      });
    }
    if (requestForm) {
      requestForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (client.status().phase === "request-pending" || client.status().recoveryRequestConsumed) return;
        const email = String(requestEmailInput?.value || "");
        if (requestEmailInput) requestEmailInput.value = "";
        render("request-pending");
        const result = await client.resetPasswordForEmail(email, {
          redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
        });
        render(result.code === "SUPABASE_RECOVERY_EMAIL_INVALID" ? "request-input-error" : "request-complete");
      });
    }
    return runtime;
  }

  return Object.freeze({
    RECOVERY_RUNTIME_VERSION,
    FORMAL_SITE_BASE_URL,
    PASSWORD_RECOVERY_REDIRECT_URL,
    PASSWORD_RECOVERY_SUCCESS_URL,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    RECOVERY_REQUEST_NEUTRAL_MESSAGE,
    parseRecoveryCallback,
    captureAndRedactLocation,
    validateRecoveryAccessToken,
    createRecoveryClient,
    bootstrapBrowserRuntime,
  });
});

