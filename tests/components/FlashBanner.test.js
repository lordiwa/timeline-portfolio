// tests/components/FlashBanner.test.js
// TDD RED phase — Plan 04-03, Task 3.
//
// Cobertura:
// - T1 DOM contract: <header.flash-banner> + .flash-banner-chrome + .flash-banner-title + .flash-banner-subtitle
// - T2 i18n: title cambia entre locale es/en
// - T3 CSS source: chapter-themes.css contiene [data-chapter="2"] .flash-banner con
//      linear-gradient orange→deep + box-shadow + inset highlight (skeumorphic markers)
// - T4 CSS source: .flash-banner-chrome con radial-gradient (chrome dots simulando window controls)

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import FlashBanner from '@/components/FlashBanner.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

const CSS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

function mountFlashBanner({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  return mount(FlashBanner, { global: { plugins: [i18n] } })
}

describe('FlashBanner.vue', () => {
  // ─────────────────────────────────────────────────────────
  // T1 DOM contract
  // ─────────────────────────────────────────────────────────
  it('T1 DOM: <header.flash-banner> existe', () => {
    const w = mountFlashBanner()
    expect(w.find('header.flash-banner').exists()).toBe(true)
  })

  it('T1 DOM: .flash-banner-chrome existe (aria-hidden)', () => {
    const w = mountFlashBanner()
    const chrome = w.find('.flash-banner-chrome')
    expect(chrome.exists()).toBe(true)
    expect(chrome.attributes('aria-hidden')).toBe('true')
  })

  it('T1 DOM: .flash-banner-title (h2) existe con texto', () => {
    const w = mountFlashBanner()
    const title = w.find('h2.flash-banner-title')
    expect(title.exists()).toBe(true)
    expect(title.text().length).toBeGreaterThan(0)
  })

  it('T1 DOM: .flash-banner-subtitle existe con texto', () => {
    const w = mountFlashBanner()
    const sub = w.find('.flash-banner-subtitle')
    expect(sub.exists()).toBe(true)
    expect(sub.text().length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────
  // T2 i18n: title cambia entre locales
  // ─────────────────────────────────────────────────────────
  it('T2 i18n: title ES vs EN son strings no vacíos (paridad asegura presencia)', () => {
    const wEs = mountFlashBanner({ locale: 'es' })
    const wEn = mountFlashBanner({ locale: 'en' })
    const tEs = wEs.find('h2.flash-banner-title').text()
    const tEn = wEn.find('h2.flash-banner-title').text()
    expect(tEs.length).toBeGreaterThan(0)
    expect(tEn.length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────
  // T3 CSS source: skeumorphic Flash markers
  // ─────────────────────────────────────────────────────────
  it('T3 CSS: chapter-themes.css contiene [data-chapter="2"] .flash-banner block', () => {
    expect(CSS_SOURCE).toMatch(/\[data-chapter=["']2["']\]\s+\.flash-banner\s*\{/)
  })

  it('T3 CSS: .flash-banner usa linear-gradient (gradiente orange→deep)', () => {
    // Match flexible: cualquier linear-gradient dentro del bloque flash-banner
    const blockMatch = CSS_SOURCE.match(
      /\[data-chapter=["']2["']\]\s+\.flash-banner\s*\{[^}]*\}/s
    )
    expect(blockMatch).toBeTruthy()
    expect(blockMatch[0]).toMatch(/linear-gradient/)
  })

  it('T3 CSS: .flash-banner usa box-shadow (drop shadow exterior)', () => {
    const blockMatch = CSS_SOURCE.match(
      /\[data-chapter=["']2["']\]\s+\.flash-banner\s*\{[^}]*\}/s
    )
    expect(blockMatch).toBeTruthy()
    expect(blockMatch[0]).toMatch(/box-shadow/)
  })

  it('T3 CSS: .flash-banner usa inset highlight (skeumorphic emboss top)', () => {
    const blockMatch = CSS_SOURCE.match(
      /\[data-chapter=["']2["']\]\s+\.flash-banner\s*\{[^}]*\}/s
    )
    expect(blockMatch).toBeTruthy()
    expect(blockMatch[0]).toMatch(/inset\s+0\s+1px/)
  })

  // ─────────────────────────────────────────────────────────
  // T4 CSS: chrome dots
  // ─────────────────────────────────────────────────────────
  it('T4 CSS: .flash-banner-chrome usa radial-gradient (chrome window-control dots)', () => {
    const blockMatch = CSS_SOURCE.match(
      /\[data-chapter=["']2["']\]\s+\.flash-banner-chrome\s*\{[^}]*\}/s
    )
    expect(blockMatch).toBeTruthy()
    expect(blockMatch[0]).toMatch(/radial-gradient/)
  })
})
