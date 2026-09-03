// App bootstrap: wires up the independent modules once the DOM and all scripts are loaded.

if (typeof initThemeToggle === "function") {
  initThemeToggle(themeToggle);
}

if (typeof bindCoordinatePasteAutoSplit === "function") {
  bindCoordinatePasteAutoSplit(inputText);
}

if (typeof bindCoordinateHomoglyphAutoFix === "function") {
  bindCoordinateHomoglyphAutoFix(inputText);
}

if (inputHelpButton) {
  inputHelpButton.addEventListener("click", () => {
    if (typeof openInputParsingHelpModal !== "function") {
      return;
    }

    openInputParsingHelpModal(modalTemplate);
  });
}

SidcDefaults.initSidcDefaults();
FormDefaults.initFormDefaults();
TablePresenter.initTablePresenter();
ExportFileName.initExportFileName();

if (typeof bindProcessingModeSwitches === "function") {
  bindProcessingModeSwitches();
}
