// Catalogo UNICO de bugs del QA Lab. Los componentes consultan flags (Set de ids activos)
// y el solucionario se arma desde ese mismo Set. No hay bugs fuera de este archivo.

const FORMS = ['signup', 'checkout', 'contact', 'wizard']
const ALL = '*'

export const CATEGORIES = ['validation', 'ui', 'functional', 'a11y', 'console', 'content', 'responsive']
export const DIFFICULTIES = ['easy', 'medium', 'hard']

export const BUGS = [
  {
    id: 'email-no-at', category: 'validation', difficulty: 'easy', templates: FORMS,
    description: {
      es: 'El campo email acepta valores sin @ (solo exige 5 caracteres o más).',
      en: 'The email field accepts values without an @ (it only requires 5 or more characters).',
    },
  },
  {
    id: 'age-off-by-one', category: 'validation', difficulty: 'medium', templates: ['signup', 'wizard'],
    description: {
      es: 'Off-by-one en la edad: con mínimo 18, la edad exacta 18 es rechazada.',
      en: 'Off-by-one on age: with a minimum of 18, exactly 18 is rejected.',
    },
  },
  {
    id: 'password-off-by-one', category: 'validation', difficulty: 'medium', templates: ['signup', 'wizard'],
    description: {
      es: 'Off-by-one en la contraseña: el mínimo es 8 pero una de 7 caracteres es aceptada.',
      en: 'Off-by-one on password: the minimum is 8 but a 7-character password is accepted.',
    },
  },
  {
    id: 'required-not-validated', category: 'validation', difficulty: 'easy', templates: FORMS,
    description: {
      es: 'El campo nombre está marcado como obligatorio pero se puede enviar vacío.',
      en: 'The name field is marked as required but the form can be submitted with it empty.',
    },
  },
  {
    id: 'button-covered', category: 'ui', difficulty: 'medium', templates: FORMS,
    description: {
      es: 'Una etiqueta promocional tapa la mitad izquierda del botón principal: clickear ahí no hace nada.',
      en: 'A promo sticker covers the left half of the primary button: clicking there does nothing.',
    },
  },
  {
    id: 'text-truncated', category: 'ui', difficulty: 'easy', templates: ALL,
    description: {
      es: 'El texto de la nota debajo del título está cortado por una altura fija.',
      en: 'The note under the heading is cut off by a fixed height.',
    },
  },
  {
    id: 'misaligned', category: 'ui', difficulty: 'easy', templates: ALL,
    description: {
      es: 'El título principal está desalineado respecto del resto del contenido.',
      en: 'The main heading is misaligned with the rest of the content.',
    },
  },
  {
    id: 'low-contrast', category: 'ui', difficulty: 'medium', templates: ALL,
    description: {
      es: 'Las etiquetas y textos de ayuda tienen contraste insuficiente (gris claro sobre blanco).',
      en: 'Labels and helper text have insufficient contrast (light grey on white).',
    },
  },
  {
    id: 'double-submit', category: 'functional', difficulty: 'medium', templates: FORMS,
    description: {
      es: 'El botón de enviar no se bloquea: un doble click registra dos envíos.',
      en: 'The submit button is never locked: a double click registers two submissions.',
    },
  },
  {
    id: 'pagination-skips', category: 'functional', difficulty: 'medium', templates: ['products', 'dashboard'],
    description: {
      es: 'La paginación saltea una página: "Siguiente" desde cierta página avanza dos.',
      en: 'Pagination skips a page: "Next" from a certain page advances by two.',
    },
  },
  {
    id: 'filter-not-reset', category: 'functional', difficulty: 'medium', templates: ['products', 'dashboard'],
    description: {
      es: '"Limpiar filtros" borra la búsqueda pero deja activo el filtro de categoría/estado.',
      en: '"Clear filters" clears the search but leaves the category/status filter active.',
    },
  },
  {
    id: 'total-wrong', category: 'functional', difficulty: 'medium', templates: ['checkout', 'dashboard'],
    description: {
      es: 'El total está mal calculado (checkout: ignora la cantidad de la primera línea; dashboard: omite la última fila de la página).',
      en: 'The total is miscalculated (checkout: ignores the first line quantity; dashboard: omits the last row of the page).',
    },
  },
  {
    id: 'missing-label', category: 'a11y', difficulty: 'easy', templates: ALL,
    description: {
      es: 'Un campo no tiene label asociado ni aria-label (solo placeholder).',
      en: 'One field has no associated label or aria-label (placeholder only).',
    },
  },
  {
    id: 'modal-focus-lost', category: 'a11y', difficulty: 'hard', templates: ALL,
    description: {
      es: 'Al cerrar el modal el foco no vuelve al elemento que lo abrió (se pierde en el body).',
      en: 'Closing the modal does not return focus to the element that opened it (focus is lost on the body).',
    },
  },
  {
    id: 'tab-order', category: 'a11y', difficulty: 'hard', templates: [...FORMS, 'products'],
    description: {
      es: 'El orden de tabulación está roto: tabindex positivos hacen que el foco arranque por el botón principal (formularios) o por el buscador (listado de productos).',
      en: 'Tab order is broken: positive tabindex values make focus start on the primary button (forms) or jump to the wrong control (product listing search).',
    },
  },
  {
    id: 'console-error', category: 'console', difficulty: 'medium', templates: ALL,
    description: {
      es: 'Abrir el modal de ayuda lanza un TypeError no capturado en la consola.',
      en: 'Opening the help modal throws an uncaught TypeError in the console.',
    },
  },
  {
    id: 'typo', category: 'content', difficulty: 'easy', templates: ALL,
    description: {
      es: 'El título principal tiene una errata (letras intercambiadas).',
      en: 'The main heading has a typo (swapped letters).',
    },
  },
  {
    id: 'untranslated', category: 'content', difficulty: 'easy', templates: ALL,
    description: {
      es: 'El párrafo de introducción se muestra en el otro idioma (no coincide con el idioma elegido).',
      en: 'The intro paragraph is displayed in the other language (it does not match the selected language).',
    },
  },
  {
    id: 'mobile-overflow', category: 'responsive', difficulty: 'medium', templates: ALL,
    description: {
      es: 'En mobile aparece scroll horizontal: una franja promocional tiene ancho mínimo fijo.',
      en: 'On mobile a horizontal scrollbar appears: a promo strip has a fixed minimum width.',
    },
  },
]

export const BUG_IDS = BUGS.map((b) => b.id)
export const BUG_BY_ID = Object.fromEntries(BUGS.map((b) => [b.id, b]))

export function bugApplies(bug, templateId) {
  return bug.templates === ALL || bug.templates.includes(templateId)
}

export function compatibleBugs(templateId) {
  return BUGS.filter((b) => bugApplies(b, templateId))
}

/** Solucionario: se arma desde el Set de flags activos (misma fuente que consultan los componentes). */
export function bugsFromSet(activeSet) {
  return BUGS.filter((b) => activeSet.has(b.id))
}
