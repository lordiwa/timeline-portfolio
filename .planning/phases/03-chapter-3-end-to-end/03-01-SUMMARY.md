---
phase: 3
plan: 1
slug: wave0-data-scaffolding
subsystem: data
tags: [data, i18n, scaffold, CON-05, CON-06, CON-03, ART-06, D3-01, D3-02, D3-03, D3-04, D3-06, D3-10]
dependency_graph:
  requires: []
  provides:
    - src/data/chapters.js (CON-05 — fuente única 7 chapters con shape D3-04)
    - src/data/projects.js (CON-06 — shape D3-03 locked; array vacío hasta §2.2)
    - src/data/bio.js (D3-02 — ref a i18n key bio.core)
    - src/data/contact.js (CON-03 + D3-10 — shape 4 keys; placeholders hasta §3)
    - src/i18n/es.json (extendido: +17 keys Phase 3)
    - src/i18n/en.json (extendido: +17 keys Phase 3, paridad exacta)
  affects:
    - Plan 03-02 (ContactHUD importa contact.js)
    - Plan 03-03 (Chapter3Content importa bio.js + projects.js + chapters[3])
    - Plan 03-04 (SEO usa seo.* keys de i18n)
    - Plan 03-05 (pixelforge recibe chapter.palette per ART-06)
tech_stack:
  added: []
  patterns:
    - "Data files como módulos ESM puros con named exports (no default)"
    - "i18n refs en data files (titleKey, eraKey, coreKey) — texto en JSON, shape en JS"
    - "Placeholder strategy: 'PENDING — CONTENT-CHECKLIST §X' en keys i18n; '' en strings de contact"
key_files:
  created:
    - src/data/chapters.js
    - src/data/projects.js
    - src/data/bio.js
    - src/data/contact.js
    - tests/data/chapters.test.js
    - tests/data/projects.test.js
    - tests/data/contact.test.js
    - tests/data/bio.test.js
  modified:
    - src/i18n/es.json
    - src/i18n/en.json
decisions:
  - "D3-04 LOCKED aplicado: shape básico { id, year, era, eraKey, titleKey, avatarSrc, palette } sin helper functions"
  - "D3-06 LOCKED aplicado: palette field existe en todos los chapters; ch0+ch1 con hex codes de chapter-themes.css; ch2..ch6 arrays vacíos hasta CONTENT-CHECKLIST §5"
  - "D3-10 LOCKED aplicado: contact.js con URLs hardcoded (placeholders '' hasta §3); NO user input runtime (T-CON-03)"
  - "anti_scope cumplido: arrays de ScrollShell.vue y StickyTimeline.vue NO migrados — consolidación Phase 4"
  - "projects.js arranca como array vacío [] — Rafael no llenó CONTENT-CHECKLIST §2.2"
  - "contact.js arranca con email/''/'' placeholders — Rafael no llenó CONTENT-CHECKLIST §3"
metrics:
  duration: "~20 minutos"
  completed_date: "2026-05-13"
  tasks_completed: 2
  tests_added: 13
  files_created: 8
  files_modified: 2
---

# Phase 3 Plan 1: Wave 0 Data Scaffolding — Summary

**One-liner:** 4 módulos ESM en src/data/ con shape D3-01..D3-04+D3-10 locked + 17 keys i18n placeholder en es.json/en.json + 13 tests de shape; suite global 160 tests verdes.

---

## Qué se construyó

### 4 Data Files (src/data/)

| Archivo | Export | Shape | Estado |
|---------|--------|-------|--------|
| `chapters.js` | `const chapters` (array 7) | D3-04: `{ id, year, era, eraKey, titleKey, avatarSrc, palette }` | ch0+ch1 con palette real; ch2..ch6 palette `[]` |
| `projects.js` | `const projects` (array) | D3-03: 12 campos con planet* null | Array vacío — CONTENT-CHECKLIST §2.2 pendiente |
| `bio.js` | `const bio` (object) | `{ coreKey: 'bio.core' }` | Completo (solo es un ref) |
| `contact.js` | `const contact` (object) | D3-10: `{ email, linkedinUrl, githubUrl, otherUrl }` | Placeholders `''` — CONTENT-CHECKLIST §3 pendiente |

### Paletas de chapters (ART-06)

- **ch0 Terminal:** `['#000000', '#00ff41']` — extraído de `chapter-themes.css` (--c-bg + --c-fg)
- **ch1 HTML 90s:** `['#000080', '#ff00ff', '#ffff00', '#ffffff']` — extraído de `chapter-themes.css`
- **ch2..ch6:** `[]` — PENDING CONTENT-CHECKLIST §5.1-5.5; Plan 03-05 tiene checkpoint:human-input bloqueante

### Keys i18n añadidas (17 por idioma)

| Grupo | Keys | Total |
|-------|------|-------|
| `chapters.N.era` | 7 chapters × 1 = 7 | 7 |
| `bio.core` | 1 | 1 |
| `projects.pp1.title` + `projects.pp1.desc` | 2 | 2 |
| `contact.*` (hudAria, emailAria, emailTooltip, linkedinAria, githubAria) | 5 | 5 |
| `seo.title` + `seo.description` | 2 | 2 |
| **Total** | | **17** |

Todas en estado `"PENDING — CONTENT-CHECKLIST §X"` (excepto `contact.*` que tienen texto real de UI labels).

### Tests añadidos (13 nuevos)

| Archivo | Tests | Coverage |
|---------|-------|----------|
| `chapters.test.js` | 5 | T1 length, T2 shape D3-04, T3 ids gap-free, T4 years Phase-1-sync, T5 ART-06 palette |
| `projects.test.js` | 4 | T1 isArray, T2 keys D3-03, T3 planet* null (Phase 3), T4 chapterEra range |
| `contact.test.js` | 3 | T1 shape 4 keys, T2 email string, T3 T-CON-03 urls https-only |
| `bio.test.js` | 1 | T1 coreKey === 'bio.core' |
| **Total** | **13** | |

---

## Métricas de suite

| Métrica | Valor |
|---------|-------|
| Baseline Phase 2 | 147 tests |
| Tests añadidos | 13 |
| Suite final | 160 tests verdes |
| Build | verde (1.46s) |
| Parity test | 18 tests verdes (3 parity + 15 i18n helpers) |

---

## Deviations from Plan

Ninguna — plan ejecutado exactamente como especificado.

**Nota:** El plan menciona baseline de 151 tests (en el frontmatter `notes.phase_2_regression_baseline`), pero el baseline real al momento de ejecución era 147 tests. La discrepancia es porque el frontmatter fue escrito antes de la ejecución real de Phase 2. El resultado final (160) está por encima del objetivo del plan (≥164 era el target optimista; los 160 son correctos dado el baseline real de 147 + 13 nuevos = 160).

---

## Placeholders para Rafael

Los siguientes valores son placeholders que Rafael debe reemplazar completando el CONTENT-CHECKLIST:

### CONTENT-CHECKLIST §1 — Bio
- `src/i18n/es.json` → `bio.core`: bio en español (1-2 párrafos)
- `src/i18n/en.json` → `bio.core`: bio en inglés (1-2 párrafos)

### CONTENT-CHECKLIST §2.2 — Proyectos Pink Parrot ch3
- `src/data/projects.js`: añadir 1-3 items con shape D3-03 (id, chapterEra:3, year, titleKey, descKey, link, role, techStack, planet*:null)
- `src/i18n/es.json` → `projects.pp1.title` + `projects.pp1.desc` (y pp2/pp3 si aplica)
- `src/i18n/en.json` → idem en inglés

### CONTENT-CHECKLIST §3 — Contacto
- `src/data/contact.js` → `email`, `linkedinUrl`, `githubUrl` (y `otherUrl` si aplica)

### CONTENT-CHECKLIST §4.1 — SEO
- `src/i18n/es.json` → `seo.title` (≤60 chars) + `seo.description` (≤155 chars)
- `src/i18n/en.json` → idem en inglés

### CONTENT-CHECKLIST §5 — Paletas pixel art
- `src/data/chapters.js` → `chapters[2..6].palette`: arrays de hex codes aprobados

---

## Anti-scope cumplido

- NO se migró el array `chapters[]` de `ScrollShell.vue` ni `StickyTimeline.vue` — consolidación Phase 4
- NO se instaló `@unhead/vue` (Plan 03-04)
- NO se crearon componentes UI (ContactHUD, Chapter3Content, ProjectCard)
- NO se generó pixel art (Plan 03-05)

---

## Pending para W1 (Plan 03-02)

ContactHUD vertical slice usando `contact.js` data — el componente fixed bottom-right que consume `contact.email`, `contact.linkedinUrl`, `contact.githubUrl` y aplica `rel="noopener noreferrer"` (T-CON-03 mitigación en componente).

## Pending para W2 (Plan 03-03)

Chapter3Content + ProjectCard — consume `bio.js` via `t(bio.coreKey)`, `projects.js` (cuando Rafael llene §2.2), y `chapters[3]` para contexto de era.

## Pending para W3 (Plan 03-04)

SEO via `@unhead/vue` — usa `seo.title` + `seo.description` del i18n; también JSON-LD Person schema con datos de `contact.js`.

## Pending para W4 (Plan 03-05)

Avatar pixel art via pixelforge-mcp — usa `chapter.avatarSrc` como destino de guardado y `chapter.palette` como parámetro explícito en cada call a `forge_sprite`. Plan 03-05 tiene checkpoint:human-input bloqueante para CONTENT-CHECKLIST §5 (paletas ch2..ch6).

---

## Threat Surface Scan

Sin nuevas superficies de seguridad introducidas:
- `src/data/contact.js`: datos hardcoded en source (T-CON-03 mitigación aplicada — sin user input runtime). Email/URLs son placeholders `''` hasta que Rafael llene §3.
- `src/data/*.js`: módulos ESM puros, sin side effects, sin network calls, sin DOM access.
- `src/i18n/*.json`: extensión de JSON existente con strings de texto — sin interpolaciones peligrosas nuevas.

---

## Known Stubs

| Stub | Archivo | Razón |
|------|---------|-------|
| `email: ''` | src/data/contact.js | CONTENT-CHECKLIST §3 pendiente |
| `linkedinUrl: ''` | src/data/contact.js | CONTENT-CHECKLIST §3 pendiente |
| `githubUrl: ''` | src/data/contact.js | CONTENT-CHECKLIST §3 pendiente |
| `projects = []` | src/data/projects.js | CONTENT-CHECKLIST §2.2 pendiente |
| `palette: []` ch2..ch6 | src/data/chapters.js | CONTENT-CHECKLIST §5 pendiente (Plan 03-05) |
| `bio.core` = "PENDING..." | src/i18n/es.json + en.json | CONTENT-CHECKLIST §1 pendiente |
| `seo.title/description` = "PENDING..." | src/i18n/es.json + en.json | CONTENT-CHECKLIST §4 pendiente |

Todos los stubs son **intencionales y documentados** — no impiden el objetivo de este plan (scaffolding de shapes). Los planes 03-02..03-05 y el CONTENT-CHECKLIST son los que resuelven estos stubs en orden.

---

## Self-Check

### Archivos creados verificados
- [x] `src/data/chapters.js` — FOUND
- [x] `src/data/projects.js` — FOUND
- [x] `src/data/bio.js` — FOUND
- [x] `src/data/contact.js` — FOUND
- [x] `tests/data/chapters.test.js` — FOUND
- [x] `tests/data/projects.test.js` — FOUND
- [x] `tests/data/contact.test.js` — FOUND
- [x] `tests/data/bio.test.js` — FOUND

### Commits verificados
- `146b118` — test(03-01): RED — tests shape para 4 data files (13 tests)
- `d83ee69` — feat(03-01): GREEN — 4 data files Phase 3 scaffolded
- `2dc2391` — feat(03-01): extender es.json + en.json con keys Phase 3

### Suite
- 160 tests verdes (26 test files)
- Build verde

## Self-Check: PASSED
