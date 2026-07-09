// tests/phaser/factory.test.js
//
// Phase 5 W0 — RED scaffold para src/phaser/index.js factory (verde tras W2).
//
// Cobertura PHA-01..03 (config shape via source-regex):
//   T1: Phaser.Scale.NONE presente
//   T2: Math.floor zoom integer formula
//   T3: pixelArt: true
//   T4: roundPixels: true
//   T5: physics: { default: 'none' } (bundle saving + anti-pattern guard)
//   T6: parent: parentEl (DOM node, NOT string id — race-condition guard)
//
// Analog: tests/styles/themes-file.test.js (readFileSync + regex matchAll).
// Source-of-truth: 05-RESEARCH.md §Pattern 1 (lines 354-396) + §Pattern 3 (lines 558-580).
// RED scaffold W0 — verde tras W2 crea src/phaser/index.js.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FACTORY_PATH = resolve(process.cwd(), 'src/phaser/index.js')

let src = ''
try {
  src = readFileSync(FACTORY_PATH, 'utf8')
} catch (_) {
  src = ''
}

describe('phaser factory (PHA-01..03) — RED W0 → verde W2', () => {
  it('T1: Phaser.Scale.NONE presente — PHA-03 integer-pixel scale mandate', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `Phaser.Scale.NONE` en config.scale.mode. ' +
        'W2 crea este archivo.'
    ).toMatch(/Phaser\.Scale\.NONE/)
  })

  it('T2: zoom fraccional hi-bit — Math.max(1, Math.min(...)) sin Math.floor (HI-BIT-01 2026-07-09b)', () => {
    // PHA-03 integer-zoom superseded: con arte a doble densidad el zoom fraccional
    // ya no produce blur perceptible. La fórmula pasa de Math.floor a Math.max/Math.min.
    expect(
      src,
      'computeZoom() debe usar Math.max(1, Math.min(vw/BASE_W, vh/BASE_H)) — zoom fraccional fill (HI-BIT-01). W2 crea este archivo.'
    ).toMatch(/Math\.max\s*\(\s*1[\s\S]*Math\.min/)
  })

  it('T3: pixelArt: true presente — PHA-03 pixel-art rendering', () => {
    expect(
      src,
      'config debe declarar pixelArt: true (sharp scaling sin antialias). W2 crea este archivo.'
    ).toMatch(/pixelArt:\s*true/)
  })

  it('T4: roundPixels: true presente — PHA-03 sub-pixel anti-blur', () => {
    expect(
      src,
      'config debe declarar roundPixels: true. W2 crea este archivo.'
    ).toMatch(/roundPixels:\s*true/)
  })

  it('T5: physics default none — anti-pattern guard (bundle saving ~30KB)', () => {
    expect(
      src,
      'config debe declarar `physics: { default: \'none\' }` para tree-shake Phaser physics. W2 crea este archivo.'
    ).toMatch(/physics:\s*\{\s*default:\s*['"]none['"]/)
  })

  it('T6: parent: parentEl (DOM node, NOT string id) — race-condition guard', () => {
    expect(
      src,
      'config debe usar `parent: parentEl` (referencia DOM node directa). ' +
        'Pasar string id permite race-condition de mount antes de DOM ready. W2 crea este archivo.'
    ).toMatch(/parent:\s*parentEl/)
  })
})
