// tests/integration/scroll-shell-safeguard-specificity.test.js
// TASK-014 — HIGH regression lock (ronda 2 de corrección de review, ver
// tasks/TASK-014.json comentario de la ronda 2): compila el `<style scoped>`
// REAL de ScrollShell.vue con `@vue/compiler-sfc` (el mismo compilador que
// usa Vite en build — no una copia a mano) e inyecta el CSS resultante en un
// `<style>` real de jsdom, para verificar con `getComputedStyle()` —cascada
// y especificidad reales, no un regex sobre texto fuente— que el safeguard
// `.chapter-section[data-viewports] > :not(.chapter-stage)` NO pisa la
// altura propia de `.chapter-stage` cuando es hijo DIRECTO de la sección (la
// topología que el contrato documentado declara obligatoria), y SÍ cubre un
// wrapper intermedio (la topología para la que el safeguard existe).
//
// POR QUÉ esta forma y no un regex de texto fuente: el HIGH de la ronda 2
// fue exactamente un bug de ESPECIFICIDAD de selectores CSS `scoped` de
// Vue — invisible para cualquier test que sólo compare substrings, porque
// esos tests no evalúan cascada. jsdom sí resuelve selectores complejos
// (combinadores, `:not()`, atributos) y aplica cascada + especificidad
// reales al calcular `getComputedStyle()` para propiedades que no requieren
// layout (como `height` con un valor de unidad literal — jsdom no hace
// layout, pero sí resuelve qué declaración gana la cascada). Confirmado
// manualmente antes de escribir este archivo: con
// `.a[data-x] > * { height:100% }` declarado ANTES de `.b { height:100dvh }`
// en el `<style>`, un elemento `.b` hijo directo de `.a[data-x]` mide
// `100%` en jsdom (la regla de mayor especificidad gana pase lo que pase el
// orden de declaración) — y con `.a[data-x] > :not(.b)` en su lugar, ese
// mismo elemento mide `100dvh` (la exclusión estructural de `:not()` saca al
// elemento del selector, no es una pelea de especificidad).
//
// NOTA sobre extracción del bloque scoped: parsear con una regex ingenua
// `/<style scoped>([\s\S]*?)<\/style>/` sobre el .vue crudo FALLA en este
// archivo específico — el bloque `<script setup>` de ScrollShell.vue tiene
// un comentario que contiene el literal `<style scoped>` en texto libre
// ("ver el comentario largo junto a ... en el <style scoped> de abajo"), así
// que la regex matchea desde ahí. Por eso este test usa `parse()` de
// `@vue/compiler-sfc` (el parser real de SFC, que entiende bloques de
// verdad) en vez de una regex — la misma clase de trampa textual que este
// HIGH ya demostró que existe en este archivo.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, compileStyle } from '@vue/compiler-sfc'

const SCROLL_SHELL_PATH = resolve(process.cwd(), 'src/components/ScrollShell.vue')
const SCOPE_ID = 'data-v-task014test'

function compileScrollShellCss() {
  const source = readFileSync(SCROLL_SHELL_PATH, 'utf8')
  const { descriptor, errors } = parse(source, { filename: 'ScrollShell.vue' })
  expect(errors, 'parse() de @vue/compiler-sfc reportó errores sobre ScrollShell.vue').toHaveLength(0)

  const scopedBlock = descriptor.styles.find((s) => s.scoped)
  const globalBlock = descriptor.styles.find((s) => !s.scoped)
  expect(scopedBlock, 'no se encontró un <style scoped> en ScrollShell.vue').toBeDefined()
  expect(globalBlock, 'no se encontró un <style> (global, sin scope) en ScrollShell.vue — ' +
    'ahí debe vivir .chapter-stage').toBeDefined()

  const compiled = compileStyle({
    source: scopedBlock.content,
    filename: 'ScrollShell.vue',
    id: SCOPE_ID,
    scoped: true,
  })
  expect(compiled.errors, 'compileStyle() reportó errores al compilar el <style scoped> real').toHaveLength(0)

  return compiled.code + '\n' + globalBlock.content
}

let styleEl

beforeEach(() => {
  styleEl = document.createElement('style')
  styleEl.textContent = compileScrollShellCss()
  document.head.appendChild(styleEl)
})

afterEach(() => {
  styleEl.remove()
  document.body.innerHTML = ''
})

describe('TASK-014 HIGH regression lock (ronda 2): el safeguard de altura no pisa .chapter-stage', () => {
  it('.chapter-stage como hijo DIRECTO de la sección conserva su height:100dvh propio (topología documentada obligatoria)', () => {
    document.body.innerHTML =
      `<section class="chapter-section" data-viewports="5" ${SCOPE_ID}>` +
      `<div class="chapter-stage" ${SCOPE_ID} id="target"></div>` +
      `</section>`

    const height = getComputedStyle(document.getElementById('target')).height
    expect(
      height,
      'ScrollShell.vue:contrato del punto 2 — .chapter-stage hijo directo de .chapter-section[data-viewports] ' +
        'debe conservar "100dvh" (su propia regla global sin scope). Si el safeguard scoped vuelve a ' +
        'ganarle por especificidad (ej. volviendo a `> *` sin excluir .chapter-stage), este valor cae a ' +
        '"100%" (N*100dvh heredado del padre) y el rango de anclaje del sticky queda en CERO — el bug de ' +
        'la ronda 2 de review de TASK-014.'
    ).toBe('100dvh')
  })

  it('un wrapper intermedio (no .chapter-stage) SÍ recibe height:100% del safeguard (topología para la que el safeguard existe)', () => {
    document.body.innerHTML =
      `<section class="chapter-section" data-viewports="5" ${SCOPE_ID}>` +
      `<div class="ch-wrapper" ${SCOPE_ID} id="wrapper">` +
      `<div class="chapter-stage" ${SCOPE_ID} id="target"></div>` +
      `</div></section>`

    const height = getComputedStyle(document.getElementById('wrapper')).height
    expect(
      height,
      'un wrapper intermedio que NO tiene la clase .chapter-stage debe recibir height:100% del ' +
        'safeguard (así hereda los N viewports de la sección) — si esto falla, la corrección del HIGH ' +
        'rompió el caso original para el que el safeguard fue escrito.'
    ).toBe('100%')
  })

  it('sanity: sin ninguna sección [data-viewports], .chapter-stage no cambia su comportamiento fuera del mecanismo', () => {
    // El safeguard sólo aplica dentro de `.chapter-section[data-viewports]`
    // — un `.chapter-stage` fuera de esa topología (hoy, ningún capítulo lo
    // usa) no debería verse afectado por esta regla en absoluto.
    document.body.innerHTML = `<div class="chapter-stage" id="target"></div>`
    expect(getComputedStyle(document.getElementById('target')).height).toBe('100dvh')
  })
})
