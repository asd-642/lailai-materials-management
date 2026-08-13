(function (root) {
  "use strict";

  const REPORTS_KEY = "materials_quote_bug_reports";
  const DB_NAME = "materials_quote_bug_attachments";
  const DB_VERSION = 1;
  const STORE_NAME = "attachments";
  const SCHEMA = "bug-report/v1";
  const ROLES = new Set(["owner", "admin", "staff", "contractor"]);
  const MANAGERS = new Set(["owner", "admin"]);
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
  const TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
  const EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
  const STATUS = new Set(["open", "triaged", "in_progress", "resolved", "closed"]);

  function error(code, message) { return { ok: false, code, message }; }
  function ok(value) { return { ok: true, value }; }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function id(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
  function roleOf(actor) { return String(actor?.role || ""); }
  function validActor(actor) { return Boolean(actor?.id && actor?.account && actor?.is_active !== false && ROLES.has(roleOf(actor))); }
  function canReadAll(actor) { return validActor(actor) && MANAGERS.has(roleOf(actor)); }
  function canCreate(actor) { return validActor(actor); }
  function canRead(report, actor) { return canReadAll(actor) || (validActor(actor) && report?.created_by?.id === actor.id); }
  function canUpdateStatus(report, actor) { return canReadAll(actor) && Boolean(report?.id); }
  function textValue(value) { return String(value == null ? "" : value).trim(); }
  function extensionOf(name) { return String(name || "").toLowerCase().split(".").pop(); }

  async function bytesOf(file) {
    if (!file) return new Uint8Array();
    if (file instanceof Uint8Array) return file;
    if (file instanceof ArrayBuffer) return new Uint8Array(file);
    if (typeof file.arrayBuffer === "function") return new Uint8Array(await file.arrayBuffer());
    return new Uint8Array();
  }

  function signatureMatches(type, bytes) {
    if (type === "image/png") return bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
    if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    return false;
  }

  async function validateAttachment(file, index = 0) {
    const name = textValue(file?.name || file?.filename);
    const type = textValue(file?.type || file?.mime_type).toLowerCase();
    const size = Number(file?.size ?? file?.bytes?.byteLength ?? 0);
    if (!name || !TYPES.has(type) || !EXTENSIONS.has(extensionOf(name))) return error("BUG_ATTACHMENT_TYPE_INVALID", `attachment_${index}`);
    if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_FILE_BYTES) return error("BUG_ATTACHMENT_SIZE_LIMIT", `attachment_${index}`);
    const bytes = await bytesOf(file?.bytes || file);
    if (!signatureMatches(type, bytes)) return error("BUG_ATTACHMENT_SIGNATURE_INVALID", `attachment_${index}`);
    return ok({ name, type, size, bytes });
  }

  function resolveReportStorage(storage) {
    if (storage !== undefined) return storage;
    return root.MaterialsQuoteSharedWorkingStateRuntime?.bugReportStorage?.() || root.localStorage;
  }

  function readReports(storage) {
    const target = resolveReportStorage(storage);
    try {
      const parsed = JSON.parse(target?.getItem(REPORTS_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function writeReports(reports, storage) {
    const target = resolveReportStorage(storage);
    try { target.setItem(REPORTS_KEY, JSON.stringify(reports)); return true; } catch (e) { return false; }
  }

  function openAttachmentDb() {
    if (!root.indexedDB) return Promise.reject(new Error("BUG_ATTACHMENT_STORAGE_UNAVAILABLE"));
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("BUG_ATTACHMENT_DB_ERROR"));
    });
  }

  function withAttachmentStore(mode, operation) {
    return openAttachmentDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      operation(store, resolve, reject);
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error || new Error("BUG_ATTACHMENT_DB_ERROR"));
    }));
  }

  function defaultAdapter() {
    const sharedAdapter = root.MaterialsQuoteSharedWorkingStateRuntime?.bugAttachmentAdapter?.();
    if (sharedAdapter) return sharedAdapter;
    return {
      put: (record) => withAttachmentStore("readwrite", (store, resolve) => { const req = store.put(record); req.onsuccess = () => resolve(record); }),
      get: (attachmentId) => withAttachmentStore("readonly", (store, resolve) => { const req = store.get(attachmentId); req.onsuccess = () => resolve(req.result || null); }),
      remove: (attachmentId) => withAttachmentStore("readwrite", (store, resolve) => { const req = store.delete(attachmentId); req.onsuccess = () => resolve(true); }),
    };
  }

  function base64FromBytes(bytes) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return root.btoa(binary);
  }

  function bytesFromBase64(value) {
    if (typeof Buffer !== "undefined") return Uint8Array.from(Buffer.from(String(value || ""), "base64"));
    const binary = root.atob(String(value || ""));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  async function exportForBackup(options = {}) {
    const reports = readReports(options.storage);
    const adapter = options.attachmentAdapter || defaultAdapter();
    const attachments = [];
    for (const report of reports) {
      for (const metadata of Array.isArray(report.attachments) ? report.attachments : []) {
        const stored = await adapter.get(metadata.id);
        if (!stored || !stored.bytes) return error("BUG_BACKUP_ATTACHMENT_MISSING", metadata.id);
        attachments.push({ ...metadata, report_id: report.id, bytes_base64: base64FromBytes(await bytesOf(stored.bytes)) });
      }
    }
    return ok({ schema: "bug-reports-backup/v1", reports: clone(reports), attachments });
  }

  async function importFromBackup(snapshot, actor, options = {}) {
    if (!canReadAll(actor)) return error("BUG_BACKUP_PERMISSION_DENIED", "restore");
    if (!snapshot || snapshot.schema !== "bug-reports-backup/v1" || !Array.isArray(snapshot.reports) || !Array.isArray(snapshot.attachments)) return error("BUG_BACKUP_SCHEMA_INVALID", "restore");
    const adapter = options.attachmentAdapter || defaultAdapter();
    const previous = await exportForBackup(options);
    if (!previous.ok) return error("BUG_BACKUP_CURRENT_STATE_INVALID", "restore");
    const reportIds = new Set();
    const expectedAttachments = new Map();
    for (const report of snapshot.reports) {
      if (!report?.id || reportIds.has(report.id)) return error("BUG_BACKUP_SCHEMA_INVALID", "restore");
      reportIds.add(report.id);
      for (const metadata of Array.isArray(report.attachments) ? report.attachments : []) {
        if (!metadata?.id || expectedAttachments.has(metadata.id)) return error("BUG_BACKUP_SCHEMA_INVALID", "restore");
        expectedAttachments.set(metadata.id, { ...metadata, report_id: report.id });
      }
    }
    const incomingRecords = [];
    for (const attachment of snapshot.attachments) {
      const metadata = expectedAttachments.get(attachment?.id);
      if (!metadata
        || attachment.report_id !== metadata.report_id
        || attachment.name !== metadata.name
        || attachment.mime_type !== metadata.mime_type
        || Number(attachment.size) !== Number(metadata.size)) return error("BUG_BACKUP_SCHEMA_INVALID", "restore");
      const bytes = bytesFromBase64(attachment.bytes_base64);
      const checked = await validateAttachment({ name: attachment.name, type: attachment.mime_type, size: bytes.length, bytes });
      if (!checked.ok || checked.value.size !== Number(metadata.size)) return error(checked.code || "BUG_BACKUP_SCHEMA_INVALID", "restore");
      incomingRecords.push({
        id: attachment.id,
        report_id: attachment.report_id,
        name: attachment.name,
        mime_type: attachment.mime_type,
        size: bytes.length,
        bytes,
      });
      expectedAttachments.delete(attachment.id);
    }
    if (expectedAttachments.size > 0) return error("BUG_BACKUP_SCHEMA_INVALID", "restore");
    const previousIds = new Set(previous.value.attachments.map((attachment) => attachment.id));
    const incomingIds = new Set(incomingRecords.map((attachment) => attachment.id));
    try {
      for (const record of incomingRecords) await adapter.put(record);
      if (!writeReports(snapshot.reports, options.storage)) throw new Error("BUG_METADATA_SAVE_FAILED");
      for (const attachmentId of previousIds) {
        if (!incomingIds.has(attachmentId)) await adapter.remove(attachmentId);
      }
      return ok(clone(snapshot.reports));
    } catch (e) {
      let rollbackOk = true;
      try {
        for (const attachment of previous.value.attachments) {
          const bytes = bytesFromBase64(attachment.bytes_base64);
          await adapter.put({
            id: attachment.id,
            report_id: attachment.report_id,
            name: attachment.name,
            mime_type: attachment.mime_type,
            size: bytes.length,
            bytes,
          });
        }
        for (const attachmentId of incomingIds) {
          if (!previousIds.has(attachmentId)) await adapter.remove(attachmentId);
        }
        if (!writeReports(previous.value.reports, options.storage)) rollbackOk = false;
      } catch (rollbackError) {
        rollbackOk = false;
      }
      if (!rollbackOk) return error("BUG_BACKUP_ROLLBACK_FAILED", "restore");
      return error(e.message === "BUG_METADATA_SAVE_FAILED" ? e.message : "BUG_BACKUP_RESTORE_FAILED", "restore");
    }
  }

  async function createBugReport(input = {}, context = {}) {
    const actor = context.actor;
    if (!canCreate(actor)) return error("BUG_PERMISSION_DENIED", "actor");
    const title = textValue(input.title || input.summary);
    const description = textValue(input.description);
    const files = Array.isArray(input.attachments) ? input.attachments : [];
    if (!title && !description && files.length === 0) return error("BUG_CONTENT_REQUIRED", "content");
    if (files.length > MAX_ATTACHMENTS) return error("BUG_ATTACHMENT_COUNT_LIMIT", "attachments");
    const checked = [];
    let total = 0;
    for (let index = 0; index < files.length; index += 1) {
      const result = await validateAttachment(files[index], index);
      if (!result.ok) return result;
      total += result.value.size;
      if (total > MAX_TOTAL_BYTES) return error("BUG_ATTACHMENT_TOTAL_LIMIT", "attachments");
      checked.push(result.value);
    }
    const now = new Date().toISOString();
    const report = {
      schema: SCHEMA,
      id: id("bug"),
      title: title.slice(0, 200),
      description: description.slice(0, 10000),
      attachments: checked.map((file) => ({ id: id("bug-attachment"), name: file.name, mime_type: file.type, size: file.size })),
      created_by: { id: String(actor.id), account: String(actor.account), name: String(actor.name || ""), role: roleOf(actor) },
      created_at: now,
      route: textValue(context.route).slice(0, 300),
      app_version: textValue(context.appVersion).slice(0, 100),
      status: "open",
      updated_at: now,
    };
    const adapter = context.attachmentAdapter || defaultAdapter();
    const written = [];
    try {
      for (let index = 0; index < checked.length; index += 1) {
        const attachment = report.attachments[index];
        written.push(attachment.id);
        await adapter.put({ id: attachment.id, report_id: report.id, name: attachment.name, mime_type: attachment.mime_type, size: attachment.size, bytes: checked[index].bytes });
      }
      const reports = readReports(context.storage);
      if (!writeReports([report, ...reports], context.storage)) throw new Error("BUG_METADATA_SAVE_FAILED");
      return ok(clone(report));
    } catch (e) {
      await Promise.all(written.map((attachmentId) => adapter.remove(attachmentId).catch(() => undefined)));
      return error(e.message === "BUG_METADATA_SAVE_FAILED" ? "BUG_METADATA_SAVE_FAILED" : "BUG_ATOMIC_CREATE_FAILED", "create");
    }
  }

  function listBugReports(actor, options = {}) {
    if (!validActor(actor)) return error("BUG_PERMISSION_DENIED", "actor");
    const all = readReports(options.storage);
    return ok(clone(canReadAll(actor) ? all : all.filter((item) => item.created_by?.id === actor.id)));
  }

  function getBugReport(idValue, actor, options = {}) {
    const listed = listBugReports(actor, options);
    if (!listed.ok) return listed;
    const report = listed.value.find((item) => item.id === idValue);
    return report ? ok(report) : error("BUG_NOT_FOUND_OR_FORBIDDEN", "report");
  }

  function updateBugStatus(idValue, status, actor, options = {}) {
    if (!canUpdateStatus({ id: idValue }, actor)) return error("BUG_STATUS_PERMISSION_DENIED", "status");
    if (!STATUS.has(status)) return error("BUG_STATUS_INVALID", "status");
    const reports = readReports(options.storage);
    const index = reports.findIndex((item) => item.id === idValue);
    if (index < 0 || !canUpdateStatus(reports[index], actor)) return error("BUG_NOT_FOUND_OR_FORBIDDEN", "report");
    reports[index] = { ...reports[index], status, updated_at: new Date().toISOString() };
    return writeReports(reports, options.storage) ? ok(clone(reports[index])) : error("BUG_METADATA_SAVE_FAILED", "status");
  }

  async function releaseAttachment(attachmentId, actor, options = {}) {
    const reports = readReports(options.storage);
    const report = reports.find((item) => item.attachments?.some((attachment) => attachment.id === attachmentId));
    if (!report || !canRead(report, actor)) return error("BUG_ATTACHMENT_PERMISSION_DENIED", "attachment");
    const adapter = options.attachmentAdapter || defaultAdapter();
    try { await adapter.remove(attachmentId); return ok(true); } catch (e) { return error("BUG_ATTACHMENT_RELEASE_FAILED", "attachment"); }
  }

  async function readBugAttachment({ reportId, attachmentId, actor } = {}, options = {}) {
    if (!validActor(actor)) return error("BUG_ATTACHMENT_PERMISSION_DENIED", "actor");
    const reports = readReports(options.storage);
    const report = reports.find((item) => item.id === reportId);
    if (!report || !canRead(report, actor)) return error("BUG_ATTACHMENT_PERMISSION_DENIED", "report");
    const metadata = report.attachments?.find((item) => item.id === attachmentId);
    if (!metadata) return error("BUG_ATTACHMENT_NOT_FOUND_OR_BROKEN", "reference");
    const adapter = options.attachmentAdapter || defaultAdapter();
    let record;
    try {
      record = await adapter.get(attachmentId);
    } catch (e) {
      return error("BUG_ATTACHMENT_READ_FAILED", "read");
    }
    if (!record) return error("BUG_ATTACHMENT_NOT_FOUND_OR_BROKEN", "blob");
    const checked = await validateAttachment({
      name: record.name,
      type: record.mime_type,
      size: record.size,
      bytes: record.bytes,
    }, 0);
    if (!checked.ok || checked.value.size !== metadata.size
      || checked.value.type !== metadata.mime_type
      || checked.value.name !== metadata.name) {
      return error("BUG_ATTACHMENT_NOT_FOUND_OR_BROKEN", "metadata");
    }
    return ok({
      report_id: reportId,
      attachment_id: attachmentId,
      name: metadata.name,
      mime_type: metadata.mime_type,
      size: metadata.size,
      bytes: checked.value.bytes,
    });
  }

  const api = Object.freeze({
    REPORTS_KEY, SCHEMA, MAX_ATTACHMENTS, MAX_FILE_BYTES, MAX_TOTAL_BYTES,
    createBugReport, listBugReports, getBugReport, updateBugStatus, readBugAttachment, exportForBackup, importFromBackup,
    validateAttachment, readReports, writeReports, canCreate, canRead, canReadAll, canUpdateStatus,
  });
  root.BugReportStore = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
