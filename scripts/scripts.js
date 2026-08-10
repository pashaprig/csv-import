const inputText = document.getElementById("inputText");
const prepareButton = document.getElementById("prepareButton");
const outputTableBody = document.querySelector("#outputTable tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");
const columnsCheckboxes = document.getElementById("columnsCheckboxes");
const nameDefaultSelect = document.getElementById("nameDefaultSelect");
const nameCustomToggle = document.getElementById("nameCustomToggle");
const nameCustomInput = document.getElementById("nameCustomInput");
const nameCustomInputWrap = document.getElementById("nameCustomInputWrap");
const geometryDefaultSelect = document.getElementById("geometryDefaultSelect");
const sourceTypeDefaultSelect = document.getElementById("sourceTypeDefaultSelect");
const higherFormationDefaultSelect = document.getElementById("higherFormationDefaultSelect");
const higherFormationCustomToggle = document.getElementById("higherFormationCustomToggle");
const higherFormationCustomInput = document.getElementById("higherFormationCustomInput");
const higherFormationCustomInputWrap = document.getElementById("higherFormationCustomInputWrap");
const sidcDefaultSelect = document.getElementById("sidcDefaultSelect");
const sidcSelectButton = document.getElementById("sidcSelectButton");
const sidcSelectOptions = document.getElementById("sidcSelectOptions");
const sidcProbableCheckbox = document.getElementById("sidcProbableCheckbox");
const exportFileNameInput = document.getElementById("exportFileNameInput");
const themeToggle = document.getElementById("themeToggle");
const selectAllColumnsButton = document.getElementById("selectAllColumnsButton");
const clearAllColumnsButton = document.getElementById("clearAllColumnsButton");
const saveDefaultColumnsButton = document.getElementById("saveDefaultColumnsButton");
const inputHelpButton = document.getElementById("inputHelpButton");
const modalTemplate = document.getElementById("csvModalTemplate");
const NAME_FROM_TEXT_VALUE = "__from_text__";

let parsedItems = []; // cache parsed rows for re-rendering when columns change
let defaultName = NAME_FROM_TEXT_VALUE;
let defaultGeometry = "Point";
let defaultSourceType = "VARI";
let defaultHigherFormation = HIGHER_FORMATIONS[0] ? HIGHER_FORMATIONS[0].value : "";
let defaultSidc = SIDC_OPTIONS[0] ? SIDC_OPTIONS[0].value : "";
let isProbableSidc = false;
let isCustomNameMode = false;
let isCustomHigherFormationMode = false;
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

function isCoordinateOnlyLine(value) {
  const coordinateRegex = /^\d{1,2}\s*[C-HJ-NP-X]\s*[A-HJ-NP-Z]{2}(?:\s*\d{2,5}\s+\d{2,5}|\s*\d{4}|\s*\d{6}|\s*\d{8}|\s*\d{10})$/i;
  return coordinateRegex.test(String(value || "").trim());
}

function parseLine(line) {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null;
  }

  const normalizedLine = trimmedLine
    .replace(/\s+/g, " ")
    .trim();

  if (isCoordinateOnlyLine(normalizedLine)) {
    return {
      sidc: "",
      quantity: "",
      name: "",
      observation_datetime: "",
      reliability_credibility: "",
      staff_comments: "",
      platform_type: "",
      direction: "",
      speed: "",
      additional_information: "",
      coordinates: normalizedLine,
      higher_formation: ""
    };
  }

  const delimiters = normalizedLine.match(/\s[–-]\s/g);
  const delimiterCount = delimiters ? delimiters.length : 0;
  if (!delimiterCount) {
    return null;
  }

  const parts = normalizedLine.split(/\s[–-]\s/).map(part => part.trim()).filter(part => part.length > 0);
  if (parts.length < 2) {
    return null;
  }

  const startsWithDigit = (value) => /^-?\d/.test(String(value || "").trim());

  if (delimiterCount === 1) {
    const valueAfterDelimiter = parts[1] || "";
    const quantity = startsWithDigit(valueAfterDelimiter) ? normalizeQuantity(valueAfterDelimiter) : "";
    const name = startsWithDigit(valueAfterDelimiter) ? "" : valueAfterDelimiter;

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
      additional_information: "",
      coordinates: parts[0],
      higher_formation: ""
    };
  }

  if (delimiterCount !== 2) {
    return null;
  }

  const coordinates = parts[0] || "";
  let quantity = "";
  let name = "";
  let additionalInformation = "";

  const trailingPart = parts.slice(2).join(" - ") || "";
  if (startsWithDigit(trailingPart) || isStrictQuantity(trailingPart)) {
    quantity = normalizeQuantity(trailingPart);
  } else {
    additionalInformation = trailingPart;
  }

  name = parts[1] || "";

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

function getCurrentProcessingMode() {
  if (typeof window.getCurrentProcessingMode === "function") {
    return window.getCurrentProcessingMode();
  }
  return "point";
}

function splitRouteBlocks(text) {
  const source = String(text || "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!source) {
    return [];
  }

  const starts = Array.from(source.matchAll(/Маршрут\s(?!:)/gi)).map((match) => match.index);
  if (!starts.length) {
    return [];
  }

  return starts.map((startIndex, index) => {
    const endIndex = index + 1 < starts.length ? starts[index + 1] : source.length;
    return source.slice(startIndex, endIndex).trim();
  }).filter(Boolean);
}

function normalizeRouteCoordinates(routeText) {
  const cleaned = String(routeText || "")
    .replace(/[\u2192\u279D\u27F6\u21A6]/g, "->")
    .replace(/\s*->\s*/g, " -> ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(/\s*->\s*/)
    .map((point) => point.trim())
    .filter(Boolean)
    .join(", ");
}

function parseRouteBlock(blockText) {
  const normalizedBlock = String(blockText || "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!normalizedBlock) {
    return null;
  }

  const titleMatch = normalizedBlock.match(/^Маршрут\s(?!:).*$/im);
  const taskMatch = normalizedBlock.match(/^Завдання:\s*(.*)$/im);
  const routeMatch = normalizedBlock.match(/^Маршрут:\s*(.*)$/im);

  if (!routeMatch) {
    return null;
  }

  const coordinates = normalizeRouteCoordinates(routeMatch[1]);
  if (!coordinates) {
    return null;
  }

  return {
    sidc: "",
    quantity: "",
    name: titleMatch ? titleMatch[0].trim() : "",
    observation_datetime: "",
    reliability_credibility: "",
    staff_comments: "",
    platform_type: "",
    direction: "",
    speed: "",
    additional_information: taskMatch ? String(taskMatch[1] || "").trim() : "",
    coordinates,
    higher_formation: ""
  };
}

function parseRouteText(text) {
  const blocks = splitRouteBlocks(text);
  if (!blocks.length) {
    return [];
  }

  return blocks
    .map((block) => parseRouteBlock(block))
    .filter(Boolean);
}

function prepareTable() {
  const text = inputText.value.trim();
  outputTableBody.innerHTML = "";
  parsedItems = [];

  if (!text) {
    updateExportControlsState();
    return;
  }

  if (getCurrentProcessingMode() === "route") {
    parsedItems = parseRouteText(text);
  } else {
    const rows = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    parsedItems = rows.map(line => parseLine(line)).filter(Boolean);
  }

  parsedItems.forEach(item => {
    item.nameFromText = item.name || "";
    if (!item.geometry) {
      item.geometry = getCurrentProcessingMode() === "route" ? "Linestring" : defaultGeometry;
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

  if (!parsedItems.length) {
    if (typeof openCsvTemplateModal === "function") {
      openCsvTemplateModal({
        modalTemplate,
        title: "Не вдалося розпізнати дані",
        message: "Введені дані не відповідають очікуваному формату і не можуть бути оброблені. Перевірте правильність введення та спробуйте ще раз.",
        confirmText: "Зрозуміло",
        singleButton: true
      });
    }
    updateExportControlsState();
    return;
  }

  applyNameValueToItems();
  applyHigherFormationValueToItems();
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
  const exportButton = document.getElementById("exportButton");
  const hasPreparedRows = parsedItems.length > 0;

  updatePrepareButtonLabel();

  if (exportButton) {
    exportButton.disabled = !hasPreparedRows;
  }

  if (exportFileNameInput) {
    exportFileNameInput.disabled = !hasPreparedRows;
  }
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
  if (!window.TableRenderer) return;
  window.TableRenderer.renderColumnCheckboxes({
    columnsCheckboxes,
    columns: COLUMNS,
    onColumnsChanged: () => {
      renderTableHeaders();
      renderTableRows();
    }
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
        if (row.sidcManualMode !== true) {
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
  const customFormation = getCustomHigherFormationValue();
  const formation = higherFormationDefaultSelect && higherFormationDefaultSelect.value
    ? higherFormationDefaultSelect.value
    : defaultHigherFormation || "export";
  const resolvedFormation = isCustomHigherFormationMode && customFormation
    ? customFormation
    : formation;
  return `${resolvedFormation} ${getCurrentDateUa()}`;
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

if (saveDefaultColumnsButton) {
  saveDefaultColumnsButton.addEventListener("click", () => {
    if (!window.ColumnsDefaults) return;
    window.ColumnsDefaults.saveSelectedColumns(COLUMNS);
  });
}

if (inputHelpButton) {
  inputHelpButton.addEventListener("click", () => {
    if (typeof openInputParsingHelpModal !== "function") {
      return;
    }

    openInputParsingHelpModal(modalTemplate);
  });
}

if (typeof initThemeToggle === "function") {
  initThemeToggle(themeToggle);
}

if (typeof bindCoordinatePasteAutoSplit === "function") {
  bindCoordinatePasteAutoSplit(inputText);
}

if (nameCustomToggle) {
  nameCustomToggle.addEventListener("change", () => {
    isCustomNameMode = nameCustomToggle.checked;
    updateNameInputModeUI();
    applyNameValueToItems();
    renderTableRows();
  });
}

if (nameCustomInput) {
  nameCustomInput.addEventListener("input", () => {
    if (!isCustomNameMode) return;
    applyNameValueToItems();
    renderTableRows();
  });
}

if (higherFormationCustomToggle) {
  higherFormationCustomToggle.addEventListener("change", () => {
    isCustomHigherFormationMode = higherFormationCustomToggle.checked;
    updateHigherFormationInputModeUI();
    applyHigherFormationValueToItems();
    renderTableRows();
    syncExportFileName(true);
  });
}

if (higherFormationCustomInput) {
  higherFormationCustomInput.addEventListener("input", () => {
    if (!isCustomHigherFormationMode) return;
    applyHigherFormationValueToItems();
    renderTableRows();
    syncExportFileName(true);
  });
}

updateNameInputModeUI();
updateHigherFormationInputModeUI();

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
    applyHigherFormationValueToItems();
    renderTableRows();
    syncExportFileName();
  },
  (item, value) => {
    if (isCustomHigherFormationMode) {
      return;
    }

    item.higher_formation = value;
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
if (typeof bindProcessingModeSwitches === "function") {
  bindProcessingModeSwitches();
}
prepareButton.addEventListener("click", handlePrepareButtonClick);
updateExportControlsState();

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
