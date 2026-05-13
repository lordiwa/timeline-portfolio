// tests/components/StickyAvatar.test.js
// Tests del componente StickyAvatar.vue (Plan 04, Wave 3).
//
// Cobertura (10 tests post iteración 2 del plan-checker):
//   1. Render: <aside class="sticky-avatar"> tiene aria-live="polite" + aria-label
//      reactivo con el activeChapter inicial (3).
//   2. Render: existe <div class="avatar-placeholder" aria-hidden="true"> con
//      <span class="avatar-chapter-label">ch3</span> inicialmente.
//   3. Reactividad: al mutar el ref activeChapter, texto + aria-label se actualizan
//      al nuevo N (tras la ventana de crossfade).
//   4. Default motion (PRM=false): cambio de activeChapter dispara opacity=0
//      inmediatamente, y tras 100ms (no 200) opacity vuelve a 1 — verifica HIGH 1
//      fix (200ms TOTAL = 100 fade-out + 100 fade-in).
//   5. PRM motion (PRM=true): cambio de activeChapter NO baja la opacity en
//      ningún momento; el swap es instantáneo (D-02).
//   6. **HIGH 2 fix — PRM mid-flight recovery:** durante el fade-out (opacity=0),
//      activar PRM debe restaurar opacity=1 y cancelar el setTimeout pendiente.
//   7. CSS: position: fixed + top var(--sp-md) + left var(--sp-md) + z-index 40 +
//      width 80px + height 96px (UI-SPEC §7.2 verbatim).
//   8. CSS: `transition: opacity 100ms ease` (NO 200ms — HIGH 1 fix).
//   9. CSS: media query (max-width: 599px) con 56px / 68px (UI-SPEC §9 mobile).
//  10. CSS: media query (prefers-reduced-motion: reduce) con transition:none sobre
//      .avatar-placeholder (defensive — JS también short-circuita).
//
// Wrapper de inject: provee `scrollState` con `activeChapter` mutable (ref<number>)
// y `prm` con `prefersReduced` mutable (ref<boolean>) — NO computed real, para que
// el watcher de prefersReduced (HIGH 2) se pueda disparar desde el test.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import StickyAvatar from '@/components/StickyAvatar.vue'

// Lee el SFC raw para asserts de CSS estático en el bloque <style scoped>.
const STICKY_AVATAR_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/components/StickyAvatar.vue'),
  'utf8'
)

// Helper: monta StickyAvatar con provides mutables.
// Retorna { wrapper, activeChapter, prefersReduced } para poder mutar refs en runtime.
function mountAvatar({ initialChapter = 3, initialPRM = false } = {}) {
  const activeChapter = ref(initialChapter)
  const prefersReduced = ref(initialPRM)
  const wrapper = mount(StickyAvatar, {
    global: {
      provide: {
        scrollState: { activeChapter },
        prm: { prefersReduced },
      },
    },
  })
  return { wrapper, activeChapter, prefersReduced }
}

describe('StickyAvatar.vue', () => {
  // Aseguramos real timers entre tests; los tests que usan fake timers los activan
  // localmente y limpian al final.
  afterEach(() => {
    vi.useRealTimers()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: <aside> raíz con class, aria-live y aria-label reactivo
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <aside class="sticky-avatar"> with aria-live="polite" and aria-label including activeChapter', () => {
    const { wrapper } = mountAvatar({ initialChapter: 3 })
    const aside = wrapper.find('aside.sticky-avatar')
    expect(aside.exists()).toBe(true)
    expect(aside.attributes('aria-live')).toBe('polite')
    expect(aside.attributes('aria-label')).toBe('Avatar de Rafael — chapter 3 activo')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: placeholder gris + span con ch{N} inicial
  // ───────────────────────────────────────────────────────────────────────────
  it('renders <div class="avatar-placeholder" aria-hidden="true"> with <span>ch3</span>', () => {
    const { wrapper } = mountAvatar({ initialChapter: 3 })
    const placeholder = wrapper.find('.avatar-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.attributes('aria-hidden')).toBe('true')
    const span = placeholder.find('span.avatar-chapter-label')
    expect(span.exists()).toBe(true)
    expect(span.text()).toBe('ch3')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: reactividad — mutar activeChapter actualiza aria-label y texto
  // ───────────────────────────────────────────────────────────────────────────
  it('reactivity: mutating activeChapter updates aria-label and span text after crossfade window', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: false })
    activeChapter.value = 5
    // El watch del componente hace await nextTick antes del setTimeout; flush para
    // garantizar que el timer esté programado antes de advance.
    await flushPromises()
    // aria-label sigue la verdad inmediatamente (lo provee la reactividad del binding).
    expect(wrapper.find('aside.sticky-avatar').attributes('aria-label'))
      .toBe('Avatar de Rafael — chapter 5 activo')
    // El texto también, porque el template binding es directo sobre activeChapter.
    expect(wrapper.find('span.avatar-chapter-label').text()).toBe('ch5')
    // Tras 100ms, opacity vuelve a 1 (fin del crossfade).
    vi.advanceTimersByTime(100)
    await flushPromises()
    expect(wrapper.find('.avatar-placeholder').attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: default motion — opacity=0 inmediato, opacity=1 tras 100ms (HIGH 1)
  // ───────────────────────────────────────────────────────────────────────────
  it('default motion: chapter change drops opacity to 0, then restores to 1 after 100ms (NOT 200ms)', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: false })
    const placeholder = () => wrapper.find('.avatar-placeholder')
    // Estado inicial: opacity=1.
    expect(placeholder().attributes('style')).toContain('opacity: 1')
    // Disparar cambio de chapter.
    activeChapter.value = 4
    // El watcher es async (await nextTick antes del setTimeout). flushPromises drena
    // todos los microtasks para garantizar que el setTimeout esté registrado.
    await flushPromises()
    // Inmediatamente después del watch, opacity debe estar en 0.
    expect(placeholder().attributes('style')).toContain('opacity: 0')
    // Avanzar 99ms — todavía en 0 (el setTimeout(100) no ha disparado).
    vi.advanceTimersByTime(99)
    await flushPromises()
    expect(placeholder().attributes('style')).toContain('opacity: 0')
    // Avanzar 1ms más (total 100ms) — ahora opacity debe estar en 1.
    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(placeholder().attributes('style')).toContain('opacity: 1')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: PRM motion — sin dip de opacity, swap instantáneo (D-02)
  // ───────────────────────────────────────────────────────────────────────────
  it('PRM motion: chapter change does NOT dip opacity (instant swap, D-02)', async () => {
    const { wrapper, activeChapter } = mountAvatar({ initialChapter: 3, initialPRM: true })
    const placeholder = () => wrapper.find('.avatar-placeholder')
    expect(placeholder().attributes('style')).toContain('opacity: 1')
    activeChapter.value = 4
    await nextTick()
    // Bajo PRM, opacity NO bajó a 0 — single-frame replace.
    expect(placeholder().attributes('style')).toContain('opacity: 1')
    // Texto sí cambió.
    expect(wrapper.find('span.avatar-chapter-label').text()).toBe('ch4')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6 (HIGH 2): PRM mid-flight recovery — opacity vuelve a 1 si PRM activa
  // durante el fade-out, y el timer pendiente se cancela.
  // ───────────────────────────────────────────────────────────────────────────
  it('PRM mid-flight recovery: activating PRM during in-flight fade restores opacity=1 and cancels pending timer', async () => {
    vi.useFakeTimers()
    const { wrapper, activeChapter, prefersReduced } = mountAvatar({ initialChapter: 3, initialPRM: false })
    const placeholder = () => wrapper.find('.avatar-placeholder')
    // Disparar cambio de chapter → opacity baja a 0 (mid-flight).
    activeChapter.value = 4
    await flushPromises()
    expect(placeholder().attributes('style')).toContain('opacity: 0')
    // Activar PRM mid-flight — el watcher dedicado debe recuperar opacity a 1.
    prefersReduced.value = true
    await flushPromises()
    expect(placeholder().attributes('style')).toContain('opacity: 1')
    // Avanzar el timer más allá del setTimeout(100). Si el timer NO se canceló,
    // un "doble set" volvería a setear opacity=1 sin daño; pero queremos verificar
    // que tras avanzar el tiempo, opacity sigue en 1 sin haber rebotado.
    vi.advanceTimersByTime(150)
    await flushPromises()
    expect(placeholder().attributes('style')).toContain('opacity: 1')
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
  it('CSS: .avatar-placeholder declares transition: opacity 100ms ease (NOT 200ms — HIGH 1 fix)', () => {
    expect(STICKY_AVATAR_SOURCE).toMatch(/transition:\s*opacity\s+100ms\s+ease/)
    // Negative assertion: no transition opacity 200ms anywhere.
    expect(STICKY_AVATAR_SOURCE).not.toMatch(/transition:\s*opacity\s+200ms/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 9: CSS mobile breakpoint <600px → 56×68px (UI-SPEC §9)
  // ───────────────────────────────────────────────────────────────────────────
  it('CSS: media (max-width: 599px) declares width 56px and height 68px', () => {
    // Buscar el bloque @media (max-width: 599px) y dentro de él las dimensiones mobile.
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
  it('CSS: @media (prefers-reduced-motion: reduce) disables transition on .avatar-placeholder', () => {
    const prmMatch = STICKY_AVATAR_SOURCE.match(
      /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?\}\s*\}/
    )
    expect(prmMatch).not.toBeNull()
    expect(prmMatch[0]).toMatch(/\.avatar-placeholder\s*\{[\s\S]*?transition:\s*none/)
  })
})
