import { ref, watch } from 'vue'

const CHAVE = 'viaalerta-tema'

function temaInicial() {
  try {
    const guardado = localStorage.getItem(CHAVE)
    if (guardado === 'light' || guardado === 'dark') return guardado
  } catch { /* localStorage indisponível */ }
  // Primeira visita: respeitar o tema do dispositivo
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Estado partilhado por toda a aplicação (singleton)
const tema = ref(temaInicial())

watch(
  tema,
  (valor) => {
    document.documentElement.setAttribute('data-theme', valor)
    try { localStorage.setItem(CHAVE, valor) } catch { /* ignorar */ }
  },
  { immediate: true }
)

export function useTheme() {
  const alternar = () => { tema.value = tema.value === 'dark' ? 'light' : 'dark' }
  return { tema, alternar }
}
