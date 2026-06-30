(function (global) {
  const COLUMNS_DEFAULTS_STORAGE_KEY = "csv.default.selectedColumns";

  function saveSelectedColumns(columns) {
    const selectedColumns = columns.filter((col) => col.selected).map((col) => col.value);

    try {
      localStorage.setItem(COLUMNS_DEFAULTS_STORAGE_KEY, JSON.stringify(selectedColumns));
    } catch (_error) {
      // Ignore storage errors (private mode/quota/etc.).
    }
  }

  function applySavedSelectedColumns(columns) {
    try {
      const rawValue = localStorage.getItem(COLUMNS_DEFAULTS_STORAGE_KEY);
      if (!rawValue) return;

      const parsed = JSON.parse(rawValue);
      if (!Array.isArray(parsed)) return;

      const selectedSet = new Set(parsed.filter((value) => typeof value === "string"));
      columns.forEach((col) => {
        col.selected = selectedSet.has(col.value);
      });
    } catch (_error) {
      // Ignore broken payloads and keep built-in defaults.
    }
  }

  global.ColumnsDefaults = {
    saveSelectedColumns,
    applySavedSelectedColumns
  };
})(window);
