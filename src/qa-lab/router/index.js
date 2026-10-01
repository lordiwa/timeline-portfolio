// Router propio por hash (#/ruta?query). Sin vue-router. El historial (atras / adelante) sale gratis
// de la navegacion nativa por hash: cada cambio de location.hash agrega una entrada y dispara hashchange.
// El seed y el nivel viven en el search de la URL (?seed=x&level=y), la ruta en el hash: un deep link
// completo es  ?seed=x&level=y#/ruta.
import { shallowRef } from 'vue'
import { PROTECTED, matchPath, normalizePath } from '../generator/pages.js'

/** '#/login?next=%2Faccount' -> { path: '/login', query: { next: '/account' } } */
export function parseHash(hash) {
  const h = String(hash || '').replace(/^#/, '')
  const qi = h.indexOf('?')
  const rawPath = qi < 0 ? h : h.slice(0, qi)
  let path = rawPath
  try { path = decodeURI(rawPath) } catch { /* path mal codificado: se usa tal cual */ }
  return {
    path: normalizePath(path),
    query: Object.fromEntries(new URLSearchParams(qi < 0 ? '' : h.slice(qi + 1))),
  }
}

/** Solo se acepta como destino una ruta interna que exista en este sitio (evita redirecciones raras). */
export function safeNext(site, next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return null
  const { path } = parseHash(`#${next}`)
  return matchPath(site, path).type === 'notfound' ? null : next
}

/**
 * Resuelve un hash contra el sitio y la sesion. Devuelve { type, params, path, query, redirect? }.
 * Guard: una ruta protegida sin sesion redirige a /login?next=<ruta>; con sesion, /login y /signup
 * redirigen al destino (next, o la cuenta si existe, o el inicio).
 */
export function resolveRoute(site, hash, authed) {
  const { path, query } = parseHash(hash)
  const m = matchPath(site, path)
  const route = { type: m.type, params: m.params, path, query }
  if (PROTECTED.has(m.type) && !authed) {
    return { ...route, redirect: `/login?next=${encodeURIComponent(path)}` }
  }
  if (authed && (m.type === 'login' || m.type === 'signup')) {
    return { ...route, redirect: safeNext(site, query.next) || (site.pages.includes('account') ? '/account' : '/') }
  }
  return route
}

export function createRouter(site, { isAuthed, win = window }) {
  const route = shallowRef(resolveRoute(site, win.location.hash, isAuthed()))

  function compute(hash = win.location.hash) {
    let r = resolveRoute(site, hash, isAuthed())
    for (let guard = 0; r.redirect && guard < 3; guard++) {
      win.location.replace(`#${r.redirect}`) // replace: la ruta bloqueada no queda en el historial
      r = resolveRoute(site, `#${r.redirect}`, isAuthed())
    }
    route.value = r
  }
  const onHash = () => compute()

  return {
    route,
    /** Re-evalua la ruta actual (la usa el sitio al cambiar la sesion). */
    refresh: () => compute(),
    start() {
      win.addEventListener('hashchange', onHash)
      compute()
    },
    stop() {
      win.removeEventListener('hashchange', onHash)
    },
    push(path) {
      const target = `#${path}`
      if (win.location.hash === target) return compute()
      win.location.hash = target
      compute(target)
    },
    replace(path) {
      win.location.replace(`#${path}`)
      compute(`#${path}`)
    },
  }
}
