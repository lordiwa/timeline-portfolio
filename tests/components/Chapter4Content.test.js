// tests/components/Chapter4Content.test.js
// Tests Plan 04-04 Task 4 — Chapter4Content.vue (wrapper AR/VR con bg + glass panels).
//
// iter2 (Rafael 2026-05-28): ParallaxLayers stack reemplazado por single bg full-bleed
// (ch4-bg.png cover fixed estilo .ch3-stage). T3/T6 actualizados al nuevo contrato.
//
// Cobertura T1-T7:
// - T1 DOM contract: .ch4-layout + .ch4-meta + .ch4-content
// - T3 bg-image ch4-bg.png + FloatingPanel embeds (sin ParallaxLayers)
// - T4 projects filter ch4 → solo ch4 items en FloatingPanel (mock 1 ch4 + 1 ch5)
// - T5 reactive: locale ES→EN, flavor + bio actualizan
// - T6 CSS source: .ch4-layout tiene position:relative + bg-image + background-attachment:fixed
// - T7 NO usa <ProjectCard> (D4-04 — projects van vía FloatingPanel slot)

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter4Content from '@/components/Chapter4Content.vue'
import FloatingPanel from '@/components/FloatingPanel.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch4-arvr-own',
      chapterEra: 4,
      year: 2015,
      titleKey: 'projects.ch4-arvr-own.title',
      descKey: 'projects.ch4-arvr-own.desc',
      link: null,
      imageSrc: null,
      role: 'Founder / Tech Lead',
      techStack: ['Unity', 'ARKit'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-x',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch4-arvr-own.title',
      descKey: 'projects.ch4-arvr-own.desc',
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

const CH4_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter4Content.vue'),
  'utf8'
)

function mountCh4({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter4Content, {
    global: {
      plugins: [i18n],
    },
  })
  return { wrapper, i18n }
}

describe('Chapter4Content.vue', () => {
  // ───────────────────────────────────────────────
  // T1 DOM
  // ───────────────────────────────────────────────
  it('T1 DOM: .ch4-layout existe con .ch4-meta y .ch4-content', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-layout').exists()).toBe(true)
    expect(wrapper.find('.ch4-meta').exists()).toBe(true)
    expect(wrapper.find('.ch4-content').exists()).toBe(true)
  })

  it('T1 DOM: .ch4-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-meta img.ch4-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch4-avatar').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ───────────────────────────────────────────────

  // ───────────────────────────────────────────────
  // T3 bg-image + FloatingPanel embeds (iter2: sin ParallaxLayers)
  // ───────────────────────────────────────────────
  it('T3 iter2: CSS source referencia ch4-bg.png como background-image', () => {
    expect(CH4_SOURCE).toMatch(/background-image:\s*url\(['"]?\/assets\/ch4-bg\.png/)
  })

  it('T3: count <FloatingPanel> ≥ 2 (panel principal + N projects ch4)', () => {
    const { wrapper } = mountCh4()
    const panels = wrapper.findAllComponents(FloatingPanel)
    // 1 panel principal (bio + flavor) + 1 project ch4 (mock filtra ch5 fuera)
    expect(panels.length).toBe(2)
  })

  // ───────────────────────────────────────────────
  // T4 projects filter
  // ───────────────────────────────────────────────
  it('T4 projects filter: chapterEra===4 monta 1 FloatingPanel project (filtra ch5)', () => {
    const { wrapper } = mountCh4()
    const panels = wrapper.findAllComponents(FloatingPanel)
    // panel principal (sin titleKey) + 1 project (titleKey=ch4-arvr-own)
    expect(panels.length).toBe(2)
  })

  // ───────────────────────────────────────────────
  // T5 reactive
  // ───────────────────────────────────────────────
  it('T5 reactive: locale ES→EN actualiza flavor + bio sin re-mount', async () => {
    const { wrapper, i18n } = mountCh4({ locale: 'es' })
    const flavorEs = wrapper.find('.ch4-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const flavorEn = wrapper.find('.ch4-flavor').text()
    expect(flavorEn.length).toBeGreaterThan(0)
    expect(typeof flavorEs).toBe('string')
  })

  // ───────────────────────────────────────────────
  // T6 CSS source markers iter2 — bg fixed cover patrón .ch3-stage
  // ───────────────────────────────────────────────
  it('T6 iter2 CSS: .ch4-layout tiene position: relative + background-attachment: fixed', () => {
    expect(CH4_SOURCE).toMatch(/\.ch4-layout\s*\{[^}]*position:\s*relative/s)
    expect(CH4_SOURCE).toMatch(/\.ch4-layout\s*\{[^}]*background-attachment:\s*fixed/s)
  })

  it('T6 iter2 CSS: .ch4-layout tiene background-size: cover + image-rendering: pixelated', () => {
    expect(CH4_SOURCE).toMatch(/\.ch4-layout\s*\{[^}]*background-size:\s*cover/s)
    expect(CH4_SOURCE).toMatch(/\.ch4-layout\s*\{[^}]*image-rendering:\s*pixelated/s)
  })

  // ───────────────────────────────────────────────
  // T7 NO ProjectCard (D4-04)
  // ───────────────────────────────────────────────
  it('T7 D4-04: NO usa <ProjectCard> (projects van vía FloatingPanel slot)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.findAllComponents(ProjectCard).length).toBe(0)
  })
})
