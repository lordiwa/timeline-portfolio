---
name: feedback-asset-iteration-process
description: "Antes de regenerar un asset en public/assets/, mover el actual a public/assets/old/{stem}-{ISO-date}-iter{N}.{ext} + entry CHANGELOG.md. Establecido por Rafael 2026-05-14."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 12ecb221-ea5c-4124-9ef0-bc4f0ec91ee9
---

Cuando regeneres un asset existente en `public/assets/` (sobrescritura, no primera generación), DEBES:

1. Asegurar `public/assets/old/` existe (crear si no).
2. Mover el asset actual con `git mv` o equivalente a `public/assets/old/{stem}-{ISO-date}-iter{N}.{ext}`.
3. Append entry a `public/assets/old/CHANGELOG.md` con razón del cambio + qué se intentará diferente.
4. Generar nueva versión.
5. Commit atómico mencionando "iter{N+1}" en el mensaje.

**Why:** Rafael (2026-05-14) explícitamente pidió "siempre que iteremos guarda las imagenes en una carpeta old junto con un md explicando porque las cambiamos, entendido? agrega al proceso". Razones implícitas: poder revertir si una iteración rompe lo que funcionaba; trazabilidad de decisiones visuales sin contaminar git log con narrativa; auditabilidad cross-session.

**How to apply:**
- Si vas a despachar `artist-creator` o `artist-editor` para regenerar un asset → incluye en el prompt del dispatch las instrucciones de `old/` + CHANGELOG. El agente debe hacerlo ANTES de invocar pixelforge.
- Si regeneras inline desde main session → ejecuta el move + CHANGELOG manualmente.
- El CHANGELOG es additivo (append), nunca rewrite.
- iter1 = la primera generación original del asset (no se preserva, no existe iter0); iter2 = primera regeneración (se preserva el iter1 en `old/`); iter3 = segunda, etc.
- Si la regeneración falla (drift inaceptable), la versión `old/iter{N}` queda como fallback restaurable con `git mv` o `cp`.
- NO aplica para compresión/optimización del mismo asset (no es regeneración semántica) ni para primera generación.

Documentado en `CLAUDE.md §6.5` (committed 2026-05-14). Aplicable a Phase 6 polish + Phase 3 Plan 03-05 batch 7 busts si se hace post-iteración.

Cross-ref: [[reference-photos-available]] (las refs personales en `public/references/` siguen su propia gitignore convention — esto es para outputs ya commitedos en `public/assets/`).
