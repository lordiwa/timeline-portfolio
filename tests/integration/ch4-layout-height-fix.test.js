// tests/integration/ch4-layout-height-fix.test.js
// TASK-010 — regression lock del defecto de layout (spec §8, AC5/AC10):
// `.ch4-panel-column` medía 887px dentro de un viewport de 791px porque
// `margin-top: 20vh` fijo + `overflow-y: auto` SIN ninguna cota de altura
// dejaba crecer el flex item a su contenido intrínseco, desbordando
// `.ch4-layout` (overflow:clip recortaba el final, inalcanzable).
//
// Por qué getComputedStyle y no solo un regex de texto fuente (lección de
// esta sesión: jsdom no hace layout, pero SÍ resuelve cascada — un regex es
// ciego a qué regla GANA si hay varias con el mismo selector; acá no hay
// conflicto de especificidad como en el HIGH de TASK-014, pero igual
// verificamos contra el CSS scoped REAL compilado con @vue/compiler-sfc — el
// mismo compilador que usa Vite — en vez de una copia a mano del selector,
// siguiendo el patrón sancionado de
// tests/integration/scroll-shell-safeguard-specificity.test.js).
//
// Rojo si se revierte el fix: con `margin-top: 20vh;` y sin `max-height` (el
// estado pre-TASK-010), `getComputedStyle(...).maxHeight` es `'none'` — la
// cota que este lock exige deja de existir y el test T1 de abajo falla.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, compileStyle } from '@vue/compiler-sfc'

const CH4_PATH = resolve(process.cwd(), 'src/components/Chapter4Content.vue')
const SCOPE_ID = 'data-v-task010test'

function compileCh4Css() {
  const source = readFileSync(CH4_PATH, 'utf8')
  const { descriptor, errors } = parse(source, { filename: 'Chapter4Content.vue' })
  expect(errors, 'parse() de @vue/compiler-sfc reportó errores sobre Chapter4Content.vue').toHaveLength(0)

  const scopedBlock = descriptor.styles.find((s) => s.scoped)
  expect(scopedBlock, 'no se encontró un <style scoped> en Chapter4Content.vue').toBeDefined()

  const compiled = compileStyle({
    source: scopedBlock.content,
    filename: 'Chapter4Content.vue',
    id: SCOPE_ID,
    scoped: true,
  })
  expect(compiled.errors, 'compileStyle() reportó errores sobre el <style scoped> de Chapter4Content.vue').toHaveLength(0)
  return compiled.code
}

function mountStyled(css, className) {
  const styleEl = document.createElement('style')
  styleEl.textContent = css
  document.head.appendChild(styleEl)
  const el = document.createElement('div')
  el.className = className
  el.setAttribute(SCOPE_ID, '')
  document.body.appendChild(el)
  return { el, cleanup: () => { styleEl.remove(); el.remove() } }
}

describe('TASK-010 regression lock: fix del recorte de .ch4-panel-column (spec §8)', () => {
  it('T1 .ch4-panel-column tiene max-height acotado (no "none") — la cota que faltaba antes del fix', () => {
    const css = compileCh4Css()
    const { el, cleanup } = mountStyled(css, 'ch4-panel-column')
    try {
      const maxHeight = getComputedStyle(el).maxHeight
      expect(maxHeight, 'sin max-height acotado, el flex item vuelve a crecer sin cota (bug 887px/791px)').not.toBe('none')
      expect(maxHeight, 'max-height debe depender de calc() (respecto al alto real del viewport)').toMatch(/calc\(/)
    } finally {
      cleanup()
    }
  })

  it('T2 el literal roto "margin-top: 20vh" (sin cota) NO está presente en el source', () => {
    const source = readFileSync(CH4_PATH, 'utf8')
    expect(source).not.toMatch(/margin-top:\s*20vh\s*;/)
  })

  it('T3 .ch4-panel-column sigue con overflow-y:auto (scroll interno real, patrón sancionado ch0/ch1/ch4 — no el capítulo entero atrapado en scroll)', () => {
    const css = compileCh4Css()
    const { el, cleanup } = mountStyled(css, 'ch4-panel-column')
    try {
      expect(getComputedStyle(el).overflowY).toBe('auto')
    } finally {
      cleanup()
    }
  })

  // AC10 — lock del fallback de prefers-reduced-motion (NOTA, no test): vive
  // en tests/components/Ch4PortalShader.test.js T9 — Ch4PortalShader.vue
  // renderiza un frame estático (t=7.3, spec §10) bajo PRM en vez de quedar
  // vacío/negro. T9 es roja/verde plantable: revertir la llamada a
  // renderStaticFrame() hace que drawArrays deje de invocarse y el test cae.
})

describe('TASK-010 (última ronda) regression lock: .ch4-layout no desborda su contenedor por padding + content-box', () => {
  // jsdom no hace layout real: no puede medir que `.ch4-hud-bl`/`.ch4-hud-br`
  // queden dentro de `.chapter-section`. Ese es el comportamiento que importa
  // y SOLO se probó con Chrome real vía CDP (Emulation.setDeviceMetricsOverride
  // + getBoundingClientRect en los 3 viewports del ticket) — ver el reporte
  // del Developer para los números medidos antes/después. Lo que este test
  // SÍ puede lockear con honestidad es la causa raíz en la cascada CSS real
  // (compilada con @vue/compiler-sfc, no un regex sobre el texto fuente):
  // que `.ch4-layout` resuelva a `box-sizing: border-box`. Sin esto, `height:
  // 100%` (content-box, el default) más el padding vertical se suma ENCIMA
  // del 100% del contenedor y el excedente (96px desktop / 80px mobile) se
  // recorta de forma invisible e inalcanzable.
  it('T4 .ch4-layout resuelve a box-sizing: border-box en la cascada compilada', () => {
    const css = compileCh4Css()
    const { el, cleanup } = mountStyled(css, 'ch4-layout')
    try {
      expect(getComputedStyle(el).boxSizing).toBe('border-box')
    } finally {
      cleanup()
    }
  })
})
