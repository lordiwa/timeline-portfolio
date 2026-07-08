#!/usr/bin/env python3
"""Combined crowd manifest for ch5: festejo (anim/) + rotation (rot/) sheets.
Emits src/data/ch5CrowdManifest.json: slug -> {rw,rh, fw,fh,ff}
  rw,rh = rotation frame size (rot sheet = 8 dir frames, clockwise from north)
  fw,fh = festejo frame size ; ff = festejo frame count
Only includes slugs that have BOTH sheets (so the state machine can use all 6 states).
"""
import os, glob, json
from PIL import Image

ROOT = r"D:\timeline-portfolio\public\assets\ch5-cinema"
ROT = os.path.join(ROOT, "rot")
ANIM = os.path.join(ROOT, "anim")
OUT = r"D:\timeline-portfolio\src\data\ch5CrowdManifest.json"

def strip_dims(path, nframes):
    with Image.open(path) as im:
        w, h = im.size
    return w // nframes, h

manifest = {}
skipped = []
for rp in sorted(glob.glob(os.path.join(ROT, "*.png"))):
    slug = os.path.splitext(os.path.basename(rp))[0]
    ap = os.path.join(ANIM, f"{slug}.png")
    if not os.path.exists(ap):
        skipped.append(slug); continue
    rw, rh = strip_dims(rp, 8)
    with Image.open(ap) as im:
        aw, ah = im.size
    ff = round(aw / ah)
    fw = aw // ff
    manifest[slug] = {"rw": rw, "rh": rh, "fw": fw, "fh": ah, "ff": ff}

with open(OUT, "w") as f:
    json.dump(manifest, f, indent=0, sort_keys=True)

print(f"wrote {len(manifest)} entries to {OUT}")
if skipped:
    print(f"skipped {len(skipped)} (rot present but no festejo): {skipped[:8]}")
