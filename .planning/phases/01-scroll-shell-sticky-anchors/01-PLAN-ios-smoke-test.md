---
phase: 1
plan: 7
slug: ios-smoke-test
wave: 6
type: execute
mode: mvp
autonomous: false
gap_closure: false
requirements_covered: [iOS-01, iOS-02, MOB-01]
depends_on: [1, 2, 3, 4, 5, 6]
files_modified:
  - .planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md
  - src/App.vue
must_haves:
  truths:
    - "Rafael (o un fallback BrowserStack) ejecuta la checklist iOS de 10 items en un iPhone/iPad real con iOS Safari"
    - "El resultado de cada item está documentado en 01-EXECUTION-LOG.md con PASS / FAIL + nota"
    - "Si cualquier item falla, la mitigación correspondiente está aplicada (env(safe-area-inset-bottom) ya está desde Plan 05 — Plan 07 solo verifica que funcionó; doble-RAF reforzado para ítem 1 si aplica, etc.) y el ítem se re-corre hasta PASS"
    - "Una línea de resultado se añade a .planning/STATE.md bajo Blockers/Concerns: 'iOS-02: PASS YYYY-MM-DD on iPhone <model> iOS <version>' o equivalente"
  artifacts:
    - path: .planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md
      provides: "Log de la ejecución del smoke test: 10 items con resultado, dispositivo, versión iOS, screenshots si hubo anomalía"
      contains: "iPhone"
    - path: src/App.vue
      provides: "(condicional) si el smoke test reveló snap cache invalidation, añadir un trigger de reflow defensive post-mount"
  key_links:
    - from: .planning/STATE.md
      to: .planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md
      via: "una línea de resumen en Blockers/Concerns indicando PASS / FAIL"
      pattern: "iOS-02"
---

<objective>
Cerrar Phase 1 con el smoke test confirmatorio en hardware iOS real. NO es gate bloqueante per requirements (iOS-02 reframed post-pivote — el WebKit bug #243582 era horizontal, no aplica a vertical), pero es el último verifier antes de pasar a Phase 2. Cualquier anomalía descubierta se mitiga dentro de este plan.

**Purpose:** Cubre iOS-02 (smoke test confirmatorio) y completa la confianza en iOS-01 (CSS stack base) y MOB-01 (portrait + landscape). El protocolo está definido en RESEARCH §Open-Q-B con un checklist de 10 ítems específicos.

**Cambio importante (HIGH 4):** `env(safe-area-inset-bottom, 0)` ya está aplicado en `src/components/StickyTimeline.vue` desde Plan 05 (preventivo, fallback graceful a 0). Plan 07 ya NO necesita aplicar esa mitigación post-FAIL — solo VERIFICA que la cosa funcionó como esperado. Esto elimina un re-test loop potencial.

**Output:**
- `01-EXECUTION-LOG.md` con los 10 items documentados.
- Una línea de resumen en STATE.md.
- (Condicional) Mitigaciones aplicadas si el smoke test reveló issues NO previstos.

**Lo que ESTE plan NO hace:**
- NO añade features nuevas.
- NO modifica el comportamiento desktop (que ya pasó UI-SPEC §12).
- NO bloquea el inicio de Phase 2 si algún ítem es WARNING o FAIL aceptado (per iOS-02 no-bloqueante policy).
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
@.planning/STATE.md
@vite.config.js

<interfaces>
<!-- Checklist exacto (RESEARCH §Open-Q-B, 10 items): -->

1. Carga `http://<IP-LAN>:5173/?ch=3` — aterriza directamente en ch3 (default).
2. Swipe vertical hacia abajo — snappea a ch4 limpiamente (no skipping a último).
3. Swipe vertical hacia arriba — snappea a ch2 limpiamente.
4. Flick rápido — `scroll-snap-stop: always` impide skip de 2 chapters; máximo 1 por gesto.
5. **StickyTimeline (bottom) visible y NO se solapa con la Safari toolbar dinámica.** `env(safe-area-inset-bottom, 0)` ya está en place desde Plan 05 — este ítem solo verifica que la mitigación preventiva funcionó. Si falla por otra razón (ej. browser zoom, viewport meta missing), investigar antes de cambiar el CSS.
6. StickyAvatar (top-left) visible durante todo el scroll, swap entre ch3↔ch4 inmediato visible.
7. Click en tick `2009` — navega smooth a ch2.
8. Rotar a landscape — layout funcional, sticky elements en posición, snap sigue funcionando.
9. Rotar a portrait — mismo check.
10. Activar Settings → Accessibility → Motion → Reduce Motion. Recargar. Confirmar que el click en un tick es jump instantáneo (D-04).

<!-- Hardware setup (RESEARCH §Open-Q-B): -->
- Hardware: iPhone propio de Rafael (preferido). Fallback: BrowserStack si no aplica.
- Acceso desde mobile: `vite.config.js` ya tiene `host: true` desde Plan 01 → Vite imprime `Network: http://<IP-LAN>:5173/` al arrancar.
- Discovery de IP: PowerShell `ipconfig | Select-String "IPv4"` → buscar la línea del adaptador WiFi activo (NO Ethernet si la PC está cableada y el iPhone está en WiFi del mismo router).
- Firewall: el primer `npm run dev` con `host: true` (ya hecho en Plan 01) debería haber disparado el prompt UAC de Windows Defender → aceptar "Private networks". Si no apareció, regla manual documentada en RESEARCH §Área 8.

<!-- VERIFICACIÓN del ítem 5 (no mitigación — HIGH 4 fix): -->
El CSS de StickyTimeline.vue (Plan 05) ya incluye `bottom: env(safe-area-inset-bottom, 0)`. En browsers sin notch (Chrome desktop, FF, Safari macOS desktop) evalúa a 0; en iPhone con notch evalúa al inset real. **NO requiere acción de Plan 07 si el ítem 5 pasa.**

Si el ítem 5 falla a pesar del env() pre-aplicado, investigar (no aplicar mitigación a ciegas):
- ¿El viewport meta está correcto? En `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. El `viewport-fit=cover` es REQUISITO para que `env(safe-area-inset-*)` retorne valores no-cero en iOS Safari. **VERIFICAR en Task 7.1 antes de comenzar el smoke test:** si `viewport-fit=cover` no está en el meta tag, añadirlo a `index.html` antes del smoke test (esto es trivial y debería estar desde Plan 01 — si no está, lo añadimos aquí como pre-condition).
- ¿Hay algún padding/margin externo del `<body>` o `#app` que esté creando overflow?
- Si el problema es de naturaleza completamente distinta, surface al usuario antes de cambiar código.

<!-- Mitigación condicional para ítem 1 (race condition con snap layout en iOS): -->
Si el ítem 1 falla intermitentemente (carga con `?ch=3` aterriza en ch0 a veces en iOS), aumentar la defensa en `src/composables/useScrollState.js`:

Cambiar el doble RAF actual a un triple RAF o añadir `setTimeout(fn, 0)` como capa extra antes del `scrollIntoView`. Documentar el cambio. NOTA: con el fix de Plan 02 (setup vía watch+flush:'post' en lugar de onMounted), este problema es menos probable — pero si ocurre en iOS específicamente por timing diferente del rendering pipeline, esta es la mitigación.

<!-- Documentación del resultado: -->
Crear/editar `.planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md` con la siguiente estructura:

```markdown
# Phase 1 — Execution Log

## iOS Smoke Test (Plan 07)

**Date:** YYYY-MM-DD
**Hardware:** iPhone <model> · iOS <version> · Safari <version>
**Network:** http://<IP-LAN>:5173/
**Tester:** Rafael
**Result:** PASS / PARTIAL / FAIL (overall verdict)

### Pre-conditions verified

- [ ] `index.html` tiene `viewport-fit=cover` en meta viewport (REQUISITO para env(safe-area-inset-*) en iOS).
- [ ] `src/components/StickyTimeline.vue` declara `bottom: env(safe-area-inset-bottom, 0)` (aplicado preventivamente en Plan 05).

### Checklist 10/10

| # | Item | Result | Notes |
|---|------|--------|-------|
| 1 | Carga `/?ch=3` aterriza en ch3 | PASS / FAIL | (notas + screenshot si FAIL) |
| 2 | Swipe down snap a ch4 | PASS / FAIL | |
| 3 | Swipe up snap a ch2 | PASS / FAIL | |
| 4 | Flick rápido respeta snap-stop: always (max 1 chapter por gesto) | PASS / FAIL | |
| 5 | Timeline visible sin overlap con Safari toolbar (env preventivo desde Plan 05) | PASS / FAIL | (si FAIL: investigar — env() ya aplicado) |
| 6 | Avatar visible + swap inmediato | PASS / FAIL | |
| 7 | Click en tick `2009` → snap a ch2 | PASS / FAIL | |
| 8 | Rotar a landscape — layout funcional | PASS / FAIL | |
| 9 | Rotar a portrait — layout funcional | PASS / FAIL | |
| 10 | Reduce Motion ON → click en tick instantáneo (D-04) | PASS / FAIL | |

### Mitigations Applied

(Si alguno falló, listar aquí los cambios hechos al código y el re-run result.)

### Conclusion

(Una frase. Ej: "iOS-02 PASS — Phase 1 cleared for /gsd-verify-work 1." o "iOS-02 PARTIAL — ítem 5 mitigado con env(); todos los demás PASS.")
```
</interfaces>

<key-decisions>
- Este plan es **autonomous: false** (checkpoint:human-verify) porque la ejecución del smoke test requiere un humano con un iPhone físico. Claude NO puede ejecutar los ítems 1-10 directamente — solo puede preparar el contexto, documentar el resultado, y aplicar mitigaciones condicionales.
- Si Rafael NO tiene iPhone disponible: fallback documentado en RESEARCH §Open-Q-B = BrowserStack o diferir iOS-02 (es no-bloqueante per requirements). El checkpoint task abajo explicita este branch.
- **HIGH 4 — env(safe-area-inset-bottom) preventivo desde Plan 05:** El CSS de StickyTimeline ya incluye la mitigación desde day 1 (graceful fallback a 0 en browsers sin notch). Plan 07 ya NO la aplica post-FAIL — solo verifica que funcionó. Si el ítem 5 falla aun así, primero verificar `viewport-fit=cover` en index.html (pre-condición); después investigar otras causas (zoom, padding externo); NO modificar StickyTimeline CSS sin diagnosis.
- Otras mitigaciones (triple RAF para ítem 1, debug para ítem 4, etc.) siguen siendo CONDICIONALES — solo se aplican si el smoke test las requiere.
- Resultado del smoke test debe loguearse en `01-EXECUTION-LOG.md` con timestamp + device + iOS version + checklist results. Sin video; screenshots solo si hubo anomalía (RESEARCH §Open-Q-B documenta este nivel de detalle).
- Una línea de resumen en `.planning/STATE.md` bajo "Blockers/Concerns" — convertir el bullet de "iOS smoke test (Phase 1)" en "iOS-02: PASS YYYY-MM-DD" (o equivalente FAIL/PARTIAL).
</key-decisions>
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 7.1: Preparar el entorno LAN + verificar viewport-fit=cover para acceso desde iPhone</name>
  <what-built>Vite dev server ya configurado con `host: true` desde Plan 01. La IP LAN debería estar disponible al ejecutar `npm run dev`. CSS preventivo de safe-area-inset-bottom ya en place desde Plan 05.</what-built>
  <how-to-verify>
    **Pre-condition A — viewport meta:**

    Leer `index.html`. Buscar la línea `<meta name="viewport" ...>`. Debe incluir `viewport-fit=cover`:
    ```html
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    ```
    Si NO incluye `viewport-fit=cover`, añadirlo ANTES de comenzar el smoke test. Sin esto, `env(safe-area-inset-bottom)` retorna 0 en iOS Safari y el ítem 5 podría fallar incluso con el CSS de Plan 05 en place.

    **Pre-condition B — env() en StickyTimeline:**

    Verificar que `src/components/StickyTimeline.vue` (Plan 05) declara:
    ```css
    .sticky-timeline {
      ...
      bottom: env(safe-area-inset-bottom, 0);
      ...
    }
    ```
    Si NO está, hay un drift entre Plan 05 plan y Plan 05 impl. Detener — el smoke test no es válido hasta que esto esté correcto.

    **LAN setup:**

    1. **En PowerShell, desde el working directory:**
       ```powershell
       npm run dev
       ```
       Esperar a que Vite imprima ambas líneas:
       ```
       Local:   http://localhost:5173/
       Network: http://<IP-LAN>:5173/
       ```
       (La IP LAN será algo como `192.168.1.42:5173` o similar.)

    2. **Si NO aparece la línea `Network:`** → revisar `vite.config.js`: debe tener `host: true` (NO `'127.0.0.1'`). Si está mal, el Plan 01 no se completó correctamente — corregir antes de continuar.

    3. **Confirmar la IP del adaptador WiFi:**
       ```powershell
       ipconfig | Select-String "IPv4"
       ```
       Comparar con la IP que Vite imprimió. Deben coincidir (Vite a veces lista varias interfaces; usar la del WiFi activo).

    4. **Aceptar el prompt UAC de Windows Defender** si aparece — autorizar Node.js en "Private networks". Si ya se aceptó antes (Plan 01 lo cubrió), no aparecerá.

    5. **Asegurar que el iPhone está en la misma WiFi que la PC.** Si la red WiFi tiene "Client isolation" activado (común en algunas redes corporativas/cafés), considerar usar Personal Hotspot del propio iPhone hacia la PC + Probar desde el iPhone Safari hacia la IP de la PC.

    6. **Confirmar acceso desde iPhone Safari:** abrir `http://<IP-LAN>:5173/` en Safari del iPhone. Debería cargar el portfolio con landing en ch3.

       Si NO carga:
       - Verificar firewall: `New-NetFirewallRule -DisplayName "Vite Dev Server 5173" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Private` (PowerShell as Admin).
       - Alternativa: usar Personal Hotspot.

    Confirmar que el portfolio carga en el iPhone Safari con landing en ch3 (chapter 3, era title "2013 · Web 2.0" visible) Y que las pre-conditions A y B están verificadas.
  </how-to-verify>
  <resume-signal>Confirmar "iPhone accede OK + viewport-fit=cover + env() en place" o describir el bloqueo (firewall, IP, red, viewport meta missing, etc.) para mitigar.</resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 7.2: Ejecutar la checklist iOS de 10 ítems</name>
  <what-built>Phase 1 completa funcionalmente (plans 01-06). El iPhone debe poder reproducir todos los comportamientos visibles del UI-SPEC §12.</what-built>
  <how-to-verify>
    Con el portfolio cargado en iPhone Safari (Task 7.1 confirmado), ejecutar los 10 ítems del checklist en orden:

    **Ítem 1:** Cerrar el tab. Abrir un tab nuevo con `http://<IP-LAN>:5173/?ch=3`. Verificar que aterriza directamente en chapter 3 (era title "2013 · Web 2.0" centrado). PASS / FAIL.

    **Ítem 2:** Swipe vertical hacia abajo (con un dedo). Verificar que snappea limpiamente a chapter 4 ("2015 · AR/VR"), sin saltarse chapters intermedios ni quedarse a medias. PASS / FAIL.

    **Ítem 3:** Swipe vertical hacia arriba. Verificar snap a chapter 2 ("2009 · Flash"). PASS / FAIL.

    **Ítem 4:** Hacer un flick rápido (swipe con momentum alto). Verificar que `scroll-snap-stop: always` impide skip de 2 chapters — máximo avanza 1 chapter por gesto. PASS / FAIL.

    **Ítem 5:** Mirar la timeline en el bottom. Verificar que la timeline ES visible y NO se solapa con la Safari toolbar dinámica (que aparece/desaparece al scrollear). Probar con la toolbar expandida (al cargar) y contraída (después de varios scrolls). **`env(safe-area-inset-bottom, 0)` ya está en el CSS desde Plan 05 — este ítem debería pasar directamente.** Si falla, ir a Task 7.3 para investigar (no aplicar la misma mitigación dos veces). PASS / FAIL.

    **Ítem 6:** Mirar el avatar en top-left. Verificar que es visible durante todo el scroll. Hacer swipe de ch3 → ch4 → confirmar que el texto del avatar muta de `ch3` a `ch4` con el crossfade visible (≈200ms total). PASS / FAIL.

    **Ítem 7:** Tocar el tick `2009` en la timeline. Verificar que el scroll snappea smooth a chapter 2 ("2009 · Flash"). PASS / FAIL.

    **Ítem 8:** Rotar el iPhone a landscape. Verificar que el layout sigue funcional: scroll vertical sigue snappeando, avatar y timeline visibles, era title centrado sin overlap. PASS / FAIL.

    **Ítem 9:** Rotar de vuelta a portrait. Mismo check. PASS / FAIL.

    **Ítem 10:** Settings → Accessibility → Motion → toggle ON "Reduce Motion". Volver a Safari, recargar la página. Tocar el tick `2026`. Verificar que el snap es jump INSTANTÁNEO (no smooth). PASS / FAIL.

    **Después del ítem 10:** restaurar Reduce Motion a OFF (estado normal).

    Tomar screenshot **solo** si algún ítem falló o reveló comportamiento extraño.
  </how-to-verify>
  <resume-signal>
    Reportar los 10 resultados en formato resumido. Ejemplo:
    "1: PASS, 2: PASS, 3: PASS, 4: PASS, 5: FAIL (timeline tapada por toolbar), 6: PASS, 7: PASS, 8: PASS, 9: PASS, 10: PASS"

    También incluir: modelo de iPhone, versión iOS, versión Safari (Settings → Safari).
  </resume-signal>
</task>

<task type="auto" tdd="false">
  <name>Task 7.3: Investigar y aplicar mitigaciones condicionales si algún ítem falló</name>
  <files>(condicional) src/components/StickyTimeline.vue, src/composables/useScrollState.js, index.html</files>
  <action>
    **Ejecutar SOLO si el Task 7.2 reportó ≥1 FAIL.**

    Para cada FAIL, investigar la causa antes de aplicar mitigación. NO aplicar las mismas mitigaciones ya pre-instaladas.

    **Si ítem 5 FAIL (timeline overlap con Safari toolbar) — HIGH 4 nueva instrucción:**

    El CSS `bottom: env(safe-area-inset-bottom, 0)` ya está en StickyTimeline.vue desde Plan 05. **NO aplicar la misma mitigación dos veces.** Diagnosticar:

    1. **Verificar viewport-fit=cover en index.html.** Sin ese atributo, env() en iOS retorna 0 incluso si está declarado en el CSS. Si Task 7.1 lo encontró missing y se añadió, re-test ítem 5 después del cambio. Si el flag se añadió y el ítem 5 sigue fallando, continuar al diagnóstico.

    2. **Inspeccionar el CSS computed en Safari iOS:** conectar el iPhone a la Mac (si disponible) y usar Safari Web Inspector → seleccionar `.sticky-timeline` → ver el valor computed de `bottom`. Si es `0px` pero hay overlap, hay otro elemento absorbiendo el insets. Investigar:
       - ¿`<body>` o `#app` tienen `padding` / `margin` que rompen el flujo?
       - ¿`<html>` tiene `height: 100%` o algo que altera el layout context del fixed bottom?
       - ¿Algún elemento sticky/fixed tiene mayor z-index y empuja la timeline?

    3. **Si la causa es "viewport-fit=cover missing":** ya cubierto en Task 7.1. NO modificar StickyTimeline.vue.

    4. **Si la causa es otra (ej. body padding):** surface al usuario antes de patch. NO modificar StickyTimeline.vue a ciegas — la mitigación previa ya está aplicada y otra capa puede crear bugs nuevos.

    Re-run ítem 5 en iPhone tras `npm run dev` reload.

    **Si ítem 1 FAIL intermitente (?ch=N race condition en iOS):**
    Editar `src/composables/useScrollState.js`. Localizar el bloque `maybeApplyDeepLink` que parsea `?ch=N` y hace doble RAF. Cambiar a triple RAF o añadir `setTimeout(fn, 0)` extra:
    ```javascript
    function maybeApplyDeepLink() {
      const initial = parseInitialChapter()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToChapter(initial, 'auto')
          }, 0)
        })
      })
    }
    ```
    Re-run ítem 1 en iPhone.

    **Si ítem 4 FAIL (flick skipping 2+ chapters):**
    Esto sería un bug nuevo no documentado en RESEARCH. Surface como blocker al usuario y consultar antes de aplicar JS scroll intercept manual (RESEARCH §Pitfall original tenía el patrón pero era para horizontal). NO mitigar autonómamente — pedir guidance al user.

    **Si ítem 10 FAIL (PRM click no es instantáneo):**
    Revisar StickyTimeline `onTickClick` — verificar que `behavior` es 'auto' cuando `prefersReduced.value === true`. Bug en Plan 05 si esto falla — corregir.

    **Si ítems 2-3 / 6 / 7-9 FAIL:**
    Probablemente bugs específicos del componente. Reportar detalles y consultar al user — no aplicar mitigaciones a ciegas.

    Después de cualquier mitigación, re-ejecutar el smoke test del ítem afectado. Solo seguir al Task 7.4 cuando todos los ítems sean PASS o documentados-FAIL-aceptado.
  </action>
  <verify>
    <automated>`npx vitest run`. Suite passing (regresión check). Si hubo cambios en código, los tests automáticos deben seguir pasando.</automated>
  </verify>
  <done>
    Cualquier ítem que falló tiene su causa diagnosticada Y mitigación apropiada aplicada (sin duplicar el env() ya preventivo del Plan 05) Y re-tested PASS, O está documentado como FAIL-aceptado con justificación en el log.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 7.4: Documentar resultado en 01-EXECUTION-LOG.md + actualizar STATE.md</name>
  <files>.planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md, .planning/STATE.md</files>
  <action>
    Crear `.planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md` con el template del `<interfaces>` arriba. Rellenar:
    - **Date:** fecha real del smoke test (formato `YYYY-MM-DD`).
    - **Hardware:** modelo del iPhone + iOS version + Safari version (Settings → General → About → Software Version).
    - **Network:** IP LAN usada.
    - **Tester:** Rafael.
    - **Result overall:** PASS / PARTIAL / FAIL (PARTIAL si algunos ítems fallaron pero fueron mitigados; FAIL si algún ítem no se pudo resolver).
    - **Pre-conditions verified:** check off viewport-fit=cover y env() en StickyTimeline.
    - **Checklist 10/10 table:** rellenar cada fila con el resultado real (no inventar). Para FAIL, añadir notas + referenciar el mitigation aplicada (si la hubo).
    - **Mitigations Applied:** listar cambios hechos al código durante Task 7.3, con paths exactos + diff conceptual. Si no hubo mitigaciones necesarias (porque el env() preventivo de Plan 05 hizo su trabajo), notar "Ninguna — env(safe-area-inset-bottom) preventivo de Plan 05 cubrió el caso esperado de Safari toolbar overlap."
    - **Conclusion:** una frase de cierre.

    Después editar `.planning/STATE.md`. Localizar la sección "Blockers/Concerns" → el bullet existente "iOS smoke test (Phase 1)". Reemplazarlo con:
    - Si PASS: `- **iOS-02: PASS** YYYY-MM-DD on iPhone <model> iOS <version>. Phase 1 cleared para /gsd-verify-work 1.`
    - Si PARTIAL: `- **iOS-02: PARTIAL** YYYY-MM-DD on iPhone <model>. Mitigations: <list>. Net result acceptable; iOS-02 no-bloqueante per requirements.`
    - Si FAIL (rare): `- **iOS-02: FAIL** YYYY-MM-DD on iPhone <model>. Items <N> unresolved. Per requirements iOS-02 is no-bloqueante; documentar como known issue y seguir a Phase 2 con seguimiento.`

    NO modificar otras secciones de STATE.md (Current Position, Progress, etc. — esas las actualiza `/gsd-verify-work` o el operator).

    Después ejecutar `npx vitest run` por última vez para confirmar que la suite sigue verde.
  </action>
  <verify>
    <automated>`node -e "const fs = require('fs'); const log = fs.readFileSync('./.planning/phases/01-scroll-shell-sticky-anchors/01-EXECUTION-LOG.md', 'utf8'); if (!log.includes('iPhone') || !log.includes('PASS') && !log.includes('FAIL') && !log.includes('PARTIAL')) process.exit(1); const state = fs.readFileSync('./.planning/STATE.md', 'utf8'); if (!state.includes('iOS-02')) process.exit(1); console.log('OK docs updated')"`. Plus `npx vitest run` exit 0.</automated>
  </verify>
  <done>
    `01-EXECUTION-LOG.md` existe con los 10 items documentados + pre-conditions verificadas. `STATE.md` actualizado con una línea de resumen. Suite Vitest passing.
  </done>
</task>

</tasks>

<verification>
**Automated:**
```powershell
npx vitest run
```
Exit 0, suite completa passing.

**Manual:**
- [ ] 10 ítems del checklist iOS ejecutados en iPhone real (o fallback documentado).
- [ ] Pre-conditions verificadas: viewport-fit=cover + env() en CSS Plan 05.
- [ ] Resultado documentado en `01-EXECUTION-LOG.md`.
- [ ] `STATE.md` actualizado con resumen iOS-02.
- [ ] Mitigaciones aplicadas (sin duplicar el env() ya preventivo) para cualquier FAIL.
</verification>

<success_criteria>
- [ ] Smoke test ejecutado en hardware iOS real (o BrowserStack fallback con justificación).
- [ ] Pre-conditions verificadas antes del smoke test (HIGH 4 — viewport meta + env() ya en CSS).
- [ ] Resultado de los 10 ítems documentado (con dispositivo + versión).
- [ ] Cualquier mitigación aplicada y re-tested (sin duplicar mitigaciones pre-aplicadas).
- [ ] `STATE.md` blockers/concerns actualizado.
- [ ] iOS-02 (no-bloqueante) cerrado con un verdict claro.
- [ ] Phase 1 listo para `/gsd-verify-work 1`.
</success_criteria>

<output>
Tras completar, crear `.planning/phases/01-scroll-shell-sticky-anchors/01-07-SUMMARY.md` documentando:
- Resumen de los 10 ítems del checklist (con verdicts).
- Confirmación de que el env(safe-area-inset-bottom) preventivo del Plan 05 funcionó (ítem 5 PASS sin re-aplicar mitigación).
- Mitigaciones aplicadas (si las hubo) — claramente etiquetadas como "nuevas" (no duplicadas).
- Confirmación de que `STATE.md` y `01-EXECUTION-LOG.md` están actualizados.
- Recomendación al user de ejecutar `/gsd-verify-work 1` para validar formalmente Phase 1 contra UI-SPEC §12 y los 18 requirements.
- Listado de cualquier issue conocido que se difiere a Phase 2 (debería ser cero).

**User confirmation needed before Task 7.2:** Si Rafael NO tiene iPhone disponible al momento de ejecución, pausar y consultar:
- "¿Tienes iPhone o iPad disponible ahora para el smoke test? Alternativas: (a) BrowserStack remoto (no cubre momentum scrolling fielmente), (b) diferir iOS-02 a post-Phase-1 (es no-bloqueante per requirements)."
</output>
