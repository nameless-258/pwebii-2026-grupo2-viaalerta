import { createApp } from 'vue'
import 'leaflet/dist/leaflet.css'
import './assets/styles/main.css'
import App from './App.vue'
import router from './router'
import { iniciarAuth } from './composables/useAuth'
import { carregarConfiguracao } from './composables/useConfiguracao'

// Carrega a sessão, as categorias e as regras antes de montar a app, para que as guardas de rota saibam quem é o utilizador
Promise.allSettled([iniciarAuth(), carregarConfiguracao()]).finally(() => {
  createApp(App).use(router).mount('#app')
})
