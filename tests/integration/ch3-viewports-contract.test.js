// tests/integration/ch3-viewports-contract.test.js
// TASK-009 (ronda de corrección, LOW) — TASK-021 (reescrito): App.vue
// estampaba `:chapter-viewports="{ 3: 11 }"` como literal duplicado con el
// contrato documentado sólo por comentario. TASK-021 cierra esa trampa de
// raíz: App.vue ahora IMPORTA `CH3_VIEWPORTS` de @/utils/ch3Progress.js (la
// fuente de verdad del presupuesto de progreso) en vez de repetir un número
// a mano — un divorcio entre el literal y las constantes reales ya no es
// posible porque no hay literal que divorciar. Este lock verifica esa
// estructura (import + uso en el binding), no un valor numérico — así no
// hay que tocarlo cada vez que ACT1_UNITS/ACT2_STEP_VH/ACT2_SLIDE_COUNT
// cambien.
//
// App.vue está fuera de la lista blanca de TASK-021 salvo la línea de
// :chapter-viewports y su comentario (y el import que esa línea necesita)
// — el test lee el source, no lo modifica.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CH3_VIEWPORTS, TOTAL_UNITS } from '@/utils/ch3Progress'

const APP_SRC = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')

describe('TASK-021 lock: App.vue chapter-viewports={3:N} deriva de CH3_VIEWPORTS, nunca un literal a mano', () => {
  it('App.vue importa CH3_VIEWPORTS de @/utils/ch3Progress (o ./utils/ch3Progress)', () => {
    expect(
      APP_SRC,
      'App.vue debe importar CH3_VIEWPORTS de ch3Progress.js — sin este import, el binding ' +
        'de abajo no puede derivarse y vuelve a ser un literal repetido a mano.'
    ).toMatch(/import\s*\{[^}]*\bCH3_VIEWPORTS\b[^}]*\}\s*from\s*['"][^'"]*utils\/ch3Progress['"]/)
  })

  it('el binding :chapter-viewports="{ 3: N }" referencia la constante CH3_VIEWPORTS, no un número', () => {
    const match = APP_SRC.match(/:chapter-viewports="\{\s*3:\s*([^}]+?)\s*\}"/)
    expect(match, 'No se encontró el prop chapter-viewports={3:N} en App.vue').not.toBeNull()
    const literalValue = match[1].trim()
    expect(
      /^\d+$/.test(literalValue),
      `App.vue declara chapter-viewports={3:${literalValue}} como NÚMERO LITERAL — TASK-021 exige ` +
        'referenciar la constante CH3_VIEWPORTS importada, no repetir el valor a mano (bomba de tiempo ' +
        'que este ticket cerró).'
    ).toBe(false)
    expect(literalValue).toBe('CH3_VIEWPORTS')
  })

  it('sanity: CH3_VIEWPORTS (la constante que App.vue termina usando) sigue siendo ceil(TOTAL_UNITS) + 1', () => {
    expect(CH3_VIEWPORTS).toBe(Math.ceil(TOTAL_UNITS) + 1)
  })
})
