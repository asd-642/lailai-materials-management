(function (root) {
  const ACTIONS = new Set(["login_success", "login_failed", "logout"]);
  function text(value) { return String(value == null ? "" : value).trim(); }
  function canonicalAuthEvent(entry = {}) {
    const action = text(entry.action);
    if (!ACTIONS.has(action)) return { ...entry };
    const account = text(entry.actorAccount || entry.actor?.account);
    const name = text(entry.actorName || entry.actor?.name) || "未登入";
    const label = action === "logout" ? "登出" : "登入";
    const actionLabel = action === "login_success" ? "登入成功" : action === "login_failed" ? "登入失敗" : "登出";
    const summary = action === "login_failed" ? `帳號 ${account || "未提供帳號"} 登入失敗` : `${name} ${label}系統`;
    const normalized = { ...entry, entityType: "auth", entityLabel: label, entityName: account, actionLabel, summary };
    if ((entry.entityType !== "auth" || entry.entityLabel !== label || entry.entityName !== account || entry.actionLabel !== actionLabel || entry.summary !== summary) && !entry.legacy_original) {
      normalized.legacy_original = { action: entry.action, actionLabel: entry.actionLabel, entityType: entry.entityType, entityLabel: entry.entityLabel, entityName: entry.entityName, summary: entry.summary };
      normalized.legacy_normalized = true;
    }
    return normalized;
  }
  const api = Object.freeze({ canonicalAuthEvent });
  root.AuthEventContract = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
