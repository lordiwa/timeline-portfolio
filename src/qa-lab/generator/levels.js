// Niveles de dificultad. El nivel controla la cantidad de paginas, la cantidad de bugs y la sutileza
// (que dificultad de bug se prefiere al sortear). Rangos aprobados por Rafael el 2026-10-01 ("Mas duro").
// Cuando el catalogo no alcanza para el rango (bugs unicos por id, acotados a las paginas presentes),
// la cantidad se acota al pool compatible: ver generateSite().
export const LEVELS = ['junior', 'semi', 'senior']
export const DEFAULT_LEVEL = 'semi'

export const LEVEL_CONFIG = {
  junior: { pages: [4, 5], bugs: [4, 6], weights: { easy: 3, medium: 2, hard: 0 } }, // sin bugs dificiles
  semi: { pages: [6, 8], bugs: [7, 10], weights: { easy: 1, medium: 2, hard: 1 } },
  senior: { pages: [8, 12], bugs: [10, 16], weights: { easy: 0.5, medium: 1.5, hard: 3 } }, // prefiere los dificiles
}

export function normalizeLevel(level) {
  return LEVELS.includes(level) ? level : DEFAULT_LEVEL
}
