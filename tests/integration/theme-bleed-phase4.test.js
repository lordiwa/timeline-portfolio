// tests/integration/theme-bleed-phase4.test.js
// Plan 04-06 Task 2 — Architectural integration tests para theme containment Phase 4.
// Source-level (readFileSync) verifica que parallax + scroll-reveal NO bleed entre chapters.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH4_SRC = readFileSync(resolve(process.cwd(), 'src/components/Chapter4Content.vue'), 'utf8')
const CH5_SRC = readFileSync(resolve(process.cwd(), 'src/components/Chapter5Content.vue'), 'utf8')
const SCROLL_SHELL_SRC = readFileSync(resolve(process.cwd(), 'src/components/ScrollShell.vue'), 'utf8')
const CHAPTER_THEMES_SRC = readFileSync(resolve(process.cwd(), 'src/styles/chapter-themes.css'), 'utf8')

describe('Theme bleed prevention — Phase 4 architectural integration', () => {
  // T1 (iter2 2026-05-28): ParallaxLayers.vue retirado al colapsar stack 4-capas
  // a single bg full-bleed. El nuevo contrato T1 verifica que ch4-stage-bg.png
  // está referenciado como background-image del .ch4-layout.
  it('T1 iter2: Chapter4Content.vue referencia ch4-stage-bg.png como background-image', () => {
    expect(CH4_SRC).toMatch(/background-image:\s*url\(['"]?\/assets\/ch4-bg\.png/)
  })

  // T2 (iter2 2026-05-28): ya no hay child absolute que contener — el bg vive en
  // el background-image del propio .ch4-layout. Verificamos position:relative
  // (preservado para los FloatingPanel internos) + bg cover fixed pixelated.
  it('T2 iter2: Chapter4Content.vue tiene .ch4-layout con bg cover fixed pixelated', () => {
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*position:\s*relative/s)
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*background-size:\s*cover/s)
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*background-attachment:\s*fixed/s)
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*image-rendering:\s*pixelated/s)
  })

  // T3: Chapter5Content.vue NO importa FloatingPanel (ch5 NO debe heredar AR/VR
  // glass aesthetic). ParallaxLayers ya no existe — drop de su assertion.
  it('T3: Chapter5Content.vue NO importa FloatingPanel (no AR/VR bleed)', () => {
    expect(CH5_SRC).not.toMatch(/import\s+FloatingPanel/)
  })

  // T4: Chapter4Content.vue NO importa ScrollRevealCard
  // (ch4 NO debe heredar Modern reveal aesthetic)
  it('T4: Chapter4Content.vue NO importa ScrollRevealCard (no Modern bleed)', () => {
    expect(CH4_SRC).not.toMatch(/import\s+ScrollRevealCard/)
  })

  // T5: chapter-themes.css contiene boundary [data-chapter="N"] para todos N en 0..6
  it('T5: chapter-themes.css declara boundary [data-chapter="N"] para los 7 chapters', () => {
    for (let i = 0; i <= 6; i++) {
      const re = new RegExp(`\\[data-chapter=["']${i}["']\\]`)
      expect(CHAPTER_THEMES_SRC, `chapter ${i} boundary missing`).toMatch(re)
    }
  })

  // T6: ScrollShell NO aplica position:absolute ni overflow hacks a las section
  // (cada section es boundary CSS scope independiente)
  it('T6: ScrollShell.vue NO aplica position:absolute a .chapter-section', () => {
    const block = SCROLL_SHELL_SRC.match(/\.chapter-section\s*\{[^}]*\}/s)
    expect(block).toBeTruthy()
    expect(block[0]).not.toMatch(/position:\s*absolute/)
  })
})
