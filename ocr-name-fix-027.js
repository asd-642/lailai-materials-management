(function () {
  const VERSION = "027";

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

  function setField(name, value) {
    const target = document.querySelector(`[name="${name}"]`);
    if (!target) return;
    target.value = value || "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fieldValue(name) {
    return clean(document.querySelector(`[name="${name}"]`)?.value || "");
  }

  function hasAddressWord(value) {
    return /(\u5e02|\u7e23|\u9109|\u93ae|\u5340|\u6751|\u91cc|\u8def|\u8857|\u5927\u9053|\u6bb5|\u5df7|\u5f04|\u865f|\u6a13|\u5ba4)/.test(clean(value));
  }

  function hasCompanyWord(value) {
    return /(\u516c\u53f8|\u80a1\u4efd|\u6709\u9650|\u540d\u7247|\u8cc7\u8a0a|\u5370\u5237|\u8a2d\u8a08|\u5de5\u7a0b|\u5efa\u6750|\u6750\u6599|\u79d1\u6280|\u8cbf\u6613)/.test(clean(value));
  }

  function isBadName(value) {
    const text = clean(value);
    return !/^[\u4e00-\u9fff]{2,4}$/.test(text) || hasAddressWord(text) || hasCompanyWord(text);
  }

  function badSourceLine(line) {
    const text = clean(line);
    if (!text) return true;
    if (/@|www\.|https?:\/\//i.test(text)) return true;
    if (/(?:Tel|TEL|Fax|FAX|Email|E-mail|Mail|\u96fb\u8a71|\u624b\u6a5f|\u50b3\u771f|\u7d71\u7de8|\u7d71\u4e00\u7de8\u865f|\u5730\u5740)/i.test(text)) return true;
    if (/\d{3,}/.test(text)) return true;
    if (hasAddressWord(text)) return true;
    if (hasCompanyWord(text) && (text.match(/[\u4e00-\u9fff]/g) || []).length >= 4) return true;
    return false;
  }

  function stripRoleWords(value) {
    return clean(value).replace(/(\u92b7\u552e\u90e8|\u696d\u52d9\u90e8|\u63a1\u8cfc\u90e8|\u5ba2\u670d\u90e8|\u8a2d\u8a08\u90e8|\u5de5\u7a0b\u90e8|\u7e3d\u7d93\u7406|\u526f\u7e3d|\u5354\u7406|\u7d93\u7406|\u4e3b\u4efb|\u5e97\u9577|\u8463\u4e8b\u9577|\u8ca0\u8cac\u4eba|\u806f\u7d61\u4eba|\u59d3\u540d|\u8077\u7a31|\u5c08\u54e1)/g, "");
  }

  const SURNAME = {
    chang: "\u5f35",
    chen: "\u9673",
    cheng: "\u912d",
    chou: "\u5468",
    hsu: "\u8a31",
    huang: "\u9ec3",
    kao: "\u9ad8",
    kuo: "\u90ed",
    lai: "\u8cf4",
    lee: "\u674e",
    li: "\u674e",
    lin: "\u6797",
    liu: "\u5289",
    tsai: "\u8521",
    wang: "\u738b",
    wu: "\u5433",
    yang: "\u694a",
    yeh: "\u8449",
    yu: "\u4f59",
    hao: "\u90dd",
    ho: "\u4f55"
  };

  const GIVEN = {
    bian: "\u904d",
    jing: "\u656c",
    ming: "\u660e",
    zhong: "\u5fe0"
  };

  function romanParts(line) {
    const raw = clean(line);
    if (!raw || /@|www\.|https?:\/\/|tel|fax|mail|company|corp|ltd/i.test(raw)) return [];
    const parts = raw.replace(/[^A-Za-z\s-]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 4) return [];
    return parts.every((part) => /^[A-Za-z]+(?:-[A-Za-z]+)?$/.test(part)) ? parts : [];
  }

  function nameFromRoman(parts, evidence) {
    const surname = SURNAME[(parts[0] || "").toLowerCase()] || "";
    if (!surname) return "";
    const syllables = parts.slice(1).flatMap((part) => part.toLowerCase().split("-")).filter(Boolean);
    if (!syllables.length || syllables.length > 3) return "";
    const chars = syllables.map((syllable) => GIVEN[syllable] || "");
    if (chars.some((char) => !char)) return "";
    const chineseEvidence = clean(evidence).replace(/[^\u4e00-\u9fff]/g, "");
    if (chineseEvidence && !chars.some((char) => chineseEvidence.includes(char))) return "";
    const name = surname + chars.join("");
    return isBadName(name) ? "" : name;
  }

  function compactChinese(line) {
    return stripRoleWords(line)
      .replace(/[A-Za-z0-9@._%+\-:/()#]+/g, "")
      .replace(/[^\u4e00-\u9fff]/g, "");
  }

  function nameCandidate(line) {
    if (badSourceLine(line)) return "";
    const compact = compactChinese(line);
    const candidates = [
      compact,
      compact.slice(-3),
      compact.slice(-2),
      compact.slice(0, 3),
      compact.slice(0, 2)
    ].filter((value) => value.length >= 2 && value.length <= 4);
    return candidates.find((value) => !isBadName(value)) || "";
  }

  function extractName(rawText) {
    const lines = linesOf(rawText);
    for (let index = 0; index < lines.length; index += 1) {
      const parts = romanParts(lines[index]);
      if (!parts.length) continue;
      for (const source of [lines[index - 1], lines[index - 2], lines[index + 1]]) {
        if (!source || badSourceLine(source)) continue;
        const fromRoman = nameFromRoman(parts, source);
        if (fromRoman) return fromRoman;
        const surname = SURNAME[parts[0].toLowerCase()] || "";
        const compact = compactChinese(source);
        if (surname && compact) {
          const repaired = surname + compact.slice(-2);
          if (!isBadName(repaired)) return repaired;
        }
        const fromChinese = nameCandidate(source);
        if (fromChinese) return fromChinese;
      }
    }
    for (let index = 0; index < lines.length; index += 1) {
      if (!/09/.test(lines[index])) continue;
      const sameLine = nameCandidate(lines[index].replace(/09\d{2}[\s-]?\d{3}[\s-]?\d{3}/, " "));
      if (sameLine) return sameLine;
      const nearby = [lines[index - 1], lines[index - 2], lines[index + 1]].map(nameCandidate).find(Boolean);
      if (nearby) return nearby;
    }
    return "";
  }

  function shouldReplace(current, next) {
    if (!next || isBadName(next)) return false;
    if (!current || isBadName(current)) return true;
    if (current !== next && current.slice(0, 2) === next.slice(0, 2)) return true;
    return false;
  }

  function correctContactName() {
    const rawText = document.getElementById("ocr-raw-text")?.value || "";
    if (!rawText) return;
    const next = extractName(rawText);
    const current = fieldValue("contact_name_0");
    if (shouldReplace(current, next)) setField("contact_name_0", next);
  }

  function install() {
    document.documentElement.dataset.ocrNameFix = VERSION;
    const previousApply = window.applyCustomerCardText;
    if (previousApply && !previousApply.__ocrNameFix027) {
      const wrapped = function () {
        const result = previousApply.apply(this, arguments);
        [0, 120, 400, 900, 1400].forEach((delay) => setTimeout(correctContactName, delay));
        return result;
      };
      wrapped.__ocrNameFix027 = true;
      window.applyCustomerCardText = wrapped;
    }
    if (!window.__ocrNameFix027Timer) {
      window.__ocrNameFix027Timer = setInterval(correctContactName, 300);
    }
  }

  install();
  setTimeout(install, 300);
  setTimeout(install, 1200);
})();
