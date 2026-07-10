<!--
  Chapter2Content.vue — ch2 Flash era 2009 single-page Y2K cyber stage (Phase 04.1 iter3).

  Reescritura de iter2 (Flash transformation browser-chrome IE6) → iter3 Y2K cyber:
  - Quita .flash-browser wrapper (chrome IE6 cálido), reemplaza por stage Y2K cyber full-bleed.
  - Sidebar nav HOME · ABOUT · WORK · CONTACT con paneles intercambiables.
  - Preloader cyber al entrar al viewport (IntersectionObserver cada entrada).
  - Mobile <600px: notice modal easter-egg + stacked accesible fallback.

  Decisiones locked (PLAN.md):
  - Y2K-01: chrome IE6 eliminado.
  - Y2K-08: preloader trigger cada entrada al viewport.
  - Y2K-12: selectores legacy (.ch2-layout/.ch2-meta/.ch2-content/.ch2-bio/.ch2-projects/.ch2-flavor) preservados.

  Tests Phase 4 expectations (preserved):
  - T1 .ch2-layout + .ch2-meta + .ch2-content existen.
  - T1 .ch2-meta SIN inline avatar (StickyAvatar handles it).
  - T1 .ch2-content .ch2-bio + .ch2-content .ch2-projects.
  - T3 .ch2-bio p tiene texto.
  - T4 ch2Projects monta ProjectCards filtrando chapterEra===2.
  - T5 locale toggle reactivo en .ch2-flavor.
  - T6 <FlashBanner /> está mounted (renders in HOME panel cuando active='home').
  - T7 [data-chapter="2"] .project-card mantiene linear-gradient.

  Cinemática "La muerte de Flash" (ch2→ch3, Rafael 2026-07-10):
  - Al detectar el cruce 2→3 (primera vez de la sesión, desktop ≥600px):
    ACTO 1 — LA GUERRA (0-1500ms): imagen de guerra full-bleed, tinte rojo, despacho ALERTA.
    ACTO 2 — LA RUPTURA (1500-4000ms): shake, sidebar cae, shards vuelan, glitch.
    ACTO 3 — EL SILENCIO (4000-5500ms): fondo muerto en gris, grietas, drone ch2 sonando.
    RELEASE (5500-5900ms): overlay fade out → ch3 + crossfade audio ch3.
  - Overlay: position:fixed via Teleport to="body" (escapa filter stacking context de is-dying).
  - Audio: holdEraSwitch(6000) en watcher 'pre' bloquea initAudioWatcher 'post' crossfade.
  - Skip: click en overlay / Escape / wheel fuerte salta al estado final.
  - Segunda vez: solo drenado rápido (2.6s).
  - PRM: sin cinemática (nada de la nueva UI — fotosensibilidad).
  - Mobile <600px: cinemática no corre (stage es notice+stacked, no Flash desktop).
    Segunda visita mobile: sin efecto (el drenado es invisible ya que ch2 está off-screen).
-->
<script setup>
import { ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import FlashSidebarNav from './FlashSidebarNav.vue'
import FlashStage from './FlashStage.vue'
import FlashPreloader from './FlashPreloader.vue'
import FlashMobileNotice from './FlashMobileNotice.vue'
// Mobile stacked fallback usa los originales:
import FlashBanner from './FlashBanner.vue'
import ProjectCard from './ProjectCard.vue'
import { crystal, whoosh } from '@/audio/sfx'
import { engine } from '@/audio/engine'

const { t } = useI18n()

// Chapter activo (0-6). El FlashMobileNotice es position:fixed full-screen; como
// todos los chapters están en el DOM, sin gate cubría TODA la pantalla en mobile
// sobre cualquier chapter. Solo debe aparecer cuando ch2 está activo (Rafael 2026-06-01).
const scrollState = inject('scrollState', null)
const activeChapter = scrollState?.activeChapter ?? ref(2)
const prm = inject('prm', null)
const audio = inject('audio', null)

const reducedMotion = () => prm?.prefersReduced?.value ?? false

// ── Estado de la cinemática ─────────────────────────────────────────────────
// La cinemática corre en CADA cruce 2→3 (scroll o click en timeline) — decisión
// Rafael 2026-07-10 ("debe ser siempre"); el gating 1x/sesión fue descartado.
// El skip (click/Esc/Space/rueda) queda como válvula para quien ya la vio.
const cinematicActive = ref(false)
// 'war' | 'rupture' | 'silence' | 'releasing' | null
const cinematicPhase = ref(null)
const isShaking = ref(false)

// Pool de timers gestionado centralmente para poder cancelarlos al hacer skip
const _cinTimers = []
function _addCinTimer(fn, ms) {
  const id = setTimeout(fn, ms)
  _cinTimers.push(id)
  return id
}
function _clearAllCinTimers() {
  _cinTimers.forEach(clearTimeout)
  _cinTimers.length = 0
}

// ── Datos de la cinemática ──────────────────────────────────────────────────

// 35 motas de ceniza (≈3× las 13 del drenado normal)
const cinematicAsh = Array.from({ length: 35 }, (_, i) => ({
  left: `${((i * 2.88 + 0.5) % 100).toFixed(1)}%`,
  delay: `${((i * 0.11) % 2.1).toFixed(2)}s`,
  dur: `${(1.5 + (i % 7) * 0.25).toFixed(2)}s`,
  size: `${2 + (i % 3)}px`,
}))

// 8 shards de cristal Y2K purpúreo
const cinematicShards = [
  { left: '12%', top: '10%', w: 90, h: 56, delay: '0s',    rot: '-42deg', clip: 'polygon(0 22%, 52% 0, 100% 38%, 68% 100%, 8% 78%)' },
  { left: '34%', top: '5%',  w: 68, h: 46, delay: '0.14s', rot: '55deg',  clip: 'polygon(15% 0, 100% 16%, 72% 90%, 0 62%)' },
  { left: '60%', top: '9%',  w: 78, h: 50, delay: '0.06s', rot: '-28deg', clip: 'polygon(0 36%, 64% 0, 100% 64%, 38% 100%)' },
  { left: '80%', top: '18%', w: 60, h: 44, delay: '0.22s', rot: '48deg',  clip: 'polygon(26% 0, 100% 30%, 62% 100%, 0 70%)' },
  { left: '6%',  top: '52%', w: 54, h: 40, delay: '0.18s', rot: '-62deg', clip: 'polygon(0 46%, 56% 0, 100% 50%, 54% 100%)' },
  { left: '86%', top: '46%', w: 62, h: 48, delay: '0.30s', rot: '32deg',  clip: 'polygon(18% 0, 100% 26%, 78% 100%, 0 66%)' },
  { left: '46%', top: '35%', w: 50, h: 36, delay: '0.10s', rot: '-38deg', clip: 'polygon(10% 0, 88% 12%, 100% 80%, 22% 100%, 0 44%)' },
  { left: '26%', top: '60%', w: 58, h: 42, delay: '0.25s', rot: '44deg',  clip: 'polygon(0 30%, 72% 0, 100% 56%, 34% 100%)' },
]

// 5 grietas CSS para el acto de silencio
const cinematicCracks = [
  { left: '14%', top: '30%', w: '42%',  h: '1px', rot: 'rotate(-14deg)' },
  { left: '52%', top: '20%', w: '28%',  h: '1px', rot: 'rotate(9deg)' },
  { left: '20%', top: '68%', w: '38%',  h: '1px', rot: 'rotate(-8deg)' },
  { left: '62%', top: '58%', w: '24%',  h: '1px', rot: 'rotate(16deg)' },
  { left: '38%', top: '44%', w: '2px',  h: '28%', rot: 'rotate(5deg)' },
]

// 3 meteoros decorativos (acto 1 — igual que FlashAboutPanel)
const cinematicMeteors = [
  { left: '14%', delay: '0s',   dur: '6s' },
  { left: '48%', delay: '1.8s', dur: '8s' },
  { left: '76%', delay: '3.4s', dur: '7s' },
]

// ── Funciones de la cinemática ──────────────────────────────────────────────

function _finishCinematic() {
  cinematicActive.value = false
  cinematicPhase.value = null
  isShaking.value = false
  // Dispara el crossfade a ch3 (bypassea el hold que expiró o que puede no haber expirado)
  if (audio?.playCurrentEra && engine.isUnlocked()) {
    audio.playCurrentEra(3)
  }
}

function skipCinematic() {
  if (!cinematicActive.value) return
  _clearAllCinTimers()
  cinematicPhase.value = 'releasing'
  // Fade rápido (200ms) antes de limpiar el DOM
  _addCinTimer(_finishCinematic, 200)
}

function startFullCinematic() {
  // Bloquea el crossfade automático de initAudioWatcher (que tiene flush:'post')
  // 6000ms = duración cinemática (5900ms) + buffer pequeño
  if (audio?.holdEraSwitch) audio.holdEraSwitch(6000)

  cinematicPhase.value = 'war'
  cinematicActive.value = true
  if (engine.isUnlocked()) whoosh()

  // t=1400ms: crystal SFX (primer quiebre de cristal)
  _addCinTimer(() => {
    if (engine.isUnlocked()) crystal()
  }, 1400)

  // t=1500ms: ACTO 2 — LA RUPTURA
  _addCinTimer(() => {
    cinematicPhase.value = 'rupture'
    isShaking.value = true
    // Shake dura 700ms
    _addCinTimer(() => { isShaking.value = false }, 700)
  }, 1500)

  // t=4000ms: ACTO 3 — EL SILENCIO
  _addCinTimer(() => {
    cinematicPhase.value = 'silence'
  }, 4000)

  // t=5500ms: inicia el release (fade out del overlay)
  _addCinTimer(() => {
    cinematicPhase.value = 'releasing'
    // 400ms de fade CSS antes de limpiar el DOM
    _addCinTimer(_finishCinematic, 400)
  }, 5500)
}

// ── Skip listeners: Escape / Space / flechas / wheel fuerte ────────────────
function _onCinKey(e) {
  if (!cinematicActive.value) return
  const SKIP_KEYS = ['Escape', ' ', 'Enter', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']
  if (SKIP_KEYS.includes(e.key)) {
    e.preventDefault()
    skipCinematic()
  }
}
function _onCinWheel(e) {
  if (!cinematicActive.value) return
  if (Math.abs(e.deltaY) > 180) skipCinematic()
}

// ── La muerte de la era (cruce ch2→ch3) ─────────────────────────────────────
// PRM: sin ningún efecto.
// Desktop ≥600px: cinemática completa en CADA cruce (scroll o click — Rafael 2026-07-10).
// Mobile: solo drenado rápido — en la práctica es invisible (ch2 está off-screen
//   cuando se activa ch3), pero se conserva para no romper la lógica de dying.
const dying = ref(false)
let dyingTimer = null

if (scrollState?.activeChapter) {
  watch(scrollState.activeChapter, (n, o) => {
    if (o === 2 && n === 3 && !reducedMotion()) {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 600
      if (isDesktop && !cinematicActive.value) {
        startFullCinematic()
      } else if (!isDesktop) {
        // Mobile: drenado rápido
        dying.value = true
        clearTimeout(dyingTimer)
        dyingTimer = setTimeout(() => { dying.value = false }, 2600)
      }
    }
  })
}

const chapter = chapters[2]
const ch2Projects = computed(() => projects.filter((p) => p.chapterEra === 2))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
// Binding dinámico (evita que transformAssetUrls resuelva el path /assets/ en compile-time).
const warSrc = '/assets/ch2-flash-war.webp'

// Sidebar nav state — panel activo. Default 'home' para que FlashBanner monte en mount inicial (test T6).
const activePanel = ref('home')

// Preloader state — trigger cada entrada al viewport via IntersectionObserver.
const preloaderVisible = ref(true)  // arranca true en mount (primera entrada)
const stageRef = ref(null)
let observer = null

function onReady() {
  preloaderVisible.value = false
}

onMounted(() => {
  window.addEventListener('keydown', _onCinKey)
  window.addEventListener('wheel', _onCinWheel, { passive: true })

  if (typeof IntersectionObserver === 'undefined') return
  if (!stageRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Re-trigger cada entrada (Y2K-08): reset → visible → preloader corre 1.2s.
          preloaderVisible.value = true
        }
      }
    },
    { threshold: 0.35 }
  )
  observer.observe(stageRef.value)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', _onCinKey)
  window.removeEventListener('wheel', _onCinWheel)
  _clearAllCinTimers()
  cinematicActive.value = false
  if (observer) {
    observer.disconnect()
    observer = null
  }
  clearTimeout(dyingTimer)
})
</script>

<template>
  <!-- Desktop ≥600px: Y2K cyber stage full-bleed con sidebar + panels.
       Mobile <600px: notice modal + stacked accesible (CSS-gated via media query).
       .ch2-layout es el selector legacy preservado para tests T1. -->
  <div ref="stageRef" class="ch2-layout flash-y2k-root" :class="{ 'is-dying': dying }">
    <!-- Ceniza del drenado — la era deshaciéndose al cruzar a ch3 (segunda vez / mobile) -->
    <div v-if="dying" class="ch2-death-ash" aria-hidden="true">
      <span
        v-for="(ash, i) in 13"
        :key="`death-ash-${i}`"
        class="ch2-death-ash-mote"
        :style="{
          left: [4,11,19,27,34,43,51,58,66,73,81,88,95][i] + '%',
          '--da-delay': ['0s','0.3s','0.1s','0.45s','0.2s','0s','0.35s','0.15s','0.5s','0.05s','0.4s','0.25s','0.1s'][i],
          '--da-dur': ['2.2s','1.9s','2.4s','2.0s','2.3s','1.8s','2.1s','2.5s','1.9s','2.2s','2.0s','2.3s','2.1s'][i],
          '--da-size': ['3px','2px','3px','2px','4px','2px','3px','2px','3px','2px','4px','2px','3px'][i],
        }"
      ></span>
    </div>
    <!-- ─────────────────────────────────────────────────────────
         Desktop layout — sidebar + stage Y2K cyber
         ───────────────────────────────────────────────────────── -->
    <div class="flash-y2k-desktop">
      <!-- BG layers: scanlines + hex grid + blobs flotantes (puro CSS) -->
      <div class="flash-y2k-bg" aria-hidden="true">
        <span class="flash-y2k-blob flash-y2k-blob-1"></span>
        <span class="flash-y2k-blob flash-y2k-blob-2"></span>
        <span class="flash-y2k-blob flash-y2k-blob-3"></span>
      </div>

      <!-- Meta col — year + era (legacy .ch2-meta selector preservado para tests T1) -->
      <aside class="ch2-meta flash-y2k-meta">
        <span class="flash-y2k-meta-tag" aria-hidden="true">CH.02</span>
        <p class="ch2-year flash-y2k-year">{{ chapter.year }}</p>
        <p class="ch2-era flash-y2k-era">{{ t(chapter.eraKey) }}</p>
      </aside>

      <!-- Sidebar nav -->
      <FlashSidebarNav v-model:active="activePanel" />

      <!-- Stage con panel activo -->
      <FlashStage :panel="activePanel" />

      <!-- Statusbar bottom — info línea VT323 -->
      <div class="flash-y2k-status" aria-hidden="true">
        <span class="flash-y2k-status-dot"></span>
        <span>{{ chapter.year }} · {{ t(chapter.eraKey) }} · Macromedia Flash Player 9</span>
        <span class="flash-y2k-status-right">stage.{{ activePanel }} · OK</span>
      </div>

      <!-- Preloader overlay encima del stage cada entrada -->
      <FlashPreloader :visible="preloaderVisible" @ready="onReady" />
    </div>

    <!-- ─────────────────────────────────────────────────────────
         Mobile fallback <600px — stacked, sin frame
         "Explicar sin explicar" easter-egg via FlashMobileNotice
         ───────────────────────────────────────────────────────── -->
    <div class="flash-y2k-mobile">
      <!-- Solo cuando ch2 está activo: el modal es fixed full-screen y si no, tapa
           otros chapters en mobile (bug detectado en Fase C mobile review). -->
      <FlashMobileNotice v-if="activeChapter === 2" />

      <!-- Reusa los mismos componentes para que el contenido sea idéntico al desktop -->
      <FlashBanner />

      <div class="ch2-content flash-y2k-mobile-stack">
        <div class="ch2-bio flash-y2k-mobile-bio">
          <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
        </div>

        <figure class="flash-about-war">
          <img :src="warSrc" :alt="t('ui.flashWar')" class="flash-about-war-img" />
          <figcaption class="flash-about-war-cap">{{ t('ui.flashWar') }}</figcaption>
        </figure>

        <p class="ch2-flavor flash-y2k-mobile-flavor">{{ t('chapters.2.flavor') }}</p>

        <div v-if="ch2Projects.length > 0" class="ch2-projects flash-y2k-mobile-projects">
          <ProjectCard
            v-for="project in ch2Projects"
            :key="project.id"
            :project="project"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════════════════
       CINEMÁTICA: "La muerte de Flash"
       Overlay fijo teleportado al body para escapar el filter stacking context
       de .flash-y2k-root.is-dying (filter crea stacking context → position:fixed
       dentro de él queda atrapado). Teleport lo libera.
       aria-hidden: decorativo puro. No roba foco. No bloquea lectores de pantalla.
       PRM: el watcher nunca dispara startFullCinematic() bajo prefers-reduced-motion.
       ═══════════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <div
      v-if="cinematicActive"
      class="ch2-cin-root"
      :class="`ch2-cin--${cinematicPhase || 'war'}`"
      aria-hidden="true"
      @click="skipCinematic"
    >
      <!-- ── FONDO: imagen de guerra Y2K (acts 1 + 2; se atenúa en acto 3) ── -->
      <div class="ch2-cin-war-bg" aria-hidden="true"></div>

      <!-- ── ACTO 1: Tinte rojo de alerta ──────────────────────────────────── -->
      <div class="ch2-cin-red-tint" aria-hidden="true"></div>

      <!-- ── ACTO 1: Texto despacho de guerra ──────────────────────────────── -->
      <div class="ch2-cin-war-text" aria-hidden="true">
        <span class="ch2-cin-war-label">&gt;&gt; ALERTA // FLASH VS APPLE 2010 // SE&Ntilde;AL:OK</span>
        <span class="ch2-cin-war-sub">{{ t('ui.flashWar') }}</span>
      </div>

      <!-- ── ACTO 1: Meteoros decorativos ──────────────────────────────────── -->
      <div class="ch2-cin-meteors" aria-hidden="true">
        <span
          v-for="(m, i) in cinematicMeteors"
          :key="`cm-${i}`"
          class="ch2-cin-meteor"
          :style="{ left: m.left, '--cm-delay': m.delay, '--cm-dur': m.dur }"
        ></span>
      </div>

      <!-- ── ACTO 1→2: Flash blanco de explosión ───────────────────────────── -->
      <div class="ch2-cin-white-flash" aria-hidden="true"></div>

      <!-- ── SHAKE CONTAINER: todos los elementos que tiemblan ─────────────── -->
      <div class="ch2-cin-shaker" :class="{ 'ch2-cin--shaking': isShaking }" aria-hidden="true">
        <!-- Franja sidebar Y2K que cae -->
        <div class="ch2-cin-sidebar-strip"></div>

        <!-- Blobs Y2K que explotan -->
        <div class="ch2-cin-blob ch2-cin-blob-1"></div>
        <div class="ch2-cin-blob ch2-cin-blob-2"></div>
        <div class="ch2-cin-blob ch2-cin-blob-3"></div>

        <!-- Shards de cristal Y2K púrpura -->
        <span
          v-for="(s, i) in cinematicShards"
          :key="`cshard-${i}`"
          class="ch2-cin-shard"
          :style="{
            left: s.left,
            top: s.top,
            width: s.w + 'px',
            height: s.h + 'px',
            clipPath: s.clip,
            '--cs-delay': s.delay,
            '--cs-rot': s.rot,
          }"
        ></span>

        <!-- Scanlines que glitchean -->
        <div class="ch2-cin-scanlines"></div>
      </div>

      <!-- ── Ceniza intensificada (acts 2-3) ───────────────────────────────── -->
      <div class="ch2-cin-ash" aria-hidden="true">
        <span
          v-for="(ash, i) in cinematicAsh"
          :key="`cash-${i}`"
          class="ch2-cin-ash-mote"
          :style="{
            left: ash.left,
            '--ca-delay': ash.delay,
            '--ca-dur': ash.dur,
            '--ca-size': ash.size,
          }"
        ></span>
      </div>

      <!-- ── ACTO 3: Velo oscuro del silencio (sube en acto 3) ─────────────── -->
      <div class="ch2-cin-silence-bg" aria-hidden="true"></div>

      <!-- ── ACTO 3: Grietas CSS ───────────────────────────────────────────── -->
      <div class="ch2-cin-cracks" aria-hidden="true">
        <div
          v-for="(c, i) in cinematicCracks"
          :key="`crack-${i}`"
          class="ch2-cin-crack"
          :style="{ left: c.left, top: c.top, width: c.w, height: c.h, transform: c.rot }"
        ></div>
      </div>

      <!-- ── HINT de skip (decorativo, no interactivo) ─────────────────────── -->
      <div class="ch2-cin-skip-hint" aria-hidden="true">click / esc to skip</div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Layout switching desktop/mobile vía media query.
   Estilos visuales completos viven en chapter-themes.css bajo [data-chapter="2"]
   (era-specific styling convention — Phase 3+). */

.flash-y2k-root {
  /* chapter-section es display:flex + center → claim full main axis aquí */
  flex: 1 1 100%;
  min-width: 0;
  align-self: stretch;
  height: 100%;
  width: 100%;
  position: relative;
  transition: filter 1.4s ease;
}

/* La muerte de la era: el mundo Y2K pierde el color al cruzar a ch3 */
.flash-y2k-root.is-dying {
  filter: grayscale(1) brightness(0.8);
}

.ch2-death-ash {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  overflow: hidden;
}
.ch2-death-ash-mote {
  position: absolute;
  top: -3%;
  width: var(--da-size, 2px);
  height: var(--da-size, 2px);
  border-radius: 1px;
  background: #8a8a92;
  opacity: 0;
  animation: ch2-death-ash-fall var(--da-dur, 2s) ease-in var(--da-delay, 0s) forwards;
}
@keyframes ch2-death-ash-fall {
  0%   { opacity: 0;   transform: translateY(0)      translateX(0)    rotate(0); }
  12%  { opacity: 0.8; }
  60%  { opacity: 0.5; transform: translateY(60vh)   translateX(10px) rotate(90deg); }
  100% { opacity: 0;   transform: translateY(108vh)  translateX(-6px) rotate(170deg); }
}

@media (prefers-reduced-motion: reduce) {
  .flash-y2k-root { transition: none; }
  .flash-y2k-root.is-dying { filter: none; }
  .ch2-death-ash-mote { animation: none; opacity: 0; }
}

.flash-y2k-desktop {
  height: 100%;
  width: 100%;
  position: relative;
}

.flash-y2k-mobile {
  display: none;
}

@media (max-width: 599px) {
  .flash-y2k-desktop {
    display: none;
  }
  .flash-y2k-mobile {
    display: block;
    padding: 56px var(--sp-md) calc(env(safe-area-inset-bottom, 0px) + 96px);
    min-height: 100dvh;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CINEMÁTICA — "La muerte de Flash"
   Todos los selectores ch2-cin-* scoped al data-v-xxxx que Vue añade al
   Teleport (Vue 3 sí propaga el scope attribute al contenido teleportado).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Root del overlay ────────────────────────────────────────────────────── */
.ch2-cin-root {
  position: fixed;
  inset: 0;
  z-index: 60;
  overflow: hidden;
  /* Fondo base: negro purpúreo del universo Y2K */
  background: #06020f;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.4s ease;
}
.ch2-cin--releasing {
  opacity: 0 !important;
  transition: opacity 0.4s ease !important;
}

/* ── War background (imagen de guerra full-bleed) ───────────────────────── */
.ch2-cin-war-bg {
  position: absolute;
  inset: 0;
  background-image: url('/assets/ch2-flash-war.webp');
  background-size: cover;
  background-position: center 30%;
  opacity: 0.82;
  transition: opacity 1.6s ease;
}
.ch2-cin--silence .ch2-cin-war-bg,
.ch2-cin--releasing .ch2-cin-war-bg {
  opacity: 0.15;
}

/* ── Tinte rojo de alerta (acto 1) ─────────────────────────────────────── */
.ch2-cin-red-tint {
  position: absolute;
  inset: 0;
  background: rgba(200, 20, 20, 0);
  pointer-events: none;
  transition: opacity 0.5s ease;
}
.ch2-cin--war .ch2-cin-red-tint {
  animation: ch2-cin-red-rise 1.5s ease-out forwards;
}
.ch2-cin--rupture .ch2-cin-red-tint,
.ch2-cin--silence .ch2-cin-red-tint,
.ch2-cin--releasing .ch2-cin-red-tint {
  opacity: 0;
}
@keyframes ch2-cin-red-rise {
  0%   { background: rgba(200, 20, 20, 0); }
  35%  { background: rgba(200, 20, 20, 0.32); }
  70%  { background: rgba(200, 20, 20, 0.22); }
  100% { background: rgba(200, 20, 20, 0.14); }
}

/* ── Texto despacho de guerra (acto 1) ─────────────────────────────────── */
.ch2-cin-war-text {
  position: absolute;
  left: 104px;
  bottom: 14%;
  z-index: 5;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.4s ease;
}
.ch2-cin--rupture .ch2-cin-war-text,
.ch2-cin--silence .ch2-cin-war-text,
.ch2-cin--releasing .ch2-cin-war-text {
  opacity: 0;
}
.ch2-cin-war-label {
  display: block;
  font-family: 'VT323', 'Courier New', monospace;
  font-size: clamp(1.0rem, 2.4vw, 1.7rem);
  color: #ff4040;
  text-shadow: 0 0 8px rgba(255, 50, 50, 0.75), 0 0 22px rgba(255, 0, 0, 0.4);
  letter-spacing: 0.06em;
  animation: ch2-cin-war-pulse 0.75s ease-in-out infinite alternate;
}
@keyframes ch2-cin-war-pulse {
  from { opacity: 0.82; text-shadow: 0 0 6px rgba(255, 50, 50, 0.55); }
  to   { opacity: 1;    text-shadow: 0 0 18px rgba(255, 50, 50, 0.95), 0 0 36px rgba(255, 0, 0, 0.55); }
}
.ch2-cin-war-sub {
  display: block;
  font-family: 'VT323', 'Courier New', monospace;
  font-size: clamp(0.82rem, 1.7vw, 1.1rem);
  color: rgba(255, 170, 170, 0.75);
  letter-spacing: 0.12em;
  margin-top: 5px;
}

/* ── Meteoros (acto 1, decorativo) ─────────────────────────────────────── */
.ch2-cin-meteors {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.ch2-cin-meteor {
  position: absolute;
  top: -5%;
  width: 2px;
  height: 52px;
  background: linear-gradient(180deg, rgba(255, 145, 90, 0.9), transparent);
  opacity: 0;
  animation: ch2-cin-meteor-fall var(--cm-dur, 7s) ease-in var(--cm-delay, 0s) 2;
}
@keyframes ch2-cin-meteor-fall {
  0%   { opacity: 0; transform: translateY(0) rotate(18deg); }
  7%   { opacity: 0.88; }
  72%  { opacity: 0.55; }
  100% { opacity: 0; transform: translateY(110vh) rotate(18deg); }
}

/* ── Flash blanco de explosión (acto 1→2) ───────────────────────────────── */
.ch2-cin-white-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
}
.ch2-cin--rupture .ch2-cin-white-flash {
  animation: ch2-cin-explode 250ms ease-out forwards;
}
@keyframes ch2-cin-explode {
  0%   { opacity: 0; }
  22%  { opacity: 0.96; }
  100% { opacity: 0; }
}

/* ── Shake container ────────────────────────────────────────────────────── */
.ch2-cin-shaker {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ch2-cin--shaking {
  animation: ch2-cin-shake 700ms cubic-bezier(0.2, 0, 0.8, 1) forwards;
}
@keyframes ch2-cin-shake {
  0%   { transform: translate(0, 0); }
  8%   { transform: translate(-13px, -5px); }
  16%  { transform: translate(11px, 6px); }
  24%  { transform: translate(-9px, -5px); }
  32%  { transform: translate(10px, 6px); }
  40%  { transform: translate(-8px, -4px); }
  48%  { transform: translate(7px, 5px); }
  56%  { transform: translate(-6px, -3px); }
  64%  { transform: translate(5px, 4px); }
  72%  { transform: translate(-3px, -2px); }
  80%  { transform: translate(2px, 2px); }
  88%  { transform: translate(-1px, -1px); }
  96%  { transform: translate(1px, 1px); }
  100% { transform: translate(0, 0); }
}

/* ── Franja sidebar Y2K ─────────────────────────────────────────────────── */
.ch2-cin-sidebar-strip {
  position: absolute;
  left: 0;
  top: 0;
  width: 88px;
  height: 100%;
  background: linear-gradient(90deg, #14082a 0%, #0e0520 75%, rgba(14, 5, 32, 0.6) 90%, transparent 100%);
  border-right: 2px solid rgba(108, 63, 200, 0.85);
  z-index: 2;
  transform-origin: bottom left;
}
/* En acto 1 y 3: sidebar visible pero inactiva (visible solo en act 1 y act 2 start) */
.ch2-cin--silence .ch2-cin-sidebar-strip,
.ch2-cin--releasing .ch2-cin-sidebar-strip {
  opacity: 0;
}
/* En acto 2: cae */
.ch2-cin--rupture .ch2-cin-sidebar-strip {
  animation: ch2-cin-sidebar-fall 1.4s cubic-bezier(0.48, 0.05, 0.88, 0.44) 180ms forwards;
}
@keyframes ch2-cin-sidebar-fall {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
  7%   { transform: translateY(0) rotate(-1.6deg); }
  100% { opacity: 0.25; transform: translateY(112vh) rotate(-7.5deg); }
}

/* ── Blobs Y2K (flotantes en acto 1, explotan en acto 2) ───────────────── */
.ch2-cin-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(44px);
  pointer-events: none;
}
.ch2-cin-blob-1 {
  width: 380px;
  height: 300px;
  top: 6%;
  left: -8%;
  background: radial-gradient(ellipse, rgba(108, 63, 200, 0.52) 0%, transparent 70%);
  animation: ch2-cin-blob-float-1 8s ease-in-out infinite;
}
.ch2-cin-blob-2 {
  width: 320px;
  height: 320px;
  top: 36%;
  right: -10%;
  background: radial-gradient(ellipse, rgba(72, 35, 155, 0.46) 0%, transparent 65%);
  animation: ch2-cin-blob-float-2 10s ease-in-out infinite;
}
.ch2-cin-blob-3 {
  width: 240px;
  height: 300px;
  bottom: 8%;
  left: 27%;
  background: radial-gradient(ellipse, rgba(90, 45, 175, 0.42) 0%, transparent 68%);
  animation: ch2-cin-blob-float-3 7s ease-in-out infinite;
}
@keyframes ch2-cin-blob-float-1 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(10px,15px);} }
@keyframes ch2-cin-blob-float-2 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-12px,8px);} }
@keyframes ch2-cin-blob-float-3 { 0%,100%{transform:translate(0,0);} 50%{transform:translate(8px,-10px);} }

/* Explosión en acto 2: expand → implode */
.ch2-cin--rupture .ch2-cin-blob-1 { animation: ch2-cin-blob-burst 650ms ease-out 280ms forwards; }
.ch2-cin--rupture .ch2-cin-blob-2 { animation: ch2-cin-blob-burst 650ms ease-out 480ms forwards; }
.ch2-cin--rupture .ch2-cin-blob-3 { animation: ch2-cin-blob-burst 650ms ease-out 90ms  forwards; }
@keyframes ch2-cin-blob-burst {
  0%   { opacity: 1; transform: scale(1); }
  32%  { opacity: 0.6; transform: scale(2.9); }
  100% { opacity: 0; transform: scale(0.08); }
}
.ch2-cin--silence .ch2-cin-blob,
.ch2-cin--releasing .ch2-cin-blob { opacity: 0; }

/* ── Shards de cristal Y2K (acto 2) ────────────────────────────────────── */
.ch2-cin-shard {
  position: absolute;
  background: linear-gradient(148deg,
    rgba(130, 70, 220, 0.50) 0%,
    rgba(50, 18, 110, 0.28) 60%,
    rgba(190, 110, 255, 0.18) 100%
  );
  border: 1px solid rgba(160, 90, 255, 0.60);
  box-sizing: border-box;
  opacity: 0;
}
.ch2-cin--rupture .ch2-cin-shard {
  animation: ch2-cin-shard-fall 920ms cubic-bezier(0.40, 0, 0.90, 0.50) var(--cs-delay, 0s) forwards;
}
.ch2-cin--silence .ch2-cin-shard,
.ch2-cin--releasing .ch2-cin-shard { opacity: 0; }
@keyframes ch2-cin-shard-fall {
  0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { opacity: 0; transform: translateY(120vh) rotate(var(--cs-rot, 40deg)); }
}

/* ── Scanlines — glitch violento en acto 2 ──────────────────────────────── */
.ch2-cin-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 1px,
    rgba(8, 2, 20, 0.30) 1px, rgba(8, 2, 20, 0.30) 2px
  );
  pointer-events: none;
  opacity: 0.38;
}
.ch2-cin--rupture .ch2-cin-scanlines {
  animation: ch2-cin-scanlines-glitch 155ms steps(3, end) 6 1500ms;
}
@keyframes ch2-cin-scanlines-glitch {
  0%   { opacity: 0.38; transform: translateY(0);    filter: none; }
  33%  { opacity: 1.00; transform: translateY(3px);  filter: hue-rotate(80deg); }
  66%  { opacity: 0.08; transform: translateY(-5px); filter: hue-rotate(-55deg); }
  100% { opacity: 0.55; transform: translateY(2px);  filter: none; }
}

/* ── Ceniza intensificada (actos 2-3) ───────────────────────────────────── */
.ch2-cin-ash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  /* Ceniza visible solo desde acto 2 */
  opacity: 0;
  transition: opacity 0.6s ease;
}
.ch2-cin--rupture .ch2-cin-ash,
.ch2-cin--silence .ch2-cin-ash,
.ch2-cin--releasing .ch2-cin-ash { opacity: 1; }
.ch2-cin-ash-mote {
  position: absolute;
  top: -3%;
  width: var(--ca-size, 2px);
  height: var(--ca-size, 2px);
  border-radius: 1px;
  background: #7e7e8a;
  opacity: 0;
  animation: ch2-cin-ash-fall var(--ca-dur, 2s) ease-in var(--ca-delay, 0s) infinite;
}
@keyframes ch2-cin-ash-fall {
  0%   { opacity: 0;    transform: translateY(0)      translateX(0)     rotate(0deg); }
  11%  { opacity: 0.72; }
  58%  { opacity: 0.42; transform: translateY(60vh)   translateX(9px)   rotate(78deg); }
  100% { opacity: 0;    transform: translateY(110vh)  translateX(-5px)  rotate(160deg); }
}

/* ── Velo oscuro del silencio (acto 3) ──────────────────────────────────── */
.ch2-cin-silence-bg {
  position: absolute;
  inset: 0;
  background: rgba(4, 1, 12, 0.92);
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.4s ease;
}
.ch2-cin--silence .ch2-cin-silence-bg,
.ch2-cin--releasing .ch2-cin-silence-bg {
  opacity: 1;
}

/* ── Grietas CSS (acto 3) ───────────────────────────────────────────────── */
.ch2-cin-cracks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.9s ease 0.4s;
}
.ch2-cin--silence .ch2-cin-cracks,
.ch2-cin--releasing .ch2-cin-cracks {
  opacity: 1;
}
.ch2-cin-crack {
  position: absolute;
  background: rgba(210, 190, 240, 0.50);
  box-shadow: 0 0 3px rgba(210, 190, 255, 0.35);
}

/* ── Skip hint ──────────────────────────────────────────────────────────── */
.ch2-cin-skip-hint {
  position: absolute;
  bottom: 20px;
  right: 24px;
  font-family: 'VT323', 'Courier New', monospace;
  font-size: 0.9rem;
  color: rgba(180, 150, 220, 0.45);
  letter-spacing: 0.10em;
  pointer-events: none;
  z-index: 10;
  text-transform: uppercase;
}

/* ── PRM: override de seguridad — el watcher ya impide que la cinemática
       dispare, pero si algo la montara bajo PRM que no anime nada. ──────── */
@media (prefers-reduced-motion: reduce) {
  .ch2-cin-root { display: none !important; }
}
</style>
