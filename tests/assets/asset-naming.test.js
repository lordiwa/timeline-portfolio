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

// Enum explícito Phase 4 + Phase 5 + Phase 6 — assets esperados al finalizar:
//   - 7 busts (PNG con alpha): ch{0..6}-bust.png
//   - 1 ch2 background (JPEG opaco): ch2-bg.jpg
//   - 4 ch4 parallax layers: ch4-bg-stars-far.{png|jpg}, ch4-bg-planet-mid.{png|jpg},
//     ch4-fg-panels.png, ch4-fg-ships.png  (los fg necesitan alpha → png; bg opacos → jpg)
//   - 1 ch5 hero: ch5-hero.png (alpha needed if used as overlay)
//   - 8 Phase 5 ch6 (D5-04 synthwave + D5-01 3 planets):
//     ch6-bg.png + ch6-bg-stars-far.png + ch6-bg-nebulae-mid.png
//     ch6-planet-{ar-vr,remoose,software-mind}.png
//     ch6-ship-{1,2}.png
//   - 5 Phase 6 ch0 DOS demo reel (TerminalScroll auto-rotating programs):
//     · ch0-game-{california,warcraft,starcraft,magic}.png (pixel art game screens)
//     · ch0-os-win95.png (Windows 95 desktop final)
//     · ch0-os-win95-loading.png (Windows 95 boot splash, mostrado antes del desktop)
//     starcraft + magic listed pero opcionales — generan solo cuando Rafael entrega refs.
//
// JPG vs PNG decision (D4-W2-01): backgrounds opacos full-frame en JPEG, sprites con
// alpha en PNG. ch6-bg.png y ch0-game-*.png/ch0-os-*.png son PNG por VGA 16-color
// palette indexed (mejor compresión PNG indexada que JPEG para colores planos).
//   - 5 ch3 parallax fantasía épica (Rafael 2026-05-28, iter9):
//     · ch3-sky.png (cielo opaco pastel, capa lejana)
//     · ch3-mountains.png (silueta montañas, transparente arriba)
//     · ch3-path.png (camino de piedras primer plano, transparente arriba)
//     · ch3-prop-shield.png + ch3-prop-banner.png (decor heráldico, reemplaza robot+starbursts)
//     · ch3-robot.png queda como asset legacy no referenciado (bio mascota iter7-8).
//   - 3 ch3 emblemas-cuento iter10 (markers clicables) + recuadro:
//     · ch3-mark-(scroll|tome|orb).png + ch3-parchment.png
//     · ch3-flash-fallen.png (logo Flash "caído" — narrativa muerte de Flash, emblema I)
//     · ch3-html5-future.png (logo HTML5 radiante en el horizonte — el futuro)
//   - 4 ch4 parallax "flotando en el vacío" iter3 (Rafael 2026-06-01):
//     · ch4-portal.png (espacio profundo + portal con mundo 3D tenue, capa fondo opaca)
//     · ch4-character.png (chico flotando de espaldas con gafas VR, sprite transparente)
//     · ch4-matrix.png (glifos matrix neón tenues, transparente — capa híbrida c3)
//     · ch4-near.png (partículas/fragmentos próximos, transparente — primer plano c0)
//     Reemplazan al ch4-bg.png iter2 (movido a old/ vía §6.5).
const ASSET_NAMING_REGEX =
  /^ch[0-6]-(bust|bg|bg-stars-far|bg-planet-mid|bg-nebulae-mid|fg-panels|fg-ships|hero|paper-bg|halftone-bg|logo-rm|robot|sky|mountains|path|parchment|flash-fallen|flash-war|html5-future|portal|character|matrix|near|prop-(shield|banner)|mark-(scroll|tome|orb|rebuild|standard)|starburst-(green|orange)|planet-(ar-vr|remoose|software-mind)|ship-[12]|game-(california|warcraft|starcraft|magic)|os-(win95|win95-loading))\.(png|jpg)$/

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
