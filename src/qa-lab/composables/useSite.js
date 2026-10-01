// Acceso de las paginas del sitio a: sitio generado, bugs (flags), router, store, contenido, i18n y toast.
import { inject, provide } from 'vue'
import { useI18n } from 'vue-i18n'

const KEY = Symbol('qaSite')

/** ctx = { site, env, bugSet, route, router, store, content (computed), toast, nav } (nav.last: 'push' | 'back') */
export function provideSite(ctx) {
  provide(KEY, ctx)
}

export function useSite() {
  const ctx = inject(KEY)
  const { t, locale } = useI18n()
  /**
   * Consulta de flag: el UNICO camino por el que un componente activa un bug.
   * El bug esta activo en el sitio Y la pagina actual es aquella en la que se manifiesta
   * (site.bugPages[id]); asi el solucionario puede decir exactamente donde esta cada uno.
   */
  const has = (id) => ctx.bugSet.has(id) && ctx.site.bugPages[id] === ctx.route.value.type
  /**
   * Bugs intermitentes (nth-*): true en la N-esima accion hecha en la pagina del bug, con N = site.bugParams[id].n.
   * El contador vive en memoria (store.actions): se reinicia al recargar, no al navegar. Solo cuenta con el flag activo.
   */
  const nthHit = (id) => has(id) && ctx.store.bump(`nth:${id}`) ===ctx.site.bugParams[id].n
  /** t() que, con el bug 'untranslated', devuelve el texto en el OTRO idioma. */
  const tBug = (key, params = {}) =>
    has('untranslated') ? t(key, params, { locale: locale.value === 'es' ? 'en' : 'es' }) : t(key, params)
  /** Campo "objetivo" de los bugs de accesibilidad en la pagina actual. */
  const labelTarget = () => ctx.site.data.labelTargets[ctx.route.value.type]
  return { ...ctx, has, nthHit, t, tBug, locale, labelTarget }
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
