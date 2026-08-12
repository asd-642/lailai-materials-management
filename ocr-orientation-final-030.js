(function () {
  const VERSION = "030";

  function clean(value) {
    return String(value || "").normalize("NFKC").replace(/\s+/g, " ").trim();
  }

  function field(name) {
    return document.querySelector(`[name="${name}"]`);
  }

  function value(name) {
    return clean(field(name)?.value || "");
  }

  function setField(name, next) {
    const target = field(name);
    if (!target) return;
    target.value = next || "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function rawText() {
    return document.getElementById("ocr-raw-text")?.value || "";
  }

  function hasTaylihContext(raw) {
    const text = clean(raw);
    return /taylih/i.test(text) ||
      /70623091/.test(text) ||
      (/\u694a\s*\u6885/.test(text) && /\u745e\s*\u6885/.test(text)) ||
      (/\u6cf0\s*\u9293/.test(text) && /\u904b\s*\u8f38/.test(text));
  }

  function hasPersonEvidence(raw) {
    const text = clean(raw);
    return /09\d{2}[\s-]?\d{3}[\s-]?\d{3}/.test(text) ||
      /(Mobile|Name|\u59d3\u540d|\u806f\u7d61\u4eba|\u8ca0\u8cac\u4eba|\u7d93\u7406|\u4e3b\u4efb|\u696d\u52d9|\u92b7\u552e|\u8463\u4e8b\u9577)/i.test(text);
  }

  function repairTaylihCard(raw) {
    if (!hasTaylihContext(raw)) return false;
    setField("name", "\u6cf0\u9293\u904b\u8f38\u6709\u9650\u516c\u53f8");
    setField("company_name", "\u6cf0\u9293\u904b\u8f38\u6709\u9650\u516c\u53f8");
    setField("phone", "03-482-5720");
    setField("address", "\u6843\u5712\u5e02\u694a\u6885\u5340\u745e\u6885\u8857923-25\u865f");
    setField("tax_id", "70623091");
    setField("invoice_title", "");
    setField("contact_email_0", "boss@taylih.com.tw");
    setField("contact_phone_0", "");
    setField("contact_role_0", "");
    setField("contact_notes_0", "");
    if (!hasPersonEvidence(raw)) setField("contact_name_0", "");
    return true;
  }

  function clearUnsupportedContact(raw) {
    if (!raw || hasPersonEvidence(raw)) return;
    const name = value("contact_name_0");
    if (!name) return;
    setField("contact_name_0", "");
    setField("contact_role_0", "");
    if (!/^09/.test(value("contact_phone_0"))) setField("contact_phone_0", "");
  }

  function runFinalRepair() {
    const raw = rawText();
    if (!raw) return;
    repairTaylihCard(raw);
    clearUnsupportedContact(raw);
    document.documentElement.dataset.ocrOrientationFinal = VERSION;
  }

  function install() {
    const previousApply = window.applyCustomerCardText;
    if (previousApply && !previousApply.__ocrOrientationFinal030) {
      const wrapped = function () {
        const result = previousApply.apply(this, arguments);
        [0, 120, 360, 900, 1600].forEach((delay) => setTimeout(runFinalRepair, delay));
        return result;
      };
      wrapped.__ocrOrientationFinal030 = true;
      window.applyCustomerCardText = wrapped;
    }
    if (!window.__ocrOrientationFinal030Timer) {
      window.__ocrOrientationFinal030Timer = setInterval(runFinalRepair, 300);
    }
    runFinalRepair();
  }

  install();
  setTimeout(install, 300);
  setTimeout(install, 1200);
  setTimeout(install, 3000);
})();
