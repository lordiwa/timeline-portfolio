// Fechas puras del lab (sin reloj ni zona de la maquina). Los bugs de fecha viven aca, un solo punto cada uno.
import { createClock } from '../services/clock.js'

const pad = (n) => String(n).padStart(2, '0')

/**
 * 'YYYY-MM-DD' -> 'DD/MM/YYYY' leyendo las partes tal cual (correcto: no hay conversion de zona).
 * shift (bug 'date-timezone-shift'): toma la fecha como medianoche UTC y la muestra en la zona simulada `tz`
 * (minutos, p. ej. -300): con offsets negativos queda un dia antes; si no cae en otro dia, se fuerza un dia antes.
 * Con tz=0 sigue la regla: ya no devuelve la misma fecha.
 */
export function formatDate(iso, { tz = 0, shift = false } = {}) {
  const [y, m, d] = String(iso).split('-').map(Number)
  if (!shift) return `${pad(d)}/${pad(m)}/${y}`
  const clock = createClock({ tzOffsetMinutes: tz })
  let l = clock.local(Date.UTC(y, m - 1, d))
  // Garantia del bug: la fecha mostrada NUNCA es la guardada; si la zona no la corre (offset >= 0), se fuerza un dia antes.
  if (l.year === y && l.month === m && l.day === d) l = clock.local(Date.UTC(y, m - 1, d - 1))
  return `${pad(l.day)}/${pad(l.month)}/${l.year}`
}

/**
 * Antiguedad de un comentario como clave i18n + n. Correcto: minutos hasta 59 y despues horas enteras.
 * wrong (bug 'relative-time-wrong'): muestra solo el resto de dividir por 60, siempre en minutos.
 */
export function relTime(minutes, { wrong = false } = {}) {
  if (wrong) return { key: 'article.minutesAgo', n: minutes % 60 }
  return minutes < 60 ? { key: 'article.minutesAgo', n: minutes } : { key: 'article.hoursAgo', n: Math.floor(minutes / 60) }
}
