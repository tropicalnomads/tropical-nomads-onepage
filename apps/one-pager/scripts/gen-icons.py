"""Generate favicons / PWA icons from the Tropical Nomads sun logo.

Crops the sun/alien glyph from the white-on-black brand logo and composites it
onto a branded radial-gradient background to produce all icon sizes the site
references (favicons, apple-touch-icon, PWA icons, maskable icons).
"""

import math
from PIL import Image, ImageDraw

SRC = "public/branding/tropical-nomads-logo-white.png"
OUT_PUBLIC = "public"
OUT_ICONS = "public/icons"

# Brand palette (matches theme_color / tailwind ozora tokens)
BG_INNER = (11, 94, 84)   # #0b5e54
BG_OUTER = (4, 47, 46)    # #042f2e


def extract_sun(src_path: str) -> Image.Image:
    """Return the sun glyph as a white RGBA image with transparent background."""
    img = Image.open(src_path).convert("L")
    w, h = img.size
    # The sun sits in the top ~half of the square logo. Crop just above the
    # wordmark so the "TROPICAL" lettering doesn't widen the bounding box.
    top = img.crop((0, 0, w, int(h * 0.53)))
    # Bounding box of bright (white) pixels.
    mask = top.point(lambda p: 255 if p > 60 else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise RuntimeError("Could not locate sun glyph in logo")
    glyph = top.crop(bbox)
    # Build a white RGBA where alpha == brightness.
    rgba = Image.new("RGBA", glyph.size, (255, 255, 255, 0))
    rgba.putalpha(glyph)
    return rgba


def radial_bg(size: int) -> Image.Image:
    """Radial gradient background, brighter at center."""
    bg = Image.new("RGB", (size, size))
    px = bg.load()
    cx, cy = size * 0.5, size * 0.42
    max_r = math.hypot(size, size) * 0.62
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / max_r
            d = min(1.0, d)
            r = int(BG_INNER[0] + (BG_OUTER[0] - BG_INNER[0]) * d)
            g = int(BG_INNER[1] + (BG_OUTER[1] - BG_INNER[1]) * d)
            b = int(BG_INNER[2] + (BG_OUTER[2] - BG_INNER[2]) * d)
            px[x, y] = (r, g, b)
    return bg


def rounded_mask(size: int, radius_ratio: float) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(size * radius_ratio)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def compose(sun: Image.Image, size: int, glyph_ratio: float, rounded: bool) -> Image.Image:
    canvas = radial_bg(size).convert("RGBA")
    # Scale the sun glyph to occupy glyph_ratio of the canvas.
    target = int(size * glyph_ratio)
    sw, sh = sun.size
    scale = target / max(sw, sh)
    glyph = sun.resize((max(1, int(sw * scale)), max(1, int(sh * scale))), Image.LANCZOS)
    gx = (size - glyph.width) // 2
    gy = (size - glyph.height) // 2
    canvas.alpha_composite(glyph, (gx, gy))
    if rounded:
        canvas.putalpha(rounded_mask(size, 0.22))
    return canvas


def main() -> None:
    sun = extract_sun(SRC)

    # Standard icons: rounded square, sun fills most of the space.
    for size, path in [
        (16, f"{OUT_PUBLIC}/favicon-16x16.png"),
        (32, f"{OUT_PUBLIC}/favicon-32x32.png"),
        (180, f"{OUT_PUBLIC}/apple-touch-icon.png"),
        (192, f"{OUT_ICONS}/icon-192.png"),
        (512, f"{OUT_ICONS}/icon-512.png"),
    ]:
        compose(sun, size, 0.92, rounded=True).save(path)
        print("wrote", path)

    # Maskable icons: full-bleed background, glyph kept within the safe zone
    # (Android masks ~10% on each edge), but still using most of it.
    for size, path in [
        (192, f"{OUT_ICONS}/maskable-192.png"),
        (512, f"{OUT_ICONS}/maskable-512.png"),
    ]:
        compose(sun, size, 0.78, rounded=False).save(path)
        print("wrote", path)

    # Multi-resolution .ico for legacy/browser tab fallback.
    ico = compose(sun, 64, 0.92, rounded=True)
    ico.save(f"{OUT_PUBLIC}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("wrote", f"{OUT_PUBLIC}/favicon.ico")


if __name__ == "__main__":
    main()
