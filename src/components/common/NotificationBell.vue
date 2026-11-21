<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { tempoRelativo } from '@/composables/useFormat'
import AppIcon from './AppIcon.vue'

const { notificacoes, naoLidas, iniciar, parar, marcarLidas } = useNotifications()
const router = useRouter()
const aberto = ref(false)
const raiz = ref(null)

function alternar() {
  aberto.value = !aberto.value
  if (aberto.value) setTimeout(marcarLidas, 1500)
}
function abrir() {
  aberto.value = false
  router.push('/minhas-denuncias')
}
function fora(e) { if (raiz.value && !raiz.value.contains(e.target)) aberto.value = false }

onMounted(() => { iniciar(); document.addEventListener('click', fora) })
onBeforeUnmount(() => { parar(); document.removeEventListener('click', fora) })
</script>

<template>
  <div ref="raiz" class="sino">
    <button class="btn btn-ghost icon-btn" type="button" :aria-label="`Notificações (${naoLidas} por ler)`" @click="alternar">
      <AppIcon name="sino" />
      <span v-if="naoLidas" class="ponto">{{ naoLidas > 9 ? '9+' : naoLidas }}</span>
    </button>
    <Transition name="fade">
      <div v-if="aberto" class="painel card">
        <strong class="cab">Notificações</strong>
        <p v-if="!notificacoes.length" class="small muted vazio">Sem notificações. Será avisado aqui (e por email) quando as suas denúncias mudarem de estado.</p>
        <ul v-else>
          <li v-for="n in notificacoes" :key="n.id" :class="{ nova: !n.lida }">
            <button type="button" @click="abrir">
              <strong>{{ n.titulo }}</strong>
              <span class="small">{{ n.mensagem }}</span>
              <span class="small muted">{{ tempoRelativo(n.criadoEm) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sino { position: relative; }
.ponto { position: absolute; top: 4px; right: 4px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 999px; background: var(--red); color: #fff; font-size: 0.65rem; font-weight: 700; display: grid; place-items: center; }
.painel { position: absolute; right: -50px; top: calc(100% + 8px); width: min(340px, 92vw); max-height: 420px; overflow: auto; padding: 8px; box-shadow: var(--shadow-lg); }
@media (min-width: 600px) { .painel { right: 0; } }
.cab { display: block; padding: 8px 10px; }
.vazio { padding: 0 10px 10px; margin: 0; }
ul { list-style: none; margin: 0; padding: 0; }
li button { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 2px; padding: 10px; border-radius: 8px; border: none; background: none; cursor: pointer; }
li button:hover { background: var(--surface-2); }
li.nova button { background: var(--primary-soft); }
</style>
