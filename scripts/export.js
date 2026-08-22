(function (global) {
  function escapeField(value) {
    const text = String(value == null ? "" : value).replace(/"/g, '""');
    return `"${text}"`;
  }

  function formatExportValue(column, value, item) {
    let text = value == null ? "" : String(value);

    if (column.value === "coordinates") {
      const trimmed = text.trim();
      const geometryType = item.geometry ? String(item.geometry).toUpperCase() : "POINT";
      if (trimmed && !/^\s*(POINT|LINESTRING|POLYGON)\s*\(.+\)\s*$/i.test(trimmed)) {
        text = `${geometryType} (${trimmed})`;
      }
    }

    return escapeField(text);
  }

  function buildCsvText(columns, items) {
    const headers = columns.map((column) => escapeField(column.value)).join(",");
    const rows = items
      .map((item) => columns.map((column) => formatExportValue(column, item[column.value] || "", item)).join(","))
      .join("\n");

    return `${headers}\n${rows}`;
  }

  function getPolygonImportColumns(columns) {
    const byValue = new Map(columns.map((column) => [column.value, column]));
    return ["sidc", "coordinates", "name"]
      .map((columnValue) => byValue.get(columnValue))
      .filter(Boolean);
  }

  function normalizeDownloadName(name) {
    const safeName = name.replace(/[\\/:*?"<>|]/g, "-");
    return /\.csv$/i.test(safeName) ? safeName : `${safeName}.csv`;
  }

  function downloadCsv(text, fileName) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = normalizeDownloadName(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function attachCsvExportHandler(config) {
    const {
      exportButton,
      columns,
      getParsedItems,
      exportFileNameInput,
      buildDefaultExportFileName
    } = config;

    if (!exportButton) {
      return;
    }

    exportButton.addEventListener("click", () => {
      const selectedColumns = columns.filter((column) => column.selected);
      const currentMode = typeof global.getCurrentProcessingMode === "function"
        ? global.getCurrentProcessingMode()
        : "point";
      const exportColumns = currentMode === "polygon"
        ? getPolygonImportColumns(columns)
        : selectedColumns;
      const parsedItems = getParsedItems();
      const text = buildCsvText(exportColumns, parsedItems);
      const exportNameRaw = exportFileNameInput && exportFileNameInput.value.trim()
        ? exportFileNameInput.value.trim()
        : buildDefaultExportFileName();

      downloadCsv(text, exportNameRaw);
    });
  }

  global.attachCsvExportHandler = attachCsvExportHandler;
})(window);
