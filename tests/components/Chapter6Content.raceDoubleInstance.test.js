// tests/components/Chapter6Content.raceDoubleInstance.test.js
//
// TASK-022 — segundo escenario de la misma carrera (ver Chapter6Content.raceZombie.test.js
// para la justificación completa del diseño del arnés, idéntica acá): salir y
// volver a entrar a ch6 mientras el `await import('@/phaser')` original sigue
// en vuelo NO debe crear una segunda instancia de Phaser.Game ni disparar un
// segundo import real.
//
// Igual que en Ch2MiniGame.raceDoubleInstance.test.js: además del mock
// estático de '@/phaser' (specifier que Chapter6Content.vue importa), se
// mockea también 'phaser' (el paquete real, specifier DISTINTO) como señal
// causal — si el guard de producción (`game.value || loading.value`) fallara,
// un segundo `await import('@/phaser')` genuino caería al módulo REAL
// src/phaser/index.js, que a su vez hace `import Phaser from 'phaser'` real y
// construye un `Phaser.Game` de verdad (reventando en jsdom por falta de
// canvas real, o silenciosamente si algo lo tolera). Medir solo
// `createGameSpy.toHaveBeenCalledTimes(1)` sería insuficiente por la misma
// razón documentada en el hermano de ch2: el fallo real podría escapar por
// una vía distinta al mock y dar un falso verde.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createTestI18n } from '../i18n/test-helpers.js'

const createGameSpy = vi.fn(() => ({
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() },
  scale: { zoom: 1, setZoom: vi.fn() },
  destroy: vi.fn(),
}))

// Única invocación del specifier '@/phaser' en todo el archivo — ver cabecera.
let releaseImport
const deferredImport = new Promise((resolve) => {
  releaseImport = resolve
})
vi.mock('@/phaser', async () => deferredImport)

// Mock de 'phaser' — specifier DISTINTO, estático, invocado a lo sumo una vez
// por archivo. Señal causal: solo se invoca si algo construyó un Phaser.Game
// REAL (es decir, si el guard de producción falló y un segundo import cayó
// fuera del mock de arriba).
const phaserGameCtorSpy = vi.fn()
vi.mock('phaser', () => {
  class FakeScene {}
  class FakeGame {
    constructor(config) {
      phaserGameCtorSpy(config)
      this.destroy = vi.fn()
      this.scale = { zoom: 1, setZoom: vi.fn() }
      this.events = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() }
    }
  }
  return {
    default: {
      AUTO: 'AUTO',
      Scale: { NONE: 'NONE', NO_CENTER: 'NO_CENTER' },
      Game: FakeGame,
      Scene: FakeScene,
      BlendModes: { NORMAL: 'NORMAL', ADD: 'ADD' },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Display: { Shaders: { BaseShader: class BaseShader {} } },
      Curves: { CubicBezier: class CubicBezier {} },
      Math: { Vector2: class Vector2 {} },
      Geom: { Circle: class Circle {} },
      Renderer: { WebGL: { Pipelines: { PostFXPipeline: class PostFXPipeline {} } } },
    },
  }
})

vi.mock('@/data/projects', () => ({ projects: [] }))

import Chapter6Content from '@/components/Chapter6Content.vue'

async function settle({ tries = 30 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 5))
  }
}

describe('Chapter6Content.vue — TASK-022 carrera async: doble instancia (archivo aislado, ver cabecera)', () => {
  it('salir y volver a entrar con el import original en vuelo produce UNA sola instancia, no dos', async () => {
    const activeChapter = ref(0)
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(Chapter6Content, {
      global: {
        plugins: [i18n],
        provide: {
          scrollState: { activeChapter },
          prm: { prefersReduced: ref(false) },
        },
        stubs: { ProjectOverlay: true },
      },
    })
    await flushPromises() // chapter 0 → no monta todavía, ningún import iniciado

    // Entra a ch6: dispara el ÚNICO mountGame() que debería llegar a `await
    // import`; queda colgado ahí (game.value sigue null mientras tanto).
    activeChapter.value = 6
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    expect(createGameSpy).not.toHaveBeenCalled()

    // Sale y vuelve a entrar mientras el import original sigue sin resolver —
    // el patrón exacto del incidente "doble instancia". destroyGame() es
    // no-op (game.value null); el segundo mountGame() debe ser bloqueado por
    // el guard de `loading.value` ANTES de tocar `import()` de nuevo.
    activeChapter.value = 0
    await flushPromises()
    activeChapter.value = 6
    await flushPromises()

    releaseImport({ createGame: createGameSpy, computeZoom: vi.fn(() => 1) })
    await settle()

    // Sin el guard de `loading.value`, esto fallaría con 2+ llamadas a
    // createGameSpy, o con phaserGameCtorSpy invocado (instancia real
    // orquestada por fuera del mock) — cualquiera de los dos es una instancia
    // huérfana con su rAF corriendo y un canvas huérfano en el host.
    expect(createGameSpy).toHaveBeenCalledTimes(1)
    expect(phaserGameCtorSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
