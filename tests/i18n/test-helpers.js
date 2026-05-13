// tests/i18n/test-helpers.js
// Helper exportable para montar componentes Vue con el plugin vue-i18n en tests.
//
// Uso:
//   import { createTestI18n } from '../i18n/test-helpers.js'
//   const i18n = createTestI18n({ locale: 'es' })
//   mount(Component, { global: { plugins: [i18n] } })
//
// El helper carga los mensajes desde los JSON de producción para que los tests
// reflejen las keys reales y el parity.test.js siga siendo la fuente de verdad.

import { createI18n } from 'vue-i18n'
import es from '@/i18n/es.json'
import en from '@/i18n/en.json'

/**
 * Crea una instancia i18n de prueba (Composition API, legacy:false).
 *
 * @param {{ locale?: 'es' | 'en' }} options
 * @returns {import('vue-i18n').I18n} instancia mutable — usar i18n.global.locale.value para cambiar locale en tests
 */
export function createTestI18n({ locale = 'es' } = {}) {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { es, en },
  })
}
