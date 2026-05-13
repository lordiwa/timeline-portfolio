// tests/components/ScrollShell.test.js
// Tests del componente ScrollShell.vue.
//
// Cobertura:
// - Renders 7 chapter sections con IDs correctos
// - <main> raíz tiene class, id, tabindex correctos (A11Y-02)
// - Era titles exactos: 1995·Terminal..2026·Phaser (UI-SPEC §7.1)
// - CSS críticos (lectura raw del SFC):
//   * scroll-snap-type: y mandatory (CORE-01)
//   * scroll-snap-align: start (CORE-04)
//   * scroll-snap-stop: always (CORE-04)
//   * height: 100dvh (CORE-08)
//   * -webkit-overflow-scrolling: touch (iOS-01)
// - Keyboard navigation handlers (Plan 05, A11Y-02 completo):
//   * ↑/↓ navegan entre chapters con clamping a [0..6]
//   * j/k aliases vim-style (↓/↑)
//   * Home/End → 0 / 6
//   * PRM branch: behavior='auto' (D-04)
//
// NOTA: el test original de preventDefault fue eliminado por ambigüedad —
// Vue Test Utils `trigger` no expone el evento nativo con spy verificable
// sobre preventDefault. La directiva `.prevent` es declarativa de Vue
// framework, garantiza el preventDefault internamente. Los tests del
// `describe('keyboard navigation')` verifican el comportamiento funcional
// (que `navigate()` se invoca con la delta correcta + clamping + PRM
// branch), que es lo que importa para a11y. Ver Plan 05 §key-decisions.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ScrollShell from '@/components/ScrollShell.vue'

// Helper para los tests de keyboard navigation: monta ScrollShell con provides
// mutables. Retorna { wrapper, activeChapter, prefersReduced, scrollToChapter }.
function mountShell({ initialChapter = 3, initialPRM = false } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const scrollToChapter = vi.fn()
  const wrapper = mount(ScrollShell, {
    global: {
      provide: {
        scrollState: { activeChapter, scrollToChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced, scrollToChapter }
}

// Lee el archivo .vue como string para asserts de CSS estático en el bloque <style>.
// Usamos process.cwd() porque vitest corre desde el root del proyecto y la URL
// de import.meta.url bajo jsdom/vitest puede no ser scheme file:// portable.
const SCROLL_SHELL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollShell.vue'),
  'utf8'
)

describe('ScrollShell.vue', () => {
  // Helper para tests que no usan keyboard nav: monta con provides mínimos
  // (ScrollShell ahora hace inject de scrollState y prm desde Plan 05).
  function mountBasic() {
    const { wrapper } = mountShell()
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
  // Test 3: each section has id=chapter-N and correct aria-label
  // ─────────────────────────────────────────────────────────────────────────
  it('each section has id chapter-N and aria-label "{era} — {year}"', () => {
    const wrapper = mountBasic()
    const expected = [
      { id: 'chapter-0', label: 'Terminal — 1995' },
      { id: 'chapter-1', label: 'HTML 90s — 2001' },
      { id: 'chapter-2', label: 'Flash — 2009' },
      { id: 'chapter-3', label: 'Web 2.0 — 2013' },
      { id: 'chapter-4', label: 'AR/VR — 2015' },
      { id: 'chapter-5', label: 'Modern — 2022' },
      { id: 'chapter-6', label: 'Phaser — 2026' },
    ]
    expected.forEach(({ id, label }) => {
      const section = wrapper.find(`#${id}`)
      expect(section.exists()).toBe(true)
      expect(section.attributes('aria-label')).toBe(label)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: each section contains <p class="era-title"> with "YYYY · {era}" (UI-SPEC §7.1)
  // ─────────────────────────────────────────────────────────────────────────
  it('each section contains era-title with "YYYY · {era}" copy', () => {
    const wrapper = mountBasic()
    const expected = [
      '1995 · Terminal',
      '2001 · HTML 90s',
      '2009 · Flash',
      '2013 · Web 2.0',
      '2015 · AR/VR',
      '2022 · Modern',
      '2026 · Phaser',
    ]
    const titles = wrapper.findAll('.era-title')
    expect(titles.length).toBe(7)
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
})

// ───────────────────────────────────────────────────────────────────────────
// Plan 05 (Wave 4): keyboard navigation handlers (A11Y-02 completo).
//
// El <main> raíz declara 6 @keydown handlers con `.prevent`:
//   ↑/k → navigate(-1), ↓/j → navigate(1), Home → navigate('home'), End → navigate('end')
//
// `navigate(delta)` clamp el target a [0..6] y llama
// `scrollToChapter(target, prm ? 'auto' : 'smooth')`.
//
// NOTA sobre preventDefault: el test 11 original (que asertaba que
// preventDefault fue llamado via `trigger('keydown.up')`) fue eliminado por
// ambigüedad — Vue Test Utils `trigger` no expone el evento nativo subyacente
// con un spy verificable. La directiva `.prevent` es declarativa de Vue
// framework y llama event.preventDefault() internamente. Los Tests 2-10
// abajo verifican el comportamiento funcional (navigate dispara con la delta
// correcta y el behavior correcto), que es lo que importa para a11y.
// Ver Plan 05 §key-decisions para rationale completo.
// ───────────────────────────────────────────────────────────────────────────
describe('ScrollShell keyboard navigation', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: <main> template declara los 6 @keydown handlers con .prevent
  // (verificable raw del SFC source)
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
