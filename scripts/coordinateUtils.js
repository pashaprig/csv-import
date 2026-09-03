(function (global) {
  // Single source of truth for the MGRS-like coordinate pattern used by point/route parsing and paste normalization.
  const MGRS_COORDINATE_CORE = "\\d{1,2}\\s*[C-HJ-NP-X]\\s*[A-HJ-NP-Z]{2}(?:\\s*\\d{2,5}\\s+\\d{2,5}|\\s*\\d{4}|\\s*\\d{6}|\\s*\\d{8}|\\s*\\d{10})";

  // Cyrillic letters that look identical (or near-identical) to the Latin letters used in
  // MGRS zone/grid designators. People typing on a Cyrillic layout sometimes hit these by
  // mistake — they read the same to a human but break coordinate parsing for the machine.
  const LATIN_TO_CYRILLIC_HOMOGLYPHS = {
    A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М", P: "Р", T: "Т", X: "Х", Y: "У",
    a: "а", c: "с", e: "е", k: "к", m: "м", p: "р", t: "т", x: "х", y: "у"
  };

  const CYRILLIC_TO_LATIN_MAP = Object.entries(LATIN_TO_CYRILLIC_HOMOGLYPHS)
    .reduce((map, [latin, cyrillic]) => {
      map[cyrillic] = latin;
      return map;
    }, {});

  const ZONE_LETTERS = "CDEFGHJKLMNPQRSTUVWX";
  const GRID_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

  function buildHomoglyphTolerantClass(latinLetters) {
    const lowerLatin = latinLetters.toLowerCase();
    const upperCyrillic = latinLetters.split("").map((letter) => LATIN_TO_CYRILLIC_HOMOGLYPHS[letter] || "").join("");
    const lowerCyrillic = lowerLatin.split("").map((letter) => LATIN_TO_CYRILLIC_HOMOGLYPHS[letter] || "").join("");
    return `${latinLetters}${lowerLatin}${upperCyrillic}${lowerCyrillic}`;
  }

  const ZONE_LETTER_CLASS = buildHomoglyphTolerantClass(ZONE_LETTERS);
  const GRID_LETTER_CLASS = buildHomoglyphTolerantClass(GRID_LETTERS);

  // Same shape as MGRS_COORDINATE_CORE, but also accepts the Cyrillic look-alikes above in the
  // letter positions, so a coordinate mistyped with Cyrillic homoglyphs can still be located.
  const MGRS_COORDINATE_CORE_TOLERANT = `\\d{1,2}\\s*[${ZONE_LETTER_CLASS}]\\s*[${GRID_LETTER_CLASS}]{2}(?:\\s*\\d{2,5}\\s+\\d{2,5}|\\s*\\d{4}|\\s*\\d{6}|\\s*\\d{8}|\\s*\\d{10})`;

  function isCoordinateOnlyLine(value) {
    const coordinateRegex = new RegExp(`^${MGRS_COORDINATE_CORE}$`, "i");
    return coordinateRegex.test(String(value || "").trim());
  }

  function createCoordinateScanRegex() {
    return new RegExp(`\\b${MGRS_COORDINATE_CORE}\\b`, "gi");
  }

  function createCoordinateScanRegexTolerant() {
    return new RegExp(`\\b${MGRS_COORDINATE_CORE_TOLERANT}\\b`, "g");
  }

  // Replaces Cyrillic homoglyphs with their Latin equivalents, but only inside substrings that
  // look like an MGRS coordinate — free text elsewhere in the input (names, notes) is untouched.
  function normalizeCyrillicHomoglyphsInCoordinates(text) {
    const source = String(text || "");
    const tolerantRegex = createCoordinateScanRegexTolerant();
    return source.replace(tolerantRegex, (match) => {
      let fixed = "";
      for (const char of match) {
        fixed += CYRILLIC_TO_LATIN_MAP[char] || char;
      }
      return fixed;
    });
  }

  global.CoordinateUtils = {
    isCoordinateOnlyLine,
    createCoordinateScanRegex,
    normalizeCyrillicHomoglyphsInCoordinates
  };
})(window);
