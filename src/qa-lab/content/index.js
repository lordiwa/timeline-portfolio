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
//   content.nouns        { item, customer, order, category }
//   content.currency     { symbol, code, decimals }
//   content.money(n)     n en unidades mayores -> "$12.50"   (el motor de totales calcula en 2 decimales)
//   content.nav          { home, list, cart, blog, faq, contact, dashboard, wizard, login, signup, account }
//   content.categories   string[]                       (indice = item.category)
//   content.items        [{ id, name, desc, price, category }]   id/price/category vienen del generador
//   content.cta          string                         texto del boton de compra
//   content.faq          [{ id, q, a }]
//   content.posts        [{ id, title, paragraphs[], comments:[{ author, text, minutes }] }]
//   content.subjects     string[]                       asuntos del formulario de contacto
//   content.dashboard    { rows:[{ id, person, concept, status, amount }], statuses[] }
//   content.field(key, overrides?)  -> { key, type, required, min?, max?, label, hint, options:[{value,text}] }
//                                     (pack: signupFields[] con label{es,en}, rules{...}, options)
//   content.stepTitle(stepId)       titulo de un paso del wizard (pack: wizard.steps[].title)
//
// Mapeo previsto del pack: items[] reemplaza a las filas de site.data.catalog por indice (el generador
// aporta id y precio base); faq/posts/dashboard salen de pack.faq / pack.posts / pack.dashboard.
import { FIELD_DEFS } from '../generator/fields.js'

const HINTS = { password: 'fields.hintPassword', age: 'fields.hintAge', email: 'fields.hintEmail' }

export function resolveContent(site, t) {
  const tt = (k, p) => t(`theme.${site.themeId}.${k}`, p)
  const currency = { symbol: '$', code: 'USD', decimals: 2 }
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
    nouns: { item: t('nouns.item'), customer: t('nouns.customer'), order: t('nouns.order'), category: t('nouns.category') },
    currency,
    money: (n) => `${currency.symbol}${Number(n).toFixed(currency.decimals)}`,
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
      rows: d.dashboard.rows.map((r) => ({ id: r.id, person: r.person, concept: tt(`item${r.itemIdx}`), status: r.cat, amount: r.price })),
      statuses: [0, 1, 2].map((i) => t(`list.status_${i}`)),
    },
    field,
    stepTitle: (id) => t(`wizard.step.${id}`),
  }
}
