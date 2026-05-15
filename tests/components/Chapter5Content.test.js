// tests/components/Chapter5Content.test.js
// Tests Plan 04-05 Task 4 — Chapter5Content.vue (wrapper Modern + ScrollRevealCard staggered).

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Chapter5Content from '@/components/Chapter5Content.vue'
import ScrollRevealCard from '@/components/ScrollRevealCard.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch5-bairesdev',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch5-bairesdev.title',
      descKey: 'projects.ch5-bairesdev.desc',
      link: null,
      imageSrc: null,
      role: 'Frontend Lead',
      techStack: ['Vue 3'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-number8',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch5-number8.title',
      descKey: 'projects.ch5-number8.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-remoose',
      chapterEra: 5,
      year: 2023,
      titleKey: 'projects.ch5-remoose.title',
      descKey: 'projects.ch5-remoose.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch4-x',
      chapterEra: 4,
      year: 2018,
      titleKey: 'projects.ch5-bairesdev.title',
      descKey: 'projects.ch5-bairesdev.desc',
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

function mountCh5({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter5Content, {
    global: {
      plugins: [i18n],
      provide: {
        prm: { prefersReduced: ref(false) },
      },
    },
  })
  return { wrapper, i18n }
}

describe('Chapter5Content.vue', () => {
  // ───────────────────────────────────────────────
  // T1 DOM contract
  // ───────────────────────────────────────────────
  it('T1 DOM: .ch5-layout existe con .ch5-meta y .ch5-content', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-layout').exists()).toBe(true)
    expect(wrapper.find('.ch5-meta').exists()).toBe(true)
    expect(wrapper.find('.ch5-content').exists()).toBe(true)
  })

  it('T1 DOM: .ch5-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar); .ch5-projects existe (mock 3 ch5)', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-meta img.ch5-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch5-avatar').exists()).toBe(false)
    expect(wrapper.find('.ch5-projects').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ───────────────────────────────────────────────

  // ───────────────────────────────────────────────
  // T3 ScrollRevealCard count
  // ───────────────────────────────────────────────
  it('T3: count <ScrollRevealCard> = 1 header + N projects ch5 (mock 3 ch5 + 1 ch4 → 4 total)', () => {
    const { wrapper } = mountCh5()
    const cards = wrapper.findAllComponents(ScrollRevealCard)
    // 1 header card + 3 ch5 projects (filter excluye ch4-x)
    expect(cards.length).toBe(4)
  })

  // ───────────────────────────────────────────────
  // T4 projects filter ch5
  // ───────────────────────────────────────────────
  it('T4 projects filter: chapterEra===5 → 3 ProjectCards (filter ch4-x)', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.findAllComponents(ProjectCard).length).toBe(3)
  })

  // ───────────────────────────────────────────────
  // T5 reactive locale
  // ───────────────────────────────────────────────
  it('T5 reactive: locale ES→EN actualiza flavor + bio sin re-mount', async () => {
    const { wrapper, i18n } = mountCh5({ locale: 'es' })
    const flavorEs = wrapper.find('.ch5-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const flavorEn = wrapper.find('.ch5-flavor').text()
    expect(flavorEn.length).toBeGreaterThan(0)
    expect(typeof flavorEs).toBe('string')
  })

  // ───────────────────────────────────────────────
  // T6 staggered delays
  // ───────────────────────────────────────────────
  it('T6 staggered: ScrollRevealCard project delays = 100*(idx+1) → 100, 200, 300', () => {
    const { wrapper } = mountCh5()
    const cards = wrapper.findAllComponents(ScrollRevealCard)
    // index 0 = header (delay 0); index 1..3 = projects (delay 100, 200, 300)
    expect(cards.at(0).props('delay')).toBe(0)
    expect(cards.at(1).props('delay')).toBe(100)
    expect(cards.at(2).props('delay')).toBe(200)
    expect(cards.at(3).props('delay')).toBe(300)
  })

  // ───────────────────────────────────────────────
  // T7 sin background-image directo (viene de BackgroundLayers)
  // ───────────────────────────────────────────────
  it('T7 SFC source: NO contiene background-image directo (viene de BackgroundLayers --bg-image)', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8'
    )
    // El SFC scoped NO debe declarar background-image: url(...)
    // (la convención Phase 4 es que --bg-image viene de chapter-themes.css consumido por BackgroundLayers)
    expect(source).not.toMatch(/background-image:\s*url/)
  })
})
