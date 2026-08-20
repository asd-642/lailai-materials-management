(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSharedWorkingState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const CONTRACT = "shared-working-state/v1";
  const CACHE_SCHEMA = "materials-quote-shared-working-state-cache/v1";
  const CACHE_KEY = "materials_quote_shared_working_state_confirmed_v1";
  const SOURCE_REVISION = 1;
  const LOWER_SHA256_PATTERN = /^[0-9a-f]{64}$/;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const PARTITIONS = Object.freeze(["accounts", "bug_reports", "state", "work_logs"]);
  const READ_KEYS = Object.freeze([
    "contract", "ok", "organization_id", "organization_slug", "source_canonical_sha256",
    "source_revision", "state", "state_sha256", "updated_at", "version",
  ]);
  const SAVE_KEYS = Object.freeze([
    "contract", "ok", "organization_id", "organization_slug", "source_canonical_sha256",
    "source_revision", "state_sha256", "updated_at", "version",
  ]);
  const FORBIDDEN_SECRET_KEYS = new Set([
    "accesstoken", "anonkey", "apikey", "authorization", "databasepassword", "dbpassword",
    "password", "refreshtoken", "servicerolekey", "supabaseaccesstoken", "supabaseanonkey",
  ]);
  const MESSAGE_BY_CODE = Object.freeze({
    WORKING_STATE_VERSION_CONFLICT: "遠端已有新版本，請重新載入",
    WORKING_STATE_VERSION_EXHAUSTED: "共享資料版本已達上限，已停止所有寫入",
    WORKING_STATE_READ_ONLY: "共享資料尚未完成遠端驗證，目前只能檢視",
    WORKING_STATE_NETWORK_UNAVAILABLE: "目前無法連線遠端；僅顯示最後確認資料，所有修改已停用",
    WORKING_STATE_NOT_INITIALIZED: "共享資料尚未由部署流程初始化，禁止用瀏覽器資料建立",
    WORKING_STATE_OWNER_REQUIRED: "共享資料 v1 只允許已驗證的 Supabase owner 操作",
    WORKING_STATE_MEMBERSHIP_REQUIRED: "Supabase 帳號沒有有效的組織 membership",
    WORKING_STATE_AUTH_REQUIRED: "請先登入 Supabase 帳號並完成 owner 驗證",
    WORKING_STATE_IDENTIFIER_REQUIRED: "共享資料識別設定不完整，已停止寫入",
    WORKING_STATE_ORGANIZATION_MISMATCH: "共享資料組織識別不一致，已停止寫入",
    WORKING_STATE_EXPECTED_VERSION_INVALID: "共享資料版本參數不合法，已停止寫入",
    WORKING_STATE_SCHEMA_INVALID: "共享資料格式未通過安全驗證，未儲存任何變更",
    WORKING_STATE_FORBIDDEN_SECRET_KEY: "候選資料含禁止的憑證欄位，已拒絕送出",
    WORKING_STATE_CACHE_DEGRADED: "本機離線快取不可用；線上編輯仍可使用，重新整理後會重新載入遠端資料",
    SAVE_OUTCOME_UNKNOWN: "遠端寫入結果無法確認；已停止修改並保留最後確認版本",
  });

  function resultError(code, extra = {}) {
    return Object.freeze({ ok: false, code: String(code || "WORKING_STATE_FAILED"), ...extra });
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function exactKeys(value, expected) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
  }

  function canonicalStringify(value) {
    const stack = new Set();
    const encode = (input, inArray = false) => {
      if (input === null) return "null";
      if (typeof input === "string" || typeof input === "boolean") return JSON.stringify(input);
      if (typeof input === "number") {
        if (!Number.isFinite(input)) throw new TypeError("Canonical JSON does not allow non-finite numbers");
        return JSON.stringify(input);
      }
      if (typeof input === "undefined") return inArray ? "null" : undefined;
      if (typeof input !== "object") throw new TypeError("Canonical JSON contains an unsupported value");
      if (stack.has(input)) throw new TypeError("Canonical JSON does not allow circular references");
      stack.add(input);
      let encoded;
      if (Array.isArray(input)) {
        encoded = `[${input.map((item) => encode(item, true) ?? "null").join(",")}]`;
      } else {
        const fields = Object.keys(input).sort().flatMap((key) => {
          const item = encode(input[key], false);
          return item === undefined ? [] : [`${JSON.stringify(key)}:${item}`];
        });
        encoded = `{${fields.join(",")}}`;
      }
      stack.delete(input);
      return encoded;
    };
    return encode(value);
  }

  async function sha256Text(value) {
    const cryptoApi = root?.crypto || globalThis.crypto;
    if (!cryptoApi?.subtle) throw new Error("WORKING_STATE_SHA256_UNAVAILABLE");
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function sha256Canonical(value) {
    return sha256Text(canonicalStringify(value));
  }

  function containsForbiddenSecretKey(value) {
    if (Array.isArray(value)) return value.some(containsForbiddenSecretKey);
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, child]) => {
      const normalized = String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();
      return FORBIDDEN_SECRET_KEYS.has(normalized) || containsForbiddenSecretKey(child);
    });
  }

  function validatePayload(value) {
    if (!exactKeys(value, PARTITIONS)) return resultError("WORKING_STATE_SCHEMA_INVALID");
    if (!Array.isArray(value.accounts)
      || !value.bug_reports || typeof value.bug_reports !== "object" || Array.isArray(value.bug_reports)
      || !value.state || typeof value.state !== "object" || Array.isArray(value.state)
      || !Array.isArray(value.work_logs)) return resultError("WORKING_STATE_SCHEMA_INVALID");
    for (const key of ["materials", "customers", "templates", "quotes", "material_categories"]) {
      if (!Array.isArray(value.state[key])) return resultError("WORKING_STATE_SCHEMA_INVALID");
    }
    if (value.bug_reports.schema !== "bug-reports-backup/v1"
      || !Array.isArray(value.bug_reports.reports)
      || !Array.isArray(value.bug_reports.attachments)) return resultError("WORKING_STATE_SCHEMA_INVALID");
    if (containsForbiddenSecretKey(value)) return resultError("WORKING_STATE_FORBIDDEN_SECRET_KEY");
    return Object.freeze({ ok: true, code: "" });
  }

  function validateConfiguration(config) {
    const organizationId = String(config?.organizationId || "").toLowerCase();
    const organizationSlug = String(config?.organizationSlug || "");
    if (!UUID_PATTERN.test(organizationId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(organizationSlug)) {
      return resultError("WORKING_STATE_CONFIGURATION_INVALID");
    }
    return Object.freeze({ ok: true, organizationId, organizationSlug });
  }

  function validateRemoteEnvelope(value, config, includeState) {
    if (!exactKeys(value, includeState ? READ_KEYS : SAVE_KEYS)
      || value.ok !== true
      || value.contract !== CONTRACT
      || String(value.organization_id || "").toLowerCase() !== config.organizationId
      || String(value.organization_slug || "") !== config.organizationSlug
      || !Number.isSafeInteger(value.version)
      || value.version < 1
      || !LOWER_SHA256_PATTERN.test(String(value.state_sha256 || ""))
      || value.source_revision !== SOURCE_REVISION
      || !LOWER_SHA256_PATTERN.test(String(value.source_canonical_sha256 || ""))
      || typeof value.updated_at !== "string") return resultError("WORKING_STATE_REMOTE_CONTRACT_INVALID");
    if (includeState) {
      const payloadValidation = validatePayload(value.state);
      if (!payloadValidation.ok) return payloadValidation;
    }
    return Object.freeze({ ok: true, code: "" });
  }

  function normalizeBaseUrl(value) {
    try {
      const url = new URL(String(value || ""));
      const isLocal = url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname);
      if ((url.protocol !== "https:" && !isLocal) || url.username || url.password || url.search || url.hash) return "";
      return url.origin;
    } catch (error) {
      return "";
    }
  }

  function createRpcAdapter({ url, publishableKey, getAccessToken, fetchImpl = root?.fetch } = {}) {
    const baseUrl = normalizeBaseUrl(url);
    const publicKey = String(publishableKey || "");
    const request = typeof fetchImpl === "function" ? fetchImpl : null;

    async function rpc(name, body, saveRequest) {
      if (!baseUrl || !publicKey || typeof getAccessToken !== "function" || !request) {
        return resultError("WORKING_STATE_RPC_CONFIGURATION_INVALID", { status: 0 });
      }
      let accessToken = "";
      try { accessToken = String(await getAccessToken() || ""); } catch (error) { accessToken = ""; }
      if (accessToken.length < 20) return resultError("WORKING_STATE_AUTH_REQUIRED", { status: 401 });
      let response;
      try {
        response = await request(`${baseUrl}/rest/v1/rpc/${name}`, {
          method: "POST",
          headers: { apikey: publicKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
          credentials: "omit",
          redirect: "error",
          referrerPolicy: "no-referrer",
        });
      } catch (error) {
        return resultError(saveRequest ? "SAVE_OUTCOME_UNKNOWN" : "WORKING_STATE_NETWORK_UNAVAILABLE", { status: 0 });
      }
      let value = null;
      try { value = await response.json(); } catch (error) { value = null; }
      if (response.ok === true) return Object.freeze({ ok: true, status: Number(response.status), value });
      const code = value && typeof value === "object" && !Array.isArray(value) ? String(value.code || "") : "";
      return resultError(code || `WORKING_STATE_HTTP_${Number(response.status) || 0}`, { status: Number(response.status) || 0 });
    }

    return Object.freeze({
      read: ({ organizationId, organizationSlug }) => rpc("read_shared_working_state_v1", {
        p_organization_id: organizationId,
        p_organization_slug: organizationSlug,
      }, false),
      save: ({ organizationId, organizationSlug, expectedVersion, state }) => rpc("compare_and_save_shared_working_state_v1", {
        p_organization_id: organizationId,
        p_organization_slug: organizationSlug,
        p_expected_version: expectedVersion,
        p_state: state,
      }, true),
    });
  }

  function createLocalStorageCache(storage) {
    let lastWriteCode = "";
    return Object.freeze({
      read() {
        try { return JSON.parse(storage?.getItem(CACHE_KEY) || "null"); } catch (error) { return null; }
      },
      write(value) {
        if (!storage || typeof storage.setItem !== "function") {
          lastWriteCode = "WORKING_STATE_CACHE_STORAGE_UNAVAILABLE";
          return false;
        }
        try {
          storage.setItem(CACHE_KEY, JSON.stringify(value));
          lastWriteCode = "";
          return true;
        } catch (error) {
          lastWriteCode = error?.name === "QuotaExceededError"
            ? "WORKING_STATE_CACHE_QUOTA_EXCEEDED"
            : "WORKING_STATE_CACHE_WRITE_FAILED";
          return false;
        }
      },
      lastWriteCode: () => lastWriteCode,
      clear() {
        try { storage?.removeItem(CACHE_KEY); } catch (error) { /* fail closed in memory */ }
      },
    });
  }

  async function validateCacheRecord(record, config) {
    if (!record || record.schema !== CACHE_SCHEMA
      || record.organizationId !== config.organizationId
      || record.organizationSlug !== config.organizationSlug
      || !Number.isSafeInteger(Number(record.version)) || Number(record.version) < 1
      || !LOWER_SHA256_PATTERN.test(String(record.stateSha256 || ""))
      || Number(record.sourceRevision) !== SOURCE_REVISION
      || !LOWER_SHA256_PATTERN.test(String(record.sourceCanonicalSha256 || ""))) return resultError("WORKING_STATE_CACHE_INVALID");
    const payloadValidation = validatePayload(record.payload);
    if (!payloadValidation.ok) return payloadValidation;
    const computed = await sha256Canonical(record.payload);
    return computed === record.stateSha256
      ? Object.freeze({ ok: true, code: "" })
      : resultError("WORKING_STATE_CACHE_HASH_MISMATCH");
  }

  function createCoordinator({ adapter, cache, application, config } = {}) {
    const checkedConfig = validateConfiguration(config);
    if (!checkedConfig.ok) throw new Error(checkedConfig.code);
    const safeConfig = checkedConfig;
    const remote = adapter;
    const confirmedCache = cache;
    const app = application || {};
    let phase = "idle";
    let code = "WORKING_STATE_READ_ONLY";
    let message = MESSAGE_BY_CODE.WORKING_STATE_READ_ONLY;
    let confirmedPayload = null;
    let remoteVersion = null;
    let stateSha256 = "";
    let sourceCanonicalSha256 = "";
    let activeDraft = null;
    let pendingDraft = null;
    let observedRemote = null;
    let inFlight = false;
    let cacheDegraded = false;
    let cacheCode = "";

    function publicStatus() {
      return Object.freeze({
        configured: true,
        phase,
        code,
        message,
        canMutate: phase === "ready" && !inFlight && Boolean(confirmedPayload),
        remoteVersion,
        stateSha256,
        sourceRevision: confirmedPayload ? SOURCE_REVISION : null,
        sourceCanonicalSha256,
        hasPendingDraft: Boolean(pendingDraft),
        hasObservedRemote: Boolean(observedRemote),
        cacheDegraded,
        cacheCode,
        inFlight,
      });
    }

    function setStatus(nextPhase, nextCode = "", nextMessage = "") {
      phase = nextPhase;
      code = String(nextCode || "");
      message = String(nextMessage || MESSAGE_BY_CODE[code] || "");
      return publicStatus();
    }

    async function commit(payloadValue, envelope, nextPhase = "ready") {
      const record = {
        schema: CACHE_SCHEMA,
        organizationId: safeConfig.organizationId,
        organizationSlug: safeConfig.organizationSlug,
        version: Number(envelope.version),
        stateSha256: String(envelope.state_sha256),
        sourceRevision: SOURCE_REVISION,
        sourceCanonicalSha256: String(envelope.source_canonical_sha256),
        payload: clone(payloadValue),
      };
      let applicationCommitted = false;
      try { applicationCommitted = app.commitConfirmed?.(clone(payloadValue)) !== false; } catch (error) { applicationCommitted = false; }
      if (!applicationCommitted) {
        setStatus("cache-write-failed", "WORKING_STATE_APPLICATION_COMMIT_FAILED");
        return resultError("WORKING_STATE_APPLICATION_COMMIT_FAILED");
      }
      confirmedPayload = clone(payloadValue);
      remoteVersion = Number(envelope.version);
      stateSha256 = String(envelope.state_sha256);
      sourceCanonicalSha256 = String(envelope.source_canonical_sha256);
      pendingDraft = null;
      observedRemote = null;
      let cacheWritten = false;
      try { cacheWritten = await confirmedCache?.write(record) === true; } catch (error) { cacheWritten = false; }
      cacheDegraded = !cacheWritten;
      cacheCode = cacheWritten
        ? ""
        : String(confirmedCache?.lastWriteCode?.() || "WORKING_STATE_CACHE_WRITE_FAILED");
      const nextCode = nextPhase === "ready"
        ? (cacheDegraded ? "WORKING_STATE_CACHE_DEGRADED" : "")
        : "WORKING_STATE_NETWORK_UNAVAILABLE";
      setStatus(nextPhase, nextCode);
      if (cacheDegraded) app.notify?.("WORKING_STATE_CACHE_DEGRADED");
      return Object.freeze({
        ok: true,
        code: nextCode,
        version: remoteVersion,
        stateSha256,
        cacheDegraded,
        cacheCode,
      });
    }

    async function parseReadResult(result) {
      if (!result?.ok) return resultError(result?.code || "WORKING_STATE_NETWORK_UNAVAILABLE", { status: Number(result?.status) || 0 });
      const validation = validateRemoteEnvelope(result.value, safeConfig, true);
      if (!validation.ok) return validation;
      const computed = await sha256Canonical(result.value.state);
      if (computed !== result.value.state_sha256) return resultError("WORKING_STATE_REMOTE_HASH_MISMATCH");
      return Object.freeze({ ok: true, code: "", envelope: result.value, payload: clone(result.value.state) });
    }

    async function readRemote() {
      try {
        return await parseReadResult(await remote.read({
          organizationId: safeConfig.organizationId,
          organizationSlug: safeConfig.organizationSlug,
        }));
      } catch (error) {
        return resultError("WORKING_STATE_NETWORK_UNAVAILABLE", { status: 0 });
      }
    }

    async function hydrate() {
      if (inFlight) return resultError("WORKING_STATE_IN_FLIGHT");
      inFlight = true;
      setStatus("hydrating", "WORKING_STATE_READ_ONLY");
      try {
        const read = await readRemote();
        if (read.ok) return commit(read.payload, read.envelope, "ready");
        const cached = read.code === "WORKING_STATE_NETWORK_UNAVAILABLE" ? confirmedCache?.read?.() : null;
        const cacheValidation = cached
          ? await validateCacheRecord(cached, safeConfig)
          : resultError("WORKING_STATE_CACHE_NOT_APPLICABLE");
        if (read.code === "WORKING_STATE_NETWORK_UNAVAILABLE" && cacheValidation.ok) {
          const cachedEnvelope = {
            version: cached.version,
            state_sha256: cached.stateSha256,
            source_canonical_sha256: cached.sourceCanonicalSha256,
          };
          confirmedPayload = clone(cached.payload);
          remoteVersion = Number(cached.version);
          stateSha256 = String(cached.stateSha256);
          sourceCanonicalSha256 = String(cached.sourceCanonicalSha256);
          app.commitConfirmed?.(clone(cached.payload));
          setStatus("offline-read-only", "WORKING_STATE_NETWORK_UNAVAILABLE");
        } else {
          setStatus("unavailable", read.code, MESSAGE_BY_CODE[read.code]);
        }
        return read;
      } finally {
        inFlight = false;
      }
    }

    async function verifiedSave(candidate, candidateHash, expectedVersion) {
      let saved;
      try {
        saved = await remote.save({
          organizationId: safeConfig.organizationId,
          organizationSlug: safeConfig.organizationSlug,
          expectedVersion,
          state: clone(candidate),
        });
      } catch (error) {
        saved = resultError("SAVE_OUTCOME_UNKNOWN", { status: 0 });
      }
      if (saved?.ok) {
        const validation = validateRemoteEnvelope(saved.value, safeConfig, false);
        if (!validation.ok
          || Number(saved.value.version) !== expectedVersion + 1
          || saved.value.state_sha256 !== candidateHash) {
          const readback = await readRemote();
          if (readback.ok
            && Number(readback.envelope.version) === expectedVersion + 1
            && readback.envelope.state_sha256 === candidateHash) {
            return Object.freeze({ ok: true, envelope: readback.envelope, confirmedByReadback: true });
          }
          if (readback.ok) observedRemote = readback;
          return resultError("WORKING_STATE_SAVE_CONTRACT_INVALID");
        }
        return Object.freeze({ ok: true, envelope: saved.value, confirmedByReadback: false });
      }
      const status = Number(saved?.status) || 0;
      const saveCode = String(saved?.code || "");
      if (status === 409 && saveCode !== "WORKING_STATE_VERSION_CONFLICT" && saveCode !== "WORKING_STATE_VERSION_EXHAUSTED") {
        return resultError("WORKING_STATE_SAVE_CONTRACT_INVALID");
      }
      if (saveCode === "SAVE_OUTCOME_UNKNOWN") {
        const readback = await readRemote();
        if (readback.ok
          && Number(readback.envelope.version) === expectedVersion + 1
          && readback.envelope.state_sha256 === candidateHash) {
          return Object.freeze({ ok: true, envelope: readback.envelope, confirmedByReadback: true });
        }
        if (readback.ok) observedRemote = readback;
        return resultError("SAVE_OUTCOME_UNKNOWN");
      }
      if (saveCode === "WORKING_STATE_VERSION_CONFLICT") {
        const latest = await readRemote();
        if (latest.ok) observedRemote = latest;
      }
      return resultError(saveCode || "WORKING_STATE_SAVE_FAILED", { status });
    }

    async function runSharedMutation(mutator, options = {}) {
      if (phase !== "ready" || !confirmedPayload) {
        app.notify?.("WORKING_STATE_READ_ONLY");
        return resultError("WORKING_STATE_READ_ONLY");
      }
      if (inFlight || activeDraft) return resultError("WORKING_STATE_IN_FLIGHT");
      inFlight = true;
      const previous = clone(confirmedPayload);
      activeDraft = clone(confirmedPayload);
      app.beginDraft?.(activeDraft, String(options.name || "mutation"));
      let handlerResult;
      try {
        handlerResult = await mutator(activeDraft);
      } catch (error) {
        app.endDraft?.(clone(previous));
        activeDraft = null;
        app.discardEffects?.();
        inFlight = false;
        return resultError("WORKING_STATE_MUTATION_FAILED");
      }
      const candidate = clone(activeDraft);
      app.endDraft?.(clone(previous));
      activeDraft = null;
      try {
        if (canonicalStringify(candidate) === canonicalStringify(previous)) {
          app.flushEffects?.();
          return Object.freeze({ ok: true, code: "", unchanged: true, value: handlerResult });
        }
        const candidateValidation = validatePayload(candidate);
        if (!candidateValidation.ok) {
          pendingDraft = candidate;
          app.discardEffects?.();
          app.notify?.(candidateValidation.code);
          return candidateValidation;
        }
        const candidateHash = await sha256Canonical(candidate);
        const expectedVersion = remoteVersion;
        const saved = await verifiedSave(candidate, candidateHash, expectedVersion);
        if (!saved.ok) {
          pendingDraft = candidate;
          app.discardEffects?.();
          const nextPhase = saved.code === "WORKING_STATE_VERSION_CONFLICT" ? "conflict" : "read-only-error";
          setStatus(nextPhase, saved.code);
          app.notify?.(saved.code);
          return saved;
        }
        const committed = await commit(candidate, saved.envelope, "ready");
        if (!committed.ok) {
          app.discardEffects?.();
          return committed;
        }
        app.flushEffects?.();
        return Object.freeze({ ok: true, code: "", version: remoteVersion, confirmedByReadback: saved.confirmedByReadback, value: handlerResult });
      } finally {
        inFlight = false;
      }
    }

    async function reloadLatest() {
      if (inFlight) return resultError("WORKING_STATE_IN_FLIGHT");
      inFlight = true;
      const draftToPreserve = pendingDraft ? clone(pendingDraft) : null;
      setStatus("hydrating", "WORKING_STATE_READ_ONLY");
      try {
        let latest = observedRemote;
        if (!latest?.ok) latest = await readRemote();
        if (!latest.ok) {
          setStatus("offline-read-only", latest.code || "WORKING_STATE_NETWORK_UNAVAILABLE");
          return latest;
        }
        const committed = await commit(latest.payload, latest.envelope, "ready");
        if (committed.ok) {
          pendingDraft = draftToPreserve;
          app.flushEffects?.();
        }
        return committed;
      } finally {
        inFlight = false;
      }
    }

    async function reapplyPendingDraft() {
      if (!pendingDraft) return resultError("WORKING_STATE_PENDING_DRAFT_MISSING");
      const candidate = clone(pendingDraft);
      return runSharedMutation((draft) => {
        PARTITIONS.forEach((name) => { draft[name] = clone(candidate[name]); });
      }, { name: "reapply-pending-draft" });
    }

    function deactivate(nextCode = "WORKING_STATE_AUTH_REQUIRED") {
      activeDraft = null;
      pendingDraft = null;
      observedRemote = null;
      setStatus(confirmedPayload ? "offline-read-only" : "idle", nextCode);
      return publicStatus();
    }

    function denyMutation(nextCode = "WORKING_STATE_AUTH_REQUIRED") {
      activeDraft = null;
      setStatus(confirmedPayload ? "offline-read-only" : "idle", nextCode);
      return publicStatus();
    }

    return Object.freeze({
      hydrate,
      runSharedMutation,
      reloadLatest,
      reapplyPendingDraft,
      deactivate,
      denyMutation,
      status: publicStatus,
      allowsImport: () => false,
      activeDraft: () => activeDraft,
      confirmedPayload: () => confirmedPayload,
      capturePartition(name, value) {
        if (!PARTITIONS.includes(name)) return false;
        if (!activeDraft) return false;
        activeDraft[name] = clone(value);
        return true;
      },
      readPartition(name) {
        const source = activeDraft || confirmedPayload;
        return source && PARTITIONS.includes(name) ? clone(source[name]) : null;
      },
      discardPendingDraft() { pendingDraft = null; return publicStatus(); },
    });
  }

  function createDisabledBrowserRuntime() {
    const status = Object.freeze({
      configured: false,
      phase: "local-only",
      code: "",
      message: "",
      canMutate: true,
      cacheDegraded: false,
      cacheCode: "",
    });
    return Object.freeze({
      status: () => status,
      requiresGateway: () => false,
      isDraftActive: () => false,
      capturePartition: () => null,
      readPartition: () => null,
      deferEffect: () => false,
      runSharedMutation: (mutator) => mutator(),
      installApplication: () => false,
      installMutationHandlers: () => false,
      initialize: async () => status,
      allowsImport: () => true,
      bugReportStorage: () => null,
      bugAttachmentAdapter: () => null,
    });
  }

  function createBrowserRuntime(browserRoot = root) {
    const config = browserRoot?.MaterialsQuoteSupabaseRuntimeConfig?.getCurrentConfiguration?.() || null;
    const authRuntime = browserRoot?.MaterialsQuoteSupabaseRuntime;
    if (!config || !authRuntime?.authProvider) return createDisabledBrowserRuntime();
    let installedApplication = null;
    let effects = [];
    let hydratePromise = null;
    const cache = createLocalStorageCache((() => {
      try { return browserRoot.localStorage; } catch (error) { return null; }
    })());
    const adapter = createRpcAdapter({
      url: config.projectUrl,
      publishableKey: config.publishableKey,
      getAccessToken: authRuntime.authProvider.getAccessToken,
      fetchImpl: typeof browserRoot.fetch === "function" ? browserRoot.fetch.bind(browserRoot) : null,
    });
    const applicationProxy = {
      beginDraft(payload, name) { installedApplication?.beginDraft?.(payload, name); },
      endDraft(previous) { installedApplication?.endDraft?.(previous); },
      commitConfirmed(payload) { return installedApplication?.commitConfirmed?.(payload) !== false; },
      notify(code) { installedApplication?.notify?.(code, MESSAGE_BY_CODE[code] || MESSAGE_BY_CODE.WORKING_STATE_READ_ONLY); },
      flushEffects() { const queued = effects; effects = []; installedApplication?.flushEffects?.(queued); },
      discardEffects() { effects = []; installedApplication?.discardEffects?.(); },
    };
    const coordinator = createCoordinator({
      adapter,
      cache,
      application: applicationProxy,
      config: { organizationId: config.organizationId, organizationSlug: config.organizationSlug },
    });

    function runtimeStatus() {
      return Object.freeze({ ...coordinator.status(), configured: true });
    }

    async function hydrateIfAuthorized() {
      const status = authRuntime.status?.();
      if (!status?.signedIn || !status?.ownerVerified) {
        coordinator.deactivate(status?.signedIn ? "WORKING_STATE_OWNER_REQUIRED" : "WORKING_STATE_AUTH_REQUIRED");
        return runtimeStatus();
      }
      if (coordinator.status().phase === "ready") return runtimeStatus();
      if (hydratePromise) return hydratePromise;
      hydratePromise = coordinator.hydrate().finally(() => { hydratePromise = null; });
      return hydratePromise;
    }

    function canonicalMutationAuthorization() {
      let status = null;
      try { status = authRuntime.status?.() || null; } catch (error) { status = null; }
      if (status?.signedIn && status?.ownerVerified) return Object.freeze({ ok: true, code: "" });
      const denied = status?.signedIn ? "WORKING_STATE_OWNER_REQUIRED" : "WORKING_STATE_AUTH_REQUIRED";
      coordinator.denyMutation(denied);
      return resultError(denied);
    }

    function runAuthorizedCoordinatorMutation(invoke, denialResultCode = "") {
      const authorization = canonicalMutationAuthorization();
      if (!authorization.ok) {
        applicationProxy.notify(authorization.code);
        return Promise.resolve(resultError(denialResultCode || authorization.code));
      }
      return invoke();
    }

    function createBugStorage() {
      return {
        getItem(key) {
          if (key !== "materials_quote_bug_reports") return null;
          const reports = coordinator.readPartition("bug_reports")?.reports;
          return JSON.stringify(Array.isArray(reports) ? reports : []);
        },
        setItem(key, raw) {
          if (key !== "materials_quote_bug_reports" || !coordinator.activeDraft()) throw new Error("WORKING_STATE_READ_ONLY");
          const reports = JSON.parse(String(raw || "[]"));
          const bugReports = coordinator.readPartition("bug_reports") || { schema: "bug-reports-backup/v1", reports: [], attachments: [] };
          bugReports.reports = reports;
          if (!coordinator.capturePartition("bug_reports", bugReports)) throw new Error("WORKING_STATE_READ_ONLY");
        },
      };
    }

    function createBugAttachmentAdapter() {
      return {
        async get(id) {
          const attachment = coordinator.readPartition("bug_reports")?.attachments?.find((item) => item.id === id);
          if (!attachment) return null;
          const bytes = typeof Buffer !== "undefined"
            ? Uint8Array.from(Buffer.from(String(attachment.bytes_base64 || ""), "base64"))
            : Uint8Array.from(browserRoot.atob(String(attachment.bytes_base64 || "")), (char) => char.charCodeAt(0));
          return { id: attachment.id, report_id: attachment.report_id, name: attachment.name, mime_type: attachment.mime_type, size: attachment.size, bytes };
        },
        async put(record) {
          if (!coordinator.activeDraft()) throw new Error("WORKING_STATE_READ_ONLY");
          const bugReports = coordinator.readPartition("bug_reports") || { schema: "bug-reports-backup/v1", reports: [], attachments: [] };
          const bytes = record.bytes instanceof Uint8Array ? record.bytes : new Uint8Array(record.bytes || []);
          const bytesBase64 = typeof Buffer !== "undefined"
            ? Buffer.from(bytes).toString("base64")
            : browserRoot.btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
          bugReports.attachments = bugReports.attachments.filter((item) => item.id !== record.id);
          bugReports.attachments.push({
            id: record.id,
            report_id: record.report_id,
            name: record.name,
            mime_type: record.mime_type,
            size: Number(record.size),
            bytes_base64: bytesBase64,
          });
          coordinator.capturePartition("bug_reports", bugReports);
          return record;
        },
        async remove(id) {
          if (!coordinator.activeDraft()) throw new Error("WORKING_STATE_READ_ONLY");
          const bugReports = coordinator.readPartition("bug_reports");
          if (!bugReports) return false;
          bugReports.attachments = bugReports.attachments.filter((item) => item.id !== id);
          coordinator.capturePartition("bug_reports", bugReports);
          return true;
        },
      };
    }

    const runtime = {
      status: runtimeStatus,
      requiresGateway: () => true,
      isDraftActive: () => Boolean(coordinator.activeDraft()),
      capturePartition: (name, value) => coordinator.capturePartition(name, value),
      readPartition: (name) => coordinator.readPartition(name),
      deferEffect(type, args = []) {
        if (!coordinator.activeDraft()) return false;
        effects.push({ type: String(type || ""), args: clone(args) });
        return true;
      },
      runSharedMutation: (mutator, options) => runAuthorizedCoordinatorMutation(
        () => coordinator.runSharedMutation(mutator, options),
        "WORKING_STATE_READ_ONLY",
      ),
      installApplication(adapterValue) { installedApplication = adapterValue; return true; },
      installMutationHandlers(names) {
        const unique = [...new Set(Array.isArray(names) ? names : [])];
        unique.forEach((name) => {
          const original = browserRoot[name];
          if (typeof original !== "function" || original.__sharedWorkingStateGateway) return;
          const wrapped = function (...args) {
            if (coordinator.activeDraft()) return original.apply(this, args);
            const authorization = canonicalMutationAuthorization();
            if (!authorization.ok) {
              if (name === "login" || name === "logout") return original.apply(this, args);
              const event = args[0];
              if (event && typeof event.preventDefault === "function") event.preventDefault();
              applicationProxy.notify(authorization.code);
              return Promise.resolve(authorization);
            }
            if (!coordinator.status().canMutate) {
              if (name === "login" || name === "logout") return original.apply(this, args);
              const event = args[0];
              if (event && typeof event.preventDefault === "function") event.preventDefault();
              applicationProxy.notify(coordinator.status().code || "WORKING_STATE_READ_ONLY");
              return Promise.resolve(resultError("WORKING_STATE_READ_ONLY"));
            }
            return coordinator.runSharedMutation(() => original.apply(this, args), { name });
          };
          Object.defineProperty(wrapped, "__sharedWorkingStateGateway", { value: true });
          browserRoot[name] = wrapped;
        });
        return true;
      },
      async initialize() {
        browserRoot.addEventListener?.("materials-quote-supabase-auth-change", () => {
          hydrateIfAuthorized().finally(() => installedApplication?.render?.());
        });
        await hydrateIfAuthorized();
        return runtimeStatus();
      },
      hydrate: () => hydrateIfAuthorized(),
      reloadLatest: () => coordinator.reloadLatest(),
      reapplyPendingDraft: () => runAuthorizedCoordinatorMutation(
        () => coordinator.reapplyPendingDraft(),
      ),
      discardPendingDraft: () => coordinator.discardPendingDraft(),
      allowsImport: () => false,
      bugReportStorage: createBugStorage,
      bugAttachmentAdapter: createBugAttachmentAdapter,
    };
    return Object.freeze(runtime);
  }

  const api = Object.freeze({
    CONTRACT,
    CACHE_SCHEMA,
    CACHE_KEY,
    MESSAGE_BY_CODE,
    canonicalStringify,
    sha256Canonical,
    validatePayload,
    validateConfiguration,
    createRpcAdapter,
    createCoordinator,
    createBrowserRuntime,
  });

  if (root?.document && !root.MaterialsQuoteSharedWorkingStateRuntime) {
    root.MaterialsQuoteSharedWorkingStateRuntime = createBrowserRuntime(root);
  }
  return api;
});
