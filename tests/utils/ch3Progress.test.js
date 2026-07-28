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
  SLIDE_PLATEAU,
  ACT1_FADE_START,
  ACT1_FADE_END,
  P1_COMPLETE_VH,
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
    // TASK-025 ronda 2: el divisor de p1 es P1_COMPLETE_VH (2.34), no
    // ACT1_UNITS (3) — ver el comentario de esa constante en ch3Progress.js.
    // ACT1_UNITS/2 = 1.5 sigue cayendo bien dentro de [0, P1_COMPLETE_VH],
    // así que "a mitad del Acto 1" en términos de scroll físico da
    // p1 = 1.5/2.34 ≈ 0.641, no 0.5 — ya no están alineados 1:1 porque el
    // scrub se comprimió a propósito (el clímax debe completarse ANTES de
    // que arranque el fade-out de la capa, ACT1_FADE_START).
    expect(frame.p1).toBeCloseTo(ACT1_UNITS / 2 / P1_COMPLETE_VH, 5)
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
  it('T5 la capa del Acto 1 ya está totalmente apagada para cuando el hero alcanza su propia meseta', () => {
    // TASK-025 (reemplaza la versión anterior de este test, que afirmaba
    // `act1LayerOp === 1` en overallVh===ACT1_UNITS — esa aserción ERA el bug:
    // ver el hallazgo HIGH junto a act1LayerOp en ch3Progress.js). El hero
    // (slide 0) alcanza weight:1 en overallVh = ACT1_UNITS - SLIDE_PLATEAU*ACT2_STEP_VH;
    // la capa del Acto 1 debe llegar a 0 A MÁS TARDAR ahí.
    const heroPlateauStart = ACT1_UNITS - SLIDE_PLATEAU * ACT2_STEP_VH
    const atHeroPlateauStart = computeCh3Frame(heroPlateauStart)
    expect(atHeroPlateauStart.act1LayerOp).toBe(0)
    expect(atHeroPlateauStart.slides[0].opacity).toBeCloseTo(1, 9)

    // Sigue en 0 más adelante (nunca vuelve a subir).
    const atEnd = computeCh3Frame(ACT1_UNITS)
    const halfUnitLater = computeCh3Frame(ACT1_UNITS + 0.5)
    expect(atEnd.act1LayerOp).toBe(0)
    expect(halfUnitLater.act1LayerOp).toBe(0)

    // Antes de esa franja de crossfade, la capa del Acto 1 sigue intacta a opacity 1.
    expect(computeCh3Frame(ACT1_UNITS / 2).act1LayerOp).toBe(1)
  })

  // ── TASK-025 — regresión del "cuadrado naranja": el salto por click a un
  // paso NUNCA debe dejar la capa del Acto 1 (opaca, pointer-events:auto en
  // el componente real) superpuesta a un slide del Acto 2 ya asentado.
  // Esto SÍ es lockeable en jsdom pese a que el bug se manifestó como un
  // defecto visual/de click: no depende de layout ni de la cascada CSS real
  // — computeCh3Frame() es la ÚNICA fuente de los valores que
  // Chapter3Content.vue escribe como opacity/pointer-events inline
  // (ver applyProgress() — pointer-events se decide con el mismo umbral 0.05
  // usado abajo), así que la función pura reproduce el estado resultante
  // completo del escenario "click en un paso" sin necesitar DOM real.
  // Plantado en rojo manualmente (revirtiendo act1LayerOp a la fórmula vieja
  // en memoria: `clamp(1 - Math.max(0, overallVh - ACT1_UNITS) / 0.5, 0, 1)`)
  // antes de escribir el fix — con esa fórmula, T-orange1 fallaba con
  // act1LayerOp=1 (paso 1 aterriza exactamente en overallVh=ACT1_UNITS=3,
  // donde esa fórmula todavía da 1). CORRECCIÓN DE NOTA (review de cierre de
  // TASK-025, ronda 3 — el comentario anterior sobredeclaraba la evidencia):
  // con esa misma fórmula vieja, T-orange2 SÓLO falla en el paso 1 — los
  // pasos 2..7 aterrizan en overallVh>=3.5, donde `overallVh-ACT1_UNITS>=0.5`
  // ya hace que la fórmula vieja dé 0 sin necesitar el fix. Y como el
  // `expect()` dentro del loop del test aborta en el PRIMER fallo, ese loop
  // ni siquiera llega a evaluar los pasos posteriores al 1 — así que nunca
  // pudo haber reportado "4 pasos" fallando. El lock sigue siendo válido
  // (paso 1 es justamente el click que reportó Rafael), sólo se corrige acá
  // la descripción de qué falló exactamente al plantar el rojo.
  it('T-orange1 el paso "hero" (stepToOverallVh(1), el click exacto que reportó Rafael) no deja la capa del Acto 1 encima', () => {
    const frame = computeCh3Frame(stepToOverallVh(1))
    expect(frame.act1LayerOp).toBeLessThanOrEqual(0.05) // mismo umbral pointer-events de Chapter3Content.vue
    expect(frame.slides[0].opacity).toBe(1) // el hero sigue asentado, no regresiona AC#5/AC#6
  })

  it('T-orange2 ningún paso del roadmap (0..7) aterriza con la capa del Acto 1 tapando su slide asentado', () => {
    for (let s = 0; s < CH3_STEP_COUNT; s++) {
      const frame = computeCh3Frame(stepToOverallVh(s))
      if (s === 0) continue // step 0 = el Acto 1 ES el contenido, no hay "tapado"
      expect(frame.act1LayerOp, `paso ${s}`).toBeLessThanOrEqual(0.05)
    }
  })

  // ── TASK-025 ronda 2 — riesgo R1 marcado explícitamente en el dispatch:
  // el fix de T-orange1/T-orange2 (arriba) apaga la capa del Acto 1 en
  // ACT1_FADE_END(2.84), ANTES de ACT1_UNITS(3) — eso por sí solo no prueba
  // que el CLÍMAX (p1=1, blanqueo+acento a opacity:1, spec 03 tramo p
  // 0.85-1.00) siga siendo visible: si p1 completa su recorrido DESPUÉS de
  // que la capa ya empezó a apagarse, el clímax se renderiza a un opacity
  // local que un padre semi-transparente (o ya invisible) descarta —
  // confirmado con CDP real (Chrome headed, .planning/LECCIONES-TECNICAS.md
  // §6): sin este fix, la intensidad COMPUESTA del blanqueo/acento nunca
  // superaba ~9% antes de caer a 0. Plantado en rojo revirtiendo P1_COMPLETE_VH
  // a ACT1_UNITS en memoria antes de escribir este test: con esa reversión,
  // en overallVh=ACT1_FADE_START (2.34) p1 daba 2.34/3=0.78, NO 1 — fallaba.
  it('T-orange3 el clímax del Acto 1 (p1=1) se completa ANTES o EN el arranque del fade-out de la capa, nunca después', () => {
    const atFadeStart = computeCh3Frame(ACT1_FADE_START)
    expect(atFadeStart.p1).toBe(1) // clímax ya completo, a opacity:1 real
    expect(atFadeStart.act1LayerOp).toBe(1) // ...Y la capa todavía a brillo pleno cuando eso pasa

    // Sigue en el clímax (p1 no retrocede) durante TODA la ventana de fade.
    const mid = computeCh3Frame((ACT1_FADE_START + ACT1_FADE_END) / 2)
    expect(mid.p1).toBe(1)
    const atFadeEnd = computeCh3Frame(ACT1_FADE_END)
    expect(atFadeEnd.p1).toBe(1)
    expect(atFadeEnd.act1LayerOp).toBe(0)

    // P1_COMPLETE_VH sigue siendo estrictamente menor que ACT1_UNITS — el
    // scrub se comprimió a propósito, ACT1_UNITS (presupuesto físico,
    // AC#7) no se tocó.
    expect(P1_COMPLETE_VH).toBeLessThan(ACT1_UNITS)

    // LOW (review de cierre de TASK-025): P1_COMPLETE_VH también tiene que
    // ser estrictamente positivo — es el DIVISOR de p1 (`p1 = overallVh /
    // P1_COMPLETE_VH`, ver computeCh3Frame()). Si ACT1_UNITS bajara de
    // ~0.66, o ACT1_FADE_DURATION/SLIDE_PLATEAU*ACT2_STEP_VH subieran lo
    // suficiente, P1_COMPLETE_VH (= ACT1_UNITS - SLIDE_PLATEAU*ACT2_STEP_VH
    // - ACT1_FADE_DURATION) podría cruzar a 0 o negativo sin que ningún
    // otro test lo note — un divisor <=0 no lanza (JS: x/0 = Infinity,
    // x/negativo cambia de signo), así que el scrub del Acto 1 colapsaría
    // EN SILENCIO (p1 saltaría a 0, Infinity o NaN según el signo de
    // overallVh) en vez de fallar ruidosamente. Esta aserción es la que
    // detectaría ese colapso si alguna de esas constantes cambia en el futuro.
    expect(P1_COMPLETE_VH).toBeGreaterThan(0)
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
    // después, sea cual sea el valor de ACT2_STEP_VH) — el beat 0 debe estar
    // asentado y el hero debe haberse ido. Corrección de comentario (LOW,
    // review de cierre de TASK-021): este test es INVARIANTE al valor de
    // ACT2_STEP_VH — usa la constante, no un número hardcodeado, así que
    // "aterriza" siempre en el vecino sin importar cuánto valga el paso. Lo
    // que T8b lockea de verdad es la DIVISIÓN física por slide dentro de
    // computeCh3Frame (offset = ACT1_UNITS + n * ACT2_STEP_VH, no un 1.0
    // fijo por slide); que ACT2_STEP_VH sea < 1 (más sensible que el 1.0
    // implícito viejo) ya lo lockea T8, arriba.
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
