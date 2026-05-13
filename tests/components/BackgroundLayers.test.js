// tests/components/BackgroundLayers.test.js
// Tests del componente BackgroundLayers.vue (Plan 02-04, Wave 3).
//
// Cobertura (7 tests — behavior block del plan):
//   T1 — DOM contract: .bg-layers wrapper existe + 2 .bg-layer hijos (.bg-layer-a + .bg-layer-b)
//   T2 — aria-hidden: .bg-layers tiene aria-hidden="true" (HUD decorativo, no accesible)
//   T3 — data-chapter binding: props iniciales se reflejan en atributos data-chapter
//   T4 — opacity binding reactive: mutate opacity ref → DOM actualiza style
//   T5 — data-chapter binding reactive: mutate chapter ref → atributo data-chapter actualiza
//   T6 — CSS readFileSync — wrapper: .bg-layers tiene position:fixed, inset:0, z-index:-1, pointer-events:none
//   T7 — CSS readFileSync — layer + PRM: .bg-layer tiene position:absolute, background:var(--c-bg),
//         transition:opacity 200ms ease + @media prefers-reduced-motion 150ms
//
// Patrones:
//   - provide bgMorph stub con refs mutables (StickyAvatar.test.js pattern)
//   - readFileSync para asserts CSS estático (StickyAvatar.test.js Tests 7-10)

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import BackgroundLayers from '@/components/BackgroundLayers.vue'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const BG_LAYERS_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/BackgroundLayers.vue'),
  'utf8'
)

// ─────────────────────────────────────────────────────────────────────────────
// Helper: monta BackgroundLayers con provide bgMorph stub mutable.
// Retorna { wrapper, layerA, layerB } para mutar refs + assert DOM.
// ─────────────────────────────────────────────────────────────────────────────
function mountBgLayers({ initialA = { chapter: 3, opacity: 1 }, initialB = { chapter: null, opacity: 0 } } = {}) {
  const layerA = {
    chapter: ref(initialA.chapter),
    opacity: ref(initialA.opacity),
  }
  const layerB = {
    chapter: ref(initialB.chapter),
    opacity: ref(initialB.opacity),
  }

  const wrapper = mount(BackgroundLayers, {
    global: {
      provide: {
        bgMorph: { layerA, layerB },
      },
    },
  })
  return { wrapper, layerA, layerB }
}

describe('BackgroundLayers.vue', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // T1 — DOM contract: wrapper .bg-layers + 2 hijos .bg-layer
  // ───────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: .bg-layers wrapper exists with 2 .bg-layer children (.bg-layer-a + .bg-layer-b)', () => {
    const { wrapper } = mountBgLayers()

    const bgLayers = wrapper.find('.bg-layers')
    expect(bgLayers.exists()).toBe(true)

    const layers = wrapper.findAll('.bg-layer')
    expect(layers).toHaveLength(2)

    expect(wrapper.find('.bg-layer.bg-layer-a').exists()).toBe(true)
    expect(wrapper.find('.bg-layer.bg-layer-b').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T2 — aria-hidden: decorativo, screen readers lo omiten
  // ───────────────────────────────────────────────────────────────────────────
  it('T2 aria-hidden: .bg-layers has aria-hidden="true" (decorative HUD, screen readers skip)', () => {
    const { wrapper } = mountBgLayers()
    expect(wrapper.find('.bg-layers').attributes('aria-hidden')).toBe('true')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T3 — data-chapter binding inicial
  // ───────────────────────────────────────────────────────────────────────────
  it('T3 data-chapter binding: layerA.chapter=3 renders data-chapter="3"; layerB.chapter=null renders absent/empty', () => {
    const { wrapper } = mountBgLayers({
      initialA: { chapter: 3, opacity: 1 },
      initialB: { chapter: null, opacity: 0 },
    })

    const layerA = wrapper.find('.bg-layer-a')
    const layerB = wrapper.find('.bg-layer-b')

    expect(layerA.attributes('data-chapter')).toBe('3')
    // null se renderiza como atributo ausente o vacío — ambos son válidos en Vue
    const bChapter = layerB.attributes('data-chapter')
    expect(bChapter === undefined || bChapter === '' || bChapter === 'null').toBe(true)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T4 — opacity binding reactivo
  // ───────────────────────────────────────────────────────────────────────────
  it('T4 opacity binding reactive: mutating layerB.opacity updates its style', async () => {
    const { wrapper, layerB } = mountBgLayers({
      initialA: { chapter: 3, opacity: 1 },
      initialB: { chapter: null, opacity: 0 },
    })

    const bgLayerB = () => wrapper.find('.bg-layer-b')

    // Verificar estado inicial
    expect(bgLayerB().attributes('style')).toContain('opacity: 0')

    // Mutar opacity ref
    layerB.opacity.value = 1
    await nextTick()

    expect(bgLayerB().attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T5 — data-chapter binding reactivo
  // ───────────────────────────────────────────────────────────────────────────
  it('T5 data-chapter binding reactive: mutating layerA.chapter updates data-chapter attribute', async () => {
    const { wrapper, layerA } = mountBgLayers()

    const bgLayerA = () => wrapper.find('.bg-layer-a')
    expect(bgLayerA().attributes('data-chapter')).toBe('3')

    layerA.chapter.value = 5
    await nextTick()

    expect(bgLayerA().attributes('data-chapter')).toBe('5')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T6 — CSS readFileSync: .bg-layers wrapper (position:fixed + inset:0 + z-index:-1 + pointer-events:none)
  // ───────────────────────────────────────────────────────────────────────────
  it('T6 CSS wrapper: .bg-layers declares position:fixed, inset:0, z-index:-1, pointer-events:none', () => {
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layers\s*\{[\s\S]*?position:\s*fixed/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layers\s*\{[\s\S]*?inset:\s*0/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layers\s*\{[\s\S]*?z-index:\s*-1/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layers\s*\{[\s\S]*?pointer-events:\s*none/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // T7 — CSS readFileSync: .bg-layer + @media PRM (transition timing)
  // ───────────────────────────────────────────────────────────────────────────
  it('T7 CSS layer + PRM: .bg-layer has position:absolute, background:var(--c-bg), transition:opacity 200ms ease; PRM media has 150ms', () => {
    // .bg-layer con todas las props requeridas
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layer\s*\{[\s\S]*?position:\s*absolute/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layer\s*\{[\s\S]*?inset:\s*0/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layer\s*\{[\s\S]*?background:\s*var\(--c-bg\)/)
    expect(BG_LAYERS_SOURCE).toMatch(/\.bg-layer\s*\{[\s\S]*?transition:\s*opacity\s+200ms\s+ease/)

    // @media prefers-reduced-motion: reduce con 150ms en .bg-layer
    expect(BG_LAYERS_SOURCE).toMatch(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.bg-layer\s*\{[\s\S]*?transition:\s*opacity\s+150ms\s+ease/
    )
  })
})
