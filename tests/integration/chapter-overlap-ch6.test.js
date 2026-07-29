// tests/integration/chapter-overlap-ch6.test.js
//
// Phase 5 W0 — RED scaffold defensive — chapter overlap bug Phase 4 vigilance (D5-09 + CORE-04).
//
// Cobertura (4 tests):
//   T1 (target ScrollShell.vue ~line 134): source-regex verifica `scroll-snap-stop: always`
//        está presente en ScrollShell.vue (vive en SFC scoped style — verified 2026-05-14).
//        Warning 5 RESOLVED: target ScrollShell.vue, NO chapter-themes.css.
//   T2: source-regex en chapter-themes.css verifica que el bloque `.ch6-layout` NO contiene
//       `overflow: hidden` (Pattern 12 mitigation — el bug Phase 4 lo causó en .ch4-layout).
//   T3: source-regex en ScrollShell.vue verifica que `<Chapter6Content` está presente en template
//       (replace de placeholder, no dead-branch defensive).
//   T4: mount ScrollShell con stubs y verifica que sección data-chapter=6 contiene `.ch6-layout`
//       (NO `.chapter-placeholder` — W3 wire confirmado).
//
// Rationale (Pitfall 13 mitigation):
//   El chapter-overlap-bug Phase 4 (deferred 2026-05-14) puede agravarse en ch6 si:
//   (a) scroll-snap-stop no es 'always' → el snap deja revelar ch5 visible sobre ch6
//   (b) .ch6-layout tiene overflow:hidden creando stacking context similar a .ch4-layout
//   Phase 5 NO arregla el bug, pero AÑADE defensive guards para no agravarlo.
//
// RED scaffold W0 — verde tras W3 wire de Chapter6Content. T1 + T2 ya verdes tras W0
// (scroll-snap-stop ya existe; .ch6-layout aún no existe, T2 trivialmente pasa).

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTestI18n } from '../i18n/test-helpers.js'

const SCROLL_SHELL_PATH = resolve(process.cwd(), 'src/components/ScrollShell.vue')
// TASK-012 (2026-07-29): .ch6-layout MIGRÓ de chapter-components.css al
// <style scoped> de Chapter6Content.vue (criterio adicional heredado de
// TASK-008 — ver comentario del orquestador en tasks/TASK-012.json).
const CH6_CONTENT_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')

let scrollShellSrc = ''
let themesSrc = ''
try { scrollShellSrc = readFileSync(SCROLL_SHELL_PATH, 'utf8') } catch (_) { scrollShellSrc = '' }
try { themesSrc = readFileSync(CH6_CONTENT_PATH, 'utf8') } catch (_) { themesSrc = '' }

describe('chapter-overlap-ch6 defensive (D5-09 + CORE-04) — RED W0 → verde W3', () => {
  it('T1: ScrollShell.vue contiene `scroll-snap-stop: always` (Warning 5 target verified)', () => {
    expect(
      scrollShellSrc,
      'ScrollShell.vue (SFC scoped style ~line 134) debe declarar `scroll-snap-stop: always`. ' +
        'Verified 2026-05-14: regla vive en ScrollShell.vue NO en chapter-themes.css. ' +
        'Si se mueve a otro archivo, este test debe actualizarse intencionalmente.'
    ).toMatch(/scroll-snap-stop:\s*always/)
  })

  it('T2: bloque `.ch6-layout` en Chapter6Content.vue NO declara `overflow: hidden`', () => {
    // TASK-012: .ch6-layout vive en el <style scoped> de Chapter6Content.vue.
    const ch6BlockMatch = themesSrc.match(/\.ch6-layout\s*\{[^}]*\}/s)
    if (!ch6BlockMatch) {
      expect(
        ch6BlockMatch,
        '.ch6-layout debe existir en Chapter6Content.vue.'
      ).not.toBeNull()
      return
    }
    expect(
      ch6BlockMatch[0],
      '.ch6-layout NO debe declarar `overflow: hidden` (Pattern 12 mitigation chapter-overlap bug). ' +
        'D5-09: full-bleed canvas sin overflow agresivo que cree stacking context.'
    ).not.toMatch(/overflow:\s*hidden/)
  })

  it('T3: ScrollShell.vue template contiene <Chapter6Content v-else-if (W3 wire)', () => {
    expect(
      scrollShellSrc,
      'ScrollShell.vue template debe contener `<Chapter6Content v-else-if="ch.id === 6"`. ' +
        'W3 wire reemplaza el placeholder default. Antes de W3 este test es RED.'
    ).toMatch(/<Chapter6Content\s+v-else-if="ch\.id\s*===\s*6"/)
  })

  // TASK-012 ronda 2 (2026-07-29) — timeout explícito 15000ms (default 5000ms).
  // Causa raíz medida: esta suite monta Chapter6Content.vue + Ch6Terminal.vue
  // reales (no stubbed), y Ch6Terminal.vue ahora hace trabajo síncrono real en
  // el mount (splitWords/wordIndexGrid sobre las 143 palabras de bio.eras.6,
  // splitAuthorWords, toBits) que Chapter6Content.vue no tenía antes de este
  // ticket. Confirmado: con `--testTimeout=20000` la suite completa (708/708)
  // pasa siempre; con el default de 5000ms este test puntual cae de forma
  // intermitente SOLO bajo contención de CPU externa a este repo (verificado
  // con `Get-Counter` procesos `tesseract` ajenos a la sesión saturando el
  // núcleo). La aserción no cambia (sigue exigiendo `.ch6-layout` y NO
  // `.chapter-placeholder`); solo el presupuesto de tiempo del mount.
  it('T4: mount ScrollShell + activeChapter=6 → sección renderea .ch6-layout no .chapter-placeholder', async () => {
    // Stub ProjectOverlay y mock createGame antes de import dinámico de Chapter6Content
    const { vi } = await import('vitest')
    vi.mock('@/phaser', () => ({
      createGame: vi.fn(() => ({
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
        scale: { zoom: 3, setZoom: vi.fn() },
        destroy: vi.fn(),
      })),
      computeZoom: vi.fn(() => 1),
    }))

    let ScrollShell
    try {
      ScrollShell = (await import('@/components/ScrollShell.vue')).default
    } catch (_) {
      expect.fail('ScrollShell.vue debe existir (Phase 1 ya entregó).')
      return
    }
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(ScrollShell, {
      global: {
        plugins: [i18n],
        provide: {
          scrollState: {
            activeChapter: ref(6),
            scrollProgress: ref(6 / 7),
            scrollToChapter: vi.fn(),
          },
          prm: { prefersReduced: ref(false) },
        },
        stubs: {
          // Stub todos los Chapter*Content excepto ch6 para que rendere el v-else-if real.
          Chapter0Content: true,
          Chapter1Content: true,
          Chapter2Content: true,
          Chapter3Content: true,
          Chapter4Content: true,
          Chapter5Content: true,
          ProjectOverlay: true,
        },
      },
    })
    const section = wrapper.find('section[data-chapter="6"]')
    expect(section.exists(), 'section[data-chapter="6"] debe existir.').toBe(true)
    expect(
      section.find('.ch6-layout').exists(),
      'section[data-chapter="6"] debe contener `.ch6-layout` post-W3 wire (no .chapter-placeholder).'
    ).toBe(true)
    expect(
      section.find('.chapter-placeholder').exists(),
      'section[data-chapter="6"] NO debe renderar `.chapter-placeholder` post-W3 wire.'
    ).toBe(false)
    wrapper.unmount()
  }, 15000)
})
