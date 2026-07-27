<!--
  Ch4PortalShader.vue — El salto entre realidades (TASK-010, rediseño total).

  Fuente de verdad: .planning/design/04-ch4-salto-entre-realidades.md.
  Reemplaza el shader single-pass aditivo (320x180, mix-blend-mode:screen,
  portal-como-disco-2D) por un pipeline WebGL1 multi-pass a resolución real:

    PASS A "mundo"  → FBO_A (media res): túnel raymarcheado (24/16/0 pasos según
                       tier), nebulosa por domain warping, starfield 3 planos con
                       parallax real, suelo holográfico perspectivo, lensing.
    PASS B "eco"    → FBO_B[i] (media res, ping-pong): feedback buffer — decay
                       casi nulo en régimen normal, sube durante el frente de
                       onda para dejar un rastro de la realidad anterior.
    PASS C "óptica" → canvas (resolución completa, dpr≤1.5): godrays screen-space
                       desde el portal, barrel distortion (Brown-Conrady), CA por
                       canal, lente reveladora Sobel (círculo que sigue al puntero
                       con inercia, wireframe de la realidad SIGUIENTE — spec §4.6,
                       tiers HIGH/MED), viñeta binocular (se funde a óvalo único en
                       mobile portrait), grain, screen-door sutil (solo tier HIGH).

  El canvas es OPAQUO (ya no aditivo): es el fondo real del capítulo, y las capas
  DOM (matrix/glifos/personaje/near/HUD) quedan encima por z-index — oclusión
  correcta en vez de blend aditivo que no ocluye nada.

  Tiers HIGH/MED/LOW: detección de capacidad al init (hardwareConcurrency Y
  deviceMemory, ambos ≥8 para HIGH — endurecido tras la lente sumar costo al
  Pass C; renderer por software, mobile) + adaptación por media móvil del frame
  time (90 frames), con histéresis (baja libre, sube solo tras 10s <12ms, máximo
  un cambio cada 15s). Override de debug: ?ch4tier=HIGH|MED|LOW. El tier activo
  se emite por `tier-change` y se refleja en `canvas.dataset.ch4Tier` — Chapter4Content
  lo usa para el blur DOM de profundidad de campo (spec §4.8, solo HIGH) y es el
  hook observable para verificar en vivo la baja/subida automática.

  Coreografía de entrada ("ponerse el visor"): 4 beats (BOOT/OPEN/BURST/LOCK,
  0-1900ms) en la primera entrada a ch4 de la sesión; reentradas usan una
  versión corta (700ms). Los uniforms de óptica (viñeta/barrel/CA/godrays) se
  computan internamente por beat — el emit `jump-progress` es solo para que
  Chapter4Content orqueste su propia coreografía DOM (HUD/paneles), sin
  duplicar el timer.

  PRM: UN solo render estático en t=7.3 (respiración del portal en máximo,
  suelo bien compuesto), viñeta abierta, sin warp, sin eco — bello, no vacío.
  Sin RAF loop; re-render solo en resize.

  Se conserva del shader anterior: UNIVERSES como single source of truth
  (ahora con tunnelDensity/warpAmp por universo), el ciclo 12-18s con jitter,
  el evento `universe-change`, el lifecycle (RAF solo con activeChapter===4,
  cleanup, HMR dispose, webglcontextlost), el whoosh de audio.
-->
<script>
// ── Universos — SINGLE SOURCE OF TRUTH ────────────────────────────────────
// tunnelDensity/warpAmp (TASK-010, spec §3.3): modulan el volumen del túnel
// raymarcheado y la amplitud de la distorsión del frente de onda por universo.
// edgeTint (spec §3.3/§4.6): color del wireframe que la lente reveladora
// pinta al mostrar la realidad SIGUIENTE — versión aclarada (mix 40% blanco)
// del colVortex de cada universo, para que el wireframe se lea distinto del
// resto de la escena en vez de fundirse con ella.
export const UNIVERSES = [
  {
    id: 0,
    name: 'synthwave',
    colVortex: [0.0,  1.0,  0.95],
    colRing:   [1.0,  0.05, 0.85],
    colStar:   [0.75, 0.88, 1.0 ],
    colBg:     [0.0,  0.005,0.02 ],
    edgeTint:  [0.4,  1.0,  0.97],
    tunnelDensity: 1.0,
    warpAmp: 1.0,
  },
  {
    id: 1,
    name: 'tron',
    colVortex: [0.0,  1.0,  0.3 ],
    colRing:   [0.2,  0.9,  0.15],
    colStar:   [0.55, 1.0,  0.6 ],
    colBg:     [0.0,  0.015,0.0 ],
    edgeTint:  [0.4,  1.0,  0.58],
    tunnelDensity: 1.15,
    warpAmp: 0.85,
  },
  {
    id: 2,
    name: 'vaporwave',
    colVortex: [0.88, 0.38, 1.0 ],
    colRing:   [0.18, 0.88, 0.82],
    colStar:   [1.0,  0.72, 0.9 ],
    colBg:     [0.02, 0.0,  0.03],
    edgeTint:  [0.93, 0.63, 1.0 ],
    tunnelDensity: 0.85,
    warpAmp: 1.1,
  },
  {
    id: 3,
    name: 'void',
    colVortex: [0.78, 0.0,  0.04],
    colRing:   [0.38, 0.0,  0.02],
    colStar:   [1.0,  0.28, 0.28],
    colBg:     [0.02, 0.0,  0.0 ],
    edgeTint:  [0.87, 0.4,  0.42],
    tunnelDensity: 1.3,
    warpAmp: 1.35,
  },
]

// ── Config por tier (spec §7.3) ─────────────────────────────────────────────
// steps: pasos del raymarch del túnel (Pass A). oct: octavas de fbm (Pass A).
// taps: taps de los godrays (Pass C). sde: screen-door effect (Pass C).
// lens: lente reveladora Sobel (Pass C, spec §4.6/§7.3, 9 taps) — presente en
// HIGH/MED, ausente en LOW (matriz de tiers, spec §7.3).
//
// HIGH.steps baja de 24 a 20 y HIGH.taps de 24 a 14 (TASK-010, ronda de
// completado): con la lente Sobel sumando 9 taps al Pass C, HIGH no sostenía
// 60fps medidos con GPU real (55.9fps, degradando a 35fps — ver hand-off).
// Recalibrado con la lente ya integrada, no antes. Medido en esta ronda: los
// taps de godrays pesan más que los pasos de raymarch porque Pass C corre a
// resolución COMPLETA del canvas (Pass A corre a media res) — cada tap de
// godrays cuesta ~4x lo que un paso de raymarch en este canvas (halfW/halfH
// vs fullW/fullH). Bajar taps fue la palanca con más retorno real.
export const TIER_CONFIG = {
  LOW:  { steps: 0,  oct: 2, taps: 0,  sde: false, lens: false },
  MED:  { steps: 16, oct: 3, taps: 12, sde: false, lens: true  },
  HIGH: { steps: 20, oct: 4, taps: 14, sde: true,  lens: true  },
}
const TIER_ORDER = ['LOW', 'MED', 'HIGH']

// ── Lente reveladora (spec §4.6) ────────────────────────────────────────────
// LOW (ronda de corrección TASK-010): antes esta constante estaba muerta —
// el radio real vivía hardcodeado por triplicado en el GLSL de opticsFragSrc
// (era una trampa para el próximo que la tocara). Ahora se inyecta como
// ${LENS_R} directo en el template literal del shader (ver opticsFragSrc,
// spec §4.6) — esta declaración es la ÚNICA fuente de verdad.
const LENS_R            = 0.14   // radio del círculo, en espacio p (aspect-corregido)
const LENS_LERP         = 0.06   // inercia: fracción de la distancia recorrida por frame
const LENS_ORBIT_PERIOD_S = 23   // mobile sin puntero: período de la órbita lissajous
const LENS_ORBIT_R      = 0.20   // mobile sin puntero: radio de la órbita alrededor del portal

// ── Coreografía de entrada (spec §6) ────────────────────────────────────────
const BEATS_FULL_MS  = 1900
const BEATS_SHORT_MS = 700
const BEATS_FULL  = [
  { name: 'boot',  end: 350  },
  { name: 'open',  end: 900  },
  { name: 'burst', end: 1400 },
  { name: 'lock',  end: 1900 },
]
const BEATS_SHORT = [
  { name: 'burst', end: 300 },
  { name: 'lock',  end: 700 },
]

// Reposo (post-LOCK): viñeta abierta, barrel asentado, CA mínima, godrays x1.
const OPTICS_REST = { vignette: 1, k1: 0.07, k2: 0.02, caAmt: 0.0035, godraysExposure: 1 }

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3)

function beatOf(elapsedMs, table) {
  for (const b of table) if (elapsedMs <= b.end) return b.name
  return table[table.length - 1].name
}

// Uniforms de óptica durante la secuencia BOOT completa (primera entrada).
function opticsBootFull(ms) {
  if (ms <= 350) return { vignette: 0.02, k1: 0.30, k2: 0.05, caAmt: 0.0035, godraysExposure: 0.0 }
  if (ms <= 900) {
    const e = easeOutCubic((ms - 350) / (900 - 350))
    const caPeak = ms < 400 ? lerp(0.0035, 0.02, clamp01((ms - 350) / 50)) : lerp(0.02, 0.0035, clamp01((ms - 400) / 500))
    return { vignette: e, k1: lerp(0.30, 0.07, e), k2: lerp(0.05, 0.02, e), caAmt: caPeak, godraysExposure: e * 0.6 }
  }
  if (ms <= 1400) {
    const e = easeOutCubic((ms - 900) / 400)
    return { vignette: 1, k1: 0.07, k2: 0.02, caAmt: 0.0035, godraysExposure: lerp(3, 1, e) }
  }
  return OPTICS_REST
}

// Uniforms de óptica durante la secuencia corta de reentrada.
function opticsBootShort(ms) {
  if (ms <= 300) {
    const e = easeOutCubic(ms / 300)
    return { vignette: 1, k1: 0.07, k2: 0.02, caAmt: lerp(0.01, 0.0035, e), godraysExposure: lerp(1.8, 1, e) }
  }
  return OPTICS_REST
}
</script>

<script setup>
import { ref, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { whoosh } from '@/audio/sfx.js'

// ── Timing del ciclo de universo ────────────────────────────────────────────
const FIRST_SHIFT_MS  = 8000
const MIN_SHIFT_MS    = 12000
const MAX_SHIFT_MS    = 18000
const WARP_DURATION_S = 1.2
const WARP_MAX_R      = 1.5
const WARP_ECHO_MS    = 600   // release del feedback tras el paso de la onda

// ── Inject ───────────────────────────────────────────────────────────────────
const injectedScrollState = inject('scrollState', null)
const injectedPrm         = inject('prm',         null)
const activeChapter  = injectedScrollState?.activeChapter ?? ref(-1)
const prefersReduced = injectedPrm?.prefersReduced         ?? ref(false)
const reduced = () => prefersReduced.value

// ── Emits ────────────────────────────────────────────────────────────────────
// universe-change: al cruzar el midpoint de la onda (igual que antes).
// jump-progress: durante la coreografía de entrada, para que Chapter4Content
// orqueste HUD/paneles sin duplicar el timer (spec §3.3, §6).
// tier-change: cada vez que el tier activo cambia (detección inicial,
// software-renderer, o adaptación por frame time) — Chapter4Content lo usa
// para activar el blur DOM de profundidad de campo (spec §4.8, solo HIGH), y
// es la señal observable para verificar en vivo que la baja automática de
// tier realmente ocurre bajo carga sostenida (round de completado TASK-010).
const emit = defineEmits(['universe-change', 'jump-progress', 'tier-change'])

// ── Vue state ────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const supported = ref(true)

// ── WebGL state — NUNCA vue-reactive ─────────────────────────────────────────
let gl = null
let quadBuf = null
// Programas por pass. Pass A y Pass C tienen 3 variantes (una por tier),
// compiladas al init (spec §7.4: "sin recompilar en caliente"). Pass B es
// única (el feedback no varía de costo entre tiers, solo de intensidad).
const progWorld  = { LOW: null, MED: null, HIGH: null }
const progOptics = { LOW: null, MED: null, HIGH: null }
let progFeedback = null
let uWorld = {}, uFeedback = {}, uOptics = {}

let fboWorld = null      // { fbo, tex } — Pass A, media res
let fboFeedback = [null, null] // ping-pong Pass B, media res
let fbIdx = 0
let halfW = 1, halfH = 1
let fullW = 1, fullH = 1

// ── RAF / estado de loop ──────────────────────────────────────────────────────
let rafId = 0
let startTime = 0
let running = false
let ptrMx = 0, ptrMy = 0
let driftX = 0, driftY = 0
let stopWatcher = null
let resizeTimer = 0

// ── Estado del multiverso ───────────────────────────────────────────────────
let universeIdx     = 0
let nextUniverseIdx = 0
let warpActive      = false
let warpStartTs     = 0
let warpEndTs        = null
let nextShiftAt     = Infinity
let midpointEmitted = false
let currentWarpR    = 0.0

// ── Estado de coreografía de entrada ────────────────────────────────────────
let hasBootedOnce = false
let jumpStartTs = null
let jumpTotalMs = BEATS_FULL_MS
let jumpTable = BEATS_FULL
let jumpActive = false

// ── Tier: detección + adaptación ────────────────────────────────────────────
let currentTier = 'MED'
let tierForcedByDebug = false
let frameDeltas = []
let lastTierChangeTs = 0
let goodStreakStartTs = null
let lastFrameTs = 0

// ── Responsive: portal + fusión de la viñeta ────────────────────────────────
let portalUV = [0.81, 0.75]
let vignetteMerge = 0

// ── Lente reveladora: posición con inercia (spec §4.6) ──────────────────────
let lensX = 0
let lensY = 0

// LOW (ronda de corrección TASK-010): MediaQueryList cacheado — antes
// updateLens() llamaba window.matchMedia('(pointer: coarse)') en CADA frame
// del RAF loop, violando la higiene de "cero allocaciones por frame" (spec
// §7.5). detectInitialTier() ya es el primer consumidor (corre una sola vez
// en initGL); getCoarsePointerMql() lo memoiza ahí y updateLens() reusa la
// misma instancia sin volver a llamar matchMedia.
let coarsePointerMql = null
function getCoarsePointerMql() {
  if (!coarsePointerMql) coarsePointerMql = window.matchMedia?.('(pointer: coarse)') ?? null
  return coarsePointerMql
}

function detectInitialTier() {
  const params = new URLSearchParams(window.location?.search ?? '')
  const forced = params.get('ch4tier')
  if (forced && TIER_CONFIG[forced]) {
    tierForcedByDebug = true
    return forced
  }
  const nav = window.navigator ?? {}
  const hc = nav.hardwareConcurrency ?? 4
  // deviceMemory es exclusiva de Chromium: undefined en Firefox/Safari (ronda
  // de corrección TASK-010 — el AND de abajo caía siempre a MED ahí porque
  // ?? 4 nunca alcanzaba el umbral de 8, aunque el hardware real fuera un M3
  // Max). undefined explícito (no default numérico) para poder distinguir
  // "no hay señal" de "la señal dice 4".
  const mem = nav.deviceMemory
  const coarse = getCoarsePointerMql()?.matches ?? false
  const mobile = coarse && window.innerWidth < 900
  if (mobile) return 'LOW'
  // TASK-010 (ronda de completado): umbral endurecido de OR a AND. Con la
  // lente Sobel sumada al Pass C, HIGH ya no sostenía 60fps en hardware que
  // solo cumplía UNA de las dos condiciones (ver hand-off: 55.9fps → 35fps
  // medidos con GPU real bajo el umbral viejo). Ahora requiere ambas señales
  // de capacidad antes de arrancar en HIGH; el resto cae a MED (adaptTier
  // igual puede subir a HIGH después si el frame time sostiene <12ms).
  // Cuando el navegador no reporta deviceMemory (Firefox/Safari) la decisión
  // se toma solo por hardwareConcurrency — sin esto, la ausencia de señal se
  // interpretaba como "señal mala" y esos navegadores nunca llegaban a HIGH.
  if (mem == null) return hc >= 8 ? 'HIGH' : 'MED'
  if (hc >= 8 && mem >= 8) return 'HIGH'
  return 'MED'
}

function detectSoftwareRenderer() {
  if (!gl) return false
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  if (!ext) return false
  const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '')
  return /swiftshader|llvmpipe/i.test(renderer)
}

// Único punto de escritura de currentTier: sincroniza el atributo DOM
// data-ch4-tier (observable desde fuera vía DOM/CDP, sin necesidad de
// instrumentación adicional) y emite 'tier-change' para que Chapter4Content
// reaccione (DOF blur, spec §4.8). Log de DEV solo en transiciones reales,
// para poder verificar en vivo que la baja/subida automática de tier ocurre.
function setTier(next, ts) {
  const changed = next !== currentTier
  currentTier = next
  const canvas = canvasRef.value
  if (canvas) canvas.dataset.ch4Tier = next
  emit('tier-change', next)
  if (changed && import.meta.env.DEV) {
    console.info(`[Ch4PortalShader] tier -> ${next}${ts != null ? ` (ts=${Math.round(ts)}ms)` : ''}`)
  }
}

function adaptTier(ts, dt) {
  if (tierForcedByDebug) return
  frameDeltas.push(dt)
  if (frameDeltas.length > 90) frameDeltas.shift()
  if (frameDeltas.length < 20) return // muestra insuficiente
  const avg = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length
  const sinceChange = ts - lastTierChangeTs
  const idx = TIER_ORDER.indexOf(currentTier)
  if (avg > 20 && sinceChange > 15000 && idx > 0) {
    setTier(TIER_ORDER[idx - 1], ts)
    lastTierChangeTs = ts
    goodStreakStartTs = null
    frameDeltas = []
  } else if (avg < 12) {
    if (goodStreakStartTs == null) goodStreakStartTs = ts
    if (ts - goodStreakStartTs > 10000 && sinceChange > 15000 && idx < TIER_ORDER.length - 1) {
      setTier(TIER_ORDER[idx + 1], ts)
      lastTierChangeTs = ts
      goodStreakStartTs = null
      frameDeltas = []
    }
  } else {
    goodStreakStartTs = null
  }
}

function updateResponsive() {
  const w = window.innerWidth
  if (w < 600) { portalUV = [0.50, 0.72]; vignetteMerge = 1 }
  else if (w < 900) { portalUV = [0.78, 0.70]; vignetteMerge = 0 }
  else { portalUV = [0.81, 0.75]; vignetteMerge = 0 }
}

// ── Lente reveladora: target + inercia (spec §4.6) ───────────────────────────
// En desktop/tablet sigue el puntero; en mobile (pointer:coarse, sin puntero
// real) orbita el portal en una lissajous lenta de 23s. lerp 0.06/frame en
// ambos casos, en el mismo espacio "p" (aspect-corregido) que el shader.
function updateLens(t) {
  const aspect = fullW / fullH
  const coarse = getCoarsePointerMql()?.matches ?? false
  let targetX, targetY
  if (coarse) {
    const portalPX = (portalUV[0] - 0.5) * aspect
    const portalPY = portalUV[1] - 0.5
    const ang = (t / LENS_ORBIT_PERIOD_S) * Math.PI * 2
    targetX = portalPX + Math.sin(ang * 2) * LENS_ORBIT_R
    targetY = portalPY + Math.sin(ang) * LENS_ORBIT_R * 0.6
  } else {
    targetX = (ptrMx + driftX) * aspect
    targetY = ptrMy + driftY
  }
  lensX += (targetX - lensX) * LENS_LERP
  lensY += (targetY - lensY) * LENS_LERP
}

// ── GLSL — Pass A "mundo" ────────────────────────────────────────────────────
// Túnel raymarcheado + nebulosa por domain warping + starfield con parallax
// real + suelo holográfico + lensing (spec §4.1-§4.4, §4.10).
function worldFragSrc({ steps, oct }) {
  return /* glsl */ `
    precision mediump float;
    #define STEPS ${steps}
    #define OCT ${oct}

    uniform vec2  u_resolution;
    uniform float u_time;
    uniform vec2  u_portal;
    uniform vec2  u_pointer;
    uniform float u_aspect;
    uniform float u_warpR;
    uniform float u_lensBoost;

    uniform vec3  u_colVortex;
    uniform vec3  u_colRing;
    uniform vec3  u_colStar;
    uniform vec3  u_colBg;
    uniform vec3  u_colVortexN;
    uniform vec3  u_colRingN;
    uniform vec3  u_colStarN;
    uniform vec3  u_colBgN;
    uniform float u_universeId;
    uniform float u_universeIdN;
    uniform float u_tunnelDensity;
    uniform float u_tunnelDensityN;
    uniform float u_warpAmp;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < OCT; i++) { v += a * vnoise(p); p = p * 2.0 + 17.3; a *= 0.5; }
      return v;
    }

    float starGrid(vec2 uv, float scale, float seed) {
      vec2 g = floor(uv * scale);
      vec2 f = fract(uv * scale) - 0.5;
      float presence = step(0.82, hash(g));
      float rate = 1.5 + hash(g + vec2(7.3, 13.7)) * 3.5;
      float phase = hash(g + vec2(1.1, 2.3)) * 6.283;
      float twinkle = 0.5 + 0.5 * sin(u_time * rate + phase + seed);
      return presence * twinkle * smoothstep(0.19, 0.0, length(f));
    }

    float densityAt(vec3 q, float tDens) {
      float r = length(q.xy);
      float wall = 0.16 + 0.05 * sin(q.z * 2.1 - u_time * 0.7);
      vec2 polar = vec2(atan(q.y, q.x) * 1.59, q.z * 0.85 - u_time * 0.55);
      vec2 warp = vec2(fbm(polar + fbm(polar + u_time * 0.1)), fbm(polar.yx - u_time * 0.07));
      float walls = fbm(polar * 2.0 + warp * 1.7);
      return smoothstep(0.10, 0.02, abs(r - wall)) * (0.35 + 0.65 * walls) * tDens;
    }

    vec3 marchTunnel(vec3 ro, vec3 rd, vec3 colA, vec3 colB, float tDens) {
      vec3 acc = vec3(0.0); float trans = 1.0;
      for (int i = 0; i < STEPS; i++) {
        vec3 q = ro + rd * (float(i) * 0.11 + 0.05);
        float d = densityAt(q, tDens);
        vec3 c = mix(colA, colB, smoothstep(1.2, 2.6, q.z));
        acc += c * d * trans * 0.16;
        trans *= 1.0 - d * 0.22;
        if (trans < 0.05) break;
      }
      return acc;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      uv.y = 1.0 - uv.y;
      vec2 p = (uv - 0.5) * vec2(u_aspect, 1.0);
      vec2 portalP = (u_portal - 0.5) * vec2(u_aspect, 1.0);
      vec2 d = p - portalP;
      float dist = length(d);
      vec2 lensDir = normalize(d + vec2(0.0001));

      float warpActive = step(0.001, u_warpR);
      float notSwept = warpActive > 0.5
        ? smoothstep(u_warpR - 0.04, u_warpR + 0.04, dist)
        : 1.0;
      float warpEdge = warpActive > 0.5
        ? (1.0 - smoothstep(0.0, 0.11, abs(dist - u_warpR)))
        : 0.0;
      float warpSign = (dist > u_warpR) ? 1.0 : -1.0;
      float warpDistort = warpEdge * (0.045 + 0.03 * u_warpAmp) * warpSign;
      vec2 distortedD = d + lensDir * warpDistort;

      vec3 colVortex = mix(u_colVortexN, u_colVortex, notSwept);
      vec3 colRing   = mix(u_colRingN,   u_colRing,   notSwept);
      vec3 colStar   = mix(u_colStarN,   u_colStar,   notSwept);
      vec3 colBg     = mix(u_colBgN,     u_colBg,     notSwept);
      float tDens    = mix(u_tunnelDensityN, u_tunnelDensity, notSwept);
      float univId   = mix(u_universeIdN, u_universeId, notSwept);

      // Rotación de espacio-tiempo cerca del portal (vórtice, spec §4.3a).
      float rotAmt = 0.35 * smoothstep(0.4, 0.05, dist);
      float ca = cos(rotAmt), sa = sin(rotAmt);
      vec2 rd2 = vec2(distortedD.x * ca - distortedD.y * sa, distortedD.x * sa + distortedD.y * ca);

      float lensStr = (0.048 / (dist * dist + 0.055)) * u_lensBoost;
      vec2 lensedP = portalP + rd2 - lensDir * lensStr;

      // Nebulosa por domain warping anidado (spec §4.2).
      vec2 nq = lensedP * 3.0;
      float n1 = fbm(nq + vec2(u_time * 0.02, 0.0));
      float n2 = fbm(nq + 4.0 * vec2(n1, fbm(nq + n1)));
      vec3 neb = mix(colBg, colVortex * 0.30, smoothstep(0.35, 0.85, n2));

      // Starfield 3 planos con parallax REAL (spec §4.4): cada plano recibe el
      // puntero dividido por su profundidad.
      float stars = 0.0;
      stars += starGrid(lensedP + u_pointer * (0.035 / 4.0), 22.0, 0.0) * 0.5;
      stars += starGrid(lensedP + u_pointer * (0.035 / 2.2), 13.0, 2.1) * 0.8;
      stars += starGrid(lensedP + u_pointer * (0.035 / 1.0),  7.0, 4.7) * 1.1;
      stars = clamp(stars, 0.0, 1.0);

      vec3 bg = colBg + neb * 0.5 + colStar * stars;

      // Suelo holográfico perspectivo — recibe el pull del lensing (spec §4.10).
      float FLOOR_H = 0.60;
      float fT = clamp((uv.y - FLOOR_H) / (1.0 - FLOOR_H), 0.0, 1.0);
      float fOn = step(0.002, fT);
      float fInvT = min(1.0 / max(fT, 0.006), 90.0);
      float fX = (uv.x - 0.5) * fInvT + (lensedP.x - p.x) * 3.0;
      float fZ = fInvT - u_time * 0.10;
      float fgX = abs(fract(fX * 5.5) - 0.5);
      float fgZ = abs(fract(fZ * 3.0) - 0.5);
      float fGrid = max(smoothstep(0.046, 0.008, fgX), smoothstep(0.046, 0.008, fgZ));
      float fFade = smoothstep(0.0, 0.16, fT) * smoothstep(1.0, 0.72, fT);
      float isTron = 1.0 - smoothstep(0.0, 0.35, abs(univId - 1.0));
      float isVoid = 1.0 - smoothstep(0.0, 0.35, abs(univId - 3.0));
      bg += colVortex * fGrid * fOn * fFade * (0.30 + isTron * 0.35);

      // Regla tonal §2.2: fuera del portal, luminancia acotada a 0.45.
      bg = min(bg, vec3(0.45));

      // Vórtice clásico — fallback pleno en LOW (STEPS=0), capa extra en HIGH/MED.
      float angle = atan(d.y, d.x);
      float spiralTwist = u_time * 0.9 + 3.2 / (dist + 0.048);
      float spokes = 0.5 + 0.5 * sin((angle + spiralTwist * 0.55) * 7.0);
      float vortexMask = smoothstep(0.27, 0.0, dist);
      vec3 vortexColor = colVortex * spokes * vortexMask * (0.55 + 0.45 * (0.5 + 0.5 * sin(u_time * 0.65)));

      // Túnel volumetrico raymarcheado — el "otro lado" al fondo (spec §4.1).
      // Pared cercana = universo actual; fondo del tubo = universo siguiente,
      // SIEMPRE (no depende del frente de onda): "insinúa la próxima realidad".
      vec3 ro = vec3(d, 0.0);
      vec3 rd = normalize(vec3(d * 0.35 + u_pointer * 0.05, 1.0));
      vec3 tunnelColor = marchTunnel(ro, rd, u_colVortex, u_colVortexN, tDens);

      float ringBase = smoothstep(0.27, 0.22, dist) * smoothstep(0.06, 0.10, dist);
      float ringWobble = fbm(vec2(angle * 3.0 + u_time * 0.4, 0.0));
      float ring = ringBase * (0.6 + 0.4 * ringWobble);
      vec3 ringColor = colRing * ring * (0.70 + 0.30 * (0.5 + 0.5 * sin(u_time * 0.42 + 1.5708)));

      // El túnel REEMPLAZA el fondo dentro de la máscara (agujero real, no blend
      // aditivo — spec §4.1).
      float portalMask = smoothstep(0.30, 0.24, dist);
      vec3 col = mix(bg, tunnelColor + vortexColor * 0.6, portalMask);
      col += ringColor;

      // Glitch U3 — scanlines rojas aleatorias, marca del universo Vacío.
      float rNoise = hash(vec2(floor(uv.y * 28.0 + 0.5), floor(u_time * 15.0)));
      col += vec3(0.35, 0.0, 0.0) * isVoid * step(0.72, rNoise) * 0.10;

      // Frente de onda: flash blanco (base para los godrays de Pass C).
      col += vec3(1.0, 0.95, 1.0) * warpEdge * 0.85;

      gl_FragColor = vec4(col, 1.0);
    }
  `
}

// ── GLSL — Pass B "eco" (feedback ping-pong, spec §4.7) ─────────────────────
const FEEDBACK_FRAG_SRC = /* glsl */ `
  precision mediump float;
  uniform sampler2D u_bufA;
  uniform sampler2D u_bufPrev;
  uniform vec2  u_resolution;
  uniform vec2  u_portal;
  uniform float u_warpEnv;

  void main() {
    vec2 fragUV = gl_FragCoord.xy / u_resolution;
    vec2 topUV  = vec2(fragUV.x, 1.0 - fragUV.y);

    vec3 scene = texture2D(u_bufA, fragUV).rgb;

    vec2 dir = normalize(topUV - u_portal + vec2(0.0001));
    vec2 fbTopUV = topUV + dir * 0.012 * u_warpEnv;
    vec2 fbUV = vec2(fbTopUV.x, 1.0 - fbTopUV.y);

    vec3 prev = texture2D(u_bufPrev, fbUV).rgb;
    // MEDIUM (ronda de corrección TASK-010): la spec §4.7 fija decay en
    // mix(0.20, 0.90, warpEnv) — 0.0 en régimen normal volvía este pass una
    // copia identidad (puro overhead) y perdía el motion-trail sutil de las
    // estrellas cercanas que el eco debe dejar siempre, no solo durante el warp.
    float decay = mix(0.20, 0.90, u_warpEnv);
    vec3 result = max(scene, prev * decay);
    gl_FragColor = vec4(result, 1.0);
  }
`

// ── GLSL — Pass C "óptica de headset" (spec §4.5, §4.6, §4.9) ───────────────
// No exportable: vive en <script setup> (no admite `export` de bindings
// arbitrarios). El regression lock de la lente Sobel — TASK-010 se recortó
// una vez ya (ver hand-off de la ronda anterior) — vive en
// tests/components/Ch4PortalShader.test.js como lectura de source (mismo
// patrón que el resto de los locks CSS de este proyecto).
function opticsFragSrc({ taps, sde, lens }) {
  return /* glsl */ `
    precision mediump float;
    #define TAPS ${taps}
    #define SDE ${sde ? 1 : 0}
    #define LENS ${lens ? 1 : 0}

    uniform sampler2D u_tex;
    uniform vec2  u_resolution;
    uniform vec2  u_portal;
    uniform float u_time;
    uniform float u_k1;
    uniform float u_k2;
    uniform float u_caAmt;
    uniform float u_vignette;
    uniform float u_vignetteMerge;
    uniform float u_godraysExposure;
    uniform float u_aspect;
    uniform vec2  u_lensPos;
    uniform float u_lensOn;
    uniform vec2  u_bufRes;
    uniform vec3  u_colVortexN;
    uniform vec3  u_edgeTintN;
    uniform vec3  u_colBgN;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

    vec2 barrel(vec2 uv, float k1, float k2) {
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      return 0.5 + c * (1.0 + k1 * r2 + k2 * r2 * r2);
    }

    vec3 godrays(vec2 uv, vec2 lightUV) {
      #if TAPS > 0
      vec2 delta = (lightUV - uv) * (1.0 / float(TAPS)) * 0.9;
      vec3 acc = vec3(0.0); float illum = 1.0; vec2 s = uv;
      for (int i = 0; i < TAPS; i++) {
        s += delta;
        vec3 smp = max(texture2D(u_tex, s).rgb - 0.45, 0.0);
        acc += smp * illum * 0.5;
        illum *= 0.95;
      }
      return acc * 0.25 * u_godraysExposure;
      #else
      vec3 c = texture2D(u_tex, mix(uv, lightUV, 0.5)).rgb;
      return max(c - 0.5, 0.0) * 0.15 * u_godraysExposure;
      #endif
    }

    vec3 caSample(vec2 uv, float amt) {
      vec2 dir = uv - 0.5;
      return vec3(
        texture2D(u_tex, uv + dir * amt).r,
        texture2D(u_tex, uv).g,
        texture2D(u_tex, uv - dir * amt).b
      );
    }

    #if LENS
    // Lente reveladora (spec §4.6): Sobel 3x3 sobre la luminancia del Pass B
    // (u_tex, el mismo buffer de eco que alimenta godrays/CA) — 9 taps.
    float lumaAt(vec2 uv) { return dot(texture2D(u_tex, uv).rgb, vec3(0.299, 0.587, 0.114)); }

    float sobelEdge(vec2 uv, vec2 px) {
      float tl = lumaAt(uv + px * vec2(-1.0,  1.0));
      float tc = lumaAt(uv + px * vec2( 0.0,  1.0));
      float tr = lumaAt(uv + px * vec2( 1.0,  1.0));
      float ml = lumaAt(uv + px * vec2(-1.0,  0.0));
      float mr = lumaAt(uv + px * vec2( 1.0,  0.0));
      float bl = lumaAt(uv + px * vec2(-1.0, -1.0));
      float bc = lumaAt(uv + px * vec2( 0.0, -1.0));
      float br = lumaAt(uv + px * vec2( 1.0, -1.0));
      float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
      float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
      return clamp(length(vec2(gx, gy)) * 1.8, 0.0, 1.0);
    }
    #endif

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 lightUV = vec2(u_portal.x, 1.0 - u_portal.y);

      vec2 buv = barrel(uv, u_k1, u_k2);

      vec3 color;
      if (buv.x < 0.0 || buv.x > 1.0 || buv.y < 0.0 || buv.y > 1.0) {
        color = vec3(0.0);
      } else {
        // LOW (ronda de corrección TASK-010): spec §4.9 fija el orden
        // "godrays -> barrel" — los rayos deben samplearse en el espacio YA
        // curvado por el barrel para que se curven junto con la lente, no
        // sobre el uv recto. Movido de antes de la distorsión a acá.
        vec3 rays = godrays(buv, lightUV);
        color = caSample(buv, u_caAmt) + rays;
      }

      #if LENS
      // Círculo de radio LENS_R (inyectado desde JS, única fuente de verdad —
      // LOW ronda de corrección TASK-010) en espacio p (aspect-corregido) que sigue al
      // puntero con inercia (calculada en JS): dentro, la escena se reemplaza
      // por su wireframe Sobel teñido con la paleta del universo SIGUIENTE —
      // "ves la realidad que viene, escondida detrás de la actual".
      //
      // Fix HIGH (ronda de corrección TASK-010): "uv" en este pass es NATIVA
      // de gl_FragCoord (bottom-up, sin el flip que sí hace Pass A) — por eso
      // los godrays arriba flipean u_portal con 1.0 - u_portal.y antes de
      // compararlo. u_lensPos (lensX/lensY) llega desde JS en el espacio "p"
      // top-left-origin que declara la spec (§4: mismo espacio que ptrMy —
      // DOM, positivo hacia abajo), así que "p" acá tiene que sufrir el mismo
      // flip que lightUV o queda espejado en Y: puntero abajo → lente arriba.
      // Mismo flip resuelve, sin tocar JS, la órbita mobile (line ~366): esa
      // órbita también construye su target en el espacio top-left-origin de
      // portalUV, así que hereda la corrección de este único punto.
      vec2 p = (vec2(uv.x, 1.0 - uv.y) - 0.5) * vec2(u_aspect, 1.0);
      float lensDist = length(p - u_lensPos);
      float lensMask = smoothstep(${LENS_R}, ${(LENS_R - 0.05).toFixed(3)}, lensDist) * u_lensOn;
      vec2  bufPx = 1.0 / u_bufRes;
      vec3  wire = u_edgeTintN * sobelEdge(uv, bufPx) + u_colBgN * 0.4;
      color = mix(color, wire, lensMask * 0.9);
      // Aro fino brillante — borde de cristal de la lente.
      color += u_colVortexN * smoothstep(0.012, 0.0, abs(lensDist - ${LENS_R})) * 0.6 * u_lensOn;
      #endif

      // Viñeta binocular — dos oculares que se funden a óvalo único cuando
      // u_vignetteMerge=1 (mobile portrait, spec §11): "dos oculares en 360px
      // se ven ridículos".
      float apR = mix(0.015, 0.34, clamp(u_vignette, 0.0, 1.0));
      vec2 eyeScale = vec2(1.0 / 0.82, 1.0 / 1.05);
      vec2 cL = mix(vec2(0.30, 0.5), vec2(0.5, 0.5), u_vignetteMerge);
      vec2 cR = mix(vec2(0.70, 0.5), vec2(0.5, 0.5), u_vignetteMerge);
      float eyeL = smoothstep(apR + 0.20, apR, length((buv - cL) * eyeScale));
      float eyeR = smoothstep(apR + 0.20, apR, length((buv - cR) * eyeScale));
      color *= max(eyeL, eyeR);

      float grain = (hash(uv * 1013.0 + fract(u_time) * 7.0) - 0.5) * 0.025;
      color += grain;

      #if SDE
      float sde = 1.0 - 0.03 * step(0.5, fract(gl_FragCoord.x * 0.5)) * step(0.5, fract(gl_FragCoord.y * 0.5));
      color *= sde;
      #endif

      gl_FragColor = vec4(color, 1.0);
    }
  `
}

const VERT_SRC = /* glsl */ `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

// ── WebGL helpers ─────────────────────────────────────────────────────────────

function compileShader(type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) {
      console.error('[Ch4PortalShader] compile error:', gl.getShaderInfoLog(sh))
    }
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function linkProgram(fragSrc) {
  const vert = compileShader(gl.VERTEX_SHADER, VERT_SRC)
  const frag = compileShader(gl.FRAGMENT_SHADER, fragSrc)
  if (!vert || !frag) return null
  const program = gl.createProgram()
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  // Location fija (0) para 'a_position' en TODOS los programas — el buffer
  // del quad se bindea una sola vez, sin rebind al cambiar de programa/tier.
  gl.bindAttribLocation(program, 0, 'a_position')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) {
      console.error('[Ch4PortalShader] link error:', gl.getProgramInfoLog(program))
    }
    return null
  }
  return program
}

function getUniforms(program, names) {
  const out = {}
  for (const n of names) out[n] = gl.getUniformLocation(program, n)
  return out
}

const WORLD_UNIFORM_NAMES = [
  'u_resolution', 'u_time', 'u_portal', 'u_pointer', 'u_aspect', 'u_warpR', 'u_lensBoost',
  'u_colVortex', 'u_colRing', 'u_colStar', 'u_colBg',
  'u_colVortexN', 'u_colRingN', 'u_colStarN', 'u_colBgN',
  'u_universeId', 'u_universeIdN', 'u_tunnelDensity', 'u_tunnelDensityN', 'u_warpAmp',
]
const FEEDBACK_UNIFORM_NAMES = ['u_bufA', 'u_bufPrev', 'u_resolution', 'u_portal', 'u_warpEnv']
const OPTICS_UNIFORM_NAMES = [
  'u_tex', 'u_resolution', 'u_portal', 'u_time', 'u_k1', 'u_k2', 'u_caAmt',
  'u_vignette', 'u_vignetteMerge', 'u_godraysExposure',
  // Lente reveladora (spec §4.6):
  'u_aspect', 'u_lensPos', 'u_lensOn', 'u_bufRes', 'u_colVortexN', 'u_edgeTintN', 'u_colBgN',
]

function createFBO(w, h) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { fbo, tex }
}

function deleteFBO(f) {
  if (!f) return
  gl.deleteFramebuffer(f.fbo)
  gl.deleteTexture(f.tex)
}

function initGL(canvas) {
  const initialTier = detectInitialTier()
  setTier(initialTier)
  gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: initialTier === 'HIGH' ? 'high-performance' : 'low-power',
  })
  if (!gl) return false

  if (detectSoftwareRenderer() && !tierForcedByDebug) setTier('LOW')

  quadBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  for (const tier of TIER_ORDER) {
    const cfg = TIER_CONFIG[tier]
    const pw = linkProgram(worldFragSrc(cfg))
    const po = linkProgram(opticsFragSrc(cfg))
    if (!pw || !po) return false
    progWorld[tier] = pw
    progOptics[tier] = po
  }
  progFeedback = linkProgram(FEEDBACK_FRAG_SRC)
  if (!progFeedback) return false

  uFeedback = getUniforms(progFeedback, FEEDBACK_UNIFORM_NAMES)
  uWorld = {}
  uOptics = {}
  for (const tier of TIER_ORDER) {
    uWorld[tier] = getUniforms(progWorld[tier], WORLD_UNIFORM_NAMES)
    uOptics[tier] = getUniforms(progOptics[tier], OPTICS_UNIFORM_NAMES)
  }

  canvas.addEventListener('webglcontextlost', onContextLost, false)
  return true
}

function onContextLost(e) {
  e.preventDefault()
  stopLoop()
  gl = null
}

// ── Resize — recrea FBOs a la resolución real, dpr≤1.5 (spec §7.2, §11) ─────
function applySize() {
  const canvas = canvasRef.value
  if (!canvas || !gl) return
  const rect = canvas.getBoundingClientRect()
  const cw = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1))
  const ch = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1))
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  fullW = Math.max(1, Math.round(cw * dpr))
  fullH = Math.max(1, Math.round(ch * dpr))
  halfW = Math.max(1, Math.min(Math.floor(fullW / 2), 960))
  halfH = Math.max(1, Math.min(Math.floor(fullH / 2), 540))
  canvas.width = fullW
  canvas.height = fullH

  deleteFBO(fboWorld)
  deleteFBO(fboFeedback[0])
  deleteFBO(fboFeedback[1])
  fboWorld = createFBO(halfW, halfH)
  fboFeedback = [createFBO(halfW, halfH), createFBO(halfW, halfH)]
  fbIdx = 0

  updateResponsive()
}

function scheduleResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    applySize()
    if (reduced()) renderStaticFrame()
  }, 200)
}

// ── Render por pass ───────────────────────────────────────────────────────────

function renderWorld(t, warpR, lensBoost) {
  const curr = UNIVERSES[universeIdx]
  const next = UNIVERSES[nextUniverseIdx]
  const program = progWorld[currentTier]
  const u = uWorld[currentTier]

  gl.bindFramebuffer(gl.FRAMEBUFFER, fboWorld.fbo)
  gl.viewport(0, 0, halfW, halfH)
  gl.useProgram(program)
  gl.uniform2f(u.u_resolution, halfW, halfH)
  gl.uniform1f(u.u_time, t)
  gl.uniform2f(u.u_portal, portalUV[0], portalUV[1])
  gl.uniform2f(u.u_pointer, ptrMx + driftX, ptrMy + driftY)
  // MEDIUM (ronda de corrección TASK-010): u_aspect es el aspecto de
  // PANTALLA (fullW/fullH), no el del FBO del Pass A. applySize() capea
  // halfW/halfH a 960/540 de forma INDEPENDIENTE (spec §7.2, presupuesto de
  // fill-rate) — apenas un cap engancha sin el otro, halfW/halfH deja de
  // coincidir con el aspecto real de display, y todas las correcciones por
  // aspecto de la §4 (p = (uv-0.5)*vec2(aspect,1.0), portal, lensing, warp)
  // quedan estiradas: el portal se ve elíptico y desregistrado contra el
  // halo CSS .ch4-portal-pulse (círculo perfecto) y el aro de la lente del
  // Pass C, que YA usa fullW/fullH (línea ~998) y por eso no tiene el bug.
  // Medido: 1440x900 @ dpr1.5 → FBO 1.78 vs display 1.6 (~10% estiramiento);
  // ultrawide 21:9 → ~35%. Fix: pasar el aspecto de display, dejando la
  // resolución del FBO (halfW/halfH) intacta — no toca el presupuesto de
  // fill-rate de §7.2, solo corrige qué aspecto usa la corrección visual.
  gl.uniform1f(u.u_aspect, fullW / fullH)
  gl.uniform1f(u.u_warpR, warpR)
  gl.uniform1f(u.u_lensBoost, lensBoost)
  gl.uniform3fv(u.u_colVortex, curr.colVortex)
  gl.uniform3fv(u.u_colRing, curr.colRing)
  gl.uniform3fv(u.u_colStar, curr.colStar)
  gl.uniform3fv(u.u_colBg, curr.colBg)
  gl.uniform3fv(u.u_colVortexN, next.colVortex)
  gl.uniform3fv(u.u_colRingN, next.colRing)
  gl.uniform3fv(u.u_colStarN, next.colStar)
  gl.uniform3fv(u.u_colBgN, next.colBg)
  gl.uniform1f(u.u_universeId, curr.id)
  gl.uniform1f(u.u_universeIdN, next.id)
  gl.uniform1f(u.u_tunnelDensity, curr.tunnelDensity)
  gl.uniform1f(u.u_tunnelDensityN, next.tunnelDensity)
  gl.uniform1f(u.u_warpAmp, curr.warpAmp)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

function renderFeedback(warpEnv) {
  const dst = fboFeedback[1 - fbIdx]
  const prevSrc = fboFeedback[fbIdx]
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo)
  gl.viewport(0, 0, halfW, halfH)
  gl.useProgram(progFeedback)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, fboWorld.tex)
  gl.uniform1i(uFeedback.u_bufA, 0)
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, prevSrc.tex)
  gl.uniform1i(uFeedback.u_bufPrev, 1)
  gl.uniform2f(uFeedback.u_resolution, halfW, halfH)
  gl.uniform2f(uFeedback.u_portal, portalUV[0], portalUV[1])
  gl.uniform1f(uFeedback.u_warpEnv, warpEnv)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  fbIdx = 1 - fbIdx
}

function renderOptics(t, optics, lensOn = 1, useFeedback = true) {
  const program = progOptics[currentTier]
  const u = uOptics[currentTier]
  const next = UNIVERSES[nextUniverseIdx]
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, fullW, fullH)
  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)
  // Matriz de tiers (spec §7.3): LOW no lleva feedback buffer. renderFrame no
  // corre renderFeedback() para LOW (useFeedback=false) — samplear
  // fboFeedback igual habría leído un buffer nunca escrito para ese tier
  // (basura/stale), así que Pass C lee Pass A directo en ese caso.
  gl.bindTexture(gl.TEXTURE_2D, useFeedback ? fboFeedback[fbIdx].tex : fboWorld.tex)
  gl.uniform1i(u.u_tex, 0)
  gl.uniform2f(u.u_resolution, fullW, fullH)
  gl.uniform2f(u.u_portal, portalUV[0], portalUV[1])
  gl.uniform1f(u.u_time, t)
  gl.uniform1f(u.u_k1, optics.k1)
  gl.uniform1f(u.u_k2, optics.k2)
  gl.uniform1f(u.u_caAmt, optics.caAmt)
  gl.uniform1f(u.u_vignette, optics.vignette)
  gl.uniform1f(u.u_vignetteMerge, vignetteMerge)
  gl.uniform1f(u.u_godraysExposure, optics.godraysExposure)
  // Lente reveladora (spec §4.6) — sigue lensX/lensY (inercia, actualizada en
  // tick vía updateLens); lensOn=0 la apaga por completo bajo PRM aunque el
  // frame estático fuerce tier HIGH para calidad (spec §10: "bajo PRM la
  // lente no existe").
  gl.uniform1f(u.u_aspect, fullW / fullH)
  gl.uniform2f(u.u_lensPos, lensX, lensY)
  gl.uniform1f(u.u_lensOn, lensOn)
  gl.uniform2f(u.u_bufRes, halfW, halfH)
  gl.uniform3fv(u.u_colVortexN, next.colVortex)
  gl.uniform3fv(u.u_edgeTintN, next.edgeTint)
  gl.uniform3fv(u.u_colBgN, next.colBg)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

// warpEnv: envolvente 0..1 — ataque 120ms al iniciar la onda, release ~600ms
// exponencial tras completarse (el "eco" de la realidad vieja, spec §4.7/§6).
function warpEnvAt(ts) {
  if (warpActive) return Math.min((ts - warpStartTs) / 120, 1)
  if (warpEndTs != null) return Math.exp(-(ts - warpEndTs) / (WARP_ECHO_MS / 2))
  return 0
}

function computeOptics(ts) {
  let base = OPTICS_REST
  if (jumpActive && jumpStartTs != null) {
    const ms = ts - jumpStartTs
    base = jumpTable === BEATS_FULL ? opticsBootFull(ms) : opticsBootShort(ms)
  }
  const warpEnv = warpEnvAt(ts)
  return {
    vignette: base.vignette,
    k1: base.k1 + warpEnv * 0.02,
    k2: base.k2,
    caAmt: lerp(base.caAmt, base.caAmt * 6, warpEnv),
    godraysExposure: base.godraysExposure * (1 + warpEnv * 2),
    warpEnv,
  }
}

function renderFrame(ts, t) {
  const optics = computeOptics(ts)
  const lensBoost = 1.0 + optics.warpEnv * 1.5
  updateLens(t)
  renderWorld(t, currentWarpR, lensBoost)
  // Matriz de tiers (spec §7.3): "Feedback buffer: si HIGH/MED, no LOW" — el
  // hardware más débil (el que ya cayó a LOW) no debe pagar un pass extra que
  // la propia spec dice que no le corresponde.
  const hasFeedback = currentTier !== 'LOW'
  if (hasFeedback) renderFeedback(optics.warpEnv)
  renderOptics(t, optics, 1, hasFeedback)
}

// Render único bajo PRM: t=7.3 (respiración del portal en máximo, spec §10).
// currentTier se fuerza a HIGH porque el costo de UN frame no importa y se
// prioriza calidad — pero eso NO debe encender la lente (spec §10: "bajo PRM
// la lente no existe"), así que renderOptics recibe lensOn=0 explícito en vez
// de depender de que el tier HIGH la traiga habilitada por defecto.
function renderStaticFrame() {
  if (!gl) return
  setTier('HIGH')
  updateResponsive()
  renderWorld(7.3, 0.0, 1.0)
  renderFeedback(0.0)
  renderOptics(7.3, OPTICS_REST, 0)
}

// ── Ciclo de universo ─────────────────────────────────────────────────────────

function triggerWarp(ts) {
  if (warpActive || reduced()) return
  warpActive      = true
  warpStartTs     = ts
  warpEndTs       = null
  nextUniverseIdx = (universeIdx + 1) % UNIVERSES.length
  midpointEmitted = false
  currentWarpR    = 0.0
  whoosh()
}

// ── Coreografía de entrada — jump-progress ───────────────────────────────────

function startJump(ts) {
  jumpActive  = true
  jumpStartTs = ts
  if (hasBootedOnce) {
    jumpTable = BEATS_SHORT
    jumpTotalMs = BEATS_SHORT_MS
  } else {
    jumpTable = BEATS_FULL
    jumpTotalMs = BEATS_FULL_MS
    hasBootedOnce = true
  }
}

function updateJump(ts) {
  if (!jumpActive || jumpStartTs == null) return
  const ms = Math.min(ts - jumpStartTs, jumpTotalMs)
  const progress = ms / jumpTotalMs
  emit('jump-progress', { beat: beatOf(ms, jumpTable), progress, ms })
  if (progress >= 1) jumpActive = false
}

// ── RAF loop ──────────────────────────────────────────────────────────────────

function tick(ts) {
  if (!running) return

  if (!startTime) {
    startTime   = ts
    nextShiftAt = ts + FIRST_SHIFT_MS
    lastFrameTs = ts
    startJump(ts)
  }

  const dt = ts - lastFrameTs
  lastFrameTs = ts
  adaptTier(ts, dt)

  const t = (ts - startTime) / 1000
  driftX = Math.sin(t * 0.25) * 0.18
  driftY = Math.cos(t * 0.19) * 0.14

  if (!warpActive && ts >= nextShiftAt) triggerWarp(ts)

  if (warpActive) {
    const elapsedS = (ts - warpStartTs) / 1000
    const progress = elapsedS / WARP_DURATION_S
    currentWarpR = Math.min(progress, 1.0) * WARP_MAX_R

    if (!midpointEmitted && progress > 0.5) {
      midpointEmitted = true
      emit('universe-change', nextUniverseIdx)
    }
    if (progress >= 1.0) {
      universeIdx  = nextUniverseIdx
      warpActive   = false
      warpEndTs    = ts
      currentWarpR = 0.0
      const jitter = MIN_SHIFT_MS + Math.random() * (MAX_SHIFT_MS - MIN_SHIFT_MS)
      nextShiftAt  = ts + jitter
    }
  }

  updateJump(ts)

  if (!document.hidden) renderFrame(ts, t)
  rafId = requestAnimationFrame(tick)
}

function startLoop() {
  if (running || !gl) return
  running = true
  startTime      = 0
  universeIdx    = 0
  nextUniverseIdx = 0
  warpActive     = false
  warpEndTs      = null
  currentWarpR   = 0.0
  nextShiftAt    = Infinity
  jumpActive     = false
  frameDeltas    = []
  lensX = 0
  lensY = 0
  applySize()
  emit('universe-change', 0)
  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

// ── Pointer ───────────────────────────────────────────────────────────────────

function onPointer(ev) {
  if (reduced()) return
  ptrMx = ev.clientX / window.innerWidth  - 0.5
  ptrMy = ev.clientY / window.innerHeight - 0.5
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function destroy() {
  stopWatcher?.()
  stopLoop()
  if (resizeTimer) clearTimeout(resizeTimer)
  window.removeEventListener('pointermove', onPointer)
  window.removeEventListener('resize', scheduleResize)
  // Libera el MediaQueryList cacheado (LOW, ver getCoarsePointerMql arriba):
  // el próximo mount lo recalcula fresco, igual que un reload real de página.
  coarsePointerMql = null
  if (gl) {
    const canvas = canvasRef.value
    if (canvas) canvas.removeEventListener('webglcontextlost', onContextLost)
    deleteFBO(fboWorld)
    deleteFBO(fboFeedback[0])
    deleteFBO(fboFeedback[1])
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
    gl = null
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  if (!initGL(canvas)) {
    supported.value = false
    return
  }

  window.addEventListener('resize', scheduleResize, { passive: true })

  if (reduced()) {
    applySize()
    renderStaticFrame()
    return
  }

  window.addEventListener('pointermove', onPointer, { passive: true })

  stopWatcher = watch(
    activeChapter,
    (v) => {
      if (v === 4) startLoop()
      else stopLoop()
    },
    { immediate: true },
  )
})

onBeforeUnmount(destroy)

if (import.meta.hot) {
  import.meta.hot.dispose(destroy)
}
</script>

<template>
  <canvas
    v-if="supported"
    ref="canvasRef"
    class="ch4-shader-canvas"
    aria-hidden="true"
  />
</template>

<style scoped>
/* Ya NO es aditivo (spec §3.2): el canvas es el fondo OPAQUO real del
   capítulo. Sin image-rendering:pixelated (el volumen necesita gradientes
   suaves) y sin mix-blend-mode:screen (el túnel necesita poder ocluir, no
   solo sumar luz). Las capas DOM (matrix/glifos/personaje/near/HUD) quedan
   encima por z-index — esa es la oclusión correcta. */
.ch4-shader-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  /* MEDIUM (ronda de corrección TASK-010): .ch4-layout fija
     image-rendering: pixelated y la propiedad se hereda — el volumen
     necesita gradientes suaves (spec §3.2), así que este canvas se saca
     explícitamente de esa herencia en vez de depender de que nadie la
     vuelva a fijar más arriba en el árbol. */
  image-rendering: auto;
}
</style>
