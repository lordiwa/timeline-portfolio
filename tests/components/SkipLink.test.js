// tests/components/SkipLink.test.js
// Tests del componente SkipLink.vue (Plan 06, Wave 5) + i18n (Plan 02-02, Task 2.2).
//
// Cobertura (10 tests):
//   1. Render: <a> con href="#main-content", id="skip-link", class="skip-link"
//      y texto desde t('ui.skipLink') en locale 'es' → 'Saltar al contenido'.
//   2. Render inicial: NO tiene clase `hidden` (visible at-load).
//   3. Hide-on-scroll (HIGH 5 fix): invocando el handler expuesto vía
//      defineExpose directamente — wrapper.vm.handleScrollOnce() → nextTick →
//      assert clase `hidden`. NO usar window.dispatchEvent (flake en jsdom).
//   4. Hide-on-blur: trigger blur sobre el <a> → clase `hidden` aplicada.
//   5. Listener registration check: vi.spyOn(window, 'addEventListener') antes
//      del mount, assert que se llamó con 'scroll', function, { once: true,
//      passive: true }.
//   6. CSS string check: position: fixed; top: 8px; left: 50%;
//      transform: translateX(-50%); z-index: 50.
//   7. CSS string check: .skip-link.hidden { opacity: 0; pointer-events: none }.
//   8. CSS string check: media query (prefers-reduced-motion: reduce) con
//      transition: none.
//   9. i18n — locale='es': <a> texto === 'Saltar al contenido' (key ui.skipLink).
//  10. i18n reactive (Pitfall 3): mutar locale 'es'→'en' → texto cambia a 'Skip to content'
//      sin re-mount.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import SkipLink from '@/components/SkipLink.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const SKIPLINK_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/SkipLink.vue'),
  'utf8'
)

// Helper: monta SkipLink con plugin i18n. Los tests Phase 1 originales
// se mantienen usando mount(SkipLink) sin plugin para preservar backward compat
// de los CSS/DOM asserts que no dependen de i18n.
function mountWithI18n({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(SkipLink, {
    global: { plugins: [i18n] },
  })
  return { wrapper, i18n }
}

describe('SkipLink.vue', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: DOM contract — href, id, class, texto desde i18n (locale 'es').
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <a href="#main-content" id="skip-link" class="skip-link"> with i18n text (es: "Saltar al contenido")', () => {
    const { wrapper } = mountWithI18n({ locale: 'es' })
    const a = wrapper.find('a')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toBe('#main-content')
    expect(a.attributes('id')).toBe('skip-link')
    expect(a.classes()).toContain('skip-link')
    expect(a.text()).toBe('Saltar al contenido')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: visible at-load — sin clase `hidden` al montar.
  // ───────────────────────────────────────────────────────────────────────────
  it('is visible at-load (no `hidden` class on initial render)', () => {
    const { wrapper } = mountWithI18n()
    expect(wrapper.find('a').classes()).not.toContain('hidden')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: hide-on-scroll vía handler expuesto (HIGH 5 fix).
  // ───────────────────────────────────────────────────────────────────────────
  it('hides when handleScrollOnce is invoked directly (defineExpose)', async () => {
    const { wrapper } = mountWithI18n()
    expect(wrapper.find('a').classes()).not.toContain('hidden')
    expect(typeof wrapper.vm.handleScrollOnce).toBe('function')
    wrapper.vm.handleScrollOnce()
    await nextTick()
    expect(wrapper.find('a').classes()).toContain('hidden')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: hide-on-blur — trigger blur sobre el <a> aplica clase `hidden`.
  // ───────────────────────────────────────────────────────────────────────────
  it('hides on blur of the link', async () => {
    const { wrapper } = mountWithI18n()
    const a = wrapper.find('a')
    expect(a.classes()).not.toContain('hidden')
    await a.trigger('blur')
    expect(wrapper.find('a').classes()).toContain('hidden')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: listener registration check.
  // ───────────────────────────────────────────────────────────────────────────
  it('registers window scroll listener with { once: true, passive: true }', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    mountWithI18n()
    const scrollCall = addSpy.mock.calls.find((c) => c[0] === 'scroll')
    expect(scrollCall).toBeDefined()
    expect(typeof scrollCall[1]).toBe('function')
    expect(scrollCall[2]).toMatchObject({ once: true, passive: true })
    addSpy.mockRestore()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6: CSS — position fixed top center, z-index 50.
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS declares position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 50', () => {
    expect(SKIPLINK_SOURCE).toMatch(/position:\s*fixed/)
    expect(SKIPLINK_SOURCE).toMatch(/top:\s*8px/)
    expect(SKIPLINK_SOURCE).toMatch(/left:\s*50%/)
    expect(SKIPLINK_SOURCE).toMatch(/transform:\s*translateX\(-50%\)/)
    expect(SKIPLINK_SOURCE).toMatch(/z-index:\s*50/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 7: CSS — .skip-link.hidden con opacity 0 + pointer-events none.
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS declares .skip-link.hidden { opacity: 0; pointer-events: none }', () => {
    expect(SKIPLINK_SOURCE).toMatch(/\.skip-link\.hidden\s*\{[\s\S]*opacity:\s*0[\s\S]*pointer-events:\s*none[\s\S]*\}/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 8: CSS — media query (prefers-reduced-motion: reduce) con transition: none.
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS declares @media (prefers-reduced-motion: reduce) with transition: none', () => {
    expect(SKIPLINK_SOURCE).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*transition:\s*none[\s\S]*\}/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 9 (i18n): locale='es' → texto 'Saltar al contenido'; locale='en' → 'Skip to content'
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n: locale=es → "Saltar al contenido"; locale=en → "Skip to content"', () => {
    const { wrapper: wrapperEs } = mountWithI18n({ locale: 'es' })
    expect(wrapperEs.find('a').text()).toBe('Saltar al contenido')

    const { wrapper: wrapperEn } = mountWithI18n({ locale: 'en' })
    expect(wrapperEn.find('a').text()).toBe('Skip to content')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 10 (i18n reactive — Pitfall 3): mutar locale 'es'→'en' → texto actualiza
  // sin re-mount (el binding usa t() reactivo, NO string capturado en setup).
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n reactive (Pitfall 3): mutar locale "es"→"en" actualiza texto sin re-mount', async () => {
    const { wrapper, i18n } = mountWithI18n({ locale: 'es' })
    expect(wrapper.find('a').text()).toBe('Saltar al contenido')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('a').text()).toBe('Skip to content')
  })
})
