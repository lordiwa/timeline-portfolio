# Phase 1: Scroll Shell + Sticky Anchors - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 1-scroll-shell-sticky-anchors
**Areas discussed:** prefers-reduced-motion — qué desactiva

---

## prefers-reduced-motion — qué desactiva

### Q1 — Snap behavior bajo PRM

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener snap, solo quitar smoothness | `scroll-snap-type: y mandatory` activo; `scroll-behavior: auto` (jump instantáneo). Chapter-a-chapter sin marearse pero sin perder la mecánica. Patrón WCAG-friendly más común. | ✓ |
| Desactivar snap entero | `scroll-snap-type: none` bajo PRM. Scroll libre. Máxima accesibilidad vestibular pero rompe el concepto narrativo. | |
| Snap proximity en vez de mandatory | `scroll-snap-type: y proximity` bajo PRM. Compromiso. Costo: branch CSS adicional, posible inconsistencia. | |

**User's choice:** Mantener snap, solo quitar smoothness (recomendado)
**Notes:** Coherente con la intención del usuario de preservar la mecánica narrativa del sitio sin sacrificar accesibilidad vestibular básica.

### Q2 — Avatar swap bajo PRM

| Option | Description | Selected |
|--------|-------------|----------|
| Swap instantáneo | Sin crossfade ni opacity ni slide. Coherente con la política global. Tradeoff: parpadeo si scroll rápido, preferible para perfiles vestibulares. | ✓ |
| Crossfade rápido ≤ 100ms | WCAG SC 2.3.3 considera 'esencial' las transiciones cortísimas. Tradeoff: excepción a la política global. | |
| Sin swap visual — mostrar galería con uno destacado | El slot no anima en absoluto: 7 busts pequeños en fila, solo el activo enmarcado. Funciona pero cambia la semántica del slot. | |

**User's choice:** Swap instantáneo (recomendado)

### Q3 — Background morph entre eras bajo PRM (cross-cuts Phase 2)

| Option | Description | Selected |
|--------|-------------|----------|
| Cut duro — fondo cambia frame-a-frame | Coherente con la política PRM global (snap instant, avatar instant, BG instant). Cada chapter discreto. Phase 2 implementa transición default con un branch PRM que la corta. | |
| Crossfade rápido ≤ 150ms | El BG cambia tanto entre eras (terminal verde → 90s crudo → Flash → etc.) que un cut duro puede ser jarring incluso para PRM. Crossfade muy corto suaviza sin contar como motion significativa. Tradeoff: rompe consistencia con avatar instant. | ✓ |
| Background nunca anima (ni con ni sin PRM) | Background instantáneo para todos. Simplifica Phase 2 y elimina rama PRM. Tradeoff: pierde el efecto 'el sitio se transforma' que es parte del core value. | |

**User's choice:** Crossfade rápido (≤ 150ms)
**Notes:** Tradeoff explícito aceptado — el usuario diferencia por *visual weight*: elementos pequeños (avatar) toleran cuts duros, elementos grandes (background) necesitan suavizado mínimo. Es una excepción deliberada a la política PRM general, justificada por el área visual cubierta.

### Q4 — HUD micro-animations bajo PRM (timeline tick pulse, hover, focus)

| Option | Description | Selected |
|--------|-------------|----------|
| Todas instantáneas — cero animación decorativa | Tick activo se distingue por color/contraste sin pulso. Hover muestra color sin transition. Focus ring single-frame. Coherente con la política global; única excepción es el BG crossfade de Q3. | |
| Transitions cortísimas (≤ 150ms) en hover/focus | Hover/focus mantienen transition suave porque son interaction-derived (input del usuario, no animación auto-iniciada). WCAG SC 2.3.3 distingue interaction-from animation. Cero decoración auto-played pero hover/focus sí. | ✓ |
| Decisión la deja a Phase 2 | Phase 1 solo construye mecánica y slots sticky funcionales; Phase 2 dispone con UI-SPEC. Riesgo: inconsistencia downstream sin política clara. | |

**User's choice:** Mantener transitions cortísimas (≤ 150ms) en hover/focus
**Notes:** Confirma el principio rector "interaction-derived ≤ 150ms OK; auto-played / decorative OFF" que ahora aplica como política heredada para Phases 2-6.

### After Q4 — Decision sobre continuar

| Option | Description | Selected |
|--------|-------------|----------|
| Listo para CONTEXT.md | Cerrar discusión; las otras 3 áreas (vueuse, iOS smoke test, placeholder visual) quedan anotadas como 'open questions for research/planning'. | ✓ |
| Explorar las otras 3 áreas | Continuar con vueuse, iOS smoke test, placeholder visual. CONTEXT.md más completo, planner con menos decisiones. | |
| Más preguntas sobre PRM | Dimensión adicional de PRM no cubierta. | |

**User's choice:** Listo para CONTEXT.md — escribí con lo que tenemos

---

## Areas NOT selected for discussion (presented in present_gray_areas)

| Area presented | User's choice |
|----------------|---------------|
| Runtime base: Vue/vueuse blocker | NOT selected — deferred to research/planning (Open-Q-A in CONTEXT.md) |
| Protocolo del smoke test iOS | NOT selected — deferred to research/planning (Open-Q-B in CONTEXT.md) |
| Placeholder visual de Phase 1 | NOT selected — deferred to research/planning (Open-Q-C in CONTEXT.md) |
| prefers-reduced-motion — qué desactiva | ✓ selected — discussed in 4 questions above |

## Claude's Discretion

Las 3 áreas presentadas pero no seleccionadas (Vue/vueuse blocker, iOS smoke test protocol, Phase 1 placeholder visual) quedan en discreción del `gsd-phase-researcher` y `gsd-planner` — documentadas como Open-Q-A, B, C en la sección Implementation Decisions de CONTEXT.md con las opciones que el usuario ya conoce.

## Deferred Ideas

Recogidos durante la discusión y archivados en CONTEXT.md §Deferred:
- HUD focus styles era-themed → Phase 2 (A11Y-03)
- Scroll progress indicator separado de la timeline → no duplicar
- Snap mid-chapter scroll positions → no en v1
- Deep-link enriquecido con URL hash `#ch-N` → v2 (DLINK-01/02)
