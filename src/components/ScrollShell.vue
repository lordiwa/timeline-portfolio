<script setup>
// ScrollShell.vue
// Componente raíz scrolleable de Phase 1.
//
// Renderiza 7 ChapterSection inline + CSS scroll-snap-y mandatory.
//
// Diseño: las 7 sections viven inline (no componente separado) para mantener
// el código corto y verifiable. Phase 2 podría extraerlas si themes lo justifican.
//
// El `<main>` raíz se expone vía defineExpose({ shellEl }) para que App.vue
// pueda asignar la referencia DOM al shellRef que useScrollState está observando.
//
// Plan 05 (Wave 4): añade keyboard handlers ↑/↓/j/k/Home/End con clamping a
// [0..6] y PRM-aware behavior (D-04). El composable useScrollState provee
// activeChapter (para calcular target) y scrollToChapter (canonical method).
// usePRM provee prefersReduced para el branch behavior smooth/auto.
//
// El `.prevent` modifier de Vue llama event.preventDefault() declarativamente
// — esto bloquea que el browser intente hacer scroll por defecto con flechas
// (lo que causaría doble-trigger del scroll snap + nuestro scrollToChapter).
//
// TASK-014 (2026-07-27): prop `chapterViewports` — mecanismo multi-viewport
// con anclaje real (position: sticky). Único ticket autorizado a tocar este
// archivo, App.vue y useScrollState.js para resolver el problema medido en
// TASK-009: un capítulo que necesita más de 1 viewport de alto no tenía
// dónde crecer y terminaba con scroll anidado (.ch3-stage con overflow-y:
// auto) que compite con el scroll-snap mandatory del shell. Ver el comentario largo
// junto a `.chapter-section[data-viewports]` en el <style scoped> de abajo
// para el mecanismo completo y cómo lo consume un ticket de capítulo.
// Default `{}` → los 7 capítulos actuales quedan en 1 viewport, CERO cambio
// visual (ninguno usa este prop todavía).

import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Chapter0Content from './Chapter0Content.vue'
import Chapter1Content from './Chapter1Content.vue'
import Chapter2Content from './Chapter2Content.vue'
import Chapter3Content from './Chapter3Content.vue'
import Chapter4Content from './Chapter4Content.vue'
import Chapter5Content from './Chapter5Content.vue'
import Chapter6Content from './Chapter6Content.vue'

// Single source of truth para los chapters de Phase 1. Copiado de UI-SPEC §7.1.
const chapters = [
  { id: 0, year: 1995, era: 'Terminal' },
  { id: 1, year: 2001, era: 'HTML 90s' },
  { id: 2, year: 2009, era: 'Flash' },
  { id: 3, year: 2013, era: 'Web 2.0' },
  { id: 4, year: 2015, era: 'AR/VR' },
  { id: 5, year: 2022, era: 'Modern' },
  { id: 6, year: 2026, era: 'Phaser' },
]

const props = defineProps({
  // TASK-014: mapa opcional { [chapterId]: viewportsCount }. Un capítulo
  // ausente del mapa (o con valor <= 1) queda en 1 viewport (comportamiento
  // shipped, sin cambios). Ningún caller pasa este prop todavía — App.vue
  // monta <ScrollShell /> sin él, así que su valor efectivo hoy es `{}`.
  chapterViewports: {
    type: Object,
    default: () => ({}),
  },
})

const { t } = useI18n()
const shellEl = ref(null)

// LOW (ronda de corrección de review): ningún capítulo real necesita medir
// decenas de viewports — un valor absurdo (ej. `{ 3: 1000 }`, typo o data
// corrupta) generaría una sección de miles de vh y un scroll interminable.
// Clamp defensivo: 12 viewports (~4x el capítulo más alto previsto en la
// spec de dirección de arte) es generoso sin ser ilimitado.
const MAX_CHAPTER_VIEWPORTS = 12

// viewportsFor(id) — normaliza props.chapterViewports[id] a un entero en
// [1, MAX_CHAPTER_VIEWPORTS]. Cualquier valor no-entero o <= 1 colapsa a 1
// (mismo comportamiento shipped); cualquier valor > MAX_CHAPTER_VIEWPORTS
// se recorta al máximo.
function viewportsFor(id) {
  const n = props.chapterViewports[id]
  if (!Number.isInteger(n) || n <= 1) return 1
  return Math.min(n, MAX_CHAPTER_VIEWPORTS)
}

// Inject del scrollState (provisto por App.vue desde Plan 02) y del prm (Plan 03).
// Esta es la primera vez que ScrollShell consume el composable directamente —
// antes solo exponía el shellEl ref para que App.vue lo pasara al composable.
const { activeChapter, scrollToChapter } = inject('scrollState')
const { prefersReduced } = inject('prm')

// navigate(delta) — handler centralizado para los 6 keydown.
// delta puede ser:
//   - Number (-1 | +1): mover relativo al activeChapter actual, con clamping [0..6]
//   - 'home': ir a 0
//   - 'end': ir a 6
// El behavior se decide aquí (D-04): bajo PRM, 'auto' (jump instantáneo);
// default, 'smooth' (browser anima scrollTop).
function navigate(delta) {
  let target
  if (delta === 'home') target = 0
  else if (delta === 'end') target = 6
  else target = Math.max(0, Math.min(6, activeChapter.value + delta))
  scrollToChapter(target, prefersReduced.value ? 'auto' : 'smooth')
}

defineExpose({ shellEl })
</script>

<template>
  <main
    id="main-content"
    class="scroll-shell"
    tabindex="0"
    ref="shellEl"
    @keydown.up.prevent="navigate(-1)"
    @keydown.down.prevent="navigate(1)"
    @keydown.home.prevent="navigate('home')"
    @keydown.end.prevent="navigate('end')"
    @keydown.j.prevent="navigate(1)"
    @keydown.k.prevent="navigate(-1)"
  >
    <section
      v-for="ch in chapters"
      :key="ch.id"
      :id="`chapter-${ch.id}`"
      :data-chapter="ch.id"
      :data-viewports="viewportsFor(ch.id) > 1 ? viewportsFor(ch.id) : null"
      :style="viewportsFor(ch.id) > 1 ? { '--chapter-viewports': viewportsFor(ch.id) } : null"
      :aria-label="t('chapters.' + ch.id + '.title')"
      class="chapter-section"
    >
      <Chapter0Content v-if="ch.id === 0" />
      <Chapter1Content v-else-if="ch.id === 1" />
      <Chapter2Content v-else-if="ch.id === 2" />
      <Chapter3Content v-else-if="ch.id === 3" />
      <Chapter4Content v-else-if="ch.id === 4" />
      <Chapter5Content v-else-if="ch.id === 5" />
      <Chapter6Content v-else-if="ch.id === 6" />
      <!-- defensive: dead-branch post-Phase 5 — protege contra futuro ch7+
           si Rafael añade un chapter sin component dedicado. -->
      <div v-else class="chapter-placeholder">
        <p class="era-title">{{ ch.year }} · {{ ch.era }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * ScrollShell root
 * - CORE-01: scroll-snap-type: y mandatory
 * - CORE-08: 100vh fallback + 100dvh (older Safari fallback first)
 * - iOS-01: -webkit-overflow-scrolling: touch
 * - A11Y-02 (parcial): outline none → :focus-visible se sobreescribe en Plan 06
 * ───────────────────────────────────────────────────────────────────────── */
.scroll-shell {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  outline: none;
}

/* ─────────────────────────────────────────────────────────────────────────
 * ChapterSection
 * - CORE-02 (parcial): cada section es un viewport-height block
 * - CORE-04: scroll-snap-align: start + scroll-snap-stop: always (no skipping)
 * - CORE-08: 100vh fallback + 100dvh
 * - UI-SPEC §7.1: flex center para alinear el era title
 * ───────────────────────────────────────────────────────────────────────── */
.chapter-section {
  height: 100vh;
  height: 100dvh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  /* Fix arquitectural chapter-overlap bleed (Rafael 2026-05-17):
   * CUALQUIER child absoluto o con transform (ScrollRevealCard transforms,
   * GIFs ch1, starbursts ch3) puede sobresalir del section sin overflow:hidden.
   * Pattern 12 NO aplica aquí — el test ch6-overlap T2 prohíbe overflow:hidden
   * sólo en .ch{N}-layout (creaba stacking context que rompía scroll-snap),
   * NO en .chapter-section. */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Transparente — BackgroundLayers (z:-1) pinta --c-bg + --bg-image (D2-04). */
  background: transparent;
  color: var(--c-fg);
}

/* ─────────────────────────────────────────────────────────────────────────
 * TASK-014 — mecanismo multi-viewport con anclaje real (position: sticky).
 *
 * PROBLEMA que resuelve: antes de este ticket cada .chapter-section medía
 * EXACTAMENTE 1 viewport. Un capítulo que necesita más alto (ej. TASK-009,
 * ch3) no tiene dónde crecer dentro del shell y termina metiendo su propio
 * scroll interno (overflow-y: auto) — ese scroll anidado compite con el
 * scroll-snap mandatory del shell y permite saltarse el capítulo entero sin
 * haberlo recorrido (bug medido en vivo, ver tasks/TASK-014.json).
 *
 * MECANISMO: la sección puede declarar `data-viewports="N"` (N entero > 1,
 * vía el prop `chapterViewports` de este componente, ej. `{ 3: 5 }` para que
 * ch3 mida 5 viewports) y este bloque multiplica su altura por
 * `--chapter-viewports`. NINGÚN capítulo lo usa todavía — los 7 quedan en
 * viewports:1 por default (el atributo `data-viewports` no se renderiza y
 * este bloque nunca aplica) → CERO cambio visual, cero riesgo de regresión
 * en ch0/ch1/ch2 ni en ningún otro capítulo shipped.
 *
 * CÓMO LO CONSUME UN TICKET DE CAPÍTULO (ej. TASK-009 retomando ch3):
 *   1. En App.vue, pasar `:chapter-viewports="{ 3: 5 }"` a <ScrollShell>.
 *   2. Dentro de Chapter3Content.vue, la clase `.chapter-stage` (utility
 *      global sin scope, declarada más abajo en este mismo archivo) TIENE
 *      que ir en el elemento ROOT de Chapter3Content.vue — es decir, hijo
 *      DIRECTO de `.chapter-section`. Su containing block YA mide N
 *      viewports sin que el ticket de capítulo tenga que declarar nada: el
 *      containing block de un elemento sticky es su PADRE, no el elemento
 *      sticky mismo — y ese padre es la sección, que ya mide N viewports
 *      por el `calc()` de abajo. Si en cambio `.chapter-stage` queda
 *      envuelta en un wrapper intermedio, ESE wrapper (y cada nivel
 *      adicional entre `.chapter-section` y `.chapter-stage`) debe declarar
 *      `height: 100%` — si no, colapsa a la altura intrínseca de su
 *      contenido (1 viewport) y el containing block del sticky queda de 1
 *      viewport → rango de anclaje CERO, sin recorrido, aun con el
 *      mecanismo funcionando. La regla defensiva
 *      `.chapter-section[data-viewports] > :not(.chapter-stage)` de abajo
 *      cubre automáticamente el primer nivel de wrapper (ver su propio
 *      comentario) — un segundo nivel de wrapper es responsabilidad del
 *      ticket de capítulo. Ese contenido queda fijo en pantalla (sticky
 *      top:0) durante TODO el recorrido de los N viewports de la sección —
 *      el "anclaje real" que pide la spec (00-sistema-visual-global.md §7.3).
 *   3. Borrar el contenedor con overflow-y: auto que hoy envuelve
 *      `.ch3-stage` — deja de hacer falta: el scroll interno pasa a ser el
 *      scroll PRINCIPAL del shell (`.scroll-shell`), sin contenedor anidado.
 *   4. Para pacing interno más fino (que ni un fling fuerte se salte varios
 *      "beats" de un capítulo alto de un solo gesto), sus propios elementos
 *      internos pueden declarar `scroll-snap-align: start` +
 *      `scroll-snap-stop: always` — ahora es seguro porque viven en el MISMO
 *      scroll container que `.chapter-section` (ya no hay overflow anidado
 *      compitiendo por el snap). El shell por sí solo ya garantiza que un
 *      gesto no puede saltar la ENTRADA de un capítulo alto (align:start +
 *      stop:always en su único punto de snap); esta capa 4 es opcional y la
 *      decide cada ticket de capítulo según cuánto pacing interno necesite.
 *   5. `prefers-reduced-motion`: este shell SÍ garantiza un contrato mínimo
 *      (ronda de corrección de TASK-009, ver el bloque `@media
 *      (prefers-reduced-motion: reduce)` junto a `.chapter-section[data-viewports]`
 *      más abajo): bajo PRM la sección colapsa de `N * 100dvh` a
 *      `height: auto; min-height: 100dvh` — si el ticket de capítulo devuelve
 *      su `.chapter-stage` a flujo normal bajo PRM (como ch3), la sección
 *      encoge a la altura real de ese contenido en vez de dejar N-1
 *      viewports en blanco después del cierre. Cualquier OTRA cosa —
 *      coreografía de scrub/parallax, qué gobierna `--*-p`/`--*-hy`, si el
 *      `.chapter-stage` mismo se desancla o no — sigue siendo responsabilidad
 *      de CADA ticket de capítulo (ej. los 4 beats de ch4, el scrub de ch3):
 *      este mecanismo sólo resuelve el vacío de ALTURA de la sección, neutral
 *      por lo demás.
 *   6. Navegación por teclado (documentado, NO arreglado por este ticket):
 *      en un capítulo alto, ↓/j desde dentro del capítulo salta al SIGUIENTE
 *      capítulo (pierde los beats intermedios, no hay "siguiente beat"), y
 *      ↑/k salta al capítulo ANTERIOR en vez de al inicio del capítulo
 *      actual. `navigate()` en este archivo sólo conoce capítulos, no beats
 *      internos. Cada ticket de capítulo alto decide conscientemente si
 *      necesita override este comportamiento (ej. capturar flechas dentro de
 *      su propio `.chapter-stage` para pacing interno) o lo acepta tal cual.
 *
 * `display: block` en vez de flex: con flex + align-items:center, un hijo
 * más corto que la sección (el `.chapter-stage` de 1 viewport dentro de una
 * sección de N viewports) quedaría CENTRADO verticalmente a la mitad de la
 * sección — su posición de flujo ya no arrancaría en top:0 y el sticky
 * dejaría de cubrir el recorrido completo. En block, el hijo arranca en
 * top:0 del flujo y el sticky se mantiene "pegado" durante los N viewports
 * enteros.
 *
 * `overflow: clip` (HIGH, ronda de corrección de review): `.chapter-section`
 * base declara `overflow: hidden` (fix anti-bleed de Rafael 2026-05-17, ver
 * comentario arriba). `overflow: hidden` establece un "scroll container" —
 * aunque nunca scrollea, sigue siendo programáticamente scrolleable y por
 * eso position:sticky lo trata como el ancestro-con-scrolling-mechanism más
 * cercano para calcular el rango de anclaje, en vez de `.scroll-shell` (el
 * scroll real del sitio). Resultado medido: `.chapter-stage` se ancla contra
 * su propia sección de N viewports — que nunca scrollea — y el sticky nunca
 * se mueve del viewport 1, dejando N-1 viewports vacíos. `overflow: clip`
 * recorta igual que `hidden` (conserva el fix anti-bleed) pero NO establece
 * scroll container, así que el sticky sigue subiendo por la cadena de
 * ancestros hasta encontrar `.scroll-shell`, que es el anclaje correcto.
 * El test `chapter-overlap-ch6` T2 sólo prohíbe `overflow: hidden` dentro de
 * `.ch{N}-layout` (stacking context que rompía el snap) — no toca esta
 * regla ni `.chapter-section` base, así que este cambio no lo viola.
 * ───────────────────────────────────────────────────────────────────────── */
/* LOW (cierre ronda 3 de review): `var(--chapter-viewports, 1)` con fallback
 * explícito. Hoy `data-viewports` y `--chapter-viewports` siempre se
 * estampan juntos (ver binding en el <template> arriba, línea ~127-128), así
 * que la custom property nunca falta en la práctica — pero si un refactor
 * futuro del binding rompiera ese acoplamiento, `var()` sin fallback vuelve
 * la declaración inválida at-computed-value-time y por IACVT anula TODA la
 * propiedad `height` (cae a `auto`, no al `100dvh` base de `.chapter-section`
 * sin `[data-viewports]`), no sólo el `calc()`. El fallback blinda ese caso
 * gratis sin cambiar el comportamiento actual. */
.chapter-section[data-viewports] {
  height: calc(var(--chapter-viewports, 1) * 100vh);
  height: calc(var(--chapter-viewports, 1) * 100dvh);
  display: block;
  overflow: clip;
}

/* ─────────────────────────────────────────────────────────────────────────
 * CONTRATO PRM DEL MECANISMO (HIGH, ronda de corrección de review de
 * TASK-009 — heredado de TASK-014 vía este ticket, autorizado excepcionalmente
 * a tocar este archivo SOLO para esto): bajo `prefers-reduced-motion: reduce`,
 * una sección `[data-viewports]` colapsa a `height: auto` con un piso de
 * `min-height: 100dvh`.
 *
 * PROBLEMA que resuelve: un ticket de capítulo alto (ej. ch3) puede,
 * legítimamente y bajo PRM, devolver SU PROPIO `.chapter-stage` a flujo
 * normal (`position: static`) para que el contenido se lea completo sin
 * animación (ver el override PRM de `.ch3-stage` en Chapter3Content.vue) —
 * eso es responsabilidad de CADA ticket de capítulo (punto 5 del contrato de
 * arriba). Pero la ALTURA de la sección (`calc(N * 100dvh)`) no es
 * responsabilidad del ticket de capítulo: es este mismo bloque, y sin este
 * override permanece fija en N viewports pase lo que pase adentro. Medido en
 * ch3 (N=11): el contenido bajo PRM mide ~5-7 viewports en flujo normal, así
 * que un visitante con PRM activo termina de leer el cierre del capítulo y
 * scrollea 4 a 6 pantallas EN BLANCO antes de llegar al capítulo siguiente.
 * PRM es regla dura del proyecto (spec §7 de cada capítulo) — este vacío la
 * viola en el mecanismo compartido, no en un capítulo aislado, así que
 * cualquier capítulo alto futuro (ch4/ch5/ch6) lo heredaría igual si no se
 * arregla aquí una sola vez.
 *
 * `min-height: 100dvh` (no `0` ni sin piso) preserva el caso borde de un
 * capítulo alto cuyo contenido PRM midiera MENOS de 1 viewport: la sección
 * nunca colapsa por debajo de 1 viewport, coherente con el resto del shell
 * (cada `.chapter-section` sin `[data-viewports]` también mide 1 viewport
 * mínimo). No se toca `overflow: clip` (sigue recortando cualquier
 * desbordamiento real, sin volver a habilitar scroll anidado) ni la altura
 * de `.chapter-section` base — sólo la variante `[data-viewports]`.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .chapter-section[data-viewports] {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
  }
}

/* Defensa del contrato del punto 2 de arriba, para el caso de WRAPPER
 * intermedio: cualquier hijo DIRECTO de una sección multi-viewport que NO
 * sea `.chapter-stage` hereda el 100% de los N viewports de la sección, así
 * un wrapper intermedio queda cubierto sin que el ticket de capítulo tenga
 * que declarar nada.
 *
 * REGRESIÓN (ronda 2 de corrección de review, ver comentario de review en
 * tasks/TASK-014.json): la versión anterior de esta regla era
 * `.chapter-section[data-viewports] > *` — SIN excluir `.chapter-stage`. En
 * `<style scoped>` Vue le agrega el atributo de scope de este componente al
 * selector, dándole especificidad (0,3,0) contra la (0,1,0) de la utility
 * global `.chapter-stage` (declarada SIN scope, ver el bloque `<style>` no
 * escopado al final de este archivo — confirmado compilando este bloque con
 * `@vue/compiler-sfc` `compileStyle`). Cuando `.chapter-stage` ES el hijo
 * directo — la topología que el punto 2 de arriba documenta como
 * OBLIGATORIA — esa regla le pisaba su propio `height: 100dvh` con
 * `height: 100%` = N*100dvh, y un sticky tan alto como su containing block
 * tiene rango de anclaje CERO: exactamente el caso principal que este
 * mecanismo existe para resolver, roto por su propio safeguard.
 *
 * El error de razonamiento original: se buscaba que el CONTAINING BLOCK del
 * sticky midiera N viewports, pero el containing block ya es la sección (el
 * PADRE del sticky, no el sticky mismo), que ya mide N viewports por el
 * `calc()` de arriba — esta regla nunca hacía falta para el caso del hijo
 * directo, sólo para el wrapper intermedio.
 *
 * FIX: `:not(.chapter-stage)` excluye estructuralmente a `.chapter-stage` de
 * este selector — no es una pelea de especificidad, el selector simplemente
 * deja de matchear ese elemento, así que su propia regla `height: 100dvh`
 * (bloque `<style>` no escopado de abajo) queda intacta sin competencia.
 * Verificado con `@vue/compiler-sfc` `compileStyle` (CSS real compilado,
 * incluido el atributo de scope) + `getComputedStyle` real en jsdom contra
 * las dos topologías (hijo directo y wrapper intermedio), ver
 * tests/integration/scroll-shell-safeguard-specificity.test.js.
 *
 * SUPUESTO (LOW, ronda 2): esta regla asume UN solo hijo directo relevante
 * por sección `[data-viewports]` (el `.chapter-stage`, o un único wrapper
 * que lo contenga). Si un ticket de capítulo futuro agrega VARIOS hijos
 * directos bajo la misma sección, cada uno que no sea `.chapter-stage`
 * recibiría `height: 100%` (N viewports) de forma independiente, no
 * repartida — el contenido combinado de esos hijos (potencialmente 2N
 * viewports si hubiera dos) quedaría recortado en silencio por el
 * `overflow: clip` de la sección. Ningún capítulo actual necesita más de un
 * hijo directo bajo `.chapter-section[data-viewports]`; si alguno lo
 * necesitara en el futuro, ese ticket debe revisar esta regla
 * explícitamente. */
.chapter-section[data-viewports] > :not(.chapter-stage) {
  height: 100%;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Era title placeholder (UI-SPEC §5, §9)
 * Padding reserva espacio para avatar (top) y timeline (bottom),
 * aunque esos componentes aún no existan (vienen en Plans 04-05).
 * ───────────────────────────────────────────────────────────────────────── */
.chapter-placeholder {
  padding-top: calc(80px + var(--sp-md));
  padding-bottom: calc(48px + var(--sp-sm));
  padding-left: var(--sp-lg);
  padding-right: var(--sp-lg);
  text-align: center;
}

.era-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0;
}
</style>

<!-- ───────────────────────────────────────────────────────────────────────
     Entrada de contenido con stagger (transiciones de era 2026-07-09).
     CSS global (sin scoped) para que los selectores traversan el shadow
     de componentes hijos. Targets: grandchildren de .chapter-section
     (= hijos del root del ChapterNContent), nth-child 1-5, delay escalonado
     de 60ms cada uno.

     ch2 (Flash/MatchGame WebGL) y ch5 (cine Phaser) excluidos para no
     interferir con sus escenas full-bleed.

     PRM: bloque @media al final cancela todo con !important.
     ─────────────────────────────────────────────────────────────────────── -->
<style>
/* ─────────────────────────────────────────────────────────────────────────
 * TASK-014 — `.chapter-stage`: utility de anclaje real (position: sticky)
 * para capítulos multi-viewport. Global (NO scoped) para que cualquier
 * Chapter{N}Content.vue la consuma directamente sin duplicar CSS ni
 * depender del scope del componente que la declara. Ver el comentario largo
 * junto a `.chapter-section[data-viewports]` (arriba, <style scoped>) para
 * el mecanismo completo. Ningún capítulo la usa todavía.
 * ───────────────────────────────────────────────────────────────────────── */
/* MEDIUM (cierre ronda 3 de review, ver comentario de review en
 * tasks/TASK-014.json): `overflow: hidden` acá NO afecta el anclaje sticky
 * de `.chapter-stage` mismo — eso lo deciden los ANCESTROS (ya resuelto
 * arriba con `overflow: clip` en `.chapter-section[data-viewports]`) — pero
 * SÍ vuelve a `.chapter-stage` un scroll container programáticamente
 * scrolleable para sus DESCENDIENTES. Escenario concreto: un capítulo
 * futuro mete contenido en flujo más alto que el viewport dentro de este
 * stage; Tab-navigation, find-in-page o navegación por fragmento pueden
 * scrollear en silencio ESTE contenedor (sin scrollbar visible ni gesto de
 * recuperación), desalineando la coreografía del sticky. El lock de scroll
 * anidado (tests/integration/scroll-shell-no-nested-scroll.test.js) no lo
 * detecta porque sólo prohíbe `auto|scroll`, no `hidden`. `overflow: clip`
 * imposibilita todo scroll —incluido el programático— y conserva el mismo
 * recorte visual que `hidden`; no agrega riesgo de compatibilidad porque
 * el shell ya depende de `clip` en `.chapter-section[data-viewports]`
 * arriba. NUNCA volver a `hidden` acá — ver
 * tests/integration/scroll-stage-no-programmatic-scroll.test.js. */
.chapter-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: clip;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes chapter-content-enter {
  from { opacity: 0.92; transform: translateY(8px); }
  to   { opacity: 1;    transform: translateY(0); }
}

/* Base: grandchildren de secciones inactivas (exc. ch2, ch5) ligeramente apagados */
.chapter-section:not([data-chapter="2"]):not([data-chapter="5"]) > * > * {
  opacity: 0.92;
  transition: opacity 400ms ease, transform 400ms ease;
}

/* ─── nth-child 1 — delay 0ms ───────────────────────────────────────────── */
:root[data-active-chapter="0"] .chapter-section[data-chapter="0"] > * > *:nth-child(1),
:root[data-active-chapter="1"] .chapter-section[data-chapter="1"] > * > *:nth-child(1),
:root[data-active-chapter="3"] .chapter-section[data-chapter="3"] > * > *:nth-child(1),
:root[data-active-chapter="4"] .chapter-section[data-chapter="4"] > * > *:nth-child(1),
:root[data-active-chapter="6"] .chapter-section[data-chapter="6"] > * > *:nth-child(1) {
  animation: chapter-content-enter 480ms ease both;
  animation-delay: 0ms;
}

/* ─── nth-child 2 — delay 60ms ──────────────────────────────────────────── */
:root[data-active-chapter="0"] .chapter-section[data-chapter="0"] > * > *:nth-child(2),
:root[data-active-chapter="1"] .chapter-section[data-chapter="1"] > * > *:nth-child(2),
:root[data-active-chapter="3"] .chapter-section[data-chapter="3"] > * > *:nth-child(2),
:root[data-active-chapter="4"] .chapter-section[data-chapter="4"] > * > *:nth-child(2),
:root[data-active-chapter="6"] .chapter-section[data-chapter="6"] > * > *:nth-child(2) {
  animation: chapter-content-enter 480ms ease both;
  animation-delay: 60ms;
}

/* ─── nth-child 3 — delay 120ms ─────────────────────────────────────────── */
:root[data-active-chapter="0"] .chapter-section[data-chapter="0"] > * > *:nth-child(3),
:root[data-active-chapter="1"] .chapter-section[data-chapter="1"] > * > *:nth-child(3),
:root[data-active-chapter="3"] .chapter-section[data-chapter="3"] > * > *:nth-child(3),
:root[data-active-chapter="4"] .chapter-section[data-chapter="4"] > * > *:nth-child(3),
:root[data-active-chapter="6"] .chapter-section[data-chapter="6"] > * > *:nth-child(3) {
  animation: chapter-content-enter 480ms ease both;
  animation-delay: 120ms;
}

/* ─── nth-child 4 — delay 180ms ─────────────────────────────────────────── */
:root[data-active-chapter="0"] .chapter-section[data-chapter="0"] > * > *:nth-child(4),
:root[data-active-chapter="1"] .chapter-section[data-chapter="1"] > * > *:nth-child(4),
:root[data-active-chapter="3"] .chapter-section[data-chapter="3"] > * > *:nth-child(4),
:root[data-active-chapter="4"] .chapter-section[data-chapter="4"] > * > *:nth-child(4),
:root[data-active-chapter="6"] .chapter-section[data-chapter="6"] > * > *:nth-child(4) {
  animation: chapter-content-enter 480ms ease both;
  animation-delay: 180ms;
}

/* ─── nth-child 5 — delay 240ms (max stagger) ───────────────────────────── */
:root[data-active-chapter="0"] .chapter-section[data-chapter="0"] > * > *:nth-child(5),
:root[data-active-chapter="1"] .chapter-section[data-chapter="1"] > * > *:nth-child(5),
:root[data-active-chapter="3"] .chapter-section[data-chapter="3"] > * > *:nth-child(5),
:root[data-active-chapter="4"] .chapter-section[data-chapter="4"] > * > *:nth-child(5),
:root[data-active-chapter="6"] .chapter-section[data-chapter="6"] > * > *:nth-child(5) {
  animation: chapter-content-enter 480ms ease both;
  animation-delay: 240ms;
}

/* PRM: cancela animaciones y dim — visibilidad inmediata completa */
@media (prefers-reduced-motion: reduce) {
  .chapter-section > * > * {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
}
</style>
