(function (global) {
  function buildDefaultExportFileName() {
    const customFormation = global.FormDefaults.getCustomHigherFormationValue();
    const formation = higherFormationDefaultSelect && higherFormationDefaultSelect.value
      ? higherFormationDefaultSelect.value
      : defaultHigherFormation || "export";
    const resolvedFormation = isCustomHigherFormationMode && customFormation
      ? customFormation
      : formation;
    return `${resolvedFormation} ${Helpers.getCurrentDateUa()}`;
  }

  function syncExportFileName(force = false) {
    if (!exportFileNameInput) return;
    const autoName = buildDefaultExportFileName();
    const currentValue = exportFileNameInput.value.trim();
    const shouldReplace = force || !currentValue || currentValue === lastAutoExportFileName;
    if (shouldReplace) {
      exportFileNameInput.value = autoName;
    }
    lastAutoExportFileName = autoName;
  }

  function initExportFileName() {
    if (exportFileNameInput) {
      exportFileNameInput.addEventListener("input", () => {
        if (!exportFileNameInput.value.trim()) {
          syncExportFileName(true);
        }
      });
      syncExportFileName(true);
    }

    if (typeof global.attachCsvExportHandler === "function") {
      global.attachCsvExportHandler({
        exportButton,
        columns: COLUMNS,
        getParsedItems: () => parsedItems,
        exportFileNameInput,
        buildDefaultExportFileName
      });
    }
  }

  global.ExportFileName = {
    buildDefaultExportFileName,
    syncExportFileName,
    initExportFileName
  };
})(window);
