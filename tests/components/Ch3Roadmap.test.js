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
//
// TASK-024 (calibración de posición: horizontal, arriba, centrado, más
// visible — ver tasks/TASK-024.json y el comentario grande del <script>/
// <style> de Ch3Roadmap.vue):
// - T8/T9: roving focus con ←/→ (AC#6, coherencia de eje con la nueva
//   orientación horizontal) — mueve el foco DOM entre botones adyacentes,
//   con wrap en ambos extremos, sin disparar 'navigate' (Enter/Space sigue
//   siendo la única forma de activar).
// - T10: ↑/↓ NO se interceptan localmente (siguen libres para burbujear al
//   handler global de ScrollShell.vue, fuera de la lista blanca de este
//   ticket) — regression lock de que el nuevo handler es específico de
//   ←/→ y no un catch-all de flechas.
// - T11 REGRESSION LOCK (geometría, jsdom no hace layout — Lección 2 de
//   .planning/LECCIONES-TECNICAS.md): compila el `<style scoped>` REAL con
//   @vue/compiler-sfc (patrón sancionado de
//   tests/integration/scroll-shell-safeguard-specificity.test.js) y verifica
//   con getComputedStyle() la cascada real (no un regex sobre texto) de las
//   propiedades que jsdom SÍ resuelve sin layout (literales, sin calc()):
//   position:fixed, centrado por caja (left/right/width), bottom:auto (NUNCA
//   vuelve el anclaje inferior de la variante mobile de TASK-021) y
//   flex-direction:row en la lista (SIEMPRE horizontal, nunca vuelve la
//   columna vertical del rail original). El offset `top` en sí depende de
//   var()/calc() sin resolver en jsdom (confirmado: jsdom devuelve el texto
//   `calc(...)` literal, no un píxel calculado) — se lockea con un match de
//   string exacto sobre esa fórmula, y la prueba de que el offset real
//   despeja a los 4 ocupantes del chasis (ContactHUD/LangToggle/GlobalMantra/
//   StickyTimeline) es GEOMÉTRICA en Chrome real (CDP), reportada en la
//   tabla de rects del hand-off de TASK-024 — jsdom no puede probar eso, y
//   este comentario lo declara explícito en vez de fingir cobertura que no
//   existe (regla del dispatch de este ticket).

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, compileStyle } from '@vue/compiler-sfc'
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

  // ── TASK-024 T8-T10: roving focus ←/→, coherente con la nueva orientación
  // horizontal (AC#6) ──────────────────────────────────────────────────────
  it('T8 ArrowRight mueve el foco DOM al botón siguiente, con wrap al llegar al último', async () => {
    const { wrapper } = mountRoadmap({ currentIndex: 0 })
    const list = wrapper.find('.ch3-roadmap-list')
    const buttons = wrapper.findAll('.ch3-roadmap-dot').map((b) => b.element)
    document.body.appendChild(wrapper.element) // focus real requiere estar en el documento
    buttons[0].focus()
    expect(document.activeElement).toBe(buttons[0])

    await list.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[1])

    // wrap: del último (índice 7) vuelve al primero (índice 0)
    buttons[7].focus()
    await list.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(buttons[0])

    wrapper.element.remove()
  })

  it('T9 ArrowLeft mueve el foco DOM al botón anterior, con wrap al llegar al primero; no emite navigate', async () => {
    const { wrapper } = mountRoadmap({ currentIndex: 0 })
    const list = wrapper.find('.ch3-roadmap-list')
    const buttons = wrapper.findAll('.ch3-roadmap-dot').map((b) => b.element)
    document.body.appendChild(wrapper.element)
    buttons[3].focus()

    await list.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[2])

    // wrap: del primero (índice 0) vuelve al último (índice 7)
    buttons[0].focus()
    await list.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(buttons[7])

    // moverse con flechas NUNCA navega — sólo Enter/Space (semántica nativa
    // del <button>, sin cambios) o click disparan 'navigate'.
    expect(wrapper.emitted('navigate')).toBeUndefined()

    wrapper.element.remove()
  })

  it('T10 REGRESSION LOCK: ArrowUp/ArrowDown NO se interceptan localmente (siguen libres para el handler global de ScrollShell.vue)', async () => {
    const { wrapper } = mountRoadmap({ currentIndex: 0 })
    const list = wrapper.find('.ch3-roadmap-list')
    const buttons = wrapper.findAll('.ch3-roadmap-dot').map((b) => b.element)
    document.body.appendChild(wrapper.element)
    buttons[3].focus()

    await list.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement, 'ArrowUp no debe mover el foco dentro del roadmap').toBe(buttons[3])

    await list.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'ArrowDown no debe mover el foco dentro del roadmap').toBe(buttons[3])

    wrapper.element.remove()
  })

  // ── TASK-024 T11: geometría — cascada CSS real compilada, no regex ciego
  // a especificidad (Lección 4 de .planning/LECCIONES-TECNICAS.md) ────────
  describe('T11 REGRESSION LOCK: geometría horizontal/arriba/centrado en la cascada compilada real', () => {
    const SCOPE_ID = 'data-v-task024test'

    function compileRoadmapCss() {
      const { descriptor, errors } = parse(ROADMAP_SOURCE, { filename: 'Ch3Roadmap.vue' })
      expect(errors, 'parse() de @vue/compiler-sfc reportó errores sobre Ch3Roadmap.vue').toHaveLength(0)
      const scopedBlock = descriptor.styles.find((s) => s.scoped)
      expect(scopedBlock, 'no se encontró un <style scoped> en Ch3Roadmap.vue').toBeDefined()
      const compiled = compileStyle({
        source: scopedBlock.content,
        filename: 'Ch3Roadmap.vue',
        id: SCOPE_ID,
        scoped: true,
      })
      expect(compiled.errors, 'compileStyle() reportó errores sobre el <style scoped> de Ch3Roadmap.vue').toHaveLength(0)
      return compiled.code
    }

    function mountStyled(css, className) {
      const styleEl = document.createElement('style')
      styleEl.textContent = css
      document.head.appendChild(styleEl)
      const el = document.createElement('nav')
      el.className = className
      el.setAttribute(SCOPE_ID, '')
      document.body.appendChild(el)
      return { el, cleanup: () => { styleEl.remove(); el.remove() } }
    }

    it('.ch3-roadmap resuelve position:fixed, se centra por caja (left/right/width) y bottom:auto (nunca vuelve el anclaje inferior de la variante mobile de TASK-021)', () => {
      const css = compileRoadmapCss()
      const { el, cleanup } = mountStyled(css, 'ch3-roadmap')
      try {
        const cs = getComputedStyle(el)
        expect(cs.position).toBe('fixed')
        expect(cs.left).toBe('0px')
        expect(cs.right).toBe('0px')
        expect(cs.width).toBe('fit-content')
        expect(
          cs.bottom,
          'bottom:auto — si esto deja de ser "auto" volvió el anclaje inferior de la variante mobile de TASK-021 (retirada por TASK-024, "arriba de todo")'
        ).toBe('auto')
        expect(
          cs.top,
          'top debe seguir derivando de --inset-chapter-top (mismo token que usa .ch3-hero para despejar StickyAvatar) + --sp-sm, no un literal inventado aparte'
        ).toBe('calc(var(--inset-chapter-top) + var(--sp-sm))')
      } finally {
        cleanup()
      }
    })

    it('.ch3-roadmap-list resuelve flex-direction:row (SIEMPRE horizontal — nunca vuelve la columna vertical del rail original de TASK-021)', () => {
      const css = compileRoadmapCss()
      const { el, cleanup } = mountStyled(css, 'ch3-roadmap-list')
      try {
        expect(getComputedStyle(el).flexDirection).toBe('row')
      } finally {
        cleanup()
      }
    })

    it('ninguna regla declara `bottom:` en todo el <style scoped> (regression lock de más alto nivel: la variante mobile bottom-anchored de TASK-021 no puede reaparecer en NINGÚN breakpoint)', () => {
      const { descriptor } = parse(ROADMAP_SOURCE, { filename: 'Ch3Roadmap.vue' })
      const scopedBlock = descriptor.styles.find((s) => s.scoped)
      expect(scopedBlock.content).not.toMatch(/bottom\s*:/)
    })
  })
})
