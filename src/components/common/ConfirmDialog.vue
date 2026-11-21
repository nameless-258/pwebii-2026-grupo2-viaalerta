<script setup>
// Janela de confirmação para acções importantes (ex.: rejeitar, marcar como resolvida)
import { ref, watch } from 'vue'

const props = defineProps({
  aberto: { type: Boolean, default: false },
  titulo: { type: String, default: 'Confirmar acção' },
  mensagem: { type: String, default: 'Tem a certeza?' },
  textoConfirmar: { type: String, default: 'Confirmar' },
  perigo: { type: Boolean, default: false },
  comNota: { type: Boolean, default: false },
  notaObrigatoria: { type: Boolean, default: false },
  rotuloNota: { type: String, default: 'Nota (opcional)' },
  aCarregar: { type: Boolean, default: false }
})
const emit = defineEmits(['confirmar', 'cancelar'])

const nota = ref('')
const erro = ref('')
watch(() => props.aberto, (v) => { if (v) { nota.value = ''; erro.value = '' } })

function confirmar() {
  if (props.notaObrigatoria && nota.value.trim().length < 5) {
    erro.value = 'Escreva uma nota com pelo menos 5 caracteres.'
    return
  }
  emit('confirmar', nota.value.trim())
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="aberto" class="overlay" @click.self="emit('cancelar')">
        <div class="dialog card" role="dialog" aria-modal="true" :aria-label="titulo">
          <h3>{{ titulo }}</h3>
          <p class="muted">{{ mensagem }}</p>
          <div v-if="comNota" class="field">
            <label for="nota-dialogo">{{ rotuloNota }}</label>
            <textarea id="nota-dialogo" v-model="nota" class="textarea" :class="{ invalid: erro }" rows="3"></textarea>
            <span v-if="erro" class="error">{{ erro }}</span>
          </div>
          <div class="acoes">
            <button class="btn btn-outline" type="button" :disabled="aCarregar" @click="emit('cancelar')">Cancelar</button>
            <button class="btn" :class="perigo ? 'btn-danger' : 'btn-primary'" type="button" :disabled="aCarregar" @click="confirmar">
              {{ aCarregar ? 'A processar…' : textoConfirmar }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(0, 0, 0, 0.45); display: grid; place-items: center; padding: 16px; }
.dialog { width: 100%; max-width: 460px; box-shadow: var(--shadow-lg); }
.acoes { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
</style>
