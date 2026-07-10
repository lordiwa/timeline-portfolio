// tests/components/DialUpScreen.test.js
// Tests del componente DialUpScreen.vue.
// Trigger: entrar a ch1 por primera vez en la sesión (sessionStorage guard).
// Los timers internos se controlan con vi.useFakeTimers().

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import DialUpScreen from '@/components/DialUpScreen.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock del engine y sfx para evitar síntesis real
vi.mock('@/audio/engine', () => ({
  engine: {
    isUnlocked: vi.fn(() => true),
    isMuted: vi.fn(() => false),
  },
  _reset: vi.fn(),
}))

vi.mock('@/audio/sfx', () => ({
  modemDial: vi.fn(),
  modemHandshake: vi.fn(),
}))

function mountDialUp({ locale = 'es', initialChapter = 0, prm = false } = {}) {
  const i18n = createTestI18n({ locale })
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(prm)

  const wrapper = mount(DialUpScreen, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, i18n, activeChapter, prefersReduced }
}

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
  sessionStorage.clear()
})

describe('DialUpScreen.vue', () => {
  // ── T1: no se muestra cuando el chapter activo no es 1 ────────────────────
  it('T1: NO renderiza cuando activeChapter=0', async () => {
    const { wrapper } = mountDialUp({ initialChapter: 0 })
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T2: se muestra al cambiar a ch1 por primera vez en la sesión ──────────
  it('T2: renderiza al cambiar activeChapter de 0 a 1 (primera vez)', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(true)
  })

  // ── T3: no se muestra si rm-dialup-seen ya está en sessionStorage ──────────
  it('T3: NO renderiza si rm-dialup-seen ya existe en sessionStorage', async () => {
    sessionStorage.setItem('rm-dialup-seen', '1')
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T4: no se muestra por segunda vez en la misma sesión ──────────────────
  it('T4: no renderiza por segunda vez (sessionStorage guard)', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    // Primera entrada a ch1 → muestra
    activeChapter.value = 1
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(true)

    // Simular skip
    const cancelBtn = wrapper.find('.win98-action-btn')
    if (cancelBtn.exists()) {
      await cancelBtn.trigger('click')
      await flushPromises()
    }

    // Volver a ch0 y luego a ch1 → NO debe mostrar
    activeChapter.value = 0
    await flushPromises()
    activeChapter.value = 1
    await flushPromises()
    // No se muestra porque sessionStorage ya tiene la marca
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T5: click en botón Cancelar → cierra (skip) ───────────────────────────
  it('T5: click en Cancelar cierra la ventana', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(true)

    const cancelBtn = wrapper.find('.win98-action-btn')
    expect(cancelBtn.exists()).toBe(true)
    await cancelBtn.trigger('click')
    await flushPromises()
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T6: click en ✕ de title bar → cierra ───────────────────────────────
  it('T6: click en botón ✕ cierra la ventana', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()

    const closeBtn = wrapper.find('.win98-btn--close')
    if (closeBtn.exists()) {
      await closeBtn.trigger('click')
      await flushPromises()
      vi.runAllTimers()
      await flushPromises()
      expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
    }
  })

  // ── T7: ESC cierra la ventana ───────────────────────────────────────────
  it('T7: keydown ESC cierra la ventana', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T8: tiene role="dialog" y aria-modal ──────────────────────────────────
  it('T8: ventana tiene role="dialog" y aria-modal="true"', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
  })

  // ── T9: muestra la barra de progreso ────────────────────────────────────
  it('T9: renderiza la barra de progreso con 20 bloques', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    activeChapter.value = 1
    await flushPromises()

    const blocks = wrapper.findAll('.dialup-progress__block')
    expect(blocks).toHaveLength(20)
  })

  // ── T10: PRM → la ventana se cierra sola rápido (1.5s + 300ms minimize) ───
  it('T10: con PRM activo, progress=100 y se cierra automáticamente', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0, prm: true })
    activeChapter.value = 1
    await flushPromises()
    // Con PRM: progress=100 desde el inicio
    const progressBar = wrapper.find('.dialup-progress')
    expect(progressBar.exists()).toBe(true)
    // Avanzar todos los timers: after(1500, closeDone) + after(300, done) = 1800ms+
    vi.runAllTimers()
    await flushPromises()
    expect(wrapper.find('.dialup-scrim').exists()).toBe(false)
  })

  // ── T11: guarda sessionStorage al trigger ─────────────────────────────────
  it('T11: al triggear ch1, guarda rm-dialup-seen en sessionStorage', async () => {
    const { wrapper, activeChapter } = mountDialUp({ initialChapter: 0 })
    expect(sessionStorage.getItem('rm-dialup-seen')).toBeNull()
    activeChapter.value = 1
    await flushPromises()
    expect(sessionStorage.getItem('rm-dialup-seen')).toBe('1')
  })

  // ── T12: title bar Win98 está presente ───────────────────────────────────
  it('T12: tiene title bar con fondo azul (#000080) visible en source', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const src = readFileSync(
      resolve(process.cwd(), 'src/components/DialUpScreen.vue'),
      'utf8'
    )
    expect(src).toMatch(/#000080/)  // título bar degradado Win98
    expect(src).toMatch(/#c0c0c0/)  // gris Win98
  })
})
