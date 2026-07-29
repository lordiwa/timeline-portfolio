// tests/phaser/scale.test.js
//
// TASK-012 RESCATE (2026-07-29) — computeZoom() calculaba contra `window` en vez del
// rect del host. Medido en vivo: canvas 1536×864 dentro de host 1521×791, offset
// vertical -72.8px. Fix: computeZoom(hostEl) usa hostEl.getBoundingClientRect().
//
// Cobertura (4 tests):
//   T1: BASE_W = 960 (resolución virtual hi-bit horizontal — HI-BIT-01 2026-07-09b)
//   T2: BASE_H = 540 (resolución virtual hi-bit vertical — 16:9 ratio)
//   T3: computeZoom(hostEl) usa Math.max(1, r.width/BASE_W, r.height/BASE_H) — zoom
//       COVER fraccional contra getBoundingClientRect(), NO contra window.
//   T4: valor numérico — host mockeado 1521×791 produce zoom 1.584375 (COVER-01 +
//       TASK-012 rescate), replicando la medición real reportada en la spec.
//
// Historia previa (superseded): antes computeZoom() no tomaba parámetros y leía
// window.innerWidth/innerHeight directamente — eso es exactamente el bug de TASK-012.

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// T4 importa el módulo real para invocar computeZoom() como función pura. El módulo
// real hace `import Phaser from 'phaser'` a nivel de módulo, y el paquete 'phaser'
// dispara side-effects de CanvasFeatures contra un <canvas> real al cargar — jsdom no
// implementa getContext() (sin el paquete `canvas` nativo), así que se mockea 'phaser'
// con un stub mínimo suficiente para que SpaceScene.js (importado transitivamente por
// src/phaser/index.js) evalúe sin crashear. computeZoom() en sí no toca Phaser.
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {},
    Game: class Game {},
    AUTO: 'AUTO',
    Scale: { NONE: 'NONE', NO_CENTER: 'NO_CENTER' },
    BlendModes: { NORMAL: 'NORMAL', ADD: 'ADD' },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
    Display: { Shaders: { BaseShader: class BaseShader {} } },
    Curves: { CubicBezier: class CubicBezier {} },
    Math: { Vector2: class Vector2 {} },
    Geom: { Circle: class Circle {}, },
    Renderer: { WebGL: { Pipelines: { PostFXPipeline: class PostFXPipeline {} } } },
  },
}))

const FACTORY_PATH = resolve(process.cwd(), 'src/phaser/index.js')

let src = ''
try {
  src = readFileSync(FACTORY_PATH, 'utf8')
} catch (_) {
  src = ''
}

describe('phaser scale formula (PHA-03 → HI-BIT-01 → TASK-012 rescate) — computeZoom(hostEl)', () => {
  it('T1: BASE_W = 960 declarado (resolución virtual hi-bit horizontal)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_W = 960` (HI-BIT-01: doble densidad 480×2).'
    ).toMatch(/BASE_W\s*=\s*960/)
  })

  it('T2: BASE_H = 540 declarado (resolución virtual hi-bit vertical, 16:9)', () => {
    expect(
      src,
      'src/phaser/index.js debe declarar `BASE_H = 540` (HI-BIT-01: doble densidad 270×2).'
    ).toMatch(/BASE_H\s*=\s*540/)
  })

  it('T3: computeZoom(hostEl) usa getBoundingClientRect() — NUNCA window.innerWidth/innerHeight', () => {
    expect(
      src,
      'computeZoom debe recibir un parámetro hostEl y llamar `hostEl.getBoundingClientRect()`. ' +
        'TASK-012: calcular contra `window` producía offset fantasma cuando el host es más chico ' +
        'que el viewport.'
    ).toMatch(/function\s+computeZoom\s*\(\s*hostEl\s*\)/)
    expect(src).toMatch(/hostEl\.getBoundingClientRect\s*\(\s*\)/)
    expect(
      src,
      'computeZoom() NO debe leer window.innerWidth/innerHeight (ese es el bug de TASK-012).'
    ).not.toMatch(/computeZoom[\s\S]{0,10}\([\s\S]{0,10}\)\s*\{[\s\S]{0,200}window\.innerWidth/)
  })

  it('T4: host mockeado 1521×791 → zoom 1.584375 (medición real reportada en la spec ch6)', async () => {
    const { computeZoom } = await import('@/phaser/index.js')
    const hostEl = { getBoundingClientRect: () => ({ width: 1521, height: 791 }) }
    const zoom = computeZoom(hostEl)
    expect(zoom).toBeCloseTo(Math.max(1, 1521 / 960, 791 / 540), 6)
    expect(zoom).toBeCloseTo(1.584375, 6)
  })
})
