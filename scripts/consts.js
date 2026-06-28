const COLUMNS = [
    { value: "sidc", description: "код SКМД", selected: true },
    { value: "name", description: "назва", selected: true },
    { value: "quantity", description: "кількість", selected: true },
    { value: "observation_datetime", description: "час виявлення", selected: false },
    { value: "end_datetime", description: "час завершення", selected: false },
    { value: "reliability_credibility", description: "надійність / достовірність", selected: false },
    { value: "staff_comments", description: "зауваження штабу", selected: false },
    { value: "platform_type", description: "тип платформи", selected: true },
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
    { value: "outline-color", description: "колір обведення", selected: false },
    { value: "geometry", description: "координати", selected: true },
    { value: "coordinates", description: "координати", selected: true }
];

const GEOMETRY = {
    "Point": "Point",
    "LineString": "LineString",
    "Polygon": "Polygon"
}