// TASK-047 — router por hash, historial, deep links, guard de rutas protegidas, estado compartido.
import { describe, it, expect, afterEach } from 'vitest'
import { parseHash, resolveRoute, safeNext } from '../../src/qa-lab/router/index.js'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { storageKey, memoryStorage } from '../../src/qa-lab/state/store.js'
import { forceSite, ALL_PAGES, mountSite, go, tick, fill, here, cleanup, back, forward } from './helpers.js'

afterEach(() => { cleanup() })

describe('router: funciones puras', () => {
  const site = forceSite({ pages: ALL_PAGES })

  it('parseHash separa ruta y query y normaliza (evita rutas con barra final o vacias)', () => {
    expect(parseHash('')).toEqual({ path: '/', query: {} })
    expect(parseHash('#/cart/')).toEqual({ path: '/cart', query: {} })
    expect(parseHash('#/login?next=%2Faccount')).toEqual({ path: '/login', query: { next: '/account' } })
    expect(parseHash('#cart').path).toBe('/cart')
  })

  it('una ruta protegida sin sesion redirige al login con next; con sesion entra (guard)', () => {
    const r = resolveRoute(site, '#/account', false)
    expect(r.redirect).toBe('/login?next=%2Faccount')
    expect(resolveRoute(site, '#/account', true).redirect).toBeUndefined()
    expect(resolveRoute(site, '#/account', true).type).toBe('account')
  })

  it('con sesion, /login y /signup mandan al destino next (o a la cuenta) (evita quedarse en el login ya autenticado)', () => {
    expect(resolveRoute(site, '#/login?next=%2Fcart', true).redirect).toBe('/cart')
    expect(resolveRoute(site, '#/login', true).redirect).toBe('/account')
    expect(resolveRoute(site, '#/signup', true).redirect).toBe('/account')
  })

  it('next solo acepta rutas internas que existen (evita open redirect)', () => {
    expect(safeNext(site, '/cart')).toBe('/cart')
    expect(safeNext(site, '//evil.com')).toBeNull()
    expect(safeNext(site, 'https://evil.com')).toBeNull()
    expect(safeNext(site, '/no-existe')).toBeNull()
    expect(safeNext(site, undefined)).toBeNull()
  })

  it('detalle y post resuelven con parametro; id inexistente da notfound', () => {
    expect(resolveRoute(site, '#/catalog/3', false)).toMatchObject({ type: 'detail', params: { id: 3 } })
    expect(resolveRoute(site, '#/blog/2', false)).toMatchObject({ type: 'blog', params: { id: 2 } })
    expect(resolveRoute(site, '#/catalog/9999', false).type).toBe('notfound')
    expect(resolveRoute(site, '#/blog/abc', false).type).toBe('notfound')
  })
})

describe('router: navegacion en el navegador', () => {
  it('deep link ?seed&level#/ruta: la misma URL da exactamente la misma pagina (caso 2)', async () => {
    const site = generateSite('deep-9', 'senior')
    const target = site.pages.includes('faq') ? '/faq' : '/'
    const a = await mountSite(site, { hash: `#${target}` })
    const htmlA = a.w.find('main').html()
    a.w.unmount()
    const b = await mountSite(site, { hash: `#${target}` })
    expect(b.w.find('main').html()).toBe(htmlA)
    b.w.unmount()
  })

  it('atras y adelante del navegador recorren las paginas (caso 1)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/' })
    await go('/catalog')
    await go('/faq')
    expect(w.find('[data-page]').attributes('data-page')).toBe('faq')
    await back()
    expect(here()).toBe('#/catalog')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('list')
    await forward()
    expect(w.find('main [data-page]').attributes('data-page')).toBe('faq')
    w.unmount()
  })

  it('el navbar lista exactamente las paginas del sitio, con links a su ruta (evita links muertos)', async () => {
    const site = generateSite('nav-3', 'semi')
    const { w } = await mountSite(site, { hash: '#/' })
    const types = w.findAll('[data-nav]').map((a) => a.attributes('data-nav'))
    for (const t of types) expect(site.pages).toContain(t)
    for (const t of ['home', 'list', 'blog', 'faq', 'contact', 'dashboard', 'wizard', 'cart']) {
      expect(types.includes(t)).toBe(site.pages.includes(t))
    }
    w.unmount()
  })

  it('"Mi cuenta" sin sesion manda al login y, tras ingresar, vuelve a la cuenta (caso 4)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/' })
    await go('/account')
    expect(here()).toContain('#/login?next=')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('login')
    const { email, password } = site.data.demoUser
    await fill(w, { email, password })
    await w.find('form').trigger('submit')
    await tick()
    expect(here()).toBe('#/account')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('account')
    expect(w.find('[data-testid="account-user"]').text()).toContain(email)
    // cerrar sesion desde la cuenta vuelve al inicio y la cuenta queda protegida de nuevo
    await w.find('[data-testid="logout"]').trigger('click')
    await tick()
    expect(w.find('main [data-page]').attributes('data-page')).toBe('home')
    await go('/account')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('login')
    w.unmount()
  })

  it('credenciales incorrectas no inician sesion y no dejan pasar a la cuenta (evita un guard que cede)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/login' })
    await fill(w, { email: site.data.demoUser.email, password: 'incorrecta-123' })
    await w.find('form').trigger('submit')
    expect(w.find('[data-testid="login-error"]').exists()).toBe(true)
    await go('/account')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('login')
    w.unmount()
  })
})

describe('estado compartido', () => {
  const addFirst = async (w) => {
    await w.find('[data-testid="add-to-cart"]').trigger('click')
  }

  it('el carrito persiste al navegar entre paginas y suma en el navbar (caso 3)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/catalog' })
    expect(w.find('[data-testid="cart-count"]').text()).toContain('(0)')
    await addFirst(w)
    await addFirst(w)
    expect(w.find('[data-testid="cart-count"]').text()).toContain('(2)')
    await go('/faq')
    await go('/blog')
    expect(w.find('[data-testid="cart-count"]').text()).toContain('(2)')
    await go('/cart')
    expect(w.findAll('[data-testid="cart-line"]').length).toBe(1)
    expect(w.find('[data-testid="cart-line"] input').element.value).toBe('2')
    w.unmount()
  })

  it('el carrito sobrevive a una recarga (sessionStorage) y esta aislado por (seed, level)', async () => {
    const storage = memoryStorage()
    const site = forceSite({ pages: ALL_PAGES, seed: 'persist-1', level: 'semi' })
    const a = await mountSite(site, { hash: '#/catalog', storage })
    await addFirst(a.w)
    a.w.unmount()
    expect(JSON.parse(storage.getItem(storageKey('persist-1', 'semi'))).cart).toHaveLength(1)

    const b = await mountSite(site, { hash: '#/cart', storage })
    expect(b.w.findAll('[data-testid="cart-line"]').length).toBe(1)
    b.w.unmount()

    const other = await mountSite(forceSite({ pages: ALL_PAGES, seed: 'persist-1', level: 'senior' }), { hash: '#/cart', storage })
    expect(other.w.find('[data-testid="cart-empty"]').exists()).toBe(true) // otro nivel = otro estado
    other.w.unmount()
  })

  it('un storage corrupto no rompe el sitio (evita pantalla en blanco por datos viejos)', async () => {
    const storage = memoryStorage()
    storage.setItem(storageKey('force-1', 'semi'), '{"cart": "no-es-un-array", "user": 5')
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/cart', storage })
    expect(w.find('[data-testid="cart-empty"]').exists()).toBe(true)
    w.unmount()
    storage.setItem(storageKey('force-1', 'semi'), JSON.stringify({ cart: [{ id: 9999, qty: 3 }, { id: 1, qty: 500 }], coupon: 'FALSO' }))
    const again = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/cart', storage })
    expect(again.w.findAll('[data-testid="cart-line"]').length).toBe(1) // el id inexistente se descarta
    expect(again.w.find('[data-testid="cart-line"] input').element.value).toBe('99') // la cantidad se acota
    again.w.unmount()
  })

  it('la sesion persiste al navegar y el navbar muestra al usuario y "Salir"', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/login' })
    await fill(w, { email: site.data.demoUser.email, password: site.data.demoUser.password })
    await w.find('form').trigger('submit')
    await tick()
    await go('/faq')
    expect(w.find('[data-testid="session-user"]').text()).toBe(site.data.demoUser.name)
    await w.find('[data-testid="nav-logout"]').trigger('click')
    expect(w.find('[data-testid="session-user"]').exists()).toBe(false)
    w.unmount()
  })
})
