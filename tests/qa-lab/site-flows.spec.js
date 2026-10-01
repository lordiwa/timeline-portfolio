// TASK-047 — flujos largos SIN flags: checkout (cupon, envio, impuestos), wizard condicional, registro,
// listado (busqueda + filtros + orden + paginacion), blog. La version sin bugs tiene que ser correcta.
import { describe, it, expect, afterEach } from 'vitest'
import { computeTotals, toMinor } from '../../src/qa-lab/state/pricing.js'
import { storageKey } from '../../src/qa-lab/state/store.js'
import { visibleFields, visibleSteps } from '../../src/qa-lab/wizard/logic.js'
import { getThemePack } from '../../src/qa-lab/themes/index.js'
import { forceSite, themeSite, ALL_PAGES, mountSite, go, tick, fill, click, cleanup, moneyOf, fieldOf, validValue, fillVisible } from './helpers.js'

afterEach(() => { cleanup() })

// Dinero en unidades menores segun la moneda del pack del sitio (decimals puede ser 0 o 2).
const moneyFns = (site) => {
  const d = getThemePack(site.themeId).currency.decimals
  return { cents: (n) => Math.round(n * 10 ** d), fmt: (c) => moneyOf(site)(c / 10 ** d) }
}

describe('computeTotals (puro)', () => {
  it('orden de calculo: descuento sobre el subtotal, impuesto sobre la base sin envio, envio al final', () => {
    const t = computeTotals({ lines: [{ price: 10, qty: 3 }, { price: 25, qty: 1 }], couponPct: 10, shippingCost: 5, taxRate: 21 })
    expect(t.subtotal).toBe(5500)
    expect(t.discount).toBe(550)
    expect(t.taxable).toBe(4950)
    expect(t.tax).toBe(1040) // round(4950 * 0.21 = 1039.5)
    expect(t.shipping).toBe(500)
    expect(t.total).toBe(4950 + 1040 + 500)
  })

  it('sin cupon ni envio: total = subtotal + impuesto; y el bug solo cambia la 1a linea', () => {
    expect(computeTotals({ lines: [{ price: 7, qty: 2 }], taxRate: 10 }).total).toBe(1540)
    const bug = computeTotals({ lines: [{ price: 7, qty: 2 }, { price: 3, qty: 2 }], firstLineIgnoresQty: true })
    expect(bug.subtotal).toBe(700 + 600)
    expect(toMinor(19.99)).toBe(1999)
  })
})

describe('checkout (caso 6): total correcto con cupon, envio e impuestos', () => {
  async function toShipping(site) {
    const m = await mountSite(site, { hash: '#/catalog' })
    const w = m.w
    const adds = w.findAll('[data-testid="add-to-cart"]')
    await adds[0].trigger('click')
    await adds[1].trigger('click')
    await go('/cart')
    await w.findAll('[data-testid="cart-line"] input')[0].setValue('3')
    await w.findAll('[data-testid="cart-line"] input')[0].trigger('change')
    await go('/checkout')
    await fill(w, { name: 'Ana Perez', email: 'ana@example.com', address: 'Calle 1', city: 'Lima' })
    await w.find('form').trigger('submit')
    return { w, storage: m.storage }
  }
  const text = (w, id) => w.find(`[data-testid="${id}"]`).text()

  it('subtotal, descuento, envio, impuesto y total coinciden con el calculo independiente y el pedido queda registrado', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { cents, fmt } = moneyFns(site)
    const { catalog, coupon, shipping, taxRate } = site.data
    const sub = cents(catalog[0].price) * 3 + cents(catalog[1].price)
    const { w, storage } = await toShipping(site)
    expect(text(w, 'checkout-step')).toBe('Envío y cupón')
    // sin cupon, envio estandar
    expect(text(w, 'sum-subtotal')).toBe(fmt(sub))
    expect(text(w, 'sum-shipping')).toBe(fmt(cents(shipping.standard)))
    expect(w.find('[data-testid="sum-discount"]').exists()).toBe(false)
    expect(text(w, 'sum-tax')).toBe(fmt(Math.round((sub * taxRate) / 100)))
    expect(text(w, 'grand-total')).toBe(fmt(sub + Math.round((sub * taxRate) / 100) + cents(shipping.standard)))

    // envio expres + cupon (en minuscula y con espacios: se acepta)
    await w.find('[data-testid="ship-express"]').setValue(true)
    await w.find('[data-testid="coupon-input"]').setValue(` ${coupon.code.toLowerCase()} `)
    await w.find('[data-testid="coupon-apply"]').trigger('click')
    const disc = Math.round((sub * coupon.pct) / 100)
    const tax = Math.round(((sub - disc) * taxRate) / 100)
    const total = sub - disc + tax + cents(shipping.express)
    expect(text(w, 'sum-discount')).toBe(`-${fmt(disc)}`)
    expect(text(w, 'sum-tax')).toBe(fmt(tax))
    expect(text(w, 'sum-shipping')).toBe(fmt(cents(shipping.express)))
    expect(text(w, 'grand-total')).toBe(fmt(total))

    // retiro en el local: sin costo de envio
    await w.find('[data-testid="ship-pickup"]').setValue(true)
    expect(text(w, 'sum-shipping')).toBe(fmt(0))
    expect(text(w, 'grand-total')).toBe(fmt(sub - disc + tax))
    await w.find('[data-testid="ship-express"]').setValue(true)

    await w.find('form').trigger('submit') // -> pago
    expect(text(w, 'checkout-step')).toBe('Pago')
    await fill(w, { card: '4111111111111111' })
    await w.find('form').trigger('submit')
    expect(text(w, 'checkout-step')).toBe('Pedido confirmado')
    expect(text(w, 'order-total')).toBe(fmt(total))
    expect(text(w, 'order-confirmed')).toContain('ORD-1001')
    expect(text(w, 'cart-count')).toBe('(0)') // el carrito se vacia al confirmar
    // el pedido persiste y aparece en la cuenta una vez logueado
    const saved = JSON.parse(storage.getItem(storageKey(site.seed, site.level)))
    expect(saved.orders).toHaveLength(1)
    expect(saved.orders[0].totals.total).toBe(total)
    w.unmount()
  })

  it('un cupon invalido o vacio da error y no cambia el total; quitar el cupon lo restaura', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w, storage } = await toShipping(site)
    const before = text(w, 'grand-total')
    await w.find('[data-testid="coupon-input"]').setValue('NOEXISTE')
    await w.find('[data-testid="coupon-apply"]').trigger('click')
    expect(w.find('[data-testid="coupon-error"]').exists()).toBe(true)
    expect(text(w, 'grand-total')).toBe(before)
    await w.find('[data-testid="coupon-input"]').setValue('  ')
    await w.find('[data-testid="coupon-apply"]').trigger('click')
    expect(w.find('[data-testid="coupon-error"]').exists()).toBe(true)
    await w.find('[data-testid="coupon-input"]').setValue(site.data.coupon.code)
    await w.find('[data-testid="coupon-apply"]').trigger('click')
    expect(text(w, 'grand-total')).not.toBe(before)
    await w.find('[data-testid="coupon-applied"] button').trigger('click')
    expect(text(w, 'grand-total')).toBe(before)
    w.unmount()
  })

  it('con carrito vacio el checkout no deja avanzar; datos invalidos bloquean el paso (evita pedidos vacios o sin datos)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/checkout' })
    expect(w.find('[data-testid="checkout-empty"]').exists()).toBe(true)
    await go('/catalog')
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    await go('/checkout')
    await w.find('form').trigger('submit') // todo vacio
    expect(w.find('[data-testid="checkout-step"]').text()).toBe('Tus datos')
    expect(w.findAll('.qa-error').length).toBe(4)
    await fill(w, { name: 'Ana', email: 'sin-arroba', address: 'x', city: 'y' })
    await w.find('form').trigger('submit')
    expect(w.find('[data-testid="checkout-step"]').text()).toBe('Tus datos') // email invalido
    w.unmount()
  })

  it('cantidad 0, negativa, vacia o enorme en el carrito se acota a 1..99 (evita totales negativos)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/catalog' })
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    await go('/cart')
    const input = () => w.find('[data-testid="cart-line"] input')
    for (const [v, expected] of [['0', '1'], ['-5', '1'], ['', '1'], ['500', '99'], ['2.7', '2']]) {
      await input().setValue(v)
      await input().trigger('change')
      expect(input().element.value, v).toBe(expected)
    }
    const { cents, fmt } = moneyFns(site)
    const price = site.data.catalog[0].price
    expect(w.find('[data-testid="cart-subtotal"]').text()).toBe(fmt(cents(price) * 2))
    await w.find('[data-testid="remove-line"]').trigger('click')
    expect(w.find('[data-testid="cart-empty"]').exists()).toBe(true)
    w.unmount()
  })

  it('doble envio del pago registra un solo pedido (evita pedidos duplicados sin bug)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w, storage } = await toShipping(site)
    await w.find('form').trigger('submit')
    await fill(w, { card: '4111111111111111' })
    const form = w.find('form')
    await Promise.all([form.trigger('submit'), form.trigger('submit')]) // dos envios antes del re-render
    expect(w.text()).toContain('ORD-1001')
    expect(w.text()).not.toContain('ORD-1002')
    w.unmount()
  })
})

describe('wizard (caso 5): validacion condicional', () => {
  // Pack del oraculo: pasos s1 (naturaleza, radio), s2 (fecha + urgencia 1-5), s3 (reino: SOLO si seekerKind === 'a-realm'), s4 (pregunta) + confirm.
  const site = () => themeSite('oraculo-gruta-dorada', { pages: ALL_PAGES })
  const progress = (w) => w.find('[data-testid="wizard-progress"]').text()
  const next = (w) => w.find('form').trigger('submit')

  it('logica pura: los pasos y campos condicionales del pack se ocultan hasta que ifField === equals', () => {
    const spec = site().data.wizard
    expect(visibleSteps(spec, {}).map((s) => s.id)).toEqual(['s1', 's2', 's4', 'confirm'])
    expect(visibleSteps(spec, { seekerKind: 'one-person' }).map((s) => s.id)).toEqual(['s1', 's2', 's4', 'confirm'])
    expect(visibleSteps(spec, { seekerKind: 'a-realm' }).map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4', 'confirm'])
    const realm = spec.steps.find((s) => s.id === 's3')
    expect(visibleFields(spec, realm, {})).toEqual([])
    expect(visibleFields(spec, realm, { seekerKind: 'a-realm' })).toEqual(['realmName'])
  })

  it('el wizard sigue los pasos del pack: "Un reino" agrega el paso del reino y lo exige con sus reglas (minLength 3)', async () => {
    const s = site()
    const { w } = await mountSite(s, { hash: '#/wizard' })
    expect(progress(w)).toContain('Paso 1 de 4')
    expect(progress(w)).toContain('Naturaleza') // titulo del paso = pack.wizard.steps[0].title
    await fill(w, { seekerKind: '1' }) // 'a-realm'
    expect(progress(w)).toContain('Paso 1 de 5')
    await next(w)
    await fillVisible(w, s)
    await next(w)
    expect(progress(w)).toContain('Paso 3 de 5')
    expect(progress(w)).toContain('Reino')
    await next(w) // falta el nombre del reino
    expect(w.find('[data-field="realmName"] .qa-error').exists()).toBe(true)
    expect(progress(w)).toContain('Paso 3 de 5')
    await fill(w, { realmName: 'ab' })
    await next(w) // minLength 3
    expect(w.find('[data-field="realmName"] .qa-error').exists()).toBe(true)
    await fill(w, { realmName: 'Aurea' })
    await next(w)
    await fillVisible(w, s)
    await next(w)
    expect(progress(w)).toContain('Paso 5 de 5')
    expect(w.find('[data-testid="wizard-summary"]').text()).toContain('Aurea')
    await next(w) // falta aceptar
    expect(w.find('[data-field="terms"] .qa-error').exists()).toBe(true)
    await fill(w, { terms: true })
    await next(w)
    expect(w.find('[data-testid="submissions"]').text()).toContain('1')
    w.unmount()
  })

  it('un paso y un campo ocultos no se validan ni se resumen: con "Una persona" no hay paso del reino; las reglas min/max del numero aplican', async () => {
    const s = site()
    const { w } = await mountSite(s, { hash: '#/wizard' })
    await fill(w, { seekerKind: '0' })
    await next(w)
    await fillVisible(w, s, { urgency: '9' }) // max 5
    await next(w)
    expect(progress(w)).toContain('Paso 2 de 4') // sigue en el paso 2
    expect(w.find('[data-field="urgency"] .qa-error').exists()).toBe(true)
    await fill(w, { urgency: '5' })
    await next(w)
    expect(progress(w)).toContain('Paso 3 de 4') // la pregunta: el paso del reino se salto
    await fillVisible(w, s)
    await next(w)
    expect(progress(w)).toContain('Paso 4 de 4')
    expect(w.find('[data-testid="wizard-summary"]').text()).not.toContain('Reino')
    await fill(w, { terms: true })
    await next(w)
    expect(w.find('[data-testid="submissions"]').text()).toContain('1')
    w.unmount()
  })
})

describe('registro y cuenta', () => {
  it('registrarse inicia sesion, rechaza un correo repetido y el usuario nuevo puede volver a ingresar', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/signup' })
    const nameKey = site.data.signupFields.find((k) => site.data.fieldMeta[k].nameLike)
    const userName = validValue(fieldOf(site, nameKey))
    const password = validValue(fieldOf(site, 'password'))
    const fillAll = () => fillVisible(w, site, { email: 'nuevo@example.com', password, [nameKey]: userName })
    await fillAll()
    await w.find('form').trigger('submit')
    await tick()
    expect(w.find('[data-testid="session-user"]').text()).toBe(userName)
    expect(w.find('main [data-page]').attributes('data-page')).toBe('account')
    await w.find('[data-testid="nav-logout"]').trigger('click')
    // el mismo correo ya existe
    await go('/signup')
    await fillAll()
    await w.find('form').trigger('submit')
    expect(w.find('[data-field="email"] .qa-error').text()).toContain('Ya existe')
    // y puede ingresar con esa cuenta
    await go('/login')
    await fill(w, { email: 'NUEVO@example.com', password })
    await w.find('form').trigger('submit')
    await tick()
    expect(w.find('[data-testid="session-user"]').text()).toBe(userName)
    w.unmount()
  })
})

describe('listado: busqueda + filtros combinados + orden + paginacion', () => {
  it('los filtros se combinan (AND), el orden funciona, la pagina vuelve a 1 al filtrar y "Limpiar" restaura todo', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { catalog, list } = site.data
    const { w } = await mountSite(site, { hash: '#/catalog' })
    const total = () => Number(w.find('[data-testid="result-count"]').text().match(/\d+/)[0])
    expect(total()).toBe(catalog.length)
    expect(w.findAll('[data-testid="item-card"]').length).toBe(list.pageSize)

    await click(w, 'Siguiente').trigger('click')
    expect(w.find('.qa-page-info').text()).toContain('Página 2')
    await w.find('[data-testid="filter-cat"]').setValue('1')
    expect(w.find('.qa-page-info').text()).toContain('Página 1')
    expect(total()).toBe(catalog.filter((r) => r.cat === 1).length)

    const band = w.find('[data-testid="filter-price"]').findAll('option')[2].element.value // 2o umbral (calculado de los precios del pack)
    await w.find('[data-testid="filter-price"]').setValue(band)
    expect(total()).toBe(catalog.filter((r) => r.cat === 1 && r.price <= Number(band)).length)

    await w.find('input[type=search]').setValue('zzzz')
    expect(total()).toBe(0)
    expect(w.text()).toContain('No hay resultados.')
    await click(w, 'Limpiar filtros').trigger('click')
    expect(total()).toBe(catalog.length)
    expect(w.find('[data-testid="filter-cat"]').element.value).toBe('')
    expect(w.find('[data-testid="filter-price"]').element.value).toBe('')

    // orden por precio ascendente (el 1er elemento es el mas barato)
    await w.find('.qa-dd-toggle').trigger('click')
    await w.findAll('.qa-dd-menu button').find((b) => b.text().includes('menor a mayor')).trigger('click')
    const prices = w.findAll('[data-testid="item-card"] .qa-price').map((p) => Number(p.text().replace(/[^\d.]/g, '')))
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    expect(prices[0]).toBe(Math.min(...catalog.map((r) => r.price)))
    w.unmount()
  })

  it('los filtros se conservan al ir al detalle y volver (evita perder la busqueda al navegar)', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/catalog' })
    await w.find('[data-testid="filter-cat"]').setValue('2')
    await go('/catalog/1')
    expect(w.find('[data-testid="detail-price"]').exists()).toBe(true)
    await go('/catalog')
    expect(w.find('[data-testid="filter-cat"]').element.value).toBe('2')
    w.unmount()
  })
})

describe('blog con comentarios', () => {
  it('un comentario nuevo persiste al navegar y un comentario vacio se ignora', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/blog/1' })
    await w.findAll('.qa-tablist button')[1].trigger('click')
    const before = w.findAll('[data-testid="comment"]').length
    await w.find('textarea').setValue('   ')
    await w.find('form').trigger('submit')
    expect(w.findAll('[data-testid="comment"]').length).toBe(before)
    await w.find('textarea').setValue('Excelente nota')
    await w.find('form').trigger('submit')
    expect(w.findAll('[data-testid="comment"]').length).toBe(before + 1)
    await go('/faq')
    await go('/blog/1')
    await w.findAll('.qa-tablist button')[1].trigger('click')
    expect(w.text()).toContain('Excelente nota')
    w.unmount()
  })
})
