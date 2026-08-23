(function (global) {
  let activeModalCleanup = null;

  function openCsvTemplateModal(config) {
    const {
      modalTemplate,
      title,
      message,
      messageHtml,
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
      if (messageHtml) {
        messageNode.innerHTML = messageHtml;
      } else {
        messageNode.textContent = message || "";
      }
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
      messageHtml: `<nav class="csv__modal-nav" aria-label="Розділи інструкції">
  <a href="#parsing-points">Точки</a>
  <a href="#parsing-routes">Маршрути</a>
  <a href="#parsing-polygons">Полігони</a>
</nav>

<section class="csv__modal-section" id="parsing-points">
  <h3 class="csv__modal-section-title">Точки</h3>
  <div class="csv__modal-copy">Загальний принцип
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
- Виняток: якщо рядок – це лише валідна MGRS-координата (наприклад, "36T TR 80772 15229"), він все одно потрапляє в таблицю окремим рядком, де заповнено лише coordinates.
- В інших випадках рядок вважається невалідним для цього формату і у таблицю не потрапляє.

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
1) 36T TR 80772 15229 - 3
  coordinates = 36T TR 80772 15229
  quantity = 3
  name = ""

2) 36T TR 80772 15229 - Танк
  coordinates = 36T TR 80772 15229
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
1) 36T TR 80772 15229 - Танк - 2
  coordinates = 36T TR 80772 15229
  name = Танк
  quantity = 2
  additional_information = ""

2) 36T TR 80772 15229 - Танк - рух на північ
  coordinates = 36T TR 80772 15229
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
  - 2 дефіси: КООРДИНАТИ - НАЗВА - КІЛЬКІСТЬ/ОПИС</div>
</section>

<section class="csv__modal-section" id="parsing-routes">
  <h3 class="csv__modal-section-title">Маршрути</h3>
  <div class="csv__modal-copy">Для побудови маршруту перемкніть режим обробки на "Маршрути".

Кожен блок маршруту - це група непорожніх рядків підряд. Блоки відокремлюються одним порожнім рядком (новий абзац). Межа блоку визначається виключно переносами рядків - конкретні слова в тексті на це не впливають.

Підтримуються два формати блоку:

1. Повний опис (блок з 3 і більше рядків):
Маршрут 1
Завдання: патрулювання району
Маршрут: 50.4501, 30.5234 -> 50.4547, 30.5167 -> 50.4488, 30.5245

У повному форматі роль рядка визначається лише його позицією в блоці:
- 1-й рядок блоку -> назва;
- 2-й рядок блоку -> додаткова інформація;
- 3-й і всі наступні рядки блоку -> точки маршруту в порядку проходження.

Мітки типу "Завдання:" і "Маршрут:" необов'язкові - це лише зручний запис. Якщо на початку 2-го чи 3-го рядка є будь-яке слово з двокрапкою, воно автоматично видаляється; якщо мітки немає - використовується весь рядок як є.

2. Лише координати, по одній точці MGRS в кожному рядку (блок, де АБСОЛЮТНО всі рядки – валідні координати):
36T WP 22640 28310
36T WP 23220 27040
36T WP 21490 27260

У цьому форматі назва не заповнюється, а всі точки блоку зберігаються в полі coordinates. Формат координат такий самий, як у режимах "Точки"/"Полігони" (зона + літера смуги + дві літери квадрата + цифри); десяткові градуси вигляду "50.4501, 30.5234" окремим рядком у цьому форматі не розпізнаються.

Спільне для обох форматів:
Для одного маршруту потрібно вказати щонайменше дві точки. Точки в межах одного рядка можна розділяти символами "->", "→", "➝", "⟶" або "↦". Програма нормалізує їх і збереже точки в одному полі coordinates.

Щоб додати кілька маршрутів, відокремлюйте блоки порожнім рядком (можна вільно поєднувати формат 1 і формат 2 в різних блоках). Після натискання "Підготувати таблицю" кожен блок стане окремим рядком із геометрією LineString.
</div>
</section>

<section class="csv__modal-section" id="parsing-polygons">
  <h3 class="csv__modal-section-title">Полігони</h3>
  <div class="csv__modal-copy">Для побудови полігонів перемкніть режим обробки на "Полігони".

Підтримується формат із MGRS-координатами всередині тексту. Ви можете вставляти як "чисті" координати, так і описи населених пунктів/напрямків - програма автоматично витягне координати.

Вимоги:
1. Для одного полігону потрібно щонайменше 3 координати.
2. Кожен окремий блок тексту = окремий полігон.
3. Контур полігону замикається автоматично (перша точка додається в кінець).

Як розділяти кілька полігонів:
1. Рекомендовано: порожній рядок між блоками (новий абзац).
2. Також підтримується: завершення блоку символом ";" і перехід на новий рядок.

Приклад для трьох полігонів :
Сектор 1 (36T WP 22640 28310), півд. Ялти (36T WP 23220 27040), зах. Ялти (36T WP 21490 27260);
Сектор 2 (36T WP 24810 29650), півн.-сх. Ялти (36T WP 25840 28730), сх. Ялти (36T WP 24460 27920);

У результаті кожен блок стане окремим рядком таблиці та окремим рядком у CSV.
Назви виставляються автоматично: "Полігон 1", "Полігон 2", "Полігон 3".</div>
</section>`,
      confirmText: "Закрити",
      singleButton: true,
      onConfirm: () => {}
    });
  }

  global.openCsvTemplateModal = openCsvTemplateModal;
  global.openInputParsingHelpModal = openInputParsingHelpModal;
})(window);
