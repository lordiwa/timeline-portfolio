// TASK-046 — QA Lab. Cada spec nombra el dano que previene.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { generatePage, MIN_BUGS, MAX_BUGS } from '../../src/qa-lab/generator/index.js'
import { BUGS, BUG_BY_ID, CATEGORIES, DIFFICULTIES, bugApplies } from '../../src/qa-lab/bugs/catalog.js'
import { TEMPLATE_IDS } from '../../src/qa-lab/templates/registry.js'
import { checkField } from '../../src/qa-lab/composables/useForm.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import App from '../../src/qa-lab/App.vue'

const seeds = Array.from({ length: 300 }, (_, i) => `seed-${i}`)

afterEach(() => vi.restoreAllMocks())

describe('QA Lab', () => {
  it('misma seed = misma pagina, sin Math.random (evita que un tester no pueda reproducir el bug reportado)', () => {
    const rnd = vi.spyOn(Math, 'random')
    for (const s of ['abc123', 'xyz', 'k7m2p9']) {
      expect(JSON.stringify(generatePage(s))).toBe(JSON.stringify(generatePage(s)))
    }
    expect(rnd).not.toHaveBeenCalled()
  })

  it('seeds distintas dan paginas distintas y hay >=6 plantillas y >=6 temas (evita una pagina repetida siempre)', () => {
    const pages = seeds.map(generatePage)
    expect(new Set(pages.map((p) => JSON.stringify(p))).size).toBe(seeds.length)
    expect(new Set(pages.map((p) => p.templateId)).size).toBeGreaterThanOrEqual(6)
    expect(new Set(pages.map((p) => p.themeId)).size).toBeGreaterThanOrEqual(6)
    expect(TEMPLATE_IDS.length).toBeGreaterThanOrEqual(6)
  })

  it('cada seed activa 3-7 bugs, todos compatibles con la plantilla (evita bugs imposibles de observar)', () => {
    for (const s of seeds) {
      const p = generatePage(s)
      expect(p.bugs.length).toBeGreaterThanOrEqual(MIN_BUGS)
      expect(p.bugs.length).toBeLessThanOrEqual(MAX_BUGS)
      expect(new Set(p.bugs).size).toBe(p.bugs.length)
      for (const id of p.bugs) expect(bugApplies(BUG_BY_ID[id], p.templateId)).toBe(true)
    }
  })

  it('catalogo unico: >=12 bugs con categoria, dificultad y descripcion es/en (evita un bug que el solucionario no pueda explicar)', () => {
    expect(BUGS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(BUGS.map((b) => b.id)).size).toBe(BUGS.length)
    for (const b of BUGS) {
      expect(CATEGORIES).toContain(b.category)
      expect(DIFFICULTIES).toContain(b.difficulty)
      expect(b.description.es.length).toBeGreaterThan(5)
      expect(b.description.en.length).toBeGreaterThan(5)
      if (b.templates !== '*') for (const t of b.templates) expect(TEMPLATE_IDS).toContain(t)
    }
  })

  it('"revelar bugs" lista exactamente los flags activos, cambia de idioma y "nueva pagina" cambia la seed en la URL (evita solucionario desincronizado)', async () => {
    const seed = 'rev-7'
    const i18n = createLabI18n('es')
    const w = mount(App, { props: { initialSeed: seed }, global: { plugins: [i18n] } })
    expect(window.location.search).toContain(`seed=${seed}`)
    expect(w.find('[data-testid="seed"]').text()).toBe(seed)

    await w.find('[data-testid="reveal"]').trigger('click')
    const ids = w.findAll('[data-testid="solution"] li').map((li) => li.attributes('data-bug-id'))
    expect(ids).toEqual(generatePage(seed).bugs)
    const first = w.find('[data-testid="solution"] li span').text()
    expect(first).toBe(BUG_BY_ID[ids[0]].description.es)

    await w.find('[data-testid="lang"]').setValue('en')
    expect(w.find('[data-testid="solution"] li span').text()).toBe(BUG_BY_ID[ids[0]].description.en)
    expect(window.location.search).toContain('lang=en')

    await w.find('[data-testid="new-page"]').trigger('click')
    const fresh = w.find('[data-testid="seed"]').text()
    expect(fresh).not.toBe(seed)
    expect(window.location.search).toContain(`seed=${fresh}`)
    w.unmount()
  })

  it('los bugs de validacion son reales: con flag aceptan lo invalido, sin flag lo rechazan (evita bugs "de mentira")', () => {
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

  it('el portafolio no importa nada del lab (evita inflar el bundle del portafolio)', () => {
    const walk = (dir) =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n)
        if (p.replaceAll('\\', '/').endsWith('src/qa-lab')) return []
        return statSync(p).isDirectory() ? walk(p) : /\.(js|vue)$/.test(n) ? [p] : []
      })
    const offenders = walk('src').filter((f) => /qa-lab/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
    expect(readFileSync('index.html', 'utf8')).not.toMatch(/qa-lab/)
  })
})
