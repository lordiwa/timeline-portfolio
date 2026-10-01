<script setup>
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { useListing } from '../composables/useListing.js'
import PageShell from '../ui/PageShell.vue'
import Pager from '../ui/Pager.vue'
import Tabs from '../components/Tabs.vue'

const { site, content, has, t, labelTarget, store } = useSite()
const D = computed(() => content.value.dashboard)
const L = useListing(
  () => D.value.rows,
  { pageSize: site.data.dashboard.pageSize, match: (r, q) => !q || r.subject.toLowerCase().includes(q), catOf: (r) => r.status, priceOf: (r) => r.amount },
  has,
  store.ui.dashboard, // los filtros persisten al navegar y se reinician al recargar (igual que el catalogo)
)
const view = ref('table')
const tabs = computed(() => [{ id: 'table', label: t('list.viewTable') }, { id: 'summary', label: t('list.viewSummary') }])
const unlabeled = computed(() => has('missing-label') && labelTarget() === 'search') // BUG missing-label (buscador)

const rows = computed(() => L.pageRows())
// BUG total-wrong: el total de la pagina omite la ultima fila.
const pageTotal = computed(() => (has('total-wrong') ? rows.value.slice(0, -1) : rows.value).reduce((s, r) => s + r.amount, 0))
const all = computed(() => D.value.rows)
</script>

<template>
  <PageShell type="dashboard">
    <div class="qa-kpis">
      <div class="qa-kpi">{{ t('list.kpiTotal') }}<b>{{ all.length }}</b></div>
      <div class="qa-kpi">{{ t('list.kpiAmount') }}<b>{{ all.reduce((s, r) => s + r.amount, 0) }}</b></div>
      <div class="qa-kpi">{{ t('list.kpiOpen') }}<b>{{ all.filter((r) => r.status === 1).length }}</b></div>
    </div>
    <Tabs v-model="view" :tabs="tabs">
      <template #default="{ active }">
        <template v-if="active === 'table'">
          <div class="qa-toolbar-row">
            <label v-if="!unlabeled" class="qa-label" for="qa-search">{{ t('fields.search') }}</label>
            <input id="qa-search" type="search" :value="L.state.search" :placeholder="unlabeled ? t('fields.search') : ''" @input="L.set('search', $event.target.value)" />
            <select :value="L.state.cat" :aria-label="t('list.allStatus')" @change="L.set('cat', $event.target.value)">
              <option value="">{{ t('list.allStatus') }}</option>
              <option v-for="(s, i) in D.statuses" :key="i" :value="String(i)">{{ s }}</option>
            </select>
            <button type="button" class="qa-btn secondary" @click="L.clear()">{{ t('list.clear') }}</button>
          </div>
          <div class="qa-table-wrap">
            <table class="qa-table">
              <thead>
                <tr>
                  <th>{{ t('list.colId') }}</th>
                  <th v-for="col in D.columns" :key="col.key" :class="{ num: col.type === 'money' || col.type === 'number' }">{{ col.label }}</th>
                  <th>{{ t('list.colStatus') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id">
                  <td>{{ r.id }}</td>
                  <td v-for="col in D.columns" :key="col.key" :class="{ num: col.type === 'money' || col.type === 'number' }">{{ r[col.key] }}</td>
                  <td><span class="qa-badge">{{ D.statuses[r.status] }}</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td :colspan="D.columns.length + 1">{{ t('list.total') }}</td><td class="num" data-testid="page-total">{{ pageTotal }}</td></tr>
              </tfoot>
            </table>
          </div>
          <p v-if="!L.filtered().length" class="qa-hint">{{ t('list.empty') }}</p>
          <Pager :page="L.current()" :pages="L.pages()" :skip-at="site.data.dashboard.skipAt" @update:page="(n) => (L.state.page = n)" />
        </template>
        <ul v-else>
          <li v-for="(s, i) in D.statuses" :key="i">{{ s }}: {{ all.filter((r) => r.status === i).length }}</li>
        </ul>
      </template>
    </Tabs>
  </PageShell>
</template>
