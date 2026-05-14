// tests/phaser/scale.test.js
//
// Phase 5 W0 — RED scaffold para integer zoom formula (PHA-03).
//
// Cobertura (3 tests):
//   T1: BASE_W = 480 (resolución virtual horizontal)
//   T2: BASE_H = 270 (resolución virtual vertical) — 16:9 ratio
//   T3: computeZoom() usa Math.min + Math.floor + `|| 1` defensive (vw/vh=0 safety)
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

describe('phaser scale formula (PHA-03) — RED W0 → verde W2', () => {
  it('T1: BASE_W = 480 declarado (resolución virtual horizontal)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_W = 480` (CLAUDE.md §1 resolución virtual). W2 crea este archivo.'
    ).toMatch(/BASE_W\s*=\s*480/)
  })

  it('T2: BASE_H = 270 declarado (resolución virtual vertical, 16:9)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_H = 270` (CLAUDE.md §1 resolución virtual 16:9). W2 crea este archivo.'
    ).toMatch(/BASE_H\s*=\s*270/)
  })

  it('T3: computeZoom() usa Math.min + Math.floor + `|| 1` defensive fallback', () => {
    expect(
      src,
      'computeZoom() debe usar `Math.min(Math.floor(vw/BASE_W), Math.floor(vh/BASE_H)) || 1` ' +
        'para integer zoom con fallback defensive (vw/vh=0 → zoom 1). W2 crea este archivo.'
    ).toMatch(/Math\.min[\s\S]*Math\.floor[\s\S]*\|\|\s*1/)
  })
})
