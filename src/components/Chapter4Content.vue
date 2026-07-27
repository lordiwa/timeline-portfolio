<!--
  Chapter4Content.vue — ch4 AR/VR: parallax "flotando en el vacío" (iter3, Rafael 2026-06-01).

  Concepto: alguien flotando en el espacio vacío. Personaje a la mitad-derecha, de espaldas,
  con gafas VR, mirando hacia abajo-derecha a un portal/agujero negro donde se ve tenue un
  mundo 3D. Parallax de 4 capas (frente → fondo):
    c0 near      — elementos próximos para profundidad           (factor puntero mayor)
    c1 character — chico flotando de espaldas + bob autónomo      (factor medio + float)
    c3 matrix    — símbolos matrix neón (híbrido: PNG tenue + glifos CSS vivos)
    c4 portal    — espacio profundo + portal con mundo 3D tenue   (factor mínimo + glow pulse)

  Movimiento: puntero + drift automático (sine en RAF), NO acoplado a scroll. PRM lo congela.
  Patrón reutilizado del parallax de ch3 (Chapter3Content.vue): vars CSS --mx/--my (+ --dx/--dy
  drift) escritas por un loop requestAnimationFrame; cada capa con su factor de profundidad.

  FASE A (actual): motor + placeholders CSS (sin assets pixelforge todavía). Los background-image
  de las capas se cablearán en Fase B con el arte final (ch4-portal/character/matrix/near).

  Decisiones vigentes:
  - D4-04 + UI-SPEC §6.8: ch4 usa <FloatingPanel> glass holographic (NO ProjectCard skeumorphic).
  - El contenido real lo define Rafael (CONTENT-CHECKLIST). Reubicar el contenido sobre el
    espacio libre es un follow-up; aquí los paneles quedan como están.
-->
<script setup>
import { ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import FloatingPanel from './FloatingPanel.vue'
import Ch4PortalShader from './Ch4PortalShader.vue'

const { t } = useI18n()

const chapter = chapters[4]
const ch4Projects = computed(() => projects.filter((p) => p.chapterEra === 4))

// Bio era-specific: AR/VR independiente Ecuador + Metrodigi líder (Rafael 2026-05-14).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// ── Multiverso: universo activo (actualizado por Ch4PortalShader) ────────────
// El shader emite 'universe-change' con el índice al cruzar el midpoint de la onda.
const activeUniverse = ref(0)
function onUniverseChange(idx) { activeUniverse.value = idx }

// ── Tier activo del shader (TASK-010, ronda de completado) ──────────────────
// Ch4PortalShader emite 'tier-change' cada vez que el tier cambia (detección
// inicial, software-renderer, o adaptación por frame time). Se refleja en
// [data-ch4-tier] para activar el blur DOM de profundidad de campo (spec
// §4.8): matrix/near llevan blur estático SOLO en tier HIGH (barato, el
// personaje — plano focal — queda nítido); en MED/LOW se quita el filter.
const shaderTier = ref('MED')
function onTierChange(tier) { shaderTier.value = tier }

// ── Coreografía de entrada "ponerse el visor" (TASK-010, spec §6) ───────────
// El shader posee su propio timer de boot (óptica: viñeta/barrel/CA/godrays);
// acá solo orquestamos la coreografía DOM (HUD boot text, título/paneles,
// contador FPS/LATENCY) a partir del jump-progress que emite.
// Default 'lock': antes de la primera entrada (o si el shader nunca emite,
// ej. WebGL no disponible) el capítulo se ve completo, no en estado "boot".
const jumpBeat = ref('lock')
const FPS_TARGET = 72.4
const LATENCY_TARGET = 11
const fpsVal = ref(FPS_TARGET)
const latencyVal = ref(LATENCY_TARGET)
let countRafId = 0
let awaitingLockCount = false

function onJumpProgress({ beat }) {
  if (beat === jumpBeat.value) return
  // Al abandonar 'lock' hacia boot/burst (arranca una secuencia nueva),
  // resetear los contadores para que el count-up de LOCK se note.
  if (jumpBeat.value === 'lock' && (beat === 'boot' || beat === 'burst')) {
    awaitingLockCount = true
    fpsVal.value = 0
    latencyVal.value = 0
  }
  if (beat === 'lock' && awaitingLockCount) {
    awaitingLockCount = false
    animateCounters()
  }
  jumpBeat.value = beat
}

function animateCounters() {
  const DUR_MS = 300
  const start = performance.now()
  cancelAnimationFrame(countRafId)
  const step = (ts) => {
    const p = Math.min((ts - start) / DUR_MS, 1)
    fpsVal.value = Math.round(FPS_TARGET * p * 10) / 10
    latencyVal.value = Math.round(LATENCY_TARGET * p)
    if (p < 1) countRafId = requestAnimationFrame(step)
  }
  countRafId = requestAnimationFrame(step)
}

// ── Glifos matrix — reactivos al universo (SINGLE SOURCE con shader) ────────
// Posiciones fijas (evita layout shifts). Sólo el carácter cambia por universo.
const GLYPH_POSITIONS = [
  { left: '10%', top: '22%', delay: '0s',   dur: '7s',   size: '20px' },
  { left: '18%', top: '64%', delay: '1.8s', dur: '9s',   size: '16px' },
  { left: '27%', top: '38%', delay: '3.2s', dur: '8s',   size: '24px' },
  { left: '34%', top: '78%', delay: '0.6s', dur: '10s',  size: '14px' },
  { left: '44%', top: '18%', delay: '2.4s', dur: '8.5s', size: '22px' },
  { left: '52%', top: '52%', delay: '4.1s', dur: '7.5s', size: '18px' },
  { left: '61%', top: '30%', delay: '1.2s', dur: '9.5s', size: '20px' },
  { left: '14%', top: '46%', delay: '5.0s', dur: '8s',   size: '15px' },
  { left: '38%', top: '58%', delay: '2.9s', dur: '10.5s',size: '26px' },
  { left: '48%', top: '72%', delay: '0.3s', dur: '7s',   size: '16px' },
  { left: '23%', top: '12%', delay: '3.7s', dur: '9s',   size: '21px' },
  { left: '57%', top: '14%', delay: '1.5s', dur: '8.5s', size: '14px' },
]
// Caracteres por universo. Índices coinciden con UNIVERSES en Ch4PortalShader.
const GLYPH_CHARS = [
  ['ｱ','1','ﾂ','0','ﾈ','1','ﾚ','0','ﾜ','1','ｷ','0'],     // U0 synthwave — katakana
  ['0','1','F','A','0','1','B','1','0','1','F','0'],         // U1 tron — hex/binario
  ['∆','◊','~','◊','∆','~','∆','◊','∆','~','◊','∆'],        // U2 vaporwave — geométrico
  ['▒','▓','▒','▓','▒','▓','▒','▓','▒','▓','▒','▓'],        // U3 void — bloques corruptos
]
const glyphs = computed(() => {
  const chars = GLYPH_CHARS[activeUniverse.value] ?? GLYPH_CHARS[0]
  return GLYPH_POSITIONS.map((pos, i) => ({ ...pos, ch: chars[i] }))
})

// ── Parallax: puntero + drift automático (sine), PRM-aware ──────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

// MEDIUM (ronda de corrección TASK-010): el RAF de este parallax corría en
// TODOS los capítulos (escribía 4 CSS vars por frame aunque el visitante
// estuviera en ch0) — mismo patrón de gateo que ya usa Ch4PortalShader.vue
// (watch de activeChapter con immediate). Es parte del AC de 60fps del
// propio ticket porque Chapter4Content está en la lista blanca.
const injectedScrollState = inject('scrollState', null)
const activeChapter = injectedScrollState?.activeChapter ?? ref(-1)

const parallaxRef = ref(null)
let rafLoop = 0
let startT = 0
let mx = 0
let my = 0
let stopChapterWatcher = null

function frame(t) {
  const el = parallaxRef.value
  if (el) {
    if (!startT) startT = t
    const e = (t - startT) / 1000
    el.style.setProperty('--mx', mx.toFixed(4))
    el.style.setProperty('--my', my.toFixed(4))
    // Drift autónomo lento — sensación de flotar sin tocar el mouse.
    el.style.setProperty('--dx', (Math.sin(e * 0.25) * 0.18).toFixed(4))
    el.style.setProperty('--dy', (Math.cos(e * 0.19) * 0.14).toFixed(4))
  }
  rafLoop = requestAnimationFrame(frame)
}

function onPointer(ev) {
  if (reduced()) return
  mx = ev.clientX / window.innerWidth - 0.5
  my = ev.clientY / window.innerHeight - 0.5
}

function startParallaxLoop() {
  if (rafLoop || reduced()) return
  startT = 0
  rafLoop = requestAnimationFrame(frame)
}
function stopParallaxLoop() {
  if (rafLoop) {
    cancelAnimationFrame(rafLoop)
    rafLoop = 0
  }
}

onMounted(() => {
  if (reduced()) return // PRM: sin loop, sin listener — vars quedan en su default (0)
  window.addEventListener('pointermove', onPointer, { passive: true })
  stopChapterWatcher = watch(
    activeChapter,
    (v) => { v === 4 ? startParallaxLoop() : stopParallaxLoop() },
    { immediate: true },
  )
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  stopChapterWatcher?.()
  stopParallaxLoop()
  if (countRafId) cancelAnimationFrame(countRafId)
})
</script>

<template>
  <div class="ch4-layout" :data-universe="activeUniverse" :data-jump="jumpBeat" :data-ch4-tier="shaderTier">
    <!-- ── Parallax stack (decorativo, detrás del contenido) ─────────────────── -->
    <div ref="parallaxRef" class="ch4-parallax" aria-hidden="true">
      <div class="ch4-layer ch4-layer--portal"></div>
      <!--
        Ch4PortalShader: pipeline WebGL multi-pass a resolución real (TASK-010).
        Z-index 1 — encima del portal PNG (z0), debajo del personaje (z3).
        Si WebGL no está disponible el componente no renderiza nada (fallback silencioso,
        las capas DOM debajo siguen componiendo el fondo).
      -->
      <Ch4PortalShader
        @universe-change="onUniverseChange"
        @jump-progress="onJumpProgress"
        @tier-change="onTierChange"
      />
      <!-- Pulso de energía sobre el anillo del portal — overlay circular decorativo -->
      <div class="ch4-portal-pulse" aria-hidden="true"></div>
      <!--
        ch4-settle: wrapper del settle de escala por capa (spec §6 beat BURST) —
        separado del elemento que lleva el transform de parallax puntero+drift
        (.ch4-layer--*) porque ese transform se reescribe cada frame por RAF vía
        CSS vars; si el settle viviera en el MISMO elemento, la transition CSS
        pelearía contra la actualización continua y el parallax se sentiría con
        lag. El wrapper solo cambia dos veces (boot/open → burst), así que ahí
        sí es seguro poner una transition real.
      -->
      <div class="ch4-settle ch4-settle--matrix">
        <div class="ch4-layer ch4-layer--matrix"></div>
      </div>
      <div class="ch4-layer ch4-layer--glyphs">
        <span
          v-for="(g, i) in glyphs"
          :key="i"
          class="ch4-glyph"
          :style="{ left: g.left, top: g.top, '--g-delay': g.delay, '--g-dur': g.dur, '--g-size': g.size }"
        >{{ g.ch }}</span>
      </div>
      <!-- Partículas holográficas — dots 2px, rombos wireframe y cruces cian -->
      <div class="ch4-particles" aria-hidden="true">
        <div class="ch4-p ch4-p--dot" style="--px:61%;--py:44%;--pd:0.5s;--pdur:3.5s;"></div>
        <div class="ch4-p ch4-p--dot" style="--px:79%;--py:57%;--pd:1.8s;--pdur:4.2s;"></div>
        <div class="ch4-p ch4-p--dot" style="--px:67%;--py:74%;--pd:0.9s;--pdur:3.8s;"></div>
        <div class="ch4-p ch4-p--rhombus" style="--px:63%;--py:52%;--pd:2.1s;--pdur:5s;"></div>
        <div class="ch4-p ch4-p--rhombus" style="--px:76%;--py:61%;--pd:0.3s;--pdur:4.5s;"></div>
        <div class="ch4-p ch4-p--rhombus" style="--px:71%;--py:39%;--pd:3.4s;--pdur:6s;"></div>
        <div class="ch4-p ch4-p--rhombus" style="--px:81%;--py:48%;--pd:1.2s;--pdur:5.5s;"></div>
        <span class="ch4-p ch4-p--cross" style="--px:66%;--py:66%;--pd:2.8s;--pdur:4.8s;">+</span>
        <span class="ch4-p ch4-p--cross" style="--px:74%;--py:43%;--pd:0.6s;--pdur:5.2s;">+</span>
      </div>
      <div class="ch4-settle ch4-settle--character">
        <div class="ch4-layer ch4-layer--character">
          <div class="ch4-character-art"></div>
          <!-- Brillo del visor VR — resplandor cian pulsante donde están las gafas del sprite -->
          <div class="ch4-visor-glow" aria-hidden="true"></div>
          <!-- Streaming de datos: partículas que suben del portal hacia el personaje -->
          <div class="ch4-data-stream" aria-hidden="true">
            <div class="ch4-ds ch4-ds--a"></div>
            <div class="ch4-ds ch4-ds--b"></div>
            <div class="ch4-ds ch4-ds--c"></div>
            <div class="ch4-ds ch4-ds--d"></div>
            <div class="ch4-ds ch4-ds--e"></div>
          </div>
        </div>
      </div>
      <div class="ch4-settle ch4-settle--near">
        <div class="ch4-layer ch4-layer--near"></div>
      </div>
      <!--
        MEDIUM (ronda de corrección TASK-010, spec §3.2): .ch4-holo-floor y
        .ch4-vr-vignette CSS se eliminan — el Pass C del shader (viñeta
        binocular con barrel/CA coherentes) y el suelo perspectivo dentro del
        propio Pass A los reemplazan. Conviviendo duplicaban la viñeta (una
        curvada por el barrel, otra plana encima) y el grid de suelo, exactamente
        lo que la spec pidió evitar — capas compuestas de más en un capítulo
        que ya pelea por fps.
      -->
    </div>

    <!--
      HUD era-auténtico 2015 — indicadores de headset AR/VR al estilo Oculus Rift CV1.
      Fuera del parallax para que se muestre por encima del fondo pero debajo del contenido.
      Universe-reactive: color de cada esquina cambia con [data-universe].
    -->
    <div class="ch4-hud" aria-hidden="true">
      <div class="ch4-hud-tl">
        <div class="ch4-hud-line"><span class="ch4-hud-key">TRACKING</span><span class="ch4-hud-dots"> ●●●●○</span></div>
        <div class="ch4-hud-line"><span class="ch4-hud-key">FOV</span><span class="ch4-hud-val"> 110°</span></div>
      </div>
      <div class="ch4-hud-tr">
        <div class="ch4-hud-line"><span class="ch4-hud-val">78%</span><span class="ch4-hud-key"> BATTERY</span></div>
        <div class="ch4-hud-line"><span class="ch4-hud-dots">●●●●●</span><span class="ch4-hud-key"> SIGNAL</span></div>
      </div>
      <div class="ch4-hud-bl">
        <div class="ch4-hud-line">
          <span class="ch4-hud-key">FPS</span><span class="ch4-hud-accent"> {{ fpsVal.toFixed(1) }}</span>
          <span class="ch4-hud-sep"> │ </span>
          <span class="ch4-hud-key">LATENCY</span><span class="ch4-hud-accent"> {{ latencyVal }}ms</span>
        </div>
      </div>
      <div class="ch4-hud-br">
        <div class="ch4-hud-model">OCULUS RIFT CV1</div>
        <div class="ch4-hud-line"><span class="ch4-hud-key">AR/VR</span><span class="ch4-hud-val"> 2015</span></div>
      </div>
      <!--
        Boot lines (spec §6, beat BOOT/OPEN) — visible solo mientras data-jump
        es "boot" u "open" (CSS abajo); "ponerse el visor" se lee también en
        texto, no solo en la óptica del shader.
      -->
      <div class="ch4-hud-boot" aria-hidden="true">
        <div class="ch4-hud-boot-line">{{ t('ch4.hud.boot1') }}</div>
        <div class="ch4-hud-boot-line">{{ t('ch4.hud.boot2') }}</div>
        <div class="ch4-hud-boot-line">{{ t('ch4.hud.boot3') }}</div>
      </div>
    </div>

    <!-- Título grande centrado a todo el ancho de la página. -->
    <h1 class="ch4-title">{{ t('chapters.4.heading') }}</h1>

    <!-- Contenido flotando a la izquierda, sobre el espacio vacío. -->
    <div class="ch4-panel-column">
      <div class="ch4-content">
        <FloatingPanel :title="t(chapter.titleKey)">
          <p class="ch4-flavor">{{ t('chapters.4.flavor') }}</p>
          <p v-for="(para, idx) in bioParagraphs" :key="idx" class="ch4-bio">{{ para }}</p>
        </FloatingPanel>

        <!-- Proyectos lado a lado (grid) → bloque más ancho y menos alto. -->
        <div class="ch4-projects">
          <FloatingPanel
            v-for="project in ch4Projects"
            :key="project.id"
            :title="t(project.titleKey)"
          >
            <p class="ch4-project-desc">{{ t(project.descKey) }}</p>
            <p v-if="project.role" class="ch4-project-role">{{ project.role }}</p>
            <ul v-if="project.techStack" class="ch4-project-tech">
              <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
            </ul>
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="ch4-project-link"
            >{{ t('ui.openProject') }}</a>
          </FloatingPanel>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch4-layout — grid 2-col (200px aside + 1fr content) heredado D3-09.
 * El bg ya NO es una imagen fija: lo pintan las capas del parallax.
 * ───────────────────────────────────────────────────────────── */
.ch4-layout {
  position: relative;
  display: flex;
  flex-direction: column;       /* título arriba (full-width) + contenido debajo */
  align-items: stretch;
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(64px + var(--sp-sm));
  padding-bottom: var(--sp-lg);
  height: 100%;
  /* .chapter-section es flex-centrado → reclamar el ancho completo del viewport,
     si no el parallax queda angosto y el portal (esquina derecha) cae fuera.
     Mismo fix que ch2 (.flash-y2k-root). */
  width: 100%;
  flex: 1 1 100%;
  align-self: stretch;
  min-width: 0;
  /* clip, no hidden: este contenedor solo quiere recorte visual (no hay
     ningún descendiente sticky) — overflow:hidden crearía un scroll
     container programático innecesario (regla del proyecto, TASK-010). */
  overflow: clip;
  background-color: var(--c-bg);
  image-rendering: pixelated;
}

/* Título grande centrado a TODO el ancho de la página. Los márgenes negativos
   cancelan el padding asimétrico del layout (160px izq / sp-lg der) para que el
   texto quede centrado respecto al viewport completo, no respecto a la columna. */
.ch4-title {
  position: relative;
  z-index: 5;
  flex: 0 0 auto;
  margin: 0 calc(-1 * var(--sp-lg)) var(--sp-md) -160px;
  text-align: center;
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: clamp(1.6rem, 4vw, 3rem);
  line-height: 1.1;
  color: var(--c-accent);
  text-shadow: 0 0 14px rgba(0, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.6);
}

/* Columna de contenido — flota a la izquierda sobre el espacio vacío, bajo el título.
   Ancha y baja: proyectos en grid 2-col para reducir altura y no cortarse abajo.
 *
 * FIX TASK-010 (spec §8, defecto verificado en vivo): antes `margin-top: 20vh`
 * fijo + `overflow-y: auto` SIN cota de altura → el flex item crecía a su
 * contenido intrínseco (887px medidos contra un viewport de 791px) y
 * desbordaba `.ch4-layout` (`overflow: clip` recortaba el final del
 * contenido, inalcanzable — ni el propio overflow-y:auto podía activarse
 * porque el contenedor nunca tenía una altura FINITA contra la cual medirse).
 * `max-height` con `calc()` le da esa cota: ahora overflow-y:auto sí puede
 * activar scroll INTERNO real dentro del viewport, patrón ya sancionado para
 * ch0/ch1/ch4 por tests/integration/scroll-shell-no-nested-scroll.test.js
 * (paneles internos acotados con max-height, no el capítulo entero atrapado
 * en scroll). `--ch4-title-h` sin JS de medición (minimalismo): 72px es una
 * aproximación conservadora del alto real de `.ch4-title` en los tres
 * breakpoints de aceptación (1440x900, 1366x768, mobile). */
.ch4-panel-column {
  position: relative;
  z-index: 5;
  align-self: flex-start;    /* base izquierda */
  margin-left: 7vw;          /* solo un poco hacia el centro (no centrado del todo) */
  margin-top: clamp(24px, 10vh, 96px);
  max-height: calc(100% - clamp(24px, 10vh, 96px) - var(--ch4-title-h, 72px) - var(--sp-md));
  flex: 0 1 auto;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  overflow-y: auto;
  overscroll-behavior: contain; /* no filtrar el scroll interno al scroll-snap del shell */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 255, 0.35) transparent;
  /* Fade-out de 24px al fondo: señala que hay más contenido por scrollear. */
  mask-image: linear-gradient(to bottom, black calc(100% - 24px), transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 24px), transparent 100%);
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  padding-right: var(--sp-xs);
  animation: ch4-col-float 7s ease-in-out infinite;
}

/* Proyectos lado a lado — más ancho, menos alto. */
.ch4-projects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-sm);
}
@keyframes ch4-col-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* ── Parallax stack — cubre todo el chapter, detrás del contenido ──────────── */
.ch4-parallax {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* clip, no hidden — regla del proyecto (TASK-010): recorte visual puro,
     sin necesidad de un scroll container programático. */
  overflow: clip;
  pointer-events: none;
}

.ch4-layer {
  position: absolute;
  inset: -8%;
  width: 116%;
  height: 116%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
  will-change: transform;
}

/* Profundidad: factor puntero+drift creciente del fondo (portal) al frente (near).
   FASE A — placeholders CSS; los background-image reales llegan en Fase B. */

/* c4 portal — fondo opaco: espacio profundo + portal con mundo 3D tenue abajo-derecha.
   Sin overscan (el portal está en la esquina; el -8%/116% lo recortaba). Se mueve solo
   5px y el bg es navy → no revela bordes. */
.ch4-layer--portal {
  z-index: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: var(--c-bg);
  background-image: url('/assets/ch4-portal.webp');
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 5px),
    calc((var(--my, 0) + var(--dy, 0)) * 4px),
    0
  );
}

/* c3 matrix base — Fase B: lluvia de glifos cian sobre negro puro.
   mix-blend-mode:screen convierte el negro en transparente gratis (sin bg-removal).
   Opacidad MUY baja: a 0.35 hacía sopa cian detrás del título/paneles
   (QA visual en navegador 2026-07-10) — ambiente lejano, no protagonista. */
.ch4-layer--matrix {
  background-image: url('/assets/ch4-matrix.webp');
  mix-blend-mode: screen;
  opacity: 0.16;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 11px),
    calc((var(--my, 0) + var(--dy, 0)) * 9px),
    0
  );
}

/* c3 glifos — sub-capa viva (híbrido). Profundidad entre matrix y personaje. */
.ch4-layer--glyphs {
  z-index: 2;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 15px),
    calc((var(--my, 0) + var(--dy, 0)) * 12px),
    0
  );
}
.ch4-glyph {
  position: absolute;
  font-family: 'VT323', monospace;
  font-size: var(--g-size, 20px);
  line-height: 1;
  color: var(--c-accent);
  text-shadow: 0 0 6px rgba(0, 255, 255, 0.9), 0 0 14px rgba(0, 255, 255, 0.5);
  opacity: 0.18;
  animation: ch4-glyph-drift var(--g-dur, 8s) ease-in-out var(--g-delay, 0s) infinite;
}
@keyframes ch4-glyph-drift {
  0%, 100% { opacity: 0.12; transform: translateY(0) scale(0.95); }
  50% { opacity: 0.55; transform: translateY(-18px) scale(1.05); }
}

/* c1 personaje — sprite ch4-character.webp (de espaldas, gafas VR) a la derecha. Bob autónomo. */
.ch4-layer--character {
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 20px),
    calc((var(--my, 0) + var(--dy, 0)) * 14px),
    0
  );
}
.ch4-character-art {
  position: absolute;
  inset: 0;
  background-image: url('/assets/ch4-character.webp');
  background-repeat: no-repeat;
  background-size: auto 50%;
  background-position: 73% 32%;
  image-rendering: pixelated;
  animation: ch4-char-bob 6.5s ease-in-out infinite;
}
@keyframes ch4-char-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* c0 near — Fase B: fragmentos holográficos de primer plano (ventanas wireframe rotas,
   shards de datos cian/magenta). Negro puro = transparente via screen blend.
   Opacidad contenida: a 0.8 la ventana DATA LOSS (escalada cover a viewport)
   competía con los paneles de contenido (QA visual 2026-07-10) — presencia
   fantasmal de primer plano, no cartel. */
.ch4-layer--near {
  background-image: url('/assets/ch4-near.webp');
  mix-blend-mode: screen;
  opacity: 0.38;
  transform: translate3d(
    calc((var(--mx, 0) + var(--dx, 0)) * 32px),
    calc((var(--my, 0) + var(--dy, 0)) * 22px),
    0
  );
}

/* ── ch4-settle — wrapper del settle de escala por capa (spec §6 beat BURST) ──
 * Cada plano entra en su propio timing (matrix primero, personaje, near
 * último) para que la profundidad se abra en el tiempo, no de golpe — ver
 * comentario del template sobre por qué el settle vive en un wrapper propio
 * y no en el mismo elemento que el transform de parallax puntero+drift.
 * z-index se movió acá desde .ch4-layer--{matrix,character,near} (ahora esos
 * elementos son hijos sin z-index propio; lo hereda del wrapper).
 * ───────────────────────────────────────────────────────────── */
.ch4-settle {
  position: absolute;
  inset: 0;
}
.ch4-settle--matrix    { z-index: 1; transition: transform 350ms ease-out 0ms; }
.ch4-settle--character { z-index: 3; transition: transform 350ms ease-out 100ms; }
.ch4-settle--near      { z-index: 4; transition: transform 350ms ease-out 150ms; }

.ch4-layout[data-jump="boot"] .ch4-settle--matrix,
.ch4-layout[data-jump="open"] .ch4-settle--matrix    { transform: scale(1.06); }
.ch4-layout[data-jump="boot"] .ch4-settle--character,
.ch4-layout[data-jump="open"] .ch4-settle--character { transform: scale(1.04); }
.ch4-layout[data-jump="boot"] .ch4-settle--near,
.ch4-layout[data-jump="open"] .ch4-settle--near      { transform: scale(1.08); }

/* DOF por capas (spec §4.8) — barato, sin pase de blur extra en el shader:
 * blur DOM estático solo en tier HIGH (activado por [data-ch4-tier], emitido
 * por Ch4PortalShader vía 'tier-change'). El personaje (plano focal) queda
 * nítido; matrix (lejos) y near (cerca) llevan blur de borde blando. En
 * MED/LOW se quita el filter — el costo de un filter compuesto por GPU en
 * dos capas es aceptable solo cuando el tier ya tiene margen. */
.ch4-layout[data-ch4-tier="HIGH"] .ch4-layer--matrix { filter: blur(1.5px); }
.ch4-layout[data-ch4-tier="HIGH"] .ch4-layer--near   { filter: blur(0.75px); }

/* ── Portal pulse — overlay circular de energía sobre el anillo del portal ─── */
/* Centro del anillo real medido en navegador a 1920×911 (2026-07-09b): ~83%/79%.
   El estimado inicial 70%/62% quedaba arriba-izquierda del anillo. */
.ch4-portal-pulse {
  position: absolute;
  left: 81%;
  top: 75%;
  width: 26%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.30) 0%, rgba(0, 255, 255, 0.10) 50%, transparent 70%);
  transform: translate(-50%, -50%) scale(1);
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: screen;
  animation: ch4-portal-pulse 4s ease-in-out infinite;
}
@keyframes ch4-portal-pulse {
  0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(0.98); }
  50%       { opacity: 0.40; transform: translate(-50%, -50%) scale(1.03); }
}

/* ── Visor glow del personaje VR ─────────────────────────────────────────── */
/* El sprite de ch4-character.webp tiene las gafas VR en la parte alta derecha.
   background-position: 73% 32%; background-size: auto 50% → el visor está ~72%L ~20%T.
   mix-blend-mode:screen sobre el sprite → el glow se superpone sin tapar el arte. */
.ch4-visor-glow {
  position: absolute;
  left: 71%;
  top: 22%;
  width: 3.8%;
  aspect-ratio: 2.6 / 1;
  transform: translate(-50%, -50%);
  background: rgba(0, 255, 255, 0.80);
  border-radius: 2px;
  box-shadow:
    0 0 6px 2px rgba(0, 255, 255, 0.70),
    0 0 18px 5px rgba(0, 255, 255, 0.35),
    0 0 40px 10px rgba(0, 255, 255, 0.12);
  mix-blend-mode: screen;
  animation: ch4-visor-pulse 2.4s ease-in-out infinite;
  z-index: 3;
  pointer-events: none;
}
@keyframes ch4-visor-pulse {
  0%, 100% { opacity: 0.45; width: 3.8%; }
  35% { opacity: 0.90; width: 4.2%; }
  70% { opacity: 0.55; width: 3.9%; }
}

/* ── Streaming de datos: del portal al personaje ─────────────────────────── */
/* Partículas-línea que suben desde el portal (81%, 75%) hasta el personaje.
   Trayectoria diagonal: de abajo-derecha a arriba-izquierda. */
.ch4-data-stream {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
.ch4-ds {
  position: absolute;
  width: 1px;
  height: 22px;
  background: linear-gradient(to top, transparent 0%, rgba(0,255,255,0.85) 50%, transparent 100%);
  border-radius: 1px;
  animation: ch4-ds-rise var(--ds-dur, 2.2s) ease-in var(--ds-delay, 0s) infinite;
  opacity: 0;
}
/* Posiciones: trayectoria portal (81%,75%) → personaje (71%,22%) — path diagonal */
.ch4-ds--a { left: 80%; top: 74%; --ds-dur: 1.9s; --ds-delay: 0.0s; }
.ch4-ds--b { left: 78%; top: 70%; --ds-dur: 2.3s; --ds-delay: 0.7s; }
.ch4-ds--c { left: 76%; top: 64%; --ds-dur: 2.0s; --ds-delay: 1.4s; }
.ch4-ds--d { left: 74%; top: 55%; --ds-dur: 2.5s; --ds-delay: 0.3s; }
.ch4-ds--e { left: 73%; top: 44%; --ds-dur: 1.8s; --ds-delay: 1.1s; }
@keyframes ch4-ds-rise {
  0%   { opacity: 0;    transform: translateY(0); }
  15%  { opacity: 0.75; }
  80%  { opacity: 0.60; }
  100% { opacity: 0;    transform: translateY(-28px); }
}

/* Universe-reactive visor y stream */
.ch4-layout[data-universe="1"] .ch4-visor-glow {
  background: rgba(0, 255, 77, 0.85);
  box-shadow: 0 0 6px 2px rgba(0,255,77,0.70), 0 0 18px 5px rgba(0,255,77,0.35), 0 0 40px 10px rgba(0,255,77,0.12);
}
.ch4-layout[data-universe="1"] .ch4-ds {
  background: linear-gradient(to top, transparent 0%, rgba(0,255,77,0.85) 50%, transparent 100%);
}
.ch4-layout[data-universe="2"] .ch4-visor-glow {
  background: rgba(230, 102, 255, 0.85);
  box-shadow: 0 0 6px 2px rgba(230,102,255,0.70), 0 0 18px 5px rgba(230,102,255,0.35), 0 0 40px 10px rgba(230,102,255,0.12);
}
.ch4-layout[data-universe="2"] .ch4-ds {
  background: linear-gradient(to top, transparent 0%, rgba(230,102,255,0.85) 50%, transparent 100%);
}
.ch4-layout[data-universe="3"] .ch4-visor-glow {
  background: rgba(204, 0, 20, 0.85);
  box-shadow: 0 0 6px 2px rgba(204,0,20,0.70), 0 0 18px 5px rgba(204,0,20,0.35), 0 0 40px 10px rgba(204,0,20,0.12);
}
.ch4-layout[data-universe="3"] .ch4-ds {
  background: linear-gradient(to top, transparent 0%, rgba(204,0,20,0.85) 50%, transparent 100%);
}

/* ── Partículas holográficas — dots 2px, rombos wireframe, cruces ──────────── */
.ch4-particles {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.ch4-p {
  position: absolute;
  left: var(--px, 70%);
  top: var(--py, 50%);
  animation-duration: var(--pdur, 4s);
  animation-delay: var(--pd, 0s);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
.ch4-p--dot {
  width: 2px;
  height: 2px;
  background: rgba(0, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 3px rgba(0, 255, 255, 0.8);
  animation-name: ch4-p-float;
}
.ch4-p--rhombus {
  width: 8px;
  height: 8px;
  border: 1px solid rgba(0, 255, 255, 0.65);
  background: transparent;
  animation-name: ch4-p-float-rhombus;
}
.ch4-p--cross {
  font-family: monospace;
  font-size: 11px;
  line-height: 1;
  color: rgba(0, 255, 255, 0.65);
  text-shadow: 0 0 4px rgba(0, 255, 255, 0.55);
  animation-name: ch4-p-float;
}
@keyframes ch4-p-float {
  0%, 100% { opacity: 0; transform: translateY(0); }
  15%       { opacity: 0.45; }
  50%       { opacity: 0.35; transform: translateY(-7px) translateX(3px); }
  85%       { opacity: 0.40; }
}
@keyframes ch4-p-float-rhombus {
  0%, 100% { opacity: 0; transform: rotate(45deg) translateY(0); }
  15%       { opacity: 0.40; }
  50%       { opacity: 0.30; transform: rotate(45deg) translateY(-5px); }
  85%       { opacity: 0.35; }
}

/* MEDIUM (ronda de corrección TASK-010, spec §3.2): .ch4-holo-floor y
   .ch4-vr-vignette se eliminaron de este archivo — el Pass C del shader
   (Ch4PortalShader.vue) reemplaza la viñeta binocular con distorsión/CA
   coherentes, y el suelo perspectivo ya vive dentro del Pass A. Ver el
   comentario del template donde estos <div> vivían. */

/* ── HUD era-auténtico 2015 — indicadores estilo Oculus Rift CV1 ─────────── */
/* Fuera del parallax → z-index del layout (4), debajo del contenido (5).
   Esquinas: bracket con border-left/top o right/bottom para look HUD industrial. */
.ch4-hud {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.ch4-hud-tl,
.ch4-hud-tr,
.ch4-hud-bl,
.ch4-hud-br {
  position: absolute;
  font-family: 'Audiowide', 'Eurostile', monospace;
  font-size: 0.48rem;
  line-height: 1.7;
  color: rgba(0, 255, 255, 0.48);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transition: color 0.4s ease, border-color 0.4s ease;
}
.ch4-hud-tl {
  top: 68px;
  left: 14px;
  border-left: 1px solid rgba(0, 255, 255, 0.22);
  border-top: 1px solid rgba(0, 255, 255, 0.22);
  padding: 5px 9px;
}
.ch4-hud-tr {
  top: 68px;
  right: 14px;
  text-align: right;
  border-right: 1px solid rgba(0, 255, 255, 0.22);
  border-top: 1px solid rgba(0, 255, 255, 0.22);
  padding: 5px 9px;
}
.ch4-hud-bl {
  bottom: 12px;
  left: 14px;
  border-left: 1px solid rgba(0, 255, 255, 0.22);
  border-bottom: 1px solid rgba(0, 255, 255, 0.22);
  padding: 5px 9px;
}
.ch4-hud-br {
  bottom: 12px;
  right: 14px;
  text-align: right;
  border-right: 1px solid rgba(0, 255, 255, 0.22);
  border-bottom: 1px solid rgba(0, 255, 255, 0.22);
  padding: 5px 9px;
}
.ch4-hud-line  { white-space: nowrap; }
.ch4-hud-key   { opacity: 0.6; }
.ch4-hud-val   { /* sin cambio extra */ }
.ch4-hud-dots  { letter-spacing: -0.04em; }
.ch4-hud-accent {
  color: var(--c-accent);
  text-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
  transition: color 0.4s ease, text-shadow 0.4s ease;
}
.ch4-hud-sep   { opacity: 0.38; }
.ch4-hud-model {
  font-size: 0.42rem;
  letter-spacing: 0.18em;
  opacity: 0.35;
  margin-bottom: 2px;
}

/* ─────────────────────────────────────────────────────────────
 * FloatingPanel — glass holographic (TASK-010: migrado desde el archivo
 * intermedio src/styles/chapter-components.css, que TASK-008 dejó como
 * parada declarada porque su lista blanca no autorizaba componentes de
 * capítulo — ver comentario del orchestrator en tasks/TASK-010.json).
 *
 * Scrim reforzado (spec §9, contraste): el shader ya NO es aditivo-sobre-negro
 * — el rango tonal del fondo llega a luminancia 0.45 fuera del portal — así
 * que el scrim mínimo sube de rgba(10,15,46,0.4)/0.15-con-blur (valor previo,
 * insuficiente contra el nuevo fondo) a rgba(6,10,30,0.78) + blur(6px), con
 * fallback sin blur a 0.86. Verificado: --c-fg #b0d0ff sobre rgba(6,10,30,0.78)
 * compuesto sobre luminancia 0.45 → fondo efectivo ~#131a35, contraste ~9.8:1
 * (WCAG AA cuerpo pide 4.5:1). QA debe repetir la medición con screenshot +
 * picker en los 4 universos (U1 tron es el más claro).
 * ───────────────────────────────────────────────────────────── */
.ch4-layout :deep(.floating-panel) {
  position: relative;
  z-index: 4;
  padding: var(--sp-md);
  background-color: rgba(6, 10, 30, 0.78);
  border: 1px solid var(--c-accent);
  border-radius: 8px;
  box-shadow:
    0 0 20px rgba(0, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: var(--c-fg);
  margin-bottom: 0; /* el gap de .ch4-panel-column maneja el espaciado */
  transition: box-shadow 0.4s ease;
  animation: ch4-panel-glow 5s ease-in-out infinite;
}
@keyframes ch4-panel-glow {
  0%, 100% { box-shadow: 0 0 14px rgba(0, 255, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
  50% { box-shadow: 0 0 22px rgba(0, 255, 255, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.12); }
}
.ch4-layout :deep(.floating-panel):hover {
  box-shadow: 0 0 16px rgba(0, 255, 255, 0.35), 0 0 5px rgba(0, 255, 255, 0.15);
}
@supports ((backdrop-filter: blur(6px)) or (-webkit-backdrop-filter: blur(6px))) {
  .ch4-layout :deep(.floating-panel) {
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
}
@supports not ((backdrop-filter: blur(6px)) or (-webkit-backdrop-filter: blur(6px))) {
  .ch4-layout :deep(.floating-panel) {
    background-color: rgba(6, 10, 30, 0.86);
  }
}
.ch4-layout :deep(.floating-panel__title) {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  color: var(--c-accent);
  margin: 0 0 var(--sp-sm) 0;
  font-size: 1.25rem;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .ch4-layout :deep(.floating-panel) { animation: none; }
}

/* ── Contenido — dentro de la columna flotante ─────────────────────────────── */
.ch4-content {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  margin-top: var(--sp-sm);
}

.ch4-flavor {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 0.95rem;
  font-style: italic;
  color: var(--c-fg);
  opacity: 0.85;
  margin: 0 0 var(--sp-sm) 0;
}

.ch4-bio {
  font-family: Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--c-fg);
  margin: 0;
}

.ch4-project-desc {
  font-family: Georgia, serif;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--c-fg);
  margin: 0 0 var(--sp-sm) 0;
}

.ch4-project-role {
  font-size: 0.85rem;
  color: var(--c-fg);
  opacity: 0.7;
  font-style: italic;
  margin: 0 0 var(--sp-xs) 0;
}

.ch4-project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-xs);
  list-style: none;
  padding: 0;
  margin: 0 0 var(--sp-md) 0;
}

.ch4-project-tech li {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  color: var(--c-fg);
}

.ch4-project-link {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.9rem;
  background: linear-gradient(
    to bottom,
    var(--c-accent),
    color-mix(in srgb, var(--c-accent) 60%, #000)
  );
  color: #000;
  text-decoration: none;
  text-shadow: none;
  font-weight: 700;
}

/* ─────────────────────────────────────────────────────────────
 * Multiverso — colores de glifos y partículas reactivos al universo activo.
 * Las transiciones CSS no funcionan en custom properties sin @property,
 * así que el shader WebGL es quien provee la transición suave visual.
 * U0 Synthwave (default) no necesita selector — usa los valores base.
 * ───────────────────────────────────────────────────────────── */
.ch4-glyph {
  transition: color 0.4s ease, text-shadow 0.4s ease;
}

/* U1 Tron — verde fósforo */
.ch4-layout[data-universe="1"] .ch4-glyph {
  color: #00ff4d;
  text-shadow: 0 0 6px rgba(0, 255, 77, 0.9), 0 0 14px rgba(0, 255, 77, 0.5);
}
.ch4-layout[data-universe="1"] .ch4-p--dot { background: rgba(0, 255, 77, 0.9); box-shadow: 0 0 3px rgba(0, 255, 77, 0.8); }
.ch4-layout[data-universe="1"] .ch4-p--rhombus { border-color: rgba(0, 255, 77, 0.65); }
.ch4-layout[data-universe="1"] .ch4-p--cross { color: rgba(0, 255, 77, 0.65); text-shadow: 0 0 4px rgba(0, 255, 77, 0.55); }

/* U2 Vaporwave — lavanda/teal */
.ch4-layout[data-universe="2"] .ch4-glyph {
  color: #e666ff;
  text-shadow: 0 0 6px rgba(230, 102, 255, 0.9), 0 0 14px rgba(51, 230, 217, 0.5);
}
.ch4-layout[data-universe="2"] .ch4-p--dot { background: rgba(51, 230, 217, 0.9); box-shadow: 0 0 3px rgba(51, 230, 217, 0.8); }
.ch4-layout[data-universe="2"] .ch4-p--rhombus { border-color: rgba(230, 102, 255, 0.65); }
.ch4-layout[data-universe="2"] .ch4-p--cross { color: rgba(51, 230, 217, 0.65); }

/* U3 Void — rojo profundo */
.ch4-layout[data-universe="3"] .ch4-glyph {
  color: #cc0014;
  text-shadow: 0 0 6px rgba(204, 0, 20, 0.9), 0 0 14px rgba(204, 0, 20, 0.4);
}
.ch4-layout[data-universe="3"] .ch4-p--dot { background: rgba(204, 0, 20, 0.9); box-shadow: 0 0 3px rgba(204, 0, 20, 0.8); }
.ch4-layout[data-universe="3"] .ch4-p--rhombus { border-color: rgba(204, 0, 20, 0.65); }
.ch4-layout[data-universe="3"] .ch4-p--cross { color: rgba(204, 0, 20, 0.65); }

/* ── HUD + suelo holográfico + paneles: colores reactivos al universo ────── */

/* U1 Tron — verde fósforo */
.ch4-layout[data-universe="1"] .ch4-hud-tl,
.ch4-layout[data-universe="1"] .ch4-hud-tr,
.ch4-layout[data-universe="1"] .ch4-hud-bl,
.ch4-layout[data-universe="1"] .ch4-hud-br {
  color: rgba(0, 255, 77, 0.48);
  border-color: rgba(0, 255, 77, 0.22);
}
.ch4-layout[data-universe="1"] .ch4-hud-accent { color: #00ff4d; text-shadow: 0 0 6px rgba(0, 255, 77, 0.4); }
.ch4-layout[data-universe="1"] :deep(.floating-panel) {
  box-shadow: 0 0 14px rgba(0, 255, 77, 0.14), inset 0 0 0 1px rgba(0, 255, 77, 0.18);
}

/* U2 Vaporwave — lavanda/teal */
.ch4-layout[data-universe="2"] .ch4-hud-tl,
.ch4-layout[data-universe="2"] .ch4-hud-tr,
.ch4-layout[data-universe="2"] .ch4-hud-bl,
.ch4-layout[data-universe="2"] .ch4-hud-br {
  color: rgba(230, 102, 255, 0.48);
  border-color: rgba(230, 102, 255, 0.22);
}
.ch4-layout[data-universe="2"] .ch4-hud-accent { color: #e666ff; text-shadow: 0 0 6px rgba(230, 102, 255, 0.4); }
.ch4-layout[data-universe="2"] :deep(.floating-panel) {
  box-shadow: 0 0 14px rgba(230, 102, 255, 0.14), inset 0 0 0 1px rgba(230, 102, 255, 0.18);
}

/* U3 Void — rojo profundo */
.ch4-layout[data-universe="3"] .ch4-hud-tl,
.ch4-layout[data-universe="3"] .ch4-hud-tr,
.ch4-layout[data-universe="3"] .ch4-hud-bl,
.ch4-layout[data-universe="3"] .ch4-hud-br {
  color: rgba(204, 0, 20, 0.48);
  border-color: rgba(204, 0, 20, 0.22);
}
.ch4-layout[data-universe="3"] .ch4-hud-accent { color: #cc0014; text-shadow: 0 0 6px rgba(204, 0, 20, 0.4); }
.ch4-layout[data-universe="3"] :deep(.floating-panel) {
  box-shadow: 0 0 14px rgba(204, 0, 20, 0.14), inset 0 0 0 1px rgba(204, 0, 20, 0.18);
}

/* ─────────────────────────────────────────────────────────────
 * TASK-010 — coreografía de entrada "ponerse el visor" (spec §6).
 * El shader (Ch4PortalShader) es dueño de su propio timer de óptica
 * (viñeta/barrel/CA/godrays); acá solo reaccionamos al [data-jump] que
 * emite vía jump-progress para orquestar la coreografía DOM: título y
 * paneles se ocultan durante BOOT/OPEN y reaparecen en BURST/LOCK, la
 * pila de parallax completa hace un "settle" de escala (el espacio se
 * abre en profundidad), y las líneas de boot del HUD aparecen con stagger.
 *
 * Reentradas cortas (BEATS_SHORT, spec §6) van directo de 'lock' a 'burst'
 * a 'lock' sin pasar por boot/open — título/paneles NUNCA se ocultan en
 * una reentrada, así que scrollear arriba/abajo repetidas veces no
 * castiga con un blackout cada vez (deliberado, ver Ch4PortalShader.vue).
 *
 * El settle de escala por capa (matrix/personaje/near) vive en .ch4-settle
 * arriba, no acá — separado del resto de la coreografía porque necesita su
 * propio wrapper (ver comentario del template).
 * ───────────────────────────────────────────────────────────── */
.ch4-title {
  transition: opacity 250ms ease, transform 250ms ease;
}
.ch4-layout[data-jump="boot"] .ch4-title,
.ch4-layout[data-jump="open"] .ch4-title {
  opacity: 0;
  transform: translateY(16px);
}

/* Paneles de contenido — stagger de 80ms INDIVIDUAL por panel (spec §6 beat
 * LOCK: "paneles de contenido suben 16px con fade, stagger 80ms"), no un
 * fade único de toda la columna. El panel principal (bio+flavor) entra
 * primero (0ms); cada FloatingPanel de proyecto en .ch4-projects entra
 * 80ms después del anterior — nth-child cubre hasta 4 proyectos, holgado
 * frente al contenido real (hoy 1).
 */
.ch4-content > :deep(.floating-panel),
.ch4-projects :deep(.floating-panel) {
  transition: opacity 250ms ease, transform 250ms ease;
}
.ch4-layout[data-jump="boot"] .ch4-content > :deep(.floating-panel),
.ch4-layout[data-jump="open"] .ch4-content > :deep(.floating-panel),
.ch4-layout[data-jump="boot"] .ch4-projects :deep(.floating-panel),
.ch4-layout[data-jump="open"] .ch4-projects :deep(.floating-panel) {
  opacity: 0;
  transform: translateY(16px);
}
.ch4-content > :deep(.floating-panel)             { transition-delay: 0ms; }
.ch4-projects :deep(.floating-panel):nth-child(1) { transition-delay: 80ms; }
.ch4-projects :deep(.floating-panel):nth-child(2) { transition-delay: 160ms; }
.ch4-projects :deep(.floating-panel):nth-child(3) { transition-delay: 240ms; }
.ch4-projects :deep(.floating-panel):nth-child(4) { transition-delay: 320ms; }

/* Boot lines — visibles solo durante BOOT/OPEN, con stagger de 60ms
   (spec §6 beat 0: "HUD aparece línea a línea"). Viven junto al resto del
   HUD, esquina inferior-izquierda, encima de FPS/LATENCY (que aparecen
   recién en LOCK — no compiten por espacio en el tiempo). */
.ch4-hud-boot {
  position: absolute;
  bottom: 44px;
  left: 14px;
  font-family: 'Audiowide', 'Eurostile', monospace;
  font-size: 0.44rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(0, 255, 255, 0.6);
  pointer-events: none;
}
.ch4-hud-boot-line {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 200ms ease, transform 200ms ease;
}
.ch4-hud-boot-line:nth-child(1) { transition-delay: 0ms; }
.ch4-hud-boot-line:nth-child(2) { transition-delay: 60ms; }
.ch4-hud-boot-line:nth-child(3) { transition-delay: 120ms; }
.ch4-layout[data-jump="boot"] .ch4-hud-boot-line,
.ch4-layout[data-jump="open"] .ch4-hud-boot-line {
  opacity: 1;
  transform: translateY(0);
}

/* ─────────────────────────────────────────────────────────────
 * PRM — congela todo el movimiento del parallax.
 * ───────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ch4-layer,
  .ch4-character-art,
  .ch4-glyph,
  .ch4-panel-column,
  .ch4-portal-pulse,
  .ch4-p { animation: none !important; transition: none !important; }
  .ch4-layer { transform: none !important; }
  .ch4-character-art { transform: none !important; }
  .ch4-panel-column { transform: none !important; }
  .ch4-glyph { opacity: 0.3 !important; }
  /* Pulso estático — energía visible pero sin movimiento */
  .ch4-portal-pulse { opacity: 0.15 !important; transform: translate(-50%, -50%) !important; }
  /* Partículas ocultas bajo PRM — muy difíciles de seguir estáticas */
  .ch4-p { opacity: 0 !important; }
  /* HUD y glifos: sin transiciones bajo PRM */
  .ch4-hud-tl, .ch4-hud-tr, .ch4-hud-bl, .ch4-hud-br,
  .ch4-hud-accent { transition: none !important; }
  /* Visor y stream: sin animación, sin flash */
  .ch4-visor-glow { animation: none !important; opacity: 0.35 !important; }
  .ch4-ds { display: none !important; }
  /* Defensivo (TASK-010): jumpBeat nunca sale de 'lock' bajo PRM en la
     práctica (el loop del shader no arranca) — título y paneles quedan en
     su estado visible por default (§ arriba). Solo se neutraliza la
     TRANSICIÓN/transform, nunca se fuerza opacity (las boot-lines deben
     seguir ocultas por default, no aparecer permanentes bajo PRM). */
  .ch4-title,
  .ch4-panel-column,
  .ch4-parallax,
  .ch4-hud-boot-line,
  .ch4-settle--matrix,
  .ch4-settle--character,
  .ch4-settle--near,
  .ch4-content > :deep(.floating-panel),
  .ch4-projects :deep(.floating-panel) {
    transition: none !important;
  }
  .ch4-parallax,
  .ch4-settle--matrix,
  .ch4-settle--character,
  .ch4-settle--near {
    transform: none !important;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Mobile <600px stacked (D3-09 heredado) — sin parallax de puntero.
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch4-layout {
    padding: calc(64px + var(--sp-sm)) var(--sp-sm) var(--sp-sm);
  }

  /* Título: sin márgenes negativos en mobile (causaban desborde); centrado en el
     content box, fuente chica para que entre/ envuelva limpio. */
  .ch4-title {
    margin: 0 0 var(--sp-sm);
    font-size: 1.05rem;
  }

  /* Proyectos apilados (1 col) en mobile — 2 col queda muy apretado. */
  .ch4-projects {
    grid-template-columns: 1fr;
  }

  /* Sin puntero táctil: capas estáticas. NUNCA position:fixed — se anclaría al
     viewport y haría bleed a otros chapters (bug chapter-overlap + iOS fixed buggy).
     Se mantiene absolute, contenido dentro de .ch4-layout. */
  .ch4-parallax { position: absolute; }
  /* Sin movimiento → sin overscan: inset:0 / 100% mata el desborde que el 116%
     causaba en el layout viewport mobile (corrección de raíz del overflow-x). */
  .ch4-layer { transform: none; inset: 0; width: 100%; height: 100%; }

  /* Columna: width auto + align-self stretch → la dimensiona el contenedor (sin
     width:100% que se resolvía mal). Sin offset ni float. */
  .ch4-panel-column {
    align-self: stretch;
    width: auto;
    max-width: 100%;
    margin: var(--sp-sm) 0 0 0;
    /* Recalculada con el margin-top real de mobile (var(--sp-sm), no el
       clamp() de desktop) — mismo fix §8, cota de altura consistente. */
    max-height: calc(100% - var(--sp-sm) - var(--ch4-title-h, 56px) - var(--sp-sm));
    animation: none;
  }

  /* HUD: esquinas muy pequeñas en mobile — reducir font y padding */
  .ch4-hud-tl,
  .ch4-hud-tr,
  .ch4-hud-bl,
  .ch4-hud-br {
    font-size: 0.38rem;
    padding: 3px 5px;
  }
}
</style>
