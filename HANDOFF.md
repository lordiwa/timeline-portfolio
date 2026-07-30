# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-07-30, corte por contexto (35%)
**Sesión:** `20260727T013114Z-db71132a`

> Fuente de verdad completa: `state/sessions/20260727T013114Z-db71132a/session.json`.
> De los tickets manda `tasks/`. Este archivo es el resumen operativo.

## 0. HAY TRABAJO EN VUELO — LEER ESTO PRIMERO

Al momento del corte había **dos agentes corriendo en background**. Si el clear
perdió sus notificaciones, su trabajo puede estar en disco sin que nadie lo haya
recogido. **Antes de despachar nada: `git log --oneline -5` y `git status`.**

| Qué | Estado al cortar | Cómo saber si terminó |
|---|---|---|
| **TASK-034 ronda 2** (developer) | Arreglando el sensor J2 del arnés de ch6 + medir fps | Commit nuevo de TASK-034 encima de `96405c9` |
| **TASK-019** (reviewer, Fable 5) | Review de cierre del fix del chasis, sobre `0848966` | Es read-only, no deja commit. Si no volvió, **re-despachar** |

Si TASK-034 dejó cambios sin commitear, **preservarlos en un commit WIP antes de
tocar nada** (precedente: `03c9f12`).

## 1. Al retomar, en este orden

1. `git log --oneline -5` y `git status` — ver punto 0.
2. **Leer `.planning/LECCIONES-TECNICAS.md` completo antes de despachar nada.**
3. Leer las lecciones nuevas de esta sesión, punto 8 de este archivo.
4. Cerrar TASK-034 y TASK-019; después seguir la fila del punto 6.

## 2. Estado del sitio

**EN PRODUCCIÓN** en https://m4to.com (y `multiverse-portfolio.web.app`, mismo
hosting de Firebase, proyecto `multiverse-portfolio`): ch6 completo con
ASCII/binario/terminal (TASK-012, sus dos rondas) y el title corregido
(TASK-032). Tres deploys hoy, los tres verificados en vivo.

**NO deployado:** el ciclo del ASCII (TASK-034, en BLOCK) y el fix del chasis
(TASK-019, en review).

### Procedimiento de deploy — repetir tal cual hasta que se haga TASK-030

```
1. npm run build
2. rm -rf dist/references dist/assets/old      # IMPRESCINDIBLE
3. npx firebase-tools deploy --only hosting --non-interactive
4. curl -s -I -L https://m4to.com/references/2026.jpg | grep -i content-type
   → tiene que decir text/html (fallback SPA). Si dice image/jpeg, HAY FUGA.
```

El paso 2 no es opcional: el build copia `public/references/` (6 fotos personales
de Rafael, **cero usos en el sitio**, verificado por grep) y 23 MB de
`assets/old`. Sin ese paso el dist crudo pesa 39 MB; con él, 8.1 MB.

El paso 4 tiene trampa: el rewrite `** → /index.html` hace que **cualquier** ruta
inexistente devuelva 200. **El código de estado no prueba nada; el
`Content-Type` sí.**

La credencial de Rafael (`srparca@gmail.com`) ya está cacheada en disco, así que
el deploy **ya no es interactivo** y el orquestador lo corre solo. La CLI no está
instalada globalmente pero `npx` la resuelve.

## 3. BLOQUEADOR ACTIVO PENDIENTE DE RAFAEL

**13-14 procesos `tesseract.exe` ajenos al repo al 100 % de CPU**, toda la sesión.
Consecuencias medidas, no supuestas:

- La suite da rojos falsos por **timeout** (nunca AssertionError), en archivos
  distintos según la carga del momento: 2 en una corrida, 3 en otra, 4 en otra.
  Aislados con `--testTimeout=20000/30000` siempre dan verde.
- **La medición de fps es imposible:** dos mediciones consecutivas del *mismo*
  estado en reposo de ch0 dieron 14.0 y 19.5 fps (~40 % de variación).

Eso deja el AC4 de TASK-034 sin verificar, que es justo el criterio que más
importa ahí. Se le pidió a Rafael cerrar lo que los lanza. **Regla para los
developers: si la máquina no está quieta, reportar "no medido" y NO inventar un
número.**

## 4. Incidente de proceso — no repetir

El developer de TASK-019 corrió `Get-Process chrome | Stop-Process -Force` **sin
filtrar por perfil** y mató todas las ventanas de Chrome de la máquina, incluida
la de Rafael. Irreversible. **Regla obligatoria en todo dispatch que use Chrome:**
`--user-data-dir` propio con nombre único, y al matar procesos filtrar SIEMPRE por
ese perfil.

## 5. Cerrado hoy

- **TASK-012** (ch6 clímax) — 2 rondas. La 1 volvió en BLOCK por un HIGH vivo en
  producción: `skip()` completaba y después **des-completaba**, devolviendo texto
  ya visible a `opacity: 0.001` y haciendo retroceder el shader ante cualquier tap
  (en móvil, cualquier toque para scrollear). Commits `c2c8eb2`, `d28a130`,
  `9767c79`. Se corrigieron además 3 bugs reales que la suite verde no vio: la
  polaridad invertida del `smoothstep` del wipe ASCII, el umbral `mode < 0.5` que
  dejaba la fase binaria sin mostrarse nunca, y los índices de `PLANET_SLOTS` por
  posición de array tras la baja de `ch6-ar-vr`.
- **TASK-032** (title estático) — review PASS. Commit `5688ea9`.
- **TASK-035** (auditoría de imágenes) — arnés `scripts/verify-image-audit.mjs`,
  commit `588282a`. **Cerrado sin review independiente del instrumento:** cada
  ticket derivado debe re-verificar su claim antes de actuar.

## 6. Fila con el alcance recortado por Rafael

Cerrar **TASK-034** y **TASK-019** → **TASK-018** (desbordes ch0/ch4 con el texto
final) → **TASK-006** (4 bugs de cableado) → **TASK-015 + TASK-016** juntos.
Fuera del alcance sin ejecutar: TASK-001 (CI) y TASK-027 (timeouts), aunque
TASK-027 ganó mucha evidencia hoy.

### Tickets abiertos hoy

| Ticket | Qué es | Prioridad |
|---|---|---|
| TASK-030 | `public/references` y `assets/old` se publican al dist (6 fotos personales) | **alta** |
| TASK-031 | Dron fuera de cuadro en 1920x912 + el AC#8 dice 2 planetas con texto de cuando había 3 | media |
| TASK-033 | `seoConfig.siteUrl` sigue en el placeholder `.web.app` con el sitio ya en m4to.com | media |
| TASK-034 | El ciclo del ASCII (pedido de Rafael) — **ronda 2, BLOCK por sensor vacuo** | alta |
| TASK-036 | Tier C de ch6: el fallback CSS que pide la spec §8 no existe | media |
| TASK-037 | 4 GIFs de ch1 estirados 8.2 % no uniforme y tapados por contenido | alta |
| TASK-038 | Upscale no entero en pixel art de ch0/ch4 | media |
| TASK-039 | Showcase de ch0 sin affordance de scroll en mobile | media |
| TASK-040 | Bustos: revisión visual con Rafael antes de tocar arte (**uat-only**) | media |

## 7. Residuales de TASK-019 que necesitan decisión de Rafael

El fix del chasis mejoró pero **no resolvió** todo. La timeline pasó de 67px
(portrait) y 153px (landscape) a 54px, y ch0 portrait pasó de solapar a limpio.
Quedan:

- **ch2, ch3 y ch4 siguen solapando en móvil**: sus columnas de contenido tienen
  menos de 44px de margen desde el borde, y 44px es el mínimo de accesibilidad de
  un tap target.
- **ch4 en landscape**: su `<h1>` mide `x0=0, x1=844`, el ancho completo del
  viewport sin margen alguno.
- Hallazgo nuevo: **`LangToggle` tapa el primer párrafo de bio de ch0** en los dos
  viewports desktop y en tablet portrait.
- Se midió **en inglés, no en español**, y el español es el caso de texto largo.
- `GlobalMantra` sigue interceptando `.ch6-convo-word` en mobile.

El developer sostiene que ch2/ch3/ch4 son imposibles sin tocar los
`Chapter*Content.vue`, prohibidos por la lista blanca. **La decisión que le
corresponde a Rafael es si se levanta esa prohibición** en un ticket de
seguimiento — existe porque un pase de agentes sin restricción rompió cuatro cosas
que funcionaban el 2026-07-27.

## 8. Lecciones nuevas de esta sesión

1. **Un check documentado en el encabezado de un arnés pero ausente de los
   resultados es un sensor vacío que se lee como cobertura** (el check D de ch6).
2. **Cuando un check pasa de FAIL a PASS con el MISMO número medido**, exigir la
   justificación de por qué la aserción vieja era la equivocada. En ch6 se
   sostuvo: `canvas == host` es imposible bajo zoom COVER, y la propia spec §1.1
   lo predice.
3. **La variación visual no prueba que un efecto anime.** El check J2 del ciclo
   daba verde con el ciclo apagado, porque el fondo tiene estrellas titilando y
   drones que oscilan dentro de la franja muestreada. Se demostró midiendo la
   ventana en que el ciclo está en silencio por diseño.
4. **Sexta vez** que un verde de la suite convive con un defecto real. jsdom no
   hace layout y el WebGL está mockeado: un verde de Vitest nunca es evidencia
   visual.
5. Los locks por **regex sobre CSS fuente** son ciegos a la cascada (ya costó dos
   HIGH en TASK-014). Los de TASK-019 son de esa clase.
6. **Un arnés puede medirse a sí mismo y dar un falso rojo**: el check H3 daba el
   audio del dial-up como ausente, y en realidad `jumpToChapter()` del propio
   arnés desarmaba el `.dialup-scrim` con Escape. El audio nunca estuvo roto.
7. **Un test puede pasar en falso positivo por mirar solo el estado final.** El
   primer T9 de ch6 pasaba porque la timeline sin cancelar terminaba alcanzando el
   total por su cuenta; hubo que capturar la ventana intermedia.

## 9. Pendientes de Rafael que bloquean cierres

- **Los 5 tickets uat-only** (013, 002, 003, 004, 005) no se pueden cerrar: el
  guard exige que el veredicto UAT lo firme un humano y
  `loop_auth.uat_delegated_to_orchestrator` es `false`. Su texto **ya está
  entregado y cargado**, verificado. Solo falta el asiento de aprobación. La línea
  que tiene que correr él:
  `node "C:/Users/RafaelMatovelle/.claude/plugins/cache/hivemind-marketplace/hivemind/0.18.0/dist/loop-ctl.cjs" set-mode --repo-root "C:/Users/RafaelMatovelle/Documents/mato-new-portfolio" --mode harness`
  Al orquestador el clasificador le bloquea ese comando, y **no hay que rodearlo
  editando `session.json` a mano**, porque es justo el guard que impide
  autofirmarse la aprobación.
- **TASK-040**: la revisión visual de los 7 bustos lado a lado.
- **Los procesos `tesseract.exe`** del punto 3.
- **gh CLI** instalado pero sin autenticar; los 2 reportes de bug del framework
  esperan en `.claude/framework-bug-reports/`.
