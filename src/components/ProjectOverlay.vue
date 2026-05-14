<!--
  ProjectOverlay.vue — Modal Vue synthwave ch6 (Phase 5 W4 / Plan 05-05).

  Reemplaza el stub W3 (Plan 05-04). API contract intacto:
    - Props: { projectId: String (required) }
    - Emits: ['close']

  Specs D5-07 (synthwave neon-glow distinto a ProjectCard / FloatingPanel):
    - role="dialog" aria-modal="true" + aria-labelledby al h2 cuando project existe.
    - Backdrop blur deep purple #1a0e3d (con progressive enhancement @supports
      backdrop-filter en chapter-themes.css; aquí solo la marca .project-overlay).
    - Card border cyan #4dffff + double box-shadow glow (cyan + hot pink #ff3ca6).
    - Close button "×" SIEMPRE presente — primer focusable + único focusable garantizado
      incluso cuando project es undefined (Warning 9 RESOLVED). aria-label="Cerrar"
      via t('ui.closeOverlay') i18nificado.
    - Link "Ver proyecto →" v-if=project.link, target="_blank" rel="noopener noreferrer"
      (T-05-W4-02 tabnabbing mitigation).
    - Mobile fullscreen + PRM instant: reglas CSS en chapter-themes.css (Task 2).

  Comportamiento UX (cierra el modal):
    - ESC key → emit('close'): document.addEventListener('keydown', handleKeydown).
    - Click en backdrop (root .project-overlay, no en el card) → emit('close'):
      handleBackdropClick valida e.target === overlayRef.value.
    - Click en close button → emit('close').

  A11Y focus management (D5-07 + A11Y-02):
    - onMounted captura lastFocusedEl = document.activeElement (el sr-only planet
      button trigger que abrió el modal).
    - setTimeout 0 + closeBtnRef.value?.focus() — foca el close button al abrir.
    - onBeforeUnmount restore focus a lastFocusedEl → el screen-reader / keyboard
      user vuelve al planet button.
    - Focus trap manual (RESOLVED Open Q3, Don't Hand-Roll §10): ~30 LOC
      querySelectorAll + first/last cycle. NO @vueuse/integrations useFocusTrap
      (peer dep focus-trap ~8KB; scope es 3-5 focusables, no complex tab order).

  Null guard (Warning 9 RESOLVED — threat T-05-W4-01):
    - computed project = projects.find(p => p.id === props.projectId)
    - Template wrapper <template v-if="project">...</template> envuelve title/year/
      role/techStack/desc/link. Si project es undefined, solo shell (backdrop +
      close button) — ESC/click-outside/close button siguen funcionando.
    - Test T6 verifica mount con projectId="ch6-nonexistent" → no crash + no .project-overlay__title.

  Source-of-truth: 05-RESEARCH.md §Pattern 10 (líneas 940-1059) verbatim + null guard
  + ajustes mínimos para tests.
-->
<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  inject,
  useTemplateRef,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { projects } from '@/data/projects'

const props = defineProps({
  projectId: { type: String, required: true },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
// prm inject — defensive (no se usa en JS aquí, PRM se aplica via @media en CSS
// chapter-themes.css Task 2). Mantener el inject documenta el contrato establecido
// por App.vue (Phase 1) y permite extension futura (e.g. saltar setTimeout focus
// si fuera molesto bajo PRM — no es el caso actual).
const _prm = inject('prm', null)

// Null guard mandatory (Warning 9 RESOLVED — threat T-05-W4-01):
// projects.find puede retornar undefined si projectId no matchea ningún item.
// Template usa v-if="project" sobre el card content para tolerar.
const project = computed(() =>
  projects.find((p) => p.id === props.projectId),
)

const overlayRef = useTemplateRef('overlay')
const closeBtnRef = useTemplateRef('closeBtn')
// lastFocusedEl: variable local (NO ref) — capturada onMounted, restaurada
// onBeforeUnmount. Scope component-local; se descarta al unmount (T-05-W4-06).
let lastFocusedEl = null

// === ESC closes + Tab cycles (focus trap) ===
function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'Tab') {
    trapTab(e)
  }
}

/**
 * Focus trap manual (RESEARCH §Pattern 10 lines 979-995).
 *
 * Decision (Open Q3 RESOLVED — Don't Hand-Roll §10):
 *   Manual ~30 LOC chosen over @vueuse/integrations useFocusTrap.
 *   Rationale: peer dep `focus-trap` ~8KB para un scope de 3-5 focusables
 *   con tab order trivial es desbalanceado. Manual es leaner, sin dep nueva,
 *   y el código ya está documentado en RESEARCH verbatim.
 *
 * Tab desde último focusable  → first.focus() + preventDefault.
 * Shift+Tab desde primero     → last.focus() + preventDefault.
 *
 * Si solo hay 1 focusable (project sin link), Tab/Shift+Tab no-op (no cycle).
 */
function trapTab(e) {
  if (!overlayRef.value) return
  const focusables = overlayRef.value.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (focusables.length === 0) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

// === Click-outside backdrop closes (D5-07) ===
// Validar e.target === overlayRef.value para NO cerrar cuando el click ocurre
// dentro del card o sus children (event bubbling). El backdrop es el root
// .project-overlay; el card es .project-overlay__card child.
function handleBackdropClick(e) {
  if (e.target === overlayRef.value) {
    emit('close')
  }
}

onMounted(() => {
  // T-05-W4-04 mitigation: addEventListener pareado con remove en onBeforeUnmount.
  document.addEventListener('keydown', handleKeydown)

  // A11Y focus management:
  //   1. Remember who opened us (sr-only planet button trigger desde Chapter6Content).
  //   2. Focus close button como primer focusable visible — setTimeout 0 garantiza
  //      que el DOM ya está mounted + el closeBtnRef wired.
  lastFocusedEl = document.activeElement
  setTimeout(() => closeBtnRef.value?.focus(), 0)
})

onBeforeUnmount(() => {
  // T-05-W4-04: cleanup listener — evita leak global keydown si el component se
  // desmonta (e.g. activeProject = null por bridge o nav).
  document.removeEventListener('keydown', handleKeydown)
  // Restore focus al planet button que abrió el modal (D5-07 A11Y contract).
  // Optional chaining defensive — lastFocusedEl podría ser null en edge cases
  // (test mount sin pre-focus). focus() en HTMLElement es safe (no throws).
  lastFocusedEl?.focus()
})
</script>

<template>
  <div
    ref="overlay"
    class="project-overlay"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="project ? `project-${projectId}-title` : null"
    @click="handleBackdropClick"
  >
    <!-- Root .project-overlay = backdrop. aria-labelledby binding solo cuando
         project existe (el h2 con matching id vive dentro del v-if=project).
         Click handler valida target === root para distinguir backdrop vs card. -->
    <article class="project-overlay__card">
      <button
        ref="closeBtn"
        type="button"
        class="project-overlay__close"
        :aria-label="t('ui.closeOverlay')"
        @click="emit('close')"
      >
        <!-- Close button SIEMPRE presente (fuera del v-if=project) — garantiza
             al menos 1 focusable + UX de cerrar incluso con projectId inválido
             (Warning 9 RESOLVED). -->
        <span aria-hidden="true">×</span>
      </button>

      <template v-if="project">
        <!-- Null guard wrapper (threat T-05-W4-01 mitigation):
             si project es undefined, template renderea solo el shell — no se
             accede a project.titleKey/descKey/year/role/techStack/link (que serían
             undefined access + crash). Test T6 valida mount con 'ch6-nonexistent'. -->
        <h2
          :id="`project-${projectId}-title`"
          class="project-overlay__title"
        >
          {{ t(project.titleKey) }}
        </h2>
        <p class="project-overlay__year">{{ project.year }}</p>
        <p class="project-overlay__role">{{ project.role }}</p>
        <ul class="project-overlay__tech">
          <li v-for="tech in project.techStack" :key="tech">{{ tech }}</li>
        </ul>
        <p class="project-overlay__desc">{{ t(project.descKey) }}</p>
        <a
          v-if="project.link"
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
          class="project-overlay__link"
        >
          <!-- Link externo opcional. target="_blank" REQUIERE
               rel="noopener noreferrer" (threat T-05-W4-02 tabnabbing —
               window.opener attack vector). Test T5 source-regex valida. -->
          {{ t('ui.openProject') }}
        </a>
      </template>
    </article>
  </div>
</template>

<style scoped>
/*
 * Estilo mínimo local — el resto vive en src/styles/chapter-themes.css
 * @layer components (Task 2 del Plan 05-05): backdrop blur + card glow doble +
 * mobile fullscreen + PRM no-animation + close/title/tech/link variants.
 *
 * Aquí sólo dejamos vacío para mantener la separación de concerns
 * (component = behavior + structure; theme CSS = visual styling).
 */
</style>
