(function () {
  if (window.MaterialsQuoteSharedWorkingStateRuntime?.requiresGateway?.()) return;
  const VERSION = "company-materials-1150709-v3";
  const MARKER = "materials_company_catalog_1150709_v3";
  const STORAGE = "materials_quote_clone_state";
  const PRICE_DATE = "2026-07-09";
  const SOURCE = "1150709(沈姊)大維工程-塑木欄杆工程.xlsx／單價分析表(部位隱藏C欄)";
  const PROFILE_SOURCE = "1150709(沈姊)大維工程-塑木欄杆工程.xlsx";
  const PROFILES = Array.isArray(window.COMPANY_PROFILE_CATALOG_1150709) ? window.COMPANY_PROFILE_CATALOG_1150709 : [];

  const ROWS = [
    [5, "m4", "塑木(中空)-一代", "塑木", "才", 350, 350],
    [6, null, "塑木(實心)-一代", "塑木", "才", 450, 450],
    [7, null, "塑木L收邊條-一代", "塑木", "才", 450, 450],
    [8, null, "塑木(內襯鋼管)-一代", "塑木", "才", 650, 650],
    [9, null, "塑木(內襯鋁管)-一代", "塑木", "才", 650, 650],
    [10, null, "塑木圓管(內襯鋁管)-一代", "塑木", "才", null, null],
    [11, null, "塑木(中空)-一代-老船木", "塑木", "才", 450, 450],
    [12, null, "塑木(中空)-二代共擠", "塑木", "才", 450, 450],
    [13, null, "塑木(實心)-二代共擠", "塑木", "才", 550, 550],
    [14, null, "塑木L收邊條-二代共擠", "塑木", "才", 550, 550],
    [15, null, "塑木(中空)-彈性-二代共擠", "塑木", "才", 550, 550],
    [16, null, "塑木(實心)-三代共擠", "塑木", "才", 650, 650],
    [17, null, "塑木(實心)-四代共擠", "塑木", "才", 950, 950],
    [18, null, "塑木大板-8mm", "塑木", "才", null, null],
    [19, null, "塑木大板-抗刮-8mm", "塑木", "才", null, null],
    [20, null, "塑木大板-16mm", "塑木", "才", null, null],
    [21, null, "塑木大板-抗刮-16mm", "塑木", "才", null, null],
    [22, null, "塑木大板-18mm", "塑木", "才", null, null],
    [23, null, "塑木大板-20mm", "塑木", "才", null, null],
    [24, null, "PS(中空)", "塑木", "才", 450, 450],
    [25, null, "PS(實心)", "塑木", "才", 550, 550],
    [26, null, "PS(內襯鋼管)", "塑木", "才", 650, 650],
    [32, null, "鍍鋅方管", "鋼構", "KG", 120, 120],
    [33, "m1", "不銹鋼管", "鋼構", "KG", 180, 180],
    [34, null, "鋁管-方管", "鋼構", "KG", 160, 160],
    [35, null, "鋁管-扁管", "鋼構", "KG", null, null],
    [36, null, "鋁管-圓管", "鋼構", "KG", null, null],
    [37, null, "C型鋼", "鋼構", "KG", 100, 100],
    [38, null, "H型鋼", "鋼構", "KG", 150, 150],
    [39, null, "熱浸鍍鋅(錏)-方管", "鋼構", "KG", 150, 150],
    [40, null, "鍍鋅(錏)-扁管", "鋼構", "KG", 120, 120],
    [41, null, "鍍鋅(錏)-折管", "鋼構", "KG", 150, 150],
    [42, null, "鍍鋅(錏)-圓管", "鋼構", "KG", 120, 120],
    [43, null, "鍍鋅(錏)-方管", "鋼構", "KG", 120, 120],
    [54, null, "費用-烤漆", "加工費", "米", 120, 120],
    [55, null, "費用-滾圓", "加工費", "米", 500, 500],
    [56, null, "費用-導角", "加工費", "米", 120, 120],
    [57, null, "費用-大圖輸出", "加工費", "式", null, null],
    [58, null, "費用-大圖輸出+雷射切割", "加工費", "式", null, null],
    [59, "m2", "配件-不鏽鋼扣件", "其他配件", "個", 15, 15],
    [60, null, "配件-塑膠扣件", "其他配件", "個", 5, 5],
    [61, null, "配件-塑木蓋板", "其他配件", "個", 200, 200],
    [62, null, "配件-塑木帽蓋", "其他配件", "個", 250, 250],
    [63, "m3", "配件-不鏽鋼角鐵", "其他配件", "個", 50, 50],
    [64, null, "配件-不鏽鋼ㄇ鐵", "其他配件", "個", 80, 80],
    [65, null, "基礎-不鏽鋼基座", "基座", "個", 1500, 1500],
    [66, null, "基礎-鍍鋅基座盤(4孔)", "基座", "個", 800, 800],
    [67, null, "基礎-RC基礎", "基座", "個", 1500, 1500],
    [68, null, "門閂*1+腳輪*1+絞鍊*4/組", "其他配件", "組", 2100, 2100],
    [69, null, "門閂*1+絞鍊*4/組", "其他配件", "組", 1750, 1750],
    [70, null, "門鎖*1", "其他配件", "個", 500, 500],
    [71, null, "門工資", "工資", "工", 6000, 6000],
    [72, null, "塑木大板-8mm", "塑木", "M²", 1200, 1200],
    [73, null, "塑木大板-16mm", "塑木", "M²", 1600, 1600],
    [74, null, "塑木大板-18mm", "塑木", "M²", 2800, 2800],
    [75, null, "塑木大板-20mm", "塑木", "M²", 2800, 2800],
    [76, null, "強化玻璃", "其他材料", "M²", null, null],
    [77, null, "防水毯", "其他材料", "M²", null, null],
    [78, null, "PC板M²+鋁壓條M+防水毯M²", "其他材料", "組", null, null],
    [79, null, "5mm鋼索+吊帽*2+鋼索夾*2+張線器*2+/組", "其他配件", "組", 1090, 1090],
    [80, null, "螺桿", "其他配件", "個", null, null],
    [81, null, "涼亭寶蓋", "其他配件", "個", null, null],
    [82, null, "樑柱接合件", "其他配件", "個", null, null],
  ];

  function pricingType(name, category, unit) {
    if (category === "塑木") return unit === "M²" ? "by_area" : "wood_board_tsai";
    if (category === "鋼構") {
      if (name.includes("圓管")) return "steel_round_tube";
      if (name === "C型鋼" || name === "H型鋼") return "single";
      return "steel_rect_tube";
    }
    if (category === "加工費" && unit === "米") return "by_length";
    if (category === "其他材料" && unit === "M²") return "by_area";
    return "single";
  }

  function appendUniqueNotes(existing, ...notes) {
    let result = String(existing || "").trim();
    notes.filter(Boolean).forEach((note) => {
      if (!result.includes(note)) result = [result, note].filter(Boolean).join(" ");
    });
    return result;
  }

  function preservedMaterialSpecificationFields(existing) {
    const fields = {};
    if (Object.prototype.hasOwnProperty.call(existing, "material_specifications_schema")) {
      fields.material_specifications_schema = existing.material_specifications_schema;
    }
    if (Object.prototype.hasOwnProperty.call(existing, "material_specifications_origin")) {
      fields.material_specifications_origin = existing.material_specifications_origin;
    }
    if (Object.prototype.hasOwnProperty.call(existing, "specifications")) {
      fields.specifications = existing.specifications;
    }
    if (Object.prototype.hasOwnProperty.call(existing, "material_source_metadata")) {
      fields.material_source_metadata = existing.material_source_metadata;
    }
    return fields;
  }

  function normalizeMaterialSpecifications(material) {
    const domain = window.MaterialsQuoteDomain;
    return typeof domain?.migrateMaterialSpecifications === "function"
      ? domain.migrateMaterialSpecifications(material)
      : material;
  }

  function normalizeMaterialCategories(data) {
    const domain = window.MaterialsQuoteDomain;
    return typeof domain?.migrateMaterialCategories === "function"
      ? domain.migrateMaterialCategories(data)
      : data;
  }

  function materialFromRow(row, existing = {}) {
    const [sourceRow, fixedId, name, category, unit, budgetPrice, salePrice] = row;
    const id = fixedId || `company-1150709-ah-${String(sourceRow).padStart(3, "0")}`;
    const type = pricingType(name, category, unit);
    const isLaborOnly = category === "加工費" || category === "工資";
    const isBoardFoot = type === "wood_board_tsai";
    const isSteel = category === "鋼構";
    const hasPrice = Number.isFinite(salePrice);
    const sourceNote = `來源：${SOURCE}!AH${sourceRow}:AL${sourceRow}。`;
    const statusNote = hasPrice ? "" : "原表未提供售價，已先停用。";
    const laborNote = isLaborOnly ? "售價匯入工錢單價。" : (isBoardFoot || isSteel ? "Excel 工資基數：每才 140 元。" : "");
    const existingCost = existing.cost_price ?? "";
    const existingCostStatus = existing.cost_price_status || (existingCost !== "" && existingCost != null
      ? existing.source_import ? "unverified_legacy_budget_import" : "unverified_legacy"
      : "unverified");

    return {
      ...preservedMaterialSpecificationFields(existing),
      id,
      name,
      code: existing.code || "",
      category,
      unit,
      pricing_type: type,
      default_thickness: existing.default_thickness ?? "",
      default_width: existing.default_width ?? "",
      default_length: existing.default_length ?? "",
      default_weight: existing.default_weight ?? "",
      wall_thickness_mm: existing.wall_thickness_mm || (type === "steel_rect_tube" || type === "steel_round_tube" ? 2 : ""),
      density_factor: existing.density_factor || 0.02466,
      formula_version: "excel-1150709-v1",
      formula_source: SOURCE,
      formula_source_id: "company-workbook/1150709",
      formula_source_version: "excel-1150709-v1",
      formula_source_snapshot: SOURCE,
      dimension_unit: existing.dimension_unit || "cm",
      standard_budget_unit_price: Number.isFinite(budgetPrice) ? budgetPrice : "",
      standard_budget_source: `${SOURCE}!AH${sourceRow}:AL${sourceRow}`,
      standard_budget_version: VERSION,
      catalog_sale_unit_price: isLaborOnly ? "" : (hasPrice ? salePrice : ""),
      catalog_sale_price_source: `${SOURCE}!AL${sourceRow}`,
      catalog_sale_price_version: VERSION,
      catalog_discount_factor: Number.isFinite(budgetPrice) && budgetPrice !== 0 && hasPrice ? salePrice / budgetPrice : "",
      cost_price: existingCost,
      cost_price_status: existingCostStatus,
      price_effective_date: PRICE_DATE,
      default_actual_unit_price: isLaborOnly ? 0 : (hasPrice ? salePrice : 0),
      unit_price: isLaborOnly ? 0 : (hasPrice ? salePrice : 0),
      actual_price_source: `${SOURCE}!AL${sourceRow}`,
      actual_price_version: PRICE_DATE,
      waste_pct: isBoardFoot ? 5 : 0,
      labor_unit_price: isLaborOnly ? (hasPrice ? salePrice : 0) : (isBoardFoot || isSteel ? 140 : 0),
      labor_waste_pct: isBoardFoot || isSteel ? 5 : "",
      labor_pricing_type: isSteel ? "wood_board_tsai" : "",
      notes: appendUniqueNotes(existing.notes, sourceNote, statusNote, laborNote),
      is_active: hasPrice,
      source_import: VERSION,
      source_row: sourceRow,
      source_price_row: sourceRow,
    };
  }

  function profileTargetId(profile) {
    const model = String(profile.model || "").replace(/\s+/g, " ").trim();
    return profile.source_group === "塑木中空" && model === "ZY-D-038 (刀刻痕)" ? "m4" : profile.id;
  }

  function materialFromProfile(profile, existing = {}) {
    const targetId = profileTargetId(profile);
    const hasMaterialPrice = Number(existing.unit_price) > 0;
    const sourceNote = `型錄來源：${PROFILE_SOURCE}／${profile.source_group}第 ${profile.source_row} 列。`;
    const detailNotes = [
      profile.catalog_spec ? `型錄規格：${profile.catalog_spec} cm。` : "",
      profile.actual_size ? `實際尺寸：${profile.actual_size} cm。` : "",
      profile.inner_size ? `內徑尺寸：${profile.inner_size} cm。` : "",
      profile.lining ? `內襯管：${profile.lining}。` : "",
      profile.application ? `適用範圍：${profile.application}。` : "",
      profile.fastener ? `扣件：${profile.fastener}。` : "",
      profile.marks ? `型錄註記：${profile.marks}。` : "",
      profile.grind || profile.emboss ? `表面資料：打磨 ${profile.grind || "—"}、壓花 ${profile.emboss || "—"}。` : "",
      hasMaterialPrice ? "" : "型錄未提供可對應售價，已先停用。",
    ];

    return {
      ...existing,
      id: targetId,
      name: targetId === "m4" ? (existing.name || "塑木(中空)-一代") : `${profile.source_group} ${profile.model}`,
      code: targetId === "m4" ? (existing.code || profile.model) : profile.code,
      category: existing.category || "塑木",
      unit: existing.unit || "才",
      pricing_type: existing.pricing_type || "wood_board_tsai",
      default_thickness: existing.default_thickness || profile.default_thickness || "",
      default_width: existing.default_width || profile.default_width || "",
      default_length: existing.default_length || "",
      default_weight: existing.default_weight || profile.weight_kg || "",
      wall_thickness_mm: existing.wall_thickness_mm || "",
      density_factor: existing.density_factor || 0.02466,
      formula_version: existing.formula_version || "excel-1150709-v1",
      formula_source: existing.formula_source || PROFILE_SOURCE,
      formula_source_id: existing.formula_source_id || "company-workbook/1150709",
      formula_source_version: existing.formula_source_version || existing.formula_version || "excel-1150709-v1",
      formula_source_snapshot: existing.formula_source_snapshot || existing.formula_source || PROFILE_SOURCE,
      dimension_unit: existing.dimension_unit || "cm",
      standard_budget_unit_price: existing.standard_budget_unit_price ?? "",
      standard_budget_source: existing.standard_budget_source || "",
      standard_budget_version: existing.standard_budget_version || "",
      catalog_sale_unit_price: existing.catalog_sale_unit_price ?? existing.default_actual_unit_price ?? existing.unit_price ?? "",
      catalog_sale_price_source: existing.catalog_sale_price_source || existing.actual_price_source || "",
      catalog_sale_price_version: existing.catalog_sale_price_version || existing.actual_price_version || "",
      catalog_discount_factor: existing.catalog_discount_factor ?? "",
      cost_price: existing.cost_price ?? "",
      cost_price_status: existing.cost_price_status || "unverified",
      price_effective_date: existing.price_effective_date || "",
      default_actual_unit_price: hasMaterialPrice ? Number(existing.default_actual_unit_price ?? existing.unit_price) : 0,
      unit_price: hasMaterialPrice ? Number(existing.unit_price) : 0,
      actual_price_source: existing.actual_price_source || PROFILE_SOURCE,
      actual_price_version: existing.actual_price_version || existing.price_effective_date || "",
      waste_pct: existing.waste_pct ?? 5,
      labor_unit_price: Number(existing.labor_unit_price) || 140,
      labor_waste_pct: existing.labor_waste_pct === "" || existing.labor_waste_pct == null ? 5 : existing.labor_waste_pct,
      labor_pricing_type: existing.labor_pricing_type || "",
      notes: appendUniqueNotes(existing.notes, sourceNote, ...detailNotes),
      is_active: hasMaterialPrice ? Boolean(existing.is_active) : false,
      catalog_group: profile.source_group,
      catalog_model: profile.model,
      catalog_spec: profile.catalog_spec,
      catalog_application: profile.application,
      catalog_marks: profile.marks,
      source_import: VERSION,
      source_row: existing.source_row || profile.source_row,
      source_catalog_row: profile.source_row,
    };
  }

  function loadData() {
    try {
      if (typeof state !== "undefined" && state && Array.isArray(state.materials)) return state;
      return JSON.parse(localStorage.getItem(STORAGE) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveData(data) {
    if (typeof state !== "undefined" && state && Array.isArray(state.materials)) {
      state.materials = data.materials;
      if (Object.prototype.hasOwnProperty.call(data, "material_categories_schema")) {
        state.material_categories_schema = data.material_categories_schema;
      }
      if (Object.prototype.hasOwnProperty.call(data, "material_categories")) {
        state.material_categories = data.material_categories;
      }
      if (typeof saveState === "function") saveState();
      else localStorage.setItem(STORAGE, JSON.stringify(data));
      return;
    }
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }

  function runImport() {
    if (typeof localStorage === "undefined") return;
    const data = loadData();
    if (!data || !Array.isArray(data.materials)) return;

    const expectedIds = new Set([
      ...ROWS.map((row) => row[1] || `company-1150709-ah-${String(row[0]).padStart(3, "0")}`),
      ...PROFILES.map(profileTargetId),
    ]);
    const complete = Array.from(expectedIds).every((materialId) => data.materials.some((item) => item.id === materialId));
    if (localStorage.getItem(MARKER) && complete) {
      const normalizedData = normalizeMaterialCategories(data);
      const categoriesChanged = data.material_categories_schema !== normalizedData.material_categories_schema
        || JSON.stringify(data.material_categories) !== JSON.stringify(normalizedData.material_categories);
      if (categoriesChanged) saveData(normalizedData);
      window.__companyMaterialsImport = { imported: 0, updated: 0, skipped: expectedIds.size, total: data.materials.length, catalog_profiles: PROFILES.length };
      return;
    }

    const existingById = new Map(data.materials.map((item) => [item.id, item]));
    const importedById = new Map();
    ROWS.forEach((row) => {
      const id = row[1] || `company-1150709-ah-${String(row[0]).padStart(3, "0")}`;
      importedById.set(id, materialFromRow(row, existingById.get(id)));
    });
    PROFILES.forEach((profile) => {
      const targetId = profileTargetId(profile);
      importedById.set(targetId, materialFromProfile(profile, importedById.get(targetId) || existingById.get(targetId)));
    });
    const imported = Array.from(importedById.values());
    const untouched = data.materials.filter((item) => !expectedIds.has(item.id));
    const importedCount = imported.filter((item) => !existingById.has(item.id)).length;
    data.materials = [...imported, ...untouched].map(normalizeMaterialSpecifications);
    const normalizedData = normalizeMaterialCategories(data);
    saveData(normalizedData);

    const stamp = new Date().toISOString();
    localStorage.setItem(MARKER, stamp);
    window.__companyMaterialsImport = {
      imported: importedCount,
      updated: imported.length - importedCount,
      skipped: 0,
      total: normalizedData.materials.length,
      marker: MARKER,
      catalog_profiles: PROFILES.length,
      catalog_records: new Set(PROFILES.map(profileTargetId)).size,
    };
  }

  runImport();
})();
