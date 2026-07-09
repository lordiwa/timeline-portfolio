// tests/phaser/scale.test.js
//
// Phase 5 W0 — RED scaffold para zoom formula (PHA-03).
//
// Cobertura (3 tests):
//   T1: BASE_W = 960 (resolución virtual hi-bit horizontal — HI-BIT-01 2026-07-09b)
//   T2: BASE_H = 540 (resolución virtual hi-bit vertical — 16:9 ratio)
//   T3: computeZoom() usa Math.max(1, Math.min(vw/BASE_W, vh/BASE_H)) — zoom fraccional fill
//
// CAMBIO de contrato 2026-07-09b (HI-BIT-01):
//   Antes: BASE_W=480, BASE_H=270, formula Math.min(Math.floor,...) || 1 (PHA-03 integer).
//   Ahora: BASE_W=960, BASE_H=540, formula Math.max(1, Math.min(...)) sin Math.floor.
//   Razón: con arte a doble densidad el zoom fraccional fill ya no produce blur perceptible.
//   PHA-03 integer-zoom mandate superseded por mandato hi-bit de Rafael 2026-07-09b.
//
// Source-of-truth: 05-RESEARCH.md §Pattern 1 (computeZoom signature).
// Analog: tests/styles/themes-file.test.js.
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

describe('phaser scale formula (PHA-03 → HI-BIT-01) — RED W0 → verde W2', () => {
  it('T1: BASE_W = 960 declarado (resolución virtual hi-bit horizontal)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_W = 960` (HI-BIT-01: doble densidad 480×2). W2 crea este archivo.'
    ).toMatch(/BASE_W\s*=\s*960/)
  })

  it('T2: BASE_H = 540 declarado (resolución virtual hi-bit vertical, 16:9)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_H = 540` (HI-BIT-01: doble densidad 270×2). W2 crea este archivo.'
    ).toMatch(/BASE_H\s*=\s*540/)
  })

  it('T3: computeZoom() usa Math.max(1, Math.min(...)) — zoom fraccional fill hi-bit', () => {
    expect(
      src,
      'computeZoom() debe usar `Math.max(1, Math.min(vw/BASE_W, vh/BASE_H))` ' +
        'para zoom fraccional fill sin Math.floor (HI-BIT-01). W2 crea este archivo.'
    ).toMatch(/Math\.max\s*\(\s*1[\s\S]*Math\.min/)
  })
})
