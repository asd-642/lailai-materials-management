window.renderAuth = function () {
  return `
    <main class="auth-page">
      <section class="auth-card">
        <h1>來來建材報價與材料管理系統</h1>
        <p>請登入帳號</p>
        <form onsubmit="numericLogin123(event)" autocomplete="on">
          <div class="field">
            <label>帳號</label>
            <input class="input" name="email" type="text" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="username" aria-label="帳號" oninput="this.value=onlyDigits123(this.value)" required>
          </div>
          <div class="field" style="margin-top:14px">
            <label>密碼</label>
            <input class="input" name="password" type="password" inputmode="numeric" pattern="[0-9]{3,20}" maxlength="20" autocomplete="current-password" aria-label="密碼" oninput="this.value=onlyDigits123(this.value)" required>
          </div>
          <button class="btn" style="width:100%; margin-top:20px" type="submit">登入</button>
        </form>
      </section>
    </main>
    ${renderToast()}
  `;
};

document.title = "來來建材報價與材料管理系統";

function onlyDigits123(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeAuthForm123(event) {
  event.preventDefault();
  const account = event.currentTarget.elements.email;
  const password = event.currentTarget.elements.password;
  account.value = onlyDigits123(account.value);
  password.value = onlyDigits123(password.value);
  if (!MaterialsQuoteDomain.isNumericCredential(account.value) || !MaterialsQuoteDomain.isNumericCredential(password.value)) {
    setToast("帳號和密碼需為 3 至 20 位數字");
    return false;
  }
  return true;
}

window.numericLogin123 = function (event) {
  if (normalizeAuthForm123(event)) window.login(event);
};

window.numericRegister123 = function (event) {
  if (normalizeAuthForm123(event)) window.register(event);
};
