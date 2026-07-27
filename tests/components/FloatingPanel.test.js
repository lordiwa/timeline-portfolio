// tests/components/FloatingPanel.test.js
// Tests Plan 04-04 Task 3 — FloatingPanel.vue (glass holographic card AR/VR).
//
// Cobertura:
// - T1: slot renderiza
// - T2: title prop renderiza h3.floating-panel__title con texto
// - T3: sin title → <h3> NO existe (v-if)
// - T4: Chapter4Content.vue contiene el selector .floating-panel (:deep) block
// - T5: source contiene @supports backdrop-filter (feature detection)
// - T6: source contiene el scrim reforzado OUTSIDE @supports (spec §9, TASK-010)
// - T7: source contiene backdrop-filter: blur(6px) (glass, spec §9)
//
// TASK-010: .floating-panel migró de src/styles/chapter-components.css (parada
// intermedia declarada por TASK-008, que no tenía autorizado tocar componentes
// de capítulo) a Chapter4Content.vue <style scoped> (selector
// `.ch4-layout :deep(.floating-panel)`) — ver comentario del orchestrator en
// tasks/TASK-010.json. El scrim también se reforzó (spec §9): el shader ya no
// es aditivo-sobre-negro, así que rgba(10,15,46,0.4) quedaba insuficiente
// contra el nuevo rango tonal del fondo (hasta luminancia 0.45) — sube a
// rgba(6,10,30,0.78) + blur(6px), fallback sin blur a 0.86.

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import FloatingPanel from '@/components/FloatingPanel.vue'

const CSS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter4Content.vue'),
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
  it('T4 CSS: Chapter4Content.vue contiene el selector .floating-panel (:deep) block', () => {
    expect(CSS_SOURCE).toMatch(/\.ch4-layout\s+:deep\(\.floating-panel\)\s*\{/)
  })

  it('T5 CSS: contiene @supports backdrop-filter (feature detection Pitfall 3)', () => {
    expect(CSS_SOURCE).toMatch(/@supports\s*\(\s*\(?backdrop-filter:\s*blur\(/)
  })

  it('T6 CSS: contiene el scrim reforzado rgba(6, 10, 30, 0.78) OUTSIDE @supports (spec §9)', () => {
    // El fallback es el bloque BASE .ch4-layout :deep(.floating-panel) sin nest
    const baseBlock = CSS_SOURCE.match(
      /\.ch4-layout\s+:deep\(\.floating-panel\)\s*\{[^}]*\}/s
    )
    expect(baseBlock).toBeTruthy()
    expect(baseBlock[0]).toMatch(/background-color:\s*rgba\(6,\s*10,\s*30,\s*0\.78\)/)
  })

  it('T7 CSS: contiene backdrop-filter: blur(6px) dentro de @supports (glass, spec §9)', () => {
    expect(CSS_SOURCE).toMatch(
      /@supports\s*\(\(backdrop-filter:\s*blur\(6px\)\)[\s\S]*?backdrop-filter:\s*blur\(6px\)/
    )
  })
})
