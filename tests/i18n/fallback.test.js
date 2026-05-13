// tests/i18n/fallback.test.js
// Verifica el comportamiento de fallback y missing handler (I18N-06 + Open-Q2-D).
//
// Cobertura (3 tests):
//   T1 — key existe en EN pero no en ES → t() con locale=es retorna el valor EN (fallbackLocale)
//   T2 — import.meta.env.DEV, key inexistente en ambos locales → missing handler retorna '[missing: foo.bar]'
//   T3 — import.meta.env.PROD (simulado), key inexistente → missing handler retorna 'foo.bar' raw

import { describe, it, expect, vi, afterEach } from 'vitest'
import { createI18n } from 'vue-i18n'

describe('i18n fallback y missing handler (I18N-06 + Open-Q2-D)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('T1 — key en EN pero no en ES → fallback a valor EN', () => {
    // Crear una instancia aislada con messages incompletos en ES
    const testI18n = createI18n({
      legacy: false,
      locale: 'es',
      fallbackLocale: 'en',
      fallbackWarn: false,
      missingWarn: false,
      messages: {
        en: { 'only-in-en': 'hello from EN' },
        es: {},
      },
    })
    const { t } = testI18n.global
    // Con locale es y fallbackLocale en, debe devolver el valor EN
    expect(t('only-in-en')).toBe('hello from EN')
  })

  it('T2 — DEV: key inexistente en ambos locales → missing handler retorna [missing: foo.bar]', () => {
    vi.stubEnv('DEV', true)
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const testI18n = createI18n({
      legacy: false,
      locale: 'es',
      fallbackLocale: 'en',
      fallbackWarn: false,
      missingWarn: false,
      messages: { en: {}, es: {} },
      missing: (locale, key) => {
        if (import.meta.env.DEV) {
          console.warn(`[i18n missing] ${locale}/${key}`)
          return `[missing: ${key}]`
        }
        return key
      },
    })

    const { t } = testI18n.global
    const result = t('foo.bar')
    expect(result).toBe('[missing: foo.bar]')
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('foo.bar'))
  })

  it('T3 — PROD: key inexistente → missing handler retorna foo.bar raw (sin marker)', () => {
    vi.stubEnv('DEV', false)

    const testI18n = createI18n({
      legacy: false,
      locale: 'es',
      fallbackLocale: 'en',
      fallbackWarn: false,
      missingWarn: false,
      messages: { en: {}, es: {} },
      missing: (locale, key) => {
        if (import.meta.env.DEV) {
          console.warn(`[i18n missing] ${locale}/${key}`)
          return `[missing: ${key}]`
        }
        return key
      },
    })

    const { t } = testI18n.global
    const result = t('foo.bar')
    // En prod: retorna la key raw, sin marcador [missing: ...]
    expect(result).toBe('foo.bar')
    expect(result).not.toContain('[missing:')
  })
})
