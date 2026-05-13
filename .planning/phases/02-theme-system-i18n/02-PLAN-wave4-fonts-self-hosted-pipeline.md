---
phase: 02-theme-system-i18n
plan: 05
slug: wave4-fonts-self-hosted-pipeline
wave: 4
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements: [THM-03]
depends_on: [3]
files_modified:
  - package.json
  - src/main.js
  - index.html
  - tests/styles/fonts-loaded.test.js
must_haves:
  truths:
    - "Las 6 fuentes self-hosted (VT323, Comic Neue, Lobster, Audiowide, Inter Variable, Press Start 2P) están instaladas como npm packages `@fontsource*` (D2-07 + RESEARCH §Q3 Windows-friendly path)"
    - "`src/main.js` importa cada paquete `@fontsource/*` o `@fontsource-variable/*` ANTES del mount; Vite incluye los `@font-face` rules + woff2 assets en el bundle final automáticamente"
    - "ch2 (Verdana / Trebuchet MS) NO se self-hosta — usa system-safe stack como decisión locked (RESEARCH §R4 tradeoff explícito: ~30-50KB savings; Android sin Verdana cae a Trebuchet/sans-serif graceful)"
    - "Cada `@font-face` resultante tiene `font-display: swap` por default (los paquetes @fontsource lo declaran — verificable inspeccionando el bundle CSS final)"
    - "`@fontsource-variable/inter` cubre weights 100-900 con `font-weight: 100 900` declaration (variable axis activo — R5 fix)"
    - "Preload del font del default landing chapter (Lobster ch3) en `<link rel=\"preload\">` del `<head>` de index.html para evitar FOUT inicial perceptible"
    - "Bundle total de fonts (woff2 sumados): 150-300KB targeted (RESEARCH §D2-08 target). Verificable post-build con `Get-ChildItem dist/assets -Filter '*.woff2' | Measure-Object Length -Sum`"
    - "Test programático verifica que el bundle final post-build contiene exactamente 6 paquetes de fonts importados (no más, no menos) y que cada chapter-themes.css block referencia un `font-family` que tiene un `@font-face` correspondiente cargado (o un system-safe fallback documentado en ch2)"
  artifacts:
    - path: package.json
      provides: "Dependencies añadidas: @fontsource/vt323, @fontsource/comic-neue, @fontsource/lobster, @fontsource/audiowide, @fontsource/press-start-2p, @fontsource-variable/inter"
      contains: "@fontsource"
    - path: src/main.js
      provides: "6 imports de @fontsource* packages ANTES del createApp + use(i18n) + mount"
      contains: "@fontsource"
    - path: index.html
      provides: "`<link rel=\"preload\">` para Lobster (ch3 landing) — evita FOUT inicial perceptible"
      contains: "rel=\"preload\""
    - path: tests/styles/fonts-loaded.test.js
      provides: "Tests: package.json contiene 6 paquetes; main.js importa 6 paquetes; chapter-themes.css declara font-family matchings; ch2 sin self-host explícito"
      contains: "@fontsource"
  key_links:
    - from: src/main.js
      to: "@fontsource/* + @fontsource-variable/inter packages"
      via: "import '@fontsource/{slug}' lines (auto-wires @font-face via package)"
      pattern: "@fontsource"
    - from: src/styles/chapter-themes.css
      to: "@fontsource packages (indirect via Vite bundling)"
      via: "--font-body declarations matchean los font-family names registrados por @fontsource (VT323, 'Comic Neue', etc.)"
      pattern: "--font-body"
---

## Phase Goal (MVP Vertical Slice)

**As a** visitante haciendo scroll entre chapters, **I want to** que cada era se sienta distinta tipográficamente además de colorimétricamente, **so that** la identidad visual de cada chapter sea inequívoca incluso si tengo daltonismo o el contraste bajo no me deja distinguir colores fácilmente.

> **Nota MVP:** este Wave 4 entrega la tipografía era-auténtica end-to-end vía self-hosted fonts con pipeline `@fontsource` packages (decisión D2-07 + RESEARCH §R4 Windows-friendly). Tras este plan, scrollear muestra:
> - ch0 con VT323 (terminal CRT phosphor monospace) sobre fondo negro verde — efecto "video raid" auténtico
> - ch1 con Comic Neue (sans Comic Sans equivalent libre) sobre navy magenta — efecto GeoCities crudo
> - ch3 con Lobster (cursive Web 2.0 emblematic) sobre pastel — efecto Twitter logo 2009-era
> - ch4 con Audiowide (geometric futuristic) sobre deep space — efecto AR/VR holographic
> - ch5 con Inter Variable (modern weights 100-900) — efecto Tailwind 2022+ minimal
> - ch6 con Press Start 2P (pixel UI font) — efecto retro game UI labels
> - ch2 con Verdana/Trebuchet MS system-safe (NO self-host — decisión tradeoff locked)

<objective>
Instalar las 6 fuentes self-hosted vía `@fontsource` npm packages (Windows-friendly, RESEARCH §Q3 + Example 7 Option A). Wire en `main.js` con imports automáticos (cada paquete trae `@font-face` declarations + `.woff2` assets bundled por Vite). Añadir un `<link rel="preload">` en `index.html` para el font del default landing (Lobster ch3). Crear test programático que valida (1) los 6 paquetes en `package.json`, (2) los 6 imports en `main.js`, (3) que cada `font-family` declarada en `chapter-themes.css` tiene un `@fontsource` paquete correspondiente (o es system-safe como ch2 Verdana).

**Purpose:** Completa THM-03 (los 7 themes era-auténticos visualmente completos — color + tipografía). Cierra el motor visual de Phase 2 antes del checklist visual final en W5.

**Lo que ESTE plan NO hace:**
- NO sub-setea las fuentes manualmente con glyphhanger/pyftsubset (RESEARCH §Q3 + Example 7 Option A: los `@fontsource` packages ya vienen subsetted por charset — `@fontsource/{font}` carga el subset Latin por default que cubre ES/EN; el bundle resulta optimizado sin pipeline manual extra).
- NO instala fuente custom para ch2 (Verdana / Trebuchet MS son system-safe stacks — RESEARCH §R4 tradeoff locked).
- NO genera nuevo CSS — los `@font-face` vienen incluidos por los paquetes; `chapter-themes.css` ya declaró las `font-family` per chapter en W2.
- NO toca el motor i18n (W0+W1), themes CSS (W2), ni bg morph (W3).
- NO modifica `src/styles/fonts.css` (NO se crea — los `@fontsource` imports en main.js cubren todo; PATTERNS.md líneas 461-465 + RESEARCH §Q3 nota: "Si planner elige Option A, este archivo NO existe").
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
@.planning/phases/02-theme-system-i18n/02-03-SUMMARY.md
@.planning/phases/02-theme-system-i18n/02-04-SUMMARY.md
@package.json
@src/main.js
@src/styles/chapter-themes.css
@index.html

<interfaces>
<!-- package.json diff: añadir 6 paquetes @fontsource* a dependencies -->

Añadir a `dependencies` (mantener orden alfabético tras `@vueuse/core`, antes de `phaser`):
- `@fontsource-variable/inter: ^5.x` (ch5 — Variable font weights 100-900)
- `@fontsource/audiowide: ^5.x` (ch4)
- `@fontsource/comic-neue: ^5.x` (ch1)
- `@fontsource/lobster: ^5.x` (ch3 default landing)
- `@fontsource/press-start-2p: ^5.x` (ch6)
- `@fontsource/vt323: ^5.x` (ch0)

NO instalar `@fontsource/verdana` ni similar para ch2 — system-safe stack (RESEARCH §R4 decision).

NO instalar `glyphhanger` ni `fonttools` (Option B/C de RESEARCH Example 7 — NO se usan; Option A `@fontsource` es la locked decision para Windows).

<!-- src/main.js diff: añadir 6 imports de @fontsource* antes del mount -->

Orden de imports verbatim:

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

// Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
// + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe stack
// — NO requiere import. D2-07 + D2-08 + RESEARCH §R4 + Example 7 Option A.
import '@fontsource/vt323'                      // ch0 — CRT terminal
import '@fontsource/comic-neue'                 // ch1 — Comic Sans equivalent
import '@fontsource/lobster'                    // ch3 — Web 2.0 cursive (default landing)
import '@fontsource/audiowide'                  // ch4 — AR/VR futuristic geometric
import '@fontsource-variable/inter'             // ch5 — Modern Variable weights 100-900
import '@fontsource/press-start-2p'             // ch6 — Phaser pixel UI

import './styles/chapter-themes.css'   // @layer cascade + 7 themes (W2)

createApp(App).use(i18n).mount('#app')
```

Razón del orden:
- `@fontsource/*` ANTES de `chapter-themes.css` para que los `@font-face` se declaren antes que las reglas CSS que los consumen (orden visual; en práctica Vite los combina en el mismo bundle CSS pero el orden source es legible).
- Imports `@fontsource*` agrupados en bloque con comentario anchor.
- Mantener el comentario inline `// ch0`, `// ch1`, etc. para que cualquier lector futuro sepa qué chapter consume cada font sin re-derivar.

<!-- index.html diff: añadir preload de Lobster (default landing) en <head> -->

Localizar el `<head>` del index.html actual (post-W3 que removió el body bg). Tras el meta viewport y antes del `<style>` block, añadir:

```html
<link rel="preload" href="/node_modules/@fontsource/lobster/files/lobster-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
```

PERO — atención al path real. Los paquetes @fontsource ponen los .woff2 en `node_modules/@fontsource/{slug}/files/{slug}-{subset}-{weight}-{style}.woff2`. En dev (Vite serve) Vite rewritea los paths via su middleware, pero en prod (build) el path final puede ser `/assets/lobster-latin-400-normal-{hash}.woff2`. Estrategia robusta:

**Decisión locked Task 5.2:** NO hardcodear el path en `index.html` con literal node_modules — eso solo funciona en dev y rompe en prod. En su lugar:
- Estrategia A (preferida — más simple): añadir el preload via Vite plugin `vite-plugin-html` o configuración custom; pero eso añade dependencia nueva. Si Phase 2 quiere zero new deps, descartar.
- Estrategia B: añadir un `<link rel="preload">` con un path placeholder DEV-only mediante un comentario condicional, y dejar que el `font-display: swap` cubra prod (los fonts aparecen en swap-mode sin block). Path placeholder: omitir el preload en W4 si el path no es estable post-build, y documentar el tradeoff: "FOUT controlado por `font-display: swap` (R1 mitigation); preload optimizable en future si surge FOUT perceptible en Lighthouse audit".
- Estrategia C: usar `<link rel="preload">` con el path POST-BUILD que conoces tras `npm run build` una vez, capturando el filename con hash; pero ese path cambia con cada build → no robusto.

**Decisión final (locked):** Estrategia B — NO añadir `<link rel="preload">` en W4. El `font-display: swap` que cada `@fontsource` paquete provee (verificable en el bundle final) cumple el R1 FOIT mitigation. El preload es optimización marginal (`font-display: swap` ya muestra fallback system-safe inmediato; el upgrade al custom font es asíncrono y de bajo riesgo perceptual). Si W5 manual checklist o Lighthouse detect FOUT mid-scroll en ch3, añadir preload como mitigation en Phase 3 (que polishe ch3 completamente).

> Resultado: el cambio a `index.html` en W4 es NULO. Solo W3 modificó index.html (remove body bg). W4 NO toca este archivo.

<!-- src/styles/fonts.css — NO se crea -->

PATTERNS.md líneas 461-465 + RESEARCH §Q3: si se usa Option A `@fontsource`, no se crea `src/styles/fonts.css`. Las @font-face declarations vienen embebidas en cada paquete y Vite las bundlea automáticamente.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 5.1: Instalar 6 paquetes @fontsource + wire imports en main.js + test programático</name>
  <files>
    package.json,
    src/main.js,
    tests/styles/fonts-loaded.test.js
  </files>
  <read_first>
    package.json (current dependencies post-W0 — verificar que `vue-i18n` ya está; el resultado tras W4 añade 6 paquetes `@fontsource*`),
    src/main.js (current post-W3 con `import { i18n }` + `import './styles/chapter-themes.css'` + `createApp(App).use(i18n).mount('#app')`),
    src/styles/chapter-themes.css (creado en W2 — verificar las 7 declaraciones `--font-body` per chapter; el test cross-checks que cada font-family declarado tiene un paquete @fontsource correspondiente),
    .planning/phases/02-theme-system-i18n/02-UI-SPEC.md §5 (tabla de fuentes locked líneas 380-390 con license OFL-1.1 verificada),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §Example 7 líneas 1149-1180 (Option A `@fontsource` PowerShell install commands),
    .planning/phases/02-theme-system-i18n/02-RESEARCH.md §R4 + §R5 (tradeoff ch2 sin self-host + Inter Variable font-weight range fix),
    .planning/phases/02-theme-system-i18n/02-PATTERNS.md §package.json líneas 715-731 (diff esperado en dependencies; nota Option A `@fontsource` packages)
  </read_first>
  <behavior>
    **fonts-loaded.test.js (al menos 6 tests):**
    - T1 package.json contains 6 fontsource packages: leer `package.json` con readFileSync + JSON.parse; assert `dependencies` contiene literal keys: `@fontsource/vt323`, `@fontsource/comic-neue`, `@fontsource/lobster`, `@fontsource/audiowide`, `@fontsource/press-start-2p`, `@fontsource-variable/inter` (6 total)
    - T2 versions are ^5.x: cada uno de los 6 paquetes tiene version range que matchea regex `^\^5\.` (Major version 5)
    - T3 main.js imports 6 packages: leer `src/main.js` con readFileSync; assert el source contiene literal `import '@fontsource/vt323'`, `import '@fontsource/comic-neue'`, `import '@fontsource/lobster'`, `import '@fontsource/audiowide'`, `import '@fontsource-variable/inter'`, `import '@fontsource/press-start-2p'`
    - T4 imports ANTES de chapter-themes.css: assert el regex `/import '@fontsource[\s\S]*import.*chapter-themes\.css/` matches (orden source declarativo)
    - T5 chapter-themes.css declares matching font-family: leer `src/styles/chapter-themes.css`; assert que cada chapter block (ch0..ch6) declara `--font-body` que cita el font name correspondiente:
      - ch0 → `'VT323'`
      - ch1 → `'Comic Neue'`
      - ch2 → `'Verdana'` (system-safe — sin @fontsource paquete; verifica que NO existe `@fontsource/verdana` en package.json)
      - ch3 → `'Lobster'`
      - ch4 → `'Audiowide'`
      - ch5 → `'Inter Variable'`
      - ch6 → `'Press Start 2P'`
    - T6 ch2 NO self-host explicit: leer `src/main.js`; assert el source NO contiene `@fontsource/verdana` ni `@fontsource/trebuchet` (decisión RESEARCH §R4 — system-safe stack para ch2)
  </behavior>
  <action>
    **Sub-step 5.1.a — Install packages:**
    Ejecutar en PowerShell desde el project root:
    ```
    npm install @fontsource/vt323 @fontsource/comic-neue @fontsource/lobster @fontsource/audiowide @fontsource/press-start-2p @fontsource-variable/inter
    ```
    npm añade automáticamente a `package.json` dependencies en orden alfabético. Verificar que tras el install:
    - `package.json` dependencies contiene los 6 paquetes con version range `^5.x` (la versión 5 es current major en 2026 según RESEARCH §Standard Stack Supporting).
    - `node_modules/@fontsource/vt323/` existe (verificación rápida del install correcto).

    **Sub-step 5.1.b — Wire imports en main.js:**
    Modificar `src/main.js` para añadir los 6 imports ENTRE `import { i18n } from './i18n'` y `import './styles/chapter-themes.css'`. Resultado verbatim (RESEARCH §Example 7 Option A):

    ```javascript
    import { createApp } from 'vue'
    import App from './App.vue'
    import { i18n } from './i18n'

    // Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
    // + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe
    // stack — NO requiere import. D2-07 + D2-08 + RESEARCH §R4.
    import '@fontsource/vt323'                  // ch0 — CRT terminal
    import '@fontsource/comic-neue'             // ch1 — Comic Sans equivalent
    import '@fontsource/lobster'                // ch3 — Web 2.0 cursive (default landing)
    import '@fontsource/audiowide'              // ch4 — AR/VR futuristic geometric
    import '@fontsource-variable/inter'         // ch5 — Modern Variable weights 100-900
    import '@fontsource/press-start-2p'         // ch6 — Phaser pixel UI

    import './styles/chapter-themes.css'

    createApp(App).use(i18n).mount('#app')
    ```

    Notas:
    - Comentario header bloque antes de los imports anchor el propósito + las decisiones (D2-07, D2-08, R4).
    - Comentario inline por cada import indica qué chapter lo consume — facilita debugging futuro (Phase 3/4 si cambia un font, sabe qué chapter afecta).
    - El orden de los imports de fonts: ch0 → ch1 → ch3 → ch4 → ch5 → ch6 (saltando ch2 que es system-safe). Coherente con el orden visual del viaje temporal.

    **Sub-step 5.1.c — Create test:**
    Crear `tests/styles/fonts-loaded.test.js` con los 6 tests del `<behavior>` block:
    - Helper top-level: `const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))`, `const mainSource = readFileSync(resolve(process.cwd(), 'src/main.js'), 'utf8')`, `const themesSource = readFileSync(resolve(process.cwd(), 'src/styles/chapter-themes.css'), 'utf8')`.
    - T1: `const requiredPackages = ['@fontsource/vt323', '@fontsource/comic-neue', '@fontsource/lobster', '@fontsource/audiowide', '@fontsource/press-start-2p', '@fontsource-variable/inter']`; `requiredPackages.forEach(pkg => expect(packageJson.dependencies).toHaveProperty(pkg))`.
    - T2: `requiredPackages.forEach(pkg => expect(packageJson.dependencies[pkg]).toMatch(/^\^5\./))`.
    - T3: `requiredPackages.forEach(pkg => expect(mainSource).toContain(\`import '\${pkg}'\`))` — verifica los 6 imports literales.
    - T4: regex `/import '@fontsource[\s\S]*?import\s+['"]\.\/styles\/chapter-themes\.css/` matches el mainSource.
    - T5: helper `extractChapterBlock(themesSource, N)` (reusable de W2 — el patrón ya existe en tests/styles/theme-tokens.test.js); para cada chapter assert que el block contiene la sub-string del font-name esperado (ej. `expect(extractChapterBlock(themesSource, 0)).toContain("'VT323'")`).
    - T6: assert `mainSource.toLowerCase()` NO contiene `@fontsource/verdana` ni `@fontsource/trebuchet`; assert `packageJson.dependencies` NO tiene keys con `verdana` o `trebuchet`.

    Tests RED commit (imports + paquetes no presentes aún) → GREEN commit (npm install + main.js edit en place).
  </action>
  <verify>
    <automated>npm install &amp;&amp; npm run test:run -- tests/styles/fonts-loaded &amp;&amp; npm run test:run &amp;&amp; npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `package.json` dependencies contiene los 6 paquetes literal: `@fontsource/vt323`, `@fontsource/comic-neue`, `@fontsource/lobster`, `@fontsource/audiowide`, `@fontsource/press-start-2p`, `@fontsource-variable/inter`
    - Cada uno con version range `^5.x`
    - `node_modules/@fontsource/vt323/files/` existe y contiene archivos `.woff2` (verificable con `Test-Path 'node_modules/@fontsource/vt323/files'` returns `True`)
    - `src/main.js` contiene los 6 imports literales en el orden documentado
    - `tests/styles/fonts-loaded.test.js` corre ≥6 tests verdes
    - Suite global `npm run test:run` ≥143 tests verdes (Phase 1 67 + W0 18 + W1 ≥15 + W2 ≥22 + W3 ≥15 + W4 ≥6)
    - `npm run build` verde; bundle CSS crece a ~12-20KB (los @font-face de 6 fonts añaden ~5-12KB), JS sin cambios (los `@fontsource` imports son CSS-only side effect — verificar con `Get-ChildItem dist/assets/*.css | Measure-Object Length -Sum`)
    - Bundle final tras build contiene ≥6 archivos `.woff2` (uno o más por font): comando `(Get-ChildItem dist/assets -Filter '*.woff2').Count` ≥ 6
    - Suma total de `.woff2` en `dist/assets/` está entre 100KB y 350KB (D2-08 target 150-300KB; ligera tolerancia arriba/abajo aceptable — el target es por Latin Extended subset que @fontsource usa por default)
    - DevTools manual `npm run dev`: scrollear ch0→ch6 → cada chapter muestra su font era-auténtica (NO el fallback system-safe). Verificar en cada chapter via DevTools Computed panel que `font-family` del `.era-title` resuelve al font custom no al fallback. El swap inicial puede mostrar FOUT brief (system-safe → custom) gracias a `font-display: swap` — esto es esperado y mejor que FOIT.
  </acceptance_criteria>
  <done>6 paquetes @fontsource instalados, main.js wired con imports en orden documentado, ≥6 tests fonts-loaded verdes, build verde, bundle contiene .woff2 dentro del target, DevTools manual confirma cada chapter renderea su font era-auténtica.</done>
</task>

</tasks>

<verification>
- Comando: `npm run test:run && npm run build`
- Esperado: ≥143 tests verdes, build verde sin warnings de fonts/CSS
- Bundle: CSS ~12-20KB (@font-face declarations), JS sin cambios (~78-80KB), .woff2 totalizando 100-350KB
- DevTools manual: scrollear ch0→ch6 muestra cada chapter con su font era-auténtica + bg morph + theme tokens consistentes. ch2 muestra Verdana (Windows/macOS) o Trebuchet MS (Android) — system-safe fallback graceful.
- Lighthouse Performance run: no warning "Avoid invisible text during webfont load" (gracias a `font-display: swap` que viene con @fontsource).
- Network panel (Chrome DevTools): tras el primer render del default landing (ch3), el `.woff2` de Lobster se descarga; los otros 5 fonts se descargan al scrollear (lazy via Vite chunking) o todos juntos según Vite bundling strategy. Verificar bundle size total ≤350KB.
</verification>

<success_criteria>
- 6 paquetes @fontsource instalados como dependencies (D2-07 self-hosted + D2-08 7 fonts una por chapter — ch2 system-safe es la excepción documentada)
- main.js wired con imports ordenados + comentado por chapter
- Test programático cross-references package.json ↔ main.js ↔ chapter-themes.css (zero drift)
- Bundle .woff2 total dentro de target 150-300KB ±tolerance
- Build verde, suite global ≥143 verdes
- DevTools manual confirma identidad tipográfica era-auténtica en los 7 chapters
- THM-03 completamente cubierto (color + tipografía per chapter)
</success_criteria>

<output>
After completion, create `.planning/phases/02-theme-system-i18n/02-05-SUMMARY.md` con:
- Paquetes instalados (6 nombres + versions resueltas tras npm install)
- main.js diff (orden imports, comentarios anchor)
- Bundle delta (CSS antes/después, .woff2 size sum)
- Decisiones tomadas (Strategy B sin preload — `font-display: swap` cubre; ch2 system-safe locked sin @fontsource; @fontsource Option A vs subsetting manual)
- DevTools manual screenshots o notes — qué se ve en cada chapter con la font correcta
- Pending para W5: manual checklist final + visual verification end-to-end Phase 2
</output>
