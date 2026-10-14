"""Open Home Hero logo geometry.

Builds the logo as SVG with the lettering converted to outlines, so the files
look identical everywhere with no fonts to install. Font: Source Serif 4
(SIL Open Font License), the same serif the website uses for headings.

Run through build_brand.py; this module only draws.
"""
from functools import lru_cache
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = Path(__file__).parent

# Brand colours (match src/app/globals.css)
NAVY = "#1B2430"
PAPER = "#EFEAE0"
BRASS = "#B08D57"
BRASS_DEEP = "#8C6D3F"  # brass for text on light backgrounds (readable)
WHITE = "#FFFFFF"


@lru_cache(maxsize=None)
def font(wght: int, opsz: int):
    f = TTFont(HERE / "SourceSerif4.ttf")
    return instantiateVariableFont(f, {"wght": wght, "opsz": opsz}, inplace=False)


@lru_cache(maxsize=None)
def inter(wght: int, opsz: int = 14):
    f = TTFont(HERE / "Inter.ttf")
    return instantiateVariableFont(f, {"wght": wght, "opsz": opsz}, inplace=False)


def text_path(f, text, size, x, baseline, tracking=0.0):
    """Outline `text` as an SVG path. Returns (path_d, advance_width, bounds)."""
    scale = size / f["head"].unitsPerEm
    glyphs = f.getGlyphSet()
    cmap = f.getBestCmap()
    d_parts, cursor = [], x
    xmin = ymin = 1e9
    xmax = ymax = -1e9
    for ch in text:
        name = cmap[ord(ch)]
        g = glyphs[name]
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        g.draw(TransformPen(pen, (scale, 0, 0, -scale, cursor, baseline)))
        cmd = pen.getCommands()
        if cmd:
            d_parts.append(cmd)
            bp = BoundsPen(glyphs)
            g.draw(bp)
            if bp.bounds:
                x0, y0, x1, y1 = bp.bounds
                xmin = min(xmin, cursor + x0 * scale)
                xmax = max(xmax, cursor + x1 * scale)
                ymin = min(ymin, baseline - y1 * scale)
                ymax = max(ymax, baseline - y0 * scale)
        cursor += g.width * scale + tracking
    return " ".join(d_parts), cursor - x, (xmin, ymin, xmax, ymax)


# ---- The mark: a roof over an H -------------------------------------------
# Drawn on a 512 x 512 grid. The open roof stands for an "open home"; the H
# stands for Hero. The group fits inside a circle so social profile pictures
# can be cropped round without clipping.
def mark_group(h_color, roof_color):
    f = font(700, 60)
    cap = 232  # height of the H in grid units
    size = cap / (f["OS/2"].sCapHeight / f["head"].unitsPerEm)
    # measure H to centre it
    _, adv, (x0, y0, x1, y1) = text_path(f, "H", size, 0, 0)
    h_w, h_h = x1 - x0, y1 - y0
    roof_h = 74
    gap = 30
    total = roof_h + gap + h_h
    top = (512 - total) / 2
    base = top + roof_h + gap + h_h  # baseline of H (y grows downward)
    hx = 256 - h_w / 2 - x0
    d, _, _ = text_path(f, "H", size, hx, base)
    # roof: an open chevron, wider than the H
    half = h_w / 2 + 34
    apex_y = top + 6
    eave_y = top + roof_h
    sw = 26
    roof = (
        f'<path d="M{256 - half:.1f} {eave_y:.1f} L256 {apex_y:.1f} L{256 + half:.1f} {eave_y:.1f}" '
        f'fill="none" stroke="{roof_color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'
    )
    return f'<path d="{d}" fill="{h_color}"/>' + roof


def mark_svg(bg=NAVY, h_color=PAPER, roof_color=BRASS, rounded=True, size=512, transparent=False):
    rx = 112 if rounded else 0
    tile = "" if transparent or bg is None else f'<rect width="512" height="512" rx="{rx}" fill="{bg}"/>'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}" role="img" aria-label="Open Home Hero">'
        f"{tile}{mark_group(h_color, roof_color)}</svg>"
    )


# ---- Wordmark and lockups --------------------------------------------------
def wordmark_paths(size, x, baseline, first_color, hero_color):
    f = font(600, 40)
    track = size * -0.005
    d1, w1, b1 = text_path(f, "Open Home", size, x, baseline, track)
    space = size * 0.27
    d2, w2, b2 = text_path(f, "Hero", size, x + w1 + space, baseline, track)
    right = x + w1 + space + w2 - track
    cap_top = baseline - f["OS/2"].sCapHeight / f["head"].unitsPerEm * size
    return (
        f'<path d="{d1}" fill="{first_color}"/><path d="{d2}" fill="{hero_color}"/>',
        right,
        cap_top,
    )


def _bare(group_svg):
    """A tile-less mark is mostly empty space inside its square, so enlarge it
    to sit at the same visual weight as the wordmark next to it."""
    body = group_svg.split(">", 1)[1].rsplit("</svg>", 1)[0]
    return f'<g transform="translate(256 256) scale(1.5) translate(-256 -256)">{body}</g>'


def _mark_inner(tile, mono):
    if mono:
        return _bare(mark_svg(None, mono, mono, transparent=True))
    if tile:
        return mark_svg(NAVY, PAPER, BRASS).split(">", 1)[1].rsplit("</svg>", 1)[0]
    return _bare(mark_svg(None, PAPER, BRASS, transparent=True))


def _colours(on, mono):
    if mono:
        return mono, mono
    return (NAVY, BRASS_DEEP) if on == "light" else (PAPER, BRASS)


def horizontal_svg(on="light", tile=None, mono=None, bg=None):
    """Mark + wordmark on one line. on = background it sits on ("light" or "dark")."""
    if tile is None:
        tile = on == "light"
    first, hero = _colours(on, mono)
    mark_size, size, gap = 120, 74, 36
    f = font(600, 40)
    cap = f["OS/2"].sCapHeight / f["head"].unitsPerEm * size
    x = mark_size + gap
    baseline = mark_size / 2 + cap / 2
    wm, right, _ = wordmark_paths(size, x, baseline, first, hero)
    mk = f'<g transform="scale({mark_size/512:.5f})">{_mark_inner(tile, mono)}</g>'
    bgrect = f'<rect width="{right:.1f}" height="{mark_size}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {right:.1f} {mark_size}" width="{right:.0f}" height="{mark_size}" role="img" aria-label="Open Home Hero">'
        f"{bgrect}{mk}{wm}</svg>",
        right,
        mark_size,
    )


def stacked_svg(on="light", tile=None, mono=None, bg=None):
    """Mark above the wordmark, centred."""
    if tile is None:
        tile = on == "light"
    first, hero = _colours(on, mono)
    mark_size, size = 260, 92
    f = font(600, 40)
    capr = f["OS/2"].sCapHeight / f["head"].unitsPerEm
    _, right, _ = wordmark_paths(size, 0, 0, first, hero)
    width = max(right, mark_size) + 40
    gap = 36 if tile else 62
    baseline = mark_size + gap + capr * size
    height = baseline + 28
    x = (width - right) / 2
    wm, _, _ = wordmark_paths(size, x, baseline, first, hero)
    bgrect = f'<rect width="{width:.1f}" height="{height:.1f}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.1f} {height:.1f}" width="{width:.0f}" height="{height:.0f}" role="img" aria-label="Open Home Hero">'
        f'{bgrect}<g transform="translate({(width - mark_size)/2:.1f} 0) scale({mark_size/512:.5f})">{_mark_inner(tile, mono)}</g>{wm}</svg>',
        width,
        height,
    )


def wordmark_only_svg(on="light", mono=None, bg=None):
    first, hero = _colours(on, mono)
    size = 92
    f = font(600, 40)
    capr = f["OS/2"].sCapHeight / f["head"].unitsPerEm
    baseline = capr * size + 14
    wm, right, _ = wordmark_paths(size, 0, baseline, first, hero)
    height = baseline + 30
    bgrect = f'<rect width="{right:.1f}" height="{height:.1f}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {right:.1f} {height:.1f}" width="{right:.0f}" height="{height:.0f}" role="img" aria-label="Open Home Hero">{bgrect}{wm}</svg>',
        right,
        height,
    )
