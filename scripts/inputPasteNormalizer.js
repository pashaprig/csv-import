(function (global) {
  function normalizeWhitespaceForRow(text) {
    return String(text || "")
      .replace(/\s*\n+\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function splitByCoordinateStarts(text) {
    const normalizedText = global.CoordinateUtils.normalizeCyrillicHomoglyphsInCoordinates(
      String(text || "").replace(/\r\n?/g, "\n")
    );
    const coordinateRegex = global.CoordinateUtils.createCoordinateScanRegex();
    const matches = Array.from(normalizedText.matchAll(coordinateRegex));

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

  function insertTextAtCursor(textarea, insertedText) {
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);

    textarea.value = `${before}${insertedText}${after}`;

    const caretPosition = start + insertedText.length;
    textarea.setSelectionRange(caretPosition, caretPosition);
  }

  function bindCoordinatePasteAutoSplit(textarea) {
    if (!textarea) return;

    textarea.addEventListener("paste", (event) => {
      if (!event.clipboardData) {
        return;
      }

      const pastedText = event.clipboardData.getData("text");
      if (!pastedText) {
        return;
      }

      const normalizedText = splitByCoordinateStarts(pastedText);
      if (normalizedText === pastedText) {
        return;
      }

      event.preventDefault();
      insertTextAtCursor(textarea, normalizedText);
    });
  }

  function bindCoordinateHomoglyphAutoFix(textarea) {
    if (!textarea) return;

    textarea.addEventListener("input", () => {
      const original = textarea.value;
      const fixed = global.CoordinateUtils.normalizeCyrillicHomoglyphsInCoordinates(original);
      if (fixed === original) {
        return;
      }

      // Character-for-character replacement, so the caret position stays valid as-is.
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = fixed;
      textarea.setSelectionRange(start, end);
    });
  }

  global.splitByCoordinateStarts = splitByCoordinateStarts;
  global.bindCoordinatePasteAutoSplit = bindCoordinatePasteAutoSplit;
  global.bindCoordinateHomoglyphAutoFix = bindCoordinateHomoglyphAutoFix;
})(window);
