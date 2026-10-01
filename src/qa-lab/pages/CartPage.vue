<script setup>
import { computed } from 'vue'
import { useSite } from '../composables/useSite.js'
import { computeTotals, fromMinor } from '../state/pricing.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'

const { site, content, t, store } = useSite()
const hasCheckout = site.pages.includes('checkout')
const lines = computed(() =>
  store.state.cart
    .map((l) => ({ ...l, item: content.value.items.find((i) => i.id === l.id) }))
    .filter((l) => l.item),
)
const totals = computed(() =>
  computeTotals({ lines: lines.value.map((l) => ({ price: l.item.price, qty: l.qty })), decimals: content.value.currency.decimals }),
)
const money = (minor) => content.value.money(fromMinor(minor, totals.value.decimals))

function onQty(l, e) {
  store.setQty(l.id, e.target.value)
  e.target.value = store.state.cart.find((x) => x.id === l.id)?.qty ?? 1 // refleja la cantidad ya acotada a 1..99
}
</script>

<template>
  <PageShell type="cart">
    <template v-if="lines.length">
      <div class="qa-table-wrap">
      <table class="qa-cart" data-testid="cart-table">
        <thead>
          <tr><th>{{ t('cart.item') }}</th><th>{{ t('cart.qty') }}</th><th>{{ t('cart.unit') }}</th><th>{{ t('cart.line') }}</th><th /></tr>
        </thead>
        <tbody>
          <tr v-for="l in lines" :key="l.id" data-testid="cart-line">
            <td>{{ l.item.name }}</td>
            <td><input type="number" min="1" max="99" :value="l.qty" :aria-label="`${t('cart.qty')}: ${l.item.name}`" @change="onQty(l, $event)" /></td>
            <td>{{ content.money(l.item.price) }}</td>
            <td data-testid="line-total">{{ content.money(l.item.price * l.qty) }}</td>
            <td><button type="button" class="qa-btn secondary" data-testid="remove-line" @click="store.removeFromCart(l.id)">{{ t('cart.remove') }}</button></td>
          </tr>
        </tbody>
      </table>
      </div>
      <div class="qa-totals">
        <div class="grand">{{ t('cart.subtotal') }}: <span data-testid="cart-subtotal">{{ money(totals.subtotal) }}</span></div>
      </div>
      <p v-if="hasCheckout"><a class="qa-btn qa-link-btn" :href="`#${routePath('checkout')}`" data-testid="go-checkout">{{ t('cart.goCheckout') }}</a></p>
    </template>
    <p v-else data-testid="cart-empty">{{ t('cart.empty') }} <a :href="`#${routePath('list')}`">{{ t('cart.shop') }}</a></p>
  </PageShell>
</template>
