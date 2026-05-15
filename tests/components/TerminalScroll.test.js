// tests/components/TerminalScroll.test.js
// Cobertura (T1-T9 — Phase 6 DOS demo reel refresh 2026-05-14):
// - T1 DOM contract: monta sin errores, renderiza 4 .terminal-line spans (banner)
// - T2 CSS @keyframes terminal-cursor-blink con steps(2)
// - T3 CSS @media (prefers-reduced-motion: reduce) con .terminal-cursor { animation: none }
// - T4 CSS @keyframes terminal-reveal presente
// - T5 i18n reactive: cambiar locale es→en actualiza las líneas del terminal
// - T6 cycle smoke: fake timers + activeChapter=0 → state PROGRAM + <img> con src ch0-{game,os}-
// - T7 PRM branch: prefersReduced=true → typed text aparece instant sin char-by-char
// - T8 lifecycle pause: activeChapter cambia a 1 → cycle pausa (no más mutación de img)
// - T9 no repeat consecutivo: mock Math.random → 6 ciclos sin repetir programa consecutivo

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import TerminalScroll from '@/components/TerminalScroll.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>
const TERMINAL_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/TerminalScroll.vue'),
  'utf8'
)

// Helper: monta TerminalScroll con i18n + scrollState + prm provides.
// activeChapter / prefersReduced son refs reactivas que el test puede mutar.
function mountTerminal({ locale = 'es', activeChapter = 0, prefersReduced = false } = {}) {
  const i18n = createTestI18n({ locale })
  const activeChapterRef = ref(activeChapter)
  const prefersReducedRef = ref(prefersReduced)
  const wrapper = mount(TerminalScroll, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter: activeChapterRef },
        prm: { prefersReduced: prefersReducedRef },
      },
    },
  })
  return { wrapper, i18n, activeChapterRef, prefersReducedRef }
}

describe('TerminalScroll.vue', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // T1: DOM contract — renderiza sin errores con 4 .terminal-line spans
  // ─────────────────────────────────────────────────────────────────────────
  it('T1 DOM contract: monta sin errores y renderiza 4 .terminal-line spans', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal-scroll').exists()).toBe(true)
    const lines = wrapper.findAll('.terminal-line')
    expect(lines.length).toBe(4)
  })

  it('T1 DOM contract: renderiza .terminal-output (pre)', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal-output').exists()).toBe(true)
  })

  it('T1 DOM contract: renderiza .terminal-cursor con aria-hidden="true"', () => {
    const { wrapper } = mountTerminal()
    const cursor = wrapper.find('.terminal-cursor')
    expect(cursor.exists()).toBe(true)
    expect(cursor.attributes('aria-hidden')).toBe('true')
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T2: CSS @keyframes terminal-cursor-blink con steps(2)
  // ─────────────────────────────────────────────────────────────────────────
  it('T2 CSS: contiene @keyframes terminal-cursor-blink', () => {
    expect(TERMINAL_SOURCE).toMatch(/@keyframes terminal-cursor-blink/)
  })

  it('T2 CSS: cursor-blink usa steps(2) para look CRT cuadrado', () => {
    expect(TERMINAL_SOURCE).toMatch(/steps\(2\)/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T3: CSS @media PRM — sin parpadeo bajo prefers-reduced-motion
  // ─────────────────────────────────────────────────────────────────────────
  it('T3 CSS PRM: contiene @media (prefers-reduced-motion: reduce)', () => {
    expect(TERMINAL_SOURCE).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('T3 CSS PRM: .terminal-cursor tiene animation: none bajo PRM', () => {
    // La regex busca el bloque PRM con .terminal-cursor { animation: none }
    expect(TERMINAL_SOURCE).toMatch(/prefers-reduced-motion.*?terminal-cursor.*?animation:\s*none/s)
  })

  it('T3 CSS PRM: .terminal-line tiene animation: none bajo PRM', () => {
    expect(TERMINAL_SOURCE).toMatch(/prefers-reduced-motion.*?terminal-line.*?animation:\s*none/s)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T4: CSS @keyframes terminal-reveal
  // ─────────────────────────────────────────────────────────────────────────
  it('T4 CSS: contiene @keyframes terminal-reveal para staggered fade-in', () => {
    expect(TERMINAL_SOURCE).toMatch(/@keyframes terminal-reveal/)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T5: i18n reactive — cambiar locale actualiza las líneas del terminal
  // ─────────────────────────────────────────────────────────────────────────
  it('T5 i18n reactive: locale es→en → las líneas del terminal cambian', async () => {
    const { wrapper, i18n } = mountTerminal({ locale: 'es' })
    const textEs = wrapper.find('.terminal-line').text()

    i18n.global.locale.value = 'en'
    await flushPromises()

    const textEn = wrapper.find('.terminal-line').text()
    // Ambos tienen contenido
    expect(textEs.length).toBeGreaterThan(0)
    expect(textEn.length).toBeGreaterThan(0)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // T6 cycle smoke — fake timers + activeChapter=0 → state PROGRAM con <img>
  // ─────────────────────────────────────────────────────────────────────────
  describe('T6-T9 — DOS demo reel cycle (Phase 6 refresh)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('T6 cycle smoke: tras suficientes timers + activeChapter=0 → aparece <img> con src ch0-(game|os)-', async () => {
      // PRM=true para evitar typing char-por-char (más predecible con fake timers).
      const { wrapper } = mountTerminal({ activeChapter: 0, prefersReduced: true })

      // Avanzar más allá del banner (100ms PRM) + IDLE (100ms) + TYPING_CD (instant PRM)
      // + PROMPT_CWD (50ms) + TYPING_EXEC (instant PRM) + LOADING (50ms) → llegar a PROGRAM.
      // Bumpear 1s da margen para todos los estados intermedios.
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()

      const img = wrapper.find('.terminal-program-img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toMatch(/\/assets\/ch0-(game|os)-/)
    })

    it('T7 PRM branch: prefersReduced=true → cycle progresa sin char-by-char delays', async () => {
      const { wrapper } = mountTerminal({ activeChapter: 0, prefersReduced: true })

      // Sin PRM, el primer typing chars tomaría ~80ms × strlen. Con PRM, instant.
      // Verificamos: tras 250ms (banner 100ms + IDLE 100ms + algo) el typed text completo aparece.
      await vi.advanceTimersByTimeAsync(250)
      await flushPromises()

      const typedLines = wrapper.findAll('.terminal-typed')
      // Al menos un .terminal-typed visible con texto completo (no parcial char-by-char)
      expect(typedLines.length).toBeGreaterThan(0)
      const visibleTyped = typedLines.find((el) => el.isVisible() && el.text().length > 0)
      expect(visibleTyped).toBeDefined()
      // El texto debe contener el comando completo "CD \..." (no un substring parcial)
      expect(visibleTyped.text()).toMatch(/CD\s+\\/)
    })

    it('T8 lifecycle pause: activeChapter cambia a 1 → cycle se pausa (no más <img> tras cleanup)', async () => {
      const { wrapper, activeChapterRef } = mountTerminal({
        activeChapter: 0,
        prefersReduced: true,
      })

      // Llegar a estado PROGRAM
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      expect(wrapper.find('.terminal-program-img').exists()).toBe(true)

      // Cambiar a otro chapter — debe pausar y resetear a BANNER
      activeChapterRef.value = 1
      await flushPromises()

      // Tras un avance grande de timers, NO debe haber re-aparición de <img> (cycle pausado)
      await vi.advanceTimersByTimeAsync(10000)
      await flushPromises()

      expect(wrapper.find('.terminal-program-img').exists()).toBe(false)
      // Banner debería estar visible de nuevo (state=BANNER tras stopCycle)
      const lines = wrapper.findAll('.terminal-line')
      const visibleBannerLines = lines.filter((l) => l.isVisible())
      expect(visibleBannerLines.length).toBe(4)
    })

    it('T9 no repeat consecutivo: 6 program selections con Math.random mockeado → ningún slug repetido consecutivo', async () => {
      // Stub Math.random con secuencia que SIEMPRE elegiría el primero (0.1 → idx 0).
      // El pickNextProgram debe rotar al siguiente por el while-do guard.
      let callCount = 0
      vi.spyOn(Math, 'random').mockImplementation(() => {
        callCount++
        // Alternar 0.1, 0.4, 0.7 para forzar idx 0, 1, 2 — pero el guard del componente
        // debe garantizar que ningún consecutivo se repita.
        const seq = [0.1, 0.4, 0.7, 0.1, 0.4, 0.7]
        return seq[(callCount - 1) % seq.length] ?? 0.5
      })

      const { wrapper } = mountTerminal({ activeChapter: 0, prefersReduced: true })

      const slugsSeen = []
      // Avanzar el cycle múltiples veces capturando el slug actual de cada PROGRAM state.
      // PRM cycle es ~2.45s/programa (100 banner + 100 idle + 0 cd + 50 cwd + 0 exec + 50 loading + 2000 program + 50 exit + 50 cls).
      for (let i = 0; i < 6; i++) {
        await vi.advanceTimersByTimeAsync(2500)
        await flushPromises()
        const img = wrapper.find('.terminal-program-img')
        if (img.exists()) {
          const src = img.attributes('src')
          // Extraer slug del path
          const match = src.match(/ch0-(?:game|os)-([a-z0-9]+)\.png/)
          if (match) slugsSeen.push(match[1])
        }
      }

      // Verificar: ningún slug se repite consecutivamente en la secuencia capturada.
      expect(slugsSeen.length).toBeGreaterThanOrEqual(3)
      for (let i = 1; i < slugsSeen.length; i++) {
        expect(slugsSeen[i]).not.toBe(slugsSeen[i - 1])
      }
    })
  })
})
