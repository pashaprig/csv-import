(function (global) {
  function isValidManualSidc(value) {
    return /^\d{20}$/.test(String(value || "").trim());
  }

  function createTableSelect(options, selectedValue, ariaLabel, onChange) {
    const select = document.createElement("select");
    select.className = "csv__table-select";
    select.setAttribute("aria-label", ariaLabel);
    global.Helpers.populateSelectOptions(select, options, selectedValue);
    select.addEventListener("change", () => {
      onChange(select.value);
    });
    return select;
  }

  function renderTableHeaders(config) {
    const { tableHeaderRow, columns } = config;
    tableHeaderRow.innerHTML = "";
    columns.filter((column) => column.selected).forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.description || column.value;
      tableHeaderRow.appendChild(th);
    });
  }

  function renderTableRows(config) {
    const {
      outputTableBody,
      parsedItems,
      columns,
      geometry,
      sourceTypes,
      higherFormations,
      sidcOptions,
      defaultSidc,
      getEffectiveSidcValue,
      getSidcOptionByValue,
      getSidcIconPath,
      applySidcIconFallback
    } = config;

    outputTableBody.innerHTML = "";
    parsedItems.forEach((item, rowIndex) => {
      const row = document.createElement("tr");
      columns.filter((column) => column.selected).forEach((column) => {
        const cell = document.createElement("td");

        if (column.value === "geometry") {
          const select = createTableSelect(
            geometry,
            item.geometry,
            `${column.value}, рядок ${rowIndex + 1}`,
            (value) => {
              item.geometry = value;
            }
          );
          cell.appendChild(select);
        } else if (column.value === "platform_type") {
          const select = createTableSelect(
            sourceTypes,
            item.platform_type,
            `${column.value}, рядок ${rowIndex + 1}`,
            (value) => {
              item.platform_type = value;
            }
          );
          cell.appendChild(select);
        } else if (column.value === "higher_formation") {
          const select = document.createElement("select");
          select.className = "csv__table-select";
          select.setAttribute("aria-label", `${column.value}, рядок ${rowIndex + 1}`);
          
          global.Helpers.populateSelectOptions(select, higherFormations, item.higher_formation);
          
          // Додати кастомний option якщо значення не знаходиться в списку
          const matchedFormation = higherFormations.find(f => f.value === item.higher_formation);
          if (!matchedFormation && item.higher_formation) {
            const customOption = document.createElement("option");
            customOption.value = item.higher_formation;
            customOption.textContent = item.higher_formation;
            customOption.selected = true;
            select.appendChild(customOption);
          }
          
          select.addEventListener("change", () => {
            item.higher_formation = select.value;
          });
          
          cell.appendChild(select);
        } else if (column.value === "sidc") {
          const sidcWrapper = document.createElement("div");
          sidcWrapper.className = "csv__sidc-cell";

          const icon = document.createElement("img");
          icon.className = "csv__sidc-cell-icon";
          icon.src = getSidcIconPath(item[column.value] || getEffectiveSidcValue(defaultSidc));
          icon.alt = "Іконка SIDC";
          applySidcIconFallback(icon);
          sidcWrapper.appendChild(icon);

          const sidcEditor = document.createElement("div");
          sidcEditor.className = "csv__sidc-editor";

          const sidcSelectRow = document.createElement("div");
          sidcSelectRow.className = "csv__sidc-select-row";

          const sidcSelect = document.createElement("select");
          sidcSelect.className = "csv__table-select";
          sidcSelect.setAttribute("aria-label", `${column.value}, рядок ${rowIndex + 1}`);

          const isManualMode = item.sidcManualMode === true;
          const currentSidcValue = String(item[column.value] || "");
          const matchedSidcOption = getSidcOptionByValue(currentSidcValue);
          const selectedBaseSidc = matchedSidcOption ? matchedSidcOption.value : String(defaultSidc || "");

          if (!matchedSidcOption && currentSidcValue && !isManualMode) {
            const customOption = document.createElement("option");
            customOption.value = currentSidcValue;
            customOption.textContent = currentSidcValue;
            customOption.selected = true;
            sidcSelect.appendChild(customOption);
          }

          sidcOptions.forEach((sidcOption) => {
            const option = document.createElement("option");
            option.value = sidcOption.value;
            option.textContent = sidcOption.discription || sidcOption.description || sidcOption.value;
            option.selected = selectedBaseSidc === sidcOption.value;
            sidcSelect.appendChild(option);
          });

          const manualToggleLabel = document.createElement("label");
          manualToggleLabel.className = "csv__sidc-manual-toggle";

          const manualToggleInput = document.createElement("input");
          manualToggleInput.type = "checkbox";
          manualToggleInput.checked = isManualMode;

          const manualToggleText = document.createElement("span");
          manualToggleText.textContent = "вручну";

          manualToggleLabel.appendChild(manualToggleInput);
          manualToggleLabel.appendChild(manualToggleText);

          const manualInput = document.createElement("input");
          manualInput.type = "text";
          manualInput.className = "csv__table-input csv__sidc-manual-input";
          manualInput.placeholder = "20 цифр SIDC";
          manualInput.setAttribute("aria-label", `Ручний SIDC, рядок ${rowIndex + 1}`);
          manualInput.value = currentSidcValue;

          const manualError = document.createElement("p");
          manualError.className = "csv__sidc-manual-error";
          manualError.textContent = "Невалідне значення SIDC. Введіть 20 цифр.";

          function setManualVisibility(visible) {
            icon.classList.toggle("is-hidden", visible);
            sidcSelect.classList.toggle("csv__sidc-select-hidden", visible);
            manualInput.classList.toggle("is-visible", visible);
          }

          function updateManualValidation() {
            const rawValue = manualInput.value.trim();
            const isValid = isValidManualSidc(rawValue);
            manualInput.classList.toggle("is-invalid", !isValid);
            manualError.classList.toggle("is-visible", !isValid);
            item[column.value] = rawValue;
          }

          setManualVisibility(isManualMode);

          if (isManualMode) {
            updateManualValidation();
          }

          sidcSelect.addEventListener("change", () => {
            if (manualToggleInput.checked) {
              return;
            }

            item[column.value] = getEffectiveSidcValue(sidcSelect.value);
            icon.dataset.fallbackApplied = "false";
            icon.src = getSidcIconPath(item[column.value]);
          });

          manualToggleInput.addEventListener("change", () => {
            item.sidcManualMode = manualToggleInput.checked;
            setManualVisibility(item.sidcManualMode);

            if (item.sidcManualMode) {
              manualInput.value = String(item[column.value] || "");
              updateManualValidation();
              manualInput.focus();
              return;
            }

            manualInput.classList.remove("is-invalid");
            manualError.classList.remove("is-visible");
            item[column.value] = getEffectiveSidcValue(sidcSelect.value);
            icon.dataset.fallbackApplied = "false";
            icon.src = getSidcIconPath(item[column.value]);
          });

          manualInput.addEventListener("input", () => {
            updateManualValidation();
          });

          sidcSelectRow.appendChild(sidcSelect);
          sidcSelectRow.appendChild(manualInput);
          sidcSelectRow.appendChild(manualToggleLabel);
          sidcEditor.appendChild(sidcSelectRow);
          sidcEditor.appendChild(manualError);
          sidcWrapper.appendChild(sidcEditor);

          cell.appendChild(sidcWrapper);
        } else {
          const input = document.createElement("input");
          input.type = "text";
          input.value = item[column.value] || "";
          input.className = "csv__table-input";
          input.setAttribute("aria-label", `${column.value}, рядок ${rowIndex + 1}`);
          input.addEventListener("input", () => {
            item[column.value] = input.value;
          });
          cell.appendChild(input);
        }

        row.appendChild(cell);
      });
      outputTableBody.appendChild(row);
    });
  }

  function renderColumnCheckboxes(config) {
    const { columnsCheckboxes, columns, onColumnsChanged } = config;
    if (!columnsCheckboxes) return;

    columnsCheckboxes.innerHTML = "";
    columns.forEach((col, idx) => {
      const id = `colchk-${idx}`;
      const label = document.createElement("label");
      label.className = "csv__checkbox-label";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.checked = !!col.selected;
      input.addEventListener("change", () => {
        col.selected = input.checked;
        if (typeof onColumnsChanged === "function") {
          onColumnsChanged();
        }
      });

      const span = document.createElement("span");
      span.textContent = `${col.description || col.value}`;

      label.appendChild(input);
      label.appendChild(span);
      columnsCheckboxes.appendChild(label);
    });
  }

  global.TableRenderer = {
    renderTableHeaders,
    renderTableRows,
    renderColumnCheckboxes
  };
})(window);
