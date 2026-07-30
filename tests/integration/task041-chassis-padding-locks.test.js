// tests/integration/task041-chassis-padding-locks.test.js
// TASK-041 — residuales del chasis: excepción acotada (padding/margin de la
// columna de contenido) en Chapter2/3/4/5Content.vue.
//
// jsdom NO evalúa @media (LECCIONES-TECNICAS.md §2 y el precedente de
// tests/integration/ch3-roadmap-round3-locks.test.js): getComputedStyle
// nunca resuelve una regla dentro de un @media aunque se fuerce
// window.innerWidth/matchMedia. Por eso estos locks son ESTRUCTURALES:
// parsean el CSS real con `postcss` (transitivo vía Vite, mismo criterio ya
// sancionado en este proyecto) y verifican qué declaración vive en qué
// @media — no intentan resolver cascada real (eso lo prueba
// scripts/verify-chassis-overlap.mjs contra Chrome real, que es la fuente de
// verdad geométrica de este ticket, no este archivo).
//
// Cada bloque cubre EXACTAMENTE una reserva geométrica añadida por este
// ticket (ver el comentario correspondiente en cada componente) — nada de
// padding sin relación con un residual medido.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import postcss from 'postcss'

const CH2_PATH = resolve(process.cwd(), 'src/components/Chapter2Content.vue')
const CH3_PATH = resolve(process.cwd(), 'src/components/Chapter3Content.vue')
const CH4_PATH = resolve(process.cwd(), 'src/components/Chapter4Content.vue')
const CH5_PATH = resolve(process.cwd(), 'src/components/Chapter5Content.vue')

function styleRoot(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const { descriptor, errors } = parse(source, { filename: filePath })
  expect(errors, `parse() de @vue/compiler-sfc reportó errores sobre ${filePath}`).toHaveLength(0)
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
      out.push({ selector: sel, prop: decl.prop, value: decl.value.trim() })
    }
  })
  return out
}

describe('TASK-041 — Chapter2Content.vue: reserva de espacio contra StickyTimeline/StickyAvatar', () => {
  it('.flash-y2k-mobile dentro de @media(max-width:599px) reserva 64px a la izquierda para el StickyTimeline compacto (~58px)', () => {
    const root = styleRoot(CH2_PATH)
    const query = mediaAtRules(root, (p) => p.trim() === '(max-width: 599px)')
      .find((q) => declsIn(q, '.flash-y2k-mobile').length > 0)
    expect(query, 'no se encontró @media(max-width:599px) tocando .flash-y2k-mobile').toBeDefined()
    const decl = declsIn(query, '.flash-y2k-mobile').find((d) => d.prop === 'padding')
    expect(decl, 'no se encontró la declaración padding de .flash-y2k-mobile').toBeDefined()
    // 4 valores: top right bottom left — el último (left) es el que este
    // ticket sube de var(--sp-md) a 64px.
    const parts = decl.value.split(/\s+(?![^(]*\))/)
    expect(
      parts[parts.length - 1],
      'REGRESSION LOCK (TASK-041): el valor left del padding de .flash-y2k-mobile debe ser 64px — por debajo de eso, StickyTimeline (compacto, ~58px) vuelve a tapar el párrafo largo del stack mobile (medido con verify-chassis-overlap.mjs)'
    ).toBe('64px')
  })

  it('.ch2-meta dentro de @media(min-width:600px)/(max-width:1023px)/(min-height:521px) reserva margin-top:104px contra StickyAvatar (tablet portrait)', () => {
    const root = styleRoot(CH2_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px') && p.includes('min-height: 521px'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    expect(query, 'no se encontró @media(min-width:600px)/(max-width:1023px)/(min-height:521px) tocando .ch2-meta').toBeDefined()
    const decl = declsIn(query, '.ch2-meta').find((d) => d.prop === 'margin-top')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041): .ch2-meta debe declarar margin-top:104px en tablet portrait (min-height:521px) — sin esto, StickyAvatar (16-112px) vuelve a tapar el año ("2009") en 834x1194'
    ).toBe('104px')
  })

  it('.ch2-meta dentro de @media(min-width:600px)/(max-width:1023px)/(min-height:376px)/(max-height:520px) reserva margin-top:40px (brazo medio, 844x390 y alturas similares)', () => {
    const root = styleRoot(CH2_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px') && p.includes('min-height: 376px') && p.includes('max-height: 520px'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    expect(query, 'no se encontró @media(min-width:600px)/(max-width:1023px)/(min-height:376px)/(max-height:520px) tocando .ch2-meta').toBeDefined()
    const decl = declsIn(query, '.ch2-meta').find((d) => d.prop === 'margin-top')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041 ronda 3/4): .ch2-meta debe declarar margin-top:40px en 844x390 y alturas 376-520 — un valor de 104px en esta rama (heredado sin filtrar por altura) empuja la fila "nav" del grid ese mismo tanto y saca el botón CONTACT del sidebar Y2K por debajo del borde de .chapter-section (100dvh + overflow:hidden, sin scroll posible); medido con verify-chassis-overlap.mjs, 40px despeja .ch2-year de StickyAvatar (10px de margen) y deja CONTACT (y1=376) y WORK (y1=328) completos dentro de un viewport de 390px de alto. El piso min-height:376px es RONDA 4: sin él, este brazo aplicaba también a H=375 y cortaba CONTACT 1px (y1=376 > 375)'
    ).toBe('40px')
  })

  it('.ch2-meta dentro de @media(min-width:600px)/(max-width:1023px)/(max-height:376px) reserva margin-top:24px (ronda 4 — tercer brazo para alturas <=375, ej. 844x360 Android landscape)', () => {
    const root = styleRoot(CH2_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px') && p.includes('max-height: 376px') && !p.includes('min-height'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    expect(query, 'no se encontró @media(min-width:600px)/(max-width:1023px)/(max-height:376px) (sin min-height) tocando .ch2-meta').toBeDefined()
    const decl = declsIn(query, '.ch2-meta').find((d) => d.prop === 'margin-top')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041 ronda 4): .ch2-meta debe declarar margin-top:24px en alturas <=375/376 (ej. 844x360, Android landscape 800x360 ubicuo) — el brazo de 40px usa posiciones fijas (CONTACT.y1 = 336+margin, no depende de H) y NO sobrevive a H=360 (CONTACT cortado 16px, área tappable 24px, glifos del label cortados); 24px es el máximo margin que mantiene CONTACT.y1=360<=H incluso en H=360 y por eso también el que minimiza el residual del año (year.y0=106 vs avatar.y1=112, ~6px de solape declarado estructural — conflicto aritmético real: despejar el año exige margin>=30 pero CONTACT en H=360 exige margin<=24, no existe un margin único que sirva ambos; la navegación manda sobre el solapamiento, LECCIONES-TECNICAS.md §7)'
    ).toBe('24px')
  })

  it('ronda 4 — el brazo de margin-top:24px (alturas cortas) está declarado ANTES que el de margin-top:40px en el CSS fuente, para que el de 40px gane cualquier empate exacto en H=376', () => {
    const root = styleRoot(CH2_PATH)
    const shortArm = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px') && p.includes('max-height: 376px') && !p.includes('min-height'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    const midArm = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px') && p.includes('min-height: 376px') && p.includes('max-height: 520px'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    expect(shortArm, 'falta el brazo corto (max-height:376px, margin 24px)').toBeDefined()
    expect(midArm, 'falta el brazo medio (min-height:376px/max-height:520px, margin 40px)').toBeDefined()
    const root_ = root
    const shortIdx = root_.nodes.indexOf(shortArm)
    const midIdx = root_.nodes.indexOf(midArm)
    expect(
      shortIdx,
      'REGRESSION LOCK (TASK-041 ronda 4): el @media de margin-top:24px debe declararse ANTES que el de margin-top:40px en el <style> fuente — ambos comparten el valor límite 376 (uno con max-height:376px, el otro con min-height:376px); con Emulation.setDeviceMetricsOverride en dsf fraccional (ej. dsf=3 -> devicePixelRatio real 3.0000001192092896, ver comentario en Chapter2Content.vue) una consulta max-height evaluada EXACTAMENTE en su propio límite puede fallar por epsilon de punto flotante, pero una min-height evaluada en su propio límite es inmune (el epsilon-hacia-arriba solo puede favorecer >=). Declarar el brazo de 40px DESPUÉS asegura que gane cualquier empate real en H=376 exacto sin depender de ese epsilon'
    ).toBeLessThan(midIdx)
  })
})

describe('TASK-041 — Chapter3Content.vue: reserva de espacio contra StickyTimeline/ContactHUD', () => {
  it('.ch3-slide dentro del @media de reserva (max-width:767px, max-height:767px) reserva padding-left:66px', () => {
    const root = styleRoot(CH3_PATH)
    const query = mediaAtRules(root, (p) => p.includes('max-width: 767px') && p.includes('max-height: 767px'))
      .find((q) => declsIn(q, '.ch3-act1-scene').length > 0) // identificado por contenido, ver ch3-roadmap-round3-locks.test.js
    expect(query, 'no se encontró el @media de reserva (debería tocar .ch3-act1-scene)').toBeDefined()
    const decl = declsIn(query, '.ch3-slide').find((d) => d.prop === 'padding-left' && d.selector === '.ch3-slide')
    expect(
      decl,
      'REGRESSION LOCK (TASK-041): .ch3-slide debe declarar padding-left:66px dentro del @media de reserva — sin esto, StickyTimeline compacto (~58px) vuelve a tapar hero-sub/beat-lead/kickers/"Seguir leyendo" en mobile portrait (medido con verify-chassis-overlap.mjs)'
    ).toBeDefined()
    expect(decl.value).toBe('66px')
  })

  it('.ch3-slide dentro de @media(min-width:768px)/(max-width:1023px) reserva padding-left:190px (tablet portrait, timeline completo)', () => {
    const root = styleRoot(CH3_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 768px') && p.includes('max-width: 1023px'))
      .find((q) => declsIn(q, '.ch3-slide').length > 0)
    expect(query, 'no se encontró @media(min-width:768px)/(max-width:1023px) tocando .ch3-slide').toBeDefined()
    const decl = declsIn(query, '.ch3-slide').find((d) => d.prop === 'padding-left')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041): .ch3-slide debe declarar padding-left:190px en tablet portrait — StickyTimeline ahí usa su versión desktop completa (~153-169px), sin este reserve el rail vuelve a tapar contenido'
    ).toBe('190px')
  })

  it('.ch3-slide dentro de @media(max-height:520px) reserva padding-right:70px contra ContactHUD (mobile landscape)', () => {
    const root = styleRoot(CH3_PATH)
    const query = mediaAtRules(root, (p) => p.trim() === '(max-height: 520px)')
      .find((q) => declsIn(q, '.ch3-slide').length > 0)
    expect(query, 'no se encontró @media(max-height:520px) tocando .ch3-slide').toBeDefined()
    const decl = declsIn(query, '.ch3-slide').find((d) => d.prop === 'padding-right')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041): .ch3-slide debe declarar padding-right:70px en viewports de teléfono en landscape — sin esto, ContactHUD (borde izquierdo en viewport-62) vuelve a tapar beat-lead/project-card-desc por la derecha'
    ).toBe('70px')
  })
})

describe('TASK-041 — Chapter4Content.vue: reserva de espacio contra GlobalMantra/StickyAvatar/ContactHUD/StickyTimeline', () => {
  it('.ch4-panel-column (regla base, desktop) colapsa margin-top a 18px y reserva 120px extra en max-height contra GlobalMantra', () => {
    const root = styleRoot(CH4_PATH)
    const baseDecls = []
    root.walkRules('.ch4-panel-column', (rule) => {
      if (rule.parent.type !== 'atrule') rule.walkDecls((d) => baseDecls.push({ prop: d.prop, value: d.value.trim() }))
    })
    const marginTop = baseDecls.find((d) => d.prop === 'margin-top')
    expect(
      marginTop && marginTop.value,
      'REGRESSION LOCK (TASK-041): .ch4-panel-column (base) debe declarar margin-top: clamp(18px, 10vh, 18px) — un valor mayor vuelve a empujar el panel de proyectos dentro de la banda de GlobalMantra en 1536x791/1440x900 (medido con verify-chassis-overlap.mjs)'
    ).toBe('clamp(18px, 10vh, 18px)')
    const maxHeight = baseDecls.find((d) => d.prop === 'max-height')
    expect(
      maxHeight && /- 120px\)?;?$/.test(maxHeight.value.replace(/\s+/g, ' ')) || (maxHeight && maxHeight.value.includes('120px')),
      'REGRESSION LOCK (TASK-041): .ch4-panel-column (base) debe reservar 120px extra en su max-height'
    ).toBe(true)
  })

  it('.floating-panel (:deep, dentro de .ch4-layout) reduce su padding a 10px — parte del mismo cierre de reserva vertical', () => {
    const root = styleRoot(CH4_PATH)
    let padding = null
    root.walkRules((rule) => {
      if (rule.parent.type === 'atrule') return
      if (rule.selector && rule.selector.includes('.floating-panel') && !rule.selector.includes('__')) {
        rule.walkDecls('padding', (d) => { if (!padding) padding = d.value.trim() })
      }
    })
    expect(
      padding,
      'REGRESSION LOCK (TASK-041): .ch4-layout :deep(.floating-panel) debe declarar padding:10px — volver a 16px reabre el residual de GlobalMantra contra el panel de proyectos en ambos desktops'
    ).toBe('10px')
  })

  it('.ch4-layout dentro de @media(max-width:599px) reserva 64px/60px (left/right) contra StickyTimeline/ContactHUD, y .ch4-panel-column NO reserva un extra fijo al fondo (ronda 2: revertido)', () => {
    const root = styleRoot(CH4_PATH)
    const query = mediaAtRules(root, (p) => p.trim() === '(max-width: 599px)')
      .find((q) => declsIn(q, '.ch4-layout').some((d) => d.prop === 'padding'))
    expect(query, 'no se encontró @media(max-width:599px) tocando .ch4-layout').toBeDefined()
    const layoutPadding = declsIn(query, '.ch4-layout').find((d) => d.prop === 'padding')
    expect(
      layoutPadding && layoutPadding.value,
      'REGRESSION LOCK (TASK-041): .ch4-layout en mobile debe reservar padding: calc(64px + var(--sp-sm)) 60px var(--sp-sm) 64px (top right bottom left) — left/right por debajo tapan con StickyTimeline (~58px) y ContactHUD (~53px desde el borde) en 390x844'
    ).toBe('calc(64px + var(--sp-sm)) 60px var(--sp-sm) 64px')

    // TASK-041 RONDA 2 — el HIGH de la ronda 1 (LECCIONES-TECNICAS.md §8):
    // el +210px extra que este lock exigía antes colapsaba el contenido
    // alcanzable (42%->77% de palabras ocultas en 390x844 ES, ver hand-off).
    // Rafael ordenó revertirlo; el lock ahora congela la fórmula SIN ese
    // término y falla si alguien lo vuelve a agregar en silencio.
    const panelMaxHeight = declsIn(query, '.ch4-panel-column').find((d) => d.prop === 'max-height')
    expect(
      panelMaxHeight && panelMaxHeight.value.replace(/\s+/g, ''),
      'REGRESSION LOCK (TASK-041 ronda 2): .ch4-panel-column en mobile portrait NO debe reservar un extra fijo (ej. 210px) al fondo de su max-height — ese extra esconde contenido alcanzable en vez de resolver el residual (LECCIONES-TECNICAS.md §8); la fórmula correcta es calc(100% - var(--sp-sm) - var(--ch4-title-h, 56px) - var(--sp-sm))'
    ).toBe('calc(100%-var(--sp-sm)-var(--ch4-title-h,56px)-var(--sp-sm))')
  })

  it('existe un @media(min-width:600px)/(max-height:520px) — landscape de teléfono — que empuja el título/columna lejos de StickyAvatar/ContactHUD sin heredar la resta de 120px pensada para desktop', () => {
    const root = styleRoot(CH4_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-height: 520px'))[0]
    expect(query, 'REGRESSION LOCK (TASK-041): falta el @media(min-width:600px)/(max-height:520px) de mobile landscape').toBeDefined()
    const layoutDecls = declsIn(query, '.ch4-layout')
    expect(layoutDecls.some((d) => d.prop === 'padding-top' && d.value === '128px')).toBe(true)
    expect(layoutDecls.some((d) => d.prop === 'padding-right' && d.value === '70px')).toBe(true)
    const panelDecls = declsIn(query, '.ch4-panel-column')
    expect(panelDecls.some((d) => d.prop === 'margin-left' && d.value === '0')).toBe(true)

    // TASK-041 RONDA 2 — defecto encontrado por el review de cierre de la
    // ronda 1 (LECCIONES-TECNICAS.md §8): sin este override, `.ch4-panel-column`
    // heredaba la resta de 120px de la regla base (pensada para GlobalMantra
    // en desktops de 791-900px de alto) y, sumada al padding-top:128px de
    // este mismo breakpoint, colapsaba la columna a clientHeight=12px con el
    // 100% del texto (título incluido) detrás del scroll interno. El override
    // debe existir y NO debe contener el término de 120px.
    const panelMaxHeight = panelDecls.find((d) => d.prop === 'max-height')
    expect(
      panelMaxHeight,
      'REGRESSION LOCK (TASK-041 ronda 2): falta el override de max-height de .ch4-panel-column dentro de @media(min-width:600px)/(max-height:520px) — sin él la columna colapsa a 12px en 844x390 (ver LECCIONES-TECNICAS.md §8)'
    ).toBeDefined()
    expect(
      panelMaxHeight.value.includes('120px'),
      'REGRESSION LOCK (TASK-041 ronda 2): el override de max-height de .ch4-panel-column en mobile landscape NO debe incluir la resta de 120px de la regla base (desktop) — eso es lo que colapsaba la columna a 12px en 844x390'
    ).toBe(false)
    expect(panelMaxHeight.value.replace(/\s+/g, '')).toBe(
      'calc(100%-clamp(18px,10vh,18px)-var(--ch4-title-h,72px)-var(--sp-md))'
    )
  })

  it('existe un @media(min-width:768px)/(max-width:1023px) — tablet portrait — que empuja .ch4-title bajo StickyAvatar', () => {
    const root = styleRoot(CH4_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 768px') && p.includes('max-width: 1023px'))
      .find((q) => declsIn(q, '.ch4-layout').some((d) => d.prop === 'padding-top'))
    expect(query, 'REGRESSION LOCK (TASK-041): falta el @media(min-width:768px)/(max-width:1023px) de tablet portrait en ch4').toBeDefined()
    const decl = declsIn(query, '.ch4-layout').find((d) => d.prop === 'padding-top')
    expect(decl && decl.value).toBe('128px')
  })
})

describe('TASK-041 — Chapter5Content.vue: reserva de espacio contra LangToggle/ContactHUD/StickyTimeline', () => {
  it('.ch5-stream-panel (regla base) reserva padding: 76px 72px 28px 28px contra LangToggle (arriba) y ContactHUD (derecha)', () => {
    const root = styleRoot(CH5_PATH)
    let padding = null
    root.walkRules('.ch5-stream-panel', (rule) => {
      if (rule.parent.type !== 'atrule') rule.walkDecls('padding', (d) => { padding = d.value.trim() })
    })
    expect(
      padding,
      'REGRESSION LOCK (TASK-041): .ch5-stream-panel (base) debe declarar padding:76px 72px 28px 28px — top<76px reabre el solape con LangToggle (y0-y1=16-60), right<72px reabre el solape con ContactHUD (borde izquierdo en viewport-62)'
    ).toBe('76px 72px 28px 28px')
  })

  it('.ch5-stream-panel dentro de @media(max-width:600px) resetea el top a 28px y sube el left a 68px contra StickyTimeline', () => {
    const root = styleRoot(CH5_PATH)
    const query = mediaAtRules(root, (p) => p.trim() === '(max-width: 600px)')
      .find((q) => declsIn(q, '.ch5-stream-panel').some((d) => d.prop === 'padding-left'))
    expect(query, 'no se encontró @media(max-width:600px) con padding-left en .ch5-stream-panel').toBeDefined()
    const decls = declsIn(query, '.ch5-stream-panel')
    expect(
      decls.some((d) => d.prop === 'padding-top' && d.value === '28px'),
      'REGRESSION LOCK (TASK-041): en mobile portrait, .ch5-stream-panel debe resetear padding-top a 28px (sin residual de LangToggle ahí)'
    ).toBe(true)
    expect(
      decls.some((d) => d.prop === 'padding-left' && d.value === '68px'),
      'REGRESSION LOCK (TASK-041): en mobile portrait, .ch5-stream-panel debe subir padding-left a 68px — por debajo, StickyTimeline (~58px) tapa badge/título/viewers/timestamp'
    ).toBe(true)
  })
})
