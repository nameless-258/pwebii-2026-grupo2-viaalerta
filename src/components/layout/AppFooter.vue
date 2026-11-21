<script setup>
import AppLogo from './AppLogo.vue'
const ano = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container grid-footer">
      <div>
        <AppLogo com-slogan />
        <p class="muted small descr">Plataforma de participação cidadã para identificar e acompanhar problemas de infraestrutura em Moçambique.</p>
      </div>
      <div>
        <h4>Navegação</h4>
        <RouterLink to="/">Início</RouterLink>
        <RouterLink to="/denuncias">Explorar denúncias</RouterLink>
        <RouterLink to="/sobre">Sobre</RouterLink>
      </div>
      <div>
        <h4>Contactos</h4>
        <span>contacto@viaalerta.co.mz <span class="muted">(fictício)</span></span>
        <span>Maputo, Moçambique</span>
        <RouterLink to="/sobre#privacidade">Política de privacidade</RouterLink>
        <RouterLink to="/sobre#termos">Termos de utilização</RouterLink>
      </div>
      <div>
        <h4>Fontes de dados</h4>
        <a href="https://data.worldbank.org/country/mozambique" target="_blank" rel="noopener">Banco Mundial — indicadores de Moçambique</a>
        <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth — limites provinciais</a>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap / Nominatim</a>
      </div>
    </div>
    <div class="container base small muted">
      © {{ ano }} ViaAlerta · Projecto Final de Programação Web II — ISUTC · Todos os direitos reservados.
    </div>
  </footer>
</template>

<style scoped>
.footer { margin-top: 48px; background: var(--surface); border-top: 1px solid var(--border); padding-top: 32px; }
.grid-footer { display: grid; gap: 24px; grid-template-columns: 1fr; }
@media (min-width: 700px) { .grid-footer { grid-template-columns: 1.4fr 1fr 1fr 1.2fr; } }
.grid-footer > div { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
.grid-footer a { color: var(--text-muted); }
.grid-footer a:hover { color: var(--primary); }
h4 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.descr { margin-top: 10px; max-width: 320px; }
.base { border-top: 1px solid var(--border); margin-top: 28px; padding-top: 16px; padding-bottom: 20px; }
</style>
