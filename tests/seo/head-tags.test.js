// tests/seo/head-tags.test.js
// Verifica que useHead esta cableado en App.vue (SEO-01..04) — reactive al locale.
// Plan 03-04 TDD. RED phase: App.vue aun no tiene useHead (falla T1-T5).
// GREEN phase: App.vue + main.js wired (Task 4.2 GREEN).
//
// Strategy: mount App.vue con stubs de componentes pesados.
// @unhead/vue en jsdom NO inyecta al DOM automaticamente sin DomPlugin.
// Usamos head.resolveTags() para verificar los tags resueltos por unhead
// (API programatica, mas confiable que DOM en testing).
// Para T2-T5 que necesitan DOM, usamos renderDOMHead de @unhead/dom.

import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createHead } from '@unhead/vue'
import { renderDOMHead } from '@unhead/dom'
import App from '@/App.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Stubs para componentes pesados — el test solo ejerce el head wiring de App.vue setup
const heavyStubs = {
  BackgroundLayers: true,
  SkipLink: true,
  StickyAvatar: true,
  ScrollShell: true,
  StickyTimeline: true,
  LangToggle: true,
  ContactHUD: true,
}

// Helper para esperar que Vue/unhead flush (async watchers + microtasks)
async function waitForHead() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  // Limpiar tags inyectados por renderDOMHead entre tests
  document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove())
  document.head.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove())
  document.head.querySelectorAll('link[rel="alternate"]').forEach((el) => el.remove())
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove())
  document.head.querySelectorAll('title').forEach((el) => el.remove())
})

describe('SEO head tags (SEO-01..04)', () => {
  it('T1 — title reactive al locale (SEO-03)', async () => {
    const i18n = createTestI18n({ locale: 'es' })
    const head = createHead()
    mount(App, {
      global: {
        plugins: [i18n, head],
        stubs: heavyStubs,
      },
    })
    await waitForHead()

    // Verificar el title via head.resolveTags() — API programatica de unhead
    // (mas confiable que DOM en jsdom sin DomPlugin activo en el watcher cycle)
    const tagsEs = await head.resolveTags()
    const titleTagEs = tagsEs.find((tag) => tag.tag === 'title')
    expect(titleTagEs).toBeDefined()
    const titleValueEs = titleTagEs?.textContent ?? titleTagEs?.children ?? ''
    expect(String(titleValueEs).length).toBeGreaterThan(0)

    // Cambiar locale a EN — reactive functions deben recalcular
    i18n.global.locale.value = 'en'
    await waitForHead()

    const tagsEn = await head.resolveTags()
    const titleTagEn = tagsEn.find((tag) => tag.tag === 'title')
    expect(titleTagEn).toBeDefined()
    const titleValueEn = titleTagEn?.textContent ?? titleTagEn?.children ?? ''
    expect(String(titleValueEn).length).toBeGreaterThan(0)

    // ES y EN tienen placeholders distintos (ES: "...title ES..." vs EN: "...title EN...")
    expect(String(titleValueEn)).not.toBe(String(titleValueEs))
  })

  it('T2 — meta description, og:title, og:description presentes (SEO-01 + SEO-03)', async () => {
    const i18n = createTestI18n({ locale: 'es' })
    const head = createHead()
    mount(App, {
      global: {
        plugins: [i18n, head],
        stubs: heavyStubs,
      },
    })
    await waitForHead()
    // Forzar inyeccion DOM via renderDOMHead para que querySelector funcione
    await renderDOMHead(head, { document })

    const desc = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')

    expect(desc).not.toBeNull()
    expect(ogTitle).not.toBeNull()
    expect(ogDesc).not.toBeNull()

    expect(desc.getAttribute('content').length).toBeGreaterThan(0)
    expect(ogTitle.getAttribute('content').length).toBeGreaterThan(0)
    expect(ogDesc.getAttribute('content').length).toBeGreaterThan(0)
  })

  it('T3 — og:image, og:type=website, og:url con URL valida (SEO-01)', async () => {
    const head = createHead()
    mount(App, {
      global: {
        plugins: [createTestI18n(), head],
        stubs: heavyStubs,
      },
    })
    await waitForHead()
    await renderDOMHead(head, { document })

    const ogImage = document.querySelector('meta[property="og:image"]')
    const ogType = document.querySelector('meta[property="og:type"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')

    expect(ogImage).not.toBeNull()
    expect(ogType).not.toBeNull()
    expect(ogUrl).not.toBeNull()

    expect(ogImage.getAttribute('content')).toContain('/og-image.png')
    expect(ogType.getAttribute('content')).toBe('website')
    // og:url puede ser placeholder (https://SITE_URL) — debe comenzar con http(s)://
    expect(ogUrl.getAttribute('content')).toMatch(/^https?:\/\//)
  })

  it('T4 — hreflang ES / EN / x-default presentes (SEO-04)', async () => {
    const head = createHead()
    mount(App, {
      global: {
        plugins: [createTestI18n(), head],
        stubs: heavyStubs,
      },
    })
    await waitForHead()
    await renderDOMHead(head, { document })

    const hreflangs = Array.from(
      document.querySelectorAll('link[rel="alternate"][hreflang]')
    )
    const langs = hreflangs.map((l) => l.getAttribute('hreflang'))

    expect(langs).toContain('es')
    expect(langs).toContain('en')
    expect(langs).toContain('x-default')
  })

  it('T5 — JSON-LD Person script en head con @context schema.org + @type Person (SEO-02)', async () => {
    const head = createHead()
    mount(App, {
      global: {
        plugins: [createTestI18n(), head],
        stubs: heavyStubs,
      },
    })
    await waitForHead()
    await renderDOMHead(head, { document })

    const jsonldEl = document.querySelector('script[type="application/ld+json"]')
    expect(jsonldEl).not.toBeNull()

    const parsed = JSON.parse(jsonldEl.textContent)
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@type']).toBe('Person')
  })
})
