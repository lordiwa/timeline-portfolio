// Puntaje de un reporte contra los bugs activos de (seed, level). Funcion PURA, sin importar el catalogo:
// recibe un lookup de categorias por id (categoryOf) para no depender de su forma.
//
// Formula (documentada tambien en README.md):
//   - Acierto: finding con guessedBugId ∈ activeBugIds. Cada bug cuenta UNA sola vez; un segundo
//     finding sobre el mismo bug es "duplicado": ni acierto ni falso positivo.
//   - Medio acierto: finding SIN guessedBugId pero con guessedCategory igual a la categoria de un
//     bug activo todavia no consumido (por acierto o por otro medio acierto). Consume ese bug.
//   - Falso positivo: finding que apunta a un bug que NO esta activo (guessedBugId inexistente en la
//     semilla) o a una categoria sin bugs activos libres. Un finding sin ninguna pista
//     (guessedBugId y guessedCategory nulos) es "sin clasificar": no suma ni resta, porque el candidato
//     no afirmo nada verificable.
//   - missed: bugs activos sin acierto pleno (los medios aciertos tambien quedan listados aqui).
//   - score = round(100 * clamp((hits + 0.5*halfHits - 0.5*falsePositives) / activos, 0, 1)).
//     Sin bugs activos el score es 0 (no hay nada contra lo que puntuar).
//
// Limitacion: se calcula en el cliente; es manipulable. No es un puntaje confiable.

export function scoreReport({ activeBugIds = [], findings = [], categoryOf = () => null } = {}) {
  const active = [...new Set(activeBugIds)]
  const activeSet = new Set(active)
  const consumed = new Set()
  const hits = []
  const halfHits = []
  const falsePositives = []
  const duplicates = []
  const unclassified = []
  const pending = [] // findings solo con categoria: se resuelven despues de los aciertos plenos

  for (const f of findings) {
    if (f.guessedBugId) {
      if (!activeSet.has(f.guessedBugId)) falsePositives.push(f.id)
      else if (consumed.has(f.guessedBugId)) duplicates.push(f.id)
      else {
        consumed.add(f.guessedBugId)
        hits.push({ findingId: f.id, bugId: f.guessedBugId })
      }
    } else if (f.guessedCategory) pending.push(f)
    else unclassified.push(f.id)
  }

  for (const f of pending) {
    const bugId = active.find((id) => !consumed.has(id) && categoryOf(id) === f.guessedCategory)
    if (bugId) {
      consumed.add(bugId)
      halfHits.push({ findingId: f.id, bugId })
    } else falsePositives.push(f.id)
  }

  const hitIds = new Set(hits.map((h) => h.bugId))
  const missed = active.filter((id) => !hitIds.has(id))
  const raw = active.length ? (hits.length + 0.5 * halfHits.length - 0.5 * falsePositives.length) / active.length : 0
  const score = Math.round(100 * Math.min(1, Math.max(0, raw)))

  return {
    hits,
    falsePositives,
    missed,
    score,
    breakdown: {
      active: active.length,
      hits: hits.length,
      halfHits,
      falsePositives: falsePositives.length,
      missed: missed.length,
      duplicates,
      unclassified,
    },
  }
}
