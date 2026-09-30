// Estado + validacion de formularios. Los bugs de validacion viven aca (consultando flags).
import { reactive, ref } from 'vue'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function checkField(f, value, has) {
  const empty = f.type === 'checkbox' ? !value : String(value ?? '').trim() === ''
  if (f.required && empty) {
    if (has('required-not-validated') && f.key === 'name') return null // BUG
    return { key: 'err.required' }
  }
  if (empty) return null
  if (f.type === 'email') {
    const ok = has('email-no-at') ? String(value).length >= 5 : EMAIL_RE.test(value) // BUG
    return ok ? null : { key: 'err.email' }
  }
  if (f.type === 'password') {
    const min = has('password-off-by-one') ? f.min - 1 : f.min // BUG
    return String(value).length < min ? { key: 'err.password' } : null
  }
  if (f.type === 'number') {
    const n = Number(value)
    const tooYoung = has('age-off-by-one') ? n <= f.min : n < f.min // BUG
    return Number.isNaN(n) || tooYoung || n > f.max ? { key: 'err.age' } : null
  }
  if (f.type === 'date') {
    return new Date(value) > new Date() ? { key: 'err.date' } : null
  }
  if (f.key === 'card') {
    return /^\d{13,19}$/.test(String(value).replace(/\s/g, '')) ? null : { key: 'err.card' }
  }
  return null
}

export function useForm(allFields, has) {
  const values = reactive(Object.fromEntries(allFields.map((f) => [f.key, f.type === 'checkbox' ? false : ''])))
  const errors = reactive({})
  const validateField = (f) => {
    const e = checkField(f, values[f.key], has)
    if (e) errors[f.key] = e
    else delete errors[f.key]
    return !e
  }
  const validate = (list = allFields) => list.map(validateField).every(Boolean)
  return { values, errors, validateField, validate }
}

/** Envios registrados. Correcto: bloquea reenvios ~1s. Con 'double-submit' no hay guarda. */
export function useSubmissions(has) {
  const count = ref(0)
  const busy = ref(false)
  function record() {
    if (!has('double-submit')) {
      if (busy.value) return false
      busy.value = true
      setTimeout(() => { busy.value = false }, 1000)
    }
    count.value += 1
    return true
  }
  return { count, busy, record }
}

/** Filtros + paginacion compartidos por productos y dashboard. */
export function useListing(rows, opts, has) {
  const search = ref('')
  const cat = ref('')
  const sort = ref('default')
  const page = ref(1)

  const filtered = () => {
    let r = rows.filter((x) => (cat.value === '' || x.cat === Number(cat.value)) && opts.match(x, search.value.trim().toLowerCase()))
    if (sort.value === 'priceAsc') r = r.slice().sort((a, b) => a.price - b.price)
    if (sort.value === 'priceDesc') r = r.slice().sort((a, b) => b.price - a.price)
    return r
  }
  const pages = () => Math.max(1, Math.ceil(filtered().length / opts.pageSize))
  const pageRows = () => filtered().slice((page.value - 1) * opts.pageSize, page.value * opts.pageSize)
  const resetPage = () => { page.value = 1 }
  function clear() {
    search.value = ''
    if (!has('filter-not-reset')) cat.value = '' // BUG: el filtro de categoria queda activo
    sort.value = 'default'
    resetPage()
  }
  return { search, cat, sort, page, filtered, pages, pageRows, resetPage, clear }
}
