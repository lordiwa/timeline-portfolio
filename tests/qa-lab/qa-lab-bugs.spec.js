// TASK-046 ronda 1 — manifestacion de bugs puros (con y sin flag) + invariantes de fixes.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { generatePage } from '../../src/qa-lab/generator/index.js'
import { withTypo } from '../../src/qa-lab/composables/useLab.js'
import { createLabI18n } from '../../src/qa-lab/i18n/index.js'
import SitePage from '../../src/qa-lab/components/SitePage.vue'
import es from '../../src/qa-lab/i18n/es.json'
import en from '../../src/qa-lab/i18n/en.json'

function pageFor(templateId) {
  for (let i = 0; i < 500; i++) {
    const p = generatePage(`bug-${i}`)
    if (p.templateId === templateId) return p
  }
  throw new Error('sin seed para ' + templateId)
}
const mountPage = (templateId, bugs, locale = 'es') => {
  const page = pageFor(templateId)
  const w = mount(SitePage, { props: { page, bugSet: new Set(bugs) }, global: { plugins: [createLabI18n(locale)] }, attachTo: document.body })
  return { w, page }
}
const click = (w, label) => w.findAll('button').find((b) => b.text() === label)

describe('QA Lab: bugs puros se manifiestan con flag y no sin flag', () => {
  it('pagination-skips: "Siguiente" desde skipAt avanza dos solo con el flag (evita un bug de "mentira" o uno siempre activo)', async () => {
    for (const flag of [false, true]) {
      const { w, page } = mountPage('products', flag ? ['pagination-skips'] : [])
      const { skipAt } = page.content
      for (let i = 1; i < skipAt; i++) await click(w, 'Siguiente').trigger('click')
      await click(w, 'Siguiente').trigger('click')
      expect(w.find('.qa-page-info').text()).toMatch(new RegExp(`Página ${skipAt + (flag ? 2 : 1)} de`))
      w.unmount()
    }
  })

  it('filter-not-reset: "Limpiar filtros" deja la categoria solo con el flag (evita un filtro que nunca se limpia sin bug)', async () => {
    for (const flag of [false, true]) {
      const { w } = mountPage('dashboard', flag ? ['filter-not-reset'] : [])
      const sel = w.find('.qa-toolbar-row select')
      await sel.setValue('1')
      await w.find('input[type=search]').setValue('zzz')
      await click(w, 'Limpiar filtros').trigger('click')
      expect(w.find('.qa-toolbar-row select').element.value).toBe(flag ? '1' : '')
      expect(w.find('input[type=search]').element.value).toBe('')
      w.unmount()
    }
  })

  it('total-wrong: total de checkout y de dashboard solo incorrectos con flag (evita totales mal calculados sin bug)', async () => {
    for (const flag of [false, true]) {
      const { w, page } = mountPage('checkout', flag ? ['total-wrong'] : [])
      const { lines, taxRate } = page.content
      const sub = lines.reduce((s, l) => s + l.qty * l.price, 0)
      const expected = (sub * (1 + taxRate / 100)).toFixed(2)
      const got = w.find('[data-testid="grand-total"]').text()
      expect(got === expected).toBe(!flag)
      w.unmount()

      const d = mountPage('dashboard', flag ? ['total-wrong'] : [])
      const rows = d.page.content.rows.slice(0, d.page.content.pageSize)
      const real = rows.reduce((s, r) => s + r.price, 0)
      const shown = Number(d.w.find('[data-testid="page-total"]').text())
      expect(shown === real).toBe(!flag)
      d.w.unmount()
    }
  })

  it('double-submit: dos envios seguidos registran 2 solo con flag (evita doble registro en formularios sanos)', async () => {
    for (const flag of [false, true]) {
      const { w, page } = mountPage('contact', flag ? ['double-submit'] : [])
      for (const f of page.content.fields) {
        const el = w.find(`[data-field="${f.key}"] ${f.type === 'select' ? 'select' : f.type === 'textarea' ? 'textarea' : 'input'}`)
        const v = { email: 'a@b.co', select: '1' }[f.type] ?? 'Ana Perez'
        await el.setValue(v)
      }
      await w.find('form').trigger('submit')
      await w.find('form').trigger('submit')
      expect(w.find('[data-testid="submissions"]').text()).toContain(flag ? '2' : '1')
      w.unmount()
    }
  })

  it('typo: la errata siempre difiere del original en TODOS los nombres y titulos de los 8 temas x 2 idiomas (evita un bug typo invisible)', () => {
    let checked = 0
    for (const msgs of [es, en]) {
      const tpl = Object.values(msgs.tpl).map((x) => x.title)
      for (const theme of Object.values(msgs.theme)) {
        for (const n of [theme.name0, theme.name1, theme.name2]) {
          for (const title of tpl) {
            const text = title.replace('{brand}', n)
            expect(withTypo(text)).not.toBe(text)
            checked++
          }
        }
      }
    }
    expect(checked).toBe(Object.keys(es.theme).length * 3 * Object.keys(es.tpl).length * 2)
    expect(withTypo('oo')).not.toBe('oo') // fallback sin letras distintas
  })

  it('checkout: cantidad 0, negativa o vacia no da total negativo, con y sin flag total-wrong (evita un bug no intencional)', async () => {
    for (const bugs of [[], ['total-wrong']]) {
      const { w } = mountPage('checkout', bugs)
      const inputs = w.findAll('.qa-cart input')
      for (const v of ['0', '-5', '']) {
        await inputs[0].setValue(v)
        await inputs[0].trigger('change')
        const total = Number(w.find('[data-testid="grand-total"]').text())
        expect(total).toBeGreaterThan(0)
      }
      w.unmount()
    }
  })

  it('modal: Tab/Shift+Tab ciclan dentro del dialogo (evita que el foco escape del modal)', async () => {
    const { w } = mountPage('faq', [])
    await click(w, 'Ayuda').trigger('click')
    await new Promise((r) => setTimeout(r))
    const dlg = document.querySelector('.qa-modal')
    const btns = dlg.querySelectorAll('button, a[href]')
    const last = btns[btns.length - 1]
    last.focus()
    dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(btns[0])
    btns[0].focus()
    dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
    w.unmount()
  })
})

// --- Manifestacion en el DOM de los bugs restantes, con y sin flag (jsdom no hace layout: se verifica el DOM/clase que dispara el CSS) ---
const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms))

const DOM_CASES = {
  'button-covered': { tpl: 'contact', probe: ({ w }) => w.find('[data-testid="qa-sticker"]').exists() },
  'text-truncated': { tpl: 'contact', probe: ({ w }) => w.find('.site-note').classes().includes('bug-truncated') },
  misaligned: { tpl: 'contact', probe: ({ w }) => w.find('h1').classes().includes('bug-misaligned') },
  'low-contrast': { tpl: 'contact', probe: ({ w }) => w.find('.site').classes().includes('lowc') },
  'mobile-overflow': { tpl: 'contact', probe: ({ w }) => w.find('.site-strip.bug-overflow').exists() },
  'tab-order': { tpl: 'contact', probe: ({ w }) => w.find('button[type=submit]').attributes('tabindex') === '1' },
  // sin label asociado ni aria-label en el campo objetivo => el bug se manifiesta
  'missing-label': {
    tpl: 'contact',
    probe: ({ w, page }) => {
      const id = 'qa-' + page.content.labelTarget
      return !w.find('label[for="' + id + '"]').exists() && !w.find('#' + id).attributes('aria-label')
    },
  },
  untranslated: { tpl: 'contact', probe: ({ w, page }) => w.find('.site-lead').text().includes(en.tpl.contact.lead.split(' {brand}')[0].split('{brand}')[0].trim().slice(0, 8)) },
  'modal-focus-lost': {
    tpl: 'contact',
    probe: async ({ w }) => {
      const help = w.findAll('button').find((b) => b.text() === 'Ayuda')
      help.element.focus()
      await help.trigger('click')
      await tick()
      await w.find('.qa-modal .qa-btn').trigger('click')
      await tick()
      return document.activeElement !== help.element
    },
  },
  // El timer se dispara con fake timers: el TypeError real (no capturado) se observa al avanzar el reloj.
  'console-error': {
    tpl: 'contact',
    probe: async ({ w }) => {
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      let thrown = null
      try {
        await w.findAll('button').find((b) => b.text() === 'Ayuda').trigger('click')
        vi.advanceTimersByTime(10)
      } catch (e) {
        thrown = e
      } finally {
        vi.useRealTimers()
      }
      return thrown?.name === 'TypeError'
    },
  },
}

describe('QA Lab: manifestacion en el DOM con y sin flag', () => {
  it.each(Object.keys(DOM_CASES))('%s se manifiesta solo con su flag (evita un bug de mentira o un bug siempre activo)', async (id) => {
    const { tpl, probe } = DOM_CASES[id]
    for (const flag of [false, true]) {
      const { w, page } = mountPage(tpl, flag ? [id] : [])
      expect(await probe({ w, page })).toBe(flag)
      w.unmount()
    }
  })
})
