function renderQuoteForm(quoteId) {
  const draft = ensureQuoteDraft(quoteId);
  const liveQuote = quoteId ? quoteById(quoteId) : null;
  const approvalState = liveQuote && window.QuoteApprovalSelectors?.state
    ? window.QuoteApprovalSelectors.state(quoteId)
    : null;
  if (quoteId && liveQuote && approvalState?.status === "pending_approval") {
    const pendingRow = quoteApprovalPendingRow(quoteId);
    const canWithdraw = quoteCanCurrentUserWithdraw(quoteId);
    const busy = ui.quoteApprovalBusy?.quoteId === quoteId;
    return `
      ${pageHead("報價單待核准", `${liveQuote.quote_no} · ${quoteRevisionLabel(liveQuote)}`)}
      <section class="quote-pending-panel" data-quote-pending-state>
        <div class="quote-pending-copy">
          ${statusBadge("待核准", "amber")}
          <h2>此版本已鎖定編輯</h2>
          <p>${approvalState.pending && pendingRow ? "報價已成功送出，主管核准或原送審人撤回後才能繼續修改。" : h(approvalState.reason || "待核准資料不完整，操作已關閉；請由管理人員在審核中心確認。")}</p>
        </div>
        <div class="quote-pending-actions">
          <a class="btn outline" href="${link(`/quotes/${quoteId}`)}">返回明細</a>
          ${canWithdraw ? `<button class="btn danger" type="button" data-quote-withdraw onclick="withdrawPendingQuoteSubmission('${h(quoteId)}')" ${busy ? "disabled" : ""}>${busy ? "撤回中…" : "撤回送審"}</button>` : ""}
        </div>
      </section>
    `;
  }
  if (quoteId && liveQuote && approvalState?.locked) {
    return `
      ${pageHead("報價單已鎖定", `${liveQuote.quote_no} · ${quoteRevisionLabel(liveQuote)}`)}
      <section class="card"><div class="card-body"><div class="empty">這張報價已寄出或結案，為保留當時文件內容，不能直接覆寫。</div></div><div class="card-footer"><a class="btn outline" href="${link(`/quotes/${quoteId}`)}">返回明細</a><button class="btn" type="button" onclick="createQuoteRevision('${h(quoteId)}')">建立修訂版</button></div></section>
    `;
  }
  const totals = computeQuote(draft);
  const customer = customerById(draft.customer_id);
  const tpl = templateById(draft.template_id);
  const autosaveText = ui.quoteDraftSavedAt ? `已自動儲存 ${new Date(ui.quoteDraftSavedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}` : "自動儲存已啟用";
  const estimateWarning = MaterialsQuoteDomain.quoteEstimateWarning(draft);
  const canPrice = canEditMaterialPrices();
  return `
    ${pageHead(quoteId ? "編輯報價單" : "新增報價單", quoteId ? `${draft.quote_no} · ${quoteRevisionLabel(draft)}` : "選擇客戶與版本,加入材料明細,即時試算")}
    <div class="quote-autosave ${ui.quoteDraftRestored ? "is-restored" : ""}"><span>${ui.quoteDraftRestored ? "已復原上次未完成的草稿" : autosaveText}</span><button class="btn outline sm" type="button" onclick="discardQuoteDraft('${h(quoteId || "")}')">捨棄草稿</button></div>
    ${estimateWarning ? `<div class="hint amber safety-banner">${h(estimateWarning)}</div>` : ""}
    <div class="hint amber safety-banner">原 Excel 無唯一反推公式：只有目標總金額時，系統不會比例分攤、Goal Seek 或捏造材料／工資明細。</div>
    <form class="grid" onsubmit="saveQuote(event,'${quoteId || ""}')">
      <section class="card"><div class="card-header"><h2>報價單資訊</h2></div><div class="card-body form-grid">
        <div class="field picker-wrap"><label>客戶*</label>${pickerButton("customer", customer ? customer.name : "搜尋並選擇客戶…", customer ? `${customer.company_name} · ${customer.phone}` : "")}</div>
        <div class="field picker-wrap"><label>使用版本</label>${pickerButton("template", tpl ? tpl.name : "選擇版本", tpl ? tpl.description : "", true)}<small>選擇報價單版本範本 (注意事項/付款條件/保固/工錢細項)</small></div>
        ${quoteInput("報價單標題", "title", draft.title, "例:某某案場 二樓裝修報價")}
        ${quoteInput("案場 / 專案名稱", "project_name", draft.project_name)}
        ${quoteInput("案場地址", "project_address", draft.project_address, "留空則使用客戶地址")}
        ${quoteInput("案場聯絡人", "project_contact", draft.project_contact, "可填姓名與電話")}
        ${quoteInput("報價日期", "quote_date", draft.quote_date, "", "date", true)}
        ${quoteInput("報價有效期至", "valid_until", draft.valid_until, "寄出前必填", "date")}
        <div class="field"><label>估價方式*</label><select class="select" data-quote-path="estimate_method" onchange="updateQuotePath(this,true)"><option value="detailed" ${draft.estimate_method === "detailed" ? "selected" : ""}>明細估價</option><option value="quick" ${draft.estimate_method === "quick" ? "selected" : ""}>快速估算</option></select><small>${draft.estimate_method === "quick" ? "不得直接用於精算／備料" : "依材料與工錢明細計算"}</small></div>
        <div class="field"><label>負責人</label><select class="select" data-quote-path="owner_id" onchange="updateQuotePath(this,true)">${renderQuoteOwnerOptions(draft.owner_id)}</select></div>
        ${quoteInput("下次追蹤日", "next_follow_up", draft.next_follow_up, "顯示於每日待辦", "date")}
        <div class="field"><label>狀態</label><select class="select" data-quote-path="status" onchange="updateQuotePath(this,true)">${Object.entries(QUOTE_STATUS_LABEL).filter(([value]) => ["draft", "returned", "lost"].includes(value)).map(([value, label]) => `<option value="${value}" ${draft.status === value ? "selected" : ""}>${label}</option>`).join("")}</select><small>送審、核准與寄出狀態請在報價明細依流程操作</small></div>
        ${draft.status === "lost" ? quoteInput("未成交原因", "lost_reason", draft.lost_reason, "請記錄原因，方便日後分析") : ""}
      </div></section>
      <section class="card"><div class="card-header"><h2>承作範圍與金額調整</h2></div><div class="card-body form-grid">
        <div class="field"><label>包含項目*</label><textarea class="textarea" data-quote-list-path="included_scope" oninput="updateQuoteListPath(this)" placeholder="每行一項">${h((draft.included_scope || []).join("\n"))}</textarea><small>核准與列印前必填</small></div>
        <div class="field"><label>不包含項目*</label><textarea class="textarea" data-quote-list-path="excluded_scope" oninput="updateQuoteListPath(this)" placeholder="每行一項；若無請填「無」">${h((draft.excluded_scope || []).join("\n"))}</textarea><small>核准與列印前必填</small></div>
        ${canPrice ? `<div class="field span-2"><label>折扣或金額調整理由</label><input class="input" data-quote-path="adjustment_reason" value="${h(draft.adjustment_reason || "")}" oninput="updateQuotePath(this)" onchange="updateQuotePath(this,true)" placeholder="有折扣或調整時必填"></div>` : quoteReadonly("折扣或金額調整理由", draft.adjustment_reason || "未調整", "目前角色不可修改價格", "span-2")}
      </div></section>
      <section class="card"><div class="card-header"><h2>工程項目 (${draft.sections.length})</h2><button class="btn outline sm" type="button" onclick="addQuoteSection()">＋ 新增工程項目</button></div><div class="card-body">
        ${draft.sections.map((section, index) => renderQuoteSection(section, totals.sections[index], index)).join("")}
      </div></section>
      <section class="card"><div class="card-header"><h2>金額計算</h2></div><div class="card-body split">
        <div class="form-grid">
          ${canPrice ? quoteInput("折扣／調整金額", "discount_amount", draft.discount_amount, "直接從工程小計扣除；非 0 時需填理由", "number") : quoteReadonly("折扣／調整金額", draft.discount_amount, "目前角色不可修改價格")}
          ${canPrice ? quoteInput("稅率 %", "tax_rate", draft.tax_rate, "例:5 表示加 5% 營業稅,0 = 含稅或免稅", "number") : quoteReadonly("稅率 %", draft.tax_rate, "目前角色不可修改價格")}
          <div class="field span-2"><label>本張覆蓋備註</label><textarea class="textarea" data-quote-path="extra_notes" oninput="updateQuotePath(this)" onchange="updateQuotePath(this,true)">${h(draft.extra_notes)}</textarea><small>若想覆蓋版本範本的「注意事項」,可填這裡</small></div>
        </div>
        <div class="calc-box">
          ${draft.sections.map((section, index) => calcLine(`工程 #${index + 1} (${section.area_qty} ${section.unit})`, money(totals.sections[index].sectionTotal))).join("")}
          ${calcLine("工程小計", money(totals.subtotal))}
          ${totals.discount ? calcLine("折讓", `− ${money(totals.discount)}`) : ""}
          ${calcLine(`稅額 (${draft.tax_rate}% × ${money(Math.max(0, totals.subtotal - totals.discount))})`, `+ ${money(totals.tax)}`)}
          ${calcLine("合計", money(totals.total))}
          ${canEditMaterialPrices() ? totals.hasCompleteCostData ? `${calcLine("已確認材料成本", money(totals.materialCost))}${calcLine("售價扣材料成本", money(Math.max(0, totals.subtotal - totals.discount - totals.materialCost)))}` : `<div class="hint amber" style="margin-top:10px">部分材料成本尚未人工確認，暫不顯示完整成本分析。</div>` : ""}
        </div>
      </div><div class="card-footer">
        ${quoteId && canDeleteCollection("quotes") ? `<button class="btn danger" type="button" onclick="deleteRecord('quotes','${quoteId}','/quotes')">刪除</button>` : ""}
        <a class="btn outline" href="${link("/quotes")}">取消</a>
        <button class="btn" type="submit">${quoteId ? "儲存變更" : "建立報價單"}</button>
      </div></section>
    </form>
    ${renderMaterialDrawer()}
  `;
}

function quoteInput(label, pathName, value, hint = "", type = "text", required = false) {
  return `<div class="field"><label>${h(label)}${required ? "*" : ""}</label><input class="input" type="${type}" data-quote-path="${h(pathName)}" value="${h(value)}" ${required ? "required" : ""} oninput="updateQuotePath(this)" onchange="updateQuotePath(this,true)">${hint ? `<small>${h(hint)}</small>` : ""}</div>`;
}

function quoteReadonly(label, value, hint = "", cls = "") {
  return `<div class="field ${cls}"><label>${h(label)}</label><input class="input" value="${h(value)}" readonly aria-readonly="true">${hint ? `<small>${h(hint)}</small>` : ""}</div>`;
}

function renderQuoteOwnerOptions(selectedId) {
  return loadAccounts().filter((account) => account.is_active).map((account) => `<option value="${h(account.id)}" ${account.id === selectedId ? "selected" : ""}>${h(account.name)}</option>`).join("");
}

function pickerButton(type, text, sub = "", clearable = false) {
  const panel = ui.picker === type ? renderPickerPanel(type) : "";
  return `<button class="picker-btn" type="button" onclick="togglePicker('${type}')"><span><strong>${h(text)}</strong>${sub ? `<br><span class="sub">${h(sub)}</span>` : ""}</span><span>⌄</span></button>${clearable ? `<button class="btn outline sm" type="button" onclick="setQuotePicker('${type}','')">清除</button>` : ""}${panel}`;
}

function renderPickerPanel(type) {
  let items = [];
  if (type === "customer") {
    items = state.customers.filter((item) => item.is_active).map((item) => ({ id: item.id, title: item.name, sub: `${item.company_name} · ${item.phone}` }));
  }
  if (type === "template") {
    items = state.templates.filter((item) => item.is_active).map((item) => ({ id: item.id, title: item.name, sub: item.description }));
  }
  if (type === "material") {
    items = state.materials.filter((item) => item.is_active).map((item) => ({ id: item.id, title: item.name, sub: `${item.category} · #${item.code}` }));
  }
  const needle = ui.pickerSearch.toLowerCase();
  const filtered = items.filter((item) => `${item.title} ${item.sub}`.toLowerCase().includes(needle));
  return `<div class="picker-panel">
    <input class="input" placeholder="搜尋…" value="${h(ui.pickerSearch)}" oninput="updatePickerSearch(this.value)" autofocus>
    <div class="picker-list">
      ${filtered.length ? filtered.map((item) => `<button class="picker-option" type="button" onclick="setQuotePicker('${type}','${item.id}')"><strong>${h(item.title)}</strong><br><span class="sub">${h(item.sub)}</span></button>`).join("") : `<div class="empty">找不到符合的項目</div>`}
    </div>
  </div>`;
}

function renderQuoteSection(section, computed, index) {
  const excelMode = section.calculation_mode === MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE;
  const formulaErrors = Array.isArray(computed.errors) ? computed.errors : [];
  return `<div class="quote-section">
    <div class="quote-section-head">
      <button class="icon-btn" type="button" onclick="moveSection(${index},-1)" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="icon-btn" type="button" onclick="moveSection(${index},1)" ${index === ui.quoteDraft.sections.length - 1 ? "disabled" : ""}>↓</button>
      <button class="main-toggle" type="button"><strong>${h(section.name || `工程項目 #${index + 1}`)}</strong><span class="muted">${money(computed.unitCost)}/${h(section.unit)} × ${h(section.area_qty)}</span><span class="amount">${money(computed.sectionTotal)}</span></button>
      <button class="icon-btn" type="button" onclick="removeSection(${index})">×</button>
    </div>
    <div class="card-body">
      <div class="form-grid cols-4">
        ${sectionInput(index, "工程名稱", "name", section.name, "例:塑木天花", "text", true, "span-2")}
        ${sectionInput(index, "面積 / 數量", "area_qty", section.area_qty, "", "number", true)}
        ${sectionInput(index, "單位", "unit", section.unit, "M²")}
        <div class="field span-4"><label>規格 (印在報價單上)</label><textarea class="textarea" data-section="${index}" data-section-field="spec" oninput="updateSectionField(this)" onchange="updateSectionField(this,true)" placeholder="例:面板:塑木中空2.5*14.6cm 7號色 / 底樑:不鏽鋼">${h(section.spec)}</textarea></div>
      </div>
      ${excelMode ? `<div class="hint" style="margin-top:12px">公式版本：excel-1150709-forward-v1 · 來源為兩份已確認原 Excel；尺寸統一換算 cm，材料列與客戶工項金額依 Excel ROUND 取整。</div>${formulaErrors.length ? `<div class="hint amber" style="margin-top:8px">${h(formulaErrors[0])}</div>` : ""}` : `<div class="hint amber" style="margin-top:12px">舊報價相容模式：保留原計算與歷史資料，不會偽裝成新 Excel 公式結果。</div>`}
      <div style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:10px"><h3 style="margin:0;font-size:15px">材料明細 (${section.items.length}) — 以每 1 ${h(section.unit)} 用量計</h3><button class="btn outline sm" type="button" onclick="addQuoteItem(${index})">＋ 新增材料</button></div>
      ${section.items.map((item, itemIndex) => renderQuoteItem(item, computed.itemsComputed[itemIndex], index, itemIndex, excelMode)).join("")}
      <div style="display:flex;justify-content:flex-end;margin:10px 4px 0"><span class="muted">材料小計 (每${h(section.unit)})</span><span class="amount" style="margin-left:12px">${money(computed.materialSubtotal)}</span></div>
      ${excelMode ? "" : `<div style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:10px"><h3 style="margin:0;font-size:15px">工錢明細 — 工錢總額 ${money(computed.laborSubtotal)} (每${h(section.unit)})</h3>${canEditMaterialPrices() ? `<button class="btn outline sm" type="button" onclick="addQuoteLabor(${index})">＋ 新增細項</button>` : ""}</div>`}
      ${excelMode ? renderExcelLaborConfig(section, computed, index) : computed.laborDist.items.map((row, laborIndex) => renderQuoteLabor(row, index, laborIndex)).join("")}
      <div class="calc-box" data-labor-section-summary="${index}" style="margin-top:14px;display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap"><span>每 ${h(section.unit)} 單價 <strong data-labor-section-unit-cost="${index}">${money(computed.unitCost)}</strong></span><span>×</span><span>${h(section.area_qty)} ${h(section.unit)}</span><span>=</span><span class="amount" data-labor-section-total="${index}">${money(computed.sectionTotal)}</span></div>
    </div>
  </div>`;
}

function sectionInput(index, label, fieldName, value, placeholder = "", type = "text", required = false, cls = "") {
  return `<div class="field ${cls}"><label>${h(label)}${required ? "*" : ""}</label><input class="input" type="${type}" data-section="${index}" data-section-field="${fieldName}" oninput="updateSectionField(this)" onchange="updateSectionField(this,true)" value="${h(value)}" placeholder="${h(placeholder)}" ${required ? "required" : ""}></div>`;
}

function renderQuoteItem(item, computed, sectionIndex, itemIndex, excelMode = false) {
  return `<div class="mini-row">
    <span class="muted">${itemIndex + 1}</span>
    <button type="button" style="border:0;background:transparent;text-align:left;cursor:pointer;min-width:0" onclick="openMaterialDrawer(${sectionIndex},${itemIndex})">
      <strong>${h(item.name || "(未命名)")}</strong> <span class="badge">${h(pricingLabel(item.pricing_type, true))}</span>${item.is_chargeable === false ? ` <span class="badge">報價不另計</span>` : ""}${!excelMode && item.is_required_for_preparation !== false ? ` <span class="badge">備料必需</span>` : ""}${item.catalog_review_required ? ` <span class="badge">待覆核</span>` : ""}
      <div class="sub">${computed.ok ? `${computed.priceableQty.toFixed(2)} ${h(item.unit)} @${money(computed.actualUnitPrice)} ${item.is_chargeable === false ? "本項不另計" : money(computed.materialSubtotal)}${excelMode ? ` · 報價拆料量 ${h(computed.breakdownTotalQty)} ${h(item.unit)}` : ""}` : "資料不全"}</div>
      ${item.catalog_review_required ? `<div class="hint amber" style="margin-top:6px">${h(item.catalog_review_reason || "主檔已變更／待覆核")}</div>` : ""}
    </button>
    <button class="btn outline sm" type="button" onclick="openMaterialDrawer(${sectionIndex},${itemIndex})">編輯</button>
    <button class="icon-btn" type="button" onclick="removeQuoteItem(${sectionIndex},${itemIndex})">×</button>
  </div>`;
}

function quoteLaborDetailFeedbackKey(sectionIndex, rowId = "", fieldName = "") {
  return [sectionIndex, rowId || "section", fieldName || "general"].join(":");
}

function quoteLaborDetailFeedback(sectionIndex, rowId = "", fieldName = "") {
  return ui.quoteLaborDetailFeedback?.[quoteLaborDetailFeedbackKey(sectionIndex, rowId, fieldName)] || "";
}

function quoteLaborDetailSectionGateError(sectionIndex) {
  if (!ui.quoteDraft) return "找不到目前報價草稿";
  const prefix = `工程 ${Number(sectionIndex) + 1}`;
  const validation = MaterialsQuoteDomain.validateQuoteForStatus(
    ui.quoteDraft,
    computeQuote(ui.quoteDraft),
    "pending_approval",
    { template: templateById(ui.quoteDraft.template_id), enforceP0: true },
  );
  return (validation.errors || []).find((error) => (
    error === `${prefix} 尚有未完成的材料資料`
      || error.startsWith(`${prefix} 材料 `)
  )) || "";
}

function renderExcelLaborDetailInput(row, sectionIndex, fieldName, options = {}) {
  const error = quoteLaborDetailFeedback(sectionIndex, row.row_id, fieldName);
  const readonly = options.editable ? "" : 'readonly aria-readonly="true"';
  const type = options.type || "text";
  const numeric = type === "number" ? ` min="0" step="${options.step || "0.001"}" inputmode="decimal"` : "";
  return `<div class="excel-labor-cell ${error ? "has-error" : ""}">
    <input class="input" type="${type}" value="${h(row[fieldName])}" aria-label="${h(`${row.name}${options.label || fieldName}`)}" data-labor-detail-section="${sectionIndex}" data-labor-row-id="${h(row.row_id)}" data-labor-detail-field="${h(fieldName)}" oninput="clearExcelLaborDetailFieldError(this)" onchange="updateExcelLaborDetailField(this)"${numeric} ${readonly}>
    ${error ? `<small class="excel-labor-field-error" role="alert" data-labor-error="${h(`${row.row_id}:${fieldName}`)}">${h(error)}</small>` : ""}
  </div>`;
}

function renderExcelLaborConfig(section, computed, sectionIndex) {
  const selected = MaterialsQuoteDomain.selectExcelLaborDetail(section);
  const rows = Array.isArray(selected.rows) && selected.rows.length ? selected.rows : computed.laborDist.items || [];
  const status = String(ui.quoteDraft?.status || "draft");
  const statusEditable = ["draft", "returned"].includes(status);
  const materialGateError = quoteLaborDetailSectionGateError(sectionIndex);
  const editable = Boolean(selected.ok && !materialGateError && statusEditable && canUseFrontendWrite());
  const basis = selected.default_snapshot?.basis || {};
  const config = basis.labor_config || section.labor_config || {};
  const generalFeedback = quoteLaborDetailFeedback(sectionIndex);
  const blockedMessage = generalFeedback || materialGateError || (!selected.ok ? selected.error : !statusEditable ? "報價已送審或鎖定，工料明細僅供檢視。" : !canUseFrontendWrite() ? "目前角色僅可檢視工料明細。" : "");
  const rowHtml = rows.map((row) => `<div class="excel-labor-row ${row.is_overridden ? "is-overridden" : ""}" data-excel-labor-row="${h(row.row_id)}" data-labor-row-id="${h(row.row_id)}">
    <div class="excel-labor-name-cell">
      ${renderExcelLaborDetailInput(row, sectionIndex, "name", { label: "名稱", editable })}
      ${row.is_overridden ? '<small class="excel-labor-row-state">此列已調整</small>' : ""}
    </div>
    ${renderExcelLaborDetailInput(row, sectionIndex, "unit", { label: "單位", editable })}
    ${renderExcelLaborDetailInput(row, sectionIndex, "factor", { label: "係數或比例", type: "number", editable })}
    ${renderExcelLaborDetailInput(row, sectionIndex, "base_value", { label: "基準值或單價", type: "number", editable })}
    ${renderExcelLaborDetailInput(row, sectionIndex, "quantity", { label: "數量或工數", type: "number", editable })}
    <output class="excel-labor-amount amount" data-labor-amount="${h(row.row_id)}" aria-label="${h(`${row.name}金額`)}">${money(row.amount)}</output>
  </div>`).join("");
  return `<section class="excel-labor-panel" data-excel-labor-detail="${sectionIndex}">
    <div class="excel-labor-toolbar">
      <div>
        <h3>工料與運費明細 <span class="muted">每 ${h(section.unit)}</span></h3>
        <p>工料小計 <strong>${money(selected.labor_subtotal ?? computed.laborSubtotal)}</strong></p>
      </div>
      <div class="excel-labor-toolbar-actions">
        ${selected.has_overrides ? '<span class="badge excel-labor-override-state">已手動調整</span>' : ""}
        <button class="btn outline sm" type="button" data-labor-reset="${sectionIndex}" onclick="resetExcelLaborDetail(${sectionIndex})" ${!editable || !selected.has_overrides ? "disabled" : ""}>重置為預設值</button>
      </div>
    </div>
    <div class="excel-labor-basis">公式基準：才數 ${h(basis.board_foot_total ?? computed.boardFootTotal)} · 每才工資 ${h(config.labor_per_board_foot ?? 140)} · 工料目標 ${money(basis.labor_subtotal_target ?? computed.laborSubtotal)}</div>
    <div class="excel-labor-detail-head"><span>名稱</span><span>單位</span><span>係數／比例</span><span>基準值／單價</span><span>數量／工數</span><span>金額</span></div>
    <div class="excel-labor-detail-body">${rowHtml}</div>
    ${blockedMessage ? `<div class="excel-labor-message ${selected.ok && !materialGateError ? "" : "is-error"}" role="status">${h(blockedMessage)}</div>` : ""}
  </section>`;
}

function renderQuoteLabor(row, sectionIndex, laborIndex) {
  const pricingLocked = !canEditMaterialPrices();
  return `<div class="labor-grid">
    <input class="input" value="${h(row.name)}" data-labor-section="${sectionIndex}" data-labor-index="${laborIndex}" data-labor-field="name" oninput="updateLaborField(this)" onchange="updateLaborField(this,true)" placeholder="名稱">
    <input class="input" value="${h(row.unit || "式")}" data-labor-section="${sectionIndex}" data-labor-index="${laborIndex}" data-labor-field="unit" oninput="updateLaborField(this)" onchange="updateLaborField(this,true)" placeholder="式">
    <input class="input" type="number" step="0.01" value="${h(row.pct)}" data-labor-section="${sectionIndex}" data-labor-index="${laborIndex}" data-labor-field="pct" oninput="updateLaborField(this)" onchange="updateLaborField(this,true)" placeholder="%" ${row.is_balancer || pricingLocked ? "disabled" : ""}>
    <input class="input" type="number" step="0.01" value="${h(row.unit_price)}" data-labor-section="${sectionIndex}" data-labor-index="${laborIndex}" data-labor-field="unit_price" oninput="updateLaborField(this)" onchange="updateLaborField(this,true)" placeholder="工資/工" ${pricingLocked ? "disabled" : ""}>
    <input class="input" type="number" step="0.01" value="${h(row.manual_amount)}" data-labor-section="${sectionIndex}" data-labor-index="${laborIndex}" data-labor-field="manual_amount" oninput="updateLaborField(this)" onchange="updateLaborField(this,true)" placeholder="固定額" ${row.is_balancer || pricingLocked ? "disabled" : ""}>
    <label class="checkbox-row"><input type="radio" name="labor_balancer_${sectionIndex}" ${row.is_balancer ? "checked" : ""} onchange="setLaborBalancer(${sectionIndex},${laborIndex})" ${pricingLocked ? "disabled" : ""}>餘額</label>
    <span class="amount">${money(row.amount)}</span>
    ${pricingLocked ? "<span></span>" : `<button class="icon-btn" type="button" onclick="removeQuoteLabor(${sectionIndex},${laborIndex})">×</button>`}
  </div>`;
}

function renderMaterialDrawer() {
  const edit = ui.editingMaterial;
  if (!edit || !ui.quoteDraft) return "";
  const section = ui.quoteDraft.sections[edit.sectionIndex];
  const item = section.items[edit.itemIndex];
  const excelMode = section.calculation_mode === MaterialsQuoteDomain.EXCEL_FORWARD_CALCULATION_MODE;
  const computed = excelMode ? computeSection(section).itemsComputed[edit.itemIndex] : computeItem(item);
  const opt = pricingOption(item.pricing_type);
  const trace = computed.formulaTrace;
  const isCustom = item.item_kind === "custom" || !item.material_id;
  const canPrice = canEditMaterialPrices();
  return `<div class="drawer-backdrop" onclick="closeMaterialDrawer()"></div>
    <aside class="drawer quote-material-drawer" aria-label="編輯報價材料">
      <div class="drawer-head"><span><strong>編輯材料 #${edit.itemIndex + 1}</strong><small>${h(ui.quoteDraft.sections[edit.sectionIndex].name || "工程")}</small></span><button class="icon-btn" type="button" aria-label="關閉" onclick="closeMaterialDrawer()">×</button></div>
      <div class="drawer-body">
        <section class="drawer-section drawer-source-section">
          <div class="drawer-section-head"><div><span class="drawer-step">01</span><h3>材料來源</h3></div>${item.material_id ? `<button class="btn outline sm" type="button" onclick="setCustomQuoteItem()">改為自訂品項</button>` : ""}</div>
          <div class="field picker-wrap">${pickerButton("material", item.material_id ? materialById(item.material_id)?.name || "從材料庫選" : "自訂品項（也可從材料庫選）", item.material_id ? `${materialById(item.material_id)?.category || ""} · #${materialById(item.material_id)?.code || ""}` : "尚未連結材料主檔")}</div>
          ${item.catalog_review_required ? `<div class="drawer-alert is-warning">${h(item.catalog_review_reason || "主檔已變更，請重新選取並覆核")}</div>` : ""}
          <details class="drawer-trace">
            <summary><span class="badge blue">${h(trace.formula_version)}</span><span>公式與來源</span><small>${h(pricingLabel(item.pricing_type, true))} · ${h(trace.input_unit)} → cm</small></summary>
            <div><strong>${h(trace.formula_source)}</strong>${item.price_effective_date ? `<span>價格生效日 ${h(item.price_effective_date)}</span>` : ""}<span>${h(opt.hint)}</span></div>
          </details>
        </section>

        <section class="drawer-section">
          <div class="drawer-section-head"><div><span class="drawer-step">02</span><h3>品項與計價摘要</h3></div><span class="badge">${h(pricingLabel(item.pricing_type, true))}</span></div>
          <div class="form-grid cols-4 drawer-summary-grid">
          ${drawerInput("品名", "name", item.name, "必填", "text", "span-2")}
          ${drawerInput("顯示單位", "unit", item.unit, "", "text")}
          ${drawerReadonly("計價方式", pricingLabel(item.pricing_type, true), "由材料主檔決定")}
          </div>
          ${(item.pricing_type === "wood_tsai" || item.pricing_type === "wood_board_tsai" || opt.needsWall) ? `<div class="drawer-formula-note"><strong>計算摘要</strong><span>${h(compactFormulaHint(item.pricing_type, opt.hint))}</span></div>` : ""}
        </section>

        <section class="drawer-section">
          <div class="drawer-section-head"><div><span class="drawer-step">03</span><h3>規格與數量</h3></div>${isCustom ? `<span class="badge amber">手動規格</span>` : `<span class="badge blue">材料主檔規格</span>`}</div>
          ${isCustom ? `<div class="form-grid cols-4 drawer-spec-grid">
            ${drawerSelect("尺寸輸入單位", "dimension_unit", item.dimension_unit || "cm", [["mm", "mm"], ["cm", "cm"], ["m", "m"]])}
            ${drawerInput(`${dimLabel(item.pricing_type, "thickness")} (${item.dimension_unit || "cm"})`, "thickness", item.thickness, "", "number")}
            ${drawerInput(`${dimLabel(item.pricing_type, "width")} (${item.dimension_unit || "cm"})`, "width", item.width, "", "number")}
            ${drawerInput(`${dimLabel(item.pricing_type, "length")} (${item.dimension_unit || "cm"})`, "length", item.length, "", "number")}
            ${drawerInput("重量 (kg)", "weight", item.weight, "", "number")}
            ${drawerInput("數量 (每單位)", "quantity", item.quantity, "", "number")}
            ${opt.needsWall ? excelMode ? `${drawerReadonly("原 Excel 固定常數", "2", "不可改寫")}${drawerReadonly("重量換算係數", "0.02466", "固定常數")}` : `${drawerInput("壁厚 (mm)", "wall_thickness_mm", item.wall_thickness_mm, "例 2", "number")}${drawerReadonly("重量換算係數", item.density_factor || 0.02466, "公式保護欄位")}` : ""}
          </div>` : `${renderCatalogSpecificationControls(item, edit)}<div class="form-grid cols-4 drawer-length-grid">
            ${drawerInput(`${dimLabel(item.pricing_type, "length")} (${item.dimension_unit || "cm"})`, "length", item.length, "", "number")}
            ${drawerInput("數量 (每單位)", "quantity", item.quantity, "", "number")}
            ${opt.needsWall ? excelMode ? `${drawerReadonly("原 Excel 固定常數", "2", "不可改寫")}${drawerReadonly("重量換算係數", "0.02466", "固定常數")}` : `${drawerInput("壁厚 (mm)", "wall_thickness_mm", item.wall_thickness_mm, "例 2", "number")}${drawerReadonly("重量換算係數", item.density_factor || 0.02466, "公式保護欄位")}` : ""}
          </div>`}
          ${isCustom ? `<div class="form-grid cols-3 drawer-custom-gates">
            ${drawerInput("客製尺寸／規格*", "custom_dimensions_spec", item.custom_dimensions_spec, "例：厚 2 mm、折角 30 × 30 mm", "text")}
            ${drawerSelect("詳圖狀態*", "detail_drawing_status", item.detail_drawing_status || "pending", [["pending", "待補"], ["yes", "已附詳圖"], ["no", "不需要詳圖"]])}
            ${drawerSelect("表面處理狀態*", "surface_treatment_status", item.surface_treatment_status || "pending", [["pending", "待補"], ["yes", "有／已確認"], ["no", "無／已確認"]])}
          </div>` : ""}
        </section>

        <section class="drawer-section">
          <div class="drawer-section-head"><div><span class="drawer-step">04</span><h3>價格與成本</h3></div>${item.cost_price_status === "verified" ? `<span class="badge green">成本已核准</span>` : `<span class="badge amber">成本未核准</span>`}</div>
          <div class="form-grid cols-4 drawer-price-grid">
            ${drawerReadonly("標準／預算價", item.standard_budget_unit_price === "" ? "未建立" : money(item.standard_budget_unit_price), `${item.standard_budget_source || ""}${item.standard_budget_version ? ` · ${item.standard_budget_version}` : ""}`)}
            ${drawerReadonly("折數後目錄售價", item.catalog_sale_unit_price === "" ? "未建立" : money(item.catalog_sale_unit_price), `${item.catalog_sale_price_source || ""}${item.catalog_discount_factor !== "" && item.catalog_discount_factor != null ? ` · 折數 ${h(item.catalog_discount_factor)}` : ""}`)}
            ${drawerReadonly("案件採用單價預設", money(item.default_actual_unit_price ?? item.unit_price), item.price_source || "材料主檔")}
            ${canPrice ? drawerInput(opt.needsWall ? "本案實際單價 (元/kg)" : "本案實際單價", "actual_unit_price", item.actual_unit_price ?? item.unit_price, "", "number") : drawerReadonly("本案實際單價", money(item.actual_unit_price ?? item.unit_price), "目前角色不可修改")}
            ${canPrice ? drawerInput("單價覆寫理由", "price_override_reason", item.price_override_reason, item.price_is_override ? "覆寫時必填" : "", "text", "span-2") : drawerReadonly("單價覆寫理由", item.price_override_reason || "未覆寫", "")}
            ${canPrice ? drawerReadonly("已確認成本", item.cost_price_status === "verified" ? money(item.cost_price) : "未驗證", item.cost_price_status === "verified" ? "納入成本分析" : "預算價不視為成本") : ""}
          </div>
        </section>

        <details class="drawer-section drawer-advanced" open>
          <summary><span><span class="drawer-step">05</span><strong>報價選項與進階設定</strong></span><small>損耗、工錢、備料與備註</small></summary>
          <div class="drawer-advanced-body">
            <div class="form-grid cols-4">
              ${canPrice ? drawerInput("報價損耗加成 %", "waste_pct", item.waste_pct, "", "number") : drawerReadonly("報價損耗加成 %", item.waste_pct || 0, "")}
              ${excelMode ? drawerReadonly("工資基準", "由工項才數合計", "材料列不重複加計") : canPrice ? drawerInput("工錢單價", "labor_unit_price", item.labor_unit_price, "", "number") : drawerReadonly("工錢單價", money(item.labor_unit_price), "")}
              ${excelMode ? "" : canPrice ? drawerInput("工錢損耗加成 %", "labor_waste_pct", item.labor_waste_pct, "", "number") : drawerReadonly("工錢損耗加成 %", item.labor_waste_pct === "" ? "同材料" : item.labor_waste_pct, "")}
              ${excelMode ? drawerInput("拆料人工加量", "breakdown_adjustment_qty", item.breakdown_adjustment_qty ?? 0, "", "number") : ""}
              ${excelMode ? drawerInput("人工加量理由", "breakdown_adjustment_reason", item.breakdown_adjustment_reason || "", Number(item.breakdown_adjustment_qty || 0) !== 0 ? "有加量時必填" : "", "text", "span-2") : ""}
            </div>
            <div class="drawer-option-row">
              ${drawerCheckbox("列入客戶報價", "is_chargeable", item.is_chargeable !== false, !canPrice, "關閉後售價為 0")}
              ${excelMode ? "" : drawerCheckbox("備料必需", "is_required_for_preparation", item.is_required_for_preparation !== false, false, "與是否計價分開")}
            </div>
            <div class="field drawer-notes"><label>備註</label><input class="input" data-item-field="notes" value="${h(item.notes)}" oninput="updateItemField(this)" onchange="updateItemField(this,true)" placeholder="選填"></div>
            <div class="drawer-alert is-warning">${excelMode ? "拆料量僅供報價追溯，不是庫存、備料或施工指令。" : "報價損耗不是實體庫存或裁切配置；備料仍須另行檢核。"}</div>
          </div>
        </details>

        <section class="drawer-section drawer-calculation">
          <div class="drawer-section-head"><div><span class="drawer-step">06</span><h3>即時計算</h3></div></div>
          <div class="calc-box drawer-calc-box">
            ${computed.ok ? `${calcLine("標準化尺寸", `${trace.dimensions_cm.thickness || "—"} × ${trace.dimensions_cm.width || "—"} × ${trace.dimensions_cm.length || "—"} cm`)}${calcLine("計價量", `${computed.priceableQty.toFixed(3)} ${item.unit}${computed.wasteQty ? ` (+${computed.wasteQty.toFixed(3)})` : ""}`)}${excelMode ? calcLine("報價拆料量", `${computed.breakdownTotalQty} ${h(item.unit)}`) : ""}${calcLine("材料", item.is_chargeable === false ? "不另計" : money(computed.materialSubtotal))}${calcLine("工錢", excelMode ? "由工項才數分解" : item.is_chargeable === false ? "不另計" : computed.laborSubtotal ? money(computed.laborSubtotal) : "—")}${calcLine("小計", money(computed.subtotal))}` : `<div class="drawer-alert is-warning">${h(computed.message)}</div>`}
          </div>
        </section>
      </div>
      <div class="drawer-foot"><button class="btn danger" type="button" onclick="removeQuoteItem(${edit.sectionIndex},${edit.itemIndex})">刪除此項</button><button class="btn" type="button" data-material-drawer-action="complete" onclick="completeMaterialDrawer()">完成</button></div>
    </aside>`;
}

function compactFormulaHint(pricingType, fallback) {
  const hints = {
    wood_tsai: "厚 × 寬 × 長 ÷ 板才基數",
    wood_board_tsai: "厚 × 寬 × 長 ÷ 板才基數",
    steel_rect_tube: "外徑、壁厚與長度換算重量",
    steel_round_tube: "直徑、壁厚與長度換算重量",
  };
  return hints[pricingType] || fallback || "依材料主檔公式計算";
}

function quoteSpecificationPositive(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function quoteMaterialSpecificationView(item) {
  const materialId = String(item.material_id || "");
  const list = window.MaterialSpecifications?.listSpecifications(materialId) || { ok: false, code: "MATERIAL_SPEC_INVALID_STATE", error: "材料規格尚未載入" };
  const thicknessResult = window.MaterialSpecifications?.listThicknessOptions(materialId) || list;
  const currentThickness = quoteSpecificationPositive(item.thickness) ? Number(item.thickness) : null;
  const currentWidth = quoteSpecificationPositive(item.width) ? Number(item.width) : null;
  const currentWeight = quoteSpecificationPositive(item.weight) ? Number(item.weight) : null;
  const hasCurrent = currentThickness != null && currentWidth != null && currentWeight != null;
  const pair = hasCurrent ? window.MaterialSpecifications?.getWeight(materialId, currentThickness, currentWidth) : null;
  const snapshot = item.material_specification_snapshot;
  const masterMatches = Boolean(snapshot && pair?.ok
    && String(snapshot.specification_id || "") === String(pair.specification?.id || "")
    && Number(snapshot.thickness) === currentThickness
    && Number(snapshot.width) === currentWidth
    && Number(snapshot.weight) === currentWeight
    && Number(pair.value) === currentWeight);
  const legacyRetained = Boolean(hasCurrent && !masterMatches);
  const thicknessOptions = thicknessResult?.ok ? thicknessResult.value.slice() : [];
  if (legacyRetained && !thicknessOptions.some((value) => Number(value) === currentThickness)) thicknessOptions.push(currentThickness);
  thicknessOptions.sort((left, right) => Number(left) - Number(right));
  const widthResult = currentThickness != null ? window.MaterialSpecifications?.listWidthOptions(materialId, currentThickness) : null;
  const widthOptions = widthResult?.ok ? widthResult.value.slice() : [];
  if (legacyRetained && !widthOptions.some((value) => Number(value) === currentWidth)) widthOptions.push(currentWidth);
  widthOptions.sort((left, right) => Number(left) - Number(right));
  return {
    list,
    thicknessOptions,
    widthOptions,
    currentThickness,
    currentWidth,
    currentWeight,
    masterMatches,
    legacyRetained,
    status: masterMatches ? "權威規格" : legacyRetained ? "舊規格（保留）" : "待選擇",
  };
}

function renderCatalogSpecificationControls(item, edit) {
  const view = quoteMaterialSpecificationView(item);
  const unit = item.dimension_unit || "cm";
  const pending = ui.quoteSpecificationDraftSelections?.[item.line_id] || null;
  const selectedThickness = pending && quoteSpecificationPositive(pending.thickness) ? Number(pending.thickness) : view.currentThickness;
  const selectedWidth = pending && quoteSpecificationPositive(pending.width) ? Number(pending.width) : pending ? null : view.currentWidth;
  const pendingWidths = selectedThickness != null ? window.MaterialSpecifications?.listWidthOptions(item.material_id, selectedThickness) : null;
  const visibleWidths = pending ? (pendingWidths?.ok ? pendingWidths.value.slice() : []) : view.widthOptions.slice();
  if (!pending && view.legacyRetained && !visibleWidths.some((value) => Number(value) === view.currentWidth)) visibleWidths.push(view.currentWidth);
  visibleWidths.sort((left, right) => Number(left) - Number(right));
  const noSpecifications = view.list?.ok && view.list.value.length === 0;
  const error = !view.list?.ok
    ? view.list.error || "材料規格無法讀取"
    : noSpecifications && !view.legacyRetained
      ? "材料主檔尚未建立厚寬重量規格"
      : "";
  const thicknessOptions = view.thicknessOptions.map((value) => `<option value="${h(value)}" ${Number(value) === selectedThickness ? "selected" : ""}>${h(value)}${view.legacyRetained && !pending && Number(value) === view.currentThickness && !view.list.value.some((specification) => Number(specification.thickness) === Number(value)) ? "（舊）" : ""}</option>`).join("");
  const widthOptions = visibleWidths.map((value) => `<option value="${h(value)}" ${Number(value) === selectedWidth ? "selected" : ""}>${h(value)}${view.legacyRetained && !pending && Number(value) === view.currentWidth && !view.list.value.some((specification) => Number(specification.thickness) === view.currentThickness && Number(specification.width) === Number(value)) ? "（舊）" : ""}</option>`).join("");
  return `<div class="quote-spec-controls" data-quote-spec-controls data-material-id="${h(item.material_id)}" data-line-id="${h(item.line_id)}" data-section-index="${edit.sectionIndex}" data-item-index="${edit.itemIndex}" data-legacy-retained="${view.legacyRetained && !pending ? "true" : "false"}" data-pending-selection="${pending ? "true" : "false"}">
    <div class="field"><label>尺寸單位</label><div class="drawer-static-value"><strong>${h(unit)}</strong><small>沿用材料主檔</small></div></div>
    <div class="field"><label>厚度 (${h(unit)})</label><select class="select" data-quote-spec-thickness onchange="changeQuoteSpecificationThickness(this)"><option value="">請選擇厚度</option>${thicknessOptions}</select></div>
    <div class="field"><label>寬度 (${h(unit)})</label><select class="select" data-quote-spec-width onchange="changeQuoteSpecificationWidth(this)" ${selectedThickness == null || !visibleWidths.length ? "disabled" : ""}><option value="">${selectedThickness == null ? "請先選厚度" : "請選擇寬度"}</option>${widthOptions}</select></div>
    <div class="field"><label>此規格重量</label><div class="quote-spec-weight ${view.legacyRetained && !pending ? "is-legacy" : ""}" data-quote-spec-weight><strong>${pending ? "待選寬度" : view.currentWeight != null ? `${h(view.currentWeight)} kg` : "尚未選擇"}</strong><small>${pending ? "選定完整組合後自動帶入" : h(view.status)}</small></div></div>
    <div class="quote-spec-error ${error ? "is-visible" : ""}" data-quote-spec-error data-code="${h(view.list?.code || "")}">${h(error)}</div>
  </div>`;
}

function drawerInput(label, fieldName, value, hint = "", type = "text", cls = "") {
  return `<div class="field ${cls}"><label>${h(label)}</label><input class="input" type="${type}" step="0.001" data-item-field="${fieldName}" value="${h(value)}" oninput="updateItemField(this)" onchange="updateItemField(this,true)" placeholder="${h(hint)}">${hint && type !== "number" ? `<small>${h(hint)}</small>` : ""}</div>`;
}

function drawerReadonly(label, value, hint = "") {
  return `<div class="field"><label>${h(label)}</label><input class="input" value="${h(value)}" readonly aria-readonly="true">${hint ? `<small>${h(hint)}</small>` : ""}</div>`;
}

function drawerSelect(label, fieldName, value, options) {
  return `<div class="field"><label>${h(label)}</label><select class="select" data-item-field="${h(fieldName)}" onchange="updateItemField(this,true)">${options.map(([optionValue, optionLabel]) => `<option value="${h(optionValue)}" ${value === optionValue ? "selected" : ""}>${h(optionLabel)}</option>`).join("")}</select></div>`;
}

function drawerCheckbox(label, fieldName, checked, disabled, hint = "") {
  return `<div class="field"><label class="checkbox-row"><input type="checkbox" data-item-field="${h(fieldName)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} onchange="updateItemField(this,true)">${h(label)}</label>${hint ? `<small>${h(hint)}</small>` : ""}</div>`;
}
