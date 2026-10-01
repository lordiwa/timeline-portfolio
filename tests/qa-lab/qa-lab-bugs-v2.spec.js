// TASK-049 — los 17 bugs nuevos del catalogo v2: cada uno se manifiesta SOLO con su flag y funciona bien sin el (R-4:
// un solo flag activo, con un control cercano que es igual en ambos). Los intermitentes nth-* usan N de bugParams.
// Los bugs async usan timers falsos; el reloj/latencia simulados vienen de services/clock.js.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { BUGS, BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'
import { bugLocation } from '../../src/qa-lab/bugs/locations.js'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { createLatency } from '../../src/qa-lab/services/clock.js'
import { computeTotals } from '../../src/qa-lab/state/pricing.js'
import { formatDate, relTime } from '../../src/qa-lab/state/dates.js'
import { createStore, memoryStorage, storageKey } from '../../src/qa-lab/state/store.js'
import { resolveContent } from '../../src/qa-lab/content/index.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { getThemePack } from '../../src/qa-lab/themes/index.js'
import { forceSite, ALL_PAGES, mountSite, go, back, tick, fill, fillVisible, click, here, moneyOf, cleanup } from './helpers.js'

vi.setConfig({ testTimeout: 60000 })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

const NEW_IDS = BUGS.slice(19).map((b) => b.id)
const seedStorage = (site, saved) => {
  const s = memoryStorage()
  s.setItem(storageKey(site.seed, site.level), JSON.stringify(saved))
  return s
}
/** Primera semilla cuyo sitio cumple `pred` (el contenido depende solo de la semilla, no del nivel). */
const seedWith = (pred) => {
  for (let i = 0; i < 400; i++) if (pred(generateSite(`w-${i}`, 'senior'))) return `w-${i}`
  throw new Error('ninguna semilla cumple el predicado')
}
const SESSION = { name: 'Ana', email: 'ana@example.com' }
const cartCount = (w) => w.find('[data-testid="cart-count"]').text()
const submissions = (w) => w.find('[data-testid="submissions"]').text()
const bothWays = async (build, probe) => {
  const out = []
  for (const flag of [false, true]) {
    const m = await build(flag)
    out.push(await probe(m, flag))
    m.w.unmount()
  }
  return out
}

describe('catalogo v2: cobertura y descripciones', () => {
  it('los 17 bugs nuevos son exactamente los de la seleccion de Rafael (evita un bug sin spec o uno fuera del catalogo)', () => {
    expect(NEW_IDS.sort()).toEqual([
      'cart-loses-item-on-back', 'date-timezone-shift', 'errors-no-aria-live', 'filter-lost-on-paginate', 'navbar-count-desync',
      'nth-add-to-cart-fails', 'nth-login-rejected', 'nth-submit-server-error', 'password-in-url', 'place-order-twice',
      'protected-deeplink', 'relative-time-wrong', 'spinner-on-empty-results', 'stale-detail-on-param-change',
      'stale-response-overwrites', 'tax-rounding-per-line', 'unescaped-comment-html',
    ])
  })

  it('cada bug nuevo describe pagina y pasos en es y en, y unescaped-comment-html solo documenta etiquetas inertes (evita un solucionario con payloads)', () => {
    for (const id of NEW_IDS) {
      const { es, en } = BUG_BY_ID[id].description
      expect(es.length, id).toBeGreaterThan(80)
      expect(en.length, id).toBeGreaterThan(80)
      expect(es, id).not.toBe(en)
    }
    const html = BUG_BY_ID['unescaped-comment-html'].description
    for (const text of [html.es, html.en]) {
      expect(text).toMatch(/<b>/)
      expect(text).not.toMatch(/<script|onerror|onload|javascript:|on\w+\s*=/i)
    }
  })
})

describe('estado y entre paginas', () => {
  it('navbar-count-desync: bajar la cantidad en el carrito no actualiza el contador del navbar solo con el flag; agregar si actualiza', async () => {
    const [clean, bug] = await bothWays(
      async (flag) => {
        const site = forceSite({ pages: ALL_PAGES, bugs: flag ? { 'navbar-count-desync': 'cart' } : {} })
        return mountSite(site, { hash: '#/cart', storage: seedStorage(site, { cart: [{ id: 1, qty: 3 }] }) })
      },
      async ({ w }) => {
        expect(cartCount(w)).toBe('(3)')
        const input = w.find('[data-testid="cart-line"] input')
        await input.setValue('2')
        await input.trigger('change')
        const onCart = cartCount(w)
        await go('/catalog')
        expect(cartCount(w)).toBe('(2)') // fuera del carrito el contador es el real en ambos
        await w.find('[data-testid="add-to-cart"]').trigger('click')
        expect(cartCount(w)).toBe('(3)') // control: agregar actualiza en ambos
        return onCart
      },
    )
    expect(clean).toBe('(2)')
    expect(bug).toBe('(3)')
  })

  it('filter-lost-on-paginate: al paginar se pierden el orden y el filtro de categoria y la pagina sigue en 2 solo con el flag', async () => {
    const seed = seedWith((s) => BUG_BY_ID['filter-lost-on-paginate'].witness(s))
    const base = generateSite(seed, 'senior')
    const pop = {}
    for (const r of base.data.catalog) pop[r.cat] = (pop[r.cat] || 0) + 1
    const cat = Number(Object.keys(pop).sort((a, b) => pop[b] - pop[a])[0])
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ seed, pages: ALL_PAGES, bugs: flag ? { 'filter-lost-on-paginate': 'list' } : {} }), { hash: '#/catalog' }),
      async ({ w }) => {
        await w.find('.qa-dd-toggle').trigger('click')
        await w.findAll('.qa-dd-menu button').find((b) => b.text().includes('menor a mayor')).trigger('click') // orden por precio
        await w.find('[data-testid="filter-cat"]').setValue(String(cat))
        // paginar con el filtro solo si deja mas de una pagina; si no, solo con el orden
        if (pop[cat] <= base.data.list.pageSize) await w.find('[data-testid="filter-cat"]').setValue('')
        await click(w, 'Siguiente').trigger('click')
        expect(w.find('.qa-page-info').text()).toMatch(/Página 2 de/) // control: la pagina avanza en ambos
        return { sort: w.find('.qa-dd-toggle').text(), cat: w.find('[data-testid="filter-cat"]').element.value, keepsCat: pop[cat] > base.data.list.pageSize }
      },
    )
    expect(clean.sort).toContain('menor a mayor')
    expect(bug.sort).not.toContain('menor a mayor')
    expect(bug.cat).toBe('')
    if (clean.keepsCat) expect(clean.cat).toBe(String(cat))
  })

  it('cart-loses-item-on-back: agregar, ver el carrito, volver atras y agregar otro pierde el primero solo con el flag', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'cart-loses-item-on-back': 'detail' } : {} }), { hash: '#/catalog/1' }),
      async ({ w }) => {
        await w.find('[data-testid="add-to-cart"]').trigger('click')
        await go('/cart')
        await back()
        expect(here()).toBe('#/catalog/1')
        await go('/catalog/2')
        await w.find('[data-testid="add-to-cart"]').trigger('click')
        await go('/cart')
        return w.findAll('[data-testid="cart-line"]').length
      },
    )
    expect(clean).toBe(2)
    expect(bug).toBe(1)
  })

  it('protected-deeplink: abrir /account directo sin sesion muestra la cuenta solo con el flag; navegando desde el menu siempre redirige', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'protected-deeplink': 'account' } : {} }), { hash: '#/account' }),
      async ({ w }) => ({ hash: here(), page: w.find('main [data-page]').attributes('data-page') }),
    )
    expect(clean).toEqual({ hash: '#/login?next=%2Faccount', page: 'login' })
    expect(bug).toEqual({ hash: '#/account', page: 'account' })
    for (const flag of [false, true]) {
      const { w } = await mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'protected-deeplink': 'account' } : {} }), { hash: '#/' })
      await go('/account')
      expect(here(), `control flag=${flag}`).toBe('#/login?next=%2Faccount')
      w.unmount()
    }
  })

  it('stale-detail-on-param-change: tocar un relacionado cambia la URL pero el detalle sigue mostrando el producto anterior solo con el flag', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'stale-detail-on-param-change': 'detail' } : {} }), { hash: '#/catalog/1' }),
      async ({ w }) => {
        const before = w.find('h1').text()
        await go(w.find('[data-testid="related-link"]').attributes('href').slice(1)) // el enlace "relacionado"
        return { changed: w.find('h1').text() !== before, hash: here() }
      },
    )
    expect(clean.changed).toBe(true)
    expect(bug.changed).toBe(false)
    expect(bug.hash).not.toBe('#/catalog/1') // control: la URL cambia en ambos
    expect(clean.hash).not.toBe('#/catalog/1')
  })
})

describe('intermitentes deterministas (solo senior, N de bugParams)', () => {
  it.each(['list', 'detail'])('nth-add-to-cart-fails en %s: la 3.ª alta muestra el aviso pero no agrega, solo con el flag; las demas funcionan', async (page) => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'nth-add-to-cart-fails': page } : {}, params: { 'nth-add-to-cart-fails': { n: 3 } } }), { hash: page === 'list' ? '#/catalog' : '#/catalog/1' }),
      async ({ w }) => {
        let thirdToast = false
        for (let i = 1; i <= 5; i++) {
          await w.find('[data-testid="add-to-cart"]').trigger('click')
          if (i === 3) thirdToast = !!document.querySelector('.qa-toast')
        }
        expect(thirdToast).toBe(true) // el aviso de exito aparece tambien en la alta que falla
        return cartCount(w)
      },
    )
    expect(clean).toBe('(5)')
    expect(bug).toBe('(4)') // falta exactamente la 3.ª
  })

  it('nth-add-to-cart-fails cuenta solo en su pagina: con el bug asignado al listado, las altas desde el detalle no consumen el contador', async () => {
    const site = forceSite({ pages: ALL_PAGES, bugs: { 'nth-add-to-cart-fails': 'list' }, params: { 'nth-add-to-cart-fails': { n: 2 } } })
    const { w } = await mountSite(site, { hash: '#/catalog/1' })
    for (let i = 0; i < 3; i++) await w.find('[data-testid="add-to-cart"]').trigger('click')
    expect(cartCount(w)).toBe('(3)')
    await go('/catalog')
    await w.findAll('[data-testid="add-to-cart"]')[1].trigger('click') // 1.ª alta del listado
    await w.findAll('[data-testid="add-to-cart"]')[1].trigger('click') // 2.ª: falla
    expect(cartCount(w)).toBe('(4)')
  })

  it('nth-login-rejected: el 2.º intento con credenciales validas es rechazado y el siguiente pasa; los intentos erroneos no cuentan', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'nth-login-rejected': 'login' } : {}, params: { 'nth-login-rejected': { n: 2 } } }), { hash: '#/login' }),
      async ({ w, site }) => {
        const d = site.data.demoUser
        const attempt = async (password) => {
          await go('/login')
          await fill(w, { email: d.email, password })
          await w.find('form').trigger('submit')
          await tick(10)
          return w.find('[data-testid="session-user"]').exists()
        }
        const logout = async () => { await w.find('[data-testid="nav-logout"]').trigger('click') }
        expect(await attempt('mala-clave')).toBe(false) // no cuenta
        expect(await attempt(d.password)).toBe(true) // valido n.º 1
        await logout()
        const second = await attempt(d.password) // valido n.º 2
        if (second) await logout()
        const third = await attempt(d.password) // valido n.º 3
        return { second, third }
      },
    )
    expect(clean).toEqual({ second: true, third: true })
    expect(bug).toEqual({ second: false, third: true })
  })

  it('nth-submit-server-error: el 2.º envio valido muestra un banner 500 (role=alert), conserva los datos y no cuenta; el siguiente pasa', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'nth-submit-server-error': 'contact' } : {}, params: { 'nth-submit-server-error': { n: 2 } } }), { hash: '#/contact' }),
      async ({ w, site }) => {
        await fillVisible(w, site)
        vi.useFakeTimers() // la ventana de bloqueo de reenvio (1 s) usa el reloj del sitio
        const out = []
        for (let i = 1; i <= 3; i++) {
          await w.find('form').trigger('submit')
          const banner = w.find('.qa-banner-error')
          out.push({ n: submissions(w), banner: banner.exists() && banner.attributes('role') === 'alert', kept: w.find('[data-field="email"] input').element.value })
          await vi.advanceTimersByTimeAsync(1100)
        }
        vi.useRealTimers()
        return out
      },
    )
    expect(clean.map((x) => x.n.match(/\d+/)[0])).toEqual(['1', '2', '3'])
    expect(clean.some((x) => x.banner)).toBe(false)
    expect(bug.map((x) => x.n.match(/\d+/)[0])).toEqual(['1', '1', '2'])
    expect(bug.map((x) => x.banner)).toEqual([false, true, false])
    expect(bug[1].kept).toBe('ana@example.com') // los datos escritos se conservan tras el 500
  })

  it('el solucionario muestra el N concreto de cada intermitente y el offset del bug de zona (evita un solucionario sin la accion que falla)', () => {
    for (const id of ['nth-add-to-cart-fails', 'nth-login-rejected', 'nth-submit-server-error']) {
      const site = forceSite({ pages: ALL_PAGES, bugs: { [id]: BUG_BY_ID[id].pages[0] }, params: { [id]: { n: 4 } } })
      expect(bugLocation(site, id), id).toEqual({ key: 'lab.where.nth', n: 4 })
    }
    const tz = forceSite({ pages: ALL_PAGES, bugs: { 'date-timezone-shift': 'account' }, params: { 'date-timezone-shift': { tz: -300 } } })
    expect(bugLocation(tz, 'date-timezone-shift')).toEqual({ key: 'lab.where.timezone', n: -300 })
  })
})

describe('calculo y fechas', () => {
  it('tax-rounding-per-line: con cupon y varias lineas el impuesto difiere de la base solo con el flag; con una sola linea es igual (logica pura)', () => {
    const seed = seedWith((s) => BUG_BY_ID['tax-rounding-per-line'].witness(s))
    const { data } = generateSite(seed, 'senior')
    const lines = data.catalog.slice(0, 3).map((r) => ({ price: r.price, qty: 1 }))
    const args = { lines, couponPct: data.coupon.pct, taxRate: data.taxRate }
    expect(computeTotals({ ...args, taxPerLine: true }).tax).not.toBe(computeTotals(args).tax)
    // el impuesto correcto es el de la base: round((subtotal - descuento) * tasa)
    const sub = lines.reduce((s, l) => s + l.price * 100, 0)
    const disc = Math.round((sub * data.coupon.pct) / 100)
    expect(computeTotals(args).tax).toBe(Math.round(((sub - disc) * data.taxRate) / 100))
    const one = { ...args, lines: lines.slice(0, 1) }
    expect(computeTotals({ ...one, taxPerLine: true }).tax).toBe(computeTotals(one).tax) // control
    const noCoupon = { ...args, couponPct: 0 }
    expect(computeTotals({ ...noCoupon, taxPerLine: true }).tax).toBe(computeTotals(noCoupon).tax) // precios enteros: sin cupon no difiere
  })

  it('tax-rounding-per-line en el checkout: [data-testid=sum-tax] refleja el redondeo por linea solo con el flag', async () => {
    const seed = seedWith((s) => BUG_BY_ID['tax-rounding-per-line'].witness(s))
    const [clean, bug] = await bothWays(
      async (flag) => {
        const site = forceSite({ seed, pages: ALL_PAGES, bugs: flag ? { 'tax-rounding-per-line': 'checkout' } : {} })
        return mountSite(site, { hash: '#/checkout', storage: seedStorage(site, { cart: [{ id: 1, qty: 1 }, { id: 2, qty: 1 }, { id: 3, qty: 1 }] }) })
      },
      async ({ w, site }) => {
        await fillVisible(w, site)
        await w.find('form').trigger('submit')
        await w.find('[data-testid="coupon-input"]').setValue(site.data.coupon.code)
        await w.find('[data-testid="coupon-apply"]').trigger('click')
        return w.find('[data-testid="sum-tax"]').text()
      },
    )
    const site = generateSite(seed, 'senior')
    const { data } = site
    const d = getThemePack(site.themeId).currency.decimals // unidad menor de la moneda del pack
    const sub = data.catalog.slice(0, 3).reduce((s, r) => s + Math.round(r.price * 10 ** d), 0)
    const disc = Math.round((sub * data.coupon.pct) / 100)
    expect(clean).toBe(moneyOf(site)(Math.round(((sub - disc) * data.taxRate) / 100) / 10 ** d))
    expect(bug).not.toBe(clean)
  })

  it('date-timezone-shift: formatDate muestra un dia antes con offset negativo solo con shift, sin depender de la zona de la maquina (logica pura)', () => {
    expect(formatDate('2000-05-10')).toBe('10/05/2000')
    expect(formatDate('2000-05-10', { tz: -300, shift: false })).toBe('10/05/2000')
    expect(formatDate('2000-05-10', { tz: -300, shift: true })).toBe('09/05/2000')
    expect(formatDate('2000-01-01', { tz: -480, shift: true })).toBe('31/12/1999') // cruza de anio
    expect(formatDate('2000-05-10', { tz: 0, shift: true })).toBe('10/05/2000') // control: sin offset no hay corrimiento
  })

  it('date-timezone-shift en la cuenta: la fecha de nacimiento aparece un dia antes solo con el flag', async () => {
    const [clean, bug] = await bothWays(
      async (flag) => {
        const site = forceSite({ pages: ALL_PAGES, bugs: flag ? { 'date-timezone-shift': 'account' } : {}, params: { 'date-timezone-shift': { tz: -300 } } })
        return mountSite(site, { hash: '#/account', storage: seedStorage(site, { user: { ...SESSION, birth: '2000-05-10' } }) })
      },
      async ({ w }) => w.find('[data-testid="account-birth"]').text(),
    )
    expect(clean).toBe('Fecha de nacimiento: 10/05/2000')
    expect(bug).toBe('Fecha de nacimiento: 09/05/2000')
  })

  it('el registro guarda la fecha de nacimiento tal cual se escribio y la cuenta la muestra igual (sin flag, con zona simulada distinta de 0)', async () => {
    const dateKeyOf = (s) => s.data.signupFields.find((k) => s.data.fieldMeta[k].type === 'date' && /birth/i.test(k)) // fecha de nacimiento del pack
    const seed = seedWith((s) => dateKeyOf(s) && s.tzOffsetMinutes !== 0)
    const site = forceSite({ seed, pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/signup' })
    await fillVisible(w, site, { email: 'qa7@example.com', [dateKeyOf(site)]: '2000-05-10' })
    await w.find('form').trigger('submit')
    await tick(10)
    expect(here()).toBe('#/account')
    expect(w.find('[data-testid="account-birth"]').text()).toBe('Fecha de nacimiento: 10/05/2000')
  })

  it('relative-time-wrong: un comentario de 125 min dice "hace 2 h" y con el flag "hace 5 min"; uno de 30 min es igual en ambos', async () => {
    expect(relTime(125)).toEqual({ key: 'article.hoursAgo', n: 2 })
    expect(relTime(125, { wrong: true })).toEqual({ key: 'article.minutesAgo', n: 5 })
    expect(relTime(30)).toEqual(relTime(30, { wrong: true }))
    const posts = generateSite('force-1', 'semi').data.posts.map((p) => ({ ...p, comments: [{ author: 'Ana', textIdx: 0, minutes: 125 }, { author: 'Luis', textIdx: 1, minutes: 30 }] }))
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'relative-time-wrong': 'blog' } : {}, data: { posts } }), { hash: '#/blog/1' }),
      async ({ w }) => {
        await w.findAll('.qa-tablist button')[1].trigger('click')
        return w.findAll('[data-testid="comment-time"]').map((x) => x.text())
      },
    )
    expect(clean).toEqual(['hace 2 h', 'hace 30 min'])
    expect(bug).toEqual(['hace 5 min', 'hace 30 min'])
  })
})

describe('asincronia', () => {
  it.each([['list', '#/catalog'], ['dashboard', '#/dashboard']])('spinner-on-empty-results en %s: buscar "zzzz" deja un spinner eterno sin mensaje vacio solo con el flag', async (page, hash) => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'spinner-on-empty-results': page } : {} }), { hash }),
      async ({ w }) => {
        expect(w.find('.qa-spinner').exists() || w.find('.qa-empty').exists()).toBe(false) // control: con resultados no hay ninguno
        await w.find('input[type=search]').setValue('zzzz')
        return { spinner: w.find('.qa-spinner').exists(), empty: w.find('.qa-empty').exists(), status: w.find('.qa-empty').exists() ? w.find('.qa-empty').attributes('role') : null }
      },
    )
    expect(clean).toEqual({ spinner: false, empty: true, status: 'status' })
    expect(bug).toEqual({ spinner: true, empty: false, status: null })
  })

  it('place-order-twice: pagar con doble click registra 2 pedidos identicos (visibles en la cuenta) y vacia el carrito una vez solo con el flag', async () => {
    const [clean, bug] = await bothWays(
      async (flag) => {
        const site = forceSite({ pages: ALL_PAGES, bugs: flag ? { 'place-order-twice': 'checkout' } : {} })
        const storage = seedStorage(site, { cart: [{ id: 1, qty: 1 }, { id: 2, qty: 1 }], user: SESSION })
        return mountSite(site, { hash: '#/checkout', storage })
      },
      async ({ w, storage, site }) => {
        await fill(w, { name: 'Ana Perez', email: SESSION.email, address: 'Calle 1', city: 'Lima' })
        await w.find('form').trigger('submit')
        await w.find('form').trigger('submit')
        await fill(w, { card: '4111111111111111' })
        vi.useFakeTimers()
        const form = w.find('form')
        await form.trigger('submit')
        await form.trigger('submit')
        await vi.advanceTimersByTimeAsync(1000)
        vi.useRealTimers()
        await tick(10)
        const orders = JSON.parse(storage.getItem(storageKey(site.seed, site.level))).orders
        await go('/account')
        return { saved: orders.length, listed: w.findAll('[data-testid="orders"] li').length, same: orders.length < 2 || orders[0].totals.total === orders[1].totals.total, cart: cartCount(w) }
      },
    )
    expect(clean).toEqual({ saved: 1, listed: 1, same: true, cart: '(0)' })
    expect(bug).toEqual({ saved: 2, listed: 2, same: true, cart: '(0)' })
  })

  it('stale-response-overwrites: con respuestas invertidas la ultima en llegar gana (resultados de la consulta vieja) solo con el flag; el input es el de la 2.ª en ambos', async () => {
    // semilla donde la 1.ª respuesta de busqueda tarda mas que la 2.ª
    const seed = seedWith((s) => { const l = createLatency({ seed: s.seed }); return l.latencyMs('search', 1) > l.latencyMs('search', 2) + 100 })
    const site0 = generateSite(seed, 'senior')
    const names = resolveContent(site0, createLabI18n('es').global.t).items.map((i) => i.name.toLowerCase())
    const countOf = (q) => names.filter((n) => n.includes(q)).length
    const q2 = names[0] // consulta final: el nombre completo del 1.er producto
    const q1 = 'aeiourstnlcmpdb'.split('').find((ch) => countOf(ch) > countOf(q2)) // consulta previa con mas resultados
    expect(q1).toBeTruthy()
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ seed, pages: ALL_PAGES, bugs: flag ? { 'stale-response-overwrites': 'list' } : {} }), { hash: '#/catalog' }),
      async ({ w }) => {
        vi.useFakeTimers()
        const search = w.find('input[type=search]')
        await search.setValue(q1) // consulta 1: responde tarde
        await search.setValue(q2) // consulta 2: responde antes
        await vi.advanceTimersByTimeAsync(700)
        vi.useRealTimers()
        return { input: w.find('input[type=search]').element.value, results: w.find('[data-testid="result-count"]').text() }
      },
    )
    expect(clean.input).toBe(q2)
    expect(bug.input).toBe(q2) // el campo muestra la 2.ª consulta en ambos
    expect(clean.results).toBe(`${countOf(q2)} resultados`)
    expect(bug.results).toBe(`${countOf(q1)} resultados`) // con el flag la respuesta vieja llego despues y piso a la nueva
  })
})

describe('accesibilidad y seguridad de front', () => {
  it('errors-no-aria-live: al enviar vacio el texto de error se ve en ambos, pero solo sin el flag hay role=alert, aria-invalid y aria-describedby', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'errors-no-aria-live': 'contact' } : {} }), { hash: '#/contact' }),
      async ({ w }) => {
        await w.find('form').trigger('submit')
        const invalid = w.find('input[aria-invalid="true"]')
        return {
          visible: w.findAll('.qa-error').length > 0,
          alert: w.findAll('[role="alert"]').length > 0,
          invalid: invalid.exists(),
          described: invalid.exists() && !!w.find(`#${invalid.attributes('aria-describedby')}`).exists(),
        }
      },
    )
    expect(clean).toEqual({ visible: true, alert: true, invalid: true, described: true })
    expect(bug).toEqual({ visible: true, alert: false, invalid: false, described: false })
  })

  it('password-in-url: tras el login la URL contiene email y password solo con el flag; la sesion se inicia en ambos', async () => {
    const [clean, bug] = await bothWays(
      (flag) => mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'password-in-url': 'login' } : {} }), { hash: '#/login' }),
      async ({ w, site }) => {
        await fill(w, { email: site.data.demoUser.email, password: site.data.demoUser.password })
        await w.find('form').trigger('submit')
        await tick(10)
        return { hash: here(), session: w.find('[data-testid="session-user"]').exists(), password: site.data.demoUser.password }
      },
    )
    expect(clean.session && bug.session).toBe(true)
    expect(clean.hash).toBe('#/account')
    expect(bug.hash).toContain('password=')
    expect(bug.hash).toContain(encodeURIComponent(bug.password))
  })

  it('unescaped-comment-html: <b> se renderiza en negrita con el flag y como texto sin el; solo en esta sesion y sin ejecutar handlers (evita un XSS real en el lab)', async () => {
    const post = async (w, text) => {
      await w.findAll('.qa-tablist button')[1].trigger('click')
      await w.find('#qa-comment').setValue(text)
      await w.find('form').trigger('submit')
    }
    for (const flag of [false, true]) {
      const site = forceSite({ pages: ALL_PAGES, bugs: flag ? { 'unescaped-comment-html': 'blog' } : {} })
      const storage = memoryStorage()
      const m = await mountSite(site, { hash: '#/blog/1', storage })
      await post(m.w, '<b>hola</b>')
      expect(m.w.find('.qa-comment b').exists(), `negrita flag=${flag}`).toBe(flag)
      expect(m.w.find('.qa-comment').text()).toContain(flag ? 'hola' : '<b>hola</b>')
      await post(m.w, '<img src=x onerror=alert(1)><script>alert(1)</script>') // payload con handler: jamas crea nodos
      expect(m.w.find('.qa-comment img').exists()).toBe(false)
      expect(m.w.find('.qa-comment script').exists()).toBe(false)
      await go('/faq')
      await go('/blog/1')
      await m.w.findAll('.qa-tablist button')[1].trigger('click')
      expect(m.w.findAll('.qa-comment b').length > 0, `persiste al navegar flag=${flag}`).toBe(flag)
      m.w.unmount()
      // "recarga": un sitio nuevo sobre el mismo storage ya no renderiza HTML (los comentarios dejan de ser de la sesion)
      const again = await mountSite(site, { hash: '#/blog/1', storage })
      await again.w.findAll('.qa-tablist button')[1].trigger('click')
      expect(again.w.find('.qa-comment b').exists(), `tras recargar flag=${flag}`).toBe(false)
      expect(again.w.text()).toContain('<b>hola</b>')
      again.w.unmount()
    }
  })

  it('el store no rehidrata la marca live y valida birth (evita que un storage manipulado reactive HTML sin escapar)', () => {
    const site = forceSite({ pages: ALL_PAGES })
    const storage = seedStorage(site, { comments: { 1: [{ author: 'x', text: '<b>x</b>', minutes: 0, live: true }] }, user: { ...SESSION, birth: 'no-fecha' } })
    const store = createStore(site, storage)
    expect(store.state.comments[1][0].live).toBeUndefined()
    expect(store.state.user.birth).toBeUndefined()
  })
})
