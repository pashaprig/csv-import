(function (global) {
  function createPolygonModeModule() {
    function normalizeMgrsCoordinate(value) {
      const cleaned = String(value || "")
        .toUpperCase()
        .replace(/[(),]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const match = cleaned.match(/^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z]{2})\s*(\d{2,5})\s*(\d{2,5})$/i);
      if (!match) {
        return "";
      }

      return `${match[1]}${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }

    function extractMgrsCoordinates(text) {
      const source = String(text || "")
        .replace(/\r\n?/g, "\n")
        .toUpperCase();

      const matches = source.match(/\d{1,2}\s*[C-HJ-NP-X]\s*[A-HJ-NP-Z]{2}\s*\d{2,5}\s+\d{2,5}/gi) || [];
      return matches
        .map((rawCoordinate) => normalizeMgrsCoordinate(rawCoordinate))
        .filter(Boolean);
    }

    function parsePolygonBlock(blockText, polygonName) {
      const coordinatesList = extractMgrsCoordinates(blockText);
      if (coordinatesList.length < 3) {
        return null;
      }

      const polygonPoints = [...coordinatesList];
      if (polygonPoints[polygonPoints.length - 1] !== polygonPoints[0]) {
        polygonPoints.push(polygonPoints[0]);
      }

      return {
        sidc: "10042500002420000000",
        quantity: "",
        name: polygonName || "Полігон у MGRS",
        observation_datetime: "",
        reliability_credibility: "",
        staff_comments: "",
        platform_type: "",
        direction: "",
        speed: "",
        additional_information: "",
        coordinates: `POLYGON ((${polygonPoints.join(", ")}))`,
        higher_formation: "",
        geometry: "Polygon"
      };
    }

    function splitPolygonBlocks(text) {
      const source = String(text || "")
        .replace(/\r\n?/g, "\n")
        .trim();

      if (!source) {
        return [];
      }

      const blocksByParagraphs = source
        .split(/\n\s*\n+/)
        .map((block) => block.trim())
        .filter(Boolean);

      if (blocksByParagraphs.length > 1) {
        return blocksByParagraphs;
      }

      const blocksBySemicolon = source
        .split(/;\s*(?:\n+|$)/)
        .map((block) => block.trim())
        .filter(Boolean);

      if (blocksBySemicolon.length > 1) {
        return blocksBySemicolon;
      }

      return [source];
    }

    function parsePolygonText(text) {
      const blocks = splitPolygonBlocks(text);
      return blocks
        .map((block, index) => parsePolygonBlock(block, `Полігон ${index + 1}`))
        .filter(Boolean);
    }

    function activate() {
      return true;
    }

    global.parsePolygonText = parsePolygonText;

    return {
      activate
    };
  }

  global.createPolygonModeModule = createPolygonModeModule;
})(window);
