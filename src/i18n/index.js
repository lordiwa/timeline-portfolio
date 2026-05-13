// src/i18n/index.js
//
// Source: vue-i18n.intlify.dev/guide/migration/breaking11 [CITED]
//         + vue-i18n.intlify.dev/guide/advanced/composition [CITED]
//
// Decisions baked in:
//   - legacy: false (mandatory v11 — I18N-01)
//   - fallbackLocale: 'en' (I18N-06)
//   - missingHandler con marker dev (Open-Q2-D)
//   - locale inicial: localStorage > navigator.language > 'es' (D2-09)

import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'

const STORAGE_KEY = 'portfolio.locale'

export function resolveInitialLocale() {
  // 1. localStorage (toggle previo del usuario)
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'es' || stored === 'en') return stored

  // 2. navigator.language (auto-detect primer visit — D2-09)
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  if (nav) return 'en'

  // 3. Final fallback (edge case: navigator.language vacío)
  return 'es'
}

export const i18n = createI18n({
  legacy: false,                       // I18N-01 mandatory
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',                // I18N-06
  messages: { en, es },
  missingWarn: import.meta.env.DEV,    // log misses solo en dev
  fallbackWarn: false,                 // silencioso en prod (key cae a 'en')
  missing: (locale, key) => {
    // Open-Q2-D — visible marker en dev, silent key raw en prod.
    if (import.meta.env.DEV) {
      console.warn(`[i18n missing] ${locale}/${key}`)
      return `[missing: ${key}]`
    }
    return key  // prod: render the key path itself, no marker pollution
  },
})

// Helper para persistir la elección del usuario entre sesiones.
// Consumido por LangToggle.vue (W1) y exportable por cualquier consumidor.
export function persistLocale(newLocale) {
  localStorage.setItem(STORAGE_KEY, newLocale)
}
