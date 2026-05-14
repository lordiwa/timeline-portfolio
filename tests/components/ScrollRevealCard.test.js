// tests/components/ScrollRevealCard.test.js
// Tests Plan 04-05 Task 3 — ScrollRevealCard.vue (IO-driven reveal animation).
//
// Cobertura T1-T9:
// - T1: slot renderiza dentro de div.scroll-reveal-card
// - T2: class default sin --revealed (initial opacity:0 invisible)
// - T3: PRM init=true → revealed desde mount (sin IO trigger)
// - T4: IO trigger isIntersecting=true → revealed (delay default 0)
// - T5: delay staggered 200ms → revealed solo tras advanceTimers
// - T6: source contiene useIntersectionObserver import (@vueuse/core)
// - T7: source contiene inject('prm') + isRevealed init = prefersReduced.value
// - T8: chapter-themes.css source contiene @media PRM block con opacity:1 transform:none
// - T9: chapter-themes.css source contiene transition opacity 300ms + transform 300ms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCROLL_REVEAL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollRevealCard.vue'),
  'utf8'
)
const CSS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

// Mock useIntersectionObserver para capturar callback y poder dispararlo manualmente.
let ioCallback = null
let ioStop = null
vi.mock('@vueuse/core', () => ({
  useIntersectionObserver: (el, cb) => {
    ioCallback = cb
    ioStop = vi.fn()
    return { stop: ioStop }
  },
}))

// Import después del mock
import ScrollRevealCard from '@/components/ScrollRevealCard.vue'

function mountCard({ initialPRM = false, threshold = 0.15, delay = 0, slot = '<p>Content</p>' } = {}) {
  return mount(ScrollRevealCard, {
    props: { threshold, delay },
    slots: { default: slot },
    global: {
      provide: {
        prm: { prefersReduced: ref(initialPRM) },
      },
    },
  })
}

beforeEach(() => {
  ioCallback = null
  ioStop = null
})

describe('ScrollRevealCard.vue', () => {
  // ───────────────────────────────────────────────
  // T1: slot renderiza
  // ───────────────────────────────────────────────
  it('T1: slot default renderiza dentro del div.scroll-reveal-card', () => {
    const w = mountCard({ slot: '<span class="test-content">Hi</span>' })
    expect(w.find('div.scroll-reveal-card').exists()).toBe(true)
    expect(w.find('span.test-content').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T2: default sin --revealed
  // ───────────────────────────────────────────────
  it('T2: mount default → .scroll-reveal-card sin --revealed (opacity:0 invisible)', () => {
    const w = mountCard()
    expect(w.find('.scroll-reveal-card').exists()).toBe(true)
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T3: PRM init → revealed desde mount
  // ───────────────────────────────────────────────
  it('T3 PRM defensive JS: initialPRM=true → .scroll-reveal-card--revealed desde mount', () => {
    const w = mountCard({ initialPRM: true })
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T4: IO trigger reveal (delay 0)
  // ───────────────────────────────────────────────
  it('T4: IO trigger isIntersecting=true (delay 0) → revealed inmediato + stop() called', async () => {
    const w = mountCard()
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(false)
    expect(ioCallback).toBeTruthy()

    // Simular IO callback fire
    ioCallback([{ isIntersecting: true }])
    // delay default = 0 → setTimeout(0) → resolve en próximo tick
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()

    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(true)
    expect(ioStop).toHaveBeenCalledTimes(1)
  })

  // ───────────────────────────────────────────────
  // T5: staggered delay 200ms
  // ───────────────────────────────────────────────
  it('T5 delay staggered: delay=200 → revealed solo tras 200ms', async () => {
    vi.useFakeTimers()
    const w = mountCard({ delay: 200 })
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(false)

    ioCallback([{ isIntersecting: true }])
    await nextTick()
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(false)

    vi.advanceTimersByTime(199)
    await nextTick()
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(false)

    vi.advanceTimersByTime(2)
    await nextTick()
    expect(w.find('.scroll-reveal-card--revealed').exists()).toBe(true)

    vi.useRealTimers()
  })

  // ───────────────────────────────────────────────
  // T6-T9: source markers
  // ───────────────────────────────────────────────
  it('T6 source: SFC contiene useIntersectionObserver import desde @vueuse/core', () => {
    expect(SCROLL_REVEAL_SOURCE).toMatch(
      /import\s*\{\s*useIntersectionObserver\s*\}\s*from\s*['"]@vueuse\/core['"]/
    )
  })

  it('T7 source: SFC contiene inject(\'prm\') + PRM defensive JS init', () => {
    expect(SCROLL_REVEAL_SOURCE).toMatch(/inject\(['"]prm['"]\)/)
    expect(SCROLL_REVEAL_SOURCE).toMatch(/isRevealed\s*=\s*ref\(prefersReduced\.value\)/)
  })

  it('T8 CSS: chapter-themes.css contiene @media PRM con opacity:1 transform:none (defensive double)', () => {
    // El bloque @media (prefers-reduced-motion: reduce) [data-chapter="5"] .scroll-reveal-card debe contener opacity:1 + transform:none
    const prmBlock = CSS_SOURCE.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\[data-chapter=["']5["']\]\s*\.scroll-reveal-card\s*\{[^}]*\}/
    )
    expect(prmBlock).toBeTruthy()
    expect(prmBlock[0]).toMatch(/opacity:\s*1/)
    expect(prmBlock[0]).toMatch(/transform:\s*none/)
  })

  it('T9 CSS: chapter-themes.css contiene transition opacity 300ms + transform 300ms (motion contract D-05)', () => {
    const baseBlock = CSS_SOURCE.match(
      /\[data-chapter=["']5["']\]\s+\.scroll-reveal-card\s*\{[^}]*\}/
    )
    expect(baseBlock).toBeTruthy()
    expect(baseBlock[0]).toMatch(/transition:[\s\S]*?opacity\s+300ms/)
    expect(baseBlock[0]).toMatch(/transition:[\s\S]*?transform\s+300ms/)
  })
})
