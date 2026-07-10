<!--
  Ch4PortalShader.vue — WebGL1 portal vortex: paso entre mundos y realidades.

  Shader: starfield procedural warpando al portal + vórtice espiral polar
  + aberración cromática intensificada cerca del anillo + lensing gravitacional.
  Canvas baja-resolución (320×180) upscaleada a pixelated — estética pixel-art + perf.

  Lifecycle: el RAF corre SOLO cuando activeChapter === 4 y !document.hidden.
  PRM: si prefersReduced, render de frame estático único (t=0) sin loop.
  Fallback: si getContext('webgl') falla → supported=false → v-if suprime el canvas.
             Ch4 queda exactamente como sin este componente.
  Cleanup: onBeforeUnmount + import.meta.hot.dispose → cancelAnimationFrame + loseContext.

  Z-index: 1 — encima del portal PNG (z0), debajo de glifos/character (z2+).
  mix-blend-mode: screen → píxeles negros transparentes, colores brillantes aditivos.
  pointer-events: none; aria-hidden: true.

  Portal center medido en viewport real (2026-07-09b): left≈81%, top≈75%.
  En el shader esto es UV (0.81, 0.75) con origen top-left.
-->
<script setup>
import { ref, inject, watch, onMounted, onBeforeUnmount } from 'vue'

// ── Inject (opcionales, con fallback defensivo) ─────────────────────────────
const injectedScrollState = inject('scrollState', null)
const injectedPrm = inject('prm', null)
// Si no hay scrollState (tests sin provider), defaultear a -1 → loop nunca arranca.
const activeChapter = injectedScrollState?.activeChapter ?? ref(-1)
const prefersReduced = injectedPrm?.prefersReduced ?? ref(false)
const reduced = () => prefersReduced.value

// ── Vue state ───────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const supported = ref(true) // false = WebGL no disponible → v-if suprime canvas

// ── WebGL state — fuera de ref (nunca vue-reactive) ─────────────────────────
let gl = null
let program = null
let rafId = 0
let startTime = 0
let running = false
let ptrMx = 0 // puntero normalizado -0.5..0.5
let ptrMy = 0
let stopWatcher = null

// Uniform locations
let uTime = null
let uResolution = null
let uPortal = null
let uPointer = null

// ── Shaders ─────────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */ `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// Fragment shader: starfield + vórtice espiral polar + lensing + aberración cromática.
// Todos los parámetros son uniformes — sin branch en GLSL para simplificar.
const FRAG_SRC = /* glsl */ `
  precision mediump float;

  uniform vec2  u_resolution; // canvas pixels (320, 180)
  uniform float u_time;       // segundos desde que empezó el loop
  uniform vec2  u_portal;     // centro del portal UV origen top-left (0.81, 0.75)
  uniform vec2  u_pointer;    // mx+dx, my+dy del puntero+drift (-0.5..0.5)

  // ── Hash pseudo-aleatorio por celda ────────────────────────────────────────
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Brillo de estrella en una celda UV a escala dada.
  // presence: sólo el 18% de celdas tiene estrella (hash > 0.82).
  // twinkle: modulación sinusoidal lenta — velocidad y fase distintas por celda.
  float starField(vec2 uv, float scale, float seed) {
    vec2 g = floor(uv * scale);
    vec2 f = fract(uv * scale) - 0.5;
    float presence = step(0.82, hash(g));
    float rate   = 1.5 + hash(g + vec2(7.3, 13.7)) * 3.5;
    float phase  = hash(g + vec2(1.1, 2.3)) * 6.283;
    float twinkle = 0.5 + 0.5 * sin(u_time * rate + phase + seed);
    // Pixel-art: suavizado mínimo → punto duro (smoothstep estrecho).
    return presence * twinkle * smoothstep(0.19, 0.0, length(f));
  }

  void main() {
    // UV con origen top-left (flip de WebGL bottom-left).
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv.y = 1.0 - uv.y;

    // Centro del portal con microdesplazamiento por puntero.
    vec2 portal = u_portal + u_pointer * 0.035;
    vec2 d    = uv - portal;
    float dist  = length(d);
    float angle = atan(d.y, d.x);
    vec2 lensDir = normalize(d + vec2(0.0001)); // dir radial, evita nan en center

    // ── LENSING gravitacional: dobla UV hacia el portal ─────────────────────
    // Cuadrático para que el efecto sea sutil lejos y fuerte cerca.
    float lensStr = 0.048 / (dist * dist + 0.055);
    vec2 lensedUV = uv - lensDir * lensStr;

    // ── WARP: estrellas caen hacia el portal cerca del centro ──────────────
    float warp = smoothstep(0.55, 0.05, dist) * 0.22;
    vec2 warpedUV = lensedUV - lensDir * warp;

    // ── STARFIELD 3 escalas sobre UV lenteada ──────────────────────────────
    float stars = 0.0;
    stars += starField(lensedUV, 13.0, 0.0) * 0.85;
    stars += starField(lensedUV, 22.0, 2.1) * 0.65;
    stars += starField(lensedUV,  7.0, 4.7) * 1.1;
    // Capa warped visible sólo cerca del portal (sensación de caída).
    stars += starField(warpedUV, 17.0, 1.3) * smoothstep(0.50, 0.07, dist) * 0.75;
    stars = clamp(stars, 0.0, 1.0);

    // ── ABERRACIÓN CROMÁTICA ────────────────────────────────────────────────
    // Intensidad 0 lejos del portal, máxima en el anillo.
    float caStr = smoothstep(0.62, 0.0, dist) * 0.058;
    vec2 caOff  = lensDir * caStr;
    // Canal R desplazado hacia afuera, B hacia adentro.
    float starsR = clamp(
      starField(lensedUV + caOff, 13.0, 0.0) + starField(lensedUV + caOff, 22.0, 2.1),
      0.0, 1.0
    );
    float starsB = clamp(
      starField(lensedUV - caOff, 13.0, 0.0) + starField(lensedUV - caOff, 22.0, 2.1),
      0.0, 1.0
    );

    // ── VÓRTICE ESPIRAL ─────────────────────────────────────────────────────
    // Rotación acumulada: espiral más apretada cerca del centro.
    float spiralTwist = u_time * 0.9 + 3.2 / (dist + 0.048);
    float vortexAngle = angle + spiralTwist * 0.55;
    // Patrón de rayos/spokes con 7 brazos.
    float spokes = 0.5 + 0.5 * sin(vortexAngle * 7.0);
    // Máscara que sólo muestra el vórtice dentro del radio del portal.
    float vortexMask = smoothstep(0.27, 0.0, dist);
    float vortex = spokes * vortexMask;

    // ── ANILLO del portal ───────────────────────────────────────────────────
    // Banda estrecha en el borde del vórtice — simula el anillo físico del portal.
    float ring = smoothstep(0.27, 0.22, dist) * smoothstep(0.06, 0.10, dist);

    // ── OJO del túnel (núcleo vacío) ────────────────────────────────────────
    float core = smoothstep(0.07, 0.0, dist);

    // ── RESPIRACIÓN / PULSO ─────────────────────────────────────────────────
    float pulse  = 0.5 + 0.5 * sin(u_time * 0.65);
    float pulse2 = 0.5 + 0.5 * sin(u_time * 0.42 + 1.5708); // desfasado 90°

    // ── ENSAMBLE DE COLOR ───────────────────────────────────────────────────
    // Base: espacio profundo casi negro.
    vec3 col = vec3(0.0, 0.005, 0.02);

    // Estrellas — canal RGB con split de aberración cromática.
    col.r += starsR * 0.55 + stars * 0.45;
    col.g += stars  * 0.80;
    col.b += starsB * 0.55 + stars * 0.90;

    // Vórtice: cyan synthwave.
    col += vec3(0.0, 1.0, 0.95) * vortex * (0.55 + 0.45 * pulse);

    // Anillo: magenta synthwave, ligeramente desfasado del vórtice.
    col += vec3(1.0, 0.05, 0.85) * ring * (0.70 + 0.30 * pulse2);

    // Túnel/ojo: oscurecer hacia el vacío + destello cyan tenue en el centro.
    col = mix(col, vec3(0.0, 0.04, 0.07), core * 0.93);
    col += vec3(0.0, 0.75, 1.0) * core * 0.28 * pulse;

    // ── ALPHA ───────────────────────────────────────────────────────────────
    // El canvas usa mix-blend-mode:screen → alpha 0 = pasa a través sin tocar.
    float alpha = clamp(
      (stars + starsR * 0.30 + starsB * 0.30) * 0.65
      + vortex * 1.10
      + ring   * 0.85
      + core   * 0.75,
      0.0, 1.0
    );

    gl_FragColor = vec4(col, alpha);
  }
`

// ── Helpers WebGL ────────────────────────────────────────────────────────────

function compileShader(type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // No lanzar: registrar y retornar null → initGL devuelve false → fallback CSS.
    if (import.meta.env.DEV) {
      console.error('[Ch4PortalShader] shader compile error:', gl.getShaderInfoLog(sh))
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
    premultipliedAlpha: false, // straight alpha — más predecible con mix-blend-mode:screen
    antialias: false,          // pixel-art: sin antialiasing
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
      console.error('[Ch4PortalShader] program link error:', gl.getProgramInfoLog(program))
    }
    return false
  }

  // Quad que cubre todo el canvas (dos triángulos).
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )

  const aPos = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  gl.useProgram(program)
  uTime       = gl.getUniformLocation(program, 'u_time')
  uResolution = gl.getUniformLocation(program, 'u_resolution')
  uPortal     = gl.getUniformLocation(program, 'u_portal')
  uPointer    = gl.getUniformLocation(program, 'u_pointer')

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

// ── Render un frame ──────────────────────────────────────────────────────────

function renderFrame(ts) {
  if (!gl || !program) return
  const t = startTime ? (ts - startTime) / 1000 : 0

  const w = gl.drawingBufferWidth
  const h = gl.drawingBufferHeight
  gl.viewport(0, 0, w, h)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // Drift autónomo (misma fórmula que el parallax CSS del padre).
  const elapsed = t
  const driftX = Math.sin(elapsed * 0.25) * 0.18
  const driftY = Math.cos(elapsed * 0.19) * 0.14

  gl.uniform1f(uTime,       t)
  gl.uniform2f(uResolution, w, h)
  gl.uniform2f(uPortal,     0.81, 0.75) // centro del anillo medido 2026-07-09b
  gl.uniform2f(uPointer,    ptrMx + driftX, ptrMy + driftY)

  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

// ── RAF loop ─────────────────────────────────────────────────────────────────

function tick(ts) {
  if (!running) return
  if (!startTime) startTime = ts
  // Pausa si pestaña en background (Chrome throttlea rAF de todas formas, pero
  // evitamos GL calls innecesarios cuando document.hidden es true).
  if (!document.hidden) renderFrame(ts)
  rafId = requestAnimationFrame(tick)
}

function startLoop() {
  if (running || !gl) return
  running = true
  startTime = 0 // resetear para que el drift empiece desde 0 al re-entrar al chapter
  rafId = requestAnimationFrame(tick)
}

function stopLoop() {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

// ── Pointer tracking propio (independiente del parallax CSS del padre) ────────

function onPointer(ev) {
  if (reduced()) return
  ptrMx = ev.clientX / window.innerWidth  - 0.5
  ptrMy = ev.clientY / window.innerHeight - 0.5
}

// ── Cleanup completo ─────────────────────────────────────────────────────────

function destroy() {
  stopWatcher?.()
  stopLoop()
  window.removeEventListener('pointermove', onPointer)
  if (gl) {
    const canvas = canvasRef.value
    if (canvas) canvas.removeEventListener('webglcontextlost', onContextLost)
    // Liberar el contexto WebGL explícitamente (WEBGL_lose_context si disponible).
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
    gl = null
    program = null
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  if (!initGL(canvas)) {
    supported.value = false
    return
  }

  if (reduced()) {
    // PRM: un frame estático en t=0, sin loop.
    startTime = 0
    renderFrame(0)
    return
  }

  window.addEventListener('pointermove', onPointer, { passive: true })

  // Watch activeChapter: arrancar el loop al entrar a ch4, detenerlo al salir.
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

// HMR: limpiar contexto WebGL al hot-reload para evitar GL context leaks.
if (import.meta.hot) {
  import.meta.hot.dispose(destroy)
}
</script>

<template>
  <!--
    aria-hidden: puramente decorativo.
    pointer-events: none: el shader no debe interceptar clicks/hover del contenido.
    width/height: resolución interna baja (320×180) — CSS la upscalea a 100%/100%.
    image-rendering: pixelated: WebGL pixels grandes y nítidos (estética pixel-art).
    mix-blend-mode: screen: negro → transparente, colores brillantes → aditivos al fondo.
  -->
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
