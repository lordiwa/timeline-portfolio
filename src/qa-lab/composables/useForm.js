// Estado + validacion de formularios. Los bugs de validacion viven aca (consultando flags).
import { reactive, ref } from 'vue'
import { systemClock } from '../services/clock.js'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** clock: fuente de la hora para validar fechas (nunca el reloj de la maquina directo). */
export function checkField(f, value, has, clock = systemClock) {
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
    return Date.parse(value) > clock.now() ? { key: 'err.date' } : null
  }
  // Reglas de los content packs (rules.minLength / maxLength / pattern como string con la fuente de la regex).
  const s = String(value)
  if (f.minLength != null && s.length < f.minLength) return { key: 'err.minLength', params: { n: f.minLength } }
  if (f.maxLength != null && s.length > f.maxLength) return { key: 'err.maxLength', params: { n: f.maxLength } }
  if (f.pattern && !new RegExp(f.pattern).test(s)) return f.patternHint ? { text: f.patternHint } : { key: 'err.pattern' }
  if (f.key === 'card') {
    return /^\d{13,19}$/.test(String(value).replace(/\s/g, '')) ? null : { key: 'err.card' }
  }
  return null
}

export function useForm(allFields, has, clock = systemClock) {
  const values = reactive(Object.fromEntries(allFields.map((f) => [f.key, f.type === 'checkbox' ? false : ''])))
  const errors = reactive({})
  const validateField = (f) => {
    const e = checkField(f, values[f.key], has, clock)
    if (e) errors[f.key] = e
    else delete errors[f.key]
    return !e
  }
  const validate = (list = allFields) => list.map(validateField).every(Boolean)
  return { values, errors, validateField, validate }
}

/** Envios registrados. Correcto: bloquea reenvios ~1s. Con 'double-submit' no hay guarda. */
export function useSubmissions(has, clock = systemClock) {
  const count = ref(0)
  const busy = ref(false)
  function record() {
    if (!has('double-submit')) {
      if (busy.value) return false
      busy.value = true
      clock.setTimeout(() => { busy.value = false }, 1000)
    }
    count.value += 1
    return true
  }
  return { count, busy, record }
}
