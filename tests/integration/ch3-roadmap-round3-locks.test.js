// tests/integration/ch3-roadmap-round3-locks.test.js
// TASK-024 ronda 3 de review (MEDIUM: "los locks cubren la ronda 1, no la
// ronda 2/3") — un revert silencioso de cualquiera de los tres arreglos de
// la ronda 3 dejaba la suite verde antes de este archivo: el umbral de
// 767px acoplado entre Ch3Roadmap.vue y Chapter3Content.vue, la reserva de
// clearance separada de la compactación (con el brazo max-width agregado),
// y el material PRM (opacidad + pointer-events).
//
// jsdom NO evalúa @media (ver .planning/LECCIONES-TECNICAS.md §2 y el
// hand-off de esta ronda: se confirmó con un sandbox real que
// getComputedStyle nunca resuelve una regla dentro de un @media aunque
// window.innerHeight/matchMedia se fuercen — jsdom simplemente no tiene
// motor de layout/viewport para evaluar condiciones de media). Por eso
// estos locks son ESTRUCTURALES: parsean el CSS real con `postcss` (ya
// disponible transitivamente vía Vite, mismo criterio que este proyecto ya
// usa con `@vue/compiler-sfc` — ninguno es una dependencia directa nueva)
// y verifican qué declaraciones viven en qué @media, sin intentar resolver
// CASCADA (eso sí lo hace `getComputedStyle`, para las reglas base — ver
// tests/components/Ch3Roadmap.test.js T11). La prueba de que la condición
// correcta GANA en un viewport real vive en la verificación CDP del
// hand-off de esta ronda (script scripts/verify-ch3-roadmap-geometry.mjs),
// no acá — declarado explícito, no fingido.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'

const ROADMAP_PATH = resolve(process.cwd(), 'src/components/Ch3Roadmap.vue')
const CH3_PATH = resolve(process.cwd(), 'src/components/Chapter3Content.vue')

function styleRoot(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor, errors } = parse(source, { filename: filePath })
  expect(errors, `parse() de @vue/compiler-sfc reportó errores sobre ${filePath}`).toHaveLength(0)
  // Ambos archivos declaran un único <style> relevante para ch3 (Ch3Roadmap
  // es todo scoped; Chapter3Content tiene un único <style> global — ver el
  // comentario junto a `.ch3-beat` en ese archivo). Concatenar por si acaso
  // hubiera más de un bloque no cambia el resultado del parseo estructural.
  const css = descriptor.styles.map((s) => s.content).join('\n')
  return postcss.parse(css, { from: filePath })
}

function mediaAtRules(root, predicate) {
  const found = []
  root.walkAtRules('media', (atRule) => {
    if (predicate(atRule.params)) found.push(atRule)
  })
  return found
}

function declsIn(atRule, selectorSubstring) {
  const out = []
  atRule.walkDecls((decl) => {
    const sel = decl.parent && decl.parent.selector
    if (!selectorSubstring || (sel && sel.includes(selectorSubstring))) {
      out.push({ selector: sel, prop: decl.prop, value: decl.value })
    }
  })
  return out
}

describe('TASK-024 ronda 3 — lock del umbral 767px acoplado entre Ch3Roadmap.vue y Chapter3Content.vue', () => {
  it('el umbral de tamaño del rail (Ch3Roadmap.vue) y el umbral de RESERVA de clearance (Chapter3Content.vue) son el mismo número literal', () => {
    const roadmapRoot = styleRoot(ROADMAP_PATH)
    const ch3Root = styleRoot(CH3_PATH)

    // El rail compacta con `(max-width: 767px), (max-height: 767px)`.
    const roadmapSizeQuery = mediaAtRules(roadmapRoot, (params) => params.includes('max-width') && params.includes('max-height'))
    expect(roadmapSizeQuery, 'Ch3Roadmap.vue debería tener un @media que combine max-width y max-height para el tamaño compacto del rail').toHaveLength(1)
    const roadmapHeightMatch = roadmapSizeQuery[0].params.match(/max-height:\s*(\d+)px/)
    const roadmapWidthMatch = roadmapSizeQuery[0].params.match(/max-width:\s*(\d+)px/)
    expect(roadmapHeightMatch, 'no se encontró max-height en el @media de tamaño del rail').not.toBeNull()
    expect(roadmapWidthMatch, 'no se encontró max-width en el @media de tamaño del rail').not.toBeNull()

    // La reserva de contenido (`.ch3-slide`/`.ch3-act1-decor`) vive en un
    // @media que TAMBIÉN combina max-width y max-height (ronda 3: se le
    // agregó el brazo max-width para portrait — ver MEDIUM de esa ronda).
    const ch3ReserveQuery = mediaAtRules(ch3Root, (params) => params.includes('max-width') && params.includes('max-height'))
    expect(ch3ReserveQuery, 'Chapter3Content.vue debería tener un @media que combine max-width y max-height para la reserva de clearance').toHaveLength(1)
    const ch3HeightMatch = ch3ReserveQuery[0].params.match(/max-height:\s*(\d+)px/)
    const ch3WidthMatch = ch3ReserveQuery[0].params.match(/max-width:\s*(\d+)px/)
    expect(ch3HeightMatch, 'no se encontró max-height en el @media de reserva de Chapter3Content.vue').not.toBeNull()
    expect(ch3WidthMatch, 'no se encontró max-width en el @media de reserva de Chapter3Content.vue').not.toBeNull()

    expect(
      Number(ch3HeightMatch[1]),
      'el umbral de alto de la RESERVA (Chapter3Content.vue) debe ser IGUAL al umbral de tamaño del rail (Ch3Roadmap.vue) — el 74px de reserva asume el alto COMPACTO del rail; si se desalinean, hay un rango de alto donde el rail es compacto pero el contenido no reserva su clearance (o viceversa)'
    ).toBe(Number(roadmapHeightMatch[1]))
    expect(
      Number(ch3WidthMatch[1]),
      'el brazo max-width de la RESERVA debe ser igual al del rail — mismo razonamiento, para el caso portrait'
    ).toBe(Number(roadmapWidthMatch[1]))

    // La reserva contiene el padding-top real (no sólo el @media vacío).
    const reserveDecls = declsIn(ch3ReserveQuery[0], '.ch3-slide')
    expect(
      reserveDecls.some((d) => d.prop === 'padding-top' && /calc\(/.test(d.value)),
      '.ch3-slide dentro del @media de reserva debe declarar padding-top con calc() — si desaparece, la reserva de clearance deja de existir'
    ).toBe(true)

    // REGRESSION LOCK (HIGH ronda 4, hallazgo propio al correr el harness
    // con el nuevo umbral 800x525): `.ch3-act1-title` es hermano de
    // `.ch3-act1-decor` dentro de `.ch3-act1-scene`, no su hijo — reservar
    // clearance sólo en `.ch3-act1-decor` nunca movía el título, que
    // seguía centrado por `.ch3-act1-scene` sin ninguna reserva. Medido
    // con CDP real: a 800x525 el título solapaba el rail (y=[127,179] vs
    // rail y=[120,186]).
    const sceneDecls = declsIn(ch3ReserveQuery[0], '.ch3-act1-scene')
    expect(
      sceneDecls.some((d) => d.prop === 'padding-top' && /calc\(/.test(d.value)),
      'REGRESSION LOCK (HIGH ronda 4): .ch3-act1-scene dentro del @media de reserva debe declarar padding-top con calc() — sin esto, .ch3-act1-title (su único hijo en flujo normal) vuelve a centrarse sin reserva y puede solapar el rail en anchos angostos'
    ).toBe(true)
    expect(
      sceneDecls.some((d) => d.prop === 'align-items' && d.value.trim() === 'flex-start'),
      'REGRESSION LOCK (HIGH ronda 4): .ch3-act1-scene debe declarar align-items:flex-start — sin esto el padding-top sólo empuja el título la MITAD (misma álgebra que .ch3-act1-decor/.ch3-slide, ver esos comentarios)'
    ).toBe(true)
  })

  it('la compactación vive en TRES bandas distintas — reserva (767px) > compactación del Acto 1 (735px) > compactación del Acto 2 (525px) — ninguna igual ni invertida', () => {
    const ch3Root = styleRoot(CH3_PATH)
    const reserveQuery = mediaAtRules(ch3Root, (params) => params.includes('max-width') && params.includes('max-height'))[0]
    // Ambas compactaciones (Acto 1 y Acto 2) son SÓLO por altura (ver el
    // comentario del código: "NO lleva el brazo max-width" en ambos casos).
    const compactQueries = mediaAtRules(ch3Root, (params) => /^\(max-height:\s*\d+px\)$/.test(params.trim()))
    expect(
      compactQueries,
      'REGRESSION LOCK (HIGH ronda 4): debería haber exactamente DOS @media (max-height:...) de compactación sin brazo max-width — uno para el Acto 1, otro para el Acto 2. Si vuelve a haber sólo uno, la ronda 4 (desacoplar Acto 1 de Acto 2) se revirtió.'
    ).toHaveLength(2)

    const heights = compactQueries
      .map((q) => Number(q.params.match(/max-height:\s*(\d+)px/)[1]))
      .sort((a, b) => a - b)
    const [act2Height, act1Height] = heights // el menor es el del Acto 2
    const reserveHeight = Number(reserveQuery.params.match(/max-height:\s*(\d+)px/)[1])

    expect(
      act1Height,
      'REGRESSION LOCK (HIGH ronda 3): el umbral de compactación del Acto 1 debe ser ESTRICTAMENTE menor al de reserva'
    ).toBeLessThan(reserveHeight)
    expect(
      act2Height,
      'REGRESSION LOCK (HIGH ronda 4): el umbral de compactación del Acto 2 debe ser ESTRICTAMENTE menor al del Acto 1 — si vuelven a ser iguales, el Acto 2 vuelve a compactarse en todo el rango que sólo necesita el Acto 1 (el HIGH exacto de la ronda 4: el caso 1366x768-con-barra, ~630-660px reales, caía dentro de 735 igual).'
    ).toBeLessThan(act1Height)

    // Identificar cuál @media es cuál por su contenido (el del Acto 1 toca
    // .ch3-flash-stage; el del Acto 2 toca .ch3-hero-title).
    const act1Query = compactQueries.find((q) => declsIn(q, '.ch3-flash-stage').length > 0)
    const act2Query = compactQueries.find((q) => declsIn(q, '.ch3-hero-title').length > 0)
    expect(act1Query, 'no se encontró el @media de compactación del Acto 1 (debería tocar .ch3-flash-stage)').toBeDefined()
    expect(act2Query, 'no se encontró el @media de compactación del Acto 2 (debería tocar .ch3-hero-title)').toBeDefined()
    expect(
      Number(act1Query.params.match(/max-height:\s*(\d+)px/)[1]),
      'el @media que toca .ch3-flash-stage (Acto 1) debe ser el de umbral MAYOR — si el Acto 2 quedara con el umbral más alto, la tipografía del hero/beats se compactaría de más'
    ).toBe(act1Height)

    // La compactación de verdad reduce tipografía del Acto 2 (no es un
    // bloque vacío).
    const heroTitleDecls = declsIn(act2Query, '.ch3-hero-title')
    expect(
      heroTitleDecls.some((d) => d.prop === 'font-size'),
      '.ch3-hero-title debería tener un font-size compactado dentro de su propio @media angosto'
    ).toBe(true)

    // REGRESSION LOCK explícito (ronda 4, pedido del reviewer): la
    // tipografía del Acto 2 NO puede volver a aparecer dentro del @media
    // del Acto 1 (735px) — es literalmente la regresión que este ticket
    // vino a arreglar dos veces (rondas 3 y 4).
    const act1HeroTitle = declsIn(act1Query, '.ch3-hero-title')
    expect(
      act1HeroTitle.some((d) => d.prop === 'font-size'),
      'REGRESSION LOCK (HIGH ronda 4): .ch3-hero-title NO debe tener font-size dentro del @media del Acto 1 (735px) — si reaparece ahí, la tipografía del Acto 2 vuelve a compactarse en escritorios apenas bajos (1366x768 con barra ⇒ ~630-660px) que no lo necesitan.'
    ).toBe(false)
    const act1BeatLead = declsIn(act1Query, '.ch3-beat-lead')
    expect(
      act1BeatLead.some((d) => d.prop === 'font-size'),
      'REGRESSION LOCK (HIGH ronda 4): .ch3-beat-lead NO debe tener font-size dentro del @media del Acto 1 — mismo motivo'
    ).toBe(false)

    // Y ninguna de las dos compactaciones está también dentro del @media de
    // reserva (si lo estuvieran, seguiría aplicando en toda la banda ancha).
    const reserveHeroTitle = declsIn(reserveQuery, '.ch3-hero-title')
    expect(
      reserveHeroTitle.some((d) => d.prop === 'font-size'),
      '.ch3-hero-title NO debería tener font-size dentro del @media de RESERVA'
    ).toBe(false)
    const reserveFlashStage = declsIn(reserveQuery, '.ch3-flash-stage')
    expect(
      reserveFlashStage.some((d) => d.prop === 'width'),
      '.ch3-flash-stage NO debería tener su width compactado dentro del @media de RESERVA'
    ).toBe(false)
  })

  it('el brazo `max-width` de la reserva existe (ronda 3, MEDIUM: portrait 390x844 sin reserva)', () => {
    const ch3Root = styleRoot(CH3_PATH)
    const reserveQuery = mediaAtRules(ch3Root, (params) => params.includes('max-width') && params.includes('max-height'))[0]
    expect(reserveQuery, 'no se encontró el @media de reserva').toBeDefined()
  })
})

describe('TASK-024 ronda 3/4 — lock del tap target de los ghost buttons compactos (WCAG 2.5.8)', () => {
  it('los ghost buttons compactados (hero y beat, dentro del @media del Acto 2 — ronda 4 los separó del Acto 1) declaran min-height: 24px', () => {
    const ch3Root = styleRoot(CH3_PATH)
    // El Acto 2 es el @media (max-height:...) que toca .ch3-hero-title —
    // ver el lock de arriba, mismo criterio de identificación (no asumir
    // orden ni cuál de los dos es cuál por posición).
    const compactQueries = mediaAtRules(ch3Root, (params) => /^\(max-height:\s*\d+px\)$/.test(params.trim()))
    const act2Query = compactQueries.find((q) => declsIn(q, '.ch3-hero-title').length > 0)
    expect(act2Query, 'no se encontró el @media de compactación del Acto 2').toBeDefined()
    const heroBtn = declsIn(act2Query, '.ch3-hero .ch3-ghost-btn')
    const beatBtn = declsIn(act2Query, '.ch3-beat .ch3-ghost-btn')
    expect(
      heroBtn.some((d) => d.prop === 'min-height' && d.value.trim() === '24px'),
      'REGRESSION LOCK (MEDIUM ronda 3): .ch3-hero .ch3-ghost-btn debe declarar min-height:24px dentro del bloque compacto del Acto 2 — sin esto el target cae a ~16-20px, bajo el mínimo WCAG 2.5.8'
    ).toBe(true)
    expect(
      beatBtn.some((d) => d.prop === 'min-height' && d.value.trim() === '24px'),
      'REGRESSION LOCK (MEDIUM ronda 3): .ch3-beat .ch3-ghost-btn ("Seguir leyendo", destape de la narrativa spec §8) debe declarar min-height:24px dentro del bloque compacto del Acto 2'
    ).toBe(true)
  })
})

describe('TASK-024 ronda 3 — lock del material PRM (MEDIUM: opacidad tapaba contenido + contraste del caption)', () => {
  it('.ch3-roadmap bajo PRM usa pointer-events:none y una mezcla de --c-surface de AL MENOS 70% (contraste AA sobre el Acto 1 oscuro)', () => {
    const roadmapRoot = styleRoot(ROADMAP_PATH)
    const prmQuery = mediaAtRules(roadmapRoot, (params) => params.includes('prefers-reduced-motion'))
    expect(prmQuery, 'debería existir un único @media (prefers-reduced-motion: reduce)').toHaveLength(1)
    const roadmapDecls = declsIn(prmQuery[0], '.ch3-roadmap')
      .filter((d) => d.selector === '.ch3-roadmap') // excluye .ch3-roadmap-dot, selector exacto
    const pointerEvents = roadmapDecls.find((d) => d.prop === 'pointer-events')
    expect(
      pointerEvents && pointerEvents.value.trim() === 'none',
      'REGRESSION LOCK (MEDIUM ronda 2): .ch3-roadmap debe declarar pointer-events:none bajo PRM — si desaparece, los clicks vuelven a quedar atrapados en la huella del rail sobre contenido que scrollea de verdad'
    ).toBe(true)

    const bg = roadmapDecls.find((d) => d.prop === 'background')
    expect(bg, 'no se encontró la declaración background de .ch3-roadmap bajo PRM').toBeDefined()
    const mixMatch = bg.value.match(/var\(--c-surface\)\s+(\d+)%/)
    expect(mixMatch, 'el background debería usar color-mix(in srgb, var(--c-surface) N%, transparent)').not.toBeNull()
    expect(
      Number(mixMatch[1]),
      'REGRESSION LOCK (MEDIUM ronda 3): la mezcla debe ser >=70% — medido con la fórmula de luminancia relativa de WCAG (y confirmado con un canvas real en Chrome): a 55% el caption (--ch3-text-2) mide 3.571:1 sobre el Acto 1 oscuro compuesto, bajo AA; a 70% mide 5.104:1'
    ).toBeGreaterThanOrEqual(70)

    const dotDecls = declsIn(prmQuery[0], '.ch3-roadmap-dot')
      // el bloque PRM redeclara `.ch3-roadmap-dot` dos veces (transition:none
      // y pointer-events:auto, ver el <style> real) — filtramos por prop.
      .filter((d) => d.selector === '.ch3-roadmap-dot')
    expect(
      dotDecls.some((d) => d.prop === 'pointer-events' && d.value.trim() === 'auto'),
      'REGRESSION LOCK (MEDIUM ronda 2): .ch3-roadmap-dot debe reafirmar pointer-events:auto bajo PRM — sin esto, pointer-events:none del wrapper se hereda y los botones dejan de ser clickeables'
    ).toBe(true)
  })
})

describe('TASK-024 ronda 3 — lock del numeral en ruta de "texto grande" WCAG (ambas ramas)', () => {
  const LARGE_TEXT_PX = 18.66 // 14pt bold, el umbral real de WCAG para bold

  function remToPx(value) {
    const m = value.match(/([\d.]+)rem/)
    return m ? parseFloat(m[1]) * 16 : null
  }

  it('.ch3-roadmap-dot (rama completa, 40px) tiene font-size >= 18.66px', () => {
    const roadmapRoot = styleRoot(ROADMAP_PATH)
    let baseFontSize = null
    roadmapRoot.walkRules('.ch3-roadmap-dot', (rule) => {
      if (rule.parent.type !== 'atrule') {
        rule.walkDecls('font-size', (d) => { baseFontSize = d.value })
      }
    })
    expect(baseFontSize, 'no se encontró font-size en la regla base .ch3-roadmap-dot').not.toBeNull()
    const px = remToPx(baseFontSize)
    expect(
      px,
      `REGRESSION LOCK (ronda 3): .ch3-roadmap-dot (base) debe medir >= ${LARGE_TEXT_PX}px para calificar como "texto grande" WCAG (peso 800) — por debajo de eso, el contraste 4.301:1 de --c-focus (dot activo) vuelve a necesitar 4.5:1 (texto chico) y falla`
    ).toBeGreaterThanOrEqual(LARGE_TEXT_PX)
  })

  it('.ch3-roadmap-dot (rama compacta, 30px, dentro del @media de tamaño) tiene font-size >= 18.66px', () => {
    const roadmapRoot = styleRoot(ROADMAP_PATH)
    const sizeQuery = mediaAtRules(roadmapRoot, (params) => params.includes('max-width') && params.includes('max-height'))[0]
    const compactDecls = declsIn(sizeQuery, '.ch3-roadmap-dot').filter((d) => d.selector === '.ch3-roadmap-dot')
    const fontSizeDecl = compactDecls.find((d) => d.prop === 'font-size')
    expect(fontSizeDecl, 'no se encontró font-size para .ch3-roadmap-dot dentro del @media compacto').toBeDefined()
    const px = remToPx(fontSizeDecl.value)
    expect(
      px,
      `REGRESSION LOCK (ronda 3, caveat explícito del review): si sólo la rama completa sube el font-size y ésta queda atrás, el dot de 30px vuelve a medir contraste contra el umbral de texto chico (4.5:1) en vez de grande (3:1) y 4.301 vuelve a fallar`
    ).toBeGreaterThanOrEqual(LARGE_TEXT_PX)
  })
})
