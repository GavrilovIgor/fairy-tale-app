# Волшебная Сказка — AI генератор детских сказок

## Идея проекта

Веб-приложение генерирует персональную детскую сказку на русском языке с иллюстрациями. Родитель вводит информацию о ребёнке (имя, страхи, любимые вещи, желаемый урок), и AI создаёт уникальную сказку ~800 слов (5 минут чтения) разбитую на 3 сцены, каждая с акварельной иллюстрацией.

## Стек

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Gemini API** (`@google/generative-ai`) — генерация текста сказки
- **Pollinations.ai** — бесплатная генерация иллюстраций без API ключа
- **Ollama** установлен локально (mistral, qwen2.5:7b) — не используется сейчас, был заменён на Gemini

## Структура файлов

```
app/
  page.tsx                  — единственная страница (форма + отображение сказки)
  layout.tsx                — метаданные, шрифты
  globals.css               — Tailwind + print styles
  api/
    generate/route.ts       — POST: принимает форму, вызывает Gemini, возвращает JSON сказки
    image/route.ts          — GET: серверный прокси к Pollinations.ai (решает CORS и rate limits)
.env.local                  — GEMINI_API_KEY (не коммитить!)
```

## Как работает генерация

### Текст (`/api/generate`)
1. Принимает: `{ childName, age, hero, fear, favorites, lesson }`
2. Отправляет промпт в Gemini с требованием вернуть JSON
3. Fallback по моделям при 503/429: `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-flash-latest`
4. Возвращает: `{ title: string, scenes: [{ text, imagePrompt }] }`
5. Каждая из 3 сцен: ~270-300 слов на русском + короткий imagePrompt на английском

### Картинки (`/api/image`)
1. Принимает: `?prompt=...&seed=...`
2. Очищает кириллицу из промпта (Pollinations плохо работает с кириллицей)
3. Проксирует запрос к `image.pollinations.ai` с 3 попытками (0s, 3s, 7s задержки)
4. Кэширует ответ на 24 часа

### Фронтенд (`app/page.tsx`)
- Состояния: `idle` → `loading` → `done`
- Компонент `StoryImage` — загружает картинки с задержкой (0/4/8 сек) чтобы не бомбить Pollinations.ai
- Кнопка "Повторить" при ошибке загрузки картинки
- Поддержка печати (`window.print()`) с print-классами Tailwind

## Запуск

### Разработка
```bash
cd "/Users/igor/Documents/Claude /fairy-tale-app"
npm run dev
# Открыть: http://localhost:3000
```

### Продакшн (стабильный, для телефона)
```bash
cd "/Users/igor/Documents/Claude /fairy-tale-app"
npm run build && npm start
```

### Публичный доступ с телефона (ngrok)
```bash
# Ngrok уже настроен с токеном. Просто запустить:
/opt/homebrew/bin/ngrok http 3000
# URL будет вида: https://xxx.ngrok-free.app
```

### Запуск без запросов разрешений Claude Code
```bash
claude --dangerously-skip-permissions
```

## Переменные окружения

`.env.local`:
```
GEMINI_API_KEY=AIzaSy...
```

Ключ получить на: https://aistudio.google.com

## Установленные инструменты

- **Ollama** — запускается автоматически через `brew services` (фон)
  - Модели: `mistral:latest` (4.4GB), `qwen2.5:7b` (4.7GB)
  - API: `http://localhost:11434`
- **ngrok** — токен уже сохранён в `~/Library/Application Support/ngrok/ngrok.yml`
- **Node.js 25**, **npm**

## Известные проблемы и решения

| Проблема | Причина | Решение |
|---|---|---|
| Картинки не грузятся | Pollinations rate limit (429) | Staggered loading 0/4/8s + серверный прокси |
| Кириллица в imagePrompt | Pollinations не понимает русский | Очистка в `/api/image` через regex |
| Gemini 503 overloaded | Высокая нагрузка на модель | Fallback на 3 модели |
| Сайт перезагружается на телефоне | HMR WebSocket в dev режиме | Использовать `npm start` (production) |

## Что ещё можно улучшить (backlog)

- Сохранение сказок (localStorage или база данных)
- Авторизация и личный кабинет
- Выбор стиля иллюстраций
- Аудио — озвучка сказки
- PDF экспорт с красивой вёрсткой
- Деплой на Vercel для постоянного доступа
