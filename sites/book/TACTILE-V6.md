# Тактильный альбом — правка по отклонению v5

Пользователь отклонил CSS-подобные рамки, обычную галерею, сухую последовательность 1–5 и узкий заголовок Италии. Это не смена бренда: hero, зелёный/золотой, оригинальный паспорт и все семь разделов сохраняются.

## Новое соответствие

- Четыре составляющие: те же оригинальные фото и объяснения, сверху настоящая сгенерированная рамка Polaroid, без изменения фотографий
- Маршрут: те же пять смыслов, теперь отдельные моменты вечера с реальными книгой/столом/людьми/именными карточками/паспортом; цифры больше не главный визуальный элемент
- Италия: заголовок получает полную ширину, верхняя дублирующая CTA удалена по запросу
- Шесть кадров на главной: сохранены и сгруппированы в три разворота. На мобильном шесть полноразмерных отдельных страниц вместо двух крошечных фотографий
- Два видео, самостоятельный архив Италии и все десять его фото сохраняются; ссылка на архив остаётся в паспорте, не дублируется перед теми же кадрами

## Реальные растровые материалы

Встроенный ImageGen (не CLI) сгенерировал две пустые материальные подложки. Лица, книги, блюда и события не генерировались; настоящий логотип не перерисовывался. Оригинальные PNG сохранены рядом с WebP для веба; преобразование только формата, без изменения композиции/альфа.

- assets/polaroid-real-v6.png, assets/polaroid-real-v6.webp: 1122×1402, RGBA, прозрачный проём. Prompt: photorealistic empty instant-film Polaroid frame; top-down, unrotated, warm ivory textured photographic paper, worn edges, curled corner, amber paper tape, generous blank bottom margin, warm side light and directional contact shadow; fully transparent central aperture and exterior; no photo/people/text/logo/watermark. Portrait4:5, website cream/forestpalette, aperture roughly x9–91%, y9–74%
- assets/photo-album-real-v6.png, assets/photo-album-real-v6.webp: 1536×1024, RGBA. Prompt: photorealistic overhead open photograph album with two broad empty cream archival paper pages, deep forest-green linen cover, sewn centerbinding, paperstack/featherededges, burgundy ribbon, warm afternoon sidelight and contactshadow, wholeobject visible, transparent exterior; no photos/text/people/props/logos. Landscape3:2, forest#363e2e, ivory#f4e9cf, antiquegold, burgundy

## Взаимодействие

Перелистывание — пространственная связь между страницами, не автокарусель. Кнопки, клавиши и горизонтальный свайп; текущая страница объявляется aria-live. WAAPI transform/opacity, 260ms с существующим --ease. Keyboard/reduced-motion мгновенно, текущая анимация отменяется при следующем действии. Без JS все развороты/фотографии остаются обычным видимым HTML. Никакой предварительной opacity0 для текста, нет повторяющегося scroll-fade.

## Ответ о боте — только объяснение, без изменения кода

Есть два пути. Обычный sendDocument поддерживает caption, reply_markup и thumbnail: PDF + подпись + кнопки могут быть одним сообщением; caption не меняет тип PDF-вложения, thumbnail может быть проигнорирован. Более новое sendRichMessage поддерживает структурированное сообщение с photo/text/document blocks и кнопками; InputRichBlockDocument содержит type=document и document=InputMediaDocument. Ни один вариант в nash-hleb-bot в этом ходе не подключался и не тестировался; отображение и совместимость богатого сообщения нужно проверить в конкретных клиентах Telegram. Официальные источники: https://core.telegram.org/bots/api#senddocument, https://core.telegram.org/bots/api#sendrichmessage, https://core.telegram.org/bots/api#inputrichblockdocument.

## Проверка текущей локальной сборки v6

Подложки: polaroid-real-v6.webp — RGBA 1122×1402, 167180 байт; photo-album-real-v6.webp — RGBA 1536×1024, 124160 байт. Промпты и исходные PNG указаны в IMAGEGEN-V6.json. Фотографии остаются самостоятельными HTML-изображениями: подложки не изменяют реальных людей, блюда, книги и паспорт.

Четыре темы формата сохранены вокруг центра на desktop и 2×2 на mobile. Все пять остановок показаны с конкретным фото и объяснением; доминирующих цифр нет, бумажный паспорт пояснён прямо. Заголовок Италии в воспоминаниях главной занимает 1111px при viewport 1280px, дублирующей верхней CTA нет. Отдельный архив /book/italy/ сохраняет все десять реальных фотографий.

В actual UI проверено переключение desktop-разворотов 1 → 2 → 3 и disabled next на последнем. Мобильная клавиатура переключила страницу 1 → 2, aria-live сообщил страницу 2 из 6. Стрелки и счётчик находятся перед книгой. Мышь/свайп запускают WAAPI rotateY/opacity 260ms с существующим easing; новое действие отменяет прежнюю анимацию. Keyboard/reduced-motion мгновенны. Без JS все три разворота и шесть снимков остаются видимым HTML; скрытие отдельных страниц появляется только после enhancement через hidden.

Главная при 1280/390/320px: горизонтального переполнения нет, broken images — 0. Подпись «Знакомство по‑итальянски» на странице 2 при 320px имеет высоту 53.08px и scrollHeight 53px; неразрывный дефис сохраняет слово. Шесть Node-проверок прошли. После перезапуска локального Next production preview новые статические файлы вернули HTTP 200: новые public-ассеты потребовали обновления серверного inventory. Адрес текущей проверки: http://127.0.0.1:4384/book/?preview=tactile-v6.

Скриншоты: .impeccable/review/v6-format-desktop.png, v6-format-mobile.png, v6-route-desktop.png (все пять остановок), v6-route-mobile.png, v6-italy-desktop.png (заголовок целиком и управление), v6-italy-mobile.png (390px), v6-italy-page2-320.png, v6-videos-mobile.png.

Оба видео и их файлы сохранены без изменения. Ранее в v5 оба actual UI плеера дошли до конца (16.275 / 10.749 с, readyState 4, error null); в v6 не заявляется повторное проигрывание. Detector выполнен один раз в regex degraded режиме и оставил advisory по унаследованному длинному тире и шкале шрифтов. Действующая шкала внесена в DESIGN.md и sidecar; типографические значения не менялись ради advisory.

Свежая проверка после пользовательского отклонения и пересборки установила соответствие UI четырём областям запроса; оставшаяся точная правка касалась устаревшей документации. DESIGN.md и .impeccable/design.json теперь отражают v6. Это техническая проверка в заявленном объёме, не пользовательское одобрение и не публичная публикация. Коммит и публикация не выполнялись.

Уточнение ответа о Telegram: ordinary sendDocument сохраняет тип PDF-вложения, а новый sendRichMessage имеет отдельный document block. Нельзя распространять ограничение обычного сообщения на все API. В текущем ходе код nash-hleb-bot не изменялся.
