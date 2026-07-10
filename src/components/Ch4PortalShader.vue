<!--
  Ch4PortalShader.vue — Travesía del multiverso: el portal nos traga.

  Mecánica central:
    Una onda de warp nace en el anillo del portal y engulle el viewport (~1.2s).
    Al pasar la onda el mundo cambia de universo. Ciclo: primer shift a ~8s
    de entrar a ch4, luego cada 12-18s con jitter. 4 universos iterables como data.

  Universos:
    U0 Synthwave  — cian/magenta, katakana, el default
    U1 Tron       — verde-fósforo, grid perspectiva en shader, chars binarios
    U2 Vaporwave  — lavanda/teal, drift suave, símbolos geométricos
    U3 Vacío      — rojo profundo, glitch RGB constante, chars corruptos

  Shader (WebGL1, mediump):
    - starfield procedural 3 escalas, twinkle por celda
    - lensing gravitacional → warp de caída al portal
    - vórtice espiral polar, 7 brazos
    - aberración cromática R/B + boost en frente de onda
    - frente de onda: distorsión radial + flash blanco + rip cromático
    - U1 grid perspectiva — líneas dibujadas en shader
    - U3 glitch RGB — scanlines desplazadas por función de noise
    - colores como uniforms → swap por universo sin recompilar

  Lifecycle: loop RAF solo cuando activeChapter===4 y !document.hidden.
  PRM: frame estático único t=0, sin ciclo de universo.
  Fallback: WebGL indisponible → supported=false → v-if suprime canvas.
  Audio: whoosh() en cada shift si engine.isUnlocked() && !reduced().
  Emit: 'universe-change' (index) al cruzar el midpoint de la onda.
  Cleanup: onBeforeUnmount + import.meta.hot.dispose + loseContext.
-->
<!-- Exportaciones a nivel de módulo: UNIVERSES usado por Chapter4Content y tests -->
<script>
// ── Universos — SINGLE SOURCE OF TRUTH ────────────────────────────────────
// Cada universo define: id numérico (para branches en shader), colores GLSL
// (arrays Float32-compatible [r,g,b]), y un nombre para debugging.
// El parent (Chapter4Content) tiene los sets de glifos correspondientes.
export const UNIVERSES = [
  {
    id: 0,
    name: 'synthwave',
    colVortex: [0.0,  1.0,  0.95], // cyan
    colRing:   [1.0,  0.05, 0.85], // magenta
    colStar:   [0.75, 0.88, 1.0 ], // azul frío
    colBg:     [0.0,  0.005,0.02 ], // espacio profundo
  },
  {
    id: 1,
    name: 'tron',
    colVortex: [0.0,  1.0,  0.3 ], // verde fósforo
    colRing:   [0.2,  0.9,  0.15], // verde intermedio
    colStar:   [0.55, 1.0,  0.6 ], // verde-blanco
    colBg:     [0.0,  0.015,0.0 ], // negro con tinte verde
  },
  {
    id: 2,
    name: 'vaporwave',
    colVortex: [0.88, 0.38, 1.0 ], // lavanda
    colRing:   [0.18, 0.88, 0.82], // teal
    colStar:   [1.0,  0.72, 0.9 ], // rosa pálido
    colBg:     [0.02, 0.0,  0.03], // casi negro violáceo
  },
  {
    id: 3,
    name: 'void',
    colVortex: [0.78, 0.0,  0.04], // rojo profundo
    colRing:   [0.38, 0.0,  0.02], // rojo oscuro
    colStar:   [1.0,  0.28, 0.28], // rojo apagado
    colBg:     [0.02, 0.0,  0.0 ], // casi negro rojizo
  },
]
</script>

<script setup>
import { ref, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { whoosh } from '@/audio/sfx.js'

// ── Timing del ciclo ─────────────────────────────────────────────────────────
const FIRST_SHIFT_MS  = 8000   // primer shift 8s después de entrar a ch4
const MIN_SHIFT_MS    = 12000  // mínimo entre shifts
const MAX_SHIFT_MS    = 18000  // máximo entre shifts (jitter)
const WARP_DURATION_S = 1.2    // duración de la onda de warp (segundos)
const WARP_MAX_R      = 1.5    // radio máximo UV — cubre la diagonal de cualquier viewport

// ── Inject ───────────────────────────────────────────────────────────────────
const injectedScrollState = inject('scrollState', null)
const injectedPrm         = inject('prm',         null)
const activeChapter  = injectedScrollState?.activeChapter ?? ref(-1)
const prefersReduced = injectedPrm?.prefersReduced         ?? ref(false)
const reduced = () => prefersReduced.value

// ── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits(['universe-change'])

// ── Vue state ────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const supported = ref(true)

// ── WebGL state — NUNCA vue-reactive ─────────────────────────────────────────
let gl = null
let program = null

// Uniform locations
let uTime = null, uResolution = null, uPortal = null, uPointer = null
let uWarpR = null
let uColVortex = null, uColRing = null, uColStar = null, uColBg = null
let uColVortexN = null, uColRingN = null, uColStarN = null, uColBgN = null
let uUniverseId = null, uUniverseIdN = null

// RAF / estado de loop
let rafId = 0
let startTime = 0
let running = false
let ptrMx = 0, ptrMy = 0
let stopWatcher = null

// Estado del multiverso
let universeIdx     = 0
let nextUniverseIdx = 0
let warpActive      = false
let warpStartTs     = 0
let nextShiftAt     = Infinity  // timestamp ms cuando dispara el próximo warp
let midpointEmitted = false
let currentWarpR    = 0.0

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const FRAG_SRC = /* glsl */ `
  precision mediump float;

  uniform vec2  u_resolution;
  uniform float u_time;
  uniform vec2  u_portal;      // centro del portal UV (origin top-left: 0.81, 0.75)
  uniform vec2  u_pointer;     // mx+dx, my+dy (-0.5..0.5)

  // Paleta universo actual
  uniform vec3 u_colVortex;
  uniform vec3 u_colRing;
  uniform vec3 u_colStar;
  uniform vec3 u_colBg;

  // Paleta universo siguiente (visible detrás del frente de onda)
  uniform vec3 u_colVortexN;
  uniform vec3 u_colRingN;
  uniform vec3 u_colStarN;
  uniform vec3 u_colBgN;

  // IDs numéricos de universo — para patterns específicos (grid, glitch)
  uniform float u_universeId;
  uniform float u_universeIdN;

  // Radio del frente de onda en espacio UV (0=inactivo, crece hasta WARP_MAX_R)
  uniform float u_warpR;

  // ── Pseudo-random hash ──────────────────────────────────────────────────
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // ── Estrella en celda UV. Usa u_time directamente (uniform global). ───
  float starField(vec2 uv, float scale, float seed) {
    vec2 g = floor(uv * scale);
    vec2 f = fract(uv * scale) - 0.5;
    float presence = step(0.82, hash(g));
    float rate     = 1.5 + hash(g + vec2(7.3, 13.7)) * 3.5;
    float phase    = hash(g + vec2(1.1, 2.3)) * 6.283;
    float twinkle  = 0.5 + 0.5 * sin(u_time * rate + phase + seed);
    // Pixel-art: smoothstep estrecho → pixel duro
    return presence * twinkle * smoothstep(0.19, 0.0, length(f));
  }

  // ── Grid de perspectiva (U1 Tron) ──────────────────────────────────────
  // Líneas horizontales y verticales cada 1/7 de UV.
  float gridLines(vec2 uv) {
    vec2 g = fract(uv * 7.0);
    float h = smoothstep(0.94, 1.0, g.y) + smoothstep(0.06, 0.0, g.y);
    float v = smoothstep(0.94, 1.0, g.x) + smoothstep(0.06, 0.0, g.x);
    return clamp(h + v, 0.0, 1.0);
  }

  // ── Desplazamiento de scanline (U3 Void glitch) ─────────────────────────
  // 25% de las filas se desplazan horizontalmente en cada frame
  vec2 glitchScanline(vec2 uv) {
    float row  = floor(uv.y * 22.0);
    float seed = hash(vec2(row, floor(u_time * 9.0)));
    float str  = step(0.76, seed) * (seed - 0.76) * 0.55 * 0.12;
    return vec2(str, 0.0);
  }

  void main() {
    // UV con origen top-left
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.y = 1.0 - uv.y;

    // Centro del portal con microdesplazamiento por puntero
    vec2 portal  = u_portal + u_pointer * 0.035;
    vec2 d       = uv - portal;
    float dist   = length(d);
    float angle  = atan(d.y, d.x);
    vec2 lensDir = normalize(d + vec2(0.0001));

    // ── FRENTE DE ONDA ─────────────────────────────────────────────────────
    // notSwept: 0 dentro del frente (nuevo universo), 1 fuera (universo actual)
    float warpActive = step(0.001, u_warpR);
    float notSwept   = warpActive > 0.5
      ? smoothstep(u_warpR - 0.04, u_warpR + 0.04, dist)
      : 1.0;

    // Proximidad al frente de onda (máximo en dist==u_warpR)
    float warpEdge = warpActive > 0.5
      ? (1.0 - smoothstep(0.0, 0.11, abs(dist - u_warpR)))
      : 0.0;

    // Distorsión radial en el frente de onda:
    // justo antes de la onda → empujado hacia afuera
    // justo después → empujado hacia adentro
    float warpSign    = (dist > u_warpR) ? 1.0 : -1.0;
    float warpDistort = warpEdge * 0.065 * warpSign;
    vec2  distortedUV = uv + lensDir * warpDistort;

    // Aberración cromática intensificada en el frente de onda
    float warpCA  = warpEdge * 0.20;

    // ── ELEGIR PALETA DE UNIVERSO ───────────────────────────────────────────
    // notSwept=0 (detrás del frente) → colores del siguiente universo
    // notSwept=1 (delante del frente) → colores del universo actual
    vec3 colVortex = mix(u_colVortexN, u_colVortex, notSwept);
    vec3 colRing   = mix(u_colRingN,   u_colRing,   notSwept);
    vec3 colStar   = mix(u_colStarN,   u_colStar,   notSwept);
    vec3 colBg     = mix(u_colBgN,     u_colBg,     notSwept);
    float univId   = mix(u_universeIdN, u_universeId, notSwept);

    // ── FLAGS DE UNIVERSO (sin branches GLSL → multiplicar) ────────────────
    float isTron  = 1.0 - smoothstep(0.0, 0.35, abs(univId - 1.0)); // 1 cuando univId≈1
    float isVapor = 1.0 - smoothstep(0.0, 0.35, abs(univId - 2.0)); // 1 cuando univId≈2
    float isVoid  = 1.0 - smoothstep(0.0, 0.35, abs(univId - 3.0)); // 1 cuando univId≈3

    // ── LENSING + WARP ─────────────────────────────────────────────────────
    float lensStr = 0.048 / (dist * dist + 0.055);
    vec2  lensedUV = distortedUV - lensDir * lensStr;

    float warpPull  = smoothstep(0.55, 0.05, dist) * 0.22;
    vec2  warpedUV  = lensedUV - lensDir * warpPull;

    // ── GLITCH U3: desplazamiento de scanlines ──────────────────────────────
    vec2 glitch     = glitchScanline(uv) * isVoid;
    vec2 lensedG    = lensedUV + glitch;

    // ── STARFIELD 3 escalas ─────────────────────────────────────────────────
    float stars = 0.0;
    stars += starField(lensedG, 13.0, 0.0) * 0.85;
    stars += starField(lensedG, 22.0, 2.1) * 0.65;
    stars += starField(lensedG,  7.0, 4.7) * 1.1;
    // Capa warped: caída visible sólo cerca del portal
    stars += starField(warpedUV, 17.0, 1.3) * smoothstep(0.50, 0.07, dist) * 0.75;
    stars  = clamp(stars, 0.0, 1.0);

    // ── ABERRACIÓN CROMÁTICA (estándar + boost frente de onda) ─────────────
    float caStr = smoothstep(0.62, 0.0, dist) * 0.058 + warpCA;
    vec2  caOff = lensDir * caStr;

    float starsR = clamp(
      starField(lensedG + caOff, 13.0, 0.0) + starField(lensedG + caOff, 22.0, 2.1),
      0.0, 1.0
    );
    float starsB = clamp(
      starField(lensedG - caOff, 13.0, 0.0) + starField(lensedG - caOff, 22.0, 2.1),
      0.0, 1.0
    );

    // ── GRID PERSPECTIVA U1 (Tron) ──────────────────────────────────────────
    // Grid dibujado en UV lenteada → se distorsiona cerca del portal
    float grid = gridLines(lensedG) * isTron;

    // ── SUELO HOLOGRÁFICO EN PERSPECTIVA ─────────────────────────────────────
    // Solo en la mitad inferior (uv.y > FLOOR_HORIZON). Proyección perspectiva
    // correcta: fT crece de 0 (horizonte) a 1 (borde inferior). fInvT = 1/fT da
    // la escala de compresión: líneas muy juntas en el horizonte, anchas abajo.
    // U0 synthwave: tenue cian. U1 Tron: intenso. U2: ondulado. U3: roto+glitch.
    float FLOOR_H = 0.60;
    float fT      = clamp((uv.y - FLOOR_H) / (1.0 - FLOOR_H), 0.0, 1.0);
    float fOn     = step(0.002, fT);
    float fInvT   = min(1.0 / max(fT, 0.006), 90.0);
    // Espacio de suelo: X perspectivo + Z scrolleando hacia el portal
    float fX      = (uv.x - 0.5) * fInvT;
    float fZ      = fInvT - u_time * 0.10;
    // U2 vaporwave: onda horizontal que deforma el suelo (grid ondulado)
    fX           += sin(fZ * 2.7 + u_time * 0.50) * 0.09 * isVapor;
    // Grid: líneas verticales convergentes + horizontales con recesión perspectiva
    float fgX     = abs(fract(fX * 5.5) - 0.5);
    float fgZ     = abs(fract(fZ * 3.0) - 0.5);
    float fGrid   = max(smoothstep(0.046, 0.008, fgX), smoothstep(0.046, 0.008, fgZ));
    // U3 void: celdas aleatorias eliminadas (suelo roto/fragmentado)
    float fGlSeed = hash(vec2(floor(fX * 5.5), floor(u_time * 2.0)));
    fGrid        *= 1.0 - isVoid * step(0.58, fGlSeed);
    // Fade: aparece suavemente al horizonte, se atenúa en el borde inferior
    float fFade   = smoothstep(0.0, 0.16, fT) * smoothstep(1.0, 0.72, fT);
    // Intensidad por universo: U1 Tron es el símbolo (bright), U0 tenue
    float fInt    = 0.18 + isTron * 0.40 + isVapor * 0.08;

    // ── VÓRTICE ESPIRAL ─────────────────────────────────────────────────────
    float spiralTwist = u_time * 0.9 + 3.2 / (dist + 0.048);
    float vortexAngle = angle + spiralTwist * 0.55;
    float spokes      = 0.5 + 0.5 * sin(vortexAngle * 7.0);
    float vortexMask  = smoothstep(0.27, 0.0, dist);
    float vortex      = spokes * vortexMask;

    float ring = smoothstep(0.27, 0.22, dist) * smoothstep(0.06, 0.10, dist);
    float core = smoothstep(0.07, 0.0, dist);

    // ── PULSO DE RESPIRACIÓN ────────────────────────────────────────────────
    float pulse  = 0.5 + 0.5 * sin(u_time * 0.65);
    float pulse2 = 0.5 + 0.5 * sin(u_time * 0.42 + 1.5708);

    // ── ENSAMBLE DE COLOR ────────────────────────────────────────────────────
    vec3 col = colBg;

    // Estrellas tintadas por paleta de universo + split cromático
    col.r += (starsR * 0.55 + stars * 0.45) * colStar.r;
    col.g +=  stars  * 0.80                  * colStar.g;
    col.b += (starsB * 0.55 + stars * 0.90)  * colStar.b;

    // Grid Tron (U1) — color del vórtice del universo
    col += colVortex * grid * 0.75;

    // Suelo holográfico — ancla el vacío a un espacio VR habitable
    col += colVortex * fGrid * fOn * fFade * fInt;

    // Vórtice coloreado por universo
    col += colVortex * vortex * (0.55 + 0.45 * pulse);

    // Anillo coloreado por universo
    col += colRing * ring * (0.70 + 0.30 * pulse2);

    // Túnel/ojo: apagar hacia el vacío + destello del color de vórtice en centro
    col  = mix(col, colBg * 0.25, core * 0.93);
    col += colVortex * core * 0.28 * pulse;

    // ── FLASH DEL FRENTE DE ONDA (blanco puro) ───────────────────────────────
    // Rip blanco que barre el canvas — mix-blend-mode:screen lo hace sobreexpuesto
    col += vec3(1.0, 0.95, 1.0) * warpEdge * 0.85;

    // ── GLITCH COLOR U3 — scanlines rojas aleatorias ─────────────────────────
    float rNoise = hash(vec2(floor(uv.y * 28.0 + 0.5), floor(u_time * 15.0)));
    col += vec3(0.35, 0.0, 0.0) * isVoid * step(0.72, rNoise) * 0.12;

    // ── ALPHA ────────────────────────────────────────────────────────────────
    float alpha = clamp(
      (stars + starsR * 0.30 + starsB * 0.30) * 0.65
      + vortex  * 1.10
      + ring    * 0.85
      + core    * 0.75
      + grid    * 0.70
      + fGrid * fOn * fFade * 0.62  // suelo holográfico
      + warpEdge * 1.10,            // el flash es opaco
      0.0, 1.0
    );

    gl_FragColor = vec4(col, alpha);
  }
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

function initGL(canvas) {
  if (!canvas) return false
  gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  })
  if (!gl) return false

  const vert = compileShader(gl.VERTEX_SHADER,   VERT_SRC)
  const frag = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vert || !frag) return false

  program = gl.createProgram()
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (import.meta.env.DEV) {
      console.error('[Ch4PortalShader] link error:', gl.getProgramInfoLog(program))
    }
    return false
  }

  // Quad que cubre todo el canvas
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  gl.useProgram(program)

  // Uniform locations — base
  uTime       = gl.getUniformLocation(program, 'u_time')
  uResolution = gl.getUniformLocation(program, 'u_resolution')
  uPortal     = gl.getUniformLocation(program, 'u_portal')
  uPointer    = gl.getUniformLocation(program, 'u_pointer')
  uWarpR      = gl.getUniformLocation(program, 'u_warpR')
  // Paleta actual
  uColVortex  = gl.getUniformLocation(program, 'u_colVortex')
  uColRing    = gl.getUniformLocation(program, 'u_colRing')
  uColStar    = gl.getUniformLocation(program, 'u_colStar')
  uColBg      = gl.getUniformLocation(program, 'u_colBg')
  // Paleta siguiente
  uColVortexN = gl.getUniformLocation(program, 'u_colVortexN')
  uColRingN   = gl.getUniformLocation(program, 'u_colRingN')
  uColStarN   = gl.getUniformLocation(program, 'u_colStarN')
  uColBgN     = gl.getUniformLocation(program, 'u_colBgN')
  // IDs de universo
  uUniverseId  = gl.getUniformLocation(program, 'u_universeId')
  uUniverseIdN = gl.getUniformLocation(program, 'u_universeIdN')

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  canvas.addEventListener('webglcontextlost', onContextLost, false)
  return true
}

function onContextLost(e) {
  e.preventDefault()
  stopLoop()
  gl = null
  program = null
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderFrame(ts, warpRValue) {
  if (!gl || !program) return
  const t = startTime ? (ts - startTime) / 1000 : 0

  const driftX = Math.sin(t * 0.25) * 0.18
  const driftY = Math.cos(t * 0.19) * 0.14

  const curr = UNIVERSES[universeIdx]
  const next = UNIVERSES[nextUniverseIdx]

  const w = gl.drawingBufferWidth
  const h = gl.drawingBufferHeight
  gl.viewport(0, 0, w, h)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.uniform1f(uTime,       t)
  gl.uniform2f(uResolution, w, h)
  gl.uniform2f(uPortal,     0.81, 0.75)
  gl.uniform2f(uPointer,    ptrMx + driftX, ptrMy + driftY)
  gl.uniform1f(uWarpR,      warpRValue)
  gl.uniform3fv(uColVortex,  curr.colVortex)
  gl.uniform3fv(uColRing,    curr.colRing)
  gl.uniform3fv(uColStar,    curr.colStar)
  gl.uniform3fv(uColBg,      curr.colBg)
  gl.uniform3fv(uColVortexN, next.colVortex)
  gl.uniform3fv(uColRingN,   next.colRing)
  gl.uniform3fv(uColStarN,   next.colStar)
  gl.uniform3fv(uColBgN,     next.colBg)
  gl.uniform1f(uUniverseId,  curr.id)
  gl.uniform1f(uUniverseIdN, next.id)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

// ── Ciclo de universo ─────────────────────────────────────────────────────────

function triggerWarp(ts) {
  if (warpActive || reduced()) return
  warpActive      = true
  warpStartTs     = ts
  nextUniverseIdx = (universeIdx + 1) % UNIVERSES.length
  midpointEmitted = false
  currentWarpR    = 0.0
  // SFX: la animación de warp acompaña al whoosh — PRM ya fue chequeado arriba
  whoosh()
}

// ── RAF loop ──────────────────────────────────────────────────────────────────

function tick(ts) {
  if (!running) return

  // Primer frame: inicializar startTime y schedular primer shift
  if (!startTime) {
    startTime  = ts
    nextShiftAt = ts + FIRST_SHIFT_MS
  }

  // Disparar warp si ya es hora y no hay uno en progreso
  if (!warpActive && ts >= nextShiftAt) {
    triggerWarp(ts)
  }

  // Actualizar progreso de la onda
  if (warpActive) {
    const elapsedS  = (ts - warpStartTs) / 1000
    const progress  = elapsedS / WARP_DURATION_S
    currentWarpR    = Math.min(progress, 1.0) * WARP_MAX_R

    // Al cruzar el midpoint: emitir evento al parent para swap de glifos + CSS
    if (!midpointEmitted && progress > 0.5) {
      midpointEmitted = true
      emit('universe-change', nextUniverseIdx)
    }

    // Onda completada: confirmar universo y programar siguiente shift
    if (progress >= 1.0) {
      universeIdx  = nextUniverseIdx
      warpActive   = false
      currentWarpR = 0.0
      const jitter = MIN_SHIFT_MS + Math.random() * (MAX_SHIFT_MS - MIN_SHIFT_MS)
      nextShiftAt  = ts + jitter
    }
  }

  if (!document.hidden) renderFrame(ts, currentWarpR)
  rafId = requestAnimationFrame(tick)
}

function startLoop() {
  if (running || !gl) return
  running = true
  // Reset completo al entrar a ch4: siempre empieza en U0 Synthwave
  startTime      = 0
  universeIdx    = 0
  nextUniverseIdx = 0
  warpActive     = false
  currentWarpR   = 0.0
  nextShiftAt    = Infinity // se setea en el primer tick
  emit('universe-change', 0) // reset del DOM también
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
  window.removeEventListener('pointermove', onPointer)
  if (gl) {
    const canvas = canvasRef.value
    if (canvas) canvas.removeEventListener('webglcontextlost', onContextLost)
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
    gl = null
    program = null
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

  if (reduced()) {
    // PRM: frame estático en t=0, sin ciclo de universo
    startTime = 0
    renderFrame(0, 0.0)
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
    width="320"
    height="180"
    aria-hidden="true"
  />
</template>

<style scoped>
.ch4-shader-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  image-rendering: pixelated;
  mix-blend-mode: screen;
}
</style>
