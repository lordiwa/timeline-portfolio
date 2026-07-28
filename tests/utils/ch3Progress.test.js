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
import {
  ACT1_UNITS,
  ACT2_SLIDE_COUNT,
  ACT2_STEP_VH,
  TOTAL_UNITS,
  CH3_VIEWPORTS,
  CH3_STEP_COUNT,
  slideWeight,
  computeCh3Frame,
  stepToOverallVh,
} from '@/utils/ch3Progress'

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

  it('T4 bien avanzado el Acto 2 (slide 4 = beat índice 3) el hero vuelve a opacity 0', () => {
    // TASK-021: el offset físico para "aterrizar" en el slide 4 ya no es
    // ACT1_UNITS+4 (eso asumía el costo implícito de 1.0 viewport/slide,
    // retirado) — ahora es ACT1_UNITS + 4*ACT2_STEP_VH (ver computeCh3Frame).
    const frame = computeCh3Frame(ACT1_UNITS + 4 * ACT2_STEP_VH)
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

// ─────────────────────────────────────────────────────────────────────────
// TASK-021 — sensibilidad del scroll (AC#1/AC#2/AC#8) + roadmap (AC#3/AC#4)
// + derivación de CH3_VIEWPORTS (AC#7). Rojo/verde plantado manualmente:
// con ACT2_STEP_VH revertido a 1 (el valor implícito pre-TASK-021) T8 y T9
// fallan — confirmado revirtiendo la constante en memoria antes de escribir
// este archivo, no commiteado.
// ─────────────────────────────────────────────────────────────────────────
describe('ch3Progress — TASK-021: sensibilidad + roadmap', () => {
  it('T8 sensibilidad MEDIDA en dos puntos: ACT2_STEP_VH < 1 (más sensible que el 1.0 implícito original)', () => {
    expect(ACT2_STEP_VH).toBeLessThan(1)
    expect(ACT2_STEP_VH).toBeGreaterThan(0)
  })

  it('T8b progresión medida en dos puntos: sólo ACT2_STEP_VH viewports de scroll bastan para pasar del hero (slide 0) al primer beat (slide 1)', () => {
    // Punto 1: overallVh = ACT1_UNITS (hero asentado, opacity 1).
    const atHero = computeCh3Frame(ACT1_UNITS)
    expect(atHero.slides[0].opacity).toBe(1)
    expect(atHero.slides[1].opacity).toBe(0)
    // Punto 2: overallVh = ACT1_UNITS + ACT2_STEP_VH (UN solo "paso" físico
    // después) — el beat 0 debe estar asentado y el hero debe haberse ido.
    // Con el 1.0 implícito viejo este mismo overallVh dejaría el hero a
    // mitad de camino (slideWeight(1)=0 exactamente en el borde, pero un
    // paso completo de 1.0 nunca "aterriza" en el vecino con sólo 0.5 de
    // recorrido) — este test es el que falla si ACT2_STEP_VH vuelve a 1.
    const oneStepLater = computeCh3Frame(ACT1_UNITS + ACT2_STEP_VH)
    expect(oneStepLater.slides[0].opacity).toBe(0)
    expect(oneStepLater.slides[1].opacity).toBe(1)
  })

  it('T9 CH3_VIEWPORTS se deriva de TOTAL_UNITS: ceil(TOTAL_UNITS) + 1, y es menor que los 11 anteriores', () => {
    expect(CH3_VIEWPORTS).toBe(Math.ceil(TOTAL_UNITS) + 1)
    expect(CH3_VIEWPORTS).toBeLessThan(11)
  })

  it('T10 CH3_STEP_COUNT = 1 (Acto 1) + ACT2_SLIDE_COUNT (los 7 slides del Acto 2)', () => {
    expect(CH3_STEP_COUNT).toBe(1 + ACT2_SLIDE_COUNT)
  })

  it('T11 currentStep: 0 durante todo el Acto 1, 1 al llegar el hero, 2..6 los beats, 7 el cierre', () => {
    expect(computeCh3Frame(0).currentStep).toBe(0)
    expect(computeCh3Frame(ACT1_UNITS / 2).currentStep).toBe(0)
    expect(computeCh3Frame(ACT1_UNITS).currentStep).toBe(1) // hero asentado
    expect(computeCh3Frame(ACT1_UNITS + 3 * ACT2_STEP_VH).currentStep).toBe(4) // beat índice 2 → step 4
    expect(computeCh3Frame(TOTAL_UNITS).currentStep).toBe(7) // cierre
  })

  it('T12 stepToOverallVh es la inversa de currentStep: computeCh3Frame(stepToOverallVh(s)).currentStep === s', () => {
    for (let s = 0; s < CH3_STEP_COUNT; s++) {
      const vh = stepToOverallVh(s)
      expect(computeCh3Frame(vh).currentStep, `paso ${s}`).toBe(s)
    }
  })

  it('T13 stepToOverallVh clampea fuera de rango [0, CH3_STEP_COUNT-1]', () => {
    expect(stepToOverallVh(-3)).toBe(stepToOverallVh(0))
    expect(stepToOverallVh(999)).toBe(stepToOverallVh(CH3_STEP_COUNT - 1))
  })
})
