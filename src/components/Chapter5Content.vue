<!--
  Chapter5Content.vue — Layout 2-col desktop / stacked mobile para chapter Modern 2022-23.

  Plan 04-05 Task 4. Decisiones de diseño:
  - Layout clonado de Chapter3Content (ch3→ch5) — D3-09 Opción A heredado.
  - Cada ProjectCard envuelto en ScrollRevealCard con :delay="100 * (idx + 1)"
    para staggered reveal (header ScrollRevealCard delay=0).
  - El bg viene de BackgroundLayers global consumiendo --bg-image
    (declarado en chapter-themes.css [data-chapter="5"]) — NO background-image en SFC.
  - Avatar in-content reusa convención Chapter3Content (aside.chN-meta).
  - ScrollRevealCard PRM defensive double — bajo prefersReduced, todos los cards
    quedan revealed desde mount (instant render sin staggered animation).
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'
import ScrollRevealCard from './ScrollRevealCard.vue'

const { t } = useI18n()

const chapter = chapters[5]
const ch5Projects = computed(() => projects.filter((p) => p.chapterEra === 5))

// Bio era-specific: number8 + BairesDev + VivoEnVivo + RocketSnail + Remoose (Rafael 2026-05-14).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
</script>

<template>
  <div class="ch5-layout">
    <!-- Meta sin imagen inline — StickyAvatar top-left es único avatar visible
         (Rafael 2026-05-15: quitar imagen inline en todos los ch). -->
    <aside class="ch5-meta">
      <p class="ch5-year">{{ chapter.year }}</p>
      <p class="ch5-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <div class="ch5-content">
      <ScrollRevealCard :threshold="0.2" :delay="0">
        <h1 class="ch5-title">{{ t(chapter.titleKey) }}</h1>
        <p class="ch5-flavor">{{ t('chapters.5.flavor') }}</p>
        <p v-for="(para, idx) in bioParagraphs" :key="idx" class="ch5-bio">{{ para }}</p>
      </ScrollRevealCard>

      <div v-if="ch5Projects.length > 0" class="ch5-projects">
        <ScrollRevealCard
          v-for="(project, idx) in ch5Projects"
          :key="project.id"
          :threshold="0.2"
          :delay="100 * (idx + 1)"
        >
          <ProjectCard :project="project" />
        </ScrollRevealCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch5-layout — D3-09 Opción A heredado (2-col desktop)
 * El bg viene de BackgroundLayers global (--bg-image) — NO background-image local.
 * ───────────────────────────────────────────────────────────── */
.ch5-layout {
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

.ch5-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
}

.ch5-year {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
  font-weight: 600;
}

.ch5-era {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
  font-weight: 500;
}

.ch5-content {
  overflow-y: auto;
  padding-right: var(--sp-md);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
}

.ch5-title {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: var(--c-fg);
  margin: 0 0 var(--sp-sm) 0;
  letter-spacing: -0.02em;
}

.ch5-flavor {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 0.95rem;
  color: var(--c-fg);
  opacity: 0.7;
  margin: 0 0 var(--sp-md) 0;
}

.ch5-bio {
  font-family: 'Inter Variable', system-ui, sans-serif;
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--c-fg);
  margin: 0;
}

.ch5-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
  margin-top: var(--sp-lg);
}

/* ─────────────────────────────────────────────────────────────
 * Mobile <600px stacked (D3-09 + D3-12 heredados)
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch5-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    overflow-y: visible;
  }

  .ch5-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch5-year {
    font-size: 1.5rem;
  }

  .ch5-era {
    font-size: 1.2rem;
  }

  .ch5-content {
    overflow-y: auto;
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
</style>
