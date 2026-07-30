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

  it('.ch2-meta dentro de @media(min-width:600px)/(max-width:1023px) reserva margin-top:104px contra StickyAvatar', () => {
    const root = styleRoot(CH2_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-width: 1023px'))
      .find((q) => declsIn(q, '.ch2-meta').length > 0)
    expect(query, 'no se encontró @media(min-width:600px)/(max-width:1023px) tocando .ch2-meta').toBeDefined()
    const decl = declsIn(query, '.ch2-meta').find((d) => d.prop === 'margin-top')
    expect(
      decl && decl.value,
      'REGRESSION LOCK (TASK-041): .ch2-meta debe declarar margin-top:104px en este rango — sin esto, StickyAvatar (16-112px) vuelve a tapar el año ("2009") en mobile landscape/tablet portrait'
    ).toBe('104px')
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

  it('.ch4-layout dentro de @media(max-width:599px) reserva 64px/60px (left/right) contra StickyTimeline/ContactHUD, y .ch4-panel-column reserva 210px extra al fondo', () => {
    const root = styleRoot(CH4_PATH)
    const query = mediaAtRules(root, (p) => p.trim() === '(max-width: 599px)')
      .find((q) => declsIn(q, '.ch4-layout').some((d) => d.prop === 'padding'))
    expect(query, 'no se encontró @media(max-width:599px) tocando .ch4-layout').toBeDefined()
    const layoutPadding = declsIn(query, '.ch4-layout').find((d) => d.prop === 'padding')
    expect(
      layoutPadding && layoutPadding.value,
      'REGRESSION LOCK (TASK-041): .ch4-layout en mobile debe reservar padding: calc(64px + var(--sp-sm)) 60px var(--sp-sm) 64px (top right bottom left) — left/right por debajo tapan con StickyTimeline (~58px) y ContactHUD (~53px desde el borde) en 390x844'
    ).toBe('calc(64px + var(--sp-sm)) 60px var(--sp-sm) 64px')

    const panelMaxHeight = declsIn(query, '.ch4-panel-column').find((d) => d.prop === 'max-height')
    expect(
      panelMaxHeight && panelMaxHeight.value.includes('210px'),
      'REGRESSION LOCK (TASK-041): .ch4-panel-column en mobile debe reservar 210px extra en max-height contra ContactHUD/SoundToggle/GlobalMantra'
    ).toBe(true)
  })

  it('existe un @media(min-width:600px)/(max-height:520px) — landscape de teléfono — que empuja el título/columna lejos de StickyAvatar/ContactHUD', () => {
    const root = styleRoot(CH4_PATH)
    const query = mediaAtRules(root, (p) => p.includes('min-width: 600px') && p.includes('max-height: 520px'))[0]
    expect(query, 'REGRESSION LOCK (TASK-041): falta el @media(min-width:600px)/(max-height:520px) de mobile landscape').toBeDefined()
    const layoutDecls = declsIn(query, '.ch4-layout')
    expect(layoutDecls.some((d) => d.prop === 'padding-top' && d.value === '128px')).toBe(true)
    expect(layoutDecls.some((d) => d.prop === 'padding-right' && d.value === '70px')).toBe(true)
    const panelDecls = declsIn(query, '.ch4-panel-column')
    expect(panelDecls.some((d) => d.prop === 'margin-left' && d.value === '0')).toBe(true)
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
