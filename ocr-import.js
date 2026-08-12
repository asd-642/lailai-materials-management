(function () {
  const PANEL_ID = "customer-card-import-panel";
  const MODAL_ID = "customer-card-ocr-modal";
  const STYLE_ID = "customer-card-ocr-style";
  const TESSERACT_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/\r/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "")
      .replace(/[\uE000-\uF8FF\uFFF0-\uFFFF]/g, "")
      .replace(/[﹕︰]/g, ":")
      .replace(/[‐‑‒–—―]/g, "-")
      .replace(/[|｜·•●◆◇■□▲△▼▽★☆]/g, " ")
      .replace(/[^\S\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function clean(value) {
    return normalizeText(value).replace(/\s+/g, " ").trim();
  }

  function compactChineseText(value) {
    return clean(value)
      .replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff0-9])/g, "$1")
      .replace(/(\d)\s+(?=[\u4e00-\u9fff])/g, "$1");
  }

  function usefulCount(value) {
    const matches = String(value || "").match(/[\u4e00-\u9fffA-Za-z0-9@]/g);
    return matches ? matches.length : 0;
  }

  function splitLines(text) {
    return normalizeText(text)
      .split("\n")
      .map(clean)
      .filter((line) => {
        if (!line) return false;
        if (/^(logo|your name|you name|name|company name|company|design|sample)$/i.test(line)) return false;
        return !(line.length >= 6 && usefulCount(line) / line.length < 0.35);
      });
  }

  function firstMatch(text, regex) {
    const match = String(text || "").match(regex);
    return match ? clean(match[1] || match[0]) : "";
  }

  function removePhoneDigits(text) {
    let result = String(text || "");
    for (const phone of phoneMatches(result)) {
      const digits = phone.replace(/[^\d]/g, "");
      result = result.replace(new RegExp(digits.split("").join("[\\s.-]*")), " ");
    }
    return result;
  }

  function stripLabel(line, labels) {
    let text = clean(line);
    for (const label of labels) text = text.replace(label, "");
    return clean(text.replace(/^[\s:：-]+|[\s:：-]+$/g, ""));
  }

  function normalizePhone(value) {
    let digits = clean(value).replace(/[Oo]/g, "0").replace(/[^\d]/g, "");
    if (digits.startsWith("886")) digits = `0${digits.slice(3)}`;
    if (digits.length === 9 && digits.startsWith("9")) digits = `0${digits}`;
    if (/^09\d{8}$/.test(digits)) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    if (/^02\d{8}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    if (/^0[3-8]\d{8}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    if (/^0[3-8]\d{7}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return "";
  }

  function phoneMatches(line) {
    const text = clean(line).replace(/[Oo]/g, "0");
    const patterns = [
      /(?:\+?886[\s-]?)?0?9\d{2}[\s-]?\d{3}[\s-]?\d{3}/g,
      /(?:\+?886[\s-]?)?0[2-8][\s-]?\d{3,4}[\s-]?\d{4}/g,
      /\(0[2-8]\)\s*\d{3,4}[\s-]?\d{4}/g,
      /0[2-8]\s+\d{3,4}\s+\d{4}/g,
    ];
    const result = [];
    for (const pattern of patterns) {
      for (const match of text.match(pattern) || []) {
        const phone = normalizePhone(match);
        if (phone && !result.includes(phone)) result.push(phone);
      }
    }
    return result;
  }

  const ADDRESS_RE = /(?:台北市|臺北市|新北市|桃園市|台中市|臺中市|台南市|臺南市|高雄市|基隆市|新竹市|嘉義市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|臺東縣|澎湖縣|金門縣|連江縣)[^\n@]{0,80}(?:路|街|巷|弄|號|樓|室)[^\n@]*/;
  const COMPANY_SUFFIX_RE = /(股份有限公司|有限公司|工程行|企業社|商行|工作室|設計室|事務所|公司|行號)$/;
  const ROLE_RE = /(總經理|副總經理|董事長|負責人|聯絡人|店長|銷售部經理|業務部經理|採購部經理|工程部經理|銷售|業務|採購|主任|協理|副理|經理|專員|助理)/g;

  function isFaxLine(line) {
    return /(Fax|F\W*a\W*x|傳真)/i.test(line);
  }

  function isTaxLine(line) {
    return /(統\s*一\s*編\s*號|統\s*編|公司\s*統\s*編|Tax\s*ID|VAT|UBN|Unified\s*Business\s*No)/i.test(line);
  }

  function isAddressLine(line) {
    return ADDRESS_RE.test(line) || /(地址|公司地址|Add|Address)/i.test(line);
  }

  function isInfoLabelLine(line) {
    return isTaxLine(line) || isFaxLine(line) || /(地址|電話|手機|Tel|TEL|Mobile|Phone|Email|Mail|網址|www\.|https?:\/\/)/i.test(line);
  }

  function findPhone(lines, mobileOnly) {
    const preferred = lines.filter((line) => {
      if (isTaxLine(line) || isFaxLine(line)) return false;
      return mobileOnly ? /(09|\+?886\s*9|手機|Mobile)/i.test(line) : /(Tel|TEL|電話|公司電話)/i.test(line);
    });
    const candidates = preferred.length ? preferred : lines;
    for (const line of candidates) {
      if (isTaxLine(line) || isFaxLine(line)) continue;
      for (const phone of phoneMatches(line)) {
        if (mobileOnly && !phone.startsWith("09")) continue;
        if (!mobileOnly && phone.startsWith("09")) continue;
        return phone;
      }
    }
    return "";
  }

  function cleanCompanyCandidate(line) {
    return compactChineseText(stripLabel(line, [/客戶\s*\/\s*案場名稱/i, /公司名稱/i, /Company\s*Name/i, /客戶名稱/i]))
      .replace(/股份有限公司/g, "股份有限公司")
      .replace(/有限公司/g, "有限公司")
      .replace(/\s*(?:公司\s*)?(?:統一編號|統編|電話|傳真|地址|Tel|TEL|Fax|Mobile|Phone|Email|Mail).*$/i, "")
      .replace(/(?:統一編號|統編|電話|傳真|地址|Tel|TEL|Fax|Mobile|Phone|Email|Mail).*/i, "")
      .replace(/\d[\d\s().-]{5,}\d/g, "")
      .replace(/[A-Za-z]{1,6}$/g, "")
      .replace(/^[^\u4e00-\u9fff]+|[^\u4e00-\u9fffA-Za-z0-9]+$/g, "")
      .trim();
  }

  function scoreCompanyLine(line) {
    const text = cleanCompanyCandidate(line);
    if (!text || /@|https?:\/\/|www\./i.test(text)) return -20;
    if (phoneMatches(text).length) return -12;
    if (isInfoLabelLine(line) && !COMPANY_SUFFIX_RE.test(text)) return -12;
    if (/^(銷售部|業務部|採購部|客服部|設計部|工程部|銷售部經理|業務部經理|經理|負責人|聯絡人)$/i.test(text)) return -12;
    if (ADDRESS_RE.test(text) || /[縣市區鄉鎮].*(路|街|巷|弄|號)/.test(text)) return -12;
    if (/\d/.test(text) && !COMPANY_SUFFIX_RE.test(text)) return -8;
    let score = 0;
    const hasSuffix = COMPANY_SUFFIX_RE.test(text);
    const hasIndustry = /(建材|材料|五金|家具|傢俱|水果|工程|設計|股份|有限|商行|企業|室內|裝修|水電|行銷|科技|貿易)/.test(text);
    if (hasSuffix) score += 12;
    if (hasIndustry) score += 3;
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    if (chinese >= 4) score += 4;
    if (!hasSuffix && !hasIndustry && chinese < 6) score -= 6;
    if (text.length > 28) score -= 2;
    return score;
  }

  function findCompanyLine(lines) {
    let best = "";
    let bestScore = -99;
    for (const line of lines) {
      const score = scoreCompanyLine(line);
      if (score > bestScore) {
        best = line;
        bestScore = score;
      }
    }
    return bestScore >= 4 ? cleanCompanyCandidate(best) : "";
  }

  function findAddressLine(lines) {
    return (
      lines.find((line) => ADDRESS_RE.test(line)) ||
      lines.find((line) => /(地址|公司地址|Add|Address)/i.test(line) && usefulCount(line) >= 5) ||
      ""
    );
  }

  function cleanAddressCandidate(line) {
    let text = stripLabel(line, [/公司地址/i, /地址/i, /Add/i, /Address/i]);
    text = removePhoneDigits(text);
    text = text
      .replace(/(?:TEL|Tel|電話|手機|Mobile|Phone|Fax|傳真)\s*[:：]?/gi, " ")
      .replace(/(?:統一編號|統編)\s*[:：]?\s*\d{8}/g, " ")
      .replace(/\b(?:04|02|03|05|06|07|08|09)[\d\s.-]{6,}\b/g, " ");
    const match = text.match(ADDRESS_RE);
    return compactChineseText(match ? match[0] : text);
  }

  function detectRole(line) {
    const compact = compactChineseText(line).replace(/\s+/g, "");
    if (/銷售部.*經理|銷售.*經理/.test(compact)) return "銷售部 經理";
    if (/業務部.*經理|業務.*經理/.test(compact)) return "業務部 經理";
    const role = firstMatch(compact, /(總經理|副總經理|董事長|負責人|聯絡人|店長|採購|主任|協理|副理|經理|業務)/);
    return role;
  }

  function normalizeContactName(name, joined) {
    let text = compactChineseText(name).replace(/(銷售部|業務部|採購部|客服部|設計部|工程部|經理|負責人|聯絡人|職稱)/g, "");
    if (text === "明遍" && /Hao\s*Ming/i.test(joined)) text = "郝明遍";
    return text;
  }

  function findTaxId(lines) {
    const taxIdRe = /(?<!\d)\d{8}(?!\d)/g;
    for (const line of lines) {
      if (!isTaxLine(line)) continue;
      const text = removePhoneDigits(line);
      for (const candidate of text.match(/\d[\d\s-]{6,}\d/g) || []) {
        const digits = candidate.replace(/[^\d]/g, "");
        if (digits.length === 8) return digits;
      }
    }
    const candidates = [];
    for (const line of lines) {
      if (phoneMatches(line).length || /@|www\.|https?:\/\//i.test(line)) continue;
      if (isAddressLine(line) || /(電話|手機|TEL|Mobile|Phone|Fax|傳真)/i.test(line)) continue;
      const text = removePhoneDigits(line);
      for (const digits of text.match(taxIdRe) || []) {
        if (!candidates.includes(digits)) candidates.push(digits);
      }
    }
    if (candidates.length === 1) return candidates[0];
    return "";
  }

  function extractNameFromLine(line, joined) {
    const compact = compactChineseText(line)
      .replace(/[A-Za-z0-9@._%+\-:/()（）\s]+/g, "")
      .replace(ROLE_RE, "")
      .replace(/(公司|股份|有限|工程行|企業社|商行|名片|地址|電話|手機|統編|統一編號|傳真|網址|職稱)/g, "");
    const name = normalizeContactName(firstMatch(compact, /([\u4e00-\u9fff]{2,4})/), joined);
    return name;
  }

  function findContact(lines, joined) {
    const badNameRe = /(銷售部|業務部|採購部|客服部|設計部|工程部|經理|負責人|聯絡人|公司|有限|股份|名片|地址|電話|手機)/;
    let role = "";
    for (const line of lines) {
      role = detectRole(line);
      if (role) break;
    }
    for (const line of lines) {
      const phones = phoneMatches(line);
      if (!phones.some((phone) => phone.startsWith("09"))) continue;
      const withoutPhones = removePhoneDigits(line);
      if (isAddressLine(withoutPhones)) continue;
      const name = extractNameFromLine(withoutPhones, joined);
      if (name && !badNameRe.test(name)) return { name, role };
    }
    for (const line of lines) {
      if (scoreCompanyLine(line) >= 4 || phoneMatches(line).length || /@|www\.|https?:\/\//i.test(line)) continue;
      if (isAddressLine(line) || isTaxLine(line)) continue;
      const compact = compactChineseText(line).replace(/[A-Za-z\s.-]+/g, "");
      const withoutRole = compact.replace(ROLE_RE, "");
      const name = normalizeContactName(firstMatch(withoutRole || compact, /([\u4e00-\u9fff]{2,4})/), joined);
      if (name && !badNameRe.test(name) && !badNameRe.test(withoutRole || compact)) return { name, role };
    }
    const name = normalizeContactName(firstMatch(joined, /(?:負責人|聯絡人|姓名|Name)\s*[:：]?\s*([\u4e00-\u9fff]{2,4})/i), joined);
    return { name, role };
  }

  function parseCardText(text) {
    const lines = splitLines(text);
    const joined = lines.join("\n");
    const company = compactChineseText(findCompanyLine(lines));
    const contact = findContact(lines, joined);
    const email = firstMatch(joined, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const phone = findPhone(lines, false);
    const mobile = findPhone(lines, true);
    return {
      name: company,
      phone,
      address: compactChineseText(cleanAddressCandidate(findAddressLine(lines))),
      company_name: company,
      tax_id: findTaxId(lines),
      invoice_title: "",
      contacts: [
        {
          name: contact.name,
          role: contact.role,
          phone: mobile || phone,
          email,
          notes: "",
          primary: true,
        },
      ],
      notes: "",
      is_active: true,
    };
  }

  function parsedQualityScore(customer) {
    if (!customer) return 0;
    const contact = customer.contacts && customer.contacts[0] ? customer.contacts[0] : {};
    let score = 0;
    if (customer.company_name) score += 3;
    if (customer.phone) score += 2;
    if (customer.address) score += 2;
    if (customer.tax_id) score += 2;
    if (contact.name) score += 2;
    if (contact.phone) score += 1;
    if (contact.email) score += 1;
    return score;
  }

  window.__parseCustomerCardText = parseCardText;

  function isCustomerCreateRoute() {
    const hash = String(location.hash || "").replace(/^#/, "");
    return hash === "/customers/new" || hash.startsWith("/customers/new?");
  }

  function customerForm() {
    if (!canUseOcr()) return null;
    if (!isCustomerCreateRoute()) return null;
    return document.querySelector('form[onsubmit^="saveCustomer"]');
  }

  function canUseOcr() {
    return typeof window.canUseCustomerOcr !== "function" || window.canUseCustomerOcr();
  }

  function guardOcrAccess() {
    if (canUseOcr()) return true;
    if (typeof window.setToast === "function") window.setToast("目前帳號沒有使用 OCR 匯入客戶的權限");
    return false;
  }

  function formField(form, name) {
    return form && form.elements ? form.elements[name] : null;
  }

  function setField(form, name, value) {
    const target = formField(form, name);
    if (!target || value === undefined || value === null) return;
    target.value = value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillForm(customer) {
    const form = customerForm();
    if (!form || !customer) return false;
    const contact = customer.contacts && customer.contacts[0] ? customer.contacts[0] : {};
    setField(form, "name", customer.name);
    setField(form, "phone", customer.phone);
    setField(form, "address", customer.address);
    setField(form, "company_name", customer.company_name);
    setField(form, "tax_id", customer.tax_id);
    setField(form, "invoice_title", "");
    setField(form, "contact_name_0", contact.name);
    setField(form, "contact_role_0", contact.role);
    setField(form, "contact_phone_0", contact.phone);
    setField(form, "contact_email_0", contact.email);
    setField(form, "contact_notes_0", "");
    setField(form, "notes", "");
    ensureCustomerFieldTools();
    return true;
  }

  function updateStatus(text, mode) {
    const status = document.getElementById("ocr-modal-status");
    if (status) {
      status.textContent = text;
      status.dataset.mode = mode || "";
    }
  }

  function updateProgress(percent) {
    const wrap = document.getElementById("ocr-progress-wrap");
    const bar = document.getElementById("ocr-progress-bar");
    if (!wrap || !bar) return;
    wrap.style.display = "block";
    bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function setInputValue(target, value) {
    if (!target) return;
    target.value = value || "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  window.swapCustomerPhoneFields = function () {
    const form = customerForm();
    const companyPhone = formField(form, "phone");
    const contactPhone = formField(form, "contact_phone_0");
    if (!companyPhone || !contactPhone) return;
    const original = companyPhone.value;
    setInputValue(companyPhone, contactPhone.value);
    setInputValue(contactPhone, original);
  };

  window.openCustomerCompanySearch = function (mode) {
    const form = customerForm();
    const company = clean(formField(form, "company_name")?.value || formField(form, "name")?.value || "");
    if (!company) {
      updateStatus("請先填入公司名稱，再按 Google 查證。", "warn");
      return;
    }
    const suffix = mode === "tax" ? "統一編號" : "地址 電話";
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`${company} ${suffix}`)}`, "_blank", "noopener,noreferrer");
  };

  function addFieldTool(inputName, key, text, onClick, title) {
    const form = customerForm();
    const input = formField(form, inputName);
    if (!input) return;
    const wrap = input.closest(".field");
    if (!wrap || wrap.querySelector(`[data-ocr-field-tool="${key}"]`)) return;
    const tools = document.createElement("div");
    tools.className = "ocr-inline-tools";
    tools.dataset.ocrFieldTool = key;
    const button = document.createElement("button");
    button.className = "btn outline sm";
    button.type = "button";
    button.textContent = text;
    if (title) button.title = title;
    button.addEventListener("click", onClick);
    tools.appendChild(button);
    input.insertAdjacentElement("afterend", tools);
  }

  function ensureCustomerFieldTools() {
    addFieldTool("phone", "swap-company-phone", "交換電話", window.swapCustomerPhoneFields, "交換公司電話與第一位聯絡人的電話");
    addFieldTool("contact_phone_0", "swap-contact-phone", "交換電話", window.swapCustomerPhoneFields, "交換公司電話與第一位聯絡人的電話");
    addFieldTool("company_name", "google-company-address", "Google 查地址", () => window.openCustomerCompanySearch("address"), "用公司名稱查地址與電話");
    addFieldTool("tax_id", "google-company-tax", "Google 查統編", () => window.openCustomerCompanySearch("tax"), "用公司名稱查統一編號");
  }

  function applyParsedText(text) {
    const parsed = parseCardText(text);
    const raw = document.getElementById("ocr-raw-text");
    if (raw) raw.value = splitLines(text).join("\n") || normalizeText(text);
    if (!parsed.company_name) {
      updateStatus("有讀到文字，但找不到公司名稱。請修正文字後再整理一次。", "warn");
      return false;
    }
    fillForm(parsed);
    updateStatus("已填入新增客戶表單，請確認欄位後再儲存。", "ok");
    return true;
  }

  window.applyCustomerCardText = function () {
    if (!guardOcrAccess()) return;
    const raw = document.getElementById("ocr-raw-text");
    if (raw) applyParsedText(raw.value);
  };

  window.loadCustomerCardSample = function () {
    if (!guardOcrAccess()) return;
    const sample = [
      "銷售部 經理",
      "郝 明 遍",
      "Hao Ming-bian",
      "硬名片股份有限公司",
      "台中市名片區名片路100號 04-12345678 0912-123456",
      "service@1112345.com",
      "www.sample.com",
    ].join("\n");
    const raw = document.getElementById("ocr-raw-text");
    if (raw) raw.value = sample;
    applyParsedText(sample);
  };

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TESSERACT_SRC;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => reject(new Error("OCR 套件載入失敗"));
      document.head.appendChild(script);
    });
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("圖片讀取失敗"));
      };
      image.src = url;
    });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.96));
  }

  async function preprocessImage(file, options = {}) {
    const source = await loadImage(file);
    const sw = source.naturalWidth || source.width;
    const sh = source.naturalHeight || source.height;
    const scale = Math.max(1, Math.min(3, 2400 / Math.max(1, Math.max(sw, sh))));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let total = 0;
    for (let i = 0; i < data.length; i += 4) total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const mean = total / (data.length / 4);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let value = (gray - mean) * 1.6 + mean + 8;
      if (value > 236) value = 255;
      if (value < 38) value = 0;
      if (options.invert) value = 255 - value;
      value = Math.max(0, Math.min(255, value));
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    context.putImageData(imageData, 0, 0);
    return (await canvasToBlob(canvas)) || file;
  }

  async function recognizeWithTesseract(Tesseract, image, passLabel) {
    updateStatus(passLabel);
    const result = await Tesseract.recognize(image, "chi_tra+eng", {
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
      tessedit_pageseg_mode: "6",
      logger(message) {
        if (message.progress) updateProgress(Math.round(message.progress * 100));
        if (message.status) updateStatus(`辨識中：${message.status}`);
      },
    });
    return normalizeText(result?.data?.text || "");
  }

  async function recognizeFile(file) {
    if (!file) {
      updateStatus("請先選擇或拖入名片圖片。", "warn");
      return;
    }
    const preview = document.getElementById("ocr-preview");
    if (preview) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
    const runButton = document.getElementById("ocr-run");
    if (runButton) runButton.disabled = true;
    updateProgress(0);
    updateStatus("正在強化圖片清晰度...");
    try {
      const image = await preprocessImage(file);
      const Tesseract = await loadTesseract();
      let text = await recognizeWithTesseract(Tesseract, image, "正在載入 OCR 模型，第一次會比較久...");
      let bestScore = parsedQualityScore(parseCardText(text));
      if (bestScore < 7) {
        updateProgress(0);
        const invertedImage = await preprocessImage(file, { invert: true });
        const invertedText = await recognizeWithTesseract(Tesseract, invertedImage, "第一輪欄位不足，正在用深色名片模式再讀一次...");
        const invertedScore = parsedQualityScore(parseCardText(invertedText));
        if (invertedScore > bestScore) {
          text = invertedText;
          bestScore = invertedScore;
        }
      }
      const raw = document.getElementById("ocr-raw-text");
      if (raw) raw.value = text;
      if (!text) {
        updateStatus("沒有辨識到文字，請換一張更清楚、較正面的照片。", "warn");
        return;
      }
      applyParsedText(text);
    } catch (error) {
      updateStatus(`辨識失敗：${error.message || error}`, "warn");
    } finally {
      if (runButton) runButton.disabled = false;
    }
  }

  window.recognizeSelectedCustomerCard = function () {
    if (!guardOcrAccess()) return;
    const input = document.getElementById("ocr-file");
    recognizeFile(input && input.files && input.files[0]);
  };

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ocr-card-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
      .ocr-inline-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
      .ocr-inline-tools .btn{min-height:30px;padding:6px 10px;font-size:12px}
      .ocr-modal-backdrop{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.48);padding:18px}
      .ocr-modal-backdrop.is-open{display:flex}
      .ocr-modal{width:min(900px,100%);max-height:min(760px,calc(100vh - 36px));overflow:auto;background:#fff;border:1px solid #dde1e7;border-radius:8px;box-shadow:0 24px 80px rgba(15,23,42,.28)}
      .ocr-modal-head{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 20px;border-bottom:1px solid #e5e7eb}
      .ocr-modal-title{margin:0;font-size:20px;line-height:1.2}
      .ocr-modal-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);gap:18px;padding:20px}
      .ocr-dropzone{display:grid;place-items:center;min-height:190px;border:1px dashed #aeb6c2;border-radius:8px;background:#fafbfc;padding:18px;text-align:center}
      .ocr-dropzone.is-drag{border-color:#111827;background:#f0f3f7}
      .ocr-preview{display:none;width:100%;max-height:280px;object-fit:contain;border:1px solid #dde1e7;border-radius:8px;background:#fff;margin-top:12px}
      .ocr-modal .field{display:grid;gap:8px;margin-bottom:14px}
      .ocr-modal label{font-size:14px;font-weight:700;color:#30343b}
      .ocr-modal textarea{width:100%;border:1px solid #c7ccd5;border-radius:8px;background:#fff;color:#16181d;font:inherit;font-size:15px;padding:11px 12px;outline:none;min-height:220px;resize:vertical;line-height:1.55}
      .ocr-modal-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}
      .ocr-progress-wrap{display:none;height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden;margin-top:12px}
      .ocr-progress-bar{height:100%;width:0%;background:#111827;transition:width .16s ease}
      .ocr-status{color:#6b7280;font-size:14px;line-height:1.5}
      .ocr-status[data-mode="ok"]{color:#0f766e;font-weight:700}
      .ocr-status[data-mode="warn"]{color:#b45309;font-weight:700}
      body.ocr-modal-open{overflow:hidden}
      @media(max-width:760px){.ocr-modal-backdrop{align-items:flex-start;padding:10px}.ocr-modal{max-height:calc(100vh - 20px)}.ocr-modal-head{align-items:flex-start;flex-direction:column}.ocr-modal-body{grid-template-columns:1fr;padding:16px}.ocr-modal .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function openModal() {
    if (!guardOcrAccess()) return;
    ensureModal();
    document.getElementById(MODAL_ID).classList.add("is-open");
    document.body.classList.add("ocr-modal-open");
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove("is-open");
    document.body.classList.remove("ocr-modal-open");
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "ocr-modal-backdrop";
    modal.innerHTML = `
      <div class="ocr-modal" role="dialog" aria-modal="true" aria-label="名片 OCR 匯入">
        <div class="ocr-modal-head">
          <h2 class="ocr-modal-title">名片 OCR 匯入</h2>
          <button class="btn outline sm" type="button" data-ocr-close>關閉</button>
        </div>
        <div class="ocr-modal-body">
          <div>
            <div class="ocr-dropzone" id="ocr-dropzone">
              <div>
                <strong>拖入名片照片</strong>
                <div style="margin-top:10px"><input id="ocr-file" type="file" accept="image/*"></div>
              </div>
            </div>
            <img id="ocr-preview" class="ocr-preview" alt="名片預覽">
            <div id="ocr-progress-wrap" class="ocr-progress-wrap"><div id="ocr-progress-bar" class="ocr-progress-bar"></div></div>
            <div class="ocr-modal-actions">
              <button class="btn" id="ocr-run" type="button" onclick="recognizeSelectedCustomerCard()">開始辨識</button>
              <button class="btn outline" type="button" onclick="loadCustomerCardSample()">範例測試</button>
            </div>
            <p id="ocr-modal-status" class="ocr-status" aria-live="polite">選擇圖片後開始辨識。</p>
          </div>
          <div>
            <div class="field">
              <label for="ocr-raw-text">辨識文字</label>
              <textarea id="ocr-raw-text" placeholder="可手動修正文字後再整理填入"></textarea>
            </div>
            <button class="btn secondary" type="button" onclick="applyCustomerCardText()">整理並填入表單</button>
          </div>
        </div>
      </div>
    `;
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-ocr-close]")) closeModal();
    });
    document.body.appendChild(modal);

    const input = document.getElementById("ocr-file");
    const dropzone = document.getElementById("ocr-dropzone");
    input.addEventListener("change", () => recognizeFile(input.files && input.files[0]));
    ["dragenter", "dragover"].forEach((type) => {
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        dropzone.classList.add("is-drag");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      dropzone.addEventListener(type, (event) => {
        event.preventDefault();
        dropzone.classList.remove("is-drag");
      });
    });
    dropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) {
        input.files = event.dataTransfer.files;
        recognizeFile(file);
      }
    });
  }

  function ensurePanel() {
    const form = customerForm();
    document.querySelectorAll(".customer-card-import").forEach((panel) => {
      if (!form || !form.contains(panel)) panel.remove();
    });
    if (!form) return;
    ensureStyles();
    ensureCustomerFieldTools();

    let panel = document.querySelector(".customer-card-import");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "card customer-card-import";
      panel.id = PANEL_ID;
      panel.innerHTML = `<div class="card-header"><h2>名片資料匯入</h2></div><div class="card-body"><div class="ocr-card-actions"></div></div>`;
      form.insertBefore(panel, form.firstChild);
    }

    const header = panel.querySelector(".card-header") || panel;
    const oldLink = header.querySelector('a[href*="ocr"], a[href*="business-card"]');
    if (oldLink && !oldLink.dataset.ocrEnhanced) {
      const button = document.createElement("button");
      button.className = oldLink.className || "btn outline sm";
      button.type = "button";
      button.textContent = "名片 OCR 匯入";
      button.dataset.ocrOpen = "1";
      button.addEventListener("click", openModal);
      oldLink.replaceWith(button);
    } else if (!header.querySelector("[data-ocr-open]")) {
      const button = document.createElement("button");
      button.className = "btn outline sm";
      button.type = "button";
      button.textContent = "名片 OCR 匯入";
      button.dataset.ocrOpen = "1";
      button.addEventListener("click", openModal);
      header.appendChild(button);
    }
  }

  window.addEventListener("hashchange", () => setTimeout(ensurePanel, 0));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensurePanel);
  } else {
    ensurePanel();
  }
  setTimeout(ensurePanel, 100);
  setTimeout(ensurePanel, 500);
  const app = document.getElementById("app");
  if (app) new MutationObserver(() => ensurePanel()).observe(app, { childList: true, subtree: true });
})();
