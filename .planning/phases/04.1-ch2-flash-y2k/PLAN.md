---
phase: 04.1-ch2-flash-y2k
plan: 01
type: execute
wave: 0
depends_on: ["04-chapters-0-2-4-5"]
files_created:
  - src/components/FlashSidebarNav.vue
  - src/components/FlashStage.vue
  - src/components/FlashHomePanel.vue
  - src/components/FlashAboutPanel.vue
  - src/components/FlashWorkPanel.vue
  - src/components/FlashContactPanel.vue
  - src/components/FlashPreloader.vue
  - src/components/FlashMobileNotice.vue
  - public/Profile.pdf
files_modified:
  - src/components/Chapter2Content.vue
  - src/styles/chapter-themes.css
  - tests/components/Chapter2Content.test.js
autonomous: false
---

# Phase 04.1 — ch2 Flash Y2K cyber single-page interactive (iter3)

## Goal

Reemplazar el chrome IE6 cálido beige de iter2 por un **stage Flash Y2K cyber full-bleed**
con sidebar nav HOME·ABOUT·WORK·CONTACT, paneles intercambiables con tween fade-slide,
preloader cyber al entrar al viewport, SFX clicks/whoosh, y mobile notice easter-egg.
Single-screen sin scroll interno; el scroll-snap global lleva a ch3 al salir.

## Decisiones locked

| ID | Decisión | Razón |
|---|---|---|
| Y2K-01 | Chrome IE6 iter2 ELIMINADO. Stage full-bleed | Rafael 2026-05-17: "Sin chrome — solo stage Flash Y2K full-bleed" |
| Y2K-02 | Sidebar nav 4 items (HOME/ABOUT/WORK/CONTACT) | Arquetipo elegido: "Sitio Flash con menú lateral" |
| Y2K-03 | Paleta Y2K: azul hielo + cromo + neón lima/naranja eléctrico | Rafael — futurismo Y2K reference Y2K aesthetic doc |
| Y2K-04 | BG: scanlines + hex grid + blobs líquidos + noise | Misma ref |
| Y2K-05 | Tipografía mix: Press Start 2P headings + VT323 tech + Verdana prose | Y2K real era mix |
| Y2K-06 | Audio SKIPPED iter3 (pivot 2026-05-17 — descarga CC0 falló 403, Rafael eligió posponer) | Sin scope de audio en esta iter |
| Y2K-08 | Preloader IntersectionObserver trigger CADA entrada al viewport | Rafael — "vibe puro 2009 recargas constantes" |
| Y2K-09 | CV: 2 botones (ES/EN) ambos → /Profile.pdf temp; segundo PDF después | Rafael 2026-05-17 |
| Y2K-10 | Icons sidebar: SVG inline wireframe-neon (no pixelforge para 4 íconos) | Velocidad; reevaluar si Rafael quiere pixel-art icons después |
| Y2K-11 | Mobile <600px: notice modal + stacked accesible. Sin frame | Rafael — "explicar sin explicar, this is way nicer on browser" |
| Y2K-12 | Selectores legacy preservados (.ch2-layout/.ch2-meta/.ch2-content/.ch2-bio/.ch2-projects/.ch2-flavor) | Mantener tests Phase 4 verdes — mapeados a la nueva estructura |

## Must-haves

- `.ch2-layout` + `.ch2-meta` + `.ch2-content` + `.ch2-bio` + `.ch2-projects` + `.ch2-flavor` siguen en DOM (legacy test contract).
- `<FlashBanner>` renderiza dentro del HOME panel (T6).
- `[data-chapter="2"] .project-card` mantiene `linear-gradient` (T7, ahora cromo+neón en vez de naranja).
- Preloader respeta `prefers-reduced-motion`: fade-in directo sin barra animada.
- 100dvh viewport sin scroll interno desktop ≥600px.
- Mobile <600px: scroll vertical normal, notice modal dismissible.

## Anti-features (NO en esta iter)

- **Audio completo** (SFX, loop, mute toggle) — deferred a iter futura.
- Pixel-art icons sidebar — SVG por ahora.
- Mini-advergame embed — iter4 separada.
- Sound design avanzado (engranajes, blips múltiples).

## Tasks

Ver TaskList runtime. Resumen:

1. Scaffold dir + PLAN.md ✓
2. Copy Profile.pdf → public/
3. Download CC0 SFX (4 files)
4. composables/useFlashAudio.js
5. FlashPreloader.vue
6. FlashSidebarNav.vue
7. FlashStage + 4 panels
8. FlashMobileNotice.vue
9. Refactor Chapter2Content.vue
10. Replace [data-chapter="2"] CSS (Y2K cyber)
11. Update Chapter2Content.test.js (panel switching coverage)
12. Smoke test (npm test ch2; npm run build)
13. Commit + CHANGELOG iter3

## Threat model

| Threat | Mitigation |
|---|---|
| Layout shift al cargar pdf icon | SVG inline; sin imágenes externas en CONTACT |
| Tests Phase 4 rotos por refactor | Preservar selectores legacy; mapping documentado en Y2K-12 |
| `[data-chapter="2"]` selectors leak a otros chapters | Tests theme-isolation existentes catch this |
