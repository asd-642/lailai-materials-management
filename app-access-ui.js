function rawFrontendSessionRole() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    return String(session?.role || "");
  } catch (error) {
    return "";
  }
}

function frontendAccessRole() {
  const rawRole = rawFrontendSessionRole();
  const account = currentUser({ readOnly: true });
  if (!account || !ACCOUNT_ROLES.includes(rawRole) || account.role !== rawRole) return "unknown";
  return rawRole;
}

function isFrontendRoleKnown() {
  return ACCOUNT_ROLES.includes(frontendAccessRole());
}

function sharedWorkingStateAccessStatus() {
  const status = window.MaterialsQuoteSharedWorkingStateRuntime?.status?.();
  return status?.configured === true ? status : null;
}

function isSharedWorkingStateReadOnly() {
  const status = sharedWorkingStateAccessStatus();
  return Boolean(status && status.canMutate !== true);
}

function isFrontendReadOnly() {
  const role = frontendAccessRole();
  return role === "contractor" || role === "unknown" || isSharedWorkingStateReadOnly();
}

function canUseFrontendWrite() {
  return ["owner", "admin", "staff"].includes(frontendAccessRole()) && !isSharedWorkingStateReadOnly();
}

function showFrontendWriteDeniedToastWithoutRender(message) {
  if (typeof document === "undefined" || !document.body || typeof ui === "undefined") {
    if (typeof setToast === "function") setToast(message);
    return;
  }
  ui.toast = message;
  document.querySelector("[data-frontend-write-denied-toast]")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.frontendWriteDeniedToast = "true";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.clearTimeout(showFrontendWriteDeniedToastWithoutRender.timer);
  showFrontendWriteDeniedToastWithoutRender.timer = window.setTimeout(() => {
    if (ui.toast === message) ui.toast = "";
    toast.remove();
  }, 1800);
}

function frontendWriteDenied(options = {}) {
  const unknown = frontendAccessRole() === "unknown";
  const sharedStatus = sharedWorkingStateAccessStatus();
  const sharedDenied = !unknown && frontendAccessRole() !== "contractor" && sharedStatus?.canMutate !== true;
  const result = {
    ok: false,
    code: unknown ? "UNKNOWN_ROLE" : "READ_ONLY_ROLE",
    error: unknown ? "目前登入角色無法辨識，介面已鎖定為唯讀" : "外包人員僅可檢視，不能變更或匯出資料",
  };
  if (sharedDenied) {
    result.code = sharedStatus.code || "WORKING_STATE_READ_ONLY";
    result.error = sharedStatus.message || "共享資料尚未完成遠端驗證，目前只能檢視";
  }
  if (options.withoutRender === true) showFrontendWriteDeniedToastWithoutRender(result.error);
  else if (typeof setToast === "function") setToast(result.error);
  return result;
}

function requireFrontendWrite() {
  return canUseFrontendWrite() ? { ok: true, code: "", error: "" } : frontendWriteDenied();
}

function renderFrontendReadOnlyBanner() {
  if (!isFrontendReadOnly()) return "";
  const unknown = frontendAccessRole() === "unknown";
  const sharedStatus = sharedWorkingStateAccessStatus();
  if (!unknown && frontendAccessRole() !== "contractor" && sharedStatus?.canMutate !== true) {
    return `
      <div class="frontend-readonly-banner is-shared" role="status" data-shared-working-state-banner>
        <span class="frontend-readonly-mark" aria-hidden="true">雲端</span>
        <span><strong>共享資料目前為唯讀</strong><small>${h(sharedStatus.message || "尚未完成遠端版本驗證")}</small></span>
      </div>
    `;
  }
  const bugReportException = !unknown && route().parts[0] === "bug-reports";
  return `
    <div class="frontend-readonly-banner ${unknown ? "is-unknown" : ""}" role="status">
      <span class="frontend-readonly-mark" aria-hidden="true">${bugReportException ? "例外" : "唯讀"}</span>
      <span>
        <strong>${unknown ? "角色無法辨識，已鎖定為唯讀" : bugReportException ? "外包人員其他資料維持唯讀" : "外包人員僅可檢視"}</strong>
        <small>${unknown ? "請登出並由管理人員檢查帳號角色。" : bugReportException ? "此頁仍可建立與查看自己的 Bug 回報；其他資料寫入維持關閉。" : "可搜尋、查看與列印；新增、修改、刪除、審核、匯入、還原及完整備份匯出均不可使用。"}</small>
      </span>
    </div>
  `;
}

function renderReadonlyRouteDenied(title) {
  const unknown = frontendAccessRole() === "unknown";
  return `
    <div class="readonly-route-denied">
      ${pageHead("唯讀模式", title || "此操作需要資料寫入權限")}
      <div class="empty">${unknown ? "目前角色無法辨識，所有寫入操作已關閉。" : "外包人員僅可檢視，請返回清單查看現有資料。"}</div>
    </div>
  `;
}

const FRONTEND_WRITE_ACTION_NAMES = Object.freeze([
  "resetDemo",
  "startAccountDraft",
  "startAccountFromMenu",
  "createAccount",
  "autoSaveAccount",
  "saveAccount",
  "openOwnerBootstrap",
  "confirmOwnerBootstrap",
  "openAccountPermissions",
  "toggleAccountPermission",
  "deleteAccount",
  "saveMaterial",
  "addMaterialSpecification",
  "startMaterialSpecificationEdit",
  "updateMaterialSpecification",
  "deleteMaterialSpecification",
  "applyCustomerCardJson",
  "importCustomerCardsBatch",
  "saveCustomer",
  "addContact",
  "removeContact",
  "saveTemplate",
  "addPayment",
  "removePayment",
  "addTemplateLabor",
  "removeLabor",
  "deleteRecord",
  "setQuotePicker",
  "setCustomQuoteItem",
  "updateQuotePath",
  "updateQuoteListPath",
  "updateSectionField",
  "updateLaborField",
  "updateLaborConfigField",
  "updateExcelLaborDetailField",
  "resetExcelLaborDetail",
  "updateItemField",
  "changeQuoteSpecificationThickness",
  "changeQuoteSpecificationWidth",
  "completeMaterialDrawer",
  "setLaborBalancer",
  "addQuoteSection",
  "removeSection",
  "moveSection",
  "addQuoteItem",
  "removeQuoteItem",
  "addQuoteLabor",
  "removeQuoteLabor",
  "openMaterialDrawer",
  "discardQuoteDraft",
  "saveQuote",
  "submitQuoteForApproval",
  "submitQuoteFromDetail",
  "approveQuote",
  "returnQuoteForRevision",
  "withdrawQuoteSubmission",
  "withdrawPendingQuoteSubmission",
  "setQuoteStatus",
  "createQuoteRevision",
  "exportDataBackup",
  "importDataBackup",
  "saveSettings",
  "savePersonalSettings",
  "openPersonalModal",
  "handleAvatarDrop",
  "handleAvatarFilePick",
  "saveAvatarImage",
  "changePersonalPassword",
  "persistCustomerCardOcrDraftText",
  "clearCustomerCardOcrDraft",
  "applyCustomerCardText",
  "loadCustomerCardSample",
  "recognizeSelectedCustomerCard",
]);

function installFrontendWriteGuards() {
  FRONTEND_WRITE_ACTION_NAMES.forEach((name) => {
    const original = window[name];
    if (typeof original !== "function" || original.__frontendWriteGuarded) return;
    const guarded = function (...args) {
      if (isFrontendReadOnly()) {
        const event = args[0];
        if (event && typeof event.preventDefault === "function") event.preventDefault();
        if (event?.currentTarget?.type === "file") event.currentTarget.value = "";
        return frontendWriteDenied({ withoutRender: name === "importDataBackup" });
      }
      return original.apply(this, args);
    };
    Object.defineProperty(guarded, "__frontendWriteGuarded", { value: true });
    window[name] = guarded;
  });
}

window.FrontendAccess = Object.freeze({
  role: frontendAccessRole,
  isKnown: isFrontendRoleKnown,
  isReadOnly: isFrontendReadOnly,
  canWrite: canUseFrontendWrite,
  assertWritable: requireFrontendWrite,
  sharedStatus: sharedWorkingStateAccessStatus,
});

window.addEventListener("load", () => {
  installFrontendWriteGuards();
  if (typeof render === "function" && isAuthed()) render();
});
