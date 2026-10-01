// Descripcion de un bug para el solucionario de UN sitio. Los bugs de validacion afectan campos de los packs de tema
// (puede ser "Urgencia 1-5" o "Nombre del dragon"): su `template` se resuelve contra el campo real de la pagina del bug.
import { BUG_BY_ID } from './catalog.js'
import { formKeys } from '../generator/capabilities.js'
import { resolveContent } from '../content/index.js'
import { createLabI18n } from '../i18n/index.js'

/** Que campos de la pagina del bug afecta cada bug de validacion (los mismos que consulta checkField). */
const AFFECTED = {
  'email-no-at': (m) => m.type === 'email',
  'age-off-by-one': (m) => m.type === 'number',
  'password-off-by-one': (m) => m.type === 'password',
  'required-not-validated': (m) => m.nameLike && m.required,
}

const i18n = {}
const contents = new WeakMap() // site -> { es, en }
function contentOf(site, locale) {
  if (!contents.has(site)) contents.set(site, {})
  const byLocale = contents.get(site)
  if (!byLocale[locale]) byLocale[locale] = resolveContent(site, (i18n[locale] ||= createLabI18n(locale).global.t))
  return byLocale[locale]
}

/** Campos (content.field) que el bug `id` afecta en la pagina donde vive en este sitio, en el idioma `locale`. */
export function affectedFields(site, id, locale) {
  const test = AFFECTED[id]
  const page = site.bugPages[id]
  if (!test || !page) return []
  const c = contentOf(site, locale)
  return formKeys(site.data, page).filter((k) => test(site.data.fieldMeta[k])).map((k) => c.field(k))
}

/** Texto del bug en `locale`: el template con el campo real si el bug lo tiene; si no, su descripcion fija. */
export function describeBug(site, id, locale) {
  const bug = BUG_BY_ID[id]
  const template = bug.template?.[locale]
  const fields = template ? affectedFields(site, id, locale) : []
  if (!template || !fields.length) return bug.description[locale]
  const f = fields[0]
  const min = f.min ?? 0
  const params = { field: fields.map((x) => x.label).join(' / '), min, max: f.max ?? '', prev: min - 1 }
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k]))
}
