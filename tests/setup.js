// tests/setup.js
// Global JSDOM mocks consumed by Vitest before any test runs.
// Cubre los 4 browser APIs que Phase 1 necesita y JSDOM no provee
// (o provee de forma incompleta): IntersectionObserver, ResizeObserver,
// matchMedia, requestAnimationFrame/cancelAnimationFrame.
//
// Cada mock expone un helper (`triggerEntries`, `triggerResize`, etc.)
// para que los tests puedan disparar callbacks deterministicamente.

import { vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// IntersectionObserver
// ─────────────────────────────────────────────────────────────────────────────
// Stub que guarda callbacks por instancia y expone `triggerEntries(entries)`
// para simular cambios de intersección desde los tests.
class MockIntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback
    this.options = options
    this.observed = new Set()
    MockIntersectionObserver.instances.push(this)
  }
  observe(target) { this.observed.add(target) }
  unobserve(target) { this.observed.delete(target) }
  disconnect() { this.observed.clear() }
  takeRecords() { return [] }
  // Helper de test: disparar el callback con un array de entries.
  triggerEntries(entries) {
    this.callback(entries, this)
  }
}
MockIntersectionObserver.instances = []
MockIntersectionObserver.reset = () => { MockIntersectionObserver.instances = [] }

globalThis.IntersectionObserver = MockIntersectionObserver
globalThis.MockIntersectionObserver = MockIntersectionObserver

// ─────────────────────────────────────────────────────────────────────────────
// ResizeObserver
// ─────────────────────────────────────────────────────────────────────────────
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
    this.observed = new Set()
    MockResizeObserver.instances.push(this)
  }
  observe(target) { this.observed.add(target) }
  unobserve(target) { this.observed.delete(target) }
  disconnect() { this.observed.clear() }
  // Helper de test: disparar el callback con un array de entries.
  triggerResize(entries) {
    this.callback(entries, this)
  }
}
MockResizeObserver.instances = []
MockResizeObserver.reset = () => { MockResizeObserver.instances = [] }

globalThis.ResizeObserver = MockResizeObserver
globalThis.MockResizeObserver = MockResizeObserver

// ─────────────────────────────────────────────────────────────────────────────
// window.matchMedia
// ─────────────────────────────────────────────────────────────────────────────
// Mock por defecto: `matches: false`. Tests que necesiten PRM activo
// reasignan `window.matchMedia` con su propio stub antes del mount.
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || ((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),    // legacy API (Safari < 14)
    removeListener: vi.fn(), // legacy API
    dispatchEvent: vi.fn()
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// HTMLElement.prototype.scrollIntoView
// ─────────────────────────────────────────────────────────────────────────────
// JSDOM no implementa scrollIntoView. Lo declaramos como no-op para que existir
// en el prototype permita `vi.spyOn(HTMLElement.prototype, 'scrollIntoView')`
// desde los tests. Los tests que necesiten observar las llamadas hacen su propio spy.
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = function () {}
}

// ─────────────────────────────────────────────────────────────────────────────
// requestAnimationFrame / cancelAnimationFrame
// ─────────────────────────────────────────────────────────────────────────────
// JSDOM 26+ trae una implementación básica, pero la sustituimos por una
// determinista basada en setTimeout(16ms) para que vi.useFakeTimers()
// pueda controlarla por completo.
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
