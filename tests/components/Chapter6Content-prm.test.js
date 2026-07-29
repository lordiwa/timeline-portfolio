// tests/components/Chapter6Content-prm.test.js
//
// TASK-012 (2026-07-29) — actualizado tras el rediseño del clímax ch6.
//
// Cobertura (2 tests):
//   T1: Chapter6Content.vue llama `createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })`
//       (sin cambios de contrato).
//   T2: el mantra ya NO vive como bloque aislado en chapter-components.css —
//       vive dentro de Ch6Terminal.vue (TASK-012 spec §5.4: "el v-if se
//       elimina; la animación de fade pasa a CSS pura"). Este test apunta al
//       archivo correcto y verifica que `.ch6-mantra` desactiva su animación
//       bajo PRM ahí, no en el archivo global.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')
const TERMINAL_PATH = resolve(process.cwd(), 'src/components/Ch6Terminal.vue')

let ch6Src = ''
let terminalSrc = ''
try { ch6Src = readFileSync(CH6_PATH, 'utf8') } catch (_) { ch6Src = '' }
try { terminalSrc = readFileSync(TERMINAL_PATH, 'utf8') } catch (_) { terminalSrc = '' }

describe('Chapter6Content PRM (A11Y-05 + D5-08 + TASK-012)', () => {
  it('T1: createGame() recibe { prefersReduced: prefersReduced.value } opt', () => {
    expect(
      ch6Src,
      'Chapter6Content.vue debe llamar `createGame(canvasHostRef.value, { prefersReduced: prefersReduced.value })`.'
    ).toMatch(/createGame\s*\([^)]*prefersReduced\s*:\s*prefersReduced\.value/)
  })

  it('T2: Ch6Terminal.vue desactiva la animación del mantra bajo @media PRM (TASK-012 spec §5.4)', () => {
    expect(
      terminalSrc,
      'Ch6Terminal.vue debe declarar `.ch6-mantra` (ya no gateado por v-if=arrivalDone, spec §5.4).'
    ).toMatch(/\.ch6-mantra/)
    // El mantra ya no depende de JS/arrivalDone para su reveal — su gate PRM
    // vive dentro de la cascada global de reduced-motion del componente
    // (misma sección @media que apaga cursor/boot-line/word transitions).
    expect(
      terminalSrc,
      'Ch6Terminal.vue debe declarar `@media (prefers-reduced-motion: reduce)` que apague ' +
        '`animation` en `.ch6-mantra` (D5-08 + A11Y-05 — mantra sin fade bajo PRM).'
    ).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.ch6-mantra\s*\{[\s\S]*?animation:\s*none/)
    expect(
      ch6Src,
      'Chapter6Content.vue NO debe seguir gateando el mantra con v-if="arrivalDone" (spec §5.4 — el gate se elimina).'
    ).not.toMatch(/v-if="arrivalDone"/)
  })
})
