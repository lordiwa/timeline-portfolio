// tests/styles/focus-ring.test.js
// Verifica que el focus ring universal de App.vue (3px solid var(--c-focus), offset 3px)
// permanece intacto después de Phase 2, y que chapter-themes.css NO declara outline propio
// (Pitfall 7 de RESEARCH: jamás override outline dentro de un chapter block).
//
// Cobertura: A11Y-03 (focus ring universal preservado), Pitfall 7.
// Tests ARQUITECTURALES: verifican source text via readFileSync — NO computed styles.
// Ver plan `notes.jsdom_limitation`.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const APP_VUE = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8')
const THEMES_CSS = readFileSync(resolve(process.cwd(), 'src/styles/chapter-themes.css'), 'utf8')
const LANG_TOGGLE = readFileSync(resolve(process.cwd(), 'src/components/LangToggle.vue'), 'utf8')

// Helper: extrae el bloque de contenido de un chapter dado en chapter-themes.css
function getBlock(source, chapter) {
  const regex = new RegExp(`\\[data-chapter="${chapter}"\\]\\s*\\{([\\s\\S]*?)\\}`)
  const match = source.match(regex)
  return match ? match[1] : ''
}

describe('focus-ring.test.js — universal focus ring preserved + Pitfall 7 (A11Y-03)', () => {
  // T1: App.vue mantiene el :focus-visible universal con outline 3px solid + offset 3px
  it('T1: App.vue :focus-visible preserves outline 3px solid var(--c-focus) and outline-offset 3px', () => {
    // Verificar que el bloque :focus-visible existe y tiene las dos declaraciones críticas
    expect(APP_VUE).toMatch(/:focus-visible\s*\{[\s\S]*?outline:\s*3px\s*solid\s*var\(--c-focus\)[\s\S]*?\}/)
    expect(APP_VUE).toMatch(/:focus-visible\s*\{[\s\S]*?outline-offset:\s*3px[\s\S]*?\}/)
  })

  // T2: chapter-themes.css NO declara outline: dentro de ningún chapter block (Pitfall 7)
  it('T2: chapter-themes.css does NOT declare outline: inside any chapter block (Pitfall 7)', () => {
    for (let i = 0; i <= 6; i++) {
      const block = getBlock(THEMES_CSS, i)
      // El bloque existe
      expect(block.length).toBeGreaterThan(0)
      // El bloque NO contiene una declaración outline: (solo --c-focus variable)
      // Permitir outline: dentro de comentarios (/* ... */) pero no como propiedad CSS
      const blockWithoutComments = block.replace(/\/\*[\s\S]*?\*\//g, '')
      expect(blockWithoutComments).not.toMatch(/outline:/)
    }
  })

  // T3: LangToggle.vue NO declara outline: dentro del bloque .lang-toggle scoped (Pitfall 7)
  it('T3: LangToggle.vue .lang-toggle rule does NOT declare outline: (inherits universal from App.vue)', () => {
    // Extraer el contenido del bloque <style scoped>
    const styleMatch = LANG_TOGGLE.match(/<style scoped[^>]*>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()
    const styleContent = styleMatch[1]

    // Extraer el bloque .lang-toggle { ... }
    const langToggleBlock = styleContent.match(/\.lang-toggle\s*\{([^}]*)\}/)
    expect(langToggleBlock).not.toBeNull()
    const blockContent = langToggleBlock[1]

    // Verificar que NO hay declaración outline: dentro del bloque principal
    expect(blockContent).not.toMatch(/outline:/)
  })
})
