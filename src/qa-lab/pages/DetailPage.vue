<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { clampQty } from '../state/store.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'

const { site, content, route, t, store, toast } = useSite()
const item = computed(() => content.value.items.find((i) => i.id === route.value.params.id))
const qty = ref(1)
const hasCart = site.pages.includes('cart')

function add() {
  qty.value = clampQty(qty.value) // cantidad siempre 1..99
  if (store.addToCart(item.value.id, qty.value)) toast(t('cart.added', { name: item.value.name }))
}
</script>

<template>
  <PageShell v-if="item" type="detail" :title="item.name">
    <p>{{ item.desc }}</p>
    <p>
      <span class="qa-badge">{{ content.categories[item.category] }}</span>
      <span class="qa-price" data-testid="detail-price"> {{ content.money(item.price) }}</span>
    </p>
    <div v-if="hasCart" class="qa-actions">
      <label class="qa-label" for="qa-detail-qty">{{ t('cart.qty') }}</label>
      <input id="qa-detail-qty" v-model.number="qty" type="number" min="1" max="99" class="qa-qty" />
      <button type="button" class="qa-btn" data-testid="add-to-cart" @click="add">{{ t('cart.add') }}</button>
    </div>
    <p><a :href="`#${routePath('list')}`">{{ t('detail.back') }}</a></p>
  </PageShell>
</template>
