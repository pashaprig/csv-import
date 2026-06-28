const COLUMNS = [
    { value: "sidc", description: "код SIDC", selected: true },
    { value: "name", description: "назва", selected: true },
    { value: "quantity", description: "кількість", selected: true },
    { value: "observation_datetime", description: "час виявлення", selected: false },
    { value: "end_datetime", description: "час завершення", selected: false },
    { value: "reliability_credibility", description: "надійність / достовірність", selected: false },
    { value: "staff_comments", description: "зауваження штабу", selected: false },
    { value: "platform_type", description: "тип джерела", selected: true },
    { value: "additional_information", description: "додаткова інформація", selected: false },
    { value: "higher_formation", description: "вище формування", selected: true },
    { value: "target_number", description: "номер цілі", selected: false },
    { value: "target_number_extension", description: "розширення номера цілі", selected: false },
    { value: "direction", description: "напрям", selected: false },
    { value: "speed", description: "швидкість", selected: false },
    { value: "damage_details", description: "деталі ураження", selected: false },
    { value: "comments", description: "коментарі", selected: false },
    { value: "fill-color", description: "колір заливки", selected: false },
    { value: "fill-opacity", description: "прозорість заливки", selected: false },
    { value: "outline-color", description: "колір обведення", selected: false },
    { value: "geometry", description: "вид об'єкта", selected: true },
    { value: "coordinates", description: "координати", selected: true }
];

const GEOMETRY = {
    "Point": "Point",
    "LineString": "LineString",
    "Polygon": "Polygon"
};

const SOURCE_TYPES = {
    "POW": "Військовополонений (Впл)",
    "HUMINT": "Агентурна розвідка (АгР)",
    "CAPDOC": "Захоплений документ (ЗДок)",
    "COMINT": "Радіорозвідка (РР)",
    "GRDREC": "Наземна розвідка (НазР)",
    "AIRREC": "Повітряна розвідка (ПовР)",
    "ELINT": "Радіотехнічна розвідка (РТР)",
    "ARTOBS": "Артилерійська розвідка (АР)",
    "SAT": "Супутники (Супут)",
    "GSRA": "Радіолокаційна станція наземного типу (РЛС)",
    "OBSR": "Спостережний пункт (СП)",
    "FO": "Коригувальник (Кор)",
    "SORNG": "Звукометрична розвідка (ЗвР)",
    "CONTAC": "Технічні засоби розвідки (ТЗР)",
    "PI": "Фотознімок (Фото)",
    "REFUGE": "Біженець (Біжен)",
    "EYOBSN": "Очевидець (Очв)",
    "CAPMAT": "Захоплені МТЗ (ЗМТЗ)",
    "CBRR": "Контрбатарейний радар (КбР)",
    "VARI": "Різні джерела (РДж)",
    "DEFECT": "Перебіжчик (Переб)",
    "FLRNG": "Світлометрична розвідка (СвР)",
    "UGS": "Автономний наземний датчик (АНД)",
    "UNSPEC": "Невизначене джерело (Н/Д)"
};