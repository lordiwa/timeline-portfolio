// TASK-046 / TASK-047 — shell del QA Lab: solucionario, nivel, idioma, "nueva pagina", aislamiento del portafolio.
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { generateSite } from '../../src/qa-lab/generator/site.js'
import { concretePath } from '../../src/qa-lab/generator/pages.js'
import { BUGS, BUG_BY_ID, CATEGORIES, DIFFICULTIES } from '../../src/qa-lab/bugs/catalog.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import { resolveContent } from '../../src/qa-lab/content/index.js'
import { getThemePack } from '../../src/qa-lab/themes/index.js'
import App from '../../src/qa-lab/App.vue'
import es from '../../src/qa-lab/i18n/es.json'
import en from '../../src/qa-lab/i18n/en.json'
import { tick, track, cleanup } from './helpers.js'

afterEach(cleanup)

const mountApp = (props, locale = 'es') => track(mount(App, { props, global: { plugins: [createLabI18n(locale)] }, attachTo: document.body }))

describe('QA Lab: catalogo unico', () => {
  it('19 bugs con categoria, dificultad y descripcion es/en (evita un bug que el solucionario no pueda explicar)', () => {
    expect(BUGS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(BUGS.map((b) => b.id)).size).toBe(BUGS.length)
    for (const b of BUGS) {
      expect(CATEGORIES).toContain(b.category)
      expect(DIFFICULTIES).toContain(b.difficulty)
      expect(b.description.es.length).toBeGreaterThan(5)
      expect(b.description.en.length).toBeGreaterThan(5)
    }
  })

  it('es.json y en.json tienen exactamente las mismas claves (evita texto sin traducir en un idioma)', () => {
    const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]))
    expect(flat(en).sort()).toEqual(flat(es).sort())
  })
})

describe('QA Lab: shell', () => {
  it('"revelar bugs" lista exactamente los activos con su pagina y un link a esa ruta (evita solucionario desincronizado)', async () => {
    const seed = 'rev-7'
    const w = mountApp({ initialSeed: seed, initialLevel: 'senior' })
    const site = generateSite(seed, 'senior')
    expect(window.location.search).toContain(`seed=${seed}`)
    expect(window.location.search).toContain('level=senior')
    expect(w.find('[data-testid="seed"]').text()).toBe(seed)

    await w.find('[data-testid="reveal"]').trigger('click')
    const items = w.findAll('[data-testid="solution"] li')
    expect(items.map((li) => li.attributes('data-bug-id'))).toEqual(site.bugs)
    expect(items.map((li) => li.attributes('data-bug-page'))).toEqual(site.bugs.map((id) => site.bugPages[id]))
    items.forEach((li, i) => {
      const id = site.bugs[i]
      expect(li.find('span').text()).toBe(BUG_BY_ID[id].description.es)
      expect(li.find('[data-testid="bug-link"]').attributes('href')).toBe(`#${concretePath(site, site.bugPages[id])}`)
    })
    expect(w.find('[data-testid="site-pages"]').text()).toContain(`(${site.pages.length})`)

    await w.find('[data-testid="lang"]').setValue('en')
    expect(w.find('[data-testid="solution"] li span').text()).toBe(BUG_BY_ID[site.bugs[0]].description.en)
    expect(window.location.search).toContain('lang=en')
    w.unmount()
  })

  it('el link del solucionario lleva a la pagina donde esta el bug (caso 7)', async () => {
    const seed = 'rev-7'
    const w = mountApp({ initialSeed: seed, initialLevel: 'senior' })
    await w.find('[data-testid="reveal"]').trigger('click')
    const site = generateSite(seed, 'senior')
    const first = site.bugs[0]
    window.location.hash = `#${concretePath(site, site.bugPages[first])}`
    await tick()
    expect(w.find('main [data-page]').attributes('data-page')).toBe(site.bugPages[first])
    w.unmount()
  })

  it('cambiar el nivel conserva la semilla, cambia paginas y bugs, queda en la URL y vuelve al inicio (caso 7)', async () => {
    window.location.hash = '#/faq'
    const w = mountApp({ initialSeed: 'lvl-2', initialLevel: 'junior' })
    await w.find('[data-testid="reveal"]').trigger('click')
    const count = (level) => generateSite('lvl-2', level)
    expect(w.findAll('[data-testid="solution"] li').length).toBe(count('junior').bugs.length)
    await w.find('[data-testid="level"]').setValue('senior')
    expect(w.find('[data-testid="seed"]').text()).toBe('lvl-2')
    expect(window.location.search).toContain('level=senior')
    expect(window.location.hash).toBe('#/')
    await w.find('[data-testid="reveal"]').trigger('click')
    expect(w.findAll('[data-testid="solution"] li').length).toBe(count('senior').bugs.length)
    expect(w.find('[data-testid="site-pages"]').text()).toContain(`(${count('senior').pages.length})`)
    expect(w.findAll('[data-nav]').length).toBeGreaterThanOrEqual(3)
    w.unmount()
  })

  it('una URL con nivel invalido o ausente abre en semi (evita un ?level roto)', () => {
    const w = mountApp({ initialSeed: 'x1', initialLevel: 'experto' })
    expect(w.find('[data-testid="level"]').element.value).toBe('semi')
    expect(window.location.search).toContain('level=semi')
    w.unmount()
    const w2 = mountApp({ initialSeed: 'x1' })
    expect(w2.find('[data-testid="level"]').element.value).toBe('semi')
    w2.unmount()
  })

  it('"nueva pagina" cambia la semilla, la escribe en la URL y empieza en el inicio (caso 8)', async () => {
    window.location.hash = '#/blog'
    const w = mountApp({ initialSeed: 'old-1', initialLevel: 'semi' })
    await w.find('[data-testid="new-page"]').trigger('click')
    const fresh = w.find('[data-testid="seed"]').text()
    expect(fresh).not.toBe('old-1')
    expect(window.location.search).toContain(`seed=${fresh}`)
    expect(window.location.hash).toBe('#/')
    expect(w.find('main [data-page]').attributes('data-page')).toBe('home')
    w.unmount()
  })

  it('el idioma traduce la UI y el contenido sin cambiar el sitio (caso 8)', async () => {
    const w = mountApp({ initialSeed: 'lang-4', initialLevel: 'semi' })
    const site = generateSite('lang-4', 'semi')
    const pack = getThemePack(site.themeId)
    expect(w.find('.brand').text()).toBe(pack.name.es)
    await w.find('[data-testid="lang"]').setValue('en')
    expect(w.find('.brand').text()).toBe(pack.name.en)
    expect(w.find('h1').text()).toBe(en.tpl.home.title.replace('{brand}', pack.name.en))
    expect(w.find('[data-testid="level"]').element.value).toBe('semi')
    w.unmount()
  })
})

describe('QA Lab: capa de contenido', () => {
  it('resolveContent entrega la interfaz documentada en es y en (evita que cablear los packs rompa las paginas)', () => {
    const site = generateSite('content-1', 'semi')
    const pack = getThemePack(site.themeId)
    for (const locale of ['es', 'en']) {
      const i18n = createLabI18n(locale)
      const c = resolveContent(site, i18n.global.t)
      expect(c.brand).toBe(pack.name[locale])
      expect(c.items).toHaveLength(site.data.catalog.length)
      expect(c.items[0]).toMatchObject({ id: 1, price: site.data.catalog[0].price })
      expect(c.items[0].name.length).toBeGreaterThan(2)
      expect(c.categories).toEqual(pack.categories.map((k) => k[locale]))
      expect(c.faq).toHaveLength(Math.min(6, pack.faq.length))
      expect(c.posts.length).toBeGreaterThanOrEqual(3)
      expect(c.currency).toEqual(pack.currency)
      expect(c.money(12.5)).toBe(pack.currency.position === 'after' ? `${(12.5).toFixed(pack.currency.decimals)} ${pack.currency.symbol}` : `${pack.currency.symbol}${(12.5).toFixed(pack.currency.decimals)}`)
      expect(c.field('email')).toMatchObject({ key: 'email', type: 'email', required: true })
      expect(c.field('subject').options).toHaveLength(4)
      for (const f of pack.signupFields) expect(c.field(f.key)).toMatchObject({ key: f.key, type: f.type, required: f.required, label: f.label[locale] })
      expect(Object.keys(c.nav)).toEqual(['home', 'list', 'cart', 'blog', 'faq', 'contact', 'dashboard', 'wizard', 'login', 'signup', 'account'])
      expect(c.stepTitle('confirm').length).toBeGreaterThan(2)
    }
  })
})

describe('QA Lab: aislamiento', () => {
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
