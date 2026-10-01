// Incompatibilidades entre bugs (no co-activar) y seleccion del set de un sitio.
// El catalogo declara `excludes` (simetrico) y `groups`; aca viven los limites por grupo y el sorteo.
import { LEVEL_CONFIG } from './levels.js'

/** Maximo de bugs de un mismo grupo por sitio. */
export const GROUP_MAX = { submit: 1, 'cart-missing-item': 1, 'list-paging': 2 }

/** `bug` puede sumarse a `chosen` sin romper un `excludes` ni el maximo de ningun grupo. */
export function compatible(chosen, bug) {
  if (chosen.some((c) => (c.excludes || []).includes(bug.id) || (bug.excludes || []).includes(c.id))) return false
  return (bug.groups || []).every((g) => chosen.filter((c) => (c.groups || []).includes(g)).length < GROUP_MAX[g])
}

/** Pares o grupos prohibidos presentes en una lista de ids (vacio = el set es valido). Los usan los tests. */
export function violations(bugs) {
  const out = []
  for (const b of bugs) for (const o of bugs) if (b.id < o.id && ((b.excludes || []).includes(o.id) || (o.excludes || []).includes(b.id))) out.push(`${b.id} x ${o.id}`)
  for (const [g, max] of Object.entries(GROUP_MAX)) if (bugs.filter((b) => (b.groups || []).includes(g)).length > max) out.push(`grupo ${g} > ${max}`)
  return out
}

function weightedPick(rng, items, weightOf) {
  const sum = items.reduce((s, it) => s + weightOf(it), 0)
  let r = rng.next() * sum
  for (const it of items) {
    r -= weightOf(it)
    if (r < 0) return it
  }
  return items[items.length - 1]
}

/**
 * Elige `count` bugs del pool respetando incompatibilidades y las cuotas del nivel (LEVEL_CONFIG):
 *   1. intermitentes (senior: 1-2), 2. entre paginas (minimo del nivel), 3. minimo por dificultad (hard -> medium -> easy),
 *   4. relleno ponderado hasta `count` sin pasar el maximo de cada dificultad (si las cuotas no dan para `count`, el sitio
 *   queda con menos bugs pero dentro del rango), 5. solo si falta el MINIMO del rango, relleno sin tope de dificultad.
 * Las exclusiones, los grupos, el tope de intermitentes y el de entre-paginas nunca se relajan.
 */
export function selectBugs(rng, pool, level, count) {
  const cfg = LEVEL_CONFIG[level]
  const chosen = []
  const n = (pred) => chosen.filter(pred).length
  const inter = () => n((b) => b.intermittent)
  const cross = () => n((b) => b.crossPage)
  const canAdd = (b, relax) =>
    chosen.length < count && !chosen.includes(b) && compatible(chosen, b) &&
    (!b.intermittent || inter() < cfg.intermittent[1]) &&
    (!b.crossPage || cross() < cfg.cross[1]) &&
    (relax || n((c) => c.difficulty === b.difficulty) < cfg.quota[b.difficulty][1])
  const pickFrom = (pred, relax = false) => {
    const cands = pool.filter((b) => pred(b) && canAdd(b, relax))
    if (!cands.length) return false
    chosen.push(weightedPick(rng, cands, (b) => cfg.weights[b.difficulty] || 0.1))
    return true
  }

  const interTarget = cfg.intermittent[1] > 0 ? rng.int(cfg.intermittent[0], cfg.intermittent[1]) : 0
  while (inter() < interTarget && pickFrom((b) => b.intermittent)) { /* sigue */ }
  while (cross() < cfg.cross[0] && pickFrom((b) => b.crossPage)) { /* sigue */ }
  for (const d of ['hard', 'medium', 'easy']) {
    while (n((b) => b.difficulty === d) < cfg.quota[d][0] && pickFrom((b) => b.difficulty === d)) { /* sigue */ }
  }
  while (chosen.length < count && pickFrom(() => true)) { /* sigue */ }
  // Las cuotas por dificultad ceden SOLO si no alcanzan el minimo del rango de bugs del nivel (el rango es restriccion dura).
  while (chosen.length < Math.min(count, cfg.bugs[0]) && pickFrom(() => true, true)) { /* sigue */ }
  return chosen
}
