---
phase: 02-theme-system-i18n
plan: 03
slug: wave2-chapter-themes-css
wave: 2
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements: [THM-01, THM-02, THM-03, THM-04, THM-05, A11Y-03, A11Y-04]
depends_on: [1]
files_modified:
  - src/styles/chapter-themes.css
  - src/main.js
  - tests/styles/themes-file.test.js
  - tests/styles/theme-tokens.test.js
  - tests/styles/contrast-docs.test.js
  - tests/styles/focus-ring.test.js
  - tests/components/ScrollShell.theme-isolation.test.js
must_haves:
  truths:
    - "Existe `src/styles/chapter-themes.css` con declaración `@layer reset, themes, components, utilities;` en la primera línea no-comentario del archivo (THM-02)"
    - "El archivo contiene 7 bloques `[data-chapter=\"N\"]` (N=0..6) dentro de `@layer themes` con 6 tokens cada uno (`--c-bg`, `--c-fg`, `--c-accent`, `--c-border`, `--c-focus`, `--font-body`) — THM-01 + THM-03"
    - "ch0 completo: `--c-bg: #000000`, `--c-fg: #00ff41`, `--c-accent: #00ff41`, `--c-border: #003311`, `--c-focus: #00ff41`, `--font-body: 'VT323', ui-monospace, monospace` (UI-SPEC §4.2 ch0 verbatim)"
    - "ch1 completo: `--c-bg: #000080`, `--c-fg: #ff00ff`, `--c-accent: #ffff00`, `--c-border: #ffffff`, `--c-focus: #ffffff`, `--font-body: 'Comic Neue', 'Comic Sans MS', cursive` (UI-SPEC §4.2 ch1 verbatim)"
    - "ch2-6 stubs era-tinted con tokens de UI-SPEC §4.2 verbatim (ch2 Flash purple/lavender, ch3 Web 2.0 pastel/Lobster, ch4 AR/VR deep space/Audiowide, ch5 Modern white/Inter Variable, ch6 Phaser deep blue/Press Start 2P)"
    - "El bloque ch1 tiene un comentario inline VERBATIM (D2-03 + THM-05): `/* contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here as era-authentic tradeoff per THM-05; era-accurate visual identity (Comic Sans + magenta on starry navy) demands this. Compensated by larger font-size 18px+ minimum which improves perceived legibility. */`"
    - "Los otros 6 bloques (ch0, ch2-6) NO requieren contrast tradeoff comment porque sus ratios ≥ 4.5:1 (UI-SPEC §4.2 muestra tablas con WCAG AAA pass)"
    - "`chapter-themes.css` está importado en `src/main.js` ANTES de `createApp(App).use(i18n).mount('#app')` para que el browser cascade aplique antes del primer render"
    - "El `:root` fallback neutral de App.vue líneas 76-98 sigue intacto — `chapter-themes.css` NO duplica esos tokens; SOLO override por chapter via `[data-chapter=\"N\"]`"
    - "Cada `<section>` de ScrollShell renderea con su correspondiente `data-chapter` (ya en place desde Phase 1) — verificado por test unit que cada section tiene el atributo correcto y NO hereda de un ancestor (THM-04 architectural)"
    - "El `:focus-visible` universal de App.vue (3px solid var(--c-focus), offset 3px) se mantiene intacto — A11Y-03 cumple variando `--c-focus` per chapter sin perder grosor/offset"
  artifacts:
    - path: src/styles/chapter-themes.css
      provides: "@layer + 7 theme blocks + ch1 contrast tradeoff comment + comment header con anchor THM-01..05"
      contains: "@layer reset, themes, components, utilities"
    - path: tests/styles/themes-file.test.js
      provides: "Tests: file exists + @layer declaration order + 7 [data-chapter] blocks present (THM-01, THM-02)"
      contains: "themes-file"
    - path: tests/styles/theme-tokens.test.js
      provides: "Tests: cada chapter tiene los 6 tokens; valores ch0/ch1 verificados verbatim (THM-03)"
      contains: "theme-tokens"
    - path: tests/styles/contrast-docs.test.js
      provides: "Tests: ch1 tiene comentario tradeoff con formato verbatim D2-03; otros chapters NO requieren (THM-05)"
      contains: "contrast"
    - path: tests/styles/focus-ring.test.js
      provides: "Tests: App.vue mantiene :focus-visible universal 3px solid offset 3px; chapter-themes.css NO declara `outline:` (Pitfall 7)"
      contains: "focus-visible"
    - path: tests/components/ScrollShell.theme-isolation.test.js
      provides: "Tests: cada section tiene data-chapter correcto; ningún ancestor tiene data-chapter (THM-04 architectural)"
      contains: "theme-isolation"
  key_links:
    - from: src/main.js
      to: src/styles/chapter-themes.css
      via: "import './styles/chapter-themes.css' antes de mount"
      pattern: "chapter-themes\\.css"
    - from: src/styles/chapter-themes.css
      to: src/components/ScrollShell.vue
      via: "selectors [data-chapter=\"N\"] matching el v-for de ScrollShell líneas 74-85"
      pattern: "\\[data-chapter="
---

## Phase Goal (MVP Vertical Slice)

**As a** visitante haciendo scroll de chapter 0 a chapter 6, **I want to** que cada chapter tenga una identidad visual era-auténtica inequívoca, **so that** percibo el viaje del tiempo (1995 → 2026) como cambios visuales tangibles sin necesidad de leer texto.

> **Nota MVP:** este Wave 2 entrega el MOTOR de themes + paleta + tipografía COMPLETA para los 7 chapters. Tras este plan, scrollear muestra cambios visuales reales entre chapters: ch0 negro fosforescente terminal verde, ch1 Comic Sans magenta sobre navy estrellado, ch2-6 era-tinted stubs distinguibles. Las fuentes self-hosted llegan en W4 (mientras tanto los fallbacks system-safe — `monospace`, `cursive`, `serif`, `sans-serif`, `system-ui` — dan la dirección visual). El background morph entre eras llega en W3.

<objective>
Construir el motor visual: `src/styles/chapter-themes.css` con `@layer` cascade + 7 bloques `[data-chapter="N"]` (2 completos + 5 stubs era-tinted). Wire el import en `main.js`. Crear los 5 tests unit que verifican (1) la existencia del archivo y el @layer order, (2) los tokens per chapter, (3) el contrast tradeoff comment de ch1, (4) el focus ring universal preservado, (5) la theme isolation architectural (cada section tiene data-chapter, ningún ancestor lo tiene).

**Purpose:** Cubre los 7 REQ-IDs de visuals del phase (THM-01..05 + A11Y-03 + A11Y-04). Hace el sitio "se vea diferente" en cada chapter incluso sin fuentes custom (que vienen en W4) ni background morph (W3) — el inside-color de cada section ya cambia.

**Lo que ESTE plan NO hace:**
- NO crea BackgroundLayers ni useBackgroundMorph (W3 — los fondos full-frame con bg-image llegan después).
- NO instala fuentes self-hosted (W4 — `font-display: swap` con fallback system-safe es lo que se ve en W2).
- NO toca i18n (W0 + W1 lo cubren).
- NO añade era-authentic UI components (Phase 3/4 — botones Web 2.0 glossy, marquees, AR/VR panels).
- NO declara nada en `@layer components` ni `@layer utilities` (esos quedan como namespace reservado para Phase 3/4).
- NO finaliza ch3 — su stub era-tinted basta hasta que Phase 3 entregue paleta + pixel art definitivos (D2-01).
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
@.planning/phases/02-theme-system-i18n/02-02-SUMMARY.md
@src/App.vue
@src/components/ScrollShell.vue
@src/main.js
@tests/components/StickyAvatar.test.js

<interfaces>
<!-- src/styles/chapter-themes.css — RESEARCH Pattern 1 verbatim (líneas 294-409) + UI-SPEC §4.2 verbatim -->

Estructura del archivo (en este orden):

1. Comment header bloque (análogo a App.vue líneas 71-75 — anchor del propósito + ref a UI-SPEC §4 + THM-01..05):
   - Mencionar: motor de themes Phase 2, 7 chapters, ch0/ch1 completos, ch2-6 stubs, @layer cascade, source of truth UI-SPEC §4.2.

2. `@layer reset, themes, components, utilities;` — DECLARACIÓN al top (no dentro de bloque). Esto establece el orden ASCENDENTE de prioridad (RESEARCH Pattern 1).

3. `@layer themes { ... }` — único layer poblado en Phase 2. Dentro:
   - **Comment anchor `:root` neutral:** "Fallback neutral declarado en App.vue líneas 76-98; chapter-themes.css NO duplica el :root — solo override per chapter."
   - **`[data-chapter="0"] { ... }`** — ch0 completo, 6 tokens verbatim de UI-SPEC §4.2 ch0:
     - `--c-bg: #000000`
     - `--c-fg: #00ff41`
     - `--c-accent: #00ff41`
     - `--c-border: #003311`
     - `--c-focus: #00ff41`
     - `--font-body: 'VT323', ui-monospace, monospace`
     - Comment inline: `/* contrast(#00ff41, #000000) = 15.3:1 — WCAG AAA passes naturally for ch0 (CRT terminal green-on-black era-authentic). No tradeoff documentation required. */` (informativo; D2-03 dice "no requiere" pero ayudar al auditor humano deja explícito que se computó)
   - **`[data-chapter="1"] { ... }`** — ch1 completo, 6 tokens verbatim:
     - `--c-bg: #000080`
     - `--c-fg: #ff00ff`
     - `--c-accent: #ffff00`
     - `--c-border: #ffffff`
     - `--c-focus: #ffffff`
     - `--font-body: 'Comic Neue', 'Comic Sans MS', cursive`
     - **Comment tradeoff inline VERBATIM (D2-03 + UI-SPEC §4.2 ch1):** `/* contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here as era-authentic tradeoff per THM-05; era-accurate visual identity (Comic Sans + magenta on starry navy) demands this. Compensated by larger font-size 18px+ minimum which improves perceived legibility. */`
   - **`[data-chapter="2"] { ... }`** — ch2 stub, 6 tokens verbatim de UI-SPEC §4.2 ch2:
     - `--c-bg: #2a1a4a; --c-fg: #e0c0ff; --c-accent: #ff8800; --c-border: #8060c0; --c-focus: #ffaa00; --font-body: 'Verdana', 'Trebuchet MS', sans-serif;`
     - Comment informativo: contrast 12.6:1 AAA, Phase 4 finaliza.
   - **`[data-chapter="3"] { ... }`** — ch3 stub (default landing), 6 tokens UI-SPEC §4.2 ch3:
     - `--c-bg: #f0f4ff; --c-fg: #1a1a2e; --c-accent: #ff6699; --c-border: #a0b0d8; --c-focus: #0066cc; --font-body: 'Lobster', Georgia, serif;`
     - Comment informativo: contrast 13.4:1 AAA, Phase 3 finaliza.
   - **`[data-chapter="4"] { ... }`** — ch4 stub, UI-SPEC §4.2 ch4:
     - `--c-bg: #0a0f2e; --c-fg: #b0d0ff; --c-accent: #00ffff; --c-border: #2050a0; --c-focus: #00ffff; --font-body: 'Audiowide', 'Eurostile', sans-serif;`
     - Comment informativo: contrast 11.8:1 AAA, Phase 4 finaliza.
   - **`[data-chapter="5"] { ... }`** — ch5 stub, UI-SPEC §4.2 ch5:
     - `--c-bg: #ffffff; --c-fg: #1a1a2e; --c-accent: #6366f1; --c-border: #e2e8f0; --c-focus: #6366f1; --font-body: 'Inter Variable', system-ui, sans-serif;`
     - Comment informativo: contrast 14.2:1 AAA, Phase 4 finaliza.
   - **`[data-chapter="6"] { ... }`** — ch6 stub, UI-SPEC §4.2 ch6:
     - `--c-bg: #000814; --c-fg: #c0e0ff; --c-accent: #ffaa00; --c-border: #1a4080; --c-focus: #ffaa00; --font-body: 'Press Start 2P', monospace;`
     - Comment informativo: contrast 10.8:1 AAA, Phase 5 finaliza con escena Phaser.

4. `@layer components {}` — vacío con comentario "Phase 3/4 reservado para era-authentic UI components".

5. `@layer utilities {}` — vacío con comentario "Phase 3/4 reservado para utility classes responsive".

> **NO** declarar `body { background: var(--c-bg); }` ni nada similar. El motor de themes confía en que cada section tiene su propio `data-chapter` (ya en place en ScrollShell.vue desde Phase 1) y CSS Custom Props descienden naturalmente al placeholder + era-title. El `<section>` actual de ScrollShell tiene `background: var(--c-bg); color: var(--c-fg);` en su CSS scoped (línea 124-125) — esto YA consume los tokens override por chapter automáticamente sin tocar el componente.

<!-- src/main.js diff: añadir import del CSS antes del mount -->

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles/chapter-themes.css'   // ← AÑADIR (W2): @layer cascade + 7 themes

createApp(App).use(i18n).mount('#app')
```

Order matters: `chapter-themes.css` debe importarse ANTES del `mount` para que el browser parsee el cascade antes del primer render. Vite bundles CSS imports en orden de declaración.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 3.1: Crear src/styles/chapter-themes.css con @layer + 7 chapter blocks (ch0/ch1 completos + ch2-6 stubs) + wire en main.js</name>
  <files>
    src/styles/chapter-themes.css,
    src/main.js,
    tests/styles/themes-file.test.js,
    tests/styles/theme-tokens.test.js,
    tests/styles/contrast-docs.test.js
  </files>
  <read_first>
    src/App.vue líneas 76-98 (analog `:root` neutral fallback — PATTERNS.md §src/styles/chapter-themes.css líneas 374-414; el motor de themes Phase 2 NO duplica este `:root`, solo escala el patrón a 7 selectors `[data-chapter="N"]`),
    src/components/ScrollShell.vue líneas 74-85 (v-for con `:data-chapter="ch.id"` ya hardcoded — los themes Phase 2 SOLO consumen este DOM existente, sin modificar el componente),
    src/components/ScrollShell.vue líneas 115-126 (CSS scoped del `.chapter-section` con `background: var(--c-bg); color: var(--c-fg);` — esto YA consume los tokens override automáticamente al cambiar el data-chapter),
    .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §4.2 (los 7 theme blocks VERBATIM con tokens + contrast values + comentarios; copiar literal),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §Pattern 1 líneas 294-409 (estructura del archivo verbatim + @layer order + @layer themes inner blocks),
    .planning/phases/02-theme-system-i18n/02-PATTERNS.md §"src/styles/chapter-themes.css" líneas 374-435 (comment-doc pattern del analog App.vue + token structure + contrast tradeoff comment pattern),
    .planning/phases/02-theme-system-i18n/02-VALIDATION.md líneas 45-50 (verification map THM-01..03 → tests/styles/*),
    tests/components/StickyAvatar.test.js líneas 36-40 + 178-218 (analog readFileSync raw-source pattern — PATTERNS.md §"Pattern: readFileSync raw-source CSS asserts" líneas 796-816)
  </read_first>
  <behavior>
    **themes-file.test.js (al menos 4 tests — THM-01 + THM-02):**
    - T1 existence: `readFileSync('src/styles/chapter-themes.css', 'utf8')` no throws; archivo no-vacío
    - T2 @layer declaration: source contiene literal `@layer reset, themes, components, utilities;` (con cualquier whitespace tolerante via regex `/@layer\s+reset\s*,\s*themes\s*,\s*components\s*,\s*utilities\s*;/`)
    - T3 @layer themes wrapper: source contiene `@layer themes {` y el bloque que sigue tiene los 7 chapter selectors dentro
    - T4 7 chapter blocks: regex matches `[data-chapter="0"]` ... `[data-chapter="6"]` — exactamente 7 selectors únicos. Usar `Array.from(source.matchAll(/\[data-chapter="(\d)"\]/g)).map(m => m[1])` y assert que el set es `['0','1','2','3','4','5','6']` (sin duplicates fuera de selectors compuestos).

    **theme-tokens.test.js (al menos 9 tests — THM-03):**
    - Por cada chapter (7 tests, T1-T7): el bloque del chapter contiene los 6 tokens (`--c-bg`, `--c-fg`, `--c-accent`, `--c-border`, `--c-focus`, `--font-body`). Extract el bloque con regex `/\[data-chapter="N"\]\s*\{([\s\S]*?)\}/` y dentro verificar substrings.
    - T8 ch0 verbatim: ch0 block contiene `--c-bg: #000000`, `--c-fg: #00ff41`, `--font-body: 'VT323', ui-monospace, monospace`
    - T9 ch1 verbatim: ch1 block contiene `--c-bg: #000080`, `--c-fg: #ff00ff`, `--font-body: 'Comic Neue', 'Comic Sans MS', cursive`

    **contrast-docs.test.js (al menos 3 tests — THM-05 docs):**
    - T1 ch1 tradeoff: source contiene LITERAL la frase `contrast(#ff00ff, #000080) = 3.2:1 — chapter 1 (HTML 90s crudo) accepts 3.2:1 here as era-authentic tradeoff per THM-05` (sub-string match suficiente; el comentario completo es UI-SPEC §4.2 ch1 verbatim)
    - T2 ch0 NO tradeoff required: ch0 block NO contiene la sub-string `as era-authentic tradeoff per THM-05` (porque 15.3:1 pasa AAA sin tradeoff)
    - T3 ch2-6 NO tradeoff: para cada chapter 2..6, el bloque NO contiene `as era-authentic tradeoff per THM-05` (todos pasan AAA según UI-SPEC §4.2 tablas)
  </behavior>
  <action>
    Crear `src/styles/chapter-themes.css` siguiendo VERBATIM la estructura locked en RESEARCH §Pattern 1 líneas 294-409 + UI-SPEC §4.2 (los 7 theme blocks completos con tokens, valores hex, comentarios contrast). Notas críticas:
    - **Header comment bloque** al inicio del archivo análogo a App.vue líneas 71-75: anchor del propósito (motor visual Phase 2, 7 themes era-auténticos, ch0/ch1 completos, ch2-6 stubs que Phase 3/4 finalizan, source of truth UI-SPEC §4.2 + D2-01..D2-03 + THM-01..05).
    - **`@layer reset, themes, components, utilities;`** como primera declaración no-comentario.
    - **`@layer themes { ... }`** con TODO el contenido (7 blocks + comment refs al `:root` neutral). Cada chapter block usa la sintaxis `[data-chapter="N"]` exacta (matchea el `:data-chapter="ch.id"` de ScrollShell.vue que renderea como `data-chapter="0"`, `data-chapter="1"`, etc.).
    - **Comentarios:** ch0 = comentario informativo "WCAG AAA passes naturally" (D2-03 dice no requiere, pero documentar la decisión positivamente). ch1 = comentario TRADEOFF VERBATIM (D2-03 mandatorio). ch2-6 = comentarios informativos breves "contrast X.X:1 — Phase X finalizará pixel art / contenido / scene". TODO el wording exacto de UI-SPEC §4.2 ch2-6 boxes.
    - **`@layer components { /* Phase 3/4 reservado... */ }`** y **`@layer utilities { /* Phase 3/4 reservado... */ }`** declarados vacíos con comments anchors — establece el namespace.
    - Indentación 2 espacios, naming convention `--c-bg` (mantiene paridad con paleta neutra de App.vue), property order semantic (bg → fg → accent → border → focus → font-body — coherente con la order del `:root` neutral líneas 87-98).
    - NO añadir `:root` block en este archivo (App.vue ya lo declara; duplicarlo aquí causaría confusion y dual source of truth).

    Modificar `src/main.js` añadiendo `import './styles/chapter-themes.css'` ENTRE `import { i18n } from './i18n'` y `createApp(App).use(i18n).mount('#app')`. Resultado verbatim:

    ```
    import { createApp } from 'vue'
    import App from './App.vue'
    import { i18n } from './i18n'
    import './styles/chapter-themes.css'

    createApp(App).use(i18n).mount('#app')
    ```

    (NO añadir `./styles/fonts.css` aún — W4 lo hace cuando lleguen las fuentes self-hosted.)

    Crear los 3 tests RED en `tests/styles/`:
    - `themes-file.test.js`: 4 tests (existence, @layer declaration regex, @layer themes wrapper, 7 chapter selectors). Usar `readFileSync(resolve(process.cwd(), 'src/styles/chapter-themes.css'), 'utf8')` cargado UNA VEZ al top del file scope.
    - `theme-tokens.test.js`: 9 tests (7 generic per-chapter + 2 verbatim ch0/ch1). Helper interno `extractBlock(source, chapter)` que retorna el contenido entre `[data-chapter="N"] {` y el `}` correspondiente. Asserts sobre sub-string presence.
    - `contrast-docs.test.js`: 3 tests (ch1 verbatim tradeoff presence, ch0 sin tradeoff phrase, ch2-6 sin tradeoff phrase). Mismo helper extractBlock.

    Tests RED commit (archivo no existe aún o tests fallan) → GREEN commit (archivo creado con contenido).
  </action>
  <verify>
    <automated>npm run test:run -- tests/styles/ &amp;&amp; npm run test:run &amp;&amp; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `src/styles/chapter-themes.css` existe con al menos 100 LOC (header comment + @layer declaration + 7 theme blocks + 2 empty layers)
    - Comando PowerShell `Select-String -Path src/styles/chapter-themes.css -Pattern '@layer reset, themes, components, utilities;' -SimpleMatch -Quiet` returns `True`
    - Comando `(Select-String -Path src/styles/chapter-themes.css -Pattern '\[data-chapter="\d"\]').Matches.Count` returns valor ≥ 7 (los 7 selectors presentes)
    - Comando `Select-String -Path src/styles/chapter-themes.css -Pattern 'contrast\(#ff00ff, #000080\) = 3.2:1' -SimpleMatch -Quiet` returns `True` (tradeoff ch1 presente)
    - `src/main.js` contiene literal `import './styles/chapter-themes.css'` antes del `createApp` call
    - `tests/styles/themes-file.test.js` corre 4 tests verdes
    - `tests/styles/theme-tokens.test.js` corre 9 tests verdes
    - `tests/styles/contrast-docs.test.js` corre 3 tests verdes
    - Total nuevos tests styles: ≥16 verdes
    - `npm run build` verde; bundle CSS crece a ~6-7KB total (chapter-themes.css es ~2-3KB extras sobre el 4.5KB Phase 1 baseline)
    - DevTools manual `npm run dev`: scrollear de ch0 a ch6 — cada chapter section muestra su `--c-bg`/`--c-fg` distintos. Ch0 negro fondo + verde texto; ch1 navy fondo + magenta texto; ch2-6 era-tinted distinguibles. El font-family se ve como fallback system-safe (cursive en ch1, serif en ch3, etc.) hasta W4
  </acceptance_criteria>
  <done>chapter-themes.css con motor de themes completo + ch0/ch1 + stubs ch2-6, importado en main.js, ≥16 tests styles verdes, build verde, scroll manual muestra variación visual entre chapters.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3.2: Tests architectural — focus ring universal preserved + ScrollShell theme isolation (no bleed)</name>
  <files>
    tests/styles/focus-ring.test.js,
    tests/components/ScrollShell.theme-isolation.test.js
  </files>
  <read_first>
    src/App.vue líneas 117-120 (regla `:focus-visible` universal — declaración intocable; Pitfall 7 demanda que Phase 2 NO toque grosor 3px ni offset 3px),
    src/styles/chapter-themes.css (recién creado en Task 3.1 — verificar que NO declara `outline:` propio),
    src/components/ScrollShell.vue líneas 74-85 (v-for con `:data-chapter="ch.id"` — patrón D2-06 ya en place desde Phase 1),
    src/components/LangToggle.vue (creado en W1 — verificar que NO declara `outline:` propio dentro de `.lang-toggle` CSS scoped — Pitfall 7 ya cubierto en W1 tests T8 pero re-verificar en cross-component test),
    .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §9 (focus ring policy per chapter; §9.2 muestra tabla per-chapter de --c-focus contrast vs --c-bg),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md Pitfall 7 líneas 1041-1045 ("NUNCA declarar outline: 1px ni 2px"),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md Theme Bleed Prevention Testing Strategy 1 líneas 1192-1220 (test architectural verbatim para each section has data-chapter + no ancestor has it),
    tests/components/StickyAvatar.test.js líneas 44-56 (mount helper con provides mutables — pattern para mount(ScrollShell) en theme-isolation test),
    tests/composables/useScrollState.test.js líneas 22-48 (wrapper template con 7 chapter stubs — patrón para test ScrollShell sin necesitar provides reales del activeChapter)
  </read_first>
  <behavior>
    **focus-ring.test.js (al menos 3 tests — A11Y-03 + Pitfall 7):**
    - T1 App.vue preserves universal: leer `src/App.vue` con readFileSync; assert regex `:focus-visible\s*\{[\s\S]*?outline:\s*3px\s*solid\s*var\(--c-focus\)[\s\S]*?outline-offset:\s*3px` matches (grosor 3px + offset 3px intactos)
    - T2 chapter-themes.css does NOT declare outline: leer `src/styles/chapter-themes.css`; assert que el source NO contiene `outline:` en ningún chapter block (Pitfall 7 — solo override `--c-focus`, jamás declarar outline override). Específicamente: `expect(source).not.toMatch(/\[data-chapter="\d"\][^}]*outline:/)` (negative lookahead — no `outline:` declaration dentro de chapter blocks)
    - T3 LangToggle does NOT declare outline propio: leer `src/components/LangToggle.vue`; assert que dentro del `<style scoped>` block, `.lang-toggle` rule NO declara `outline:` (Pitfall 7 — hereda universal de App.vue). Helper: extract `<style scoped>` content + assert NO `outline:` dentro del `.lang-toggle { ... }` block

    **ScrollShell.theme-isolation.test.js (al menos 3 tests — THM-04 architectural):**
    - T1 each section has data-chapter: mount(ScrollShell) con provides stub (scrollState + prm + i18n plugin) → `wrapper.findAll('section')` retorna 7 sections; iterar y assert que cada `section.attributes('data-chapter') === String(index)` (0..6 en orden)
    - T2 no ancestor has data-chapter (THM-04 architectural — copia exact pattern de RESEARCH líneas 1208-1219): para cada section, walk up `parentElement` chain y assert que ningún ancestor tiene `dataset.chapter` (sino el theme bleed sería arquitecturalmente posible)
    - T3 sections have correct id pattern: cada section tiene `id === 'chapter-' + N` (verifica que la v-for sigue intacta post-W1 i18nificación que solo tocó aria-label)
  </behavior>
  <action>
    Crear `tests/styles/focus-ring.test.js` con los 3 tests de raw-source assertions:
    - readFileSync de `src/App.vue` (uno-shot al top) y `src/styles/chapter-themes.css` y `src/components/LangToggle.vue`.
    - T1: regex `:focus-visible\s*\{` + el cuerpo entre `{` y `}` contiene `outline:\s*3px\s*solid\s*var\(--c-focus\)` Y `outline-offset:\s*3px`. Verificar ambas declarations.
    - T2: extract chapter blocks de chapter-themes.css con helper `getBlock(source, 'N')`; para cada N en 0..6 assert `!getBlock(source, N).includes('outline:')`.
    - T3: extract `<style scoped>` content de LangToggle.vue (regex `<style scoped[^>]*>([\s\S]*?)</style>`); dentro extraer `.lang-toggle {...}` block; assert NO `outline:` dentro de ese block (allow outside como en otros selectors si los hubiera).

    Crear `tests/components/ScrollShell.theme-isolation.test.js`:
    - Mount helper análogo a `tests/composables/useScrollState.test.js` líneas 22-48 — wrapper que mount `ScrollShell` con providers stubs (`scrollState: { activeChapter: ref(3), scrollToChapter: vi.fn() }`, `prm: { prefersReduced: ref(false) }`) + plugin i18n test instance.
    - T1: `const sections = wrapper.findAll('section')`; `expect(sections).toHaveLength(7)`; iterate `sections.forEach((s, i) => expect(s.attributes('data-chapter')).toBe(String(i)))`.
    - T2: walking ancestors loop verbatim de RESEARCH líneas 1208-1219:
      ```
      sections.forEach((s) => {
        let ancestor = s.element.parentElement
        while (ancestor) {
          expect(ancestor.dataset.chapter).toBeUndefined()
          ancestor = ancestor.parentElement
        }
      })
      ```
    - T3: `sections.forEach((s, i) => expect(s.attributes('id')).toBe('chapter-' + i))`.

    NOTA: el test architectural NO depende del CSS computed style (que jsdom no resuelve bien con @layer + custom props heredados — assumption A1 de RESEARCH). Solo verifica el DOM markup, que es 100% deterministico y captura el patrón D2-06 (per-section data-chapter, no global ancestor).

    Tests RED commit (si los archivos no existen aún) → GREEN commit (los tests pasan tan pronto como Task 3.1 esté en place — porque ScrollShell ya tiene data-chapter desde Phase 1 + el focus ring universal ya existe en App.vue).
  </action>
  <verify>
    <automated>npm run test:run -- tests/styles/focus-ring tests/components/ScrollShell.theme-isolation &amp;&amp; npm run test:run &amp;&amp; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `tests/styles/focus-ring.test.js` corre 3 tests verdes
    - `tests/components/ScrollShell.theme-isolation.test.js` corre 3 tests verdes
    - Comando PowerShell `Select-String -Path src/App.vue -Pattern 'outline:\s*3px\s*solid' -Quiet` returns `True` (regla universal intacta)
    - Comando PowerShell `Select-String -Path src/styles/chapter-themes.css -Pattern '^[^/*]*outline:' -Quiet` returns `False` (ninguna línea NO-comentario declara `outline:`)
    - Suite global ≥120 tests verdes (W0 + W1 ≥100 + W2 ≥16 styles + 6 architectural)
    - `npm run build` verde
    - DevTools manual: tab focus a través del SkipLink → ScrollShell → 7 ticks de Timeline → LangToggle muestra outline 3px solid en CADA chapter; el color del outline cambia per chapter (ch0 verde fosforescente, ch1 blanco, ch2 amber, ch3 azul Web 2.0, ch4 cyan, ch5 indigo, ch6 amber)
  </acceptance_criteria>
  <done>Focus ring universal preservado + arquitectura theme isolation verificada con 6 tests architectural verdes + cross-component verification que ningún componente declara outline propio.</done>
</task>

</tasks>

<verification>
- Comando: `npm run test:run && npm run build`
- Esperado: ≥120 tests verdes (Phase 1 67 + W0 18 + W1 LangToggle 9 + W1 components extends ≥6 + W2 themes 16 + W2 architectural 6 = ≥122)
- Bundle: CSS ~6-7KB total, JS ~76-78KB total (i18n + LangToggle contribuyen ~3-5KB, themes CSS añade ~2KB)
- DevTools manual: scrollear de ch0 a ch6 muestra cambio visual por chapter; inspeccionar `<section data-chapter="3">` en DevTools y ver que `--c-bg` resuelve a `#f0f4ff` (Lobster + pastel blue Web 2.0); en `<section data-chapter="0">` resuelve a `#000000` (terminal); etc.
- Visual diff manual: capturar GIF de scroll ch0→ch6 — cada chapter section tiene fondo + texto distintos; el inside-color cambia abruptamente al snap (no half-and-half), confirmando que theme isolation arquitectural funciona (THM-04 bleed prevention)
</verification>

<success_criteria>
- chapter-themes.css existe con @layer cascade (THM-02) + 7 chapter blocks (THM-01) + ch0/ch1 completos + ch2-6 stubs (THM-03)
- Contrast tradeoff ch1 documentado inline verbatim (D2-03 + THM-05)
- Focus ring universal preservado (A11Y-03 — `--c-focus` varía per chapter sin perder 3px/offset)
- Theme isolation architectural verificado (THM-04 — cada section data-chapter, no ancestor)
- Suite global ≥120 tests verdes, build verde
- DevTools manual muestra cambio visual real entre chapters
</success_criteria>

<output>
After completion, create `.planning/phases/02-theme-system-i18n/02-03-SUMMARY.md` con:
- chapter-themes.css creado (LOC, layer structure, 7 chapter blocks count)
- Tests styles añadidos (file count + test count, mapping a REQ-IDs)
- Bundle delta (CSS antes/después, JS antes/después)
- Decisiones tomadas (informative comments ch0/ch2-6 sí/no, helper extractBlock pattern)
- Pending para W3: BackgroundLayers + useBackgroundMorph + remover body bg de index.html
</output>
