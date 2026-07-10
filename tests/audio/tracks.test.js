// tests/audio/tracks.test.js
// Verifica la shape válida de los 7 temas de era.
// No testea reproducción — solo que la estructura de datos es correcta.

import { describe, it, expect } from 'vitest'
import { TRACKS } from '@/audio/tracks'

const REQUIRED_VOICES = ['pulse', 'tri', 'saw', 'noise', 'sine']

describe('TRACKS — estructura de datos', () => {
  it('T1: TRACKS es un array de exactamente 7 elementos', () => {
    expect(Array.isArray(TRACKS)).toBe(true)
    expect(TRACKS).toHaveLength(7)
  })

  it('T2: cada track tiene bpm, loopBeats y channels', () => {
    TRACKS.forEach((track, i) => {
      expect(track, `TRACKS[${i}] debe tener bpm`).toHaveProperty('bpm')
      expect(track, `TRACKS[${i}] debe tener loopBeats`).toHaveProperty('loopBeats')
      expect(track, `TRACKS[${i}] debe tener channels`).toHaveProperty('channels')
      expect(typeof track.bpm, `TRACKS[${i}].bpm debe ser number`).toBe('number')
      expect(typeof track.loopBeats, `TRACKS[${i}].loopBeats debe ser number`).toBe('number')
      expect(Array.isArray(track.channels), `TRACKS[${i}].channels debe ser array`).toBe(true)
      expect(track.channels.length, `TRACKS[${i}].channels no debe estar vacío`).toBeGreaterThan(0)
    })
  })

  it('T3: cada channel tiene voice, gainDb y notes (array)', () => {
    TRACKS.forEach((track, trackIdx) => {
      track.channels.forEach((ch, chIdx) => {
        const label = `TRACKS[${trackIdx}].channels[${chIdx}]`
        expect(ch, `${label} voice`).toHaveProperty('voice')
        expect(ch, `${label} gainDb`).toHaveProperty('gainDb')
        expect(ch, `${label} notes`).toHaveProperty('notes')
        expect(REQUIRED_VOICES, `${label} voice válido`).toContain(ch.voice)
        expect(typeof ch.gainDb, `${label} gainDb number`).toBe('number')
        expect(Array.isArray(ch.notes), `${label} notes array`).toBe(true)
      })
    })
  })

  it('T4: cada note tiene t (beat), dur, midi (number|null) y vel', () => {
    TRACKS.forEach((track, trackIdx) => {
      track.channels.forEach((ch, chIdx) => {
        ch.notes.forEach((note, noteIdx) => {
          const label = `TRACKS[${trackIdx}].channels[${chIdx}].notes[${noteIdx}]`
          expect(note, `${label} t`).toHaveProperty('t')
          expect(note, `${label} dur`).toHaveProperty('dur')
          expect(note, `${label} midi`).toHaveProperty('midi')
          expect(note, `${label} vel`).toHaveProperty('vel')
          expect(typeof note.t, `${label} t number`).toBe('number')
          expect(typeof note.dur, `${label} dur number`).toBe('number')
          expect(note.vel, `${label} vel 0-1`).toBeGreaterThan(0)
          expect(note.vel, `${label} vel <= 1`).toBeLessThanOrEqual(1)
          // midi puede ser null (silencio) o un número entero positivo
          if (note.midi !== null) {
            expect(typeof note.midi, `${label} midi number`).toBe('number')
            expect(note.midi, `${label} midi >= 21 (MIDI A0)`).toBeGreaterThanOrEqual(21)
            expect(note.midi, `${label} midi <= 127`).toBeLessThanOrEqual(127)
          }
        })
      })
    })
  })

  it('T5: bpm es razonable (20–300) y loopBeats > 0', () => {
    TRACKS.forEach((track, i) => {
      expect(track.bpm, `TRACKS[${i}].bpm >= 20`).toBeGreaterThanOrEqual(20)
      expect(track.bpm, `TRACKS[${i}].bpm <= 300`).toBeLessThanOrEqual(300)
      expect(track.loopBeats, `TRACKS[${i}].loopBeats > 0`).toBeGreaterThan(0)
    })
  })

  it('T6: ch0 tiene bpm=60 y ch2 tiene bpm=140 (eras correctas)', () => {
    expect(TRACKS[0].bpm).toBe(60)
    expect(TRACKS[2].bpm).toBe(140)
  })

  it('T7: ch6 tiene canal saw con nota drone y canal con sparkles generativos (prob)', () => {
    const ch6 = TRACKS[6]
    const sawChannel = ch6.channels.find(c => c.voice === 'saw')
    expect(sawChannel).toBeTruthy()
    expect(sawChannel.notes.length).toBeGreaterThan(0)

    const sparkleChannel = ch6.channels.find(c =>
      c.notes.some(n => n.prob !== undefined)
    )
    expect(sparkleChannel).toBeTruthy()
    // Al menos algunos sparkles tienen prob < 1 (no suenan siempre)
    const probNotes = sparkleChannel.notes.filter(n => n.prob !== undefined)
    expect(probNotes.length).toBeGreaterThan(0)
    expect(probNotes.every(n => n.prob > 0 && n.prob <= 1)).toBe(true)
  })

  it('T8: ch4 tiene canal saw con detune (synthwave pads)', () => {
    const ch4 = TRACKS[4]
    const padChannel = ch4.channels.find(c => c.voice === 'saw' && c.detune)
    expect(padChannel).toBeTruthy()
    expect(padChannel.detune).toBeGreaterThan(0)
  })
})
