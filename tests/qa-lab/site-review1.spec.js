// TASK-047 review ronda 1: URL como fuente de verdad (R-1), persistencia (R-2, R-3), navbar, solucionario,
// accesibilidad de rutas y carrito de invitado.
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { storageKey, memoryStorage } from '../../src/qa-lab/state/store.js'
import { bugLocation } from '../../src/qa-lab/bugs/locations.js'
import { formKeys } from '../../src/qa-lab/generator/capabilities.js'
import App from '../../src/qa-lab/App.vue'
import es from '../../src/qa-lab/i18n/es.json'
import { getThemePack } from '../../src/qa-lab/themes/index.js'
import { forceSite, ALL_PAGES, mountSite, go, back, forward, tick, fill, track, cleanup } from './helpers.js'

afterEach(cleanup)

const mountApp = (search, hash = '') => {
  window.history.replaceState(null, '', `/qa-lab/${search}${hash}`)
  const url = new URL(window.location.href)
  return track(mount(App, { props: { initialSeed: url.searchParams.get('seed') || '', initialLevel: url.searchParams.get('level') || '' }, global: { plugins: [createLabI18n('es')] }, attachTo: document.body }))
}
const navCount = (w) => w.findAll('[data-nav]').length
const expectedNav = (site) => ['home', 'list', 'blog', 'faq', 'contact', 'dashboard', 'wizard', 'cart'].filter((p) => site.pages.includes(p)).length
const state = (w) => ({
  level: new URL(window.location.href).searchParams.get('level'),
  seed: new URL(window.location.href).searchParams.get('seed'),
  select: w.find('[data-testid="level"]').element.value,
  shownSeed: w.find('[data-testid="seed"]').text(),
  links: w.findAll('[data-nav]').map((a) => a.attributes('data-nav')).filter((n) => !['login', 'signup', 'account'].includes(n)).length,
})

describe('R-1: la URL es la fuente de verdad con atras / adelante', () => {
  it('nivel: ?seed=lvl-2&level=junior, #/catalog, selector en senior, atras y adelante mantienen URL, selector y navbar coherentes', async () => {
    const w = mountApp('?seed=lvl-2&level=junior')
    await go('/catalog')
    await w.find('[data-testid="level"]').setValue('senior')
    expect(state(w)).toMatchObject({ level: 'senior', select: 'senior' })
    expect(window.location.hash).toBe('#/')
    expect(state(w).links).toBe(expectedNav(generateSite('lvl-2', 'senior')))

    await back()
    expect(state(w)).toMatchObject({ level: 'junior', select: 'junior', seed: 'lvl-2' }) // la URL dice junior Y se renderiza junior
    expect(state(w).links).toBe(expectedNav(generateSite('lvl-2', 'junior')))
    expect(window.location.hash).toBe('#/catalog')

    await go('/faq') // navegar despues de atras no reescribe el nivel
    expect(new URL(window.location.href).searchParams.get('level')).toBe('junior')

    await back(); await back()
    await forward()
    expect(new URL(window.location.href).searchParams.get('level')).toBe(state(w).select) // siempre coherentes
  })

  it('nivel, paso a paso: despues de adelante vuelve a senior con la URL y el sitio de senior', async () => {
    const w = mountApp('?seed=lvl-2&level=junior')
    await go('/catalog')
    await w.find('[data-testid="level"]').setValue('senior')
    await back()
    await forward()
    expect(state(w)).toMatchObject({ level: 'senior', select: 'senior' })
    expect(state(w).links).toBe(expectedNav(generateSite('lvl-2', 'senior')))
    expect(window.location.hash).toBe('#/')
  })

  it('"nueva pagina": atras vuelve a la semilla anterior (URL, semilla visible y navbar) y adelante a la nueva', async () => {
    const w = mountApp('?seed=old-1&level=semi')
    await go('/blog')
    await w.find('[data-testid="new-page"]').trigger('click')
    const fresh = w.find('[data-testid="seed"]').text()
    expect(fresh).not.toBe('old-1')
    expect(new URL(window.location.href).searchParams.get('seed')).toBe(fresh)
    expect(window.location.hash).toBe('#/')

    await back()
    expect(state(w)).toMatchObject({ seed: 'old-1', shownSeed: 'old-1' })
    expect(state(w).links).toBe(expectedNav(generateSite('old-1', 'semi')))
    await forward()
    expect(state(w)).toMatchObject({ seed: fresh, shownSeed: fresh })
    expect(state(w).links).toBe(expectedNav(generateSite(fresh, 'semi')))
  })
})

describe('R-2 / R-3: persistencia', () => {
  it('R-2: los filtros del listado persisten al navegar pero NO al recargar (solo memoria)', async () => {
    const storage = memoryStorage()
    const site = forceSite({ pages: ALL_PAGES })
    const a = await mountSite(site, { hash: '#/catalog', storage })
    await a.w.find('[data-testid="filter-cat"]').setValue('2')
    await go('/faq')
    await go('/catalog')
    expect(a.w.find('[data-testid="filter-cat"]').element.value).toBe('2')
    expect(String(storage.getItem(storageKey(site.seed, site.level)))).not.toContain('listUi')
    a.w.unmount()
    const b = await mountSite(site, { hash: '#/catalog', storage })
    expect(b.w.find('[data-testid="filter-cat"]').element.value).toBe('')
  })

  it('R-3: pedidos y comentarios corruptos se descartan sin romper el sitio y lo valido se conserva', async () => {
    const storage = memoryStorage()
    const site = forceSite({ pages: ALL_PAGES })
    const good = { id: 'ORD-1001', lines: [{ id: 1, qty: 1, price: 5 }], totals: { total: 500, decimals: 2 }, shipping: 'standard', customer: { name: 'Ana', email: 'ana@example.com' }, userEmail: 'ana@example.com' }
    storage.setItem(storageKey(site.seed, site.level), JSON.stringify({
      user: { name: 'Ana', email: 'ana@example.com' },
      orders: [good, { id: 'ORD-9' }, { id: 'ORD-8', lines: 'x', totals: {}, customer: null }, 5, null, { ...good, id: 'ORD-7', customer: { email: 3 } }],
      comments: { 1: [{ author: null, text: 'ok', minutes: 0 }, { text: 5 }, 'x', null], 2: 'no-es-array', 3: { a: 1 } },
    }))
    const { w } = await mountSite(site, { hash: '#/account', storage })
    expect(w.find('[data-testid="orders"]').findAll('li')).toHaveLength(1)
    expect(w.find('[data-testid="orders"]').text()).toContain('ORD-1001')
    await go('/blog/1')
    await w.findAll('.qa-tablist button')[1].trigger('click')
    expect(w.text()).toContain('ok')
    await go('/blog/2')
    expect(w.find('h1').exists()).toBe(true) // comentarios corruptos de otro post no rompen
    w.unmount()

    storage.setItem(storageKey(site.seed, site.level), JSON.stringify({ orders: 'no', comments: [1, 2] }))
    const again = await mountSite(site, { hash: '#/blog/1', storage })
    expect(again.w.find('h1').exists()).toBe(true)
  })

  it('R-9: cerrar sesion NO vacia el carrito (carrito de invitado), y la ayuda del lab lo dice', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/catalog' })
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    await go('/login')
    await fill(w, { email: site.data.demoUser.email, password: site.data.demoUser.password })
    await w.find('form').trigger('submit')
    await tick()
    await w.find('[data-testid="nav-logout"]').trigger('click')
    expect(w.find('[data-testid="cart-count"]').text()).toContain('(1)')
    expect(es.lab.cartNote).toContain('sobrevive al cerrar sesión')
    const app = mountApp('?seed=x1&level=semi')
    expect(app.find('.lab-meta').text()).toContain(es.lab.cartNote)
  })
})

describe('R-4 / R-5 / R-6 / R-7: navbar, solucionario, login y foco', () => {
  it('R-4: "Mi cuenta" esta siempre en el navbar (sin sesion lleva al login por el guard)', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/' })
    const link = w.find('[data-testid="account-link"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('#/account')
    await go('/account')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('login')
  })

  it('R-5: el solucionario muestra la ubicacion exacta (blog -> post -> Comentarios, checkout paso 3, wizard paso)', () => {
    const site = forceSite({ pages: ALL_PAGES, bugs: { 'missing-label': 'blog' } })
    expect(bugLocation(site, 'missing-label')).toEqual({ key: 'lab.where.blogComments' })
    const co = forceSite({ pages: ALL_PAGES, bugs: { 'missing-label': 'checkout', 'button-covered': 'checkout', 'email-no-at': 'checkout' } })
    co.data.labelTargets.checkout = 'card'
    expect(bugLocation(co, 'missing-label')).toMatchObject({ key: 'lab.where.checkoutStep', n: 3, stepKey: 'checkout.step.payment' })
    expect(bugLocation(co, 'email-no-at')).toMatchObject({ n: 1 })
    expect(bugLocation(co, 'button-covered')).toBeNull()
    const wz = forceSite({ pages: ALL_PAGES, bugs: { 'age-off-by-one': 'wizard', 'double-submit': 'wizard' } })
    // los pasos del wizard vienen del pack (s1..sN): el de age-off-by-one es el que tiene el campo numerico visible
    const numKey = formKeys(wz.data, 'wizard').find((k) => wz.data.fieldMeta[k].type === 'number')
    const numStep = wz.data.wizard.steps.find((s) => s.fields.includes(numKey)).id
    expect(bugLocation(wz, 'age-off-by-one')).toMatchObject({ stepKey: `wizard.step.${numStep}` })
    expect(bugLocation(wz, 'double-submit')).toMatchObject({ stepKey: 'wizard.step.confirm' })
    expect(bugLocation(forceSite({ pages: ALL_PAGES, bugs: { 'console-error': 'faq' } }), 'console-error')).toEqual({ key: 'lab.where.helpButton' })
  })

  it('R-5: el solucionario del shell pinta la ubicacion en el DOM para cada bug que la tiene', async () => {
    let found = 0
    for (const s of ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5', 'loc-6']) {
      const w = mountApp(`?seed=${s}&level=senior`)
      await w.find('[data-testid="reveal"]').trigger('click')
      const site = generateSite(s, 'senior')
      for (const li of w.findAll('[data-testid="solution"] li')) {
        const id = li.attributes('data-bug-id')
        expect(li.find('[data-testid="bug-where"]').exists(), `${s} ${id}`).toBe(!!bugLocation(site, id))
        if (li.find('[data-testid="bug-where"]').exists()) found += 1
      }
      w.unmount()
    }
    expect(found).toBeGreaterThan(5)
  })

  it('R-6: el login usa autocomplete current-password y username', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/login' })
    expect(w.find('#qa-password').attributes('autocomplete')).toBe('current-password')
    expect(w.find('#qa-email').attributes('autocomplete')).toBe('username')
    const s = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/signup' })
    expect(s.w.find('#qa-password').attributes('autocomplete')).toBe('new-password')
  })

  it('R-7: al cambiar de ruta el foco va al h1 y document.title refleja la pagina (y el idioma)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/' })
    expect(document.title).toContain('Inicio')
    await go('/faq')
    expect(document.activeElement).toBe(w.find('main h1').element)
    expect(w.find('main h1').attributes('tabindex')).toBe('-1')
    expect(document.title.startsWith(es.pageName.faq)).toBe(true)
    await go('/cart')
    expect(document.activeElement).toBe(w.find('main h1').element)
    expect(document.title.startsWith(es.pageName.cart)).toBe(true)
  })

  it('R-7: el foco por defecto no rompe el bug modal-focus-lost: sin flag el foco vuelve al boton, con flag no', async () => {
    for (const flag of [false, true]) {
      const { w } = await mountSite(forceSite({ pages: ALL_PAGES, bugs: flag ? { 'modal-focus-lost': 'faq' } : {} }), { hash: '#/faq' })
      await go('/contact')
      await go('/faq')
      const help = w.findAll('button').find((b) => b.text() === 'Ayuda')
      help.element.focus()
      await help.trigger('click')
      await tick()
      await w.find('.qa-modal .qa-btn').trigger('click')
      await tick()
      expect(document.activeElement !== help.element).toBe(flag)
      w.unmount()
    }
  })
})

describe('R-8: typo en el blog', () => {
  it('con el flag el titulo del listado y del post difiere del correcto; sin flag coincide', async () => {
    for (const flag of [false, true]) {
      const site = forceSite({ pages: ALL_PAGES, bugs: flag ? { typo: 'blog' } : {} })
      const pack = getThemePack(site.themeId)
      const brand = pack.name.es
      const list = await mountSite(site, { hash: '#/blog' })
      expect(list.w.find('h1').text() !== es.tpl.blog.title.replace('{brand}', brand)).toBe(flag)
      await go('/blog/1')
      const expected = pack.posts[site.data.posts[0].postIdx].title.es
      expect(list.w.find('h1').text() !== expected).toBe(flag)
      list.w.unmount()
    }
  })
})
