// tests/components/ScrollShell.theme-isolation.test.js
//
// THM-04 architectural test — verifica el DOM markup (data-chapter presence +
// no ancestor data-chapter). NO valida computed-style: jsdom no resuelve @layer +
// CSS Custom Props heredados via tree walk (RESEARCH §3 + Assumption A1). La
// validación visual computed-style se hace MANUAL en W5 §1 + §6 (DevTools Computed
// panel). Ver plan `notes.jsdom_limitation`.
//
// Cobertura: THM-04 (theme isolation — per-section data-chapter, no ancestor).

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ScrollShell from '@/components/ScrollShell.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Helper de mount análogo a ScrollShell.test.js: monta con provides stub + i18n.
function mountShell({ initialChapter = 3, initialPRM = false, locale = 'es' } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const scrollToChapter = vi.fn()
  const i18n = createTestI18n({ locale })
  const wrapper = mount(ScrollShell, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollToChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced, scrollToChapter, i18n }
}

describe('ScrollShell.theme-isolation.test.js — THM-04 architectural (DOM markup only)', () => {
  // T1: 7 sections; cada una tiene data-chapter con el valor correcto (0..6)
  it('T1: renders 7 sections each with correct data-chapter attribute (0..6)', () => {
    const { wrapper } = mountShell()
    const sections = wrapper.findAll('section')
    expect(sections).toHaveLength(7)
    sections.forEach((s, i) => {
      expect(s.attributes('data-chapter')).toBe(String(i))
    })
  })

  // T2: ningún ancestor de las sections tiene data-chapter (no bleed arquitectural)
  // Pattern verbatim de RESEARCH §Theme Bleed Prevention Testing Strategy 1 líneas 1208-1219.
  it('T2: no ancestor of any section has dataset.chapter (no theme bleed architecture)', () => {
    const { wrapper } = mountShell()
    const sections = wrapper.findAll('section')
    sections.forEach((s) => {
      let ancestor = s.element.parentElement
      while (ancestor) {
        expect(ancestor.dataset.chapter).toBeUndefined()
        ancestor = ancestor.parentElement
      }
    })
  })

  // T3: cada section tiene id="chapter-N" (v-for intacto post-i18n W1)
  it('T3: each section has correct id="chapter-N" pattern (v-for intact after W1 i18n)', () => {
    const { wrapper } = mountShell()
    const sections = wrapper.findAll('section')
    sections.forEach((s, i) => {
      expect(s.attributes('id')).toBe('chapter-' + i)
    })
  })
})
