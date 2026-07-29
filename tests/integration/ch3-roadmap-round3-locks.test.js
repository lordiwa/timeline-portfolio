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
    //
    // Desde la ronda 6 hay UN SEGUNDO @media que combina ambos brazos — el
    // gate de tipografía expandida (841px, ver más abajo), que también
    // necesitó un brazo max-width tras un hallazgo propio corriendo el
    // harness (390x844-mobile-portrait recortaba con tipografía SPEC sin
    // compactar). Se identifica la reserva por CONTENIDO (`.ch3-act1-scene`,
    // exclusivo de la reserva), no por ser la única de su forma.
    const combinedArmsQueries = mediaAtRules(ch3Root, (params) => params.includes('max-width') && params.includes('max-height'))
    expect(
      combinedArmsQueries.length,
      'REGRESSION LOCK (HIGH ronda 6): debería haber exactamente DOS @media que combinen max-width y max-height en Chapter3Content.vue — la reserva de clearance (ronda 3) y el gate de tipografía expandida (ronda 6)'
    ).toBe(2)
    const ch3ReserveQuery = [combinedArmsQueries.find((q) => declsIn(q, '.ch3-act1-scene').length > 0)]
    expect(ch3ReserveQuery[0], 'no se encontró el @media de reserva (debería tocar .ch3-act1-scene)').toBeDefined()
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

  it('la compactación vive en CUATRO bandas distintas — reserva (767px) > compactación del Acto 1 (735px) > compactación del Acto 2 (525px), más la banda independiente de tipografía expandida (841px + brazo max-width:767px, ronda 6) — ninguna igual ni invertida entre las tres primeras', () => {
    const ch3Root = styleRoot(CH3_PATH)
    // Identificar cada banda por CONTENIDO, no por la forma de sus
    // parámetros — desde la ronda 6 tanto la reserva como el gate de
    // tipografía expandida combinan max-width y max-height (ver el lock de
    // arriba), así que ya no alcanza con "tiene ambos brazos" para
    // distinguirlas entre sí, y "sólo max-height" ya no identifica a la
    // banda de tipografía expandida (ganó un brazo max-width propio).
    const allQueries = mediaAtRules(ch3Root, () => true)
    // `.ch3-act1-scene` por sí solo NO alcanza — también aparece dentro de
    // `@media (prefers-reduced-motion: reduce)` (con `height:100%`, un
    // asunto totalmente distinto). La reserva es la que le agrega
    // `padding-top` con `calc()` (ver el lock de arriba, mismo criterio).
    const reserveQuery = allQueries.find((q) => declsIn(q, '.ch3-act1-scene').some((d) => d.prop === 'padding-top' && /calc\(/.test(d.value)))
    // `.ch3-flash-stage` por sí solo NO alcanza para identificar el Acto 1
    // — la reserva TAMBIÉN lo toca (compacta su width para narrow layout,
    // ver línea ~1257) — se usa `.ch3-phone` en cambio, exclusivo del
    // bloque del Acto 1 (`display:none` bajo 735px, ver el comentario del
    // código junto a esa regla).
    const act1Query = allQueries.find((q) => declsIn(q, '.ch3-phone').length > 0)
    const act2Query = allQueries.find((q) => declsIn(q, '.ch3-hero-title').length > 0)
    const expandedTypoQuery = allQueries.find((q) => declsIn(q, '.ch3-beat-rest > p').length > 0)
    expect(reserveQuery, 'no se encontró el @media de reserva (debería tocar .ch3-act1-scene)').toBeDefined()
    expect(act1Query, 'no se encontró el @media de compactación del Acto 1 (debería tocar .ch3-phone)').toBeDefined()
    expect(act2Query, 'no se encontró el @media de compactación del Acto 2 (debería tocar .ch3-hero-title)').toBeDefined()
    expect(
      expandedTypoQuery,
      'REGRESSION LOCK (HIGH ronda 6): no se encontró el @media de compactación tipográfica del beat expandido (debería tocar .ch3-beat-rest > p) — ver el lock dedicado más abajo'
    ).toBeDefined()
    // Las cuatro bandas deben ser CUATRO @media realmente distintos (si dos
    // colapsaran al mismo nodo, alguna de las cuatro identificaciones de
    // arriba estaría mal, o dos bandas se fusionaron sin querer).
    expect(new Set([reserveQuery, act1Query, act2Query, expandedTypoQuery]).size).toBe(4)
    // Acto 1 y Acto 2 siguen siendo SÓLO por altura (sin brazo max-width) —
    // eso no cambió esta ronda.
    expect(act1Query.params.includes('max-width'), 'el @media del Acto 1 NO debería tener brazo max-width').toBe(false)
    expect(act2Query.params.includes('max-width'), 'el @media del Acto 2 NO debería tener brazo max-width').toBe(false)
    // El gate de tipografía expandida SÍ tiene brazo max-width desde esta
    // ronda (hallazgo propio: 390x844-mobile-portrait recortaba sin él).
    expect(
      expandedTypoQuery.params.includes('max-width'),
      'REGRESSION LOCK (HIGH ronda 6, hallazgo propio): el @media de tipografía expandida debe tener brazo max-width — sin él, un mobile portrait con alto apenas por encima de 841px (ej. 390x844) recibe tipografía SPEC sin compactar en una columna angosta que la envuelve en más líneas de las que caben (medido con CDP real: hasta 388px de exceso)'
    ).toBe(true)

    const act1Height = Number(act1Query.params.match(/max-height:\s*(\d+)px/)[1])
    const act2Height = Number(act2Query.params.match(/max-height:\s*(\d+)px/)[1])
    const reserveHeight = Number(reserveQuery.params.match(/max-height:\s*(\d+)px/)[1])

    expect(
      act1Height,
      'REGRESSION LOCK (HIGH ronda 3): el umbral de compactación del Acto 1 debe ser ESTRICTAMENTE menor al de reserva'
    ).toBeLessThan(reserveHeight)
    expect(
      act2Height,
      'REGRESSION LOCK (HIGH ronda 4): el umbral de compactación del Acto 2 debe ser ESTRICTAMENTE menor al del Acto 1 — si vuelven a ser iguales, el Acto 2 vuelve a compactarse en todo el rango que sólo necesita el Acto 1 (el HIGH exacto de la ronda 4: el caso 1366x768-con-barra, ~630-660px reales, caía dentro de 735 igual).'
    ).toBeLessThan(act1Height)

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

    // REGRESSION LOCK (HIGH ronda 6): la banda de tipografía expandida
    // resuelve un problema distinto (cuánto entra el párrafo "Seguir
    // leyendo" YA anclado arriba) al de las otras tres bandas (cuánto
    // entra el layout colapsado) — por eso su umbral (medido con CDP real,
    // peor caso EN/"REBUILD": 838px→2px de recorte, 841px→0px limpio) cae
    // POR ENCIMA de la reserva (767px), no por debajo. No es un error de
    // orden: son ejes independientes. Se lockea el valor medido exacto
    // para que un ajuste futuro de copy/tipografía tenga que volver a
    // medir con CDP, no adivinar.
    const expandedTypoHeight = Number(expandedTypoQuery.params.match(/max-height:\s*(\d+)px/)[1])
    expect(
      expandedTypoHeight,
      'REGRESSION LOCK (HIGH ronda 6): el umbral de compactación tipográfica del beat expandido debe ser el valor MEDIDO con CDP (841px, peor caso EN) — no un número estimado'
    ).toBe(841)
  })

  it('el brazo `max-width` de la reserva existe (ronda 3, MEDIUM: portrait 390x844 sin reserva)', () => {
    const ch3Root = styleRoot(CH3_PATH)
    // Identificado por contenido (.ch3-act1-scene, exclusivo de la
    // reserva) — desde la ronda 6 hay OTRO @media que también combina
    // max-width y max-height (el gate de tipografía expandida), así que ya
    // no alcanza con "el primero que combine ambos brazos".
    const reserveQuery = mediaAtRules(ch3Root, (params) => params.includes('max-width') && params.includes('max-height'))
      .find((q) => declsIn(q, '.ch3-act1-scene').length > 0)
    expect(reserveQuery, 'no se encontró el @media de reserva (debería tocar .ch3-act1-scene)').toBeDefined()
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

// ─────────────────────────────────────────────────────────────────────────
// TASK-024 ronda 5 — lock del HIGH del estado EXPANDIDO ("Seguir leyendo").
// Dos hallazgos, uno del review (recorte DENTRO de la banda de reserva,
// ≤767px) y uno propio corriendo el harness con el fix parcial del primero
// (solape FUERA de la banda, en los viewports "siempre limpios" 900/768/
// 791 — un beat expandido lo bastante alto empuja su propio borde superior
// hacia el rail al centrarse, sin que medie ningún @media). El fix de
// POSICIÓN (`.ch3-slide:has(...) { align-items:flex-start; padding-top }`)
// quedó GLOBAL — sin ningún @media — y así se mantiene (nunca causa
// solape, un padding-top de más es inofensivo a cualquier alto).
//
// TASK-024 ronda 6 — la ronda 5 dejó la TIPOGRAFÍA (icono/numeral/kicker/
// lead/`.ch3-beat-rest > p`) también GLOBAL/incondicional, lo que aplastaba
// el párrafo revelado a 0.64rem incluso en desktop espacioso (1920x1080,
// 1440x900) donde nunca hizo falta — por debajo del piso de diseño
// --fs-100 (0.72rem). Se GATEÓ la tipografía (sólo la tipografía, la
// posición sigue global) detrás de `@media (max-height: 841px)`, umbral
// medido con CDP real (ver el comentario junto a la regla en
// Chapter3Content.vue). Estos locks verifican que la tipografía esté dentro
// de esa banda — NO global — mientras que la posición sigue siendo global.
//
// Fix: `:has(.ch3-beat-rest.is-open)` (mismo selector que ya usa
// StickyTimeline.vue en este proyecto) compacta la fila SÓLO cuando está
// REALMENTE expandida — nunca las filas colapsadas, que conservan la
// tipografía de la spec ya validada visualmente (AC#2, ronda 4, "cumple y
// se ve bien") en CUALQUIER alto de viewport por encima de 841px.
// `.ch3-beat-rest > p` también se compacta sólo dentro de esa banda desde
// la ronda 6 (antes era incondicional; medía 0 de alto colapsado de
// cualquier forma, así que gatearla no cambia el estado colapsado).
// ─────────────────────────────────────────────────────────────────────────
describe('TASK-024 ronda 5 — lock del estado expandido de los beats ("Seguir leyendo")', () => {
  function insideMediaQuery(node) {
    // Camina hacia arriba en el árbol buscando específicamente un @media
    // ancestro — a diferencia de "cualquier atrule", porque TODO este
    // archivo vive dentro de `@layer components { ... }` (una capa de
    // cascada, no una condición de viewport/motion): una regla dentro de
    // `@layer` pero fuera de cualquier `@media` sigue siendo GLOBAL en el
    // sentido que importa acá (se aplica siempre, sin depender del alto/
    // ancho/prefers-* del viewport).
    let n = node.parent
    while (n) {
      if (n.type === 'atrule' && n.name === 'media') return true
      n = n.parent
    }
    return false
  }

  function topLevelDecls(root, selectorSubstring) {
    // A diferencia de declsIn() (que busca DENTRO de un @media dado), esto
    // busca en TODO el árbol pero EXCLUYE explícitamente cualquier regla
    // anidada dentro de un @media — exactamente lo que hace falta para
    // lockear "es global, no está escondido en un breakpoint".
    const out = []
    root.walkDecls((decl) => {
      const rule = decl.parent
      if (!rule || rule.type !== 'rule') return
      if (insideMediaQuery(rule)) return
      if (!selectorSubstring || (rule.selector && rule.selector.includes(selectorSubstring))) {
        out.push({ selector: rule.selector, prop: decl.prop, value: decl.value })
      }
    })
    return out
  }

  it('.ch3-beat-rest > p se compacta DENTRO de la banda medida de tipografía expandida (@media ...max-height:841px) — nunca a nivel global (ronda 6)', () => {
    const ch3Root = styleRoot(CH3_PATH)
    // Identificado por contenido, no por la forma exacta de los parámetros
    // — desde que se le agregó el brazo max-width (hallazgo propio, ver el
    // lock de la banda de arriba), el @media ya no es sólo "(max-height:
    // 841px)" a secas.
    const expandedTypoQuery = mediaAtRules(ch3Root, (params) => params.includes('max-height: 841px'))
      .find((q) => declsIn(q, '.ch3-beat-rest > p').length > 0)
    expect(expandedTypoQuery, 'debería existir el gate de tipografía expandida de la ronda 6 (max-height:841px, tocando .ch3-beat-rest > p)').toBeDefined()
    const gatedDecls = declsIn(expandedTypoQuery, '.ch3-beat-rest > p')
    const fontSizeDecl = gatedDecls.find((d) => d.prop === 'font-size' && d.value.trim() === '0.64rem')
    expect(
      fontSizeDecl,
      'REGRESSION LOCK (HIGH ronda 5, re-gateado ronda 6): .ch3-beat-rest > p debe tener font-size:0.64rem (el valor COMPACTO, no el de la regla base 1.0625rem) declarado DENTRO de @media (max-height:841px) — si desaparece de ahí, el párrafo revelado por "Seguir leyendo" vuelve a exceder el presupuesto en viewports bajos (medido con CDP real, peor caso EN: recorte por debajo de 841px)'
    ).toBeDefined()

    // REGRESSION LOCK (HIGH ronda 6): el mismo valor NO debe volver a
    // aparecer a nivel GLOBAL (fuera de cualquier @media) — esa fue
    // exactamente la regresión de la ronda 6: la ronda 5 lo dejó
    // incondicional y aplastaba el texto también en desktop espacioso
    // (1920x1080/1440x900), por debajo del piso de diseño --fs-100 (0.72rem).
    const globalDecls = topLevelDecls(ch3Root, '.ch3-beat-rest > p')
    const globalCompact = globalDecls.find((d) => d.prop === 'font-size' && d.value.trim() === '0.64rem')
    expect(
      globalCompact,
      'REGRESSION LOCK (HIGH ronda 6): .ch3-beat-rest > p NO debe tener font-size:0.64rem declarado a nivel GLOBAL (fuera de cualquier @media) — si reaparece ahí, se vuelve a aplastar el párrafo revelado incluso en desktop espacioso donde nunca hizo falta'
    ).toBeUndefined()
  })

  it('.ch3-slide:has(.ch3-beat-rest.is-open) ancla arriba a nivel GLOBAL — el hallazgo propio de esta ronda (solape por centrado en viewports altos)', () => {
    const ch3Root = styleRoot(CH3_PATH)
    const sceneDecls = topLevelDecls(ch3Root, '.ch3-slide:has(.ch3-beat-rest.is-open)')
    expect(
      sceneDecls.some((d) => d.prop === 'align-items' && d.value.trim() === 'flex-start'),
      'REGRESSION LOCK (HIGH ronda 5, hallazgo propio): .ch3-slide:has(.ch3-beat-rest.is-open) debe declarar align-items:flex-start FUERA de cualquier @media — medido con CDP real: sin esto, un beat expandido en un viewport >767px (900/768/791, los "siempre limpios") se centra y su propio borde superior invade la franja del rail (y=[149,...] contra el rail en y=[120,204] a 1440x900)'
    ).toBe(true)
    expect(
      sceneDecls.some((d) => d.prop === 'padding-top' && /calc\(/.test(d.value)),
      'REGRESSION LOCK (HIGH ronda 5): .ch3-slide:has(.ch3-beat-rest.is-open) debe declarar padding-top con calc() a nivel global'
    ).toBe(true)
  })

  it('.ch3-slide:has(.ch3-beat-rest.is-open) (posición) sigue siendo la ÚNICA regla `:has(.ch3-beat-rest.is-open)` global — el resto vive dentro de @media (max-height:841px) (ronda 6)', () => {
    const ch3Root = styleRoot(CH3_PATH)

    const hasOpenSelectors = []
    ch3Root.walkRules((rule) => {
      if (insideMediaQuery(rule)) return
      if (rule.selector && rule.selector.includes(':has(.ch3-beat-rest.is-open)')) hasOpenSelectors.push(rule.selector)
    })
    expect(
      hasOpenSelectors.every((sel) => sel.startsWith('.ch3-slide')),
      `REGRESSION LOCK (HIGH ronda 6): las únicas reglas ':has(.ch3-beat-rest.is-open)' GLOBALES (fuera de @media) deben ser sobre '.ch3-slide' (posición) — si aparece '.ch3-beat:has(...)' (tipografía) a nivel global otra vez, se repite la regresión de la ronda 6 (aplasta texto en desktop espacioso). Selectores globales encontrados: ${JSON.stringify(hasOpenSelectors)}`
    ).toBe(true)

    // La tipografía compacta SÍ debe existir, pero DENTRO del @media medido.
    const expandedTypoQuery = mediaAtRules(ch3Root, (params) => params.includes('max-height: 841px'))
      .find((q) => declsIn(q, '.ch3-beat-rest > p').length > 0)
    expect(expandedTypoQuery, 'debería existir el gate de tipografía expandida (max-height:841px, tocando .ch3-beat-rest > p)').toBeDefined()
    const gatedHasOpen = []
    expandedTypoQuery.walkRules((rule) => {
      if (rule.selector && rule.selector.includes(':has(.ch3-beat-rest.is-open)')) gatedHasOpen.push(rule.selector)
    })
    expect(
      gatedHasOpen.length,
      'REGRESSION LOCK (HIGH ronda 5, re-gateado ronda 6): debe existir al menos una regla `:has(.ch3-beat-rest.is-open)` DENTRO de @media (max-height:841px) — si desaparece, el estado expandido de un beat en viewports bajos vuelve a exceder el presupuesto'
    ).toBeGreaterThan(0)

    // Verificar que compacta las propiedades concretas que el presupuesto
    // necesita (medido con CDP real: icono, numeral, kicker, lead, padding).
    const expandedDecls = declsIn(expandedTypoQuery, ':has(.ch3-beat-rest.is-open)')
    const expectedTargets = [
      ['.ch3-beat-icon', 'width'],
      ['.ch3-beat-numeral', 'font-size'],
      ['.ch3-beat-kicker', 'font-size'],
      ['.ch3-beat-lead', 'font-size'],
    ]
    for (const [selectorSubstr, prop] of expectedTargets) {
      const found = expandedDecls.some((d) => d.selector.includes(selectorSubstr) && d.prop === prop)
      expect(
        found,
        `REGRESSION LOCK (HIGH ronda 5): falta compactar ${prop} de un selector que incluya "${selectorSubstr}" dentro de la regla :has(.ch3-beat-rest.is-open), dentro de @media (max-height:841px) — sin esto el presupuesto medido con CDP puede volver a no alcanzar`
      ).toBe(true)
    }
  })

  // NOTA: se evaluó un cuarto test ("el valor compacto del numeral nunca
  // aparece sin el guard :has()") y se descartó — el valor compacto
  // `clamp(1.1rem, 4.5vh, 1.6rem)` coincide, A PROPÓSITO, con el que ya usa
  // la compactación profunda del Acto 2 (`@media (max-height:525px)`,
  // ronda 4, legítima y colapsa TODO el acto por diseño ya validado) — un
  // lock por VALOR ahí genera un falso positivo real, no hipotético
  // (confirmado plantándolo). El test #3 de arriba (existencia + props de
  // `.ch3-beat:has(...) .ch3-beat-numeral`) ya cubre el caso real: si el
  // guard de ESTA regla se cae, esa aserción positiva deja de encontrarla.
})

// ─────────────────────────────────────────────────────────────────────────
// TASK-024 ronda 6 (MEDIUM #1 de review) — presupuesto de largo del texto
// "rest" (la parte de cada beat que revela "Seguir leyendo"). El margen que
// midió la ronda 5 con CDP real en el viewport más apretado (844x390, EN,
// beat "REBUILD") fue de 14px (bottom=376 contra 390 disponibles) — un
// margen chico que depende del LARGO del copy, algo que ningún lock
// estructural de CSS puede ver (el CSS no cambia cuando el copy cambia). La
// pulida de copy ES/EN sigue pendiente en el proyecto (ver CLAUDE.md §7.3),
// así que este lock es un presupuesto barato de caracteres — NO reemplaza
// el harness CDP (`scripts/verify-ch3-roadmap-geometry.mjs`), que sigue
// siendo la fuente de verdad geométrica — es un tripwire: si una edición de
// copy futura empuja el texto más allá del ceiling medido, el test falla
// ANTES de que alguien note un recorte en producción, y avisa que hace
// falta volver a correr el harness.
//
// `splitLead()` se REIMPLEMENTA acá (no se importa desde el <script setup>
// de Chapter3Content.vue — un SFC no expone sus bindings internos a un
// import de test sin herramientas adicionales) — duplicación deliberada y
// mínima (7 líneas), aceptada por ser la única forma barata de calcular
// exactamente el mismo `rest` que ve el usuario, sin agregar una
// dependencia ni refactorizar el componente sólo para testear.
describe('TASK-024 ronda 6 — presupuesto de largo del texto "rest" de los beats (MEDIUM #1, ES+EN)', () => {
  const ES_PATH = resolve(process.cwd(), 'src/i18n/es.json')
  const EN_PATH = resolve(process.cwd(), 'src/i18n/en.json')
  const LEAD_SENTENCE_COUNT = [2, 2, 2, 2]
  // Ceiling medido: el peor caso ACTUAL (EN, beat1/"REBUILD") es 568
  // caracteres y cabe con 14px de margen a 844x390 (el viewport más
  // apretado de la suite CDP, ronda 5). Se fija el presupuesto en 620
  // (+~9% sobre el peor caso medido) como margen de maniobra chico para
  // ediciones menores de copy sin re-medir — cualquier cosa por encima
  // exige correr el harness de nuevo antes de dar la edición por buena.
  const REST_CHAR_BUDGET = 620

  function splitLeadRest(text, leadCount) {
    const sentences = text.split('. ')
    if (sentences.length <= leadCount) return ''
    return sentences.slice(leadCount).join('. ')
  }

  for (const [locale, path] of [['es', ES_PATH], ['en', EN_PATH]]) {
    it(`bio.eras.3.text (${locale}) — el "rest" de los beats 0-3 no excede el presupuesto de ${REST_CHAR_BUDGET} caracteres`, () => {
      const data = JSON.parse(readFileSync(path, 'utf8'))
      const text = data.bio?.eras?.[3]?.text
      expect(text, `no se encontró bio.eras.3.text en ${path}`).toBeTypeOf('string')
      const paragraphs = text.split('\n\n')
      expect(
        paragraphs.length,
        `bio.eras.3.text (${locale}) debe tener 5 párrafos (uno por beat, ch3 tiene 5 beats) — si cambia el conteo, este presupuesto y el harness CDP necesitan revisarse igual`
      ).toBe(5)
      for (let i = 0; i < 4; i++) {
        // beat 4 (índice 4) va siempre completo (full: true en BEAT_META),
        // no tiene "rest" — no aplica presupuesto.
        const rest = splitLeadRest(paragraphs[i], LEAD_SENTENCE_COUNT[i])
        expect(
          rest.length,
          `REGRESSION LOCK (MEDIUM ronda 6): bio.eras.3.text (${locale}) beat${i} — el texto "rest" mide ${rest.length} caracteres, por encima del presupuesto de ${REST_CHAR_BUDGET}. El presupuesto se calibró con CDP real (844x390, EN, beat1: 568 caracteres con 14px de margen) — si el copy creció, hay que volver a correr scripts/verify-ch3-roadmap-geometry.mjs antes de dar esta edición por buena, y si sigue limpio, subir el presupuesto acá al nuevo valor medido.`
        ).toBeLessThanOrEqual(REST_CHAR_BUDGET)
      }
    })
  }
})
