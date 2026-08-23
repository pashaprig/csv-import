(function (global) {
  function resolveCurrentProcessingMode() {
    return typeof window.getCurrentProcessingMode === "function"
      ? window.getCurrentProcessingMode()
      : "point";
  }

  function renderTableHeaders() {
    if (!global.TableRenderer) return;
    global.TableRenderer.renderTableHeaders({
      tableHeaderRow,
      columns: COLUMNS
    });
  }

  function renderTableRows() {
    if (!global.TableRenderer) return;
    global.TableRenderer.renderTableRows({
      outputTableBody,
      parsedItems,
      columns: COLUMNS,
      geometry: GEOMETRY,
      sourceTypes: SOURCE_TYPES,
      higherFormations: HIGHER_FORMATIONS,
      sidcOptions: SIDC_OPTIONS,
      defaultSidc,
      getEffectiveSidcValue: global.SidcDefaults.getEffectiveSidcValue,
      getSidcOptionByValue: global.SidcDefaults.getSidcOptionByValue,
      getSidcIconPath: global.SidcDefaults.getSidcIconPath,
      applySidcIconFallback: global.SidcDefaults.applySidcIconFallback
    });
  }

  function renderColumnCheckboxes() {
    if (!global.TableRenderer) return;
    global.TableRenderer.renderColumnCheckboxes({
      columnsCheckboxes,
      columns: COLUMNS,
      onColumnsChanged: () => {
        renderTableHeaders();
        renderTableRows();
      }
    });
  }

  function prepareTable() {
    const text = inputText.value.trim();
    outputTableBody.innerHTML = "";
    parsedItems = [];

    if (!text) {
      updateExportControlsState();
      return;
    }

    const currentMode = resolveCurrentProcessingMode();

    if (currentMode === "route") {
      parsedItems = global.RouteParser.parseRouteText(text);
    } else if (currentMode === "polygon") {
      const polygonParser = typeof global.parsePolygonText === "function"
        ? global.parsePolygonText
        : () => [];
      parsedItems = polygonParser(text);
    } else {
      const rows = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      parsedItems = rows.map(line => global.PointParser.parseLine(line)).filter(Boolean);
    }

    parsedItems.forEach(item => {
      item.nameFromText = item.name || "";
      if (!item.geometry) {
        if (currentMode === "route") {
          item.geometry = "Linestring";
        } else if (currentMode === "polygon") {
          item.geometry = "Polygon";
        } else {
          item.geometry = defaultGeometry;
        }
      }
      if (!item.platform_type) {
        item.platform_type = defaultSourceType;
      }
      if (!item.sidc) {
        item.sidc = global.SidcDefaults.getEffectiveSidcValue(defaultSidc);
      }
      if (!item.higher_formation) {
        item.higher_formation = defaultHigherFormation;
      }
    });

    if (!parsedItems.length) {
      if (typeof openCsvTemplateModal === "function") {
        openCsvTemplateModal({
          modalTemplate,
          title: "Не вдалося розпізнати дані",
          message: "Введені дані не відповідають очікуваному формату і не можуть бути оброблені. Перевірте правильність введення або тип введеного тексту Точка/Маршрути/Полігони та спробуйте ще раз.",
          confirmText: "Зрозуміло",
          singleButton: true
        });
      }
      updateExportControlsState();
      return;
    }

    global.FormDefaults.applyNameValueToItems();
    global.FormDefaults.applyHigherFormationValueToItems();
    renderTableRows();
    updateExportControlsState();
  }

  function hasPreparedTableData() {
    return parsedItems.length > 0 || (outputTableBody && outputTableBody.children.length > 0);
  }

  function updatePrepareButtonLabel() {
    if (!prepareButton) return;
    prepareButton.textContent = hasPreparedTableData()
      ? "Оновити таблицю"
      : "Підготувати таблицю";
  }

  function handlePrepareButtonClick() {
    if (!hasPreparedTableData()) {
      prepareTable();
      return;
    }

    if (typeof openCsvTemplateModal !== "function") {
      prepareTable();
      return;
    }

    openCsvTemplateModal({
      modalTemplate,
      title: "Підтвердьте оновлення таблиці",
      message: "Дані в поточній таблиці будуть перезаписані. Ви впевнені, що хочете продовжити?",
      confirmText: "Оновити таблицю",
      cancelText: "Відміна",
      onConfirm: () => {
        prepareTable();
      }
    });
  }

  function updateExportControlsState() {
    const hasPreparedRows = parsedItems.length > 0;

    updatePrepareButtonLabel();

    if (exportButton) {
      exportButton.disabled = !hasPreparedRows;
    }

    if (exportFileNameInput) {
      exportFileNameInput.disabled = !hasPreparedRows;
    }
  }

  function setAllColumnsSelected(selected) {
    COLUMNS.forEach(col => {
      col.selected = selected;
    });
    renderTableHeaders();
    renderTableRows();
    renderColumnCheckboxes();
  }

  function bindDefaultSelect(selectElement, options, initialValue, setDefaultValue, applyToItem) {
    if (!selectElement) return;
    Helpers.populateSelectOptions(selectElement, options, initialValue);
    selectElement.addEventListener("change", () => {
      setDefaultValue(selectElement.value);
      parsedItems.forEach(item => {
        applyToItem(item, selectElement.value);
      });
      renderTableRows();
    });
  }

  function initTablePresenter() {
    if (window.ColumnsDefaults) {
      window.ColumnsDefaults.applySavedSelectedColumns(COLUMNS);
    }

    renderTableHeaders();
    renderColumnCheckboxes();

    bindDefaultSelect(
      nameDefaultSelect,
      NAME_OPTIONS,
      defaultName,
      (value) => {
        defaultName = value;
      },
      (item, value) => {
        if (isCustomNameMode) {
          return;
        }

        if (value === NAME_FROM_TEXT_VALUE) {
          item.name = item.nameFromText || "";
          return;
        }

        item.name = value;
      }
    );

    bindDefaultSelect(
      geometryDefaultSelect,
      GEOMETRY,
      defaultGeometry,
      (value) => {
        defaultGeometry = value;
      },
      (item, value) => {
        item.geometry = value;
      }
    );

    bindDefaultSelect(
      sourceTypeDefaultSelect,
      SOURCE_TYPES,
      defaultSourceType,
      (value) => {
        defaultSourceType = value;
      },
      (item, value) => {
        item.platform_type = value;
      }
    );

    bindDefaultSelect(
      higherFormationDefaultSelect,
      HIGHER_FORMATIONS,
      defaultHigherFormation,
      (value) => {
        defaultHigherFormation = value;
        global.FormDefaults.applyHigherFormationValueToItems();
        renderTableRows();
        global.ExportFileName.syncExportFileName();
      },
      (item, value) => {
        if (isCustomHigherFormationMode) {
          return;
        }

        item.higher_formation = value;
      }
    );

    if (selectAllColumnsButton) {
      selectAllColumnsButton.addEventListener("click", () => setAllColumnsSelected(true));
    }

    if (clearAllColumnsButton) {
      clearAllColumnsButton.addEventListener("click", () => setAllColumnsSelected(false));
    }

    if (saveDefaultColumnsButton) {
      saveDefaultColumnsButton.addEventListener("click", () => {
        if (!window.ColumnsDefaults) return;
        window.ColumnsDefaults.saveSelectedColumns(COLUMNS);
      });
    }

    prepareButton.addEventListener("click", handlePrepareButtonClick);
    updateExportControlsState();
  }

  global.TablePresenter = {
    renderTableHeaders,
    renderTableRows,
    renderColumnCheckboxes,
    prepareTable,
    hasPreparedTableData,
    updateExportControlsState,
    handlePrepareButtonClick,
    setAllColumnsSelected,
    initTablePresenter
  };
})(window);
