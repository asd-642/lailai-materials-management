const WORK_LOG_ACTION_LABELS = {
  login_success: "登入成功",
  login_failed: "登入失敗",
  logout: "登出",
  create: "新增",
  update: "修改",
  delete: "刪除",
  permission: "權限變更",
  status: "狀態變更",
  reset: "重置資料",
  settings: "公司設定",
  profile: "個人設定",
  password: "密碼變更",
  contact: "聯絡人",
  backup: "資料備份",
  restore: "資料還原",
};

const WORK_LOG_ENTITY_LABELS = {
  auth: "登入",
  accounts: "帳號",
  materials: "材料",
  customers: "客戶",
  contacts: "客戶聯絡人",
  templates: "報價範本",
  quotes: "報價單",
  settings: "設定",
  profile: "個人資料",
};

function canViewWorkLogs() {
  const role = window.FrontendAccess?.role?.() || "unknown";
  return role === "owner" || role === "admin";
}

function formatWorkLogTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function loadWorkLogs() {
  try {
    const saved = localStorage.getItem(WORK_LOGS_KEY);
    const logs = saved ? JSON.parse(saved) : [];
    return Array.isArray(logs) ? logs.map((entry) => window.AuthEventContract?.canonicalAuthEvent(entry) || entry) : [];
  } catch (error) {
    console.warn(error);
    return [];
  }
}

function saveWorkLogs(logs) {
  const normalized = logs.map((entry) => window.AuthEventContract?.canonicalAuthEvent(entry) || entry);
  localStorage.setItem(WORK_LOGS_KEY, JSON.stringify(normalized.slice(0, WORK_LOG_LIMIT)));
}

function workLogActor(account = currentUser()) {
  return {
    id: account?.id || "",
    name: account?.name || "未登入",
    account: account?.account || "",
    role: account?.role || "",
  };
}

function workLogEntityLabel(entityType) {
  return WORK_LOG_ENTITY_LABELS[entityType] || entityType || "資料";
}

function workLogActionLabel(action) {
  return WORK_LOG_ACTION_LABELS[action] || action || "操作";
}

function workLogRecordTitle(collection, record) {
  if (!record) return "";
  if (collection === "quotes") return record.quote_no || record.title || record.project_name || record.id || "";
  if (collection === "customers") return record.name || record.company_name || record.phone || record.id || "";
  if (collection === "materials") return record.name || record.code || record.id || "";
  if (collection === "templates") return record.name || record.description || record.id || "";
  if (collection === "accounts") return record.name || record.account || record.id || "";
  if (collection === "contacts") return record.name || record.phone || record.email || "";
  return record.name || record.title || record.id || "";
}

function logWorkEvent(action, summary, options = {}) {
  const now = new Date();
  const actor = workLogActor(options.actor);
  const entry = {
    id: id("log"),
    at: formatWorkLogTime(now),
    iso: now.toISOString(),
    action,
    actionLabel: options.actionLabel || workLogActionLabel(action),
    actorId: actor.id,
    actorName: actor.name,
    actorAccount: actor.account,
    actorRole: actor.role,
    entityType: options.entityType || "",
    entityLabel: options.entityLabel || workLogEntityLabel(options.entityType),
    entityId: options.entityId || "",
    entityName: options.entityName || "",
    summary: summary || "",
    detail: options.detail || "",
    outcome: options.outcome || "success",
  };
  const logs = loadWorkLogs();
  logs.unshift(entry);
  saveWorkLogs(logs);
  return entry;
}

function logRecordChange(collection, action, record, detail = "") {
  const title = workLogRecordTitle(collection, record);
  const entity = workLogEntityLabel(collection);
  const verb = workLogActionLabel(action);
  return logWorkEvent(action, `${verb}${entity}${title ? `：${title}` : ""}`, {
    entityType: collection,
    entityId: record?.id || "",
    entityName: title,
    detail,
  });
}

function changedFieldLabels(previous, next, fieldMap) {
  return fieldMap
    .filter(([key]) => String(previous?.[key] ?? "") !== String(next?.[key] ?? ""))
    .map(([, label]) => label);
}

function renderWorkLogs(query = new URLSearchParams()) {
  if (!canViewWorkLogs()) return renderAccessDenied();
  const q = String(query.get("q") || "").trim().toLowerCase();
  const action = query.get("action") || "";
  const logs = loadWorkLogs();
  const filtered = logs.filter((entry) => {
    const text = [
      entry.at,
      entry.actorName,
      entry.actorAccount,
      entry.actionLabel,
      entry.entityLabel,
      entry.entityName,
      entry.summary,
      entry.detail,
      entry.outcome,
    ].join(" ").toLowerCase();
    return (!action || entry.action === action) && (!q || text.includes(q));
  });
  const loginCount = logs.filter((entry) => entry.action === "login_success").length;
  const createCount = logs.filter((entry) => entry.action === "create").length;
  const deleteCount = logs.filter((entry) => entry.action === "delete").length;
  const failCount = logs.filter((entry) => entry.outcome === "failed").length;
  const actions = Array.from(new Set(logs.map((entry) => entry.action).filter(Boolean)));
  return `
    ${pageHead("工作日誌", `只顯示到年、月、日、小時、分鐘；目前保留最新 ${WORK_LOG_LIMIT} 筆。`)}
    <div class="grid cards-4 work-log-metrics">
      ${metric("登入紀錄", loginCount, "筆", "")}
      ${metric("新增紀錄", createCount, "筆", "")}
      ${metric("刪除紀錄", deleteCount, "筆", "")}
      ${metric("失敗/阻擋", failCount, "筆", "")}
    </div>
    <form class="toolbar work-log-toolbar" onsubmit="searchWorkLogs(event)">
      <input class="input" style="max-width:320px" name="q" value="${h(query.get("q") || "")}" placeholder="搜尋人員、帳號、動作或內容">
      <select class="select" style="max-width:190px" name="action">
        <option value="">全部動作</option>
        ${actions.map((item) => `<option value="${h(item)}" ${action === item ? "selected" : ""}>${h(workLogActionLabel(item))}</option>`).join("")}
      </select>
      <button class="btn secondary" type="submit">搜尋</button>
      <a class="btn outline" href="${link("/work-logs")}">清除篩選</a>
    </form>
    <div class="table-wrap work-log-table">
      <table>
        <thead>
          <tr><th>時間</th><th>人員 / 帳號</th><th>動作</th><th>對象</th><th>內容</th><th>結果</th></tr>
        </thead>
        <tbody>
          ${
            filtered.length
              ? filtered.map(renderWorkLogRow).join("")
              : `<tr><td colspan="6"><div class="empty">目前沒有符合條件的工作日誌</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderWorkLogRow(entry) {
  const outcomeClass = entry.outcome === "failed" ? "danger" : entry.outcome === "blocked" ? "blue" : "green";
  const role = entry.actorRole ? ` · ${h(accountRoleLabel(entry.actorRole))}` : "";
  return `<tr>
    <td><strong>${h(entry.at || "")}</strong></td>
    <td>${h(entry.actorName || "未登入")}<div class="sub">${h(entry.actorAccount || "未提供帳號")}${role}</div></td>
    <td>${statusBadge(entry.actionLabel || workLogActionLabel(entry.action), entry.outcome === "failed" ? "" : "blue")}</td>
    <td>${h(entry.entityLabel || workLogEntityLabel(entry.entityType))}<div class="sub">${h(entry.entityName || "")}</div></td>
    <td><span class="work-log-summary">${h(entry.summary || "")}</span>${entry.detail ? `<div class="sub work-log-detail">${h(entry.detail)}</div>` : ""}</td>
    <td>${statusBadge(entry.outcome === "failed" ? "失敗" : entry.outcome === "blocked" ? "已阻擋" : "成功", outcomeClass)}</td>
  </tr>`;
}

window.searchWorkLogs = function (event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const params = new URLSearchParams();
  const q = String(form.get("q") || "").trim();
  const action = String(form.get("action") || "").trim();
  if (q) params.set("q", q);
  if (action) params.set("action", action);
  go(`/work-logs${params.toString() ? `?${params}` : ""}`);
};
