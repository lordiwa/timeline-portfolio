---
phase: 1
plan: 3
slug: usePRM-composable
wave: 2
type: execute
mode: mvp
autonomous: true
gap_closure: false
requirements_covered: [CORE-09, A11Y-05]
depends_on: [1, 2]
files_modified:
  - src/composables/usePRM.js
  - src/App.vue
  - tests/composables/usePRM.test.js
must_haves:
  truths:
    - "usePRM composable expone prefersReduced (ref<boolean> readonly o computed) reactivo a matchMedia"
    - "usePRM se provee globalmente en App.vue via provide('prm', ...)"
    - "Toggle del OS reducedMotion mientras la página está cargada hace que prefersReduced.value cambie reactivamente (sin recarga)"
    - "El CSS-side branch (@media prefers-reduced-motion: reduce) y el JS-side composable convergen: ambos paths llevan al mismo comportamiento bajo PRM (D-01)"
  artifacts:
    - path: src/composables/usePRM.js
      provides: "Composable que wrapea @vueuse/core usePreferredReducedMotion en una API limpia { prefersReduced, motion }"
      exports: ["usePRM"]
    - path: tests/composables/usePRM.test.js
      provides: "Tests verificando que prefersReduced.value === true cuando matchMedia('(prefers-reduced-motion: reduce)').matches === true"
    - path: src/App.vue
      provides: "Provide global prm via provide('prm', usePRM())"
      contains: "provide('prm'"
  key_links:
    - from: src/App.vue
      to: src/composables/usePRM.js
      via: "import { usePRM } + provide('prm', usePRM())"
      pattern: "usePRM"
    - from: src/composables/usePRM.js
      to: "@vueuse/core"
      via: "import { usePreferredReducedMotion }"
      pattern: "usePreferredReducedMotion"
---

<objective>
Introducir el **single source of truth** para `prefers-reduced-motion` en el proyecto. El composable `usePRM` wrapea `usePreferredReducedMotion` de @vueuse/core en una API mínima `{ prefersReduced, motion }`. Se provee globalmente en App.vue para que cualquier descendiente (StickyAvatar en Plan 04, StickyTimeline en Plan 05, ScrollShell keyboard handlers en Plan 05) lo inyecte sin prop drilling.

**Purpose:** UI-SPEC §8 lo dicta explícitamente: "El composable `usePRM` es el único punto de lectura — no duplicar `matchMedia` en múltiples componentes". Centralizar ahora previene divergencia y bugs sutiles más adelante. Cubre CORE-09 (PRM respetado global) y A11Y-05 (PRM en transiciones).

**Output:**
- `src/composables/usePRM.js` — wrap mínimo sobre vueuse.
- Tests unitarios verificando el binding con matchMedia mock.
- `src/App.vue` actualizado: `provide('prm', usePRM())` añadido junto al `provide('scrollState', ...)` existente.

**Lo que ESTE plan NO hace** (viene en plans posteriores):
- NO modifica el behavior de scrollToChapter para usar PRM — eso es Plan 05 (cuando se cablea keyboard nav y tick click).
- NO modifica el avatar swap behavior — eso es Plan 04.
- Solo cablea el conduit. Los consumers vienen después.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-PLAN.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-UI-SPEC.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-RESEARCH.md
@.planning/phases/01-scroll-shell-sticky-anchors/01-CONTEXT.md
@src/App.vue
@src/composables/useScrollState.js

<interfaces>
<!-- API objetivo (RESEARCH §6 — Composable usePRM): -->
```javascript
// src/composables/usePRM.js
import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

export function usePRM() {
  const motion = usePreferredReducedMotion()  // ref<'reduce' | 'no-preference'>
  const prefersReduced = computed(() => motion.value === 'reduce')  // computed<boolean>
  return { motion, prefersReduced }
}
```

<!-- Provide/inject signature (UI-SPEC §8): -->
```javascript
// En App.vue
provide('prm', usePRM())

// En cualquier descendiente
const { prefersReduced } = inject('prm')
// uso:
const behavior = prefersReduced.value ? 'auto' : 'smooth'
```

<!-- vueuse API verified (RESEARCH §Área 5): -->
`usePreferredReducedMotion()` returns a `Ref<'reduce' | 'no-preference'>` reactive a `window.matchMedia('(prefers-reduced-motion: reduce)')`. Internamente añade/remueve listeners con cleanup automático en unmount.
</interfaces>

<key-decisions>
- API mínima: dos refs/computed expuestos, nada más. NO añadir helpers tipo `withPRM(fn)` o `prmBehavior()` — son anti-patterns hasta tener 3+ consumers que justifiquen extraer.
- `prefersReduced` es `computed` (no `ref`) porque deriva de `motion`. Computed es la primitiva correcta para valores derivados en Vue 3.
- D-01: el CSS branch `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto }` ya está en App.vue (Plan 02). Este Plan 03 NO toca CSS — solo cablea JS para `scrollTo({behavior})` programáticos que vendrán en Plan 05.
- D-06 (principio rector): documentado en UI-SPEC §8. Este composable es la base para implementar el resto de la política PRM en plans posteriores.
- **Test 5 ELIMINADO (MEDIUM 2):** El test original asertaba "prefersReduced.value = false debe ser no-op o throw". Pero `computed()` sin setter NO throw — emite un warning en dev mode via Vue's internal warner. Verificar el warning vía `consoleWarnSpy` con un string específico es testear Vue framework code, no nuestro composable. Más simple: confiar en que Vue handles this correctly. Si en el futuro se quiere defensive testing, hacer `expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('readonly'))` con setup explícito del spy. Pero para Phase 1 lo eliminamos.
</key-decisions>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 3.1: Crear usePRM composable con tests</name>
  <files>src/composables/usePRM.js, tests/composables/usePRM.test.js</files>
  <behavior>
    - Test 1: Importado sin error, exporta función `usePRM`.
    - Test 2: Mock matchMedia con `matches: false` (no PRM): `usePRM()` retorna `{ motion, prefersReduced }`; `motion.value === 'no-preference'`; `prefersReduced.value === false`.
    - Test 3: Mock matchMedia con `matches: true` (PRM activo): `motion.value === 'reduce'`; `prefersReduced.value === true`.
    - Test 4: Reactivity: cambiar el mock matchMedia para disparar el listener "change" con `matches: true` → tras `await nextTick()`, `prefersReduced.value === true` (verifica que vueuse propaga el cambio reactivamente).

    **Test 5 ELIMINADO (MEDIUM 2):** El test original "prefersReduced.value = false debe ser no-op o throw" es ambiguo: `computed()` sin setter NO throw, solo emite warning. Verificar el warning sería testear Vue framework interno, no nuestro código. Confiamos en `computed()` de Vue para handle write-attempts correctly. Total: 4 tests (no 5).
  </behavior>
  <action>
    Escribir `tests/composables/usePRM.test.js` con los 4 tests (sin el Test 5 ambiguo eliminado). Mockear `window.matchMedia` por test reemplazando la implementación global del setup (tests/setup.js ya mockea matchMedia básico — aquí queremos control fino por test). Para Test 4, simular el "change" listener registrado por vueuse: capturar la callback registrada via `mediaQueryList.addEventListener('change', cb)`, después invocarla manualmente con `{ matches: true, media: '(prefers-reduced-motion: reduce)' }`.

    Después implementar `src/composables/usePRM.js` con el código exacto del bloque `<interfaces>` arriba. Importar `computed` de `vue` y `usePreferredReducedMotion` de `@vueuse/core`. Export named `{ usePRM }`. Sin lifecycle hooks (vueuse maneja cleanup automáticamente).

    Iterar hasta que los 4 tests pasen.
  </action>
  <verify>
    <automated>`npx vitest run tests/composables/usePRM.test.js`. Exit 0, 4 tests passed.</automated>
  </verify>
  <done>
    `src/composables/usePRM.js` existe. Los 4 tests pasan (Test 5 eliminado por ambigüedad — MEDIUM 2 fix). `prefersReduced` es reactivo, computed, readonly desde el consumer's perspective.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3.2: Cablear usePRM en App.vue con provide('prm', ...)</name>
  <files>src/App.vue</files>
  <action>
    Editar `src/App.vue` (creado en Plan 02). Añadir:
    - `import { usePRM } from './composables/usePRM'` junto a los imports existentes.
    - `const prm = usePRM()` después del `const scrollState = useScrollState(shellRef)`.
    - `provide('prm', prm)` después del `provide('scrollState', scrollState)`.

    NO añadir nada al `<template>` ni al `<style>` — el composable es puramente JS y los consumers (StickyAvatar/StickyTimeline) inyectan en plans posteriores.

    Mantener la estructura existente intacta (CSS Custom Properties, PRM CSS-side branch, ScrollShell mount).
  </action>
  <verify>
    <automated>`node -e "const fs = require('fs'); const app = fs.readFileSync('./src/App.vue', 'utf8'); if (!app.includes('usePRM')) process.exit(1); if (!app.includes(\"provide('prm'\")) process.exit(1); console.log('OK App.vue PRM wired')"`. Plus: `npx vitest run` — suite completa debe seguir pasando.</automated>
  </verify>
  <done>
    `src/App.vue` importa `usePRM`, instancia `prm`, y llama `provide('prm', prm)`. La suite Vitest completa sigue pasando (sin regresiones del Plan 02).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 3.3: Smoke test manual del PRM CSS branch</name>
  <files>(verificación, ninguno modificado)</files>
  <action>
    Ejecutar `npm run dev`. Abrir `http://localhost:5173/` en el browser local.

    **En Windows 11:** Settings → Accessibility → Visual effects → toggle OFF "Animation effects". Volver a la página y recargar. Hacer scroll: ahora el snap entre chapters es **instantáneo (jump)** en lugar de smooth. Esto verifica D-01 del CSS-side branch `@media (prefers-reduced-motion: reduce) { scroll-behavior: auto }`.

    **Alternativa si Windows no expone toggle accesible:** DevTools → Chrome DevTools → Cmd/Ctrl+Shift+P → "Emulate CSS prefers-reduced-motion: reduce". Recargar. Mismo verification: snap instantáneo.

    Restaurar el toggle al estado normal después de verificar.

    NOTA: este plan solo verifica el branch CSS-side. El JS-side branch (D-04 click-to-nav instantáneo) se verifica en Plan 05 cuando los ticks de la timeline existen.

    Cualquier falla → revisar que App.vue (Plan 02) declara el `@media` query correctamente. Si todo funciona, el composable está cableado correctamente para los plans 04 y 05.
  </action>
  <verify>
    <automated>`npx vitest run`. Suite entera passing.</automated>
  </verify>
  <done>
    El CSS-side PRM branch funciona (snap instantáneo bajo PRM activo). El composable `usePRM` está provided globalmente. Plans 04 y 05 pueden inject('prm') con confianza.
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, todos los tests passing (incluyendo los 4 de usePRM — Test 5 eliminado por ambigüedad).

**Manual:**
1. Activar PRM en el OS o en Chrome DevTools.
2. Recargar `http://localhost:5173/`.
3. Hacer scroll → snap es instantáneo (jump) en lugar de smooth.
4. Restaurar PRM al estado normal.
</verification>

<success_criteria>
- [ ] `src/composables/usePRM.js` exporta `usePRM` siguiendo la API contractual.
- [ ] 4 tests de `usePRM` passing (Test 5 eliminado por ambigüedad — MEDIUM 2 fix).
- [ ] `App.vue` `provide('prm', usePRM())` cableado.
- [ ] Smoke test manual: PRM activo → snap instantáneo (verifica el CSS branch ya en App.vue).
- [ ] Suite Vitest completa sin regresiones.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-03-SUMMARY.md` documentando:
- Confirmación del smoke test PRM (snap instantáneo bajo PRM).
- Que `prefersReduced` está disponible vía `inject('prm')` para consumers en plans 04 y 05.
- Cualquier ajuste necesario al composable vs el código de RESEARCH §6 (no debería haber).
- Nota: Test 5 (readonly computed assertion) fue eliminado por ambigüedad — Vue's computed sin setter emite warning, no throw; confiamos en el framework.
</output>
