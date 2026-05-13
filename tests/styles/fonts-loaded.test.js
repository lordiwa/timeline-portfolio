/**
 * fonts-loaded.test.js — Source-level smoke + regression tests (Task 5.1)
 *
 * Verifica:
 * - package.json contiene los 6 paquetes @fontsource* (sin Verdana/Trebuchet self-hosted)
 * - Versiones son ^5.x (major version 5)
 * - src/main.js importa los 6 paquetes ANTES de chapter-themes.css
 * - src/styles/chapter-themes.css declara --font-body matcheando cada paquete instalado
 * - ch2 (Verdana/Trebuchet MS) NO tiene package @fontsource correspondiente (system-safe lock)
 *
 * No es TDD "RED→GREEN" — verifica estado del filesystem post-install. Útil como
 * regression guard: si alguien remueve un import o paquete, el test falla inmediatamente.
 *
 * D2-07 + D2-08 + RESEARCH §R4 + Example 7 Option A.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ── Helpers ──────────────────────────────────────────────────────────────────
const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')
)

const mainSource = readFileSync(
  resolve(process.cwd(), 'src/main.js'),
  'utf8'
)

const themesSource = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

// Los 6 paquetes self-hosted esperados (ch2 omitido — system-safe)
const EXPECTED_PACKAGES = [
  '@fontsource/vt323',
  '@fontsource/comic-neue',
  '@fontsource/lobster',
  '@fontsource/audiowide',
  '@fontsource/press-start-2p',
  '@fontsource-variable/inter',
]

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Fonts — source-level (Task 5.1)', () => {

  it('T1: package.json contiene exactamente los 6 paquetes @fontsource*', () => {
    const deps = packageJson.dependencies || {}
    for (const pkg of EXPECTED_PACKAGES) {
      expect(deps, `Falta paquete: ${pkg}`).toHaveProperty(pkg)
    }
    // Verificar count exacto de paquetes @fontsource* en dependencies
    const fontsourceKeys = Object.keys(deps).filter(k => k.startsWith('@fontsource'))
    expect(fontsourceKeys).toHaveLength(6)
  })

  it('T2: versiones de los 6 paquetes son ^5.x (major version 5)', () => {
    const deps = packageJson.dependencies || {}
    for (const pkg of EXPECTED_PACKAGES) {
      const version = deps[pkg]
      expect(version, `${pkg} versión inesperada: ${version}`).toMatch(/^\^5\./)
    }
  })

  it('T3: src/main.js importa los 6 paquetes @fontsource* (latin + latin-ext subsets)', () => {
    // Verifica que cada font package está referenciado al menos una vez en main.js.
    // Los imports usan subsets específicos (/latin.css, /latin-ext.css) para mantener
    // el bundle en el rango 150-350 KB (D2-08). Esto cubre ES/EN (Open-Q2-E).
    // ch5 (Inter Variable) usa un CSS local selector en src/styles/inter-variable-latin.css.
    const expectedPackages = [
      `@fontsource/vt323`,          // ch0
      `@fontsource/comic-neue`,     // ch1
      `@fontsource/lobster`,        // ch3
      `@fontsource/audiowide`,      // ch4
      `inter-variable-latin`,       // ch5 — selector local apuntando a @fontsource-variable/inter files
      `@fontsource/press-start-2p`, // ch6
    ]
    for (const pkg of expectedPackages) {
      expect(mainSource, `Falta referencia a ${pkg} en main.js`).toContain(pkg)
    }
  })

  it('T4: imports de fonts aparecen ANTES de chapter-themes.css en main.js', () => {
    // Verifica que el bloque de imports de fonts precede al import de chapter-themes.
    // Los imports de fonts usan rutas @fontsource/* o referencias a CSS locales de fonts.
    const fontsBlockStart = mainSource.indexOf('@fontsource/vt323')
    const chapterThemesImport = mainSource.indexOf("import './styles/chapter-themes.css'")
    expect(fontsBlockStart, 'No se encontró el bloque de fonts en main.js').toBeGreaterThan(-1)
    expect(chapterThemesImport, 'No se encontró el import de chapter-themes.css').toBeGreaterThan(-1)
    expect(fontsBlockStart, 'Los fonts deben aparecer ANTES de chapter-themes.css').toBeLessThan(chapterThemesImport)
  })

  it('T5: chapter-themes.css declara --font-body correcto para cada chapter (incluye ch2 system-safe)', () => {
    const fontMappings = [
      { chapter: 'ch0', pattern: /\[data-chapter="0"\][\s\S]*?--font-body\s*:\s*['"]VT323['"]/ },
      { chapter: 'ch1', pattern: /\[data-chapter="1"\][\s\S]*?--font-body\s*:\s*['"]Comic Neue['"]/ },
      { chapter: 'ch2', pattern: /\[data-chapter="2"\][\s\S]*?--font-body\s*:\s*['"]Verdana['"]/ },
      { chapter: 'ch3', pattern: /\[data-chapter="3"\][\s\S]*?--font-body\s*:\s*['"]Lobster['"]/ },
      { chapter: 'ch4', pattern: /\[data-chapter="4"\][\s\S]*?--font-body\s*:\s*['"]Audiowide['"]/ },
      { chapter: 'ch5', pattern: /\[data-chapter="5"\][\s\S]*?--font-body\s*:\s*['"]Inter Variable['"]/ },
      { chapter: 'ch6', pattern: /\[data-chapter="6"\][\s\S]*?--font-body\s*:\s*['"]Press Start 2P['"]/ },
    ]
    for (const { chapter, pattern } of fontMappings) {
      expect(themesSource, `chapter-themes.css: ${chapter} --font-body no matchea`).toMatch(pattern)
    }
  })

  it('T6: ch2 (Verdana/Trebuchet MS) NO tiene paquete @fontsource self-hosted (system-safe lock)', () => {
    // RESEARCH §R4: ch2 usa system-safe stack — NO se instala @fontsource/verdana ni similar
    const deps = packageJson.dependencies || {}
    expect(deps).not.toHaveProperty('@fontsource/verdana')
    expect(deps).not.toHaveProperty('@fontsource/trebuchet')
    expect(deps).not.toHaveProperty('@fontsource/trebuchet-ms')
    // Verificar también que main.js no importa ningún fontsource relacionado a ch2
    expect(mainSource).not.toContain('@fontsource/verdana')
    expect(mainSource).not.toContain('@fontsource/trebuchet')
  })

})
