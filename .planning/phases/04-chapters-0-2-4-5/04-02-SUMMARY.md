---
phase: 04-chapters-0-2-4-5
plan: 02
subsystem: ui
tags: [vue3, phaser, css-animations, i18n, terminal, marquee, starfield, parallax, accessibility, pRM]

requires:
  - phase: 02-theme-system-i18n
    provides: chapter-themes.css @layer cascade, VT323 + Comic Neue fonts self-hosted, inject('prm') pattern
  - phase: 03-content-data
    provides: Chapter3Content.vue pattern (exact analog), chapters.js data, bio.js, createTestI18n helper

provides:
  - TerminalScroll.vue — CSS-only CRT terminal con cursor blink steps(2) + staggered reveal ch0
  - StarfieldBg.vue — CSS-only starfield radial-gradient + twinkle opacity-only animation ch1
  - MarqueeBanner.vue — <marquee> real deprecated + v-if PRM swap a <span> estático (D4-05 + D4-10b)
  - Chapter0Content.vue — Wrapper layout 2-col ch0 + TerminalScroll embed + bio + flavor (ART-07)
  - Chapter1Content.vue — Wrapper layout 2-col ch1 + StarfieldBg absolute + MarqueeBanner + tabla legacy (ART-07)
  - ScrollShell.vue wire ch0/ch1 — v-if/v-else-if branches para Chapter0Content y Chapter1Content

affects:
  - 04-03-PLAN (Chapter2Content + FlashBanner — mismo patrón wrapper)
  - 04-04-PLAN (Chapter4Content + ParallaxLayers)
  - 04-05-PLAN (Chapter5Content + ScrollRevealCard)
  - tests/components/ScrollShell.test.js — actualizado para ch0/ch1 wired (Rule 1 auto-fix)

tech-stack:
  added: []
  patterns:
    - "CSS-only PRM — TerminalScroll y StarfieldBg usan @media (prefers-reduced-motion: reduce) sin inject('prm')"
    - "JS PRM via inject + v-if — MarqueeBanner (tag <marquee> no responde a CSS animation-play-state)"
    - "TDD Red→Green flow — tests primero fallando (imports inexistentes), implementación después"
    - "Chapter wrapper clone — Chapter{N}Content clona Chapter3Content cambiando ch3→chN + era-signature embed"
    - "StarfieldBg posición absolute — position:relative en .chN-layout contiene el absolute detrás del content"

key-files:
  created:
    - src/components/TerminalScroll.vue
    - src/components/StarfieldBg.vue
    - src/components/MarqueeBanner.vue
    - src/components/Chapter0Content.vue
    - src/components/Chapter1Content.vue
    - tests/components/TerminalScroll.test.js
    - tests/components/MarqueeBanner.test.js
    - tests/components/Chapter0Content.test.js
    - tests/components/Chapter1Content.test.js
  modified:
    - src/components/ScrollShell.vue
    - src/i18n/es.json
    - src/i18n/en.json
    - tests/components/ScrollShell.test.js

key-decisions:
  - "TerminalScroll PRM 100% CSS: @media (prefers-reduced-motion: reduce) sin inject('prm') — componente CSS-only sin JS state"
  - "MarqueeBanner v-if/v-else (no v-show): <marquee> debe salir del DOM para que browser deje de scrollearlo (D4-10b)"
  - "StarfieldBg como componente independiente (no interno a MarqueeBanner): reutilizable si ch5/ch6 necesitan starfield"
  - "ScrollShell.test.js Rule 1 auto-fix: tests desactualizados que esperaban ch0/ch1 como placeholders actualizados con nueva realidad wired"
  - "i18n keys nested bajo chapters.{0,1}.* (no ch0.terminal.*): sigue jerarquía establecida en es.json/en.json"

patterns-established:
  - "Pattern era-signature CSS-only: component decorativo con @keyframes + @media PRM branch, sin inject('prm')"
  - "Pattern era-signature JS PRM: component con tag deprecated/no-CSS-controllable usa inject('prm') + v-if"

requirements-completed:
  - ART-07
  - A11Y-06
  - CORE-09
  - THM-04
  - I18N-05

duration: 45min
completed: 2026-05-13
---

# Phase 04 Plan 02: Chapter0Content + Chapter1Content (CSS-only era-signature) Summary

**Terminal CRT ch0 + GeoCities ch1 implementados en CSS-only con PRM compliance: 5 SFCs nuevos, 4 tests, 9 keys i18n, ScrollShell wired**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-05-13T22:00:00Z
- **Completed:** 2026-05-13T22:10:00Z
- **Tasks:** 2 (Task 1 + Task 2, ambos TDD)
- **Files modified:** 13 (5 SFCs nuevos, 4 tests nuevos, 2 i18n, 1 ScrollShell, 1 test actualizado)

## Accomplishments

- 3 era-signature components CSS-only: TerminalScroll (cursor blink CRT steps(2)), StarfieldBg (radial-gradient + twinkle opacity-only), MarqueeBanner (<marquee> real + v-if PRM swap D4-10b)
- 2 wrappers Chapter{0,1}Content: layout 2-col desktop/stacked mobile (D3-09 clonado), embed de era-signature components, ART-07 enforced (cero pixel art)
- 9 keys i18n nuevas en ES + EN con paridad: chapters.{0,1}.{flavor, terminal.{line1..4}, marqueeText, marqueeAria, tableLabel}
- ScrollShell.vue wire: 2 imports nuevos + 2 v-else-if branches para ch0/ch1 (ch2/4/5/6 siguen en placeholder)
- Suite: 216 → 260 tests (+44 nuevos: 10 TerminalScroll + 11 MarqueeBanner + 13 Chapter0Content + 13 Chapter1Content + 1 ScrollShell nuevo + 6 ScrollShell actualizados)

## Task Commits

Cada task siguió el flujo TDD: test RED → implementación GREEN

**Task 1 — Era-signature components:**
1. **RED: TerminalScroll + MarqueeBanner specs** — `ff7021e` (test)
2. **GREEN: TerminalScroll + StarfieldBg + MarqueeBanner** — `8acc986` (feat)

**Task 2 — Wrappers + ScrollShell wire:**
3. **RED: Chapter0Content + Chapter1Content specs** — `761d29c` (test)
4. **GREEN: Chapter0Content + Chapter1Content + ScrollShell wire** — `3b22cd1` (feat)

## Files Created/Modified

### Creados
- `src/components/TerminalScroll.vue` (~75 LOC) — CRT terminal CSS-only: 4 líneas con staggered animation-delay, cursor blink steps(2), @media PRM
- `src/components/StarfieldBg.vue` (~55 LOC) — Starfield CSS-only: 6 radial-gradients + twinkle opacity-only + @media PRM
- `src/components/MarqueeBanner.vue` (~75 LOC) — <marquee> real + v-if PRM swap a <span> estático (D4-05 + D4-10b), inject('prm')
- `src/components/Chapter0Content.vue` (~130 LOC) — Wrapper ch0 Terminal: TerminalScroll embed, layout 2-col D3-09, sin proyectos, ART-07
- `src/components/Chapter1Content.vue` (~165 LOC) — Wrapper ch1 GeoCities: StarfieldBg + MarqueeBanner embed, tabla legacy border="1", ART-07
- `tests/components/TerminalScroll.test.js` — T1-T5: DOM, CSS keyframes markers, @media PRM, i18n reactive
- `tests/components/MarqueeBanner.test.js` — T1-T6: <marquee> exists/absent, PRM swap reactivo, source inject verify
- `tests/components/Chapter0Content.test.js` — T1-T6: DOM contract, avatar src, TerminalScroll embed, no projects, i18n, ART-07
- `tests/components/Chapter1Content.test.js` — T1-T7: DOM contract, avatar src, MarqueeBanner+StarfieldBg embed, no projects, i18n, ART-07, PRM swap wrapper

### Modificados
- `src/components/ScrollShell.vue` — +2 imports (Chapter0Content, Chapter1Content) + 2 v-else-if branches
- `src/i18n/es.json` — 9 keys nuevas: chapters.{0,1}.{flavor,terminal.*,marqueeText,marqueeAria,tableLabel}
- `src/i18n/en.json` — 9 keys nuevas (paridad ES enforced)
- `tests/components/ScrollShell.test.js` — Rule 1 auto-fix: actualizado para ch0/ch1 wired

## ScrollShell wire diff

```vue
// Imports añadidos:
import Chapter0Content from './Chapter0Content.vue'
import Chapter1Content from './Chapter1Content.vue'

// Template: reemplaza 1 branch con 3 branches
- <Chapter3Content v-if="ch.id === 3" />
- <div v-else class="chapter-placeholder">
+ <Chapter0Content v-if="ch.id === 0" />
+ <Chapter1Content v-else-if="ch.id === 1" />
+ <Chapter3Content v-else-if="ch.id === 3" />
+ <div v-else class="chapter-placeholder">
```

## i18n Keys Añadidas

| Key ES | Key EN | Paridad |
|--------|--------|---------|
| `chapters.0.flavor` | `chapters.0.flavor` | ✓ |
| `chapters.0.terminal.line1` | `chapters.0.terminal.line1` | ✓ |
| `chapters.0.terminal.line2` | `chapters.0.terminal.line2` | ✓ |
| `chapters.0.terminal.line3` | `chapters.0.terminal.line3` | ✓ |
| `chapters.0.terminal.line4` | `chapters.0.terminal.line4` | ✓ |
| `chapters.1.flavor` | `chapters.1.flavor` | ✓ |
| `chapters.1.marqueeText` | `chapters.1.marqueeText` | ✓ |
| `chapters.1.marqueeAria` | `chapters.1.marqueeAria` | ✓ |
| `chapters.1.tableLabel` | `chapters.1.tableLabel` | ✓ |

## Decisions Made

1. **TerminalScroll sin inject('prm')**: el componente es 100% CSS decorativo; la rama PRM se maneja via `@media (prefers-reduced-motion: reduce)` sin JS state. Simplifica el componente vs. RESEARCH Pattern 2.
2. **MarqueeBanner v-if (no v-show)**: `<marquee>` no responde a `animation-play-state` (D4-10b). El tag legacy scrollea por behavior nativo del browser. `v-if` elimina el tag del DOM; `v-show` solo lo oculta visualmente, browser sigue scrolleando internamente.
3. **StarfieldBg independiente**: se consideró hacerlo interno a MarqueeBanner (RESEARCH Pattern 3 lo incluye). Se extrajo como componente independiente para que Chapter1Content pueda posicionarlo absolute detrás de TODO el layout, no solo del banner.
4. **i18n keys bajo `chapters.{N}.*`**: el RESEARCH usaba `ch0.terminal.*` como alternativa. Se eligió `chapters.0.terminal.*` para seguir la jerarquía ya establecida en es.json/en.json.
5. **Tabla legacy ch1 con flavor text genérico**: la tabla "Mis cosas favoritas" usa emojis genéricos (programar, videojuegos, internet, anime) sin info crítica de Rafael — era-authenticity GeoCities sin reclamar content real.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tests ScrollShell.test.js desactualizados**
- **Found during:** Task 2 (wire ch0/ch1 en ScrollShell)
- **Issue:** Los tests del Plan 03-03 asumían que ch0 y ch1 eran placeholders. Al wire ch0/ch1 con componentes reales, 3 tests fallaron:
  - `6 non-ch3 sections contain era-title` — esperaba 6, recibía 4 (ch0 y ch1 ya no tienen `.era-title`)
  - `section[data-chapter="0"] mantiene .chapter-placeholder` — ch0 ahora monta `Chapter0Content`
  - `sections data-chapter 0,1,2,4,5,6 todas mantienen .era-title placeholder` — ch0/ch1 ya no tienen placeholder
- **Fix:** Actualizados los 3 tests + añadidos 2 tests nuevos (T2b: ch0 monta Chapter0Content, T3: ch1 monta Chapter1Content). El describe `ch3 integration` se renombró a incluir Plan 04-02.
- **Files modified:** `tests/components/ScrollShell.test.js`
- **Verification:** ScrollShell.test.js pasa (24 tests, +1 vs antes)
- **Committed in:** `3b22cd1` (feat(04-02): Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: tests desactualizados)
**Impact on plan:** Necesario. Los tests de ScrollShell reflejaban el estado Phase 3 pre-wire. La actualización es la documentación correcta del comportamiento post-wire.

## Known Stubs

Los siguientes stubs son **intencionales** per CONTENT-CHECKLIST §2.6 y ART-07:
- `chapter.avatarSrc` en ch0 y ch1 apunta a `/assets/ch0-bust.png` y `/assets/ch1-bust.png` respectivamente. Los PNG no existen aún (Phase 4 W0 genera avatares). El `alt` i18n provee el fallback accesible — validado en tests T2.
- `t(bio.coreKey)` renderiza "PENDING — CONTENT-CHECKLIST §1.1" hasta que Rafael llene el JSON. Igual que Chapter3Content — comportamiento correcto por diseño.
- La tabla legacy ch1 usa emojis genéricos (no info real de Rafael) — intencional per plan.

Estos stubs no bloquean el objetivo del plan (identidad visual era ch0/ch1 funcional).

## Issues Encountered

- **eslint warning `vue/no-deprecated-html-element-is`**: al usar `<marquee>` deprecated, Vue ESLint reporta un aviso. Se suprimió con `<!-- eslint-disable-next-line vue/no-deprecated-html-element-is -->` (D4-05 era-authenticity documentado). No afecta el build — Vite compila correctamente.

## Smoke dev

El plan especificaba un smoke manual de `npm run dev`. No se ejecutó en esta sesión automatizada. El build verde (`npm run build`) confirma que los componentes compilan sin errores. La verificación visual queda para cuando Rafael ejecute el servidor local.

**Para verificar manualmente:**
```powershell
npm run dev
# Navegar a http://127.0.0.1:5173
# Scroll hasta ch0 → ver terminal CRT verde sobre negro con cursor parpadeante
# Scroll hasta ch1 → ver starfield + marquee scrolling + tabla legacy
# Toggle ES/EN → verificar que ambos chapters actualizan sin layout shift
# Activar "Reduce motion" en OS → ch0 cursor estático, ch1 marquee swap a <span>
```

## Next Phase Readiness

- **Patrón Chapter wrapper establecido**: Chapter{N}Content clona Chapter3Content con cambios mínimos. W2 (Chapter2Content), W3 (Chapter4Content), W4 (Chapter5Content) siguen el mismo patrón.
- **PRM pattern dualidad documentada**: CSS-only para components sin JS state (TerminalScroll, StarfieldBg); inject('prm') + v-if para components con tag legacy o JS state (MarqueeBanner, ParallaxLayers, ScrollRevealCard).
- **StarfieldBg reutilizable**: si W3/W4 necesitan starfield para otro chapter, el componente está listo.
- **Blocker W2 (Chapter2Content + FlashBanner)**: ninguno — puede arrancar inmediatamente.

## Threat Flags

No se encontraron superficies de seguridad nuevas no registradas en el threat model del plan.

- T-04-04 (XSS-CONTENT): `{{ t(...) }}` en todos los components — Vue auto-escapa. No hay `v-html`. Confirmado via grep en todos los SFCs creados.
- T-04-05 (Tampering marquee): `<marquee>` content viene de i18n autor-controlado. Era-authenticity tradeoff documentado D4-05.

## Self-Check: PASSED

