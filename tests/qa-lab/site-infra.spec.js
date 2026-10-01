// TASK-047 (extension) — infraestructura para los bugs v2: composicion de paginas, capacidades, bugParams,
// reloj / zona horaria / latencia inyectables, contadores de acciones, skip-link y lint estatico.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { generateSite, genBugParams, bugPool } from '../../src/qa-lab/generator/site.js'
import { LEVELS } from '../../src/qa-lab/generator/levels.js'
import { capabilitiesOf, capFlags, hasCap, requiresMet } from '../../src/qa-lab/generator/capabilities.js'
import { createRng } from '../../src/qa-lab/generator/prng.js'
import { createClock, createLatency, createEnv } from '../../src/qa-lab/services/clock.js'
import { createStore, memoryStorage } from '../../src/qa-lab/state/store.js'
import { checkField } from '../../src/qa-lab/composables/useForm.js'
import { visibleFields } from '../../src/qa-lab/wizard/logic.js'
import { isoFromOffset, resolveContent } from '../../src/qa-lab/content/index.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { forceSite, ALL_PAGES, mountSite, go, tick, fill, cleanup } from './helpers.js'

afterEach(() => { cleanup(); vi.useRealTimers() })

const seeds = Array.from({ length: 200 }, (_, i) => `seed-${i}`)
const FORMS = ['signup', 'contact', 'checkout', 'wizard']

describe('composicion de paginas (reglas del orquestador)', () => {
  it.each(LEVELS)('%s: siempre un listado y al menos una pagina con formulario en 200 semillas (evita sitios sin donde manifestar bugs)', (level) => {
    for (const s of seeds) {
      const { pages } = generateSite(s, level)
      expect(pages, s).toContain('list')
      expect(FORMS.some((f) => pages.includes(f)), s).toBe(true)
    }
  })

  it('senior incluye siempre el nucleo de comercio: listado, detalle, carrito y checkout', () => {
    for (const s of seeds) {
      const { pages } = generateSite(s, 'senior')
      for (const p of ['list', 'detail', 'cart', 'checkout']) expect(pages, `${s} ${p}`).toContain(p)
    }
  })

  it('el mundo (tema, datos) no cambia por las reglas de composicion: depende solo de la semilla', () => {
    for (const s of seeds.slice(0, 20)) {
      expect(JSON.stringify(generateSite(s, 'junior').data)).toBe(JSON.stringify(generateSite(s, 'senior').data))
    }
  })
})

describe('capacidades del sitio', () => {
  it('se derivan de las paginas presentes y estan ordenadas, sin duplicados (el sitio sigue siendo JSON)', () => {
    const site = forceSite({ pages: ['home', 'list', 'cart', 'checkout', 'login', 'account'] })
    expect(site.capabilities).toEqual([...new Set(site.capabilities)].sort())
    for (const c of ['list', 'list-pagination', 'cart', 'checkout', 'coupon', 'shipping', 'tax', 'auth', 'account', 'protected-routes', 'orders', 'forms', 'modal', 'mobile-nav']) {
      expect(site.capabilities, c).toContain(c)
    }
    for (const c of ['register', 'detail', 'wizard', 'blog-comments', 'contact', 'faq', 'dashboard']) expect(site.capabilities, c).not.toContain(c)
    expect(capFlags(site)).toMatchObject({ hasCart: true, hasCheckout: true, hasLogin: true, hasAccount: true, hasDetail: false, hasWizard: false, hasList: true })
  })

  it('cada pagina aporta sus capacidades en los 3 niveles (consistencia con las paginas elegidas)', () => {
    for (const level of LEVELS) {
      for (const s of seeds.slice(0, 50)) {
        const site = generateSite(s, level)
        expect(site.capabilities).toEqual(capabilitiesOf(site.pages, site.data))
        expect(hasCap(site, 'cart')).toBe(site.pages.includes('cart'))
        expect(hasCap(site, 'auth')).toBe(site.pages.includes('login'))
        expect(hasCap(site, 'forms')).toBe(FORMS.some((f) => site.pages.includes(f)))
        expect(hasCap(site, 'wizard-conditional')).toBe(site.pages.includes('wizard'))
      }
    }
  })

  it('un bug con requires solo entra al pool si el sitio cumple todas sus capacidades', () => {
    const caps = ['list', 'modal']
    expect(requiresMet({ requires: ['list'] }, caps)).toBe(true)
    expect(requiresMet({ requires: ['list', 'cart'] }, caps)).toBe(false)
    expect(requiresMet({}, caps)).toBe(true)
    const pool = bugPool(['home', 'list', 'contact'], 'senior', ['list'])
    expect(pool.length).toBeGreaterThan(0)
  })
})

describe('bugParams en un sub-stream propio', () => {
  const fake = [
    { id: 'nth-x', params: (r) => ({ n: 3 + r.int(0, 3) }) },
    { id: 'tz-y', params: (r) => ({ offset: r.pick([-300, 60, 540]) }) },
    { id: 'sin-params' },
  ]

  it('son deterministas por semilla, estan aunque el bug no este activo y varian entre semillas', () => {
    expect(genBugParams('abc', fake)).toEqual(genBugParams('abc', fake))
    expect(Object.keys(genBugParams('abc', fake)).sort()).toEqual(['nth-x', 'tz-y'])
    const ns = new Set(seeds.map((s) => genBugParams(s, fake)['nth-x'].n))
    expect([...ns].sort()).toEqual([3, 4, 5, 6])
  })

  it('agregar bugs con params NO cambia el contenido de la semilla ni el stream de contenido (fork independiente)', () => {
    const rng = createRng('abc')
    const before = [rng.next(), rng.next()]
    const rng2 = createRng('abc')
    genBugParams('abc', fake) // no toca ningun stream compartido
    rng2.fork('bug:nth-x').int(0, 9)
    expect([rng2.next(), rng2.next()]).toEqual(before)
    const site = generateSite('abc', 'semi')
    // el catalogo v2 declara params en 4 bugs; estan en el sitio aunque no esten activos (TASK-049)
    expect(Object.keys(site.bugParams).sort()).toEqual(['date-timezone-shift', 'nth-add-to-cart-fails', 'nth-login-rejected', 'nth-submit-server-error'])
    expect(createRng('abc').fork('bug:nth-x').int(0, 1e9)).toBe(createRng('abc').fork('bug:nth-x').int(0, 1e9))
    expect(createRng('abc').fork('a').next()).not.toBe(createRng('abc').fork('b').next())
  })
})

describe('reloj, zona horaria y latencia inyectables', () => {
  it('createClock usa el now inyectado y la zona simulada, no la de la maquina', () => {
    const clock = createClock({ now: () => Date.UTC(2026, 0, 1, 2, 30, 0), tzOffsetMinutes: -300 })
    expect(clock.now()).toBe(Date.UTC(2026, 0, 1, 2, 30, 0))
    expect(clock.local()).toMatchObject({ year: 2025, month: 12, day: 31, hour: 21, minute: 30 })
    const ahead = createClock({ now: clock.now, tzOffsetMinutes: 540 })
    expect(ahead.local()).toMatchObject({ year: 2026, month: 1, day: 1, hour: 11, minute: 30 })
    expect(clock.local(clock.fromLocal({ year: 2026, month: 3, day: 5, hour: 8 }))).toMatchObject({ month: 3, day: 5, hour: 8 })
  })

  it('el sitio trae un offset simulado deterministico y el env lo usa', () => {
    const site = generateSite('tz-1', 'semi')
    expect([-480, -300, -180, 0, 60, 330, 540]).toContain(site.tzOffsetMinutes)
    expect(generateSite('tz-1', 'senior').tzOffsetMinutes).toBe(site.tzOffsetMinutes)
    expect(new Set(seeds.map((s) => generateSite(s, 'semi').tzOffsetMinutes)).size).toBeGreaterThan(3)
    expect(createEnv({ seed: 'tz-1', tzOffsetMinutes: site.tzOffsetMinutes }).clock.tzOffsetMinutes).toBe(site.tzOffsetMinutes)
  })

  it('la latencia es determinista por (seed, key, n), esta en 80..600 ms y se controla con timers falsos', async () => {
    const a = createLatency({ seed: 'abc' })
    const b = createLatency({ seed: 'abc' })
    const seq = [1, 2, 3, 4].map((n) => a.latencyMs('search', n))
    expect(seq).toEqual([1, 2, 3, 4].map((n) => b.latencyMs('search', n)))
    for (const ms of seq) { expect(ms).toBeGreaterThanOrEqual(80); expect(ms).toBeLessThanOrEqual(600) }
    expect(new Set(seq).size).toBeGreaterThan(1)
    const other = [1, 2, 3, 4].map((n) => createLatency({ seed: 'otra' }).latencyMs('search', n))
    expect(other).not.toEqual(seq) // otra semilla, otra secuencia de latencias
    expect([1, 2, 3, 4].map((n) => a.latencyMs('login', n))).not.toEqual(seq) // otra key, otra secuencia

    vi.useFakeTimers()
    let done = false
    const p = a.request('search', () => 'ok').then((v) => { done = v })
    expect(a.count('search')).toBe(1)
    await vi.advanceTimersByTimeAsync(a.latencyMs('search', 1) - 1)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(done).toBe('ok')
  })

  it('checkField valida fechas contra el reloj inyectado (no contra la maquina)', () => {
    const f = { key: 'birth', type: 'date', required: false }
    const clock = createClock({ now: () => Date.UTC(2020, 5, 1) })
    expect(checkField(f, '2020-05-01', () => false, clock)).toBeNull()
    expect(checkField(f, '2020-07-01', () => false, clock)).not.toBeNull()
  })

  it('un toast desaparece segun el reloj inyectado del sitio (los componentes no usan setTimeout directo)', async () => {
    const timers = []
    const clock = { ...createClock(), setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length } }
    const env = { clock, latency: createLatency({ seed: 'x', clock }) }
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite({ ...site }, { hash: '#/catalog', env })
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    expect(document.querySelector('.qa-toast')).not.toBeNull()
    expect(timers.at(-1).ms).toBe(3500)
    timers.at(-1).fn()
    await tick(5)
    expect(document.querySelector('.qa-toast')).toBeNull()
  })
})

describe('contadores de acciones', () => {
  const site = forceSite({ pages: ALL_PAGES })

  it('cuentan por tipo en memoria: addToCart, setQty, removeFromCart, coupon, login/loginOk, register, comment, order', () => {
    const storage = memoryStorage()
    const store = createStore(site, storage)
    store.addToCart(1); store.addToCart(1); store.addToCart(9999) // el id inexistente no cuenta
    store.setQty(1, 5); store.removeFromCart(1)
    store.applyCoupon('x')
    expect(store.actions).toMatchObject({ addToCart: 2, setQty: 1, removeFromCart: 1, coupon: 1 })
    store.login(site.data.demoUser.email, 'mal')
    store.login(site.data.demoUser.email, site.data.demoUser.password)
    expect(store.actions).toMatchObject({ login: 2, loginOk: 1 })
    store.register({ name: 'N', email: 'n@x.co', password: 'abcdefgh' })
    store.addComment(1, 'hola'); store.addComment(1, '  ')
    expect(store.actions).toMatchObject({ register: 1, comment: 1 })
    expect(store.bump('custom')).toBe(1)
    expect(store.bump('custom')).toBe(2)
  })

  it('NO se persisten: una recarga (nuevo store sobre el mismo storage) los reinicia; navegar no', async () => {
    const storage = memoryStorage()
    const a = createStore(site, storage)
    a.addToCart(1)
    expect(a.actions.addToCart).toBe(1)
    expect(storage.getItem(`qa-lab:v1:${site.level}:${site.seed}`)).not.toContain('addToCart')
    const b = createStore(site, storage)
    expect(b.state.cart).toHaveLength(1) // el carrito si persiste
    expect(b.actions.addToCart).toBeUndefined() // el contador no

    const { w } = await mountSite(site, { hash: '#/catalog' })
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    await go('/faq')
    await go('/catalog')
    await w.find('[data-testid="add-to-cart"]').trigger('click')
    // navegar no reinicia: el carrito acumulo 2 unidades del mismo producto en la misma instancia
    await go('/cart')
    expect(w.find('[data-testid="cart-line"] input').element.value).toBe('2')
  })

  it('los formularios cuentan "submit" (contacto y checkout)', async () => {
    const { w } = await mountSite(site, { hash: '#/contact' })
    for (const k of site.data.contactFields) await fill(w, { [k]: k === 'email' ? 'a@b.co' : k === 'subject' ? '1' : 'Ana Perez' })
    await w.find('form').trigger('submit')
    expect(w.find('[data-testid="submissions"]').text()).toContain('1')
  })
})

describe('skip-link', () => {
  it('es un boton que mueve el foco al contenido principal y no cambia el hash (no choca con el router)', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/faq' })
    const skip = w.find('[data-testid="skip-link"]')
    expect(skip.element.tagName).toBe('BUTTON')
    expect(w.find('a[href="#main"], a[href="#content"]').exists()).toBe(false)
    await skip.trigger('click')
    expect(document.activeElement).toBe(w.find('main').element)
    expect(window.location.hash).toBe('#/faq')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('faq')
  })
})

describe('reglas de los packs en el motor', () => {
  it('checkField aplica minLength, maxLength y pattern (string con la fuente de la regex) con su patternHint', () => {
    const none = () => false
    const f = { key: 'code', type: 'text', required: false, minLength: 3, maxLength: 5, pattern: '^[A-Z]+$', patternHint: 'Solo mayusculas' }
    expect(checkField(f, 'AB', none)?.key).toBe('err.minLength')
    expect(checkField(f, 'ABCDEF', none)?.key).toBe('err.maxLength')
    expect(checkField(f, 'abcd', none)).toEqual({ text: 'Solo mayusculas' })
    expect(checkField(f, 'ABCD', none)).toBeNull()
    expect(checkField({ ...f, patternHint: undefined }, 'abcd', none)?.key).toBe('err.pattern')
  })

  it('thenShow puede ser un array de claves: se muestran solo si ifField === equals', () => {
    const spec = {
      steps: [{ id: 'a', fields: ['x', 'y', 'z'] }],
      conditionals: [{ ifField: 'x', equals: true, thenShow: ['y', 'z'], kind: 'field' }],
    }
    expect(visibleFields(spec, spec.steps[0], {})).toEqual(['x'])
    expect(visibleFields(spec, spec.steps[0], { x: true })).toEqual(['x', 'y', 'z'])
  })

  it('el contenido entrega currency.position, nouns {one, many} y un dashboard de 4 columnas fijas con fecha ISO', () => {
    const site = generateSite('pk-1', 'semi')
    for (const locale of ['es', 'en']) {
      const c = resolveContent(site, createLabI18n(locale).global.t)
      expect(c.currency.position).toBe('before')
      for (const k of ['item', 'customer', 'order', 'category']) {
        expect(c.nouns[k].one.length).toBeGreaterThan(2)
        expect(c.nouns[k].many).not.toBe(c.nouns[k].one)
      }
      expect(c.dashboard.columns.map((x) => x.key)).toEqual(['subject', 'quantity', 'date', 'amount'])
      expect(c.dashboard.columns.map((x) => x.type)).toEqual(['text', 'number', 'date', 'money'])
      for (const r of c.dashboard.rows) {
        expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/)
        expect(r.quantity).toBeGreaterThanOrEqual(1)
      }
    }
    expect(isoFromOffset(0)).toBe('2026-01-01')
    expect(isoFromOffset(31)).toBe('2026-02-01')
    expect(isoFromOffset(364)).toBe('2026-12-31')
  })

  it('el dashboard muestra las 4 columnas fijas en la tabla', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/dashboard' })
    const heads = w.findAll('.qa-table thead th').map((t) => t.text())
    expect(heads).toEqual(['ID', 'Concepto', 'Cantidad', 'Fecha', 'Importe', 'Estado'])
  })
})

describe('lint estatico: el tiempo y el azar solo por los servicios', () => {
  const SKIP_DIRS = ['themes', 'report'] // los escriben otros developers (TASK-048 / TASK-050)
  const walk = (dir) =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n)
      if (statSync(p).isDirectory()) return SKIP_DIRS.includes(n) ? [] : walk(p)
      return /\.(js|vue)$/.test(n) ? [p] : []
    })
  const files = walk('src/qa-lab').filter((f) => !f.replaceAll('\\', '/').endsWith('services/clock.js'))

  it('ningun archivo de src/qa-lab usa Math.random, Date.now, new Date(), setTimeout o setInterval directos (salvo services/clock.js)', () => {
    const bad = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
      for (const re of [/Math\.random/, /Date\.now/, /new Date\(/, /(?<![.\w])setTimeout\s*\(/, /(?<![.\w])setInterval\s*\(/]) {
        if (re.test(src)) bad.push(`${f}: ${re}`)
      }
    }
    expect(bad).toEqual([])
  })
})
