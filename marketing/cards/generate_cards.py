#!/usr/bin/env python3
"""Generate Instagram carousel + Telegram Story cards for fairy tale app."""

from PIL import Image, ImageDraw, ImageFont
import os
import textwrap

# ── Constants ─────────────────────────────────────────────────────────────────
SIZE = (1080, 1080)
BG     = (13, 13, 13)
YELLOW = (255, 225, 0)
WHITE  = (255, 255, 255)
DIM    = (120, 120, 120)

FONT_IMPACT  = "/System/Library/Fonts/Supplemental/Impact.ttf"
FONT_DIN     = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_ARIAL   = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def font(path, size):
    return ImageFont.truetype(path, size)

def make_card():
    img = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(img)
    return img, draw

def save(img, name):
    path = os.path.join(OUT_DIR, name)
    img.save(path, quality=95)
    print(f"  ✓ {name}")
    return path

def draw_text_centered(draw, text, y, font_obj, color, width=SIZE[0], letter_spacing=0):
    """Draw text horizontally centered with optional letter spacing."""
    if letter_spacing == 0:
        bbox = draw.textbbox((0, 0), text, font=font_obj)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        draw.text((x, y), text, font=font_obj, fill=color)
    else:
        # manual letter spacing
        chars = list(text)
        total_w = sum(draw.textbbox((0,0), c, font=font_obj)[2] for c in chars) + letter_spacing * (len(chars)-1)
        x = (width - total_w) // 2
        for c in chars:
            draw.text((x, y), c, font=font_obj, fill=color)
            cw = draw.textbbox((0,0), c, font=font_obj)[2]
            x += cw + letter_spacing

def draw_text_left(draw, text, x, y, font_obj, color):
    draw.text((x, y), text, font=font_obj, fill=color)

def wrap_centered(draw, text, y, font_obj, color, max_width=900, line_gap=14):
    """Wrap text and draw centered, return bottom y."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = (current + " " + word).strip()
        bbox = draw.textbbox((0,0), test, font=font_obj)
        if bbox[2] - bbox[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    for line in lines:
        bbox = draw.textbbox((0,0), line, font=font_obj)
        th = bbox[3] - bbox[1]
        tw = bbox[2] - bbox[0]
        x = (SIZE[0] - tw) // 2
        draw.text((x, y), line, font=font_obj, fill=color)
        y += th + line_gap
    return y

def thin_line(draw, y, color=YELLOW, width=SIZE[0], margin=90, thickness=2):
    draw.rectangle([(margin, y), (width - margin, y + thickness)], fill=color)

def accent_dot(draw, x, y, r=6, color=YELLOW):
    draw.ellipse([(x-r, y-r), (x+r, y+r)], fill=color)

# ── Slide data ─────────────────────────────────────────────────────────────────
#
# 7 slides: cover + 5 story beats + CTA
#

def card_01_cover():
    """Slide 1 — Personal comeback after sick week."""
    img, draw = make_card()
    W, H = SIZE

    # Top label
    f_label = font(FONT_ARIAL_B, 22)
    label = "ПОСТ-БОЛЬНИЧКА"
    draw_text_centered(draw, label, 88, f_label, DIM, letter_spacing=6)

    # Thin accent line
    thin_line(draw, 132)

    # Big yellow headline
    f_big = font(FONT_IMPACT, 148)
    draw_text_centered(draw, "НАКОНЕЦ-", 200, f_big, YELLOW, letter_spacing=-3)
    draw_text_centered(draw, "ТО.", 348, f_big, YELLOW, letter_spacing=-3)

    # Divider dot row
    for i in range(5):
        accent_dot(draw, W//2 - 40 + i*20, 520)

    # Sub text
    f_sub = font(FONT_DIN, 46)
    draw_text_centered(draw, "НЕДЕЛЮ БОЛЕЛ.", 556, f_sub, WHITE)
    draw_text_centered(draw, "ТЕПЕРЬ РАССКАЗЫВАЮ.", 614, f_sub, WHITE)

    # Body text
    f_body = font(FONT_ARIAL, 28)
    wrap_centered(draw, "Проект, который начинал делать для дочки — пора показать всем.", 710, f_body, DIM, max_width=820)

    # Slide counter
    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "1 / 7", H - 64, f_counter, DIM)

    return save(img, "card_01_cover.png")


def card_02_problem():
    """Slide 2 — The problem: Taya's fear."""
    img, draw = make_card()
    W, H = SIZE

    # Top number accent
    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "01", font=f_num, fill=(30, 30, 30))

    # Label
    f_label = font(FONT_ARIAL_B, 22)
    draw_text_centered(draw, "ПРОБЛЕМА", 90, f_label, DIM, letter_spacing=8)

    # Headline
    f_big = font(FONT_IMPACT, 124)
    draw_text_centered(draw, "МОЯ ДОЧЬ", 210, f_big, YELLOW, letter_spacing=-2)

    # Sub
    f_sub = font(FONT_DIN, 56)
    draw_text_centered(draw, "БОЯЛАСЬ ОСТАТЬСЯ ОДНА", 356, f_sub, WHITE)

    thin_line(draw, 436)

    # Story
    f_body = font(FONT_ARIAL, 32)
    y = wrap_centered(draw, "Каждый вечер — слёзы и крики,", 468, f_body, WHITE, max_width=860)
    y = wrap_centered(draw, "когда жена выходила из комнаты.", y + 4, f_body, WHITE, max_width=860)

    y += 28
    f_body2 = font(FONT_ARIAL, 28)
    wrap_centered(draw, "Стандартные объяснения не работали. Нужно было что-то другое.", y, f_body2, DIM, max_width=820)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "2 / 7", H - 64, f_counter, DIM)

    return save(img, "card_02_problem.png")


def card_03_discovery():
    """Slide 3 — Skazka therapy discovery."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "02", font=f_num, fill=(30, 30, 30))

    f_label = font(FONT_ARIAL_B, 22)
    draw_text_centered(draw, "ОТКРЫТИЕ", 90, f_label, DIM, letter_spacing=8)

    f_big = font(FONT_IMPACT, 108)
    draw_text_centered(draw, "СКАЗКО-", 200, f_big, YELLOW, letter_spacing=-2)
    draw_text_centered(draw, "ТЕРАПИЯ", 318, f_big, YELLOW, letter_spacing=-2)

    thin_line(draw, 452)

    f_body = font(FONT_ARIAL, 30)
    y = 490
    y = wrap_centered(draw, "Детская психология давно знает:", y, f_body, WHITE, max_width=880, line_gap=10)
    y += 16
    y = wrap_centered(draw,
        "ребёнок воспринимает метафору лучше прямого разговора. "
        "Герой с его страхом — и ребёнок проживает это безопасно.",
        y, f_body, DIM, max_width=860, line_gap=12)

    y += 32
    f_accent = font(FONT_DIN, 44)
    draw_text_centered(draw, "МНЕ НУЖНА БЫЛА ПРАВИЛЬНАЯ СКАЗКА.", y, f_accent, WHITE)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "3 / 7", H - 64, f_counter, DIM)

    return save(img, "card_03_discovery.png")


def card_04_solution():
    """Slide 4 — AI solution."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "03", font=f_num, fill=(30, 30, 30))

    f_label = font(FONT_ARIAL_B, 22)
    draw_text_centered(draw, "РЕШЕНИЕ", 90, f_label, DIM, letter_spacing=8)

    f_big = font(FONT_IMPACT, 118)
    draw_text_centered(draw, "Я ПОПРОСИЛ", 200, f_big, YELLOW, letter_spacing=-2)
    draw_text_centered(draw, "AI", 326, f_big, YELLOW, letter_spacing=8)

    thin_line(draw, 468)

    f_body = font(FONT_ARIAL, 30)
    y = 506
    y = wrap_centered(draw,
        "Написать сказку про лисёнка Рыжика, который тоже боялся что мама уйдёт и не вернётся.",
        y, f_body, WHITE, max_width=880, line_gap=12)

    y += 24
    f_detail = font(FONT_ARIAL, 26)
    y = wrap_centered(draw, "Имя дочки, её страх, любимый герой — всё учтено.", y, f_detail, DIM, max_width=820)

    y += 28
    f_accent = font(FONT_DIN, 40)
    draw_text_centered(draw, "ПЕРСОНАЛЬНАЯ СКАЗКА С ИЛЛЮСТРАЦИЯМИ.", y, f_accent, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "4 / 7", H - 64, f_counter, DIM)

    return save(img, "card_04_solution.png")


def card_05_result():
    """Slide 5 — The result: Taya alone on day 4."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "04", font=f_num, fill=(30, 30, 30))

    f_label = font(FONT_ARIAL_B, 22)
    draw_text_centered(draw, "РЕЗУЛЬТАТ", 90, f_label, DIM, letter_spacing=8)

    f_big = font(FONT_IMPACT, 118)
    draw_text_centered(draw, "НА 4-Й ВЕЧЕР", 200, f_big, YELLOW, letter_spacing=-2)

    thin_line(draw, 342)

    f_quote = font(FONT_DIN, 52)
    y = 376
    draw_text_centered(draw, "ТАЯ ПОШЛА В ДРУГУЮ КОМНАТУ.", y, f_quote, WHITE)
    y += 66
    draw_text_centered(draw, "ОДНА. МОЛЧА.", y, f_quote, YELLOW)

    y += 80
    f_body = font(FONT_ARIAL, 29)
    y = wrap_centered(draw,
        "Без слёз, без криков. Просто пошла переодеваться и вернулась. "
        "Теперь говорит что не боится.",
        y, f_body, DIM, max_width=860, line_gap=12)

    y += 24
    f_note = font(FONT_ARIAL, 24)
    wrap_centered(draw, "Работает ли это системно — не знаю. Но хватило чтобы выпустить для всех.", y, f_note, (80, 80, 80), max_width=820)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "5 / 7", H - 64, f_counter, DIM)

    return save(img, "card_05_result.png")


def card_06_product():
    """Slide 6 — Product reveal."""
    img, draw = make_card()
    W, H = SIZE

    f_big = font(FONT_IMPACT, 108)
    draw_text_centered(draw, "Я СДЕЛАЛ", 140, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "ЭТО ДЛЯ", 258, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "ВСЕХ", 376, f_big, YELLOW, letter_spacing=4)

    thin_line(draw, 510)

    f_sub = font(FONT_DIN, 40)
    y = 546
    draw_text_centered(draw, "AI-ГЕНЕРАТОР ДЕТСКИХ СКАЗОК", y, f_sub, WHITE)
    y += 56

    f_body = font(FONT_ARIAL, 28)
    features = [
        "→  Имя и возраст ребёнка",
        "→  Его страх и любимый герой",
        "→  Урок, который хочешь передать",
        "→  Акварельные иллюстрации в подарок",
    ]
    for feat in features:
        bbox = draw.textbbox((0,0), feat, font=f_body)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        draw.text((x, y), feat, font=f_body, fill=DIM)
        y += 44

    y += 8
    f_url = font(FONT_DIN, 46)
    draw_text_centered(draw, "skazka-ai.vercel.app", y, f_url, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "6 / 7", H - 64, f_counter, DIM)

    return save(img, "card_06_product.png")


def card_07_cta():
    """Slide 7 — CTA."""
    img, draw = make_card()
    W, H = SIZE

    # Big CTA
    f_big = font(FONT_IMPACT, 170)
    draw_text_centered(draw, "ПОПРО-", 120, f_big, YELLOW, letter_spacing=-3)
    draw_text_centered(draw, "БУЙ.", 296, f_big, YELLOW, letter_spacing=-3)

    thin_line(draw, 490)

    f_sub = font(FONT_DIN, 48)
    draw_text_centered(draw, "3 СКАЗКИ БЕСПЛАТНО", 526, f_sub, WHITE)

    f_body = font(FONT_ARIAL, 27)
    y = wrap_centered(draw,
        "Введи имя ребёнка, его страх и любимого героя — получишь персональную сказку с иллюстрациями за 1 минуту.",
        594, f_body, DIM, max_width=860, line_gap=12)

    y += 28
    f_bot = font(FONT_DIN, 52)
    draw_text_centered(draw, "@volshebnaya_skazka_bot", y, f_bot, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "7 / 7", H - 64, f_counter, DIM)

    return save(img, "card_07_cta.png")


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating cards...")
    card_01_cover()
    card_02_problem()
    card_03_discovery()
    card_04_solution()
    card_05_result()
    card_06_product()
    card_07_cta()
    print(f"\nAll cards saved to: {OUT_DIR}")
