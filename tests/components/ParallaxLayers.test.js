// tests/components/ParallaxLayers.test.js
// Tests Plan 04-04 Task 3 — ParallaxLayers.vue (4 capas depth-staggered).
//
// Cobertura:
// - T1: 4 .parallax-layer img elements con clases stars/planet/panels/ships
// - T2-T4: math localProgress + translateY factor escalonado
// - T5: PRM uniform factor (factor=1.0 todos los layers)
// - T6: aria-hidden=true (HUD decorativo)
// - T7: source contiene will-change: transform (compositor hint)
// - T8: source usa <img loading="lazy"> (Pitfall 7)
// - T9: source contiene inject('scrollState') + inject('prm')

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ParallaxLayers from '@/components/ParallaxLayers.vue'

const PARALLAX_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ParallaxLayers.vue'),
  'utf8'
)

function mountParallax({ scrollProgress = 0, prefersReduced = false } = {}) {
  const sp = ref(scrollProgress)
  const pr = ref(prefersReduced)
  const wrapper = mount(ParallaxLayers, {
    global: {
      provide: {
        scrollState: { scrollProgress: sp },
        prm: { prefersReduced: pr },
      },
    },
  })
  return { wrapper, sp, pr }
}

// Helper para extraer translateY value (vh) del style.transform attribute
function getTranslateY(img) {
  const style = img.attributes('style') || ''
  const m = style.match(/translateY\(([-\d.]+)vh\)/)
  return m ? parseFloat(m[1]) : null
}

describe('ParallaxLayers.vue', () => {
  // ───────────────────────────────────────────────
  // T1: DOM contract — 4 layers
  // ───────────────────────────────────────────────
  it('T1: renders 4 .parallax-layer img elements (stars/planet/panels/ships)', () => {
    const { wrapper } = mountParallax()
    const layers = wrapper.findAll('img.parallax-layer')
    expect(layers).toHaveLength(4)
    expect(wrapper.find('img.parallax-layer--stars').exists()).toBe(true)
    expect(wrapper.find('img.parallax-layer--planet').exists()).toBe(true)
    expect(wrapper.find('img.parallax-layer--panels').exists()).toBe(true)
    expect(wrapper.find('img.parallax-layer--ships').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T2: scrollProgress=0 → localProgress=0 → translateY = (0-0.5)*factor*100
  // stars (0.2): -10vh | planet (0.5): -25vh | panels (0.8): -40vh | ships (1.0): -50vh
  // ───────────────────────────────────────────────
  it('T2 math: scrollProgress=0 → localProgress=0 → factor escalonado por layer', () => {
    const { wrapper } = mountParallax({ scrollProgress: 0 })
    expect(getTranslateY(wrapper.find('.parallax-layer--stars'))).toBeCloseTo(-10, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--planet'))).toBeCloseTo(-25, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--panels'))).toBeCloseTo(-40, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--ships'))).toBeCloseTo(-50, 1)
  })

  // ───────────────────────────────────────────────
  // T3: scrollProgress=4.5/7 ≈ 0.643 → localProgress=0.5 → translateY=0 (centro)
  // ───────────────────────────────────────────────
  it('T3 math: scrollProgress centro de ch4 (4.5/7) → localProgress=0.5 → translateY≈0 todos', () => {
    const { wrapper } = mountParallax({ scrollProgress: 4.5 / 7 })
    // localProgress = 4.5 - 4 = 0.5; (0.5 - 0.5) * factor * 100 = 0
    ;['stars', 'planet', 'panels', 'ships'].forEach((name) => {
      expect(getTranslateY(wrapper.find(`.parallax-layer--${name}`))).toBeCloseTo(0, 1)
    })
  })

  // ───────────────────────────────────────────────
  // T4: scrollProgress=5/7 ≈ 0.714 → localProgress=1 → translateY positivo escalonado
  // ───────────────────────────────────────────────
  it('T4 math: scrollProgress=5/7 → localProgress=1 → translateY positivo escalonado', () => {
    const { wrapper } = mountParallax({ scrollProgress: 5 / 7 })
    expect(getTranslateY(wrapper.find('.parallax-layer--stars'))).toBeCloseTo(10, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--planet'))).toBeCloseTo(25, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--panels'))).toBeCloseTo(40, 1)
    expect(getTranslateY(wrapper.find('.parallax-layer--ships'))).toBeCloseTo(50, 1)
  })

  // ───────────────────────────────────────────────
  // T5: PRM=true → factor uniforme 1.0 → todos los layers mismo translateY
  // ───────────────────────────────────────────────
  it('T5 PRM: prefersReduced=true → factor uniforme 1.0 → todos los layers mismo translateY', () => {
    const { wrapper } = mountParallax({ scrollProgress: 0, prefersReduced: true })
    // localProgress=0, factor uniforme 1.0 → todos translateY -50vh
    const stars = getTranslateY(wrapper.find('.parallax-layer--stars'))
    const planet = getTranslateY(wrapper.find('.parallax-layer--planet'))
    const panels = getTranslateY(wrapper.find('.parallax-layer--panels'))
    const ships = getTranslateY(wrapper.find('.parallax-layer--ships'))
    expect(stars).toBeCloseTo(-50, 1)
    expect(planet).toBeCloseTo(stars, 1)
    expect(panels).toBeCloseTo(stars, 1)
    expect(ships).toBeCloseTo(stars, 1)
  })

  // ───────────────────────────────────────────────
  // T6: aria-hidden=true
  // ───────────────────────────────────────────────
  it('T6 a11y: .parallax-layers wrapper has aria-hidden="true"', () => {
    const { wrapper } = mountParallax()
    expect(wrapper.find('.parallax-layers').attributes('aria-hidden')).toBe('true')
  })

  // ───────────────────────────────────────────────
  // T7-T9: source markers
  // ───────────────────────────────────────────────
  it('T7 source: SFC contiene will-change: transform (compositor hint)', () => {
    expect(PARALLAX_SOURCE).toMatch(/will-change:\s*transform/)
  })

  it('T8 source: SFC usa loading="lazy" en <img> (Pitfall 7)', () => {
    expect(PARALLAX_SOURCE).toMatch(/loading="lazy"/)
  })

  it('T9 source: SFC contiene inject(\'scrollState\') e inject(\'prm\')', () => {
    expect(PARALLAX_SOURCE).toMatch(/inject\(['"]scrollState['"]\)/)
    expect(PARALLAX_SOURCE).toMatch(/inject\(['"]prm['"]\)/)
  })

  // ───────────────────────────────────────────────
  // T10 reactive: mutate scrollProgress → translateY actualiza
  // ───────────────────────────────────────────────
  it('T10 reactive: mutate scrollProgress → translateY actualiza sin re-mount', async () => {
    const { wrapper, sp } = mountParallax({ scrollProgress: 0 })
    const initial = getTranslateY(wrapper.find('.parallax-layer--ships'))
    expect(initial).toBeCloseTo(-50, 1)

    sp.value = 5 / 7
    await nextTick()
    const after = getTranslateY(wrapper.find('.parallax-layer--ships'))
    expect(after).toBeCloseTo(50, 1)
  })
})
