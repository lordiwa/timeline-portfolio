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
//
// MEDIUM (ronda de corrección de review): el regex original sólo cubría la
// forma longhand (`overflow-y: auto`) o el shorthand de UN valor
// (`overflow: auto`, que aplica el mismo valor a ambos ejes). Se le escapaba
// el shorthand de DOS valores `overflow: <x> <y>` — ej. `overflow: hidden
// auto` fija overflow-x:hidden pero TAMBIÉN overflow-y:auto, que es
// exactamente el contenedor de scroll anidado que este lock existe para
// prevenir, y pasaba desapercibido. Misma clase de bug que el test rojo
// histórico de BackgroundLayers (shorthand no cubierto por un regex que
// sólo conocía la forma longhand). El patrón nuevo cubre ambas formas.
//
// LOW (ronda de corrección de review): el regex también era sensible a
// comentarios CSS/JS que contuvieran el literal `overflow-y: auto` en texto
// libre (ScrollShell.vue tuvo que redactar sus propios comentarios como
// "overflow-y en modo auto" para esquivarlo). Se strippean comentarios
// ANTES de escanear para que el código fuente pueda usar el literal
// libremente en su documentación.

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
// scroll-snap mandatory del `.scroll-shell` raíz. Cubre tres formas:
//   - longhand:            overflow-y: auto
//   - shorthand 1 valor:   overflow: auto        (aplica a ambos ejes)
//   - shorthand 2 valores: overflow: hidden auto (overflow-x hidden, overflow-y auto)
// El grupo opcional `(?:[a-z-]+\s+)?` consume el primer valor del shorthand
// de 2 valores cuando está presente; para longhand/shorthand de 1 valor
// simplemente no matchea nada ahí y cae directo al valor final.
const NESTED_SCROLL_PATTERN = /\boverflow(-y)?:\s*(?:[a-z-]+\s+)?(auto|scroll)\b/gi

function stripComments(src) {
  return src
    // Bloques /* ... */ (CSS y JS)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Comentarios HTML <!-- ... -->
    .replace(/<!--[\s\S]*?-->/g, '')
    // Líneas // ... (JS) — conserva el resto de la línea antes del //
    .replace(/\/\/.*$/gm, '')
}

function stripLegitimateScrollShellRule(src) {
  // El único bloque autorizado a declarar overflow-y:scroll es la regla
  // `.scroll-shell { ... }` (el contenedor raíz). Sin llaves anidadas dentro
  // de esa regla — un solo `[^}]*` es seguro.
  return src.replace(/\.scroll-shell\s*\{[^}]*\}/g, '')
}

function scanForNestedScroll(src) {
  return stripLegitimateScrollShellRule(stripComments(src)).match(NESTED_SCROLL_PATTERN)
}

describe('TASK-014 regression lock: el mecanismo del shell no reintroduce scroll anidado', () => {
  it('ScrollShell.vue no declara overflow(-y):auto|scroll fuera del bloque .scroll-shell raíz', () => {
    const matches = scanForNestedScroll(SCROLL_SHELL_SRC)
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
    const matches = scanForNestedScroll(APP_SRC)
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

  // MEDIUM — prueba roja/verde de que el patrón AHORA cubre el shorthand de
  // dos valores. Antes de este fix, `NESTED_SCROLL_PATTERN` original NO
  // matcheaba este literal (se puede confirmar revirtiendo el regex a
  // `/\boverflow(-y)?:\s*(auto|scroll)\b/g` — este test pasa a rojo).
  it('MEDIUM fix: el patrón detecta el shorthand de 2 valores "overflow: hidden auto" (overflow-y:auto oculto)', () => {
    const css = '.some-wrapper { overflow: hidden auto; }'
    expect(
      css.match(NESTED_SCROLL_PATTERN),
      'El shorthand de 2 valores "overflow: hidden auto" fija overflow-y:auto y debe ser ' +
        'detectado como scroll anidado — antes del fix se le escapaba al regex.'
    ).not.toBeNull()
  })

  // LOW — prueba de que un comentario con el literal ya no genera falso positivo.
  it('LOW fix: un comentario CSS que contiene el literal "overflow-y: auto" NO cuenta como declaración real', () => {
    const css = '/* nota: antes usábamos overflow-y: auto acá, ya no */\n.foo { color: red; }'
    expect(scanForNestedScroll(css)).toBeNull()
  })
})
