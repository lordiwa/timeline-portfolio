// TASK-047 — generateSite(seed, level): determinismo, rangos por nivel, dependencias de paginas, pool de bugs.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateSite, bugPool } from '../../src/qa-lab/generator/site.js'
import { LEVELS, LEVEL_CONFIG, normalizeLevel } from '../../src/qa-lab/generator/levels.js'
import { PAGE_TYPES, REQUIRES, concretePath, matchPath } from '../../src/qa-lab/generator/pages.js'
import { BUGS, BUG_BY_ID } from '../../src/qa-lab/bugs/catalog.js'

afterEach(() => vi.restoreAllMocks())

const seeds = Array.from({ length: 200 }, (_, i) => `seed-${i}`)

describe('generateSite: determinismo', () => {
  it('(seed, level) reproduce exactamente el mismo sitio y no usa Math.random (evita que un tester no pueda reproducir el bug)', () => {
    const rnd = vi.spyOn(Math, 'random')
    for (const level of LEVELS) {
      for (const s of ['abc123', 'xyz', 'k7m2p9']) {
        expect(JSON.stringify(generateSite(s, level))).toBe(JSON.stringify(generateSite(s, level)))
      }
    }
    expect(rnd).not.toHaveBeenCalled()
  })

  it('el nivel cambia la estructura pero no el mundo: mismo tema y mismos datos en los 3 niveles (evita que cambiar de nivel sea otro sitio)', () => {
    for (const s of seeds.slice(0, 30)) {
      const [a, b, c] = LEVELS.map((l) => generateSite(s, l))
      expect(b.themeId).toBe(a.themeId)
      expect(c.themeId).toBe(a.themeId)
      expect(JSON.stringify(b.data)).toBe(JSON.stringify(a.data))
      expect(JSON.stringify(c.data)).toBe(JSON.stringify(a.data))
    }
    const sets = LEVELS.map((l) => generateSite('abc123', l).pages.length)
    expect(new Set(sets).size).toBe(3)
  })

  it('seeds distintas dan sitios distintos y todos los temas aparecen (evita un sitio repetido)', () => {
    const sites = seeds.map((s) => generateSite(s, 'semi'))
    expect(new Set(sites.map((x) => JSON.stringify(x))).size).toBe(seeds.length)
    expect(new Set(sites.map((x) => x.themeId)).size).toBeGreaterThanOrEqual(6)
  })

  it('un nivel invalido cae en semi (evita una URL ?level=xxx rota)', () => {
    expect(normalizeLevel('xxx')).toBe('semi')
    expect(normalizeLevel(undefined)).toBe('semi')
    expect(generateSite('a', 'xxx').level).toBe('semi')
  })
})

describe('generateSite: paginas', () => {
  it.each(LEVELS)('%s: cantidad de paginas dentro de su rango en 200 semillas, con home siempre (evita un nivel que no escala)', (level) => {
    const [lo, hi] = LEVEL_CONFIG[level].pages
    const counts = new Set()
    for (const s of seeds) {
      const { pages } = generateSite(s, level)
      expect(pages.length).toBeGreaterThanOrEqual(lo)
      expect(pages.length).toBeLessThanOrEqual(hi)
      expect(pages).toContain('home')
      expect(new Set(pages).size).toBe(pages.length)
      counts.add(pages.length)
    }
    expect(counts.size).toBe(hi - lo + 1) // se recorre todo el rango, no un valor fijo
  })

  it('los rangos aprobados son los de Rafael: junior 4-5 / 4-6, semi 6-8 / 7-10, senior 8-12 / 10-16', () => {
    expect(LEVEL_CONFIG.junior).toMatchObject({ pages: [4, 5], bugs: [4, 6] })
    expect(LEVEL_CONFIG.semi).toMatchObject({ pages: [6, 8], bugs: [7, 10] })
    expect(LEVEL_CONFIG.senior).toMatchObject({ pages: [8, 12], bugs: [10, 16] })
  })

  it('las paginas dependientes van siempre juntas (detalle->listado, checkout->carrito->listado, cuenta/registro->login)', () => {
    const seen = {}
    for (const level of LEVELS) {
      for (const s of seeds) {
        const { pages } = generateSite(s, level)
        for (const t of pages) {
          for (const dep of REQUIRES[t] || []) expect(pages, `${t} requiere ${dep}`).toContain(dep)
          seen[t] = true
        }
      }
    }
    expect(Object.keys(seen).sort()).toEqual([...PAGE_TYPES].sort()) // los 13 tipos aparecen alguna vez
  })

  it('las rutas existen: cada pagina del sitio resuelve y una ausente da notfound (evita links muertos en el navbar)', () => {
    const site = generateSite('abc123', 'senior')
    for (const t of site.pages) expect(matchPath(site, concretePath(site, t)).type, t).toBe(t)
    const absent = PAGE_TYPES.find((t) => !site.pages.includes(t))
    if (absent && absent !== 'detail') expect(matchPath(site, concretePath(site, absent)).type).toBe('notfound')
    expect(matchPath(site, '/catalog/99999').type).toBe('notfound')
  })
})

describe('generateSite: bugs', () => {
  it.each(LEVELS)('%s: cantidad de bugs acotada al rango y al pool compatible; alcanza el minimo cuando el pool alcanza (evita un nivel sin bugs)', (level) => {
    const [lo, hi] = LEVEL_CONFIG[level].bugs
    let short = 0
    for (const s of seeds) {
      const site = generateSite(s, level)
      const pool = bugPool(site.pages, level, site.capabilities, site.data).length
      expect(site.bugs.length).toBeLessThanOrEqual(Math.min(hi, pool))
      if (pool >= lo) expect(site.bugs.length).toBeGreaterThanOrEqual(lo)
      else { short += 1; expect(site.bugs.length).toBe(pool) }
      expect(new Set(site.bugs).size).toBe(site.bugs.length)
    }
    // Documentado: con el catalogo actual (19 bugs) solo senior puede quedar corto del minimo por pool.
    if (level !== 'senior') expect(short).toBe(0)
  })

  it('cada bug activo registra una pagina que existe en el sitio y donde el catalogo permite manifestarlo (evita un bug invisible)', () => {
    for (const level of LEVELS) {
      for (const s of seeds) {
        const site = generateSite(s, level)
        expect(Object.keys(site.bugPages).sort()).toEqual([...site.bugs].sort())
        for (const id of site.bugs) {
          expect(site.pages).toContain(site.bugPages[id])
          expect(BUG_BY_ID[id].pages).toContain(site.bugPages[id])
        }
      }
    }
  })

  it('junior no recibe bugs dificiles y senior los prefiere (la sutileza escala con el nivel)', () => {
    const hard = (level) => seeds.reduce((n, s) => n + generateSite(s, level).bugs.filter((id) => BUG_BY_ID[id].difficulty === 'hard').length, 0)
    expect(hard('junior')).toBe(0)
    expect(hard('senior')).toBeGreaterThan(hard('semi'))
  })

  it('el catalogo v2 tiene 36 bugs (19 + 17) con paginas validas (evita un bug que ninguna pagina pueda mostrar)', () => {
    expect(BUGS.length).toBe(36)
    for (const b of BUGS) {
      expect(b.pages.length).toBeGreaterThan(0)
      for (const p of b.pages) expect(PAGE_TYPES).toContain(p)
    }
  })
})
