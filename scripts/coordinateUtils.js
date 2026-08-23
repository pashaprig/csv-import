(function (global) {
  // Single source of truth for the MGRS-like coordinate pattern used by point/route parsing and paste normalization.
  const MGRS_COORDINATE_CORE = "\\d{1,2}\\s*[C-HJ-NP-X]\\s*[A-HJ-NP-Z]{2}(?:\\s*\\d{2,5}\\s+\\d{2,5}|\\s*\\d{4}|\\s*\\d{6}|\\s*\\d{8}|\\s*\\d{10})";

  function isCoordinateOnlyLine(value) {
    const coordinateRegex = new RegExp(`^${MGRS_COORDINATE_CORE}$`, "i");
    return coordinateRegex.test(String(value || "").trim());
  }

  function createCoordinateScanRegex() {
    return new RegExp(`\\b${MGRS_COORDINATE_CORE}\\b`, "gi");
  }

  global.CoordinateUtils = {
    isCoordinateOnlyLine,
    createCoordinateScanRegex
  };
})(window);
