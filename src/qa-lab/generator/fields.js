// Definiciones de campos y nombres de personas.
// Los formularios de signup y wizard usan los campos del PACK del tema (rules: min/max/minLength/maxLength/pattern).
// Los formularios de contacto, checkout y cuenta usan estos campos GENERICOS (el pack no define su lista), salvo
// email/password (se toman del pack, ver fieldDef) y el asunto del contacto (pack.contactSubjects).
export const FIELD_DEFS = {
  name: { type: 'text', required: true },
  email: { type: 'email', required: true },
  password: { type: 'password', required: true, rules: { minLength: 8 } },
  phone: { type: 'text', required: false },
  subject: { type: 'select', required: true },
  message: { type: 'textarea', required: true },
  address: { type: 'text', required: true },
  city: { type: 'text', required: true },
  card: { type: 'text', required: true },
  notes: { type: 'textarea', required: false },
  newsletter: { type: 'checkbox', required: false },
  giftwrap: { type: 'checkbox', required: false },
  terms: { type: 'checkbox', required: true },
}

export const NAMES = ['Ana', 'Luis', 'Marta', 'Diego', 'Sofia', 'Pablo', 'Lucia', 'Andres', 'Carla', 'Tomas', 'Elena', 'Bruno']

/**
 * Definicion de un campo para un pack. Los campos del pack (signupFields y wizardFields) tienen prioridad sobre los
 * genericos de igual clave (email y password incluidos: el generico toma las reglas del pack). La etiqueta de los
 * genericos sale de i18n `fields.<key>`. Devuelve { key, type, required, rules, label?, options? } o undefined.
 */
export function fieldDef(pack, key) {
  const own = pack.signupFields.find((f) => f.key === key) || pack.wizardFields.find((f) => f.key === key)
  if (own) return own
  const def = FIELD_DEFS[key]
  if (!def) return undefined
  if (key === 'subject') return { key, ...def, rules: {}, options: pack.contactSubjects.map((s, i) => ({ value: String(i), ...s })) }
  return { key, ...def, rules: def.rules || {} }
}

/** Primer campo de texto obligatorio y sin patron de una lista de campos del pack: es el "nombre" del formulario. */
export const nameLikeKey = (fields) => fields.find((f) => f.type === 'text' && f.required && !f.rules.pattern)?.key

/** Metadatos de un campo para el generador (no dependen del idioma). nameLike = el campo que 'required-not-validated' afecta. */
export function fieldMeta(pack, key) {
  const def = fieldDef(pack, key)
  const nameLike = key === 'name' || key === nameLikeKey(pack.signupFields) || key === nameLikeKey(pack.wizardFields)
  return { type: def.type, required: def.required, nameLike }
}
