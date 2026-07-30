// tests/components/Ch6Terminal.ascii-cycle.test.js
//
// TASK-034 — "el ASCII no debe quedarse asentado, tiene que volver a la vista
// normal y ciclar" (pedido directo de Rafael, 2026-07-29). Desviación
// deliberada de la spec .planning/design/06-ch6-climax-terminal-ia.md §4.4
// (que diseñó el "reposo final" como estado permanente) — ver
// tasks/TASK-034.json.
//
// Cobertura (locks de regresión, tests-after):
//   T1 (AC1/AC6): tras alcanzar el reposo final, el ciclo emite ascii-progress
//       con mix descendiendo a 0 (vista normal) y volviendo a subir a 1
//       (takeover pleno) — al menos una vuelta completa observada, gateada
//       por los tiempos de dwell/retorno/takeover.
//   T2 (AC2, protege T9 de TASK-012): durante TODO el ciclo (incluida la fase
//       de "vista normal" donde mix llega a 0) el texto ya revelado —
//       revealedWords y closingParts — permanece en opacity:1. El ciclo NUNCA
//       resetea revealedWords/decodedBitGroups.
//   T3 (AC5): bajo prefers-reduced-motion, tras el reposo final NO se emite
//       ningún ascii-progress adicional — cero ciclo, estado único permanente.
//   T4 (AC6): salir de ch6 a mitad de ciclo (activeChapter !== 6) detiene las
//       emisiones — nada nuevo se emite mientras el visitante está en otro
//       capítulo, ni siquiera cuando el reloj avanza lo suficiente para varias
//       vueltas de ciclo completas.
//   T5 (AC6): volver a entrar a ch6 tras salir a mitad de ciclo arranca un
//       ciclo limpio — no quedan dos secuencias de emisión superpuestas (el
//       conteo de emisiones tras reentrar coincide con una timeline fresca,
//       no con timers duplicados sumándose).

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createTestI18n } from '../i18n/test-helpers.js'

async function mountTerminal({ locale = 'es', prefersReduced = false, activeChapter = 6 } = {}) {
  const Ch6Terminal = (await import('@/components/Ch6Terminal.vue')).default
  const i18n = createTestI18n({ locale })
  const activeChapterRef = ref(activeChapter)
  const wrapper = mount(Ch6Terminal, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter: activeChapterRef },
        prm: { prefersReduced: ref(prefersReduced) },
      },
    },
  })
  return { wrapper, i18n, activeChapterRef }
}

// Tiempo total que tarda skip() alcanzar 'done' desde el mount — boot fijo +
// pausa; no depende de aleatoriedad porque skip() salta directo, así que
// basta con estar en pleno streaming quan se dispara. 9000ms replica T9 de
// Ch6Terminal.test.js (siempre en pleno streaming a los 9s, streaming total
// ≈17s).
async function reachDoneViaSkip(wrapper) {
  await vi.advanceTimersByTimeAsync(9000)
  await flushPromises()
  await wrapper.find('.ch6-convo').trigger('pointerdown')
  await flushPromises()
}

describe('Ch6Terminal.vue — ciclo ASCII tras el reposo final (TASK-034)', () => {
  it('T1: tras el reposo final, el ciclo hace mix 1→0 (vista normal) y 0→1 (takeover) — al menos una vuelta completa', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })
      await reachDoneViaSkip(wrapper)

      // wrapper.emitted(...) devuelve la MISMA referencia de array en cada
      // llamada (Vue Test Utils no clona) — capturar solo el `.length` como
      // número primitivo en cada checkpoint, nunca guardar el array en sí,
      // o dos "snapshots" resultarían ser el mismo objeto en crecimiento.
      const countAtDone = wrapper.emitted('ascii-progress').length
      expect(countAtDone).toBeGreaterThan(0)
      const lastAtDone = wrapper.emitted('ascii-progress')[countAtDone - 1][0]
      expect(lastAtDone.mix).toBeCloseTo(1, 5) // reposo final recién alcanzado.

      // Dwell en ASCII pleno (4000ms) — nada nuevo debe emitirse todavía.
      await vi.advanceTimersByTimeAsync(3900)
      await flushPromises()
      expect(wrapper.emitted('ascii-progress').length).toBe(countAtDone)

      // Cruzar el dwell + completar el retorno (24 pasos × 50ms ≈ 1200ms).
      await vi.advanceTimersByTimeAsync(200 + 1300)
      await flushPromises()
      const countAfterReturn = wrapper.emitted('ascii-progress').length
      const lastAfterReturn = wrapper.emitted('ascii-progress')[countAfterReturn - 1][0]
      // "Vuelve a la vista normal" (AC1) — mix debe haber bajado a ~0.
      expect(lastAfterReturn.mix).toBeLessThan(0.05)
      expect(countAfterReturn).toBeGreaterThan(countAtDone)

      // Dwell en vista normal (3000ms) + re-takeover (24 × 60ms ≈ 1440ms) +
      // margen.
      await vi.advanceTimersByTimeAsync(3000 + 1500 + 200)
      await flushPromises()
      const countAfterTakeover = wrapper.emitted('ascii-progress').length
      const lastAfterTakeover = wrapper.emitted('ascii-progress')[countAfterTakeover - 1][0]
      // "El ciclo se repite" (AC1) — de vuelta al takeover pleno.
      expect(lastAfterTakeover.mix).toBeCloseTo(1, 5)
      expect(countAfterTakeover).toBeGreaterThan(countAfterReturn)
    } finally {
      vi.useRealTimers()
    }
  })

  it('T2: el texto ya revelado (cuerpo + frase de cierre) permanece en opacity:1 durante TODO el ciclo, incluida la vista normal (mix=0) — AC2, protege T9 de TASK-012', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })
      await reachDoneViaSkip(wrapper)

      function assertAllRevealed() {
        const bodyWords = wrapper.findAll('.ch6-convo-word')
        expect(bodyWords.length).toBeGreaterThan(50)
        bodyWords.forEach((w) => expect(w.attributes('style')).toContain('opacity: 1'))
        const closingWords = wrapper.findAll('.ch6-closing-word')
        expect(closingWords.length).toBeGreaterThan(0)
        closingWords.forEach((w) => expect(w.attributes('style')).toContain('opacity: 1'))
      }

      assertAllRevealed() // en el reposo final recién alcanzado.

      // A mitad del retorno (mix bajando).
      await vi.advanceTimersByTimeAsync(4000 + 600)
      await flushPromises()
      assertAllRevealed()

      // En plena vista normal (mix=0, dwell de 3000ms).
      await vi.advanceTimersByTimeAsync(700 + 1500)
      await flushPromises()
      // Confirma que efectivamente estamos en el tramo de mix bajo — si esto
      // fallara, el test de arriba (T1) ya lo habría detectado, pero se repite
      // aquí para que este test sea autocontenido.
      const midNormal = wrapper.emitted('ascii-progress')
      expect(midNormal[midNormal.length - 1][0].mix).toBeLessThan(0.05)
      assertAllRevealed()

      // De vuelta al takeover pleno.
      await vi.advanceTimersByTimeAsync(1500 + 1500)
      await flushPromises()
      assertAllRevealed()
    } finally {
      vi.useRealTimers()
    }
  })

  it('T3: bajo prefers-reduced-motion, tras el reposo final NO se emite ningún ascii-progress adicional — cero ciclo (AC5)', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper } = await mountTerminal({ prefersReduced: true, activeChapter: 6 })
      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()

      // wrapper.emitted(...) devuelve la MISMA referencia de array en cada
      // llamada — capturar el `.length` como número primitivo, nunca el
      // array, o la comparación de "antes/después" sería trivialmente cierta
      // contra sí misma.
      const countAtDone = wrapper.emitted('ascii-progress').length
      expect(countAtDone).toBeGreaterThan(0)
      const last = wrapper.emitted('ascii-progress')[countAtDone - 1][0]
      expect(last.mix).toBeCloseTo(1, 5)

      // Avanza muy por encima de una vuelta completa de ciclo (rest+return+
      // rest+takeover ≈ 9.6s) — bajo PRM no debe agregarse NINGÚN emit más.
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()
      expect(wrapper.emitted('ascii-progress').length).toBe(countAtDone)

      // El estado único permanece "bello" — nunca vacío ni parpadeando: el
      // texto sigue completo y el cursor sin animación (T6 de
      // Ch6Terminal.test.js ya cubre el cursor; acá solo se re-confirma que
      // el texto no varía).
      const words = wrapper.findAll('.ch6-convo-word')
      words.forEach((w) => expect(w.attributes('style')).toContain('opacity: 1'))
    } finally {
      vi.useRealTimers()
    }
  })

  it('T4: salir de ch6 a mitad de ciclo detiene las emisiones — cero ascii-progress nuevo mientras el visitante está en otro capítulo (AC3/AC6)', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper, activeChapterRef } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })
      await reachDoneViaSkip(wrapper)

      // Avanza a mitad del dwell en ASCII pleno (antes de que arranque el
      // retorno) y sale del capítulo.
      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()
      const countBeforeLeaving = wrapper.emitted('ascii-progress').length

      activeChapterRef.value = 5
      await flushPromises()

      // Avanza MUY por encima de una vuelta completa de ciclo (≈9.6s) —
      // estando fuera de ch6, cero emisiones nuevas deben producirse.
      await vi.advanceTimersByTimeAsync(30000)
      await flushPromises()
      expect(wrapper.emitted('ascii-progress').length).toBe(countBeforeLeaving)
    } finally {
      vi.useRealTimers()
    }
  })

  it('T5: reentrar a ch6 tras salir a mitad de ciclo arranca limpio — no quedan dos ciclos superpuestos ni timers duplicados (AC6)', async () => {
    vi.useFakeTimers()
    try {
      const { wrapper, activeChapterRef } = await mountTerminal({ prefersReduced: false, activeChapter: 6 })
      await reachDoneViaSkip(wrapper)

      // Sale a mitad del retorno (mix bajando, timers en vuelo).
      await vi.advanceTimersByTimeAsync(4000 + 300)
      await flushPromises()
      activeChapterRef.value = 5
      await flushPromises()

      // Reentra — startCycle() debe reiniciar la timeline completa desde
      // cero (boot → ... → done → ciclo), NO reanudar el ciclo viejo.
      activeChapterRef.value = 6
      await flushPromises()
      const countRightAfterReentry = wrapper.emitted('ascii-progress').length

      // Si hubiera dos secuencias corriendo en paralelo (la vieja no
      // cancelada + la nueva), el conteo de emisiones tras una vuelta
      // completa sería el DOBLE de una sola secuencia limpia. Reproduce el
      // mismo recorrido natural (9s streaming + skip) para la nueva entrada.
      await reachDoneViaSkip(wrapper)
      const emittedAfterFreshDone = wrapper.emitted('ascii-progress')
      const countAfterFreshDone = emittedAfterFreshDone.length

      // La reentrada debe verse exactamente como una timeline fresca: el
      // reposo final recién alcanzado emite mix≈1, no un valor intermedio
      // contaminado por la secuencia vieja.
      expect(emittedAfterFreshDone[emittedAfterFreshDone.length - 1][0].mix).toBeCloseTo(1, 5)

      // Avanza una vuelta de ciclo completa y confirma UN solo mix≈0 seguido
      // de UN solo retorno a mix≈1 — no un patrón de dos vueltas superpuestas
      // en el mismo tramo de tiempo (que produciría más transiciones de las
      // esperadas en esta ventana).
      await vi.advanceTimersByTimeAsync(4000 + 1300)
      await flushPromises()
      const afterOneReturn = wrapper.emitted('ascii-progress')
      const mixesInReturnWindow = afterOneReturn
        .slice(countAfterFreshDone)
        .map(([p]) => p.mix)
      expect(mixesInReturnWindow[mixesInReturnWindow.length - 1]).toBeLessThan(0.05)
      // Con una sola secuencia viva, el retorno pasa monótonamente de 1 a 0
      // (24 pasos) — dos ciclos superpuestos producirían un patrón no
      // monótono (una secuencia subiendo mientras la otra baja).
      for (let i = 1; i < mixesInReturnWindow.length; i++) {
        expect(mixesInReturnWindow[i]).toBeLessThanOrEqual(mixesInReturnWindow[i - 1] + 1e-9)
      }
    } finally {
      vi.useRealTimers()
    }
  })
})
