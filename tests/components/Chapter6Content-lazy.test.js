// tests/components/Chapter6Content-lazy.test.js
//
// Phase 5 W0 — RED scaffold para PHA-04 (Vite splittable lazy import).
//
// Cobertura (2 tests source-regex):
//   T1: Chapter6Content.vue contiene `await import('@/phaser')` con string literal
//       (Vite chunk-splittable — NO variable string como `await import(modulePath)`).
//   T2: Chapter6Content.vue NO tiene top-level `import Phaser` ni
//       `import ... from 'phaser'` (rompería PHA-04 — Phaser cargaría en bundle inicial).
//
// Rationale: PHA-04 mandata que Phaser bundle (~150KB gzipped) se cargue SOLO cuando
// activeChapter=6, no en bundle inicial. Vite split requiere string literal explícito.
//
// RED scaffold W0 — verde tras W3 crea Chapter6Content.vue con lazy import.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CH6_PATH = resolve(process.cwd(), 'src/components/Chapter6Content.vue')

let src = ''
try { src = readFileSync(CH6_PATH, 'utf8') } catch (_) { src = '' }

describe('Chapter6Content.vue PHA-04 lazy bundle — RED W0 → verde W3', () => {
  it('T1: presencia `await import(\'@/phaser\')` (string literal, Vite splittable)', () => {
    expect(
      src,
      'Chapter6Content.vue debe contener `await import(\'@/phaser\')` con string literal exacto. ' +
        'Variables strings rompen Vite chunk-splitting (PHA-04). W3 crea este archivo.'
    ).toMatch(/await\s+import\s*\(\s*['"]@\/phaser['"]\s*\)/)
  })

  it('T2: NO top-level `import Phaser` ni `import ... from \'phaser\'`', () => {
    if (src.length === 0) {
      // W3 aún no creó el archivo — RED esperado.
      expect(src, 'src/components/Chapter6Content.vue debe existir (W3 lo crea).').not.toBe('')
      return
    }
    expect(
      src,
      'Chapter6Content.vue NO debe tener `import Phaser from \'phaser\'` top-level (rompería ' +
        'lazy split — Phaser entraría al bundle inicial). PHA-04.'
    ).not.toMatch(/^\s*import\s+Phaser\s+from\s+['"]phaser['"]/m)
    expect(
      src,
      'Chapter6Content.vue NO debe tener `import ... from \'phaser\'` top-level (PHA-04).'
    ).not.toMatch(/^\s*import\s+[^()]+from\s+['"]phaser['"]/m)
  })
})
