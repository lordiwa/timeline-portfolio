# HANDOFF.md — snapshot de retoma

**Actualizado:** 2026-07-29, corte por contexto (>35%)
**Sesión:** `20260727T013114Z-db71132a`

> Fuente de verdad completa: `state/sessions/20260727T013114Z-db71132a/session.json`.
> Este archivo es el resumen operativo.

## AL RETOMAR: en este orden

1. `git log --oneline -5` y `git status`. El repo está **sincronizado con
   `origin/master`** en `6bce961`. Árbol limpio salvo `.claude/context-monitor/`
   sin trackear (scratch local, ignorable).
2. **Leer `.planning/LECCIONES-TECNICAS.md` completo antes de despachar nada.**
   Son 7 lecciones más 3 trampas del arnés CDP, todas pagadas con rondas perdidas.
3. Levantar el sitio si hace falta: `npm run dev` → http://localhost:5173/
4. **No hay nada a medio camino.** El siguiente trabajo es TASK-011 (ch5) o
   TASK-012 (ch6) — ver "Qué sigue".

---

## Qué se hizo en esta tanda (2026-07-28 → 29)

### 1. Rewrite de historial + primer push — RESUELTO, no rehacer

El repo `github.com/lordiwa/timeline-portfolio` es público y el teléfono de
Rafael vivía en el historial desde `b55dd30`, nunca pusheado.

Se reescribieron los **19 commits** de `b55dd30~1..HEAD` con
`git filter-branch --index-filter`, sustituyendo la cadena por `[REDACTADO]` en
los dos únicos archivos afectados: `src/data/contact.js` y
`.planning/GUION-TEXTOS-FINAL.md`. Verificado que **no** estaba en `tasks/` ni
`state/` (esos la describen por patrón, correcto).

Tres verificaciones antes de pushear: la cadena no sobrevive en ningún commit; el
árbol de HEAD quedó **byte-idéntico**; `origin/master` seguía siendo ancestro →
push **fast-forward sin `--force`**.

Después se purgó el PII también del clon local: rama backup borrada, reflogs
expirados, `gc --prune=now`. **Hallazgo:** tras borrar la rama el PII **seguía
alcanzable** por una `refs/stash` huérfana cuyo segundo padre era el `master`
viejo. Sin sacarla, el `gc` no purgaba nada.

**También se borró un `dist/` viejo** que contenía el número. Estaba gitignored y
nunca llegó a GitHub, pero era un vector real si se deployaba ese build. Se
reconstruyó limpio. **Lección: el grep de control tiene que barrer artefactos de
build, no sólo lo trackeado.**

Los `linked_commits` muertos de TASK-010, TASK-017 y TASK-020 se remapearon; los
17 de los 6 tickets resuelven y son alcanzables desde `master`.

### 2. TASK-025 — el "cuadrado naranja" de ch3 (CERRADO)

Era la **capa del Acto 1** (`.ch3-act1-white` + `.ch3-act1-accent`) quedándose en
`opacity:1` **y `pointer-events:auto`** encima del hero: su fade arrancaba en
`ACT1_UNITS` (3) mientras el hero ya estaba pleno desde 2.84, y
`stepToOverallVh(1)` aterriza **exactamente** en 3. Por eso scrollear destrababa.

**Segunda causa que nadie había visto:** apagar la capa en 2.84 dejaba el clímax
sin terminar de renderizarse. Como `opacity` es multiplicativo, **la muerte del
stage de Flash nunca superaba ~9% de intensidad visual**. Se veía casi apagada
desde siempre. Corregido con `P1_COMPLETE_VH`.

3 commits: `7ca7d8a` (WIP heredado) + `79e2d47` + `de34b73`.

### 3. TASK-028 — caption y umbral duplicado de ch3 (CERRADO)

El caption decía "1/8" durante ~16vh mientras el hero ya se veía pleno. Alineado
con `ACT1_FADE_END`. Y el umbral `0.05` estaba duplicado como literal en tres
lugares → `INERT_OPACITY_THRESHOLD` en `ch3Progress.js`.

2 commits: `d8f5c0c` + `343951c`.

### 4. TASK-024 — stepper horizontal (CERRADO, 6 rondas)

Ver la nota de cierre del ticket para el detalle completo. Resumen: quedó
horizontal, arriba, centrado, con más presencia (dot 40px, numeral 1.2rem,
tarjeta que calca la spec §6), flechas ←→ para el foco y ↑↓ intactas para navegar
capítulos.

**Cuatro BLOCK, ninguno cosmético.** Vale la pena leerlos en la nota del ticket
porque son la misma familia de error repetida: *reservar espacio sin verificar
qué se rompe del otro lado*.

**Estado final: cuatro bandas medidas** (reserva ≤767, Acto 1 ≤735, Acto 2 ≤525,
expandido ≤841 o ancho ≤767; la POSICIÓN del expandido es global vía `:has()`).

6 commits: `b681a00`, `18a06fd`, `641a367`, `1159ce7`, `a1d9024`, `84e972d`.

**Lo que dejó el ticket y sobrevive a él:**
- **`scripts/verify-ch3-roadmap-geometry.mjs`** — arnés CDP commiteado: 16
  viewports × 2 locales × colapsado y expandido. Antes cada verificación era
  irrepetible y un reviewer no podía auditar sus puntos ciegos.
- **12 locks** en `tests/integration/ch3-roadmap-round3-locks.test.js`, probados
  por el reviewer plantándoles 4 regresiones.
- **Tripwire de copy:** 620 caracteres sobre el `rest` de los 4 beats (ES+EN). Si
  se pule el copy de ch3 y se pasa, un test se pone rojo antes de que vuelva el
  recorte. El margen real en 844×390 es de **14px**.

---

## Tickets

| Ticket | Qué | Estado |
|---|---|---|
| TASK-024 / 025 / 028 | ch3: stepper, cuadrado naranja, caption | **CERRADOS** con review PASS |
| TASK-011 / TASK-012 | ch5 y ch6, los dos capítulos **sin texto en pantalla** | todo — **es el trabajo grande que sigue** |
| TASK-021 | ch3 scroll sensible + roadmap | in_progress — el HIGH se arregló en `c8fd6a7`, **falta re-review** |
| TASK-023 | Sacar el teléfono | in_progress — código listo, **falta re-review**; los 2 HIGH cerrados |
| TASK-026 | Tarjetas era Flash | in_progress — **falta review** |
| TASK-027 | Timeouts de mount bajo jsdom paralelo con carga | todo, media |
| TASK-015 / 016 / 018 / 019 / 022 | Cola normal | todo |
| TASK-001 / TASK-006 | **NO CERRAR.** CI nunca se hizo; los 4 bugs de cableado siguen vivos | todo |

**Gate de producto pendiente:** TASK-024 cumple sus AC y el reviewer dio juicio
visual favorable con screenshot, pero *"más visible"* tiene componente de gusto.
**Falta que Rafael mire ch3 en el navegador.**

**Bloqueado por el guard de UAT:** TASK-013, 002, 003, 004 y 005. El texto de
Rafael **ya está entregado y cargado**, verificado. Sólo falta el asiento de
aprobación. Rafael tiene que correr:

```
node "C:/Users/RafaelMatovelle/.claude/plugins/cache/hivemind-marketplace/hivemind/0.18.0/dist/loop-ctl.cjs" set-mode --repo-root "C:/Users/RafaelMatovelle/Documents/mato-new-portfolio" --mode harness
```

Al orquestador el clasificador le bloquea ese comando. **No rodearlo editando
`session.json` a mano** — es justo el guard que impide autofirmarse la aprobación.

---

## Qué sigue

**TASK-011 (ch5) y TASK-012 (ch6)**: los dos capítulos que no muestran nada del
texto de Rafael. Es el trabajo grande que queda, y ahora se puede diseñar
conociendo el largo real del guion en vez de adivinando (era5 = 4188 caracteres,
era6 = 2031).

Cuidado documentado: la multitud de 125 personajes de ch5 quedó gateada por
`activeChapter` en TASK-017 y **ese gate no se rompe** — fue una de las cuatro
cosas que se rompieron en el incidente de los 17 agentes.

---

## Lecciones de esta tanda

1. **Una redacción de PII sin commitear es frágil.** Un cambio de privacidad se
   commitea en el acto.
2. **Nunca transcribir PII dentro de un ticket.** Describir por patrón.
3. **El grep de control tiene que barrer el repo entero, incluidos artefactos de
   build.** El `dist/` viejo tenía el número.
4. **Una corrida que se cree aislada puede no estarlo.** Se caracterizó mal un
   test como determinista por asumir aislamiento sin verificar que no hubiera
   procesos del equipo multi-agente vivos. Corregido en TASK-027.
5. **Los dispatches que listan riesgos concretos encuentran defectos que
   "verificá que ande" no encuentra.** El hallazgo del clímax al 9% y los cuatro
   BLOCK de TASK-024 salieron todos de lupas puestas a propósito.
6. **Un reporte tiene que declarar qué NO cubrió.** Un commit de TASK-024 decía
   "cero solape" — literalmente cierto y aun así engañoso, porque la medición era
   ciega al recorte.
7. **Séptima confirmación:** Rafael encontró usando el sitio un bug bloqueante que
   sobrevivió a la suite Y a un reviewer independiente. **El UAT humano no es
   opcional acá.**

Las lecciones técnicas completas (7 + 3 trampas del arnés CDP) están en
`.planning/LECCIONES-TECNICAS.md`. **Leerlo antes de despachar nada.**

---

## Autorizaciones vigentes (session-scoped, re-confirmar al retomar)

- Cierre automático en review verde: **SÍ**
- Consolidación automática: **SÍ**
- Push a remoto: **SÍ** (el rewrite previo ya se hizo, no rehacerlo)
- Delegación de UAT: **NO**
- Version bump: **NO**

## Reglas de proceso

Sólo hivemind — el hook `.claude/hooks/enforce-hivemind.mjs` bloquea `Agent` y
`Workflow` fuera del equipo, y Rafael pidió no quitarlo nunca. Lista blanca de
archivos en cada dispatch. Prohibido recortar alcance en silencio. Verificar en
Chrome headed por CDP; headless no sirve. Reviewers con `model: 'fable'`.

**Los developers tienen que cerrar su Chrome y su dev server al terminar.** Una
ronda dejó 8 procesos vivos y hubo que matarlos a mano mientras Rafael estaba en
una reunión.

## Fuentes de verdad

**Diseño:** `.planning/design/00-sistema-visual-global.md` y `03-` a `06-`.
**Contenido:** `.planning/GUION-TEXTOS-FINAL.md`.
**Lecciones:** `.planning/LECCIONES-TECNICAS.md`.

Las specs ganan sobre el cuerpo de un ticket. El único límite es que no dañe la
navegación ni la legibilidad, y eso se prueba geométricamente, no a ojo.

**Nota:** `CLAUDE.md` §7.1 y §7.3 tienen dos datos desactualizados detectados en
esta tanda: la estructura de i18n es `src/i18n/*.json` (no `i18n/locales/`), y
`projects.js` **no** es todo stub — la entrada de ch3 (Pink Parrot) es real.
