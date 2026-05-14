// tests/components/FloatingPanel.test.js
// Tests Plan 04-04 Task 3 — FloatingPanel.vue (glass holographic card AR/VR).
//
// Cobertura:
// - T1: slot renderiza
// - T2: title prop renderiza h3.floating-panel__title con texto
// - T3: sin title → <h3> NO existe (v-if)
// - T4: chapter-themes.css contiene [data-chapter="4"] .floating-panel block
// - T5: source contiene @supports backdrop-filter (feature detection)
// - T6: source contiene fallback rgba opaque OUTSIDE @supports (Pitfall 3)
// - T7: source contiene @media (max-width: 599px) con blur(6px) (mobile perf)

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import FloatingPanel from '@/components/FloatingPanel.vue'

const CSS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

function mountPanel({ title = '', slot = '<p>Content</p>' } = {}) {
  return mount(FloatingPanel, {
    props: { title },
    slots: { default: slot },
  })
}

describe('FloatingPanel.vue', () => {
  // ───────────────────────────────────────────────
  // T1: slot renderiza
  // ───────────────────────────────────────────────
  it('T1: slot default renderiza dentro del article', () => {
    const w = mountPanel({ slot: '<p class="content-test">Hello</p>' })
    expect(w.find('article.floating-panel').exists()).toBe(true)
    expect(w.find('p.content-test').exists()).toBe(true)
    expect(w.find('p.content-test').text()).toBe('Hello')
  })

  // ───────────────────────────────────────────────
  // T2: title prop → h3
  // ───────────────────────────────────────────────
  it('T2: prop title="My Panel" → <h3.floating-panel__title>My Panel</h3>', () => {
    const w = mountPanel({ title: 'My Panel' })
    const h3 = w.find('h3.floating-panel__title')
    expect(h3.exists()).toBe(true)
    expect(h3.text()).toBe('My Panel')
  })

  // ───────────────────────────────────────────────
  // T3: sin title → <h3> NO existe (v-if)
  // ───────────────────────────────────────────────
  it('T3: sin prop title (default empty) → h3 NO existe (v-if)', () => {
    const w = mountPanel()
    expect(w.find('h3.floating-panel__title').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T4-T7: CSS source markers
  // ───────────────────────────────────────────────
  it('T4 CSS: chapter-themes.css contiene [data-chapter="4"] .floating-panel block', () => {
    expect(CSS_SOURCE).toMatch(/\[data-chapter=["']4["']\]\s+\.floating-panel\s*\{/)
  })

  it('T5 CSS: contiene @supports backdrop-filter (feature detection Pitfall 3)', () => {
    expect(CSS_SOURCE).toMatch(/@supports\s*\(\s*\(?backdrop-filter:\s*blur\(/)
  })

  it('T6 CSS: contiene fallback rgba(10, 15, 46, 0.4) OUTSIDE @supports (Pitfall 3)', () => {
    // El fallback es el bloque BASE [data-chapter="4"] .floating-panel sin nest
    const baseBlock = CSS_SOURCE.match(
      /\[data-chapter=["']4["']\]\s+\.floating-panel\s*\{[^}]*\}/s
    )
    expect(baseBlock).toBeTruthy()
    expect(baseBlock[0]).toMatch(/background-color:\s*rgba\(10,\s*15,\s*46,\s*0\.4\)/)
  })

  it('T7 CSS: contiene @media (max-width: 599px) con blur(6px) (mobile perf budget)', () => {
    expect(CSS_SOURCE).toMatch(
      /@media\s*\(max-width:\s*599px\)[\s\S]*?backdrop-filter:\s*blur\(6px\)/
    )
  })
})
