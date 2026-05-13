# Phase 3: Chapter 3 End-to-End - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning (CONTENT-CHECKLIST inputs pending Rafael)

<domain>
## Phase Boundary

Phase 3 entrega **el chapter 3 (Web 2.0 era 2013) como landing polished** que recibe al recruiter. Incluye:

- **Datos reales bilingüe**: bio core ES/EN (CON-01), 1-3 proyectos era Pink Parrot (CON-02), contacto persistente (CON-03), data files canonicalizados (`src/data/{chapters,projects,bio,contact}.js`, CON-05/06).
- **Avatar pixel art real**: los 7 retratos bust de Rafael (ART-01) — **scope expandido de "solo ch3" a "batch 7 busts"** porque queremos consistencia visual desde day 1 (D3-05). Anchor visual: 1 foto real de Rafael ~30 años; los 7 busts se derivan aging-down (ch0..ch3) y aging-up (ch5..ch6) con paleta humana base consistente. ART-05 naming convention `ch{N}-bust.png`. ART-06 palette gate per chapter.
- **SEO + metadata**: OG meta tags + JSON-LD Person schema + hreflang ES/EN + title/description que muta al toggle locale (SEO-01..04). **No discutido en detalle aquí** — planner usa defaults reasonable (`@unhead/vue` o equivalente; build-time JSON-LD; OG image = screenshot ch3 post-execute).
- **Layout polished ch3**: dos columnas desktop (avatar+meta izq / bio+projects der) / stacked mobile. Cards de proyectos skeumorphic Web 2.0 (gradients glossy, embossed text, drop shadows). Scroll interno permitido en ch3 mobile.

**Phase 3 NO incluye:**
- Pixel art de fondos parallax (ART-02/03/04 → Phase 4 — chapters 0/1/2/4/5/6)
- Easter egg mantra ch6 "And always show a smile" (CON-04 → planner decide si lo entrega aquí o difiere a Phase 5; default: difiere)
- Scena Phaser ch6 (PHA-* → Phase 5)
- Deploy + cache (DEPLOY-* → Phase 6)
- Panel del StickyTimeline theming override (caveat post-redesign Phase 2 — opcional follow-up)

**Critical blocking input for execute:** `.planning/phases/03-chapter-3-end-to-end/CONTENT-CHECKLIST.md` está vacío. El planner debe verificar que Rafael llenó al MENOS:
- §1 Bio ES + EN
- §2.2 proyectos ch3 (1-3 mínimo) — `Pink Parrot — UX + Web Dev + Team Leader`
- §3 Email + LinkedIn + GitHub
- §4.1 Title + Description ES/EN
- §5.2 Paleta ch3 + §5.6 paleta avatar humana (skin/hair/clothing base)
- 1 foto de Rafael ~30 años en `public/assets/.refs/` (en `.gitignore`)

Si el checklist está incompleto al momento de plan-phase, el planner pausa con checkpoint:human-input.

</domain>

<decisions>
## Implementation Decisions

### Data Architecture

- **D3-01:** Files separados por concepto en `src/data/`: `chapters.js`, `projects.js`, `bio.js`, `contact.js`. Cada concepto crece independiente. Phase 4 (otros chapters) y Phase 5 (planet-projects ch6) lo extienden sin reorganizar.
- **D3-02:** Texto bilingual vive en `src/i18n/es.json` + `en.json`. Data files solo llevan refs (`titleKey`, `descKey`, etc.) + datos no-traducibles (`link`, `year`, `id`, `chapterEra`). Phase 2 ya tiene tests de paridad i18n — se reutilizan automáticamente.
- **D3-03:** Project shape **rico, preparado para Phase 5 Phaser**: `{ id, chapterEra, year, titleKey, descKey, link?, imageSrc?, role?, techStack?, planetSprite?, planetOrbit?, planetColor? }`. Campos Phaser (planet*) son `null` o ausentes en Phase 3; Phase 5 los pobla cuando construye la escena ch6.
- **D3-04:** `chapters.js` shape **básico + assets refs**: `{ id, year, era, eraKey, titleKey, avatarSrc, themeColor? }`. **Sin helper functions** — los componentes hacen joins inline (`projects.filter(p => p.chapterEra === currentChapter.id)`). Phase 1 tiene chapters duplicados en `ScrollShell.vue` + `StickyTimeline.vue`; Phase 3 los reemplaza con `import chapters from '@/data/chapters'`.

### Pixel Art Pipeline

- **D3-05:** **Batch 7 busts en Phase 3** (no solo ch3). Implica blocking inputs antes de execute: las 7 paletas + age refs aprobadas (CONTENT-CHECKLIST §5 + §2.6).
- **D3-06:** **Paleta gobernada doble fuente:** humana en `CONTENT-CHECKLIST.md` §5 (Rafael) + replicada programmaticamente en `chapters.js` field `palette: ['#...', '#...']`. Cada call a `forge_sprite` / `forge_background` pasa `palette: chapter.palette` explícito. Auditable + introspectable desde código.
- **D3-07:** **Prompt structure base + diff per chapter.** `BASE_PROMPT_AVATAR` template invariante (descripción del personaje 16-bit: género, skin tone base, complexión, mood habitual, art style). Diffs incrementales por chapter: `age, hair_state, era_clothing, accessories`. El planner deriva el base prompt con `artist-creator` agent antes del batch run, lo locks en CONTEXT.md downstream.
- **D3-08:** **Anchor visual: 1 foto real de Rafael ~30 años** (consensuado con Rafael). Claude/artist-creator deriva los 7 busts: aging-down ch0..ch3 (~10/15/22/26), anchor cercano ch4 (~30), aging-up ch5..ch6 (~36/40). **Privacy obligatoria:** foto en `public/assets/.refs/rafael-age30.{jpg,png}` + entry en `.gitignore` para que NO se committee al repo. Solo el MCP pixelforge la consume como input; los outputs `ch{N}-bust.png` SÍ son committed.

### Layout & UI

- **D3-09:** **Ch3 layout dos columnas desktop ≥768px** (avatar+meta izq fija dentro del chapter section + bio+projects der scrolleable) **/ stacked mobile <600**. Pattern Web 2.0 era-auténtico. **Conflict potencial con StickyTimeline vertical-left** (Phase 2 redesign 2026-05-13): el avatar grande dentro de ch3 compite con el panel del nav timeline ya fijo en `left: var(--sp-md)`. **Planner decide**:
  - Opción A: avatar ch3 a `left: 140px+` (después del timeline width ~120px), no se solapan.
  - Opción B: avatar ch3 reemplaza al StickyAvatar global solo cuando `activeChapter === 3` (toggle dinámico, más complejo).
  - Default recomendado: A. Más simple + mantiene timeline visible en todos los chapters.
- **D3-10:** **ContactHUD componente nuevo**: `position: fixed; bottom: env(safe-area-inset-bottom, 0); right: var(--sp-md); z-index: 40`. 3 iconos clicables (email mailto + LinkedIn target=_blank + GitHub target=_blank), tap target 44×44, tooltips i18n, `rel="noopener noreferrer"` en externos. **Invariante a chapter** (no se tiñe — usa tokens :root fijos, igual que LangToggle es invariante).
- **D3-11:** **Project cards skeumorphic Web 2.0 explícito.** Gradient glossy (top-light → bottom-darker), `box-shadow: inset 0 1px 0 rgba(255,255,255,0.5)` (inset highlight top), `text-shadow: 0 1px 0 rgba(255,255,255,0.7)` (embossed text), `border-radius: 12-16px`, drop shadow `0 4px 12px rgba(0,0,0,0.15)`. Title en Lobster (font ch3 ya cargado Phase 2). Botón "Ver proyecto →" con depth + hover "press" effect.
- **D3-12:** **Ch3 mobile abandona `height: 100dvh` strict; permite `overflow-y: auto` interno** para que bio ES (20-30% más largo que EN) no se trunque ni desborde. Scroll-snap del shell sigue funcionando cuando llegas al final del scroll interno y sigues haciendo wheel/swipe → salta al siguiente chapter. **Research item del planner:** verificar interacción nested-scroll + `scroll-snap-stop: always` en Chrome + Firefox + iOS Safari (deferred). Fallback si causa fricción: D3-12.alt = `line-clamp` con botón "leer más".

### Claude's Discretion

- **SEO implementation (no discutido):** El planner elige librería (`@unhead/vue` recomendado para Vue 3 + Vite; alternativas: `vue-meta`, manual `document.title` mutation con watcher). JSON-LD Person schema build-time. OG image (1200×630): screenshot post-execute de ch3 o aspirational mockup — decidir en plan.
- **Mantra easter egg ch6 (CON-04):** Default deferred a Phase 5 (cuando la escena Phaser exista). Planner puede entregar un placeholder simple ahora (footer escondido en ch6 que se revela al llegar) si quiere — pero NO es blocking.
- **StickyTimeline panel theming caveat (Phase 2 follow-up):** El planner decide si añade override de `--c-surface` por `[data-chapter]` global (no solo en `<section>`) para que el panel del nav se tiña con el chapter activo. Si lo hace, es una mejora; si no, no bloquea Phase 3.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/REQUIREMENTS.md` — CON-01..06 (bio/projects/contact/mantra/data files), ART-01/05/06 (avatar busts + naming + palette gate), SEO-01..04 (OG/JSON-LD/hreflang/locale title)
- `.planning/ROADMAP.md` §Phase 3 — Goal + Success Criteria (5 items)

### Phase 2 carry-forward
- `.planning/phases/02-theme-system-i18n/02-CONTEXT.md` — D2-01..D2-11 decisiones del motor de themes + i18n (ch3 stub Web 2.0 ya tematizado, Lobster cargado, bg `#f0f4ff`, accent `#ff6699`)
- `.planning/phases/02-theme-system-i18n/02-VERIFICATION.md` — verdict PASS programmatic
- `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` §6.4.17-§6.4.20 — caveat post-redesign del StickyTimeline (panel no se tiñe por chapter)

### Phase 3 blocking inputs (Rafael — pending)
- `.planning/phases/03-chapter-3-end-to-end/CONTENT-CHECKLIST.md` — bio ES/EN + proyectos ch3 + contacto + SEO titles/desc + paletas ch2-6 + paleta humana avatar + 1 foto Rafael ~30 años (privacy: NO commit)

### Existing code (Phase 1 + Phase 2 reusables)
- `src/components/StickyAvatar.vue` — placeholder Phase 1 Plan 04; Phase 3 lo reemplaza con avatar real (mismo state-machine swap pattern, fed por `chapters.js`)
- `src/components/StickyTimeline.vue` — post-redesign vertical-left; `import chapters from '@/data/chapters'` lo deduplicar
- `src/components/ScrollShell.vue` — 7 sections con `:data-chapter` v-for; `import chapters from '@/data/chapters'` lo deduplicar
- `src/i18n/index.js` + `es.json` + `en.json` — Phase 2 i18n engine; Phase 3 añade keys `bio.*`, `projects.*`, `chapters.*.title`, `contact.*` con paridad
- `src/styles/chapter-themes.css` — `[data-chapter="3"]` ya tiene tokens; Phase 3 puede ajustar fine-tuning de paleta + agregar component-level styles en `@layer components`
- `CLAUDE.md` — multi-agente system, pixelforge-mcp + Adobe MCP commands, paths `public/assets/`, naming `ch{N}-{descriptor}[-{variant}].png`
- `.claude/agents/artist-creator.md` + `artist-editor.md` — agents para generación + post-proceso pixel art
- `.claude/skills/crear-arte-pixelforge.md` — protocolo pixelforge incluyendo error-cases conocidos

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`usePRM` composable** (Phase 1 Plan 03): inject('prm') ya disponible. Ch3 content puede consumirlo si añade animaciones (ej. proyecto card hover lift).
- **`useScrollState` composable** (Phase 1 Plan 02): `activeChapter` reactive ref ya provee data para que ch3 sepa cuando es el active section.
- **i18n parity test** (Phase 2 Plan 01): `tests/i18n/parity.test.js` enforza es↔en key parity automáticamente — Phase 3 nuevos keys se verifican gratis.
- **`useBackgroundMorph`** (Phase 2 Plan 04): no se toca; ch3 se beneficia del crossfade ya implementado al entrar.

### Established Patterns
- **`<section :data-chapter="N">` v-for en ScrollShell**: pattern para insertar contenido ch3 sin tocar layout shell. El contenido de ch3 vive en un componente nuevo `<Chapter3Content />` que se mounta condicional dentro del `<section data-chapter="3">`.
- **Provide/inject para shared state**: App.vue provee `scrollState`, `prm`, `bgMorph`. Ch3 puede inject lo que necesite (probably solo `scrollState.activeChapter` para lazy-render).
- **Tests architectural source-level** (Phase 2 Plan 03 estilo): regex matches sobre source files. Phase 3 puede aplicar el mismo enfoque para validar e.g. data shape de `projects.js`.
- **Atomic commit per task** (Phase 1+2 convention): `feat(03-NN):`, `test(03-NN):`, `docs(03-NN):` scope. Phase 1 commit style.

### Integration Points
- **`src/data/chapters.js` (NEW)**: imported por ScrollShell, StickyTimeline, StickyAvatar — 3 consumers que actualmente duplican el array.
- **`src/data/projects.js` (NEW)**: imported por `<Chapter3Content />` para listar proyectos. Phase 4 lo extiende con chapters 0,1,2,4,5; Phase 5 lo extiende con ch6 planet metadata.
- **`src/data/bio.js` (NEW)**: imported por `<Chapter3Content />` (y futuros chapters cuando rendericen bio). Probablemente solo expone `bioKey: 'bio.core'` para que i18n resuelva el texto.
- **`src/data/contact.js` (NEW)**: imported por `<ContactHUD />`. Expone `{ email, linkedinUrl, githubUrl, otherUrl? }`.
- **`src/components/Chapter3Content.vue` (NEW)**: componente con el layout 2-col / stacked, importa data + i18n, renderiza avatar embed + bio + projects cards.
- **`src/components/ContactHUD.vue` (NEW)**: HUD fixed bottom-right. Análogo arquitectural a LangToggle.
- **`src/components/ProjectCard.vue` (NEW)**: card skeumorphic Web 2.0; reusable para Phase 4 (otros chapters con sus propios estilos era-auténticos via tokens).

</code_context>

<specifics>
## Specific Ideas

- **Foto de Rafael ~30 años** como anchor visual del avatar (D3-08). Rafael sube; artist-creator deriva las 7 edades.
- **Pink Parrot Games — UX + Web Dev + Team Leader** es el contexto histórico de ch3. Los proyectos de ch3 vienen de esa era.
- **Skeumorphic Web 2.0 cards** explícito (D3-11) — gradients, embossed, drop shadows. Era-auténtico, no minimal-modern.
- **Lobster font** ya cargado (Phase 2 Plan 05) — usar para titles de project cards en ch3.
- **Email como `mailto:` + tooltip "copy"** (mencionado en CONTENT-CHECKLIST §3) — el planner decide UX del click-to-copy.

</specifics>

<deferred>
## Deferred Ideas

- **SEO implementation detail** — librería + JSON-LD strategy + OG image source. Discusión específica difertida; planner usa defaults reasonable.
- **Mantra easter egg ch6** (CON-04) — default deferred a Phase 5. Si planner quiere lo entrega como placeholder; no es blocking.
- **StickyTimeline panel theming override** (caveat Phase 2 redesign) — opcional. Si el planner añade `--c-surface` override por chapter global (`html[data-active-chapter="N"]` en el root, por ejemplo), el panel se tiñe. Si no, queda en :root estático.
- **Deep-link `?ch=3` behavior** — useScrollState ya lo soporta (Phase 1 PATTERN B). Phase 3 confirma que el landing default es ch3 sin requerir URL param. Sin discusión adicional necesaria.
- **Other social network** (Twitter/X, Mastodon, Bluesky, sitio personal) — opcional según CONTENT-CHECKLIST §3. ContactHUD shape soporta `otherUrl?` como 4to slot; si Rafael decide no incluir, el icon se omite.
- **Mobile responsive avatar size** — en stacked mobile, el avatar bust se ve más pequeño. Planner ajusta dimensions sin discusión adicional.
- **`pixel-mcp` Aseprite alternative** — NO instalar (preferencia documentada en CLAUDE.md y memory).

</deferred>

---

*Phase: 03-chapter-3-end-to-end*
*Context gathered: 2026-05-13*
