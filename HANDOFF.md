# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-07-27, tarde
**Sesión:** `20260727T013114Z-db71132a`

> La fuente de verdad completa es `state/sessions/20260727T013114Z-db71132a/session.json`.
> Este archivo es el resumen operativo para retomar rápido.

## Objetivo

Rafael calificó la belleza del sitio en 0/10 y pide 10/10, con el estándar declarado
de que parezca un sitio de 50.000 dólares. Hasta Flash (ch0, ch1, ch2) le gusta y se
preservan. Desde la muerte de Flash (ch3 en adelante) se rediseña todo. Autorizó
cambiar todo el arte y todo el estilo.

---

## AL RETOMAR: hacé esto en orden

1. **`git log --oneline -12`** y **`git status`**. Debe haber ~10 commits locales sin
   push. Si el working tree tiene `src/i18n/`, `src/data/contact.js` o
   `ContactHUD.vue` modificados, es TASK-013 que quedó a medias: ver abajo.
2. **`npm run test:run`.** Si hay rojos, mirá cuáles antes de asumir regresión: los
   de títulos de capítulo, largo ES contra EN y conteo de proyectos son del contenido
   nuevo y los arregla TASK-013.
3. **Despachar el review de cierre de TASK-010** (ver abajo).
4. Seguir el orden de tickets de la tabla.

---

## Estado de los tickets

| Ticket | Qué es | Estado |
|---|---|---|
| TASK-008 | Tokens y chasis RAFAEL-OS | **DONE**, review verde, 2 commits |
| TASK-014 | Shell multi-viewport con anclaje sticky | **DONE**, review verde ronda 3, 4 commits |
| TASK-009 | ch3, la muerte de Flash | **DONE**, review verde ronda 2, 3 commits |
| TASK-007 | Destapar la narrativa | **DONE** como absorbido, defectos repartidos |
| TASK-010 | ch4, salto entre realidades | **in_progress** — corrección landeada, FALTA EL REVIEW DE CIERRE |
| TASK-013 | Cierre de contenido | **in_progress** — cargando los textos finales |
| TASK-017 | Techo de fps global | todo, **alta, desbloqueante** |
| TASK-011 | ch5, la transmisión | todo |
| TASK-012 | ch6, el clímax | todo |
| TASK-015 | Calibrar el parallax de ch3 | todo, media |
| TASK-016 | Craft polish de ch2 | todo, baja, **2 ítems esperan a Rafael** |
| TASK-001 | CI | todo — **NO cerrar**, nunca se hizo y sigue siendo real |
| TASK-006 | Cuatro bugs de cableado | todo — **NO cerrar**, siguen vivos |
| TASK-002/003/004/005 | Superados | **Rafael pidió cerrarlos**, bloqueados por guard |

---

## Lo que quedó a medio camino

### TASK-010 — falta el review de cierre

Su ronda de corrección **ya landeó** en `a2747fe`: se arregló el HIGH de la lente
Sobel espejada en el eje Y, más seis MEDIUM. Verificado por el orquestador — el flip
está en `Ch4PortalShader.vue:720`, la viñeta y el suelo dobles se borraron de verdad,
y el rAF quedó gateado por capítulo activo.

**Falta:** despachar `hivemind:reviewer` con `model: 'fable'` sobre el rango completo
`f632edb..a2747fe`, tres commits: `8e8e85a`, `93c90e4`, `a2747fe`. Hacerlo **con la
suite en verde**, o sea después de que TASK-013 termine; si no, el reviewer se
confunde con rojos que no son suyos.

Si da PASS, cerrar enlazando los tres commits.

### TASK-013 — cargando el contenido

Rafael entregó sus textos finales en **`.planning/GUION-TEXTOS-FINAL.md`**, que es
fuente de verdad de contenido y **se copia verbatim**: no se edita, no se resume, no
se "mejora". Es contenido de autor.

Al guardar este handoff había un agente vivo cargándolo, **sin commitear todavía**.
Estado exacto del working tree en ese momento (`git status`):

```
 M src/App.vue                       ← solo fin de línea, sin diff real
 M src/components/ContactHUD.vue     ← campos nuevos: teléfono y ubicación
 M src/data/contact.js               ← datos reales de Rafael
 M src/i18n/es.json                  ← los 7 textos de era + proyectos + UI
 M src/i18n/en.json                  ← traducción al inglés en curso
 M tests/data/contact.test.js
```

**Si al retomar eso sigue sin commitear**, el agente murió a mitad. Verificá el
trabajo contra `.planning/GUION-TEXTOS-FINAL.md` y, si está sano, pedí a un
`hivemind:developer` que lo complete y commitee. Si está a medias, `git checkout --
src/ tests/` y re-despachar: no hay nada que perder porque nada está commiteado.

**Chequeos obligatorios de ese trabajo:** la era 3 debe quedar con **exactamente 5
párrafos** (el componente los parte uno por beat, y de los beats 1 a 4 solo muestra
las 2 primeras oraciones); deben quedar **13 tarjetas de proyecto, no 14** (se
elimina la de AR/VR duplicada en ch6, hay tests que cuentan 14); y paridad de claves
ES/EN sin huérfanas.

**Dato que condiciona ch5 y ch6:** el texto creció mucho. La era 5 pasó de 1.013 a
~4.188 caracteres y la era 6 de 806 a ~2.031. Las eras 0 y 4 triplicaron y sus
capítulos ya están construidos para el texto viejo, así que pueden desbordar.
**Regla: el texto de Rafael no se recorta para que entre. Si no entra, cambia el
diseño.**

---

## Bloqueado por guard: los cuatro tickets superados

Rafael pidió cerrar TASK-002, 003, 004 y 005 como superados y **dio el veredicto
verbalmente**. Pero los cuatro son `uat-only` y el guard no deja firmar un comentario
de UAT mientras `loop_auth.uat_delegated_to_orchestrator` sea `false`, que es lo que
Rafael eligió a propósito.

**Dos salidas, las dos legítimas:** pasar a modo harness y cerrarlos, o que Rafael
conceda la delegación. **No forzar el guard.**

Ojo: **TASK-001 y TASK-006 NO se cierran.** No están superados. TASK-006 son cuatro
bugs de cableado concretos que siguen vivos, incluido el warning de `marquee` sin
`isCustomElement` que aparece en consola hoy.

---

## Decisiones de producto pendientes de Rafael

1. **ch3 quedó en 11 viewports** con arquitectura de deck y crossfades, o sea ~60%
   del recorrido total del sitio, y la rueda funciona como botón de "siguiente
   slide". Se desvía de la spec, que pedía que el Acto 2 fluyera normal como una
   landing de 2013. Hay 2-3 viewports recortables sin perder contenido.
2. **TASK-016**, dos de tres ítems: el fondo de grilla hexagonal y el borde de acento
   lateral de ch2. Ambos defendibles como auténticos de la época Y2K.
3. **El teléfono en el HUD de contacto**: campo nuevo, siempre visible. Riesgo de
   scraping, decisión suya.

---

## Cinco lecciones que costaron caro. Aplicalas desde el primer dispatch

1. **`overflow: hidden` crea un scroll container.** Seis apariciones esta sesión.
   Rompió `position: sticky` dos veces y `animation-timeline: scroll()` una vez.
   **Regla: si el contenedor solo quiere recorte visual, va `clip`, nunca `hidden`.**
2. **Un verde no prueba nada.** Los dos HIGH de TASK-014, el parallax muerto de
   TASK-009 y la lente espejada de TASK-010 estuvieron **todos verdes en la suite
   completa**: jsdom no hace layout y el WebGL está mockeado. Exigir **progresión
   medida en dos puntos distintos**, no la existencia de la animación.
3. **`canvas.toDataURL()` miente** bajo automatización CDP: devuelve bytes idénticos
   aunque el WebGL renderice a 110 fps. Usar `Page.captureScreenshot`, que pasa por
   el compositor nativo. Y `gl.readPixels` en negro con `preserveDrawingBuffer:
   false` es lo **esperado**, no un síntoma.
4. **Para lockear CSS**, compilar el `<style scoped>` real con `@vue/compiler-sfc` y
   verificar cascada con `getComputedStyle`. Los regex sobre texto fuente son ciegos
   a especificidad, que es como se coló un HIGH entero.
5. **Los subagentes recortan alcance si no se les prohíbe.** El developer de ch4 cortó
   la lente Sobel, el efecto firma del capítulo, "por presupuesto de sesión". **Poner
   en cada dispatch: si algo de la spec no entra, se PARA y se reporta.**

---

## Entorno

- **Chrome oculto**: `visibilityState: hidden` pausa Phaser y todo rAF. **Workaround
  validado**: los developers levantan su propio Chrome **headed** vía CDP crudo con
  WebSocket nativo de Node. Headless usa software rendering y degrada justo los
  shaders y las animaciones de compositor que hay que medir.
- **`gh` instalado** (2.96.0, en `C:\Program Files\GitHub CLI\gh.exe`) pero **sin
  autenticar** y fuera del PATH de la sesión. Hay dos reportes de bug del framework
  escritos y scrubbeados en `.claude/framework-bug-reports/` esperando
  `gh auth login`.

---

## Reglas de proceso

Baseline primero. Un capítulo por commit. Lista blanca de archivos en cada dispatch.
Verificar en Chrome antes de commitear. **Solo hivemind** — el hook
`.claude/hooks/enforce-hivemind.mjs` bloquea `Agent` y `Workflow` fuera del equipo, y
Rafael pidió no quitarlo nunca. Locks de no regresión en cada ticket.

**Autorizaciones del loop, session-scoped, se re-confirman al retomar:** cierre
automático en review verde SÍ, consolidación automática SÍ. Delegación de UAT NO,
push a remoto NO, version bump NO.

## Fuentes de verdad

**Diseño:** `.planning/design/00-sistema-visual-global.md`,
`03-ch3-muerte-de-flash.md`, `04-ch4-salto-entre-realidades.md`,
`05-ch5-pandemia-broadcast.md`, `06-ch6-climax-terminal-ia.md`.

**Contenido:** `.planning/GUION-TEXTOS-FINAL.md`.

Las specs ganan sobre el cuerpo del ticket si hay conflicto.
