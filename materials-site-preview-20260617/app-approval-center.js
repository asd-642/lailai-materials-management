function isLocalApprovalCenterReviewer() {
  const account = currentUser();
  return Boolean(
    account
    && account.is_active !== false
    && isFrontendRoleKnown()
    && MaterialsQuoteDomain.isLocalQuoteReviewer(account)
  );
}

function approvalCenterVersionLabel(value) {
  const version = Number(value);
  return `V${Number.isFinite(version) && version > 0 ? Math.floor(version) : 1}`;
}

function approvalCenterTime(value) {
  const text = String(value || "").trim();
  if (!text) return "未提供";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "時間格式異常";
  return parsed.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function approvalCenterActorLabel(actor) {
  const name = String(actor?.name || "").trim();
  const account = String(actor?.account || "").trim();
  return name || account || "未提供";
}

function approvalCenterQuoteTotal(quote) {
  if (!quote) return null;
  try {
    const total = Number(quoteDocumentContext(quote)?.totals?.total);
    return Number.isFinite(total) ? total : null;
  } catch (error) {
    console.warn("審核中心無法計算報價金額", error);
    return null;
  }
}

function approvalCenterPendingRows() {
  if (!window.QuoteApprovalSelectors?.pending) return [];
  return window.QuoteApprovalSelectors.pending().map((item) => {
    const quote = quoteById(item.quote_id);
    const customer = customerById(item.customer_id);
    return {
      ...item,
      quote,
      customerName: String(customer?.company_name || customer?.name || "").trim() || "找不到客戶",
      total: approvalCenterQuoteTotal(quote),
    };
  });
}

function approvalCenterHistoryRows() {
  if (!window.QuoteApprovalSelectors?.history) return [];
  return window.QuoteApprovalSelectors.history()
    .filter((event) => event?.action === "approve" || event?.action === "return")
    .slice()
    .reverse();
}

function approvalCenterSummary(pending, history) {
  const approved = history.filter((event) => event.action === "approve").length;
  const returned = history.filter((event) => event.action === "return").length;
  return `
    <div class="approval-summary" aria-label="審核概況">
      <div class="approval-summary-item">
        <span>目前待核准</span>
        <strong>${pending.length}</strong>
      </div>
      <div class="approval-summary-item">
        <span>核准紀錄</span>
        <strong>${approved}</strong>
      </div>
      <div class="approval-summary-item">
        <span>退回紀錄</span>
        <strong>${returned}</strong>
      </div>
    </div>
  `;
}

function renderApprovalCenterPending(rows) {
  if (!rows.length) {
    return `<div class="approval-empty empty">目前沒有待核准報價</div>`;
  }
  return `
    <div class="table-wrap">
      <table class="approval-table">
        <thead>
          <tr>
            <th>報價編號</th>
            <th>客戶／案件</th>
            <th>金額</th>
            <th>送審人</th>
            <th>送審時間</th>
            <th>版本／狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr data-approval-quote-id="${h(row.quote_id)}">
              <td>
                <a class="link-strong" href="${link(`/quotes/${row.quote_id}`)}">${h(row.quote_no || "未提供")}</a>
                <div class="sub">${h(row.quote_id || "缺少資料識別碼")}</div>
              </td>
              <td class="approval-customer">
                <strong>${h(row.customerName)}</strong>
                <div class="sub">${h(row.project_name || row.title || "未提供案件名稱")}</div>
              </td>
              <td class="amount">${row.total == null ? "無法計算" : money(row.total)}</td>
              <td>${h(approvalCenterActorLabel(row.submitted_by))}</td>
              <td>${h(approvalCenterTime(row.submitted_at))}</td>
              <td>
                <div class="approval-version">${h(approvalCenterVersionLabel(row.version_no))}</div>
                ${statusBadge("待核准", "amber")}
              </td>
              <td>
                <div class="approval-actions">
                  <a class="btn outline sm" href="${link(`/quotes/${row.quote_id}`)}">查看明細</a>
                  <button class="btn sm" type="button" data-approval-action="approve" data-approval-id="${h(row.quote_id)}" onclick="openApprovalDecision(this.dataset.approvalId,'approve')">核准</button>
                  <button class="btn danger sm" type="button" data-approval-action="return" data-approval-id="${h(row.quote_id)}" onclick="openApprovalDecision(this.dataset.approvalId,'return')">退回</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderApprovalCenterHistory(history) {
  if (!history.length) {
    return `<div class="empty">目前尚無核准或退回紀錄</div>`;
  }
  return `
    <div class="table-wrap">
      <table class="approval-history-table">
        <thead>
          <tr>
            <th>報價編號</th>
            <th>版本</th>
            <th>結果</th>
            <th>處理人</th>
            <th>處理時間</th>
            <th>原因／備註</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((event) => {
            const approved = event.action === "approve";
            return `
              <tr data-approval-history-action="${h(event.action)}">
                <td>
                  ${event.quote_id ? `<a class="link-strong" href="${link(`/quotes/${event.quote_id}`)}">${h(event.quote_no || "未提供")}</a>` : h(event.quote_no || "未提供")}
                </td>
                <td>${h(approvalCenterVersionLabel(event.version_no))}</td>
                <td>${statusBadge(approved ? "已核准" : "已退回", approved ? "green" : "red")}</td>
                <td>${h(approvalCenterActorLabel(event.actor))}</td>
                <td>${h(approvalCenterTime(event.at))}</td>
                <td class="approval-history-reason">${h(event.reason || (approved ? "核准時已建立文件快照" : "未提供"))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderApprovalCenterAccessDenied() {
  const role = frontendAccessRole();
  const description = role === "contractor"
    ? "外包人員僅可檢視報價，不能核准或退回。"
    : role === "unknown"
      ? "目前登入角色無法辨識，審核操作已全部關閉。"
      : "一般人員可送出報價，但只有老闆或現有管理人員能在本機過渡流程核准或退回。";
  return `
    <section class="approval-access-denied" aria-labelledby="approval-access-title">
      <div class="approval-access-icon" aria-hidden="true">唯讀</div>
      <div>
        <h2 id="approval-access-title">目前帳號不能執行審核</h2>
        <p>${h(description)}</p>
      </div>
    </section>
  `;
}

function renderApprovalDecisionDialog() {
  const decision = ui.approvalDecision;
  if (!decision) return "";
  const quote = quoteById(decision.quoteId);
  const approving = decision.action === "approve";
  return `
    <div class="approval-dialog-backdrop" role="presentation">
      <section class="approval-dialog" role="dialog" aria-modal="true" aria-labelledby="approval-dialog-title">
        <div class="approval-dialog-head">
          <div>
            <span class="approval-dialog-kicker">${h(quote?.quote_no || "未提供報價編號")} · ${h(approvalCenterVersionLabel(quote?.quote_version))}</span>
            <h2 id="approval-dialog-title">${approving ? "確認核准報價" : "退回報價修正"}</h2>
          </div>
          <button class="icon-btn" type="button" title="關閉" aria-label="關閉" onclick="closeApprovalDecision()">×</button>
        </div>
        <div class="approval-dialog-body">
          <p>${approving
            ? "核准後會由既有審核 action 建立此版本的文件快照；日後修訂必須建立新版本。"
            : "請說明需補正的內容。原因會保存在本機審核歷史中，讓製表人員可追查。"}</p>
          ${approving ? "" : `
            <div class="field">
              <label for="approval-return-reason">退回原因 <span aria-hidden="true">*</span></label>
              <textarea class="textarea" id="approval-return-reason" rows="4" maxlength="500" placeholder="例如：請補充施工範圍與付款條件">${h(decision.reason || "")}</textarea>
            </div>
          `}
          ${decision.error ? `<div class="approval-error" role="alert">${h(decision.error)}</div>` : ""}
        </div>
        <div class="approval-dialog-actions">
          <button class="btn secondary" type="button" data-approval-cancel onclick="closeApprovalDecision()">取消</button>
          <button class="btn ${approving ? "" : "danger"}" type="button" data-approval-confirm onclick="confirmApprovalDecision()" ${decision.busy ? "disabled" : ""}>
            ${decision.busy ? "處理中…" : approving ? "確認核准" : "確認退回"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function renderApprovalCenter() {
  const localNotice = `
    <div class="approval-local-notice" role="note">
      <strong>本機過渡審核</strong>
      <span>資料僅保存在此瀏覽器，不代表伺服器權限、電子簽章或不可竄改稽核。</span>
    </div>
  `;
  if (!isLocalApprovalCenterReviewer()) {
    return `
      <div class="approval-center">
        ${pageHead("審核中心", "檢視本機待核准報價與處理紀錄")}
        ${localNotice}
        ${renderApprovalCenterAccessDenied()}
      </div>
    `;
  }
  const pending = approvalCenterPendingRows();
  const history = approvalCenterHistoryRows();
  return `
    <div class="approval-center">
      ${pageHead("審核中心", "管理本機待核准報價、核准快照與退回原因")}
      ${localNotice}
      ${approvalCenterSummary(pending, history)}
      <section class="approval-section" aria-labelledby="pending-approval-title">
        <div class="approval-section-head">
          <div>
            <h2 id="pending-approval-title">待核准報價</h2>
            <p>核對客戶、案件、金額與版本後再執行審核。</p>
          </div>
          ${statusBadge(`${pending.length} 件`, pending.length ? "amber" : "green")}
        </div>
        ${renderApprovalCenterPending(pending)}
      </section>
      <section class="approval-section" aria-labelledby="approval-history-title">
        <div class="approval-section-head">
          <div>
            <h2 id="approval-history-title">審核紀錄</h2>
            <p>顯示本機已核准與已退回事件；舊版本內容不在此頁改寫。</p>
          </div>
        </div>
        ${renderApprovalCenterHistory(history)}
      </section>
      ${renderApprovalDecisionDialog()}
    </div>
  `;
}

function openApprovalDecision(quoteId, action) {
  if (!isLocalApprovalCenterReviewer()) {
    const result = { ok: false, code: "REVIEW_PERMISSION_DENIED", error: "目前帳號沒有本機報價審核權限" };
    setToast(result.error);
    return result;
  }
  if (!quoteById(quoteId) || !["approve", "return"].includes(action)) {
    const result = { ok: false, code: "APPROVAL_REQUEST_INVALID", error: "找不到可處理的待核准報價" };
    setToast(result.error);
    return result;
  }
  ui.approvalDecision = { quoteId, action, reason: "", error: "", busy: false };
  render();
  return { ok: true, code: "", error: "" };
}

function closeApprovalDecision() {
  ui.approvalDecision = null;
  render();
}

async function runApprovalCenterDecision(quoteId, action, reason = "") {
  if (isFrontendReadOnly()) return frontendWriteDenied();
  if (!window.QuoteApprovalActions) {
    return { ok: false, code: "APPROVAL_ACTION_UNAVAILABLE", error: "審核服務尚未載入，請重新整理後再試" };
  }
  if (action === "approve") return window.QuoteApprovalActions.approve(quoteId, { silent: true });
  if (action === "return") return window.QuoteApprovalActions.return(quoteId, { reason, silent: true });
  return { ok: false, code: "APPROVAL_ACTION_INVALID", error: "不支援的審核動作" };
}

async function confirmApprovalDecision() {
  const decision = ui.approvalDecision;
  if (!decision || decision.busy) return;
  const reason = decision.action === "return"
    ? String(document.getElementById("approval-return-reason")?.value || "").trim()
    : "";
  if (decision.action === "return" && !reason) {
    ui.approvalDecision = { ...decision, reason, error: "退回原因為必填，請說明需要補正的內容" };
    render();
    return;
  }
  ui.approvalDecision = { ...decision, reason, error: "", busy: true };
  render();
  const result = await runApprovalCenterDecision(decision.quoteId, decision.action, reason);
  if (!result?.ok) {
    ui.approvalDecision = { ...decision, reason, error: result?.error || "審核操作失敗，資料未變更", busy: false };
    render();
    return;
  }
  ui.approvalDecision = null;
  setToast(decision.action === "approve" ? "報價已核准並保存版本快照" : "報價已退回並保存原因");
}
