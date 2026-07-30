// tests/seo/static-title.test.js
// TASK-032 — lock de regresion: el <title> ESTATICO de index.html es lo que
// ven los crawlers/previews sin JS y lo que destella antes de que Vue monte.
// No debe volver a ser el nombre del repo (package.json "name"), y debe
// coincidir verbatim con el seo.title del locale por defecto del sitio
// (es.json — html lang="es" en index.html + fallback final de
// resolveInitialLocale() en src/i18n/index.js), para que el fallback estatico
// y el title reactivo de useHead (App.vue) nunca se contradigan.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import esMessages from '../../src/i18n/es.json'
import pkg from '../../package.json'

const indexHtmlPath = resolve(process.cwd(), 'index.html')
const indexHtml = readFileSync(indexHtmlPath, 'utf-8')

function extractStaticTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/)
  return match ? match[1] : null
}

describe('index.html static <title> (TASK-032)', () => {
  it('no contiene el nombre del repo', () => {
    const title = extractStaticTitle(indexHtml)
    expect(title).not.toBeNull()
    expect(title).not.toContain(pkg.name)
  })

  it('coincide verbatim con seo.title del locale por defecto (es)', () => {
    const title = extractStaticTitle(indexHtml)
    expect(title).toBe(esMessages.seo.title)
  })
})
