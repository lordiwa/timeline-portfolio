// generateSite(seed, level): funcion pura y determinista. Devuelve la descripcion JSON-serializable
// de un SITIO multi-pagina (sin textos: los textos salen de los content packs / i18n segun idioma).
//
// Dos flujos de azar para que (seed) fije el "mundo" y (seed, level) fije la estructura:
//   - base  = createRng(seed)            -> tema (UNA de las 63 packs), estilo y datos. Igual en los 3 niveles.
//   - level = createRng(`${seed}|${level}`) -> que paginas hay, que bugs hay y en que pagina vive cada uno.
// El tema sale SIEMPRE del primer sorteo de `base`; los parametros de los bugs viven en sub-streams propios
// (genBugParams), asi agregar bugs al catalogo nunca cambia el tema de una semilla.
import { createRng } from './prng.js'
import { THEMES } from './themes.js'
import { NAMES, fieldMeta } from './fields.js'
import { LEVEL_CONFIG, normalizeLevel } from './levels.js'
import { PAGE_TYPES, closureOf } from './pages.js'
import { isoFromOffset, isoToOffset } from './dates.js'
import { BUGS } from '../bugs/catalog.js'
import { capabilitiesOf, requiresMet, bugFitsPage, formKeys } from './capabilities.js'

const CHECKOUT_KEYS = ['name', 'email', 'address', 'city', 'card']
const median = (arr) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length / 2)]

/** Wizard desde el pack: sus pasos (ids s1..sN) + un paso final 'confirm' (resumen + terminos).
 *  conditional.thenShow del pack = kind 'field' (visible SOLO si ifField === equals); un paso cuyos campos son todos
 *  condicionales se oculta entero con el mismo criterio (kind 'step'), para no mostrar un paso vacio. */
function wizardFromPack(pack) {
  const { conditional: cd } = pack.wizard
  const thenShow = cd.thenShow
  const steps = pack.wizard.steps.map((s, i) => ({ id: `s${i + 1}`, fields: s.fieldKeys.slice() }))
  const conditionals = [{ ifField: cd.ifField, equals: cd.equals, thenShow: thenShow.slice(), kind: 'field' }]
  for (const s of steps) if (s.fields.every((k) => thenShow.includes(k))) conditionals.push({ ifField: cd.ifField, equals: cd.equals, thenShow: s.id, kind: 'step' })
  steps.push({ id: 'confirm', fields: ['terms'] })
  return { steps, conditionals }
}

function genData(rng, pack) {
  const decimals = pack.currency.decimals
  const unit = 10 ** -decimals
  const roundC = (n) => Math.max(unit, Math.round(n * 10 ** decimals) / 10 ** decimals) // precios exactos en la moneda del pack

  // --- catalogo (listado + detalle + carrito): items del pack (ordenados por la semilla); si el catalogo es mas largo
  // que el pack, los items se repiten con `variant` (sufijo en el nombre y un poco mas caros) ---
  const pageSize = rng.pick([4, 6, 8])
  const total = pageSize * rng.int(3, 5) + rng.int(1, pageSize - 1) // 4..6 paginas, la ultima parcial
  const order = rng.shuffle(pack.items.map((_, i) => i))
  const catIdx = Object.fromEntries(pack.categories.map((c, i) => [c.id, i]))
  const catalog = Array.from({ length: total }, (_, i) => {
    const itemIdx = order[i % order.length]
    const variant = Math.floor(i / order.length)
    const base = pack.items[itemIdx]
    return { id: i + 1, itemIdx, variant, price: roundC(base.price * (1 + 0.15 * variant)), cat: catIdx[base.category] }
  })
  const list = { pageSize, skipAt: rng.int(1, 2), cols: rng.pick([2, 3, 4]) }

  // --- dashboard (tabla paginada): filas desde pack.dashboard.rowTemplate, todo desde un sub-stream propio ---
  const dPageSize = rng.pick([4, 5, 6])
  const skipAt = rng.int(1, 2)
  const dx = rng.fork('dashboard')
  const { columns, rowTemplate: rt } = pack.dashboard
  const dashboard = {
    pageSize: dPageSize,
    skipAt,
    rows: Array.from({ length: rt.count }, (_, i) => {
      const row = { id: i + 1 }
      for (const col of columns) {
        if (col.type === 'text') row[col.key] = dx.int(0, rt.pools[col.key].length - 1) // indice en el pool
        else if (col.type === 'date') {
          const { from, to } = rt.ranges[col.key]
          row[col.key] = isoFromOffset(dx.int(isoToOffset(from), isoToOffset(to)))
        } else row[col.key] = dx.int(Math.round(rt.ranges[col.key].min), Math.round(rt.ranges[col.key].max))
      }
      // `status` NO es una columna del pack: es un derivado del lab (filtro y KPI del panel). Se sortea por fila en el
      // sub-stream del dashboard (0 activo, 1 pendiente, 2 cerrado) y los 3 textos son genericos (i18n list.status_*).
      row.status = dx.int(0, 2)
      return row
    }),
  }

  // --- blog: los posts del pack; los comentarios y los parrafos de relleno son genericos (i18n) ---
  const postOrder = rng.shuffle(pack.posts.map((_, i) => i))
  const posts = Array.from({ length: Math.min(rng.int(3, 4), postOrder.length) }, (_, i) => ({
    id: i + 1,
    postIdx: postOrder[i],
    paragraphs: rng.sample([0, 1, 2, 3, 4, 5, 6, 7], 3),
    comments: Array.from({ length: rng.int(2, 5) }, () => ({ author: rng.pick(NAMES), textIdx: rng.int(0, 7), minutes: rng.int(2, 600) })),
  }))

  // --- faq: preguntas del pack ---
  const faq = { questions: rng.sample(pack.faq.map((_, i) => i), Math.min(6, pack.faq.length)), multiple: rng.chance(0.5), openFirst: rng.chance(0.5) }

  // --- checkout: cupon, envio, impuestos. El envio escala con la moneda del pack (un % del precio mediano) ---
  const pct = rng.pick([5, 10, 15, 20, 25])
  const coupon = { code: `${rng.pick(['SAVE', 'PROMO', 'DEAL', 'LAB'])}${pct}`, pct }
  const mid = median(catalog.map((r) => r.price))
  const standard = roundC((mid * rng.int(3, 8)) / 100)
  const shipping = { standard, express: roundC(standard + (mid * rng.int(5, 12)) / 100), pickup: 0 }
  const taxRate = rng.pick([7, 10, 16, 21])
  const checkoutExtras = rng.sample(['notes', 'newsletter', 'giftwrap'], rng.int(1, 2))

  // --- cuenta de practica (login) ---
  const demoName = rng.pick(NAMES)
  const demoUser = { name: demoName, email: `${demoName.toLowerCase()}@example.com`, password: `qa-${rng.int(100000, 999999)}` }

  // --- formularios: solo claves (content.field(key) arma el campo con sus reglas y etiquetas). Signup y wizard = campos
  // del pack; contacto, checkout y cuenta = campos genericos (email/password/asunto con las reglas del pack) ---
  const signupFields = pack.signupFields.map((f) => f.key)
  const contactFields = rng.shuffle(['name', 'email', 'subject', 'message', ...(rng.chance(0.6) ? ['phone'] : [])])
  const wizard = wizardFromPack(pack)

  const data = { catalog, list, dashboard, posts, faq, coupon, shipping, taxRate, checkoutExtras, demoUser, signupFields, contactFields, wizard }

  // Tipo y obligatoriedad de cada campo usado (de ahi salen las capacidades de campo y los bugs elegibles).
  const used = new Set([...signupFields, ...contactFields, ...CHECKOUT_KEYS, ...checkoutExtras, ...wizard.steps.flatMap((s) => s.fields), 'name', 'newsletter'])
  data.fieldMeta = Object.fromEntries([...used].sort().map((k) => [k, fieldMeta(pack, k)]))

  // Campo "objetivo" de los bugs de accesibilidad (missing-label / tab-order) por pagina. Solo campos que muestran la
  // etiqueta/tabindex (no checkbox ni radio) y que estan visibles sin condicion.
  const target = (page) => {
    const keys = formKeys(data, page).filter((k) => !['checkbox', 'radio'].includes(data.fieldMeta[k].type))
    return rng.pick(keys)
  }
  data.labelTargets = {
    signup: target('signup'), contact: target('contact'), wizard: target('wizard'), checkout: rng.pick(['name', 'address', 'city', 'card']),
    list: 'search', dashboard: 'search', faq: 'search', blog: 'comment',
  }
  return data
}

/** Paginas obligatorias: home y un listado siempre; al menos una con formulario (todos los niveles);
 *  en senior ademas el nucleo de comercio (listado, detalle, carrito y checkout, que ya es un formulario). */
function mustHave(rng, level) {
  const must = ['home', 'list']
  if (level === 'senior') return [...must, 'detail', 'cart', 'checkout']
  return [...must, rng.pick(['contact', 'wizard', 'signup', 'checkout'])]
}

/** Elige el set de paginas: las obligatorias, las dependencias juntas y exactamente n paginas. */
function pickPages(rng, [min, max], level) {
  const n = rng.int(min, max)
  const chosen = new Set()
  for (const t of mustHave(rng, level)) closureOf(t).forEach((x) => chosen.add(x))
  const order = rng.shuffle(PAGE_TYPES.filter((t) => !chosen.has(t)))
  let progress = true
  while (chosen.size < n && progress) {
    progress = false
    for (const t of order) {
      if (chosen.has(t)) continue
      const need = closureOf(t).filter((x) => !chosen.has(x))
      if (chosen.size + need.length > n) continue
      need.forEach((x) => chosen.add(x))
      progress = true
      if (chosen.size >= n) break
    }
  }
  return PAGE_TYPES.filter((t) => chosen.has(t))
}

/** Pool de bugs elegibles: tienen al menos una pagina presente donde pueden manifestarse (con los campos que
 *  necesitan: BUG_REQUIRES) y su dificultad no esta excluida por el nivel. `data` opcional: sin el, solo cuentan las capacidades. */
export function bugPool(pages, level, capabilities = capabilitiesOf(pages), data) {
  const { weights } = LEVEL_CONFIG[normalizeLevel(level)]
  return BUGS.filter((b) => weights[b.difficulty] > 0 && b.pages.some((p) => pages.includes(p) && bugFitsPage(b.id, p, data)) && requiresMet(b, capabilities))
}

/**
 * Parametros por bug (N de los intermitentes, offset de zona, palabra prohibida...): cada bug con
 * `params(rng)` los sortea en su PROPIO sub-stream de la semilla, activo o no. Asi agregar bugs al catalogo
 * o activar/desactivar flags no cambia el contenido de ninguna semilla existente.
 */
export function genBugParams(seed, bugs = BUGS) {
  const out = {}
  for (const b of bugs) if (typeof b.params === 'function') out[b.id] = b.params(createRng(seed).fork(`bug:${b.id}`))
  return out
}

function weightedSample(rng, items, weightOf, n) {
  const pool = items.map((it) => ({ it, w: weightOf(it) }))
  const out = []
  while (out.length < n && pool.length) {
    const sum = pool.reduce((s, x) => s + x.w, 0)
    let r = rng.next() * sum
    let i = 0
    for (; i < pool.length - 1; i++) {
      r -= pool[i].w
      if (r < 0) break
    }
    out.push(pool.splice(i, 1)[0].it)
  }
  return out
}

export function generateSite(seed, level) {
  const lvl = normalizeLevel(level)
  const cfg = LEVEL_CONFIG[lvl]
  const base = createRng(String(seed))
  const lrng = createRng(`${seed}|${lvl}`)

  const theme = base.pick(THEMES) // PRIMER sorteo del stream de contenido: el tema no depende de los bugs ni del nivel
  const style = {
    hue: (theme.style.hue + base.int(-18, 18) + 360) % 360,
    font: theme.style.font,
    radius: theme.style.radius + base.int(0, 4),
    header: base.pick(['bar', 'banner', 'minimal']),
    density: base.pick(['cozy', 'compact']),
    width: base.pick([760, 880, 1000]),
  }
  const data = genData(base, theme)

  const pages = pickPages(lrng, cfg.pages, lvl)
  const capabilities = capabilitiesOf(pages, data)

  // Bugs: cantidad del rango del nivel, acotada al pool compatible (el catalogo tiene bugs unicos por id).
  const pool = bugPool(pages, lvl, capabilities, data)
  const count = Math.min(lrng.int(cfg.bugs[0], cfg.bugs[1]), pool.length)
  const chosen = weightedSample(lrng, pool, (b) => cfg.weights[b.difficulty], count)
  const chosenIds = new Set(chosen.map((b) => b.id))
  const bugs = BUGS.filter((b) => chosenIds.has(b.id)).map((b) => b.id) // orden estable del catalogo
  const bugPages = {}
  for (const b of BUGS) {
    if (!chosenIds.has(b.id)) continue
    bugPages[b.id] = lrng.pick(b.pages.filter((p) => pages.includes(p) && bugFitsPage(b.id, p, data))) // la pagina donde se manifiesta
  }

  // Zona horaria simulada del sitio (la maquina no cuenta): sub-stream propio.
  const tzOffsetMinutes = base.fork('tz').pick([-480, -300, -180, 0, 60, 330, 540])

  return { seed: String(seed), level: lvl, themeId: theme.id, style, pages, capabilities, tzOffsetMinutes, data, bugs, bugPages, bugParams: genBugParams(seed) }
}
