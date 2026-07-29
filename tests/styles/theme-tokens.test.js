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

// Helper (pase de correccion post-3f0e91d, hallazgo MEDIO del reviewer): extrae
// el bloque de scope SOLO section `[data-chapter="N"] { ... }` — sin el `,` que
// lo uniria al `:root[data-active-chapter="N"]` companero. --font-body (y
// --bg-image en ch6) viven EXCLUSIVAMENTE aqui; nunca dentro de extractBlock().
function extractSectionOnlyBlock(src, chapter) {
  const regex = new RegExp(`\\[data-chapter="${chapter}"\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`)
  const match = src.match(regex)
  return match ? match[1] : ''
}

const REQUIRED_TOKENS = ['--c-bg', '--c-fg', '--c-accent', '--c-border', '--c-focus', '--era-progress']

// --font-body verbatim esperado por era, SOLO en el bloque section-only.
const FONT_BODY_BY_CHAPTER = {
  0: "'VT323', ui-monospace, monospace",
  1: "'Comic Neue', 'Comic Sans MS', cursive",
  2: "'Verdana', 'Trebuchet MS', sans-serif",
  3: "'Open Sans', 'Segoe UI', 'Helvetica Neue', sans-serif",
  4: "'Audiowide', 'Eurostile', sans-serif",
  5: "'Inter Variable', system-ui, sans-serif",
  6: "'Audiowide', sans-serif",
}

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
    const sectionOnly = extractSectionOnlyBlock(source, 0)
    expect(sectionOnly).toContain("--font-body: 'VT323', ui-monospace, monospace")
  })

  // T9: ch1 verbatim — valores exactos de UI-SPEC §4.2
  it('T9: ch1 has verbatim token values from UI-SPEC §4.2', () => {
    const block = extractBlock(source, 1)
    expect(block).toContain('--c-bg: #000080')
    expect(block).toContain('--c-fg: #ff00ff')
    const sectionOnly = extractSectionOnlyBlock(source, 1)
    expect(sectionOnly).toContain("--font-body: 'Comic Neue', 'Comic Sans MS', cursive")
  })

  // T13 (pase de correccion post-3f0e91d, hallazgo MEDIO del reviewer):
  // --font-body vive SOLO en el scope de section — nunca dentro del bloque de
  // doble scope que tambien abre :root[data-active-chapter="N"]. Si esto
  // regresiona, GlobalMantra.vue (unico consumidor de --font-body fuera de las
  // <section>) vuelve a heredar la fuente de la era activa en vez de su
  // sans-serif declarado (ver header de eras.css).
  for (let i = 0; i <= 6; i++) {
    it(`T13.${i}: chapter ${i} --font-body is declared ONLY in the section-only scope, never in :root`, () => {
      const doubleScopeBlock = extractBlock(source, i)
      expect(
        doubleScopeBlock,
        `chapter ${i}: --font-body reapareció en el bloque de doble scope (contamina :root[data-active-chapter="${i}"])`
      ).not.toContain('--font-body')

      const sectionOnlyBlock = extractSectionOnlyBlock(source, i)
      expect(
        sectionOnlyBlock,
        `chapter ${i}: falta el bloque section-only [data-chapter="${i}"] { --font-body: ...; }`
      ).toContain(`--font-body: ${FONT_BODY_BY_CHAPTER[i]}`)
    })
  }


  // T10 (AC#2 regression lock): las 3 excepciones de paleta quedan resueltas —
  // ch2/ch3/ch5 declaran la paleta REAL de la escena (la que antes solo vivía
  // en el HUD) como la ÚNICA paleta de la era.
  it('T10: ch2 section token block uses the real Y2K palette (exception resolved)', () => {
    const block = extractBlock(source, 2)
    expect(block).toContain('--c-bg: #050a18')
    expect(block).toContain('--c-accent: #5af2ff')
  })

  // T11 actualizado por TASK-009 (rediseño total de ch3): la paleta ember/oro
  // Kingdom New Lands era ya un stub heredado de una maqueta retirada; el
  // rediseño usa Flat UI Colors (Designmodo 2013), fuente de verdad
  // .planning/design/03-ch3-muerte-de-flash.md §4.
  it('T11: ch3 section token block uses the 2013 Flat UI Colors palette (TASK-009 redesign)', () => {
    const block = extractBlock(source, 3)
    expect(block).toContain('--c-bg: #ecf0f1')
    expect(block).toContain('--c-accent: #3498db')
  })

  // T12 actualizado por TASK-011 (2026-07-29): la paleta "cine oscuro" de
  // TASK-008 pasa a la paleta broadcast/streaming de
  // .planning/design/05-ch5-pandemia-broadcast.md §5 (panel de transmisión).
  it('T12: ch5 section token block uses the broadcast/streaming palette (TASK-011)', () => {
    const block = extractBlock(source, 5)
    expect(block).toContain('--c-bg: #0b0910')
    expect(block).toContain('--c-accent: #818cf8')
  })
})
