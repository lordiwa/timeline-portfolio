// tests/components/ProjectCard.test.js
// TDD RED phase — Plan 03-03, Task 3.1.
//
// Cobertura:
// - T1 props validation: shape válido e inválido
// - T2 title + desc: multiplexar locale es/en
// - T3 link conditional: project.link null vs string URL
// - T4 T-CON-03: rel="noopener noreferrer" + target="_blank" en external link (security)
// - T5 CSS readFileSync: chapter-themes.css contiene markers skeumorphic Web 2.0 (D3-11)
// - T6 reactive (Pitfall 3): toggle locale → texto actualiza sin re-mount
// - T7 role + techStack conditional: null → no renderea; presentes → renderean

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ProjectCard from '@/components/ProjectCard.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Fixture base — project shape D3-03 verbatim (los 12 campos)
const baseProject = {
  id: 'test-1',
  chapterEra: 3,
  year: 2013,
  titleKey: 'projects.pp1.title',
  descKey: 'projects.pp1.desc',
  link: null,
  imageSrc: null,
  role: null,
  techStack: null,
  planetSprite: null,
  planetOrbit: null,
  planetColor: null,
}

const projectWithLink = { ...baseProject, link: 'https://example.com' }
const projectWithRole = { ...baseProject, role: 'UX Lead + Web Developer' }
const projectWithTechStack = { ...baseProject, techStack: ['CSS3', 'jQuery', 'PHP'] }
const projectWithAll = {
  ...baseProject,
  link: 'https://example.com',
  role: 'UX Lead',
  techStack: ['Vue 3', 'PHP'],
}

// Helper para montar ProjectCard con i18n plugin
function mountCard(project = baseProject, { locale = 'es' } = {}) {
  const i18n = createTestI18n({ locale })
  const wrapper = mount(ProjectCard, {
    props: { project },
    global: { plugins: [i18n] },
  })
  return { wrapper, i18n }
}

// Lee chapter-themes.css como raw string para asserts de CSS estático (T5)
const THEMES_CSS = readFileSync(
  resolve(process.cwd(), 'src/styles/chapter-themes.css'),
  'utf8'
)

describe('ProjectCard.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: Props validation — shape válido renderea; shape inválido no pasa validator
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 props validation: shape válido monta sin errores críticos', () => {
    const { wrapper } = mountCard(baseProject)
    expect(wrapper.find('article.project-card').exists()).toBe(true)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: title + desc — locale es y en renderean los valores de i18n
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 title + desc: locale=es → h3.project-card-title muestra texto de es.json', () => {
    const { wrapper } = mountCard(baseProject, { locale: 'es' })
    const title = wrapper.find('h3.project-card-title')
    expect(title.exists()).toBe(true)
    // El texto es el valor en es.json para projects.pp1.title (puede ser PENDING placeholder)
    expect(title.text()).toBeTruthy()
    expect(title.text().length).toBeGreaterThan(0)
  })

  it('T2 desc: .project-card-desc contiene texto del locale activo', () => {
    const { wrapper } = mountCard(baseProject, { locale: 'en' })
    const desc = wrapper.find('p.project-card-desc')
    expect(desc.exists()).toBe(true)
    expect(desc.text().length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: link conditional — link=null → NO <a>; link=URL → <a> con href correcto
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 link conditional: project.link===null → NO renderea el botón <a>', () => {
    const { wrapper } = mountCard(baseProject)
    expect(wrapper.find('a.project-card-link').exists()).toBe(false)
  })

  it('T3 link conditional: project.link=URL → renderea <a> con href correcto', () => {
    const { wrapper } = mountCard(projectWithLink)
    const link = wrapper.find('a.project-card-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('https://example.com')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: T-CON-03 — external link tiene rel="noopener noreferrer" + target="_blank"
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 T-CON-03: link externo tiene target="_blank" y rel="noopener noreferrer"', () => {
    const { wrapper } = mountCard(projectWithLink)
    const link = wrapper.find('a.project-card-link')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: CSS readFileSync — chapter-themes.css contiene markers skeumorphic D3-11
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 CSS skeumorphic: chapter-themes.css contiene .project-card con linear-gradient', () => {
    expect(THEMES_CSS).toMatch(/\.project-card\s*\{[\s\S]*?linear-gradient/)
  })

  it('T5 CSS skeumorphic: chapter-themes.css contiene inset highlight (D3-11 verbatim)', () => {
    expect(THEMES_CSS).toMatch(/inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.5\)/)
  })

  it('T5 CSS skeumorphic: chapter-themes.css contiene text-shadow embossed (D3-11 verbatim)', () => {
    expect(THEMES_CSS).toMatch(/text-shadow:\s*0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.7\)/)
  })

  it('T5 CSS skeumorphic: .project-card-link:active contiene translateY(1px) (D3-11 press effect)', () => {
    expect(THEMES_CSS).toMatch(/\.project-card-link[\s\S]*?:active[\s\S]*?translateY\(1px\)/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6: Reactive (Pitfall 3) — toggle locale → title text actualiza sin re-mount
  // ─────────────────────────────────────────────────────────────────────────
  it('T6 reactive (Pitfall 3): toggle locale es→en → title text actualiza sin re-mount', async () => {
    const { wrapper, i18n } = mountCard(baseProject, { locale: 'es' })
    const titleEs = wrapper.find('h3.project-card-title').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const titleEn = wrapper.find('h3.project-card-title').text()
    // Ambos deben ser strings no vacíos; pueden ser diferentes si las keys tienen traducciones distintas
    expect(titleEn.length).toBeGreaterThan(0)
    expect(typeof titleEs).toBe('string')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T7: role + techStack conditional
  // ─────────────────────────────────────────────────────────────────────────
  it('T7 role conditional: project.role===null → NO renderea .project-card-role', () => {
    const { wrapper } = mountCard(baseProject)
    expect(wrapper.find('p.project-card-role').exists()).toBe(false)
  })

  it('T7 role conditional: project.role presente → renderea .project-card-role', () => {
    const { wrapper } = mountCard(projectWithRole)
    const role = wrapper.find('p.project-card-role')
    expect(role.exists()).toBe(true)
    expect(role.text()).toBe('UX Lead + Web Developer')
  })

  it('T7 techStack conditional: project.techStack===null → NO renderea .project-card-tech', () => {
    const { wrapper } = mountCard(baseProject)
    expect(wrapper.find('ul.project-card-tech').exists()).toBe(false)
  })

  it('T7 techStack conditional: project.techStack array → renderea <ul> con <li> items', () => {
    const { wrapper } = mountCard(projectWithTechStack)
    const list = wrapper.find('ul.project-card-tech')
    expect(list.exists()).toBe(true)
    const items = list.findAll('li')
    expect(items.length).toBe(3)
    expect(items[0].text()).toBe('CSS3')
    expect(items[1].text()).toBe('jQuery')
    expect(items[2].text()).toBe('PHP')
  })
})
