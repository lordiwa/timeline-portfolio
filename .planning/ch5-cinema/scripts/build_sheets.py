#!/usr/bin/env python3
"""Build horizontal celebration spritesheets from pixellab character zips.
Usage: build_sheets.py slug=id slug=id ...
For each: download zip, extract animations/festejo/north/frame_*.png (sorted),
compose a horizontal strip, save to public/assets/ch5-cinema/anim/{slug}.png.
Prints one line per slug: slug<TAB>nframes<TAB>frameW<TAB>frameH  (or slug<TAB>FAIL<TAB>reason)
"""
import sys, os, io, zipfile, urllib.request
from PIL import Image

DEST = r"D:\timeline-portfolio\public\assets\ch5-cinema\anim"
os.makedirs(DEST, exist_ok=True)
DL = "https://api.pixellab.ai/mcp/characters/{}/download"

for pair in sys.argv[1:]:
    slug, _, cid = pair.partition("=")
    try:
        data = urllib.request.urlopen(DL.format(cid), timeout=60).read()
        zf = zipfile.ZipFile(io.BytesIO(data))
        names = sorted(n for n in zf.namelist()
                       if "/animations/festejo/north/" in n and n.endswith(".png"))
        if not names:
            print(f"{slug}\tFAIL\tno-anim-frames"); continue
        frames = [Image.open(io.BytesIO(zf.read(n))).convert("RGBA") for n in names]
        w, h = frames[0].size
        sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
        for i, fr in enumerate(frames):
            sheet.paste(fr, (i * w, 0))
        sheet.save(os.path.join(DEST, f"{slug}.png"))
        print(f"{slug}\t{len(frames)}\t{w}\t{h}")
    except Exception as e:
        print(f"{slug}\tFAIL\t{type(e).__name__}:{e}")
