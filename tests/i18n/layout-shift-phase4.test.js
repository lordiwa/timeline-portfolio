// tests/i18n/layout-shift-phase4.test.js
// Plan 04-06 Task 2 — Snapshot length comparator ES vs EN per Chapter{N}Content
// para detectar overflow potencial al toggle locale (I18N-05).

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Chapter0Content from '@/components/Chapter0Content.vue'
import Chapter1Content from '@/components/Chapter1Content.vue'
import Chapter2Content from '@/components/Chapter2Content.vue'
import Chapter4Content from '@/components/Chapter4Content.vue'
import Chapter5Content from '@/components/Chapter5Content.vue'
import { createTestI18n } from './test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    { id: 'ch2-test', chapterEra: 2, year: 2009, titleKey: 'projects.ch2-bluelizard.title', descKey: 'projects.ch2-bluelizard.desc', link: null, imageSrc: null, role: 'Test', techStack: ['Test'], planetSprite: null, planetOrbit: null, planetColor: null },
    { id: 'ch4-test', chapterEra: 4, year: 2015, titleKey: 'projects.ch4-arvr-own.title', descKey: 'projects.ch4-arvr-own.desc', link: null, imageSrc: null, role: 'Test', techStack: ['Test'], planetSprite: null, planetOrbit: null, planetColor: null },
    { id: 'ch5-test', chapterEra: 5, year: 2022, titleKey: 'projects.ch5-bairesdev.title', descKey: 'projects.ch5-bairesdev.desc', link: null, imageSrc: null, role: 'Test', techStack: ['Test'], planetSprite: null, planetOrbit: null, planetColor: null },
  ],
}))

// Helper genérico para mount Chapter{N}Content con i18n.locale variable.
// ParallaxLayers (ch4) y ScrollRevealCard (ch5) requieren provides extra.
function mountChapter(Component, locale = 'es') {
  const i18n = createTestI18n({ locale })
  return mount(Component, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { scrollProgress: ref(0.5) },
        prm: { prefersReduced: ref(false) },
      },
    },
  })
}

// Mide la diferencia relativa de length text-content ES vs EN.
// Aceptamos un rango razonable: ES típicamente 10-40% más largo que EN.
// Si la diferencia excede 100%, es señal de un problema de overflow potencial.
function compareTextLength(Component) {
  const wEs = mountChapter(Component, 'es')
  const wEn = mountChapter(Component, 'en')
  const lenEs = wEs.text().length
  const lenEn = wEn.text().length
  // Defensive: si EN es 0 (mock vacío), no podemos comparar
  if (lenEn === 0) return { lenEs, lenEn, diffPct: 0 }
  const diffPct = ((lenEs - lenEn) / lenEn) * 100
  return { lenEs, lenEn, diffPct }
}

describe('Layout shift ES vs EN — Phase 4 chapters (I18N-05)', () => {
  it('T1 Chapter0Content: ES vs EN diferencia text length <100% (no extreme overflow)', () => {
    const { lenEs, lenEn, diffPct } = compareTextLength(Chapter0Content)
    expect(lenEs, 'ES text rendered').toBeGreaterThan(0)
    expect(lenEn, 'EN text rendered').toBeGreaterThan(0)
    expect(Math.abs(diffPct), `ES vs EN diff ${diffPct.toFixed(1)}% — overflow risk`).toBeLessThan(100)
  })

  it('T2 Chapter1Content: ES vs EN diferencia text length <100%', () => {
    const { lenEs, lenEn, diffPct } = compareTextLength(Chapter1Content)
    expect(lenEs).toBeGreaterThan(0)
    expect(lenEn).toBeGreaterThan(0)
    expect(Math.abs(diffPct)).toBeLessThan(100)
  })

  it('T3 Chapter2Content: ES vs EN diferencia text length <100%', () => {
    const { lenEs, lenEn, diffPct } = compareTextLength(Chapter2Content)
    expect(lenEs).toBeGreaterThan(0)
    expect(lenEn).toBeGreaterThan(0)
    expect(Math.abs(diffPct)).toBeLessThan(100)
  })

  it('T4 Chapter4Content: ES vs EN diferencia text length <100%', () => {
    const { lenEs, lenEn, diffPct } = compareTextLength(Chapter4Content)
    expect(lenEs).toBeGreaterThan(0)
    expect(lenEn).toBeGreaterThan(0)
    expect(Math.abs(diffPct)).toBeLessThan(100)
  })

  it('T5 Chapter5Content: ES vs EN diferencia text length <100%', () => {
    const { lenEs, lenEn, diffPct } = compareTextLength(Chapter5Content)
    expect(lenEs).toBeGreaterThan(0)
    expect(lenEn).toBeGreaterThan(0)
    expect(Math.abs(diffPct)).toBeLessThan(100)
  })
})
