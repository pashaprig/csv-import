const inputText = document.getElementById("inputText");
const prepareButton = document.getElementById("prepareButton");
const outputTableBody = document.querySelector("#outputTable tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");
const columnsCheckboxes = document.getElementById("columnsCheckboxes");
const geometryDefaultSelect = document.getElementById("geometryDefaultSelect");

let parsedItems = []; // cache parsed rows for re-rendering when columns change
let defaultGeometry = "Point";

function renderTableHeaders() {
  tableHeaderRow.innerHTML = "";
  COLUMNS.filter(c => c.selected).forEach(column => {
    const th = document.createElement("th");
    th.textContent = column.value;
    tableHeaderRow.appendChild(th);
  });
}

function parseLine(line) {
  const parts = line.split("-").map(part => part.trim()).filter(part => part.length > 0);
  if (parts.length < 2) {
    return null;
  }

  const coordinates = parts[0] || "";
  let quantity = "";
  let name = "";

  if (parts.length === 2) {
    name = parts[1] || "";
  } else {
    quantity = parts[parts.length - 1] || "";
    name = parts.slice(1, parts.length - 1).join(" - ") || "";
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
        const select = document.createElement("select");
        select.className = "csv__table-select";
        select.setAttribute("aria-label", `${column.value}, рядок ${rowIndex + 1}`);
        Object.entries(GEOMETRY).forEach(([key, label]) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = label;
          option.selected = item.geometry === key;
          select.appendChild(option);
        });
        select.addEventListener("change", () => {
          item.geometry = select.value;
        });
        cell.appendChild(select);
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
    span.textContent = `${col.value}`;
    label.appendChild(input);
    label.appendChild(span);
    columnsCheckboxes.appendChild(label);
  });
}

function populateGeometrySelect() {
  if (!geometryDefaultSelect) return;
  geometryDefaultSelect.innerHTML = "";
  Object.entries(GEOMETRY).forEach(([key, label]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    option.selected = key === "Point";
    geometryDefaultSelect.appendChild(option);
  });
  geometryDefaultSelect.addEventListener("change", () => {
    defaultGeometry = geometryDefaultSelect.value;
    parsedItems.forEach(item => {
      if (!item.geometry) {
        item.geometry = defaultGeometry;
      }
    });
    renderTableRows();
  });
}

renderTableHeaders();
renderColumnCheckboxes();
populateGeometrySelect();
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
    link.download = "export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
