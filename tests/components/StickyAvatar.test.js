// tests/components/StickyAvatar.test.js
// Tests del componente StickyAvatar.vue (Plan 04, Wave 3) + i18n (Plan 02-02, Task 2.2).
//
// Cobertura (12 tests post i18n):
//   Originales Phase 1 (10):
//   1. Render: <aside class="sticky-avatar"> con aria-live="polite" + aria-label
//      reactivo con el activeChapter inicial (3) desde t('avatar.ariaTemplate').
//   2. Render: existe <div class="avatar-placeholder" aria-hidden="true"> con
//      <span class="avatar-chapter-label">ch3</span> inicialmente.
//   3. Reactividad: al mutar el ref activeChapter, texto + aria-label se actualizan.
//   4. Default motion (PRM=false): opacity=0 inmediatamente + opacity=1 tras 100ms.
//   5. PRM motion (PRM=true): swap instantáneo, sin dip de opacity (D-02).
//   6. HIGH 2 fix: activar PRM mid-flight restaura opacity=1 y cancela timer.
//   7. CSS: position fixed + top/left var(--sp-md) + z-index 40 + 80×96px.
//   8. CSS: transition: opacity 100ms ease (NO 200ms — HIGH 1 fix).
//   9. CSS: media query (max-width: 599px) con 56px / 68px (UI-SPEC §9 mobile).
//  10. CSS: media query (prefers-reduced-motion: reduce) → transition:none.
//   Nuevos i18n (2):
//  11. i18n: locale='es' + chapter 3 → aria-label === 'Avatar de Rafael — capítulo 3 activo'
//      (key avatar.ariaTemplate con interpolación {chapter}).
//  12. i18n reactive (Pitfall 3): toggle locale → aria-label cambia; interpolation
//      {chapter} sigue funcionando con activeChapter.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StickyAvatar from '@/components/StickyAvatar.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const STICKY_AVATAR_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyAvatar.vue'),
  'utf8'
)

// Helper: monta StickyAvatar con provides mutables + plugin i18n.
// Retorna { wrapper, activeChapter, prefersReduced, i18n } para poder mutar refs en runtime.
function mountAvatar({ initialChapter = 3, initialPRM = false, locale = 'es' } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const i18n = createTestI18n({ locale })
  const wrapper = mount(StickyAvatar, {
    global: {
      plugins: [i18n],
      provide: {
        scrollState: { activeChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced, i18n }
}

describe('StickyAvatar.vue', () => {
  // Aseguramos real timers entre tests; los tests que usan fake timers los activan
  // localmente y limpian al final.
  afterEach(() => {
    vi.useRealTimers()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: <aside> raíz con class, aria-live y aria-label reactivo desde i18n
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <aside class="sticky-avatar"> with aria-live="polite" and aria-label from i18n (es, chapter 3)', () => {
    const { wrapper } = mountAvatar({ initialChapter: 3, locale: 'es' })
    const aside = wrapper.find('aside.sticky-avatar')
    expect(aside.exists()).toBe(true)
    expect(aside.attributes('aria-live')).toBe('polite')
    expect(aside.attributes('aria-label')).toBe('Avatar de Rafael — capítulo 3 activo')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: <img.avatar-bust> con src derivado de chapters[N].avatarSrc
  // (Rafael 2026-05-14: placeholder gris → img real, resuelve "no sale la cara" ch6)
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <img class="avatar-bust"> with src and alt derived from chapter (ch3)', () => {
    const { wrapper } = mountAvatar({ initialChapter: 3 })
    const img = wrapper.find('img.avatar-bust')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/assets/ch3-bust.png')
    expect(img.attributes('alt')).toBeTruthy()
    expect(img.attributes('alt').length).toBeGreaterThan(0)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: reactividad — mutar activeChapter actualiza aria-label y texto
  // ───────────────────────────────────────────────────────────────────────────
  it('reactivity: mutating activeChapter updates aria-label and img src after crossfade window', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: false })
    activeChapter.value = 5
    await flushPromises()
    expect(wrapper.find('aside.sticky-avatar').attributes('aria-label'))
      .toBe('Avatar de Rafael — capítulo 5 activo')
    expect(wrapper.find('img.avatar-bust').attributes('src')).toBe('/assets/ch5-bust.png')
    vi.advanceTimersByTime(100)
    await flushPromises()
    expect(wrapper.find('.avatar-bust').attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: default motion — opacity=0 inmediato, opacity=1 tras 100ms (HIGH 1)
  // ───────────────────────────────────────────────────────────────────────────
  it('default motion: chapter change drops opacity to 0, then restores to 1 after 100ms (NOT 200ms)', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: false })
    const bust = () => wrapper.find('.avatar-bust')
    expect(bust().attributes('style')).toContain('opacity: 1')
    activeChapter.value = 4
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 0')
    vi.advanceTimersByTime(99)
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 0')
    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: PRM motion — sin dip de opacity, swap instantáneo (D-02)
  // ───────────────────────────────────────────────────────────────────────────
  it('PRM motion: chapter change does NOT dip opacity (instant swap, D-02)', async () => {
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: true })
    const bust = () => wrapper.find('.avatar-bust')
    expect(bust().attributes('style')).toContain('opacity: 1')
    activeChapter.value = 4
    await nextTick()
    expect(bust().attributes('style')).toContain('opacity: 1')
    expect(bust().attributes('src')).toBe('/assets/ch4-bust.png')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6 (HIGH 2): PRM mid-flight recovery
  // ───────────────────────────────────────────────────────────────────────────
  it('PRM mid-flight recovery: activating PRM during in-flight fade restores opacity=1 and cancels pending timer', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter, prefersReduced } = mountAvatar({ initialChapter: 3, initialPRM: false })
    const bust = () => wrapper.find('.avatar-bust')
    activeChapter.value = 4
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 0')
    prefersReduced.value = true
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 1')
    vi.advanceTimersByTime(150)
    await flushPromises()
    expect(bust().attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 7: CSS position fixed + offsets + z-index + dimensiones
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .sticky-avatar declares position fixed, top/left var(--sp-md), z-index 40, 80×96px', () => {
    expect(STICKY_AVATAR_SOURCE).toMatch(/\.sticky-avatar\s*\{[\s\S]*?position:\s*fixed/)
    expect(STICKY_AVATAR_SOURCE).toMatch(/top:\s*var\(--sp-md\)/)
    expect(STICKY_AVATAR_SOURCE).toMatch(/left:\s*var\(--sp-md\)/)
    expect(STICKY_AVATAR_SOURCE).toMatch(/z-index:\s*40/)
    expect(STICKY_AVATAR_SOURCE).toMatch(/width:\s*80px/)
    expect(STICKY_AVATAR_SOURCE).toMatch(/height:\s*96px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 8 (HIGH 1): CSS transition: opacity 100ms ease (NO 200ms)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: .avatar-bust declares transition: opacity 100ms ease (NOT 200ms — HIGH 1 fix)', () => {
    expect(STICKY_AVATAR_SOURCE).toMatch(/transition:\s*opacity\s+100ms\s+ease/)
    expect(STICKY_AVATAR_SOURCE).not.toMatch(/transition:\s*opacity\s+200ms/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 9: CSS mobile breakpoint <600px → 56×68px (UI-SPEC §9)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: media (max-width: 599px) declares width 56px and height 68px', () => {
    const mobileMatch = STICKY_AVATAR_SOURCE.match(
      /@media\s*\(\s*max-width:\s*599px\s*\)\s*\{[\s\S]*?\}\s*\}/
    )
    expect(mobileMatch).not.toBeNull()
    expect(mobileMatch[0]).toMatch(/width:\s*56px/)
    expect(mobileMatch[0]).toMatch(/height:\s*68px/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 10: CSS @media (prefers-reduced-motion: reduce) → transition:none
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: @media (prefers-reduced-motion: reduce) disables transition on .avatar-bust', () => {
    const prmMatch = STICKY_AVATAR_SOURCE.match(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\}\s*\}/
    )
    expect(prmMatch).not.toBeNull()
    expect(prmMatch[0]).toMatch(/\.avatar-bust\s*\{[\s\S]*?transition:\s*none/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 11 (i18n): locale='es' + chapter 3 → aria-label desde t('avatar.ariaTemplate')
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n: locale=es, chapter 3 → aria-label "Avatar de Rafael — capítulo 3 activo"', () => {
    const { wrapper } = mountAvatar({ initialChapter: 3, locale: 'es' })
    expect(wrapper.find('aside.sticky-avatar').attributes('aria-label'))
      .toBe('Avatar de Rafael — capítulo 3 activo')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 12 (i18n reactive — Pitfall 3): toggle locale → aria-label cambia;
  // interpolación {chapter} sigue funcionando con activeChapter actual.
  // ───────────────────────────────────────────────────────────────────────────
  it('i18n reactive (Pitfall 3): toggle locale "es"→"en" → aria-label cambia con interpolación correcta', async () => {
    const { wrapper, i18n } = mountAvatar({ initialChapter: 3, locale: 'es' })
    expect(wrapper.find('aside.sticky-avatar').attributes('aria-label'))
      .toBe('Avatar de Rafael — capítulo 3 activo')
    i18n.global.locale.value = 'en'
    await flushPromises()
    expect(wrapper.find('aside.sticky-avatar').attributes('aria-label'))
      .toBe("Rafael's avatar — chapter 3 active")
  })
})
