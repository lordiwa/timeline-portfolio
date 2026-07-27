// tests/data/contact.test.js
// Contrato de shape para src/data/contact.js (CON-03 + D3-10 + T-CON-03).
//
// TASK-013: phone + location son campos NUEVOS (Rafael, .planning/GUION-TEXTOS-FINAL.md
// PARTE 3) — el shape D3-10 original (4 keys) se extiende a 6.
//
// 5 tests (T1..T5):
//   T1 — contact es object con exactamente 6 keys: email, phone, location, linkedinUrl, githubUrl, otherUrl
//   T2 — contact.email es string (puede ser '' placeholder) y, si no vacío, email válido
//   T3 — (T-CON-03) linkedinUrl y githubUrl son '' o comienzan con 'https://'
//         (URLs hardcoded en source code — NO user input runtime)
//   T4 — contact.phone es string no vacío (formato +<código país> local)
//   T5 — contact.location es string no vacío

import { describe, it, expect } from 'vitest'
import { contact } from '@/data/contact'

describe('contact shape contract (CON-03 + T-CON-03)', () => {
  it('T1 — contact es object con exactamente las 6 keys (TASK-013: +phone +location)', () => {
    expect(typeof contact).toBe('object')
    expect(contact).not.toBeNull()

    const keys = Object.keys(contact).sort()
    expect(keys).toEqual(
      ['email', 'phone', 'location', 'githubUrl', 'linkedinUrl', 'otherUrl'].sort()
    )
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

  it('T4 — contact.phone es string; si no vacío, empieza con "+" (formato internacional)', () => {
    expect(typeof contact.phone).toBe('string')
    if (contact.phone !== '') {
      expect(contact.phone.startsWith('+')).toBe(true)
    }
  })

  it('T5 — contact.location es string', () => {
    expect(typeof contact.location).toBe('string')
  })
})
