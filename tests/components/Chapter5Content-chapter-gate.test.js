// tests/components/Chapter5Content-chapter-gate.test.js
// TASK-017 — lock AC1/AC5: el rAF de la máquina de estados de la multitud
// (tick()) y el setInterval del slideshow de pantalla (screenTimer) NO deben
// agendarse mientras ch5 no es el capítulo activo, y SÍ deben agendarse
// (arrancar) al entrar a ch5 y volver a arrancar tras una re-entrada
// (salir → entrar de nuevo) — el caso de re-entrada es donde un gate mal
// escrito falla en silencio (congelado o sin arrancar nunca, sin error).
//
// Honestidad de alcance (spec del ticket): jsdom no ejecuta rAF real ni
// layout — este test SOLO puede verificar que el watch sobre activeChapter
// existe y que requestAnimationFrame/setInterval NO se agenda con el
// capítulo inactivo (conteo de llamadas a los spies globales), mismo patrón
// que tests/components/Chapter4Content.test.js T12. La prueba conductual
// real (que la multitud efectivamente se mueve en dos instantes distintos,
// medido con Page.captureScreenshot/CDP en Chrome real) vive en el reporte
// del Developer, no en esta suite.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import Chapter5Content from '@/components/Chapter5Content.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

vi.mock('@/data/projects', () => ({ projects: [] }))

function mountCh5({ activeChapter } = {}) {
  const i18n = createTestI18n({ locale: 'es' })
  const provide = { prm: { prefersReduced: ref(false) } }
  if (activeChapter) provide.scrollState = { activeChapter }
  return mount(Chapter5Content, {
    global: { plugins: [i18n], provide },
  })
}

describe('Chapter5Content.vue — gate por capítulo activo (TASK-017)', () => {
  it('activeChapter=0 (no ch5) → ni requestAnimationFrame ni setInterval del cine se agendan al montar', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    const wrapper = mountCh5({ activeChapter: ref(0) })
    try {
      expect(rafSpy).not.toHaveBeenCalled()
      expect(intervalSpy).not.toHaveBeenCalled()
    } finally {
      rafSpy.mockRestore()
      intervalSpy.mockRestore()
      wrapper.unmount()
    }
  })

  it('sin scrollState inyectado (fallback ref(-1)) → el loop tampoco arranca', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
    const wrapper = mountCh5()
    try {
      expect(rafSpy).not.toHaveBeenCalled()
    } finally {
      rafSpy.mockRestore()
      wrapper.unmount()
    }
  })

  it('activeChapter pasa a 5 → requestAnimationFrame + setInterval se agendan; vuelve a 0 → se cancelan', async () => {
    const activeChapter = ref(0)
    const wrapper = mountCh5({ activeChapter })
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame')
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    try {
      activeChapter.value = 5
      await nextTick()
      expect(rafSpy).toHaveBeenCalled()
      expect(intervalSpy).toHaveBeenCalled()

      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
      const clearSpy = vi.spyOn(globalThis, 'clearInterval')
      activeChapter.value = 0
      await nextTick()
      expect(cancelSpy).toHaveBeenCalled()
      expect(clearSpy).toHaveBeenCalled()
      cancelSpy.mockRestore()
      clearSpy.mockRestore()
    } finally {
      rafSpy.mockRestore()
      intervalSpy.mockRestore()
      wrapper.unmount()
    }
  })

  // ── Re-entrada — el caso donde un gate mal escrito falla en silencio ─────
  it('re-entrada: salir de ch5 y volver a entrar reagenda requestAnimationFrame (no queda congelado)', async () => {
    const activeChapter = ref(5)
    const wrapper = mountCh5({ activeChapter })
    try {
      // 1ª entrada (immediate:true del watch ya lo arrancó en mount)
      const rafSpy1 = vi.spyOn(globalThis, 'requestAnimationFrame')
      // Salir de ch5
      activeChapter.value = 1
      await nextTick()
      rafSpy1.mockRestore()

      // Volver a entrar — debe reagendar, no quedar frío
      const rafSpy2 = vi.spyOn(globalThis, 'requestAnimationFrame')
      activeChapter.value = 5
      await nextTick()
      expect(rafSpy2).toHaveBeenCalled()
      rafSpy2.mockRestore()

      // Y una segunda salida vuelve a cancelar (no quedó huérfano un segundo rAF)
      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame')
      activeChapter.value = 2
      await nextTick()
      expect(cancelSpy).toHaveBeenCalled()
      cancelSpy.mockRestore()
    } finally {
      wrapper.unmount()
    }
  })
})
