<!--
  Ch3Roadmap.vue — TASK-021: indicador de progreso "paso a paso" del capítulo 3
  ("La muerte de Flash", 2013). Pedido textual de Rafael: "que se pueda pasar
  como road map de paso a paso" — ver tasks/TASK-021.json y el hand-off del
  ticket para la justificación completa de cada decisión de abajo.

  TASK-024 (pedido textual de Rafael, calibración sobre lo entregado por
  TASK-021, mirando el sitio en vivo: "el stepper de ch3 porfa horizontal
  arriba de todo centrado que sea mas visible"): reemplaza el rail vertical
  top-right (desktop) / barra horizontal bottom-center (mobile) por UNA sola
  disposición: siempre horizontal, siempre anclada arriba, siempre centrada.
  Ver el bloque POSICIONAMIENTO más abajo para la geometría medida contra los
  4 ocupantes reales de la zona superior (ContactHUD, LangToggle,
  GlobalMantra, StickyTimeline) y el hand-off del ticket para la tabla de
  rects verificados en Chrome real.

  DECISIONES (todas justificadas en el hand-off, resumen aquí para quien lea
  el código):
  - Cobertura: 8 pasos = 1 para el Acto 1 completo (la muerte del plugin es
    una cinemática scrubbed continua, NO contenido paginado — partirla en
    sub-pasos falsearía su naturaleza) + 7 para los slides del Acto 2 (hero,
    5 beats, cierre). @/utils/ch3Progress.js CH3_STEP_COUNT es la fuente de
    verdad de "8".
  - Clickeable: sí (recomendado por el ticket) — cada punto es un <button>
    real, foco nativo, Enter/Space disparan su click sin JS de teclado propio.
  - Forma: SIEMPRE rail horizontal de puntos numerados sobre una tarjeta flat
    (mismo lenguaje "carta blanca, borde 1px --c-border, radius 3px" que
    Ch3StoryBeat.vue usa para sus badges de icono, spec 03 §6) — círculos
    flat con borde, numeral Open Sans, acento --c-accent en el paso activo,
    long-shadow sutil (mismo motivo de los iconos de Ch3StoryBeat.vue) sólo
    en el punto activo. "Más visible" (AC#2 de TASK-024) se resuelve por
    CONTRASTE (tarjeta --c-surface opaca sobre el escritorio oscuro del Acto
    1 Y sobre el flat claro del Acto 2), TAMAÑO (puntos 40px→30px según
    breakpoint, antes 32px→26px) y PESO (borde 2px→3px/2.5px, texto
    caption 700→800), nunca por animación nueva — cero curvas ni duraciones
    añadidas a las que ya reprueba T6.

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

  TASK-024 — "arriba de todo, centrado": la zona superior del chasis YA tiene
  dos ocupantes globales fijos, StickyAvatar.vue (top-left, 16px/80×96
  desktop, 8px/56×68 <600px) y LangToggle.vue (top-right, 16px, ~44px alto en
  TODOS los breakpoints — su query <600px sólo reduce el padding interno, no
  su `top`). El más alto de los dos es StickyAvatar: borde inferior real en
  16+96=112px desktop/landscape-corto (su query de tamaño es por ANCHO
  <600px, así que a 844×390 —landscape corto pero ancho— sigue midiendo
  96px) y 8+68=76px en <600px de ancho. `--inset-chapter-top` (tokens.css)
  ya vale `calc(96px + var(--sp-md))` = 112px EXACTOS — es el mismo número
  que el borde inferior del avatar en desktop, y este archivo lo reutiliza
  como ancla en vez de inventar un segundo cálculo (Ch3-hero, más abajo en
  Chapter3Content.vue, ya usa el mismo token para el mismo propósito). Se le
  suma `--sp-sm` (8px) de aire real: top final 120px, con margen medido
  contra los 4 ocupantes en el hand-off del ticket (tabla de
  getBoundingClientRect en Chrome real, 6 viewports).
  Centrado: `left:0; right:0; width:fit-content; margin-inline:auto` —
  matemática de caja pura, NO `transform: translateX(-50%)`. TASK-021 ya
  documentó que ese transform dejaba de aplicarse bajo una media query
  compuesta específica sin causa identificable en la cascada (ver el
  comentario `HALLAZGO geometrico` que este ticket retira más abajo); esta
  técnica evita reintroducir el mismo riesgo en cualquier breakpoint, no sólo
  en el que lo disparó la vez pasada.

  ACCESIBILIDAD (AC#5 del ticket original TASK-021 + AC#6 de TASK-024, no
  negociable):
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
  - TASK-024 AC#6: el rail SIEMPRE fue horizontal ahora, así que el eje de
    flecha esperado es ←→, no ↑↓ (auditado: este componente nunca ató un
    handler propio a ninguna flecha — el único comportamiento de flechas que
    existía al llegar a un botón del roadmap era ↑↓ BURBUJEANDO hasta el
    `@keydown.up/down` GLOBAL de ScrollShell.vue, que navega CAPÍTULOS
    enteros, no pasos; eso es intencional, ajeno a este componente y
    ScrollShell.vue está fuera de la lista blanca — no se toca). Se agrega
    `onListKeydown`: ArrowLeft/ArrowRight mueven el foco DOM entre botones
    adyacentes (con wrap), `preventDefault`+`stopPropagation` para que no
    burbujee al handler global (irrelevante en la práctica — ScrollShell
    sólo ata up/down/home/end/j/k, nunca left/right — pero explícito y sin
    efecto secundario). Es "roving focus" SIN roving tabindex: cada botón
    sigue siendo un tab-stop normal (ningún `tabindex` nuevo), así que Tab
    conserva exactamente el mismo recorrido que antes (T1-T5 de
    tests/components/Ch3Roadmap.test.js siguen midiendo lo mismo) — las
    flechas son un atajo ADICIONAL para saltar entre pasos adyacentes sin
    activar nada (mueven el foco, no navegan; Enter/Space sigue siendo quien
    dispara el click, igual que siempre).
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

// onListKeydown (TASK-024 AC#6) — roving FOCUS (no roving tabindex, ver
// comentario grande arriba): ←/→ mueven document.activeElement al botón
// adyacente dentro de .ch3-roadmap-list, con wrap en ambos extremos. No
// dispara 'navigate' — sólo mueve el foco, Enter/Space en el botón ya
// enfocado sigue siendo la única forma de activarlo (sin cambios ahí).
function onListKeydown(e) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const buttons = Array.from(e.currentTarget.querySelectorAll('.ch3-roadmap-dot'))
  const idx = buttons.indexOf(document.activeElement)
  if (idx === -1) return
  e.preventDefault()
  e.stopPropagation()
  const dir = e.key === 'ArrowRight' ? 1 : -1
  const next = (idx + dir + buttons.length) % buttons.length
  buttons[next].focus()
}
</script>

<template>
  <nav class="ch3-roadmap" :aria-label="t('ch3.roadmap.navAria')">
    <ol class="ch3-roadmap-list" @keydown="onListKeydown">
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
/* TASK-024 — geometría nueva: SIEMPRE horizontal, SIEMPRE arriba, SIEMPRE
 * centrado (retira el rail vertical top-right + su variante horizontal
 * bottom-center de TASK-021, ver el comentario grande del <script> arriba
 * para la justificación completa de cada número).
 *
 * top: reutiliza --inset-chapter-top (tokens.css, calc(96px + var(--sp-md))
 * = 112px) — el MISMO token que Ch3-hero usa más abajo en Chapter3Content.vue
 * para despejar el borde inferior de StickyAvatar.vue (top:16px + 96px alto
 * = 112px, en TODOS los breakpoints donde el avatar mide 96px: desktop Y
 * landscape corto <600px de alto pero >=600px de ancho — su query de tamaño
 * es por ANCHO, no por alto). Se le suma --sp-sm (8px) de aire real: 120px
 * final. LangToggle.vue (top-right, top:16px, ~44px alto en TODOS los
 * breakpoints — su query <600px sólo reduce padding interno, no `top`) queda
 * despejado de sobra (borde inferior ~60px, 60px por debajo de nuestro top).
 * Tabla completa de rects medidos en Chrome real (6 viewports) en el
 * hand-off del ticket.
 *
 * Centrado: left:0; right:0; width:fit-content; margin-inline:auto — caja
 * pura, nunca transform (ver comentario del <script> sobre el hallazgo de
 * TASK-021 con `transform: translateX()` bajo una media query compuesta). */
.ch3-roadmap {
  position: fixed;
  top: calc(var(--inset-chapter-top) + var(--sp-sm));
  left: 0;
  right: 0;
  width: fit-content;
  margin-inline: auto;
  z-index: 30; /* bajo el HUD global (avatar/timeline/lang/contact/sound, z:40) */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xs);
  padding: 10px 16px;
  /* Tarjeta flat 2013 — mismo lenguaje que los badges de icono de
     Ch3StoryBeat.vue (spec 03 §6: "cartas blancas con borde 1px --c-border y
     radius 3px"): --c-surface es opaco, así que el rail lee con el MISMO
     contraste fuerte sobre el escritorio oscuro del Acto 1 (#2b2d31) y sobre
     el flat claro del Acto 2 (#ecf0f1) — resuelve "más visible" (AC#2) sin
     ninguna animación nueva. */
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); /* tope de sombra permitido, spec §6 */
  pointer-events: auto;
}

.ch3-roadmap-list {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Espina fina conectando los puntos — mismo gesto que StickyTimeline.vue,
   pero flat 2013 (línea sólida --c-border, sin gradiente ni glow). Ahora
   horizontal (antes vertical): `top: calc(50% - 0.5px)` evita `transform`
   por el mismo motivo documentado arriba para `.ch3-roadmap`. */
.ch3-roadmap-list::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: calc(50% - 0.5px);
  height: 1px;
  background: var(--c-border);
  z-index: -1;
}

.ch3-roadmap-item {
  display: flex;
}

/* TASK-024 AC#2 "más visible" — tamaño 32px→40px, borde 2px→3px, peso
   700→800: presencia por tamaño y peso, no por movimiento nuevo. */
.ch3-roadmap-dot {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 3px solid var(--c-border);
  background: var(--c-surface);
  color: var(--ch3-text-2, var(--c-fg));
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.82rem;
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
  transform: scale(1.15);
  /* Long-shadow 45° sutil — mismo motivo que los iconos de Ch3StoryBeat.vue
     (spec 03 §6), sólo en el punto activo para no sobrecargar el rail. */
  box-shadow: 4px 4px 0 var(--ch3-long-shadow, rgba(44, 62, 80, 0.15));
}

.ch3-roadmap-caption {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  padding: 2px 4px 0;
  text-align: center;
}

.ch3-roadmap-count {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.75rem;
  color: var(--ch3-text-2, var(--c-fg));
  font-variant-numeric: tabular-nums;
}

.ch3-roadmap-label {
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 0.68rem;
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

/* Mismo breakpoint compuesto que el resto de ch3 (spec §6 + `.ch3-flash-
 * stage`/`.ch3-phone` en Chapter3Content.vue): mobile <768px de ancho O
 * landscape corto (<500px de alto, ej. 844x390) — SÓLO reduce tamaño/gap
 * para dar más aire horizontal en pantallas angostas. La orientación
 * (horizontal), el anclaje (top) y el centrado NO cambian — ya no hace
 * falta una segunda geometría completa como en TASK-021. */
@media (max-width: 767px), (max-height: 499px) and (orientation: landscape) {
  .ch3-roadmap {
    padding: 7px 10px;
    gap: 4px;
  }
  .ch3-roadmap-list {
    gap: 6px;
  }
  .ch3-roadmap-list::before {
    left: 13px;
    right: 13px;
  }
  .ch3-roadmap-dot {
    width: 30px;
    height: 30px;
    border-width: 2.5px;
    font-size: 0.64rem;
  }
  .ch3-roadmap-count {
    font-size: 0.64rem;
  }
  .ch3-roadmap-label {
    font-size: 0.58rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ch3-roadmap-dot {
    transition: none;
  }
}
</style>
