// tests/components/Chapter3Content.projects.test.js
// TASK-009 pre-hand-off checklist item 1 (agility R3): ejercita el path
// UNSPECCED adyacente al cambio — `ch3Projects` (v-if con ProjectCard) no
// tiene AC propio en este ticket (projects.js no trae items de chapterEra:3
// hoy, CONTENT-CHECKLIST §2.2 PENDING) pero este ticket sí tocó su CSS
// (`.ch3-projects .project-card*`, migrado desde chapter-components.css). Se
// separa en su propio archivo porque necesita su propio vi.mock('@/data/projects').

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Chapter3Content from '@/components/Chapter3Content.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch3-pink-parrot-test',
      chapterEra: 3,
      year: 2013,
      titleKey: 'projects.pp1.title',
      descKey: 'projects.pp1.desc',
      link: null,
      imageSrc: null,
      role: 'UX Lead',
      techStack: ['CSS3', 'jQuery'],
      planetSprite: null,
      planetOrbit: null,
      planetColor: null,
    },
  ],
}))

describe('Chapter3Content.vue — ch3Projects (path adyacente, sin AC propio en TASK-009)', () => {
  it('cuando projects.js trae un item de chapterEra 3, .ch3-projects renderea su ProjectCard', () => {
    const i18n = createTestI18n({ locale: 'es' })
    const wrapper = mount(Chapter3Content, { global: { plugins: [i18n] } })
    const projectsBlock = wrapper.find('.ch3-projects')
    expect(projectsBlock.exists()).toBe(true)
    expect(projectsBlock.find('.project-card').exists()).toBe(true)
    expect(projectsBlock.find('.project-card-title').text().length).toBeGreaterThan(0)
  })
})
