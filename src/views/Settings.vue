<script setup>
// Configuração do sistema (apenas administradores): categorias de denúncia e regras.
import { ref, reactive, computed, watch } from 'vue'
import { CATEGORIAS, ICONES_CATEGORIA } from '@/constants/categorias'
import { useConfiguracao } from '@/composables/useConfiguracao'
import { useToast } from '@/composables/useToast'
import { formatarDataHora } from '@/composables/useFormat'
import MapPin from '@/components/map/MapPin.vue'
import AppIcon from '@/components/common/AppIcon.vue'

const { configuracao, guardarCategoria, guardarRegras } = useConfiguracao()
const toast = useToast()

// ---------- Categorias ----------
const ordenadas = computed(() => [...CATEGORIAS].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)))
const emEdicao = ref(null) // cópia da categoria a editar
const erroCat = ref('')
const aGuardarCat = ref(false)

const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)

function editar(c) {
  erroCat.value = ''
  emEdicao.value = { ...c, borda: c.borda || '', nova: false }
}
function nova() {
  erroCat.value = ''
  emEdicao.value = { id: '', nome: '', cor: '#2A5BD7', texto: '#FFFFFF', borda: '', icone: 'alerta', ativa: true, ordem: CATEGORIAS.length + 1, nova: true }
}

async function guardarCat() {
  const c = emEdicao.value
  if (c.nova) c.id = slug(c.nome)
  if (c.nome.trim().length < 3) { erroCat.value = 'O nome deve ter pelo menos 3 caracteres.'; return }
  if (c.id.length < 3) { erroCat.value = 'Nome inválido.'; return }
  if (c.nova && CATEGORIAS.some((x) => x.id === c.id)) { erroCat.value = 'Já existe uma categoria com este nome.'; return }
  if (!c.ativa && CATEGORIAS.filter((x) => x.ativa !== false && x.id !== c.id).length === 0) { erroCat.value = 'Tem de existir pelo menos uma categoria activa.'; return }
  aGuardarCat.value = true
  try {
    await guardarCategoria({ ...c, borda: c.borda || null })
    toast.sucesso(`Categoria «${c.nome}» guardada.`)
    emEdicao.value = null
  } catch (e) {
    erroCat.value = e.message
  } finally {
    aGuardarCat.value = false
  }
}

// ---------- Regras ----------
const regras = reactive({ fotoObrigatoria: true, permitirAnonimas: true, descricaoMin: 20, fotoMaxMb: 10 })
watch(() => configuracao.atualizadoEm, () => Object.assign(regras, {
  fotoObrigatoria: configuracao.fotoObrigatoria, permitirAnonimas: configuracao.permitirAnonimas,
  descricaoMin: configuracao.descricaoMin, fotoMaxMb: configuracao.fotoMaxMb
}), { immediate: true })
const erroRegras = ref('')
const aGuardarRegras = ref(false)

async function guardarR() {
  erroRegras.value = ''
  if (!(regras.descricaoMin >= 10 && regras.descricaoMin <= 300)) { erroRegras.value = 'A descrição mínima deve estar entre 10 e 300 caracteres.'; return }
  if (!(regras.fotoMaxMb >= 1 && regras.fotoMaxMb <= 20)) { erroRegras.value = 'O tamanho máximo da fotografia deve estar entre 1 e 20 MB.'; return }
  aGuardarRegras.value = true
  try {
    await guardarRegras({ ...regras, descricaoMin: Number(regras.descricaoMin), fotoMaxMb: Number(regras.fotoMaxMb) })
    toast.sucesso('Regras do sistema guardadas.')
  } catch (e) {
    erroRegras.value = e.message
  } finally {
    aGuardarRegras.value = false
  }
}
</script>

<template>
  <section class="container page">
    <RouterLink to="/admin" class="voltar"><AppIcon name="seta_esq" :size="18" /> Painel administrativo</RouterLink>
    <header class="page-header">
      <h1>Configuração do sistema</h1>
      <p>Categorias de denúncia e regras de submissão. Todas as alterações ficam no registo de auditoria.</p>
    </header>

    <div class="grelha">
      <section class="card">
        <div class="section-title">
          <h2>Categorias</h2>
          <button class="btn btn-primary btn-sm" type="button" @click="nova"><AppIcon name="mais" :size="16" /> Nova categoria</button>
        </div>
        <p class="small muted">A cor e o ícone de cada categoria são usados no mapa, na legenda e nos cartões. Categorias desactivadas deixam de aparecer no formulário, mas as denúncias antigas continuam visíveis.</p>
        <ul class="cats">
          <li v-for="c in ordenadas" :key="c.id" :class="{ off: c.ativa === false }">
            <MapPin :categoria="c.id" :tamanho="28" />
            <div class="info">
              <strong>{{ c.nome }}</strong>
              <span class="small muted">{{ c.id }} · ordem {{ c.ordem }}</span>
            </div>
            <span class="badge" :class="c.ativa === false ? 'desat' : 'ativa'">{{ c.ativa === false ? 'Desactivada' : 'Activa' }}</span>
            <button class="btn btn-outline btn-sm" type="button" @click="editar(c)">Editar</button>
          </li>
        </ul>

        <form v-if="emEdicao" class="edicao card-flat" novalidate @submit.prevent="guardarCat">
          <h3>{{ emEdicao.nova ? 'Nova categoria' : `Editar «${emEdicao.nome}»` }}</h3>
          <div class="campos">
            <div class="field nome">
              <label for="c-nome">Nome</label>
              <input id="c-nome" v-model="emEdicao.nome" class="input" maxlength="60" />
              <span v-if="emEdicao.nova && emEdicao.nome" class="hint">Identificador: {{ slug(emEdicao.nome) }}</span>
            </div>
            <div class="field">
              <label for="c-cor">Cor do pin</label>
              <input id="c-cor" v-model="emEdicao.cor" type="color" class="cor" />
            </div>
            <div class="field">
              <label for="c-txt">Cor do ícone</label>
              <input id="c-txt" v-model="emEdicao.texto" type="color" class="cor" />
            </div>
            <div class="field">
              <label for="c-ico">Ícone</label>
              <select id="c-ico" v-model="emEdicao.icone" class="select">
                <option v-for="i in ICONES_CATEGORIA" :key="i" :value="i">{{ i }}</option>
              </select>
            </div>
            <div class="field">
              <label for="c-ord">Ordem</label>
              <input id="c-ord" v-model.number="emEdicao.ordem" type="number" min="0" max="99" class="input" />
            </div>
          </div>
          <div class="row">
            <span class="preview" :style="{ background: emEdicao.cor, color: emEdicao.texto, borderColor: emEdicao.borda || '#fff' }"><AppIcon :name="emEdicao.icone" :size="16" /></span>
            <label class="checkbox"><input v-model="emEdicao.ativa" type="checkbox" /> Categoria activa</label>
            <label class="checkbox"><input type="checkbox" :checked="!!emEdicao.borda" @change="emEdicao.borda = $event.target.checked ? '#1A1A1A' : ''" /> Borda escura (para cores claras)</label>
          </div>
          <p v-if="erroCat" class="error small">{{ erroCat }}</p>
          <div class="row">
            <button class="btn btn-primary" type="submit" :disabled="aGuardarCat">{{ aGuardarCat ? 'A guardar…' : 'Guardar categoria' }}</button>
            <button class="btn btn-ghost" type="button" @click="emEdicao = null">Cancelar</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h2>Regras de submissão</h2>
        <p class="small muted">Aplicadas no formulário do cidadão e verificadas também na base de dados.</p>
        <form novalidate @submit.prevent="guardarR">
          <label class="checkbox regra"><input v-model="regras.fotoObrigatoria" type="checkbox" /> <span><strong>Fotografia obrigatória</strong><br /><span class="small muted">O cidadão tem de anexar uma fotografia do problema.</span></span></label>
          <label class="checkbox regra"><input v-model="regras.permitirAnonimas" type="checkbox" /> <span><strong>Permitir denúncias anónimas</strong><br /><span class="small muted">Mostra a opção «Denúncia anónima» no formulário.</span></span></label>
          <div class="field">
            <label for="r-desc">Descrição mínima (caracteres)</label>
            <input id="r-desc" v-model.number="regras.descricaoMin" type="number" min="10" max="300" class="input" />
          </div>
          <div class="field">
            <label for="r-foto">Tamanho máximo da fotografia original (MB)</label>
            <input id="r-foto" v-model.number="regras.fotoMaxMb" type="number" min="1" max="20" class="input" />
            <span class="hint">A fotografia é comprimida no telemóvel antes do envio.</span>
          </div>
          <p v-if="erroRegras" class="error small">{{ erroRegras }}</p>
          <button class="btn btn-primary" type="submit" :disabled="aGuardarRegras">{{ aGuardarRegras ? 'A guardar…' : 'Guardar regras' }}</button>
          <p v-if="configuracao.atualizadoEm" class="small muted mt">Última alteração: {{ formatarDataHora(configuracao.atualizadoEm) }}</p>
        </form>
      </section>
    </div>
  </section>
</template>

<style scoped>
.voltar { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 16px; font-weight: 500; }
.grelha { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 1000px) { .grelha { grid-template-columns: 1.5fr 1fr; align-items: start; } }
h2 { font-size: 1.15rem; }
.cats { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-direction: column; gap: 8px; }
.cats li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; }
.cats li.off { opacity: 0.6; }
.info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.desat { background: var(--red-soft); color: var(--red); }
.ativa { background: var(--primary-soft); color: var(--primary); }
.edicao { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.edicao h3 { margin: 0; }
.campos { display: grid; gap: 0 12px; grid-template-columns: 1fr 1fr; }
.campos .nome { grid-column: 1 / -1; }
@media (min-width: 700px) { .campos { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; } .campos .nome { grid-column: auto; } }
.cor { width: 100%; height: 46px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); padding: 4px; cursor: pointer; }
.preview { width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: grid; place-items: center; border: 2.5px solid; }
.preview :deep(svg) { transform: rotate(45deg); }
.regra { margin-bottom: 14px; }
.mt { margin: 10px 0 0; }
</style>
