<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { categoriasAtivas } from '@/constants/categorias'
import { configuracao } from '@/composables/useConfiguracao'
import { useMozambiqueData } from '@/composables/useMozambiqueData'
import ImageUploader from './ImageUploader.vue'
import LocationPicker from './LocationPicker.vue'
import AppIcon from '@/components/common/AppIcon.vue'

defineProps({ aEnviar: { type: Boolean, default: false } })
const emit = defineEmits(['submeter'])

const { provincias, distritosDe, carregarProvincias, carregarDistritos, erroDados } = useMozambiqueData()

const form = reactive({
  titulo: '',
  categoria: '',
  descricao: '',
  provincia: '',
  distrito: '',
  localidade: '',
  local: null,
  anonima: false
})
const foto = ref(null)
const erros = reactive({})
const tentouSubmeter = ref(false)

onMounted(() => { carregarProvincias(); carregarDistritos() })

const distritos = computed(() => distritosDe(form.provincia))

function aoMudarProvincia() {
  if (!distritos.value.includes(form.distrito)) form.distrito = ''
}

// Preenchimento automático a partir do ponto escolhido no mapa
function aoReceberEndereco(end) {
  if (end.provincia) form.provincia = end.provincia
  if (end.distrito && distritosDe(end.provincia || form.provincia).includes(end.distrito)) form.distrito = end.distrito
  else aoMudarProvincia()
  if (end.localidade && !form.localidade) form.localidade = end.localidade
}

function validar() {
  const e = {}
  const t = form.titulo.trim()
  if (!t) e.titulo = 'Indique um título.'
  else if (t.length < 8) e.titulo = 'O título deve ter pelo menos 8 caracteres.'
  else if (t.length > 90) e.titulo = 'O título deve ter no máximo 90 caracteres.'
  if (!form.categoria) e.categoria = 'Escolha a categoria do problema.'
  const d = form.descricao.trim()
  if (!d) e.descricao = 'Descreva o problema.'
  else if (d.length < configuracao.descricaoMin) e.descricao = `A descrição deve ter pelo menos ${configuracao.descricaoMin} caracteres.`
  else if (d.length > 1000) e.descricao = 'A descrição deve ter no máximo 1000 caracteres.'
  if (!form.provincia) e.provincia = 'Escolha a província.'
  if (!form.distrito) e.distrito = 'Escolha o distrito.'
  if (form.localidade.trim().length < 3) e.localidade = 'Indique o bairro, rua ou localidade.'
  if (!form.local) e.local = 'Marque a localização no mapa.'
  if (configuracao.fotoObrigatoria && !foto.value) e.foto = 'Adicione uma fotografia do problema.'
  if (erros.local && form.local === null) e.local = erros.local
  Object.keys(erros).forEach((k) => delete erros[k])
  Object.assign(erros, e)
  return Object.keys(e).length === 0
}

function submeter() {
  tentouSubmeter.value = true
  if (!validar()) {
    // Leva o utilizador ao primeiro erro
    requestAnimationFrame(() => document.querySelector('.form-denuncia .error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    return
  }
  emit('submeter', {
    dados: {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      provincia: form.provincia,
      distrito: form.distrito,
      localidade: form.localidade.trim(),
      lat: form.local.lat,
      lng: form.local.lng,
      anonima: configuracao.permitirAnonimas && form.anonima
    },
    ficheiro: foto.value
  })
}

const revalidar = () => { if (tentouSubmeter.value) validar() }
</script>

<template>
  <form class="form-denuncia" novalidate @submit.prevent="submeter" @input="revalidar" @change="revalidar">
    <section class="card bloco">
      <h2><span class="n">1</span> O problema</h2>
      <div class="field">
        <label for="titulo">Título *</label>
        <input id="titulo" v-model="form.titulo" class="input" :class="{ invalid: erros.titulo }" maxlength="90" placeholder="Ex.: Buraco grande na Av. Eduardo Mondlane" />
        <span v-if="erros.titulo" class="error">{{ erros.titulo }}</span>
      </div>

      <div class="field">
        <span class="label-like">Categoria *</span>
        <div class="cats" role="radiogroup" aria-label="Categoria">
          <label v-for="c in categoriasAtivas()" :key="c.id" class="cat" :class="{ sel: form.categoria === c.id }">
            <input v-model="form.categoria" type="radio" name="categoria" :value="c.id" class="sr-only" />
            <span class="ico" :style="{ background: c.cor, color: c.texto, borderColor: c.borda || c.cor }"><AppIcon :name="c.icone" :size="16" /></span>
            <span>{{ c.nome }}</span>
          </label>
        </div>
        <span v-if="erros.categoria" class="error">{{ erros.categoria }}</span>
      </div>

      <div class="field">
        <label for="descricao">Descrição *</label>
        <textarea id="descricao" v-model="form.descricao" class="textarea" :class="{ invalid: erros.descricao }" maxlength="1000" placeholder="Descreva o problema, há quanto tempo existe e que riscos causa."></textarea>
        <span class="hint">{{ form.descricao.length }}/1000 · mínimo {{ configuracao.descricaoMin }} caracteres</span>
        <span v-if="erros.descricao" class="error">{{ erros.descricao }}</span>
      </div>
    </section>

    <section class="card bloco">
      <h2><span class="n">2</span> Localização</h2>
      <div class="field">
        <LocationPicker v-model="form.local" :erro="erros.local" @endereco="aoReceberEndereco" @erro="(m) => (erros.local = m)" />
        <span v-if="erros.local" class="error">{{ erros.local }}</span>
      </div>
      <p v-if="erroDados" class="alert alert-warning small">{{ erroDados }}</p>
      <div class="tres">
        <div class="field">
          <label for="provincia">Província *</label>
          <select id="provincia" v-model="form.provincia" class="select" :class="{ invalid: erros.provincia }" @change="aoMudarProvincia">
            <option value="">Seleccione…</option>
            <option v-for="p in provincias" :key="p" :value="p">{{ p }}</option>
          </select>
          <span v-if="erros.provincia" class="error">{{ erros.provincia }}</span>
        </div>
        <div class="field">
          <label for="distrito">Distrito *</label>
          <select id="distrito" v-model="form.distrito" class="select" :class="{ invalid: erros.distrito }" :disabled="!form.provincia">
            <option value="">{{ form.provincia ? 'Seleccione…' : 'Escolha a província primeiro' }}</option>
            <option v-for="d in distritos" :key="d" :value="d">{{ d }}</option>
          </select>
          <span v-if="erros.distrito" class="error">{{ erros.distrito }}</span>
        </div>
        <div class="field">
          <label for="localidade">Localidade / bairro *</label>
          <input id="localidade" v-model="form.localidade" class="input" :class="{ invalid: erros.localidade }" maxlength="120" placeholder="Ex.: Bairro Central, Rua da Resistência" />
          <span v-if="erros.localidade" class="error">{{ erros.localidade }}</span>
        </div>
      </div>
    </section>

    <section class="card bloco">
      <h2><span class="n">3</span> Fotografia{{ configuracao.permitirAnonimas ? ' e privacidade' : '' }}</h2>
      <div class="field">
        <ImageUploader v-model="foto" :max-mb="configuracao.fotoMaxMb" :obrigatoria="configuracao.fotoObrigatoria" :erro="erros.foto" @erro="(m) => (erros.foto = m)" />
        <span v-if="erros.foto" class="error">{{ erros.foto }}</span>
      </div>
      <label v-if="configuracao.permitirAnonimas" class="checkbox anonimo">
        <input v-model="form.anonima" type="checkbox" />
        <span>
          <strong>Denúncia anónima</strong><br />
          <span class="small muted">A sua identidade nunca aparece publicamente. Com esta opção, também fica oculta aos responsáveis — só pessoal autorizado a pode consultar se for estritamente necessário. Continuará a acompanhar a denúncia na sua conta.</span>
        </span>
      </label>
    </section>

    <div class="submeter">
      <button class="btn btn-primary btn-lg btn-block" type="submit" :disabled="aEnviar">
        <AppIcon name="enviar" :size="18" /> {{ aEnviar ? 'A enviar denúncia…' : 'Submeter denúncia' }}
      </button>
      <p v-if="tentouSubmeter && Object.keys(erros).length" class="error small centro">Corrija os campos assinalados a vermelho.</p>
    </div>
  </form>
</template>

<style scoped>
.bloco { margin-bottom: 16px; }
h2 { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; margin-bottom: 16px; }
.n { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-soft); color: var(--primary); display: grid; place-items: center; font-size: 0.9rem; }
.label-like { font-weight: 600; font-size: 0.9rem; }
.cats { display: grid; gap: 8px; grid-template-columns: 1fr; }
@media (min-width: 560px) { .cats { grid-template-columns: 1fr 1fr; } }
.cat { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: 0.92rem; background: var(--surface); }
.cat:hover { border-color: var(--primary); }
.cat.sel { border-color: var(--primary); background: var(--primary-soft); box-shadow: 0 0 0 2px var(--primary) inset; }
.ico { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; border: 2px solid; flex-shrink: 0; }
.tres { display: grid; gap: 0 14px; grid-template-columns: 1fr; }
@media (min-width: 760px) { .tres { grid-template-columns: 1fr 1fr 1fr; } }
.anonimo { padding: 14px; border-radius: 10px; background: var(--surface-2); }
.submeter { position: sticky; bottom: 12px; z-index: 5; }
.centro { text-align: center; margin-top: 8px; }
</style>
