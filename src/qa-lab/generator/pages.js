// Tipos de pagina del sitio generado, dependencias entre ellos y tabla de rutas.
// Un sitio tiene como mucho UNA pagina de cada tipo, asi que el id de pagina == el tipo.
// Sin imports: lo usan el generador, el router y el catalogo de bugs.

export const PAGE_TYPES = [
  'home', 'list', 'detail', 'cart', 'checkout', 'login', 'signup', 'account',
  'contact', 'faq', 'dashboard', 'blog', 'wizard',
]

/** Tipos que no tienen sentido solos: van siempre juntos. */
export const REQUIRES = {
  detail: ['list'], // el detalle se abre desde el listado
  cart: ['list'], // el carrito se llena desde el listado / detalle
  checkout: ['cart'],
  signup: ['login'], // el registro vuelve al login
  account: ['login'], // la cuenta es protegida: el guard manda al login
}

export const PROTECTED = new Set(['account'])

/** Paginas que aparecen en la barra de navegacion principal (en este orden). */
export const NAV_TYPES = ['home', 'list', 'blog', 'faq', 'contact', 'dashboard', 'wizard', 'cart']

/** Clausura de dependencias de un tipo (incluye el propio tipo). */
export function closureOf(type) {
  const out = new Set()
  const visit = (t) => {
    if (out.has(t)) return
    out.add(t)
    for (const d of REQUIRES[t] || []) visit(d)
  }
  visit(type)
  return [...out]
}

const BASE = {
  home: '/', list: '/catalog', cart: '/cart', checkout: '/checkout', login: '/login',
  signup: '/signup', account: '/account', contact: '/contact', faq: '/faq',
  dashboard: '/dashboard', blog: '/blog', wizard: '/wizard',
}
const FIRST_SEGMENT = Object.fromEntries(Object.entries(BASE).map(([t, p]) => [p.split('/')[1] || '', t]))

/** Ruta de un tipo. detail y el post del blog llevan parametro. */
export function routePath(type, param) {
  if (type === 'detail') return `/catalog/${param ?? 1}`
  if (type === 'blog' && param != null) return `/blog/${param}`
  return BASE[type] || '/'
}

/** Normaliza: '/' inicial, sin '/' final (salvo la raiz). */
export function normalizePath(path) {
  let p = String(path || '').trim()
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/{2,}/g, '/')
  return p.length > 1 ? p.replace(/\/$/, '') : p
}

/**
 * Resuelve un path contra las paginas del sitio.
 * Devuelve { type, params } o { type: 'notfound', params: {} }.
 * `site.pages` = tipos presentes; `site.data.catalog` / `site.data.posts` validan los ids.
 */
export function matchPath(site, path) {
  const segs = normalizePath(path).split('/').filter(Boolean)
  const notfound = { type: 'notfound', params: {} }
  const has = (t) => site.pages.includes(t)
  if (segs.length === 0) return has('home') ? { type: 'home', params: {} } : notfound
  const type = FIRST_SEGMENT[segs[0]]
  if (!type || type === 'home') return notfound
  if (segs.length === 1) return has(type) ? { type, params: {} } : notfound
  if (segs.length === 2 && /^\d+$/.test(segs[1])) {
    const id = Number(segs[1])
    if (type === 'list' && has('detail') && site.data.catalog.some((r) => r.id === id)) return { type: 'detail', params: { id } }
    if (type === 'blog' && has('blog') && site.data.posts.some((p) => p.id === id)) return { type: 'blog', params: { id } }
  }
  return notfound
}

/** Ruta concreta de un tipo para un sitio dado (detail apunta al primer item). */
export function concretePath(site, type) {
  if (type === 'detail') return routePath('detail', site.data.catalog[0]?.id)
  return routePath(type)
}
