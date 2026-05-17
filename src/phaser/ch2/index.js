// src/phaser/ch2/index.js — Phaser 3.86 factory para el mini-advergame ch2 (Phase 04.2).
//
// Match-3 60s embebido en el HOME panel del ch2 Y2K stage. Instancia separada
// del factory ch6 (src/phaser/index.js) — no shared state, no shared resources.
//
// Responsabilidades:
//   - Exportar `createMiniGame(parentEl, { prefersReduced })` que retorna `new Phaser.Game`.
//   - Configurar canvas 360×420 fixed (no zoom dinámico — match-3 no es pixel-art puro,
//     usa Graphics primitives renderizadas en runtime).
//   - Setear `prefersReduced` en registry para que MatchScene branch transitions.
//
// Lo que NO hace (lifecycle owner = Ch2MiniGame.vue):
//   - NO maneja HMR — guard en Ch2MiniGame.vue.
//   - NO mantiene state cross-instance.

import Phaser from 'phaser'
import { MatchScene } from './MatchScene.js'

export const GAME_WIDTH = 360
export const GAME_HEIGHT = 420

/**
 * Factory: crea y retorna una nueva `Phaser.Game` para el ch2 mini-game.
 *
 * @param {HTMLElement} parentEl - DOM node donde montar el canvas.
 * @param {{ prefersReduced?: boolean }} [opts]
 * @returns {Phaser.Game}
 */
export function createMiniGame(parentEl, { prefersReduced } = {}) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentEl,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: false, // match-3 tiles usan Graphics primitives, no sprites
    backgroundColor: '#050a18', // deep ice-blue base ch2 Y2K palette
    transparent: false,
    physics: { default: 'none' },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MatchScene],
    callbacks: {
      preBoot: (game) => {
        game.registry.set('prefersReduced', !!prefersReduced)
      },
    },
  })
}
