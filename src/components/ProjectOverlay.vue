<!--
  ProjectOverlay.vue — STUB minimal Phase 5 W3 (Plan 05-04).

  Propósito único: permitir render end-to-end de Chapter6Content sin crash mientras
  W4 implementa la versión synthwave completa con glass + focus trap + ESC.

  Contrato API actual (locked para W4):
    - Props: { projectId: String (required) }
    - Emits: ['close']
    - Comportamiento mínimo: section role="dialog" + close button + emit('close')
      en click del backdrop o close button.

  W4 reemplazará el template completo manteniendo este API (props + emits),
  añadiendo: backdrop blur, neon glow, focus trap, ESC keydown, project content,
  PRM-aware animation, mobile fullscreen.
-->
<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  projectId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
</script>

<template>
  <section
    role="dialog"
    aria-modal="true"
    class="project-overlay"
    @click="emit('close')"
  >
    <button
      type="button"
      class="project-overlay__close"
      :aria-label="t('ui.closeOverlay')"
      @click.stop="emit('close')"
    >×</button>
    <p class="project-overlay__stub">
      STUB · W4 replaces · projectId: {{ projectId }}
    </p>
  </section>
</template>

<style scoped>
/* Stub mínimo — W4 reemplaza con synthwave glass + neon glow. */
.project-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 14, 61, 0.7);
  color: #c0e0ff;
  font-family: 'Audiowide', sans-serif;
}

.project-overlay__close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: 1px solid #4dffff;
  color: #4dffff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.4rem;
  cursor: pointer;
}

.project-overlay__stub {
  font-size: 1rem;
  padding: var(--sp-md, 16px);
  border: 1px dashed #4dffff;
  background: rgba(10, 6, 31, 0.6);
}
</style>
