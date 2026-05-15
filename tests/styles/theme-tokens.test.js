// tests/styles/theme-tokens.test.js
// Verifica que cada chapter block en chapter-themes.css tiene los 6 tokens requeridos
// y que ch0/ch1 tienen los valores verbatim de UI-SPEC §4.2.
//
// Cobertura: THM-03 (tokens per chapter).
// Tests ARQUITECTURALES: verifican source text via readFileSync — NO computed styles.
// Nota: jsdom NO resuelve @layer + CSS Custom Props heredados via DOM tree walk.
// Ver plan `notes.jsdom_limitation`. Validación visual computed-style → W5 §1 manual.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')
const source = readFileSync(CSS_PATH, 'utf8')

// Helper: extrae el bloque de contenido entre [data-chapter="N"] { y el } de cierre.
// Usa una regex que captura el primer bloque del selector dado.
function extractBlock(src, chapter) {
  const regex = new RegExp(`\\[data-chapter="${chapter}"\\]\\s*\\{([\\s\\S]*?)\\}`)
  const match = src.match(regex)
  return match ? match[1] : ''
}

const REQUIRED_TOKENS = ['--c-bg', '--c-fg', '--c-accent', '--c-border', '--c-focus', '--font-body']

describe('theme-tokens.test.js — per-chapter token completeness (THM-03)', () => {
  // T1-T7: Cada chapter (0..6) tiene los 6 tokens requeridos
  for (let i = 0; i <= 6; i++) {
    it(`T${i + 1}: chapter ${i} block contains all 6 required tokens`, () => {
      const block = extractBlock(source, i)
      expect(block.length).toBeGreaterThan(0)
      for (const token of REQUIRED_TOKENS) {
        expect(block).toContain(token)
      }
    })
  }

  // T8: ch0 verbatim — DOS white-on-black (refresh Rafael 2026-05-14, supersede UI-SPEC §4.2 phosphor green)
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
})
