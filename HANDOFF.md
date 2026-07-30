# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-07-30, cierre limpio de tanda
**Sesión:** `20260727T013114Z-db71132a`

> Fuente de verdad completa: `state/sessions/20260727T013114Z-db71132a/session.json`.
> De los tickets manda `tasks/`. Este archivo es el resumen operativo.

## 0. Estado al cortar: LIMPIO

**Nada en vuelo.** Los 4 agentes de la tanda anterior volvieron, el árbol está
limpio, todo pusheado (`e156bca`) y deployado. Se puede retomar en frío sin
rescatar trabajo de nadie.

## 1. Al retomar, en este orden

1. `git log --oneline -5` y `git status` (higiene, no rescate).
2. **Leer `.planning/LECCIONES-TECNICAS.md` completo antes de despachar nada.**
3. Leer las lecciones del punto 7 de este archivo.
4. Seguir la fila del punto 5.

## 2. Estado del sitio

**EN PRODUCCIÓN** en https://m4to.com (y `multiverse-portfolio.web.app`, mismo
hosting, proyecto `multiverse-portfolio`):

- ch6 completo: ASCII, binario decodificable y terminal con IA (TASK-012).
- **El ciclo del ASCII** — pedido de Rafael: el efecto vuelve a la vista normal y
  cicla en vez de quedarse asentado (TASK-034).
- El fix del chasis: la timeline ya no tapa textos en ch0/ch1 ni los HUD de ch4 en
  desktop (TASK-019).
- El title corregido (TASK-032).

**Todo lo cerrado está deployado.** No hay deuda de deploy.

### Procedimiento de deploy — repetir tal cual hasta que se haga TASK-030

```
1. npm run build
2. rm -rf dist/references dist/assets/old      # IMPRESCINDIBLE
3. npx firebase-tools deploy --only hosting --non-interactive
4. curl -s -I -L https://m4to.com/references/2026.jpg | grep -i content-type
   → tiene que decir text/html (fallback SPA). Si dice image/jpeg, HAY FUGA.
```

El paso 2 no es opcional: el build copia `public/references/` (6 fotos personales
de Rafael, **cero usos en el sitio**) y 23 MB de `assets/old`. Sin él el dist pesa
39 MB; con él, 8.1 MB.

El paso 4 tiene trampa: el rewrite `** → /index.html` hace que **cualquier** ruta
inexistente devuelva 200. **El código de estado no prueba nada; el `Content-Type`
sí.**

La credencial de Rafael ya está cacheada, así que el deploy **no es interactivo** y
el orquestador lo corre solo. La CLI no está instalada global pero `npx` la
resuelve.

## 3. Decisiones de Rafael vigentes

- **TASK-041, excepción acotada (2026-07-30):** se levanta la prohibición de tocar
  `Chapter*Content.vue`, **solo** para padding/margin de la columna de contenido de
  ch2, ch3, ch4 y ch5. Sigue prohibido todo lo demás: lógica, minijuego, audio del
  módem, multitud de ch5, animaciones, shaders. Review de cierre obligatorio.
- **Alcance recortado:** solo lo visual y de contenido. Fuera: TASK-001 (CI) y
  TASK-027 (timeouts).
- **La estética la manda la spec de Fable 5**, con un límite: que no dañe la
  navegación. No consultarle decisiones de gusto. Pero **contenido tapado, cortado
  o inalcanzable se arregla igual**, con prueba geométrica.

## 4. Reglas operativas nuevas de esta sesión

- **Higiene de procesos, no negociable:** Chrome con `--user-data-dir` propio de
  nombre único, y al matar procesos **filtrar SIEMPRE por ese perfil**. Prohibido
  `Get-Process chrome | Stop-Process -Force`: ya mató todas las ventanas de Chrome
  de la máquina de Rafael una vez, irreversible.
- **Si la máquina no está quieta, no se inventa un número.** Correr `tasklist`
  antes de medir performance y reportar "no medido" si hay carga ajena. Los
  procesos `tesseract.exe` que arruinaron mediciones toda la sesión ya no están.

## 5. Fila

**TASK-041** (residuales del chasis, ya autorizado) → **TASK-018** (desbordes de
ch0/ch4 con el texto final) → **TASK-037** (los 4 GIFs de ch1) → **TASK-006** (4
bugs de cableado) → TASK-015 + TASK-016.

### Tickets abiertos

| Ticket | Qué es | Prioridad |
|---|---|---|
| TASK-030 | `public/references` y `assets/old` se publican al dist (6 fotos personales) | **alta** |
| TASK-037 | 4 GIFs de ch1 estirados 8.2 % no uniforme y tapados por contenido | **alta** |
| TASK-041 | Residuales del chasis con la excepción acotada de Rafael | **alta** |
| TASK-031 | Dron fuera de cuadro en 1920x912 + el AC#8 dice 2 planetas con texto de cuando había 3 | media |
| TASK-033 | `seoConfig.siteUrl` sigue en el placeholder `.web.app` con el sitio en m4to.com | media |
| TASK-036 | Tier C de ch6: el fallback CSS que pide la spec §8 no existe | media |
| TASK-038 | Upscale no entero en pixel art de ch0/ch4 | media |
| TASK-039 | Showcase de ch0 sin affordance de scroll en mobile | media |
| TASK-040 | Bustos: revisión visual **con Rafael** antes de tocar arte (uat-only) | media |

## 6. Pendientes de Rafael que bloquean cierres

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

## 7. Lecciones de esta sesión

1. **La variación visual no prueba que un efecto anime.** El check del ciclo de ch6
   daba verde con el ciclo apagado, porque el fondo tiene estrellas titilando y
   drones que oscilan dentro de la franja muestreada. Se atrapó midiendo la ventana
   en que el ciclo está en silencio **por diseño**.
2. **Medir cajas no es medir letras.** Dos residuales declarados "estructuralmente
   imposibles" resultaron falsos positivos: la caja del título de ch4 llega al borde
   pero el texto está centrado y arranca 33px adentro. `Range.getClientRects()`
   sobre los text nodes es el criterio correcto; la intersección de cajas se conserva
   como contexto, nunca como veredicto.
3. **Un check documentado en el encabezado de un arnés pero ausente de los
   resultados es un sensor vacío que se lee como cobertura.**
4. **Cuando un check pasa de FAIL a PASS con el MISMO número medido**, exigir por
   qué la aserción vieja era la equivocada. A veces se sostiene (`canvas == host` es
   imposible bajo zoom COVER) y a veces no.
5. **Un arnés puede medirse a sí mismo y dar un falso rojo:** el check del dial-up
   lo daba por roto, y en realidad el propio arnés desarmaba el scrim con Escape.
6. **Un test puede pasar en falso positivo por mirar solo el estado final.** Hubo
   que capturar la ventana intermedia porque la timeline sin cancelar terminaba
   alcanzando el total por su cuenta.
7. **Sexta vez** que un verde de la suite convive con un defecto real. jsdom no hace
   layout y el WebGL está mockeado.
8. **Para probar que un sensor se pone rojo no hace falta mutar `src/`**: se puede
   inducir el estado defectuoso por otra vía (activar PRM por CDP produjo el estado
   "asentado para siempre" real que el check vigila).
9. **Medir performance sin CPU throttling no sirve:** el vsync topa a ~60 antes y
   después y esconde el defecto. Y con la máquina cargada tampoco sirve: dos
   mediciones del mismo estado dieron 14.0 y 19.5 fps.
