(function (global) {
  function normalizeWhitespaceForRow(text) {
    return String(text || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function splitByMgrsCoordinates(text) {
    const normalizedText = String(text || "").replace(/\r\n?/g, "\n");
    const mgrsRegex = /\b\d{1,2}[C-HJ-NP-X][A-HJ-NP-Z]{2}(?:\d{2}|\d{4}|\d{6}|\d{8}|\d{10})\b/gi;
    const matches = Array.from(normalizedText.matchAll(mgrsRegex));

    if (matches.length < 2) {
      return normalizedText;
    }

    const rows = [];
    const leadingText = normalizeWhitespaceForRow(normalizedText.slice(0, matches[0].index));
    if (leadingText) {
      rows.push(leadingText);
    }

    matches.forEach((match, index) => {
      const rowStart = match.index;
      const rowEnd = index + 1 < matches.length ? matches[index + 1].index : normalizedText.length;
      const row = normalizeWhitespaceForRow(normalizedText.slice(rowStart, rowEnd));
      if (row) {
        rows.push(row);
      }
    });

    return rows.join("\n");
  }

  function insertNormalizedTextAtCursor(textarea, insertedText) {
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);

    textarea.value = `${before}${insertedText}${after}`;

    const caretPosition = start + insertedText.length;
    textarea.setSelectionRange(caretPosition, caretPosition);
  }

  function bindMgrsPasteNormalizer(textarea) {
    if (!textarea) return;

    textarea.addEventListener("paste", (event) => {
      if (!event.clipboardData) {
        return;
      }

      const pastedText = event.clipboardData.getData("text");
      if (!pastedText) {
        return;
      }

      const normalizedText = splitByMgrsCoordinates(pastedText);
      if (normalizedText === pastedText) {
        return;
      }

      event.preventDefault();
      insertNormalizedTextAtCursor(textarea, normalizedText);
    });
  }

  global.bindMgrsPasteNormalizer = bindMgrsPasteNormalizer;
})(window);
