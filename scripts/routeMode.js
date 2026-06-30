(function (global) {
  function createRouteModeModule() {
    let isRoutePasteBound = false;

    function normalizeInline(value) {
      return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function normalizeRouteChain(value) {
      return String(value || "")
        .replace(/[\u2192\u279D\u27F6\u21A6]/g, "->")
        .replace(/\s*->\s*/g, " -> ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function splitRouteBlocks(text) {
      const source = String(text || "")
        .replace(/\r\n?/g, "\n")
        .trim();

      const starts = Array.from(source.matchAll(/Маршрут\s(?!:)/gi)).map((match) => match.index);
      if (!starts.length) {
        return [];
      }

      return starts
        .map((startIndex, index) => {
          const endIndex = index + 1 < starts.length ? starts[index + 1] : source.length;
          return source.slice(startIndex, endIndex).trim();
        })
        .filter(Boolean);
    }

    function parseRouteBlock(blockText) {
      const block = normalizeInline(blockText);
      if (!block) {
        return "";
      }

      const taskLabel = "Завдання:";
      const routeLabel = "Маршрут:";
      const taskIndex = block.indexOf(taskLabel);
      const routeIndex = block.lastIndexOf(routeLabel);

      if (taskIndex === -1 || routeIndex === -1 || routeIndex <= taskIndex) {
        return "";
      }

      const title = normalizeInline(block.slice(0, taskIndex));
      const task = normalizeInline(block.slice(taskIndex + taskLabel.length, routeIndex));
      const route = normalizeRouteChain(block.slice(routeIndex + routeLabel.length));

      if (!title || !task || !route) {
        return "";
      }

      return `${title}\n${taskLabel} ${task}\n${routeLabel} ${route}`;
    }

    function buildFormattedRouteText(text) {
      const blocks = splitRouteBlocks(text);
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
