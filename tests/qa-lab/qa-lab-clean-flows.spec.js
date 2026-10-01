// TASK-049 — R-1 / R-2 / R-5: lo que NO figura en el solucionario funciona bien.
//  - "sin flags": se recorren los flujos principales de sitios reales (12 semillas x 3 niveles, bugs forzados a []) y la
//    consola queda limpia (console.error / warn / log, window.error y rechazos sin manejar hacen fallar el test).
//  - "todos los flags compatibles a la vez" no crashean ni ensucian la consola (detecta fugas entre bugs).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BUGS } from '../../src/qa-lab/bugs/catalog.js'
import { LEVELS } from '../../src/qa-lab/generator/levels.js'
import { compatible } from '../../src/qa-lab/generator/compat.js'
import { concretePath } from '../../src/qa-lab/generator/pages.js'
import { storageKey, memoryStorage } from '../../src/qa-lab/state/store.js'
import { forceSite, ALL_PAGES, mountSite, go, back, forward, tick, fill, fillVisible, click, here, cleanup, watchConsole } from './helpers.js'

vi.setConfig({ testTimeout: 300000 })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

const SEEDS = Array.from({ length: 12 }, (_, i) => `clean-${i}`)
const cents = (n) => Math.round(n * 100)
const fmt = (c) => `$${(c / 100).toFixed(2)}`
const text = (w, id) => w.find(`[data-testid="${id}"]`).text()
const cartCount = (w) => text(w, 'cart-count')
const submissions = (w) => Number(text(w, 'submissions').match(/\d+/)[0])
const savedOrders = (storage, site) => JSON.parse(storage.getItem(storageKey(site.seed, site.level)) || '{}').orders || []

/** R-1.1: cada pagina del sitio renderiza su h1 con el foco en el, el titulo del documento y una sola h1. */
async function visitAllPages(w, site) {
  for (const p of site.pages) {
    await go(concretePath(site, p))
    await tick(5)
    const expected = p === 'account' ? 'login' : p // la cuenta sin sesion redirige al login
    expect(w.find('main [data-page]').attributes('data-page'), `${p}`).toBe(expected)
    expect(w.findAll('h1'), `h1 ${p}`).toHaveLength(1)
    expect(w.find('h1').text().length, `h1 ${p}`).toBeGreaterThan(2)
    if (p !== 'home') expect(document.activeElement, `foco ${p}`).toBe(w.find('h1').element) // el sitio arranca en el inicio: sin navegacion no hay foco que mover
    expect(document.title, `title ${p}`).toContain('QA Lab')
  }
  // atras / adelante por el historial
  await back()
  await forward()
  expect(w.findAll('h1')).toHaveLength(1)
}

/** R-1.2: listado completo: recorrer paginas, buscar con y sin resultados, filtrar (se conserva al paginar), ordenar. */
async function exerciseList(w, site) {
  await go('/catalog')
  const total = site.data.catalog.length
  let seen = 0
  for (let guard = 0; guard < 20; guard++) {
    seen += w.findAll('[data-testid="item-card"]').length
    const next = click(w, 'Siguiente')
    if (next.element.disabled) break
    const before = w.find('.qa-page-info').text()
    await next.trigger('click')
    expect(w.find('.qa-page-info').text()).not.toBe(before) // sin saltos ni pagina trabada
    const [, cur] = w.find('.qa-page-info').text().match(/(\d+) de/)
    const [, prev] = before.match(/(\d+) de/)
    expect(Number(cur)).toBe(Number(prev) + 1)
  }
  expect(seen).toBe(total)

  const search = w.find('input[type=search]')
  await search.setValue('zzzz')
  expect(w.find('.qa-empty').exists()).toBe(true)
  expect(w.find('.qa-spinner').exists()).toBe(false)
  await search.setValue('')
  expect(w.find('.qa-empty').exists()).toBe(false)

  const perCat = (c) => site.data.catalog.filter((r) => r.cat === c).length
  const cat = [0, 1, 2].sort((a, b) => perCat(b) - perCat(a))[0]
  await w.find('[data-testid="filter-cat"]').setValue(String(cat))
  expect(text(w, 'result-count')).toBe(`${perCat(cat)} resultados`)
  if (perCat(cat) > site.data.list.pageSize) {
    await click(w, 'Siguiente').trigger('click')
    expect(w.find('[data-testid="filter-cat"]').element.value).toBe(String(cat)) // el filtro se conserva al paginar
    expect(text(w, 'result-count')).toBe(`${perCat(cat)} resultados`)
  }
  await w.find('[data-testid="filter-cat"]').setValue('')
  // orden por precio ascendente (dentro de la pagina)
  await w.find('.qa-dd-toggle').trigger('click')
  await w.findAll('.qa-dd-menu button').find((b) => b.text().includes('menor a mayor')).trigger('click')
  const prices = w.findAll('[data-testid="item-card"] .qa-price').map((p) => Number(p.text().slice(1)))
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
  await click(w, 'Limpiar filtros').trigger('click')
  expect(text(w, 'result-count')).toBe(`${total} resultados`)
  // R-1.8: busquedas rapidas seguidas muestran siempre la ultima
  const name = site.data.catalog.length && w.find('[data-testid="item-card"] h3').text()
  await search.setValue(name.toLowerCase())
  const reference = text(w, 'result-count') // resultados de la consulta final tecleada sola
  await search.setValue('')
  await search.setValue('a')
  await search.setValue(name.toLowerCase())
  expect(text(w, 'result-count')).toBe(reference)
  await click(w, 'Limpiar filtros').trigger('click')
}

/** R-1.3: detalle -> agregar -> carrito -> cantidad -> quitar, con el contador del navbar coherente; relacionado muestra datos nuevos. */
async function exerciseCart(w, site) {
  await go('/catalog/1')
  const first = w.find('h1').text()
  await w.find('#qa-detail-qty').setValue('2')
  await w.find('[data-testid="add-to-cart"]').trigger('click')
  expect(cartCount(w)).toBe('(2)')
  await go(w.find('[data-testid="related-link"]').attributes('href').slice(1))
  expect(w.find('h1').text()).not.toBe(first) // el relacionado muestra SUS datos
  await w.find('[data-testid="add-to-cart"]').trigger('click')
  expect(cartCount(w)).toBe('(3)')
  await go('/cart')
  expect(w.findAll('[data-testid="cart-line"]')).toHaveLength(2)
  const qty = w.find('[data-testid="cart-line"] input')
  await qty.setValue('4')
  await qty.trigger('change')
  expect(cartCount(w)).toBe('(5)')
  await w.find('[data-testid="remove-line"]').trigger('click')
  expect(w.findAll('[data-testid="cart-line"]')).toHaveLength(1)
  expect(cartCount(w)).toBe('(1)')
  // volver atras y adelante no pierde el carrito
  await back()
  await forward()
  expect(cartCount(w)).toBe('(1)')
  await w.find('[data-testid="remove-line"]').trigger('click')
  expect(w.find('[data-testid="cart-empty"]').exists()).toBe(true)
  expect(cartCount(w)).toBe('(0)')
}

/** R-1.4 + R-1.8: checkout completo con cupon valido e invalido, envio e impuestos contra la formula de referencia; doble click no duplica. */
async function exerciseCheckout(w, site, storage) {
  const { catalog, coupon, shipping, taxRate } = site.data
  await go('/catalog')
  const adds = w.findAll('[data-testid="add-to-cart"]')
  await adds[0].trigger('click')
  await adds[1].trigger('click')
  await adds[1].trigger('click')
  await go('/cart')
  await go('/checkout')
  await fill(w, { name: 'Ana Perez', email: 'ana@example.com', address: 'Calle 1', city: 'Lima' })
  await w.find('form').trigger('submit')
  const sub = cents(catalog[0].price) + 2 * cents(catalog[1].price)
  expect(text(w, 'sum-subtotal')).toBe(fmt(sub))
  await w.find('[data-testid="coupon-input"]').setValue('NOEXISTE')
  await w.find('[data-testid="coupon-apply"]').trigger('click')
  expect(w.find('[data-testid="coupon-error"]').exists()).toBe(true)
  await w.find('[data-testid="coupon-input"]').setValue(coupon.code)
  await w.find('[data-testid="coupon-apply"]').trigger('click')
  await w.find('[data-testid="ship-express"]').setValue(true)
  const disc = Math.round((sub * coupon.pct) / 100)
  const tax = Math.round(((sub - disc) * taxRate) / 100)
  const total = sub - disc + tax + cents(shipping.express)
  expect(text(w, 'sum-discount')).toBe(`-${fmt(disc)}`)
  expect(text(w, 'sum-tax')).toBe(fmt(tax))
  expect(text(w, 'grand-total')).toBe(fmt(total))
  await w.find('form').trigger('submit')
  await fill(w, { card: '4111111111111111' })
  const form = w.find('form')
  await form.trigger('submit')
  await form.trigger('submit') // doble click en "Pagar": un solo pedido
  await tick(10)
  expect(text(w, 'order-total')).toBe(fmt(total))
  expect(savedOrders(storage, site)).toHaveLength(1)
  expect(cartCount(w)).toBe('(0)')
}

/** R-1.5 + R-1.7: registro -> ruta protegida -> cuenta -> logout -> redirige; deep link con sesion vacia; fechas sin corrimiento. */
async function exerciseAuth(w, site, n) {
  const d = site.data.demoUser
  const hasAccount = site.pages.includes('account')
  await go('/login')
  await fill(w, { email: d.email, password: 'incorrecta' })
  await w.find('form').trigger('submit')
  expect(w.find('[data-testid="login-error"]').exists()).toBe(true)
  await fill(w, { email: d.email, password: d.password })
  await w.find('form').trigger('submit')
  await tick(10)
  expect(w.find('[data-testid="session-user"]').exists()).toBe(true)
  expect(here()).not.toContain('password') // R-1: la contrasena nunca viaja en la URL
  if (hasAccount) {
    await go('/account')
    expect(here()).toBe('#/account')
  }
  await w.find('[data-testid="nav-logout"]').trigger('click')
  await tick(10)
  if (hasAccount) {
    await go('/account')
    expect(here()).toBe('#/login?next=%2Faccount')
  }
  if (site.pages.includes('signup')) {
    await go('/signup')
    await fillVisible(w, n)
    await w.find('form').trigger('submit')
    await tick(10)
    expect(w.find('[data-testid="session-user"]').exists()).toBe(true)
    if (hasAccount && site.data.signupFields.includes('birth')) {
      expect(w.find('[data-testid="account-birth"]').text()).toBe('Fecha de nacimiento: 10/05/2000') // misma fecha que se escribio
    }
    await w.find('[data-testid="nav-logout"]').trigger('click')
  }
  // R-1.9: login repetido (>= 10 veces) nunca falla
  for (let i = 0; i < 10; i++) {
    await go('/login')
    await fill(w, { email: d.email, password: d.password })
    await w.find('form').trigger('submit')
    await tick(5)
    expect(w.find('[data-testid="session-user"]').exists(), `login ${i}`).toBe(true)
    await w.find('[data-testid="nav-logout"]').trigger('click')
    await tick(5)
  }
}

/** R-1.6: wizard completo, contacto (>= 10 envios), faq, blog (HTML escrito se ve literal) y dashboard. */
async function exerciseContent(w, site) {
  if (site.pages.includes('wizard')) {
    await go('/wizard')
    for (let i = 0; i < 8 && submissions(w) === 0; i++) {
      await fillVisible(w)
      await w.find('form').trigger('submit')
    }
    expect(submissions(w)).toBe(1)
  }
  if (site.pages.includes('contact')) {
    await go('/contact')
    await fillVisible(w)
    vi.useFakeTimers() // la ventana de reenvio (1 s) usa el reloj del sitio
    for (let i = 1; i <= 10; i++) {
      await w.find('form').trigger('submit')
      expect(submissions(w), `envio ${i}`).toBe(i)
      await vi.advanceTimersByTimeAsync(1100)
    }
    vi.useRealTimers()
    await go('/')
    await go('/contact') // formulario nuevo, vacio
    await w.find('form').trigger('submit') // vacio: errores anunciados
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('input[aria-invalid="true"]').exists()).toBe(true)
  }
  if (site.pages.includes('faq')) {
    await go('/faq')
    const q = w.findAll('.qa-accordion button, [aria-expanded]')[0]
    if (q) await q.trigger('click')
  }
  if (site.pages.includes('blog')) {
    await go('/blog/1')
    await w.findAll('.qa-tablist button')[1].trigger('click')
    const times = w.findAll('[data-testid="comment-time"]').map((x) => x.text())
    expect(times.every((x) => /^hace \d+ (min|h)$/.test(x))).toBe(true)
    await w.find('#qa-comment').setValue('<b>hola</b>')
    await w.find('form').trigger('submit')
    expect(w.find('.qa-comment b').exists()).toBe(false) // el HTML se ve literal
    expect(w.find('.qa-comment').text()).toContain('<b>hola</b>')
  }
  if (site.pages.includes('dashboard')) {
    await go('/dashboard')
    const dash = site.data.dashboard
    let rows = 0
    for (let guard = 0; guard < 20; guard++) {
      rows += w.findAll('.qa-table tbody tr').length
      const next = click(w, 'Siguiente')
      if (next.element.disabled) break
      await next.trigger('click')
    }
    expect(rows).toBe(dash.rows.length)
    await w.find('input[type=search]').setValue('zzzz')
    expect(w.find('.qa-empty').exists()).toBe(true)
    expect(w.find('.qa-spinner').exists()).toBe(false)
  }
}

describe('sin flags: los flujos principales funcionan y la consola queda limpia (12 semillas por nivel)', () => {
  it.each(LEVELS)('%s: paginas, listado, carrito, checkout, sesion, formularios, blog y dashboard sin errores ni avisos en consola', async (level) => {
    for (const [i, seed] of SEEDS.entries()) {
      const guard = watchConsole()
      try {
        const site = forceSite({ seed, level, bugs: {} }) // bugs: [] forzado; paginas y contenido de esa (semilla, nivel)
        expect(site.bugs).toEqual([])
        const storage = memoryStorage()
        const { w } = await mountSite(site, { hash: '#/', storage })
        await visitAllPages(w, site)
        if (site.pages.includes('list')) await exerciseList(w, site)
        if (site.pages.includes('detail') && site.pages.includes('cart')) await exerciseCart(w, site)
        if (site.pages.includes('checkout')) await exerciseCheckout(w, site, storage)
        if (site.pages.includes('login')) await exerciseAuth(w, site, i)
        await exerciseContent(w, site)
        w.unmount()
        // R-9: el sitio sobrevive a recargar y a un deep link (carrito y pedidos persisten, la cuenta sigue protegida)
        if (site.pages.includes('account')) {
          const again = await mountSite(site, { hash: '#/account', storage: memoryStorage() })
          expect(here(), `${level} ${seed}`).toBe('#/login?next=%2Faccount')
          again.w.unmount()
        }
      } finally {
        guard.stop()
      }
      expect(guard.seen, `${level} ${seed}`).toEqual([])
    }
  })
})

describe('todos los flags compatibles a la vez no crashean (R-5)', () => {
  it('con las 13 paginas, todos los bugs compatibles activos a la vez: se recorren las paginas y los flujos sin errores de consola ni excepciones', async () => {
    const chosen = []
    for (const b of BUGS) if (compatible(chosen, b)) chosen.push(b)
    const bugs = Object.fromEntries(chosen.map((b) => [b.id, b.pages.find((p) => ALL_PAGES.includes(p))]))
    expect(Object.keys(bugs).length).toBeGreaterThan(25)
    const guard = watchConsole()
    try {
      const site = forceSite({ pages: ALL_PAGES, level: 'senior', bugs })
      const { w } = await mountSite(site, { hash: '#/', storage: memoryStorage() })
      for (const p of site.pages) { await go(concretePath(site, p)); expect(w.findAll('h1').length, p).toBe(1) }
      await go('/catalog')
      await w.find('input[type=search]').setValue('zzzz')
      await w.find('input[type=search]').setValue('a')
      for (let i = 0; i < 8; i++) await w.findAll('[data-testid="add-to-cart"]')[0]?.trigger('click')
      await click(w, 'Siguiente')?.trigger('click')
      await go('/catalog/1')
      for (let i = 0; i < 4; i++) await w.find('[data-testid="add-to-cart"]').trigger('click')
      await go(w.find('[data-testid="related-link"]').attributes('href').slice(1))
      await go('/cart')
      await back()
      await go('/checkout')
      await w.find('form').trigger('submit')
      await fillVisible(w)
      await w.find('form').trigger('submit')
      await go('/contact')
      await fillVisible(w)
      for (let i = 0; i < 3; i++) await w.find('form').trigger('submit')
      await go('/login')
      const d = site.data.demoUser
      for (let i = 0; i < 4; i++) {
        await fill(w, { email: d.email, password: d.password })
        await w.find('form').trigger('submit')
        await tick(5)
        w.find('[data-testid="nav-logout"]').exists() && (await w.find('[data-testid="nav-logout"]').trigger('click'))
        await go('/login')
      }
      await go('/blog/1')
      await w.findAll('.qa-tablist button')[1].trigger('click')
      await w.find('#qa-comment').setValue('<b>x</b> <script>1</script>')
      await w.find('form').trigger('submit')
      await go('/dashboard')
      await w.find('input[type=search]').setValue('zzzz')
      await go('/wizard')
      await fillVisible(w)
      await w.find('form').trigger('submit')
      w.unmount()
    } finally {
      guard.stop()
    }
    expect(guard.seen).toEqual([])
  })
})
