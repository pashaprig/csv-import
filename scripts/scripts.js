const inputText = document.getElementById("inputText");
const prepareButton = document.getElementById("prepareButton");
const outputTableBody = document.querySelector("#outputTable tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");
const columnsCheckboxes = document.getElementById("columnsCheckboxes");
const nameDefaultSelect = document.getElementById("nameDefaultSelect");
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
let defaultName = NAME_OPTIONS[0] ? NAME_OPTIONS[0].value : "";
let defaultGeometry = "Point";
let defaultSourceType = "VARI";
let defaultHigherFormation = HIGHER_FORMATIONS[0] ? HIGHER_FORMATIONS[0].value : "";
let defaultSidc = SIDC_OPTIONS[0] ? SIDC_OPTIONS[0].value : "";
let parseMode = "coordinates-quantity";
let isProbableSidc = false;
let lastAutoExportFileName = "";
const SIDC_ICON_BASE_PATH = "icons/sidc";
const SIDC_UNKNOWN_ICON_PATH = `${SIDC_ICON_BASE_PATH}/10011000000000000000.svg`;
const helpers = window.Helpers || null;
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
  if (!sidcModule) return null;
  return sidcModule.getSidcOptionByValue(value);
}

function getProbableSidcValue(value) {
  if (!sidcModule) return String(value || "");
  return sidcModule.getProbableSidcValue(value);
}

function getNonProbableSidcValue(value) {
  if (!sidcModule) return String(value || "");
  return sidcModule.getNonProbableSidcValue(value);
}

function getEffectiveSidcValue(value) {
  if (!sidcModule) return String(value || "");
  return sidcModule.getEffectiveSidcValue(value, isProbableSidc);
}

function applySidcIconFallback(image) {
  if (!sidcModule) return;
  sidcModule.applySidcIconFallback(image);
}

function getSidcIconPath(value) {
  if (!sidcModule) return SIDC_UNKNOWN_ICON_PATH;
  return sidcModule.getSidcIconPath(value);
}

function updateSidcSelectedText(value) {
  if (!sidcModule) return;
  sidcModule.updateSidcSelectedText(value);
}

function setSidcDropdownOpen(open) {
  if (!sidcModule) return;
  sidcModule.setSidcDropdownOpen(open);
}

function renderTableHeaders() {
  if (!window.TableRenderer) return;
  window.TableRenderer.renderTableHeaders({
    tableHeaderRow,
    columns: COLUMNS
  });
}

function populateSelectOptions(selectElement, options, selectedValue) {
  if (!helpers) return;
  helpers.populateSelectOptions(selectElement, options, selectedValue);
}

function normalizeQuantity(value) {
  if (!helpers) return "";
  return helpers.normalizeQuantity(value);
}

function isStrictQuantity(value) {
  if (!helpers) return false;
  return helpers.isStrictQuantity(value);
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
    if (!item.name) {
      item.name = defaultName;
    }
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
  if (!window.TableRenderer) return;
  window.TableRenderer.renderTableRows({
    outputTableBody,
    parsedItems,
    columns: COLUMNS,
    geometry: GEOMETRY,
    sourceTypes: SOURCE_TYPES,
    higherFormations: HIGHER_FORMATIONS,
    sidcOptions: SIDC_OPTIONS,
    defaultSidc,
    getEffectiveSidcValue,
    getSidcOptionByValue,
    getSidcIconPath,
    applySidcIconFallback
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
  if (!sidcModule) return;

  sidcModule.bindSidcDefaultInput({
    defaultSidc,
    onDefaultSidcChange: (value) => {
      defaultSidc = value;
    },
    getEffectiveSidcValueForCurrentMode: (value) => getEffectiveSidcValue(value),
    onApplyDefaultSidcToRows: (effectiveSidc) => {
      parsedItems.forEach((row) => {
        if (!row.sidc) {
          row.sidc = effectiveSidc;
        }
      });
      renderTableRows();
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
  if (!helpers) return "";
  return helpers.getCurrentDateUa();
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

if (typeof initThemeToggle === "function") {
  initThemeToggle(themeToggle);
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
    if (!item.name) {
      item.name = value;
    }
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
if (typeof attachCsvExportHandler === "function") {
  attachCsvExportHandler({
    exportButton,
    columns: COLUMNS,
    getParsedItems: () => parsedItems,
    exportFileNameInput,
    buildDefaultExportFileName
  });
}
