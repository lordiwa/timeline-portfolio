# -*- coding: utf-8 -*-
"""ch3-window.png — marco procedural de browser Y2K MUERTO (1376x768 RGBA).
La UI es el edificio destruido: title bar colgando, scrollbar quebrada,
bordes mordidos, grietas, rim ambar en los cantos rotos. Centro transparente.
Lenguaje visual = capas ch3 (silueta ciruela + rim #de8a4a)."""
from PIL import Image, ImageDraw
import random

random.seed(20130409)  # el dia que Flash "murio" (iPad era); determinista

W, H = 1376, 768
BASE   = (26, 20, 32, 255)     # ciruela casi negro (= ch3-path)
PANEL  = (42, 33, 54, 255)     # paneles internos
DETAIL = (58, 43, 66, 255)     # bordes de widgets
DEAD   = (74, 56, 80, 255)     # glifos muertos
SHADOW = (13, 10, 20, 255)
AMBER  = (222, 138, 74, 255)

TB_H   = 62    # title bar
LB_W   = 22    # borde izquierdo
SB_W   = 34    # scrollbar derecha
ST_H   = 26    # status bar

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# ── piezas base del chrome ────────────────────────────────────────────────
# title bar en dos piezas: izquierda recta (68%) + derecha colgando (rotada)
tb_split = int(W * 0.66)
d.rectangle([0, 0, tb_split, TB_H], fill=BASE)
# address bar hundida en la pieza izquierda
d.rectangle([120, 16, tb_split - 40, 44], fill=SHADOW, outline=DETAIL, width=2)
d.rectangle([128, 22, 420, 38], fill=PANEL)  # resto de "texto" de url muerto
# icono ventana izquierdo
d.rectangle([18, 14, 58, 48], fill=PANEL, outline=DETAIL, width=2)
d.line([26, 40, 50, 22], fill=DEAD, width=3)

# pieza derecha del title bar, colgando 5 grados
piece_w = W - tb_split
piece = Image.new('RGBA', (piece_w, TB_H + 40), (0, 0, 0, 0))
pd = ImageDraw.Draw(piece)
pd.rectangle([0, 0, piece_w - 1, TB_H], fill=BASE)
# botones min/max/close muertos (el close, agrietado)
bx = piece_w - 150
for i, glyph in enumerate(('_', 'o', 'x')):
    x0 = bx + i * 46
    pd.rectangle([x0, 12, x0 + 36, 48], fill=PANEL, outline=DETAIL, width=2)
    if glyph == '_': pd.line([x0 + 8, 40, x0 + 28, 40], fill=DEAD, width=3)
    if glyph == 'o': pd.rectangle([x0 + 9, 21, x0 + 27, 39], outline=DEAD, width=3)
    if glyph == 'x':
        pd.line([x0 + 9, 21, x0 + 27, 39], fill=DEAD, width=3)
        pd.line([x0 + 27, 21, x0 + 9, 39], fill=DEAD, width=3)
        pd.line([x0 + 18, 8, x0 + 24, 52], fill=(0, 0, 0, 0), width=2)  # grieta
piece = piece.rotate(-5, resample=Image.NEAREST, expand=True, center=(0, TB_H // 2))
img.alpha_composite(piece, (tb_split - 4, -6))
d = ImageDraw.Draw(img)

# borde izquierdo / scrollbar derecha / status bar
d.rectangle([0, 0, LB_W, H], fill=BASE)
d.rectangle([W - SB_W, TB_H - 10, W, H], fill=BASE)
d.rectangle([W - SB_W + 7, 120, W - 7, 260], fill=PANEL, outline=DETAIL, width=2)  # thumb
for ay in (86, H - 90):  # flechas muertas
    d.rectangle([W - SB_W + 5, ay, W - 5, ay + 26], fill=PANEL)
d.rectangle([0, H - ST_H, W, H], fill=BASE)
for sx in (280, 620, 980):
    d.line([sx, H - ST_H + 5, sx, H - 5], fill=DETAIL, width=2)
d.rectangle([16, H - ST_H + 7, 200, H - 8], fill=PANEL)  # "Listo" muerto

# ── destruccion: mordidas transparentes en los cantos internos ────────────
def bite(cx, cy, r, points=7):
    pts = []
    for i in range(points):
        ang = 6.283 * i / points
        rr = r * random.uniform(0.5, 1.15)
        pts.append((cx + rr * __import__('math').cos(ang), cy + rr * __import__('math').sin(ang)))
    d.polygon(pts, fill=(0, 0, 0, 0))

for bx_, by_, br_ in [
    (tb_split - 180, TB_H + 4, 34), (300, TB_H + 2, 26), (760, TB_H + 6, 30),
    (LB_W + 2, 300, 24), (LB_W + 4, 520, 30), (LB_W, 160, 18),
    (W - SB_W - 2, 420, 26), (W - SB_W + 2, 610, 22),
    (420, H - ST_H - 2, 28), (900, H - ST_H + 2, 34), (1180, H - ST_H, 22),
    (60, H - ST_H - 4, 20),
]:
    bite(bx_, by_, br_)

# esquina inferior-izquierda demolida (mordida grande)
bite(0, H, 90, points=9)
bite(W, H - 40, 60, points=8)

# ── grietas hacia adentro del marco (lineas sombra) ───────────────────────
def crack(x, y, segs, spread=18):
    pts = [(x, y)]
    for _ in range(segs):
        x += random.randint(-spread, spread); y += random.randint(6, 22)
        pts.append((x, y))
    d.line(pts, fill=SHADOW, width=2)

for cx_ in (180, 540, 1040):
    crack(cx_, 2, 3)
crack(W - SB_W + 10, 300, 4, spread=8)
crack(LB_W - 8, 420, 4, spread=6)

# ── rim ambar en cantos superiores expuestos (mismo pass de las capas) ────
px = img.load()
rim = [(x, y) for y in range(1, H) for x in range(W)
       if px[x, y][3] == 255 and px[x, y - 1][3] == 0]
for x, y in rim:
    px[x, y] = AMBER
    if y + 1 < H and px[x, y + 1][3] == 255:
        r, g, b, _ = px[x, y + 1]
        px[x, y + 1] = ((r + AMBER[0]) // 2, (g + AMBER[1]) // 2, (b + AMBER[2]) // 2, 255)

img.save('D:/timeline-portfolio/public/assets/ch3-window.png')
print('ch3-window.png', img.size)

# mock sobre la escena
scene = Image.open('C:/Users/srpar/AppData/Local/Temp/claude/D--timeline-portfolio/03a4b993-7902-437f-8a08-e08e37331bb6/scratchpad/mock-ch3-marks.png').convert('RGBA')
scene.alpha_composite(img)
scene.convert('RGB').save('C:/Users/srpar/AppData/Local/Temp/claude/D--timeline-portfolio/03a4b993-7902-437f-8a08-e08e37331bb6/scratchpad/mock-ch3-window.png')
print('mock window ok')
