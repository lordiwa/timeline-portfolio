// Reloj, zona horaria simulada y latencia: UNICO punto del lab que toca el tiempo real.
// Los componentes consultan estos servicios (via useSite().env) en lugar de Date.now(), new Date() o
// setTimeout directos; un test estatico (tests/qa-lab/site-infra.spec.js) lo exige.
//
//   clock.now()                  ms epoch (inyectable en tests)
//   clock.tzOffsetMinutes        offset simulado del sitio (p. ej. -300); NO es el de la maquina
//   clock.local(ms?)             { year, month, day, hour, minute, second } en la zona simulada
//   clock.viewerToday(ms?)       'YYYY-MM-DD' del dia civil del USUARIO (zona de la maquina del navegador). Es lo que usa la
//                                validacion de fechas de los formularios (noPast / noFuture): la zona SIMULADA del sitio queda
//                                solo para los bugs de fecha, nunca para validar bien. viewerOffsetMinutes (inyectable, como
//                                tzOffsetMinutes) reemplaza la zona de la maquina en los tests.
//   clock.setTimeout / clearTimeout   timers que resuelven el global en cada llamada (vi.useFakeTimers los controla)
//   latency.latencyMs(key, n)    latencia determinista de la n-esima request de `key` (80..600 ms)
//   latency.request(key, fn)     Promise que resuelve fn() tras latencyMs(key, n); n cuenta por `key`
import { hashString } from '../generator/prng.js'

export function createClock({ now = () => Date.now(), tzOffsetMinutes = 0, viewerOffsetMinutes } = {}) {
  const pad = (n) => String(n).padStart(2, '0')
  return {
    now,
    tzOffsetMinutes,
    viewerToday(ms = now()) {
      if (viewerOffsetMinutes != null) {
        const u = new Date(ms + viewerOffsetMinutes * 60000)
        return `${u.getUTCFullYear()}-${pad(u.getUTCMonth() + 1)}-${pad(u.getUTCDate())}`
      }
      const d = new Date(ms)
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    /** Partes de calendario en la zona horaria simulada (no la de la maquina). */
    local(ms = now()) {
      const d = new Date(ms + tzOffsetMinutes * 60000)
      return {
        year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(),
        hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds(),
      }
    },
    /** ms epoch a partir de partes de calendario en la zona simulada. */
    fromLocal({ year, month, day, hour = 0, minute = 0, second = 0 }) {
      return Date.UTC(year, month - 1, day, hour, minute, second) - tzOffsetMinutes * 60000
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
  }
}

/** Reloj del sistema (sin zona simulada): valor por defecto de los composables cuando no se inyecta otro. */
export const systemClock = createClock()

export function createLatency({ seed, clock = systemClock }) {
  const counts = {}
  const latencyMs = (key, n) => 80 + (hashString(`${seed}|latency|${key}|${n}`) % 521)
  return {
    latencyMs,
    /** Simula una request: resuelve con fn() tras la latencia determinista de su n-esima llamada. */
    request(key, fn = () => undefined) {
      counts[key] = (counts[key] || 0) + 1
      const ms = latencyMs(key, counts[key])
      return new Promise((resolve, reject) => {
        clock.setTimeout(() => { try { resolve(fn()) } catch (e) { reject(e) } }, ms)
      })
    },
    count: (key) => counts[key] || 0,
  }
}

export function createEnv({ seed, tzOffsetMinutes = 0, now, viewerOffsetMinutes } = {}) {
  const clock = createClock({ now, tzOffsetMinutes, viewerOffsetMinutes })
  return { clock, latency: createLatency({ seed, clock }) }
}
