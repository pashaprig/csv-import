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
3. Символ ";" в кінці рядка (якщо є) прибирається - це необов'язковий розділювач між точками, як і в режимах "Маршрути"/"Полігони".

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

Крок 1. Розбиття тексту на маршрути
Маршрут завершується символом ";" в кінці рядка (після ";" іде перенесення рядка або кінець тексту). Усе, що стоїть між двома такими ";", - це ОДИН маршрут, скільки б рядків він не займав.
- Перенесення рядка без ";" маршрут НЕ завершує - наступний рядок продовжує той самий маршрут.
- Порожні рядки маршрути не розділяють.
- ";" посередині рядка маршрут не завершує.
- Після останнього маршруту ";" можна не ставити.

Крок 2. Пошук координат
У тексті маршруту програма знаходить усі координати MGRS (наприклад, 37T BN 88702 91367).

Між координатами можна ставити будь-що або нічого: пробіл, кому, дефіс, стрілку, перенесення рядка. Координати можна писати навіть впритул одна до одної. Точки маршруту беруться в тому порядку, в якому записані; потрібно щонайменше дві точки.

Крок 3. Назва та додаткова інформація
Текст, що не є координатою, розподіляється так:
1. Перший рядок маршруту до першої координати -> name. Якщо перша координата стоїть уже в першому рядку, назвою стає текст перед нею (наприклад, "переправа 37T BN ..." -> name = переправа).
2. Решта рядків перед першою координатою -> additional_information.
3. Текст після останньої координати -> additional_information.
4. Текст між координатами вважається роздільником і не зберігається.

Слово з двокрапкою на початку рядка ("Завдання:", "Маршрут:") прибирається в рядках, що йдуть в additional_information. У рядку з назвою мітка не прибирається, тому назву пишіть без неї.
Кілька фрагментів additional_information об'єднуються через "; ".

Крок 4. Результат
Кожен маршрут стає окремим рядком таблиці з геометрією LineString. Координати записуються в поле coordinates через кому.

Приклади коректного вводу:

1) По одному маршруту в рядку (2 маршрути):
переправа 37T BN 88702 91367 - 37T BN 88988 91271;
37T BN 89408 89288 37T BN 89703 89309;
  1-й: name = переправа, 2 точки
  2-й: name порожнє, 2 точки

2) Повний опис (1 маршрут):
Маршрут 1
Завдання: патрулювання району
Маршрут: 36T WP 22640 28310 -> 36T WP 23220 27040 -> 36T WP 21490 27260;
  name = Маршрут 1
  additional_information = патрулювання району
  3 точки

3) Точки стовпчиком (1 маршрут):
36T WP 22640 28310
36T WP 23220 27040
36T WP 21490 27260;
  name порожнє, 3 точки

Якщо щось не вдалося розпізнати
Маршрут з помилкою до таблиці не потрапляє, решта маршрутів обробляються як звичайно. Після підготовки таблиці програма показує список проблемних маршрутів: номер маршруту, рядки в полі введення, початок тексту й опис кожної помилки.
Типові причини:
- не знайдено жодної координати;
- знайдено лише одну точку - часто через зайвий ";" у кінці рядка посеред маршруту;
- координату записано з помилкою (бракує або зайві цифри чи літери) - у списку буде вказано, яку саме координату і що з нею не так.
Десяткові координати (50.4501, 30.5234) у режимі "Маршрути" не підтримуються - лише MGRS.
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
1. Основний спосіб - завершення блоку символом ";" і перехід на новий рядок "Enter".
2. Або один порожній рядок між блоками - для сумісності зі старими текстами, якщо ";" у тексті не використовується.

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
