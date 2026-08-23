(function (global) {
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

  function parseLine(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return null;
    }

    const normalizedLine = trimmedLine.replace(/\s+/g, " ").trim();

    if (global.CoordinateUtils.isCoordinateOnlyLine(normalizedLine)) {
      return buildEmptyRow(normalizedLine);
    }

    const delimiters = normalizedLine.match(/\s[–-]\s/g);
    const delimiterCount = delimiters ? delimiters.length : 0;
    if (!delimiterCount) {
      return null;
    }

    const parts = normalizedLine.split(/\s[–-]\s/).map(part => part.trim()).filter(part => part.length > 0);
    if (parts.length < 2) {
      return null;
    }

    const startsWithDigit = (value) => /^-?\d/.test(String(value || "").trim());

    if (delimiterCount === 1) {
      const valueAfterDelimiter = parts[1] || "";
      const row = buildEmptyRow(parts[0]);
      if (startsWithDigit(valueAfterDelimiter)) {
        row.quantity = global.Helpers.normalizeQuantity(valueAfterDelimiter);
      } else {
        row.name = valueAfterDelimiter;
      }
      return row;
    }

    if (delimiterCount !== 2) {
      return null;
    }

    const row = buildEmptyRow(parts[0] || "");
    row.name = parts[1] || "";

    const trailingPart = parts.slice(2).join(" - ") || "";
    if (startsWithDigit(trailingPart) || global.Helpers.isStrictQuantity(trailingPart)) {
      row.quantity = global.Helpers.normalizeQuantity(trailingPart);
    } else {
      row.additional_information = trailingPart;
    }

    return row;
  }

  global.PointParser = {
    parseLine
  };
})(window);
