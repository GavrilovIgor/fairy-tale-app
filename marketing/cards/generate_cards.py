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
    """Slide 1 — Hospital hook cover."""
    img, draw = make_card()
    W, H = SIZE

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "ПОСТ-БОЛЬНИЧКА", 76, f_label, DIM, letter_spacing=6)
    thin_line(draw, 118)

    # Big punchline
    f_big = font(FONT_IMPACT, 132)
    draw_text_centered(draw, "ЛЁГ В", 160, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "БОЛЬНИЦУ.", 296, f_big, YELLOW, letter_spacing=-2)

    f_mid = font(FONT_DIN, 52)
    draw_text_centered(draw, "ВСТАЛ С AI-ПРИЛОЖЕНИЕМ", 468, f_mid, WHITE)
    draw_text_centered(draw, "ДЛЯ ДОЧКИ.", 528, f_mid, WHITE)

    thin_line(draw, 600)

    f_body = font(FONT_ARIAL, 30)
    y = 630
    draw_text_centered(draw, "Нет, это не бред после наркоза.", y, f_body, DIM)
    y += 46
    draw_text_centered(draw, "(хотя было кайфово 😂)", y, f_body, (80, 80, 80))

    y += 72
    f_hint = font(FONT_ARIAL_B, 24)
    draw_text_centered(draw, "листай →", y, f_hint, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "1 / 7", H - 64, f_counter, DIM)

    return save(img, "card_01_cover.png")


def card_02_problem():
    """Slide 2 — Taya, fear, every evening."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "01", font=f_num, fill=(28, 28, 28))

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "ИСТОРИЯ", 92, f_label, DIM, letter_spacing=8)

    f_big = font(FONT_IMPACT, 128)
    draw_text_centered(draw, "ТАЕ 5 ЛЕТ.", 198, f_big, YELLOW, letter_spacing=-2)

    thin_line(draw, 356)

    f_body = font(FONT_ARIAL, 33)
    y = 392
    draw_text_centered(draw, "Боялась знакомиться с детьми.", y, f_body, WHITE)
    y += 54
    f_quote = font(FONT_DIN, 50)
    draw_text_centered(draw, "«Мама, не уходи!»", y, f_quote, YELLOW)
    y += 64
    draw_text_centered(draw, "каждый вечер. 🫠", y, f_body, WHITE)

    y += 72
    f_ask = font(FONT_ARIAL, 30)
    draw_text_centered(draw, "Знакомо?", y, f_ask, DIM)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "2 / 7", H - 64, f_counter, DIM)

    return save(img, "card_02_problem.png")


def card_03_discovery():
    """Slide 3 — The insight: a story about HER fear."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "02", font=f_num, fill=(28, 28, 28))

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "ИДЕЯ", 92, f_label, DIM, letter_spacing=8)

    f_body = font(FONT_ARIAL, 32)
    y = 172
    draw_text_centered(draw, "Читаю Тае книгу. Она успокаивается.", y, f_body, WHITE)
    y += 50
    draw_text_centered(draw, "И тут думаю...", y, f_body, DIM)

    y += 56
    thin_line(draw, y)
    y += 32

    f_big = font(FONT_IMPACT, 86)
    draw_text_centered(draw, "А ЕСЛИ БЫ СКАЗКА", y, f_big, YELLOW, letter_spacing=-2)
    y += 102
    draw_text_centered(draw, "БЫЛА ПРО ЕЁ СТРАХ?", y, f_big, WHITE, letter_spacing=-2)

    y += 86
    thin_line(draw, y, color=WHITE)
    y += 32

    f_sub = font(FONT_ARIAL, 30)
    draw_text_centered(draw, "Прямо её. С её именем.", y, f_sub, DIM)
    y += 52
    f_example = font(FONT_DIN, 40)
    draw_text_centered(draw, "Не Колобок.", y, f_example, WHITE)
    y += 54
    draw_text_centered(draw, "А «Тая и первый день в садике».", y, f_example, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "3 / 7", H - 64, f_counter, DIM)

    return save(img, "card_03_discovery.png")


def card_04_hospital():
    """Slide 4 — Hospital + vibe coding."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "03", font=f_num, fill=(28, 28, 28))

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "КАК ЭТО СЛУЧИЛОСЬ", 92, f_label, DIM, letter_spacing=6)

    f_big = font(FONT_IMPACT, 104)
    draw_text_centered(draw, "4 ДНЯ.", 190, f_big, YELLOW, letter_spacing=-2)
    draw_text_centered(draw, "БОЛЬНИЦА.", 298, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "НОУТБУК.", 406, f_big, WHITE, letter_spacing=-2)

    thin_line(draw, 532)

    f_body = font(FONT_ARIAL, 30)
    y = 566
    draw_text_centered(draw, "Продакт без задач — это опасно.", y, f_body, DIM)
    y += 50
    draw_text_centered(draw, "Давно смотрел рилсы про Claude Code —", y, f_body, WHITE)
    y += 46
    draw_text_centered(draw, "вот наконец нашлось время.", y, f_body, WHITE)

    y += 64
    f_accent = font(FONT_DIN, 44)
    draw_text_centered(draw, "MVP -> фича -> дизайн -> нейронка.", y, f_accent, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "4 / 7", H - 64, f_counter, DIM)

    return save(img, "card_04_hospital.png")


def card_05_how():
    """Slide 5 — How it works."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "04", font=f_num, fill=(28, 28, 28))

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "КАК РАБОТАЕТ", 92, f_label, DIM, letter_spacing=6)

    f_big = font(FONT_IMPACT, 104)
    draw_text_centered(draw, "ПЕРСОНАЛЬНО", 186, f_big, YELLOW, letter_spacing=-2)
    draw_text_centered(draw, "ДЛЯ ТВОЕГО", 294, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "РЕБЁНКА.", 402, f_big, WHITE, letter_spacing=-2)

    thin_line(draw, 530)

    f_din = font(FONT_DIN, 44)
    f_body = font(FONT_ARIAL, 29)
    y = 566
    draw_text_centered(draw, "С его именем. Его страхом. Его героем.", y, f_din, YELLOW)
    y += 58
    draw_text_centered(draw, "По методу сказкотерапии", y, f_body, WHITE)
    y += 44
    draw_text_centered(draw, "(детских психологов, на минуточку)", y, f_body, DIM)
    y += 60
    draw_text_centered(draw, "За 30 секунд.", y, f_din, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "5 / 7", H - 64, f_counter, DIM)

    return save(img, "card_05_how.png")


def card_06_result():
    """Slide 6 — Result: Taya says 'I'm already big'."""
    img, draw = make_card()
    W, H = SIZE

    f_num = font(FONT_IMPACT, 200)
    draw.text((54, 48), "05", font=f_num, fill=(28, 28, 28))

    f_label = font(FONT_ARIAL_B, 21)
    draw_text_centered(draw, "РЕЗУЛЬТАТ", 92, f_label, DIM, letter_spacing=8)

    f_body = font(FONT_ARIAL, 31)
    y = 180
    draw_text_centered(draw, "Тая теперь сама подходит", y, f_body, WHITE)
    y += 46
    draw_text_centered(draw, "знакомиться с детьми.", y, f_body, WHITE)

    y += 60
    f_mini = font(FONT_ARIAL, 27)
    draw_text_centered(draw, "А ещё у неё была привычка ковырять в носу.", y, f_mini, DIM)
    y += 42
    draw_text_centered(draw, "Теперь когда хочется — говорит себе:", y, f_mini, DIM)

    y += 52
    thin_line(draw, y)
    y += 34

    f_quote = font(FONT_IMPACT, 108)
    draw_text_centered(draw, "«Я УЖЕ", y, f_quote, YELLOW, letter_spacing=-2)
    y += 122
    draw_text_centered(draw, "БОЛЬШАЯ.»", y, f_quote, YELLOW, letter_spacing=-2)

    y += 110
    f_note = font(FONT_ARIAL, 26)
    draw_text_centered(draw, "Якорь из сказкотерапии. Работает.", y, f_note, (90, 90, 90))

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "6 / 7", H - 64, f_counter, DIM)

    return save(img, "card_06_result.png")


def card_07_cta():
    """Slide 7 — CTA with early adopter offer."""
    img, draw = make_card()
    W, H = SIZE

    f_big = font(FONT_IMPACT, 118)
    draw_text_centered(draw, "3 СКАЗКИ —", 100, f_big, WHITE, letter_spacing=-2)
    draw_text_centered(draw, "БЕСПЛАТНО.", 218, f_big, YELLOW, letter_spacing=-2)

    thin_line(draw, 366)

    f_body = font(FONT_ARIAL, 29)
    y = 402
    draw_text_centered(draw, "Дальше подписки и вот это всё.", y, f_body, DIM)
    y += 50

    draw_text_centered(draw, "НО — если штука зашла, пиши.", y, f_body, WHITE)
    y += 48
    f_offer = font(FONT_DIN, 40)
    draw_text_centered(draw, "Сделаем тебя ерли адоптером,", y, f_offer, WHITE)
    y += 52
    draw_text_centered(draw, "месяцок-другой накину бесплатно", y, f_offer, YELLOW)

    y += 60
    f_ps = font(FONT_ARIAL, 26)
    draw_text_centered(draw, "Любой отзыв = золото", y, f_ps, DIM)
    y += 42
    draw_text_centered(draw, "P.S. Скоро: озвучка голосом мамы", y, f_ps, DIM)
    y += 36
    draw_text_centered(draw, "(чтобы папа мог уйти смотреть сериал)", y, f_ps, (70, 70, 70))

    y += 60
    f_url = font(FONT_DIN, 44)
    draw_text_centered(draw, "skazka-ai.vercel.app", y, f_url, YELLOW)

    f_counter = font(FONT_ARIAL_B, 20)
    draw_text_centered(draw, "7 / 7", H - 64, f_counter, DIM)

    return save(img, "card_07_cta.png")


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating cards...")
    card_01_cover()
    card_02_problem()
    card_03_discovery()
    card_04_hospital()
    card_05_how()
    card_06_result()
    card_07_cta()
    print(f"\nAll cards saved to: {OUT_DIR}")
