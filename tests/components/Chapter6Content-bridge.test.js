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
  computeZoom: vi.fn(() => 1),
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

  it('T2 (TASK-012): .ch6-mantra vive SIEMPRE en el DOM — YA NO depende de arrival-complete', async () => {
    // Contrato roto DELIBERADAMENTE por TASK-012 (spec §5.4: "el v-if se
    // elimina"): el mantra ahora vive dentro de Ch6Terminal.vue, montado
    // incondicionalmente desde que Chapter6Content.vue monta — TASK-007
    // defectos 2/3 exigen que NADA de contenido dependa de arrival-complete.
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe.')
    }
    // Presente ANTES de cualquier emit — la prueba central de TASK-012.
    expect(
      r.wrapper.find('.ch6-mantra').exists(),
      '.ch6-mantra debe existir desde el mount, SIN esperar arrival-complete (spec §5.4 + TASK-007).'
    ).toBe(true)
    r.mockGame?.events.emit('arrival-complete')
    await flushPromises()
    // Sigue presente tras el emit (compat estructural — el evento ya no
    // gatea nada, pero seguir emitiéndolo no debe romper nada).
    expect(r.wrapper.find('.ch6-mantra').exists()).toBe(true)
    r.wrapper.unmount()
  })

  it('T3: activeChapter 6→5 resetea activeProject (null); el mantra NO desaparece (vive fuera del ciclo de Phaser)', async () => {
    const r = await mountCh6()
    if (r.importFailed) {
      expect.fail('Chapter6Content.vue no existe.')
    }
    r.mockGame?.events.emit('arrival-complete')
    r.mockGame?.events.emit('show-project', 'ch6-ar-vr')
    await flushPromises()
    // Cambiar chapter — debería disparar destroy + reset del overlay.
    r.activeChapter.value = 5
    await flushPromises()
    expect(
      r.wrapper.find('.overlay-stub').exists(),
      'activeProject debe resetearse a null tras leave ch6 → ProjectOverlay desaparece.'
    ).toBe(false)
    // TASK-012: el mantra (dentro de Ch6Terminal.vue) NO depende del ciclo de
    // vida de Phaser — sigue en el DOM aunque activeChapter deje de ser 6,
    // porque Chapter6Content.vue (y su hijo Ch6Terminal) permanece SIEMPRE
    // montado (ScrollShell mantiene los 7 capítulos montados). Que desaparezca
    // sería reintroducir exactamente la dependencia que TASK-007/TASK-012
    // eliminaron.
    expect(
      r.wrapper.find('.ch6-mantra').exists(),
      'El mantra NO debe depender del ciclo de vida de Phaser (spec §5.4 + TASK-007).'
    ).toBe(true)
    r.wrapper.unmount()
  })
})
