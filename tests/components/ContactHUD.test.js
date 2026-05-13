// tests/components/ContactHUD.test.js
// Tests del componente ContactHUD.vue (Plan 03-02, Task 2.1).
//
// Cobertura (10 tests):
//   T1  DOM contract: .contact-hud existe + aria-label viene de t('contact.hudAria').
//   T2  anchors count + svg: 3 anchors .contact-icon (email+LinkedIn+GitHub) con <svg>; otherUrl null → 4to NO renderizado.
//   T3  href correcto: mailto:test@example.com, https://linkedin.com/in/test, https://github.com/test.
//   T4  T-CON-03 mitigation: external links (LinkedIn, GitHub) tienen rel="noopener noreferrer" + target="_blank".
//   T5  aria-labels i18n multiplexed: es → "Enviar email a Rafael" / "Perfil LinkedIn de Rafael" / "GitHub de Rafael"; en → "Email Rafael" / "Rafael's LinkedIn profile" / "Rafael's GitHub".
//   T6  reactive Pitfall 3: mutar i18n.global.locale.value → aria-labels actualizan sin re-mount.
//   T7  CSS readFileSync: source contiene position:fixed, bottom:env(safe-area-inset-bottom,0), right:var(--sp-md), z-index:40, width:44px, height:44px, flex-direction:column, transition 150ms.
//   T8  CSS no outline propio (Pitfall 7): regex sobre .contact-icon block retorna null.
//   T9  otherUrl conditional render: 4to anchor visible con href + rel/target externos.
//   T10 defensive disabled email: email='' → anchor renderea con aria-disabled='true' SIN href.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const CONTACT_HUD_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ContactHUD.vue'),
  'utf8'
)

// Mock global para la mayoría de los tests (T1-T8):
// valores conocidos positivos — permite verificar hrefs y DOM contract.
vi.mock('@/data/contact', () => ({
  contact: {
    email: 'test@example.com',
    linkedinUrl: 'https://linkedin.com/in/test',
    githubUrl: 'https://github.com/test',
    otherUrl: null,
  },
}))

// Helper para montar ContactHUD con i18n.
function mountHUD({ locale = 'es' } = {}) {
  // Importar dinámicamente para respetar el mock activo.
  const ContactHUD = require('@/components/ContactHUD.vue').default
  const i18n = createTestI18n({ locale })
  const wrapper = mount(ContactHUD, {
    global: { plugins: [i18n] },
  })
  return { wrapper, i18n }
}

describe('ContactHUD.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — .contact-hud existe + aria-label viene de t('contact.hudAria')
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM: .contact-hud existe con aria-label correcto (locale=es)', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const hud = wrapper.find('.contact-hud')
    expect(hud.exists()).toBe(true)
    expect(hud.attributes('aria-label')).toBe('Contacto rápido')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: anchors count + SVG — 3 anchors .contact-icon con <svg>; otherUrl null → 4to NO presente
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 anchors: 3 .contact-icon renderean con <svg> interno; otherUrl null → 4to anchor NO presente', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    expect(anchors).toHaveLength(3)
    anchors.forEach((a) => {
      expect(a.find('svg').exists()).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: href correcto para los 3 mandatory (email mailto, LinkedIn, GitHub)
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 href: mailto:test@example.com + LinkedIn + GitHub hrefs correctos', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    // email anchor — primer anchor
    expect(anchors[0].attributes('href')).toBe('mailto:test@example.com')
    // LinkedIn anchor — segundo anchor
    expect(anchors[1].attributes('href')).toBe('https://linkedin.com/in/test')
    // GitHub anchor — tercer anchor
    expect(anchors[2].attributes('href')).toBe('https://github.com/test')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: T-CON-03 mitigation — external links tienen rel="noopener noreferrer" + target="_blank"
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 T-CON-03: external links tienen rel="noopener noreferrer" + target="_blank"', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const externals = wrapper.findAll('a[target="_blank"]')
    expect(externals.length).toBeGreaterThanOrEqual(2) // LinkedIn + GitHub mínimo
    externals.forEach((a) => {
      expect(a.attributes('rel')).toBe('noopener noreferrer')
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: aria-labels i18n multiplexed — locale=es vs locale=en
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 aria-labels ES: emailAria="Enviar email a Rafael", linkedinAria="Perfil LinkedIn de Rafael", githubAria="GitHub de Rafael"', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    expect(anchors[0].attributes('aria-label')).toBe('Enviar email a Rafael')
    expect(anchors[1].attributes('aria-label')).toBe('Perfil LinkedIn de Rafael')
    expect(anchors[2].attributes('aria-label')).toBe('GitHub de Rafael')
  })

  it('T5b aria-labels EN: emailAria="Email Rafael", linkedinAria="Rafael\'s LinkedIn profile", githubAria="Rafael\'s GitHub"', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'en' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    expect(anchors[0].attributes('aria-label')).toBe('Email Rafael')
    expect(anchors[1].attributes('aria-label')).toBe("Rafael's LinkedIn profile")
    expect(anchors[2].attributes('aria-label')).toBe("Rafael's GitHub")
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: reactive Pitfall 3 — mutar i18n.global.locale → aria-labels actualizan sin re-mount
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 reactive (Pitfall 3): mutar locale "es"→"en" → aria-labels actualizan sin re-mount', async () => {
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    expect(wrapper.findAll('a.contact-icon')[0].attributes('aria-label')).toBe('Enviar email a Rafael')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.findAll('a.contact-icon')[0].attributes('aria-label')).toBe('Email Rafael')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T7: CSS readFileSync — position:fixed, bottom:env(...), right:var(--sp-md),
  //     z-index:40, width:44px, height:44px, flex-direction:column, transition 150ms
  // ─────────────────────────────────────────────────────────────────────────
  it('T7 CSS: source contiene position:fixed, bottom:env(safe-area-inset-bottom,0), right:var(--sp-md), z-index:40, width:44px, height:44px, flex-direction:column, transition 150ms', () => {
    expect(CONTACT_HUD_SOURCE).toMatch(/position:\s*fixed/)
    expect(CONTACT_HUD_SOURCE).toMatch(/bottom:\s*env\(safe-area-inset-bottom,\s*0\)/)
    expect(CONTACT_HUD_SOURCE).toMatch(/right:\s*var\(--sp-md\)/)
    expect(CONTACT_HUD_SOURCE).toMatch(/z-index:\s*40/)
    expect(CONTACT_HUD_SOURCE).toMatch(/width:\s*44px/)
    expect(CONTACT_HUD_SOURCE).toMatch(/height:\s*44px/)
    expect(CONTACT_HUD_SOURCE).toMatch(/flex-direction:\s*column/)
    expect(CONTACT_HUD_SOURCE).toMatch(/transition:\s*background 150ms/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T8: CSS no outline propio (Pitfall 7) — regex sobre .contact-icon block retorna null
  // ─────────────────────────────────────────────────────────────────────────
  it('T8 CSS no outline: .contact-icon NO declara outline: propio (Pitfall 7 — universal de App.vue cubre)', () => {
    // Verificar que el bloque .contact-icon principal no tiene outline:
    const contactIconBlock = CONTACT_HUD_SOURCE.match(/\.contact-icon\s*\{[^}]*\}/)
    if (contactIconBlock) {
      expect(contactIconBlock[0]).not.toMatch(/outline:/)
    }
    // Verificar que no hay .contact-icon:focus ni :focus-visible con outline
    expect(CONTACT_HUD_SOURCE).not.toMatch(/\.contact-icon:focus[^-][\s\S]*?outline:/)
    expect(CONTACT_HUD_SOURCE).not.toMatch(/\.contact-icon:focus-visible[\s\S]*?outline:/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T9: otherUrl conditional render — 4to anchor visible con href + rel/target externos
  // ─────────────────────────────────────────────────────────────────────────
  it('T9 otherUrl: cuando otherUrl está presente → 4 anchors renderean; 4to tiene href + rel + target correctos', async () => {
    vi.resetModules()
    vi.doMock('@/data/contact', () => ({
      contact: {
        email: 'test@example.com',
        linkedinUrl: 'https://linkedin.com/in/test',
        githubUrl: 'https://github.com/test',
        otherUrl: 'https://mastodon.example/@rafael',
      },
    }))
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    expect(anchors).toHaveLength(4)
    const lastAnchor = anchors[3]
    expect(lastAnchor.attributes('href')).toBe('https://mastodon.example/@rafael')
    expect(lastAnchor.attributes('target')).toBe('_blank')
    expect(lastAnchor.attributes('rel')).toBe('noopener noreferrer')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T10: defensive disabled email — email='' → anchor renderea con aria-disabled='true' SIN href
  // ─────────────────────────────────────────────────────────────────────────
  it('T10 disabled email: email="" → anchor renderea pero con aria-disabled="true" y sin href', async () => {
    vi.resetModules()
    vi.doMock('@/data/contact', () => ({
      contact: {
        email: '',
        linkedinUrl: 'https://linkedin.com/in/test',
        githubUrl: 'https://github.com/test',
        otherUrl: null,
      },
    }))
    const ContactHUD = (await import('@/components/ContactHUD.vue')).default
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ContactHUD, { global: { plugins: [i18n] } })
    const anchors = wrapper.findAll('a.contact-icon')
    // El email anchor se renderiza siempre (consistencia visual)
    expect(anchors.length).toBeGreaterThanOrEqual(1)
    // El primer anchor (email) debe tener aria-disabled='true' y sin href
    const emailAnchor = anchors[0]
    expect(emailAnchor.attributes('aria-disabled')).toBe('true')
    expect(emailAnchor.attributes('href')).toBeUndefined()
  })
})
