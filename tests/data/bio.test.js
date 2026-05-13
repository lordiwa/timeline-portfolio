// tests/data/bio.test.js
// Contrato mínimo para src/data/bio.js (D3-02).
//
// 1 test:
//   T1 — bio.coreKey === 'bio.core' (referencia a i18n key; el texto bilingual vive en es/en.json)

import { describe, it, expect } from 'vitest'
import { bio } from '@/data/bio'

describe('bio shape contract (D3-02)', () => {
  it('T1 — bio.coreKey apunta a la key i18n bio.core', () => {
    expect(bio.coreKey).toBe('bio.core')
  })
})
