// Utilidades compartidas de los specs del QA Lab (no es un spec: vitest solo corre *.spec.js).
import { mount } from '@vue/test-utils'
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
