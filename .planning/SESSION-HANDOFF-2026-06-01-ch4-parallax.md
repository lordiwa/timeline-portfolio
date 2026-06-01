# SESSION HANDOFF — 2026-06-01 · ch4 parallax + auditoría + mobile overflow

> Para reiniciar tras `/clear`. Comunicación con Rafael en **español**.
> Dev server: `npm run dev` (estuvo en `http://localhost:5174`). Usar `?ch=N` para saltar.

## Qué se hizo esta sesión (todo commiteado en `master`)

1. **Auditoría de estado** (commits `8d50fb3`, etc.): corregidas disonancias STATE.md/ROADMAP.md/CLAUDE.md §7; SUMMARY retroactivos de las fases INSERTED 04.1/04.2. El "93%" era engañoso. Ver `STATE.md` → "Real State Audit 2026-06-01".
2. **Bundle de fuentes** (`96c1f18`): 782KB → 329KB (eliminado Roboto, usaba 4 pesos × 8 idiomas para un solo hint; ahora Inter Variable). Test `fonts-bundle` verde.
3. **BackgroundLayers T7** (`41b1ab8`): `.bg-layer` usa shorthand `background`. **Suite 418/418 verde** (era 416).
4. **ch4 parallax "flotando en el vacío"** (concepto de Rafael) — Fases A/B/C:
   - **Fase A** (`d46ca28`): motor de parallax 4 capas (portal/matrix/character/near) con puntero + drift autónomo (RAF, CSS vars `--mx/--my/--dx/--dy`), PRM-aware. Patrón reusado de ch3.
   - **Fase B** (`80c29b1`): arte real con pixelforge (1376px nativo, sin optimize/process):
     `ch4-portal.png` (espacio + portal cyan con mundo 3D wireframe tenue abajo-derecha) +
     `ch4-character.png` (chico flotando de espaldas con gafas VR). Capas matrix(c3)+near(c0)
     son glifos/partículas CSS (mitad CSS del híbrido). §6.5 aplicado: `ch4-bg.png` → `old/`.
     Fix de composición: `.ch4-layout` reclama `width:100%; flex:1 1 100%` (mismo bug que ch2;
     si no, el parallax queda angosto y el portal cae fuera).
   - **Título** (`d48220a`): meta "2015/AR/VR" → título grande centrado full-width
     "Del movimiento a nuevas realidades" (i18n `chapters.4.heading` ES/EN).
   - **Contenido a la izquierda** (`ca98d36`, `12a3a43`): columna flotante con bio + 2 proyectos.
     Quitado el borde conic rotativo ("horrible"); halo cyan sutil. Sin scrollbar.
   - **Posición** (`bc04627`, `2384d60`): contenido `margin-top: 20vh` (altura "perfecta" per Rafael)
     + `margin-left: 7vw` (un poco hacia el centro, no centrado del todo).
5. **ch1 fix** (`a8bcbf1`): el contenido se recortaba abajo en pantallas anchas/bajas (1882×898).
   Causa: flex-column de altura fija encogía los items y aplastaba el marquee (texto cortado).
   Fix: `.ch1-content > * { flex-shrink: 0 }` (marquee con altura completa) + bio más ancha
   (760→1000px) + compactado → entra sin scroll. (Se revirtió un intento sticky roto previo.)
6. **Mobile notice bleed** (`4260ab5`): el `FlashMobileNotice` de ch2 (modal `position:fixed`)
   tapaba TODOS los chapters en mobile → gateado con `v-if="activeChapter === 2"`.

## PRÓXIMO PASO (lo que pidió Rafael) → arreglar overflow horizontal global de mobile

**Plan completo y diagnóstico en `.planning/PLAN-mobile-overflow-fix.md`.** Resumen:
- Síntoma: en mobile el contenido se recorta a ambos lados (ch3 título, ch4 paneles).
- Causa diagnosticada en vivo: el viewport de layout mobile se expande (docScrollW=482 en
  ventana de 390) por las **capas de parallax** (`.ch3-layer`/`.ch4-layer`, `inset:-8%;width:116%`).
  `html, body` no tienen `overflow-x:hidden` (sí lo tienen `.scroll-shell` y `.chapter-section`).
- Fix recomendado (verificar en orden): (1) `html,body { overflow-x:hidden; max-width:100% }`
  en `index.html`; (2) en mobile, capas ch4 sin overscan (`inset:0;width/height:100%`, ya son
  estáticas); ch3 solo si hace falta (sus capas SÍ se mueven con scroll en mobile).
- Verificación: script de scan en el PLAN → `docScrollW === clientWidth` y "NINGUNO" en ch0..6,
  + screenshots mobile sin recorte. Quitar el script al terminar. `npm run test:run` 418/418.

## Estado / pendientes (de STATE.md "Deferred Items")
- ⚠️ **Overflow horizontal mobile** — EN CURSO (este plan).
- Contenido real (bio/proyectos/contact) — lo define Rafael (memoria `feedback_rafael-owns-content-claude-owns-design`).
- ch4 matrix PNG tenio (híbrido) — opcional, hoy glifos CSS.
- Phase 6 deploy (Firebase) — no empezada; backgrounds pesados pendientes de downscale.
- `public/ch1bug.png` — screenshot de debug de Rafael, sin commitear; preguntar si borrar.

## Notas de proceso
- Arte: NUNCA `optimize_sprite`/`process_sprite` (aplastan a 128px). `forge_background` opaco /
  `forge_sprite size:0` transparente. §6.5 al regenerar (mover a `old/` + CHANGELOG).
- Validar SIEMPRE con screenshots headless (`chrome --headless=new --screenshot`) + tool Read.
- Errores pasados de parallax: `position:fixed` hace bleed entre chapters (usar absolute/sticky);
  `.chapter-section` es flex-centrado (reclamar width:100% o el contenido queda angosto/centrado).
