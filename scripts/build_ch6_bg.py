# build_ch6_bg.py — compone los fondos ch6 a resolución nativa (fix nebulosa borrosa)
# Genera:
#   ch6-bg-tall.png          480x945  opaco — extensión espacio profundo (675px) +
#                                           ch6-bg.png verbatim abajo (viewport final del arrival)
#   ch6-bg-stars-far-t.png   480x540  RGBA  — starfield transparente, mosaico espejado
#   ch6-bg-nebulae-mid-t.png 480x810  RGBA  — nebulosas chunky transparentes, mosaico espejado
import random
from PIL import Image

ASSETS = r"D:\timeline-portfolio\public\assets"
W, H = 480, 270
EXT_H = 675          # extensión arriba del original — el viewport final del
                     # arrival (CAMERA_FINAL_Y..+270 = 675..945) muestra el
                     # original COMPLETO, incluido el glow cian del horizonte
TALL_H = EXT_H + H   # 1080

rng = random.Random(0xC6B6)

bg = Image.open(f"{ASSETS}/ch6-bg.png").convert("RGB")
stars = Image.open(f"{ASSETS}/ch6-bg-stars-far.png").convert("RGB")
neb = Image.open(f"{ASSETS}/ch6-bg-nebulae-mid.png").convert("RGB")

# ── 1. ch6-bg-tall ────────────────────────────────────────────────────────────
# color de empalme: promedio de las primeras 3 filas del original
px = bg.load()
def row_avg(img, y):
    p = img.load()
    r = g = b = 0
    for x in range(W):
        c = p[x, y]; r += c[0]; g += c[1]; b += c[2]
    return (r // W, g // W, b // W)

join = tuple(sum(row_avg(bg, y)[i] for y in range(3)) // 3 for i in range(3))
top = (10, 7, 26)  # casi-negro púrpura (espacio profundo)

tall = Image.new("RGB", (W, TALL_H))
tp = tall.load()
for y in range(EXT_H):
    t = y / (EXT_H - 1)
    t = t * t * (3 - 2 * t)  # smoothstep — oscuro arriba, empalme suave abajo
    c = tuple(round(top[i] + (join[i] - top[i]) * t) for i in range(3))
    for x in range(W):
        tp[x, y] = c
tall.paste(bg, (0, EXT_H))

# estrellas estilo original sobre la extensión
COLORS = [((244, 248, 255), 40), ((174, 242, 255), 30), ((255, 217, 160), 20), ((255, 154, 213), 10)]
def pick_color():
    n = rng.randint(1, 100); acc = 0
    for c, w in COLORS:
        acc += w
        if n <= acc: return c
    return COLORS[0][0]

def put(x, y, c, dim=1.0):
    if 0 <= x < W and 0 <= y < EXT_H - 4:
        base = tp[x, y]
        tp[x, y] = tuple(round(base[i] + (c[i] - base[i]) * dim) for i in range(3))

for _ in range(175):
    x, y = rng.randint(2, W - 3), rng.randint(2, EXT_H - 8)
    c = pick_color()
    shape = rng.randint(1, 100)
    if shape <= 60:          # punto 1px
        put(x, y, c)
    elif shape <= 75:        # 2x2 tenue
        for dx in (0, 1):
            for dy in (0, 1):
                put(x + dx, y + dy, c, 0.75)
    elif shape <= 90:        # cruz 3x3
        put(x, y, c)
        for d in (-1, 1):
            put(x + d, y, c, 0.6); put(x, y + d, c, 0.6)
    else:                    # destello 5x5 (diamante)
        put(x, y, c)
        for d in (-1, 1):
            put(x + d, y, c, 0.8); put(x, y + d, c, 0.8)
        for d in (-2, 2):
            put(x + d, y, c, 0.35); put(x, y + d, c, 0.35)

# jirones de nebulosa: parches del original con máscara elíptica, pegados nativos
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

wisp((30, 80, 230, 175), (240, 110), 0.42)
wisp((250, 95, 430, 180), (20, 290), 0.38)
wisp((60, 120, 260, 205), (200, 450), 0.34)
wisp((250, 95, 430, 180), (310, 555), 0.28)

tall.save(f"{ASSETS}/ch6-bg-tall.png", optimize=True)

# ── 2/3. capas transparentes ─────────────────────────────────────────────────
def most_common(img):
    return max(img.getcolors(W * H), key=lambda t: t[0])[1]

def to_alpha(img, boost=6.0, alpha_mul=1.0, floor=0):
    # floor: pixeles con delta < floor se descartan (alpha 0). Sin esto, los
    # halos tenues (RGB casi = bg oscuro) se pintan semi-opacos sobre fondos
    # brillantes y se ven como cajitas oscuras alrededor de cada estrella.
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

def vfade(img, top_f, bottom_f):
    # multiplica el canal alpha con un gradiente vertical top_f -> bottom_f:
    # las capas se desvanecen al acercarse al viewport final (la "postal"
    # original ya trae su propia nebulosa/estrellas — no saturarla).
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

stars_t = vfade(mirror_stack(to_alpha(stars, boost=8.0, floor=26), 2), 1.0, 0.55)  # 480x540
stars_t.save(f"{ASSETS}/ch6-bg-stars-far-t.png", optimize=True)

neb_t = vfade(mirror_stack(to_alpha(neb, boost=6.0, alpha_mul=0.85, floor=10), 3), 1.0, 0.18)  # 480x810
neb_t.save(f"{ASSETS}/ch6-bg-nebulae-mid-t.png", optimize=True)

import os
for f in ["ch6-bg-tall.png", "ch6-bg-stars-far-t.png", "ch6-bg-nebulae-mid-t.png"]:
    p = f"{ASSETS}/{f}"
    im = Image.open(p)
    print(f, im.size, im.mode, os.path.getsize(p) // 1024, "KB")
