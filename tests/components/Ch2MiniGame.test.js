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
// real por CDP (ver reporte de hand-off del developer para los números). Lo que
// SÍ puede probar jsdom, y es la prueba conductual equivalente: que
// createMiniGame() (y por lo tanto el Phaser.Game) NO se invoca mientras
// activeChapter !== 2, que SÍ se invoca al entrar a 2, y que un ciclo completo
// de salir-y-volver (dos veces, per instrucción del ticket) destruye y recrea
// sin quedar en un estado muerto silencioso.
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
