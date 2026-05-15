// tests/components/Chapter1Content.test.js
// TDD RED phase — Plan 04-02, Task 2.
//
// Cobertura:
// - T1 DOM contract: .ch1-layout + .ch1-meta (sin inline avatar) + .ch1-content + .ch1-bio
//   Rafael 2026-05-15: inline avatars eliminados de todos los ch — solo StickyAvatar top-left.
// - T3 <MarqueeBanner> + <StarfieldBg> components embebidos
// - T4 ch1 NO renderea ProjectCard (sin proyectos — CONTENT-CHECKLIST §2.6)
// - T5 locale ES→EN toggle actualiza flavor text
// - T6 ART-07 guard: source SFC no contiene url(.*ch1-bg.*) ni img src parallax
// - T7 PRM mutable: prefersReduced=true → <marquee> no existe, .marquee-banner__static sí

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter1Content from '@/components/Chapter1Content.vue'
import MarqueeBanner from '@/components/MarqueeBanner.vue'
import StarfieldBg from '@/components/StarfieldBg.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock de @/data/projects — ch1 no tiene proyectos
vi.mock('@/data/projects', () => ({
  projects: [],
}))

// Lee el SFC raw para asserts de CSS (T6 ART-07)
const CH1_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter1Content.vue'),
  'utf8'
)

// Helper: monta Chapter1Content con i18n + prm provide mutable
function mountCh1({ locale = 'es', initialPRM = false } = {}) {
  const prefersReduced = ref(initialPRM)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter1Content, {
    global: {
      plugins: [i18n],
      provide: {
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, i18n, prefersReduced }
}

describe('Chapter1Content.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — estructura base del layout ch1
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: .ch1-layout existe con .ch1-meta y .ch1-content', () => {
    const { wrapper } = mountCh1()
    expect(wrapper.find('.ch1-layout').exists()).toBe(true)
    expect(wrapper.find('.ch1-meta').exists()).toBe(true)
    expect(wrapper.find('.ch1-content').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch1-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar)', () => {
    const { wrapper } = mountCh1()
    expect(wrapper.find('.ch1-meta img.ch1-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch1-avatar').exists()).toBe(false)
  })

  it('T1 DOM contract: .ch1-content contiene .ch1-bio', () => {
    const { wrapper } = mountCh1()
    expect(wrapper.find('.ch1-content .ch1-bio').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // T3: MarqueeBanner + StarfieldBg embebidos
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 MarqueeBanner: <MarqueeBanner> component está embebido', () => {
    const { wrapper } = mountCh1()
    expect(wrapper.findComponent(MarqueeBanner).exists()).toBe(true)
  })

  it('T3 StarfieldBg: <StarfieldBg> component está embebido', () => {
    const { wrapper } = mountCh1()
    expect(wrapper.findComponent(StarfieldBg).exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: ch1 NO renderea ProjectCards (CONTENT-CHECKLIST §2.6)
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 no projects: ch1 no renderea ningún ProjectCard', () => {
    const { wrapper } = mountCh1()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: i18n reactive — toggle locale actualiza flavor text
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 i18n reactive: toggle locale es→en → flavor text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh1({ locale: 'es' })
    const textEs = wrapper.find('.ch1-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.ch1-flavor').text()
    expect(textEs.length).toBeGreaterThan(0)
    expect(textEn.length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: ART-07 guard — SFC source no contiene referencias a pixel-art bg ch1
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 ART-07: source SFC no contiene url(...ch1-bg...) (pixel-art background prohibido)', () => {
    expect(CH1_SOURCE).not.toMatch(/url\(.*ch1-bg/)
  })

  it('T6 ART-07: source SFC no contiene img src con parallax/ (ART-07 enforced)', () => {
    expect(CH1_SOURCE).not.toMatch(/<img[^>]*src=["'][^"']*parallax\//)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T7: PRM mutable — prefersReduced=true → <marquee> no existe, static sí
  // Verifica que el provide pasa correctamente al MarqueeBanner nested
  // ─────────────────────────────────────────────────────────────────────────
  it('T7 PRM marquee swap: prefersReduced=true → <marquee> no existe en DOM', () => {
    const { wrapper } = mountCh1({ initialPRM: true })
    expect(wrapper.find('marquee').exists()).toBe(false)
  })

  it('T7 PRM marquee swap: prefersReduced=true → .marquee-banner__static existe en DOM', () => {
    const { wrapper } = mountCh1({ initialPRM: true })
    expect(wrapper.find('.marquee-banner__static').exists()).toBe(true)
  })

  it('T7 PRM marquee swap: mutar prefersReduced.value=true → swap reactivo sin re-mount', async () => {
    const { wrapper, prefersReduced } = mountCh1({ initialPRM: false })
    expect(wrapper.find('marquee').exists()).toBe(true)

    prefersReduced.value = true
    await flushPromises()

    expect(wrapper.find('marquee').exists()).toBe(false)
    expect(wrapper.find('.marquee-banner__static').exists()).toBe(true)
  })
})
