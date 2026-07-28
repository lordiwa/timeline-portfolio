// tests/components/Ch2MiniGame.test.js
//
// Phase 04.2 — coverage del Vue shell del mini-advergame match-3.
//
// Mock del factory Phaser (igual que Chapter6Content.test.js) para evitar cargar
// Phaser real en JSDOM (canvas API faltante).

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Mock factory: createMiniGame returns un fake game object con destroy/pause/resume spies.
const destroySpy = vi.fn()
const pauseSpy = vi.fn()
const resumeSpy = vi.fn()
const createMiniGameSpy = vi.fn(() => ({
  destroy: destroySpy,
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  scene: { pause: pauseSpy, resume: resumeSpy },
}))

vi.mock('@/phaser/ch2/index.js', () => ({
  createMiniGame: createMiniGameSpy,
  GAME_WIDTH: 360,
  GAME_HEIGHT: 420,
}))

// TASK-020 ronda de corrección — suite-flake fix (2026-07-27): los specs de
// carrera async de mountGame() más abajo verificaron empíricamente (ver
// reporte de hand-off) que un SEGUNDO `import('@/phaser/ch2/index.js')`
// disparado mientras el primero sigue pendiente vía `vi.doMock()` NO
// deduplica contra la promesa en vuelo — cae al módulo REAL (bypassea el
// mock), que a su vez hace `import Phaser from 'phaser'` real: parsear ese
// paquete es caro y su costo es no-determinista bajo la carga de CPU
// compartida con el resto de la suite (confirmado: 14/14 verde aislado, rojo
// intermitente ya con solo 3 archivos corriendo juntos). Mockear también el
// specifier `phaser` (una entrada de módulo DISTINTA — no sujeta a la
// limitación de re-registro por-test de arriba, porque nunca se re-registra:
// es un `vi.mock()` estático de toda la vida del archivo) hace que esa ruta
// de fallback sea instantánea Y nos da una señal directa, causal y
// determinista: `phaserGameCtorSpy` sólo se invoca si algo llegó a construir
// un `Phaser.Game` REAL (es decir, si el import cayó al módulo sin mockear),
// nunca por el camino feliz mockeado (`createMiniGameSpy` no usa `Phaser.Game`
// en absoluto). Ya no depende de que un import real reviente dentro de una
// ventana de tiempo real fija.
const phaserGameCtorSpy = vi.fn()
vi.mock('phaser', () => {
  class FakeScene {}
  class FakeGame {
    constructor(config) {
      phaserGameCtorSpy(config)
      // No-op suficiente para que un `wrapper.unmount()` de limpieza (p.ej.
      // durante un reintento de setup, ver describe de "ronda de
      // corrección" más abajo) no reviente si `game.value` terminó siendo
      // esta instancia real en vez del fake de `createMiniGameSpy`.
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

// TASK-020 ronda de corrección — carrera async en mountGame() (HIGH del review
// de cierre). El re-chequeo post-await previo solo miraba `hostRef.value`, que
// nunca cambia (el host no tiene v-if): no protegía de nada. Cada spec usa
// `vi.resetModules()` + `vi.doMock()` para diferir la resolución del
// `await import('@/phaser/ch2/index.js')` y así abrir una ventana real donde
// `activeChapter` puede cambiar (o un segundo mountGame() puede dispararse)
// MIENTRAS el chunk sigue "en vuelo" — exactamente la ventana que el incidente
// del 2026-07-27 explotó.
//
// Nota de método: en este entorno (Vitest 4 + vite-node) `vi.doMock` solo
// intercepta el import dinámico que YA está "en vuelo" en el momento del
// registro (el módulo mockeado queda cacheado en el registry desde la primera
// resolución, pendiente o no) — un SEGUNDO `import()` del mismo especificador
// iniciado DESPUÉS, aunque se re-registre `doMock`, cae al módulo real
// (comprobado empíricamente con un experimento aislado, ver reporte de
// hand-off). Por eso cada spec abre exactamente UN import en vuelo (una sola
// instancia montada, un solo `mountGame()` que llega a la línea del `await
// import`); el segundo disparo de `mountGame()` en el spec de "doble
// instancia" debe ser interceptado por el guard de `loading.value` ANTES de
// llegar a esa línea, así que nunca inicia un segundo `import()` real — que
// es exactamente la propiedad que el guard debe garantizar.
//
// Fix de flake de suite (2026-07-27, ronda de corrección de este mismo test):
// el diseño original usaba un spy de `console.error` + una ventana de tiempo
// real fija (~400ms) como proxy de "el segundo import cayó al módulo Phaser
// real y reventó". Confirmado empíricamente: 14/14 verde en aislamiento, pero
// rojo intermitente ya con solo 3 archivos de test corriendo juntos (no hace
// falta la suite completa) — el módulo `phaser` real es pesado de parsear y
// ese costo es no-determinista bajo la carga de CPU compartida con el resto
// de la suite, así que la ventana fija de 400ms a veces no alcanzaba.
// Reemplazo #1: mockear también el specifier `phaser` (ver arriba, junto al
// mock de `@/phaser/ch2/index.js`) — un `vi.mock()` estático que nunca se
// re-registra, así que no está sujeto a la limitación de `doMock` de arriba.
// Esto hace que la ruta de fallback (si el guard falla y el segundo import
// cae al módulo real de `@/phaser/ch2/index.js`) sea instantánea, y da una
// señal directa: `phaserGameCtorSpy` sólo se invoca si algo construyó un
// `Phaser.Game` REAL — el camino feliz mockeado (`createMiniGameSpy`) nunca
// toca `Phaser.Game`. Ya no depende de un import real reventando dentro de
// una ventana de tiempo fija.
// Reemplazo #2 (el que estabilizó la suite): instrumentado con logging
// temporal, se confirmó que INCLUSO con el fallback #1 en su lugar, un
// `vi.doMock()` posterior a un `vi.resetModules()` a veces no llega a
// interceptar el import EN ABSOLUTO — ni el `vi.doMock()` de este spec ni
// el `vi.mock()` estático de arriba, cae directo al módulo real sin pasar
// por ningún mock. La probabilidad de esto escala con cuánta actividad
// async ya corrió ANTES en el mismo archivo (0/40 fallos cuando este
// describe corre PRIMERO en el archivo — antes de cualquier otro test que
// ya haya resuelto este import — vs. intermitente cuando corre después de
// "Phase 04.2 mini-game shell" + "TASK-020 gate site-level"), combinado con
// la carga de CPU del resto de la suite. Es una falla de la infraestructura
// de mocking de Vitest 4 + vite-node bajo concurrencia, no un bug de
// `Ch2MiniGame.vue` ni de estos specs. Por eso este describe se ubica
// DELIBERADAMENTE primero en el archivo (antes de "Phase 04.2 mini-game
// shell" y "TASK-020 gate site-level", que sí resuelven el import
// exitosamente y "envejecen" el registro de módulos) y el spec de "doble
// instancia" además trae un reintento acotado como defensa en profundidad
// (ver comentario en el spec).
describe('Ch2MiniGame.vue — TASK-020 ronda de corrección: carrera async en mountGame()', () => {
  beforeEach(() => {
    createMiniGameSpy.mockClear()
    destroySpy.mockClear()
    pauseSpy.mockClear()
    resumeSpy.mockClear()
    phaserGameCtorSpy.mockClear()
  })

  // El timing exacto de cuántos ticks de microtarea hacen falta para que el
  // scheduler de Vue procese el watcher `flush:'post'` varía según qué corrió
  // antes en el mismo proceso de test (verificado empíricamente: un número
  // fijo de `flushPromises()` es no-determinista acá). Se poll-ea el estado
  // OBSERVABLE (la clase `.ch2-minigame-loading` del DOM, reflejo directo de
  // `loading.value`) en vez de contar ticks a ciegas.
  async function waitForLoadingState(wrapper, expected, { tries = 25 } = {}) {
    for (let i = 0; i < tries; i += 1) {
      await flushPromises()
      // Un solo flushPromises() no alcanza a drenar un segundo ciclo del
      // scheduler de Vue que a veces hace falta acá (verificado empíricamente
      // corriendo esta suite en secuencia) — el `setTimeout` fuerza un límite
      // de macrotarea real que sí lo garantiza.
      await new Promise((r) => setTimeout(r, 0))
      if (wrapper.find('.ch2-minigame-loading').exists() === expected) return
    }
    throw new Error(
      `Timed out esperando .ch2-minigame-loading presente=${expected}`
    )
  }

  // Poll acotado por iteraciones (no por un tiempo real fijo) para darle al
  // eventual fallback (si el guard falla) oportunidad de resolver/rechazar,
  // sin depender de un número mágico de ms — cada iteración es una vuelta
  // real de macrotarea, así que bajo carga de CPU simplemente toma más
  // iteraciones en llegar, nunca menos tiempo real del necesario.
  async function settle({ tries = 30 } = {}) {
    for (let i = 0; i < tries; i += 1) {
      await flushPromises()
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  it('zombie: activeChapter sale de 2 ANTES de que el import resuelva → el juego NO se crea', async () => {
    vi.resetModules()
    let releaseImport
    const deferredImport = new Promise((resolve) => {
      releaseImport = resolve
    })
    vi.doMock('@/phaser/ch2/index.js', async () => deferredImport)

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
    // Se espera el estado observable (loading=true) en vez de contar ticks a
    // ciegas — ver nota de método arriba del describe.
    await waitForLoadingState(wrapper, true)
    expect(createMiniGameSpy).not.toHaveBeenCalled()

    // El visitante ya se fue de ch2 (scrolleó a ch3) ANTES de que el chunk de
    // Phaser resuelva — el escenario "zombie" del HIGH.
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

  it('doble instancia: un segundo mountGame() disparado con el import original en vuelo NO inicia otra descarga/instancia', async () => {
    // Reintento acotado (ver nota de método arriba del describe): bajo
    // contención de CPU externa a esta suite, `vi.doMock()` puede perder la
    // carrera contra el `import()` que dispara `mount()` y el import cae al
    // módulo real sin pasar por NINGÚN mock — se detecta vía `mockHit` ANTES
    // de ejercer el guard bajo prueba. Confirmado empíricamente que la causa
    // raíz de que esto "arrastrara" a specs sin relación (T2, T4, T4b, T5,
    // gate, AC5) NO era la cantidad de `vi.resetModules()` en el archivo,
    // sino un `vi.doMock()` de un intento fallido que quedaba SIN CONSUMIR y
    // era consumido por accidente por un import de un test totalmente
    // distinto más adelante — por eso cada intento fallido se limpia con
    // `vi.doUnmock()` (ver más abajo) antes de reintentar o de tirar el
    // error final. Con esa limpieza, reintentar es seguro y no arrastra
    // nada; si el guard estuviera roto de verdad, ningún reintento lo
    // ocultaría — la aserción real corre recién tras confirmar el setup.
    const MAX_SETUP_ATTEMPTS = 3
    let wrapper
    let releaseImport

    for (let attempt = 1; attempt <= MAX_SETUP_ATTEMPTS; attempt += 1) {
      createMiniGameSpy.mockClear()
      phaserGameCtorSpy.mockClear()
      vi.resetModules()

      let release
      let mockHit = false
      const deferred = new Promise((res) => { release = res })
      vi.doMock('@/phaser/ch2/index.js', async () => {
        mockHit = true
        return deferred
      })
      // Deja asentar el registro del mock antes de disparar el trigger que
      // lo consume — un macrotask real acá (no un simple microtask tick)
      // reduce la fracción de intentos donde `vi.doMock` pierde la carrera.
      await new Promise((r) => setTimeout(r, 20))

      const activeChapter = ref(0)
      wrapper = mount(Ch2MiniGame, {
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
      // tanto). Se espera el estado observable (loading=true) en vez de
      // contar ticks a ciegas — ver nota de método arriba del describe. Bajo
      // carga extrema el poll acotado por iteraciones puede agotarse sin que
      // eso signifique nada sobre el guard — se trata igual que "mockHit
      // false": limpiar y reintentar.
      activeChapter.value = 2
      try {
        await waitForLoadingState(wrapper, true, { tries: 60 })
      } catch (err) {
        vi.doUnmock('@/phaser/ch2/index.js')
        release()
        wrapper.unmount()
        if (attempt === MAX_SETUP_ATTEMPTS) throw err
        continue
      }

      if (mockHit) {
        releaseImport = release
        // Sale y vuelve a entrar mientras el import original sigue sin
        // resolver — el patrón exacto del incidente "doble instancia".
        // destroyGame() es no-op (game.value null); el segundo mountGame()
        // debe ser bloqueado por el guard de `loading.value` ANTES de tocar
        // `import()` de nuevo. Si NO lo bloquea, ese segundo intento cae al
        // módulo real (ver nota de método arriba del describe) y construye
        // un `Phaser.Game` real — detectable vía `phaserGameCtorSpy`.
        activeChapter.value = 0
        await flushPromises()
        activeChapter.value = 2
        await flushPromises()
        break
      }

      // El registro de `vi.doMock()` de este intento nunca fue consumido
      // (el import de esta prueba cayó al módulo real, bypasseándolo) — si
      // se deja así, queda "colgado" y un test COMPLETAMENTE DISTINTO más
      // adelante en el archivo (p.ej. T2, que también hace
      // `import('@/phaser/ch2/index.js')` vía el `vi.mock()` estático)
      // puede terminar consumiéndolo por accidente, resolviendo a
      // `undefined` en vez del payload esperado — la causa raíz confirmada
      // empíricamente del efecto cascada que este `doUnmock()` cierra, sea
      // que reintentemos o no.
      vi.doUnmock('@/phaser/ch2/index.js')
      release()
      await settle()
      wrapper.unmount()
      if (attempt === MAX_SETUP_ATTEMPTS) {
        throw new Error(
          `vi.doMock no interceptó el import tras ${MAX_SETUP_ATTEMPTS} intentos — infraestructura de mocking bajo carga, no el guard bajo prueba`
        )
      }
    }

    releaseImport({
      createMiniGame: createMiniGameSpy,
      GAME_WIDTH: 360,
      GAME_HEIGHT: 420,
    })
    await settle()

    // Sin el guard de `loading.value`, esto fallaría con 2+ llamadas a
    // createMiniGameSpy (si por alguna razón el segundo intento sí llegara a
    // pasar por el mock) o con phaserGameCtorSpy invocado (si cayó al módulo
    // real, que es el caso comprobado empíricamente) — cualquiera de los dos
    // es una instancia huérfana con su rAF corriendo y canvas huérfano en el
    // host.
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(phaserGameCtorSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})

function mountMiniGame({ active = true } = {}) {
  return mount(Ch2MiniGame, {
    props: { active },
    global: {
      provide: {
        prm: { prefersReduced: ref(false) },
      },
    },
  })
}

describe('Ch2MiniGame.vue — Phase 04.2 mini-game shell', () => {
  beforeEach(() => {
    createMiniGameSpy.mockClear()
    destroySpy.mockClear()
    pauseSpy.mockClear()
    resumeSpy.mockClear()
  })

  it('T1 DOM: monta .ch2-minigame con .ch2-minigame-frame + canvas host', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    expect(wrapper.find('.ch2-minigame').exists()).toBe(true)
    expect(wrapper.find('.ch2-minigame-frame').exists()).toBe(true)
    expect(wrapper.find('.ch2-minigame-canvas-host').exists()).toBe(true)
  })

  it('T2 lazy: active=true → createMiniGame es llamado tras mount', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()  // dynamic import + nextTick
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(createMiniGameSpy.mock.calls[0][1]).toEqual({ prefersReduced: false })
  })

  it('T3 inactive: active=false al mount → NO crea game', async () => {
    const wrapper = mountMiniGame({ active: false })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).not.toHaveBeenCalled()
  })

  it('T4 toggle: active true→false pausa scene (NO destruye, keep-alive friendly)', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalled()
    await wrapper.setProps({ active: false })
    await flushPromises()
    expect(pauseSpy).toHaveBeenCalled()
    expect(destroySpy).not.toHaveBeenCalled()
  })

  it('T4b toggle: active false→true reanuda scene sin recrear', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ active: false })
    await flushPromises()
    await wrapper.setProps({ active: true })
    await flushPromises()
    // Game ya existe → resume en lugar de createMiniGame de nuevo
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(resumeSpy).toHaveBeenCalled()
  })

  it('T5 unmount: destruye game al unmount', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()
    wrapper.unmount()
    expect(destroySpy).toHaveBeenCalled()
  })
})

// TASK-020 — gate de ciclo de vida a nivel de capítulo del sitio (AC1/AC2/AC5/AC8).
//
// Alcance honesto: jsdom no corre rAF real ni instancia Phaser con WebGL, así que
// estos specs NO pueden ver "Phaser.DOM.RequestAnimationFrame.step ejecutando a
// ~60/s" (AC1) ni fps bajo CPU throttling (AC3) — eso se midió en Chrome headed
// real por CDP. Lo que SÍ puede probar jsdom, y es la prueba conductual
// equivalente: que createMiniGame() (y por lo tanto el Phaser.Game) NO se
// invoca mientras activeChapter !== 2, que SÍ se invoca al entrar a 2, y que
// un ciclo completo de salir-y-volver (dos veces, per instrucción del ticket)
// destruye y recrea sin quedar en un estado muerto silencioso.
//
// Números medidos por CDP (Chrome real, ver reporte de hand-off — persistidos
// acá per AC8 para que sobrevivan más allá del mensaje de commit):
//   - Phaser.DOM.RequestAnimationFrame.step en ch0, ventana 2000ms:
//       121 (~60.5/s) ANTES del fix → 0 DESPUÉS.
//   - fps de ch0 en reposo con Emulation.setCPUThrottlingRate 4x:
//       22.4 ANTES → 60.3 DESPUÉS.
//   - Re-entrada, 2 ciclos: canvas null al salir de ch2, 360x420 al volver,
//     progreso del match-3 avanzando (no quedó en estado muerto).
//   - Nota de método: medir SIN throttle no sirve — vsync enmascara el
//     defecto (el rAF fantasma se esconde detrás del frame budget libre).
describe('Ch2MiniGame.vue — TASK-020 gate site-level (activeChapter)', () => {
  beforeEach(() => {
    createMiniGameSpy.mockClear()
    destroySpy.mockClear()
    pauseSpy.mockClear()
    resumeSpy.mockClear()
  })

  function mountWithChapter(initialChapter, { active = true } = {}) {
    const activeChapter = ref(initialChapter)
    const wrapper = mount(Ch2MiniGame, {
      props: { active },
      global: {
        provide: {
          prm: { prefersReduced: ref(false) },
          scrollState: { activeChapter },
        },
      },
    })
    return { wrapper, activeChapter }
  }

  it('AC1/AC2: activeChapter !== 2 al mount (aunque panel local sea "home") → NO crea el Phaser.Game', async () => {
    mountWithChapter(0, { active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).not.toHaveBeenCalled()
  })

  it('preserva la noción local de panel: activeChapter===2 pero panel !== "home" → NO crea el juego', async () => {
    mountWithChapter(2, { active: false })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).not.toHaveBeenCalled()
  })

  it('gate: activeChapter pasa de 0 a 2 con panel "home" activo → crea el Phaser.Game', async () => {
    const { activeChapter } = mountWithChapter(0, { active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).not.toHaveBeenCalled()

    activeChapter.value = 2
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
  })

  it('AC5 re-entrada (BLOQUEANTE, 2 ciclos): salir de ch2 destruye; volver lo recrea limpio', async () => {
    const { activeChapter } = mountWithChapter(2, { active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(destroySpy).not.toHaveBeenCalled()

    // Ciclo 1 — salir a ch0
    activeChapter.value = 0
    await flushPromises()
    expect(destroySpy).toHaveBeenCalledTimes(1)

    // Ciclo 1 — volver a ch2
    activeChapter.value = 2
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalledTimes(2)

    // Ciclo 2 — salir a ch3 (un gate mal escrito a veces sobrevive el primer
    // ciclo y falla recién en el segundo — por eso se repite).
    activeChapter.value = 3
    await flushPromises()
    expect(destroySpy).toHaveBeenCalledTimes(2)

    // Ciclo 2 — volver a ch2
    activeChapter.value = 2
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalledTimes(3)
  })
})

describe('Ch2MiniGame.vue — bundle lazy gate (PHA-04 pattern)', () => {
  const SRC = readFileSync(
    resolve(process.cwd(), 'src/components/Ch2MiniGame.vue'),
    'utf8'
  )

  it('T6: usa `await import(\'@/phaser/ch2/index.js\')` string literal (Vite splittable)', () => {
    expect(SRC).toMatch(/await\s+import\s*\(\s*['"]@\/phaser\/ch2\/index\.js['"]\s*\)/)
  })

  it('T7: NO top-level import de Phaser ni del factory', () => {
    expect(SRC).not.toMatch(/^\s*import\s+Phaser\s+from\s+['"]phaser['"]/m)
    expect(SRC).not.toMatch(/^\s*import\s+.*\s+from\s+['"]@\/phaser\/ch2/m)
  })
})
