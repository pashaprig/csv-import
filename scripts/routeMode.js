(function (global) {
  function createRouteModeModule() {
    let isRoutePasteBound = false;

    // Re-formats a block using the same positional (label-free) extraction as routeParser.js.
    function parseRouteBlock(blockText) {
      const parts = global.RouteParser.extractRouteBlockParts(blockText);
      if (!parts || !parts.title || !parts.task) {
        return "";
      }

      const route = global.RouteParser.normalizeArrowChain(parts.route);
      if (!route) {
        return "";
      }

      return `${parts.title}\nЗавдання: ${parts.task}\nМаршрут: ${route}`;
    }

    function buildFormattedRouteText(text) {
      const blocks = global.RouteParser.splitRouteBlocks(text);
      if (!blocks.length) {
        return "";
      }

      const formattedBlocks = blocks
        .map(parseRouteBlock)
        .filter(Boolean);

      if (!formattedBlocks.length) {
        return "";
      }

      return formattedBlocks.join("\n\n");
    }

    function insertTextAtCursor(textarea, insertedText) {
      if (!textarea) return;

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);

      textarea.value = `${before}${insertedText}${after}`;

      const caretPosition = start + insertedText.length;
      textarea.setSelectionRange(caretPosition, caretPosition);
    }

    function handleRoutePaste(event) {
      if (!event || !event.clipboardData) {
        return;
      }

      const getCurrentProcessingMode = global.getCurrentProcessingMode;
      if (typeof getCurrentProcessingMode === "function" && getCurrentProcessingMode() !== "route") {
        return;
      }

      const pastedText = event.clipboardData.getData("text");
      if (!pastedText) {
        return;
      }

      const formattedText = buildFormattedRouteText(pastedText);
      if (!formattedText) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      insertTextAtCursor(event.target, formattedText);
    }

    function bindRoutePasteFormatter() {
      if (isRoutePasteBound) {
        return;
      }

      const textarea = document.getElementById("inputText");
      if (!textarea) {
        return;
      }

      textarea.addEventListener("paste", handleRoutePaste, true);
      isRoutePasteBound = true;
    }

    function activate() {
      bindRoutePasteFormatter();

      const textarea = document.getElementById("inputText");
      if (!textarea) {
        return;
      }

      const formattedText = buildFormattedRouteText(textarea.value);
      if (!formattedText || formattedText === textarea.value) {
        return;
      }

      textarea.value = formattedText;
    }

    return {
      activate
    };
  }

  global.createRouteModeModule = createRouteModeModule;
})(window);
