(function (global) {
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
          const select = createTableSelect(
            higherFormations,
            item.higher_formation,
            `${column.value}, рядок ${rowIndex + 1}`,
            (value) => {
              item.higher_formation = value;
            }
          );
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

          const sidcSelect = document.createElement("select");
          sidcSelect.className = "csv__table-select";
          sidcSelect.setAttribute("aria-label", `${column.value}, рядок ${rowIndex + 1}`);

          const currentSidcValue = String(item[column.value] || "");
          const matchedSidcOption = getSidcOptionByValue(currentSidcValue);
          const selectedBaseSidc = matchedSidcOption ? matchedSidcOption.value : "";

          if (!matchedSidcOption && currentSidcValue) {
            const customOption = document.createElement("option");
            customOption.value = currentSidcValue;
            customOption.textContent = currentSidcValue;
            customOption.selected = true;
            sidcSelect.appendChild(customOption);
          }

          sidcOptions.forEach((sidcOption) => {
            const option = document.createElement("option");
            option.value = sidcOption.value;
            option.textContent = sidcOption.discription;
            option.selected = selectedBaseSidc === sidcOption.value;
            sidcSelect.appendChild(option);
          });

          sidcSelect.addEventListener("change", () => {
            item[column.value] = getEffectiveSidcValue(sidcSelect.value);
            icon.dataset.fallbackApplied = "false";
            icon.src = getSidcIconPath(item[column.value]);
          });
          sidcWrapper.appendChild(sidcSelect);

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

  global.TableRenderer = {
    renderTableHeaders,
    renderTableRows
  };
})(window);
