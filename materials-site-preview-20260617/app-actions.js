window.toggleAuthMode = function () {
  ui.authMode = ui.authMode === "login" ? "register" : "login";
  render();
};

window.login = async function (event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const account = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const lockRemaining = loginLockRemaining(account);
  if (lockRemaining > 0) {
    setToast(`登入失敗次數過多，請於 ${Math.ceil(lockRemaining / 60000)} 分鐘後再試`);
    return;
  }
  const candidate = loadAccounts().find((item) => item.account === account && item.is_active);
  if (candidate && (await verifyAccountPassword(candidate, password))) {
    const user = await upgradeLegacyAccountPassword(candidate, password);
    clearLoginFailures(account);
    setAuthSession(user);
    logWorkEvent("login_success", `${user.name} 登入系統`, {
      actor: user,
      entityType: "auth",
      entityName: user.account,
    });
    go("/dashboard");
    return;
  }
  recordLoginFailure(account);
  logWorkEvent("login_failed", `帳號 ${account || "未提供"} 登入失敗`, {
    actor: { name: "未登入", account },
    entityType: "auth",
    entityName: account,
    detail: "帳號或密碼錯誤，或帳號已停用",
    outcome: "failed",
  });
  setToast(loginLockRemaining(account) > 0 ? "登入失敗次數過多，帳號已暫停 5 分鐘" : "帳號或密碼錯誤");
};

window.register = function (event) {
  event.preventDefault();
  setToast("請由管理人員新增帳號");
};

window.logout = function () {
  const user = currentUser();
  if (user) {
    logWorkEvent("logout", `${user.name} 登出系統`, {
      actor: user,
      entityType: "auth",
      entityName: user.account,
    });
  }
  clearAuthSession();
  ui.accountOpen = false;
  ui.accountDraft = null;
  ui.quoteDraft = null;
  go("/login");
};

window.toggleSidebar = function () {
  ui.sidebarCollapsed = !ui.sidebarCollapsed;
  render();
};

window.toggleAccount = function () {
  ui.accountOpen = !ui.accountOpen;
  render();
};

function requirePermission(permissionKey, message = "") {
  if (currentAccountCan(permissionKey)) return true;
  setToast(message || `目前帳號沒有「${accountPermissionLabel(permissionKey)}」權限`);
  return false;
}

function requireDeletePermission(collection) {
  if (canDeleteCollection(collection)) return true;
  setToast("目前帳號沒有刪除這筆資料的權限");
  return false;
}

function activeAccountsWithPermission(accounts, permissionKey) {
  return accounts.filter((account) => account.is_active && hasAccountPermission(account, permissionKey));
}

window.resetDemo = function () {
  if (!requirePermission("manage_accounts", "只有具備帳號管理權限的人員可以重置示範資料")) return;
  const actor = currentUser();
  state = seedData();
  clearAllStoredQuoteDrafts();
  saveState();
  saveAccounts(defaultAccounts());
  const user = currentUser();
  if (user) setAuthSession(accountById(user.id) || user);
  logWorkEvent("reset", "重置示範資料", {
    actor,
    entityType: "settings",
    detail: "已重置報價、客戶、材料與範本示範資料",
  });
  ui.quoteDraft = null;
  setToast("示範資料已重置");
  render();
};

function blankAccountDraft() {
  return { account: "", name: "", password: "", role: "staff", permissions: defaultAccountPermissions("staff"), is_active: true };
}

window.startAccountDraft = function () {
  if (!requirePermission("manage_accounts")) return;
  ui.accountDraft = blankAccountDraft();
  render();
};

window.startAccountFromMenu = function () {
  if (!requirePermission("manage_accounts")) return;
  ui.accountOpen = false;
  ui.accountDraft = blankAccountDraft();
  if (route().path === "/accounts") render();
  else go("/accounts");
};

window.cancelAccountDraft = function () {
  ui.accountDraft = null;
  render();
};

function accountGuardMessage(code) {
  const messages = {
    UNKNOWN_ROLE: "帳號角色無法辨識，已拒絕變更",
    OWNER_BOOTSTRAP_REQUIRED: "首位老闆只能使用一次性建立流程設定",
    OWNER_PROTECTED: "老闆帳號只能由老闆管理",
    LAST_OWNER_PROTECTED: "最後一位啟用中的老闆不可停用、刪除或降權",
    ACCOUNT_MANAGEMENT_DENIED: "目前帳號沒有管理帳號的權限",
  };
  return messages[code] || "帳號角色或狀態變更被拒絕";
}

window.openOwnerBootstrap = function () {
  const accounts = loadAccounts();
  if (currentUser()?.role !== "admin" || activeOwnerCount(accounts) > 0) {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_UNAVAILABLE", error: "首位老闆建立流程目前不可使用" };
    setToast(result.error);
    return result;
  }
  ui.ownerBootstrapOpen = true;
  render();
  return { ok: true, code: "", error: "" };
};

window.closeOwnerBootstrap = function () {
  ui.ownerBootstrapOpen = false;
  render();
  return { ok: true, code: "", error: "" };
};

window.confirmOwnerBootstrap = function () {
  const actor = currentUser();
  const accounts = loadAccounts();
  const targetId = String(document.getElementById("owner-bootstrap-account")?.value || "");
  if (actor?.role !== "admin" || activeOwnerCount(accounts) > 0) {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_UNAVAILABLE", error: "首位老闆已建立，或目前帳號不是管理人員" };
    setToast(result.error);
    return result;
  }
  const target = accounts.find((account) => account.id === targetId && account.role !== "owner" && account.is_active !== false);
  if (!target) {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_TARGET_REQUIRED", error: "請先選擇一個啟用中的既有帳號" };
    setToast(result.error);
    return result;
  }
  const promoted = normalizeAccountRecord({
    ...target,
    role: "owner",
    permissions: defaultAccountPermissions("owner"),
  });
  const nextAccounts = accounts.map((account) => (account.id === target.id ? promoted : account));
  const guard = validateAccountMutation({
    actor,
    previousAccounts: accounts,
    nextAccounts,
    targetId: target.id,
    bootstrapConfirmed: true,
  });
  if (!guard.ok) {
    const result = { ok: false, code: guard.code, error: accountGuardMessage(guard.code) };
    setToast(result.error);
    return result;
  }
  if (!saveAccounts(nextAccounts, {
    actor,
    previousAccounts: accounts,
    targetId: target.id,
    bootstrapConfirmed: true,
  })) {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_SAVE_FAILED", error: "首位老闆建立失敗，帳號資料未變更" };
    setToast(result.error);
    return result;
  }
  logRecordChange("accounts", "update", promoted, `一次性建立首位老闆：${promoted.name}`);
  if (actor.id === promoted.id) setAuthSession(promoted);
  ui.ownerBootstrapOpen = false;
  setToast("首位老闆已建立");
  return { ok: true, code: "", error: "", account: promoted };
};

function accountPayloadFromForm(form) {
  const data = new FormData(form);
  return normalizeAccountRecord({
    id: data.get("id") || id("u"),
    account: data.get("account"),
    name: data.get("name"),
    password: data.get("password"),
    role: data.get("role"),
    is_active: data.has("is_active"),
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("頭像圖片讀取失敗"));
    reader.readAsDataURL(file);
  });
}

function validateAccountPayload(payload, accounts, currentId = null) {
  if (!payload.name || !payload.account || (!currentId && !payload.password_hash && !payload.password)) {
    setToast("名稱、帳號、密碼都要填寫");
    return false;
  }
  if (!MaterialsQuoteDomain.isNumericCredential(payload.account) || (payload.password && !MaterialsQuoteDomain.isNumericCredential(payload.password))) {
    setToast("帳號和密碼需為 3 至 20 位數字");
    return false;
  }
  if (accounts.some((account) => account.id !== currentId && account.account === payload.account)) {
    setToast("這個帳號已經存在");
    return false;
  }
  const nextAccounts = currentId
    ? accounts.map((account) => (account.id === currentId ? payload : account))
    : [...accounts, payload];
  if (!nextAccounts.some((account) => ["owner", "admin"].includes(account.role) && account.is_active)) {
    setToast("至少要保留一個啟用的管理人員");
    return false;
  }
  if (!activeAccountsWithPermission(nextAccounts, "manage_accounts").length) {
    setToast("至少要保留一個可以管理帳號的人員");
    return false;
  }
  return true;
}

window.createAccount = async function (event) {
  event.preventDefault();
  if (!requirePermission("manage_accounts")) return;
  const accounts = loadAccounts();
  const actor = currentUser();
  const raw = accountPayloadFromForm(event.currentTarget);
  if (!MaterialsQuoteDomain.isNumericCredential(raw.password)) {
    setToast("密碼需為 3 至 20 位數字");
    return;
  }
  const payload = normalizeAccountRecord({ ...raw, password: "", password_hash: await hashNumericPin(raw.password) });
  if (payload.role === "owner" && activeOwnerCount(accounts) === 0) {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_REQUIRED", error: "首位老闆必須從既有帳號執行一次性 bootstrap" };
    setToast(result.error);
    return result;
  }
  if (!validateAccountPayload(payload, accounts)) return;
  const nextAccounts = [...accounts, payload];
  const guard = validateAccountMutation({ actor, previousAccounts: accounts, nextAccounts, targetId: payload.id });
  if (!guard.ok) {
    const result = { ok: false, code: guard.code, error: accountGuardMessage(guard.code) };
    setToast(result.error);
    return result;
  }
  if (payload.role === "owner" && actor?.role === "owner" && !confirm(`確定要建立老闆帳號「${payload.name}」？`)) {
    return { ok: false, code: "ACCOUNT_CHANGE_CANCELLED", error: "已取消帳號建立" };
  }
  if (!saveAccounts(nextAccounts, { actor, previousAccounts: accounts, targetId: payload.id })) {
    const result = { ok: false, code: "ACCOUNT_SAVE_REJECTED", error: "帳號權限變更被拒絕" };
    setToast(result.error);
    return result;
  }
  logRecordChange("accounts", "create", payload, `帳號：${payload.account}，角色：${accountRoleLabel(payload.role)}`);
  ui.accountDraft = null;
  setToast("帳號已建立");
  render();
  return { ok: true, code: "", error: "", account: payload };
};

async function saveAccountFromForm(form, accountId, options = {}) {
  if (!requirePermission("manage_accounts")) return;
  const accounts = loadAccounts();
  const existing = accounts.find((account) => account.id === accountId);
  if (!existing) return;
  const actor = currentUser();
  if (existing.role === "owner" && actor?.role !== "owner") {
    const result = { ok: false, code: "OWNER_PROTECTED", error: accountGuardMessage("OWNER_PROTECTED") };
    setToast(result.error);
    return result;
  }
  const formPayload = accountPayloadFromForm(form);
  if (form.elements?.role?.disabled) formPayload.role = existing.role;
  if (form.elements?.is_active?.disabled) formPayload.is_active = existing.is_active;
  const resetPin = String(formPayload.password || "");
  if (resetPin && !MaterialsQuoteDomain.isNumericCredential(resetPin)) {
    setToast("新密碼需為 3 至 20 位數字");
    return;
  }
  const roleChanged = normalizeAccountRole(formPayload.role) !== normalizeAccountRole(existing.role);
  const payload = normalizeAccountRecord({
    ...existing,
    ...formPayload,
    id: accountId,
    avatar: existing.avatar,
    avatarImage: existing.avatarImage,
    password: resetPin ? "" : existing.password,
    password_hash: resetPin ? await hashNumericPin(resetPin) : existing.password_hash,
    permissions: roleChanged ? defaultAccountPermissions(formPayload.role) : normalizeAccountPermissions(existing.permissions, formPayload.role),
  });
  if (payload.role === "owner" && existing.role !== "owner" && actor?.role !== "owner") {
    const result = { ok: false, code: "OWNER_BOOTSTRAP_REQUIRED", error: accountGuardMessage("OWNER_BOOTSTRAP_REQUIRED") };
    setToast(result.error);
    return result;
  }
  if (!validateAccountPayload(payload, accounts, accountId)) return;
  const importantChange = roleChanged || existing.is_active !== payload.is_active || Boolean(resetPin);
  if (actor?.role === "owner" && importantChange && options.confirmed !== true) {
    const description = roleChanged
      ? `將 ${existing.name} 的角色由「${accountRoleLabel(existing.role)}」改為「${accountRoleLabel(payload.role)}」`
      : existing.is_active !== payload.is_active
        ? `${payload.is_active ? "啟用" : "停用"}帳號 ${existing.name}`
        : `重設 ${existing.name} 的密碼`;
    if (!confirm(`確定要${description}？`)) return { ok: false, code: "ACCOUNT_CHANGE_CANCELLED", error: "已取消帳號變更" };
  }
  const bootstrapConfirmed = false;
  const guard = validateAccountMutation({
    actor,
    previousAccounts: accounts,
    nextAccounts: accounts.map((account) => (account.id === accountId ? payload : account)),
    targetId: accountId,
    bootstrapConfirmed,
  });
  if (!guard.ok) {
    const result = { ok: false, code: guard.code, error: accountGuardMessage(guard.code) };
    setToast(result.error);
    return result;
  }
  const changed = changedFieldLabels(existing, payload, [
    ["name", "名稱"],
    ["account", "帳號"],
    ["role", "角色"],
    ["is_active", "啟用狀態"],
  ]);
  if (resetPin) changed.push("密碼");
  if (!saveAccounts(accounts.map((account) => (account.id === accountId ? payload : account)), {
    actor, previousAccounts: accounts, targetId: accountId, bootstrapConfirmed,
  })) {
    const result = { ok: false, code: "ACCOUNT_SAVE_REJECTED", error: "帳號資料未通過權限檢查，未進行變更" };
    setToast(result.error);
    return result;
  }
  logRecordChange("accounts", "update", payload, changed.length ? `變更欄位：${changed.join("、")}` : "儲存帳號資料");
  const user = currentUser();
  if (user?.id === accountId) setAuthSession(payload);
  if (options.toast !== false) setToast("帳號已更新");
  else render();
  return { ok: true, code: "", error: "", account: payload };
}

window.autoSaveAccount = function (form, accountId) {
  saveAccountFromForm(form, accountId, { toast: false });
};

window.saveAccount = async function (event, accountId) {
  event.preventDefault();
  await saveAccountFromForm(event.currentTarget, accountId);
};

window.openAccountPermissions = function (accountId) {
  if (!requirePermission("manage_accounts")) return;
  const account = accountById(accountId);
  if (!account) return;
  if (account.role === "owner" && currentUser()?.role !== "owner") {
    setToast(accountGuardMessage("OWNER_PROTECTED"));
    return { ok: false, code: "OWNER_PROTECTED", error: accountGuardMessage("OWNER_PROTECTED") };
  }
  ui.permissionAccountId = accountId;
  render();
  return { ok: true, code: "", error: "" };
};

window.closeAccountPermissions = function () {
  ui.permissionAccountId = null;
  render();
};

window.toggleAccountPermission = function (accountId, permissionKey) {
  if (!requirePermission("manage_accounts")) return;
  const accounts = loadAccounts();
  const account = accounts.find((item) => item.id === accountId);
  if (!account) return;
  if (account.role === "owner" && currentUser()?.role !== "owner") {
    setToast("老闆權限只能由老闆調整");
    return;
  }
  const permissions = normalizeAccountPermissions(account.permissions, account.role);
  const next = {
    ...account,
    permissions: {
      ...permissions,
      [permissionKey]: !permissions[permissionKey],
    },
  };
  if (account.role === "contractor") next.permissions = defaultAccountPermissions("contractor");
  if (permissionKey === "manage_accounts") {
    const nextAccounts = accounts.map((item) => (item.id === accountId ? next : item));
    if (!activeAccountsWithPermission(nextAccounts, "manage_accounts").length) {
      setToast("至少要保留一個可以管理帳號的人員");
      return;
    }
  }
  const nextAccounts = accounts.map((item) => (item.id === accountId ? next : item));
  if (!saveAccounts(nextAccounts, { actor: currentUser(), previousAccounts: accounts, targetId: accountId })) {
    setToast("帳號權限變更被拒絕");
    return;
  }
  logWorkEvent("permission", `調整帳號權限：${workLogRecordTitle("accounts", next)}`, {
    entityType: "accounts",
    entityId: next.id,
    entityName: workLogRecordTitle("accounts", next),
    detail: `${accountPermissionLabel(permissionKey)}：${next.permissions[permissionKey] ? "開啟" : "關閉"}`,
  });
  const user = currentUser();
  if (user?.id === accountId) setAuthSession(next);
  render();
};

window.deleteAccount = function (accountId) {
  if (!requirePermission("manage_accounts")) return { ok: false, code: "ACCOUNT_MANAGEMENT_DENIED", error: accountGuardMessage("ACCOUNT_MANAGEMENT_DENIED") };
  const actor = currentUser();
  const accounts = loadAccounts();
  const target = accounts.find((account) => account.id === accountId);
  if (!target) return { ok: false, code: "ACCOUNT_NOT_FOUND", error: "找不到帳號" };
  if (target.role === "owner" && actor?.role !== "owner") {
    const result = { ok: false, code: "OWNER_PROTECTED", error: accountGuardMessage("OWNER_PROTECTED") };
    setToast(result.error);
    return result;
  }
  if (target.role === "owner" && target.is_active && activeOwnerCount(accounts) === 1) {
    const result = { ok: false, code: "LAST_OWNER_PROTECTED", error: accountGuardMessage("LAST_OWNER_PROTECTED") };
    setToast(result.error);
    return result;
  }
  if (!confirm(`確定刪除帳號「${target.name}」？`)) return { ok: false, code: "ACCOUNT_DELETE_CANCELLED", error: "已取消刪除" };
  const nextAccounts = accounts.filter((account) => account.id !== accountId);
  const guard = validateAccountMutation({ actor, previousAccounts: accounts, nextAccounts, targetId: accountId });
  if (!guard.ok) {
    const result = { ok: false, code: guard.code, error: accountGuardMessage(guard.code) };
    setToast(result.error);
    return result;
  }
  if (!saveAccounts(nextAccounts, { actor, previousAccounts: accounts, targetId: accountId })) {
    const result = { ok: false, code: "ACCOUNT_DELETE_REJECTED", error: "帳號刪除被拒絕，資料未變更" };
    setToast(result.error);
    return result;
  }
  logRecordChange("accounts", "delete", target, `刪除帳號：${target.name}`);
  if (actor?.id === target.id) {
    clearAuthSession();
    go("/login");
  } else {
    setToast("帳號已刪除");
  }
  return { ok: true, code: "", error: "" };
};

window.searchList = function (event, path) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const params = new URLSearchParams();
  if (form.get("q")) params.set("q", form.get("q"));
  if (form.get("inactive")) params.set("inactive", "1");
  if (form.get("customer_filter")) params.set("customer_filter", form.get("customer_filter"));
  go(`${path}${params.toString() ? `?${params}` : ""}`);
};

window.searchMaterials = function (event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const params = new URLSearchParams();
  const q = String(form.get("q") || "").trim();
  const priceBases = Array.from(new Set(form.getAll("price_basis").filter((value) => ["unit_price", "labor_unit_price"].includes(value))));
  const sort = String(form.get("sort") || "");
  let minPrice = String(form.get("min_price") || "").trim();
  let maxPrice = String(form.get("max_price") || "").trim();

  if (minPrice && maxPrice && n(minPrice) > n(maxPrice)) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  if (q) params.set("q", q);
  form.getAll("category").forEach((category) => {
    const value = String(category || "").trim();
    if (value) params.append("category", value);
  });
  if (form.get("inactive")) params.set("inactive", "1");
  priceBases.forEach((priceBasis) => params.append("price_basis", priceBasis));
  if (minPrice) params.set("min_price", minPrice);
  if (maxPrice) params.set("max_price", maxPrice);
  if (["asc", "desc"].includes(sort)) params.set("sort", sort);
  go(`/materials${params.toString() ? `?${params}` : ""}`);
};

function materialCategoryUiMessage(result) {
  const messages = {
    MATERIAL_CATEGORY_INVALID_STATE: "材料分類資料目前無法使用，請重新整理後再試。",
    MATERIAL_CATEGORY_INVALID_DATA: "材料分類資料格式有誤，資料未變更。",
    MATERIAL_CATEGORY_INVALID_NAME: "請輸入分類名稱。",
    MATERIAL_CATEGORY_DUPLICATE: "這個材料分類已經存在。",
    MATERIAL_CATEGORY_NOT_FOUND: "找不到指定的材料分類。",
    MATERIAL_CATEGORY_PERMISSION_DENIED: "目前帳號沒有新增材料分類的權限。",
    MATERIAL_CATEGORY_PERSISTENCE_FAILED: "材料分類儲存失敗，資料未變更。",
  };
  return messages[result?.code] || "材料分類無法新增，資料未變更。";
}

window.openMaterialCategoryDialog = function (event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (!canEditMaterialPrices()) {
    const result = { ok: false, code: "MATERIAL_CATEGORY_PERMISSION_DENIED" };
    setToast(materialCategoryUiMessage(result));
    return result;
  }
  ui.materialCategoryDialogOpen = true;
  ui.materialCategoryDraft = "";
  ui.materialCategoryFeedback = null;
  render();
  window.setTimeout(() => document.querySelector('[data-material-category-dialog] [name="category_name"]')?.focus(), 0);
  return { ok: true, code: "OK" };
};

window.closeMaterialCategoryDialog = function (event) {
  event?.preventDefault?.();
  ui.materialCategoryDialogOpen = false;
  ui.materialCategoryDraft = "";
  ui.materialCategoryFeedback = null;
  render();
  return { ok: true, code: "OK" };
};

window.setMaterialCategoryDraft = function (event) {
  ui.materialCategoryDraft = String(event?.currentTarget?.value || "");
};

window.submitMaterialCategory = function (event) {
  event.preventDefault();
  const name = String(new FormData(event.currentTarget).get("category_name") || "");
  ui.materialCategoryDraft = name;
  const result = window.MaterialCategories?.createCategory?.(name) || {
    ok: false,
    code: "MATERIAL_CATEGORY_INVALID_STATE",
  };
  if (!result.ok) {
    ui.materialCategoryFeedback = { code: result.code, message: materialCategoryUiMessage(result) };
    render();
    return result;
  }
  const refreshed = window.MaterialCategories.listCategories();
  if (!refreshed.ok) {
    ui.materialCategoryFeedback = { code: refreshed.code, message: "分類已新增，但清單暫時無法更新，請重新整理。" };
    render();
    return refreshed;
  }
  ui.materialCategoryDialogOpen = false;
  ui.materialCategoryDraft = "";
  ui.materialCategoryFeedback = null;
  setToast(`分類「${result.value.name}」已新增`);
  return result;
};

window.searchQuotes = function (event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const params = new URLSearchParams();
  if (form.get("q")) params.set("q", form.get("q"));
  if (form.get("status")) params.set("status", form.get("status"));
  go(`/quotes${params.toString() ? `?${params}` : ""}`);
};

window.saveMaterial = function (event, materialId) {
  event.preventDefault();
  if (!requirePermission("edit_material_prices")) return;
  const existing = materialId ? materialById(materialId) : null;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const categoryResult = window.MaterialCategories?.selectCategory?.(data.category) || {
    ok: false,
    code: "MATERIAL_CATEGORY_INVALID_STATE",
  };
  if (!categoryResult.ok) {
    setToast(materialCategoryUiMessage(categoryResult));
    return categoryResult;
  }
  const payload = MaterialsQuoteDomain.migrateMaterialSpecifications({
    ...(existing || {}),
    id: materialId || id("m"),
    name: data.name,
    code: data.code,
    category: categoryResult.value.name,
    unit: data.unit,
    pricing_type: data.pricing_type,
    default_thickness: Object.prototype.hasOwnProperty.call(data, "default_thickness") ? data.default_thickness : existing?.default_thickness ?? "",
    default_width: Object.prototype.hasOwnProperty.call(data, "default_width") ? data.default_width : existing?.default_width ?? "",
    default_length: Object.prototype.hasOwnProperty.call(data, "default_length") ? data.default_length : existing?.default_length ?? "",
    default_weight: Object.prototype.hasOwnProperty.call(data, "default_weight") ? data.default_weight : existing?.default_weight ?? "",
    wall_thickness_mm: Object.prototype.hasOwnProperty.call(data, "wall_thickness_mm") ? data.wall_thickness_mm : existing?.wall_thickness_mm ?? "",
    density_factor: data.density_factor || 0.02466,
    formula_version: data.formula_version || existing?.formula_version || "legacy-v1",
    formula_source: data.formula_source || existing?.formula_source || "網站既有公式",
    dimension_unit: Object.prototype.hasOwnProperty.call(data, "dimension_unit")
      ? (["mm", "cm", "m"].includes(data.dimension_unit) ? data.dimension_unit : "cm")
      : existing?.dimension_unit ?? "cm",
    standard_budget_unit_price: data.standard_budget_unit_price === "" ? "" : data.standard_budget_unit_price,
    standard_budget_source: data.standard_budget_source || existing?.standard_budget_source || "",
    standard_budget_version: data.standard_budget_version || existing?.standard_budget_version || "",
    cost_price: data.cost_price === "" ? "" : data.cost_price,
    cost_price_status: data.cost_price !== "" && data.cost_verified ? "verified" : "unverified",
    price_effective_date: data.price_effective_date || "",
    default_actual_unit_price: data.unit_price,
    unit_price: data.unit_price,
    actual_price_source: existing?.actual_price_source || "材料主檔",
    actual_price_version: data.price_effective_date || existing?.actual_price_version || "",
    waste_pct: data.waste_pct,
    labor_unit_price: data.labor_unit_price,
    labor_waste_pct: data.labor_waste_pct,
    labor_pricing_type: data.labor_pricing_type,
    notes: data.notes,
    is_active: Boolean(data.is_active),
  });
  const materialValidation = MaterialsQuoteDomain.validateMaterialForPersistence(payload);
  if (!materialValidation.ok) {
    setToast(materialValidation.errors[0]);
    return;
  }
  [
    "default_thickness", "default_width", "default_length", "default_weight", "wall_thickness_mm", "density_factor",
    "standard_budget_unit_price", "default_actual_unit_price", "unit_price", "cost_price", "waste_pct", "labor_unit_price", "labor_waste_pct",
  ].forEach((field) => {
    if (payload[field] !== "" && payload[field] != null) payload[field] = Number(payload[field]);
  });
  if (existing?.catalog_group) {
    Object.assign(payload, {
      catalog_group: existing.catalog_group,
      catalog_model: existing.catalog_model,
      catalog_spec: existing.catalog_spec,
      catalog_application: existing.catalog_application,
      catalog_marks: existing.catalog_marks,
      source_import: existing.source_import,
      source_row: existing.source_row,
      source_price_row: existing.source_price_row,
      source_catalog_row: existing.source_catalog_row,
    });
  }
  upsert("materials", payload);
  const changed = changedFieldLabels(existing, payload, [
    ["name", "名稱"],
    ["code", "編號"],
    ["category", "分類"],
    ["unit", "單位"],
    ["pricing_type", "計價方式"],
    ["formula_version", "公式版本"],
    ["standard_budget_unit_price", "標準／預算價"],
    ["cost_price", "已確認成本價"],
    ["unit_price", "案件單價預設值"],
    ["price_effective_date", "價格生效日"],
    ["labor_unit_price", "工資單價"],
    ["is_active", "啟用狀態"],
  ]);
  logRecordChange("materials", existing ? "update" : "create", payload, existing && changed.length ? `變更欄位：${changed.join("、")}` : `編號：${payload.code || "未填"}`);
  go("/materials");
  setToast(materialId ? "材料已更新" : "材料已建立");
};

function materialSpecificationPanel(materialId) {
  return document.querySelector(`[data-material-specifications="${CSS.escape(String(materialId || ""))}"]`);
}

function materialSpecificationValues(scope, attribute) {
  const read = (field) => scope?.querySelector(`[${attribute}="${field}"]`)?.value ?? "";
  return { thickness: read("thickness"), width: read("width"), weight: read("weight") };
}

function refreshMaterialSpecificationPanel(materialId, feedback = null) {
  ui.materialSpecificationFeedback = feedback ? { ...feedback, materialId } : null;
  const panel = materialSpecificationPanel(materialId);
  const material = materialById(materialId);
  if (panel && material) panel.outerHTML = renderMaterialSpecificationSection(material);
}

function materialSpecificationUiResult(materialId, result, successMessage) {
  if (result?.ok) {
    ui.materialSpecificationEditId = null;
    refreshMaterialSpecificationPanel(materialId, { ok: true, code: result.code || "OK", message: successMessage, error: successMessage });
  } else {
    refreshMaterialSpecificationPanel(materialId, { ok: false, code: result?.code || "MATERIAL_SPEC_INVALID_STATE", error: result?.error || "材料規格未儲存" });
  }
  return result;
}

window.addMaterialSpecification = function (materialId) {
  const panel = materialSpecificationPanel(materialId);
  const values = materialSpecificationValues(panel, "data-spec-add-field");
  const result = window.MaterialSpecifications.addSpecification(materialId, values);
  return materialSpecificationUiResult(materialId, result, "規格已新增");
};

window.startMaterialSpecificationEdit = function (materialId, specificationId) {
  ui.materialSpecificationEditId = specificationId;
  refreshMaterialSpecificationPanel(materialId);
  return { ok: true, code: "OK" };
};

window.cancelMaterialSpecificationEdit = function (materialId) {
  ui.materialSpecificationEditId = null;
  refreshMaterialSpecificationPanel(materialId);
  return { ok: true, code: "OK" };
};

window.updateMaterialSpecification = function (materialId, specificationId) {
  const panel = materialSpecificationPanel(materialId);
  const row = panel?.querySelector(`[data-material-spec-edit-row][data-specification-id="${CSS.escape(String(specificationId || ""))}"]`);
  const values = materialSpecificationValues(row, "data-spec-edit-field");
  const result = window.MaterialSpecifications.updateSpecification(materialId, specificationId, values);
  return materialSpecificationUiResult(materialId, result, "規格已更新");
};

window.deleteMaterialSpecification = function (materialId, specificationId) {
  if (!confirm("確定刪除這組厚度、寬度與重量規格？")) return { ok: false, code: "MATERIAL_SPEC_DELETE_CANCELLED", error: "已取消刪除" };
  const result = window.MaterialSpecifications.deleteSpecification(materialId, specificationId);
  return materialSpecificationUiResult(materialId, result, "規格已刪除");
};

function setCustomerFormValue(form, name, value) {
  const field = form.elements[name];
  if (field && value !== undefined && value !== null) field.value = value;
}

function fillCustomerFormFromCard(customer) {
  const form = document.querySelector("form[onsubmit^=\"saveCustomer\"]");
  if (!form || !customer) return false;
  const contact = customer.contacts?.[0] || {};
  setCustomerFormValue(form, "name", customer.name);
  setCustomerFormValue(form, "phone", customer.phone);
  setCustomerFormValue(form, "address", customer.address);
  setCustomerFormValue(form, "company_name", customer.company_name);
  setCustomerFormValue(form, "tax_id", customer.tax_id);
  setCustomerFormValue(form, "invoice_title", customer.invoice_title);
  setCustomerFormValue(form, "contact_name_0", contact.name);
  setCustomerFormValue(form, "contact_role_0", contact.role);
  setCustomerFormValue(form, "contact_phone_0", contact.phone);
  setCustomerFormValue(form, "contact_email_0", contact.email);
  setCustomerFormValue(form, "contact_notes_0", contact.notes);
  setCustomerFormValue(form, "notes", customer.notes);
  const primary = form.elements.contact_primary;
  if (primary) primary.checked = true;
  const active = form.elements.is_active;
  if (active) active.checked = customer.is_active !== false;
  return true;
}

window.applyCustomerCardJson = function () {
  if (!requirePermission("use_customer_ocr", "目前帳號沒有使用 OCR 匯入客戶的權限")) return;
  const input = document.getElementById("customer-card-json");
  const status = document.getElementById("customer-card-import-status");
  const parsed = decodeCustomerCardPayload(input?.value || "");
  const customer = normalizeCustomerCard(parsed);
  if (!customer) {
    if (status) status.textContent = "JSON 格式錯誤，請重新複製名片資料。";
    return;
  }
  const applied = fillCustomerFormFromCard(customer);
  if (status) status.textContent = applied ? "已套用到表單，請確認後再儲存。" : "找不到新增客戶表單。";
};

function businessCardImageFromForm(formElement, existing) {
  const data = formElement?.dataset || {};
  const dataUrl = data.businessCardImageDataUrl || "";
  if (!dataUrl) return existing?.business_card_image || null;
  return {
    name: data.businessCardImageName || "business-card",
    type: data.businessCardImageType || "image/*",
    size: Number(data.businessCardImageSize || 0),
    data_url: dataUrl,
    saved_at: new Date().toISOString(),
  };
}

function businessCardImagesFromForm(formElement, existing, primaryImage) {
  const images = [];
  const pushImage = (image) => {
    const src = image?.data_url || image?.dataUrl || image?.src || image?.url || "";
    if (!src || images.some((item) => (item.data_url || item.dataUrl || item.src || item.url || "") === src)) return;
    images.push(image);
  };
  (existing?.business_card_images || []).forEach(pushImage);
  pushImage(existing?.business_card_image);
  pushImage(primaryImage);
  return images;
}

function fileNameWithoutExt(file) {
  return String(file?.name || "business-card").replace(/\.[^.]+$/, "").trim() || "business-card";
}

function businessCardImageFromBatchResult(result, file) {
  const image = result?.image || {};
  const dataUrl = image.data_url || image.dataUrl || image.src || image.url || "";
  if (!dataUrl) return null;
  return {
    name: image.name || file?.name || "business-card",
    type: image.type || file?.type || "image/jpeg",
    size: Number(image.size || dataUrl.length || file?.size || 0),
    data_url: dataUrl,
    saved_at: new Date().toISOString(),
  };
}

function customerFromBatchCardResult(result, file) {
  const reliable = Boolean(result?.reliable);
  const normalized = reliable ? normalizeCustomerCard({ ...(result.parsed || {}) }) : null;
  const image = businessCardImageFromBatchResult(result, file);
  const contact = normalized?.contacts?.[0] || {};
  const fallbackName = `未辨識名片 - ${fileNameWithoutExt(file)}`;
  const payload = {
    id: id("c"),
    name: normalized?.name || normalized?.company_name || contact.name || fallbackName,
    phone: normalized?.phone || "",
    address: normalized?.address || "",
    company_name: normalized?.company_name || "",
    tax_id: normalized?.tax_id || "",
    invoice_title: normalized?.invoice_title || normalized?.company_name || "",
    contacts: normalized?.contacts?.length ? normalized.contacts : [{ name: "", role: "", phone: "", email: "", notes: "", primary: true }],
    notes: normalized?.notes || "",
    is_active: true,
    business_card_image: image,
    business_card_images: image ? [image] : [],
    review_status: "unreviewed",
    review_source: "batch_ocr",
    review_note: reliable ? "" : "OCR 結果未達自動填入標準，請人工確認。",
    ocr_raw_text: result?.rawText || "",
    created_at: new Date().toISOString(),
  };
  return payload;
}

window.importCustomerCardsBatch = async function () {
  if (!requirePermission("use_customer_ocr", "目前帳號沒有使用 OCR 匯入客戶的權限")) return;
  const input = document.getElementById("customer-batch-card-files");
  const status = document.getElementById("customer-batch-card-import-status");
  const button = document.getElementById("customer-batch-card-import-btn");
  const files = Array.from(input?.files || []);
  if (!files.length) {
    if (status) status.textContent = "請先選擇一張以上名片照片。";
    return;
  }
  if (typeof window.recognizeCustomerCardFileForBatch !== "function") {
    if (status) status.textContent = "OCR 尚未載入完成，請稍後再試。";
    return;
  }
  if (button) button.disabled = true;
  const imported = [];
  const failed = [];
  const pendingCustomers = [];
  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (status) status.textContent = `正在匯入 ${index + 1} / ${files.length}：${file.name}`;
      try {
        const result = await window.recognizeCustomerCardFileForBatch(file);
        const payload = customerFromBatchCardResult(result, file);
        const duplicates = findCustomerDuplicates(payload, "", pendingCustomers);
        payload.duplicate_candidate_ids = duplicates.map((customer) => customer.id);
        payload.data_quality_issues = customerDataQualityIssues(payload);
        if (duplicates.length) payload.review_note = `${payload.review_note ? `${payload.review_note} ` : ""}可能與 ${duplicates[0].company_name || duplicates[0].name} 重複。`;
        pendingCustomers.push(payload);
        imported.push(payload);
      } catch (error) {
        failed.push(file.name);
        const payload = customerFromBatchCardResult({ reliable: false, rawText: "", image: null }, file);
        payload.data_quality_issues = customerDataQualityIssues(payload);
        pendingCustomers.push(payload);
        imported.push(payload);
      }
    }
    state.customers.unshift(...pendingCustomers);
    saveState();
    logWorkEvent("customer_batch_import", `批量匯入名片：${imported.length} 筆`, {
      actor: currentUser(),
      entityType: "customers",
      detail: failed.length ? `有 ${failed.length} 張需人工補資料：${failed.join("、")}` : "全部已建立為未審核客戶",
    });
    go("/customers");
    setToast(`已批量建立 ${imported.length} 筆未審核客戶`);
  } finally {
    if (button) button.disabled = false;
    if (status) status.textContent = imported.length ? `已建立 ${imported.length} 筆未審核客戶。` : "";
  }
};

window.saveCustomer = function (event, customerId) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const existing = customerId ? customerById(customerId) : { contacts: [{ primary: true }] };
  const existingContacts = Array.isArray(existing.contacts) && existing.contacts.length ? existing.contacts : [{ primary: true }];
  const contacts = existingContacts.map((_, index) => ({
    name: form.get(`contact_name_${index}`) || "",
    role: form.get(`contact_role_${index}`) || "",
    phone: form.get(`contact_phone_${index}`) || "",
    email: form.get(`contact_email_${index}`) || "",
    notes: form.get(`contact_notes_${index}`) || "",
    primary: String(index) === String(form.get("contact_primary")),
  }));
  const businessCardImage = businessCardImageFromForm(formElement, existing);
  const payload = {
    id: customerId || id("c"),
    name: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    company_name: form.get("company_name"),
    tax_id: form.get("tax_id"),
    invoice_title: form.get("invoice_title"),
    contacts: contacts.length ? contacts : [{ name: "", primary: true }],
    notes: form.get("notes"),
    is_active: Boolean(form.get("is_active")),
    business_card_image: businessCardImage,
    business_card_images: businessCardImagesFromForm(formElement, existing, businessCardImage),
    review_status: "reviewed",
    review_source: customerId ? existing.review_source || "manual" : businessCardImage ? "single_ocr" : "manual",
    reviewed_at: new Date().toISOString(),
  };
  const duplicates = findCustomerDuplicates(payload, customerId || "");
  payload.duplicate_candidate_ids = duplicates.map((customer) => customer.id);
  payload.data_quality_issues = customerDataQualityIssues(payload);
  if (duplicates.length && !confirm(`可能與「${duplicates[0].company_name || duplicates[0].name}」重複，仍要儲存嗎？`)) return;
  upsert("customers", payload);
  const changed = changedFieldLabels(customerId ? existing : null, payload, [
    ["name", "客戶名稱"],
    ["phone", "電話"],
    ["address", "地址"],
    ["company_name", "公司名稱"],
    ["tax_id", "統編"],
    ["invoice_title", "發票抬頭"],
    ["is_active", "啟用狀態"],
  ]);
  if (customerId && JSON.stringify(existing.contacts || []) !== JSON.stringify(payload.contacts || [])) changed.push("聯絡人");
  logRecordChange("customers", customerId ? "update" : "create", payload, customerId && changed.length ? `變更欄位：${changed.join("、")}` : `公司：${payload.company_name || "未填"}`);
  if (typeof window.closeCustomerCardOcrModal === "function") window.closeCustomerCardOcrModal();
  go("/customers");
  setToast(customerId ? "客戶已更新" : "客戶已建立");
};

window.openCustomerBusinessCard = function (customerId) {
  const customer = customerById(customerId);
  const cardImages = [];
  const pushCardImage = (image) => {
    const src = image?.data_url || image?.dataUrl || image?.src || image?.url || "";
    if (!src || cardImages.some((item) => (item.data_url || item.dataUrl || "") === src)) return;
    cardImages.push(image);
  };
  (customer?.business_card_images || []).forEach(pushCardImage);
  if (cardImages.length > 1) {
    document.getElementById("customer-business-card-viewer")?.remove();
    const title = customer.company_name || customer.name || "customer card";
    const imageHtml = cardImages
      .map((image, index) => {
        const src = image?.data_url || image?.dataUrl || image?.src || image?.url || "";
        const name = image?.name ? h(image.name) : `card ${index + 1}`;
        return `<figure class="business-card-viewer__item">
          <img class="business-card-viewer__image" src="${h(src)}" alt="${h(title)} card ${index + 1}">
          <figcaption>${name}</figcaption>
        </figure>`;
      })
      .join("");
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="business-card-viewer-backdrop" id="customer-business-card-viewer" onclick="if(event.target===this) closeCustomerBusinessCard()">
        <div class="business-card-viewer" role="dialog" aria-modal="true" aria-label="business cards">
          <div class="business-card-viewer__head">
            <div>
              <h2>&#x67e5;&#x770b;&#x540d;&#x7247;</h2>
              <p>${h(title)} &#183; ${cardImages.length} &#x5f35;&#x540d;&#x7247;</p>
            </div>
            <button class="btn outline sm" type="button" onclick="closeCustomerBusinessCard()">&#x95dc;&#x9589;</button>
          </div>
          <div class="business-card-viewer__body business-card-viewer__body--grid">
            ${imageHtml}
          </div>
        </div>
      </div>`
    );
    return;
  }
  const image = customer?.business_card_image;
  const src = image?.data_url || image?.dataUrl || image?.src || image?.url || "";
  if (!src) {
    setToast("此客戶尚未儲存名片圖檔");
    return;
  }
  document.getElementById("customer-business-card-viewer")?.remove();
  const title = customer.company_name || customer.name || "客戶名片";
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="business-card-viewer-backdrop" id="customer-business-card-viewer" onclick="if(event.target===this) closeCustomerBusinessCard()">
      <div class="business-card-viewer" role="dialog" aria-modal="true" aria-label="查看名片">
        <div class="business-card-viewer__head">
          <div>
            <h2>查看名片</h2>
            <p>${h(title)}${image.name ? ` · ${h(image.name)}` : ""}</p>
          </div>
          <button class="btn outline sm" type="button" onclick="closeCustomerBusinessCard()">關閉</button>
        </div>
        <div class="business-card-viewer__body">
          <img class="business-card-viewer__image" src="${h(src)}" alt="${h(title)} 的名片">
        </div>
      </div>
    </div>`
  );
};

window.closeCustomerBusinessCard = function () {
  document.getElementById("customer-business-card-viewer")?.remove();
};

window.addContact = function (customerId) {
  const target = customerId ? customerById(customerId) : null;
  if (target) {
    target.contacts.push({ name: "", role: "", phone: "", email: "", notes: "", primary: false });
    saveState();
    logWorkEvent("contact", `新增客戶聯絡人：${workLogRecordTitle("customers", target)}`, {
      entityType: "contacts",
      entityId: target.id,
      entityName: workLogRecordTitle("customers", target),
      detail: "新增一列空白聯絡人",
    });
  }
  render();
};

window.removeContact = function (index) {
  const r = route();
  const customer = r.parts[1] ? customerById(r.parts[1]) : null;
  if (customer && customer.contacts.length > 1) {
    const removed = customer.contacts[index];
    customer.contacts.splice(index, 1);
    if (!customer.contacts.some((c) => c.primary)) customer.contacts[0].primary = true;
    saveState();
    logWorkEvent("delete", `刪除客戶聯絡人：${workLogRecordTitle("contacts", removed) || "未命名"}`, {
      entityType: "contacts",
      entityId: customer.id,
      entityName: workLogRecordTitle("customers", customer),
      detail: `客戶：${workLogRecordTitle("customers", customer)}`,
    });
  }
  render();
};

function blankTemplateDraft() {
  return {
    name: "",
    description: "",
    notes: "",
    warranty: "",
    payments: [{ pct: "", text: "" }],
    laborItems: defaultLaborItems(),
    is_default: false,
    is_active: true,
  };
}

function indexedFieldCount(form, pattern) {
  let highest = -1;
  for (const key of form.keys()) {
    const match = key.match(pattern);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return highest + 1;
}

function syncTemplateDraftFromForm(tpl, formData) {
  const form = formData || document.querySelector("form[onsubmit^=\"saveTemplate\"]");
  if (!tpl || !form) return tpl;

  const data = form instanceof FormData ? form : new FormData(form);
  const defaultLaborUnit = defaultLaborItems()[0]?.unit || "";

  tpl.name = data.get("name") || "";
  tpl.description = data.get("description") || "";
  tpl.notes = data.get("notes") || "";
  tpl.warranty = data.get("warranty") || "";
  tpl.is_default = Boolean(data.get("is_default"));
  tpl.is_active = Boolean(data.get("is_active"));

  const paymentCount = Math.max(
    tpl.payments?.length || 0,
    indexedFieldCount(data, /^payment_(?:pct|text)_(\d+)$/),
    1
  );
  tpl.payments = Array.from({ length: paymentCount }, (_, index) => ({
    pct: data.get(`payment_pct_${index}`) || "",
    text: data.get(`payment_text_${index}`) || "",
  }));

  const laborCount = Math.max(
    tpl.laborItems?.length || 0,
    indexedFieldCount(data, /^tpl_labor_(?:name|unit|pct|unit_price|manual)_(\d+)$/),
    1
  );
  tpl.laborItems = Array.from({ length: laborCount }, (_, index) => ({
    name: data.get(`tpl_labor_name_${index}`) || "",
    unit: data.get(`tpl_labor_unit_${index}`) || defaultLaborUnit,
    pct: data.get(`tpl_labor_pct_${index}`) || "",
    unit_price: data.get(`tpl_labor_unit_price_${index}`) || "",
    manual_amount: data.get(`tpl_labor_manual_${index}`) || "",
    is_balancer: String(index) === String(data.get("tpl_labor_balancer")),
  }));

  return tpl;
}

window.saveTemplate = function (event, templateId) {
  event.preventDefault();
  if (!requirePermission("edit_quote_templates")) return;
  const form = new FormData(event.currentTarget);
  const before = templateId ? JSON.parse(JSON.stringify(templateById(templateId) || {})) : null;
  const existing = syncTemplateDraftFromForm(templateId ? templateById(templateId) : currentTemplateForEdit(), form);
  const payments = existing.payments.filter((row) => row.pct !== "" || row.text !== "");
  const laborItems = existing.laborItems;
  const payload = {
    id: templateId || id("t"),
    name: existing.name,
    description: existing.description,
    notes: existing.notes,
    warranty: existing.warranty,
    payments: payments.length ? payments : [{ pct: "", text: "" }],
    laborItems,
    is_default: existing.is_default,
    is_active: existing.is_active,
  };
  if (payload.is_default) state.templates.forEach((item) => (item.is_default = false));
  upsert("templates", payload);
  const changed = changedFieldLabels(before, payload, [
    ["name", "名稱"],
    ["description", "說明"],
    ["notes", "注意事項"],
    ["warranty", "保固"],
    ["is_default", "預設"],
    ["is_active", "啟用狀態"],
  ]);
  if (before && JSON.stringify(before.payments || []) !== JSON.stringify(payload.payments || [])) changed.push("付款條件");
  if (before && JSON.stringify(before.laborItems || []) !== JSON.stringify(payload.laborItems || [])) changed.push("工項");
  logRecordChange("templates", templateId ? "update" : "create", payload, templateId && changed.length ? `變更欄位：${changed.join("、")}` : "儲存報價範本");
  if (!templateId) ui.tempTemplate = null;
  go("/quote-templates");
  setToast(templateId ? "版本已更新" : "版本已建立");
};

window.addPayment = function () {
  if (!requirePermission("edit_quote_templates")) return;
  const tpl = currentTemplateForEdit();
  syncTemplateDraftFromForm(tpl);
  tpl.payments.push({ pct: "", text: "" });
  saveState();
  render();
};

window.removePayment = function (index) {
  if (!requirePermission("edit_quote_templates")) return;
  const tpl = currentTemplateForEdit();
  syncTemplateDraftFromForm(tpl);
  if (tpl.payments.length > 1) tpl.payments.splice(index, 1);
  saveState();
  render();
};

window.addTemplateLabor = function () {
  if (!requirePermission("edit_quote_templates")) return;
  const tpl = currentTemplateForEdit();
  syncTemplateDraftFromForm(tpl);
  tpl.laborItems.push({ name: "", unit: "式", pct: "", unit_price: "", manual_amount: "", is_balancer: false });
  saveState();
  render();
};

window.removeLabor = function (prefix, index) {
  if (!requirePermission("edit_quote_templates")) return;
  const tpl = currentTemplateForEdit();
  syncTemplateDraftFromForm(tpl);
  if (prefix === "tpl_labor" && tpl.laborItems.length > 1) tpl.laborItems.splice(index, 1);
  saveState();
  render();
};

function currentTemplateForEdit() {
  const r = route();
  if (r.parts[1] && r.parts[1] !== "new") return templateById(r.parts[1]);
  if (!ui.tempTemplate) ui.tempTemplate = blankTemplateDraft();
  return ui.tempTemplate;
}

window.deleteRecord = function (collection, recordId, redirect) {
  if (!requireDeletePermission(collection)) return;
  if (!confirm("確定要刪除?此操作無法復原。")) return;
  const removed = state[collection]?.find((item) => item.id === recordId);
  state[collection] = state[collection].filter((item) => item.id !== recordId);
  saveState();
  if (collection === "quotes") clearStoredQuoteDraft(recordId);
  logRecordChange(collection, "delete", removed || { id: recordId }, `資料類型：${workLogEntityLabel(collection)}`);
  ui.quoteDraft = null;
  go(redirect);
  setToast("已刪除");
};

function upsert(collection, payload) {
  const index = state[collection].findIndex((item) => item.id === payload.id);
  if (index >= 0) state[collection][index] = payload;
  else state[collection].push(payload);
  saveState();
}

window.togglePicker = function (type) {
  ui.picker = ui.picker === type ? null : type;
  ui.pickerSearch = "";
  render();
};

window.updatePickerSearch = function (value) {
  ui.pickerSearch = value;
  render();
};

window.setQuotePicker = function (type, value) {
  const draft = ui.quoteDraft;
  if (!draft) return;
  if (type === "customer") draft.customer_id = value;
  if (type === "template") {
    draft.template_id = value;
    const tpl = templateById(value);
    if (tpl) draft.sections.forEach((section) => (section.laborItems = JSON.parse(JSON.stringify(tpl.laborItems))));
  }
  if (type === "material" && ui.editingMaterial) {
    const previous = draft.sections[ui.editingMaterial.sectionIndex].items[ui.editingMaterial.itemIndex];
    if (previous?.line_id) {
      delete ui.quoteCatalogSelections[previous.line_id];
      delete ui.quoteCustomSelections[previous.line_id];
      delete ui.quoteSpecificationSelections[previous.line_id];
      delete ui.quoteSpecificationDraftSelections[previous.line_id];
    }
    const mat = materialById(value);
    const item = mat ? itemFromMaterial(mat.id) : blankItem();
    if (mat) {
      item.thickness = "";
      item.width = "";
      item.weight = "";
      delete item.material_specification_snapshot;
    }
    draft.sections[ui.editingMaterial.sectionIndex].items[ui.editingMaterial.itemIndex] = item;
    if (mat) ui.quoteCatalogSelections[item.line_id] = mat.id;
    else ui.quoteCustomSelections[item.line_id] = true;
  }
  ui.picker = null;
  ui.pickerSearch = "";
  saveStoredQuoteDraft();
  render();
};

window.setCustomQuoteItem = function () {
  const edit = ui.editingMaterial;
  if (!edit || !ui.quoteDraft) return;
  const previous = ui.quoteDraft.sections[edit.sectionIndex].items[edit.itemIndex];
  if (previous?.line_id) {
    delete ui.quoteCatalogSelections[previous.line_id];
    delete ui.quoteCustomSelections[previous.line_id];
    delete ui.quoteSpecificationSelections[previous.line_id];
    delete ui.quoteSpecificationDraftSelections[previous.line_id];
  }
  const customItem = {
    ...blankItem(),
    line_id: previous?.line_id || id("line"),
    name: previous?.material_id ? "" : previous?.name || "",
    unit: previous?.material_id ? "件" : previous?.unit || "件",
  };
  ui.quoteDraft.sections[edit.sectionIndex].items[edit.itemIndex] = customItem;
  ui.quoteCustomSelections[customItem.line_id] = true;
  ui.picker = null;
  saveStoredQuoteDraft();
  render();
};

window.updateQuotePath = function (el, shouldRender = false) {
  if (!ui.quoteDraft) return;
  ui.quoteDraft[el.dataset.quotePath] = el.value;
  saveStoredQuoteDraft();
  if (shouldRender) setTimeout(render, 0);
};

window.updateQuoteListPath = function (el) {
  if (!ui.quoteDraft) return;
  ui.quoteDraft[el.dataset.quoteListPath] = String(el.value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  saveStoredQuoteDraft();
};

window.updateSectionField = function (el, shouldRender = false) {
  const section = ui.quoteDraft.sections[Number(el.dataset.section)];
  section[el.dataset.sectionField] = el.value;
  saveStoredQuoteDraft();
  if (shouldRender) setTimeout(render, 0);
};

window.updateLaborField = function (el, shouldRender = false) {
  const row = ui.quoteDraft.sections[Number(el.dataset.laborSection)].laborItems[Number(el.dataset.laborIndex)];
  row[el.dataset.laborField] = el.value;
  saveStoredQuoteDraft();
  if (shouldRender) setTimeout(render, 0);
};

function setQuoteLaborDetailFeedback(sectionIndex, rowId, fieldName, message) {
  ui.quoteLaborDetailFeedback = ui.quoteLaborDetailFeedback || {};
  const key = quoteLaborDetailFeedbackKey(sectionIndex, rowId, fieldName);
  if (message) ui.quoteLaborDetailFeedback[key] = message;
  else delete ui.quoteLaborDetailFeedback[key];
}

function clearQuoteLaborDetailFeedback(sectionIndex, rowId = "", fieldName = "") {
  ui.quoteLaborDetailFeedback = ui.quoteLaborDetailFeedback || {};
  const prefix = [sectionIndex, rowId || ""].filter((value) => value !== "").join(":");
  Object.keys(ui.quoteLaborDetailFeedback).forEach((key) => {
    if ((!prefix || key.startsWith(`${prefix}:`) || key === prefix)
      && (!fieldName || key.endsWith(`:${fieldName}`))) {
      delete ui.quoteLaborDetailFeedback[key];
    }
  });
}

window.initializeQuoteLaborDetailsForDraft = function () {
  const draft = ui.quoteDraft;
  if (!draft || !Array.isArray(draft.sections)) return { ok: false, changed: false, errors: [] };
  let changed = false;
  const errors = [];
  draft.sections.forEach((section, sectionIndex) => {
    if (section?.calculation_mode !== MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE) return;
    const materialGateError = quoteLaborDetailSectionGateError(sectionIndex);
    if (materialGateError) {
      errors.push({
        sectionIndex,
        code: MaterialsQuoteDomain.QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE,
        error: materialGateError,
      });
      setQuoteLaborDetailFeedback(sectionIndex, "", "", materialGateError);
      return;
    }
    const result = MaterialsQuoteDomain.initializeExcelLaborDetail({
      section,
      quoteStatus: draft.status || "draft",
      actor: currentUser(),
      at: new Date().toISOString(),
    });
    if (!result.ok) {
      errors.push({ sectionIndex, code: result.code, error: result.error });
      setQuoteLaborDetailFeedback(sectionIndex, "", "", result.error);
      return;
    }
    setQuoteLaborDetailFeedback(sectionIndex, "", "", "");
    if (result.changed) {
      draft.sections[sectionIndex] = result.section;
      changed = true;
    }
  });
  if (changed) saveStoredQuoteDraft(false);
  return { ok: errors.length === 0, changed, errors };
};

window.updateExcelLaborDetailField = function (el) {
  const sectionIndex = Number(el?.dataset?.laborDetailSection);
  const rowId = String(el?.dataset?.laborRowId || "");
  const fieldName = String(el?.dataset?.laborDetailField || "");
  const section = ui.quoteDraft?.sections?.[sectionIndex];
  const selected = section ? MaterialsQuoteDomain.selectExcelLaborDetail(section) : null;
  const previousRow = selected?.rows?.find((row) => row.row_id === rowId);
  const materialGateError = quoteLaborDetailSectionGateError(sectionIndex);
  if (materialGateError) {
    const result = {
      ok: false,
      code: MaterialsQuoteDomain.QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE,
      error: materialGateError,
      changed: false,
      section: section ? MaterialsQuoteDomain.deepClone(section) : {},
    };
    setQuoteLaborDetailFeedback(sectionIndex, "", "", materialGateError);
    render();
    return result;
  }
  const result = MaterialsQuoteDomain.applyExcelLaborDetailOverride({
    section,
    quoteStatus: ui.quoteDraft?.status || "draft",
    actor: currentUser(),
    rowId,
    patch: { [fieldName]: el?.value },
    at: new Date().toISOString(),
  });
  if (!result.ok) {
    if (el && previousRow && Object.prototype.hasOwnProperty.call(previousRow, fieldName)) {
      el.value = previousRow[fieldName];
    }
    setQuoteLaborDetailFeedback(sectionIndex, rowId, fieldName, result.error || "輸入值無效");
    render();
    return result;
  }
  ui.quoteDraft.sections[sectionIndex] = result.section;
  clearQuoteLaborDetailFeedback(sectionIndex, rowId, fieldName);
  setQuoteLaborDetailFeedback(sectionIndex, "", "", "");
  saveStoredQuoteDraft();
  render();
  return result;
};

window.clearExcelLaborDetailFieldError = function (el) {
  const sectionIndex = Number(el?.dataset?.laborDetailSection);
  const rowId = String(el?.dataset?.laborRowId || "");
  const fieldName = String(el?.dataset?.laborDetailField || "");
  setQuoteLaborDetailFeedback(sectionIndex, rowId, fieldName, "");
  const cell = typeof el?.closest === "function" ? el.closest(".excel-labor-cell") : null;
  cell?.classList.remove("has-error");
  cell?.querySelector(".excel-labor-field-error")?.remove();
};

window.resetExcelLaborDetail = function (sectionIndex) {
  const section = ui.quoteDraft?.sections?.[Number(sectionIndex)];
  const selected = section ? MaterialsQuoteDomain.selectExcelLaborDetail(section) : null;
  if (!selected?.has_overrides) {
    return { ok: true, code: MaterialsQuoteDomain.QUOTE_LABOR_DETAIL_ERROR_CODES.OK, changed: false, section };
  }
  if (!confirm("確定將本區所有人工調整重置為預設值嗎？")) {
    return { ok: false, code: "CANCELLED", error: "已取消重置", changed: false, section };
  }
  const result = MaterialsQuoteDomain.resetExcelLaborDetailOverrides({
    section,
    quoteStatus: ui.quoteDraft?.status || "draft",
    actor: currentUser(),
    at: new Date().toISOString(),
  });
  if (!result.ok) {
    setQuoteLaborDetailFeedback(Number(sectionIndex), "", "", result.error || "無法重置工料明細");
    render();
    return result;
  }
  ui.quoteDraft.sections[Number(sectionIndex)] = result.section;
  clearQuoteLaborDetailFeedback(Number(sectionIndex));
  if (result.changed) saveStoredQuoteDraft();
  render();
  return result;
};

window.updateLaborConfigField = function (el) {
  const sectionIndex = Number(el?.dataset?.laborConfigSection);
  const section = ui.quoteDraft?.sections?.[sectionIndex];
  const result = {
    ok: false,
    code: MaterialsQuoteDomain.QUOTE_LABOR_DETAIL_ERROR_CODES.FIELD_NOT_EDITABLE,
    error: "公式設定不可直接改寫，請調整下方工料明細。",
    changed: false,
    section: section ? MaterialsQuoteDomain.deepClone(section) : {},
  };
  setQuoteLaborDetailFeedback(sectionIndex, "", "", result.error);
  render();
  return result;
};

window.setLaborBalancer = function (sectionIndex, laborIndex) {
  ui.quoteDraft.sections[sectionIndex].laborItems.forEach((row, index) => (row.is_balancer = index === laborIndex));
  saveStoredQuoteDraft();
  render();
};

window.addQuoteSection = function () {
  ui.quoteDraft.sections.push(blankSection());
  saveStoredQuoteDraft();
  render();
};

window.removeSection = function (index) {
  if (ui.quoteDraft.sections.length > 1) ui.quoteDraft.sections.splice(index, 1);
  saveStoredQuoteDraft();
  render();
};

window.moveSection = function (index, delta) {
  const target = index + delta;
  const sections = ui.quoteDraft.sections;
  if (target < 0 || target >= sections.length) return;
  [sections[index], sections[target]] = [sections[target], sections[index]];
  saveStoredQuoteDraft();
  render();
};

window.addQuoteItem = function (sectionIndex) {
  ui.quoteDraft.sections[sectionIndex].items.push(blankItem());
  ui.editingMaterial = { sectionIndex, itemIndex: ui.quoteDraft.sections[sectionIndex].items.length - 1 };
  saveStoredQuoteDraft();
  render();
};

window.removeQuoteItem = function (sectionIndex, itemIndex) {
  const items = ui.quoteDraft.sections[sectionIndex].items;
  const removed = items[itemIndex];
  if (removed?.line_id) {
    delete ui.quoteCatalogSelections[removed.line_id];
    delete ui.quoteCustomSelections[removed.line_id];
    delete ui.quoteSpecificationSelections[removed.line_id];
    delete ui.quoteSpecificationDraftSelections[removed.line_id];
  }
  if (items.length > 1) items.splice(itemIndex, 1);
  else {
    items[0] = blankItem();
    ui.quoteCustomSelections[items[0].line_id] = true;
  }
  ui.editingMaterial = null;
  saveStoredQuoteDraft();
  render();
};

window.addQuoteLabor = function (sectionIndex) {
  ui.quoteDraft.sections[sectionIndex].laborItems.push({ name: "", unit: "式", pct: "", unit_price: "", manual_amount: "", is_balancer: false });
  saveStoredQuoteDraft();
  render();
};

window.removeQuoteLabor = function (sectionIndex, laborIndex) {
  const rows = ui.quoteDraft.sections[sectionIndex].laborItems;
  if (rows.length > 1) rows.splice(laborIndex, 1);
  if (!rows.some((row) => row.is_balancer)) rows[rows.length - 1].is_balancer = true;
  saveStoredQuoteDraft();
  render();
};

window.openMaterialDrawer = function (sectionIndex, itemIndex) {
  ui.editingMaterial = { sectionIndex, itemIndex };
  ui.picker = null;
  render();
};

window.closeMaterialDrawer = function () {
  const edit = ui.editingMaterial;
  const item = edit ? ui.quoteDraft?.sections?.[edit.sectionIndex]?.items?.[edit.itemIndex] : null;
  if (item?.line_id) delete ui.quoteSpecificationDraftSelections[item.line_id];
  ui.editingMaterial = null;
  ui.picker = null;
  saveStoredQuoteDraft();
  render();
};

window.updateItemField = function (el, shouldRender = false) {
  const edit = ui.editingMaterial;
  if (!edit) return;
  const item = ui.quoteDraft.sections[edit.sectionIndex].items[edit.itemIndex];
  const fieldName = el.dataset.itemField;
  if (item.item_kind === "catalog" && item.material_id && ["thickness", "width", "weight", "dimension_unit"].includes(fieldName)) {
    const result = { ok: false, code: "QUOTE_SPEC_FIELD_PROTECTED", error: "材料主檔品項請使用厚度與寬度選單" };
    setToast(result.error);
    return result;
  }
  const value = el.type === "checkbox" ? el.checked : el.value;
  const sourceQuote = ui.quoteDraftSource && ui.quoteDraftSource !== "new" ? quoteById(ui.quoteDraftSource) : null;
  const result = MaterialsQuoteDomain.applyQuoteItemPatch(item, { [fieldName]: value }, {
    status: sourceQuote?.status || "draft",
    canEditPricing: canEditMaterialPrices(),
  });
  ui.quoteDraft.sections[edit.sectionIndex].items[edit.itemIndex] = result.item;
  if (result.validationErrors.length) {
    setToast(result.validationErrors[0]);
    render();
    return;
  }
  if (result.rejectedFields.length) {
    setToast("此欄位受角色或單據狀態保護");
    render();
    return;
  }
  saveStoredQuoteDraft();
  if (shouldRender) setTimeout(() => {
    if (document.activeElement?.matches?.("[data-item-field]")) return;
    render();
  }, 0);
  return { ok: true, code: "OK", error: "", item: result.item };
};

function quoteSpecificationControlResult(ok, code, error = "") {
  return { ok, code, error };
}

function quoteSpecificationControlError(control, result) {
  const error = control?.querySelector("[data-quote-spec-error]");
  if (error) {
    error.textContent = result.error || "材料規格選擇失敗";
    error.dataset.code = result.code || "QUOTE_SPEC_INVALID_DATA";
    error.classList.add("is-visible");
  }
  return result;
}

window.changeQuoteSpecificationThickness = function (select) {
  const controls = select?.closest?.("[data-quote-spec-controls]");
  if (!controls) return quoteSpecificationControlResult(false, "QUOTE_SPEC_INVALID_STATE", "找不到材料規格選擇區");
  const materialId = controls.dataset.materialId || "";
  const lineId = controls.dataset.lineId || "";
  const widthSelect = controls.querySelector("[data-quote-spec-width]");
  const weight = controls.querySelector("[data-quote-spec-weight]");
  const thickness = select.value;
  if (lineId) ui.quoteSpecificationDraftSelections[lineId] = { thickness, width: "" };
  controls.dataset.legacyRetained = "false";
  controls.dataset.pendingSelection = thickness ? "true" : "false";
  if (weight) weight.innerHTML = `<strong>${thickness ? "待選寬度" : "尚未選擇"}</strong><small>選定完整組合後自動帶入</small>`;
  if (!widthSelect) return quoteSpecificationControlResult(false, "QUOTE_SPEC_INVALID_STATE", "找不到寬度選單");
  widthSelect.value = "";
  widthSelect.innerHTML = `<option value="">${thickness ? "請選擇寬度" : "請先選厚度"}</option>`;
  widthSelect.disabled = true;
  const error = controls.querySelector("[data-quote-spec-error]");
  if (error) {
    error.textContent = "";
    error.dataset.code = "";
    error.classList.remove("is-visible");
  }
  if (!thickness) return quoteSpecificationControlResult(false, "QUOTE_SPEC_THICKNESS_REQUIRED", "請先選擇厚度");
  const result = window.MaterialSpecifications.listWidthOptions(materialId, thickness);
  if (!result?.ok) return quoteSpecificationControlError(controls, result);
  result.value.forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    widthSelect.appendChild(option);
  });
  widthSelect.disabled = result.value.length === 0;
  if (!result.value.length) return quoteSpecificationControlError(controls, quoteSpecificationControlResult(false, "QUOTE_SPEC_PAIR_NOT_FOUND", "此厚度沒有可用寬度"));
  return quoteSpecificationControlResult(true, "OK");
};

window.changeQuoteSpecificationWidth = function (select) {
  const controls = select?.closest?.("[data-quote-spec-controls]");
  if (!controls) return quoteSpecificationControlResult(false, "QUOTE_SPEC_INVALID_STATE", "找不到材料規格選擇區");
  const thickness = controls.querySelector("[data-quote-spec-thickness]")?.value || "";
  if (!thickness) return quoteSpecificationControlError(controls, quoteSpecificationControlResult(false, "QUOTE_SPEC_THICKNESS_REQUIRED", "請先選擇厚度"));
  if (!select.value) return quoteSpecificationControlError(controls, quoteSpecificationControlResult(false, "QUOTE_SPEC_WIDTH_REQUIRED", "請選擇寬度"));
  const result = window.QuoteMaterialSpecifications.selectSpecification({
    sectionIndex: Number(controls.dataset.sectionIndex),
    itemIndex: Number(controls.dataset.itemIndex),
    materialId: controls.dataset.materialId || "",
    thickness,
    width: select.value,
  });
  if (!result?.ok) return quoteSpecificationControlError(controls, result);
  const lineId = controls.dataset.lineId || "";
  if (lineId) delete ui.quoteSpecificationDraftSelections[lineId];
  render();
  return result;
};

window.completeMaterialDrawer = function () {
  const edit = ui.editingMaterial;
  const item = edit ? ui.quoteDraft?.sections?.[edit.sectionIndex]?.items?.[edit.itemIndex] : null;
  if (!item) return quoteSpecificationControlResult(false, "QUOTE_SPEC_ITEM_NOT_FOUND", "找不到報價材料");
  if (item.item_kind === "catalog" && item.material_id) {
    const controls = document.querySelector("[data-quote-spec-controls]");
    const thickness = controls?.querySelector("[data-quote-spec-thickness]")?.value || "";
    const width = controls?.querySelector("[data-quote-spec-width]")?.value || "";
    const legacyRetained = controls?.dataset.legacyRetained === "true";
    if (!thickness) {
      const result = quoteSpecificationControlResult(false, "QUOTE_SPEC_THICKNESS_REQUIRED", "請先選擇厚度");
      setToast(result.error);
      return result;
    }
    if (!width) {
      const result = quoteSpecificationControlResult(false, "QUOTE_SPEC_WIDTH_REQUIRED", "請選擇寬度");
      setToast(result.error);
      return result;
    }
    const snapshot = item.material_specification_snapshot;
    const snapshotMatches = snapshot
      && Number(snapshot.thickness) === Number(thickness)
      && Number(snapshot.width) === Number(width)
      && Number(snapshot.weight) === Number(item.weight);
    if (!snapshotMatches && !legacyRetained) {
      const result = quoteSpecificationControlResult(false, "QUOTE_SPEC_SELECTION_REQUIRED", "請重新選擇完整的厚度與寬度");
      setToast(result.error);
      return result;
    }
  }
  closeMaterialDrawer();
  return quoteSpecificationControlResult(true, "OK");
};

window.discardQuoteDraft = function (quoteId) {
  if (!confirm("確定要捨棄目前未儲存的草稿嗎？")) return;
  clearStoredQuoteDraft(quoteId || "new");
  ui.quoteDraft = null;
  ui.quoteDraftSource = null;
  ui.editingMaterial = null;
  if (quoteId) render();
  else go("/quotes");
};

const QUOTE_REJECTED_FIELD_LABELS = Object.freeze({
  status: "報價狀態",
  manualTotal: "手動總價",
  line_id: "明細識別",
  material_id: "材料來源",
  item_kind: "品項來源",
  pricing_type: "計價類型",
  thickness: "厚度",
  width: "寬度",
  length: "長度",
  weight: "重量",
  dimension_unit: "尺寸單位",
  wall_thickness_mm: "壁厚",
  material_specification_snapshot: "材料規格快照",
  formula_version: "公式版本",
  formula_source: "公式來源",
  formula_source_id: "公式來源",
  formula_source_version: "公式版本",
  formula_source_snapshot: "公式快照",
  density_factor: "重量換算係數",
  cost_price: "成本價",
  cost_price_status: "成本價狀態",
  standard_budget_unit_price: "標準預算價",
  standard_budget_source: "標準預算價來源",
  standard_budget_version: "標準預算價版本",
  catalog_sale_unit_price: "目錄售價",
  catalog_sale_price_source: "目錄售價來源",
  catalog_sale_price_version: "目錄售價版本",
  catalog_discount_factor: "目錄折數",
  default_actual_unit_price: "預設案件單價",
  price_source: "價格來源",
  price_version: "價格版本",
  catalog_review_required: "材料覆核狀態",
  catalog_review_reason: "材料覆核原因",
  category: "材料分類",
  price_effective_date: "價格生效日",
  price_is_override: "案件價格狀態",
  labor_pricing_type: "工錢計價類型",
  labor_detail_contract: "工料明細",
});

function quotePersistencePathValue(source, path) {
  return String(path || "").split(".").reduce((value, key) => value == null ? undefined : value[key], source);
}

function quotePersistenceValuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if ((left == null || left === "") && (right == null || right === "")) return true;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch (error) {
    return false;
  }
}

function quotePersistenceTargetsExistingItem(path, draft, existing) {
  const match = String(path || "").match(/^sections\.(\d+)\.items\.(\d+)\./);
  if (!match) return true;
  const sectionIndex = Number(match[1]);
  const itemIndex = Number(match[2]);
  const draftItem = draft?.sections?.[sectionIndex]?.items?.[itemIndex];
  const existingItems = existing?.sections?.[sectionIndex]?.items || [];
  if (draftItem?.line_id && existingItems.some((item) => item?.line_id === draftItem.line_id)) return true;
  return Boolean(existingItems[itemIndex]);
}

function quotePersistenceRejectedMessage(draft, sanitized, existing) {
  const rejectedFields = Array.isArray(sanitized?.rejectedFields) ? sanitized.rejectedFields : [];
  const changedFields = rejectedFields.filter((path) => quotePersistenceTargetsExistingItem(path, draft, existing)
    && !quotePersistenceValuesEqual(
      quotePersistencePathValue(draft, path),
      quotePersistencePathValue(sanitized?.quote, path),
    ));
  if (!changedFields.length) return "";
  const fieldNames = changedFields.map((path) => String(path).split(".").pop());
  const labels = Array.from(new Set(fieldNames.map((field) => QUOTE_REJECTED_FIELD_LABELS[field] || "受保護資料")));
  const visibleLabels = labels.slice(0, 3).join("、") + (labels.length > 3 ? "等欄位" : "");
  const specificationFields = new Set(["thickness", "width", "weight", "dimension_unit", "material_specification_snapshot"]);
  if (fieldNames.some((field) => specificationFields.has(field))) {
    return `報價單未保存：${visibleLabels}屬於材料規格的受保護欄位，請重新選擇材料規格。`;
  }
  return `報價單未保存：${visibleLabels}屬於受保護欄位，請使用畫面提供的編輯流程。`;
}

window.saveQuote = function (event, quoteId) {
  event.preventDefault();
  const draft = ui.quoteDraft;
  const existingRecord = quoteId ? quoteById(quoteId) : null;
  const requestedStatus = draft?.status || "draft";
  if (requestedStatus !== (existingRecord?.status || "draft") && ["pending_approval", "approved", "returned"].includes(requestedStatus)) {
    setToast("審核狀態只能透過送審、核准或退回 action 變更");
    return;
  }
  if (quoteIsLocked(existingRecord)) {
    setToast("已寄出或結案的報價不能直接覆寫，請建立修訂版");
    return;
  }
  const transition = MaterialsQuoteDomain.validateQuoteStatusTransition(existingRecord?.status, draft.status || "draft", {
    canApprove: canApproveQuotes(),
  });
  if (!transition.ok) {
    setToast(transition.error);
    return;
  }
  const existing = quoteId ? JSON.parse(JSON.stringify(quoteById(quoteId) || {})) : null;
  const sanitized = MaterialsQuoteDomain.sanitizeQuoteForPersistence(draft, existing, state.materials, {
    canEditPricing: canEditMaterialPrices(),
    canApprove: canApproveQuotes(),
    defaultTaxRate: state.company.defaultTaxRate || 5,
    template: templateById(draft.template_id),
    trustedCatalogSelections: ui.quoteCatalogSelections,
    trustedCustomSelections: ui.quoteCustomSelections,
    trustedSpecificationSelections: ui.quoteSpecificationSelections,
  });
  if (sanitized.blockedByStatus) {
    setToast("這張報價目前不可直接修改，請依狀態流程操作");
    return;
  }
  if (sanitized.validationErrors.length) {
    setToast(sanitized.validationErrors[0]);
    return;
  }
  const rejectedMessage = quotePersistenceRejectedMessage(draft, sanitized, existing);
  if (rejectedMessage) {
    setToast(rejectedMessage);
    return;
  }
  const safeDraft = normalizeQuoteRecord(sanitized.quote);
  const draftTotals = computeQuote(safeDraft);
  const validation = MaterialsQuoteDomain.validateQuoteForStatus(safeDraft, draftTotals, safeDraft.status, {
    template: templateById(safeDraft.template_id),
    enforceP0: true,
  });
  if (!validation.ok) {
    setToast(validation.errors[0]);
    return;
  }
  const payload = safeDraft;
  payload.id = quoteId || id("q");
  payload.quote_no = quoteId ? payload.quote_no : reserveNextQuoteNo(payload.quote_date);
  payload.revision_group_id = payload.revision_group_id || payload.id;
  payload.owner_id = payload.owner_id || currentUser()?.id || "";
  payload.updated_at = new Date().toISOString();
  payload.created_at = payload.created_at || payload.updated_at;
  if (!existing || existing.status !== payload.status) {
    payload.status_updated_at = payload.updated_at;
    payload.status_updated_by = currentUser()?.id || "";
    if (payload.status === "pending_approval") payload.submitted_for_approval_at = payload.updated_at;
    if (payload.status === "lost") payload.lost_at = payload.lost_at || payload.updated_at;
  }
  if (quoteIsLocked(payload) && !payload.document_snapshot) {
    payload.document_snapshot = createQuoteDocumentSnapshot(payload, computeQuote(payload));
    if (["sent", "won", "expired"].includes(payload.status)) payload.sent_at = payload.sent_at || payload.document_snapshot.issued_at;
  }
  upsert("quotes", payload);
  const changed = changedFieldLabels(existing, payload, [
    ["quote_no", "報價單號"],
    ["customer_id", "客戶"],
    ["template_id", "報價範本"],
    ["title", "標題"],
    ["project_name", "工程名稱"],
    ["project_address", "案場地址"],
    ["project_contact", "案場聯絡人"],
    ["quote_date", "日期"],
    ["status", "狀態"],
    ["discount_amount", "折扣"],
    ["tax_rate", "稅率"],
  ]);
  if (existing && JSON.stringify(existing.sections || []) !== JSON.stringify(payload.sections || [])) changed.push("明細");
  logRecordChange("quotes", quoteId ? "update" : "create", payload, quoteId && changed.length ? `變更欄位：${changed.join("、")}` : `客戶：${workLogRecordTitle("customers", customerById(payload.customer_id))}`);
  ui.quoteDraft = null;
  ui.quoteDraftSource = null;
  ui.editingMaterial = null;
  clearStoredQuoteDraft(quoteId || "new");
  go(`/quotes/${payload.id}`);
  setToast(quoteId ? "報價單已更新" : "報價單已建立");
};

function localApprovalFailure(code, error, quote = null) {
  return {
    ok: false,
    code,
    error,
    quote: quote ? MaterialsQuoteDomain.deepClone(quote) : null,
  };
}

function presentLocalApprovalFailure(result, options = {}) {
  if (!options.silent && result?.error) setToast(result.error);
  return result;
}

function currentApprovalActor() {
  const actor = currentUser();
  return actor ? {
    id: actor.id,
    account: actor.account,
    name: actor.name,
    role: actor.role,
    is_active: actor.is_active !== false,
  } : null;
}

function applyLocalApprovalState(result, quoteIndex, extraQuotes = []) {
  const previousQuote = quoteIndex >= 0 ? state.quotes[quoteIndex] : null;
  const previousHistory = state.quote_approval_history;
  const previousHead = state.quote_approval_history_head;
  if (quoteIndex >= 0 && result.quote) state.quotes[quoteIndex] = normalizeQuoteRecord(result.quote);
  if (quoteIndex >= 0 && result.original) state.quotes[quoteIndex] = normalizeQuoteRecord(result.original);
  extraQuotes.forEach((quote) => state.quotes.push(normalizeQuoteRecord(quote)));
  state.quote_approval_history = MaterialsQuoteDomain.deepClone(result.history || []);
  state.quote_approval_history_head = String(result.history_head || "");
  if (saveState()) return true;
  if (quoteIndex >= 0 && previousQuote) state.quotes[quoteIndex] = previousQuote;
  if (extraQuotes.length) state.quotes.splice(state.quotes.length - extraQuotes.length, extraQuotes.length);
  state.quote_approval_history = previousHistory;
  state.quote_approval_history_head = previousHead;
  return false;
}

function localApprovalOperationToken(quote) {
  return {
    quote_id: String(quote?.id || ""),
    status: String(quote?.status || "draft"),
    version_no: Number(quote?.quote_version || Number(quote?.revision_no || 0) + 1),
    submission_id: String(quote?.approval_submission_id || ""),
    history_head: String(state.quote_approval_history_head || ""),
  };
}

function localApprovalOperationIsCurrent(token) {
  const current = state.quotes.find((record) => record.id === token.quote_id);
  if (!current) return false;
  return String(current.status || "draft") === token.status
    && Number(current.quote_version || Number(current.revision_no || 0) + 1) === token.version_no
    && String(current.approval_submission_id || "") === token.submission_id
    && String(state.quote_approval_history_head || "") === token.history_head;
}

async function runLocalQuoteApprovalAction(quoteId, action, options = {}) {
  const quoteIndex = state.quotes.findIndex((record) => record.id === quoteId);
  const quote = quoteIndex >= 0 ? state.quotes[quoteIndex] : null;
  if (!quote) return presentLocalApprovalFailure(localApprovalFailure("QUOTE_NOT_FOUND", "找不到指定報價"), options);
  const at = String(options.at || new Date().toISOString());
  const actor = currentApprovalActor();
  const operationToken = localApprovalOperationToken(quote);
  if (action === "submit" && !MaterialsQuoteDomain.isKnownLocalQuoteActor(actor)) {
    return presentLocalApprovalFailure(localApprovalFailure(
      "SUBMIT_ROLE_DENIED",
      "目前角色不可提交報價",
      quote,
    ), options);
  }
  if (["approve", "return"].includes(action) && !MaterialsQuoteDomain.isLocalQuoteReviewer(actor)) {
    return presentLocalApprovalFailure(localApprovalFailure(
      "REVIEW_PERMISSION_DENIED",
      "只有管理人員或老闆可以核准或退回報價",
      quote,
    ), options);
  }
  const totals = computeQuote(quote);
  if (action === "approve") {
    const validation = MaterialsQuoteDomain.validateQuoteForStatus(quote, totals, "approved", {
      template: templateById(quote.template_id),
      enforceP0: true,
    });
    if (!validation.ok) return presentLocalApprovalFailure(localApprovalFailure("QUOTE_VALIDATION_FAILED", validation.errors[0], quote), options);
  }
  const documentSnapshot = ["submit", "approve"].includes(action)
    ? createQuoteDocumentSnapshot(quote, totals, {
      issuedAt: at,
      issuedBy: actor ? { id: actor.id, name: actor.name, account: actor.account } : null,
    })
    : null;
  const pendingQueueRecord = ["approve", "return", "withdraw"].includes(action)
    ? MaterialsQuoteDomain.selectPendingQuoteApprovals([quote])[0] || null
    : null;
  const result = await MaterialsQuoteDomain.applyLocalQuoteApprovalAction({
    quote,
    action,
    actor,
    at,
    reason: options.reason,
    totals,
    validationContext: {
      template: templateById(quote.template_id),
      enforceP0: true,
    },
    documentSnapshot,
    history: state.quote_approval_history || [],
    expectedHistoryHead: state.quote_approval_history_head || "",
    eventId: options.eventId || id("qa"),
    submissionId: options.submissionId || id("qs"),
    expectedSubmissionId: options.expectedSubmissionId !== undefined ? options.expectedSubmissionId : pendingQueueRecord?.submission_id,
    expectedVersionNo: options.expectedVersionNo !== undefined ? options.expectedVersionNo : pendingQueueRecord?.version_no,
  });
  if (!result.ok) return presentLocalApprovalFailure(result, options);
  if (!localApprovalOperationIsCurrent(operationToken)) {
    return presentLocalApprovalFailure(localApprovalFailure(
      "APPROVAL_QUEUE_INCONSISTENT",
      "報價審核狀態已被其他操作更新，請重新整理後再試",
      state.quotes.find((record) => record.id === quoteId) || quote,
    ), options);
  }
  if (!applyLocalApprovalState(result, quoteIndex)) {
    return presentLocalApprovalFailure(localApprovalFailure("LOCAL_PERSISTENCE_FAILED", "本機審核結果儲存失敗，原狀態未變", quote), options);
  }
  if (action !== "withdraw") {
    logWorkEvent("status", `報價審核：${workLogRecordTitle("quotes", result.quote)}`, {
      entityType: "quotes",
      entityId: result.quote.id,
      entityName: workLogRecordTitle("quotes", result.quote),
      detail: `${result.event.from_status} → ${result.event.to_status}`,
    });
  }
  if (!options.silent) {
    setToast(action === "withdraw"
      ? "已撤回送審"
      : result.quote?.status === "approved"
        ? "報價已核准"
        : result.quote?.status === "pending_approval"
          ? "報價已送出，等待核准"
          : "報價已退回");
    render();
  }
  return { ...result, quote: normalizeQuoteRecord(result.quote) };
}

async function runLocalQuoteRevision(quoteId, options = {}) {
  const quoteIndex = state.quotes.findIndex((record) => record.id === quoteId);
  const quote = quoteIndex >= 0 ? state.quotes[quoteIndex] : null;
  if (!quote) return presentLocalApprovalFailure(localApprovalFailure("QUOTE_NOT_FOUND", "找不到指定報價"), options);
  const at = String(options.at || new Date().toISOString());
  const newQuoteId = String(options.newQuoteId || id("q"));
  const result = await MaterialsQuoteDomain.createLocalQuoteRevision({
    quote,
    quotes: state.quotes,
    actor: currentApprovalActor(),
    at,
    newQuoteId,
    ownerId: currentUser()?.id || quote.owner_id || "",
    quoteDate: options.quoteDate || dateToday(),
    validUntil: options.validUntil || MaterialsQuoteDomain.addCalendarDays(dateToday(), 7),
    nextFollowUp: options.nextFollowUp || MaterialsQuoteDomain.addCalendarDays(dateToday(), 3),
    history: state.quote_approval_history || [],
    expectedHistoryHead: state.quote_approval_history_head || "",
    eventId: options.eventId || id("qa"),
  });
  if (!result.ok) return presentLocalApprovalFailure(result, options);
  if (!applyLocalApprovalState(result, quoteIndex, [result.revision])) {
    return presentLocalApprovalFailure(localApprovalFailure("LOCAL_PERSISTENCE_FAILED", "本機修訂版儲存失敗，原版本未變", quote), options);
  }
  logRecordChange("quotes", "create", result.revision, `由 ${quote.quote_no} ${quoteRevisionLabel(quote)} 建立 ${quoteRevisionLabel(result.revision)}`);
  if (options.navigate) {
    ui.quoteDraft = null;
    ui.quoteDraftSource = null;
    go(`/quotes/${result.revision.id}/edit`);
  } else if (!options.silent) {
    setToast("已建立新的草稿版本");
    render();
  }
  return {
    ...result,
    original: normalizeQuoteRecord(result.original),
    revision: normalizeQuoteRecord(result.revision),
  };
}

window.QuoteApprovalActions = Object.freeze({
  submit: (quoteId, options = {}) => runLocalQuoteApprovalAction(quoteId, "submit", options),
  approve: (quoteId, options = {}) => runLocalQuoteApprovalAction(quoteId, "approve", options),
  return: (quoteId, options = {}) => runLocalQuoteApprovalAction(quoteId, "return", options),
  withdraw: (quoteId, options = {}) => runLocalQuoteApprovalAction(quoteId, "withdraw", options),
  createRevision: (quoteId, options = {}) => runLocalQuoteRevision(quoteId, options),
});

window.QuoteApprovalSelectors = Object.freeze({
  state: (quoteId) => MaterialsQuoteDomain.selectCanonicalQuoteApprovalState(quoteById(quoteId)),
  pending: () => MaterialsQuoteDomain.selectPendingQuoteApprovals(state.quotes),
  inconsistentPending: () => MaterialsQuoteDomain.selectApprovalQueueInconsistencies(state.quotes),
  history: (quoteOrGroupId = "") => MaterialsQuoteDomain.selectQuoteApprovalHistory(state.quote_approval_history || [], quoteOrGroupId),
  verifyHistory: () => MaterialsQuoteDomain.validateQuoteApprovalHistory(
    state.quote_approval_history || [],
    state.quote_approval_history_head || "",
  ),
});

window.submitQuoteForApproval = (quoteId, options = {}) => window.QuoteApprovalActions.submit(quoteId, options);
window.approveQuote = (quoteId, options = {}) => window.QuoteApprovalActions.approve(quoteId, options);
window.returnQuoteForRevision = (quoteId, reason, options = {}) => window.QuoteApprovalActions.return(quoteId, { ...options, reason });
window.withdrawQuoteSubmission = (quoteId, options = {}) => window.QuoteApprovalActions.withdraw(quoteId, options);

window.setQuoteStatus = function (quoteId, status, reason = "") {
  const quote = quoteById(quoteId);
  if (!quote) return;
  if (status === "pending_approval") return window.QuoteApprovalActions.submit(quoteId);
  if (quote.status === "pending_approval" && ["approved", "sent"].includes(status)) {
    return window.QuoteApprovalActions.approve(quoteId);
  }
  if (quote.status === "pending_approval" && ["returned", "draft"].includes(status)) {
    const returnReason = String(reason || prompt("請輸入退回原因") || "").trim();
    return window.QuoteApprovalActions.return(quoteId, { reason: returnReason });
  }
  const transition = MaterialsQuoteDomain.validateQuoteStatusTransition(quote.status, status, { canApprove: canApproveQuotes() });
  if (!transition.ok) {
    setToast(transition.error);
    return;
  }
  if (status === "lost" && !quote.lost_reason) {
    const reason = prompt("請輸入未成交原因");
    if (!reason) return;
    quote.lost_reason = reason.trim();
  }
  const totals = computeQuote(quote);
  const validation = MaterialsQuoteDomain.validateQuoteForStatus(quote, totals, status, {
    template: templateById(quote.template_id),
    enforceP0: true,
  });
  if (!validation.ok) {
    setToast(validation.errors[0]);
    return;
  }
  const beforeStatus = quote.status;
  quote.status = status;
  quote.status_updated_at = new Date().toISOString();
  quote.status_updated_by = currentUser()?.id || "";
  if (status === "pending_approval") quote.submitted_for_approval_at = quote.status_updated_at;
  if (QUOTE_LOCKED_STATUSES.includes(status) && !quote.document_snapshot) {
    quote.document_snapshot = createQuoteDocumentSnapshot(quote, totals);
  }
  if (status === "sent") quote.sent_at = quote.sent_at || quote.status_updated_at;
  if (status === "won") quote.won_at = quote.status_updated_at;
  if (status === "lost") quote.lost_at = quote.status_updated_at;
  saveState();
  logWorkEvent("status", `更新報價單狀態：${workLogRecordTitle("quotes", quote)}`, {
    entityType: "quotes",
    entityId: quote.id,
    entityName: workLogRecordTitle("quotes", quote),
    detail: `${QUOTE_STATUS_LABEL[beforeStatus] || beforeStatus} → ${QUOTE_STATUS_LABEL[status] || status}`,
  });
  setToast("狀態已更新");
  render();
};

window.createQuoteRevision = function (quoteId) {
  const original = quoteById(quoteId);
  if (!original) return;
  if (original.status === "approved") {
    return window.QuoteApprovalActions.createRevision(quoteId, { navigate: true });
  }
  if (original.is_superseded) {
    setToast("此版本已有後續修訂版，請從最新版本繼續修訂");
    return;
  }
  const groupId = original.revision_group_id || original.id;
  const highestRevision = state.quotes
    .filter((quote) => (quote.revision_group_id || quote.id) === groupId)
    .reduce((max, quote) => Math.max(max, Number(quote.revision_no || 0)), 0);
  const now = new Date().toISOString();
  const revision = normalizeQuoteRecord({
    ...MaterialsQuoteDomain.deepClone(original),
    id: id("q"),
    revision_no: highestRevision + 1,
    revision_group_id: groupId,
    parent_quote_id: original.id,
    quote_date: dateToday(),
    valid_until: MaterialsQuoteDomain.addCalendarDays(dateToday(), 7),
    status: "draft",
    owner_id: currentUser()?.id || original.owner_id || "",
    next_follow_up: MaterialsQuoteDomain.addCalendarDays(dateToday(), 3),
    lost_reason: "",
    sent_at: "",
    won_at: "",
    lost_at: "",
    status_updated_at: "",
    status_updated_by: "",
    document_snapshot: null,
    is_superseded: false,
    superseded_by: "",
    created_at: now,
    updated_at: now,
  });
  original.is_superseded = true;
  original.superseded_by = revision.id;
  state.quotes.push(revision);
  saveState();
  logRecordChange("quotes", "create", revision, `由 ${original.quote_no} ${quoteRevisionLabel(original)} 建立 ${quoteRevisionLabel(revision)}`);
  ui.quoteDraft = null;
  ui.quoteDraftSource = null;
  go(`/quotes/${revision.id}/edit`);
};

const OWNER_BOOTSTRAP_RESTORE_CONFIRMATION = "建立首位老闆並還原";
const DATA_BACKUP_RESTORE_LOCK = "materials-quote-data-backup-restore";
let dataBackupRestoreInProgress = false;

function showBackupDownloadToastWithoutRender(message) {
  if (typeof document === "undefined" || !document.body) return;
  document.querySelector("[data-backup-download-toast]")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.backupDownloadToast = "true";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.clearTimeout(showBackupDownloadToastWithoutRender.timer);
  showBackupDownloadToastWithoutRender.timer = window.setTimeout(() => toast.remove(), 2600);
}

async function downloadBackupBundle(bundle, suffix = "") {
  const date = MaterialsQuoteDomain.formatLocalDate(new Date()).replaceAll("-", "");
  const filename = `materials-quote-backup-${date}${suffix ? `-${suffix}` : ""}.json`;
  let url = "";
  let anchor = null;
  let result = { ok: false, code: "BACKUP_DOWNLOAD_INITIATION_FAILED", filename };
  try {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json;charset=utf-8" });
    url = URL.createObjectURL(blob);
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    result = { ok: true, code: "", status: "initiated", filename };
  } catch (error) {
    result = { ok: false, code: "BACKUP_DOWNLOAD_INITIATION_FAILED", filename };
  } finally {
    let cleanupFailed = false;
    try {
      anchor?.remove();
    } catch (error) {
      cleanupFailed = true;
    }
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        cleanupFailed = true;
      }
    }
    if (cleanupFailed && result.ok) result = { ok: false, code: "BACKUP_DOWNLOAD_CLEANUP_FAILED", filename };
  }
  return result;
}

async function accountsForBackupWithoutWrite(accounts) {
  const secured = [];
  for (const source of Array.isArray(accounts) ? accounts : []) {
    const account = normalizeAccountRecord(source);
    if (!account.password_hash && account.password) account.password_hash = await hashNumericPin(account.password);
    if (!account.password_hash) throw new Error("ACCOUNT_CREDENTIAL_MISSING");
    delete account.password;
    secured.push(account);
  }
  return secured;
}

async function createCurrentBackupBundle(options = {}) {
  const accountSource = Object.prototype.hasOwnProperty.call(options, "accounts")
    ? options.accounts
    : readRestoreAccountsWithoutWrite();
  if (!Array.isArray(accountSource) || !accountSource.length) throw new Error("ACCOUNT_BACKUP_SOURCE_INVALID");
  const accounts = await accountsForBackupWithoutWrite(accountSource);
  let bugReports = options.bugReports;
  if (bugReports === undefined && typeof BugReportStore !== "undefined") {
    const exportedBugReports = await BugReportStore.exportForBackup();
    if (!exportedBugReports.ok) throw new Error(exportedBugReports.code);
    bugReports = exportedBugReports.value;
  }
  return MaterialsQuoteDomain.createBackupBundle({
    state: options.state || state,
    accounts: accounts.map(({ password, ...account }) => account),
    workLogs: options.workLogs || loadWorkLogs(),
    bugReports,
    exportedAt: new Date().toISOString(),
    appVersion: MaterialsQuoteDomain.BACKUP_APP_VERSION,
  });
}

async function restoreSha256Text(value) {
  if (!globalThis.crypto?.subtle) throw new Error("RESTORE_SHA256_UNAVAILABLE");
  const bytes = new TextEncoder().encode(String(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function restoreCanonicalHash(value) {
  return restoreSha256Text(MaterialsQuoteDomain.canonicalStringify(value));
}

async function captureRestoreStorage() {
  const values = Object.keys(localStorage).sort().reduce((snapshot, key) => {
    snapshot[key] = localStorage.getItem(key);
    return snapshot;
  }, {});
  const entries = {};
  for (const [key, value] of Object.entries(values)) {
    const text = String(value ?? "");
    entries[key] = {
      utf8Bytes: new TextEncoder().encode(text).length,
      sha256: await restoreSha256Text(text),
    };
  }
  return { values, entries, fingerprint: await restoreCanonicalHash(entries) };
}

function rollbackRestoreStorage(snapshot) {
  const values = snapshot?.values || {};
  Object.keys(localStorage).filter((key) => !Object.prototype.hasOwnProperty.call(values, key)).forEach((key) => localStorage.removeItem(key));
  Object.entries(values).forEach(([key, value]) => {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
}

function captureRestoreMemory() {
  return {
    state,
    quoteDraft: ui.quoteDraft,
    quoteDraftSavedAt: ui.quoteDraftSavedAt,
    quoteDraftRestored: ui.quoteDraftRestored,
    quoteDraftDirty: ui.quoteDraftDirty,
    quoteCatalogSelections: ui.quoteCatalogSelections,
    quoteCustomSelections: ui.quoteCustomSelections,
    quoteSpecificationSelections: ui.quoteSpecificationSelections,
    quoteLaborDetailFeedback: ui.quoteLaborDetailFeedback,
  };
}

function rollbackRestoreMemory(snapshot) {
  state = snapshot.state;
  ui.quoteDraft = snapshot.quoteDraft;
  ui.quoteDraftSavedAt = snapshot.quoteDraftSavedAt;
  ui.quoteDraftRestored = snapshot.quoteDraftRestored;
  ui.quoteDraftDirty = snapshot.quoteDraftDirty;
  ui.quoteCatalogSelections = snapshot.quoteCatalogSelections;
  ui.quoteCustomSelections = snapshot.quoteCustomSelections;
  ui.quoteSpecificationSelections = snapshot.quoteSpecificationSelections;
  ui.quoteLaborDetailFeedback = snapshot.quoteLaborDetailFeedback;
}

function readRestoreSessionActor() {
  if (localStorage.getItem(AUTH_KEY) !== "yes") return null;
  try {
    const actor = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    return actor && typeof actor === "object" ? actor : null;
  } catch (error) {
    return null;
  }
}

function readRestoreAccountsWithoutWrite() {
  try {
    const records = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "null");
    if (!Array.isArray(records) || !records.length) return [];
    if (records.some((account) => !account?.id || !account?.account || !ACCOUNT_ROLES.includes(account.role))) return [];
    const normalized = records.map(normalizeAccountRecord).filter((account) => account.account);
    return normalized.length === records.length ? normalized : [];
  } catch (error) {
    return [];
  }
}

function readRestoreCurrentActor(accounts, sessionActor = readRestoreSessionActor()) {
  if (!sessionActor || sessionActor.is_active === false) return null;
  const matches = (Array.isArray(accounts) ? accounts : []).filter((account) => (
    account.id === sessionActor.id && account.account === sessionActor.account
  ));
  if (matches.length !== 1) return null;
  const actor = matches[0];
  return actor.is_active !== false && actor.role === sessionActor.role ? actor : null;
}

function readAuthoritativeSyncConfiguration() {
  const source = typeof window.MaterialsQuoteSupabaseRuntime?.getSyncConfiguration === "function"
    ? window.MaterialsQuoteSupabaseRuntime.getSyncConfiguration()
    : window.MaterialsQuoteSupabaseSyncConfig;
  if (!source || typeof source !== "object") return { enabled: false };
  return {
    enabled: source.enabled === true,
    url: String(source.url || ""),
    anonKey: String(source.anonKey || ""),
    organizationId: String(source.organizationId || ""),
    organizationSlug: String(source.organizationSlug || ""),
    expectedPreviousRevision: Number(source.expectedPreviousRevision),
    getAccessToken: typeof source.getAccessToken === "function" ? source.getAccessToken : null,
    fetchImpl: typeof source.fetchImpl === "function" ? source.fetchImpl : undefined,
    authorityContract: source.authorityContract && typeof source.authorityContract === "object"
      ? source.authorityContract
      : window.SupabaseAuthoritativeSync?.DEFAULT_AUTHORITY_CONTRACT,
  };
}

function readAuthoritativeSyncActor() {
  const accounts = readRestoreAccountsWithoutWrite();
  return readRestoreCurrentActor(accounts);
}

const authoritativePushCoordinator = window.SupabaseAuthoritativeSync?.createAuthoritativePushCoordinator({
  domain: window.MaterialsQuoteDomain,
  createBundle: async () => createCurrentBackupBundle({ accounts: readRestoreAccountsWithoutWrite() }),
  readActor: readAuthoritativeSyncActor,
  readConfig: readAuthoritativeSyncConfiguration,
  makeIdempotencyKey: () => window.crypto?.randomUUID?.(),
});

const AUTHORITATIVE_SYNC_STATUS_MESSAGES = Object.freeze({
  SUPABASE_SYNC_DISABLED: "遠端同步未啟用；網站維持本機模式。",
  SUPABASE_SYNC_LOCAL_OWNER_REQUIRED: "只有目前登入且啟用中的老闆可以推送 authoritative 資料。",
  SUPABASE_SYNC_ACTOR_CHANGED: "同步準備期間登入身分已變更，未送出資料。",
  SUPABASE_SYNC_BUNDLE_FAILED: "無法建立唯讀 authoritative snapshot，未送出資料。",
  SUPABASE_SYNC_SELF_BACKUP_REQUIRED: "目前資料未通過網站自產備份驗證，未送出資料。",
  SUPABASE_SYNC_PLAINTEXT_PASSWORD_FORBIDDEN: "帳號資料含明文 PIN，已拒絕同步。",
  SUPABASE_SYNC_SECRET_KEY_FORBIDDEN: "authoritative payload 含禁止的秘密欄位，已拒絕同步。",
  SUPABASE_SYNC_SOURCE_MANIFEST_KEYS_INVALID: "備份 manifest 含缺少或額外欄位，未送出資料。",
  SUPABASE_SYNC_AUTH_TOKEN_INVALID: "需要獨立的 Supabase Auth 登入；本機 PIN 雜湊不可作為存取權杖。",
  SUPABASE_AUTH_TOKEN_INVALID: "需要獨立的 Supabase Auth 登入；本機 PIN 雜湊不可作為存取權杖。",
  SUPABASE_AUTH_TOKEN_UNAVAILABLE: "無法取得這次要求專用的 Supabase Auth 權杖。",
  SUPABASE_RPC_CONFIGURATION_INVALID: "Supabase 公開設定或 Auth 邊界不完整，未送出資料。",
  SUPABASE_RPC_NETWORK_ERROR: "無法確認遠端是否已接收；本次授權已消耗，請停止且不得重試。",
  SUPABASE_RPC_HTTP_401: "Supabase Auth 權杖已失效；本次授權已消耗，未自動重試。",
  SUPABASE_RPC_HTTP_403: "Supabase 拒絕目前 owner 授權；本次授權已消耗，未自動重試。",
  SUPABASE_RPC_HTTP_409: "遠端 revision 或一次性要求衝突；本次授權已消耗，未自動重試。",
  AUTHORITY_CONTRACT_NOT_PROVISIONED: "遠端尚未由部署 migration 登錄這個 revision 的不可變 authoritative contract，已拒絕。",
  AUTHORITY_CONTRACT_MISMATCH: "送出內容與遠端預先登錄的 authoritative contract 不一致，已拒絕。",
  RECORD_HASH_MANIFEST_PAYLOAD_MISMATCH: "逐筆雜湊清單與 authoritative payload 不一致，已拒絕。",
  SOURCE_MANIFEST_KEYS_INVALID: "備份 manifest 含缺少、額外或格式不正確的欄位，已拒絕。",
  REMOTE_NOT_EMPTY_INITIAL_PUSH_REJECTED: "遠端同步區不是空白，首次 authoritative push 已拒絕。",
  ORGANIZATION_MISMATCH: "遠端 organization 與本機設定不一致，已拒絕。",
  OWNER_REQUIRED: "Supabase Auth 身分不是該 organization 的 owner，已拒絕。",
  AUTH_REQUIRED: "Supabase Auth 身分尚未建立或已停用，已拒絕。",
  STALE_REVISION: "遠端 revision 已變更，禁止覆蓋；請由部署流程重新核對。",
  IDEMPOTENCY_KEY_CONFLICT: "一次性同步識別碼已綁定其他要求，已拒絕。",
  IDEMPOTENT_REPLAY_SUPERSEDED: "相同要求曾成功寫入，但遠端已有較新 revision；禁止把舊結果視為目前版本。",
  CANONICAL_ALREADY_CURRENT_DIFFERENT_IDEMPOTENCY_KEY: "相同 authoritative 內容已是遠端目前版本，未重複寫入。",
});

function authoritativeSyncDisplayState() {
  if (!authoritativePushCoordinator) {
    return { mode: "local-only", enabled: false, canPush: false, phase: "error", code: "SUPABASE_SYNC_MODULE_UNAVAILABLE", revision: null, message: "同步模組未載入；網站維持本機模式。" };
  }
  const status = authoritativePushCoordinator.status();
  let message = "遠端同步未啟用；網站維持本機模式。";
  if (status.phase === "pending") message = "正在驗證並送出單向 authoritative push…";
  else if (status.phase === "success") message = `Supabase 已確認接收 revision ${status.revision}；本機資料未被改寫。`;
  else if (status.phase === "error") {
    const safeCode = String(status.code || "SUPABASE_SYNC_REJECTED").replace(/[^A-Z0-9_]/g, "").slice(0, 80);
    message = AUTHORITATIVE_SYNC_STATUS_MESSAGES[safeCode] || `同步已安全拒絕（${safeCode}）。`;
  } else if (status.enabled && !status.canPush) message = "同步已設定，但只有目前登入且啟用中的老闆可以操作。";
  else if (status.enabled) message = "只會由本機單向推送到 Supabase；不會下載、合併或覆蓋本機資料。";
  return { ...status, message };
}

window.getAuthoritativeSyncDisplayState = authoritativeSyncDisplayState;

const SUPABASE_RUNTIME_AUTH_STATUS_MESSAGES = Object.freeze({
  SUPABASE_PUBLIC_CONFIG_MISSING: "Supabase 公開設定尚未提供；目前維持本機模式。",
  SUPABASE_PUBLIC_CONFIG_REQUIRED: "Supabase 公開 project URL、publishable key 與 organization 尚待 09 注入；目前維持本機模式。",
  SUPABASE_AUTH_SIGNED_OUT: "尚未登入 Supabase帳號；這與本機管理員／老闆 PIN 完全分離。",
  SUPABASE_AUTH_OWNER_GATE_REQUIRED: "Supabase帳號 session 已恢復；正式流程前仍須重新驗證 organization owner。",
  SUPABASE_AUTH_OWNER_REQUIRED: "目前 Supabase帳號不是指定 organization 的 owner，正式推送已拒絕。",
  SUPABASE_AUTH_ORGANIZATION_MISMATCH: "Supabase Auth organization 與公開設定不一致，正式推送已拒絕。",
  SUPABASE_AUTH_TOKEN_EXPIRED: "Supabase Auth 權杖已過期或失效，正式推送已拒絕。",
  SUPABASE_AUTH_SESSION_EXPIRED: "Supabase Auth session 已過期且無法安全更新，請重新登入。",
  SUPABASE_AUTH_NETWORK_ERROR: "無法完成 Supabase Auth 要求；未送出 authoritative 資料。",
  SUPABASE_FORMAL_PUSH_CONFIRMATION_REQUIRED: "Supabase owner 已通過唯讀驗證；仍須完成 A–E 並輸入固定確認字串。",
  SUPABASE_FORMAL_PUSH_NOT_AUTHORIZED: "尚未建立本頁一次性正式推送授權。",
  SUPABASE_FORMAL_PUSH_IN_FLIGHT: "唯一正式推送正在進行；禁止平行要求。",
  SUPABASE_FORMAL_PUSH_ALREADY_CONSUMED: "本頁一次性正式推送授權已消耗；不得重試。",
});

function supabaseRuntimeAuthDisplayState() {
  const runtime = window.MaterialsQuoteSupabaseRuntime;
  const status = typeof runtime?.status === "function"
    ? runtime.status()
    : { configured: false, signedIn: false, ownerVerified: false, formalAuthorized: false, phase: "idle", code: "SUPABASE_PUBLIC_CONFIG_MISSING", user: null };
  let message = SUPABASE_RUNTIME_AUTH_STATUS_MESSAGES[status.code]
    || "Supabase Auth 尚未完成正式推送授權；目前維持本機模式。";
  if (status.phase === "in-flight") message = SUPABASE_RUNTIME_AUTH_STATUS_MESSAGES.SUPABASE_FORMAL_PUSH_IN_FLIGHT;
  else if (status.phase === "consumed") message = status.lastPushOk
    ? "唯一正式推送已完成並消耗授權；不得再次提交。"
    : SUPABASE_RUNTIME_AUTH_STATUS_MESSAGES.SUPABASE_FORMAL_PUSH_ALREADY_CONSUMED;
  else if (status.formalAuthorized) message = "A–E 與 Supabase owner 已確認；本頁唯一正式推送已授權，使用後立即失效。";
  else if (status.ownerVerified) message = SUPABASE_RUNTIME_AUTH_STATUS_MESSAGES.SUPABASE_FORMAL_PUSH_CONFIRMATION_REQUIRED;
  return { ...status, message };
}

window.getSupabaseRuntimeAuthDisplayState = supabaseRuntimeAuthDisplayState;

function updateAuthoritativeSyncStatusUi() {
  const status = authoritativeSyncDisplayState();
  const statusElement = document.querySelector("[data-authoritative-sync-status]");
  const button = document.querySelector("[data-authoritative-sync-push]");
  if (statusElement) {
    statusElement.textContent = status.message;
    statusElement.className = `hint ${status.phase === "success" ? "green" : "amber"}`;
  }
  if (button) {
    button.disabled = !status.canPush;
    button.textContent = status.phase === "pending" ? "正在送出…" : "推送已驗證本機資料";
  }
  return status;
}

function refreshSupabaseRuntimeStatusUi() {
  if (typeof window.refreshSupabaseRuntimePanel === "function" && window.refreshSupabaseRuntimePanel()) {
    return supabaseRuntimeAuthDisplayState();
  }
  updateAuthoritativeSyncStatusUi();
  return supabaseRuntimeAuthDisplayState();
}

window.signInSupabaseAccount = async function () {
  const runtime = window.MaterialsQuoteSupabaseRuntime;
  const emailInput = document.querySelector("[data-supabase-auth-email]");
  const passwordInput = document.querySelector("[data-supabase-auth-password]");
  if (!runtime || typeof runtime.signInWithPassword !== "function" || !emailInput || !passwordInput) {
    const result = { ok: false, code: "SUPABASE_AUTH_RUNTIME_UNAVAILABLE" };
    showBackupDownloadToastWithoutRender("Supabase Auth 模組或公開設定尚未就緒；未送出資料。");
    return result;
  }
  const result = await runtime.signInWithPassword(emailInput.value, passwordInput.value);
  passwordInput.value = "";
  const finalStatus = refreshSupabaseRuntimeStatusUi();
  showBackupDownloadToastWithoutRender(finalStatus.message);
  return result;
};

window.signOutSupabaseAccount = async function () {
  const runtime = window.MaterialsQuoteSupabaseRuntime;
  if (!runtime || typeof runtime.signOut !== "function") return { ok: false, code: "SUPABASE_AUTH_RUNTIME_UNAVAILABLE" };
  const result = await runtime.signOut();
  const finalStatus = refreshSupabaseRuntimeStatusUi();
  showBackupDownloadToastWithoutRender(finalStatus.message);
  return result;
};

window.verifySupabaseOwnerMembership = async function () {
  const runtime = window.MaterialsQuoteSupabaseRuntime;
  if (!runtime || typeof runtime.verifyOwnerMembership !== "function") return { ok: false, code: "SUPABASE_AUTH_RUNTIME_UNAVAILABLE" };
  const result = await runtime.verifyOwnerMembership();
  const finalStatus = refreshSupabaseRuntimeStatusUi();
  showBackupDownloadToastWithoutRender(finalStatus.message);
  return result;
};

window.authorizeSupabaseFormalPush = async function () {
  const runtime = window.MaterialsQuoteSupabaseRuntime;
  const confirmationInput = document.querySelector("[data-supabase-formal-confirmation]");
  const artifactGateInput = document.querySelector("[data-supabase-artifact-gates]");
  if (!runtime || typeof runtime.authorizeFormalPushOnce !== "function" || !confirmationInput || !artifactGateInput) {
    return { ok: false, code: "SUPABASE_FORMAL_PUSH_RUNTIME_UNAVAILABLE" };
  }
  const result = await runtime.authorizeFormalPushOnce({
    confirmation: confirmationInput.value,
    artifactGatesAccepted: artifactGateInput.checked === true,
  });
  confirmationInput.value = "";
  artifactGateInput.checked = false;
  const finalStatus = refreshSupabaseRuntimeStatusUi();
  showBackupDownloadToastWithoutRender(finalStatus.message);
  return result;
};

window.addEventListener("materials-quote-supabase-auth-change", () => {
  if (document.querySelector("[data-authoritative-sync-panel]")) refreshSupabaseRuntimeStatusUi();
});

window.pushAuthoritativeSnapshotToSupabase = async function () {
  const initial = authoritativeSyncDisplayState();
  if (!initial.enabled || !initial.canPush) {
    showBackupDownloadToastWithoutRender(initial.message);
    return { ok: false, code: initial.code || "SUPABASE_SYNC_NOT_AVAILABLE" };
  }
  const confirmed = window.confirm("這是單向 push：不會從 Supabase 下載或合併資料。首次 push 只允許遠端同步區為空，任何不一致都會整筆拒絕。確定送出已驗證的本機 authoritative 資料？");
  if (!confirmed) return { ok: false, code: "SUPABASE_SYNC_CANCELLED" };

  const runtime = window.MaterialsQuoteSupabaseRuntime;
  if (!runtime || typeof runtime.executeFormalPush !== "function") {
    return { ok: false, code: "SUPABASE_FORMAL_PUSH_RUNTIME_UNAVAILABLE" };
  }
  const resultPromise = runtime.executeFormalPush(() => authoritativePushCoordinator.push());
  updateAuthoritativeSyncStatusUi();
  const result = await resultPromise;
  const finalStatus = updateAuthoritativeSyncStatusUi();
  showBackupDownloadToastWithoutRender(finalStatus.message);
  return result;
};

function restoreFileIdentity(file) {
  return {
    name: String(file?.name || ""),
    size: Number(file?.size || 0),
    type: String(file?.type || ""),
    lastModified: Number(file?.lastModified || 0),
  };
}

function restoreFileIsStillSelected(input, file, identity) {
  const selected = input.files?.[0];
  return selected === file
    && MaterialsQuoteDomain.canonicalStringify(restoreFileIdentity(selected)) === MaterialsQuoteDomain.canonicalStringify(identity);
}

function normalizedAccountsForRestore(accounts) {
  return (Array.isArray(accounts) ? accounts : []).map((source) => {
    const account = normalizeAccountRecord(source);
    if (account.password_hash) delete account.password;
    return account;
  });
}

function validateRestoreOwnerContinuity({ actor, previousAccounts, restoredAccounts } = {}) {
  const previousOwners = (Array.isArray(previousAccounts) ? previousAccounts : []).filter((account) => account.role === "owner");
  const restoredOwners = (Array.isArray(restoredAccounts) ? restoredAccounts : []).filter((account) => account.role === "owner");
  if (previousOwners.length === 0) {
    return { ok: true, code: "", bootstrapRequired: restoredOwners.length > 0 };
  }
  for (const previousOwner of previousOwners) {
    const restoredOwner = restoredOwners.find((account) => account.id === previousOwner.id && account.account === previousOwner.account);
    if (!restoredOwner
      || restoredOwner.role !== "owner"
      || (previousOwner.is_active !== false && restoredOwner.is_active === false)) {
      return { ok: false, code: "RESTORE_EXISTING_OWNER_PROTECTED", bootstrapRequired: false };
    }
    const comparablePreviousOwner = { ...previousOwner };
    const comparableRestoredOwner = { ...restoredOwner };
    if (comparablePreviousOwner.password_hash) delete comparablePreviousOwner.password;
    if (comparableRestoredOwner.password_hash) delete comparableRestoredOwner.password;
    if (actor?.role !== "owner"
      && MaterialsQuoteDomain.canonicalStringify(comparableRestoredOwner) !== MaterialsQuoteDomain.canonicalStringify(comparablePreviousOwner)) {
      return { ok: false, code: "RESTORE_EXISTING_OWNER_PROTECTED", bootstrapRequired: false };
    }
  }
  const addedOwner = restoredOwners.some((restoredOwner) => !previousOwners.some((previousOwner) => (
    previousOwner.id === restoredOwner.id && previousOwner.account === restoredOwner.account
  )));
  if (addedOwner && actor?.role !== "owner") {
    return { ok: false, code: "RESTORE_EXISTING_OWNER_PROTECTED", bootstrapRequired: false };
  }
  return { ok: true, code: "", bootstrapRequired: false };
}

function evaluateOwnerBootstrapRestoreEligibility({
  validation,
  restoreContext,
  stateValidation,
  bundle,
  restoredState,
  sessionActor,
  previousUser,
  previousAccounts,
  previousAccountsFingerprint,
  restoredAccounts,
} = {}) {
  const reject = (code) => ({ ok: false, code });
  if (validation?.ok !== true
    || validation.channel !== "self_backup"
    || restoreContext?.channel !== "self_backup"
    || restoreContext?.source !== "self_backup") return reject("OWNER_BOOTSTRAP_SELF_BACKUP_REQUIRED");
  if (stateValidation?.ok !== true
    || MaterialsQuoteDomain.canonicalStringify(restoredState) !== MaterialsQuoteDomain.canonicalStringify(bundle?.data?.state)) {
    return reject("OWNER_BOOTSTRAP_STATE_MISMATCH");
  }
  const payloadHash = String(bundle?.manifest?.canonical_payload?.sha256 || "");
  if (!/^[a-f0-9]{64}$/i.test(payloadHash)) return reject("OWNER_BOOTSTRAP_PAYLOAD_HASH_REQUIRED");
  if (!previousUser || !sessionActor) return reject("OWNER_BOOTSTRAP_ACTOR_REQUIRED");
  const actorMatches = previousAccounts.filter((account) => account.id === previousUser.id);
  if (actorMatches.length !== 1) return reject("OWNER_BOOTSTRAP_ACTOR_NOT_UNIQUE");
  const actorRecord = actorMatches[0];
  if (actorRecord.is_active === false
    || actorRecord.role !== "admin"
    || previousUser.id !== actorRecord.id
    || previousUser.account !== actorRecord.account
    || previousUser.role !== actorRecord.role
    || sessionActor.id !== actorRecord.id
    || sessionActor.account !== actorRecord.account
    || sessionActor.role !== actorRecord.role) return reject("ACTOR_NOT_CURRENT_ACTIVE_ACCOUNT");
  if (!hasAccountPermission(actorRecord, "edit_company_settings")) return reject("OWNER_BOOTSTRAP_COMPANY_PERMISSION_REQUIRED");
  if (previousAccounts.filter((account) => account.role === "owner").length !== 0) return reject("OWNER_BOOTSTRAP_EXISTING_OWNER_RECORD");
  if (restoredAccounts.some((account) => !ACCOUNT_ROLES.includes(account.role) || !account.password_hash)) {
    return reject("OWNER_BOOTSTRAP_RESTORED_ACCOUNT_INVALID");
  }
  const restoredOwners = restoredAccounts.filter((account) => account.role === "owner");
  if (restoredOwners.length !== 1) return reject("OWNER_BOOTSTRAP_OWNER_COUNT_INVALID");
  const targetOwner = restoredOwners[0];
  if (targetOwner.id !== actorRecord.id
    || targetOwner.account !== actorRecord.account
    || targetOwner.is_active === false
    || !hasAccountPermission(targetOwner, "manage_accounts")
    || !hasAccountPermission(targetOwner, "edit_company_settings")) return reject("OWNER_BOOTSTRAP_OWNER_MISMATCH");
  const restoredActorMatches = restoredAccounts.filter((account) => account.id === actorRecord.id && account.account === actorRecord.account);
  if (restoredActorMatches.length !== 1 || restoredActorMatches[0].role !== "owner") return reject("OWNER_BOOTSTRAP_ACTOR_MAPPING_INVALID");
  if (!restoredAccounts.some((account) => ["owner", "admin"].includes(account.role) && account.is_active !== false)) {
    return reject("OWNER_BOOTSTRAP_ACTIVE_MANAGER_REQUIRED");
  }
  return {
    ok: true,
    code: "",
    actorRecord,
    targetOwner,
    payloadHash,
    previousAccountsFingerprint,
    previousOwnerCount: 0,
    nextOwnerCount: 1,
  };
}

function maskRestoreAccount(account) {
  const value = String(account || "");
  if (value.length <= 1) return "＊";
  if (value.length === 2) return `${value[0]}＊`;
  return `${value[0]}${"＊".repeat(Math.min(6, value.length - 2))}${value.at(-1)}`;
}

function confirmOwnerBootstrapRestore(eligibility, { bundle, file } = {}) {
  return new Promise((resolve) => {
    const actor = eligibility.actorRecord;
    const owner = eligibility.targetOwner;
    const backdrop = document.createElement("div");
    backdrop.className = "approval-dialog-backdrop owner-bootstrap-restore-backdrop";
    backdrop.dataset.ownerBootstrapRestoreDialog = "true";
    backdrop.innerHTML = `
      <section class="approval-dialog owner-bootstrap-restore-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-bootstrap-restore-title">
        <div class="approval-dialog-head">
          <div>
            <div class="approval-dialog-kicker">一次性最高權限還原</div>
            <h2 id="owner-bootstrap-restore-title">高權限警告：將以備份建立首位老闆</h2>
          </div>
        </div>
        <form class="owner-bootstrap-restore-form" novalidate>
          <div class="approval-dialog-body">
            <p class="owner-bootstrap-restore-warning">此瀏覽器目前沒有老闆帳號。你正以啟用中的管理員「${h(actor.name)}」操作。繼續後，已驗證網站自產備份中的同一帳號將成為唯一首位老闆，並以備份內容取代本瀏覽器的帳號、權限及全部營運資料。這是一次性最高權限建立流程。程式會先下載匯入前安全備份；若安全備份或任何寫入失敗，所有資料必須保持原狀。請確認你信任此備份，並立即設定新的老闆 PIN。</p>
            <dl class="owner-bootstrap-restore-facts">
              <div><dt>目前管理員</dt><dd>${h(actor.name)}／${h(maskRestoreAccount(actor.account))}<br><code>${h(actor.id)}</code></dd></div>
              <div><dt>還原後唯一老闆</dt><dd>${h(owner.name)}／${h(maskRestoreAccount(owner.account))}<br><code>${h(owner.id)}</code></dd></div>
              <div><dt>備份檔</dt><dd>${h(file.name)}</dd></div>
              <div><dt>版本／資料格式</dt><dd>${h(bundle.app_version)}／schema ${h(bundle.manifest.state_schema_version)}</dd></div>
              <div><dt>匯出時間</dt><dd>${h(bundle.exported_at)}</dd></div>
              <div><dt>Payload SHA-256 末 12 碼</dt><dd><code>${h(eligibility.payloadHash.slice(-12))}</code></dd></div>
              <div><dt>老闆帳號數</dt><dd>目前 0／還原後 1</dd></div>
            </dl>
            <p class="owner-bootstrap-restore-danger">老闆是最高權限。還原會替換帳號、角色、權限與 PIN hash；新老闆 PIN 將取代目前及備份中的 PIN。安全備份下載失敗時不會寫入任何資料。</p>
            <label class="field"><span>目前管理員 PIN</span><input class="input" type="password" inputmode="numeric" autocomplete="current-password" name="current_pin" minlength="3" maxlength="20" required></label>
            <label class="field"><span>新的老闆 PIN</span><input class="input" type="password" inputmode="numeric" autocomplete="new-password" name="new_owner_pin" minlength="3" maxlength="20" required></label>
            <label class="field"><span>再次輸入新的老闆 PIN</span><input class="input" type="password" inputmode="numeric" autocomplete="new-password" name="confirm_owner_pin" minlength="3" maxlength="20" required></label>
            <label class="field"><span>手動輸入「${OWNER_BOOTSTRAP_RESTORE_CONFIRMATION}」</span><input class="input" type="text" autocomplete="off" name="confirmation_phrase" required></label>
            <div class="approval-error" role="alert" hidden></div>
          </div>
          <div class="approval-dialog-actions">
            <button class="btn secondary" type="button" data-owner-bootstrap-cancel>取消</button>
            <button class="btn danger" type="button" data-owner-bootstrap-confirm>確認建立首位老闆並還原</button>
          </div>
        </form>
      </section>`;
    document.body.appendChild(backdrop);
    const form = backdrop.querySelector("form");
    const cancelButton = backdrop.querySelector("[data-owner-bootstrap-cancel]");
    const confirmButton = backdrop.querySelector("[data-owner-bootstrap-confirm]");
    const errorBox = backdrop.querySelector(".approval-error");
    let settled = false;
    const clearPinInputs = () => {
      ["current_pin", "new_owner_pin", "confirm_owner_pin"].forEach((name) => {
        const input = form.elements.namedItem(name);
        if (input) input.value = "";
      });
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearPinInputs();
      const phraseInput = form.elements.namedItem("confirmation_phrase");
      if (phraseInput) phraseInput.value = "";
      backdrop.remove();
      resolve(result);
    };
    const showError = (message) => {
      errorBox.textContent = message;
      errorBox.hidden = false;
      confirmButton.disabled = false;
      clearPinInputs();
      form.elements.namedItem("current_pin")?.focus();
    };
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("keydown", (event) => {
      if (event.key === "Enter") event.preventDefault();
      if (event.key === "Escape") {
        event.preventDefault();
        finish({ confirmed: false, code: "OWNER_BOOTSTRAP_CANCELLED" });
      }
    });
    cancelButton.addEventListener("click", () => finish({ confirmed: false, code: "OWNER_BOOTSTRAP_CANCELLED" }));
    confirmButton.addEventListener("click", async () => {
      confirmButton.disabled = true;
      errorBox.hidden = true;
      const currentPin = String(form.elements.namedItem("current_pin")?.value || "");
      const newPin = String(form.elements.namedItem("new_owner_pin")?.value || "");
      const repeatedPin = String(form.elements.namedItem("confirm_owner_pin")?.value || "");
      const confirmationPhrase = String(form.elements.namedItem("confirmation_phrase")?.value || "");
      try {
        if (confirmationPhrase !== OWNER_BOOTSTRAP_RESTORE_CONFIRMATION) {
          showError(`請完整輸入「${OWNER_BOOTSTRAP_RESTORE_CONFIRMATION}」`);
          return;
        }
        if (!(await verifyAccountPassword(actor, currentPin))) {
          showError("目前管理員 PIN 驗證失敗");
          return;
        }
        if (!MaterialsQuoteDomain.isNumericCredential(newPin)) {
          showError("新的老闆 PIN 必須是 3 至 20 位數字");
          return;
        }
        if (newPin !== repeatedPin) {
          showError("兩次輸入的新老闆 PIN 不一致");
          return;
        }
        const currentPinHash = await hashNumericPin(currentPin);
        const newPinHash = await hashNumericPin(newPin);
        if (newPinHash === currentPinHash || newPinHash === owner.password_hash) {
          showError("新的老闆 PIN 必須不同於目前及備份中的 PIN");
          return;
        }
        finish({
          confirmed: true,
          code: "",
          newPinHash,
          confirmedAt: new Date().toISOString(),
          method: "目前PIN驗證＋新PIN雙次＋固定確認字串",
        });
      } catch (error) {
        showError("高權限確認失敗，請重新輸入");
      }
    });
    window.requestAnimationFrame(() => cancelButton.focus());
  });
}

function applyAuthorizedOwnerPinRotation(restoredAccounts, actorId, newPinHash) {
  return normalizedAccountsForRestore(restoredAccounts).map((account) => {
    if (account.id !== actorId) return account;
    const rotated = { ...account, password_hash: newPinHash };
    delete rotated.password;
    return rotated;
  });
}

async function rollbackFailedRestore({ storageSnapshot, memorySnapshot, safetyBugReports, previousUser }) {
  const failures = [];
  if (safetyBugReports !== undefined && typeof BugReportStore !== "undefined") {
    try {
      const bugRollback = await BugReportStore.importFromBackup(safetyBugReports, previousUser);
      if (!bugRollback.ok) failures.push(bugRollback.code || "BUG_ROLLBACK_FAILED");
    } catch (error) {
      failures.push("BUG_ROLLBACK_FAILED");
    }
  }
  try {
    rollbackRestoreStorage(storageSnapshot);
  } catch (error) {
    failures.push("STORAGE_ROLLBACK_FAILED");
  }
  rollbackRestoreMemory(memorySnapshot);
  try {
    const currentStorage = await captureRestoreStorage();
    if (currentStorage.fingerprint !== storageSnapshot.fingerprint) failures.push("STORAGE_ROLLBACK_MISMATCH");
  } catch (error) {
    failures.push("STORAGE_ROLLBACK_UNVERIFIED");
  }
  if (safetyBugReports !== undefined && typeof BugReportStore !== "undefined") {
    try {
      const currentBugReports = await BugReportStore.exportForBackup();
      if (!currentBugReports.ok
        || MaterialsQuoteDomain.canonicalStringify(currentBugReports.value) !== MaterialsQuoteDomain.canonicalStringify(safetyBugReports)) {
        failures.push("BUG_ROLLBACK_MISMATCH");
      }
    } catch (error) {
      failures.push("BUG_ROLLBACK_UNVERIFIED");
    }
  }
  return { ok: failures.length === 0, failures };
}

async function validateRestorePostCommit({
  bundle,
  restoredState,
  restoredAccounts,
  restoredUser,
  auditEntry,
  ownerBootstrapExpectation,
} = {}) {
  const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (MaterialsQuoteDomain.canonicalStringify(storedState) !== MaterialsQuoteDomain.canonicalStringify(restoredState)) {
    throw new Error("RESTORE_STATE_POSTCHECK_FAILED");
  }
  const storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  if (MaterialsQuoteDomain.canonicalStringify(storedAccounts) !== MaterialsQuoteDomain.canonicalStringify(restoredAccounts)) {
    throw new Error("RESTORE_ACCOUNTS_POSTCHECK_FAILED");
  }
  const logs = JSON.parse(localStorage.getItem(WORK_LOGS_KEY) || "[]");
  const expectedLogCount = Math.min(WORK_LOG_LIMIT, bundle.data.work_logs.length + 1);
  if (logs.length !== expectedLogCount || !logs.some((entry) => entry.id === auditEntry?.id && entry.action === "restore")) {
    throw new Error("RESTORE_AUDIT_POSTCHECK_FAILED");
  }
  if (restoredUser && restoredUser.is_active !== false) {
    const session = readRestoreSessionActor();
    if (!session
      || session.id !== restoredUser.id
      || session.account !== restoredUser.account
      || session.role !== restoredUser.role) throw new Error("RESTORE_SESSION_POSTCHECK_FAILED");
  } else if (localStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_USER_KEY)) {
    throw new Error("RESTORE_SESSION_CLEAR_FAILED");
  }
  if (Object.keys(localStorage).some((key) => key === QUOTE_DRAFT_KEY || key.startsWith(`${QUOTE_DRAFT_KEY}:`))) {
    throw new Error("RESTORE_DRAFT_CLEAR_FAILED");
  }
  if (bundle.data.bug_reports !== undefined && typeof BugReportStore !== "undefined") {
    const restoredBugReports = await BugReportStore.exportForBackup();
    if (!restoredBugReports.ok
      || MaterialsQuoteDomain.canonicalStringify(restoredBugReports.value) !== MaterialsQuoteDomain.canonicalStringify(bundle.data.bug_reports)) {
      throw new Error("RESTORE_BUG_REPORT_POSTCHECK_FAILED");
    }
  }
  if (Object.keys(localStorage).some((key) => /bootstrap|restore.*author/i.test(key))) {
    throw new Error("RESTORE_AUTHORIZATION_PERSISTED");
  }
  if (ownerBootstrapExpectation) {
    const owners = storedAccounts.filter((account) => account.role === "owner");
    if (owners.length !== 1
      || owners[0].id !== ownerBootstrapExpectation.ownerId
      || owners[0].account !== ownerBootstrapExpectation.ownerAccount
      || owners[0].is_active === false) throw new Error("OWNER_BOOTSTRAP_POSTCHECK_FAILED");
  }
}

window.exportDataBackup = async function (suffix = "") {
  const accounts = readRestoreAccountsWithoutWrite();
  const actor = readRestoreCurrentActor(accounts);
  if (!actor || !hasAccountPermission(actor, "edit_company_settings")) {
    showBackupDownloadToastWithoutRender("只有具備公司設定權限的人員可以下載完整備份");
    return null;
  }
  let bundle;
  try {
    bundle = await createCurrentBackupBundle({ accounts });
  } catch (error) {
    showBackupDownloadToastWithoutRender(`備份未建立：${error instanceof Error ? error.message : "資料驗證失敗"}`);
    return null;
  }
  const downloadResult = await downloadBackupBundle(bundle, suffix);
  if (!downloadResult.ok) {
    showBackupDownloadToastWithoutRender("備份下載要求失敗，未建立下載");
    return null;
  }
  showBackupDownloadToastWithoutRender("已送出下載要求，請確認瀏覽器下載清單");
  return bundle;
};

window.importDataBackup = async function (event) {
  const input = event.currentTarget;
  if (dataBackupRestoreInProgress) {
    setToast("另一個備份還原流程仍在進行，請稍後再試");
    input.value = "";
    return { ok: false, code: "RESTORE_ALREADY_IN_PROGRESS" };
  }
  const initialRestoreAccounts = readRestoreAccountsWithoutWrite();
  const initialRestoreActor = readRestoreCurrentActor(initialRestoreAccounts);
  if (!initialRestoreActor || !hasAccountPermission(initialRestoreActor, "edit_company_settings")) {
    setToast("只有具備公司設定權限的人員可以還原完整備份");
    input.value = "";
    return { ok: false, code: "RESTORE_PERMISSION_DENIED" };
  }
  const file = input.files?.[0];
  if (!file) return { ok: false, code: "RESTORE_FILE_REQUIRED" };
  if (!navigator.locks?.request) {
    setToast("目前瀏覽器不支援安全還原鎖，已拒絕還原");
    input.value = "";
    return { ok: false, code: "RESTORE_LOCK_UNAVAILABLE" };
  }
  let releaseBrowserRestoreLock = null;
  let browserRestoreLockTask = null;
  let browserRestoreLockAcquired = false;
  try {
    browserRestoreLockAcquired = await new Promise((resolve, reject) => {
      browserRestoreLockTask = navigator.locks.request(DATA_BACKUP_RESTORE_LOCK, { mode: "exclusive", ifAvailable: true }, async (lock) => {
        if (!lock) {
          resolve(false);
          return;
        }
        await new Promise((release) => {
          releaseBrowserRestoreLock = release;
          resolve(true);
        });
      }).catch(reject);
    });
  } catch (error) {
    setToast("無法取得安全還原鎖，已拒絕還原");
    input.value = "";
    return { ok: false, code: "RESTORE_LOCK_FAILED" };
  }
  if (!browserRestoreLockAcquired) {
    setToast("另一個備份還原流程仍在進行，請稍後再試");
    input.value = "";
    return { ok: false, code: "RESTORE_ALREADY_IN_PROGRESS" };
  }
  const selectedFileIdentity = restoreFileIdentity(file);
  dataBackupRestoreInProgress = true;
  let bootstrapConfirmed = false;
  try {
    let bundle = null;
    try {
      bundle = JSON.parse(await file.text());
    } catch (error) {
      setToast("備份檔不是有效的 JSON 格式");
      return { ok: false, code: "RESTORE_JSON_INVALID" };
    }
    const validation = await MaterialsQuoteDomain.validateBackupBundle(bundle);
    if (!validation.ok) {
      setToast(validation.error);
      return { ok: false, code: "RESTORE_BUNDLE_INVALID" };
    }
    const restoreContext = validation.restoreContext || { channel: "external", source: "external_import", trustExistingHistoricalData: false };
    const stateValidation = MaterialsQuoteDomain.validateAppStateForImport(bundle.data.state, restoreContext);
    if (!stateValidation.ok) {
      setToast(`備份未匯入：${stateValidation.errors[0]}`);
      return { ok: false, code: "RESTORE_STATE_INVALID" };
    }
    let restoredState;
    try {
      restoredState = normalizeAppState(bundle.data.state, restoreContext);
    } catch (error) {
      setToast(`備份未匯入：${error instanceof Error ? error.message : "資料遷移失敗"}`);
      return { ok: false, code: "RESTORE_STATE_MIGRATION_FAILED" };
    }
    const invalidMaterial = restoredState.materials.find((material) => !MaterialsQuoteDomain.validateMaterialForPersistence(material).ok);
    if (invalidMaterial) {
      setToast(`備份中的材料「${invalidMaterial.name || invalidMaterial.id || "未命名"}」含無效公式或價格來源，已取消還原`);
      return { ok: false, code: "RESTORE_MATERIAL_INVALID" };
    }
    let importQuoteError = "";
    if (validation.channel === "self_backup") {
      if (MaterialsQuoteDomain.canonicalStringify(restoredState) !== MaterialsQuoteDomain.canonicalStringify(bundle.data.state)) {
        const mismatch = Object.keys({ ...bundle.data.state, ...restoredState }).sort().find((key) => (
          MaterialsQuoteDomain.canonicalStringify(restoredState[key]) !== MaterialsQuoteDomain.canonicalStringify(bundle.data.state[key])
        ));
        let mismatchDetail = mismatch || "";
        if (mismatch && Array.isArray(restoredState[mismatch]) && Array.isArray(bundle.data.state[mismatch])) {
          const index = restoredState[mismatch].findIndex((record, recordIndex) => (
            MaterialsQuoteDomain.canonicalStringify(record) !== MaterialsQuoteDomain.canonicalStringify(bundle.data.state[mismatch][recordIndex])
          ));
          if (index >= 0) {
            const restoredRecord = restoredState[mismatch][index] || {};
            const sourceRecord = bundle.data.state[mismatch][index] || {};
            const field = Object.keys({ ...sourceRecord, ...restoredRecord }).sort().find((key) => (
              MaterialsQuoteDomain.canonicalStringify(restoredRecord[key]) !== MaterialsQuoteDomain.canonicalStringify(sourceRecord[key])
            ));
            mismatchDetail = `${mismatch}[${index}]${field ? `.${field}` : ""}`;
          }
        }
        importQuoteError = `自產備份還原結果與 canonical payload 不一致${mismatchDetail ? `（${mismatchDetail}）` : ""}`;
      }
    } else {
      restoredState.quotes = restoredState.quotes.map((quote) => {
        if (quoteIsLocked(quote)) return quote;
        const sanitized = MaterialsQuoteDomain.sanitizeQuoteForPersistence(quote, quote, restoredState.materials, {
          canEditPricing: true,
          allowStatusSanitize: true,
          trustProtectedFields: false,
          allowVerifiedCatalogMappings: true,
        });
        if (sanitized.validationErrors.length && !importQuoteError) importQuoteError = sanitized.validationErrors[0];
        return normalizeQuoteRecord(sanitized.quote, restoredState.materials);
      });
    }
    if (importQuoteError) {
      setToast(`備份未匯入：${importQuoteError}`);
      return { ok: false, code: "RESTORE_CANONICAL_STATE_MISMATCH" };
    }
    if (!confirm(`還原會以${validation.channel === "self_backup" ? "已驗證的網站自產備份" : "外部匯入內容"}取代目前瀏覽器內的全部資料，確定繼續嗎？`)) {
      return { ok: false, code: "RESTORE_CANCELLED" };
    }
    if (!Array.isArray(bundle.data.accounts) || bundle.data.accounts.some((account) => !ACCOUNT_ROLES.includes(account?.role))) {
      setToast("備份帳號角色無效，還原已拒絕");
      return { ok: false, code: "RESTORE_ACCOUNT_ROLE_INVALID" };
    }
    const previousSessionActor = readRestoreSessionActor();
    const previousAccounts = readRestoreAccountsWithoutWrite();
    const previousUser = readRestoreCurrentActor(previousAccounts, previousSessionActor);
    const previousAccountsFingerprint = await restoreCanonicalHash(previousAccounts);
    let restoredAccounts = normalizedAccountsForRestore(bundle.data.accounts);
    let accountGuard = validateAccountMutation({
      actor: previousUser,
      previousAccounts,
      nextAccounts: restoredAccounts,
      targetId: previousUser?.id || "",
      bootstrapConfirmed: false,
    });
    let eligibility = null;
    let approval = null;
    const ownerContinuity = validateRestoreOwnerContinuity({
      actor: previousUser,
      previousAccounts,
      restoredAccounts,
    });
    if (!ownerContinuity.ok) {
      setToast("備份包含未授權的既有老闆異動，還原已拒絕");
      return { ok: false, code: ownerContinuity.code };
    }
    if (ownerContinuity.bootstrapRequired) {
      if (accountGuard.ok || accountGuard.code !== "OWNER_BOOTSTRAP_REQUIRED") {
        setToast("備份中的首位老闆不是目前登入的管理員，還原已拒絕");
        return { ok: false, code: "OWNER_BOOTSTRAP_GUARD_MISMATCH" };
      }
      eligibility = evaluateOwnerBootstrapRestoreEligibility({
        validation,
        restoreContext,
        stateValidation,
        bundle,
        restoredState,
        sessionActor: previousSessionActor,
        previousUser,
        previousAccounts,
        previousAccountsFingerprint,
        restoredAccounts,
      });
      if (!eligibility.ok) {
        setToast("此備份不符合建立首位老闆的安全條件，還原已拒絕");
        return { ok: false, code: eligibility.code };
      }
      approval = await confirmOwnerBootstrapRestore(eligibility, { bundle, file });
      bootstrapConfirmed = approval.confirmed === true;
      if (!bootstrapConfirmed) return { ok: false, code: approval.code || "OWNER_BOOTSTRAP_CANCELLED" };
      restoredAccounts = applyAuthorizedOwnerPinRotation(restoredAccounts, previousUser.id, approval.newPinHash);
    } else if (!accountGuard.ok) {
      if (accountGuard.code === "OWNER_BOOTSTRAP_REQUIRED") {
        setToast("帳號變更要求不適用的首位老闆授權，還原已拒絕");
        return { ok: false, code: "OWNER_BOOTSTRAP_UNEXPECTED" };
      } else {
        setToast("備份包含未授權的帳號或角色變更，還原已拒絕");
        return { ok: false, code: accountGuard.code || "RESTORE_ACCOUNT_GUARD_REJECTED" };
      }
    }

    const recheckRestoreBindings = async () => {
      if (!restoreFileIsStillSelected(input, file, selectedFileIdentity)) return { ok: false, code: "RESTORE_FILE_CHANGED" };
      const revalidation = await MaterialsQuoteDomain.validateBackupBundle(bundle);
      if (!revalidation.ok
        || revalidation.channel !== validation.channel
        || String(bundle.manifest?.canonical_payload?.sha256 || "") !== String(eligibility?.payloadHash || bundle.manifest?.canonical_payload?.sha256 || "")) {
        return { ok: false, code: "RESTORE_PAYLOAD_CHANGED" };
      }
      const currentSessionActor = readRestoreSessionActor();
      const currentAccounts = readRestoreAccountsWithoutWrite();
      const currentActor = readRestoreCurrentActor(currentAccounts, currentSessionActor);
      if ((await restoreCanonicalHash(currentAccounts)) !== previousAccountsFingerprint) return { ok: false, code: "ACCOUNT_STATE_CHANGED" };
      if (!currentActor
        || currentActor.id !== previousUser?.id
        || currentActor.account !== previousUser?.account
        || currentActor.role !== previousUser?.role
        || currentSessionActor?.id !== previousSessionActor?.id
        || currentSessionActor?.account !== previousSessionActor?.account
        || currentSessionActor?.role !== previousSessionActor?.role) return { ok: false, code: "ACTOR_STATE_CHANGED" };
      if (bootstrapConfirmed) {
        const repeatedEligibility = evaluateOwnerBootstrapRestoreEligibility({
          validation: revalidation,
          restoreContext: revalidation.restoreContext,
          stateValidation,
          bundle,
          restoredState,
          sessionActor: currentSessionActor,
          previousUser: currentActor,
          previousAccounts: currentAccounts,
          previousAccountsFingerprint,
          restoredAccounts: normalizedAccountsForRestore(bundle.data.accounts),
        });
        if (!repeatedEligibility.ok
          || repeatedEligibility.actorRecord.id !== eligibility.actorRecord.id
          || repeatedEligibility.targetOwner.id !== eligibility.targetOwner.id
          || repeatedEligibility.payloadHash !== eligibility.payloadHash) return { ok: false, code: repeatedEligibility.code || "OWNER_BOOTSTRAP_BINDING_CHANGED" };
      }
      return { ok: true, code: "", currentActor, currentAccounts };
    };

    let bindingCheck = await recheckRestoreBindings();
    if (!bindingCheck.ok) {
      setToast("確認期間帳號、登入狀態、備份檔或 payload 已變更，請重新開始還原");
      return bindingCheck;
    }
    const memorySnapshot = captureRestoreMemory();
    const storageSnapshot = await captureRestoreStorage();
    let safetyBundle;
    try {
      safetyBundle = await createCurrentBackupBundle({
        state: memorySnapshot.state,
        accounts: previousAccounts,
        workLogs: loadWorkLogs(),
      });
      const safetyDownload = await downloadBackupBundle(safetyBundle, "before-import");
      if (!safetyDownload.ok) throw new Error(safetyDownload.code);
    } catch (error) {
      const unchanged = (await captureRestoreStorage()).fingerprint === storageSnapshot.fingerprint;
      setToast(unchanged ? "匯入前安全備份未能下載，未寫入任何資料" : "嚴重錯誤：安全備份失敗且目前資料已發生變化");
      return { ok: false, code: unchanged ? "RESTORE_SAFETY_BACKUP_FAILED" : "RESTORE_SAFETY_BACKUP_STATE_CHANGED" };
    }
    if ((await captureRestoreStorage()).fingerprint !== storageSnapshot.fingerprint) {
      setToast("安全備份下載期間資料已變更，未執行還原；請重新選擇備份檔");
      return { ok: false, code: "RESTORE_STORAGE_STATE_CHANGED" };
    }
    bindingCheck = await recheckRestoreBindings();
    if (!bindingCheck.ok) {
      setToast("安全備份後帳號、登入狀態、備份檔或 payload 已變更，未執行還原");
      return bindingCheck;
    }
    accountGuard = validateAccountMutation({
      actor: previousUser,
      previousAccounts,
      nextAccounts: restoredAccounts,
      targetId: previousUser?.id || "",
      bootstrapConfirmed,
    });
    if (!accountGuard.ok) {
      setToast("備份帳號未通過最終安全檢查，未執行還原");
      return { ok: false, code: accountGuard.code || "RESTORE_FINAL_ACCOUNT_GUARD_REJECTED" };
    }
    const restoredUser = previousUser
      ? restoredAccounts.find((account) => account.id === previousUser.id && account.account === previousUser.account)
        || (!bootstrapConfirmed ? restoredAccounts.find((account) => account.account === previousUser.account) : null)
      : null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredState));
      if (!saveAccounts(restoredAccounts, {
        actor: previousUser,
        previousAccounts,
        targetId: previousUser?.id || "",
        bootstrapConfirmed,
      })) throw new Error("ACCOUNT_GUARD_REJECTED");
      saveWorkLogs(bundle.data.work_logs);
      if (bundle.data.bug_reports !== undefined) {
        if (typeof BugReportStore === "undefined") throw new Error("BUG_REPORT_STORE_UNAVAILABLE");
        const restoredBugReports = await BugReportStore.importFromBackup(bundle.data.bug_reports, previousUser);
        if (!restoredBugReports.ok) throw new Error(restoredBugReports.code);
      }
      state = restoredState;
      if (restoredUser?.is_active) setAuthSession(restoredUser);
      else clearAuthSession();
      clearAllStoredQuoteDrafts();
      const auditEntry = bootstrapConfirmed
        ? logWorkEvent("restore", "還原完整資料備份（建立首位老闆）", {
          actor: previousUser,
          entityType: "settings",
          entityId: restoredUser?.id || "",
          entityName: restoredUser?.name || "",
          detail: [
            "owner_bootstrap=true",
            `來源檔案：${file.name}`,
            `備份 schema：${bundle.schema}`,
            `app version：${bundle.app_version}`,
            `canonical payload SHA-256：${eligibility.payloadHash}`,
            `actor ID：${previousUser.id}（admin）`,
            `target owner ID：${restoredUser.id}（owner）`,
            "previous_owner_count=0",
            "next_owner_count=1",
            `二次確認：${approval.confirmedAt}／${approval.method}`,
            "pin_rotated=true",
            "before_import_backup_triggered=true",
          ].join("；"),
        })
        : logWorkEvent("restore", "還原完整資料備份", {
          actor: previousUser,
          entityType: "settings",
          detail: `來源檔案：${file.name}`,
        });
      await validateRestorePostCommit({
        bundle,
        restoredState,
        restoredAccounts,
        restoredUser,
        auditEntry,
        ownerBootstrapExpectation: eligibility ? {
          ownerId: eligibility.targetOwner.id,
          ownerAccount: eligibility.targetOwner.account,
        } : null,
      });
    } catch (error) {
      const rollback = await rollbackFailedRestore({
        storageSnapshot,
        memorySnapshot,
        safetyBugReports: safetyBundle.data.bug_reports,
        previousUser,
      });
      if (!rollback.ok) {
        console.error("RESTORE_ROLLBACK_INTEGRITY_FAILURE", rollback.failures);
        setToast("嚴重錯誤：備份還原失敗，且原資料完整性無法確認；請停止操作並保留匯入前安全備份");
        return { ok: false, code: "RESTORE_ROLLBACK_INTEGRITY_FAILURE" };
      }
      setToast(`備份還原失敗，原資料已完整復原：${error instanceof Error ? error.message : "寫入失敗"}`);
      return { ok: false, code: "RESTORE_COMMIT_FAILED" };
    }
    go(restoredUser?.is_active ? "/dashboard" : "/login");
    setToast("備份已還原");
    return { ok: true, code: "" };
  } finally {
    bootstrapConfirmed = false;
    dataBackupRestoreInProgress = false;
    input.value = "";
    if (releaseBrowserRestoreLock) releaseBrowserRestoreLock();
    if (browserRestoreLockTask) await browserRestoreLockTask.catch(() => undefined);
  }
};

window.saveSettings = function (event) {
  event.preventDefault();
  if (!requirePermission("edit_company_settings")) return;
  const form = new FormData(event.currentTarget);
  const taxValidation = MaterialsQuoteDomain.validateQuoteNumericPolicy({ discount_amount: 0, tax_rate: form.get("defaultTaxRate"), sections: [] });
  if (!taxValidation.ok) {
    setToast(taxValidation.errors[0]);
    return;
  }
  const before = { ...state.company };
  state.company = {
    ...state.company,
    name: form.get("name"),
    englishName: form.get("englishName"),
    taxId: form.get("taxId"),
    defaultTaxRate: Number(form.get("defaultTaxRate")),
    email: form.get("email"),
    phone: form.get("phone"),
    fax: form.get("fax"),
    address: form.get("address"),
    managerName: form.get("managerName"),
    preparerName: form.get("preparerName"),
    formCode: form.get("formCode"),
    bankInfo: form.get("bankInfo"),
    defaultTerms: form.get("defaultTerms"),
  };
  saveState();
  const changed = changedFieldLabels(before, state.company, [
    ["name", "公司名稱"],
    ["englishName", "英文名稱"],
    ["taxId", "統編"],
    ["defaultTaxRate", "預設稅率"],
    ["email", "Email"],
    ["phone", "電話"],
    ["fax", "傳真"],
    ["address", "地址"],
    ["managerName", "主管簽核"],
    ["preparerName", "製表人"],
    ["formCode", "表單代碼"],
    ["bankInfo", "銀行資訊"],
    ["defaultTerms", "預設條款"],
  ]);
  logWorkEvent("settings", "更新公司設定", {
    entityType: "settings",
    detail: changed.length ? `變更欄位：${changed.join("、")}` : "儲存公司設定",
  });
  setToast("設定已儲存");
};

window.savePersonalSettings = async function (event) {
  event.preventDefault();
  const user = currentUser();
  if (!user) return;
  const form = new FormData(event.currentTarget);
  const payload = normalizeAccountRecord({
    ...user,
    name: form.get("name"),
  });
  const accounts = loadAccounts();
  if (!payload.name) {
    setToast("名稱要填寫");
    return;
  }
  saveAccounts(accounts.map((account) => (account.id === user.id ? payload : account)));
  setAuthSession(payload);
  logWorkEvent("profile", `更新個人資料：${payload.name}`, {
    entityType: "profile",
    entityId: payload.id,
    entityName: payload.name,
    detail: "變更欄位：名稱",
  });
  setToast("個人設定已儲存");
  render();
};

window.openPersonalModal = function (modal) {
  if (modal !== "avatar" && modal !== "password") return;
  ui.personalModal = modal;
  ui.personalAvatarFile = null;
  render();
};

window.closePersonalModal = function () {
  ui.personalModal = null;
  ui.personalAvatarFile = null;
  render();
};

function updateAvatarDropzoneLabel(target, file) {
  const label = target?.querySelector?.("[data-avatar-file-name]");
  if (label && file?.name) label.textContent = file.name;
}

window.handleAvatarDragOver = function (event) {
  event.preventDefault();
  event.currentTarget?.classList.add("is-dragging");
};

window.handleAvatarDragLeave = function (event) {
  event.currentTarget?.classList.remove("is-dragging");
};

window.handleAvatarDrop = function (event) {
  event.preventDefault();
  const target = event.currentTarget;
  target?.classList.remove("is-dragging");
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  ui.personalAvatarFile = file;
  const input = target?.querySelector?.('input[type="file"]');
  if (input && event.dataTransfer?.files) {
    try {
      input.files = event.dataTransfer.files;
    } catch (error) {
      // Some browsers keep file inputs read-only; the stored file is still used on save.
    }
  }
  updateAvatarDropzoneLabel(target, file);
};

window.handleAvatarFilePick = function (event) {
  const file = event.currentTarget?.files?.[0] || null;
  ui.personalAvatarFile = file;
  updateAvatarDropzoneLabel(event.currentTarget?.closest?.(".avatar-dropzone"), file);
};

window.saveAvatarImage = async function (event) {
  event.preventDefault();
  const user = currentUser();
  if (!user) return;
  const form = new FormData(event.currentTarget);
  const formFile = form.get("avatarFile");
  const file = formFile && formFile.size ? formFile : ui.personalAvatarFile;
  if (!file || !file.size) {
    setToast("請先選擇頭像圖片");
    return;
  }
  let avatarImage = "";
  try {
    avatarImage = await readFileAsDataUrl(file);
  } catch (error) {
    setToast(error.message || "頭像圖片讀取失敗");
    return;
  }
  const payload = normalizeAccountRecord({ ...user, avatarImage });
  saveAccounts(loadAccounts().map((account) => (account.id === user.id ? payload : account)));
  setAuthSession(payload);
  logWorkEvent("profile", `更新個人頭像：${payload.name}`, {
    entityType: "profile",
    entityId: payload.id,
    entityName: payload.name,
    detail: "變更欄位：頭像",
  });
  ui.personalModal = null;
  ui.personalAvatarFile = null;
  setToast("頭像已更新");
  render();
};

window.changePersonalPassword = async function (event) {
  event.preventDefault();
  const user = currentUser();
  if (!user) return;
  const form = new FormData(event.currentTarget);
  const oldPassword = String(form.get("oldPassword") || "");
  const newPassword = String(form.get("newPassword") || "");
  const confirmPassword = String(form.get("confirmPassword") || "");
  if (!(await verifyAccountPassword(user, oldPassword))) {
    setToast("舊密碼不正確");
    return;
  }
  if (!MaterialsQuoteDomain.isNumericCredential(newPassword)) {
    setToast("新密碼需為 3 至 20 位數字");
    return;
  }
  if (newPassword !== confirmPassword) {
    setToast("兩次新密碼不一致");
    return;
  }
  const payload = normalizeAccountRecord({ ...user, password: "", password_hash: await hashNumericPin(newPassword) });
  saveAccounts(loadAccounts().map((account) => (account.id === user.id ? payload : account)));
  setAuthSession(payload);
  logWorkEvent("password", `更新個人密碼：${payload.name}`, {
    entityType: "profile",
    entityId: payload.id,
    entityName: payload.name,
    detail: "密碼內容不顯示在工作日誌",
  });
  ui.personalModal = null;
  setToast("密碼已更新");
  render();
};

window.addEventListener("hashchange", () => {
  ui.accountOpen = false;
  ui.permissionAccountId = null;
  ui.personalModal = null;
  ui.personalAvatarFile = null;
  ui.picker = null;
  ui.materialCategoryDialogOpen = false;
  ui.materialCategoryDraft = "";
  ui.materialCategoryFeedback = null;
  if (!route().path.includes("/quotes/new") && !route().path.includes("/edit")) {
    ui.quoteDraft = null;
    ui.quoteDraftSource = null;
    ui.quoteDraftDirty = false;
  }
  render();
});

window.addEventListener("beforeunload", (event) => {
  if (!ui.quoteDraft || !ui.quoteDraftDirty) return;
  saveStoredQuoteDraft();
  event.preventDefault();
  event.returnValue = "";
});

function refreshExpiredQuotes() {
  if (typeof isFrontendReadOnly === "function" && isFrontendReadOnly()) return;
  const today = dateToday();
  const expired = state.quotes.filter((quote) => quote.status === "sent" && quote.valid_until && quote.valid_until < today);
  if (!expired.length) return;
  expired.forEach((quote) => {
    quote.status = "expired";
    quote.status_updated_at = new Date().toISOString();
    quote.status_updated_by = "system";
    logWorkEvent("status", `報價單自動過期：${quote.quote_no}`, {
      entityType: "quotes",
      entityId: quote.id,
      entityName: quote.quote_no,
      detail: `有效期限：${quote.valid_until}`,
    });
  });
  saveState();
}

if (!location.hash) location.hash = isAuthed() ? "#/dashboard" : "#/login";
refreshExpiredQuotes();
migrateLegacyAccountPasswords().catch((error) => console.warn("Legacy account password migration failed", error));
render();
