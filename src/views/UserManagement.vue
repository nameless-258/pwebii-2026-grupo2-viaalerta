<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdmin } from '@/composables/useAdmin'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { FUNCOES } from '@/constants/funcoes'
import { formatarData, formatarDataHora } from '@/composables/useFormat'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { listarUtilizadores, alterarFuncao, historicoFuncoes, criarResponsavel, alterarEstadoConta } = useAdmin()
const { perfil } = useAuth()
const toast = useToast()

const utilizadores = ref([])
const registo = ref([])
const aCarregar = ref(true)
const erro = ref(null)
const filtro = ref('')
const filtroFuncao = ref('')
const pendente = ref(null) // { u, funcao }
const aGuardar = ref(false)

// Criar conta de responsável
const novo = ref({ nome: '', email: '', password: '' })
const errosNovo = ref({})
const aCriar = ref(false)
const formAberto = ref(false)

function validarNovo() {
  const e = {}
  if (novo.value.nome.trim().split(/\s+/).length < 2) e.nome = 'Indique o nome completo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(novo.value.email.trim())) e.email = 'Email inválido.'
  if (novo.value.password.length < 8 || !/\d/.test(novo.value.password) || !/[A-Za-z]/.test(novo.value.password)) e.password = 'Mínimo 8 caracteres, com letras e números.'
  errosNovo.value = e
  return !Object.keys(e).length
}

async function criar() {
  if (!validarNovo()) return
  aCriar.value = true
  try {
    const r = await criarResponsavel({ nome: novo.value.nome.trim(), email: novo.value.email.trim().toLowerCase(), password: novo.value.password })
    toast.sucesso(`Conta de responsável criada para ${novo.value.email}.` + (r.precisaConfirmacao ? ' O responsável tem de confirmar o email antes de entrar.' : ''))
    novo.value = { nome: '', email: '', password: '' }
    formAberto.value = false
    await carregar()
  } catch (e) {
    toast.erro(e.message)
  } finally {
    aCriar.value = false
  }
}

// Activar / desactivar contas
const contaPendente = ref(null)
async function confirmarConta() {
  aGuardar.value = true
  try {
    const { u } = contaPendente.value
    await alterarEstadoConta(u.id, u.ativo === false)
    toast.sucesso(u.ativo === false ? `Conta de ${u.nome} reactivada.` : `Conta de ${u.nome} desactivada.`)
    contaPendente.value = null
    await carregar()
  } catch (e) {
    toast.erro(e.message)
  } finally {
    aGuardar.value = false
  }
}

async function carregar() {
  aCarregar.value = true
  erro.value = null
  try {
    ;[utilizadores.value, registo.value] = await Promise.all([listarUtilizadores(), historicoFuncoes()])
  } catch (e) {
    erro.value = e.message
  } finally {
    aCarregar.value = false
  }
}
onMounted(carregar)

const lista = computed(() => {
  const t = filtro.value.toLowerCase()
  return utilizadores.value.filter((u) => (!filtroFuncao.value || u.funcao === filtroFuncao.value) && `${u.nome} ${u.email}`.toLowerCase().includes(t))
})
const contagem = computed(() => Object.fromEntries(Object.keys(FUNCOES).map((f) => [f, utilizadores.value.filter((u) => u.funcao === f).length])))

function pedirAlteracao(u, funcao) {
  if (funcao === u.funcao) return
  pendente.value = { u, funcao }
}

async function confirmar() {
  aGuardar.value = true
  try {
    await alterarFuncao(pendente.value.u.id, pendente.value.funcao)
    toast.sucesso(`${pendente.value.u.nome} é agora ${FUNCOES[pendente.value.funcao]}.`)
    pendente.value = null
    await carregar()
  } catch (e) {
    toast.erro(e.message)
  } finally {
    aGuardar.value = false
  }
}
</script>

<template>
  <section class="container page">
    <RouterLink to="/admin" class="voltar"><AppIcon name="seta_esq" :size="18" /> Painel administrativo</RouterLink>
    <header class="page-header">
      <h1>Gestão de utilizadores</h1>
      <p>Atribua ou retire permissões. Todas as alterações ficam registadas.</p>
    </header>

    <section class="card criar">
      <div class="section-title">
        <div>
          <h2>Criar conta de responsável</h2>
          <p class="small muted">Os responsáveis verificam, publicam e acompanham as denúncias. Não criam denúncias.</p>
        </div>
        <button class="btn" :class="formAberto ? 'btn-outline' : 'btn-primary'" type="button" @click="formAberto = !formAberto">
          <AppIcon :name="formAberto ? 'fechar' : 'mais'" :size="17" /> {{ formAberto ? 'Fechar' : 'Nova conta' }}
        </button>
      </div>
      <form v-if="formAberto" class="form-novo" novalidate @submit.prevent="criar">
        <div class="field">
          <label for="n-nome">Nome completo</label>
          <input id="n-nome" v-model="novo.nome" class="input" :class="{ invalid: errosNovo.nome }" autocomplete="off" />
          <span v-if="errosNovo.nome" class="error">{{ errosNovo.nome }}</span>
        </div>
        <div class="field">
          <label for="n-email">Email</label>
          <input id="n-email" v-model="novo.email" type="email" class="input" :class="{ invalid: errosNovo.email }" autocomplete="off" />
          <span v-if="errosNovo.email" class="error">{{ errosNovo.email }}</span>
        </div>
        <div class="field">
          <label for="n-pass">Palavra-passe inicial</label>
          <input id="n-pass" v-model="novo.password" type="password" class="input" :class="{ invalid: errosNovo.password }" autocomplete="new-password" />
          <span v-if="errosNovo.password" class="error">{{ errosNovo.password }}</span>
          <span class="hint">Comunique-a ao responsável por um canal seguro; ele pode alterá-la em «Esqueceu-se da palavra-passe?».</span>
        </div>
        <button class="btn btn-primary" type="submit" :disabled="aCriar">{{ aCriar ? 'A criar…' : 'Criar conta de responsável' }}</button>
      </form>
    </section>

    <div class="resumo">
      <button v-for="(nome, f) in FUNCOES" :key="f" type="button" class="card-flat" :class="{ on: filtroFuncao === f }" @click="filtroFuncao = filtroFuncao === f ? '' : f">
        <strong>{{ contagem[f] }}</strong><span>{{ nome }}</span>
      </button>
    </div>

    <LoadingState v-if="aCarregar" />
    <ErrorState v-else-if="erro" :mensagem="erro" @tentar="carregar" />
    <template v-else>
      <input v-model="filtro" class="input filtro" type="search" placeholder="Pesquisar por nome ou email…" aria-label="Pesquisar utilizadores" />
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Nome</th><th class="h-m">Email</th><th class="h-m">Registo</th><th>Função</th><th>Conta</th></tr></thead>
          <tbody>
            <tr v-for="u in lista" :key="u.id" :class="{ inativo: u.ativo === false }">
              <td><strong>{{ u.nome }}</strong><span v-if="u.id === perfil?.id" class="badge">você</span><div class="small muted so-m">{{ u.email }}</div></td>
              <td class="h-m">{{ u.email }}</td>
              <td class="h-m small">{{ formatarData(u.criado_em) }}</td>
              <td>
                <select class="select sel" :value="u.funcao" :disabled="u.id === perfil?.id" :title="u.id === perfil?.id ? 'Não pode alterar a sua própria função' : ''" @change="pedirAlteracao(u, $event.target.value); $event.target.value = u.funcao">
                  <option v-for="(nome, f) in FUNCOES" :key="f" :value="f">{{ nome }}</option>
                </select>
              </td>
              <td>
                <span v-if="u.ativo === false" class="badge desat">Desactivada</span>
                <span v-else class="badge ativa">Activa</span>
                <button v-if="u.id !== perfil?.id" class="btn btn-ghost btn-sm" type="button" @click="contaPendente = { u }">
                  {{ u.ativo === false ? 'Reactivar' : 'Desactivar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section class="section">
        <h2>Registo de alterações de funções</h2>
        <p v-if="!registo.length" class="muted small">Ainda não houve alterações.</p>
        <ul v-else class="registo">
          <li v-for="r in registo" :key="r.id" class="small">
            <strong>{{ r.alvo }}</strong>: {{ FUNCOES[r.antiga] }} → <strong>{{ FUNCOES[r.nova] }}</strong>
            <span class="muted"> · por {{ r.autor }} · {{ formatarDataHora(r.criadoEm) }}</span>
          </li>
        </ul>
      </section>
    </template>

    <ConfirmDialog
      :aberto="!!pendente"
      titulo="Alterar função de acesso"
      :mensagem="pendente ? `Alterar ${pendente.u.nome} de «${FUNCOES[pendente.u.funcao]}» para «${FUNCOES[pendente.funcao]}»?` : ''"
      texto-confirmar="Alterar função"
      :perigo="pendente?.funcao === 'admin'"
      :a-carregar="aGuardar"
      @confirmar="confirmar"
      @cancelar="pendente = null"
    />
    <ConfirmDialog
      :aberto="!!contaPendente"
      :titulo="contaPendente?.u.ativo === false ? 'Reactivar conta' : 'Desactivar conta'"
      :mensagem="contaPendente ? (contaPendente.u.ativo === false ? `${contaPendente.u.nome} volta a poder usar o ViaAlerta.` : `${contaPendente.u.nome} deixa de poder iniciar sessão, criar ou gerir denúncias. As denúncias e o histórico ficam guardados.`) : ''"
      :texto-confirmar="contaPendente?.u.ativo === false ? 'Reactivar' : 'Desactivar'"
      :perigo="contaPendente?.u.ativo !== false"
      :a-carregar="aGuardar"
      @confirmar="confirmarConta"
      @cancelar="contaPendente = null"
    />
  </section>
</template>

<style scoped>
.voltar { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; font-weight: 500; }
.resumo { display: grid; gap: 10px; grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; }
.resumo button { border: 1px solid transparent; cursor: pointer; text-align: left; display: flex; flex-direction: column; }
.resumo button.on { border-color: var(--primary); }
.resumo strong { font-size: 1.4rem; }
.resumo span { font-size: 0.8rem; color: var(--text-muted); }
.filtro { margin-bottom: 12px; }
.sel { min-width: 170px; min-height: 38px; padding: 6px 10px; }
.badge { margin-left: 6px; }
.h-m { display: none; }
@media (min-width: 760px) { .h-m { display: table-cell; } .so-m { display: none; } }
.criar { margin-bottom: 16px; }
.criar h2 { font-size: 1.15rem; margin-bottom: 2px; }
.criar p { margin: 0; }
.form-novo { display: grid; gap: 0 14px; grid-template-columns: 1fr; margin-top: 8px; }
@media (min-width: 860px) { .form-novo { grid-template-columns: 1fr 1fr 1fr; align-items: start; } .form-novo .btn { grid-column: 1 / -1; justify-self: start; } }
.inativo td { opacity: 0.6; }
.desat { background: var(--red-soft); color: var(--red); }
.ativa { background: var(--primary-soft); color: var(--primary); }
.registo { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.registo li { padding: 8px 12px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); }
</style>
