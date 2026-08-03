function render() {
  if (typeof cleanupBugReportObjectUrls === "function") cleanupBugReportObjectUrls();
  const app = document.getElementById("app");
  const r = route();
  const printRoute = r.parts[0] === "quotes" && r.parts[2] === "print";
  if (!isAuthed() && r.parts[0] !== "login") {
    go("/login");
    return;
  }
  if (isAuthed() && !currentUser()) {
    go("/login");
    return;
  }
  if (r.parts[0] === "login") {
    app.innerHTML = renderAuth();
    return;
  }
  if (printRoute) {
    app.innerHTML = renderPrintPage(r.parts[1], r.query.get("type") || "traditional");
    return;
  }
  app.innerHTML = renderShell(renderPage(r), r.path) + renderToast();
}

function renderAuth() {
  return `
    <main class="auth-page">
      <section class="auth-card">
        <h1>建材報價單系統-941025的001版</h1>
        <p>請登入帳號</p>
        <form onsubmit="numericLogin123(event)" autocomplete="on">
          <div class="field">
            <label>帳號</label>
            <input class="input" name="email" type="text" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="username" aria-label="帳號" required>
          </div>
          <div class="field" style="margin-top:14px">
            <label>密碼</label>
            <input class="input" name="password" type="password" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="current-password" aria-label="密碼" required>
          </div>
          <button class="btn" style="width:100%; margin-top:20px" type="submit">登入</button>
        </form>
      </section>
    </main>
    ${renderToast()}
  `;
}

function renderShell(content, path) {
  const account = currentUser() || defaultAccounts()[0];
  const nav = [
    ["/dashboard", "▦", "儀表板"],
    ["/materials", "□", "材料庫"],
    ["/customers", "◇", "客戶"],
    ["/quote-templates", "☰", "報價單版本"],
    ["/quotes", "≡", "報價單"],
    ["/approval-center", "✓", "審核中心"],
  ];
  if (canManageAccounts()) {
    nav.push(["/accounts", "◎", "帳號管理"]);
  }
  if (canEditCompanySettings()) {
    nav.push(["/settings/company", "⚙", "公司設定"]);
  }
  if (canViewWorkLogs()) {
    nav.push(["/work-logs", "日", "工作日誌"]);
  }
  const collapsed = ui.sidebarCollapsed ? "collapsed" : "";
  return `
    <div class="app-shell">
      <aside class="sidebar ${collapsed}">
        <div class="brand">
          <span class="brand-mark">報</span>
          ${ui.sidebarCollapsed ? "" : "<span>報價單系統-941025的001版</span>"}
          <button class="collapse-btn" title="收折側欄" onclick="toggleSidebar()">‹</button>
        </div>
        <nav class="nav">
          ${nav
            .map(([href, icon, label]) => {
              const active = path.startsWith(href) ? "active" : "";
              return `<a class="${active}" href="${link(href)}"><span class="nav-icon">${icon}</span>${ui.sidebarCollapsed ? "" : `<span>${label}</span>`}</a>`;
            })
            .join("")}
        </nav>
        <div class="account">
          ${
            ui.accountOpen
              ? `<div class="account-menu">
                  <a href="${link("/settings/profile")}">個人設定</a>
                  <button type="button" data-bug-report-entry onclick="openBugReportPage()">Bug 回報</button>
                  ${canManageAccounts() ? `<button onclick="resetDemo()">重置示範資料</button>` : ""}
                  <button onclick="logout()">登出</button>
                </div>`
              : ""
          }
          <button class="account-btn" onclick="toggleAccount()" aria-expanded="${ui.accountOpen}">
            ${renderAvatar(account)}
            ${ui.sidebarCollapsed ? "" : `<span><span class="account-name">${h(account.name)}</span><br><span class="account-role">${h(accountRoleLabel(account.role))}</span></span>`}
          </button>
        </div>
      </aside>
      <main class="main">${renderFrontendReadOnlyBanner()}${content}</main>
    </div>
  `;
}

function renderPage(r) {
  const [first, second, third] = r.parts;
  if (first === "dashboard") return renderDashboard();
  if (first === "materials") {
    if (second === "new") return canEditMaterialPrices() ? renderMaterialForm(null) : renderAccessDenied();
    if (second) return canEditMaterialPrices() ? renderMaterialForm(second) : renderAccessDenied();
    return renderMaterials();
  }
  if (first === "customers") {
    if (second === "new") return canUseFrontendWrite() ? renderCustomerForm(null) : renderReadonlyRouteDenied("新增客戶需要寫入權限");
    if (second) return canUseFrontendWrite() ? renderCustomerForm(second) : renderReadonlyRouteDenied("編輯客戶需要寫入權限");
    return renderCustomers();
  }
  if (first === "quote-templates") {
    if (second === "new") return canEditQuoteTemplates() ? renderTemplateForm(null) : renderAccessDenied();
    if (second) return canEditQuoteTemplates() ? renderTemplateForm(second) : renderAccessDenied();
    return renderTemplates();
  }
  if (first === "quotes") {
    if (second === "new") return canUseFrontendWrite() ? renderQuoteForm(null) : renderReadonlyRouteDenied("新增報價單需要寫入權限");
    if (third === "edit") return canUseFrontendWrite() ? renderQuoteForm(second) : renderReadonlyRouteDenied("編輯報價單需要寫入權限");
    if (second) return renderQuoteDetail(second);
    return renderQuotes(r.query);
  }
  if (first === "approval-center") return renderApprovalCenter();
  if (first === "bug-reports") return renderBugReports();
  if (first === "accounts") return canManageAccounts() ? renderAccounts() : renderAccessDenied();
  if (first === "work-logs") return canViewWorkLogs() ? renderWorkLogs(r.query) : renderAccessDenied();
  if (first === "settings") {
    if (second === "company") return canEditCompanySettings() ? renderSettings() : renderAccessDenied();
    return renderPersonalSettings();
  }
  return renderDashboard();
}

function pageHead(title, subtitle, action = "") {
  return `<div class="page-head"><div><h1>${h(title)}</h1>${subtitle ? `<p>${h(subtitle)}</p>` : ""}</div>${action}</div>`;
}

function renderDashboard() {
  const today = dateToday();
  const nowMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);
  const quotes = state.quotes;
  const computed = quotes.map((quote) => ({ quote, totals: quoteDocumentContext(quote).totals }));
  const monthQuotes = computed.filter(({ quote }) => quote.quote_date.startsWith(nowMonth));
  const wonMonth = monthQuotes.filter(({ quote }) => quote.status === "won");
  const inProgress = monthQuotes.filter(({ quote }) => ["draft", "pending_approval", "sent"].includes(quote.status));
  const yearQuotes = computed.filter(({ quote }) => quote.quote_date.startsWith(currentYear));
  const pendingApproval = computed.filter(({ quote }) => quote.status === "pending_approval");
  const dueFollowUps = computed.filter(({ quote }) => quote.next_follow_up && quote.next_follow_up <= today && !["won", "lost", "expired"].includes(quote.status));
  const expiringSoonDate = MaterialsQuoteDomain.addCalendarDays(today, 7);
  const expiringSoon = computed.filter(({ quote }) => quote.status === "sent" && quote.valid_until && quote.valid_until >= today && quote.valid_until <= expiringSoonDate);
  const unreviewedCustomers = state.customers.filter((customer) => customer.review_status === "unreviewed");
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return computed.filter(({ quote }) => quote.quote_date.startsWith(`${currentYear}-${month}`) && quote.status === "won").reduce((sum, row) => sum + row.totals.total, 0);
  });
  const maxMonthly = Math.max(...monthly, 1);
  return `
    ${pageHead("儀表板", `歡迎回來，${currentUser()?.name || "使用者"}`)}
    <h2 style="font-size:18px;margin:0 0 12px">今日待辦</h2>
    <div class="grid cards-4 dashboard-actions">
      ${dashboardAction("待主管核准", pendingApproval.length, "/quotes?status=pending_approval", pendingApproval.length ? "需要確認內容與價格" : "目前沒有待核准報價")}
      ${dashboardAction("到期追蹤", dueFollowUps.length, "/quotes", dueFollowUps.length ? "已到下次追蹤日" : "今日沒有逾期追蹤")}
      ${dashboardAction("即將到期", expiringSoon.length, "/quotes?status=sent", "未來 7 天內到期")}
      ${dashboardAction("未審核客戶", unreviewedCustomers.length, "/customers?customer_filter=unreviewed", "完成名片資料確認")}
    </div>
    <h2 style="font-size:18px;margin:0 0 12px">本月概況</h2>
    <div class="grid cards-4">
      ${metric("本月新成立", monthQuotes.length, "件", "0% vs 上月")}
      ${metric("本月成交", wonMonth.length, "件", "")}
      ${metric("本月成交額", money(wonMonth.reduce((sum, row) => sum + row.totals.total, 0)), "", "")}
      ${metric("本月進行中", inProgress.length, `預估 ${money(inProgress.reduce((sum, row) => sum + row.totals.total, 0))}`, "0% vs 上月")}
    </div>
    <div class="grid cards-2" style="margin-top:16px">
      <section class="card">
        <div class="card-header"><h2>${currentYear} 年逐月成交額</h2><span class="muted">累計 ${money(yearQuotes.filter((row) => row.quote.status === "won").reduce((sum, row) => sum + row.totals.total, 0))} (${yearQuotes.filter((row) => row.quote.status === "won").length} 件)</span></div>
        <div class="card-body"><div class="chart">${monthly.map((value, index) => `<div class="bar" style="height:${Math.max(4, (value / maxMonthly) * 190)}px"><span>${index + 1} 月</span></div>`).join("")}</div></div>
      </section>
      <section class="card">
        <div class="card-header"><h2>本月狀態分布</h2></div>
        <div class="card-body">
          <div style="display:grid;place-items:center;height:230px">
            <div style="width:150px;height:150px;border-radius:50%;border:28px solid #3b82f6;display:grid;place-items:center">
              <div style="text-align:center"><div class="metric-value" style="font-size:30px">${monthQuotes.length}</div><div class="muted">本月件數</div></div>
            </div>
          </div>
          <div class="row-card"><span>進行中</span><strong>${inProgress.length}</strong></div>
        </div>
      </section>
    </div>
    <div class="grid cards-2" style="margin-top:16px">
      <section class="card">
        <div class="card-header"><h2>${currentYear} 年累計</h2></div>
        <div class="card-body">
          ${calcLine("新成立", `${yearQuotes.length} 件`)}
          ${calcLine("成交", `${yearQuotes.filter((row) => row.quote.status === "won").length} 件`)}
          ${calcLine("成交額", money(yearQuotes.filter((row) => row.quote.status === "won").reduce((sum, row) => sum + row.totals.total, 0)))}
          ${calcLine("進行中", `${yearQuotes.filter((row) => ["draft", "pending_approval", "sent"].includes(row.quote.status)).length} 件`)}
          ${calcLine("進行中金額", money(yearQuotes.filter((row) => ["draft", "pending_approval", "sent"].includes(row.quote.status)).reduce((sum, row) => sum + row.totals.total, 0)))}
          ${calcLine("平均成交額", "—")}
        </div>
      </section>
      <section class="card">
        <div class="card-header"><h2>最近的報價單</h2><a class="btn outline sm" href="${link("/quotes")}">查看全部</a></div>
        <div class="card-body list-card">
          ${computed
            .slice()
            .sort((a, b) => b.quote.quote_date.localeCompare(a.quote.quote_date))
            .slice(0, 3)
            .map(({ quote, totals }) => {
              const customer = customerById(quote.customer_id);
              return `<a class="row-card" href="${link(`/quotes/${quote.id}`)}"><span><strong>${quote.quote_no}</strong><br><span class="muted">${h(customer?.company_name || "")}${quote.project_name ? ` · ${h(quote.project_name)}` : ""}</span></span><span><span class="badge">${QUOTE_STATUS_LABEL[quote.status]}</span> <span class="amount">${money(totals.total)}</span></span></a>`;
            })
            .join("")}
        </div>
      </section>
    </div>
    <section class="card" style="margin-top:16px">
      <div class="card-header"><h2>即將到期</h2><a class="btn outline sm" href="${link("/quotes?status=sent")}">查看已寄出</a></div>
      <div class="card-body list-card">${expiringSoon.length ? expiringSoon.map(({ quote, totals }) => `<a class="row-card" href="${link(`/quotes/${quote.id}`)}"><span><strong>${h(quote.quote_no)} · ${h(quoteRevisionLabel(quote))}</strong><br><span class="muted">有效期限 ${h(quote.valid_until)}</span></span><span class="amount">${money(totals.total)}</span></a>`).join("") : `<div class="empty">未來 7 天沒有即將到期的報價單</div>`}</div>
    </section>
  `;
}

function dashboardAction(label, count, path, note) {
  return `<a class="card dashboard-action" href="${link(path)}"><div class="card-body"><div class="metric-label">${h(label)}</div><div class="metric-value">${h(count)}</div><div class="metric-note">${h(note)}</div></div></a>`;
}

function metric(label, value, unit, note) {
  return `<section class="card"><div class="card-body"><div class="metric-label">${h(label)}</div><div class="metric-value">${h(value)}${unit && /^\D/.test(unit) ? "" : ""}</div>${unit ? `<div class="metric-note">${h(unit)}</div>` : ""}${note ? `<div class="metric-note">${h(note)}</div>` : ""}</div></section>`;
}

function calcLine(label, value) {
  return `<div class="calc-line"><span class="muted">${h(label)}</span><strong>${h(value)}</strong></div>`;
}

function renderMaterials() {
  const params = route().query;
  const canEdit = canEditMaterialPrices();
  const q = params.get("q") || "";
  const includeInactive = params.get("inactive") === "1";
  const selectedCategories = Array.from(new Set(params.getAll("category").filter(Boolean)));
  const priceBasisOptions = ["unit_price", "labor_unit_price"];
  const selectedPriceBases = Array.from(new Set(params.getAll("price_basis").filter((value) => priceBasisOptions.includes(value))));
  const minPrice = params.get("min_price") || "";
  const maxPrice = params.get("max_price") || "";
  const sort = ["asc", "desc"].includes(params.get("sort")) ? params.get("sort") : "";
  const min = minPrice === "" ? null : n(minPrice);
  const max = maxPrice === "" ? null : n(maxPrice);
  const activePriceBases = selectedPriceBases.length ? selectedPriceBases : priceBasisOptions;
  const rows = state.materials
    .filter((item) => {
    const text = [
      item.name,
      item.code,
      item.category,
      item.catalog_group,
      item.catalog_model,
      item.catalog_spec,
      item.catalog_application,
      item.catalog_marks,
      item.notes,
    ].filter(Boolean).join(" ").toLowerCase();
    const prices = materialComparablePrices(item, activePriceBases);
    const priceInRange = min == null && max == null ? true : prices.some((price) => (min == null || price >= min) && (max == null || price <= max));
    return (
      (includeInactive || item.is_active) &&
      text.includes(q.toLowerCase()) &&
      (!selectedCategories.length || selectedCategories.includes(item.category)) &&
      priceInRange
    );
  })
    .sort((a, b) => {
      if (!sort) return 0;
      const aPrice = materialSortPrice(a, selectedPriceBases, sort);
      const bPrice = materialSortPrice(b, selectedPriceBases, sort);
      if (aPrice == null && bPrice == null) return String(a.name).localeCompare(String(b.name), "zh-Hant");
      if (aPrice == null) return 1;
      if (bPrice == null) return -1;
      const diff = aPrice - bPrice;
      if (diff === 0) return String(a.name).localeCompare(String(b.name), "zh-Hant");
      return sort === "asc" ? diff : -diff;
    });
  const categoryResult = window.MaterialCategories?.listCategories?.();
  const categories = categoryResult?.ok ? categoryResult.value : [];
  return `
    ${pageHead("材料庫", `共 ${rows.length} 項材料`, canEdit ? `<a class="btn" href="${link("/materials/new")}">＋ 新增材料</a>` : "")}
    <form class="toolbar material-toolbar" onsubmit="searchMaterials(event)">
      <input class="input" style="max-width:320px" name="q" value="${h(q)}" placeholder="搜尋名稱、料號、分類…">
      ${renderMaterialFilterPopover({ categories, categoryError: categoryResult?.ok ? "" : categoryResult?.error || "材料分類目前無法讀取", canEdit, selectedCategories, selectedPriceBases, minPrice, maxPrice, sort, q, includeInactive })}
      <button class="btn secondary" type="submit">搜尋</button>
      <label class="checkbox-row toolbar-inactive-toggle"><input type="checkbox" name="inactive" ${includeInactive ? "checked" : ""}>含停用</label>
    </form>
    ${renderMaterialFilterChips({ selectedCategories, selectedPriceBases, minPrice, maxPrice, sort, q, includeInactive })}
    <div class="table-wrap">
      <table class="materials-table">
        <thead><tr><th>名稱</th><th>分類</th><th>計價 / 公式</th><th>成本 / 報價</th><th>材料毛利</th><th>工錢單價</th><th>損料</th><th>狀態</th></tr></thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (item) => `<tr>
                <td>${canEdit ? `<a class="link-strong" href="${link(`/materials/${item.id}`)}">${h(item.name)}</a>` : `<strong>${h(item.name)}</strong>`}${item.code ? `<div class="sub">#${h(item.code)}</div>` : ""}</td>
                <td>${h(item.category || "—")}</td>
                <td>${h(pricingLabel(item.pricing_type, true))}<div class="sub">${h(item.formula_version || "legacy-v1")} / ${h(item.unit)}</div></td>
                <td>${item.cost_price === "" || item.cost_price == null ? `<span class="muted">未建成本</span>` : money(item.cost_price)}<div class="sub">報價 ${money(item.unit_price)}</div></td>
                <td>${item.cost_price === "" || item.cost_price == null || !n(item.unit_price) ? "—" : `${(((n(item.unit_price) - n(item.cost_price)) / n(item.unit_price)) * 100).toFixed(1)}%`}</td>
                <td>${n(item.labor_unit_price) ? money(item.labor_unit_price) : "—"}</td>
                <td>${n(item.waste_pct) ? `${h(item.waste_pct)}%` : "—"}</td>
                <td>${statusBadge(item.is_active ? "啟用" : "停用", item.is_active ? "green" : "")}</td>
              </tr>`
                  )
                  .join("")
              : `<tr><td colspan="8"><div class="empty">沒有符合條件的材料</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
    ${renderMaterialCategoryDialog()}
  `;
}

function renderMaterialCategoryDialog() {
  if (!ui.materialCategoryDialogOpen) return "";
  const feedback = ui.materialCategoryFeedback;
  return `
    <div class="permission-backdrop material-category-backdrop" data-material-category-dialog onclick="closeMaterialCategoryDialog(event)">
      <form class="permission-modal material-category-dialog" aria-modal="true" role="dialog" aria-labelledby="material-category-dialog-title" onsubmit="submitMaterialCategory(event)" onclick="event.stopPropagation()">
        <div class="permission-head">
          <div>
            <h2 id="material-category-dialog-title">新增材料分類</h2>
          </div>
          <button class="icon-btn" type="button" aria-label="關閉" title="關閉" onclick="closeMaterialCategoryDialog(event)">×</button>
        </div>
        <div class="material-category-dialog-body">
          <label class="field">
            <span>分類名稱</span>
            <input class="input" name="category_name" value="${h(ui.materialCategoryDraft || "")}" maxlength="40" autocomplete="off" oninput="setMaterialCategoryDraft(event)" autofocus>
          </label>
          ${feedback ? `<div class="material-category-feedback is-error" role="status" data-material-category-feedback="${h(feedback.code || "MATERIAL_CATEGORY_INVALID_STATE")}">${h(feedback.message || "材料分類無法新增")}</div>` : ""}
        </div>
        <div class="material-category-dialog-actions">
          <button class="btn outline" type="button" onclick="closeMaterialCategoryDialog(event)">取消</button>
          <button class="btn" type="submit">新增分類</button>
        </div>
      </form>
    </div>`;
}

function renderMaterialFilterPopover(filters) {
  const { categories, categoryError, canEdit, selectedCategories, selectedPriceBases, minPrice, maxPrice, sort } = filters;
  const activeCount = materialFilterCount(filters);
  const selected = new Set(selectedCategories);
  const selectedBases = new Set(selectedPriceBases);
  return `
    <details class="filter-popover">
      <summary class="filter-trigger">
        <span>範圍搜尋</span>
        ${activeCount ? `<span class="filter-count">${activeCount}</span>` : ""}
      </summary>
      <div class="filter-panel">
        <div class="filter-section">
          <div class="filter-title">分類</div>
          <div class="filter-tags">
            ${
              categories.length
                ? categories
                    .map(
                      (category) => `<label class="filter-tag"><input class="visually-hidden" type="checkbox" name="category" value="${h(category.name)}" ${selected.has(category.name) ? "checked" : ""}><span>${h(category.name)}</span></label>`
                    )
                    .join("")
                : `<span class="muted">${h(categoryError || "尚無分類")}</span>`
            }
            ${canEdit ? `<button class="filter-tag-add" type="button" data-material-category-add onclick="openMaterialCategoryDialog(event)">＋ 新增分類</button>` : ""}
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-title">單價依據</div>
          <div class="filter-toggles">
            <label class="filter-toggle"><input class="visually-hidden" type="checkbox" name="price_basis" value="unit_price" ${selectedBases.has("unit_price") ? "checked" : ""}><span>材料單價</span></label>
            <label class="filter-toggle"><input class="visually-hidden" type="checkbox" name="price_basis" value="labor_unit_price" ${selectedBases.has("labor_unit_price") ? "checked" : ""}><span>工錢單價</span></label>
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-title">單價範圍</div>
          <div class="filter-price-grid">
            <input class="input" type="number" min="0" step="1" name="min_price" value="${h(minPrice)}" placeholder="最低">
            <input class="input" type="number" min="0" step="1" name="max_price" value="${h(maxPrice)}" placeholder="最高">
          </div>
        </div>
        <div class="filter-section">
          <div class="filter-title">排序</div>
          <select class="select" name="sort">
            <option value="" ${sort === "" ? "selected" : ""}>不排序</option>
            <option value="asc" ${sort === "asc" ? "selected" : ""}>單價從低到高</option>
            <option value="desc" ${sort === "desc" ? "selected" : ""}>單價從高到低</option>
          </select>
        </div>
        <div class="filter-actions">
          <a class="btn outline sm" href="${materialFilterClearHref(filters)}">清除</a>
          <button class="btn sm" type="submit">套用</button>
        </div>
      </div>
    </details>
  `;
}

function renderMaterialFilterChips(filters) {
  const { selectedCategories, selectedPriceBases, minPrice, maxPrice, sort } = filters;
  const chips = [];
  selectedCategories.forEach((category) => chips.push(`分類：${category}`));
  if (selectedPriceBases.includes("unit_price")) chips.push("依材料單價");
  if (selectedPriceBases.includes("labor_unit_price")) chips.push("依工錢單價");
  if (minPrice || maxPrice) chips.push(`單價：${minPrice || "不限"} - ${maxPrice || "不限"}`);
  if (sort === "asc") chips.push("單價低到高");
  if (sort === "desc") chips.push("單價高到低");
  if (!chips.length) return "";
  return `<div class="filter-chips">${chips.map((chip) => `<span class="filter-chip">${h(chip)}</span>`).join("")}<a class="filter-clear" href="${materialFilterClearHref(filters)}">清除範圍</a></div>`;
}

function materialFilterCount({ selectedCategories, selectedPriceBases, minPrice, maxPrice, sort }) {
  return selectedCategories.length + selectedPriceBases.length + (minPrice || maxPrice ? 1 : 0) + (sort ? 1 : 0);
}

function materialFilterClearHref({ q, includeInactive }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (includeInactive) params.set("inactive", "1");
  return link(`/materials${params.toString() ? `?${params}` : ""}`);
}

function materialComparablePrices(item, priceBases) {
  return priceBases
    .map((basis) => ({ basis, value: n(item[basis]) }))
    .filter(({ basis, value }) => basis !== "labor_unit_price" || value > 0)
    .map(({ value }) => value);
}

function materialSortPrice(item, selectedPriceBases, sort) {
  const prices = materialComparablePrices(item, selectedPriceBases.length ? selectedPriceBases : ["unit_price"]);
  if (!prices.length) return null;
  return selectedPriceBases.length > 1 && sort === "desc" ? Math.max(...prices) : Math.min(...prices);
}

function statusBadge(text, color = "") {
  return `<span class="badge ${color}">${h(text)}</span>`;
}

function renderAccessDenied() {
  return `
    ${pageHead("無法進入", "此頁面只開放管理人員")}
    <section class="card">
      <div class="card-body"><div class="empty">目前帳號沒有管理權限</div></div>
    </section>
  `;
}

function renderAccounts() {
  if (!canManageAccounts()) return renderAccessDenied();
  const accounts = loadAccounts();
  const actor = currentUser();
  const canBootstrapOwner = actor?.role === "admin" && activeOwnerCount(accounts) === 0;
  return `
    ${pageHead("帳號管理", `共 ${accounts.length} 個帳號`, `<button class="btn" type="button" onclick="startAccountDraft()">＋ 新增帳號</button>`)}
    ${canBootstrapOwner ? renderOwnerBootstrapPanel() : ""}
    ${ui.accountDraft ? renderAccountDraft(accounts, actor) : ""}
    <div class="account-list">
      ${accounts.map((account) => renderAccountEditor(account, accounts)).join("")}
    </div>
    ${renderAccountPermissionModal()}
    ${renderOwnerBootstrapDialog(accounts)}
  `;
}

function renderOwnerBootstrapPanel() {
  return `
    <section class="owner-bootstrap-panel" aria-labelledby="owner-bootstrap-title">
      <div>
        <span class="badge amber">尚未建立老闆</span>
        <h2 id="owner-bootstrap-title">建立首位老闆</h2>
        <p>請由目前管理人員主動選擇一個既有帳號。確認一次後，該帳號將取得最高本機權限。</p>
      </div>
      <button class="btn" type="button" data-owner-bootstrap-open onclick="openOwnerBootstrap()">選擇既有帳號</button>
    </section>
  `;
}

function renderAccountDraft(accounts = loadAccounts(), actor = currentUser()) {
  const canCreateAdditionalOwner = actor?.role === "owner" && activeOwnerCount(accounts) > 0;
  return `
    <form class="account-row-card account-row-new" onsubmit="createAccount(event)">
      <div class="field">
        <label>名稱</label>
        <input class="input" name="name" value="${h(ui.accountDraft.name)}" required>
      </div>
      <div class="field">
        <label>帳號</label>
        <input class="input" name="account" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" value="${h(ui.accountDraft.account)}" required>
      </div>
      <div class="field">
        <label>密碼</label>
        <input class="input" name="password" type="password" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="new-password" required>
        <small>建立後不會顯示原密碼</small>
      </div>
      <div class="field">
        <label>角色</label>
        <select class="select" name="role" data-account-role-select>
          ${renderRoleOptions(ui.accountDraft.role, { allowOwner: canCreateAdditionalOwner })}
        </select>
        <small>${canCreateAdditionalOwner ? "建立老闆帳號時會要求一次確認" : "首位老闆只能從既有帳號建立"}</small>
        <label class="checkbox-row" style="margin-top:8px"><input type="checkbox" name="is_active" value="1" checked> 啟用帳號</label>
      </div>
      <div class="account-actions">
        <button class="btn sm" type="submit">建立帳號</button>
        <button class="btn secondary sm" type="button" onclick="cancelAccountDraft()">取消</button>
      </div>
    </form>
  `;
}

function renderAccountEditor(account, accounts = loadAccounts()) {
  const actorRole = currentUser()?.role;
  const ownerProtected = account.role === "owner" && actorRole !== "owner";
  const lastActiveOwner = account.role === "owner" && account.is_active && activeOwnerCount(accounts) === 1;
  const roleLocked = ownerProtected || lastActiveOwner;
  const protectionText = ownerProtected
    ? "老闆帳號只能由老闆管理"
    : lastActiveOwner
      ? "最後一位啟用中的老闆不可停用、刪除或降權"
      : "";
  return `
    <form class="account-row-card ${ownerProtected ? "is-protected" : ""}" data-account-id="${h(account.id)}" onsubmit="saveAccount(event,'${h(account.id)}')">
      <div class="field">
        <label>名稱</label>
        <input class="input" name="name" value="${h(account.name)}" ${ownerProtected ? "disabled" : ""} required>
      </div>
      <div class="field">
        <label>帳號</label>
        <input class="input" name="account" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" value="${h(account.account)}" ${ownerProtected ? "disabled" : ""} required>
      </div>
      <div class="field">
        <label>重設密碼</label>
        <input class="input" name="password" type="password" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="new-password" placeholder="不變更請留空" ${ownerProtected ? "disabled" : ""}>
        <small>系統不會顯示目前密碼</small>
      </div>
      <div class="field">
        <label>角色</label>
        <select class="select" name="role" data-account-role-select ${roleLocked ? "disabled" : ""}>
          ${renderRoleOptions(account.role, { allowOwner: actorRole === "owner" })}
        </select>
        <label class="checkbox-row" style="margin-top:8px"><input type="checkbox" name="is_active" value="1" ${account.is_active ? "checked" : ""} ${ownerProtected || lastActiveOwner ? "disabled" : ""}> 啟用帳號</label>
      </div>
      <div class="account-actions">
        <button class="btn sm" type="submit" ${ownerProtected ? "disabled" : ""}>儲存變更</button>
        <button class="btn outline sm" type="button" onclick="openAccountPermissions('${h(account.id)}')" ${ownerProtected ? "disabled" : ""}>權限</button>
        <button class="btn danger sm" type="button" onclick="deleteAccount('${h(account.id)}')" ${ownerProtected || lastActiveOwner ? "disabled" : ""}>刪除</button>
      </div>
      ${protectionText ? `<div class="account-protection-note">${h(protectionText)}</div>` : ""}
    </form>
  `;
}

function renderRoleOptions(selectedRole, options = {}) {
  return Object.entries(ACCOUNT_ROLE_LABELS)
    .map(([value, label]) => {
      const ownerDisabled = value === "owner" && options.allowOwner !== true;
      return `<option value="${h(value)}" ${normalizeAccountRole(selectedRole) === value ? "selected" : ""} ${ownerDisabled ? "disabled" : ""}>${h(label)}</option>`;
    })
    .join("");
}

function renderOwnerBootstrapDialog(accounts) {
  if (!ui.ownerBootstrapOpen || currentUser()?.role !== "admin" || activeOwnerCount(accounts) > 0) return "";
  const candidates = accounts.filter((account) => account.role !== "owner" && account.is_active !== false);
  return `
    <div class="permission-backdrop" role="presentation">
      <section class="permission-modal owner-bootstrap-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-bootstrap-dialog-title">
        <div class="permission-head">
          <div>
            <span class="badge amber">一次性設定</span>
            <h2 id="owner-bootstrap-dialog-title">確認建立首位老闆</h2>
            <p>選定後此入口會消失；後續老闆異動只能由老闆管理。</p>
          </div>
          <button class="icon-btn" type="button" aria-label="關閉" onclick="closeOwnerBootstrap()">×</button>
        </div>
        <div class="owner-bootstrap-body">
          <div class="field">
            <label for="owner-bootstrap-account">既有帳號</label>
            <select class="select" id="owner-bootstrap-account">
              <option value="">請選擇帳號</option>
              ${candidates.map((account) => `<option value="${h(account.id)}">${h(account.name)} · ${h(account.account)} · ${h(accountRoleLabel(account.role))}</option>`).join("")}
            </select>
          </div>
          <div class="hint amber">這是可信設備上的本機最高權限，不等同伺服器身分驗證。</div>
        </div>
        <div class="owner-bootstrap-actions">
          <button class="btn secondary" type="button" data-owner-bootstrap-cancel onclick="closeOwnerBootstrap()">取消</button>
          <button class="btn" type="button" data-owner-bootstrap-confirm onclick="confirmOwnerBootstrap()">確認建立首位老闆</button>
        </div>
      </section>
    </div>
  `;
}

function renderAccountPermissionModal() {
  if (!ui.permissionAccountId) return "";
  const account = accountById(ui.permissionAccountId);
  if (!account) return "";
  return `
    <div class="permission-backdrop" onclick="closeAccountPermissions()" role="presentation">
      <section class="permission-modal" role="dialog" aria-modal="true" aria-label="${h(account.name)} 權限" onclick="event.stopPropagation()">
        <div class="permission-head">
          <div>
            <h2>${h(account.name)} 權限</h2>
            <p>${h(account.account)} · ${h(accountRoleLabel(account.role))}</p>
          </div>
          <button class="icon-btn" type="button" onclick="closeAccountPermissions()" aria-label="關閉">×</button>
        </div>
        <div class="permission-list">
          ${ACCOUNT_PERMISSION_GROUPS.map((group) => `
            <div class="permission-group">
              <h3>${h(group.title)}</h3>
              ${group.permissions.map((permission) => renderPermissionToggle(account, permission.key, permission.title, permission.description)).join("")}
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderPermissionToggle(account, key, title, description) {
  const ownerProtected = account.role === "owner" && currentUser()?.role !== "owner";
  const fixedContractor = account.role === "contractor";
  const enabled = fixedContractor ? false : hasAccountPermission(account, key);
  return `
    <div class="permission-row">
      <div>
        <h3>${h(title)}</h3>
        <p>${h(description)}</p>
      </div>
      <button
        class="permission-switch ${enabled ? "is-on" : ""}"
        type="button"
        role="switch"
        aria-checked="${enabled}"
        title="${h(accountPermissionLabel(key))}"
        onclick="toggleAccountPermission('${h(account.id)}','${h(key)}')"
        ${ownerProtected || fixedContractor ? "disabled" : ""}
      >
        <span></span>
      </button>
    </div>
  `;
}
