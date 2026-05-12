"""
Скрипт органического постинга в родительские Telegram-группы.
Запускать ТОЛЬКО с отдельного маркетингового аккаунта, НЕ с основного!

Установка: pip install telethon
Настройка: заполни переменные ниже
"""

import asyncio
import random
import logging
from datetime import datetime

from telethon import TelegramClient, errors

# ─── Настройки (заполнить!) ───────────────────────────────────────────────────
API_ID   = 0          # с my.telegram.org → App api_id
API_HASH = ""         # с my.telegram.org → App api_hash
PHONE    = ""         # номер маркетингового аккаунта, напр. "+79991234567"
# ──────────────────────────────────────────────────────────────────────────────

# Целевые группы — от меньших к большим, начинаем аккуратно
TARGET_GROUPS = [
    # Общие родительские чаты (активные, открытые)
    "sovetroditeleyrussia",     # Совет Родителям России
    "chat_mam_v_dekrete",       # Мамы в декрете
    "rodchatik",                # Родительский чат
    "mama_rashan",              # Онлайн Мама

    # Группы по годам рождения детей (дети 3-8 лет — наша аудитория)
    "sentyabryata_2025_Chat",   # Сентябрята 2025
    "oktyabryata_2025_chat",    # Октябрята 2025
    "noyabryata_2025_chat",     # Ноябрята 2025
    "avgustyata_2025_chat",     # Августята 2025

    # Добавь сюда локальные группы своего города — они конвертируют лучше всего
    # "mamy_msk",
    # "roditeli_spb",
]

# Разные варианты поста — не постить одинаковый текст везде
POSTS = [
    """Нашла классный инструмент для укладывания — бот в Telegram генерирует персональную сказку под твоего ребёнка 🌙

Вводишь имя, возраст, страх или проблему (темнота, врач, не делится) — и через минуту готова уникальная сказка именно с твоим ребёнком в главной роли. С иллюстрациями и вопросами для обсуждения.

Три сказки бесплатно: @volshebnaya_skazka_bot""",

    """Мамы, поделитесь — как вы справляетесь с детскими страхами?

Мы недавно попробовали сказкотерапию через ИИ — бот @volshebnaya_skazka_bot пишет персональную сказку под конкретный страх ребёнка (темнота, собаки, врач). Герой проходит через то же, что пугает ребёнка — и преодолевает.

Первые 3 сказки бесплатно, дальше за символическую плату. Нам очень зашло 🙌""",

    """Ищу единомышленников — кто пробовал сказкотерапию для детей?

Наткнулась на бота @volshebnaya_skazka_bot — он создаёт сказку специально под твоего ребёнка: его имя, его страх, его любимый герой. Плюс вопросы для обсуждения после и "предмет-якорь" чтобы закрепить урок.

Ребёнок у меня стал сам просить читать сказку перед сном — раньше такого не было 😄""",

    """Совет родителям дошкольников: если ребёнок чего-то боится или плохо засыпает — попробуйте персональную сказку.

Бот @volshebnaya_skazka_bot делает сказку за 1 минуту: вводишь страх, любимого героя и возраст — получаешь красивую историю с иллюстрациями. Можно распечатать как книжку.

3 сказки бесплатно 👇""",

    """Подруга посоветовала — и теперь это наш ритуал перед сном ✨

@volshebnaya_skazka_bot создаёт персональные сказки для детей. Вводишь имя ребёнка и то, что его беспокоит — бот пишет историю где герой преодолевает именно эту проблему.

Особенно круто для детей которые боятся темноты, врача или не хотят делиться — через сказку всё воспринимается иначе.""",
]


async def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    log = logging.getLogger("poster")

    client = TelegramClient("marketing_session", API_ID, API_HASH)
    await client.start(phone=PHONE)
    log.info("Авторизован успешно")

    results = {"ok": [], "skip": [], "error": []}

    for group in TARGET_GROUPS:
        post = random.choice(POSTS)

        try:
            entity = await client.get_entity(group)
            await client.send_message(entity, post)
            log.info(f"✅ Отправлено в @{group}")
            results["ok"].append(group)

        except errors.ChatWriteForbiddenError:
            log.warning(f"⛔ @{group} — нельзя писать (закрытая группа)")
            results["skip"].append(group)

        except errors.FloodWaitError as e:
            log.warning(f"⏳ Flood wait {e.seconds}s — пауза")
            await asyncio.sleep(e.seconds + 5)
            results["error"].append(group)

        except errors.UserBannedInChannelError:
            log.warning(f"🚫 @{group} — аккаунт забанен в этой группе")
            results["skip"].append(group)

        except Exception as e:
            log.error(f"❌ @{group} — {e}")
            results["error"].append(group)

        # Пауза между постами: 8–18 минут (выглядит как живой человек)
        if group != TARGET_GROUPS[-1]:
            delay = random.randint(480, 1080)
            log.info(f"⏰ Следующий пост через {delay // 60} мин {delay % 60} сек")
            await asyncio.sleep(delay)

    await client.disconnect()

    log.info("─── ИТОГ ───────────────────────────────")
    log.info(f"✅ Отправлено: {len(results['ok'])} — {results['ok']}")
    log.info(f"⛔ Пропущено:  {len(results['skip'])} — {results['skip']}")
    log.info(f"❌ Ошибки:     {len(results['error'])} — {results['error']}")


if __name__ == "__main__":
    asyncio.run(main())
