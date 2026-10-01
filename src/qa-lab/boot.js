// Arranque del QA Lab: la URL es la fuente de verdad (?seed=x&level=y&lang=z#/ruta).
// main.js lo llama; los tests tambien, para pasar por el parseo real de la URL.
import { createApp } from 'vue'
import App from './App.vue'
import { createLabI18n, detectLocale } from './i18n/index.js'

export function readParams(search) {
  const p = new URLSearchParams(search)
  return { seed: p.get('seed') || '', level: p.get('level') || '' }
}

export function mountLab(el, win = window) {
  const { seed, level } = readParams(win.location.search)
  const i18n = createLabI18n(detectLocale(win.location.search, win.navigator.language))
  const app = createApp(App, { initialSeed: seed, initialLevel: level })
  app.use(i18n)
  app.mount(el)
  return app
}
