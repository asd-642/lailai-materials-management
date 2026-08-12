(function () {
  const VERSION = "020";

  function clean(value) {
    return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  }

  function linesOf(text) {
    return String(text || "")
      .normalize("NFKC")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(clean)
      .filter(Boolean);
  }

  function getField(name) {
    return document.querySelector(`[name="${name}"]`);
  }

  function fieldValue(name) {
    return clean(getField(name)?.value || "");
  }

  function setField(name, value) {
    const target = getField(name);
    if (!target) return;
    target.value = value || "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function normalizeAddress(value) {
    const cityPattern = /(?:\d{3}\s*)?[\u4e00-\u9fff]\s*[\u4e00-\u9fff]\s*[\u4e00-\u9fff]?\s*(?:\u5e02|\u7e23)/;
    const raw = clean(value)
      .replace(/>/g, "\u4e4b")
      .replace(/[|\uFF5C]/g, "")
      .replace(/\b(?:Tel|TEL|Fax|FAX|mail|Email|E-mail|www)\b.*$/i, "");
    const start = raw.search(cityPattern);
    if (start < 0) return "";
    return raw
      .slice(start)
      .replace(/\s+/g, "")
      .replace(/\u81fa/g, "\u53f0")
      .replace(/[^\u4e00-\u9fffA-Za-z0-9#\-]/g, "")
      .trim();
  }

  function addressFromRaw(text) {
    const lines = linesOf(text);
    for (let index = 0; index < lines.length; index += 1) {
      const current = lines[index];
      if (!/(?:\d{3}\s*)?[\u4e00-\u9fff]\s*[\u4e00-\u9fff]\s*[\u4e00-\u9fff]?\s*(?:\u5e02|\u7e23)/.test(current)) continue;
      const next = clean(lines[index + 1] || "");
      const shouldJoinNext = next && /^(?:\u4e4b|>)?\s*\d+(?:\s*\u6a13)?(?:\s*(?:\u4e4b|>)\s*\d+)?$/.test(next);
      const address = normalizeAddress(current + (shouldJoinNext ? " " + next : ""));
      if (address && /(?:\u8def|\u8857|\u5927\u9053|\u5df7|\u5f04)/.test(address) && /\d+\u865f/.test(address)) {
        return address;
      }
    }
    return "";
  }

  function repairAddress() {
    const rawText = document.getElementById("ocr-raw-text")?.value || "";
    if (!rawText || fieldValue("address")) return;
    const address = addressFromRaw(rawText);
    if (address) setField("address", address);
  }

  function install() {
    document.documentElement.dataset.ocrAddressFix = VERSION;

    const previousApply = window.applyCustomerCardText;
    if (previousApply && !previousApply.__ocrAddressFix020) {
      const wrappedApply = function () {
        const result = previousApply.apply(this, arguments);
        setTimeout(repairAddress, 0);
        setTimeout(repairAddress, 300);
        setTimeout(repairAddress, 1000);
        return result;
      };
      wrappedApply.__ocrAddressFix020 = true;
      window.applyCustomerCardText = wrappedApply;
    }

    if (!window.__ocrAddressFix020Timer) {
      window.__ocrAddressFix020Timer = setInterval(repairAddress, 700);
    }
  }

  install();
  setTimeout(install, 300);
  setTimeout(install, 1200);
  setTimeout(install, 3000);
})();
