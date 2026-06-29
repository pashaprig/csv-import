const inputText = document.getElementById("inputText");
const prepareButton = document.getElementById("prepareButton");
const outputTableBody = document.querySelector("#outputTable tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");
const columnsCheckboxes = document.getElementById("columnsCheckboxes");
const geometryDefaultSelect = document.getElementById("geometryDefaultSelect");
const sourceTypeDefaultSelect = document.getElementById("sourceTypeDefaultSelect");
const higherFormationDefaultSelect = document.getElementById("higherFormationDefaultSelect");
const sidcDefaultSelect = document.getElementById("sidcDefaultSelect");
const sidcSelectButton = document.getElementById("sidcSelectButton");
const sidcSelectOptions = document.getElementById("sidcSelectOptions");
const sidcProbableCheckbox = document.getElementById("sidcProbableCheckbox");
const exportFileNameInput = document.getElementById("exportFileNameInput");
const themeToggle = document.getElementById("themeToggle");
const selectAllColumnsButton = document.getElementById("selectAllColumnsButton");
const clearAllColumnsButton = document.getElementById("clearAllColumnsButton");
const parseModeInputs = document.querySelectorAll('input[name="parseMode"]');

let parsedItems = []; // cache parsed rows for re-rendering when columns change
let defaultGeometry = "Point";
let defaultSourceType = "VARI";
let defaultHigherFormation = HIGHER_FORMATIONS[0] ? HIGHER_FORMATIONS[0].value : "";
let defaultSidc = SIDC_OPTIONS[0] ? SIDC_OPTIONS[0].value : "";
let parseMode = "coordinates-quantity";
let isProbableSidc = false;
let lastAutoExportFileName = "";
const SIDC_ICON_BASE_PATH = "icons/sidc";
const SIDC_UNKNOWN_ICON_PATH = `${SIDC_ICON_BASE_PATH}/10011000000000000000.svg`;
const THEME_STORAGE_KEY = "csv-theme";

function applyTheme(theme) {
  const normalizedTheme = theme === "light" ? "light" : "dark";
  document.body.setAttribute("data-theme", normalizedTheme);
  if (themeToggle) {
    themeToggle.checked = normalizedTheme === "light";
  }
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "dark";
  applyTheme(savedTheme);

  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener("change", () => {
    const nextTheme = themeToggle.checked ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

function getSidcOptionByValue(value) {
  const sidcValue = String(value || "");
  const exactMatch = SIDC_OPTIONS.find(item => item.value === sidcValue);
  if (exactMatch) {
    return exactMatch;
  }

  if (sidcValue.length >= 7 && sidcValue[6] === "1") {
    const baseSidc = `${sidcValue.slice(0, 6)}0${sidcValue.slice(7)}`;
    return SIDC_OPTIONS.find(item => item.value === baseSidc) || null;
  }

  return null;
}

function getProbableSidcValue(value) {
  const sidcValue = String(value || "");
  if (sidcValue.length < 7) {
    return sidcValue;
  }
  return `${sidcValue.slice(0, 6)}1${sidcValue.slice(7)}`;
}

function getNonProbableSidcValue(value) {
  const sidcValue = String(value || "");
  if (sidcValue.length < 7) {
    return sidcValue;
  }
  return `${sidcValue.slice(0, 6)}0${sidcValue.slice(7)}`;
}

function getEffectiveSidcValue(value) {
  return isProbableSidc ? getProbableSidcValue(value) : String(value || "");
}

function applySidcIconFallback(image) {
  if (!image) return;
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") {
      return;
    }
    image.dataset.fallbackApplied = "true";
    image.src = SIDC_UNKNOWN_ICON_PATH;
  });
}

function getSidcIconPath(value) {
  const sidcItem = getSidcOptionByValue(value);
  if (!sidcItem) {
    return SIDC_UNKNOWN_ICON_PATH;
  }

  const iconName = `${sidcItem.value}.svg`;
  return `${SIDC_ICON_BASE_PATH}/${encodeURIComponent(iconName)}`;
}

function updateSidcSelectedText(value) {
  if (!sidcSelectButton) return;
  const sidcItem = getSidcOptionByValue(value);
  if (!sidcItem) {
    sidcSelectButton.innerHTML = "<span class=\"csv__sidc-selected-text\">Оберіть SIDC</span>";
    return;
  }

  const iconPath = getSidcIconPath(value);
  sidcSelectButton.innerHTML = `
    <span class="csv__sidc-selected">
      <img class="csv__sidc-selected-icon" src="${iconPath}" alt="Іконка SIDC" />
      <span class="csv__sidc-selected-text">${sidcItem.discription}</span>
    </span>
  `;

  const selectedIcon = sidcSelectButton.querySelector(".csv__sidc-selected-icon");
  if (selectedIcon) {
    applySidcIconFallback(selectedIcon);
  }
}

function setSidcDropdownOpen(open) {
  if (!sidcSelectOptions || !sidcSelectButton) return;
  sidcSelectOptions.classList.toggle("is-open", open);
  sidcSelectButton.setAttribute("aria-expanded", open ? "true" : "false");
}

function renderTableHeaders() {
  tableHeaderRow.innerHTML = "";
  COLUMNS.filter(c => c.selected).forEach(column => {
    const th = document.createElement("th");
    th.textContent = column.description || column.value;
    tableHeaderRow.appendChild(th);
  });
}

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

function createTableSelect(options, selectedValue, ariaLabel, onChange) {
  const select = document.createElement("select");
  select.className = "csv__table-select";
  select.setAttribute("aria-label", ariaLabel);
  populateSelectOptions(select, options, selectedValue);
  select.addEventListener("change", () => {
    onChange(select.value);
  });
  return select;
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

function parseLine(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null;
  }

  if (parseMode === "coordinates-quantity") {
    const normalizedLine = trimmedLine
      .replace(/\s*[-–]\s*/g, " - ")
      .replace(/\s+/g, " ")
      .trim();

    const match = normalizedLine.match(/^(.*)\s+-\s+(-?\d+)$/);
    if (match) {
      return {
        sidc: "",
        quantity: normalizeQuantity(match[2]),
        name: "",
        observation_datetime: "",
        reliability_credibility: "",
        staff_comments: "",
        platform_type: "",
        direction: "",
        speed: "",
        additional_information: "",
        coordinates: match[1].trim(),
        higher_formation: ""
      };
    }

    const compactParts = normalizedLine.split(" ");
    if (compactParts.length < 2) {
      return null;
    }

    const quantity = normalizeQuantity(compactParts[compactParts.length - 1]);
    const coordinates = compactParts.slice(0, -1).join(" ");

    return {
      sidc: "",
      quantity,
      name: "",
      observation_datetime: "",
      reliability_credibility: "",
      staff_comments: "",
      platform_type: "",
      direction: "",
      speed: "",
      additional_information: "",
      coordinates,
      higher_formation: ""
    };
  }

  const normalizedLine = trimmedLine
    .replace(/\s*[-–]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalizedLine.split(/\s+-\s+/).map(part => part.trim()).filter(part => part.length > 0);
  if (parts.length < 2) {
    return null;
  }

  const coordinates = parts[0] || "";
  let quantity = "";
  let name = "";
  let additionalInformation = "";

  if (parts.length === 2) {
    name = parts[1] || "";
  } else {
    const trailingPart = parts.slice(2).join(" - ") || "";

    if (isStrictQuantity(trailingPart)) {
      quantity = normalizeQuantity(trailingPart);
    } else {
      additionalInformation = trailingPart;
    }

    name = parts[1] || "";
  }

  return {
    sidc: "",
    quantity,
    name,
    observation_datetime: "",
    reliability_credibility: "",
    staff_comments: "",
    platform_type: "",
    direction: "",
    speed: "",
    additional_information: additionalInformation,
    coordinates,
    higher_formation: ""
  };
}

function prepareTable() {
  const text = inputText.value.trim();
  outputTableBody.innerHTML = "";

  if (!text) {
    return;
  }

  const rows = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  parsedItems = rows.map(line => parseLine(line)).filter(Boolean);
  parsedItems.forEach(item => {
    if (!item.geometry) {
      item.geometry = defaultGeometry;
    }
    if (!item.platform_type) {
      item.platform_type = defaultSourceType;
    }
    if (!item.sidc) {
      item.sidc = getEffectiveSidcValue(defaultSidc);
    }
    if (!item.higher_formation) {
      item.higher_formation = defaultHigherFormation;
    }
  });
  renderTableRows();
}

function renderTableRows() {
  outputTableBody.innerHTML = "";
  parsedItems.forEach((item, rowIndex) => {
    const row = document.createElement("tr");
    COLUMNS.filter(c => c.selected).forEach(column => {
      const cell = document.createElement("td");
      if (column.value === "geometry") {
        const select = createTableSelect(
          GEOMETRY,
          item.geometry,
          `${column.value}, рядок ${rowIndex + 1}`,
          (value) => {
            item.geometry = value;
          }
        );
        cell.appendChild(select);
      } else if (column.value === "platform_type") {
        const select = createTableSelect(
          SOURCE_TYPES,
          item.platform_type,
          `${column.value}, рядок ${rowIndex + 1}`,
          (value) => {
            item.platform_type = value;
          }
        );
        cell.appendChild(select);
      } else if (column.value === "higher_formation") {
        const select = createTableSelect(
          HIGHER_FORMATIONS,
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

        SIDC_OPTIONS.forEach((sidcOption) => {
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

function renderColumnCheckboxes() {
  if (!columnsCheckboxes) return;
  columnsCheckboxes.innerHTML = "";
  COLUMNS.forEach((col, idx) => {
    const id = `colchk-${idx}`;
    const label = document.createElement("label");
    label.className = "csv__checkbox-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    input.checked = !!col.selected;
    input.addEventListener("change", () => {
      col.selected = input.checked;
      renderTableHeaders();
      renderTableRows();
    });
    const span = document.createElement("span");
    span.textContent = `${col.description || col.value}`;
    label.appendChild(input);
    label.appendChild(span);
    columnsCheckboxes.appendChild(label);
  });
}

function bindDefaultSelect(selectElement, options, initialValue, setDefaultValue, applyToItem) {
  if (!selectElement) return;
  populateSelectOptions(selectElement, options, initialValue);
  selectElement.addEventListener("change", () => {
    setDefaultValue(selectElement.value);
    parsedItems.forEach(item => {
      applyToItem(item, selectElement.value);
    });
    renderTableRows();
  });
}

function bindSidcDefaultInput() {
  if (!sidcDefaultSelect || !sidcSelectButton || !sidcSelectOptions) return;
  sidcSelectOptions.innerHTML = "";

  SIDC_OPTIONS.forEach((item) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "csv__sidc-option";
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("data-value", item.value);

    const icon = document.createElement("img");
    icon.className = "csv__sidc-option-icon";
    icon.alt = "Іконка SIDC";
    icon.src = getSidcIconPath(item.value);
    applySidcIconFallback(icon);

    const text = document.createElement("span");
    text.className = "csv__sidc-option-text";
    text.textContent = item.discription;

    optionButton.appendChild(icon);
    optionButton.appendChild(text);
    optionButton.addEventListener("click", () => {
      defaultSidc = item.value;
      updateSidcSelectedText(defaultSidc);
      setSidcDropdownOpen(false);
      parsedItems.forEach(row => {
        if (!row.sidc) {
          row.sidc = getEffectiveSidcValue(defaultSidc);
        }
      });
      renderTableRows();
    });

    sidcSelectOptions.appendChild(optionButton);
  });

  updateSidcSelectedText(defaultSidc);

  sidcSelectButton.addEventListener("click", () => {
    const isOpen = sidcSelectOptions.classList.contains("is-open");
    setSidcDropdownOpen(!isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!sidcDefaultSelect.contains(event.target)) {
      setSidcDropdownOpen(false);
    }
  });
}

if (sidcProbableCheckbox) {
  sidcProbableCheckbox.addEventListener("change", () => {
    isProbableSidc = sidcProbableCheckbox.checked;
    parsedItems.forEach((item) => {
      if (item.sidc) {
        item.sidc = isProbableSidc
          ? getProbableSidcValue(item.sidc)
          : getNonProbableSidcValue(item.sidc);
      }
    });
    renderTableRows();
  });
}

function setAllColumnsSelected(selected) {
  COLUMNS.forEach(col => {
    col.selected = selected;
  });
  renderTableHeaders();
  renderTableRows();
  renderColumnCheckboxes();
}

function getCurrentDateUa() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
}

function buildDefaultExportFileName() {
  const formation = higherFormationDefaultSelect && higherFormationDefaultSelect.value
    ? higherFormationDefaultSelect.value
    : defaultHigherFormation || "export";
  return `${formation} ${getCurrentDateUa()}`;
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

if (selectAllColumnsButton) {
  selectAllColumnsButton.addEventListener("click", () => setAllColumnsSelected(true));
}

if (clearAllColumnsButton) {
  clearAllColumnsButton.addEventListener("click", () => setAllColumnsSelected(false));
}

parseModeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    parseMode = input.value;
  });
});

initThemeToggle();

renderTableHeaders();
renderColumnCheckboxes();
bindDefaultSelect(
  geometryDefaultSelect,
  GEOMETRY,
  defaultGeometry,
  (value) => {
    defaultGeometry = value;
  },
  (item, value) => {
    if (!item.geometry) {
      item.geometry = value;
    }
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
    if (!item.platform_type) {
      item.platform_type = value;
    }
  }
);
bindDefaultSelect(
  higherFormationDefaultSelect,
  HIGHER_FORMATIONS,
  defaultHigherFormation,
  (value) => {
    defaultHigherFormation = value;
    syncExportFileName();
  },
  (item, value) => {
    if (!item.higher_formation) {
      item.higher_formation = value;
    }
  }
);

if (exportFileNameInput) {
  exportFileNameInput.addEventListener("input", () => {
    if (!exportFileNameInput.value.trim()) {
      syncExportFileName(true);
    }
  });
  syncExportFileName(true);
}

bindSidcDefaultInput();
prepareButton.addEventListener("click", prepareTable);

const exportButton = document.getElementById("exportButton");
if (exportButton) {
  exportButton.addEventListener("click", () => {
    const selectedColumns = COLUMNS.filter(c => c.selected);
    const escapeField = (value) => {
      const text = String(value == null ? "" : value).replace(/"/g, '""');
      return `"${text}"`;
    };

    const formatExportValue = (column, value, item) => {
      let text = value == null ? "" : String(value);
      if (column.value === "coordinates") {
        const trimmed = text.trim();
        const geometryType = item.geometry ? String(item.geometry).toUpperCase() : "POINT";
        if (trimmed && !/^\s*(POINT|LINESTRING|POLYGON)\s*\(.+\)\s*$/i.test(trimmed)) {
          text = `${geometryType} (${trimmed})`;
        }
      }
      return escapeField(text);
    };

    const headers = selectedColumns.map(c => escapeField(c.value)).join(",");
    const rows = parsedItems.map(item => {
      return selectedColumns.map(c => formatExportValue(c, item[c.value] || "", item)).join(",");
    }).join("\n");
    const text = `${headers}\n${rows}`;
    console.log(text);

    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const exportNameRaw = exportFileNameInput && exportFileNameInput.value.trim()
      ? exportFileNameInput.value.trim()
      : buildDefaultExportFileName();
    const safeExportName = exportNameRaw.replace(/[\\/:*?"<>|]/g, "-");
    link.download = /\.csv$/i.test(safeExportName) ? safeExportName : `${safeExportName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
