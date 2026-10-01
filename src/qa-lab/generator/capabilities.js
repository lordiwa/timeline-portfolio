// Capacidades del sitio, derivadas de las paginas presentes (y de algunos datos). Son la condicion de
// activacion de los bugs: un bug entra al pool solo si su `requires` esta incluido en site.capabilities.
// Se guardan como array ordenado (el sitio es JSON-serializable); hasCap() lo consulta.
const FORM_PAGES = ['signup', 'checkout', 'contact', 'wizard']

export function capabilitiesOf(pages, data) {
  const has = (p) => pages.includes(p)
  const caps = new Set(['modal', 'mobile-nav']) // el ayuda-modal y el menu mobile estan en todos los sitios
  if (has('list')) ['list', 'list-search', 'list-filter', 'list-sort', 'list-pagination'].forEach((c) => caps.add(c))
  if (has('detail')) caps.add('detail')
  if (has('cart')) caps.add('cart')
  if (has('checkout')) ['checkout', 'coupon', 'shipping', 'tax'].forEach((c) => caps.add(c))
  if (has('login')) caps.add('auth')
  if (has('signup')) caps.add('register')
  if (has('account')) { caps.add('account'); caps.add('protected-routes') }
  if (has('account') && has('checkout')) caps.add('orders') // la cuenta lista los pedidos del checkout
  if (has('contact')) caps.add('contact')
  if (has('faq')) caps.add('faq')
  if (has('dashboard')) caps.add('dashboard')
  if (has('blog')) caps.add('blog-comments')
  if (has('wizard')) { caps.add('wizard'); caps.add('wizard-conditional') }
  if (has('dashboard') || (has('signup') && data?.signupFields?.includes('birth'))) caps.add('dates')
  if (FORM_PAGES.some(has)) caps.add('forms')
  return [...caps].sort()
}

export const hasCap = (site, token) => site.capabilities.includes(token)

/** Atajos con nombre: hasCart, hasCheckout, hasLogin... (misma fuente que hasCap). */
export function capFlags(site) {
  const c = (t) => hasCap(site, t)
  return {
    hasList: c('list'), hasDetail: c('detail'), hasCart: c('cart'), hasCheckout: c('checkout'), hasLogin: c('auth'),
    hasRegister: c('register'), hasAccount: c('account'), hasContact: c('contact'), hasFaq: c('faq'),
    hasDashboard: c('dashboard'), hasBlog: c('blog-comments'), hasWizard: c('wizard'), hasForms: c('forms'), hasDates: c('dates'),
  }
}

export const requiresMet = (bug, caps) => (bug.requires || []).every((t) => caps.includes(t))
