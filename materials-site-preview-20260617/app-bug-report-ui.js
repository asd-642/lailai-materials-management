(function (root) {
  "use strict";

  const STATUS_OPTIONS = Object.freeze([
    ["open", "待處理"],
    ["triaged", "已確認"],
    ["in_progress", "處理中"],
    ["resolved", "已解決"],
    ["closed", "已關閉"],
  ]);

  const ERROR_MESSAGES = Object.freeze({
    BUG_CONTENT_REQUIRED: "請填寫標題或問題描述，或加入至少一張圖片。",
    BUG_PERMISSION_DENIED: "目前帳號無法建立或查看 Bug 回報。",
    BUG_ATTACHMENT_TYPE_INVALID: "只接受 PNG、JPEG 或 WebP 圖片。",
    BUG_ATTACHMENT_SIGNATURE_INVALID: "圖片內容與檔案格式不符，請重新選擇。",
    BUG_ATTACHMENT_SIZE_LIMIT: "單張圖片不可超過 5 MiB。",
    BUG_ATTACHMENT_TOTAL_LIMIT: "單次回報的圖片總量不可超過 15 MiB。",
    BUG_ATTACHMENT_COUNT_LIMIT: "單次回報最多 5 張圖片。",
    BUG_STATUS_PERMISSION_DENIED: "目前帳號不能變更回報狀態。",
    BUG_STATUS_INVALID: "回報狀態無效。",
    BUG_NOT_FOUND_OR_FORBIDDEN: "找不到回報，或目前帳號無權查看。",
    BUG_METADATA_SAVE_FAILED: "回報資料無法保存，請確認瀏覽器儲存空間。",
    BUG_ATOMIC_CREATE_FAILED: "圖片或回報未完整保存，請重新送出。",
    BUG_ATTACHMENT_PERMISSION_DENIED: "目前帳號無權查看此附件。",
    BUG_ATTACHMENT_NOT_FOUND_OR_BROKEN: "附件不存在或已損壞。",
    BUG_ATTACHMENT_READ_FAILED: "附件讀取失敗，請稍後再試。",
  });

  function ensureBugReportUi() {
    if (!ui.bugReportDraft || typeof ui.bugReportDraft !== "object") ui.bugReportDraft = { title: "", description: "" };
    if (!Array.isArray(ui.bugReportFiles)) ui.bugReportFiles = [];
    if (!Array.isArray(ui.bugReportObjectUrls)) ui.bugReportObjectUrls = [];
    if (!Object.prototype.hasOwnProperty.call(ui, "bugReportFeedback")) ui.bugReportFeedback = null;
    if (!Object.prototype.hasOwnProperty.call(ui, "bugReportAttachmentPreview")) ui.bugReportAttachmentPreview = null;
    if (!Object.prototype.hasOwnProperty.call(ui, "bugReportSourceRoute")) ui.bugReportSourceRoute = "";
    return ui;
  }

  function resultError(code, fallback = "操作失敗，請再試一次。") {
    return { ok: false, code, error: ERROR_MESSAGES[code] || fallback };
  }

  function feedbackFromResult(result, successMessage = "") {
    if (result?.ok) return { ok: true, code: "OK", message: successMessage };
    const code = String(result?.code || "BUG_UNKNOWN_ERROR");
    return { ok: false, code, message: ERROR_MESSAGES[code] || "操作失敗，請再試一次。" };
  }

  function setBugReportFeedback(result, successMessage = "") {
    ensureBugReportUi();
    ui.bugReportFeedback = feedbackFromResult(result, successMessage);
  }

  function registerBugReportObjectUrl(blob) {
    ensureBugReportUi();
    const url = URL.createObjectURL(blob);
    ui.bugReportObjectUrls.push(url);
    return url;
  }

  function cleanupBugReportObjectUrls() {
    ensureBugReportUi();
    ui.bugReportObjectUrls.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch (error) { /* Browser owns URL cleanup. */ }
    });
    ui.bugReportObjectUrls = [];
  }

  function bugReportAppVersion() {
    const script = Array.from(document.scripts).find((item) => String(item.src || "").includes("app-bug-report-ui.js"));
    let build = "local";
    try { build = new URL(script?.src || location.href).searchParams.get("v") || build; } catch (error) { /* Keep local label. */ }
    return `941025-001 / ${build}`;
  }

  function formatBugReportTime(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "時間未記錄";
    return parsed.toLocaleString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
    });
  }

  function formatBugReportFileSize(size) {
    const bytes = Number(size) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }

  function statusLabel(status) {
    return STATUS_OPTIONS.find(([value]) => value === status)?.[1] || "狀態不明";
  }

  function renderBugReportFeedback() {
    const feedback = ensureBugReportUi().bugReportFeedback;
    if (!feedback) return "";
    return `<div class="bug-report-feedback ${feedback.ok ? "is-success" : "is-error"}" role="status" data-bug-feedback data-code="${h(feedback.code)}">${h(feedback.message)}</div>`;
  }

  function renderDraftAttachments() {
    const files = ensureBugReportUi().bugReportFiles;
    if (!files.length) return "";
    return `<div class="bug-draft-files">${files.map((file, index) => {
      const url = registerBugReportObjectUrl(new Blob([file.bytes], { type: file.type }));
      return `<figure class="bug-draft-file" data-bug-draft-file="${h(file.name)}">
        <img src="${h(url)}" alt="${h(file.name)} 預覽">
        <figcaption><span title="${h(file.name)}">${h(file.name)}</span><small>${h(formatBugReportFileSize(file.size))}</small></figcaption>
        <button class="icon-btn" type="button" data-bug-remove-file onclick="removeBugReportFile(${index})" aria-label="移除 ${h(file.name)}">×</button>
      </figure>`;
    }).join("")}</div>`;
  }

  function renderBugReportForm(actor) {
    const draft = ensureBugReportUi().bugReportDraft;
    const canCreate = Boolean(root.BugReportStore?.canCreate(actor));
    const sourceRoute = ui.bugReportSourceRoute || route().path || "/bug-reports";
    return `<section class="card bug-report-compose">
      <div class="card-header"><div><h2>新增回報</h2><p>文字或圖片至少填一項</p></div><span class="bug-file-count">${ui.bugReportFiles.length} / ${BugReportStore.MAX_ATTACHMENTS} 張</span></div>
      <form data-bug-report-form onsubmit="submitBugReport(event)" onpaste="handleBugReportPaste(event)">
        <div class="card-body bug-report-form-body">
          <div class="form-grid">
            <div class="field"><label>簡短標題</label><input class="input" name="title" maxlength="200" value="${h(draft.title)}" oninput="setBugReportDraftField(event)" placeholder="例：報價材料無法儲存"></div>
            <div class="bug-diagnostic" aria-label="回報診斷資訊">
              <span>來源頁面 <strong data-bug-diagnostic-route>${h(sourceRoute)}</strong></span>
              <span>網站版本 <strong data-bug-diagnostic-version>${h(bugReportAppVersion())}</strong></span>
            </div>
          </div>
          <div class="field"><label>問題描述</label><textarea class="textarea" name="description" maxlength="10000" oninput="setBugReportDraftField(event)" placeholder="發生了什麼、原本預期什麼">${h(draft.description)}</textarea></div>
          <div class="bug-dropzone" data-bug-dropzone tabindex="0" role="button" onclick="document.querySelector('[data-bug-files]').click()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.querySelector('[data-bug-files]').click()}" ondragover="handleBugReportDragOver(event)" ondragleave="handleBugReportDragLeave(event)" ondrop="handleBugReportDrop(event)">
            <strong>加入畫面圖片</strong>
            <span>選擇、拖放或直接貼上 PNG／JPEG／WebP</span>
            <small>每張最多 5 MiB，合計最多 15 MiB</small>
          </div>
          <input class="sr-only" data-bug-files type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" multiple onchange="handleBugReportFileInput(event)">
          ${renderDraftAttachments()}
        </div>
        <div class="card-footer bug-report-form-actions">
          <span class="muted">不會擷取密碼、整個瀏覽器畫面或其他分頁。</span>
          <button class="btn" type="submit" ${canCreate ? "" : "disabled"}>送出回報</button>
        </div>
      </form>
    </section>`;
  }

  function renderBugReportStatus(report, actor) {
    if (!BugReportStore.canUpdateStatus(report, actor)) return `<span class="badge bug-status-${h(report.status)}">${h(statusLabel(report.status))}</span>`;
    return `<label class="bug-status-control"><span class="sr-only">回報狀態</span><select class="select" data-bug-status onchange="updateBugReportStatus('${h(report.id)}',this.value)">${STATUS_OPTIONS.map(([value, label]) => `<option value="${h(value)}" ${report.status === value ? "selected" : ""}>${h(label)}</option>`).join("")}</select></label>`;
  }

  function renderBugReportItem(report, actor) {
    const attachments = Array.isArray(report.attachments) ? report.attachments : [];
    return `<article class="bug-report-item" data-bug-report-id="${h(report.id)}">
      <header class="bug-report-item-head">
        <div><h3>${h(report.title || "未命名回報")}</h3><p>${h(formatBugReportTime(report.created_at))} · ${h(report.created_by?.name || report.created_by?.account || "未知回報者")}</p></div>
        ${renderBugReportStatus(report, actor)}
      </header>
      <p class="bug-report-description">${h(report.description || "僅附圖片")}</p>
      ${attachments.length ? `<div class="bug-report-attachments">${attachments.map((attachment) => `<button class="bug-attachment-button" type="button" data-bug-attachment-id="${h(attachment.id)}" onclick="openBugReportAttachment('${h(report.id)}','${h(attachment.id)}')"><span>${h(attachment.name)}</span><small>${h(formatBugReportFileSize(attachment.size))}</small></button>`).join("")}</div>` : ""}
      <footer class="bug-report-meta"><span>${h(report.route || "來源頁面未記錄")}</span><span>${h(report.app_version || "版本未記錄")}</span></footer>
    </article>`;
  }

  function renderSavedAttachmentPreview() {
    const preview = ensureBugReportUi().bugReportAttachmentPreview;
    if (!preview) return "";
    const bytes = preview.bytes instanceof Uint8Array ? preview.bytes : new Uint8Array(preview.bytes || []);
    const url = registerBugReportObjectUrl(new Blob([bytes], { type: preview.mime_type }));
    return `<div class="permission-backdrop bug-preview-backdrop" role="presentation" onclick="closeBugReportAttachment()">
      <section class="permission-modal bug-preview-modal" role="dialog" aria-modal="true" aria-label="附件預覽" data-bug-attachment-preview onclick="event.stopPropagation()">
        <div class="permission-head"><div><h2>${h(preview.name)}</h2><p>${h(preview.report_title || "Bug 回報附件")} · ${h(formatBugReportFileSize(preview.size))}</p></div><button class="icon-btn" type="button" data-bug-preview-close onclick="closeBugReportAttachment()" aria-label="關閉附件預覽">×</button></div>
        <div class="bug-preview-body"><img src="${h(url)}" alt="${h(preview.name)}"></div>
      </section>
    </div>`;
  }

  function renderBugReports() {
    ensureBugReportUi();
    const actor = currentUser();
    const canCreate = Boolean(root.BugReportStore?.canCreate(actor));
    const canReadAll = Boolean(root.BugReportStore?.canReadAll(actor));
    const listed = root.BugReportStore?.listBugReports(actor) || resultError("BUG_PERMISSION_DENIED");
    const reports = listed.ok ? listed.value : [];
    return `<div data-bug-report-page>
      ${pageHead("Bug 回報", "記錄問題與處理進度", `<a class="btn outline" href="${link("/dashboard")}">返回</a>`)}
      <div class="bug-local-notice" data-bug-local-notice><strong>本機回報</strong><span>目前不會自動同步到其他電腦。</span></div>
      ${renderBugReportFeedback()}
      ${listed.ok ? `<div class="bug-report-layout">
        ${canCreate ? renderBugReportForm(actor) : `<section class="card"><div class="card-body"><div class="empty">目前帳號無法建立 Bug 回報。</div></div></section>`}
        <section class="bug-report-feed" aria-labelledby="bug-report-list-title">
          <div class="bug-report-feed-head"><div><h2 id="bug-report-list-title" data-bug-list-title>${canReadAll ? "所有回報" : "我的回報"}</h2><p>${reports.length} 筆</p></div></div>
          <div class="bug-report-list">${reports.length ? reports.map((report) => renderBugReportItem(report, actor)).join("") : `<div class="empty bug-report-empty">目前沒有回報</div>`}</div>
        </section>
      </div>` : `<section class="card"><div class="card-body"><div class="empty">${h(ERROR_MESSAGES[listed.code] || "目前無法讀取 Bug 回報。")}</div></div></section>`}
      ${renderSavedAttachmentPreview()}
    </div>`;
  }

  async function appendBugReportFiles(fileList) {
    ensureBugReportUi();
    const incoming = Array.from(fileList || []).filter((file) => file && file.size > 0);
    if (!incoming.length) return resultError("BUG_ATTACHMENT_TYPE_INVALID");
    if (ui.bugReportFiles.length + incoming.length > BugReportStore.MAX_ATTACHMENTS) {
      const result = resultError("BUG_ATTACHMENT_COUNT_LIMIT");
      setBugReportFeedback(result);
      render();
      return result;
    }
    const total = [...ui.bugReportFiles, ...incoming].reduce((sum, file) => sum + Number(file.size || 0), 0);
    if (total > BugReportStore.MAX_TOTAL_BYTES) {
      const result = resultError("BUG_ATTACHMENT_TOTAL_LIMIT");
      setBugReportFeedback(result);
      render();
      return result;
    }
    const normalized = [];
    for (let index = 0; index < incoming.length; index += 1) {
      const file = incoming[index];
      const payload = {
        name: file.name,
        type: file.type,
        size: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
      };
      const checked = await BugReportStore.validateAttachment(payload, ui.bugReportFiles.length + index);
      if (!checked.ok) {
        setBugReportFeedback(checked);
        render();
        return checked;
      }
      normalized.push(payload);
    }
    ui.bugReportFiles = [...ui.bugReportFiles, ...normalized];
    ui.bugReportFeedback = null;
    render();
    return { ok: true, value: ui.bugReportFiles.slice() };
  }

  root.openBugReportPage = function () {
    ensureBugReportUi();
    if (route().path !== "/bug-reports") ui.bugReportSourceRoute = route().raw || route().path || "/dashboard";
    ui.accountOpen = false;
    ui.bugReportFeedback = null;
    go("/bug-reports");
    return { ok: true };
  };

  root.setBugReportDraftField = function (event) {
    ensureBugReportUi();
    const name = String(event?.currentTarget?.name || event?.target?.name || "");
    if (!["title", "description"].includes(name)) return;
    ui.bugReportDraft[name] = String(event?.currentTarget?.value ?? event?.target?.value ?? "");
  };

  root.handleBugReportFileInput = async function (event) {
    const files = Array.from(event?.currentTarget?.files || []);
    if (event?.currentTarget) event.currentTarget.value = "";
    return appendBugReportFiles(files);
  };

  root.handleBugReportDragOver = function (event) {
    event.preventDefault();
    event.currentTarget?.classList.add("is-dragging");
  };

  root.handleBugReportDragLeave = function (event) {
    event.preventDefault();
    event.currentTarget?.classList.remove("is-dragging");
  };

  root.handleBugReportDrop = async function (event) {
    event.preventDefault();
    event.currentTarget?.classList.remove("is-dragging");
    return appendBugReportFiles(event.dataTransfer?.files || []);
  };

  root.handleBugReportPaste = async function (event) {
    const files = Array.from(event.clipboardData?.files || []).filter((file) => String(file.type || "").startsWith("image/"));
    if (!files.length) return { ok: true, value: [] };
    event.preventDefault();
    return appendBugReportFiles(files);
  };

  root.removeBugReportFile = function (index) {
    ensureBugReportUi();
    if (!Number.isInteger(index) || index < 0 || index >= ui.bugReportFiles.length) return resultError("BUG_ATTACHMENT_NOT_FOUND_OR_BROKEN");
    ui.bugReportFiles = ui.bugReportFiles.filter((file, fileIndex) => fileIndex !== index);
    ui.bugReportFeedback = null;
    render();
    return { ok: true, value: ui.bugReportFiles.slice() };
  };

  root.submitBugReport = async function (event) {
    event.preventDefault();
    ensureBugReportUi();
    const form = event.currentTarget;
    const data = new FormData(form);
    ui.bugReportDraft = { title: String(data.get("title") || ""), description: String(data.get("description") || "") };
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    const result = await BugReportStore.createBugReport({
      title: ui.bugReportDraft.title,
      description: ui.bugReportDraft.description,
      attachments: ui.bugReportFiles,
    }, {
      actor: currentUser(),
      route: ui.bugReportSourceRoute || route().path || "/bug-reports",
      appVersion: bugReportAppVersion(),
    });
    if (result.ok) {
      ui.bugReportDraft = { title: "", description: "" };
      ui.bugReportFiles = [];
      setBugReportFeedback(result, "回報已保存於這台電腦。");
    } else {
      setBugReportFeedback(result);
    }
    render();
    return result;
  };

  root.updateBugReportStatus = function (reportId, status) {
    const result = BugReportStore.updateBugStatus(reportId, status, currentUser());
    setBugReportFeedback(result, "回報狀態已更新。");
    render();
    return result;
  };

  root.openBugReportAttachment = async function (reportId, attachmentId) {
    ensureBugReportUi();
    const actor = currentUser();
    const detail = BugReportStore.getBugReport(reportId, actor);
    const read = await BugReportStore.readBugAttachment({ reportId, attachmentId, actor });
    if (!detail.ok || !read.ok) {
      const result = read.ok ? resultError("BUG_ATTACHMENT_PERMISSION_DENIED") : read;
      ui.bugReportAttachmentPreview = null;
      setBugReportFeedback(result);
      render();
      return result;
    }
    ui.bugReportAttachmentPreview = { ...read.value, report_title: detail.value.title || "未命名回報" };
    ui.bugReportFeedback = null;
    render();
    return read;
  };

  root.closeBugReportAttachment = function () {
    ensureBugReportUi();
    ui.bugReportAttachmentPreview = null;
    render();
    return { ok: true };
  };

  root.cleanupBugReportObjectUrls = cleanupBugReportObjectUrls;
  root.renderBugReports = renderBugReports;

  root.addEventListener("hashchange", () => {
    if (route().path === "/bug-reports") return;
    cleanupBugReportObjectUrls();
    ensureBugReportUi();
    ui.bugReportFiles = [];
    ui.bugReportDraft = { title: "", description: "" };
    ui.bugReportFeedback = null;
    ui.bugReportAttachmentPreview = null;
    ui.bugReportSourceRoute = "";
  });
  root.addEventListener("beforeunload", cleanupBugReportObjectUrls);
})(typeof globalThis !== "undefined" ? globalThis : window);
