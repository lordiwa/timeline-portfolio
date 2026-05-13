---
phase: 1
plan: 5
slug: sticky-timeline-marker
wave: 4
artifact: manual-checklist
target_executor: Rafael Matovelle (humano)
target_phase: Plan 07 (ios-smoke-test) — ejecutar como parte del smoke test general
created: 2026-05-12
---

# Phase 1 · Plan 05 — Manual Smoke Checklist (StickyTimeline + Keyboard Nav)

> Este artefacto NO se ejecuta en Plan 05 (W4) — se escribe en Plan 05 y se
> ejecuta en Plan 07 (W6) como parte del smoke test general (junto al iOS
> smoke test). Lo escribe el executor del Plan 05 para garantizar que los
> items críticos (especialmente el comportamiento del marker durante click
> smooth-scroll vs PRM jump — HIGH 3 fix) quedan documentados para el
> verificador humano.
>
> **Cómo usar:** Rafael corre `npm run dev`, abre `http://127.0.0.1:5173/`,
> y marca cada item como PASS o FAIL. Si algo falla, documentar en
> `01-EXECUTION-LOG.md` y abrir un bug fix antes de cerrar Phase 1.

---

## Preparación

```powershell
npm run dev
# Abrir http://127.0.0.1:5173/
# Abrir DevTools (F12) → Console (debe estar limpia, sin errores rojos)
# DevTools → Network → desactivar cache
```

Estado esperado al cargar:
- Página carga directamente en chapter 3 (`2013 · Web 2.0`)
- StickyAvatar visible en top-left con texto `ch3`
- StickyTimeline visible en bottom con 7 ticks
- Tick `2013` con peso visual mayor (font-weight 700, color claro, notch opacity 1.0)
- Marker (puck circular) posicionado sobre/cerca del tick `2013` (~50% del track)

---

## 1. Timeline visual (default motion)

- [ ] **1.1** Timeline bottom visible: 48px de altura, fondo `#1a1a2e`, border-top sutil de 1px en `#2e2e4a`.
- [ ] **1.2** 7 ticks distribuidos uniformemente con `justify-content: space-between`. Años visibles: `1995`, `2001`, `2009`, `2013`, `2015`, `2022`, `2026`.
- [ ] **1.3** El tick `2013` (chapter 3, default landing) tiene mayor peso visual: `font-weight: 700`, color `#e7e7f0`, notch opacity 1.0.
- [ ] **1.4** Los otros 6 ticks tienen `font-weight: 400`, color `#6b6b8a`, notch opacity 0.4.
- [ ] **1.5** El marker (puck redondo `#a0a0c0` de 16px) está posicionado aproximadamente sobre el tick `2013` (scrollProgress = 3/6 ≈ 0.5 → left: 50%).

## 2. Marker reactivo (scroll manual)

- [ ] **2.1** Hacer scroll lento hacia abajo (wheel down o flecha ↓ del trackpad) → el marker se mueve continuamente a la derecha mientras el chapter 4 entra en viewport.
- [ ] **2.2** Soltar el scroll → snap completa → el marker queda en una posición proporcional al ch4 (~66% del track).
- [ ] **2.3** Inverse: scroll hacia arriba desde ch4 → marker se mueve a la izquierda continuamente, snap a ch3.

## 3. ★ Marker tracking durante click smooth-scroll (HIGH 3 fix — CRÍTICO)

> **Estos dos items son la verificación crítica del comportamiento dual del marker
> bajo smooth scroll vs PRM jump. Ambos resultados son CORRECTOS por diseño
> (D-04 + UI-SPEC §8). Si el marker brinca bajo default motion, hay un bug.**

- [ ] **3.1** (Item 8 del plan) **Click en tick `2026` con PRM OFF** → el marker se ve recorrer la track horizontalmente durante el smooth scroll, **NO salta de golpe**. Verificar visualmente que durante los ~600-1000ms del smooth scroll, el marker progresa continuamente de izquierda a derecha; no aparece directamente en el extremo. Si el marker brinca instantáneamente bajo default motion, hay un bug: revisar que `transition: left 0ms linear` está en el CSS (no `200ms ease` o similar) Y que el RAF de useScrollState está pausando/reanudando correctamente.
- [ ] **3.2** (Item 9 del plan) **Mismo click bajo PRM ON** → el marker brincado-instantáneo es **CORRECTO** (no es un bug). Bajo PRM, `behavior: 'auto'` hace que `scrollTop` salte instantáneo → `scrollProgress` salta → marker salta. Esto es D-04 funcionando como se especificó. Para activar PRM: DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → `reduce`.

## 4. Click-to-nav adicional

- [ ] **4.1** Click en el tick `1995` (con PRM OFF) → snap smooth a chapter 0 (`1995 · Terminal`). El avatar muestra `ch0`. El tick `1995` ahora es activo (peso 700, color claro).
- [ ] **4.2** Click en `2013` → snap smooth a chapter 3 (vuelve al landing).
- [ ] **4.3** Click en `2009` → snap smooth a chapter 2. El marker se mueve continuamente hasta posicionarse sobre `2009`.

## 5. Hover state (D-05 — interaction-derived)

- [ ] **5.1** Hover sobre `2009` (sin click) → `.tick-year` cambia a color `#c0c0d8` (`--c-tick-hover`), notch crece a 10px de altura y opacity 0.7, transition perceptible de ~150ms.
- [ ] **5.2** Sacar el cursor → notch vuelve a 8px opacity 0.4, year vuelve a color `#6b6b8a`, transition de ~150ms.
- [ ] **5.3** Activar PRM y repetir hover → la transition de 150ms **se mantiene** (D-05: micro-interactions ≤150ms son interaction-derived, no decorativas → permitidas bajo PRM).

## 6. Keyboard navigation (A11Y-02)

- [ ] **6.1** Tab dos veces desde la URL bar → el foco llega al `<main.scroll-shell>` (visible outline si tiene focus — el outline universal viene en Plan 06, pero `tabindex="0"` ya hace focusable).
- [ ] **6.2** Presionar `↓` (con el shell con foco) → snap a ch4. Presionar `↑` → vuelve a ch3.
- [ ] **6.3** Presionar `j` → snap a ch4 (vim alias de ↓). Presionar `k` → vuelve a ch3 (vim alias de ↑).
- [ ] **6.4** Presionar `End` → snap a ch6. Presionar `Home` → snap a ch0.
- [ ] **6.5** En ch0 presionar `k` o `↑` → **no pasa nada** (clamped a 0).
- [ ] **6.6** En ch6 presionar `j` o `↓` → **no pasa nada** (clamped a 6).
- [ ] **6.7** Tab adicional desde el shell → foco recorre los 7 `tick-button` secuencialmente (1995 → 2001 → ... → 2026).
- [ ] **6.8** Sobre un tick focado, presionar `Enter` o `Space` → navega al chapter correspondiente (equivale a click).

## 7. PRM completo (D-04)

> DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion" → `reduce`.
> Recargar la página.

- [ ] **7.1** Recargar con PRM activo → la página carga en ch3 instantáneamente (sin smooth scroll inicial). Esto es el deep-link default usando `'auto'` (Plan 02 ya lo hacía).
- [ ] **7.2** Click en tick `2026` → snap **instantáneo** + marker salta instantáneo (D-04 verified).
- [ ] **7.3** Flecha `↓` → salta a ch6 instantáneo (no smooth).
- [ ] **7.4** Hover sobre cualquier tick → la micro-transition 150ms se mantiene (D-05 — interaction-derived).
- [ ] **7.5** Desactivar PRM (`no-preference` en DevTools) → recargar → comportamiento default vuelve (smooth scroll).

## 8. Mobile breakpoint (<600px)

> DevTools → Toggle device toolbar → seleccionar viewport `375 × 667` (iPhone SE) o usar "Responsive" + ajustar a `< 600px`.

- [ ] **8.1** Timeline shrink a 44px de altura, padding lateral 8px (`--sp-sm`).
- [ ] **8.2** Tick-year baja a `font-size: 11px`.
- [ ] **8.3** Touch targets siguen siendo ≥44×44px — verificable inspeccionando un `button.tick-button` en DevTools (computed → ver `min-width: 44px; min-height: 44px`).
- [ ] **8.4** Avatar también shrinkea a 56×68px en top-left (UI-SPEC §9, Plan 04).
- [ ] **8.5** Era title sigue centrado entre avatar y timeline sin overlap (chapter-placeholder padding-top/bottom).
- [ ] **8.6** Rotar a landscape (`667 × 375`) → snap vertical sigue funcionando, sticky elements visibles.

## 9. env(safe-area-inset-bottom) — HIGH 4 verificación visual

> En desktop browsers (Chrome, Firefox, Safari macOS) el `env(safe-area-inset-bottom)`
> retorna `0` (no hay notch / no hay safe-area), por lo que la mitigación NO afecta
> visualmente — el timeline queda exactamente en `bottom: 0`. Esto es el fallback
> graceful documentado en Plan 05 §key-decisions.

- [ ] **9.1** En desktop normal: el timeline está pegado al `bottom: 0` del viewport (sin gap entre timeline y borde inferior). El `env()` con fallback `0` no introduce regresión.
- [ ] **9.2** (Plan 07 lo verificará en iPhone real) En iOS Safari con notch / Dynamic Island, el timeline debe quedar **por encima** de la safe-area bottom — no oculto bajo la Safari toolbar dinámica. Si Plan 07 lo confirma → HIGH 4 fix funcionó preventivamente y no requiere iteración.

## 10. Sin regresiones del Plan 04

- [ ] **10.1** El avatar sigue haciendo crossfade 200ms total al cambiar de chapter (default motion).
- [ ] **10.2** El avatar swap es instantáneo bajo PRM (D-02 — sin transición de opacidad).

---

## Resultado

- [ ] **Todos los items PASS** → registrar en `01-EXECUTION-LOG.md` con timestamp + iniciales del verificador.
- [ ] **Algún item FAIL** → documentar bug en `01-EXECUTION-LOG.md` con item N, descripción del bug, screenshot si aplica, y abrir hot-fix antes de cerrar Phase 1.

---

*Manual checklist generado: 2026-05-12 (Plan 05 W4, executor: Claude Opus 4.7).*
*Ejecutor humano: Rafael Matovelle (en Plan 07 / W6).*
