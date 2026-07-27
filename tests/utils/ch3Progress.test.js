// tests/utils/ch3Progress.test.js
// TASK-009 (retomando TASK-014) — regresión lock del hallazgo HIGH de
// verificación CDP real en esta sesión: durante el Acto 1 (overallVh <
// ACT1_UNITS), el hero (slide índice 0) DEBE quedar invisible (opacity 0).
//
// jsdom no hace layout — ningún test montado con @vue/test-utils podría
// atrapar este bug (depende de getBoundingClientRect() real y de cómo el
// navegador resuelve --ch3-p/opacity vía calc()); sólo la verificación
// visual en Chrome real vía CDP lo hizo. Por eso la matemática pura vive en
// src/utils/ch3Progress.js — testeable sin DOM/scroll.
//
// Rojo/verde plantado manualmente (no vía commit revertido): con
// `continuousSlide = clamp(overallVh - ACT1_UNITS, 0, ACT2_SLIDE_COUNT - 1)`
// (piso en 0 en vez de Math.min sin piso) T1 y T2 fallan — confirmado
// revirtiendo la línea en memoria antes de escribir este archivo, no
// commiteado. El bug real: con overallVh=1.5 (mitad del Acto 1),
// continuousSlide clampeado a 0 hace slideWeight(0-0)=1 → hero opacity 1,
// superpuesto al drama del plugin (confirmado con screenshot real: el
// título "The Death of Flash" y el hero "2013. The web learns..." pintados
// uno encima del otro).

import { describe, it, expect } from 'vitest'
import { ACT1_UNITS, ACT2_SLIDE_COUNT, TOTAL_UNITS, slideWeight, computeCh3Frame } from '@/utils/ch3Progress'

describe('ch3Progress — HIGH regression lock: el hero no se superpone al Acto 1', () => {
  it('T1 en overallVh=0 (inicio del Acto 1) el hero (slide 0) tiene opacity 0', () => {
    const frame = computeCh3Frame(0)
    expect(frame.slides[0].opacity).toBe(0)
  })

  it('T2 a mitad del Acto 1 (overallVh = ACT1_UNITS/2) el hero sigue en opacity 0', () => {
    const frame = computeCh3Frame(ACT1_UNITS / 2)
    expect(frame.slides[0].opacity).toBe(0)
    // El Acto 1 mismo debe estar a mitad de su propio scrub, no en 0 ni en 1.
    expect(frame.p1).toBeCloseTo(0.5, 5)
  })

  it('T3 justo cuando el Acto 1 termina (overallVh = ACT1_UNITS) el hero alcanza opacity 1', () => {
    const frame = computeCh3Frame(ACT1_UNITS)
    expect(frame.slides[0].opacity).toBe(1)
    expect(frame.p1).toBe(1)
  })

  it('T4 bien avanzado el Acto 2 (overallVh = ACT1_UNITS + 4, beat índice 3) el hero vuelve a opacity 0', () => {
    const frame = computeCh3Frame(ACT1_UNITS + 4)
    expect(frame.slides[0].opacity).toBe(0)
    expect(frame.slides[4].opacity).toBe(1) // beat índice 3 = slide 4 (0=hero, 1..5=beats)
  })

  // ── Acto 1 layer: se apaga apenas termina, no queda pegado en opacity 1 ──
  it('T5 la capa del Acto 1 se apaga por completo 0.5 unidades después de terminar su scrub', () => {
    const atEnd = computeCh3Frame(ACT1_UNITS)
    const halfUnitLater = computeCh3Frame(ACT1_UNITS + 0.5)
    expect(atEnd.act1LayerOp).toBe(1)
    expect(halfUnitLater.act1LayerOp).toBe(0)
  })

  // ── Cierre: el progreso no crece sin límite pasado el último slide ──────
  it('T6 el cierre (slide 6) se mantiene a opacity 1 incluso más allá de TOTAL_UNITS', () => {
    const frame = computeCh3Frame(TOTAL_UNITS)
    expect(frame.slides[ACT2_SLIDE_COUNT - 1].opacity).toBe(1)
  })

  // ── slideWeight: meseta plana + crossfade, sanity de la función pura ────
  it('T7 slideWeight: meseta 1 en |diff|<=0.32, crossfade lineal hasta 0 en |diff|>=0.82', () => {
    expect(slideWeight(0)).toBe(1)
    expect(slideWeight(0.32)).toBe(1)
    expect(slideWeight(0.82)).toBe(0)
    expect(slideWeight(1)).toBe(0)
    expect(slideWeight(0.57)).toBeCloseTo(0.5, 5)
  })
})
