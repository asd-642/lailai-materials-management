const SEED_QUOTE_MATERIALS = {
  m1: { material_id: "m1", name: "不銹鋼管", category: "鋼構", unit: "KG", pricing_type: "steel_rect_tube", formula_version: "excel-1150709-v1", thickness: 3.8, width: 3.8, length: "", wall_thickness_mm: 2, density_factor: 0.02466, quantity: 1, unit_price: 180, cost_price: "", waste_pct: 0, labor_unit_price: 140, labor_waste_pct: 5, labor_pricing_type: "wood_board_tsai", notes: "" },
  m2: { material_id: "m2", name: "配件-不鏽鋼扣件", category: "其他配件", unit: "個", pricing_type: "single", formula_version: "excel-1150709-v1", quantity: 1, unit_price: 15, cost_price: "", waste_pct: 0, labor_unit_price: 0, labor_waste_pct: "", labor_pricing_type: "", notes: "" },
  m3: { material_id: "m3", name: "配件-不鏽鋼角鐵", category: "其他配件", unit: "個", pricing_type: "single", formula_version: "excel-1150709-v1", quantity: 1, unit_price: 50, cost_price: "", waste_pct: 0, labor_unit_price: 0, labor_waste_pct: "", labor_pricing_type: "", notes: "" },
  m4: { material_id: "m4", name: "塑木(中空)-一代", category: "塑木", unit: "才", pricing_type: "wood_board_tsai", formula_version: "excel-1150709-v1", thickness: 2.5, width: 14.6, length: 100, quantity: 1, unit_price: 350, cost_price: "", waste_pct: 5, labor_unit_price: 140, labor_waste_pct: 5, labor_pricing_type: "", notes: "" },
};

function itemFromMaterial(materialId, overrides = {}) {
  let material = null;
  try {
    material = state.materials.find((item) => item.id === materialId);
  } catch (error) {
    material = null;
  }
  if (!material && SEED_QUOTE_MATERIALS[materialId]) {
    const seeded = SEED_QUOTE_MATERIALS[materialId];
    return {
      ...blankItem(),
      ...seeded,
      item_kind: "catalog",
      formula_source: seeded.formula_version === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式",
      formula_source_id: seeded.formula_version === "excel-1150709-v1" ? "company-workbook/1150709" : `website-formula/${seeded.formula_version}`,
      formula_source_version: seeded.formula_version,
      formula_source_snapshot: seeded.formula_version === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式",
      dimension_unit: "cm",
      default_actual_unit_price: seeded.unit_price,
      actual_unit_price: seeded.unit_price,
      cost_price_status: "unverified_legacy",
      ...overrides,
    };
  }
  if (!material) return { ...blankItem(), ...overrides };
  return {
    ...blankItem(),
    item_kind: "catalog",
    material_id: material.id,
    name: material.name,
    category: material.category,
    unit: material.unit,
    pricing_type: material.pricing_type,
    formula_version: material.formula_version || "legacy-v1",
    formula_source: material.formula_source || (material.formula_version === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式"),
    formula_source_id: material.formula_source_id || (material.formula_version === "excel-1150709-v1" ? "company-workbook/1150709" : `website-formula/${material.formula_version || "legacy-v1"}`),
    formula_source_version: material.formula_source_version || material.formula_version || "legacy-v1",
    formula_source_snapshot: material.formula_source_snapshot || material.formula_source || (material.formula_version === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式"),
    dimension_unit: material.dimension_unit || "cm",
    thickness: material.default_thickness,
    width: material.default_width,
    length: material.default_length,
    weight: material.default_weight,
    wall_thickness_mm: material.wall_thickness_mm,
    density_factor: material.density_factor || 0.02466,
    quantity: 1,
    standard_budget_unit_price: material.standard_budget_unit_price ?? "",
    standard_budget_source: material.standard_budget_source || "",
    standard_budget_version: material.standard_budget_version || "",
    catalog_sale_unit_price: material.catalog_sale_unit_price ?? "",
    catalog_sale_price_source: material.catalog_sale_price_source || "",
    catalog_sale_price_version: material.catalog_sale_price_version || "",
    catalog_discount_factor: material.catalog_discount_factor ?? "",
    default_actual_unit_price: material.default_actual_unit_price ?? material.unit_price,
    actual_unit_price: material.default_actual_unit_price ?? material.unit_price,
    unit_price: material.default_actual_unit_price ?? material.unit_price,
    price_source: material.actual_price_source || "材料主檔",
    price_version: material.actual_price_version || material.price_effective_date || "",
    price_is_override: false,
    price_override_reason: "",
    cost_price: material.cost_price ?? "",
    cost_price_status: material.cost_price_status || "unverified",
    price_effective_date: material.price_effective_date || "",
    waste_pct: material.waste_pct,
    labor_unit_price: material.labor_unit_price,
    labor_waste_pct: material.labor_waste_pct,
    labor_pricing_type: material.labor_pricing_type,
    notes: material.notes || "",
    ...overrides,
  };
}

function blankItem() {
  return {
    line_id: id("line"),
    material_id: null,
    item_kind: "custom",
    name: "",
    category: "",
    unit: "件",
    pricing_type: "single",
    formula_version: "legacy-v1",
    formula_source: "custom-default",
    formula_source_id: "custom-formula/legacy-v1",
    formula_source_version: "legacy-v1",
    formula_source_snapshot: "custom-default",
    dimension_unit: "cm",
    thickness: "",
    width: "",
    length: "",
    weight: "",
    wall_thickness_mm: "",
    density_factor: 0.02466,
    quantity: 1,
    standard_budget_unit_price: "",
    standard_budget_source: "",
    standard_budget_version: "",
    catalog_sale_unit_price: "",
    catalog_sale_price_source: "",
    catalog_sale_price_version: "",
    catalog_discount_factor: "",
    default_actual_unit_price: 0,
    actual_unit_price: 0,
    unit_price: 0,
    price_source: "客製品項",
    price_version: "",
    price_is_override: false,
    price_override_reason: "",
    cost_price: "",
    cost_price_status: "unverified",
    price_effective_date: "",
    waste_pct: 0,
    labor_unit_price: 0,
    labor_waste_pct: "",
    labor_pricing_type: "",
    is_chargeable: true,
    is_required_for_preparation: true,
    breakdown_adjustment_qty: 0,
    breakdown_adjustment_reason: "",
    custom_dimensions_spec: "",
    detail_drawing_status: "pending",
    surface_treatment_status: "pending",
    catalog_review_required: false,
    catalog_review_reason: "",
    notes: "",
  };
}

function blankSection() {
  return {
    calculation_mode: MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE,
    name: "",
    area_qty: 1,
    unit: "M²",
    spec: "",
    items: [blankItem()],
    laborItems: defaultLaborItems(),
    labor_config: {
      labor_per_board_foot: 140,
      carpenter_allocation: 1,
      metalworker_allocation: 0,
      carpenter_daily_rate: 2500,
      metalworker_daily_rate: 2000,
    },
  };
}

function normalizeQuoteRecord(quote, materialsOverride = null) {
  let materials = [];
  if (Array.isArray(materialsOverride)) {
    materials = materialsOverride;
  } else {
    try {
      materials = Array.isArray(state?.materials) ? state.materials : [];
    } catch (error) {
      materials = [];
    }
  }
  const migrated = MaterialsQuoteDomain.migrateQuoteForSchema(quote || {}, materials);
  const revisionNo = Number.isInteger(Number(migrated?.revision_no)) ? Number(migrated.revision_no) : 0;
  const rootId = migrated?.revision_group_id || migrated?.root_quote_id || migrated?.id || "";
  return {
    ...migrated,
    revision_no: revisionNo,
    quote_version: Number.isInteger(Number(migrated?.quote_version)) && Number(migrated.quote_version) > 0
      ? Number(migrated.quote_version)
      : revisionNo + 1,
    revision_group_id: rootId,
    parent_quote_id: migrated?.parent_quote_id || "",
    owner_id: migrated?.owner_id || "",
    project_address: migrated?.project_address || "",
    project_contact: migrated?.project_contact || "",
    next_follow_up: migrated?.next_follow_up || "",
    lost_reason: migrated?.lost_reason || "",
    status_updated_at: migrated?.status_updated_at || "",
    status_updated_by: migrated?.status_updated_by || "",
    submitted_for_approval_at: migrated?.submitted_for_approval_at || "",
    submitted_for_approval_by: migrated?.submitted_for_approval_by || null,
    submitted_for_approval_by_id: migrated?.submitted_for_approval_by_id || migrated?.submitted_for_approval_by?.id || "",
    submitted_for_approval_role: migrated?.submitted_for_approval_role || migrated?.submitted_for_approval_by?.role || "",
    submitted_for_approval_version_no: Number.isInteger(Number(migrated?.submitted_for_approval_version_no)) && Number(migrated.submitted_for_approval_version_no) > 0
      ? Number(migrated.submitted_for_approval_version_no)
      : null,
    approval_submission_id: migrated?.approval_submission_id || "",
    submission_snapshot: migrated?.submission_snapshot || null,
    submission_snapshot_sha256: migrated?.submission_snapshot_sha256 || "",
    approved_at: migrated?.approved_at || "",
    approved_by: migrated?.approved_by || null,
    approved_version_no: Number.isInteger(Number(migrated?.approved_version_no)) && Number(migrated.approved_version_no) > 0
      ? Number(migrated.approved_version_no)
      : null,
    approval_snapshot_sha256: migrated?.approval_snapshot_sha256 || "",
    approval_mode: migrated?.approval_mode || "",
    returned_at: migrated?.returned_at || "",
    returned_by: migrated?.returned_by || null,
    returned_reason: migrated?.returned_reason || "",
    sent_at: migrated?.sent_at || "",
    won_at: migrated?.won_at || "",
    lost_at: migrated?.lost_at || "",
    document_snapshot: migrated?.document_snapshot || null,
    is_superseded: Boolean(migrated?.is_superseded),
    superseded_by: migrated?.superseded_by || "",
  };
}

function normalizeAppState(rawState, migrationContext = { source: "local", trustExistingHistoricalData: true }) {
  const fallback = seedData();
  const source = rawState && typeof rawState === "object" ? rawState : fallback;
  const company = { ...fallback.company, ...(source.company || {}) };
  if (typeof company.address === "string") company.address = company.address.replace(/^桃園是/, "桃園市");
  const merged = {
    ...fallback,
    ...source,
    materials: Array.isArray(source.materials) ? source.materials : fallback.materials,
    customers: Array.isArray(source.customers) ? source.customers : fallback.customers,
    templates: Array.isArray(source.templates) ? source.templates : fallback.templates,
    quotes: Array.isArray(source.quotes) ? source.quotes : fallback.quotes,
    company,
  };
  const migrated = MaterialsQuoteDomain.migrateAppState(merged, DATA_SCHEMA_VERSION, new Date().toISOString(), migrationContext);
  migrated.quotes = migrated.quotes.map((quote) => normalizeQuoteRecord(quote, migrated.materials));
  return migrated;
}

let state = loadState();
let ui = {
  authMode: "login",
  sidebarCollapsed: false,
  accountOpen: false,
  accountDraft: null,
  permissionAccountId: null,
  personalModal: null,
  personalAvatarFile: null,
  picker: null,
  pickerSearch: "",
  quoteDraft: null,
  quoteDraftSource: null,
  quoteDraftRestored: false,
  quoteDraftSavedAt: "",
  quoteDraftDirty: false,
  quoteCatalogSelections: {},
  quoteCustomSelections: {},
  quoteSpecificationSelections: {},
  quoteSpecificationDraftSelections: {},
  quoteLaborDetailFeedback: {},
  editingMaterial: null,
  materialSpecificationEditId: null,
  materialSpecificationFeedback: null,
  materialCategoryDialogOpen: false,
  materialCategoryDraft: "",
  materialCategoryFeedback: null,
  toast: "",
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeAppState(JSON.parse(saved));
  } catch (error) {
    console.warn(error);
  }
  const seeded = normalizeAppState(seedData());
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) return seeded;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch (error) {
    console.warn(error);
  }
  return seeded;
}

function saveState() {
  try {
    const sessionUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    if (sessionUser && normalizeAccountRole(sessionUser.role) === "contractor") return false;
  } catch (error) {
    return false;
  }
  state.meta = { ...(state.meta || {}), schema_version: DATA_SCHEMA_VERSION, updated_at: new Date().toISOString() };
  const sharedRuntime = window.MaterialsQuoteSharedWorkingStateRuntime;
  if (sharedRuntime?.isDraftActive?.()) return sharedRuntime.capturePartition("state", state) === true;
  if (sharedRuntime?.requiresGateway?.()) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error(error);
    if (typeof setToast === "function" && typeof ui !== "undefined") setToast("儲存空間不足，請先匯出備份後再繼續");
    return false;
  }
}

function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === "yes";
}

function defaultAccounts() {
  return [
    {
      id: "account-admin-123",
      account: DEMO_EMAIL,
      name: "管理人員",
      avatar: "管",
      avatarImage: "",
      password_hash: DEMO_PASSWORD_HASH,
      role: "admin",
      permissions: defaultAccountPermissions("admin"),
      is_active: true,
    },
    {
      id: "account-staff-456",
      account: STAFF_EMAIL,
      name: "一般人員",
      avatar: "員",
      avatarImage: "",
      password_hash: STAFF_PASSWORD_HASH,
      role: "staff",
      permissions: defaultAccountPermissions("staff"),
      is_active: true,
    },
  ];
}

function defaultAccountPermissions(role) {
  const normalizedRole = normalizeAccountRole(role);
  const adminRole = ["owner", "admin"].includes(normalizedRole);
  const contractorRole = normalizedRole === "contractor";
  return ACCOUNT_PERMISSION_DEFINITIONS.reduce((permissions, item) => {
    permissions[item.key] = contractorRole ? false : adminRole ? item.adminDefault !== false : Boolean(item.staffDefault);
    return permissions;
  }, {});
}

function normalizeAccountPermissions(permissions, role) {
  return {
    ...defaultAccountPermissions(role),
    ...(permissions && typeof permissions === "object" ? permissions : {}),
  };
}

function accountPermissionLabel(key) {
  return ACCOUNT_PERMISSION_DEFINITIONS.find((item) => item.key === key)?.title || key;
}

function hasAccountPermission(account, key) {
  if (!account) return false;
  const permissions = normalizeAccountPermissions(account.permissions, account.role);
  return Boolean(permissions[key]);
}

function currentAccountCan(key) {
  return hasAccountPermission(currentUser({ readOnly: true }), key);
}

function canManageAccounts() {
  return currentAccountCan("manage_accounts");
}

function canEditCompanySettings() {
  return currentAccountCan("edit_company_settings");
}

function canEditMaterialPrices() {
  return currentAccountCan("edit_material_prices");
}

function canEditQuoteTemplates() {
  return currentAccountCan("edit_quote_templates");
}

function canUseCustomerOcr() {
  return currentAccountCan("use_customer_ocr");
}

function canApproveQuotes() {
  return currentAccountCan("approve_quotes");
}

function deletePermissionKeysForCollection(collection) {
  if (collection === "customers") return ["delete_user_data", "delete_customers"];
  if (collection === "quotes") return ["delete_user_data", "delete_quotes"];
  return ["delete_user_data"];
}

function canDeleteCollection(collection) {
  const user = currentUser();
  return deletePermissionKeysForCollection(collection).some((key) => hasAccountPermission(user, key));
}

function normalizeAccountRole(role) {
  return ACCOUNT_ROLES.includes(role) ? role : "staff";
}

function activeOwnerCount(accounts) {
  return (Array.isArray(accounts) ? accounts : []).filter((account) => normalizeAccountRole(account?.role) === "owner" && account?.is_active !== false).length;
}

function validateAccountMutation({ actor, previousAccounts = [], nextAccounts = [], targetId = "", bootstrapConfirmed = false } = {}) {
  const previous = Array.isArray(previousAccounts) ? previousAccounts : [];
  const next = Array.isArray(nextAccounts) ? nextAccounts : [];
  if (next.some((account) => !ACCOUNT_ROLES.includes(account?.role))) return { ok: false, code: "UNKNOWN_ROLE" };
  if (activeOwnerCount(next) < 1 && activeOwnerCount(previous) > 0) return { ok: false, code: "LAST_OWNER_PROTECTED" };
  const actorRole = normalizeAccountRole(actor?.role);
  const actorRecord = previous.find((account) => account.id === actor?.id && account.is_active !== false);
  if (!actorRecord || normalizeAccountRole(actorRecord.role) !== actorRole) return { ok: false, code: "ACTOR_NOT_CURRENT_ACTIVE_ACCOUNT" };
  const targetBefore = previous.find((account) => account.id === targetId);
  const targetAfter = next.find((account) => account.id === targetId);
  const ownerWasAbsent = activeOwnerCount(previous) === 0;
  const ownerWasCreated = targetAfter?.role === "owner" && targetBefore?.role !== "owner";
  if (ownerWasCreated && ownerWasAbsent) {
    if (!(targetBefore && actorRole === "admin" && bootstrapConfirmed && targetAfter?.is_active !== false)) {
      return { ok: false, code: "OWNER_BOOTSTRAP_REQUIRED" };
    }
  }
  if (ownerWasCreated && !ownerWasAbsent && actorRole !== "owner") {
    return { ok: false, code: "OWNER_PROTECTED" };
  }
  if (targetBefore?.role === "owner" && actorRole !== "owner") return { ok: false, code: "OWNER_PROTECTED" };
  if (actorRole !== "owner" && actorRole !== "admin") return { ok: false, code: "ACCOUNT_MANAGEMENT_DENIED" };
  return { ok: true, code: "" };
}

function validateAccountSetForImport(accounts, actor) {
  const records = Array.isArray(accounts) ? accounts.map(normalizeAccountRecord) : [];
  if (!records.length || records.some((account) => !account.account || !ACCOUNT_ROLES.includes(account.role))) {
    return { ok: false, code: "ACCOUNT_IMPORT_INVALID" };
  }
  return validateAccountMutation({ actor, previousAccounts: loadAccounts(), nextAccounts: records, targetId: actor?.id || "" });
}

function accountRoleLabel(role) {
  return ACCOUNT_ROLE_LABELS[normalizeAccountRole(role)];
}

function normalizeAccountRecord(account) {
  const role = normalizeAccountRole(account?.role);
  const name = String(account?.name || account?.account || accountRoleLabel(role)).trim();
  const avatar = String(account?.avatar || name.slice(0, 1) || "用").trim().slice(0, 2);
  return {
    id: account?.id || id("u"),
    account: String(account?.account || "").trim(),
    name,
    avatar,
    avatarImage: String(account?.avatarImage || ""),
    password_hash: String(account?.password_hash || ""),
    password: account?.password_hash ? "" : String(account?.password || ""),
    role,
    permissions: normalizeAccountPermissions(account?.permissions, role),
    is_active: account?.is_active === false ? false : true,
  };
}

async function hashNumericPin(pin) {
  return MaterialsQuoteDomain.hashPin(String(pin || ""));
}

async function verifyAccountPassword(account, pin) {
  if (!account || !MaterialsQuoteDomain.isNumericCredential(pin)) return false;
  if (account.password_hash) return (await hashNumericPin(pin)) === account.password_hash;
  return Boolean(account.password && account.password === pin);
}

async function upgradeLegacyAccountPassword(account, pin) {
  if (!account || account.password_hash || !account.password) return account;
  const upgraded = normalizeAccountRecord({ ...account, password: "", password_hash: await hashNumericPin(pin) });
  if (!window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) {
    saveAccounts(loadAccounts().map((item) => (item.id === upgraded.id ? upgraded : item)));
  }
  return upgraded;
}

async function migrateLegacyAccountPasswords() {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) return loadAccounts({ persistMigration: false });
  const accounts = loadAccounts();
  let changed = false;
  const migrated = [];
  for (const account of accounts) {
    if (!account.password_hash && account.password) {
      migrated.push(normalizeAccountRecord({ ...account, password: "", password_hash: await hashNumericPin(account.password) }));
      changed = true;
    } else {
      migrated.push(account);
    }
  }
  if (changed) saveAccounts(migrated);
  return migrated;
}

function loadLoginAttempts() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    console.warn(error);
    return {};
  }
}

function loginLockRemaining(account) {
  const entry = loadLoginAttempts()[String(account || "")];
  return Math.max(0, Number(entry?.locked_until || 0) - Date.now());
}

function recordLoginFailure(account) {
  const key = String(account || "unknown");
  const attempts = loadLoginAttempts();
  const previous = attempts[key] || { count: 0, locked_until: 0 };
  const count = Number(previous.count || 0) + 1;
  attempts[key] = {
    count: count >= 5 ? 0 : count,
    locked_until: count >= 5 ? Date.now() + 5 * 60 * 1000 : Number(previous.locked_until || 0),
  };
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function clearLoginFailures(account) {
  const attempts = loadLoginAttempts();
  delete attempts[String(account || "")];
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

function loadAccounts(options = {}) {
  const sharedAccounts = window.MaterialsQuoteSharedWorkingStateRuntime?.readPartition?.("accounts");
  if (Array.isArray(sharedAccounts)) {
    return sharedAccounts.map(normalizeAccountRecord).filter((account) => account.account);
  }
  let accounts = null;
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (saved) accounts = JSON.parse(saved);
  } catch (error) {
    console.warn(error);
  }
  if (!Array.isArray(accounts) || !accounts.length) {
    if (options.fallbackToDefaults === false) return [];
    accounts = defaultAccounts();
  }
  accounts = accounts.map(normalizeAccountRecord).filter((account) => account.account);
  if (!accounts.length) {
    if (options.fallbackToDefaults === false) return [];
    accounts = defaultAccounts();
  }
  if (options.persistMigration !== false) saveAccounts(accounts, { allowReadOnlyMigration: true });
  return accounts;
}

function saveAccounts(accounts, options = {}) {
  if (!options.allowReadOnlyMigration) {
    try {
      const sessionUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
      if (sessionUser && normalizeAccountRole(sessionUser.role) === "contractor") return false;
    } catch (error) {
      return false;
    }
  }
  const records = accounts.map(normalizeAccountRecord).map((account) => {
    const record = { ...account };
    if (record.password_hash) delete record.password;
    return record;
  });
  if (records.some((account) => !ACCOUNT_ROLES.includes(account.role))) return false;
  if (options.actor) {
    const previous = Array.isArray(options.previousAccounts) ? options.previousAccounts : loadAccounts();
    const guard = validateAccountMutation({
      actor: options.actor,
      previousAccounts: previous,
      nextAccounts: records,
      targetId: options.targetId || options.actor.id,
      bootstrapConfirmed: options.bootstrapConfirmed === true,
    });
    if (!guard.ok) return false;
  }
  const sharedRuntime = window.MaterialsQuoteSharedWorkingStateRuntime;
  if (sharedRuntime?.isDraftActive?.()) return sharedRuntime.capturePartition("accounts", records) === true;
  if (sharedRuntime?.requiresGateway?.()) return false;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(records));
  return true;
}

function accountById(accountId, options = {}) {
  return loadAccounts(options).find((account) => account.id === accountId);
}

function currentUser(options = {}) {
  const readOnly = options.readOnly === true;
  const accountReadOptions = readOnly ? { persistMigration: false, fallbackToDefaults: false } : {};
  if (!isAuthed()) return null;
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      const user = normalizeAccountRecord(JSON.parse(saved));
      const latest = accountById(user.id, accountReadOptions)
        || loadAccounts(accountReadOptions).find((account) => account.account === user.account);
      if (latest && latest.is_active) return latest;
      if (latest && !latest.is_active) {
        if (!readOnly) clearAuthSession();
        return null;
      }
      if (!latest) {
        if (!readOnly) clearAuthSession();
        return null;
      }
    }
  } catch (error) {
    console.warn(error);
  }
  if (!readOnly) clearAuthSession();
  return null;
}

window.MaterialCategories = MaterialsQuoteDomain.createMaterialCategoryStore({
  getState: () => state,
  setState: (nextState) => { state = nextState; },
  saveState: () => saveState(),
  getActor: () => {
    const actor = currentUser();
    return actor && hasAccountPermission(actor, "edit_material_prices") ? actor : null;
  },
});

window.MaterialSpecifications = MaterialsQuoteDomain.createMaterialSpecificationStore({
  getState: () => state,
  setState: (nextState) => { state = nextState; },
  saveState: () => saveState(),
  getActor: () => {
    const actor = currentUser();
    return actor && hasAccountPermission(actor, "edit_material_prices") ? actor : null;
  },
});

window.QuoteMaterialSpecifications = MaterialsQuoteDomain.createQuoteMaterialSpecificationStore({
  getDraft: () => ui.quoteDraft,
  setDraft: (nextDraft) => { ui.quoteDraft = nextDraft; },
  saveDraft: () => saveStoredQuoteDraft(),
  getActor: () => currentUser(),
  canWriteQuote: (actor) => Boolean(actor
    && actor.is_active !== false
    && ["owner", "admin", "staff"].includes(String(actor.role || ""))),
  getWeight: (materialId, thickness, width) => window.MaterialSpecifications.getWeight(materialId, thickness, width),
  now: () => new Date().toISOString(),
  getTrustedSelection: (lineId) => ui.quoteSpecificationSelections[lineId] || null,
  setTrustedSelection: (lineId, snapshot) => {
    if (snapshot) ui.quoteSpecificationSelections[lineId] = MaterialsQuoteDomain.deepClone(snapshot);
    else delete ui.quoteSpecificationSelections[lineId];
  },
});

function isAdmin() {
  return currentUser()?.role === "admin";
}

function setAuthSession(account) {
  const user = normalizeAccountRecord(account);
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("setAuthSession", [user])) return;
  localStorage.setItem(AUTH_KEY, "yes");
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({
    id: user.id,
    account: user.account,
    name: user.name,
    avatar: user.avatar,
    avatarImage: user.avatarImage,
    role: user.role,
    permissions: user.permissions,
    is_active: user.is_active,
  }));
}

function clearAuthSession() {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("clearAuthSession", [])) return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function accountInitial(account) {
  const avatar = String(account?.avatar || "").trim();
  if (avatar) return avatar.slice(0, 2);
  const name = String(account?.name || account?.account || "用").trim();
  return name.slice(0, 1) || "用";
}

function renderAvatar(account, className = "") {
  const classes = ["avatar", className].filter(Boolean).join(" ");
  if (account?.avatarImage) {
    return `<span class="${classes} avatar-image"><img src="${h(account.avatarImage)}" alt="${h(account.name || "頭像")}"></span>`;
  }
  return `<span class="${classes}">${h(accountInitial(account))}</span>`;
}

function setToast(message) {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("toast", [message])) return;
  ui.toast = message;
  render();
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    ui.toast = "";
    render();
  }, 1800);
}

function h(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function money(value) {
  const rounded = Math.round(n(value));
  return "$" + rounded.toLocaleString("en-US");
}

function dateToday() {
  return MaterialsQuoteDomain.formatLocalDate(new Date());
}

function currentQuoteSequence(dateISO) {
  const inMemorySequence = Number(state.meta?.quote_sequences?.[dateISO] || 0);
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) return inMemorySequence;
  let latestStoredSequence = 0;
  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    latestStoredSequence = Number(storedState?.meta?.quote_sequences?.[dateISO] || 0);
  } catch (error) {
    console.warn(error);
  }
  return Math.max(inMemorySequence, latestStoredSequence);
}

function previewNextQuoteNo(dateISO = dateToday()) {
  return MaterialsQuoteDomain.nextQuoteNo(dateISO, state.quotes, currentQuoteSequence(dateISO));
}

function reserveNextQuoteNo(dateISO = dateToday()) {
  const quoteNo = previewNextQuoteNo(dateISO);
  const sequence = Number(quoteNo.split("-").at(-1));
  state.meta = {
    ...(state.meta || {}),
    quote_sequences: {
      ...(state.meta?.quote_sequences || {}),
      [dateISO]: sequence,
    },
  };
  saveState();
  return quoteNo;
}

function quoteRevisionLabel(quote) {
  const revision = Number(quote?.revision_no || 0);
  return revision > 0 ? `Rev.${String(revision).padStart(3, "0")}` : "初版";
}

function quoteIsLocked(quote) {
  return QUOTE_LOCKED_STATUSES.includes(quote?.status);
}

function loadStoredQuoteDraft(source) {
  try {
    const expectedSource = source || "new";
    const storageKey = `${QUOTE_DRAFT_KEY}:${encodeURIComponent(expectedSource)}`;
    const savedForSource = localStorage.getItem(storageKey);
    const legacySaved = savedForSource ? null : localStorage.getItem(QUOTE_DRAFT_KEY);
    const saved = JSON.parse(savedForSource || legacySaved || "null");
    const age = Date.now() - new Date(saved?.saved_at || 0).getTime();
    if (saved?.schema !== "quote-autosave/v1" || saved?.source !== expectedSource || age > 30 * 24 * 60 * 60 * 1000) return null;
    if (!savedForSource && legacySaved) {
      localStorage.setItem(storageKey, legacySaved);
      localStorage.removeItem(QUOTE_DRAFT_KEY);
    }
    return saved;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function saveStoredQuoteDraft(markDirty = true) {
  if (!ui.quoteDraft) return false;
  try {
    const savedAt = new Date().toISOString();
    const source = ui.quoteDraftSource || "new";
    localStorage.setItem(`${QUOTE_DRAFT_KEY}:${encodeURIComponent(source)}`, JSON.stringify({
      schema: "quote-autosave/v1",
      source,
      saved_at: savedAt,
      draft: ui.quoteDraft,
      trusted_catalog_selections: ui.quoteCatalogSelections,
      trusted_custom_selections: ui.quoteCustomSelections,
      trusted_specification_selections: ui.quoteSpecificationSelections,
    }));
    ui.quoteDraftSavedAt = savedAt;
    if (markDirty) ui.quoteDraftDirty = true;
    return true;
  } catch (error) {
    console.warn(error);
    return false;
  }
}

function clearStoredQuoteDraft(source) {
  const targetSource = source || ui.quoteDraftSource || "new";
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("clearStoredQuoteDraft", [targetSource])) return;
  localStorage.removeItem(`${QUOTE_DRAFT_KEY}:${encodeURIComponent(targetSource)}`);
  try {
    const legacy = JSON.parse(localStorage.getItem(QUOTE_DRAFT_KEY) || "null");
    if (!legacy || legacy.source === targetSource) localStorage.removeItem(QUOTE_DRAFT_KEY);
  } catch (error) {
    localStorage.removeItem(QUOTE_DRAFT_KEY);
  }
  ui.quoteDraftSavedAt = "";
  ui.quoteDraftRestored = false;
  ui.quoteDraftDirty = false;
  ui.quoteCatalogSelections = {};
  ui.quoteCustomSelections = {};
  ui.quoteSpecificationSelections = {};
  ui.quoteLaborDetailFeedback = {};
}

function clearAllStoredQuoteDrafts() {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("clearAllStoredQuoteDrafts", [])) return;
  Object.keys(localStorage).filter((key) => key === QUOTE_DRAFT_KEY || key.startsWith(`${QUOTE_DRAFT_KEY}:`)).forEach((key) => localStorage.removeItem(key));
  ui.quoteDraftSavedAt = "";
  ui.quoteDraftRestored = false;
  ui.quoteDraftDirty = false;
  ui.quoteCatalogSelections = {};
  ui.quoteCustomSelections = {};
  ui.quoteSpecificationSelections = {};
  ui.quoteLaborDetailFeedback = {};
}

function id(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function pricingOption(type) {
  return PRICING_TYPE_OPTIONS.find((item) => item.value === type) || PRICING_TYPE_OPTIONS[2];
}

function pricingLabel(type, short = false) {
  const opt = pricingOption(type);
  return short ? opt.short : opt.label;
}

function dimLabel(type, key) {
  const opt = pricingOption(type);
  return opt.dimLabels?.[key] || { thickness: "厚", width: "寬", length: "長" }[key];
}

function materialById(materialId) {
  return state.materials.find((item) => item.id === materialId);
}

function customerById(customerId) {
  return state.customers.find((item) => item.id === customerId);
}

function normalizedCustomerText(value) {
  return String(value || "").toLowerCase().replace(/[\s\-().,，。]/g, "");
}

function customerDataQualityIssues(customer) {
  const issues = [];
  if (!customer?.company_name) issues.push("缺公司名稱");
  if (!normalizedCustomerText(customer?.phone || customer?.contacts?.[0]?.phone)) issues.push("缺電話");
  const taxId = String(customer?.tax_id || "").replace(/\D/g, "");
  if (customer?.tax_id && taxId.length !== 8) issues.push("統編格式需確認");
  if (!(customer?.contacts || []).some((contact) => contact.name)) issues.push("缺聯絡人");
  return issues;
}

function findCustomerDuplicates(candidate, excludeId = "", additional = []) {
  const taxId = String(candidate?.tax_id || "").replace(/\D/g, "");
  const phone = String(candidate?.phone || candidate?.contacts?.[0]?.phone || "").replace(/\D/g, "");
  const company = normalizedCustomerText(candidate?.company_name || candidate?.name);
  return [...state.customers, ...additional].filter((customer) => {
    if (!customer || customer.id === excludeId || customer.id === candidate?.id) return false;
    const sameTaxId = taxId && taxId === String(customer.tax_id || "").replace(/\D/g, "");
    const otherPhone = String(customer.phone || customer.contacts?.[0]?.phone || "").replace(/\D/g, "");
    const samePhone = phone.length >= 8 && phone === otherPhone;
    const sameCompany = company.length >= 3 && company === normalizedCustomerText(customer.company_name || customer.name);
    return sameTaxId || samePhone || sameCompany;
  });
}

function templateById(templateId) {
  return state.templates.find((item) => item.id === templateId);
}

function quoteById(quoteId) {
  return state.quotes.find((item) => item.id === quoteId);
}

function computePriceableQty(item, pricingType = item.pricing_type) {
  return MaterialsQuoteDomain.computePriceableQuantity(item, pricingType, item.formula_version || "legacy-v1");
}

function computeItem(item) {
  let baseQty = 0;
  let formulaError = "";
  let formulaTrace = {
    pricing_type: item.pricing_type || "single",
    formula_version: item.formula_version || "legacy-v1",
    formula_source: item.formula_source || "",
    input_unit: item.dimension_unit || "",
    normalized_unit: "cm",
    dimensions_cm: { thickness: null, width: null, length: null },
  };
  try {
    baseQty = computePriceableQty(item);
    formulaTrace = MaterialsQuoteDomain.buildFormulaTrace(item);
  } catch (error) {
    formulaError = error instanceof Error ? error.message : "公式或尺寸單位無效";
  }
  let wastePolicy = { base_qty: baseQty, quote_waste_qty: 0, priceable_qty: baseQty, affects_inventory: false, affects_cut_plan: false };
  try {
    wastePolicy = MaterialsQuoteDomain.applyQuoteWasteMarkup(baseQty, item.waste_pct);
  } catch (error) {
    formulaError = error instanceof Error ? error.message : "報價損耗加成無效";
  }
  const wasteQty = wastePolicy.quote_waste_qty;
  const priceableQty = wastePolicy.priceable_qty;
  const actualUnitPrice = item.actual_unit_price ?? item.unit_price;
  const rawMaterialSubtotal = priceableQty * n(actualUnitPrice);
  const chargeable = item.is_chargeable !== false;
  const materialSubtotal = chargeable ? rawMaterialSubtotal : 0;
  const hasCostPrice = item.cost_price_status === "verified" && item.cost_price !== "" && item.cost_price != null;
  const materialCostSubtotal = hasCostPrice ? priceableQty * n(item.cost_price) : 0;
  const laborPricing = item.labor_pricing_type || item.pricing_type;
  let laborBaseQty = 0;
  try {
    laborBaseQty = formulaError ? 0 : computePriceableQty(item, laborPricing);
  } catch (error) {
    formulaError = error instanceof Error ? error.message : "工錢公式無效";
  }
  const laborWastePct = item.labor_waste_pct === "" || item.labor_waste_pct == null ? item.waste_pct : item.labor_waste_pct;
  let laborPricedQty = laborBaseQty;
  try {
    laborPricedQty = MaterialsQuoteDomain.applyQuoteWasteMarkup(laborBaseQty, laborWastePct).priceable_qty;
  } catch (error) {
    formulaError = error instanceof Error ? error.message : "工錢損耗無效";
  }
  const rawLaborSubtotal = laborPricedQty * n(item.labor_unit_price);
  const laborSubtotal = chargeable ? rawLaborSubtotal : 0;
  return {
    ok: Boolean(item.name && item.unit && !formulaError),
    baseQty,
    wasteQty,
    priceableQty,
    formulaTrace,
    actualUnitPrice,
    chargeable,
    requiredForPreparation: item.is_required_for_preparation !== false,
    rawMaterialSubtotal,
    materialSubtotal,
    hasCostPrice,
    materialCostSubtotal,
    materialGrossProfit: hasCostPrice ? materialSubtotal - materialCostSubtotal : null,
    laborPricedQty,
    rawLaborSubtotal,
    laborSubtotal,
    subtotal: materialSubtotal + laborSubtotal,
    message: formulaError || (item.name ? "資料不全" : "請填寫品名"),
  };
}

function computeLaborDistribution(laborItems, laborTotal) {
  let fixed = 0;
  let balancerIndex = laborItems.findIndex((item) => item.is_balancer);
  const rows = laborItems.map((item, index) => {
    let amount = 0;
    if (item.is_balancer) return { ...item, amount: 0, qty: 1 };
    if (item.manual_amount !== "" && item.manual_amount != null) amount = n(item.manual_amount);
    else if (item.unit_price !== "" && item.unit_price != null) amount = n(item.unit_price);
    else amount = laborTotal * (n(item.pct) / 100);
    fixed += amount;
    return { ...item, amount, qty: 1 };
  });
  if (balancerIndex >= 0) rows[balancerIndex].amount = laborTotal - fixed;
  return {
    items: rows,
    overAllocated: fixed > laborTotal && balancerIndex >= 0,
    unbalanced: balancerIndex < 0 && Math.round(fixed) !== Math.round(laborTotal),
  };
}

function computeSection(section) {
  if (section?.calculation_mode === MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE) {
    return MaterialsQuoteDomain.calculateExcelQuoteSection(section);
  }
  const itemsComputed = section.items.map(computeItem);
  const materialSubtotal = itemsComputed.reduce((sum, item) => sum + item.materialSubtotal, 0);
  const laborSubtotal = itemsComputed.reduce((sum, item) => sum + item.laborSubtotal, 0);
  const materialCostSubtotal = itemsComputed.reduce((sum, item) => sum + item.materialCostSubtotal, 0);
  const hasCompleteCostData = itemsComputed.length > 0 && itemsComputed.every((item) => item.hasCostPrice);
  const laborDist = computeLaborDistribution(section.laborItems || [], laborSubtotal);
  const unitCost = materialSubtotal + laborSubtotal;
  const sectionTotal = unitCost * n(section.area_qty || 1);
  return { itemsComputed, materialSubtotal, materialCostSubtotal, hasCompleteCostData, laborSubtotal, laborDist, unitCost, sectionTotal };
}

function computeQuote(quote) {
  if (quote.legacy_manual_total && quote.manualTotal) {
    const sections = quote.sections.map(computeSection);
    const materialCost = sections.reduce((sum, section) => sum + section.materialCostSubtotal * n(section.area_qty || 1), 0);
    return {
      sections,
      subtotal: Math.round(quote.manualTotal / 1.05),
      tax: Math.round(quote.manualTotal - quote.manualTotal / 1.05),
      total: quote.manualTotal,
      discount: 0,
      materialCost,
      hasCompleteCostData: sections.every((section) => section.hasCompleteCostData),
    };
  }
  const sections = quote.sections.map(computeSection);
  const subtotalBeforeDiscount = sections.reduce((sum, section) => sum + section.sectionTotal, 0);
  const discount = n(quote.discount_amount);
  const taxable = Math.max(0, subtotalBeforeDiscount - discount);
  const usesExcelForward = sections.some((section) => section.calculationMode === MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE);
  const tax = usesExcelForward ? Math.round(taxable * (n(quote.tax_rate) / 100)) : taxable * (n(quote.tax_rate) / 100);
  const materialCost = sections.reduce((sum, section) => sum + section.materialCostSubtotal * n(section.area_qty || 1), 0);
  const hasCompleteCostData = sections.length > 0 && sections.every((section) => section.hasCompleteCostData);
  const grossProfit = hasCompleteCostData ? taxable - materialCost : null;
  const grossMarginPct = grossProfit != null && taxable > 0 ? (grossProfit / taxable) * 100 : null;
  return { sections, subtotal: subtotalBeforeDiscount, discount, tax, total: taxable + tax, materialCost, hasCompleteCostData, grossProfit, grossMarginPct };
}

function createQuoteDocumentSnapshot(quote, totals = computeQuote(quote), options = {}) {
  const snapshotQuote = { ...quote, document_snapshot: null };
  return MaterialsQuoteDomain.createQuoteSnapshot({
    quote: snapshotQuote,
    customer: customerById(quote.customer_id) || {},
    template: templateById(quote.template_id) || {},
    company: state.company || {},
    totals,
    issuedAt: options.issuedAt || new Date().toISOString(),
    issuedBy: options.issuedBy || (currentUser() ? { id: currentUser().id, name: currentUser().name, account: currentUser().account } : null),
  });
}

function quoteDocumentContext(quote) {
  const snapshot = quote?.document_snapshot;
  if (snapshot?.schema === "quote-document-snapshot/v1") {
    const frozenQuote = normalizeQuoteRecord(MaterialsQuoteDomain.deepClone(snapshot.quote), []);
    return {
      quote: {
        ...frozenQuote,
        id: quote.id,
        status: quote.status,
        revision_no: quote.revision_no,
        revision_group_id: quote.revision_group_id,
        lost_reason: quote.lost_reason,
        status_updated_at: quote.status_updated_at,
        status_updated_by: quote.status_updated_by,
        submitted_for_approval_at: quote.submitted_for_approval_at,
        submitted_for_approval_by: quote.submitted_for_approval_by,
        approved_at: quote.approved_at,
        approved_by: quote.approved_by,
        approved_version_no: quote.approved_version_no,
        approval_snapshot_sha256: quote.approval_snapshot_sha256,
        returned_at: quote.returned_at,
        returned_by: quote.returned_by,
        returned_reason: quote.returned_reason,
        sent_at: quote.sent_at,
        won_at: quote.won_at,
        lost_at: quote.lost_at,
        is_superseded: quote.is_superseded,
        superseded_by: quote.superseded_by,
      },
      customer: MaterialsQuoteDomain.deepClone(snapshot.customer),
      template: MaterialsQuoteDomain.deepClone(snapshot.template),
      company: MaterialsQuoteDomain.deepClone(snapshot.company),
      totals: MaterialsQuoteDomain.deepClone(snapshot.totals),
      frozen: true,
    };
  }
  return {
    quote,
    customer: customerById(quote.customer_id),
    template: templateById(quote.template_id),
    company: state.company,
    totals: computeQuote(quote),
    frozen: false,
  };
}

function migrateLegacyIssuedQuoteSnapshots() {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) return;
  let changed = false;
  state.quotes.forEach((quote) => {
    if (!quoteIsLocked(quote) || quote.document_snapshot) return;
    const issuedAt = quote.sent_at || quote.won_at || quote.lost_at || quote.status_updated_at || quote.updated_at || (quote.quote_date ? `${quote.quote_date}T00:00:00.000Z` : new Date().toISOString());
    quote.document_snapshot = MaterialsQuoteDomain.createQuoteSnapshot({
      quote: { ...quote, document_snapshot: null },
      customer: customerById(quote.customer_id) || {},
      template: templateById(quote.template_id) || {},
      company: state.company || {},
      totals: computeQuote(quote),
      issuedAt,
      issuedBy: null,
    });
    changed = true;
  });
  if (changed) saveState();
}

function route() {
  const raw = location.hash.replace(/^#/, "") || "/login";
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  return { raw, path, parts, query: new URLSearchParams(query) };
}

function link(path) {
  return `#${path}`;
}

function go(path) {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.deferEffect?.("go", [path])) return;
  location.hash = path;
}

const DEFAULT_OCR_TOOL_PATH = "ocr-tool/";

function cleanCardValue(value) {
  return String(value ?? "").trim();
}

function getCustomerOcrToolUrl() {
  const defaultUrl = new URL(DEFAULT_OCR_TOOL_PATH, location.href.split("#")[0]).toString();
  return localStorage.getItem("OCR_TOOL_URL") || defaultUrl;
}

function getCustomerReturnUrl() {
  return `${location.href.split("#")[0]}#/customers/new`;
}

function buildCustomerOcrUrl() {
  const url = new URL(getCustomerOcrToolUrl());
  url.searchParams.set("return_url", getCustomerReturnUrl());
  return url.toString();
}

function decodeBase64UrlJson(value) {
  const normalized = String(value || "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeCustomerCardPayload(value) {
  const raw = cleanCardValue(value);
  if (!raw) return null;
  const candidates = [raw];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch (error) {
    console.warn(error);
  }
  try {
    candidates.push(decodeBase64UrlJson(raw));
  } catch (error) {
    console.warn(error);
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      console.warn(error);
    }
  }
  return null;
}

function normalizeCustomerCard(card) {
  if (!card || typeof card !== "object") return null;
  const firstContact = Array.isArray(card.contacts) ? card.contacts[0] || {} : {};
  const contactName = cleanCardValue(card.contact_name || card.contactName || firstContact.name || card.owner || card.responsible);
  const contactRole = cleanCardValue(card.contact_role || card.contactRole || firstContact.role || card.title);
  const contactPhone = cleanCardValue(card.contact_phone || card.contactPhone || firstContact.phone || card.mobile);
  const contactEmail = cleanCardValue(card.contact_email || card.contactEmail || firstContact.email || card.email);
  const companyName = cleanCardValue(card.company_name || card.companyName || card.company);
  const companyPhone = cleanCardValue(card.phone || card.company_phone || card.companyPhone || card.tel || card.telephone);
  const website = cleanCardValue(card.website || card.web || card.url);
  const notes = [
    cleanCardValue(card.notes),
    website ? `網站：${website}` : "",
    cleanCardValue(card.raw_text || card.rawText) ? `OCR原文：\n${cleanCardValue(card.raw_text || card.rawText)}` : "",
  ].filter(Boolean).join("\n");
  const payload = {
    name: cleanCardValue(card.customer_name || card.customerName || card.name || companyName || contactName),
    phone: companyPhone || contactPhone,
    address: cleanCardValue(card.address || card.company_address || card.companyAddress),
    company_name: companyName,
    tax_id: cleanCardValue(card.tax_id || card.taxId || card.vat),
    invoice_title: cleanCardValue(card.invoice_title || card.invoiceTitle || companyName),
    contacts: [{
      name: contactName,
      role: contactRole,
      phone: contactPhone,
      email: contactEmail,
      notes: cleanCardValue(firstContact.notes),
      primary: true,
    }],
    notes,
    is_active: card.is_active === false ? false : true,
  };
  const hasAnyValue = [
    payload.name,
    payload.phone,
    payload.address,
    payload.company_name,
    payload.tax_id,
    payload.invoice_title,
    payload.contacts[0].name,
    payload.contacts[0].phone,
    payload.contacts[0].email,
    payload.notes,
  ].some(Boolean);
  return hasAnyValue ? payload : null;
}

function customerCardFromRoute() {
  const cardParam = route().query.get("card");
  return normalizeCustomerCard(decodeCustomerCardPayload(cardParam));
}

function customerCardPayloadFromCustomer(customer) {
  const contact = customer?.contacts?.[0] || {};
  return {
    customer_name: customer?.name || "",
    company_name: customer?.company_name || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    tax_id: customer?.tax_id || "",
    invoice_title: customer?.invoice_title || "",
    contact_name: contact.name || "",
    contact_role: contact.role || "",
    contact_phone: contact.phone || "",
    contact_email: contact.email || "",
    notes: customer?.notes || "",
  };
}

migrateLegacyIssuedQuoteSnapshots();
