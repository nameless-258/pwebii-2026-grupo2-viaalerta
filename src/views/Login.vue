<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { modoDemo } from '@/services/api'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/layout/AppLogo.vue'

const { entrar, recuperarPassword, staff } = useAuth()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const erros = reactive({ email: '', password: '', geral: '' })
const verPassword = ref(false)
const aEntrar = ref(false)
const modoRecuperar = ref(false)
const recuperacaoEnviada = ref(false)

const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())

function validar() {
  erros.email = !form.email ? 'Indique o seu email.' : !emailValido(form.email) ? 'Email inválido.' : ''
  erros.password = modoRecuperar.value ? '' : !form.password ? 'Indique a palavra-passe.' : ''
  return !erros.email && !erros.password
}

async function submeter() {
  erros.geral = ''
  if (!validar()) return
  aEntrar.value = true
  try {
    if (modoRecuperar.value) {
      await recuperarPassword(form.email.trim())
      recuperacaoEnviada.value = true
    } else {
      await entrar(form.email.trim(), form.password)
      toast.sucesso('Sessão iniciada. Bem-vindo(a)!')
      // Responsáveis/administradores vão directamente para o painel de gestão
      router.push(staff.value ? '/admin' : route.query.redirect || '/')
    }
  } catch (e) {
    erros.geral = e.message
  } finally {
    aEntrar.value = false
  }
}

function preencherDemo(email, password) {
  form.email = email
  form.password = password
}
</script>

<template>
  <section class="container page auth">
    <div class="card caixa">
      <RouterLink to="/" class="logo"><AppLogo com-slogan /></RouterLink>
      <h1>{{ modoRecuperar ? 'Recuperar palavra-passe' : 'Iniciar sessão' }}</h1>
      <p class="muted">{{ modoRecuperar ? 'Enviaremos um link para definir uma nova palavra-passe.' : 'Entre para fazer e acompanhar as suas denúncias.' }}</p>

      <div v-if="recuperacaoEnviada" class="alert alert-success">
        Se existir uma conta com <strong>{{ form.email }}</strong>, receberá um email com instruções.
        <span v-if="modoDemo"> (No modo demonstração não são enviados emails de autenticação.)</span>
      </div>

      <form v-else novalidate @submit.prevent="submeter">
        <div v-if="erros.geral" class="alert alert-error">{{ erros.geral }}</div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" class="input" :class="{ invalid: erros.email }" autocomplete="email" inputmode="email" placeholder="nome@exemplo.com" />
          <span v-if="erros.email" class="error">{{ erros.email }}</span>
        </div>
        <div v-if="!modoRecuperar" class="field">
          <label for="password">Palavra-passe</label>
          <div class="pw">
            <input id="password" v-model="form.password" :type="verPassword ? 'text' : 'password'" class="input" :class="{ invalid: erros.password }" autocomplete="current-password" />
            <button type="button" class="btn btn-ghost icon-btn" :aria-label="verPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'" @click="verPassword = !verPassword">
              <AppIcon :name="verPassword ? 'olho_fechado' : 'olho'" :size="18" />
            </button>
          </div>
          <span v-if="erros.password" class="error">{{ erros.password }}</span>
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" :disabled="aEntrar">
          {{ aEntrar ? 'Aguarde…' : modoRecuperar ? 'Enviar link de recuperação' : 'Entrar' }}
        </button>
      </form>

      <button class="link" type="button" @click="modoRecuperar = !modoRecuperar; recuperacaoEnviada = false; erros.geral = ''">
        {{ modoRecuperar ? '← Voltar a iniciar sessão' : 'Esqueceu-se da palavra-passe?' }}
      </button>
      <p class="rodape">Ainda não tem conta? <RouterLink to="/registar">Criar conta</RouterLink></p>

      <div v-if="modoDemo && !modoRecuperar" class="demo">
        <strong class="small">Contas de demonstração (dados fictícios)</strong>
        <button type="button" class="btn btn-outline btn-sm" @click="preencherDemo('cidadao@viaalerta.demo', 'Cidadao123!')">Cidadão</button>
        <button type="button" class="btn btn-outline btn-sm" @click="preencherDemo('responsavel@viaalerta.demo', 'Responsavel123!')">Responsável</button>
        <button type="button" class="btn btn-outline btn-sm" @click="preencherDemo('admin@viaalerta.demo', 'Admin123!')">Administrador</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth { display: grid; place-items: center; min-height: calc(100vh - 64px); }
.caixa { width: 100%; max-width: 430px; padding: 28px 22px; }
.logo { display: inline-block; margin-bottom: 20px; text-decoration: none !important; }
h1 { font-size: 1.6rem; }
.pw { display: flex; gap: 6px; }
.link { background: none; border: none; color: var(--primary); cursor: pointer; padding: 12px 0 0; font-weight: 500; }
.rodape { margin: 14px 0 0; font-size: 0.92rem; }
.demo { margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--border); display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.demo strong { width: 100%; }
</style>
