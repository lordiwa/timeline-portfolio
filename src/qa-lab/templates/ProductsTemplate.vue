<script setup>
import { computed, ref } from 'vue'
import { useLab } from '../composables/useLab.js'
import { useListing } from '../composables/useForm.js'
import PageShell from '../components/PageShell.vue'
import Pager from '../components/Pager.vue'
import Dropdown from '../components/Dropdown.vue'
import Modal from '../components/Modal.vue'

const { page, has, t, tt } = useLab()
const c = page.content
const name = (r) => `${tt(`item${r.itemIdx}`)} ${r.variant}`
const L = useListing(c.rows, { pageSize: c.pageSize, match: (r, q) => !q || name(r).toLowerCase().includes(q) }, has)
const sortItems = computed(() => [
  { id: 'default', label: t('list.sortDefault') },
  { id: 'priceAsc', label: t('list.sortPriceAsc') },
  { id: 'priceDesc', label: t('list.sortPriceDesc') },
])
const detail = ref(null)
const unlabeled = computed(() => has('missing-label') && c.labelTarget === 'search') // BUG missing-label
const searchTab = computed(() => (has('tab-order') ? 3 : undefined)) // BUG tab-order

const setCat = (e) => { L.cat.value = e.target.value; L.resetPage() }
const setSearch = (e) => { L.search.value = e.target.value; L.resetPage() }
</script>

<template>
  <PageShell tpl-id="products">
    <div class="qa-toolbar-row">
      <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
      <input id="qa-search" type="search" :value="L.search.value" :placeholder="unlabeled ? t('fields.search') : ''" :tabindex="searchTab" @input="setSearch" />
      <select :value="L.cat.value" :aria-label="t('list.allCats')" @change="setCat">
        <option value="">{{ t('list.allCats') }}</option>
        <option v-for="i in 3" :key="i" :value="String(i - 1)">{{ tt(`cat${i - 1}`) }}</option>
      </select>
      <Dropdown :label="t('list.sortBy')" :items="sortItems" class="on-light" @select="(id) => { L.sort.value = id; L.resetPage() }" />
      <button type="button" class="qa-btn secondary" @click="L.clear()">{{ t('list.clear') }}</button>
    </div>
    <div class="qa-grid" :style="{ '--cols': c.cols }">
      <article v-for="r in L.pageRows()" :key="r.id" class="qa-card">
        <h3>{{ name(r) }}</h3>
        <span class="qa-badge">{{ tt(`cat${r.cat}`) }}</span>
        <span class="qa-price">{{ r.price.toFixed(2) }}</span>
        <button type="button" class="qa-btn secondary" @click="detail = r">{{ t('list.details') }}</button>
      </article>
    </div>
    <p v-if="!L.filtered().length" class="qa-hint">{{ t('list.empty') }}</p>
    <Pager v-model:page="L.page.value" :pages="L.pages()" :skip-at="c.skipAt" />
    <Modal :open="!!detail" :title="detail ? name(detail) : ''" @close="detail = null">
      <p v-if="detail">{{ t('list.price') }}: {{ detail.price.toFixed(2) }} · {{ tt(`cat${detail.cat}`) }}</p>
    </Modal>
  </PageShell>
</template>
