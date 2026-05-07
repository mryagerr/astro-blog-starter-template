#!/usr/bin/env python3
"""Render the 10 sub-8 hero images from docs/hero-image-specs.md.

Outputs 1200x630 PNGs into ../public/.
"""

from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

W, H = 1200, 630

BG = (10, 22, 40)
INK = (230, 237, 245)
ACCENT = (34, 211, 238)
GREEN = (34, 197, 94)
AMBER = (245, 158, 11)
RED = (244, 63, 94)
PURPLE = (167, 139, 250)
MUTED = (100, 116, 139)
GRAY = (148, 163, 184)

SANS_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANS_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
MONO_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
MONO_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def new_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img, "RGBA")


def text_w(draw: ImageDraw.ImageDraw, s: str, f: ImageFont.FreeTypeFont) -> int:
    return draw.textlength(s, font=f)


def centered(draw, s: str, y: int, f, fill):
    w = text_w(draw, s, f)
    draw.text(((W - w) // 2, y), s, font=f, fill=fill)


def panel(draw, x, y, w, h, color, fill_alpha=24, radius=12, stroke=2):
    fill = (*color, fill_alpha)
    draw.rounded_rectangle((x, y, x + w, y + h), radius=radius,
                           fill=fill, outline=color, width=stroke)


def panel_header(draw, x, y, w, label, color, f):
    tw = text_w(draw, label, f)
    draw.text((x + (w - tw) // 2, y), label, font=f, fill=color)


def title_block(draw, line1: str, line2: str, y1: int = 56):
    f1 = font(SANS_BOLD, 44)
    f2 = font(MONO_BOLD, 56)
    centered(draw, line1, y1, f1, INK)
    bb1 = draw.textbbox((0, 0), line1, font=f1)
    h1 = bb1[3] - bb1[1]
    centered(draw, line2, y1 + h1 + 12, f2, ACCENT)


def footer(draw, text: str, color=MUTED):
    f = font(MONO_REG, 16)
    centered(draw, text, H - 36, f, color)


def dashed_vline(draw, x, y0, y1, color=MUTED, dash=8, gap=6, width=1):
    y = y0
    while y < y1:
        draw.line((x, y, x, min(y + dash, y1)), fill=color, width=width)
        y += dash + gap


def dashed_hline(draw, x0, x1, y, color=MUTED, dash=8, gap=6, width=1):
    x = x0
    while x < x1:
        draw.line((x, y, min(x + dash, x1), y), fill=color, width=width)
        x += dash + gap


def vs_badge(draw, cx, cy, radius=18):
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius),
                 fill=BG, outline=MUTED, width=1)
    f = font(MONO_REG, 14)
    s = "vs"
    tw = text_w(draw, s, f)
    bb = draw.textbbox((0, 0), s, font=f)
    th = bb[3] - bb[1]
    draw.text((cx - tw // 2, cy - th // 2 - 2), s, font=f, fill=MUTED)


def arrow(draw, x0, y0, x1, y1, color=ACCENT, width=2, head=10):
    draw.line((x0, y0, x1, y1), fill=color, width=width)
    import math
    ang = math.atan2(y1 - y0, x1 - x0)
    for s in (0.5, -0.5):
        hx = x1 - head * math.cos(ang - s)
        hy = y1 - head * math.sin(ang - s)
        draw.line((x1, y1, hx, hy), fill=color, width=width)


def stick_figure(draw, cx, y_top, h=80, color=INK, width=2):
    head_r = h // 8
    draw.ellipse((cx - head_r, y_top, cx + head_r, y_top + 2 * head_r),
                 outline=color, width=width)
    body_top = y_top + 2 * head_r
    body_bot = body_top + h * 5 // 8
    draw.line((cx, body_top, cx, body_bot), fill=color, width=width)
    arm_y = body_top + h // 8
    draw.line((cx - h // 4, arm_y + h // 8, cx + h // 4, arm_y + h // 8),
              fill=color, width=width)
    draw.line((cx, body_bot, cx - h // 5, body_bot + h // 4),
              fill=color, width=width)
    draw.line((cx, body_bot, cx + h // 5, body_bot + h // 4),
              fill=color, width=width)


def speech_bubble(draw, x, y, text: str, color, f):
    pad_x, pad_y = 12, 8
    tw = text_w(draw, text, f)
    bb = draw.textbbox((0, 0), text, font=f)
    th = bb[3] - bb[1]
    draw.rounded_rectangle((x, y, x + tw + 2 * pad_x, y + th + 2 * pad_y),
                           radius=8, fill=(*color, 30), outline=color, width=1)
    draw.text((x + pad_x, y + pad_y - bb[1]), text, font=f, fill=color)
    return tw + 2 * pad_x, th + 2 * pad_y


# =============================================================================
# 1. blog-crawl-walk-run.png
# =============================================================================

def render_crawl_walk_run() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "Crawl. Walk. Run.", "Many Attempts Beat One Perfect Try")

    f_label = font(MONO_REG, 14)
    f_band = font(MONO_BOLD, 16)

    # Right-side "perfecting forever" (red) — placed first so it doesn't conflict
    rx, ry, rr = 1020, 360, 70
    d.ellipse((rx - rr, ry - rr, rx + rr, ry + rr),
              outline=RED, width=2)
    inner = rr - 12
    d.ellipse((rx - inner, ry - inner, rx + inner, ry + inner),
              fill=(*RED, 18))
    centered_box = "PERFECTING\n FOREVER"
    f_pf = font(MONO_BOLD, 14)
    for i, line in enumerate(centered_box.split("\n")):
        tw = text_w(d, line, f_pf)
        d.text((rx - tw // 2, ry - 16 + i * 20), line, font=f_pf, fill=RED)
    d.text((rx - 70, ry + rr + 10), "never shipped", font=f_label, fill=MUTED)

    # 7-circle progression on the left/center
    bands = [("crawl", GREEN, 3), ("walk", ACCENT, 2), ("run", AMBER, 2)]
    cy = 320
    cr = 28
    xs = [110, 180, 250, 360, 430, 540, 610]
    versions = ["v0.1", "v0.2", "v0.3", "v1.0", "v1.1", "v2.0", "v2.1"]
    colors = [GREEN, GREEN, GREEN, ACCENT, ACCENT, AMBER, AMBER]
    for x, v, c in zip(xs, versions, colors):
        d.ellipse((x - cr, cy - cr, x + cr, cy + cr),
                  fill=(*c, 30), outline=c, width=2)
        tw = text_w(d, v, f_label)
        d.text((x - tw // 2, cy - 8), v, font=f_label, fill=c)

    # Band labels above
    band_centers = [(xs[1], GREEN, "crawl"),
                    (xs[3] + 35, ACCENT, "walk"),
                    (xs[5] + 35, AMBER, "run")]
    for x, c, lbl in band_centers:
        tw = text_w(d, lbl, f_band)
        d.text((x - tw // 2, cy - cr - 32), lbl, font=f_band, fill=c)

    # Cumulative impact bar below
    bar_y = cy + cr + 50
    bar_h = 70
    seg_w = 70
    for i, x in enumerate(xs):
        h = 12 + i * 9
        c = colors[i]
        d.rounded_rectangle((x - 22, bar_y + bar_h - h, x + 22, bar_y + bar_h),
                            radius=4, fill=(*c, 80), outline=c, width=1)
    d.text((xs[0] - 30, bar_y + bar_h + 10), "cumulative impact",
           font=f_label, fill=MUTED)

    footer(d, "done & iterated beats perfect & waiting")
    return img


# =============================================================================
# 2. blog-data-careers.png
# =============================================================================

def render_data_careers() -> Image.Image:
    import math
    img, d = new_canvas()
    title_block(d, "Data Careers Are Not", "Pokemon Evolutions")

    cx, cy = W // 2, 380
    hub_r = 56
    # spokes
    roles = [
        ("Data Engineer", GREEN, -90),
        ("ML Engineer", RED, -30),
        ("Analytics Eng", PURPLE, 30),
        ("Data Scientist", AMBER, 90),
        ("Data Analyst", ACCENT, 150),
        ("Data Architect", GRAY, 210),
    ]
    f_role = font(MONO_BOLD, 16)
    f_hub = font(MONO_BOLD, 14)
    radius = 200
    for label, color, ang in roles:
        rad = math.radians(ang)
        x = cx + radius * math.cos(rad)
        y = cy + radius * math.sin(rad) * 0.85  # squash vertically a bit
        # connector (radial only — no role-to-role lines)
        d.line((cx, cy, x, y), fill=(*color, 110), width=2)
        # label box
        tw = text_w(d, label, f_role)
        bw, bh = tw + 24, 36
        bx, by = x - bw // 2, y - bh // 2
        d.rounded_rectangle((bx, by, bx + bw, by + bh), radius=10,
                            fill=(*color, 28), outline=color, width=2)
        d.text((bx + 12, by + 9), label, font=f_role, fill=color)
    # hub
    d.ellipse((cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r),
              fill=(*ACCENT, 30), outline=ACCENT, width=2)
    for i, line in enumerate(["YOUR", "CURIOSITY"]):
        tw = text_w(d, line, f_hub)
        d.text((cx - tw // 2, cy - 16 + i * 18), line, font=f_hub, fill=ACCENT)

    footer(d, "every path is valid — pick the one that fits your curiosity")
    return img


# =============================================================================
# 3. blog-data-quality-gaps.png
# =============================================================================

def render_data_quality_gaps() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "Trust the Data?", "Ask the People Who Live In It")

    f_sub = font(MONO_REG, 18)
    centered(d, "Ivory Castle vs. The Gemba", 240, f_sub, MUTED)

    # Two equal panels
    pw, ph = 470, 280
    py = 280
    lx = 60
    rx = W - lx - pw

    # LEFT — IVORY CASTLE (cyan)
    panel(d, lx, py, pw, ph, ACCENT)
    panel_header(d, lx, py + 14, pw, "IVORY CASTLE", ACCENT, font(MONO_BOLD, 16))
    f_code = font(MONO_REG, 14)
    inner_x = lx + 30
    # mock window header
    d.rounded_rectangle((inner_x, py + 50, inner_x + pw - 60, py + 80),
                        radius=6, fill=(*MUTED, 40))
    d.text((inner_x + 10, py + 56), "analyst_dashboard.sql", font=f_code, fill=GRAY)
    rows = [
        ("001", "active", "1200.00"),
        ("002", "active", " 875.00"),
        ("003", "active", "2100.00"),
    ]
    for i, (a, b, c) in enumerate(rows):
        y = py + 90 + i * 24
        d.text((inner_x + 10, y), f"{a}  |  {b}  |  {c}", font=f_code, fill=INK)
    d.text((inner_x + 10, py + 180), "✓ no nulls   ✓ no dupes   ✓ joins ok",
           font=f_code, fill=GREEN)
    d.text((inner_x + 10, py + 220), "\"data looks great!\"", font=f_code, fill=MUTED)

    # CENTER arrow
    cx = W // 2
    arrow(d, cx - 24, py + ph // 2, cx + 24, py + ph // 2, color=AMBER, width=2)
    f_mid = font(MONO_BOLD, 13)
    s = "go to the"
    tw = text_w(d, s, f_mid)
    d.text((cx - tw // 2, py + ph // 2 - 28), s, font=f_mid, fill=AMBER)
    s2 = "GEMBA"
    tw2 = text_w(d, s2, f_mid)
    d.text((cx - tw2 // 2, py + ph // 2 + 10), s2, font=f_mid, fill=AMBER)

    # RIGHT — THE GEMBA (amber)
    panel(d, rx, py, pw, ph, AMBER)
    panel_header(d, rx, py + 14, pw, "THE GEMBA — where the work happens",
                 AMBER, font(MONO_BOLD, 14))
    inner_x = rx + 30
    d.text((inner_x, py + 50), "SME:", font=f_code, fill=AMBER)
    bubble = ("\"status='active' just means",
              " the record wasn't deleted.",
              " half haven't transacted in 3 yrs.\"")
    for i, line in enumerate(bubble):
        d.text((inner_x + 50, py + 50 + i * 20), line, font=f_code, fill=INK)
    # GAPS DISCOVERED panel
    gx, gy, gw, gh = inner_x, py + 130, pw - 60, 120
    d.rounded_rectangle((gx, gy, gx + gw, gy + gh), radius=8,
                        fill=(*RED, 18), outline=RED, width=1)
    d.text((gx + 10, gy + 8), "△ GAPS DISCOVERED", font=font(MONO_BOLD, 13), fill=RED)
    gaps = [
        ("002", "1200.00", "← DORMANT"),
        ("004", "   0.00", "← TEST ACCT"),
        ("005", " 450.00", "← DORMANT"),
    ]
    for i, (a, b, c) in enumerate(gaps):
        y = gy + 32 + i * 22
        d.text((gx + 10, y), f"{a}  | {b}  {c}", font=f_code, fill=RED)

    footer(d, "analyst + SME = real data quality")
    return img


# =============================================================================
# 4. blog-cheerleader-quarterback.png
# =============================================================================

def render_cheerleader_quarterback() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "From Cheerleader to Quarterback:", "Data Pros Must Own the Field")

    f_h = font(MONO_BOLD, 18)
    f_b = font(MONO_REG, 15)
    pw, ph = 470, 290
    py = 230
    lx, rx = 60, W - 60 - pw

    # icons above panels
    # pom-pom (left) — two crossed arcs (red)
    icx, icy = lx + pw // 2, py - 32
    for ang in (0, 60, 120):
        import math
        rad = math.radians(ang)
        d.line((icx - 16 * math.cos(rad), icy - 16 * math.sin(rad),
                icx + 16 * math.cos(rad), icy + 16 * math.sin(rad)),
               fill=RED, width=3)
    d.ellipse((icx - 5, icy - 5, icx + 5, icy + 5), fill=RED)
    # football (right) — cyan ellipse with stitches
    fcx, fcy = rx + pw // 2, py - 32
    d.ellipse((fcx - 22, fcy - 12, fcx + 22, fcy + 12),
              outline=ACCENT, width=2)
    d.line((fcx - 12, fcy, fcx + 12, fcy), fill=ACCENT, width=2)
    for off in (-8, -4, 0, 4, 8):
        d.line((fcx + off, fcy - 4, fcx + off, fcy + 4), fill=ACCENT, width=1)

    # LEFT panel — cheerleader (muted)
    panel(d, lx, py, pw, ph, GRAY)
    panel_header(d, lx, py + 14, pw, "Cheerleader Role", GRAY, f_h)
    cheer = [
        "⏳ waits to be asked questions",
        "📊 reports metrics after the fact",
        "↩  answers — doesn't frame problems",
        "□  supports decisions made by others",
        "│  on the sideline, not the field",
    ]
    for i, line in enumerate(cheer):
        d.text((lx + 28, py + 60 + i * 36), line, font=f_b, fill=GRAY)

    # RIGHT panel — quarterback (cyan)
    panel(d, rx, py, pw, ph, ACCENT)
    panel_header(d, rx, py + 14, pw, "Quarterback Role", ACCENT, f_h)
    qb = [
        "→ proactively surfaces insights",
        "◇ frames the problem, not just data",
        "≡ defines KPIs with the business",
        "▶ drives decisions, doesn't just support",
        "✚ half analyst, half domain expert",
    ]
    for i, line in enumerate(qb):
        d.text((rx + 28, py + 60 + i * 36), line, font=f_b, fill=ACCENT)

    # Center "grow into" arrow
    midx = W // 2
    midy = py + ph // 2
    arrow(d, midx - 22, midy, midx + 22, midy, color=ACCENT, width=2)
    s = "grow into"
    f_mid = font(MONO_REG, 13)
    tw = text_w(d, s, f_mid)
    d.text((midx - tw // 2, midy - 22), s, font=f_mid, fill=ACCENT)

    # Hash-mark strip below
    hy = py + ph + 26
    d.line((lx, hy, lx + pw + (W - 2 * lx - 2 * pw) + pw, hy),
           fill=MUTED, width=1)
    for i in range(11):
        x = lx + i * ((rx + pw - lx) // 10)
        d.line((x, hy - 6, x, hy + 6), fill=ACCENT, width=2)

    footer(d, "the data pro of tomorrow owns the problem — not just the query")
    return img


# =============================================================================
# 5. blog-kpis-cultural.png
# =============================================================================

def render_kpis_cultural() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "KPIs Are a Cultural Change,", "Not a Dashboard Project")

    f_h = font(MONO_BOLD, 14)
    f_b = font(MONO_REG, 13)
    f_lb = font(MONO_BOLD, 13)

    # Lanes
    lane_x0, lane_x1 = 100, W - 100
    tech_y = 270
    cul_y = 360
    lane_h = 56

    # Technical (green) — finishes at week 4
    tech_w = (lane_x1 - lane_x0) * 0.30
    d.rounded_rectangle((lane_x0, tech_y, lane_x0 + tech_w, tech_y + lane_h),
                        radius=10, fill=(*GREEN, 22), outline=GREEN, width=2)
    panel_header(d, lane_x0, tech_y - 22, tech_w, "TECHNICAL TRACK", GREEN, f_h)
    tech_items = ["✓ workshop", "✓ pipeline", "✓ dashboard", "✓ training", "✓ scheduled"]
    sx = lane_x0 + 14
    for it in tech_items:
        d.text((sx, tech_y + 18), it, font=f_b, fill=GREEN)
        sx += text_w(d, it, f_b) + 16
    # green check terminator
    cx = lane_x0 + tech_w + 14
    d.ellipse((cx - 12, tech_y + lane_h // 2 - 12,
               cx + 12, tech_y + lane_h // 2 + 12),
              fill=(*GREEN, 30), outline=GREEN, width=2)
    d.text((cx - 4, tech_y + lane_h // 2 - 8), "✓", font=f_lb, fill=GREEN)

    # Cultural (amber) — keeps going past month 6, fading
    cul_w = (lane_x1 - lane_x0) * 0.85
    d.rounded_rectangle((lane_x0, cul_y, lane_x0 + cul_w, cul_y + lane_h),
                        radius=10, fill=(*AMBER, 18), outline=AMBER, width=2)
    panel_header(d, lane_x0, cul_y - 22, cul_w, "CULTURAL TRACK", AMBER, f_h)
    cul_items = ["□ leader owns each number",
                 "□ meetings reference metrics",
                 "□ decisions actually change"]
    sx = lane_x0 + 14
    for it in cul_items:
        d.text((sx, cul_y + 18), it, font=f_b, fill=AMBER)
        sx += text_w(d, it, f_b) + 18
    # fade to muted on the right
    d.text((lane_x0 + cul_w + 8, cul_y + 18), "…", font=f_b, fill=MUTED)

    # Timeline below
    ty = 460
    d.line((lane_x0, ty, lane_x1, ty), fill=MUTED, width=1)
    ticks = [(lane_x0 + (lane_x1 - lane_x0) * 0.30, GREEN, "WEEK 4"),
             (lane_x0 + (lane_x1 - lane_x0) * 0.55, AMBER, "MONTH 6"),
             (lane_x1 - 20, RED, "MONTH 12")]
    for x, c, lbl in ticks:
        d.ellipse((x - 5, ty - 5, x + 5, ty + 5), fill=c)
        tw = text_w(d, lbl, f_b)
        d.text((x - tw // 2, ty + 12), lbl, font=f_b, fill=c)

    # Outcomes
    oy = 525
    left_out = "17 charts nobody opens"
    right_out = "data-driven is a behavior"
    f_o = font(MONO_BOLD, 14)
    twL = text_w(d, left_out, f_o)
    d.text((lane_x0 + (lane_x1 - lane_x0) * 0.30 - twL // 2, oy),
           left_out, font=f_o, fill=RED)
    twR = text_w(d, right_out, f_o)
    d.text((lane_x1 - 20 - twR + 20, oy), right_out, font=f_o, fill=GREEN)

    footer(d, "the dashboard is not the deliverable — the behavior change is")
    return img


# =============================================================================
# 6. blog-telephone-game.png  (highest priority — currently broken)
# =============================================================================

def render_telephone_game() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "The Telephone Game", "Is How Analytics Goes Wrong")

    f_role = font(MONO_BOLD, 14)
    f_bub = font(MONO_REG, 13)

    figures = [
        (130, "CEO", "enterprise health", ACCENT),
        (335, "VP", "cust. health Q2", AMBER),
        (540, "Director", "health dashboard", AMBER),
        (745, "Manager", "ARR + churn + NPS?", RED),
        (950, "Analyst", "??", RED),
    ]
    fy = 320
    for cx, role, msg, c in figures:
        stick_figure(d, cx, fy, h=120, color=INK, width=2)
        # role label
        tw = text_w(d, role, f_role)
        d.text((cx - tw // 2, fy + 130), role, font=f_role, fill=MUTED)
        # speech bubble above
        tw2 = text_w(d, msg, f_bub)
        bw = tw2 + 20
        bx = cx - bw // 2
        by = fy - 36
        d.rounded_rectangle((bx, by, bx + bw, by + 26), radius=8,
                            fill=(*c, 28), outline=c, width=1)
        d.text((bx + 10, by + 6), msg, font=f_bub, fill=c)

    # Connectors between heads — fading from cyan to red, getting dashy
    arrow_y = fy + 12
    pairs = [(figures[i][0], figures[i + 1][0]) for i in range(4)]
    colors_mid = [ACCENT, AMBER, AMBER, RED]
    for (x0, x1), c, dashed in zip(pairs, colors_mid, [False, False, True, True]):
        if dashed:
            dashed_hline(d, x0 + 30, x1 - 30, arrow_y, color=c, dash=10, gap=6, width=2)
            arrow(d, x1 - 36, arrow_y, x1 - 30, arrow_y, color=c, width=2)
        else:
            arrow(d, x0 + 30, arrow_y, x1 - 30, arrow_y, color=c, width=2)

    # Fidelity bar at bottom
    by = 510
    bw = W - 240
    bx = 120
    d.rounded_rectangle((bx, by, bx + bw, by + 22), radius=10,
                        fill=BG, outline=MUTED, width=1)
    fids = [(GREEN, 0.30), (AMBER, 0.25), (AMBER, 0.20), (RED, 0.15), (RED, 0.10)]
    cur = bx
    f_fid = font(MONO_BOLD, 11)
    pcts = ["100%", "80%", "55%", "30%", "??"]
    for (c, frac), pct in zip(fids, pcts):
        seg = int(bw * frac)
        d.rounded_rectangle((cur, by, cur + seg, by + 22), radius=6,
                            fill=(*c, 70), outline=c, width=1)
        tw = text_w(d, pct, f_fid)
        d.text((cur + seg // 2 - tw // 2, by + 5), pct, font=f_fid, fill=INK)
        cur += seg

    footer(d, "information loss at every handoff")
    return img


# =============================================================================
# 7. blog-tool-job-fit.png
# =============================================================================

def render_tool_job_fit() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "Stop Forcing Tools", "Into Jobs They Weren't Built For")

    # Quadrant grid
    qx0, qy0 = 180, 250
    qx1, qy1 = W - 80, H - 100
    midx = (qx0 + qx1) // 2
    midy = (qy0 + qy1) // 2
    d.line((qx0, midy, qx1, midy), fill=MUTED, width=1)
    d.line((midx, qy0, midx, qy1), fill=MUTED, width=1)
    d.rectangle((qx0, qy0, qx1, qy1), outline=MUTED, width=1)

    f_axis = font(MONO_BOLD, 13)
    # X axis labels
    d.text((qx0, qy1 + 8), "prototype", font=f_axis, fill=MUTED)
    rt = "production"
    d.text((qx1 - text_w(d, rt, f_axis), qy1 + 8), rt, font=f_axis, fill=MUTED)
    # Y axis labels
    d.text((qx0 - 90, qy0), "governed", font=f_axis, fill=MUTED)
    d.text((qx0 - 90, qy1 - 16), "ad hoc", font=f_axis, fill=MUTED)

    # Place pills
    f_pill = font(MONO_BOLD, 13)

    def pill(x, y, label, color):
        tw = text_w(d, label, f_pill)
        pw = tw + 24
        ph = 30
        d.rounded_rectangle((x - pw // 2, y - ph // 2, x + pw // 2, y + ph // 2),
                            radius=14, fill=(*color, 30), outline=color, width=2)
        d.text((x - tw // 2, y - 8), label, font=f_pill, fill=color)

    # Bottom-left (prototype + ad hoc) — amber
    bl_pos = [(qx0 + 80, midy + 80, "Excel"),
              (qx0 + 200, midy + 130, "notebook"),
              (qx0 + 80, midy + 180, "CSV"),
              (qx0 + 220, midy + 60, "cron")]
    for x, y, lbl in bl_pos:
        pill(x, y, lbl, AMBER)
    # Top-right (production + governed) — green
    tr_pos = [(midx + 100, qy0 + 50, "SQL"),
              (midx + 220, qy0 + 100, "warehouse"),
              (midx + 100, qy0 + 150, "Parquet"),
              (midx + 240, qy0 + 30, "Airflow")]
    for x, y, lbl in tr_pos:
        pill(x, y, lbl, GREEN)

    # Faint diagonal arrows from each prototype to its production counterpart
    pairs_idx = [(0, 0), (1, 1), (2, 2), (3, 3)]
    for li, ri in pairs_idx:
        x0, y0, _ = bl_pos[li]
        x1, y1, _ = tr_pos[ri]
        # dashed line
        # very faint
        for t in range(0, 100, 8):
            sx = x0 + (x1 - x0) * t / 100
            sy = y0 + (y1 - y0) * t / 100
            ex = x0 + (x1 - x0) * (t + 5) / 100
            ey = y0 + (y1 - y0) * (t + 5) / 100
            d.line((sx, sy, ex, ey), fill=(*MUTED, 110), width=1)

    # mid label
    mid_label = "the right tool depends on the phase"
    f_ml = font(MONO_REG, 13)
    tw = text_w(d, mid_label, f_ml)
    d.text((midx - tw // 2, qy0 - 24), mid_label, font=f_ml, fill=MUTED)

    footer(d, "Low Hanging Data")
    return img


# =============================================================================
# 8. blog-aws-iot.png
# =============================================================================

def render_aws_iot() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "AWS IoT for", "Medical Device Telemetry")

    pw, ph = 320, 280
    py = 240
    gap = 24
    total = pw * 3 + gap * 2
    x0 = (W - total) // 2

    f_h = font(MONO_BOLD, 16)
    f_b = font(MONO_REG, 13)

    # LEFT — DEVICE FLEET (cyan)
    panel(d, x0, py, pw, ph, ACCENT)
    panel_header(d, x0, py + 14, pw, "DEVICE FLEET", ACCENT, f_h)
    # 2x2 grid of device icons
    for r in range(2):
        for c in range(2):
            ix = x0 + 50 + c * 110
            iy = py + 70 + r * 80
            d.rounded_rectangle((ix, iy, ix + 80, iy + 50), radius=8,
                                fill=(*ACCENT, 18), outline=ACCENT, width=1)
            d.ellipse((ix + 60, iy + 10, ix + 70, iy + 20), fill=GREEN)
            d.line((ix + 8, iy + 30, ix + 56, iy + 30), fill=GRAY, width=1)
            d.line((ix + 8, iy + 38, ix + 40, iy + 38), fill=GRAY, width=1)
    d.text((x0 + 30, py + ph - 36), "12,000 devices · global", font=f_b, fill=MUTED)

    # MIDDLE — AWS IoT CORE (amber)
    x1 = x0 + pw + gap
    panel(d, x1, py, pw, ph, AMBER)
    panel_header(d, x1, py + 14, pw, "AWS IoT CORE", AMBER, f_h)
    msgs = [
        ("t=0", "device_42 · temp=37.1", "ok", GREEN),
        ("t=1", "device_42 · temp=39.8", "warn", AMBER),
        ("t=2", "device_42 · fault=E07", "alert", RED),
    ]
    for i, (t, body, badge, c) in enumerate(msgs):
        my = py + 60 + i * 50
        d.rounded_rectangle((x1 + 14, my, x1 + pw - 14, my + 38), radius=6,
                            fill=(*c, 18), outline=c, width=1)
        d.text((x1 + 22, my + 10), f"{t}  {body}", font=f_b, fill=INK)
        d.text((x1 + pw - 60, my + 10), badge, font=font(MONO_BOLD, 12), fill=c)
    d.text((x1 + 30, py + ph - 36), "MQTT · 2.3M msgs/day", font=f_b, fill=MUTED)

    # RIGHT — PREDICTED FAILURE (green)
    x2 = x1 + pw + gap
    panel(d, x2, py, pw, ph, GREEN)
    panel_header(d, x2, py + 14, pw, "PREDICTED FAILURE", GREEN, f_h)
    # mini line chart
    cx0, cy0 = x2 + 30, py + 60
    cw, ch = pw - 60, 130
    d.line((cx0, cy0 + ch, cx0 + cw, cy0 + ch), fill=GRAY, width=1)
    # threshold line
    th_y = cy0 + ch - int(ch * 0.7)
    dashed_hline(d, cx0, cx0 + cw, th_y, color=RED, dash=6, gap=4, width=1)
    d.text((cx0 + cw - 60, th_y - 16), "thresh 0.7", font=font(MONO_REG, 11), fill=RED)
    # rising probability curve
    pts = [(cx0 + i * cw // 8, cy0 + ch - int(ch * (0.1 + 0.1 * i)))
           for i in range(9)]
    for a, b in zip(pts, pts[1:]):
        d.line((a, b), fill=GREEN, width=2)
    # badge
    by_ = py + ph - 60
    d.rounded_rectangle((x2 + 14, by_, x2 + pw - 14, by_ + 28), radius=8,
                        fill=(*GREEN, 24), outline=GREEN, width=1)
    s = "FIELD TECH DISPATCHED · 6 days early"
    f_ba = font(MONO_BOLD, 11)
    tw = text_w(d, s, f_ba)
    d.text((x2 + (pw - tw) // 2, by_ + 8), s, font=f_ba, fill=GREEN)

    # arrows between panels
    ay = py + ph // 2
    arrow(d, x0 + pw + 4, ay, x1 - 4, ay, color=AMBER, width=2)
    arrow(d, x1 + pw + 4, ay, x2 - 4, ay, color=GREEN, width=2)

    footer(d, "stream telemetry · model failure · ship before it breaks")
    return img


# =============================================================================
# 9. blog-stock-prediction.png
# =============================================================================

def render_stock_prediction() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "Building a", "Stock Prediction Pipeline")

    # Top: 4-stage pipeline
    py = 240
    pw, ph = 220, 90
    gap = 24
    total = pw * 4 + gap * 3
    x0 = (W - total) // 2
    stages = [("COLLECT", ACCENT), ("FEATURE", AMBER),
              ("TRAIN", PURPLE), ("PREDICT", GREEN)]
    f_h = font(MONO_BOLD, 16)
    for i, (lbl, c) in enumerate(stages):
        x = x0 + i * (pw + gap)
        panel(d, x, py, pw, ph, c)
        tw = text_w(d, lbl, f_h)
        d.text((x + (pw - tw) // 2, py + 14), lbl, font=f_h, fill=c)
        # tiny inline icon
        ix, iy = x + 30, py + 50
        if i == 0:
            for r in range(3):
                d.line((ix, iy + r * 8, ix + 60, iy + r * 8), fill=c, width=2)
        elif i == 1:
            d.text((ix, iy - 4), "[ lag · diff · roll ]", font=font(MONO_REG, 11), fill=c)
        elif i == 2:
            for j in range(8):
                cxp = ix + (j * 7) % 60
                cyp = iy + (j * 11) % 30
                d.ellipse((cxp - 2, cyp - 2, cxp + 2, cyp + 2), fill=c)
            d.line((ix, iy + 25, ix + 60, iy - 5), fill=c, width=1)
        else:
            d.line((ix, iy + 24, ix + 20, iy + 16, ix + 36, iy + 22, ix + 60, iy),
                   fill=c, width=2)
        # arrow to next
        if i < 3:
            ay = py + ph // 2
            arrow(d, x + pw + 4, ay, x + pw + gap - 4, ay, color=c, width=2)

    # Bottom: results panel
    rx, ry = 60, 380
    rw, rh = W - 120, 200
    panel(d, rx, ry, rw, rh, ACCENT)
    panel_header(d, rx, ry + 14, rw, "WHAT WE LEARNED", ACCENT, f_h)
    f_r = font(MONO_REG, 14)
    lefts = [
        "✓ pipeline ran daily for 90 days",
        "✓ 61% directional accuracy on test",
        "✓ feature engineering > model choice",
    ]
    rights = [
        "✗ live trading lost money — slippage",
        "✗ regime change in week 7 broke model",
        "✗ \"alpha\" decayed within 2 weeks",
    ]
    for i, line in enumerate(lefts):
        d.text((rx + 28, ry + 60 + i * 36), line, font=f_r, fill=GREEN)
    for i, line in enumerate(rights):
        d.text((rx + rw // 2 + 14, ry + 60 + i * 36), line, font=f_r, fill=RED)

    footer(d, "the pipeline shipped · the alpha didn't")
    return img


# =============================================================================
# 10. blog-welcome.png
# =============================================================================

def render_welcome() -> Image.Image:
    img, d = new_canvas()
    title_block(d, "Welcome to", "Posts")

    f_sub = font(MONO_REG, 18)
    centered(d, "project write-ups · tool opinions · field notes",
             236, f_sub, MUTED)

    pw, ph = 260, 180
    py = 320
    gap = 30
    total = pw * 3 + gap * 2
    x0 = (W - total) // 2
    items = [
        (ACCENT, "PROJECT WRITE-UPS", "what we built", "and why"),
        (AMBER, "TOOL OPINIONS", "what worked,", "what didn't"),
        (GREEN, "FIELD NOTES", "shorter than", "articles"),
    ]
    f_h = font(MONO_BOLD, 16)
    f_s = font(MONO_REG, 14)
    for i, (c, h, s1, s2) in enumerate(items):
        x = x0 + i * (pw + gap)
        panel(d, x, py, pw, ph, c)
        # icon
        ix, iy = x + pw // 2, py + 40
        if i == 0:
            # URL pill
            label = "/posts/"
            tw = text_w(d, label, f_s)
            d.rounded_rectangle((ix - tw // 2 - 12, iy - 14, ix + tw // 2 + 12, iy + 14),
                                radius=14, fill=(*c, 30), outline=c, width=1)
            d.text((ix - tw // 2, iy - 8), label, font=f_s, fill=c)
        elif i == 1:
            # magnifying glass on chart
            d.line((ix - 30, iy + 12, ix - 10, iy - 4, ix + 6, iy + 6,
                    ix + 24, iy - 16), fill=c, width=2)
            d.ellipse((ix + 8, iy - 26, ix + 30, iy - 4), outline=c, width=2)
            d.line((ix + 28, iy - 8, ix + 38, iy + 4), fill=c, width=2)
        else:
            # notebook + pen
            d.rounded_rectangle((ix - 26, iy - 14, ix + 14, iy + 14), radius=4,
                                outline=c, width=2)
            d.line((ix - 18, iy - 6, ix + 6, iy - 6), fill=c, width=1)
            d.line((ix - 18, iy + 0, ix + 6, iy + 0), fill=c, width=1)
            d.line((ix + 18, iy + 14, ix + 30, iy - 10), fill=c, width=2)

        tw = text_w(d, h, f_h)
        d.text((x + (pw - tw) // 2, py + 80), h, font=f_h, fill=c)
        for j, line in enumerate((s1, s2)):
            tw = text_w(d, line, f_s)
            d.text((x + (pw - tw) // 2, py + 110 + j * 22), line, font=f_s, fill=MUTED)

    footer(d, "for the long-form technical guides, see /article/")
    return img


# =============================================================================
# Main
# =============================================================================

RENDERERS = [
    ("blog-crawl-walk-run.png", render_crawl_walk_run),
    ("blog-data-careers.png", render_data_careers),
    ("blog-data-quality-gaps.png", render_data_quality_gaps),
    ("blog-cheerleader-quarterback.png", render_cheerleader_quarterback),
    ("blog-kpis-cultural.png", render_kpis_cultural),
    ("blog-telephone-game.png", render_telephone_game),
    ("blog-tool-job-fit.png", render_tool_job_fit),
    ("blog-aws-iot.png", render_aws_iot),
    ("blog-stock-prediction.png", render_stock_prediction),
    ("blog-welcome.png", render_welcome),
]


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    for name, fn in RENDERERS:
        img = fn()
        out = PUBLIC / name
        img.save(out, "PNG", optimize=True)
        print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
