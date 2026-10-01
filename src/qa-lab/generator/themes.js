// Temas del generador = los content packs de src/qa-lab/themes/ (TASK-048: 63 temas, es/en, dato puro).
// Elegir un tema es elegir un pack; el contenido localizado lo resuelve content/index.js.
import { THEME_PACKS } from '../themes/index.js'

export const THEMES = THEME_PACKS
export const THEME_IDS = THEMES.map((t) => t.id)
