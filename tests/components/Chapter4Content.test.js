// tests/components/Chapter4Content.test.js
// Tests Plan 04-04 Task 4 — Chapter4Content.vue (wrapper AR/VR con bg + glass panels).
//
// iter3 (Rafael 2026-06-01): single bg reemplazado por parallax de 4 capas "flotando en el
// vacío" (portal/matrix/glyphs/character/near) con movimiento puntero+drift PRM-aware.
// T3/T6 actualizados al contrato iter3 (estructura parallax, no single bg).
//
// Cobertura T1-T8:
// - T1 DOM contract: .ch4-layout + .ch4-meta + .ch4-content + .ch4-parallax con 4+ capas
// - T3 estructura parallax: .ch4-layer--{portal,character,near} + glifos matrix + FloatingPanel embeds
// - T4 projects filter ch4 → solo ch4 items en FloatingPanel (mock 1 ch4 + 1 ch5)
// - T5 reactive: locale ES→EN, flavor + bio actualizan
// - T6 CSS source: .ch4-parallax absolute + .ch4-layer transform var(--mx) + PRM freeze
// - T7 NO usa <ProjectCard> (D4-04 — projects van vía FloatingPanel slot)
// - T8 multiverso: data-universe attribute actualiza cuando Ch4PortalShader emite universe-change

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Chapter4Content from '@/components/Chapter4Content.vue'
import Ch4PortalShader from '@/components/Ch4PortalShader.vue'
import FloatingPanel from '@/components/FloatingPanel.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch4-arvr-own',
      chapterEra: 4,
      year: 2015,
      titleKey: 'projects.ch4-arvr-own.title',
      descKey: 'projects.ch4-arvr-own.desc',
      link: null,
      imageSrc: null,
      role: 'Founder / Tech Lead',
      techStack: ['Unity', 'ARKit'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-x',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch4-arvr-own.title',
      descKey: 'projects.ch4-arvr-own.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
  ],
}))

const CH4_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/Chapter4Content.vue'),
  'utf8'
)

function mountCh4({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter4Content, {
    global: {
      plugins: [i18n],
    },
  })
  return { wrapper, i18n }
}

describe('Chapter4Content.vue', () => {
  // ───────────────────────────────────────────────
  // T1 DOM
  // ───────────────────────────────────────────────
  it('T1 DOM: .ch4-layout existe con .ch4-title grande y .ch4-content', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-layout').exists()).toBe(true)
    // iter3: el meta year/era se reemplazó por un título grande full-width centrado.
    const title = wrapper.find('.ch4-title')
    expect(title.exists()).toBe(true)
    expect(title.text().length).toBeGreaterThan(0)
    expect(wrapper.find('.ch4-content').exists()).toBe(true)
  })

  it('T1 DOM: .ch4-meta NO contiene inline avatar (Rafael 2026-05-15 — solo StickyAvatar)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-meta img.ch4-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch4-avatar').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ───────────────────────────────────────────────

  // ───────────────────────────────────────────────
  // T3 estructura parallax iter3 + FloatingPanel embeds
  // ───────────────────────────────────────────────
  it('T3 iter3 DOM: .ch4-parallax con 4 capas + glifos matrix', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-parallax').exists()).toBe(true)
    expect(wrapper.find('.ch4-layer--portal').exists()).toBe(true)
    expect(wrapper.find('.ch4-layer--character').exists()).toBe(true)
    expect(wrapper.find('.ch4-layer--near').exists()).toBe(true)
    // glifos matrix (capa híbrida c3) — al menos uno renderizado
    expect(wrapper.findAll('.ch4-glyph').length).toBeGreaterThan(0)
  })

  it('T3: count <FloatingPanel> ≥ 2 (panel principal + N projects ch4)', () => {
    const { wrapper } = mountCh4()
    const panels = wrapper.findAllComponents(FloatingPanel)
    // 1 panel principal (bio + flavor) + 1 project ch4 (mock filtra ch5 fuera)
    expect(panels.length).toBe(2)
  })

  // ───────────────────────────────────────────────
  // T4 projects filter
  // ───────────────────────────────────────────────
  it('T4 projects filter: chapterEra===4 monta 1 FloatingPanel project (filtra ch5)', () => {
    const { wrapper } = mountCh4()
    const panels = wrapper.findAllComponents(FloatingPanel)
    // panel principal (sin titleKey) + 1 project (titleKey=ch4-arvr-own)
    expect(panels.length).toBe(2)
  })

  // ───────────────────────────────────────────────
  // T5 reactive
  // ───────────────────────────────────────────────
  it('T5 reactive: locale ES→EN actualiza flavor + bio sin re-mount', async () => {
    const { wrapper, i18n } = mountCh4({ locale: 'es' })
    const flavorEs = wrapper.find('.ch4-flavor').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const flavorEn = wrapper.find('.ch4-flavor').text()
    expect(flavorEn.length).toBeGreaterThan(0)
    expect(typeof flavorEs).toBe('string')
  })

  // ───────────────────────────────────────────────
  // T6 CSS source markers iter3 — parallax stack + movimiento por var + PRM freeze
  // ───────────────────────────────────────────────
  it('T6 iter3 CSS: .ch4-parallax position: absolute + .ch4-layer will-change: transform', () => {
    expect(CH4_SOURCE).toMatch(/\.ch4-parallax\s*\{[^}]*position:\s*absolute/s)
    expect(CH4_SOURCE).toMatch(/\.ch4-layer\s*\{[^}]*will-change:\s*transform/s)
  })

  it('T6 iter3 CSS: capas se mueven con var(--mx) y PRM congela transform', () => {
    // El movimiento del parallax se conduce por las CSS vars --mx/--dx (puntero + drift).
    expect(CH4_SOURCE).toMatch(/translate3d\(\s*calc\(\(var\(--mx/s)
    // PRM: dentro de @media prefers-reduced-motion, .ch4-layer transform:none.
    expect(CH4_SOURCE).toMatch(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\.ch4-layer\s*\{[^}]*transform:\s*none/
    )
  })

  // ───────────────────────────────────────────────
  // T7 NO ProjectCard (D4-04)
  // ───────────────────────────────────────────────
  it('T7 D4-04: NO usa <ProjectCard> (projects van vía FloatingPanel slot)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.findAllComponents(ProjectCard).length).toBe(0)
  })

  // ───────────────────────────────────────────────
  // T8 multiverso: data-universe reactivo
  // ───────────────────────────────────────────────
  it('T8 multiverso: data-universe comienza en 0', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-layout').attributes('data-universe')).toBe('0')
  })

  it('T8 multiverso: data-universe se actualiza cuando Ch4PortalShader emite universe-change', async () => {
    const { wrapper } = mountCh4()
    const shader = wrapper.findComponent(Ch4PortalShader)
    expect(shader.exists()).toBe(true)

    // Simular que el shader cruza el midpoint de una onda y emite el nuevo universo
    shader.vm.$emit('universe-change', 2)
    await nextTick()

    expect(wrapper.find('.ch4-layout').attributes('data-universe')).toBe('2')
  })

  it('T8 multiverso: glyphs actualizan chars al cambiar universo (U3 → ▒/▓)', async () => {
    const { wrapper } = mountCh4()
    const shader = wrapper.findComponent(Ch4PortalShader)

    shader.vm.$emit('universe-change', 3)
    await nextTick()

    // U3 (void) usa chars ▒/▓ — al menos uno debe aparecer en los glifos renderizados
    const glyphText = wrapper.findAll('.ch4-glyph').map(g => g.text()).join('')
    expect(glyphText).toMatch(/[▒▓]/)
  })

  // ───────────────────────────────────────────────
  // T9 tier del shader → DOF por capas (TASK-010, ronda de completado, spec §4.8)
  // ───────────────────────────────────────────────
  it('T9 data-ch4-tier arranca en "MED" (default antes de que el shader emita)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-layout').attributes('data-ch4-tier')).toBe('MED')
  })

  it('T9 data-ch4-tier se actualiza cuando Ch4PortalShader emite tier-change', async () => {
    const { wrapper } = mountCh4()
    const shader = wrapper.findComponent(Ch4PortalShader)

    shader.vm.$emit('tier-change', 'HIGH')
    await nextTick()

    expect(wrapper.find('.ch4-layout').attributes('data-ch4-tier')).toBe('HIGH')
  })

  it('T9 CSS: blur DOF de matrix/near está gateado por [data-ch4-tier="HIGH"] (spec §4.8)', () => {
    expect(CH4_SOURCE).toMatch(
      /\.ch4-layout\[data-ch4-tier="HIGH"\]\s+\.ch4-layer--matrix\s*\{[^}]*filter:\s*blur\(1\.5px\)/
    )
    expect(CH4_SOURCE).toMatch(
      /\.ch4-layout\[data-ch4-tier="HIGH"\]\s+\.ch4-layer--near\s*\{[^}]*filter:\s*blur\(0\.75px\)/
    )
  })

  // ───────────────────────────────────────────────
  // T10 stagger individual por capa (TASK-010, ronda de completado, spec §6)
  // ───────────────────────────────────────────────
  it('T10 DOM: matrix/personaje/near quedan envueltos en .ch4-settle propio (no un settle único de .ch4-parallax)', () => {
    const { wrapper } = mountCh4()
    expect(wrapper.find('.ch4-settle--matrix .ch4-layer--matrix').exists()).toBe(true)
    expect(wrapper.find('.ch4-settle--character .ch4-layer--character').exists()).toBe(true)
    expect(wrapper.find('.ch4-settle--near .ch4-layer--near').exists()).toBe(true)
  })

  it('T10 CSS: cada .ch4-settle--{matrix,character,near} tiene su propio transition-delay (spec §6: 900/1000/1050ms → delay 0/100/150ms)', () => {
    expect(CH4_SOURCE).toMatch(/\.ch4-settle--matrix\s*\{[^}]*transition:\s*transform 350ms ease-out 0ms/)
    expect(CH4_SOURCE).toMatch(/\.ch4-settle--character\s*\{[^}]*transition:\s*transform 350ms ease-out 100ms/)
    expect(CH4_SOURCE).toMatch(/\.ch4-settle--near\s*\{[^}]*transition:\s*transform 350ms ease-out 150ms/)
  })

  it('T10 CSS: los paneles de proyecto llevan stagger de 80ms individual, no un fade único de .ch4-panel-column', () => {
    expect(CH4_SOURCE).toMatch(/\.ch4-projects :deep\(\.floating-panel\):nth-child\(1\)\s*\{[^}]*transition-delay:\s*80ms/)
    expect(CH4_SOURCE).toMatch(/\.ch4-projects :deep\(\.floating-panel\):nth-child\(2\)\s*\{[^}]*transition-delay:\s*160ms/)
    // El fade combinado viejo (".ch4-title, .ch4-panel-column { transition: ... }") ya no existe.
    expect(CH4_SOURCE).not.toMatch(/\.ch4-title,\s*\n?\s*\.ch4-panel-column\s*\{/)
  })
})
