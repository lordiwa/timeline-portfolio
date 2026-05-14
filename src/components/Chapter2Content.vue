<!--
  Chapter2Content.vue — Layout 2-col desktop / stacked mobile para el chapter Flash era 2009.

  Decisiones de diseño:
  - Clonado de Chapter3Content.vue (Phase 3) con mods mecánicas ch3 → ch2 + embed
    de FlashBanner como header del content + p.ch2-flavor entre bio y proyectos.
  - D3-09 Opción A heredado: avatar grande dentro de la section a padding-left: 160px desktop
    (espacio para StickyTimeline ~120px width + margen). StickyAvatar Phase 1 sigue visible
    top-left invariante — dos avatares simultáneos intencional.
    Mobile <600px: stacked + padding-left 60px (StickyTimeline mobile year-only).
  - D3-12 heredado: mobile abandona height: 100dvh strict y permite overflow-y: auto
    interno en .ch2-content. Scroll-chaining nativo Chrome+Firefox.
  - D3-04 heredado: joins inline — projects.filter(p => p.chapterEra === 2) en computed.
  - El fondo del chapter viene de BackgroundLayers (D2-04 global) consumiendo --bg-image
    declarado en chapter-themes.css [data-chapter="2"] — NO necesita background-image en SFC.
  - Bio text usa t(bio.coreKey) — placeholder "PENDING" hasta que Rafael llene el JSON.
    Cero v-html (T-04-06 XSS-CONTENT mitigation).
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import FlashBanner from './FlashBanner.vue'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

// chapters[2] es el chapter Flash era (2009).
const chapter = chapters[2]

// computed para reactividad si projects.js cambia en HMR
const ch2Projects = computed(() => projects.filter((p) => p.chapterEra === 2))
</script>

<template>
  <div class="ch2-layout">
    <!-- Columna izquierda: avatar bust grande + meta (year + era localizada) -->
    <aside class="ch2-meta">
      <img
        class="ch2-avatar"
        :src="chapter.avatarSrc"
        :alt="t('avatar.busts.2.alt')"
        width="160"
        height="192"
        loading="lazy"
      />
      <p class="ch2-year">{{ chapter.year }}</p>
      <p class="ch2-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <!-- Columna derecha: FlashBanner header + bio + flavor + projects -->
    <div class="ch2-content">
      <FlashBanner />

      <div class="ch2-bio">
        <p>{{ t(bio.coreKey) }}</p>
      </div>

      <p class="ch2-flavor">{{ t('chapters.2.flavor') }}</p>

      <div v-if="ch2Projects.length > 0" class="ch2-projects">
        <ProjectCard
          v-for="project in ch2Projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch2-layout — 2-col desktop (D3-09 Opción A heredado)
 * grid-template-columns: 200px (aside meta) + 1fr (content)
 * padding-left: 160px → espacio para StickyTimeline ~120px + margen
 * padding-top: espacio para StickyAvatar 80×96 + margen
 * ───────────────────────────────────────────────────────────── */
.ch2-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));
  padding-bottom: var(--sp-lg);
  height: 100%;
  overflow-y: hidden;
}

.ch2-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
}

.ch2-avatar {
  width: 160px;
  height: 192px;
  image-rendering: pixelated;
  background: var(--c-surface, var(--c-bg, #2a1a4a));
  border: 1px solid var(--c-border);
  border-radius: 8px;
}

.ch2-year {
  font-family: 'Verdana', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
  font-weight: 700;
}

.ch2-era {
  font-family: 'Verdana', 'Trebuchet MS', sans-serif;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
}

.ch2-content {
  overflow-y: hidden;
  padding-right: var(--sp-md);
  /* Reservar espacio para ContactHUD bottom-right + safe area */
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
}

.ch2-bio p {
  font-family: 'Verdana', 'Trebuchet MS', sans-serif;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--c-fg);
  margin: var(--sp-md) 0 var(--sp-sm) 0;
}

.ch2-flavor {
  font-family: 'Verdana', 'Trebuchet MS', sans-serif;
  font-size: 0.95rem;
  font-style: italic;
  color: var(--c-fg);
  opacity: 0.85;
  margin: 0 0 var(--sp-lg) 0;
}

.ch2-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

/* ─────────────────────────────────────────────────────────────
 * Mobile <600px — D3-09 stacked + D3-12 scroll interno
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch2-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    overflow-y: visible;
  }

  .ch2-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch2-avatar {
    width: 96px;
    height: 116px;
  }

  .ch2-year {
    font-size: 1.5rem;
  }

  .ch2-era {
    font-size: 1.2rem;
  }

  .ch2-content {
    overflow-y: auto;
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
</style>
