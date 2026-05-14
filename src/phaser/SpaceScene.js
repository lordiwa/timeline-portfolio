// src/phaser/SpaceScene.js — Chapter 6 Phaser scene (Phase 5 W2).
//
// Source-of-truth: 05-RESEARCH.md §Patterns 5+6+7+8+9+13.
// Decisions baked in:
//   - D5-01: 3 planets-proyecto distribuidos verticalmente (ar-vr, remoose, software-mind)
//   - D5-02: arrival cinematográfico descendente + escena estática post-arrival
//   - D5-04: paleta synthwave (#1a0e3d / #ff3ca6 / #4dffff / #ffd95c)
//   - D5-05: 2 ships horizontal loop escalonado (12s LTR + 18s RTL)
//   - D5-06: click planet → bridge event; tooltip hover desktop only
//   - D5-08: PRM heuristic — instant cut + ships estáticas + tweens.timeScale=0 cinturón
//   - D5-10: bridge events SIN prefijo `vue:` ('show-project', 'arrival-complete', 'locale-changed')
//
// Anti-patterns enforced (PHA-08 — verificados por regex de ausencia en
// tests/phaser/no-character-animation.test.js):
//   - Sin Phaser anim system (no character animation)
//   - Sin atlas multi-cell (single-image sprites only — ver CLAUDE.md §6.4)
//   - Sin anim play calls
//   - Sin captura de wheel/touchmove (Pitfall 6 — rompería scroll-snap del documento)
//
// Verified contracts:
//   - tests/phaser/space-scene-shape.test.js (T1-T6)
//   - tests/phaser/no-character-animation.test.js (T1-T3)
//   - tests/phaser/locale-bridge.test.js (T1-T3; T4/T5 verde tras Plan 05-04)
//   - tests/phaser/prm.test.js (T1-T3)

import Phaser from 'phaser'
import { i18n } from '@/i18n'
import { projects } from '@/data/projects'

// Constantes de layout — sintonizables si Rafael feedback W5.
const BASE_W = 480
const BASE_H = 270

// Vertical descent total: 3 viewport heights = 810 px. Los 3 planets se distribuyen
// dentro de este rango usando planetOrbit (0..1 normalized en src/data/projects.js).
const ARRIVAL_DESCENT = BASE_H * 3 // 810

// Cámara final: scrollY = ARRIVAL_DESCENT - 135 (centra el último planet en viewport).
const CAMERA_FINAL_Y = ARRIVAL_DESCENT - 135

// Arrival duration default (Claude's discretion D5-08, plan §interfaces Open Q6 RESOLVED).
const ARRIVAL_DURATION_MS = 3500

// Ships timing — D5-05.
const SHIP1_DURATION_MS = 12000 // LTR (banda superior, ~12s)
const SHIP2_DURATION_MS = 18000 // RTL (banda inferior, ~18s — mayor profundidad)

// Hit area halo extra (D5-06 mandate +~16px padding sobre el sprite radius).
const PLANET_HALO_PX = 16

// Ships estáticas posiciones bajo PRM (D5-08).
const PRM_SHIP1_X = 120
const PRM_SHIP2_X = 360

export class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    /** @type {Array<{ tooltip: Phaser.GameObjects.Text, titleKey: string }>} */
    this.tooltipTexts = []
    /** @type {Array<Phaser.GameObjects.Sprite>} */
    this.planets = []
    /** @type {Array<object>} */
    this.projectsData = []
  }

  preload() {
    // Main background (always loaded — single-layer fallback baseline).
    this.load.image('ch6-bg', '/assets/ch6-bg.png')

    // Optional parallax layers (Open Q4 RESOLVED — best case 3-layer post W1).
    // Si los archivos no existen, `loaderror` event silencia el fallo y create()
    // detecta su ausencia via this.textures.exists() para fallback single-layer.
    this.load.image('ch6-bg-stars-far', '/assets/ch6-bg-stars-far.png')
    this.load.image('ch6-bg-nebulae-mid', '/assets/ch6-bg-nebulae-mid.png')

    // 3 planets-proyecto (D5-01 mapping cronológico ascendente).
    this.load.image('ch6-planet-ar-vr', '/assets/ch6-planet-ar-vr.png')
    this.load.image('ch6-planet-remoose', '/assets/ch6-planet-remoose.png')
    this.load.image('ch6-planet-software-mind', '/assets/ch6-planet-software-mind.png')

    // 2 ships (D5-05).
    this.load.image('ch6-ship-1', '/assets/ch6-ship-1.png')
    this.load.image('ch6-ship-2', '/assets/ch6-ship-2.png')

    // Silent fail para parallax opcionales — no romper scene si Adobe MCP no entregó
    // las 2 capas (W1 best case 3-layer; worst case 1-layer fallback).
    this.load.on('loaderror', (file) => {
      // No-op intencional. Las texture keys ausentes se detectan en create()
      // via this.textures.exists() — fallback single-layer ya cubierto.
      if (file && typeof file.key === 'string' && file.key.startsWith('ch6-bg-')) {
        // Parallax layer ausente — single-layer fallback aplicará.
      }
    })
  }

  create() {
    const prefersReduced = this.registry.get('prefersReduced')

    // ─────────────────────────────────────────────────────────────────
    // Parallax layers (D5-02 multi-capa parallax)
    // ─────────────────────────────────────────────────────────────────

    const hasStarsFar = this.textures.exists('ch6-bg-stars-far')
    const hasNebulaeMid = this.textures.exists('ch6-bg-nebulae-mid')

    // Bajo PRM (D5-08): scrollFactor 1.0 todas las capas (sin diferencial).
    const starsFactor = prefersReduced ? 1.0 : 0.2
    const nebulaeFactor = prefersReduced ? 1.0 : 0.5

    if (hasStarsFar) {
      this.add
        .image(BASE_W / 2, BASE_H / 2, 'ch6-bg-stars-far')
        .setScrollFactor(starsFactor)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(BASE_W, BASE_H * 4) // cubrir descenso completo
    }

    if (hasNebulaeMid) {
      this.add
        .image(BASE_W / 2, BASE_H / 2, 'ch6-bg-nebulae-mid')
        .setScrollFactor(nebulaeFactor)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(BASE_W, BASE_H * 4)
    }

    // Main bg — world-space (scrollFactor 1.0). Cubre todo el descenso.
    this.add
      .image(BASE_W / 2, BASE_H / 2, 'ch6-bg')
      .setScrollFactor(1.0)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(BASE_W, BASE_H * 4)

    // ─────────────────────────────────────────────────────────────────
    // 3 planets — distribuidos verticalmente (D5-01 + Pattern 7)
    // ─────────────────────────────────────────────────────────────────

    this.projectsData = projects.filter((p) => p.chapterEra === 6)
    // Orden cronológico ascendente vía planetOrbit (0.2 → 0.5 → 0.8).
    this.projectsData.sort((a, b) => a.planetOrbit - b.planetOrbit)

    this.projectsData.forEach((proj, idx) => {
      const textureKey = `ch6-planet-${proj.id.replace('ch6-', '')}`
      const planet = this.add.sprite(
        BASE_W / 2, // center X
        proj.planetOrbit * ARRIVAL_DESCENT + 135, // Y derived from data
        textureKey
      )
      planet.setScrollFactor(1.0) // world-space — camera reveals as it descends
      planet.setDepth(20)

      // Hit area generosa: circle radius = halfWidth + halo (D5-06).
      const hitRadius = planet.width / 2 + PLANET_HALO_PX
      planet.setInteractive(
        new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, hitRadius),
        Phaser.Geom.Circle.Contains
      )

      // Tooltip (Phaser Text — D5-10 in-Phaser; mantra/overlay viven en Vue).
      const tooltip = this.add
        .text(0, 0, '', {
          fontFamily: 'Audiowide, sans-serif', // D5-04 synthwave font
          fontSize: '12px',
          color: '#4dffff', // cyan accent D5-04
          backgroundColor: '#1a0e3d', // deep purple D5-04
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0) // sticky-to-camera
        .setDepth(100)
        .setVisible(false)

      // pointerover (desktop only — guard touch). D5-06.
      planet.on('pointerover', () => {
        if (this.sys.game.device.input.touch) return
        this.input.setDefaultCursor('pointer')
        tooltip.setText(i18n.global.t(proj.titleKey))
        tooltip.setPosition(planet.x + planet.width / 2 + 4, planet.y)
        tooltip.setVisible(true)
      })

      planet.on('pointerout', () => {
        this.input.setDefaultCursor('default')
        tooltip.setVisible(false)
      })

      // Click → bridge event a Vue (D5-10: sin prefijo vue:).
      planet.on('pointerdown', () => {
        this.game.events.emit('show-project', proj.id)
      })

      this.planets.push(planet)
      this.tooltipTexts.push({ tooltip, titleKey: proj.titleKey, projectIdx: idx })
    })

    // ─────────────────────────────────────────────────────────────────
    // 2 ships — horizontal loop (D5-05 + Pattern 8)
    // ─────────────────────────────────────────────────────────────────

    const ship1 = this.add
      .image(-50, 80, 'ch6-ship-1')
      .setScrollFactor(0) // sticky-to-camera — siempre visible en viewport
      .setDepth(50)

    const ship2 = this.add
      .image(BASE_W + 50, 200, 'ch6-ship-2')
      .setScrollFactor(0)
      .setDepth(50)
      .setFlipX(true) // mira a la izquierda — RTL

    if (prefersReduced) {
      // D5-08 — ships estáticas en posiciones decorativas fijas.
      ship1.setX(PRM_SHIP1_X)
      ship2.setX(PRM_SHIP2_X)
    } else {
      // LTR loop ~12s.
      this.tweens.add({
        targets: ship1,
        x: BASE_W + 50,
        duration: SHIP1_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          ship1.setX(-50)
        },
      })
      // RTL loop ~18s (más lento — mayor profundidad).
      this.tweens.add({
        targets: ship2,
        x: -50,
        duration: SHIP2_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          ship2.setX(BASE_W + 50)
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // Arrival camera descent (D5-02 + Pattern 7)
    // ─────────────────────────────────────────────────────────────────

    this.cameras.main.setScroll(0, 0)

    if (prefersReduced) {
      // D5-08: instant cut. cameras.main.setScroll DIRECTO sin tween.
      this.cameras.main.setScroll(0, CAMERA_FINAL_Y)
      this.game.events.emit('arrival-complete')
    } else {
      this.tweens.add({
        targets: this.cameras.main,
        scrollY: CAMERA_FINAL_Y,
        duration: ARRIVAL_DURATION_MS,
        ease: 'Power2.easeOut', // empieza rápido, slow al final — feels cinematic
        onComplete: () => {
          this.game.events.emit('arrival-complete')
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // Locale bridge listener (PHA-06 + D5-10 + Pattern 5)
    // ─────────────────────────────────────────────────────────────────

    this.game.events.on('locale-changed', this.handleLocaleChange, this)

    // Cleanup explícito en SHUTDOWN — game.events vive en game-level event bus,
    // requires remove explícito (no se limpia automáticamente con scene.destroy()).
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('locale-changed', this.handleLocaleChange, this)
    })

    // ─────────────────────────────────────────────────────────────────
    // PRM safety net (D5-08 cinturón de seguridad)
    // ─────────────────────────────────────────────────────────────────

    if (prefersReduced) {
      // Aborta cualquier tween que se haya escapado al PRM check arriba.
      this.tweens.timeScale = 0
    }
  }

  /**
   * Re-traduce tooltips visibles cuando Vue emite `locale-changed`.
   * Pattern 5: el bridge desde Chapter6Content.vue (Plan 05-04) dispara
   * `game.value?.events.emit('locale-changed', newLocale)` en watch(locale).
   *
   * @param {string} _locale - locale code (es|en) — no se usa directamente porque
   *   i18n.global.t() ya respeta el state del singleton tras Vue reactivity flush.
   */
  handleLocaleChange(_locale) {
    this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
      if (tooltip.visible) {
        tooltip.setText(i18n.global.t(titleKey))
      }
    })
  }
}
