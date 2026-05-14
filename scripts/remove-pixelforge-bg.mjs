#!/usr/bin/env node
// Helper temporal Phase 4 W0: bg removal flood-fill desde corners para PNGs
// generados por pixelforge cuando su auto-removal no es suficiente.
// Uso: node scripts/remove-pixelforge-bg.mjs <path/to/image.png>
import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePNG(buf) {
  let pos = 8;
  const idat = [];
  let w, h;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    if (type === 'IHDR') { w = buf.readUInt32BE(pos + 8); h = buf.readUInt32BE(pos + 12); }
    if (type === 'IDAT') idat.push(buf.slice(pos + 8, pos + 8 + len));
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = w * bpp;
  const rgba = Buffer.alloc(w * h * bpp);
  let sp = 0;
  for (let row = 0; row < h; row++) {
    const f = inflated[sp++];
    const ds = row * stride;
    for (let c = 0; c < stride; c++) {
      const x = inflated[sp++];
      const l = c >= bpp ? rgba[ds + c - bpp] : 0;
      const u = row > 0 ? rgba[ds - stride + c] : 0;
      const ul = row > 0 && c >= bpp ? rgba[ds - stride + c - bpp] : 0;
      let r;
      switch (f) {
        case 0: r = x; break;
        case 1: r = (x + l) & 255; break;
        case 2: r = (x + u) & 255; break;
        case 3: r = (x + Math.floor((l + u) / 2)) & 255; break;
        case 4: {
          const p = l + u - ul;
          const pa = Math.abs(p - l), pb = Math.abs(p - u), pc = Math.abs(p - ul);
          const pred = pa <= pb && pa <= pc ? l : pb <= pc ? u : ul;
          r = (x + pred) & 255;
          break;
        }
        default: r = x;
      }
      rgba[ds + c] = r;
    }
  }
  return { w, h, rgba };
}

function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = w * 4;
  const filtered = Buffer.alloc(h * (stride + 1));
  for (let row = 0; row < h; row++) {
    filtered[row * (stride + 1)] = 0;
    rgba.copy(filtered, row * (stride + 1) + 1, row * stride, row * stride + stride);
  }
  const compressed = zlib.deflateSync(filtered);
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crcInput = Buffer.concat([t, data]);
    let crc = 0xFFFFFFFF;
    const tbl = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tbl[i] = c;
    }
    for (const b of crcInput) crc = tbl[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const cb = Buffer.alloc(4);
    cb.writeUInt32BE(crc, 0);
    return Buffer.concat([len, t, data, cb]);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const path = process.argv[2];
if (!path) {
  console.error('Uso: node scripts/remove-pixelforge-bg.mjs <path/to/image.png>');
  process.exit(1);
}

const img = decodePNG(fs.readFileSync(path));
const { w, h, rgba } = img;

// Detect bg from corners
const samples = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
let bgR = 0, bgG = 0, bgB = 0;
for (const [x, y] of samples) {
  const i = (y * w + x) * 4;
  bgR += rgba[i]; bgG += rgba[i + 1]; bgB += rgba[i + 2];
}
bgR = Math.round(bgR / 4); bgG = Math.round(bgG / 4); bgB = Math.round(bgB / 4);
const bgIsBluish = bgB > bgR && bgB > bgG * 0.80;

// Flood fill from corners
const visited = new Uint8Array(w * h);
const stack = [];
for (const [x, y] of samples) stack.push(x + y * w);
let removed = 0;
while (stack.length) {
  const idx = stack.pop();
  if (visited[idx]) continue;
  visited[idx] = 1;
  const px = idx % w, py = (idx - px) / w;
  const o = idx * 4;
  const r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
  // Bg condition: matches detected bg color tone (allow gradient tolerance)
  const isBg = bgIsBluish
    ? (b > r - 5) && (b >= g * 0.80) && (b > 50) && (r < 200)
    : Math.abs(r - bgR) < 60 && Math.abs(g - bgG) < 60 && Math.abs(b - bgB) < 60;
  if (!isBg) continue;
  rgba[o + 3] = 0;
  removed++;
  if (px > 0) stack.push(idx - 1);
  if (px < w - 1) stack.push(idx + 1);
  if (py > 0) stack.push(idx - w);
  if (py < h - 1) stack.push(idx + w);
}

fs.writeFileSync(path, encodePNG(w, h, rgba));

let opaque = 0, trans = 0, semi = 0;
for (let i = 3; i < rgba.length; i += 4) {
  if (rgba[i] === 255) opaque++;
  else if (rgba[i] === 0) trans++;
  else semi++;
}
console.log(`${path}: bg=(${bgR},${bgG},${bgB}) removed=${removed} → opaque=${opaque} trans=${trans} semi=${semi}`);
