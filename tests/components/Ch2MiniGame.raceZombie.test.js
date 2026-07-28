// tests/components/Ch2MiniGame.raceZombie.test.js
//
// TASK-021 — fix del HIGH de cierre (review independiente, rango
// cd19950..4de0b3d, comentario del orquestador en tasks/TASK-021.json).
// Ver tests/components/Ch2MiniGame.raceDoubleInstance.test.js para la
// justificación completa del diseño (mismo mecanismo, mismo motivo). Este
// archivo cubre el escenario "zombie" en solitario.
//
// Por qué en solitario y no junto al doble-instancia en el mismo archivo:
// se intentó primero un único archivo con AMBOS specs compartiendo un mock
// estático + un gate mutable, reseteado entre tests vía `vi.resetModules()`.
// Se descartó tras comprobarlo empíricamente (repro aislado con `vue`
// mockeado + un contador en la factory): la factory de un `vi.mock()`
// ESTÁTICO se invoca UNA sola vez por archivo/worker — `vi.resetModules()`
// limpia el módulo CACHEADO para imports normales y para `vi.doMock()`, pero
// NO fuerza una re-invocación de una factory estática ya resuelta. El
// segundo test heredaba entonces la promesa YA RESUELTA del primero en vez
// de una nueva promesa pendiente, y el spec quedaba colgado a la espera de
// un estado `loading=true` que nunca llegaba a tiempo (se resolvía casi
// instantáneo, antes del primer poll).
//
// La solución no era volver a `vi.doMock()` (la fuente original del HIGH:
// re-registrar un mock en tiempo de ejecución puede perder la carrera contra
// un import() ya disparado, bajo contención de CPU real). La solución es que
// cada archivo tenga EXACTAMENTE UNA invocación del specifier
// '@/phaser/ch2/index.js' durante toda su vida — así la factory estática,
// hoisted al tope del archivo ANTES de cualquier otro código, corre
// exactamente una vez, de forma determinista, sin ninguna operación de
// registro en tiempo real que pueda perder ninguna carrera. Consecuencia:
// ni vi.doMock ni vi.resetModules hacen falta acá.
//
// Contención estructural (la parte que pidió el ticket): este spec vive en
// su propio archivo porque el aislamiento por worker de Vitest crea un
// module registry nuevo por archivo — si algo de este archivo sufriera
// contención, es estructuralmente imposible que envenene el registry de
// Ch2MiniGame.test.js (los 6 specs "felices" del shell) ni el de
// Ch2MiniGame.raceDoubleInstance.test.js.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const createMiniGameSpy = vi.fn(() => ({
  destroy: vi.fn(),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  scene: { pause: vi.fn(), resume: vi.fn() },
}))

// Única invocación del specifier en todo el archivo: la promesa se crea una
// vez, al hoist, y la factory (también hoisted, registrada una sola vez)
// siempre devuelve esta MISMA promesa diferida — sin gate mutable, sin
// resetModules, sin re-registro.
let releaseImport
const deferredImport = new Promise((resolve) => {
  releaseImport = resolve
})
vi.mock('@/phaser/ch2/index.js', async () => deferredImport)

import Ch2MiniGame from '@/components/Ch2MiniGame.vue'

async function waitForLoadingState(wrapper, expected, { tries = 25 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    if (wrapper.find('.ch2-minigame-loading').exists() === expected) return
  }
  throw new Error(
    `Timed out esperando .ch2-minigame-loading presente=${expected}`
  )
}

describe('Ch2MiniGame.vue — carrera async en mountGame(): zombie (archivo aislado, ver cabecera)', () => {
  it('activeChapter sale de 2 ANTES de que el import resuelva → el juego NO se crea', async () => {
    const activeChapter = ref(2)
    const wrapper = mount(Ch2MiniGame, {
      props: { active: true },
      global: {
        provide: {
          prm: { prefersReduced: ref(false) },
          scrollState: { activeChapter },
        },
      },
    })
    // El watch immediate dispara mountGame(): queda colgado en el await import().
    await waitForLoadingState(wrapper, true)
    expect(createMiniGameSpy).not.toHaveBeenCalled()

    // El visitante ya se fue de ch2 (scrolleó a ch3) ANTES de que el chunk de
    // Phaser resuelva — el escenario "zombie" del HIGH original de TASK-020.
    activeChapter.value = 0
    await flushPromises()

    // El chunk llega tarde y resuelve.
    releaseImport({
      createMiniGame: createMiniGameSpy,
      GAME_WIDTH: 360,
      GAME_HEIGHT: 420,
    })
    await flushPromises()
    await flushPromises()

    // Sin el guard, esto fallaría: createMiniGame() se invocaría igual y el
    // Phaser.Game arrancaría su rAF en background para siempre.
    expect(createMiniGameSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
