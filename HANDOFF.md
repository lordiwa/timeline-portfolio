# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-07-28, pausa por corte de internet
**Sesión:** `20260727T013114Z-db71132a`

> Fuente de verdad completa: `state/sessions/20260727T013114Z-db71132a/session.json`.
> Este archivo es el resumen operativo.

## AL RETOMAR: en este orden

1. `git log --oneline -10` y `git status`. Deben verse **36 commits sin push**.
2. **Leer "Lo que quedó a medias" acá abajo antes de despachar nada.**
3. Levantar el sitio: `npm run dev` → http://localhost:5173/
4. Retomar TASK-025, que es lo único abierto a medio camino.

---

## Lo que pasó en esta tanda

Rafael usó el sitio en vivo mientras corrían agentes en paralelo. Encontró en
minutos dos cosas que ni la suite ni un reviewer independiente habían visto.

**Cerrado y commiteado:**

| Commit | Qué |
|---|---|
| `7d69ef3` | Saca el teléfono de Rafael del ContactHUD y de `contact.js` |
| `c8fd6a7` | Mata la cascada de `vi.doMock` de Ch2MiniGame bajo vitest paralelo |
| `652be19` | Corrige la atribución cruzada de las 3 tarjetas de la era Flash |
| `9883bee` | Redacta el teléfono del guion de textos |
| `4caa7b2` | **WIP sin terminar de TASK-025**, ver abajo |

---

## Lo que quedó a medias — TASK-025, leer completo

El developer del **cuadrado naranja de ch3** fue **detenido a mitad**, justo
cuando iba a commitear. Su último mensaje decía que tenía todo verde, pero
**no alcanzó a correr su checklist de pre-entrega ni a reportar la causa raíz**.

Su trabajo está preservado en `4caa7b2` (89 inserciones sobre
`src/utils/ch3Progress.js` y `tests/utils/ch3Progress.test.js`). Es un commit de
preservación, **no es una entrega**.

**Falta, y sin esto no se cierra:**
- Qué era el cuadrado naranja concretamente. Nadie lo reportó todavía.
- Verificar los 8 pasos del roadmap, adelante y atrás.
- La medición geométrica en Chrome headed.
- **TASK-024 entero**, que iba después y ni se empezó.

**Al retomar:** verificar ese diff contra los AC de TASK-025, correr la suite, y
decidir si se completa sobre eso o se descarta y se redespacha limpio.

### El bug, en palabras de Rafael

> "en ch3 termina en un cuadrado naranja sobere el texto y no se puede ni leer ni
> clickear el boton hasta dragear un poco para reproducri solo dar click en step 2"

La pista más valiosa es que **scrolleando un poco se destraba**: el salto por
click deja el capítulo en un estado que el siguiente frame de scroll corrige.

---

## PENDIENTE CRÍTICO ANTES DEL PRIMER PUSH

**No pushear sin hacer esto primero.** Rafael lo autorizó explícitamente el
2026-07-28.

El repo `github.com/lordiwa/timeline-portfolio` es **público** (verificado). El
teléfono de Rafael está en el historial desde `b55dd30` y **nunca se pusheó**.
Sacarlo de los archivos no lo saca del historial.

El número cargado difería del real en **un solo dígito**, o sea trivialmente
enumerable. "Estaba mal igual" no es mitigación.

**Decisión de Rafael: reescribir el historial y recién ahí pushear.** Como nada
está pusheado, el rewrite es gratis y sin riesgo.

**Costo conocido y aceptado:** cambia el hash de ~20 commits, así que los
`linked_commits` de los tickets quedan apuntando a hashes muertos. Es
contabilidad interna; reconstruirla después del rewrite.

**Hacerlo con CERO agentes corriendo.** Reescribir bajo agentes activos les
corrompe el trabajo.

---

## Tickets

| Ticket | Qué | Estado |
|---|---|---|
| TASK-025 | Cuadrado naranja de ch3 | **in_progress, WIP en `4caa7b2`** — crítico, Rafael lo sufre |
| TASK-024 | Stepper horizontal, arriba, centrado, más visible | in_progress, **sin empezar** |
| TASK-021 | ch3 scroll sensible + roadmap | in_progress — el HIGH ya se arregló en `c8fd6a7`, **falta re-review** |
| TASK-023 | Sacar el teléfono | in_progress — código listo, **falta re-review**; los 2 HIGH ya se cerraron |
| TASK-026 | Tarjetas era Flash | in_progress — **falta review** |
| TASK-027 | Tests flaky por timeout bajo carga | todo, media |
| TASK-011 / TASK-012 | ch5 y ch6, los dos capítulos sin texto en pantalla | todo — **es el trabajo grande que sigue** |
| TASK-015 / 016 / 018 / 019 / 022 | Cola normal | todo |
| TASK-001 / TASK-006 | **NO CERRAR.** CI nunca se hizo; los 4 bugs de cableado siguen vivos | todo |

**Bloqueado por el guard de UAT:** TASK-013, 002, 003, 004 y 005. El texto de
Rafael **ya está entregado y cargado**, verificado. Solo falta el asiento de
aprobación. Rafael tiene que correr:

```
node "C:/Users/RafaelMatovelle/.claude/plugins/cache/hivemind-marketplace/hivemind/0.18.0/dist/loop-ctl.cjs" set-mode --repo-root "C:/Users/RafaelMatovelle/Documents/mato-new-portfolio" --mode harness
```

Al orquestador el clasificador le bloquea ese comando. **No rodearlo editando
`session.json` a mano** — es justo el guard que impide autofirmarse la aprobación.

---

## Lecciones nuevas de esta tanda

1. **Una redacción de PII sin commitear es frágil.** Se redactó el teléfono del
   guion y quedó en el working tree mientras corrían tres agentes. Uno lo
   revirtió temporalmente para no commitear trabajo ajeno, y el número volvió a
   un commit. **Regla: un cambio de privacidad se commitea en el acto.**
2. **Nunca transcribir PII dentro de un ticket.** El número real de Rafael
   terminó escrito en el ticket que pedía eliminarlo. Describir por patrón.
3. **Un grep de control acotado a `src/` y `tests/` no alcanza.** Barrer el repo
   entero: `.planning/`, `tasks/` y `state/` también se commitean.
4. **Sexta confirmación del patrón:** Rafael encontró usando el sitio 10 minutos
   un bug bloqueante que sobrevivió a la suite completa Y a un reviewer
   independiente. jsdom no hace layout. **El UAT humano no es opcional acá.**
5. **La condición normal de este proyecto es multi-agente.** Un test verde en una
   máquina tranquila no prueba nada: la cascada de Ch2MiniGame solo aparecía con
   dos procesos de vitest a la vez. Verificar bajo contención real.

Las 7 lecciones anteriores siguen en `.planning/LECCIONES-TECNICAS.md`. **Leerlo
antes de despachar nada.**

---

## Autorizaciones vigentes (session-scoped, re-confirmar al retomar)

- Cierre automático en review verde: **SÍ**
- Consolidación automática: **SÍ**
- Push a remoto: **SÍ, pero solo después del rewrite de historial**
- Delegación de UAT: **NO**
- Version bump: **NO**

## Reglas de proceso

Solo hivemind — el hook `.claude/hooks/enforce-hivemind.mjs` bloquea `Agent` y
`Workflow` fuera del equipo, y Rafael pidió no quitarlo nunca. Lista blanca de
archivos en cada dispatch. Prohibido recortar alcance en silencio. Verificar en
Chrome headed por CDP; headless no sirve.

## Fuentes de verdad

**Diseño:** `.planning/design/00-sistema-visual-global.md` y `03-` a `06-`.
**Contenido:** `.planning/GUION-TEXTOS-FINAL.md`.
**Lecciones:** `.planning/LECCIONES-TECNICAS.md`.

Las specs ganan sobre el cuerpo de un ticket. El único límite es que no dañe la
navegación ni la legibilidad.
