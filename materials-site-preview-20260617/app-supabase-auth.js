(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuth = api;
  if (root && root.document) api.bootstrapBrowserRuntime(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const FORMAL_PUSH_CONFIRMATION = "啟用唯一正式推送";
  const SESSION_REFRESH_MARGIN_SECONDS = 60;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function errorResult(code) {
    return Object.freeze({ ok: false, code: String(code || "SUPABASE_AUTH_REJECTED") });
  }

  function normalizeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.origin : "";
    } catch (error) {
      return "";
    }
  }

  function normalizeSession(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return null;
    const accessToken = String(source.access_token || "");
    const refreshToken = String(source.refresh_token || "");
    const expiresAt = Number(source.expires_at);
    const user = source.user && typeof source.user === "object" ? source.user : null;
    const userId = String(user?.id || "");
    if (accessToken.length < 32 || refreshToken.length < 20 || !Number.isFinite(expiresAt) || expiresAt <= 0 || !userId) {
      return null;
    }
    return Object.freeze({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(expiresAt),
      expires_in: Number.isFinite(Number(source.expires_in)) ? Number(source.expires_in) : 0,
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
    const listeners = new Set();
    let currentSession = null;
    let refreshing = null;

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

    function readStoredSession() {
      if (!sessionStorage || !sessionKey) return null;
      try {
        return normalizeSession(JSON.parse(sessionStorage.getItem(sessionKey) || "null"));
      } catch (error) {
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
      currentSession = null;
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

    async function refreshSession() {
      if (refreshing) return refreshing;
      const source = currentSession || readStoredSession();
      if (!source?.refresh_token) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult("SUPABASE_AUTH_SESSION_EXPIRED");
      }
      refreshing = (async () => {
        const response = await post("/auth/v1/token?grant_type=refresh_token", {
          refresh_token: source.refresh_token,
        });
        const renewed = response.ok ? normalizeSession(response.value) : null;
        if (!renewed || !writeStoredSession(renewed)) {
          clearStoredSession();
          emit("SIGNED_OUT");
          return errorResult("SUPABASE_AUTH_SESSION_EXPIRED");
        }
        currentSession = renewed;
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
        return errorResult("SUPABASE_AUTH_SIGNED_OUT");
      }
      currentSession = stored;
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
      const signedInSession = response.ok ? normalizeSession(response.value) : null;
      if (!signedInSession) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult(response.code || `SUPABASE_AUTH_HTTP_${response.status || 0}`);
      }
      if (!writeStoredSession(signedInSession)) {
        clearStoredSession();
        emit("SIGNED_OUT");
        return errorResult("SUPABASE_AUTH_SESSION_STORAGE_FAILED");
      }
      currentSession = signedInSession;
      emit("SIGNED_IN");
      return Object.freeze({ ok: true, code: "", session: safeSession(currentSession) });
    }

    async function getAccessToken() {
      if (!currentSession) currentSession = readStoredSession();
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

    async function signOut() {
      if (!currentSession) currentSession = readStoredSession();
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
      signOut,
      restoreSession,
      refreshSession,
      getAccessToken,
      verifyOwnerMembership,
      onAuthStateChange,
      status,
      sessionStorageKey: sessionKey,
    });
  }

  function createUnavailableProvider(code) {
    const unavailable = () => Promise.resolve(errorResult(code));
    return Object.freeze({
      signInWithPassword: unavailable,
      signOut: unavailable,
      restoreSession: unavailable,
      refreshSession: unavailable,
      getAccessToken: async () => "",
      verifyOwnerMembership: unavailable,
      onAuthStateChange: () => Object.freeze({ unsubscribe() {} }),
      status: () => Object.freeze({ configured: false, signedIn: false, user: null, expiresAt: null, sessionStorageKey: "" }),
      sessionStorageKey: "",
    });
  }

  function createRuntimeAuthIntegration({ config, authProvider, configApi, fetchImpl, eventTarget } = {}) {
    const provider = authProvider || createUnavailableProvider("SUPABASE_PUBLIC_CONFIG_REQUIRED");
    const publicConfig = config && typeof config === "object" ? config : null;
    const target = eventTarget || null;
    let ownerVerified = false;
    let authorizationPhase = "idle";
    let lastCode = publicConfig ? "SUPABASE_AUTH_SIGNED_OUT" : "SUPABASE_PUBLIC_CONFIG_REQUIRED";
    let lastPushResult = null;

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
        code: String(lastCode || ""),
        lastPushOk: lastPushResult?.ok === true,
      });
    }

    function publish() {
      const facade = syncConfiguration();
      if (configApi && typeof configApi.publishSyncFacade === "function") configApi.publishSyncFacade(facade);
      const status = publicStatus();
      if (target && typeof target.dispatchEvent === "function" && typeof root?.CustomEvent === "function") {
        try {
          target.dispatchEvent(new root.CustomEvent("materials-quote-supabase-auth-change", { detail: status }));
        } catch (error) {
          // A UI notification failure must not alter authorization.
        }
      }
      return status;
    }

    async function initialize() {
      const restored = await provider.restoreSession();
      ownerVerified = false;
      authorizationPhase = "idle";
      lastCode = restored.ok ? "SUPABASE_AUTH_OWNER_GATE_REQUIRED" : restored.code;
      publish();
      return restored;
    }

    async function signInWithPassword(email, password) {
      authorizationPhase = "idle";
      ownerVerified = false;
      lastPushResult = null;
      const signedIn = await provider.signInWithPassword(email, password);
      if (!signedIn.ok) {
        lastCode = signedIn.code;
        publish();
        return signedIn;
      }
      const gate = await verifyOwnerMembership();
      return gate.ok ? signedIn : gate;
    }

    async function signOut() {
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
        lastCode = "SUPABASE_AUTH_SIGNED_OUT";
      }
      publish();
    });

    publish();

    return Object.freeze({
      initialize,
      signInWithPassword,
      signOut,
      verifyOwnerMembership,
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
    try {
      browserStorage = browserRoot.localStorage;
    } catch (error) {
      browserStorage = null;
    }
    const provider = config
      ? createSupabaseAuthProvider({ config, fetchImpl, storage: browserStorage })
      : createUnavailableProvider(configApi?.status?.().code || "SUPABASE_PUBLIC_CONFIG_REQUIRED");
    const integration = createRuntimeAuthIntegration({
      config,
      authProvider: provider,
      configApi,
      fetchImpl,
      eventTarget: browserRoot,
    });
    browserRoot.MaterialsQuoteSupabaseRuntime = integration;
    browserRoot.MaterialsQuoteSupabaseSyncConfig = integration.getSyncConfiguration();
    integration.initialize();
    if (config && typeof browserRoot.addEventListener === "function") {
      browserRoot.addEventListener("storage", (event) => {
        if (event?.key === provider.sessionStorageKey) integration.initialize();
      });
    }
    return integration;
  }

  return Object.freeze({
    FORMAL_PUSH_CONFIRMATION,
    createSupabaseAuthProvider,
    createRuntimeAuthIntegration,
    bootstrapBrowserRuntime,
  });
});
