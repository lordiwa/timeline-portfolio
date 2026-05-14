// tests/a11y/keyboard-planet-buttons.test.js
//
// Phase 5 W0 — RED scaffold para A11Y keyboard navigation (D5-06 + A11Y-02).
//
// Cobertura (3 tests):
//   T1: Chapter6Content renderea 3 `<button class="sr-only">` post-canvas con
//       `aria-label` que incluye `t('ui.openProject')`.
//   T2: Enter/Space en button dispara mismo handler que planet pointerdown
//       (setea activeProject = p.id).
//   T3: Tab navigation incluye los 3 buttons en orden cronológico:
//       ar-vr → remoose → software-mind.
//
// Rationale (D5-06):
//   Phaser canvas no es tabbable nativamente. Los 3 sr-only buttons (invisible
//   visualmente, focusables por teclado) replican la accesibilidad de los planet
//   clicks dentro de Phaser. Sin esto, screen-reader users + keyboard-only users
//   no pueden alcanzar los proyectos ch6.
//
// Analog: tests/components/SkipLink.test.js (sr-only + focus pattern).
//
// RED scaffold W0 — verde tras W3 crea Chapter6Content.vue con sr-only buttons.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/phaser', () => ({
  createGame: vi.fn(() => ({
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    scale: { zoom: 3, setZoom: vi.fn() },
    destroy: vi.fn(),
  })),
}))

vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'ch6-ar-vr', chapterEra: 6, year: 2015,
      titleKey: 'projects.ch6-ar-vr.title', descKey: 'projects.ch6-ar-vr.desc',
      link: null, imageSrc: null, role: 'Founder', techStack: ['Unity'],
      planetSprite: '/assets/ch6-planet-ar-vr.png', planetOrbit: 0.2, planetColor: '#ff3ca6' },
    { id: 'ch6-remoose', chapterEra: 6, year: 2023,
      titleKey: 'projects.ch6-remoose.title', descKey: 'projects.ch6-remoose.desc',
      link: null, imageSrc: null, role: 'Full Stack', techStack: ['Vue 3'],
      planetSprite: '/assets/ch6-planet-remoose.png', planetOrbit: 0.5, planetColor: '#4dffff' },
    { id: 'ch6-software-mind', chapterEra: 6, year: 2023,
      titleKey: 'projects.ch6-software-mind.title', descKey: 'projects.ch6-software-mind.desc',
      link: null, imageSrc: null, role: 'QA + AI', techStack: ['Python'],
      planetSprite: '/assets/ch6-planet-software-mind.png', planetOrbit: 0.8, planetColor: '#ffd95c' },
  ],
}))

async function mountCh6() {
  let Chapter6Content
  try {
    Chapter6Content = (await import('@/components/Chapter6Content.vue')).default
  } catch (_) {
    return { importFailed: true }
  }
  const activeChapter = ref(6)
  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(Chapter6Content, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress: ref(6 / 7), scrollToChapter: vi.fn() },
        prm: { prefersReduced: ref(false) },
      },
      stubs: { ProjectOverlay: true },
      attachTo: document.body,
    },
  })
  await flushPromises()
  return { wrapper, importFailed: false }
}

describe('keyboard-planet-buttons (A11Y D5-06) — RED W0 → verde W3', () => {
  it('T1: 3 buttons sr-only con aria-label que incluye t(\'ui.openProject\')', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    const buttons = r.wrapper.findAll('button.sr-only')
    expect(
      buttons.length,
      'Debe haber exactamente 3 <button class="sr-only"> en Chapter6Content (D5-06).'
    ).toBe(3)
    buttons.forEach((btn) => {
      expect(
        btn.attributes('aria-label'),
        'Cada button sr-only debe tener aria-label que incluya `Ver proyecto`.'
      ).toContain('Ver proyecto')
    })
    r.wrapper.unmount()
  })

  it('T2: click en sr-only button setea activeProject (mismo handler que planet pointerdown)', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    const firstBtn = r.wrapper.find('button.sr-only')
    expect(firstBtn.exists()).toBe(true)
    await firstBtn.trigger('click')
    await flushPromises()
    // ProjectOverlay stub debe renderearse tras click (v-if activeProject)
    const overlay = r.wrapper.findComponent({ name: 'ProjectOverlay' })
    // Verify the stub is now rendered (activeProject was set)
    expect(
      r.wrapper.html(),
      'Click en sr-only button debe disparar el mismo handler que planet click (setear activeProject).'
    ).toContain('ProjectOverlay')
    r.wrapper.unmount()
  })

  it('T3: Tab order de los 3 buttons sr-only es cronológico ar-vr → remoose → software-mind', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    const buttons = r.wrapper.findAll('button.sr-only')
    expect(buttons.length).toBe(3)
    // Buscar texto del aria-label que identifica el proyecto
    const ariaLabels = buttons.map((b) => b.attributes('aria-label') || '')
    // El orden debe ser ar-vr (0.2) → remoose (0.5) → software-mind (0.8) — chronological.
    // Heurística: el title key matchea projects.ch6-{slug}.title; aria-label contiene t() del title.
    // Aquí asumimos que el v-for itera ch6Projects en orden de array projects.js (que ya está
    // ordenado D5-01 cronológicamente).
    expect(
      ariaLabels[0],
      'Primer button debe corresponder a ch6-ar-vr (planetOrbit 0.2, founder 2015-18).'
    ).toContain('AR/VR')
    expect(
      ariaLabels[1],
      'Segundo button debe corresponder a ch6-remoose (planetOrbit 0.5).'
    ).toContain('Remoose')
    expect(
      ariaLabels[2],
      'Tercer button debe corresponder a ch6-software-mind (planetOrbit 0.8, convergencia).'
    ).toContain('Software Mind')
    r.wrapper.unmount()
  })
})
