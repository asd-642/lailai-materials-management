(function () {
  const THEME_KEY = "materials_quote_theme";

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
    } catch (error) {
      return "dark";
    }
  }

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function updateThemeButtons(theme) {
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      button.setAttribute("title", theme === "dark" ? "目前暗色，點擊切換亮色" : "目前亮色，點擊切換暗色");
      const text = button.querySelector(".theme-toggle-text");
      if (text) text.textContent = theme === "dark" ? "暗色" : "亮色";
    });
  }

  function applyTheme(theme, save = true) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    if (save) {
      try {
        localStorage.setItem(THEME_KEY, nextTheme);
      } catch (error) {
        // Ignore storage failures; the visual toggle still works for this page.
      }
    }
    updateThemeButtons(nextTheme);
  }

  function renderThemeToggle() {
    const theme = currentTheme();
    return `<button class="theme-toggle" type="button" onclick="toggleTheme()" aria-pressed="${theme === "dark"}" title="${theme === "dark" ? "目前暗色，點擊切換亮色" : "目前亮色，點擊切換暗色"}">
      <span class="theme-toggle-track" aria-hidden="true"><span class="theme-toggle-knob"></span></span>
      <span class="theme-toggle-text">${theme === "dark" ? "暗色" : "亮色"}</span>
    </button>`;
  }

  window.toggleTheme = function () {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  };

  window.setThemeMode = function (theme) {
    applyTheme(theme);
  };

  applyTheme(document.documentElement.dataset.theme || storedTheme(), false);

  if (typeof renderAuth === "function") {
    const baseRenderAuthTheme = renderAuth;
    renderAuth = function () {
      return baseRenderAuthTheme().replace('<section class="auth-card">', `<section class="auth-card"><div class="auth-tools">${renderThemeToggle()}</div>`);
    };
  }

  if (typeof renderShell === "function") {
    const baseRenderShellTheme = renderShell;
    renderShell = function (content, path) {
      return baseRenderShellTheme(content, path).replace('<div class="account">', `<div class="theme-slot">${renderThemeToggle()}</div><div class="account">`);
    };
  }

  document.addEventListener("DOMContentLoaded", () => updateThemeButtons(currentTheme()));
})();
