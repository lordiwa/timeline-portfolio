<script setup>
// Banner de error del "servidor" simulado (bug nth-submit-server-error). Anuncia el error (role=alert).
import { useSite } from '../composables/useSite.js'

defineProps({ show: Boolean })
const { t } = useSite()
</script>

<template>
  <p v-if="show" class="qa-error qa-banner-error" role="alert" data-testid="server-error">{{ t('err.server500') }}</p>
</template>
