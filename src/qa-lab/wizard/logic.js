// Logica del wizard con validacion condicional (pura, sin Vue).
// spec = { steps: [{ id, fields: [key] }], conditionals: [{ ifField, equals, thenShow, kind: 'field'|'step' }] }
// Un campo o un paso aparece solo si TODAS las condiciones que lo gobiernan se cumplen.
// (Mismo shape que wizard.conditional de los content packs: ifField / equals / thenShow.)
const met = (c, values) => values[c.ifField] === c.equals

export function isShown(spec, kind, key, values) {
  return spec.conditionals.filter((c) => c.kind === kind && c.thenShow === key).every((c) => met(c, values))
}

export function visibleSteps(spec, values) {
  return spec.steps.filter((s) => isShown(spec, 'step', s.id, values))
}

export function visibleFields(spec, step, values) {
  return step.fields.filter((k) => isShown(spec, 'field', k, values))
}
