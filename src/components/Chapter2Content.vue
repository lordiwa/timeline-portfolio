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
-->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

const { t } = useI18n()

const chapter = chapters[2]
const ch2Projects = computed(() => projects.filter((p) => p.chapterEra === 2))
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))

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
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <!-- Desktop ≥600px: Y2K cyber stage full-bleed con sidebar + panels.
       Mobile <600px: notice modal + stacked accesible (CSS-gated via media query).
       .ch2-layout es el selector legacy preservado para tests T1. -->
  <div ref="stageRef" class="ch2-layout flash-y2k-root">
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
      <FlashMobileNotice />

      <!-- Reusa los mismos componentes para que el contenido sea idéntico al desktop -->
      <FlashBanner />

      <div class="ch2-content flash-y2k-mobile-stack">
        <div class="ch2-bio flash-y2k-mobile-bio">
          <p v-for="(para, idx) in bioParagraphs" :key="idx">{{ para }}</p>
        </div>

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
</style>
