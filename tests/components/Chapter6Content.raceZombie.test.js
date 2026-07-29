// tests/components/Chapter6Content.raceZombie.test.js
//
// TASK-022 — misma carrera async que TASK-020/TASK-021 arreglaron en ch2,
// ahora en el `await import('@/phaser')` de Chapter6Content.vue. ch6 es el
// ORIGEN del patrón (ver tasks/TASK-022.json): el developer de ch2 replicó
// el ciclo de vida de ch6 fielmente, agujero incluido.
//
// Diseño del spec (idéntico a tests/components/Ch2MiniGame.raceZombie.test.js,
// ver su cabecera para la justificación completa): un único `vi.mock('@/phaser')`
// ESTÁTICO hoisted al tope del archivo, con una promesa diferida creada una
// sola vez. Nada de `vi.doMock`/`vi.resetModules` en runtime — eso es
// exactamente la fuente de la carrera de registro que causó el HIGH de
// TASK-021 bajo contención real de CPU (múltiples agentes corriendo en
// paralelo, la condición NORMAL de este proyecto). Este archivo vive aislado
// de sus hermanos (happy-path, doble-instancia) por la misma razón: el
// aislamiento por worker/archivo de Vitest crea un module registry nuevo por
// archivo, así que si algo acá sufre contención no puede envenenar ningún
// otro archivo.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createTestI18n } from '../i18n/test-helpers.js'

const createGameSpy = vi.fn(() => ({
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), once: vi.fn() },
  scale: { zoom: 1, setZoom: vi.fn() },
  destroy: vi.fn(),
}))

// Única invocación del specifier en todo el archivo — la promesa se crea una
// vez, al hoist, y la factory (también hoisted) siempre devuelve esta MISMA
// promesa diferida. Ver Ch2MiniGame.raceZombie.test.js para por qué esto es
// necesario (vi.resetModules() NO re-invoca una factory estática ya resuelta).
let releaseImport
const deferredImport = new Promise((resolve) => {
  releaseImport = resolve
})
vi.mock('@/phaser', async () => deferredImport)

vi.mock('@/data/projects', () => ({ projects: [] }))

import Chapter6Content from '@/components/Chapter6Content.vue'

describe('Chapter6Content.vue — TASK-022 carrera async: zombie (archivo aislado, ver cabecera)', () => {
  it('activeChapter sale de 6 ANTES de que el import resuelva → el Phaser.Game NO se crea', async () => {
    const activeChapter = ref(6)
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

    // El watch immediate dispara mountGame(): queda colgado en el await import().
    // No hay indicador visual de loading en Chapter6Content (a diferencia de
    // Ch2MiniGame), así que se espera un tick real en vez de una clase CSS.
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    expect(createGameSpy).not.toHaveBeenCalled()

    // El visitante ya se fue de ch6 (scrolleó a otro capítulo) ANTES de que el
    // chunk de Phaser resuelva — el escenario "zombie" de TASK-022.
    activeChapter.value = 0
    await flushPromises()

    // El chunk llega tarde y resuelve.
    releaseImport({ createGame: createGameSpy, computeZoom: vi.fn(() => 1) })
    await flushPromises()
    await flushPromises()

    // Sin el re-chequeo post-await de activeChapter, esto fallaría:
    // createGame() se invocaría igual y el Phaser.Game arrancaría su rAF en
    // background para siempre, aunque el visitante ya esté en otro capítulo.
    expect(createGameSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })
})
