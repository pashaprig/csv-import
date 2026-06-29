(function (global) {
  function createSidcModule(config) {
    const {
      sidcOptions,
      iconBasePath,
      unknownIconPath,
      sidcDefaultSelect,
      sidcSelectButton,
      sidcSelectOptions
    } = config;

    function getSidcOptionByValue(value) {
      const sidcValue = String(value || "");
      const exactMatch = sidcOptions.find((item) => item.value === sidcValue);
      if (exactMatch) {
        return exactMatch;
      }

      if (sidcValue.length >= 7 && sidcValue[6] === "1") {
        const baseSidc = `${sidcValue.slice(0, 6)}0${sidcValue.slice(7)}`;
        return sidcOptions.find((item) => item.value === baseSidc) || null;
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

    function getEffectiveSidcValue(value, isProbableSidc) {
      return isProbableSidc ? getProbableSidcValue(value) : String(value || "");
    }

    function applySidcIconFallback(image) {
      if (!image) return;
      image.addEventListener("error", () => {
        if (image.dataset.fallbackApplied === "true") {
          return;
        }
        image.dataset.fallbackApplied = "true";
        image.src = unknownIconPath;
      });
    }

    function getSidcIconPath(value) {
      const sidcItem = getSidcOptionByValue(value);
      if (!sidcItem) {
        return unknownIconPath;
      }

      const iconName = `${sidcItem.value}.svg`;
      return `${iconBasePath}/${encodeURIComponent(iconName)}`;
    }

    function updateSidcSelectedText(value) {
      if (!sidcSelectButton) return;
      const sidcItem = getSidcOptionByValue(value);
      if (!sidcItem) {
        sidcSelectButton.innerHTML = '<span class="csv__sidc-selected-text">Оберіть SIDC</span>';
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

    function bindSidcDefaultInput(bindConfig) {
      const {
        defaultSidc,
        onDefaultSidcChange,
        onApplyDefaultSidcToRows,
        getEffectiveSidcValueForCurrentMode
      } = bindConfig;

      if (!sidcDefaultSelect || !sidcSelectButton || !sidcSelectOptions) return;
      sidcSelectOptions.innerHTML = "";

      sidcOptions.forEach((item) => {
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
          onDefaultSidcChange(item.value);
          updateSidcSelectedText(item.value);
          setSidcDropdownOpen(false);
          onApplyDefaultSidcToRows(getEffectiveSidcValueForCurrentMode(item.value));
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

    return {
      getSidcOptionByValue,
      getProbableSidcValue,
      getNonProbableSidcValue,
      getEffectiveSidcValue,
      applySidcIconFallback,
      getSidcIconPath,
      updateSidcSelectedText,
      setSidcDropdownOpen,
      bindSidcDefaultInput
    };
  }

  global.createSidcModule = createSidcModule;
})(window);
