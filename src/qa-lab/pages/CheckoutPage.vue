<script setup>
// Checkout de 4 pasos: datos -> envio y cupon -> pago -> confirmacion.
// Totales: computeTotals() (descuento sobre subtotal, impuesto sobre la base sin envio). Ver state/pricing.js.
import { computed, reactive, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useForm } from '../composables/useForm.js'
import { computeTotals, fromMinor, SHIPPING_METHODS } from '../state/pricing.js'
import { routePath } from '../generator/pages.js'
import PageShell from '../ui/PageShell.vue'
import FormField from '../ui/FormField.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'
import ErrorBanner from '../ui/ErrorBanner.vue'

const { site, content, has, nthHit, t, store, toast, env } = useSite()
const serverError = ref(false)
const STEPS = ['data', 'shipping', 'payment', 'done']
const stepKeys = { data: ['name', 'email', 'address', 'city'], shipping: site.data.checkoutExtras, payment: ['card'] }
const allKeys = Object.values(stepKeys).flat()

const { values, errors, validateField, validate } = useForm(allKeys.map((k) => content.value.generic(k)), has, env.clock)
if (store.state.user) { values.name = store.state.user.name; values.email = store.state.user.email } // datos de la sesion

const step = ref(0)
const stepId = computed(() => STEPS[step.value])
const stepFields = computed(() => (stepKeys[stepId.value] || []).map((k) => content.value.generic(k)))
const method = ref('standard')
const couponInput = ref('')
const couponError = ref('')
const order = ref(null)
const placing = ref(false)

const lines = computed(() =>
  store.state.cart
    .map((l) => ({ id: l.id, qty: l.qty, price: content.value.items.find((i) => i.id === l.id)?.price, name: content.value.items.find((i) => i.id === l.id)?.name }))
    .filter((l) => l.price != null),
)
const totals = computed(() =>
  computeTotals({
    lines: lines.value,
    couponPct: store.state.coupon ? site.data.coupon.pct : 0,
    shippingCost: site.data.shipping[method.value],
    taxRate: site.data.taxRate,
    decimals: content.value.currency.decimals,
    firstLineIgnoresQty: has('total-wrong'), // BUG total-wrong: ignora la cantidad de la primera linea
    taxPerLine: has('tax-rounding-per-line'), // BUG tax-rounding-per-line: descuento e impuesto redondeados linea por linea
  }),
)
const money = (minor, d = content.value.currency.decimals) => content.value.money(fromMinor(minor, d))

function applyCoupon() {
  const r = store.applyCoupon(couponInput.value)
  couponError.value = r.ok ? '' : r.error
  if (r.ok) couponInput.value = ''
}

function next() {
  if (!validate(stepFields.value)) return
  step.value += 1
}

/** Dia del pedido (YYYY-MM-DD): el dia civil del USUARIO (la zona simulada del sitio solo la usan los bugs de fecha). */
const orderDate = () => env.clock.viewerToday()

function place() {
  if (!validate(stepFields.value) || placing.value || !lines.value.length) return
  // BUG nth-submit-server-error: el N-esimo envio valido responde 500 (los datos y el carrito se conservan).
  serverError.value = nthHit('nth-submit-server-error')
  if (serverError.value) return
  store.bump('submit')
  const payload = {
    lines: lines.value.map((l) => ({ ...l })),
    totals: { ...totals.value },
    shipping: method.value,
    customer: { name: values.name, email: values.email },
    date: orderDate(),
  }
  const done = (o) => {
    order.value = o
    toast(t('checkout.placed'))
    step.value = STEPS.indexOf('done')
  }
  if (has('place-order-twice')) {
    // BUG place-order-twice: la confirmacion es asincrona y no hay guarda: cada click registra su propio pedido.
    env.latency.request('order', () => store.placeOrder(payload)).then(done)
    return
  }
  placing.value = true
  done(store.placeOrder(payload))
}
function submit() {
  if (stepId.value === 'payment') place()
  else if (stepId.value !== 'done') next() // un submit tardio tras confirmar no avanza mas alla del ultimo paso
}
</script>

<template>
  <PageShell type="checkout">
    <p v-if="!lines.length && stepId !== 'done'" data-testid="checkout-empty">
      {{ t('cart.empty') }} <a :href="`#${routePath('cart')}`">{{ t('checkout.toCart') }}</a>
    </p>
    <div v-else class="qa-checkout">
      <div class="qa-stepper" aria-hidden="true"><span v-for="(s, i) in STEPS" :key="s" :class="{ done: i <= step }" /></div>
      <h2 class="qa-step-title" data-testid="checkout-step">{{ t(`checkout.step.${stepId}`) }}</h2>

      <template v-if="stepId === 'done'">
        <p data-testid="order-confirmed">{{ t('checkout.thanks', { id: order?.id }) }}</p>
        <p>{{ t('checkout.paid') }}: <b data-testid="order-total">{{ money(order.totals.total, order.totals.decimals) }}</b></p>
      </template>

      <form v-else class="qa-form" novalidate @submit.prevent="submit">
        <FormField v-for="f in stepFields" :key="f.key" v-model="values[f.key]" :field="f" :error="errors[f.key]" @blur="validateField(f)" />

        <template v-if="stepId === 'shipping'">
          <fieldset class="qa-shipping">
            <legend class="qa-label">{{ t('cart.shipping') }}</legend>
            <label v-for="m in SHIPPING_METHODS" :key="m" class="qa-inline">
              <input v-model="method" type="radio" name="qa-shipping" :value="m" :data-testid="`ship-${m}`" />
              {{ t(`checkout.ship.${m}`) }} — {{ content.money(site.data.shipping[m]) }}
            </label>
          </fieldset>
          <div class="qa-coupon">
            <label class="qa-label" for="qa-coupon">{{ t('checkout.coupon.label') }}</label>
            <div class="qa-actions">
              <input id="qa-coupon" v-model="couponInput" type="text" autocomplete="off" data-testid="coupon-input" @keydown.enter.prevent="applyCoupon" />
              <button type="button" class="qa-btn secondary" data-testid="coupon-apply" @click="applyCoupon">{{ t('checkout.coupon.apply') }}</button>
            </div>
            <p class="qa-hint">{{ t('checkout.coupon.hint', { code: site.data.coupon.code, pct: site.data.coupon.pct }) }}</p>
            <p v-if="couponError" class="qa-error" role="alert" data-testid="coupon-error">{{ t(`checkout.coupon.err_${couponError}`) }}</p>
            <p v-if="store.state.coupon" class="qa-hint" data-testid="coupon-applied">
              {{ t('checkout.coupon.applied', { code: store.state.coupon, pct: site.data.coupon.pct }) }}
              <button type="button" class="qa-btn secondary" @click="store.removeCoupon()">{{ t('cart.remove') }}</button>
            </p>
          </div>
        </template>

        <ErrorBanner :show="serverError && stepId === 'payment'" />
        <div class="qa-actions">
          <button v-if="step > 0" type="button" class="qa-btn secondary" @click="step -= 1">{{ t('site.back') }}</button>
          <PrimaryButton type="submit" :disabled="placing">{{ stepId === 'payment' ? content.cta : t('site.next') }}</PrimaryButton>
        </div>
      </form>

      <aside v-if="stepId !== 'done'" class="qa-summary" data-testid="order-summary">
        <h3>{{ t('cart.summary') }}</h3>
        <ul class="qa-summary-lines">
          <li v-for="l in lines" :key="l.id">{{ l.name }} × {{ l.qty }}</li>
        </ul>
        <div>{{ t('cart.line') }}: <span data-testid="sum-subtotal">{{ money(totals.subtotal) }}</span></div>
        <div v-if="totals.discount">{{ t('cart.discount') }}: <span data-testid="sum-discount">-{{ money(totals.discount) }}</span></div>
        <div>{{ t('cart.shipping') }}: <span data-testid="sum-shipping">{{ money(totals.shipping) }}</span></div>
        <div>{{ t('cart.tax', { rate: site.data.taxRate }) }}: <span data-testid="sum-tax">{{ money(totals.tax) }}</span></div>
        <div class="grand">{{ t('cart.total') }}: <span data-testid="grand-total">{{ money(totals.total) }}</span></div>
      </aside>
    </div>
  </PageShell>
</template>
