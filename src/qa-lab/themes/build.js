// Constructor compacto de temas (TASK-048). Los packs se escriben en una forma abreviada
// ('es|en' para cada texto bilingue) y defineTheme() la expande al esquema completo de schema.js.
// Es solo azucar de autoria: la salida es JSON plano, sin funciones ni referencias al motor.

export const b = (s) => {
  const parts = s.split('|')
  if (parts.length !== 2) throw new Error(`texto bilingue mal formado: "${s}"`)
  return { es: parts[0].trim(), en: parts[1].trim() }
}

export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const field = (key, type, label, required, rules = {}, options) => {
  const f = { key, type, label: b(label), required, rules }
  if (options) f.options = options.map((o) => { const t = b(o); return { value: slug(t.en), es: t.es, en: t.en } })
  return f
}

// Constructores de campos de dominio.
export const text = (key, label, rules = {}, required = true) => field(key, 'text', label, required, rules)
export const area = (key, label, maxLength = 300, required = false) => field(key, 'textarea', label, required, { maxLength })
export const num = (key, label, min, max, required = true) => field(key, 'number', label, required, { min, max })
export const date = (key, label, required = true) => field(key, 'date', label, required)
export const chk = (key, label, required = false) => field(key, 'checkbox', label, required)
export const sel = (key, label, options, required = true) => field(key, 'select', label, required, {}, options)
export const rad = (key, label, options, required = true) => field(key, 'radio', label, required, {}, options)
export const pat = (key, label, pattern, hint, required = true) => field(key, 'text', label, required, { pattern, patternHint: b(hint) })

const EMAIL = () => field('email', 'email', 'Correo electrónico|Email address', true, { maxLength: 120, pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', patternHint: b('Usá el formato nombre@dominio.ext|Use the format name@domain.ext') })
const PASSWORD = () => field('password', 'password', 'Contraseña|Password', true, { minLength: 8, maxLength: 64 })

const noun = (s) => {
  const [es, esPlural, en, enPlural] = s.split('|')
  if (!enPlural) throw new Error(`sustantivo mal formado: "${s}"`)
  return { es, en, esPlural, enPlural }
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function defineTheme(family, s) {
  const nouns = { item: noun(s.nouns[0]), customer: noun(s.nouns[1]), order: noun(s.nouns[2]), category: noun(s.nouns[3]) }
  const [home, cart, checkout, dashboard, blog] = s.nav.map(b)
  const categories = s.cats.map((c) => { const t = b(c); return { id: slug(t.en), es: t.es, en: t.en } })
  const items = s.items.map(([name, desc, price, cat], i) => {
    const n = b(name)
    return { id: slug(n.en), name: n, desc: b(desc), price, category: categories[cat].id, stock: ((Math.round(price * 7) + i * 13) % 40) + 3 }
  })
  const wizardFields = []
  const steps = s.wiz.steps.map(([title, fields]) => {
    wizardFields.push(...fields)
    return { title: b(title), fieldKeys: fields.map((f) => f.key) }
  })
  const [ifField, equals, thenShow] = s.wiz.cond
  const [c1, c2, c3, c4] = s.dash.cols
  return {
    id: s.id,
    family,
    name: b(s.name),
    tagline: b(s.tag),
    style: { hue: s.style[0], accentHue: s.style[1], font: s.style[2], radius: s.style[3], mood: s.style[4] },
    currency: { symbol: s.cur[0], code: s.cur[1], decimals: s.cur[2], position: s.cur[3] || 'before' },
    nouns,
    nav: {
      home, cart, checkout, dashboard, blog,
      catalog: { es: cap(nouns.item.esPlural), en: cap(nouns.item.enPlural) },
      detail: { es: `Ficha de ${nouns.item.es}`, en: `${cap(nouns.item.en)} details` },
      account: { es: `Mi cuenta de ${nouns.customer.es}`, en: `My ${nouns.customer.en} account` },
      contact: { es: 'Contacto', en: 'Contact' },
      faq: { es: 'Preguntas frecuentes', en: 'FAQ' },
      signup: { es: `Registro de ${nouns.customer.es}`, en: `${cap(nouns.customer.en)} sign-up` },
    },
    categories,
    items,
    signupFields: [EMAIL(), PASSWORD(), ...s.fields],
    contactSubjects: s.contact.map(b),
    faq: s.faq.map(([q, a]) => ({ q: b(q), a: b(a) })),
    posts: s.posts.map(([title, excerpt, author]) => ({ title: b(title), excerpt: b(excerpt), author })),
    wizard: { title: b(s.wiz.title), steps, conditional: { ifField, equals, thenShow } },
    wizardFields,
    dashboard: {
      columns: [
        { key: 'subject', ...b(c1), type: 'text' },
        { key: 'quantity', ...b(c2), type: 'number' },
        { key: 'date', ...b(c3), type: 'date' },
        { key: 'amount', ...b(c4), type: 'money' },
      ],
      rowTemplate: {
        count: 18,
        pools: { subject: s.dash.pool.map(b) },
        ranges: { quantity: { min: s.dash.n[0], max: s.dash.n[1] }, date: { from: '2026-01-01', to: '2026-12-31' }, amount: { min: s.dash.m[0], max: s.dash.m[1] } },
      },
    },
  }
}
