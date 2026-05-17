# Session Handoff — Flash chapter full transformation + init-machine skill (2026-05-16)

> Snapshot del estado de la sesión para retomar trabajo en otra máquina sin perder contexto.
> Incluye: cambios de código en ch2 (Flash era), nueva skill init-machine, identidad git
> global, snapshot de memoria AI commiteado a `.claude/memory/`.

---

## TL;DR — Qué se hizo

1. **Skill `init-machine` + SessionStart hook auto-trigger** (commit `5b14f0a`)
   - `.claude/skills/init-machine.md` — procedimiento idempotente 10 pasos para máquina nueva.
   - `.claude/settings.json` — hook PowerShell que detecta `node_modules/.machine-initialized` ausente y dispara el procedimiento.
   - El marker `node_modules/.machine-initialized` está gitignored — clones frescos lo activan.

2. **Git identity global** seteada (commit `5b14f0a` ya con esto):
   - `user.name = Rafael Matovelle`
   - `user.email = srparca@gmail.com`
   - Persistida en memoria `feedback_git-identity.md`.

3. **Bug fix: ch2/ch5/ch6 backgrounds no se veían**:
   - **Root cause 1:** `BackgroundLayers.vue` pintaba solo `background-color: var(--c-bg)`, no consumía `var(--bg-image)` declarado en chapter-themes.css → assets `ch2-bg.jpg`, `ch5-hero.jpg`, `ch6-bg.png` nunca se renderizaban. Fix: agregada `background-image: var(--bg-image, none)` + `background-size: cover` + `image-rendering: pixelated` al `.bg-layer`.
   - **Root cause 2:** `ScrollShell.vue:142` `.chapter-section { background: var(--c-bg); }` tapaba el `BackgroundLayers` (z:-1). Fix: cambiado a `background: transparent` — D2-04 contract dice que BackgroundLayers es el único surface de fondo.

4. **Full Flash transformation ch2** (este commit):
   - **Asset regen**: `ch2-bg.jpg` iter1 → iter2 (819KB). iter1 era pixel art DE un sitio Flash (browser chrome + banner + popup DIBUJADOS), competía con la UI. iter2 es wallpaper abstracto: blobs orgánicos púrpura/naranja/lavanda con halftone dots, lava-lamp vibes, sin elementos de UI dibujados. iter1 preservada en `public/assets/old/ch2-bg-2026-05-16-iter1.jpg`.
   - **DOM template `Chapter2Content.vue`**: wrapping nuevo `<div class="flash-browser">` con `.flash-browser-chrome` (3 tabs falsos: "Portfolio 2009" activo / "about:blank" / "untitled" + plus button), `.flash-browser-toolbar` (back/fwd/reload + address bar `http://rafael.flash/portfolio/2009/index.swf` + GO button azul), y `.flash-browser-statusbar` ("Done · 47/47 items · Flash Player 9 detected · 🔒 Internet"). `.ch2-layout` interno preservado — tests siguen verdes.
   - **CSS chapter-themes.css `[data-chapter="2"]`**: ~250 líneas nuevas para `.flash-browser` + tabs + toolbar + statusbar + statusbar zone. Skeumorfismo Win XP / IE7 / Flash 2009 (gradientes gris claro, sombras 3D, esquinas redondeadas 4-6px).
   - **Banner enhancement**: `.flash-banner::before` (glossy highlight stripe top 50%) + `.flash-banner::after` ("▶ click to play" pulse animation con `@keyframes flash-banner-pulse` + PRM disable).
   - **ProjectCard popup window**: `.project-card` ahora es ventana XP (titlebar naranja gradiente + close-button X fake via `::after`, body gris XP, tech pills amarillas Win XP, link button azul gradient). Hover lift suave de 2px.

---

## Archivos modificados (este commit)

```
public/assets/ch2-bg.jpg                                   (iter2 — 819KB)
public/assets/old/ch2-bg-2026-05-16-iter1.jpg              (iter1 preservada — 627KB)
public/assets/old/CHANGELOG.md                             (entry iter1→iter2)
src/components/BackgroundLayers.vue                        (bg-image wiring)
src/components/ScrollShell.vue                             (.chapter-section transparente)
src/components/Chapter2Content.vue                         (wrapping .flash-browser)
src/styles/chapter-themes.css                              (~250 líneas Flash CSS)
.claude/skills/init-machine.md                             (commit 5b14f0a previo)
.claude/settings.json                                      (commit 5b14f0a previo)
.claude/memory/                                            (snapshot de memoria AI)
.planning/SESSION-HANDOFF-2026-05-16-flash-transformation.md (este doc)
```

---

## Estado de los chapters (background-image wiring)

| Chapter | --bg-image declarado | Asset | Status visual |
|---|---|---|---|
| ch0 Terminal | NO | (sólo --c-bg negro) | ✅ Plano negro, era-authentic |
| ch1 HTML 90s | NO | (sólo --c-bg navy) | ✅ Plano navy |
| ch2 Flash | ✅ `ch2-bg.jpg` (iter2 abstract) | OK | ✅ Wallpaper + UI Flash CSS encima |
| ch3 Web 2.0 | NO | (sólo --c-bg light blue) | ✅ Plano light blue (Phase 3 podría agregar) |
| ch4 AR/VR | NO (parallax self-contained) | (ParallaxLayers.vue independiente) | ⚠️ Phase 4 lo maneja aparte |
| ch5 Modern | ✅ `ch5-hero.jpg` | Cargado pero NO verificado visualmente esta sesión | ⏳ Validar |
| ch6 Phaser | ✅ `ch6-bg.png` | Cargado pero NO verificado visualmente esta sesión | ⏳ Validar |

**Próxima máquina/sesión:** verificar visualmente ch5 y ch6. El fix de BackgroundLayers + ScrollShell aplica a los tres por igual.

---

## Patterns importantes derivados esta sesión

### Pattern 1 — `--bg-image` consumption contract

El contrato D2-04 en CLAUDE.md dice que `BackgroundLayers` es el único surface de fondo (2-layer crossfade). Para que los chapters vean su `--bg-image`:

1. Declarar `--bg-image: url('/assets/chN-bg.{ext}')` en `[data-chapter="N"]` (chapter-themes.css)
2. `BackgroundLayers.vue` lo pinta automáticamente (post-fix esta sesión)
3. La `.chapter-section` correspondiente debe ser `background: transparent` (no `var(--c-bg)`)

Si ves un chapter con color sólido en vez del bg image, revisa esos 3 puntos.

### Pattern 2 — Diagnóstico visual con `console.log` en DevTools

Rafael's playbook validado esta sesión:

```js
var L = document.querySelectorAll('.bg-layer');
L.forEach(function(el){
  console.log(el.className, '| data-chapter:', el.dataset.chapter, '| opacity:', el.style.opacity, '| --bg-image:', getComputedStyle(el).getPropertyValue('--bg-image').trim(), '| resolved bg:', getComputedStyle(el).backgroundImage);
});
```

Permite distinguir: cache navegador / wiring DOM / cascade CSS / elemento tapando. Útil para cualquier debugging de bg-image en chapters futuros.

### Pattern 3 — Chrome skeumórfico vía pseudo-elements

Para fake UI elements (close button, glossy highlight, pulse text) sin tocar el DOM/contract: `::before` + `::after` con gradientes, sombras, `text-shadow`. Útil para preservar tests + componentes reusables (ProjectCard se ve distinto en ch2 vs ch3 sin tocar `ProjectCard.vue`).

---

## Próximos pasos sugeridos

### A. Verificar ch5 (Modern) + ch6 (Phaser) backgrounds
Mismo fix aplicó. Scrollear, verificar visualmente. Si necesitan iter2 igual que ch2 (assets que competan con UI), seguir CLAUDE.md §6.5.

### B. Replicar Flash transformation en otros chapters
Si Rafael quiere transformación similar en ch1 (GeoCities — marquees + Comic Sans + frames anidados) o ch3 (Web 2.0 — glassmorfismo + Lobster + redes sociales), el pattern es:
1. Wrapping element en `ChapterNContent.vue` (sin tocar `.chN-layout` interno por tests)
2. CSS scoped en `[data-chapter="N"]` en `chapter-themes.css`
3. Pseudo-elements para detalles era-auténticos
4. Regen asset abstracto si el actual compete

### C. Memoria AI en .claude/memory/
Snapshot tomado esta sesión. **Repo es público** (lordiwa/timeline-portfolio) — la memoria expone notas personales (año nacimiento, perfil dev, no tiene iOS, decisiones internas). Rafael aceptó el tradeoff 2026-05-16. Si en futuro se decide retirar: borrar `.claude/memory/`, commit, considerar usar `git filter-repo` para purgar el historial.

### D. En máquina nueva: clone + init
Clonar el repo + correr en Claude Code. El SessionStart hook detecta `node_modules/.machine-initialized` ausente y dispara `.claude/skills/init-machine.md` automáticamente. El procedimiento:
1. Verifica node/npm/git
2. Setea git identity (memoria `feedback_git-identity.md` la conoce)
3. `npm install`
4. Pide `GEMINI_API_KEY` via `setx` (CLAUDE.md §4.2)
5. Registra `pixelforge` MCP si falta
6. Verifica MCPs con `/project:verificar-mcps`
7. `npm run build` smoke test
8. Crea marker — no vuelve a disparar

---

## Memoria AI relevante (commit incluido en `.claude/memory/`)

Las memorias críticas para continuidad:

- `feedback_git-identity.md` — siempre srparca@gmail.com
- `feedback_asset-iteration-process.md` — iter+CHANGELOG antes de regen
- `feedback_verify-before-suggest.md` — pedí DevTools data antes de hard reload
- `portfolio-design-decisions.md` — bilingüe ES/EN, retro 16-bit, flex mode
- `mcp-stack.md` — Adobe + Google + gsd + pixelforge (hereda env)

Si Claude Code en la otra máquina no carga estas memorias automáticamente (porque viven en `~/.claude/projects/`, no en repo), copiarlas manualmente:

```powershell
$src = "$PWD\.claude\memory\*"
$dst = "$HOME\.claude\projects\C--Users-{TU-USER}-Documents-mato-new-portfolio\memory\"
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item -Path $src -Destination $dst -Force
```

---

## Commits relacionados

| Hash | Subject |
|---|---|
| `5b14f0a` | feat(init): skill init-machine + SessionStart hook auto-trigger |
| (este) | art(ch2): full Flash transformation iter2 + browser chrome + popup cards |
