(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseRuntimeConfig = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const RUNTIME_CONFIG_VERSION = "20260811-authority-rebase-004";
  const PUBLIC_CONFIG_SCHEMA = "materials-quote-supabase-runtime-public-config/v1";
  const EXPECTED_ORGANIZATION_SLUG = "lai-lai-materials";
  const EXPECTED_PREVIOUS_REVISION = 0;
  const PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const SHA256_PATTERN = /^[0-9A-F]{64}$/;
  const PUBLISHABLE_KEY_PATTERN = /^sb_publishable_[A-Za-z0-9_-]{20,}$/;
  const PUBLIC_CONFIG_KEYS = Object.freeze([
    "approvedArtifacts",
    "enabled",
    "expectedPreviousRevision",
    "expectedProjectRef",
    "organizationId",
    "organizationSlug",
    "projectUrl",
    "publishableKey",
    "schema",
  ]);
  const APPROVED_ARTIFACT_KEYS = Object.freeze([
    "authorityBaselineSha256",
    "authorityManifestSha256",
    "postPushGateSha256",
    "prePushGateSha256",
  ]);
  const APPROVED_ARTIFACTS = Object.freeze({
    prePushGateSha256: "9AA7F703C3282441AC6892AB9AFD20BADA0E5713958FAB175C1CF5D3BAD721AF",
    postPushGateSha256: "69CFBC59C664C378DE498089031084BABD3CFC599C83AD8F9D099A827E2D98D5",
    authorityBaselineSha256: "6A738FEBAADB2F8E9523ABF15C196C0030354833A40D1BB481675F6F93EBAA66",
    authorityManifestSha256: "578026A1C892B9129C42946B1E05C709DFAB762A5406F41FFD0E7A51A0721A1A",
  });

  let current = Object.freeze({
    ok: false,
    code: "SUPABASE_PUBLIC_CONFIG_MISSING",
    value: null,
  });

  function resultError(code) {
    return Object.freeze({ ok: false, code, value: null });
  }

  function sameKeys(value, expected) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const keys = Object.keys(value).sort();
    return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
  }

  function isCanonicalBase64Url(segment) {
    const source = String(segment || "");
    if (!source || !/^[A-Za-z0-9_-]+$/.test(source) || source.length % 4 === 1) return false;
    try {
      const base64 = source.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      let canonical;
      if (typeof Buffer !== "undefined") {
        const bytes = Buffer.from(padded, "base64");
        canonical = bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      } else {
        const binary = root.atob(padded);
        canonical = root.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      }
      return canonical === source;
    } catch (error) {
      return false;
    }
  }

  function decodeBase64UrlJson(segment) {
    const source = String(segment || "");
    if (!isCanonicalBase64Url(source)) return null;
    try {
      const base64 = source.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      let json;
      if (typeof Buffer !== "undefined") {
        const bytes = Buffer.from(padded, "base64");
        json = bytes.toString("utf8");
        if (!Buffer.from(json, "utf8").equals(bytes)) return null;
      } else {
        const binary = root.atob(padded);
        json = decodeURIComponent(Array.from(binary, (character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
      }
      const value = JSON.parse(json);
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch (error) {
      return null;
    }
  }

  function validatePublishableKey(value, projectRef) {
    const key = String(value || "");
    if (PUBLISHABLE_KEY_PATTERN.test(key)) {
      return Object.freeze({
        ok: true,
        keyKind: "modern-publishable",
        offlineProjectBindingVerified: false,
        liveProjectBindingRequired: true,
      });
    }

    const parts = key.split(".");
    if (parts.length !== 3
      || !isCanonicalBase64Url(parts[2])) {
      return Object.freeze({ ok: false });
    }
    const header = decodeBase64UrlJson(parts[0]);
    const payload = decodeBase64UrlJson(parts[1]);
    if (!header
      || !payload
      || header.alg !== "HS256"
      || (Object.prototype.hasOwnProperty.call(header, "typ") && header.typ !== "JWT")
      || payload.role !== "anon") {
      return Object.freeze({ ok: false });
    }

    const hasRef = Object.prototype.hasOwnProperty.call(payload, "ref");
    const hasIssuer = Object.prototype.hasOwnProperty.call(payload, "iss");
    const expectedIssuer = `https://${projectRef}.supabase.co/auth/v1`;
    const refExact = hasRef && typeof payload.ref === "string" && payload.ref === projectRef;
    if (hasRef && !refExact) {
      return Object.freeze({ ok: false });
    }
    let issuerKind = "missing";
    if (hasIssuer) {
      if (typeof payload.iss !== "string") return Object.freeze({ ok: false });
      if (payload.iss === "supabase") issuerKind = "generic";
      else if (payload.iss === expectedIssuer) issuerKind = "project-exact";
      else return Object.freeze({ ok: false });
    }
    const projectBound = refExact
      ? ["missing", "generic", "project-exact"].includes(issuerKind)
      : issuerKind === "project-exact";
    if (!projectBound) return Object.freeze({ ok: false });
    return Object.freeze({
      ok: true,
      keyKind: "legacy-anon-jwt",
      offlineProjectBindingVerified: true,
      liveProjectBindingRequired: false,
    });
  }

  function validatePublicConfiguration(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return resultError("SUPABASE_PUBLIC_CONFIG_MISSING");
    }
    if (source.schema !== PUBLIC_CONFIG_SCHEMA) return resultError("SUPABASE_PUBLIC_CONFIG_SCHEMA_INVALID");
    if (source.enabled !== true) return resultError("SUPABASE_PUBLIC_CONFIG_REQUIRED");
    if (!sameKeys(source, PUBLIC_CONFIG_KEYS)) return resultError("SUPABASE_PUBLIC_CONFIG_FIELDS_INVALID");
    if (!sameKeys(source.approvedArtifacts, APPROVED_ARTIFACT_KEYS)) {
      return resultError("SUPABASE_ARTIFACT_GATE_CONFIG_INVALID");
    }

    const expectedProjectRef = String(source.expectedProjectRef || "").toLowerCase();
    if (!PROJECT_REF_PATTERN.test(expectedProjectRef)) return resultError("SUPABASE_PROJECT_REF_INVALID");

    let url;
    try {
      url = new URL(String(source.projectUrl || ""));
    } catch (error) {
      return resultError("SUPABASE_PROJECT_URL_INVALID");
    }
    if (url.protocol !== "https:"
      || url.username
      || url.password
      || url.port
      || url.pathname !== "/"
      || url.search
      || url.hash) {
      return resultError("SUPABASE_PROJECT_URL_INVALID");
    }
    if (url.hostname.toLowerCase() !== `${expectedProjectRef}.supabase.co`) {
      return resultError("SUPABASE_PROJECT_MISMATCH");
    }
    const keyValidation = validatePublishableKey(source.publishableKey, expectedProjectRef);
    if (!keyValidation.ok) {
      return resultError("SUPABASE_PUBLIC_KEY_INVALID");
    }

    const organizationId = String(source.organizationId || "").toLowerCase();
    if (!UUID_PATTERN.test(organizationId)) return resultError("SUPABASE_ORGANIZATION_ID_INVALID");
    if (String(source.organizationSlug || "") !== EXPECTED_ORGANIZATION_SLUG) {
      return resultError("SUPABASE_ORGANIZATION_SLUG_INVALID");
    }
    if (source.expectedPreviousRevision !== EXPECTED_PREVIOUS_REVISION) {
      return resultError("SUPABASE_EXPECTED_REVISION_INVALID");
    }
    for (const key of APPROVED_ARTIFACT_KEYS) {
      const expected = APPROVED_ARTIFACTS[key];
      const actual = String(source.approvedArtifacts[key] || "").toUpperCase();
      if (!SHA256_PATTERN.test(actual) || actual !== expected) {
        return resultError("SUPABASE_ARTIFACT_GATE_CONFIG_INVALID");
      }
    }

    const value = Object.freeze({
      schema: PUBLIC_CONFIG_SCHEMA,
      enabled: true,
      projectUrl: url.origin,
      publishableKey: String(source.publishableKey),
      expectedProjectRef,
      organizationId,
      organizationSlug: EXPECTED_ORGANIZATION_SLUG,
      expectedPreviousRevision: EXPECTED_PREVIOUS_REVISION,
      approvedArtifacts: APPROVED_ARTIFACTS,
      keyKind: keyValidation.keyKind,
      offlineProjectBindingVerified: keyValidation.offlineProjectBindingVerified,
      liveProjectBindingRequired: keyValidation.liveProjectBindingRequired,
    });
    return Object.freeze({ ok: true, code: "", value });
  }

  function safeStatus(result = current) {
    const value = result?.value;
    return Object.freeze({
      ok: result?.ok === true,
      code: String(result?.code || ""),
      configured: result?.ok === true,
      projectRef: value?.expectedProjectRef || "",
      organizationId: value?.organizationId || "",
      organizationSlug: value?.organizationSlug || EXPECTED_ORGANIZATION_SLUG,
      expectedPreviousRevision: value?.expectedPreviousRevision ?? EXPECTED_PREVIOUS_REVISION,
      runtimeConfigVersion: RUNTIME_CONFIG_VERSION,
      keyKind: value?.keyKind || "",
      offlineProjectBindingVerified: value?.offlineProjectBindingVerified === true,
      liveProjectBindingRequired: value?.liveProjectBindingRequired === true,
    });
  }

  function disabledSyncFacade(code) {
    return Object.freeze({
      enabled: false,
      mode: "local-only",
      code: String(code || "SUPABASE_PUBLIC_CONFIG_MISSING"),
      expectedPreviousRevision: EXPECTED_PREVIOUS_REVISION,
    });
  }

  function publishSyncFacade(facade) {
    if (!root) return facade;
    root.MaterialsQuoteSupabaseSyncConfig = facade && typeof facade === "object"
      ? facade
      : disabledSyncFacade("SUPABASE_RUNTIME_AUTH_UNAVAILABLE");
    return root.MaterialsQuoteSupabaseSyncConfig;
  }

  function initialize(source) {
    current = validatePublicConfiguration(source);
    publishSyncFacade(disabledSyncFacade(current.ok ? "SUPABASE_AUTH_SIGNED_OUT" : current.code));
    return safeStatus(current);
  }

  function getCurrentConfiguration() {
    return current.ok ? current.value : null;
  }

  function createSyncConfiguration({ enabled = false, getAccessToken, fetchImpl, authorityContract } = {}) {
    if (!current.ok) return disabledSyncFacade(current.code);
    const value = current.value;
    return Object.freeze({
      enabled: enabled === true,
      mode: enabled === true ? "push-only" : "local-only",
      code: enabled === true ? "" : "SUPABASE_FORMAL_PUSH_NOT_AUTHORIZED",
      url: value.projectUrl,
      anonKey: value.publishableKey,
      organizationId: value.organizationId,
      organizationSlug: value.organizationSlug,
      expectedPreviousRevision: value.expectedPreviousRevision,
      getAccessToken: typeof getAccessToken === "function" ? getAccessToken : null,
      fetchImpl: typeof fetchImpl === "function" ? fetchImpl : undefined,
      authorityContract: authorityContract && typeof authorityContract === "object" ? authorityContract : undefined,
    });
  }

  publishSyncFacade(disabledSyncFacade(current.code));

  return Object.freeze({
    RUNTIME_CONFIG_VERSION,
    PUBLIC_CONFIG_SCHEMA,
    EXPECTED_ORGANIZATION_SLUG,
    EXPECTED_PREVIOUS_REVISION,
    APPROVED_ARTIFACTS,
    validatePublicConfiguration,
    initialize,
    status: () => safeStatus(current),
    getCurrentConfiguration,
    createSyncConfiguration,
    publishSyncFacade,
  });
});
