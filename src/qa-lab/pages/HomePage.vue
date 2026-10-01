<script setup>
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'

const { site, content, t, store, toast } = useSite()
const c = computed(() => content.value)
const featured = computed(() => c.value.items.slice(0, 3))
const hasList = site.pages.includes('list')
const hasDetail = site.pages.includes('detail')
const hasCart = site.pages.includes('cart')
const others = site.pages.filter((p) => p !== 'home' && p !== 'detail' && p !== 'checkout')

function add(item) {
  if (store.addToCart(item.id)) toast(t('cart.added', { name: item.name }))
}
</script>

<template>
  <PageShell type="home">
    <p class="home-tagline">{{ c.tagline }}</p>
    <div v-if="hasList" class="qa-grid" style="--cols: 3">
      <article v-for="it in featured" :key="it.id" class="qa-card" data-testid="featured">
        <h3>
          <a v-if="hasDetail" :href="`#${routePath('detail', it.id)}`">{{ it.name }}</a>
          <template v-else>{{ it.name }}</template>
        </h3>
        <span class="qa-price">{{ c.money(it.price) }}</span>
        <button v-if="hasCart" type="button" class="qa-btn secondary" @click="add(it)">{{ t('cart.add') }}</button>
      </article>
    </div>
    <h2 class="home-sub">{{ t('home.explore') }}</h2>
    <ul class="home-links">
      <li v-for="p in others" :key="p"><a :href="`#${routePath(p)}`">{{ t(`pageName.${p}`) }}</a></li>
    </ul>
  </PageShell>
</template>
