<script setup>
import { ref } from 'vue'
import IncidentForm from '@/components/incidents/IncidentForm.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import StatusBadge from '@/components/incidents/StatusBadge.vue'
import { useNovaDenuncia } from '@/composables/useIncidents'
import { useAuth } from '@/composables/useAuth'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'

const { aEnviar, submeter } = useNovaDenuncia()
const { perfil } = useAuth()
const { enviarEmailConfirmacao } = useNotifications()
const toast = useToast()

const criada = ref(null)
const estadoEmail = ref(null) // 'enviado' | 'simulado' | 'falhou'
const chaveForm = ref(0)

async function aoSubmeter({ dados, ficheiro }) {
  try {
    criada.value = await submeter(dados, ficheiro)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Comunicação (R3): email de confirmação com a referência da denúncia
    const r = await enviarEmailConfirmacao(perfil.value, criada.value)
    estadoEmail.value = r.estado
  } catch (e) {
    toast.erro(e.message || 'Não foi possível submeter a denúncia.')
  }
}

function novaDenuncia() {
  criada.value = null
  estadoEmail.value = null
  chaveForm.value++
}
</script>

<template>
  <section class="container page report">
    <template v-if="criada">
      <div class="card sucesso">
        <div class="icone"><AppIcon name="check" :size="34" :stroke="2.5" /></div>
        <h1>Denúncia submetida!</h1>
        <p class="muted">A sua denúncia foi recebida e aguarda análise pelos responsáveis do ViaAlerta.</p>
        <div class="ref">
          <span class="small muted">Referência</span>
          <strong>{{ criada.referencia }}</strong>
        </div>
        <StatusBadge estado="pendente" />
        <p class="small email">
          <template v-if="estadoEmail === 'enviado'"><AppIcon name="email" :size="15" /> Enviámos uma confirmação para <strong>{{ perfil?.email }}</strong>.</template>
          <template v-else-if="estadoEmail === 'simulado'"><AppIcon name="info" :size="15" /> Email de confirmação simulado (EmailJS não configurado).</template>
          <template v-else-if="estadoEmail === 'falhou'"><AppIcon name="alerta" :size="15" /> Não foi possível enviar o email de confirmação, mas a denúncia foi registada.</template>
        </p>
        <div class="row centro">
          <RouterLink to="/minhas-denuncias" class="btn btn-primary">Acompanhar as minhas denúncias</RouterLink>
          <button class="btn btn-outline" type="button" @click="novaDenuncia">Fazer outra denúncia</button>
        </div>
      </div>
    </template>
    <template v-else>
      <header class="page-header">
        <h1>Fazer uma denúncia</h1>
        <p>Preencha os campos abaixo. Os campos com * são obrigatórios. A denúncia só fica pública depois de verificada.</p>
      </header>
      <IncidentForm :key="chaveForm" :a-enviar="aEnviar" @submeter="aoSubmeter" />
    </template>
  </section>
</template>

<style scoped>
.report { max-width: 860px; }
.sucesso { text-align: center; padding: 36px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.icone { width: 72px; height: 72px; border-radius: 50%; background: var(--primary); color: var(--primary-contrast); display: grid; place-items: center; margin-bottom: 6px; }
.ref { display: flex; flex-direction: column; padding: 12px 24px; border-radius: 12px; background: var(--surface-2); border: 1px dashed var(--border); }
.ref strong { font-size: 1.5rem; letter-spacing: 0.04em; font-family: ui-monospace, Menlo, monospace; }
.email { display: flex; gap: 6px; align-items: center; justify-content: center; color: var(--text-muted); }
.centro { justify-content: center; margin-top: 8px; }
</style>
