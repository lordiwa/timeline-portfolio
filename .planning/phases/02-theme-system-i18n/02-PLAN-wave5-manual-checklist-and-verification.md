---
phase: 02-theme-system-i18n
plan: 06
slug: wave5-manual-checklist-and-verification
wave: 5
type: execute
mode: mvp
autonomous: false
gap_closure: false
requirements: [THM-04, THM-05, I18N-05, A11Y-04]
depends_on: [1, 2, 3, 4, 5]
files_modified:
  - .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
notes:
  depends_on_rationale: >
    W5 (Plan 06) lista los 5 plan numbers anteriores (1=W0, 2=W1, 3=W2, 4=W3, 5=W4) en
    depends_on explícitamente, no por convención. Cada wave previo aporta un dimension al
    manual checklist: W0+W1 (i18n end-to-end → §3 layout shift mobile), W2 (themes →
    §1 theme bleed + §4 contrast audit), W3 (bg morph → §2 sync con avatar), W4 (fonts
    → §5 FOUT/FOIT + §5 Latin Extended glyph coverage). Sin TODOS, el checklist no
    puede ejecutar significativamente.
  latin_extended_coverage: >
    W5 §5 incluye una sub-task "Latin Extended glyph coverage" que verifica Open-Q2-E
    (ñ, á, é, í, ó, ú, ü, ¿, ¡) con sample string ES visualmente — NO hay test
    programático en W4 que decode .woff2 con fontkit. Sample string locked:
    "Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida".
    Si aparece tofu (□) en algún chapter → bug a Phase 3 / rollback de ese font.
must_haves:
  truths:
    - "Existe `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` con secciones derivadas de VALIDATION.md `Manual-Only Verifications` table"
    - "El checklist cubre las 6 dimensiones que NO se pueden verificar programáticamente: theme bleed visual durante smooth-scroll (THM-04 visual), background morph crossfade sync con avatar (D2-04 + D2-05), layout shift al toggle ES↔EN en mobile portrait (I18N-05 + CLS), contrast values reales verificados con axe DevTools / Pa11y / Lighthouse contra los `/* contrast(fg,bg) = X:Y */` documentados inline (THM-05 + A11Y-04), FOUT/FOIT en primer load + Latin Extended glyph coverage Open-Q2-E (D2-08 fonts pipeline) bajo network throttling, A/B visual 200ms vs 300ms bg morph (Open-Q2-B locked 200ms — re-validar), cross-browser cross-check final UI-SPEC §14"
    - "Cada item del checklist tiene: descripción del comportamiento esperado, instrucciones precisas de how-to-test (DevTools panel, URL, comando), criterio de PASS/FAIL, opción de mitigation si FAIL"
    - "El checklist incluye un `## Test Environment` block con: browser + version, DevTools mobile emulator preset (375×667 iPhone SE), assumptions del runtime (sin hardware iOS real — Rafael NO posee iOS device per memoria `rafael-no-ios-device`)"
    - "Sub-task de Latin Extended glyph coverage en §5 (Open-Q2-E verificación deferred desde W4 — verifica sample string ES en los 7 chapters sin tofu)"
    - "El checklist incluye un `## Sign-Off` block donde Rafael marca PASS/FAIL por sección y firma con timestamp + browser usado; failing items linkean a deferred plans o gap closure remediation"
  artifacts:
    - path: .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
      provides: "Manual visual + a11y + perf checklist con ≥6 secciones; usado por Rafael antes de /gsd-verify-work 2"
      contains: "Manual Checklist"
  key_links:
    - from: .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
      to: .planning/phases/02-theme-system-i18n/02-VALIDATION.md
      via: "Cada item del checklist deriva de una row de VALIDATION.md `Manual-Only Verifications` table"
      pattern: "VALIDATION"
    - from: .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
      to: .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §14
      via: "El checklist incorpora todos los items del `Phase 2 Visible Verification Checklist` de UI-SPEC §14"
      pattern: "UI-SPEC"
    - from: .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md §5
      to: .planning/phases/02-theme-system-i18n/02-PLAN-wave4-fonts-self-hosted-pipeline.md notes.latin_extended_glyphs
      via: "§5 ejecuta la verificación Open-Q2-E que W4 difirió (must_haves truth #9 de W4)"
      pattern: "Latin Extended"
---

## Phase Goal (MVP Vertical Slice — Verification gate)

**As el** developer (Rafael) cerrando Phase 2 con `/gsd-verify-work 2`, **I want to** un checklist manual estructurado que cubra todo lo que los tests programáticos no pueden verificar (visual diff, perceptual contrast, CLS móvil, FOUT en throttled network, screen reader reannounce, Latin Extended glyph coverage), **so that** la phase cierre con confianza visual + a11y + perf antes de pasar a Phase 3.

> **Nota MVP:** este Wave 5 es el último paso del slice vertical de Phase 2 — el ÚLTIMO entregable, **NO autonomous** (Rafael ejecuta el checklist en su máquina). Tras este plan, Phase 2 está lista para `/gsd-verify-work 2` que valida todos los success criteria del ROADMAP § Phase 2 (5 success criteria) y formalmente cierra la fase.

> **Shell assumption (cross-cutting Phase 2):** los comandos `<automated>` que usan `&&` en los plans W0-W5 asumen un shell con chaining nativo (bash o pwsh 7+). El ejecutor de Claude Code típicamente usa Bash tool donde `&&` funciona out-of-the-box. Si Rafael ejecuta los comandos manualmente en PS 5.1, cada segmento separado por `&&` debe lanzarse como call independiente (`npm install; if ($?) { npm run test:run }`). Esta nota se aplica al manual checklist + a la pre-flight section de Task 6.2.

<objective>
Crear el manual checklist artifact `02-MANUAL-CHECKLIST.md` para que Rafael ejecute las verificaciones que NO pueden ser programáticas (siguiendo VALIDATION.md `Manual-Only Verifications` table y UI-SPEC §14). El plan es **checkpoint:human-action** — Claude entrega el artifact; Rafael lo corre.

**Purpose:** Cubre los 4 REQ-IDs que tienen dimensión manual (THM-04 visual, THM-05 external audit con axe/Pa11y/Lighthouse, I18N-05 layout shift mobile, A11Y-04 cross-check vs documented contrast) + cierra Open-Q2-E (Latin Extended) verificación deferred desde W4. Cierra el bucle de Phase 2 con la única instancia de human gate (similar a Plan 06 Phase 1 manual checklist + Plan 07 iOS smoke test — Phase 1 patrón establecido).

**Lo que ESTE plan NO hace:**
- NO escribe código (es solo doc artifact + checkpoint human-action).
- NO modifica componentes ni tests.
- NO ejecuta el checklist (es Rafael quien lo corre y lo firma).
- NO incluye iOS hardware tests (Rafael NO tiene iOS device — memoria `rafael-no-ios-device`; mitigaciones preventivas ya están en código desde Phase 1 + Phase 2 no añade requirements iOS-críticos nuevos).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/02-theme-system-i18n/02-CONTEXT.md
@.planning/phases/02-theme-system-i18n/02-UI-SPEC.md
@.planning/phases/02-theme-system-i18n/02-RESEARCH.md
@.planning/phases/02-theme-system-i18n/02-VALIDATION.md
@.planning/phases/02-theme-system-i18n/02-01-SUMMARY.md
@.planning/phases/02-theme-system-i18n/02-02-SUMMARY.md
@.planning/phases/02-theme-system-i18n/02-03-SUMMARY.md
@.planning/phases/02-theme-system-i18n/02-04-SUMMARY.md
@.planning/phases/02-theme-system-i18n/02-05-SUMMARY.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-06-MANUAL-CHECKLIST.md

<interfaces>
<!-- 02-MANUAL-CHECKLIST.md — derivado de VALIDATION.md + UI-SPEC §14 + heritage Phase 1 06 -->

Estructura del documento (analog: `.planning/phases/01-scroll-shell-sticky-anchors/01-06-MANUAL-CHECKLIST.md` líneas 1-222):

1. **Frontmatter** con metadata: phase, plan, generado, last_updated.

2. **Header + Purpose** — breve párrafo que explica qué cubre el checklist (Phase 2 visual + a11y + perf manual gates) y cuándo se corre (antes de `/gsd-verify-work 2`).

3. **Test Environment block:**
   - Browser: Chrome [version actual al ejecutar] + Firefox (cross-browser sanity check optional)
   - Mobile emulator: DevTools preset "iPhone SE" 375×667
   - Network: DevTools throttling "Slow 3G" para sección FOUT
   - PRM: DevTools Rendering panel → "Emulate CSS media feature prefers-reduced-motion" → "reduce" para sección PRM
   - Lighthouse: Chrome DevTools Lighthouse panel — Performance + Accessibility audits
   - axe DevTools: extension instalada en Chrome (free tier OK)
   - Screen reader: NVDA en Windows (Rafael's OS) — instructions para descargar si no instalado
   - Assumptions: Rafael NO posee iOS device — secciones iOS-specific del UI-SPEC §14 quedan **deferred** como en Phase 1 Plan 07.
   - Shell: PS 5.1 (Windows) — comandos `<automated>` usados como referencia, no como gate; Rafael verifica visualmente en DevTools.

4. **6 secciones de testing**, cada una con descripción + how-to-test + PASS/FAIL criteria + mitigation if FAIL:

   **Section 1 — Theme bleed visual durante smooth-scroll (THM-04 visual)**
   - Cobertura: RESEARCH §Theme Bleed Prevention Testing Strategy 3 líneas 1246-1267 verbatim
   - Steps:
     - 1.1 Scroll con trackpad LENTAMENTE (no click on timeline tick) de ch0 al siguiente; observar el borde transition.
     - 1.2 Mientras DOS sections son visibles simultáneamente, capturar screenshot.
     - 1.3 Verificar: la mitad superior mantiene SU theme (color/font); la mitad inferior tiene SU theme. NO debe verse "half-and-half" en un mismo elemento (texto/bg cambiando color mid-element).
     - 1.4 Inspect DevTools Computed: section saliente debe mostrar SUS `--c-bg`/`--c-fg` correctos; entrante también.
     - 1.5 Repeat para los 6 pares (ch0→1, ch1→2, ch2→3, ch3→4, ch4→5, ch5→6).
   - PASS: ningún half-and-half en NINGÚN par.
   - FAIL: si half-and-half visible → REPORTAR como gap (probable: el `data-chapter` se está aplicando al wrapper global o un ancestor — verificar architecturally que solo `<section>` tienen `data-chapter`).

   **Section 2 — Background morph crossfade visual sync con avatar swap (D2-04 + D2-05)**
   - Cobertura: visual sync goal del D2-05 ("avatar + bg morph al unísono perceptúen un solo evento")
   - Steps:
     - 2.1 Default motion (sin PRM): click tick de ch3 → ch5 en la timeline; observar simultaneity del avatar fade-out → swap → fade-in (Phase 1 Plan 03 — 200ms total) y el bg morph crossfade (W3 — 200ms default).
     - 2.2 Verificar perceptualmente: ¿el "cambio de era" se siente como UN evento o como DOS eventos separados (avatar primero, bg después o viceversa)?
     - 2.3 PRM activo (DevTools rendering panel): repetir 2.1; ahora el avatar es INSTANT (D-02) pero el bg sigue siendo crossfade de 150ms (D-03 distinto del D-02). Verificar que la diferencia (avatar instant vs bg 150ms) NO es chocante perceptualmente — el bg debe sentirse "rápido pero suave", no abrupto.
     - 2.4 A/B opcional (Open-Q2-B re-validación): hardcodear 300ms en `useBackgroundMorph.js` DEFAULT_DURATION_MS temporalmente; comparar visual. ¿200ms se siente apropiado o 300ms es mejor? Rafael decide el lock final.
   - PASS: avatar + bg perciben "un solo evento" en default; PRM no choca; 200ms confirmed como lock (o ajuste a 300ms documentado).
   - FAIL: si los 2 eventos se ven separados → considerar bumpear bg duration o usar `transition-timing-function: ease-in-out` para mejor sync.

   **Section 3 — Layout shift al toggle ES↔EN en mobile portrait 375×667 (I18N-05 + CLS)**
   - Cobertura: RESEARCH §Pitfall 5 + Layout Shift Mitigation
   - Steps:
     - 3.1 DevTools mobile emulator preset "iPhone SE" (375×667).
     - 3.2 Cargar la página → activeChapter = 3 (default landing).
     - 3.3 Activar PerformanceObserver para CLS via DevTools console: pegar el snippet de RESEARCH §Layout Shift Mitigation Strategy verification (líneas 1350-1357 verbatim).
     - 3.4 Toggle ES → EN → ES → EN en cada chapter (ch0..ch6, sumar 14 toggles).
     - 3.5 Verificar:
       - No hay reflow visible (scroll position NO salta).
       - LangToggle position estable — no se "mueve" lateralmente entre estados.
       - SkipLink (al activar Tab) cabe sin truncate en cada locale.
       - No horizontal overflow visible.
       - CLS reportado por PerformanceObserver < 0.1 (Google Web Vitals threshold).
   - PASS: 14/14 toggles sin reflow + CLS < 0.1.
   - FAIL: si reflow visible o CLS ≥ 0.1 → REPORTAR. Mitigation: añadir `min-width` a LangToggle ancho fijo desktop (RESEARCH §Layout Shift Strategy 1); aplicar SkipLink Opción B (font-size 12px @media 599px) heritage Phase 1.

   **Section 4 — Contrast values reales vs documented inline (THM-05 + A11Y-04)**
   - Cobertura: VALIDATION.md `Manual-Only Verifications` row "Contrast values reales contra los documentados inline"
   - Steps:
     - 4.1 Abrir axe DevTools extension en Chrome.
     - 4.2 En cada chapter (ch0..ch6), ejecutar axe DevTools scan.
     - 4.3 Para cada ratio reportado por axe vs el comentario inline en `chapter-themes.css`:
       - Si axe ratio matchea el documentado (±0.1 tolerance) → PASS.
       - Si axe ratio DIFIERE significativamente (≥0.3 diff) → INVESTIGAR (probable: el `--c-fg` se está mezclando con un ancestor's color, o el font-size afecta el effective contrast en grandes/pequeños).
     - 4.4 Para ch1 (único tradeoff documentado 3.2:1): axe esperablemente reporta warning "Contrast ratio 3.2:1 below 4.5:1 threshold" — esto es ESPERADO y documentado en el comentario inline (D2-03). PASS.
     - 4.5 Para los otros 6 chapters: axe no reporta warning de contrast (todos ≥4.5:1 según UI-SPEC §4.2 tabla).
     - 4.6 Lighthouse accessibility audit en default landing (ch3) → score ≥85 (D2-03 docs + research mention en VALIDATION).
   - PASS: 1/7 chapters con tradeoff (ch1 esperado), 6/7 limpios, Lighthouse a11y ≥85.
   - FAIL: si chapter ≠ ch1 reporta contrast warning → REPORTAR como discrepancia con UI-SPEC §4.2; revisar tokens del chapter afectado.

   **Section 5 — FOUT/FOIT en primer load bajo network throttling + Latin Extended glyph coverage (D2-08 + R1 + Open-Q2-E)**
   - Cobertura: VALIDATION.md row "FOUT/FOIT en primer load" + Open-Q2-E (verificación deferred desde W4 — ver `notes.latin_extended_coverage`)
   - Steps FOUT/FOIT:
     - 5.1 DevTools → Network panel → Throttling "Slow 3G".
     - 5.2 Hard reload (Ctrl+Shift+R) para forzar fresh load.
     - 5.3 Observar el render inicial:
       - Texto debe aparecer INMEDIATAMENTE en system-safe fallback (FOUT — Flash Of Unstyled Text — es esperado y BIEN).
       - Texto NO debe aparecer en blanco (FOIT — Flash Of Invisible Text — es MAL; significa que `font-display: swap` no está activo).
       - Tras 1-3 segundos en Slow 3G, los fonts custom (VT323, Lobster, etc.) deberían swappear visualmente.
     - 5.4 Verificar Lighthouse Performance: NO debe haber warning "Avoid invisible text during webfont load" (R1 FOIT mitigation cubierta por `font-display: swap` de @fontsource packages).
   - **Sub-section 5.A — Latin Extended glyph coverage (Open-Q2-E)** — verificación deferred desde W4:
     - 5.A.1 Abrir el sitio en dev mode (`npm run dev`) con locale ES (toggle LangToggle si arrancó en EN, o `localStorage.setItem('portfolio.locale', 'es')` + reload).
     - 5.A.2 Para cada chapter (ch0..ch6), inspeccionar visualmente que la sample string ES locked se renderea sin tofu (cuadrado □ o glyph genérico). Sample string locked:
       > "Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida"
       (Contiene ñ, á, é, í, ó, ú — los Latin Extended glyphs críticos para ES; también el em-dash — y signos de puntuación).
     - 5.A.3 Tip: añadir temporalmente la sample string al `era-title` o al inside de una section via DevTools console (`document.querySelector('section[data-chapter="0"] .era-title').textContent = 'Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida'`); repetir por chapter cambiando el index.
     - 5.A.4 Para cada chapter, verificar:
       - Los glyphs ñ, á, é, í, ó, ú, ü renderean correctamente con la font era-auténtica (no tofu).
       - Los signos ¿ ¡ — renderean correctamente.
       - ch2 (Verdana/Trebuchet MS system-safe): trivialmente OK porque las system fonts cubren Latin Extended.
       - ch0 VT323, ch1 Comic Neue, ch3 Lobster, ch4 Audiowide, ch5 Inter Variable, ch6 Press Start 2P: cada @fontsource paquete debe incluir el subset Latin Extended por default (RESEARCH §Q3 + Example 7 Option A).
   - PASS:
     - FOUT brief observable + no FOIT + no Lighthouse warning (criterios FOUT/FOIT)
     - 7/7 chapters renderean la sample string ES sin tofu (Open-Q2-E cumplida)
   - FAIL:
     - Si texto blanco visible mid-load → REPORTAR FOIT (probable: algún @fontsource paquete sin `font-display: swap`; verificar el bundle CSS final).
     - Si aparece tofu (□) en algún chapter → bug a Phase 3 o rollback del font afectado a un alternativo OFL-1.1 que sí cubra Latin Extended.

   **Section 6 — Cross-browser sanity check + DevTools elements panel observable behavior**
   - Cobertura: smoke test final cross-cutting de UI-SPEC §14
   - Steps:
     - 6.1 Chrome: navegación E2E ch0→ch6 con flechas/scroll/click ticks; LangToggle ES↔EN; PRM toggle; tab focus per chapter. Todo funciona.
     - 6.2 Firefox: repeat 6.1; resultado equivalente (algún diferencia leve en font rendering OK; behavior idéntico).
     - 6.3 Edge (Chromium-based, esperablemente idéntico a Chrome): smoke test rápido.
     - 6.4 DevTools elements panel verificar items de UI-SPEC §14 (16 checkpoints):
       - `<html lang>` muta al toggle locale ✓
       - LangToggle visible top-right (16px offsets) en cada chapter ✓
       - Mobile <600px: LangToggle icon-only con 🌐 ✓
       - SkipLink texto bilingue desde `t('ui.skipLink')` ✓
       - StickyTimeline aria-labels desde `t()` ✓
       - Cada `<section>` aria-label desde `t('chapters.N.title')` ✓
       - BackgroundLayers son 2 divs con `z-index: -1` ✓
       - Body NO tiene `background: #0b0b16` ✓
       - 7 chapter sections muestran su data-chapter correcto ✓
       - PRM rendering panel test: avatar instant + bg crossfade 150ms ✓
       - Focus tab: outline color cambia per chapter ✓
       - Persistencia: refresh → locale persiste desde localStorage ✓
       - First visit clean state (clear localStorage): locale auto-detect según navigator.language ✓
       - 7 chapters muestran 7 fonts distintas (excepto ch2 system-safe) ✓
       - LangToggle: HUD invariante (mismo color en los 7 chapters) ✓
       - Theme bleed: ningún half-and-half ✓
   - PASS: ≥14/16 checkpoints ✓ + Chrome + Firefox behavior idéntico.
   - FAIL: si <14/16 → triage individual de cada item failing.

5. **Sign-off block** análogo a `01-06-MANUAL-CHECKLIST.md`:
   - Sección por cada Section 1..6 con checkbox PASS/FAIL + notas opcionales.
   - Firma final: "Rafael ejecutó este checklist el [fecha] en [browser + version] [OS + version]. Verdict: PASS/PARTIAL/FAIL".
   - Si PARTIAL/FAIL: link a gap closure plan futuro o nota en STATE.md `Blockers`.

6. **Phase 2 Coverage cross-check** — tabla final mapeando cada REQ-ID de Phase 2 a su verification status:

   | REQ-ID | Cubierto en | Status post-Phase 2 |
   |---|---|---|
   | THM-01 | W2 Plan 03 (tests/styles/themes-file.test.js) | ✅ automated |
   | THM-02 | W2 Plan 03 | ✅ automated |
   | THM-03 | W2 + W4 (themes + fonts source) + W4 Task 5.2 bundle smoke | ✅ automated + manual font visual W5 §6 + Latin Extended W5 §5.A |
   | THM-04 | W2 architectural + W5 §1 visual | ✅ both |
   | THM-05 | W2 docs + W5 §4 external audit | ✅ both |
   | I18N-01 | W0 setup test | ✅ automated |
   | I18N-02 | W0 parity test | ✅ automated |
   | I18N-03 | W1 LangToggle tests | ✅ automated |
   | I18N-04 | W0 html-lang-watcher tests | ✅ automated |
   | I18N-05 | W5 §3 manual CLS | ✅ manual |
   | I18N-06 | W0 fallback test | ✅ automated |
   | A11Y-03 | W2 focus-ring test | ✅ automated |
   | A11Y-04 | W5 §4 manual | ✅ manual (duplicate of THM-05) |
   | A11Y-07 | W0 html-lang-watcher test | ✅ automated (duplicate of I18N-04) |
   | Open-Q2-E | W5 §5.A Latin Extended glyph coverage manual | ✅ manual (deferred from W4) |
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 6.1: Crear 02-MANUAL-CHECKLIST.md derivado de VALIDATION.md + UI-SPEC §14</name>
  <files>
    .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
  </files>
  <read_first>
    .planning/phases/02-theme-system-i18n/02-VALIDATION.md líneas 98-108 (`Manual-Only Verifications` table — fuente primaria de derivation),
    .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §14 líneas 1009-1037 (Phase 2 Visible Verification Checklist — 16 checkpoints; section 6 del manual checklist los compila),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §Theme Bleed Prevention Testing Strategy 3 líneas 1246-1267 (Manual Visual Diff Checklist verbatim — section 1 del manual checklist los heredea),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §Layout Shift Mitigation §Verification líneas 1334-1357 (manual + automated CLS verification — section 3 del manual checklist),
    .planning/phases/02-theme-system-i18n/02-PLAN-wave4-fonts-self-hosted-pipeline.md notes.latin_extended_glyphs (W4 difiere Open-Q2-E a este checklist; sample string ES locked),
    .planning/phases/01-scroll-shell-sticky-anchors/01-06-MANUAL-CHECKLIST.md (analog completo — replicar estructura: frontmatter + header + test environment + sections + sign-off + coverage table)
  </read_first>
  <action>
    Crear el archivo `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` con la estructura completa documentada en el `<interfaces>` block:

    1. **Frontmatter:**
       ```
       ---
       phase: 02-theme-system-i18n
       plan: 06
       slug: wave5-manual-checklist
       generated: 2026-05-13
       last_updated: 2026-05-13
       executed_by: Rafael
       executed_at: (pending)
       verdict: (pending)
       ---
       ```

    2. **Header + Purpose** breve párrafo.

    3. **Test Environment block** — bullet list con: browser, mobile emulator, network throttling, PRM emulator, Lighthouse, axe DevTools, NVDA, iOS assumption (deferred — Rafael NO posee iOS device), shell PS 5.1 note.

    4. **6 sections** (Theme bleed visual / BG morph sync / Layout shift mobile / Contrast audit / FOUT-FOIT + Latin Extended glyph coverage / Cross-browser cross-check). Cada section con sub-items numerados (Section 1: 1.1, 1.2, ...; Section 2: 2.1, 2.2, ...; etc.) + criterio PASS/FAIL explícito al final + mitigation if FAIL.

       Notas críticas:
       - Section 1: copy LITERAL del bullet list de RESEARCH §Theme Bleed Prevention Testing Strategy 3 líneas 1246-1267 (ya está en formato manual checklist).
       - Section 2: A/B opcional Open-Q2-B re-validation — Rafael decide si 200ms se siente OK o ajusta a 300ms (decisión final commit en SUMMARY).
       - Section 3: pegar el snippet PerformanceObserver verbatim de RESEARCH líneas 1350-1357 para uso copy-paste en DevTools console.
       - Section 4: ch1 esperablemente reporta contrast warning de axe → ESO es PASS (documentado tradeoff). Los otros 6 chapters limpios.
       - Section 5: FOUT (Flash Of Unstyled Text) es BUENO bajo throttling; FOIT (Flash Of Invisible Text) es MALO. **AÑADIR Sub-section 5.A — Latin Extended glyph coverage**: sample string ES locked verbatim ("Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida") + verificación por chapter (no tofu en ñ, á, é, í, ó, ú, ü, ¿, ¡). DevTools snippet para inyectar la string en el `.era-title` de cada section. Esta sub-section cumple Open-Q2-E (W4 difirió).
       - Section 6: tabla de 16 checkpoints de UI-SPEC §14 línea por línea.

    5. **Sign-off block** con checkboxes PASS/FAIL por section + final verdict line. Para Section 5: dos sub-checkboxes (FOUT/FOIT pass + Latin Extended pass) deben ambos PASS para que la section completa sea PASS.

    6. **Phase 2 Coverage cross-check table** mapeando los 14 REQ-IDs + Open-Q2-E a su verification status (W0..W5).

    **Estilo de redacción:**
    - Lenguaje claro + imperativo ("Ejecuta", "Verifica", "Confirma"). No subjuntivo.
    - Cada step accionable en <2 minutos individualmente. La sección completa total <30min runtime.
    - Comentarios anchor en cada section: `> Cobertura: VALIDATION.md row X / UI-SPEC §Y / RESEARCH §Z`.
    - Lista de comandos PowerShell donde aplique (npm run build, npm run preview, DevTools console snippets, Lighthouse CLI optional). Nota inline al inicio del documento: "comandos PowerShell se ejecutan en PS 5.1; los `&&` chains son referenciales, ejecutar como statements separados si copy-paste falla".

    NO escribir código de tests programáticos (eso se cubre en W0..W4). NO documentar nada sobre Phase 3 (out of scope). Mantener el archivo concentrado en los 4 REQ-IDs manual-only (THM-04 visual, THM-05 external, I18N-05 CLS, A11Y-04 axe audit) + Open-Q2-E + UI-SPEC §14 final E2E checks.

    LOC target: 220-330 líneas (analog 01-06-MANUAL-CHECKLIST.md ~222 LOC; el delta por la sub-section Latin Extended añade ~20-30 LOC).

    Commit message: `docs(qa): plan 06 task 6.1 — Phase 2 manual checklist artifact (W5) + Latin Extended glyph coverage`.
  </action>
  <verify>
    <automated>Test-Path '.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md' &amp;&amp; (Get-Content '.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md' | Measure-Object -Line).Lines -ge 150</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` existe
    - LOC ≥ 150 líneas (target real 220-330 con la sub-section Latin Extended)
    - Contiene frontmatter YAML válido (opening + closing `---`)
    - Contiene strings literales: "Theme bleed", "Background morph", "Layout shift", "Contrast", "FOUT", "Cross-browser"
    - Contiene strings literales: "PASS", "FAIL", "Sign-off"
    - Contiene la tabla `Phase 2 Coverage cross-check` con los 14 REQ-IDs (THM-01..05, I18N-01..06, A11Y-03/04/07) + Open-Q2-E
    - Contiene el comando PerformanceObserver CLS snippet (verificable con `Select-String -Path .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md -Pattern 'PerformanceObserver' -Quiet` returns `True`)
    - Contiene referencia explícita a la decisión Open-Q2-B (A/B re-validation 200ms vs 300ms — Rafael decide lock final)
    - Contiene la sample string ES literal "Pre-carrera: niñez digital — España, capítulo, año 2001, comunicación cálida" (Latin Extended glyph coverage sub-section)
    - Contiene "Latin Extended" mencionado en Section 5 (sub-section 5.A) — verificable con `Select-String -Path .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md -Pattern 'Latin Extended' -Quiet` returns `True`
  </acceptance_criteria>
  <done>02-MANUAL-CHECKLIST.md creado con ≥6 secciones (incluyendo sub-section 5.A Latin Extended glyph coverage), frontmatter, sign-off block, coverage table, ≥150 LOC.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 6.2: Rafael ejecuta el manual checklist + firma el sign-off</name>
  <what-built>El motor visual + lingüístico completo de Phase 2 está en producción local: 7 themes, BackgroundLayers, LangToggle, 6 fonts self-hosted, i18n end-to-end, ~147 tests verdes, build verde. El manual checklist (Task 6.1) cubre los 4 REQ-IDs manual-only + Open-Q2-E (Latin Extended) + UI-SPEC §14 final verification.</what-built>
  <how-to-verify>
    **Pre-flight (5 min):**
    1. `cd C:\Users\RafaelMatovelle\documents\mato-new-portfolio`
    2. `npm install` (asegurar deps post-W4)
    3. `npm run test:run` — confirmar ≥147 tests verdes (no regresiones; W4 Task 5.1 + 5.2 incluidos)
    4. `npm run build` — confirmar build verde
    5. `npm run preview` (o `npm run dev` para hot reload) — abrir `http://127.0.0.1:5173/` (o 4173 si preview)

    > Nota PS 5.1: si copy-paste de los comandos con `&&` falla, ejecutar cada uno como statement separado (`npm install` → si OK, `npm run test:run` → si OK, `npm run build`).

    **Execution (25-35 min):**
    6. Abrir `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` en VS Code o IDE preferido.
    7. Ejecutar cada Section 1..6 EN ORDEN siguiendo los sub-items numerados.
    8. Para cada item: marcar checkbox PASS/FAIL + nota opcional si FAIL (qué falló, screenshot opcional, expected vs actual).
    9. Section 2 incluye decisión Open-Q2-B re-validation: si 300ms se siente mejor que 200ms, documentar en notas y commitear el cambio a `DEFAULT_DURATION_MS` en `useBackgroundMorph.js` ANTES de firmar; si 200ms está bien, firmar como locked.
    10. Section 4 (axe DevTools): si algún chapter ≠ ch1 reporta contrast warning, ABRIR un gap closure ticket (no firmar PASS de Section 4 — investigar).
    11. **Section 5.A (Latin Extended)**: para cada chapter, inyectar la sample string ES en `.era-title` via DevTools console + verificar que ñ, á, é, í, ó, ú, ü, ¿, ¡ — renderean sin tofu (□). Si tofu en algún chapter → REPORTAR como gap (probable: el @fontsource paquete cayó a Latin Basic subset; mitigation: switch a alternativa OFL-1.1 con Latin Extended garantizado).

    **Sign-off (5 min):**
    12. En el bloque "Sign-off" del checklist, marcar PASS/FAIL por cada Section 1..6.
    13. Firmar la línea final: "Rafael ejecutó este checklist el {fecha} en {browser+version} {OS+version}. Verdict: PASS/PARTIAL/FAIL".
    14. Si verdict ≠ PASS: añadir entry a STATE.md `Blockers` describiendo qué falló.
    15. Si verdict = PASS: commitear el checklist firmado con `docs(qa): rafael firma 02-MANUAL-CHECKLIST PASS — W5 closes Phase 2 manual gate`.

    **Total estimated time:** 35-45 minutos (delta +5-10min vs versión previa por sub-section Latin Extended). Esta es la única wave NO-autonomous de Phase 2 (analog Plan 06 + Plan 07 de Phase 1).
  </how-to-verify>
  <resume-signal>
    Firma con: "approved" + reporte breve (verdict por Section 1..6 + decisión Open-Q2-B 200ms vs 300ms + resultado Latin Extended §5.A) — entonces yo (el orchestrator) procedo con `/gsd-verify-work 2` para cerrar formalmente la phase.
    
    Si hay PARTIAL/FAIL: describe qué falló + cuál es el plan (gap closure plan dentro de Phase 2 vs deferred a Phase 3 vs documentado en STATE.md Blockers).
  </resume-signal>
</task>

</tasks>

<verification>
- Comando: `Test-Path '.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md'`
- Esperado: `True` + LOC ≥150 + frontmatter válido + 6 sections (sección 5 con sub-section 5.A Latin Extended) + sign-off block + coverage table.
- Tras Task 6.2 (human verify): el checklist FIRMADO por Rafael con verdict PASS (o PARTIAL con gaps documentados); Phase 2 lista para `/gsd-verify-work 2` que valida los 5 success criteria del ROADMAP § Phase 2 y formalmente cierra la fase.
</verification>

<success_criteria>
- 02-MANUAL-CHECKLIST.md creado con estructura completa derivada de VALIDATION.md + UI-SPEC §14 + Latin Extended sub-section
- Rafael ejecuta el checklist + firma con verdict
- Decisión Open-Q2-B (200ms vs 300ms) re-validada y locked
- Open-Q2-E (Latin Extended glyph coverage) verificada manualmente en §5.A
- Si todo PASS: Phase 2 cierra formalmente
- Si PARTIAL/FAIL: gaps documentados + plan de remediation
</success_criteria>

<output>
After completion, create `.planning/phases/02-theme-system-i18n/02-06-SUMMARY.md` con:
- 02-MANUAL-CHECKLIST.md artifact created (LOC, sections count, coverage table)
- Rafael sign-off result (verdict por section + final verdict + timestamps)
- Decisiones tomadas en el checklist (Open-Q2-B final lock, Open-Q2-E Latin Extended resultado, mitigations aplicadas si FAIL)
- Phase 2 coverage final status: cuáles REQ-IDs ✅ automated + ✅ manual; cuáles ⏳ deferred (esperablemente NONE post-W5)
- Next: `/gsd-verify-work 2` para cerrar la fase formalmente, entonces `/gsd-phase 3` (Chapter 3 End-to-End)
</output>
