// tests/assets/asset-naming.test.js
//
// Test arquitectural Phase 4 W0 — guard de asset naming convention (ART-05 strict)
// + privacy gate verificación source-level (D4-02).
//
// Cobertura:
//   T1: todos los .png en public/assets/ matchean enum regex Phase 4
//   T2: los 7 busts ch{0..6}-bust.png existen al finalizar W0
//        WAVE-0-GATE: este test arranca ROJO en el commit de Task 2 y se vuelve
//        verde después de Task 4 (batch 6 busts restantes). Es el gate del checker
//        de la wave — su rojo/verde es el indicador binario de "¿W0 cerrada?".
//   T3: ART-05 strict — no hay .png con underscore en el nombre
//   T4: source-level — .gitignore contiene 'public/references/' (D4-02 privacy gate)
//
// Por qué enum explícito en lugar de wildcard ([a-z]+\.png):
//   Un commit accidental de ch4-particle.png (descriptor genérico no listado en
//   spec Phase 4) NO debe pasar — Phase 4 solo mandata 13 assets específicos.
//   El enum protege contra drift de naming en W2/W3/W4.
//
// Por qué T4 es source-level (readFileSync .gitignore) en lugar de runtime
// (git check-ignore): vitest no garantiza acceso a binarios git cross-platform.
// Source-level es determinista y suficiente — si la línea está, gitignore funciona.
//
// Analogs:
//   - tests/styles/themes-file.test.js (readFileSync + regex matchAll)
//   - tests/styles/fonts-bundle.test.js (readdirSync + existsSync defensive)

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ASSETS_DIR = resolve(process.cwd(), 'public/assets')
const GITIGNORE_PATH = resolve(process.cwd(), '.gitignore')

// Enum explícito Phase 4 — 13 assets totales esperados al finalizar la fase:
//   - 7 busts (PNG con alpha): ch{0..6}-bust.png
//   - 1 ch2 background (JPEG opaco): ch2-bg.jpg
//   - 4 ch4 parallax layers: ch4-bg-stars-far.{png|jpg}, ch4-bg-planet-mid.{png|jpg},
//     ch4-fg-panels.png, ch4-fg-ships.png  (los fg necesitan alpha → png; bg opacos → jpg)
//   - 1 ch5 hero: ch5-hero.png (alpha needed if used as overlay)
//
// JPG vs PNG decision (D4-W2-01):
//   - Sprites/busts/foregrounds que necesitan alpha → .png (forge_sprite output)
//   - Backgrounds opacos full-frame → .jpg (forge_background output, smaller filesize)
//   pixelforge.forge_background outputs JPEG bytes naturally — usar .jpg matches the
//   actual file format, no requiere conversión, mejor compresión para gradients/photos.
//
// Si Phase 4 añade un descriptor nuevo (p.ej. ch4-particle.png), este regex
// debe actualizarse intencionalmente — el rojo guía a la decisión consciente.
const ASSET_NAMING_REGEX =
  /^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|fg-panels|fg-ships|hero)\.(png|jpg)$/

// Defensive: si public/assets/ no existe o no tiene assets, devolver lista vacía
// (test setup-friendly antes del primer asset commited).
function imageFilesInAssets() {
  if (!existsSync(ASSETS_DIR)) return []
  return readdirSync(ASSETS_DIR).filter((f) => /\.(png|jpg|jpeg)$/i.test(f))
}

describe('Asset naming convention (ART-05) + privacy gate (D4-02)', () => {
  // T1 — todos los .png/.jpg matchean enum Phase 4
  it('T1: todos los assets en public/assets/ matchean el enum regex Phase 4', () => {
    const files = imageFilesInAssets()
    const offenders = files.filter((f) => !ASSET_NAMING_REGEX.test(f))
    expect(
      offenders,
      `Archivos con naming fuera de spec Phase 4: ${JSON.stringify(offenders)}. ` +
        `Esperado regex: ${ASSET_NAMING_REGEX}. ` +
        `Si añadiste un asset nuevo (p.ej. ch6-planet-mid.png), actualiza el enum en este test.`
    ).toEqual([])
  })

  // T2 — wave-0-gate: 7 busts existen al finalizar Task 4
  // Este test ESPERA correr DESPUÉS de Task 4 (batch ch0/1/2/4/5/6).
  // En el commit de Task 2 (test-only) este test ROMPE intencionalmente
  // porque los busts aún no existen — eso es el wave-0-gate red.
  // Tras Task 4 se vuelve verde sin más cambios al test.
  it('T2: los 7 busts ch{0..6}-bust.png existen al finalizar W0 (wave-0-gate)', () => {
    const missing = []
    for (let i = 0; i <= 6; i++) {
      const path = resolve(ASSETS_DIR, `ch${i}-bust.png`)
      if (!existsSync(path)) missing.push(`ch${i}-bust.png`)
    }
    expect(
      missing,
      `Busts ausentes (Task 4 incompleta): ${JSON.stringify(missing)}. ` +
        `W0 cierra cuando los 7 ch{0..6}-bust.png existen en public/assets/.`
    ).toEqual([])
  })

  // T3 — ART-05 strict: no underscores
  it('T3: no hay assets con underscore en el nombre (ART-05 strict)', () => {
    const offenders = imageFilesInAssets().filter((f) => f.includes('_'))
    expect(
      offenders,
      `Archivos con underscore: ${JSON.stringify(offenders)}. ` +
        `ART-05 mandata kebab-case: ch{N}-{descriptor}[-{variant}].{png|jpg}`
    ).toEqual([])
  })

  // T4 — source-level privacy gate: .gitignore contiene 'public/references/'
  // No usa `git check-ignore` (no portable cross-platform en vitest).
  // La línea source es suficiente: si está, git la respeta.
  it('T4: .gitignore contiene la entry public/references/ (D4-02 privacy gate)', () => {
    expect(existsSync(GITIGNORE_PATH)).toBe(true)
    const source = readFileSync(GITIGNORE_PATH, 'utf8')
    // Match line-anchored para evitar falsos positivos por un comentario que
    // mencione "public/references/" sin ser una entry activa.
    const lines = source.split(/\r?\n/).map((l) => l.trim())
    const hasEntry = lines.some(
      (l) => l === 'public/references/' || l === 'public/references'
    )
    expect(
      hasEntry,
      `.gitignore no contiene la entry 'public/references/' como línea activa. ` +
        `D4-02 privacy gate requiere excluir las 6 fotos de referencia Rafael del repo.`
    ).toBe(true)
  })
})
