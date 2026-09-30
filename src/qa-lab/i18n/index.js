import { createI18n } from 'vue-i18n'
import es from './es.json'
import en from './en.json'

export const LOCALES = ['es', 'en']

export function detectLocale(search, navLang = '') {
  const fromUrl = new URLSearchParams(search).get('lang')
  if (LOCALES.includes(fromUrl)) return fromUrl
  return String(navLang).toLowerCase().startsWith('es') ? 'es' : 'en'
}

// Instancia propia del lab: no comparte mensajes con el i18n del portafolio.
export function createLabI18n(locale) {
  return createI18n({ legacy: false, locale, fallbackLocale: 'es', messages: { es, en } })
}
