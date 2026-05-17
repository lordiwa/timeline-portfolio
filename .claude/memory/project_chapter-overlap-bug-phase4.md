---
name: project-chapter-overlap-bug-phase4
description: "Bug visual reportado 2026-05-14 — chapters overlapping al scrollear desde ch3 hacia adelante. Investigar scroll-snap-stop + .ch{N}-layout overflow/position stacking context."
metadata: 
  node_type: memory
  type: project
  originSessionId: 15fb6428-dbb2-48ab-97f9-bfc123b67c40
---

Bug visual reportado por Rafael 2026-05-14 al cerrar Phase 4: al hacer scroll desde ch3 hacia adelante (ch4, ch5), los chapters se overlapping — el chapter superior se queda visible encima del siguiente section.

**Why:** scroll-snap mandatory + Phase 4 wrappers Chapter4Content/Chapter5Content tienen `.ch{N}-layout { position: relative; overflow: hidden }` (D4-07 contenedor parallax) o `overflow-y: auto` (D3-12 mobile heredado). Eso puede crear stacking context que mantiene la previous section visible durante el snap transition.

**How to apply:** Antes de Phase 5 deploy, investigar:
- Verificar `scroll-snap-stop: always` activo en `.chapter-section` (debería estar — Plan 04-02)
- Comprobar z-index/position de `.ch{N}-layout` cuando section pierde activeness
- Hipótesis: stacking context creado por position:relative + overflow:hidden mantiene el chapter "encima" del shell scroll
- Repro: `npm run dev`, scroll desde ch3 hacia abajo
- Posible fix: `.chapter-section { isolation: isolate }` o ajustar overflow del ch{N}-layout

Registrado también en STATE.md `## Deferred Items` (commit `eb30929` 2026-05-14). Phase 4 cerrada PASS-with-observations sin este fix.
