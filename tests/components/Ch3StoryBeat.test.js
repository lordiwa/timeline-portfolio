// tests/components/Ch3StoryBeat.test.js
// TASK-009 — Ch3StoryBeat.vue: una fila zig-zag del Acto 2 de ch3.
//
// Cobertura:
// - T1: numeral/kicker/lead siempre visibles; icon SVG decorativo aria-hidden.
// - T2: full=true (beat V) no renderea expansor ni .ch3-beat-rest.
// - T3: expandable=true renderea expansor con aria-expanded togglable.
// - T4: reveal on scroll — PRM defensivo (revealed desde el mount).
// - T5: reveal on scroll — IntersectionObserver dispara is-revealed.

import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Ch3StoryBeat from '@/components/Ch3StoryBeat.vue'
import { createTestI18n } from '../i18n/test-helpers.js'

function mountBeat(props = {}, { prefersReduced = false } = {}) {
  const i18n = createTestI18n({ locale: 'es' })
  return mount(Ch3StoryBeat, {
    props: {
      numeral: '01',
      kicker: 'EL FINAL',
      icon: 'flash',
      tone: 'residual',
      lead: 'Lead visible sin click.',
      rest: 'Resto detrás del expansor.',
      expandable: true,
      full: false,
      reverse: false,
      ...props,
    },
    global: {
      plugins: [i18n],
      provide: { prm: { prefersReduced: { value: prefersReduced } } },
    },
  })
}

describe('Ch3StoryBeat.vue', () => {
  it('T1 numeral + kicker + lead siempre visibles; icono decorativo aria-hidden', () => {
    const wrapper = mountBeat()
    expect(wrapper.find('.ch3-beat-numeral').text()).toBe('01')
    expect(wrapper.find('.ch3-beat-kicker').text()).toBe('EL FINAL')
    expect(wrapper.find('.ch3-beat-lead').text()).toContain('Lead visible sin click.')
    expect(wrapper.find('.ch3-beat-icon').attributes('aria-hidden')).toBe('true')
  })

  it('T2 full=true (beat V): sin expansor, lead = párrafo completo', () => {
    const wrapper = mountBeat({ full: true, expandable: false, lead: 'Remate completo del capítulo.' })
    expect(wrapper.find('.ch3-beat-more').exists()).toBe(false)
    expect(wrapper.find('.ch3-beat-rest').exists()).toBe(false)
    expect(wrapper.find('.ch3-beat-lead').text()).toContain('Remate completo del capítulo.')
  })

  it('T3 expandable=true: expansor togglea aria-expanded y la clase is-open', async () => {
    const wrapper = mountBeat()
    const btn = wrapper.find('.ch3-beat-more')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.ch3-beat-rest').classes()).not.toContain('is-open')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.ch3-beat-rest').classes()).toContain('is-open')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('false')
  })

  it('T3 label del expansor cambia de "Seguir leyendo" a "Cerrar" al togglear', async () => {
    const wrapper = mountBeat()
    const btn = wrapper.find('.ch3-beat-more')
    expect(btn.text()).toBe('Seguir leyendo')
    await btn.trigger('click')
    expect(btn.text()).toBe('Cerrar')
  })

  it('T4 PRM: is-revealed desde el mount, sin esperar el IntersectionObserver', () => {
    const wrapper = mountBeat({}, { prefersReduced: true })
    expect(wrapper.find('.ch3-beat').classes()).toContain('is-revealed')
  })

  it('T5 sin PRM: no revealed hasta que el IntersectionObserver dispara isIntersecting', async () => {
    const wrapper = mountBeat({}, { prefersReduced: false })
    expect(wrapper.find('.ch3-beat').classes()).not.toContain('is-revealed')
    // useIntersectionObserver (vueuse) instala el watcher con flush:'post' —
    // el IntersectionObserver real no se crea hasta el siguiente tick post-render.
    await flushPromises()
    const io = globalThis.MockIntersectionObserver.instances.at(-1)
    io.triggerEntries([{ isIntersecting: true }])
    await flushPromises()
    expect(wrapper.find('.ch3-beat').classes()).toContain('is-revealed')
  })
})
