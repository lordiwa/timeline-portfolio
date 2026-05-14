// tests/components/Chapter6Content.test.js
//
// Phase 5 W0 — RED scaffold integration tests para Chapter6Content.vue (PHA-01..04).
//
// Cobertura (4 tests):
//   T1: PHA-04 lazy — mount con activeChapter=6 → createGame() llamado 1 vez post flushPromises.
//   T2: PHA-02 lifecycle — cambiar activeChapter 6→5 → mockGame.destroy llamado con (true, false).
//   T3: PHA-01 shallowRef — source-regex verifica `shallowRef(null)` (NO `ref(` ni `reactive(`).
//   T4: Bridge listeners — registra 2 listeners `show-project` y `arrival-complete` (D5-10
//       sin prefijo vue:) en game.value.events.
//
// Analogs:
//   - tests/components/Chapter4Content.test.js (mount + inject + i18n + projects mock pattern)
//   - 05-RESEARCH.md §Pattern 1 lines 407-471 (Chapter6Content skeleton)
//
// RED scaffold W0 — verde tras W3 crea src/components/Chapter6Content.vue.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTestI18n } from '../i18n/test-helpers.js'

// Mock @/phaser ANTES del import dinámico del SUT.
const mockGameFactory = () => ({
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  scale: { zoom: 3, setZoom: vi.fn() },
  destroy: vi.fn(),
})

vi.mock('@/phaser', () => ({
  createGame: vi.fn(mockGameFactory),
}))

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch6-ar-vr', chapterEra: 6, year: 2015,
      titleKey: 'projects.ch6-ar-vr.title', descKey: 'projects.ch6-ar-vr.desc',
      link: null, imageSrc: null, role: 'Founder', techStack: ['Unity'],
      planetSprite: '/assets/ch6-planet-ar-vr.png', planetOrbit: 0.2, planetColor: '#ff3ca6',
    },
    {
      id: 'ch5-x', chapterEra: 5, year: 2022,
      titleKey: 'projects.ch5-x.title', descKey: 'projects.ch5-x.desc',
      link: null, imageSrc: null, role: null, techStack: [],
      planetSprite: null, planetOrbit: null, planetColor: null,
    },
  ],
}))

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')
let CH6_SOURCE = ''
try { CH6_SOURCE = readFileSync(CH6_PATH, 'utf8') } catch (_) { CH6_SOURCE = '' }

async function mountCh6({ locale = 'es', activeChapter: ac = 6, prefersReduced = false } = {}) {
  // W3 crea Chapter6Content.vue. Antes de eso, el import falla → tests RED naturalmente.
  let Chapter6Content
  try {
    Chapter6Content = (await import('@/components/Chapter6Content.vue')).default
  } catch (_) {
    return { wrapper: null, activeChapter: ref(ac), i18n: null, importFailed: true }
  }
  const activeChapter = ref(ac)
  const pr = ref(prefersReduced)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter6Content, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress: ref(6 / 7), scrollToChapter: vi.fn() },
        prm: { prefersReduced: pr },
      },
      stubs: { ProjectOverlay: true },
    },
  })
  return { wrapper, activeChapter, i18n, importFailed: false }
}

describe('Chapter6Content.vue lifecycle (PHA-01..04) — RED W0 → verde W3', () => {
  it('T1: PHA-04 lazy — activeChapter=6 dispara createGame() exactamente 1 vez', async () => {
    const { wrapper, importFailed } = await mountCh6({ activeChapter: 6 })
    if (importFailed) {
      expect.fail('src/components/Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    await flushPromises()
    const { createGame } = await import('@/phaser')
    expect(
      createGame,
      'createGame() debe llamarse exactamente 1 vez con activeChapter=6 (PHA-04 lazy mount).'
    ).toHaveBeenCalledTimes(1)
    wrapper?.unmount()
  })

  it('T2: PHA-02 destroy(true,false) cuando activeChapter pasa de 6 a 5', async () => {
    const { wrapper, activeChapter, importFailed } = await mountCh6({ activeChapter: 6 })
    if (importFailed) {
      expect.fail('src/components/Chapter6Content.vue no existe — W3 lo crea. RED esperado W0.')
    }
    await flushPromises()
    const { createGame } = await import('@/phaser')
    const mockGame = createGame.mock.results[createGame.mock.results.length - 1]?.value
    activeChapter.value = 5
    await flushPromises()
    expect(
      mockGame?.destroy,
      'game.destroy() debe llamarse con (true, false) cuando activeChapter !== 6 (PHA-02).'
    ).toHaveBeenCalledWith(true, false)
    wrapper?.unmount()
  })

  it('T3: PHA-01 shallowRef — source declara shallowRef(null), NO ref/reactive', () => {
    expect(
      CH6_SOURCE,
      'Chapter6Content.vue debe declarar `shallowRef(null)` para game ref. ' +
        'NUNCA `ref(` ni `reactive(` (Phaser.Game NO es Vue-reactive-safe — PHA-01). ' +
        'W3 crea este archivo.'
    ).toMatch(/shallowRef\s*\(\s*null\s*\)/)
    // Anti-pattern guard: el `game` ref específicamente NO debe usar ref/reactive.
    // Buscamos el patrón "const game = ref(" o "const game = reactive("
    expect(
      CH6_SOURCE.match(/const\s+game\s*=\s*ref\s*\(/),
      'Anti-pattern: `const game = ref(...)` rompe Phaser. Use shallowRef.'
    ).toBeNull()
    expect(
      CH6_SOURCE.match(/const\s+game\s*=\s*reactive\s*\(/),
      'Anti-pattern: `const game = reactive(...)` rompe Phaser. Use shallowRef.'
    ).toBeNull()
  })

  it('T4: Bridge — registra listeners `show-project` y `arrival-complete` SIN prefijo vue:', () => {
    expect(
      CH6_SOURCE,
      'Chapter6Content.vue debe registrar `game.value.events.on(\'show-project\', ...)` (D5-10). W3 crea.'
    ).toMatch(/events\.on\s*\(\s*['"]show-project['"]/)
    expect(
      CH6_SOURCE,
      'Chapter6Content.vue debe registrar `game.value.events.on(\'arrival-complete\', ...)` (D5-10). W3 crea.'
    ).toMatch(/events\.on\s*\(\s*['"]arrival-complete['"]/)
  })
})
