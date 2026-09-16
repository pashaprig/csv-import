(function (global) {
  // Blocks are separated by ";" + line break (or blank lines, for older content) - see Helpers.splitObjectBlocks.
  function splitRouteBlocks(text) {
    return global.Helpers.splitObjectBlocks(text);
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

  // Splits a single line into its coordinate points when the whole line is nothing but a
  // dash-separated pair ("coordA -coordB") or an already-normalized comma-separated pair
  // ("coordA, coordB"). Returns null when the line isn't purely a coordinate chain.
  function splitCoordinateChain(line) {
    const trimmed = String(line || "").trim();
    if (!trimmed) {
      return null;
    }

    const dashParts = trimmed.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
    if (dashParts.length >= 2 && dashParts.every((part) => global.CoordinateUtils.isCoordinateOnlyLine(part))) {
      return dashParts;
    }

    const commaParts = trimmed.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
    if (commaParts.length >= 2 && commaParts.every((part) => global.CoordinateUtils.isCoordinateOnlyLine(part))) {
      return commaParts;
    }

    return null;
  }

  // A single line such as "37T BN 88702 91367 -37T BN 88988 91271" is already a complete route
  // on its own - no blank-line block or title/task labels are needed to make sense of it.
  // An optional leading name (e.g. "переправа\t...", tab- or space-separated) is kept as the row name.
  function parseSimpleRouteLineParts(line) {
    const withoutTrailingSeparator = String(line || "").trim().replace(/;\s*$/, "");
    if (!withoutTrailingSeparator) {
      return null;
    }

    const scanRegex = global.CoordinateUtils.createCoordinateScanRegex();
    const match = scanRegex.exec(withoutTrailingSeparator);
    if (!match) {
      return null;
    }

    const name = withoutTrailingSeparator.slice(0, match.index).trim();
    const coordinatePart = withoutTrailingSeparator.slice(match.index).trim();

    const parts = splitCoordinateChain(coordinatePart);
    return parts ? { name, coordinates: parts.join(", ") } : null;
  }

  function splitNonBlankLines(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  // True when every non-blank line is independently a full route (an optional name followed by a
  // dash- or comma-separated coordinate pair), meaning routes can be parsed one-per-line.
  function isSimpleRouteListText(text) {
    const lines = splitNonBlankLines(text);
    return lines.length > 0 && lines.every((line) => parseSimpleRouteLineParts(line) !== null);
  }

  function parseSimpleRouteListText(text) {
    return splitNonBlankLines(text)
      .map((line) => parseSimpleRouteLineParts(line))
      .filter(Boolean)
      .map(({ name, coordinates }) => {
        const row = buildEmptyRow(coordinates);
        row.name = name;
        return row;
      });
  }

  function parseRouteText(text) {
    if (isSimpleRouteListText(text)) {
      return parseSimpleRouteListText(text);
    }

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
    splitCoordinateChain,
    parseSimpleRouteLineParts,
    splitNonBlankLines,
    isSimpleRouteListText,
    parseRouteText
  };
})(window);
