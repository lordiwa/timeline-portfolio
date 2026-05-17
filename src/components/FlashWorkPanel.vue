<!--
  FlashWorkPanel.vue — WORK panel for ch2 Y2K stage (Phase 04.1).
  Renders ch2 ProjectCards in grid. Preserves .ch2-projects selector (legacy tests T4).
-->
<script setup>
import { computed } from 'vue'
import { projects } from '@/data/projects'
import ProjectCard from './ProjectCard.vue'

const ch2Projects = computed(() => projects.filter((p) => p.chapterEra === 2))
</script>

<template>
  <div class="flash-panel flash-panel-work" data-panel="work">
    <header class="flash-panel-head">
      <h3 class="flash-panel-title">SELECTED.WORK</h3>
      <span class="flash-panel-meta">{{ ch2Projects.length.toString().padStart(2, '0') }} entries</span>
    </header>
    <div v-if="ch2Projects.length > 0" class="ch2-projects flash-work-grid">
      <ProjectCard
        v-for="project in ch2Projects"
        :key="project.id"
        :project="project"
      />
    </div>
  </div>
</template>
