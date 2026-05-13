---
phase: 1
plan: 6
slug: skiplink-a11y-polish
wave: 5
artifact: manual-checklist
target_executor: Rafael Matovelle (humano)
target_phase: Plan 07 (ios-smoke-test) — ejecutar como parte del smoke test general
created: 2026-05-12
---

# Phase 1 · Plan 06 — Manual Smoke Checklist (SkipLink + Focus Ring + Mobile)

> Este artefacto NO se ejecuta en Plan 06 (W5) — se escribe en Plan 06 y se
> ejecuta en Plan 07 (W6) como parte del smoke test general (junto al iOS
> smoke test y al manual checklist del Plan 05). Cubre la verificación visual
> de SkipLink, focus ring universal, ResizeObserver placeholder, y el
> breakpoint mobile <600px (incluyendo el item 10 crítico del MEDIUM 3 fix
> sobre overflow del SkipLink en 375×667).
>
> **Cómo usar:** Rafael corre `npm run dev`, abre `http://127.0.0.1:5173/`,
> y marca cada item como PASS o FAIL. Si algo falla, documentar en
> `01-EXECUTION-LOG.md` y abrir un bug fix antes de cerrar Phase 1.

---

## Preparación

```powershell
npm run dev
# Abrir http://127.0.0.1:5173/
# DevTools (F12) → Console limpia, sin errores rojos
# DevTools → Network → desactivar cache
```

Estado esperado al cargar:
- Página carga directamente en chapter 3 (`2013 · Web 2.0`)
- **SkipLink visible** en top:8px centrado horizontalmente con texto
  "Saltar al contenido / Skip to content"
- StickyAvatar visible en top-left con texto `ch3` (no se solapa con SkipLink)
- StickyTimeline visible en bottom con 7 ticks
- Tick `2013` con peso visual mayor

---

## 1. SkipLink at-load (A11Y-01)

- [ ] **1.1** SkipLink visible inmediatamente al cargar la página — centrado
  horizontalmente, top:8px, fondo `#1a1a2e`, texto `#e7e7f0`, font-weight 700
  monospace.
- [ ] **1.2** Texto exacto: `Saltar al contenido / Skip to content` (bilingüe
  en un solo string — Phase 2 lo i18n-iza con el toggle ES/EN).
- [ ] **1.3** Border 1px `#2e2e4a`, border-radius 4px, padding 8px 16px.
- [ ] **1.4** El SkipLink NO se solapa visualmente con el avatar (avatar top-left
  con margen 16px desktop / 8px mobile; skip-link top:8px centrado — no chocan
  en desktop; en mobile podrían quedar próximos pero no superpuestos).

## 2. Tab order (UI-SPEC §10)

- [ ] **2.1** Click en la URL bar (reset foco). Presionar `Tab` una vez → el
  foco visualmente cae en el **SkipLink** con un outline cyan `#7dd3fc` de 3px
  y offset 3px (focus ring universal).
- [ ] **2.2** Presionar `Tab` otra vez → el foco sale del SkipLink y va al
  `<main.scroll-shell>` (ScrollShell con `tabindex="0"`). El SkipLink se oculta
  (opacity 0 con fade 200ms — al haber tabulado más allá, dispara el `@blur`).
- [ ] **2.3** Presionar `Tab` siete veces más → el foco recorre los 7
  `tick-button` secuencialmente (1995 → 2001 → ... → 2026). Cada uno muestra
  el mismo outline cyan 3px offset 3px.

## 3. SkipLink activation (Enter / click)

- [ ] **3.1** Recargar la página. Presionar `Tab` → SkipLink recibe foco con
  outline cyan visible.
- [ ] **3.2** Presionar `Enter` → el browser navega a `#main-content`. El foco
  se transfiere automáticamente al ScrollShell (tiene `tabindex="0"` — el
  browser hace el transfer nativo).
- [ ] **3.3** Inmediatamente presionar `↓` → el ScrollShell tiene foco y snap
  a ch4 dispara (confirma que el foco está en el shell, no en el SkipLink).
- [ ] **3.4** Recargar. Click en el SkipLink con el mouse → mismo
  comportamiento: foco salta a `#main-content`, ↓ funciona.

## 4. Hide-on-scroll

- [ ] **4.1** Recargar. SkipLink visible. Hacer scroll lento (wheel down) →
  el SkipLink se oculta con un fade de 200ms.
- [ ] **4.2** Continuar scrolleando → el SkipLink permanece oculto, no
  reaparece.
- [ ] **4.3** Scrollear hacia arriba volviendo a la parte superior → el
  SkipLink sigue oculto (es one-shot por sesión: la pestaña debe recargarse
  para volver a verlo).

## 5. Focus ring universal (A11Y-05, UI-SPEC §10)

- [ ] **5.1** Tab desde URL bar varias veces → outline cyan 3px offset 3px
  en **SkipLink**, luego en **main**, luego en los **7 tick-button**. Todos
  el mismo grosor/color/offset.
- [ ] **5.2** **Mouse click** en un tick → el tick recibe foco pero **sin
  outline visible** (`:focus-visible` distingue keyboard vs pointer — el
  outline solo aparece bajo navegación con teclado).
- [ ] **5.3** Después del click, presionar `Tab` → ahora SÍ aparece el outline
  cyan en el siguiente focusable (la regla `:focus-visible` se reactiva al
  detectar input de teclado).

## 6. Mobile responsive — desktop emulator (<600px)

> DevTools → Toggle device toolbar → seleccionar viewport `375 × 667` (iPhone SE)
> o usar "Responsive" + ajustar a `< 600px`.

- [ ] **6.1** Avatar shrink a 56×68px en top:8px left:8px (UI-SPEC §9).
- [ ] **6.2** Timeline shrink a 44px height, padding 8px (UI-SPEC §9).
- [ ] **6.3** SkipLink centrado, max-width: calc(100vw - 32px) — visible y
  legible.
- [ ] **6.4** Era title (`2013 · Web 2.0`) centrado, sin overlap con avatar
  ni timeline (el `chapter-placeholder` padding-top/bottom lo asegura).

## 7. ★ SkipLink overflow check en 375×667 (MEDIUM 3 fix — CRÍTICO)

> Este item es la verificación del MEDIUM 3 del plan-checker iter 2. Debe
> validarse antes de cerrar Plan 06. Si la mitigación no fue necesaria en
> el momento de ejecución del Plan 06 pero falla en Plan 07, aplicar la
> mitigación documentada abajo.

- [ ] **7.1** Con viewport 375×667 (portrait), recargar la página. SkipLink
  visible al-load.
- [ ] **7.2** Inspeccionar el `<a id="skip-link">` en DevTools → leer
  `clientWidth` vs `scrollWidth` del elemento.
  - **Caso PASS:** `scrollWidth ≤ clientWidth` → texto completo sin ellipsis.
    El SkipLink muestra "Saltar al contenido / Skip to content" sin recorte
    visible. **No requiere mitigación.**
  - **Caso FAIL:** `scrollWidth > clientWidth` → texto trunca con ellipsis
    (`text-overflow: ellipsis` aplica). Mitigación requerida.

### Mitigaciones documentadas (aplicar UNA si 7.2 FAIL)

**Opción A — Reducir copy:** Mantener solo un idioma según `<html lang>`. En
Phase 1 `<html lang="es">` está hardcoded, por lo que el copy quedaría como
"Saltar al contenido". Trade-off: pierde la propiedad bilingüe pre-i18n.
Aplicable solo si la opción B no es suficiente.

```diff
-  >Saltar al contenido / Skip to content</a>
+  >Saltar al contenido</a>
```

**Opción B — Reducir font-size en mobile (preferida):** Añadir un media query
al `<style scoped>` de `src/components/SkipLink.vue`:

```css
@media (max-width: 599px) {
  .skip-link {
    font-size: 12px;
    padding: var(--sp-xs) var(--sp-sm);
  }
}
```

Trade-off: texto más pequeño en mobile, dentro del rango aceptable de
legibilidad (12px es el mínimo recomendado para texto de UI). Mantiene la
propiedad bilingüe.

**Decisión:** Plan 06 cerró con texto completo verificado en 375×667 sin
ellipsis (caso PASS al momento de ejecución). Si Plan 07 detecta un FAIL en
hardware real, **aplicar Opción B** (las regla CSS de media query es
predecible y mantenible). Documentar el cambio en el SUMMARY de Plan 07 si
se aplica.

## 8. Mobile landscape

- [ ] **8.1** Rotar a `667 × 375` (landscape). Verify:
  - Scroll vertical sigue snappeando.
  - SkipLink visible y centrado.
  - Sticky avatar y timeline visibles.
  - Era title centrado.
- [ ] **8.2** Tab order sigue siendo correcto: SkipLink → main → 7 ticks.

## 9. PRM (D-04 + D-05 + D-06 final check)

> DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion"
> → `reduce`. Recargar.

- [ ] **9.1** Recargar con PRM activo → landing en ch3 instantáneo.
- [ ] **9.2** SkipLink visible at-load.
- [ ] **9.3** Hacer scroll → el SkipLink desaparece **sin transición** (PRM
  aplica `transition: none` — UI-SPEC §8 D-06; el cambio de opacity es
  instantáneo en lugar del fade 200ms default).
- [ ] **9.4** Click en tick `2026` → snap instantáneo (D-04) + marker salta
  instantáneo. Avatar swap instantáneo (D-02, sin fade).
- [ ] **9.5** Hover sobre cualquier tick → la micro-transition 150ms se
  mantiene (D-05 — interaction-derived).
- [ ] **9.6** Tab desde URL bar → SkipLink recibe foco con el outline cyan
  (focus ring se mantiene bajo PRM — UI-SPEC §10 + A11Y-05 + D-05).

## 10. Sin regresiones (Plans 02-05)

- [ ] **10.1** Snap entre chapters sigue funcionando (CORE-01, CORE-04).
- [ ] **10.2** Deep-link `?ch=5` carga directamente ch5 (CORE-05).
- [ ] **10.3** Avatar swap 200ms total al cambiar chapter (CORE-10, default
  motion).
- [ ] **10.4** Timeline marker tracks scrollProgress continuamente bajo
  default motion (CORE-11, HIGH 3 — referencia al Plan 05 checklist item 3.1).
- [ ] **10.5** Keyboard navigation ↑/↓/j/k/Home/End funciona (A11Y-02).

---

## Resultado

- [ ] **Todos los items PASS** → registrar en `01-EXECUTION-LOG.md` con
  timestamp + iniciales del verificador. Si el item 7.2 fue PASS sin necesidad
  de mitigación, confirmarlo explícitamente.
- [ ] **Item 7.2 FAIL en hardware real** → aplicar Opción B (preferida) o
  Opción A. Re-ejecutar items 6-7 para confirmar PASS post-mitigación.
  Documentar en SUMMARY del Plan 07.
- [ ] **Otro item FAIL** → bug en `01-EXECUTION-LOG.md` con item N,
  descripción, screenshot, hot-fix antes de cerrar Phase 1.

---

*Manual checklist generado: 2026-05-12 (Plan 06 W5, executor: Claude Opus 4.7).*
*Ejecutor humano: Rafael Matovelle (en Plan 07 / W6).*
*Cubre: A11Y-01 (skip link), A11Y-05 (focus ring), MOB-01 (mobile responsive),
MOB-03 (ResizeObserver — verificación indirecta vía absence de regresiones),
D-06 (skip link hide transition under PRM), MEDIUM 3 (overflow check 375×667).*
