# MyWorld: раскрытые свитки и управление доской

Пользователь выбрал японский свиток с двумя скрученными краями для всех содержательных карточек, предложил попробовать портрет в рамке-цубе и один декоративный акцент катаны. Растровое искусство генерируется ImageGen, не подменяется SVG/CSS-рисунками. Реальные лица не перегенерируются, заголовки и абзацы остаются HTML.

## Соответствие исходных блоков

- Hero: прежний текст, CTA и portrait.jpg; новая отдельная рамка-цуба и катана в ножнах.
- Услуги: все семь заголовков и полные описания сохранены, каждый в раскрытом свитке.
- Автор: сохранены вводный текст и пять исходных преимуществ; по правке 09.10 используется другая реальная фотография night.jpg на фоне вечернего города, преимущества разнесены по свиткам. Hero-фотография не изменена.
- Подход: все шесть заголовков и полные описания сохранены, теперь на читаемой бумажной поверхности.
- Работы: та же ссылка на исходную доску, никакие проекты не удалены.
- Форма: те же поля, согласие, обработка и подтверждение; полноширинная отправка на мобильном, без декоративного сужения формы.
- Правовые документы и настройки cookies: содержание и обработка не меняются.

## Ассеты и задания генерации

Встроенный ImageGen, не CLI/API. Проектные файлы: public/media/japanese-scroll-v1.webp (170180 байт), tsuba-frame-v1.webp (185558), katana-v1.webp (38682). WebP после пропорционального уменьшения, альфа сохранена. Исходники остаются в каталоге generated_images.

Scroll prompt: Single beautifully crafted antique Japanese horizontal scroll, front-facing nearly orthographic, fully opened generous blank ivory washi center, curled rolled paper at BOTH LEFT AND RIGHT sides with dark wooden spindle finials, subtly worn silk indigo-black mounting, faint muted sakura ink ornament confined to outer edges, tiny vermilion seal at bottom edge with abstract mark not letters. Warm lightly aged parchment but center very light, smooth and quiet for dark HTML text. Width-height ratio around 3:2, large usable rectangular center occupying 75% width and 80% height, organic curled silhouette, refined realistic photographic material, premium artisan object, restrained age not distressed grunge. Isolated transparent background, no drop shadow baked outside object, no scenery, no hands, no text, no UI, no extra objects. Exactly one scroll, flat frontal view suitable reusable card background.

Frame prompt: Exactly one Japanese tsuba-inspired portrait FRAME, front-facing flat view, rounded four-lobed silhouette with antique dark iron and tiny bronze inlay sakura engraved at lower edge. Large clear TRANSPARENT central opening, roughly oval upright opening occupying 75 percent of object width and height, sized for real portrait photo to show through. No nakago slot, no small holes, no imagery or person in center. Frame thin enough not to hide face or shoulders, outer contour subtly sculptural quatrefoil not rectangular card. Premium museum-quality photographed metal, no glossy fantasy, no text. Isolated on fully transparent background, square composition, frame fills canvas with small safe margin. Adapted tsuba silhouette with one very large transparent portrait opening and NO OTHER HOLES.

Katana prompt: Exactly ONE elegant Japanese katana fully SHEATHED in black lacquer saya, black woven handle, aged bronze tsuba, restrained sakura engraved detailing. Horizontal isolated side view with handle on LEFT and curved sheath tip on RIGHT, entire sword visible, slight gentle curve. Premium artisan realistic photography, soft natural light, no dramatic glow, no unsheathed blade, no weapon action, no person, no scenery, no lettering, no watermark. Fully transparent background, wide canvas about 3:1, fills width with safe margin. Refined still-life decoration for a Japanese-inspired personal portfolio.

## Доска

Фиксированная панель вне двигающегося world. Четыре направления, 44×44 px mobile / 46×46 desktop. Нажатие сдвигает камеру на 100 px, удержание — на 38 px каждые 100 ms. Захват указателя, остановка на отпускании, отмене, потере захвата, blur, скрытии документа и unmount. Клавиатурный click также поддержан. Bounds используются те же, что при ручном перемещении. Сам состав и свободная механика доски сохранены.

## Граница проверки

Это локальный вариант. Автоматические проверки браузера, контента и TypeScript не доказывают поведение внутри настоящего клиента Телеграма. disableVerticalSwipes в TelegramCanvasGuard остаётся локальной защитой, которую нужно проверить после публикации в Mini App. Сервер не развёрнут в этом ходе, коммит и push не выполнены.
