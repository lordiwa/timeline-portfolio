/**
 * fonts-bundle.test.js — Bundle smoke verify post-build (Task 5.2)
 *
 * Verifica que `npm run build` produce un bundle con:
 * - ≥5 @font-face declarations en dist/assets/*.css
 * - font-display: swap presente (R1 FOUT mitigation activa)
 * - ≥1 archivo .woff2 en dist/assets/
 * - Suma total de .woff2 entre 150 KB y 350 KB (Latin Extended guaranteed; D2-08 target)
 *
 * PREREQUISITO: Ejecutar `npm run build` ANTES de correr este test.
 * El comando <automated> del plan lo hace: `npm run build && npm run test:run -- tests/styles/fonts-bundle`
 *
 * Este test verifica el side-effect REAL del bundle — no el source code.
 * Complementa fonts-loaded.test.js (source-level) con evidencia del bundle final.
 *
 * D2-07 + D2-08 + RESEARCH §R4 (font-display: swap = R1 FOUT mitigation).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

// ── Helpers ──────────────────────────────────────────────────────────────────
const DIST_ASSETS = resolve(process.cwd(), 'dist/assets')

const allFiles = () => {
  if (!existsSync(DIST_ASSETS)) {
    throw new Error(
      `dist/assets/ no existe. Ejecutar "npm run build" antes de este test.\n` +
      `Comando: npm run build && npm run test:run -- tests/styles/fonts-bundle`
    )
  }
  return readdirSync(DIST_ASSETS)
}

const cssFiles = () => allFiles().filter(f => f.endsWith('.css'))
const woff2Files = () => allFiles().filter(f => f.endsWith('.woff2'))

const concatCssSource = () =>
  cssFiles()
    .map(f => readFileSync(join(DIST_ASSETS, f), 'utf8'))
    .join('\n')

// ── Pre-flight check ──────────────────────────────────────────────────────────
beforeAll(() => {
  // Verificación temprana: falla con mensaje claro si no hay dist/
  if (!existsSync(DIST_ASSETS)) {
    throw new Error(
      'PREREQUISITO FALTANTE: dist/assets/ no existe.\n' +
      'Ejecutar: npm run build\n' +
      'Luego: npm run test:run -- tests/styles/fonts-bundle'
    )
  }
})

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Fonts — bundle smoke post-build (Task 5.2)', () => {

  it('T1: dist/assets/*.css contiene ≥5 declaraciones @font-face', () => {
    const cssSource = concatCssSource()
    const matches = cssSource.match(/@font-face\s*\{/g) || []
    expect(
      matches.length,
      `Se esperaban ≥5 @font-face en bundle CSS, encontrados: ${matches.length}. ` +
      `Verificar que npm run build se ejecutó después de wiring los fonts en main.js.`
    ).toBeGreaterThanOrEqual(5)
  })

  it('T2: dist/assets/*.css contiene font-display: swap (R1 FOUT mitigation activa)', () => {
    const cssSource = concatCssSource()
    const hasFontDisplaySwap = /font-display\s*:\s*swap/.test(cssSource)
    expect(
      hasFontDisplaySwap,
      'font-display: swap no encontrado en bundle CSS. ' +
      'Los paquetes @fontsource lo declaran por defecto — verificar imports en main.js.'
    ).toBe(true)
  })

  it('T3: dist/assets/ contiene ≥1 archivo .woff2 (fonts bundleados por Vite)', () => {
    const woff2 = woff2Files()
    expect(
      woff2.length,
      `Se esperaba ≥1 .woff2 en dist/assets/, encontrados: ${woff2.length}. ` +
      `Verificar que Vite está bundleando los assets de @fontsource.`
    ).toBeGreaterThanOrEqual(1)
  })

  it('T4: suma total de .woff2 está entre 150 KB y 350 KB (Latin Extended garantizado; D2-08)', () => {
    const woff2 = woff2Files()
    const totalBytes = woff2.reduce((sum, f) => {
      return sum + statSync(join(DIST_ASSETS, f)).size
    }, 0)
    const totalKB = totalBytes / 1024

    // Lower bound: ≥150 KB garantiza que el subset incluye Latin Extended (ñ, á, é, etc.)
    // Si fuera <150 KB, indicaría que solo se cargó Latin Basic — violación Open-Q2-E.
    expect(
      totalBytes,
      `Bundle .woff2 demasiado pequeño: ${totalKB.toFixed(1)} KB (mínimo 150 KB requerido). ` +
      `Un bundle <150 KB indica que Latin Extended no está incluido — violación Open-Q2-E (ñ, á, etc.).`
    ).toBeGreaterThanOrEqual(150 * 1024)

    // Upper bound: ≤350 KB — tolerancia para 6 fonts con subsets latin + latin-ext.
    // Si supera 350 KB, puede indicar que se incluyeron subsets innecesarios (cyrillic, greek, etc.).
    expect(
      totalBytes,
      `Bundle .woff2 demasiado grande: ${totalKB.toFixed(1)} KB (máximo 350 KB). ` +
      `Verificar que main.js usa imports de subsets específicos (/latin.css, /latin-ext.css) ` +
      `en lugar del index.css completo que incluye cyrillic/greek.`
    ).toBeLessThanOrEqual(350 * 1024)
  })

})
