#!/usr/bin/env python3
"""Scan public/assets/ch5-cinema/anim/*.png and emit a slug->{fw,frames} manifest.
Frames are square strips: frames = round(width/height), fw = height.
Warns if width is not close to an integer multiple of height.
Writes src/data/ch5AnimManifest.json.
"""
import os, json, glob
from PIL import Image

ANIM = r"D:\timeline-portfolio\public\assets\ch5-cinema\anim"
OUT = r"D:\timeline-portfolio\src\data\ch5AnimManifest.json"

manifest = {}
warnings = []
for path in sorted(glob.glob(os.path.join(ANIM, "*.png"))):
    slug = os.path.splitext(os.path.basename(path))[0]
    with Image.open(path) as im:
        w, h = im.size
    frames = round(w / h)
    ratio = w / h
    if abs(ratio - frames) > 0.05:
        warnings.append(f"{slug}: w/h={ratio:.3f} not ~integer (w={w} h={h})")
    fw = round(w / frames)
    manifest[slug] = {"fw": fw, "fh": h, "frames": frames}

with open(OUT, "w") as f:
    json.dump(manifest, f, indent=0, sort_keys=True)

print(f"wrote {len(manifest)} entries to {OUT}")
if warnings:
    print("WARNINGS:")
    for wn in warnings:
        print(" ", wn)
else:
    print("all sheets are clean integer strips")
