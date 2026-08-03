(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialsQuoteDomain = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const BACKUP_SCHEMA = "materials-quote-backup/v2";
  const LEGACY_BACKUP_SCHEMA = "materials-quote-backup/v1";
  const BACKUP_MANIFEST_SCHEMA = "materials-quote-backup-manifest/v2";
  const BACKUP_LINEAGE_SCHEMA = "materials-quote-lineage/v1";
  const BACKUP_APP_VERSION = "941025-001";
  const BACKUP_PRODUCER = "lai-lai-materials-quote";
  const CANONICAL_JSON_FORMAT = "canonical-json-sorted-keys/v1";
  const DIMENSION_UNIT_TO_CM = Object.freeze({ mm: 0.1, cm: 1, m: 100 });
  const MATERIAL_SPECIFICATIONS_SCHEMA = "material-specifications/v1";
  const MATERIAL_SPECIFICATION_PRECISION = 12;
  const MATERIAL_SPEC_ERROR_CODES = Object.freeze({
    OK: "OK",
    INVALID_STATE: "MATERIAL_SPEC_INVALID_STATE",
    MATERIAL_NOT_FOUND: "MATERIAL_NOT_FOUND",
    INVALID_DATA: "MATERIAL_SPEC_INVALID_DATA",
    INVALID_UNIT: "MATERIAL_SPEC_INVALID_UNIT",
    INVALID_THICKNESS: "MATERIAL_SPEC_INVALID_THICKNESS",
    INVALID_WIDTH: "MATERIAL_SPEC_INVALID_WIDTH",
    INVALID_WEIGHT: "MATERIAL_SPEC_INVALID_WEIGHT",
    DUPLICATE: "MATERIAL_SPEC_DUPLICATE",
    PERMISSION_DENIED: "MATERIAL_SPEC_PERMISSION_DENIED",
    PERSISTENCE_FAILED: "MATERIAL_SPEC_PERSISTENCE_FAILED",
    SPECIFICATION_NOT_FOUND: "MATERIAL_SPEC_NOT_FOUND",
  });
  const MATERIAL_CATEGORIES_SCHEMA = "material-categories/v1";
  const MATERIAL_CATEGORY_ERROR_CODES = Object.freeze({
    OK: "OK",
    INVALID_STATE: "MATERIAL_CATEGORY_INVALID_STATE",
    INVALID_DATA: "MATERIAL_CATEGORY_INVALID_DATA",
    INVALID_NAME: "MATERIAL_CATEGORY_INVALID_NAME",
    DUPLICATE: "MATERIAL_CATEGORY_DUPLICATE",
    NOT_FOUND: "MATERIAL_CATEGORY_NOT_FOUND",
    PERMISSION_DENIED: "MATERIAL_CATEGORY_PERMISSION_DENIED",
    PERSISTENCE_FAILED: "MATERIAL_CATEGORY_PERSISTENCE_FAILED",
  });
  const QUOTE_MATERIAL_SPECIFICATION_SNAPSHOT_SCHEMA = "quote-material-specification-snapshot/v1";
  const QUOTE_MATERIAL_SPEC_ERROR_CODES = Object.freeze({
    OK: "OK",
    INVALID_STATE: "QUOTE_SPEC_INVALID_STATE",
    PERMISSION_DENIED: "QUOTE_SPEC_PERMISSION_DENIED",
    ITEM_NOT_FOUND: "QUOTE_SPEC_ITEM_NOT_FOUND",
    ITEM_NOT_CATALOG: "QUOTE_SPEC_ITEM_NOT_CATALOG",
    QUOTE_LOCKED: "QUOTE_SPEC_QUOTE_LOCKED",
    MATERIAL_NOT_FOUND: "QUOTE_SPEC_MATERIAL_NOT_FOUND",
    THICKNESS_REQUIRED: "QUOTE_SPEC_THICKNESS_REQUIRED",
    WIDTH_REQUIRED: "QUOTE_SPEC_WIDTH_REQUIRED",
    PAIR_NOT_FOUND: "QUOTE_SPEC_PAIR_NOT_FOUND",
    INVALID_DATA: "QUOTE_SPEC_INVALID_DATA",
    PERSISTENCE_FAILED: "QUOTE_SPEC_PERSISTENCE_FAILED",
  });
  const KNOWN_FORMULA_VERSIONS = new Set(["legacy-v1", "excel-1150709-v1"]);
  const KNOWN_PRICING_TYPES = new Set(["wood_board_tsai", "wood_tsai", "by_length", "by_area", "by_volume", "steel_rect_tube", "steel_round_tube", "single"]);
  const EXCEL_FORWARD_CALCULATION_MODE = "excel_forward_v1";
  const EXCEL_FORWARD_FORMULA_VERSION = "excel-1150709-forward-v1";
  const EXCEL_SOURCE_WORKBOOKS = Object.freeze([
    Object.freeze({
      role: "quote_and_labor_authority",
      filename: "1150709(沈姊)大維工程-塑木欄杆工程.xlsx",
      sha256: "8137F0ACBFF079BD52ED5E4437BCC2DE40443A6F7DC890811D0E49C48167BE49",
    }),
    Object.freeze({
      role: "material_breakdown_authority",
      filename: "1150709-拆料表雙嶸---.xlsx",
      sha256: "5A708EEBEA40C38623939193FEE35AFA3C7D334522B7D5491B7F3791A55F20AB",
    }),
  ]);
  const EXCEL_FORWARD_CONSTANTS = Object.freeze({
    board_foot_base: 2781,
    labor_per_board_foot_default: 140,
    labor_overhead_weights: Object.freeze([0.038, 0.045, 0.022, 0.035]),
    carpenter_daily_rate_default: 2500,
    metalworker_daily_rate_default: 2000,
    steel_pi: 3.1416,
    steel_embedded_wall_multiplier: 2,
    steel_density_factor: 0.02466,
  });
  const EXCEL_LABOR_DETAIL_SCHEMA = "excel-forward-labor-detail/v1";
  const EXCEL_LABOR_DEFAULT_SNAPSHOT_SCHEMA = "excel-forward-labor-default-snapshot/v1";
  const EXCEL_LABOR_ROW_DEFINITIONS = Object.freeze([
    Object.freeze({ row_id: "misc_material", kind: "overhead", name: "零星工料", unit: "式" }),
    Object.freeze({ row_id: "hardware_parts", kind: "overhead", name: "五金零件", unit: "式" }),
    Object.freeze({ row_id: "site_handling", kind: "overhead", name: "工地小搬運", unit: "式" }),
    Object.freeze({ row_id: "freight", kind: "overhead", name: "運費", unit: "式" }),
    Object.freeze({ row_id: "carpenter", kind: "trade", name: "木工", unit: "工" }),
    Object.freeze({ row_id: "metalworker", kind: "trade", name: "鐵工", unit: "工" }),
  ]);
  const EXCEL_LABOR_EDITABLE_FIELDS = new Set(["name", "unit", "factor", "base_value", "quantity"]);
  const EXCEL_LABOR_NUMERIC_FIELDS = new Set(["factor", "base_value", "quantity"]);
  const QUOTE_LABOR_DETAIL_ERROR_CODES = Object.freeze({
    OK: "OK",
    INVALID_STATE: "QUOTE_LABOR_DETAIL_INVALID_STATE",
    PERMISSION_DENIED: "QUOTE_LABOR_DETAIL_PERMISSION_DENIED",
    QUOTE_LOCKED: "QUOTE_LABOR_DETAIL_QUOTE_LOCKED",
    DEFAULT_SNAPSHOT_INVALID: "QUOTE_LABOR_DETAIL_DEFAULT_SNAPSHOT_INVALID",
    ROW_NOT_FOUND: "QUOTE_LABOR_DETAIL_ROW_NOT_FOUND",
    FIELD_NOT_EDITABLE: "QUOTE_LABOR_DETAIL_FIELD_NOT_EDITABLE",
    INVALID_NUMBER: "QUOTE_LABOR_DETAIL_INVALID_NUMBER",
    INVALID_TEXT: "QUOTE_LABOR_DETAIL_INVALID_TEXT",
  });
  const LOCAL_QUOTE_APPROVAL_HISTORY_SCHEMA = "local-quote-approval-history/v1";
  const LOCAL_QUOTE_APPROVAL_EVENT_SCHEMA = "local-quote-approval-event/v1";
  const QUOTE_STATUSES = new Set(["draft", "pending_approval", "approved", "returned", "sent", "won", "lost", "expired"]);
  const QUOTE_EDITABLE_STATUSES = new Set(["draft", "returned"]);
  const QUOTE_ITEM_INPUT_FIELDS = new Set([
    "name",
    "unit",
    "thickness",
    "width",
    "length",
    "weight",
    "dimension_unit",
    "wall_thickness_mm",
    "quantity",
    "custom_dimensions_spec",
    "detail_drawing_status",
    "surface_treatment_status",
    "notes",
    "is_required_for_preparation",
    "breakdown_adjustment_qty",
    "breakdown_adjustment_reason",
  ]);
  const QUOTE_ITEM_PRICING_FIELDS = new Set([
    "actual_unit_price",
    "unit_price",
    "price_override_reason",
    "waste_pct",
    "labor_unit_price",
    "labor_waste_pct",
    "is_chargeable",
  ]);
  const QUOTE_ITEM_NUMERIC_FIELDS = new Set([
    "thickness", "width", "length", "weight", "wall_thickness_mm", "quantity", "actual_unit_price",
    "unit_price", "waste_pct", "labor_unit_price", "labor_waste_pct", "breakdown_adjustment_qty",
  ]);

  function deepClone(value) {
    if (value == null) return value;
    if (typeof globalThis.structuredClone === "function") return globalThis.structuredClone(value);
    return JSON.parse(JSON.stringify(value));
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
      if (typeof input !== "object") throw new TypeError(`Canonical JSON does not allow ${typeof input}`);
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
    return encode(value, false);
  }

  async function sha256Hex(value) {
    if (!globalThis.crypto?.subtle) throw new Error("目前環境不支援 SHA-256，無法建立或驗證自產備份");
    const bytes = new TextEncoder().encode(String(value));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashCanonicalValue(value) {
    return sha256Hex(canonicalStringify(value));
  }

  function jsonClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hasValue(value) {
    return value !== "" && value !== null && value !== undefined;
  }

  function finiteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function finiteNumericValue(value, options = {}) {
    const allowBlank = options.allowBlank !== false;
    if (value === "" || value === null || value === undefined) {
      return allowBlank ? { ok: true, value: "" } : { ok: false, error: "不可空白" };
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return { ok: false, error: "必須是有限數字" };
    if (options.min != null && parsed < options.min) return { ok: false, error: `不可小於 ${options.min}` };
    if (options.max != null && parsed > options.max) return { ok: false, error: `不可大於 ${options.max}` };
    return { ok: true, value: parsed };
  }

  function numericValidationMessage(label, result) {
    return `${label}${result?.error || "數值無效"}`;
  }

  function sourceSchemaNumber(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  }

  function migratedDimensionUnit(value, context = {}) {
    if (Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, value)) return value;
    if (hasValue(value)) return String(value);
    const sourceSchema = sourceSchemaNumber(context?.sourceSchemaVersion);
    if (sourceSchema != null && sourceSchema < 3) {
      const fallback = context?.legacyFallback;
      return Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, fallback) ? fallback : "cm";
    }
    return "";
  }

  function itemKind(item) {
    if (item?.item_kind === "custom") return "custom";
    if (item?.item_kind === "catalog") return item?.material_id ? "catalog" : "custom";
    return item?.material_id ? "catalog" : "custom";
  }

  function normalizeDimensionToCm(value, unit = "cm") {
    const normalizedUnit = String(unit || "cm").toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, normalizedUnit)) {
      throw new Error(`Unknown dimension unit: ${unit}`);
    }
    return Number((finiteNumber(value) * DIMENSION_UNIT_TO_CM[normalizedUnit]).toFixed(12));
  }

  function normalizedPositiveMaterialSpecNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "string" && !value.trim()) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    const normalized = Number(parsed.toFixed(MATERIAL_SPECIFICATION_PRECISION));
    return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
  }

  function materialSpecificationKey(material, thickness, width) {
    const unit = material?.dimension_unit;
    const factor = DIMENSION_UNIT_TO_CM[unit];
    const normalizedThickness = normalizedPositiveMaterialSpecNumber(thickness);
    const normalizedWidth = normalizedPositiveMaterialSpecNumber(width);
    if (!factor || normalizedThickness == null || normalizedWidth == null) return "";
    const thicknessCm = Number((normalizedThickness * factor).toFixed(MATERIAL_SPECIFICATION_PRECISION));
    const widthCm = Number((normalizedWidth * factor).toFixed(MATERIAL_SPECIFICATION_PRECISION));
    if (thicknessCm <= 0 || widthCm <= 0) return "";
    return `cm:${thicknessCm}|${widthCm}`;
  }

  function materialSpecificationDimensionCm(material, value) {
    const factor = DIMENSION_UNIT_TO_CM[material?.dimension_unit];
    const normalized = normalizedPositiveMaterialSpecNumber(value);
    if (!factor || normalized == null) return null;
    const centimeters = Number((normalized * factor).toFixed(MATERIAL_SPECIFICATION_PRECISION));
    return centimeters > 0 ? centimeters : null;
  }

  function normalizedMaterialSpecification(material, specification) {
    const validation = validateMaterialSpecificationInput(material, specification);
    return validation.ok ? validation.value : null;
  }

  function validateMaterialSpecificationInput(material, specification, stableId = "") {
    if (!specification || typeof specification !== "object" || Array.isArray(specification)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格必須是物件");
    }
    if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, material?.dimension_unit)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_UNIT, "材料尺寸單位無效");
    }
    const thickness = normalizedPositiveMaterialSpecNumber(specification.thickness);
    const width = normalizedPositiveMaterialSpecNumber(specification.width);
    const weight = normalizedPositiveMaterialSpecNumber(specification.weight);
    if (thickness == null) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_THICKNESS, "厚度必須是正數");
    if (width == null) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_WIDTH, "寬度必須是正數");
    if (weight == null) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_WEIGHT, "重量必須是正數");
    const key = materialSpecificationKey(material, thickness, width);
    if (!key) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "無法建立材料規格正規化鍵");
    const existingId = String(stableId || specification.id || "").trim();
    return materialSpecSuccess({
      id: existingId || `ms:${encodeURIComponent(String(material?.id || ""))}:${encodeURIComponent(key)}`,
      key,
      thickness,
      width,
      weight,
    });
  }

  function migrateMaterialSpecifications(material) {
    const source = material && typeof material === "object" ? material : {};
    const existingSchema = String(source.material_specifications_schema || "");
    const existingOrigin = String(source.material_specifications_origin || "");
    if (existingSchema && existingSchema !== MATERIAL_SPECIFICATIONS_SCHEMA) return { ...source };
    if (Object.prototype.hasOwnProperty.call(source, "specifications")) {
      if (existingOrigin === "legacy-incomplete" && Array.isArray(source.specifications) && source.specifications.length === 0) {
        const enrichedLegacySpecification = normalizedMaterialSpecification(source, {
          thickness: source.default_thickness,
          width: source.default_width,
          weight: source.default_weight,
        });
        return {
          ...source,
          material_specifications_schema: MATERIAL_SPECIFICATIONS_SCHEMA,
          material_specifications_origin: enrichedLegacySpecification ? "legacy-defaults" : "legacy-incomplete",
          specifications: enrichedLegacySpecification ? [enrichedLegacySpecification] : [],
        };
      }
      const specifications = Array.isArray(source.specifications)
        ? source.specifications.map((specification) => normalizedMaterialSpecification(source, specification) || deepClone(specification))
        : deepClone(source.specifications);
      return {
        ...source,
        material_specifications_schema: MATERIAL_SPECIFICATIONS_SCHEMA,
        specifications,
      };
    }
    const legacySpecification = normalizedMaterialSpecification(source, {
      thickness: source.default_thickness,
      width: source.default_width,
      weight: source.default_weight,
    });
    return {
      ...source,
      material_specifications_schema: MATERIAL_SPECIFICATIONS_SCHEMA,
      material_specifications_origin: legacySpecification ? "legacy-defaults" : "legacy-incomplete",
      specifications: legacySpecification ? [legacySpecification] : [],
    };
  }

  function materialSpecSuccess(value, extra = {}) {
    return { ok: true, code: MATERIAL_SPEC_ERROR_CODES.OK, value, ...extra };
  }

  function materialSpecFailure(code, error, extra = {}) {
    return { ok: false, code, error, ...extra };
  }

  function selectMaterialSpecificationData(state, materialId) {
    if (!state || typeof state !== "object" || !Array.isArray(state.materials)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_STATE, "材料 state 無效");
    }
    const material = state.materials.find((record) => record?.id === materialId);
    if (!material) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.MATERIAL_NOT_FOUND, "找不到指定材料");
    const migrated = migrateMaterialSpecifications(material);
    if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, migrated.dimension_unit)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_UNIT, "材料尺寸單位無效");
    }
    if (migrated.material_specifications_schema !== MATERIAL_SPECIFICATIONS_SCHEMA || !Array.isArray(migrated.specifications)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格資料格式無效");
    }
    const specifications = [];
    const keys = new Set();
    const ids = new Set();
    for (const rawSpecification of migrated.specifications) {
      const specification = normalizedMaterialSpecification(migrated, rawSpecification);
      if (!specification || keys.has(specification.key) || ids.has(specification.id)) {
        return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格資料無效或包含重複組合");
      }
      keys.add(specification.key);
      ids.add(specification.id);
      specifications.push(specification);
    }
    return materialSpecSuccess(specifications, { material: migrated });
  }

  function validateMaterialSpecifications(material) {
    if (!material || typeof material !== "object" || Array.isArray(material)) {
      return { ok: false, code: MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, error: "材料規格所屬材料無效", errors: ["材料規格所屬材料無效"] };
    }
    const selected = selectMaterialSpecificationData({ materials: [material] }, material.id);
    if (selected.ok) {
      return { ok: true, code: MATERIAL_SPEC_ERROR_CODES.OK, error: "", errors: [], specifications: deepClone(selected.value) };
    }
    return { ok: false, code: selected.code, error: selected.error, errors: [selected.error] };
  }

  function materialSpecificationActorCanWrite(actor) {
    if (!actor || actor.is_active === false) return false;
    if (!["owner", "admin", "staff"].includes(String(actor.role || ""))) return false;
    return actor.permissions?.edit_material_prices === true;
  }

  function mutateMaterialSpecifications(state, actor, materialId, mutation) {
    if (!materialSpecificationActorCanWrite(actor)) {
      return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.PERMISSION_DENIED, "目前帳號沒有修改材料規格的權限");
    }
    const selected = selectMaterialSpecificationData(state, materialId);
    if (!selected.ok) return selected;
    const mutationResult = mutation(selected.material, selected.value);
    if (!mutationResult.ok) return mutationResult;
    const nextState = deepClone(state);
    const materialIndex = nextState.materials.findIndex((record) => record?.id === materialId);
    if (materialIndex < 0) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.MATERIAL_NOT_FOUND, "找不到指定材料");
    nextState.materials[materialIndex] = {
      ...deepClone(selected.material),
      material_specifications_schema: MATERIAL_SPECIFICATIONS_SCHEMA,
      material_specifications_origin: "managed",
      specifications: deepClone(mutationResult.specifications),
    };
    const nextValidation = selectMaterialSpecificationData(nextState, materialId);
    if (!nextValidation.ok) return nextValidation;
    return materialSpecSuccess(deepClone(mutationResult.value), { nextState });
  }

  function createMaterialSpecificationStore(adapters = {}) {
    function readSelection(selector) {
      let currentState;
      try {
        currentState = adapters.getState?.();
      } catch (error) {
        return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_STATE, "無法讀取材料 state");
      }
      return selector(currentState);
    }

    function listSpecifications(materialId) {
      return readSelection((currentState) => {
        const selected = selectMaterialSpecificationData(currentState, materialId);
        return selected.ok ? materialSpecSuccess(deepClone(selected.value)) : selected;
      });
    }

    function listThicknessOptions(materialId) {
      return readSelection((currentState) => {
        const selected = selectMaterialSpecificationData(currentState, materialId);
        if (!selected.ok) return selected;
        const options = Array.from(new Set(selected.value.map((specification) => specification.thickness))).sort((left, right) => left - right);
        return materialSpecSuccess(options);
      });
    }

    function listWidthOptions(materialId, thickness) {
      return readSelection((currentState) => {
        const selected = selectMaterialSpecificationData(currentState, materialId);
        if (!selected.ok) return selected;
        const thicknessCm = materialSpecificationDimensionCm(selected.material, thickness);
        if (thicknessCm == null) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_THICKNESS, "厚度必須是正數");
        const options = Array.from(new Set(selected.value
          .filter((specification) => materialSpecificationDimensionCm(selected.material, specification.thickness) === thicknessCm)
          .map((specification) => specification.width)))
          .sort((left, right) => left - right);
        return materialSpecSuccess(options);
      });
    }

    function getWeight(materialId, thickness, width) {
      return readSelection((currentState) => {
        const selected = selectMaterialSpecificationData(currentState, materialId);
        if (!selected.ok) return selected;
        if (materialSpecificationDimensionCm(selected.material, thickness) == null) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_THICKNESS, "厚度必須是正數");
        }
        if (materialSpecificationDimensionCm(selected.material, width) == null) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_WIDTH, "寬度必須是正數");
        }
        const key = materialSpecificationKey(selected.material, thickness, width);
        const specification = selected.value.find((record) => record.key === key);
        if (!specification) return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.SPECIFICATION_NOT_FOUND, "找不到指定材料規格");
        return materialSpecSuccess(specification.weight, { specification: deepClone(specification) });
      });
    }

    function commit(mutation) {
      let previousState;
      let actor;
      try {
        previousState = adapters.getState?.();
        actor = adapters.getActor?.() || null;
      } catch (error) {
        return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.INVALID_STATE, "無法讀取材料 state 或目前帳號");
      }
      const result = mutation(previousState, actor);
      if (!result.ok) return result;
      try {
        if (typeof adapters.setState !== "function" || typeof adapters.saveState !== "function") throw new Error("missing persistence adapters");
        adapters.setState(result.nextState);
        if (adapters.saveState() !== true) throw new Error("save rejected");
      } catch (error) {
        try {
          if (typeof adapters.setState === "function") adapters.setState(previousState);
        } catch (rollbackError) {
          // The stable failure result remains fail-closed even if an adapter is broken.
        }
        return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.PERSISTENCE_FAILED, "材料規格儲存失敗，state 已回滾");
      }
      return materialSpecSuccess(deepClone(result.value));
    }

    function addSpecification(materialId, specification) {
      return commit((currentState, actor) => mutateMaterialSpecifications(currentState, actor, materialId, (material, specifications) => {
        const candidate = validateMaterialSpecificationInput(material, specification);
        if (!candidate.ok) return candidate;
        if (specifications.some((record) => record.key === candidate.value.key)) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.DUPLICATE, "相同厚度與寬度的規格已存在");
        }
        return materialSpecSuccess(candidate.value, { specifications: [...specifications, candidate.value] });
      }));
    }

    function updateSpecification(materialId, specificationId, patch) {
      return commit((currentState, actor) => mutateMaterialSpecifications(currentState, actor, materialId, (material, specifications) => {
        const normalizedId = String(specificationId || "").trim();
        const specificationIndex = specifications.findIndex((record) => record.id === normalizedId);
        if (specificationIndex < 0) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.SPECIFICATION_NOT_FOUND, "找不到指定材料規格");
        }
        const existing = specifications[specificationIndex];
        const sourcePatch = patch && typeof patch === "object" && !Array.isArray(patch) ? patch : {};
        const candidate = validateMaterialSpecificationInput(material, {
          thickness: Object.prototype.hasOwnProperty.call(sourcePatch, "thickness") ? sourcePatch.thickness : existing.thickness,
          width: Object.prototype.hasOwnProperty.call(sourcePatch, "width") ? sourcePatch.width : existing.width,
          weight: Object.prototype.hasOwnProperty.call(sourcePatch, "weight") ? sourcePatch.weight : existing.weight,
        }, existing.id);
        if (!candidate.ok) return candidate;
        if (specifications.some((record, index) => index !== specificationIndex && record.key === candidate.value.key)) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.DUPLICATE, "相同厚度與寬度的規格已存在");
        }
        const nextSpecifications = specifications.slice();
        nextSpecifications[specificationIndex] = candidate.value;
        return materialSpecSuccess(candidate.value, { specifications: nextSpecifications });
      }));
    }

    function deleteSpecification(materialId, specificationId) {
      return commit((currentState, actor) => mutateMaterialSpecifications(currentState, actor, materialId, (material, specifications) => {
        const normalizedId = String(specificationId || "").trim();
        const specificationIndex = specifications.findIndex((record) => record.id === normalizedId);
        if (specificationIndex < 0) {
          return materialSpecFailure(MATERIAL_SPEC_ERROR_CODES.SPECIFICATION_NOT_FOUND, "找不到指定材料規格");
        }
        const removed = specifications[specificationIndex];
        return materialSpecSuccess(removed, {
          specifications: specifications.filter((record) => record.id !== normalizedId),
        });
      }));
    }

    return Object.freeze({
      listSpecifications,
      listThicknessOptions,
      listWidthOptions,
      getWeight,
      addSpecification,
      updateSpecification,
      deleteSpecification,
    });
  }

  function materialCategorySuccess(value, extra = {}) {
    return { ok: true, code: MATERIAL_CATEGORY_ERROR_CODES.OK, value: deepClone(value), ...extra };
  }

  function materialCategoryFailure(code, error, extra = {}) {
    return { ok: false, code, error, value: null, ...extra };
  }

  function trimmedMaterialCategoryName(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function materialCategoryKey(value) {
    const name = trimmedMaterialCategoryName(value);
    if (!name) return "";
    return name.normalize("NFKC").replace(/\s+/g, " ").toLowerCase();
  }

  function normalizedMaterialCategory(value) {
    const name = trimmedMaterialCategoryName(typeof value === "string" ? value : value?.name);
    const key = materialCategoryKey(name);
    if (!name || !key) return null;
    return {
      id: `mc:${encodeURIComponent(key)}`,
      key,
      name,
    };
  }

  function migrateMaterialCategories(rawState) {
    const source = deepClone(rawState && typeof rawState === "object" && !Array.isArray(rawState) ? rawState : {});
    const existingSchema = String(source.material_categories_schema || "");
    if (existingSchema && existingSchema !== MATERIAL_CATEGORIES_SCHEMA) return source;

    if (Object.prototype.hasOwnProperty.call(source, "material_categories") && !Array.isArray(source.material_categories)) {
      return {
        ...source,
        material_categories_schema: MATERIAL_CATEGORIES_SCHEMA,
      };
    }

    const categories = [];
    const knownKeys = new Set();
    for (const rawCategory of Array.isArray(source.material_categories) ? source.material_categories : []) {
      const category = normalizedMaterialCategory(rawCategory);
      if (existingSchema === MATERIAL_CATEGORIES_SCHEMA) {
        categories.push(deepClone(rawCategory));
        if (category) knownKeys.add(category.key);
        continue;
      }
      if (!category) {
        categories.push(deepClone(rawCategory));
        continue;
      }
      if (knownKeys.has(category.key)) continue;
      categories.push(category);
      knownKeys.add(category.key);
    }

    for (const material of Array.isArray(source.materials) ? source.materials : []) {
      const category = normalizedMaterialCategory(material?.category);
      if (!category || knownKeys.has(category.key)) continue;
      categories.push(category);
      knownKeys.add(category.key);
    }

    return {
      ...source,
      material_categories_schema: MATERIAL_CATEGORIES_SCHEMA,
      material_categories: categories,
    };
  }

  function selectMaterialCategoryData(rawState) {
    if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
      return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_STATE, "材料分類 state 無效");
    }
    const state = migrateMaterialCategories(rawState);
    if (state.material_categories_schema !== MATERIAL_CATEGORIES_SCHEMA || !Array.isArray(state.material_categories)) {
      return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_DATA, "材料分類資料格式無效");
    }

    const categories = [];
    const ids = new Set();
    const keys = new Set();
    for (const rawCategory of state.material_categories) {
      const category = normalizedMaterialCategory(rawCategory);
      if (!category
        || typeof rawCategory !== "object"
        || Array.isArray(rawCategory)
        || rawCategory.id !== category.id
        || rawCategory.key !== category.key
        || rawCategory.name !== category.name
        || ids.has(category.id)
        || keys.has(category.key)) {
        return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_DATA, "材料分類資料無效或包含重複分類");
      }
      ids.add(category.id);
      keys.add(category.key);
      categories.push(category);
    }
    return materialCategorySuccess(categories, { state });
  }

  function validateMaterialCategories(state) {
    const selected = selectMaterialCategoryData(state);
    if (selected.ok) {
      return { ok: true, code: MATERIAL_CATEGORY_ERROR_CODES.OK, error: "", errors: [], categories: deepClone(selected.value) };
    }
    return { ok: false, code: selected.code, error: selected.error, errors: [selected.error], categories: [] };
  }

  function createMaterialCategoryStore(adapters = {}) {
    function readSelection(selector) {
      let currentState;
      try {
        currentState = adapters.getState?.();
      } catch (error) {
        return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_STATE, "無法讀取材料分類 state");
      }
      return selector(currentState);
    }

    function listCategories() {
      return readSelection((currentState) => {
        const selected = selectMaterialCategoryData(currentState);
        return selected.ok ? materialCategorySuccess(selected.value) : selected;
      });
    }

    function selectCategory(categoryIdOrName) {
      return readSelection((currentState) => {
        const selected = selectMaterialCategoryData(currentState);
        if (!selected.ok) return selected;
        const query = trimmedMaterialCategoryName(categoryIdOrName);
        const key = materialCategoryKey(query);
        if (!query) return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_NAME, "分類名稱或識別碼不可空白");
        const category = selected.value.find((record) => record.id === query)
          || selected.value.find((record) => record.key === query || record.key === key);
        return category
          ? materialCategorySuccess(category)
          : materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.NOT_FOUND, "找不到指定材料分類");
      });
    }

    function commit(mutation) {
      let previousState;
      let actor;
      try {
        previousState = adapters.getState?.();
        actor = adapters.getActor?.() || null;
      } catch (error) {
        return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_STATE, "無法讀取材料分類 state 或目前帳號");
      }
      if (!materialSpecificationActorCanWrite(actor)) {
        return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.PERMISSION_DENIED, "目前帳號沒有修改材料分類的權限");
      }
      const result = mutation(previousState);
      if (!result.ok) return result;
      try {
        if (typeof adapters.setState !== "function" || typeof adapters.saveState !== "function") throw new Error("missing persistence adapters");
        adapters.setState(result.nextState);
        if (adapters.saveState() !== true) throw new Error("save rejected");
      } catch (error) {
        try {
          if (typeof adapters.setState === "function") adapters.setState(previousState);
        } catch (rollbackError) {
          // The stable failure result remains fail-closed even if an adapter is broken.
        }
        return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.PERSISTENCE_FAILED, "材料分類儲存失敗，state 已回滾");
      }
      return materialCategorySuccess(result.value);
    }

    function createCategory(name) {
      return commit((currentState) => {
        const selected = selectMaterialCategoryData(currentState);
        if (!selected.ok) return selected;
        const category = normalizedMaterialCategory(name);
        if (!category) return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.INVALID_NAME, "分類名稱不可空白");
        if (selected.value.some((record) => record.key === category.key)) {
          return materialCategoryFailure(MATERIAL_CATEGORY_ERROR_CODES.DUPLICATE, "相同材料分類已存在");
        }
        const nextState = deepClone(selected.state);
        nextState.material_categories.push(category);
        const nextValidation = selectMaterialCategoryData(nextState);
        if (!nextValidation.ok) return nextValidation;
        return materialCategorySuccess(category, { nextState });
      });
    }

    return Object.freeze({
      listCategories,
      selectCategory,
      createCategory,
    });
  }

  function quoteMaterialSpecFailure(code, error) {
    return { ok: false, code, error, value: null };
  }

  function quoteMaterialSpecSuccess(value, extra = {}) {
    return { ok: true, code: QUOTE_MATERIAL_SPEC_ERROR_CODES.OK, error: "", value: deepClone(value), ...extra };
  }

  function quoteActorCanWrite(actor, canWriteQuote) {
    return Boolean(actor
      && actor.is_active !== false
      && ["owner", "admin", "staff"].includes(String(actor.role || ""))
      && canWriteQuote === true);
  }

  function mappedQuoteMaterialSpecFailure(result) {
    if (result?.code === MATERIAL_SPEC_ERROR_CODES.MATERIAL_NOT_FOUND) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.MATERIAL_NOT_FOUND, "找不到指定材料");
    }
    if (result?.code === MATERIAL_SPEC_ERROR_CODES.SPECIFICATION_NOT_FOUND) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.PAIR_NOT_FOUND, "找不到指定厚度與寬度的材料規格組合");
    }
    return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, result?.error || "材料規格資料無效");
  }

  function selectQuoteMaterialSpecification(item, selection = {}, context = {}) {
    if (!quoteActorCanWrite(context?.actor, context?.canWriteQuote)) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.PERMISSION_DENIED, "目前帳號沒有修改報價的權限");
    }
    if (!QUOTE_EDITABLE_STATUSES.has(context?.status || "draft")) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.QUOTE_LOCKED, "目前報價狀態不可修改材料規格");
    }
    const materialId = String(selection?.materialId || "").trim();
    if (!materialId) return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.MATERIAL_NOT_FOUND, "找不到指定材料");
    if (!item || typeof item !== "object") {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.ITEM_NOT_FOUND, "找不到指定報價項目");
    }
    if (itemKind(item) !== "catalog" || String(item.material_id || "") !== materialId) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.ITEM_NOT_CATALOG, "報價項目未連結指定材料主檔");
    }
    if (selection?.thickness === "" || selection?.thickness == null) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.THICKNESS_REQUIRED, "請先選擇厚度");
    }
    if (selection?.width === "" || selection?.width == null) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.WIDTH_REQUIRED, "請選擇寬度");
    }
    const dimensionUnit = String(item.dimension_unit || "");
    if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, dimensionUnit) || typeof context?.getWeight !== "function") {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格單位或解析契約無效");
    }

    let resolved;
    try {
      resolved = context.getWeight(materialId, selection.thickness, selection.width);
    } catch (error) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格解析失敗");
    }
    if (!resolved?.ok) return mappedQuoteMaterialSpecFailure(resolved);
    const specification = resolved.specification;
    const thickness = Number(specification?.thickness);
    const width = Number(specification?.width);
    const weight = Number(resolved.value);
    const specificationWeight = Number(specification?.weight);
    if (!specification
      || !String(specification.id || "").trim()
      || !String(specification.key || "").trim()
      || !Number.isFinite(thickness) || thickness <= 0
      || !Number.isFinite(width) || width <= 0
      || !Number.isFinite(weight) || weight <= 0
      || !Number.isFinite(specificationWeight) || specificationWeight <= 0
      || weight !== specificationWeight) {
      return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_DATA, "材料規格解析結果與選定組合不一致");
    }
    const snapshot = {
      schema: QUOTE_MATERIAL_SPECIFICATION_SNAPSHOT_SCHEMA,
      source_schema: MATERIAL_SPECIFICATIONS_SCHEMA,
      source_contract: "MaterialSpecifications.getWeight",
      material_id: materialId,
      specification_id: String(specification.id),
      specification_key: String(specification.key),
      dimension_unit: dimensionUnit,
      thickness,
      width,
      weight,
      selected_at: context?.selectedAt || new Date().toISOString(),
    };
    const nextItem = {
      ...deepClone(item),
      thickness,
      width,
      weight,
      dimension_unit: dimensionUnit,
      material_specification_snapshot: snapshot,
    };
    return quoteMaterialSpecSuccess(nextItem, { snapshot: deepClone(snapshot) });
  }

  function createQuoteMaterialSpecificationStore(adapters = {}) {
    function selectSpecification(input = {}) {
      let previousDraft;
      let actor;
      let canWriteQuote = false;
      try {
        previousDraft = adapters.getDraft?.();
        actor = adapters.getActor?.() || null;
        canWriteQuote = adapters.canWriteQuote?.(actor) === true;
      } catch (error) {
        return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_STATE, "無法讀取報價草稿或目前帳號");
      }
      if (!previousDraft || typeof previousDraft !== "object") {
        return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.INVALID_STATE, "找不到報價草稿");
      }
      const sectionIndex = Number(input.sectionIndex);
      const itemIndex = Number(input.itemIndex);
      const sourceItem = previousDraft?.sections?.[sectionIndex]?.items?.[itemIndex];
      if (!sourceItem) return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.ITEM_NOT_FOUND, "找不到指定報價項目");
      const selected = selectQuoteMaterialSpecification(sourceItem, input, {
        actor,
        canWriteQuote,
        status: previousDraft.status || "draft",
        getWeight: adapters.getWeight,
        selectedAt: adapters.now?.() || new Date().toISOString(),
      });
      if (!selected.ok) return selected;

      const nextDraft = deepClone(previousDraft);
      nextDraft.sections[sectionIndex].items[itemIndex] = deepClone(selected.value);
      const lineId = selected.value.line_id;
      let previousTrustedSelection;
      try {
        previousTrustedSelection = adapters.getTrustedSelection?.(lineId);
        if (typeof adapters.setDraft !== "function" || typeof adapters.saveDraft !== "function") throw new Error("missing draft persistence adapters");
        adapters.setDraft(nextDraft);
        if (typeof adapters.setTrustedSelection === "function") adapters.setTrustedSelection(lineId, deepClone(selected.snapshot));
        if (adapters.saveDraft() !== true) throw new Error("draft save rejected");
      } catch (error) {
        try {
          if (typeof adapters.setDraft === "function") adapters.setDraft(previousDraft);
          if (typeof adapters.setTrustedSelection === "function") adapters.setTrustedSelection(lineId, previousTrustedSelection ?? null);
        } catch (rollbackError) {
          // Preserve the stable fail-closed result if an adapter cannot roll back.
        }
        return quoteMaterialSpecFailure(QUOTE_MATERIAL_SPEC_ERROR_CODES.PERSISTENCE_FAILED, "報價規格儲存失敗，草稿已回滾");
      }
      return quoteMaterialSpecSuccess(selected.value, { snapshot: deepClone(selected.snapshot) });
    }

    return Object.freeze({ selectSpecification });
  }

  function itemDimensionUnit(item, field) {
    return item?.[`${field}_unit`] || item?.dimension_unit || "cm";
  }

  function normalizedDimensionsCm(item) {
    return {
      thickness: normalizeDimensionToCm(item?.thickness, itemDimensionUnit(item, "thickness")),
      width: normalizeDimensionToCm(item?.width, itemDimensionUnit(item, "width")),
      length: normalizeDimensionToCm(item?.length, itemDimensionUnit(item, "length")),
    };
  }

  function buildFormulaTrace(item, pricingType = item?.pricing_type, formulaVersion = item?.formula_version || "legacy-v1") {
    return {
      pricing_type: pricingType || "single",
      formula_version: formulaVersion,
      formula_source: formulaSourceSnapshotFor(item) || (formulaVersion === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式"),
      input_unit: item?.dimension_unit || "cm",
      normalized_unit: "cm",
      dimensions_cm: normalizedDimensionsCm(item),
    };
  }

  function formatLocalDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addCalendarDays(dateISO, days) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateISO || ""));
    if (!match) return "";
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    return formatLocalDate(date);
  }

  function isNumericCredential(value) {
    return /^\d{3,20}$/.test(String(value || ""));
  }

  async function hashPin(value) {
    const bytes = new TextEncoder().encode(String(value || ""));
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function nextQuoteNo(dateISO, quotes = [], reservedSequence = 0) {
    const compactDate = String(dateISO || formatLocalDate()).replaceAll("-", "");
    const prefix = `Q-${compactDate}-`;
    const highest = quotes.reduce((max, quote) => {
      const quoteNo = String(quote?.quote_no || "");
      if (!quoteNo.startsWith(prefix)) return max;
      const sequence = Number(quoteNo.slice(prefix.length));
      return Number.isInteger(sequence) ? Math.max(max, sequence) : max;
    }, Math.max(0, Number(reservedSequence) || 0));
    return `${prefix}${String(highest + 1).padStart(3, "0")}`;
  }

  function missingFormulaFields(item) {
    const requirements = {
      wood_board_tsai: ["thickness", "width", "length"],
      wood_tsai: ["thickness", "width", "length"],
      by_length: ["length"],
      by_area: ["width", "length"],
      by_volume: ["thickness", "width", "length"],
      steel_rect_tube: ["thickness", "width", "length", "wall_thickness_mm", "density_factor"],
      steel_round_tube: ["width", "length", "wall_thickness_mm", "density_factor"],
    };
    const labels = {
      thickness: "厚度",
      width: "寬度／外徑",
      length: "長度",
      wall_thickness_mm: "壁厚",
      density_factor: "重量換算係數",
    };
    return (requirements[item?.pricing_type] || []).filter((field) => !(Number(item?.[field]) > 0)).map((field) => labels[field]);
  }

  function computePriceableQuantity(item, pricingType = item?.pricing_type, formulaVersion = item?.formula_version || "legacy-v1") {
    if (!KNOWN_FORMULA_VERSIONS.has(formulaVersion)) {
      throw new Error(`Unknown formula version: ${formulaVersion}`);
    }
    if (!KNOWN_PRICING_TYPES.has(pricingType)) {
      throw new Error(`Unknown pricing type: ${pricingType}`);
    }
    const number = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const qty = number(item?.quantity || 1);
    const dimensions = normalizedDimensionsCm(item);
    const thickness = dimensions.thickness;
    const width = dimensions.width;
    const length = dimensions.length;
    const wall = number(item?.wall_thickness_mm);
    const factor = number(item?.density_factor || 0.02466);
    const boardFootDivisor = formulaVersion === "excel-1150709-v1" ? 2781 : 2782;
    const pi = formulaVersion === "excel-1150709-v1" ? 3.1416 : Math.PI;
    switch (pricingType) {
      case "wood_board_tsai":
        return (thickness * width * length * qty) / boardFootDivisor;
      case "wood_tsai":
        return (thickness * width * length * qty) / 278;
      case "by_length":
        return (length / 100) * qty;
      case "by_area":
        return (width * length * qty) / 10000;
      case "by_volume":
        return (thickness * width * length * qty) / 1000000;
      case "steel_rect_tube": {
        const equivalentDiameterMm = ((2 * thickness + 2 * width) / pi) * 10;
        return Math.max(0, equivalentDiameterMm - wall) * wall * factor * (((length || 100) * qty) / 100);
      }
      case "steel_round_tube": {
        const outerDiameterMm = width * 10;
        return Math.max(0, outerDiameterMm - wall) * wall * factor * (((length || 100) * qty) / 100);
      }
      case "single":
      default:
        return qty;
    }
  }

  function excelRound(value, digits = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const places = Number.isInteger(Number(digits)) ? Number(digits) : 0;
    const factor = 10 ** Math.abs(places);
    const scaled = places >= 0 ? Math.abs(numeric) * factor : Math.abs(numeric) / factor;
    const rounded = Math.round((scaled + Number.EPSILON) * 1e12) / 1e12;
    const result = places >= 0 ? rounded / factor : rounded * factor;
    return Number((Math.sign(numeric) * result).toFixed(Math.max(0, places)));
  }

  function excelForwardNumeric(value, label, errors, options = {}) {
    const result = finiteNumericValue(value, {
      allowBlank: options.allowBlank === true,
      min: options.min,
      max: options.max,
    });
    if (!result.ok) {
      errors.push(numericValidationMessage(label, result));
      return options.fallback ?? 0;
    }
    return result.value === "" ? options.fallback ?? 0 : result.value;
  }

  function excelForwardInputSnapshot(section, laborConfig) {
    const items = (Array.isArray(section?.items) ? section.items : []).map((item) => ({
      line_id: item?.line_id || "",
      name: item?.name || "",
      pricing_type: item?.pricing_type || "single",
      formula_version: item?.formula_version || "legacy-v1",
      dimension_unit: item?.dimension_unit || "",
      thickness: item?.thickness ?? "",
      width: item?.width ?? "",
      length: item?.length ?? "",
      weight: item?.weight ?? "",
      ...(item?.material_specification_snapshot
        ? { material_specification_snapshot: deepClone(item.material_specification_snapshot) }
        : {}),
      quantity: item?.quantity ?? "",
      waste_pct: item?.waste_pct ?? 0,
      unit: item?.unit || "",
      actual_unit_price: item?.actual_unit_price ?? item?.unit_price ?? "",
      standard_budget_unit_price: item?.standard_budget_unit_price ?? "",
      catalog_sale_unit_price: item?.catalog_sale_unit_price ?? "",
      default_actual_unit_price: item?.default_actual_unit_price ?? "",
      cost_price: item?.cost_price_status === "verified" ? item?.cost_price ?? "" : "",
      cost_price_status: item?.cost_price_status || "unverified",
      is_chargeable: item?.is_chargeable !== false,
      breakdown_adjustment_qty: item?.breakdown_adjustment_qty ?? 0,
      breakdown_adjustment_reason: item?.breakdown_adjustment_reason || "",
    }));
    return deepClone({
      calculation_mode: EXCEL_FORWARD_CALCULATION_MODE,
      work_item_quantity: section?.area_qty ?? "",
      work_item_unit: section?.unit || "",
      items,
      labor_config: laborConfig,
      ...(section?.labor_detail_contract
        ? { labor_detail_contract: section.labor_detail_contract }
        : {}),
    });
  }

  function laborDetailFailure(section, code, error) {
    return {
      ok: false,
      code,
      error,
      changed: false,
      section: deepClone(section || {}),
    };
  }

  function laborDetailActorSnapshot(actor) {
    return {
      id: String(actor?.id || ""),
      name: String(actor?.name || ""),
      role: String(actor?.role || ""),
    };
  }

  function laborDetailActionGuard(input) {
    if (!isKnownLocalQuoteActor(input?.actor)) {
      return laborDetailFailure(input?.section, QUOTE_LABOR_DETAIL_ERROR_CODES.PERMISSION_DENIED, "目前角色不可調整報價工料明細");
    }
    const status = String(input?.quoteStatus || "draft");
    if (!QUOTE_EDITABLE_STATUSES.has(status)) {
      return laborDetailFailure(input?.section, QUOTE_LABOR_DETAIL_ERROR_CODES.QUOTE_LOCKED, "報價已送審或鎖定，不能調整工料明細");
    }
    if (!input?.section || input.section.calculation_mode !== EXCEL_FORWARD_CALCULATION_MODE) {
      return laborDetailFailure(input?.section, QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE, "只有 Excel 正向公式工項可使用工料明細契約");
    }
    const at = String(input?.at || new Date().toISOString());
    if (!at || Number.isNaN(new Date(at).getTime())) {
      return laborDetailFailure(input?.section, QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE, "工料明細異動時間格式不正確");
    }
    return { ok: true, at };
  }

  function buildExcelLaborDefaultSnapshot(input = {}) {
    const laborSubtotalTarget = Number(input.laborSubtotalTarget || 0);
    const boardFootTotal = Number(input.boardFootTotal || 0);
    const laborConfig = deepClone(input.laborConfig || {});
    const overheadRows = EXCEL_FORWARD_CONSTANTS.labor_overhead_weights.map((factor, index) => {
      const baseValue = excelRound(laborSubtotalTarget * factor, 3);
      const definition = EXCEL_LABOR_ROW_DEFINITIONS[index];
      return {
        ...definition,
        factor,
        base_value: baseValue,
        quantity: 1,
        amount: excelRound(baseValue, 0),
      };
    });
    const overheadTotal = overheadRows.reduce((sum, row) => sum + row.amount, 0);
    const residual = laborSubtotalTarget - overheadTotal;
    const tradeRow = (definition, factor, baseValue) => {
      const allocationAmount = excelRound(residual * factor, 0);
      const quantity = baseValue > 0 ? excelRound(allocationAmount / baseValue, 3) : 0;
      return {
        ...definition,
        factor,
        base_value: baseValue,
        quantity,
        amount: excelRound(baseValue * quantity, 0),
      };
    };
    const rows = [
      ...overheadRows,
      tradeRow(EXCEL_LABOR_ROW_DEFINITIONS[4], laborConfig.carpenter_allocation, laborConfig.carpenter_daily_rate),
      tradeRow(EXCEL_LABOR_ROW_DEFINITIONS[5], laborConfig.metalworker_allocation, laborConfig.metalworker_daily_rate),
    ];
    return {
      schema: EXCEL_LABOR_DEFAULT_SNAPSHOT_SCHEMA,
      formula_version: EXCEL_FORWARD_FORMULA_VERSION,
      captured_at: String(input.capturedAt || new Date().toISOString()),
      source_workbooks: EXCEL_SOURCE_WORKBOOKS.map((source) => ({ ...source })),
      basis: {
        board_foot_total: boardFootTotal,
        labor_subtotal_target: laborSubtotalTarget,
        overhead_total: overheadTotal,
        residual,
        labor_config: laborConfig,
      },
      rows,
    };
  }

  function normalizeExcelLaborDefaultSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      return { ok: false, error: "工料預設快照不存在" };
    }
    if (snapshot.schema !== EXCEL_LABOR_DEFAULT_SNAPSHOT_SCHEMA
      || snapshot.formula_version !== EXCEL_FORWARD_FORMULA_VERSION
      || !String(snapshot.captured_at || "").trim()) {
      return { ok: false, error: "工料預設快照格式或公式版本無效" };
    }
    const sourceHashes = Array.isArray(snapshot.source_workbooks)
      ? snapshot.source_workbooks.map((source) => String(source?.sha256 || "").toUpperCase())
      : [];
    if (canonicalStringify(sourceHashes) !== canonicalStringify(EXCEL_SOURCE_WORKBOOKS.map((source) => source.sha256))) {
      return { ok: false, error: "工料預設快照的來源活頁簿雜湊不符" };
    }
    const basisFields = ["board_foot_total", "labor_subtotal_target", "overhead_total", "residual"];
    if (!snapshot.basis || basisFields.some((field) => !Number.isFinite(Number(snapshot.basis[field])) || Number(snapshot.basis[field]) < 0)) {
      return { ok: false, error: "工料預設快照的計算基準無效" };
    }
    const laborConfigFields = [
      "labor_per_board_foot",
      "carpenter_allocation",
      "metalworker_allocation",
      "carpenter_daily_rate",
      "metalworker_daily_rate",
    ];
    if (!snapshot.basis.labor_config
      || laborConfigFields.some((field) => !Number.isFinite(Number(snapshot.basis.labor_config[field])) || Number(snapshot.basis.labor_config[field]) < 0)) {
      return { ok: false, error: "工料預設快照的公式輸入無效" };
    }
    if (!Array.isArray(snapshot.rows) || snapshot.rows.length !== EXCEL_LABOR_ROW_DEFINITIONS.length) {
      return { ok: false, error: "工料預設快照的列數不正確" };
    }
    const rows = [];
    for (let index = 0; index < EXCEL_LABOR_ROW_DEFINITIONS.length; index += 1) {
      const definition = EXCEL_LABOR_ROW_DEFINITIONS[index];
      const row = snapshot.rows[index];
      if (!row || row.row_id !== definition.row_id || row.kind !== definition.kind) {
        return { ok: false, error: "工料預設快照的列識別不正確" };
      }
      const name = String(row.name || "").trim();
      const unit = String(row.unit || "").trim();
      if (!name || !unit) return { ok: false, error: "工料預設快照的名稱或單位無效" };
      const numeric = {};
      for (const field of EXCEL_LABOR_NUMERIC_FIELDS) {
        const value = finiteNumericValue(row[field], { allowBlank: false, min: 0 });
        if (!value.ok) return { ok: false, error: "工料預設快照含有無效數字" };
        numeric[field] = value.value;
      }
      const amount = excelRound(numeric.base_value * numeric.quantity, 0);
      if (!Number.isFinite(Number(row.amount)) || Number(row.amount) !== amount) {
        return { ok: false, error: "工料預設快照含有可被直接改寫的衍生金額" };
      }
      rows.push({ ...definition, name, unit, ...numeric, amount });
    }
    return {
      ok: true,
      value: {
        schema: EXCEL_LABOR_DEFAULT_SNAPSHOT_SCHEMA,
        formula_version: EXCEL_FORWARD_FORMULA_VERSION,
        captured_at: String(snapshot.captured_at),
        source_workbooks: EXCEL_SOURCE_WORKBOOKS.map((source) => ({ ...source })),
        basis: deepClone(snapshot.basis),
        rows,
      },
    };
  }

  function normalizeExcelLaborDetailContract(contract) {
    if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
      return { ok: false, error: "工料明細契約不存在" };
    }
    if (contract.schema !== EXCEL_LABOR_DETAIL_SCHEMA
      || contract.formula_version !== EXCEL_FORWARD_FORMULA_VERSION
      || !String(contract.created_at || "").trim()) {
      return { ok: false, error: "工料明細契約格式或公式版本無效" };
    }
    const contractSourceHashes = Array.isArray(contract.source_workbooks)
      ? contract.source_workbooks.map((source) => String(source?.sha256 || "").toUpperCase())
      : [];
    if (canonicalStringify(contractSourceHashes) !== canonicalStringify(EXCEL_SOURCE_WORKBOOKS.map((source) => source.sha256))) {
      return { ok: false, error: "工料明細契約的來源活頁簿雜湊不符" };
    }
    const normalizedSnapshot = normalizeExcelLaborDefaultSnapshot(contract.default_snapshot);
    if (!normalizedSnapshot.ok) return normalizedSnapshot;
    const defaultRows = new Map(normalizedSnapshot.value.rows.map((row) => [row.row_id, row]));
    const sourceOverrides = contract.overrides && typeof contract.overrides === "object" && !Array.isArray(contract.overrides)
      ? contract.overrides
      : {};
    const overrides = {};
    for (const [rowId, record] of Object.entries(sourceOverrides)) {
      if (!defaultRows.has(rowId) || !record || typeof record !== "object" || Array.isArray(record)) {
        return { ok: false, error: "工料人工調整的列識別無效" };
      }
      const values = record.values && typeof record.values === "object" && !Array.isArray(record.values) ? record.values : {};
      if (!Object.keys(values).length || Object.keys(values).some((field) => !EXCEL_LABOR_EDITABLE_FIELDS.has(field))) {
        return { ok: false, error: "工料人工調整包含不可寫入欄位" };
      }
      const normalizedValues = {};
      for (const [field, rawValue] of Object.entries(values)) {
        if (EXCEL_LABOR_NUMERIC_FIELDS.has(field)) {
          const value = finiteNumericValue(rawValue, { allowBlank: false, min: 0 });
          if (!value.ok) return { ok: false, error: "工料人工調整含有無效數字" };
          normalizedValues[field] = value.value;
        } else {
          const value = String(rawValue || "").trim();
          if (!value) return { ok: false, error: "工料人工調整的名稱或單位無效" };
          normalizedValues[field] = value;
        }
      }
      overrides[rowId] = {
        values: normalizedValues,
        updated_at: String(record.updated_at || ""),
        updated_by: laborDetailActorSnapshot(record.updated_by),
      };
      if (!overrides[rowId].updated_at || !isKnownLocalQuoteActor(overrides[rowId].updated_by)) {
        return { ok: false, error: "工料人工調整缺少異動人或時間" };
      }
    }
    const audit = Array.isArray(contract.audit) ? deepClone(contract.audit) : [];
    try {
      canonicalStringify(audit);
    } catch (error) {
      return { ok: false, error: "工料人工調整歷史含有無效資料" };
    }
    for (const event of audit) {
      if (!event || !["override", "reset"].includes(String(event.action || ""))
        || !String(event.at || "").trim()
        || !isKnownLocalQuoteActor(event.actor)) {
        return { ok: false, error: "工料人工調整歷史格式無效" };
      }
      if (event.action === "override" && !defaultRows.has(String(event.row_id || ""))) {
        return { ok: false, error: "工料人工調整歷史的列識別無效" };
      }
    }
    return {
      ok: true,
      value: {
        schema: EXCEL_LABOR_DETAIL_SCHEMA,
        formula_version: EXCEL_FORWARD_FORMULA_VERSION,
        created_at: String(contract.created_at),
        source_workbooks: EXCEL_SOURCE_WORKBOOKS.map((source) => ({ ...source })),
        default_snapshot: normalizedSnapshot.value,
        overrides,
        audit,
      },
    };
  }

  function excelLaborDetailContractFromSnapshot(defaultSnapshot, createdAt) {
    return {
      schema: EXCEL_LABOR_DETAIL_SCHEMA,
      formula_version: EXCEL_FORWARD_FORMULA_VERSION,
      created_at: String(createdAt || defaultSnapshot.captured_at),
      source_workbooks: EXCEL_SOURCE_WORKBOOKS.map((source) => ({ ...source })),
      default_snapshot: deepClone(defaultSnapshot),
      overrides: {},
      audit: [],
    };
  }

  function resolveExcelLaborDetailRows(section, generatedDefaultSnapshot) {
    let contract = null;
    let defaultSnapshot = generatedDefaultSnapshot;
    const errors = [];
    if (section?.labor_detail_contract) {
      const normalized = normalizeExcelLaborDetailContract(section.labor_detail_contract);
      if (!normalized.ok) errors.push(normalized.error);
      else {
        contract = normalized.value;
        defaultSnapshot = contract.default_snapshot;
      }
    }
    const overrides = contract?.overrides || {};
    const rows = defaultSnapshot.rows.map((defaultRow) => {
      const values = overrides[defaultRow.row_id]?.values || {};
      const effective = { ...defaultRow, ...values };
      return {
        ...effective,
        amount: excelRound(effective.base_value * effective.quantity, 0),
        is_overridden: Object.keys(values).length > 0,
      };
    });
    return {
      ok: errors.length === 0,
      errors,
      contract,
      defaultSnapshot,
      rows,
      hasOverrides: Object.keys(overrides).length > 0,
    };
  }

  function initializeExcelLaborDetail(input = {}) {
    const guard = laborDetailActionGuard(input);
    if (!guard.ok) return guard;
    if (input.section.labor_detail_contract) {
      const normalized = normalizeExcelLaborDetailContract(input.section.labor_detail_contract);
      if (!normalized.ok) {
        return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.DEFAULT_SNAPSHOT_INVALID, normalized.error);
      }
      const section = deepClone(input.section);
      section.labor_detail_contract = normalized.value;
      return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: false, section };
    }
    const formulaSection = deepClone(input.section);
    delete formulaSection.labor_detail_contract;
    const calculated = calculateExcelQuoteSection(formulaSection, { calculatedAt: guard.at });
    if (!calculated.ok) {
      return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE, calculated.errors[0] || "無法建立工料預設快照");
    }
    const section = deepClone(input.section);
    section.labor_detail_contract = excelLaborDetailContractFromSnapshot(calculated.laborDist.defaultSnapshot, guard.at);
    return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: true, section };
  }

  function applyExcelLaborDetailOverride(input = {}) {
    const initialized = initializeExcelLaborDetail(input);
    if (!initialized.ok) return initialized;
    const rowId = String(input?.rowId || "").trim();
    const contract = initialized.section.labor_detail_contract;
    const defaultRow = contract.default_snapshot.rows.find((row) => row.row_id === rowId);
    if (!defaultRow) {
      return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.ROW_NOT_FOUND, "找不到指定工料列");
    }
    const patch = input?.patch && typeof input.patch === "object" && !Array.isArray(input.patch) ? input.patch : {};
    const fields = Object.keys(patch);
    if (!fields.length || fields.some((field) => !EXCEL_LABOR_EDITABLE_FIELDS.has(field))) {
      return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.FIELD_NOT_EDITABLE, "列金額與其他衍生欄位不可直接寫入");
    }
    const currentValues = contract.overrides[rowId]?.values || {};
    const effective = { ...defaultRow, ...currentValues };
    for (const field of fields) {
      if (EXCEL_LABOR_NUMERIC_FIELDS.has(field)) {
        const value = finiteNumericValue(patch[field], { allowBlank: false, min: 0 });
        if (!value.ok) {
          return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_NUMBER, numericValidationMessage(defaultRow.name, value));
        }
        effective[field] = value.value;
      } else {
        const value = String(patch[field] || "").trim();
        if (!value) {
          return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_TEXT, "工料名稱與單位不可為空白");
        }
        effective[field] = value;
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, "factor") && !Object.prototype.hasOwnProperty.call(patch, "base_value") && defaultRow.kind === "overhead") {
      effective.base_value = excelRound(contract.default_snapshot.basis.labor_subtotal_target * effective.factor, 3);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "factor") && !Object.prototype.hasOwnProperty.call(patch, "quantity") && defaultRow.kind === "trade") {
      const allocationAmount = excelRound(contract.default_snapshot.basis.residual * effective.factor, 0);
      effective.quantity = effective.base_value > 0 ? excelRound(allocationAmount / effective.base_value, 3) : 0;
    }
    const nextValues = {};
    for (const field of EXCEL_LABOR_EDITABLE_FIELDS) {
      if (effective[field] !== defaultRow[field]) nextValues[field] = effective[field];
    }
    const previousJson = canonicalStringify(currentValues);
    const nextJson = canonicalStringify(nextValues);
    if (previousJson === nextJson) {
      return { ...initialized, changed: initialized.changed };
    }
    const section = deepClone(initialized.section);
    const actor = laborDetailActorSnapshot(input.actor);
    if (Object.keys(nextValues).length) {
      section.labor_detail_contract.overrides[rowId] = {
        values: nextValues,
        updated_at: String(input.at || new Date().toISOString()),
        updated_by: actor,
      };
    } else {
      delete section.labor_detail_contract.overrides[rowId];
    }
    section.labor_detail_contract.audit.push({
      action: "override",
      row_id: rowId,
      values: deepClone(nextValues),
      at: String(input.at || new Date().toISOString()),
      actor,
    });
    return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: true, section };
  }

  function resetExcelLaborDetailOverrides(input = {}) {
    const guard = laborDetailActionGuard(input);
    if (!guard.ok) return guard;
    if (!input.section.labor_detail_contract) {
      return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: false, section: deepClone(input.section) };
    }
    const normalized = normalizeExcelLaborDetailContract(input.section.labor_detail_contract);
    if (!normalized.ok) {
      return laborDetailFailure(input.section, QUOTE_LABOR_DETAIL_ERROR_CODES.DEFAULT_SNAPSHOT_INVALID, normalized.error);
    }
    if (!Object.keys(normalized.value.overrides).length) {
      const section = deepClone(input.section);
      section.labor_detail_contract = normalized.value;
      return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: false, section };
    }
    const section = deepClone(input.section);
    section.labor_detail_contract = normalized.value;
    section.labor_detail_contract.overrides = {};
    section.labor_detail_contract.audit.push({
      action: "reset",
      at: guard.at,
      actor: laborDetailActorSnapshot(input.actor),
    });
    return { ok: true, code: QUOTE_LABOR_DETAIL_ERROR_CODES.OK, error: "", changed: true, section };
  }

  function calculateExcelQuoteSection(section = {}, options = {}) {
    const errors = [];
    const workItemQuantity = excelForwardNumeric(section?.area_qty, "工項數量", errors, { min: 0 });
    const sourceItems = Array.isArray(section?.items) ? section.items : [];
    const laborInput = section?.labor_config && typeof section.labor_config === "object" ? section.labor_config : {};
    const laborConfig = {
      labor_per_board_foot: excelForwardNumeric(
        laborInput.labor_per_board_foot ?? EXCEL_FORWARD_CONSTANTS.labor_per_board_foot_default,
        "每才工資",
        errors,
        { min: 0 },
      ),
      carpenter_allocation: excelForwardNumeric(laborInput.carpenter_allocation ?? 1, "木工分配比例", errors, { min: 0, max: 1 }),
      metalworker_allocation: excelForwardNumeric(laborInput.metalworker_allocation ?? 0, "鐵工分配比例", errors, { min: 0, max: 1 }),
      carpenter_daily_rate: excelForwardNumeric(
        laborInput.carpenter_daily_rate ?? EXCEL_FORWARD_CONSTANTS.carpenter_daily_rate_default,
        "木工單價",
        errors,
        { min: 0 },
      ),
      metalworker_daily_rate: excelForwardNumeric(
        laborInput.metalworker_daily_rate ?? EXCEL_FORWARD_CONSTANTS.metalworker_daily_rate_default,
        "鐵工單價",
        errors,
        { min: 0 },
      ),
    };
    const allocationTotal = laborConfig.carpenter_allocation + laborConfig.metalworker_allocation;
    if (Math.abs(allocationTotal - 1) > 1e-9) errors.push("木工與鐵工分配比例合計必須等於 1");

    const itemsComputed = sourceItems.map((item, itemIndex) => {
      const itemErrors = [];
      const prefix = `材料 ${itemIndex + 1}`;
      const pricingType = item?.pricing_type || "single";
      const unit = String(item?.dimension_unit || "");
      if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, unit)) {
        itemErrors.push(`${prefix}的尺寸單位無效，只能使用 mm、cm 或 m`);
      }
      const quantity = excelForwardNumeric(item?.quantity, `${prefix}的數量`, itemErrors, { min: 0 });
      const actualUnitPrice = excelForwardNumeric(
        item?.actual_unit_price ?? item?.unit_price,
        `${prefix}的案件採用單價`,
        itemErrors,
        { min: 0 },
      );
      const wastePct = excelForwardNumeric(item?.waste_pct ?? 0, `${prefix}的損料百分比`, itemErrors, { min: 0 });
      const adjustment = excelForwardNumeric(
        item?.breakdown_adjustment_qty ?? 0,
        `${prefix}的人工加量`,
        itemErrors,
        { min: 0 },
      );
      const adjustmentReason = String(item?.breakdown_adjustment_reason || "").trim();
      if (adjustment !== 0 && !adjustmentReason) itemErrors.push(`${prefix}有人工加量時必須填寫理由`);

      let thickness = 0;
      let width = 0;
      let length = 0;
      if (pricingType === "wood_board_tsai" || pricingType === "steel_rect_tube") {
        thickness = excelForwardNumeric(item?.thickness, `${prefix}的厚度`, itemErrors, { min: 0 });
        width = excelForwardNumeric(item?.width, `${prefix}的寬度`, itemErrors, { min: 0 });
        length = excelForwardNumeric(item?.length, `${prefix}的長度`, itemErrors, { min: 0 });
        if (Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, unit)) {
          thickness = normalizeDimensionToCm(thickness, unit);
          width = normalizeDimensionToCm(width, unit);
          length = normalizeDimensionToCm(length, unit);
        }
      }

      let priceableQty = 0;
      let laborBoardFootQty = 0;
      let componentKind = "accessory";
      const wasteMultiplier = 1 + wastePct / 100;
      if (pricingType === "wood_board_tsai") {
        componentKind = "wood";
        priceableQty = excelRound(
          (thickness * width * length * quantity / EXCEL_FORWARD_CONSTANTS.board_foot_base) * wasteMultiplier,
          2,
        );
        laborBoardFootQty = priceableQty;
      } else if (pricingType === "steel_rect_tube") {
        componentKind = "steel";
        priceableQty = (
          (((thickness * 10) * 2 + (width * 10) * 2) / EXCEL_FORWARD_CONSTANTS.steel_pi)
          - EXCEL_FORWARD_CONSTANTS.steel_embedded_wall_multiplier
        )
          * EXCEL_FORWARD_CONSTANTS.steel_embedded_wall_multiplier
          * EXCEL_FORWARD_CONSTANTS.steel_density_factor
          * (length * quantity / 100);
        laborBoardFootQty = excelRound(
          (thickness * width * length * quantity / EXCEL_FORWARD_CONSTANTS.board_foot_base) * wasteMultiplier,
          2,
        );
      } else if (pricingType === "single") {
        priceableQty = quantity;
      } else {
        itemErrors.push(`${prefix}的正向 Excel 計價方式未支援：${pricingType}`);
      }
      if (!Number.isFinite(priceableQty) || priceableQty < 0) {
        itemErrors.push(`${prefix}的公式結果無效`);
        priceableQty = 0;
      }

      const chargeable = item?.is_chargeable !== false;
      const materialSubtotal = chargeable ? excelRound(priceableQty * actualUnitPrice, 0) : 0;
      const hasCostPrice = item?.cost_price_status === "verified"
        && hasValue(item?.cost_price)
        && Number.isFinite(Number(item.cost_price))
        && Number(item.cost_price) >= 0;
      const materialCostSubtotal = hasCostPrice ? excelRound(priceableQty * Number(item.cost_price), 0) : 0;
      const breakdownTotalQty = excelRound(quantity * workItemQuantity + adjustment, 6);
      const formulaTrace = {
        pricing_type: pricingType,
        formula_version: EXCEL_FORWARD_FORMULA_VERSION,
        formula_source: "1150709 原始 Excel 正向公式",
        input_unit: unit,
        normalized_unit: "cm",
        dimensions_cm: { thickness, width, length },
        waste_multiplier: wasteMultiplier,
        line_amount_rounding_digits: 0,
      };
      errors.push(...itemErrors);
      return {
        ok: itemErrors.length === 0,
        errors: itemErrors,
        componentKind,
        baseQty: priceableQty,
        wasteQty: 0,
        priceableQty,
        laborBoardFootQty,
        formulaTrace,
        actualUnitPrice,
        chargeable,
        requiredForPreparation: false,
        rawMaterialSubtotal: priceableQty * actualUnitPrice,
        materialSubtotal,
        hasCostPrice,
        materialCostSubtotal,
        materialGrossProfit: hasCostPrice ? materialSubtotal - materialCostSubtotal : null,
        laborPricedQty: 0,
        rawLaborSubtotal: 0,
        laborSubtotal: 0,
        subtotal: materialSubtotal,
        breakdownPerUnitQty: quantity,
        breakdownAdjustmentQty: adjustment,
        breakdownAdjustmentReason: adjustmentReason,
        breakdownTotalQty,
        message: itemErrors[0] || "",
      };
    });

    const woodSubtotal = itemsComputed.filter((item) => item.componentKind === "wood").reduce((sum, item) => sum + item.materialSubtotal, 0);
    const steelSubtotal = itemsComputed.filter((item) => item.componentKind === "steel").reduce((sum, item) => sum + item.materialSubtotal, 0);
    const accessorySubtotal = itemsComputed.filter((item) => item.componentKind === "accessory").reduce((sum, item) => sum + item.materialSubtotal, 0);
    const materialSubtotal = woodSubtotal + steelSubtotal + accessorySubtotal;
    const boardFootTotal = excelRound(itemsComputed.reduce((sum, item) => sum + item.laborBoardFootQty, 0), 2);
    const laborSubtotalTarget = excelRound(boardFootTotal * laborConfig.labor_per_board_foot, 0);
    const calculatedAt = options?.calculatedAt || new Date().toISOString();
    const generatedLaborDefaults = buildExcelLaborDefaultSnapshot({
      laborSubtotalTarget,
      boardFootTotal,
      laborConfig,
      capturedAt: calculatedAt,
    });
    const laborDetail = resolveExcelLaborDetailRows(section, generatedLaborDefaults);
    errors.push(...laborDetail.errors);
    const laborItems = laborDetail.rows.map((row) => ({
      row_id: row.row_id,
      kind: row.kind,
      name: row.name,
      unit: row.unit,
      qty: row.quantity,
      quantity: row.quantity,
      unit_price: row.base_value,
      base_value: row.base_value,
      factor: row.factor,
      ...(row.kind === "overhead" ? { weight: row.factor } : {
        allocation_ratio: row.factor,
        allocation_amount: excelRound(laborDetail.defaultSnapshot.basis.residual * row.factor, 0),
      }),
      amount: row.amount,
      is_overridden: row.is_overridden,
    }));
    const effectiveTradeAllocation = laborDetail.rows
      .filter((row) => row.kind === "trade")
      .reduce((sum, row) => sum + row.factor, 0);
    if (laborDetail.hasOverrides && Math.abs(effectiveTradeAllocation - 1) > 1e-9) {
      errors.push("木工與鐵工分配比例合計必須等於 1");
    }
    const laborSubtotal = laborItems.reduce((sum, item) => sum + item.amount, 0);
    const projectLaborTotal = excelRound(laborSubtotal * workItemQuantity, 0);
    const unitCost = materialSubtotal + laborSubtotal;
    const sectionTotal = excelRound(workItemQuantity * unitCost, 0);
    const hasCompleteCostData = itemsComputed.length > 0 && itemsComputed.every((item) => item.hasCostPrice);
    const materialCostSubtotal = itemsComputed.reduce((sum, item) => sum + item.materialCostSubtotal, 0);
    const calculationSnapshot = {
      schema: "excel-forward-quote-calculation/v1",
      formula_version: EXCEL_FORWARD_FORMULA_VERSION,
      calculated_at: calculatedAt,
      source_workbooks: EXCEL_SOURCE_WORKBOOKS.map((source) => ({ ...source })),
      input_snapshot: excelForwardInputSnapshot(section, laborConfig),
      units: {
        dimensions: "cm after normalization",
        wood_quantity: "才",
        steel_quantity: "kg (source workbook label)",
        line_amount: "TWD",
        work_item_quantity: section?.unit || "",
      },
      constants: {
        board_foot_base: EXCEL_FORWARD_CONSTANTS.board_foot_base,
        labor_overhead_weights: [...EXCEL_FORWARD_CONSTANTS.labor_overhead_weights],
        steel_pi: EXCEL_FORWARD_CONSTANTS.steel_pi,
        steel_embedded_wall_multiplier: EXCEL_FORWARD_CONSTANTS.steel_embedded_wall_multiplier,
        steel_density_factor: EXCEL_FORWARD_CONSTANTS.steel_density_factor,
        steel_constant_source_note: "原 Excel 只保存 3.1416、2、0.02466，未註明其商業／物理意義；網站不重新詮釋。",
      },
      rounding: {
        function: "Excel ROUND",
        wood_quantity_digits: 2,
        labor_component_unit_price_digits: 3,
        line_amount_digits: 0,
        customer_line_amount_digits: 0,
        tax_digits: 0,
        installment_digits: null,
        prior_installments: "total * ratio without ROUND",
        final_installment: "total minus prior unrounded installments",
      },
    };

    return {
      ok: errors.length === 0,
      errors: Array.from(new Set(errors)),
      calculationMode: EXCEL_FORWARD_CALCULATION_MODE,
      itemsComputed,
      woodSubtotal,
      steelSubtotal,
      accessorySubtotal,
      materialSubtotal,
      materialCostSubtotal,
      hasCompleteCostData,
      boardFootTotal,
      laborSubtotal,
      laborDist: {
        items: laborItems,
        overAllocated: false,
        unbalanced: Math.abs(allocationTotal - 1) > 1e-9 || Math.abs(effectiveTradeAllocation - 1) > 1e-9,
        formulaErrors: Array.from(new Set(errors)),
        defaultSnapshot: deepClone(laborDetail.defaultSnapshot),
        contract: laborDetail.contract ? deepClone(laborDetail.contract) : null,
        hasOverrides: laborDetail.hasOverrides,
      },
      projectLaborTotal,
      unitCost,
      sectionTotal,
      calculationSnapshot,
    };
  }

  function selectExcelLaborDetail(section = {}, options = {}) {
    if (section?.calculation_mode !== EXCEL_FORWARD_CALCULATION_MODE) {
      return {
        ok: false,
        code: QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE,
        error: "只有 Excel 正向公式工項可讀取工料明細",
        rows: [],
      };
    }
    const calculated = calculateExcelQuoteSection(section, options);
    return {
      ok: calculated.ok,
      code: calculated.ok ? QUOTE_LABOR_DETAIL_ERROR_CODES.OK : QUOTE_LABOR_DETAIL_ERROR_CODES.INVALID_STATE,
      error: calculated.errors[0] || "",
      errors: deepClone(calculated.errors),
      rows: deepClone(calculated.laborDist.items),
      default_snapshot: deepClone(calculated.laborDist.defaultSnapshot),
      overrides: deepClone(calculated.laborDist.contract?.overrides || {}),
      has_overrides: calculated.laborDist.hasOverrides,
      labor_subtotal: calculated.laborSubtotal,
      unit_cost: calculated.unitCost,
      section_total: calculated.sectionTotal,
      project_labor_total: calculated.projectLaborTotal,
      calculation_snapshot: deepClone(calculated.calculationSnapshot),
    };
  }

  function calculateQuotePaymentSchedule(total, payments = []) {
    const totalValidation = finiteNumericValue(total, { allowBlank: false, min: 0 });
    if (!totalValidation.ok) throw new RangeError(numericValidationMessage("付款總額", totalValidation));
    const activePayments = (Array.isArray(payments) ? payments : []).filter((payment) => hasValue(payment?.pct));
    const normalizedPayments = activePayments.map((payment, index) => {
      const validation = finiteNumericValue(payment?.pct, { allowBlank: false, min: 0, max: 100 });
      if (!validation.ok) throw new RangeError(numericValidationMessage(`第 ${index + 1} 期付款比例`, validation));
      return { payment, ratio: validation.value };
    });
    const stableNumber = (value) => Number(Number(value).toPrecision(15));
    const normalizedTotal = stableNumber(totalValidation.value);
    let allocated = 0;
    return normalizedPayments.map(({ payment, ratio }, index) => {
      const isLast = index === normalizedPayments.length - 1;
      const amount = isLast
        ? stableNumber(normalizedTotal - allocated)
        : stableNumber(normalizedTotal * ratio / 100);
      allocated = stableNumber(allocated + amount);
      return { ...deepClone(payment), amount, tail_absorber: isLast };
    });
  }

  function validateExcelCalculationSnapshot(section) {
    if (section?.calculation_mode !== EXCEL_FORWARD_CALCULATION_MODE) return { ok: true, errors: [] };
    const snapshot = section?.calculation_snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return { ok: false, errors: ["Excel 正向公式工項缺少計算快照"] };
    }
    const errors = [];
    if (snapshot.schema !== "excel-forward-quote-calculation/v1") errors.push("Excel 正向公式計算快照格式無效");
    if (snapshot.formula_version !== EXCEL_FORWARD_FORMULA_VERSION) errors.push("Excel 正向公式計算快照版本無效");
    if (!String(snapshot.calculated_at || "").trim()) errors.push("Excel 正向公式計算快照缺少計算時間");
    const sourceHashes = Array.isArray(snapshot.source_workbooks)
      ? snapshot.source_workbooks.map((source) => String(source?.sha256 || "").toUpperCase())
      : [];
    const expectedHashes = EXCEL_SOURCE_WORKBOOKS.map((source) => source.sha256);
    if (canonicalStringify(sourceHashes) !== canonicalStringify(expectedHashes)) {
      errors.push("Excel 正向公式計算快照的來源活頁簿雜湊不符");
    }
    if (!errors.length) {
      try {
        const recomputed = calculateExcelQuoteSection(section, { calculatedAt: snapshot.calculated_at });
        if (!recomputed.ok) errors.push(...recomputed.errors);
        else if (canonicalStringify(recomputed.calculationSnapshot) !== canonicalStringify(snapshot)) {
          const legacyExpected = deepClone(recomputed.calculationSnapshot);
          delete legacyExpected.rounding.installment_digits;
          delete legacyExpected.rounding.prior_installments;
          legacyExpected.rounding.final_installment = "total minus prior rounded installments";
          if (canonicalStringify(legacyExpected) !== canonicalStringify(snapshot)) {
            errors.push("Excel 正向公式計算快照與目前輸入不一致");
          }
        }
      } catch (error) {
        errors.push("Excel 正向公式計算快照無法重算驗證");
      }
    }
    return { ok: errors.length === 0, errors: Array.from(new Set(errors)) };
  }

  function calculateExcelQuote(quote = {}, options = {}) {
    const sections = (Array.isArray(quote?.sections) ? quote.sections : []).map((section) => calculateExcelQuoteSection(section, options));
    const errors = sections.flatMap((section) => section.errors);
    const subtotal = sections.reduce((sum, section) => sum + section.sectionTotal, 0);
    const discount = excelForwardNumeric(quote?.discount_amount ?? 0, "折扣／調整金額", errors, { min: 0 });
    const taxRate = excelForwardNumeric(quote?.tax_rate ?? 0, "稅率", errors, { min: 0, max: 100 });
    const taxable = Math.max(0, subtotal - discount);
    const tax = excelRound(taxable * taxRate / 100, 0);
    const total = taxable + tax;
    const materialCost = sections.reduce((sum, section, index) => (
      sum + section.materialCostSubtotal * finiteNumber(quote?.sections?.[index]?.area_qty)
    ), 0);
    const hasCompleteCostData = sections.length > 0 && sections.every((section) => section.hasCompleteCostData);
    const grossProfit = hasCompleteCostData ? taxable - materialCost : null;
    return {
      ok: errors.length === 0,
      errors: Array.from(new Set(errors)),
      sections,
      subtotal,
      discount,
      tax,
      total,
      materialCost,
      hasCompleteCostData,
      grossProfit,
      grossMarginPct: grossProfit != null && taxable > 0 ? (grossProfit / taxable) * 100 : null,
      payments: calculateQuotePaymentSchedule(total, options?.payments || []),
    };
  }

  function quoteTargetTotalWarning(quote) {
    const hasTarget = hasValue(quote?.target_total);
    const hasInputs = (Array.isArray(quote?.sections) ? quote.sections : []).some((section) => (
      (Array.isArray(section?.items) ? section.items : []).some((item) => hasValue(item?.quantity))
    ));
    return hasTarget && !hasInputs ? "原 Excel 無唯一反推公式；只有目標總金額時不得自動分攤或產生材料／工資明細。" : "";
  }

  function validateQuoteNumericPolicy(quote) {
    const errors = [];
    const check = (value, label, options = {}) => {
      const result = finiteNumericValue(value, options);
      if (!result.ok) errors.push(numericValidationMessage(label, result));
    };
    check(quote?.discount_amount ?? 0, "折扣／調整金額", { allowBlank: false, min: 0 });
    check(quote?.tax_rate ?? 0, "稅率", { allowBlank: false, min: 0, max: 100 });
    (Array.isArray(quote?.sections) ? quote.sections : []).forEach((section, sectionIndex) => {
      check(section?.area_qty, `工程 ${sectionIndex + 1} 的面積或數量`, { allowBlank: true, min: 0 });
      (Array.isArray(section?.items) ? section.items : []).forEach((item, itemIndex) => {
        const prefix = `工程 ${sectionIndex + 1} 材料 ${itemIndex + 1}`;
        [
          ["thickness", "厚度", 0],
          ["width", "寬度／外徑", 0],
          ["length", "長度", 0],
          ["wall_thickness_mm", "壁厚", 0],
          ["quantity", "數量", 0],
          ["actual_unit_price", "案件實際單價", 0],
          ["unit_price", "案件單價", 0],
          ["waste_pct", "報價損耗加成", 0],
          ["labor_unit_price", "工錢單價", 0],
          ["labor_waste_pct", "工錢損耗", 0],
          ["breakdown_adjustment_qty", "拆料人工加量", 0],
        ].forEach(([field, label, min]) => check(item?.[field], `${prefix}的${label}`, { allowBlank: true, min }));
        if (Number(item?.breakdown_adjustment_qty || 0) !== 0 && !String(item?.breakdown_adjustment_reason || "").trim()) {
          errors.push(`${prefix}有拆料人工加量時必須填寫理由`);
        }
      });
      (Array.isArray(section?.laborItems) ? section.laborItems : []).forEach((row, rowIndex) => {
        const prefix = `工程 ${sectionIndex + 1} 工錢 ${rowIndex + 1}`;
        check(row?.pct, `${prefix}的分配百分比`, { allowBlank: true, min: 0, max: 100 });
        check(row?.unit_price, `${prefix}的單價`, { allowBlank: true, min: 0 });
        check(row?.manual_amount, `${prefix}的手動金額`, { allowBlank: true, min: 0 });
      });
      if (section?.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE) {
        const labor = section?.labor_config || {};
        check(labor.labor_per_board_foot, `工程 ${sectionIndex + 1} 的每才工資`, { allowBlank: false, min: 0 });
        check(labor.carpenter_allocation, `工程 ${sectionIndex + 1} 的木工分配比例`, { allowBlank: false, min: 0, max: 1 });
        check(labor.metalworker_allocation, `工程 ${sectionIndex + 1} 的鐵工分配比例`, { allowBlank: false, min: 0, max: 1 });
        check(labor.carpenter_daily_rate, `工程 ${sectionIndex + 1} 的木工單價`, { allowBlank: false, min: 0 });
        check(labor.metalworker_daily_rate, `工程 ${sectionIndex + 1} 的鐵工單價`, { allowBlank: false, min: 0 });
      }
    });
    return { ok: errors.length === 0, errors };
  }

  function validateQuoteStatusTransition(currentStatus, targetStatus, context = {}) {
    const current = currentStatus || "new";
    const target = String(targetStatus || "");
    if (!QUOTE_STATUSES.has(target)) return { ok: false, error: "報價狀態無效" };
    if (current === target) return { ok: true, error: "" };
    const allowed = {
      new: new Set(["draft", "pending_approval", "lost"]),
      draft: new Set(["pending_approval", "lost"]),
      pending_approval: new Set(["approved", "returned", "sent"]),
      approved: new Set(),
      returned: new Set(["pending_approval", "lost"]),
      sent: new Set(["won", "lost"]),
      won: new Set(),
      lost: new Set(),
      expired: new Set(),
    };
    if (!allowed[current]?.has(target)) return { ok: false, error: `不可由目前狀態直接改為${target}` };
    if (current === "pending_approval" && ["approved", "returned", "sent"].includes(target) && !context?.canApprove) {
      return { ok: false, error: "只有核准人員可以核准或退回報價" };
    }
    return { ok: true, error: "" };
  }

  function quoteVersionNumber(quote) {
    const explicit = Number(quote?.quote_version);
    if (Number.isInteger(explicit) && explicit > 0) return explicit;
    const revision = Number(quote?.revision_no);
    return Number.isInteger(revision) && revision >= 0 ? revision + 1 : 1;
  }

  function localApprovalActorSnapshot(actor) {
    return {
      id: String(actor?.id || ""),
      account: String(actor?.account || ""),
      name: String(actor?.name || ""),
      role: String(actor?.role || ""),
    };
  }

  function isKnownLocalQuoteActor(actor) {
    return Boolean(actor?.id)
      && actor?.is_active !== false
      && ["owner", "admin", "staff"].includes(String(actor?.role || ""));
  }

  function isLocalQuoteReviewer(actor) {
    return isKnownLocalQuoteActor(actor) && ["owner", "admin"].includes(String(actor?.role || ""));
  }

  function quoteHasCurrentApprovalDecision(quote) {
    const submittedAt = new Date(String(quote?.submitted_for_approval_at || "")).getTime();
    const decisionRecords = [
      [quote?.approved_at, quote?.approved_by],
      [quote?.returned_at, quote?.returned_by],
    ];
    return decisionRecords.some(([decisionAt, decisionBy]) => {
      if (!decisionAt && !decisionBy) return false;
      const decisionTime = new Date(String(decisionAt || "")).getTime();
      if (!Number.isFinite(decisionTime) || !Number.isFinite(submittedAt)) return true;
      return decisionTime >= submittedAt;
    });
  }

  function quoteApprovalSubmissionId(quote) {
    return String(quote?.approval_submission_id || `legacy:${quote?.id || ""}:v${quoteVersionNumber(quote)}:${quote?.submitted_for_approval_at || ""}`);
  }

  function reconcileQuoteDraftApprovalState(draft, canonicalQuote) {
    const sourceDraft = deepClone(draft || {});
    if (!canonicalQuote || typeof canonicalQuote !== "object") {
      return { quote: sourceDraft, changed: false, canonical_status: String(sourceDraft.status || "draft") };
    }
    const canonicalStatus = QUOTE_STATUSES.has(String(canonicalQuote.status || ""))
      ? String(canonicalQuote.status)
      : "draft";
    const next = deepClone(sourceDraft);
    const canonicalWorkflow = {
      status: canonicalStatus,
      revision_no: Number.isInteger(Number(canonicalQuote.revision_no)) ? Number(canonicalQuote.revision_no) : 0,
      quote_version: quoteVersionNumber(canonicalQuote),
      revision_group_id: String(canonicalQuote.revision_group_id || canonicalQuote.id || ""),
      parent_quote_id: String(canonicalQuote.parent_quote_id || ""),
      is_superseded: Boolean(canonicalQuote.is_superseded),
      superseded_by: String(canonicalQuote.superseded_by || ""),
      status_updated_at: String(canonicalQuote.status_updated_at || ""),
      status_updated_by: String(canonicalQuote.status_updated_by || ""),
      submitted_for_approval_at: canonicalQuote.submitted_for_approval_at || "",
      submitted_for_approval_by: canonicalQuote.submitted_for_approval_by || null,
      submitted_for_approval_by_id: canonicalQuote.submitted_for_approval_by_id || canonicalQuote.submitted_for_approval_by?.id || "",
      submitted_for_approval_role: canonicalQuote.submitted_for_approval_role || canonicalQuote.submitted_for_approval_by?.role || "",
      submitted_for_approval_version_no: Number.isInteger(Number(canonicalQuote.submitted_for_approval_version_no))
        && Number(canonicalQuote.submitted_for_approval_version_no) > 0
        ? Number(canonicalQuote.submitted_for_approval_version_no)
        : null,
      approval_submission_id: String(canonicalQuote.approval_submission_id || ""),
      submission_snapshot: canonicalQuote.submission_snapshot || null,
      submission_snapshot_sha256: String(canonicalQuote.submission_snapshot_sha256 || ""),
      approved_at: String(canonicalQuote.approved_at || ""),
      approved_by: canonicalQuote.approved_by || null,
      approved_version_no: Number.isInteger(Number(canonicalQuote.approved_version_no)) && Number(canonicalQuote.approved_version_no) > 0
        ? Number(canonicalQuote.approved_version_no)
        : null,
      approval_snapshot_sha256: String(canonicalQuote.approval_snapshot_sha256 || ""),
      approval_mode: String(canonicalQuote.approval_mode || ""),
      document_snapshot: canonicalQuote.document_snapshot || null,
      returned_at: String(canonicalQuote.returned_at || ""),
      returned_by: canonicalQuote.returned_by || null,
      returned_reason: String(canonicalQuote.returned_reason || ""),
      sent_at: String(canonicalQuote.sent_at || ""),
      won_at: String(canonicalQuote.won_at || ""),
      lost_at: String(canonicalQuote.lost_at || ""),
      expired_at: String(canonicalQuote.expired_at || ""),
    };
    if (canonicalStatus === "draft") {
      canonicalWorkflow.submitted_for_approval_at = "";
      canonicalWorkflow.submitted_for_approval_by = null;
      canonicalWorkflow.submitted_for_approval_by_id = "";
      canonicalWorkflow.submitted_for_approval_role = "";
      canonicalWorkflow.submitted_for_approval_version_no = null;
      canonicalWorkflow.approval_submission_id = "";
      canonicalWorkflow.submission_snapshot = null;
      canonicalWorkflow.submission_snapshot_sha256 = "";
    }
    Object.entries(canonicalWorkflow).forEach(([field, value]) => {
      next[field] = deepClone(value);
    });
    return {
      quote: next,
      changed: canonicalStringify(next) !== canonicalStringify(sourceDraft),
      canonical_status: canonicalStatus,
    };
  }

  function localPendingApprovalQueueMetadata(quote) {
    const submitterId = String(quote?.submitted_for_approval_by_id || quote?.submitted_for_approval_by?.id || "");
    const submitterRole = String(quote?.submitted_for_approval_role || quote?.submitted_for_approval_by?.role || "");
    const submittedAt = String(quote?.submitted_for_approval_at || "");
    if (["owner", "admin"].includes(submitterRole)) {
      return {
        eligible: false,
        reason: "舊資料由主管角色送審；不自動核准，也不進一般人員待審清單",
        submitterId,
        submitterRole,
        submittedAt,
      };
    }
    if (submitterRole !== "staff" || !submitterId || Number.isNaN(new Date(submittedAt).getTime())) {
      return {
        eligible: false,
        reason: "待審資料缺少有效送審人或送審時間",
        submitterId,
        submitterRole,
        submittedAt,
      };
    }
    const hasAnyCurrentLeaseField = Boolean(
      quote?.approval_submission_id
      || quote?.submitted_for_approval_version_no != null
      || quote?.submission_snapshot
      || quote?.submission_snapshot_sha256
    );
    if (!hasAnyCurrentLeaseField) {
      return {
        eligible: true,
        consistency: "legacy",
        submitterId,
        submitterRole,
        submittedAt,
      };
    }
    const submittedVersion = Number(quote?.submitted_for_approval_version_no);
    const isCurrent = Boolean(String(quote?.approval_submission_id || ""))
      && Number.isInteger(submittedVersion)
      && submittedVersion === quoteVersionNumber(quote)
      && quote?.submission_snapshot?.schema === "quote-document-snapshot/v1"
      && /^[a-f0-9]{64}$/.test(String(quote?.submission_snapshot_sha256 || ""));
    return isCurrent
      ? {
          eligible: true,
          consistency: "current",
          submitterId,
          submitterRole,
          submittedAt,
        }
      : {
          eligible: false,
          reason: "待審提交識別、版本或 snapshot 不完整",
          submitterId,
          submitterRole,
          submittedAt,
        };
  }

  function quoteHasPendingApprovalMarkers(quote) {
    return Boolean(
      quote?.approval_submission_id
      || quote?.submitted_for_approval_at
      || quote?.submitted_for_approval_by
      || quote?.submitted_for_approval_by_id
      || quote?.submitted_for_approval_role
      || quote?.submitted_for_approval_version_no != null
      || quote?.submission_snapshot
      || quote?.submission_snapshot_sha256
    );
  }

  function selectCanonicalQuoteApprovalState(quote) {
    if (!quote || typeof quote !== "object" || !String(quote.id || "")) {
      return {
        quote_id: "",
        status: "unknown",
        version_no: 0,
        editable: false,
        locked: true,
        pending: false,
        consistent: false,
        code: "QUOTE_NOT_FOUND",
        reason: "找不到報價單",
        submission_id: "",
      };
    }
    const status = QUOTE_STATUSES.has(String(quote?.status || "")) ? String(quote.status) : "draft";
    const editable = QUOTE_EDITABLE_STATUSES.has(status) && !quote?.is_superseded;
    let consistent = true;
    let code = "";
    let reason = "";
    let submissionId = "";
    let pending = false;
    if (status === "pending_approval") {
      const metadata = localPendingApprovalQueueMetadata(quote);
      consistent = metadata.eligible;
      pending = metadata.eligible;
      submissionId = metadata.eligible ? quoteApprovalSubmissionId(quote) : "";
      if (!metadata.eligible) {
        code = "APPROVAL_QUEUE_INCONSISTENT";
        reason = metadata.reason;
      }
    } else if (status === "draft" && quoteHasPendingApprovalMarkers(quote)) {
      consistent = false;
      code = "APPROVAL_STATE_INCONSISTENT";
      reason = "草稿含有不應存在的待審標記；正式 quote 狀態仍以草稿為準";
    }
    return {
      quote_id: String(quote?.id || ""),
      status,
      version_no: quoteVersionNumber(quote),
      editable,
      locked: !editable,
      pending,
      consistent,
      code,
      reason,
      submission_id: submissionId,
    };
  }

  function approvalHistoryHead(history) {
    const records = Array.isArray(history) ? history : [];
    return records.length ? String(records[records.length - 1]?.sha256 || "") : "";
  }

  async function validateQuoteApprovalHistory(history, expectedHead) {
    if (!Array.isArray(history)) {
      return { ok: false, code: "APPROVAL_HISTORY_FORMAT_INVALID", error: "本機審核歷史格式不正確", head: "" };
    }
    let previousHash = "";
    for (let index = 0; index < history.length; index += 1) {
      const event = history[index];
      if (!event || event.schema !== LOCAL_QUOTE_APPROVAL_EVENT_SCHEMA || !String(event.event_id || "")) {
        return { ok: false, code: "APPROVAL_HISTORY_FORMAT_INVALID", error: `本機審核歷史第 ${index + 1} 筆格式不正確`, head: previousHash };
      }
      if (String(event.previous_hash || "") !== previousHash) {
        return { ok: false, code: "APPROVAL_HISTORY_CHAIN_BROKEN", error: `本機審核歷史第 ${index + 1} 筆鏈結中斷`, head: previousHash };
      }
      const payload = deepClone(event);
      const storedHash = String(payload.sha256 || "");
      delete payload.sha256;
      const actualHash = await hashCanonicalValue(payload);
      if (!storedHash || storedHash !== actualHash) {
        return { ok: false, code: "APPROVAL_HISTORY_HASH_MISMATCH", error: `本機審核歷史第 ${index + 1} 筆雜湊不符`, head: previousHash };
      }
      previousHash = storedHash;
    }
    if (expectedHead !== undefined && String(expectedHead || "") !== previousHash) {
      return { ok: false, code: "APPROVAL_HISTORY_HEAD_MISMATCH", error: "本機審核歷史鏈首尾不符", head: previousHash };
    }
    return { ok: true, code: "", error: "", head: previousHash };
  }

  function approvalActionFailure(input, code, error, details = {}) {
    const history = deepClone(Array.isArray(input?.history) ? input.history : []);
    return {
      ok: false,
      code,
      error,
      quote: deepClone(input?.quote || {}),
      history,
      history_head: input?.expectedHistoryHead !== undefined
        ? String(input.expectedHistoryHead || "")
        : approvalHistoryHead(history),
      ...deepClone(details),
    };
  }

  async function appendQuoteApprovalEvent(history, event) {
    const nextHistory = deepClone(Array.isArray(history) ? history : []);
    const payload = {
      schema: LOCAL_QUOTE_APPROVAL_EVENT_SCHEMA,
      ...deepClone(event),
      previous_hash: approvalHistoryHead(nextHistory),
    };
    delete payload.sha256;
    const record = { ...payload, sha256: await hashCanonicalValue(payload) };
    nextHistory.push(record);
    return { history: nextHistory, history_head: record.sha256, event: record };
  }

  async function applyLocalQuoteApprovalAction(input = {}) {
    const originalQuote = deepClone(input?.quote || {});
    const history = deepClone(Array.isArray(input?.history) ? input.history : []);
    const integrity = await validateQuoteApprovalHistory(history, input?.expectedHistoryHead);
    if (!integrity.ok) {
      return approvalActionFailure(input, "APPROVAL_HISTORY_INTEGRITY_FAILED", "本機審核歷史完整性檢查失敗，請停止操作並匯出資料供檢查");
    }
    const action = String(input?.action || "");
    if (!["submit", "approve", "return", "withdraw"].includes(action)) {
      return approvalActionFailure(input, "APPROVAL_ACTION_INVALID", "不支援的報價審核動作");
    }
    if (action === "submit" && !isKnownLocalQuoteActor(input?.actor)) {
      return approvalActionFailure(input, "SUBMIT_ROLE_DENIED", "目前角色不可提交報價");
    }
    if (["approve", "return"].includes(action) && !isLocalQuoteReviewer(input?.actor)) {
      return approvalActionFailure(input, "REVIEW_PERMISSION_DENIED", "只有管理人員或老闆可以核准或退回報價");
    }
    if (action === "withdraw" && (!isKnownLocalQuoteActor(input?.actor) || String(input?.actor?.role || "") !== "staff")) {
      return approvalActionFailure(input, "WITHDRAW_NOT_SUBMITTER", "只有原送審的一般人員可以撤回送審");
    }
    if (action === "withdraw") {
      const sourceStatus = String(originalQuote.status || "draft");
      if (["approved", "returned", "sent", "won", "lost", "expired"].includes(sourceStatus)) {
        return approvalActionFailure(input, "WITHDRAW_ALREADY_DECIDED", "報價已完成核准或退回決定，不能撤回送審");
      }
      if (sourceStatus !== "pending_approval") {
        return approvalActionFailure(input, "WITHDRAW_NOT_PENDING", "只有仍在待審核的報價可以撤回送審");
      }
      const queueMetadata = localPendingApprovalQueueMetadata(originalQuote);
      const submitterId = queueMetadata.submitterId;
      if (!queueMetadata.eligible) {
        return approvalActionFailure(input, "APPROVAL_QUEUE_INCONSISTENT", queueMetadata.reason);
      }
      if (submitterId !== String(input.actor.id || "")) {
        return approvalActionFailure(input, "WITHDRAW_NOT_SUBMITTER", "只有原送審的一般人員可以撤回送審");
      }
      const submissionId = quoteApprovalSubmissionId(originalQuote);
      const submittedVersion = Number(originalQuote.submitted_for_approval_version_no ?? quoteVersionNumber(originalQuote));
      if (!submissionId
        || String(input?.expectedSubmissionId || "") !== submissionId
        || !Number.isInteger(Number(input?.expectedVersionNo))
        || Number(input.expectedVersionNo) !== submittedVersion
        || submittedVersion !== quoteVersionNumber(originalQuote)) {
        return approvalActionFailure(input, "WITHDRAW_VERSION_MISMATCH", "待審版本或提交識別已變更，請重新整理後再操作");
      }
      if (quoteHasCurrentApprovalDecision(originalQuote)) {
        return approvalActionFailure(input, "WITHDRAW_ALREADY_DECIDED", "報價已完成核准或退回決定，不能撤回送審");
      }
    }
    if (["approve", "return"].includes(action) && originalQuote.status === "pending_approval") {
      const queueMetadata = localPendingApprovalQueueMetadata(originalQuote);
      if (!queueMetadata.eligible) {
        return approvalActionFailure(input, "APPROVAL_QUEUE_INCONSISTENT", queueMetadata.reason);
      }
      const currentSubmissionId = quoteApprovalSubmissionId(originalQuote);
      if ((input?.expectedSubmissionId !== undefined && String(input.expectedSubmissionId || "") !== currentSubmissionId)
        || (input?.expectedVersionNo !== undefined && Number(input.expectedVersionNo) !== quoteVersionNumber(originalQuote))) {
        return approvalActionFailure(input, "APPROVAL_QUEUE_INCONSISTENT", "待審報價版本或提交識別已變更，請重新整理後再操作");
      }
    }
    const allowedSourceStatuses = {
      submit: new Set(["draft", "returned"]),
      approve: new Set(["pending_approval"]),
      return: new Set(["pending_approval"]),
      withdraw: new Set(["pending_approval"]),
    };
    if (!allowedSourceStatuses[action].has(originalQuote.status || "draft")) {
      return approvalActionFailure(input, "INVALID_APPROVAL_TRANSITION", `報價狀態不可由 ${originalQuote.status || "draft"} 執行 ${action}`);
    }
    const reason = String(input?.reason || "").trim();
    if (action === "return" && !reason) {
      return approvalActionFailure(input, "RETURN_REASON_REQUIRED", "退回報價必須填寫原因");
    }
    if (action === "submit") {
      const validationTargetStatus = isLocalQuoteReviewer(input?.actor) ? "approved" : "pending_approval";
      const validation = validateQuoteForStatus(
        originalQuote,
        input?.totals || input?.documentSnapshot?.totals || {},
        validationTargetStatus,
        { ...(input?.validationContext || {}), enforceP0: true },
      );
      if (!validation.ok) {
        return approvalActionFailure(
          input,
          "QUOTE_VALIDATION_FAILED",
          validation.errors[0] || "報價內容未通過送審驗證",
          { validation_errors: validation.errors },
        );
      }
    }
    if (["submit", "approve"].includes(action) && input?.documentSnapshot?.schema !== "quote-document-snapshot/v1") {
      return approvalActionFailure(input, action === "submit" ? "SUBMISSION_SNAPSHOT_REQUIRED" : "APPROVAL_SNAPSHOT_REQUIRED", action === "submit" ? "送審報價必須保存完整提交快照" : "核准報價必須保存完整文件快照");
    }
    const at = String(input?.at || new Date().toISOString());
    if (!at || Number.isNaN(new Date(at).getTime())) {
      return approvalActionFailure(input, "APPROVAL_TIME_INVALID", "審核時間格式不正確");
    }
    const actor = localApprovalActorSnapshot(input.actor);
    const directManagerApproval = action === "submit" && ["owner", "admin"].includes(actor.role);
    const effectiveAction = directManagerApproval ? "approve" : action;
    const targetStatus = effectiveAction === "submit" ? "pending_approval" : effectiveAction === "approve" ? "approved" : effectiveAction === "withdraw" ? "draft" : "returned";
    const quote = deepClone(originalQuote);
    quote.quote_version = quoteVersionNumber(quote);
    quote.status = targetStatus;
    quote.status_updated_at = at;
    quote.status_updated_by = actor.id;
    quote.updated_at = at;
    if (action === "submit") {
      const submissionId = String(input?.submissionId || input?.eventId || `qs-${Date.now()}`);
      quote.submitted_for_approval_at = at;
      quote.submitted_for_approval_by = actor;
      quote.submitted_for_approval_by_id = actor.id;
      quote.submitted_for_approval_role = actor.role;
      quote.submitted_for_approval_version_no = quote.quote_version;
      quote.approval_submission_id = submissionId;
      quote.submission_snapshot = deepClone(input.documentSnapshot);
      quote.submission_snapshot_sha256 = await hashCanonicalValue(quote.submission_snapshot);
      quote.returned_at = "";
      quote.returned_by = null;
      quote.returned_reason = "";
    }
    if (effectiveAction === "approve") {
      quote.approved_at = at;
      quote.approved_by = actor;
      quote.approved_version_no = quote.quote_version;
      quote.document_snapshot = deepClone(input.documentSnapshot);
      quote.approval_snapshot_sha256 = await hashCanonicalValue(quote.document_snapshot);
      quote.approval_mode = directManagerApproval ? "manager_direct" : "reviewed";
    } else if (effectiveAction === "return") {
      quote.returned_at = at;
      quote.returned_by = actor;
      quote.returned_reason = reason;
    } else if (effectiveAction === "withdraw") {
      quote.approval_submission_id = "";
      quote.submitted_for_approval_at = "";
      quote.submitted_for_approval_by = null;
      quote.submitted_for_approval_by_id = "";
      quote.submitted_for_approval_role = "";
      quote.submitted_for_approval_version_no = null;
      quote.submission_snapshot = null;
      quote.submission_snapshot_sha256 = "";
    }
    const appended = await appendQuoteApprovalEvent(history, {
      event_id: String(input?.eventId || `qa-${Date.now()}`),
      quote_id: String(quote.id || ""),
      quote_no: String(quote.quote_no || ""),
      revision_group_id: String(quote.revision_group_id || quote.id || ""),
      version_no: quote.quote_version,
      action: effectiveAction,
      requested_action: action,
      from_status: String(originalQuote.status || "draft"),
      to_status: targetStatus,
      actor,
      at,
      reason: effectiveAction === "return" ? reason : effectiveAction === "withdraw" ? "送審人撤回" : directManagerApproval ? "主管以上直接核准" : "",
      approval_mode: effectiveAction === "approve" ? quote.approval_mode : "",
      submission_id: action === "submit" ? String(quote.approval_submission_id || "") : quoteApprovalSubmissionId(originalQuote),
      snapshot_sha256: effectiveAction === "approve" ? quote.approval_snapshot_sha256 : action === "submit" ? quote.submission_snapshot_sha256 : "",
    });
    return {
      ok: true,
      code: "",
      error: "",
      quote,
      history: appended.history,
      history_head: appended.history_head,
      event: appended.event,
    };
  }

  async function createLocalQuoteRevision(input = {}) {
    const originalQuote = deepClone(input?.quote || {});
    const history = deepClone(Array.isArray(input?.history) ? input.history : []);
    const integrity = await validateQuoteApprovalHistory(history, input?.expectedHistoryHead);
    if (!integrity.ok) {
      return { ...approvalActionFailure(input, "APPROVAL_HISTORY_INTEGRITY_FAILED", "本機審核歷史完整性檢查失敗，請停止操作並匯出資料供檢查"), original: originalQuote, revision: null };
    }
    if (!isKnownLocalQuoteActor(input?.actor)) {
      return { ...approvalActionFailure(input, "APPROVAL_ACTOR_INVALID", "只有現有登入人員可建立報價修訂版"), original: originalQuote, revision: null };
    }
    if (originalQuote.status !== "approved") {
      return { ...approvalActionFailure(input, "REVISION_REQUIRES_APPROVED", "只有已核准報價可以建立新的草稿版本"), original: originalQuote, revision: null };
    }
    if (originalQuote.is_superseded) {
      return { ...approvalActionFailure(input, "REVISION_ALREADY_EXISTS", "此核准版本已有後續修訂版"), original: originalQuote, revision: null };
    }
    const newQuoteId = String(input?.newQuoteId || "").trim();
    if (!newQuoteId) {
      return { ...approvalActionFailure(input, "REVISION_ID_REQUIRED", "建立修訂版需要新的報價 ID"), original: originalQuote, revision: null };
    }
    const at = String(input?.at || new Date().toISOString());
    if (!at || Number.isNaN(new Date(at).getTime())) {
      return { ...approvalActionFailure(input, "APPROVAL_TIME_INVALID", "審核時間格式不正確"), original: originalQuote, revision: null };
    }
    const groupId = originalQuote.revision_group_id || originalQuote.id;
    const highestRevision = (Array.isArray(input?.quotes) ? input.quotes : [originalQuote])
      .filter((record) => (record?.revision_group_id || record?.id) === groupId)
      .reduce((highest, record) => Math.max(highest, Number(record?.revision_no || 0)), 0);
    const revisionNo = highestRevision + 1;
    const actor = localApprovalActorSnapshot(input.actor);
    const original = deepClone(originalQuote);
    original.is_superseded = true;
    original.superseded_by = newQuoteId;
    original.updated_at = at;
    const revision = {
      ...deepClone(originalQuote),
      id: newQuoteId,
      revision_group_id: groupId,
      revision_no: revisionNo,
      quote_version: revisionNo + 1,
      parent_quote_id: originalQuote.id,
      owner_id: input?.ownerId || actor.id || originalQuote.owner_id || "",
      quote_date: input?.quoteDate || originalQuote.quote_date || "",
      valid_until: input?.validUntil || originalQuote.valid_until || "",
      next_follow_up: input?.nextFollowUp || "",
      status: "draft",
      status_updated_at: at,
      status_updated_by: actor.id,
      submitted_for_approval_at: "",
      submitted_for_approval_by: null,
      submitted_for_approval_by_id: "",
      submitted_for_approval_role: "",
      submitted_for_approval_version_no: null,
      approval_submission_id: "",
      submission_snapshot: null,
      submission_snapshot_sha256: "",
      approved_at: "",
      approved_by: null,
      approved_version_no: null,
      approval_snapshot_sha256: "",
      approval_mode: "",
      returned_at: "",
      returned_by: null,
      returned_reason: "",
      document_snapshot: null,
      is_superseded: false,
      superseded_by: "",
      created_at: at,
      updated_at: at,
    };
    const appended = await appendQuoteApprovalEvent(history, {
      event_id: String(input?.eventId || `qa-${Date.now()}`),
      quote_id: revision.id,
      quote_no: String(revision.quote_no || ""),
      revision_group_id: String(groupId || ""),
      version_no: revision.quote_version,
      action: "revise",
      from_status: "approved",
      to_status: "draft",
      actor,
      at,
      reason: "",
      source_quote_id: String(originalQuote.id || ""),
      snapshot_sha256: String(originalQuote.approval_snapshot_sha256 || ""),
    });
    return {
      ok: true,
      code: "",
      error: "",
      original,
      revision,
      history: appended.history,
      history_head: appended.history_head,
      event: appended.event,
    };
  }

  function selectPendingQuoteApprovals(quotes) {
    return (Array.isArray(quotes) ? quotes : [])
      .filter((quote) => quote?.status === "pending_approval"
        && !quote?.is_superseded)
      .map((quote) => ({ quote, metadata: localPendingApprovalQueueMetadata(quote) }))
      .filter(({ metadata }) => metadata.eligible)
      .map(({ quote, metadata }) => ({
          quote_id: String(quote?.id || ""),
          quote_no: String(quote?.quote_no || ""),
          revision_group_id: String(quote?.revision_group_id || quote?.id || ""),
          version_no: quoteVersionNumber(quote),
          status: "pending_approval",
          submission_id: quoteApprovalSubmissionId(quote),
          submitted_at: metadata.submittedAt,
          submitter_id: metadata.submitterId,
          submitter_role: metadata.submitterRole,
          submitted_by: quote?.submitted_for_approval_by ? deepClone(quote.submitted_for_approval_by) : null,
          submission_snapshot_sha256: String(quote?.submission_snapshot_sha256 || ""),
          queue_consistency: metadata.consistency,
          customer_id: String(quote?.customer_id || ""),
          title: String(quote?.title || ""),
          project_name: String(quote?.project_name || ""),
        }))
      .sort((left, right) => left.submitted_at.localeCompare(right.submitted_at) || left.quote_id.localeCompare(right.quote_id));
  }

  function selectApprovalQueueInconsistencies(quotes) {
    return (Array.isArray(quotes) ? quotes : [])
      .filter((quote) => quote?.status === "pending_approval" && !quote?.is_superseded)
      .map((quote) => {
        const metadata = localPendingApprovalQueueMetadata(quote);
        if (metadata.eligible) return null;
        return {
          quote_id: String(quote?.id || ""),
          quote_no: String(quote?.quote_no || ""),
          status: "pending_approval",
          submitter_id: metadata.submitterId,
          submitter_role: metadata.submitterRole,
          submitted_at: metadata.submittedAt,
          code: "APPROVAL_QUEUE_INCONSISTENT",
          reason: metadata.reason,
        };
      })
      .filter(Boolean);
  }

  function selectQuoteApprovalHistory(history, quoteOrGroupId) {
    const target = String(quoteOrGroupId || "");
    return deepClone((Array.isArray(history) ? history : []).filter((event) => (
      !target || event?.quote_id === target || event?.revision_group_id === target || event?.source_quote_id === target
    )));
  }

  function validateQuoteForStatus(quote, totals, targetStatus, context = {}) {
    const errors = [];
    const strict = targetStatus === "pending_approval" || targetStatus === "approved" || targetStatus === "sent" || targetStatus === "won";
    const enforceP0 = Boolean(context?.enforceP0 || Number(quote?.safety_rules_version) >= 1);
    if (!quote?.customer_id) errors.push("請先選擇客戶");
    if (!quote?.quote_date) errors.push("請填寫報價日期");
    if (strict && !quote?.valid_until) errors.push("請填寫報價有效期限");
    if (strict && quote?.quote_date && quote?.valid_until && quote.valid_until < quote.quote_date) errors.push("報價有效期限不可早於報價日期");
    if (targetStatus === "lost" && !String(quote?.lost_reason || "").trim()) errors.push("請填寫未成交原因");
    if (strict) errors.push(...validateQuoteNumericPolicy(quote).errors);
    if (strict && enforceP0) {
      if (!["detailed", "quick"].includes(quote?.estimate_method)) errors.push("請選擇明細估價或快速估算");
      if (!Array.isArray(quote?.included_scope) || !quote.included_scope.some((item) => String(item || "").trim())) errors.push("請填寫報價包含項目");
      if (!Array.isArray(quote?.excluded_scope) || !quote.excluded_scope.some((item) => String(item || "").trim())) errors.push("請填寫報價不包含項目（若無請填『無』）");
      if (Number(quote?.discount_amount) !== 0 && !String(quote?.adjustment_reason || "").trim()) errors.push("有折扣或金額調整時必須填寫理由");
      if (hasValue(quote?.manualTotal) && !quote?.legacy_manual_total) errors.push("新報價不得使用無來源的手動總價");
    }

    const sections = Array.isArray(quote?.sections) ? quote.sections : [];
    if (strict && !sections.length) errors.push("至少需要一個工程項目");
    if (strict) sections.forEach((section, index) => {
      if (!section?.name) errors.push(`工程 ${index + 1} 尚未填寫名稱`);
      if (!(Number(section?.area_qty) > 0)) errors.push(`工程 ${index + 1} 的面積或數量必須大於 0`);
      const items = Array.isArray(section?.items) ? section.items : [];
      if (!items.length) {
        errors.push(`工程 ${index + 1} 尚有未完成的材料資料`);
        return;
      }
      items.forEach((item, itemIndex) => {
        if (!item?.name || !item?.unit || !(Number(item?.quantity) > 0)) {
          errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 尚未填完品名、單位或數量`);
          return;
        }
        const missing = missingFormulaFields(item);
        if (missing.length) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 缺少${missing.join("、")}`);
        if (enforceP0) {
          if (item?.catalog_review_required) {
            errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 主檔已變更／待覆核，請重新從材料庫選取`);
          }
          if (!item?.formula_version || !item?.formula_source) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 缺少公式版本或來源`);
          else if (!KNOWN_FORMULA_VERSIONS.has(item.formula_version) || !KNOWN_PRICING_TYPES.has(item?.pricing_type || "single")) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 使用未核准的公式或計價方式`);
          if (!String(item?.price_source || "").trim() || !String(item?.price_version || "").trim()) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 缺少案件單價來源或版本`);
          if (hasValue(item?.standard_budget_unit_price) && (!String(item?.standard_budget_source || "").trim() || !String(item?.standard_budget_version || "").trim())) {
            errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 缺少標準／預算價來源或版本`);
          }
          try {
            normalizedDimensionsCm(item);
          } catch (error) {
            errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 的尺寸單位無效`);
          }
          if (item?.price_is_override && !String(item?.price_override_reason || "").trim()) {
            errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 已覆寫案件單價，請填寫理由`);
          }
          if (itemKind(item) === "custom") {
            if (!String(item?.custom_dimensions_spec || "").trim()) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 缺少客製尺寸／規格`);
            if (!["yes", "no", "pending"].includes(item?.detail_drawing_status)) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 的詳圖狀態無效`);
            else if (item.detail_drawing_status === "pending") errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 的詳圖狀態仍為待補`);
            if (!["yes", "no", "pending"].includes(item?.surface_treatment_status)) errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 的表面處理狀態無效`);
            else if (item.surface_treatment_status === "pending") errors.push(`工程 ${index + 1} 材料 ${itemIndex + 1} 的表面處理狀態仍為待補`);
          }
        }
      });
      if (section?.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE && section?.calculation_snapshot) {
        errors.push(...validateExcelCalculationSnapshot(section).errors.map((error) => `工程 ${index + 1}：${error}`));
      }
    });
    if (strict && !(Number(totals?.total) > 0)) errors.push("報價總額必須大於 0");
    if (strict && Array.isArray(totals?.sections) && totals.sections.some((section) => section?.laborDist?.overAllocated)) {
      errors.push("工錢細項已超過可分配的工錢總額");
    }
    if (strict && Array.isArray(totals?.sections)) {
      totals.sections.forEach((section) => {
        if (section?.calculationMode !== EXCEL_FORWARD_CALCULATION_MODE) return;
        errors.push(...(Array.isArray(section?.errors) ? section.errors : []));
      });
    }
    const paymentPercentages = Array.isArray(context?.template?.payments)
      ? context.template.payments.filter((row) => row?.pct !== "" && row?.pct != null).map((row) => Number(row.pct))
      : [];
    if (strict && paymentPercentages.length) {
      const paymentTotal = paymentPercentages.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
      if (paymentPercentages.some((value) => !Number.isFinite(value) || value < 0 || value > 100) || Math.abs(paymentTotal - 100) > 1e-9) {
        errors.push("付款條件百分比合計必須為 100%");
      }
    }
    return { ok: errors.length === 0, errors };
  }

  function normalizeList(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    if (!hasValue(value)) return [];
    return String(value).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  function formulaSourceFor(record) {
    if (record?.formula_source) return record.formula_source;
    if (record?.source_import) return String(record.source_import);
    return record?.formula_version === "excel-1150709-v1" ? "公司工作表 1150709" : "網站既有公式";
  }

  function formulaSourceIdFor(record) {
    if (String(record?.formula_source_id || "").trim()) return String(record.formula_source_id).trim();
    const version = String(record?.formula_version || "legacy-v1");
    if (version === "excel-1150709-v1") return "company-workbook/1150709";
    if (String(record?.formula_source || "") === "custom-default") return "custom-formula/legacy-v1";
    return `website-formula/${version}`;
  }

  function formulaSourceVersionFor(record) {
    return String(record?.formula_source_version || record?.formula_version || "legacy-v1");
  }

  function formulaSourceSnapshotFor(record) {
    return String(record?.formula_source_snapshot || formulaSourceFor(record));
  }

  function formulaIdentity(record) {
    return {
      pricing_type: String(record?.pricing_type || "single"),
      formula_version: String(record?.formula_version || "legacy-v1"),
      formula_source_id: formulaSourceIdFor(record),
      formula_source_version: formulaSourceVersionFor(record),
    };
  }

  function formulaIdentityMatches(left, right) {
    if (!left || !right) return false;
    return canonicalStringify(formulaIdentity(left)) === canonicalStringify(formulaIdentity(right));
  }

  function migrateMaterialRecord(material, context = {}) {
    const legacyImportedBudget = Boolean(material?.source_import && !hasValue(material?.standard_budget_unit_price) && hasValue(material?.cost_price));
    const standardBudget = hasValue(material?.standard_budget_unit_price)
      ? material.standard_budget_unit_price
      : legacyImportedBudget
        ? material.cost_price
        : "";
    const costStatus = legacyImportedBudget ? "unverified_legacy_budget_import" : material?.cost_price_status || (hasValue(material?.cost_price)
      ? "unverified_legacy"
      : "unverified");
    const formulaSource = formulaSourceFor(material);
    return migrateMaterialSpecifications({
      ...material,
      dimension_unit: migratedDimensionUnit(material?.dimension_unit, context),
      formula_version: material?.formula_version || "legacy-v1",
      formula_source: formulaSource,
      formula_source_id: formulaSourceIdFor(material),
      formula_source_version: formulaSourceVersionFor(material),
      formula_source_snapshot: material?.formula_source_snapshot || formulaSource,
      standard_budget_unit_price: standardBudget,
      standard_budget_source: material?.standard_budget_source || (hasValue(standardBudget) ? legacyImportedBudget ? material?.source_import || "舊匯入" : "舊資料（來源未記錄）" : ""),
      standard_budget_version: material?.standard_budget_version || material?.source_import || (hasValue(standardBudget) ? "legacy-unversioned" : ""),
      catalog_sale_unit_price: material?.catalog_sale_unit_price ?? "",
      catalog_sale_price_source: material?.catalog_sale_price_source || "",
      catalog_sale_price_version: material?.catalog_sale_price_version || "",
      catalog_discount_factor: material?.catalog_discount_factor ?? "",
      default_actual_unit_price: hasValue(material?.default_actual_unit_price) ? material.default_actual_unit_price : material?.unit_price ?? 0,
      actual_price_source: material?.actual_price_source || material?.source_import || "材料主檔",
      actual_price_version: material?.actual_price_version || material?.price_effective_date || material?.source_import || "legacy-unversioned",
      cost_price: material?.cost_price ?? "",
      cost_price_status: costStatus,
    });
  }

  function migrateQuoteItemRecord(item, material, quoteId, sectionIndex, itemIndex, context = {}) {
    const normalizedItemKind = itemKind(item);
    const defaultActual = hasValue(item?.default_actual_unit_price)
      ? item.default_actual_unit_price
      : hasValue(material?.default_actual_unit_price)
        ? material.default_actual_unit_price
        : hasValue(material?.unit_price)
          ? material.unit_price
          : item?.unit_price ?? 0;
    const actual = hasValue(item?.actual_unit_price) ? item.actual_unit_price : item?.unit_price ?? defaultActual;
    const standardBudget = hasValue(item?.standard_budget_unit_price)
      ? item.standard_budget_unit_price
      : material?.standard_budget_unit_price ?? "";
    const actualNumber = Number(actual);
    const defaultNumber = Number(defaultActual);
    const priceIsOverride = typeof item?.price_is_override === "boolean"
      ? item.price_is_override
      : Number.isFinite(actualNumber) && Number.isFinite(defaultNumber) && Math.abs(actualNumber - defaultNumber) > 0.000001;
    const formulaSource = item?.formula_source || formulaSourceFor(material || item);
    const formulaRecord = {
      ...(material || {}),
      ...(item || {}),
      formula_version: item?.formula_version || material?.formula_version || "legacy-v1",
      formula_source: formulaSource,
    };
    const restoredFormulaChanged = context?.channel === "self_backup"
      && normalizedItemKind === "catalog"
      && material
      && !formulaIdentityMatches(item, material);
    const reviewRequired = Boolean(item?.catalog_review_required)
      || (restoredFormulaChanged && (context?.quoteStatus || "draft") === "draft");
    return {
      ...item,
      line_id: item?.line_id || `legacy-${quoteId || "quote"}-${sectionIndex + 1}-${itemIndex + 1}`,
      item_kind: normalizedItemKind,
      dimension_unit: migratedDimensionUnit(item?.dimension_unit, { ...context, legacyFallback: material?.dimension_unit }),
      formula_version: item?.formula_version || material?.formula_version || "legacy-v1",
      formula_source: formulaSource,
      formula_source_id: formulaSourceIdFor(formulaRecord),
      formula_source_version: formulaSourceVersionFor(formulaRecord),
      formula_source_snapshot: item?.formula_source_snapshot || formulaSource,
      standard_budget_unit_price: standardBudget,
      standard_budget_source: item?.standard_budget_source || material?.standard_budget_source || (hasValue(standardBudget) ? "舊資料（來源未記錄）" : ""),
      standard_budget_version: item?.standard_budget_version || material?.standard_budget_version || (hasValue(standardBudget) ? "legacy-unversioned" : ""),
      catalog_sale_unit_price: item?.catalog_sale_unit_price ?? material?.catalog_sale_unit_price ?? "",
      catalog_sale_price_source: item?.catalog_sale_price_source || material?.catalog_sale_price_source || "",
      catalog_sale_price_version: item?.catalog_sale_price_version || material?.catalog_sale_price_version || "",
      catalog_discount_factor: item?.catalog_discount_factor ?? material?.catalog_discount_factor ?? "",
      default_actual_unit_price: defaultActual,
      actual_unit_price: actual,
      unit_price: actual,
      price_source: item?.price_source || material?.actual_price_source || (normalizedItemKind === "custom" ? "舊案件客製價（來源未記錄）" : "材料主檔"),
      price_version: item?.price_version || material?.actual_price_version || item?.price_effective_date || "legacy-unversioned",
      price_is_override: priceIsOverride,
      price_override_reason: item?.price_override_reason || "",
      cost_price: item?.cost_price ?? material?.cost_price ?? "",
      cost_price_status: item?.cost_price_status || material?.cost_price_status || "unverified",
      is_chargeable: item?.is_chargeable !== false,
      is_required_for_preparation: item?.is_required_for_preparation !== false,
      custom_dimensions_spec: item?.custom_dimensions_spec || "",
      detail_drawing_status: item?.detail_drawing_status || (normalizedItemKind === "custom" ? "pending" : "not_required"),
      surface_treatment_status: item?.surface_treatment_status || (normalizedItemKind === "custom" ? "pending" : "not_required"),
      catalog_review_required: reviewRequired,
      catalog_review_reason: reviewRequired
        ? item?.catalog_review_reason || "主檔已變更／待覆核，請重新從材料庫選取後確認"
        : "",
    };
  }

  function trustedManualLineageEntry(context, quote) {
    if (context?.channel !== "self_backup") return null;
    const entries = context?.trustedBackupLineage?.legacy_manual_totals;
    if (!Array.isArray(entries)) return null;
    return entries.find((entry) => entry?.quote_id === quote?.id
      && entry?.source === "legacy-manual-total"
      && sourceSchemaNumber(entry?.origin_schema) != null
      && Number(entry.origin_schema) < 3
      && entry?.manual_total === quote?.manualTotal) || null;
  }

  function trustedFormulaLineageEntry(context, quote, sectionIndex, itemIndex, item) {
    if (context?.channel !== "self_backup") return null;
    const entries = context?.trustedBackupLineage?.catalog_formula_snapshots;
    if (!Array.isArray(entries)) return null;
    return entries.find((entry) => entry?.quote_id === quote?.id
      && entry?.section_index === sectionIndex
      && entry?.item_index === itemIndex
      && entry?.line_id === item?.line_id
      && entry?.material_id === item?.material_id
      && entry?.formula_version === item?.formula_version
      && entry?.formula_source_id === formulaSourceIdFor(item)
      && entry?.formula_source_version === formulaSourceVersionFor(item)
      && entry?.formula_source_snapshot === formulaSourceSnapshotFor(item)) || null;
  }

  function migrateQuoteRecord(quote, materialMap, context = {}) {
    const hasManualTotal = hasValue(quote?.manualTotal);
    const sourceSchema = sourceSchemaNumber(context?.sourceSchemaVersion);
    const trustedPreV3ManualTotal = hasManualTotal && sourceSchema != null && sourceSchema < 3;
    const trustedExistingOriginSchema = sourceSchemaNumber(quote?.legacy_manual_total_source_schema);
    const trustedExistingManualTotal = hasManualTotal
      && Boolean(context?.trustExistingHistoricalData)
      && quote?.legacy_manual_total === true
      && quote?.legacy_manual_total_source === "legacy-manual-total"
      && trustedExistingOriginSchema != null
      && trustedExistingOriginSchema < 3;
    const trustedBackupManualTotal = hasManualTotal && Boolean(trustedManualLineageEntry(context, quote));
    const allowLegacyManualTotal = trustedPreV3ManualTotal || trustedExistingManualTotal || trustedBackupManualTotal;
    const revisionNo = Number.isInteger(Number(quote?.revision_no)) && Number(quote.revision_no) >= 0
      ? Number(quote.revision_no)
      : 0;
    const migrated = {
      ...quote,
      schema_version: 3,
      safety_rules_version: 1,
      revision_no: revisionNo,
      quote_version: quoteVersionNumber({ ...quote, revision_no: revisionNo }),
      submitted_for_approval_at: quote?.submitted_for_approval_at || "",
      submitted_for_approval_by: quote?.submitted_for_approval_by || null,
      submitted_for_approval_by_id: quote?.submitted_for_approval_by_id || quote?.submitted_for_approval_by?.id || "",
      submitted_for_approval_role: quote?.submitted_for_approval_role || quote?.submitted_for_approval_by?.role || "",
      submitted_for_approval_version_no: Number.isInteger(Number(quote?.submitted_for_approval_version_no)) && Number(quote.submitted_for_approval_version_no) > 0
        ? Number(quote.submitted_for_approval_version_no)
        : null,
      approval_submission_id: quote?.approval_submission_id || "",
      submission_snapshot: quote?.submission_snapshot || null,
      submission_snapshot_sha256: quote?.submission_snapshot_sha256 || "",
      approved_at: quote?.approved_at || "",
      approved_by: quote?.approved_by || null,
      approved_version_no: Number.isInteger(Number(quote?.approved_version_no)) && Number(quote.approved_version_no) > 0
        ? Number(quote.approved_version_no)
        : null,
      approval_snapshot_sha256: quote?.approval_snapshot_sha256 || "",
      approval_mode: quote?.approval_mode || "",
      returned_at: quote?.returned_at || "",
      returned_by: quote?.returned_by || null,
      returned_reason: quote?.returned_reason || "",
      estimate_method: quote?.estimate_method || (allowLegacyManualTotal ? "quick" : "detailed"),
      legacy_manual_total: allowLegacyManualTotal,
      legacy_manual_total_source: allowLegacyManualTotal ? "legacy-manual-total" : "",
      legacy_manual_total_source_schema: allowLegacyManualTotal
        ? sourceSchema != null && sourceSchema < 3 ? sourceSchema : trustedBackupManualTotal
          ? trustedManualLineageEntry(context, quote).origin_schema
          : trustedExistingOriginSchema
        : null,
      included_scope: normalizeList(quote?.included_scope),
      excluded_scope: normalizeList(quote?.excluded_scope),
      adjustment_reason: quote?.adjustment_reason || "",
      sections: (Array.isArray(quote?.sections) ? quote.sections : []).map((section, sectionIndex) => {
        const calculationMode = section?.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE
          ? EXCEL_FORWARD_CALCULATION_MODE
          : "legacy";
        const migratedSection = {
          ...section,
          calculation_mode: calculationMode,
          items: (Array.isArray(section?.items) ? section.items : []).map((item, itemIndex) => migrateQuoteItemRecord(
            item,
            materialMap.get(item?.material_id),
            quote?.id,
            sectionIndex,
            itemIndex,
            { ...context, quoteStatus: quote?.status || "draft" },
          )),
        };
        if (calculationMode !== EXCEL_FORWARD_CALCULATION_MODE) delete migratedSection.calculation_snapshot;
        return migratedSection;
      }),
    };
    if (String(migrated.status || "draft") === "draft" && quoteHasPendingApprovalMarkers(migrated)) {
      if (migrated.approval_state_recovery?.schema !== "quote-approval-state-recovery/v1") {
        migrated.approval_state_recovery = {
          schema: "quote-approval-state-recovery/v1",
          canonical_status: "draft",
          reason: "草稿含有孤立待審標記；保留證據後清除待審 lease",
          pending_fields: deepClone({
            approval_submission_id: migrated.approval_submission_id,
            submitted_for_approval_at: migrated.submitted_for_approval_at,
            submitted_for_approval_by: migrated.submitted_for_approval_by,
            submitted_for_approval_by_id: migrated.submitted_for_approval_by_id,
            submitted_for_approval_role: migrated.submitted_for_approval_role,
            submitted_for_approval_version_no: migrated.submitted_for_approval_version_no,
            submission_snapshot: migrated.submission_snapshot,
            submission_snapshot_sha256: migrated.submission_snapshot_sha256,
          }),
        };
      }
      migrated.approval_submission_id = "";
      migrated.submitted_for_approval_at = "";
      migrated.submitted_for_approval_by = null;
      migrated.submitted_for_approval_by_id = "";
      migrated.submitted_for_approval_role = "";
      migrated.submitted_for_approval_version_no = null;
      migrated.submission_snapshot = null;
      migrated.submission_snapshot_sha256 = "";
    }
    if (!allowLegacyManualTotal) delete migrated.manualTotal;
    return migrated;
  }

  function migrateAppState(rawState, targetSchemaVersion = 3, migratedAt = new Date().toISOString(), context = {}) {
    const source = deepClone(rawState && typeof rawState === "object" ? rawState : {});
    const migrationContext = {
      ...context,
      sourceSchemaVersion: sourceSchemaNumber(source.meta?.schema_version),
    };
    const materials = (Array.isArray(source.materials) ? source.materials : []).map((material) => migrateMaterialRecord(material, migrationContext));
    const materialMap = new Map(materials.map((material) => [material.id, material]));
    return migrateMaterialCategories({
      ...source,
      materials,
      customers: Array.isArray(source.customers) ? source.customers : [],
      templates: Array.isArray(source.templates) ? source.templates : [],
      quotes: (Array.isArray(source.quotes) ? source.quotes : []).map((quote) => migrateQuoteRecord(quote, materialMap, migrationContext)),
      quote_approval_history: Array.isArray(source.quote_approval_history) ? source.quote_approval_history : [],
      quote_approval_history_head: String(source.quote_approval_history_head || ""),
      meta: {
        ...(source.meta || {}),
        schema_version: targetSchemaVersion,
        quote_approval_history_schema: LOCAL_QUOTE_APPROVAL_HISTORY_SCHEMA,
        migrated_at: Number(source.meta?.schema_version) === Number(targetSchemaVersion) ? source.meta?.migrated_at || "" : migratedAt,
      },
    });
  }

  function migrateQuoteForSchema(quote, materials = []) {
    const migrationContext = {
      sourceSchemaVersion: sourceSchemaNumber(quote?.schema_version),
      source: "local",
      trustExistingHistoricalData: true,
    };
    const migratedMaterials = materials.map((material) => migrateMaterialRecord(material, {
      sourceSchemaVersion: sourceSchemaNumber(material?.schema_version) ?? 3,
      source: "local",
      trustExistingHistoricalData: true,
    }));
    const materialMap = new Map(migratedMaterials.map((material) => [material.id, material]));
    return migrateQuoteRecord(deepClone(quote || {}), materialMap, migrationContext);
  }

  function normalizedPatchedValue(field, value) {
    if (field === "is_chargeable" || field === "is_required_for_preparation") return Boolean(value);
    if (field === "dimension_unit") return value;
    if (field === "detail_drawing_status" || field === "surface_treatment_status") return ["yes", "no", "pending", "not_required"].includes(value) ? value : "pending";
    if (QUOTE_ITEM_NUMERIC_FIELDS.has(field)) return value === "" || value == null ? "" : Number(value);
    return value;
  }

  function quoteItemNumericOptions(field) {
    if (field === "quantity") return { allowBlank: true, min: 0 };
    return { allowBlank: true, min: 0 };
  }

  function applyQuoteItemPatch(item, patch, context = {}) {
    const result = deepClone(item || {});
    const rejectedFields = [];
    const validationErrors = [];
    const editable = QUOTE_EDITABLE_STATUSES.has(context?.status || "draft");
    const hasExplicitActualPrice = Object.prototype.hasOwnProperty.call(patch || {}, "actual_unit_price");
    Object.entries(patch || {}).forEach(([field, value]) => {
      const specificationProtected = itemKind(result) === "catalog"
        && Boolean(result.material_specification_snapshot)
        && ["thickness", "width", "weight", "dimension_unit"].includes(field)
        && context?.allowSpecificationPatch !== true;
      const allowed = editable
        && !specificationProtected
        && (QUOTE_ITEM_INPUT_FIELDS.has(field) || (context?.canEditPricing && QUOTE_ITEM_PRICING_FIELDS.has(field)));
      if (!allowed) {
        rejectedFields.push(field);
        return;
      }
      if (field === "dimension_unit" && !Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, value)) {
        rejectedFields.push(field);
        validationErrors.push("尺寸單位只允許 mm、cm 或 m");
        return;
      }
      if (QUOTE_ITEM_NUMERIC_FIELDS.has(field)) {
        const numeric = finiteNumericValue(value, quoteItemNumericOptions(field));
        if (!numeric.ok) {
          rejectedFields.push(field);
          validationErrors.push(numericValidationMessage(field === "waste_pct" ? "報價損耗加成" : field === "labor_unit_price" ? "工錢單價" : field === "labor_waste_pct" ? "工錢損耗" : field === "actual_unit_price" || field === "unit_price" ? "案件單價" : "材料數值", numeric));
          return;
        }
      }
      const normalized = normalizedPatchedValue(field, value);
      if (field === "unit_price" && hasExplicitActualPrice) return;
      if (field === "unit_price" || field === "actual_unit_price") {
        result.unit_price = normalized;
        result.actual_unit_price = normalized;
      } else {
        result[field] = normalized;
      }
    });
    const actual = Number(result.actual_unit_price);
    const defaultActual = Number(result.default_actual_unit_price);
    result.price_is_override = Number.isFinite(actual) && Number.isFinite(defaultActual) && Math.abs(actual - defaultActual) > 0.000001;
    return { item: result, rejectedFields: Array.from(new Set(rejectedFields)), validationErrors };
  }

  function catalogItemFromMaterial(material, lineId) {
    return migrateQuoteItemRecord({
      line_id: lineId,
      material_id: material.id,
      item_kind: "catalog",
      name: material.name,
      category: material.category,
      unit: material.unit,
      pricing_type: material.pricing_type,
      formula_version: material.formula_version,
      formula_source: material.formula_source,
      formula_source_id: formulaSourceIdFor(material),
      formula_source_version: formulaSourceVersionFor(material),
      formula_source_snapshot: formulaSourceSnapshotFor(material),
      dimension_unit: material.dimension_unit || "cm",
      thickness: material.default_thickness,
      width: material.default_width,
      length: material.default_length,
      weight: material.default_weight,
      wall_thickness_mm: material.wall_thickness_mm,
      density_factor: material.density_factor,
      quantity: 1,
      standard_budget_unit_price: material.standard_budget_unit_price,
      catalog_sale_unit_price: material.catalog_sale_unit_price,
      catalog_sale_price_source: material.catalog_sale_price_source,
      catalog_sale_price_version: material.catalog_sale_price_version,
      catalog_discount_factor: material.catalog_discount_factor,
      default_actual_unit_price: material.default_actual_unit_price ?? material.unit_price,
      actual_unit_price: material.default_actual_unit_price ?? material.unit_price,
      unit_price: material.default_actual_unit_price ?? material.unit_price,
      cost_price: material.cost_price,
      cost_price_status: material.cost_price_status,
      waste_pct: material.waste_pct,
      labor_unit_price: material.labor_unit_price,
      labor_waste_pct: material.labor_waste_pct,
      labor_pricing_type: material.labor_pricing_type,
      price_effective_date: material.price_effective_date,
      notes: material.notes || "",
      catalog_review_required: false,
      catalog_review_reason: "",
    }, material, "new", 0, 0);
  }

  function isVerifiedCatalogMapping(item, material) {
    if (!item || !material || item.material_id !== material.id || itemKind(item) !== "catalog") return false;
    return formulaIdentityMatches(item, material);
  }

  function isStrictExternalCatalogMapping(item, material) {
    if (!isVerifiedCatalogMapping(item, material)) return false;
    return String(item?.formula_source || "") === String(material?.formula_source || "")
      && formulaSourceSnapshotFor(item) === formulaSourceSnapshotFor(material)
      && canonicalStringify(item?.cost_price ?? "") === canonicalStringify(material?.cost_price ?? "")
      && String(item?.cost_price_status || "") === String(material?.cost_price_status || "");
  }

  function hasTrustedCatalogSelection(context, lineId, materialId) {
    const selections = context?.trustedCatalogSelections;
    if (!selections || !lineId || !materialId) return false;
    if (selections instanceof Map) return selections.get(lineId) === materialId;
    return selections[lineId] === materialId;
  }

  function hasTrustedCustomSelection(context, lineId) {
    const selections = context?.trustedCustomSelections;
    if (!selections || !lineId) return false;
    if (selections instanceof Set) return selections.has(lineId);
    if (Array.isArray(selections)) return selections.includes(lineId);
    return Boolean(selections[lineId]);
  }

  function trustedMaterialSpecificationSnapshot(context, lineId) {
    const selections = context?.trustedSpecificationSelections;
    if (!selections || !lineId) return null;
    const selected = selections instanceof Map ? selections.get(lineId) : selections[lineId];
    return selected && typeof selected === "object" ? deepClone(selected) : null;
  }

  function validQuoteMaterialSpecificationSnapshot(snapshot, lineMaterialId) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return false;
    return snapshot.schema === QUOTE_MATERIAL_SPECIFICATION_SNAPSHOT_SCHEMA
      && snapshot.source_schema === MATERIAL_SPECIFICATIONS_SCHEMA
      && snapshot.source_contract === "MaterialSpecifications.getWeight"
      && String(snapshot.material_id || "") === String(lineMaterialId || "")
      && Boolean(String(snapshot.specification_id || "").trim())
      && Boolean(String(snapshot.specification_key || "").trim())
      && Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, snapshot.dimension_unit)
      && Number.isFinite(Number(snapshot.thickness)) && Number(snapshot.thickness) > 0
      && Number.isFinite(Number(snapshot.width)) && Number(snapshot.width) > 0
      && Number.isFinite(Number(snapshot.weight)) && Number(snapshot.weight) > 0
      && Boolean(String(snapshot.selected_at || "").trim());
  }

  function trustedMaterialSpecificationSnapshotMatches(context, lineId, draftSnapshot, materialId) {
    const trusted = trustedMaterialSpecificationSnapshot(context, lineId);
    if (!validQuoteMaterialSpecificationSnapshot(trusted, materialId)
      || !validQuoteMaterialSpecificationSnapshot(draftSnapshot, materialId)) return false;
    return canonicalStringify(trusted) === canonicalStringify(draftSnapshot);
  }

  function validateAppStateForImport(rawState, context = { channel: "external" }) {
    const state = rawState && typeof rawState === "object" ? rawState : {};
    const sourceSchema = sourceSchemaNumber(state.meta?.schema_version);
    const errors = [];
    const selfBackup = context?.channel === "self_backup";
    const migrationContext = {
      ...context,
      sourceSchemaVersion: sourceSchema,
      source: selfBackup ? "self_backup" : "external_import",
      trustExistingHistoricalData: false,
    };
    const rawMaterials = Array.isArray(state.materials) ? state.materials : [];
    const migratedMaterials = rawMaterials.map((record) => migrateMaterialRecord(record, migrationContext));
    const materialMap = new Map(migratedMaterials.map((record) => [record.id, record]));

    rawMaterials.forEach((record, index) => {
      const unit = record?.dimension_unit;
      if (hasValue(unit) && !Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, unit)) errors.push(`材料 ${index + 1} 的尺寸單位只允許 mm、cm 或 m`);
      if (!hasValue(unit) && !(sourceSchema != null && sourceSchema < 3)) errors.push(`材料 ${index + 1} 缺少可信的尺寸單位`);
      const validation = validateMaterialForPersistence(migratedMaterials[index]);
      errors.push(...validation.errors.map((error) => `材料 ${index + 1}：${error}`));
    });
    const materialCategoryValidation = validateMaterialCategories(state);
    errors.push(...materialCategoryValidation.errors.map((error) => `材料分類：${error}`));

    (Array.isArray(state.quotes) ? state.quotes : []).forEach((quote, quoteIndex) => {
      if (hasValue(quote?.manualTotal)) {
        const preV3 = sourceSchema != null && sourceSchema < 3;
        const lineage = trustedManualLineageEntry(context, quote);
        const completeLegacyProvenance = quote?.legacy_manual_total === true
          && quote?.legacy_manual_total_source === "legacy-manual-total"
          && sourceSchemaNumber(quote?.legacy_manual_total_source_schema) != null
          && Number(quote.legacy_manual_total_source_schema) < 3;
        if (!preV3 && !(selfBackup && lineage && completeLegacyProvenance)) {
          errors.push(`報價 ${quoteIndex + 1} 的 schema v3／未知來源不得包含未經自產備份 lineage 驗證的 manualTotal 手動總價`);
        }
      }
      errors.push(...validateQuoteNumericPolicy(quote).errors.map((error) => `報價 ${quoteIndex + 1}：${error}`));
      (Array.isArray(quote?.sections) ? quote.sections : []).forEach((section, sectionIndex) => {
        if (section?.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE) {
          errors.push(...validateExcelCalculationSnapshot(section).errors.map((error) => `報價 ${quoteIndex + 1} 工程 ${sectionIndex + 1}：${error}`));
        }
        (Array.isArray(section?.items) ? section.items : []).forEach((item, itemIndex) => {
          const prefix = `報價 ${quoteIndex + 1} 工程 ${sectionIndex + 1} 材料 ${itemIndex + 1}`;
          const unit = item?.dimension_unit;
          if (hasValue(unit) && !Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, unit)) errors.push(`${prefix}的尺寸單位只允許 mm、cm 或 m`);
          if (!hasValue(unit) && !(sourceSchema != null && sourceSchema < 3)) errors.push(`${prefix}缺少可信的尺寸單位`);
          const material = materialMap.get(item?.material_id);
          if (sourceSchema != null && sourceSchema < 3) {
            if (item?.material_id && !material) errors.push(`${prefix}引用不存在的材料庫品項`);
            return;
          }
          if (item?.item_kind === "custom" && item?.material_id) {
            errors.push(`${prefix}是自訂品項，不得夾帶材料庫 ID`);
          } else if (item?.item_kind === "catalog" || item?.material_id) {
            if (!material) {
              errors.push(`${prefix}引用不存在的材料庫品項`);
            } else if (selfBackup) {
              if (!trustedFormulaLineageEntry(context, quote, sectionIndex, itemIndex, item)) errors.push(`${prefix}缺少完整的歷史公式 lineage`);
              if (!KNOWN_FORMULA_VERSIONS.has(item?.formula_version) || !KNOWN_PRICING_TYPES.has(item?.pricing_type)) errors.push(`${prefix}使用目前版本無法辨識的歷史公式`);
            } else if (!isStrictExternalCatalogMapping(item, material)) {
              errors.push(`${prefix}不是可驗證的材料庫映射，或公式／成本來源與目前主檔不一致`);
            }
          }
        });
      });
    });
    return { ok: errors.length === 0, errors: Array.from(new Set(errors)) };
  }

  function sanitizeQuoteForPersistence(draft, existing, materials = [], context = {}) {
    const source = deepClone(draft || {});
    const existingQuote = existing ? deepClone(existing) : null;
    const rejectedFields = [];
    const validationErrors = [];
    const sourceStatus = existingQuote?.status || "draft";
    const quoteEditable = QUOTE_EDITABLE_STATUSES.has(sourceStatus);
    if (existingQuote && !quoteEditable && !context?.allowStatusSanitize) {
      return { quote: existingQuote, rejectedFields: ["quote"], validationErrors: [], blockedByStatus: true };
    }
    const allowedQuoteFields = [
      "customer_id", "template_id", "title", "project_name", "project_address", "project_contact",
      "quote_date", "valid_until", "owner_id", "next_follow_up", "lost_reason", "status",
      "extra_notes", "estimate_method", "included_scope", "excluded_scope",
    ];
    const quote = existingQuote || {};
    allowedQuoteFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(source, field)) quote[field] = deepClone(source[field]);
    });
    if (!context?.allowStatusSanitize) {
      const transition = validateQuoteStatusTransition(existingQuote?.status, quote.status || "draft", { canApprove: Boolean(context?.canApprove) });
      if (!transition.ok) {
        quote.status = existingQuote?.status || "draft";
        rejectedFields.push("status");
      }
    }
    if (!existingQuote) {
      quote.discount_amount = 0;
      quote.tax_rate = finiteNumber(context?.defaultTaxRate, 5);
      quote.adjustment_reason = "";
    }
    if (context?.canEditPricing) {
      [["discount_amount", "折扣／調整金額", { allowBlank: false, min: 0 }], ["tax_rate", "稅率", { allowBlank: false, min: 0, max: 100 }]].forEach(([field, label, options]) => {
        if (!Object.prototype.hasOwnProperty.call(source, field)) return;
        const numeric = finiteNumericValue(source[field], options);
        if (numeric.ok) quote[field] = numeric.value;
        else {
          rejectedFields.push(field);
          validationErrors.push(numericValidationMessage(label, numeric));
        }
      });
      if (Object.prototype.hasOwnProperty.call(source, "adjustment_reason")) quote.adjustment_reason = String(source.adjustment_reason || "");
    }
    quote.safety_rules_version = 1;
    quote.schema_version = 3;
    quote.estimate_method = ["detailed", "quick"].includes(quote.estimate_method) ? quote.estimate_method : "detailed";
    quote.included_scope = normalizeList(quote.included_scope);
    quote.excluded_scope = normalizeList(quote.excluded_scope);
    quote.adjustment_reason = String(quote.adjustment_reason || "");

    const trustedExistingManualTotal = existingQuote?.legacy_manual_total === true
      && sourceSchemaNumber(existingQuote?.legacy_manual_total_source_schema) != null
      && Number(existingQuote.legacy_manual_total_source_schema) < 3
      && existingQuote?.legacy_manual_total_source === "legacy-manual-total";
    if (hasValue(source.manualTotal)) {
      if (trustedExistingManualTotal && source.manualTotal === existingQuote.manualTotal) {
        quote.manualTotal = existingQuote.manualTotal;
        quote.legacy_manual_total = true;
        quote.legacy_manual_total_source = existingQuote.legacy_manual_total_source || "legacy-manual-total";
        quote.legacy_manual_total_source_schema = existingQuote.legacy_manual_total_source_schema;
      } else {
        delete quote.manualTotal;
        quote.legacy_manual_total = false;
        quote.legacy_manual_total_source = "";
        quote.legacy_manual_total_source_schema = null;
        rejectedFields.push("manualTotal");
        validationErrors.push("新 schema 或不可信來源不得建立 manualTotal 手動總價");
      }
    } else if (trustedExistingManualTotal && hasValue(existingQuote.manualTotal)) {
      quote.manualTotal = existingQuote.manualTotal;
      quote.legacy_manual_total = true;
      quote.legacy_manual_total_source = existingQuote.legacy_manual_total_source || "legacy-manual-total";
      quote.legacy_manual_total_source_schema = existingQuote.legacy_manual_total_source_schema;
    } else {
      delete quote.manualTotal;
      quote.legacy_manual_total = false;
      quote.legacy_manual_total_source = "";
      quote.legacy_manual_total_source_schema = null;
    }

    const materialMap = new Map(materials.map((material) => {
      const migrated = migrateMaterialRecord(material);
      return [migrated.id, migrated];
    }));
    quote.sections = (Array.isArray(source.sections) ? source.sections : []).map((section, sectionIndex) => {
      const existingSection = existingQuote?.sections?.[sectionIndex];
      const areaQuantity = finiteNumericValue(section?.area_qty, { allowBlank: true, min: 0 });
      if (!areaQuantity.ok) {
        rejectedFields.push(`sections.${sectionIndex}.area_qty`);
        validationErrors.push(numericValidationMessage(`工程 ${sectionIndex + 1} 的面積或數量`, areaQuantity));
      }
      const items = (Array.isArray(section?.items) ? section.items : []).map((draftItem, itemIndex) => {
        const existingItems = Array.isArray(existingSection?.items) ? existingSection.items : [];
        const existingItem = existingItems.find((item) => item?.line_id && item.line_id === draftItem?.line_id) || existingItems[itemIndex];
        const trustedCustomSelection = hasTrustedCustomSelection(context, draftItem?.line_id);
        const trustedExistingItem = context?.trustProtectedFields === false || trustedCustomSelection ? null : existingItem;
        const draftMaterial = materialMap.get(draftItem?.material_id);
        const existingMaterial = trustedExistingItem && itemKind(trustedExistingItem) === "catalog" ? materialMap.get(trustedExistingItem.material_id) : null;
        const trustedCatalogSelection = hasTrustedCatalogSelection(context, draftItem?.line_id, draftItem?.material_id);
        const trustedSpecificationSelection = trustedMaterialSpecificationSnapshotMatches(
          context,
          draftItem?.line_id,
          draftItem?.material_specification_snapshot,
          draftItem?.material_id,
        );
        const verifiedImportedCatalog = Boolean(context?.allowVerifiedCatalogMappings && isStrictExternalCatalogMapping(draftItem, draftMaterial));
        let material = null;
        if (!trustedCustomSelection && existingMaterial) {
          if (!draftItem?.material_id || draftItem.material_id === existingMaterial.id) material = existingMaterial;
          else if (draftMaterial && trustedCatalogSelection) material = draftMaterial;
          else {
            material = existingMaterial;
            validationErrors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 的材料來源變更未經材料庫選取`);
            rejectedFields.push(`sections.${sectionIndex}.items.${itemIndex}.material_id`);
          }
        } else if (!trustedCustomSelection && draftMaterial && (trustedCatalogSelection || verifiedImportedCatalog)) {
          material = draftMaterial;
        } else if (!trustedCustomSelection && draftItem?.material_id) {
          validationErrors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 的材料來源變更未經材料庫選取`);
          rejectedFields.push(`sections.${sectionIndex}.items.${itemIndex}.material_id`);
        }
        let base;
        if (material) {
          base = catalogItemFromMaterial(material, draftItem?.line_id || existingItem?.line_id);
          if (existingItem && existingMaterial && existingMaterial.id === material.id && !trustedCatalogSelection) {
            [
              "line_id", "name", "unit", "item_kind", "thickness", "width", "length", "weight", "dimension_unit",
               "wall_thickness_mm", "quantity", "custom_dimensions_spec", "detail_drawing_status",
               "surface_treatment_status", "notes", "breakdown_adjustment_qty", "breakdown_adjustment_reason",
               "standard_budget_unit_price", "standard_budget_source", "standard_budget_version",
              "catalog_sale_unit_price", "catalog_sale_price_source", "catalog_sale_price_version", "catalog_discount_factor",
              "default_actual_unit_price", "actual_unit_price", "unit_price", "price_source", "price_version",
              "price_is_override", "price_override_reason", "waste_pct", "labor_unit_price", "labor_waste_pct",
              "is_chargeable", "is_required_for_preparation", "formula_version", "formula_source",
               "formula_source_id", "formula_source_version", "formula_source_snapshot",
              "material_specification_snapshot",
              "catalog_review_required", "catalog_review_reason",
            ].forEach((field) => {
              if (Object.prototype.hasOwnProperty.call(existingItem, field)) base[field] = deepClone(existingItem[field]);
            });
          }
        }
        else base = trustedExistingItem
          ? migrateQuoteItemRecord(trustedExistingItem, null, quote.id, sectionIndex, itemIndex)
          : migrateQuoteItemRecord({ item_kind: "custom", line_id: draftItem?.line_id, pricing_type: "single", formula_version: "legacy-v1", formula_source: "custom-default", unit: "件", quantity: 1, actual_unit_price: 0, unit_price: 0 }, null, quote.id, sectionIndex, itemIndex);
        const patchResult = applyQuoteItemPatch(base, draftItem, { status: context?.allowStatusSanitize ? "draft" : sourceStatus, canEditPricing: Boolean(context?.canEditPricing) });
        rejectedFields.push(...patchResult.rejectedFields.map((field) => `sections.${sectionIndex}.items.${itemIndex}.${field}`));
        validationErrors.push(...patchResult.validationErrors.map((error) => `工程 ${sectionIndex + 1} 材料 ${itemIndex + 1}：${error}`));
        if (material) {
          patchResult.item.material_id = material.id;
          patchResult.item.item_kind = "catalog";
          patchResult.item.pricing_type = base.pricing_type;
          patchResult.item.formula_version = base.formula_version;
          patchResult.item.formula_source = base.formula_source;
          patchResult.item.formula_source_id = base.formula_source_id;
          patchResult.item.formula_source_version = base.formula_source_version;
          patchResult.item.formula_source_snapshot = base.formula_source_snapshot;
          patchResult.item.density_factor = base.density_factor;
          patchResult.item.labor_pricing_type = base.labor_pricing_type;
          patchResult.item.standard_budget_unit_price = base.standard_budget_unit_price;
          patchResult.item.standard_budget_source = base.standard_budget_source;
          patchResult.item.standard_budget_version = base.standard_budget_version;
          patchResult.item.catalog_sale_unit_price = base.catalog_sale_unit_price;
          patchResult.item.catalog_sale_price_source = base.catalog_sale_price_source;
          patchResult.item.catalog_sale_price_version = base.catalog_sale_price_version;
          patchResult.item.catalog_discount_factor = base.catalog_discount_factor;
          patchResult.item.cost_price = base.cost_price;
          patchResult.item.cost_price_status = base.cost_price_status;
          patchResult.item.catalog_review_required = Boolean(base.catalog_review_required);
          patchResult.item.catalog_review_reason = base.catalog_review_reason || "";
          const existingSnapshot = existingItem?.material_specification_snapshot;
          if (trustedSpecificationSelection) {
            const authoritativeSnapshot = trustedMaterialSpecificationSnapshot(context, draftItem.line_id);
            patchResult.item.thickness = authoritativeSnapshot.thickness;
            patchResult.item.width = authoritativeSnapshot.width;
            patchResult.item.weight = authoritativeSnapshot.weight;
            patchResult.item.dimension_unit = authoritativeSnapshot.dimension_unit;
            patchResult.item.material_specification_snapshot = authoritativeSnapshot;
          } else if (validQuoteMaterialSpecificationSnapshot(existingSnapshot, material.id)
            && existingMaterial?.id === material.id
            && !trustedCatalogSelection) {
            patchResult.item.thickness = existingSnapshot.thickness;
            patchResult.item.width = existingSnapshot.width;
            patchResult.item.weight = existingSnapshot.weight;
            patchResult.item.dimension_unit = existingSnapshot.dimension_unit;
            patchResult.item.material_specification_snapshot = deepClone(existingSnapshot);
          } else if (draftItem?.material_specification_snapshot) {
            validationErrors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 的規格快照未經材料規格契約解析`);
            rejectedFields.push(`sections.${sectionIndex}.items.${itemIndex}.material_specification_snapshot`);
            delete patchResult.item.material_specification_snapshot;
            patchResult.item.weight = base.weight;
          }
        } else if (!trustedExistingItem) {
          patchResult.item.default_actual_unit_price = patchResult.item.actual_unit_price ?? patchResult.item.unit_price ?? 0;
          patchResult.item.actual_unit_price = patchResult.item.default_actual_unit_price;
          patchResult.item.unit_price = patchResult.item.default_actual_unit_price;
          patchResult.item.price_is_override = false;
          patchResult.item.price_source = "本案客製報價";
          patchResult.item.price_version = quote.quote_no || quote.quote_date || "draft";
          patchResult.item.price_override_reason = "";
        }
        if (!material) {
          patchResult.item.item_kind = "custom";
          patchResult.item.material_id = "";
        }
        if (!material) {
          patchResult.item.price_source = patchResult.item.price_source || "本案客製報價";
          patchResult.item.price_version = patchResult.item.price_version || quote.quote_no || quote.quote_date || "draft";
        }
        return patchResult.item;
      });
      const trustedLaborItems = Array.isArray(existingSection?.laborItems)
        ? existingSection.laborItems
        : Array.isArray(context?.template?.laborItems)
          ? context.template.laborItems
          : [];
      const laborValue = (row, rowIndex, field, label, options) => {
        const trustedValue = trustedLaborItems[rowIndex]?.[field] ?? "";
        if (!context?.canEditPricing) return trustedValue;
        const numeric = finiteNumericValue(row?.[field], options);
        if (numeric.ok) return numeric.value;
        rejectedFields.push(`sections.${sectionIndex}.laborItems.${rowIndex}.${field}`);
        validationErrors.push(numericValidationMessage(`工程 ${sectionIndex + 1} 工錢 ${rowIndex + 1} 的${label}`, numeric));
        return trustedValue;
      };
      const calculationMode = existingSection
        ? existingSection.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE ? EXCEL_FORWARD_CALCULATION_MODE : "legacy"
        : section?.calculation_mode === EXCEL_FORWARD_CALCULATION_MODE ? EXCEL_FORWARD_CALCULATION_MODE : "legacy";
      const laborDefaults = {
        labor_per_board_foot: EXCEL_FORWARD_CONSTANTS.labor_per_board_foot_default,
        carpenter_allocation: 1,
        metalworker_allocation: 0,
        carpenter_daily_rate: EXCEL_FORWARD_CONSTANTS.carpenter_daily_rate_default,
        metalworker_daily_rate: EXCEL_FORWARD_CONSTANTS.metalworker_daily_rate_default,
      };
      const sourceLaborConfig = section?.labor_config || {};
      const trustedLaborConfig = existingSection?.labor_config || laborDefaults;
      const laborConfigValue = (field, label, options) => {
        const trustedValue = trustedLaborConfig[field] ?? laborDefaults[field];
        if (!context?.canEditPricing) return trustedValue;
        const numeric = finiteNumericValue(sourceLaborConfig[field] ?? laborDefaults[field], options);
        if (numeric.ok) return numeric.value;
        rejectedFields.push(`sections.${sectionIndex}.labor_config.${field}`);
        validationErrors.push(numericValidationMessage(`工程 ${sectionIndex + 1} 的${label}`, numeric));
        return trustedValue;
      };
      const savedSection = {
        name: section?.name || "",
        area_qty: areaQuantity.ok ? areaQuantity.value : existingSection?.area_qty ?? 1,
        unit: section?.unit || "M²",
        spec: section?.spec || "",
        calculation_mode: calculationMode,
        items,
        laborItems: (Array.isArray(section?.laborItems) ? section.laborItems : []).map((row, rowIndex) => ({
          name: row?.name || "",
          unit: row?.unit || "式",
          pct: laborValue(row, rowIndex, "pct", "分配百分比", { allowBlank: true, min: 0, max: 100 }),
          unit_price: laborValue(row, rowIndex, "unit_price", "單價", { allowBlank: true, min: 0 }),
          manual_amount: laborValue(row, rowIndex, "manual_amount", "手動金額", { allowBlank: true, min: 0 }),
          is_balancer: context?.canEditPricing ? Boolean(row?.is_balancer) : Boolean(trustedLaborItems[rowIndex]?.is_balancer),
        })),
      };
      if (calculationMode === EXCEL_FORWARD_CALCULATION_MODE) {
        savedSection.labor_config = {
          labor_per_board_foot: laborConfigValue("labor_per_board_foot", "每才工資", { allowBlank: false, min: 0 }),
          carpenter_allocation: laborConfigValue("carpenter_allocation", "木工分配比例", { allowBlank: false, min: 0, max: 1 }),
          metalworker_allocation: laborConfigValue("metalworker_allocation", "鐵工分配比例", { allowBlank: false, min: 0, max: 1 }),
          carpenter_daily_rate: laborConfigValue("carpenter_daily_rate", "木工單價", { allowBlank: false, min: 0 }),
          metalworker_daily_rate: laborConfigValue("metalworker_daily_rate", "鐵工單價", { allowBlank: false, min: 0 }),
        };
        const sourceLaborDetail = section?.labor_detail_contract;
        const existingLaborDetail = existingSection?.labor_detail_contract;
        if (sourceLaborDetail) {
          const normalized = normalizeExcelLaborDetailContract(sourceLaborDetail);
          if (normalized.ok) savedSection.labor_detail_contract = normalized.value;
          else {
            rejectedFields.push(`sections.${sectionIndex}.labor_detail_contract`);
            validationErrors.push(`工程 ${sectionIndex + 1}：${normalized.error}`);
            const trustedExisting = normalizeExcelLaborDetailContract(existingLaborDetail);
            if (trustedExisting.ok) savedSection.labor_detail_contract = trustedExisting.value;
          }
        } else if (existingLaborDetail) {
          const trustedExisting = normalizeExcelLaborDetailContract(existingLaborDetail);
          if (trustedExisting.ok) savedSection.labor_detail_contract = trustedExisting.value;
          else {
            rejectedFields.push(`sections.${sectionIndex}.labor_detail_contract`);
            validationErrors.push(`工程 ${sectionIndex + 1}：${trustedExisting.error}`);
          }
        } else {
          const preliminary = calculateExcelQuoteSection(savedSection, { calculatedAt: context?.calculatedAt });
          if (preliminary.ok) {
            savedSection.labor_detail_contract = excelLaborDetailContractFromSnapshot(
              preliminary.laborDist.defaultSnapshot,
              preliminary.laborDist.defaultSnapshot.captured_at,
            );
          }
        }
        const calculated = calculateExcelQuoteSection(savedSection, { calculatedAt: context?.calculatedAt });
        if (calculated.ok) savedSection.calculation_snapshot = calculated.calculationSnapshot;
        else validationErrors.push(...calculated.errors.map((error) => `工程 ${sectionIndex + 1}：${error}`));
      }
      return savedSection;
    });
    validationErrors.push(...validateQuoteNumericPolicy(quote).errors);
    return {
      quote,
      rejectedFields: Array.from(new Set(rejectedFields)),
      validationErrors: Array.from(new Set(validationErrors)),
      blockedByStatus: false,
    };
  }

  function quoteEstimateWarning(quote) {
    if (quote?.legacy_manual_total) return "舊資料相容總價：僅供追溯，禁止建立新的無來源手動總價";
    return quote?.estimate_method === "quick" ? "快速估算：不得直接用於精算／備料" : "";
  }

  function applyQuoteWasteMarkup(baseQty, wastePct) {
    const baseValidation = finiteNumericValue(baseQty, { allowBlank: false, min: 0 });
    if (!baseValidation.ok) throw new RangeError(numericValidationMessage("計價基數", baseValidation));
    const wasteValidation = finiteNumericValue(wastePct ?? 0, { allowBlank: false, min: 0 });
    if (!wasteValidation.ok) throw new RangeError(numericValidationMessage("報價損耗加成", wasteValidation));
    const base = baseValidation.value;
    const quoteWasteQty = base * (wasteValidation.value / 100);
    return {
      base_qty: base,
      quote_waste_qty: quoteWasteQty,
      priceable_qty: base + quoteWasteQty,
      affects_inventory: false,
      affects_cut_plan: false,
    };
  }

  function validatePreparationReadiness(quote) {
    const errors = [];
    if (quote?.estimate_method !== "detailed") errors.push("快速估算不得標示為可採購／可備料");
    (quote?.sections || []).forEach((section, sectionIndex) => (section?.items || []).forEach((item, itemIndex) => {
      if (item?.is_required_for_preparation === false) return;
      if (item?.catalog_review_required) errors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 主檔已變更／待覆核`);
      if (itemKind(item) === "custom") {
        if (!String(item?.custom_dimensions_spec || "").trim()) errors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 缺少客製尺寸／規格`);
        if (!["yes", "no"].includes(item?.detail_drawing_status) || !["yes", "no"].includes(item?.surface_treatment_status)) errors.push(`工程 ${sectionIndex + 1} 材料 ${itemIndex + 1} 尚有待補或無效資料`);
      }
    }));
    return { ok: errors.length === 0, errors };
  }

  function validateMaterialForPersistence(material) {
    const errors = [];
    if (!KNOWN_PRICING_TYPES.has(material?.pricing_type)) errors.push("材料使用未核准的計價方式");
    if (!KNOWN_FORMULA_VERSIONS.has(material?.formula_version)) errors.push("材料使用未核准的公式版本");
    if (!String(material?.formula_source || "").trim()) errors.push("請填寫公式來源");
    if (!Object.prototype.hasOwnProperty.call(DIMENSION_UNIT_TO_CM, material?.dimension_unit)) errors.push("材料尺寸單位無效");
    if (hasValue(material?.standard_budget_unit_price)) {
      if (!String(material?.standard_budget_source || "").trim()) errors.push("標準／預算價有數值時必須填寫來源");
      if (!String(material?.standard_budget_version || "").trim()) errors.push("標準／預算價有數值時必須填寫版本");
    }
    if (hasValue(material?.catalog_sale_unit_price)) {
      if (!String(material?.catalog_sale_price_source || "").trim()) errors.push("折數後目錄售價有數值時必須填寫來源");
      if (!String(material?.catalog_sale_price_version || "").trim()) errors.push("折數後目錄售價有數值時必須填寫版本");
    }
    if (!String(material?.actual_price_source || "").trim() || !String(material?.actual_price_version || "").trim()) errors.push("案件單價預設值必須有來源與版本");
    [
      [material?.default_thickness, "預設厚度", { allowBlank: true, min: 0 }],
      [material?.default_width, "預設寬度／外徑", { allowBlank: true, min: 0 }],
      [material?.default_length, "預設長度", { allowBlank: true, min: 0 }],
      [material?.default_weight, "預設重量", { allowBlank: true, min: 0 }],
      [material?.wall_thickness_mm, "壁厚", { allowBlank: true, min: 0 }],
      [material?.density_factor, "重量換算係數", { allowBlank: true, min: 0 }],
      [material?.standard_budget_unit_price, "標準／預算價", { allowBlank: true, min: 0 }],
      [material?.catalog_sale_unit_price, "折數後目錄售價", { allowBlank: true, min: 0 }],
      [material?.catalog_discount_factor, "目錄折數", { allowBlank: true, min: 0 }],
      [material?.default_actual_unit_price ?? material?.unit_price, "案件單價預設值", { allowBlank: false, min: 0 }],
      [material?.cost_price, "成本價", { allowBlank: true, min: 0 }],
      [material?.waste_pct, "報價損耗加成", { allowBlank: true, min: 0 }],
      [material?.labor_unit_price, "工錢單價", { allowBlank: true, min: 0 }],
      [material?.labor_waste_pct, "工錢損耗", { allowBlank: true, min: 0 }],
    ].forEach(([value, label, options]) => {
      const numeric = finiteNumericValue(value, options);
      if (!numeric.ok) errors.push(numericValidationMessage(label, numeric));
    });
    if (material?.labor_pricing_type && !KNOWN_PRICING_TYPES.has(material.labor_pricing_type)) errors.push("工錢使用未核准的計價方式");
    if (material?.cost_price_status === "verified" && !hasValue(material?.cost_price)) errors.push("已確認成本價不可空白");
    const specificationsValidation = validateMaterialSpecifications(material);
    if (!specificationsValidation.ok) errors.push(`材料規格：${specificationsValidation.error}`);
    return { ok: errors.length === 0, errors };
  }

  function evaluateLinearCutPolicy(input = {}) {
    const stockLength = Math.max(0, finiteNumber(input.stock_length_cm));
    const pieceLength = Math.max(0, finiteNumber(input.piece_length_cm));
    const kerf = Math.max(0, finiteNumber(input.kerf_cm));
    const requested = Math.max(0, Math.floor(finiteNumber(input.requested_pieces)));
    const maxCompletePieces = pieceLength > 0 ? Math.max(0, Math.floor((stockLength + kerf) / (pieceLength + kerf))) : 0;
    const requiredLength = requested > 0 ? requested * pieceLength + Math.max(0, requested - 1) * kerf : 0;
    const feasible = requiredLength <= stockLength + 1e-9;
    return {
      stock_length_cm: stockLength,
      piece_length_cm: pieceLength,
      kerf_cm: kerf,
      requested_pieces: requested,
      max_complete_pieces: maxCompletePieces,
      required_length_cm: requiredLength,
      requested_feasible: feasible,
      warning: feasible ? "" : `已計入每刀 ${kerf} cm 鋸路，母材不足以取得 ${requested} 支完整成品`,
    };
  }

  function createQuoteSnapshot({ quote, customer, template, company, totals, issuedAt, issuedBy }) {
    return deepClone({
      schema: "quote-document-snapshot/v1",
      issued_at: issuedAt || new Date().toISOString(),
      issued_by: issuedBy || null,
      quote: quote || {},
      customer: customer || {},
      template: template || {},
      company: company || {},
      totals: totals || {},
    });
  }

  function backupRecordId(record, index) {
    if (!record || typeof record !== "object") return String(index);
    return String(record.id || record.line_id || record.quote_no || record.account || record.key || index);
  }

  async function hashRecordCollection(records) {
    const list = Array.isArray(records) ? records : [];
    return {
      length: list.length,
      sha256: await hashCanonicalValue(list),
      records: await Promise.all(list.map(async (record, index) => ({
        index,
        record_id: backupRecordId(record, index),
        sha256: await hashCanonicalValue(record),
      }))),
    };
  }

  async function buildRecordHashManifest(data) {
    const state = data?.state && typeof data.state === "object" ? data.state : {};
    const stateFields = await Promise.all(Object.keys(state).sort().map(async (key) => {
      const value = state[key];
      const entry = {
        key,
        kind: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
        sha256: await hashCanonicalValue(value),
      };
      if (Array.isArray(value)) entry.collection = await hashRecordCollection(value);
      return entry;
    }));
    const result = {
      state_fields: stateFields,
      accounts: await hashRecordCollection(data?.accounts),
      work_logs: await hashRecordCollection(data?.work_logs),
    };
    if (data && data.bug_reports !== undefined) result.bug_reports = await hashRecordCollection(data.bug_reports?.reports || data.bug_reports);
    return result;
  }

  async function buildBackupLineage(state) {
    const legacyManualTotals = [];
    const catalogFormulaSnapshots = [];
    const lockedDocumentSnapshots = [];
    for (const quote of Array.isArray(state?.quotes) ? state.quotes : []) {
      if (hasValue(quote?.manualTotal)) {
        const originSchema = sourceSchemaNumber(quote?.legacy_manual_total_source_schema);
        if (quote?.legacy_manual_total !== true
          || quote?.legacy_manual_total_source !== "legacy-manual-total"
          || originSchema == null
          || originSchema >= 3) {
          throw new Error(`報價 ${quote?.quote_no || quote?.id || "未命名"} 的 legacy manualTotal 缺少完整來源 lineage`);
        }
        const record = {
          quote_id: String(quote?.id || ""),
          source: "legacy-manual-total",
          origin_schema: originSchema,
          manual_total: quote.manualTotal,
          estimate_method: String(quote?.estimate_method || "quick"),
          readonly: true,
        };
        if (!record.quote_id) throw new Error("legacy manualTotal 缺少報價 ID");
        legacyManualTotals.push({ ...record, sha256: await hashCanonicalValue(record) });
      }
      const sections = Array.isArray(quote?.sections) ? quote.sections : [];
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const items = Array.isArray(sections[sectionIndex]?.items) ? sections[sectionIndex].items : [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
          const item = items[itemIndex];
          if (itemKind(item) !== "catalog") continue;
          if (!quote?.id || !item?.line_id || !item?.material_id) throw new Error("catalog 歷史公式 lineage 缺少報價、明細或材料 ID");
          const record = {
            quote_id: String(quote.id),
            quote_status: String(quote.status || "draft"),
            section_index: sectionIndex,
            item_index: itemIndex,
            line_id: String(item.line_id),
            material_id: String(item.material_id),
            pricing_type: String(item.pricing_type || "single"),
            formula_version: String(item.formula_version || "legacy-v1"),
            formula_source_id: formulaSourceIdFor(item),
            formula_source_version: formulaSourceVersionFor(item),
            formula_source_snapshot: formulaSourceSnapshotFor(item),
          };
          catalogFormulaSnapshots.push({ ...record, sha256: await hashCanonicalValue(record) });
        }
      }
      if (quote?.document_snapshot) {
        const record = {
          quote_id: String(quote?.id || ""),
          quote_status: String(quote?.status || ""),
          snapshot_sha256: await hashCanonicalValue(quote.document_snapshot),
        };
        lockedDocumentSnapshots.push({ ...record, sha256: await hashCanonicalValue(record) });
      }
    }
    return {
      schema: BACKUP_LINEAGE_SCHEMA,
      legacy_manual_totals: legacyManualTotals,
      catalog_formula_snapshots: catalogFormulaSnapshots,
      locked_document_snapshots: lockedDocumentSnapshots,
    };
  }

  async function createBackupBundle({ state, accounts, workLogs, bugReports, exportedAt, appVersion }) {
    const exported = exportedAt || new Date().toISOString();
    const version = appVersion || BACKUP_APP_VERSION;
    const sourceState = jsonClone(state || {});
    await buildBackupLineage(sourceState);
    const canonicalState = migrateAppState(sourceState, 3, exported, {
      source: "backup_export",
      trustExistingHistoricalData: true,
    });
    const data = jsonClone({
      state: canonicalState,
      accounts: Array.isArray(accounts) ? accounts : [],
      work_logs: Array.isArray(workLogs) ? workLogs : [],
    });
    if (bugReports !== undefined) data.bug_reports = bugReports;
    const stateSchema = sourceSchemaNumber(data.state?.meta?.schema_version);
    if (version !== BACKUP_APP_VERSION) throw new Error(`只能建立 ${BACKUP_APP_VERSION} 版的自產備份`);
    if (stateSchema !== 3) throw new Error("自產備份只接受已遷移完成的 schema v3 state");
    const lineage = await buildBackupLineage(data.state);
    const exportValidation = validateAppStateForImport(data.state, {
      channel: "self_backup",
      source: "backup_export",
      trustExistingHistoricalData: false,
      trustedBackupLineage: lineage,
    });
    if (!exportValidation.ok) throw new Error(`目前資料未通過完整備份檢查：${exportValidation.errors[0]}`);
    const manifest = {
      schema: BACKUP_MANIFEST_SCHEMA,
      producer: BACKUP_PRODUCER,
      backup_schema: BACKUP_SCHEMA,
      backup_format_version: 2,
      app_version: version,
      state_schema_version: stateSchema,
      exported_at: exported,
      canonical_payload: {
        format: CANONICAL_JSON_FORMAT,
        algorithm: "SHA-256",
        sha256: await hashCanonicalValue(data),
      },
      record_hashes: await buildRecordHashManifest(data),
      lineage,
    };
    return {
      schema: BACKUP_SCHEMA,
      exported_at: exported,
      app_version: version,
      manifest,
      data,
    };
  }

  function backupCollectionsAreValid(bundle) {
    const state = bundle?.data?.state;
    const validCollections = state && ["materials", "customers", "templates", "quotes"].every((key) => Array.isArray(state[key]));
    const accounts = bundle?.data?.accounts;
    const hasActiveManager = Array.isArray(accounts) && accounts.some((account) => ["owner", "admin"].includes(account?.role) && account?.is_active !== false && account?.account);
    const hasOnlyKnownRoles = Array.isArray(accounts) && accounts.every((account) => ["owner", "admin", "staff", "contractor"].includes(account?.role));
    const bugReports = bundle?.data?.bug_reports;
    const validBugReports = bugReports === undefined || (
      bugReports?.schema === "bug-reports-backup/v1"
      && Array.isArray(bugReports.reports)
      && Array.isArray(bugReports.attachments)
    );
    return Boolean(validCollections && hasActiveManager && hasOnlyKnownRoles && Array.isArray(bundle?.data?.work_logs) && validBugReports);
  }

  async function validateBackupBundle(bundle) {
    if (bundle?.schema === LEGACY_BACKUP_SCHEMA) {
      const ok = backupCollectionsAreValid(bundle);
      return {
        ok,
        channel: ok ? "external" : "",
        error: ok ? "" : "舊版／外部匯入檔格式不正確或資料不完整",
        restoreContext: ok ? { channel: "external", source: "external_import", trustExistingHistoricalData: false } : null,
      };
    }
    if (bundle?.schema !== BACKUP_SCHEMA) return { ok: false, channel: "", error: "備份檔格式不正確或版本無法辨識", restoreContext: null };
    if (!backupCollectionsAreValid(bundle)) return { ok: false, channel: "", error: "自產備份資料不完整", restoreContext: null };
    const manifest = bundle?.manifest;
    if (!manifest
      || manifest.schema !== BACKUP_MANIFEST_SCHEMA
      || manifest.producer !== BACKUP_PRODUCER
      || manifest.backup_schema !== BACKUP_SCHEMA
      || manifest.backup_format_version !== 2) {
      return { ok: false, channel: "", error: "自產備份 manifest 不完整或已被改變", restoreContext: null };
    }
    if (bundle.app_version !== BACKUP_APP_VERSION
      || manifest.app_version !== bundle.app_version
      || manifest.exported_at !== bundle.exported_at
      || manifest.state_schema_version !== 3
      || sourceSchemaNumber(bundle.data.state?.meta?.schema_version) !== manifest.state_schema_version) {
      return { ok: false, channel: "", error: "自產備份的網站版本或資料 schema 不相容", restoreContext: null };
    }
    if (manifest.canonical_payload?.format !== CANONICAL_JSON_FORMAT || manifest.canonical_payload?.algorithm !== "SHA-256") {
      return { ok: false, channel: "", error: "自產備份 canonical payload 規格不正確", restoreContext: null };
    }
    try {
      const payloadHash = await hashCanonicalValue(bundle.data);
      if (payloadHash !== manifest.canonical_payload.sha256) {
        return { ok: false, channel: "", error: "自產備份 payload 雜湊不符，資料可能已變更", restoreContext: null };
      }
      const recordHashes = await buildRecordHashManifest(bundle.data);
      if (canonicalStringify(recordHashes) !== canonicalStringify(manifest.record_hashes)) {
        return { ok: false, channel: "", error: "自產備份逐資料雜湊不符", restoreContext: null };
      }
      const lineage = await buildBackupLineage(bundle.data.state);
      if (canonicalStringify(lineage) !== canonicalStringify(manifest.lineage)) {
        return { ok: false, channel: "", error: "自產備份 lineage 不完整或已被改變", restoreContext: null };
      }
      return {
        ok: true,
        channel: "self_backup",
        error: "",
        restoreContext: {
          channel: "self_backup",
          source: "self_backup",
          trustExistingHistoricalData: false,
          trustedBackupLineage: manifest.lineage,
        },
      };
    } catch (error) {
      return { ok: false, channel: "", error: `自產備份驗證失敗：${error instanceof Error ? error.message : "未知錯誤"}`, restoreContext: null };
    }
  }

  return {
    BACKUP_SCHEMA,
    BACKUP_APP_VERSION,
    LEGACY_BACKUP_SCHEMA,
    DIMENSION_UNIT_TO_CM,
    MATERIAL_SPECIFICATIONS_SCHEMA,
    MATERIAL_SPEC_ERROR_CODES,
    MATERIAL_CATEGORIES_SCHEMA,
    MATERIAL_CATEGORY_ERROR_CODES,
    QUOTE_MATERIAL_SPECIFICATION_SNAPSHOT_SCHEMA,
    QUOTE_MATERIAL_SPEC_ERROR_CODES,
    EXCEL_FORWARD_CALCULATION_MODE,
    EXCEL_FORWARD_FORMULA_VERSION,
    EXCEL_SOURCE_WORKBOOKS,
    EXCEL_LABOR_DETAIL_SCHEMA,
    EXCEL_LABOR_DEFAULT_SNAPSHOT_SCHEMA,
    QUOTE_LABOR_DETAIL_ERROR_CODES,
    LOCAL_QUOTE_APPROVAL_HISTORY_SCHEMA,
    LOCAL_QUOTE_APPROVAL_EVENT_SCHEMA,
    addCalendarDays,
    applyExcelLaborDetailOverride,
    applyLocalQuoteApprovalAction,
    applyQuoteWasteMarkup,
    applyQuoteItemPatch,
    buildFormulaTrace,
    calculateExcelQuote,
    calculateExcelQuoteSection,
    calculateQuotePaymentSchedule,
    canonicalStringify,
    createBackupBundle,
    createMaterialCategoryStore,
    createMaterialSpecificationStore,
    createQuoteMaterialSpecificationStore,
    createLocalQuoteRevision,
    createQuoteSnapshot,
    computePriceableQuantity,
    deepClone,
    evaluateLinearCutPolicy,
    formatLocalDate,
    hashPin,
    isVerifiedCatalogMapping,
    isNumericCredential,
    isKnownLocalQuoteActor,
    isLocalQuoteReviewer,
    initializeExcelLaborDetail,
    migrateAppState,
    migrateMaterialCategories,
    migrateMaterialSpecifications,
    migrateQuoteForSchema,
    nextQuoteNo,
    normalizeDimensionToCm,
    quoteEstimateWarning,
    quoteTargetTotalWarning,
    reconcileQuoteDraftApprovalState,
    resetExcelLaborDetailOverrides,
    sanitizeQuoteForPersistence,
    selectQuoteMaterialSpecification,
    selectApprovalQueueInconsistencies,
    selectCanonicalQuoteApprovalState,
    selectExcelLaborDetail,
    selectPendingQuoteApprovals,
    selectQuoteApprovalHistory,
    validateAppStateForImport,
    validateBackupBundle,
    validateExcelCalculationSnapshot,
    validateMaterialCategories,
    validateMaterialForPersistence,
    validateMaterialSpecifications,
    validatePreparationReadiness,
    validateQuoteNumericPolicy,
    validateQuoteForStatus,
    validateQuoteApprovalHistory,
    validateQuoteStatusTransition,
  };
});
