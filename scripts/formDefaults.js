(function (global) {
  function getCustomNameValue() {
    if (!nameCustomInput) return "";
    return nameCustomInput.value.trim();
  }

  function applyNameValueToItems() {
    parsedItems.forEach((item) => {
      if (isCustomNameMode) {
        item.name = getCustomNameValue();
        return;
      }

      if (defaultName === NAME_FROM_TEXT_VALUE) {
        item.name = item.nameFromText || "";
        return;
      }

      item.name = defaultName;
    });
  }

  function updateNameInputModeUI() {
    if (nameDefaultSelect) {
      nameDefaultSelect.classList.toggle("is-hidden", isCustomNameMode);
    }

    if (nameCustomInputWrap) {
      nameCustomInputWrap.classList.toggle("is-visible", isCustomNameMode);
    }
  }

  function getCustomHigherFormationValue() {
    if (!higherFormationCustomInput) return "";
    return higherFormationCustomInput.value.trim();
  }

  function applyHigherFormationValueToItems() {
    parsedItems.forEach((item) => {
      if (isCustomHigherFormationMode) {
        item.higher_formation = getCustomHigherFormationValue();
        return;
      }

      item.higher_formation = defaultHigherFormation;
    });
  }

  function updateHigherFormationInputModeUI() {
    if (higherFormationDefaultSelect) {
      higherFormationDefaultSelect.classList.toggle("is-hidden", isCustomHigherFormationMode);
    }

    if (higherFormationCustomInputWrap) {
      higherFormationCustomInputWrap.classList.toggle("is-visible", isCustomHigherFormationMode);
    }
  }

  function initFormDefaults() {
    updateNameInputModeUI();
    updateHigherFormationInputModeUI();

    if (nameCustomToggle) {
      nameCustomToggle.addEventListener("change", () => {
        isCustomNameMode = nameCustomToggle.checked;
        updateNameInputModeUI();
        applyNameValueToItems();
        global.TablePresenter.renderTableRows();
      });
    }

    if (nameCustomInput) {
      nameCustomInput.addEventListener("input", () => {
        if (!isCustomNameMode) return;
        applyNameValueToItems();
        global.TablePresenter.renderTableRows();
      });
    }

    if (higherFormationCustomToggle) {
      higherFormationCustomToggle.addEventListener("change", () => {
        isCustomHigherFormationMode = higherFormationCustomToggle.checked;
        updateHigherFormationInputModeUI();
        applyHigherFormationValueToItems();
        global.TablePresenter.renderTableRows();
        global.ExportFileName.syncExportFileName(true);
      });
    }

    if (higherFormationCustomInput) {
      higherFormationCustomInput.addEventListener("input", () => {
        if (!isCustomHigherFormationMode) return;
        applyHigherFormationValueToItems();
        global.TablePresenter.renderTableRows();
        global.ExportFileName.syncExportFileName(true);
      });
    }
  }

  global.FormDefaults = {
    applyNameValueToItems,
    applyHigherFormationValueToItems,
    getCustomHigherFormationValue,
    initFormDefaults
  };
})(window);
