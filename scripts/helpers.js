(function (global) {
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

  function getCurrentDateUa() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  global.Helpers = {
    populateSelectOptions,
    normalizeQuantity,
    isStrictQuantity,
    getCurrentDateUa
  };
})(window);
