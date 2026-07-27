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
//
// MEDIUM (ronda 2 de corrección de review): el patrón anterior sólo conocía
// la forma `overflow` u `overflow-y` — `overflow-x: auto` se le escapaba
// por completo. Por CSS Overflow Module: declarar `overflow-x: auto` fuerza
// el "used value" de `overflow-y` de `visible` a `auto` (la spec no permite
// que un eje sea scrolling y el otro visible), así que `overflow-x: auto`
// por sí solo YA crea un contenedor de scroll completo — el mismo bug que
// este lock existe para prevenir. Fix de un carácter: `(-y)?` → `(-[xy])?`.
//
// LOW (ronda 2, limitaciones aceptadas — un lock estático de texto fuente
// no puede cubrir todo, documentado en vez de perseguido):
//   - `overflow : auto` con espacio antes del colon (\s* sólo cubre después
//     del colon, no antes de `:`) — ningún caller del proyecto escribe CSS
//     así hoy; si apareciera, se le escapa a este lock.
//   - Propiedades lógicas `overflow-block` / `overflow-inline` (equivalentes
//     de `overflow-y`/`overflow-x` en modo lógico) — no están en el patrón.
//     Ningún archivo del proyecto las usa hoy.
//   - Estilos runtime/inline (`el.style.overflowY = 'auto'`, `:style="{...}"`)
//     — un lock que lee el .vue como texto fuente no puede ver JS que
//     construye estilos en tiempo de ejecución.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SCROLL_SHELL_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollShell.vue'),
  'utf8'
)
const APP_SRC = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

// Propiedad overflow, overflow-x u overflow-y con valor auto|scroll — el
// patrón que crea un contenedor con SU PROPIO scroll interno, compitiendo
// con el scroll-snap mandatory del `.scroll-shell` raíz. Cubre cuatro formas:
//   - longhand-y:          overflow-y: auto
//   - longhand-x:          overflow-x: auto (fuerza overflow-y a auto, ver arriba)
//   - shorthand 1 valor:   overflow: auto        (aplica a ambos ejes)
//   - shorthand 2 valores: overflow: hidden auto (overflow-x hidden, overflow-y auto)
// El grupo opcional `(?:[a-z-]+\s+)?` consume el primer valor del shorthand
// de 2 valores cuando está presente; para longhand/shorthand de 1 valor
// simplemente no matchea nada ahí y cae directo al valor final.
const NESTED_SCROLL_PATTERN = /\boverflow(-[xy])?:\s*(?:[a-z-]+\s+)?(auto|scroll)\b/gi

function stripComments(src) {
  return src
    // Bloques /* ... */ (CSS y JS)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Comentarios HTML <!-- ... -->
    .replace(/<!--[\s\S]*?-->/g, '')
    // Líneas // ... (JS) — conserva el resto de la línea antes del //.
    // LOW (ronda 2): un `//` sin más no es siempre un comentario JS — puede
    // ser el separador de esquema de una URL (`url(http://...)`,
    // `https://...` en un comentario o string). Strippear ciegamente desde
    // ahí se comería cualquier declaración real que siguiera en la MISMA
    // línea después de la URL. El lookbehind negativo `(?<!:)` excluye el
    // `//` que viene inmediatamente después de `:` (el de `http://` /
    // `https://`) — sigue permitiendo strippear un `//` de comentario real
    // más adelante en esa misma línea, si lo hay.
    // LOW (cierre ronda 3): `(?<!:)` sólo cubre URLs con esquema explícito
    // (`http://`). Una URL protocol-relative (`url(//cdn.x/a.png)`) NO lleva
    // `:` antes de `//`, así que el lookbehind no la protege y el strip se
    // come cualquier declaración real que siga en la misma línea (falso
    // negativo confirmado: `background: url(//cdn.x.com/a.png); overflow-y:
    // auto;` → el lock devolvía null). El segundo lookbehind `(?<!url\()`
    // cubre ese caso: excluye también el `//` que viene inmediatamente
    // después de `url(`, sin requerir esquema.
    .replace(/(?<!:)(?<!url\()\/\/.*$/gm, '')
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

  // MEDIUM (ronda 2) — prueba roja/verde de que el patrón AHORA cubre
  // `overflow-x: auto` solo, sin acompañamiento de overflow-y explícito.
  // Antes de este fix, `NESTED_SCROLL_PATTERN` con `(-y)?` no matcheaba
  // "-x" en absoluto (se puede confirmar revirtiendo a `(-y)?`: este test
  // pasa a rojo). Por CSS Overflow Module, `overflow-x: auto` fuerza el
  // used value de overflow-y de visible a auto — crea scroll container
  // igual que la forma -y directa.
  it('MEDIUM ronda 2 fix: el patrón detecta "overflow-x: auto" (fuerza overflow-y:auto por spec)', () => {
    const css = '.some-wrapper { overflow-x: auto; }'
    expect(
      css.match(NESTED_SCROLL_PATTERN),
      '"overflow-x: auto" fuerza el used value de overflow-y a auto (CSS Overflow Module) y debe ' +
        'ser detectado como scroll anidado — antes del fix (-y)? no cubría "-x" en absoluto.'
    ).not.toBeNull()
  })

  // LOW (ronda 2) — prueba de que el strip de `//` ya no se come una
  // declaración real que siga a una URL (`url(http://...)`) en la misma
  // línea. Antes del lookbehind `(?<!:)`, el `//` de `http://` disparaba el
  // strip y todo lo que seguía en la línea (incluida la declaración
  // overflow real) desaparecía ANTES de llegar al scan — falso NEGATIVO
  // (se puede confirmar revirtiendo a `.replace(/\/\/.*$/gm, '')`: este
  // test pasa a rojo porque la declaración deja de detectarse).
  it('LOW ronda 2 fix: una URL con "//" en la misma línea no se come la declaración overflow que la sigue', () => {
    const css = '.some-wrapper { background: url(http://example.com/img.png); overflow-y: auto; }'
    expect(
      scanForNestedScroll(css),
      'El strip de comentarios `//` se comió la declaración "overflow-y: auto" que seguía a la ' +
        'URL en la misma línea — falso negativo del lock.'
    ).not.toBeNull()
  })

  // LOW (cierre ronda 3) — misma clase de falso negativo que el test de
  // arriba, pero para una URL protocol-relative (`url(//cdn.x/a.png)`, sin
  // esquema `http:`), que el lookbehind `(?<!:)` por sí solo no cubre porque
  // no hay `:` antes del `//`. Antes del segundo lookbehind `(?<!url\()`
  // este test pasa a rojo (se puede confirmar revirtiendo el regex a
  // `(?<!:)\/\/.*$/gm`): el strip se come "overflow-y: auto" completa.
  it('LOW ronda 3 fix: una URL protocol-relative "url(//...)" en la misma línea no se come la declaración overflow que la sigue', () => {
    const css = '.some-wrapper { background: url(//cdn.x.com/a.png); overflow-y: auto; }'
    expect(
      scanForNestedScroll(css),
      'El strip de comentarios `//` se comió la declaración "overflow-y: auto" que seguía a una ' +
        'URL protocol-relative (sin esquema `http:`) en la misma línea — falso negativo del lock.'
    ).not.toBeNull()
  })
})
