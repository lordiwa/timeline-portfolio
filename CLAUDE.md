# CLAUDE.md — mato-new-portfolio · Vue 3 + Vite + Phaser.js · Pixel Art via MCP

> **LEE ESTO COMPLETO antes de ejecutar cualquier tool o comando.**
> Escrito para que una IA lo lea en frío y pueda continuar el proyecto sin repetir
> errores ya documentados. Comunícate con el usuario **en español** siempre.

---

## 1. Stack del proyecto

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend framework | **Vue 3** (Composition API) | Vite 5 como build tool |
| Motor de juego | **Phaser 3.86** | ESM, sin TypeScript |
| Generación de pixel art | **pixelforge-mcp** (`nano-banana-2`) | Gemini flash-image |
| Post-proceso de assets | **Adobe MCP** | Solo edición — NO genera arte |
| OS del usuario | Windows 11, PowerShell 5.1 | Paths con `\`, comandos PS |
| Resolución virtual | **480×270** (16:9), zoom ×3 | `pixelArt: true` en Phaser |

---

## 2. Sistema multi-agente — cómo funciona este proyecto

> Este proyecto usa el sistema de sub-agentes de Claude Code. Esta sección
> explica los patrones que se usan para que cualquier IA entienda la arquitectura
> al leer este archivo en frío.

### 2.1 ¿Qué son los agentes en Claude Code?

Claude Code soporta **agentes especializados** definidos como archivos Markdown en
`.claude/agents/`. Cada agente tiene:

- Un `name` (identidad usada por el orquestador para invocarlo)
- Un `model` (puede ser distinto al agente principal para optimizar costo)
- `allowedTools` (restricción de qué herramientas puede usar — principio de menor privilegio)
- Instrucciones en el cuerpo del archivo (su system prompt efectivo)

Los agentes **heredan el contexto del CLAUDE.md del proyecto automáticamente**.
Los agentes de proyecto (`.claude/agents/`) se comparten por git con el equipo.

### 2.2 Patrones de orquestación usados aquí

Claude Code soporta tres modos de ejecución para sub-agentes:

| Patrón | Cuándo usarlo | Riesgo si se elige mal |
|---|---|---|
| **Paralelo** | Tareas independientes, dominios distintos, sin archivos compartidos | Conflictos de merge, estado inconsistente |
| **Secuencial** | Una tarea necesita el output de la anterior | Perder tiempo serializando trabajo independiente |
| **Background** | Research / análisis que no bloquea el trabajo actual | Resultados perdidos si no se revisan |

**Reglas de routing configuradas en este proyecto** (el planner las aplica):

```
Paralelo si (TODAS las condiciones):
  - 3+ tareas sin dependencias
  - Sin estado compartido
  - Archivos distintos

Secuencial si (CUALQUIER condición):
  - B necesita el output de A
  - Mismo archivo afectado
  - Alcance incierto
```

### 2.3 El equipo de agentes de este proyecto

```
planner (orquestador)
├── artist-creator    → genera arte con pixelforge-mcp
├── artist-editor     → post-procesa arte con Adobe MCP
├── frontend-dev      → código Vue/Phaser/Vite, deploys
└── qa                → verifica calidad y reporta bugs
```

**El planner** usa `claude-opus-4-6` para razonamiento complejo.
**Los especialistas** usan `claude-sonnet-4-6` para trabajo enfocado — reduce costos sin perder calidad.

### 2.4 Skills vs Agentes

| Concepto | Ubicación | Qué es |
|---|---|---|
| **Skill** | `.claude/skills/*.md` | Instrucciones técnicas detalladas (cómo usar una tool específica) |
| **Agente** | `.claude/agents/*.md` | Identidad persistente con tools restringidas y rol claro |
| **Comando** | `.claude/commands/*.md` | Slash command invocable manualmente (`/project:nombre`) |

Los agentes leen sus skills relevantes al iniciar. Los skills son la "memoria técnica"
del proyecto — contienen los errores ya cometidos y las reglas derivadas de ellos.

### 2.5 Comandos disponibles

| Comando | Qué hace |
|---|---|
| `/project:verificar-mcps` | Smoke test de pixelforge y Adobe MCP |
| `/project:nueva-capa [nombre] [descripción]` | Pipeline completo para generar una capa parallax |

---

## 3. Arranque rápido — checklist al iniciar sesión

```
[ ] 1. Leer este archivo completo
[ ] 2. /project:verificar-mcps  — verificar estado de los MCPs
[ ] 3. Si pixelforge falla → seguir sección 4.2
[ ] 4. Preguntar al usuario qué quiere hacer → el planner toma desde ahí
```

---

## 4. pixelforge-mcp — referencia técnica

> Skill completo en: `.claude/skills/crear-arte-pixelforge.md`

### 4.1 Herramientas (son deferred — cargar schema primero)

```
ToolSearch(query="select:mcp__pixelforge__forge_background,mcp__pixelforge__forge_sprite,
mcp__pixelforge__forge_animation,mcp__pixelforge__process_sprite,
mcp__pixelforge__optimize_sprite", max_results=10)
```

| Tool | Uso |
|---|---|
| `forge_background` | Capas opacas full-frame. Sin bg removal. |
| `forge_sprite` | Sprites con bg transparente. Con bg removal. |
| `forge_animation` | Frames de animación. ⚠️ Incoherente entre frames. |
| `process_sprite` | Bg removal, crop, split de sheets. |
| `optimize_sprite` | Downscale nearest-neighbor. |

### 4.2 Instalación limpia

```powershell
# 1) Cerrar Claude Code (/exit)
# 2) PowerShell NUEVA:
setx GEMINI_API_KEY "tu-key-aqui"
# 3) Cerrar esa PS. Abrir PS nueva.
echo $env:GEMINI_API_KEY   # verificar
# 4) Registrar sin --env:
cd C:\Users\RafaelMatovelle\Documents\mato-new-portfolio
claude mcp add pixelforge npx pixelforge-mcp@latest
# 5) Arrancar:
claude
```

### 4.3 ⚠️ NUNCA usar `--env GEMINI_API_KEY=...`

Guarda la key en texto plano en `.claude.json`. Ya hubo dos fugas el 2026-05-10.
Usar siempre `setx` y dejar que el proceso herede la env var.

---

## 5. Adobe MCP — solo post-proceso

> Skill completo en: `.claude/skills/editar-arte-adobe.md`

Adobe MCP **no genera pixel art** en este entorno. Úsalo exclusivamente para:
- `image_remove_background` — limpiar sprites
- `image_crop_and_resize` — dimensiones exactas
- `image_generative_expand` — seamless para tileSprite
- `image_adjust_hsl` / `image_adjust_color_temperature` — armonizar paleta

Siempre llamar `adobe_mandatory_init()` primero.

---

## 6. Errores críticos — no repetir

### 6.1 ⚠️ Capas intermedias: siluetas planas sin outlines

Siluetas con outlines crean transparencias internas → las capas de detrás se ven a través.

```
✅ PEDIR: "solid filled shape, no internal lineart, no outlines,
           no negative space, single flat color"
❌ EVITAR: "detailed", "with visible foliage", "with branches"
```

### 6.2 ⚠️ forge_sprite — presets nombrados para background

```
❌ NO: "black", "white"     → bg removal falla (Gemini ignora el color)
✅ SÍ: "night", "forest", "sky", "dungeon", "ocean", "sand", "snow", "lava"
```

### 6.3 ⚠️ Capas opacas → forge_background, no forge_sprite

`forge_sprite` aplica bg removal. Para fondos full-frame: siempre `forge_background`.

### 6.4 ⚠️ Spritesheets animados — pixelforge no es confiable

Cada frame es una generación nueva. Los frames derivan entre sí.
Generar solo el **frame idle** con pixelforge y animar con otra herramienta.

---

## 6.5 Iteración de assets — proceso `old/` + CHANGELOG.md

> **Rule establecida 2026-05-14 por Rafael:** cada vez que se regenera un asset existente
> (no nuevo), debe preservarse el historial visual con contexto.

**Antes de sobrescribir** `public/assets/{filename}.{ext}`:

1. **Asegurar que existe** `public/assets/old/` (crear si no existe).
2. **Mover** (no copiar) el archivo actual a `public/assets/old/{stem}-{ISO-date}-iter{N}.{ext}` —
   donde `iter{N}` es el contador secuencial de iteraciones de ese asset (iter1 = original
   generación, iter2 = primera regeneración, etc.).
3. **Append** una entry a `public/assets/old/CHANGELOG.md` con shape:
   ```markdown
   ## {asset-filename} — iter{N} → iter{N+1} ({ISO-date})

   - **Versión guardada:** `old/{stem}-{ISO-date}-iter{N}.{ext}`
   - **Razón del cambio:** {feedback Rafael verbatim o issue identificado}
   - **Qué se intentará diferente:** {hipótesis del prompt/approach nuevo}
   - **Commit hash del cambio:** `{hash post-regen}`
   ```
4. **Regenerar** el asset (artist-creator / artist-editor / inline).
5. **Commit** atómico mencionando la iteración (e.g. `art(ch4): regenerate ch4-bust.png iter4 — color match piel/ojos`).

**Aplica a:**
- Dispatches a `artist-creator` y `artist-editor` agents (incluirlo en el prompt del dispatch).
- Regeneraciones inline desde main session.
- Cualquier sobrescritura de PNG/JPG/WEBP en `public/assets/`.

**NO aplica a:**
- Primera generación de un asset que no existía (no hay "iter0" que preservar).
- Compresión / optimización del MISMO asset (no es regeneración semántica).

**Por qué:** Rafael puede revertir si una iteración rompe lo que funcionaba.
El CHANGELOG da trazabilidad de las decisiones visuales sin contaminar `git log`
con narrativa larga. Memoria persistente del proceso para futuras sesiones.

---

## 7. Estado actual del proyecto

**Objetivo:** portafolio personal decorado con pixel art generado vía los MCPs de arte.
El usuario aportará sus datos (bio, proyectos, contacto, paleta visual deseada) y
desde ahí el planner orquesta la generación de assets y la maquetación.

### 7.1 Estructura

```
mato-new-portfolio/
├── CLAUDE.md                        ← este archivo
├── .claude/
│   ├── agents/
│   │   ├── planner.md               ← orquestador
│   │   ├── artist-creator.md        ← genera arte (pixelforge)
│   │   ├── artist-editor.md         ← edita arte (Adobe MCP)
│   │   ├── frontend-dev.md          ← código Vue/Phaser
│   │   └── qa.md                    ← verificación
│   ├── commands/
│   │   ├── verificar-mcps.md        ← /project:verificar-mcps
│   │   └── nueva-capa.md            ← /project:nueva-capa
│   └── skills/
│       ├── crear-arte-pixelforge.md ← cómo usar pixelforge
│       ├── editar-arte-adobe.md     ← cómo usar Adobe MCP
│       └── dev-vue3-phaser.md       ← cómo desarrollar en este stack
├── package.json                     ← phaser ^3.86.0, vue ^3.4.0, vite ^5.4.0
├── vite.config.js                   ← host 127.0.0.1, port 5173
├── index.html                       ← image-rendering: pixelated
├── src/
│   ├── main.js                      ← createApp + vue-i18n + @fontsource imports
│   ├── App.vue                      ← shell completo (ScrollShell + sticky avatar/timeline + bg morph)
│   ├── components/                  ← 7 Chapter{N}Content + Flash*.vue (ch2 Y2K) + Phaser shells
│   ├── data/                        ← chapters / projects / bio / contact (contact+projects = stubs PENDING)
│   ├── i18n/locales/                ← es.json / en.json
│   ├── phaser/                      ← index.js + SpaceScene.js (ch6) + ch2/MatchScene.js (minigame)
│   └── styles/chapter-themes.css    ← 7 themes era-auténticos @layer
└── public/assets/                   ← decenas de assets pixel-art generados (+ old/ con CHANGELOG §6.5)
```

### 7.2 Estado del scaffold — DESACTUALIZADO, ver `.planning/STATE.md`

> ⚠️ El proyecto NO es un scaffold vacío. Está casi completo. Para el estado real y
> actualizado, la fuente de verdad es **`.planning/STATE.md`** (sección "Real State Audit 2026-06-01")
> y **`.planning/ROADMAP.md`**. Resumen a 2026-06-01:

- **Phases 1-5 ejecutadas** (1 con deferred iOS, 3 con deferred avatar art, 4 y 5 PASS-with-observations).
  + 2 fases INSERTED sobre ch2 (04.1 Y2K Flash stage, 04.2 match-3 minigame).
- Los 7 chapters están maquetados con arte pixel + Phaser (ch2 minigame + ch6 escena espacial) instanciado.
- Tests: **416/418 verdes** (2 rojos: bundle .woff2 782KB > 350KB tras añadir Cinzel; BackgroundLayers shorthand).
- **Phase 6 (deploy a Firebase) NO empezada.**

### 7.3 Próximo paso — pendientes reales (ver STATE.md "Next options")

- **Contenido real (BLOCKING, input Rafael):** `contact.js` vacío + `projects.js` stubs PENDING → CONTENT-CHECKLIST §2.1/2.2/3.
- **Arte busts:** ch4/ch5 regenerar matcheando ch3; ch6 ropa borrada (Adobe selective).
- **Visual polish:** "diseño roto desde ch3" cross-chapter.
- **Phase 6 deploy:** downscale backgrounds (~1.65MB) + fix bundle fuentes + Firebase config.

### 7.4 Correr el proyecto

```powershell
npm install
npm run dev   # → http://127.0.0.1:5173/
```

---

## 8. Preferencias del usuario

- Valida efecto visual cuanto antes, con placeholders si es necesario
- Trabaja en Windows 11 / PowerShell 5.1
- Comunicación en **español**
- No instalar pixel-mcp (Aseprite) salvo pedido explícito
- DogSprite MCP **no existe** — fue alucinación documentada, no mencionarlo
