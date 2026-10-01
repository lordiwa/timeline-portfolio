// Definiciones de campos (independientes del idioma) y nombres de personas.
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
  // wizard: campos condicionales
  isCompany: { type: 'checkbox', required: false },
  company: { type: 'text', required: true },
  frequency: { type: 'select', required: true, options: 3 },
}

export const NAMES = ['Ana', 'Luis', 'Marta', 'Diego', 'Sofia', 'Pablo', 'Lucia', 'Andres', 'Carla', 'Tomas', 'Elena', 'Bruno']
