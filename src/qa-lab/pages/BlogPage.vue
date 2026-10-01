<script setup>
// Blog: /blog lista los posts, /blog/:id abre uno con pestanas Articulo / Comentarios.
// Los comentarios nuevos persisten en el store (sobreviven a navegar y a recargar).
import { computed, ref } from 'vue'
import { useSite } from '../composables/useSite.js'
import { routePath } from '../generator/pages.js'
import { relTime } from '../state/dates.js'
import PageShell from '../ui/PageShell.vue'
import Tabs from '../components/Tabs.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

const { content, route, has, t, store, toast, labelTarget } = useSite()
const post = computed(() => content.value.posts.find((p) => p.id === route.value.params.id))
const tab = ref('article')
const draft = ref('')
const unlabeled = computed(() => has('missing-label') && labelTarget() === 'comment') // BUG missing-label (caja de comentario)
const comments = computed(() => [
  ...(store.state.comments[post.value?.id] || []),
  ...(post.value?.comments || []),
])
// BUG relative-time-wrong: con el flag muestra solo el resto de dividir por 60 (125 min -> "hace 5 min").
const timeAgo = (minutes) => {
  const r = relTime(minutes, { wrong: has('relative-time-wrong') })
  return t(r.key, { n: r.n })
}
// Escapa todo y deja "vivas" solo las etiquetas inertes <b> e <i>: el bug es real (HTML sin escapar) pero acotado: un
// payload con handlers (onerror=...) queda como texto, nunca se ejecuta en el propio lab.
const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const inertHtml = (s) => s.replace(/[&<>"']/g, (c) => HTML_ESC[c]).replace(/&lt;(\/?)(b|i)&gt;/gi, '<$1$2>')
const tabs = computed(() => [
  { id: 'article', label: t('article.tabArticle') },
  { id: 'comments', label: t('article.tabComments', { n: comments.value.length }) },
])

function publish() {
  if (store.addComment(post.value.id, draft.value)) {
    draft.value = ''
    toast(t('article.commentPosted'))
  }
}
</script>

<template>
  <PageShell v-if="!route.params.id" type="blog">
    <article v-for="p in content.posts" :key="p.id" class="qa-card qa-post" data-testid="post-card">
      <h3><a :href="`#${routePath('blog', p.id)}`">{{ p.title }}</a></h3>
      <p>{{ p.paragraphs[0] }}</p>
    </article>
  </PageShell>
  <PageShell v-else-if="post" type="blog" :title="post.title">
    <Tabs v-model="tab" :tabs="tabs">
      <template #default="{ active }">
        <article v-if="active === 'article'" class="qa-article">
          <p class="qa-hint">{{ t('article.by') }}</p>
          <p v-for="(para, i) in post.paragraphs" :key="i">{{ para }}</p>
        </article>
        <section v-else>
          <div v-for="(m, i) in comments" :key="i" class="qa-comment" data-testid="comment">
            <strong>{{ m.author || t('article.you') }}</strong> <small data-testid="comment-time">{{ timeAgo(m.minutes) }}</small>
            <!-- BUG unescaped-comment-html: solo comentarios de ESTA sesion y solo <b>/<i> (el resto sigue escapado). -->
            <p v-if="m.live && has('unescaped-comment-html')" v-html="inertHtml(m.text)" />
            <p v-else>{{ m.text }}</p>
          </div>
          <form class="qa-form" @submit.prevent="publish">
            <div class="qa-field">
              <label v-if="!unlabeled" class="qa-label" for="qa-comment">{{ t('fields.comment') }}</label>
              <textarea id="qa-comment" v-model="draft" rows="3" :placeholder="unlabeled ? t('fields.comment') : ''" />
            </div>
            <div class="qa-actions"><PrimaryButton type="submit">{{ t('article.publish') }}</PrimaryButton></div>
          </form>
        </section>
      </template>
    </Tabs>
    <p><a :href="`#${routePath('blog')}`">{{ t('blog.back') }}</a></p>
  </PageShell>
</template>
