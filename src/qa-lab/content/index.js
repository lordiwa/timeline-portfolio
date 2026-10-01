// CAPA DE CONTENIDO (preparada para content packs).
//
// Las paginas NO leen i18n ni themes.js directo para el contenido del tema: leen un objeto `content`
// que arma resolveContent(site, t). Cablear los packs de src/qa-lab/themes/ (TASK-048) es reemplazar
// ESTE adaptador; las paginas no cambian. Los textos de la interfaz (botones, errores, titulos de
// pagina tpl.*) siguen en i18n: no son contenido de tema.
//
// Interfaz (todo ya localizado al idioma activo, listo para pintar):
//   content.brand        string                         nombre de la marca (pack: name[locale])
//   content.tagline      string
//   content.nouns        { item, customer, order, category }, cada uno { one, many }   (pack: {es,en,esPlural,enPlural})
//   content.currency     { symbol, code, decimals, position:'before'|'after' }
//   content.money(n)     n en unidades mayores -> "$12.50" / "12.50 ¤" segun position (el motor calcula en 2 decimales)
//   content.nav          { home, list, cart, blog, faq, contact, dashboard, wizard, login, signup, account }
//   content.categories   string[]                       (indice = item.category)
//   content.items        [{ id, name, desc, price, category }]   id/price/category vienen del generador
//   content.cta          string                         texto del boton de compra
//   content.faq          [{ id, q, a }]
//   content.posts        [{ id, title, paragraphs[], comments:[{ author, text, minutes }] }]
//   content.subjects     string[]                       asuntos del formulario de contacto
//   content.dashboard    { columns:[{ key, label, type }], rows:[{ id, subject, quantity, date, amount, status }], statuses[] }
//                        4 columnas fijas (subject, quantity, date, amount) = rowTemplate de los packs; `status` es un
//                        derivado del adaptador (filtro y KPI), no una columna del pack. date = 'YYYY-MM-DD'.
//   content.field(key, overrides?)  -> { key, type, required, min?, max?, minLength?, maxLength?, pattern?, patternHint?,
//                                        label, hint, options:[{value,text}] }
//                                     (pack: signupFields[] con label{es,en}, rules{...}, options). checkField() aplica
//                                     min/max/minLength/maxLength/pattern (string con la fuente de la regex).
//   content.stepTitle(stepId)       titulo de un paso del wizard (pack: wizard.steps[].title)
//
// Wizard: thenShow puede ser un array de claves (wizard/logic.js); los campos condicionales aparecen en algun paso
// y se muestran SOLO si ifField === equals.
//
// Mapeo previsto del pack: items[] reemplaza a las filas de site.data.catalog por indice (el generador
// aporta id y precio base); faq/posts/dashboard salen de pack.faq / pack.posts / pack.dashboard.
import { FIELD_DEFS } from '../generator/fields.js'

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] // el calendario del lab es 2026 (sin bisiestos)

/** dayOffset 0..364 -> 'YYYY-MM-DD' (aritmetica pura: sin Date, sin zona horaria de la maquina). */
export function isoFromOffset(offset) {
  let d = ((offset % 365) + 365) % 365
  let m = 0
  while (d >= MONTH_DAYS[m]) {
    d -= MONTH_DAYS[m]
    m += 1
  }
  return `2026-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`
}

const HINTS = { password: 'fields.hintPassword', age: 'fields.hintAge', email: 'fields.hintEmail' }

export function resolveContent(site, t) {
  const tt = (k, p) => t(`theme.${site.themeId}.${k}`, p)
  const currency = { symbol: '$', code: 'USD', decimals: 2, position: 'before' }
  const itemName = (r) => `${tt(`item${r.itemIdx}`)} ${r.variant}`

  const field = (key, overrides = {}) => {
    const def = FIELD_DEFS[key]
    return {
      key,
      ...def,
      label: t(`fields.${key}`),
      hint: HINTS[key] ? t(HINTS[key]) : '',
      options: Array.from({ length: def.options || 0 }, (_, i) => ({ value: String(i), text: t(`opt.${key}_${i}`) })),
      ...overrides,
    }
  }

  const d = site.data
  return {
    brand: tt(`name${site.brandIdx}`),
    tagline: tt('tagline'),
    nouns: Object.fromEntries(['item', 'customer', 'order', 'category'].map((k) => [k, { one: t(`nouns.${k}`), many: t(`nouns.${k}Plural`) }])),
    currency,
    money: (n) => {
      const v = Number(n).toFixed(currency.decimals)
      return currency.position === 'after' ? `${v} ${currency.symbol}` : `${currency.symbol}${v}`
    },
    nav: Object.fromEntries(['home', 'list', 'cart', 'blog', 'faq', 'contact', 'dashboard', 'wizard', 'login', 'signup', 'account'].map((k) => [k, t(`nav.${k}`)])),
    categories: [0, 1, 2].map((i) => tt(`cat${i}`)),
    items: d.catalog.map((r) => ({ id: r.id, name: itemName(r), desc: t(`desc.d${r.id % 6}`, { item: itemName(r) }), price: r.price, category: r.cat })),
    cta: tt('cta'),
    faq: d.faq.questions.map((i) => ({ id: i, q: t(`faq.q${i}`), a: t(`faq.a${i}`) })),
    posts: d.posts.map((p) => ({
      id: p.id,
      title: p.titleIdx < 0 ? tt('article') : t(`blog.title${p.titleIdx}`),
      paragraphs: p.paragraphs.map((i) => t(`text.p${i}`)),
      comments: p.comments.map((c) => ({ author: c.author, text: t(`comment.c${c.textIdx}`), minutes: c.minutes })),
    })),
    subjects: [0, 1, 2, 3].map((i) => t(`opt.subject_${i}`)),
    dashboard: {
      columns: [
        { key: 'subject', label: t('list.colSubject'), type: 'text' },
        { key: 'quantity', label: t('list.colQuantity'), type: 'number' },
        { key: 'date', label: t('list.colDate'), type: 'date' },
        { key: 'amount', label: t('list.colAmount'), type: 'money' },
      ],
      rows: d.dashboard.rows.map((r) => ({
        id: r.id, subject: `${r.person} · ${tt(`item${r.itemIdx}`)}`, quantity: r.quantity, date: isoFromOffset(r.dayOffset), amount: r.price, status: r.cat,
      })),
      statuses: [0, 1, 2].map((i) => t(`list.status_${i}`)),
    },
    field,
    stepTitle: (id) => t(`wizard.step.${id}`),
  }
}
