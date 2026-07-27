// tests/integration/scroll-stage-no-programmatic-scroll.test.js
// TASK-014 — MEDIUM regression lock (cierre ronda 3 de review, ver comentario
// de review en tasks/TASK-014.json).
//
// HALLAZGO: `.chapter-stage` (utility global, <style> sin scope al final de
// ScrollShell.vue) declaraba `overflow: hidden`. Eso NO afecta el anclaje
// sticky de `.chapter-stage` mismo —eso lo deciden los ANCESTROS, ya resuelto
// con `overflow: clip` en `.chapter-section[data-viewports]`— pero SÍ vuelve
// a `.chapter-stage` un scroll container programáticamente scrolleable para
// sus DESCENDIENTES: Tab-navigation, find-in-page o navegación por fragmento
// pueden scrollear en silencio ese contenedor si algún hijo queda en flujo
// fuera de pantalla, desalineando la coreografía del sticky sin scrollbar
// visible ni gesto de recuperación.
//
// El lock existente (scroll-shell-no-nested-scroll.test.js) NO lo atrapa
// porque sólo prohíbe `auto|scroll` — `hidden` es exactamente el mismo tipo
// de trampa (crea scroll container programático) y se le escapaba.
//
// FIX: `.chapter-stage` pasa a `overflow: clip` — imposibilita todo scroll,
// incluido el programático, y conserva el mismo recorte visual.
//
// Este lock verifica el bloque `.chapter-stage` REAL usando el parser de SFC
// (@vue/compiler-sfc `parse()`), no una regex ingenua sobre el .vue crudo —
// el `<script setup>` de ScrollShell.vue contiene el literal `<style scoped>`
// en un comentario de texto libre (ver nota en
// scroll-shell-safeguard-specificity.test.js), la misma clase de trampa
// textual que ya mordió a este ticket una vez.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'

const SCROLL_SHELL_PATH = resolve(process.cwd(), 'src/components/ScrollShell.vue')

function getChapterStageBlock() {
  const source = readFileSync(SCROLL_SHELL_PATH, 'utf8')
  const { descriptor, errors } = parse(source, { filename: 'ScrollShell.vue' })
  expect(errors, 'parse() de @vue/compiler-sfc reportó errores sobre ScrollShell.vue').toHaveLength(0)

  const globalBlock = descriptor.styles.find((s) => !s.scoped)
  expect(
    globalBlock,
    'no se encontró un <style> (global, sin scope) en ScrollShell.vue — ahí debe vivir .chapter-stage'
  ).toBeDefined()

  const blockMatch = globalBlock.content.match(/\.chapter-stage\s*\{([^}]*)\}/)
  expect(blockMatch, 'no se encontró la regla .chapter-stage en el <style> global de ScrollShell.vue').not.toBeNull()
  return blockMatch[1]
}

describe('TASK-014 regression lock: .chapter-stage no reintroduce scroll programático', () => {
  it('MEDIUM lock: .chapter-stage declara overflow: clip, nunca hidden/auto/scroll', () => {
    const block = getChapterStageBlock()
    const overflowMatch = block.match(/\boverflow:\s*([a-z-]+)\s*;/)
    expect(
      overflowMatch,
      '.chapter-stage debe declarar su propia propiedad `overflow` (hoy: `overflow: clip`)'
    ).not.toBeNull()
    expect(
      ['hidden', 'auto', 'scroll'],
      '.chapter-stage con overflow:hidden|auto|scroll vuelve al elemento un scroll container ' +
        'programáticamente scrolleable para sus descendientes (Tab/find-in-page/fragmento pueden ' +
        'scrollearlo en silencio) — usar `overflow: clip`, que recorta igual sin crear scroll container.'
    ).not.toContain(overflowMatch[1])
  })
})
