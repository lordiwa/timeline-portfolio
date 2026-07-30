// tests/components/SoundToggle.test.js
// Tests del componente SoundToggle.vue.
// AudioContext mockeado globalmente en setup.js.
// engine._reset() limpia el singleton entre tests.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el source para asserts de CSS
const SOUND_TOGGLE_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/SoundToggle.vue'),
  'utf8'
)

// Mock del módulo engine — vitest lo hoista automáticamente al top del módulo.
// Los vi.fn() quedan accesibles via import directo tras el mock.
vi.mock('@/audio/engine', () => {
  const isUnlocked = vi.fn(() => false)
  const isMuted = vi.fn(() => false)
  const unlock = vi.fn().mockResolvedValue(undefined)
  const setMuted = vi.fn()
  const ensureContext = vi.fn()
  const getMasterGain = vi.fn()
  const getContext = vi.fn()
  return {
    engine: { isUnlocked, isMuted, unlock, setMuted, ensureContext, getMasterGain, getContext },
    _reset: vi.fn(),
  }
})

// Mock de sfx para que no haya síntesis real
vi.mock('@/audio/sfx', () => ({
  beep: vi.fn(),
  keyclick: vi.fn(),
  uiClick: vi.fn(),
  uiHover: vi.fn(),
}))

// Importar DESPUÉS de los mocks para obtener las versiones mockeadas
import { engine } from '@/audio/engine'
import SoundToggle from '@/components/SoundToggle.vue'

function mountSoundToggle({ muted = false, unlocked = false } = {}) {
  // Reconfigurar el mock según el test
  engine.isUnlocked.mockReturnValue(unlocked)
  engine.isMuted.mockReturnValue(muted)

  const mutedRef = ref(muted)
  const toggleFn = vi.fn(() => { mutedRef.value = !mutedRef.value })
  const playCurrentEra = vi.fn()

  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(SoundToggle, {
    global: {
      plugins: [i18n],
      provide: {
        audio: { muted: mutedRef, toggle: toggleFn, playCurrentEra },
      },
    },
  })
  return { wrapper, mutedRef, toggleFn, playCurrentEra }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('SoundToggle.vue', () => {
  // ── T1: renderiza un botón con aria-label ────────────────────────────────────
  it('T1: renderiza button.sound-toggle con aria-label no vacío (es)', () => {
    const { wrapper } = mountSoundToggle({ unlocked: true, muted: false })
    const btn = wrapper.find('button.sound-toggle')
    expect(btn.exists()).toBe(true)
    const ariaLabel = btn.attributes('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel.length).toBeGreaterThan(0)
  })

  // ── T2: estado ON — tiene clase sound-toggle--on y SVG visible ──────────────
  it('T2: estado on → clase sound-toggle--on y SVG presente', () => {
    const { wrapper } = mountSoundToggle({ unlocked: true, muted: false })
    const btn = wrapper.find('button.sound-toggle')
    expect(btn.classes()).toContain('sound-toggle--on')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  // ── T3: estado OFF — tiene clase sound-toggle--off ──────────────────────────
  it('T3: estado muted=true → clase sound-toggle--off', () => {
    const { wrapper } = mountSoundToggle({ unlocked: true, muted: true })
    const btn = wrapper.find('button.sound-toggle')
    expect(btn.classes()).toContain('sound-toggle--off')
  })

  // ── T4: estado LOCKED — tiene clase sound-toggle--locked ─────────────────────
  it('T4: unlocked=false → clase sound-toggle--locked', () => {
    const { wrapper } = mountSoundToggle({ unlocked: false, muted: false })
    const btn = wrapper.find('button.sound-toggle')
    expect(btn.classes()).toContain('sound-toggle--locked')
  })

  // ── T5: click con unlocked=true llama toggle() del provide ──────────────────
  it('T5: click con unlocked=true llama toggle() del audio provide', async () => {
    engine.isUnlocked.mockReturnValue(true)
    const mutedRef = ref(false)
    const toggleFn = vi.fn()
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(SoundToggle, {
      global: {
        plugins: [i18n],
        provide: {
          audio: { muted: mutedRef, toggle: toggleFn, playCurrentEra: vi.fn() },
        },
      },
    })
    await wrapper.find('button.sound-toggle').trigger('click')
    await flushPromises()
    expect(toggleFn).toHaveBeenCalledOnce()
  })

  // ── T6: aria-label reactivo según estado muted ───────────────────────────────
  it('T6: aria-label refleja estado on/off reactivamente', async () => {
    engine.isUnlocked.mockReturnValue(true)
    engine.isMuted.mockReturnValue(false)

    const mutedRef = ref(false)
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(SoundToggle, {
      global: {
        plugins: [i18n],
        provide: {
          audio: { muted: mutedRef, toggle: vi.fn(), playCurrentEra: vi.fn() },
        },
      },
    })

    // Estado ON → aria incluye "activado"
    const labelOn = wrapper.find('button').attributes('aria-label')
    expect(labelOn).toContain('activado')

    // Cambiar a muted → aria incluye "silenciado"
    mutedRef.value = true
    await flushPromises()
    const labelOff = wrapper.find('button').attributes('aria-label')
    expect(labelOff).toContain('silenciado')
  })

  // ── T7: CSS posición fixed, bottom-left, z-index:40, min-w/h 44px ───────────
  it('T7: source contiene position:fixed, bottom/left, z-index:40, min-width/height 44px', () => {
    expect(SOUND_TOGGLE_SOURCE).toMatch(/position:\s*fixed/)
    expect(SOUND_TOGGLE_SOURCE).toMatch(/left:\s*var\(--sp-md\)/)
    expect(SOUND_TOGGLE_SOURCE).toMatch(/z-index:\s*40/)
    expect(SOUND_TOGGLE_SOURCE).toMatch(/min-width:\s*44px/)
    expect(SOUND_TOGGLE_SOURCE).toMatch(/min-height:\s*44px/)
  })

  // ── T9 (TASK-019, AC5): bottom base sube 44px sobre --sp-md para despejar
  // el HUD diegético de esquina de ch4 (.ch4-hud-bl, medido en Chrome real a
  // 1536×791 dpr1.25) — ver comentario en el <style scoped> del componente.
  // Mobile (<600px o alto corto de teléfono) conserva el inset original.
  it('T9 (TASK-019): CSS .sound-toggle base declara bottom: calc(var(--sp-md) + 44px)', () => {
    const baseMatch = SOUND_TOGGLE_SOURCE.match(/\.sound-toggle\s*\{[\s\S]*?\}/)
    expect(baseMatch).not.toBeNull()
    expect(baseMatch[0]).toMatch(/bottom:\s*calc\(var\(--sp-md\)\s*\+\s*44px\)/)
  })

  it('T10 (TASK-019): mobile (max-width:599px o max-height:500px) restaura bottom: var(--sp-sm)', () => {
    const mobileMatch = SOUND_TOGGLE_SOURCE.match(
      /@media \(max-width: 599px\), \(max-height: 500px\) \{\s*\.sound-toggle\s*\{[\s\S]*?\}/
    )
    expect(mobileMatch).not.toBeNull()
    expect(mobileMatch[0]).toMatch(/bottom:\s*var\(--sp-sm\)/)
  })

  // ── T8: aria-pressed="true" cuando estado es on ─────────────────────────────
  it('T8: aria-pressed="true" cuando unlocked=true y muted=false', () => {
    engine.isUnlocked.mockReturnValue(true)
    engine.isMuted.mockReturnValue(false)

    const mutedRef = ref(false)
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(SoundToggle, {
      global: {
        plugins: [i18n],
        provide: {
          audio: { muted: mutedRef, toggle: vi.fn(), playCurrentEra: vi.fn() },
        },
      },
    })
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
  })
})
