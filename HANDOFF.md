# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-08-02, cierre limpio de tanda
**Sesión:** `20260727T013114Z-db71132a`

> Fuente de verdad completa: `state/sessions/20260727T013114Z-db71132a/session.json`.
> De los tickets manda `tasks/`. Este archivo es el resumen operativo.

## 0. Estado al cortar: LIMPIO, PERO CON DEUDA DE DEPLOY

**Nada en vuelo.** Los 8 agentes de la tanda volvieron, el árbol está limpio y
todo pusheado (`8604c1d`). Se retoma en frío sin rescatar trabajo de nadie.

**Pero producción está atrasada.** TASK-041 quedó cerrado y pusheado y **sin
deployar** — Rafael eligió parar antes del deploy. `m4to.com` todavía sirve
`0125e57`, así que **las mejoras de ch2, ch3, ch4 y ch5 no están en vivo**.

## 1. Al retomar, en este orden

1. `git log --oneline -5` y `git status` (higiene, no rescate).
2. **Deployar** — es lo primero, ver el procedimiento del punto 2.
3. **Leer `.planning/LECCIONES-TECNICAS.md` completo antes de despachar nada.**
   Son 8 lecciones y 5 trampas de instrumento, todas pagadas con un defecto real.
4. Seguir la fila del punto 5.

## 2. Estado del sitio y procedimiento de deploy

En producción en https://m4to.com (y `multiverse-portfolio.web.app`, mismo
hosting, proyecto `multiverse-portfolio`): ch6 completo con ASCII, binario y
terminal con IA; el ciclo del ASCII; el fix del chasis de TASK-019; el title.

**Falta subir TASK-041** (5 commits, `16dcae1`..`5826949`).

```
1. npm run build
2. rm -rf dist/references dist/assets/old      # IMPRESCINDIBLE
3. npx firebase-tools deploy --only hosting --non-interactive
4. curl -s -I -L https://m4to.com/references/2026.jpg | grep -i content-type
   → tiene que decir text/html (fallback SPA). Si dice image/jpeg, HAY FUGA.
```

El paso 2 no es opcional: el build copia `public/references/` (fotos personales
de Rafael, **cero usos en el sitio**) y 23 MB de `assets/old`. Sin él el dist pesa
39 MB; con él, 8.1 MB.

El paso 4 tiene trampa: el rewrite `** → /index.html` hace que **cualquier** ruta
inexistente devuelva 200. **El código de estado no prueba nada; el `Content-Type`
sí.**

La credencial de Rafael ya está cacheada, así que el deploy **no es interactivo** y
el orquestador lo corre solo. La CLI no está instalada global pero `npx` la
resuelve.

## 3. Decisiones de Rafael vigentes

- **La excepción de `Chapter*Content.vue` sigue viva y se AMPLIÓ.** Se pueden
  tocar los de ch2, ch3, ch4 y ch5, pero **solo** para `padding`, `margin`,
  `max-height` y `box-sizing` de la columna de contenido. Las dos últimas las
  sancionó el 2026-07-30 después de ver los números. Sigue prohibido todo lo
  demás: lógica, minijuego, `MatchScene.js`, audio del módem, `DialUpScreen.vue`,
  multitud de ch5, animaciones y shaders. **ch0, ch1 y ch6 quedan fuera.**
- **Alcance recortado:** solo lo visual y de contenido. Fuera: TASK-001 (CI) y
  TASK-027 (timeouts).
- **La estética la manda la spec de Fable 5**, con un límite: que no dañe la
  navegación. No consultarle decisiones de gusto. Pero **contenido tapado, cortado
  o inalcanzable se arregla igual**, con prueba geométrica.

## 4. Reglas operativas

- **Higiene de procesos, no negociable:** Chrome con `--user-data-dir` propio de
  nombre único, y al matar procesos **filtrar SIEMPRE por ese perfil**. Prohibido
  `Get-Process chrome | Stop-Process -Force`: ya mató todas las ventanas de Chrome
  de la máquina de Rafael una vez, irreversible. Lo mismo con los Vite: verificar
  la command line del PID antes de matarlo, hay varios de otras sesiones.
- **Si la máquina no está quieta, no se inventa un número** de performance.
- **Todo fix de solapamiento que toque `max-height`, `height` u `overflow` corre
  el contra-sensor en la MISMA corrida.** Ver punto 6.

## 5. Fila

**Deploy** → **TASK-018** (desbordes de ch0/ch4 con el texto final) →
**TASK-037** (los 4 GIFs de ch1) → **TASK-006** (4 bugs de cableado) →
TASK-042 → TASK-015 + TASK-016.

### Tickets abiertos

| Ticket | Qué es | Prioridad |
|---|---|---|
| TASK-030 | `public/references` y `assets/old` se publican al dist (fotos personales) | **alta** |
| TASK-037 | 4 GIFs de ch1 estirados 8.2 % no uniforme y tapados por contenido | **alta** |
| TASK-031 | Dron fuera de cuadro en 1920x912 + el AC#8 dice 2 planetas con texto de cuando había 3 | media |
| TASK-033 | `seoConfig.siteUrl` sigue en el placeholder `.web.app` con el sitio en m4to.com | media |
| TASK-036 | Tier C de ch6: el fallback CSS que pide la spec §8 no existe | media |
| TASK-038 | Upscale no entero en pixel art de ch0/ch4 | media |
| TASK-039 | Showcase de ch0 sin affordance de scroll en mobile | media |
| TASK-040 | Bustos: revisión visual **con Rafael** antes de tocar arte (uat-only) | media |
| TASK-042 | ch5: el panel de stream perdió ventana visible, caso grave en landscape (198px → 109px) | media |

**Sin ticketear todavía:** el desborde horizontal de `.ch4-panel-column` en
834x1194 (24.4px, 4 palabras cortadas). Probablemente exige `width`, o sea que
cae fuera de la lista blanca de Rafael y necesita autorización suya.

## 6. Herramientas de verificación

Dos arneses, ambos versionados, ambos con `--locale=es|en` **obligatorio** (correr
los dos; el español es el caso largo):

- `scripts/verify-chassis-overlap.mjs` — solapamiento chasis × glifos.
  **Referencia a no empeorar: PASS ES 50, EN 51.**
- `scripts/verify-content-reachable.mjs` — **contra-sensor nuevo**, mide
  `clientHeight` vs `scrollHeight` y las palabras fuera del rect visible. Existe
  porque el primero premia esconder texto. Sale con código ≠ 0 si un target falta.

Antes de medir glifos: **verificar que `document.fonts` no tenga entradas en
`error`**.

## 7. Pendientes de Rafael que bloquean cierres

- **Los 5 tickets uat-only** (013, 002, 003, 004, 005): el guard exige que el
  veredicto UAT lo firme un humano y `loop_auth.uat_delegated_to_orchestrator` es
  `false`. Su texto **ya está entregado y cargado**, verificado; falta solo el
  asiento de aprobación. La línea que tiene que correr él:
  `node "C:/Users/RafaelMatovelle/.claude/plugins/cache/hivemind-marketplace/hivemind/0.18.0/dist/loop-ctl.cjs" set-mode --repo-root "C:/Users/RafaelMatovelle/Documents/mato-new-portfolio" --mode harness`
  Al orquestador el clasificador le bloquea ese comando, y **no hay que rodearlo
  editando `session.json` a mano**: es justo el guard que impide autofirmarse.
- **TASK-040:** la revisión visual de los 7 bustos lado a lado.
- **gh CLI** instalado pero sin autenticar; 2 reportes de bug del framework esperan
  en `.claude/framework-bug-reports/`.

## 8. Lo que se aprendió en la tanda de TASK-041

Cinco rondas, cinco reviews de contexto fresco. Vale la pena leer esto antes de
despachar el próximo ticket de capítulo.

1. **Un arnés de solapamiento premia esconder texto.** Mide chasis contra glifos,
   así que achicar la ventana del contenido mejora su número igual que dar
   espacio. Dio "cero fallos nuevos" —correctamente— mientras el panel de ch4
   quedaba colapsado a 12px con el 100% del texto y el título detrás del scroll.
   **Toda métrica que se puede mejorar quitando lo que se mide necesita un
   contra-sensor en la misma corrida.** Es §8 y de ahí nació el segundo arnés.
2. **El "n/a" es la forma más barata de apagar un sensor.** Se declaró n/a para
   ch2 y ch3 porque sus cajas no tienen `overflow-y: auto` propio. El argumento
   era falso y dejó pasar el botón CONTACT fuera de pantalla: las secciones son
   `100dvh` con `overflow: hidden`, y ahí lo recortado es **inalcanzable**, no
   diferido. La pregunta no es si la caja scrollea, sino si un ancestro la recorta.
3. **Sexta, séptima y octava vez** que un verde de la suite convive con un defecto
   real. 739 tests verdes con tres defectos vivos.
4. **Medir donde el fix funciona no prueba que el brazo esté cubierto.** El fix del
   botón CONTACT se midió en 844×390 y andaba; el mismo brazo cubría hasta 280px
   de alto, donde cortaba el botón. **Barrer el rango, no muestrear un punto.**
5. **Un residual declarado con aritmética es un resultado aceptable.** Se probó que
   por debajo de ~372px no existe un margin que satisfaga a la vez el año y el
   botón; se resolvió a favor de la navegación y se declaró el resto. Eso es
   entregar, no recortar.
6. Dos trampas de instrumento nuevas, en §6: **fuentes 403** en un worktree con
   `node_modules` junctionado (`document.fonts` en `error`, métricas corridas ~3
   puntos, fabricó una base falsa y un fallo fantasma), y el **epsilon del
   `devicePixelRatio`** (`3.0000001192092896`), que puede dejar una altura sin
   ninguna media query aplicable. Los brazos por altura deben **compartir el valor
   del límite**, no usar N y N+1.
7. **El hook de diseño `impeccable` reportó cuatro veces dos hallazgos sobre
   `Chapter5Content.vue`, ambos falsos positivos verificados**: el `side-tab` es el
   filete de 3px del lower-third que la spec de ch5 pide textual, y el
   `broken-image` matchea la palabra `<img>` dentro de un comentario HTML que
   documenta el hallazgo anterior. No se silenciaron: Rafael no confirmó la
   excepción. Si molesta, las órdenes acotadas al archivo están en el punto 9.

## 9. Excepciones de hook ofrecidas y no aplicadas

Esperan confirmación de Rafael:

```
/impeccable hooks ignore-value broken-image "*" --file "src/components/Chapter5Content.vue"
/impeccable hooks ignore-value side-tab "*" --file "src/components/Chapter5Content.vue"
```
