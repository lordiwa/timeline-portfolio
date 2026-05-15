// tests/styles/contrast-docs.test.js
// Verifica que el comentario de contraste tradeoff de ch1 esté presente verbatim (THM-05).
// También verifica que ch0 y ch2-6 NO requieren el comentario tradeoff (pasan AAA ≥4.5:1).
//
// Cobertura: THM-05 (contrast tradeoff documentation for ch1).
// NOTA: Este test SOLO verifica la presencia del comentario inline — NO hace auditoría
// externa de contraste (eso es A11Y-04 = W5 §4 manual axe/Pa11y/Lighthouse audit).
// Ver plan `notes.a11y_04_scope`.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSS_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')
const source = readFileSync(CSS_PATH, 'utf8')

// Helper: extrae el bloque de contenido entre [data-chapter="N"] { y el } de cierre.
function extractBlock(src, chapter) {
  const regex = new RegExp(`\\[data-chapter="${chapter}"\\]\\s*\\{([\\s\\S]*?)\\}`)
  const match = src.match(regex)
  return match ? match[1] : ''
}

const TRADEOFF_PHRASE = 'as era-authentic tradeoff per THM-05'

describe('contrast-docs.test.js — ch1 tradeoff comment + no tradeoff on AAA chapters (THM-05)', () => {
  // T1: ch1 tiene el comentario tradeoff verbatim (D2-03 mandatorio)
  it('T1: ch1 block contains verbatim contrast tradeoff comment', () => {
    expect(source).toContain(
      'contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here as era-authentic tradeoff per THM-05'
    )
  })

  // T2: ch0 NO tiene la frase tradeoff (21:1 white-on-black pasa AAA sin tradeoff,
  // refresh Rafael 2026-05-14 DOS white supersede phosphor green 15.3:1)
  it('T2: ch0 block does NOT contain era-authentic tradeoff phrase (21:1 = WCAG AAA)', () => {
    const block = extractBlock(source, 0)
    expect(block).not.toContain(TRADEOFF_PHRASE)
  })

  // T3: ch2-6 NO tienen la frase tradeoff (todos pasan AAA)
  it('T3: ch2-6 blocks do NOT contain era-authentic tradeoff phrase (all WCAG AAA ≥10:1)', () => {
    for (let i = 2; i <= 6; i++) {
      const block = extractBlock(source, i)
      expect(block).not.toContain(TRADEOFF_PHRASE)
    }
  })
})
