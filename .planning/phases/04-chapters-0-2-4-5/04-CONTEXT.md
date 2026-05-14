# Phase 4: Chapters 0-2 + 4-5 - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 entrega los **5 chapters restantes** (ch0, ch1, ch2, ch4, ch5) con contenido era-auténtico, pixel art validado para ch2/ch4/ch5, y el **batch consolidado de los 7 avatar busts** (ch0..ch6, incluyendo ch3 que quedó deferred en Phase 3 y ch6 que Phase 5 hereda ya hecho). Phase 4 cierra el arco visual cronológico 1995→2023 del sitio; ch3 ya es landing polished (Phase 3 PASS-with-deferred-art); ch6 (escena Phaser) y deploy quedan en Phases 5/6.

**Entregables canónicos de Phase 4:**

- **Wave 0 — Avatar batch 7 busts.** Reactivar Plan 03-05 deferred dentro de Phase 4 (D4-01). Generación con `forge_sprite` (palette-locked vía paleta humana §5.6, NO `chapters[N].palette` — ver Pitfall 1 RESEARCH) usando las 6 fotos de referencia que Rafael ya entregó (`public/references/{2011,2016,2019,2022,2024,2026}.{jpg,jpeg}`). **Rafael nació en 1984**; mapping derivado por proximidad de edad: ch0 (1995, ~11) y ch1 (2001, ~17) **aging-down** de 2011 (~27); ch2 (2009, ~25) ≈ 2011 leve aging-down; ch3 (2013, ~29) anchor 2011 + slight aging-up; ch4 (2015-18, ~32) ≈ 2016 (~32) anchor casi exacto; ch5 (2022-23, ~38) ≈ 2022 (~38) anchor exacto; ch6 (2026, ~42) ≈ 2026 (~42) anchor exacto. 2019 (~35) y 2024 (~40) sirven como identity-anchor extra para mantener look-consistency entre busts.

- **Wave 1 — Ch0 + ch1 completos en paralelo (CSS-only).** Ambos chapters cero pixel art (ART-07 locked). Components dedicados era-auténticos (D4-03 high fidelity):
  - **Ch0 (Terminal 1995):** scroll de output tipo CRT con cursor parpadeante, output simulando comandos `ls/cat` revelando bio en stages; estética verde fósforo sobre negro (palette ya locked en chapters.js + chapter-themes.css).
  - **Ch1 (HTML 90s 2001-04):** `<marquee>` real con texto bilingüe, tabla con `border="1"`, starfield animado CSS, GIFs "under construction" tinteados, Comic Neue ya cargado. **PRM:** marquee pausada (`animation-play-state: paused`), starfield estático.

- **Wave 2 — Ch2 (Flash 2009).** 1 background full-frame pixel art `ch2-bg.png` (vibe banner+browser chrome+vector gradients). Component nuevo `<FlashBanner.vue>` con skeumorphic buttons + drop shadows. Proyectos de la era BlueLizard/Matte/Joju con `ProjectCard` variant override (gradient orange-purple, border más grueso). Bg consume `--bg-image` que BackgroundLayers crossfade hereda (D2-04).

- **Wave 3 — Ch4 (AR/VR 2015-18) — chapter más rico.** **Multi-layer parallax 3-4 capas DENTRO del `<section data-chapter="4">`** (no en BackgroundLayers que es para crossfade era→era global): deep stars far + planet/nebula mid + floating glass panels + ship sprites near, cada capa con `translateY(scrollProgress * factor)` con factor distinto per capa para parallax depth perceivable. Component `<FloatingPanel.vue>` con vidrio holográfico (border `--c-accent` cyan + box-shadow glow). Proyectos era propia AR/VR + Metrodigi.

- **Wave 4 — Ch5 (Modern 2022-23).** 1 capa hero pixel art `ch5-hero.png` (vibe minimalista: abstract gradient shapes o landscape modern). Component `<ScrollRevealCard.vue>` que aplica fade+slide-in cuando el card entra en viewport del chapter (scroll-driven). PRM: revelado instantáneo sin transición. Proyectos BairesDev+number8+VivoEnVivo+RocketSnail+Remoose.

- **Wave 5 — Integración + a11y + manual checklist.** Validar `useBackgroundMorph` consume `--bg-image` correctamente para ch2/ch5 (ch4 multi-layer es self-contained); verificar A11Y-06 alt-text per chapter en ES/EN (Claude deriva drafts era-accurate; Rafael ratifica en checklist); contrast audit ch2/ch4/ch5 post-paleta-final; FOUT/FOIT con las 5 fonts ya self-hosted; layout shift ES vs EN. Rafael firma sign-off.

**Phase 4 NO incluye:**
- Ch3 (Phase 3 — landing polished, content fold-in del CONTENT-CHECKLIST mejor cuando Rafael complete §2.2)
- Ch6 escena Phaser + ship animation + planet click bridges + mantra easter egg "And always show a smile" (Phase 5 — PHA-* + CON-04)
- Deploy + cache headers + firebase.json (Phase 6 — DEPLOY-*)
- iOS smoke test confirmatorio (deferred Phase 1 Plan 07 — Rafael no tiene hardware iOS)
- 7 fonts swap if some choice cambia (Phase 2 ya lockeó VT323/Comic Neue/Verdana-Trebuchet/Lobster/Audiowide/Inter Variable/Press Start 2P)

**Critical blocking inputs for execute (Rafael):**

Phase 4 usa **checkpoint:human-input per wave** (D4-06), NO hard gate global. Cada wave bloquea limpiamente si su input específico falta:

- **W0 gate:** `CONTENT-CHECKLIST.md §5.6` paleta humana (skin/hair/clothing) + las 6 fotos ya están en `public/references/`. Plan 03-05 reusará esta misma checklist (consolidación).
- **W2 gate:** `§2.1` proyectos ch2 Flash (1-3 items) + `§5.1` paleta ch2 (5-8 hex).
- **W3 gate:** `§2.3` proyectos ch4 AR/VR (1-3) + `§5.3` paleta ch4 (5-8 hex).
- **W4 gate:** `§2.4` proyectos ch5 Modern (1-3) + `§5.4` paleta ch5 (5-8 hex).
- **W1:** SIN gate (ch0+ch1 son CSS-only y bio/contact-agnostic; ya tienen palette en chapters.js).

Si Rafael no completó al momento de execute de una wave, ESA wave entra en checkpoint:human-input. Las demás avanzan.

</domain>

<decisions>
## Implementation Decisions

### Avatar Pipeline

- **D4-01:** **Batch 7 busts completo en Phase 4 Wave 0** (consolidando el Plan 03-05 deferred de Phase 3). Razones: (a) consistencia visual del personaje requiere generar los 7 en un solo batch palette-locked; (b) Phase 5 hereda ch6-bust ya hecho y se concentra solo en escena Phaser; (c) Rafael ya entregó las 6 fotos de referencia y eso reduce el blocker original a solo "§5.6 paleta humana". Effect: ART-01 se reasigna oficialmente a Phase 4 (Traceability table en REQUIREMENTS.md se actualiza post-execute).

- **D4-02:** **Fotos de referencia viven en `public/references/` + entry en `.gitignore`** (NO se mueven a `references/` raíz). Trade-off aceptado: Vite las sirve localmente en dev (`http://localhost:5173/references/2011.jpg`) — hueco aceptable porque solo Rafael corre dev. Para producción: `git clean` checkout del Firebase deploy NO incluye las fotos (no están commiteadas). **Caveat para Phase 6:** si Rafael despliega desde su working tree con las fotos presentes, Vite las copiará a `dist/`. Mitigación a aplicar en Phase 6: añadir glob de exclusión en `firebase.json` (`"ignore": ["references/**"]`) o el deploy script borra `dist/references/` antes de subir.

- **D4-03 (avatar mapping):** **Foto-a-bust por proximidad de edad** (Rafael nacido 1984; derivable, no requiere discusión adicional):
  - ch0 (1995, ~11): aging-down de `2011.jpg` (~27) — pixelforge simula edad menor manteniendo identity anchors (skin tone, eye shape).
  - ch1 (2001, ~17): aging-down de `2011.jpg` (~27) — adolescente.
  - ch2 (2009, ~25): proximidad con `2011.jpg` (~27) — leve aging-down.
  - ch3 (2013, ~29): anchor `2011.jpg` (~27) con slight aging-up — bust de validación primaria.
  - ch4 (2015-2018, ~32): `2016.jpg` (~32) — anchor casi exacto.
  - ch5 (2022-2023, ~38): `2022.jpeg` (~38) — anchor exacto.
  - ch6 (2026, ~42): `2026.jpg` (~42) — anchor exacto.
  - `2019.jpg` (~35) + `2024.jpg` (~40) usados como identity-anchors auxiliares en cada call de pixelforge para forzar consistency entre busts.

### Era-Authentic UI Components

- **D4-04:** **High fidelity per chapter — components dedicados por era** (volumen total: ~5-7 components nuevos). Cada chapter recibe 1-2 components signature que aplican `<style scoped>` o `chapter-themes.css @layer components` con override de tokens. `ProjectCard` shared sigue siendo el base; recibe variants per chapter en `@layer components` (e.g., `[data-chapter="2"] .project-card` con gradient orange→purple; `[data-chapter="4"] .project-card` con glass panel style; `[data-chapter="5"] .project-card` minimal modern flat).

  Components nuevos confirmados (planner refina cantidad/naming):
  - `<TerminalScroll.vue>` (ch0) — output simulado con cursor parpadeante.
  - `<MarqueeBanner.vue>` (ch1) — `<marquee>` real bilingüe + tabla legacy + starfield CSS.
  - `<FlashBanner.vue>` (ch2) — banner skeumorphic con vector gradients.
  - `<FloatingPanel.vue>` (ch4) — glass holográfico para info cards.
  - `<ParallaxLayers.vue>` (ch4) — wrapper de 3-4 capas con `translateY` scroll-driven.
  - `<ScrollRevealCard.vue>` (ch5) — fade+slide-in en viewport-enter.

- **D4-05:** **`<marquee>` real en ch1 vs CSS equivalente** — usar `<marquee>` deprecated tag a propósito para era-authenticity. **A11Y-04 compensation:** `<marquee>` no es focusable y no anuncia su contenido a screen readers de forma controlable, pero los datos ahí son flavor text ("Welcome to my GeoCities-style homepage", construction notice, etc.), NO contenido crítico. Bio/proyectos/contacto persistente siguen accesibles por otros componentes. **PRM:** `animation-play-state: paused` no funciona en `<marquee>` nativo; bajo PRM, swap a `<span>` estático con el mismo texto centrado.

### Pixel Art Background Strategy

- **D4-06:** **Ch2 flat 1 capa / ch4 multi-layer 3-4 / ch5 hero 1 capa** (D4-04 art format). Total assets pixelforge nuevos: ~5-6 (7 busts ya contados aparte).

  - Ch2: 1× `ch2-bg.png` full-frame `forge_background` (Flash banner+browser chrome+vector style).
  - Ch4: 4× layers separadas, cada una `forge_background` (no `forge_sprite` — son full-frame opacas con depth-staggering, NO sprites con transparencia):
    - `ch4-bg-stars-far.png` (capa más lejana, scroll factor ~0.2)
    - `ch4-bg-planet-mid.png` (planeta/nebula mid, factor ~0.5)
    - `ch4-fg-panels.png` (paneles holográficos foreground, factor ~0.8)
    - `ch4-fg-ships.png` (1-2 naves cruzando, factor ~1.0)
  - Ch5: 1× `ch5-hero.png` full-frame `forge_background` (abstract gradient o landscape modern minimal).
  - `optimize_sprite` downscale nearest-neighbor al output target res antes de commit.
  - Adobe MCP post-process si necesita: `image_remove_background` (ships ch4 si pixelforge no entregó alpha clean), `image_crop_and_resize` (dimensiones exactas 480×270 base × zoom 3 = 1440×810).

- **D4-07:** **Ch4 parallax vive DENTRO de `<section data-chapter="4">`**, NO en `BackgroundLayers` global. `BackgroundLayers` (D2-04 Phase 2) maneja crossfade era→era de **una sola imagen** por chapter via `--bg-image` Custom Prop. Ch4 multi-layer parallax es self-contained: 4 `<div>` absolute positioned dentro del section, cada uno con su `background-image` + `transform: translateY(...)` driven por `useScrollState.scrollProgress` (ya disponible Phase 1 W2).

  Para ch2 y ch5 (1 capa): pueden usar el path estándar `--bg-image: url('/assets/ch2-bg.png')` declarado en `[data-chapter="2"]` block de `chapter-themes.css`, y `BackgroundLayers` lo crossfade naturalmente al entrar al chapter.

### Wave Strategy

- **D4-08:** **Por tipo de trabajo, NO cronológico** (D4-05 wave strategy). Razón: ch0+ch1 son CSS-only e independientes → paralelizables en W1; las art-heavy waves (W2/W3/W4) tienen dependencias de input (paletas humanas + proyectos) escalonadas, mejor secuenciales para que el visual review se concentre. W0 avatar batch primero porque desbloquea todos los chapters (cada uno necesita su bust).

  ```
  W0: avatar batch 7 busts        (gate §5.6 + fotos ya listas)
  W1: ch0 + ch1 paralelo (CSS)    (sin gate — palette ya lockeada)
  W2: ch2 Flash                   (gate §2.1 + §5.1)
  W3: ch4 AR/VR multi-layer       (gate §2.3 + §5.3)
  W4: ch5 Modern hero             (gate §2.4 + §5.4)
  W5: integración + manual checklist + sign-off
  ```

- **D4-09:** **Content readiness gate = checkpoint:human-input per wave** (NO hard gate global). Patrón ya validado en Phase 3 D3-08. Permite que ch0+ch1 (W1) y W5 (integración) avancen incluso si Rafael todavía no completó alguno de §2.1/§2.3/§2.4. Cada wave bloquea SU input específico al inicio; las demás continúan.

### Reduced Motion Policy (cross-cutting Phase 1 D-03 heredada)

- **D4-10:** **PRM heuristic por chapter** (Claude's discretion derivada de PRM policy locked):
  - Ch0 cursor parpadeante: bajo PRM, sin parpadeo (cursor estático).
  - Ch1 `<marquee>`: bajo PRM, swap a `<span>` estático centrado (D4-05).
  - Ch1 starfield CSS animado: bajo PRM, fondo estático (animation: none).
  - Ch4 parallax 4 capas: bajo PRM, todas las capas a `translateY(scrollProgress)` con factor 1.0 (sin diferencial = scroll natural sin depth effect).
  - Ch5 scroll-reveal cards: bajo PRM, instant render (sin fade+slide).
  - Avatar swap en crossfade ya es 200ms default / instant bajo PRM (Phase 1 Plan 03).

### A11Y-06 Alt Text Authoring

- **D4-11:** **Claude deriva drafts era-accurate; Rafael ratifica en W5 manual checklist.** Ejemplos del ch0 placeholder ("Rafael a los 10 años frente a un monitor CRT") son el target tone. Cada bust recibe:
  - ES: era + edad + contexto visual breve
  - EN: paridad enforced por test i18n.parity.test.js (Phase 2 W0)

  Rafael en W5 valida que las descripciones son fieles al bust generado.

### Claude's Discretion (gray areas no discutidas — research/planning resuelve)

- **Ch1 starfield implementation:** CSS-only animation con `background: radial-gradient` repetido + `animation: twinkle` keyframes, o canvas 2D minimal (~50 LOC). Recommended CSS-only (menor coste, sin JS extra). Planner decide.
- **Ch4 parallax scroll-progress source:** ya disponible vía `useScrollState.scrollProgress` (Phase 1 W2) o cada section calcula su propio `IntersectionObserver.intersectionRatio`. Recommended reusar `scrollProgress` global. Planner valida en research.
- **Pixelforge palette governance procedure:** ya locked en D3-06/D3-07 (Phase 3) — `chapters[N].palette` array replica §5 humano, cada call a pixelforge pasa `palette: chapter.palette` explícito. Planner aplica sin re-discusión.
- **Adobe MCP post-process per asset:** `image_remove_background`, `image_crop_and_resize`, `image_generative_expand` para tileable según necesidad. Planner spawnea artist-editor cuando el output de pixelforge necesite cleanup.
- **Ship sprites count en ch4:** 1, 2 ó 3 naves. Recommended 2 (suficiente para sensación de tráfico sin sobrecargar visualmente). Planner decide en plan.
- **Order de generación dentro del batch 7 busts (W0):** secuencial o paralelo en 1 call. Pixelforge no garantiza consistencia perfecta cross-call → secuencial con identity-anchors (D4-03) + palette-lock. Planner refina.
- **iOS smoke test para Phase 4:** Plan 07 (Phase 1) iOS deferred sigue siendo el bloqueador. Phase 4 NO añade nuevos gates iOS pero las features sensibles a Safari (ch4 parallax multi-layer translate, ch5 scroll-reveal IntersectionObserver, ch1 marquee) heredan el riesgo. Documentar mitigaciones preventivas en W5 a la espera de hardware/BrowserStack.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope + requirements
- `.planning/REQUIREMENTS.md` §ART (ART-02, ART-03, ART-04**, ART-07), §A11Y (A11Y-06), §THEME (ch0/ch1 ya complete; ch2/ch4/ch5 stubs a completar)
  - **ART-04 está mapeado a Phase 4 en Traceability pero su contenido ("elementos ambientales chapter 6 Phaser: ships, planetas, partículas") es Phase 5. Coverage notes: re-revisar mapping post-execute Phase 4 — los assets ch6 los genera Phase 5 cuando construya la escena.
- `.planning/ROADMAP.md` §"Phase 4: Chapters 0-2 + 4-5" — Goal + 4 Success Criteria
- `.planning/STATE.md` — current position + last activity + pending todos (Plan 03-05 deferred avatar batch)

### Phase 3 carry-forward (decisions de pixel art pipeline ya lockeadas)
- `.planning/phases/03-chapter-3-end-to-end/03-CONTEXT.md` — D3-01..D3-12 (especialmente D3-05/D3-06/D3-07/D3-08 pipeline avatar)
- `.planning/phases/03-chapter-3-end-to-end/CONTENT-CHECKLIST.md` — bio §1, proyectos §2.1/§2.3/§2.4 (Phase 4 needs ch2/4/5), contact §3, paletas §5.1/§5.3/§5.4/§5.6 (Phase 4 needs all of these)
- `.planning/phases/03-chapter-3-end-to-end/03-RESEARCH.md` — patterns 1-6 referenced from chapter-themes.css @layer components

### Phase 2 carry-forward (motor visual + i18n)
- `.planning/phases/02-theme-system-i18n/02-CONTEXT.md` — D2-01..D2-11 (D2-04 BackgroundLayers crossfade es la base para `--bg-image` per chapter; D2-07/D2-08 fonts ya self-hosted)
- `src/styles/chapter-themes.css` — 7 chapter blocks; ch0/ch1 completos, ch2-6 stubs (Phase 4 finaliza ch2/4/5; ch6 a Phase 5)

### Phase 1 carry-forward (mecánica scroll + PRM)
- `.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md` §"Reduced-Motion Policy" — D-01..D-06; **D-03 dicta crossfade entre eras ≤150ms bajo PRM**, aplica a parallax ch4 + scroll-reveal ch5.
- `src/composables/useScrollState.js` — `activeChapter`, `scrollProgress` reactive (Phase 4 ch4 parallax consume `scrollProgress`)
- `src/composables/usePRM.js` — `prefersReduced` (cada component nuevo Phase 4 lo consume via inject)

### Project / Stack
- `CLAUDE.md` — multi-agente, pixelforge-mcp + Adobe MCP, comunicación español, Windows 11 PowerShell 5.1, naming `ch{N}-{descriptor}[-{variant}].png` en `public/assets/`
- `.claude/agents/artist-creator.md` — pixelforge generation specialist
- `.claude/agents/artist-editor.md` — Adobe MCP post-processing specialist
- `.claude/agents/frontend-dev.md` — Vue 3/Phaser/Vite implementation specialist
- `.claude/agents/qa.md` — visual + functional verification
- `.claude/skills/crear-arte-pixelforge.md` — protocolo pixelforge (palette governance, prompt structure, error cases known)
- `.claude/skills/editar-arte-adobe.md` — Adobe MCP commands

### Photo references (Rafael — ya entregadas; Rafael nacido 1984)
- `public/references/2011.jpg` (~27) — anchor ch2 (~25) / ch3 (~29) + aging-down para ch0 (~11) / ch1 (~17)
- `public/references/2016.jpg` (~32) — anchor ch4
- `public/references/2019.jpg` (~35) — identity anchor auxiliar
- `public/references/2022.jpeg` (~38) — anchor ch5
- `public/references/2024.jpg` (~40) — identity anchor auxiliar
- `public/references/2026.jpg` (~42) — anchor ch6

**Privacy gate (D4-02):** estas rutas DEBEN entrar en `.gitignore` antes de W0 execute. Phase 6 deploy gate añade exclusión en `firebase.json`.

### Existing code (Phase 1+2+3 reusables)
- `src/data/chapters.js` — 7 chapter configs con `palette` field (ch0/ch1 lockeadas; ch2/3/4/5/6 PENDING §5)
- `src/data/projects.js` — array currently vacío; Phase 4 añade items ch2/4/5 (Phase 3 añadió ch3 placeholders pending §2.2)
- `src/data/bio.js` — solo `coreKey: 'bio.core'` (i18n resuelve texto; Phase 4 reusa misma key en los 5 chapters)
- `src/data/contact.js` — Phase 3 entrega; Phase 4 no toca
- `src/components/Chapter3Content.vue` — patrón de layout per-chapter (avatar lateral + bio + projects); Phase 4 lo replica con era-specific styling y components dedicados
- `src/components/ScrollShell.vue` — 7 sections v-for; Phase 4 inserta `<ChapterNContent v-if="ch.id === N">` per chapter completed (mismo patrón ch3)
- `src/components/BackgroundLayers.vue` (D2-04) — crossfade 2 capas era→era; consume `--bg-image` per chapter
- `src/composables/useBackgroundMorph.js` — orchestrator del crossfade

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useScrollState.scrollProgress`** (Phase 1 W2): float 0..1 reactive. Ch4 `<ParallaxLayers>` lo consume para `translateY(scrollProgress * factorPerLayer * sectionHeight)`.
- **`useBackgroundMorph` + `BackgroundLayers`** (Phase 2 W3): el crossfade del bg-image entre eras YA funciona; ch2/ch5 solo necesitan declarar `--bg-image` en su `[data-chapter="N"]` block.
- **`chapter-themes.css @layer components`**: la zona donde ProjectCard skeumorphic vive (Phase 3); Phase 4 añade variants per chapter (`[data-chapter="2"] .project-card { ... }`).
- **`Chapter3Content.vue` layout pattern**: 2-col desktop (aside meta + bio/projects) / stacked mobile. Phase 4 lo replica con variations era-auténticas en cada `Chapter{N}Content.vue`.
- **`StickyAvatar.vue` ya consume `chapters[activeChapter].avatarSrc`**: cuando W0 genere los 7 busts y los commitee a `public/assets/ch{N}-bust.png`, el StickyAvatar los renderiza automáticamente sin tocar el component.
- **i18n parity test** (`tests/i18n/parity.test.js`, Phase 2 W0): cada key nueva en `es.json` se enforza en `en.json` automáticamente. Phase 4 añade keys `chapters.N.flavor`, `projects.{pp2,pp4,pp5,...}.{title,desc}`, `avatar.busts.N.alt` (refinados).

### Established Patterns
- **`<section :data-chapter="N">` v-for en `ScrollShell.vue`**: pattern de inserción por chapter sin tocar shell. Phase 4 reemplaza `<div v-else class="chapter-placeholder">` con `<ChapterNContent v-else-if="ch.id === N" />` per chapter completado.
- **Provide/inject para shared state**: App.vue provee `scrollState`, `prm`, `bgMorph`. Components nuevos Phase 4 hacen `inject` (especialmente ParallaxLayers ch4 con `scrollState` + `prm`).
- **CSS Custom Props como vehículo de tematización**: ya escalado a 7 themes en chapter-themes.css. Phase 4 finaliza tokens reales (no stub) para ch2/4/5 cuando Rafael entregue §5.1/§5.3/§5.4.
- **Atomic commit per task**: `feat(04-NN):`, `test(04-NN):`, `docs(04-NN):`, `art(04-NN):` para assets pixel art committed.
- **Joins inline data**: `projects.filter(p => p.chapterEra === N)` directamente en `<ChapterNContent>` computed, sin helpers (D3-04 carry-forward).

### Integration Points
- **`src/components/ScrollShell.vue`**: añadir `<Chapter0Content>`, `<Chapter1Content>`, `<Chapter2Content>`, `<Chapter4Content>`, `<Chapter5Content>` montados condicionales en cada `<section>` cuando `ch.id === N`. Reemplaza el placeholder genérico.
- **`src/styles/chapter-themes.css`**:
  - `[data-chapter="2"]` / `[data-chapter="4"]` / `[data-chapter="5"]`: actualizar tokens finales (paletas §5.1/§5.3/§5.4) + añadir `--bg-image: url('/assets/chN-bg.png')` cuando los assets existan.
  - `@layer components`: añadir variants `[data-chapter="N"] .project-card { ... }` per era; añadir reglas para `.flash-banner`, `.floating-panel`, `.scroll-reveal-card`, `.terminal-scroll`, `.marquee-banner`.
- **`src/data/chapters.js`**: actualizar `palette` arrays para ch2/4/5 con §5.1/§5.3/§5.4 hex aprobadas; añadir opcional `bgImage` field si se prefiere data-driven en lugar de CSS-only.
- **`src/data/projects.js`**: añadir items ch2 (BlueLizard/Matte/Joju), ch4 (empresa AR/VR + Metrodigi), ch5 (BairesDev+number8+VivoEnVivo+RocketSnail+Remoose) con shape D3-03 locked.
- **`src/i18n/es.json` + `en.json`**: añadir keys de flavor text per chapter, project titles/descs, alt-text busts refinados (ratificados por Rafael en W5).
- **`public/assets/`**: directorios `public/assets/hero/` y `public/assets/parallax/` ya existen vacíos. Phase 4 popula con `ch{N}-bust.png` (×7), `ch2-bg.png`, `ch4-bg-stars-far.png` + 3 más, `ch5-hero.png`. Total artefactos pixel-art comiteados: ~13.
- **`.gitignore`**: añadir `public/references/` (privacy gate D4-02).

</code_context>

<specifics>
## Specific Ideas

- **6 fotos de referencia ya entregadas** en `public/references/{2011,2016,2019,2022,2024,2026}.{jpg,jpeg}` — esto cambia el pipeline original (D3-08 "1 foto ~30 derive 7 busts") a un pipeline mucho más constrained con anchors near-exactos para ch4-ch6 y aging-down/up de 2011.jpg (~27) para ch0-ch3 (D4-03). **Rafael nacido 1984.**
- **`<marquee>` real en ch1** — usar el tag deprecated a propósito. Era-accuracy gana sobre purismo HTML5 (D4-05).
- **Multi-layer parallax ch4** — vibe "AR/VR immersive" del PROJECT.md justifica el extra effort. 3-4 capas con factor escalonado (0.2/0.5/0.8/1.0) crea la sensación de profundidad espacial sin necesidad de WebGL.
- **Ch5 scroll-driven cards** — scroll-reveal con `IntersectionObserver` (no librería externa AOS/GSAP; ya hay anti-Lenis/Locomotive en REQUIREMENTS.md OUT OF SCOPE).
- **Skeumorphic Web 2.0 ProjectCard variants** — Phase 3 ya cargó la base en `chapter-themes.css @layer components`; Phase 4 extiende con `[data-chapter="N"] .project-card` overrides era-auténticos (gradient direction, accent color, border style).
- **Pink Parrot ch3 vs Pre-carrera ch0/1** — los chapters 0 y 1 no requieren proyectos explícitos (CONTENT-CHECKLIST §2.6); su contenido es flavor text bilingüe + components era-signature (terminal scroll, marquee banner) que cuentan la "niñez digital" + "pre-carrera tardío".

</specifics>

<deferred>
## Deferred Ideas

- **Ch6 escena Phaser + ship animation + planet click bridges** — Phase 5 scope (PHA-01..PHA-09). ART-04 listado en Phase 4 Traceability pero su contenido pertenece a Phase 5; el avatar ch6-bust SÍ se genera en Phase 4 W0 (D4-01) para Phase 5 heredarlo.
- **Mantra easter egg ch6 "And always show a smile"** (CON-04) — Phase 5 cuando exista la escena Phaser. Default revealed al llegar a ch6 (footer hidden hasta scroll).
- **iOS smoke test confirmatorio** — Phase 1 Plan 07 deferred. Phase 4 NO añade gates iOS pero las features ch4 parallax + ch5 scroll-reveal + ch1 marquee heredan riesgo. Mitigaciones preventivas documentadas en W5; verificación real diferida hasta hardware/BrowserStack.
- **Deploy + firebase.json + cache headers** (DEPLOY-01..04) — Phase 6. Mitigación de privacidad (`firebase.json` ignore glob para `public/references/`) se aplica en Phase 6 W0 — anotado en D4-02.
- **Era-authentic content forms beyond cards** (ch2 Flash actual SWF embed mock, ch5 actual Lottie animation embed) — REQUIREMENTS.md §v2 EAP-01 ya track. Phase 4 entrega cards skeumorphic + era-signature components; full Flash banners/Lottie diferido a v2.
- **Tercer idioma (PT-BR/FR)** — REQUIREMENTS.md §v2 I18N3-01. Phase 4 no toca; arquitectura escalable se mantiene.
- **Replan de ch3 con proyectos reales** — si Rafael completa `§2.2 Pink Parrot proyectos` en paralelo a Phase 4, el executor de W5 puede fold-in ch3 también (CONTENT-CHECKLIST aplica a todos los chapters). Opcional, NO scope crítico Phase 4.
- **Bento grids / glassmorphism / custom cursors / dark-light toggle / Lenis** — OUT OF SCOPE permanente (REQUIREMENTS.md).
- **ProjectCard hover lift en mobile** — Phase 3 deferred touch interaction polish; aplica también a Phase 4 cards era-auténticos.
- **Caveat StickyTimeline panel theming override** (Phase 2 follow-up) — opcional; si planner Phase 4 lo añade gana coherencia visual, si no, queda en :root estático. No blocking.

</deferred>

---

*Phase: 04-chapters-0-2-4-5*
*Context gathered: 2026-05-13*
