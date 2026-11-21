<script setup>
import { useAuth } from '@/composables/useAuth'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps({
  ativa: { type: String, default: 'geral' },
  contagens: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['escolher'])
const { admin } = useAuth()

const itens = [
  { id: 'geral', nome: 'Visão geral', icone: 'painel' },
  { id: 'pendente', nome: 'Denúncias pendentes', icone: 'relogio' },
  { id: 'em_analise', nome: 'Em análise', icone: 'pesquisa' },
  { id: 'publicada', nome: 'Denúncias aprovadas', icone: 'check' },
  { id: 'em_resolucao', nome: 'Em resolução', icone: 'construcao' },
  { id: 'resolvida', nome: 'Resolvidas', icone: 'escudo' },
  { id: 'rejeitada', nome: 'Rejeitadas', icone: 'fechar' }
]
</script>

<template>
  <aside class="sidebar card" aria-label="Menu do painel administrativo">
    <nav>
      <button v-for="i in itens" :key="i.id" type="button" class="item" :class="{ on: ativa === i.id }" @click="emit('escolher', i.id)">
        <AppIcon :name="i.icone" :size="18" />
        <span>{{ i.nome }}</span>
        <span v-if="i.id !== 'geral' && contagens[i.id] != null" class="num">{{ contagens[i.id] }}</span>
      </button>
      <template v-if="admin">
        <span class="sep">Administração</span>
        <RouterLink to="/admin/utilizadores" class="item"><AppIcon name="utilizadores" :size="18" /><span>Utilizadores</span></RouterLink>
        <RouterLink to="/admin/auditoria" class="item"><AppIcon name="lista" :size="18" /><span>Auditoria</span></RouterLink>
        <RouterLink to="/admin/configuracao" class="item"><AppIcon name="painel" :size="18" /><span>Categorias e regras</span></RouterLink>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar { padding: 8px; }
nav { display: flex; gap: 4px; overflow-x: auto; }
.item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 9px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-weight: 500; white-space: nowrap; text-decoration: none !important; font-size: 0.92rem; }
.item:hover { background: var(--surface-2); color: var(--text); }
.item.on { background: var(--primary-soft); color: var(--primary); }
.sep { display: none; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-soft); padding: 12px 12px 4px; }
.num { margin-left: auto; background: var(--surface-2); border-radius: 999px; padding: 0 8px; font-size: 0.75rem; }
@media (min-width: 960px) {
  .sidebar { position: sticky; top: 80px; }
  nav { flex-direction: column; overflow: visible; }
  .sep { display: block; }
}
</style>
