#!/bin/bash
# Автослушатель задач: Telegram бот → ntfy.sh → Claude Code
# Запускается автоматически через LaunchAgent при входе в систему

NTFY_TOPIC="skazka-igor-tasks-9fcc8d92"
PROJECT_DIR="/Users/igor/Projects/fairy-tale-app"
LOG_FILE="/Users/igor/Library/Logs/claude-listener.log"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

log "🎧 Старт слушателя задач. Канал: $NTFY_TOPIC"

while true; do
  log "📡 Подключение к ntfy.sh..."

  curl -sN "https://ntfy.sh/${NTFY_TOPIC}/sse" 2>>"$LOG_FILE" | while IFS= read -r line; do
    if [[ "$line" == data:* ]]; then
      json="${line#data: }"
      task=$(echo "$json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    msg = d.get('message', '')
    if msg: print(msg)
except: pass
" 2>/dev/null)

      if [[ -n "$task" ]]; then
        log "📨 Новая задача: $task"

        # Открыть новый терминал с Claude Code и задачей
        osascript - "$task" "$PROJECT_DIR" <<'APPLESCRIPT'
on run argv
  set taskText to item 1 of argv
  set projDir to item 2 of argv
  tell application "Terminal"
    activate
    set newTab to do script "cd '" & projDir & "' && clear && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '📋 ЗАДАЧА ИЗ TELEGRAM:' && echo '' && echo '  " & taskText & "' && echo '' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && echo '' && claude --dangerously-skip-permissions"
  end tell
end run
APPLESCRIPT

        log "✅ Терминал открыт"
      fi
    fi
  done

  log "⚠️ Соединение прервано, переподключение через 5 сек..."
  sleep 5
done
