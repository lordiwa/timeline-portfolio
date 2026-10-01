// TASK-047 — los 19 bugs del catalogo se manifiestan SOLO con su flag y SOLO en la pagina asignada.
// jsdom no hace layout: los bugs visuales se verifican por el DOM / clase que dispara el CSS.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { withTypo } from '../../src/qa-lab/composables/useSite.js'
import { BUGS, BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'
import { concretePath, PAGE_TYPES } from '../../src/qa-lab/generator/pages.js'
import { checkField } from '../../src/qa-lab/composables/useForm.js'
import es from '../../src/qa-lab/i18n/es.json'
import en from '../../src/qa-lab/i18n/en.json'
import { storageKey, memoryStorage } from '../../src/qa-lab/state/store.js'
import { getThemePack, THEME_PACKS } from '../../src/qa-lab/themes/index.js'
import { forceSite, ALL_PAGES, mountSite, go, tick, fill, click, cleanup, moneyOf, fieldOf, validValue, validValues, fillVisible, advanceWizardTo } from './helpers.js'

vi.setConfig({ testTimeout: 120000 }) // recorren las 13 paginas x con/sin flag

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

/** Monta el sitio con `bugId` activo en `page` (o sin bugs) y abre esa pagina. */
async function open(page, bugId, { locale = 'es', labelTargets, bugPage = page } = {}) {
  let site = forceSite({ pages: ALL_PAGES, bugs: bugId ? { [bugId]: bugPage } : {} })
  if (labelTargets) site = { ...site, data: { ...site.data, labelTargets: { ...site.data.labelTargets, ...labelTargets } } }
  // account exige sesion y checkout exige carrito: se precargan en el storage para llegar a la pagina
  const storage = memoryStorage()
  const seed = {}
  if (page === 'account') seed.user = { name: 'Ana', email: 'ana@example.com' }
  if (page === 'checkout') seed.cart = [{ id: 1, qty: 2 }, { id: 2, qty: 1 }]
  if (Object.keys(seed).length) storage.setItem(storageKey(site.seed, site.level), JSON.stringify(seed))
  const m = await mountSite(site, { hash: `#${concretePath(site, page)}`, locale, storage })
  return { ...m, site }
}
const bothWays = async (page, bugId, probe, opts) => {
  for (const flag of [false, true]) {
    const m = await open(page, flag ? bugId : null, opts)
    expect(await probe(m), `${bugId} @ ${page} flag=${flag}`).toBe(flag)
    m.w.unmount()
  }
}

describe('bugs funcionales con y sin flag', () => {
  it.each(['list', 'dashboard'])('pagination-skips en %s: "Siguiente" desde skipAt avanza dos solo con el flag', async (page) => {
    for (const flag of [false, true]) {
      const { w, site } = await open(page, flag ? 'pagination-skips' : null)
      const skipAt = page === 'list' ? site.data.list.skipAt : site.data.dashboard.skipAt
      for (let i = 1; i < skipAt; i++) await click(w, 'Siguiente').trigger('click')
      await click(w, 'Siguiente').trigger('click')
      expect(w.find('.qa-page-info').text()).toMatch(new RegExp(`Página ${skipAt + (flag ? 2 : 1)} de`))
      w.unmount()
    }
  })

  it.each(['list', 'dashboard'])('filter-not-reset en %s: "Limpiar filtros" deja la categoria/estado solo con el flag', async (page) => {
    for (const flag of [false, true]) {
      const { w } = await open(page, flag ? 'filter-not-reset' : null)
      const sel = w.find('.qa-toolbar-row select')
      await sel.setValue('1')
      await w.find('input[type=search]').setValue('zzz')
      await click(w, 'Limpiar filtros').trigger('click')
      expect(w.find('.qa-toolbar-row select').element.value).toBe(flag ? '1' : '')
      expect(w.find('input[type=search]').element.value).toBe('')
      w.unmount()
    }
  })

  it('total-wrong en el checkout: ignora la cantidad de la 1a linea solo con el flag (carrito 3 x item1 + 1 x item2)', async () => {
    for (const flag of [false, true]) {
      const { w, site } = await open('list', flag ? 'total-wrong' : null, { bugPage: 'checkout' }) // el bug vive en el checkout; se abre por el listado
      const adds = w.findAll('[data-testid="add-to-cart"]')
      await adds[0].trigger('click')
      await adds[1].trigger('click')
      await go('/cart')
      await w.find('[data-testid="cart-line"] input').setValue('3')
      await w.find('[data-testid="cart-line"] input').trigger('change')
      expect(w.find('[data-testid="cart-subtotal"]').text()).toBe(moneyOf(site)(site.data.catalog[0].price * 3 + site.data.catalog[1].price)) // el carrito siempre bien
      await go('/checkout')
      const sub = w.find('[data-testid="sum-subtotal"]').text()
      const real = moneyOf(site)(site.data.catalog[0].price * 3 + site.data.catalog[1].price)
      expect(sub === real).toBe(!flag)
      w.unmount()
    }
  })

  it('total-wrong en el dashboard: el total de la pagina omite la ultima fila solo con el flag', async () => {
    await bothWays('dashboard', 'total-wrong', ({ w, site }) => {
      const rows = site.data.dashboard.rows.slice(0, site.data.dashboard.pageSize)
      const real = rows.reduce((s, r) => s + r.amount, 0)
      return w.find('[data-testid="page-total"]').text() !== moneyOf(site)(real)
    })
  })

  it.each(['contact', 'wizard'])('double-submit en %s: dos envios seguidos registran 2 solo con flag', async (page) => {
    for (const flag of [false, true]) {
      const { w, site } = await open(page, flag ? 'double-submit' : null)
      if (page === 'wizard') {
        await advanceWizardTo(w, site, 'terms') // recorre los pasos del pack (relleno valido) hasta la confirmacion
        await fill(w, { terms: true })
      } else {
        await fillVisible(w, site)
      }
      await w.find('form').trigger('submit')
      await w.find('form').trigger('submit')
      expect(w.find('[data-testid="submissions"]').text()).toContain(flag ? '2' : '1')
      w.unmount()
    }
  })
})

describe('bugs de validacion con y sin flag', () => {
  it('email-no-at / age / password / required: checkField real los acepta con flag y los rechaza sin flag', () => {
    const on = (...ids) => (id) => ids.includes(id)
    const none = on()
    const email = { key: 'email', type: 'email', required: true }
    const age = { key: 'age', type: 'number', required: true, min: 18, max: 120 }
    const pw = { key: 'password', type: 'password', required: true, min: 8 }
    const name = { key: 'name', type: 'text', required: true }
    expect(checkField(email, 'sin-arroba', none)).not.toBeNull()
    expect(checkField(email, 'sin-arroba', on('email-no-at'))).toBeNull()
    expect(checkField(age, '18', none)).toBeNull()
    expect(checkField(age, '18', on('age-off-by-one'))).not.toBeNull()
    expect(checkField(pw, '1234567', none)).not.toBeNull()
    expect(checkField(pw, '1234567', on('password-off-by-one'))).toBeNull()
    expect(checkField(name, '', none)).not.toBeNull()
    expect(checkField(name, '', on('required-not-validated'))).toBeNull()
  })

  it.each([
    ['email-no-at', 'contact', { email: 'sin-arroba' }],
    ['required-not-validated', 'contact', { name: '' }],
  ])('%s en %s: el formulario real envia datos invalidos solo con el flag', async (bugId, page, bad) => {
    for (const flag of [false, true]) {
      const { w, site } = await open(page, flag ? bugId : null)
      for (const k of site.data.contactFields) await fill(w, validValues(site, [k], k in bad ? { [k]: bad[k] } : {}))
      await w.find('form').trigger('submit')
      expect(w.find('[data-testid="submissions"]').text()).toContain(flag ? '1' : '0')
      w.unmount()
    }
  })

  it('age-off-by-one y password-off-by-one en el registro real: rechazan 18 / aceptan 7 caracteres solo con flag', async () => {
    for (const bugId of ['age-off-by-one', 'password-off-by-one']) {
      for (const flag of [false, true]) {
        const { w, site } = await open('signup', flag ? bugId : null)
        const numKey = site.data.signupFields.find((k) => site.data.fieldMeta[k].type === 'number')
        const pwKey = site.data.signupFields.find((k) => site.data.fieldMeta[k].type === 'password')
        const num = fieldOf(site, numKey)
        const pw = fieldOf(site, pwKey)
        await fillVisible(w, site, {
          email: `x${Math.random()}@b.co`,
          [numKey]: bugId === 'age-off-by-one' ? String(num.min) : validValue(num), // el minimo exacto es valido
          [pwKey]: bugId === 'password-off-by-one' ? 'x'.repeat(pw.min - 1) : validValue(pw), // un caracter menos del minimo es invalido
        })
        await w.find('form').trigger('submit')
        await tick()
        const registered = w.find('[data-testid="session-user"]').exists()
        // age-off-by-one RECHAZA el 18 exacto (valido) con el flag; password-off-by-one ACEPTA 7 caracteres (invalido) con el flag
        expect(registered, `${bugId} flag=${flag}`).toBe(bugId === 'age-off-by-one' ? !flag : flag)
        w.unmount()
      }
    }
  })
})

// --- bugs de pagina (UI / contenido / a11y / consola / responsive): con y sin flag, en CADA pagina posible, y no en otra ---
const tabOrderProbe = ({ w }) => w.find('button[type=submit]').attributes('tabindex') === '1'
const PAGE_CASES = {
  'button-covered': { pages: ['contact', 'signup', 'wizard', 'checkout'], probe: ({ w }) => w.find('[data-testid="qa-sticker"]').exists() },
  'text-truncated': { pages: PAGE_TYPES, probe: ({ w }) => w.find('.site-note').classes().includes('bug-truncated') },
  misaligned: { pages: PAGE_TYPES, probe: ({ w }) => w.find('h1').classes().includes('bug-misaligned') },
  'low-contrast': { pages: PAGE_TYPES, probe: ({ w }) => w.find('.site').classes().includes('lowc') },
  'mobile-overflow': { pages: PAGE_TYPES, probe: ({ w }) => w.find('.site-strip.bug-overflow').exists() },
  'tab-order': { pages: ['contact', 'signup', 'wizard', 'checkout'], probe: tabOrderProbe },
}

describe('bugs de pagina: con y sin flag, en cada pagina asignable', () => {
  for (const id of ['button-covered', 'text-truncated', 'misaligned', 'low-contrast', 'mobile-overflow', 'tab-order']) {
    it(`${id}: se manifiesta con su flag en cada pagina posible y no sin flag (evita un bug de mentira o uno siempre activo)`, async () => {
      for (const page of PAGE_CASES[id].pages) await bothWays(page, id, PAGE_CASES[id].probe)
    })
  }

  it('typo: el titulo difiere del correcto solo con el flag, en cada pagina (salvo el detalle, cuyo titulo es el nombre del producto)', async () => {
    for (const page of PAGE_TYPES.filter((p) => p !== 'detail' && p !== 'blog')) {
      for (const flag of [false, true]) {
        const m = await open(page, flag ? 'typo' : null)
        const expected = es.tpl[page].title.replace('{brand}', getThemePack(m.site.themeId).name.es)
        expect(m.w.find('h1').text() !== expected, `${page} flag=${flag}`).toBe(flag)
        m.w.unmount()
      }
    }
    const d = await open('detail', 'typo')
    const name = d.w.find('h1').text()
    expect(name).not.toBe(getThemePack(d.site.themeId).items[d.site.data.catalog[0].itemIdx].name.es)
    d.w.unmount()
  })

  it('untranslated: el parrafo de introduccion sale en el otro idioma solo con el flag, en cada pagina', async () => {
    for (const page of PAGE_TYPES) {
      for (const flag of [false, true]) {
        const m = await open(page, flag ? 'untranslated' : null, { locale: 'es' })
        const brand = getThemePack(m.site.themeId).name.es
        const lead = m.w.find('.site-lead').text()
        expect(lead === es.tpl[page].lead.replace('{brand}', brand), `${page} flag=${flag}`).toBe(!flag)
        expect(lead === en.tpl[page].lead.replace('{brand}', brand), `${page} flag=${flag}`).toBe(flag)
        m.w.unmount()
      }
    }
  })

  it('no se manifiesta en otra pagina: un bug asignado a "faq" no aparece en "contact" (evita bugs fuera de lugar en el solucionario)', async () => {
    for (const id of ['text-truncated', 'misaligned', 'low-contrast', 'mobile-overflow']) {
      const m = await open('contact', null)
      const site = { ...m.site, bugs: [id], bugPages: { [id]: 'faq' } }
      m.w.unmount()
      const o = await mountSite(site, { hash: '#/contact' })
      expect(PAGE_CASES[id].probe({ w: o.w })).toBe(false)
      await go('/faq')
      expect(PAGE_CASES[id].probe({ w: o.w })).toBe(true)
      o.w.unmount()
    }
  })

  it('missing-label: el campo objetivo queda sin label ni aria-label solo con el flag (todas las paginas con campos)', async () => {
    const targets = { contact: 'name', signup: 'email', wizard: forceSite({ pages: ALL_PAGES }).data.labelTargets.wizard, checkout: 'name', list: 'search', dashboard: 'search', faq: 'search', blog: 'comment' }
    const probe = (page) => ({ w }) => {
      if (page === 'blog') return !w.find('label[for="qa-comment"]').exists() && !w.find('#qa-comment').attributes('aria-label')
      const id = targets[page] === 'search' ? 'qa-search' : `qa-${targets[page]}`
      return !w.find(`label[for="${id}"]`).exists() && !w.find(`#${id}`).attributes('aria-label')
    }
    for (const page of Object.keys(targets)) {
      for (const flag of [false, true]) {
        const m = await open(page === 'checkout' ? 'list' : page === 'blog' ? 'blog' : page, flag ? 'missing-label' : null, { labelTargets: targets })
        if (page === 'checkout') {
          m.w.unmount()
          const s = forceSite({ pages: ALL_PAGES, bugs: flag ? { 'missing-label': 'checkout' } : {} })
          const site = { ...s, data: { ...s.data, labelTargets: { ...s.data.labelTargets, checkout: 'name' } } }
          const o = await mountSite(site, { hash: '#/catalog' })
          await o.w.find('[data-testid="add-to-cart"]').trigger('click')
          await go('/checkout')
          expect(probe(page)(o), `checkout flag=${flag}`).toBe(flag)
          o.w.unmount()
          continue
        }
        if (page === 'blog') { await go('/blog/1'); await m.w.findAll('.qa-tablist button')[1].trigger('click') }
        if (page === 'wizard') await advanceWizardTo(m.w, m.site, targets.wizard) // el campo objetivo puede estar en un paso posterior
        expect(probe(page)(m), `${page} flag=${flag}`).toBe(flag)
        m.w.unmount()
      }
    }
  })
})

describe('bugs de a11y y consola (modal de ayuda) en cada pagina', () => {
  const helpButton = (w) => w.findAll('button').find((b) => b.text() === 'Ayuda')

  it('modal-focus-lost: al cerrar el modal el foco no vuelve al boton solo con el flag, en cada pagina', async () => {
    for (const page of PAGE_TYPES) {
      for (const flag of [false, true]) {
        const m = await open(page, flag ? 'modal-focus-lost' : null)
        const help = helpButton(m.w)
        help.element.focus()
        await help.trigger('click')
        await tick()
        await m.w.find('.qa-modal .qa-btn').trigger('click')
        await tick()
        expect(document.activeElement !== help.element, `${page} flag=${flag}`).toBe(flag)
        m.w.unmount()
      }
    }
  })

  it('console-error: abrir el modal lanza un TypeError real solo con el flag, en cada pagina', async () => {
    for (const page of PAGE_TYPES) {
      for (const flag of [false, true]) {
        const m = await open(page, flag ? 'console-error' : null)
        vi.useFakeTimers({ toFake: ['setTimeout'] })
        let thrown = null
        try {
          await helpButton(m.w).trigger('click')
          vi.advanceTimersByTime(10)
        } catch (e) {
          thrown = e
        } finally {
          vi.useRealTimers()
        }
        expect(thrown?.name === 'TypeError', `${page} flag=${flag}`).toBe(flag)
        m.w.unmount()
      }
    }
  })

  it('modal: Tab/Shift+Tab ciclan dentro del dialogo y el link "Acerca de" responde (evita un foco que escape o un link muerto)', async () => {
    const { w } = await open('faq', null)
    await helpButton(w).trigger('click')
    await tick()
    const dlg = document.querySelector('.qa-modal')
    const btns = dlg.querySelectorAll('button, a[href]')
    const last = btns[btns.length - 1]
    last.focus()
    dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(btns[0])
    btns[0].focus()
    dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
    dlg.querySelector('a[href]').click()
    await tick()
    expect(document.querySelector('.qa-toast')?.textContent).toContain('sitio ficticio')
    w.unmount()
  })
})

describe('typo: invariantes del helper', () => {
  it('la errata siempre difiere del original en TODOS los nombres y titulos de los 63 temas x 2 idiomas (evita un bug typo invisible)', () => {
    let checked = 0
    for (const [lang, msgs] of [['es', es], ['en', en]]) {
      const titles = Object.values(msgs.tpl).map((x) => x.title)
      for (const pack of THEME_PACKS) {
        for (const title of titles) {
          const text = title.replace('{brand}', pack.name[lang])
          expect(withTypo(text)).not.toBe(text)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(63 * 13)
    expect(withTypo('oo')).not.toBe('oo')
  })

  it('cada bug del catalogo tiene al menos un caso de manifestacion en este archivo (evita un bug sin spec)', () => {
    const covered = new Set([
      'pagination-skips', 'filter-not-reset', 'total-wrong', 'double-submit', 'email-no-at', 'required-not-validated',
      'age-off-by-one', 'password-off-by-one', 'missing-label', 'modal-focus-lost', 'console-error', 'typo', 'untranslated',
      ...Object.keys(PAGE_CASES),
    ])
    // los 19 bugs de v1; los 17 de v2 se cubren en qa-lab-bugs-v2.spec.js (que tiene su propio chequeo de cobertura)
    expect(BUGS.slice(0, 19).filter((b) => !covered.has(b.id)).map((b) => b.id)).toEqual([])
    expect(Object.keys(BUG_BY_ID).length).toBe(36)
  })
})
