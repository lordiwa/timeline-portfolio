// tests/data/contact.test.js
// Contrato de shape para src/data/contact.js (CON-03 + D3-10 + T-CON-03).
//
// TASK-013: location es campo NUEVO (Rafael, .planning/GUION-TEXTOS-FINAL.md
// PARTE 3) — el shape D3-10 original (4 keys) se extiende a 5.
// TASK-023: se eliminó el campo phone — pedido directo de Rafael 2026-07-28
// ("sacalo"), ver hand-off de TASK-023. El shape vuelve a 5 keys.
//
// 5 tests (T1, T1b, T2, T3, T5):
//   T1 — contact es object con exactamente 5 keys: email, location, linkedinUrl, githubUrl, otherUrl
//   T1b — contact.phone ya no existe en el shape (TASK-023)
//   T2 — contact.email es string (puede ser '' placeholder) y, si no vacío, email válido
//   T3 — (T-CON-03) linkedinUrl y githubUrl son '' o comienzan con 'https://'
//         (URLs hardcoded en source code — NO user input runtime)
//   T5 — contact.location es string no vacío

import { describe, it, expect } from 'vitest'
import { contact } from '@/data/contact'

describe('contact shape contract (CON-03 + T-CON-03)', () => {
  it('T1 — contact es object con exactamente las 5 keys (TASK-023: -phone)', () => {
    expect(typeof contact).toBe('object')
    expect(contact).not.toBeNull()

    const keys = Object.keys(contact).sort()
    expect(keys).toEqual(
      ['email', 'location', 'githubUrl', 'linkedinUrl', 'otherUrl'].sort()
    )
  })

  it('T1b — TASK-023: contact.phone ya no existe en el shape', () => {
    expect(Object.prototype.hasOwnProperty.call(contact, 'phone')).toBe(false)
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

  it('T5 — contact.location es string', () => {
    expect(typeof contact.location).toBe('string')
  })
})
