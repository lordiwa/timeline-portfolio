<!--
  Chapter3Content.vue — "De vuelta al movimiento" · posguerra de Flash, estética
  Kingdom New Lands (Raw Fury).

  iter11 (Rafael 2026-07-09): "los assets del fondo se ven mal cortados y feos...
  composición de posguerra donde murió Flash... estética como Kingdom New Lands".
  El entorno sigue siendo el PROTAGONISTA (iter10) pero el escenario se rehace:
  cielo crepuscular con sol enorme (la era muriendo), siluetas atmosféricas en
  4 planos, AGUA ESPEJO al pie (firma Kingdom: reflejo + shimmer + ondas al click),
  bandada de pájaros cruzando, brasas dolientes. Los 5 emblemas-cuento se conservan.

  iter10: 5 emblemas de arte clicables → recuadro pergamino con la biografía.
  iter9: parallax de 3 capas + drift + puntero + scroll.

  Assets activos (iter5 Kingdom — old/CHANGELOG.md §6.5):
    - Capas: ch3-sky.png (sol cx≈28% cy≈55%) / ch3-far.png (cordillera malva) /
      ch3-mountains.png (ciudadela en ruinas, bottom-right) / ch3-path.png (cresta
      de batalla casi negra con rim ámbar)
    - Emblemas clicables: ch3-flash-fallen / ch3-mark-rebuild / ch3-mark-standard /
      ch3-mark-orb / ch3-html5-future
    - Recuadro: ch3-parchment.png

  Agua espejo: .ch3-water (14dvh, overflow hidden) contiene copias de las 4 capas
  con transform-origin top + translateY(calc(100dvh - altura-agua)) scaleY(-1) →
  la ventana visible muestra la franja de escena justo sobre la línea de agua,
  invertida. Ondas: spans .ch3-ripple generados al click sobre el agua.

  PRM: bajo prefers-reduced-motion se desactivan parallax + animaciones + ondas
  (guard JS + @media). El reflejo queda estático (sigue siendo bello quieto).
-->
<script setup>
import { computed, ref, inject, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Emblemas clicables — 1 por párrafo de la historia. OBJETOS DEL MUNDO (iter2
// Kingdom): cuerpo silueta ciruela + acento ámbar. Los I-IV están PLANTADOS en
// el suelo (no flotan); solo el V flota en el cielo del este (sky: true).
// pos en % relativo a .ch3-content. Cada uno despliega bioParagraphs[idx].
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
// Arco muerte→renacer (Rafael 2026-05-28): 1 emblema por párrafo.
//   I  Flash caído ......... estela rota con la "F" de brasas, en la orilla oeste
//   II reconstrucción ...... yunque con filo ámbar, en el campo entre lanzas
//   III estandarte ......... pendón oscuro con diamante encendido, al pie de las ruinas
//   IV orbe creativo ....... atardecer capturado en pedestal, ladera este
//   V  HTML5 naciente ...... estrella-escudo del alba, alto en el cielo del este
const markers = [
  { key: 'flash',    src: '/assets/ch3-flash-fallen.png', top: '72%', left: '12%', size: 104 },
  { key: 'rebuild',  src: '/assets/ch3-mark-rebuild.png',  top: '75%', left: '33%', size: 96 },
  { key: 'standard', src: '/assets/ch3-mark-standard.png', top: '70%', left: '52%', size: 100 },
  { key: 'orb',      src: '/assets/ch3-mark-orb.png',      top: '74%', left: '72%', size: 90 },
  { key: 'html5',    src: '/assets/ch3-html5-future.png',  top: '30%', left: '88%', size: 96, sky: true },
]

// Brasas ascendentes — posguerra: pocas, lentas, dolientes
const embers = [
  { left: '9%',  delay: '-4s',  dur: '19s', size: '3px', color: '#ff9a3c', dx: '8px'   },
  { left: '21%', delay: '-11s', dur: '24s', size: '2px', color: '#ffd95c', dx: '-6px'  },
  { left: '37%', delay: '-2s',  dur: '21s', size: '2px', color: '#ff5a3c', dx: '10px'  },
  { left: '55%', delay: '-15s', dur: '26s', size: '3px', color: '#ff9a3c', dx: '-8px'  },
  { left: '68%', delay: '-7s',  dur: '22s', size: '2px', color: '#ffd95c', dx: '6px'   },
  { left: '81%', delay: '-18s', dur: '28s', size: '2px', color: '#ff9a3c', dx: '-10px' },
  { left: '92%', delay: '-9s',  dur: '20s', size: '3px', color: '#ff5a3c', dx: '8px'   },
]

// Ceniza descendente — motas grises cayendo lento
const ashes = [
  { left: '8%',  delay: '-4s',  dur: '18s', size: '2px' },
  { left: '22%', delay: '-9s',  dur: '24s', size: '3px' },
  { left: '38%', delay: '-2s',  dur: '20s', size: '2px' },
  { left: '55%', delay: '-7s',  dur: '22s', size: '2px' },
  { left: '69%', delay: '-13s', dur: '26s', size: '3px' },
  { left: '78%', delay: '-5s',  dur: '19s', size: '2px' },
  { left: '93%', delay: '-11s', dur: '21s', size: '2px' },
]

// Bandada de pájaros silueta cruzando el cielo (firma Kingdom)
const birds = [
  { top: '0px',  delay: '0s',    flap: '0.42s' },
  { top: '9px',  delay: '0.12s', flap: '0.38s' },
  { top: '4px',  delay: '0.3s',  flap: '0.46s' },
  { top: '16px', delay: '0.5s',  flap: '0.40s' },
  { top: '12px', delay: '0.75s', flap: '0.44s' },
]

// ── Estado del cuento ─────────────────────────────────────────────────────────
const activeStory = ref(null)      // índice abierto (0..4) o null
const visited = ref(new Set())     // emblemas ya leídos
const panelRef = ref(null)

const isOpen = computed(() => activeStory.value !== null)
const activeParagraph = computed(() =>
  activeStory.value === null ? '' : bioParagraphs.value[activeStory.value] || ''
)

function openStory(i) {
  activeStory.value = i
  visited.value.add(markers[i].key)
  nextTick(() => panelRef.value?.focus())
}
function closeStory() {
  const k = activeStory.value !== null ? markers[activeStory.value].key : null
  activeStory.value = null
  // devolver foco al emblema que se abrió
  if (k) nextTick(() => document.getElementById(`ch3-mark-${k}`)?.focus())
}
function goStory(delta) {
  if (activeStory.value === null) return
  const next = activeStory.value + delta
  if (next < 0 || next >= markers.length) return
  activeStory.value = next
  visited.value.add(markers[next].key)
}

// ── Parallax (cielo lento → cresta rápida) ─────────────────────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

// ── Escena de entrada (ch3 es el chapter LANDING: esto abre el sitio) ─────────
// Al activarse el chapter por primera vez el mundo se revela: cielo florece,
// planos suben escalonados, el agua aparece, el título respira y los emblemas
// se encienden uno a uno. PRM o sin shell (tests): escena completa sin cine.
const scrollState = inject('scrollState', null)
const arrived = ref(!scrollState)     // sin shell → visible de entrada
const cinematic = ref(false)          // true solo cuando la llegada se anima

if (scrollState?.activeChapter) {
  watch(
    scrollState.activeChapter,
    (n) => {
      if (n === 3 && !arrived.value) {
        if (!reduced()) cinematic.value = true
        arrived.value = true
      }
    },
    { immediate: true }
  )
} else {
  arrived.value = true
}

const parallaxRef = ref(null)
let raf = 0
let sx = 0, mx = 0, my = 0

function flush() {
  raf = 0
  const el = parallaxRef.value
  if (!el) return
  el.style.setProperty('--sx', String(sx))
  el.style.setProperty('--mx', mx.toFixed(3))
  el.style.setProperty('--my', my.toFixed(3))
}
function schedule() { if (!raf) raf = requestAnimationFrame(flush) }
function onScroll(e) { if (reduced()) return; sx = e.target.scrollTop; schedule() }
function onPointer(e) {
  if (reduced()) return
  mx = e.clientX / window.innerWidth - 0.5
  my = e.clientY / window.innerHeight - 0.5
  schedule()
}
function onKeydown(e) {
  if (!isOpen.value) return
  if (e.key === 'Escape') { e.preventDefault(); closeStory() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); goStory(1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); goStory(-1) }
}

// ── Agua: ondas al click (interactividad Kingdom) ─────────────────────────────
const ripples = ref([])   // { id, x, y } en % relativos a .ch3-water
let rippleId = 0

function spawnRipple(e) {
  if (reduced() || isOpen.value) return
  const vh = window.innerHeight
  const waterTop = vh * 0.86            // .ch3-water ocupa el 14% inferior
  if (e.clientY < waterTop) return
  const x = (e.clientX / window.innerWidth) * 100
  const y = ((e.clientY - waterTop) / (vh - waterTop)) * 100
  const id = ++rippleId
  ripples.value.push({ id, x, y })
  if (ripples.value.length > 6) ripples.value.shift()
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 1400)
}

onMounted(() => {
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  window.removeEventListener('keydown', onKeydown)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    class="ch3-stage"
    :class="{ 'is-waiting': !arrived, 'is-arriving': cinematic }"
    @scroll="onScroll"
    @click="spawnRipple"
  >
    <!-- ── Parallax stack (pinned) ───────────────────────────────────────── -->
    <div ref="parallaxRef" class="ch3-parallax" aria-hidden="true">
      <div class="ch3-layer ch3-layer--sky"></div>
      <div class="ch3-layer ch3-layer--far"></div>
      <div class="ch3-fx ch3-fx--magic"></div>
      <div class="ch3-layer ch3-layer--mountains"></div>
      <div class="ch3-layer ch3-layer--path"></div>

      <!-- Bandada de pájaros silueta (firma Kingdom). Fuera del DOM bajo PRM. -->
      <div v-if="!reduced()" class="ch3-birds" aria-hidden="true">
        <span
          v-for="(b, i) in birds"
          :key="`bird-${i}`"
          class="ch3-bird"
          :style="{ top: b.top, '--bd-delay': b.delay, '--bd-flap': b.flap, '--bd-i': i }"
        ></span>
      </div>

      <!-- Brasas y ceniza — posguerra doliente. Desactivado bajo PRM. -->
      <template v-if="!reduced()">
        <div class="ch3-embers" aria-hidden="true">
          <span
            v-for="(em, i) in embers"
            :key="`ember-${i}`"
            class="ch3-ember"
            :style="{
              left: em.left,
              '--em-delay': em.delay,
              '--em-dur': em.dur,
              '--em-size': em.size,
              '--em-color': em.color,
              '--em-dx': em.dx,
            }"
          ></span>
        </div>
        <div class="ch3-ashes" aria-hidden="true">
          <span
            v-for="(ash, i) in ashes"
            :key="`ash-${i}`"
            class="ch3-ash"
            :style="{
              left: ash.left,
              '--ash-delay': ash.delay,
              '--ash-dur': ash.dur,
              '--ash-size': ash.size,
            }"
          ></span>
        </div>
        <div class="ch3-haze" aria-hidden="true"></div>
      </template>

      <!-- ── Agua espejo (firma Kingdom): reflejo + shimmer + glint + ondas ── -->
      <div class="ch3-water" aria-hidden="true">
        <div class="ch3-water-layer ch3-water-layer--sky"></div>
        <div class="ch3-water-layer ch3-water-layer--far"></div>
        <div class="ch3-water-layer ch3-water-layer--mountains"></div>
        <div class="ch3-water-layer ch3-water-layer--path"></div>
        <div class="ch3-water-tint"></div>
        <div class="ch3-water-shimmer"></div>
        <div class="ch3-water-glint"></div>
        <span
          v-for="r in ripples"
          :key="`ripple-${r.id}`"
          class="ch3-ripple"
          :style="{ left: r.x + '%', top: r.y + '%' }"
        ></span>
      </div>
    </div>

    <!-- ── Contenido: hint sutil + emblemas clicables ────────────────────── -->
    <div class="ch3-content">
      <!-- Hint mínimo (el entorno es el protagonista) -->
      <header class="ch3-hint">
        <p class="ch3-hint-era">Rafael · 2013</p>
        <h1 class="ch3-hint-title">{{ t('ui.deathOfFlash') }}</h1>
        <p class="ch3-hint-cta">{{ t('ui.storyHint') }}</p>
      </header>

      <!-- Emblemas de arte plantados en el escenario -->
      <button
        v-for="(m, i) in markers"
        :id="`ch3-mark-${m.key}`"
        :key="m.key"
        type="button"
        class="ch3-mark"
        :class="{ 'ch3-mark--sky': m.sky, 'is-visited': visited.has(m.key), 'is-active': activeStory === i }"
        :style="{ top: m.top, left: m.left, '--mk-size': m.size + 'px', '--mk-i': i }"
        :aria-label="`${ROMAN[i]} — ${t('ui.storyPage', { n: i + 1, total: markers.length })}`"
        @click.stop="openStory(i)"
      >
        <img :src="m.src" alt="" class="ch3-mark-img" />
        <span class="ch3-mark-num" aria-hidden="true">{{ ROMAN[i] }}</span>
      </button>

      <!-- Project cards (vacío para ch3 — condicional por si se añaden) -->
      <div v-if="ch3Projects.length > 0" class="ch3-projects">
        <ProjectCard v-for="project in ch3Projects" :key="project.id" :project="project" />
      </div>
    </div>

    <!-- ── Recuadro pergamino: fragmento de la historia ──────────────────── -->
    <transition name="ch3-panel-fade">
      <div v-if="isOpen" class="ch3-panel-backdrop" @click.self.stop="closeStory">
        <div
          ref="panelRef"
          class="ch3-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="t('ui.storyPage', { n: activeStory + 1, total: markers.length })"
          tabindex="-1"
        >
          <button type="button" class="ch3-panel-close" :aria-label="t('ui.closeOverlay')" @click.stop="closeStory">✕</button>

          <div class="ch3-panel-head" aria-hidden="true">
            <span class="ch3-panel-numeral">{{ ROMAN[activeStory] }}</span>
          </div>

          <p class="ch3-panel-text">{{ activeParagraph }}</p>

          <div class="ch3-panel-nav">
            <button
              type="button"
              class="ch3-panel-arrow"
              :disabled="activeStory === 0"
              :aria-label="t('ui.storyPrev')"
              @click.stop="goStory(-1)"
            >‹</button>
            <div class="ch3-panel-dots" aria-hidden="true">
              <span
                v-for="(m, i) in markers"
                :key="m.key"
                class="ch3-panel-dot"
                :class="{ 'is-on': i === activeStory }"
              ></span>
            </div>
            <button
              type="button"
              class="ch3-panel-arrow"
              :disabled="activeStory === markers.length - 1"
              :aria-label="t('ui.storyNext')"
              @click.stop="goStory(1)"
            >›</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch3-stage — contenedor. El bg lo pintan las capas parallax.
 * --ch3-water-h: altura de la banda de agua espejo (fracción del viewport).
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-stage {
  --ch3-water-h: 14dvh;
  position: relative;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background-color: #141022;
  image-rendering: pixelated;
}

/* ── Parallax (pinned al viewport del stage) ───────────────────────────────── */
.ch3-parallax {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  margin-bottom: -100vh;
  margin-bottom: -100dvh;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.ch3-layer {
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

/* Profundidad Kingdom: cielo casi quieto → cresta cercana con el drift más ancho */
.ch3-layer--sky {
  background-image: url('/assets/ch3-sky.png');
  background-position: 50% top;
  transform: translate3d(calc(var(--mx, 0) * 6px), calc(var(--sx, 0) * -0.015px + var(--my, 0) * 4px), 0);
  animation: ch3-sky-drift 90s ease-in-out infinite alternate;
}
@keyframes ch3-sky-drift { from { background-position: 49% top; } to { background-position: 51% top; } }

.ch3-layer--far {
  background-image: url('/assets/ch3-far.png');
  background-position: center bottom;
  transform: translate3d(calc(var(--mx, 0) * 13px), calc(var(--sx, 0) * -0.035px + var(--my, 0) * 5px), 0);
}

.ch3-layer--mountains {
  background-image: url('/assets/ch3-mountains.png');
  background-position: center bottom;
  transform: translate3d(calc(var(--mx, 0) * 22px), calc(var(--sx, 0) * -0.06px + var(--my, 0) * 4px), 0);
}

.ch3-layer--path {
  background-image: url('/assets/ch3-path.png');
  background-position: center bottom;
  transform: translate3d(calc(var(--mx, 0) * 34px), calc(var(--sx, 0) * -0.11px + var(--my, 0) * 3px), 0);
}

/* ── FX luz ambiente ───────────────────────────────────────────────────────── */
.ch3-fx { position: absolute; inset: 0; pointer-events: none; }

/* Halo cálido anclado al sol (cx≈28% cy≈42% del viewport) + insinuación fría
   del amanecer HTML5 en el este (arriba-derecha, donde vive el emblema V) */
.ch3-fx--magic {
  background:
    radial-gradient(34% 30% at 28% 42%, rgba(255, 196, 120, 0.32) 0%, rgba(255, 170, 90, 0.10) 55%, transparent 75%),
    radial-gradient(30% 24% at 88% 28%, rgba(150, 220, 255, 0.14) 0%, transparent 70%);
  mix-blend-mode: screen;
  animation: ch3-magic-pulse 8s ease-in-out infinite;
}
@keyframes ch3-magic-pulse { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }

/* ── Bandada de pájaros silueta ────────────────────────────────────────────── */
.ch3-birds {
  position: absolute;
  top: 24%;
  left: 0;
  width: 64px;
  height: 32px;
  animation: ch3-flock 38s linear infinite;
  animation-delay: 4s;
  opacity: 0;
}
@keyframes ch3-flock {
  0%    { transform: translate3d(-12vw, 0, 0);      opacity: 0; }
  2%    { opacity: 0.9; }
  20%   { transform: translate3d(40vw, -3vh, 0);    opacity: 0.9; }
  42%   { transform: translate3d(112vw, -7vh, 0);   opacity: 0.9; }
  42.1% { opacity: 0; }
  100%  { transform: translate3d(112vw, -7vh, 0);   opacity: 0; }
}
.ch3-bird {
  position: absolute;
  left: calc(var(--bd-i, 0) * 12px);
  width: 9px;
  height: 3px;
}
.ch3-bird::before,
.ch3-bird::after {
  content: '';
  position: absolute;
  top: 0;
  width: 5px;
  height: 2px;
  background: #241a2e;
  transform-origin: 100% 50%;
  animation: ch3-flap-l var(--bd-flap, 0.42s) ease-in-out var(--bd-delay, 0s) infinite alternate;
}
.ch3-bird::after {
  left: 4px;
  transform-origin: 0% 50%;
  animation-name: ch3-flap-r;
}
@keyframes ch3-flap-l { from { transform: rotate(18deg); } to { transform: rotate(-22deg); } }
@keyframes ch3-flap-r { from { transform: rotate(-18deg); } to { transform: rotate(22deg); } }

/* ─────────────────────────────────────────────────────────────────────────
 * Agua espejo — la firma de Kingdom New Lands.
 * Copias de las 4 capas con origin top + translateY(100dvh - agua) + scaleY(-1):
 * la ventana visible del contenedor muestra la franja de escena justo encima
 * de la línea de agua, invertida. Encima: tinte, shimmer y glint del sol.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-water {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--ch3-water-h);
  overflow: hidden;
  z-index: 1;
}

.ch3-water-layer {
  position: absolute;
  top: 0;
  left: -8%;
  width: 116%;
  height: 100vh;
  height: 100dvh;
  background-repeat: no-repeat;
  background-size: cover;
  image-rendering: pixelated;
  transform-origin: top;
  filter: brightness(0.72) saturate(0.82);
}

.ch3-water-layer--sky {
  background-image: url('/assets/ch3-sky.png');
  background-position: 50% top;
  transform: translateX(calc(var(--mx, 0) * 6px)) translateY(calc(100dvh - var(--ch3-water-h))) scaleY(-1);
}
.ch3-water-layer--far {
  background-image: url('/assets/ch3-far.png');
  background-position: center bottom;
  transform: translateX(calc(var(--mx, 0) * 13px)) translateY(calc(100dvh - var(--ch3-water-h))) scaleY(-1);
}
.ch3-water-layer--mountains {
  background-image: url('/assets/ch3-mountains.png');
  background-position: center bottom;
  transform: translateX(calc(var(--mx, 0) * 22px)) translateY(calc(100dvh - var(--ch3-water-h))) scaleY(-1);
}
.ch3-water-layer--path {
  background-image: url('/assets/ch3-path.png');
  background-position: center bottom;
  transform: translateX(calc(var(--mx, 0) * 34px)) translateY(calc(100dvh - var(--ch3-water-h))) scaleY(-1);
}

/* Tinte índigo del agua + oscurecimiento hacia el fondo */
.ch3-water-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(24, 16, 44, 0.30) 0%,
    rgba(18, 12, 36, 0.55) 55%,
    rgba(12, 8, 26, 0.78) 100%
  );
}
/* Línea de orilla: 1px de luz fría donde la escena toca el agua */
.ch3-water-tint::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(190, 170, 220, 0.5);
}

/* Shimmer: finas líneas horizontales derivando en sentidos opuestos */
.ch3-water-shimmer {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 3px,
      rgba(220, 200, 255, 0.055) 3px, rgba(220, 200, 255, 0.055) 4px,
      transparent 4px, transparent 9px
    );
  animation: ch3-shimmer 7s ease-in-out infinite alternate;
  mix-blend-mode: screen;
}
@keyframes ch3-shimmer {
  from { transform: translateX(-14px); opacity: 0.65; }
  to   { transform: translateX(14px);  opacity: 1; }
}

/* Glint: columna de brillo del sol sobre el agua (sol a x≈28%) */
.ch3-water-glint {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(18% 130% at 28% 0%, rgba(255, 200, 120, 0.34) 0%, rgba(255, 180, 100, 0.10) 60%, transparent 80%);
  mix-blend-mode: screen;
  animation: ch3-glint 5.5s ease-in-out infinite;
}
@keyframes ch3-glint { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

/* Onda al click: elipse expandiéndose (perspectiva del agua) */
.ch3-ripple {
  position: absolute;
  width: 10px;
  height: 4px;
  margin: -2px 0 0 -5px;
  border: 1px solid rgba(220, 205, 255, 0.75);
  border-radius: 50%;
  opacity: 0.9;
  animation: ch3-ripple-grow 1.35s ease-out forwards;
}
.ch3-ripple::after {
  content: '';
  position: absolute;
  inset: -1px;
  border: 1px solid rgba(255, 210, 150, 0.35);
  border-radius: 50%;
  animation: ch3-ripple-grow 1.35s ease-out 0.18s forwards;
}
@keyframes ch3-ripple-grow {
  from { transform: scale(1);   opacity: 0.9; }
  to   { transform: scale(11);  opacity: 0; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Contenido — encima del parallax. El escenario manda; texto mínimo.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-content {
  position: relative;
  z-index: 2;
  min-height: 100%;
  box-sizing: border-box;
  padding: calc(88px + var(--sp-md)) var(--sp-lg) calc(88px + env(safe-area-inset-bottom, 0px));
}

/* Hint sutil top-center */
.ch3-hint {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
  pointer-events: none;
}
.ch3-hint-era {
  font-family: 'Cinzel', 'Trajan Pro', serif;
  font-size: 0.85rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #e8b27a;
  margin: 0 0 4px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}
.ch3-hint-title {
  font-family: 'Cinzel Decorative', 'Cinzel', 'Trajan Pro', serif;
  font-weight: 900;
  font-size: clamp(2.1rem, 5.2vw, 3.6rem);
  letter-spacing: 0.04em;
  margin: 0 0 10px;
  line-height: 1.08;
  color: #fbeede;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.85),
    0 0 22px rgba(255, 140, 60, 0.6),
    0 0 44px rgba(255, 90, 40, 0.35);
}
.ch3-hint-cta {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 0.95rem;
  font-style: italic;
  color: #f0e2cf;
  margin: 0;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85);
  animation: ch3-hint-pulse 3s ease-in-out infinite;
}
@keyframes ch3-hint-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

/* ── Emblemas clicables — objetos del mundo Kingdom ────────────────────────
 * I-IV plantados en el suelo (sin bob); solo .ch3-mark--sky flota.
 * Affordance: brasa que respira detrás + placa rúnica con numeral.           */
.ch3-mark {
  position: absolute;
  z-index: 2;
  width: var(--mk-size, 88px);
  height: var(--mk-size, 88px);
  transform: translate(-50%, -50%);
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
  transition: filter 0.2s ease, transform 0.18s ease;
  filter: drop-shadow(0 3px 8px rgba(8, 5, 16, 0.7));
}
.ch3-mark--sky {
  animation: ch3-mark-float 6s ease-in-out infinite;
  animation-delay: calc(var(--mk-i, 0) * 0.6s);
}
.ch3-mark-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
}
/* Brasa que respira detrás del objeto — cálida, pequeña, del mundo */
.ch3-mark::before {
  content: '';
  position: absolute;
  inset: -14%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255, 190, 110, 0.38) 0%,
    rgba(255, 150, 70, 0.16) 48%,
    transparent 72%);
  opacity: 0.7;
  z-index: -1;
  animation: ch3-mark-glow 3.4s ease-in-out infinite;
  animation-delay: calc(var(--mk-i, 0) * 0.7s);
}
/* La estrella del alba respira en frío */
.ch3-mark--sky::before {
  background: radial-gradient(circle,
    rgba(190, 235, 255, 0.34) 0%,
    rgba(150, 210, 255, 0.14) 48%,
    transparent 72%);
}
/* Placa rúnica con el numeral */
.ch3-mark-num {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 0.72rem;
  color: #e8c187;
  background: rgba(22, 16, 30, 0.88);
  border: 1px solid rgba(222, 138, 74, 0.55);
  border-radius: 3px;
  padding: 1px 7px;
  letter-spacing: 0.08em;
  pointer-events: none;
}
.ch3-mark:hover,
.ch3-mark:focus-visible {
  transform: translate(-50%, -52%) scale(1.1);
  filter: drop-shadow(0 0 14px rgba(255, 190, 110, 0.85)) drop-shadow(0 5px 12px rgba(8, 5, 16, 0.6));
  outline: none;
}
.ch3-mark:hover::before,
.ch3-mark:focus-visible::before { opacity: 1; }
.ch3-mark.is-visited { filter: drop-shadow(0 3px 8px rgba(8, 5, 16, 0.5)) saturate(0.8) brightness(0.88); }
.ch3-mark.is-visited::before { opacity: 0.18; }
.ch3-mark.is-active::before { opacity: 1; }

@keyframes ch3-mark-float { 0%, 100% { margin-top: 0; } 50% { margin-top: -8px; } }
@keyframes ch3-mark-glow { 0%, 100% { transform: scale(0.92); opacity: 0.5; } 50% { transform: scale(1.08); opacity: 0.85; } }

/* ─────────────────────────────────────────────────────────────────────────
 * Recuadro pergamino (panel del cuento)
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-panel-backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-lg);
  background: rgba(20, 16, 30, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.ch3-panel {
  position: relative;
  width: min(560px, 92%);
  max-height: 78dvh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: clamp(28px, 5vw, 48px) clamp(26px, 5vw, 46px) clamp(20px, 4vw, 34px);
  color: #3a2a18;
  background-color: #f1e3c4;
  background-image: url('/assets/ch3-parchment.png');
  background-size: cover;
  background-position: center;
  image-rendering: pixelated;
  border: 3px solid #3a2a18;
  box-shadow: 0 18px 50px rgba(20,16,30,0.5), inset 0 0 0 2px rgba(214, 178, 110, 0.6);
  outline: none;
}
.ch3-panel-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 30px;
  height: 30px;
  border: 2px solid #3a2a18;
  border-radius: 50%;
  background: rgba(241, 227, 196, 0.9);
  color: #3a2a18;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ch3-panel-close:hover { background: #e3cf9f; }

.ch3-panel-head { text-align: center; margin-bottom: var(--sp-sm); }
.ch3-panel-numeral {
  font-family: 'Cinzel Decorative', 'Cinzel', 'Trajan Pro', serif;
  font-weight: 900;
  font-size: clamp(2.4rem, 7vw, 3.6rem);
  color: #6b4a1e;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
  position: relative;
}
.ch3-panel-numeral::after {
  content: '';
  display: block;
  width: 64px;
  height: 2px;
  margin: 8px auto 0;
  background: linear-gradient(90deg, transparent, #b88a3e, transparent);
}

.ch3-panel-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1rem, 2.4vw, 1.12rem);
  line-height: 1.75;
  margin: 0 0 var(--sp-md);
  white-space: pre-line;
}

.ch3-panel-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-md);
}
.ch3-panel-arrow {
  width: 40px;
  height: 40px;
  border: 2px solid #3a2a18;
  border-radius: 50%;
  background: rgba(241, 227, 196, 0.85);
  color: #3a2a18;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.15s ease;
}
.ch3-panel-arrow:hover:not(:disabled) { background: #e3cf9f; transform: scale(1.08); }
.ch3-panel-arrow:disabled { opacity: 0.3; cursor: default; }
.ch3-panel-dots { display: flex; gap: 8px; }
.ch3-panel-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(58, 42, 24, 0.3);
  border: 1px solid rgba(58, 42, 24, 0.5);
}
.ch3-panel-dot.is-on { background: #b88a3e; box-shadow: 0 0 8px rgba(184,138,62,0.8); }

/* Transición de entrada/salida del recuadro */
.ch3-panel-fade-enter-active,
.ch3-panel-fade-leave-active { transition: opacity 0.22s ease; }
.ch3-panel-fade-enter-active .ch3-panel,
.ch3-panel-fade-leave-active .ch3-panel { transition: transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
.ch3-panel-fade-enter-from,
.ch3-panel-fade-leave-to { opacity: 0; }
.ch3-panel-fade-enter-from .ch3-panel,
.ch3-panel-fade-leave-to .ch3-panel { transform: scale(0.9) translateY(10px); }

.ch3-projects {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-width: 720px;
  width: 100%;
  margin: var(--sp-lg) auto 0;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Brasas ascendentes y ceniza descendente — posguerra doliente.
 * Solo transform/opacity (composited). Eliminadas del DOM bajo PRM via v-if.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-embers,
.ch3-ashes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ch3-ember {
  position: absolute;
  bottom: 16%;
  width: var(--em-size, 3px);
  height: var(--em-size, 3px);
  border-radius: 50%;
  background: var(--em-color, #ff9a3c);
  box-shadow:
    0 0 4px 2px var(--em-color, #ff9a3c),
    0 0 10px 3px rgba(255, 120, 30, 0.4);
  opacity: 0;
  will-change: transform, opacity;
  animation: ch3-ember-rise var(--em-dur, 20s) ease-in-out var(--em-delay, 0s) infinite;
}

@keyframes ch3-ember-rise {
  0%   { opacity: 0;    transform: translateY(0)       translateX(0)                               scale(1);    }
  8%   { opacity: 0.7;  }
  25%  {               transform: translateY(-25vh)   translateX(var(--em-dx, 8px))              scale(0.92); }
  50%  { opacity: 0.5;  transform: translateY(-55vh)   translateX(0)                               scale(0.84); }
  75%  { opacity: 0.28; transform: translateY(-82vh)   translateX(calc(var(--em-dx, 8px) * -0.6)) scale(0.72); }
  100% { opacity: 0;    transform: translateY(-112vh)  translateX(0)                               scale(0.5);  }
}

.ch3-ash {
  position: absolute;
  top: -2%;
  width: var(--ash-size, 2px);
  height: var(--ash-size, 2px);
  border-radius: 1px;
  background: #8a8a92;
  opacity: 0;
  will-change: transform, opacity;
  animation: ch3-ash-fall var(--ash-dur, 20s) ease-in-out var(--ash-delay, 0s) infinite;
}

@keyframes ch3-ash-fall {
  0%   { opacity: 0;    transform: translateY(0)      translateX(0)    rotate(0deg);   }
  10%  { opacity: 0.5; }
  35%  {               transform: translateY(28vh)   translateX(8px)  rotate(40deg);  }
  60%  { opacity: 0.35; transform: translateY(58vh)   translateX(-6px) rotate(80deg);  }
  85%  { opacity: 0.2;  transform: translateY(88vh)   translateX(10px) rotate(130deg); }
  100% { opacity: 0;    transform: translateY(108vh)  translateX(0)    rotate(180deg); }
}

.ch3-haze {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgba(255, 130, 50, 0.06) 0%,
    rgba(255, 100, 30, 0.03) 35%,
    transparent 60%
  );
  animation: ch3-haze-pulse 8s ease-in-out infinite;
}

@keyframes ch3-haze-pulse {
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 0.9; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Escena de entrada — ch3 es el landing: la apertura del sitio.
 * .is-waiting: mundo a oscuras (aún no se llegó al chapter).
 * .is-arriving: coreografía de revelado (una sola vez, animation-fill both):
 *   cielo florece → planos suben escalonados → agua aparece → título respira
 *   → emblemas se encienden uno a uno.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-stage.is-waiting .ch3-layer,
.ch3-stage.is-waiting .ch3-fx--magic,
.ch3-stage.is-waiting .ch3-water,
.ch3-stage.is-waiting .ch3-hint,
.ch3-stage.is-waiting .ch3-mark { opacity: 0; }

.ch3-stage.is-arriving .ch3-layer--sky {
  animation: ch3-arrive-fade 1.6s ease backwards, ch3-sky-drift 90s ease-in-out 1.6s infinite alternate;
}
.ch3-stage.is-arriving .ch3-fx--magic {
  animation: ch3-arrive-fade 2s ease 0.4s backwards, ch3-magic-pulse 8s ease-in-out 2.4s infinite;
}
.ch3-stage.is-arriving .ch3-layer--far       { animation: ch3-arrive-rise 1.2s cubic-bezier(0.16, 0.8, 0.3, 1) 0.25s backwards; }
.ch3-stage.is-arriving .ch3-layer--mountains { animation: ch3-arrive-rise 1.2s cubic-bezier(0.16, 0.8, 0.3, 1) 0.45s backwards; }
.ch3-stage.is-arriving .ch3-layer--path      { animation: ch3-arrive-rise 1.2s cubic-bezier(0.16, 0.8, 0.3, 1) 0.65s backwards; }
.ch3-stage.is-arriving .ch3-water            { animation: ch3-arrive-fade 1.4s ease 1s backwards; }
.ch3-stage.is-arriving .ch3-hint-era         { animation: ch3-arrive-fade 0.9s ease 0.9s backwards; }
.ch3-stage.is-arriving .ch3-hint-title       { animation: ch3-arrive-title 1.3s cubic-bezier(0.16, 0.8, 0.3, 1) 1.05s backwards; }
.ch3-stage.is-arriving .ch3-hint-cta {
  animation: ch3-arrive-fade 1s ease 2.1s backwards, ch3-hint-pulse 3s ease-in-out 3.1s infinite;
}
.ch3-stage.is-arriving .ch3-mark {
  animation: ch3-arrive-mark 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.25) backwards;
  animation-delay: calc(1.5s + var(--mk-i, 0) * 0.18s);
}
.ch3-stage.is-arriving .ch3-mark--sky {
  animation: ch3-arrive-mark 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.25) backwards,
             ch3-mark-float 6s ease-in-out 2.6s infinite;
  animation-delay: calc(1.5s + var(--mk-i, 0) * 0.18s), 2.6s;
}

@keyframes ch3-arrive-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ch3-arrive-rise {
  from { opacity: 0; transform: translate3d(0, 5%, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes ch3-arrive-title {
  from { opacity: 0; letter-spacing: 0.22em; transform: translateY(14px); }
  to   { opacity: 1; letter-spacing: 0.04em; transform: translateY(0); }
}
@keyframes ch3-arrive-mark {
  0%   { opacity: 0; transform: translate(-50%, -44%) scale(0.55); }
  62%  { opacity: 1; }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — desactiva todo el movimiento. El reflejo del agua queda estático.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ch3-layer,
  .ch3-fx--magic,
  .ch3-hint-cta,
  .ch3-mark,
  .ch3-mark::before,
  .ch3-mark::after,
  .ch3-water-shimmer,
  .ch3-water-glint,
  .ch3-birds,
  .ch3-bird::before,
  .ch3-bird::after,
  .ch3-ripple,
  .ch3-panel-fade-enter-active .ch3-panel,
  .ch3-panel-fade-leave-active .ch3-panel { animation: none !important; transition: none !important; }
  .ch3-layer { transform: none !important; }
  .ch3-birds, .ch3-ripple { opacity: 0 !important; }
  .ch3-ember, .ch3-ash { animation: none !important; opacity: 0 !important; }
  .ch3-haze { animation: none !important; opacity: 0 !important; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — emblemas más juntos / panel full-width
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-content {
    padding: calc(64px + var(--sp-sm)) var(--sp-md) calc(80px + env(safe-area-inset-bottom, 0px));
  }
  .ch3-mark { width: calc(var(--mk-size, 88px) * 0.72); height: calc(var(--mk-size, 88px) * 0.72); }
  .ch3-mark-num { font-size: 0.7rem; padding: 0 6px; }
  .ch3-panel { width: 94%; max-height: 80dvh; }

  /* Sin puntero en mobile → las capas no se mueven horizontalmente (--mx = 0),
     solo hay drift vertical por scroll (--sx). El overscan lateral (width:116%)
     expandía el layout viewport y recortaba el contenido a los lados. Lo quitamos
     conservando el overscan vertical (top/bottom -8% del inset) para el drift. */
  .ch3-layer { left: 0; width: 100%; }
  .ch3-water-layer { left: 0; width: 100%; }
}
</style>
