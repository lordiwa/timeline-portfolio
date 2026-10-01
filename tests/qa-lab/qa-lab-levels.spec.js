// TASK-049 — el nivel filtra el pool, los rangos y cuotas por dificultad se respetan, las incompatibilidades no se
// co-activan, los witness garantizan que cada bug es manifestable y agregar bugs no mueve el mundo de una semilla.
import { describe, it, expect } from 'vitest'
import { BUGS, BUG_BY_ID, BUG_LEVELS, CATEGORIES, DIFFICULTIES } from '../../src/qa-lab/bugs/catalog.js'
import { generateSite, bugPool, genBugParams } from '../../src/qa-lab/generator/site.js'
import { LEVELS, LEVEL_CONFIG, levelRank } from '../../src/qa-lab/generator/levels.js'
import { GROUP_MAX, compatible, violations } from '../../src/qa-lab/generator/compat.js'
import { requiresMet } from '../../src/qa-lab/generator/capabilities.js'
import { hashString } from '../../src/qa-lab/generator/prng.js'

const seeds = (n) => Array.from({ length: n }, (_, i) => `seed-${i}`)
const S200 = seeds(200)
const S500 = seeds(500)
const meta = (ids) => ids.map((id) => BUG_BY_ID[id])
const count = (list, pred) => list.filter(pred).length
const CAPS = ['list', 'list-search', 'list-filter', 'list-sort', 'list-pagination', 'detail', 'cart', 'checkout', 'coupon', 'shipping', 'tax',
  'auth', 'register', 'protected-routes', 'account', 'orders', 'contact', 'faq', 'dashboard', 'blog-comments', 'wizard', 'wizard-conditional',
  'dates', 'modal', 'mobile-nav', 'forms']

describe('catalogo v2: metadatos y totales de la spec', () => {
  it('36 bugs con id unico; cada uno con categoria, dificultad, nivel, paginas validas y requires conocidos (evita un bug que ningun sitio pueda activar)', () => {
    expect(BUGS).toHaveLength(36)
    expect(new Set(BUGS.map((b) => b.id)).size).toBe(36)
    for (const b of BUGS) {
      expect(CATEGORIES, b.id).toContain(b.category)
      expect(DIFFICULTIES, b.id).toContain(b.difficulty)
      expect(BUG_LEVELS, b.id).toContain(b.level)
      expect(b.pages.length, b.id).toBeGreaterThan(0)
      for (const r of b.requires || []) expect(CAPS, `${b.id} requires ${r}`).toContain(r)
      for (const g of b.groups || []) expect(Object.keys(GROUP_MAX), `${b.id} grupo ${g}`).toContain(g)
      for (const x of b.excludes || []) expect((BUG_BY_ID[x].excludes || []), `${b.id} <-> ${x} simetrica`).toContain(b.id)
    }
  })

  it('totales de la spec: por nivel 11/16/9, por dificultad 9/18/9, 8 entre paginas, 3 intermitentes y todos los hard son senior', () => {
    expect(BUG_LEVELS.map((l) => count(BUGS, (b) => b.level === l))).toEqual([11, 16, 9])
    expect(DIFFICULTIES.map((d) => count(BUGS, (b) => b.difficulty === d))).toEqual([9, 18, 9])
    expect(count(BUGS, (b) => b.crossPage)).toBe(8)
    expect(BUGS.filter((b) => b.intermittent).map((b) => b.id).sort()).toEqual(['nth-add-to-cart-fails', 'nth-login-rejected', 'nth-submit-server-error'])
    for (const b of BUGS.filter((x) => x.difficulty === 'hard')) expect(b.level, b.id).toBe('senior')
    for (const b of BUGS.filter((x) => x.intermittent)) { expect(b.level).toBe('senior'); expect(b.params).toBeTypeOf('function') }
    const byCat = Object.fromEntries(CATEGORIES.map((c) => [c, count(BUGS, (b) => b.category === c)]))
    expect(byCat).toEqual({ validation: 4, ui: 4, functional: 6, a11y: 4, console: 1, content: 2, responsive: 1, state: 5, async: 4, security: 2, calc: 1, date: 2 })
  })
})

describe('el nivel filtra el pool', () => {
  it('junior nunca recibe un bug de nivel semi o senior y semi nunca uno senior, en 200 semillas por nivel (evita un junior con bugs dificiles de encontrar)', () => {
    for (const s of S200) {
      for (const level of ['junior', 'semi']) {
        const site = generateSite(s, level)
        for (const id of site.bugs) expect(levelRank(BUG_BY_ID[id].level), `${s} ${level} ${id}`).toBeLessThanOrEqual(levelRank(level))
      }
    }
  })

  it('el pool de un nivel esta incluido en el del siguiente para el mismo sitio (senior contiene semi contiene junior)', () => {
    const site = generateSite('pool-1', 'senior')
    const pool = (level) => bugPool(site.pages, level, site.capabilities, site).map((b) => b.id)
    for (const id of pool('junior')) expect(pool('semi')).toContain(id)
    for (const id of pool('semi')) expect(pool('senior')).toContain(id)
    for (const id of pool('junior')) expect(BUG_BY_ID[id].level).toBe('junior')
  })

  it('los intermitentes solo aparecen en senior y todo bug activo cumple sus requisitos en una pagina del sitio donde puede vivir', () => {
    for (const level of LEVELS) {
      for (const s of S200) {
        const site = generateSite(s, level)
        for (const id of site.bugs) {
          const b = BUG_BY_ID[id]
          if (b.intermittent) expect(level, `${s} ${id}`).toBe('senior')
          expect(requiresMet(b, site.capabilities), `${s} ${level} ${id}`).toBe(true)
          expect(b.pages).toContain(site.bugPages[id])
          expect(site.pages).toContain(site.bugPages[id])
        }
      }
    }
  })
})

describe('rangos y cuotas por nivel (200 semillas por nivel)', () => {
  it.each(LEVELS)('%s: la cantidad de bugs cae en el rango aprobado y el pool compatible alcanza el minimo (evita niveles sin bugs o con demasiados)', (level) => {
    const [lo, hi] = LEVEL_CONFIG[level].bugs
    const seen = new Set()
    for (const s of S200) {
      const site = generateSite(s, level)
      expect(site.bugs.length, `${s}`).toBeGreaterThanOrEqual(lo)
      expect(site.bugs.length, `${s}`).toBeLessThanOrEqual(hi)
      expect(bugPool(site.pages, level, site.capabilities, site).length, `pool ${s}`).toBeGreaterThanOrEqual(lo)
      seen.add(site.bugs.length)
    }
    expect(seen.size).toBe(hi - lo + 1) // se recorre todo el rango
  })

  it('los rangos son los aprobados: junior 4-6, semi 7-10, senior 10-16 bugs', () => {
    expect(LEVELS.map((l) => LEVEL_CONFIG[l].bugs)).toEqual([[4, 6], [7, 10], [10, 16]])
  })

  it('cuotas por dificultad, entre paginas e intermitentes segun la tabla de la spec (seccion 6)', () => {
    const q = { junior: { easy: [3, 4], medium: [1, 2], hard: [0, 0] }, semi: { easy: [1, 3], medium: [5, 8], hard: [0, 0] }, senior: { easy: [1, 3], medium: [4, 7], hard: [4, 6] } }
    for (const level of LEVELS) {
      for (const s of S200) {
        const bugs = meta(generateSite(s, level).bugs)
        for (const d of DIFFICULTIES) {
          const n = count(bugs, (b) => b.difficulty === d)
          expect(n, `${level} ${s} ${d}`).toBeGreaterThanOrEqual(q[level][d][0])
          expect(n, `${level} ${s} ${d}`).toBeLessThanOrEqual(q[level][d][1])
        }
        const cross = count(bugs, (b) => b.crossPage)
        const inter = count(bugs, (b) => b.intermittent)
        if (level === 'junior') { expect(cross).toBeLessThanOrEqual(1); expect(inter).toBe(0) }
        if (level === 'semi') { expect(cross).toBeGreaterThanOrEqual(1); expect(inter).toBe(0) }
        if (level === 'senior') { expect(cross).toBeGreaterThanOrEqual(3); expect(inter).toBeGreaterThanOrEqual(1); expect(inter).toBeLessThanOrEqual(2) }
      }
    }
  })

  it('el witness de cada bug activo da true en su sitio (el contenido permite manifestarlo, R-7)', () => {
    let checked = 0
    for (const level of LEVELS) {
      for (const s of S200) {
        const site = generateSite(s, level)
        for (const id of site.bugs) {
          if (!BUG_BY_ID[id].witness) continue
          expect(BUG_BY_ID[id].witness(site), `${level} ${s} ${id}`).toBe(true)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})

describe('incompatibilidades (500 semillas por nivel)', () => {
  it.each(LEVELS)('%s: ningun sitio contiene un par prohibido ni excede el maximo de un grupo (evita bugs que se enmascaran entre si)', (level) => {
    for (const s of S500) expect(violations(meta(generateSite(s, level).bugs)), `${level} ${s}`).toEqual([])
  })

  it('la tabla de la seccion 5 esta cargada: cada par y grupo prohibido se detecta y el mismo sitio sin ellos es valido', () => {
    const pairs = [
      ['button-covered', 'double-submit'], ['button-covered', 'place-order-twice'], ['button-covered', 'nth-submit-server-error'],
      ['double-submit', 'place-order-twice'], ['double-submit', 'nth-submit-server-error'], ['place-order-twice', 'nth-submit-server-error'],
      ['cart-loses-item-on-back', 'nth-add-to-cart-fails'], ['navbar-count-desync', 'nth-add-to-cart-fails'],
      ['total-wrong', 'tax-rounding-per-line'], ['pagination-skips', 'filter-lost-on-paginate'], ['spinner-on-empty-results', 'stale-response-overwrites'],
    ]
    for (const [a, b] of pairs) {
      expect(violations(meta([a, b])), `${a} x ${b}`).not.toEqual([])
      expect(compatible(meta([a]), BUG_BY_ID[b]), `${a} -> ${b}`).toBe(false)
      expect(compatible(meta([b]), BUG_BY_ID[a]), `${b} -> ${a}`).toBe(false)
    }
    expect(violations(meta(['pagination-skips', 'filter-not-reset']))).toEqual([]) // grupo list-paging: hasta 2
    expect(violations(meta(['pagination-skips', 'filter-not-reset', 'filter-lost-on-paginate']))).not.toEqual([])
    expect(violations(meta(['email-no-at', 'typo', 'tax-rounding-per-line']))).toEqual([]) // control: lo compatible no se marca
  })
})

describe('bugParams y determinismo del sub-stream', () => {
  it('N de los intermitentes sale de la semilla: igual entre niveles y entre llamadas, y recorre 3..6 (add) y 2..4 (login, envio)', () => {
    const ns = { 'nth-add-to-cart-fails': new Set(), 'nth-login-rejected': new Set(), 'nth-submit-server-error': new Set() }
    for (const s of S200) {
      const a = generateSite(s, 'senior').bugParams
      expect(JSON.stringify(generateSite(s, 'junior').bugParams)).toBe(JSON.stringify(a)) // no depende del nivel ni de los bugs activos
      expect(JSON.stringify(genBugParams(s))).toBe(JSON.stringify(a))
      for (const id of Object.keys(ns)) ns[id].add(a[id].n)
      expect([-480, -300, -180]).toContain(a['date-timezone-shift'].tz)
    }
    expect([...ns['nth-add-to-cart-fails']].sort()).toEqual([3, 4, 5, 6])
    expect([...ns['nth-login-rejected']].sort()).toEqual([2, 3, 4])
    expect([...ns['nth-submit-server-error']].sort()).toEqual([2, 3, 4])
  })

  it('el contenido y el set de paginas de una semilla son los de master: agregar bugs al catalogo no los cambia (evita romper URLs ya compartidas)', () => {
    // hash de {tema, marca, estilo, paginas, zona, datos} calculado con el generador de master (HEAD 289a2a8, 19 bugs) para 12 semillas x 3 niveles.
    const golden = {
      junior: [2945134260, 3900698150, 295950636, 256685534, 891019674, 919004786, 3704695666, 1463159026, 3377962934, 1535913495, 191951392, 2028718960],
      semi: [234784504, 2395101046, 1951546084, 1568245747, 1709332856, 2127892909, 1479088793, 2317072201, 4172156713, 3926208885, 1484157440, 3489845283],
      senior: [2970876345, 2201462182, 3123497695, 2729594857, 1496666327, 4212097641, 3117390458, 1552677699, 4261652385, 581773446, 3416365062, 2770622996],
    }
    for (const level of LEVELS) {
      golden[level].forEach((h, i) => {
        const s = generateSite(`golden-${i}`, level)
        expect(hashString(JSON.stringify({ themeId: s.themeId, brandIdx: s.brandIdx, style: s.style, pages: s.pages, tz: s.tzOffsetMinutes, data: s.data })), `${level} golden-${i}`).toBe(h)
      })
    }
  })
})
