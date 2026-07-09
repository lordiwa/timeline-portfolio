# build_ch6_bg.py — v2 HI-BIT (2026-07-09b): compone los fondos ch6 a 960×540.
#
# Rafael: "los artes de 2026 siguen pixelados... quiero 10 de poder". Causa raíz:
# la resolución virtual 480×270 × zoom 3 pintaba cada pixel de juego en 3 de
# pantalla con fondos de 480 de ancho. v2 dobla la densidad: mundo 960×540,
# fondos derivados de una base nano-banana nativa (1376×768) con grano fino,
# BOX-downscale a 960×540. Los sprites chunky (robot/planetas) van con
# setScale(2) en escena — estilo "hi-bit" (Eastward/Owlboy: chars pixel +
# fondos ricos).
#
# Fuente base: ch6-bg-hires-raw.png en el scratchpad (argv[1] = dir scratchpad).
# Genera:
#   ch6-bg.png               960x540   opaco — postal base (compat key legacy)
#   ch6-bg-tall.png          960x1890  opaco — extensión espacio profundo (1350px)
#                                      + postal abajo (viewport final del arrival)
#   ch6-bg-stars-far-t.png   960x1080  RGBA — starfield procedural fino, mosaico
#   ch6-bg-nebulae-mid-t.png 960x1620  RGBA — jirones de nebulosa del base, mosaico
import os
import sys
import random
from PIL import Image

ASSETS = r"D:\timeline-portfolio\public\assets"
SCRATCH = sys.argv[1] if len(sys.argv) > 1 else (
    r"C:\Users\srpar\AppData\Local\Temp\claude\D--timeline-portfolio"
    r"\dda63477-e69c-4834-83e8-6b559df332e0\scratchpad"
)

W, H = 960, 540
EXT_H = 1350         # extensión arriba (CAMERA_FINAL_Y v2 = 1350)
TALL_H = EXT_H + H   # 1890

rng = random.Random(0xC6B6)

# ── 0. base 960×540 desde el raw nativo ──────────────────────────────────────
raw = Image.open(f"{SCRATCH}/ch6-bg-hires-raw.png").convert("RGB")
bg = raw.resize((W, H), Image.BOX)
bg.save(f"{ASSETS}/ch6-bg.png", optimize=True)

# ── 1. ch6-bg-tall ───────────────────────────────────────────────────────────
def row_avg(img, y):
    p = img.load()
    r = g = b = 0
    for x in range(W):
        c = p[x, y]; r += c[0]; g += c[1]; b += c[2]
    return (r // W, g // W, b // W)

join = tuple(sum(row_avg(bg, y)[i] for y in range(3)) // 3 for i in range(3))
top = (8, 6, 22)  # casi-negro púrpura (espacio profundo)

tall = Image.new("RGB", (W, TALL_H))
tp = tall.load()
for y in range(EXT_H):
    t = y / (EXT_H - 1)
    t = t * t * (3 - 2 * t)  # smoothstep
    c = tuple(round(top[i] + (join[i] - top[i]) * t) for i in range(3))
    for x in range(W):
        tp[x, y] = c
tall.paste(bg, (0, EXT_H))

# estrellas finas sobre la extensión (densidad ×2 vs v1 por el doble de área)
COLORS = [((244, 248, 255), 40), ((174, 242, 255), 30), ((255, 217, 160), 20), ((255, 154, 213), 10)]
def pick_color():
    n = rng.randint(1, 100); acc = 0
    for c, w in COLORS:
        acc += w
        if n <= acc: return c
    return COLORS[0][0]

def put(px_target, x, y, c, ymax, dim=1.0):
    if 0 <= x < W and 0 <= y < ymax:
        base = px_target[x, y]
        if len(base) == 3:
            px_target[x, y] = tuple(round(base[i] + (c[i] - base[i]) * dim) for i in range(3))
        else:
            px_target[x, y] = (c[0], c[1], c[2], round(255 * dim))

def sprinkle(px_target, count, ymax, alpha_mode=False):
    for _ in range(count):
        x, y = rng.randint(2, W - 3), rng.randint(2, ymax - 8)
        c = pick_color()
        shape = rng.randint(1, 100)
        if shape <= 62:
            put(px_target, x, y, c, ymax)
        elif shape <= 77:
            for dx in (0, 1):
                for dy in (0, 1):
                    put(px_target, x + dx, y + dy, c, ymax, 0.75)
        elif shape <= 92:
            put(px_target, x, y, c, ymax)
            for d in (-1, 1):
                put(px_target, x + d, y, c, ymax, 0.6); put(px_target, x, y + d, c, ymax, 0.6)
        else:
            put(px_target, x, y, c, ymax)
            for d in (-1, 1):
                put(px_target, x + d, y, c, ymax, 0.8); put(px_target, x, y + d, c, ymax, 0.8)
            for d in (-2, 2):
                put(px_target, x + d, y, c, ymax, 0.35); put(px_target, x, y + d, c, ymax, 0.35)

sprinkle(tp, 700, EXT_H - 4)

# jirones de nebulosa de la base pegados en la extensión (máscara elíptica)
def wisp(src_box, dest_xy, strength):
    patch = bg.crop(src_box).convert("RGB")
    pw, ph = patch.size
    mask = Image.new("L", (pw, ph), 0)
    mp = mask.load()
    cx, cy = pw / 2, ph / 2
    for yy in range(ph):
        for xx in range(pw):
            d = ((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2
            v = max(0.0, 1.0 - d)
            mp[xx, yy] = round(255 * strength * (v ** 1.6))
    tall.paste(patch, dest_xy, mask)

wisp((60, 160, 460, 350), (480, 220), 0.42)
wisp((500, 190, 860, 360), (40, 580), 0.38)
wisp((120, 240, 520, 410), (400, 900), 0.34)
wisp((500, 190, 860, 360), (620, 1110), 0.28)

tall.save(f"{ASSETS}/ch6-bg-tall.png", optimize=True)

# ── 2. starfield parallax procedural (transparente) ──────────────────────────
stars_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sp = stars_layer.load()
sprinkle(sp, 520, H - 4)

def vfade(img, top_f, bottom_f):
    w, h = img.size
    px = img.load()
    for y in range(h):
        f = top_f + (bottom_f - top_f) * (y / (h - 1))
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, round(a * f))
    return img

def mirror_stack(img, copies):
    w, h = img.size
    out = Image.new("RGBA", (w, h * copies))
    flip = img.transpose(Image.FLIP_TOP_BOTTOM)
    for i in range(copies):
        out.paste(img if i % 2 == 0 else flip, (0, i * h))
    return out

stars_t = vfade(mirror_stack(stars_layer, 2), 1.0, 0.55)  # 960x1080
stars_t.save(f"{ASSETS}/ch6-bg-stars-far-t.png", optimize=True)

# ── 3. nebulosas mid (transparente) — extraídas de la banda de la base ───────
def most_common(img):
    return max(img.getcolors(img.size[0] * img.size[1]), key=lambda t: t[0])[1]

def to_alpha(img, boost=6.0, alpha_mul=1.0, floor=0):
    bgc = most_common(img)
    out = Image.new("RGBA", img.size)
    ip, op = img.load(), out.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            c = ip[x, y]
            d = max(abs(c[0] - bgc[0]), abs(c[1] - bgc[1]), abs(c[2] - bgc[2]))
            a = 0 if d < floor else min(255, round((d - floor) * boost * alpha_mul))
            op[x, y] = (c[0], c[1], c[2], a)
    return out

# banda de nebulosa de la base (evita el horizonte cian de abajo).
# floor alto (56): solo los núcleos brillantes rosas pasan — sin el velo turbio
# mauve/oliva que arrastraba floor=34 (QA 2026-07-09b). Además filtro de tono:
# solo píxeles cálidos (r > g) — descarta restos verdosos/oliva de estrellas.
band = bg.crop((0, 90, W, 90 + H // 2)).resize((W, H), Image.BOX)
neb_raw = to_alpha(band, boost=4.0, alpha_mul=0.75, floor=56)
np_ = neb_raw.load()
for y in range(neb_raw.height):
    for x in range(neb_raw.width):
        r, g, b, a = np_[x, y]
        if a and g >= r:
            np_[x, y] = (r, g, b, 0)
neb_t = vfade(mirror_stack(neb_raw, 3), 1.0, 0.18)  # 960x1620
neb_t.save(f"{ASSETS}/ch6-bg-nebulae-mid-t.png", optimize=True)

# ── 4. dieta de peso (horneada en el script — NO como paso manual) ───────────
# bg/tall: paleta adaptativa 256 con dither. nebulosas: posterize 4bit + poda
# de alpha débil. Presupuesto test: ch6-bg ≤300KB (tests/assets/ch6-assets T4).
for name in ("ch6-bg.png", "ch6-bg-tall.png"):
    im = Image.open(f"{ASSETS}/{name}").convert("RGB")
    im.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(
        f"{ASSETS}/{name}", optimize=True)

neb_img = Image.open(f"{ASSETS}/ch6-bg-nebulae-mid-t.png")
np2 = neb_img.load()
for y in range(neb_img.height):
    for x in range(neb_img.width):
        r, g, b, a = np2[x, y]
        if a < 24:
            np2[x, y] = (0, 0, 0, 0)
        else:
            np2[x, y] = (r >> 4 << 4, g >> 4 << 4, b >> 4 << 4, a >> 4 << 4)
neb_img.save(f"{ASSETS}/ch6-bg-nebulae-mid-t.png", optimize=True)

for f in ["ch6-bg.png", "ch6-bg-tall.png", "ch6-bg-stars-far-t.png", "ch6-bg-nebulae-mid-t.png"]:
    p = f"{ASSETS}/{f}"
    im = Image.open(p)
    print(f, im.size, im.mode, os.path.getsize(p) // 1024, "KB")
