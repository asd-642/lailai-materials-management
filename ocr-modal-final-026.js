(function () {
  const VERSION = "026";
  const MODAL_ID = "customer-card-ocr-final-modal-026";
  const OLD_MODAL_ID = "customer-card-ocr-modal";
  const BASE_LABEL = "\u540d\u7247 OCR \u532f\u5165";
  const VERSION_LABEL = `${BASE_LABEL}-(\u7576\u524d\u7248\u672c ${VERSION})`;

  const text = {
    close: "\u95dc\u9589",
    drop: "\u62d6\u5165\u540d\u7247\u7167\u7247",
    preview: "\u540d\u7247\u9810\u89bd",
    run: "\u958b\u59cb\u8fa8\u8b58",
    sample: "\u7bc4\u4f8b\u6e2c\u8a66",
    clearDraft: "\u6e05\u9664\u66ab\u5b58\u7167\u7247",
    status: "\u9078\u64c7\u5716\u7247\u5f8c\u958b\u59cb\u8fa8\u8b58\u3002",
    raw: "\u8fa8\u8b58\u6587\u5b57",
    placeholder: "\u53ef\u624b\u52d5\u4fee\u6b63\u6587\u5b57\u5f8c\u518d\u6574\u7406\u586b\u5165",
    apply: "\u6574\u7406\u4e26\u586b\u5165\u8868\u55ae"
  };

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.remove();
    document.body.classList.remove("ocr-modal-open");
  }
  window.closeCustomerCardOcrModal = closeModal;

  function removeOldModal() {
    const oldModal = document.getElementById(OLD_MODAL_ID);
    if (oldModal) oldModal.remove();
  }

  function recognizeCurrentFile() {
    if (typeof window.recognizeSelectedCustomerCard === "function") {
      window.recognizeSelectedCustomerCard();
    }
  }

  function canUseOcr() {
    return typeof window.canUseCustomerOcr !== "function" || window.canUseCustomerOcr();
  }

  function guardOcrAccess() {
    if (canUseOcr()) return true;
    if (typeof window.setToast === "function") window.setToast("\u76ee\u524d\u5e33\u865f\u6c92\u6709\u4f7f\u7528 OCR \u532f\u5165\u5ba2\u6236\u7684\u6b0a\u9650");
    return false;
  }

  function openFinalModal() {
    if (!guardOcrAccess()) return;
    removeOldModal();
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.dataset.ocrModalRepair = VERSION;
    modal.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(2,6,23,.66);padding:18px;box-sizing:border-box;";

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ocr-final-title-026");
    dialog.style.cssText = "width:min(920px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;background:#fff;color:#111827;border:1px solid #d7dde7;border-radius:10px;box-shadow:0 24px 80px rgba(0,0,0,.38);box-sizing:border-box;";

    const bodyGrid = window.matchMedia("(max-width:760px)").matches
      ? "display:grid;grid-template-columns:1fr;gap:16px;padding:16px;box-sizing:border-box;"
      : "display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.85fr);gap:18px;padding:20px;box-sizing:border-box;";

    dialog.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-bottom:1px solid #e5e7eb;box-sizing:border-box;">
        <h2 id="ocr-final-title-026" style="margin:0;font-size:20px;line-height:1.25;color:#111827;font-weight:700;">${VERSION_LABEL}</h2>
        <button class="btn outline sm" type="button" data-ocr-final-close style="white-space:nowrap;">${text.close}</button>
      </div>
      <div style="${bodyGrid}">
        <div>
          <div id="ocr-dropzone" style="display:grid;place-items:center;min-height:190px;border:1px dashed #94a3b8;border-radius:8px;background:#f8fafc;text-align:center;padding:18px;color:#111827;box-sizing:border-box;">
            <div>
              <strong>${text.drop}</strong>
              <div style="margin-top:10px"><input id="ocr-file" type="file" accept="image/*"></div>
            </div>
          </div>
          <img id="ocr-preview" alt="${text.preview}" style="display:none;width:100%;max-height:260px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;margin-top:12px;background:#fff;box-sizing:border-box;">
          <p id="ocr-draft-label" style="display:none;font-size:13px;color:#475569;margin:8px 0 0;"></p>
          <div id="ocr-progress-wrap" style="display:none;height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden;margin-top:12px;">
            <div id="ocr-progress-bar" style="height:100%;width:0%;background:#111827;"></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;">
            <button class="btn" id="ocr-run" type="button">${text.run}</button>
            <button class="btn outline" id="ocr-sample-run" type="button">${text.sample}</button>
            <button class="btn outline" id="ocr-clear-draft" type="button">${text.clearDraft}</button>
          </div>
          <p id="ocr-modal-status" aria-live="polite" style="font-size:13px;color:#047857;margin:12px 0 0;">${text.status}</p>
        </div>
        <div>
          <div style="display:grid;gap:8px;margin-bottom:14px;">
            <label for="ocr-raw-text" style="font-size:14px;font-weight:700;color:#30343b;">${text.raw}</label>
            <textarea id="ocr-raw-text" placeholder="${text.placeholder}" style="box-sizing:border-box;width:100%;min-height:220px;resize:vertical;border:1px solid #c7ccd5;border-radius:8px;background:#fff;color:#16181d;font:inherit;font-size:15px;line-height:1.55;padding:11px 12px;"></textarea>
          </div>
          <button class="btn secondary" id="ocr-apply-text" type="button">${text.apply}</button>
        </div>
      </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);
    document.body.classList.add("ocr-modal-open");

    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-ocr-final-close]")) closeModal();
    });

    const input = document.getElementById("ocr-file");
    const dropzone = document.getElementById("ocr-dropzone");
    document.getElementById("ocr-run").addEventListener("click", recognizeCurrentFile);
    document.getElementById("ocr-sample-run").addEventListener("click", () => {
      if (typeof window.loadCustomerCardSample === "function") window.loadCustomerCardSample();
    });
    document.getElementById("ocr-clear-draft").addEventListener("click", () => {
      if (typeof window.clearCustomerCardOcrDraft === "function") window.clearCustomerCardOcrDraft();
    });
    document.getElementById("ocr-apply-text").addEventListener("click", () => {
      if (typeof window.applyCustomerCardText === "function") window.applyCustomerCardText();
    });
    const rawText = document.getElementById("ocr-raw-text");
    if (rawText) {
      rawText.addEventListener("input", () => {
        if (typeof window.persistCustomerCardOcrDraftText === "function") window.persistCustomerCardOcrDraftText(rawText.value);
      });
    }
    if (input) input.addEventListener("change", recognizeCurrentFile);
    if (dropzone && input) {
      ["dragenter", "dragover"].forEach((typeName) => {
        dropzone.addEventListener(typeName, (event) => {
          event.preventDefault();
          dropzone.style.background = "#eef2ff";
          dropzone.style.borderColor = "#111827";
        });
      });
      ["dragleave", "drop"].forEach((typeName) => {
        dropzone.addEventListener(typeName, (event) => {
          event.preventDefault();
          dropzone.style.background = "#f8fafc";
          dropzone.style.borderColor = "#94a3b8";
        });
      });
      dropzone.addEventListener("drop", (event) => {
        const files = event.dataTransfer && event.dataTransfer.files;
        if (files && files[0]) {
          input.files = files;
          recognizeCurrentFile();
        }
      });
    }
    if (typeof window.restoreCustomerCardOcrDraft === "function") window.restoreCustomerCardOcrDraft();
  }

  function isOcrTrigger(target) {
    const trigger = target && target.closest && target.closest("[data-ocr-open], button, a");
    if (!trigger) return false;
    const value = `${trigger.textContent || ""} ${trigger.getAttribute("aria-label") || ""}`.trim();
    return trigger.hasAttribute("data-ocr-open") || value.startsWith(BASE_LABEL) || value.includes("OCR \u532f\u5165");
  }

  function updateButtons() {
    document.documentElement.dataset.ocrModalRepair = VERSION;
    document.documentElement.dataset.ocrDirectModal = VERSION;
    if (!canUseOcr()) {
      document.querySelectorAll("[data-ocr-open]").forEach((button) => button.remove());
      return;
    }
    document.querySelectorAll("[data-ocr-open], button").forEach((button) => {
      const label = (button.textContent || "").trim();
      if (label !== VERSION_LABEL && (label === BASE_LABEL || label.startsWith(`${BASE_LABEL}-(`))) {
        button.textContent = VERSION_LABEL;
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!isOcrTrigger(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!guardOcrAccess()) return;
    openFinalModal();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  updateButtons();
  setTimeout(updateButtons, 300);
  setTimeout(updateButtons, 1200);
  setTimeout(updateButtons, 3000);
  setInterval(updateButtons, 1000);
})();
