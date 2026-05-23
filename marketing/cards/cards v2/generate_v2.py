#!/usr/bin/env python3
"""
Cards v2 — Instagram carousel + Telegram Stories
Fixes: no ghost numbers, DIN instead of Impact, labels left-aligned,
       no periods in headlines, alternating colors after divider,
       pilmoji for emoji, split CTA into 2 cards, fox card.
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
MARGIN  = 88   # left/right margin

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

def center_x(draw, text, font_obj):
    return (SIZE[0] - text_w(draw, text, font_obj)) // 2

def draw_centered(draw, text, y, font_obj, color):
    x = center_x(draw, text, font_obj)
    draw.text((x, y), text, font=font_obj, fill=color)

def draw_left(draw, text, y, font_obj, color, x=MARGIN):
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
    """Small spaced label, left-aligned."""
    fo = f(FONT_BOLD, 19)
    draw.text((MARGIN, y), text, font=fo, fill=color)

def counter(draw, n, total=8):
    fo = f(FONT_BOLD, 20)
    draw_centered(draw, f"{n} / {total}", SIZE[1] - 64, fo, DIM)

def wrap_text(draw, text, max_w, font_obj):
    """Word-wrap, return list of lines."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if text_w(draw, test, font_obj) <= max_w:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def draw_block(img, draw, lines_data, y_start, line_gap=14, use_emoji=False):
    """
    lines_data: list of (text, font_obj, color)
    Returns y after last line.
    Colors must not repeat adjacent.
    """
    y = y_start
    for text, font_obj, color in lines_data:
        th = text_h(draw, text, font_obj)
        if use_emoji:
            draw_centered_emoji(img, draw, text, y, font_obj, color)
        else:
            draw_centered(draw, text, y, font_obj, color)
        y += th + line_gap
    return y

# ── Headline helpers ───────────────────────────────────────────────────────────

def big(size=112): return f(FONT_HEAD, size)
def med(size=50):  return f(FONT_MED, size)
def body(size=30): return f(FONT_BODY, size)
def bold(size=30): return f(FONT_BOLD, size)

# ── Cards ──────────────────────────────────────────────────────────────────────

def card_01():
    """Cover: НАВАЙБКОДИЛ ДОЧКЕ ТЕРАПИЮ — главный хук, юмор и лёгкость"""
    img, draw = new_card()

    label_left(draw, "ПОСТ-БОЛЬНИЧКА")
    hline(draw, 110)

    # Главный хук
    draw_centered(draw, "НАВАЙБКОДИЛ", 152, big(108), YELLOW)
    draw_centered(draw, "ДОЧКЕ",       268, big(108), WHITE)
    draw_centered(draw, "ТЕРАПИЮ",     384, big(108), WHITE)

    hline(draw, 514)

    # Юмор и лёгкость — больничка вскользь
    lines = [
        ("Нет, это не бред после наркоза.",     body(30), WHITE),
        ("(Хотя был повод полежать и подумать 😂)", body(28), GREY),
        ("",                                    body(16), GREY),
        ("Продакт нашёл время на Claude Code.", body(30), WHITE),
        ("Дочка теперь не боится.",             body(30), YELLOW),
    ]
    draw_block(img, draw, lines, 546, line_gap=18, use_emoji=True)

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
        ("Боялась знакомиться с детьми.",  med(48),  WHITE),
        ("",                               body(16), GREY),
        ("«Мама, не уходи!»",              med(58),  YELLOW),
        ("каждый вечер. 🫠",               body(32), GREY),
        ("",                               body(28), GREY),
        ("",                               body(28), GREY),
        ("Знакомо? →",                     bold(28), DIM),
    ]
    draw_block(img, draw, lines, 400, line_gap=16, use_emoji=True)

    counter(draw, 2)
    save(img, "card_02_taya.png")

def card_03():
    """Идея: а если бы сказка про её страх"""
    img, draw = new_card()

    label_left(draw, "ИДЕЯ")
    hline(draw, 110)

    fo_b = body(31)
    draw_centered(draw, "Читаю Тае книгу. Она успокаивается.", 142, fo_b, WHITE)
    draw_centered(draw, "И тут думаю...",                       188, fo_b, GREY)

    hline(draw, 238)

    draw_centered(draw, "А ЕСЛИ БЫ СКАЗКА",    258, big(94), YELLOW)
    draw_centered(draw, "БЫЛА ПРО ЕЁ СТРАХ",   358, big(94), WHITE)

    hline(draw, 476)

    lines = [
        ("Прямо её. С её именем.",                       med(42), YELLOW),
        ("Не Колобок.",                                  med(42), WHITE),
        ("А «Тая и первый день в садике». ✨",           med(40), GREY),
    ]
    draw_block(img, draw, lines, 508, line_gap=20, use_emoji=True)

    counter(draw, 3)
    save(img, "card_03_idea.png")

def card_04():
    """Claude Code + свободное время = опасная смесь"""
    img, draw = new_card()

    label_left(draw, "КАК ЭТО СЛУЧИЛОСЬ")
    hline(draw, 110)

    # Акцент — не больница, а Claude Code и время
    draw_centered(draw, "CLAUDE CODE",  152, big(108), YELLOW)
    draw_centered(draw, "+",            268, big(80),  WHITE)
    draw_centered(draw, "СВОБОДНОЕ",    348, big(108), WHITE)
    draw_centered(draw, "ВРЕМЯ",        462, big(108), WHITE)

    hline(draw, 584)

    lines = [
        ("Продакт без задач — опасная смесь 😅",      body(29), GREY),
        ("(особенно если лежишь в больнице)",          body(27), DIM),
        ("",                                           body(16), GREY),
        ("Давно хотел попробовать Claude Code —",      body(29), WHITE),
        ("вот наконец нашлось время.",                 body(29), WHITE),
        ("",                                           body(16), GREY),
        ("MVP → фича → дизайн → нейронка 🚀",         med(44),  YELLOW),
    ]
    draw_block(img, draw, lines, 612, line_gap=12, use_emoji=True)

    counter(draw, 4)
    save(img, "card_04_vibecode.png")

def card_05():
    """Персонально для твоего ребёнка"""
    img, draw = new_card()

    label_left(draw, "КАК РАБОТАЕТ")
    hline(draw, 110)

    draw_centered(draw, "ПЕРСОНАЛЬНО",  152, big(104), YELLOW)
    draw_centered(draw, "ДЛЯ ТВОЕГО",  262, big(104), WHITE)
    draw_centered(draw, "РЕБЁНКА",     372, big(104), WHITE)

    hline(draw, 500)

    lines = [
        ("С его именем. Его страхом. Его героем.",        med(44),  YELLOW),
        ("По методу сказкотерапии 🪄",                   med(44),  WHITE),
        ("(детских психологов, на минуточку)",            body(28), GREY),
        ("",                                              body(20), GREY),
        ("За 30 секунд.",                                 med(52),  YELLOW),
    ]
    draw_block(img, draw, lines, 530, line_gap=16, use_emoji=True)

    counter(draw, 5)
    save(img, "card_05_how.png")

def card_06():
    """Результат: Тая. Одна. Сама."""
    img, draw = new_card()

    label_left(draw, "РЕЗУЛЬТАТ")
    hline(draw, 110)

    # use draw_block with emoji=True for all top lines
    top_lines = [
        ("Тая теперь сама подходит",                    body(32), WHITE),
        ("знакомиться с детьми 🥳",                     body(32), WHITE),
        ("",                                             body(14), GREY),
        ("А ещё — была привычка ковырять в носу 😄",   body(27), GREY),
        ("Теперь когда хочется — говорит себе:",        body(27), GREY),
    ]
    draw_block(img, draw, top_lines, 140, line_gap=10, use_emoji=True)

    hline(draw, 346)

    draw_centered(draw, "«Я УЖЕ",    376, big(118), YELLOW)
    draw_centered(draw, "БОЛЬШАЯ»",  500, big(118), YELLOW)

    hline(draw, 644)

    lines = [
        ("ОДНА. САМА.",                       med(54),  WHITE),
        ("Якорь из сказкотерапии. Работает.", body(27), GREY),
    ]
    draw_block(img, draw, lines, 672, line_gap=20, use_emoji=True)

    counter(draw, 6)
    save(img, "card_06_result.png")

def card_07():
    """CTA: 3 сказки бесплатно + ерли адоптер"""
    img, draw = new_card()

    label_left(draw, "ПОПРОБУЙ")
    hline(draw, 110)

    draw_centered(draw, "3 СКАЗКИ —",  160, big(122), WHITE)
    draw_centered(draw, "БЕСПЛАТНО",   292, big(122), YELLOW)

    hline(draw, 448)

    lines = [
        ("Дальше подписки и вот это всё.",          body(30), GREY),
        ("",                                        body(10), GREY),
        ("НО — если штука зашла, пиши.",            body(30), WHITE),
        ("Месяцок-другой накину бесплатно 😄",      med(44),  YELLOW),
        ("",                                        body(10), GREY),
        ("Любой отзыв = золото ❤️",                 body(30), WHITE),
        ("",                                        body(10), GREY),
        ("P.S. Скоро: озвучка голосом мамы 🎙️",   body(28), GREY),
        ("(чтобы папа мог уйти смотреть сериал)",  body(26), DIM),
    ]
    draw_block(img, draw, lines, 476, line_gap=18, use_emoji=True)

    counter(draw, 7)
    save(img, "card_07_cta.png")

def card_08():
    """Final: Fox card — fox image top half, dark bottom with title + link"""
    fox_path = os.path.join(OUT_DIR, "fox_source.png")

    fox = Image.open(fox_path).convert("RGB")
    fw, fh = fox.size

    # Crop: take only the TOP 60% of the screenshot (the fox, not site text)
    crop_h = int(fh * 0.60)
    fox_cropped = fox.crop((0, 0, fw, crop_h))

    # Scale to fill 1080 wide
    scale = SIZE[0] / fw
    new_h = int(crop_h * scale)
    fox_scaled = fox_cropped.resize((SIZE[0], new_h), Image.LANCZOS)

    # Build canvas: fox on top, solid dark bottom
    img = Image.new("RGB", SIZE, (10, 12, 10))  # very dark green-black
    img.paste(fox_scaled, (0, 0))

    # Strong bottom fade starting at fox_scaled height - 80px
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

    # Bottom text block — starts well below fox
    text_y = max(new_h - 60, 560)

    # Yellow accent line
    hline(draw, text_y, color=YELLOW)
    text_y += 28

    draw_centered(draw, "ВОЛШЕБНАЯ СКАЗКА", text_y, med(64), WHITE)
    text_y += 82

    draw_centered(draw, "Персональные сказки для детей", text_y, body(30), GREY)
    text_y += 48
    draw_centered(draw, "с иллюстрациями — за 30 секунд", text_y, body(30), GREY)
    text_y += 62

    hline(draw, text_y, color=(40, 40, 40))
    text_y += 28

    fo_url = f(FONT_HEAD, 72)
    draw_centered(draw, "MagicFairyTale.ru", text_y, fo_url, YELLOW)

    counter(draw, 8)
    save(img, "card_08_fox.png")


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
    card_08()
    print(f"\n✓ All 8 cards → {OUT_DIR}")
