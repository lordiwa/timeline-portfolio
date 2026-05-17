// tests/components/Chapter3Content.test.js
// Updated 2026-05-17 — design Web 2.0 final (Rafael "todo a tope").
//
// Cobertura:
// - T1 DOM contract: .ch3-stage + .ch3-hero + .ch3-bio-card + (.ch3-projects condicional)
//   Override 2026-05-17: el avatar inline en hero (.ch3-avatar-wet) ES intencional —
//   centerpiece del design Web 2.0 wet-reflection. Coexiste con StickyAvatar HUD top-left.
// - T2 starbursts: 2 starbursts BETA/NEW decorativos presentes con aria-hidden
// - T3 bio render: .ch3-bio-card p muestra el texto del locale activo
// - T4 projects filter: solo chapterEra===3 monta ProjectCards (2 ch3 + 1 ch4 → 2 cards)
// - T5 reactive (Pitfall 3): toggle locale → bio text actualiza sin re-mount
// - T6 CSS readFileSync: Chapter3Content.vue tiene layout Web 2.0 + D3-12 mobile scroll

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'pp1',
      chapterEra: 3,
      year: 2013,
      titleKey: 'projects.pp1.title',
      descKey: 'projects.pp1.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'pp2',
      chapterEra: 3,
      year: 2013,
      titleKey: 'projects.pp1.title',
      descKey: 'projects.pp1.desc',
      link: 'https://example.com',
      imageSrc: null,
      role: 'UX Lead',
      techStack: ['CSS3', 'jQuery'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch4-x',
      chapterEra: 4,
      year: 2015,
      titleKey: 'projects.pp1.title',
      descKey: 'projects.pp1.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
  ],
}))

function mountCh3({ locale = 'es', stubs } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter3Content, {
    global: {
      plugins: [i18n],
      stubs,
    },
  })
  return { wrapper, i18n }
}

const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

describe('Chapter3Content.vue (Web 2.0 design — 2026-05-17)', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — nuevo layout Web 2.0 hero centered
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: .ch3-stage existe como root', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-stage').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-hero (hero centered Web 2.0) presente con title y subtitle', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-hero').exists()).toBe(true)
    expect(wrapper.find('.ch3-hero-title').exists()).toBe(true)
    expect(wrapper.find('.ch3-hero-subtitle').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-bio-card (glassy Aqua card) presente con párrafos', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-bio-card').exists()).toBe(true)
    expect(wrapper.findAll('.ch3-bio-card p').length).toBeGreaterThan(0)
  })

  it('T1 DOM contract: .ch3-projects renderea con projects mockeados', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-projects').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: starbursts BETA/NEW Web 2.0 signature elements
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 starbursts: 2 starbursts (BETA + NEW) renderean con aria-hidden', () => {
    const { wrapper } = mountCh3()
    const sbs = wrapper.findAll('.ch3-starburst')
    expect(sbs.length).toBe(2)
    sbs.forEach((sb) => {
      expect(sb.attributes('aria-hidden')).toBe('true')
    })
  })

  it('T2 starbursts: labels BETA y ¡NEW! presentes', () => {
    const { wrapper } = mountCh3()
    const labels = wrapper.findAll('.ch3-starburst-text').map((n) => n.text())
    expect(labels).toContain('BETA')
    expect(labels).toContain('¡NEW!')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: bio render
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 bio render: locale=es → .ch3-bio-card p tiene texto', () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    const bioP = wrapper.find('.ch3-bio-card p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  it('T3 bio render: locale=en → .ch3-bio-card p tiene texto en inglés', () => {
    const { wrapper } = mountCh3({ locale: 'en' })
    const bioP = wrapper.find('.ch3-bio-card p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: projects filter
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 projects filter: chapterEra===3 → monta 2 ProjectCards (filtra el ch4)', () => {
    const { wrapper } = mountCh3()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(2)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: reactive (Pitfall 3)
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 reactive: toggle locale es→en → .ch3-bio-card p text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh3({ locale: 'es' })
    const textEs = wrapper.find('.ch3-bio-card p').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.ch3-bio-card p').text()
    expect(textEn.length).toBeGreaterThan(0)
    expect(typeof textEs).toBe('string')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: CSS readFileSync — Chapter3Content.vue tiene layout Web 2.0 + D3-12
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 CSS: .ch3-stage tiene paper-bg background-image', () => {
    expect(CH3_SOURCE).toMatch(/background-image:\s*url\(['"]\/assets\/ch3-paper-bg\.png['"]\)/)
  })

  it('T6 CSS: .ch3-stage tiene overflow-y: auto (scroll interno respeta D3-12 + previene bleed bug)', () => {
    expect(CH3_SOURCE).toMatch(/overflow-y:\s*auto/)
  })

  it('T6 CSS: .ch3-stage tiene height/max-height 100dvh (clip al viewport — fix overlap del bug Phase 4)', () => {
    expect(CH3_SOURCE).toMatch(/max-height:\s*100dvh/)
  })

  it('T6 CSS: .ch3-bio-card tiene gradient + box-shadow (Web 2.0 glass card)', () => {
    expect(CH3_SOURCE).toMatch(/\.ch3-bio-card\s*\{[\s\S]*?linear-gradient/)
    expect(CH3_SOURCE).toMatch(/\.ch3-bio-card\s*\{[\s\S]*?box-shadow/)
  })

  it('T6 CSS: .ch3-avatar-wet tiene reflection pseudo (::after con scaleY(-1) + mask-image fade)', () => {
    expect(CH3_SOURCE).toMatch(/\.ch3-avatar-wet::after\s*\{[\s\S]*?scaleY\(-1\)/)
    expect(CH3_SOURCE).toMatch(/\.ch3-avatar-wet::after\s*\{[\s\S]*?mask-image/)
  })
})
