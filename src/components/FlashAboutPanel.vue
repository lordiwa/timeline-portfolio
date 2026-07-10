<!--
  FlashAboutPanel.vue — ABOUT panel for ch2 Y2K stage (Phase 04.1 · iter2 2026-07-09).

  iter2 (Rafael): "hacemos más protagónico el about mostrando la guerra de Flash
  contra Apple". La guerra (ch2-flash-war.png) pasa de figura pequeña bajo el texto
  a ESCENARIO full-bleed del panel, con meteoros y relámpagos CSS encima. La bio se
  re-presenta como PARTES DE GUERRA (transmisiones militares Y2K) sobre paneles
  oscuros legibles, y el bust queda como retrato de comandante. El copy fino se
  trabajará con Rafael (sesión de copy pendiente) — el contenido es la bio intacta.

  Foreshadowing de ch3: aquí Flash está sano liderando la horda; en ch3 ves su
  tumba a través del browser muerto.

  Preserva .ch2-bio selector (legacy tests T3). Estilos en chapter-themes.css.
-->
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chapters } from '@/data/chapters'
import { bio } from '@/data/bio'

const { t } = useI18n()
const chapter = chapters[2]
const bioParagraphs = computed(() => t(bio.eras[chapter.id].textKey).split('\n\n'))
// Dynamic binding (avoids vite-plugin-vue transformAssetUrls trying to resolve the
// /assets/ path at compile-time → it's a public/ runtime URL).
const bustSrc = '/assets/ch2-bust.png'
const warSrc = '/assets/ch2-flash-war.png'

// Meteoros CSS sobre la batalla — pos/timing estáticos (PRM los apaga vía @media)
const meteors = [
  { left: '18%', delay: '0s',   dur: '7s'  },
  { left: '46%', delay: '2.8s', dur: '9s'  },
  { left: '71%', delay: '5.2s', dur: '8s'  },
  { left: '88%', delay: '1.4s', dur: '11s' },
]
</script>

<template>
  <div class="flash-panel flash-panel-about" data-panel="about">
    <!-- La gran guerra: escenario full-bleed detrás de las transmisiones -->
    <div class="flash-war-stage" aria-hidden="true">
      <img :src="warSrc" alt="" class="flash-war-bg" />
      <span
        v-for="(m, i) in meteors"
        :key="`meteor-${i}`"
        class="flash-war-meteor"
        :style="{ left: m.left, '--mt-delay': m.delay, '--mt-dur': m.dur }"
      ></span>
      <div class="flash-war-lightning"></div>
      <div class="flash-war-burn"></div>
      <div class="flash-war-scrim"></div>
    </div>

    <div class="flash-about-grid">
      <figure class="flash-about-frame" aria-hidden="true">
        <img :src="bustSrc" alt="" class="flash-about-bust" />
        <figcaption class="flash-about-caption">ID:RM_2009 · CMDR</figcaption>
      </figure>

      <!-- Bio como partes de guerra (.ch2-bio preservado — tests T3) -->
      <div class="ch2-bio flash-about-bio">
        <article
          v-for="(para, idx) in bioParagraphs"
          :key="idx"
          class="flash-dispatch"
        >
          <p class="flash-dispatch-head" aria-hidden="true">
            &gt;&gt; {{ t('ui.warDispatch') }} {{ String(idx + 1).padStart(2, '0') }} // {{ chapter.year }} // SIGNAL:OK
          </p>
          <p>{{ para }}</p>
        </article>
      </div>
    </div>

    <!-- Leyenda de la batalla al pie -->
    <p class="flash-war-cap" aria-hidden="true">{{ t('ui.flashWar') }}</p>
  </div>
</template>
