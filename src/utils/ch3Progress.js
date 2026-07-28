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
// ACT2_SLIDE_COUNT: hero + 5 beats + cierre = 7 momentos.
//
// TASK-021 (pedido directo de Rafael, "haz el scroll más sensible"): antes de
// este ticket cada slide del Acto 2 costaba 1 viewport ENTERO de scroll físico
// (factor implícito de 1.0) — medido como la causa concreta de "poco
// sensible" (7 slides × 1 viewport = 7 de los 11 viewports totales del
// capítulo). ACT2_STEP_VH es el nuevo factor: cuántos viewports de scroll
// real cuesta pasar de un slide al siguiente. 0.5 se eligió MIDIENDO en
// Chrome real (ver hand-off de TASK-021 — verificación CDP con rueda de
// mouse y trackpad): a 0.5 viewport/paso, en un viewport típico de
// 800-900px de alto cada paso cuesta ~400-450px, que midió como 3-4 muescas
// de rueda o un solo gesto de trackpad — "avanzar un paso" queda a UN gesto
// de scroll, que es literalmente lo que pide "que se pueda pasar como
// road map de paso a paso". El Acto 1 (cinemática scrubbed, no contenido
// paginado) NO usa este factor — spec justifica más recorrido para una
// animación continua que para slides de texto (ver ticket: "no estás
// obligado a usar la misma sensibilidad en ambos actos"), así que
// ACT1_UNITS se deja intacto.
//
// TOTAL_UNITS es el rango de scroll "pineado" real, ahora derivado de
// ACT2_STEP_VH en vez de asumir un costo de 1.0 por slide. CH3_VIEWPORTS
// (prop chapter-viewports en App.vue → ScrollShell) redondea TOTAL_UNITS
// hacia arriba (la altura de sección sólo puede ser un múltiplo entero de
// 100dvh — restricción del mecanismo de ScrollShell.vue, ver su comentario
// largo junto a `.chapter-section[data-viewports]`) y le suma 1 viewport
// de "release" (misma ventana documentada en ese archivo). App.vue importa
// CH3_VIEWPORTS directamente de aquí — nunca hay que actualizar un literal
// a mano (ver tests/integration/ch3-viewports-contract.test.js).
export const ACT1_UNITS = 3
export const ACT2_SLIDE_COUNT = 7 // 0=hero, 1..5=beats, 6=cierre
export const ACT2_STEP_VH = 0.5 // TASK-021: viewports de scroll físico por slide (antes: 1.0 implícito)
export const TOTAL_UNITS = ACT1_UNITS + ACT2_SLIDE_COUNT * ACT2_STEP_VH // 3 + 3.5 = 6.5
export const CH3_VIEWPORTS = Math.ceil(TOTAL_UNITS) + 1 // ceil(6.5)+1 = 8 (antes: 11)

// CH3_STEP_COUNT — cantidad de "pasos" del roadmap (AC#3/AC#4 de TASK-021):
// 1 paso para TODO el Acto 1 (es una cinemática continua, no contenido
// paginado — partirla en sub-pasos falsearía su naturaleza, ver hand-off)
// + 1 paso por cada uno de los ACT2_SLIDE_COUNT slides del Acto 2.
// Coincide numéricamente con CH3_VIEWPORTS hoy (8=8) por pura casualidad de
// los valores actuales de las constantes de arriba — son conceptos
// independientes (uno es un multiplicador de altura CSS, el otro es la
// cantidad de nodos del roadmap) y se mantienen como exports separados a
// propósito para no acoplarlos si algún ajuste futuro los desalinea.
export const CH3_STEP_COUNT = 1 + ACT2_SLIDE_COUNT

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
  //
  // TASK-021: se divide por ACT2_STEP_VH para convertir "vh físicos
  // recorridos desde que terminó el Acto 1" a "índice de slide" — con
  // ACT2_STEP_VH=0.5, recorrer sólo 0.5 viewports ya mueve continuousSlide
  // un slide entero (antes hacía falta 1 viewport completo). El resto de la
  // función (slideWeight, translateYpx) sigue operando en "espacio de
  // índice" sin cambios: la escala física sólo entra en esta división.
  const continuousSlide = Math.min((overallVh - ACT1_UNITS) / ACT2_STEP_VH, ACT2_SLIDE_COUNT - 1)

  const slides = []
  for (let i = 0; i < ACT2_SLIDE_COUNT; i++) {
    const diff = continuousSlide - i
    slides.push({
      opacity: slideWeight(diff),
      translateYpx: clamp(-diff, -1, 1) * 24,
    })
  }

  const heroLocalP = clamp(continuousSlide, 0, 1)

  // currentStep — índice discreto 0..CH3_STEP_COUNT-1 para el roadmap
  // (AC#3/AC#4 TASK-021): 0 mientras el Acto 1 no terminó (overallVh <
  // ACT1_UNITS); de ahí en más, 1 + el slide de Acto 2 más cercano
  // (Math.round de continuousSlide, MISMO umbral de 0.5 que separa el peso
  // pleno de un slide del siguiente en slideWeight — no es un criterio
  // nuevo, es el que ya gobierna qué slide se ve "asentado" en pantalla).
  const currentStep = overallVh < ACT1_UNITS
    ? 0
    : 1 + clamp(Math.round(continuousSlide), 0, ACT2_SLIDE_COUNT - 1)

  return { p1, act1LayerOp, continuousSlide, slides, heroLocalP, currentStep }
}

// stepToOverallVh(step) — inversa de currentStep: dado un índice de paso del
// roadmap (0..CH3_STEP_COUNT-1), el progreso físico (overallVh) al que hay
// que llevar el scroll para que ese paso quede "asentado" (weight 1 / hero
// completamente presente). Única fuente de esta conversión — el CTA del
// hero ("La historia completa") y los clicks del roadmap la comparten
// (Chapter3Content.vue), en vez de cada uno reimplementar su propia fórmula
// de scroll target (Ponytail: una sola función, dos callers).
export function stepToOverallVh(step) {
  const s = clamp(Math.round(step), 0, CH3_STEP_COUNT - 1)
  if (s === 0) return 0
  return ACT1_UNITS + (s - 1) * ACT2_STEP_VH
}
