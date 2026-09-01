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

    // Splits a "<quantity> <rest>" chunk into its numeric quantity and any trailing description.
    const splitQuantityAndInfo = (value) => {
      const trimmedValue = String(value || "").trim();
      const match = trimmedValue.match(/^(-?\d+)\s*(.*)$/);
      if (!match) {
        return { quantity: global.Helpers.normalizeQuantity(trimmedValue), info: "" };
      }
      return { quantity: match[1], info: match[2].trim() };
    };

    if (delimiterCount === 1) {
      const valueAfterDelimiter = parts[1] || "";
      const row = buildEmptyRow(parts[0]);
      if (startsWithDigit(valueAfterDelimiter)) {
        const { quantity, info } = splitQuantityAndInfo(valueAfterDelimiter);
        row.quantity = quantity;
        row.additional_information = info;
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
      const { quantity, info } = splitQuantityAndInfo(trailingPart);
      row.quantity = quantity;
      row.additional_information = info;
    } else {
      row.additional_information = trailingPart;
    }

    return row;
  }

  global.PointParser = {
    parseLine
  };
})(window);
