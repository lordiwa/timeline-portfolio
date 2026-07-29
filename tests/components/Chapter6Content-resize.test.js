// tests/components/Chapter6Content-resize.test.js
//
// TASK-012 RESCATE (2026-07-29) — computeZoom() ya NO se calcula localmente
// contra `window`: se importa del mismo chunk lazy de Phaser (`computeZoom`
// exportado por src/phaser/index.js, que usa hostEl.getBoundingClientRect()).
// El bug medido: canvas 1536×864 dentro de un host 1521×791, offset vertical
// -72.8px, causado precisamente por calcular contra el viewport en vez del
// rect real del host.
//
// Cobertura (3 tests):
//   T1: useResizeObserver(document.documentElement, ...) — sin cambios (sigue
//       siendo Pitfall 8 mitigation, ResizeObserver requiere un Element).
//   T2: el callback NO calcula contra `window.innerWidth/innerHeight` — usa
//       `computeZoomFn(canvasHostRef.value)` importado del chunk lazy.
//   T3: el callback sigue comparando epsilon antes de setZoom + reaplicando
//       applyCanvasAnchor (anti-thrash + reposicionamiento, sin cambios).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')

let src = ''
try { src = readFileSync(CH6_PATH, 'utf8') } catch (_) { src = '' }

describe('Chapter6Content.vue ResizeObserver (PHA-09 + TASK-012 rescate)', () => {
  it('T1: usa useResizeObserver(document.documentElement, ...) (NO window)', () => {
    expect(
      src,
      'Chapter6Content.vue debe llamar `useResizeObserver(document.documentElement, ...)`. ' +
        'Pitfall 8: window no es Element observable.'
    ).toMatch(/useResizeObserver\s*\(\s*document\.documentElement/)
    expect(
      src.match(/useResizeObserver\s*\(\s*window/),
      'Anti-pattern: useResizeObserver(window, ...) — window no es Element observable.'
    ).toBeNull()
  })

  it('T2: el callback calcula zoom con computeZoomFn(canvasHostRef.value), NUNCA con window.innerWidth/innerHeight', () => {
    expect(
      src,
      'Callback resize debe llamar `computeZoomFn(canvasHostRef.value)` — el rescate de TASK-012 ' +
        'mueve la fuente de la medida del viewport al rect real del host.'
    ).toMatch(/computeZoomFn\s*\(\s*canvasHostRef\.value\s*\)/)
    expect(
      src,
      'TASK-012 rescate: el callback de resize NO debe calcular contra window.innerWidth/innerHeight ' +
        '(ese es exactamente el bug medido: canvas 1536x864 en host 1521x791, offset -72.8px).'
    ).not.toMatch(/newZoom\s*=\s*Math\.max\s*\(\s*1,\s*window\.innerWidth/)
  })

  it('T3: comparación epsilon anti-thrash + game.scale.setZoom + applyCanvasAnchor intactos', () => {
    expect(
      src,
      'Callback resize debe comparar `Math.abs(newZoom - game.value.scale.zoom) > 0.01` antes de setZoom.'
    ).toMatch(/Math\.abs\s*\(\s*newZoom\s*-\s*game\.value\.scale\.zoom/)
    expect(
      src,
      'Callback resize debe invocar `game.value.scale.setZoom(newZoom)`.'
    ).toMatch(/game\.value\.scale\.setZoom\s*\(\s*newZoom\s*\)/)
    expect(
      src,
      'Callback resize debe invocar `applyCanvasAnchor(newZoom)` para mantener bottom-anchor y focal.'
    ).toMatch(/applyCanvasAnchor\s*\(\s*newZoom\s*\)/)
  })
})
