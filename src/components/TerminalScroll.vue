<!--
  TerminalScroll.vue — Era-signature component ch0 (Terminal 1995).

  CSS-only CRT terminal con cursor parpadeante. Líneas reveladas con staggered
  animation-delay para efecto de "escritura" sin JS typing per-char.

  PRM: sin JS inject('prm') — 100% CSS via @media (prefers-reduced-motion: reduce).
  ART-07: cero pixel art — 100% CSS.
  D4-10a: cursor parpadeante → animation: none bajo PRM.

  Tokens CSS heredados del [data-chapter="0"] cascade:
  - --c-fg: #00ff41 (phosphor green)
  - --c-bg: #000000 (CRT black)
  - --font-body: 'VT323', ui-monospace, monospace (self-hosted Phase 2 W4)
-->
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 4 líneas del terminal con staggered animation-delay para reveal secuencial.
// Keys i18n Phase 4: chapters.0.terminal.{line1..line4}.
const lines = [
  { key: 'chapters.0.terminal.line1', delay: 0 },
  { key: 'chapters.0.terminal.line2', delay: 1.5 },
  { key: 'chapters.0.terminal.line3', delay: 3 },
  { key: 'chapters.0.terminal.line4', delay: 4.5 },
]
</script>

<template>
  <div class="terminal-scroll" role="presentation">
    <pre class="terminal-output"
      ><span
        v-for="(line, idx) in lines"
        :key="idx"
        class="terminal-line"
        :style="{ animationDelay: line.delay + 's' }"
      >{{ t(line.key) }}</span
      ><span class="terminal-cursor" aria-hidden="true">█</span></pre>
  </div>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────
 * TerminalScroll — CRT monochrome terminal, era ch0 (1995)
 * Tokens via cascade [data-chapter="0"]: --c-fg #00ff41, --c-bg #000000
 * Font: 'VT323' ya self-hosted Phase 2 W4 (declarado en [data-chapter="0"])
 * ───────────────────────────────────────────────────────────────────────── */
.terminal-scroll {
  font-family: 'VT323', ui-monospace, monospace;
  color: var(--c-fg);
  background: var(--c-bg);
  padding: var(--sp-lg);
  border: 1px solid var(--c-border);
  border-radius: 4px;
}

.terminal-output {
  font-size: clamp(1rem, 2vw, 1.4rem);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Cada línea arranca en opacity: 0 y hace reveal via terminal-reveal keyframe.
   El animation-delay se aplica inline desde el script (staggered). */
.terminal-line {
  display: block;
  opacity: 0;
  animation: terminal-reveal 0.4s steps(20, end) forwards;
}

/* Cursor CRT cuadrado — blink con steps(2) para look bloque clásico */
.terminal-cursor {
  display: inline-block;
  animation: terminal-cursor-blink 1s steps(2) infinite;
}

/* ─────────────────────────────────────────────────────────────────────────
 * @keyframes terminal-reveal — staggered fade-in de cada línea
 * ───────────────────────────────────────────────────────────────────────── */
@keyframes terminal-reveal {
  to { opacity: 1; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * @keyframes terminal-cursor-blink — parpadeo tipo CRT con steps(2)
 * (no ease, no linear — el bloque CRT real es on/off, no fade)
 * ───────────────────────────────────────────────────────────────────────── */
@keyframes terminal-cursor-blink {
  50% { opacity: 0; }
}

/* ─────────────────────────────────────────────────────────────────────────
 * D4-10a PRM branch — sin parpadeo, reveal instantáneo
 * CSS-only: no necesita inject('prm') porque no hay JS state que controlar
 * ───────────────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .terminal-line {
    opacity: 1;
    animation: none;
  }
  .terminal-cursor {
    animation: none;
    opacity: 1;
  }
}
</style>
