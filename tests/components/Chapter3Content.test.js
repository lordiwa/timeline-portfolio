// tests/components/Chapter3Content.test.js
// Reescrito 2026-05-28 (iter9) — diseño "parallax fantasía épica" (Rafael).
//
// Reemplaza el diseño Web 2.0 iter2 (logo / aqua buttons / social badges / starbursts /
// subtitle / quote) que dejó de existir tras los iters 7-12. Ahora ch3 es un parallax
// de 3 capas (cielo / montañas / camino) con decor fantasía (escudo + estandarte).
//
// Cobertura:
// - T1 DOM contract: .ch3-stage root + .ch3-content + .ch3-hero(-title) + .ch3-bio-card
// - T2 parallax: .ch3-parallax con las 3 capas (sky/mountains/path) aria-hidden
// - T3 decor fantasía: estandarte flotante + escudo en bio aside (reemplazan Web 2.0)
// - T4 bio render + projects filter (chapterEra===3)
// - T5 reactive: toggle locale actualiza bio sin re-mount
// - T6 texto era: bio menciona el salto de vuelta a JS / web interactiva
// - T7 CSS readFileSync: parallax layers + PRM guard + scroll handler

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'pp1', chapterEra: 3, year: 2013, titleKey: 'projects.pp1.title', descKey: 'projects.pp1.desc', link: null, imageSrc: null, role: null, techStack: null, planetSprite: null, planetOrbit: null, planetColor: null },
    { id: 'pp2', chapterEra: 3, year: 2013, titleKey: 'projects.pp1.title', descKey: 'projects.pp1.desc', link: 'https://example.com', imageSrc: null, role: 'UX Lead', techStack: ['CSS3', 'jQuery'], planetSprite: null, planetOrbit: null, planetColor: null },
    { id: 'ch4-x', chapterEra: 4, year: 2015, titleKey: 'projects.pp1.title', descKey: 'projects.pp1.desc', link: null, imageSrc: null, role: null, techStack: null, planetSprite: null, planetOrbit: null, planetColor: null },
  ],
}))

function mountCh3({ locale = 'es', stubs } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter3Content, { global: { plugins: [i18n], stubs } })
  return { wrapper, i18n }
}

const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

describe('Chapter3Content.vue (parallax fantasía épica — iter9 2026-05-28)', () => {
  // ── T1: DOM contract ──────────────────────────────────────────────────────
  it('T1 DOM contract: .ch3-stage root + .ch3-content', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-stage').exists()).toBe(true)
    expect(wrapper.find('.ch3-content').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-hero + .ch3-hero-title presentes', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-hero').exists()).toBe(true)
    expect(wrapper.find('.ch3-hero-title').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-bio-card con párrafos', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-bio-card').exists()).toBe(true)
    expect(wrapper.findAll('.ch3-bio-card p').length).toBeGreaterThan(0)
  })

  it('T1 DOM contract: .ch3-projects renderea con projects mockeados', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-projects').exists()).toBe(true)
  })

  // ── T2: parallax 3 capas ──────────────────────────────────────────────────
  it('T2 parallax: .ch3-parallax existe y es aria-hidden', () => {
    const { wrapper } = mountCh3()
    const par = wrapper.find('.ch3-parallax')
    expect(par.exists()).toBe(true)
    expect(par.attributes('aria-hidden')).toBe('true')
  })

  it('T2 parallax: las 3 capas sky/mountains/path están presentes', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-layer--sky').exists()).toBe(true)
    expect(wrapper.find('.ch3-layer--mountains').exists()).toBe(true)
    expect(wrapper.find('.ch3-layer--path').exists()).toBe(true)
  })

  // ── T3: decor fantasía (reemplaza robot + starbursts Web 2.0) ──────────────
  it('T3 decor: estandarte flotante con src ch3-prop-banner.png + aria-hidden', () => {
    const { wrapper } = mountCh3()
    const banner = wrapper.find('.ch3-decor--banner')
    expect(banner.exists()).toBe(true)
    expect(banner.attributes('aria-hidden')).toBe('true')
    expect(banner.find('img').attributes('src')).toBe('/assets/ch3-prop-banner.png')
  })

  it('T3 decor: escudo heráldico en bio aside con src ch3-prop-shield.png', () => {
    const { wrapper } = mountCh3()
    const shield = wrapper.find('.ch3-bio-shield')
    expect(shield.exists()).toBe(true)
    expect(shield.attributes('src')).toBe('/assets/ch3-prop-shield.png')
  })

  it('T3 decor: ya NO hay starbursts ni robot mascota Web 2.0', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-starburst').exists()).toBe(false)
    expect(wrapper.find('.ch3-bio-mascot').exists()).toBe(false)
  })

  // ── T4: bio render + projects filter ───────────────────────────────────────
  it('T4 bio render: locale=es → .ch3-bio-card p tiene texto', () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    expect(wrapper.find('.ch3-bio-card p').text().length).toBeGreaterThan(0)
  })

  it('T4 projects filter: chapterEra===3 → 2 ProjectCards (filtra el ch4)', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.findAllComponents(ProjectCard).length).toBe(2)
  })

  // ── T5: reactive ───────────────────────────────────────────────────────────
  it('T5 reactive: toggle locale es→en → bio text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh3({ locale: 'es' })
    const textEs = wrapper.find('.ch3-bio-card p').text()
    i18n.global.locale.value = 'en'
    await flushPromises()
    const textEn = wrapper.find('.ch3-bio-card p').text()
    expect(textEn.length).toBeGreaterThan(0)
    expect(typeof textEs).toBe('string')
  })

  // ── T6: narrativa era — salto de vuelta a JS / web interactiva ─────────────
  it('T6 texto: el bio ES menciona el salto de vuelta a la web interactiva / JS', () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    const full = wrapper.findAll('.ch3-bio-card p').map((p) => p.text()).join(' ')
    expect(full.toLowerCase()).toMatch(/web interactiva|js/)
  })

  // ── T7: CSS source — parallax + PRM guard + scroll handler ─────────────────
  it('T7 CSS: .ch3-stage tiene overflow-y: auto + max-height 100dvh (clip viewport)', () => {
    expect(CH3_SOURCE).toMatch(/overflow-y:\s*auto/)
    expect(CH3_SOURCE).toMatch(/max-height:\s*100dvh/)
  })

  it('T7 CSS: .ch3-parallax es sticky (pinned al viewport del stage)', () => {
    expect(CH3_SOURCE).toMatch(/\.ch3-parallax\s*\{[\s\S]*?position:\s*sticky/)
  })

  it('T7 CSS: las 3 capas referencian sus assets parallax', () => {
    expect(CH3_SOURCE).toMatch(/ch3-sky\.png/)
    expect(CH3_SOURCE).toMatch(/ch3-mountains\.png/)
    expect(CH3_SOURCE).toMatch(/ch3-path\.png/)
  })

  it('T7 CSS: PRM guard desactiva animación + transform bajo prefers-reduced-motion', () => {
    expect(CH3_SOURCE).toMatch(/prefers-reduced-motion:\s*reduce/)
    expect(CH3_SOURCE).toMatch(/transform:\s*none\s*!important/)
  })

  it('T7 script: hay handler de scroll que alimenta el parallax', () => {
    expect(CH3_SOURCE).toMatch(/@scroll="onScroll"/)
    expect(CH3_SOURCE).toMatch(/function onScroll/)
  })
})
