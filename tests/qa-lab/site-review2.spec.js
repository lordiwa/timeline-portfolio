// TASK-047 review ronda 2: idioma en el historial, orden visible, filtros del panel, pedidos por sesion, menu mobile, titulo.
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mountLab } from '../../src/qa-lab/boot.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import App from '../../src/qa-lab/App.vue'
import es from '../../src/qa-lab/i18n/es.json'
import { forceSite, ALL_PAGES, mountSite, go, back, forward, tick, fill, click, track, cleanup } from './helpers.js'

afterEach(cleanup)

const mountApp = (search) => {
  window.history.replaceState(null, '', `/qa-lab/${search}`)
  const q = new URL(window.location.href).searchParams
  return track(mount(App, { props: { initialSeed: q.get('seed') || '', initialLevel: q.get('level') || '' }, global: { plugins: [createLabI18n(q.get('lang') || 'es')] }, attachTo: document.body }))
}
const lang = () => new URL(window.location.href).searchParams.get('lang')

describe('M-1: el idioma es historial', () => {
  it('?lang=es, #/faq, cambio a en, atras deja URL y UI en es; adelante vuelve a en', async () => {
    const w = mountApp('?seed=a&level=semi&lang=es')
    await go('/faq')
    await w.find('[data-testid="lang"]').setValue('en')
    expect(lang()).toBe('en')
    expect(w.find('[data-testid="reveal"]').text()).toBe('Reveal bugs')
    expect(window.location.hash).toBe('#/faq') // el idioma no cambia la ruta

    await back()
    expect(lang()).toBe('es')
    expect(w.find('[data-testid="lang"]').element.value).toBe('es')
    expect(w.find('[data-testid="reveal"]').text()).toBe(es.lab.reveal)
    expect(window.location.hash).toBe('#/faq')

    await forward()
    expect(lang()).toBe('en')
    expect(w.find('[data-testid="lang"]').element.value).toBe('en')
    expect(w.find('[data-testid="reveal"]').text()).toBe('Reveal bugs')
  })
})

describe('L-1: el orden elegido se ve y "Limpiar filtros" lo resetea', () => {
  it('el Dropdown muestra la opcion activa y marca el item elegido', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/catalog' })
    expect(w.find('.qa-dd-toggle').text()).toContain('Relevancia')
    await w.find('.qa-dd-toggle').trigger('click')
    await w.findAll('.qa-dd-menu button').find((b) => b.text().includes('mayor a menor')).trigger('click')
    expect(w.find('.qa-dd-toggle').text()).toContain('Precio: mayor a menor')
    await w.find('.qa-dd-toggle').trigger('click')
    expect(w.findAll('.qa-dd-menu button.active').map((b) => b.text())).toEqual(['Precio: mayor a menor'])
    expect(w.findAll('.qa-dd-menu button').filter((b) => b.attributes('aria-checked') === 'true')).toHaveLength(1)
    await click(w, 'Limpiar filtros').trigger('click')
    expect(w.find('.qa-dd-toggle').text()).toContain('Relevancia')
  })
})

describe('L-2: los filtros del panel persisten al navegar y se reinician al recargar', () => {
  it('buscar y filtrar el panel, ir a otra pagina y volver conserva todo; remontar lo limpia', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const a = await mountSite(site, { hash: '#/dashboard' })
    await a.w.find('.qa-toolbar-row select').setValue('1')
    await a.w.find('input[type=search]').setValue('a')
    await click(a.w, 'Siguiente')?.trigger('click')
    await go('/faq')
    await go('/dashboard')
    expect(a.w.find('.qa-toolbar-row select').element.value).toBe('1')
    expect(a.w.find('input[type=search]').element.value).toBe('a')
    a.w.unmount()
    const b = await mountSite(site, { hash: '#/dashboard', storage: a.storage })
    expect(b.w.find('.qa-toolbar-row select').element.value).toBe('')
    expect(b.w.find('input[type=search]').element.value).toBe('')
  })
})

describe('L-3: Mi cuenta lista los pedidos por la sesion', () => {
  it('con sesion, un pedido con otro email en el paso 1 igual aparece; uno de invitado no', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const place = async (w, email) => {
      await go('/catalog')
      await w.find('[data-testid="add-to-cart"]').trigger('click')
      await go('/checkout')
      await fill(w, { name: 'Ana Perez', email, address: 'Calle 1', city: 'Lima' })
      await w.find('form').trigger('submit')
      await w.find('form').trigger('submit')
      await fill(w, { card: '4111111111111111' })
      await w.find('form').trigger('submit')
      expect(w.find('[data-testid="order-confirmed"]').exists()).toBe(true)
    }
    const { w } = await mountSite(site, { hash: '#/login' })
    // 1) invitado: no aparece en la cuenta de nadie
    await place(w, 'invitado@example.com')
    await go('/login')
    await fill(w, { email: site.data.demoUser.email, password: site.data.demoUser.password })
    await w.find('form').trigger('submit')
    await tick()
    expect(w.find('[data-testid="orders"]').exists()).toBe(false)
    // 2) con sesion y otro email editado en el checkout: aparece igual
    await place(w, 'otro-correo@example.com')
    await go('/account')
    const items = w.find('[data-testid="orders"]').findAll('li')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('ORD-1002')
  })
})

describe('L-4: Ayuda cierra el menu mobile', () => {
  it('abrir el menu, tocar Ayuda lo cierra, y al cerrar el modal el foco vuelve al boton Menu', async () => {
    const { w } = await mountSite(forceSite({ pages: ALL_PAGES }), { hash: '#/faq' })
    await w.find('[data-testid="nav-toggle"]').trigger('click')
    expect(w.find('#qa-nav').classes()).toContain('open')
    await w.findAll('button').find((b) => b.text() === 'Ayuda').trigger('click')
    expect(w.find('#qa-nav').classes()).not.toContain('open')
    await tick()
    expect(document.querySelector('.qa-modal')).not.toBeNull()
    await w.find('.qa-modal .qa-btn').trigger('click')
    await tick()
    expect(document.activeElement).toBe(w.find('[data-testid="nav-toggle"]').element)
  })
})

describe('L-5 y nota: titulo y nivel invalido por la URL real', () => {
  it('document.title es "pagina · marca · QA Lab"', async () => {
    const site = forceSite({ pages: ALL_PAGES })
    const { w } = await mountSite(site, { hash: '#/faq' })
    const brand = es.theme[site.themeId][`name${site.brandIdx}`]
    expect(document.title).toBe(`${es.pageName.faq} · ${brand} · QA Lab`)
    await go('/cart')
    expect(document.title).toBe(`${es.pageName.cart} · ${brand} · QA Lab`)
    w.unmount()
  })

  it('?seed=x&level=xxx por mountLab cae en semi y corrige la URL', async () => {
    window.history.replaceState(null, '', '/qa-lab/?seed=x&level=xxx&lang=es')
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = mountLab(el)
    await tick()
    expect(el.querySelector('[data-testid="level"]').value).toBe('semi')
    expect(new URL(window.location.href).searchParams.get('level')).toBe('semi')
    expect(new URL(window.location.href).searchParams.get('seed')).toBe('x')
    app.unmount()
  })
})
