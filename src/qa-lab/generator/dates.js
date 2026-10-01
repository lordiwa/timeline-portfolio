// Aritmetica de fechas pura del lab (sin Date, sin zona horaria de la maquina). El calendario es 2026 (sin bisiestos).
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** dayOffset 0..364 -> 'YYYY-MM-DD'. */
export function isoFromOffset(offset) {
  let d = ((offset % 365) + 365) % 365
  let m = 0
  while (d >= MONTH_DAYS[m]) {
    d -= MONTH_DAYS[m]
    m += 1
  }
  return `2026-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' -> offset 0..364 dentro de 2026 (otros anios se acotan al rango). */
export function isoToOffset(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  if (y < 2026) return 0
  if (y > 2026) return 364
  return MONTH_DAYS.slice(0, m - 1).reduce((s, n) => s + n, 0) + (d - 1)
}
