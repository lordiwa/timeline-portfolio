// TASK-050 — el token de debug de App Check no puede llegar al bundle de produccion. Corre un `vite build` real.
import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function filesOf(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesOf(join(dir, e.name)) : [join(dir, e.name)]))
}

describe('build de produccion', () => {
  it('con VITE_APPCHECK_DEBUG_TOKEN en el entorno el dist NO contiene el token (evita filtrar un token de debug que saltea App Check)', () => {
    const out = mkdtempSync(join(tmpdir(), 'qa-canary-'))
    try {
      execSync(`npx vite build --outDir "${out}" --emptyOutDir`, {
        cwd: process.cwd(), stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production', VITE_APPCHECK_DEBUG_TOKEN: 'CANARIO-123', VITE_RECAPTCHA_SITE_KEY: 'site-key-ok' },
      })
      const text = filesOf(out).filter((f) => /\.(js|html|css)$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n')
      expect(text).not.toContain('CANARIO-123')
      expect(text).toContain('site-key-ok') // el sensor puede fallar: la clave publica del sitio SI se inlinea
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  }, 240000)
})
