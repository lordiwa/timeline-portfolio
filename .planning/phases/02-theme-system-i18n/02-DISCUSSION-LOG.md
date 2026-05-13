# Phase 2: Theme System + i18n - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 02-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 02-theme-system-i18n
**Areas discussed:** Theme delivery scope, Theme transition + background morph, Fonts strategy era-auténtica, i18n UX (detección inicial + LangToggle placement)

---

## Theme delivery scope

### Q1 — ¿Qué entrega Phase 2 exactamente?

| Option | Description | Selected |
|--------|-------------|----------|
| Motor + ch0/ch1 themes completos + stubs era-tinted ch2-6 | Motor + temas FINALES ch0/ch1 (CSS puro sin pixel art) + stubs (bg+accent+fonts era-distinct) para ch2-6. Costo medio, máximo handoff limpio a Phase 3/4. | ✓ |
| Solo motor + paleta placeholder neutra | Phase 2 entrega solo INFRAESTRUCTURA. Los 7 themes se aplican en Phase 3/4. Costo mínimo, riesgo de churn cuando cada chapter en Phase 3/4 re-invente cómo aplica theme. | |
| Motor + los 7 themes con colores/fonts/contrast aprobados | Motor + temas finales con paletas/tipografías/accent/contrast tradeoffs documentados. Pixel art con placeholders ready to swap. Costo alto, máximo lock-in upfront. | |

**User's choice:** Motor + ch0/ch1 completos + stubs era-tinted ch2-6.
**Notes:** Decisión driven by eficiencia (ch0/ch1 CSS puro dependen del motor que Phase 2 owns) y handoff limpio (Phase 3/4 enchufan arte sin re-inventar arquitectura).

### Q2 — Nivel de detalle de stubs ch2-6

| Option | Description | Selected |
|--------|-------------|----------|
| Medio: bg + fg + accent + border + font hint | 5 custom props + font-family hint system-safe por chapter. ~5-7 LOC CSS. Da personalidad inmediata sin pixel art. | ✓ |
| Mínimo: solo bg + accent distintivos | Solo --c-bg + --c-accent. Fonts heredan :root neutral. Mínimo Phase 2; canvas casi en blanco para Phase 3/4. | |
| Máximo: todas las custom props por chapter ahora | bg+fg+accent+border+font+focus+spacing+button/link styles. Stubs cerca de listo visualmente. Mayor costo + riesgo de revisar paletas cuando llegue arte. | |

**User's choice:** Medio.
**Notes:** Phase 3/4 sobreescribirán custom props con paletas finales aprobadas cuando llegue arte.

### Q3 — Documentación de contrast tradeoffs (THM-05, A11Y-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Comentarios inline en `chapter-themes.css` | Al lado de cada `[data-chapter="N"]` block: `/* contrast(fg, bg) = X.X:1 — chapter N accepts Y:1 era-authentic tradeoff per THM-05 */`. Vive con el código. | ✓ |
| Tabla canonical en `CONTRAST-MATRIX.md` dedicado | Documento dedicado con tabla chapter / bg / fg / ratio / acceptable? / justification. Más auditable, más mantenimiento. | |
| Ambos: comentarios inline + tabla canonical | Máximo rigor con sync overhead. Útil si auditoría externa. | |

**User's choice:** Comentarios inline.
**Notes:** Fuente de verdad para auditoría queda en el CSS.

---

## Theme transition + background morph

### Q1 — Arquitectura del background morph

| Option | Description | Selected |
|--------|-------------|----------|
| 2 capas apiladas con opacity crossfade | Dos `<div>` fixed bg con `data-chapter` propio, opacity crossfade 200ms default / 150ms PRM. Future-proof para pixel art. ~30 LOC arquitecturales. | ✓ |
| Single fixed bg layer con CSS transition | Un solo `<div>` con `background-color: var()` + `transition`. Simple ahora. Requiere refactor cuando llegue pixel art (background-image no transitions bien). | |
| Per-section bg (sin morph global) | Cada section trae su propio bg. Rompe D-03 cross-cutting explícitamente. | |

**User's choice:** 2 capas apiladas con opacity crossfade.
**Notes:** Future-proof sin costo enorme. Cuando llegue --bg-image en Phase 3/4, las capas la swappean sin cambiar arquitectura.

### Q2 — Theme bleed prevention (THM-04) durante smooth-scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Cada `<section>` lleva su propio `[data-chapter="N"]` hardcoded | Theme aplica local a section + children. Bg morph global independiente driven by activeChapter. Cero bleed. | ✓ |
| Wrapper global con `[data-chapter]` dinámico | Cambia en threshold 50%. Brief bleed visible durante scroll. Rompe THM-04. | |
| JS interpolation continua de CSS vars | RAF + lerp. Fluido pero overhead alto, fonts no interpolables. Overengineered. | |

**User's choice:** Cada section con `data-chapter` hardcoded.
**Notes:** "Vives en una era hasta que llegas a la siguiente." Coherente con D-03 cross-cutting.

---

## Fonts strategy era-auténtica

### Q1 — Self-hosted o Google Fonts

| Option | Description | Selected |
|--------|-------------|----------|
| Self-hosted en `/public/fonts/` | Zero network dep, offline-safe, privacy-friendly, Firebase cache controlable. ~150-300KB bundle. | ✓ |
| Google Fonts CDN | Zero bundle cost, shared CDN cache. Network dep, GDPR concerns sutiles, latency riesgo. | |
| Mixed: críticos self-hosted, resto Google Fonts | Más complejo, no recommended v1. | |

**User's choice:** Self-hosted.

### Q2 — Cuántas font families

| Option | Description | Selected |
|--------|-------------|----------|
| 7 distintas, una por chapter | Máxima diferenciación era. ~250KB subsetted. | ✓ |
| 5-6 con shared entre chapters cercanos | Menor diferenciación, ~150KB. ch2/ch3 son cercanos en tiempo pero diferentes en vibe. | |
| 2 variable fonts + system fallbacks | ~80KB. Era-authenticity weak para ch1 Comic Sans + ch4 futuristic. | |

**User's choice:** 7 distintas.
**Notes:** Bundle target ~150-300KB. Propuestas iniciales (planner valida exacto): ch0 VT323/Press Start 2P, ch1 Comic Neue, ch2 Verdana/Trebuchet, ch3 Lobster + Georgia, ch4 Eurostile/Bank Gothic/Audiowide, ch5 Inter Variable, ch6 PixelOperator/Press Start 2P.

---

## i18n UX

### Q1 — Detección inicial de locale

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect via `navigator.language` | ES si empieza con 'es', EN sino. Persist en localStorage tras primer toggle. Friction zero ambas audiencias. | ✓ |
| Siempre ES default | LatAm prioritized; recruiters NA/EU friction al togglear. | |
| Siempre EN default | Audiencia primaria recruiters NA prioritized; LatAm friction al togglear. | |

**User's choice:** Auto-detect navigator.language.

### Q2 — Placement del LangToggle

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right standalone fixed | Pill "ES \| EN" simétrico al avatar. Visible siempre. Mobile shrinks a icon. Convención web bien conocida. | ✓ |
| Integrado a la timeline sticky bottom | Toggle al inicio/final de timeline. Pero timeline ya densa (marker + año + label + 7 ticks). | |
| Top-right en mini-HUD con avatar shape | Command center top-right extensible. Look vacío con solo el toggle. | |

**User's choice:** Top-right standalone fixed.

### Q3 — Scope de strings i18nificados en Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| UI chrome + chapter titles/labels | SkipLink + LangToggle aria + timeline aria + los 7 chapter titles bilingues. Mínimo absoluto. No bio ni proyectos (Phase 3). | ✓ |
| Solo UI chrome | Sin chapter titles. Riesgo: timeline muestra labels — si Phase 2 entrega sin labels traducidos, queda placeholder hardcoded. | |
| UI chrome + chapter titles + placeholders bilingues | Lorem-ipsum era-auténtico para validar layout. Duplica trabajo (Phase 3 re-escribe), único beneficio: validar breakage antes. | |

**User's choice:** UI chrome + chapter titles/labels.
**Notes:** Bio + proyectos vienen en Phase 3 con contenido real producido por Rafael en paralelo.

---

## Claude's Discretion

El usuario eligió focalizar en las 4 áreas y aceptó que los siguientes detalles los resuelva research/planning con justificación documentada (capturados como Open-Q2-A..F en CONTEXT.md `<decisions>`):

- **Open-Q2-A — Where to mount `data-chapter` attribute en ScrollShell.vue:** `<section>` literals hardcoded vs v-for sobre chapters array.
- **Open-Q2-B — Theme transition duration default (sin PRM):** 200ms (alinea con avatar Phase 1) vs 300ms (más fluído). Recomendación 200ms; A/B test en planning.
- **Open-Q2-C — i18n keys naming convention:** jerárquico (`chapters.0.title`, Recommended) vs flat.
- **Open-Q2-D — Fallback string behavior bajo gaps:** visible marker en DEV, silent key raw en prod (Recommended).
- **Open-Q2-E — Font subsetting strategy:** Latin Extended mandatory para ES (ñ, á, é, í, ó, ú, ü).
- **Open-Q2-F — Variable fonts donde aplica:** Inter Variable + cualquier otra variable variant disponible (Recommended).

## Deferred Ideas

Capturadas en CONTEXT.md `<deferred>` section:
- Theme transition coordinada con scroll progress (interpolación continua) — fuera de Phase 2 scope.
- 3er idioma (PT-BR / FR) — REQUIREMENTS v2 §I18N3-01.
- JSON-LD Person schema multilingüe — Phase 3 owns (SEO-02).
- Era-authentic UI components — Phase 3/4 owns.
- Theme switcher dark/light por encima del chapter theme — OUT OF SCOPE explícito.
- `prefers-color-scheme` detection — no relevante por chapter-theme override.
- CSS @container queries para responsive theme — posible v2.
- Avatar bust alt-text i18n keys — Phase 3 (ch3+6) + Phase 4 (ch0/1/2/4/5).

---

*Discussion completed: 2026-05-12*
*Author: Rafael Matovelle*
*Facilitator: Claude (Opus 4.7 1M)*
