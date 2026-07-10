// src/audio/sequencer.js
// Scheduler Web Audio estándar — "A Tale of Two Clocks" (Chris Wilson pattern).
// Lookahead: 100ms. Timer: 25ms. Scheduling: ahead del currentTime del contexto.
//
// Voces soportadas:
//   pulse  — PeriodicWave cuadrada con duty cycle configurable (0.0–1.0)
//   tri    — OscillatorNode triangle
//   saw    — OscillatorNode sawtooth, con detune dual opcional para pads
//   noise  — AudioBufferSourceNode ruido blanco, para hats/percusión
//
// Formato de track:
//   { bpm, loopBeats, channels: [Channel] }
//
// Formato de channel:
//   { voice, duty?, detune?, filter?, lfo?, gainDb, attack?, decay?, notes: [Note] }
//
// Formato de note:
//   { t (beat), dur (beats), midi (MIDI note number o null=silencio), vel (0–1), prob? (0–1) }
//
// Notas con prob definida se saltan aleatoriamente — útil para ch6 destellos generativos.

const LOOKAHEAD_SECONDS = 0.1
const SCHEDULE_INTERVAL_MS = 25

// ─── Caché de PeriodicWave por (contextId, duty) ───────────────────────────
const _waveCache = new WeakMap()

function _getPulseWave(ctx, duty = 0.5) {
  if (!_waveCache.has(ctx)) _waveCache.set(ctx, new Map())
  const cache = _waveCache.get(ctx)
  const key = duty.toFixed(3)
  if (cache.has(key)) return cache.get(key)

  const harmonics = 64
  const real = new Float32Array(harmonics + 1)
  const imag = new Float32Array(harmonics + 1)
  for (let n = 1; n <= harmonics; n++) {
    imag[n] = (2 / (Math.PI * n)) * Math.sin(Math.PI * n * duty)
  }
  const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false })
  cache.set(key, wave)
  return wave
}

// ─── Buffer de ruido blanco (se regenera si cambia el contexto) ────────────
let _noiseBuffer = null
let _noiseCtx = null

function _getNoiseBuffer(ctx) {
  if (_noiseBuffer && _noiseCtx === ctx) return _noiseBuffer
  _noiseCtx = ctx
  const sampleRate = ctx.sampleRate
  const len = sampleRate * 2
  _noiseBuffer = ctx.createBuffer(1, len, sampleRate)
  const data = _noiseBuffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return _noiseBuffer
}

// ─── Conversión MIDI → frecuencia ──────────────────────────────────────────
function _midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// ─── Utilidad: dB → ganancia lineal ────────────────────────────────────────
function _dbToLinear(db) {
  return Math.pow(10, db / 20)
}

// ─── Clases ─────────────────────────────────────────────────────────────────

export class Sequencer {
  /**
   * @param {AudioContext} ctx
   * @param {AudioNode} destinationNode — normalmente el master GainNode del engine
   */
  constructor(ctx, destinationNode) {
    this.ctx = ctx
    /** GainNode propio del sequencer — permite fade independiente para crossfade */
    this.gainNode = ctx.createGain()
    this.gainNode.connect(destinationNode)
    this.gainNode.gain.value = 1

    this._track = null
    this._startTime = 0
    this._scheduledThrough = 0
    this._timerId = null
    this._running = false
  }

  /**
   * Inicia la reproducción del track.
   * @param {object} track — estructura { bpm, loopBeats, channels }
   */
  start(track) {
    this.stop()
    this._track = track
    this._startTime = this.ctx.currentTime + 0.05 // offset mínimo para evitar glitch inicial
    this._scheduledThrough = this._startTime
    this._running = true
    this._tick()
  }

  /** Detiene el scheduler. Las notas ya scheduled suenan hasta su stop time. */
  stop() {
    this._running = false
    if (this._timerId !== null) {
      clearTimeout(this._timerId)
      this._timerId = null
    }
    this._track = null
  }

  _tick() {
    if (!this._running) return
    this._scheduleAhead()
    this._timerId = setTimeout(() => this._tick(), SCHEDULE_INTERVAL_MS)
  }

  _scheduleAhead() {
    if (!this._track) return
    const now = this.ctx.currentTime
    const windowEnd = now + LOOKAHEAD_SECONDS

    if (windowEnd <= this._scheduledThrough) return

    const { bpm, loopBeats, channels } = this._track
    const secPerBeat = 60 / bpm
    const loopDur = loopBeats * secPerBeat

    // ¿En qué iteración del loop estamos?
    const elapsed = Math.max(0, now - this._startTime)
    const currentLoop = Math.floor(elapsed / loopDur)

    // Revisamos la iteración anterior, la actual y la siguiente para cubrir el lookahead.
    for (let loop = Math.max(0, currentLoop - 1); loop <= currentLoop + 2; loop++) {
      const loopStart = this._startTime + loop * loopDur

      for (const channel of channels) {
        for (const note of channel.notes) {
          const noteTime = loopStart + note.t * secPerBeat

          if (noteTime <= this._scheduledThrough) continue  // ya scheduled
          if (noteTime > windowEnd) continue                 // fuera de ventana
          if (note.midi === null) continue                   // silencio explícito

          // Probabilidad generativa (ch6 destellos)
          if (note.prob !== undefined && Math.random() > note.prob) continue

          this._playNote(note, channel, noteTime, secPerBeat)
        }
      }
    }

    this._scheduledThrough = windowEnd
  }

  /**
   * @param {object} note
   * @param {object} channel
   * @param {number} time — audio time absoluto de inicio
   * @param {number} secPerBeat
   */
  _playNote(note, channel, time, secPerBeat) {
    const ctx = this.ctx
    const freq = _midiToFreq(note.midi)
    const vel = note.vel ?? 1
    const durSeconds = note.dur * secPerBeat
    const peakGain = vel * _dbToLinear(channel.gainDb ?? 0)
    const attack = channel.attack ?? 0.005
    const decay = Math.min(channel.decay ?? durSeconds * 0.9, durSeconds)
    const stopTime = time + durSeconds + 0.02 // pequeño buffer post-nota

    // ─── Envelope gain ───────────────────────────────────────────────────
    const envGain = ctx.createGain()
    envGain.gain.setValueAtTime(0, time)
    envGain.gain.linearRampToValueAtTime(peakGain, time + attack)
    envGain.gain.linearRampToValueAtTime(0, time + attack + decay)

    // ─── Filtro opcional ─────────────────────────────────────────────────
    let filterNode = null
    if (channel.filter) {
      filterNode = ctx.createBiquadFilter()
      filterNode.type = 'lowpass'
      filterNode.frequency.value = channel.filter.freq ?? 1000
      filterNode.Q.value = channel.filter.Q ?? 1

      // LFO sobre frecuencia del filtro (opcional)
      if (channel.filter.lfo) {
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.value = channel.filter.lfo.rate ?? 0.5
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = channel.filter.lfo.depth ?? 200
        lfo.connect(lfoGain)
        lfoGain.connect(filterNode.frequency)
        lfo.start(time)
        lfo.stop(stopTime)
      }
    }

    // ─── Fuente de audio ─────────────────────────────────────────────────
    if (channel.voice === 'noise') {
      const src = ctx.createBufferSource()
      src.buffer = _getNoiseBuffer(ctx)
      src.loop = true
      const chain = filterNode ?? envGain
      src.connect(filterNode ? filterNode : envGain)
      if (filterNode) filterNode.connect(envGain)
      envGain.connect(this.gainNode)
      src.start(time)
      src.stop(stopTime)

    } else if (channel.voice === 'saw' && channel.detune) {
      // Dual sawtooth para pads (detune en cents)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sawtooth'
      osc1.frequency.value = freq
      osc1.detune.value = -channel.detune

      const osc2 = ctx.createOscillator()
      osc2.type = 'sawtooth'
      osc2.frequency.value = freq
      osc2.detune.value = channel.detune

      const mixGain = ctx.createGain()
      mixGain.gain.value = 0.5 // mezcla a 50/50

      osc1.connect(mixGain)
      osc2.connect(mixGain)

      if (filterNode) {
        mixGain.connect(filterNode)
        filterNode.connect(envGain)
      } else {
        mixGain.connect(envGain)
      }
      envGain.connect(this.gainNode)

      osc1.start(time); osc1.stop(stopTime)
      osc2.start(time); osc2.stop(stopTime)

    } else {
      // pulse, tri, saw (single), sine
      const osc = ctx.createOscillator()

      if (channel.voice === 'pulse') {
        osc.setPeriodicWave(_getPulseWave(ctx, channel.duty ?? 0.5))
      } else {
        osc.type = {
          tri: 'triangle',
          saw: 'sawtooth',
          sine: 'sine',
        }[channel.voice] ?? 'sine'
      }
      osc.frequency.value = freq

      if (filterNode) {
        osc.connect(filterNode)
        filterNode.connect(envGain)
      } else {
        osc.connect(envGain)
      }
      envGain.connect(this.gainNode)

      osc.start(time)
      osc.stop(stopTime)
    }
  }
}
