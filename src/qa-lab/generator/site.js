// generateSite(seed, level): funcion pura y determinista. Devuelve la descripcion JSON-serializable
// de un SITIO multi-pagina (sin textos: los textos salen de i18n / content segun idioma).
//
// Dos flujos de azar para que (seed) fije el "mundo" y (seed, level) fije la estructura:
//   - base  = createRng(seed)            -> tema, estilo y datos (catalogo, posts, cupon...). Igual en los 3 niveles.
//   - level = createRng(`${seed}|${level}`) -> que paginas hay, que bugs hay y en que pagina vive cada uno.
import { createRng } from './prng.js'
import { THEMES } from './themes.js'
import { NAMES } from './fields.js'
import { LEVEL_CONFIG, normalizeLevel } from './levels.js'
import { PAGE_TYPES, closureOf } from './pages.js'
import { BUGS } from '../bugs/catalog.js'

function genData(rng) {
  // --- catalogo (listado + detalle + carrito) ---
  const pageSize = rng.pick([4, 6, 8])
  const total = pageSize * rng.int(3, 5) + rng.int(1, pageSize - 1) // 4..6 paginas, la ultima parcial
  const seen = new Set()
  const catalog = []
  while (catalog.length < total) {
    const itemIdx = rng.int(0, 5)
    const variant = rng.int(1, 99)
    const key = `${itemIdx}:${variant}`
    if (seen.has(key)) continue // nombre unico por item
    seen.add(key)
    catalog.push({ id: catalog.length + 1, itemIdx, variant, price: rng.int(5, 480), cat: rng.int(0, 2) })
  }
  const list = { pageSize, skipAt: rng.int(1, 2), cols: rng.pick([2, 3, 4]) }

  // --- dashboard (tabla paginada) ---
  const dPageSize = rng.pick([4, 5, 6])
  const dashboard = {
    pageSize: dPageSize,
    skipAt: rng.int(1, 2),
    rows: Array.from({ length: dPageSize * rng.int(4, 6) }, (_, i) => ({
      id: i + 1, itemIdx: rng.int(0, 5), person: rng.pick(NAMES), price: rng.int(5, 480), cat: rng.int(0, 2),
    })),
  }

  // --- blog ---
  const posts = Array.from({ length: rng.int(3, 4) }, (_, i) => ({
    id: i + 1,
    titleIdx: i - 1, // -1 = titulo del tema; 0.. = blog.title<n>
    paragraphs: rng.sample([0, 1, 2, 3, 4, 5, 6, 7], 4),
    comments: Array.from({ length: rng.int(2, 5) }, () => ({ author: rng.pick(NAMES), textIdx: rng.int(0, 7), minutes: rng.int(2, 600) })),
  }))

  // --- faq ---
  const faq = { questions: rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 6), multiple: rng.chance(0.5), openFirst: rng.chance(0.5) }

  // --- checkout: cupon, envio, impuestos ---
  const pct = rng.pick([5, 10, 15, 20, 25])
  const coupon = { code: `${rng.pick(['SAVE', 'PROMO', 'DEAL', 'LAB'])}${pct}`, pct }
  const standard = rng.int(3, 8)
  const shipping = { standard, express: standard + rng.int(5, 12), pickup: 0 }
  const taxRate = rng.pick([7, 10, 16, 21])
  const checkoutExtras = rng.sample(['notes', 'newsletter', 'giftwrap'], rng.int(1, 2))

  // --- cuenta de practica (login) ---
  const demoName = rng.pick(NAMES)
  const demoUser = { name: demoName, email: `${demoName.toLowerCase()}@example.com`, password: `qa-${rng.int(100000, 999999)}` }

  // --- formularios (solo claves: content.field(key) arma el campo con su etiqueta) ---
  const signupFields = (rng.shuffle(['name', 'email', 'password', 'age', 'terms', ...rng.sample(['country', 'plan', 'bio', 'birth', 'newsletter'], rng.int(2, 3))]))
  const contactFields = (rng.shuffle(['name', 'email', 'subject', 'message', ...(rng.chance(0.6) ? ['phone'] : [])]))

  // --- wizard con validacion condicional: 4 pasos base, +1 si withPrefs, +1 si el plan es Premium (opcion 2) ---
  const withPrefs = rng.chance(0.5)
  const wizard = {
    steps: [
      { id: 'data', fields: rng.shuffle(['name', 'email']) },
      { id: 'security', fields: rng.shuffle(['password', 'age']) },
      { id: 'profile', fields: ['plan', 'country', 'isCompany', 'company'] },
      ...(withPrefs ? [{ id: 'prefs', fields: ['newsletter', 'frequency'] }] : []),
      { id: 'payment', fields: ['card'] },
      { id: 'confirm', fields: ['terms'] },
    ],
    conditionals: [
      { ifField: 'isCompany', equals: true, thenShow: 'company', kind: 'field' },
      ...(withPrefs ? [{ ifField: 'newsletter', equals: true, thenShow: 'frequency', kind: 'field' }] : []),
      { ifField: 'plan', equals: '2', thenShow: 'payment', kind: 'step' },
    ],
  }

  // Campo "objetivo" de los bugs de accesibilidad (missing-label / tab-order) por pagina.
  const labelTargets = {
    signup: rng.pick(['name', 'email', 'password', 'age']),
    contact: rng.pick(['name', 'subject', 'message']),
    wizard: rng.pick(['name', 'password', 'country']),
    checkout: rng.pick(['name', 'address', 'city', 'card']),
    list: 'search', dashboard: 'search', faq: 'search', blog: 'comment',
  }

  return { catalog, list, dashboard, posts, faq, coupon, shipping, taxRate, checkoutExtras, demoUser, signupFields, contactFields, wizard, labelTargets }
}

/** Elige el set de paginas: home siempre; las dependencias entran juntas; exactamente n paginas. */
function pickPages(rng, [min, max]) {
  const n = rng.int(min, max)
  const chosen = new Set(['home'])
  const order = rng.shuffle(PAGE_TYPES.filter((t) => t !== 'home'))
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

/** Pool de bugs elegibles: tienen al menos una pagina presente y su dificultad no esta excluida por el nivel. */
export function bugPool(pages, level) {
  const { weights } = LEVEL_CONFIG[normalizeLevel(level)]
  return BUGS.filter((b) => weights[b.difficulty] > 0 && b.pages.some((p) => pages.includes(p)))
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

  const theme = base.pick(THEMES)
  const style = {
    hue: (theme.hue + base.int(-18, 18) + 360) % 360,
    font: theme.font,
    radius: theme.radius + base.int(0, 4),
    header: base.pick(['bar', 'banner', 'minimal']),
    density: base.pick(['cozy', 'compact']),
    width: base.pick([760, 880, 1000]),
  }
  const brandIdx = base.int(0, 2)
  const data = genData(base)

  const pages = pickPages(lrng, cfg.pages)

  // Bugs: cantidad del rango del nivel, acotada al pool compatible (el catalogo tiene bugs unicos por id).
  const pool = bugPool(pages, lvl)
  const count = Math.min(lrng.int(cfg.bugs[0], cfg.bugs[1]), pool.length)
  const chosen = weightedSample(lrng, pool, (b) => cfg.weights[b.difficulty], count)
  const chosenIds = new Set(chosen.map((b) => b.id))
  const bugs = BUGS.filter((b) => chosenIds.has(b.id)).map((b) => b.id) // orden estable del catalogo
  const bugPages = {}
  for (const b of BUGS) {
    if (!chosenIds.has(b.id)) continue
    bugPages[b.id] = lrng.pick(b.pages.filter((p) => pages.includes(p))) // la pagina donde se manifiesta
  }

  return { seed: String(seed), level: lvl, themeId: theme.id, brandIdx, style, pages, data, bugs, bugPages }
}
