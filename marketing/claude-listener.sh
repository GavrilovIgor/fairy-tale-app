#!/bin/bash
# Слушает задачи от Telegram-бота через ntfy.sh и запускает Claude Code
#
# Запуск: bash claude-listener.sh
# Автозапуск: добавить в LaunchAgents (см. ниже)

NTFY_TOPIC="${NTFY_TOPIC:-skazka-igor-tasks-2026}"
PROJECT_DIR="/Users/igor/Projects/fairy-tale-app"

echo "🎧 Слушаю задачи на канале: $NTFY_TOPIC"
echo "📁 Проект: $PROJECT_DIR"
echo "Жду сообщений от бота..."

# Подписываемся на ntfy.sh через SSE (сервер-сентовые события)
curl -s "https://ntfy.sh/${NTFY_TOPIC}/sse" | while read -r line; do
  # Парсим строки SSE — ищем data:
  if [[ "$line" == data:* ]]; then
    # Извлекаем JSON
    json="${line#data: }"

    # Получаем текст задачи из поля "message"
    task=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('message', ''))
except:
    pass
" 2>/dev/null)

    if [[ -n "$task" && "$task" != "null" ]]; then
      echo ""
      echo "📨 Новая задача: $task"
      echo "🚀 Запускаю Claude Code..."

      # Открыть новое окно терминала с Claude Code в нужной директории
      osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '${PROJECT_DIR}' && echo '📋 Задача: ${task}' && claude --dangerously-skip-permissions"
end tell
EOF
      echo "✅ Claude Code запущен"
    fi
  fi
done
