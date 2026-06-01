<!--
  Chapter3Content.vue — "De vuelta al movimiento" · parallax fantasía + cuento interactivo.

  iter10 (Rafael 2026-05-28): el entorno (parallax) es el PROTAGONISTA. El muro de
  texto estorbaba → se reemplaza por 5 EMBLEMAS de arte clicables plantados en el
  escenario (estandarte, escudo, pergamino, grimorio, orbe) que despliegan la
  biografía poco a poco en un RECUADRO de pergamino, con avance prev/next como un
  cuento de fantasía. Sin texto visible por defecto salvo un hint sutil.

  iter9: parallax de 3 capas (cielo / montañas / camino) + drift + puntero + scroll.

  Assets activos:
    - Capas: ch3-sky.png / ch3-mountains.png / ch3-path.png
    - Emblemas clicables: ch3-prop-banner.png / ch3-prop-shield.png /
      ch3-mark-scroll.png / ch3-mark-tome.png / ch3-mark-orb.png
    - Recuadro: ch3-parchment.png (textura del panel)

  Fallback previo: Chapter3Content.web2-fallback.vue.bak + old/ (CHANGELOG §6.5).
  PRM: bajo prefers-reduced-motion se desactivan parallax + animaciones (guard JS + @media).
-->
<script setup>
import { computed, ref, inject, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Emblemas clicables — 1 por párrafo de la historia. Plantados en el escenario.
// pos en % relativo a .ch3-content. Cada uno despliega bioParagraphs[idx].
const ROMAN = ['I', 'II', 'III', 'IV', 'V']
// Arco muerte→renacer (Rafael 2026-05-28): 1 emblema por párrafo.
//   I  Flash caído ......... la muerte de Flash → salto a JS
//   II reconstrucción ...... Pink Parrot, reconstruir desde cero con reglas nuevas
//   III estandarte ......... el ágil como forma de pensar / ordenar el caos
//   IV orbe creativo ....... publicidad digital, experimentar, cosas nuevas
//   V  HTML5 naciente ...... época de crecer, salto de vuelta a la web (en el horizonte)
const markers = [
  { key: 'flash',    src: '/assets/ch3-flash-fallen.png', top: '54%', left: '16%', size: 112 },
  { key: 'rebuild',  src: '/assets/ch3-mark-rebuild.png',  top: '67%', left: '34%', size: 94 },
  { key: 'standard', src: '/assets/ch3-mark-standard.png', top: '49%', left: '51%', size: 98 },
  { key: 'orb',      src: '/assets/ch3-mark-orb.png',      top: '66%', left: '69%', size: 88 },
  { key: 'html5',    src: '/assets/ch3-html5-future.png',  top: '35%', left: '85%', size: 100 },
]

// ── Estado del cuento ─────────────────────────────────────────────────────────
const activeStory = ref(null)      // índice abierto (0..4) o null
const visited = ref(new Set())     // emblemas ya leídos
const panelRef = ref(null)
const lastFocusedKey = ref(null)

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

// ── Parallax (cielo lento + montañas + camino) ─────────────────────────────────
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

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
  <div class="ch3-stage" @scroll="onScroll">
    <!-- ── Parallax stack (pinned) ───────────────────────────────────────── -->
    <div ref="parallaxRef" class="ch3-parallax" aria-hidden="true">
      <div class="ch3-layer ch3-layer--sky"></div>
      <div class="ch3-layer ch3-layer--mountains"></div>
      <div class="ch3-fx ch3-fx--magic"></div>
      <div class="ch3-layer ch3-layer--path"></div>
      <div class="ch3-fx ch3-fx--lasers"></div>
      <span
        v-for="(sp, i) in [
          { left: '12%', delay: '0s', dur: '7s', size: '4px' },
          { left: '28%', delay: '2.4s', dur: '9s', size: '3px' },
          { left: '47%', delay: '1.1s', dur: '8s', size: '5px' },
          { left: '63%', delay: '3.6s', dur: '10s', size: '3px' },
          { left: '79%', delay: '0.8s', dur: '7.5s', size: '4px' },
          { left: '91%', delay: '2.0s', dur: '9.5s', size: '3px' },
        ]"
        :key="i"
        class="ch3-spark"
        :style="{ left: sp.left, '--sp-delay': sp.delay, '--sp-dur': sp.dur, '--sp-size': sp.size }"
      ></span>
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
        :class="{ 'is-visited': visited.has(m.key), 'is-active': activeStory === i }"
        :style="{ top: m.top, left: m.left, '--mk-size': m.size + 'px', '--mk-i': i }"
        :aria-label="`${ROMAN[i]} — ${t('ui.storyPage', { n: i + 1, total: markers.length })}`"
        @click="openStory(i)"
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
      <div v-if="isOpen" class="ch3-panel-backdrop" @click.self="closeStory">
        <div
          ref="panelRef"
          class="ch3-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="t('ui.storyPage', { n: activeStory + 1, total: markers.length })"
          tabindex="-1"
        >
          <button type="button" class="ch3-panel-close" :aria-label="t('ui.closeOverlay')" @click="closeStory">✕</button>

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
              @click="goStory(-1)"
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
              @click="goStory(1)"
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
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-stage {
  position: relative;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  background-color: #1a1320;
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

.ch3-layer--sky {
  background-image: url('/assets/ch3-sky.png');
  background-position: 50% top;
  transform: translate3d(calc(var(--mx, 0) * 8px), calc(var(--sx, 0) * -0.02px + var(--my, 0) * 6px), 0);
  animation: ch3-sky-drift 70s ease-in-out infinite alternate;
}
@keyframes ch3-sky-drift { from { background-position: 47% top; } to { background-position: 53% top; } }

.ch3-layer--mountains {
  background-image: url('/assets/ch3-mountains.png');
  background-position: center bottom;
  transform: translate3d(calc(var(--mx, 0) * 16px), calc(var(--sx, 0) * -0.05px + var(--my, 0) * 4px), 0);
}

.ch3-layer--path {
  background-image: url('/assets/ch3-path.png');
  background-position: center bottom;
  transform: translate3d(calc(var(--mx, 0) * 28px), calc(var(--sx, 0) * -0.10px + var(--my, 0) * 3px), 0);
}

/* ── FX magia / láser / brasas ─────────────────────────────────────────────── */
.ch3-fx { position: absolute; inset: 0; pointer-events: none; }

.ch3-fx--magic {
  background:
    radial-gradient(60% 38% at 50% 64%, rgba(255, 226, 170, 0.45) 0%, rgba(255, 210, 150, 0.12) 45%, transparent 72%),
    radial-gradient(40% 30% at 70% 40%, rgba(150, 220, 255, 0.30) 0%, transparent 70%);
  mix-blend-mode: screen;
  animation: ch3-magic-pulse 6s ease-in-out infinite;
}
@keyframes ch3-magic-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

.ch3-fx--lasers::before,
.ch3-fx--lasers::after {
  content: '';
  position: absolute;
  top: -20%;
  height: 140%;
  width: 3px;
  background: linear-gradient(to bottom, transparent 0%, rgba(120,245,255,0) 8%, rgba(120,245,255,0.9) 50%, rgba(180,130,255,0) 92%, transparent 100%);
  filter: drop-shadow(0 0 6px rgba(120,245,255,0.9)) drop-shadow(0 0 14px rgba(150,120,255,0.6));
  transform: rotate(18deg);
  opacity: 0;
}
.ch3-fx--lasers::before { left: 24%; animation: ch3-laser-a 9s ease-in-out infinite; }
.ch3-fx--lasers::after { left: 68%; width: 2px; transform: rotate(-14deg); animation: ch3-laser-b 11s ease-in-out infinite 2.5s; }
@keyframes ch3-laser-a {
  0%, 100% { opacity: 0; transform: translateX(-30px) rotate(18deg); }
  8% { opacity: 0.95; } 20% { opacity: 0.2; }
  28% { opacity: 0; transform: translateX(60px) rotate(18deg); }
}
@keyframes ch3-laser-b {
  0%, 100% { opacity: 0; transform: translateX(40px) rotate(-14deg); }
  10% { opacity: 0.9; } 22% { opacity: 0.25; }
  32% { opacity: 0; transform: translateX(-50px) rotate(-14deg); }
}

.ch3-spark {
  position: absolute;
  bottom: 8%;
  width: var(--sp-size, 4px);
  height: var(--sp-size, 4px);
  border-radius: 50%;
  background: rgba(255, 236, 190, 0.95);
  box-shadow: 0 0 8px 2px rgba(255,214,150,0.8), 0 0 14px 4px rgba(160,220,255,0.4);
  opacity: 0;
  animation: ch3-spark-rise var(--sp-dur, 8s) ease-in-out var(--sp-delay, 0s) infinite;
}
@keyframes ch3-spark-rise {
  0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.6); }
  12% { opacity: 0.9; }
  50% { transform: translateY(-44vh) translateX(12px) scale(1); }
  85% { opacity: 0.5; }
  100% { opacity: 0; transform: translateY(-78vh) translateX(-8px) scale(0.5); }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Contenido — encima del parallax. El escenario manda; texto mínimo.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-content {
  position: relative;
  z-index: 1;
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

/* ── Emblemas clicables ──────────────────────────────────────────────────── */
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
  animation: ch3-mark-float 5s ease-in-out infinite;
  animation-delay: calc(var(--mk-i, 0) * 0.6s);
  transition: filter 0.2s ease, transform 0.18s ease;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.55)) drop-shadow(0 0 10px rgba(255,210,140,0.55));
}
.ch3-mark-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  display: block;
}
/* Glow celestial detrás del emblema — halo blanco-dorado + cyan suave */
.ch3-mark::before {
  content: '';
  position: absolute;
  inset: -30%;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(255,255,255,0.85) 0%,
    rgba(255,224,150,0.62) 30%,
    rgba(255,150,70,0.34) 56%,
    transparent 74%);
  opacity: 0.85;
  z-index: -1;
  animation: ch3-mark-glow 2.6s ease-in-out infinite;
  animation-delay: calc(var(--mk-i, 0) * 0.6s);
}
/* Rayos celestiales rotando lentamente detrás del emblema */
.ch3-mark::after {
  content: '';
  position: absolute;
  inset: -40%;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    transparent 0deg, rgba(255,246,214,0.4) 7deg, transparent 15deg,
    transparent 36deg, rgba(255,246,214,0.34) 43deg, transparent 51deg,
    transparent 72deg, rgba(255,246,214,0.34) 79deg, transparent 87deg,
    transparent 108deg, rgba(255,246,214,0.34) 115deg, transparent 123deg,
    transparent 144deg, rgba(255,246,214,0.34) 151deg, transparent 159deg,
    transparent 180deg, rgba(255,246,214,0.34) 187deg, transparent 195deg,
    transparent 360deg);
  -webkit-mask: radial-gradient(circle, #000 28%, transparent 66%);
          mask: radial-gradient(circle, #000 28%, transparent 66%);
  opacity: 0.5;
  z-index: -2;
  animation: ch3-mark-rays 22s linear infinite;
}
@keyframes ch3-mark-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
/* Numeral romano flotante */
.ch3-mark-num {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 0.8rem;
  color: #fff;
  background: rgba(58, 47, 74, 0.85);
  border: 1px solid rgba(255, 236, 190, 0.7);
  border-radius: 999px;
  padding: 1px 8px;
  text-shadow: 0 0 6px rgba(120,245,255,0.7);
  pointer-events: none;
}
.ch3-mark:hover,
.ch3-mark:focus-visible {
  transform: translate(-50%, -50%) scale(1.12);
  filter: drop-shadow(0 0 12px rgba(174,243,255,0.95)) drop-shadow(0 6px 14px rgba(26,26,46,0.4));
  outline: none;
}
.ch3-mark.is-visited { filter: drop-shadow(0 4px 10px rgba(26,26,46,0.3)) saturate(0.85) brightness(0.96); }
.ch3-mark.is-visited::before { opacity: 0.25; }
.ch3-mark.is-active::before { opacity: 0.9; }

@keyframes ch3-mark-float { 0%, 100% { margin-top: 0; } 50% { margin-top: -12px; } }
@keyframes ch3-mark-glow { 0%, 100% { transform: scale(0.9); opacity: 0.55; } 50% { transform: scale(1.12); opacity: 1; } }

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
 * PRM — desactiva todo el movimiento.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ch3-layer,
  .ch3-fx--magic,
  .ch3-fx--lasers::before,
  .ch3-fx--lasers::after,
  .ch3-spark,
  .ch3-hint-cta,
  .ch3-mark,
  .ch3-mark::before,
  .ch3-mark::after,
  .ch3-panel-fade-enter-active .ch3-panel,
  .ch3-panel-fade-leave-active .ch3-panel { animation: none !important; transition: none !important; }
  .ch3-layer { transform: none !important; }
  .ch3-fx--lasers::before, .ch3-fx--lasers::after, .ch3-spark { opacity: 0 !important; }
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
}
</style>
