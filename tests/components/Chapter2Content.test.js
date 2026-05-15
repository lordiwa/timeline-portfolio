// tests/components/Chapter2Content.test.js
// TDD RED phase — Plan 04-03, Task 3.
//
// Cobertura (clonada de Chapter3Content.test.js + variantes ch2):
// - T1 DOM contract: .ch2-layout + .ch2-meta (sin inline avatar) + .ch2-content + .ch2-bio + (opcional .ch2-projects)
//   Rafael 2026-05-15: inline avatars eliminados de todos los ch — solo StickyAvatar top-left.
// - T2 avatar img src='/assets/ch2-bust.png' + alt i18n
// - T3 bio render: .ch2-bio p contiene texto del locale activo
// - T4 projects filter: solo chapterEra===2 monta ProjectCards
// - T5 reactive: toggle locale es→en → bio + flavor + banner title actualizan
// - T6 FlashBanner embebido: <FlashBanner> presente en el DOM
// - T7 CSS source: chapter-themes.css contiene [data-chapter="2"] .project-card variant Flash-era

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter2Content from '@/components/Chapter2Content.vue'
import FlashBanner from '@/components/FlashBanner.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock projects: 2 ch2 + 1 ch4 → solo 2 ch2 cards deben montar
vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch2-bluelizard',
      chapterEra: 2,
      year: 2009,
      titleKey: 'projects.ch2-bluelizard.title',
      descKey: 'projects.ch2-bluelizard.desc',
      link: null,
      imageSrc: null,
      role: 'Gameplay Programmer',
      techStack: ['ActionScript 3', 'Flash CS5'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch2-matte',
      chapterEra: 2,
      year: 2009,
      titleKey: 'projects.ch2-matte.title',
      descKey: 'projects.ch2-matte.desc',
      link: null,
      imageSrc: null,
      role: 'Gameplay Programmer',
      techStack: ['ActionScript 3'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch4-x',
      chapterEra: 4,
      year: 2015,
      titleKey: 'projects.ch2-bluelizard.title',
      descKey: 'projects.ch2-bluelizard.desc',
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

const CSS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

function mountCh2({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter2Content, { global: { plugins: [i18n] } })
  return { wrapper, i18n }
}

describe('Chapter2Content.vue', () => {
  // ─────────────────────────────────────────────────────────
  // T1 DOM
  // ─────────────────────────────────────────────────────────
  it('T1 DOM: .ch2-layout existe con .ch2-meta y .ch2-content', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.find('.ch2-layout').exists()).toBe(true)
    expect(wrapper.find('.ch2-meta').exists()).toBe(true)
    expect(wrapper.find('.ch2-content').exists()).toBe(true)
  })

  it('T1 DOM: .ch2-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar)', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.find('.ch2-meta img.ch2-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch2-avatar').exists()).toBe(false)
  })

  it('T1 DOM: .ch2-content contiene .ch2-bio (div, no section)', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.find('.ch2-content .ch2-bio').exists()).toBe(true)
  })

  it('T1 DOM: .ch2-content contiene .ch2-projects (proyectos mockeados presentes)', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.find('.ch2-content .ch2-projects').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ─────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────
  // T3 bio render
  // ─────────────────────────────────────────────────────────
  it('T3 bio render: .ch2-bio p contiene texto', () => {
    const { wrapper } = mountCh2({ locale: 'es' })
    const bioP = wrapper.find('.ch2-bio p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  it('T3 bio render: locale=en → .ch2-bio p contiene texto en inglés', () => {
    const { wrapper } = mountCh2({ locale: 'en' })
    const bioP = wrapper.find('.ch2-bio p')
    expect(bioP.exists()).toBe(true)
    expect(bioP.text().length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────
  // T4 projects filter
  // ─────────────────────────────────────────────────────────
  it('T4 projects filter: chapterEra===2 → monta 2 ProjectCards (filtra el de chapterEra=4)', () => {
    const { wrapper } = mountCh2()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(2)
  })

  // ─────────────────────────────────────────────────────────
  // T5 reactive
  // ─────────────────────────────────────────────────────────
  it('T5 reactive: toggle locale es→en actualiza .ch2-flavor sin re-mount', async () => {
    const { wrapper, i18n } = mountCh2({ locale: 'es' })
    const flavorEs = wrapper.find('.ch2-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const flavorEn = wrapper.find('.ch2-flavor').text()
    expect(flavorEn.length).toBeGreaterThan(0)
    expect(typeof flavorEs).toBe('string')
  })

  // ─────────────────────────────────────────────────────────
  // T6 FlashBanner embed
  // ─────────────────────────────────────────────────────────
  it('T6 FlashBanner: <FlashBanner /> está presente como componente hijo', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.findComponent(FlashBanner).exists()).toBe(true)
  })

  it('T6 FlashBanner: el DOM rendered contiene <header.flash-banner>', () => {
    const { wrapper } = mountCh2()
    expect(wrapper.find('header.flash-banner').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────
  // T7 CSS source: project-card variant Flash-era
  // ─────────────────────────────────────────────────────────
  it('T7 CSS: chapter-themes.css contiene [data-chapter="2"] .project-card variant', () => {
    expect(CSS_SOURCE).toMatch(/\[data-chapter=["']2["']\]\s+\.project-card\s*\{/)
  })

  it('T7 CSS: variant ch2 .project-card usa linear-gradient (Flash-era orange-purple)', () => {
    const blockMatch = CSS_SOURCE.match(
      /\[data-chapter=["']2["']\]\s+\.project-card\s*\{[^}]*\}/s
    )
    expect(blockMatch).toBeTruthy()
    expect(blockMatch[0]).toMatch(/linear-gradient/)
  })
})
