// src/phaser/SpaceScene.js — Chapter 6 Phaser scene (Phase 5 W2 / ERA-AGNT-02 / ERA-AGNT-03 / ERA-AGNT-04).
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
//   - ERA-AGNT-02 (2026-07-10): arte raster roto reemplazado por sistemas procedurales:
//     anillo wireframe, planetas geo-procedurales, filamento neural, paneles Asimov, glitch horizonte.
//   - ERA-AGNT-03 (2026-07-10): bg raster (stars PNG / nebulae WebP / tall WebP lossy) reemplazados
//     100% por shader GLSL vivo (starfield + nebulae procedurales, pixel-art quantization UV,
//     twinkle/drift perpetuos via u_time). Canvas2D fallback determinístico si sin WebGL.
//     Fix "corre una vez y se para": eliminado check document.hidden de update() — Phaser
//     gestiona el throttling de tab internamente.
//   - ERA-AGNT-04 (2026-07-10): fix re-entrada — todos los campos de instancia se resetean
//     al inicio de create() para que scene.stop() + scene.start() no deje estado stale
//     (stale _lastSynapseTime, stale _filamentParticles, ref muerta a shader anterior).
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
import { AsciiPostFX } from './AsciiPostFX.js'

// Constantes de layout hi-bit (HI-BIT-01) — 960×540 = 480×270 × doble densidad.
const BASE_W = 960
const BASE_H = 540

// Vertical descent total: 3 viewport heights = 1620 px.
const ARRIVAL_DESCENT = BASE_H * 3 // 1620

// Cámara final: scrollY centra el postal (último planet en viewport).
const CAMERA_FINAL_Y = ARRIVAL_DESCENT - BASE_H / 2 // 1350

// Arrival duration — TASK-012 RESCATE 2026-07-29 (spec §1.2): 3500 → 2200.
// El arrival largo era parte del problema (3.5s de nada interactivo); se comprime
// el mundo útil a la banda final en vez de alargar el tour de cámara. Ease intacto.
const ARRIVAL_DURATION_MS = 2200

// Ships timing — D5-05.
const SHIP1_DURATION_MS = 12000 // LTR (banda superior, ~12s)
const SHIP2_DURATION_MS = 18000 // RTL (banda inferior, ~18s — mayor profundidad)

// Radio de planetas procedurales (ERA-AGNT-02) + hit area halo (D5-06).
// PLANET_R (legacy) se mantiene como fallback de compat; el radio real por planeta
// vive en PLANET_RADII (TASK-012 RESCATE — spec §1.2, por-planeta, no global).
const PLANET_R = 90      // radio en world-px (equivale al 192/2 nativo)
const PLANET_HALO_PX = 24

// Ships estáticas posiciones bajo PRM (D5-08).
const PRM_SHIP1_X = 240
const PRM_SHIP2_X = 720

// TASK-012 RESCATE (2026-07-29, spec §1.2) — recomposición del mundo: los 3
// planetas-proyecto pasan a vivir DENTRO de la banda de cámara final visible
// [CAMERA_FINAL_Y, CAMERA_FINAL_Y + BASE_H] = [1350, 1890]. Antes, ar-vr (y=594)
// y remoose (y=1080) quedaban fuera de encuadre porque su Y se derivaba de
// `planetOrbit * ARRIVAL_DESCENT` (0.2 y 0.5 de 1620 = 324 / 810, muy por
// encima de la banda visible). Ahora la Y es explícita, no derivada del orbit.
// Arrays indexados por orden cronológico ascendente de planetOrbit (D5-01):
// idx 0 = ar-vr (0.2), idx 1 = remoose (0.5), idx 2 = software-mind (0.8).
const PLANET_XS = [170, 820, 600]
const PLANET_YS = [1425, 1455, 1566] // software-mind ya era visible, no se mueve.
const PLANET_RADII = [56, 62, 90]    // software-mind domina: es el presente (spec §1.2).

// Ring wireframe holográfico (ERA-AGNT-02) — reemplaza ch6-structures-t.png.
// Elipse en perspectiva; semi-ejes: OA/OB = exterior, IA/IB = interior.
const RING_CX = 660
const RING_CY = 1480
const RING_OA = 195 // semi-eje mayor exterior (horizontal)
const RING_OB = 52  // semi-eje menor exterior (vertical — perspectiva)
const RING_IA = 150 // semi-eje mayor interior
const RING_IB = 40  // semi-eje menor interior

// Filamento neural (ERA-AGNT-02, extendido spec §6.2) — DOS curvas bezier que
// convergen en el cursor-estrella compartido (x=247, y=1600), en vez de una sola
// curva Rafael→robot. "Los dos escriben en el mismo cursor."
const CURSOR_STAR = { x: 247, y: 1600 }
const FILAMENT_HUMAN_P0 = { x: 304, y: 1696 }
const FILAMENT_HUMAN_P1 = { x: 284, y: 1660 }
const FILAMENT_HUMAN_P2 = { x: 262, y: 1626 }
const FILAMENT_ROBOT_P0 = { x: 190, y: 1560 }
const FILAMENT_ROBOT_P1 = { x: 208, y: 1573 }
const FILAMENT_ROBOT_P2 = { x: 228, y: 1588 }

// Haces de convergencia del unísono (spec §6.1) — origen robot y origen Rafael.
const UNISON_ROBOT_PT = { x: 190, y: 1544 }
const UNISON_RAFAEL_PT = { x: 304, y: 1710 }

// Altura total del mundo — sincronizado en el shader para el parallax.
const WORLD_BOTTOM = CAMERA_FINAL_Y + BASE_H // 1890

// ─────────────────────────────────────────────────────────────────────────────
// SPACE_BG_FRAG — fragment shader GLSL 1.00 (ERA-AGNT-03 / ERA-AGNT-04).
//
// CONTEXTO: Este shader reemplaza TODOS los bg raster de ch6:
//   ch6-bg-tall.webp, ch6-bg-stars-far-t.png, ch6-bg-nebulae-mid-t.webp,
//   ch6-bg-stars-far.png, ch6-bg-nebulae-mid.png (archivados en old/).
//
// ESTÉTICA PIXEL ART: Las UVs se cuantizan a 240×135 (mitad de 480×270 virtual)
//   antes de cualquier cálculo, y el color final se posteriza a 12 niveles por canal.
//   Resultado: el shader parece renderizado a baja resolución, casando visualmente
//   con los sprites pixelados de la escena.
//
// UNIFORMS:
//   - time (float, s): actualizado automáticamente por Phaser — controla twinkle+drift.
//   - resolution (vec2, px): size del shader object — inyectado automáticamente.
//   - scrollY (float, px): scroll actual de la cámara — enviado desde update() para parallax.
//
// CAPAS (de fondo a frente):
//   1. base oscura: nebulosas fBm 3 octavas (deriva `time * 0.004`), paleta D5-04.
//   2. starfield denso: cuadrícula 64×80, 35% celdas con estrella, twinkle senoidal.
//   3. accent stars: cuadrícula 20×26, 18% celdas, cross-spike de difracción.
//
// PARALLAX en GLSL: stars scrollFactor≈0.2, nebulae scrollFactor≈0.5.
//   El scroll se normaliza contra WORLD_BOTTOM (1890px) para mantenerse en [0,1].
//
// COMPATIBILIDAD: GLSL 1.00 / WebGL 1. Sin texturas. Sin extensiones.
//   Loops con cotas compile-time. mediump float (seguro en móvil).
// ─────────────────────────────────────────────────────────────────────────────
const SPACE_BG_FRAG = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float scrollY;
// uOct (spec §8, tier B degradación) — 3.0 = octava completa (tier A), 2.0 = la
// tercera octava (más cara) se apaga. Default 3.0 si el uniform no se setea.
uniform float uOct;

// ── Hash y noise utilitarios ──────────────────────────────────────────────────

// Pseudo-random hash 2D sin texture (branch-free).
float hash2(vec2 p) {
  p  = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 43.21);
  return fract(p.x * p.y);
}

// Value noise 2D con interpolación smoothstep.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i),                hash2(i + vec2(1.0, 0.0)), f.x),
    mix(hash2(i + vec2(0.0,1.0)), hash2(i + vec2(1.0,1.0)), f.x),
    f.y
  );
}

// Fractal Brownian Motion — hasta 3 octavas (barato, adecuado para nebulosas GPU-pixel).
// uOct degrada 3→2 octavas bajo tier B de performance (spec §8) — step() apaga la
// tercera octava (la más cara) sin ramificar el shader.
float fbm3(vec2 p) {
  float v  = 0.50 * vnoise(p);
  p = p * 2.1 + vec2(5.3, 2.7);
  v += 0.25 * vnoise(p);
  p = p * 2.1 + vec2(5.3, 2.7);
  v += 0.125 * vnoise(p) * step(2.5, uOct);
  return v;
}

void main() {
  // ── UV cuantizadas a 240×135 para estética pixel-art ─────────────────────
  // Esto hace que el shader se "vea" a mitad de la resolución virtual 480×270,
  // casando visualmente con los sprites pixelados de la escena.
  vec2 rawUV = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution.xy;
  vec2 grid  = vec2(240.0, 135.0);
  vec2 uv    = floor(rawUV * grid) / grid;

  // ── Parallax por capa ─────────────────────────────────────────────────────
  // scroll normalizado en [0,1] respecto al recorrido total del mundo (1890px).
  float sNorm  = scrollY / 1890.0;
  vec2 starsUV = vec2(uv.x, uv.y + sNorm * 0.2);
  vec2 nebUV   = vec2(uv.x, uv.y + sNorm * 0.5);

  // ── [A] Gradiente base: espacio profundo (deep purple → casi negro) ──────
  // Top (uv.y=0): #1a0e3d = vec3(0.102, 0.055, 0.239)
  // Bottom (uv.y=1): #06010f = vec3(0.024, 0.004, 0.059)
  // Blend NORMAL — el shader ES el fondo, no un overlay.
  vec3 col = mix(vec3(0.102, 0.055, 0.239), vec3(0.024, 0.004, 0.059), uv.y);

  // ── [B] Nebulosas fBm media (púrpura + cian, drift temporal) ─────────────
  float td = time * 0.004;
  float n1 = fbm3(nebUV * 2.5 + vec2(0.0, td));
  float n2 = fbm3(nebUV * 4.1 + vec2(1.7, 0.5 + td));
  float n3 = fbm3(nebUV * 1.8 + vec2(3.1, 2.2));

  // Nebulosa púrpura profundo (D5-04 base: #1a0e3d).
  col += vec3(0.10, 0.01, 0.28) * pow(max(0.0, n1 * n3), 1.8) * 1.8;
  // Nebulosa cian-teal (D5-04 accent: #4dffff).
  // Se desvanece en la mitad inferior para no tapar los planetas y el postal.
  col += vec3(0.00, 0.15, 0.34) * pow(max(0.0, n2 * (1.0 - nebUV.y * 0.55)), 1.5) * 1.3;

  // ── [C] Nebulosa magenta/rosa zona baja (banda inferior del mundo) ────────
  // nebUV.y sube al bajar el scroll → la banda aparece en la zona inferior
  // del descenso, replicando la composición de ch6-bg-tall (retirado §6.5).
  float pinkN    = fbm3(nebUV * 3.2 + vec2(8.5, 1.2 + td * 0.7));
  float pinkMask = nebUV.y * nebUV.y * 1.6;
  col += vec3(0.30, 0.02, 0.18) * pow(max(0.0, pinkN), 1.5) * pinkMask * 2.2;

  // ── [D] Glow de horizonte cian + magenta (intensifica con el scroll) ──────
  // Se intensifica a partir de scrollY ≈ 945 px (50% del mundo) hasta 1890.
  // rawUV.y (sin parallax) para que sea efecto de cámara — se acumula en el
  // borde inferior de la pantalla donde vive la plataforma.
  float atmoS   = smoothstep(0.50, 0.95, scrollY / 1890.0);
  float atmoBot = pow(rawUV.y, 4.0);
  col += vec3(0.02, 0.22, 0.30) * atmoBot * atmoS * 0.9;
  col += vec3(0.18, 0.01, 0.12) * pow(rawUV.y, 7.0) * atmoS * 0.7;

  // ── Capa 2: Starfield denso (cuadrícula 64×80) ────────────────────────────
  // 2×2 vecindad para evitar artefactos en bordes de celda.
  vec2 sc    = starsUV * vec2(64.0, 80.0);
  vec2 sCeil = floor(sc);
  vec2 sLoc  = fract(sc);

  for (int ix = 0; ix <= 1; ix++) {
    for (int iy = 0; iy <= 1; iy++) {
      vec2  off  = vec2(float(ix), float(iy));
      vec2  c    = sCeil + off;
      float h    = hash2(c);
      // 35% de celdas tienen estrella (threshold 0.65, no 0.60 — más denso).
      float hasS = step(0.65, h);
      // Posición sub-celda de la estrella (determinística por hash).
      vec2  sPos = vec2(hash2(c * 2.3), hash2(c * 3.7));
      float dist = length(sLoc - off - sPos);
      // Twinkle: seno con frecuencia y fase propias por estrella.
      float twink = 0.55 + 0.45 * sin(time * (2.0 + h * 4.0) + h * 6.2832);
      float sz    = 0.013 + h * 0.020;
      float star  = smoothstep(sz, 0.0, dist) * (0.40 + 0.60 * h) * twink * hasS;
      // Color entre azul-blanco frío y amarillo-cálido según hash de estrella.
      col += star * mix(vec3(0.70, 0.85, 1.0), vec3(1.0, 0.90, 0.70), h);
    }
  }

  // ── Capa 3: Accent stars con picos de difracción ──────────────────────────
  vec2  bc    = starsUV * vec2(20.0, 26.0);
  vec2  bCeil = floor(bc);
  vec2  bLoc  = fract(bc);
  float bh    = hash2(bCeil * 5.1);
  // 18% de celdas grandes tienen accent star (threshold 0.82).
  float hasB  = step(0.82, bh);
  vec2  bPos  = vec2(hash2(bCeil * 1.3), hash2(bCeil * 2.9));
  float bd    = length(bLoc - bPos);
  float bt    = 0.30 + 0.70 * abs(sin(time * (1.2 + bh * 2.0) + bh * 12.566));
  // Core brillante.
  col += vec3(0.88, 0.95, 1.0) * smoothstep(0.06, 0.0, bd) * bt * 2.0 * hasB;
  // Picos de difracción: 4 brazos (H + V con fade lateral).
  float spH = smoothstep(0.003, 0.0, abs(bLoc.y - bPos.y))
            * smoothstep(0.14,  0.0, abs(bLoc.x - bPos.x));
  float spV = smoothstep(0.003, 0.0, abs(bLoc.x - bPos.x))
            * smoothstep(0.14,  0.0, abs(bLoc.y - bPos.y));
  col += vec3(0.40, 0.55, 0.90) * (spH + spV) * bt * 0.35 * hasB;

  // ── Posterización de color (12 niveles por canal = estética pixel art) ────
  col = floor(col * 12.0) / 12.0;

  gl_FragColor = vec4(col, 1.0);
}
`

export class SpaceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SpaceScene' })
    // Campos de instancia — también se resetean al inicio de create() para
    // manejar correctamente scene.stop() + scene.start() (ERA-AGNT-04).
    this.tooltipTexts = []
    this.planets = []
    this.projectsData = []
    this._filamentGfx = null
    this._filamentCurveHuman = null
    this._filamentCurveRobot = null
    this._filamentParticles = []
    this._lastSynapseTime = 0
    this._prefersReduced = false
    this._spaceShader = null
    this._asciiPipeline = null
    this._cursorStar = null
    this._perfTier = 'A'
    this._perfLowStreak = 0
    this._lastTokenFlash = 0
  }

  preload() {
    // Keys del contrato de tests (T2) — SIEMPRE presentes en preload().
    // ch6-bg: key requerida por test; apunta al bg base del chapter.
    this.load.image('ch6-bg', '/assets/ch6-bg.webp')

    // 3 planets-proyecto — PNG cargado para compatibilidad de contrato (T2).
    // Su rendering es procedural (ERA-AGNT-02); los sprites se crean con alpha=0.
    this.load.image('ch6-planet-ar-vr',       '/assets/ch6-planet-ar-vr.png')
    this.load.image('ch6-planet-remoose',     '/assets/ch6-planet-remoose.png')
    this.load.image('ch6-planet-software-mind', '/assets/ch6-planet-software-mind.png')

    // 2 ships (D5-05).
    this.load.image('ch6-ship-1', '/assets/ch6-ship-1.png')
    this.load.image('ch6-ship-2', '/assets/ch6-ship-2.png')

    // Era agentic assets (ERA-AGNT-01) — fallback silencioso si alguno falta.
    this.load.image('ch6-robot',    '/assets/ch6-robot.png')
    this.load.image('ch6-rafael',   '/assets/ch6-rafael.png')
    this.load.image('ch6-drone-a',  '/assets/ch6-drone-a.png')
    this.load.image('ch6-drone-b',  '/assets/ch6-drone-b.png')
    this.load.image('ch6-platform', '/assets/ch6-platform.png')

    // Loader de errores silencioso — activos opcionales no rompen la escena.
    this.load.on('loaderror', () => {})
  }

  create() {
    // ── ERA-AGNT-04: reset de estado de instancia ──────────────────────────
    // Cuando la escena se detiene (scene.stop) y se vuelve a arrancar
    // (scene.start), el constructor NO se llama de nuevo — solo create().
    // Sin este reset, el estado stale de la sesión anterior causa:
    //   - _filamentParticles con partículas fantasmas del ciclo anterior.
    //   - _spaceShader apuntando al objeto destruido de la sesión anterior
    //     (Phaser destruye GameObjects al hacer stop; la ref queda huérfana).
    //   - tooltipTexts y planets con refs a objetos destruidos.
    // Resetear aquí garantiza que create() funcione igual en primera entrada
    // que en re-entradas.
    this.tooltipTexts = []
    this.planets = []
    this.projectsData = []
    this._filamentGfx = null
    this._filamentCurveHuman = null
    this._filamentCurveRobot = null
    this._filamentParticles = []
    this._lastSynapseTime = 0
    this._prefersReduced = false
    this._spaceShader = null
    this._asciiPipeline = null
    this._cursorStar = null
    this._perfTier = 'A'
    this._perfLowStreak = 0
    this._lastTokenFlash = 0

    const prefersReduced = this.registry.get('prefersReduced')
    this._prefersReduced = prefersReduced

    // ─────────────────────────────────────────────────────────────────────
    // Fondo procedural (ERA-AGNT-03) — depth 2, blend NORMAL.
    // El shader GLSL ES el fondo completo: pinta gradiente base, nebulosas,
    // banda magenta inferior y glow de horizonte. No se usa ningún raster
    // ni Rectangle de base — el shader tiene pleno control del color.
    // Canvas2D fallback si no hay WebGL (ver _buildCanvasStarfield).
    // ch6-bg cargado en preload() para contrato T2 — no se renderiza en WebGL.
    // ─────────────────────────────────────────────────────────────────────

    this._buildShaderBackground(prefersReduced)

    // ─────────────────────────────────────────────────────────────────────
    // Megaestructura: wireframe holográfico (ERA-AGNT-02) — depth 8.
    // ─────────────────────────────────────────────────────────────────────

    this._buildHolographicRing(prefersReduced)

    // ─────────────────────────────────────────────────────────────────────
    // 3 planets (D5-01 + ERA-AGNT-02) — PNG invisible, rendering procedural.
    // ─────────────────────────────────────────────────────────────────────

    this.projectsData = projects.filter((p) => p.chapterEra === 6)
    this.projectsData.sort((a, b) => a.planetOrbit - b.planetOrbit)

    this.projectsData.forEach((proj, idx) => {
      const textureKey = `ch6-planet-${proj.id.replace('ch6-', '')}`
      const planetX = PLANET_XS[idx] ?? BASE_W / 2
      // TASK-012 RESCATE: Y explícita por planeta (spec §1.2), ya NO derivada de
      // planetOrbit * ARRIVAL_DESCENT — esa fórmula dejaba a ar-vr y remoose fuera
      // de la banda de cámara final [1350, 1890].
      const planetY = PLANET_YS[idx] ?? CAMERA_FINAL_Y + BASE_H / 2
      const planetR = PLANET_RADII[idx] ?? PLANET_R

      // Sprite PNG invisible — satisface el contrato de tests (T2/T3) sin renderizar.
      const planet = this.add.sprite(planetX, planetY, textureKey)
      planet.setScrollFactor(1.0).setDepth(20).setAlpha(0)

      // Dibujo procedural del planeta encima del sprite invisible.
      this._renderProceduralPlanet(proj.id, planetX, planetY, planetR)

      // Hit area circular (radio generoso sobre sprite alpha=0).
      const hitRadius = planetR + PLANET_HALO_PX
      planet.setInteractive(
        new Phaser.Geom.Circle(planet.width / 2, planet.height / 2, hitRadius),
        Phaser.Geom.Circle.Contains
      )

      // Tooltip (Phaser Text — sticky camera, D5-06).
      const tooltip = this.add
        .text(0, 0, '', {
          fontFamily: 'Audiowide, sans-serif',
          fontSize: '20px',
          color: '#4dffff',
          backgroundColor: '#1a0e3d',
          padding: { x: 10, y: 5 },
        })
        .setScrollFactor(0)
        .setDepth(100)
        .setVisible(false)

      planet.on('pointerover', () => {
        if (this.sys.game.device.input.touch) return
        this.input.setDefaultCursor('pointer')
        tooltip.setText(i18n.global.t(proj.titleKey))
        if (planet.x > BASE_W / 2) {
          tooltip.setOrigin(1, 0.5)
          tooltip.setPosition(planet.x - planetR - 4, planet.y)
        } else {
          tooltip.setOrigin(0, 0.5)
          tooltip.setPosition(planet.x + planetR + 4, planet.y)
        }
        tooltip.setVisible(true)
      })

      planet.on('pointerout', () => {
        this.input.setDefaultCursor('default')
        tooltip.setVisible(false)
      })

      planet.on('pointerdown', () => {
        this.game.events.emit('show-project', proj.id)
      })

      this.planets.push(planet)
      this.tooltipTexts.push({ tooltip, titleKey: proj.titleKey })
    })

    // ─────────────────────────────────────────────────────────────────────
    // 2 ships — horizontal loop (D5-05). setScale(2) = chunky.
    // ─────────────────────────────────────────────────────────────────────

    const ship1 = this.add
      .image(-100, 160, 'ch6-ship-1')
      .setScrollFactor(0)
      .setScale(2)
      .setDepth(50)

    const ship2 = this.add
      .image(BASE_W + 100, 400, 'ch6-ship-2')
      .setScrollFactor(0)
      .setScale(2)
      .setDepth(50)
      .setFlipX(true)

    if (prefersReduced) {
      ship1.setX(PRM_SHIP1_X)
      ship2.setX(PRM_SHIP2_X)
    } else {
      this.tweens.add({
        targets: ship1,
        x: BASE_W + 100,
        duration: SHIP1_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { ship1.setX(-100) },
      })
      this.tweens.add({
        targets: ship2,
        x: -100,
        duration: SHIP2_DURATION_MS,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { ship2.setX(BASE_W + 100) },
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // Plataforma-mirador (ERA-AGNT-01) — depth 30.
    // ─────────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-platform')) {
      this.add
        .image(480, 1818, 'ch6-platform')
        .setDepth(30)
        .setScrollFactor(1.0)
    }

    // Sombras proyectadas (depth 31).
    if (this.textures.exists('ch6-robot')) {
      this.add.ellipse(190, 1780, 120, 18, 0x000000, 0.4).setDepth(31).setScrollFactor(1.0)
    }
    if (this.textures.exists('ch6-rafael')) {
      this.add.ellipse(304, 1780, 48, 12, 0x000000, 0.35).setDepth(31).setScrollFactor(1.0)
    }

    // ─────────────────────────────────────────────────────────────────────
    // Héroes (ERA-AGNT-01) — depth 35. setScale(2) chunky.
    // ─────────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      const robot = this.add
        .image(190, 1654, 'ch6-robot')
        .setScale(2)
        .setDepth(35)
        .setScrollFactor(1.0)
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
    }

    // ─────────────────────────────────────────────────────────────────────
    // Drones (ERA-AGNT-01) — depth 25. setScale(2).
    // ─────────────────────────────────────────────────────────────────────

    // TASK-012 RESCATE (spec §1.2) — drones 4 y 5 vivían en y=1040 e y=580,
    // AMBOS fuera de la banda de cámara final [1350, 1890]. Reubicados a
    // y=1418 (x=260) e y=1512 (x=340): los 5 drones quedan en cuadro.
    const DRONE_DEFS = [
      { key: 'ch6-drone-b', x: 400, y: 1700, yA: 16, yD: 1800, xA: 80,  xD: 5000, aA: 4, aD: 4000 },
      { key: 'ch6-drone-a', x: 530, y: 1600, yA: 12, yD: 2200, xA: 60,  xD: 6000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 660, y: 1680, yA: 20, yD: 1600, xA: 100, xD: 4500, aA: 4, aD: 5500 },
      { key: 'ch6-drone-a', x: 260, y: 1418, yA: 14, yD: 2400, xA: 50,  xD: 7000, aA: 0, aD: 0    },
      { key: 'ch6-drone-b', x: 340, y: 1512, yA: 18, yD: 1400, xA: 120, xD: 3800, aA: 4, aD: 6000 },
    ]

    DRONE_DEFS.forEach((def) => {
      if (!this.textures.exists(def.key)) return
      const drone = this.add
        .image(def.x, def.y, def.key)
        .setScale(2)
        .setDepth(25)
        .setScrollFactor(1.0)
      if (!prefersReduced) {
        this.tweens.add({ targets: drone, y: def.y - def.yA, duration: def.yD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        this.tweens.add({ targets: drone, x: def.x + def.xA, duration: def.xD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        if (def.aA > 0) {
          this.tweens.add({ targets: drone, angle: def.aA, duration: def.aD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        }
      }
    })

    // ─────────────────────────────────────────────────────────────────────
    // Bots de reparto (feat ch6) — Amazon × 2 + Uber × 2, depth 25.
    // 100% procedural: generateTexture + tweens. Sin PNGs nuevos.
    // ─────────────────────────────────────────────────────────────────────

    this._buildDeliveryBots(prefersReduced)

    // ─────────────────────────────────────────────────────────────────────
    // Haz holográfico de mando (ERA-AGNT-01) — depth 34.
    // ─────────────────────────────────────────────────────────────────────

    if (this.textures.exists('ch6-robot')) {
      const beam = this.add.graphics().setDepth(34).setScrollFactor(1.0)
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
        beam.setAlpha(0.22)
      } else {
        beam.setAlpha(0.12)
        this.tweens.add({ targets: beam, alpha: 0.32, duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // TASK-012 (spec §6) — Struts del anillo a cuatro manos + cursor-estrella
    // compartido. REEMPLAZA _buildConstructionBeams (láseres dron→anillo
    // unidireccionales): el unísono ahora lo completan Rafael Y el robot
    // JUNTOS sobre los mismos struts pendientes, no un tercero (drones).
    // ─────────────────────────────────────────────────────────────────────

    this._buildUnisonStruts(prefersReduced)

    // ─────────────────────────────────────────────────────────────────────
    // Filamento neural Rafael ↔ robot (ERA-AGNT-02) — depth 36. Extendido
    // (spec §6.2) con el cursor-estrella compartido en (247, 1600): ambos
    // tramos convergen a un único punto en vez de Rafael→robot directo.
    // ─────────────────────────────────────────────────────────────────────

    this._initNeuralFilament(prefersReduced)

    // Paneles Asimov y glitch de horizonte RETIRADOS (spec §1.3 tabla de
    // rescate): texto dentro de Phaser es borroso/no accesible/no i18n
    // (sustituido por la conversación DOM), y el glitch era ruido sin
    // significado que competía con el takeover ASCII.

    // ─────────────────────────────────────────────────────────────────────
    // Arrival camera descent (D5-02).
    // ─────────────────────────────────────────────────────────────────────

    this.cameras.main.setScroll(0, 0)

    if (prefersReduced) {
      this.cameras.main.setScroll(0, CAMERA_FINAL_Y)
      this.game.events.emit('arrival-complete')
      // PRM (spec §6.1): struts ya completos, sin timeline — _buildUnisonStruts
      // ya los dibujó en cian estático + haces al 0.22 fijo. Nada más que hacer.
    } else {
      this.tweens.add({
        targets: this.cameras.main,
        scrollY: CAMERA_FINAL_Y,
        duration: ARRIVAL_DURATION_MS,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.game.events.emit('arrival-complete')
          // Acto 2 (spec §3): 300ms después de arrival arranca el unísono.
          this.time.addEvent({ delay: 300, callback: () => this._startUnisonTimeline() })
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // Locale bridge (D5-10).
    // ─────────────────────────────────────────────────────────────────────

    this.game.events.on('locale-changed', this.handleLocaleChange, this)
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('locale-changed', this.handleLocaleChange, this)
    })

    // ─────────────────────────────────────────────────────────────────────
    // Bridge DOM → Phaser (spec §4.2 + §6.2) — el DOM manda, Phaser obedece.
    //   'ascii-progress' : { mix, mode, tint } avanza el takeover del PostFX.
    //   'token-tick'      : flash de 80ms en el cursor-estrella, cada token.
    // ─────────────────────────────────────────────────────────────────────
    this._lastTokenFlash = 0
    this.game.events.on('ascii-progress', this.handleAsciiProgress, this)
    this.game.events.on('token-tick', this.handleTokenTick, this)
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ascii-progress', this.handleAsciiProgress, this)
      this.game.events.off('token-tick', this.handleTokenTick, this)
    })

    // ─────────────────────────────────────────────────────────────────────
    // ASCII PostFX pipeline (spec §4) — telón final: la escena se disuelve
    // en texto. Solo si hay WebGL (renderer.gl); Canvas2D fallback ya no
    // tiene pipelines post-proceso — el DOM ya carga el cierre narrativo
    // completo de todos modos (tier "Sin WebGL", spec §8).
    // ─────────────────────────────────────────────────────────────────────
    this._asciiPipeline = null
    if (this.game.renderer && this.game.renderer.gl) {
      try {
        this.game.renderer.pipelines.addPostPipeline('AsciiPostFX', AsciiPostFX)
        this.cameras.main.setPostPipeline('AsciiPostFX')
        this._asciiPipeline = this.cameras.main.getPostPipeline('AsciiPostFX')
        if (Array.isArray(this._asciiPipeline)) {
          this._asciiPipeline = this._asciiPipeline[0]
        }
        if (prefersReduced && this._asciiPipeline) {
          // PRM (spec §8): uMix fijo 0.35, modo rampa, sin wipe animado.
          this._asciiPipeline.uMix = 0.35
          this._asciiPipeline.uMode = 2
          this._asciiPipeline.uTint = 0.2
          this._asciiPipeline.frozenTime = 0.5
        }
      } catch (_) {
        this._asciiPipeline = null
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Escalera de performance (spec §8) — probe cada 5s sobre game.loop.actualFps.
    // Tier A (>=50fps): ascii cell 8, bg 3 octavas. Tier B (35-50): cell 12,
    // bg 2 octavas. Tier C (<35 dos ventanas seguidas): PostFX OFF (el cierre
    // narrativo ya vive en DOM — spec §8, "la degradación solo recorta
    // espectáculo, nunca significado").
    // ─────────────────────────────────────────────────────────────────────
    this._perfTier = 'A'
    this._perfLowStreak = 0
    if (!prefersReduced) {
      this.time.addEvent({ delay: 3000, callback: () => this._evaluatePerfTier() })
      this.time.addEvent({ delay: 5000, callback: () => this._evaluatePerfTier(), loop: true })
    }

    // ─────────────────────────────────────────────────────────────────────
    // PRM safety net (D5-08) — aborta cualquier tween no-guardado.
    // ─────────────────────────────────────────────────────────────────────

    if (prefersReduced) {
      this.tweens.timeScale = 0
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // update — loop de frame (ERA-AGNT-03 + ERA-AGNT-04).
  //
  // Sin check de document.hidden: Phaser gestiona el throttling de tab
  // internamente vía visibilitychange. El check bloqueaba update() cuando el
  // OS tenía el foco en otra ventana (case habitual en dev).
  // ─────────────────────────────────────────────────────────────────────────

  update() {
    // Shader parallax: enviar posición de cámara al uniform scrollY.
    if (this._spaceShader && this.cameras && this.cameras.main) {
      try {
        this._spaceShader.setUniform('scrollY', this.cameras.main.scrollY)
      } catch (_) {
        // Shader destruido tras stop/start — se reemplaza en el próximo create().
        this._spaceShader = null
      }
    }

    // ASCII PostFX: uTime vivo (para el wipe fBm y el jitter binario), salvo PRM
    // (que congela el shader en un estado estático, spec §8).
    if (this._asciiPipeline && !this._prefersReduced) {
      this._asciiPipeline.uTime = this.time.now / 1000
    }

    // Filamento neural (spec §6.2) — cursor-estrella compartido.
    if (this._prefersReduced || !this._filamentGfx) return

    const now = this.time.now
    const g   = this._filamentGfx
    g.clear()

    // Trazas base tenues de AMBAS curvas (Rafael→cursor, robot→cursor).
    g.lineStyle(1, 0x4dffff, 0.12)
    ;[this._filamentCurveHuman, this._filamentCurveRobot].forEach((curve) => {
      const pts = curve.getPoints(24)
      g.beginPath()
      g.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y)
      g.strokePath()
    })

    // Generar nueva partícula cada ~280ms (bidireccional, max 12 simultáneas,
    // alternando el origen entre Rafael y el robot — "los dos escriben en el
    // mismo cursor", spec §6.2).
    if (now - this._lastSynapseTime > 280 && this._filamentParticles.length < 12) {
      this._lastSynapseTime = now
      const forward = Math.random() > 0.45
      const fromRobot = Math.random() > 0.5
      this._filamentParticles.push({
        t: forward ? 0 : 1,
        dir: forward ? 1 : -1,
        speed: 0.006 + Math.random() * 0.004,
        curve: fromRobot ? this._filamentCurveRobot : this._filamentCurveHuman,
      })
    }

    // Avanzar, dibujar y filtrar partículas muertas.
    this._filamentParticles = this._filamentParticles.filter((p) => {
      p.t += p.dir * p.speed
      if (p.t < 0 || p.t > 1) return false
      const pos  = p.curve.getPoint(p.t)
      const fade = Math.min(p.t / 0.1, (1 - p.t) / 0.1, 1)
      g.fillStyle(0x4dffff, Math.min(fade * 0.85, 0.85))
      g.fillRect(Math.round(pos.x) - 1, Math.round(pos.y) - 1, 3, 3)
      return true
    })
  }

  /**
   * Bridge DOM → Phaser (spec §4.2/§4.4) — el timeline de la conversación DOM
   * emite el progreso del takeover ASCII. El DOM manda; Phaser solo aplica los
   * uniforms al pipeline si existe (null-guard PHA-06).
   * @param {{mix?: number, mode?: number, tint?: number}} progress
   */
  handleAsciiProgress(progress = {}) {
    if (!this._asciiPipeline || this._prefersReduced) return
    if (typeof progress.mix === 'number') this._asciiPipeline.uMix = progress.mix
    if (typeof progress.mode === 'number') this._asciiPipeline.uMode = progress.mode
    if (typeof progress.tint === 'number') this._asciiPipeline.uTint = progress.tint
  }

  /**
   * Bridge DOM → Phaser (spec §6.2) — cada token de la respuesta IA dispara un
   * destello de 80ms en el cursor-estrella. Throttled a max 6/s para no saturar
   * tweens durante bursts de streaming.
   */
  handleTokenTick() {
    if (!this._cursorStar || this._prefersReduced) return
    const now = this.time.now
    if (now - this._lastTokenFlash < 1000 / 6) return
    this._lastTokenFlash = now
    this.tweens.add({
      targets: this._cursorStar,
      alpha: 1,
      scale: 1.6,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    })
  }

  /**
   * Escalera de performance (spec §8) — promedio de game.loop.actualFps.
   * Tier A→B→C solo degrada espectáculo (ascii cell size + bg octaves); el
   * cierre narrativo vive en DOM así que nunca se pierde significado.
   */
  _evaluatePerfTier() {
    const fps = this.game?.loop?.actualFps ?? 60
    if (fps < 35) {
      this._perfLowStreak += 1
    } else {
      this._perfLowStreak = 0
    }

    let nextTier = this._perfTier
    if (this._perfLowStreak >= 2) {
      nextTier = 'C'
    } else if (fps < 50) {
      nextTier = 'B'
    } else {
      nextTier = 'A'
    }
    if (nextTier === this._perfTier) return
    this._perfTier = nextTier

    if (this._spaceShader) {
      try {
        this._spaceShader.setUniform('uOct', nextTier === 'A' ? 3.0 : 2.0)
      } catch (_) { /* shader destruido, no-op */ }
    }
    if (this._asciiPipeline) {
      if (nextTier === 'C') {
        this.cameras.main.resetPostPipeline()
        this._asciiPipeline = null
      } else {
        this._asciiPipeline.uCell = nextTier === 'A' ? 8 : 12
      }
    }
  }

  handleLocaleChange(_locale) {
    this.tooltipTexts.forEach(({ tooltip, titleKey }) => {
      if (tooltip && tooltip.visible) {
        tooltip.setText(i18n.global.t(titleKey))
      }
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers privados
  // ─────────────────────────────────────────────────────────────────────────

  _buildShaderBackground(prefersReduced) {
    const hasWebGL = this.game.renderer && this.game.renderer.gl
    if (!hasWebGL) {
      this._buildCanvasStarfield()
      return
    }
    try {
      const baseShader = new Phaser.Display.Shaders.BaseShader(
        'spaceBg',
        SPACE_BG_FRAG,
        null,
        { scrollY: { type: '1f', value: 0.0 }, uOct: { type: '1f', value: 3.0 } }
      )
      // Shader en camera-space (scrollFactor 0), depth 2, blend NORMAL.
      // NORMAL = el shader ES el fondo completo, no un ADD overlay sobre raster.
      const sh = this.add.shader(baseShader, BASE_W / 2, BASE_H / 2, BASE_W, BASE_H)
      sh.setScrollFactor(0).setDepth(2).setBlendMode(Phaser.BlendModes.NORMAL)
      this._spaceShader = sh
      // Bajo PRM: congelar el tiempo del shader (no hay twinkle/drift).
      if (prefersReduced) {
        sh.setUniform('time', 0.5)
      }
    } catch (_) {
      this._buildCanvasStarfield()
    }
  }

  _buildCanvasStarfield() {
    // Canvas2D fallback (sin WebGL) — gradiente base + stars determinísticas.
    // raster ch6-bg NO se renderiza aquí; el fallback tiene pleno control.
    const g = this.add.graphics().setScrollFactor(0).setDepth(2)

    // Gradiente base aproximado con 8 bandas rectangulares (#1a0e3d → #06010f).
    const BANDS = 8
    for (let i = 0; i < BANDS; i++) {
      const t = i / (BANDS - 1)
      const r  = Math.round((0.102 - 0.078 * t) * 255)
      const gc = Math.round((0.055 - 0.051 * t) * 255)
      const b  = Math.round((0.239 - 0.180 * t) * 255)
      g.fillStyle((r << 16) | (gc << 8) | b, 1)
      g.fillRect(0, Math.round(i * BASE_H / BANDS), BASE_W, Math.ceil(BASE_H / BANDS))
    }

    // Stars determinísticas (semilla fija, sin azar de sesión).
    let s = 42
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
    for (let i = 0; i < 220; i++) {
      g.fillStyle(0xffffff, 0.3 + rng() * 0.7)
      g.fillRect(Math.round(rng() * BASE_W), Math.round(rng() * BASE_H), 1, 1)
    }
    for (let i = 0; i < 22; i++) {
      g.fillStyle(0xffffff, 0.6 + rng() * 0.4)
      g.fillRect(Math.round(rng() * BASE_W), Math.round(rng() * BASE_H), 2, 2)
    }
  }

  _buildHolographicRing(prefersReduced) {
    const ring = this.add.graphics().setDepth(8).setScrollFactor(1.0)
    ring.lineStyle(8, 0x4dffff, 0.04)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)
    ring.lineStyle(4, 0x4dffff, 0.14)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)
    ring.lineStyle(1, 0x4dffff, 0.92)
    ring.strokeEllipse(RING_CX, RING_CY, RING_OA * 2, RING_OB * 2)
    ring.lineStyle(1, 0x4dffff, 0.52)
    ring.strokeEllipse(RING_CX, RING_CY, RING_IA * 2, RING_IB * 2)
    const strutCount = 16
    // Struts pendientes (rosa, i%4==0) — spec §6.1: el unísono los completa a
    // cuatro manos. Se guardan los ángulos para que _buildUnisonStruts() dibuje
    // los overlays cian + haces de convergencia sobre las mismas coordenadas.
    this._pendingStrutAngles = []
    for (let i = 0; i < strutCount; i++) {
      const angle = (i / strutCount) * Math.PI * 2
      const built = i % 4 !== 0
      ring.lineStyle(1, built ? 0x4dffff : 0xff3ca6, built ? 0.62 : 0.32)
      ring.lineBetween(
        RING_CX + Math.cos(angle) * RING_OA, RING_CY + Math.sin(angle) * RING_OB,
        RING_CX + Math.cos(angle) * RING_IA, RING_CY + Math.sin(angle) * RING_IB
      )
      if (!built) this._pendingStrutAngles.push(angle)
    }
    ring.lineStyle(1, 0xffd95c, 0.20)
    ring.lineBetween(RING_CX, RING_CY - RING_OB - 30, RING_CX, RING_CY + RING_OB + 30)
    ring.lineBetween(RING_CX - RING_OA - 24, RING_CY, RING_CX + RING_OA + 24, RING_CY)
    ring.lineStyle(1, 0xffd95c, 0.38)
    for (let t = 1; t <= 4; t++) {
      const tx = RING_CX + (t / 4) * RING_OA
      ring.lineBetween(tx, RING_CY - 4, tx, RING_CY + 4)
      ring.lineBetween(RING_CX - (t / 4) * RING_OA, RING_CY - 4, RING_CX - (t / 4) * RING_OA, RING_CY + 4)
    }
    if (prefersReduced) {
      ring.setAlpha(0.85)
    } else {
      ring.setAlpha(0.75)
      this.tweens.add({ targets: ring, alpha: 1.0, duration: 3400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
    }
  }

  /**
   * TASK-012 (spec §6.1) — struts del anillo a cuatro manos. Reemplaza
   * _buildConstructionBeams (láseres dron→anillo unidireccionales, retirado):
   * ahora cada strut PENDIENTE (rosa) se completa con DOS haces simultáneos,
   * uno desde el robot y uno desde Rafael, convergiendo sobre el mismo punto.
   * Este método solo construye los objetos gráficos (overlay + haces, todos
   * en alpha 0 salvo PRM); _startUnisonTimeline() los anima 300ms después
   * del arrival (spec §3, Acto 2).
   */
  _buildUnisonStruts(prefersReduced) {
    this._unisonStruts = (this._pendingStrutAngles || []).map((angle) => {
      const outer = {
        x: RING_CX + Math.cos(angle) * RING_OA,
        y: RING_CY + Math.sin(angle) * RING_OB,
      }
      const inner = {
        x: RING_CX + Math.cos(angle) * RING_IA,
        y: RING_CY + Math.sin(angle) * RING_IB,
      }
      const drawOverlay = (gfx, lineWidth) => {
        gfx.clear()
        gfx.lineStyle(lineWidth, 0x4dffff, 0.9)
        gfx.lineBetween(outer.x, outer.y, inner.x, inner.y)
      }
      const overlay = this.add.graphics().setDepth(8.5).setScrollFactor(1.0).setAlpha(0)
      drawOverlay(overlay, 1)

      const beamRobot = this.add.graphics().setDepth(9).setScrollFactor(1.0).setAlpha(0)
      beamRobot.lineStyle(1, 0x4dffff, 1)
      beamRobot.lineBetween(UNISON_ROBOT_PT.x, UNISON_ROBOT_PT.y, outer.x, outer.y)

      const beamRafael = this.add.graphics().setDepth(9).setScrollFactor(1.0).setAlpha(0)
      beamRafael.lineStyle(1, 0x4dffff, 1)
      beamRafael.lineBetween(UNISON_RAFAEL_PT.x, UNISON_RAFAEL_PT.y, outer.x, outer.y)

      return { overlay, beamRobot, beamRafael, drawOverlay }
    })

    if (prefersReduced) {
      // PRM (spec §6.1): "todos los struts ya en cian desde create, haces
      // estáticos al 0.22" — sin timeline, resultado final ya presente.
      this._unisonStruts.forEach(({ overlay, beamRobot, beamRafael }) => {
        overlay.setAlpha(1)
        beamRobot.setAlpha(0.22)
        beamRafael.setAlpha(0.22)
      })
    }
  }

  /**
   * Acto 2 del unísono (spec §3 + §6.1) — arranca 300ms tras arrival-complete.
   * Cadencia: un strut cada 1.4s, 4 struts, ~6s total. Cuando ambos haces
   * (robot + Rafael) tocan el strut, éste pasa de rosa a cian con un pulso
   * breve de 2px extra de grosor.
   */
  _startUnisonTimeline() {
    if (this._prefersReduced || !this._unisonStruts) return
    this._unisonStruts.forEach(({ overlay, beamRobot, beamRafael, drawOverlay }, idx) => {
      this.time.addEvent({
        delay: idx * 1400,
        callback: () => {
          this.tweens.add({
            targets: [beamRobot, beamRafael],
            alpha: 0.6,
            duration: 600,
            ease: 'Sine.easeOut',
            onComplete: () => {
              // El strut cambia rosa → cian con un pulso de 2px extra de grosor.
              drawOverlay(overlay, 3)
              overlay.setAlpha(1)
              this.time.addEvent({
                delay: 150,
                callback: () => drawOverlay(overlay, 1),
              })
              // Los haces decantan en una oscilación tenue persistente — "vida
              // de fondo" del trabajo ya terminado (rima con el patrón retirado
              // de _buildConstructionBeams).
              this.tweens.add({
                targets: [beamRobot, beamRafael],
                alpha: 0.3,
                duration: 1400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
              })
            },
          })
        },
      })
    })
  }

  /**
   * Filamento neural (spec §6.2) — DOS curvas bezier (Rafael→cursor,
   * robot→cursor) convergiendo en el cursor-estrella compartido: "los dos
   * escriben en el mismo cursor". Reemplaza la curva única Rafael→robot.
   */
  _initNeuralFilament(prefersReduced) {
    this._filamentCurveHuman = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(FILAMENT_HUMAN_P0.x, FILAMENT_HUMAN_P0.y),
      new Phaser.Math.Vector2(FILAMENT_HUMAN_P1.x, FILAMENT_HUMAN_P1.y),
      new Phaser.Math.Vector2(FILAMENT_HUMAN_P2.x, FILAMENT_HUMAN_P2.y),
      new Phaser.Math.Vector2(CURSOR_STAR.x, CURSOR_STAR.y)
    )
    this._filamentCurveRobot = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(FILAMENT_ROBOT_P0.x, FILAMENT_ROBOT_P0.y),
      new Phaser.Math.Vector2(FILAMENT_ROBOT_P1.x, FILAMENT_ROBOT_P1.y),
      new Phaser.Math.Vector2(FILAMENT_ROBOT_P2.x, FILAMENT_ROBOT_P2.y),
      new Phaser.Math.Vector2(CURSOR_STAR.x, CURSOR_STAR.y)
    )
    this._filamentGfx = this.add.graphics().setDepth(36).setScrollFactor(1.0)
    if (prefersReduced) {
      this._filamentGfx.lineStyle(1, 0x4dffff, 0.18)
      ;[this._filamentCurveHuman, this._filamentCurveRobot].forEach((curve) => {
        const pts = curve.getPoints(24)
        this._filamentGfx.beginPath()
        this._filamentGfx.moveTo(pts[0].x, pts[0].y)
        for (let i = 1; i < pts.length; i++) this._filamentGfx.lineTo(pts[i].x, pts[i].y)
        this._filamentGfx.strokePath()
      })
    }

    // Cursor-estrella compartido (spec §6.2) — cuadrado 6x6 cian, depth 37.
    this._cursorStar = this.add
      .rectangle(CURSOR_STAR.x, CURSOR_STAR.y, 6, 6, 0x4dffff)
      .setDepth(37)
      .setScrollFactor(1.0)
    if (prefersReduced) {
      this._cursorStar.setAlpha(0.9)
    } else {
      this._cursorStar.setAlpha(0.7)
      this.tweens.add({
        targets: this._cursorStar,
        alpha: 1,
        scale: 1.3,
        duration: 900,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
    }
  }

  _buildDeliveryBots(prefersReduced) {
    // Genera la textura del bot Amazon una sola vez (guarda en texture cache).
    // Dibujado a 20×16 px lógicos — setScale(2) da aspecto chunky coherente
    // con los drones de la escena (HI-BIT-01).
    if (!this.textures.exists('bot-amazon')) {
      const g = this.add.graphics()
      // Rotores: dos barras grises horizontales arriba
      g.fillStyle(0x888888, 1)
      g.fillRect(2, 0, 5, 1)
      g.fillRect(13, 0, 5, 1)
      // Brazos de rotor (1px vertical)
      g.fillRect(4, 1, 1, 2)
      g.fillRect(14, 1, 1, 2)
      // Luz de navegación cian
      g.fillStyle(0x4dffff, 1)
      g.fillRect(9, 0, 2, 1)
      // Tapa de la caja (tono ligeramente más claro)
      g.fillStyle(0xc8a070, 1)
      g.fillRect(3, 3, 14, 1)
      // Cara principal de la caja — tan #b58a54
      g.fillStyle(0xb58a54, 1)
      g.fillRect(3, 4, 11, 8)
      // Cara lateral sombra — #8a6438
      g.fillStyle(0x8a6438, 1)
      g.fillRect(14, 4, 3, 8)
      // Franja inferior de la caja
      g.fillStyle(0xb58a54, 1)
      g.fillRect(3, 12, 14, 1)
      // Sonrisa-flecha Prime: arco de 5px en naranja #ff9900
      g.fillStyle(0xff9900, 1)
      g.fillRect(5, 8, 1, 1)
      g.fillRect(6, 9, 2, 1)
      g.fillRect(8, 9, 2, 1)
      g.fillRect(10, 8, 1, 1)
      // Patas de aterrizaje (2px tall)
      g.fillStyle(0x888888, 1)
      g.fillRect(5, 13, 1, 2)
      g.fillRect(12, 13, 1, 2)
      g.generateTexture('bot-amazon', 20, 16)
      g.destroy()
    }

    // Textura del bot Uber — courier compacto negro con franja verde Eats.
    if (!this.textures.exists('bot-uber')) {
      const g = this.add.graphics()
      // Cuerpo compacto negro #141414
      g.fillStyle(0x141414, 1)
      g.fillRect(3, 2, 14, 10)
      // Placa frontal: panel gris claro
      g.fillStyle(0x2a2a2a, 1)
      g.fillRect(4, 3, 12, 3)
      // Franja verde Uber Eats #06c167
      g.fillStyle(0x06c167, 1)
      g.fillRect(3, 7, 14, 2)
      // Luces laterales verdes (1px × 2px)
      g.fillRect(3, 4, 1, 2)
      g.fillRect(16, 4, 1, 2)
      // Bolsa térmica verde colgando debajo
      g.fillStyle(0x058050, 1)
      g.fillRect(6, 12, 8, 3)
      g.fillStyle(0x06c167, 1)
      g.fillRect(7, 13, 6, 1)
      // Correas de la bolsa
      g.fillStyle(0x333333, 1)
      g.fillRect(8, 11, 1, 1)
      g.fillRect(11, 11, 1, 1)
      g.generateTexture('bot-uber', 20, 16)
      g.destroy()
    }

    // Posiciones en world-space (scrollFactor 1.0), banda y 1350-1890 (vista postal).
    // Uber 1 evita la zona x 150-350 en y 1600-1800 donde están los héroes.
    const DELIVERY_BOT_DEFS = [
      // Amazon 1: travesía horizontal lenta tipo ruta de reparto
      { key: 'bot-amazon', x: 750, y: 1430, yA: 10, yD: 2800, xA: 80,  xD: 7000, aA: 0, aD: 0    },
      // Amazon 2: hover con bob vertical
      { key: 'bot-amazon', x: 560, y: 1490, yA: 14, yD: 3200, xA: 40,  xD: 5500, aA: 2, aD: 4200 },
      // Uber 1: patrulla plataforma (x 600-700, y 1720 — fuera de zona héroes)
      { key: 'bot-uber',   x: 700, y: 1720, yA: 8,  yD: 2400, xA: 100, xD: 6000, aA: 0, aD: 0    },
      // Uber 2: banda media entre drones existentes (~y 1450)
      { key: 'bot-uber',   x: 450, y: 1450, yA: 12, yD: 2600, xA: 60,  xD: 4800, aA: 2, aD: 5000 },
    ]

    DELIVERY_BOT_DEFS.forEach((def) => {
      const bot = this.add
        .image(def.x, def.y, def.key)
        .setScale(2)
        .setDepth(25)
        .setScrollFactor(1.0)
      if (!prefersReduced) {
        this.tweens.add({ targets: bot, y: def.y - def.yA, duration: def.yD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        this.tweens.add({ targets: bot, x: def.x + def.xA, duration: def.xD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        if (def.aA > 0) {
          this.tweens.add({ targets: bot, angle: def.aA, duration: def.aD, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 })
        }
      }
    })
  }

  _renderProceduralPlanet(projId, cx, cy, radius = PLANET_R) {
    const g = this.add.graphics().setScrollFactor(1.0).setDepth(21)
    const r = radius

    if (projId.includes('ar-vr')) {
      g.fillStyle(0x031318, 1)
      g.fillCircle(cx, cy, r)
      for (let k = -2; k <= 2; k++) {
        const dy = k * (r / 2.6)
        const rx = Math.sqrt(Math.max(0, r * r - dy * dy))
        if (rx > 4) {
          g.lineStyle(1, 0x4dffff, 0.48 - Math.abs(k) * 0.06)
          g.strokeEllipse(cx, cy + dy, rx * 2, rx * 0.35)
        }
      }
      for (let k = -2; k <= 2; k++) {
        const dx = k * (r / 2.6)
        const ry = Math.sqrt(Math.max(0, r * r - dx * dx))
        if (ry > 4) {
          g.lineStyle(1, 0x4dffff, 0.20)
          g.strokeEllipse(cx + dx * 0.28, cy, Math.abs(dx) * 0.22 + 3, ry * 2)
        }
      }
      g.fillStyle(0xffd95c, 0.92)
      g.fillRect(cx - 2, cy - r + 7, 4, 4)
      g.lineStyle(1, 0xffd95c, 0.52)
      g.strokeEllipse(cx, cy - r + 14, 24, 6)
      g.lineStyle(3, 0x4dffff, 0.07)
      g.strokeCircle(cx, cy, r + 8)

    } else if (projId.includes('remoose')) {
      g.fillStyle(0x0d0318, 1)
      g.fillCircle(cx, cy, r)
      g.fillStyle(0x5c0e45, 0.68)
      g.fillCircle(cx - 15, cy - 9, 25)
      g.fillStyle(0x3c0828, 0.54)
      g.fillCircle(cx + 19, cy + 8, 20)
      g.fillStyle(0x6c185a, 0.40)
      g.fillCircle(cx + 4, cy - 31, 14)
      g.lineStyle(1, 0x8a2068, 0.48)
      g.strokeEllipse(cx - 7, cy, 16, r * 2)
      const cityLights = [[cx - 14, cy - 8], [cx + 17, cy + 6], [cx + 2, cy - 30]]
      cityLights.forEach(([lx, ly]) => {
        g.fillStyle(0xffd95c, 1)
        g.fillRect(lx - 1, ly - 1, 2, 2)
      })
      g.lineStyle(3, 0x8a2068, 0.09)
      g.strokeCircle(cx, cy, r + 7)

    } else {
      g.fillStyle(0x011010, 1)
      g.fillCircle(cx, cy, r)
      const nodes = [
        [cx - 26, cy - 16], [cx + 16, cy - 36],
        [cx + 30, cy + 7],  [cx - 7,  cy + 30],
        [cx - 34, cy + 14], [cx + 3,  cy + 2],
        [cx - 12, cy - 44], [cx + 0,  cy - 14],
      ]
      const maxD2 = (r * 0.56) * (r * 0.56)
      g.lineStyle(1, 0x4dffff, 0.36)
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const dx = nodes[a][0] - nodes[b][0]
          const dy = nodes[a][1] - nodes[b][1]
          if (dx * dx + dy * dy < maxD2) g.lineBetween(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1])
        }
      }
      nodes.forEach(([nx, ny]) => {
        if ((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy) <= r * r * 0.9) {
          g.fillStyle(0x4dffff, 0.92)
          g.fillRect(nx - 2, ny - 2, 4, 4)
        }
      })
      g.fillStyle(0x18e8e8, 0.10)
      g.fillCircle(cx, cy, 22)
      g.lineStyle(3, 0x4dffff, 0.07)
      g.strokeCircle(cx, cy, r + 8)
    }
  }
}
