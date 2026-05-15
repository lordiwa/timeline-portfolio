<!--
  Chapter3Content.vue — Layout 2-col desktop / stacked mobile para el chapter Web 2.0.

  Decisiones de diseño:
  - D3-09 Opción A LOCKED: avatar grande dentro de la section a padding-left: 160px desktop
    (espacio para StickyTimeline ~120px width + margen). StickyAvatar Phase 1 sigue visible
    top-left invariante — dos avatares simultáneos intencional (HUD sticky + content grande).
    Mobile <600px: stacked + padding-left 60px (StickyTimeline mobile year-only ~44px + margen).
  - D3-12 LOCKED: mobile ch3 abandona height: 100dvh strict y permite overflow-y: auto
    interno en .ch3-content. Scroll-chaining nativo Chrome+Firefox propaga al outer
    scroll-snap shell cuando el inner scroll se agota. iOS Safari deferred (Plan 07 precedent).
  - D3-04: joins inline — projects.filter(p => p.chapterEra === 3) directamente en computed,
    sin helpers en chapters.js.
  - Imagen /assets/ch3-bust.png no existe hasta Plan 03-05 — alt text i18n provee fallback.
  - Bio text usa t(bio.coreKey) — renderiza "PENDING — CONTENT-CHECKLIST §1.1" hasta que
    Rafael llene el JSON. No se usa v-html (T-XSS-CONTENT mitigation).
  - Requerimientos: CON-01 (bio renderizada con estilo era ch3) + CON-02 (proyectos ch3).
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { projects } from '@/data/projects'
import { bio } from '@/data/bio'
import ProjectCard from './ProjectCard.vue'

const { t } = useI18n()

// chapters[3] es el chapter Web 2.0 (2013). Lookup directo por index — el array
// es estable (D3-04). Phase 5 podría migrar a chapters.find(c => c.id === 3) si el
// orden varía.
const chapter = chapters[3]

// computed para reactividad si projects.js cambia en HMR (Phase 4 llenará con contenido real)
const ch3Projects = computed(() => projects.filter((p) => p.chapterEra === 3))

// Bio era-specific: Pink Parrot UX + liderazgo + ágil (Rafael 2026-05-14).
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
</script>

<template>
  <div class="ch3-layout">
    <!-- Columna izquierda: meta (year + era localizada). StickyAvatar top-left invariante
         es el único avatar visible (Rafael 2026-05-15: quitar imagen inline en todos los ch). -->
    <aside class="ch3-meta">
      <p class="ch3-year">{{ chapter.year }}</p>
      <p class="ch3-era">{{ t(chapter.eraKey) }}</p>
    </aside>

    <!-- Columna derecha: bio + lista de ProjectCards filtrados por chapterEra===3 -->
    <div class="ch3-content">
      <div class="ch3-bio">
        <!-- bio era-specific: ch3 muestra Pink Parrot UX + liderazgo + ágil. -->
        <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
      </div>

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
/* ─────────────────────────────────────────────────────────────
 * .ch3-layout — 2-col desktop (D3-09 Opción A)
 * grid-template-columns: 200px (aside meta) + 1fr (content)
 * padding-left: 160px → espacio para StickyTimeline ~120px + margen
 * padding-top: espacio para StickyAvatar 80×96 + margen
 * ───────────────────────────────────────────────────────────── */
.ch3-layout {
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

.ch3-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-sm);
  align-items: flex-start;
}

.ch3-year {
  font-family: 'Lobster', Georgia, serif;
  font-size: 2rem;
  margin: 0;
  color: var(--c-accent);
}

.ch3-era {
  font-family: 'Lobster', Georgia, serif;
  font-size: 1.5rem;
  margin: 0;
  color: var(--c-fg);
}

.ch3-content {
  overflow-y: hidden;
  padding-right: var(--sp-md);
  /* Reservar espacio para ContactHUD bottom-right + safe area */
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
}

.ch3-bio p {
  font-family: Georgia, serif;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--c-fg);
  margin: 0 0 var(--sp-lg) 0;
}

.ch3-projects {
  display: flex;
  flex-direction: column;
  gap: var(--sp-md);
}

/* ─────────────────────────────────────────────────────────────
 * Mobile <600px — D3-09 stacked + D3-12 scroll interno permitido
 * padding-left: 60px → espacio StickyTimeline mobile year-only ~44px
 * height: auto → abandona 100dvh strict (D3-12)
 * .ch3-content overflow-y: auto → scroll-chaining nativo al snap shell externo
 * ───────────────────────────────────────────────────────────── */
@media (max-width: 599px) {
  .ch3-layout {
    grid-template-columns: 1fr;
    padding-left: 60px;
    padding-right: var(--sp-md);
    padding-top: calc(68px + var(--sp-sm));
    height: auto;
    overflow-y: visible;
  }

  .ch3-meta {
    flex-direction: row;
    align-items: center;
    margin-bottom: var(--sp-md);
  }

  .ch3-year {
    font-size: 1.5rem;
  }

  .ch3-era {
    font-size: 1.2rem;
  }

  .ch3-content {
    overflow-y: auto;
    /* D3-12: scroll interno hasta agotar height → browser propaga al outer snap shell */
    max-height: calc(100dvh - 200px - env(safe-area-inset-bottom, 0px));
  }
}
</style>
