<script setup>
// Barra del lab (fuera del sitio generado) + sitio multi-pagina por (semilla, nivel).
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { generateSite } from './generator/site.js'
import { LEVELS, normalizeLevel } from './generator/levels.js'
import { concretePath } from './generator/pages.js'
import { newSeed } from './generator/prng.js'
import { BUG_BY_ID } from './bugs/catalog.js'
import { bugLocation } from './bugs/locations.js'
import { LOCALES } from './i18n/index.js'
import { readParams } from './boot.js'
import SiteRoot from './components/SiteRoot.vue'

const props = defineProps({ initialSeed: { type: String, default: '' }, initialLevel: { type: String, default: '' } })
const { t, locale } = useI18n()

const seed = ref(props.initialSeed || newSeed())
const level = ref(normalizeLevel(props.initialLevel))
const bugWhere = (b) => {
  const w = bugLocation(site.value, b.id)
  return w ? t(w.key, { n: w.n, step: w.stepKey ? t(w.stepKey) : '' }) : ''
}
const site = computed(() => generateSite(seed.value, level.value))
const revealed = ref(false)
// Solucionario: los bugs activos (misma fuente que los flags) + la pagina donde se manifiesta cada uno.
const solution = computed(() =>
  site.value.bugs.map((id) => {
    const page = site.value.bugPages[id]
    return { ...BUG_BY_ID[id], page, path: concretePath(site.value, page) }
  }),
)

function syncUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed.value)
  url.searchParams.set('level', level.value)
  url.searchParams.set('lang', locale.value)
  window.history.replaceState(null, '', url) // conserva el #/ruta actual (el titulo lo pone cada pagina del sitio)
}
watch([seed, level, locale], syncUrl, { immediate: true })

/**
 * La URL es la fuente de verdad. Cambiar el nivel o pedir una pagina nueva APILA una entrada (pushState)
 * con la URL completa y el hash en #/: asi 'atras' vuelve exactamente al sitio anterior.
 */
function pushSite(nextSeed, nextLevel) {
  const url = new URL(window.location.href)
  url.searchParams.set('seed', nextSeed)
  url.searchParams.set('level', nextLevel)
  url.searchParams.set('lang', locale.value)
  url.hash = '#/'
  window.history.pushState(null, '', url)
  seed.value = nextSeed
  level.value = nextLevel
  revealed.value = false
}
const regenerate = () => pushSite(newSeed(), level.value)
const setLevel = (e) => pushSite(seed.value, normalizeLevel(e.target.value))

/** Atras / adelante: se re-derivan seed y level de la URL y el sitio se regenera si cambiaron. */
function syncFromUrl() {
  const p = readParams(window.location.search)
  const lv = normalizeLevel(p.level)
  if ((p.seed && p.seed !== seed.value) || lv !== level.value) {
    if (p.seed) seed.value = p.seed
    level.value = lv
    revealed.value = false
  }
}
window.addEventListener('popstate', syncFromUrl)
window.addEventListener('hashchange', syncFromUrl)
onBeforeUnmount(() => {
  window.removeEventListener('popstate', syncFromUrl)
  window.removeEventListener('hashchange', syncFromUrl)
})
</script>

<template>
  <div class="lab">
    <header class="lab-bar">
      <strong class="lab-title">{{ t('lab.title') }}</strong>
      <span class="lab-seed">{{ t('lab.seed') }}: <code data-testid="seed">{{ seed }}</code></span>
      <label>{{ t('lab.level') }}
        <select :value="level" data-testid="level" @change="setLevel">
          <option v-for="l in LEVELS" :key="l" :value="l">{{ t(`lab.levels.${l}`) }}</option>
        </select>
      </label>
      <button type="button" data-testid="new-page" @click="regenerate">{{ t('lab.newPage') }}</button>
      <label class="lab-lang">{{ t('lab.language') }}
        <select v-model="locale" data-testid="lang">
          <option v-for="l in LOCALES" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
      <button type="button" data-testid="reveal" @click="revealed = !revealed">{{ revealed ? t('lab.hide') : t('lab.reveal') }}</button>
    </header>
    <p class="lab-meta">{{ t('lab.tagline') }} {{ t('lab.cartNote') }}</p>

    <section v-if="revealed" class="lab-solution" data-testid="solution">
      <h2>{{ t('lab.bugsTitle') }}</h2>
      <p>{{ t('lab.bugsCount', { n: solution.length }) }} · {{ t('lab.theme') }}: {{ t(`themeName.${site.themeId}`) }} · {{ t('lab.level') }}: {{ t(`lab.levels.${level}`) }}</p>
      <p class="lab-pages" data-testid="site-pages">{{ t('lab.pageList', { n: site.pages.length }) }}: {{ site.pages.map((p) => t(`pageName.${p}`)).join(', ') }}</p>
      <p v-if="!solution.length">{{ t('lab.noBugs') }}</p>
      <ul>
        <li v-for="b in solution" :key="b.id" :data-bug-id="b.id" :data-bug-page="b.page">
          <code>{{ b.id }}</code>
          <em>{{ t(`lab.category.${b.category}`) }} · {{ t(`lab.difficulty.${b.difficulty}`) }}</em>
          <span>{{ b.description[locale] }}</span>
          <small v-if="bugWhere(b)" class="lab-where" data-testid="bug-where">{{ bugWhere(b) }}</small>
          <a :href="`#${b.path}`" data-testid="bug-link">{{ t('lab.page') }}: {{ t(`pageName.${b.page}`) }} (#{{ b.path }})</a>
        </li>
      </ul>
    </section>

    <SiteRoot :key="`${seed}|${level}`" :site="site" />
  </div>
</template>
