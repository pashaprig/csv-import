const COLUMNS = [
    { value: "sidc", description: "код SIDC", selected: true },
    { value: "name", description: "назва", selected: true },
    { value: "quantity", description: "кількість", selected: false },
    { value: "observation_datetime", description: "час виявлення", selected: false },
    { value: "end_datetime", description: "час завершення", selected: false },
    { value: "reliability_credibility", description: "надійність / достовірність", selected: false },
    { value: "staff_comments", description: "зауваження штабу", selected: false },
    { value: "platform_type", description: "тип джерела", selected: false },
    { value: "additional_information", description: "додаткова інформація", selected: false },
    { value: "higher_formation", description: "вище формування", selected: false },
    { value: "target_number", description: "номер цілі", selected: false },
    { value: "target_number_extension", description: "розширення номера цілі", selected: false },
    { value: "direction", description: "напрям", selected: false },
    { value: "speed", description: "швидкість", selected: false },
    { value: "damage_details", description: "деталі ураження", selected: false },
    { value: "comments", description: "коментарі", selected: false },
    { value: "fill-color", description: "колір заливки", selected: false },
    { value: "fill-opacity", description: "прозорість заливки", selected: false },
    { value: "outline-color", description: "колір обведення", selected: false },
    { value: "geometry", description: "вид об'єкта", selected: false },
    { value: "coordinates", description: "координати", selected: true }
];

const GEOMETRY = [
    { value: "Point", description: "Точка" },
    { value: "Linestring", description: "Маршрут" },
    { value: "Polygon", description: "Полігон" }
];

const SOURCE_TYPES = [
    { value: "POW", description: "Військовополонений (Впл)" },
    { value: "HUMINT", description: "Агентурна розвідка (АгР)" },
    { value: "CAPDOC", description: "Захоплений документ (ЗДок)" },
    { value: "COMINT", description: "Радіорозвідка (РР)" },
    { value: "GRDREC", description: "Наземна розвідка (НазР)" },
    { value: "AIRREC", description: "Повітряна розвідка (ПовР)" },
    { value: "ELINT", description: "Радіотехнічна розвідка (РТР)" },
    { value: "ARTOBS", description: "Артилерійська розвідка (АР)" },
    { value: "SAT", description: "Супутники (Супут)" },
    { value: "GSRA", description: "Радіолокаційна станція наземного типу (РЛС)" },
    { value: "OBSR", description: "Спостережний пункт (СП)" },
    { value: "FO", description: "Коригувальник (Кор)" },
    { value: "SORNG", description: "Звукометрична розвідка (ЗвР)" },
    { value: "CONTAC", description: "Технічні засоби розвідки (ТЗР)" },
    { value: "PI", description: "Фотознімок (Фото)" },
    { value: "REFUGE", description: "Біженець (Біжен)" },
    { value: "EYOBSN", description: "Очевидець (Очв)" },
    { value: "CAPMAT", description: "Захоплені МТЗ (ЗМТЗ)" },
    { value: "CBRR", description: "Контрбатарейний радар (КбР)" },
    { value: "VARI", description: "Різні джерела (РДж)" },
    { value: "DEFECT", description: "Перебіжчик (Переб)" },
    { value: "FLRNG", description: "Світлометрична розвідка (СвР)" },
    { value: "UGS", description: "Автономний наземний датчик (АНД)" },
    { value: "UNSPEC", description: "Невизначене джерело (Н/Д)" }
];

const HIGHER_FORMATIONS = [
    { value: "143 мпс", description: "143 мпс" },
    { value: "155 пмп", description: "155 пмп" },
    { value: "37 омсбр", description: "37 омсбр" },
    { value: "39 омсбр", description: "39 омсбр" },
    { value: "394 мсп", description: "394 мсп" },
    { value: "40 обрмп", description: "40 обрмп" },
    { value: "60 омсбр", description: "60 омсбр" },
    { value: "64 омсбр", description: "64 омсбр" },
    { value: "57 омсбр", description: "57 омсбр" },
    { value: "189 мсп", description: "189 мсп" }
];

const NAME_OPTIONS = [
    { value: "__from_text__", description: "За текстом" },
    { value: "ШГр", description: "ШГр" },
    { value: "РЕБ", description: "РЕБ" },
    { value: "ФПВ", description: "ФПВ" },
    { value: "КТТ", description: "КТТ" }
];

const SIDC_OPTIONS = [
    { value: "10061000001211000000", description: "Мотострілковий п-р" },
    { value: "10066600001100000000", description: "Маршрут / Лінія руху" },           
    { value: "10052500001602000000", description: "Пункт спостереження" },
    { value: "10061000001110020000", description: "Обсл.Ретранслятора" },
    { value: "10061500002017000000", description: "БпЛА коптерного типу" },
    { value: "10061500002016000000", description: "БпЛА літакового типу" },
    { value: "10061500002103000000", description: "Протитанкова міна" },
    { value: "10061500002102000000", description: "Протипіхотна міна" },
    { value: "10061000001505040000", description: "РЕБ - Створення перешкод" },
    { value: "10061000001505050000", description: "РЕБ - Пошук" },
    { value: "10061000001211010000", description: "П-р морської піхоти" },
    { value: "10062500003211000000", description: "Пункт проведення медичної евакуації" },
    { value: "10032500001203000000", description: "Зона інтересів" },
    { value: "10011000000000000000", description: "Невідомо" }
];