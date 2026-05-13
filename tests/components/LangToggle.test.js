// tests/components/LangToggle.test.js
// Tests del componente LangToggle.vue (Plan 02-02, Task 2.1).
//
// Cobertura (9 tests):
//   T1 DOM: button.lang-toggle existe con aria-label correcto + 3 span hijos.
//   T2 DOM active/inactive: span textos ES/EN correctos según locale.
//   T3 click toggle: click alterna locale 'es' → 'en'; aria-label cambia.
//   T4 persist: click toggle → localStorage.setItem llamado con key+value correctos.
//   T5 visible texts swap: tras click, .lang-active='EN' y .lang-inactive='ES'.
//   T6 aria reactive (Pitfall 3): mutar locale.value → aria-label reactivo sin re-mount.
//   T7 CSS readFileSync: source contiene position:fixed, top/right var(--sp-md),
//      z-index:40, min-width/min-height 44px, border-radius:999px.
//   T8 CSS no outline declared: source NO contiene outline: dentro de .lang-toggle.
//   T9 CSS mobile @media: source contiene @media(max-width:599px) con
//      .lang-sep y .lang-inactive display:none y ::before con content:'🌐'.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import LangToggle from '@/components/LangToggle.vue'
import es from '@/i18n/es.json'
import en from '@/i18n/en.json'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const LANG_TOGGLE_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/LangToggle.vue'),
  'utf8'
)

// Helper: monta LangToggle con plugin i18n mutable.
// Retorna { wrapper, i18n } donde i18n.global.locale.value es mutable.
function mountLangToggle({ initialLocale = 'es' } = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: { es, en },
  })
  const wrapper = mount(LangToggle, {
    global: {
      plugins: [i18n],
    },
  })
  return { wrapper, i18n }
}

describe('LangToggle.vue', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — button.lang-toggle + aria-label + 3 span hijos
  // ───────────────────────────────────────────────────────────────────────────
  it('T1 DOM: renders button.lang-toggle with aria-label and 3 span children (locale=es)', () => {
    const { wrapper } = mountLangToggle({ initialLocale: 'es' })
    const btn = wrapper.find('button.lang-toggle')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBe('Cambiar idioma a inglés')
    const spans = btn.findAll('span')
    expect(spans.length).toBe(3)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T2: DOM active/inactive — textos ES/EN correctos según locale
  // ───────────────────────────────────────────────────────────────────────────
  it('T2 DOM active/inactive: locale=es → .lang-active="ES" .lang-inactive="EN"', () => {
    const { wrapper } = mountLangToggle({ initialLocale: 'es' })
    expect(wrapper.find('.lang-active').text()).toBe('ES')
    expect(wrapper.find('.lang-inactive').text()).toBe('EN')
  })

  it('T2b DOM active/inactive: locale=en → .lang-active="EN" .lang-inactive="ES"', () => {
    const { wrapper } = mountLangToggle({ initialLocale: 'en' })
    expect(wrapper.find('.lang-active').text()).toBe('EN')
    expect(wrapper.find('.lang-inactive').text()).toBe('ES')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T3: click toggle — locale alterna 'es' → 'en'; aria-label cambia
  // ───────────────────────────────────────────────────────────────────────────
  it('T3 click toggle: click con locale=es cambia locale a "en" y aria-label a "Switch language to Spanish"', async () => {
    const { wrapper, i18n } = mountLangToggle({ initialLocale: 'es' })
    expect(i18n.global.locale.value).toBe('es')
    await wrapper.find('button.lang-toggle').trigger('click')
    await flushPromises()
    expect(i18n.global.locale.value).toBe('en')
    expect(wrapper.find('button.lang-toggle').attributes('aria-label')).toBe('Switch language to Spanish')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T4: persist — click → localStorage.setItem llamado con key+value correctos
  // ───────────────────────────────────────────────────────────────────────────
  it('T4 persist: click toggle → localStorage.setItem("portfolio.locale", "en")', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const { wrapper } = mountLangToggle({ initialLocale: 'es' })
    await wrapper.find('button.lang-toggle').trigger('click')
    await flushPromises()
    expect(setItemSpy).toHaveBeenCalledWith('portfolio.locale', 'en')
    setItemSpy.mockRestore()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T5: visible texts swap — tras click, .lang-active='EN', .lang-inactive='ES'
  // ───────────────────────────────────────────────────────────────────────────
  it('T5 visible texts swap: tras click (es→en), .lang-active="EN" y .lang-inactive="ES"', async () => {
    const { wrapper } = mountLangToggle({ initialLocale: 'es' })
    await wrapper.find('button.lang-toggle').trigger('click')
    await flushPromises()
    expect(wrapper.find('.lang-active').text()).toBe('EN')
    expect(wrapper.find('.lang-inactive').text()).toBe('ES')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T6: aria reactive (Pitfall 3) — mutar locale.value → aria-label sin re-mount
  // ───────────────────────────────────────────────────────────────────────────
  it('T6 aria reactive (Pitfall 3): mutar i18n.global.locale a "en" → aria-label actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountLangToggle({ initialLocale: 'es' })
    expect(wrapper.find('button.lang-toggle').attributes('aria-label')).toBe('Cambiar idioma a inglés')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('button.lang-toggle').attributes('aria-label')).toBe('Switch language to Spanish')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T7: CSS readFileSync — position:fixed, top/right var(--sp-md), z-index:40,
  //     min-width/min-height 44px, border-radius:999px
  // ───────────────────────────────────────────────────────────────────────────
  it('T7 CSS: source contiene position:fixed, top/right var(--sp-md), z-index:40, min-width/min-height 44px, border-radius:999px', () => {
    expect(LANG_TOGGLE_SOURCE).toMatch(/position:\s*fixed/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/top:\s*var\(--sp-md\)/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/right:\s*var\(--sp-md\)/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/z-index:\s*40/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/min-width:\s*44px/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/min-height:\s*44px/)
    expect(LANG_TOGGLE_SOURCE).toMatch(/border-radius:\s*999px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T8: CSS no outline declared — source NO contiene outline: en bloque .lang-toggle
  //     (Pitfall 7 — focus heredado del universal de App.vue)
  // ───────────────────────────────────────────────────────────────────────────
  it('T8 CSS no outline: source NO declara outline: propio en bloque .lang-toggle (Pitfall 7)', () => {
    // Extraer el bloque .lang-toggle principal del CSS
    const langToggleBlock = LANG_TOGGLE_SOURCE.match(/\.lang-toggle\s*\{[^}]*\}/)
    if (langToggleBlock) {
      expect(langToggleBlock[0]).not.toMatch(/outline:/)
    }
    // También verificar que no hay .lang-toggle:focus ni .lang-toggle:focus-visible con outline
    expect(LANG_TOGGLE_SOURCE).not.toMatch(/\.lang-toggle:focus[^-][\s\S]*?outline:/)
    expect(LANG_TOGGLE_SOURCE).not.toMatch(/\.lang-toggle:focus-visible[\s\S]*?outline:/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T9: CSS mobile @media — @media(max-width:599px) con display:none para
  //     .lang-sep y .lang-inactive, y ::before con content:'🌐'
  // ───────────────────────────────────────────────────────────────────────────
  it('T9 CSS mobile @media: @media(max-width:599px) con .lang-sep/.lang-inactive display:none y ::before content:"🌐"', () => {
    expect(LANG_TOGGLE_SOURCE).toMatch(/@media\s*\(\s*max-width:\s*599px\s*\)/)
    // Extraer el bloque @media
    const mediaBlock = LANG_TOGGLE_SOURCE.match(/@media\s*\(\s*max-width:\s*599px\s*\)\s*\{[\s\S]*?\}(?:\s*\n|$)/)
    // Verificar display:none para .lang-sep y .lang-inactive
    const allMediaContent = LANG_TOGGLE_SOURCE.match(/@media\s*\(\s*max-width:\s*599px\s*\)\s*\{([\s\S]*?)(?=@media|\*\/|$)/)?.[1] || ''
    expect(allMediaContent).toMatch(/\.lang-sep/)
    expect(allMediaContent).toMatch(/\.lang-inactive/)
    expect(allMediaContent).toMatch(/display:\s*none/)
    // ::before con content globo
    expect(allMediaContent).toMatch(/::before/)
    expect(allMediaContent).toMatch(/content:\s*['"]🌐['"]/)
  })
})
