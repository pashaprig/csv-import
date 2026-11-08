(function (global) {
  function populateSelectOptions(selectElement, options, selectedValue) {
    if (!selectElement) return;
    selectElement.innerHTML = "";

    options.forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.description;
      option.selected = selectedValue === optionData.value;
      selectElement.appendChild(option);
    });
  }

  function normalizeQuantity(value) {
    if (value == null) {
      return "";
    }

    const match = String(value).trim().match(/(-?\d+)/);
    return match ? match[1] : "";
  }

  function isStrictQuantity(value) {
    if (value == null) {
      return false;
    }

    return /^-?\d+$/.test(String(value).trim());
  }

  function getCurrentDateUa() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  // Shared object-boundary rule for all input modes (points/routes/polygons): a ";" immediately
  // followed by a line break (or end of text) separates one object from the next. Falls back to
  // blank-line blocks, then the whole text, so content written before this rule still works.
  function splitObjectBlocks(text) {
    const source = String(text || "")
      .replace(/\r\n?/g, "\n")
      .trim();

    if (!source) {
      return [];
    }

    const bySemicolon = source
      .split(/;\s*(?:\n+|$)/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (bySemicolon.length > 1) {
      return bySemicolon;
    }

    const byBlankLine = source
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter(Boolean);

    if (byBlankLine.length > 1) {
      return byBlankLine;
    }

    return [source];
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  global.Helpers = {
    escapeHtml,
    populateSelectOptions,
    normalizeQuantity,
    isStrictQuantity,
    getCurrentDateUa,
    splitObjectBlocks
  };
})(window);
