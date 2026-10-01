// Ubicacion exacta de cada bug dentro de su pagina (el solucionario la muestra ademas de la pagina).
// Devuelve null cuando basta con la pagina; si no { key, n?, stepKey? } para armar el texto con i18n:
//   t(key, { n, step: t(stepKey) })
const CHECKOUT_STEPS = ['data', 'shipping', 'payment']
const CHECKOUT_FIELD_STEP = { name: 'data', email: 'data', address: 'data', city: 'data', card: 'payment' }

import { BUG_BY_ID } from './catalog.js'

export function bugLocation(site, id) {
  const page = site.bugPages[id]
  if (!page) return null
  const target = site.data.labelTargets[page]
  const checkout = (stepId) => ({ key: 'lab.where.checkoutStep', n: CHECKOUT_STEPS.indexOf(stepId) + 1, stepKey: `checkout.step.${stepId}` })
  const wizard = (stepId) => ({ key: 'lab.where.wizardStep', stepKey: `wizard.step.${stepId}` })
  const wizardStepOf = (field) => site.data.wizard.steps.find((s) => s.fields.includes(field))?.id

  if (BUG_BY_ID[id]?.intermittent) return { key: 'lab.where.nth', n: site.bugParams[id].n } // N de ESTE sitio (sub-stream de la semilla)
  if (id === 'date-timezone-shift') return { key: 'lab.where.timezone', n: site.bugParams[id].tz }
  if (id === 'tax-rounding-per-line') return { key: 'lab.where.taxSummary' }
  if (id === 'place-order-twice') return checkout('payment')
  if (id === 'console-error' || id === 'modal-focus-lost') return { key: 'lab.where.helpButton' }
  if (id === 'mobile-overflow') return { key: 'lab.where.pageEnd' }
  if (id === 'total-wrong') return page === 'dashboard' ? { key: 'lab.where.dashboardFooter' } : { key: 'lab.where.checkoutSummary' }
  if (page === 'blog' && id === 'missing-label') return { key: 'lab.where.blogComments' }
  if (page === 'checkout') {
    if (id === 'missing-label' || id === 'tab-order') return checkout(CHECKOUT_FIELD_STEP[target] || 'data')
    if (id === 'email-no-at' || id === 'required-not-validated') return checkout('data')
    return null // button-covered: en todos los pasos
  }
  if (page === 'wizard') {
    if (id === 'missing-label' || id === 'tab-order') return wizard(wizardStepOf(target))
    if (id === 'age-off-by-one' || id === 'password-off-by-one') return wizard('security')
    if (id === 'email-no-at' || id === 'required-not-validated') return wizard('data')
    if (id === 'double-submit') return wizard('confirm')
  }
  return null
}
