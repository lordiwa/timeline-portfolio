<!--
  Chapter3Content.vue — Web 2.0 era 2013 (Pink Parrot, líder de equipo).

  Iter2 (Rafael 2026-05-17): logo RM 3D reemplaza cara, halftone dots
  pattern reemplaza paper-bg, +Aqua buttons row, +pull-quote destacado,
  +social badges footer era 2007, bio reenfocado en LIDERAZGO (no UX).

  Decisiones design:
  - Layout hero centered + cards stack.
  - Logo RM glossy 3D Aqua estilo Apple Tiger 2005 — no avatar bust personal.
  - Background halftone Lichtenstein pop-art pink+cyan.
  - Aqua buttons gel-glass estilo Mac OS X 10.4 (LINKEDIN/GITHUB/CONTACT decorativos).
  - Pull-quote big magazine text del bio.
  - Social badges era 2007 (Flickr/Vimeo/Delicious/MySpace/Twitter beta) SVG inline.
  - Clip ya garantizado por overflow:hidden en .chapter-section (311ac02).

  Assets iter2:
  - ch3-logo-rm.png (128px glossy pink-cyan gradient monogram)
  - ch3-halftone-bg.png (128px tileable pink+cyan dots)
  - ch3-starburst-{green,orange}.png (iter1 conservados)
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

const logoSrc = '/assets/ch3-logo-rm.png'

// Decorativo: 3 Aqua buttons (sin href real — clicks ignorados, son visual flavor).
const aquaButtons = [
  { key: 'linkedin', label: 'LINKEDIN' },
  { key: 'github', label: 'GITHUB' },
  { key: 'contact', label: 'CONTACT' },
]

// Social badges era 2007 — SVG inline simple (mini geometric shapes representando
// servicios icónicos). Decorativos, aria-hidden, no functional links.
const socialBadges = [
  { key: 'flickr', label: 'flickr', color1: '#ff0084', color2: '#0063dc' },
  { key: 'vimeo', label: 'vimeo', color1: '#1ab7ea', color2: '#162221' },
  { key: 'delicious', label: 'del.icio.us', color1: '#3399ff', color2: '#003366' },
  { key: 'myspace', label: 'MySpace', color1: '#003399', color2: '#000000' },
  { key: 'twitter', label: 'twttr beta', color1: '#1da1f2', color2: '#0084b4' },
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

    <!-- Hero centered con logo RM 3D -->
    <header class="ch3-hero">
      <div class="ch3-logo" aria-hidden="true">
        <img :src="logoSrc" alt="" class="ch3-logo-img" />
      </div>
      <p class="ch3-hero-tag">PINK PARROT · 2013</p>
      <h1 class="ch3-hero-title">Rafael</h1>
      <p class="ch3-hero-subtitle">{{ t(chapter.eraKey) }} · liderazgo de equipo</p>

      <!-- Aqua glossy buttons decorativos (Mac OS X Tiger 2005 vibe) -->
      <div class="ch3-buttons" aria-hidden="true">
        <button
          v-for="b in aquaButtons"
          :key="b.key"
          :class="['ch3-aqua-btn', `ch3-aqua-btn--${b.key}`]"
          type="button"
          tabindex="-1"
        >
          <span>{{ b.label }}</span>
        </button>
      </div>
    </header>

    <!-- Pull-quote magazine big text -->
    <blockquote class="ch3-quote" aria-hidden="true">
      <span class="ch3-quote-mark ch3-quote-mark--open">“</span>
      Liderar no es delegar, es desbloquear.
      <span class="ch3-quote-mark ch3-quote-mark--close">”</span>
    </blockquote>

    <!-- Bio card glassy Aqua -->
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

    <!-- Footer: social badges era 2007 (decorativos, no links reales) -->
    <footer class="ch3-social" aria-hidden="true">
      <span
        v-for="sb in socialBadges"
        :key="sb.key"
        :class="['ch3-social-badge', `ch3-social-badge--${sb.key}`]"
        :style="{
          background: `linear-gradient(180deg, ${sb.color1} 0%, ${sb.color2} 100%)`,
        }"
      >{{ sb.label }}</span>
    </footer>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * .ch3-stage — full-bleed canvas con halftone pop-art bg.
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
  /* Fondo rosado plano (Rafael 2026-05-17: quitar halftone dots, muy
   * agresivos) + tramado diagonal CSS-only muy leve (white alpha 0.06)
   * para que no sea totalmente plano. */
  background-color: #ffd6e3;
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent 0,
      transparent 7px,
      rgba(255, 255, 255, 0.06) 7px,
      rgba(255, 255, 255, 0.06) 8px
    );
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-lg, 24px);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Hero centered — logo RM + tag + nombre + subtitle + Aqua buttons
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-hero {
  text-align: center;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
}

.ch3-logo {
  display: inline-block;
  margin: 0 auto var(--sp-sm);
  filter: drop-shadow(0 6px 14px rgba(26, 26, 46, 0.3));
}

.ch3-logo-img {
  display: block;
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
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
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  font-weight: 400;
  margin: 0;
  line-height: 1;
  color: var(--c-fg);
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 4px rgba(26, 26, 46, 0.15);
}

.ch3-hero-subtitle {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: clamp(0.95rem, 1.8vw, 1.15rem);
  color: var(--c-fg);
  opacity: 0.8;
  margin: var(--sp-xs) 0 var(--sp-md) 0;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Aqua glossy buttons — Mac OS X 10.4 Tiger 2005 vibe
 * Cada button con gradient top→bottom + inset highlight + soft shadow
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-sm);
  margin-top: var(--sp-sm);
}

.ch3-aqua-btn {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: bold;
  letter-spacing: 0.08em;
  color: #ffffff;
  padding: 8px 22px;
  border: 1px solid rgba(26, 26, 46, 0.4);
  border-radius: 22px;
  cursor: default;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -2px 6px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(26, 26, 46, 0.2);
  transition: transform 0.15s ease;
}

.ch3-aqua-btn--linkedin {
  background: linear-gradient(to bottom, #88d4f1 0%, #39a0d8 50%, #1a7ab4 51%, #278ecb 100%);
}

.ch3-aqua-btn--github {
  background: linear-gradient(to bottom, #b8ff3a 0%, #6fcb1a 50%, #4a8810 51%, #5fab14 100%);
}

.ch3-aqua-btn--contact {
  background: linear-gradient(to bottom, #ff9eb5 0%, #ff5085 50%, #c8295a 51%, #e23a73 100%);
}

.ch3-aqua-btn:hover {
  transform: translateY(-1px);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Pull-quote magazine big text — "Liderar no es delegar..."
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-quote {
  font-family: 'Lobster', Georgia, serif;
  font-size: clamp(1.5rem, 3.5vw, 2.4rem);
  line-height: 1.25;
  color: var(--c-fg);
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 var(--sp-md);
  position: relative;
  text-shadow: 0 2px 6px rgba(255, 255, 255, 0.55);
}

.ch3-quote-mark {
  font-family: Georgia, serif;
  font-size: 2.5em;
  line-height: 0;
  color: var(--c-accent);
  vertical-align: -0.35em;
  opacity: 0.7;
}

.ch3-quote-mark--open { margin-right: 0.05em; }
.ch3-quote-mark--close { margin-left: 0.05em; }

/* ─────────────────────────────────────────────────────────────────────────
 * Bio card glassy Aqua — Pink tint para no ser blanco puro
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-bio-card {
  max-width: 720px;
  width: 100%;
  padding: var(--sp-lg) calc(var(--sp-lg) + var(--sp-sm));
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 240, 246, 0.72) 50%, rgba(212, 232, 255, 0.78) 100%);
  border: 1px solid rgba(160, 176, 216, 0.5);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 6px 18px rgba(26, 26, 46, 0.15),
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
  transform: rotate(12deg);
}

.ch3-starburst--new {
  bottom: 24%;
  left: 5%;
  transform: rotate(-14deg);
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
 * Social badges era 2007 — Flickr/Vimeo/Delicious/MySpace/Twitter beta
 * Mini "pills" rectangular con linear-gradient brand colors + lowercase
 * ───────────────────────────────────────────────────────────────────────── */
.ch3-social {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-xs, 6px);
  max-width: 720px;
  width: 100%;
  margin-top: var(--sp-md);
  padding-top: var(--sp-sm);
  border-top: 1px dashed rgba(26, 26, 46, 0.25);
}

.ch3-social-badge {
  font-family: 'Trebuchet MS', Helvetica, Arial, sans-serif;
  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 3px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 1px 2px rgba(0, 0, 0, 0.2);
  text-transform: lowercase;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Mobile <600px — typography reducida, starbursts más chicos
 * ───────────────────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-stage {
    padding: calc(68px + var(--sp-sm)) var(--sp-md) calc(96px + env(safe-area-inset-bottom, 0px));
    gap: var(--sp-md);
  }

  .ch3-logo-img {
    width: 72px;
    height: 72px;
  }

  .ch3-bio-card {
    padding: var(--sp-md) var(--sp-md);
    border-radius: 14px;
  }

  .ch3-bio-card p {
    font-size: 1rem;
  }

  .ch3-aqua-btn {
    font-size: 0.8rem;
    padding: 6px 14px;
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
