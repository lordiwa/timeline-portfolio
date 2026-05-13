<!--
  ProjectCard.vue — Tarjeta reusable de proyecto (CON-02, D3-11).
  Recibe `project` prop completa (shape D3-03 locked) y renderiza el contenido.

  Decisiones de diseño:
  - NO tiene <style scoped> — los estilos viven en chapter-themes.css @layer components
    para que las CSS Custom Props del tema ch3 (--c-accent: #ff6699, --c-surface, etc.)
    apliquen via cascade sin re-declarar. Phase 4 puede extender variants por chapter.
  - T-CON-03: project.link external lleva rel="noopener noreferrer" + target="_blank"
    para prevenir open redirect / window.opener exploits.
  - Props opcionales (link, imageSrc, role, techStack, planet*) pueden ser null.
  - Fuente: D3-11 (skeumorphic Web 2.0) + RESEARCH Pattern 6 (líneas 558-615).
  - Requerimiento: CON-02 (proyectos Pink Parrot en ch3).
-->
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  project: {
    type: Object,
    required: true,
    validator: (p) =>
      typeof p === 'object' &&
      p !== null &&
      typeof p.id === 'string' &&
      typeof p.chapterEra === 'number' &&
      typeof p.titleKey === 'string' &&
      typeof p.descKey === 'string',
    // link, imageSrc, role, techStack, planet* pueden ser null
  },
})
</script>

<template>
  <article class="project-card">
    <h3 class="project-card-title">{{ t(props.project.titleKey) }}</h3>
    <p class="project-card-desc">{{ t(props.project.descKey) }}</p>
    <p v-if="props.project.role" class="project-card-role">{{ props.project.role }}</p>
    <ul v-if="props.project.techStack" class="project-card-tech">
      <li v-for="tech in props.project.techStack" :key="tech">{{ tech }}</li>
    </ul>
    <a
      v-if="props.project.link"
      :href="props.project.link"
      class="project-card-link"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`${t(props.project.titleKey)} — ${t('ui.openProject') || 'View project'}`"
    >
      {{ t('ui.openProject') || 'Ver proyecto →' }}
    </a>
  </article>
</template>
