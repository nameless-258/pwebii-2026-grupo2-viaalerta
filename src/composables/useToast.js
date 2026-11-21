import { ref } from 'vue'

// Mensagens rápidas (toasts) de sucesso/erro, partilhadas por toda a app
const toasts = ref([])
let id = 0

export function useToast() {
  function mostrar(mensagem, tipo = 'info', duracao = 4500) {
    const t = { id: ++id, mensagem, tipo }
    toasts.value.push(t)
    setTimeout(() => fechar(t.id), duracao)
  }
  function fechar(tid) {
    toasts.value = toasts.value.filter((t) => t.id !== tid)
  }
  return {
    toasts,
    fechar,
    sucesso: (m) => mostrar(m, 'success'),
    erro: (m) => mostrar(m, 'error', 6500),
    info: (m) => mostrar(m, 'info'),
    aviso: (m) => mostrar(m, 'warning', 6500)
  }
}
