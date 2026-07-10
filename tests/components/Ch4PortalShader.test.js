// tests/components/Ch4PortalShader.test.js
// Regresión tier tests-after para Ch4PortalShader.vue.
//
// Cobertura T1-T8:
// - T1 fallback silencioso: sin WebGL (jsdom) → no canvas en DOM, no crash
// - T2 PRM activo → no canvas cuando WebGL indisponible (mismo resultado T1)
// - T3 activeChapter distinto de 4 → no crash
// - T4 sin inject → no crash (inject opcionales)
// - T5 DOM contract cuando WebGL disponible (mock mínimo de context)
// - T6 UNIVERSES data: 4 universos exportados con shape correcto
// - T7 universe-change emitido al arrancar loop (reset U0 al entrar a ch4)
// - T8 PRM desactiva ciclo de universo (no warp cuando prefersReduced)
//
// Nota: jsdom no implementa WebGL. canvas.getContext('webgl') retorna null
// por defecto → el componente sólo tiene el path de fallback verificable.
// Los paths con WebGL real requieren mock de getContext (ver T5/T7).

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Ch4PortalShader, { UNIVERSES } from '@/components/Ch4PortalShader.vue'

// ── Factory de mock WebGL mínimo ─────────────────────────────────────────────
// Satisface initGL() sin ejecutar GL real.
function makeGLMock({ loseContext = false } = {}) {
  return {
    VERTEX_SHADER:       35633,
    FRAGMENT_SHADER:     35632,
    COMPILE_STATUS:      35713,
    LINK_STATUS:         35714,
    ARRAY_BUFFER:        34962,
    STATIC_DRAW:         35044,
    TRIANGLES:           4,
    COLOR_BUFFER_BIT:    16384,
    SRC_ALPHA:           770,
    ONE_MINUS_SRC_ALPHA: 771,
    createShader:            vi.fn(() => ({})),
    shaderSource:            vi.fn(),
    compileShader:           vi.fn(),
    getShaderParameter:      vi.fn(() => true),
    getShaderInfoLog:        vi.fn(() => ''),
    deleteShader:            vi.fn(),
    createProgram:           vi.fn(() => ({})),
    attachShader:            vi.fn(),
    linkProgram:             vi.fn(),
    getProgramParameter:     vi.fn(() => true),
    getProgramInfoLog:       vi.fn(() => ''),
    createBuffer:            vi.fn(() => ({})),
    bindBuffer:              vi.fn(),
    bufferData:              vi.fn(),
    getAttribLocation:       vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer:     vi.fn(),
    useProgram:              vi.fn(),
    getUniformLocation:      vi.fn(() => ({})),
    enable:                  vi.fn(),
    blendFunc:               vi.fn(),
    drawingBufferWidth:      320,
    drawingBufferHeight:     180,
    viewport:                vi.fn(),
    clearColor:              vi.fn(),
    clear:                   vi.fn(),
    uniform1f:               vi.fn(),
    uniform2f:               vi.fn(),
    uniform3fv:              vi.fn(), // necesario para las paletas de universo
    drawArrays:              vi.fn(),
    getExtension:            vi.fn(() =>
      loseContext ? { loseContext: vi.fn() } : null
    ),
  }
}

// Parcha getContext y devuelve la función de restauración.
function patchWebGL(glMock) {
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn((type) =>
    type === 'webgl' ? glMock : null
  )
  return () => { HTMLCanvasElement.prototype.getContext = orig }
}

// ── Mount helper ─────────────────────────────────────────────────────────────

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

// ── Tests ─────────────────────────────────────────────────────────────────────

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

  // ── T2 PRM activo ────────────────────────────────────────────────────────
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

  // ── T5 Mock WebGL: canvas montado, aria-hidden, dimensiones ─────────────
  it('T5 con WebGL mockeado → canvas en DOM con aria-hidden=true y resolución 320×180', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      const canvas = wrapper.find('canvas')
      expect(canvas.exists()).toBe(true)
      expect(canvas.attributes('aria-hidden')).toBe('true')
      expect(canvas.attributes('width')).toBe('320')
      expect(canvas.attributes('height')).toBe('180')
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  it('T5 WebGL mockeado → unmount sin crash (cleanup + loseContext)', () => {
    const restore = patchWebGL(makeGLMock({ loseContext: true }))
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(() => wrapper.unmount()).not.toThrow()
    } finally {
      restore()
    }
  })

  // ── T6 UNIVERSES data ────────────────────────────────────────────────────
  it('T6 UNIVERSES exportado: 4 universos con id secuencial y arrays de color válidos', () => {
    expect(UNIVERSES).toHaveLength(4)
    UNIVERSES.forEach((u, i) => {
      expect(u.id).toBe(i)
      // Cada color es un array de 3 números en [0..1]
      for (const key of ['colVortex', 'colRing', 'colStar', 'colBg']) {
        expect(u[key]).toHaveLength(3)
        u[key].forEach((v) => {
          expect(typeof v).toBe('number')
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        })
      }
    })
  })

  it('T6 UNIVERSES[0] es Synthwave (cyan/magenta)', () => {
    const u0 = UNIVERSES[0]
    // Canal verde del vórtice cian ≈ 1.0
    expect(u0.colVortex[1]).toBeCloseTo(1.0, 1)
    expect(u0.name).toBe('synthwave')
  })

  it('T6 UNIVERSES[3] es Void (rojo dominante)', () => {
    const u3 = UNIVERSES[3]
    // Canal rojo dominante en el vórtice
    expect(u3.colVortex[0]).toBeGreaterThan(0.5)
    // Verde y azul muy bajos
    expect(u3.colVortex[1]).toBeLessThan(0.1)
    expect(u3.name).toBe('void')
  })

  // ── T7 universe-change emitido al arrancar el loop ───────────────────────
  it('T7 con WebGL mockeado + ch4 activo → universe-change emitido con 0 (reset a U0)', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      // startLoop() llama emit('universe-change', 0) de forma síncrona
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
      // El loop no arranca → no hay emit de reset
      expect(wrapper.emitted('universe-change')).toBeFalsy()
    } finally {
      restore()
      wrapper?.unmount()
    }
  })

  // ── T8 PRM desactiva el ciclo ─────────────────────────────────────────────
  it('T8 PRM prefersReduced=true → no universe-change emitido (sin ciclo)', () => {
    const restore = patchWebGL(makeGLMock())
    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4), prefersReduced: ref(true) })
      // PRM: sólo frame estático, no startLoop, no emit de universe-change
      expect(wrapper.emitted('universe-change')).toBeFalsy()
    } finally {
      restore()
      wrapper?.unmount()
    }
  })
})
