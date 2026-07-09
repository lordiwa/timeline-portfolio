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
//   - ERA-AGNT-01 (2026-07-09): Rafael + super robot en plataforma-mirador orquestrando
//     enjambre de drones que construyen mundos nuevos; megaestructura orbital en horizonte.
//
// Anti-patterns enforced (PHA-08 — verificados por regex de ausencia en
// tests/phaser/no-character-animation.test.js):
//   - Sin sistema de movimiento basado en fotogramas (single-image sprites only — ver CLAUDE.md §6.4)
//   - Solo tweens de posición/alpha/scale/angle para todos los objetos
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

// Zigzag de planetas (ERA-AGNT-01) — posiciones X indexadas por orden cronológico (sort planetOrbit asc).
// idx 0: orbit más baja (ar-vr, y≈297), idx 1: media (remoose, y≈540), idx 2: alta (software-mind, y≈783).
const PLANET_XS = [310, 150, 300]

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

    // Backdrop tall 480×1080 (fix "nebulosa borrosa" 2026-07-09): compuesto a
    // resolución NATIVA (extensión de espacio profundo arriba + ch6-bg verbatim
    // abajo). Reemplaza el setDisplaySize ×4 de ch6-bg, que estiraba 270px de
    // alto a 1080 y convertía estrellas y nebulosa en rayas borrosas.
    this.load.image('ch6-bg-tall', '/assets/ch6-bg-tall.png')

    // Parallax layers TRANSPARENTES (Open Q4 RESOLVED — best case 3-layer).
    // Derivadas de las opacas originales (fondo plano → alpha 0 + mosaico
    // espejado vertical para cubrir el descenso SIN estirar). Las opacas
    // originales quedaban 100% tapadas por el main bg dibujado al final.
    // Si los archivos no existen, `loaderror` event silencia el fallo y create()
    // detecta su ausencia via this.textures.exists() para fallback single-layer.
    this.load.image('ch6-bg-stars-far-t', '/assets/ch6-bg-stars-far-t.png')
    this.load.image('ch6-bg-nebulae-mid-t', '/assets/ch6-bg-nebulae-mid-t.png')

    // 3 planets-proyecto (D5-01 mapping cronológico ascendente).
    this.load.image('ch6-planet-ar-vr', '/assets/ch6-planet-ar-vr.png')
    this.load.image('ch6-planet-remoose', '/assets/ch6-planet-remoose.png')
    this.load.image('ch6-planet-software-mind', '/assets/ch6-planet-software-mind.png')

    // 2 ships (D5-05).
    this.load.image('ch6-ship-1', '/assets/ch6-ship-1.png')
    this.load.image('ch6-ship-2', '/assets/ch6-ship-2.png')

    // Era agentic assets — postal final ch6 (ERA-AGNT-01, 2026-07-09).
    // Cargados con fallback silencioso: si alguno falta, create() lo omite
    // via this.textures.exists() sin romper la escena.
    this.load.image('ch6-robot', '/assets/ch6-robot.png')
    this.load.image('ch6-rafael', '/assets/ch6-rafael.png')
    this.load.image('ch6-drone-a', '/assets/ch6-drone-a.png')
    this.load.image('ch6-drone-b', '/assets/ch6-drone-b.png')
    this.load.image('ch6-structures-t', '/assets/ch6-structures-t.png')
    this.load.image('ch6-platform', '/assets/ch6-platform.png')

    // Silent fail para assets opcionales — no romper scene si Adobe MCP no entregó
    // las capas (W1 best case 3-layer; worst case 1-layer fallback).
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

    // Fix "nebulosa borrosa" 2026-07-09 — composición del fondo re-hecha:
    //   1. TODO a resolución nativa 1:1 — cero setDisplaySize. El estirado ×4
    //      (270→1080) del asset era la borrosidad: estrellas → rayas verticales.
    //   2. Backdrop opaco PRIMERO, capas transparentes DESPUÉS. Antes el main
    //      bg opaco se dibujaba al final y tapaba ambas capas parallax.
    //   3. Geometría: origin(0.5, 0) en y=0 con alturas que cubren el rango
    //      real de cámara [0..CAMERA_FINAL_Y+BASE_H]. Antes (centro en y=135,
    //      span -405..675) el viewport final del arrival quedaba SIN fondo.
    const hasTall = this.textures.exists('ch6-bg-tall')
    const hasStarsT = this.textures.exists('ch6-bg-stars-far-t')
    const hasNebulaeT = this.textures.exists('ch6-bg-nebulae-mid-t')

    // Borde inferior del mundo visible (viewport final del arrival).
    const WORLD_BOTTOM = CAMERA_FINAL_Y + BASE_H // 945

    // Bajo PRM (D5-08): scrollFactor 1.0 todas las capas (sin diferencial).
    const starsFactor = prefersReduced ? 1.0 : 0.2
    const nebulaeFactor = prefersReduced ? 1.0 : 0.5

    if (hasTall) {
      // Backdrop 480×1080 nativo — cubre el descenso completo y termina en la
      // "postal" original (ch6-bg verbatim) exactamente donde aterriza el arrival.
      this.add.image(BASE_W / 2, 0, 'ch6-bg-tall').setOrigin(0.5, 0).setScrollFactor(1.0)
    } else {
      // Fallback legacy single-layer (asset tall ausente): comportamiento previo.
      this.add
        .image(BASE_W / 2, BASE_H / 2, 'ch6-bg')
        .setScrollFactor(1.0)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(BASE_W, BASE_H * 4)
    }

    // Capas transparentes sobre el backdrop. Altura de cobertura necesaria con
    // scrollFactor f: BASE_H + f·CAMERA_FINAL_Y (405 stars / 608 nebulae) —
    // ambos assets la superan sin estirar (540 / 810, mosaico espejado).
    // Bajo PRM (factor 1.0 + cámara ya en final): anclar al fondo del mundo
    // para que cubran el viewport final.
    if (hasStarsT) {
      const h = this.textures.get('ch6-bg-stars-far-t').getSourceImage().height
      this.add
        .image(BASE_W / 2, prefersReduced ? WORLD_BOTTOM - h : 0, 'ch6-bg-stars-far-t')
        .setOrigin(0.5, 0)
        .setScrollFactor(starsFactor)
    }

    if (hasNebulaeT) {
      const h = this.textures.get('ch6-bg-nebulae-mid-t').getSourceImage().height
      this.add
        .image(BASE_W / 2, prefersReduced ? WORLD_BOTTOM - h : 0, 'ch6-bg-nebulae-mid-t')
        .setOrigin(0.5, 0)
        .setScrollFactor(nebulaeFactor)
        // 0.65 → 0.5 (2026-07-09b): en el descenso competían con los planetas.
        .setAlpha(0.5)
    }

    // ─────────────────────────────────────────────────────────────────
    // Megaestructura orbital (ERA-AGNT-01) — horizonte derecho del postal,
    // detrás de los planetas. depth 8.
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-structures-t')) {
      this.add
        .image(330, 740, 'ch6-structures-t')
        .setDepth(8)
        .setScrollFactor(1.0)
        .setAlpha(0.92)
    }

    // ─────────────────────────────────────────────────────────────────
    // 3 planets — distribuidos en zigzag (D5-01 + Pattern 7 + ERA-AGNT-01)
    // ─────────────────────────────────────────────────────────────────

    this.projectsData = projects.filter((p) => p.chapterEra === 6)
    // Orden cronológico ascendente vía planetOrbit (0.2 → 0.5 → 0.8).
    this.projectsData.sort((a, b) => a.planetOrbit - b.planetOrbit)

    this.projectsData.forEach((proj, idx) => {
      const textureKey = `ch6-planet-${proj.id.replace('ch6-', '')}`
      // Posición X en zigzag (PLANET_XS) para composición visual más dinámica.
      const planetX = PLANET_XS[idx] ?? BASE_W / 2
      const planet = this.add.sprite(
        planetX,
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
        .setScrollFactor(0) // sticky-to-camera
        .setDepth(100)
        .setVisible(false)

      // pointerover (desktop only — guard touch). D5-06.
      planet.on('pointerover', () => {
        if (this.sys.game.device.input.touch) return
        this.input.setDefaultCursor('pointer')
        tooltip.setText(i18n.global.t(proj.titleKey))
        // Posición dinámica: si el planeta está a la derecha del centro,
        // el tooltip se muestra a su izquierda para no salirse de los 480px.
        if (planet.x > BASE_W / 2) {
          tooltip.setOrigin(1, 0.5)
          tooltip.setPosition(planet.x - planet.width / 2 - 4, planet.y)
        } else {
          tooltip.setOrigin(0, 0.5)
          tooltip.setPosition(planet.x + planet.width / 2 + 4, planet.y)
        }
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
    // Plataforma-mirador (ERA-AGNT-01, v2 2026-07-09b) — suelo con banda de
    // superficie caminable + labio neon + fascia con pilares.
    // PNG 480×72 centrado en y=909 → cubre y 873..945. Banda de suelo
    // world y 881..893 — los pies pisan DENTRO de la banda (y≈889).
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-platform')) {
      this.add
        .image(240, 909, 'ch6-platform')
        .setDepth(30)
        .setScrollFactor(1.0)
    }

    // ─────────────────────────────────────────────────────────────────
    // Héroes en el deck (ERA-AGNT-01) — Rafael y super robot de espaldas,
    // mirando al horizonte orbital. Pies en y≈889 (dentro de la banda de
    // suelo 881..893) + sombras de contacto elípticas — v2 grounding fix
    // (feedback Rafael 2026-07-09: "los personajes están en el aire").
    // Robot 92×124: origen default 0.5 → pies en y 827+62=889.
    // Rafael 26×48: origen default 0.5 → pies en y 865+24=889.
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      // Sombra de contacto — ancla visualmente los pies al suelo.
      this.add.ellipse(95, 890, 60, 9, 0x05030f, 0.45).setDepth(33).setScrollFactor(1.0)

      const robot = this.add
        .image(95, 827, 'ch6-robot')
        .setDepth(35)
        .setScrollFactor(1.0)

      // Vibración sutil del robot — solo cuando PRM está desactivado.
      if (!prefersReduced) {
        this.tweens.add({
          targets: robot,
          y: 825.5,
          duration: 3200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      }
    }

    if (this.textures.exists('ch6-rafael')) {
      this.add.ellipse(152, 890, 24, 6, 0x05030f, 0.45).setDepth(33).setScrollFactor(1.0)

      this.add
        .image(152, 865, 'ch6-rafael')
        .setDepth(35)
        .setScrollFactor(1.0)
      // Rafael permanece estático — testigo silencioso de lo que se construye.
    }

    // ─────────────────────────────────────────────────────────────────
    // Enjambre de drones-agente (ERA-AGNT-01) — depth 25.
    // Drones 0-2: en el postal entre plataforma y megaestructura (van y vienen).
    // Drones 3-4: acompañan planetas 2 y 1 durante el descenso.
    // Cada dron tiene oscilación Y independiente + deriva X lenta.
    // Drones tipo-b llevan carga → balanceo angular adicional.
    // ─────────────────────────────────────────────────────────────────

    const DRONE_DEFS = [
      // { key, x, y, yA: amp Y, yD: dur Y, xA: amp X, xD: dur X, aA: amp angle, aD: dur angle }
      { key: 'ch6-drone-b', x: 200, y: 850, yA: 8,  yD: 1800, xA: 40, xD: 5000, aA: 4, aD: 4000 },
      { key: 'ch6-drone-a', x: 265, y: 800, yA: 6,  yD: 2200, xA: 30, xD: 6000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 330, y: 840, yA: 10, yD: 1600, xA: 50, xD: 4500, aA: 4, aD: 5500 },
      { key: 'ch6-drone-a', x: 170, y: 520, yA: 7,  yD: 2400, xA: 25, xD: 7000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 130, y: 290, yA: 9,  yD: 1400, xA: 60, xD: 3800, aA: 4, aD: 6000 },
    ]

    DRONE_DEFS.forEach((def) => {
      if (!this.textures.exists(def.key)) return

      const drone = this.add
        .image(def.x, def.y, def.key)
        .setDepth(25)
        .setScrollFactor(1.0)

      if (!prefersReduced) {
        // Oscilación vertical independiente.
        this.tweens.add({
          targets: drone,
          y: def.y - def.yA,
          duration: def.yD,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
        // Deriva horizontal lenta.
        this.tweens.add({
          targets: drone,
          x: def.x + def.xA,
          duration: def.xD,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
        // Balanceo angular: solo drones tipo-b (llevan carga pesada).
        if (def.aA > 0) {
          this.tweens.add({
            targets: drone,
            angle: def.aA,
            duration: def.aD,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          })
        }
      }
    })

    // ─────────────────────────────────────────────────────────────────
    // Haz holográfico de mando (ERA-AGNT-01) — depth 34. World-space.
    // Línea cian (0x4dffff) desde cabeza del robot (95, 790) hacia
    // planeta 3 (300, 783) + línea corta hacia dron obrero (200, 850).
    // Visualización de "Rafael + robot orquestan el enjambre".
    // Solo visible en el postal (y 675..945) — no necesita clip extra,
    // la cámara lo revela naturalmente al terminar el arrival.
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      const beam = this.add.graphics()
      beam.setDepth(34)
      beam.setScrollFactor(1.0)
      beam.lineStyle(1, 0x4dffff, 1)
      beam.beginPath()
      beam.moveTo(95, 772)
      beam.lineTo(300, 783)
      beam.strokePath()
      beam.beginPath()
      beam.moveTo(95, 772)
      beam.lineTo(200, 850)
      beam.strokePath()

      if (prefersReduced) {
        // Alpha fija bajo PRM — no parpadea.
        beam.setAlpha(0.22)
      } else {
        // Parpadeo suave: 0.12 → 0.32 yoyo (2s).
        beam.setAlpha(0.12)
        this.tweens.add({
          targets: beam,
          alpha: 0.32,
          duration: 2000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      }
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
