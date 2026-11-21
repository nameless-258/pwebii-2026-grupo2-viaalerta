<script setup>
// Upload de fotografia com validação de formato/tamanho e compressão no próprio telemóvel
// (reduz o consumo de dados móveis antes do envio).
import { ref, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps({
  modelValue: { type: Object, default: null }, // File
  erro: { type: String, default: '' },
  maxMb: { type: Number, default: 10 },
  obrigatoria: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'erro'])

const FORMATOS = ['image/jpeg', 'image/png', 'image/webp']
const LADO_MAX = 1280

const preview = ref(null)
const aProcessar = ref(false)
const info = ref('')
const input = ref(null)

function comprimir(ficheiro) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(ficheiro)
    img.onload = () => {
      const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' })) : reject(new Error('Falha ao comprimir'))),
        'image/jpeg',
        0.75
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')) }
    img.src = url
  })
}

async function escolher(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!FORMATOS.includes(f.type)) {
    emit('erro', 'Formato não permitido. Use JPG, PNG ou WEBP.')
    e.target.value = ''
    return
  }
  if (f.size > props.maxMb * 1024 * 1024) {
    emit('erro', `A fotografia é demasiado grande (máximo ${props.maxMb} MB).`)
    e.target.value = ''
    return
  }
  aProcessar.value = true
  try {
    const comp = await comprimir(f)
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = URL.createObjectURL(comp)
    info.value = `${(f.size / 1024).toFixed(0)} KB → ${(comp.size / 1024).toFixed(0)} KB após compressão`
    emit('erro', '')
    emit('update:modelValue', comp)
  } catch {
    emit('erro', 'Não foi possível processar a imagem. Tente outra fotografia.')
  } finally {
    aProcessar.value = false
  }
}

function remover() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
  info.value = ''
  if (input.value) input.value.value = ''
  emit('update:modelValue', null)
}

onBeforeUnmount(() => { if (preview.value) URL.revokeObjectURL(preview.value) })
</script>

<template>
  <div class="uploader" :class="{ invalido: props.erro }">
    <div v-if="preview" class="preview">
      <img :src="preview" alt="Pré-visualização da fotografia" />
      <div class="barra">
        <span class="small muted">{{ info }}</span>
        <button class="btn btn-outline btn-sm" type="button" @click="remover"><AppIcon name="lixo" :size="15" /> Remover</button>
      </div>
    </div>
    <label v-else class="zona">
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" class="sr-only" @change="escolher" />
      <AppIcon name="camera" :size="30" />
      <strong>{{ aProcessar ? 'A processar…' : 'Tirar ou escolher fotografia' }}</strong>
      <span class="small muted">JPG, PNG ou WEBP · máx. {{ maxMb }} MB{{ obrigatoria ? '' : ' · opcional' }}</span>
    </label>
  </div>
</template>

<style scoped>
.zona { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; border: 2px dashed var(--border); border-radius: 12px; cursor: pointer; text-align: center; color: var(--text-muted); background: var(--surface-2); }
.zona:hover { border-color: var(--primary); color: var(--primary); }
.invalido .zona { border-color: var(--red); }
.preview { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.preview img { width: 100%; max-height: 280px; object-fit: cover; }
.barra { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; flex-wrap: wrap; }
</style>
