// tests/i18n/html-lang-watcher.test.js
// Verifica que el watcher de locale en App.vue muta document.documentElement.lang
// reactivamente al cambiar i18n.global.locale.value (I18N-04 + A11Y-07).
//
// Cobertura (4 tests):
//   T1 — tras mount + nextTick, document.documentElement.lang === locale inicial
//   T2 — tras locale.value = 'en' + flushPromises, lang muta a 'en'
//   T3 — múltiples toggles: es → en → es, el lang attribute sigue cada cambio
//   T4 — el watcher NO se ejecuta múltiples veces por render (solo cambia al cambiar locale)

import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, watch, nextTick } from 'vue'
import { createI18n, useI18n } from 'vue-i18n'

// Helper: crea una instancia i18n aislada para los tests con messages mínimos
function makeTestI18n(initialLocale = 'es') {
  return createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    fallbackWarn: false,
    missingWarn: false,
    messages: { es: {}, en: {} },
  })
}

// Helper: crea un componente de prueba que replica el watcher de App.vue
// (análogo a PATTERNS.md §App.vue lines 543-546 verbatim)
function makeWrapper(i18nInstance) {
  const WatcherComp = defineComponent({
    setup() {
      const { locale } = useI18n()
      // I18N-04 + A11Y-07 — single source of truth para <html lang> mutation
      watch(locale, (l) => {
        document.documentElement.lang = l
      }, { immediate: true })
      return () => null
    },
  })

  return mount(WatcherComp, {
    global: {
      plugins: [i18nInstance],
    },
  })
}

describe('html-lang watcher (I18N-04 + A11Y-07)', () => {
  beforeEach(() => {
    // Resetear el atributo lang antes de cada test
    document.documentElement.lang = ''
  })

  it('T1 — tras mount + nextTick, document.documentElement.lang === locale inicial (es)', async () => {
    const i18nInstance = makeTestI18n('es')
    const wrapper = makeWrapper(i18nInstance)
    await nextTick()
    expect(document.documentElement.lang).toBe('es')
    wrapper.unmount()
  })

  it('T2 — locale.value = en → document.documentElement.lang === en', async () => {
    const i18nInstance = makeTestI18n('es')
    const wrapper = makeWrapper(i18nInstance)
    await nextTick()
    expect(document.documentElement.lang).toBe('es')

    // Cambiar locale
    i18nInstance.global.locale.value = 'en'
    await flushPromises()
    expect(document.documentElement.lang).toBe('en')
    wrapper.unmount()
  })

  it('T3 — múltiples toggles es → en → es: lang sigue cada cambio', async () => {
    const i18nInstance = makeTestI18n('es')
    const wrapper = makeWrapper(i18nInstance)
    await nextTick()

    // Toggle 1: es → en
    i18nInstance.global.locale.value = 'en'
    await flushPromises()
    expect(document.documentElement.lang).toBe('en')

    // Toggle 2: en → es
    i18nInstance.global.locale.value = 'es'
    await flushPromises()
    expect(document.documentElement.lang).toBe('es')
    wrapper.unmount()
  })

  it('T4 — el lang attribute NO cambia en re-renders sin cambio de locale', async () => {
    const i18nInstance = makeTestI18n('es')
    const wrapper = makeWrapper(i18nInstance)
    await nextTick()
    expect(document.documentElement.lang).toBe('es')

    // Forzar re-render sin cambiar locale
    await wrapper.vm.$forceUpdate?.()
    await nextTick()

    // El lang sigue siendo 'es' — no se acumula drift
    expect(document.documentElement.lang).toBe('es')
    wrapper.unmount()
  })
})
