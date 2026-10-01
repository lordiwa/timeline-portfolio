// CAPA DE CONTENIDO. Cablea los content packs de src/qa-lab/themes/ (TASK-048) a las paginas.
//
// Las paginas NO leen i18n ni los packs directo para el contenido del tema: leen un objeto `content`
// que arma resolveContent(site, t). Los textos de la interfaz (botones, errores, titulos de pagina tpl.*)
// siguen en i18n: no son contenido de tema. El pack se busca por site.themeId (getThemePack).
//
// resolveContent(site, t, locale?)  locale por defecto = t('lab.locale') ('es' | 'en'), asi la firma de dos
// argumentos sigue valiendo y el contenido se recalcula cuando cambia el idioma (t es reactivo en el computed).
//
// Interfaz (todo ya localizado al idioma activo, listo para pintar):
//   content.brand        string                         nombre de la marca (pack.name[locale])
//   content.tagline      string
//   content.nouns        { item, customer, order, category }, cada uno { one, many }   (pack: {es,en,esPlural,enPlural})
//   content.currency     { symbol, code, decimals, position:'before'|'after' }
//   content.money(n)     n en unidades mayores -> "$12.50" / "12.50 ¤" segun position (el motor calcula en `decimals` decimales)
//   content.priceBands   number[3]                      umbrales "hasta N" del filtro de precio, calculados de los precios del pack
//   content.nav          { home, list, cart, blog, faq, contact, dashboard, wizard, login, signup, account }
//   content.categories   string[]                       (indice = item.category = indice en pack.categories)
//   content.items        [{ id, name, desc, price, category }]   id/price/category vienen del generador (item del pack + variante)
//   content.cta          string                         texto del boton de compra ("Confirmar <pedido del tema>")
//   content.faq          [{ id, q, a }]
//   content.posts        [{ id, title, paragraphs[], comments:[{ author, text, minutes }] }]
//                        titulo y primer parrafo (excerpt) del pack; comentarios y parrafos de relleno genericos (i18n)
//   content.subjects     string[]                       asuntos del formulario de contacto (pack.contactSubjects)
//   content.dashboard    { columns:[{ key, label, type }], rows:[{ id, <col.key>..., amount, status }], statuses[] }
//                        columnas y filas de pack.dashboard (rowTemplate, valores sorteados por el generador).
//                        `status` NO es una columna del pack: lo sortea el generador por fila (0 activo / 1 pendiente /
//                        2 cerrado) y sus 3 etiquetas son genericas (i18n list.status_*); alimenta el filtro y el KPI.
//                        `amount` = la primera columna 'money'. date = 'YYYY-MM-DD'.
//   content.field(key, overrides?)  -> { key, type, required, min?, max?, minLength?, maxLength?, pattern?, patternHint?,
//                                        label, hint, options:[{value,text}], nameLike, noFuture }
//                                     campos del pack (signupFields / wizardFields, con sus rules) o genericos (contacto,
//                                     checkout, cuenta). checkField() aplica min/max/minLength/maxLength/pattern; para un
//                                     password, `min` = rules.minLength. nameLike = el campo que 'required-not-validated'
//                                     deja pasar vacio; noFuture = la fecha no puede ser futura (solo las de nacimiento/perdida).
//   content.stepTitle(stepId)       titulo de un paso del wizard (pack: wizard.steps[].title; 'confirm' es generico)
//
// Wizard: thenShow puede ser un array de claves (wizard/logic.js); los campos condicionales aparecen en algun paso
// y se muestran SOLO si ifField === equals.
import { fieldDef, nameLikeKey } from '../generator/fields.js'
import { getThemePack } from '../themes/index.js'

export { isoFromOffset } from '../generator/dates.js'

/** Umbral "bonito" (1, 1.5, 2, 3, 5...) cercano a n, con la magnitud de n. */
function nice(n) {
  const e = 10 ** Math.floor(Math.log10(n))
  return Number(Math.max(e / 100, (Math.round((n / e) * 2) / 2) * e).toPrecision(3))
}

export function resolveContent(site, t, locale = t('lab.locale')) {
  const pack = getThemePack(site.themeId)
  const L = (o) => o[locale]
  const { currency } = pack
  const d = site.data
  const noun = (k) => ({ one: L({ es: pack.nouns[k].es, en: pack.nouns[k].en }), many: L({ es: pack.nouns[k].esPlural, en: pack.nouns[k].enPlural }) })
  const nouns = Object.fromEntries(['item', 'customer', 'order', 'category'].map((k) => [k, noun(k)]))
  const money = (n) => {
    const v = Number(n).toFixed(currency.decimals)
    return currency.position === 'after' ? `${v} ${currency.symbol}` : `${currency.symbol}${v}`
  }
  const nameKeys = [nameLikeKey(pack.signupFields), nameLikeKey(pack.wizardFields), 'name']

  const field = (key, overrides = {}) => {
    const def = fieldDef(pack, key)
    const r = def.rules
    const label = def.label ? L(def.label) : t(`fields.${key}`)
    const patternHint = r.patternHint ? L(r.patternHint) : undefined
    const out = {
      key,
      type: def.type,
      required: def.required,
      label,
      options: (def.options || []).map((o) => ({ value: o.value, text: L(o) })),
      nameLike: nameKeys.includes(key),
      noFuture: /birth|lost/i.test(key), // fecha de nacimiento / perdida: no puede ser futura; las demas fechas del pack son plazos
    }
    for (const k of ['min', 'max', 'minLength', 'maxLength', 'pattern']) if (r[k] != null) out[k] = r[k]
    if (patternHint) out.patternHint = patternHint
    if (def.type === 'password') out.min = r.minLength ?? 8 // checkField valida el largo del password con `min`
    out.hint = patternHint || (def.type === 'number' ? t('fields.hintRange', { min: r.min, max: r.max }) : def.type === 'password' ? t('fields.hintPassword', { min: out.min }) : '')
    return { ...out, ...overrides }
  }

  const itemName = (r) => `${L(pack.items[r.itemIdx].name)}${r.variant ? ` ${r.variant + 1}` : ''}`
  const prices = d.catalog.map((r) => r.price).sort((a, b) => a - b)
  const priceBands = [...new Set([0.25, 0.5, 0.75].map((q) => nice(prices[Math.floor(q * (prices.length - 1))])))]
  const cols = pack.dashboard.columns
  const moneyKey = cols.find((c) => c.type === 'money')?.key

  return {
    brand: L(pack.name),
    tagline: L(pack.tagline),
    nouns,
    currency: { ...currency },
    money,
    priceBands,
    nav: {
      home: L(pack.nav.home), list: L(pack.nav.catalog), cart: L(pack.nav.cart),
      blog: L(pack.nav.blog), faq: L(pack.nav.faq), contact: L(pack.nav.contact), dashboard: L(pack.nav.dashboard), wizard: L(pack.wizard.title),
      login: t('nav.login'), signup: L(pack.nav.signup), account: L(pack.nav.account),
    },
    categories: pack.categories.map(L),
    items: d.catalog.map((r) => ({ id: r.id, name: itemName(r), desc: L(pack.items[r.itemIdx].desc), price: r.price, category: r.cat })),
    cta: t('checkout.cta', { order: nouns.order.one }),
    faq: d.faq.questions.map((i) => ({ id: i, q: L(pack.faq[i].q), a: L(pack.faq[i].a) })),
    posts: d.posts.map((p) => ({
      id: p.id,
      title: L(pack.posts[p.postIdx].title),
      paragraphs: [L(pack.posts[p.postIdx].excerpt), ...p.paragraphs.map((i) => t(`text.p${i}`))],
      comments: p.comments.map((c) => ({ author: c.author, text: t(`comment.c${c.textIdx}`), minutes: c.minutes })),
    })),
    subjects: pack.contactSubjects.map(L),
    dashboard: {
      columns: cols.map((c) => ({ key: c.key, label: L(c), type: c.type })),
      rows: d.dashboard.rows.map((r) => {
        const row = { id: r.id, status: r.status }
        for (const c of cols) row[c.key] = c.type === 'text' ? L(pack.dashboard.rowTemplate.pools[c.key][r[c.key]]) : r[c.key]
        row.amount = moneyKey ? r[moneyKey] : 0
        return row
      }),
      statuses: [0, 1, 2].map((i) => t(`list.status_${i}`)),
    },
    field,
    stepTitle: (id) => (id === 'confirm' ? t('wizard.step.confirm') : L(pack.wizard.steps[Number(id.slice(1)) - 1].title)),
  }
}
