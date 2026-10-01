// Catalogo UNICO de bugs del QA Lab. Los componentes consultan flags (Set de ids activos)
// y el solucionario se arma desde ese mismo Set. No hay bugs fuera de este archivo.
//
// Campos de cada entrada:
//   id, category, difficulty, description {es,en}   identidad, familia, dificultad y texto con pagina y pasos
//   template   {es,en} opcional: la descripcion con parametros ({field}, {min}, {max}, {prev}) que describeBug() resuelve
//              contra el campo REAL del sitio (los campos vienen del pack del tema: no se asume "edad" ni "nombre")
//   level      'junior'|'semi'|'senior'              nivel MINIMO: un bug de nivel X aparece en X y en los superiores
//   pages      tipos de pagina donde se puede manifestar (el generador elige UNA: site.bugPages[id])
//   requires   capacidades del sitio (generator/capabilities.js) que el sitio debe tener
//   excludes   ids incompatibles (la relacion se cierra simetrica mas abajo)
//   groups     grupos de "maximo N por sitio" (limites en generator/compat.js)
//   crossPage  el bug involucra estado compartido o mas de una pagina
//   intermittent  falla solo en la N-esima accion (N sale de params(rng): sub-stream propio de la semilla)
//   params(rng)   parametros del bug (N, offset de zona...). Se sortean SIEMPRE, este activo o no (site.bugParams)
//   witness(site) garantiza que el contenido generado permite manifestar el bug; si da false no entra al pool
//   needsBrowser  solo se verifica con layout real (scripts/verify-qa-lab-layout.mjs)
import { PAGE_TYPES } from '../generator/pages.js'
import { createLatency } from '../services/clock.js'
import { computeTotals } from '../state/pricing.js'
import { getThemePack } from '../themes/index.js'

// Paginas (tipos de generator/pages.js) donde cada bug PUEDE manifestarse. El generador elige una.
const FORM_PAGES = ['signup', 'checkout', 'contact', 'wizard']
const LABELED_PAGES = [...FORM_PAGES, 'list', 'dashboard', 'faq', 'blog']
const ANY_PAGE = PAGE_TYPES

export const CATEGORIES = ['validation', 'ui', 'functional', 'a11y', 'console', 'content', 'responsive', 'state', 'async', 'security', 'calc', 'date']
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const BUG_LEVELS = ['junior', 'semi', 'senior']

// --- witness: el contenido de la semilla permite manifestar el bug ---
const taxWitness = (site) => {
  // Con los 3 primeros productos (los destacados de la home), 1 unidad de cada uno y el cupon del sitio:
  // el impuesto redondeado linea por linea difiere del calculado sobre la base.
  // Los decimales son los de la moneda del pack (el checkout calcula en la unidad menor de esa moneda).
  const base = {
    lines: site.data.catalog.slice(0, 3).map((r) => ({ price: r.price, qty: 1 })), couponPct: site.data.coupon.pct, taxRate: site.data.taxRate,
    decimals: getThemePack(site.themeId).currency.decimals,
  }
  return computeTotals({ ...base, taxPerLine: true }).tax !== computeTotals(base).tax
}
const searchInversionWitness = (site) => {
  // Entre las primeras 9 consultas hay dos consecutivas cuya respuesta se invierte aun escribiendo con ~150 ms entre letras.
  const lat = createLatency({ seed: site.seed })
  return Array.from({ length: 8 }, (_, i) => i + 1).some((n) => lat.latencyMs('search', n) - lat.latencyMs('search', n + 1) > 150)
}
const nthParams = (min) => (rng) => ({ n: min + rng.int(0, min === 3 ? 3 : 2) })

export const BUGS = [
  {
    id: 'email-no-at', category: 'validation', difficulty: 'easy', level: 'junior', pages: FORM_PAGES, requires: ['forms', 'field-email'],
    description: {
      es: 'El campo de email acepta valores sin @ (solo exige 5 caracteres o más).',
      en: 'The email field accepts values without an @ (it only requires 5 or more characters).',
    },
    // template: el texto con el campo REAL del sitio (describeBug); {field} = etiqueta del campo del pack en el idioma activo
    template: {
      es: 'El campo «{field}» (email) acepta valores sin @: solo exige 5 caracteres o más.',
      en: 'The «{field}» field (email) accepts values without an @: it only requires 5 or more characters.',
    },
  },
  {
    id: 'age-off-by-one', category: 'validation', difficulty: 'medium', level: 'semi', pages: ['signup', 'wizard'], requires: ['field-number'],
    description: {
      es: 'Off-by-one en el campo numérico con mínimo: el valor exactamente igual al mínimo es rechazado.',
      en: 'Off-by-one on the numeric field with a minimum: a value exactly equal to the minimum is rejected.',
    },
    template: {
      es: 'Off-by-one en «{field}»: el rango permitido es {min}–{max}, pero el valor exacto {min} es rechazado.',
      en: 'Off-by-one on «{field}»: the allowed range is {min}–{max}, but exactly {min} is rejected.',
    },
  },
  {
    id: 'password-off-by-one', category: 'validation', difficulty: 'medium', level: 'semi', pages: ['signup', 'wizard'], requires: ['field-password'],
    description: {
      es: 'Off-by-one en la contraseña: una de un caracter menos que el mínimo es aceptada.',
      en: 'Off-by-one on password: one with a single character less than the minimum is accepted.',
    },
    template: {
      es: 'Off-by-one en «{field}»: el mínimo es {min} caracteres pero una de {prev} es aceptada.',
      en: 'Off-by-one on «{field}»: the minimum is {min} characters but one of {prev} is accepted.',
    },
  },
  {
    id: 'required-not-validated', category: 'validation', difficulty: 'easy', level: 'junior', pages: FORM_PAGES, requires: ['forms', 'field-name'],
    description: {
      es: 'El campo de nombre está marcado como obligatorio pero se puede enviar vacío.',
      en: 'The name field is marked as required but the form can be submitted with it empty.',
    },
    template: {
      es: 'El campo «{field}» está marcado como obligatorio pero se puede enviar vacío.',
      en: 'The «{field}» field is marked as required but the form can be submitted with it empty.',
    },
  },
  {
    id: 'button-covered', category: 'ui', difficulty: 'medium', level: 'semi', pages: FORM_PAGES, requires: ['forms'], needsBrowser: true,
    excludes: ['double-submit', 'place-order-twice', 'nth-submit-server-error'],
    description: {
      es: 'Una etiqueta promocional tapa la mitad izquierda del botón principal: clickear ahí no hace nada.',
      en: 'A promo sticker covers the left half of the primary button: clicking there does nothing.',
    },
  },
  {
    id: 'text-truncated', category: 'ui', difficulty: 'easy', level: 'junior', pages: ANY_PAGE, needsBrowser: true,
    description: {
      es: 'El texto de la nota debajo del título está cortado por una altura fija.',
      en: 'The note under the heading is cut off by a fixed height.',
    },
  },
  {
    id: 'misaligned', category: 'ui', difficulty: 'easy', level: 'junior', pages: ANY_PAGE, needsBrowser: true,
    description: {
      es: 'El título principal está desalineado respecto del resto del contenido.',
      en: 'The main heading is misaligned with the rest of the content.',
    },
  },
  {
    id: 'low-contrast', category: 'ui', difficulty: 'medium', level: 'semi', pages: ANY_PAGE,
    description: {
      es: 'Las etiquetas y textos de ayuda tienen contraste insuficiente (gris claro sobre blanco).',
      en: 'Labels and helper text have insufficient contrast (light grey on white).',
    },
  },
  {
    id: 'double-submit', category: 'functional', difficulty: 'medium', level: 'semi', pages: ['contact', 'wizard'], requires: ['forms'], groups: ['submit'],
    description: {
      es: 'El botón de enviar no se bloquea: un doble click registra dos envíos.',
      en: 'The submit button is never locked: a double click registers two submissions.',
    },
  },
  {
    id: 'pagination-skips', category: 'functional', difficulty: 'medium', level: 'semi', pages: ['list', 'dashboard'], requires: ['list-pagination'],
    groups: ['list-paging'], excludes: ['filter-lost-on-paginate'],
    description: {
      es: 'La paginación saltea una página: "Siguiente" desde cierta página avanza dos.',
      en: 'Pagination skips a page: "Next" from a certain page advances by two.',
    },
  },
  {
    id: 'filter-not-reset', category: 'functional', difficulty: 'medium', level: 'semi', pages: ['list', 'dashboard'], requires: ['list-filter'], groups: ['list-paging'],
    description: {
      es: '"Limpiar filtros" borra la búsqueda pero deja activo el filtro de categoría/estado.',
      en: '"Clear filters" clears the search but leaves the category/status filter active.',
    },
  },
  {
    id: 'total-wrong', category: 'functional', difficulty: 'medium', level: 'semi', pages: ['checkout', 'dashboard'], excludes: ['tax-rounding-per-line'],
    description: {
      es: 'El total está mal calculado (checkout: ignora la cantidad de la primera línea del carrito cuando es mayor que 1; dashboard: omite la última fila de la página).',
      en: 'The total is miscalculated (checkout: ignores the first cart line quantity when it is greater than 1; dashboard: omits the last row of the page).',
    },
  },
  {
    id: 'missing-label', category: 'a11y', difficulty: 'easy', level: 'junior', pages: LABELED_PAGES, requires: ['forms'],
    description: {
      es: 'Un campo no tiene label asociado ni aria-label (solo placeholder).',
      en: 'One field has no associated label or aria-label (placeholder only).',
    },
  },
  {
    id: 'modal-focus-lost', category: 'a11y', difficulty: 'hard', level: 'senior', pages: ANY_PAGE, requires: ['modal'],
    description: {
      es: 'Al cerrar el modal el foco no vuelve al elemento que lo abrió (se pierde en el body).',
      en: 'Closing the modal does not return focus to the element that opened it (focus is lost on the body).',
    },
  },
  {
    id: 'tab-order', category: 'a11y', difficulty: 'hard', level: 'senior', pages: [...FORM_PAGES, 'list'],
    description: {
      es: 'El orden de tabulación está roto: tabindex positivos hacen que el foco arranque por el botón principal (formularios) o por el buscador (listado de productos).',
      en: 'Tab order is broken: positive tabindex values make focus start on the primary button (forms) or jump to the wrong control (product listing search).',
    },
  },
  {
    id: 'console-error', category: 'console', difficulty: 'medium', level: 'semi', pages: ANY_PAGE, requires: ['modal'],
    description: {
      es: 'Abrir el modal de ayuda lanza un TypeError no capturado en la consola.',
      en: 'Opening the help modal throws an uncaught TypeError in the console.',
    },
  },
  {
    id: 'typo', category: 'content', difficulty: 'easy', level: 'junior', pages: ANY_PAGE,
    description: {
      es: 'El título principal tiene una errata (letras intercambiadas).',
      en: 'The main heading has a typo (swapped letters).',
    },
  },
  {
    id: 'untranslated', category: 'content', difficulty: 'easy', level: 'junior', pages: ANY_PAGE,
    description: {
      es: 'El párrafo de introducción se muestra en el otro idioma (no coincide con el idioma elegido).',
      en: 'The intro paragraph is displayed in the other language (it does not match the selected language).',
    },
  },
  {
    id: 'mobile-overflow', category: 'responsive', difficulty: 'medium', level: 'semi', pages: ANY_PAGE, needsBrowser: true,
    description: {
      es: 'En mobile aparece scroll horizontal: una franja promocional tiene ancho mínimo fijo.',
      en: 'On mobile a horizontal scrollbar appears: a promo strip has a fixed minimum width.',
    },
  },

  // ---------------------------------------------------------------- v2 (TASK-049): 17 bugs nuevos
  // Estado y entre paginas
  {
    id: 'navbar-count-desync', category: 'state', difficulty: 'easy', level: 'junior', pages: ['cart'], requires: ['cart'], crossPage: true,
    excludes: ['nth-add-to-cart-fails'],
    description: {
      es: 'Carrito: agregá dos unidades de un producto desde el listado, abrí el carrito y quitá una (botón «Quitar» o bajando la cantidad): el contador del navbar sigue mostrando el valor anterior mientras estás en el carrito.',
      en: 'Cart page: add two units of a product from the listing, open the cart and remove one («Remove» button or lowering the quantity): the navbar counter keeps showing the old value while you stay on the cart page.',
    },
  },
  {
    id: 'filter-lost-on-paginate', category: 'state', difficulty: 'medium', level: 'junior', pages: ['list'], requires: ['list-filter', 'list-pagination'], crossPage: true,
    groups: ['list-paging'], excludes: ['pagination-skips'],
    witness: (site) => site.data.catalog.length > site.data.list.pageSize, // hay una pagina 2 (con o sin filtro de categoria/precio, el orden tambien se pierde)
    description: {
      es: 'Listado: ordená por precio (o aplicá un filtro de categoría/precio que deje más de una página), andá a la página 2 con «Siguiente» y notá que el orden y los filtros se perdieron: vuelve a mostrar todos los productos en el orden por defecto y la página sigue en 2.',
      en: 'Listing: sort by price (or apply a category/price filter that leaves more than one page), go to page 2 with «Next» and notice the sort and filters are gone: all products are shown again in the default order while the page stays at 2.',
    },
  },
  {
    id: 'cart-loses-item-on-back', category: 'state', difficulty: 'medium', level: 'semi', pages: ['detail'], requires: ['cart', 'detail'], crossPage: true,
    groups: ['cart-missing-item'],
    description: {
      es: 'Detalle de producto: agregá un producto desde su detalle, abrí el carrito, volvé atrás con el botón del navegador y agregá otro producto: al abrir el carrito de nuevo falta el primer ítem.',
      en: 'Product detail: add a product from its detail page, open the cart, go back with the browser button and add another product: when you open the cart again the first item is missing.',
    },
  },
  {
    id: 'protected-deeplink', category: 'state', difficulty: 'medium', level: 'semi', pages: ['account'], requires: ['auth', 'protected-routes'], crossPage: true,
    description: {
      es: 'Cuenta: sin iniciar sesión, abrí directamente la URL de la cuenta (copiala y pegala en una pestaña nueva, con la semilla y el hash #/account): se muestra la cuenta sin pedir login. Navegando desde el menú sí te redirige al login.',
      en: 'Account: without logging in, open the account URL directly (copy it into a new tab, with the seed and the #/account hash): the account is shown without asking for login. Navigating from the menu does redirect you to the login.',
    },
  },
  {
    id: 'stale-detail-on-param-change', category: 'state', difficulty: 'hard', level: 'senior', pages: ['detail'], requires: ['detail'], crossPage: true,
    description: {
      es: 'Detalle de producto: en el detalle tocá un producto de «Productos relacionados»: la URL cambia al otro producto pero la página sigue mostrando el nombre y el precio del anterior hasta recargar o volver al listado.',
      en: 'Product detail: on the detail page click a product under «Related products»: the URL changes to the other product but the page keeps showing the previous name and price until you reload or go back to the listing.',
    },
  },
  // Intermitentes deterministas (solo senior). N sale de bugParams y el contador vive en memoria (se reinicia al recargar).
  {
    id: 'nth-add-to-cart-fails', category: 'functional', difficulty: 'hard', level: 'senior', pages: ['list', 'detail'], requires: ['cart'], crossPage: true, intermittent: true,
    groups: ['cart-missing-item'], excludes: ['navbar-count-desync'], params: nthParams(3),
    witness: (site) => site.data.catalog.length > (site.bugParams?.['nth-add-to-cart-fails']?.n ?? 6) + 1,
    description: {
      es: 'Listado o detalle: la N-ésima vez que agregás un producto al carrito desde esa página (N depende de la semilla, ver «Ubicación») el botón responde con el aviso de éxito, pero el producto no se agrega. Las demás veces funciona. Se reinicia al recargar.',
      en: 'Listing or detail: the N-th time you add a product to the cart from that page (N depends on the seed, see «Location») the button shows the success notice but the product is not added. Every other time it works. It resets on reload.',
    },
  },
  {
    id: 'nth-login-rejected', category: 'functional', difficulty: 'hard', level: 'senior', pages: ['login'], requires: ['auth'], intermittent: true, params: nthParams(2),
    description: {
      es: 'Login: con credenciales correctas, el N-ésimo intento (N depende de la semilla, ver «Ubicación») muestra «Correo o contraseña incorrectos»; reintentar con los mismos datos funciona. Cuentan los intentos con credenciales válidas; se reinicia al recargar.',
      en: 'Login: with correct credentials, the N-th attempt (N depends on the seed, see «Location») shows «Wrong email or password»; retrying with the same data works. Only attempts with valid credentials count; it resets on reload.',
    },
  },
  {
    id: 'nth-submit-server-error', category: 'async', difficulty: 'hard', level: 'senior', pages: FORM_PAGES, requires: ['forms'], intermittent: true, params: nthParams(2),
    groups: ['submit'], excludes: ['button-covered'],
    description: {
      es: 'Formulario de la página asignada (contacto, registro, asistente o checkout): el N-ésimo envío válido (N depende de la semilla, ver «Ubicación») responde con un banner «Error 500» aunque los datos eran correctos; al reenviar funciona. Los datos escritos se conservan. Se reinicia al recargar.',
      en: 'Form on the assigned page (contact, signup, wizard or checkout): the N-th valid submission (N depends on the seed, see «Location») returns an «Error 500» banner although the data was correct; resubmitting works. Typed data is kept. It resets on reload.',
    },
  },
  // Calculo
  {
    id: 'tax-rounding-per-line', category: 'calc', difficulty: 'medium', level: 'semi', pages: ['checkout'], requires: ['checkout', 'tax'], excludes: ['total-wrong'],
    witness: taxWitness,
    description: {
      es: 'Checkout, resumen del pedido: agregá al carrito los tres primeros productos del listado (1 unidad de cada uno), aplicá el cupón de práctica en el paso de envío y compará los impuestos con una calculadora (base imponible × tasa): el impuesto se redondea línea por línea y difiere en unos centavos.',
      en: 'Checkout, order summary: add the first three products of the listing to the cart (1 unit each), apply the practice coupon in the shipping step and compare the tax with a calculator (taxable base × rate): tax is rounded line by line and differs by a few cents.',
    },
  },
  // Fechas
  {
    id: 'date-timezone-shift', category: 'date', difficulty: 'hard', level: 'senior', pages: ['account'], requires: ['register', 'account', 'dates'],
    params: (rng) => ({ tz: rng.pick([-480, -300, -180]) }),
    witness: (site) => site.data.signupFields.some((k) => site.data.fieldMeta[k].type === 'date' && /birth/i.test(k)), // el registro pide la fecha de nacimiento
    description: {
      es: 'Cuenta: registrate cargando la fecha de nacimiento 2000-05-10 y abrí «Mi cuenta»: la fecha de nacimiento aparece un día antes (09/05/2000).',
      en: 'Account: sign up entering the birth date 2000-05-10 and open «My account»: the birth date shows one day earlier (09/05/2000).',
    },
  },
  {
    id: 'relative-time-wrong', category: 'date', difficulty: 'easy', level: 'junior', pages: ['blog'], requires: ['blog-comments'],
    witness: (site) => site.data.posts.some((p) => p.comments.some((c) => c.minutes >= 61)),
    description: {
      es: 'Blog: abrí un post, pestaña Comentarios: un comentario de hace más de una hora (por ejemplo 125 minutos) aparece como «hace 5 min» (muestra solo el resto de dividir por 60).',
      en: 'Blog: open a post, Comments tab: a comment from more than an hour ago (for example 125 minutes) shows as «5 min ago» (it shows only the remainder of dividing by 60).',
    },
  },
  // Asincronia
  {
    id: 'spinner-on-empty-results', category: 'async', difficulty: 'medium', level: 'junior', pages: ['list', 'dashboard'], requires: ['list-search'], excludes: ['stale-response-overwrites'],
    description: {
      es: 'Listado o panel: buscá algo que no existe (por ejemplo «zzzz»): aparece el spinner de carga y nunca desaparece ni se muestra «No hay resultados».',
      en: 'Listing or dashboard: search for something that does not exist (for example «zzzz»): the loading spinner appears and never goes away, and «No results» is not shown.',
    },
  },
  {
    id: 'place-order-twice', category: 'async', difficulty: 'medium', level: 'semi', pages: ['checkout'], requires: ['orders'], crossPage: true,
    groups: ['submit'], excludes: ['button-covered'],
    description: {
      es: 'Checkout, paso de pago: tocá el botón de pagar dos veces seguidas (doble click) y abrí «Mi cuenta → Mis pedidos»: aparecen dos pedidos idénticos y el carrito se vació una sola vez.',
      en: 'Checkout, payment step: press the pay button twice in a row (double click) and open «My account → My orders»: two identical orders are listed and the cart was emptied only once.',
    },
  },
  {
    id: 'stale-response-overwrites', category: 'async', difficulty: 'hard', level: 'senior', pages: ['list'], requires: ['list-search'], excludes: ['spinner-on-empty-results'],
    witness: searchInversionWitness,
    description: {
      es: 'Listado: escribí rápido varias letras seguidas en el buscador (por ejemplo la primera mitad de un nombre y enseguida el resto): a veces los resultados que quedan en pantalla corresponden a la consulta anterior, aunque el campo muestre el texto completo.',
      en: 'Listing: type several letters quickly in the search box (for example the first half of a name and right after the rest): sometimes the results left on screen belong to the previous query even though the field shows the full text.',
    },
  },
  // Accesibilidad avanzada
  {
    id: 'errors-no-aria-live', category: 'a11y', difficulty: 'medium', level: 'semi', pages: FORM_PAGES, requires: ['forms'],
    description: {
      es: 'Formulario de la página asignada: enviá el formulario vacío. Los mensajes de error se ven, pero no se anuncian a un lector de pantalla: sin role="alert" ni aria-live, y los campos con error no tienen aria-invalid ni aria-describedby.',
      en: 'Form on the assigned page: submit the empty form. Error messages are visible but not announced to a screen reader: no role="alert" nor aria-live, and the fields with errors have no aria-invalid nor aria-describedby.',
    },
  },
  // Seguridad de front
  {
    id: 'password-in-url', category: 'security', difficulty: 'medium', level: 'semi', pages: ['login'], requires: ['auth'],
    description: {
      es: 'Login: iniciá sesión con la cuenta de práctica: la URL termina como #/account?email=…&password=… y la contraseña queda visible en la barra de direcciones y en el historial.',
      en: 'Login: log in with the practice account: the URL ends up as #/account?email=…&password=… and the password is visible in the address bar and in the history.',
    },
  },
  {
    id: 'unescaped-comment-html', category: 'security', difficulty: 'hard', level: 'senior', pages: ['blog'], requires: ['blog-comments'], crossPage: true,
    description: {
      es: 'Blog: abrí un post, pestaña Comentarios, y publicá un comentario con marcado inofensivo como <b>hola</b>: se muestra en negrita en vez de como texto, y sigue así al navegar y volver mientras no recargues. El HTML ingresado se renderiza sin escapar (vector de XSS almacenado).',
      en: 'Blog: open a post, Comments tab, and publish a comment with harmless markup such as <b>hello</b>: it is rendered in bold instead of as text, and stays that way after navigating away and back until you reload. Entered HTML is rendered unescaped (stored XSS vector).',
    },
  },
]

// Cierra la relacion `excludes` en ambos sentidos (la declara una sola punta).
for (const b of BUGS) for (const x of b.excludes || []) {
  const other = BUGS.find((o) => o.id === x)
  if (!other) throw new Error(`catalog: excludes desconocido ${x} en ${b.id}`)
  other.excludes = [...new Set([...(other.excludes || []), b.id])]
}

export const BUG_IDS = BUGS.map((b) => b.id)
export const BUG_BY_ID = Object.fromEntries(BUGS.map((b) => [b.id, b]))
