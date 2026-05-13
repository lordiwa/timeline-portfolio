// tests/data/contact.test.js
// Contrato de shape para src/data/contact.js (CON-03 + D3-10 + T-CON-03).
//
// 3 tests (T1..T3):
//   T1 — contact es object con exactamente 4 keys: email, linkedinUrl, githubUrl, otherUrl
//   T2 — contact.email es string (puede ser '' placeholder)
//   T3 — (T-CON-03) linkedinUrl y githubUrl son '' o comienzan con 'https://'
//         (URLs hardcoded en source code — NO user input runtime)

import { describe, it, expect } from 'vitest'
import { contact } from '@/data/contact'

describe('contact shape contract (CON-03 + T-CON-03)', () => {
  it('T1 — contact es object con exactamente las 4 keys D3-10', () => {
    expect(typeof contact).toBe('object')
    expect(contact).not.toBeNull()

    const keys = Object.keys(contact).sort()
    expect(keys).toEqual(['email', 'githubUrl', 'linkedinUrl', 'otherUrl'].sort())
  })

  it('T2 — contact.email es string (puede ser \'\' placeholder)', () => {
    expect(typeof contact.email).toBe('string')
    // Si no está vacío, debe ser un email válido
    if (contact.email !== '') {
      expect(contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    }
  })

  it('T3 — (T-CON-03) linkedinUrl y githubUrl son \'\' o comienzan con https://', () => {
    expect(
      contact.linkedinUrl === '' || contact.linkedinUrl.startsWith('https://')
    ).toBe(true)

    expect(
      contact.githubUrl === '' || contact.githubUrl.startsWith('https://')
    ).toBe(true)
  })
})
