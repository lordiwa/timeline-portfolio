// tests/styles/theme-tokens.test.js
// TASK-008: verifica que cada bloque de era en eras.css tiene los tokens
// requeridos y que ch0/ch1 conservan los valores verbatim de UI-SPEC §4.2.
//
// Cobertura: THM-03 (tokens per chapter), heredado desde chapter-themes.css.
// Tests ARQUITECTURALES: verifican source text via readFileSync — NO computed
// styles. Ver plan `notes.jsdom_limitation`. Validación visual → manual.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/eras.css')
const source = readFileSync(CSS_PATH, 'utf8')

// Helper: extrae el bloque de contenido del selector de doble scope
// `[data-chapter="N"], :root[data-active-chapter="N"] { ... }` de una era.
// Non-greedy hasta el primer `}` de cierre — los bloques de era son planos
// (solo custom properties + un comentario), sin llaves anidadas.
function extractBlock(src, chapter) {
  const regex = new RegExp(`\\[data-chapter="${chapter}"\\][^{]*\\{([\\s\\S]*?)\\n\\s*\\}`)
  const match = src.match(regex)
  return match ? match[1] : ''
}

const REQUIRED_TOKENS = ['--c-bg', '--c-fg', '--c-accent', '--c-border', '--c-focus', '--font-body', '--era-progress']

describe('theme-tokens.test.js — per-era token completeness (THM-03)', () => {
  // T1-T7: Cada era (0..6) tiene los tokens requeridos
  for (let i = 0; i <= 6; i++) {
    it(`T${i + 1}: chapter ${i} block contains all required tokens`, () => {
      const block = extractBlock(source, i)
      expect(block.length).toBeGreaterThan(0)
      for (const token of REQUIRED_TOKENS) {
        expect(block).toContain(token)
      }
    })
  }

  // T8: ch0 verbatim — DOS white-on-black (refresh Rafael 2026-05-14)
  it('T8: ch0 has DOS white-on-black token values', () => {
    const block = extractBlock(source, 0)
    expect(block).toContain('--c-bg: #000000')
    expect(block).toContain('--c-fg: #ffffff')
    expect(block).toContain("--font-body: 'VT323', ui-monospace, monospace")
  })

  // T9: ch1 verbatim — valores exactos de UI-SPEC §4.2
  it('T9: ch1 has verbatim token values from UI-SPEC §4.2', () => {
    const block = extractBlock(source, 1)
    expect(block).toContain('--c-bg: #000080')
    expect(block).toContain('--c-fg: #ff00ff')
    expect(block).toContain("--font-body: 'Comic Neue', 'Comic Sans MS', cursive")
  })

  // T10 (AC#2 regression lock): las 3 excepciones de paleta quedan resueltas —
  // ch2/ch3/ch5 declaran la paleta REAL de la escena (la que antes solo vivía
  // en el HUD) como la ÚNICA paleta de la era.
  it('T10: ch2 section token block uses the real Y2K palette (exception resolved)', () => {
    const block = extractBlock(source, 2)
    expect(block).toContain('--c-bg: #050a18')
    expect(block).toContain('--c-accent: #5af2ff')
  })

  it('T11: ch3 section token block uses the real ember palette (exception resolved)', () => {
    const block = extractBlock(source, 3)
    expect(block).toContain('--c-bg: #1c100c')
    expect(block).toContain('--c-accent: #ffa94d')
  })

  it('T12: ch5 section token block uses the real dark-cinema palette (exception resolved)', () => {
    const block = extractBlock(source, 5)
    expect(block).toContain('--c-bg: #171009')
    expect(block).toContain('--c-accent: #818cf8')
  })
})
