(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteSupabaseAuthCallbackBridge = api;
  if (root && root.location && root.history) {
    const source = api.captureAuthCallback(root);
    if (source) {
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

  const AUTH_CALLBACK_BRIDGE_VERSION = "20260812-magic-link-session-001";
  const CALLBACK_MAX_LENGTH = 16384;
  const QUERY_INDICATOR = /(?:^|[?&])(code|error|error_code|error_description)=/;
  const FRAGMENT_INDICATOR = /(?:^|[#&])(access_token|refresh_token|type|error|error_code|error_description)=/;

  function looksLikeAuthCallback(search, hash) {
    const query = String(search || "");
    const fragment = String(hash || "");
    return QUERY_INDICATOR.test(query) || FRAGMENT_INDICATOR.test(fragment);
  }

  function captureAuthCallback(browserRoot) {
    const location = browserRoot?.location;
    const history = browserRoot?.history;
    if (!location || !history || typeof history.replaceState !== "function") return null;
    const search = String(location.search || "");
    const hash = String(location.hash || "");
    if (!looksLikeAuthCallback(search, hash)) return null;

    const source = {
      origin: String(location.origin || ""),
      pathname: String(location.pathname || ""),
      search: search.length <= CALLBACK_MAX_LENGTH ? search : "",
      hash: hash.length <= CALLBACK_MAX_LENGTH ? hash : "",
      oversized: search.length > CALLBACK_MAX_LENGTH || hash.length > CALLBACK_MAX_LENGTH,
      scrubbed: false,
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
    looksLikeAuthCallback,
    captureAuthCallback,
  });
});
