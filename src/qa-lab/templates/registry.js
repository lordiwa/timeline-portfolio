// Registro de plantillas: SOLO datos y generacion (sin Vue). Cada generate(rng) devuelve
// contenido independiente del idioma (indices/claves); los textos se resuelven en i18n al renderizar.
// Los componentes Vue de cada plantilla viven en ./components.js.

export const FIELD_DEFS = {
  name: { type: 'text', required: true },
  email: { type: 'email', required: true },
  password: { type: 'password', required: true, min: 8 },
  age: { type: 'number', required: true, min: 18, max: 120 },
  birth: { type: 'date', required: false },
  phone: { type: 'text', required: false },
  country: { type: 'select', required: true, options: 4 },
  plan: { type: 'radio', required: true, options: 3 },
  bio: { type: 'textarea', required: false },
  newsletter: { type: 'checkbox', required: false },
  terms: { type: 'checkbox', required: true },
  subject: { type: 'select', required: true, options: 4 },
  message: { type: 'textarea', required: true },
  address: { type: 'text', required: true },
  city: { type: 'text', required: true },
  card: { type: 'text', required: true },
  notes: { type: 'textarea', required: false },
  giftwrap: { type: 'checkbox', required: false },
}

const field = (key) => ({ key, ...FIELD_DEFS[key] })
const fields = (keys) => keys.map(field)

export const NAMES = ['Ana', 'Luis', 'Marta', 'Diego', 'Sofia', 'Pablo', 'Lucia', 'Andres', 'Carla', 'Tomas', 'Elena', 'Bruno']

function genSignup(rng) {
  const extra = rng.sample(['country', 'plan', 'bio', 'birth', 'newsletter'], rng.int(2, 3))
  return { fields: fields(rng.shuffle(['name', 'email', 'password', 'age', 'terms', ...extra])), labelTarget: rng.pick(['name', 'email', 'password', 'age']) }
}

function genCheckout(rng) {
  const extra = rng.sample(['notes', 'newsletter', 'giftwrap'], rng.int(1, 2))
  const itemIdxs = rng.sample([0, 1, 2, 3, 4, 5], rng.int(2, 4))
  const lines = itemIdxs.map((itemIdx, i) => ({
    itemIdx,
    price: rng.int(5, 120),
    qty: i === 0 ? rng.int(2, 3) : rng.int(1, 3), // la 1a linea siempre qty>=2 (el bug total-wrong la necesita)
  }))
  return {
    fields: fields(rng.shuffle(['name', 'email', 'address', 'city', 'card', ...extra])),
    lines,
    taxRate: rng.pick([7, 10, 16, 21]),
    labelTarget: rng.pick(['name', 'address', 'city', 'card']),
  }
}

function genContact(rng) {
  const extra = rng.chance(0.6) ? ['phone'] : []
  return { fields: fields(rng.shuffle(['name', 'email', 'subject', 'message', ...extra])), labelTarget: rng.pick(['name', 'subject', 'message']) }
}

function genWizard(rng) {
  const steps = [
    rng.shuffle(['name', 'email']),
    rng.shuffle(['password', 'age']),
    rng.shuffle(['plan', 'country', 'terms']),
  ]
  return { steps: steps.map(fields), labelTarget: rng.pick(['name', 'password', 'country']) }
}

function genListing(rng, kind) {
  const pageSize = rng.pick(kind === 'products' ? [4, 6, 8] : [4, 5, 6])
  const count = pageSize * rng.int(4, 6)
  const rows = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    itemIdx: rng.int(0, 5),
    variant: rng.int(1, 99),
    price: rng.int(5, 480),
    cat: rng.int(0, 2),
    person: rng.pick(NAMES),
  }))
  return { rows, pageSize, skipAt: rng.int(1, 2), cols: rng.pick([2, 3, 4]), labelTarget: 'search' }
}

function genArticle(rng) {
  return {
    paragraphs: rng.sample([0, 1, 2, 3, 4, 5, 6, 7], 4),
    comments: Array.from({ length: rng.int(3, 6) }, () => ({
      author: rng.pick(NAMES),
      textIdx: rng.int(0, 7),
      minutes: rng.int(2, 600),
    })),
    labelTarget: 'comment',
  }
}

function genFaq(rng) {
  return {
    questions: rng.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 6),
    multiple: rng.chance(0.5),
    openFirst: rng.chance(0.5),
    labelTarget: 'search',
  }
}

export const TEMPLATES = [
  { id: 'signup', generate: genSignup },
  { id: 'checkout', generate: genCheckout },
  { id: 'contact', generate: genContact },
  { id: 'wizard', generate: genWizard },
  { id: 'products', generate: (rng) => genListing(rng, 'products') },
  { id: 'article', generate: genArticle },
  { id: 'faq', generate: genFaq },
  { id: 'dashboard', generate: (rng) => genListing(rng, 'dashboard') },
]

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id)
