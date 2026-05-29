<!--
  Chapter3Content.vue — "De vuelta al movimiento" · parallax fantasía épica.

  iter9 (Rafael 2026-05-28): el bg robots Tin Toy full-bleed `fixed` (iter8) era
  estático — "ch03 habla del movimiento pero es muy estático". Reemplazado por un
  PARALLAX REAL de 3 capas (cielo / montañas / camino de piedras) que reacciona a:
    - scroll interno de .ch3-stage  (capas lejanas se mueven poco, cercanas más)
    - puntero (pointermove → translate sutil por profundidad)
    - drift lento del cielo (CSS background-position, "casi no se mueve")
  Estilo: fantasía épica de guerra medieval + magia, acuarela vintage, colores claros.
  FX rayos láser + brasas mágicas via CSS (sin sprites extra).

  Decor Web 2.0 reemplazado por props fantasía (Rafael 2026-05-28):
    - robot mascota (bio aside) → ch3-prop-shield.png (escudo heráldico)
    - starbursts BETA/NEW       → ch3-prop-banner.png (estandarte flotante)

  Assets activos:
    - ch3-sky.png / ch3-mountains.png / ch3-path.png  (capas parallax)
    - ch3-prop-shield.png / ch3-prop-banner.png       (decor)

  Fallback del estado anterior: Chapter3Content.web2-fallback.vue.bak (Web 2.0 robots)
  + asset iter8 en public/assets/old/ch3-robots-bg-2026-05-28-iter8.png (CHANGELOG §6.5).

  Accesibilidad/PRM: bajo prefers-reduced-motion se desactivan listeners de
  parallax y todas las animaciones (drift, láseres, brasas) via @media + guard JS.
-->
<script setup>
import { computed, ref, inject, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

// Decor fantasía — paths como data (binding dinámico :src para no pasar por
// transformAssetUrls del compilador Vue, que rompe con paths absolutos en test).
const shieldSrc = '/assets/ch3-prop-shield.png'
const bannerSrc = '/assets/ch3-prop-banner.png'

// Brasas mágicas flotantes — posiciones/timing deterministas (sin Math.random,
// para que el render sea estable y testeable). 6 chispas escalonadas.
const sparks = [
  { left: '12%', delay: '0s', dur: '7s', size: '4px' },
  { left: '28%', delay: '2.4s', dur: '9s', size: '3px' },
  { left: '47%', delay: '1.1s', dur: '8s', size: '5px' },
  { left: '63%', delay: '3.6s', dur: '10s', size: '3px' },
  { left: '79%', delay: '0.8s', dur: '7.5s', size: '4px' },
  { left: '91%', delay: '2.0s', dur: '9.5s', size: '3px' },
]

// ── Parallax ────────────────────────────────────────────────────────────────
// Inject del PRM global (App.vue). Default null para que tests sin provide no crasheen.
const prm = inject('prm', null)
const reduced = () => prm?.prefersReduced?.value ?? false

const parallaxRef = ref(null) // .ch3-parallax — recibe las CSS vars --sx/--mx/--my
let raf = 0
let sx = 0   // scrollTop en px del stage
let mx = 0   // puntero X normalizado -0.5..0.5
let my = 0   // puntero Y normalizado -0.5..0.5

function flush() {
  raf = 0
  const el = parallaxRef.value
  if (!el) return
  el.style.setProperty('--sx', String(sx))
  el.style.setProperty('--mx', mx.toFixed(3))
  el.style.setProperty('--my', my.toFixed(3))
}

function schedule() {
  if (raf) return
  raf = requestAnimationFrame(flush)
}

function onScroll(e) {
  if (reduced()) return
  sx = e.target.scrollTop
  schedule()
}

function onPointer(e) {
  if (reduced()) return
  mx = e.clientX / window.innerWidth - 0.5
  my = e.clientY / window.innerHeight - 0.5
  schedule()
}

onMounted(() => {
  // pointermove a nivel window (cubre todo el viewport mientras ch3 está activo)
  window.addEventListener('pointermove', onPointer, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="ch3-stage" @scroll="onScroll">
    <!-- ── Parallax stack (sticky, pinned al viewport del stage) ──────────── -->
    <div ref="parallaxRef" class="ch3-parallax" aria-hidden="true">
      <div class="ch3-layer ch3-layer--sky"></div>
      <div class="ch3-layer ch3-layer--mountains"></div>
      <div class="ch3-fx ch3-fx--magic"></div>
      <div class="ch3-layer ch3-layer--path"></div>
      <!-- Rayos láser fantasía-tech (CSS) -->
      <div class="ch3-fx ch3-fx--lasers"></div>
      <!-- Brasas mágicas flotantes (CSS) -->
      <span
        v-for="(sp, i) in sparks"
        :key="i"
        class="ch3-spark"
        :style="{ left: sp.left, '--sp-delay': sp.delay, '--sp-dur': sp.dur, '--sp-size': sp.size }"
      ></span>
    </div>

    <!-- ── Contenido (sobre el parallax) ─────────────────────────────────── -->
    <div class="ch3-content">
      <!-- Estandarte flotante (reemplaza starbursts Web 2.0) -->
      <div class="ch3-decor ch3-decor--banner" aria-hidden="true">
        <img :src="bannerSrc" alt="" />
      </div>

      <header class="ch3-hero">
        <h1 class="ch3-hero-title">Rafael</h1>
      </header>

      <h2 class="ch3-marquee" aria-hidden="true">De vuelta al movimiento</h2>

      <!-- Bio card — aside ahora con escudo heráldico (reemplaza robot mascota) -->
      <article class="ch3-bio-card">
        <div class="ch3-bio-text">
          <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
        </div>
        <aside class="ch3-bio-aside" aria-hidden="true">
          <img :src="shieldSrc" alt="" class="ch3-bio-shield" />
        </aside>
      </article>

      <div v-if="ch3Projects.length > 0" class="ch3-projects">
        <ProjectCard
          v-for="project in ch3Projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch3-stage — contenedor scrolleable. El bg lo pintan las capas parallax.
 * Color de respaldo claro por si las imágenes no cargan.
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
  background-color: #e9f1fb;
  image-rendering: pixelated;
}

/* ─────────────────────────────────────────────────────────────────────────
 * .ch3-parallax — pinned al top del viewport del stage via position:sticky.
 * margin-bottom negativo = no empuja el contenido (se solapa detrás).
 * ───────────────────────────────────────────────────────────────────────── */
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

/* Capas — sobredimensionadas 8% para que el translate no revele bordes. */
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

/* Cielo — el más lejano: drift lentísimo (background-position) + parallax mínimo.
 * "Un cielo que casi no se mueve". */
.ch3-layer--sky {
  background-image: url('/assets/ch3-sky.png');
  background-position: 50% top;
  transform: translate3d(
    calc(var(--mx, 0) * 8px),
    calc(var(--sx, 0) * -0.02px + var(--my, 0) * 6px),
    0
  );
  animation: ch3-sky-drift 70s ease-in-out infinite alternate;
}

@keyframes ch3-sky-drift {
  from { background-position: 47% top; }
  to   { background-position: 53% top; }
}

/* Montañas — capa media: parallax moderado. Transparente arriba (sky se ve). */
.ch3-layer--mountains {
  background-image: url('/assets/ch3-mountains.png');
  background-position: center bottom;
  transform: translate3d(
    calc(var(--mx, 0) * 16px),
    calc(var(--sx, 0) * -0.05px + var(--my, 0) * 4px),
    0
  );
}

/* Camino — primer plano: parallax fuerte (se mueve más). Transparente arriba. */
.ch3-layer--path {
  background-image: url('/assets/ch3-path.png');
  background-position: center bottom;
  transform: translate3d(
    calc(var(--mx, 0) * 28px),
    calc(var(--sx, 0) * -0.10px + var(--my, 0) * 3px),
    0
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * FX — glow mágico cerca del horizonte + rayos láser + brasas. Solo CSS.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Glow mágico cálido pulsando sobre el horizonte/montañas */
.ch3-fx--magic {
  background:
    radial-gradient(60% 38% at 50% 64%, rgba(255, 226, 170, 0.45) 0%, rgba(255, 210, 150, 0.12) 45%, transparent 72%),
    radial-gradient(40% 30% at 70% 40%, rgba(150, 220, 255, 0.30) 0%, transparent 70%);
  mix-blend-mode: screen;
  animation: ch3-magic-pulse 6s ease-in-out infinite;
}

@keyframes ch3-magic-pulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}

/* Rayos láser fantasía-tech — dos haces diagonales que barren + parpadean */
.ch3-fx--lasers::before,
.ch3-fx--lasers::after {
  content: '';
  position: absolute;
  top: -20%;
  height: 140%;
  width: 3px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(120, 245, 255, 0) 8%,
    rgba(120, 245, 255, 0.9) 50%,
    rgba(180, 130, 255, 0) 92%,
    transparent 100%
  );
  filter: drop-shadow(0 0 6px rgba(120, 245, 255, 0.9)) drop-shadow(0 0 14px rgba(150, 120, 255, 0.6));
  transform: rotate(18deg);
  opacity: 0;
}

.ch3-fx--lasers::before {
  left: 24%;
  animation: ch3-laser-sweep-a 9s ease-in-out infinite;
}

.ch3-fx--lasers::after {
  left: 68%;
  width: 2px;
  transform: rotate(-14deg);
  animation: ch3-laser-sweep-b 11s ease-in-out infinite 2.5s;
}

@keyframes ch3-laser-sweep-a {
  0%, 100% { opacity: 0; transform: translateX(-30px) rotate(18deg); }
  8%       { opacity: 0.95; }
  20%      { opacity: 0.2; }
  28%      { opacity: 0; transform: translateX(60px) rotate(18deg); }
}

@keyframes ch3-laser-sweep-b {
  0%, 100% { opacity: 0; transform: translateX(40px) rotate(-14deg); }
  10%      { opacity: 0.9; }
  22%      { opacity: 0.25; }
  32%      { opacity: 0; transform: translateX(-50px) rotate(-14deg); }
}

/* Brasas mágicas — chispas que suben con leve deriva lateral */
.ch3-spark {
  position: absolute;
  bottom: 8%;
  width: var(--sp-size, 4px);
  height: var(--sp-size, 4px);
  border-radius: 50%;
  background: rgba(255, 236, 190, 0.95);
  box-shadow: 0 0 8px 2px rgba(255, 214, 150, 0.8), 0 0 14px 4px rgba(160, 220, 255, 0.4);
  opacity: 0;
  animation: ch3-spark-rise var(--sp-dur, 8s) ease-in-out var(--sp-delay, 0s) infinite;
}

@keyframes ch3-spark-rise {
  0%   { opacity: 0; transform: translateY(0) translateX(0) scale(0.6); }
  12%  { opacity: 0.9; }
  50%  { transform: translateY(-44vh) translateX(12px) scale(1); }
  85%  { opacity: 0.5; }
  100% { opacity: 0; transform: translateY(-78vh) translateX(-8px) scale(0.5); }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Contenido — fluye sobre el parallax (z-index:1). Centrado vertical cuando cabe.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-content {
  position: relative;
  z-index: 1;
  min-height: 100%;
  box-sizing: border-box;
  padding: calc(96px + var(--sp-lg)) var(--sp-lg) calc(96px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-lg, 24px);
}

/* ── Estandarte flotante (reemplaza starbursts) ───────────────────────────── */
.ch3-decor {
  position: absolute;
  pointer-events: none;
  z-index: 2;
}

.ch3-decor img {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ch3-decor--banner {
  top: 96px;
  right: 5%;
  width: 92px;
  height: 92px;
  filter: drop-shadow(0 6px 12px rgba(26, 26, 46, 0.28));
  transform-origin: 50% 0;
  animation: ch3-banner-sway 5.5s ease-in-out infinite;
}

@keyframes ch3-banner-sway {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.ch3-hero {
  text-align: center;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.ch3-hero-title {
  font-family: 'Cinzel', 'Trajan Pro', 'Roboto', serif;
  font-weight: 900;
  font-size: clamp(3rem, 8vw, 5.5rem);
  margin: 0 0 var(--sp-md) 0;
  line-height: 1;
  letter-spacing: 0.02em;
  color: #2a2140;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 18px rgba(150, 220, 255, 0.45),
    0 2px 6px rgba(26, 26, 46, 0.2);
  display: inline-block;
  animation: ch3-title-sway 4s ease-in-out infinite;
  transform-origin: 50% 100%;
}

@keyframes ch3-title-sway {
  0%, 100% { transform: rotate(-1deg); }
  50%      { transform: rotate(1deg); }
}

.ch3-hero-title:hover {
  animation-duration: 0.6s;
}

/* ── Marquee re-skin arcano (oro + cyan mágico) ───────────────────────────── */
.ch3-marquee {
  font-family: 'Cinzel', 'Bungee', Impact, 'Arial Black', sans-serif;
  font-weight: 700;
  font-size: clamp(2rem, 5.5vw, 4rem);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-md, 16px);
  line-height: 1.05;
  background: linear-gradient(
    90deg,
    #f6c453 0%, #fff3c4 24%, #aef3ff 48%, #c9b6ff 72%, #f6c453 100%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow:
    0 0 6px rgba(255, 255, 255, 0.85),
    0 0 18px rgba(174, 243, 255, 0.5),
    0 0 34px rgba(201, 182, 255, 0.4),
    0 4px 10px rgba(26, 26, 46, 0.35);
  animation: ch3-marquee-shift 7s linear infinite,
             ch3-marquee-pulse 2.4s ease-in-out infinite;
}

@keyframes ch3-marquee-shift {
  0%   { background-position: 0 0; }
  100% { background-position: 220% 0; }
}

@keyframes ch3-marquee-pulse {
  0%, 100% { letter-spacing: 0.04em; }
  50%      { letter-spacing: 0.07em; }
}

/* ── Bio card ─────────────────────────────────────────────────────────────── */
.ch3-bio-card {
  max-width: 1080px;
  width: 100%;
  padding: var(--sp-xl, 48px);
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 252, 244, 0.62) 0%, rgba(244, 248, 255, 0.5) 100%);
  border: 3px solid #3a2f4a;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 8px 28px rgba(26, 26, 46, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--sp-lg, 24px);
  align-items: center;
}

.ch3-bio-text p {
  font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #241f33;
  margin: 0 0 var(--sp-md) 0;
}

.ch3-bio-text p:last-child {
  margin-bottom: 0;
}

.ch3-bio-aside {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ch3-bio-shield {
  display: block;
  width: 100%;
  max-width: 280px;
  height: auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 6px 14px rgba(26, 26, 46, 0.3));
  animation: ch3-shield-float 5s ease-in-out infinite;
}

@keyframes ch3-shield-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

/* ── Projects ─────────────────────────────────────────────────────────────── */
.ch3-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-width: 720px;
  width: 100%;
}

/* ─────────────────────────────────────────────────────────────────────────
 * PRM — desactiva todo el movimiento. El JS también hace guard (reduced()),
 * pero esto cubre las animaciones puramente CSS.
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .ch3-layer,
  .ch3-fx--magic,
  .ch3-fx--lasers::before,
  .ch3-fx--lasers::after,
  .ch3-spark,
  .ch3-decor--banner,
  .ch3-hero-title,
  .ch3-marquee,
  .ch3-bio-shield {
    animation: none !important;
  }
  .ch3-layer {
    transform: none !important;
  }
  .ch3-fx--lasers::before,
  .ch3-fx--lasers::after,
  .ch3-spark {
    opacity: 0 !important;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-content {
    padding: calc(68px + var(--sp-sm)) var(--sp-md) calc(96px + env(safe-area-inset-bottom, 0px));
    gap: var(--sp-md);
  }

  .ch3-bio-card {
    padding: var(--sp-md);
    grid-template-columns: 1fr;
    gap: var(--sp-md);
  }

  .ch3-bio-text p {
    font-size: 1rem;
  }

  .ch3-marquee {
    font-size: 1.7rem;
    letter-spacing: 0.03em;
  }

  .ch3-bio-shield {
    max-width: 180px;
    margin: 0 auto;
  }

  .ch3-decor--banner {
    top: 72px;
    right: 4%;
    width: 64px;
    height: 64px;
  }
}
</style>
