---
name: feedback-verify-before-suggest
description: "Siempre verifica antes de sugerir o asumir. Si un usuario reporta un bug visual y mis cambios \"deberían funcionar\", el primer paso es pedir errores de consola / inspeccionar DOM real, NO asumir cache stale."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9a5481d6-f212-419c-a94b-ed42833543b3
---

Antes de sugerir "hard reload", "clear cache", "restart server" o cualquier intervención de entorno, **verifica primero** qué está pasando realmente: pedí console errors, DOM state, screenshots, o leé el output del dev server. No asumas que el código está bien y que es problema de cache.

**Why:** En la sesión 2026-05-13 reescribí `StickyTimeline.vue` (Phase 2 redesign vertical-left). El usuario no veía el cambio en browser; le sugerí Ctrl+Shift+R + incognito sin pedirle primero los console errors. Resultó que había un `TypeError: Cannot set properties of null` real en App.vue:87 (function ref inline creando loop infinito con useScrollState + useBackgroundMorph watchers) que mi rewrite destapó. El user se frustró porque iteré varias veces sin tocar la causa raíz.

**How to apply:**
- Cuando un usuario reporta "no veo el cambio" o "está roto en mi browser":
  1. **PRIMERO** pedí console errors (F12 → Console tab), state del DOM (Elements tab + search), o leé el output del dev server.
  2. **SOLO DESPUÉS** considera cache/HMR/reload como hipótesis secundaria.
- Si el código está committed y los tests pasan, eso NO descarta que haya un bug runtime que los tests no cubren (function refs reactivos, infinite loops en watchers, etc).
- Tests unitarios montan componentes aislados con mocks. NO ejercitan la integración real App.vue + composables + watchers reactivos cruzados. Una suite verde no significa que la app corra.
