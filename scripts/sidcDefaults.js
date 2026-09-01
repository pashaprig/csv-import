(function (global) {
  const sidcModule = typeof createSidcModule === "function"
    ? createSidcModule({
        sidcOptions: SIDC_OPTIONS,
        iconBasePath: SIDC_ICON_BASE_PATH,
        unknownIconPath: SIDC_UNKNOWN_ICON_PATH,
        sidcDefaultSelect,
        sidcSelectButton,
        sidcSelectOptions
      })
    : null;

  function getSidcOptionByValue(value) {
    return sidcModule ? sidcModule.getSidcOptionByValue(value) : null;
  }

  function getSidcIconPath(value) {
    return sidcModule ? sidcModule.getSidcIconPath(value) : SIDC_UNKNOWN_ICON_PATH;
  }

  function applySidcIconFallback(image) {
    if (sidcModule) {
      sidcModule.applySidcIconFallback(image);
    }
  }

  function getEffectiveSidcValue(value) {
    return sidcModule ? sidcModule.getEffectiveSidcValue(value, isProbableSidc, isHqSidc) : String(value || "");
  }

  function applyDefaultSidcToAutoRows(nextSidcValue) {
    const effectiveSidc = getEffectiveSidcValue(nextSidcValue);
    parsedItems.forEach((row) => {
      if (row.sidcManualMode !== true) {
        row.sidc = effectiveSidc;
      }
    });
    global.TablePresenter.renderTableRows();
  }

  function selectFirstRouteSidcOption() {
    if (!sidcModule) return false;
    const routeSidcOption = SIDC_OPTIONS.find((item) => item.line === true);
    if (!routeSidcOption) {
      return false;
    }

    defaultSidc = routeSidcOption.value;
    sidcModule.updateSidcSelectedText(defaultSidc);
    applyDefaultSidcToAutoRows(defaultSidc);
    return true;
  }

  function selectFirstPolygonSidcOption() {
    if (!sidcModule) return false;
    const polygonSidcOption = SIDC_OPTIONS.find((item) => item.polygon === true);
    if (!polygonSidcOption) {
      return false;
    }

    defaultSidc = polygonSidcOption.value;
    sidcModule.updateSidcSelectedText(defaultSidc);
    applyDefaultSidcToAutoRows(defaultSidc);
    return true;
  }

  function selectFirstSidcOption() {
    if (!sidcModule) return false;
    const firstSidcOption = SIDC_OPTIONS[0];
    if (!firstSidcOption) {
      return false;
    }

    defaultSidc = firstSidcOption.value;
    sidcModule.updateSidcSelectedText(defaultSidc);
    applyDefaultSidcToAutoRows(defaultSidc);
    return true;
  }

  // Reacts to mode switches (dispatched by processingMode.js) without a direct function-reference coupling.
  function handleProcessingModeChange(event) {
    const mode = event && event.detail ? event.detail.mode : null;
    if (mode === "route") {
      selectFirstRouteSidcOption();
    } else if (mode === "polygon") {
      selectFirstPolygonSidcOption();
    } else if (mode === "point") {
      selectFirstSidcOption();
    }
  }

  function initSidcDefaults() {
    document.addEventListener("csv:processingmodechange", handleProcessingModeChange);

    if (!sidcModule) return;

    sidcModule.bindSidcDefaultInput({
      defaultSidc,
      onDefaultSidcChange: (value) => {
        defaultSidc = value;
      },
      getEffectiveSidcValueForCurrentMode: (value) => getEffectiveSidcValue(value),
      onApplyDefaultSidcToRows: (effectiveSidc) => {
        applyDefaultSidcToAutoRows(effectiveSidc);
      }
    });

    if (sidcProbableCheckbox) {
      sidcProbableCheckbox.addEventListener("change", () => {
        isProbableSidc = sidcProbableCheckbox.checked;
        parsedItems.forEach((item) => {
          if (item.sidc) {
            item.sidc = isProbableSidc
              ? sidcModule.getProbableSidcValue(item.sidc)
              : sidcModule.getNonProbableSidcValue(item.sidc);
          }
        });
        global.TablePresenter.renderTableRows();
      });
    }

    if (sidcHqCheckbox) {
      sidcHqCheckbox.addEventListener("change", () => {
        isHqSidc = sidcHqCheckbox.checked;
        parsedItems.forEach((item) => {
          if (item.sidc) {
            item.sidc = isHqSidc
              ? sidcModule.getHqSidcValue(item.sidc)
              : sidcModule.getNonHqSidcValue(item.sidc);
          }
        });
        global.TablePresenter.renderTableRows();
      });
    }
  }

  global.SidcDefaults = {
    getSidcOptionByValue,
    getSidcIconPath,
    applySidcIconFallback,
    getEffectiveSidcValue,
    applyDefaultSidcToAutoRows,
    selectFirstRouteSidcOption,
    selectFirstPolygonSidcOption,
    selectFirstSidcOption,
    initSidcDefaults
  };
})(window);
