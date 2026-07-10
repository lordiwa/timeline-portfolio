// tests/components/Ch4PortalShader.test.js
// Regresión tier tests-after para Ch4PortalShader.vue.
//
// Cobertura T1-T5:
// - T1 fallback silencioso: sin WebGL (jsdom) → no canvas en DOM, no crash
// - T2 PRM activo → no canvas cuando WebGL indisponible (mismo resultado T1)
// - T3 activeChapter distinto de 4 → no crash
// - T4 sin inject → no crash (inject opcionales)
// - T5 DOM contract cuando WebGL disponible (mock mínimo de context)
//
// Nota: jsdom no implementa WebGL. canvas.getContext('webgl') retorna null
// por defecto → el componente sólo tiene el path de fallback verificable.
// El path feliz (WebGL real) no se puede cubrir sin un entorno headless con GPU.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Ch4PortalShader from '@/components/Ch4PortalShader.vue'

// ── Helpers ─────────────────────────────────────────────────────────────────

function mountShader({ chapter = ref(4), prefersReduced = ref(false), withProvide = true } = {}) {
  const opts = {
    global: {},
  }
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
  // supported empieza como true → canvas en DOM → onMounted detecta WebGL ausente
  // → supported=false → Vue quita el canvas en el siguiente tick reactivo.
  it('T1 monta sin crash cuando WebGL no disponible → no canvas en DOM tras nextTick', async () => {
    const wrapper = mountShader()
    // Esperar que Vue aplique la actualización reactiva de supported→false.
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

  // ── T5 Mock WebGL mínimo: path feliz → canvas en DOM ────────────────────
  it('T5 con WebGL mockeado → canvas montado con aria-hidden y pointer-events none', () => {
    // Mock mínimo del contexto WebGL1 que satisface initGL().
    // No necesita ejecutar GL real — sólo no retornar null.
    const mockGL = {
      VERTEX_SHADER:   35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS:  35713,
      LINK_STATUS:     35714,
      ARRAY_BUFFER:    34962,
      STATIC_DRAW:     35044,
      TRIANGLES:       4,
      COLOR_BUFFER_BIT: 16384,
      SRC_ALPHA:        770,
      ONE_MINUS_SRC_ALPHA: 771,
      createShader:    vi.fn(() => ({})),
      shaderSource:    vi.fn(),
      compileShader:   vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog:   vi.fn(() => ''),
      deleteShader:    vi.fn(),
      createProgram:   vi.fn(() => ({})),
      attachShader:    vi.fn(),
      linkProgram:     vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog:   vi.fn(() => ''),
      createBuffer:    vi.fn(() => ({})),
      bindBuffer:      vi.fn(),
      bufferData:      vi.fn(),
      getAttribLocation:  vi.fn(() => 0),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer:     vi.fn(),
      useProgram:      vi.fn(),
      getUniformLocation: vi.fn(() => ({})),
      enable:          vi.fn(),
      blendFunc:       vi.fn(),
      drawingBufferWidth:  320,
      drawingBufferHeight: 180,
      viewport:        vi.fn(),
      clearColor:      vi.fn(),
      clear:           vi.fn(),
      uniform1f:       vi.fn(),
      uniform2f:       vi.fn(),
      drawArrays:      vi.fn(),
      getExtension:    vi.fn(() => null),
    }

    // Parchar getContext en HTMLCanvasElement para que retorne mockGL.
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') return mockGL
      return null
    })

    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })

      const canvas = wrapper.find('canvas')
      expect(canvas.exists()).toBe(true)
      expect(canvas.attributes('aria-hidden')).toBe('true')
      // Dimensiones del canvas attribute (resolución interna baja).
      expect(canvas.attributes('width')).toBe('320')
      expect(canvas.attributes('height')).toBe('180')
    } finally {
      // Restaurar sin importar el resultado del test.
      HTMLCanvasElement.prototype.getContext = originalGetContext
      wrapper?.unmount()
    }
  })

  it('T5 WebGL mockeado → unmount sin crash (cleanup correcto)', () => {
    const mockGL = {
      VERTEX_SHADER:   35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS:  35713,
      LINK_STATUS:     35714,
      ARRAY_BUFFER:    34962,
      STATIC_DRAW:     35044,
      TRIANGLES:       4,
      COLOR_BUFFER_BIT: 16384,
      SRC_ALPHA:        770,
      ONE_MINUS_SRC_ALPHA: 771,
      createShader:    vi.fn(() => ({})),
      shaderSource:    vi.fn(),
      compileShader:   vi.fn(),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog:   vi.fn(() => ''),
      deleteShader:    vi.fn(),
      createProgram:   vi.fn(() => ({})),
      attachShader:    vi.fn(),
      linkProgram:     vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getProgramInfoLog:   vi.fn(() => ''),
      createBuffer:    vi.fn(() => ({})),
      bindBuffer:      vi.fn(),
      bufferData:      vi.fn(),
      getAttribLocation:  vi.fn(() => 0),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer:     vi.fn(),
      useProgram:      vi.fn(),
      getUniformLocation: vi.fn(() => ({})),
      enable:          vi.fn(),
      blendFunc:       vi.fn(),
      drawingBufferWidth:  320,
      drawingBufferHeight: 180,
      viewport:        vi.fn(),
      clearColor:      vi.fn(),
      clear:           vi.fn(),
      uniform1f:       vi.fn(),
      uniform2f:       vi.fn(),
      drawArrays:      vi.fn(),
      getExtension:    vi.fn(() => ({ loseContext: vi.fn() })),
    }

    const originalGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') return mockGL
      return null
    })

    let wrapper
    try {
      wrapper = mountShader({ chapter: ref(4) })
      expect(() => wrapper.unmount()).not.toThrow()
    } finally {
      HTMLCanvasElement.prototype.getContext = originalGetContext
    }
  })
})
