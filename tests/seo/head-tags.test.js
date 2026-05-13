// tests/seo/head-tags.test.js
// Verifica que useHead esta cableado en App.vue (SEO-01..04) — reactive al locale.
// Plan 03-04 TDD. RED phase: App.vue aun no tiene useHead (falla T1-T5).
// GREEN phase: App.vue + main.js wired (Task 4.2 GREEN).
//
// Strategy: mount App.vue con stubs de componentes pesados para que el test
// solo ejerza el head wiring del <script setup> de App.vue.
// @unhead/vue inyecta tags en document.head (jsdom) via createHead() plugin.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createHead } from '@unhead/vue'
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

// Helper para esperar que unhead flush tags al DOM (puede ser async en jsdom)
async function waitForHead() {
  await flushPromises()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('SEO head tags (SEO-01..04)', () => {
  let cleanupFns = []

  afterEach(() => {
    // Limpiar el document.head entre tests para evitar contaminacion entre runs
    cleanupFns.forEach((fn) => fn())
    cleanupFns = []
    // Limpiar todos los meta/link/script que unhead haya inyectado
    document.head.querySelectorAll('meta[name="description"]').forEach((el) => el.remove())
    document.head.querySelectorAll('meta[property^="og:"]').forEach((el) => el.remove())
    document.head.querySelectorAll('link[rel="alternate"]').forEach((el) => el.remove())
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove())
  })

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

    // Verificar que title es un string no vacio (puede ser placeholder o valor real)
    expect(typeof document.title).toBe('string')
    expect(document.title.length).toBeGreaterThan(0)

    const titleEs = document.title

    // Cambiar locale a EN — title debe mutar reactivamente
    i18n.global.locale.value = 'en'
    await waitForHead()

    // Si los valores ES/EN son diferentes, el titulo debe cambiar
    // (con placeholders diferentes en ES vs EN, el titulo cambia)
    expect(typeof document.title).toBe('string')
    expect(document.title.length).toBeGreaterThan(0)

    // Confirmar que el wiring reactivo funciono: al menos uno de ES o EN tuviera contenido
    // (title ES y EN son distintos por los placeholders con idioma embebido)
    expect(document.title).not.toBe(titleEs)
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

    const desc = document.querySelector('meta[name="description"]')
    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')

    expect(desc).not.toBeNull()
    expect(ogTitle).not.toBeNull()
    expect(ogDesc).not.toBeNull()

    // Verificar que tienen content
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

    const ogImage = document.querySelector('meta[property="og:image"]')
    const ogType = document.querySelector('meta[property="og:type"]')
    const ogUrl = document.querySelector('meta[property="og:url"]')

    expect(ogImage).not.toBeNull()
    expect(ogType).not.toBeNull()
    expect(ogUrl).not.toBeNull()

    expect(ogImage.getAttribute('content')).toContain('/og-image.png')
    expect(ogType.getAttribute('content')).toBe('website')
    // og:url puede ser placeholder (https://SITE_URL) o URL real — debe comenzar con http(s)://
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

    const jsonldEl = document.querySelector('script[type="application/ld+json"]')
    expect(jsonldEl).not.toBeNull()

    const parsed = JSON.parse(jsonldEl.textContent)
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@type']).toBe('Person')
  })
})
