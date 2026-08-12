(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SupabaseAuthoritativeSync = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SYNC_SCHEMA = "materials-quote-authoritative-sync/v1";
  const SYNC_SCHEMA_VERSION = 1;
  const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
  const LOWER_SHA256_PATTERN = /^[0-9a-f]{64}$/;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const FORBIDDEN_SECRET_KEYS = new Set([
    "accesstoken",
    "anonkey",
    "apikey",
    "authorization",
    "databasepassword",
    "dbpassword",
    "password",
    "refreshtoken",
    "servicerolekey",
    "supabaseaccesstoken",
    "supabaseanonkey",
  ]);

  const DEFAULT_AUTHORITY_CONTRACT = Object.freeze({
    schemaVersion: 1,
    status: "AUTHORITATIVE",
    organizationSlug: "lai-lai-materials",
    schemas: Object.freeze({
      backup: "materials-quote-backup/v2",
      manifest: "materials-quote-backup-manifest/v2",
      state: 3,
      lineage: "materials-quote-lineage/v1",
    }),
    counts: Object.freeze({
      materials: 195,
      customers: 47,
      templates: 2,
      quotes: 3,
      accounts: 6,
      categories: 7,
      workLogs: 36,
      bugReports: 0,
      questionOnlyReviewNotes: 3,
    }),
    roles: Object.freeze({ owner: 1, admin: 2, staff: 3, contractor: 0 }),
    restoreAuditActions: 1,
    hashes: Object.freeze({
      canonical: "6DB9CE5C88991D0155ECA9BF32A7D3C0F889566B14DBB43DCD0922358B670102",
      state: "9CABA4D0D3599E98092D6EF0F21B10E183E03D21D94FDD76564E7D5614C57D74",
      accounts: "D734F6C11CE305E03F06ADF6545205D6750B5C5D09A2A09F6B46B33C1D003F99",
      workLogs: "9AFBEAFC9C43D6A528CA5395BC51A3C876E6927DD76EA2CF8AC3D260BCB9B6BE",
      bugReports: "8C2B1B53D3793606CC4E91306830A58261B849AF62C381429AE2A9F10191E38F",
    }),
    recordHashes: Object.freeze({
      stateFieldsManifest: "506C8375D3B6112B0309A75EEE6536EA4DC2DC1D7734D9FECED21E4534CB17C1",
    }),
    lineageManifestSha256: "1AE42C839D9B549EE7625570687018DBAABB3C8A1C75D15BD54A17C9E758C57D",
  });

  function resultError(code, message = "") {
    return { ok: false, code, message };
  }

  function lowerHash(value) {
    return String(value || "").toLowerCase();
  }

  async function sha256Text(value) {
    if (!globalThis.crypto?.subtle) throw new Error("SUPABASE_SYNC_SHA256_UNAVAILABLE");
    const bytes = new TextEncoder().encode(String(value));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function jsonClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function containsForbiddenSecretKey(value) {
    if (Array.isArray(value)) return value.some(containsForbiddenSecretKey);
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, child]) => (
      FORBIDDEN_SECRET_KEYS.has(String(key).replace(/[^a-z0-9]/gi, "").toLowerCase())
      || containsForbiddenSecretKey(child)
    ));
  }

  function hasExactObjectKeys(value, expectedKeys) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort();
    const expected = [...expectedKeys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
  }

  function questionOnlyReviewNoteCount(state) {
    return (Array.isArray(state?.customers) ? state.customers : []).filter((customer) => (
      typeof customer?.review_note === "string" && /^[?？]+$/.test(customer.review_note.trim())
    )).length;
  }

  function observedCounts(data) {
    const state = data?.state || {};
    const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
    const workLogs = Array.isArray(data?.work_logs) ? data.work_logs : [];
    const bugReports = Array.isArray(data?.bug_reports?.reports) ? data.bug_reports.reports : [];
    const roleCounts = { owner: 0, admin: 0, staff: 0, contractor: 0 };
    accounts.forEach((account) => {
      if (Object.prototype.hasOwnProperty.call(roleCounts, account?.role)) roleCounts[account.role] += 1;
    });
    return {
      counts: {
        materials: Array.isArray(state.materials) ? state.materials.length : -1,
        customers: Array.isArray(state.customers) ? state.customers.length : -1,
        templates: Array.isArray(state.templates) ? state.templates.length : -1,
        quotes: Array.isArray(state.quotes) ? state.quotes.length : -1,
        accounts: accounts.length,
        categories: Array.isArray(state.material_categories) ? state.material_categories.length : -1,
        workLogs: workLogs.length,
        bugReports: bugReports.length,
        questionOnlyReviewNotes: questionOnlyReviewNoteCount(state),
      },
      roles: roleCounts,
      restoreAuditActions: workLogs.filter((entry) => entry?.action === "restore").length,
    };
  }

  function valuesMatch(actual, expected, keys) {
    return keys.every((key) => Number(actual?.[key]) === Number(expected?.[key]));
  }

  function validateAuthorityContract(observed, contract, config) {
    if (!contract || contract.status !== "AUTHORITATIVE" || contract.schemaVersion !== 1) {
      return resultError("AUTHORITY_CONTRACT_REQUIRED", "authoritative contract is required");
    }
    if (contract.organizationSlug !== config.organizationSlug) {
      return resultError("AUTHORITY_ORGANIZATION_MISMATCH", "authority organization does not match runtime configuration");
    }
    const partitionCodes = [
      ["canonical", "AUTHORITY_CANONICAL_MISMATCH"],
      ["state", "AUTHORITY_STATE_MISMATCH"],
      ["accounts", "AUTHORITY_ACCOUNTS_MISMATCH"],
      ["workLogs", "AUTHORITY_WORK_LOGS_MISMATCH"],
      ["bugReports", "AUTHORITY_BUG_REPORTS_MISMATCH"],
    ];
    for (const [key, code] of partitionCodes) {
      if (!SHA256_PATTERN.test(String(contract.hashes?.[key] || ""))
        || lowerHash(observed.hashes[key]) !== lowerHash(contract.hashes[key])) return resultError(code, `${key} hash mismatch`);
    }
    const countKeys = ["materials", "customers", "templates", "quotes", "accounts", "categories", "workLogs", "bugReports", "questionOnlyReviewNotes"];
    if (!valuesMatch(observed.counts, contract.counts, countKeys)) return resultError("AUTHORITY_COUNTS_MISMATCH", "authoritative counts mismatch");
    if (!valuesMatch(observed.roles, contract.roles, ["owner", "admin", "staff", "contractor"])) {
      return resultError("AUTHORITY_ROLES_MISMATCH", "authoritative role counts mismatch");
    }
    if (Number(observed.restoreAuditActions) !== Number(contract.restoreAuditActions)) {
      return resultError("AUTHORITY_RESTORE_AUDIT_MISMATCH", "restore audit count mismatch");
    }
    if (contract.recordHashes?.stateFieldsManifest
      && lowerHash(observed.recordHashes.stateFieldsManifest) !== lowerHash(contract.recordHashes.stateFieldsManifest)) {
      return resultError("AUTHORITY_RECORD_HASH_MANIFEST_MISMATCH", "state field record-hash manifest mismatch");
    }
    if (contract.lineageManifestSha256
      && lowerHash(observed.lineageManifestSha256) !== lowerHash(contract.lineageManifestSha256)) {
      return resultError("AUTHORITY_LINEAGE_MISMATCH", "lineage manifest mismatch");
    }
    return { ok: true, code: "" };
  }

  function validateLocalOwner(actor) {
    return Boolean(actor?.id && actor.role === "owner" && actor.is_active !== false);
  }

  function validateConfiguration(config) {
    if (config?.enabled !== true) return resultError("SUPABASE_SYNC_DISABLED", "local-only mode is active");
    if (!UUID_PATTERN.test(String(config.organizationId || ""))) return resultError("SUPABASE_SYNC_ORGANIZATION_ID_INVALID");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(config.organizationSlug || ""))) {
      return resultError("SUPABASE_SYNC_ORGANIZATION_SLUG_INVALID");
    }
    const expected = Number(config.expectedPreviousRevision);
    if (!Number.isSafeInteger(expected) || expected < 0) return resultError("SUPABASE_SYNC_EXPECTED_REVISION_INVALID");
    return { ok: true, code: "" };
  }

  function normalizeSupabaseUrl(value) {
    try {
      const parsed = new URL(String(value || ""));
      const localHttp = parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname);
      if (parsed.protocol !== "https:" && !localHttp) return "";
      if (parsed.username || parsed.password || parsed.search || parsed.hash) return "";
      return parsed.origin;
    } catch (error) {
      return "";
    }
  }

  function createSupabaseRpcAdapter({ url, anonKey, getAccessToken, fetchImpl = globalThis.fetch } = {}) {
    const baseUrl = normalizeSupabaseUrl(url);
    const publicAnonKey = String(anonKey || "");
    async function pushSnapshot(request) {
      if (!baseUrl || !publicAnonKey || typeof getAccessToken !== "function" || typeof fetchImpl !== "function") {
        return resultError("SUPABASE_RPC_CONFIGURATION_INVALID");
      }
      let accessToken;
      try {
        accessToken = String(await getAccessToken() || "");
      } catch (error) {
        return resultError("SUPABASE_AUTH_TOKEN_UNAVAILABLE");
      }
      if (accessToken.length < 20 || SHA256_PATTERN.test(accessToken)) {
        return resultError("SUPABASE_AUTH_TOKEN_INVALID", "a Supabase Auth access token is required");
      }
      const body = {
        p_organization_id: request.organizationId,
        p_organization_slug: request.organizationSlug,
        p_expected_previous_revision: request.expectedPreviousRevision,
        p_idempotency_key: request.idempotencyKey,
        p_snapshot_schema: request.snapshotSchema,
        p_snapshot_schema_version: request.snapshotSchemaVersion,
        p_source_backup_schema: request.sourceBackupSchema,
        p_source_manifest_schema: request.sourceManifestSchema,
        p_source_app_version: request.sourceAppVersion,
        p_source_exported_at: request.sourceExportedAt,
        p_state_schema_version: request.stateSchemaVersion,
        p_canonical_sha256: request.canonicalSha256,
        p_state_canonical_text: request.stateCanonicalText,
        p_state_sha256: request.stateSha256,
        p_accounts_canonical_text: request.accountsCanonicalText,
        p_accounts_sha256: request.accountsSha256,
        p_work_logs_canonical_text: request.workLogsCanonicalText,
        p_work_logs_sha256: request.workLogsSha256,
        p_bug_reports_canonical_text: request.bugReportsCanonicalText,
        p_bug_reports_sha256: request.bugReportsSha256,
        p_source_manifest: request.sourceManifest,
        p_record_hash_manifest_canonical_text: request.recordHashManifestCanonicalText,
        p_record_hash_manifest_sha256: request.recordHashManifestSha256,
        p_lineage_canonical_text: request.lineageCanonicalText,
        p_lineage_sha256: request.lineageSha256,
        p_counts: request.counts,
      };
      let response;
      let payload;
      try {
        response = await fetchImpl(`${baseUrl}/rest/v1/rpc/push_authoritative_snapshot_v1`, {
          method: "POST",
          headers: {
            apikey: publicAnonKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });
        payload = await response.json();
      } catch (error) {
        return resultError("SUPABASE_RPC_NETWORK_ERROR");
      }
      if (!response.ok || payload?.ok !== true) {
        return resultError(String(payload?.code || `SUPABASE_RPC_HTTP_${Number(response.status) || 0}`), "remote sync rejected");
      }
      return {
        ok: true,
        code: "",
        revision: Number(payload.revision),
        snapshotId: String(payload.snapshot_id || ""),
        organizationId: String(payload.organization_id || ""),
        organizationSlug: String(payload.organization_slug || ""),
        canonicalSha256: String(payload.canonical_sha256 || ""),
        idempotencyKey: String(payload.idempotency_key || ""),
        idempotent: payload.idempotent === true,
      };
    }
    return Object.freeze({ pushSnapshot });
  }

  function createAuthoritativeSync({ domain, adapter, config = {}, authorityContract = DEFAULT_AUTHORITY_CONTRACT } = {}) {
    async function prepare(bundle) {
      const configuration = validateConfiguration(config);
      if (!configuration.ok) return configuration;
      if (!domain?.validateBackupBundle || !domain?.canonicalStringify) return resultError("SUPABASE_SYNC_DOMAIN_UNAVAILABLE");
      const validation = await domain.validateBackupBundle(bundle);
      if (!validation.ok || validation.channel !== "self_backup") return resultError("SUPABASE_SYNC_SELF_BACKUP_REQUIRED");
      const data = bundle?.data;
      if (!data?.state || !Array.isArray(data.accounts) || !Array.isArray(data.work_logs)
        || data.bug_reports?.schema !== "bug-reports-backup/v1"
        || !Array.isArray(data.bug_reports.reports) || !Array.isArray(data.bug_reports.attachments)) {
        return resultError("SUPABASE_SYNC_PAYLOAD_INCOMPLETE");
      }
      if (data.accounts.some((account) => Object.prototype.hasOwnProperty.call(account || {}, "password"))) {
        return resultError("SUPABASE_SYNC_PLAINTEXT_PASSWORD_FORBIDDEN");
      }
      if (data.accounts.some((account) => !LOWER_SHA256_PATTERN.test(String(account?.password_hash || "")))) {
        return resultError("SUPABASE_SYNC_CREDENTIAL_HASH_REQUIRED");
      }
      if (containsForbiddenSecretKey(data) || containsForbiddenSecretKey(bundle.manifest)) {
        return resultError("SUPABASE_SYNC_SECRET_KEY_FORBIDDEN");
      }
      if (!hasExactObjectKeys(bundle.manifest, [
        "schema", "producer", "backup_schema", "backup_format_version", "app_version",
        "state_schema_version", "exported_at", "canonical_payload", "record_hashes", "lineage",
      ])
        || !hasExactObjectKeys(bundle.manifest.canonical_payload, ["format", "algorithm", "sha256"])
        || !hasExactObjectKeys(bundle.manifest.record_hashes, ["state_fields", "accounts", "work_logs", "bug_reports"])
        || !hasExactObjectKeys(bundle.manifest.lineage, [
          "schema", "legacy_manual_totals", "catalog_formula_snapshots", "locked_document_snapshots",
        ])) return resultError("SUPABASE_SYNC_SOURCE_MANIFEST_KEYS_INVALID");

      const stateCanonicalText = domain.canonicalStringify(data.state);
      const accountsCanonicalText = domain.canonicalStringify(data.accounts);
      const workLogsCanonicalText = domain.canonicalStringify(data.work_logs);
      const bugReportsCanonicalText = domain.canonicalStringify(data.bug_reports);
      const canonicalPayloadText = `{"accounts":${accountsCanonicalText},"bug_reports":${bugReportsCanonicalText},"state":${stateCanonicalText},"work_logs":${workLogsCanonicalText}}`;
      if (canonicalPayloadText !== domain.canonicalStringify(data)) return resultError("SUPABASE_SYNC_PAYLOAD_KEYS_INVALID");

      const recordHashManifestCanonicalText = domain.canonicalStringify(bundle.manifest.record_hashes);
      const stateFieldsManifestCanonicalText = domain.canonicalStringify(bundle.manifest.record_hashes.state_fields);
      const lineageCanonicalText = domain.canonicalStringify(bundle.manifest.lineage);
      const counts = observedCounts(data);
      const observed = {
        ...counts,
        hashes: {
          canonical: await sha256Text(canonicalPayloadText),
          state: await sha256Text(stateCanonicalText),
          accounts: await sha256Text(accountsCanonicalText),
          workLogs: await sha256Text(workLogsCanonicalText),
          bugReports: await sha256Text(bugReportsCanonicalText),
        },
        recordHashes: { stateFieldsManifest: await sha256Text(stateFieldsManifestCanonicalText) },
        lineageManifestSha256: await sha256Text(lineageCanonicalText),
      };
      if (lowerHash(observed.hashes.canonical) !== lowerHash(bundle.manifest.canonical_payload.sha256)) {
        return resultError("SUPABASE_SYNC_MANIFEST_CANONICAL_MISMATCH");
      }
      const authority = validateAuthorityContract(observed, authorityContract, config);
      if (!authority.ok) return authority;
      if (bundle.schema !== authorityContract.schemas?.backup
        || bundle.manifest.schema !== authorityContract.schemas?.manifest
        || Number(bundle.manifest.state_schema_version) !== Number(authorityContract.schemas?.state)
        || bundle.manifest.lineage.schema !== authorityContract.schemas?.lineage) {
        return resultError("SUPABASE_SYNC_SCHEMA_CONTRACT_MISMATCH");
      }

      return {
        ok: true,
        code: "",
        request: {
          organizationId: config.organizationId,
          organizationSlug: config.organizationSlug,
          expectedPreviousRevision: Number(config.expectedPreviousRevision),
          snapshotSchema: SYNC_SCHEMA,
          snapshotSchemaVersion: SYNC_SCHEMA_VERSION,
          sourceBackupSchema: bundle.schema,
          sourceManifestSchema: bundle.manifest.schema,
          sourceAppVersion: bundle.app_version,
          sourceExportedAt: bundle.exported_at,
          stateSchemaVersion: bundle.manifest.state_schema_version,
          canonicalPayloadText,
          canonicalSha256: observed.hashes.canonical,
          stateCanonicalText,
          stateSha256: observed.hashes.state,
          accountsCanonicalText,
          accountsSha256: observed.hashes.accounts,
          workLogsCanonicalText,
          workLogsSha256: observed.hashes.workLogs,
          bugReportsCanonicalText,
          bugReportsSha256: observed.hashes.bugReports,
          sourceManifest: jsonClone(bundle.manifest),
          recordHashManifestCanonicalText,
          recordHashManifestSha256: await sha256Text(recordHashManifestCanonicalText),
          lineageCanonicalText,
          lineageSha256: observed.lineageManifestSha256,
          counts: {
            materials: observed.counts.materials,
            customers: observed.counts.customers,
            templates: observed.counts.templates,
            quotes: observed.counts.quotes,
            accounts: observed.counts.accounts,
            categories: observed.counts.categories,
            work_logs: observed.counts.workLogs,
            bug_reports: observed.counts.bugReports,
            question_only_review_notes: observed.counts.questionOnlyReviewNotes,
            restore_audits: observed.restoreAuditActions,
            roles: observed.roles,
          },
        },
      };
    }

    async function push({ bundle, actor, idempotencyKey, expectedPreviousRevision } = {}) {
      if (!validateLocalOwner(actor)) return resultError("SUPABASE_SYNC_LOCAL_OWNER_REQUIRED");
      if (!UUID_PATTERN.test(String(idempotencyKey || ""))) return resultError("SUPABASE_SYNC_IDEMPOTENCY_KEY_INVALID");
      if (!adapter || typeof adapter.pushSnapshot !== "function") return resultError("SUPABASE_SYNC_ADAPTER_UNAVAILABLE");
      const prepared = await prepare(bundle);
      if (!prepared.ok) return prepared;
      const requestedRevision = expectedPreviousRevision === undefined
        ? Number(config.expectedPreviousRevision)
        : Number(expectedPreviousRevision);
      if (!Number.isSafeInteger(requestedRevision) || requestedRevision < 0) return resultError("SUPABASE_SYNC_EXPECTED_REVISION_INVALID");
      const request = { ...prepared.request, expectedPreviousRevision: requestedRevision, idempotencyKey };
      let response;
      try {
        response = await adapter.pushSnapshot(request);
      } catch (error) {
        return resultError("SUPABASE_SYNC_ADAPTER_FAILED", "remote sync adapter failed");
      }
      if (!response || response.ok !== true) {
        return resultError(String(response?.code || "SUPABASE_SYNC_REMOTE_REJECTED"), String(response?.message || "remote rejected sync"));
      }
      if (lowerHash(response.canonicalSha256) !== lowerHash(request.canonicalSha256)
        || response.organizationId !== request.organizationId
        || response.organizationSlug !== request.organizationSlug
        || !UUID_PATTERN.test(String(response.snapshotId || ""))
        || response.idempotencyKey !== request.idempotencyKey
        || !Number.isSafeInteger(Number(response.revision))
        || Number(response.revision) !== requestedRevision + 1) return resultError("SUPABASE_SYNC_RESPONSE_MISMATCH");
      return {
        ok: true,
        code: "",
        revision: Number(response.revision),
        snapshotId: String(response.snapshotId || ""),
        organizationId: response.organizationId,
        organizationSlug: response.organizationSlug,
        canonicalSha256: lowerHash(response.canonicalSha256),
        idempotencyKey: response.idempotencyKey,
        idempotent: response.idempotent === true,
      };
    }

    return Object.freeze({ prepare, push });
  }

  function createAuthoritativePushCoordinator({
    domain,
    createBundle,
    readActor,
    readConfig,
    createAdapter = (config) => createSupabaseRpcAdapter({
      url: config.url,
      anonKey: config.anonKey,
      getAccessToken: config.getAccessToken,
      fetchImpl: config.fetchImpl,
    }),
    makeIdempotencyKey = () => globalThis.crypto?.randomUUID?.(),
  } = {}) {
    let phase = "idle";
    let lastCode = "";
    let lastRevision = null;
    let inFlight = false;
    let attempt = null;

    function configuration() {
      try {
        const value = typeof readConfig === "function" ? readConfig() : null;
        return value && typeof value === "object" ? value : { enabled: false };
      } catch (error) {
        return { enabled: false };
      }
    }

    function actorNow() {
      try {
        return typeof readActor === "function" ? readActor() : null;
      } catch (error) {
        return null;
      }
    }

    function sameActor(left, right) {
      return Boolean(left && right
        && left.id === right.id
        && String(left.account || "") === String(right.account || "")
        && left.role === right.role
        && left.is_active !== false
        && right.is_active !== false);
    }

    function setResult(result, nextPhase = "error") {
      phase = nextPhase;
      lastCode = String(result?.code || "");
      if (result?.ok === true) lastRevision = Number(result.revision);
      return result;
    }

    function status() {
      const config = configuration();
      const actor = actorNow();
      const enabled = config.enabled === true;
      return Object.freeze({
        mode: enabled ? "push-only" : "local-only",
        enabled,
        canPush: enabled && validateLocalOwner(actor) && !inFlight,
        phase,
        code: lastCode,
        revision: Number.isSafeInteger(lastRevision) ? lastRevision : null,
        organizationSlug: enabled ? String(config.organizationSlug || "") : "",
      });
    }

    async function push() {
      const config = configuration();
      const configValidation = validateConfiguration(config);
      if (!configValidation.ok) return setResult(configValidation, config.enabled === true ? "error" : "idle");
      const initialActor = actorNow();
      if (!validateLocalOwner(initialActor)) return setResult(resultError("SUPABASE_SYNC_LOCAL_OWNER_REQUIRED"));
      if (inFlight) return resultError("SUPABASE_SYNC_IN_PROGRESS");
      if (typeof createBundle !== "function" || typeof createAdapter !== "function") {
        return setResult(resultError("SUPABASE_SYNC_RUNTIME_UNAVAILABLE"));
      }

      inFlight = true;
      phase = "pending";
      lastCode = "";
      try {
        let currentBundle;
        try {
          currentBundle = await createBundle();
        } catch (error) {
          return setResult(resultError("SUPABASE_SYNC_BUNDLE_FAILED"));
        }
        const adapter = createAdapter(config);
        const sync = createAuthoritativeSync({
          domain,
          adapter,
          config,
          authorityContract: config.authorityContract || DEFAULT_AUTHORITY_CONTRACT,
        });
        const prepared = await sync.prepare(currentBundle);
        if (!prepared.ok) return setResult(prepared);
        const finalActor = actorNow();
        if (!sameActor(initialActor, finalActor)) return setResult(resultError("SUPABASE_SYNC_ACTOR_CHANGED"));

        const identity = [
          prepared.request.organizationId,
          prepared.request.organizationSlug,
          prepared.request.expectedPreviousRevision,
          prepared.request.canonicalSha256,
          prepared.request.recordHashManifestSha256,
          prepared.request.lineageSha256,
          prepared.request.sourceBackupSchema,
          prepared.request.sourceManifestSchema,
          prepared.request.stateSchemaVersion,
        ].join("\u0000");
        if (!attempt || attempt.identity !== identity) {
          const idempotencyKey = String(makeIdempotencyKey() || "");
          if (!UUID_PATTERN.test(idempotencyKey)) return setResult(resultError("SUPABASE_SYNC_IDEMPOTENCY_KEY_INVALID"));
          attempt = { identity, bundle: currentBundle, idempotencyKey, confirmed: null };
        }
        if (attempt.confirmed?.ok === true) {
          return setResult({ ...attempt.confirmed, alreadyConfirmed: true }, "success");
        }

        const result = await sync.push({
          bundle: attempt.bundle,
          actor: finalActor,
          idempotencyKey: attempt.idempotencyKey,
          expectedPreviousRevision: prepared.request.expectedPreviousRevision,
        });
        if (result.ok === true) {
          attempt.confirmed = result;
          return setResult(result, "success");
        }
        return setResult(result);
      } catch (error) {
        return setResult(resultError("SUPABASE_SYNC_RUNTIME_FAILED"));
      } finally {
        inFlight = false;
      }
    }

    return Object.freeze({ status, push });
  }

  return Object.freeze({
    SYNC_SCHEMA,
    SYNC_SCHEMA_VERSION,
    DEFAULT_AUTHORITY_CONTRACT,
    createAuthoritativeSync,
    createAuthoritativePushCoordinator,
    createSupabaseRpcAdapter,
    validateConfiguration,
  });
});
