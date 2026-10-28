# Правила кода hobbyl

Источник истины для всех агентов и людей. `CLAUDE.md`, `AGENTS.md`, `.clinerules` ссылаются сюда.

## Перед коммитом

`npm run check` должен пройти: типы, линтер, тесты, сборка. Если меняли логику времени, очистку HTML или стиль карты — добавить тест рядом (`*.test.ts`).

## Стек и версии

- Next.js 16 (App Router). `params` и `searchParams` — это Promise: `await params` в серверных компонентах, `use(params)` в клиентских.
- Компонент с `useSearchParams` оборачивать в `<Suspense>`.
- React 19, TypeScript strict, импорт через `@/` (= `src/`).
- Tailwind CSS 4: токены в `@theme` (`src/app/globals.css`). Свои классы — через `@utility`, не через `@layer components` + `@apply`.
- MapLibre GL 6: только в клиентских компонентах через `import('maplibre-gl')`. Воркер копируется в `public/` скриптом и подключается `setWorkerUrl`. CSS MapLibre не в слоях Tailwind и перебивает утилиты (например, `.maplibregl-map { position: relative }`), поэтому контейнер карты не позиционировать классами напрямую.
- Шрифты — пакеты `@fontsource/*`, не `next/font/google` (сборка не должна зависеть от сети).

## Время

- Всё время — `Europe/Kyiv`, функции из `src/lib/time.ts`. Нельзя `new Date().getHours()` и `toLocaleString()` без `timeZone`.
- Переход на летнее/зимнее время покрыт тестами — не ломать.

## Данные пользователя

- HTML от ведущего показывать только после `sanitizeHtml` (`src/lib/sanitize.ts`). Никакого `dangerouslySetInnerHTML` с сырым текстом.
- Параметр `next` в ссылках пропускать через `safeNext` — только внутренние пути.
- Состояние в браузере — только через `src/lib/store.ts` (`useSyncExternalStore`); то, что зависит от localStorage, рисовать после `useHydrated()`, иначе ошибка гидратации.
- Секреты — только в переменных окружения, ключ service-role Supabase — только на сервере.

## Стиль

- Тексты интерфейса — на украинском. Комментарии в коде — коротко, на украинском, только «почему», а не «что».
- Не добавлять тревоги, стикеры, видео-блоки — владелец от них отказался.
- Кнопки и ссылки не меньше 44×44 px, у иконок-кнопок — `aria-label`.
