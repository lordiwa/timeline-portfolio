<!--
  Chapter3Content.vue — Web 2.0 era 2013 (Pink Parrot, líder de equipo).

  Iter7 (Rafael 2026-05-19): fondo Space Invaders pixel art acuarela
  (ch3-invaders-bg.png). Removidos por Rafael: logo RM 3D, Aqua buttons
  (LinkedIn/GitHub/Contact), social badges era 2007 (Flickr/Vimeo/etc).
  Quedan: hero text + pull-quote + bio card + starbursts BETA/NEW.

  Assets activos:
  - ch3-invaders-bg.png (1376×768 hero bg cover fixed)
  - ch3-starburst-{green,orange}.png (BETA/NEW floating)

  Assets disponibles pero no referenciados (en public/assets/):
  - ch3-logo-rm.png — recuperar si se reintroduce el logo
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

const chapter = chapters[3]
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

const starbursts = [
  { key: 'beta', src: '/assets/ch3-starburst-green.png', label: 'BETA' },
  { key: 'new', src: '/assets/ch3-starburst-orange.png', label: '¡NEW!' },
]
</script>

<template>
  <div class="ch3-stage">
    <!-- Starbursts decorativos floating Web 2.0 -->
    <div
      v-for="sb in starbursts"
      :key="sb.key"
      :class="['ch3-starburst', `ch3-starburst--${sb.key}`]"
      aria-hidden="true"
    >
      <img :src="sb.src" alt="" />
      <span class="ch3-starburst-text">{{ sb.label }}</span>
    </div>

    <!-- Hero centered (tag PINK PARROT 2013 removido iter11) -->
    <header class="ch3-hero">
      <h1 class="ch3-hero-title">Rafael</h1>
    </header>

    <!-- Marquee multicolor neon scanlines (iter12 — reemplaza pull-quote) -->
    <h2 class="ch3-marquee" aria-hidden="true">De vuelta al movimiento</h2>

    <!-- Bio card protagonico — layout 2/3 texto + 1/3 robot head rotada (iter7) -->
    <article class="ch3-bio-card">
      <div class="ch3-bio-text">
        <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
      </div>
      <aside class="ch3-bio-aside" aria-hidden="true">
        <img
          src="/assets/ch3-robot.png"
          alt=""
          class="ch3-bio-mascot"
        />
      </aside>
    </article>

    <!-- Project cards stack (vacío hasta que data/projects.js tenga ch3 entries) -->
    <div v-if="ch3Projects.length > 0" class="ch3-projects">
      <ProjectCard
        v-for="project in ch3Projects"
        :key="project.id"
        :project="project"
      />
    </div>

  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch3-stage — full-bleed canvas con 6 robots vintage Tin Toy pixel art acuarela (iter8).
 * Clip ya gestionado por .chapter-section overflow:hidden (311ac02).
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
  padding: calc(96px + var(--sp-lg)) var(--sp-lg) calc(96px + env(safe-area-inset-bottom, 0px));
  /* Fondo hero fullscreen — 6 robots vintage Tin Toy cuerpo completo
   * (Rafael 2026-05-19, iter8). Mismo estilo acuarela vintage del iter7
   * invaders + matchea el robot del bio card. 16:9 cover fijo. Iters
   * previas (rosado/loros/triangles/lápices/invaders) preservadas en old/. */
  background-color: #faf7f0;
  background-image: url('/assets/ch3-robots-bg.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  image-rendering: pixelated;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-lg, 24px);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hero centered — tag + nombre + subtitle (logo + Aqua buttons removidos iter7)
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-hero {
  text-align: center;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.ch3-hero-tag {
  font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 900;
  font-size: 0.95rem;
  letter-spacing: 0.22em;
  color: var(--c-accent);
  text-transform: uppercase;
  margin: 0 0 var(--sp-xs) 0;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  animation: ch3-tag-slide 8s ease-in-out infinite;
}

@keyframes ch3-tag-slide {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(6px); }
}

.ch3-hero-title {
  font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 900;
  font-size: clamp(3rem, 8vw, 5.5rem);
  margin: 0 0 var(--sp-md) 0;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--c-fg);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 4px rgba(26, 26, 46, 0.15);
  display: inline-block;
  animation: ch3-title-sway 4s ease-in-out infinite;
  transform-origin: 50% 100%;
}

@keyframes ch3-title-sway {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}

.ch3-hero-title:hover {
  animation-duration: 0.6s;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Pull-quote magazine big text — "Liderar no es delegar..."
 * ───────────────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────────────
 * Marquee multicolor neon arcade — "De vuelta al movimiento" (iter12).
 * Rainbow gradient animado + scanlines horizontales texture + chromatic
 * aberration shadow (RGB split magenta/cyan) + neon glow halo + pulse de
 * letter-spacing. Web 2.0 / arcade marquee energy.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-marquee {
  font-family: 'Bungee', Impact, 'Arial Black', sans-serif;
  font-weight: 400;
  font-size: clamp(2rem, 5.5vw, 4rem);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-align: center;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-md, 16px) var(--sp-md, 16px);
  line-height: 1.05;
  background:
    repeating-linear-gradient(0deg, transparent 0 2px, rgba(0, 0, 0, 0.22) 2px 3px),
    linear-gradient(90deg, #ff8a00 0%, #fff700 22%, #00ff95 44%, #00bfff 66%, #7c3aed 88%, #ff8a00 110%);
  background-size: 100% 100%, 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow:
    0 0 4px rgba(255, 255, 255, 0.9),
    -2px 0 0 rgba(255, 138, 0, 0.7),
    2px 0 0 rgba(0, 191, 255, 0.7),
    0 0 18px rgba(124, 58, 237, 0.55),
    0 0 38px rgba(0, 191, 255, 0.4),
    0 6px 14px rgba(0, 0, 0, 0.4);
  animation: ch3-marquee-shift 5s linear infinite,
             ch3-marquee-pulse 1.6s ease-in-out infinite;
  filter: contrast(1.06);
}

@keyframes ch3-marquee-shift {
  0%   { background-position: 0 0, 0 0; }
  100% { background-position: 0 0, 220% 0; }
}

@keyframes ch3-marquee-pulse {
  0%, 100% { letter-spacing: 0.03em; text-shadow:
    0 0 4px rgba(255, 255, 255, 0.9),
    -2px 0 0 rgba(255, 138, 0, 0.7),
    2px 0 0 rgba(0, 191, 255, 0.7),
    0 0 18px rgba(124, 58, 237, 0.55),
    0 0 38px rgba(0, 191, 255, 0.4),
    0 6px 14px rgba(0, 0, 0, 0.4); }
  50%      { letter-spacing: 0.06em; text-shadow:
    0 0 6px rgba(255, 255, 255, 1),
    -3px 0 0 rgba(255, 138, 0, 0.85),
    3px 0 0 rgba(0, 191, 255, 0.85),
    0 0 26px rgba(124, 58, 237, 0.7),
    0 0 50px rgba(0, 191, 255, 0.55),
    0 6px 14px rgba(0, 0, 0, 0.4); }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Bio card protagonico (iter7) — esquinas planas, layout 2/3 texto + 1/3
 * diablito. Más grande que iter anteriores (1080px max, padding xl).
 * Mantiene tinte glassy sutil pero SIN border-radius (Rafael 2026-05-19).
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-bio-card {
  max-width: 1080px;
  width: 100%;
  padding: var(--sp-xl, 48px) var(--sp-xl, 48px);
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 240, 246, 0.35) 50%, rgba(212, 232, 255, 0.42) 100%);
  border: 3px solid #33160E;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 8px 24px rgba(26, 26, 46, 0.18),
    0 1px 3px rgba(26, 26, 46, 0.08);
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
  color: var(--c-fg);
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

.ch3-bio-mascot {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 3px solid #33160E;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Starbursts BETA/NEW
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-starburst {
  position: absolute;
  width: 96px;
  height: 96px;
  pointer-events: none;
  z-index: 2;
  filter: drop-shadow(0 4px 8px rgba(26, 26, 46, 0.2));
}

.ch3-starburst img {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ch3-starburst-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-weight: 900;
  font-size: 1.15rem;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  letter-spacing: 0.02em;
}

.ch3-starburst--beta {
  top: 120px;
  right: 6%;
  animation: ch3-starburst-spin-cw 18s linear infinite, ch3-starburst-pulse 2.2s ease-in-out infinite;
}

.ch3-starburst--new {
  bottom: 24%;
  left: 5%;
  animation: ch3-starburst-spin-ccw 22s linear infinite, ch3-starburst-pulse 2.6s ease-in-out infinite;
}

@keyframes ch3-starburst-spin-cw {
  from { rotate: 12deg; }
  to { rotate: 372deg; }
}

@keyframes ch3-starburst-spin-ccw {
  from { rotate: -14deg; }
  to { rotate: -374deg; }
}

@keyframes ch3-starburst-pulse {
  0%, 100% { scale: 1; }
  50% { scale: 1.08; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Projects stack
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-width: 720px;
  width: 100%;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — typography reducida, starbursts más chicos
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-stage {
    padding: calc(68px + var(--sp-sm)) var(--sp-md) calc(96px + env(safe-area-inset-bottom, 0px));
    gap: var(--sp-md);
  }

  .ch3-bio-card {
    padding: var(--sp-md) var(--sp-md);
    grid-template-columns: 1fr;
    gap: var(--sp-md);
  }

  .ch3-bio-text p {
    font-size: 1rem;
  }

  .ch3-marquee {
    font-size: 1.7rem;
    letter-spacing: 0.02em;
  }

  .ch3-bio-mascot {
    max-width: 200px;
    margin: 0 auto;
  }

  .ch3-starburst {
    width: 64px;
    height: 64px;
  }

  .ch3-starburst-text {
    font-size: 0.8rem;
  }

  .ch3-starburst--beta {
    top: 80px;
    right: 4%;
  }

  .ch3-starburst--new {
    bottom: 18%;
    left: 4%;
  }
}
</style>
