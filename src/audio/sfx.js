// src/audio/sfx.js
// SFX sintetizados on-demand con Web Audio API.
// Cero archivos de audio — todo es síntesis procedural.
//
// Cada función verifica que el engine esté unlocked antes de sonar.
// PRM: quien invoca decide si llamar o no (el engine no sabe de PRM).
//
// Importa engine lazy para evitar inicialización anticipada del AudioContext.

import { engine } from './engine.js'

/** @returns {{ ctx: AudioContext, masterGain: GainNode } | null} */
function _prep() {
  if (!engine.isUnlocked() || engine.isMuted()) return null
  return engine.ensureContext()
}

// ─── Utilidades internas ───────────────────────────────────────────────────

function _osc(ctx, type, freq, dest, startTime, endTime, peakGain = 1) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.002)
  g.gain.linearRampToValueAtTime(0, endTime)
  g.connect(dest)

  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  osc.start(startTime)
  osc.stop(endTime + 0.01)
}

function _noise(ctx, dest, startTime, endTime, filterFreq = 4000, peakGain = 0.5) {
  const bufLen = Math.ceil(ctx.sampleRate * (endTime - startTime + 0.05))
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = filterFreq
  filter.Q.value = 1

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, startTime)
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.002)
  g.gain.linearRampToValueAtTime(0, endTime)

  src.connect(filter)
  filter.connect(g)
  g.connect(dest)

  src.start(startTime)
  src.stop(endTime + 0.01)
}

// ─── SFX públicos ─────────────────────────────────────────────────────────

/**
 * POST beep de BIOS — square 880Hz, 120ms.
 * Llamar DESPUÉS de engine.unlock().
 */
export function beep() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  _osc(ctx, 'square', 880, masterGain, t, t + 0.12, 0.4)
}

/**
 * Click de teclado mecánico — noise burst corto filtrado.
 */
export function keyclick() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  _noise(ctx, masterGain, t, t + 0.015, 3000, 0.25)
}

/**
 * Click de UI genérico — tono breve (sine 440Hz, 40ms).
 */
export function uiClick() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  _osc(ctx, 'sine', 440, masterGain, t, t + 0.04, 0.25)
}

/**
 * Hover de UI muy sutil — sine 800Hz, 20ms, volumen mínimo.
 */
export function uiHover() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  _osc(ctx, 'sine', 800, masterGain, t, t + 0.02, 0.08)
}

/**
 * Cristal rompiéndose — sine descendente con detune (ch3 ventana rota).
 * Glide de 1400Hz → 280Hz en 1.2s con vibrato suave al final.
 */
export function crystal() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  const dur = 1.2

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  g.connect(masterGain)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1400, t)
  osc.frequency.exponentialRampToValueAtTime(280, t + dur)
  osc.connect(g)
  osc.start(t)
  osc.stop(t + dur + 0.05)

  // Segundo harmónico para textura de cristal
  const osc2 = ctx.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(2100, t)
  osc2.frequency.exponentialRampToValueAtTime(450, t + dur * 0.7)
  const g2 = ctx.createGain()
  g2.gain.setValueAtTime(0.15, t)
  g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7)
  osc2.connect(g2)
  g2.connect(masterGain)
  osc2.start(t)
  osc2.stop(t + dur * 0.7)
}

/**
 * Whoosh — noise con filtro barrido de high → low en 0.6s.
 */
export function whoosh() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  const dur = 0.6

  const bufLen = Math.ceil(ctx.sampleRate * (dur + 0.1))
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(6000, t)
  filter.frequency.exponentialRampToValueAtTime(300, t + dur)
  filter.Q.value = 2

  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(0.35, t + 0.05)
  g.gain.linearRampToValueAtTime(0, t + dur)

  src.connect(filter)
  filter.connect(g)
  g.connect(masterGain)
  src.start(t)
  src.stop(t + dur + 0.1)
}

/**
 * Achievement — arpegio mayor rápido de 4 notas (C5 E5 G5 C6).
 */
export function achievement() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  const t = ctx.currentTime
  const step = 0.07
  const freqs = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6

  freqs.forEach((freq, i) => {
    _osc(ctx, 'square', freq, masterGain, t + i * step, t + i * step + 0.15, 0.25)
  })
}

// ─── DTMF — frecuencias por dígito ────────────────────────────────────────

const DTMF_ROWS = [697, 770, 852, 941]
const DTMF_COLS = [1209, 1336, 1477, 1633]
const DTMF_MAP = {
  '1': [0, 0], '2': [0, 1], '3': [0, 2], 'A': [0, 3],
  '4': [1, 0], '5': [1, 1], '6': [1, 2], 'B': [1, 3],
  '7': [2, 0], '8': [2, 1], '9': [2, 2], 'C': [2, 3],
  '*': [3, 0], '0': [3, 1], '#': [3, 2], 'D': [3, 3],
}

/**
 * Marcación por tonos DTMF — simula un módem marcando.
 * @param {string} digits — ej. "5552436424" (555-GEOCITIES reducido)
 */
export function modemDial(digits = '5556432489') {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  let t = ctx.currentTime + 0.05

  const toneDur = 0.1
  const pauseDur = 0.05

  for (const ch of digits) {
    const map = DTMF_MAP[ch]
    if (!map) { t += pauseDur; continue }

    const [row, col] = map
    const f1 = DTMF_ROWS[row]
    const f2 = DTMF_COLS[col]

    _osc(ctx, 'sine', f1, masterGain, t, t + toneDur, 0.25)
    _osc(ctx, 'sine', f2, masterGain, t, t + toneDur, 0.25)
    t += toneDur + pauseDur
  }
}

/**
 * Handshake de módem — secuencia de tonos + ruido carrier filtrado que se desvanece.
 * Total: ~3.5s
 */
export function modemHandshake() {
  const r = _prep()
  if (!r) return
  const { ctx, masterGain } = r
  let t = ctx.currentTime + 0.05

  // Fase 1: tonos de negociación (~1s)
  const handshakeTones = [2100, 1300, 2100, 1300, 980]
  handshakeTones.forEach((freq, i) => {
    const start = t + i * 0.2
    _osc(ctx, 'sine', freq, masterGain, start, start + 0.18, 0.3)
  })
  t += handshakeTones.length * 0.2 + 0.1

  // Fase 2: ruido carrier filtrado (bandpass ~1800Hz) que sube y luego se desvanece (~2s)
  const carrierDur = 2.0
  const bufLen = Math.ceil(ctx.sampleRate * carrierDur)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  filter.Q.value = 3

  const carrierGain = ctx.createGain()
  carrierGain.gain.setValueAtTime(0, t)
  carrierGain.gain.linearRampToValueAtTime(0.35, t + 0.2)
  carrierGain.gain.setValueAtTime(0.35, t + carrierDur - 0.5)
  carrierGain.gain.linearRampToValueAtTime(0, t + carrierDur)

  src.connect(filter)
  filter.connect(carrierGain)
  carrierGain.connect(masterGain)
  src.start(t)
  src.stop(t + carrierDur + 0.05)
}
