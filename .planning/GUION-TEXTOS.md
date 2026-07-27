# Guion de textos del sitio — documento de trabajo de Rafael

Generado el 2026-07-27 desde el estado real del código. Todo el texto que aparece
acá es el que hoy está en el sitio, verbatim.

**Cómo usar este documento:** editá directamente sobre él. Cuando termines, me lo
devolvés y yo lo llevo a `src/i18n/es.json`, `src/i18n/en.json` y `src/data/`.
No edites los JSON a mano: la traducción ES/EN tiene que quedar pareja y hay
restricciones estructurales que se explican abajo.

---

## Índice de lo que falta

| Qué | Dónde | Estado |
|---|---|---|
| Datos de contacto | `src/data/contact.js` | **VACÍO** — 4 campos sin llenar |
| Descripciones de proyectos | 14 de 14 | **PLACEHOLDER** — todas dicen lo mismo |
| Textos de era | ch0 a ch6 | **ESCRITOS** — pulir si querés |
| Título y subtítulo de ch3 | `ch3.hero` | Escritos |
| Kickers de los beats de ch3 | 5 kickers | Escritos |

---

# PARTE 1 — La narrativa principal

Este es el corazón del sitio: un texto por era. Es lo que cuenta tu historia.

---

## Era 0 — 1995, Terminal MS-DOS

*En pantalla:* monitor CRT verde fósforo, prompt de DOS escribiendo solo, y
pantallas de juegos de la época apareciendo una tras otra.

**Texto actual:**

> Todo empezó con un DOS y siete años de edad. Mientras otros niños descubrían los
> dibujos animados, yo descubría California Games, Stunts y Out of This World. Esos
> píxeles fueron mi primer amor. Después vinieron Warcraft, StarCraft y Magic: The
> Gathering, que me enseñaron que detrás de cada mundo digital había alguien
> construyéndolo. Y yo quería ser ese alguien.

**Restricción:** ninguna. Párrafo único, se muestra completo.

**Tu versión:**

```
(escribí acá)
```

---

## Era 1 — 2001, HTML de los 90

*En pantalla:* GeoCities completo — marquee, tabla anidada, contador de visitas,
badges, fondo estrellado. Entrando a este capítulo suena el módem de 56k.

**Texto actual:**

> Empezó como un castigo por casi ser expulsado del colegio y terminó convirtiéndose
> en mi vocación. Mi primer libro de HTML/JS/CSS me lo dio mi primo, para que no me
> aburriera en unas vacaciones de verano cuando tenía 14 años — unas vacaciones en
> las que terminé castigado, prohibido de hacer todo, excepto leer y usar la
> computadora para hacer los ejercicios del libro.
>
> A los 14 agarré un libro, abrí un editor de texto y aprendí a programar solo.
> Empecé con HTML, JavaScript y CSS armando mis propios sitios web. Después salté a
> Perl, y de ahí me clavé con C++. Cada lenguaje era un mundo nuevo, otra forma de
> pensar. Para mí, programar siempre fue otro sabor de Legos: piezas que encajan,
> mundos que aparecen de la nada.
>
> En el colegio nuevo hubo un concurso de creación de páginas web. Me junté con unos
> amigos e hicimos un sitio sobre las ranas y sapos del Ecuador — HTML a mano, fotos
> escaneadas y un marquee, por supuesto. Ganamos. Los profesores no entendían cómo;
> yo no entendía qué tenía de difícil. Eran los mismos ejercicios del libro del
> castigo.
>
> En paralelo (2002–2006), viví otra vida: la de jugador profesional de StarCraft y
> Warcraft III. Cuatro años compitiendo en serio me enseñaron cosas que ningún curso
> enseña: leer sistemas en tiempo real, encontrar el patrón antes que el rival,
> manejar la presión.
>
> Y ese mundo me abrió la primera puerta laboral: entré como Game Tester en
> BlueLizard Games (BLG). Mi primera chamba fue, literalmente, hacer QA.

**Nota:** es el texto más largo del sitio (1842 caracteres). Funciona bien porque
el layout de GeoCities aguanta texto denso. Pero si querés recortarlo, hay margen.

**Tu versión:**

```
(escribí acá)
```

---

## Era 2 — 2009, Flash

*En pantalla:* stage Flash Y2K con banner vector, la batalla Flash contra Apple,
y un minijuego match-3 jugable.

**Texto actual:**

> De tester pasé a programador. En BlueLizard, Matte CG y Joju Games fui gameplay
> programmer en plena época dorada del Flash. Trabajé en títulos como Spamania 2,
> Club Paradise 2, Lost Realms 2, Megamind Amazing Machine y Nanoland. Después vino
> Bingo Blingo en Facebook, y un montón de advergames para Coca-Cola, Marlboro y
> Mulgatol.
>
> Fue una escuela brutal. Aprendí que hacer juegos es 10% magia y 90% revisar por qué
> el personaje atraviesa la pared otra vez. Y los advergames me enseñaron algo extra:
> cómo meter una marca dentro de una mecánica sin matar la diversión.

**Tu versión:**

```
(escribí acá)
```

---

## Era 3 — 2013, la muerte de Flash ⚠️ ESTRUCTURA OBLIGATORIA

*En pantalla:* Acto 1, un navegador de 2013 donde el stage Flash se muere mientras
scrolleás. Acto 2, el renacimiento flat con 5 beats numerados.

### ⚠️ Leé esto antes de editar

Este texto **se parte solo en 5 beats, uno por párrafo**. La estructura no es
libre:

- **Tienen que ser exactamente 5 párrafos**, separados por línea en blanco.
  Si ponés 4 o 6, el capítulo se rompe.
- **Beats 1 a 4:** se muestran solo las **primeras 2 oraciones** de cada párrafo,
  y el resto queda detrás de un "Seguir leyendo".
- **Beat 5:** se muestra completo, sin botón.

O sea: **las dos primeras oraciones de cada párrafo son lo que el visitante lee
sí o sí.** Ahí va lo más fuerte. Lo que quede en la tercera oración en adelante
es profundización opcional.

### Los 5 kickers (el rótulo de cada beat)

| Beat | Kicker actual |
|---|---|
| 1 | EL FINAL |
| 2 | RECONSTRUIR |
| 3 | EL MÉTODO |
| 4 | EL LÍMITE |
| 5 | EL SALTO |

**Tus kickers:** (máximo ~12 caracteres cada uno para que no se corten)

```
1.
2.
3.
4.
5.
```

### Título y subtítulo del capítulo

| Campo | Actual | Límite sugerido |
|---|---|---|
| Título | 2013. La web aprende a moverse sin plugin. | ~50 caracteres |
| Subtítulo | Flash muere en el celular y mi carrera salta con la web. | ~60 caracteres |
| Botón | La historia completa | ~22 caracteres |

**Tu versión:**

```
Título:
Subtítulo:
Botón:
```

### Los 5 párrafos

**Texto actual:**

> **Beat 1 — EL FINAL:** La muerte de Flash parecía solo eso: un final. Yo había
> crecido con él — fue lo que usé y, en buena parte, lo que fui durante años. *(lo
> siguiente queda tras "Seguir leyendo")* Pero pronto entendí que no era un entierro
> sino un salto: HTML5 y JavaScript llegaban a devolverle el movimiento a la web, y
> a mí me devolvían a ella. De vuelta al JS, de vuelta a la web interactiva.
>
> **Beat 2 — RECONSTRUIR:** Llevaba Pink Parrot entre el entusiasmo y el caos, en una
> época donde todo cambiaba a la vez — la tecnología y mi propia carrera. Las
> animaciones que antes vivían dentro del plugin ahora había que reconstruirlas desde
> cero, con reglas nuevas que nadie terminaba de dominar. *(tras el botón)* Aprendí
> mucho por necesidad, y así se aprende mejor.
>
> **Beat 3 — EL MÉTODO:** Fue en ese desorden donde el ágil dejó de ser teoría de
> slides y se volvió forma de pensar. Los sprints eran la diferencia entre entregar y
> hundirse; las retros, el momento de ser honesto sobre lo que no había funcionado.
> *(tras el botón)* Más que un proceso, se volvió mi manera de ordenar el caos y
> crecer como profesional.
>
> **Beat 4 — EL LÍMITE:** La publicidad digital de esa era todavía sorprendía al
> usuario. Había espacio para experimentar con la interactividad, para construir
> cosas que se sentían nuevas porque lo eran. *(tras el botón)* Trabajé justo en ese
> límite entre comunicación y código, entre lo que una marca quería decir y lo que la
> web por fin era capaz de hacer.
>
> **Beat 5 — EL SALTO (completo):** Fue una época de crecer en todos los frentes. No
> todo salió bien, pero todo dejó algo — y lo que parecía la muerte de Flash terminó
> siendo mi salto de vuelta a la web interactiva.

**Tu versión:** (5 párrafos, línea en blanco entre cada uno)

```
(párrafo 1)

(párrafo 2)

(párrafo 3)

(párrafo 4)

(párrafo 5)
```

---

## Era 4 — 2015-2018, AR/VR

*En pantalla:* túnel WebGL con óptica de headset, paneles flotando en profundidad.

**Encabezado del capítulo:** Del movimiento a nuevas realidades

**Texto actual:**

> Monté un proyecto independiente de Realidad Virtual y Realidad Aumentada aplicadas
> a publicidad BTL. Fueron tres años haciendo cosas que casi nadie estaba haciendo
> todavía en Ecuador: experiencias de marca donde el usuario era parte del juego, no
> espectador.
>
> Después llegó Metrodigi, y con ella mi primera fase real como líder. Priorizar,
> desbloquear, proteger al equipo del ruido, y todavía codear. Esta etapa me enseñó
> algo clave: me encanta el momento en que una idea pasa de «¿y si...?» a «mira,
> funciona», y me encanta todavía más cuando es el equipo entero el que llega ahí.

**Tu versión:**

```
Encabezado:

(texto)
```

---

## Era 5 — 2019-2024, pandemia y streaming ⚠️ HOY NO SE VE

*En pantalla:* sala de cine con multitud de 125 personas y una pantalla
transmitiendo.

**⚠️ Este texto está escrito pero HOY NO SE MUESTRA en el sitio.** El capítulo
tiene 0 caracteres visibles. Lo destapa TASK-011, que además va a anclar el
capítulo en VivoEnVivo como producto tuyo, no como una tele genérica.

**Texto actual:**

> En number8 lideré QA como Lead Software QA Engineer durante casi tres años,
> trabajando con AWS y armando procesos desde cero. Después, en BairesDev, entré al
> equipo de R&D para hacer automatización de pruebas para data science, todo con
> Python. Era otro juego: no validar clicks ni formularios, sino pipelines que medían
> modelos, datasets y comportamiento estadístico — bugs que se parecen más a sesgos,
> drifts y edge cases que a errores de lógica clásica. Aquí descubrí algo que cambió
> cómo veo el software: la calidad no es algo que se revisa al final, es algo que se
> construye desde el inicio.
>
> En paralelo (2019–2024) fui copropietario de VivoEnVivo, una plataforma de
> streaming de eventos y deportes de contacto en Ecuador. Cinco años aprendiendo lo
> que es construir algo tuyo de cero.
>
> En RocketSnail lideré el frontend creando un framework custom con Vue y Lottie.
> Después, en Remoose Interactive, trabajé como Full Stack Engineer y rapid prototyper
> en el equipo de R&D. Vue, Node.js, WebGL, todo el stack.

**Pregunta que te dejo:** la pandemia no aparece nombrada en el texto, pero el
capítulo entero está diseñado alrededor de ella (transmisión, distancia, la
multitud). ¿Querés que el texto la nombre, o preferís que quede solo en lo visual?

**Tu versión:**

```
(escribí acá)
```

---

## Era 6 — 2026, cierre ⚠️ HOY NO SE VE

*En pantalla:* escena espacial que se disuelve en ASCII, pasa por binario, y
termina en un prompt de terminal igual al de 1995. Cierra el círculo.

**⚠️ Este texto está escrito pero HOY NO SE MUESTRA.** Lo destapa TASK-012, que
lo va a hacer llegar en streaming, token por token, como si lo escribiera una IA.

**Texto actual:**

> Y desde finales de 2023 sigo en Software Mind aplicando automatización y
> herramientas a data science. Y ahora la IA y los agentes me dan algo que llevo
> esperando desde que tenía siete años jugando en DOS: la capacidad de construir todo
> lo que siempre quise, automatizarlo, y prototipar a la velocidad de la imaginación.
>
> Mirando para atrás, todo encaja raro de bien. Los años de competitivo me dieron la
> cabeza de sistemas. Los juegos Flash me dieron la velocidad de iterar. Los
> advergames me enseñaron a contar historias dentro del código. La web me dio el
> lienzo y el ágil. AR/VR me enseñó a prototipar lo imposible. Liderar equipos me
> enseñó que el código solo no construye nada grande. QA me dio el rigor. Data
> science me dio los datos.
>
> Cada etapa parecía un salto. Vista de lejos, era una sola línea.

**Falta la frase final.** El diseño de ch6 pide que el cierre declare
explícitamente que el portfolio lo construiste vos junto a una flota de agentes,
y que esa última frase alterne autor **palabra por palabra** — una tuya, una de
la IA, una tuya. Es el remate del sitio entero.

**Tu frase de cierre:**

```
(escribí acá — pensala como una sola frase que se pueda partir palabra por palabra
entre vos y la IA)
```

**Tu versión del texto:**

```
(escribí acá)
```

---

# PARTE 2 — Los 14 proyectos ⚠️ TODOS EN PLACEHOLDER

Los 14 dicen exactamente lo mismo: *"Reseña en preparación — pronto con el detalle
completo."*

**Límite:** ~120 caracteres por descripción. Es una tarjeta, no un párrafo. Pensá
en una línea que diga qué hiciste y por qué importó.

| # | Capítulo | Proyecto | Tu descripción |
|---|---|---|---|
| 1 | ch2 | BlueLizard Games | |
| 2 | ch2 | Matte CG | |
| 3 | ch2 | Joju Games | |
| 4 | ch3 | ⚠️ **SIN NOMBRE** — proyecto Pink Parrot | |
| 5 | ch4 | ARVR Studio (empresa propia) | |
| 6 | ch4 | Metrodigi | |
| 7 | ch5 | number8 | |
| 8 | ch5 | BairesDev | |
| 9 | ch5 | VivoEnVivo | |
| 10 | ch5 | RocketSnail | |
| 11 | ch5 | Remoose | |
| 12 | ch6 | Empresa propia AR/VR | |
| 13 | ch6 | Remoose Interactive | |
| 14 | ch6 | Software Mind NA | |

**Dos cosas para resolver:**

1. **El proyecto #4 no tiene nombre.** Hoy su título literal en el sitio dice
   `PENDING — CONTENT-CHECKLIST §2.2 (nombre proyecto #1 Pink Parrot ES)`. Necesito
   el nombre real.
2. **Hay proyectos repetidos entre capítulos.** "Empresa propia AR/VR" aparece en
   ch4 y en ch6; "Remoose" aparece en ch5 y ch6. ¿Es intencional (aparecen dos veces
   porque abarcan dos épocas) o hay que dejar cada uno en un solo capítulo?

---

# PARTE 3 — Contacto ⚠️ VACÍO

`src/data/contact.js` tiene los 4 campos en blanco. Sin esto el HUD de contacto no
lleva a ningún lado.

```
Email:
LinkedIn:
GitHub:
Otro (opcional — X, Bluesky, sitio personal):
```

---

# PARTE 4 — Textos de interfaz

Son cortos y funcionales. Revisalos solo si algo te suena mal.

## Títulos de capítulo (los que muestra la línea de tiempo)

| Era | Año | Título |
|---|---|---|
| 0 | 1995 | Pre-carrera: niñez digital |
| 1 | 2001 | Pre-carrera tardío: HTML 90s |
| 2 | 2009 | Flash era: gameplay programmer |
| 3 | 2013 | Web 2.0: UX + dev + líder |
| 4 | 2015 | AR/VR: empresa propia + Metrodigi |
| 5 | 2022 | Modern: streaming, QA, frontend lead |
| 6 | 2026 | Convergencia: QA + AI |

**Observación:** los títulos de las eras 0 y 1 dicen "Pre-carrera", que suena a
que esos años no cuentan. Contás una historia de tres décadas donde justamente el
punto es que todo cuenta. Vale repensarlos.

## Frases de ambiente

| Era | Frase |
|---|---|
| 0 | 1995. Monitor CRT phosphor. Mi primer prompt de comandos. |
| 1 | GeoCities, Angelfire, tablas anidadas y marquees por doquier. |
| 2 | Era Flash 2009. ActionScript, banners vector, gameplay arcade. |
| 4 | Era AR/VR 2015-18. Paneles holográficos, profundidad espacial, AR aplicado a publicidad y entrenamiento. |
| 5 | Era Modern 2022-23. Frontend lead, QA leadership, streaming, convergencia QA + AI. |
| 6 | 2026. Convergencia: dev + QA + AI en un solo espacio. La nave aterriza. |

**Falta la de la era 3.** Las otras seis la tienen.

## El mantra

Aparece en el pie de todos los capítulos:

> Y siempre con una sonrisa. 😄

En la era 6 aparece una variante sin el emoji: *"Y siempre muestra una sonrisa"*.
¿Querés que queden iguales o la diferencia es a propósito?

## Otros textos sueltos

| Dónde | Texto |
|---|---|
| Botón de proyecto | Ver proyecto → |
| Cerrar overlay | Cerrar |
| Parte de guerra (ch2) | PARTE DE GUERRA |
| Guerra Flash (ch2) | La gran guerra: Flash vs Apple · 2010 |
| Muerte de Flash (ch3) | La muerte de Flash |
| Beats ch3 | Seguir leyendo / Cerrar |
| Nota del teléfono (ch3) | El plugin nunca llegó aquí |
| Barra del navegador (ch3) | Se bloqueó el complemento Adobe Flash Player |
| Botón del navegador (ch3) | Ejecutar esta vez |
| HUD de ch4 | INICIANDO SISTEMA ÓPTICO / CALIBRANDO SEGUIMIENTO / REALIDAD LISTA |
| Pantalla de arranque | INICIAR CON SONIDO / INICIAR SILENCIADO / PRESIONA CUALQUIER TECLA PARA CONTINUAR / SALTAR ▸ |
| Módem (ch1) | Marcando 555-GEOCITIES... / Verificando nombre de usuario y contraseña... / Conectado a 56,000 bps |
| Marquee (ch1) | ★ Bienvenido a mi página web!! ★ 🚧 En construcción 🚧 |
| Tabla (ch1) | Mis cosas favoritas (1999) |

## SEO — lo que ve Google

| Campo | Texto |
|---|---|
| Título | Rafael Matovelle · Full Stack & QA |
| Descripción | Portafolio de Rafael Matovelle: ingeniero full stack y QA con raíces en gamedev y tres décadas de tecnología. |

---

# PARTE 5 — Notas

## Sobre la raya larga (—)

El texto usa raya larga en varios lugares. La dirección de arte decidió que **el
texto nuevo no la use**, para mantener consistencia tipográfica de época. Si
reescribís algo, usá coma, punto o paréntesis en su lugar. Los que ya están se
resuelven en el pase final.

## Sobre el inglés

Todo lo de acá tiene su gemelo en `src/i18n/en.json`. Cuando me devuelvas los
textos en español yo hago la versión en inglés, salvo que prefieras escribirla vos
—en cuyo caso decímelo y te armo el mismo documento en inglés.

Dos pantallas (el arranque y la terminal de DOS) tienen texto en inglés
hardcodeado que no pasa por el sistema de traducción. Es un defecto conocido, lo
arreglo aparte.

## Sobre las edades

El sitio dice que naciste en 1984. Las edades de los textos de avatar (11 años en
1995, 17 en 2001, 25 en 2009, 29 en 2013, 32 en 2015, 38 en 2022, 42 en 2026)
salen de ahí. Si alguna no calza, avisame.
