// Esquema de los content packs de temas del QA Lab (TASK-048).
//
// Un tema es DATO puro: no importa nada del motor y no esta cableado al generador.
// Forma completa (todo texto visible es {es, en}):
//
// {
//   id: 'kebab-case-unico',
//   family: 'everyday' | 'fantasy' | 'scifi' | 'absurd',
//   name: {es,en}, tagline: {es,en},
//   style: { hue:0-359, accentHue:0-359, font:'sans'|'serif'|'mono'|'rounded', radius:0-16,
//            mood:'clean'|'ornate'|'tech'|'playful' },
//   currency: { symbol, code, decimals, position:'before'|'after' },     // puede ser inventada
//   nouns: { item, customer, order, category }  // cada uno {es,en,esPlural,enPlural}
//   nav: { home, catalog, detail, cart, checkout, account, contact, faq, dashboard, blog, signup },
//   categories: [{id, es, en}] x 4-6,
//   items: [{ id, name, desc, price:number, category:<categories.id>, stock:int }] x 12+,
//   signupFields: [Field] x 6-10   (incluye siempre email y password),
//   contactSubjects: [{es,en}] x 4,
//   faq: [{ q, a }] x 5+,
//   posts: [{ title, excerpt, author:string }] x 3+,
//   wizard: { title, steps:[{ title, fieldKeys:[...] }] x 4-6,
//             conditional: { ifField, equals, thenShow:[fieldKeys] } },
//   wizardFields: [Field],
//   dashboard: { columns:[{key, es, en, type:'text'|'number'|'date'|'money'}] x 4-6, rowTemplate }
// }
//
// Field = { key, type:'text'|'email'|'password'|'number'|'date'|'select'|'radio'|'checkbox'|'textarea',
//           label:{es,en}, required:bool,
//           rules:{ min?, max?, minLength?, maxLength?, pattern?:string, patternHint?:{es,en} },
//           options?:[{value, es, en}]   // obligatorio en select y radio }
//
// AJUSTES respecto del pedido original (documentados a proposito):
//  - currency.position ('before'|'after'): el simbolo de una moneda inventada no siempre va delante.
//  - nouns.*: las claves son {es, en, esPlural, enPlural} (el pedido decia esPlural/enPlural solo
//    para "item"; se usa la misma forma en los cuatro sustantivos).
//  - dashboard.rowTemplate NO son filas fijas: es un generador determinista por semilla:
//      { count:number (>=15),
//        pools:{ <claveColumnaTexto>: [{es,en}] x 6+ },          // valores posibles de la columna de texto
//        ranges:{ <claveColumnaNumber|money>:{min,max}, <claveColumnaDate>:{from:'YYYY-MM-DD', to:'YYYY-MM-DD'} } }
//    Toda columna 'text' tiene su pool y toda columna number/money/date tiene su rango.
//  - wizard.conditional.thenShow: los campos listados tambien aparecen en algun paso, pero el
//    motor los muestra SOLO si el valor de ifField === equals (campos "ocultos por defecto").
//  - pattern se guarda como STRING (fuente de la regex, sin barras ni flags) para que sea dato JSON-able.
//  - Las opciones de select/radio llevan value = slug estable del texto en ingles.

export const FAMILIES = ['everyday', 'fantasy', 'scifi', 'absurd']
export const FIELD_TYPES = ['text', 'email', 'password', 'number', 'date', 'select', 'radio', 'checkbox', 'textarea']
export const FONTS = ['sans', 'serif', 'mono', 'rounded']
export const MOODS = ['clean', 'ornate', 'tech', 'playful']
export const COLUMN_TYPES = ['text', 'number', 'date', 'money']
export const NAV_KEYS = ['home', 'catalog', 'detail', 'cart', 'checkout', 'account', 'contact', 'faq', 'dashboard', 'blog', 'signup']
export const NOUN_KEYS = ['item', 'customer', 'order', 'category']
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const RULE_KEYS = ['min', 'max', 'minLength', 'maxLength', 'pattern', 'patternHint']

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const inRange = (n, a, b) => Number.isInteger(n) && n >= a && n <= b

function bi(v, path, errs) {
  if (!isObj(v)) return errs.push(`${path}: debe ser {es,en}`)
  if (!isStr(v.es)) errs.push(`${path}.es vacio o ausente`)
  if (!isStr(v.en)) errs.push(`${path}.en vacio o ausente`)
}

function count(arr, min, max, path, errs) {
  if (!Array.isArray(arr)) { errs.push(`${path}: debe ser un array`); return false }
  if (arr.length < min || arr.length > max) errs.push(`${path}: ${arr.length} elementos (esperado ${min}-${max === Infinity ? '+' : max})`)
  return true
}

export function validateField(f, path, errs) {
  if (!isObj(f)) return errs.push(`${path}: campo invalido`)
  if (!isStr(f.key)) errs.push(`${path}.key vacio`)
  if (!FIELD_TYPES.includes(f.type)) errs.push(`${path}.type invalido: ${f.type}`)
  bi(f.label, `${path}.label`, errs)
  if (typeof f.required !== 'boolean') errs.push(`${path}.required debe ser boolean`)
  if (!isObj(f.rules)) { errs.push(`${path}.rules debe ser objeto`); return }
  for (const k of Object.keys(f.rules)) if (!RULE_KEYS.includes(k)) errs.push(`${path}.rules.${k} no es una regla conocida`)
  const r = f.rules
  for (const k of ['min', 'max', 'minLength', 'maxLength']) {
    if (k in r && typeof r[k] !== 'number') errs.push(`${path}.rules.${k} debe ser numero`)
  }
  if ('min' in r && 'max' in r && r.min > r.max) errs.push(`${path}.rules min > max`)
  if ('minLength' in r && 'maxLength' in r && r.minLength > r.maxLength) errs.push(`${path}.rules minLength > maxLength`)
  if (f.type === 'number' && !('min' in r && 'max' in r)) errs.push(`${path}: un campo number necesita min y max`)
  if ('pattern' in r) {
    try { new RegExp(r.pattern) } catch { errs.push(`${path}.rules.pattern no compila`) }
    bi(r.patternHint, `${path}.rules.patternHint`, errs)
  } else if ('patternHint' in r) errs.push(`${path}.rules.patternHint sin pattern`)
  if (f.type === 'select' || f.type === 'radio') {
    if (!Array.isArray(f.options) || f.options.length < 2) errs.push(`${path}.options necesita 2 o mas opciones`)
    else f.options.forEach((o, i) => {
      if (!isStr(o.value)) errs.push(`${path}.options[${i}].value vacio`)
      if (!isStr(o.es)) errs.push(`${path}.options[${i}].es vacio`)
      if (!isStr(o.en)) errs.push(`${path}.options[${i}].en vacio`)
    })
  } else if (f.options !== undefined) errs.push(`${path}.options solo aplica a select/radio`)
}

export function validateTheme(t) {
  const errs = []
  if (!isObj(t)) return ['el tema debe ser un objeto']
  if (!isStr(t.id) || !KEBAB.test(t.id)) errs.push('id debe ser kebab-case')
  if (!FAMILIES.includes(t.family)) errs.push(`family invalida: ${t.family}`)
  bi(t.name, 'name', errs)
  bi(t.tagline, 'tagline', errs)

  const s = t.style
  if (!isObj(s)) errs.push('style ausente')
  else {
    if (!inRange(s.hue, 0, 359)) errs.push('style.hue fuera de 0-359')
    if (!inRange(s.accentHue, 0, 359)) errs.push('style.accentHue fuera de 0-359')
    if (!FONTS.includes(s.font)) errs.push('style.font invalida')
    if (!inRange(s.radius, 0, 16)) errs.push('style.radius fuera de 0-16')
    if (!MOODS.includes(s.mood)) errs.push('style.mood invalido')
  }

  const c = t.currency
  if (!isObj(c)) errs.push('currency ausente')
  else {
    if (!isStr(c.symbol)) errs.push('currency.symbol vacio')
    if (!isStr(c.code)) errs.push('currency.code vacio')
    if (!inRange(c.decimals, 0, 4)) errs.push('currency.decimals fuera de 0-4')
    if (!['before', 'after'].includes(c.position)) errs.push('currency.position invalida')
  }

  if (!isObj(t.nouns)) errs.push('nouns ausente')
  else for (const k of NOUN_KEYS) {
    const n = t.nouns[k]
    if (!isObj(n)) { errs.push(`nouns.${k} ausente`); continue }
    for (const l of ['es', 'en', 'esPlural', 'enPlural']) if (!isStr(n[l])) errs.push(`nouns.${k}.${l} vacio`)
  }

  if (!isObj(t.nav)) errs.push('nav ausente')
  else for (const k of NAV_KEYS) bi(t.nav[k], `nav.${k}`, errs)

  const catIds = new Set()
  if (count(t.categories, 4, 6, 'categories', errs)) t.categories.forEach((k, i) => {
    if (!isStr(k.id) || !KEBAB.test(k.id)) errs.push(`categories[${i}].id invalido`)
    if (catIds.has(k.id)) errs.push(`categories[${i}].id duplicado`)
    catIds.add(k.id)
    if (!isStr(k.es)) errs.push(`categories[${i}].es vacio`)
    if (!isStr(k.en)) errs.push(`categories[${i}].en vacio`)
  })

  if (count(t.items, 12, Infinity, 'items', errs)) {
    const ids = new Set()
    t.items.forEach((it, i) => {
      const p = `items[${i}]`
      if (!isStr(it.id) || !KEBAB.test(it.id)) errs.push(`${p}.id invalido`)
      if (ids.has(it.id)) errs.push(`${p}.id duplicado`)
      ids.add(it.id)
      bi(it.name, `${p}.name`, errs)
      bi(it.desc, `${p}.desc`, errs)
      if (typeof it.price !== 'number' || !(it.price > 0)) errs.push(`${p}.price debe ser numero > 0`)
      if (!catIds.has(it.category)) errs.push(`${p}.category no existe: ${it.category}`)
      if (!Number.isInteger(it.stock) || it.stock < 0) errs.push(`${p}.stock debe ser entero >= 0`)
    })
  }

  const signupKeys = new Set()
  if (count(t.signupFields, 6, 10, 'signupFields', errs)) {
    t.signupFields.forEach((f, i) => { validateField(f, `signupFields[${i}]`, errs); signupKeys.add(f.key) })
    if (!t.signupFields.some((f) => f.type === 'email')) errs.push('signupFields necesita un campo email')
    if (!t.signupFields.some((f) => f.type === 'password')) errs.push('signupFields necesita un campo password')
    if (signupKeys.size !== t.signupFields.length) errs.push('signupFields con keys duplicadas')
  }

  if (count(t.contactSubjects, 4, 4, 'contactSubjects', errs)) t.contactSubjects.forEach((s2, i) => bi(s2, `contactSubjects[${i}]`, errs))
  if (count(t.faq, 5, Infinity, 'faq', errs)) t.faq.forEach((q, i) => { bi(q.q, `faq[${i}].q`, errs); bi(q.a, `faq[${i}].a`, errs) })
  if (count(t.posts, 3, Infinity, 'posts', errs)) t.posts.forEach((p, i) => {
    bi(p.title, `posts[${i}].title`, errs); bi(p.excerpt, `posts[${i}].excerpt`, errs)
    if (!isStr(p.author)) errs.push(`posts[${i}].author vacio`)
  })

  const wKeys = new Set()
  if (!Array.isArray(t.wizardFields) || t.wizardFields.length < 1) errs.push('wizardFields vacio')
  else {
    t.wizardFields.forEach((f, i) => { validateField(f, `wizardFields[${i}]`, errs); wKeys.add(f.key) })
    if (wKeys.size !== t.wizardFields.length) errs.push('wizardFields con keys duplicadas')
  }
  const w = t.wizard
  if (!isObj(w)) errs.push('wizard ausente')
  else {
    bi(w.title, 'wizard.title', errs)
    if (count(w.steps, 4, 6, 'wizard.steps', errs)) w.steps.forEach((st, i) => {
      bi(st.title, `wizard.steps[${i}].title`, errs)
      if (!Array.isArray(st.fieldKeys) || st.fieldKeys.length < 1) errs.push(`wizard.steps[${i}].fieldKeys vacio`)
      else st.fieldKeys.forEach((k) => { if (!wKeys.has(k)) errs.push(`wizard.steps[${i}] apunta a un fieldKey inexistente: ${k}`) })
    })
    const cd = w.conditional
    if (!isObj(cd)) errs.push('wizard.conditional ausente')
    else {
      const ifF = (t.wizardFields || []).find((f) => f.key === cd.ifField)
      if (!ifF) errs.push(`wizard.conditional.ifField inexistente: ${cd.ifField}`)
      else if (ifF.options && !ifF.options.some((o) => o.value === cd.equals)) errs.push('wizard.conditional.equals no es una opcion de ifField')
      if (!Array.isArray(cd.thenShow) || cd.thenShow.length < 1) errs.push('wizard.conditional.thenShow vacio')
      else cd.thenShow.forEach((k) => {
        if (!wKeys.has(k)) errs.push(`wizard.conditional.thenShow inexistente: ${k}`)
        if (k === cd.ifField) errs.push('thenShow no puede contener a ifField')
        if (Array.isArray(w.steps) && !w.steps.some((st) => (st.fieldKeys || []).includes(k))) errs.push(`thenShow ${k} no esta en ningun paso`)
      })
    }
  }

  const d = t.dashboard
  if (!isObj(d)) errs.push('dashboard ausente')
  else {
    if (count(d.columns, 4, 6, 'dashboard.columns', errs)) d.columns.forEach((col, i) => {
      if (!isStr(col.key)) errs.push(`dashboard.columns[${i}].key vacio`)
      if (!isStr(col.es)) errs.push(`dashboard.columns[${i}].es vacio`)
      if (!isStr(col.en)) errs.push(`dashboard.columns[${i}].en vacio`)
      if (!COLUMN_TYPES.includes(col.type)) errs.push(`dashboard.columns[${i}].type invalido`)
    })
    const rt = d.rowTemplate
    if (!isObj(rt)) errs.push('dashboard.rowTemplate ausente')
    else {
      if (!Number.isInteger(rt.count) || rt.count < 15) errs.push('rowTemplate.count debe ser entero >= 15')
      for (const col of d.columns || []) {
        if (col.type === 'text') {
          const pool = rt.pools && rt.pools[col.key]
          if (!Array.isArray(pool) || pool.length < 6) errs.push(`rowTemplate.pools.${col.key} necesita 6 o mas valores`)
          else pool.forEach((v, i) => bi(v, `rowTemplate.pools.${col.key}[${i}]`, errs))
        } else {
          const r = rt.ranges && rt.ranges[col.key]
          if (!isObj(r)) errs.push(`rowTemplate.ranges.${col.key} ausente`)
          else if (col.type === 'date') {
            if (!isStr(r.from) || !isStr(r.to) || !(r.from < r.to)) errs.push(`rowTemplate.ranges.${col.key} necesita from < to (YYYY-MM-DD)`)
          } else if (typeof r.min !== 'number' || typeof r.max !== 'number' || r.min > r.max) errs.push(`rowTemplate.ranges.${col.key} necesita min <= max`)
        }
      }
    }
  }
  return errs
}
