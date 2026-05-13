---
phase: 1
plan: 1
subsystem: toolchain
slug: toolchain-setup
wave: 0
tags: [toolchain, vitest, vueuse, vite, scaffold]
dependency_graph:
  requires: []
  provides:
    - "@vueuse/core@14.3.0 disponible para usePreferredReducedMotion / useResizeObserver / useRafFn"
    - "Harness Vitest + jsdom + @vue/test-utils listo (mocks globales en tests/setup.js)"
    - "Vite dev server expuesto en LAN (host: true) para iOS smoke test del Plan 07"
    - "Scaffolds src/composables/ y src/components/ trackeados con .gitkeep"
  affects:
    - "Todos los plans subsecuentes W1..W6 dependen de este toolchain"
tech_stack:
  added:
    - "@vueuse/core@14.3.0 (runtime dep)"
    - "vitest@4.1.6 (devDep)"
    - "@vue/test-utils@2.4.10 (devDep)"
    - "jsdom@29.1.1 (devDep)"
  patterns:
    - "Vitest config separado (vitest.config.js) — NO mezclado con vite.config.js"
    - "JSDOM mocks de IntersectionObserver/ResizeObserver con instances array + triggerEntries/triggerResize helpers"
    - "Dev server LAN-exposed (host: true, open: false) para smoke test mobile sin tunnel"
key_files:
  created:
    - vitest.config.js
    - tests/setup.js
    - tests/smoke.test.js
    - src/composables/.gitkeep
    - src/components/.gitkeep
  modified:
    - package.json
    - package-lock.json
    - vite.config.js
decisions:
  - "Vitest 4.1.6 (latest) en lugar de pinear a una versión específica — Vue 3.5 + Vite 5.4 compatible verificado en CI install"
  - "jsdom 29.1.1 (latest) — provee ResizeObserver básico que el setup.js sobrescribe; provee IntersectionObserver=undefined que el setup.js polyfilla"
  - "tests/setup.js exporta los stubs como globalThis.MockIntersectionObserver además de globalThis.IntersectionObserver para que los tests puedan resetear el array de instances entre cases"
  - "requestAnimationFrame implementado como setTimeout(16ms) wrapped para ser compatible con vi.useFakeTimers() en los tests RAF del Plan 05"
metrics:
  duration_seconds: 480
  duration_iso: "PT8M"
  completed_at: "2026-05-13T02:35:00Z"
  tasks_completed: 5
  files_changed: 7
---

# Phase 1 Plan 01: toolchain-setup Summary

JWT auth para… no, espera — sin JWT aquí: **Toolchain Wave 0 listo: Vue manifest sincronizado con 3.5.34 instalado, `@vueuse/core@14.3.0` añadido sin warnings de peer dep, harness Vitest+jsdom funcional con mocks globales (IO/RO/matchMedia/RAF), y Vite dev server expuesto en LAN (`host: true`) para el smoke test iOS del Plan 07.**

## Executed Tasks

| Task | Name | Outcome | Files |
|------|------|---------|-------|
| 1.1 | Bump manifest Vue ^3.5.0 + install @vueuse/core | PASS — `npm list` sin warnings de peer | package.json, package-lock.json |
| 1.2 | Install Vitest + @vue/test-utils + jsdom + scripts | PASS — `npx vitest --version` → 4.1.6 | package.json |
| 1.3 | vitest.config.js + tests/setup.js + tests/smoke.test.js | PASS — 3/3 tests green | vitest.config.js, tests/setup.js, tests/smoke.test.js |
| 1.4 | Scaffold src/composables, src/components + Vite LAN | PASS — .gitkeep creados, host: true aplicado | src/composables/.gitkeep, src/components/.gitkeep, vite.config.js |
| 1.5 | Smoke E2E (`npm test:run` + `npm run dev`) | PASS — tests verde, Vite arranca con Network IP | (verificación) |

## Acceptance Criteria Results

| Criterion | Result |
|-----------|--------|
| `package.json` declara `vue ^3.5.0` y `@vueuse/core ^14.3.0` en dependencies | ✅ PASS |
| `vitest`, `@vue/test-utils`, `jsdom` en devDependencies | ✅ PASS |
| Scripts `test` y `test:run` presentes | ✅ PASS |
| `vitest.config.js` con jsdom environment + plugin vue + setupFiles | ✅ PASS |
| `tests/setup.js` mockea IntersectionObserver, ResizeObserver, matchMedia, RAF | ✅ PASS |
| `tests/smoke.test.js` pasa | ✅ PASS (3 assertions: smoke, jsdom env, global mocks installed) |
| `src/composables/` y `src/components/` existen (con .gitkeep) | ✅ PASS |
| `vite.config.js` declara `host: true` y `open: false`, port 5173 sin cambios | ✅ PASS |
| `npm run test:run` exit 0 | ✅ PASS — 1 test file, 3 tests passed, 1.71s duration |
| `npm run dev` arranca sin errores y expone LAN | ✅ PASS — `Network: http://192.168.18.40:<port>/` impresso |

## Versions Installed (Final)

| Package | Manifest | Resolved | Notes |
|---------|----------|----------|-------|
| vue | `^3.5.0` | 3.5.34 | Sin reinstall — ya estaba en node_modules; solo manifest sincronizado |
| @vueuse/core | `^14.3.0` | 14.3.0 | Peer `vue: ^3.5.0` satisfecho. Cero warnings. |
| vitest | `^4.1.6` | 4.1.6 | Latest stable. Compatible con Vue 3.5 + Vite 5.4 verificado en install. |
| @vue/test-utils | `^2.4.10` | 2.4.10 | Latest stable para Vue 3 |
| jsdom | `^29.1.1` | 29.1.1 | Latest stable |
| @vitejs/plugin-vue | `^5.0.0` | 5.2.4 | Sin tocar — ya presente |
| vite | `^5.4.0` | 5.4.21 | Sin tocar — ya presente |

## LAN Network IP for iOS Smoke Test

Al ejecutar `npm run dev`, Vite imprimió:

```
Local:   http://localhost:5174/
Network: http://192.168.18.40:5174/
```

**Para Rafael (iPhone):** abrir `http://192.168.18.40:5173/` (o el puerto que Vite anuncie — ver nota abajo) desde Safari estando en la misma WiFi.

### Observación: puerto 5173 ocupado durante la verificación

Durante el Task 1.5, el puerto 5173 estaba ocupado por un proceso `node.exe` externo (PID 21112) — probablemente un Vite dev server orfán de una sesión previa de Rafael. Vite automáticamente saltó al **5174** y arrancó OK con LAN expuesta. **Esto no es un bug del Plan 01** — el cambio `host: true + port: 5173` está correcto en `vite.config.js`. Rafael debería:
- Cerrar cualquier `npm run dev` previo antes de arrancar uno nuevo (Ctrl+C en su terminal, o `taskkill /PID <pid>`), o
- Aceptar que Vite use 5174 si 5173 está ocupado — ambos son LAN-accesibles vía `host: true`.

No bloquea el Plan 02. Documentado para evitar que la IA del Plan 07 (iOS smoke test) reporte esto como bug nuevo.

### Windows Defender firewall prompt

No vi prompt UAC durante este executor porque el puerto 5173 ya tenía una regla aceptada por una sesión previa (el proceso orfán). Rafael debería verificar manualmente al cerrar el orfán y relanzar `npm run dev` que el firewall acepta o que ya hay regla. RESEARCH §Pitfall 7 documenta el comando `New-NetFirewallRule` si hay que crearla manualmente.

## Deviations from Plan

**Ninguna desviación del plan.** Las versiones instaladas (vitest@4.1.6 en vez de un pin más bajo) son el resultado natural de `npm install --save-dev vitest` resolviendo a latest. El RESEARCH no pinneó versión específica de Vitest; el plan solo dice "vitest" sin caret. Todas las API que los Plans 02-06 usarán (`describe`, `it`, `expect`, `vi.fn`, `vi.useFakeTimers`, `mount` de @vue/test-utils) son estables y compatibles entre Vitest 1.x..4.x.

## Anti-Scope Compliance

Verificado: NO se crearon `ScrollShell.vue`, `useScrollState.js`, `usePRM.js`, `StickyAvatar.vue`, `StickyTimeline.vue`, ni `SkipLink.vue`. `App.vue` queda intacto con el placeholder original. NO se instaló Pinia, Vue Router, GSAP, Lenis, Locomotive. NO se modificaron `.planning/`, `public/assets/`, ni `.claude/`.

## Self-Check: PASSED

Verificación final post-write:

- `vitest.config.js` existe ✅
- `tests/setup.js` existe ✅
- `tests/smoke.test.js` existe ✅
- `src/composables/.gitkeep` existe ✅
- `src/components/.gitkeep` existe ✅
- `package.json` contiene `"@vueuse/core"` y `"vue": "^3.5.0"` ✅
- `vite.config.js` contiene `host: true` ✅
- `npm run test:run` exit 0 (3 tests pass) ✅
- `npm run dev` arranca, imprime Network IP ✅
- Working tree limpio antes (M de archivos esperados, ?? de archivos nuevos esperados) — confirmado vía `git status --short` ✅

## Next Step

**Wave 1 — Plan 02: walking-skeleton.** Crear `ScrollShell.vue` + 7 `ChapterSection` stubs + snap vertical + `useScrollState.js` con `watch(shellRef, {immediate, flush:'post'})` + deep-link `?ch=N` + landing default en ch3. RESEARCH §Área 2 + UI-SPEC §1 son la guía técnica. El test harness instalado aquí soporta directamente los tests específicos de ese plan (`tests/composables/useScrollState.test.js`, `tests/components/ScrollShell.test.js`).
