// Capacidades del sitio, derivadas de las paginas presentes (y de algunos datos). Son la condicion de
// activacion de los bugs: un bug entra al pool solo si su `requires` esta incluido en site.capabilities.
// Se guardan como array ordenado (el sitio es JSON-serializable); hasCap() lo consulta.
import { BUGS } from '../bugs/catalog.js'

const FORM_PAGES = ['signup', 'checkout', 'contact', 'wizard']

// --- Capacidades de CAMPO (TASK-048): los formularios salen del pack del tema y un pack puede no traer, por ejemplo,
// un campo numerico. Un bug de validacion solo es elegible si algun formulario visible del sitio tiene el campo que
// necesita. La fuente unica es el `requires` del catalogo de bugs (tokens `field-*`); BUG_REQUIRES es la vista derivada
// de ahi (id de bug -> capacidades de campo) para saber en QUE PAGINA concreta el bug puede manifestarse.
const FIELD_TESTS = {
  'field-email': (m) => m.type === 'email',
  'field-number': (m) => m.type === 'number', // cualquier campo numerico con min: el off-by-one rechaza el minimo exacto
  'field-password': (m) => m.type === 'password',
  'field-name': (m) => m.nameLike && m.required, // el campo de texto obligatorio que 'required-not-validated' deja pasar vacio
}
export const BUG_REQUIRES = Object.fromEntries(
  BUGS.map((b) => [b.id, (b.requires || []).filter((t) => t in FIELD_TESTS)]).filter(([, caps]) => caps.length),
)

const CHECKOUT_KEYS = ['name', 'email', 'address', 'city', 'card']

/** Claves de los campos SIEMPRE visibles de una pagina de formulario (los condicionales del wizard no cuentan). */
export function formKeys(data, page) {
  if (page === 'signup') return data.signupFields
  if (page === 'contact') return data.contactFields
  if (page === 'checkout') return [...CHECKOUT_KEYS, ...data.checkoutExtras]
  if (page === 'wizard') {
    const hiddenField = new Set(data.wizard.conditionals.filter((c) => c.kind === 'field').flatMap((c) => [].concat(c.thenShow)))
    const hiddenStep = new Set(data.wizard.conditionals.filter((c) => c.kind === 'step').flatMap((c) => [].concat(c.thenShow)))
    return data.wizard.steps.filter((s) => !hiddenStep.has(s.id)).flatMap((s) => s.fields).filter((k) => !hiddenField.has(k))
  }
  return []
}

/** La pagina `page` tiene un campo que cumple la capacidad de campo `cap`. */
export const pageHasField = (data, page, cap) => formKeys(data, page).some((k) => FIELD_TESTS[cap](data.fieldMeta[k]))

/** El bug puede manifestarse en esa pagina (sus campos requeridos existen alli). Sin datos: sin restriccion. */
export const bugFitsPage = (bugId, page, data) => !data || (BUG_REQUIRES[bugId] || []).every((cap) => pageHasField(data, page, cap))

export function capabilitiesOf(pages, data) {
  const has = (p) => pages.includes(p)
  const caps = new Set(['modal', 'mobile-nav']) // el ayuda-modal y el menu mobile estan en todos los sitios
  if (has('list')) ['list', 'list-search', 'list-filter', 'list-sort', 'list-pagination'].forEach((c) => caps.add(c))
  if (has('dashboard')) caps.add('list-search') // el panel tambien tiene buscador (spinner-on-empty-results vive en ambos)
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
  const formPages = FORM_PAGES.filter(has)
  if (has('dashboard') || (data && formPages.some((p) => formKeys(data, p).some((k) => data.fieldMeta[k].type === 'date')))) caps.add('dates')
  if (formPages.length) caps.add('forms')
  for (const cap of Object.keys(FIELD_TESTS)) {
    // Sin datos (llamada sin sitio) no se puede saber: se asume que las paginas de formulario traen el campo.
    if (data ? formPages.some((p) => pageHasField(data, p, cap)) : formPages.length) caps.add(cap)
  }
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
