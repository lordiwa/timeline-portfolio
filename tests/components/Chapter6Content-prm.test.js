// tests/components/Chapter6Content-prm.test.js
//
// Phase 5 W0 — RED scaffold para Chapter6Content + PRM integration (A11Y-05 + D5-08).
//
// Cobertura (2 tests source-regex):
//   T1: Chapter6Content.vue pasa `prefersReduced` value a `createGame({ prefersReduced })` opt.
//       Patrón: `createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })`.
//   T2: chapter-themes.css declara `@media (prefers-reduced-motion: reduce)` que desactiva
//       la animación `mantra-fade-in` en `.ch6-mantra` (D5-08 — mantra aparece sin fade bajo PRM).
//
// Rationale: PRM heuristic ch6 (D5-08) requiere:
//   - Phaser side: arrival cinematic skipped (via registry.get('prefersReduced'))
//   - CSS side: @media query desactiva animation: mantra-fade-in
//
// RED scaffold W0 — verde tras W3 (Chapter6Content) + (chapter-themes.css ya finalizado W0
// pero el @keyframes + @media siguen siendo W3 owned dentro de @layer components).

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')
const THEMES_PATH = resolve(process.cwd(), 'src/styles/chapter-themes.css')

let ch6Src = ''
let themesSrc = ''
try { ch6Src = readFileSync(CH6_PATH, 'utf8') } catch (_) { ch6Src = '' }
try { themesSrc = readFileSync(THEMES_PATH, 'utf8') } catch (_) { themesSrc = '' }

describe('Chapter6Content PRM (A11Y-05 + D5-08) — RED W0 → verde W3', () => {
  it('T1: createGame() recibe { prefersReduced: prefersReduced.value } opt', () => {
    expect(
      ch6Src,
      'Chapter6Content.vue debe llamar `createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })`. ' +
        'D5-08 + A11Y-05. W3 crea este archivo.'
    ).toMatch(/createGame\s*\([^)]*prefersReduced\s*:\s*prefersReduced\.value/)
  })

  it('T2: chapter-themes.css desactiva mantra-fade-in animation bajo @media PRM', () => {
    expect(
      themesSrc,
      'chapter-themes.css debe declarar `@media (prefers-reduced-motion: reduce)` que setea ' +
        '`.ch6-mantra { animation: none }`. D5-08 — mantra aparece sin fade bajo PRM. ' +
        'W3 añade @layer components rules para .ch6-mantra.'
    ).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)[\s\S]*?\.ch6-mantra[\s\S]*?animation:\s*none/)
  })
})
