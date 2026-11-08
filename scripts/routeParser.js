(function (global) {
  // Route input rules:
  // - Routes are separated ONLY by ";" at the end of a line (";" + line break, or ";" at the end of text).
  //   Everything between two such separators is one route, however many lines it spans.
  // - Inside a route, MGRS coordinates are located purely by their own shape
  //   (zone + band letter + two square letters + digits). Whatever stands between coordinates
  //   (arrows, dashes, commas, spaces, line breaks or nothing at all) is ignored.
  // - Text before the first coordinate: first line -> name, other lines -> additional_information.
  //   Text after the last coordinate -> additional_information.

  const LETTER_CLASS = "A-Za-zА-Яа-яҐґЄєІіЇї";
  const SEPARATOR_CHARS = "\\s\\-–—−>→➝⟶↦,;:|/\\\\";
  const EDGE_SEPARATORS_REGEX = new RegExp(`^[${SEPARATOR_CHARS}]+|[${SEPARATOR_CHARS}]+$`, "g");
  const PREVIEW_MAX_LENGTH = 70;
  const MGRS_EXAMPLE = "37T BN 88702 91367";

  // Things in plain text that look like a coordinate but did not parse as one.
  const BROKEN_COORDINATE_PATTERNS = [
    {
      kind: "letters",
      regex: new RegExp(`\\d{1,2}\\s*[${LETTER_CLASS}]{1,3}(?:\\s+[${LETTER_CLASS}]{1,3})?\\s*(?:\\d{4,5}\\s+\\d{4,5}|\\d{6,})`, "g")
    },
    { kind: "noZone", regex: /\d{4,5}\s+\d{4,5}/g },
    { kind: "noZone", regex: /\d{8,}/g }
  ];

  // Start of an MGRS coordinate: zone number, band letter and two square letters, followed by digits.
  // Cyrillic look-alike letters are accepted and converted to Latin. Digits may directly precede
  // the zone, so coordinates written without any separator ("...9136737TBN...") are still split.
  function createCoordinateStartRegex() {
    const { ZONE_LETTER_CLASS, GRID_LETTER_CLASS } = global.CoordinateUtils;
    return new RegExp(
      `(?<![A-Za-z])(\\d{1,2})\\s*([${ZONE_LETTER_CLASS}])\\s*([${GRID_LETTER_CLASS}])\\s*([${GRID_LETTER_CLASS}])(?=\\s*\\d)`,
      "g"
    );
  }

  function collapseWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function pluralUa(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function formatDigitCount(count) {
    return `${count} ${pluralUa(count, "цифру", "цифри", "цифр")}`;
  }

  function lineNumberAt(source, offset) {
    return source.slice(0, offset).split("\n").length;
  }

  function splitRouteBlocks(text) {
    const source = String(text || "").replace(/\r\n?/g, "\n");
    const separatorRegex = /;[ \t]*(?:\n|$)/g;
    const blocks = [];

    const pushBlock = (from, to) => {
      const raw = source.slice(from, to);
      const content = raw.trim();
      if (!content) return;

      const contentStart = from + (raw.length - raw.trimStart().length);
      blocks.push({
        text: content,
        lineFrom: lineNumberAt(source, contentStart),
        lineTo: lineNumberAt(source, contentStart + content.length - 1)
      });
    };

    let start = 0;
    let match;
    while ((match = separatorRegex.exec(source)) !== null) {
      pushBlock(start, match.index);
      start = match.index + match[0].length;
    }
    pushBlock(start, source.length);

    return blocks;
  }

  // Reads the digits that follow a coordinate start and validates the whole coordinate.
  function readCoordinate(text, start, segmentEnd) {
    const afterStart = start.index + start[0].length;
    const segment = text.slice(afterStart, segmentEnd);

    const first = /^\s*(\d+)/.exec(segment);
    let consumed = first[0].length;
    const firstDigits = first[1];
    let secondDigits = "";

    // "88702 91367" - two groups; a single long group ("8870291367") is split in half below.
    if (firstDigits.length <= 5) {
      const second = /^\s+(\d+)/.exec(segment.slice(consumed));
      if (second) {
        secondDigits = second[1];
        consumed += second[0].length;
      }
    }

    const toLatin = global.CoordinateUtils.toLatinHomoglyphs;
    const end = afterStart + consumed;
    const raw = collapseWhitespace(text.slice(start.index, end));
    const zone = Number(start[1]);
    const band = toLatin(start[2]).toUpperCase();
    const square = toLatin(start[3] + start[4]).toUpperCase();
    const result = { raw, end, value: "", error: "" };

    if (zone < 1 || zone > 60) {
      result.error = `«${raw}»: зони з номером ${start[1]} не існує — номер зони MGRS має бути від 1 до 60.`;
      return result;
    }

    let easting;
    let northing;

    if (secondDigits) {
      if (firstDigits.length !== secondDigits.length) {
        result.error = `«${raw}»: східна частина має ${formatDigitCount(firstDigits.length)}, а північна — ${formatDigitCount(secondDigits.length)}. `
          + `Обидві частини мають бути однакової довжини (наприклад, «88702 91367»), інакше точку неможливо визначити однозначно.`;
        return result;
      }
      easting = firstDigits;
      northing = secondDigits;
    } else {
      const count = firstDigits.length;
      if (count > 10) {
        result.error = `«${raw}»: після квадрата ${square} записано ${formatDigitCount(count)} поспіль — забагато. `
          + `Максимум 10 (по 5 для сходу й півночі). Можливо, дві координати злиплися або є зайва цифра.`;
        return result;
      }
      if (count % 2 !== 0) {
        let message = `«${raw}»: після квадрата ${square} записано ${formatDigitCount(count)} — непарна кількість. `
          + `Цифри діляться навпіл (перша половина — схід, друга — північ), тому їх має бути 2, 4, 6, 8 або 10.`;
        if (count <= 5) {
          message += ` Схоже, вказано лише одну частину — допишіть другу через пробіл (наприклад, «88702 91367»).`;
        } else {
          message += ` Схоже, якоїсь цифри бракує або є зайва.`;
        }
        result.error = message;
        return result;
      }
      easting = firstDigits.slice(0, count / 2);
      northing = firstDigits.slice(count / 2);
    }

    result.value = `${zone}${band} ${square} ${easting} ${northing}`;
    return result;
  }

  function findBrokenCoordinates(text) {
    let remaining = String(text || "");
    const found = [];

    BROKEN_COORDINATE_PATTERNS.forEach(({ kind, regex }) => {
      remaining = remaining.replace(regex, (match) => {
        found.push({ kind, fragment: collapseWhitespace(match) });
        return " ".repeat(match.length);
      });
    });

    return found;
  }

  function describeBrokenCoordinate({ kind, fragment }) {
    if (kind === "noZone") {
      return `«${fragment}» схоже на цифри координати, але перед ними немає зони й квадрата MGRS (наприклад, «37T BN ${fragment}»).`;
    }

    const letters = fragment.match(new RegExp(`[${LETTER_CLASS}]`, "g")) || [];
    const latinLetters = letters.map((letter) => global.CoordinateUtils.toLatinHomoglyphs(letter).toUpperCase());
    const hints = [];

    const forbidden = letters.filter((letter) => /[IOІО]/i.test(letter));
    if (forbidden.length) {
      hints.push(`Літери I та O в MGRS не використовуються — можливо, там мають бути цифри 1 та 0.`);
    }

    const nonLatinCyrillic = letters.filter((letter) =>
      /[А-Яа-яҐґЄєІіЇї]/.test(letter) && global.CoordinateUtils.toLatinHomoglyphs(letter) === letter && !/[ІіОо]/.test(letter)
    );
    if (nonLatinCyrillic.length) {
      const listed = nonLatinCyrillic.map((letter) => `«${letter}»`).join(", ");
      hints.push(nonLatinCyrillic.length === 1
        ? `Кирилична літера ${listed} не може бути частиною координати — у MGRS лише латинські літери.`
        : `Кириличні літери ${listed} не можуть бути частиною координати — у MGRS лише латинські літери.`);
    }

    if (letters.length !== 3) {
      hints.push(`Після номера зони має бути рівно три літери: літера смуги та дві літери квадрата (наприклад, «T BN»), а тут ${letters.length}.`);
    } else if (!forbidden.length && !nonLatinCyrillic.length && !/[C-HJ-NP-X]/.test(latinLetters[0])) {
      hints.push(`Літера смуги «${letters[0]}» неможлива — допустимі C–X (крім I та O).`);
    }

    if (!hints.length) {
      hints.push(`Перевірте номер зони (1–2 цифри), літеру смуги та дві літери квадрата — разом це має виглядати як «${MGRS_EXAMPLE}».`);
    }

    return `«${fragment}» схоже на координату, але не відповідає формату MGRS. ${hints.join(" ")}`;
  }

  function cleanTextFragment(value) {
    const cleaned = collapseWhitespace(value).replace(EDGE_SEPARATORS_REGEX, "").trim();
    return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : "";
  }

  // Strips an optional leading "Label:" prefix ("Завдання: ...") without assuming specific wording.
  function stripLeadingLabel(line) {
    return String(line || "").replace(/^[^\n:\d]{1,40}:\s*/, "");
  }

  function textToInfoLines(text) {
    return String(text || "")
      .split("\n")
      .map((line) => cleanTextFragment(stripLeadingLabel(line.trim())))
      .filter(Boolean);
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

  function analyzeRouteBlock(blockText) {
    const starts = Array.from(blockText.matchAll(createCoordinateStartRegex()));
    const errors = [];
    const coordinates = [];
    const addBrokenCoordinateErrors = (text) => {
      findBrokenCoordinates(text).forEach((item) => errors.push(describeBrokenCoordinate(item)));
    };

    if (!starts.length) {
      errors.push(`Не знайдено жодної координати MGRS. Очікуваний вигляд: «${MGRS_EXAMPLE}» — номер зони, літера смуги, дві літери квадрата і цифри (схід та північ).`);
      addBrokenCoordinateErrors(blockText);
      return { row: null, errors };
    }

    const leadingText = blockText.slice(0, starts[0].index);
    addBrokenCoordinateErrors(leadingText);

    let trailingText = "";
    starts.forEach((start, index) => {
      const segmentEnd = index + 1 < starts.length ? starts[index + 1].index : blockText.length;
      const coordinate = readCoordinate(blockText, start, segmentEnd);

      if (coordinate.error) {
        errors.push(coordinate.error);
      } else {
        coordinates.push(coordinate.value);
      }

      const residue = blockText.slice(coordinate.end, segmentEnd);
      addBrokenCoordinateErrors(residue);
      if (index === starts.length - 1) {
        trailingText = residue;
      }
    });

    if (!errors.length && coordinates.length < 2) {
      errors.push(`Знайдено лише одну координату («${coordinates[0]}»), а для маршруту потрібно щонайменше дві точки. `
        + `Якщо продовження маршруту записано в наступному рядку, перевірте, чи не стоїть «;» у кінці цього рядка — він завершує маршрут.`);
    }

    if (errors.length) {
      return { row: null, errors };
    }

    const leadingLines = String(leadingText).split("\n");
    const name = cleanTextFragment(leadingLines[0]);
    const infoLines = [
      ...textToInfoLines(leadingLines.slice(1).join("\n")),
      ...textToInfoLines(trailingText)
    ];

    const row = buildEmptyRow(coordinates.join(", "));
    row.name = name;
    row.additional_information = infoLines.join("; ");
    return { row, errors };
  }

  function buildPreview(text) {
    const collapsed = collapseWhitespace(text);
    return collapsed.length > PREVIEW_MAX_LENGTH
      ? `${collapsed.slice(0, PREVIEW_MAX_LENGTH)}…`
      : collapsed;
  }

  // Parses the whole input and reports, per route, why it could not be used.
  function analyzeRouteText(text) {
    const blocks = splitRouteBlocks(text);
    const items = [];
    const failedRoutes = [];

    blocks.forEach((block, index) => {
      const { row, errors } = analyzeRouteBlock(block.text);
      if (row) {
        items.push(row);
        return;
      }

      failedRoutes.push({
        number: index + 1,
        lineFrom: block.lineFrom,
        lineTo: block.lineTo,
        preview: buildPreview(block.text),
        errors
      });
    });

    return { items, totalRoutes: blocks.length, failedRoutes };
  }

  function parseRouteText(text) {
    return analyzeRouteText(text).items;
  }

  global.RouteParser = {
    splitRouteBlocks,
    analyzeRouteText,
    parseRouteText
  };
})(window);
