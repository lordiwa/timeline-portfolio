// tests/i18n/locale-init.test.js
// Verifica la lógica de resolución de locale inicial y persistencia (D2-09).
//
// Cobertura (5 tests):
//   T1 — localStorage 'portfolio.locale' = 'en' → resolveInitialLocale() retorna 'en'
//   T2 — localStorage vacío + navigator.language 'es-EC' → retorna 'es'
//   T3 — localStorage vacío + navigator.language 'fr-CA' → retorna 'en'
//   T4 — localStorage vacío + navigator.language '' → retorna 'es' (fallback)
//   T5 — persistLocale('en') invoca localStorage.setItem('portfolio.locale', 'en')

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveInitialLocale, persistLocale } from '@/i18n'

const STORAGE_KEY = 'portfolio.locale'

describe('locale-init — resolveInitialLocale y persistLocale (D2-09)', () => {
  let originalNavigatorLanguage

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear()
    // Guardar el descriptor original de navigator.language
    originalNavigatorLanguage = Object.getOwnPropertyDescriptor(navigator, 'language')
  })

  afterEach(() => {
    localStorage.clear()
    // Restaurar navigator.language
    if (originalNavigatorLanguage) {
      Object.defineProperty(navigator, 'language', originalNavigatorLanguage)
    } else {
      // Si no había descriptor propio, intentar eliminar la propiedad propia (no siempre funciona)
      try {
        delete navigator.language
      } catch (_) { /* ignorar */ }
    }
    vi.restoreAllMocks()
  })

  function setNavigatorLanguage(lang) {
    Object.defineProperty(navigator, 'language', {
      configurable: true,
      get: () => lang,
    })
  }

  it('T1 — localStorage[portfolio.locale]=en → resolveInitialLocale() retorna en', () => {
    localStorage.setItem(STORAGE_KEY, 'en')
    expect(resolveInitialLocale()).toBe('en')
  })

  it('T2 — localStorage vacío + navigator.language es-EC → retorna es', () => {
    setNavigatorLanguage('es-EC')
    expect(resolveInitialLocale()).toBe('es')
  })

  it('T3 — localStorage vacío + navigator.language fr-CA → retorna en', () => {
    setNavigatorLanguage('fr-CA')
    expect(resolveInitialLocale()).toBe('en')
  })

  it('T4 — localStorage vacío + navigator.language vacío → retorna es (fallback final)', () => {
    setNavigatorLanguage('')
    expect(resolveInitialLocale()).toBe('es')
  })

  it('T5 — persistLocale(en) escribe portfolio.locale=en en localStorage', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    persistLocale('en')
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY, 'en')
  })
})
