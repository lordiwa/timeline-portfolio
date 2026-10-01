import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generate } from '../../scripts/gen-firestore-rules.mjs'

const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8').replace(/\r\n/g, '\n')

describe('firestore.rules generado (limite de llamadas a funciones)', () => {
  it('firestore.rules coincide con la salida del generador (evita editar a mano o desalinear de schema.js)', () => {
    expect(rules).toBe(generate())
  })
  it('los findings no se indexan ni iteran en las reglas (cada acceso cuesta presupuesto de evaluacion)', () => {
    const code = rules.replace(/\/\/.*$/gm, '')
    expect(code).not.toMatch(/findings\[|\.findings|valid(Finding|Candidate|Score)|optStr/)
    expect(code).toContain('d.findingsJson.size() <= 151000')
  })
  it('solo queda una funcion definida (validAttempt) y se llama una vez', () => {
    const code = rules.replace(/\/\/.*$/gm, '')
    expect([...code.matchAll(/function\s+(\w+)/g)].map((m) => m[1])).toEqual(['validAttempt'])
    expect(code.match(/validAttempt\(/g)).toHaveLength(2) // definicion + allow create
  })
})
