// src/phaser/index.js — Phaser 3.86 game factory para Chapter 6 (Phase 5).
//
// Phaser 3.86 — stay on 3.x major; do NOT upgrade to Phaser 4.x publicado 2026-04-30
// (Pitfall 14, requires re-validation de toda la API surface usada aquí).
//
// Responsabilidades de este módulo (factory):
//   - Exportar `createGame(parentEl, { prefersReduced })` que retorna `new Phaser.Game(config)`.
//   - Resolver el zoom integer (Math.floor) que evita sub-pixel blur (PHA-03).
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

// Resolución virtual base — CLAUDE.md §1 (480×270 = 16:9 zoom×3 default).
const BASE_W = 480
const BASE_H = 270

/**
 * Compute integer zoom multiplier para el canvas Phaser display size.
 *
 * Fórmula: min(floor(vw/480), floor(vh/270)) || 1
 *   - `Math.floor` evita escalas fraccionales (sub-pixel blur en pixel art) — PHA-03.
 *   - `Math.min` mantiene aspect ratio 16:9; el side menor manda.
 *   - `|| 1` defensive — si viewport < 480×270 (extreme mobile), zoom=0 produciría
 *     canvas 0×0 invisible. Mínimo 1× (downscale visible es preferible).
 *
 * @returns {number} integer zoom >= 1
 */
function computeZoom() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return Math.min(Math.floor(vw / BASE_W), Math.floor(vh / BASE_H)) || 1
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
