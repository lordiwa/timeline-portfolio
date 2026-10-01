import { createI18n } from 'vue-i18n'
import es from './es.json'
import en from './en.json'
import { THEME_PACKS } from '../themes/index.js'

export const LOCALES = ['es', 'en']

export function detectLocale(search, navLang = '') {
  const fromUrl = new URLSearchParams(search).get('lang')
  if (LOCALES.includes(fromUrl)) return fromUrl
  return String(navLang).toLowerCase().startsWith('es') ? 'es' : 'en'
}

// Nombre de cada tema (para el solucionario): sale de los packs, no se duplica en los json.
const themeName = (l) => Object.fromEntries(THEME_PACKS.map((p) => [p.id, p.name[l]]))

// Instancia propia del lab: no comparte mensajes con el i18n del portafolio.
export function createLabI18n(locale) {
  return createI18n({ legacy: false, locale, fallbackLocale: 'es', messages: { es: { ...es, themeName: themeName('es') }, en: { ...en, themeName: themeName('en') } } })
}
