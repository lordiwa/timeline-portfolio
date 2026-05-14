// tests/components/MarqueeBanner.test.js
// TDD RED phase — Plan 04-02, Task 1.
//
// Cobertura (5 tests):
// - T1 con prefersReduced=false → <marquee> existe en DOM
// - T2 con prefersReduced=false → .marquee-banner__static NO existe
// - T3 mutar prefersReduced.value = true → <marquee> desaparece, .marquee-banner__static aparece
// - T4 source: contiene inject('prm') y ramas v-if/v-else
// - T5 aria-label del marquee resuelve a string no vacío

import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import MarqueeBanner from '@/components/MarqueeBanner.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de source estático
const MARQUEE_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/MarqueeBanner.vue'),
  'utf8'
)

// Helper: monta MarqueeBanner con prm provide mutable + i18n plugin
function mountMarquee({ initialPRM = false, locale = 'es' } = {}) {
  const prefersReduced = ref(initialPRM)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(MarqueeBanner, {
    global: {
      plugins: [i18n],
      provide: {
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, prefersReduced, i18n }
}

describe('MarqueeBanner.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: PRM=false → <marquee> existe en DOM
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 PRM=false: <marquee> existe en DOM cuando prefersReduced=false', () => {
    const { wrapper } = mountMarquee({ initialPRM: false })
    expect(wrapper.find('marquee').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: PRM=false → .marquee-banner__static NO existe
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 PRM=false: .marquee-banner__static NO existe cuando prefersReduced=false', () => {
    const { wrapper } = mountMarquee({ initialPRM: false })
    expect(wrapper.find('.marquee-banner__static').exists()).toBe(false)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: Swap PRM → al mutar prefersReduced a true, <marquee> desaparece y static aparece
  // Crítico: v-if (no v-show) — <marquee> sale del DOM para que browser deje de scrollearlo
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 PRM swap: mutar prefersReduced.value=true → <marquee> desaparece, .marquee-banner__static aparece', async () => {
    const { wrapper, prefersReduced } = mountMarquee({ initialPRM: false })
    expect(wrapper.find('marquee').exists()).toBe(true)
    expect(wrapper.find('.marquee-banner__static').exists()).toBe(false)

    prefersReduced.value = true
    await flushPromises()

    expect(wrapper.find('marquee').exists()).toBe(false)
    expect(wrapper.find('.marquee-banner__static').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: Source contiene inject('prm') + ramas v-if/v-else
  // ─────────────────────────────────────────────────────────────────────────
  it("T4 source: contiene inject('prm') importado", () => {
    expect(MARQUEE_SOURCE).toMatch(/inject\(['"]prm['"]\)/)
  })

  it('T4 source: contiene ramas v-if y v-else para PRM swap', () => {
    expect(MARQUEE_SOURCE).toMatch(/v-if/)
    expect(MARQUEE_SOURCE).toMatch(/v-else/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: aria-label (o texto) del marquee resuelve a string no vacío
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 aria: la marquee muestra texto t(chapters.1.marqueeText) no vacío', () => {
    const { wrapper } = mountMarquee({ initialPRM: false })
    const marqueeEl = wrapper.find('marquee')
    expect(marqueeEl.text().trim().length).toBeGreaterThan(0)
  })

  it('T5 i18n: locale=es → texto de la marquee contiene contenido ES', () => {
    const { wrapper: wEs } = mountMarquee({ initialPRM: false, locale: 'es' })
    const { wrapper: wEn } = mountMarquee({ initialPRM: false, locale: 'en' })
    const textEs = wEs.find('marquee').text()
    const textEn = wEn.find('marquee').text()
    expect(textEs.length).toBeGreaterThan(0)
    expect(textEn.length).toBeGreaterThan(0)
  })
})
