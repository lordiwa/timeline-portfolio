// src/utils/ch3Progress.js — TASK-009 (retomando TASK-014): matemática pura
// del scrollytelling pineado de ch3 ("La muerte de Flash").
//
// Extraído de Chapter3Content.vue para poder testearlo SIN DOM/scroll real
// (jsdom no hace layout — un test que dependiera de getBoundingClientRect()
// real no podría atrapar regresiones aquí, sólo la verificación en Chrome vía
// CDP puede, y esta sesión ya encontró un bug real así: ver el hallazgo HIGH
// abajo). Extraer la función pura como módulo con un SEGUNDO caller real
// (el test) es la excepción legítima de Ponytail/MINIMALISM.md a "sin
// abstracción sin segundo caller" — el segundo caller es el test mismo.
//
// Presupuesto de progreso: unidades = "viewports de scroll dentro de la
// sección". ACT1_UNITS es el scrub del plugin muerto (spec quería ~220vh ≈
// 2.2 viewports; se redondea a 3 para dar aire a la escena — AC#3).
// ACT2_SLIDE_COUNT: hero + 5 beats + cierre = 7 momentos, 1 unidad c/u.
// TOTAL_UNITS es el rango de scroll "pineado" real; CH3_VIEWPORTS (prop
// chapter-viewports en App.vue → ScrollShell) es TOTAL_UNITS + 1 (el
// viewport extra es la ventana de "release" documentada en ScrollShell.vue).
// Si se ajustan estas constantes, actualizar App.vue en el mismo commit.
export const ACT1_UNITS = 3
export const ACT2_SLIDE_COUNT = 7 // 0=hero, 1..5=beats, 6=cierre
export const TOTAL_UNITS = ACT1_UNITS + ACT2_SLIDE_COUNT // 10 → CH3_VIEWPORTS = 11

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// slideWeight(diff) — peso 0..1 de un slide dado su distancia (en unidades)
// al progreso continuo actual. Meseta plana [-0.32, 0.32] (el slide se lee
// completo sin transición en curso) y crossfade lineal hasta 0 en ±0.82 —
// dos slides adyacentes se solapan brevemente durante la transición.
export function slideWeight(diff) {
  const d = Math.abs(diff)
  if (d <= 0.32) return 1
  if (d >= 0.82) return 0
  return 1 - (d - 0.32) / 0.5
}

// computeCh3Frame(overallVh) — dado el progreso total (0..TOTAL_UNITS) de la
// sección, devuelve TODO lo que applyProgress() necesita escribir al DOM.
// Pura: mismo input siempre produce el mismo output, cero efectos de lado.
//
// HIGH (hallazgo de verificación CDP real en esta sesión, no detectable por
// ningún test de jsdom): la primera versión de `continuousSlide` clampeaba
// el PISO en 0 (`clamp(overallVh - ACT1_UNITS, 0, ACT2_SLIDE_COUNT - 1)`).
// Como `overallVh - ACT1_UNITS` es SIEMPRE <= 0 durante todo el Acto 1, ese
// piso colapsaba continuousSlide a exactamente 0 durante TODO el Acto 1 —
// slideWeight(0 - 0) = 1, así que el hero quedaba a opacity:1 SUPERPUESTO
// arriba de la escena del plugin muriendo desde el primer frame. Confirmado
// con screenshot real en Chrome (el título "The Death of Flash" y el hero
// "2013. The web learns..." pintados uno encima del otro). El test T1 de
// abajo (`continuousSlide dentro del Acto 1 es negativo, no clampeado a 0`)
// es el lock de regresión de ESTE bug específico — plantado en rojo
// revirtiendo el `Math.min` a un `clamp` con piso 0 antes de escribir el fix.
export function computeCh3Frame(overallVh) {
  const p1 = clamp(overallVh / ACT1_UNITS, 0, 1)

  // La capa entera del Acto 1 se apaga (opacity 1→0) en las primeras 0.5
  // unidades DESPUÉS de terminar su propio scrub — sin esto, dos de sus
  // sub-capas (.ch3-act1-white, .ch3-act1-accent) quedan en opacity:1 para
  // siempre (sus propias fórmulas CSS nunca vuelven a 0) y el bloque naranja
  // HTML5 queda pintado encima de todos los slides del Acto 2 (mismo hallazgo
  // HIGH, confirmado con screenshot real: "02 REBUILD" con fondo naranja
  // sólido en vez del acento azul de su tono).
  const act1LayerOp = clamp(1 - Math.max(0, overallVh - ACT1_UNITS) / 0.5, 0, 1)

  // Sin piso: si el piso fuera 0, continuousSlide quedaría en 0 (peso pleno
  // del hero) durante TODO el Acto 1 — ver el HIGH de arriba. El techo sí se
  // clampea: una vez el cierre llega a su pico, el progreso no debe seguir
  // creciendo sin límite.
  const continuousSlide = Math.min(overallVh - ACT1_UNITS, ACT2_SLIDE_COUNT - 1)

  const slides = []
  for (let i = 0; i < ACT2_SLIDE_COUNT; i++) {
    const diff = continuousSlide - i
    slides.push({
      opacity: slideWeight(diff),
      translateYpx: clamp(-diff, -1, 1) * 24,
    })
  }

  const heroLocalP = clamp(continuousSlide, 0, 1)

  return { p1, act1LayerOp, continuousSlide, slides, heroLocalP }
}
