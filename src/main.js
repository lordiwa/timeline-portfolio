import { createApp } from 'vue'
import { createHead } from '@unhead/vue'
import App from './App.vue'
import { i18n } from './i18n'

// Fonts self-hosted (W4) — @fontsource packages auto-wire @font-face declarations
// + bundle woff2 assets via Vite. ch2 (Verdana/Trebuchet MS) usa system-safe
// stack — NO requiere import. D2-07 + D2-08 + RESEARCH §R4.
// Subsets: latin + latin-ext — cubre ES/EN (ñ, á, é, í, ó, ú, ü, ¿, ¡; Open-Q2-E).
// Bundle target: 150-350 KB (D2-08). No se incluyen cyrillic/greek (fuera de scope).
import '@fontsource/vt323/latin.css'              // ch0 — CRT terminal (latin)
import '@fontsource/vt323/latin-ext.css'          // ch0 — latin-ext (ñ, á, etc.)
import '@fontsource/comic-neue'                   // ch1 — Comic Sans equivalent (solo latin disponible)
// Roboto ELIMINADO 2026-06-01 (bundle fix): importaba 4 pesos × 8 idiomas (~453KB en .woff2)
// y solo se usaba en .ch3-hint-cta (un hint italic). Reemplazado por Inter Variable (ya cargado
// para ch5). Bajó el bundle de 782KB → ~329KB. Ver STATE.md "Real State Audit".
// Open Sans (TASK-009, ronda de corrección): fuente auténtica de 2013 que fija
// la spec §5 (.planning/design/03-ch3-muerte-de-flash.md). Reemplaza a Lobster
// (retirado — la medición en Chrome real de la ronda anterior sobreestimó su
// peso en ~40 KB y subestimó falsamente el nivel de uso real: ningún capítulo
// renderiza Lobster hoy, ch2/ch3/ch5 la pisan con su propio font-family y ch4
// no usa ProjectCard). Solo subset `latin` (Latin-1 Supplement, U+0000-00FF):
// cubre ñ/á/é/í/ó/ú/ü/¿/¡ (Open-Q2-E) — `latin-ext` en Google Fonts es
// Extended-A/B (checo/polaco/turco/vietnamita), fuera de alcance ES/EN. 4
// pesos únicamente (300/400/600/700, spec §5) — nada de variable font (2013
// no tenía variable fonts, prohibido explícitamente por la spec).
import '@fontsource/open-sans/latin-300.css'
import '@fontsource/open-sans/latin-400.css'
import '@fontsource/open-sans/latin-600.css'
import '@fontsource/open-sans/latin-700.css'
import '@fontsource/audiowide/latin.css'          // ch4 — AR/VR futuristic (latin)
import '@fontsource/audiowide/latin-ext.css'      // ch4 — latin-ext (ñ, á, etc.)
import './styles/inter-variable-latin.css'        // ch5 — Inter Variable latin+latin-ext (wght 100-900)
import '@fontsource/press-start-2p/latin.css'     // ch6 — Phaser pixel UI (latin)
import '@fontsource/press-start-2p/latin-ext.css' // ch6 — latin-ext (ñ, á, etc.)
// Cinzel + Cinzel Decorative ELIMINADOS (TASK-008, AC#4): el título "La muerte
// de Flash" cayó a su fallback CSS hasta que TASK-009 (rediseño ch3) reemplazó
// --font-body por Open Sans (arriba) — ver eras.css bloque [data-chapter="3"].

import './styles/tokens.css'             // TASK-008: tokens invariantes + @property + @layer order
import './styles/eras.css'               // TASK-008: 7 bloques de era, doble scope (reemplaza chapter-themes.css)
import './styles/chassis.css'            // TASK-008: identidad RAFAEL-OS del chasis compartido
import './styles/chapter-components.css' // TASK-008: CSS de componentes de capítulo (staging, ver header del archivo)

const app = createApp(App)
const head = createHead()
app.use(i18n)
app.use(head)

// Handler global de errores — nombra el componente y el hook que fallaron.
// Sin esto, en producción un error de render es un stack minificado anónimo
// (diagnóstico crash pantalla-negra 2026-07-10).
app.config.errorHandler = (err, instance, info) => {
  const name =
    instance?.$?.type?.__name ||
    instance?.$?.type?.name ||
    instance?.$options?.__file ||
    'componente-desconocido'
  console.error(`[app-error] componente=${name} hook=${info}`, err)
}

app.mount('#app')
