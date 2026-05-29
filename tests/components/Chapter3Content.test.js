// tests/components/Chapter3Content.test.js
// Reescrito 2026-05-28 (iter10) — "parallax + cuento interactivo" (Rafael).
//
// El entorno (parallax) es protagonista; el texto se despliega poco a poco al
// tocar 5 emblemas de arte clicables, que abren un recuadro pergamino con un
// fragmento de la historia (avance prev/next como un cuento).
//
// Cobertura:
// - T1 DOM: .ch3-stage + .ch3-content + parallax (3 capas)
// - T2 hint: .ch3-hint-title + CTA storyHint visibles (texto mínimo)
// - T3 emblemas: 5 .ch3-mark (buttons) con aria-label
// - T4 panel: oculto por defecto; click abre recuadro con párrafo; close lo cierra
// - T5 nav: prev/next cambian el fragmento; reactividad de locale
// - T6 CSS source: parallax sticky + assets + PRM + scroll handler + emblemas/panel

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({ projects: [] }))

function mountCh3({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter3Content, { global: { plugins: [i18n], attachTo: document.body } })
  return { wrapper, i18n }
}

const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

describe('Chapter3Content.vue (parallax + cuento — iter10 2026-05-28)', () => {
  // ── T1: DOM + parallax ─────────────────────────────────────────────────────
  it('T1 DOM: .ch3-stage + .ch3-content + .ch3-parallax con 3 capas', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-stage').exists()).toBe(true)
    expect(wrapper.find('.ch3-content').exists()).toBe(true)
    expect(wrapper.find('.ch3-parallax').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.ch3-layer--sky').exists()).toBe(true)
    expect(wrapper.find('.ch3-layer--mountains').exists()).toBe(true)
    expect(wrapper.find('.ch3-layer--path').exists()).toBe(true)
  })

  // ── T2: hint mínimo ─────────────────────────────────────────────────────────
  it('T2 hint: título "La muerte de Flash" + CTA storyHint (texto mínimo)', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-hint-title').text()).toMatch(/muerte de Flash/i)
    expect(wrapper.find('.ch3-hint-cta').text().length).toBeGreaterThan(0)
  })

  // ── T3: 5 emblemas clicables ───────────────────────────────────────────────
  it('T3 emblemas: 5 .ch3-mark (button) con aria-label', () => {
    const { wrapper } = mountCh3()
    const marks = wrapper.findAll('.ch3-mark')
    expect(marks.length).toBe(5)
    marks.forEach((m) => {
      expect(m.element.tagName).toBe('BUTTON')
      expect((m.attributes('aria-label') || '').length).toBeGreaterThan(0)
    })
  })

  it('T3 emblemas: NO hay muro de texto por defecto (sin .ch3-bio-card)', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-bio-card').exists()).toBe(false)
  })

  // ── T4: panel pergamino ─────────────────────────────────────────────────────
  it('T4 panel: oculto por defecto', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-panel').exists()).toBe(false)
  })

  it('T4 panel: click en emblema abre recuadro con fragmento de la historia', async () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    await wrapper.findAll('.ch3-mark')[0].trigger('click')
    await flushPromises()
    const panel = wrapper.find('.ch3-panel')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('role')).toBe('dialog')
    expect(wrapper.find('.ch3-panel-text').text()).toMatch(/Flash/)
  })

  it('T4 panel: botón cerrar oculta el recuadro', async () => {
    const { wrapper } = mountCh3()
    await wrapper.findAll('.ch3-mark')[0].trigger('click')
    await flushPromises()
    await wrapper.find('.ch3-panel-close').trigger('click')
    await flushPromises()
    expect(wrapper.find('.ch3-panel').exists()).toBe(false)
  })

  // ── T5: navegación prev/next + reactividad ─────────────────────────────────
  it('T5 nav: "siguiente" avanza al próximo fragmento', async () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    await wrapper.findAll('.ch3-mark')[0].trigger('click')
    await flushPromises()
    const next = wrapper.findAll('.ch3-panel-arrow')[1]
    await next.trigger('click')
    await flushPromises()
    expect(wrapper.find('.ch3-panel-text').text()).toMatch(/Pink Parrot/)
  })

  it('T5 reactive: toggle locale es→en → CTA actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh3({ locale: 'es' })
    const ctaEs = wrapper.find('.ch3-hint-cta').text()
    i18n.global.locale.value = 'en'
    await flushPromises()
    const ctaEn = wrapper.find('.ch3-hint-cta').text()
    expect(ctaEn.length).toBeGreaterThan(0)
    expect(ctaEn).not.toBe(ctaEs)
  })

  // ── T6: CSS / script source ─────────────────────────────────────────────────
  it('T6 CSS: .ch3-stage overflow-y auto + max-height 100dvh', () => {
    expect(CH3_SOURCE).toMatch(/overflow-y:\s*auto/)
    expect(CH3_SOURCE).toMatch(/max-height:\s*100dvh/)
  })

  it('T6 CSS: .ch3-parallax sticky + las 3 capas referencian sus assets', () => {
    expect(CH3_SOURCE).toMatch(/\.ch3-parallax\s*\{[\s\S]*?position:\s*sticky/)
    expect(CH3_SOURCE).toMatch(/ch3-sky\.png/)
    expect(CH3_SOURCE).toMatch(/ch3-mountains\.png/)
    expect(CH3_SOURCE).toMatch(/ch3-path\.png/)
  })

  it('T6 CSS: recuadro usa textura pergamino + PRM guard', () => {
    expect(CH3_SOURCE).toMatch(/ch3-parchment\.png/)
    expect(CH3_SOURCE).toMatch(/prefers-reduced-motion:\s*reduce/)
    expect(CH3_SOURCE).toMatch(/transform:\s*none\s*!important/)
  })

  it('T6 script: handler de scroll + apertura de cuento presentes', () => {
    expect(CH3_SOURCE).toMatch(/@scroll="onScroll"/)
    expect(CH3_SOURCE).toMatch(/function openStory/)
  })
})
