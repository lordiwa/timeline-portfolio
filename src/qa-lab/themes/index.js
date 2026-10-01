// Registro de content packs de temas del QA Lab (TASK-048). Dato puro: lo elige generator/themes.js y lo lee content/index.js.
import { everyday } from './everyday.js'
import { fantasy } from './fantasy.js'
import { scifi } from './scifi.js'
import { absurd } from './absurd.js'

export { validateTheme, validateField, FAMILIES } from './schema.js'

export const THEME_PACKS = [...everyday, ...fantasy, ...scifi, ...absurd]

const BY_ID = new Map(THEME_PACKS.map((t) => [t.id, t]))

/** Devuelve el pack con ese id, o undefined si no existe. */
export function getThemePack(id) {
  return BY_ID.get(id)
}
