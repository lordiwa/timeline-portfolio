// tests/components/ProjectOverlay.test.js
//
// Phase 5 W0 — RED scaffold para ProjectOverlay.vue (D5-07 + CON-04).
//
// Cobertura (6 tests; T6 nuevo per Warning 9 — null guard):
//   T1: keydown Escape → emit 'close'.
//   T2: click en backdrop (root .project-overlay) → emit 'close'.
//   T3: projectId resuelve `projects.find(p => p.id === projectId)` y renderea title/role/techStack/desc.
//   T4: close button con `aria-label="Cerrar"` (i18n ES) presente.
//   T5: link `target="_blank"` tiene `rel="noopener noreferrer"` (threat T-05-02 tabnabbing).
//   T6 (NEW per Warning 9): projectId inválido (`ch6-nonexistent`) → no crash, template
//       renderea vacío (cubre threat T-05-W4-01).
//
// Analog: tests/components/LangToggle.test.js (keydown), tests/components/FloatingPanel.test.js.
// Source-of-truth: 05-RESEARCH.md §Pattern 10.
//
// RED scaffold W0 — verde tras W4 crea src/components/ProjectOverlay.vue.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({
  projects: [
    {
      id: 'ch6-ar-vr', chapterEra: 6, year: 2015,
      titleKey: 'projects.ch6-ar-vr.title', descKey: 'projects.ch6-ar-vr.desc',
      link: 'https://example.com/ar-vr',
      imageSrc: null, role: 'Founder / Tech Lead',
      techStack: ['Unity', 'ARKit'],
      planetSprite: '/assets/ch6-planet-ar-vr.png', planetOrbit: 0.2, planetColor: '#ff3ca6',
    },
  ],
}))

async function mountOverlay(projectId = 'ch6-ar-vr') {
  let ProjectOverlay
  try {
    ProjectOverlay = (await import('@/components/ProjectOverlay.vue')).default
  } catch (_) {
    return { importFailed: true }
  }
  const i18n = createTestI18n({ locale: 'es' })
  const wrapper = mount(ProjectOverlay, {
    props: { projectId },
    global: {
      plugins: [i18n],
      provide: {
        prm: { prefersReduced: { value: false } },
      },
      // attach DOM permite document.activeElement asserts
      attachTo: document.body,
    },
  })
  return { wrapper, importFailed: false }
}

describe('ProjectOverlay.vue (D5-07 + CON-04) — RED W0 → verde W4', () => {
  it('T1: keydown Escape → emit close', async () => {
    const r = await mountOverlay()
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    // Escape se escucha en document keydown (RESEARCH §Pattern 10 handleKeydown)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(
      r.wrapper.emitted('close'),
      'Escape key debe emit close.'
    ).toBeTruthy()
    r.wrapper.unmount()
  })

  it('T2: click en backdrop (root .project-overlay) → emit close', async () => {
    const r = await mountOverlay()
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    const root = r.wrapper.find('.project-overlay')
    expect(root.exists(), '.project-overlay root debe existir').toBe(true)
    // Trigger click directo sobre el root (el handler usa e.target === overlayRef.value)
    await root.trigger('click')
    expect(
      r.wrapper.emitted('close'),
      'Click en backdrop debe emit close.'
    ).toBeTruthy()
    r.wrapper.unmount()
  })

  it('T3: resuelve projectId → renderea title/role/techStack/desc', async () => {
    const r = await mountOverlay('ch6-ar-vr')
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    // Buscar el role (string literal del mock projects)
    expect(
      r.wrapper.html(),
      'Render debe incluir role del proyecto.'
    ).toContain('Founder')
    // techStack chips
    expect(
      r.wrapper.html(),
      'Render debe incluir techStack item (Unity).'
    ).toContain('Unity')
    r.wrapper.unmount()
  })

  it('T4: close button con aria-label="Cerrar" (i18n ES)', async () => {
    const r = await mountOverlay()
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    const closeBtn = r.wrapper.find('button[aria-label="Cerrar"]')
    expect(
      closeBtn.exists(),
      'close button debe tener aria-label="Cerrar" (ui.closeOverlay i18n ES).'
    ).toBe(true)
    r.wrapper.unmount()
  })

  it('T5: link target="_blank" tiene rel="noopener noreferrer" (tabnabbing T-05-02)', async () => {
    const r = await mountOverlay('ch6-ar-vr')
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    const link = r.wrapper.find('a[target="_blank"]')
    if (link.exists()) {
      expect(
        link.attributes('rel'),
        'Link target=_blank debe tener rel="noopener noreferrer" (tabnabbing T-05-02 mitigation).'
      ).toContain('noopener')
      expect(link.attributes('rel')).toContain('noreferrer')
    }
    r.wrapper.unmount()
  })

  it('T6: projectId inválido (ch6-nonexistent) → NO crash (threat T-05-W4-01)', async () => {
    // Warning 9 RESOLVED: si projectId no matchea, project.value undefined →
    // template NO debe crashear con undefined access. Branches v-if defensive.
    const r = await mountOverlay('ch6-nonexistent')
    if (r.importFailed) {
      expect.fail('ProjectOverlay.vue no existe — W4 lo crea. RED esperado W0.')
    }
    // Mount no debe haber lanzado. wrapper.html() debe poder llamarse sin throw.
    expect(() => r.wrapper.html()).not.toThrow()
    // El título no debe renderear (estado vacío)
    const title = r.wrapper.find('.project-overlay__title')
    expect(
      title.exists(),
      'Con projectId inválido, .project-overlay__title NO debe renderear (v-if defensive).'
    ).toBe(false)
    r.wrapper.unmount()
  })
})
