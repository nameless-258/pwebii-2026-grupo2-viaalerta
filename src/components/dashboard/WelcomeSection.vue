<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AppIcon from '@/components/common/AppIcon.vue'

const { autenticado, staff } = useAuth()
const router = useRouter()
const emit = defineEmits(['ver-mapa'])

// Se não estiver autenticado, vai para o login e volta ao formulário depois
function fazerDenuncia() {
  if (autenticado.value) router.push('/denunciar')
  else router.push({ name: 'entrar', query: { redirect: '/denunciar' } })
}
</script>

<template>
  <section class="welcome">
    <div class="texto">
      <span class="etiqueta"><svg class="bandeira" viewBox="0 0 30 20" width="24" height="16" role="img" aria-label="Bandeira de Moçambique">
          <rect width="30" height="20" fill="#FCE100" />
          <rect width="30" height="13.7" fill="#FFFFFF" />
          <rect y="6.9" width="30" height="6.2" fill="#000000" />
          <rect width="30" height="6.3" fill="#007168" />
          <polygon points="0,0 13.3,10 0,20" fill="#D21034" />
          <polygon points="4.60,6.60 5.39,8.91 7.83,8.95 5.88,10.42 6.60,12.75 4.60,11.35 2.60,12.75 3.32,10.42 1.37,8.95 3.81,8.91" fill="#FCE100" />
        </svg> Participação cidadã em Moçambique</span>
      <h1>Ajude a melhorar Moçambique.</h1>
      <p>Identifique problemas de infraestrutura na sua comunidade, denuncie situações e acompanhe a sua resolução.</p>
      <div class="row">
        <RouterLink v-if="staff" to="/admin" class="btn btn-primary btn-lg"><AppIcon name="painel" :size="20" /> Gerir denúncias</RouterLink>
        <button v-else class="btn btn-primary btn-lg" type="button" @click="fazerDenuncia"><AppIcon name="mais" :size="20" /> Fazer uma denúncia</button>
        <button class="btn btn-outline btn-lg" type="button" @click="emit('ver-mapa')"><AppIcon name="mapa" :size="20" /> Ver o mapa</button>
      </div>
      <p v-if="staff" class="small muted nota">Sessão de responsável: verifique, publique e acompanhe as denúncias dos cidadãos no painel de gestão.</p>
      <p v-else-if="!autenticado" class="small muted nota">É necessário ter conta para denunciar. O mapa e as estatísticas são públicos.</p>
    </div>
  </section>
</template>

<style scoped>
.welcome { position: relative; overflow: hidden; border-radius: 18px; padding: 28px 20px; background:
  radial-gradient(circle at 92% 10%, color-mix(in srgb, var(--yellow) 30%, transparent) 0, transparent 40%),
  radial-gradient(circle at 80% 110%, color-mix(in srgb, var(--red) 18%, transparent) 0, transparent 45%),
  linear-gradient(135deg, var(--primary-soft), var(--surface)); border: 1px solid var(--border); }
@media (min-width: 760px) { .welcome { padding: 44px 40px; } }
.texto { max-width: 640px; }
.etiqueta { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: var(--primary); background: var(--surface); padding: 4px 12px 4px 6px; border-radius: 999px; border: 1px solid var(--border); margin-bottom: 14px; }
.bandeira { flex-shrink: 0; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.15); }
p { font-size: 1.05rem; color: var(--text-muted); }
.nota { margin: 12px 0 0; font-size: 0.85rem; }
</style>
