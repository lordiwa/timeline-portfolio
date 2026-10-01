// Utilidades compartidas de los specs del QA Lab (no es un spec: vitest solo corre *.spec.js).
import { mount } from '@vue/test-utils'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { capabilitiesOf } from '../../src/qa-lab/generator/capabilities.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { memoryStorage } from '../../src/qa-lab/state/store.js'
import SiteRoot from '../../src/qa-lab/components/SiteRoot.vue'
import { getThemePack } from '../../src/qa-lab/themes/index.js'
import { resolveContent } from '../../src/qa-lab/content/index.js'

// Instancias montadas: un test que falla a mitad no debe dejar un sitio vivo escuchando hashchange (su guard
// redirigiria la ruta del test siguiente).
const mounted = new Set()
export function track(w) {
  mounted.add(w)
  return w
}
export function cleanup() {
  for (const w of mounted) { try { w.unmount() } catch { /* ya desmontado */ } }
  mounted.clear()
  document.body.innerHTML = ''
  window.location.hash = ''
}

export const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms))

/** Sitio generado con paginas y bugs forzados: bugs = { 'bug-id': 'pagina' } (vacio = sin bugs). */
export function forceSite({ seed = 'force-1', level = 'semi', pages, bugs = {} }) {
  const base = generateSite(seed, level)
  const p = pages || base.pages
  return { ...base, pages: p, capabilities: capabilitiesOf(p, base.data), bugs: Object.keys(bugs), bugPages: { ...bugs } }
}

export const ALL_PAGES = ['home', 'list', 'detail', 'cart', 'checkout', 'login', 'signup', 'account', 'contact', 'faq', 'dashboard', 'blog', 'wizard']

/** Monta el sitio en la ruta `hash` (p. ej. '#/cart'). */
export async function mountSite(site, { hash = '', locale = 'es', storage = memoryStorage(), env } = {}) {
  window.location.hash = hash
  await tick(5)
  const w = track(mount(SiteRoot, { props: { site, storage, env }, global: { plugins: [createLabI18n(locale)] }, attachTo: document.body }))
  await tick(5)
  return { w, storage, site }
}

/** Espera al proximo hashchange (con tope) y deja que Vue re-renderice. */
function afterHashChange(trigger) {
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener('hashchange', done); window.removeEventListener('popstate', done); clearTimeout(cap); setTimeout(resolve, 8) }
    const cap = setTimeout(done, 500)
    window.addEventListener('hashchange', done)
    window.addEventListener('popstate', done)
    trigger()
  })
}

/** Navega por hash y espera el hashchange. */
export function go(path) {
  const target = `#${path}`
  if (window.location.hash === target) return tick()
  return afterHashChange(() => { window.location.hash = target })
}
export const back = () => afterHashChange(() => window.history.back())
export const forward = () => afterHashChange(() => window.history.forward())

export const click = (w, label) => w.findAll('button').find((b) => b.text() === label)
export const here = () => window.location.hash

/** Completa un formulario por clave de campo. */
export async function fill(w, values) {
  for (const [key, v] of Object.entries(values)) {
    const box = w.find(`[data-field="${key}"]`)
    const el = box.find('select, textarea, input:not([type=radio])')
    if (typeof v === 'boolean') await box.find('input[type=checkbox]').setValue(v)
    else if (!el.exists()) await box.findAll('input[type=radio]')[Number(v)].setValue(true)
    else await el.setValue(v)
  }
}

// --- temas (TASK-048): sitios sobre un pack concreto y valores validos para sus formularios ---
const seedCache = new Map()
/** Primera semilla `th-<n>` cuyo sitio usa el tema `themeId` (determinista; evita depender de una semilla magica). */
export function seedForTheme(themeId) {
  if (!seedCache.has(themeId)) {
    for (let i = 0; ; i++) {
      if (i > 20000) throw new Error(`ninguna semilla da el tema ${themeId}`)
      if (generateSite(`th-${i}`, 'semi').themeId === themeId) { seedCache.set(themeId, `th-${i}`); break }
    }
  }
  return seedCache.get(themeId)
}
/** forceSite sobre un tema. */
export const themeSite = (themeId, opts = {}) => forceSite({ ...opts, seed: seedForTheme(themeId) })

/** Formateador de dinero con la moneda del pack del sitio (igual que content.money). */
export function moneyOf(site) {
  const { symbol, decimals, position } = getThemePack(site.themeId).currency
  return (n) => (position === 'after' ? `${Number(n).toFixed(decimals)} ${symbol}` : `${symbol}${Number(n).toFixed(decimals)}`)
}

/** Texto minimo que cumple un patron de los packs (literales, \d, [clases], {n}/{n,m}, ?): se verifica contra la propia regex. */
export function sampleFromPattern(source) {
  const body = source.replace(/^\^/, '').replace(/\$$/, '')
  let out = ''
  for (let i = 0; i < body.length;) {
    let ch
    if (body[i] === '[') {
      const end = body.indexOf(']', i)
      const cls = body.slice(i + 1, end)
      ch = cls[0] === '\\' ? (cls[1] === 'd' ? '0' : cls[1]) : cls[0]
      i = end + 1
    } else if (body[i] === '\\') {
      ch = body[i + 1] === 'd' ? '0' : body[i + 1]
      i += 2
    } else { ch = body[i]; i += 1 }
    let n = 1
    const q = /^\{(\d+)(?:,(\d+))?\}/.exec(body.slice(i))
    if (q) { n = Number(q[1]); i += q[0].length } else if (body[i] === '?') { n = 0; i += 1 }
    out += ch.repeat(n)
  }
  if (!new RegExp(source).test(out)) throw new Error(`sampleFromPattern: "${out}" no cumple ${source}`)
  return out
}

/** Valor valido (para fill) de un campo de content.field(). Radio: indice de la opcion; select: su value. */
export function validValue(f) {
  if (f.type === 'checkbox') return true
  if (f.type === 'radio') return '0'
  if (f.type === 'select') return f.options[0].value
  if (f.type === 'email') return 'ana@example.com'
  if (f.type === 'password') return 'x'.repeat(Math.max(f.min ?? 8, 8))
  if (f.type === 'number') return String(Math.ceil((f.min + f.max) / 2))
  if (f.type === 'date') return f.noPast ? '2099-01-01' : '2000-01-01'
  if (f.pattern) return sampleFromPattern(f.pattern)
  const text = 'Ana Perez Lopez'.padEnd(f.minLength ?? 0, 'x')
  return f.maxLength ? text.slice(0, f.maxLength) : text
}

/** content.field(key) del sitio. */
export const fieldOf = (site, key, locale = 'es') => resolveContent(site, createLabI18n(locale).global.t).field(key)

/** Valores validos para las claves dadas (+ overrides). */
export function validValues(site, keys, overrides = {}) {
  return Object.fromEntries(keys.map((k) => [k, k in overrides ? overrides[k] : validValue(fieldOf(site, k))]))
}

/** Completa con valores validos todos los campos visibles ahora (el paso actual del wizard/checkout, o un formulario entero). */
export async function fillVisible(w, site, overrides = {}) {
  const keys = w.findAll('[data-field]').map((e) => e.attributes('data-field'))
  await fill(w, validValues(site, keys, overrides))
}

/** Avanza el wizard (relleno valido + submit) hasta que el campo `key` esta en pantalla. */
export async function advanceWizardTo(w, site, key, overrides = {}) {
  for (let i = 0; i < 10 && !w.find(`[data-field="${key}"]`).exists(); i++) {
    await fillVisible(w, site, overrides)
    await w.find('form').trigger('submit')
  }
}
