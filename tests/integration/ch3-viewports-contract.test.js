// tests/integration/ch3-viewports-contract.test.js
// TASK-009 (ronda de corrección, LOW): App.vue estampa `:chapter-viewports="{
// 3: 11 }"` como literal duplicado, con el contrato documentado sólo por
// comentario ("11 = TOTAL_UNITS(10) + 1 viewport de release" — ver App.vue).
// Un comentario no falla si el número real deriva: este lock importa
// TOTAL_UNITS de @/utils/ch3Progress.js (fuente de verdad del presupuesto de
// progreso, ver ese archivo) y verifica que el literal de App.vue sigue
// siendo TOTAL_UNITS + 1. Si alguien cambia ACT1_UNITS/ACT2_SLIDE_COUNT sin
// actualizar App.vue en el mismo commit, este test falla en vez de dejar el
// mecanismo de anclaje de ScrollShell con un rango de scroll equivocado.
//
// App.vue está fuera de la lista blanca de TASK-009 (solo tests/** para esta
// verificación) — el test lee el source, no lo modifica.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TOTAL_UNITS } from '@/utils/ch3Progress'

const APP_SRC = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

describe('TASK-009 LOW lock: App.vue chapter-viewports={3:N} sigue derivado de TOTAL_UNITS', () => {
  it('el literal N de :chapter-viewports="{ 3: N }" es igual a TOTAL_UNITS + 1', () => {
    const match = APP_SRC.match(/:chapter-viewports="\{\s*3:\s*(\d+)\s*\}"/)
    expect(match, 'No se encontró el prop chapter-viewports={3:N} en App.vue').not.toBeNull()
    const literalN = Number(match[1])
    expect(
      literalN,
      `App.vue declara chapter-viewports={3:${literalN}} pero TOTAL_UNITS+1 (ch3Progress.js) ` +
        `es ${TOTAL_UNITS + 1} — actualizar el literal de App.vue en el mismo commit que cambie ` +
        'ACT1_UNITS/ACT2_SLIDE_COUNT.'
    ).toBe(TOTAL_UNITS + 1)
  })
})
