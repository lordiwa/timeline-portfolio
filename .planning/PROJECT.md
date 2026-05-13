# mato-new-portfolio

## What This Is

Portafolio personal de Rafael Matovelle estructurado como un **viaje vertical en el tiempo**. El visitante hace scroll vertical y recorre 7 chapters cronológicos (1995 → 2026); dos anclajes sticky permanecen visibles durante todo el scroll: el avatar pixel-art bust en la esquina superior izquierda (que swappea entre 7 busts según el chapter activo, mostrando el envejecimiento ~10 → 40 años) y una timeline horizontal en la parte inferior con un marcador móvil que indica año + era + chapter activo. El contenido del medio scrollea y el background morfea entre eras al cambiar de chapter. Apunta primariamente a recruiters internacionales (US/EU/Canadá) y secundariamente a la comunidad gamedev / clientes potenciales para gigs.

## Core Value

Que un visitante mueva el scroll, vea el sitio transformarse, y **entienda en 30 segundos sin leer una sola viñeta de CV** que está mirando a alguien que vivió tres décadas de tecnología y cuyas habilidades convergen en algo único.

Si todo lo demás falla — esto debe funcionar.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Mecánica & estructura**
- [ ] Scroll vertical con snap suave por chapter (7 chapters)
- [ ] 7 chapters cronológicos con estilos visuales distintivos (mapeo en *Context*)
- [ ] Avatar pixel art bust **sticky top-left** que swappea según chapter activo (envejecimiento ~10 → 40 años; 7 busts, un solo slot de display)
- [ ] **Timeline sticky bottom** con marcador móvil + año/era visible + click-to-navigate (reemplaza los dots clásicos)
- [ ] Background morfea entre eras al cambiar de chapter
- [ ] Default landing en chapter 3 (Web 2.0 + arte digital — el visitante ve algo pulido al entrar)

**Contenido**
- [ ] Bio core presente en los 7 chapters, renderizada según el estilo de cada uno
- [ ] Proyectos destacados rotativos por chapter (el chapter muestra los proyectos de su era)
- [ ] Datos de contacto + redes accesibles desde cualquier chapter (overlay fijo o footer persistente)
- [ ] Mantra "And always show a smile" presente narrativamente

**Internacionalización**
- [ ] Toggle ES/EN con copies pulidos en ambos idiomas (no auto-translate)
- [ ] Estado del idioma persiste durante navegación entre chapters

**Pixel art (generado vía pixelforge)**
- [ ] Fondos por chapter (chapters 2–6)
- [ ] Elementos ambientales: naves espaciales, planetas, parallax layers (chapters 4–6)
- [ ] 7 retratos bust del avatar (uno por chapter)

**Chapter 6 (Phaser)**
- [ ] Escena explorable en Phaser con parallax, naves cruzando, planetas/asteroides como "proyectos navegables"
- [ ] Sin character animation, sin gameplay con objetivos/score

**Compatibilidad**
- [ ] Desktop fluido (mouse wheel + swipe pad → scroll vertical natural)
- [ ] Mobile portrait y landscape ambos funcionales (touch swipe vertical nativo; layout sticky responde a la orientación)

**Deploy**
- [ ] Build local funcionando primero; deploy a Firebase Hosting cuando esté listo

### Out of Scope

- **Character animation pixel art** — limitación documentada de pixelforge: frames incoherentes entre generaciones. No se intentará animar personajes caminando o gesticulando.
- **Gameplay con objetivos/score en chapter 6** — sin NPCs animados, forzar gameplay sería artificial. La escena es exploración ambiente, no juego.
- **CMS / backend dinámico** — el contenido es estático en v1. No hay panel de admin, no hay edición runtime.
- **Blog / artículos largos** — el formato del sitio no calza con lectura larga. Si Rafael publica, será en otra plataforma con link desde aquí.
- **Modo accesibilidad alternativo "linealizado"** — el sitio es deliberadamente experiencial; un modo "CV plano" debilitaría el concepto. Si surge presión por accesibilidad real (lectores de pantalla), se evaluará después.

## Context

### Quién es Rafael (relevante para el contenido)
Full Stack Engineer + QA Specialist en Quito, Ecuador. ~17 años de carrera atravesando:
- **2009–2013**: Flash Gameplay Programmer (BlueLizard, Matte CG, Joju Games)
- **2013–2015**: UX Designer + Web Dev + Team Leader en Pink Parrot
- **2015–2018**: Empresa propia AR/VR aplicada a publicidad
- **2017–2019**: Software Engineer en Metrodigi
- **2019–2024**: Copropietario VivoEnVivo (streaming de deportes)
- **2019–2022**: Lead QA Engineer en number8
- **2022–2023**: QA Analyst R&D en BairesDev (Python, AWS)
- **2023**: Front End Lead en RocketSnail (Vue + Lottie framework custom)
- **2023–2026**: Full Stack en Remoose Interactive (Vancouver)
- **2023–presente**: QA Specialist en Software Mind North America (data science automation)

Aptitudes destacadas: Front-End Development · Team Leadership · Prompt Engineering. Bilingüe nativo ES/EN.

### Mapeo de chapters
| # | Edad / Año | Era visual | Chapter de carrera | Necesita pixel art |
|---|------------|------------|-------------------|--------------------|
| 0 | ~10 (1995) | Terminal / server output, monoespaciado verde | Pre-carrera (niñez digital) | No (CSS puro) |
| 1 | ~15–18 (2001–2004) | HTML 90s crudo: tablas, `<marquee>`, comic sans, fondo estrellado | Pre-carrera tardío | No (CSS puro) |
| 2 | ~22 (2009) | Flash era: banners vector, gradientes, retro UI | BlueLizard / Matte / Joju (Flash Gameplay Programmer) | Sí (fondos + UI retro) |
| 3 | ~26 (2013) | Web 2.0: rounded corners, glossy, **arte digital entra**. **Default landing.** | Pink Parrot (UX + Web Dev + Team Leader) | Sí (fondos + decoraciones) |
| 4 | ~30 (2015–2018) | Immersive AR/VR feel: paneles flotantes, parallax profundo, naves en background | Empresa propia AR/VR + Metrodigi | Sí (fondos espaciales + naves) |
| 5 | ~36 (2022–2023) | Modern animated: scroll-driven, Lottie-style, micro-interacciones, parallax suave | BairesDev / number8 / VivoEnVivo / RocketSnail / Remoose | Sí (fondos + elementos animados) |
| 6 | 40 (2026) | **Phaser escena explorable**: parallax vertical descendente, naves cruzando, planetas-proyecto distribuidos verticalmente | Software Mind QA + AI (convergencia) | Sí (fondos + ships + planetas + UI ambiente) |

### Tono del copy
Cálido-juguetón con humor sutil. Alineado con el cierre del LinkedIn de Rafael: *"And always show a smile"*. Profesional pero no acartonado. Chapters tempranos pueden permitirse más nostalgia/broma gamer; chapters maduros más reflexivos. Nunca corporate seco.

### Stack & herramientas
- **Frontend**: Vue 3 (Composition API) + Vite 5
- **Motor de juego (chapter 6 only)**: Phaser 3.86 (ESM, sin TypeScript)
- **Generación de pixel art**: pixelforge-mcp (Gemini `nano-banana-2`)
- **Post-proceso de assets**: Adobe MCP (no genera arte, solo edita)
- **Resolución virtual**: 480×270 base, zoom ×3, `pixelArt: true`, `image-rendering: pixelated`
- **Sistema multi-agente**: planner → artist-creator → artist-editor → frontend-dev → qa (ya configurado en `.claude/agents/`)

### Audiencia
- **Primaria**: recruiters internacionales (US / EU / Canadá). Justificación: Rafael ya trabaja remoto para NA (Software Mind NA, Remoose Vancouver).
- **Secundaria**: founders / clientes potenciales para gigs + comunidad gamedev (relevante dado el historial Flash/AR-VR/Phaser).

## Constraints

- **Tech stack**: Vue 3 + Vite + Phaser 3.86 — decisión cerrada, scaffold ya andamiado
- **Generación de arte**: pixelforge-mcp (Gemini) — NO character animation (limitación documentada en CLAUDE.md)
- **Resolución**: 480×270 con zoom ×3 — todo el arte debe respetar el grid pixel-perfect
- **Mobile**: portrait y landscape ambos soportados; layout sticky (avatar top-left + timeline bottom) responde a la orientación sin overlay bloqueante
- **Hosting**: Firebase Hosting (eventual) — desarrollo 100% local por ahora, deploy diferido
- **Timeline**: sin deadline duro — ritmo iterativo sostenible, prioridad calidad sobre velocidad
- **Idiomas**: ES y EN con paridad — no se acepta traducción de cortesía o auto-translate
- **OS desarrollo**: Windows 11 + PowerShell 5.1 — comandos y paths deben respetar esto
- **Comunicación con Claude**: en español (preferencia del usuario)

## Key Decisions

| Decisión | Rationale | Outcome |
|----------|-----------|---------|
| Timeline cronológico (joven → 40) en lugar de slider abstracto "nivel de tecnología" | Concepto temporal es más legible, emocional y narrativamente coherente. La cara que envejece da anchor visual. | — Pending |
| Snap suave por chapter vs scroll continuo interpolado | Cada chapter es una "escena" definida; más legible, más mantenible, evita complejidad de morphing CSS entre estilos radicalmente distintos. | — Pending |
| Chapters 0–1 sin pixel art (HTML/CSS puro) | Reduce volumen de arte a generar (~28% del scope); encaja narrativamente con la era pre-pixel-art (terminal y HTML crudo). | ✓ Good |
| Phaser chapter 6 como escena explorable vertical, no juego con objetivos | Sin character animation viable (pixelforge no produce frames coherentes), forzar gameplay con NPCs sería artificial. Parallax vertical descendente + ships + planetas-proyecto mantiene el "wow" sin ese requisito. | — Pending |
| Pivote a scroll vertical con avatar sticky top-left + timeline sticky bottom (era: horizontal) | Vertical es scroll nativo en mobile (portrait y landscape ambos OK sin overlay bloqueante), accesible y bien soportado en iOS (evita WebKit bug #243582 que afectaba momentum horizontal). La novedad visual se concentra en los dos anclajes sticky (avatar morphing + timeline scrubber) en vez de en el eje de scroll inusual. | ✓ Good (2026-05-12) |
| Default landing en chapter 3 (Web 2.0 + arte digital) | Visitante ve algo pulido y "normal" al entrar; la timeline sticky bottom invita a moverse. Quien no toca nada igual ve un portafolio decente. | — Pending |
| Bilingüe ES/EN con toggle real, sin auto-translate | Audiencia mixta US/EU/Canadá + LatAm/gamedev community; ambos copies merecen pulido. | — Pending |
| Audiencia primaria recruiters NA/EU + secundaria gamedev/founders | Roles remotos NA actuales + historial gamedev/AR-VR relevante para community y gigs. | — Pending |
| Tono cálido-juguetón con humor sutil, alineado con "always show a smile" | Refleja la personalidad documentada de Rafael; encaja con el formato experiencial del sitio. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-12 — pivote a vertical + sticky avatar/timeline; portrait mobile habilitado*
