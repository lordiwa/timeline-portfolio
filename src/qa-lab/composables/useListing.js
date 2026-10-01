// Busqueda + filtros combinados + orden + paginacion, compartidos por el listado y el dashboard.
// `state` es reactivo y puede vivir en el store (el listado conserva sus filtros al navegar).
import { reactive } from 'vue'

/**
 * rows: array o getter () => array (el contenido cambia con el idioma) de [{ ..., category|status, price|amount }]; opts: { pageSize, match(row, q), catOf(row), priceOf(row), searchOf() }.
 * searchOf: texto que se usa para filtrar (por defecto state.search; el bug stale-response-overwrites lo desacopla del input).
 * Los filtros se combinan con AND: busqueda, categoria/estado y precio maximo.
 */
export function useListing(rows, opts, has, state = reactive({ search: '', cat: '', price: '', sort: 'default', page: 1 })) {
  const getRows = typeof rows === 'function' ? rows : () => rows
  const catOf = opts.catOf || ((r) => r.category)
  const priceOf = opts.priceOf || ((r) => r.price)

  const filtered = () => {
    const q = String(opts.searchOf ? opts.searchOf() : state.search).trim().toLowerCase()
    let r = getRows().filter((x) =>
      (state.cat === '' || catOf(x) === Number(state.cat)) &&
      (state.price === '' || priceOf(x) <= Number(state.price)) &&
      opts.match(x, q))
    if (state.sort === 'priceAsc') r = r.slice().sort((a, b) => priceOf(a) - priceOf(b))
    if (state.sort === 'priceDesc') r = r.slice().sort((a, b) => priceOf(b) - priceOf(a))
    return r
  }
  const pages = () => Math.max(1, Math.ceil(filtered().length / opts.pageSize))
  const current = () => Math.min(Math.max(1, state.page), pages()) // un page viejo del storage nunca se sale de rango
  const pageRows = () => filtered().slice((current() - 1) * opts.pageSize, current() * opts.pageSize)
  const resetPage = () => { state.page = 1 }
  const set = (k, v) => { state[k] = v; resetPage() }
  function clear() {
    state.search = ''
    if (!has('filter-not-reset')) state.cat = '' // BUG filter-not-reset: el filtro de categoria/estado queda activo
    state.price = ''
    state.sort = 'default'
    resetPage()
  }
  return { state, filtered, pages, current, pageRows, resetPage, set, clear }
}
