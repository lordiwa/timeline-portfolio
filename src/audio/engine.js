// src/audio/engine.js
// Motor de audio procedural — singleton AudioContext para todo el proyecto.
//
// CONTRATO PRM:
//   La música NO se desactiva por prefers-reduced-motion (es sonido, no animación visual).
//   Los SFX ligados a animaciones que PRM elimina NO deben sonar: quien invoca el SFX
//   es responsable de chequear PRM antes de llamar (el motor no conoce el contexto visual).
//
// Reglas de unlock:
//   Los browsers bloquean AudioContext hasta el primer gesto de usuario.
//   `unlock()` DEBE llamarse desde un handler de gesto (click, keydown, etc.).
//   El BootScreen es el punto de entrada canónico de unlock en este proyecto.

const STORAGE_KEY = 'rm-sound'

let _ctx = null
let _masterGain = null
let _unlocked = false
let _visibilityWired = false

/**
 * Crea el AudioContext y el master GainNode si no existen.
 * No reproduce nada — solo inicializa la cadena.
 * @returns {{ ctx: AudioContext, masterGain: GainNode }}
 */
function ensureContext() {
  if (_ctx) return { ctx: _ctx, masterGain: _masterGain }

  _ctx = new AudioContext()
  _masterGain = _ctx.createGain()
  _masterGain.gain.value = isMuted() ? 0 : 1
  _masterGain.connect(_ctx.destination)

  // Suspender cuando el tab queda en background; reanudar al volver.
  // Solo activa si ya está unlocked — antes del unlock el contexto está
  // suspended de todas formas y lo reanudará unlock().
  if (!_visibilityWired) {
    _visibilityWired = true
    document.addEventListener('visibilitychange', () => {
      if (!_ctx || !_unlocked) return
      if (document.hidden) {
        _ctx.suspend()
      } else if (!isMuted()) {
        _ctx.resume()
      }
    })
  }

  return { ctx: _ctx, masterGain: _masterGain }
}

/**
 * Desbloquea el AudioContext. Debe llamarse desde un handler de gesto de usuario.
 * Idempotente: si ya está unlocked, no hace nada.
 * @returns {Promise<void>}
 */
async function unlock() {
  const { ctx } = ensureContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  _unlocked = true
}

/**
 * Silencia o dessilencia el master con rampa corta (50ms — evita clicks de audio).
 * Persiste la preferencia en localStorage clave `rm-sound`.
 * @param {boolean} bool — true = silenciar
 */
function setMuted(bool) {
  const { ctx, masterGain } = ensureContext()
  const now = ctx.currentTime
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setValueAtTime(masterGain.gain.value, now)
  masterGain.gain.setTargetAtTime(bool ? 0 : 1, now, 0.05)
  localStorage.setItem(STORAGE_KEY, bool ? 'off' : 'on')
}

/** @returns {boolean} */
function isMuted() {
  return localStorage.getItem(STORAGE_KEY) === 'off'
}

/** @returns {boolean} */
function isUnlocked() {
  return _unlocked
}

/** @returns {AudioContext} */
function getContext() {
  return ensureContext().ctx
}

/** @returns {GainNode} */
function getMasterGain() {
  return ensureContext().masterGain
}

/**
 * Reset para tests — restaura el estado de módulo a limpio.
 * NO llamar en producción.
 */
export function _reset() {
  _ctx = null
  _masterGain = null
  _unlocked = false
  _visibilityWired = false
}

export const engine = {
  ensureContext,
  unlock,
  setMuted,
  isMuted,
  isUnlocked,
  getContext,
  getMasterGain,
}
