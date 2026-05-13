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

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ScrollShell from '@/components/ScrollShell.vue'

// Lee el archivo .vue como string para asserts de CSS estático en el bloque <style>.
// Usamos process.cwd() porque vitest corre desde el root del proyecto y la URL
// de import.meta.url bajo jsdom/vitest puede no ser scheme file:// portable.
const SCROLL_SHELL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollShell.vue'),
  'utf8'
)

describe('ScrollShell.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: <main> root attributes (A11Y-02, CORE-08 partial)
  // ─────────────────────────────────────────────────────────────────────────
  it('renders <main> root with class scroll-shell, id main-content, tabindex 0', () => {
    const wrapper = mount(ScrollShell)
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
    const wrapper = mount(ScrollShell)
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
    const wrapper = mount(ScrollShell)
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
    const wrapper = mount(ScrollShell)
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
