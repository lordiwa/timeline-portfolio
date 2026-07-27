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

import Ch2MiniGame from '@/components/Ch2MiniGame.vue'

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
// iniciado DESPUÉS, aunque se re-registre `doMock`, puede caer al módulo real
// (comprobado empíricamente: cargó Phaser real y falló en
// `CanvasFeatures.js` por falta de canvas en jsdom). Por eso cada spec abre
// exactamente UN import en vuelo (una sola instancia montada, un solo
// `mountGame()` que llega a la línea del `await import`); el segundo disparo
// de `mountGame()` en el spec de "doble instancia" es interceptado por el
// guard de `loading.value` ANTES de llegar a esa línea, así que nunca inicia
// un segundo `import()` real — que es exactamente la propiedad que el guard
// debe garantizar.
describe('Ch2MiniGame.vue — TASK-020 ronda de corrección: carrera async en mountGame()', () => {
  beforeEach(() => {
    createMiniGameSpy.mockClear()
    destroySpy.mockClear()
    pauseSpy.mockClear()
    resumeSpy.mockClear()
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

  it('zombie: activeChapter sale de 2 ANTES de que el import resuelva → el juego NO se crea', async () => {
    vi.resetModules()
    let releaseImport
    const deferredImport = new Promise((resolve) => {
      releaseImport = resolve
    })
    vi.doMock('@/phaser/ch2/index.js', () => deferredImport)

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
    // `vi.doMock` en este entorno solo intercepta el import dinámico que
    // consume la PRIMERA llamada — si el guard de `loading.value` no
    // bloqueara el segundo `mountGame()` ANTES de la línea `await import`,
    // ese segundo intento caería al módulo `phaser` real (sin mockear) y
    // reventaría en jsdom (falta canvas real) — exactamente la señal que
    // distingue "el guard bloqueó a tiempo" de "se coló un segundo intento".
    // Sin este spy, un `createMiniGameSpy` llamado 1 vez es ambiguo: podría
    // significar que el guard funcionó, O que el segundo intento fue
    // bloqueado por accidente porque su promesa de fallback no llegó a
    // resolver dentro de la ventana del test (falso verde comprobado
    // empíricamente durante el desarrollo de este spec).
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.resetModules()
    let releaseImport
    const deferredImport = new Promise((resolve) => {
      releaseImport = resolve
    })
    vi.doMock('@/phaser/ch2/index.js', () => deferredImport)

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
    // tanto). Se espera el estado observable (loading=true) antes de
    // disparar el segundo intento — ver nota de método arriba del describe.
    activeChapter.value = 2
    await waitForLoadingState(wrapper, true)

    // Sale y vuelve a entrar mientras el import original sigue sin resolver —
    // el patrón exacto del incidente "doble instancia". destroyGame() es
    // no-op (game.value null); el segundo mountGame() debe ser bloqueado por
    // el guard de `loading.value` ANTES de tocar `import()` de nuevo.
    activeChapter.value = 0
    await flushPromises()
    activeChapter.value = 2
    await flushPromises()

    releaseImport({
      createMiniGame: createMiniGameSpy,
      GAME_WIDTH: 360,
      GAME_HEIGHT: 420,
    })
    await flushPromises()
    await flushPromises()

    // Ventana de seguridad real (no microtask): si el guard NO bloqueó el
    // segundo intento, ese intento cae al módulo `phaser` real, que tarda
    // ~300ms en fallar en jsdom (comprobado empíricamente) antes de loguear
    // el error vía `console.error` dentro del catch del componente.
    await new Promise((r) => setTimeout(r, 400))

    // Sin el guard de `loading.value`, esto fallaría con 2+ llamadas (o con
    // errSpy invocado por el intento fallido que cayó al módulo real) y una
    // instancia huérfana con su rAF corriendo y canvas huérfano en el host.
    expect(createMiniGameSpy).toHaveBeenCalledTimes(1)
    expect(errSpy).not.toHaveBeenCalled()

    wrapper.unmount()
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
