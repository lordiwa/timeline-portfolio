// tests/components/Ch4PortalShader.test.js
// Regresión tier tests-after para Ch4PortalShader.vue (TASK-010 rewrite: WebGL
// multi-pass — Pass A "mundo" (túnel raymarcheado) → Pass B "eco" (feedback
// ping-pong) → Pass C "óptica" (godrays/barrel/CA/viñeta), 3 tiers HIGH/MED/LOW,
// coreografía de entrada por beats, PRM con frame estático t=7.3).
//
// jsdom no implementa WebGL real: canvas.getContext('webgl') retorna null por
// defecto. Los tests con GL real requieren el mock de abajo (makeGLMock), que
// cubre además de lo básico (shaders/programas) los FBOs/texturas que el
// pipeline multi-pass necesita (createFramebuffer, createTexture, etc.) y las
// APIs de detección de tier (getExtension WEBGL_debug_renderer_info,
// matchMedia, navigator.hardwareConcurrency/deviceMemory).
//
// Cobertura:
// - T1 fallback silencioso sin WebGL
// - T2 PRM + sin WebGL → no canvas (mismo resultado T1)
// - T3 activeChapter distinto de 4 → no crash
// - T4 sin inject → no crash
// - T5 DOM contract con WebGL disponible (canvas aria-hidden, sin atributos width/height fijos)
// - T6 UNIVERSES + TIER_CONFIG: shape correcto, incluye tunnelDensity/warpAmp
// - T7 universe-change emitido al arrancar el loop (reset a U0)
// - T8 PRM desactiva el ciclo de universo (no universe-change)
// - T9 PRM + WebGL disponible → SÍ hay canvas, se renderiza el frame estático, sin RAF loop
// - T10 jump-progress: se emite al entrar a ch4, primer beat 'boot'
// - T11 tier debug override: ?ch4tier=LOW fuerza el tier sin crashear
// - T12 resize: no crashea al disparar window resize con WebGL mockeado

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ch4PortalShader, { UNIVERSES, TIER_CONFIG } from '@/components/Ch4PortalShader.vue'

// opticsFragSrc() vive dentro de <script setup> (no exportable — <script
// setup> no admite `export` de bindings arbitrarios), así que el regression
// lock de la lente Sobel lee el source directo, igual que el resto de los
// locks CSS/GLSL de este proyecto (p.ej. tests/integration/ch4-layout-height-fix.test.js).
const SHADER_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Ch4PortalShader.vue'),
  'utf8'
)

// ── Factory de mock WebGL — cubre programas/FBOs/texturas del pipeline multi-pass ──
function makeGLMock({ loseContext = false, renderer = 'Mock GPU' } = {}) {
  const debugExt = { UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL' }
  return {
    VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713, LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962, STATIC_DRAW: 35044, TRIANGLES: 4,
    COLOR_BUFFER_BIT: 16384, SRC_ALPHA: 770, ONE_MINUS_SRC_ALPHA: 771,
    FRAMEBUFFER: 36160, TEXTURE_2D: 3553, RGBA: 6408, UNSIGNED_BYTE: 5121,
    TEXTURE_MIN_FILTER: 10241, TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242, TEXTURE_WRAP_T: 10243, CLAMP_TO_EDGE: 33071, LINEAR: 9729,
    COLOR_ATTACHMENT0: 36064, FRAMEBUFFER_COMPLETE: 36053,
    TEXTURE0: 33984, TEXTURE1: 33985,

    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    bindAttribLocation: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    uniform1f: vi.fn(), uniform2f: vi.fn(), uniform3fv: vi.fn(), uniform1i: vi.fn(),
    drawArrays: vi.fn(),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    createFramebuffer: vi.fn(() => ({})),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    deleteFramebuffer: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 36053),
    getParameter: vi.fn((p) => (p === debugExt.UNMASKED_RENDERER_WEBGL ? renderer : null)),
    getExtension: vi.fn((name) => {
      if (name === 'WEBGL_lose_context') return loseContext ? { loseContext: vi.fn() } : null
      if (name === 'WEBGL_debug_renderer_info') return debugExt
      return null
    }),
  }
}

function patchWebGL(glMock) {
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn((type) => (type === 'webgl' ? glMock : null))
  return () => { HTMLCanvasElement.prototype.getContext = orig }
}

function mountShader({ chapter = ref(4), prefersReduced = ref(false), withProvide = true } = {}) {
  const opts = { global: {} }
  if (withProvide) {
    opts.global.provide = {
      scrollState: { activeChapter: chapter },
      prm: { prefersReduced },
    }
  }
  return mount(Ch4PortalShader, opts)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Ch4PortalShader.vue', () => {
  // ── T1 Fallback: sin WebGL (jsdom) ──────────────────────────────────────
  it('T1 monta sin crash cuando WebGL no disponible → no canvas en DOM tras nextTick', async () => {
    const wrapper = mountShader()
    await flushPromises()
    expect(wrapper.find('canvas').exists()).toBe(false)
  })

  it('T1 no rompe onBeforeUnmount cuando nunca se inicializó WebGL', async () => {
    const wrapper = mountShader()
    await flushPromises()
    expect(() => wrapper.unmount()).not.toThrow()
  })

  // ── T2 PRM activo, sin WebGL ─────────────────────────────────────────────
  it('T2 PRM prefersReduced=true + sin WebGL → no canvas, sin crash', async () => {
    const wrapper = mountShader({ prefersReduced: ref(true) })
    await flushPromises()
    expect(wrapper.find('canvas').exists()).toBe(false)
  })

  // ── T3 activeChapter ≠ 4 ────────────────────────────────────────────────
  it('T3 activeChapter=5 → no crash (loop no se inicia)', () => {
    expect(() => mountShader({ chapter: ref(5) })).not.toThrow()
  })

  it('T3 activeChapter=0 → no crash (boot screen, no ch4)', () => {
    expect(() => mountShader({ chapter: ref(0) })).not.toThrow()
  })

  // ── T4 sin inject ────────────────────────────────────────────────────────
  it('T4 sin inject (sin scrollState, sin prm) → no crash', () => {
    expect(() => mountShader({ withProvide: false })).not.toThrow()
  })

  // ── T5 Mock WebGL: canvas montado, aria-hidden ───────────────────────────
  it('T5 con WebGL mockeado → canvas en DOM con aria-hidden=true', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      const canvas = wrapper.find('canvas')
      expect(canvas.exists()).toBe(true)
      expect(canvas.attributes('aria-hidden')).toBe('true')
      // TASK-010: el canvas ya NO fija width/height="320"/"180" en el
      // template — se dimensiona dinámicamente por JS (clientWidth/Height *
      // dpr, aplicado en applySize()). En jsdom (getBoundingClientRect=0)
      // cae al piso Math.max(1,...), pero el punto es que NO quedó en 320.
      expect(canvas.attributes('width')).not.toBe('320')
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  it('T5 WebGL mockeado → unmount sin crash (cleanup FBOs + loseContext)', () => {
    const restore = patchWebGL(makeGLMock({ loseContext: true }))
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(() => wrapper.unmount()).not.toThrow()
    } finally {
      restore()
    }
  })

  // ── T6 UNIVERSES + TIER_CONFIG ───────────────────────────────────────────
  it('T6 UNIVERSES exportado: 4 universos con id secuencial, colores válidos y tunnelDensity/warpAmp', () => {
    expect(UNIVERSES).toHaveLength(4)
    UNIVERSES.forEach((u, i) => {
      expect(u.id).toBe(i)
      for (const key of ['colVortex', 'colRing', 'colStar', 'colBg']) {
        expect(u[key]).toHaveLength(3)
        u[key].forEach((v) => {
          expect(typeof v).toBe('number')
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        })
      }
      expect(typeof u.tunnelDensity).toBe('number')
      expect(u.tunnelDensity).toBeGreaterThan(0)
      expect(typeof u.warpAmp).toBe('number')
      expect(u.warpAmp).toBeGreaterThan(0)
    })
  })

  it('T6 UNIVERSES[0] es Synthwave (cyan/magenta)', () => {
    const u0 = UNIVERSES[0]
    expect(u0.colVortex[1]).toBeCloseTo(1.0, 1)
    expect(u0.name).toBe('synthwave')
  })

  it('T6 UNIVERSES[3] es Void (rojo dominante)', () => {
    const u3 = UNIVERSES[3]
    expect(u3.colVortex[0]).toBeGreaterThan(0.5)
    expect(u3.colVortex[1]).toBeLessThan(0.1)
    expect(u3.name).toBe('void')
  })

  it('T6 TIER_CONFIG: HIGH > MED > LOW en pasos de raymarch, octavas y taps de godrays', () => {
    expect(TIER_CONFIG.HIGH.steps).toBeGreaterThan(TIER_CONFIG.MED.steps)
    expect(TIER_CONFIG.MED.steps).toBeGreaterThan(TIER_CONFIG.LOW.steps)
    expect(TIER_CONFIG.HIGH.oct).toBeGreaterThan(TIER_CONFIG.MED.oct)
    expect(TIER_CONFIG.MED.oct).toBeGreaterThan(TIER_CONFIG.LOW.oct)
    expect(TIER_CONFIG.HIGH.taps).toBeGreaterThan(TIER_CONFIG.MED.taps)
    expect(TIER_CONFIG.LOW.taps).toBe(0)
    expect(TIER_CONFIG.LOW.steps).toBe(0) // LOW degrada a vórtice 2D (spec §4.1)
  })

  // ── T6b lente reveladora — matriz de tiers (spec §7.3) ───────────────────
  it('T6b TIER_CONFIG.lens: presente en HIGH/MED, ausente en LOW (spec §7.3)', () => {
    expect(TIER_CONFIG.HIGH.lens).toBe(true)
    expect(TIER_CONFIG.MED.lens).toBe(true)
    expect(TIER_CONFIG.LOW.lens).toBe(false)
  })

  it('T6b UNIVERSES: cada universo trae edgeTint (vec3 0..1) para la lente reveladora', () => {
    UNIVERSES.forEach((u) => {
      expect(u.edgeTint).toHaveLength(3)
      u.edgeTint.forEach((v) => {
        expect(typeof v).toBe('number')
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      })
    })
  })

  // ── T6c regression lock: la lente Sobel no puede volver a recortarse en
  // silencio (ronda de completado TASK-010 — ya se cortó una vez, el hallazgo
  // que motivó esta ronda fue "verifiqué que no hay ni una ocurrencia de
  // sobel en src/"). Rojo si alguien vuelve a recortar el efecto.
  it('T6c source de Ch4PortalShader.vue contiene la lente Sobel (sobelEdge, #define LENS, LENS_R/LENS_LERP)', () => {
    expect(SHADER_SOURCE).toMatch(/sobelEdge/)
    expect(SHADER_SOURCE).toMatch(/#define LENS \$\{lens/)
    expect(SHADER_SOURCE).toMatch(/LENS_LERP\s*=\s*0\.06/) // spec §4.6: inercia 0.06/frame
    expect(SHADER_SOURCE).toMatch(/LENS_ORBIT_PERIOD_S\s*=\s*23/) // spec §4.6: mobile, lissajous 23s
  })

  it('T6c opticsFragSrc({taps,sde,lens}) — TIER_CONFIG.lens gatea #define LENS por tier vía la misma función que taps/sde', () => {
    // La función se llama exactamente igual para las 3 variantes al compilar
    // los programas en initGL() — el lock verifica que 'lens' viaja en el
    // mismo objeto de config que taps/sde, no un mecanismo aparte que se
    // pueda desincronizar del resto de la matriz de tiers.
    expect(SHADER_SOURCE).toMatch(/function opticsFragSrc\(\{ taps, sde, lens \}\)/)
    expect(SHADER_SOURCE).toMatch(/opticsFragSrc\(cfg\)/) // initGL: cfg = TIER_CONFIG[tier], trae .lens
  })

  // ── T7 universe-change emitido al arrancar el loop ───────────────────────
  it('T7 con WebGL mockeado + ch4 activo → universe-change emitido con 0 (reset a U0)', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      const events = wrapper.emitted('universe-change')
      expect(events).toBeTruthy()
      expect(events[0][0]).toBe(0)
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  it('T7 activeChapter=5 + WebGL → universe-change NO emitido (loop inactivo)', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(5) })
      expect(wrapper.emitted('universe-change')).toBeFalsy()
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  // ── T8 PRM desactiva el ciclo de universo ────────────────────────────────
  it('T8 PRM prefersReduced=true + WebGL → no universe-change emitido (sin ciclo)', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4), prefersReduced: ref(true) })
      expect(wrapper.emitted('universe-change')).toBeFalsy()
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  // ── T9 PRM + WebGL disponible: frame estático, SIN RAF loop ──────────────
  it('T9 PRM + WebGL → hay canvas (se renderiza el frame estático t=7.3), no queda vacío', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4), prefersReduced: ref(true) })
      expect(wrapper.find('canvas').exists()).toBe(true)
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  it('T9 PRM + WebGL → drawArrays se llama (Pass A/B/C ejecutan un frame) pero NO se agenda un RAF loop continuo', () => {
    const restore = patchWebGL(makeGLMock())
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
    let wrapper
    try {
      const glMock = makeGLMock()
      HTMLCanvasElement.prototype.getContext = vi.fn(() => glMock)
      wrapper = mountShader({ chapter: ref(4), prefersReduced: ref(true) })
      // Pass A + Pass B + Pass C → drawArrays llamado (>=3 veces, un render único).
      expect(glMock.drawArrays.mock.calls.length).toBeGreaterThanOrEqual(3)
      // Sin loop: requestAnimationFrame no debe haber sido usado para animar (PRM
      // no debe llamar tick recursivo). El único caller legítimo de rAF bajo PRM
      // es el contador de HUD en Chapter4Content, no este componente.
      expect(rafSpy).not.toHaveBeenCalled()
    } finally {
      rafSpy.mockRestore()
      restore()
      wrapper?.unmount()
    }
  })

  // ── T10 jump-progress: coreografía de entrada ────────────────────────────
  it('T10 con WebGL + ch4 activo → jump-progress se emite con beat "boot" en la primera entrada', async () => {
    vi.useFakeTimers()
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      // El primer tick corre en el próximo rAF (mockeado como setTimeout 16ms via tests/setup.js)
      await vi.advanceTimersByTimeAsync(20)
      const events = wrapper.emitted('jump-progress')
      expect(events).toBeTruthy()
      expect(events[0][0].beat).toBe('boot')
      expect(events[0][0].progress).toBeGreaterThanOrEqual(0)
    } finally {
      restore()
      wrapper?.unmount()
      vi.useRealTimers()
    }
  })

  // ── T11 tier debug override ──────────────────────────────────────────────
  it('T11 ?ch4tier=LOW en la URL → monta sin crash con WebGL mockeado', () => {
    const originalLocation = window.location.href
    window.history.pushState({}, '', '/?ch4tier=LOW')
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      expect(() => { wrapper = mountShader({ chapter: ref(4) }) }).not.toThrow()
    } finally {
      restore()
      wrapper?.unmount()
      window.history.pushState({}, '', originalLocation)
    }
  })

  // ── T11b tier observable — data-ch4-tier + emit tier-change ─────────────
  // Regression lock del hook de observabilidad usado para verificar en vivo
  // (CDP) que la baja/subida automática de tier realmente ocurre (round de
  // completado TASK-010): sin esto, adaptTier() cambia currentTier pero no
  // hay forma externa de comprobarlo salvo inferirlo del framerate.
  it('T11b ?ch4tier=MED → canvas.dataset.ch4Tier refleja el tier forzado', () => {
    const originalLocation = window.location.href
    window.history.pushState({}, '', '/?ch4tier=MED')
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      const canvas = wrapper.find('canvas')
      expect(canvas.attributes('data-ch4-tier')).toBe('MED')
    } finally {
      restore()
      wrapper?.unmount()
      window.history.pushState({}, '', originalLocation)
    }
  })

  // ── T11c umbral de detección endurecido (ronda de completado TASK-010) ──
  // Antes: hc>=8 OR mem>=8 alcanzaba HIGH. Con la lente sumando costo al Pass
  // C, HIGH ya no sostenía 60fps en hardware que solo cumplía UNA señal (ver
  // hand-off). Ahora requiere AMBAS — este test es rojo/verde plantable:
  // revertir el && a || en detectInitialTier() hace que el tier detectado
  // vuelva a HIGH y el test caiga.
  it('T11c hc=8 pero mem=4 (solo UNA señal de capacidad) → detecta MED, no HIGH', () => {
    const originalHc = navigator.hardwareConcurrency
    const originalMem = navigator.deviceMemory
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { value: 4, configurable: true })
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(wrapper.find('canvas').attributes('data-ch4-tier')).toBe('MED')
    } finally {
      restore()
      wrapper?.unmount()
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: originalHc, configurable: true })
      Object.defineProperty(navigator, 'deviceMemory', { value: originalMem, configurable: true })
    }
  })

  it('T11b ?ch4tier=LOW → emite tier-change con "LOW" al montar', () => {
    const originalLocation = window.location.href
    window.history.pushState({}, '', '/?ch4tier=LOW')
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      const events = wrapper.emitted('tier-change')
      expect(events).toBeTruthy()
      expect(events[events.length - 1][0]).toBe('LOW')
    } finally {
      restore()
      wrapper?.unmount()
      window.history.pushState({}, '', originalLocation)
    }
  })

  // ── T12 resize ────────────────────────────────────────────────────────────
  it('T12 con WebGL mockeado → disparar window resize no crashea (recrea FBOs con debounce)', () => {
    vi.useFakeTimers()
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(() => {
        window.dispatchEvent(new Event('resize'))
        vi.advanceTimersByTime(250)
      }).not.toThrow()
    } finally {
      restore()
      wrapper?.unmount()
      vi.useRealTimers()
    }
  })

  // ── T13 regression lock: la lente reveladora NO puede volver a espejarse
  // en Y (ronda de corrección TASK-010, HIGH). "uv" en Pass C es nativa de
  // gl_FragCoord (bottom-up) — sin el flip explícito acá, "p" queda en el
  // espacio opuesto al de u_lensPos (top-left-origin, llega de JS con la
  // misma convención que u_portal/ptrMy). GL está 100% mockeado en esta
  // suite (no hay forma de verificar el signo con un render real), así que
  // esto es un lock de source, mismo patrón que T6c para la lente Sobel:
  // rojo si alguien borra el flip y vuelve a copiar "uv" directo.
  it('T13 HIGH: la lente flipea uv.y al construir "p" (mismo flip que lightUV de los godrays, spec §4: uv top-left-origin)', () => {
    expect(SHADER_SOURCE).toMatch(
      /vec2 p = \(vec2\(uv\.x, 1\.0 - uv\.y\) - 0\.5\) \* vec2\(u_aspect, 1\.0\);/
    )
  })

  // ── T14 regression lock: Pass B (feedback) se saltea en tier LOW ────────
  // (MEDIUM, matriz §7.3: "Feedback buffer: si HIGH/MED, no LOW"). Antes
  // renderFrame() corría renderFeedback() incondicionalmente en los 3 tiers.
  it('T14 MEDIUM: renderFrame gatea renderFeedback por tier — LOW no paga el pass de eco (spec §7.3)', () => {
    expect(SHADER_SOURCE).toMatch(/const hasFeedback = currentTier !== 'LOW'/)
    expect(SHADER_SOURCE).toMatch(/if \(hasFeedback\) renderFeedback\(optics\.warpEnv\)/)
  })

  it('T14 MEDIUM: con ?ch4tier=LOW no crashea al renderizar (Pass C cae a fboWorld directo)', () => {
    const originalLocation = window.location.href
    window.history.pushState({}, '', '/?ch4tier=LOW')
    vi.useFakeTimers()
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(() => vi.advanceTimersByTimeAsync(50)).not.toThrow()
    } finally {
      restore()
      wrapper?.unmount()
      vi.useRealTimers()
      window.history.pushState({}, '', originalLocation)
    }
  })

  // ── T15 deviceMemory ausente (Firefox/Safari) — MEDIUM ───────────────────
  // Antes: `nav.deviceMemory ?? 4` convertía "sin señal" en "señal mala" y el
  // AND nunca daba HIGH en esos navegadores por más potente que fuera el
  // hardware real. Rojo/verde plantable: volver a `?? 4` hace que este test
  // caiga (mem pasa a valer 4, hc>=8 && 4>=8 es false → MED).
  it('T15 MEDIUM: hc=8 y deviceMemory=undefined (Firefox/Safari) → decide solo por hardwareConcurrency, detecta HIGH', () => {
    const originalHc = navigator.hardwareConcurrency
    const hadMem = 'deviceMemory' in navigator
    const originalMem = navigator.deviceMemory
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8, configurable: true })
    Object.defineProperty(navigator, 'deviceMemory', { value: undefined, configurable: true })
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(wrapper.find('canvas').attributes('data-ch4-tier')).toBe('HIGH')
    } finally {
      restore()
      wrapper?.unmount()
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: originalHc, configurable: true })
      if (hadMem) {
        Object.defineProperty(navigator, 'deviceMemory', { value: originalMem, configurable: true })
      } else {
        delete navigator.deviceMemory
      }
    }
  })

  // ── T16 paridad de uniforms — brecha estructural (MEDIUM) ────────────────
  // Con el GL mockeado, ningún test atrapa un typo de nombre de uniform entre
  // el GLSL y los arrays *_UNIFORM_NAMES que initGL() usa para resolver
  // location — ese típo pasaría 100% de la suite en verde (es exactamente lo
  // que dejó pasar el HIGH de esta ronda). Este lock compara, por cada pass,
  // el set de `uniform <tipo> <nombre>;` declarados en el GLSL contra el
  // array *_UNIFORM_NAMES correspondiente — deben coincidir exactamente.
  function extractBetween(src, startMarker, endMarker) {
    const start = src.indexOf(startMarker)
    expect(start, `marcador de inicio no encontrado: ${startMarker}`).toBeGreaterThan(-1)
    const end = src.indexOf(endMarker, start)
    expect(end, `marcador de fin no encontrado: ${endMarker}`).toBeGreaterThan(start)
    return src.slice(start, end)
  }

  function declaredUniformNames(glslSrc) {
    const names = new Set()
    const re = /uniform\s+\S+\s+(\w+)\s*;/g
    let m
    while ((m = re.exec(glslSrc))) names.add(m[1])
    return names
  }

  function listedUniformNames(src, constName) {
    const re = new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`)
    const m = src.match(re)
    expect(m, `array no encontrado: ${constName}`).toBeTruthy()
    return new Set([...m[1].matchAll(/'(\w+)'/g)].map((x) => x[1]))
  }

  it('T16 paridad Pass A: WORLD_UNIFORM_NAMES == uniforms declarados en worldFragSrc', () => {
    const glsl = extractBetween(SHADER_SOURCE, 'function worldFragSrc({ steps, oct }) {', '// ── GLSL — Pass B')
    const declared = declaredUniformNames(glsl)
    const listed = listedUniformNames(SHADER_SOURCE, 'WORLD_UNIFORM_NAMES')
    expect([...declared].sort()).toEqual([...listed].sort())
  })

  it('T16 paridad Pass B: FEEDBACK_UNIFORM_NAMES == uniforms declarados en FEEDBACK_FRAG_SRC', () => {
    const glsl = extractBetween(SHADER_SOURCE, 'const FEEDBACK_FRAG_SRC = /* glsl */ `', '// ── GLSL — Pass C')
    const declared = declaredUniformNames(glsl)
    const listed = listedUniformNames(SHADER_SOURCE, 'FEEDBACK_UNIFORM_NAMES')
    expect([...declared].sort()).toEqual([...listed].sort())
  })

  it('T16 paridad Pass C: OPTICS_UNIFORM_NAMES == uniforms declarados en opticsFragSrc', () => {
    const glsl = extractBetween(SHADER_SOURCE, 'function opticsFragSrc({ taps, sde, lens }) {', 'const VERT_SRC')
    const declared = declaredUniformNames(glsl)
    const listed = listedUniformNames(SHADER_SOURCE, 'OPTICS_UNIFORM_NAMES')
    expect([...declared].sort()).toEqual([...listed].sort())
  })
})
