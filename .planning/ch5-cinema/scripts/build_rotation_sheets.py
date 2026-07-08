#!/usr/bin/env python3
"""Build horizontal 8-direction rotation strips from pixellab character zips.
Usage: build_rotation_sheets.py slug=id slug=id ...
For each: download zip, read rotations/{dir}.png in CLOCKWISE order starting north,
compose a horizontal 8-frame strip -> public/assets/ch5-cinema/rot/{slug}.png.
Skips slugs whose sheet already exists. Retries on transient HTTP errors.
Prints one line per slug: slug<TAB>OK<TAB>fw<TAB>fh  |  slug<TAB>SKIP  |  slug<TAB>FAIL<TAB>reason
"""
import sys, os, io, zipfile, urllib.request, time
from PIL import Image

DEST = r"D:\timeline-portfolio\public\assets\ch5-cinema\rot"
os.makedirs(DEST, exist_ok=True)
DL = "https://api.pixellab.ai/mcp/characters/{}/download"
# Clockwise turning order starting from "back to viewer" (north).
ORDER = ["north", "north-east", "east", "south-east",
         "south", "south-west", "west", "north-west"]

def fetch(cid):
    last = None
    for attempt in range(8):
        try:
            return urllib.request.urlopen(DL.format(cid), timeout=90).read()
        except Exception as e:
            last = e
            time.sleep(3 + attempt * 3)  # gentle backoff; 400s here are transient throttling
    raise last

for pair in sys.argv[1:]:
    slug, _, cid = pair.partition("=")
    slug = slug.strip()
    cid = cid.strip()  # tolerate CRLF / stray whitespace from tsv-derived args
    if not slug or not cid:
        continue
    out = os.path.join(DEST, f"{slug}.png")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"{slug}\tSKIP"); sys.stdout.flush(); continue
    try:
        data = fetch(cid)
        zf = zipfile.ZipFile(io.BytesIO(data))
        # map direction -> zip entry (rotations dir, case/name agnostic)
        entries = {}
        for n in zf.namelist():
            if "/rotations/" in n and n.endswith(".png"):
                d = os.path.splitext(os.path.basename(n))[0].lower()
                entries[d] = n
        missing = [d for d in ORDER if d not in entries]
        if missing:
            print(f"{slug}\tFAIL\tmissing:{','.join(missing)}"); sys.stdout.flush(); continue
        frames = [Image.open(io.BytesIO(zf.read(entries[d]))).convert("RGBA") for d in ORDER]
        w, h = frames[0].size
        sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
        for i, fr in enumerate(frames):
            if fr.size != (w, h):
                fr = fr.resize((w, h), Image.NEAREST)
            sheet.paste(fr, (i * w, 0))
        sheet.save(out)
        print(f"{slug}\tOK\t{w}\t{h}"); sys.stdout.flush()
    except Exception as e:
        print(f"{slug}\tFAIL\t{type(e).__name__}:{e}"); sys.stdout.flush()
    time.sleep(1.2)  # space out requests to avoid endpoint throttling (400s)
