# Phase 3: Chapter 3 End-to-End - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 03-chapter-3-end-to-end
**Areas discussed:** Data Architecture, Pixel Art Pipeline, Layout ch3 polished

---

## Gating decision — empty CONTENT-CHECKLIST

| Option | Description | Selected |
|--------|-------------|----------|
| Discuss implementation; content lo lleno después | Phase 3 discuss puede capturar HOW sin texto específico. CONTEXT.md documenta que el contenido es input pendiente del planner. | ✓ |
| Pausar discuss; primero CONTENT-CHECKLIST | Bloqueamos hasta que Rafael llene bio + proyectos + contacto + SEO + paletas. | |
| Discuss solo mínimo (avatar + bio placeholder) | Scope reducido a "ch3 polished con avatar real + bio placeholder". | |

**User's choice:** Discutir decisiones de implementación; content lo lleno después.
**Notes:** Phase 3 procede sin contenido real. CONTEXT.md marca CONTENT-CHECKLIST como blocking input del planner; si está vacío al `plan-phase`, el planner pausa con checkpoint:human-input.

---

## Areas selected for discussion

| Option | Description | Selected |
|--------|-------------|----------|
| Arquitectura de datos | bio + proyectos + contacto + chapters file structure | ✓ |
| Pipeline pixel art | 7 busts + paleta governance + prompt structure + visual anchor | ✓ |
| Layout ch3 polished | columnar vs centered + contact placement + card style + ES overflow | ✓ |
| SEO + metadata (OG + JSON-LD + hreflang) | librería, JSON-LD strategy, OG image | |

**User's choice:** 3 áreas seleccionadas; SEO defer al planner con defaults reasonable.

---

## Area 1 — Data Architecture

### Q1.1 — File structure

| Option | Description | Selected |
|--------|-------------|----------|
| Separados por concepto | `chapters.js`, `projects.js`, `bio.js`, `contact.js` | ✓ |
| Un solo `portfolio.js` con todo | Single file `{ chapters, projects, bio, contact }` | |
| Locale-first: `es.json`/`en.json` con todo | Texto + datos en archivos i18n | |

**User's choice:** Separados por concepto.
**Captured as:** D3-01.

### Q1.2 — Text bilingual location

| Option | Description | Selected |
|--------|-------------|----------|
| Texto en es.json/en.json, refs en data files | i18n keys + data refs separated | ✓ |
| Texto inline en data files con `{ es, en }` | Inline bilingual objects | |
| Híbrido: refs en proyectos, inline en data útil corta | Pragmatic split | |

**User's choice:** Texto en es.json/en.json, refs en data files.
**Captured as:** D3-02.

### Q1.3 — Project shape

| Option | Description | Selected |
|--------|-------------|----------|
| Mínimo viable | 7 fields, 4 opcionales | |
| Más rico (preparado para Phase 5 Phaser planets) | + techStack, planetSprite, planetOrbit, planetColor | ✓ |
| Mínimo + slot extension genérico `metadata: {}` | Free-form object | |

**User's choice:** Más rico, preparado para Phase 5.
**Captured as:** D3-03.

### Q1.4 — chapters.js shape

| Option | Description | Selected |
|--------|-------------|----------|
| Datos básicos + assets refs | `{ id, year, era, eraKey, titleKey, avatarSrc, themeColor? }` | ✓ |
| Básico + helper functions | + getChapter(id), getProjectsForChapter(id) | |
| Estructura plana, joins en componente | Filter inline, no helpers | |

**User's choice:** Datos básicos + assets refs (sin helpers, joins inline 1-liners).
**Captured as:** D3-04.

---

## Area 2 — Pixel Art Pipeline

### Q2.1 — Avatar scope

| Option | Description | Selected |
|--------|-------------|----------|
| Solo ch3 | 1 bust ahora, 6 placeholder hasta Phase 4 | |
| Batch 7 busts ahora en Phase 3 | Consistencia visual desde day 1 | ✓ |
| ch3 + ch6 compromiso | 2 busts, otros 5 a Phase 4 | |

**User's choice:** Batch 7 busts.
**Captured as:** D3-05.
**Notes:** Implica blocking: 7 paletas + age refs antes de execute.

### Q2.2 — Palette governance

| Option | Description | Selected |
|--------|-------------|----------|
| CHECKLIST §5 + replicada en data/chapters.js | Doble fuente humana+programmatic | ✓ |
| Solo en CHECKLIST referencial | Single human source | |
| chapters.js + tests architectural | + paleta-count test | |

**User's choice:** Doble fuente (humana + programmatic).
**Captured as:** D3-06.

### Q2.3 — Prompt structure

| Option | Description | Selected |
|--------|-------------|----------|
| Base prompt + diff per chapter | BASE template + age/era diffs | ✓ |
| 7 prompts independientes | Manual control per chapter | |
| Una imagen seed + variantes Adobe MCP | One master + AI age-shift | |

**User's choice:** Base prompt + diff per chapter.
**Captured as:** D3-07.

### Q2.4 — Visual anchor

| Option | Description | Selected |
|--------|-------------|----------|
| Rafael sube 2-3 fotos reales | Multiple references | |
| Descripción textual del personaje | No real photos | |
| Avatar estilizado no-literal | Archetype | |
| **Other (free text):** 1 foto real edad ~30 — Claude deriva el resto | | ✓ |

**User's choice (free text):** "subo 1 foto real y tu haces los cambios la foto es de cuando tenia 30 años".
**Captured as:** D3-08.
**Notes:** Privacy obligatoria — foto en `public/assets/.refs/` + `.gitignore` entry, NO committed.

---

## Area 3 — Layout ch3 polished

### Q3.1 — Layout structure

| Option | Description | Selected |
|--------|-------------|----------|
| Dos columnas (avatar+meta izq / contenido der) — stacked mobile | Web 2.0 pattern era-auténtico | ✓ |
| Centered narrow column | Modern minimal | |
| Hero + grid | Asymétrico cinematic | |

**User's choice:** Dos columnas, stacked mobile.
**Captured as:** D3-09.
**Notes:** Conflict potencial con StickyTimeline vertical-left — planner decide opción A (avatar a left:140px+) o B (toggle al activeChapter===3). Default A.

### Q3.2 — Contact placement

| Option | Description | Selected |
|--------|-------------|----------|
| HUD bottom-right fixed con 3 icons | Análogo a LangToggle invariante | ✓ |
| Footer bar inline en cada chapter | 7 copias en cada section | |
| Side dock left bottom junto a timeline | Riesgo en mobile | |

**User's choice:** HUD bottom-right fixed.
**Captured as:** D3-10.

### Q3.3 — Project card style

| Option | Description | Selected |
|--------|-------------|----------|
| Glossy Web 2.0 clásico | Gradients sutiles + rounded + soft shadows | |
| Skeumorphic Web 2.0 más explícito | Glossy + embossed + inner highlights | ✓ |
| Minimal modern (cards planas con hover lift) | Rompe era-autenticidad | |

**User's choice:** Skeumorphic Web 2.0 explícito.
**Captured as:** D3-11.

### Q3.4 — ES overflow mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll INTERNO dentro del chapter | Abandonar 100dvh strict en mobile | ✓ |
| Line-clamp + "leer más" expandible | Truncate + expand button | |
| Bio y proyectos resumidos (versión corta) | `bio.long` + `bio.short` | |

**User's choice:** Scroll interno.
**Captured as:** D3-12.
**Notes:** Research item del planner — verificar nested scroll + scroll-snap-stop:always cross-browser. Fallback documentado: line-clamp si causa fricción.

---

## Claude's Discretion

- **SEO implementation:** librería (`@unhead/vue` recomendado) + JSON-LD strategy + OG image — planner decide.
- **Mantra easter egg ch6 (CON-04):** default deferred a Phase 5. Planner puede entregar placeholder si quiere; no blocking.
- **StickyTimeline panel theming override:** opcional follow-up Phase 2 caveat. Planner decide si añade override o lo deja en :root estático.

## Deferred Ideas

- Deep-link `?ch=3` behavior — useScrollState ya lo soporta.
- Otra red social (Twitter/X/Mastodon/Bluesky/sitio personal) — ContactHUD soporta `otherUrl?` opcional.
- Mobile responsive avatar size en stacked layout — sin discusión adicional necesaria.
- pixel-mcp Aseprite — NO instalar (preferencia documentada).
