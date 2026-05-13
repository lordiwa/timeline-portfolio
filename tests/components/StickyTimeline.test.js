// tests/components/StickyTimeline.test.js
// Tests del componente StickyTimeline.vue (Plan 05, Wave 4) + i18n (Plan 02-02, Task 2.2).
//
// Cobertura (16 tests):
//   Originales Phase 1 (13):
//   1. Render: <nav class="sticky-timeline"> tiene role="navigation" y
//      aria-label desde t('ui.timeline.navAria').
//   2. Render: existen exactamente 7 <button class="tick-button"> con data-chapter
//      0..6 y aria-label desde t('ui.timeline.tickAria', { era, year }).
//   3. Render: cada tick-button contiene <span class="tick-notch"> y
//      <span class="tick-year"> con el año correcto.
//   4. Render del marker: <div class="timeline-marker"> existe con
//      style="left: 0%" inicial (scrollProgress = 0).
//   5. Reactividad del marker: mutar scrollProgress a 0.5 → tras nextTick,
//      el marker tiene left: 50%.
//   6. aria-current reactivo: mutar activeChapter a 4 → el tick
//      [data-chapter="4"] tiene aria-current="true"; los otros 6 no.
//   7. Click default motion (PRM=false): click en tick [data-chapter="2"]
//      invoca scrollToChapter(2, 'smooth').
//   8. Click PRM motion (PRM=true): click en tick [data-chapter="2"]
//      invoca scrollToChapter(2, 'auto') (D-04).
//   9. CSS: .sticky-timeline declara position fixed, height var(--sp-2xl),
//      z-index 40.
//  10. CSS: .tick-button declara min-width 44px y min-height 44px (touch target).
//  11. CSS: @media (max-width: 599px) con height 44px en .sticky-timeline.
//  12. CSS: .timeline-marker declara transition: left 0ms linear.
//  13. CSS: .sticky-timeline declara bottom: env(safe-area-inset-bottom, 0).
//   Nuevos i18n (3):
//  14. i18n nav aria: locale='es' → 'Navegación de capítulos por era'; 'en' → 'Era-based chapter navigation'
//  15. i18n tick aria: locale='es' + chapter 3 → aria-label contiene 'Ir a' + 'Web 2.0' + '2013'
//  16. i18n reactive (Pitfall 3): mutar locale 'es'→'en' + nextTick → aria-labels actualizan
//      sin re-mount.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StickyTimeline from '@/components/StickyTimeline.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const STICKY_TIMELINE_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyTimeline.vue'),
  'utf8'
)

// Helper: monta StickyTimeline con provides mutables + plugin i18n.
// Retorna { wrapper, activeChapter, scrollProgress, prefersReduced, scrollToChapter, i18n }
// para poder mutar refs en runtime e inspeccionar el spy.
function mountTimeline({
  initialChapter = 3,
  initialProgress = 0,
  initialPRM = false,
  locale = 'es',
} = {}) {
  const activeChapter = ref(initialChapter)
  const scrollProgress = ref(initialProgress)
  const prefersReduced = ref(initialPRM)
  const scrollToChapter = vi.fn()
  const i18n = createTestI18n({ locale })
  const wrapper = mount(StickyTimeline, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter, scrollProgress, scrollToChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, scrollProgress, prefersReduced, scrollToChapter, i18n }
}

describe('StickyTimeline.vue', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: <nav> raíz con role="navigation" y aria-label desde i18n
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <nav class="sticky-timeline"> with role="navigation" and aria-label from i18n (es)', () => {
    const { wrapper } = mountTimeline({ locale: 'es' })
    const nav = wrapper.find('nav.sticky-timeline')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('role')).toBe('navigation')
    expect(nav.attributes('aria-label')).toBe('Navegación de capítulos por era')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: exactly 7 tick-buttons with data-chapter 0..6 + aria-label desde i18n
  // ───────────────────────────────────────────────────────────────────────────
  it('renders 7 tick-buttons with data-chapter 0..6 and aria-label from t("ui.timeline.tickAria")', () => {
    const { wrapper } = mountTimeline({ locale: 'es' })
    const buttons = wrapper.findAll('button.tick-button')
    expect(buttons.length).toBe(7)
    const expected = [
      { ch: '0', label: 'Ir a Terminal (1995)' },
      { ch: '1', label: 'Ir a HTML 90s (2001)' },
      { ch: '2', label: 'Ir a Flash (2009)' },
      { ch: '3', label: 'Ir a Web 2.0 (2013)' },
      { ch: '4', label: 'Ir a AR/VR (2015)' },
      { ch: '5', label: 'Ir a Modern (2022)' },
      { ch: '6', label: 'Ir a Phaser (2026)' },
    ]
    expected.forEach(({ ch, label }, idx) => {
      const btn = buttons[idx]
      expect(btn.attributes('data-chapter')).toBe(ch)
      expect(btn.attributes('aria-label')).toBe(label)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: cada tick-button contiene .tick-notch + .tick-year con año correcto
  // ───────────────────────────────────────────────────────────────────────────
  it('each tick-button contains <.tick-notch> and <.tick-year> with the year', () => {
    const { wrapper } = mountTimeline()
    const buttons = wrapper.findAll('button.tick-button')
    const years = ['1995', '2001', '2009', '2013', '2015', '2022', '2026']
    buttons.forEach((btn, idx) => {
      const notch = btn.find('.tick-notch')
      const year = btn.find('.tick-year')
      expect(notch.exists()).toBe(true)
      expect(notch.attributes('aria-hidden')).toBe('true')
      expect(year.exists()).toBe(true)
      expect(year.text()).toBe(years[idx])
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: marker existe con style="left: 0%" inicial (scrollProgress=0)
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <.timeline-marker> with initial left: 0% (scrollProgress=0)', () => {
    const { wrapper } = mountTimeline({ initialProgress: 0 })
    const marker = wrapper.find('.timeline-marker')
    expect(marker.exists()).toBe(true)
    expect(marker.attributes('aria-hidden')).toBe('true')
    expect(marker.attributes('style')).toContain('left: 0%')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: reactividad del marker — mutar scrollProgress a 0.5 → left: 50%
  // ───────────────────────────────────────────────────────────────────────────
  it('reactivity: mutating scrollProgress to 0.5 updates marker left to 50%', async () => {
    const { wrapper, scrollProgress } = mountTimeline({ initialProgress: 0 })
    scrollProgress.value = 0.5
    await nextTick()
    const marker = wrapper.find('.timeline-marker')
    expect(marker.attributes('style')).toContain('left: 50%')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6: aria-current reactivo según activeChapter
  // ───────────────────────────────────────────────────────────────────────────
  it('aria-current="true" follows activeChapter; other ticks omit aria-current', async () => {
    const { wrapper, activeChapter } = mountTimeline({ initialChapter: 3 })
    // Inicialmente, tick 3 está activo.
    let activeBtn = wrapper.find('button[data-chapter="3"]')
    expect(activeBtn.attributes('aria-current')).toBe('true')
    // Los otros 6 no tienen aria-current="true".
    for (const n of [0, 1, 2, 4, 5, 6]) {
      const btn = wrapper.find(`button[data-chapter="${n}"]`)
      expect(btn.attributes('aria-current')).toBeFalsy()
    }
    // Cambiar a 4.
    activeChapter.value = 4
    await nextTick()
    activeBtn = wrapper.find('button[data-chapter="4"]')
    expect(activeBtn.attributes('aria-current')).toBe('true')
    for (const n of [0, 1, 2, 3, 5, 6]) {
      const btn = wrapper.find(`button[data-chapter="${n}"]`)
      expect(btn.attributes('aria-current')).toBeFalsy()
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 7: click default motion → scrollToChapter(N, 'smooth')
  // ───────────────────────────────────────────────────────────────────────────
  it('click on tick (PRM=false): invokes scrollToChapter(N, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountTimeline({ initialPRM: false })
    const btn = wrapper.find('button[data-chapter="2"]')
    await btn.trigger('click')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'smooth')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 8: click PRM motion → scrollToChapter(N, 'auto') (D-04)
  // ───────────────────────────────────────────────────────────────────────────
  it('click on tick (PRM=true): invokes scrollToChapter(N, "auto") — D-04', async () => {
    const { wrapper, scrollToChapter } = mountTimeline({ initialPRM: true })
    const btn = wrapper.find('button[data-chapter="2"]')
    await btn.trigger('click')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'auto')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 9: CSS: .sticky-timeline position fixed, height var(--sp-2xl), z-index 40
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .sticky-timeline declares position fixed, height var(--sp-2xl), z-index 40', () => {
    expect(STICKY_TIMELINE_SOURCE).toMatch(/\.sticky-timeline\s*\{[\s\S]*?position:\s*fixed/)
    expect(STICKY_TIMELINE_SOURCE).toMatch(/height:\s*var\(--sp-2xl\)/)
    expect(STICKY_TIMELINE_SOURCE).toMatch(/z-index:\s*40/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 10: CSS: .tick-button min-width 44px y min-height 44px (touch target)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .tick-button declares min-width: 44px and min-height: 44px (touch target a11y)', () => {
    const tickButtonMatch = STICKY_TIMELINE_SOURCE.match(
      /\.tick-button\s*\{[\s\S]*?\}/
    )
    expect(tickButtonMatch).not.toBeNull()
    expect(tickButtonMatch[0]).toMatch(/min-width:\s*44px/)
    expect(tickButtonMatch[0]).toMatch(/min-height:\s*44px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 11: CSS: @media (max-width: 599px) con height 44px en .sticky-timeline
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: @media (max-width: 599px) declares height: 44px on .sticky-timeline', () => {
    const mobileMatch = STICKY_TIMELINE_SOURCE.match(
      /@media\s*\(\s*max-width:\s*599px\s*\)\s*\{[\s\S]*?\}\s*\}/
    )
    expect(mobileMatch).not.toBeNull()
    expect(mobileMatch[0]).toMatch(/\.sticky-timeline\s*\{[\s\S]*?height:\s*44px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 12: CSS: .timeline-marker transition: left 0ms linear (binding continuo)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .timeline-marker declares transition: left 0ms linear (continuous binding, no animation)', () => {
    const markerMatch = STICKY_TIMELINE_SOURCE.match(
      /\.timeline-marker\s*\{[\s\S]*?\}/
    )
    expect(markerMatch).not.toBeNull()
    expect(markerMatch[0]).toMatch(/transition:\s*left\s+0ms\s+linear/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 13 (HIGH 4): CSS: bottom: env(safe-area-inset-bottom, 0) preventivo
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .sticky-timeline declares bottom: env(safe-area-inset-bottom, 0) from day 1 (HIGH 4)', () => {
    expect(STICKY_TIMELINE_SOURCE).toMatch(
      /\.sticky-timeline\s*\{[\s\S]*?bottom:\s*env\(safe-area-inset-bottom,\s*0\)/
    )
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 14 (i18n nav aria): locale='es' → 'Navegación de capítulos por era';
  //                           locale='en' → 'Era-based chapter navigation'
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n nav aria: locale=es → "Navegación de capítulos por era"; locale=en → "Era-based chapter navigation"', () => {
    const { wrapper: wrapperEs } = mountTimeline({ locale: 'es' })
    expect(wrapperEs.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Navegación de capítulos por era')

    const { wrapper: wrapperEn } = mountTimeline({ locale: 'en' })
    expect(wrapperEn.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Era-based chapter navigation')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 15 (i18n tick aria): locale='es' + chapter 3 → aria-label contiene
  //                            'Ir a' + 'Web 2.0' + '2013'
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n tick aria: locale=es, chapter 3 → "Ir a Web 2.0 (2013)"; locale=en → "Go to Web 2.0 (2013)"', () => {
    const { wrapper: wrapperEs } = mountTimeline({ locale: 'es' })
    const btnEs = wrapperEs.find('button[data-chapter="3"]')
    expect(btnEs.attributes('aria-label')).toContain('Ir a')
    expect(btnEs.attributes('aria-label')).toContain('Web 2.0')
    expect(btnEs.attributes('aria-label')).toContain('2013')

    const { wrapper: wrapperEn } = mountTimeline({ locale: 'en' })
    const btnEn = wrapperEn.find('button[data-chapter="3"]')
    expect(btnEn.attributes('aria-label')).toContain('Go to')
    expect(btnEn.attributes('aria-label')).toContain('Web 2.0')
    expect(btnEn.attributes('aria-label')).toContain('2013')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 16 (i18n reactive — Pitfall 3): mutar locale 'es'→'en' → aria-labels
  // actualizan SIN re-mount (el binding usa t() reactivo).
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n reactive (Pitfall 3): mutar locale "es"→"en" → aria-labels actualizan sin re-mount', async () => {
    const { wrapper, i18n } = mountTimeline({ locale: 'es' })
    expect(wrapper.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Navegación de capítulos por era')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Era-based chapter navigation')
    // Verificar también un tick
    const btn = wrapper.find('button[data-chapter="3"]')
    expect(btn.attributes('aria-label')).toContain('Go to')
  })
})
