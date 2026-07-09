// src/phaser/index.js — Phaser 3.86 game factory para Chapter 6 (Phase 5).
//
// Phaser 3.86 — stay on 3.x major; do NOT upgrade to Phaser 4.x publicado 2026-04-30
// (Pitfall 14, requires re-validation de toda la API surface usada aquí).
//
// Responsabilidades de este módulo (factory):
//   - Exportar `createGame(parentEl, { prefersReduced })` que retorna `new Phaser.Game(config)`.
//   - Resolver el zoom fill fraccional que se adapta al viewport (HI-BIT-01 2026-07-09b).
//   - Setear `prefersReduced` en `game.registry` vía `callbacks.preBoot` (Pattern 9 Option B)
//     para que SpaceScene pueda branch sin prop drilling ni Vue composables.
//
// Lo que este módulo NO hace (by design — Warning 6 RESOLVED):
//   - NO mantiene state de instancia (cada call a createGame() retorna una nueva instance).
//   - NO maneja HMR — el guard `import.meta.hot?.dispose(...)` vive en
//     src/components/Chapter6Content.vue (Plan 05-04), que es el lifecycle owner.
//     Separa responsabilidades y evita doble-cleanup.
//
// Source-of-truth: 05-RESEARCH.md §Pattern 1 (lines 354-396) + §Pattern 3 + §Pattern 9 Option B.
// Verified contracts: tests/phaser/factory.test.js (T1-T6) + tests/phaser/scale.test.js (T1-T3).

import Phaser from 'phaser'
import { SpaceScene } from './SpaceScene.js'

// Resolución virtual hi-bit (HI-BIT-01 2026-07-09b) — 960×540 = 480×270 × doble densidad.
// PHA-03 integer-zoom superseded: con arte a doble densidad, el zoom fraccional fill
// ya no produce blur perceptible (roundPixels + pixelArt siguen activos como seguro).
const BASE_W = 960
const BASE_H = 540

/**
 * Compute zoom fill fraccional para el canvas Phaser display size.
 *
 * Fórmula: max(1, min(vw/960, vh/540))
 *   - `Math.min` mantiene aspect ratio 16:9; el side menor manda.
 *   - `Math.max(1, ...)` defensive — si viewport < 960×540 el canvas hace downscale
 *     en vez de producir un canvas 0×0 invisible.
 *   - Sin `Math.floor`: arte a doble densidad absorbe el sub-pixel sin blur perceptible.
 *
 * @returns {number} zoom fraccional >= 1
 */
function computeZoom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.max(1, Math.min(vw / BASE_W, vh / BASE_H))
}

/**
 * Factory: crea y retorna una nueva `Phaser.Game` configurada para Chapter 6.
 *
 * @param {HTMLElement} parentEl - DOM node donde montar el canvas (NO string id,
 *   más estricto — evita race-condition de mount antes de DOM ready).
 * @param {{ prefersReduced?: boolean }} [opts] - opciones runtime.
 *   - `prefersReduced`: si true, la scene aplica D5-08 PRM heuristic (instant cut arrival,
 *     ships estáticas, tweens.timeScale=0 cinturón).
 * @returns {Phaser.Game} instancia lista para usar (lifecycle owned by Chapter6Content.vue).
 */
export function createGame(parentEl, { prefersReduced } = {}) {
  return new Phaser.Game({
    type: Phaser.AUTO, // WebGL preferred; fallback Canvas2D si no disponible.
    parent: parentEl, // DOM node directo — NO string id (Pitfall race-condition mount).
    width: BASE_W,
    height: BASE_H,
    zoom: computeZoom(), // integer multiplier (PHA-03).
    pixelArt: true, // disable texture interpolation (nearest-neighbor filtering).
    roundPixels: true, // snap tween positions a integer pixels (anti-blur).
    backgroundColor: '#1a0e3d', // deep purple synthwave D5-04 — visible durante preload.
    transparent: false, // canvas opaco; bg vive dentro del game, no detrás.
    physics: { default: 'none' }, // tree-shake ~30 KB Phaser physics — no se usa.
    scale: {
      mode: Phaser.Scale.NONE, // NO auto-FIT — integer zoom manual (PHA-03 mandate).
      autoCenter: Phaser.Scale.CENTER_BOTH, // canvas centrado en parentEl.
    },
    scene: [SpaceScene],
    callbacks: {
      preBoot: (game) => {
        // Pattern 9 Option B — registry shared cross-scene. SpaceScene.create()
        // lee `this.registry.get('prefersReduced')` para branch PRM (D5-08).
        game.registry.set('prefersReduced', !!prefersReduced)
      },
    },
  })
}
