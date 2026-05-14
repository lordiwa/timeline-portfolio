# Phase 4: Chapters 0-2 + 4-5 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 04-chapters-0-2-4-5
**Areas discussed:** Avatar batch handoff, Era-authentic UI per chapter, Background art format por chapter, Wave strategy + content readiness gate

---

## Avatar batch handoff

| Option | Description | Selected |
|--------|-------------|----------|
| Batch 7 completo en Phase 4 (Recommended) | Reactivar Plan 03-05 como W0 de Phase 4: generar los 7 busts juntos para garantizar consistencia visual del personaje. Phase 5 hereda ch6-bust ya hecho. Requiere foto + §5.6 antes de execute. | ✓ |
| Solo busts Phase 4 (ch0/1/2/4/5) | Phase 4 solo genera 5 busts (los chapters que owna). Ch3-bust queda en Plan 03-05 deferred separado; ch6-bust se genera en Phase 5. Menos consistencia cross-batch. | |
| Esperar a foto + §5.6 antes de decidir | Pausa la planificación del avatar hasta que Rafael complete paleta humana y suba la foto. | |

**User's choice:** Batch 7 completo en Phase 4.
**Notes:** Locked como D4-01. ART-01 se reasigna formalmente a Phase 4 (Traceability update post-execute). Phase 5 (ch6) hereda ch6-bust ya hecho y se concentra solo en escena Phaser.

---

## Avatar inputs (follow-up Avatar batch)

| Option | Description | Selected |
|--------|-------------|----------|
| Listos ya — puedo subirlos antes de planificar | Rafael compromete a tener foto en `public/assets/.refs/rafael-age30.{jpg,png}` + entry .gitignore + paleta humana en CONTENT-CHECKLIST §5.6 antes de plan-phase / execute. | |
| Gate de Phase 4 execute (checkpoint:human-input) | El planner mete un checkpoint:human-input al inicio de W0. Si Rafael no completó, la wave bloquea; las CSS-only y content authoring siguen en paralelo. | |
| Foto ya está; falta solo paleta humana | Rafael ya tiene la foto pero la paleta §5.6 quiere aprobarla cuando vea el primer bust de prueba. | |
| **Custom (Rafael)** — "i added to /public/references/ (2011, 2016, 2019, 2022, 2024, 2026) i dont have earlier it can be simulated using the asset generation tool we are using" | Rafael ya entregó 6 fotos cubriendo 2011→2026; ch0/ch1 (~10/~15-18) se derivan aging-down de 2011 (~24) vía pixelforge. | ✓ |

**User's choice:** Custom — 6 fotos ya entregadas.
**Notes:** Cambia el pipeline original D3-08 ("1 foto ~30 → derive 7 busts") a uno mucho más constrained con anchors near-exactos. Mapping locked como D4-03 (foto-a-bust por proximidad de edad).

---

## Privacy fotos (follow-up Avatar inputs)

| Option | Description | Selected |
|--------|-------------|----------|
| Mover a /references/ raíz + .gitignore (Recommended) | git mv public/references → references/ root. Vite NO sirve archivos fuera de public/. Pixelforge MCP las lee por path absoluto. Cero exposición. | |
| Dejar en public/references/ + solo .gitignore | Mantiene path actual + .gitignore para no commitear. Vite las sigue sirviendo en dev local; en producción NO porque firebase deploy parte de checkout limpio. Hueco solo en dev local de Rafael. | ✓ |
| Públicas a propósito (sin mitigación) | Rafael decide que es OK que las 6 fotos sean públicas. Se commitean y deployan. | |

**User's choice:** Dejar en public/references/ + solo .gitignore.
**Notes:** Locked como D4-02. Caveat para Phase 6: si despliega desde working tree con fotos presentes, Vite las copia a `dist/`. Mitigación a aplicar en Phase 6: glob de exclusión en `firebase.json` o el deploy script borra `dist/references/` antes.

---

## Era-authentic UI per chapter

| Option | Description | Selected |
|--------|-------------|----------|
| Alto — components dedicados por era (Recommended) | Ch0 terminal scroll + cursor parpadeante; ch1 <marquee>+tablas+starfield+Comic; ch2 Flash banner skeumorphic; ch4 floating panels + parallax depth + ships; ch5 scroll-driven Lottie-style. ProjectCard variants per chapter. Volumen: 5-7 components nuevos. | ✓ |
| Medio — 1-2 components signature por chapter | Cada chapter agrega 1-2 era-signature; ProjectCard compartido recibe solo override de tokens. Volumen: 1-2 components por chapter. | |
| Mínimo — solo theming via tokens | ProjectCard idéntico estructuralmente; solo CSS overrides cambian. Pixel art bgs dan toda la identidad. | |

**User's choice:** Alto — components dedicados.
**Notes:** Locked como D4-04. Componentes confirmados: `TerminalScroll`, `MarqueeBanner`, `FlashBanner`, `FloatingPanel`, `ParallaxLayers`, `ScrollRevealCard`. Planner refina naming/cantidad. D4-05 captura el sub-decision de usar `<marquee>` real (deprecated) por era-authenticity, con A11Y-04 compensation: contenido marquee es flavor text NO crítico.

---

## Background art format por chapter

| Option | Description | Selected |
|--------|-------------|----------|
| Ch2 flat 1 capa / ch4 multi-layer 3-4 / ch5 1 capa hero (Recommended) | Ch2 full-frame banner+browser chrome; ch4 deep stars/panels/ships parallax con factor escalonado; ch5 hero minimalista. Total ~5-6 assets. | ✓ |
| Todos full-frame estático (1 capa each) | Ch2/4/5 con 1 background. Parallax reducido a CSS bg-position. Pierde 'AR/VR immersive feel' de ch4. Total 3 assets. | |
| Ch2 1 capa / ch4 multi-layer 3-4 / ch5 multi-layer 2-3 (máximo) | Idem A pero ch5 también multi-layer. Total ~7-8. Más riesgo inconsistencia pixelforge cross-call. | |

**User's choice:** Ch2 flat / ch4 multi-layer / ch5 hero 1 capa.
**Notes:** Locked como D4-06. D4-07 captura el sub-decision: ch4 multi-layer parallax vive DENTRO del `<section data-chapter="4">` (4 divs absolute positioned + translateY scroll-driven), NO en BackgroundLayers global. Ch2 y ch5 sí pueden usar `--bg-image` Custom Prop que BackgroundLayers crossfade hereda.

---

## Wave strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Por tipo: avatars → CSS-only → art-heavy (Recommended) | W0 batch 7 busts. W1 ch0+ch1 paralelo CSS-only. W2 ch2 flat. W3 ch4 multi-layer. W4 ch5 hero. W5 integración + a11y + checklist. | ✓ |
| Por chapter en orden cronológico | W0 avatars. W1 ch0. W2 ch1. W3 ch2. W4 ch4. W5 ch5. W6 integración. Pierde paralelización natural de ch0+ch1. | |
| All-in batch — 5 chapters en paralelo | W0 avatars. W1 todos los 5 chapters paralelos. W2 integración. Máxima velocidad pero alto riesgo de conflictos en chapter-themes.css y i18n keys. | |

**User's choice:** Por tipo.
**Notes:** Locked como D4-08. Wave gantt: W0(avatars) → W1(ch0+ch1 paralelo, sin gate) → W2(ch2, gate §2.1+§5.1) → W3(ch4, gate §2.3+§5.3) → W4(ch5, gate §2.4+§5.4) → W5(manual checklist + sign-off).

---

## Content readiness gate

| Option | Description | Selected |
|--------|-------------|----------|
| Checkpoint:human-input por wave (Recommended) | Cada wave bloquea su gate al inicio; las CSS-only avanzan sin gate. Patrón D3-08 ya validado. | ✓ |
| Hard gate antes de execute completo | Plan-phase verifica todo el CONTENT-CHECKLIST Phase 4 antes de execute. Mata paralelización con producción de contenido. | |
| Solo gate avatares; resto fluye con placeholders | W0 sí bloquea; las demás arrancan con placeholders 'PENDING — CONTENT-CHECKLIST §N'. PASS-with-deferred-content. | |

**User's choice:** Checkpoint:human-input por wave.
**Notes:** Locked como D4-09. Permite que ch0+ch1 (W1) y W5 (integración) avancen incluso si Rafael falta algún §2.1/§2.3/§2.4. Cada wave bloquea SU input específico al inicio.

---

## Claude's Discretion

- **D4-03 Foto-a-bust mapping** por proximidad de edad — derivable sin discusión adicional (2011→ch2/ch3 aging-down, 2016→ch4, 2022→ch5, 2026→ch6; ch0/ch1 simulados aging-down de 2011).
- **D4-10 PRM heuristic per chapter** — derivado de Phase 1 D-03 policy: ch0 cursor sin parpadeo; ch1 marquee swap a `<span>` estático + starfield estático; ch4 parallax con factor 1.0 uniforme (sin diferencial); ch5 scroll-reveal instant render; avatar swap ya 200ms default / instant PRM.
- **D4-11 A11Y-06 alt text** — Claude deriva drafts era-accurate ES/EN; Rafael ratifica en W5 manual checklist.
- **Ch1 starfield implementation** — recommended CSS-only `radial-gradient` + animation (no canvas 2D).
- **Ch4 parallax scroll-source** — recommended reusar `useScrollState.scrollProgress` global.
- **Pixelforge palette governance** — locked en D3-06/D3-07 carry-forward; cada call pasa `palette: chapter.palette` explícito.
- **Adobe MCP post-process per asset** — bg removal/crop/expand según necesidad, planner spawnea artist-editor.
- **Ship sprites count ch4** — recommended 2 naves.
- **Order de generación dentro de W0 batch** — secuencial con identity-anchors (D4-03) + palette-lock, no paralelo.
- **iOS smoke test Phase 4** — sin nuevos gates pero documentar mitigaciones preventivas en W5.

## Deferred Ideas

- **Ch6 escena Phaser** (PHA-*) — Phase 5. Solo ch6-bust se genera en Phase 4 W0.
- **Mantra easter egg ch6** (CON-04) — Phase 5.
- **iOS smoke test confirmatorio** — Phase 1 Plan 07 deferred sigue bloqueado.
- **Deploy + firebase.json glob exclusión `public/references/`** — Phase 6 (mitigación de privacidad D4-02).
- **Replan ch3 con proyectos reales §2.2** — opcional fold-in en W5 si Rafael completa en paralelo.
- **Era-authentic content forms beyond cards** (Flash SWF mock, Lottie embed) — REQUIREMENTS v2 EAP-01.
- **Tercer idioma PT-BR/FR** — REQUIREMENTS v2 I18N3-01.
- **StickyTimeline panel theming override per chapter** — caveat Phase 2 redesign, opcional.
- **ProjectCard hover lift mobile touch polish** — diferido (también desde Phase 3).
- **OUT OF SCOPE permanente**: bento grids, glassmorphism, custom cursors, dark/light toggle, Lenis/Locomotive, Vue Router, Pinia.
