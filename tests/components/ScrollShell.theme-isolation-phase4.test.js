// tests/components/ScrollShell.theme-isolation-phase4.test.js
// Plan 04-06 Task 2 — Mount-based integration: verifica que parallax/scroll-reveal
// están contenidos en sus sections respectivas durante mount-time render.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ScrollShell from '@/components/ScrollShell.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Phase 5 W3 (Plan 05-04): ScrollShell ahora monta Chapter6Content para data-chapter=6.
// Chapter6Content hace `await import('@/phaser')` lazy cuando activeChapter===6 (PHA-04).
// En jsdom, cargar Phaser real crashea por canvas API faltante — mockear el factory.
vi.mock('@/phaser', () => ({
  createGame: vi.fn(() => ({
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    scale: { zoom: 3, setZoom: vi.fn() },
    destroy: vi.fn(),
  })),
}))

function mountShell({ initialChapter = 3 } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(false)
  const scrollProgress = ref(initialChapter / 7)
  const scrollToChapter = vi.fn()
  const i18n = createTestI18n({ locale: 'es' })
  return mount(ScrollShell, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress, scrollToChapter },
        prm: { prefersReduced },
        bgMorph: {
          layerA: { chapter: ref(initialChapter), opacity: ref(1) },
          layerB: { chapter: ref(initialChapter), opacity: ref(0) },
        },
      },
    },
  })
}

describe('ScrollShell theme isolation — Phase 4 cross-chapter', () => {
  // T1: full mount renderea 7 sections
  it('T1: ScrollShell renderea 7 sections data-chapter 0..6', () => {
    const wrapper = mountShell()
    const sections = wrapper.findAll('section.chapter-section')
    expect(sections).toHaveLength(7)
  })

  // T2: section ch4 contiene .parallax-layers (Chapter4Content embebe ParallaxLayers)
  it('T2: section[data-chapter="4"] contiene .parallax-layers', () => {
    const wrapper = mountShell()
    const ch4 = wrapper.find('section[data-chapter="4"]')
    expect(ch4.find('.parallax-layers').exists()).toBe(true)
  })

  // T3: section ch3 NO contiene .parallax-layers (Chapter3Content sin parallax)
  it('T3: section[data-chapter="3"] NO contiene .parallax-layers (no theme bleed ch4→ch3)', () => {
    const wrapper = mountShell()
    const ch3 = wrapper.find('section[data-chapter="3"]')
    expect(ch3.find('.parallax-layers').exists()).toBe(false)
  })

  // T4: section ch5 contiene .scroll-reveal-card (header reveal card al menos)
  it('T4: section[data-chapter="5"] contiene .scroll-reveal-card', () => {
    const wrapper = mountShell()
    const ch5 = wrapper.find('section[data-chapter="5"]')
    expect(ch5.find('.scroll-reveal-card').exists()).toBe(true)
  })

  // T5: section ch4 NO contiene .scroll-reveal-card (Chapter4Content sin reveal)
  it('T5: section[data-chapter="4"] NO contiene .scroll-reveal-card (no theme bleed ch5→ch4)', () => {
    const wrapper = mountShell()
    const ch4 = wrapper.find('section[data-chapter="4"]')
    expect(ch4.find('.scroll-reveal-card').exists()).toBe(false)
  })

  // T6: section ch6 monta Chapter6Content (Phase 5 W3 — Plan 05-04 wire)
  // Antes de Phase 5 W3: .chapter-placeholder visible. Post-wire: .ch6-layout
  // renderizado por Chapter6Content; el placeholder queda como dead-branch defensive.
  it('T6: section[data-chapter="6"] monta Chapter6Content (no .chapter-placeholder, Phase 5 W3)', () => {
    const wrapper = mountShell()
    const ch6 = wrapper.find('section[data-chapter="6"]')
    expect(ch6.find('.ch6-layout').exists()).toBe(true)
    expect(ch6.find('.chapter-placeholder').exists()).toBe(false)
  })
})
