// Shared mutable application state (depends on consts.js for default values).
const NAME_FROM_TEXT_VALUE = "__from_text__";
const SIDC_ICON_BASE_PATH = "icons/sidc";
const SIDC_UNKNOWN_ICON_PATH = `${SIDC_ICON_BASE_PATH}/10011000000000000000.svg`;

let parsedItems = []; // cache parsed rows for re-rendering when columns change
let defaultName = NAME_FROM_TEXT_VALUE;
let defaultGeometry = "Point";
let defaultSourceType = "VARI";
let defaultHigherFormation = HIGHER_FORMATIONS[0] ? HIGHER_FORMATIONS[0].value : "";
let defaultSidc = SIDC_OPTIONS[0] ? SIDC_OPTIONS[0].value : "";
let isProbableSidc = false;
let isHqSidc = false;
let isCustomNameMode = false;
let isQuantityInNameMode = false;
let isCustomHigherFormationMode = false;
let lastAutoExportFileName = "";
