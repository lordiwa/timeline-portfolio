// Utilidades compartidas de los specs del QA Lab (no es un spec: vitest solo corre *.spec.js).
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { FIELD_DEFS } from '../../src/qa-lab/generator/fields.js'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { capabilitiesOf } from '../../src/qa-lab/generator/capabilities.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { memoryStorage } from '../../src/qa-lab/state/store.js'
import SiteRoot from '../../src/qa-lab/components/SiteRoot.vue'

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
export function forceSite({ seed = 'force-1', level = 'semi', pages, bugs = {}, params = {}, data = {} }) {
  const base = generateSite(seed, level)
  const p = pages || base.pages
  const d = { ...base.data, ...data }
  return { ...base, pages: p, data: d, capabilities: capabilitiesOf(p, d), bugs: Object.keys(bugs), bugPages: { ...bugs }, bugParams: { ...base.bugParams, ...params } }
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

// ---------------------------------------------------------------- TASK-049
/** Vigilante de consola: console.error / warn / log, window.error y rechazos sin manejar quedan en `seen` (lista permitida VACIA). */
export function watchConsole() {
  const seen = []
  const spies = ['error', 'warn', 'log'].map((m) => vi.spyOn(console, m).mockImplementation((...a) => { seen.push(`console.${m}: ${a.map((x) => (x && x.message) || String(x)).join(' ')}`) }))
  const onErr = (e) => seen.push(`window.error: ${e.message}`)
  const onRej = (e) => seen.push(`unhandledrejection: ${String(e.reason)}`)
  window.addEventListener('error', onErr)
  window.addEventListener('unhandledrejection', onRej)
  return {
    seen,
    stop() {
      spies.forEach((s) => s.mockRestore())
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
    },
  }
}

/** Valor valido para un campo del lab segun su definicion (para recorrer formularios con datos correctos). */
export function validValue(key, n = 0) {
  const def = FIELD_DEFS[key]
  if (key === 'card') return '4111111111111111'
  if (key === 'address') return 'Calle 1'
  if (key === 'email') return `qa${n}@example.com`
  if (key === 'birth') return '2000-05-10'
  if (def.type === 'password') return 'abcdefgh'
  if (def.type === 'number') return '30'
  if (def.type === 'select') return '1'
  if (def.type === 'radio') return '0'
  if (def.type === 'checkbox') return key === 'terms'
  if (def.type === 'textarea') return 'hola mundo'
  return 'Ana Perez'
}

/** Completa con datos validos TODOS los campos que el DOM muestra ahora (vuelve a mirar: un check puede mostrar mas campos). */
export async function fillVisible(w, n = 0) {
  for (let pass = 0; pass < 3; pass++) {
    const keys = w.findAll('[data-field]').map((b) => b.attributes('data-field'))
    for (const k of keys) await fill(w, { [k]: validValue(k, n) })
  }
}
