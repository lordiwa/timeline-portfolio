// TASK-049 (review de TASK-048) — el solucionario describe el campo REAL del sitio (los campos vienen del pack del tema,
// no son "edad" ni "nombre") y ubica los bugs de validacion del wizard en los pasos reales del pack (s1..sN).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'
import { describeBug, affectedFields } from '../../src/qa-lab/bugs/describe.js'
import { bugLocation } from '../../src/qa-lab/bugs/locations.js'
import { bugFitsPage, formKeys } from '../../src/qa-lab/generator/capabilities.js'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import es from '../../src/qa-lab/i18n/es.json'
import App from '../../src/qa-lab/App.vue'
import { forceSite, ALL_PAGES, fieldOf, track, cleanup } from './helpers.js'

vi.setConfig({ testTimeout: 60000 }) // 63 semillas x paginas x 2 idiomas resuelven el contenido del pack
afterEach(() => cleanup())

const VALIDATION = ['email-no-at', 'age-off-by-one', 'password-off-by-one', 'required-not-validated']
const SEEDS = Array.from({ length: 63 }, (_, i) => `desc-${i}`)
const TYPE_OF = { 'email-no-at': (m) => m.type === 'email', 'age-off-by-one': (m) => m.type === 'number', 'password-off-by-one': (m) => m.type === 'password', 'required-not-validated': (m) => m.nameLike && m.required }

describe('descripcion de los bugs de validacion con el campo real del pack (M-2)', () => {
  it('en es y en menciona la etiqueta real del campo afectado y sus limites, en 63 semillas y cada pagina donde el bug puede vivir (evita decir "edad 18" sobre un campo "Urgencia 1-5")', () => {
    const labels = new Set()
    let checked = 0
    for (const seed of SEEDS) {
      const base = generateSite(seed, 'senior')
      for (const id of VALIDATION) {
        for (const page of BUG_BY_ID[id].pages.filter((p) => ALL_PAGES.includes(p) && bugFitsPage(id, p, base.data))) {
          const site = forceSite({ seed, pages: ALL_PAGES, bugs: { [id]: page } })
          for (const locale of ['es', 'en']) {
            const text = describeBug(site, id, locale)
            const keys = formKeys(site.data, page).filter((k) => TYPE_OF[id](site.data.fieldMeta[k]))
            expect(keys.length, `${seed} ${id}@${page}`).toBeGreaterThan(0)
            for (const k of keys) expect(text, `${seed} ${id}@${page} ${locale}: ${k}`).toContain(fieldOf(site, k, locale).label)
            const f = fieldOf(site, keys[0], locale)
            if (id === 'age-off-by-one') { expect(text).toContain(`${f.min}–${f.max}`); expect(text).toMatch(new RegExp(`exact\\w* ${f.min}`)) }
            if (id === 'password-off-by-one') { expect(text).toContain(`${f.min} `); expect(text).toContain(`${f.min - 1}`) }
            expect(text, `${seed} ${id} sin placeholders`).not.toMatch(/\{\w+\}/)
            labels.add(`${locale}:${keys.map((k) => fieldOf(site, k, locale).label).join('/')}`)
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(400)
    expect(labels.size).toBeGreaterThan(40) // los textos cambian con el pack: no hay un "edad"/"nombre" fijo
  })

  it('si el bug no tiene template (o el sitio no tiene campo afectado) cae en la descripcion fija del catalogo', () => {
    const site = forceSite({ pages: ALL_PAGES, bugs: { typo: 'faq' } })
    expect(describeBug(site, 'typo', 'es')).toBe(BUG_BY_ID.typo.description.es)
    expect(describeBug(site, 'typo', 'en')).toBe(BUG_BY_ID.typo.description.en)
    expect(affectedFields(site, 'typo', 'es')).toEqual([])
  })

  it('el solucionario del shell pinta la descripcion con el campo real (en pantalla, en es y en en)', async () => {
    const seed = SEEDS.find((s) => generateSite(s, 'semi').bugs.includes('age-off-by-one')) || (() => { throw new Error('ninguna semilla semi con age-off-by-one') })()
    const site = generateSite(seed, 'semi')
    for (const locale of ['es', 'en']) {
      window.history.replaceState(null, '', `/qa-lab/?seed=${seed}&level=semi&lang=${locale}`)
      const w = track(mount(App, { props: { initialSeed: seed, initialLevel: 'semi' }, global: { plugins: [createLabI18n(locale)] }, attachTo: document.body }))
      await w.find('[data-testid="reveal"]').trigger('click')
      const li = w.find('[data-bug-id="age-off-by-one"]')
      const [field] = affectedFields(site, 'age-off-by-one', locale)
      expect(li.text(), locale).toContain(field.label)
      expect(li.text(), locale).toContain(`${field.min}–${field.max}`)
      w.unmount()
    }
  })
})

describe('ubicacion de los bugs de validacion en el wizard del pack (M-1)', () => {
  it('la ubicacion es un paso real del wizard (s1..sN) que contiene el campo del tipo que el bug necesita, nunca "Seguridad" o "Datos" inexistentes', () => {
    let checked = 0
    for (const seed of SEEDS) {
      const base = generateSite(seed, 'senior')
      for (const id of VALIDATION) {
        if (!bugFitsPage(id, 'wizard', base.data)) continue
        const site = forceSite({ seed, pages: ALL_PAGES, bugs: { [id]: 'wizard' } })
        const where = bugLocation(site, id)
        expect(where.key, `${seed} ${id}`).toBe('lab.where.wizardStep')
        const stepId = where.stepKey.replace('wizard.step.', '')
        const step = site.data.wizard.steps.find((s) => s.id === stepId)
        expect(step, `${seed} ${id}: paso ${stepId}`).toBeTruthy()
        expect(es.wizard.step[stepId], `${seed} ${id}: texto del paso ${stepId}`).toBeTruthy() // el paso tiene traduccion en el solucionario
        expect(step.fields.some((k) => formKeys(site.data, 'wizard').includes(k) && TYPE_OF[id](site.data.fieldMeta[k])), `${seed} ${id}: el paso ${stepId} tiene el campo`).toBe(true)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(60)
  })
})
