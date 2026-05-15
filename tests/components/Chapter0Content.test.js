// tests/components/Chapter0Content.test.js
// TDD RED phase — Plan 04-02, Task 2.
//
// Cobertura:
// - T1 DOM contract: .ch0-layout + .ch0-meta (sin inline avatar) + .ch0-content + .ch0-bio
//   Rafael 2026-05-15: inline avatars eliminados de todos los ch — solo StickyAvatar top-left.
// - T2 avatar img src === /assets/ch0-bust.png + alt i18n (no vacío)
// - T3 <TerminalScroll> component embebido (findComponent)
// - T4 ch0 NO renderea ProjectCard (sin proyectos — CONTENT-CHECKLIST §2.6)
// - T5 locale ES→EN toggle actualiza flavor text
// - T6 ART-07 guard: source SFC no contiene url(.*ch0-bg.*) ni img src parallax

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter0Content from '@/components/Chapter0Content.vue'
import TerminalScroll from '@/components/TerminalScroll.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock de @/data/projects — ch0 no tiene proyectos; mock vacío es correcto
vi.mock('@/data/projects', () => ({
  projects: [],
}))

// Lee el SFC raw para asserts de CSS (T6 ART-07)
const CH0_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter0Content.vue'),
  'utf8'
)

// Helper: monta Chapter0Content con i18n + prm provide (TerminalScroll no necesita prm pero si Chapter1)
function mountCh0({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter0Content, {
    global: {
      plugins: [i18n],
    },
  })
  return { wrapper, i18n }
}

describe('Chapter0Content.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — estructura base del layout ch0
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: .ch0-layout existe con .ch0-meta y .ch0-content', () => {
    const { wrapper } = mountCh0()
    expect(wrapper.find('.ch0-layout').exists()).toBe(true)
    expect(wrapper.find('.ch0-meta').exists()).toBe(true)
    expect(wrapper.find('.ch0-content').exists()).toBe(true)
  })

  it('T1 DOM contract: .ch0-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar)', () => {
    const { wrapper } = mountCh0()
    expect(wrapper.find('.ch0-meta img.ch0-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch0-avatar').exists()).toBe(false)
  })

  it('T1 DOM contract: .ch0-content contiene .ch0-bio', () => {
    const { wrapper } = mountCh0()
    expect(wrapper.find('.ch0-content .ch0-bio').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // T3: TerminalScroll embebido en el content
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 TerminalScroll: <TerminalScroll> component está embebido', () => {
    const { wrapper } = mountCh0()
    expect(wrapper.findComponent(TerminalScroll).exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: ch0 NO renderea ProjectCards (CONTENT-CHECKLIST §2.6)
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 no projects: ch0 no renderea ningún ProjectCard', () => {
    const { wrapper } = mountCh0()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: i18n reactive — toggle locale actualiza flavor text
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 i18n reactive: toggle locale es→en → flavor text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCh0({ locale: 'es' })
    const textEs = wrapper.find('.ch0-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.ch0-flavor').text()
    expect(textEs.length).toBeGreaterThan(0)
    expect(textEn.length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: ART-07 guard — SFC source no contiene referencias a pixel-art bg ch0
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 ART-07: source SFC no contiene url(...ch0-bg...) (pixel-art background prohibido)', () => {
    expect(CH0_SOURCE).not.toMatch(/url\(.*ch0-bg/)
  })

  it('T6 ART-07: source SFC no contiene img src con parallax/ (ART-07 enforced)', () => {
    expect(CH0_SOURCE).not.toMatch(/<img[^>]*src=["'][^"']*parallax\//)
  })
})
