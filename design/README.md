# Дизайн hobbyl

Живой холст (Claude Design): https://claude.ai/artifact/6evZD6opGAHayF1r5E46Yq — главный источник. Эта папка — копия на 28.10.2026.

- `canvas/` — исходники 10 экранов (`*.dc.html`) и схема холста `canvas.json`. Открываются только на холсте: ссылки `/_blob/...` и `./support.js` работают там.
- `assets/` — картинки карты Киева для макетов (OpenFreeMap, стиль positron, перекрашен). На сайте карта будет живой.
- `map-style-preview.html` — живая карта MapLibre + OpenFreeMap в цветах hobbyl. Открой в браузере. Параметры: `?w=1000&h=800&lat=50.452&lon=30.54&z=11.3`. Код перекраски — основа стиля карты на сайте.

Атрибуция карты обязательна: © OpenFreeMap © OpenMapTiles © OpenStreetMap.

Шрифты (комбинация A): Literata — заголовки, Shantell Sans — волнистые акценты, Onest — текст.
Цвета: зелёный `#2F6B4F`, тёмный текст `#16241D`, фон `#FFFFFF` / `#F5F8F6`.
