---
phase: 02-theme-system-i18n
plan: 02
slug: wave1-lang-toggle-vertical-slice
wave: 1
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements: [I18N-03, I18N-05]
depends_on: [1]
files_modified:
  - src/components/LangToggle.vue
  - src/App.vue
  - src/components/SkipLink.vue
  - src/components/StickyTimeline.vue
  - src/components/StickyAvatar.vue
  - src/components/ScrollShell.vue
  - tests/components/LangToggle.test.js
  - tests/components/SkipLink.test.js
  - tests/components/StickyTimeline.test.js
  - tests/components/StickyAvatar.test.js
notes:
  phase_1_regression_baseline: >
    Suite Phase 1 baseline = 67 tests verdes distribuidos en estos test files que DEBEN
    seguir todos verdes tras W1 (cero regresión funcional):
      - tests/components/SkipLink.test.js (Phase 1 Plan 06)
      - tests/components/StickyTimeline.test.js (Phase 1 Plan 04)
      - tests/components/StickyAvatar.test.js (Phase 1 Plan 03)
      - tests/composables/useScrollState.test.js (Phase 1 Plan 02)
      - tests/composables/usePRM.test.js (Phase 1 Plan 03)
      - tests/smoke.test.js (Phase 1 setup)
      - Cualquier otro test file presente bajo tests/ tracked por git (verificar con
        `Get-ChildItem -Recurse tests -Filter *.test.js` antes de iniciar W1).
    W1 modifica 4 de estos componentes (SkipLink, StickyTimeline, StickyAvatar,
    ScrollShell) para i18nificar strings — los tests existentes se ACTUALIZAN para
    leer desde t() / multiplexar por locale, pero el COUNT total de tests Phase 1
    NO debe disminuir (puede crecer al añadir tests reactive Pitfall 3).
must_haves:
  truths:
    - "Existe un botón pill `.lang-toggle` fijo top-right (16px offsets) con texto 'ES | EN' en desktop ≥600px, simétrico al StickyAvatar top-left (D2-10)"
    - "Click en el LangToggle: locale alterna 'es' ↔ 'en'; `localStorage['portfolio.locale']` persiste; `<html lang>` muta; todos los aria-labels i18nificados reaccionan en el mismo tick (sin recargar — Pitfall 3 evitado)"
    - "En mobile <600px el LangToggle pasa a icon-only ('🌐 ES' o '🌐 EN'); tap target ≥44×44px preservado; `.lang-sep` y `.lang-inactive` ocultos (UI-SPEC §8.3)"
    - "El aria-label del LangToggle viene de `t('ui.langToggle.aria')` y describe la acción (cambiar idioma a inglés / Switch language to Spanish — bilingue per locale activo)"
    - "SkipLink renderiza `t('ui.skipLink')` ('Saltar al contenido' en es, 'Skip to content' en en) — el copy bilingue hardcoded de Phase 1 queda reemplazado por la key i18n"
    - "StickyTimeline nav aria-label viene de `t('ui.timeline.navAria')` y cada tick aria-label viene de `t('ui.timeline.tickAria', { era, year })` con interpolación reactiva"
    - "StickyAvatar aria-label viene de `t('avatar.ariaTemplate', { chapter: activeChapter })` con interpolación reactiva"
    - "ScrollShell aria-label de cada `<section>` viene de `t('chapters.' + ch.id + '.title')` para mostrar el chapter title bilingue (I18N-3 + D2-11)"
    - "El focus-visible del LangToggle hereda el outline 3px solid `var(--c-focus)` universal de App.vue — NO se declara `outline:` propio en `.lang-toggle` (Pitfall 7 evitado)"
    - "El LangToggle es HUD invariante: NO consume `[data-chapter]` overrides, sus colores vienen de `--c-surface`, `--c-border`, `--c-fg`, `--c-muted` neutros (UI-SPEC §8.5) — se ve igual en los 7 chapters"
    - "Cero regresión Phase 1: todos los 67 tests baseline siguen verdes (lista de test files en `notes.phase_1_regression_baseline`); el COUNT total post-W1 ≥ 67 (puede crecer si se añaden tests reactive Pitfall 3)"
  artifacts:
    - path: src/components/LangToggle.vue
      provides: "Component standalone fixed top-right con pill ES|EN + click toggle + persistencia + mobile shrink icon-only"
      contains: "position: fixed"
    - path: tests/components/LangToggle.test.js
      provides: "Tests: DOM contract, click toggle behavior + persist, aria-label reactivo, mobile icon-only CSS, 44px tap target, focus heredado"
      contains: "lang-toggle"
  key_links:
    - from: src/components/LangToggle.vue
      to: src/i18n/index.js
      via: "import { persistLocale } + useI18n() de vue-i18n"
      pattern: "persistLocale"
    - from: src/App.vue
      to: src/components/LangToggle.vue
      via: "import + mount como último hijo del template root"
      pattern: "<LangToggle"
    - from: src/components/SkipLink.vue
      to: src/i18n/index.js
      via: "useI18n() → t('ui.skipLink') en template"
      pattern: "t\\(.ui\\.skipLink.\\)"
    - from: src/components/StickyTimeline.vue
      to: src/i18n/index.js
      via: "useI18n() → t('ui.timeline.navAria') + t('ui.timeline.tickAria', { era, year })"
      pattern: "ui\\.timeline\\.(nav|tick)Aria"
    - from: src/components/StickyAvatar.vue
      to: src/i18n/index.js
      via: "useI18n() → t('avatar.ariaTemplate', { chapter: activeChapter })"
      pattern: "avatar\\.ariaTemplate"
    - from: src/components/ScrollShell.vue
      to: src/i18n/index.js
      via: "useI18n() → t('chapters.' + ch.id + '.title') en :aria-label del <section>"
      pattern: "chapters\\."
---

## Phase Goal (MVP Vertical Slice)

**As a** visitante con un idioma preferido distinto del default, **I want to** tener un botón visible y persistente para cambiar el idioma del sitio, **so that** puedo leer todo en mi idioma sin buscar opciones escondidas.

> **Nota MVP:** este Wave 1 entrega la PRIMERA UI nueva visible (LangToggle top-right) + i18nifica los componentes Phase 1 (SkipLink, StickyTimeline, StickyAvatar, ScrollShell). Tras este plan, el usuario puede click el toggle y ver TODOS los aria-labels + visible text que cambien reactivamente — funcionalidad i18n end-to-end completa para la UI chrome existente.

<objective>
Construir el primer touchpoint visible del motor i18n: `LangToggle.vue` standalone fixed top-right (simétrico al avatar) + i18nificar los strings hardcoded de los 4 componentes Phase 1 que muestran texto/aria-label visible al usuario. Tras este wave, el LangToggle es funcional end-to-end (click → mutate locale → persist → `<html lang>` change → re-render reactivo de todos los aria-labels).

**Purpose:** Cubre I18N-03 (LangToggle con persist localStorage) e I18N-05 (layout robustness ES strings + tests con ambos idiomas). Cierra el bucle del motor i18n haciéndolo visible y útil.

**Lo que ESTE plan NO hace:**
- NO crea `chapter-themes.css` (W2 — los tokens `--c-bg`, `--c-fg`, etc. siguen siendo los neutros de Phase 1).
- NO instala fuentes self-hosted (W4).
- NO crea BackgroundLayers ni useBackgroundMorph (W3).
- NO toca alt-text de busts del avatar (`avatar.busts.N.alt` keys ya existen en W0 pero NO se renderean en el `<img>` aún — Phase 3/4 usa esas keys cuando llegue pixel art real).
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
@.planning/phases/02-theme-system-i18n/02-PATTERNS.md
@.planning/phases/02-theme-system-i18n/02-01-SUMMARY.md
@src/i18n/index.js
@src/i18n/es.json
@src/i18n/en.json
@src/App.vue
@src/components/SkipLink.vue
@src/components/StickyTimeline.vue
@src/components/StickyAvatar.vue
@src/components/ScrollShell.vue
@tests/components/SkipLink.test.js
@tests/components/StickyTimeline.test.js
@tests/components/StickyAvatar.test.js

<interfaces>
<!-- LangToggle.vue — UI-SPEC §8 + RESEARCH Pattern 5 verbatim -->

Script setup imports:
- `useI18n` de `vue-i18n`
- `persistLocale` de `@/i18n` (NOT @/i18n/index — Vite resolverá automáticamente)

Setup:
- `const { locale, t } = useI18n()`
- `function toggle() { const next = locale.value === 'es' ? 'en' : 'es'; locale.value = next; persistLocale(next) }`

Template shape (UI-SPEC §8.1):
- Single `<button class="lang-toggle" :aria-label="t('ui.langToggle.aria')" @click="toggle">`
- Children: 3 spans
  - `<span class="lang-active">{{ locale === 'es' ? 'ES' : 'EN' }}</span>`
  - `<span class="lang-sep" aria-hidden="true">|</span>`
  - `<span class="lang-inactive">{{ locale === 'es' ? 'EN' : 'ES' }}</span>`

CSS scoped (UI-SPEC §8.2 + §8.3 verbatim):
- Base `.lang-toggle`: `position: fixed; top: var(--sp-md); right: var(--sp-md); z-index: 40; display: flex; align-items: center; gap: var(--sp-xs); padding: var(--sp-sm) var(--sp-md); background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 999px; color: var(--c-fg); font-family: var(--font-body, ui-monospace); font-size: 12px; font-weight: 700; cursor: pointer; min-width: 44px; min-height: 44px; justify-content: center; transition: background 150ms ease, color 150ms ease;`
- `.lang-active { color: var(--c-fg); }` `.lang-inactive { color: var(--c-muted); }` `.lang-sep { color: var(--c-muted); }`
- `.lang-toggle:hover { background: var(--c-tick-hover, var(--c-surface)); }`
- NO declarar `outline:` propio — el `:focus-visible` universal de App.vue líneas 117-120 lo cubre.
- `@media (max-width: 599px)` icon-only mode UI-SPEC §8.3 verbatim: padding shrinks a `var(--sp-sm)`, `.lang-sep` y `.lang-inactive` `display: none`, `::before { content: '🌐'; font-size: 14px; margin-right: var(--sp-xs); }`, `.lang-active { font-size: 11px; }`. Mantiene min-width/min-height 44px.

<!-- App.vue extend: append <LangToggle /> al final del template root -->

Imports:
- `import LangToggle from './components/LangToggle.vue'`

Template (PATTERNS.md §App.vue líneas 549-565):
- Orden DOM final post-W1: `<SkipLink />` → `<StickyAvatar />` → `<ScrollShell ... />` → `<StickyTimeline />` → `<LangToggle />`
- (W3 inserta `<BackgroundLayers />` como PRIMER hijo. W1 NO toca esa posición.)

<!-- SkipLink.vue diff: línea 70 verbatim → `{{ t('ui.skipLink') }}` -->

Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()` (sin tocar el resto del setup actual del Plan 06).
Template: línea 70 — reemplazar el texto literal `Saltar al contenido / Skip to content` por `{{ t('ui.skipLink') }}`.

<!-- StickyTimeline.vue diff: nav aria + tick aria -->

Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()`.
Template línea 73-77: `<nav class="sticky-timeline" :aria-label="t('ui.timeline.navAria')" role="navigation">`.
Template línea 93-99: cambiar `:aria-label="\`Ir a ${ch.era} (${ch.year})\`"` por `:aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })"`.

<!-- StickyAvatar.vue diff: aria-label del aside (línea 83) -->

Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()`.
Template línea 83: reemplazar `:aria-label="\`Avatar de Rafael — chapter ${activeChapter} activo\`"` por `:aria-label="t('avatar.ariaTemplate', { chapter: activeChapter })"`.

> NO tocar el state machine de opacity (líneas 33-77) — Phase 2 NO modifica el avatar swap. Solo aria-label.

<!-- ScrollShell.vue diff: section aria-label -->

Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()` (junto al `inject` existente líneas 40-41).
Template línea 79: reemplazar `:aria-label="\`${ch.era} — ${ch.year}\`"` por `:aria-label="t('chapters.' + ch.id + '.title')"` para que la section anuncie el chapter title bilingue. NOTA: NO migrar el array `chapters` (líneas 25-33) a `src/data/chapters.js` — eso es Phase 3 (PATTERNS.md decision #4). El array literal sigue inline.

<!-- Test plumbing global: createTestI18n helper -->

Los 4 tests Phase 1 (SkipLink, StickyTimeline, StickyAvatar, ScrollShell — el último no existe, NO crear) actualmente NO usan vue-i18n. Para que `t()` funcione en mount, cada `mount(Component, ...)` necesita `global: { plugins: [createI18n({ legacy: false, locale: 'es', messages: { es: { ... }, en: { ... } } })] }`. Crear helper exportable (NO obligatorio — puede inline en cada test) `tests/i18n/test-helpers.js` con:
- `createTestI18n({ locale = 'es' } = {})` que retorna un `createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { es: require('@/i18n/es.json'), en: require('@/i18n/en.json') } })` (o `import` ES module syntax).

Alternativamente, inline en cada test la creación del i18n test instance — escoger lo que aporte menos boilerplate a la suite final.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 2.1: Crear LangToggle.vue + tests RED→GREEN + montar en App.vue</name>
  <files>
    src/components/LangToggle.vue,
    src/App.vue,
    tests/components/LangToggle.test.js
  </files>
  <read_first>
    src/components/SkipLink.vue (analog 1: HUD invariante fixed + bilingue + a11y — PATTERNS.md líneas 244-247 + 262-281),
    src/components/StickyTimeline.vue líneas 195-208 (analog 2: `.tick-button` shape — 44×44 tap target + neutral tokens — PATTERNS.md líneas 271-281),
    src/components/StickyAvatar.vue líneas 101-108 + 142-152 (analog patrón fixed top-left simétrico al top-right del LangToggle + mobile shrink @media 599px — PATTERNS.md líneas 263-298),
    tests/components/SkipLink.test.js Tests 1-4 (DOM contract + texto bilingue + click hide pattern),
    tests/components/StickyTimeline.test.js Tests 7-8 líneas 172-189 (click handler spy pattern),
    tests/components/StickyAvatar.test.js Tests 7-10 líneas 178-218 (readFileSync raw-source CSS asserts pattern — PATTERNS.md §"Pattern: readFileSync raw-source CSS asserts" líneas 796-816),
    .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §8 (DOM + CSS desktop + mobile shrink VERBATIM líneas 614-705),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §Pattern 5 líneas 803-869 (LangToggle complete source verbatim)
  </read_first>
  <behavior>
    LangToggle.vue tests (al menos 9):
    - T1 DOM: mount(LangToggle) con plugin i18n locale='es' → existe `<button class="lang-toggle">` con `aria-label === "Cambiar idioma a inglés"` y 3 `<span>` children
    - T2 DOM active/inactive: con locale='es', `.lang-active` text === 'ES' y `.lang-inactive` text === 'EN'; con locale='en' → invertido
    - T3 click toggle: click el button con locale='es' inicial → `locale.value === 'en'` tras click; aria-label cambia a "Switch language to Spanish"
    - T4 persist: spy `localStorage.setItem`; click toggle → spy called with `('portfolio.locale', 'en')` (verifica que persistLocale invoca correctamente)
    - T5 visible texts swap: tras click toggle, `.lang-active` text === 'EN' y `.lang-inactive` text === 'ES'
    - T6 aria reactive (Pitfall 3): mount con locale='es', aria-label inicial "Cambiar idioma a inglés"; mutate `locale.value = 'en'` + flushPromises → aria-label === "Switch language to Spanish" (NO captured-once en setup)
    - T7 CSS readFileSync: source contiene `position:\s*fixed`, `top:\s*var\(--sp-md\)`, `right:\s*var\(--sp-md\)`, `z-index:\s*40`, `min-width:\s*44px`, `min-height:\s*44px`, `border-radius:\s*999px`
    - T8 CSS no outline declared: source NO contiene `outline:` dentro de `.lang-toggle` block (Pitfall 7 — focus heredado del universal)
    - T9 CSS mobile @media: source contiene `@media\s*\(max-width:\s*599px\)` con declaraciones `.lang-sep` + `.lang-inactive` con `display:\s*none` y `::before` con `content:\s*'🌐'`
  </behavior>
  <action>
    Crear `src/components/LangToggle.vue` con script setup + template + style scoped según UI-SPEC §8 y RESEARCH Pattern 5 verbatim. Notas críticas:
    - Comentario header bloque al inicio del `<script setup>` análogo a SkipLink.vue líneas 1-12: anchor del propósito + ref a UI-SPEC §8 + D2-10 + I18N-03.
    - `useI18n()` retorna `{ locale, t }` (NO usar `inject` — RESEARCH §935 Don't Hand-Roll: i18n NO se provide manualmente, el plugin Vue lo inyecta globalmente).
    - `function toggle()`: ternario simple `locale.value === 'es' ? 'en' : 'es'`; asignar a `locale.value` PRIMERO (reactividad de vue-i18n re-evalúa todos los `t()`), luego invocar `persistLocale(next)`.
    - CSS scoped VERBATIM de UI-SPEC §8.2 + §8.3. NO declarar `outline:` propio en `.lang-toggle:focus` ni `.lang-toggle:focus-visible` (Pitfall 7 — el universal de App.vue líneas 117-120 cubre).
    - El globe `🌐` es emoji unicode, no SVG; UI-SPEC §8.3 lo locked como pseudo-element `::before { content: '🌐' }` en el @media mobile.

    Crear `tests/components/LangToggle.test.js` con los 9 tests del bloque `<behavior>`. Patrones a aplicar verbatim:
    - **Mount helper** análogo a `tests/components/StickyAvatar.test.js` líneas 44-56 (`mountAvatar`): crear `mountLangToggle({ initialLocale = 'es' } = {})` que retorne wrapper + i18n instance mutables para que los tests muten `i18n.global.locale.value`. Plugins: `[createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { es, en } })]` donde `es`/`en` son imports de los JSON.
    - **persistLocale spy**: `vi.mock('@/i18n', () => ({ persistLocale: vi.fn(), ... }))` o `vi.spyOn(localStorage, 'setItem')` directamente — preferir el segundo (menos magic, valida el side effect real).
    - **CSS asserts**: `readFileSync(resolve(process.cwd(), 'src/components/LangToggle.vue'), 'utf8')` + regex matches como en `tests/components/StickyAvatar.test.js` líneas 178-218 verbatim.
    - **flushPromises**: importar de `@vue/test-utils` para test T6 (aria reactive).

    Modificar `src/App.vue`:
    - Añadir `import LangToggle from './components/LangToggle.vue'` (junto a los imports de componentes existentes líneas 26-29).
    - Añadir `<LangToggle />` como ÚLTIMO hijo del template root (después de `<StickyTimeline />`). NO insertar antes del StickyTimeline — el orden DOM definido en PATTERNS.md líneas 549-565 + UI-SPEC §7.3 colocan al LangToggle como último.
    - Verificar que el orden final del template root post-W1 es: `<SkipLink /> → <StickyAvatar /> → <ScrollShell ... /> → <StickyTimeline /> → <LangToggle />`. (W3 insertará `<BackgroundLayers />` como PRIMER hijo, pero eso no es Wave 1).

    Tests RED commit → GREEN commit separado (TDD discipline).
  </action>
  <verify>
    <automated>npm run test:run -- tests/components/LangToggle &amp;&amp; npm run test:run &amp;&amp; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/LangToggle.vue` existe con: script setup que importa `useI18n` y `persistLocale`, button con clase `lang-toggle`, 3 span children con clases `lang-active`/`lang-sep`/`lang-inactive`
    - `tests/components/LangToggle.test.js` corre ≥9 tests verdes
    - CSS source contiene: `position: fixed`, `top: var(--sp-md)`, `right: var(--sp-md)`, `z-index: 40`, `min-width: 44px`, `min-height: 44px`, `border-radius: 999px`
    - CSS source NO contiene `outline:` dentro de `.lang-toggle` (Pitfall 7)
    - CSS source contiene `@media (max-width: 599px)` con `display: none` para `.lang-sep` y `.lang-inactive` y `content: '🌐'`
    - `src/App.vue` template contiene literal `<LangToggle />` como último hijo del template root
    - `npm run build` completa verde; bundle JS incluye string `lang-toggle` (verificable con `Select-String dist/assets/index-*.js -Pattern "lang-toggle" -Quiet` returns `True`)
    - Suite global ≥85 + ≥9 nuevos LangToggle = ≥94 tests verdes
    - Mount manual en dev: LangToggle visible top-right en cada chapter; click → `localStorage.getItem('portfolio.locale')` muta de 'es' a 'en'; `<html lang>` muta; aria-label del button muta
  </acceptance_criteria>
  <done>LangToggle.vue funcional, montado en App.vue, ≥9 tests verdes, build verde, persist + reactividad verificadas.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2.2: i18nificar SkipLink + StickyTimeline + StickyAvatar + ScrollShell + actualizar tests existentes</name>
  <files>
    src/components/SkipLink.vue,
    src/components/StickyTimeline.vue,
    src/components/StickyAvatar.vue,
    src/components/ScrollShell.vue,
    tests/components/SkipLink.test.js,
    tests/components/StickyTimeline.test.js,
    tests/components/StickyAvatar.test.js
  </files>
  <read_first>
    src/components/SkipLink.vue línea 70 (texto bilingue hardcoded actual — i18nificar a t('ui.skipLink') — PATTERNS.md líneas 651-660),
    src/components/StickyTimeline.vue líneas 73-77 + 93-99 (nav aria + tick aria hardcoded ES — PATTERNS.md líneas 622-642),
    src/components/StickyAvatar.vue línea 83 (aria-label hardcoded — PATTERNS.md líneas 671-682),
    src/components/ScrollShell.vue líneas 74-85 (section v-for + aria-label hardcoded — PATTERNS.md líneas 573-616),
    tests/components/SkipLink.test.js Test 1 línea 45 (assertion del texto bilingue literal — debe migrarse a leer t() según el i18n provisto en mount),
    tests/components/StickyTimeline.test.js (asserts de aria-labels literales que requieren multiplexing ES/EN según locale del test mount),
    tests/components/StickyAvatar.test.js Test 1 línea 73 (assertion literal 'Avatar de Rafael — chapter 3 activo' — debe migrarse o usar regex),
    src/i18n/es.json + src/i18n/en.json (keys disponibles desde W0 — VERIFICAR que existen los 7 chapters.N.title + ui.skipLink + ui.timeline.navAria/tickAria + avatar.ariaTemplate)
  </read_first>
  <behavior>
    SkipLink — al menos 1 test extra (extend del existente):
    - T (extend): mount(SkipLink) con plugin i18n locale='es' → `<a>` text === 'Saltar al contenido' (NOT bilingue verbatim); con locale='en' → 'Skip to content'
    - Regression: los 8 tests existentes del Plan 06 siguen verdes (DOM contract, visible at-load, hide-on-scroll, hide-on-blur, listener registration, CSS position/hidden/PRM)

    StickyTimeline — extender tests existentes:
    - T (extend nav aria): mount con locale='es' → `<nav>` aria-label === 'Navegación de capítulos por era'; con locale='en' → 'Era-based chapter navigation'
    - T (extend tick aria): mount con locale='es' + chapter 3 active → tick[data-chapter=3] aria-label contiene 'Ir a' + 'Web 2.0' + '2013'; con locale='en' → 'Go to' + 'Web 2.0' + '2013'
    - T (Pitfall 3 reactive): mutate locale 'es'→'en' + nextTick → aria-labels actualizan SIN re-mount (no captured-once)

    StickyAvatar — extender tests existentes:
    - T (extend): mount con locale='es' + chapter 3 active → `<aside>` aria-label === 'Avatar de Rafael — capítulo 3 activo' (NOTAR: copy actualizado para usar 'capítulo' coherente con UI-SPEC §11.2 que dice "capítulo"; el actual SkipLink Phase 1 dice "chapter" — actualizar el assertion al copy NUEVO)
    - T (Pitfall 3 reactive): toggle locale → aria-label cambia + interpolation `{chapter}` sigue funcionando con activeChapter

    ScrollShell — añadir 1-2 tests (el componente NO tiene tests de Phase 1 propios — verificar con `Get-ChildItem tests/components/ScrollShell*`):
    - Si NO existe `tests/components/ScrollShell.test.js`, crear con al menos 2 tests:
      - T1 DOM: mount con plugin i18n locale='es' → encuentra 7 `<section>` cada uno con `data-chapter` 0..6 + `:aria-label` = t('chapters.N.title') (ej. section[data-chapter=3] → aria-label === 'Web 2.0: UX + dev + líder')
      - T2 reactive: toggle locale 'es'→'en' + nextTick → aria-label de section[data-chapter=3] === 'Web 2.0: UX + dev + lead'
    - Si SÍ existe ya un test (Plan 02 lo creó o no), extenderlo coherentemente. Probable que NO exista — Phase 1 tested via `tests/composables/useScrollState.test.js` que monta un wrapper template con stubs.

    NOTA: tests pueden requerir helper `createTestI18n()` o inline `createI18n` en cada mount. Si la duplicación es notable (>2 tests inline), extraer al helper `tests/i18n/test-helpers.js`.
  </behavior>
  <action>
    Modificar cada uno de los 4 componentes Phase 1 con el diff mínimo locked en PATTERNS.md:

    **SkipLink.vue:**
    - Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()` (junto a los imports existentes).
    - Template línea 70: reemplazar texto literal `Saltar al contenido / Skip to content` por `{{ t('ui.skipLink') }}`.
    - NO tocar el resto (state, handlers, CSS).

    **StickyTimeline.vue:**
    - Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()`.
    - Template línea 73-77 `<nav>`: cambiar `aria-label="Navegación de capítulos por era"` → `:aria-label="t('ui.timeline.navAria')"`.
    - Template línea 93-99 `<button>`: cambiar ``:aria-label="`Ir a ${ch.era} (${ch.year})`"`` → `:aria-label="t('ui.timeline.tickAria', { era: ch.era, year: ch.year })"`.
    - NO tocar el resto (script lógica, CSS, otros aria-attrs).

    **StickyAvatar.vue:**
    - Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()` (junto a los imports `ref, inject, watch, nextTick` existentes).
    - Template línea 83: cambiar ``:aria-label="`Avatar de Rafael — chapter ${activeChapter} activo`"`` → `:aria-label="t('avatar.ariaTemplate', { chapter: activeChapter })"`.
    - NO tocar el state machine de opacity (líneas 33-77) ni CSS.

    **ScrollShell.vue:**
    - Setup: añadir `import { useI18n } from 'vue-i18n'` y `const { t } = useI18n()` (en la sección de imports líneas 22, junto a `ref, inject`).
    - Template línea 79 dentro del `v-for`: cambiar ``:aria-label="`${ch.era} — ${ch.year}`"`` → `:aria-label="t('chapters.' + ch.id + '.title')"` (concatenación explícita; vue-i18n permite tanto `t('chapters.' + ch.id + '.title')` como template literal — el primero es más simple y matchea el regex de PATTERNS.md key_links).
    - NO migrar el array `chapters` (líneas 25-33) a `src/data/chapters.js` — eso es Phase 3 CON-05.
    - NO modificar el placeholder visible `<p class="era-title">{{ ch.year }} · {{ ch.era }}</p>` (Phase 3/4 lo i18nificará cuando llegue contenido visible real; Phase 2 solo i18nifica el aria-label).

    Actualizar los 3 tests existentes (`SkipLink.test.js`, `StickyTimeline.test.js`, `StickyAvatar.test.js`):
    - Añadir helper `createTestI18n({ locale = 'es' })` inline en cada test o crear `tests/i18n/test-helpers.js` exportable (decision: si los 4 tests duplican >5 LOC del setup i18n, extraer al helper).
    - Cambiar todos los `mount(Component)` a `mount(Component, { global: { plugins: [createTestI18n({ locale: 'es' })] } })`.
    - Actualizar assertions: los que comparan strings literales hardcoded deben:
      - Multiplexar por locale: `expect(node.text()).toBe(locale === 'es' ? 'Saltar al contenido' : 'Skip to content')`
      - O usar regex tolerante: `expect(node.text()).toMatch(/Saltar al contenido|Skip to content/)`
      - O leer la key directamente del JSON: `import es from '@/i18n/es.json'; expect(node.text()).toBe(es.ui.skipLink)`
    - Añadir 1 test nuevo por componente que verifique reactividad (Pitfall 3): mutate `i18n.global.locale.value = 'en'` → flushPromises → assert aria-label/text en EN.

    Crear `tests/components/ScrollShell.test.js` si NO existe — con 2 tests mínimos (ver `<behavior>`). Si existe, extender.

    Tests RED commit (assertions actualizadas fallan porque componentes aún no i18nifican) → GREEN commit (diff de componentes hace pasar todos los tests). Considerar combinar SkipLink+Timeline+Avatar+ScrollShell en un solo commit "feat(i18n): wave1 i18nify Phase 1 components" si el flujo TDD es coherente.
  </action>
  <verify>
    <automated>npm run test:run -- tests/components/ &amp;&amp; npm run test:run &amp;&amp; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/components/SkipLink.vue` template contiene literal `{{ t('ui.skipLink') }}` y NO contiene el string literal `Saltar al contenido / Skip to content`
    - `src/components/StickyTimeline.vue` contiene `t('ui.timeline.navAria')` y `t('ui.timeline.tickAria', { era:` (al menos como sub-string en el template)
    - `src/components/StickyAvatar.vue` contiene `t('avatar.ariaTemplate', { chapter: activeChapter })`
    - `src/components/ScrollShell.vue` contiene `t('chapters.' + ch.id + '.title')` (o equivalente template literal `t(\`chapters.${ch.id}.title\`)`)
    - **Phase 1 regression baseline (cero regresión funcional)**: todos los tests files listados en `notes.phase_1_regression_baseline` siguen verdes — específicamente:
      - `tests/components/SkipLink.test.js` corre ≥9 tests verdes (8 originales Phase 1 Plan 06 + 1+ extra reactive Pitfall 3)
      - `tests/components/StickyTimeline.test.js` corre los tests originales Phase 1 Plan 04 verdes + ≥2 nuevos para i18n reactive nav/tick
      - `tests/components/StickyAvatar.test.js` corre tests originales Phase 1 Plan 03 (≥10) + ≥1 reactive verdes
      - `tests/composables/useScrollState.test.js` sigue verde sin modificaciones
      - `tests/composables/usePRM.test.js` sigue verde sin modificaciones
      - `tests/smoke.test.js` sigue verde sin modificaciones
    - `tests/components/ScrollShell.test.js` existe con ≥2 tests verdes (o el existente tiene assertions equivalentes para i18n)
    - Suite global `npm run test:run` ≥100 tests verdes (Phase 1 baseline 67 + W0 18 + LangToggle 9 + extends en ≥4 componentes ≥6 = ≥100); el COUNT total NO debe haber disminuido respecto a Phase 1 + W0 (≥85 → ≥100)
    - `npm run build` verde; bundle CSS no crece más de ~1KB (i18nificar es pure data, NO añade CSS)
    - DevTools manual: con LangToggle activo desde W1.1, toggle locale → ver en DevTools elements panel que aria-label del SkipLink, de cada `<button class="tick-button">` (7 ticks), del `<aside class="sticky-avatar">` y de cada `<section data-chapter>` cambia entre ES/EN sin recargar la página
  </acceptance_criteria>
  <done>4 componentes Phase 1 i18nificados, todos los test files Phase 1 listados en `notes.phase_1_regression_baseline` siguen verdes (cero regresión funcional), ≥4 tests nuevos de reactive aria, suite global verde, build verde.</done>
</task>

</tasks>

<verification>
- Comando: `npm run test:run && npm run build`
- Esperado: ≥100 tests verdes, build verde, bundle CSS ~5KB, bundle JS ~75-77KB (i18n + LangToggle + reactive bindings añaden ~3-5KB)
- DevTools manual: `npm run dev` → toggle LangToggle (top-right) → `<html lang>` muta + `localStorage["portfolio.locale"]` persiste + todos los aria-labels i18nificados cambian sin reload + tap target ≥44×44 verificable en DevTools accessibility panel
- Mobile simulator 375×667: LangToggle reduce a icon-only (🌐 ES o 🌐 EN); tap target sigue 44×44px; no horizontal overflow
</verification>

<success_criteria>
- LangToggle.vue funcional + visible top-right + persist + icon-only mobile (I18N-03)
- SkipLink/StickyTimeline/StickyAvatar/ScrollShell renderean aria-labels y text desde keys i18n
- Reactividad i18n verificada (Pitfall 3 evitado) — toggle locale propaga sin re-mount
- Layout robustness preliminar (I18N-05) — LangToggle ancho estable, no overflow horizontal en 375×667 (test final en W5 manual checklist)
- Suite global ≥100 tests verdes, build verde
- Phase 1 zero regression — todos los test files listados en `notes.phase_1_regression_baseline` siguen verdes
</success_criteria>

<output>
After completion, create `.planning/phases/02-theme-system-i18n/02-02-SUMMARY.md` con:
- LangToggle.vue creado (LOC, principal CSS choices)
- 4 componentes Phase 1 i18nificados (diff scope)
- Tests añadidos/extendidos (count y mapping a REQ-IDs)
- Phase 1 regression baseline confirmado (lista de test files verdes — ver `notes.phase_1_regression_baseline`)
- Decisiones tomadas (helper test-helpers.js sí/no, assertion multiplexing strategy)
- Pending para W2: chapter-themes.css con motor de themes + ch0/ch1 completos + stubs ch2-6
</output>
