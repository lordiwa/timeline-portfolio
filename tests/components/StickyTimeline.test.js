// tests/components/StickyTimeline.test.js
// Tests del componente StickyTimeline.vue post-redesign 2026-05-13.
//
// Redesign: barra horizontal bottom con marker móvil → nav vertical left con
// state buttons (sin marker; sincronización via aria-current sobre activeChapter).
//
// Cobertura (12 tests):
//   1. <nav class="sticky-timeline"> tiene role="navigation" + aria-label desde i18n.
//   2. Existen 7 <button class="tick-button"> con data-chapter 0..6 + aria-label i18n.
//   3. Cada tick-button contiene <.tick-year> y <.tick-era> con valores correctos.
//   4. aria-current="true" sigue a activeChapter; los demás 6 ticks no lo tienen.
//   5. Click default motion (PRM=false): scrollToChapter(N, 'smooth').
//   6. Click PRM motion (PRM=true): scrollToChapter(N, 'auto') (D-04).
//   7. CSS: .sticky-timeline declara position fixed, top 50%, left var(--sp-md), z-index 40.
//   8. CSS: .tick-button declara min-width 44px y min-height 44px (touch target).
//   9. CSS: @media (max-width: 599px) oculta .tick-era (year-only en mobile).
//  10. i18n nav aria: locale='es' → 'Navegación de capítulos por era';
//                      'en' → 'Era-based chapter navigation'.
//  11. i18n tick aria: locale='es' + chapter 3 → 'Ir a Web 2.0 (2013)';
//                       'en' → 'Go to Web 2.0 (2013)'.
//  12. i18n reactive (Pitfall 3): mutar locale 'es'→'en' → aria-labels actualizan
//      sin re-mount.

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StickyTimeline from '@/components/StickyTimeline.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

const STICKY_TIMELINE_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyTimeline.vue'),
  'utf8'
)

function mountTimeline({
  initialChapter = 3,
  initialPRM = false,
  locale = 'es',
} = {}) {
  const activeChapter = ref(initialChapter)
  // scrollProgress se mantiene en el provide para no romper el contrato de
  // useScrollState, aunque este componente ya no lo consume.
  const scrollProgress = ref(0)
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
  return { wrapper, activeChapter, prefersReduced, scrollToChapter, i18n }
}

describe('StickyTimeline.vue (vertical-left redesign)', () => {
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
  // Test 3: cada tick-button contiene <.tick-year> + <.tick-era> con valores
  // ───────────────────────────────────────────────────────────────────────────
  it('each tick-button contains <.tick-year> and <.tick-era> with year + era labels', () => {
    const { wrapper } = mountTimeline()
    const buttons = wrapper.findAll('button.tick-button')
    const years = ['1995', '2001', '2009', '2013', '2015', '2022', '2026']
    const eras = ['Terminal', 'HTML 90s', 'Flash', 'Web 2.0', 'AR/VR', 'Modern', 'Phaser']
    buttons.forEach((btn, idx) => {
      const year = btn.find('.tick-year')
      const era = btn.find('.tick-era')
      expect(year.exists()).toBe(true)
      expect(year.text()).toBe(years[idx])
      expect(era.exists()).toBe(true)
      expect(era.text()).toBe(eras[idx])
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: aria-current reactivo según activeChapter
  // ───────────────────────────────────────────────────────────────────────────
  it('aria-current="true" follows activeChapter; other ticks omit aria-current', async () => {
    const { wrapper, activeChapter } = mountTimeline({ initialChapter: 3 })
    let activeBtn = wrapper.find('button[data-chapter="3"]')
    expect(activeBtn.attributes('aria-current')).toBe('true')
    for (const n of [0, 1, 2, 4, 5, 6]) {
      const btn = wrapper.find(`button[data-chapter="${n}"]`)
      expect(btn.attributes('aria-current')).toBeFalsy()
    }
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
  // Test 5: click default motion → scrollToChapter(N, 'smooth')
  // ───────────────────────────────────────────────────────────────────────────
  it('click on tick (PRM=false): invokes scrollToChapter(N, "smooth")', async () => {
    const { wrapper, scrollToChapter } = mountTimeline({ initialPRM: false })
    const btn = wrapper.find('button[data-chapter="2"]')
    await btn.trigger('click')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'smooth')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6: click PRM motion → scrollToChapter(N, 'auto') (D-04)
  // ───────────────────────────────────────────────────────────────────────────
  it('click on tick (PRM=true): invokes scrollToChapter(N, "auto") — D-04', async () => {
    const { wrapper, scrollToChapter } = mountTimeline({ initialPRM: true })
    const btn = wrapper.find('button[data-chapter="2"]')
    await btn.trigger('click')
    expect(scrollToChapter).toHaveBeenCalledTimes(1)
    expect(scrollToChapter).toHaveBeenCalledWith(2, 'auto')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 7: CSS .sticky-timeline → position fixed, top 50%, left var(--sp-md), z-index 40
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .sticky-timeline declares position fixed, top 50%, left var(--sp-md), z-index 40', () => {
    const stickyMatch = STICKY_TIMELINE_SOURCE.match(/\.sticky-timeline\s*\{[\s\S]*?\}/)
    expect(stickyMatch).not.toBeNull()
    const block = stickyMatch[0]
    expect(block).toMatch(/position:\s*fixed/)
    expect(block).toMatch(/top:\s*50%/)
    expect(block).toMatch(/left:\s*var\(--sp-md\)/)
    expect(block).toMatch(/z-index:\s*40/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 8: CSS .tick-button → min-width 44px + min-height 44px (touch target)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .tick-button declares min-width: 44px and min-height: 44px (touch target a11y)', () => {
    const tickButtonMatch = STICKY_TIMELINE_SOURCE.match(/\.tick-button\s*\{[\s\S]*?\}/)
    expect(tickButtonMatch).not.toBeNull()
    expect(tickButtonMatch[0]).toMatch(/min-width:\s*44px/)
    expect(tickButtonMatch[0]).toMatch(/min-height:\s*44px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 9: CSS @media (max-width: 599px) → oculta .tick-era (year-only)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: @media (max-width: 599px) hides .tick-era for compact year-only mobile column', () => {
    const mobileMatch = STICKY_TIMELINE_SOURCE.match(
      /@media\s*\(\s*max-width:\s*599px\s*\)\s*\{[\s\S]*?\}\s*\}/
    )
    expect(mobileMatch).not.toBeNull()
    expect(mobileMatch[0]).toMatch(/\.tick-era\s*\{[\s\S]*?display:\s*none/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 10: i18n nav aria locale variants
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
  // Test 11: i18n tick aria locale variants
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
  // Test 12: i18n reactive (Pitfall 3): mutar locale → aria-labels actualizan
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n reactive (Pitfall 3): mutar locale "es"→"en" → aria-labels actualizan sin re-mount', async () => {
    const { wrapper, i18n } = mountTimeline({ locale: 'es' })
    expect(wrapper.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Navegación de capítulos por era')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('nav.sticky-timeline').attributes('aria-label'))
      .toBe('Era-based chapter navigation')
    const btn = wrapper.find('button[data-chapter="3"]')
    expect(btn.attributes('aria-label')).toContain('Go to')
  })
})
