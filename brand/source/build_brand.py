"""Builds the Open Home Hero brand pack.

    python build_brand.py            (needs: fonttools, pillow, node + the site's `sharp`)

Everything is drawn from logo.py as SVG with the lettering converted to
outlines, then turned into PNGs. Change the logo in logo.py and re-run this
script to refresh every file in the pack.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

import logo
from logo import NAVY, PAPER, BRASS, BRASS_DEEP

HERE = Path(__file__).parent
PACK = HERE.parent / "open-home-hero-brand-pack"
TMP = Path(tempfile.mkdtemp(prefix="ohh-brand-"))
JOBS: list[dict] = []

TAGLINE = "Every visitor. Every offer. One QR code."
SUBLINE = "QR check-in, instant feedback, offers and rental applications."


# ------------------------------------------------------------------ helpers
def inner(svg: str) -> str:
    return svg.split(">", 1)[1].rsplit("</svg>", 1)[0]


def view(svg: str) -> tuple[float, float]:
    vb = svg.split('viewBox="')[1].split('"')[0].split()
    return float(vb[2]), float(vb[3])


def save_svg(path: Path, svg: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg)


def queue_png(svg: str, png: Path, w: int, h: int):
    """Queue a PNG render of this svg at exactly w x h."""
    png.parent.mkdir(parents=True, exist_ok=True)
    sized = re.sub(r'(<svg[^>]*?) width="[^"]*" height="[^"]*"', rf'\1 width="{w}" height="{h}"', svg, count=1)
    tmp = TMP / f"{len(JOBS)}.svg"
    tmp.write_text(sized)
    JOBS.append({"svg": str(tmp), "png": str(png), "w": w, "h": h})


def text_block(font, text, size, cx, baseline, color, tracking=0.0):
    """Outlined text centred on cx. Returns (svg, width)."""
    _, width, _ = logo.text_path(font, text, size, 0, 0, tracking)
    d, _, _ = logo.text_path(font, text, size, cx - width / 2, baseline, tracking)
    return f'<path d="{d}" fill="{color}"/>', width


def canvas(w, h, body, bg=NAVY):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{rect}{body}</svg>'


def place(svg_pair, cx, top, target_w):
    """Place a (svg, w, h) lockup centred at cx with given top and width. Returns (markup, height)."""
    svg, w, h = svg_pair
    s = target_w / w
    return (
        f'<g transform="translate({cx - target_w/2:.2f} {top:.2f}) scale({s:.5f})">{inner(svg)}</g>',
        h * s,
    )


def lockup_screen(w, h, lock_pair, lock_w, tag_px, sub_px=0, rule_w=None):
    """Centred block: logo, brass rule, tagline, optional subline. Used for banners and posts."""
    serif, sans = logo.font(600, 36), logo.inter(400)

    def fit(font, text, px):
        """Shrink text until it fits within 84% of the width."""
        if not px:
            return px
        _, width, _ = logo.text_path(font, text, px, 0, 0)
        return px if width <= w * 0.84 else px * (w * 0.84) / width

    tag_px, sub_px = fit(serif, TAGLINE, tag_px), fit(sans, SUBLINE, sub_px)
    s = lock_w / lock_pair[1]
    lock_h = lock_pair[2] * s
    if tag_px == 0:  # logo only
        mk, _ = place(lock_pair, w / 2, (h - lock_h) / 2, lock_w)
        return canvas(w, h, mk)
    cap = serif["OS/2"].sCapHeight / serif["head"].unitsPerEm * tag_px
    gap_a, rule_h, gap_b = tag_px * 0.95, 3, tag_px * 0.75
    sub_gap = sub_px * 0.9 if sub_px else 0
    sub_cap = sans["OS/2"].sCapHeight / sans["head"].unitsPerEm * sub_px if sub_px else 0
    total = lock_h + gap_a + rule_h + gap_b + cap + (sub_gap + sub_cap if sub_px else 0)
    top = (h - total) / 2
    cx = w / 2
    mk, _ = place(lock_pair, cx, top, lock_w)
    y = top + lock_h + gap_a
    rw = rule_w or max(60, lock_w * 0.12)
    rule = f'<rect x="{cx - rw/2:.1f}" y="{y:.1f}" width="{rw:.1f}" height="{rule_h}" fill="{BRASS}"/>'
    y += rule_h + gap_b + cap
    tag, _ = text_block(serif, TAGLINE, tag_px, cx, y, PAPER)
    sub = ""
    if sub_px:
        y += sub_gap + sub_cap
        sub, _ = text_block(sans, SUBLINE, sub_px, cx, y, "#B9B5AB")
    return canvas(w, h, mk + rule + tag + sub)


# ---------------------------------------------------------------- logo files
def logo_files():
    svg_dir, png_dir = PACK / "01-logo" / "svg", PACK / "01-logo" / "png"
    v = {
        "mark-tile": logo.mark_svg(),
        "mark-on-dark": logo.mark_svg(None, PAPER, BRASS, transparent=True),
        "mark-on-light": logo.mark_svg(None, NAVY, BRASS_DEEP, transparent=True),
        "mark-navy-one-colour": logo.mark_svg(None, NAVY, NAVY, transparent=True),
        "mark-white-one-colour": logo.mark_svg(None, "#FFFFFF", "#FFFFFF", transparent=True),
        "wordmark-for-light-backgrounds": logo.wordmark_only_svg("light")[0],
        "wordmark-for-dark-backgrounds": logo.wordmark_only_svg("dark")[0],
    }
    for name, fn in (("horizontal", logo.horizontal_svg), ("stacked", logo.stacked_svg)):
        v[f"{name}-for-light-backgrounds"] = fn("light")[0]
        v[f"{name}-for-dark-backgrounds"] = fn("dark")[0]
        v[f"{name}-navy-one-colour"] = fn("light", tile=False, mono=NAVY)[0]
        v[f"{name}-white-one-colour"] = fn("dark", tile=False, mono="#FFFFFF")[0]
    for name, svg in v.items():
        save_svg(svg_dir / f"open-home-hero-{name}.svg", svg)
        vw, vh = view(svg)
        if name.startswith("mark"):
            w = h = 1024
        else:
            w = 2000 if vw >= vh else int(2000 * vw / vh)
            h = int(round(w * vh / vw))
        queue_png(svg, png_dir / f"open-home-hero-{name}.png", w, h)


# -------------------------------------------------------------- social files
def square_profile(px: int, out: Path):
    queue_png(logo.mark_svg(NAVY, PAPER, BRASS, rounded=False), out, px, px)


def social_files():
    prof = PACK / "02-social" / "profile-pictures"
    cov = PACK / "02-social" / "cover-images"
    shr = PACK / "02-social" / "sharing-and-posts"
    for name, px in (
        ("facebook-profile-720", 720), ("instagram-profile-1080", 1080), ("x-profile-400", 400),
        ("linkedin-logo-400", 400), ("youtube-profile-800", 800), ("tiktok-profile-720", 720),
        ("google-business-profile-720", 720), ("whatsapp-business-profile-640", 640),
    ):
        square_profile(px, prof / f"{name}.png")

    dark_h = logo.horizontal_svg("dark")
    dark_s = logo.stacked_svg("dark")
    banners = [
        # file, w, h, logo width, tagline px, subline px  (content kept inside each platform's always-visible area)
        (cov / "facebook-cover-1640x624.png", 1640, 624, 700, 38, 23),
        (cov / "x-header-1500x500.png", 1500, 500, 600, 32, 20),
        (cov / "linkedin-personal-banner-1584x396.png", 1584, 396, 520, 28, 0),
        (cov / "linkedin-company-cover-1128x191.png", 1128, 191, 420, 0, 0),
        (cov / "youtube-banner-2560x1440.png", 2560, 1440, 1000, 54, 31),
        (shr / "link-preview-1200x630.png", 1200, 630, 760, 40, 22),
    ]
    for out, w, h, lw, tp, sp in banners:
        svg = lockup_screen(w, h, dark_h, lw, tp, sp)
        save_svg(PACK / "05-editable-svg-sources" / f"{out.stem}.svg", svg)
        queue_png(svg, out, w, h)
    posts = [
        (shr / "post-square-1080x1080.png", 1080, 1080, 520, 54, 27),
        (shr / "post-portrait-1080x1350.png", 1080, 1350, 560, 58, 29),
        (shr / "story-and-reel-cover-1080x1920.png", 1080, 1920, 600, 62, 31),
    ]
    for out, w, h, lw, tp, sp in posts:
        svg = lockup_screen(w, h, dark_s, lw, tp, sp)
        save_svg(PACK / "05-editable-svg-sources" / f"{out.stem}.svg", svg)
        queue_png(svg, out, w, h)


# ----------------------------------------------------------------- app icons
def maskable_svg() -> str:
    mk = inner(logo.mark_svg(None, PAPER, BRASS, transparent=True))
    sc = 0.74
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="{NAVY}"/>'
        f'<g transform="translate({256*(1-sc):.1f} {256*(1-sc):.1f}) scale({sc})">{mk}</g></svg>'
    )


def app_icons():
    d = PACK / "03-app-icons-and-favicon"
    for px, name in ((16, "favicon-16.png"), (32, "favicon-32.png"), (48, "favicon-48.png"),
                     (180, "apple-touch-icon-180.png"), (192, "icon-192.png"), (512, "icon-512.png")):
        square_profile(px, d / name)
    for px in (192, 512):
        queue_png(maskable_svg(), d / f"icon-maskable-{px}.png", px, px)
    save_svg(d / "favicon.svg", logo.mark_svg(NAVY, PAPER, BRASS, rounded=True))


def run_jobs():
    jobs = TMP / "jobs.json"
    jobs.write_text(json.dumps(JOBS))
    subprocess.run(["node", str(HERE / "raster.mjs"), str(jobs)], check=True, cwd=HERE)


def make_ico():
    d = PACK / "03-app-icons-and-favicon"
    imgs = [Image.open(d / n).convert("RGBA") for n in ("favicon-16.png", "favicon-32.png", "favicon-48.png")]
    imgs[2].save(d / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])


def package():
    """Add the written guide and make the downloadable zip."""
    docs = HERE.parent / "pack-docs"
    target = PACK / "04-brand-guide"
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(docs, target)
    shutil.make_archive(str(HERE.parent / "open-home-hero-brand-pack"), "zip", HERE.parent, PACK.name)


def main():
    if PACK.exists():
        shutil.rmtree(PACK)
    logo_files()
    social_files()
    app_icons()
    run_jobs()
    make_ico()
    package()
    print("built", PACK)


if __name__ == "__main__":
    main()
