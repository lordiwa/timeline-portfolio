<!--
  Chapter3Content.vue — Web 2.0 era 2013 (Pink Parrot, UX, líder).

  Decisiones (Rafael 2026-05-17, "todo a tope" Web 2.0):
  - Layout: hero centered + cards stack (desvía D3-09 stub; D3-09 era el default
    Phase 2 placeholder, finalizada Phase 3 con design era-auténtico).
  - Signature elements: Aqua glossy buttons, wet reflection en avatar,
    starbursts BETA/NEW decorativos, skeumorphic paper texture bg.
  - D3-12 LOCKED preservado: mobile permite scroll interno via .ch3-stage
    overflow-y:auto.
  - D3-04: joins inline projects.filter chapterEra===3 (sin ch3 projects todavía).
  - Bio era-specific: Pink Parrot UX + liderazgo + ágil (i18n bio.eras[3]).

  Assets generados Phase 3 W2 (Rafael 2026-05-17):
  - ch3-starburst-green.png (12-point lime Aqua)
  - ch3-starburst-orange.png (14-point orange Aqua)
  - ch3-paper-bg.png (light pastel blue paper texture seamless 128×128)
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

// Starbursts decorativos via :src dinámico (mismo patrón que ch1 GIFs — evita
// que el SFC compiler de vitest tropiece con path absolute /assets/).
const starbursts = [
  { key: 'beta', src: '/assets/ch3-starburst-green.png', label: 'BETA' },
  { key: 'new', src: '/assets/ch3-starburst-orange.png', label: '¡NEW!' },
]
</script>

<template>
  <div class="ch3-stage">
    <!-- Starbursts decorativos floating Web 2.0 (Gmail/Flickr BETA badges) -->
    <div
      v-for="sb in starbursts"
      :key="sb.key"
      :class="['ch3-starburst', `ch3-starburst--${sb.key}`]"
      aria-hidden="true"
    >
      <img :src="sb.src" alt="" />
      <span class="ch3-starburst-text">{{ sb.label }}</span>
    </div>

    <!-- Hero centered — Web 2.0 landing era Twitter/Flickr 2007 -->
    <header class="ch3-hero">
      <p class="ch3-hero-tag">PINK PARROT · 2013</p>
      <h1 class="ch3-hero-title">Rafael</h1>
      <p class="ch3-hero-subtitle">{{ t(chapter.eraKey) }} — UX + dev + líder</p>

      <!-- Avatar circular con wet reflection (CSS-only, no asset extra) -->
      <div class="ch3-avatar-wet" aria-hidden="true">
        <img class="ch3-avatar-img" :src="`/assets/ch${chapter.id}-bust.png`" alt="" />
      </div>
    </header>

    <!-- Bio card glassy — Aqua gradient + soft shadow + big text Trebuchet -->
    <article class="ch3-bio-card">
      <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
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
 * .ch3-stage — full-bleed canvas Web 2.0 con paper texture tileable bg.
 * Height/max-height:100dvh + overflow:hidden mismo patrón que ch1 fix
 * (2f5c627) — evita que flex-center del .chapter-section desplace el layout
 * cuando contenido > viewport. .ch3-stage scrollea internamente en mobile.
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
  background-image: url('/assets/ch3-paper-bg.png');
  background-repeat: repeat;
  background-size: 128px 128px;
  background-color: var(--c-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-xl, 32px);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hero centered — el corazón del chapter Web 2.0
 * Tipografía: Lobster (display) para el nombre, Trebuchet/Helvetica para tag.
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-hero {
  text-align: center;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.ch3-hero-tag {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: 0.85rem;
  font-weight: bold;
  letter-spacing: 0.2em;
  color: var(--c-accent);
  text-transform: uppercase;
  margin: 0 0 var(--sp-xs) 0;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}

.ch3-hero-title {
  font-family: 'Lobster', Georgia, serif;
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 400;
  margin: 0;
  line-height: 1;
  /* Web 2.0 signature: text-shadow soft + accent color */
  color: var(--c-fg);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 4px rgba(26, 26, 46, 0.15);
}

.ch3-hero-subtitle {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--c-fg);
  opacity: 0.75;
  margin: var(--sp-xs) 0 var(--sp-lg) 0;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Avatar con wet reflection — Apple iPod 2005 / Web 2.0 product shot
 * - .ch3-avatar-img: circular, drop-shadow, gradient ring
 * - ::after pseudo crea el reflejo invertido con fade-out
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-avatar-wet {
  position: relative;
  display: inline-block;
  margin: 0 auto;
  /* Container holds img + reflection — reflection is pseudo */
}

.ch3-avatar-img {
  display: block;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow:
    0 0 0 1px rgba(26, 26, 46, 0.15),
    0 8px 16px rgba(26, 26, 46, 0.25);
  background: linear-gradient(180deg, #ffffff 0%, var(--c-bg) 100%);
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ch3-avatar-wet::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 4px;
  right: 4px;
  height: 64px;
  background-image: url('/assets/ch3-bust.png');
  background-size: cover;
  background-position: center;
  transform: scaleY(-1);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 80%);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 80%);
  border-radius: 0 0 50% 50%;
  pointer-events: none;
  opacity: 0.6;
  image-rendering: pixelated;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Bio card glassy Aqua — gradient + soft shadow + border-radius high
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-bio-card {
  max-width: 720px;
  width: 100%;
  padding: var(--sp-lg) calc(var(--sp-lg) + var(--sp-sm));
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.55) 50%, rgba(240, 244, 255, 0.65) 100%);
  border: 1px solid rgba(160, 176, 216, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 6px 18px rgba(26, 26, 46, 0.12),
    0 1px 3px rgba(26, 26, 46, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.ch3-bio-card p {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: 1.1rem;
  line-height: 1.65;
  color: var(--c-fg);
  margin: 0 0 var(--sp-md) 0;
}

.ch3-bio-card p:last-child {
  margin-bottom: 0;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Starbursts BETA/NEW — Gmail/Flickr era badges
 * Position absolute esquinas + rotate slight para vibe handmade
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
  transform: rotate(12deg);
}

.ch3-starburst--new {
  bottom: 18%;
  left: 5%;
  transform: rotate(-14deg);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Projects stack — cards glassy idénticas al bio-card (variant)
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  max-width: 720px;
  width: 100%;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — D3-12 preservado (scroll interno en .ch3-stage),
 * starbursts más chicos, hero typography reducida.
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-stage {
    padding: calc(68px + var(--sp-sm)) var(--sp-md) calc(96px + env(safe-area-inset-bottom, 0px));
    gap: var(--sp-lg);
  }

  .ch3-avatar-img {
    width: 96px;
    height: 96px;
  }

  .ch3-avatar-wet::after {
    height: 48px;
  }

  .ch3-bio-card {
    padding: var(--sp-md) var(--sp-md);
    border-radius: 14px;
  }

  .ch3-bio-card p {
    font-size: 1rem;
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
    bottom: 14%;
    left: 4%;
  }
}
</style>
