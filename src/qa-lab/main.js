// Entrada del QA Lab (segunda entrada de Vite). No importa nada del portafolio.
import { createApp } from 'vue'
import App from './App.vue'
import { createLabI18n, detectLocale } from './i18n/index.js'
import './styles/lab.css'
import './styles/site.css'

const params = new URLSearchParams(window.location.search)
const i18n = createLabI18n(detectLocale(window.location.search, navigator.language))

createApp(App, { initialSeed: params.get('seed') || '', initialLevel: params.get('level') || '' })
  .use(i18n)
  .mount('#app')
