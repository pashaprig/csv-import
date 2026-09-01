(function (global) {
  function getCustomNameValue() {
    if (!nameCustomInput) return "";
    return nameCustomInput.value.trim();
  }

  function isQuantityColumnSelected() {
    const quantityColumn = COLUMNS.find((col) => col.value === "quantity");
    return quantityColumn ? !!quantityColumn.selected : true;
  }

  function isQuantityMergedIntoName() {
    return isQuantityInNameMode || !isQuantityColumnSelected();
  }

  function getEffectiveNameFromText(item) {
    if (!isQuantityMergedIntoName()) {
      return item.nameFromText || "";
    }

    return [item.nameFromText, item.quantityFromText, item.additionalInfoFromText]
      .filter(Boolean)
      .join(" - ");
  }

  function applyNameValueToItems() {
    parsedItems.forEach((item) => {
      if (isCustomNameMode) {
        item.name = getCustomNameValue();
        return;
      }

      if (defaultName === NAME_FROM_TEXT_VALUE) {
        item.name = getEffectiveNameFromText(item);
        return;
      }

      item.name = defaultName;
    });
  }

  // Folds quantity/additional info into name (or restores them) based on the current merge mode.
  function applyQuantityMergeToItems() {
    const mergeActive = isQuantityMergedIntoName();
    parsedItems.forEach((item) => {
      if (mergeActive) {
        item.quantity = "";
        item.additional_information = "";
      } else {
        item.quantity = item.quantityFromText || "";
        item.additional_information = item.additionalInfoFromText || "";
      }
    });
    applyNameValueToItems();
  }

  function setQuantityColumnSelected(selected) {
    const quantityColumn = COLUMNS.find((col) => col.value === "quantity");
    if (quantityColumn) {
      quantityColumn.selected = selected;
    }
    global.TablePresenter.renderColumnCheckboxes();
  }

  // Reacts to the "quantity" column visibility toggle (called from the columns picker).
  function handleQuantityColumnToggle(quantitySelected) {
    if (!quantitySelected) {
      isQuantityInNameMode = true;
      if (quantityInNameCheckbox) {
        quantityInNameCheckbox.checked = true;
      }
    } else {
      isQuantityInNameMode = false;
      if (quantityInNameCheckbox) {
        quantityInNameCheckbox.checked = false;
      }
    }
    applyQuantityMergeToItems();
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

    if (quantityInNameCheckbox) {
      quantityInNameCheckbox.addEventListener("change", () => {
        isQuantityInNameMode = quantityInNameCheckbox.checked;
        setQuantityColumnSelected(!isQuantityInNameMode);
        global.TablePresenter.renderTableHeaders();
        applyQuantityMergeToItems();
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
    applyQuantityMergeToItems,
    handleQuantityColumnToggle,
    getCustomHigherFormationValue,
    initFormDefaults
  };
})(window);
