// tests/components/Chapter5Content.test.js
// Tests Plan 04-05 Task 4 — Chapter5Content.vue (wrapper Modern + ScrollRevealCard staggered).

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import Chapter5Content from '@/components/Chapter5Content.vue'
import ScrollRevealCard from '@/components/ScrollRevealCard.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch5-bairesdev',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch5-bairesdev.title',
      descKey: 'projects.ch5-bairesdev.desc',
      link: null,
      imageSrc: null,
      role: 'Frontend Lead',
      techStack: ['Vue 3'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-number8',
      chapterEra: 5,
      year: 2022,
      titleKey: 'projects.ch5-number8.title',
      descKey: 'projects.ch5-number8.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch5-remoose',
      chapterEra: 5,
      year: 2023,
      titleKey: 'projects.ch5-remoose.title',
      descKey: 'projects.ch5-remoose.desc',
      link: null,
      imageSrc: null,
      role: null,
      techStack: null,
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
    {
      id: 'ch4-x',
      chapterEra: 4,
      year: 2018,
      titleKey: 'projects.ch5-bairesdev.title',
      descKey: 'projects.ch5-bairesdev.desc',
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

function mountCh5({ locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(Chapter5Content, {
    global: {
      plugins: [i18n],
      provide: {
        prm: { prefersReduced: ref(false) },
      },
    },
  })
  return { wrapper, i18n }
}

describe('Chapter5Content.vue', () => {
  // ───────────────────────────────────────────────
  // T1 DOM contract — layout cine (showText=false por defecto 2026-07-07)
  //
  // El capítulo 5 pasó a una escena de cine con multitud de pixellab (2026-07-07).
  // El bloque de texto original (ch5-meta, ch5-content, ch5-projects) se preservó
  // en el SFC pero queda detrás de showText=false hasta que Rafael decida qué va.
  // Los tests reflejan la realidad por defecto: solo el stage del cine se renderiza.
  // ───────────────────────────────────────────────
  it('T1 DOM: .ch5-layout existe con estructura cine (showText=false por defecto — 2026-07-07)', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-layout').exists()).toBe(true)
    // Escena cine siempre visible: pantalla y público
    expect(wrapper.find('.cine-screen').exists()).toBe(true)
    expect(wrapper.find('.cine-audience').exists()).toBe(true)
    // Texto original oculto (showText=false — decisión deliberada Rafael 2026-07-07)
    expect(wrapper.find('.ch5-meta').exists()).toBe(false)
    expect(wrapper.find('.ch5-content').exists()).toBe(false)
  })

  it('T1 DOM: sin avatar inline; .ch5-projects oculto y cine-audience visible (showText=false — 2026-07-07)', () => {
    const { wrapper } = mountCh5()
    // No hay avatar inline en ningún layout de ch5 (sigue en StickyAvatar)
    expect(wrapper.find('.ch5-meta img.ch5-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch5-avatar').exists()).toBe(false)
    // Con showText=false el bloque de proyectos no se renderiza (deliberado 2026-07-07)
    expect(wrapper.find('.ch5-projects').exists()).toBe(false)
    // En su lugar: el público del cine está presente
    expect(wrapper.find('.cine-audience').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ───────────────────────────────────────────────

  // ───────────────────────────────────────────────
  // T3 ScrollRevealCard count
  // Adaptado 2026-07-09: showText=false → 0 cards por defecto.
  // ───────────────────────────────────────────────
  it('T3: con showText=false (por defecto) NO hay ScrollRevealCards — cine layout 2026-07-07', () => {
    const { wrapper } = mountCh5()
    const cards = wrapper.findAllComponents(ScrollRevealCard)
    // showText=false: el bloque completo de contenido está oculto → 0 cards
    expect(cards.length).toBe(0)
  })

  it.todo(
    'T3b: con showText=true → 1 header card + 3 project cards (4 total) — reactivar cuando showText sea prop configurable'
  )

  // ───────────────────────────────────────────────
  // T4 projects filter ch5
  // Adaptado 2026-07-09: showText=false → 0 ProjectCards visibles.
  // ───────────────────────────────────────────────
  it('T4 projects filter: con showText=false no se renderizan ProjectCards (cine layout 2026-07-07)', () => {
    const { wrapper } = mountCh5()
    // Con showText=false el bloque de proyectos está oculto: 0 ProjectCards
    expect(wrapper.findAllComponents(ProjectCard).length).toBe(0)
  })

  it.todo(
    'T4b: con showText=true → chapterEra===5 filtra 3 ProjectCards (excluye ch4-x) — reactivar cuando showText sea prop configurable'
  )

  // ───────────────────────────────────────────────
  // T5 reactive locale
  // Adaptado 2026-07-09: showText=false → .ch5-flavor no se renderiza.
  // Test rediseñado: verificar que el componente monta sin errores en ES y EN,
  // y que el stage del cine existe en ambos locales.
  // ───────────────────────────────────────────────
  it('T5 reactive: componente monta en ES y EN sin errores; .ch5-flavor oculto (showText=false — 2026-07-07)', async () => {
    const { wrapper: wEs } = mountCh5({ locale: 'es' })
    expect(wEs.find('.ch5-layout').exists()).toBe(true)
    expect(wEs.find('.cine-screen').exists()).toBe(true)
    // .ch5-flavor existe en el SFC pero condicionado a showText=true → no se renderiza
    expect(wEs.find('.ch5-flavor').exists()).toBe(false)

    const { wrapper: wEn } = mountCh5({ locale: 'en' })
    expect(wEn.find('.ch5-layout').exists()).toBe(true)
    expect(wEn.find('.cine-screen').exists()).toBe(true)
    expect(wEn.find('.ch5-flavor').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T6 staggered delays
  // Deprecado 2026-07-09: con showText=false no hay ScrollRevealCards que verificar.
  // ───────────────────────────────────────────────
  it.todo(
    'T6 staggered: ScrollRevealCard delays 100/200/300 — deprecado; reactivar cuando showText=true sea posible en test (cine ch5 2026-07-07)'
  )

  // ───────────────────────────────────────────────
  // T7 sin background-image directo (viene de BackgroundLayers)
  // ───────────────────────────────────────────────
  it('T7 SFC source: NO contiene background-image directo (viene de BackgroundLayers --bg-image)', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8'
    )
    // El SFC scoped NO debe declarar background-image: url(...)
    // (la convención Phase 4 es que --bg-image viene de chapter-themes.css consumido por BackgroundLayers)
    expect(source).not.toMatch(/background-image:\s*url/)
  })
})
