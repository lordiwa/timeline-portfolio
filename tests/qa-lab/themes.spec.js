// TASK-048 — content packs de temas del QA Lab. Cada spec nombra el dano que previene.
import { describe, it, expect } from 'vitest'
import { THEME_PACKS, getThemePack, validateTheme, FAMILIES } from '../../src/qa-lab/themes/index.js'

// Recorre cualquier valor del tema y devuelve [ruta, texto] de cada string.
function walkStrings(value, path = '', out = []) {
  if (typeof value === 'string') out.push([path, value])
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, out))
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkStrings(v, path ? `${path}.${k}` : k, out)
  return out
}

// Recorre los campos de formulario de un tema (registro y wizard).
const allFields = (t) => [...t.signupFields, ...t.wizardFields]

const BANNED = [
  'Federation', 'Federación Unida', 'Star Trek', 'Starfleet', 'Hogwarts', 'Gringotts', 'Jedi', 'Sith', 'Pokémon', 'Pokemon',
  'Pikachu', 'Hobbit', 'Tolkien', 'Gandalf', 'Mordor', 'Muggle', 'Quidditch', 'Dumbledore', 'Skywalker', 'Wookiee', 'Klingon',
  'Dalek', 'Tardis', 'Disney', 'Marvel', 'Pixar', 'Nintendo', 'Zelda', 'Netflix', 'Amazon', 'Google', 'Microsoft', 'Hotmail',
  'Coca-Cola', 'Nike', 'Starbucks', 'McDonald', 'Lego', 'Barbie', 'Narnia', 'Westeros', 'Dungeons', 'Warhammer', 'Harry Potter',
  'Star Wars', 'Betamax', 'Tesla', 'Uber',
]
const bannedRe = (term) => new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu')

describe('QA Lab content packs de temas (TASK-048)', () => {
  // AC1. Previene: un registro corto o con ids repetidos haria que dos semillas distintas cayeran en el mismo tema o que la familia quedara pobre.
  it('hay 60 o mas temas, ids unicos y al menos 12 por familia', () => {
    expect(THEME_PACKS.length).toBeGreaterThanOrEqual(60)
    const ids = THEME_PACKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const fam of FAMILIES) expect(THEME_PACKS.filter((t) => t.family === fam).length, fam).toBeGreaterThanOrEqual(12)
    expect(getThemePack(ids[0])).toBe(THEME_PACKS[0])
    expect(getThemePack('no-existe')).toBeUndefined()
  })

  // AC1. Previene: que un tema salga con una clave faltante o un texto vacio en es o en y rompa la pagina generada en ese idioma.
  it('validateTheme no devuelve errores y todo texto bilingue tiene es y en no vacios', () => {
    for (const t of THEME_PACKS) expect(validateTheme(t), t.id).toEqual([])
    // Cobertura independiente del validador: todo objeto con es o en tiene ambos llenos.
    const check = (v, path) => {
      if (Array.isArray(v)) return v.forEach((x, i) => check(x, `${path}[${i}]`))
      if (!v || typeof v !== 'object') return
      if ('es' in v || 'en' in v) {
        expect(typeof v.es === 'string' && v.es.trim().length > 0, `${path}.es`).toBe(true)
        expect(typeof v.en === 'string' && v.en.trim().length > 0, `${path}.en`).toBe(true)
      }
      for (const [k, x] of Object.entries(v)) check(x, `${path}.${k}`)
    }
    for (const t of THEME_PACKS) check(t, t.id)
  })

  // AC3. Previene: que una regex invalida rompa el formulario en tiempo de ejecucion, o que el usuario vea un error sin saber el formato esperado.
  it('todo pattern compila como RegExp y trae patternHint, y cada tema tiene un campo con pattern', () => {
    for (const t of THEME_PACKS) {
      const withPattern = allFields(t).filter((f) => f.rules.pattern !== undefined)
      expect(withPattern.length, `${t.id} sin ningun pattern`).toBeGreaterThan(0)
      for (const f of withPattern) {
        expect(() => new RegExp(f.rules.pattern), `${t.id}.${f.key}`).not.toThrow()
        expect(f.rules.patternHint?.es?.length, `${t.id}.${f.key} sin hint es`).toBeGreaterThan(0)
        expect(f.rules.patternHint?.en?.length, `${t.id}.${f.key} sin hint en`).toBeGreaterThan(0)
      }
      expect(t.signupFields.some((f) => f.type === 'email')).toBe(true)
      expect(t.signupFields.some((f) => f.type === 'password')).toBe(true)
    }
  })

  // AC3. Previene: que el wizard apunte a un campo inexistente y el motor lo renderice vacio o lance una excepcion.
  it('los fieldKeys del wizard y conditional.ifField/thenShow existen en wizardFields', () => {
    for (const t of THEME_PACKS) {
      const keys = new Set(t.wizardFields.map((f) => f.key))
      for (const step of t.wizard.steps) for (const k of step.fieldKeys) expect(keys.has(k), `${t.id} paso -> ${k}`).toBe(true)
      expect(keys.has(t.wizard.conditional.ifField), `${t.id} ifField`).toBe(true)
      for (const k of t.wizard.conditional.thenShow) expect(keys.has(k), `${t.id} thenShow -> ${k}`).toBe(true)
    }
  })

  // AC2. Previene: publicar marcas o franquicias reales (riesgo legal y de imagen) en cualquier texto de cualquier tema.
  it('ningun texto de ningun tema contiene marcas o franquicias reales prohibidas', () => {
    const hits = []
    for (const t of THEME_PACKS) {
      for (const [path, text] of walkStrings(t, t.id)) {
        for (const term of BANNED) if (bannedRe(term).test(text)) hits.push(`${path}: "${term}"`)
      }
    }
    expect(hits).toEqual([])
  })

  // Pedido de contenido. Previene: relleno copiado entre temas (el mismo nombre de item, pregunta o titulo en dos temas) que haria que los sitios parezcan iguales.
  it('no hay nombres de item, preguntas de FAQ ni titulos de blog repetidos entre temas', () => {
    const seen = new Map()
    const dups = []
    for (const t of THEME_PACKS) {
      const texts = [t.name.en, ...t.items.map((i) => i.name.en), ...t.faq.map((q) => q.q.en), ...t.posts.map((p) => p.title.en)]
      for (const text of texts) {
        const key = text.toLowerCase()
        if (seen.has(key) && seen.get(key) !== t.id) dups.push(`"${text}" en ${seen.get(key)} y ${t.id}`)
        seen.set(key, t.id)
      }
    }
    expect(dups).toEqual([])
  })
})
