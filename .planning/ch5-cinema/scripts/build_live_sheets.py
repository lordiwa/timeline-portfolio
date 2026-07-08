#!/usr/bin/env python3
"""Combine rotation (8 dir) + festejo (ff) into ONE lossless WebP strip per character,
so the crowd render never swaps background-image (kills the first-festejo blink) and the
assets are lighter. Frame layout: [rot0..rot7][fest0..fest_{ff-1}], all rw x rh.

Outputs:
  public/assets/ch5-cinema/live/{slug}.webp
  src/data/ch5CrowdManifest.json : slug -> {w, h, ff, festStart}  (festStart = 8)

Requires rot/{slug}.png (8 frames) and anim/{slug}.png (ff frames) with matching frame size.
"""
import os, glob, json
from PIL import Image

ROOT = r"D:\timeline-portfolio\public\assets\ch5-cinema"
ROT = os.path.join(ROOT, "rot")
ANIM = os.path.join(ROOT, "anim")
LIVE = os.path.join(ROOT, "live")
OUT = r"D:\timeline-portfolio\src\data\ch5CrowdManifest.json"
os.makedirs(LIVE, exist_ok=True)

manifest = {}
warnings = []
for rp in sorted(glob.glob(os.path.join(ROT, "*.png"))):
    slug = os.path.splitext(os.path.basename(rp))[0]
    ap = os.path.join(ANIM, f"{slug}.png")
    if not os.path.exists(ap):
        warnings.append(f"{slug}: no festejo sheet"); continue
    rot = Image.open(rp).convert("RGBA")
    anim = Image.open(ap).convert("RGBA")
    rw, rh = rot.width // 8, rot.height
    ff = round(anim.width / anim.height)
    fw, fh = anim.width // ff, anim.height
    if (rw, rh) != (fw, fh):
        warnings.append(f"{slug}: size mismatch rot {rw}x{rh} vs fest {fw}x{fh}"); continue
    total = 8 + ff
    strip = Image.new("RGBA", (rw * total, rh), (0, 0, 0, 0))
    for i in range(8):
        strip.paste(rot.crop((i * rw, 0, (i + 1) * rw, rh)), (i * rw, 0))
    for j in range(ff):
        strip.paste(anim.crop((j * fw, 0, (j + 1) * fw, fh)), ((8 + j) * rw, 0))
    strip.save(os.path.join(LIVE, f"{slug}.webp"), "WEBP", lossless=True, quality=100, method=6)
    manifest[slug] = {"w": rw, "h": rh, "ff": ff, "festStart": 8}

with open(OUT, "w") as f:
    json.dump(manifest, f, indent=0, sort_keys=True)

print(f"wrote {len(manifest)} live sheets + manifest -> {OUT}")
if warnings:
    print("WARNINGS:")
    for w in warnings:
        print("  ", w)
