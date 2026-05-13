// tests/seo/json-ld.test.js
// Verifica JSON-LD Person schema (SEO-02) — tests unitarios sobre buildPersonSchema()
// y seoConfig. No requiere mount Vue ni runtime de unhead.
// Plan 03-04 TDD RED phase. GREEN: src/config/seo.js (Task 4.1 ya creado).

import { describe, it, expect } from 'vitest'
import { buildPersonSchema, seoConfig } from '@/config/seo'

describe('JSON-LD Person schema (SEO-02)', () => {
  it('T1 — buildPersonSchema retorna objeto valid JSON-LD Person', () => {
    const schema = buildPersonSchema()
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Person')
    expect(schema['@id']).toBe(seoConfig.siteUrl)
    expect(schema.name).toBe(seoConfig.name)
    expect(schema.url).toBe(seoConfig.siteUrl)
    expect(schema.image).toBe(`${seoConfig.siteUrl}/og-image.png`)
  })

  it('T2 — knowsLanguage incluye es y en', () => {
    const schema = buildPersonSchema()
    expect(schema.knowsLanguage).toEqual(['es', 'en'])
  })

  it('T3 — address es PostalAddress en Quito, EC', () => {
    const schema = buildPersonSchema()
    expect(schema.address['@type']).toBe('PostalAddress')
    expect(schema.address.addressLocality).toBe('Quito')
    expect(schema.address.addressCountry).toBe('EC')
  })

  it('T4 — JSON.stringify(schema) es parsable', () => {
    const schema = buildPersonSchema()
    const json = JSON.stringify(schema)
    const parsed = JSON.parse(json)
    // Comparar solo las props que JSON.stringify conserva (undefined se omite)
    expect(parsed['@context']).toBe(schema['@context'])
    expect(parsed['@type']).toBe(schema['@type'])
    expect(parsed.name).toBe(schema.name)
    expect(parsed.knowsLanguage).toEqual(schema.knowsLanguage)
  })

  it('T5 — worksFor es Organization SI seoConfig.worksFor esta lleno, undefined SI vacio', () => {
    const schema = buildPersonSchema()
    if (seoConfig.worksFor === '') {
      expect(schema.worksFor).toBeUndefined()
    } else {
      expect(schema.worksFor['@type']).toBe('Organization')
      expect(schema.worksFor.name).toBe(seoConfig.worksFor)
    }
  })

  it('T6 — sameAs es array (puede estar vacio si Rafael no lleno §3)', () => {
    const schema = buildPersonSchema()
    expect(Array.isArray(schema.sameAs)).toBe(true)
    // No assertion sobre length — puede ser 0 (placeholder), 2 (LinkedIn + GitHub), o 3 (con otherUrl)
  })
})
