<!--
  Ch3Roadmap.vue — TASK-021: indicador de progreso "paso a paso" del capítulo 3
  ("La muerte de Flash", 2013). Pedido textual de Rafael: "que se pueda pasar
  como road map de paso a paso" — ver tasks/TASK-021.json y el hand-off del
  ticket para la justificación completa de cada decisión de abajo.

  DECISIONES (todas justificadas en el hand-off, resumen aquí para quien lea
  el código):
  - Cobertura: 8 pasos = 1 para el Acto 1 completo (la muerte del plugin es
    una cinemática scrubbed continua, NO contenido paginado — partirla en
    sub-pasos falsearía su naturaleza) + 7 para los slides del Acto 2 (hero,
    5 beats, cierre). @/utils/ch3Progress.js CH3_STEP_COUNT es la fuente de
    verdad de "8".
  - Clickeable: sí (recomendado por el ticket) — cada punto es un <button>
    real, foco nativo, Enter/Space disparan su click sin JS de teclado propio.
  - Forma: rail vertical de puntos numerados (desktop) / rail horizontal
    (mobile <768px) — lenguaje visual 2013 Flat UI: círculos flat con borde,
    numeral Open Sans, acento --c-accent en el paso activo, long-shadow sutil
    (mismo motivo de los iconos de Ch3StoryBeat.vue) sólo en el punto activo.

  POSICIONAMIENTO — position:fixed + v-if gateado por activeChapter===3
  (Chapter3Content.vue inyecta 'scrollState' y pasa isCh3Active como control
  de montaje): Chapter4Content.vue ya documenta por qué un position:fixed
  SIEMPRE-en-DOM haría bleed a otros capítulos (todos los ChapterNContent.vue
  están montados simultáneamente, ScrollShell.vue sólo los oculta con scroll,
  no con v-if). Gatear el montaje mismo con activeChapter evita ese bug de
  raíz y de paso resuelve gratis el caso prefers-reduced-motion: bajo PRM
  .ch3-stage/.ch3-scene se desanclan a flujo normal (ver Chapter3Content.vue)
  y un position:fixed simple sigue funcionando sin ninguna gimnasia de
  containing-block — no hace falta un override PRM para este componente.

  ACCESIBILIDAD (AC#5 del ticket, no negociable):
  - Cada punto: <button> nativo (foco de teclado + Enter/Space gratis),
    aria-current="step" en el activo, aria-label con el paso/total/label
    (screen reader entiende "paso 3 de 8: el método" sin ver los números).
  - role="status" aria-live="polite" (patrón .sr-only ya usado en
    Chapter6Content.vue, no existe utility global — verificado igual que ese
    componente) anuncia el paso activo incluso cuando el cambio viene del
    SCROLL, no de un click — Chapter3Content.vue sólo actualiza currentIndex
    cuando el paso discreto cambia (no cada frame de rAF), así que este texto
    no hace spam de anuncios.
  - Este archivo nunca desactiva el outline nativo de ningún selector — el
    foco visible lo cubre el `:focus-visible` universal no-scoped de App.vue
    (trampa documentada en .planning/LECCIONES-TECNICAS.md: la regla scoped
    de ScrollShell.vue que apaga ese outline sólo alcanza a `.scroll-shell`
    mismo, no a este componente).
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  steps: { type: Array, required: true }, // [{ label: string }, ...]
  currentIndex: { type: Number, required: true },
})
const emit = defineEmits(['navigate'])

const { t } = useI18n()

const total = computed(() => props.steps.length)
const currentLabel = computed(() => props.steps[props.currentIndex]?.label ?? '')

function stepAria(i) {
  return t('ch3.roadmap.stepAria', {
    current: i + 1,
    total: total.value,
    label: props.steps[i]?.label ?? '',
  })
}

// Anuncio para el aria-live — mismo texto que el aria-label del punto activo,
// así el mensaje que recibe un lector de pantalla es idéntico venga el
// cambio de un click en el punto o de scroll real.
const announce = computed(() => stepAria(props.currentIndex))
</script>

<template>
  <nav class="ch3-roadmap" :aria-label="t('ch3.roadmap.navAria')">
    <ol class="ch3-roadmap-list">
      <li v-for="(step, i) in steps" :key="i" class="ch3-roadmap-item">
        <button
          type="button"
          class="ch3-roadmap-dot"
          :class="{ 'is-current': i === currentIndex, 'is-done': i < currentIndex }"
          :aria-current="i === currentIndex ? 'step' : undefined"
          :aria-label="stepAria(i)"
          @click="emit('navigate', i)"
        >
          <span aria-hidden="true">{{ i + 1 }}</span>
        </button>
      </li>
    </ol>
    <p class="ch3-roadmap-caption" aria-hidden="true">
      <span class="ch3-roadmap-count">{{ currentIndex + 1 }}/{{ total }}</span>
      <span class="ch3-roadmap-label">{{ currentLabel }}</span>
    </p>
    <p class="sr-only" role="status" aria-live="polite">{{ announce }}</p>
  </nav>
</template>

<style scoped>
/* HALLAZGO geometrico (verificacion CDP de TASK-021, getBoundingClientRect
 * real en 1440x900 y 1366x768): centrado en top:50% el rail de 8 puntos +
 * caption (~340px de alto) invadia el rango vertical de ContactHUD.vue
 * (bottom-right, ~244px de alto con 5 iconos, `bottom: env(safe-area-inset-
 * bottom,0)`) — interseccion real medida: y=[656,790] x=[1378,1416] en
 * 1440x900. Fix: anclar el rail DEBAJO de LangToggle.vue (top-right, termina
 * en ~60px) en vez de centrar contra el viewport completo — dependiendo de
 * `top` fijo en vez de `top:50%` garantiza que el rail nunca se acerca a la
 * franja inferior donde vive ContactHUD, sin necesidad de conocer su altura
 * exacta (que varia con la cantidad de iconos de contacto). */
.ch3-roadmap {
  position: fixed;
  top: calc(var(--sp-md) + 64px);
  right: var(--sp-lg);
  z-index: 30; /* bajo el HUD global (avatar/timeline/lang/contact/sound, z:40) */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
  pointer-events: auto;
}

.ch3-roadmap-list {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Espina fina conectando los puntos — mismo gesto que StickyTimeline.vue,
   pero flat 2013 (línea sólida --c-border, sin gradiente ni glow). */
.ch3-roadmap-list::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--c-border);
  z-index: -1;
}

.ch3-roadmap-item {
  display: flex;
}

.ch3-roadmap-dot {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--c-border);
  background: var(--c-surface);
  color: var(--ch3-text-2, var(--c-fg));
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.ch3-roadmap-dot:hover {
  border-color: var(--c-accent);
  color: var(--c-accent);
}

.ch3-roadmap-dot.is-done {
  background: var(--c-border);
  border-color: var(--c-border);
  color: var(--c-surface);
}

.ch3-roadmap-dot.is-current {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #ffffff;
  transform: scale(1.1);
  /* Long-shadow 45° sutil — mismo motivo que los iconos de Ch3StoryBeat.vue
     (spec 03 §6), sólo en el punto activo para no sobrecargar el rail. */
  box-shadow: 3px 3px 0 var(--ch3-long-shadow, rgba(44, 62, 80, 0.15));
}

.ch3-roadmap-caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 4px 6px;
  min-width: 72px;
  text-align: center;
}

.ch3-roadmap-count {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.65rem;
  color: var(--ch3-text-2, var(--c-fg));
  font-variant-numeric: tabular-nums;
}

.ch3-roadmap-label {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--c-accent);
}

/* .sr-only — patrón estándar WCAG (idéntico al de Chapter6Content.vue; no
   existe utility global en el proyecto, verificado). Visualmente invisible,
   legible/anunciado por lectores de pantalla vía role="status" aria-live. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Mobile <768px (mismo breakpoint que el resto de ch3, spec §6) O landscape
 * corto (mismo criterio que `.ch3-flash-stage`/`.ch3-phone` más abajo en
 * Chapter3Content.vue, `@media (max-height: 499px) and (orientation:
 * landscape)`, ej. 844x390): rail vertical → barra horizontal centrada
 * abajo. HALLAZGO geometrico (verificacion CDP de TASK-021): a 844x390 el
 * ancho (844px) NO cruza el breakpoint de 767px así que sin esta segunda
 * condición el rail quedaba en el layout desktop (340px de alto) dentro de
 * un viewport de sólo 390px de alto — desbordaba por abajo y colisionaba
 * con ContactHUD.vue (interseccion real medida: y=[146,390] x=[782,820]). */
@media (max-width: 767px), (max-height: 499px) and (orientation: landscape) {
  /* Centrado horizontal SIN transform (deliberado — ver hand-off de
   * TASK-021: `transform: translateX()` en `.ch3-roadmap` bajo este mismo
   * media query no se aplicaba en la verificación CDP real, aislado con
   * `getComputedStyle` + `CSS.getMatchedStylesForNode`: la regla matcheaba
   * y el resto de sus propiedades — `flex-direction`, dimensiones de
   * `.ch3-roadmap-dot` — SÍ tomaban efecto, sólo `transform` quedaba en la
   * matriz identidad sin causa identificable en la cascada. `left:0; right:0;
   * width:fit-content; margin-inline:auto` logra el mismo centrado con
   * matemática de caja pura, sin depender de `transform` en absoluto). */
  /* HALLAZGO geometrico #2 (misma verificacion CDP): `bottom: env(...) +
   * var(--sp-sm)` — el MISMO anclaje que usa GlobalMantra.vue bajo <600px
   * ("And always with a smile", bottom:env(...)+var(--sp-sm) también) —
   * hacía que ambos compitieran por la misma franja horizontal inferior;
   * interseccion real medida en 390x844: roadmap y=[768,836] x=[70,320] vs
   * global-mantra y=[808,836] x=[102,288]. GlobalMantra mide ~27.6px de alto
   * en mobile (font 0.75rem + padding 5px, `white-space:nowrap` — altura
   * predecible, no varía con el locale) + sus 8px de offset propio = ~36px
   * de piso ocupado; 56px de margen adicional deja el rail comodamente
   * arriba de esa franja sin necesidad de leer su altura en tiempo real —
   * en landscape corto (844x390, donde GlobalMantra usa su tamaño DESKTOP,
   * ~30px, por no cruzar su propio breakpoint de 600px de ANCHO) el margen
   * medido con 40px quedaba en sólo ~2px; 56px deja >=18px libres ahí. */
  .ch3-roadmap {
    top: auto;
    left: 0;
    right: 0;
    width: fit-content;
    margin-inline: auto;
    bottom: calc(env(safe-area-inset-bottom, 0px) + var(--sp-sm) + 56px);
    flex-direction: column-reverse;
  }
  .ch3-roadmap-list {
    flex-direction: row;
  }
  .ch3-roadmap-list::before {
    top: 50%;
    bottom: auto;
    left: 14px;
    right: 14px;
    width: auto;
    height: 1px;
    transform: translateY(-50%);
  }
  .ch3-roadmap-dot {
    width: 26px;
    height: 26px;
    font-size: 0.62rem;
  }
  .ch3-roadmap-item {
    gap: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ch3-roadmap-dot {
    transition: none;
  }
}
</style>
