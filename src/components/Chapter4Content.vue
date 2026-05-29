<!--
  Chapter4Content.vue — Layout 2-col desktop / stacked mobile para chapter AR/VR.

  iter2 (Rafael 2026-05-28): reemplazado el stack parallax 4-capas (ParallaxLayers.vue
  + 4 assets ch4-bg-stars-far / ch4-bg-planet-mid / ch4-fg-panels / ch4-fg-ships) por un
  único `ch4-bg.png` full-bleed cover fixed, mismo patrón que .ch3-stage. Los
  foregrounds originales eran sprites ~120×120 estirados full-bleed → naves gigantes
  bloqueando todo. Estilo halftone también disonante con el acuarela vintage del portfolio.
  Assets iter1 preservados en public/assets/old/ + CHANGELOG entry. Ver CLAUDE.md §6.5.

  Decisiones que quedan vigentes:
  - D4-04 + UI-SPEC §6.8: ch4 usa <FloatingPanel> glass holographic (NO ProjectCard
    skeumorphic) — confirmado por Rafael 2026-05-28.
  - D3-09 layout 2-col / mobile stacked heredado.
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import FloatingPanel from './FloatingPanel.vue'

const { t } = useI18n()

const chapter = chapters[4]
const ch4Projects = computed(() => projects.filter((p) => p.chapterEra === 4))

// Bio era-specific: AR/VR independiente Ecuador + Metrodigi líder (Rafael 2026-05-14).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
</script>

<template>
  <div class="ch4-layout">
    <!-- Meta sin imagen inline — StickyAvatar top-left es único avatar visible
         (Rafael 2026-05-15: quitar imagen inline en todos los ch). -->
    <aside class="ch4-meta">
      <p class="ch4-year">{{ chapter.year }}</p>
      <p class="ch4-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <div class="ch4-content">
      <FloatingPanel :title="t(chapter.titleKey)">
        <p class="ch4-flavor">{{ t('chapters.4.flavor') }}</p>
        <p v-for="(para, idx) in bioParagraphs" :key="idx" class="ch4-bio">{{ para }}</p>
      </FloatingPanel>

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
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────
 * .ch4-layout — iter2: full-bleed bg fixed cover estilo .ch3-stage.
 * Pixel art acuarela vintage AR/VR (chico con visor + paneles
 * holográficos + monitor CRT + hex wireframes). FloatingPanel
 * glass + backdrop-filter blur sobre el bg.
 * 2-col grid desktop (200px aside + 1fr content) heredado D3-09.
 * ───────────────────────────────────────────────────────────── */
.ch4-layout {
  position: relative;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--sp-lg);
  padding-left: 160px;
  padding-right: var(--sp-lg);
  padding-top: calc(96px + var(--sp-lg));
  padding-bottom: var(--sp-lg);
  height: 100%;
  background-color: var(--c-bg);
  background-image: url('/assets/ch4-bg.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  image-rendering: pixelated;
}

.ch4-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
}

.ch4-year {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
}

.ch4-era {
  font-family: 'Audiowide', 'Eurostile', sans-serif;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
}

.ch4-content {
  overflow-y: auto;
  padding-right: var(--sp-md);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
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
  font-size: 1rem;
  line-height: 1.6;
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
 * Mobile <600px stacked (D3-09 heredado)
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch4-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    /* fixed attachment es buggy en iOS Safari — scroll mobile usa scroll attachment */
    background-attachment: scroll;
  }

  .ch4-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch4-year {
    font-size: 1.5rem;
  }

  .ch4-era {
    font-size: 1.2rem;
  }

  .ch4-content {
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
</style>
