// tests/components/Chapter5Content.test.js
// TASK-011 (2026-07-29): rediseño "LA TRANSMISION" — reescribe los tests que
// asumían `showText = false` (Plan 04-05 / 2026-07-09). El texto de bio.eras.5
// vive ahora SIEMPRE en `.ch5-stream-panel`, sin flag ni interacción.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import Chapter5Content from '@/components/Chapter5Content.vue'
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
  // T1 DOM contract — cine + panel de transmisión siempre montado (TASK-011)
  // ───────────────────────────────────────────────
  it('T1 DOM: .ch5-layout existe con escena cine + panel de transmisión', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-layout').exists()).toBe(true)
    expect(wrapper.find('.cine-screen').exists()).toBe(true)
    expect(wrapper.find('.cine-audience').exists()).toBe(true)
    expect(wrapper.find('.ch5-stream-panel').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T2: (RETIRED 2026-05-15) avatar img src/alt — el bust ahora vive solo en
  // StickyAvatar. Cobertura de src/alt cross-chapter está en StickyAvatar.test.
  // ───────────────────────────────────────────────

  it('T2b: sin avatar inline en ningún layout de ch5 (sigue en StickyAvatar)', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-stream-panel img.ch5-avatar').exists()).toBe(false)
    expect(wrapper.find('img.ch5-avatar').exists()).toBe(false)
  })

  // ───────────────────────────────────────────────
  // T3: innerText nunca es 0 — AC#1 de TASK-011 (defecto 1 de TASK-007)
  // ───────────────────────────────────────────────
  it('T3: el innerText del panel NO es 0 sin interacción, en ES y EN', () => {
    const { wrapper: wEs } = mountCh5({ locale: 'es' })
    const { wrapper: wEn } = mountCh5({ locale: 'en' })
    expect(wEs.find('.ch5-stream-panel').text().length).toBeGreaterThan(0)
    expect(wEn.find('.ch5-stream-panel').text().length).toBeGreaterThan(0)
    // Las 8 párrafos reales de bio.eras.5 deben estar presentes (no truncados)
    expect(wEs.findAll('.ch5-feed-item')).toHaveLength(8)
    expect(wEn.findAll('.ch5-feed-item')).toHaveLength(8)
  })

  it('T3b: cada .ch5-feed-item tiene timestamp + texto no vacíos', () => {
    const { wrapper } = mountCh5()
    const items = wrapper.findAll('.ch5-feed-item')
    items.forEach((item) => {
      expect(item.find('.ch5-feed-timestamp').text().length).toBeGreaterThan(0)
      expect(item.find('.ch5-feed-text').text().length).toBeGreaterThan(0)
    })
  })

  // ───────────────────────────────────────────────
  // T4 projects filter ch5 — ahora SIEMPRE renderizados (TASK-011)
  // ───────────────────────────────────────────────
  it('T4 projects filter: chapterEra===5 filtra 3 ProjectCards (excluye ch4-x)', () => {
    const { wrapper } = mountCh5()
    const cards = wrapper.findAllComponents(ProjectCard)
    expect(cards.length).toBe(3)
  })

  it('T4b: .ch5-channels-label existe cuando hay proyectos', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.ch5-channels-label').exists()).toBe(true)
  })

  // ───────────────────────────────────────────────
  // T5 reactive locale
  // ───────────────────────────────────────────────
  it('T5 reactive: componente monta en ES y EN sin errores; título del panel visible', () => {
    const { wrapper: wEs } = mountCh5({ locale: 'es' })
    expect(wEs.find('.ch5-layout').exists()).toBe(true)
    expect(wEs.find('.cine-screen').exists()).toBe(true)
    expect(wEs.find('.ch5-panel-title').text().length).toBeGreaterThan(0)

    const { wrapper: wEn } = mountCh5({ locale: 'en' })
    expect(wEn.find('.ch5-layout').exists()).toBe(true)
    expect(wEn.find('.cine-screen').exists()).toBe(true)
    expect(wEn.find('.ch5-panel-title').text().length).toBeGreaterThan(0)
  })

  // ───────────────────────────────────────────────
  // T6 staggered delays — RETIRED: ch5 ya no usa ScrollRevealCard (TASK-011,
  // el panel de transmisión está siempre montado, sin reveal-on-scroll).
  // ───────────────────────────────────────────────

  // ───────────────────────────────────────────────
  // T7 sin background-image directo (viene de BackgroundLayers)
  // ───────────────────────────────────────────────
  it('T7 SFC source: NO contiene background-image directo (viene de BackgroundLayers --bg-image)', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8',
    )
    // El SFC scoped NO debe declarar background-image: url(...)
    // (la convención Phase 4 es que --bg-image viene de chapter-themes.css consumido por BackgroundLayers)
    expect(source).not.toMatch(/background-image:\s*url/)
  })

  // ───────────────────────────────────────────────
  // T8 Overlays atmosféricos: proyector + luz de pantalla (2026-07-10)
  // Los overlays se renderizaron en una sesión previa; este test los "ancla"
  // para que un refactor no los elimine accidentalmente.
  // ───────────────────────────────────────────────
  it('T8 overlays: .cine-projector-cone y .cine-screen-light existen en el DOM cine', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.cine-projector-cone').exists()).toBe(true)
    expect(wrapper.find('.cine-screen-light').exists()).toBe(true)
    // Las motas de polvo dentro del cono
    expect(wrapper.findAll('.cine-dust').length).toBeGreaterThanOrEqual(3)
  })

  // ───────────────────────────────────────────────
  // T9 screenGlowStyle: .cine-screen-light tiene :style binding con radial-gradient
  // dinámico (escena 0 = box → color ámbar [220,155,55]).
  // Verifica que el background se inyecta vía computed (no hardcodeado en CSS).
  // ───────────────────────────────────────────────
  it('T9 screen-light: inline style tiene radial-gradient con color de escena (box = índice 0)', () => {
    const { wrapper } = mountCh5()
    const light = wrapper.find('.cine-screen-light')
    expect(light.exists()).toBe(true)
    const bg = light.element.style.background
    // Escena inicial = 'box' → glowColor [220, 155, 55] → debe contener rgb(220
    expect(bg).toMatch(/radial-gradient/)
    expect(bg).toMatch(/220/)
  })

  // ───────────────────────────────────────────────
  // T10 (TASK-011): chrome de broadcast — badge EN VIVO, scanlines, viñeta,
  // barra de señal y lower-third existen en el DOM (spec §3).
  // ───────────────────────────────────────────────
  it('T10 broadcast chrome: badge EN VIVO, scanlines, viñeta, señal y lower-third presentes', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.cine-screen-badge').exists()).toBe(true)
    expect(wrapper.find('.cine-screen-scanlines').exists()).toBe(true)
    expect(wrapper.find('.cine-screen-vignette').exists()).toBe(true)
    expect(wrapper.find('.cine-screen-signal').exists()).toBe(true)
    expect(wrapper.find('.ch5-lower-third').exists()).toBe(true)
    expect(wrapper.find('.ch5-lower-third').text().length).toBeGreaterThan(0)
  })

  // T11: el contador de espectadores se deriva de seats.length (no hardcodeado) —
  // spec §4.1 "el contador... debe derivarse de seats.length: el chiste es que los
  // espectadores SON la multitud".
  it('T11 viewers count: .ch5-panel-viewers menciona el conteo real de seats renderizados', () => {
    const { wrapper } = mountCh5()
    const seatCount = wrapper.findAll('.cine-char-live, .cine-char').length
    expect(seatCount).toBeGreaterThan(0)
    expect(wrapper.find('.ch5-panel-viewers').text()).toContain(String(seatCount))
  })

  // T12 (AC bloqueante TASK-011): grade de multitud presente, filter saturate
  // aplicado — verificable a nivel de fuente porque jsdom no computa filter real.
  it('T12 SFC source: .cine-crowd-grade existe y .cine-audience declara saturate(0.82)', () => {
    const { wrapper } = mountCh5()
    expect(wrapper.find('.cine-crowd-grade').exists()).toBe(true)
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8',
    )
    expect(source).toMatch(/\.cine-audience\s*\{[^}]*saturate\(0\.82\)/)
  })

  // ───────────────────────────────────────────────
  // T13 (regression lock, AC#3/#11 TASK-011): la multitud sigue teniendo
  // EXACTAMENTE 125 personajes únicos (CAST.length). Plantado en rojo durante
  // el desarrollo quitando 3 entradas de CAST — ver hand-off del Developer.
  // Ronda 2 de review (LOW): el nombre del test decía "únicos" pero solo
  // asertaba el CONTEO — un slug duplicado (124 únicos + 1 repetido = 125
  // items) habría quedado verde. Se agrega el chequeo de unicidad real.
  // ───────────────────────────────────────────────
  it('T13 (regression lock): CAST tiene exactamente 125 personajes únicos', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8',
    )
    const match = source.match(/const CAST = \[([\s\S]*?)\]/)
    expect(match, 'no se encontró la declaración de CAST en el SFC').not.toBeNull()
    const items = match[1].match(/'[^']+'/g) || []
    expect(items.length).toBe(125)
    expect(new Set(items).size, 'CAST tiene slugs duplicados').toBe(125)
  })

  // ───────────────────────────────────────────────
  // T14 (regression lock, AC#1/#11 TASK-011): la variable `showText` no vuelve
  // a existir dentro del bloque <script> (el comentario de cabecera SÍ puede
  // mencionarla en pasado, al documentar qué se retiró — por eso el chequeo se
  // acota al <script>, no al archivo completo). Plantado en rojo durante el
  // desarrollo reintroduciendo `const showText = false` — ver hand-off del
  // Developer.
  // ───────────────────────────────────────────────
  it('T14 (regression lock): showText no reaparece dentro de <script>', () => {
    const { readFileSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8',
    )
    const scriptMatch = source.match(/<script setup>([\s\S]*?)<\/script>/)
    expect(scriptMatch, 'no se encontró el bloque <script setup>').not.toBeNull()
    expect(scriptMatch[1]).not.toMatch(/showText/)
  })

  // ───────────────────────────────────────────────
  // T15 (regression lock, hallazgo hook impeccable "broken-image" resuelto en
  // TASK-011): la rama v-else de la multitud (<img class="cine-char">, fallback
  // sin manifest) sigue siendo defensiva-pero-viva: los 125 slugs de CAST deben
  // seguir teniendo entrada en ch5CrowdManifest.json Y su PNG de fallback debe
  // seguir existiendo en public/assets/ch5-cinema/. Si esto se rompe, la rama
  // v-else empezaría a renderizar imágenes rotas reales para visitantes.
  // ───────────────────────────────────────────────
  it('T15 (regression lock): todo CAST tiene manifest + PNG de fallback (sin broken-image real)', () => {
    const { readFileSync, existsSync } = require('node:fs')
    const { resolve } = require('node:path')
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/Chapter5Content.vue'),
      'utf8',
    )
    const castMatch = source.match(/const CAST = \[([\s\S]*?)\]/)
    const cast = (castMatch[1].match(/'[^']+'/g) || []).map((s) => s.slice(1, -1))
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src/data/ch5CrowdManifest.json'), 'utf8'),
    )
    const missingManifest = cast.filter((slug) => !manifest[slug])
    const missingPng = cast.filter(
      (slug) => !existsSync(resolve(process.cwd(), 'public/assets/ch5-cinema', `${slug}.png`)),
    )
    expect(missingManifest, 'slugs de CAST sin entrada en ch5CrowdManifest.json').toEqual([])
    expect(missingPng, 'slugs de CAST sin PNG de fallback en public/assets/ch5-cinema/').toEqual([])
  })
})
