// tests/components/Ch3Roadmap.test.js
// TASK-021 — Ch3Roadmap.vue (rail de pasos "paso a paso" de ch3, AC#3/AC#4/AC#5).
//
// Cobertura:
// - T1: renderiza un <button> por step, con numeral visible.
// - T2: aria-current="step" SOLO en el punto activo (currentIndex).
// - T3: click en un punto emite 'navigate' con su índice (AC#4, clickeable).
// - T4: cada botón expone un aria-label con paso/total/label vía i18n
//   (ch3.roadmap.stepAria) — no depende de leer el numeral visual (AC#5).
// - T5: role="status" aria-live="polite" existe y su texto cambia cuando
//   currentIndex cambia (AC#5, cambios de paso anunciados a lectores de
//   pantalla incluso sin click).
// - T6 REGRESSION LOCK: sin cubic-bezier con Y fuera de [0,1], sin
//   Inter/Cinzel/Lobster (mismo criterio que Chapter3Content.test.js T5,
//   extendido a este archivo nuevo).
// - T7: sin `outline: none` en el source (la trampa documentada en
//   .planning/LECCIONES-TECNICAS.md — el foco visible depende de NO pisar
//   el `:focus-visible` universal de App.vue).

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ch3Roadmap from '@/components/Ch3Roadmap.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

const STEPS = [
  { label: 'EL ADIÓS' },
  { label: 'INTRO' },
  { label: 'EL ENTIERRO' },
  { label: 'RECONSTRUIR' },
  { label: 'EL MÉTODO' },
  { label: 'LA FRONTERA' },
  { label: 'EL SALTO' },
  { label: 'CIERRE' },
]

function mountRoadmap({ locale = 'es', currentIndex = 0 } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Ch3Roadmap, {
    props: { steps: STEPS, currentIndex },
    global: { plugins: [i18n] },
  })
  return { wrapper, i18n }
}

const ROADMAP_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Ch3Roadmap.vue'),
  'utf8'
)

describe('Ch3Roadmap.vue (TASK-021)', () => {
  it('T1 renderiza un botón por step con su numeral (1-indexado)', () => {
    const { wrapper } = mountRoadmap()
    const buttons = wrapper.findAll('.ch3-roadmap-dot')
    expect(buttons.length).toBe(STEPS.length)
    buttons.forEach((btn, i) => {
      expect(btn.element.tagName).toBe('BUTTON')
      expect(btn.text()).toBe(String(i + 1))
    })
  })

  it('T2 aria-current="step" sólo en el punto currentIndex', () => {
    const { wrapper } = mountRoadmap({ currentIndex: 3 })
    const buttons = wrapper.findAll('.ch3-roadmap-dot')
    buttons.forEach((btn, i) => {
      expect(btn.attributes('aria-current')).toBe(i === 3 ? 'step' : undefined)
    })
  })

  it('T3 click en un punto emite navigate con su índice (AC#4)', async () => {
    const { wrapper } = mountRoadmap({ currentIndex: 0 })
    const buttons = wrapper.findAll('.ch3-roadmap-dot')
    await buttons[5].trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([[5]])
  })

  it('T4 aria-label de cada punto sigue el patrón "paso X de Y: label" (i18n ch3.roadmap.stepAria)', () => {
    const { wrapper } = mountRoadmap({ locale: 'es', currentIndex: 0 })
    const buttons = wrapper.findAll('.ch3-roadmap-dot')
    expect(buttons[2].attributes('aria-label')).toBe(`Paso 3 de ${STEPS.length}: EL ENTIERRO`)
  })

  it('T5 role="status" aria-live="polite" existe y su texto cambia con currentIndex', async () => {
    const { wrapper } = mountRoadmap({ locale: 'es', currentIndex: 0 })
    const status = wrapper.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.attributes('aria-live')).toBe('polite')
    const before = status.text()
    await wrapper.setProps({ currentIndex: 4 })
    expect(status.text()).not.toBe(before)
    expect(status.text()).toBe(`Paso 5 de ${STEPS.length}: EL MÉTODO`)
  })

  it('T6 REGRESSION LOCK: ningún cubic-bezier con Y fuera de [0,1]; sin Inter/Cinzel/Lobster', () => {
    const matches = [...ROADMAP_SOURCE.matchAll(/cubic-bezier\(([^)]+)\)/g)]
    for (const m of matches) {
      const [, y1, , y2] = m[1].split(',').map((n) => parseFloat(n.trim()))
      expect(y1).toBeGreaterThanOrEqual(0)
      expect(y1).toBeLessThanOrEqual(1)
      expect(y2).toBeGreaterThanOrEqual(0)
      expect(y2).toBeLessThanOrEqual(1)
    }
    expect(ROADMAP_SOURCE).not.toMatch(/Inter Variable/)
    expect(ROADMAP_SOURCE).not.toMatch(/Cinzel/)
    expect(ROADMAP_SOURCE).not.toMatch(/Lobster/)
  })

  it('T7 REGRESSION LOCK: sin `outline: none` en el source (trampa focus-visible documentada)', () => {
    expect(ROADMAP_SOURCE).not.toMatch(/outline:\s*none/)
  })
})
