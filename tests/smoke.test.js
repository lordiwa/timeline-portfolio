// tests/smoke.test.js
// Smoke test trivial — garantiza que el harness (Vitest + jsdom + setup.js)
// está cableado correctamente y la suite arranca. Será reemplazado por
// tests reales en los Plans 02+.

import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('vitest is wired', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom environment is active', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('global mocks from setup.js are installed', () => {
    expect(typeof globalThis.IntersectionObserver).toBe('function')
    expect(typeof globalThis.ResizeObserver).toBe('function')
    expect(typeof window.matchMedia).toBe('function')
    expect(typeof globalThis.requestAnimationFrame).toBe('function')
    expect(typeof globalThis.cancelAnimationFrame).toBe('function')
  })
})
