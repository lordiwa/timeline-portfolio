// src/phaser/SpaceScene.js — Chapter 6 Phaser scene (Phase 5 W2 / ERA-AGNT-02).
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
//   - HI-BIT-01 (2026-07-09b): mundo 960×540 con fondos doble densidad; sprites chunky ×2 via setScale(2).
//   - ERA-AGNT-02 (2026-07-10): arte raster roto reemplazado por sistemas procedurales.
//     • Megaestructura → wireframe holográfico dinámico (Phaser Graphics, ring en perspectiva).
//     • Planetas → geo-procedurales (AR/VR=rejilla holográfica, Remoose=orgánico-púrpura,
//       software-mind=red neural). PNGs cargados pero alpha=0 (interactividad conservada).
//     • Filamento neural Rafael↔robot (bezier cúbico + partículas sinápticas bidireccionales).
//     • Paneles holográficos Asimov (Three Laws, tick-in de caracteres).
//     • Glitch de horizonte (camera tint breve cada 8-15s).
//
// Anti-patterns enforced (PHA-08 — verificados por regex de ausencia en
// tests/phaser/no-character-animation.test.js):
//   - Sprites de personajes como imagen estática única (single-image only — ver CLAUDE.md §6.4)
//   - Solo tweens de posición/alpha/scale/angle para objetos de la escena
//   - Partículas del filamento: matemática pura en update(), no objetos Phaser
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

// Constantes de layout hi-bit (HI-BIT-01) — 960×540 = 480×270 × doble densidad.
const BASE_W = 960
const BASE_H = 540

// Vertical descent total: 3 viewport heights = 1620 px.
const ARRIVAL_DESCENT = BASE_H * 3 // 1620

// Cámara final: scrollY centra el postal (último planet en viewport).
const CAMERA_FINAL_Y = ARRIVAL_DESCENT - BASE_H / 2 // 1350

// Arrival duration default.
const ARRIVAL_DURATION_MS = 3500

// Ships timing — D5-05.
const SHIP1_DURATION_MS = 12000 // LTR (banda superior, ~12s)
const SHIP2_DURATION_MS = 18000 // RTL (banda inferior, ~18s — mayor profundidad)

// Radio de planetas procedurales (ERA-AGNT-02) + hit area halo (D5-06).
const PLANET_R = 90      // radio en world-px (equivale al 192/2 nativo)
const PLANET_HALO_PX = 24

// Ships estáticas posiciones bajo PRM (D5-08).
const PRM_SHIP1_X = 240
const PRM_SHIP2_X = 720

// Zigzag de planetas (ERA-AGNT-01) — X indexada por orden cronológico (sort planetOrbit asc).
// idx 0: orbit 0.2 (ar-vr, y≈594), idx 1: orbit 0.5 (remoose, y≈1080), idx 2: orbit 0.8 (software-mind, y≈1566).
const PLANET_XS = [620, 300, 600]

// Ring wireframe holográfico (ERA-AGNT-02) — reemplaza ch6-structures-t.png.
// Elipse en perspectiva; semi-ejes: OA/OB = exterior, IA/IB = interior.
const RING_CX = 660
const RING_CY = 1480
const RING_OA = 195 // semi-eje mayor exterior (horizontal)
const RING_OB = 52  // semi-eje menor exterior (vertical — perspectiva)
const RING_IA = 150 // semi-eje mayor interior
const RING_IB = 40  // semi-eje menor interior

// Filamento neural (ERA-AGNT-02) — control points de la curva bezier Rafael↔robot.
// P0 = cabeza de Rafael (304,1730 center → y≈1696), P3 = cabeza del robot (190,1654 center → y≈1560).
const FILAMENT_P0 = { x: 304, y: 1696 }
const FILAMENT_P1 = { x: 272, y: 1638 }
const FILAMENT_P2 = { x: 218, y: 1585 }
const FILAMENT_P3 = { x: 190, y: 1560 }

export class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    /** @type {Array<{ tooltip: Phaser.GameObjects.Text, titleKey: string }>} */
    this.tooltipTexts = []
    /** @type {Array<Phaser.GameObjects.Sprite>} */
    this.planets = []
    /** @type {Array<object>} */
    this.projectsData = []
    // Filamento neural (ERA-AGNT-02)
    this._filamentGfx = null
    this._filamentCurve = null
    this._filamentParticles = []
    this._lastSynapseTime = 0
    this._prefersReduced = false
  }

  preload() {
    // Main background (always loaded — single-layer fallback baseline).
    this.load.image('ch6-bg', '/assets/ch6-bg.webp')

    // Backdrop tall 960×1890 hi-bit — cubre descenso completo a resolución nativa.
    this.load.image('ch6-bg-tall', '/assets/ch6-bg-tall.webp')

    // Parallax layers TRANSPARENTES (Open Q4 RESOLVED — best case 3-layer).
    this.load.image('ch6-bg-stars-far-t', '/assets/ch6-bg-stars-far-t.png')
    this.load.image('ch6-bg-nebulae-mid-t', '/assets/ch6-bg-nebulae-mid-t.webp')

    // 3 planets-proyecto — PNG cargado para compatibilidad (T2) pero rendering es procedural (ERA-AGNT-02).
    this.load.image('ch6-planet-ar-vr', '/assets/ch6-planet-ar-vr.png')
    this.load.image('ch6-planet-remoose', '/assets/ch6-planet-remoose.png')
    this.load.image('ch6-planet-software-mind', '/assets/ch6-planet-software-mind.png')

    // 2 ships (D5-05) — mismos archivos, se muestran ×2 via setScale.
    this.load.image('ch6-ship-1', '/assets/ch6-ship-1.png')
    this.load.image('ch6-ship-2', '/assets/ch6-ship-2.png')

    // Era agentic assets — postal final ch6 (ERA-AGNT-01, 2026-07-09).
    // Fallback silencioso: si alguno falta, create() lo omite via textures.exists().
    this.load.image('ch6-robot', '/assets/ch6-robot.png')
    this.load.image('ch6-rafael', '/assets/ch6-rafael.png')
    this.load.image('ch6-drone-a', '/assets/ch6-drone-a.png')
    this.load.image('ch6-drone-b', '/assets/ch6-drone-b.png')
    this.load.image('ch6-platform', '/assets/ch6-platform.png')

    // Silent fail para assets opcionales — no romper scene si algún asset no existe.
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
    this._prefersReduced = prefersReduced

    // ─────────────────────────────────────────────────────────────────
    // Parallax layers (D5-02 multi-capa parallax)
    // ─────────────────────────────────────────────────────────────────

    const hasTall = this.textures.exists('ch6-bg-tall')
    const hasStarsT = this.textures.exists('ch6-bg-stars-far-t')
    const hasNebulaeT = this.textures.exists('ch6-bg-nebulae-mid-t')

    // Borde inferior del mundo visible (viewport final del arrival).
    const WORLD_BOTTOM = CAMERA_FINAL_Y + BASE_H // 1890

    // Bajo PRM (D5-08): scrollFactor 1.0 todas las capas (sin diferencial).
    const starsFactor = prefersReduced ? 1.0 : 0.2
    const nebulaeFactor = prefersReduced ? 1.0 : 0.5

    if (hasTall) {
      // Backdrop 960×1890 nativo hi-bit — cubre el descenso completo.
      this.add.image(BASE_W / 2, 0, 'ch6-bg-tall').setOrigin(0.5, 0).setScrollFactor(1.0)
    } else {
      // Fallback legacy single-layer (asset tall ausente).
      this.add
        .image(BASE_W / 2, BASE_H / 2, 'ch6-bg')
        .setScrollFactor(1.0)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(BASE_W, BASE_H * 4)
    }

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
        // 0.5 (no 0.65): en el descenso competían con los planetas — decisión
        // 2026-07-09b (b7c5098), re-aplicada tras el refactor hi-bit.
        .setAlpha(0.5)
    }

    // ─────────────────────────────────────────────────────────────────
    // Megaestructura: wireframe holográfico (ERA-AGNT-02).
    // Reemplaza ch6-structures-t.png (archivado en old/ como iter2).
    // Anillo en perspectiva: dos elipses + montantes radiales + cruz.
    // depth 8 — mantiene posición en pila de la versión PNG anterior.
    // ─────────────────────────────────────────────────────────────────

    this._buildHolographicRing(prefersReduced)

    // ─────────────────────────────────────────────────────────────────
    // 3 planets — distribuidos en zigzag (D5-01 + Pattern 7 + ERA-AGNT-01)
    // Rendering PROCEDURAL (ERA-AGNT-02 — PNGs tenían bordes anti-aliased borrosos).
    // Los sprites PNG se cargan para T2 pero su alpha es 0 (invisible).
    // La interactividad usa el hit-circle geométrico — funciona en alpha=0.
    // ─────────────────────────────────────────────────────────────────

    this.projectsData = projects.filter((p) => p.chapterEra === 6)
    // Orden cronológico ascendente vía planetOrbit (0.2 → 0.5 → 0.8).
    this.projectsData.sort((a, b) => a.planetOrbit - b.planetOrbit)

    this.projectsData.forEach((proj, idx) => {
      const textureKey = `ch6-planet-${proj.id.replace('ch6-', '')}`
      const planetX = PLANET_XS[idx] ?? BASE_W / 2
      const planetY = proj.planetOrbit * ARRIVAL_DESCENT + BASE_H / 2

      // Sprite PNG invisible — mantiene la key literal en source (T2) pero no renderiza.
      const planet = this.add.sprite(planetX, planetY, textureKey)
      planet.setScrollFactor(1.0).setDepth(20).setAlpha(0)

      // Dibujo procedural del planeta encima del sprite invisible.
      this._renderProceduralPlanet(proj.id, planetX, planetY)

      // Hit area geométrica: el radio generoso sigue funcionando aunque el sprite sea invisible.
      const hitRadius = PLANET_R + PLANET_HALO_PX
      planet.setInteractive(
        new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, hitRadius),
        Phaser.Geom.Circle.Contains
      )

      // Tooltip (Phaser Text — D5-10 in-Phaser; mantra/overlay viven en Vue).
      const tooltip = this.add
        .text(0, 0, '', {
          fontFamily: 'Audiowide, sans-serif', // D5-04 synthwave font
          fontSize: '20px',
          color: '#4dffff', // cyan accent D5-04
          backgroundColor: '#1a0e3d', // deep purple D5-04
          padding: { x: 10, y: 5 },
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
        // el tooltip se muestra a su izquierda para no salirse de los 960px.
        if (planet.x > BASE_W / 2) {
          tooltip.setOrigin(1, 0.5)
          tooltip.setPosition(planet.x - PLANET_R - 4, planet.y)
        } else {
          tooltip.setOrigin(0, 0.5)
          tooltip.setPosition(planet.x + PLANET_R + 4, planet.y)
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
    // setScale(2) — mismos archivos, doble tamaño visual chunky.
    // ─────────────────────────────────────────────────────────────────

    const ship1 = this.add
      .image(-100, 160, 'ch6-ship-1')
      .setScrollFactor(0) // sticky-to-camera
      .setScale(2)
      .setDepth(50)

    const ship2 = this.add
      .image(BASE_W + 100, 400, 'ch6-ship-2')
      .setScrollFactor(0)
      .setScale(2)
      .setDepth(50)
      .setFlipX(true) // RTL

    if (prefersReduced) {
      // D5-08 — ships estáticas en posiciones decorativas fijas.
      ship1.setX(PRM_SHIP1_X)
      ship2.setX(PRM_SHIP2_X)
    } else {
      // LTR loop ~12s.
      this.tweens.add({
        targets: ship1,
        x: BASE_W + 100,
        duration: SHIP1_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          ship1.setX(-100)
        },
      })
      // RTL loop ~18s (más lento — mayor profundidad).
      this.tweens.add({
        targets: ship2,
        x: -100,
        duration: SHIP2_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => {
          ship2.setX(BASE_W + 100)
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // Plataforma-mirador (ERA-AGNT-01) — cubierta con barandilla neon.
    // 960×144 nativa hi-bit, sin scale. Deck en y≈1762..1786. depth 30.
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-platform')) {
      this.add
        .image(480, 1818, 'ch6-platform')
        .setDepth(30)
        .setScrollFactor(1.0)
    }

    // ─────────────────────────────────────────────────────────────────
    // Sombras de los héroes (depth 31 — sobre plataforma 30, bajo héroes 35).
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      this.add.ellipse(190, 1780, 120, 18, 0x000000, 0.4)
        .setDepth(31)
        .setScrollFactor(1.0)
    }
    if (this.textures.exists('ch6-rafael')) {
      this.add.ellipse(304, 1780, 48, 12, 0x000000, 0.35)
        .setDepth(31)
        .setScrollFactor(1.0)
    }

    // ─────────────────────────────────────────────────────────────────
    // Héroes en el deck (ERA-AGNT-01) — Rafael y super robot de espaldas.
    // setScale(2) — mismos archivos nativos, doble tamaño visual chunky.
    // Robot 92×124 nativo → scale(2) → rendered 184×248 → pies 1654+124=1778 ✓
    // Rafael 26×48  nativo → scale(2) → rendered 52×96  → pies 1730+48=1778 ✓
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      const robot = this.add
        .image(190, 1654, 'ch6-robot')
        .setScale(2)
        .setDepth(35)
        .setScrollFactor(1.0)

      // Vibración sutil del robot — solo cuando PRM está desactivado.
      if (!prefersReduced) {
        this.tweens.add({
          targets: robot,
          y: 1651,
          duration: 3200,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      }
    }

    if (this.textures.exists('ch6-rafael')) {
      this.add
        .image(304, 1730, 'ch6-rafael')
        .setScale(2)
        .setDepth(35)
        .setScrollFactor(1.0)
      // Rafael permanece estático — testigo silencioso de lo que se construye.
    }

    // ─────────────────────────────────────────────────────────────────
    // Enjambre de drones-agente (ERA-AGNT-01) — depth 25.
    // setScale(2) — mismos archivos, doble tamaño visual.
    // Drones 0-2: en el postal entre plataforma y megaestructura.
    // Drones 3-4: acompañan planetas 2 y 1 durante el descenso.
    // ─────────────────────────────────────────────────────────────────

    const DRONE_DEFS = [
      // { key, x, y, yA: amp Y, yD: dur Y, xA: amp X, xD: dur X, aA: amp angle, aD: dur angle }
      { key: 'ch6-drone-b', x: 400, y: 1700, yA: 16, yD: 1800, xA: 80,  xD: 5000, aA: 4, aD: 4000 },
      { key: 'ch6-drone-a', x: 530, y: 1600, yA: 12, yD: 2200, xA: 60,  xD: 6000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 660, y: 1680, yA: 20, yD: 1600, xA: 100, xD: 4500, aA: 4, aD: 5500 },
      { key: 'ch6-drone-a', x: 340, y: 1040, yA: 14, yD: 2400, xA: 50,  xD: 7000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 260, y: 580,  yA: 18, yD: 1400, xA: 120, xD: 3800, aA: 4, aD: 6000 },
    ]

    DRONE_DEFS.forEach((def) => {
      if (!this.textures.exists(def.key)) return

      const drone = this.add
        .image(def.x, def.y, def.key)
        .setScale(2)
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
    // Línea cian (0x4dffff) lineStyle(2) desde cabeza del robot (190, 1544)
    // hacia planeta 3 (600, 1566) + línea corta hacia dron obrero (400, 1700).
    // ─────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      const beam = this.add.graphics()
      beam.setDepth(34)
      beam.setScrollFactor(1.0)
      beam.lineStyle(2, 0x4dffff, 1)
      beam.beginPath()
      beam.moveTo(190, 1544)
      beam.lineTo(600, 1566)
      beam.strokePath()
      beam.beginPath()
      beam.moveTo(190, 1544)
      beam.lineTo(400, 1700)
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
    // Láseres de construcción (ERA-AGNT-02) — depth 9.
    // Los 3 drones del postal apuntan haces magenta hacia segmentos del anillo.
    // Visualiza que el anillo se construye en vivo delante del usuario.
    // ─────────────────────────────────────────────────────────────────

    this._buildConstructionBeams(prefersReduced)

    // ─────────────────────────────────────────────────────────────────
    // Filamento neural Rafael ↔ robot (ERA-AGNT-02 — el pedido emocional).
    // Curva bezier cúbica + partículas sinápticas bidireccionales.
    // El filamento lee como DIÁLOGO, no como cable.
    // depth 36 — justo sobre los héroes (35).
    // ─────────────────────────────────────────────────────────────────

    this._initNeuralFilament(prefersReduced)

    // ─────────────────────────────────────────────────────────────────
    // Paneles holográficos Asimov (ERA-AGNT-02 — inspiración sci-fi).
    // Fragmentos de las Tres Leyes tipándose; decorativos, no compiten
    // con el contenido. depth 32.
    // ─────────────────────────────────────────────────────────────────

    if (!prefersReduced) {
      this._buildAsimovPanels()
    }

    // ─────────────────────────────────────────────────────────────────
    // Glitch de horizonte (ERA-AGNT-02 — futuro incierto).
    // Camera tint breve en magenta/cian cada 8-15s. Inquietante, no molesto.
    // ─────────────────────────────────────────────────────────────────

    if (!prefersReduced) {
      this._scheduleHorizonGlitch()
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

    // Cleanup explícito en SHUTDOWN — game.events vive en game-level event bus.
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

  // ─────────────────────────────────────────────────────────────────
  // update — particle loop del filamento neural (ERA-AGNT-02).
  // Llamado cada frame por Phaser mientras la escena está activa.
  // Las partículas son matemática pura (no objetos Phaser) — sin tweens.
  // ─────────────────────────────────────────────────────────────────

  update(time) {
    if (this._prefersReduced || !this._filamentGfx || document.hidden) return

    const g = this._filamentGfx
    g.clear()

    // Trazar la curva base (muy tenue — el foco está en las partículas).
    const pts = this._filamentCurve.getPoints(24)
    g.lineStyle(1, 0x4dffff, 0.12)
    g.beginPath()
    g.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
    g.strokePath()

    // Generar nueva partícula cada ~280ms (bidireccional).
    if (time - this._lastSynapseTime > 280 && this._filamentParticles.length < 10) {
      this._lastSynapseTime = time
      const forward = Math.random() > 0.45 // leve sesgo hacia Rafael→robot (comando)
      this._filamentParticles.push({
        t: forward ? 0 : 1,
        dir: forward ? 1 : -1,
        speed: 0.006 + Math.random() * 0.004,
      })
    }

    // Actualizar y dibujar partículas.
    this._filamentParticles = this._filamentParticles.filter((p) => {
      p.t += p.dir * p.speed
      if (p.t < 0 || p.t > 1) return false

      const pos = this._filamentCurve.getPoint(p.t)
      // Fade in/out suave en los extremos (primero y último 10% de la curva).
      const fade = Math.min(p.t / 0.1, (1 - p.t) / 0.1, 1)
      g.fillStyle(0x4dffff, Math.min(fade * 0.85, 0.85))
      g.fillRect(Math.round(pos.x) - 1, Math.round(pos.y) - 1, 3, 3)
      return true
    })
  }

  /**
   * Re-traduce tooltips visibles cuando Vue emite `locale-changed`.
   * @param {string} _locale - locale code (es|en) — i18n.global.t() ya es reactivo.
   */
  handleLocaleChange(_locale) {
    this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
      if (tooltip.visible) {
        tooltip.setText(i18n.global.t(titleKey))
      }
    })
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers privados — invocados desde create().
  // ─────────────────────────────────────────────────────────────────

  /**
   * Dibuja el anillo wireframe holográfico en world-space.
   * Reemplaza el PNG ch6-structures-t.png (iter2 archivado en old/).
   */
  _buildHolographicRing(prefersReduced) {
    const ring = this.add.graphics()
    ring.setDepth(8).setScrollFactor(1.0)

    // Capas de glow: de exterior (ancho, bajo alpha) hacia el core (fino, brillante).
    ring.lineStyle(8, 0x4dffff, 0.04)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)

    ring.lineStyle(4, 0x4dffff, 0.14)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)

    // Core exterior — línea brillante.
    ring.lineStyle(1, 0x4dffff, 0.92)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)

    // Anillo interior (volumen del toro — sección transversal perspectivada).
    ring.lineStyle(1, 0x4dffff, 0.52)
    ring.strokeEllipse(RING_CX, RING_CY, RING_IA * 2, RING_IB * 2)

    // Montantes radiales: 16 puntales entre aro interior y exterior.
    // Alternancia cian (construido) / magenta (en progreso): 12/4.
    const strutCount = 16
    for (let i = 0; i < strutCount; i++) {
      const angle = (i / strutCount) * Math.PI * 2
      const ox = RING_CX + Math.cos(angle) * RING_OA
      const oy = RING_CY + Math.sin(angle) * RING_OB
      const ix = RING_CX + Math.cos(angle) * RING_IA
      const iy = RING_CY + Math.sin(angle) * RING_IB
      const built = i % 4 !== 0
      ring.lineStyle(1, built ? 0x4dffff : 0xff3ca6, built ? 0.62 : 0.32)
      ring.lineBetween(ox, oy, ix, iy)
    }

    // Cruz de referencia (ejes del plano orbital) en dorado — lectura técnica.
    ring.lineStyle(1, 0xffd95c, 0.20)
    ring.lineBetween(RING_CX, RING_CY - RING_OB - 30, RING_CX, RING_CY + RING_OB + 30)
    ring.lineBetween(RING_CX - RING_OA - 24, RING_CY, RING_CX + RING_OA + 24, RING_CY)

    // Ticks de escala a lo largo del eje horizontal.
    ring.lineStyle(1, 0xffd95c, 0.38)
    for (let t = 1; t <= 4; t++) {
      const tickX = RING_CX + (t / 4) * RING_OA
      ring.lineBetween(tickX, RING_CY - 4, tickX, RING_CY + 4)
      ring.lineBetween(RING_CX - (t / 4) * RING_OA, RING_CY - 4, RING_CX - (t / 4) * RING_OA, RING_CY + 4)
    }

    if (prefersReduced) {
      ring.setAlpha(0.85)
    } else {
      ring.setAlpha(0.75)
      this.tweens.add({
        targets: ring,
        alpha: 1.0,
        duration: 3400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
    }
  }

  /**
   * Dibuja láseres de construcción desde los drones del postal hacia el anillo.
   * Cada láser magenta parpadea independiente — el anillo se construye en vivo.
   */
  _buildConstructionBeams(prefersReduced) {
    // Tres drones en el postal → segmentos en construcción del anillo (magenta).
    const targets = [
      { droneX: 400, droneY: 1700, angle: 0.85 },
      { droneX: 530, droneY: 1600, angle: 2.10 },
      { droneX: 660, droneY: 1680, angle: 4.50 },
    ]
    targets.forEach((t, i) => {
      const rx = RING_CX + Math.cos(t.angle) * RING_OA
      const ry = RING_CY + Math.sin(t.angle) * RING_OB
      const b = this.add.graphics().setDepth(9).setScrollFactor(1.0)
      b.lineStyle(1, 0xff3ca6, 1)
      b.lineBetween(t.droneX, t.droneY, rx, ry)
      if (prefersReduced) {
        b.setAlpha(0.22)
      } else {
        b.setAlpha(0.14)
        this.tweens.add({
          targets: b,
          alpha: 0.52,
          duration: 720 + i * 380,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        })
      }
    })
  }

  /**
   * Inicializa el filamento neural: curva bezier + Graphics para update().
   * Bajo PRM: dibuja el trazo estático sin partículas.
   */
  _initNeuralFilament(prefersReduced) {
    this._filamentCurve = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(FILAMENT_P0.x, FILAMENT_P0.y),
      new Phaser.Math.Vector2(FILAMENT_P1.x, FILAMENT_P1.y),
      new Phaser.Math.Vector2(FILAMENT_P2.x, FILAMENT_P2.y),
      new Phaser.Math.Vector2(FILAMENT_P3.x, FILAMENT_P3.y)
    )
    this._filamentGfx = this.add.graphics().setDepth(36).setScrollFactor(1.0)

    if (prefersReduced) {
      // Trazo estático bajo PRM (respeta A11Y — sin movimiento).
      const pts = this._filamentCurve.getPoints(24)
      this._filamentGfx.lineStyle(1, 0x4dffff, 0.18)
      this._filamentGfx.beginPath()
      this._filamentGfx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) this._filamentGfx.lineTo(pts[i].x, pts[i].y)
      this._filamentGfx.strokePath()
    }
  }

  /**
   * Crea los tres paneles holográficos Asimov que se tipean en pantalla.
   * Posicionados a la izquierda del robot, flotando en el vacío. Decorativos.
   */
  _buildAsimovPanels() {
    const lines = [
      'LAW I: A robot may not\ninjure a human being—',
      'LAW II: A robot must obey\norders given by humans—',
      'Ψ(Ω) = Σ sₙ · e^{iλₙt}',
    ]
    const baseX = 52
    const baseY = 1455

    lines.forEach((line, i) => {
      const panel = this.add
        .text(baseX, baseY + i * 82, '', {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '10px',
          color: '#4dffff',
          backgroundColor: '#080412',
          padding: { x: 5, y: 3 },
          wordWrap: { width: 160 },
        })
        .setDepth(32)
        .setScrollFactor(1.0)
        .setAlpha(0.72)

      // Tick-in de caracteres: comienza tras retardo escalonado por panel.
      let charIdx = 0
      const tickIn = () => {
        if (charIdx < line.length) {
          panel.setText(line.slice(0, charIdx + 1))
          charIdx++
          this.time.addEvent({ delay: 55, callback: tickIn })
        }
      }
      this.time.addEvent({ delay: 900 + i * 1800, callback: tickIn })
    })
  }

  /**
   * Programa el glitch de horizonte: destello magenta/cian breve cada 8-15s.
   * Sugiere un futuro incierto — inquietante pero no molesto.
   */
  _scheduleHorizonGlitch() {
    const doGlitch = () => {
      if (document.hidden) {
        this.time.addEvent({ delay: 3000, callback: doGlitch })
        return
      }
      // Destello 1: magenta
      this.cameras.main.setTint(0xff3ca6)
      this.time.addEvent({
        delay: 55,
        callback: () => {
          this.cameras.main.clearTint()
          this.time.addEvent({
            delay: 35,
            callback: () => {
              // Destello 2: cian
              this.cameras.main.setTint(0x4dffff)
              this.time.addEvent({
                delay: 70,
                callback: () => {
                  this.cameras.main.clearTint()
                  // Programar siguiente glitch (8-15s).
                  this.time.addEvent({
                    delay: 8000 + Math.floor(Math.random() * 7000),
                    callback: doGlitch,
                  })
                },
              })
            },
          })
        },
      })
    }
    // Primera erupción: tras la llegada (12-17s desde arranque).
    this.time.addEvent({ delay: 12000 + Math.floor(Math.random() * 5000), callback: doGlitch })
  }

  /**
   * Dibuja el planeta en posición (cx, cy) usando Phaser Graphics.
   * Reemplaza el PNG borroso con geometría procedural nítida.
   * Cada planeta tiene identidad visual propia que refleja el proyecto.
   */
  _renderProceduralPlanet(projId, cx, cy) {
    const g = this.add.graphics()
    g.setScrollFactor(1.0).setDepth(21) // encima del sprite invisible (depth 20)

    if (projId.includes('ar-vr')) {
      // AR/VR — esfera de rejilla holográfica (teal oscuro con grid cian).
      g.fillStyle(0x031318, 1)
      g.fillCircle(cx, cy, PLANET_R)

      // Líneas de latitud perspectivadas (elipses horizontales).
      for (let k = -2; k <= 2; k++) {
        const dy = k * (PLANET_R / 2.6)
        const rx = Math.sqrt(Math.max(0, PLANET_R * PLANET_R - dy * dy))
        if (rx > 4) {
          const alphaLat = 0.48 - Math.abs(k) * 0.06
          g.lineStyle(1, 0x4dffff, alphaLat)
          g.strokeEllipse(cx, cy + dy, rx * 2, rx * 0.35)
        }
      }
      // Arcos de meridiano (elipses verticales estrechas).
      for (let k = -2; k <= 2; k++) {
        const dx = k * (PLANET_R / 2.6)
        const ry = Math.sqrt(Math.max(0, PLANET_R * PLANET_R - dx * dx))
        if (ry > 4) {
          g.lineStyle(1, 0x4dffff, 0.20)
          g.strokeEllipse(cx + dx * 0.28, cy, Math.abs(dx) * 0.22 + 3, ry * 2)
        }
      }
      // Polo norte luminoso.
      g.fillStyle(0xffd95c, 0.92)
      g.fillRect(cx - 2, cy - PLANET_R + 7, 4, 4)
      // Mini-anillo orbital (detalle escala).
      g.lineStyle(1, 0xffd95c, 0.52)
      g.strokeEllipse(cx, cy - PLANET_R + 14, 24, 6)
      // Halo atmosférico.
      g.lineStyle(3, 0x4dffff, 0.07)
      g.strokeCircle(cx, cy, PLANET_R + 8)

    } else if (projId.includes('remoose')) {
      // Remoose — mundo orgánico púrpura oscuro con «continentes» magenta.
      g.fillStyle(0x0d0318, 1)
      g.fillCircle(cx, cy, PLANET_R)

      // Continentes (manchas dentro del círculo).
      g.fillStyle(0x5c0e45, 0.68)
      g.fillCircle(cx - 15, cy - 9, 25)
      g.fillStyle(0x3c0828, 0.54)
      g.fillCircle(cx + 19, cy + 8, 20)
      g.fillStyle(0x6c185a, 0.40)
      g.fillCircle(cx + 4, cy - 31, 14)

      // Línea del terminador (divide día/noche — borde suave al orbe).
      g.lineStyle(1, 0x8a2068, 0.48)
      g.strokeEllipse(cx - 7, cy, 16, PLANET_R * 2)

      // Luces de ciudad (3 puntos dorados brillantes).
      const cityLights = [[cx - 14, cy - 8], [cx + 17, cy + 6], [cx + 2, cy - 30]]
      cityLights.forEach(([lx, ly]) => {
        g.fillStyle(0xffd95c, 1)
        g.fillRect(lx - 1, ly - 1, 2, 2)
      })
      // Halo atmosférico cálido.
      g.lineStyle(3, 0x8a2068, 0.09)
      g.strokeCircle(cx, cy, PLANET_R + 7)

    } else {
      // software-mind — planeta neural, red de circuitos viviente.
      g.fillStyle(0x011010, 1)
      g.fillCircle(cx, cy, PLANET_R)

      // Nodos de la red.
      const nodes = [
        [cx - 26, cy - 16], [cx + 16, cy - 36],
        [cx + 30, cy + 7],  [cx - 7,  cy + 30],
        [cx - 34, cy + 14], [cx + 3,  cy + 2],
        [cx - 12, cy - 44], [cx + 0,  cy - 14],
      ]
      // Conexiones entre nodos dentro de ~50px de distancia.
      const maxD2 = (PLANET_R * 0.56) * (PLANET_R * 0.56)
      g.lineStyle(1, 0x4dffff, 0.36)
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const dx = nodes[a][0] - nodes[b][0]
          const dy = nodes[a][1] - nodes[b][1]
          if (dx * dx + dy * dy < maxD2) {
            g.lineBetween(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1])
          }
        }
      }
      // Puntos de nodo (solo los que caen dentro del círculo).
      nodes.forEach(([nx, ny]) => {
        const d2 = (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy)
        if (d2 <= PLANET_R * PLANET_R * 0.9) {
          g.fillStyle(0x4dffff, 0.92)
          g.fillRect(nx - 2, ny - 2, 4, 4)
        }
      })
      // Pulso de actividad en el núcleo (blob central tenue).
      g.fillStyle(0x18e8e8, 0.10)
      g.fillCircle(cx, cy, 22)
      // Halo atmosférico cian.
      g.lineStyle(3, 0x4dffff, 0.07)
      g.strokeCircle(cx, cy, PLANET_R + 8)
    }
  }
}
