// tests/composables/usePRM.test.js
// Tests del composable usePRM (Plan 03, Wave 2).
//
// Cobertura (4 tests, alineados con <behavior> de Task 3.1):
//   T1 — export shape: `usePRM` es función importable, retorna { motion, prefersReduced }.
//   T2 — matches:false (sin PRM) → motion.value === 'no-preference', prefersReduced.value === false.
//   T3 — matches:true  (PRM activo) → motion.value === 'reduce', prefersReduced.value === true.
//   T4 — reactividad: disparar manualmente el listener 'change' registrado por vueuse
//        cambia `motion` y por ende `prefersReduced` tras await nextTick().
//
// Test 5 (readonly setter) ELIMINADO por ambigüedad — ver MEDIUM 2 del plan-checker:
// `computed()` sin setter emite warning, no throw. Verificarlo testearía Vue framework
// interno, no nuestro código.
//
// Patrón de mock: sobrescribimos `window.matchMedia` por test con un MediaQueryList
// "controlable" que captura los listeners registrados via addEventListener('change', cb),
// permitiéndonos invocarlos manualmente en T4 para simular un toggle de PRM.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, isRef } from 'vue'
import { usePRM } from '@/composables/usePRM'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: instala un mock controlable de window.matchMedia.
//
// `initialMatches` es el valor de `matches` para todas las queries que se creen.
// Devuelve un objeto con:
//   - mql: el MediaQueryList retornado (último creado, si hay varios).
//   - fireChange(newMatches): invoca manualmente todos los listeners 'change'
//     registrados, con un event { matches, media }.
// ─────────────────────────────────────────────────────────────────────────────
function installMatchMediaMock(initialMatches) {
  let currentMatches = initialMatches
  const listeners = new Set()
  const legacyListeners = new Set()
  const mql = {
    get matches() { return currentMatches },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((evt, cb) => { if (evt === 'change') listeners.add(cb) }),
    removeEventListener: vi.fn((evt, cb) => { if (evt === 'change') listeners.delete(cb) }),
    addListener: vi.fn((cb) => legacyListeners.add(cb)),       // Safari < 14 legacy API
    removeListener: vi.fn((cb) => legacyListeners.delete(cb)),
    dispatchEvent: vi.fn(),
  }
  window.matchMedia = vi.fn(() => mql)
  return {
    mql,
    fireChange(newMatches) {
      currentMatches = newMatches
      const evt = { matches: newMatches, media: mql.media }
      listeners.forEach((cb) => cb(evt))
      legacyListeners.forEach((cb) => cb(evt))
    },
  }
}

// Componente de prueba que ejecuta `usePRM()` dentro de un setup() válido y
// expone el resultado vía un getter. Usamos un componente para que vueuse
// pueda registrar sus listeners + cleanup en el lifecycle real.
function makeWrapper() {
  let exposed = null
  const Comp = defineComponent({
    setup() {
      exposed = usePRM()
      return () => null
    },
  })
  const wrapper = mount(Comp, { attachTo: document.body })
  return { wrapper, get: () => exposed }
}

describe('usePRM composable', () => {
  let originalMatchMedia
  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })
  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('T1 — exporta usePRM como función; retorna { motion, prefersReduced } refs', () => {
    installMatchMediaMock(false)
    expect(typeof usePRM).toBe('function')
    const { wrapper, get } = makeWrapper()
    const prm = get()
    expect(prm).toBeDefined()
    expect(prm).toHaveProperty('motion')
    expect(prm).toHaveProperty('prefersReduced')
    expect(isRef(prm.motion)).toBe(true)
    expect(isRef(prm.prefersReduced)).toBe(true)
    wrapper.unmount()
  })

  it('T2 — matchMedia.matches=false → motion="no-preference", prefersReduced=false', () => {
    installMatchMediaMock(false)
    const { wrapper, get } = makeWrapper()
    const { motion, prefersReduced } = get()
    expect(motion.value).toBe('no-preference')
    expect(prefersReduced.value).toBe(false)
    wrapper.unmount()
  })

  it('T3 — matchMedia.matches=true → motion="reduce", prefersReduced=true', () => {
    installMatchMediaMock(true)
    const { wrapper, get } = makeWrapper()
    const { motion, prefersReduced } = get()
    expect(motion.value).toBe('reduce')
    expect(prefersReduced.value).toBe(true)
    wrapper.unmount()
  })

  it('T4 — cambio reactivo: disparar "change" listener actualiza prefersReduced sin recarga', async () => {
    const ctl = installMatchMediaMock(false)
    const { wrapper, get } = makeWrapper()
    const { motion, prefersReduced } = get()
    // Estado inicial confirma el mock.
    expect(motion.value).toBe('no-preference')
    expect(prefersReduced.value).toBe(false)

    // Toggle PRM activo en el OS → vueuse debería propagar via el listener 'change'.
    ctl.fireChange(true)
    await nextTick()

    expect(motion.value).toBe('reduce')
    expect(prefersReduced.value).toBe(true)
    wrapper.unmount()
  })
})
