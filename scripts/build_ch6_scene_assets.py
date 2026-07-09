# build_ch6_scene_assets.py — procesa los assets de la escena "era agentic" de ch6.
# Fuentes: sprites pixellab (robot/rafael, rotación north = espaldas) + pixelforge
# (drones, megaestructura) descargados al scratchpad de la sesión 2026-07-09.
# Genera en public/assets:
#   ch6-robot.png         — super robot de espaldas, trim nativo (~140px alto)
#   ch6-rafael.png        — Rafael de espaldas, trim nativo (~48px alto)
#   ch6-drone-a.png       — dron agente 24px (variante exploradora)
#   ch6-drone-b.png       — dron obrero con cubo de energía 32px
#   ch6-structures-t.png  — megaestructura orbital en construcción, silueta
#                           oscurecida + luces neon intactas, RGBA, ÷4 nearest
#   ch6-platform.png      — cubierta-mirador procedural 480x56, borde neon cian
import os
import sys
from PIL import Image

ASSETS = r"D:\timeline-portfolio\public\assets"
# El scratchpad es por-sesión: pasarlo como argv[1] si difiere del default.
SCRATCH = sys.argv[1] if len(sys.argv) > 1 else (
    r"C:\Users\srpar\AppData\Local\Temp\claude\D--timeline-portfolio"
    r"\dda63477-e69c-4834-83e8-6b559df332e0\scratchpad"
)

def trim(img, pad=1):
    box = img.getbbox()
    if not box:
        return img
    l, t, r, b = box
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(img.width, r + pad), min(img.height, b + pad)
    return img.crop((l, t, r, b))

# ── 1. héroes (pixellab north) ────────────────────────────────────────────────
robot = trim(Image.open(f"{SCRATCH}/robot-north.png").convert("RGBA"))
robot.save(f"{ASSETS}/ch6-robot.png", optimize=True)

rafael = trim(Image.open(f"{SCRATCH}/rafael-north.png").convert("RGBA"))
rafael.save(f"{ASSETS}/ch6-rafael.png", optimize=True)

# ── 2. drones ────────────────────────────────────────────────────────────────
Image.open(f"{SCRATCH}/ch6-drone-test.png").convert("RGBA").save(
    f"{ASSETS}/ch6-drone-a.png", optimize=True)
Image.open(f"{SCRATCH}/ch6-drone-b.png").convert("RGBA").save(
    f"{ASSETS}/ch6-drone-b.png", optimize=True)

# ── 3. megaestructura — solidificar cuerpo (venía con alpha ~90, se veía
#      lila lavado) y oscurecerlo a silueta violeta; luces cian/magenta a
#      alpha pleno. Clasificación por TONO, no por saturación: el cuerpo es
#      violeta saturado (r~130, g~15, b~195), no sirve el filtro de sat.
DARK = (30, 20, 64)    # sombra violeta profunda
LITE = (76, 56, 122)   # cara iluminada
st = Image.open(f"{SCRATCH}/ch6-structures.png").convert("RGBA")
st = trim(st)
px = st.load()
for y in range(st.height):
    for x in range(st.width):
        r, g, b, a = px[x, y]
        if a < 25:
            px[x, y] = (0, 0, 0, 0)
            continue
        if g > 130 and b > 130 and r < 150:
            px[x, y] = (r, g, b, 255)          # luz cian
        elif r > 190 and g < 130 and b > 140:
            px[x, y] = (r, g, b, 255)          # luz magenta
        else:                                   # cuerpo → silueta sólida
            lum = (r + g + b) / 765.0
            px[x, y] = (
                round(DARK[0] + (LITE[0] - DARK[0]) * lum),
                round(DARK[1] + (LITE[1] - DARK[1]) * lum),
                round(DARK[2] + (LITE[2] - DARK[2]) * lum),
                255,
            )
# ÷4 nearest — pixel art limpio, ~344px de ancho (lejanía)
st = st.resize((st.width // 4, st.height // 4), Image.NEAREST)
st.save(f"{ASSETS}/ch6-structures-t.png", optimize=True)

# ── 4. plataforma-mirador procedural 480x56 ──────────────────────────────────
import random
rng = random.Random(0xA6E7)
PW, PH = 480, 56
RAIL_Y = 10          # y de la barandilla superior (transparente encima)
plat = Image.new("RGBA", (PW, PH), (0, 0, 0, 0))
pp = plat.load()
DECK_TOP = (24, 18, 52)
DECK_BOT = (13, 10, 32)
CYAN = (77, 255, 255)
MAGENTA = (255, 60, 166)
for y in range(RAIL_Y, PH):
    t = (y - RAIL_Y) / (PH - RAIL_Y - 1)
    c = tuple(round(DECK_TOP[i] + (DECK_BOT[i] - DECK_TOP[i]) * t) for i in range(3))
    for x in range(PW):
        pp[x, y] = (*c, 255)
# borde neon cian de la cubierta (rim light del horizonte)
for x in range(PW):
    pp[x, RAIL_Y] = (*CYAN, 255)
    pp[x, RAIL_Y + 1] = (
        (CYAN[0] + DECK_TOP[0]) // 2, (CYAN[1] + DECK_TOP[1]) // 2,
        (CYAN[2] + DECK_TOP[2]) // 2, 255)
# postes de barandilla finos con remate cian (por encima del deck)
for bx in range(8, PW, 32):
    for yy in range(0, RAIL_Y):
        pp[bx, yy] = (46, 34, 88, 255)
    pp[bx, 0] = (*CYAN, 255)
# travesaño superior de la barandilla
for x in range(PW):
    if pp[x, 3][3] == 0:
        pp[x, 3] = (58, 44, 104, 255)
# juntas de paneles verticales sobre el deck
for jx in range(0, PW, 60):
    for yy in range(RAIL_Y + 2, PH):
        r, g, b, a = pp[jx, yy]
        pp[jx, yy] = (max(0, r - 8), max(0, g - 6), max(0, b - 10), a)
# LEDs de estado magenta/cian dispersos en la cubierta
for _ in range(26):
    lx, ly = rng.randint(4, PW - 5), rng.randint(RAIL_Y + 6, PH - 4)
    pp[lx, ly] = (*(CYAN if rng.random() < 0.5 else MAGENTA), 255)
plat.save(f"{ASSETS}/ch6-platform.png", optimize=True)

for f in ["ch6-robot.png", "ch6-rafael.png", "ch6-drone-a.png", "ch6-drone-b.png",
          "ch6-structures-t.png", "ch6-platform.png"]:
    p = f"{ASSETS}/{f}"
    im = Image.open(p)
    print(f, im.size, im.mode, os.path.getsize(p) // 1024, "KB")
