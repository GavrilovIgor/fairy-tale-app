#!/bin/bash
# Автослушатель задач: Telegram → ntfy.sh → Claude Code
# Автозапуск: ~/Library/LaunchAgents/com.skazka.claude-listener.plist

NTFY_TOPIC="skazka-igor-tasks-9fcc8d92"
PROJECT_DIR="/Users/igor/Projects/fairy-tale-app"
LOG_FILE="/Users/igor/Library/Logs/claude-listener.log"
LAST_ID_FILE="/tmp/ntfy-last-skazka-id"  # ID последнего обработанного сообщения

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

process_task() {
  local task="$1"
  local id="$2"
  log "📨 Задача: $task"

  # Сохранить ID чтобы не пропустить при пробуждении Мака
  echo "$id" > "$LAST_ID_FILE"

  # 1. Открыть Terminal с Claude Code
  osascript - "$task" "$PROJECT_DIR" <<'END_SCRIPT'
on run argv
  set taskText to item 1 of argv
  set projDir to item 2 of argv
  tell application "Terminal"
    activate
    do script "cd '" & projDir & "' && clear && claude --dangerously-skip-permissions"
  end tell
  -- Подождать пока Claude запустится (обычно 3-4 сек)
  delay 4
  -- Напечатать задачу в активный терминал и нажать Enter
  tell application "System Events"
    tell application "Terminal" to activate
    keystroke taskText
    key code 36
  end tell
end run
END_SCRIPT

  log "✅ Claude запущен с задачей"
}

log "🎧 Старт. Канал: $NTFY_TOPIC"

# Бесконечный цикл с переподключением (на случай падения соединения)
while true; do
  # При старте/пробуждении — подтянуть пропущенные сообщения
  LAST_ID=$(cat "$LAST_ID_FILE" 2>/dev/null)
  if [[ -n "$LAST_ID" ]]; then
    SINCE_PARAM="?since=$LAST_ID"
    log "📡 Переподключение. Подтягиваю пропущенные с ID: $LAST_ID"
  else
    SINCE_PARAM="?since=$(date +%s)"
    log "📡 Первый запуск. Слушаю с этого момента..."
  fi

  curl -sN "https://ntfy.sh/${NTFY_TOPIC}/sse${SINCE_PARAM}" 2>>"$LOG_FILE" | \
  while IFS= read -r line; do
    [[ "$line" != data:* ]] && continue
    json="${line#data: }"

    id=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('id', ''))
except: pass
" <<< "$json" 2>/dev/null)

    task=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    msg = d.get('message', '')
    # Пропускаем служебные keep-alive события без текста
    if msg: print(msg)
except: pass
" <<< "$json" 2>/dev/null)

    [[ -z "$task" || "$task" == "null" ]] && continue
    [[ "$id" == "$LAST_ID" ]] && continue  # Уже обработали

    process_task "$task" "$id"
  done

  log "⚠️ Соединение прервано. Переподключение через 5 сек..."
  sleep 5
done
