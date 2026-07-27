/**
 * fonts-loaded.test.js — Source-level smoke + regression tests (Task 5.1,
 * actualizado por TASK-008 §AC#4: Cinzel + Cinzel Decorative salen del bundle,
 * Roboto ya no se importaba desde 2026-06-01 y ahora se retira de package.json.
 * TASK-009, ronda de corrección: Lobster sale, Open Sans entra para ch3 — spec
 * §5 de .planning/design/03-ch3-muerte-de-flash.md, ver eras.css/main.js).
 *
 * Verifica:
 * - package.json contiene los 6 paquetes @fontsource* (sin Verdana/Trebuchet self-hosted)
 * - Versiones son ^5.x (major version 5)
 * - src/main.js importa los 6 paquetes ANTES de eras.css
 * - src/styles/eras.css declara --font-body matcheando cada paquete instalado
 * - ch2 (Verdana/Trebuchet MS) NO tiene package @fontsource correspondiente (system-safe lock)
 * - Cinzel/Cinzel Decorative/Roboto NO están en package.json ni en main.js (AC#4 regression lock)
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
  resolve(process.cwd(), 'src/styles/eras.css'),
  'utf8'
)

// Paquetes self-hosted esperados (ch2 omitido — system-safe).
// TASK-008: Cinzel + Cinzel Decorative retirados (AC#4, bundle de fuentes);
// Roboto retirado de package.json (dead dependency, no se importaba desde 2026-06-01).
// TASK-009 (ronda de corrección): Lobster → Open Sans (ch3, spec §5).
const EXPECTED_PACKAGES = [
  '@fontsource/vt323',
  '@fontsource/comic-neue',
  '@fontsource/open-sans',
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
    expect(fontsourceKeys).toHaveLength(EXPECTED_PACKAGES.length)
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
    // Phase 5 W0: ch6 reusa @fontsource/audiowide (mismo paquete que ch4) — vibe synthwave D5-04.
    // @fontsource/press-start-2p sigue presente en deps + main.js como reserva (no eliminado en W0;
    // ownership de remoción queda fuera scope Phase 5).
    const expectedPackages = [
      `@fontsource/vt323`,          // ch0
      `@fontsource/comic-neue`,     // ch1
      `@fontsource/open-sans`,      // ch3 (TASK-009 ronda de corrección, spec §5)
      `@fontsource/audiowide`,      // ch4 + ch6 (Phase 5 D5-04 synthwave)
      `inter-variable-latin`,       // ch5 — selector local apuntando a @fontsource-variable/inter files
      `@fontsource/press-start-2p`, // reserva (Phase 2 stub, no consumido por ningún chapter post-Phase 5)
    ]
    for (const pkg of expectedPackages) {
      expect(mainSource, `Falta referencia a ${pkg} en main.js`).toContain(pkg)
    }
  })

  it('T4: imports de fonts aparecen ANTES de eras.css en main.js', () => {
    // Verifica que el bloque de imports de fonts precede al import de eras.css
    // (TASK-008: reemplaza a chapter-themes.css). Los imports de fonts usan
    // rutas @fontsource/* o referencias a CSS locales de fonts.
    const fontsBlockStart = mainSource.indexOf('@fontsource/vt323')
    const erasImport = mainSource.indexOf("import './styles/eras.css'")
    expect(fontsBlockStart, 'No se encontró el bloque de fonts en main.js').toBeGreaterThan(-1)
    expect(erasImport, 'No se encontró el import de eras.css').toBeGreaterThan(-1)
    expect(fontsBlockStart, 'Los fonts deben aparecer ANTES de eras.css').toBeLessThan(erasImport)
  })

  it('T5: eras.css declara --font-body correcto para cada chapter (incluye ch2 system-safe)', () => {
    // Phase 5 W0: ch6 cambia de 'Press Start 2P' (Phase 2 stub) a 'Audiowide'
    // (D5-04 synthwave-friendly: vapor/vaporwave aesthetic).
    const fontMappings = [
      { chapter: 'ch0', pattern: /\[data-chapter="0"\][\s\S]*?--font-body\s*:\s*['"]VT323['"]/ },
      { chapter: 'ch1', pattern: /\[data-chapter="1"\][\s\S]*?--font-body\s*:\s*['"]Comic Neue['"]/ },
      { chapter: 'ch2', pattern: /\[data-chapter="2"\][\s\S]*?--font-body\s*:\s*['"]Verdana['"]/ },
      // TASK-009 (ronda de corrección): ch3 usa Open Sans, la fuente auténtica
      // de 2013 que fija la spec (.planning/design/03-ch3-muerte-de-flash.md
      // §5) — self-hosted vía @fontsource/open-sans (ver main.js), reemplaza
      // a Lobster (retirada, ningún capítulo la renderizaba).
      { chapter: 'ch3', pattern: /\[data-chapter="3"\][\s\S]*?--font-body\s*:\s*['"]Open Sans['"]/ },
      { chapter: 'ch4', pattern: /\[data-chapter="4"\][\s\S]*?--font-body\s*:\s*['"]Audiowide['"]/ },
      { chapter: 'ch5', pattern: /\[data-chapter="5"\][\s\S]*?--font-body\s*:\s*['"]Inter Variable['"]/ },
      { chapter: 'ch6', pattern: /\[data-chapter="6"\][\s\S]*?--font-body\s*:\s*['"]Audiowide['"]/ },
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

  // T7 (AC#4 regression lock): Cinzel/Cinzel Decorative/Roboto no vuelven al bundle.
  it('T7: Cinzel, Cinzel Decorative and Roboto are absent from package.json and main.js', () => {
    const deps = packageJson.dependencies || {}
    expect(deps).not.toHaveProperty('@fontsource/cinzel')
    expect(deps).not.toHaveProperty('@fontsource/cinzel-decorative')
    expect(deps).not.toHaveProperty('@fontsource/roboto')
    expect(mainSource).not.toContain('@fontsource/cinzel')
    expect(mainSource).not.toContain('@fontsource/roboto')
  })

})
