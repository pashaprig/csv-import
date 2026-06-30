(function (global) {
  let activeModalCleanup = null;

  function openCsvTemplateModal(config) {
    const {
      modalTemplate,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    } = config;

    if (!modalTemplate) {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
      return;
    }

    if (typeof activeModalCleanup === "function") {
      activeModalCleanup();
    }

    const fragment = modalTemplate.content.cloneNode(true);
    const modalRoot = fragment.querySelector("[data-modal-root]");
    const backdrop = fragment.querySelector("[data-modal-backdrop]");
    const titleNode = fragment.querySelector("[data-modal-title]");
    const messageNode = fragment.querySelector("[data-modal-message]");
    const confirmButton = fragment.querySelector("[data-modal-confirm]");
    const cancelButton = fragment.querySelector("[data-modal-cancel]");

    if (!modalRoot || !confirmButton || !cancelButton) {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
      return;
    }

    if (titleNode) {
      titleNode.textContent = title || "";
    }

    if (messageNode) {
      messageNode.textContent = message || "";
    }

    if (confirmText) {
      confirmButton.textContent = confirmText;
    }

    if (cancelText) {
      cancelButton.textContent = cancelText;
    }

    let isClosed = false;

    const closeModal = (isConfirmed) => {
      if (isClosed) return;
      isClosed = true;
      document.removeEventListener("keydown", onKeyDown);
      if (modalRoot.parentNode) {
        modalRoot.parentNode.removeChild(modalRoot);
      }
      document.body.classList.remove("csv--modal-open");
      activeModalCleanup = null;

      if (isConfirmed) {
        if (typeof onConfirm === "function") {
          onConfirm();
        }
        return;
      }

      if (typeof onCancel === "function") {
        onCancel();
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeModal(false);
      }
    };

    if (backdrop) {
      backdrop.addEventListener("click", () => closeModal(false));
    }

    cancelButton.addEventListener("click", () => closeModal(false));
    confirmButton.addEventListener("click", () => closeModal(true));

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("csv--modal-open");
    document.body.appendChild(modalRoot);
    confirmButton.focus();

    activeModalCleanup = () => {
      closeModal(false);
    };
  }

  global.openCsvTemplateModal = openCsvTemplateModal;
})(window);
