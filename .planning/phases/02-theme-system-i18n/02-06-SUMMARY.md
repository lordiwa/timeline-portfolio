---
phase: 2
plan: 6
slug: wave5-manual-checklist
wave: 5
completed: 2026-05-13
duration_min: 40
artifact_only: true
human_gate: open
tests_added: 0
tests_total_suite: 151
commits:
  - 7bd573c: "docs(02-06): manual checklist artifact derivado de VALIDATION + UI-SPEC §14 + RESEARCH"
requirements_covered:
  - THM-04: "Verificación visual de FOUT/FOIT por chapter (Network Slow 3G → primer paint con fallback → swap a webfont sin layout shift)"
  - THM-05: "External audit Lighthouse/axe del tradeoff de contraste documentado en ch1 (Comic Neue magenta sobre navy 3.2:1 — aceptado por autenticidad era HTML 90s, justificado verbatim en CSS)"
  - I18N-05: "Layout shift CLS con texto ES 20-30% longer vs EN — emulador móvil 375×667 portrait + DevTools Performance + manual visual"
  - A11Y-04: "Manual axe audit per chapter (extension Chrome) + Lighthouse Accessibility — verifica contrast por chapter, focus ring visible, semántica correcta"
open_questions_closed:
  - "Open-Q2-E (Latin Extended glyph coverage diferida desde W4) — §5 del checklist ejecuta el sample string ES locked por Plan 02-05 contra los 6 fonts self-hosted"
  - "Open-Q2-B (A/B re-validación duración bg morph 200ms vs 300ms perceptual) — §2 del checklist captura percepción humana en hardware real"
deferred:
  - "iOS Safari verifications — Rafael no posee dispositivo iOS (consistente con Phase 1 Plan 07 deferred). Marcadas DEFERRED en cada sección que las requeriría. Reabrir con BrowserStack o dispositivo prestado"
files_modified:
  created:
    - .planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md
  modified: []
---

# Phase 2 Plan 06: manual-checklist-and-verification Summary

> **`autonomous: false` — checkpoint:human-action.** Este SUMMARY documenta la
> entrega del artifact `02-MANUAL-CHECKLIST.md`. **NO cierra el human gate.**
> Phase 2 verification (`/gsd-verify-work 2`) requiere que Rafael ejecute el
> checklist y firme la sección de sign-off antes de proceder.

## What got built

### `.planning/phases/02-theme-system-i18n/02-MANUAL-CHECKLIST.md` (artifact nuevo, 615 LOC, ~31 KB)

- **10 secciones temáticas** cubriendo los 4 REQ-IDs manuales + 2 open-questions diferidas:
  - §1 Theme bleed prevention — visual diff snap chapter-a-chapter sin filtración
  - §2 Background morph perception — A/B 200 vs 300ms + PRM mid-flight recovery (Open-Q2-B)
  - §3 Layout shift CLS — emulador móvil 375×667, ES vs EN (I18N-05)
  - §4 Contrast audit external — Lighthouse + axe DevTools per chapter (A11Y-04, THM-05)
  - §5 Latin Extended glyph coverage — sample string ES locked por Plan 02-05 (Open-Q2-E, THM-04)
  - §6 Cross-browser + a11y DevTools — Chrome/Firefox/Edge + NVDA best-effort
  - §7 i18n end-to-end manual — toggle + persist + `<html lang>` + DevTools attribute watch
  - §8 Performance smoke — Lighthouse Performance per chapter, FID/LCP/CLS
  - §9 Regression visual — comparación con Phase 1 baselines (sticky avatar + timeline visible)
  - §10 Sign-off — verdict, Chrome/Firefox versions, fecha, notas
- **73 check items** con criterio pass/fail explícito, where-to-look, comandos devtools cuando aplica
- **Entorno de test documentado** — Chrome + Firefox + Edge + DevTools mobile emulator + Lighthouse + axe DevTools + NVDA + iOS Safari **DEFERRED**
- **PowerShell 5.1 notes** — los fragmentos con `&&` se documentan como referenciales; Rafael debe ejecutar cada parte como statement separado en PS 5.1
- **iOS Safari verifications consistentemente marcadas `DEFERRED — Rafael lacks iOS device`** alineado con tratamiento de Phase 1 Plan 07. Reabrir con BrowserStack u otro dispositivo real.

## Key Decisions

- **Artifact-only delivery**: El executor produce el documento; Rafael lo ejecuta más tarde. SUMMARY.md (este archivo) documenta entrega pero NO cierra el human gate. Phase verification espera el sign-off explícito.
- **Frontmatter de tracking del checklist**: `executed_by: Rafael, executed_at: (pending), verdict: (pending)` — campos que Rafael actualiza al firmar. Permite que `/gsd-verify-work 2` pueda detectar programáticamente que el gate está cerrado (verdict != pending).
- **Open-Q2-E y Open-Q2-B cerradas via checklist**: §5 y §2 respectivamente. Sample string ES heredado verbatim de Plan 02-05 (locked). Esto evita drift entre el test bundle smoke y la verificación visual.
- **iOS deferred como precedent de Phase 1**: misma política — mitigaciones preventivas en código (env safe-area-inset, viewport-fit=cover ya en index.html desde W4 de Phase 1), checklist documenta los items pero los marca `[ ] DEFERRED — Rafael lacks iOS device` con instrucciones para reapertura.
- **PowerShell 5.1 caveat documentado upfront**: `&&` chaining no funciona en PS 5.1 (sí en bash, pwsh 7+). Los fragmentos del checklist incluyen ambas variantes cuando aplica.

## Requirements Coverage

| REQ-ID | Sección | Verificación |
|---|---|---|
| **THM-04** (visual signal + FOUT) | §5 Latin Extended + §6 Cross-browser | Network Slow 3G → fallback paint → swap webfont sin layout shift, per chapter |
| **THM-05** (contrast tradeoff documentation) | §4 Contrast audit external | Lighthouse + axe confirman ch1 magenta/navy 3.2:1 + el comentario CSS tradeoff es visible y suficiente |
| **I18N-05** (ES text 20-30% longer fits) | §3 Layout shift CLS | Emulador 375×667 portrait, ES vs EN, ningún component se desborda ni rompe scroll-snap |
| **A11Y-04** (manual axe audit) | §4 + §6 | axe DevTools per chapter, Lighthouse Accessibility ≥90 per chapter, NVDA navega correctamente |

## How the gate closes

1. Rafael abre el artifact `02-MANUAL-CHECKLIST.md`.
2. Ejecuta las 10 secciones (iOS subsections marcadas DEFERRED se saltan con nota).
3. Llena la sección §10 Sign-off:
   - `executed_by:` Rafael
   - `executed_at:` ISO date
   - `verdict:` `PASS` / `PASS con observaciones` / `FAIL`
   - Si `verdict ≠ PASS`: anota qué falló y abre plan/issue de fix antes de phase verification.
4. Commit: `docs(02-06): Rafael sign-off — verdict {X}`
5. Después de eso: `/gsd-verify-work 2` puede proceder con goal-backward verification.

## Anti-scope

- Este plan **NO ejecuta** ninguna verificación visual. Solo produce el artifact.
- Este plan **NO cierra** Phase 2. Phase verification depende del sign-off.
- Este plan **NO automatiza** las manual-only verifications (eso violaría VALIDATION.md `Manual-Only Verifications` table).
- El artifact **NO duplica** verificaciones que ya están automatizadas en tests programáticos (no re-checkea contraste de ch0 que ya valida `contrast-docs.test.js`, ni @layer cascade ya cubierto por `themes-file.test.js`).

## Phase 2 status after this plan

- **6/6 plans executed.** 02-01 (i18n engine) → 02-02 (LangToggle + i18nificación) → 02-03 (chapter-themes.css) → 02-04 (useBackgroundMorph + BackgroundLayers) → 02-05 (self-hosted fonts) → 02-06 (this — manual checklist artifact).
- **151/151 tests verdes** (sin regresión).
- **Build verde**: CSS 6.98 KB, JS 131.55 KB, fonts subset 285.8 KB.
- **Human gate abierto**: esperando ejecución del checklist por Rafael.
- **No proceder a Phase 3 ni a verify-work hasta que Rafael firme el sign-off.**
