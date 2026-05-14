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
// Rationale (RESEARCH §Pattern 4):
//   - ResizeObserver requiere un Element, no window. `document.documentElement` es safe.
//   - El callback debe verificar `newZoom !== game.value.scale.zoom` antes de setZoom
//     para evitar re-render innecesarios (Pitfall 8).
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

  it('T2: callback recalcula zoom + invoca game.scale.setZoom solo si difiere', () => {
    if (src.length === 0) {
      expect(src, 'src/components/Chapter6Content.vue debe existir (W3 lo crea).').not.toBe('')
      return
    }
    // El handler debe contener:
    //  - cálculo newZoom (Math.min + Math.floor)
    //  - comparación `newZoom !== game.value.scale.zoom` (guard against thrash)
    //  - llamada `game.value.scale.setZoom(newZoom)`
    expect(
      src,
      'Callback resize debe declarar `newZoom` calculado con Math.min/Math.floor. W3 crea.'
    ).toMatch(/newZoom\s*=\s*Math\.min\s*\([\s\S]*?Math\.floor/)
    expect(
      src,
      'Callback resize debe comparar `newZoom !== game.value.scale.zoom` antes de setZoom (anti-thrash).'
    ).toMatch(/newZoom\s*!==\s*game\.value\.scale\.zoom/)
    expect(
      src,
      'Callback resize debe invocar `game.value.scale.setZoom(newZoom)`. W3 crea.'
    ).toMatch(/game\.value\.scale\.setZoom\s*\(\s*newZoom\s*\)/)
  })
})
