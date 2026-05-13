---
phase: 3
plan: 3
slug: wave2-chapter3-content-projectcard-skeumorphic
subsystem: frontend-components
tags: [chapter3, skeumorphic, web2, layout, tdd, i18n, CON-01, CON-02]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [Chapter3Content, ProjectCard, ScrollShell-ch3-integration]
  affects: [ScrollShell.vue, chapter-themes.css, es.json, en.json]
tech_stack:
  added: []
  patterns:
    - "@layer components para estilos skeumorphic (cascade theme-level sin scoped)"
    - "vi.mock @/data/projects con fixtures determinísticos para tests de filtro"
    - "computed(() => projects.filter(p => p.chapterEra === 3)) — D3-04 joins inline"
    - "v-if / v-else en ScrollShell v-for para integración selectiva ch3"
key_files:
  created:
    - src/components/Chapter3Content.vue
    - src/components/ProjectCard.vue
    - tests/components/Chapter3Content.test.js
    - tests/components/ProjectCard.test.js
  modified:
    - src/components/ScrollShell.vue
    - src/styles/chapter-themes.css
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/components/ScrollShell.test.js
decisions:
  - "D3-09 Opción A: avatar grande ch3 dentro de section (padding-left 160px desktop / 60px mobile); StickyAvatar Phase 1 sigue top-left invariante"
  - "D3-11: estilos skeumorphic en @layer components de chapter-themes.css (no <style scoped> en ProjectCard) para cascade theme-level y extensibilidad Phase 4"
  - "D3-12: mobile ch3 overflow-y: auto + height: auto abandona 100dvh strict; scroll-chaining nativo Chrome+Firefox"
  - "Inner <section> de Chapter3Content cambiados a <div> (auto-fix Regla 1): <section> anidados causaban que findAll('section') en theme-isolation.test.js retornara 8 en vez de 7, rompiendo el test THM-04. Semánticamente correcto — ch3-bio y ch3-projects son sub-contenido, no landmark sections."
  - "ScrollShell.test.js T4 actualizado: ahora espera 6 era-titles (ch3 usa Chapter3Content, no placeholder)"
  - "ui.openProject añadido a es.json + en.json para evitar [missing:] marker en dev"
metrics:
  duration: "~65 minutos"
  completed: "2026-05-13T22:18:37Z"
  tasks_completed: 2
  files_changed: 9
---

# Phase 3 Plan 3: Chapter3Content + ProjectCard Skeumorphic Web 2.0 — Summary

**One-liner:** Layout 2-col desktop/stacked mobile para ch3 con avatar bust, bio i18n y ProjectCards skeumorphic Web 2.0 (gradients glossy + embossed + drop shadows) integrado via v-if en ScrollShell.

## Objective Achieved

El plan 03-03 entrega el "landing polished" del chapter 3 (Web 2.0, 2013):

- **Chapter3Content.vue**: layout 2-col desktop (D3-09 Opción A) + stacked mobile + scroll-chaining nativo (D3-12). Avatar bust (`/assets/ch3-bust.png`, pendiente Plan 03-05) + bio + ProjectCards filtrados por `chapterEra === 3`.
- **ProjectCard.vue**: tarjeta reusable (shape D3-03) con estilos skeumorphic Web 2.0 (D3-11). Sin `<style scoped>` — CSS en `@layer components`.
- **ScrollShell.vue**: integración via `v-if="ch.id === 3"` — las otras 6 sections mantienen el placeholder Phase 1 verbatim.
- **chapter-themes.css `@layer components`**: poblado con `.project-card`, `.project-card-title`, `.project-card-desc`, `.project-card-role`, `.project-card-tech`, `.project-card-link` con valores D3-11 verbatim.

## Commits

| Hash | Tipo | Descripción |
|------|------|-------------|
| `962095d` | test RED | Tests ProjectCard (11 tests — RED phase) |
| `3525e2d` | feat GREEN | ProjectCard.vue + @layer components + ui.openProject |
| `842d5e6` | test RED | Tests Chapter3Content (15) + ScrollShell integration (3) |
| `6bde5a7` | feat GREEN | Chapter3Content.vue + ScrollShell v-if ch3 integration |

## Test Coverage

| Archivo | Tests añadidos | Cobertura |
|---------|---------------|-----------|
| `tests/components/ProjectCard.test.js` | 15 | props validation, title/desc i18n, link conditional, T-CON-03, CSS skeumorphic markers, reactive Pitfall 3, role/techStack conditional |
| `tests/components/Chapter3Content.test.js` | 15 | DOM contract, avatar img src+alt, bio render, projects filter (mock 2 ch3+1 ch4 → 2 cards), reactive Pitfall 3, CSS layout D3-09+D3-12 |
| `tests/components/ScrollShell.test.js` | +3 nuevos | Chapter3Content en section[data-chapter=3]; placeholder en sections 0,1,2,4,5,6 |

**Suite pre-plan:** 182 tests verdes
**Suite post-plan:** 216 tests verdes (+34 nuevos)

## Requirement Coverage

| Requirement | Status | Componente |
|-------------|--------|-----------|
| CON-01 (bio renderizada en ch3 era-styled) | COVERED | Chapter3Content.vue → t(bio.coreKey) con fuente Lobster Web 2.0 |
| CON-02 (proyectos Pink Parrot ch3) | COVERED | ProjectCard.vue skeumorphic + filter chapterEra===3 |
| T-CON-03 (open redirect protection) | COVERED | `rel="noopener noreferrer" target="_blank"` en ProjectCard link; test T4 lo verifica |

## Decisions Made

1. **D3-09 Opción A LOCKED**: avatar grande dentro de section `padding-left: 160px` desktop / `60px` mobile. StickyAvatar Phase 1 sigue visible top-left. Dos avatares simultáneos intencional.

2. **D3-11 LOCKED — CSS en @layer components**: ProjectCard NO tiene `<style scoped>`. Los estilos viven en `chapter-themes.css` `@layer components` para que los CSS Custom Props del theme ch3 (`--c-accent: #ff6699`) apliquen via cascade sin re-declarar. Phase 4 puede declarar variants per chapter.

3. **D3-12 LOCKED — scroll-chaining nativo**: mobile `.ch3-content { overflow-y: auto; max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px)) }`. Al agotar el scroll interno, el browser propaga al outer snap shell. Verificación manual Chrome+Firefox requerida (W5 smoke test). iOS Safari deferred (precedente Plan 07).

4. **Inner sections → divs (Auto-fix Regla 1)**: `<section class="ch3-bio">` y `<section class="ch3-projects">` cambiados a `<div>` para que `findAll('section')` en `ScrollShell.theme-isolation.test.js` retorne correctamente 7 secciones. THM-04 pasa. Semánticamente correcto: son sub-contenido de ch3, no landmark sections independientes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Regla 1 - Bug] Inner `<section>` causaban regresión en theme-isolation.test.js**

- **Encontrado durante:** Task 3.2 GREEN (primera ejecución de tests)
- **Problema:** Chapter3Content.vue usaba `<section class="ch3-bio">` y `<section class="ch3-projects">`. `findAll('section')` en ScrollShell.theme-isolation.test.js retornaba 8 secciones (7 outer + 1 ch3-bio interna), rompiendo THM-04 T1 (espera 7). También T2 fallaba porque el ancestor `section[data-chapter="3"]` contiene sub-sections.
- **Fix:** Cambiar `<section>` internos de Chapter3Content a `<div>` manteniendo las mismas clases. Semánticamente correcto (sub-contenido, no landmarks).
- **Archivos modificados:** `src/components/Chapter3Content.vue`, `tests/components/Chapter3Content.test.js` (comentario de documentación)
- **Commit:** `6bde5a7`

**2. [Regla 1 - Bug] ScrollShell.test.js T4 contaba 7 era-titles pero ch3 ya no tiene placeholder**

- **Encontrado durante:** Task 3.2 GREEN (primera ejecución de tests)
- **Problema:** El test original esperaba 7 `.era-title` (uno por chapter). Después de integrar `Chapter3Content`, ch3 ya no renderiza el placeholder `.era-title`, solo 6 sections no-ch3 lo tienen.
- **Fix:** Actualizar el test para esperar 6 era-titles, con comentario explicando que ch3 usa `Chapter3Content` (Wave 2, Plan 03-03).
- **Archivos modificados:** `tests/components/ScrollShell.test.js`
- **Commit:** `6bde5a7`

## Placeholder Mode (Estado actual)

| Item | Estado | Cuándo se resuelve |
|------|--------|--------------------|
| Avatar `/assets/ch3-bust.png` | BROKEN-IMAGE — img en DOM con src correcto, alt text i18n provee fallback | Plan 03-05 (pixel art batch) |
| Bio `t('bio.core')` | Renderiza "PENDING — CONTENT-CHECKLIST §1.1" | Rafael llena es.json §bio.core |
| Proyectos `projects.filter(chapterEra===3)` | Array vacío → `.ch3-projects` NO renderiza (v-if guard) | Rafael llena projects.js + i18n §2.2 |
| `avatar.busts.3.alt` | EXISTE en es.json + en.json (Phase 2 W0, verificado pre-step) | Ya disponible |

## Security Surface (T-CON-03)

ProjectCard `<a>` con `project.link` lleva `rel="noopener noreferrer" target="_blank"` verbatim. Test T4 lo verifica automáticamente. T-XSS-CONTENT mitigado via `{{ t(...) }}` interpolation (no `v-html`).

## Pending para Planes Siguientes

- **Plan 03-04** (ya completado, Wave 1): SEO via `@unhead/vue` — `useHead` en App.vue con title/desc por locale, og meta, hreflang, JSON-LD Person.
- **Plan 03-05** (Wave 3): Generar pixel art batch 7 avatar busts via pixelforge-mcp. Incluye `ch3-bust.png` → cierra el broken-image gap. También reemplaza placeholder StickyAvatar con imagen real.
- **Phase 4**: Consolidar arrays duplicados (ScrollShell/StickyTimeline vs @/data/chapters), reemplazar placeholder de las otras 6 sections chapter por chapter, añadir ProjectCards ch2/ch4/ch5.

## D3-12 Cross-browser Status

- Chrome + Firefox: verificación manual requerida (W5 smoke test — `npm run dev` → mobile 375×667 emulation → scroll interno `.ch3-content` → verificar scroll-chaining al capítulo siguiente cuando se agota)
- iOS Safari: DEFERRED — precedente Phase 1 Plan 07 (Rafael no tiene hardware iOS ni BrowserStack). Si Rafael consigue acceso, smoke test manual.
- Fallback D3-12.alt (line-clamp 6 + "leer más" button): NO implementado. Se implementa SOLO si Chrome/Firefox fallan en el smoke test manual.

## Self-Check

### Archivos creados — verificación

- `src/components/Chapter3Content.vue`: EXISTE
- `src/components/ProjectCard.vue`: EXISTE
- `tests/components/Chapter3Content.test.js`: EXISTE
- `tests/components/ProjectCard.test.js`: EXISTE

### Archivos modificados — verificación

- `src/components/ScrollShell.vue`: importa Chapter3Content + v-if ch.id===3
- `src/styles/chapter-themes.css`: @layer components poblado con .project-card*
- `src/i18n/es.json` + `en.json`: ui.openProject añadido con paridad

### Suite final

216 tests verdes | 31 test files | 0 regresiones | build verde (CSS 13.25KB, JS 158.23KB)

## Self-Check: PASSED
