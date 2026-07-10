// tests/components/EraTransition.test.js
// Pixel dissolve wipe entre eras — contratos:
// - no renderiza nada en reposo ni en el primer fire (oldN undefined)
// - cambio de era → overlay con data-chapter del DESTINO y 24×14=336 celdas
// - fase in → out tras IN+HOLD, desmonta al terminar
// - PRM: nunca dispara
// - cruce 2→3: nunca dispara (el drenado de ch2 es el signature)
// - retrigger en vuelo: NO reinicia, solo re-apunta data-chapter

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, readonly } from 'vue'
import EraTransition from '@/components/EraTransition.vue'

// El engine real crea AudioContext lazy; para este componente solo nos importa
// que whoosh no explote y que se llame únicamente con engine unlocked.
vi.mock('@/audio/engine', () => ({
  engine: { isUnlocked: vi.fn(() => false) },
}))
vi.mock('@/audio/sfx', () => ({
  whoosh: vi.fn(),
}))

import { engine } from '@/audio/engine'
import { whoosh } from '@/audio/sfx'

const CELLS = 24 * 14
const IN_MS = 200 + 150
const HOLD_MS = 100

function makeWrapper({ initialChapter = 0, prmValue = false } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(prmValue)
  const wrapper = mount(EraTransition, {
    global: {
      provide: {
        scrollState: { activeChapter: readonly(activeChapter) },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced }
}

describe('EraTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('en reposo no renderiza nada', () => {
    const { wrapper } = makeWrapper()
    expect(wrapper.find('.era-transition').exists()).toBe(false)
    wrapper.unmount()
  })

  it('cambio de era renderiza overlay con data-chapter destino y 336 celdas', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 0 })
    activeChapter.value = 4
    await flushPromises()
    const overlay = wrapper.find('.era-transition')
    expect(overlay.exists()).toBe(true)
    expect(overlay.attributes('data-chapter')).toBe('4')
    expect(overlay.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.era-transition__cell')).toHaveLength(CELLS)
    expect(overlay.classes()).toContain('era-transition--in')
    wrapper.unmount()
  })

  it('pasa a fase out tras IN+HOLD y desmonta al terminar', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    vi.advanceTimersByTime(IN_MS + HOLD_MS + 10)
    await flushPromises()
    expect(wrapper.find('.era-transition').classes()).toContain('era-transition--out')
    vi.advanceTimersByTime(IN_MS + 100)
    await flushPromises()
    expect(wrapper.find('.era-transition').exists()).toBe(false)
    wrapper.unmount()
  })

  it('PRM: no dispara', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 0, prmValue: true })
    activeChapter.value = 2
    await flushPromises()
    expect(wrapper.find('.era-transition').exists()).toBe(false)
    wrapper.unmount()
  })

  it('cruce 2→3 no dispara (signature drenado de ch2)', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 2 })
    activeChapter.value = 3
    await flushPromises()
    expect(wrapper.find('.era-transition').exists()).toBe(false)
    wrapper.unmount()
  })

  it('el cruce 3→2 (hacia atrás) SÍ dispara', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 3 })
    activeChapter.value = 2
    await flushPromises()
    expect(wrapper.find('.era-transition').exists()).toBe(true)
    wrapper.unmount()
  })

  it('retrigger en vuelo re-apunta data-chapter sin reiniciar', async () => {
    const { wrapper, activeChapter } = makeWrapper({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    const before = wrapper.findAll('.era-transition__cell')[0].attributes('style')
    activeChapter.value = 5
    await flushPromises()
    const overlay = wrapper.find('.era-transition')
    expect(overlay.attributes('data-chapter')).toBe('5')
    // Las celdas no se regeneraron (mismos delays) → no hubo reinicio
    expect(wrapper.findAll('.era-transition__cell')[0].attributes('style')).toBe(before)
    wrapper.unmount()
  })

  it('whoosh solo con engine unlocked', async () => {
    const a = makeWrapper({ initialChapter: 0 })
    a.activeChapter.value = 1
    await flushPromises()
    expect(whoosh).not.toHaveBeenCalled()
    a.wrapper.unmount()

    engine.isUnlocked.mockReturnValue(true)
    const b = makeWrapper({ initialChapter: 0 })
    b.activeChapter.value = 1
    await flushPromises()
    expect(whoosh).toHaveBeenCalledTimes(1)
    b.wrapper.unmount()
  })
})
