(function (root, factory) {
  const domain = typeof module === "object" && module.exports
    ? require("./app-domain.js")
    : root?.MaterialsQuoteDomain;
  const api = factory(domain);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MaterialSourceWorkflow = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (domain) {
  "use strict";

  const SOURCE_METADATA_SCHEMA = "material-source-metadata/v1";
  const IMPORT_CONTROL_SCHEMA = "material-master-import-control/v1";
  const REVIEW_RESOLUTION_SCHEMA = "material-source-review-resolution/v1";
  const BUNDLE_SCHEMA = "material-master-staging/v1";
  const LOWER_SHA256 = /^[0-9a-f]{64}$/;
  const REVIEW_STATUSES = new Set(["review_required", "reviewed", "approved"]);
  const REVIEW_FIELDS = Object.freeze([
    "product_model",
    "product_name",
    "article_code",
    "pcces_code",
    "mold_spec",
    "nominal_dimension",
    "actual_dimension",
    "length",
    "width",
    "thickness",
    "color",
    "grind",
    "emboss",
    "weight",
    "cross_section",
    "product_image",
    "application",
    "accessories",
    "notes",
  ]);

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
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

  function failure(code, details = {}) {
    return Object.freeze({ ok: false, code, ...details });
  }

  function nullable(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    return value;
  }

  function normalizedKey(value) {
    const normalized = nullable(value);
    if (normalized === null) return null;
    return String(normalized).normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();
  }

  function canonicalNumber(value) {
    const normalized = nullable(value);
    if (normalized === null) return null;
    const number = typeof normalized === "number"
      ? normalized
      : Number(String(normalized).replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(number) ? Number(number.toPrecision(12)).toString() : normalizedKey(normalized);
  }

  function canonicalDimension(value) {
    const normalized = nullable(value);
    if (normalized === null) return null;
    const matches = String(normalized).replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/g);
    return matches?.length
      ? matches.map((part) => Number(Number(part).toPrecision(12)).toString()).join("|")
      : normalizedKey(normalized);
  }

  function sameCanonical(left, right, canonicalizer = normalizedKey) {
    return canonicalizer(left) === canonicalizer(right);
  }

  function comparisonStatus(sourceValue, masterValue, actualValue, field, sourceComparisonValue) {
    const source = nullable(sourceValue);
    const master = nullable(masterValue);
    const actual = nullable(actualValue);
    if (source === null && master === null && actual === null) return "all_null";
    if (source === null) return "source_null";
    if (master === null) return actual !== null ? "master_null_actual_present" : "master_null";
    let comparableSource = sourceComparisonValue === undefined ? source : sourceComparisonValue;
    let canonicalizer = normalizedKey;
    if (field === "weight") canonicalizer = canonicalNumber;
    if (field === "nominal_dimension") canonicalizer = canonicalDimension;
    const matches = sameCanonical(comparableSource, master, canonicalizer);
    if (matches) return actual !== null ? "source_matches_master_actual_present" : "match";
    return actual !== null ? "source_differs_from_master_actual_present" : "different";
  }

  function materialMasterValue(material, field) {
    const mapping = {
      product_model: "catalog_model",
      article_code: "code",
      product_name: "name",
      nominal_dimension: "catalog_spec",
      weight: "default_weight",
      application: "catalog_application",
    };
    const key = mapping[field];
    return key ? nullable(material?.[key]) : null;
  }

  function refreshComparisons(metadata, currentMaterial) {
    if (!currentMaterial) return clone(metadata.comparisons || {});
    const comparisons = clone(metadata.comparisons || {});
    Object.entries(comparisons).forEach(([field, observation]) => {
      const masterValue = materialMasterValue(currentMaterial, field);
      const sourceComparisonValue = field === "weight" && Number.isFinite(metadata?.measurements?.weight?.value)
        ? metadata.measurements.weight.value
        : undefined;
      observation.master_value = masterValue;
      observation.comparison_status = comparisonStatus(
        observation.source_value,
        masterValue,
        observation.actual_value,
        field,
        sourceComparisonValue,
      );
    });
    return comparisons;
  }

  function categoryKey(value) {
    const normalized = nullable(value);
    return normalized === null ? "" : String(normalized).normalize("NFKC").replace(/\s+/g, " ").toLowerCase();
  }

  function normalizedCategory(value) {
    const name = nullable(value);
    const key = categoryKey(name);
    if (!name || !key) return null;
    return { id: `mc:${encodeURIComponent(key)}`, key, name: String(name) };
  }

  function validPayload(payload) {
    return Boolean(
      payload
      && typeof payload === "object"
      && !Array.isArray(payload)
      && payload.state
      && typeof payload.state === "object"
      && !Array.isArray(payload.state)
      && Array.isArray(payload.state.materials)
      && Array.isArray(payload.state.material_categories),
    );
  }

  function identifierTypesAreSafe(records) {
    return records.every((record) => {
      const identifiers = record?.material?.material_source_metadata?.identifiers;
      return ["product_model", "article_code", "pcces_code"].every((field) => (
        identifiers?.[field] === null || typeof identifiers?.[field] === "string"
      ));
    });
  }

  function sourceNullsArePreserved(records) {
    if (typeof domain?.normalizeMaterialSourceMetadata !== "function") return false;
    return records.every((record) => {
      const original = record?.material?.material_source_metadata;
      const normalized = domain.normalizeMaterialSourceMetadata(record?.material)?.material_source_metadata;
      return canonicalStringify(normalized) === canonicalStringify(original);
    });
  }

  function uniqueAssetCount(bundle) {
    const ids = new Set();
    const addAsset = (asset) => {
      const identity = asset?.asset_id || asset?.storage_uri || canonicalStringify(asset);
      ids.add(String(identity));
    };
    (bundle.catalog_assets || []).forEach(addAsset);
    (bundle.records || []).forEach((record) => {
      (record?.material?.material_source_metadata?.provenance?.assets || []).forEach(addAsset);
    });
    return ids.size;
  }

  function buildImportControl(record, bundle, bundleSha256, batchKey, currentMasterMatch) {
    return {
      schema: IMPORT_CONTROL_SCHEMA,
      batch_key: batchKey,
      bundle_sha256: bundleSha256,
      source_workbook_sha256: String(bundle.source.workbook_sha256).toLowerCase(),
      staging_id: record.staging_id,
      review_status: "review_required",
      review_reasons: clone(record.review_reasons),
      requires_user_confirmation: clone(record.requires_user_confirmation),
      current_master_match: currentMasterMatch,
      top_level_merge_policy: currentMasterMatch ? "preserve-existing-master" : "add-inactive-review-record",
      source_blank_policy: "preserve-null",
    };
  }

  function buildFormalMetadata(record, bundle, bundleSha256, batchKey, currentMaterial) {
    const metadata = clone(record.material.material_source_metadata);
    metadata.comparisons = refreshComparisons(metadata, currentMaterial);
    metadata.import_control = buildImportControl(
      record,
      bundle,
      bundleSha256,
      batchKey,
      Boolean(currentMaterial),
    );
    return metadata;
  }

  function validateBundle(bundle) {
    if (!bundle || typeof bundle !== "object" || Array.isArray(bundle) || bundle.schema !== BUNDLE_SCHEMA) {
      return failure("MATERIAL_MASTER_IMPORT_BUNDLE_INVALID");
    }
    if (!Array.isArray(bundle.records) || !bundle.source || !LOWER_SHA256.test(String(bundle.source.workbook_sha256 || "").toLowerCase())) {
      return failure("MATERIAL_MASTER_IMPORT_BUNDLE_INVALID");
    }
    if (typeof domain?.validateMaterialMasterStagingBundle === "function") {
      const validation = domain.validateMaterialMasterStagingBundle(bundle);
      if (!validation?.ok) return failure("MATERIAL_MASTER_IMPORT_BUNDLE_INVALID", { errors: clone(validation?.errors || []) });
    }
    return Object.freeze({ ok: true, code: "" });
  }

  function applyMaterialMasterImport(payload, bundle, options = {}) {
    if (!validPayload(payload)) return failure("MATERIAL_MASTER_IMPORT_PAYLOAD_INVALID");
    const bundleValidation = validateBundle(bundle);
    if (!bundleValidation.ok) return bundleValidation;
    const bundleSha256 = String(options.bundleSha256 || "").toLowerCase();
    if (!LOWER_SHA256.test(bundleSha256)) return failure("MATERIAL_MASTER_IMPORT_BUNDLE_HASH_INVALID");
    if (!identifierTypesAreSafe(bundle.records)) return failure("MATERIAL_MASTER_IMPORT_IDENTIFIER_TYPE_INVALID");
    if (!sourceNullsArePreserved(bundle.records)) return failure("MATERIAL_MASTER_IMPORT_SOURCE_BLANK_INVALID");

    const batchKey = `material-master-import/v1:sha256:${bundleSha256}`;
    const candidate = clone(payload);
    const materials = candidate.state.materials;
    const materialById = new Map(materials.map((material) => [material.id, material]));
    const importedByStagingId = new Map();
    materials.forEach((material) => {
      const control = material?.material_source_metadata?.import_control;
      if (control?.staging_id) importedByStagingId.set(control.staging_id, material);
    });

    let mergedExisting = 0;
    let addedReviewMaterials = 0;
    let alreadyImported = 0;

    for (const record of bundle.records) {
      const priorImport = importedByStagingId.get(record.staging_id);
      if (priorImport) {
        const control = priorImport.material_source_metadata.import_control;
        if (control.batch_key !== batchKey || control.bundle_sha256 !== bundleSha256) {
          return failure("MATERIAL_MASTER_IMPORT_DIFFERENT_BATCH_COLLISION");
        }
        alreadyImported += 1;
        continue;
      }

      const snapshot = record.current_master_snapshot;
      if (snapshot) {
        const target = materialById.get(snapshot.id);
        if (!target) return failure("MATERIAL_MASTER_IMPORT_MATCH_TARGET_MISSING");
        if (!sameCanonical(target.catalog_model, snapshot.catalog_model)) {
          return failure("MATERIAL_MASTER_IMPORT_MATCH_IDENTITY_DRIFT");
        }
        const existingControl = target?.material_source_metadata?.import_control;
        if (existingControl && existingControl.staging_id !== record.staging_id) {
          return failure("MATERIAL_MASTER_IMPORT_MATCH_TARGET_COLLISION");
        }
        target.material_source_metadata = buildFormalMetadata(record, bundle, bundleSha256, batchKey, target);
        mergedExisting += 1;
        importedByStagingId.set(record.staging_id, target);
        continue;
      }

      if (materialById.has(record.staging_id)) return failure("MATERIAL_MASTER_IMPORT_STAGING_ID_COLLISION");
      const material = clone(record.material);
      material.material_source_metadata = buildFormalMetadata(record, bundle, bundleSha256, batchKey, null);
      material.material_master_status = "review_required";
      material.is_active = false;
      materials.push(material);
      materialById.set(material.id, material);
      importedByStagingId.set(record.staging_id, material);
      addedReviewMaterials += 1;
    }

    const existingCategoryKeys = new Set(candidate.state.material_categories.map((category) => categoryKey(category?.name)));
    let categoriesAdded = 0;
    for (const record of bundle.records) {
      const category = normalizedCategory(record.material.category);
      if (!category || existingCategoryKeys.has(category.key)) continue;
      candidate.state.material_categories.push(category);
      existingCategoryKeys.add(category.key);
      categoriesAdded += 1;
    }

    const unchanged = mergedExisting === 0 && addedReviewMaterials === 0 && categoriesAdded === 0;
    return Object.freeze({
      ok: true,
      code: "",
      batchKey,
      payload: candidate,
      summary: Object.freeze({
        materialsBefore: payload.state.materials.length,
        materialsAfter: candidate.state.materials.length,
        stagingRecords: bundle.records.length,
        mergedExisting,
        addedReviewMaterials,
        alreadyImported,
        categoriesAdded,
        reviewRequired: bundle.records.length,
        referencedAssets: uniqueAssetCount(bundle),
        sourceNullsPreserved: true,
        identifierTypesPreserved: true,
        unchanged,
      }),
    });
  }

  function materialSourceReviewStatus(material) {
    return material?.material_source_metadata?.review_resolution?.status
      || material?.material_source_metadata?.import_control?.review_status
      || "";
  }

  function materialSourceCanBeActivated(material) {
    const metadata = material?.material_source_metadata;
    const control = metadata?.import_control;
    const isNewReviewCandidate = Boolean(metadata) && (
      control?.current_master_match === false
      || control?.top_level_merge_policy === "add-inactive-review-record"
      || material?.material_master_status === "review_required"
    );
    return !isNewReviewCandidate || materialSourceReviewStatus(material) === "approved";
  }

  function materialSourceCanParticipateInQuotes(material) {
    return material?.is_active === true && materialSourceCanBeActivated(material);
  }

  function sourceValues(metadata) {
    return {
      product_model: nullable(metadata?.identifiers?.product_model),
      product_name: nullable(metadata?.descriptive?.product_name),
      article_code: nullable(metadata?.identifiers?.article_code),
      pcces_code: nullable(metadata?.identifiers?.pcces_code),
      mold_spec: nullable(metadata?.descriptive?.mold_spec),
      nominal_dimension: nullable(metadata?.measurements?.nominal_dimension?.raw),
      actual_dimension: nullable(metadata?.measurements?.actual_dimension?.raw),
      length: nullable(metadata?.measurements?.length?.raw),
      width: null,
      thickness: null,
      color: nullable(metadata?.descriptive?.color),
      grind: nullable(metadata?.descriptive?.grind),
      emboss: nullable(metadata?.descriptive?.emboss),
      weight: nullable(metadata?.measurements?.weight?.raw),
      cross_section: nullable(metadata?.descriptive?.cross_section),
      product_image: nullable(metadata?.descriptive?.product_image),
      application: nullable(metadata?.descriptive?.application),
      accessories: nullable(metadata?.descriptive?.accessories),
      notes: nullable(metadata?.descriptive?.notes),
    };
  }

  function fixedReviewValues(input, previous = {}) {
    const values = {};
    for (const field of REVIEW_FIELDS) {
      const supplied = Object.prototype.hasOwnProperty.call(input || {}, field);
      const raw = supplied ? input[field] : previous[field];
      if (raw !== null && raw !== undefined && typeof raw !== "string") {
        return failure("MATERIAL_SOURCE_REVIEW_VALUE_INVALID", { field });
      }
      values[field] = nullable(raw);
    }
    return Object.freeze({ ok: true, code: "", values });
  }

  function applyMaterialSourceReview(material, input, options = {}) {
    if (!material || typeof material !== "object" || Array.isArray(material)) {
      return failure("MATERIAL_SOURCE_REVIEW_MATERIAL_INVALID");
    }
    const metadata = material.material_source_metadata;
    if (!metadata || metadata.schema !== SOURCE_METADATA_SCHEMA) {
      return failure("MATERIAL_SOURCE_REVIEW_METADATA_INVALID");
    }
    const status = String(input?.review_status || materialSourceReviewStatus(material) || "review_required");
    if (!REVIEW_STATUSES.has(status)) return failure("MATERIAL_SOURCE_REVIEW_STATUS_INVALID");
    const previousValues = metadata.review_resolution?.values || {};
    const normalized = fixedReviewValues(input || {}, previousValues);
    if (!normalized.ok) return normalized;
    const reviewedAt = String(options.reviewedAt || new Date().toISOString());
    if (!/^\d{4}-\d{2}-\d{2}T/.test(reviewedAt)) return failure("MATERIAL_SOURCE_REVIEW_TIME_INVALID");

    const next = clone(material);
    next.material_source_metadata.review_resolution = {
      schema: REVIEW_RESOLUTION_SCHEMA,
      status,
      values: normalized.values,
      reviewed_at: reviewedAt,
    };
    if (next.material_source_metadata.import_control) {
      next.material_source_metadata.import_control.review_status = status;
    }
    return Object.freeze({ ok: true, code: "", material: next });
  }

  function collectSearchValues(value, output) {
    if (value === null || value === undefined) return;
    if (["string", "number", "boolean"].includes(typeof value)) {
      output.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectSearchValues(item, output));
      return;
    }
    if (typeof value === "object") Object.values(value).forEach((item) => collectSearchValues(item, output));
  }

  function materialSourceSearchText(material) {
    const values = [];
    [material?.name, material?.code, material?.category, material?.catalog_model, material?.catalog_spec].forEach(
      (value) => collectSearchValues(value, values),
    );
    const metadata = material?.material_source_metadata;
    if (metadata) {
      [
        metadata.identifiers,
        metadata.descriptive,
        metadata.measurements,
        metadata.liner,
        metadata.compatible_components,
        metadata.comparisons,
        metadata.review_resolution,
        metadata.import_control?.review_status,
        metadata.import_control?.review_reasons,
      ].forEach((value) => collectSearchValues(value, values));
    }
    return values.join(" ").normalize("NFKC").toLowerCase();
  }

  function materialSourcePresentation(material) {
    const metadata = material?.material_source_metadata;
    if (!metadata || metadata.schema !== SOURCE_METADATA_SCHEMA) return null;
    const source = sourceValues(metadata);
    const reviewed = fixedReviewValues({}, metadata.review_resolution?.values || {}).values;
    return Object.freeze({
      status: materialSourceReviewStatus(material),
      source,
      reviewed,
      reviewReasons: clone(metadata.import_control?.review_reasons || []),
      requiresUserConfirmation: clone(metadata.import_control?.requires_user_confirmation || []),
      comparisons: clone(metadata.comparisons || {}),
      provenance: clone(metadata.provenance || {}),
    });
  }

  function materialSourceDisplayName(material) {
    const presentation = materialSourcePresentation(material);
    return nullable(presentation?.reviewed?.product_name)
      || nullable(presentation?.source?.product_name)
      || nullable(material?.name)
      || nullable(presentation?.reviewed?.product_model)
      || nullable(presentation?.source?.product_model)
      || nullable(presentation?.reviewed?.article_code)
      || nullable(presentation?.source?.article_code)
      || "未命名材料";
  }

  function defaultEscapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeMaterialAssetUri(value) {
    const uri = nullable(value);
    if (!uri || !/^assets\/[A-Za-z0-9_()&+,.\-\u3400-\u9fff ]+\.png$/u.test(uri) || uri.includes("..")) return "";
    return `./${uri}`;
  }

  function renderMaterialSourceEditor(material, options = {}) {
    const presentation = materialSourcePresentation(material);
    if (!presentation) return "";
    const h = typeof options.escapeHtml === "function" ? options.escapeHtml : defaultEscapeHtml;
    const labels = {
      product_model: "產品型號",
      product_name: "產品名稱",
      article_code: "文中編碼",
      pcces_code: "PCCES 編碼",
      mold_spec: "模具規格",
      nominal_dimension: "名目尺寸",
      actual_dimension: "實際尺寸",
      length: "長度",
      width: "寬度",
      thickness: "厚度",
      color: "花色",
      grind: "打磨",
      emboss: "壓花",
      weight: "重量",
      cross_section: "斷面圖片",
      product_image: "產品圖片",
      application: "適用範圍",
      accessories: "配件",
      notes: "註記",
    };
    const sourceRows = REVIEW_FIELDS.map((field) => (
      `<div class="material-source-read-row"><span>${h(labels[field])}</span><strong>${presentation.source[field] == null ? "NULL" : h(presentation.source[field])}</strong></div>`
    )).join("");
    const reviewInputs = REVIEW_FIELDS.map((field) => {
      const value = presentation.reviewed[field] ?? "";
      const source = presentation.source[field];
      const isLong = ["application", "accessories", "notes"].includes(field);
      const control = isLong
        ? `<textarea class="textarea" name="source_review_${h(field)}" placeholder="來源：${h(source ?? "NULL")}">${h(value)}</textarea>`
        : `<input class="input" name="source_review_${h(field)}" value="${h(value)}" placeholder="來源：${h(source ?? "NULL")}">`;
      return `<label class="field material-source-review-field"><span>${h(labels[field])}</span>${control}</label>`;
    }).join("");
    const comparisonRows = Object.entries(presentation.comparisons).map(([field, observation]) => (
      `<tr><td>${h(labels[field] || field)}</td><td>${observation.source_value == null ? "NULL" : h(observation.source_value)}</td><td>${observation.master_value == null ? "NULL" : h(observation.master_value)}</td><td>${observation.actual_value == null ? "NULL" : h(observation.actual_value)}</td><td><code>${h(observation.comparison_status || "")}</code><div class="sub">${h(observation.source_ref || "")}</div></td></tr>`
    )).join("");
    const imageCards = [
      ["斷面圖片", safeMaterialAssetUri(presentation.source.cross_section)],
      ["產品圖片", safeMaterialAssetUri(presentation.source.product_image)],
    ].filter(([, uri]) => uri).map(([label, uri]) => (
      `<figure class="material-source-image"><img loading="lazy" src="${h(uri)}" alt="${h(label)}"><figcaption>${h(label)}</figcaption></figure>`
    )).join("");
    const reviewReasonItems = presentation.reviewReasons.map((reason) => `<li>${h(reason)}</li>`).join("");
    const confirmationItems = presentation.requiresUserConfirmation.map((reason) => `<li>${h(reason)}</li>`).join("");
    const status = presentation.status || "review_required";
    return `
      <section class="card material-source-card" data-material-source-editor>
        <div class="card-header"><div><h2>尺寸、型號、花色與來源</h2><p>來源原文固定保留；人工確認值另存，不會覆寫來源。</p></div><span class="badge amber">${h(status)}</span></div>
        <div class="card-body material-source-body">
          <div class="material-source-columns">
            <section><h3>來源原文（唯讀）</h3><div class="material-source-read-grid">${sourceRows}</div></section>
            <section><h3>人工確認值</h3><div class="form-grid">${reviewInputs}</div></section>
          </div>
          <label class="field material-source-status"><span>審核狀態</span><select class="select" name="source_review_status">
            <option value="review_required" ${status === "review_required" ? "selected" : ""}>待審核</option>
            <option value="reviewed" ${status === "reviewed" ? "selected" : ""}>已檢視</option>
            <option value="approved" ${status === "approved" ? "selected" : ""}>已核准</option>
          </select></label>
          ${imageCards ? `<div class="material-source-images">${imageCards}</div>` : ""}
          <div class="material-source-review-notes"><div><h3>審核原因</h3><ul>${reviewReasonItems}</ul></div><div><h3>仍需確認</h3><ul>${confirmationItems}</ul></div></div>
          <div class="table-wrap"><table class="material-source-comparisons"><thead><tr><th>欄位</th><th>source</th><th>master</th><th>actual</th><th>狀態／來源</th></tr></thead><tbody>${comparisonRows}</tbody></table></div>
        </div>
      </section>`;
  }

  return Object.freeze({
    SOURCE_METADATA_SCHEMA,
    IMPORT_CONTROL_SCHEMA,
    REVIEW_RESOLUTION_SCHEMA,
    REVIEW_FIELDS,
    applyMaterialMasterImport,
    applyMaterialSourceReview,
    canonicalStringify,
    materialSourceCanBeActivated,
    materialSourceCanParticipateInQuotes,
    materialSourceDisplayName,
    materialSourcePresentation,
    materialSourceReviewStatus,
    materialSourceSearchText,
    renderMaterialSourceEditor,
    safeMaterialAssetUri,
  });
});
