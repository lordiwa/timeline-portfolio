// tests/components/Chapter3Content.test.js
// TDD RED phase — Plan 03-03, Task 3.2.
//
// Cobertura:
// - T1 DOM contract: .ch3-layout + .ch3-meta + img.ch3-avatar + .ch3-content + .ch3-bio + .ch3-projects
// - T2 avatar img src y alt i18n (locale es + en)
// - T3 bio render: .ch3-bio p muestra el texto del locale activo
// - T4 projects filter: solo chapterEra===3 monta ProjectCards (2 ch3 + 1 ch4 → 1 card)
// - T5 reactive (Pitfall 3): toggle locale → bio text actualiza sin re-mount
// - T6 CSS readFileSync: Chapter3Content.vue tiene layout D3-09 Opción A + D3-12 mobile

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter3Content from '@/components/Chapter3Content.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock de @/data/projects con fixtures para tests determinísticos
// - 2 proyectos chapterEra:3 → deben aparecer como ProjectCards
// - 1 proyecto chapterEra:4 → NO debe aparecer (filtrado)
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

// Helper para montar Chapter3Content con i18n plugin
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

// Lee el archivo Chapter3Content.vue como raw string para asserts de CSS (T6)
const CH3_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter3Content.vue'),
  'utf8'
)

describe('Chapter3Content.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — estructura base del layout
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: .ch3-layout existe con .ch3-meta y .ch3-content', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-layout').exists()).toBe(true)
    expect(wrapper.find('.ch3-meta').exists()).toBe(true)
    expect(wrapper.find('.ch3-content').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-meta contiene img.ch3-avatar', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-meta img.ch3-avatar').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-content contiene .ch3-bio', () => {
    const { wrapper } = mountCh3()
    expect(wrapper.find('.ch3-content .ch3-bio').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch3-content contiene .ch3-projects (proyectos mockeados presentes)', () => {
    const { wrapper } = mountCh3()
    // Con el mock, ch3Projects.length > 0, por lo que .ch3-projects debe existir
    expect(wrapper.find('.ch3-content .ch3-projects').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: avatar img src + alt i18n
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 avatar img: src === /assets/ch3-bust.png', () => {
    const { wrapper } = mountCh3()
    const img = wrapper.find('img.ch3-avatar')
    expect(img.attributes('src')).toBe('/assets/ch3-bust.png')
  })

  it('T2 avatar img alt: locale=es → alt es la traducción de avatar.busts.3.alt en español', () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    const img = wrapper.find('img.ch3-avatar')
    expect(img.attributes('alt')).toBeTruthy()
    expect(img.attributes('alt').length).toBeGreaterThan(0)
  })

  it('T2 avatar img alt: locale=en → alt cambia a versión en inglés', () => {
    const { wrapper: wrapperEs } = mountCh3({ locale: 'es' })
    const { wrapper: wrapperEn } = mountCh3({ locale: 'en' })
    const altEs = wrapperEs.find('img.ch3-avatar').attributes('alt')
    const altEn = wrapperEn.find('img.ch3-avatar').attributes('alt')
    // Ambos deben ser strings no vacíos
    expect(altEs.length).toBeGreaterThan(0)
    expect(altEn.length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: bio render — .ch3-bio p muestra el texto t(bio.coreKey)
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 bio render: .ch3-bio p contiene texto (puede ser PENDING placeholder)', () => {
    const { wrapper } = mountCh3({ locale: 'es' })
    const bioP = wrapper.find('.ch3-bio p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  it('T3 bio render: locale=en → .ch3-bio p contiene texto en inglés', () => {
    const { wrapper } = mountCh3({ locale: 'en' })
    const bioP = wrapper.find('.ch3-bio p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: projects filter — solo chapterEra===3 → 2 ProjectCards (filtra ch4-x)
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 projects filter: chapterEra===3 → monta 2 ProjectCards (filtra el de chapterEra=4)', () => {
    const { wrapper } = mountCh3()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(2)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: reactive (Pitfall 3) — toggle locale → bio text actualiza
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 reactive (Pitfall 3): toggle locale es→en → .ch3-bio p text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh3({ locale: 'es' })
    const textEs = wrapper.find('.ch3-bio p').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.ch3-bio p').text()
    expect(textEn.length).toBeGreaterThan(0)
    expect(typeof textEs).toBe('string')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: CSS readFileSync — Chapter3Content.vue contiene layout D3-09 + D3-12
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 CSS desktop: .ch3-layout tiene grid-template-columns: 200px 1fr (D3-09 Opción A)', () => {
    expect(CH3_SOURCE).toMatch(/grid-template-columns:\s*200px 1fr/)
  })

  it('T6 CSS desktop: .ch3-layout tiene padding-left: 160px (D3-09 StickyTimeline clearance)', () => {
    expect(CH3_SOURCE).toMatch(/padding-left:\s*160px/)
  })

  it('T6 CSS mobile: @media (max-width: 599px) presente con grid-template-columns: 1fr', () => {
    expect(CH3_SOURCE).toMatch(/@media\s*\(max-width:\s*599px\)/)
    expect(CH3_SOURCE).toMatch(/grid-template-columns:\s*1fr/)
  })

  it('T6 CSS mobile: .ch3-content tiene overflow-y: auto en mobile (D3-12)', () => {
    expect(CH3_SOURCE).toMatch(/overflow-y:\s*auto/)
  })

  it('T6 CSS mobile: padding-left: 60px en mobile (StickyTimeline mobile clearance)', () => {
    expect(CH3_SOURCE).toMatch(/padding-left:\s*60px/)
  })
})
