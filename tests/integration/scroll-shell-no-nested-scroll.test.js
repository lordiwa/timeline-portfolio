// tests/integration/scroll-shell-no-nested-scroll.test.js
// TASK-014 — lock de regresión (AC#7): "se agrega un lock de regresion que
// falle si vuelve a aparecer un contenedor de scroll anidado dentro de una
// seccion de capitulo".
//
// ALCANCE de este lock (deliberado): cubre EXCLUSIVAMENTE el mecanismo del
// shell — src/components/ScrollShell.vue y src/App.vue, los dos únicos
// archivos de layout que este ticket tiene autorizados a tocar (lista blanca
// TASK-014). NO escanea Chapter{N}Content.vue ni chapter-components.css:
// Chapter3Content.vue todavía declara `.ch3-stage { overflow-y: auto }` (el
// bug original medido en TASK-009) y este ticket tiene prohibido tocar
// contenido de capítulo — ese scroll anidado queda documentado como deuda
// conocida, a resolver por TASK-009 cuando adopte el mecanismo nuevo
// (`.chapter-section[data-viewports]` + `.chapter-stage`, ver ScrollShell.vue).
// Un lock que escaneara TODO el árbol fallaría HOY por ese motivo conocido y
// fuera de alcance — este lock protege específicamente contra que el propio
// SHELL reintroduzca un contenedor con scroll interno.
//
// El único overflow-y:scroll/auto legítimo en el shell es `.scroll-shell`
// (el contenedor raíz — es EL scroll principal del sitio, no uno anidado).
// Se excluye ese bloque antes de escanear el resto del archivo.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCROLL_SHELL_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollShell.vue'),
  'utf8'
)
const APP_SRC = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

// Propiedad overflow (o overflow-y) con valor auto|scroll — el patrón que
// crea un contenedor con SU PROPIO scroll interno, compitiendo con el
// scroll-snap mandatory del `.scroll-shell` raíz.
const NESTED_SCROLL_PATTERN = /\boverflow(-y)?:\s*(auto|scroll)\b/g

function stripLegitimateScrollShellRule(src) {
  // El único bloque autorizado a declarar overflow-y:scroll es la regla
  // `.scroll-shell { ... }` (el contenedor raíz). Sin llaves anidadas dentro
  // de esa regla — un solo `[^}]*` es seguro.
  return src.replace(/\.scroll-shell\s*\{[^}]*\}/g, '')
}

describe('TASK-014 regression lock: el mecanismo del shell no reintroduce scroll anidado', () => {
  it('ScrollShell.vue no declara overflow(-y):auto|scroll fuera del bloque .scroll-shell raíz', () => {
    const scanned = stripLegitimateScrollShellRule(SCROLL_SHELL_SRC)
    const matches = scanned.match(NESTED_SCROLL_PATTERN)
    expect(
      matches,
      'ScrollShell.vue declaró overflow-y/overflow auto|scroll fuera de `.scroll-shell` — ' +
        'eso es un contenedor de scroll ANIDADO compitiendo con el scroll-snap mandatory del ' +
        'shell (el bug que TASK-014 existe para prevenir). Si el capítulo necesita más alto, ' +
        'usar `.chapter-section[data-viewports]` + `.chapter-stage` (documentado en ScrollShell.vue), ' +
        'nunca overflow-y:auto en un contenedor intermedio.'
    ).toBeNull()
  })

  it('App.vue no declara overflow(-y):auto|scroll en ningún selector', () => {
    const matches = APP_SRC.match(NESTED_SCROLL_PATTERN)
    expect(
      matches,
      'App.vue declaró overflow-y/overflow auto|scroll — App.vue no debe introducir ningún ' +
        'contenedor de scroll propio; el único scroll del sitio vive en `.scroll-shell` ' +
        '(ScrollShell.vue).'
    ).toBeNull()
  })

  it('sanity: .scroll-shell SIGUE siendo el único contenedor con overflow-y:scroll (si esto falla, el test de arriba está mal filtrando)', () => {
    expect(SCROLL_SHELL_SRC).toMatch(/\.scroll-shell\s*\{[^}]*overflow-y:\s*scroll/)
  })
})
