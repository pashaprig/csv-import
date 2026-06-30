(function (global) {
  function bindProcessingModeSwitches() {
    const modePointRadio = document.getElementById("modePoint");
    const modeRouteRadio = document.getElementById("modeRoute");
    const modePolygonRadio = document.getElementById("modePolygon");
    const geometryDefaultSelect = document.getElementById("geometryDefaultSelect");

    let currentProcessingMode = modePointRadio && modePointRadio.checked
      ? "point"
      : "";
    global.getCurrentProcessingMode = () => currentProcessingMode;

    const routeModeModule = typeof global.createRouteModeModule === "function"
      ? global.createRouteModeModule()
      : null;
    const polygonModeModule = typeof global.createPolygonModeModule === "function"
      ? global.createPolygonModeModule()
      : null;

    function setProcessingMode(mode) {
      if (!mode || currentProcessingMode === mode) {
        return;
      }

      currentProcessingMode = mode;

      if (mode === "route") {
        if (geometryDefaultSelect && geometryDefaultSelect.value !== "LineString") {
          geometryDefaultSelect.value = "Linestring";
          geometryDefaultSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }

        if (routeModeModule && typeof routeModeModule.activate === "function") {
          routeModeModule.activate();
        }
        return;
      }

      if (mode === "polygon") {
        if (polygonModeModule && typeof polygonModeModule.activate === "function") {
          polygonModeModule.activate();
        }
      }

      if (mode === "point") {
        if (geometryDefaultSelect && geometryDefaultSelect.value !== "Point") {
          geometryDefaultSelect.value = "Point";
          geometryDefaultSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }

    if (modeRouteRadio) {
      modeRouteRadio.addEventListener("change", () => {
        if (!modeRouteRadio.checked) {
          return;
        }
        setProcessingMode("route");
      });
    }

    if (modePolygonRadio) {
      modePolygonRadio.addEventListener("change", () => {
        if (!modePolygonRadio.checked) {
          return;
        }
        setProcessingMode("polygon");
      });
    }

    if (modePointRadio) {
      modePointRadio.addEventListener("change", () => {
        if (!modePointRadio.checked) {
          return;
        }
        setProcessingMode("point");
      });
    }

    if (!currentProcessingMode) {
      currentProcessingMode = "point";
    }
  }

  global.bindProcessingModeSwitches = bindProcessingModeSwitches;
})(window);
