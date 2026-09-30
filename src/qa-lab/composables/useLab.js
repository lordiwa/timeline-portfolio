// Acceso de los componentes del sitio generado a: pagina, flags de bugs, i18n y toast.
import { inject, provide } from 'vue'
import { useI18n } from 'vue-i18n'

const PAGE_KEY = Symbol('qaPage')
const BUGS_KEY = Symbol('qaBugs')
const TOAST_KEY = Symbol('qaToast')

export function provideLab(page, bugSet, toast) {
  provide(PAGE_KEY, page)
  provide(BUGS_KEY, bugSet)
  provide(TOAST_KEY, toast)
}

export function useLab() {
  const page = inject(PAGE_KEY)
  const bugSet = inject(BUGS_KEY)
  const toast = inject(TOAST_KEY)
  const { t, locale } = useI18n()
  /** Consulta de flag: el unico camino por el que un componente activa un bug. */
  const has = (id) => bugSet.has(id)
  /** t() que, con el bug 'untranslated', devuelve el texto en el OTRO idioma. */
  const tBug = (key, params = {}) =>
    has('untranslated') ? t(key, params, { locale: locale.value === 'es' ? 'en' : 'es' }) : t(key, params)
  const tt = (key, params = {}) => t(`theme.${page.themeId}.${key}`, params)
  return { page, has, t, tBug, tt, toast, locale }
}

/** Errata determinista: intercambia las letras de la 1a palabra de >=4 letras. */
export function withTypo(text) {
  return text.replace(/\p{L}{4,}/u, (w) => w[0] + w[2] + w[1] + w.slice(3))
}
