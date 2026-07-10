// tests/phaser/scale.test.js
//
// Phase 5 W0 — RED scaffold para zoom formula (PHA-03).
//
// Cobertura (3 tests):
//   T1: BASE_W = 960 (resolución virtual hi-bit horizontal — HI-BIT-01 2026-07-09b)
//   T2: BASE_H = 540 (resolución virtual hi-bit vertical — 16:9 ratio)
//   T3: computeZoom() usa Math.max(1, vw/BASE_W, vh/BASE_H) — zoom COVER fraccional
//
// CAMBIO de contrato 2026-07-09b (HI-BIT-01):
//   Antes: BASE_W=480, BASE_H=270, formula Math.min(Math.floor,...) || 1 (PHA-03 integer).
//   Ahora: BASE_W=960, BASE_H=540, formula Math.max(1, Math.min(...)) sin Math.floor.
//   Razón: con arte a doble densidad el zoom fraccional fill ya no produce blur perceptible.
//   PHA-03 integer-zoom mandate superseded por mandato hi-bit de Rafael 2026-07-09b.
//
// CAMBIO 2026-07-10 (COVER-01 — fix pillarbox ch6):
//   Antes: formula CONTAIN Math.max(1, Math.min(vw/BASE_W, vh/BASE_H)) — el lado menor mandaba,
//     dejando pillarbox strips en viewports no 16:9 (ej. 1920×911: 151px por lado), por las
//     cuales asomaba el bg CSS duplicado (ch6-bg.webp vía BackgroundLayers) → "fondo roto".
//   Ahora: formula COVER Math.max(1, vw/BASE_W, vh/BASE_H) — el ratio MAYOR manda.
//     El canvas llena el viewport completamente; el exceso se recorta (overflow:hidden en host).
//     Anclaje bottom en CSS + applyCanvasAnchor() en Chapter6Content.vue clip cielo, no héroes.
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

  it('T3: computeZoom() usa Math.max(1, vw/BASE_W, vh/BASE_H) — zoom COVER (COVER-01 2026-07-10)', () => {
    // COVER-01 2026-07-10: fórmula cambiada de CONTAIN (Math.min) a COVER (Math.max 3-args).
    // Motivo: Math.min (contain) dejaba pillarbox strips en viewports no 16:9, por las cuales
    // asomaba el bg CSS duplicado de ch6-bg.webp — "escena cortada con fondo roto".
    // Math.max(1, vw/BASE_W, vh/BASE_H): el ratio MAYOR manda; canvas >= viewport en ambas dim.
    // El exceso se recorta via overflow:hidden + bottom-anchor (applyCanvasAnchor en Vue).
    expect(
      src,
      'computeZoom() debe usar COVER: Math.max(1, vw/BASE_W, vh/BASE_H). ' +
        'CONTAIN (Math.min) producia pillarbox con bg duplicado (COVER-01). W2 crea este archivo.'
    ).toMatch(/Math\.max\s*\(\s*1,\s*vw\s*\/\s*BASE_W/)
    // Anti-pattern guard: no debe haber Math.min en la fórmula de computeZoom (sería contain).
    expect(
      src,
      'computeZoom() NO debe usar Math.min (eso sería CONTAIN que produce pillarbox).'
    ).not.toMatch(/Math\.max\s*\(\s*1[\s\S]{0,20}Math\.min/)
  })
})
