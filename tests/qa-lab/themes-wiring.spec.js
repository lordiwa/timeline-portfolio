// TASK-048 (cableado) — los 63 content packs elegidos por el generador y leidos por el motor.
// AC4: los bugs se manifiestan en temas de fantasia y sci-fi. AC5: distribucion de temas sobre 500 semillas.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateSite, bugPool } from '../../src/qa-lab/generator/site.js'
import { createRng } from '../../src/qa-lab/generator/prng.js'
import { capabilitiesOf, bugFitsPage, requiresMet, formKeys } from '../../src/qa-lab/generator/capabilities.js'
import { THEMES } from '../../src/qa-lab/generator/themes.js'
import { BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'
import { concretePath } from '../../src/qa-lab/generator/pages.js'
import { nameLikeKey } from '../../src/qa-lab/generator/fields.js'
import { getThemePack, THEME_PACKS } from '../../src/qa-lab/themes/index.js'
import { computeTotals } from '../../src/qa-lab/state/pricing.js'
import { storageKey, memoryStorage } from '../../src/qa-lab/state/store.js'
import { resolveContent } from '../../src/qa-lab/content/index.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { checkField } from '../../src/qa-lab/composables/useForm.js'
import { ALL_PAGES, themeSite, seedForTheme, mountSite, go, fill, fillVisible, advanceWizardTo, cleanup } from './helpers.js'

vi.setConfig({ testTimeout: 120000 }) // monta decenas de sitios (temas x paginas x con/sin flag)

afterEach(cleanup)

describe('AC5: distribucion de temas', () => {
  it('500 semillas: ningun tema supera el 5 % y el tema es el primer sorteo del stream de contenido (agregar bugs no lo cambia)', () => {
    const counts = new Map()
    for (let i = 0; i < 500; i++) {
      const seed = `dist-${i}`
      const { themeId } = generateSite(seed, 'semi')
      expect(themeId, seed).toBe(createRng(seed).pick(THEMES).id) // stream de contenido, antes de cualquier dato; nunca el de bugParams
      counts.set(themeId, (counts.get(themeId) || 0) + 1)
    }
    expect(THEMES.length).toBeGreaterThanOrEqual(60)
    expect(Math.max(...counts.values()) / 500).toBeLessThanOrEqual(0.05)
    expect(counts.size).toBeGreaterThanOrEqual(55) // se recorre casi todo el registro
  })
})

describe('bugs elegibles segun los campos del pack (BUG_REQUIRES en el generador)', () => {
  it('un bug cuyo campo el pack no trae no entra al pool; y todo bug generado cae en una pagina donde SI puede manifestarse', () => {
    // Oraculo: su wizard no tiene email, password ni texto obligatorio visible (solo radio, fecha, numero, textarea).
    const site = themeSite('oraculo-gruta-dorada')
    const pages = ['home', 'list', 'wizard']
    const caps = capabilitiesOf(pages, site.data)
    const ids = bugPool(pages, 'senior', caps, site.data).map((b) => b.id)
    expect(ids).toContain('age-off-by-one') // urgency es numerica
    for (const id of ['email-no-at', 'password-off-by-one', 'required-not-validated']) expect(ids, id).not.toContain(id)
    expect(caps).toContain('field-number')
    expect(caps).not.toContain('field-email')
    // con registro (email, password, texto obligatorio) los tres vuelven al pool
    const caps2 = capabilitiesOf([...pages, 'login', 'signup'], site.data)
    const ids2 = bugPool([...pages, 'login', 'signup'], 'senior', caps2, site.data).map((b) => b.id)
    for (const id of ['email-no-at', 'password-off-by-one', 'required-not-validated']) expect(ids2, id).toContain(id)

    // en sitios generados (300 semillas x 3 niveles): cada bug activo cumple sus capacidades y vive donde su campo existe
    for (let i = 0; i < 300; i++) {
      for (const level of ['junior', 'semi', 'senior']) {
        const s = generateSite(`elig-${i}`, level)
        for (const id of s.bugs) {
          expect(requiresMet(BUG_BY_ID[id], s.capabilities), `${s.seed}/${level} ${id}`).toBe(true)
          expect(bugFitsPage(id, s.bugPages[id], s.data), `${s.seed}/${level} ${id}@${s.bugPages[id]}`).toBe(true)
        }
        // el campo objetivo de missing-label / tab-order existe y muestra etiqueta (no es checkbox ni radio)
        for (const page of ['signup', 'contact', 'wizard']) {
          const t = s.data.fieldMeta[s.data.labelTargets[page]]
          expect(t && !['checkbox', 'radio'].includes(t.type), `${s.seed} labelTarget ${page}`).toBe(true)
          expect(formKeys(s.data, page)).toContain(s.data.labelTargets[page])
        }
      }
    }
  })
})

describe('AC4: los bugs de validacion se manifiestan en temas de fantasia y sci-fi (con y sin flag)', () => {
  const sampleSites = (family, n) => {
    const out = []
    for (let i = 0; out.length < n; i++) {
      const site = generateSite(`ac4-${i}`, 'senior')
      if (getThemePack(site.themeId).family === family && !out.some((o) => o.themeId === site.themeId)) out.push(site)
    }
    return out
  }

  /** Abre `page` con (o sin) el bug y devuelve si el campo probado muestra un error de validacion tras blur. */
  async function errorShown(site, bugId, page, key, value, flag) {
    const forced = { ...site, pages: ALL_PAGES, capabilities: capabilitiesOf(ALL_PAGES, site.data), bugs: flag ? [bugId] : [], bugPages: flag ? { [bugId]: page } : {} }
    const storage = memoryStorage()
    if (page === 'checkout') storage.setItem(storageKey(forced.seed, forced.level), JSON.stringify({ cart: [{ id: 1, qty: 1 }] }))
    const { w } = await mountSite(forced, { hash: `#${concretePath(forced, page)}`, storage })
    if (page === 'wizard') await advanceWizardTo(w, forced, key)
    const input = w.find(`[data-field="${key}"] input, [data-field="${key}"] textarea`)
    await input.setValue(value)
    await input.trigger('blur')
    const shown = w.find(`[data-field="${key}"] .qa-error`).exists()
    w.unmount()
    return shown
  }

  it.each(['fantasy', 'scifi'])('%s: email-no-at, required-not-validated, age-off-by-one y password-off-by-one aparecen solo con su flag, en cada pagina donde pueden vivir', async (family) => {
    let probed = 0
    for (const site of sampleSites(family, 3)) {
      const pack = getThemePack(site.themeId)
      for (const bugId of ['email-no-at', 'required-not-validated', 'age-off-by-one', 'password-off-by-one']) {
        const pages = BUG_BY_ID[bugId].pages.filter((p) => bugFitsPage(bugId, p, site.data))
        expect(pages.length, `${site.themeId} ${bugId}`).toBeGreaterThan(0)
        for (const page of pages) {
          const keys = formKeys(site.data, page)
          const key = {
            'email-no-at': 'email',
            'required-not-validated': page === 'signup' ? nameLikeKey(pack.signupFields) : page === 'wizard' ? nameLikeKey(pack.wizardFields) : 'name',
            'age-off-by-one': keys.find((k) => site.data.fieldMeta[k].type === 'number'),
            'password-off-by-one': keys.find((k) => site.data.fieldMeta[k].type === 'password'),
          }[bugId]
          const field = { min: pack.signupFields.concat(pack.wizardFields).find((f) => f.key === key)?.rules ?? {} }
          const value = {
            'email-no-at': 'sin-arroba', // invalido: solo con el flag no se rechaza
            'required-not-validated': '', // obligatorio vacio: solo con el flag no se rechaza
            'age-off-by-one': String(field.min.min), // el minimo exacto es valido: solo con el flag se rechaza
            'password-off-by-one': 'x'.repeat((field.min.minLength ?? 8) - 1), // un caracter menos del minimo: solo con el flag se acepta
          }[bugId]
          const expectOn = bugId === 'age-off-by-one'
          expect(await errorShown(site, bugId, page, key, value, false), `${site.themeId} ${bugId}@${page} sin flag`).toBe(!expectOn)
          expect(await errorShown(site, bugId, page, key, value, true), `${site.themeId} ${bugId}@${page} con flag`).toBe(expectOn)
          probed++
        }
      }
    }
    expect(probed).toBeGreaterThanOrEqual(3 * 4) // al menos una pagina por bug y tema
  })
})

describe('reglas y moneda del pack en los formularios y el checkout', () => {
  it('signup aplica pattern + patternHint, min/max y minLength del pack con mensajes del tema (no "18 anios" ni "8 caracteres" fijos)', async () => {
    const site = themeSite('sindicato-fantasmas-asustadores', { pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/signup' })
    const err = async (key, v) => {
      const input = w.find(`[data-field="${key}"] input`)
      await input.setValue(v)
      await input.trigger('blur')
      return w.find(`[data-field="${key}"] .qa-error`)
    }
    const hint = getThemePack(site.themeId).signupFields.find((f) => f.key === 'unionCard').rules.patternHint.es
    expect((await err('unionCard', 'XX-1')).text()).toBe(hint) // pattern: ^SF-\d{4}-\+$
    expect((await err('unionCard', 'SF-0913-+')).exists()).toBe(false)
    expect((await err('yearsDeceased', '2001')).text()).toBe('Ingresá un valor entre 0 y 2000.') // min 0 / max 2000
    expect((await err('yearsDeceased', '2000')).exists()).toBe(false)
    expect((await err('ghostName', 'A')).text()).toBe('Debe tener al menos 2 caracteres.') // minLength 2
    expect((await err('password', '1234567')).text()).toBe('La contraseña debe tener al menos 8 caracteres.')
    w.unmount()
  })

  it('checkout exacto con una moneda de 0 decimales y simbolo despues (cupon, envio, impuesto y total en unidades enteras)', async () => {
    const site = themeSite('sindicato-fantasmas-asustadores', { pages: ALL_PAGES }) // ☠ position 'after', decimals 0
    expect(getThemePack(site.themeId).currency).toMatchObject({ decimals: 0, position: 'after' })
    const { catalog, coupon, shipping, taxRate } = site.data
    const { w } = await mountSite(site, { hash: '#/catalog' })
    const adds = w.findAll('[data-testid="add-to-cart"]')
    await adds[0].trigger('click')
    await adds[1].trigger('click')
    await go('/cart')
    await w.findAll('[data-testid="cart-line"] input')[0].setValue('3')
    await w.findAll('[data-testid="cart-line"] input')[0].trigger('change')
    await go('/checkout')
    await fill(w, { name: 'Ana Perez', email: 'ana@example.com', address: 'Calle 1', city: 'Lima' })
    await w.find('form').trigger('submit')
    await w.find('[data-testid="coupon-input"]').setValue(coupon.code)
    await w.find('[data-testid="coupon-apply"]').trigger('click')
    const t = computeTotals({ lines: [{ price: catalog[0].price, qty: 3 }, { price: catalog[1].price, qty: 1 }], couponPct: coupon.pct, shippingCost: shipping.standard, taxRate, decimals: 0 })
    const sub = catalog[0].price * 3 + catalog[1].price
    expect(Number.isInteger(sub) && Number.isInteger(shipping.standard)).toBe(true)
    expect(t.subtotal).toBe(sub)
    const show = (n) => `${n} ☠`
    expect(w.find('[data-testid="sum-subtotal"]').text()).toBe(show(sub))
    expect(w.find('[data-testid="sum-discount"]').text()).toBe(`-${show(Math.round((sub * coupon.pct) / 100))}`)
    expect(w.find('[data-testid="sum-shipping"]').text()).toBe(show(shipping.standard))
    expect(w.find('[data-testid="grand-total"]').text()).toBe(show(t.total))
    w.unmount()
  })
})

describe('revision del cableado (C-1, L-1, L-2)', () => {
  it('todo campo date de los 63 packs declara noFuture o noPast y el lado prohibido se rechaza sin flags (evita aceptar un nacimiento futuro o un turno pasado)', () => {
    let dates = 0
    for (const pack of THEME_PACKS) {
      const site = generateSite(seedForTheme(pack.id), 'semi')
      const c = resolveContent(site, createLabI18n('es').global.t)
      for (const f of [...pack.signupFields, ...pack.wizardFields].filter((x) => x.type === 'date')) {
        dates++
        expect(Object.keys(f.rules).filter((k) => k === 'noFuture' || k === 'noPast'), `${pack.id}.${f.key}`).toHaveLength(1)
        const field = c.field(f.key)
        const forbidden = f.rules.noFuture ? '2099-01-01' : '2000-01-01'
        const allowed = f.rules.noFuture ? '2000-01-01' : '2099-01-01'
        expect(checkField(field, forbidden, () => false), `${pack.id}.${f.key} prohibido`).not.toBeNull()
        expect(checkField(field, allowed, () => false), `${pack.id}.${f.key} permitido`).toBeNull()
      }
    }
    expect(dates).toBeGreaterThan(60)
  })

  it('el checkout y el contacto usan sus campos fijos aunque el pack tenga un campo con la misma clave (evita que el checkout herede un campo del registro)', () => {
    const pack = THEME_PACKS.find((p) => p.signupFields.some((f) => f.key === 'phone'))
    const site = generateSite(seedForTheme(pack.id), 'semi')
    const c = resolveContent(site, createLabI18n('es').global.t)
    expect(c.field('phone').label).toBe(pack.signupFields.find((f) => f.key === 'phone').label.es)
    expect(c.generic('phone').label).toBe('Teléfono')
  })

  it('textos es === en solo en la allowlist de nombres propios, prestamos y cognados (evita contenido sin traducir)', () => {
    const ALLOW = new Set(['spinning', 'suites', 'extras', 'sector', 'industrial', 'instructor', 'material', 'metal', 'social', 'picnic', 'vhs', 'dvd', 'snacks', 'altitudes'])
    const same = []
    const walk = (v) => {
      if (!v || typeof v !== 'object') return
      if (typeof v.es === 'string' && typeof v.en === 'string' && v.es.trim().toLowerCase() === v.en.trim().toLowerCase()) same.push(v.es.trim().toLowerCase())
      if (typeof v.esPlural === 'string' && v.esPlural === v.enPlural) same.push(v.esPlural.toLowerCase())
      Object.values(v).forEach(walk)
    }
    THEME_PACKS.forEach(walk)
    expect([...new Set(same)].filter((s) => !ALLOW.has(s))).toEqual([])
  })
})
