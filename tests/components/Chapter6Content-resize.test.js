// tests/components/Chapter6Content-resize.test.js
//
// Phase 5 W0 — RED scaffold para PHA-09 + MOB-03 (ResizeObserver integration).
//
// Cobertura (2 tests):
//   T1: source-regex — Chapter6Content.vue usa `useResizeObserver(document.documentElement, ...)`
//       NO `window` (Pitfall 8 mitigation — window no es un Element para ResizeObserver).
//   T2: source-regex — el callback recalcula newZoom + invoca `game.value.scale.setZoom(...)`
//       sólo si cambia el zoom (evita thrashing).
//
// CAMBIO de contrato 2026-07-09b (HI-BIT-01):
//   Antes: formula Math.min(Math.floor...) || 1; guard `newZoom !== game.value.scale.zoom`.
//   Ahora: formula Math.max(1, Math.min(...)) sin Math.floor; guard Math.abs(...) > 0.01
//   Razón: zoom fraccional fill requiere epsilon comparison (floats); sin Math.floor.
//
// CAMBIO 2026-07-10 (COVER-01):
//   Antes: newZoom = Math.max(1, Math.min(vw/BASE_W, vh/BASE_H)) — CONTAIN.
//   Ahora: newZoom = Math.max(1, vw/BASE_W, vh/BASE_H) — COVER.
//   Razón: CONTAIN dejaba pillarbox que exponía el bg CSS duplicado (ch6-bg.webp).
//   El callback también llama applyCanvasAnchor(newZoom) tras setZoom para mantener
//   el anclaje focal (bottom-anchor + horizontal focal shift en portrait <600px).
//
// Rationale (RESEARCH §Pattern 4):
//   - ResizeObserver requiere un Element, no window. `document.documentElement` es safe.
//   - El callback debe verificar zoom delta antes de setZoom para evitar thrashing.
//
// RED scaffold W0 — verde tras W3 crea Chapter6Content.vue con useResizeObserver.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')

let src = ''
try { src = readFileSync(CH6_PATH, 'utf8') } catch (_) { src = '' }

describe('Chapter6Content.vue ResizeObserver (PHA-09 + MOB-03) — RED W0 → verde W3', () => {
  it('T1: usa useResizeObserver(document.documentElement, ...) (NO window)', () => {
    expect(
      src,
      'Chapter6Content.vue debe llamar `useResizeObserver(document.documentElement, ...)`. ' +
        'Pitfall 8: window no es Element observable. W3 crea este archivo.'
    ).toMatch(/useResizeObserver\s*\(\s*document\.documentElement/)
    // Anti-pattern: useResizeObserver(window, ...)
    expect(
      src.match(/useResizeObserver\s*\(\s*window/),
      'Anti-pattern: useResizeObserver(window, ...) — window no es Element observable.'
    ).toBeNull()
  })

  it('T2: callback recalcula zoom COVER + invoca game.scale.setZoom + applyCanvasAnchor', () => {
    if (src.length === 0) {
      expect(src, 'src/components/Chapter6Content.vue debe existir (W3 lo crea).').not.toBe('')
      return
    }
    // El handler debe contener (COVER-01 2026-07-10):
    //  - cálculo newZoom COVER: Math.max(1, vw/BASE_W, vh/BASE_H) — sin Math.min (eso sería contain)
    //  - comparación epsilon `Math.abs(newZoom - game.value.scale.zoom) > 0.01` (anti-thrash floats)
    //  - llamada `game.value.scale.setZoom(newZoom)` si zoom cambió
    //  - llamada `applyCanvasAnchor(newZoom)` para reposicionar canvas tras resize
    expect(
      src,
      'Callback resize debe declarar `newZoom` con fórmula COVER: Math.max(1, vw/BASE_W ...). ' +
        'CONTAIN (Math.min) producia pillarbox (COVER-01). W3 crea.'
    ).toMatch(/newZoom\s*=\s*Math\.max\s*\(\s*1,\s*window\.innerWidth\s*\/\s*BASE_W/)
    expect(
      src,
      'Callback resize debe comparar `Math.abs(newZoom - game.value.scale.zoom) > 0.01` antes de setZoom (epsilon anti-thrash con floats).'
    ).toMatch(/Math\.abs\s*\(\s*newZoom\s*-\s*game\.value\.scale\.zoom/)
    expect(
      src,
      'Callback resize debe invocar `game.value.scale.setZoom(newZoom)`. W3 crea.'
    ).toMatch(/game\.value\.scale\.setZoom\s*\(\s*newZoom\s*\)/)
    expect(
      src,
      'Callback resize debe invocar `applyCanvasAnchor(newZoom)` para mantener bottom-anchor y focal (COVER-01).'
    ).toMatch(/applyCanvasAnchor\s*\(\s*newZoom\s*\)/)
  })
})
