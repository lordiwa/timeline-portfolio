// Niveles de dificultad. El nivel controla la cantidad de paginas, la cantidad de bugs y la sutileza
// (que dificultad de bug se prefiere al sortear). Rangos aprobados por Rafael el 2026-10-01 ("Mas duro").
// Cuando el catalogo no alcanza para el rango (bugs unicos por id, acotados a las paginas presentes),
// la cantidad se acota al pool compatible: ver generateSite().
export const LEVELS = ['junior', 'semi', 'senior']
export const DEFAULT_LEVEL = 'semi'

// quota = cuotas por dificultad ([min, max]; el minimo es mejor esfuerzo en orden hard -> medium -> easy, el total
// del rango de bugs es restriccion dura); cross = bugs entre paginas / de estado ([min, max]);
// intermittent = bugs nth-* ([min, max]). Los intermitentes solo existen en senior (decision de Rafael 2026-10-01)
// y todos los bugs 'hard' son de nivel senior.
export const LEVEL_CONFIG = {
  junior: { pages: [4, 5], bugs: [4, 6], weights: { easy: 3, medium: 2, hard: 0 }, quota: { easy: [3, 4], medium: [1, 2], hard: [0, 0] }, cross: [0, 1], intermittent: [0, 0] }, // sin bugs dificiles
  semi: { pages: [6, 8], bugs: [7, 10], weights: { easy: 1, medium: 2, hard: 1 }, quota: { easy: [1, 3], medium: [5, 8], hard: [0, 0] }, cross: [1, Infinity], intermittent: [0, 0] },
  senior: { pages: [8, 12], bugs: [10, 16], weights: { easy: 0.5, medium: 1.5, hard: 3 }, quota: { easy: [1, 3], medium: [4, 7], hard: [4, 6] }, cross: [3, Infinity], intermittent: [1, 2] }, // prefiere los dificiles
}

export function normalizeLevel(level) {
  return LEVELS.includes(level) ? level : DEFAULT_LEVEL
}

/** 0 junior, 1 semi, 2 senior. Un bug de nivel X aparece en X y en los niveles superiores. */
export const levelRank = (level) => LEVELS.indexOf(normalizeLevel(level))
