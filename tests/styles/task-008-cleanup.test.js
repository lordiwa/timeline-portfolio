// tests/styles/task-008-cleanup.test.js
// TASK-008 AC#6 regression lock: ch5-hero.webp y Chapter3Content.web2-fallback.vue.bak
// ya no existen en el árbol, y ninguna referencia de código queda colgada.
//
// ch5-hero.webp se retiró siguiendo el proceso CLAUDE.md §6.5 — preservado en
// public/assets/old/ch5-hero-2026-07-27-iter1.webp con entry en CHANGELOG.md,
// no borrado sin rastro.

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const REPO_ROOT = process.cwd()
const CH5_HERO_PATH = resolve(REPO_ROOT, 'public/assets/ch5-hero.webp')
const CH5_HERO_ARCHIVED_PATH = resolve(REPO_ROOT, 'public/assets/old/ch5-hero-2026-07-27-iter1.webp')
const BAK_PATH = resolve(REPO_ROOT, 'src/components/Chapter3Content.web2-fallback.vue.bak')
const CHANGELOG_PATH = resolve(REPO_ROOT, 'public/assets/old/CHANGELOG.md')

describe('task-008-cleanup.test.js — dead asset + dead file retirement (AC#6)', () => {
  it('T1: public/assets/ch5-hero.webp no longer exists at its old path', () => {
    expect(existsSync(CH5_HERO_PATH)).toBe(false)
  })

  it('T2: the retired asset is archived under public/assets/old/ per CLAUDE.md §6.5', () => {
    expect(existsSync(CH5_HERO_ARCHIVED_PATH)).toBe(true)
  })

  it('T3: public/assets/old/CHANGELOG.md documents the ch5-hero.webp retirement', () => {
    const changelog = readFileSync(CHANGELOG_PATH, 'utf8')
    expect(changelog).toContain('ch5-hero.webp')
  })

  it('T4: src/components/Chapter3Content.web2-fallback.vue.bak no longer exists', () => {
    expect(existsSync(BAK_PATH)).toBe(false)
  })

  it('T5: no source file under src/ has a functional reference (url()/path) to ch5-hero.webp', () => {
    // Nota: busca el patrón de PATH real (assets/ch5-hero), no cualquier mención
    // de la palabra — comentarios que documentan el retiro (eras.css) son legítimos.
    const offenders = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/\.(vue|js|css)$/.test(entry.name)) {
          const content = readFileSync(full, 'utf8')
          if (/assets\/ch5-hero/.test(content)) offenders.push(full)
        }
      }
    }
    walk(resolve(REPO_ROOT, 'src'))
    expect(offenders, `Referencias colgantes a ch5-hero: ${JSON.stringify(offenders)}`).toEqual([])
  })
})
