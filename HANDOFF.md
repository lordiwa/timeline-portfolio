# HANDOFF.md — Sesion PAUSADA

**Pausada:** 2026-07-27, a pedido de Rafael
**Sesion:** 20260727T013114Z-db71132a

> La fuente de verdad completa es `state/sessions/20260727T013114Z-db71132a/session.json`.
> Este archivo es el resumen operativo para retomar rapido.

## Objetivo

Rafael califico la belleza del sitio en 0/10 y pide 10/10, con el estandar declarado de
que parezca un sitio de 50.000 dolares. Hasta Flash (ch0, ch1, ch2) le gusta; desde la
muerte de Flash (ch3 en adelante) lo siente desordenado y que no evoca lo que cada era
representa. Autorizo cambiar todo el arte y todo el estilo.

## ATENCION AL RETOMAR: hay un developer que quedo corriendo

Cuando Rafael pauso, habia un `hivemind:developer` trabajando en **TASK-014**. Se lo
dejo terminar a proposito: matarlo a mitad podia dejar archivos editados sin commit,
que es peor que dejarlo cerrar.

**Primer paso al retomar:** correr `git log --oneline -5` y ver si aparece un commit de
TASK-014. Si aparece, ese trabajo NO esta verificado ni revisado todavia: hay que
verificarlo en navegador y mandarlo al reviewer antes de cerrarlo. Si no aparece, el
ticket sigue en `in_progress` sin trabajo landeado y hay que re-despacharlo.

## Estado de los tickets

| Ticket | Que es | Estado |
|---|---|---|
| TASK-008 | Tokens y chasis | **DONE**, review verde, 2 commits |
| TASK-014 | Shell de scroll multi-viewport | in_progress, developer quedo corriendo |
| TASK-009 | ch3 muerte de Flash | **blocked** por TASK-014, commit `672ca4a` ya en master |
| TASK-010 | ch4 salto entre realidades | todo |
| TASK-011 | ch5 pandemia broadcast | todo |
| TASK-012 | ch6 climax terminal IA | todo |
| TASK-013 | Cierre de contenido | todo, uat-only, PARA en Gate 2 a proposito |

## Commits de esta sesion, todos locales y sin push

- `3f0e91d` feat(TASK-008): sistema de tokens y chasis RAFAEL-OS
- `1c4ec06` fix(TASK-008): font-body section-only, easing sin overshoot, corner marks
- `672ca4a` feat(ch3): rediseño total "la muerte de Flash" a flat 2013 (TASK-009)

## Por que TASK-009 quedo bloqueado

Verificacion en navegador encontro que el contenido de ch3 quedo dentro de un
contenedor `.ch3-stage` con scrollHeight 4181 px dentro de clientHeight 735 px y
`overflow-y: auto`, con 31 elementos de texto fuera de pantalla. Ese scroll anidado
compite con el `scroll-snap-type: y mandatory` del shell, asi que el visitante puede
saltar al capitulo siguiente sin ver el Acto 2.

No fue culpa del developer: `App.vue` y `ScrollShell.vue` estaban fuera de la lista
blanca de todos los tickets de capitulo. Rafael decidio crear TASK-014 para que el
shell acepte capitulos altos con anclaje real, y despues ch3 se adapta.

El trabajo de ch3 NO se descarta: el rediseño flat de 2013 esta bien, el innerText
subio de 91 a 1954 caracteres verificado en navegador, y el Acto 2 se ve
autenticamente 2013. Solo cambia el mecanismo de recorrido.

## Pendientes registrados en el comentario de TASK-009

Verificacion visual a 1440x900 y 1366x768 y en mobile; la tipografia Open Sans que no
se pudo self-hostear por lista blanca; la capa scroll-driven nativa sin verificar;
los assets huerfanos de Kingdom en `public/assets/` que hay que archivar a `old/` con
entry en CHANGELOG segun CLAUDE.md §6.5; la base `.project-card` sin scope que no se
pudo migrar porque ch2 y ch5 dependen de ella; y `@fontsource/lobster` importado sin
consumidor.

## LIMITACION DE ENTORNO, sin resolver

La ventana de Chrome esta OCULTA. Con `visibilityState: hidden` Chrome estrangula
timers, rAF y scroll suave. Medido en esta sesion: el scroll suave no avanza (hay que
usar `behavior: 'instant'`), el watcher del dial-up nunca dispara, Phaser queda pausado,
y el renderer llego a congelarse dos veces al capturar pantalla.

Se puede verificar DOM, innerText, layout, estilos computados y consola. NO se puede
verificar nada animado: shaders de ch4, escena de ch6, multitud de ch5, minijuego de
ch2 ni el audio del modem. Rafael tiene que traer la ventana al frente; se le pidio
cuatro veces.

## Baseline vigente (el antes, para probar que nada se rompio)

Dev server en `http://localhost:5176/`, viewport 1536x791.

innerText por capitulo: ch0 437 a 457 (varia, la terminal escribe en vivo), ch1 1842,
ch2 262 a 309 (varia, contadores dinamicos del stage), ch3 1954 (era 91 antes del
rediseño), ch4 1103, ch5 0, ch6 0. Los ceros de ch5 y ch6 son defectos conocidos que
arreglan TASK-011 y TASK-012.

Canvas del minijuego de ch2: 360x420. Shell: scrollHeight 5146, clientHeight 735.
Avatar, timeline y HUD presentes. Consola sin errores, unico warning el conocido de
`marquee` sin `isCustomElement`.

Modem de 2001: confirmado funcionando con un espia sobre `AudioContext` que conto 125
osciladores y 50 buffer sources al entrar al capitulo. El trigger es un watcher sobre
`activeChapter` en `DialUpScreen.vue` mas `sessionStorage.rm-dialup-seen`.

## Reglas de proceso, en 150 caracteres

Baseline primero. Un capitulo por commit. Lista blanca de archivos. Verifico en Chrome
antes de commitear. Solo hivemind. Locks de no-regresion.

## Autorizaciones del loop, session-scoped

Cierre automatico en review verde SI. Consolidacion automatica SI. Delegacion de UAT
NO. Push a remoto NO. Version bump NO. Rafael debe re-confirmarlas al retomar, porque
no persisten entre sesiones.

## Especificaciones de direccion de arte, fuente de verdad de los tickets

- `.planning/design/00-sistema-visual-global.md`
- `.planning/design/03-ch3-muerte-de-flash.md`
- `.planning/design/04-ch4-salto-entre-realidades.md`
- `.planning/design/05-ch5-pandemia-broadcast.md`
- `.planning/design/06-ch6-climax-terminal-ia.md`

## Al retomar

1. Leer `state/session.json`, despues el bundle de la sesion.
2. Revisar `git log` por el commit de TASK-014, segun la seccion de arriba.
3. Re-confirmar con Rafael las autorizaciones del loop antes de volver a modo loop.
4. No despachar nada fuera de hivemind: el hook `.claude/hooks/enforce-hivemind.mjs`
   lo bloquea y Rafael pidio no quitarlo nunca.
