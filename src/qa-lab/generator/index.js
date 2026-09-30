// Generador de paginas del QA Lab: generatePage(seed) es una funcion pura y determinista.
// Devuelve una descripcion JSON-serializable (sin textos: los textos salen de i18n segun idioma).
import { createRng } from './prng.js'
import { THEMES } from './themes.js'
import { TEMPLATES } from '../templates/registry.js'
import { BUGS, compatibleBugs } from '../bugs/catalog.js'

export const MIN_BUGS = 3
export const MAX_BUGS = 7

export function generatePage(seed) {
  const rng = createRng(seed)
  const template = rng.pick(TEMPLATES)
  const theme = rng.pick(THEMES)

  const style = {
    hue: (theme.hue + rng.int(-18, 18) + 360) % 360,
    font: theme.font,
    radius: theme.radius + rng.int(0, 4),
    header: rng.pick(['bar', 'banner', 'minimal']),
    density: rng.pick(['cozy', 'compact']),
    width: rng.pick([760, 880, 1000]),
  }
  const brandIdx = rng.int(0, 2)
  const content = template.generate(rng)

  // Solo bugs compatibles con la plantilla; 3..7 (acotado por los compatibles).
  const pool = rng.shuffle(compatibleBugs(template.id))
  const count = Math.min(rng.int(MIN_BUGS, MAX_BUGS), pool.length)
  const chosen = new Set(pool.slice(0, count).map((b) => b.id))
  const bugs = BUGS.filter((b) => chosen.has(b.id)).map((b) => b.id) // orden estable del catalogo

  return { seed: String(seed), templateId: template.id, themeId: theme.id, brandIdx, style, content, bugs }
}
