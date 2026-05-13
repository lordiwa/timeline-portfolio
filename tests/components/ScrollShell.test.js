// tests/components/ScrollShell.test.js
// Tests del componente ScrollShell.vue + i18n (Plan 02-02, Task 2.2).
//
// Cobertura:
// - Renders 7 chapter sections con IDs correctos
// - <main> raíz tiene class, id, tabindex correctos (A11Y-02)
// - Era titles exactos: 1995·Terminal..2026·Phaser (UI-SPEC §7.1) — NO i18nificados (Phase 3)
// - CSS críticos (lectura raw del SFC):
//   * scroll-snap-type: y mandatory (CORE-01)
//   * scroll-snap-align: start (CORE-04)
//   * scroll-snap-stop: always (CORE-04)
//   * height: 100dvh (CORE-08)
//   * -webkit-overflow-scrolling: touch (iOS-01)
// - Keyboard navigation handlers (Plan 05, A11Y-02 completo)
// - i18n (Plan 02-02, Task 2.2):
//   * locale='es' → section[data-chapter=3] aria-label === t('chapters.3.title') en es
//   * locale='en' → section[data-chapter=3] aria-label === t('chapters.3.title') en en
//   * reactive: toggle locale 'es'→'en' → aria-label actualiza sin re-mount
//
// NOTA: el test original de preventDefault fue eliminado por ambigüedad —
// Vue Test Utils `trigger` no expone el evento nativo con spy verificable
// sobre preventDefault. La directiva `.prevent` es declarativa de Vue
// framework, garantiza el preventDefault internamente.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ScrollShell from '@/components/ScrollShell.vue'
import Chapter3Content from '@/components/Chapter3Content.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Helper para los tests de keyboard navigation: monta ScrollShell con provides
// mutables + plugin i18n. Retorna { wrapper, activeChapter, prefersReduced, scrollToChapter, i18n }.
function mountShell({ initialChapter = 3, initialPRM = false, locale = 'es' } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const scrollToChapter = vi.fn()
  const i18n = createTestI18n({ locale })
  const wrapper = mount(ScrollShell, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollToChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced, scrollToChapter, i18n }
}

// Lee el archivo .vue como string para asserts de CSS estático en el bloque <style>.
const SCROLL_SHELL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollShell.vue'),
  'utf8'
)

describe('ScrollShell.vue', () => {
  // Helper para tests que no usan keyboard nav: monta con provides mínimos
  function mountBasic({ locale = 'es' } = {}) {
    const { wrapper } = mountShell({ locale })
    return wrapper
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: <main> root attributes (A11Y-02, CORE-08 partial)
  // ─────────────────────────────────────────────────────────────────────────
  it('renders <main> root with class scroll-shell, id main-content, tabindex 0', () => {
    const wrapper = mountBasic()
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.classes()).toContain('scroll-shell')
    expect(main.attributes('id')).toBe('main-content')
    expect(main.attributes('tabindex')).toBe('0')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: exactly 7 chapter sections with data-chapter 0..6 (CORE-02)
  // ─────────────────────────────────────────────────────────────────────────
  it('renders exactly 7 chapter sections with data-chapter 0..6', () => {
    const wrapper = mountBasic()
    const sections = wrapper.findAll('section.chapter-section')
    expect(sections.length).toBe(7)
    sections.forEach((s, idx) => {
      expect(s.attributes('data-chapter')).toBe(String(idx))
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: each section has id=chapter-N and correct aria-label from i18n (es)
  // ─────────────────────────────────────────────────────────────────────────
  it('each section has id chapter-N and aria-label from t("chapters.N.title") in locale es', () => {
    const wrapper = mountBasic({ locale: 'es' })
    const expectedEs = [
      { id: 'chapter-0', label: 'Pre-carrera: niñez digital' },
      { id: 'chapter-1', label: 'Pre-carrera tardío: HTML 90s' },
      { id: 'chapter-2', label: 'Flash era: gameplay programmer' },
      { id: 'chapter-3', label: 'Web 2.0: UX + dev + líder' },
      { id: 'chapter-4', label: 'AR/VR: empresa propia + Metrodigi' },
      { id: 'chapter-5', label: 'Modern: streaming, QA, frontend lead' },
      { id: 'chapter-6', label: 'Convergencia: QA + AI' },
    ]
    expectedEs.forEach(({ id, label }) => {
      const section = wrapper.find(`#${id}`)
      expect(section.exists()).toBe(true)
      expect(section.attributes('aria-label')).toBe(label)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: 6 non-ch3 sections tienen <p class="era-title"> con "YYYY · {era}" (UI-SPEC §7.1)
  // NOTA: chapter 3 (2013 · Web 2.0) ya usa Chapter3Content en lugar del placeholder —
  // por eso solo 6 sections mantienen el .era-title Phase 1 (Plan 03-03 Wave 2).
  // ─────────────────────────────────────────────────────────────────────────
  it('6 non-ch3 sections contain era-title with "YYYY · {era}" copy (ch3 uses Chapter3Content)', () => {
    const wrapper = mountBasic()
    const expected = [
      '1995 · Terminal',
      '2001 · HTML 90s',
      '2009 · Flash',
      // '2013 · Web 2.0' → ch3 usa Chapter3Content, NO placeholder
      '2015 · AR/VR',
      '2022 · Modern',
      '2026 · Phaser',
    ]
    const titles = wrapper.findAll('.era-title')
    expect(titles.length).toBe(6)
    titles.forEach((t, idx) => {
      expect(t.text()).toBe(expected[idx])
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: .scroll-shell declares scroll-snap-type: y mandatory (CORE-01)
  // ─────────────────────────────────────────────────────────────────────────
  it('CSS: .scroll-shell declares scroll-snap-type: y mandatory', () => {
    expect(SCROLL_SHELL_SOURCE).toMatch(/scroll-snap-type:\s*y\s+mandatory/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: .chapter-section declares scroll-snap-align: start AND snap-stop: always (CORE-04)
  // ─────────────────────────────────────────────────────────────────────────
  it('CSS: .chapter-section declares scroll-snap-align: start and scroll-snap-stop: always', () => {
    expect(SCROLL_SHELL_SOURCE).toMatch(/scroll-snap-align:\s*start/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/scroll-snap-stop:\s*always/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: 100dvh height fallback (CORE-08)
  // ─────────────────────────────────────────────────────────────────────────
  it('CSS: declares height: 100dvh (with 100vh fallback)', () => {
    expect(SCROLL_SHELL_SOURCE).toMatch(/height:\s*100vh/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/height:\s*100dvh/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: -webkit-overflow-scrolling: touch (iOS-01)
  // ─────────────────────────────────────────────────────────────────────────
  it('CSS: .scroll-shell declares -webkit-overflow-scrolling: touch', () => {
    expect(SCROLL_SHELL_SOURCE).toMatch(/-webkit-overflow-scrolling:\s*touch/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9 (i18n): locale='en' → section[data-chapter=3] aria-label en inglés
  // ─────────────────────────────────────────────────────────────────────────
  it('i18n: locale=en → section[data-chapter=3] aria-label "Web 2.0: UX + dev + lead"', () => {
    const wrapper = mountBasic({ locale: 'en' })
    const section = wrapper.find('section[data-chapter="3"]')
    expect(section.attributes('aria-label')).toBe('Web 2.0: UX + dev + lead')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 10 (i18n reactive — Pitfall 3): toggle locale → aria-label actualiza
  // ─────────────────────────────────────────────────────────────────────────
  it('i18n reactive (Pitfall 3): toggle locale "es"→"en" → section aria-labels actualizan sin re-mount', async () => {
    const { wrapper, i18n } = mountShell({ locale: 'es' })
    const section = wrapper.find('section[data-chapter="3"]')
    expect(section.attributes('aria-label')).toBe('Web 2.0: UX + dev + líder')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('section[data-chapter="3"]').attributes('aria-label'))
      .toBe('Web 2.0: UX + dev + lead')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Plan 05 (Wave 4): keyboard navigation handlers (A11Y-02 completo).
//
// El <main> raíz declara 6 @keydown handlers con `.prevent`:
//   ↑/k → navigate(-1), ↓/j → navigate(1), Home → navigate('home'), End → navigate('end')
// ───────────────────────────────────────────────────────────────────────────
describe('ScrollShell keyboard navigation', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: <main> template declara los 6 @keydown handlers con .prevent
  // ─────────────────────────────────────────────────────────────────────────
  it('declares 6 @keydown handlers with .prevent in template (raw source check)', () => {
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.up\.prevent/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.down\.prevent/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.home\.prevent/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.end\.prevent/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.j\.prevent/)
    expect(SCROLL_SHELL_SOURCE).toMatch(/@keydown\.k\.prevent/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: ArrowDown con activeChapter=3 → scrollToChapter(4, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('ArrowDown with activeChapter=3 calls scrollToChapter(4, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 3, initialPRM: false })
    await wrapper.find('main').trigger('keydown.down')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(4, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: ArrowUp con activeChapter=3 → scrollToChapter(2, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('ArrowUp with activeChapter=3 calls scrollToChapter(2, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 3, initialPRM: false })
    await wrapper.find('main').trigger('keydown.up')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: j (vim alias de ↓) con activeChapter=3 → scrollToChapter(4, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('j key (vim alias of ↓) with activeChapter=3 calls scrollToChapter(4, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 3, initialPRM: false })
    await wrapper.find('main').trigger('keydown.j')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(4, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: k (vim alias de ↑) con activeChapter=3 → scrollToChapter(2, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('k key (vim alias of ↑) with activeChapter=3 calls scrollToChapter(2, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 3, initialPRM: false })
    await wrapper.find('main').trigger('keydown.k')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: Home → scrollToChapter(0, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('Home key calls scrollToChapter(0, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 4, initialPRM: false })
    await wrapper.find('main').trigger('keydown.home')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(0, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: End → scrollToChapter(6, 'smooth')
  // ─────────────────────────────────────────────────────────────────────────
  it('End key calls scrollToChapter(6, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 2, initialPRM: false })
    await wrapper.find('main').trigger('keydown.end')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(6, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: bounds — activeChapter=0 + ArrowUp → clamp a 0
  // ─────────────────────────────────────────────────────────────────────────
  it('bounds: ArrowUp at activeChapter=0 clamps to 0 (no negative)', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 0, initialPRM: false })
    await wrapper.find('main').trigger('keydown.up')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(0, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9: bounds — activeChapter=6 + ArrowDown → clamp a 6
  // ─────────────────────────────────────────────────────────────────────────
  it('bounds: ArrowDown at activeChapter=6 clamps to 6 (no >6)', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 6, initialPRM: false })
    await wrapper.find('main').trigger('keydown.down')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(6, 'smooth')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 10: PRM branch — ArrowDown bajo PRM → scrollToChapter(4, 'auto')
  // ─────────────────────────────────────────────────────────────────────────
  it('PRM branch: ArrowDown with prefersReduced=true calls scrollToChapter(N, "auto") — D-04', async () => {
    const { wrapper, scrollToChapter } = mountShell({ initialChapter: 3, initialPRM: true })
    await wrapper.find('main').trigger('keydown.down')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(4, 'auto')
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Plan 03-03 (Wave 2): Chapter3Content integration test
// Verifica que section[data-chapter="3"] monta <Chapter3Content />,
// y que las otras 6 sections mantienen el placeholder Phase 1.
// ───────────────────────────────────────────────────────────────────────────
describe('ScrollShell ch3 integration (Plan 03-03)', () => {
  // T1: section[data-chapter=3] contiene el componente Chapter3Content
  it('section[data-chapter="3"] monta Chapter3Content (v-if ch.id===3)', () => {
    const { wrapper } = mountShell()
    const ch3Section = wrapper.find('section[data-chapter="3"]')
    expect(ch3Section.exists()).toBe(true)
    expect(ch3Section.findComponent(Chapter3Content).exists()).toBe(true)
  })

  // T2: section[data-chapter=0] NO monta Chapter3Content — mantiene placeholder
  it('section[data-chapter="0"] mantiene .chapter-placeholder (no Chapter3Content)', () => {
    const { wrapper } = mountShell()
    const ch0Section = wrapper.find('section[data-chapter="0"]')
    expect(ch0Section.findComponent(Chapter3Content).exists()).toBe(false)
    expect(ch0Section.find('.chapter-placeholder').exists()).toBe(true)
  })

  // T3: seis sections non-ch3 tienen .era-title placeholder (Phase 1 verbatim)
  it('sections data-chapter 0,1,2,4,5,6 todas mantienen .era-title placeholder', () => {
    const { wrapper } = mountShell()
    const nonCh3Ids = [0, 1, 2, 4, 5, 6]
    nonCh3Ids.forEach((id) => {
      const section = wrapper.find(`section[data-chapter="${id}"]`)
      expect(section.find('.era-title').exists()).toBe(true)
    })
  })
})
