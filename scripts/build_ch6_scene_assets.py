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
# ÷2 nearest (hi-bit 2026-07-09b: mundo 960 — mismo tamaño relativo, doble detalle)
st = st.resize((st.width // 2, st.height // 2), Image.NEAREST)
st.save(f"{ASSETS}/ch6-structures-t.png", optimize=True)

# ── 4. plataforma-mirador procedural 480x72 (v2 2026-07-09b) ─────────────────
# v1 (56px) era una franja plana con el borde neon justo bajo los pies — los
# personajes "flotaban" (feedback Rafael). v2 da SUELO legible: banda de
# superficie (los pies pisan DENTRO de ella), labio neon por debajo, fascia
# con paneles y 2 pilares de soporte. Barandilla lejana escasa arriba.
import random
rng = random.Random(0xA6E7)
# hi-bit 2026-07-09b: mundo 960×540 — plataforma a 960×144 (1px aquí = 1px
# de mundo fino; misma proporción visual que la v2 de 480, doble densidad).
PW, PH = 960, 144
RAIL_H = 16          # barandilla lejana (transparente entre postes)
FLOOR_TOP = RAIL_H   # borde superior del suelo (highlight)
LIP_Y = 40           # labio neon frontal (BAJO la banda de suelo)
plat = Image.new("RGBA", (PW, PH), (0, 0, 0, 0))
pp = plat.load()
FLOOR_A = (52, 40, 96)    # superficie iluminada por el horizonte
FLOOR_B = (38, 29, 74)
FASCIA_A = (22, 16, 48)
FASCIA_B = (10, 8, 26)
HILITE = (120, 104, 176)
CYAN = (77, 255, 255)
MAGENTA = (255, 60, 166)
# barandilla lejana: postes finos cada 192px + pasamanos tenue
for bx in range(48, PW, 192):
    for yy in range(0, RAIL_H):
        pp[bx, yy] = (46, 36, 90, 255)
    pp[bx, 0] = (*CYAN, 255)
for x in range(PW):
    if pp[x, 2][3] == 0:
        pp[x, 2] = (44, 34, 84, 200)
# banda de suelo (superficie caminable)
for y in range(FLOOR_TOP, LIP_Y):
    t = (y - FLOOR_TOP) / (LIP_Y - FLOOR_TOP - 1)
    c = tuple(round(FLOOR_A[i] + (FLOOR_B[i] - FLOOR_A[i]) * t) for i in range(3))
    for x in range(PW):
        pp[x, y] = (*c, 255)
for x in range(PW):
    pp[x, FLOOR_TOP] = (*HILITE, 255)           # borde superior highlight
# juntas del suelo (perspectiva sutil: verticales cada 96px)
for jx in range(24, PW, 96):
    for yy in range(FLOOR_TOP + 1, LIP_Y):
        r, g, b, a = pp[jx, yy]
        pp[jx, yy] = (max(0, r - 14), max(0, g - 11), max(0, b - 16), a)
# labio neon frontal
for x in range(PW):
    pp[x, LIP_Y] = (*CYAN, 255)
    pp[x, LIP_Y + 1] = (
        (CYAN[0] + FASCIA_A[0]) // 2, (CYAN[1] + FASCIA_A[1]) // 2,
        (CYAN[2] + FASCIA_A[2]) // 2, 255)
# fascia frontal con gradiente + paneles
for y in range(LIP_Y + 2, PH):
    t = (y - LIP_Y - 2) / (PH - LIP_Y - 3)
    c = tuple(round(FASCIA_A[i] + (FASCIA_B[i] - FASCIA_A[i]) * t) for i in range(3))
    for x in range(PW):
        pp[x, y] = (*c, 255)
for jx in range(0, PW, 120):
    for yy in range(LIP_Y + 2, PH):
        r, g, b, a = pp[jx, yy]
        pp[jx, yy] = (max(0, r - 8), max(0, g - 6), max(0, b - 10), a)
# 2 pilares de soporte que ensanchan hacia abajo (anclan la plataforma al frame)
for cx in (240, 720):
    for yy in range(LIP_Y + 2, PH):
        w = 20 + round((yy - LIP_Y) * 0.5)
        for xx in range(max(0, cx - w), min(PW, cx + w)):
            r, g, b, a = pp[xx, yy]
            pp[xx, yy] = (min(255, r + 10), min(255, g + 8), min(255, b + 14), a)
        # aristas del pilar
        for edge in (cx - w, cx + w - 1):
            if 0 <= edge < PW:
                pp[edge, yy] = (HILITE[0] // 2, HILITE[1] // 2, HILITE[2] // 2, 255)
# LEDs de estado en la fascia
for _ in range(44):
    lx, ly = rng.randint(4, PW - 5), rng.randint(LIP_Y + 5, PH - 4)
    pp[lx, ly] = (*(CYAN if rng.random() < 0.5 else MAGENTA), 255)
plat.save(f"{ASSETS}/ch6-platform.png", optimize=True)

for f in ["ch6-robot.png", "ch6-rafael.png", "ch6-drone-a.png", "ch6-drone-b.png",
          "ch6-structures-t.png", "ch6-platform.png"]:
    p = f"{ASSETS}/{f}"
    im = Image.open(p)
    print(f, im.size, im.mode, os.path.getsize(p) // 1024, "KB")
