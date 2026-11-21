<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import AppIcon from '@/components/common/AppIcon.vue'
import AppLogo from '@/components/layout/AppLogo.vue'

const { registar } = useAuth()
const toast = useToast()
const router = useRouter()

const form = reactive({ nome: '', email: '', password: '', confirmar: '', termos: false })
const erros = reactive({})
const verPassword = ref(false)
const aEnviar = ref(false)
const confirmacaoPendente = ref(false)
const erroGeral = ref('')

const forca = computed(() => {
  const p = form.password
  let f = 0
  if (p.length >= 8) f++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) f++
  if (/\d/.test(p)) f++
  if (/[^A-Za-z0-9]/.test(p)) f++
  return f
})
const textoForca = computed(() => ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][forca.value])

function validar() {
  Object.keys(erros).forEach((k) => delete erros[k])
  if (form.nome.trim().split(/\s+/).length < 2) erros.nome = 'Indique o nome completo (nome e apelido).'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) erros.email = 'Indique um email válido.'
  if (form.password.length < 8) erros.password = 'A palavra-passe deve ter pelo menos 8 caracteres.'
  else if (!/\d/.test(form.password) || !/[A-Za-z]/.test(form.password)) erros.password = 'Use letras e números.'
  if (form.confirmar !== form.password) erros.confirmar = 'As palavras-passe não coincidem.'
  if (!form.termos) erros.termos = 'Tem de aceitar os termos e a política de privacidade.'
  return Object.keys(erros).length === 0
}

async function submeter() {
  erroGeral.value = ''
  if (!validar()) return
  aEnviar.value = true
  try {
    const r = await registar(form.nome.trim(), form.email.trim().toLowerCase(), form.password)
    if (r.precisaConfirmacao) {
      confirmacaoPendente.value = true
    } else {
      toast.sucesso('Conta criada com sucesso!')
      router.push('/denunciar')
    }
  } catch (e) {
    erroGeral.value = e.message
  } finally {
    aEnviar.value = false
  }
}
</script>

<template>
  <section class="container page auth">
    <div class="card caixa">
      <RouterLink to="/" class="logo"><AppLogo com-slogan /></RouterLink>
      <h1>Criar conta</h1>
      <p class="muted">Junte-se ao ViaAlerta e ajude a melhorar a sua comunidade.</p>

      <div v-if="confirmacaoPendente" class="alert alert-success">
        <strong>Quase lá!</strong> Enviámos um email de confirmação para <strong>{{ form.email }}</strong>. Abra o link para activar a conta e depois inicie sessão.
      </div>

      <form v-else novalidate @submit.prevent="submeter">
        <div v-if="erroGeral" class="alert alert-error">{{ erroGeral }}</div>
        <div class="field">
          <label for="nome">Nome completo</label>
          <input id="nome" v-model="form.nome" class="input" :class="{ invalid: erros.nome }" autocomplete="name" />
          <span v-if="erros.nome" class="error">{{ erros.nome }}</span>
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="form.email" type="email" inputmode="email" class="input" :class="{ invalid: erros.email }" autocomplete="email" />
          <span v-if="erros.email" class="error">{{ erros.email }}</span>
        </div>
        <div class="field">
          <label for="password">Palavra-passe</label>
          <div class="pw">
            <input id="password" v-model="form.password" :type="verPassword ? 'text' : 'password'" class="input" :class="{ invalid: erros.password }" autocomplete="new-password" />
            <button type="button" class="btn btn-ghost icon-btn" :aria-label="verPassword ? 'Esconder' : 'Mostrar'" @click="verPassword = !verPassword">
              <AppIcon :name="verPassword ? 'olho_fechado' : 'olho'" :size="18" />
            </button>
          </div>
          <div v-if="form.password" class="forca"><span v-for="i in 4" :key="i" :class="{ on: i <= forca }"></span><small>{{ textoForca }}</small></div>
          <span v-if="erros.password" class="error">{{ erros.password }}</span>
        </div>
        <div class="field">
          <label for="confirmar">Confirmar palavra-passe</label>
          <input id="confirmar" v-model="form.confirmar" :type="verPassword ? 'text' : 'password'" class="input" :class="{ invalid: erros.confirmar }" autocomplete="new-password" />
          <span v-if="erros.confirmar" class="error">{{ erros.confirmar }}</span>
        </div>
        <div class="field">
          <label class="checkbox">
            <input v-model="form.termos" type="checkbox" />
            <span>Li e aceito os <RouterLink to="/sobre#termos">termos de utilização</RouterLink> e a <RouterLink to="/sobre#privacidade">política de privacidade</RouterLink>.</span>
          </label>
          <span v-if="erros.termos" class="error">{{ erros.termos }}</span>
        </div>
        <button class="btn btn-primary btn-lg btn-block" type="submit" :disabled="aEnviar">{{ aEnviar ? 'A criar conta…' : 'Criar conta' }}</button>
      </form>
      <p class="rodape">Já tem conta? <RouterLink to="/entrar">Iniciar sessão</RouterLink></p>
    </div>
  </section>
</template>

<style scoped>
.auth { display: grid; place-items: center; min-height: calc(100vh - 64px); }
.caixa { width: 100%; max-width: 460px; padding: 28px 22px; }
.logo { display: inline-block; margin-bottom: 20px; text-decoration: none !important; }
h1 { font-size: 1.6rem; }
.pw { display: flex; gap: 6px; }
.forca { display: flex; gap: 4px; align-items: center; }
.forca span { flex: 1; height: 4px; border-radius: 2px; background: var(--surface-3); }
.forca span.on { background: var(--primary); }
.forca small { margin-left: 8px; color: var(--text-muted); min-width: 80px; }
.rodape { margin: 16px 0 0; font-size: 0.92rem; }
</style>
