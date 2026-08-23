(function (global) {
  // Blocks are separated purely by blank lines - no reliance on any specific label word.
  function splitRouteBlocks(text) {
    const source = String(text || "")
      .replace(/\r\n?/g, "\n")
      .trim();
    if (!source) {
      return [];
    }

    return source
      .split(/\n\s*\n+/)
      .map((block) => block.trim())
      .filter(Boolean);
  }

  function normalizeArrowChain(value) {
    return String(value || "")
      .replace(/[\u2192\u279D\u27F6\u21A6]/g, "->")
      .replace(/\s*->\s*/g, " -> ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeRouteCoordinates(routeText) {
    const cleaned = normalizeArrowChain(routeText);
    if (!cleaned) {
      return "";
    }

    return cleaned
      .split(/\s*->\s*/)
      .map((point) => point.trim())
      .filter(Boolean)
      .join(", ");
  }

  function getBlockLines(blockText) {
    return String(blockText || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  }

  // A block is "coordinate-only" when every line, on its own, is already a full coordinate.
  function linesAreCoordinateOnly(lines) {
    return lines.length >= 2 && lines.every((line) => {
      const point = line.replace(/[\u2192\u279D\u27F6\u21A6]\s*$/u, "").trim();
      return global.CoordinateUtils.isCoordinateOnlyLine(point);
    });
  }

  function isCoordinateOnlyBlock(blockText) {
    return linesAreCoordinateOnly(getBlockLines(blockText));
  }

  // Strips an optional leading "Label:" prefix without assuming any specific language/wording.
  function stripLeadingLabel(line) {
    return String(line || "").replace(/^[^\n:]{1,40}:\s*/, "");
  }

  // Purely positional (no keyword matching): line 1 = title, line 2 = task, remaining lines = route chain.
  function extractRouteBlockParts(blockText) {
    const lines = getBlockLines(blockText);
    if (lines.length < 3 || linesAreCoordinateOnly(lines)) {
      return null;
    }

    return {
      title: lines[0],
      task: stripLeadingLabel(lines[1]),
      route: stripLeadingLabel(lines.slice(2).join(" "))
    };
  }

  function buildEmptyRow(coordinates) {
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
      coordinates,
      higher_formation: ""
    };
  }

  function parseRouteBlock(blockText) {
    const parts = extractRouteBlockParts(blockText);
    if (!parts) {
      return null;
    }

    const coordinates = normalizeRouteCoordinates(parts.route);
    if (!coordinates) {
      return null;
    }

    const row = buildEmptyRow(coordinates);
    row.name = parts.title;
    row.additional_information = parts.task;
    return row;
  }

  function parseCoordinateOnlyRoute(blockText) {
    const lines = getBlockLines(blockText);
    if (!linesAreCoordinateOnly(lines)) {
      return null;
    }

    const coordinates = normalizeRouteCoordinates(lines.join(" -> "));
    return coordinates ? buildEmptyRow(coordinates) : null;
  }

  function parseRouteText(text) {
    const blocks = splitRouteBlocks(text);
    return blocks
      .map((block) => parseCoordinateOnlyRoute(block) || parseRouteBlock(block))
      .filter(Boolean);
  }

  global.RouteParser = {
    splitRouteBlocks,
    normalizeArrowChain,
    extractRouteBlockParts,
    isCoordinateOnlyBlock,
    parseRouteText
  };
})(window);
