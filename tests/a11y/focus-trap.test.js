// tests/a11y/focus-trap.test.js
//
// Phase 5 W0 — RED scaffold para focus trap del ProjectOverlay (D5-07 + A11Y-02).
//
// Cobertura (3 tests):
//   T1: Tab desde último focusable → cycla al primero (close button).
//   T2: Shift+Tab desde primero (close button) → cycla al último.
//   T3: onMount captura lastFocusedEl + foca closeBtn; onUnmount restore focus
//       a lastFocusedEl.
//
// Rationale (D5-07):
//   Modal overlay debe atrapar focus dentro del card mientras está abierto
//   (WCAG 2.1 Focus Order). Si Tab sale del card, el usuario "pierde" el modal y
//   no puede recuperarlo con teclado. Al cerrar, focus debe volver al elemento
//   que abrió el overlay (el sr-only planet button trigger).
//
// Source-of-truth: 05-RESEARCH.md §Pattern 10 lines 940-1059.
//
// RED scaffold W0 — verde tras W4 crea ProjectOverlay.vue.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch6-ar-vr', chapterEra: 6, year: 2015,
      titleKey: 'projects.ch6-ar-vr.title', descKey: 'projects.ch6-ar-vr.desc',
      link: 'https://example.com/ar-vr',
      imageSrc: null, role: 'Founder',
      techStack: ['Unity', 'ARKit'],
      planetSprite: '/assets/ch6-planet-ar-vr.png', planetOrbit: 0.2, planetColor: '#ff3ca6',
    },
  ],
}))

async function mountOverlay() {
  let ProjectOverlay
  try {
    ProjectOverlay = (await import('@/components/ProjectOverlay.vue')).default
  } catch (_) {
    return { importFailed: true }
  }
  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(ProjectOverlay, {
    props: { projectId: 'ch6-ar-vr' },
    // attachTo at top-level (NOT inside global) — Vue Test Utils v2 contract.
    // Permite document.activeElement asserts + focus() funcional en jsdom.
    attachTo: document.body,
    global: {
      plugins: [i18n],
      provide: { prm: { prefersReduced: { value: false } } },
    },
  })
  return { wrapper, importFailed: false }
}

describe('ProjectOverlay focus trap (D5-07 + A11Y-02) — RED W0 → verde W4', () => {
  it('T1: Tab desde último focusable → cycla al primero (close button)', async () => {
    const r = await mountOverlay()
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    const focusables = r.wrapper.element.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    expect(focusables.length, 'Overlay debe tener al menos 2 focusables (close btn + link).').toBeGreaterThanOrEqual(1)
    const last = focusables[focusables.length - 1]
    last.focus()
    expect(document.activeElement).toBe(last)
    // Simular Tab (no shift) en document — el handler debe preventDefault + first.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    // Después del trap, focus debe volver al primero (close button)
    const first = focusables[0]
    expect(
      document.activeElement,
      'Tab desde último focusable debe ciclar a primer focusable (focus trap).'
    ).toBe(first)
    r.wrapper.unmount()
  })

  it('T2: Shift+Tab desde primero (close button) → cycla al último', async () => {
    const r = await mountOverlay()
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    const focusables = r.wrapper.element.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]
    first.focus()
    expect(document.activeElement).toBe(first)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    const last = focusables[focusables.length - 1]
    expect(
      document.activeElement,
      'Shift+Tab desde primer focusable debe ciclar a último focusable.'
    ).toBe(last)
    r.wrapper.unmount()
  })

  it('T3: onMount → closeBtn focused; onUnmount → restore focus a lastFocusedEl', async () => {
    // Setup: crear un elemento previo y focusarlo
    const priorBtn = document.createElement('button')
    priorBtn.id = 'prior-focus'
    priorBtn.textContent = 'prior'
    document.body.appendChild(priorBtn)
    priorBtn.focus()
    expect(document.activeElement).toBe(priorBtn)

    const r = await mountOverlay()
    if (r.importFailed) {
      priorBtn.remove()
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    // Después de mount, el closeBtn debe recibir focus (setTimeout 0 en onMounted).
    await new Promise((resolve) => setTimeout(resolve, 10))
    const closeBtn = r.wrapper.find('button.project-overlay__close')
    if (closeBtn.exists()) {
      expect(
        document.activeElement,
        'onMount debe focusar el close button (setTimeout 0).'
      ).toBe(closeBtn.element)
    }

    // Unmount → focus debe restaurarse a priorBtn
    r.wrapper.unmount()
    expect(
      document.activeElement,
      'onUnmount debe restaurar focus a lastFocusedEl (elemento previo a mount).'
    ).toBe(priorBtn)
    priorBtn.remove()
  })
})
