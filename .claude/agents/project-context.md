---
project_name: mato-new-portfolio
project_type: other
generated_at: 2026-07-27T01:31:14.295Z
schema_version: 1
---

## Problem
Rafael tiene un perfil poco convencional (Flash gamedev, UX y team lead, AR/VR, QA, full-stack con AI) que un CV plano aplana y vuelve generico, invisible ante recruiters internacionales. Necesita que el medio mismo demuestre el recorrido en vez de listarlo.

### Goals
- Que un visitante entienda en 30 segundos, sin leer una vinieta de CV, que mira a alguien con tres decadas de tecnologia cuyas habilidades convergen
- Conseguir entrevistas con recruiters internacionales (US/EU/Canada)
- Deploy a Firebase Hosting con los 7 chapters completos y contenido real
- Paridad ES/EN con copies pulidos, no auto-translate

### Scope (in)
- Scroll vertical con snap suave por 7 chapters cronologicos (1995-2026)
- Avatar pixel-art bust sticky top-left que swappea segun chapter activo
- Timeline sticky bottom con marcador movil, ano/era visible y click-to-navigate
- Background que morfea entre eras al cambiar de chapter
- Toggle i18n ES/EN con estado persistente entre chapters
- Escena Phaser explorable en chapter 6 y minijuego match-3 en chapter 2
- Pixel art via pixelforge: fondos chapters 2-6, 7 busts del avatar, elementos ambientales
- Desktop fluido mas mobile portrait y landscape funcionales
- Deploy a Firebase Hosting

### Scope (out)
- Character animation pixel art (limitacion documentada de pixelforge: frames incoherentes entre generaciones)
- Gameplay con objetivos o score en chapter 6: es exploracion ambiente, no juego
- CMS o backend dinamico: el contenido es estatico en v1
- Blog o articulos largos: el formato del sitio no calza con lectura larga
- Modo accesibilidad alternativo linealizado tipo CV plano

## Stack
- design_heavy: yes
- estimated_screens: 7
- stakes: real
- design_ambition: signature
- ui_framework: vue
- has_canvas_render: yes
- ui_outside_canvas: yes
- motion_required: yes
- motion_layer: both
- needs_research: have-direction
- assets_required: game-sprites-tiles, illustrations
- tier: MEDIO
- perfil_proyecto: [object Object]

## Testing conventions
Use the testing tool that fits this stack — the project standard is to keep a fast unit suite runnable via the project's default test command, and to write a failing test before any new behavior lands. Tests live next to the code they exercise (or under a top-level tests/ tree, whichever already exists in this repo); follow the local convention rather than introducing a new one.

## Linting and formatting
Run the project's linter and formatter before every commit. If the repo ships a config (e.g., .eslintrc, ruff.toml, .prettierrc, gofmt defaults), defer to it without arguing; if no config exists yet, use the ecosystem-standard tool and add a minimal config rather than reformatting the whole tree in a drive-by change.

## Type-specific guidance
- No project-type-specific assumptions apply — default to conservative, generic engineering practice until the stack reveals itself.
- Stack details were left unspecified at intake; ask the human (or update PROJECT.md) before making non-trivial architectural decisions.
- Prefer the simplest tool that solves the problem; do not import a framework when a 20-line helper would do.
- When in doubt, write the test first — the unspecified domain is exactly the case where tests pin down intent fastest.
