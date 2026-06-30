(function (global) {
  let activeModalCleanup = null;

  function openCsvTemplateModal(config) {
    const {
      modalTemplate,
      title,
      message,
      confirmText,
      cancelText,
      singleButton,
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

    if (singleButton) {
      cancelButton.hidden = true;
      cancelButton.setAttribute("aria-hidden", "true");
      cancelButton.style.display = "none";
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

  function openInputParsingHelpModal(modalTemplate) {
    openCsvTemplateModal({
      modalTemplate,
      title: "Інструкція парсингу вхідного тексту",
      message: `Загальний принцип
Парсер читає кожен рядок окремо і шукає саме шаблон:
пробіл + дефіс (або довге тире) + пробіл

Тобто коректні приклади розділювача:
" - "
" – "

Некоректно для розбиття:
"текст-текст" (без пробілів)
"текст -текст"
"текст- текст"

Крок 1. Попередня нормалізація
Перед розбором рядка:
1. Прибираються зайві пробіли (кілька пробілів стискаються в один).
2. Порожні рядки ігноруються.

Крок 2. Підрахунок розділювачів
Парсер дивиться, скільки разів у рядку зустрічається " - " (або " – ").

Можливі сценарії:

1. Розділювачів немає (0)
- Рядок вважається невалідним для цього формату.
- У таблицю не потрапляє.

2. Є 1 розділювач
Формат очікується такий:
КООРДИНАТИ - ДРУГА_ЧАСТИНА

Що робить парсер:
- Ліва частина -> coordinates
- Права частина:
  якщо починається з цифри -> quantity
  якщо не починається з цифри -> name
- Інші поля заповнюються порожніми значеннями/дефолтами.

Приклади:
1) 37T BN 84046 88547 - 3
  coordinates = 37T BN 84046 88547
  quantity = 3
  name = ""

2) 37T BN 84046 88547 - Танк
  coordinates = 37T BN 84046 88547
  name = Танк
  quantity = ""

3. Є 2 розділювачі
Формат очікується такий:
КООРДИНАТИ - НАЗВА - ТРЕТЯ_ЧАСТИНА

Що робить парсер:
- Перша частина -> coordinates
- Друга частина -> name
- Третя частина:
  якщо схожа на кількість -> quantity
  інакше -> additional_information

Приклади:
1) 37T BN 84046 88547 - Танк - 2
  coordinates = 37T BN 84046 88547
  name = Танк
  quantity = 2
  additional_information = ""

2) 37T BN 84046 88547 - Танк - рух на північ
  coordinates = 37T BN 84046 88547
  name = Танк
  quantity = ""
  additional_information = рух на північ

4. Розділювачів більше ніж 2
- Рядок відхиляється як невалідний у цьому форматі.
- У таблицю не потрапляє.

Важливі зауваження
1. Порядок частин дуже важливий.
2. Саме кількість розділювачів визначає сценарій розбору.
3. Якщо хочете стабільний результат, дотримуйтесь шаблонів:
  - 1 дефіс: КООРДИНАТИ - НАЗВА/КІЛЬКІСТЬ
  - 2 дефіси: КООРДИНАТИ - НАЗВА - КІЛЬКІСТЬ/ОПИС`,
      confirmText: "Закрити",
      singleButton: true,
      onConfirm: () => {}
    });
  }

  global.openCsvTemplateModal = openCsvTemplateModal;
  global.openInputParsingHelpModal = openInputParsingHelpModal;
})(window);
