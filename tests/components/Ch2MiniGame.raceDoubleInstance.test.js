// tests/components/Ch2MiniGame.raceDoubleInstance.test.js
//
// TASK-021 — fix del HIGH de cierre (review independiente, rango
// cd19950..4de0b3d, comentario del orquestador en tasks/TASK-021.json).
//
// Historia: este spec (doble instancia) y su hermano "zombie" vivían dentro
// de tests/components/Ch2MiniGame.test.js junto a los otros 6 specs del
// shell. TASK-020 y su "ronda de corrección" (c054d96, 4de0b3d) declararon
// eliminada la firma "verde aislado, rojo en suite completa" — pero el
// reviewer de TASK-021 corrió la suite completa 4 veces y la reprodujo 3/4:
// la misma cascada de 7 tests rojos en ese archivo. En aislamiento (ese
// único archivo solo), 3/3 verde, 14/14.
//
// Mecánica confirmada por el reviewer: bajo contención real de CPU — OTRO
// proceso de vitest corriendo en paralelo, que en este proyecto
// multi-agente es la condición NORMAL, no un pico excepcional —
// `vi.doMock()` perdía la carrera de registro contra el `import()` ya
// disparado por `mount()`. El spec de doble instancia agotaba sus 3
// reintentos y tiraba su error de infraestructura; pese al `vi.doUnmock()`
// de limpieza, el registry del specifier '@/phaser/ch2/index.js' quedaba
// envenenado y arrastraba a los 6 tests hermanos, que morían con
// "[vitest] vi.mock(...) is not returning an object" dentro de mountGame().
//
// Fix con dos capas — la primera es la contención estructural que pidió el
// ticket, la segunda elimina la causa de raíz de la CARRERA DE REGISTRO en
// vez de sólo contenerla:
//
// 1) CONTENCIÓN ESTRUCTURAL: este spec vive en su propio archivo, separado
//    incluso de su hermano "zombie" (ver Ch2MiniGame.raceZombie.test.js). El
//    aislamiento por worker/archivo de Vitest crea un module registry NUEVO
//    por archivo — si algo acá sufre contención, es estructuralmente
//    imposible que envenene el registry de Ch2MiniGame.test.js (los 6
//    specs "felices" del shell) ni el de Ch2MiniGame.raceZombie.test.js. No
//    es disciplina de limpieza en runtime (lo que ya existía y falló), es
//    una garantía de la herramienta.
//
// 2) RAÍZ DE LA CARRERA DE REGISTRO: la fuente del HIGH era re-registrar un
//    mock NUEVO en tiempo de ejecución (`vi.doMock`) mientras un `import()`
//    ya estaba en vuelo — esa operación de REGISTRO podía perder la carrera
//    bajo contención de CPU real. Acá el specifier '@/phaser/ch2/index.js'
//    se mockea UNA sola vez, estáticamente, hoisted al tope del archivo —
//    nunca se re-registra, así que no queda ninguna operación de registro
//    en tiempo real que pueda perder una carrera. Se probó primero (y se
//    descartó) un único archivo con ambos specs compartiendo esta factory
//    estática más un gate mutable reseteado vía `vi.resetModules()` entre
//    tests: falló porque la factory de un `vi.mock()` estático se invoca
//    UNA sola vez por archivo/worker — confirmado empíricamente con un
//    repro aislado (mock de `vue` + contador) — y `vi.resetModules()` NO la
//    re-invoca. De ahí la partición en dos archivos de un solo spec cada
//    uno: la única forma de que cada spec tenga su propia invocación limpia
//    de la factory sin volver a vi.doMock.
//
// IMPORTANTE — por qué este archivo SÍ conserva el mock de fallback de
// 'phaser' (a diferencia de un diseño más simple que se descartó): plantar
// el rojo revirtiendo el guard de producción en memoria (`if (game.value ||
// loading.value) return` → `if (game.value) return`, ver hand-off de este
// ticket) reveló que, incluso con la factory estática garantizada para la
// PRIMERA invocación, un SEGUNDO `await import('@/phaser/ch2/index.js')`
// genuino y concurrente (el que el guard debe impedir) NO reutiliza la
// promesa mockeada en vuelo — vite-node no dedupea ese segundo import
// dinámico contra el mock ya resuelto/en curso, y cae al módulo REAL, que
// a su vez hace `import Phaser from 'phaser'` real y revienta dentro de
// jsdom (`Cannot set properties of null (setting 'fillStyle')` en
// CanvasFeatures.js). Ese error queda atrapado por el `try/catch` de
// mountGame() y silenciado vía `console.error` — así que medir sólo
// `createMiniGameSpy.toHaveBeenCalledTimes(1)` da un FALSO VERDE con el
// guard roto (la segunda instancia nunca llega a `createMiniGame()`, no
// porque el guard la haya bloqueado, sino porque su import reventó antes).
// Mockear también 'phaser' (specifier DISTINTO, también estático, también
// invocado una sola vez por archivo) convierte esa ruta de fallback en
// instantánea y da la señal causal real: `phaserGameCtorSpy` sólo se
// invoca si algo llegó a construir un `Phaser.Game` — es decir, si el
// import cayó fuera del mock de arriba, que es exactamente lo que pasa
// cuando el guard falla. Ver la prueba de replantado de rojo en el
// hand-off: con el guard roto, `phaserGameCtorSpy` SÍ se invoca.
//
// Consecuencia práctica: sin vi.doMock, no hay ningún "intento fallido de
// infraestructura" que reintentar ni que limpiar con vi.doUnmock — ambos
// mocks están garantizados desde el hoist, así que este test corre una
// sola vez y sus aserciones son la única fuente de rojo/verde. El
// reintento acotado de 3 intentos del diseño anterior deja de hacer falta.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const createMiniGameSpy = vi.fn(() => ({
  destroy: vi.fn(),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  scene: { pause: vi.fn(), resume: vi.fn() },
}))

// Única invocación del specifier en todo el archivo — ver cabecera.
let releaseImport
const deferredImport = new Promise((resolve) => {
  releaseImport = resolve
})
vi.mock('@/phaser/ch2/index.js', async () => deferredImport)

// Mock de 'phaser' — specifier DISTINTO, estático, invocado a lo sumo una
// vez por archivo. Da la señal causal de que el guard falló: sólo se
// invoca si algo construyó un Phaser.Game REAL (ver cabecera).
const phaserGameCtorSpy = vi.fn()
vi.mock('phaser', () => {
  class FakeScene {}
  class FakeGame {
    constructor(config) {
      phaserGameCtorSpy(config)
      this.destroy = vi.fn()
      this.scene = { pause: vi.fn(), resume: vi.fn() }
      this.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn() }
    }
  }
  return {
    default: {
      AUTO: 'AUTO',
      Scale: { FIT: 'FIT', CENTER_BOTH: 'CENTER_BOTH' },
      Game: FakeGame,
      Scene: FakeScene,
      Math: { Between: () => 0 },
    },
  }
})

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

async function settle({ tries = 30 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 5))
  }
}

describe('Ch2MiniGame.vue — carrera async en mountGame(): doble instancia (archivo aislado, ver cabecera)', () => {
  it('un segundo mountGame() disparado con el import original en vuelo NO inicia otra descarga/instancia', async () => {
    const activeChapter = ref(0)
    const wrapper = mount(Ch2MiniGame, {
      props: { active: true },
      global: {
        provide: {
          prm: { prefersReduced: ref(false) },
          scrollState: { activeChapter },
        },
      },
    })
    await flushPromises() // chapter 0 → no monta todavía, ningún import iniciado

    // Entra a ch2: dispara el ÚNICO mountGame() que debería llegar a
    // `await import`; queda colgado ahí (game.value sigue null mientras
    // tanto).
    activeChapter.value = 2
    await waitForLoadingState(wrapper, true)

    // Sale y vuelve a entrar mientras el import original sigue sin resolver
    // — el patrón exacto del incidente "doble instancia". destroyGame() es
    // no-op (game.value null); el segundo mountGame() debe ser bloqueado
    // por el guard de `loading.value` ANTES de tocar `import()` de nuevo.
    // Si NO lo bloquea, ese segundo intento dispara un `import()` genuino y
    // concurrente que cae fuera del mock de arriba (ver cabecera) y
    // construye un `Phaser.Game` real — detectable vía `phaserGameCtorSpy`.
    activeChapter.value = 0
    await flushPromises()
    activeChapter.value = 2
    await flushPromises()

    releaseImport({
      createMiniGame: createMiniGameSpy,
      GAME_WIDTH: 360,
      GAME_HEIGHT: 420,
    })
    await settle()

    // Sin el guard de `loading.value`, esto fallaría con 2+ llamadas a
    // createMiniGameSpy (si por alguna razón el segundo intento sí pasara
    // por el mock) o con phaserGameCtorSpy invocado (el caso real,
    // confirmado en el replantado de rojo del hand-off) — cualquiera de
    // los dos es una instancia huérfana con su rAF corriendo y canvas
    // huérfano en el host.
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(phaserGameCtorSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
