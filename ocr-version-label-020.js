(function () {
  const VERSION = "036";
  const BASE_LABEL = "\u540d\u7247 OCR \u532f\u5165";
  const VERSION_LABEL = `${BASE_LABEL}-(\u7576\u524d\u7248\u672c ${VERSION})`;
  let updateQueued = false;

  function labelTargets() {
    const targets = [];
    document.querySelectorAll("button, h2, [aria-label]").forEach((node) => {
      const text = (node.textContent || "").trim();
      const aria = (node.getAttribute && node.getAttribute("aria-label")) || "";
      if (text === BASE_LABEL || text.startsWith(`${BASE_LABEL}-(`) || aria === BASE_LABEL || aria.startsWith(`${BASE_LABEL}-(`)) {
        targets.push(node);
      }
    });
    return targets;
  }

  function updateLabels() {
    document.documentElement.dataset.ocrUiVersionLabel = VERSION;
    labelTargets().forEach((node) => {
      const canChangeText = node.matches && node.matches("button, h2");
      if (canChangeText && (node.textContent || "").trim().startsWith(BASE_LABEL) && node.textContent !== VERSION_LABEL) {
        node.textContent = VERSION_LABEL;
      }
      if (node.getAttribute && node.getAttribute("aria-label") && node.getAttribute("aria-label") !== VERSION_LABEL) {
        node.setAttribute("aria-label", VERSION_LABEL);
      }
    });
  }

  function queueUpdateLabels() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(() => {
      updateQueued = false;
      updateLabels();
    });
  }

  function install() {
    updateLabels();
    if (!window.__ocrVersionLabel020Timer) {
      window.__ocrVersionLabel020Timer = setInterval(updateLabels, 700);
    }
    if (!window.__ocrVersionLabel020Observer && window.MutationObserver) {
      window.__ocrVersionLabel020Observer = new MutationObserver(queueUpdateLabels);
      window.__ocrVersionLabel020Observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 300);
  setTimeout(install, 1200);
  setTimeout(install, 3000);
})();
