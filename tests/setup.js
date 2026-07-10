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
// HTMLElement.prototype.scrollIntoView + scrollTo
// ─────────────────────────────────────────────────────────────────────────────
// JSDOM no implementa scrollIntoView ni scrollTo. Los declaramos como vi.fn()
// para que los tests puedan inspeccionar las llamadas via mock.calls / toHaveBeenCalledWith.
// Los tests son responsables de hacer mockClear() en su beforeEach.
//
// scrollTo: useScrollState usa shell.scrollTo({top, behavior}) para navigación
// programática — más fiable que scrollIntoView en contenedores scroll-snap.
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.scrollIntoView = vi.fn()
  HTMLElement.prototype.scrollTo = vi.fn()
}

// ─────────────────────────────────────────────────────────────────────────────
// requestAnimationFrame / cancelAnimationFrame
// ─────────────────────────────────────────────────────────────────────────────
// JSDOM 26+ trae una implementación básica, pero la sustituimos por una
// determinista basada en setTimeout(16ms) para que vi.useFakeTimers()
// pueda controlarla por completo.
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

// ─────────────────────────────────────────────────────────────────────────────
// AudioContext — mock global para tests de audio
// ─────────────────────────────────────────────────────────────────────────────
// JSDOM no provee AudioContext. Este stub cubre todas las APIs usadas por
// engine.js, sequencer.js y sfx.js. Los tests de audio usan este mock
// + el _reset() del engine para aislar estado entre tests.

function _makeGainNode() {
  const gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  return {
    gain,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.state = 'suspended'
    this.sampleRate = 44100
    this.destination = { connect: vi.fn() }
    MockAudioContext.instances.push(this)
  }
  createGain() { return _makeGainNode() }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      detune: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      setPeriodicWave: vi.fn(),
    }
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 350, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      Q: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }
  createBuffer(channels, length) {
    return {
      getChannelData: () => new Float32Array(length),
    }
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    }
  }
  createPeriodicWave() { return {} }
  async resume() { this.state = 'running'; return Promise.resolve() }
  async suspend() { this.state = 'suspended'; return Promise.resolve() }
}

MockAudioContext.instances = []
MockAudioContext.reset = () => { MockAudioContext.instances = [] }

globalThis.AudioContext = MockAudioContext
globalThis.MockAudioContext = MockAudioContext
