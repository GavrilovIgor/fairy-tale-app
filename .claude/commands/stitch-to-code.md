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

## OAuth настройка (выполнено 2026-05-15)

Генерация требует OAuth токен, не API ключ. Настроено:
- ADC credentials: `/Users/igor/.config/gcloud/application_default_credentials.json`
- Quota project: `gen-lang-client-0252922236` (Gemini Default Project)
- Stitch API включён в `gen-lang-client-0252922236`

### Получить свежий OAuth токен:
```python
import json, urllib.request, urllib.parse
with open('/Users/igor/.config/gcloud/application_default_credentials.json') as f:
    c = json.load(f)
data = urllib.parse.urlencode({'client_id':c['client_id'],'client_secret':c['client_secret'],
    'refresh_token':c['refresh_token'],'grant_type':'refresh_token'}).encode()
resp = json.loads(urllib.request.urlopen(
    urllib.request.Request('https://oauth2.googleapis.com/token',data=data)).read())
TOKEN = resp['access_token']
```

### Генерация экрана:
```bash
curl -X POST "https://stitch.googleapis.com/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Goog-User-Project: gen-lang-client-0252922236" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_screen_from_text",
    "arguments":{"projectId":"10825086214956187728","deviceType":"MOBILE","prompt":"..."}}}'
```

Ответ содержит `outputComponents[0].design.screens[0]` с `screenshot.downloadUrl` и `htmlCode.downloadUrl`.

## Важно
- После генерации НЕ повторять запрос — poll через `get_screen` если таймаут
- Stitch MCP читает через API ключ, генерирует через OAuth Bearer токен
- Chips Stitch генерирует вертикально (flex-col), не горизонтально
