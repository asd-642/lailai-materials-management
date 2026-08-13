(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuth = api;
  if (root && root.document) api.bootstrapBrowserRuntime(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const FORMAL_PUSH_CONFIRMATION = "å•Ÿç”¨å”¯ä¸€æ­£å¼æŽ¨é€";
  const AUTH_RUNTIME_VERSION = "20260813-password-login-official-access-token-response-001";
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
  const AUTH_RESPONSE_MAX_LENGTH = 1048576;
  const PASSWORD_SESSION_REQUIRED_FIELDS = Object.freeze([
    "access_token",
    "expires_in",
    "refresh_token",
    "token_type",
    "user",
  ]);
  const PASSWORD_SESSION_FIELDS = Object.freeze(new Set([
    ...PASSWORD_SESSION_REQUIRED_FIELDS,
    "expires_at",
    "id_token",
    "provider_refresh_token",
    "provider_token",
  ]));
  const PASSWORD_FLAT_RESPONSE_FIELDS = Object.freeze(new Set([
    ...PASSWORD_SESSION_FIELDS,
    "weak_password",
  ]));
  const PASSWORD_NESTED_RESPONSE_FIELDS = Object.freeze(new Set(["data", "error"]));
  const PASSWORD_NESTED_DATA_FIELDS = Object.freeze(new Set(["session", "user", "weakPassword"]));
  const WEAK_PASSWORD_REASONS = Object.freeze(new Set(["characters", "length", "pwned"]));
  const PASSWORD_TELEMETRY_SCOPES = Object.freeze(["topLevel", "data", "session", "user"]);
  const PASSWORD_TELEMETRY_FIELD_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;
  const PASSWORD_TELEMETRY_MAX_FIELDS = 64;
  const PASSWORD_TELEMETRY_CONTAINERS = Object.freeze(new Set(["flat", "nested", "other"]));
  const PASSWORD_TELEMETRY_STAGES = Object.freeze(new Set([
    "idle",
    "json",
    "container",
    "fields",
    "identity",
    "metadata",
    "session",
    "accepted",
  ]));
  const PASSWORD_TELEMETRY_REASONS = Object.freeze(new Set([
    "NOT_PRESENT",
    "PENDING",
    "HTTP_REJECTED",
    "JSON_INVALID",
    "DUPLICATE_KEY",
    "CONTAINER_UNSUPPORTED",
    "MIXED_CONTAINER",
    "UNKNOWN_FIELDS",
    "TOP_LEVEL_FIELDS_INVALID",
    "DATA_FIELDS_INVALID",
    "SESSION_FIELDS_INVALID",
    "IDENTITY_CONFLICT",
    "WEAK_PASSWORD_INVALID",
    "SESSION_CORE_INVALID",
    "ACCEPTED",
  ]));
  const PASSWORD_TELEMETRY_VALUE_TYPES = Object.freeze(new Set([
    "string",
    "number",
    "boolean",
    "object",
    "array",
    "null",
    "missing",
  ]));
  const GLOBAL_AUTH_DIAGNOSTIC_NODE_ID = "materials-quote-supabase-auth-diagnostic";
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

  function hasExactFields(value, allowedFields, requiredFields) {
    return isRecord(value)
      && Object.keys(value).every((key) => allowedFields.has(key))
      && requiredFields.every((key) => hasOwn(value, key));
  }

  function telemetryValueType(value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "object") return "object";
    return "missing";
  }

  function describeTelemetryRecord(value) {
    if (!isRecord(value)) return Object.freeze({ fields: Object.freeze([]), types: Object.freeze([]) });
    const entries = Object.keys(value)
      .slice(0, PASSWORD_TELEMETRY_MAX_FIELDS)
      .map((rawName) => {
        const name = PASSWORD_TELEMETRY_FIELD_NAME_PATTERN.test(rawName) ? rawName : "invalid_field_name";
        return Object.freeze({ name, type: telemetryValueType(value[rawName]) });
      })
      .sort((left, right) => left.name.localeCompare(right.name));
    if (Object.keys(value).length > PASSWORD_TELEMETRY_MAX_FIELDS) {
      entries.push(Object.freeze({ name: "too_many_fields", type: "missing" }));
    }
    return Object.freeze({
      fields: Object.freeze(Array.from(new Set(entries.map((entry) => entry.name))).sort()),
      types: Object.freeze(Array.from(new Set(entries.map((entry) => `${entry.name}:${entry.type}`))).sort()),
    });
  }

  function freezePasswordLoginTelemetry(value) {
    const fields = {};
    const types = {};
    for (const scope of PASSWORD_TELEMETRY_SCOPES) {
      fields[scope] = Object.freeze(Array.isArray(value?.fields?.[scope]) ? [...value.fields[scope]] : []);
      types[scope] = Object.freeze(Array.isArray(value?.types?.[scope]) ? [...value.types[scope]] : []);
    }
    return Object.freeze({
      container: PASSWORD_TELEMETRY_CONTAINERS.has(String(value?.container || "")) ? String(value.container) : "other",
      fields: Object.freeze(fields),
      types: Object.freeze(types),
      stage: PASSWORD_TELEMETRY_STAGES.has(String(value?.stage || "")) ? String(value.stage) : "idle",
      reason: PASSWORD_TELEMETRY_REASONS.has(String(value?.reason || "")) ? String(value.reason) : "NOT_PRESENT",
      flags: Object.freeze({
        duplicate: value?.flags?.duplicate === true,
        mixed: value?.flags?.mixed === true,
        conflict: value?.flags?.conflict === true,
        unknown: value?.flags?.unknown === true,
      }),
      presence: Object.freeze({
        data: value?.presence?.data === true,
        session: value?.presence?.session === true,
        user: value?.presence?.user === true,
        error: value?.presence?.error === true,
        weak_password: value?.presence?.weak_password === true,
        weakPassword: value?.presence?.weakPassword === true,
      }),
    });
  }

  function emptyPasswordLoginTelemetry() {
    return freezePasswordLoginTelemetry({
      container: "other",
      stage: "idle",
      reason: "NOT_PRESENT",
    });
  }

  function normalizePasswordLoginTelemetry(value) {
    if (!isRecord(value)) return emptyPasswordLoginTelemetry();
    const fields = {};
    const types = {};
    for (const scope of PASSWORD_TELEMETRY_SCOPES) {
      const rawFields = Array.isArray(value?.fields?.[scope]) ? value.fields[scope] : [];
      fields[scope] = Array.from(new Set(rawFields
        .map(String)
        .filter((name) => PASSWORD_TELEMETRY_FIELD_NAME_PATTERN.test(name))))
        .slice(0, PASSWORD_TELEMETRY_MAX_FIELDS)
        .sort();
      const allowedFields = new Set(fields[scope]);
      const rawTypes = Array.isArray(value?.types?.[scope]) ? value.types[scope] : [];
      types[scope] = Array.from(new Set(rawTypes.map(String).filter((entry) => {
        const separator = entry.lastIndexOf(":");
        if (separator < 1) return false;
        return allowedFields.has(entry.slice(0, separator))
          && PASSWORD_TELEMETRY_VALUE_TYPES.has(entry.slice(separator + 1));
      }))).slice(0, PASSWORD_TELEMETRY_MAX_FIELDS).sort();
    }
    return freezePasswordLoginTelemetry({
      container: value.container,
      fields,
      types,
      stage: value.stage,
      reason: value.reason,
      flags: value.flags,
      presence: value.presence,
    });
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
  ×ºæÚ$z{-®éÜj×&ööÆVâ‡V&Æ–46öæf–rbbWF‚ç6–væVD–âbb÷væW%fW&–f–VBbbWF†÷&—¦F–öå†6RÓÓÒ&WF†÷&—¦VB"’À¢6ä&ö÷G7G&f—'7D÷væW"À¢÷væW$&ö÷G7G&†6RÀ¢6öFS¢7G&–ær†Æ7D6öFRÇÂ""’À¢Æöv–å7FvRÀ¢6ÆÆ&6µ7FvRÀ¢6ÆÆ&6µFVÆVÖWG'’À¢77v÷&DÆöv–åFVÆVÖWG'’À¢Æ7EW6„ö³¢Æ7EW6…&W7VÇCòæö²ÓÓÒG'VRÀ¢Ò“°¢Ð ¢gVæ7F–öâV&Æ—6‚‚’°¢6öç7Bf6FRÒ7–æ46öæf–wW&F–öâ‚“°¢–b†6öæf–t’bbG—Vöb6öæf–t’çV&Æ—6…7–æ4f6FRÓÓÒ&gVæ7F–öâ"’6öæf–t’çV&Æ—6…7–æ4f6FR†f6FR“°¢6öç7B7FGW2ÒV&Æ–57FGW2‚“°¢–b‡G—Vöb6ÆÆ&6µFVÆVÖWG'•V&Æ—6†W"ÓÓÒ&gVæ7F–öâ"’°¢G'’°¢6ÆÆ&6µFVÆVÖWG'•V&Æ—6†W"‡7FGW2æ6ÆÆ&6µFVÆVÖWG'’Â7FGW2“°¢Ò6F6‚†W'&÷"’°¢òòF–væ÷7F–2&VæFW&–ær6ææ÷BÇFW"WF‚÷"WF†÷&—¦F–öâ7FFRà¢Ð¢Ð¢–b‡G—Vöb77v÷&DÆöv–åFVÆVÖWG'•V&Æ—6†W"ÓÓÒ&gVæ7F–öâ"’°¢G'’°¢77v÷&DÆöv–åFVÆVÖWG'•V&Æ—6†W"‡7FGW2ç77v÷&DÆöv–åFVÆVÖWG'’Â7FGW2“°¢Ò6F6‚†W'&÷"’°¢òòF–væ÷7F–2&VæFW&–ær6ææ÷BÇFW"WF‚÷"WF†÷&—¦F–öâ7FFRà¢Ð¢Ð¢–b‡F&vWBbbG—VöbF&vWBæF—7F6„WfVçBÓÓÒ&gVæ7F–öâ"bbG—Vöb&ö÷Còä7W7FöÔWfVçBÓÓÒ&gVæ7F–öâ"’°¢G'’°¢F&vWBæF—7F6„WfVçB†æWr&ö÷Bä7W7FöÔWfVçB‚&ÖFW&–Ç2×V÷FR×7W&6RÖWF‚Ö6†ævR"Â²FWF–Ã¢7FGW2Ò’“°¢Ò6F6‚†W'&÷"’°¢òòT’æ÷F–f–6F–öâf–ÇW&R×W7Bæ÷BÇFW"WF†÷&—¦F–öâà¢Ð¢Ð¢&WGW&â7FGW3°¢Ð ¢7–æ2gVæ7F–öâ–æ—F–Æ—¦R†6ÆÆ&6µ6÷W&6RÒçVÆÂ’°¢6öç7BG&ç6—F–öäE7F'BÒWF…G&ç6—F–öå&Wf—6–öã°¢6öç7B7W'&VçD–æ—F–Æ—¦U&Wf—6–öâÒ²¶–æ—F–Æ—¦U&Wf—6–öã°¢6öç7B†D6ÆÆ&6²Ò&ööÆVâ†6ÆÆ&6µ6÷W&6R“°¢6ÆÆ&6µFVÆVÖWG'’Ò†D6ÆÆ&6°¢òæ÷&ÖÆ—¦T6ÆÆ&6µFVÆVÖWG'’†6ÆÆ&6µ6÷W&6SòçFVÆVÖWG'’¢¢V×G”6ÆÆ&6µFVÆVÖWG'’‚“°¢6öç7B&W7F÷&VBÒ6ÆÆ&6µ6÷W&6P¢òv—B&÷f–FW"æW7F&Æ—6„Öv–4Æ–æµ6W76–öâ†6ÆÆ&6µ6÷W&6R¢¢v—B&÷f–FW"ç&W7F÷&U6W76–öâ‚“°¢–b‡G&ç6—F–öäE7F'BÓÒWF…G&ç6—F–öå&Wf—6–öâÇÂ7W'&VçD–æ—F–Æ—¦U&Wf—6–öâÓÒ–æ—F–Æ—¦U&Wf—6–öâ’°¢&WGW&â&W7F÷&VC°¢Ð¢÷væW%fW&–f–VBÒfÇ6S°¢WF†÷&—¦F–öå†6RÒ&–FÆR#°¢–b††D6ÆÆ&6²’°¢6öç7BF–væ÷7F–2Ò6ÆÆ&6´F–væ÷7F–72çw&—FR†6ÆÆ&6´F–væ÷7F–4f÷%&W7VÇB†6ÆÆ&6µ6÷W&6RÂ&W7F÷&VB’“°¢Æ7D6öFRÒF–væ÷7F–2æ6öFS°¢6ÆÆ&6µ7FvRÒF–væ÷7F–2ç7FvS°¢6ÆÆ&6µFVÆVÖWG'’Òf–æÆ—¦T6ÆÆ&6µFVÆVÖWG'’†6ÆÆ&6µFVÆVÖWG'’ÂF–væ÷7F–2Â&W7F÷&VB“°¢ÒVÇ6R–b‚&W7F÷&VBæö²’°¢6öç7B&Wf–÷W2Ò6ÆÆ&6´F–væ÷7F–72ç&VB‚“°¢6öç7BF–væ÷7F–2Ò&Wf–÷W2ÇÂ6ÆÆ&6´F–væ÷7F–72çw&—FR€¢&W7F÷&VBæ6öFRÓÓÒ%5U$4UôUD…õ4U54”ôåõ5Dõ$tUôd”ÄTB ¢ò4ÄÄ$4µôD”täõ5D”5õ5DEU4U2ç7F÷&vP¢¢4ÄÄ$4µôD”täõ5D”5õ5DEU4U2ææô6ÆÆ&6²À¢“°¢Æ7D6öFRÒF–væ÷7F–2æ6öFS°¢6ÆÆ&6µ7FvRÒF–væ÷7F–2ç7FvS°¢ÒVÇ6R°¢Æ7D6öFRÒ%5U$4UôUD…ôõtäU%ôtDUõ$UT•$TB#°¢6ÆÆ&6µ7FvRÒ"#°¢Ð¢V&Æ—6‚‚“°¢&WGW&â&W7F÷&VC°¢Ð ¢7–æ2gVæ7F–öâ6–vä–åv—F…77v÷&B†VÖ–ÂÂ77v÷&B’°¢WF…G&ç6—F–öå&Wf—6–öâ³Ò°¢6ÆÆ&6´F–væ÷7F–72æ6ÆV"‚“°¢6ÆÆ&6µ7FvRÒ"#°¢6ÆÆ&6µFVÆVÖWG'’ÒV×G”6ÆÆ&6µFVÆVÖWG'’‚“°¢77v÷&DÆöv–åFVÆVÖWG'’ÒV×G•77v÷&DÆöv–åFVÆVÖWG'’‚“°¢WF†÷&—¦F–öå†6RÒ&–FÆR#°¢÷væW%fW&–f–VBÒfÇ6S°¢–b†÷væW$&ö÷G7G&†6RÓÒ&6öç7VÖVB"’÷væW$&ö÷G7G&†6RÒ&–FÆR#°¢Æ7EW6…&W7VÇBÒçVÆÃ°¢Æöv–å7FvRÒ'&WVW7B×VæF–ær#°¢V&Æ—6‚‚“°¢6öç7B6–væVD–âÒv—B&÷f–FW"ç6–vä–åv—F…77v÷&B†VÖ–ÂÂ77v÷&B“°¢77v÷&DÆöv–åFVÆVÖWG'’Òæ÷&ÖÆ—¦U77v÷&DÆöv–åFVÆVÖWG'’‡&÷f–FW"ç7FGW2‚’ç77v÷&DÆöv–åFVÆVÖWG'’“°¢–b‚6–væVD–âæö²’°¢Æ7D6öFRÒ6–væVD–âæ6öFS°¢Æöv–å7FvRÒ6–væVD–âæ6öFRÓÓÒ%5U$4UôUD…ôÄôt”åõ$U5ôå4Uô”ådÄ”B ¢ò'&W7öç6RÖ–çfÆ–B ¢¢‡6–væVD–âæ6öFRÓÓÒ%5U$4UôUD…õ4U54”ôåõ5Dõ$tUôd”ÄTB"ò'7F÷&vR×&V¦V7FVB"¢'&WVW7B×&V¦V7FVB"“°¢V&Æ—6‚‚“°¢&WGW&â6–væVD–ã°¢Ð¢Æöv–å7FvRÒ'6W76–öâÖW7F&Æ—6†VB#°¢V&Æ—6‚‚“°¢6öç7BvFRÒv—BfW&–g”÷væW$ÖVÖ&W'6†—‚“°¢Æöv–å7FvRÒ&÷væW"ÖvFRÖ6ö×ÆWFR#°¢V&Æ—6‚‚“°¢&WGW&âvFRæö²ò6–væVD–â¢vFS°¢Ð ¢7–æ2gVæ7F–öâ6–vä÷WB‚’°¢WF…G&ç6—F–öå&Wf—6–öâ³Ò°¢6ÆÆ&6´F–væ÷7F–72æ6ÆV"‚“°¢6ÆÆ&6µ7FvRÒ"#°¢Æöv–å7FvRÒ&–FÆR#°¢77v÷&DÆöv–åFVÆVÖWG'’ÒV×G•77v÷&DÆöv–åFVÆVÖWG'’‚“°¢Æ7D6öFRÒ%5U$4UôUD…õ4”täTEôõUB#°¢WF†÷&—¦F–öå†6RÒ&–FÆR#°¢÷væW%fW&–f–VBÒfÇ6S°¢Æ7EW6…&W7VÇBÒçVÆÃ°¢6öç7B&W7VÇBÒv—B&÷f–FW"ç6–vä÷WB‚“°¢Æ7D6öFRÒ&W7VÇBæö²ò%5U$4UôUD…õ4”täTEôõUB"¢&W7VÇBæ6öFS°¢V&Æ—6‚‚“°¢&WGW&â&W7VÇC°¢Ð ¢7–æ2gVæ7F–öâfW&–g”÷væW$ÖVÖ&W'6†—‚’°¢–b‚V&Æ–46öæf–r’°¢Æ7D6öFRÒ%5U$4UõT$Ä”5ô4ôäd”uõ$UT•$TB#°¢÷væW%fW&–f–VBÒfÇ6S°¢V&Æ—6‚‚“°¢&WGW&âW'&÷%&W7VÇB†Æ7D6öFR“°¢Ð¢6öç7BvFRÒv—B&÷f–FW"çfW&–g”÷væW$ÖVÖ&W'6†—‚“°¢÷væW%fW&–f–VBÒvFRæö²ÓÓÒG'VS°¢Æ7D6öFRÒvFRæö²ò%5U$4Uôdõ$ÔÅõU4…ô4ôäd•$ÔD”ôåõ$UT•$TB"¢vFRæ6öFS°¢–b‚vFRæö²’WF†÷&—¦F–öå†6RÒWF†÷&—¦F–öå†6RÓÓÒ&6öç7VÖVB"ò&6öç7VÖVB"¢&–FÆR#°¢V&Æ—6‚‚“°¢&WGW&âvFS°¢Ð ¢7–æ2gVæ7F–öâ&ö÷G7G&f—'7D÷væW"‚’°¢6öç7BWF‚Ò&÷f–FW"ç7FGW2‚“°¢–b‚V&Æ–46öæf–r’&WGW&âW'&÷%&W7VÇB‚%5U$4UõT$Ä”5ô4ôäd”uõ$UT•$TB"“°¢–b‚WF‚ç6–væVD–â’&WGW&âW'&÷%&W7VÇB‚%5U$4UôUD…õ4”täTEôõUB"“°¢–b†÷væW$&ö÷G7G&†6RÓÓÒ&–âÖfÆ–v‡B"’&WGW&âW'&÷%&W7VÇB‚%5U$4UôUD…ôõtäU%ô$ôõE5E$ô”åôdÄ”t…B"“°¢–b†÷væW$&ö÷G7G&†6RÓÓÒ&6öç7VÖVB"’&WGW&âW'&÷%&W7VÇB‚%5U$4UôUD…ôõtäU%ô$ôõE5E$ôÅ$TE•ô4ôå5TÔTB"“°¢–b†÷væW%fW&–f–VBÇÂÆ7D6öFRÓÒ%5U$4UôUD…ôÔTÔ$U%4„•ô”ådÄ”B"’°¢&WGW&âW'&÷%&W7VÇB‚%5U$4UôUD…ôõtäU%ô$ôõE5E$ôäõEôd”Ä$ÄR"“°¢Ð¢÷væW$&ö÷G7G&†6RÒ&–âÖfÆ–v‡B#°¢Æ7D6öFRÒ%5U$4UôUD…ôõtäU%ô$ôõE5E$ô”åôdÄ”t…B#°¢V&Æ—6‚‚“°¢6öç7B7&VFVBÒv—B&÷f–FW"æ&ö÷G7G&f—'7D÷væW"‚“°¢÷væW$&ö÷G7G&†6RÒ&6öç7VÖVB#°¢–b‚7&VFVBæö²’°¢÷væW%fW&–f–VBÒfÇ6S°¢Æ7D6öFRÒ7&VFVBæ6öFS°¢V&Æ—6‚‚“°¢&WGW&â7&VFVC°¢Ð¢6öç7BvFRÒv—B&÷f–FW"çfW&–g”÷væW$ÖVÖ&W'6†—‚“°¢÷væW%fW&–f–VBÒvFRæö²ÓÓÒG'VS°¢Æ7D6öFRÒvFRæö°¢ò%5U$4Uôdõ$ÔÅõU4…ô4ôäd•$ÔD”ôåõ$UT•$TB ¢¢%5U$4UôUD…ôõtäU%ô$ôõE5E$õõ5D4„T4µôd”ÄTB#°¢V&Æ—6‚‚“°¢&WGW&âvFRæö°¢òö&¦V7Bæg&VW¦R‡²ö³¢G'VRÂ6öFS¢""Â&öÆS¢&÷væW""Â÷&væ—¦F–öä–C¢7G&–ær‡V&Æ–46öæf–ræ÷&væ—¦F–öä–BÇÂ""’Ò¢¢W'&÷%&W7VÇB†Æ7D6öFR“°¢Ð ¢7–æ2gVæ7F–öâWF†÷&—¦Tf÷&ÖÅW6„öæ6R‡²6öæf—&ÖF–öâÂ'F–f7DvFW466WFVBÒÒ·Ò’°¢–b†WF†÷&—¦F–öå†6RÓÓÒ&–âÖfÆ–v‡B"’&WGW&âW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ô”åôdÄ”t…B"“°¢–b†WF†÷&—¦F–öå†6RÓÓÒ&6öç7VÖVB"’&WGW&âW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ôÅ$TE•ô4ôå5TÔTB"“°¢–b‚V&Æ–46öæf–r’&WGW&âW'&÷%&W7VÇB‚%5U$4UõT$Ä”5ô4ôäd”uõ$UT•$TB"“°¢–b†6öæf—&ÖF–öâÓÒdõ$ÔÅõU4…ô4ôäd•$ÔD”ôâÇÂ'F–f7DvFW466WFVBÓÒG'VR’°¢Æ7D6öFRÒ%5U$4Uôdõ$ÔÅõU4…ô4ôäd•$ÔD”ôåõ$UT•$TB#°¢V&Æ—6‚‚“°¢&WGW&âW'&÷%&W7VÇB†Æ7D6öFR“°¢Ð¢6öç7BvFRÒv—BfW&–g”÷væW$ÖVÖ&W'6†—‚“°¢–b‚vFRæö²’&WGW&âvFS°¢WF†÷&—¦F–öå†6RÒ&WF†÷&—¦VB#°¢Æ7D6öFRÒ"#°¢Æ7EW6…&W7VÇBÒçVÆÃ°¢V&Æ—6‚‚“°¢&WGW&âö&¦V7Bæg&VW¦R‡²ö³¢G'VRÂ6öFS¢""Ò“°¢Ð ¢7–æ2gVæ7F–öâW†V7WFTf÷&ÖÅW6‚‡W6‚’°¢–b†WF†÷&—¦F–öå†6RÓÓÒ&–âÖfÆ–v‡B"’&WGW&âW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ô”åôdÄ”t…B"“°¢–b†WF†÷&—¦F–öå†6RÓÓÒ&6öç7VÖVB"’&WGW&âW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ôÅ$TE•ô4ôå5TÔTB"“°¢–b†WF†÷&—¦F–öå†6RÓÒ&WF†÷&—¦VB"ÇÂG—VöbW6‚ÓÒ&gVæ7F–öâ"’°¢&WGW&âW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ôäõEôUD„õ$•¤TB"“°¢Ð¢WF†÷&—¦F–öå†6RÒ&–âÖfÆ–v‡B#°¢Æ7D6öFRÒ"#°¢V&Æ—6‚‚“°¢6öç7BvFRÒv—B&÷f–FW"çfW&–g”÷væW$ÖVÖ&W'6†—‚“°¢÷væW%fW&–f–VBÒvFRæö²ÓÓÒG'VS°¢–b‚vFRæö²’°¢WF†÷&—¦F–öå†6RÒ&6öç7VÖVB#°¢Æ7D6öFRÒvFRæ6öFS°¢Æ7EW6…&W7VÇBÒvFS°¢V&Æ—6‚‚“°¢&WGW&âvFS°¢Ð¢ÆWB&W7VÇC°¢G'’°¢&W7VÇBÒv—BW6‚‚“°¢Ò6F6‚†W'&÷"’°¢&W7VÇBÒW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…ôd”ÄTB"“°¢Ð¢–b‚&W7VÇBÇÂG—Vöb&W7VÇBÓÒ&ö&¦V7B"’&W7VÇBÒW'&÷%&W7VÇB‚%5U$4Uôdõ$ÔÅõU4…õ$U5TÅEô”ådÄ”B"“°¢WF†÷&—¦F–öå†6RÒ&6öç7VÖVB#°¢Æ7D6öFRÒ&W7VÇBæö²ò""¢7G&–ær‡&W7VÇBæ6öFRÇÂ%5U$4Uôdõ$ÔÅõU4…ôd”ÄTB"“°¢Æ7EW6…&W7VÇBÒ&W7VÇC°¢V&Æ—6‚‚“°¢&WGW&â&W7VÇC°¢Ð ¢&÷f–FW"æöäWF…7FFT6†ævR‚†WfVçB’Óâ°¢–b†WfVçBÓÓÒ%4”täTEôõUB"’°¢÷væW%fW&–f–VBÒfÇ6S°¢–b†WF†÷&—¦F–öå†6RÓÒ&6öç7VÖVB"’WF†÷&—¦F–öå†6RÒ&–FÆR#°¢6öç7BF–væ÷7F–2Ò4ÄÄ$4µôD”täõ5D”5ô%•ô4ôDRævWB†Æ7D6öFR“°¢–b‚F–væ÷7F–2ÇÂF–væ÷7F–2ÓÓÒ4ÄÄ$4µôD”täõ5D”5õ5DEU4U2ç7V66W72’°¢Æ7D6öFRÒ%5U$4UôUD…õ4”täTEôõUB#°¢6ÆÆ&6µ7FvRÒ"#°¢Ð¢Ð¢V&Æ—6‚‚“°¢Ò“° ¢V&Æ—6‚‚“° ¢&WGW&âö&¦V7Bæg&VW¦R‡°¢–æ—F–Æ—¦RÀ¢6–vä–åv—F…77v÷&BÀ¢6–vä÷WBÀ¢fW&–g”÷væW$ÖVÖ&W'6†—À¢&ö÷G7G&f—'7D÷væW"À¢WF†÷&—¦Tf÷&ÖÅW6„öæ6RÀ¢W†V7WFTf÷&ÖÅW6‚À¢vWE7–æ46öæf–wW&F–öã¢7–æ46öæf–wW&F–öâÀ¢7FGW3¢V&Æ–57FGW2À¢WF…&÷f–FW#¢&÷f–FW"À¢Ò“°¢Ð ¢gVæ7F–öâVç7W&TvÆö&ÄWF„F–væ÷7F–4æöFR†'&÷w6W%&ö÷B’°¢6öç7BFö7VÖVçBÒ'&÷w6W%&ö÷CòæFö7VÖVçC°¢–b‚Fö7VÖVçBÇÂG—VöbFö7VÖVçBævWDVÆVÖVçD'”–BÓÒ&gVæ7F–öâ"’&WGW&âçVÆÃ°¢ÆWBæöFRÒFö7VÖVçBævWDVÆVÖVçD'”–B„tÄô$ÅôUD…ôD”täõ5D”5ôäôDUô”B“°¢–b†æöFR’&WGW&âæöFS°¢–b‡G—VöbFö7VÖVçBæ7&VFTVÆVÖVçBÓÒ&gVæ7F–öâ"’&WGW&âçVÆÃ°¢æöFRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚&ÖWF"“°¢æöFRæ–BÒtÄô$ÅôUD…ôD”täõ5D”5ôäôDUô”C°¢æöFRæ†–FFVâÒG'VS°¢æöFRç6WDGG&–'WFR‚&FF×7W&6RÖWF‚ÖvÆö&ÂÖF–væ÷7F–2"Â""“°¢6öç7B&VçBÒFö7VÖVçBæ†VBÇÂFö7VÖVçBæFö7VÖVçDVÆVÖVçC°¢–b‚&VçBÇÂG—Vöb&VçBæVæD6†–ÆBÓÒ&gVæ7F–öâ"’&WGW&âçVÆÃ°¢&VçBæVæD6†–ÆB†æöFR“°¢&WGW&âæöFS°¢Ð ¢gVæ7F–öâw&—FTvÆö&Å77v÷&DÆöv–åFVÆVÖWG'’†'&÷w6W%&ö÷BÂFVÆVÖWG'’’°¢6öç7BæöFRÒVç7W&TvÆö&ÄWF„F–væ÷7F–4æöFR†'&÷w6W%&ö÷B“°¢–b‚æöFRÇÂG—VöbæöFRç6WDGG&–'WFRÓÒ&gVæ7F–öâ"’&WGW&âfÇ6S°¢6öç7B6fRÒæ÷&ÖÆ—¦U77v÷&DÆöv–åFVÆVÖWG'’‡FVÆVÖWG'’“°¢6öç7BÆ—7BÒ†w&÷WÂ66÷R’Óâ6fU¶w&÷WÕ·66÷UÒæ¦ö–â‚"Â"“°¢6öç7B&ööÆVâÒ‡fÇVR’ÓâfÇVRÓÓÒG'VRò#"¢##°¢æöFRç6WDGG&–'WFR‚&FF×7W&6RÖWF‚×77v÷&B×&W7öç6RÖ6öçF–æW""Â6fRæ6öçF–æW"“°¢æöFRç6WDGG&–'WFR‚&FF×7W&6RÖWF‚×77v÷&B×&W7öç6R×7FvR"Â6fRç7FvR“°¢æöFRç6WDGG&–'WFR‚&FF×7W&6RÖWF‚×77v÷&B×&W7öç6R×&V6öâ"Â6fRç&V6öâ“°¢f÷"†6öç7B66÷Röb55tõ$EõDTÄTÔUE%•õ44õU2’°¢6öç7BGG&–'WFU66÷RÒ66÷RÓÓÒ'F÷ÆWfVÂ"ò'F÷"¢66÷S°¢æöFRç6WDGG&–'WFR†FF×7W&6RÖWF‚×77v÷&B×&W7öç6RÒG¶GG&–'WFU66÷WÒÖf–VÆG6ÂÆ—7B‚&f–VÆG2"Â66÷R’“°¢æöFRç6WDGG&–'WFR†FF×7W&6RÖWF‚×77v÷&B×&W7öç6RÒG¶GG&–'WFU66÷WÒ×G—W6ÂÆ—7B‚'G—W2"Â66÷R’“°¢Ð¢f÷"†6öç7BæÖRöb²&GWÆ–6FR"Â&Ö—†VB"Â&6öæfÆ–7B"Â'Væ¶æ÷vâ%Ò’°¢æöFRç6WDGG&–'WFR†FF×7W&6RÖWF‚×77v÷&B×&W7öç6RÒG¶æÖWÖÂ&ööÆVâ‡6fRæfÆw5¶æÖUÒ’“°¢Ð¢f÷"†6öç7BæÖRöb²&FF"Â'6W76–öâ"Â'W6W""Â&W'&÷""Â'vVµ÷77v÷&B"Â'vVµ77v÷&B%Ò’°¢æöFRç6WDGG&–'WFR†FF×7W&6RÖWF‚×77v÷&B×&W7öç6RÖ†2ÒG¶æÖRç&WÆ6R‚õòörÂ"Ò"—ÖÂ&ööÆVâ‡6fRç&W6Væ6U¶æÖUÒ’“°¢Ð¢&WGW&âG'VS°¢Ð ¢gVæ7F–öâ&ö÷G7G&'&÷w6W%'VçF–ÖR†'&÷w6W%&ö÷BÒ&ö÷B’°¢–b‚'&÷w6W%&ö÷BÇÂ'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6U'VçF–ÖR’&WGW&â'&÷w6W%&ö÷CòäÖFW&–Ç5V÷FU7W&6U'VçF–ÖRÇÂçVÆÃ°¢6öç7B6öæf–t’Ò'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6U'VçF–ÖT6öæf–s°¢6öç7B6öæf–rÒ6öæf–t“òævWD7W'&VçD6öæf–wW&F–öãòâ‚’ÇÂçVÆÃ°¢6öç7BfWF6„–×ÂÒG—Vöb'&÷w6W%&ö÷BæfWF6‚ÓÓÒ&gVæ7F–öâ"ò'&÷w6W%&ö÷BæfWF6‚æ&–æB†'&÷w6W%&ö÷B’¢çVÆÃ°¢ÆWB'&÷w6W%7F÷&vRÒçVÆÃ°¢ÆWB6ÆÆ&6´F–væ÷7F–57F÷&vRÒçVÆÃ°¢G'’°¢'&÷w6W%7F÷&vRÒ'&÷w6W%&ö÷BæÆö6Å7F÷&vS°¢Ò6F6‚†W'&÷"’°¢'&÷w6W%7F÷&vRÒçVÆÃ°¢Ð¢G'’°¢6ÆÆ&6´F–væ÷7F–57F÷&vRÒ'&÷w6W%&ö÷Bç6W76–öå7F÷&vS°¢Ò6F6‚†W'&÷"’°¢6ÆÆ&6´F–væ÷7F–57F÷&vRÒçVÆÃ°¢Ð¢ÆWB6ÆÆ&6µ6÷W&6RÒ'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6TWF„6ÆÆ&6²ÇÂçVÆÃ°¢6öç7B&÷f–FW"Ò6öæf–p¢ò7&VFU7W&6TWF…&÷f–FW"‡²6öæf–rÂfWF6„–×ÂÂ7F÷&vS¢'&÷w6W%7F÷&vRÒ¢¢7&VFUVæf–Æ&ÆU&÷f–FW"†6öæf–t“òç7FGW3òâ‚’æ6öFRÇÂ%5U$4UõT$Ä”5ô4ôäd”uõ$UT•$TB"“°¢6öç7B–çFVw&F–öâÒ7&VFU'VçF–ÖTWF„–çFVw&F–öâ‡°¢6öæf–rÀ¢WF…&÷f–FW#¢&÷f–FW"À¢6öæf–t’À¢fWF6„–×ÂÀ¢WfVçEF&vWC¢'&÷w6W%&ö÷BÀ¢6ÆÆ&6´F–væ÷7F–57F÷&vRÀ¢–æ—F–Ä6ÆÆ&6µFVÆVÖWG'“¢6ÆÆ&6µ6÷W&6SòçFVÆVÖWG'’ÇÂçVÆÂÀ¢6ÆÆ&6µFVÆVÖWG'•V&Æ—6†W#¢‡FVÆVÖWG'’Â7FGW2’Óâ°¢6öç7B'&–FvRÒ'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6TWF„6ÆÆ&6´'&–FvS°¢–b†'&–FvRbbG—Vöb'&–FvRçw&—FTvÆö&ÅFVÆVÖWG'’ÓÓÒ&gVæ7F–öâ"’°¢'&–FvRçw&—FTvÆö&ÅFVÆVÖWG'’†'&÷w6W%&ö÷BÂFVÆVÖWG'’Â7FGW3òç6–væVD–âÓÓÒG'VRò'6–væVBÖ–â"¢'6–væVBÖ÷WB"“°¢Ð¢ÒÀ¢77v÷&DÆöv–åFVÆVÖWG'•V&Æ—6†W#¢‡FVÆVÖWG'’’Óâ°¢w&—FTvÆö&Å77v÷&DÆöv–åFVÆVÖWG'’†'&÷w6W%&ö÷BÂFVÆVÖWG'’“°¢ÒÀ¢Ò“°¢'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6U'VçF–ÖRÒ–çFVw&F–öã°¢'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6U7–æ46öæf–rÒ–çFVw&F–öâævWE7–æ46öæf–wW&F–öâ‚“°¢G'’°¢FVÆWFR'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6TWF„6ÆÆ&6³°¢Ò6F6‚†W'&÷"’°¢G'’°¢'&÷w6W%&ö÷BäÖFW&–Ç5V÷FU7W&6TWF„6ÆÆ&6²ÒçVÆÃ°¢Ò6F6‚†–væ÷&VB’°¢òòF†R&÷f–FW"7F–ÆÂVæf÷&6W26–ævÆR6ÆÆ&6²6öç7V×F–öâà¢Ð¢Ð¢&öÖ—6Rç&W6öÇfR†–çFVw&F–öâæ–æ—F–Æ—¦R†6ÆÆ&6µ6÷W&6R’’çF†Vâ‚‡&W7VÇB’Óâ°¢6ÆÆ&6µ6÷W&6RÒçVÆÃ°¢–b‡&W7VÇCòæö²ÓÓÒG'VRbb&W7VÇBæ6ÆÆ&6²bb'&÷w6W%&ö÷BæÆö6F–öâ’°¢'&÷w6W%&ö÷BæÆö6F–öâæ†6‚Ò"2÷6WGF–æw2ö6ö×ç’#°¢Ð¢Ò“°¢–b†6öæf–rbbG—Vöb'&÷w6W%&ö÷BæFDWfVçDÆ—7FVæW"ÓÓÒ&gVæ7F–öâ"’°¢'&÷w6W%&ö÷BæFDWfVçDÆ—7FVæW"‚'7F÷&vR"Â†WfVçB’Óâ°¢–b†WfVçCòæ¶W’ÓÓÒ&÷f–FW"ç6W76–öå7F÷&vT¶W’’–çFVw&F–öâæ–æ—F–Æ—¦R‚“°¢Ò“°¢Ð¢&WGW&â–çFVw&F–öã°¢Ð ¢&WGW&âö&¦V7Bæg&VW¦R‡°¢dõ$ÔÅõU4…ô4ôäd•$ÔD”ôâÀ¢UD…õ%TåD”ÔUõdU%4”ôâÀ¢Ôt”5ôÄ”äµô4ÄÄ$4µõU$ÂÀ¢Ôt”5ôÄ”äµô4ÄÄ$4µõU$Å2À¢4ÄÄ$4µôD”täõ5D”5õ5Dõ$tUô´U’À¢4ÄÄ$4µôD”täõ5D”5õ5DEU4U2À¢V×G•77v÷&DÆöv–åFVÆVÖWG'’À¢w&—FTvÆö&Å77v÷&DÆöv–åFVÆVÖWG'’À¢'6TÖv–4Æ–æ´6ÆÆ&6²À¢fÆ–FFTÖv–4Æ–æ´66W75Fö¶VâÀ¢7&VFU7W&6TWF…&÷f–FW"À¢7&VFU'VçF–ÖTWF„–çFVw&F–öâÀ¢&ö÷G7G&'&÷w6W%'VçF–ÖRÀ¢Ò“°§Ò“°