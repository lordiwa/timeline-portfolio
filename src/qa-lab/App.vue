<script setup>
// Barra del lab (fuera del sitio generado) + sitio generado por semilla.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { generatePage } from './generator/index.js'
import { newSeed } from './generator/prng.js'
import { bugsFromSet } from './bugs/catalog.js'
import { LOCALES } from './i18n/index.js'
import SitePage from './components/SitePage.vue'

const props = defineProps({ initialSeed: { type: String, default: '' } })
const { t, locale } = useI18n()

const seed = ref(props.initialSeed || newSeed())
const page = computed(() => generatePage(seed.value))
// Misma fuente para los componentes (flags) y para el solucionario.
const bugSet = computed(() => new Set(page.value.bugs))
const revealed = ref(false)
const solution = computed(() => bugsFromSet(bugSet.value))

function syncUrl() {
  const url = new URL(window.location.href)
  url.searchParams.set('seed', seed.value)
  url.searchParams.set('lang', locale.value)
  window.history.replaceState(null, '', url)
  document.title = `${t('lab.title')} · ${seed.value}`
}
watch([seed, locale], syncUrl, { immediate: true })

function regenerate() {
  seed.value = newSeed()
  revealed.value = false
}
</script>

<template>
  <div class="lab">
    <header class="lab-bar">
      <strong class="lab-title">{{ t('lab.title') }}</strong>
      <span class="lab-seed">{{ t('lab.seed') }}: <code data-testid="seed">{{ seed }}</code></span>
      <button type="button" data-testid="new-page" @click="regenerate">{{ t('lab.newPage') }}</button>
      <label class="lab-lang">{{ t('lab.language') }}
        <select v-model="locale" data-testid="lang">
          <option v-for="l in LOCALES" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>
      <button type="button" data-testid="reveal" @click="revealed = !revealed">{{ revealed ? t('lab.hide') : t('lab.reveal') }}</button>
    </header>
    <p class="lab-meta">{{ t('lab.tagline') }}</p>

    <section v-if="revealed" class="lab-solution" data-testid="solution">
      <h2>{{ t('lab.bugsTitle') }}</h2>
      <p>{{ t('lab.bugsCount', { n: solution.length }) }} · {{ t('lab.template') }}: {{ t(`tplName.${page.templateId}`) }} · {{ t('lab.theme') }}: {{ t(`themeName.${page.themeId}`) }}</p>
      <ul>
        <li v-for="b in solution" :key="b.id" :data-bug-id="b.id">
          <code>{{ b.id }}</code>
          <em>{{ t(`lab.category.${b.category}`) }} · {{ t(`lab.difficulty.${b.difficulty}`) }}</em>
          <span>{{ b.description[locale] }}</span>
        </li>
      </ul>
    </section>

    <SitePage :key="seed" :page="page" :bug-set="bugSet" />
  </div>
</template>
