<!--
  FlashSidebarNav.vue — Y2K cyber sidebar nav for ch2 (Phase 04.1).

  4 pill-buttons: HOME · ABOUT · WORK · CONTACT.
  Inline SVG wireframe-neon icons (no asset pipeline for 4 small icons).
  Estados: idle / hover (glow + scale 1.02) / active (filled lime) / down (compressed).
  v-model:active sincroniza con FlashStage para mostrar el panel correspondiente.
  i18n: labels via t('chapters.2.nav.{id}') con fallback hardcoded inglés (era-authentic).
-->
<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  active: { type: String, default: 'home' },
})
const emit = defineEmits(['update:active'])

const { t } = useI18n()

const items = [
  { id: 'home', fallback: 'HOME' },
  { id: 'about', fallback: 'ABOUT' },
  { id: 'work', fallback: 'WORK' },
  { id: 'contact', fallback: 'CONTACT' },
]

function label(item) {
  const key = `chapters.2.nav.${item.id}`
  const translated = t(key)
  return translated === key ? item.fallback : translated
}

function select(id) {
  if (id === props.active) return
  emit('update:active', id)
}
</script>

<template>
  <nav class="flash-nav" aria-label="Flash site sections">
    <ul class="flash-nav-list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="flash-nav-btn"
          :class="{ 'flash-nav-btn-active': active === item.id }"
          :aria-pressed="active === item.id"
          @click="select(item.id)"
        >
          <span class="flash-nav-icon" aria-hidden="true">
            <!-- HOME — house wireframe -->
            <svg v-if="item.id === 'home'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
              <path d="M3 11 L12 3 L21 11" />
              <path d="M5 10 L5 21 L19 21 L19 10" />
              <path d="M10 21 L10 14 L14 14 L14 21" />
            </svg>
            <!-- ABOUT — bust silhouette -->
            <svg v-else-if="item.id === 'about'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21 C4 16 7 13 12 13 C17 13 20 16 20 21" />
            </svg>
            <!-- WORK — folder wireframe -->
            <svg v-else-if="item.id === 'work'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
              <path d="M3 7 L9 7 L11 5 L21 5 L21 19 L3 19 Z" />
              <path d="M3 11 L21 11" />
            </svg>
            <!-- CONTACT — envelope wireframe -->
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
              <rect x="3" y="6" width="18" height="12" />
              <path d="M3 6 L12 14 L21 6" />
            </svg>
          </span>
          <span class="flash-nav-label">{{ label(item) }}</span>
        </button>
      </li>
    </ul>
    <div class="flash-nav-footer" aria-hidden="true">
      <span class="flash-nav-dot"></span>
      <span class="flash-nav-tech">SYS.ONLINE</span>
    </div>
  </nav>
</template>
