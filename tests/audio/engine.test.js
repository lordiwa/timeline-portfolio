// tests/audio/engine.test.js
// Tests unitarios del motor de audio (engine.js).
// El AudioContext está mockeado globalmente en tests/setup.js.
// engine._reset() restaura el estado de módulo entre tests.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { engine, _reset } from '@/audio/engine'

beforeEach(() => {
  // Resetear el singleton del engine y el mock de AudioContext
  _reset()
  MockAudioContext.reset()
  localStorage.clear()
})

afterEach(() => {
  _reset()
})

describe('engine — isMuted()', () => {
  it('T1: devuelve false cuando localStorage no tiene rm-sound', () => {
    localStorage.removeItem('rm-sound')
    expect(engine.isMuted()).toBe(false)
  })

  it('T2: devuelve true cuando localStorage tiene rm-sound = "off"', () => {
    localStorage.setItem('rm-sound', 'off')
    expect(engine.isMuted()).toBe(true)
  })

  it('T3: devuelve false cuando localStorage tiene rm-sound = "on"', () => {
    localStorage.setItem('rm-sound', 'on')
    expect(engine.isMuted()).toBe(false)
  })
})

describe('engine — isUnlocked()', () => {
  it('T4: devuelve false antes de unlock()', () => {
    expect(engine.isUnlocked()).toBe(false)
  })

  it('T5: devuelve true después de unlock()', async () => {
    await engine.unlock()
    expect(engine.isUnlocked()).toBe(true)
  })
})

describe('engine — unlock()', () => {
  it('T6: crea AudioContext y llama resume()', async () => {
    expect(MockAudioContext.instances).toHaveLength(0)
    await engine.unlock()
    expect(MockAudioContext.instances).toHaveLength(1)
    expect(MockAudioContext.instances[0].state).toBe('running')
  })

  it('T7: es idempotente — segunda llamada no crea segundo contexto', async () => {
    await engine.unlock()
    await engine.unlock()
    expect(MockAudioContext.instances).toHaveLength(1)
  })
})

describe('engine — setMuted()', () => {
  it('T8: setMuted(true) llama setTargetAtTime con valor 0 en master gain', async () => {
    await engine.unlock()
    const masterGain = engine.getMasterGain()
    engine.setMuted(true)
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0, expect.any(Number), 0.05)
  })

  it('T9: setMuted(false) llama setTargetAtTime con valor 1 en master gain', async () => {
    await engine.unlock()
    const masterGain = engine.getMasterGain()
    engine.setMuted(false)
    expect(masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(1, expect.any(Number), 0.05)
  })

  it('T10: setMuted(true) persiste "off" en localStorage clave rm-sound', async () => {
    await engine.unlock()
    engine.setMuted(true)
    expect(localStorage.getItem('rm-sound')).toBe('off')
  })

  it('T11: setMuted(false) persiste "on" en localStorage clave rm-sound', async () => {
    await engine.unlock()
    engine.setMuted(false)
    expect(localStorage.getItem('rm-sound')).toBe('on')
  })
})

describe('engine — ensureContext()', () => {
  it('T12: crea AudioContext lazy (solo al llamar)', () => {
    expect(MockAudioContext.instances).toHaveLength(0)
    engine.ensureContext()
    expect(MockAudioContext.instances).toHaveLength(1)
  })

  it('T13: devuelve el mismo contexto en llamadas sucesivas', () => {
    const { ctx: ctx1 } = engine.ensureContext()
    const { ctx: ctx2 } = engine.ensureContext()
    expect(ctx1).toBe(ctx2)
  })

  it('T14: master gain conecta a destination', () => {
    const { masterGain } = engine.ensureContext()
    expect(masterGain.connect).toHaveBeenCalledWith(expect.anything())
  })
})

describe('engine — getContext() / getMasterGain()', () => {
  it('T15: getContext() devuelve la instancia de AudioContext', () => {
    const ctx = engine.getContext()
    expect(ctx).toBeInstanceOf(MockAudioContext)
  })

  it('T16: getMasterGain() devuelve el nodo con propiedad gain', () => {
    const mg = engine.getMasterGain()
    expect(mg).toHaveProperty('gain')
    expect(mg).toHaveProperty('connect')
  })
})
