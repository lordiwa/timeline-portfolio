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

/** Errata determinista: intercambia dos letras distintas y contiguas de la 1a palabra donde se pueda.
 *  Invariante: el resultado SIEMPRE difiere del original. */
export function withTypo(text) {
  for (const m of text.matchAll(/[\p{L}]{3,}/gu)) {
    const w = m[0]
    for (let i = 1; i < w.length - 1; i++) {
      if (w[i] !== w[i + 1]) {
        const typo = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2)
        return text.slice(0, m.index) + typo + text.slice(m.index + w.length)
      }
    }
  }
  return text + text.slice(-1) // sin par de letras distintas: duplica la ultima
}
