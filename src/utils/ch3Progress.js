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

// SLIDE_PLATEAU/SLIDE_FALLOFF — umbrales de slideWeight(), nombrados (TASK-025)
// porque ahora tienen un SEGUNDO caller: act1LayerOp en computeCh3Frame()
// necesita saber EXACTAMENTE en qué overallVh el hero (slide 0) alcanza su
// propia meseta (weight 1) para poder terminar de apagar la capa del Acto 1
// antes de ese punto, no un número mágico independiente que pueda desalinearse
// con éste si algún día cambia (ver el comentario HIGH junto a act1LayerOp).
export const SLIDE_PLATEAU = 0.32
export const SLIDE_FALLOFF = 0.82

// slideWeight(diff) — peso 0..1 de un slide dado su distancia (en unidades)
// al progreso continuo actual. Meseta plana [-0.32, 0.32] (el slide se lee
// completo sin transición en curso) y crossfade lineal hasta 0 en ±0.82 —
// dos slides adyacentes se solapan brevemente durante la transición.
export function slideWeight(diff) {
  const d = Math.abs(diff)
  if (d <= SLIDE_PLATEAU) return 1
  if (d >= SLIDE_FALLOFF) return 0
  return 1 - (d - SLIDE_PLATEAU) / (SLIDE_FALLOFF - SLIDE_PLATEAU)
}

// computeCh3Frame(overallVh) — dado el progreso total (0..TOTAL_UNITS) de la
// sección, devuelve TODO lo que applyProgress() necesita escribir al DOM.
// Pura: mismo input siempre produce el mismo output, cero efectos de lado.
//
// ── Fade-out de la capa del Acto 1 (TASK-025) — constantes de módulo (antes
// vivían dentro de computeCh3Frame como locals; se hoistean para poder
// derivar P1_COMPLETE_VH de ellas ANTES de calcular p1, ver más abajo).
//
// HIGH (TASK-025, hallazgo de verificación CDP real — "cuadrado naranja"
// reportado por Rafael en UAT, 2026-07-28): la capa del Acto 1 se apagaba
// recién a partir de overallVh === ACT1_UNITS ("DESPUÉS de terminar su
// propio scrub"). Pero el hero (slide 0) alcanza su propia meseta de
// opacity:1 ANTES de eso — su crossfade arranca en diff=-SLIDE_PLATEAU, o
// sea en overallVh = ACT1_UNITS - SLIDE_PLATEAU*ACT2_STEP_VH (2.84 con los
// valores actuales), 0.16 unidades ANTES de ACT1_UNITS. Con el fade-out del
// Acto 1 arrancando recién en ACT1_UNITS, había una franja real (confirmada
// con CDP: click en el paso "hero" del roadmap, que aterriza exactamente en
// overallVh===ACT1_UNITS vía stepToOverallVh(1)) donde el hero YA estaba a
// opacity:1 (botón "The full story" listo) y la capa del Acto 1 SEGUÍA a
// opacity:1 y pointer-events:auto — el frame final del Acto 1 (blanqueo +
// acento HTML5 naranja opaco, tramo p1 0.85-1.00) quedaba pintado ENCIMA del
// hero, tapando su texto y bloqueando su botón. `document.elementFromPoint()`
// en el centro del botón del hero devolvía `.ch3-act1-white`, no el botón.
export const ACT1_FADE_DURATION = 0.5
export const ACT1_FADE_END = ACT1_UNITS - SLIDE_PLATEAU * ACT2_STEP_VH // 2.84
export const ACT1_FADE_START = ACT1_FADE_END - ACT1_FADE_DURATION // 2.34

// P1_COMPLETE_VH (TASK-025, ronda 2 — hallazgo de verificación CDP real,
// riesgo R1 marcado explícitamente en el dispatch de este ticket): la
// primera versión del fix de arriba dejaba `p1 = overallVh / ACT1_UNITS` sin
// tocar, así que p1 sólo llegaba a 1 (clímax completo: blanqueo + acento
// HTML5 a opacity:1, spec 03 tramo p 0.85-1.00) en overallVh===ACT1_UNITS(3)
// — es decir, DESPUÉS de que ACT1_FADE_START(2.34) ya había empezado a
// apagar la capa entera y DESPUÉS de ACT1_FADE_END(2.84) donde la capa ya
// está en opacity:0. Confirmado con CDP real (Chrome headed, muestreo de
// --ch3-p / opacity de `.ch3-act1-white` y `.ch3-act1-accent` en fracciones
// 0/0.5/0.85/0.9/0.947/0.97/1.0 de ACT1_UNITS): como un padre a opacity:0
// apaga TODO su subárbol sin importar el opacity local del hijo (opacity es
// multiplicativo en el árbol de render), la intensidad COMPUESTA del
// blanqueo/acento nunca superaba ~9% antes de caer a 0 — el clímax del Acto
// 1 (la razón de ser del tramo final de la spec) quedaba prácticamente
// invisible, justo lo que el riesgo R1 del dispatch pedía verificar.
//
// FIX: p1 completa su propio recorrido (llega a 1, clímax a opacity:1 real)
// EN ACT1_FADE_START, no en ACT1_UNITS — el scrub local del Acto 1 se
// comprime a P1_COMPLETE_VH unidades en vez de las 3 completas de
// ACT1_UNITS (que sigue intacto: es el presupuesto FÍSICO del Acto 1 dentro
// de la sección, del que derivan TOTAL_UNITS/CH3_VIEWPORTS — AC#7 de este
// ticket prohíbe tocarlo, y no se toca). El resultado: el clímax se renderiza
// COMPLETO (opacity:1 real, no un valor que un padre invisible descarta) y
// RECIÉN DESPUÉS esa imagen ya completa es la que hace crossfade con el
// hero durante la ventana [ACT1_FADE_START, ACT1_FADE_END] — la "disolución"
// que el comentario original de esta función prometía, pero ahora disolviendo
// un clímax que sí se vio, no una versión a medio renderizar.
export const P1_COMPLETE_VH = ACT1_FADE_START // 2.34

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
  const p1 = clamp(overallVh / P1_COMPLETE_VH, 0, 1)

  // El fade-out de la capa entera: un solo booleano/valor gobierna
  // opacity+pointer-events (ver applyProgress() en Chapter3Content.vue) —
  // constantes ACT1_FADE_DURATION/ACT1_FADE_END/ACT1_FADE_START arriba.
  const act1LayerOp = clamp(1 - Math.max(0, overallVh - ACT1_FADE_START) / ACT1_FADE_DURATION, 0, 1)

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
