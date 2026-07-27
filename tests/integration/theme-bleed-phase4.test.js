// tests/integration/theme-bleed-phase4.test.js
// Plan 04-06 Task 2 — Architectural integration tests para theme containment Phase 4.
// Source-level (readFileSync) verifica que parallax + scroll-reveal NO bleed entre chapters.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH4_SRC = readFileSync(resolve(process.cwd(), 'src/components/Chapter4Content.vue'), 'utf8')
const CH5_SRC = readFileSync(resolve(process.cwd(), 'src/components/Chapter5Content.vue'), 'utf8')
const SCROLL_SHELL_SRC = readFileSync(resolve(process.cwd(), 'src/components/ScrollShell.vue'), 'utf8')
// TASK-008: los boundaries [data-chapter="N"] viven ahora en eras.css
// (chapter-themes.css fue reemplazado por tokens.css + eras.css + chassis.css +
// chapter-components.css).
const CHAPTER_THEMES_SRC = readFileSync(resolve(process.cwd(), 'src/styles/eras.css'), 'utf8')

describe('Theme bleed prevention — Phase 4 architectural integration', () => {
  // T1 (iter3 2026-06-01): parallax de 4 capas "flotando en el vacío". El contrato
  // verifica que el stack vive en un contenedor .ch4-parallax con capas .ch4-layer
  // (NO un single bg ni ParallaxLayers.vue externo).
  it('T1 iter3: Chapter4Content.vue tiene un stack .ch4-parallax con capas .ch4-layer', () => {
    expect(CH4_SRC).toMatch(/class="ch4-parallax"/)
    expect(CH4_SRC).toMatch(/ch4-layer--portal/)
    expect(CH4_SRC).toMatch(/ch4-layer--character/)
  })

  // T2 (iter3 2026-06-01): containment — el parallax NO debe bleed a otros chapters.
  // .ch4-layout es position:relative + overflow (boundary), y .ch4-parallax está
  // absolute + overflow contenido dentro (no fixed full-viewport en desktop).
  //
  // TASK-010: overflow:hidden → overflow:clip en ambos selectores (regla del
  // proyecto: un contenedor que solo quiere recorte visual, sin ningún
  // descendiente sticky, usa clip — hidden crea un scroll container
  // programático innecesario). `clip` recorta exactamente igual que `hidden`
  // para este propósito de anti-bleed (el containment que este test protege
  // no depende de cuál de los dos se use, solo de que exista recorte), así
  // que el lock se actualiza al valor vigente en vez de perseguir el literal.
  it('T2 iter3: parallax contenido en .ch4-layout (relative+overflow:clip) sin bleed', () => {
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*position:\s*relative/s)
    expect(CH4_SRC).toMatch(/\.ch4-layout\s*\{[^}]*overflow:\s*clip/s)
    expect(CH4_SRC).toMatch(/\.ch4-parallax\s*\{[^}]*position:\s*absolute/s)
    expect(CH4_SRC).toMatch(/\.ch4-parallax\s*\{[^}]*overflow:\s*clip/s)
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
