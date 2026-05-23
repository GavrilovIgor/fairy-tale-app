#!/usr/bin/env python3
"""
Cards v2 — Instagram carousel (7 cards)
Fixes: no emoji (except card_06 wink), letter-spaced labels, 7 cards total,
       unified body font, max 2 hlines per card, updated copy.
"""

from PIL import Image, ImageDraw, ImageFont
from pilmoji import Pilmoji
import os

# ── Constants ─────────────────────────────────────────────────────────────────
SIZE   = (1080, 1080)
BG     = (13, 13, 13)
YELLOW = (255, 225, 0)
WHITE  = (255, 255, 255)
GREY   = (140, 140, 140)
DIM    = (75, 75, 75)

FONT_HEAD  = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_MED   = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
FONT_BODY  = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD  = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
MARGIN  = 88

def f(path, size):
    return ImageFont.truetype(path, size)

def save(img, name):
    path = os.path.join(OUT_DIR, name)
    img.save(path, quality=95)
    print(f"  ✓ {name}")
    return path

# ── Drawing helpers ────────────────────────────────────────────────────────────

def new_card():
    img = Image.new("RGB", SIZE, BG)
    draw = ImageDraw.Draw(img)
    return img, draw

def text_w(draw, text, font_obj):
    bb = draw.textbbox((0, 0), text, font=font_obj)
    return bb[2] - bb[0]

def text_h(draw, text, font_obj):
    bb = draw.textbbox((0, 0), text, font=font_obj)
    return bb[3] - bb[1]

def draw_centered(draw, text, y, font_obj, color):
    x = (SIZE[0] - text_w(draw, text, font_obj)) // 2
    draw.text((x, y), text, font=font_obj, fill=color)

def draw_centered_emoji(img, draw, text, y, font_obj, color):
    """Draw text with emoji using pilmoji, centered."""
    tw = text_w(draw, text, font_obj)
    x = (SIZE[0] - tw) // 2
    with Pilmoji(img) as pj:
        pj.text((x, y), text, fill=color, font=font_obj)

def hline(draw, y, color=YELLOW, thickness=2):
    draw.rectangle([(MARGIN, y), (SIZE[0] - MARGIN, y + thickness)], fill=color)

def label_left(draw, text, y=76, color=GREY):
    """Small label, left-aligned with letter spacing (like v1)."""
    fo = f(FONT_BOLD, 19)
    letter_spacing = 6
    x = MARGIN
    for c in text:
        draw.text((x, y), c, font=fo, fill=color)
        bb = draw.textbbox((0, 0), c, font=fo)
        x += (bb[2] - bb[0]) + letter_spacing

def counter(draw, n, total=7):
    fo = f(FONT_BOLD, 20)
    txt = f"{n} / {total}"
    x = (SIZE[0] - text_w(draw, txt, fo)) // 2
    draw.text((x, SIZE[1] - 64), txt, font=fo, fill=DIM)

def draw_block(img, draw, lines_data, y_start, line_gap=14, use_emoji=False):
    """lines_data: list of (text, font_obj, color). Returns y after last line."""
    y = y_start
    for text, font_obj, color in lines_data:
        th = text_h(draw, text, font_obj)
        if use_emoji:
            draw_centered_emoji(img, draw, text, y, font_obj, color)
        else:
            draw_centered(draw, text, y, font_obj, color)
        y += th + line_gap
    return y

# ── Font shortcuts ─────────────────────────────────────────────────────────────
def big(size=112): return f(FONT_HEAD, size)
def med(size=50):  return f(FONT_MED, size)
def body(size=30): return f(FONT_BODY, size)
def bold(size=30): return f(FONT_BOLD, size)

# ── Cards ──────────────────────────────────────────────────────────────────────

def card_01():
    """Cover: главный хук"""
    img, draw = new_card()

    label_left(draw, "КАК ЭТО НАЧАЛОСЬ")
    hline(draw, 110)

    draw_centered(draw, "НАВАЙБКОДИЛ", 152, big(108), YELLOW)
    draw_centered(draw, "ДОЧКЕ",       268, big(108), WHITE)
    draw_centered(draw, "ТЕРАПИЮ",     384, big(108), WHITE)

    hline(draw, 514)

    lines = [
        ("Продакт + Claude Code + 4 дня.",   body(30), WHITE),
        ("",                                  body(20), GREY),
        ("Дочка теперь не боится.",           med(44),  YELLOW),
    ]
    draw_block(img, draw, lines, 548, line_gap=18)

    draw_centered(draw, "листай →", 870, bold(24), YELLOW)

    counter(draw, 1)
    save(img, "card_01_cover.png")


def card_02():
    """ТАЕ 5 ЛЕТ"""
    img, draw = new_card()

    label_left(draw, "ИСТОРИЯ")
    hline(draw, 110)

    draw_centered(draw, "ТАЕ 5 ЛЕТ", 172, big(140), YELLOW)

    hline(draw, 360)

    lines = [
        ("Боялась знакомиться с детьми",   med(48),  WHITE),
        ("и не отпускала маму ни на шаг",  med(44),  WHITE),
        ("",                               body(16), GREY),
        ("«Мама, не уходи!»",              med(58),  YELLOW),
        ("каждый вечер.",                  body(32), GREY),
        ("",                               body(28), GREY),
        ("Знакомо? →",                     bold(28), DIM),
    ]
    draw_block(img, draw, lines, 400, line_gap=16)

    counter(draw, 2)
    save(img, "card_02_taya.png")


def card_03():
    """Идея: а если бы сказка про её страх"""
    img, draw = new_card()

    label_left(draw, "ИДЕЯ")
    hline(draw, 110)

    fo_b = body(31)
    draw_centered(draw, "Читаю Тае книгу.",  142, fo_b, WHITE)
    draw_centered(draw, "И тут думаю...",    186, fo_b, GREY)

    draw_centered(draw, "А ЕСЛИ БЫ СКАЗКА",    244, big(94), YELLOW)
    draw_centered(draw, "БЫЛА ПРО ЕЁ СТРАХ",   344, big(94), WHITE)

    hline(draw, 464)

    lines = [
        ("Прямо для неё. С её именем.",              med(42), YELLOW),
        ("",                                          body(14), GREY),
        ("Типа: «Тая знакомится с новым другом»",    med(38), WHITE),
    ]
    draw_block(img, draw, lines, 496, line_gap=16)

    counter(draw, 3)
    save(img, "card_03_idea.png")


def card_04():
    """4 дня, больница, ноутбук"""
    img, draw = new_card()

    label_left(draw, "КАК ЭТО СЛУЧИЛОСЬ")
    hline(draw, 110)

    fo_b = body(31)
    draw_centered(draw, "Давно смотрел рилсы про Claude Code.", 148, fo_b, WHITE)
    draw_centered(draw, "Наконец нашлось время: 4 дня. Больница.", 192, fo_b, GREY)

    draw_centered(draw, "4 ДНЯ",     252, big(108), YELLOW)
    draw_centered(draw, "БОЛЬНИЦА",  368, big(108), WHITE)
    draw_centered(draw, "НОУТБУК",   484, big(108), WHITE)

    hline(draw, 606)

    lines = [
        ("Продакт без задач — не умеет.",          body(30), WHITE),
        ("",                                        body(16), GREY),
        ("MVP → фича раз → фича два →",            med(42),  YELLOW),
        ("дизайн → монетизация",                   med(42),  YELLOW),
    ]
    draw_block(img, draw, lines, 634, line_gap=12)

    counter(draw, 4)
    save(img, "card_04_vibecode.png")


def card_05():
    """Персонально для твоего ребёнка"""
    img, draw = new_card()

    label_left(draw, "КАК РАБОТАЕТ")
    hline(draw, 110)

    draw_centered(draw, "СКАЗКА",              152, big(108), GREY)
    draw_centered(draw, "ПЕРСОНАЛЬНО",         268, big(108), YELLOW)
    draw_centered(draw, "ДЛЯ ТВОЕГО РЕБЁНКА", 384, big(76),  WHITE)

    hline(draw, 490)

    lines = [
        ("С его именем. Его страхом. Его героем.",          med(44),  YELLOW),
        ("По методу сказкотерапии",                         med(44),  WHITE),
        ("(Рекомендовано детскими психологами)",            body(28), GREY),
        ("",                                                body(20), GREY),
        ("За 30 секунд.",                                   med(44),  YELLOW),
    ]
    draw_block(img, draw, lines, 520, line_gap=16)

    counter(draw, 5)
    save(img, "card_05_how.png")


def card_06():
    """Результат: МНЕ НЕ СТРАШНО"""
    img, draw = new_card()

    label_left(draw, "РЕЗУЛЬТАТ")
    hline(draw, 110)

    top_lines = [
        ("Тая теперь сама подходит",        body(32), WHITE),
        ("знакомиться с детьми",            body(32), WHITE),
        ("",                                body(14), GREY),
        ("Теперь говорит себе:",            body(30), WHITE),
        ("(кстати, без мамы \U0001f609)",   body(27), GREY),
    ]
    draw_block(img, draw, top_lines, 140, line_gap=10, use_emoji=True)

    hline(draw, 380)

    draw_centered(draw, "«МНЕ НЕ",   412, big(118), YELLOW)
    draw_centered(draw, "СТРАШНО»",  536, big(118), YELLOW)

    lines = [
        ("",                             body(20), GREY),
        ("ОДНА. САМА.",                  med(54),  WHITE),
        ("Сказкотерапия работает.",      body(30), GREY),
    ]
    draw_block(img, draw, lines, 680, line_gap=16)

    counter(draw, 6)
    save(img, "card_06_result.png")


def card_07():
    """Fox card — финальная с сайтом и ботом"""
    fox_path = os.path.join(OUT_DIR, "fox_source.png")

    fox = Image.open(fox_path).convert("RGB")
    fw, fh = fox.size

    crop_h = int(fh * 0.60)
    fox_cropped = fox.crop((0, 0, fw, crop_h))

    scale = SIZE[0] / fw
    new_h = int(crop_h * scale)
    fox_scaled = fox_cropped.resize((SIZE[0], new_h), Image.LANCZOS)

    img = Image.new("RGB", SIZE, (10, 12, 10))
    img.paste(fox_scaled, (0, 0))

    fade_start = new_h - 100
    overlay = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    fade_zone = SIZE[1] - fade_start
    for i in range(fade_zone):
        alpha = min(255, int(255 * (i / 160)))
        ov_draw.line([(0, fade_start + i), (SIZE[0], fade_start + i)],
                     fill=(10, 12, 10, alpha))

    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    text_y = max(new_h - 60, 550)

    hline(draw, text_y, color=YELLOW)
    text_y += 28

    draw_centered(draw, "ВОЛШЕБНАЯ СКАЗКА", text_y, med(64), WHITE)
    text_y += 80

    draw_centered(draw, "Персональные сказки для детей", text_y, body(30), GREY)
    text_y += 42
    draw_centered(draw, "с иллюстрациями — за 30 секунд", text_y, body(30), GREY)
    text_y += 58

    hline(draw, text_y, color=(40, 40, 40))
    text_y += 28

    fo_url = f(FONT_HEAD, 64)
    draw_centered(draw, "MagicFairyTale.ru", text_y, fo_url, YELLOW)
    text_y += 74

    fo_bot = f(FONT_BOLD, 32)
    draw_centered(draw, "@volshebnaya_skazka_bot", text_y, fo_bot, WHITE)

    counter(draw, 7)
    save(img, "card_07_fox.png")


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating cards v2...")
    card_01()
    card_02()
    card_03()
    card_04()
    card_05()
    card_06()
    card_07()
    print(f"\n✓ All 7 cards → {OUT_DIR}")
