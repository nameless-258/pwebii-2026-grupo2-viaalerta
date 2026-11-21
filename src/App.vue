<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { modoDemo } from '@/services/supabase'

const route = useRoute()
const semRodape = computed(() => route.meta.semRodape)
</script>

<template>
  <div class="app">
    <div v-if="modoDemo" class="demo-banner">
      Modo demonstração: dados guardados apenas neste navegador. Configure o Supabase no ficheiro <code>.env</code> para usar a base de dados real.
    </div>
    <AppHeader />
    <main class="main">
      <RouterView />
    </main>
    <AppFooter v-if="!semRodape" />
    <ToastHost />
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.main { flex: 1; }
.demo-banner { background: var(--yellow-soft); color: var(--text); font-size: 0.8rem; text-align: center; padding: 6px 12px; border-bottom: 1px solid var(--border); }
</style>
