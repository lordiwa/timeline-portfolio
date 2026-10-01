// Estado compartido del sitio: sesion simulada, carrito, cupon, pedidos, comentarios y filtros del listado.
// Persiste en sessionStorage con clave por (seed, level) y arranca SIEMPRE vacio: reproducible por semilla.
// El storage se inyecta (tests); si sessionStorage no esta disponible cae a memoria.
import { reactive, watch, computed } from 'vue'
import { normalizeLevel } from '../generator/levels.js'

export const MAX_QTY = 99

export const storageKey = (seed, level) => `qa-lab:v1:${normalizeLevel(level)}:${seed}`
export const emailKey = (email) => String(email ?? '').trim().toLowerCase()
export const clampQty = (q) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(q)) || 1))

export function memoryStorage() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}

export function safeStorage() {
  try {
    const s = window.sessionStorage
    s.setItem('__qa', '1')
    s.removeItem('__qa')
    return s
  } catch {
    return memoryStorage()
  }
}

const defaults = () => ({
  cart: [], // [{ id, qty }]
  coupon: null, // codigo aplicado
  user: null, // { name, email }
  users: [], // registrados: [{ name, email, password }]
  orders: [], // [{ id, lines, totals, shipping, coupon, customer }]
  orderSeq: 0,
  comments: {}, // postId -> [{ author, text, minutes }]
  prefs: { newsletter: false },
  listUi: { search: '', cat: '', price: '', sort: 'default', page: 1 },
})

/** Lee del storage validando el shape: un JSON viejo o corrupto no rompe el sitio. */
function load(site, storage) {
  const s = defaults()
  let raw
  try { raw = JSON.parse(storage.getItem(storageKey(site.seed, site.level)) || 'null') } catch { raw = null }
  if (!raw || typeof raw !== 'object') return s
  const ids = new Set(site.data.catalog.map((r) => r.id))
  if (Array.isArray(raw.cart)) s.cart = raw.cart.filter((l) => l && ids.has(l.id)).map((l) => ({ id: l.id, qty: clampQty(l.qty) }))
  if (raw.coupon === site.data.coupon.code) s.coupon = raw.coupon
  const person = (u) => u && typeof u.name === 'string' && typeof u.email === 'string'
  if (person(raw.user)) s.user = { name: raw.user.name, email: raw.user.email }
  if (Array.isArray(raw.users)) s.users = raw.users.filter((u) => person(u) && typeof u.password === 'string')
  if (Array.isArray(raw.orders)) s.orders = raw.orders.filter((o) => o && typeof o.id === 'string')
  if (Number.isInteger(raw.orderSeq)) s.orderSeq = raw.orderSeq
  if (raw.comments && typeof raw.comments === 'object') s.comments = raw.comments
  if (raw.prefs && typeof raw.prefs.newsletter === 'boolean') s.prefs.newsletter = raw.prefs.newsletter
  if (raw.listUi && typeof raw.listUi === 'object') Object.assign(s.listUi, raw.listUi)
  return s
}

export function createStore(site, storage = safeStorage()) {
  const key = storageKey(site.seed, site.level)
  const state = reactive(load(site, storage))
  watch(state, () => {
    try { storage.setItem(key, JSON.stringify(state)) } catch { /* sin cuota: sigue en memoria */ }
  }, { deep: true, flush: 'sync' })

  const catalogIds = new Set(site.data.catalog.map((r) => r.id))
  const accounts = () => [{ ...site.data.demoUser }, ...state.users]
  const cartCount = computed(() => state.cart.reduce((s, l) => s + l.qty, 0))

  return {
    state,
    cartCount,

    // --- carrito ---
    addToCart(id, qty = 1) {
      if (!catalogIds.has(id)) return false
      const line = state.cart.find((l) => l.id === id)
      if (line) line.qty = clampQty(line.qty + clampQty(qty))
      else state.cart.push({ id, qty: clampQty(qty) })
      return true
    },
    setQty(id, qty) {
      const line = state.cart.find((l) => l.id === id)
      if (line) line.qty = clampQty(qty)
    },
    removeFromCart(id) {
      state.cart = state.cart.filter((l) => l.id !== id)
    },
    clearCart() {
      state.cart = []
    },

    // --- cupon ---
    applyCoupon(code) {
      const c = String(code ?? '').trim().toUpperCase()
      if (!c) return { ok: false, error: 'empty' }
      if (c !== site.data.coupon.code) return { ok: false, error: 'invalid' }
      state.coupon = site.data.coupon.code
      return { ok: true }
    },
    removeCoupon() {
      state.coupon = null
    },

    // --- sesion ---
    login(email, password) {
      const acc = accounts().find((u) => emailKey(u.email) === emailKey(email))
      if (!acc || acc.password !== password) return { ok: false, error: 'credentials' }
      state.user = { name: acc.name, email: acc.email }
      return { ok: true }
    },
    logout() {
      state.user = null
    },
    emailTaken: (email) => accounts().some((u) => emailKey(u.email) === emailKey(email)),
    register({ name, email, password }) {
      if (accounts().some((u) => emailKey(u.email) === emailKey(email))) return { ok: false, error: 'exists' }
      state.users.push({ name: String(name).trim(), email: String(email).trim(), password })
      state.user = { name: String(name).trim(), email: String(email).trim() }
      return { ok: true }
    },
    updateProfile({ name, newsletter }) {
      if (!state.user) return false
      const n = String(name ?? '').trim()
      if (n) {
        state.user.name = n
        const reg = state.users.find((u) => emailKey(u.email) === emailKey(state.user.email))
        if (reg) reg.name = n
      }
      if (typeof newsletter === 'boolean') state.prefs.newsletter = newsletter
      return true
    },

    // --- pedidos ---
    placeOrder({ lines, totals, shipping, customer }) {
      if (!lines.length) return null
      state.orderSeq += 1
      const order = {
        id: `ORD-${1000 + state.orderSeq}`,
        lines: lines.map((l) => ({ id: l.id, qty: l.qty, price: l.price })),
        totals: { ...totals },
        shipping,
        coupon: state.coupon,
        customer: { ...customer },
      }
      state.orders.push(order)
      state.cart = []
      state.coupon = null
      return order
    },

    // --- blog ---
    addComment(postId, text) {
      const t = String(text ?? '').trim()
      if (!t) return false
      const list = state.comments[postId] || (state.comments[postId] = [])
      list.unshift({ author: state.user?.name || null, text: t, minutes: 0 })
      return true
    },
  }
}
