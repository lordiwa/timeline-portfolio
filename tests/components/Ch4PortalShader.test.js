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
import Ch4PortalShader, { UNIVERSES, TIER_CONFIG } from '@/components/Ch4PortalShader.vue'

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
})
