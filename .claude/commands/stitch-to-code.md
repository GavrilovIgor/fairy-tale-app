# /stitch-to-code — Stitch Design → Code

Генерирует новый экран в Stitch и имплементирует в код проекта.

## Использование
```
/stitch-to-code <описание экрана>
```

## Алгоритм

### Шаг 1 — Генерация в Stitch
Используй `generate_screen_from_text` через Stitch MCP:
- `projectId`: `10825086214956187728`
- `designSystem`: `assets/0190f6cff6d942a596aadfc2808eca0c`
- `deviceType`: MOBILE или DESKTOP
- `modelId`: `GEMINI_3_1_PRO`
- `prompt`: добавь контекст дизайн-системы: "Warm cream #fdf9f3 background, sage green #466252 primary, clay morphism inputs (#f1ede7 bg with inset shadows), pill chips, Plus Jakarta Sans font. Magic Fairy Tales therapeutic children app."

### Шаг 2 — Получение HTML
После генерации вызови `get_screen` с name полученного экрана:
- Скачай `htmlCode.downloadUrl`
- Извлеки CSS классы: `.clay-card`, `.clay-input`, `.clay-button`, `.clay-chip`
- Извлеки цвета и структуру

### Шаг 3 — Скриншот для сравнения
Скачай `screenshot.downloadUrl` → сохрани в `/tmp/stitch_new.jpg` → прочитай через Read tool → покажи пользователю

### Шаг 4 — Имплементация
- Перенеси HTML структуру в React компонент (`app/page.tsx`)
- Используй CSS классы из `globals.css` (clay-card, clay-input, clay-btn, clay-chip)
- Сохрани цвета из CSS переменных (`var(--primary)`, `var(--bg)`)
- Сделай скриншот через Playwright и сравни с Stitch

### Шаг 5 — Верификация
```bash
CHROMIUM="/Users/igor/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
"$CHROMIUM" --headless=new --screenshot=/tmp/result.png --window-size=390,844 http://localhost:3000
```
Прочитай `/tmp/result.png` и `/tmp/stitch_new.jpg` — сравни визуально

## Дизайн-система проекта

| Токен | Значение |
|---|---|
| Background | `#fdf9f3` |
| Primary | `#466252` (sage green) |
| Input bg | `#f1ede7` |
| Chip unselected | `#e6e2dc` |
| Text | `#1c1c18` |
| Font | Plus Jakarta Sans |
| Clay card shadow | `inset 4px 4px 10px rgba(255,255,255,0.8), inset -4px -4px 10px rgba(0,0,0,0.05), 8px 8px 20px rgba(0,0,0,0.05)` |
| Clay input shadow | `inset 4px 4px 8px rgba(0,0,0,0.05), inset -4px -4px 8px rgba(255,255,255,0.8)` |

## Stitch Project
- URL: https://stitch.withgoogle.com
- Project ID: `10825086214956187728`
- MCP endpoint: `https://stitch.googleapis.com/mcp`
- API Key: stored in `~/.config/secrets/google-stitch.env`

## Важно
- После генерации НЕ повторять запрос если таймаут — poll через `get_screen` каждые 30 сек
- Для генерации нужен OAuth (не API key) — настроить через `npx @_davideast/stitch-mcp@latest init`
- MCP инструменты Stitch доступны только после рестарта Claude Code
