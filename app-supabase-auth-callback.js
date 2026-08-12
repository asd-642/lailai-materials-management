(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuthCallbackBridge = api;
  if (root && root.location && root.history) {
    const source = api.captureAuthCallback(root);
    if (source?.kind === "auth-callback") {
      try {
        Object.defineProperty(root, "MaterialsQuoteSupabaseAuthCallback", {
          configurable: true,
          enumerable: false,
          value: source,
          writable: false,
        });
      } catch (error) {
        // Fail closed: never expose callback values through an enumerable fallback.
      }
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const AUTH_CALLBACK_BRIDGE_VERSION = "20260813-recovery-callback-shape-telemetry-001";
  const CALLBACK_MAX_LENGTH = 16384;
  const TOKEN_MAX_LENGTH = 8192;
  const FORMAL_ORIGIN = "https://asd-642.github.io";
  const FORMAL_PATHS = Object.freeze(new Set([
    "/lailai-materials-management/",
    "/lailai-materials-management/index.html",
  ]));
  const RECOVERY_REDIRECT_URL = "https://asd-642.github.io/lailai-materials-management/supabase-password-recovery.html";
  const RECOVERY_FRAGMENT_FIELDS = Object.freeze(new Set([
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
  ]);
  const CALLBACK_TELEMETRY_PARAMETER_SET = new Set(CALLBACK_TELEMETRY_PARAMETER_NAMES);
  const QUERY_INDICATOR = /(?:^|[?&])(code|error|error_code|error_description)=/;
  const FRAGMENT_INDICATOR = /(?:^|[#&])(access_token|refresh_token|type|error|error_code|error_description)=/;

  function looksLikeAuthCallback(search, hash) {
    const query = String(search || "");
    const fragment = String(hash || "");
    return QUERY_INDICATOR.test(query) || FRAGMENT_INDICATOR.test(fragment);
  }

  function captureShapeTelemetry(search, hash) {
    const query = String(search || "");
    const fragment = String(hash || "");
    const hasQuery = query !== "";
    const hasHash = fragment !== "";
    const presence = {
      query: hasQuery,
      hash: hasHash,
      unknown: false,
      duplicate: false,
    };
    for (const name of CALLBACK_TELEMETRY_PARAMETER_NAMES) presence[name] = false;
    const parameterNames = new Set();

    function inspect(raw, prefix) {
      if (!raw) return;
      if (!raw.startsWith(prefix)) {
        presence.unknown = true;
        parameterNames.add("unknown");
        return;
      }
      const seen = new Set();
      try {
        const params = new URLSearchParams(raw.slice(1));
        for (const [rawName] of params.entries()) {
          const name = CALLBACK_TELEMETRY_PARAMETER_SET.has(rawName) ? rawName : "unknown";
          if (seen.has(rawName)) presence.duplicate = true;
          seen.add(rawName);
          presence[name] = true;
          parameterNames.add(name);
        }
      } catch (error) {
        presence.unknown = true;
        parameterNames.add("unknown");
      }
    }

    inspect(query, "?");
    inspect(fragment, "#");
    return Object.freeze({
      transport: hasQuery !== hasHash ? (hasQuery ? "query" : "hash") : "none",
      parameterNames: Object.freeze(Array.from(parameterNames).sort()),
      presence: Object.freeze(presence),
      parseStage: "bridge",
      rejectReason: "PENDING",
    });
  }

  function telemetryOutcome(telemetry, parseStage, rejectReason) {
    return Object.freeze({
      transport: telemetry.transport,
      parameterNames: telemetry.parameterNames,
      presence: telemetry.presence,
      parseStage,
      rejectReason,
    });
  }

  function strictRecoveryRedirect(location, search, hash) {
    if (String(location?.origin || "") !== FORMAL_ORIGIN
      || !FORMAL_PATHS.has(String(location?.pathname || ""))
      || String(search || "") !== ""
      || !String(hash || "").startsWith("#")) return "";
    const values = {};
    let count = 0;
    try {
      const params = new URLSearchParams(String(hash).slice(1));
      for (const [key, value] of params.entries()) {
        count += 1;
        if (!RECOVERY_FRAGMENT_FIELDS.has(key)
          || Object.prototype.hasOwnProperty.call(values, key)
          || !value
          || value.length > TOKEN_MAX_LENGTH
          || /[\u0000-\u001F\u007F]/.test(value)) return "";
        values[key] = value;
      }
    } catch (error) {
      return "";
    }
    const required = ["access_token", "expires_in", "refresh_token", "token_type", "type"];
    if (count < required.length
      || !required.every((key) => Object.prototype.hasOwnProperty.call(values, key))
      || !Object.keys(values).every((key) => required.includes(key) || key === "expires_at")
      || values.type !== "recovery"
      || String(values.token_type).toLowerCase() !== "bearer"
      || String(values.access_token).length < 32
      || String(values.refresh_token).length < 20) return "";
    const expiresIn = Number(values.expires_in);
    const expiresAt = Object.prototype.hasOwnProperty.call(values, "expires_at") ? Number(values.expires_at) : null;
    if (!Number.isSafeInteger(expiresIn)
      || expiresIn < 1
      || expiresIn > 86400
      || (expiresAt !== null && (!Number.isSafeInteger(expiresAt) || expiresAt < 1))) return "";
    const output = new URLSearchParams();
    for (const key of ["access_token", "expires_in", "expires_at", "refresh_token", "token_type", "type"]) {
      if (Object.prototype.hasOwnProperty.call(values, key)) output.set(key, values[key]);
    }
    return `${RECOVERY_REDIRECT_URL}#${output.toString()}`;
  }

  function captureAuthCallback(browserRoot) {
    const location = browserRoot?.location;
    const history = browserRoot?.history;
    if (!location || !history || typeof history.replaceState !== "function") return null;
    const search = String(location.search || "");
    const hash = String(location.hash || "");
    if (!looksLikeAuthCallback(search, hash)) return null;
    const telemetry = captureShapeTelemetry(search, hash);

    const recoveryRedirect = strictRecoveryRedirect(location, search, hash);
    if (recoveryRedirect) {
      try {
        history.replaceState(null, "", String(location.pathname || ""));
      } catch (error) {
        return Object.freeze({
          kind: "recovery-redirect",
          scrubbed: false,
          redirected: false,
          telemetry: telemetryOutcome(telemetry, "bridge", "SCRUB_FAILED"),
        });
      }
      try {
        location.replace(recoveryRedirect);
        return Object.freeze({
          kind: "recovery-redirect",
          scrubbed: true,
          redirected: true,
          telemetry: telemetryOutcome(telemetry, "complete", "RECOVERY_ROUTED"),
        });
      } catch (error) {
        return Object.freeze({
          kind: "recovery-redirect",
          scrubbed: true,
          redirected: false,
          telemetry: telemetryOutcome(telemetry, "bridge", "RECOVERY_REDIRECT_FAILED"),
        });
      }
    }

    const source = {
      kind: "auth-callback",
      origin: String(location.origin || ""),
      pathname: String(location.pathname || ""),
      search: search.length <= CALLBACK_MAX_LENGTH ? search : "",
      hash: hash.length <= CALLBACK_MAX_LENGTH ? hash : "",
      oversized: search.length > CALLBACK_MAX_LENGTH || hash.length > CALLBACK_MAX_LENGTH,
      scrubbed: false,
      telemetry,
    };
    try {
      history.replaceState(null, "", source.pathname);
      source.scrubbed = true;
    } catch (error) {
      source.scrubbed = false;
    }
    return Object.freeze(source);
  }

  return Object.freeze({
    AUTH_CALLBACK_BRIDGE_VERSION,
    RECOVERY_REDIRECT_URL,
    looksLikeAuthCallback,
    captureShapeTelemetry,
    captureAuthCallback,
  });
});
