// tests/components/Ch2MiniGame.test.js
//
// Phase 04.2 — coverage del Vue shell del mini-advergame match-3.
//
// Mock del factory Phaser (igual que Chapter6Content.test.js) para evitar cargar
// Phaser real en JSDOM (canvas API faltante).

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Mock factory: createMiniGame returns un fake game object con destroy spy.
const destroySpy = vi.fn()
const createMiniGameSpy = vi.fn(() => ({
  destroy: destroySpy,
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  scene: { pause: vi.fn(), resume: vi.fn() },
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

  it('T4 toggle: active true→false destruye game', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()
    expect(createMiniGameSpy).toHaveBeenCalled()
    await wrapper.setProps({ active: false })
    await flushPromises()
    expect(destroySpy).toHaveBeenCalled()
  })

  it('T5 unmount: destruye game al unmount', async () => {
    const wrapper = mountMiniGame({ active: true })
    await flushPromises()
    await flushPromises()
    wrapper.unmount()
    expect(destroySpy).toHaveBeenCalled()
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
