import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generate } from '../../scripts/gen-firestore-rules.mjs'

const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8').replace(/\r\n/g, '\n')

describe('firestore.rules generado (limite de llamadas a funciones)', () => {
  it('firestore.rules coincide con la salida del generador (evita editar a mano o desalinear de schema.js)', () => {
    expect(rules).toBe(generate())
  })
  it('el bloque de findings no llama a funciones propias (cada llamada cuenta contra el limite de la evaluacion)', () => {
    const lines = rules.split('\n')
    const from = lines.findIndex((l) => l.includes('d.findings is list'))
    const to = lines.findIndex((l) => l.includes('d.score is map'))
    const block = lines.slice(from + 1, to).join('\n')
    expect(block).toContain('d.findings[19]')
    expect(block).not.toMatch(/\b(valid[A-Za-z]*|optStr)\s*\(/)
  })
  it('solo queda una funcion definida (validAttempt) y se llama una vez', () => {
    const code = rules.replace(/\/\/.*$/gm, '')
    expect([...code.matchAll(/function\s+(\w+)/g)].map((m) => m[1])).toEqual(['validAttempt'])
    expect(code.match(/validAttempt\(/g)).toHaveLength(2) // definicion + allow create
  })
})
