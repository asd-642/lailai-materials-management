(function () {
  const VERSION = "027";
  const HAN = "\\u4e00-\\u9fff";

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

  function chineseCount(value) {
    const matches = clean(value).match(/[\u4e00-\u9fff]/g);
    return matches ? matches.length : 0;
  }

  function latinCount(value) {
    const matches = clean(value).match(/[A-Za-z]/g);
    return matches ? matches.length : 0;
  }

  function includesAny(text, words) {
    return words.some((word) => text.includes(word));
  }

  function phoneLike(value) {
    return /(?:09\d{2}[\s-]?\d{3}[\s-]?\d{3}|0[2-8][\s-]?\d{3,4}[\s-]?\d{4}|\(0[2-8]\)\s*\d{3,4}[\s-]?\d{4})/.test(clean(value));
  }

  function normalizeEmailText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/(?:E[-\s]*mail|Email|Mail|ma[i1l]{2}|m[a4]11)\s*[:\uFF1A]?\s*/gi, " ")
      .replace(/\s*@\s*/g, "@")
      .replace(/\s*\.\s*/g, ".")
      .replace(/[;,+]/g, " ");
  }

  function emailFromRaw(text) {
    const normalized = normalizeEmailText(text);
    const match = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(?:\.[A-Z]{2,})?/i);
    return match ? clean(match[0]).replace(/\.+$/, "") : "";
  }

  function formatTaiwanPhone(value) {
    const digits = clean(value).replace(/\D/g, "");
    if (/^09\d{8}$/.test(digits)) return digits.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3");
    if (/^02\d{8}$/.test(digits)) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    if (/^0[3-8]\d{7}$/.test(digits)) return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
    if (/^0[3-8]\d{8}$/.test(digits)) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    return clean(value);
  }

  function companyPhoneFromRaw(text) {
    const lines = linesOf(text);
    const label = "(?:Tel\\.?|TEL|tel|\\u96fb\\u8a71)";
    const phone = "((?:\\(0[2-8]\\)|0[2-8])[\\s-]?\\d{3,4}[\\s-]?\\d{4})";
    const labeledPhone = new RegExp(label + "\\s*[:\\uFF1A]?\\s*" + phone, "i");
    for (const line of lines) {
      const match = clean(line).match(labeledPhone);
      if (match) return formatTaiwanPhone(match[1]);
    }
    return "";
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

  function hasCompanySuffix(value) {
    const text = clean(value);
    return /(\u80a1\u4efd\u6709\u9650\u516c\u53f8|\u6709\u9650\u516c\u53f8|\u5de5\u7a0b\u884c|\u4f01\u696d\u793e|\u5546\u884c|\u5de5\u4f5c\u5ba4|\u8a2d\u8a08\u5ba4|\u4e8b\u52d9\u6240|\u516c\u53f8|\u884c\u865f)$/.test(text);
  }

  function hasCompanyIndustry(value) {
    const text = clean(value);
    return /(\u8cc7\u8a0a|\u80a1\u4efd|\u6709\u9650|\u5370\u5237|\u8a2d\u8a08|\u5de5\u7a0b|\u5efa\u6750|\u6750\u6599|\u4e94\u91d1|\u5bb6\u5177|\u50a2\u4ff1|\u6c34\u679c|\u79d1\u6280|\u8cbf\u6613|\u71df\u9020|\u571f\u6728|\u5ba4\u5167|\u88dd\u4fee|\u6c34\u96fb|\u884c\u92b7)/.test(text);
  }

  function hasOcrNoise(value) {
    const text = clean(value);
    if (!text) return true;
    if (/[A-Za-z]{3,}/.test(text) && !hasCompanySuffix(text)) return true;
    if (/[A-Za-z][\u4e00-\u9fff][A-Za-z]|[\u4e00-\u9fff][A-Za-z]{2,}[\u4e00-\u9fff]/.test(text)) return true;
    if (/(QIW|RACIC|RAC1C|RCIC|Liii|LIii|IHP|Ofsas|ELESREE)/i.test(text)) return true;
    return false;
  }

  function isAddressishText(value) {
    const text = clean(value).replace(/\s+/g, "");
    if (!text) return false;
    return /(\u5e02|\u7e23|\u9109|\u93ae|\u5340|\u6751|\u91cc|\u8def|\u8857|\u5927\u9053|\u6bb5|\u5df7|\u5f04|\u865f|\u6a13|\u5ba4)/.test(text);
  }

  function isCompanyishText(value) {
    const text = clean(value);
    return hasCompanySuffix(text) || includesAny(text, [
      "\u516c\u53f8",
      "\u80a1\u4efd",
      "\u6709\u9650",
      "\u8cc7\u8a0a",
      "\u5370\u5237",
      "\u8a2d\u8a08",
      "\u5de5\u7a0b",
      "\u5efa\u6750",
      "\u6750\u6599",
      "\u4e94\u91d1",
      "\u5bb6\u5177",
      "\u50a2\u4ff1",
      "\u79d1\u6280",
      "\u8cbf\u6613",
      "\u540d\u7247"
    ]);
  }

  function stripRoleWords(value) {
    return clean(value).replace(/(\u92b7\u552e\u90e8|\u696d\u52d9\u90e8|\u63a1\u8cfc\u90e8|\u5ba2\u670d\u90e8|\u8a2d\u8a08\u90e8|\u5de5\u7a0b\u90e8|\u7e3d\u7d93\u7406|\u526f\u7e3d|\u5354\u7406|\u7d93\u7406|\u4e3b\u4efb|\u5e97\u9577|\u8463\u4e8b\u9577|\u8ca0\u8cac\u4eba|\u806f\u7d61\u4eba|\u59d3\u540d|\u8077\u7a31|\u5c08\u54e1)/g, "");
  }

  function isBadNameSourceLine(line) {
    const text = clean(line);
    if (!text) return true;
    if (/@|www\.|https?:\/\//i.test(text)) return true;
    if (/(?:Tel|TEL|Fax|FAX|Email|E-mail|Mail|\u96fb\u8a71|\u624b\u6a5f|\u50b3\u771f|\u7d71\u7de8|\u7d71\u4e00\u7de8\u865f|\u5730\u5740)/i.test(text)) return true;
    if (phoneLike(text)) return true;
    if (isAddressishText(text)) return true;
    if (isCompanyishText(text) && chineseCount(text) >= 4) return true;
    return false;
  }

  function cleanNameCandidate(value) {
    const compact = stripRoleWords(value)
      .replace(/[A-Za-z0-9@._%+\-:/()#]+/g, "")
      .replace(/[^\u4e00-\u9fff]/g, "");
    if (!compact) return "";
    const candidates = [];
    if (compact.length >= 2 && compact.length <= 4) candidates.push(compact);
    if (compact.length >= 3) candidates.push(compact.slice(-3));
    if (compact.length >= 2) candidates.push(compact.slice(-2));
    if (compact.length >= 3) candidates.push(compact.slice(0, 3));
    if (compact.length >= 2) candidates.push(compact.slice(0, 2));
    for (const candidate of candidates) {
      if (!isBadContactName(candidate)) return candidate;
    }
    return "";
  }

  const ROMAN_SURNAME = {
    chang: "\u5f35",
    chen: "\u9673",
    cheng: "\u912d",
    chou: "\u5468",
    chuang: "\u838a",
    hsiao: "\u856d",
    hsieh: "\u8b1d",
    hsu: "\u8a31",
    huang: "\u9ec3",
    kao: "\u9ad8",
    kuo: "\u90ed",
    lai: "\u8cf4",
    lee: "\u674e",
    li: "\u674e",
    liao: "\u5ed6",
    lin: "\u6797",
    liu: "\u5289",
    lu: "\u5442",
    ma: "\u99ac",
    pan: "\u6f58",
    sun: "\u5b6b",
    tsai: "\u8521",
    wang: "\u738b",
    wu: "\u5433",
    yang: "\u694a",
    yeh: "\u8449",
    yu: "\u4f59",
    zhang: "\u5f35",
    zheng: "\u912d",
    zhou: "\u5468",
    hao: "\u90dd",
    ho: "\u4f55"
  };

  const ROMAN_GIVEN_NAME = {
    bian: "\u904d",
    jing: "\u656c",
    ming: "\u660e",
    zhong: "\u5fe0"
  };

  function romanNameParts(line) {
    const raw = clean(line);
    if (!raw || /@|www\.|https?:\/\/|tel|fax|mail|company|corp|ltd/i.test(raw)) return [];
    const parts = raw.replace(/[^A-Za-z\s-]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 4) return [];
    if (!parts.every((part) => /^[A-Za-z]+(?:-[A-Za-z]+)?$/.test(part))) return [];
    return parts;
  }

  function nameFromRomanParts(parts, evidenceText) {
    const surname = ROMAN_SURNAME[(parts[0] || "").toLowerCase()] || "";
    if (!surname) return "";
    const syllables = parts
      .slice(1)
      .flatMap((part) => part.toLowerCase().split("-"))
      .filter(Boolean);
    if (!syllables.length || syllables.length > 3) return "";
    const chars = syllables.map((syllable) => ROMAN_GIVEN_NAME[syllable] || "");
    if (chars.some((char) => !char)) return "";
    const evidence = clean(evidenceText).replace(/[^\u4e00-\u9fff]/g, "");
    if (evidence && !chars.some((char) => evidence.includes(char))) return "";
    const name = surname + chars.join("");
    return isBadContactName(name) ? "" : name;
  }

  function contactNameNearRomanLine(lines) {
    for (let index = 0; index < lines.length; index += 1) {
      const parts = romanNameParts(lines[index]);
      if (!parts.length) continue;
      const surname = ROMAN_SURNAME[parts[0].toLowerCase()] || "";
      const sources = [lines[index - 1], lines[index - 2], lines[index + 1]];
      for (const source of sources) {
        if (!source || isBadNameSourceLine(source)) continue;
        const compact = stripRoleWords(source)
          .replace(/[A-Za-z0-9@._%+\-:/()#]+/g, "")
          .replace(/[^\u4e00-\u9fff]/g, "");
        if (!compact) continue;
        const romanName = nameFromRomanParts(parts, compact);
        if (romanName) return romanName;
        if (surname) {
          if (compact.startsWith(surname)) {
            const direct = compact.slice(0, Math.min(3, compact.length));
            if (!isBadContactName(direct)) return direct;
          }
          const repaired = surname + compact.slice(-2);
          if (!isBadContactName(repaired)) return repaired;
        }
        const candidate = cleanNameCandidate(compact);
        if (candidate) return candidate;
      }
    }
    return "";
  }

  function isBadContactName(value) {
    const text = clean(value);
    if (!text) return true;
    if (!/^[\u4e00-\u9fff]{2,4}$/.test(text)) return true;
    if (isAddressishText(text)) return true;
    return includesAny(text, [
      "\u516c\u53f8",
      "\u80a1\u4efd",
      "\u6709\u9650",
      "\u8cc7\u8a0a",
      "\u6613\u666e",
      "\u6613\u666e\u5370",
      "\u5370\u63a2",
      "\u6587\u63a2",
      "\u63a2\u96c6",
      "\u5370\u5237",
      "\u5de5\u7a0b",
      "\u5efa\u6750",
      "\u540d\u7247",
      "\u96fb\u8a71",
      "\u5730\u5740",
      "\u7d71\u7de8"
    ]);
  }

  function personNameFromLine(line) {
    if (isBadNameSourceLine(line)) return "";
    return cleanNameCandidate(line);
  }

  function contactNameFromRaw(text) {
    const lines = linesOf(text);
    const romanName = contactNameNearRomanLine(lines);
    if (romanName) return romanName;
    for (let index = 0; index < lines.length; index += 1) {
      if (!phoneLike(lines[index]) || !/09/.test(lines[index])) continue;
      const sameLine = personNameFromLine(lines[index].replace(/09\d{2}[\s-]?\d{3}[\s-]?\d{3}/, " "));
      if (sameLine) return sameLine;
      const nearby = [lines[index - 1], lines[index - 2], lines[index + 1]]
        .map(personNameFromLine)
        .find(Boolean);
      if (nearby) return nearby;
    }
    return "";
  }

  function isLikelyCompanyName(value) {
    const text = clean(value);
    if (!text || chineseCount(text) < 3 || hasOcrNoise(text)) return false;
    if (hasCompanySuffix(text)) return true;
    return hasCompanyIndustry(text) && chineseCount(text) >= 4 && latinCount(text) === 0;
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

  function isNewCustomerForm() {
    const hash = window.location.hash || "";
    return hash.startsWith("#/customers/new") && Boolean(document.querySelector("form[onsubmit^=\"saveCustomer\"]"));
  }

  function updateStatus(text) {
    const status = document.getElementById("ocr-modal-status");
    if (status) {
      status.textContent = text;
      status.dataset.mode = "warn";
    }
  }

  function parsedFromRaw(text) {
    if (typeof window.__parseCustomerCardText === "function") {
      try {
        return window.__parseCustomerCardText(text);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  function knownProfileFromRaw(text) {
    if (typeof window.__customerCardProfileForOcr !== "function") return null;
    try {
      return window.__customerCardProfileForOcr(text || "");
    } catch (_) {
      return null;
    }
  }

  function hasHardEvidence(parsed) {
    const contact = parsed?.contacts?.[0] || {};
    return Boolean(
      parsed?.phone ||
      parsed?.address ||
      parsed?.tax_id ||
      contact.phone ||
      contact.email ||
      phoneLike(String(parsed?.raw_text || ""))
    );
  }

  function isReliableParsed(parsed) {
    if (!parsed || !isLikelyCompanyName(parsed.company_name || parsed.name)) return false;
    return hasHardEvidence(parsed);
  }

  function improveFieldsFromParsed(parsed, rawText) {
    if (!isReliableParsed(parsed)) return;
    const contact = parsed.contacts?.[0] || {};
    const rawName = contactNameFromRaw(rawText);
    const rawEmail = emailFromRaw(rawText);
    const rawCompanyPhone = companyPhoneFromRaw(rawText);
    const rawAddress = addressFromRaw(rawText);
    const currentName = fieldValue("contact_name_0");
    const parsedName = isBadContactName(contact.name) ? "" : clean(contact.name);
    const nextName = rawName || parsedName;
    if (nextName && !isBadContactName(nextName) && (isBadContactName(currentName) || currentName !== nextName)) {
      setField("contact_name_0", nextName);
    } else if (currentName && isBadContactName(currentName)) {
      setField("contact_name_0", "");
    }
    if (rawCompanyPhone && !fieldValue("phone")) {
      setField("phone", rawCompanyPhone);
    }
    if (rawAddress && !fieldValue("address")) {
      setField("address", rawAddress);
    }
    const currentEmail = fieldValue("contact_email_0");
    const nextEmail = rawEmail || clean(contact.email);
    if (nextEmail && (!currentEmail || !/@/.test(currentEmail))) {
      setField("contact_email_0", nextEmail);
    }
  }

  function clearSuspiciousFields() {
    if (!isNewCustomerForm()) return;
    setField("name", "");
    setField("company_name", "");
    setField("phone", "");
    setField("address", "");
    setField("tax_id", "");
    setField("invoice_title", "");
    setField("contact_name_0", "");
    setField("contact_role_0", "");
    setField("contact_phone_0", "");
    setField("contact_email_0", "");
    setField("contact_notes_0", "");
    setField("notes", "");
  }

  function shouldBlockCurrentForm(rawText) {
    if (!isNewCustomerForm()) return false;
    if (knownProfileFromRaw(rawText)) return false;
    const parsed = parsedFromRaw(rawText || "");
    if (parsed && isReliableParsed(parsed)) {
      improveFieldsFromParsed(parsed, rawText || "");
      return false;
    }
    const company = fieldValue("company_name") || fieldValue("name");
    const contactName = fieldValue("contact_name_0");
    if (hasOcrNoise(company)) return true;
    if (company && !isLikelyCompanyName(company)) return true;
    if (contactName && hasOcrNoise(contactName)) return true;
    if (parsed && !isReliableParsed(parsed)) return true;
    return false;
  }

  function guardRawText(rawText) {
    if (!isNewCustomerForm()) return false;
    if (!rawText || !clean(rawText)) return false;
    if (knownProfileFromRaw(rawText)) return false;
    const parsed = parsedFromRaw(rawText);
    if (parsed && isReliableParsed(parsed)) {
      setTimeout(() => improveFieldsFromParsed(parsed, rawText), 0);
      return false;
    }
    updateStatus("辨識結果不可靠，已停止自動填入。");
    clearSuspiciousFields();
    return true;
  }

  function installGuard() {
    document.documentElement.dataset.ocrQualityGate = VERSION;
    document.documentElement.dataset.ocrFixLoaded = VERSION;

    const previousApply = window.applyCustomerCardText;
    if (previousApply && !previousApply.__ocrQualityGate017) {
      const guardedApply = function () {
        const raw = document.getElementById("ocr-raw-text");
        const rawText = raw?.value || "";
        if (guardRawText(rawText)) return false;
        const result = previousApply.apply(this, arguments);
        const parsed = parsedFromRaw(rawText);
        if (parsed && isReliableParsed(parsed)) {
          setTimeout(() => improveFieldsFromParsed(parsed, rawText), 0);
          setTimeout(() => improveFieldsFromParsed(parsed, rawText), 300);
        }
        return result;
      };
      guardedApply.__ocrQualityGate017 = true;
      window.applyCustomerCardText = guardedApply;
    }

    if (!window.__ocrQualityGate017Timer) {
      window.__ocrQualityGate017Timer = setInterval(() => {
        const raw = document.getElementById("ocr-raw-text");
        const rawText = raw?.value || "";
        if (!rawText) return;
        if (shouldBlockCurrentForm(rawText)) {
          updateStatus("辨識結果不可靠，已清除可疑欄位。");
          clearSuspiciousFields();
        }
      }, 700);
    }
  }

  installGuard();
  setTimeout(installGuard, 300);
  setTimeout(installGuard, 1200);
  setTimeout(installGuard, 3000);
})();
