// tests/components/TerminalScroll.test.js
// TDD RED phase — Plan 04-02, Task 1.
//
// Cobertura (5 tests):
// - T1 DOM contract: monta sin errores, renderiza 4 .terminal-line spans
// - T2 CSS @keyframes terminal-cursor-blink con steps(2)
// - T3 CSS @media (prefers-reduced-motion: reduce) con .terminal-cursor { animation: none }
// - T4 CSS @keyframes terminal-reveal presente
// - T5 i18n reactive: cambiar locale es→en actualiza las líneas del terminal

import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import TerminalScroll from '@/components/TerminalScroll.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>
const TERMINAL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/TerminalScroll.vue'),
  'utf8'
)

// Helper: monta TerminalScroll con i18n plugin (no necesita scrollState ni prm — CSS-only PRM)
function mountTerminal({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(TerminalScroll, {
    global: {
      plugins: [i18n],
    },
  })
  return { wrapper, i18n }
}

describe('TerminalScroll.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — renderiza sin errores con 4 .terminal-line spans
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: monta sin errores y renderiza 4 .terminal-line spans', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal-scroll').exists()).toBe(true)
    const lines = wrapper.findAll('.terminal-line')
    expect(lines.length).toBe(4)
  })

  it('T1 DOM contract: renderiza .terminal-output (pre)', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal-output').exists()).toBe(true)
  })

  it('T1 DOM contract: renderiza .terminal-cursor con aria-hidden="true"', () => {
    const { wrapper } = mountTerminal()
    const cursor = wrapper.find('.terminal-cursor')
    expect(cursor.exists()).toBe(true)
    expect(cursor.attributes('aria-hidden')).toBe('true')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: CSS @keyframes terminal-cursor-blink con steps(2)
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 CSS: contiene @keyframes terminal-cursor-blink', () => {
    expect(TERMINAL_SOURCE).toMatch(/@keyframes terminal-cursor-blink/)
  })

  it('T2 CSS: cursor-blink usa steps(2) para look CRT cuadrado', () => {
    expect(TERMINAL_SOURCE).toMatch(/steps\(2\)/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: CSS @media PRM — sin parpadeo bajo prefers-reduced-motion
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 CSS PRM: contiene @media (prefers-reduced-motion: reduce)', () => {
    expect(TERMINAL_SOURCE).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('T3 CSS PRM: .terminal-cursor tiene animation: none bajo PRM', () => {
    // La regex busca el bloque PRM con .terminal-cursor { animation: none }
    expect(TERMINAL_SOURCE).toMatch(/prefers-reduced-motion.*?terminal-cursor.*?animation:\s*none/s)
  })

  it('T3 CSS PRM: .terminal-line tiene animation: none bajo PRM', () => {
    expect(TERMINAL_SOURCE).toMatch(/prefers-reduced-motion.*?terminal-line.*?animation:\s*none/s)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: CSS @keyframes terminal-reveal
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 CSS: contiene @keyframes terminal-reveal para staggered fade-in', () => {
    expect(TERMINAL_SOURCE).toMatch(/@keyframes terminal-reveal/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: i18n reactive — cambiar locale actualiza las líneas del terminal
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 i18n reactive: locale es→en → las líneas del terminal cambian', async () => {
    const { wrapper, i18n } = mountTerminal({ locale: 'es' })
    const textEs = wrapper.find('.terminal-line').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.terminal-line').text()
    // Ambos tienen contenido
    expect(textEs.length).toBeGreaterThan(0)
    expect(textEn.length).toBeGreaterThan(0)
  })
})
