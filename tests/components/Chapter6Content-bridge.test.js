// tests/components/Chapter6Content-bridge.test.js
//
// Phase 5 W0 — RED scaffold integration tests del bridge Phaser ↔ Vue (PHA-07).
//
// Cobertura (3 tests):
//   T1: game emit `show-project` → activeProject Vue ref se setea → <ProjectOverlay> v-if
//       renderea (stub component).
//   T2: emit `arrival-complete` → arrivalDone.value = true → .ch6-mantra v-if visible.
//   T3: activeChapter 6→5 resetea activeProject (null) y arrivalDone (false).
//
// Analogs:
//   - tests/components/Chapter4Content.test.js (mount + provide pattern)
//   - 05-RESEARCH.md §Pattern 6 (project click bridge)
//
// RED scaffold W0 — verde tras W3 (Chapter6Content) + W4 (ProjectOverlay stub).

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/phaser', () => ({
  createGame: vi.fn(() => ({
    events: {
      _listeners: {},
      on(name, fn) { (this._listeners[name] ||= []).push(fn) },
      off: vi.fn(),
      emit(name, ...args) { (this._listeners[name] || []).forEach((fn) => fn(...args)) },
    },
    scale: { zoom: 3, setZoom: vi.fn() },
    destroy: vi.fn(),
  })),
}))

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch6-ar-vr', chapterEra: 6, year: 2015,
      titleKey: 'projects.ch6-ar-vr.title', descKey: 'projects.ch6-ar-vr.desc',
      link: null, imageSrc: null, role: 'Founder', techStack: ['Unity'],
      planetSprite: '/assets/ch6-planet-ar-vr.png', planetOrbit: 0.2, planetColor: '#ff3ca6',
    },
  ],
}))

async function mountCh6({ activeChapter: ac = 6 } = {}) {
  let Chapter6Content
  try {
    Chapter6Content = (await import('@/components/Chapter6Content.vue')).default
  } catch (_) {
    return { importFailed: true }
  }
  const activeChapter = ref(ac)
  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(Chapter6Content, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress: ref(6 / 7), scrollToChapter: vi.fn() },
        prm: { prefersReduced: ref(false) },
      },
      stubs: { ProjectOverlay: { template: '<div class="overlay-stub" />' } },
    },
  })
  await flushPromises()
  const { createGame } = await import('@/phaser')
  const mockGame = createGame.mock.results[createGame.mock.results.length - 1]?.value
  return { wrapper, activeChapter, mockGame, importFailed: false }
}

describe('Chapter6Content.vue bridge events (PHA-07) — RED W0 → verde W3/W4', () => {
  it('T1: game emit `show-project` → ProjectOverlay v-if renderea', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    // Emitir desde mock game para simular planet click in-Phaser
    r.mockGame?.events.emit('show-project', 'ch6-ar-vr')
    await flushPromises()
    expect(
      r.wrapper.find('.overlay-stub').exists(),
      'ProjectOverlay debe renderear (v-if) tras emit show-project. PHA-07.'
    ).toBe(true)
    r.wrapper.unmount()
  })

  it('T2: emit `arrival-complete` → .ch6-mantra v-if visible', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    // Antes del emit, mantra no debería estar visible.
    expect(
      r.wrapper.find('.ch6-mantra').exists(),
      'Mantra NO debe renderear hasta arrival-complete event.'
    ).toBe(false)
    r.mockGame?.events.emit('arrival-complete')
    await flushPromises()
    expect(
      r.wrapper.find('.ch6-mantra').exists(),
      '.ch6-mantra debe renderear (v-if arrivalDone) tras emit arrival-complete. D5-03.'
    ).toBe(true)
    r.wrapper.unmount()
  })

  it('T3: activeChapter 6→5 resetea activeProject (null) y arrivalDone (false)', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    r.mockGame?.events.emit('arrival-complete')
    r.mockGame?.events.emit('show-project', 'ch6-ar-vr')
    await flushPromises()
    // Cambiar chapter — debería disparar destroy + reset
    r.activeChapter.value = 5
    await flushPromises()
    expect(
      r.wrapper.find('.overlay-stub').exists(),
      'activeProject debe resetearse a null tras leave ch6 → ProjectOverlay desaparece.'
    ).toBe(false)
    expect(
      r.wrapper.find('.ch6-mantra').exists(),
      'arrivalDone debe resetearse a false tras leave ch6 → mantra desaparece.'
    ).toBe(false)
    r.wrapper.unmount()
  })
})
