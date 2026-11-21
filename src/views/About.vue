<script setup>
import AppIcon from '@/components/common/AppIcon.vue'
import { categoriasAtivas } from '@/constants/categorias'

const PERMISSOES = [
  ['Consultar denúncias', true, true],
  ['Analisar fotografias e descrições', true, true],
  ['Aprovar denúncias', true, true],
  ['Rejeitar denúncias', true, true],
  ['Solicitar informações adicionais', true, true],
  ['Alterar estado para em resolução', true, true],
  ['Marcar denúncia como resolvida', true, true],
  ['Criar contas de responsáveis', true, false],
  ['Atribuir funções e permissões', true, false],
  ['Desactivar contas de utilizadores', true, false],
  ['Consultar registos de auditoria', true, false],
  ['Configurar categorias e regras do sistema', true, false]
]

const passos = [
  { titulo: 'Submissão', texto: 'O cidadão cria conta, fotografa o problema, indica a categoria e marca a localização no mapa. A denúncia fica privada e pendente.' },
  { titulo: 'Verificação', texto: 'Um responsável autorizado analisa a fotografia, a descrição e a localização. Pode aprovar, rejeitar ou avisar o cidadão de que faltam dados. Responsáveis e administradores não criam denúncias: apenas gerem as dos cidadãos.' },
  { titulo: 'Publicação', texto: 'Quando aprovada, a denúncia é publicada automaticamente: aparece no mapa público, nas listas e nas estatísticas.' },
  { titulo: 'Resolução', texto: 'Enquanto o problema é tratado o pin continua visível. Quando é marcado como resolvido, desaparece do mapa, mas o histórico fica guardado.' }
]
</script>

<template>
  <section class="container page about">
    <header class="page-header">
      <h1>Sobre o ViaAlerta</h1>
      <p>A tua voz. A nossa infraestrutura.</p>
    </header>

    <div class="grid two">
      <article class="card">
        <h2>O que é</h2>
        <p>O ViaAlerta é uma plataforma web de participação cidadã que permite denunciar problemas de infraestrutura urbana e rodoviária em Moçambique, visualizá-los num mapa interativo e acompanhar o seu processo de resolução.</p>
        <h3>Que problema resolve</h3>
        <p>Buracos, passeios partidos, iluminação avariada, semáforos danificados e estradas destruídas pela erosão afectam diariamente a segurança e a mobilidade das pessoas. Hoje, estas queixas ficam dispersas em redes sociais, chamadas e conversas, sem registo, sem localização exacta e sem forma de saber se alguém está a tratar do assunto.</p>
        <p class="mb0">O ViaAlerta centraliza as denúncias, garante que são verificadas antes de serem publicadas e torna visível o seu estado até à resolução.</p>
      </article>
      <article class="card">
        <h2>Objectivos</h2>
        <ul class="lista">
          <li><AppIcon name="check" :size="18" /> Dar a cada cidadão um canal simples, pensado para o telemóvel, para reportar problemas.</li>
          <li><AppIcon name="check" :size="18" /> Fornecer aos responsáveis informação georreferenciada e com fotografia.</li>
          <li><AppIcon name="check" :size="18" /> Tornar público o progresso, aumentando a transparência.</li>
          <li><AppIcon name="check" :size="18" /> Proteger a identidade de quem denuncia.</li>
        </ul>
        <h3>Categorias</h3>
        <div class="cats">
          <span v-for="c in categoriasAtivas()" :key="c.id" class="cat">
            <span class="ponto" :style="{ background: c.cor, borderColor: c.borda || c.cor }"></span>{{ c.nome }}
          </span>
        </div>
      </article>
    </div>

    <section class="section">
      <h2>Como funciona</h2>
      <ol class="passos">
        <li v-for="(p, i) in passos" :key="p.titulo" class="card">
          <span class="num">{{ i + 1 }}</span>
          <h3>{{ p.titulo }}</h3>
          <p class="muted mb0">{{ p.texto }}</p>
        </li>
      </ol>
    </section>

    <section class="section">
      <h2>Funções e permissões</h2>
      <p class="muted">Cidadãos criam e acompanham denúncias. Responsáveis e administradores não criam denúncias: verificam e gerem as dos cidadãos.</p>
      <div class="table-wrap">
        <table class="table perm">
          <thead><tr><th>Funcionalidade</th><th>Administrador</th><th>Responsável</th></tr></thead>
          <tbody>
            <tr v-for="p in PERMISSOES" :key="p[0]">
              <td>{{ p[0] }}</td>
              <td><span :class="p[1] ? 'sim' : 'nao'">{{ p[1] ? '✓' : '✕' }}</span></td>
              <td><span :class="p[2] ? 'sim' : 'nao'">{{ p[2] ? '✓' : '✕' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="privacidade" class="section grid two">
      <article class="card">
        <h2><AppIcon name="escudo" /> Anonimato e privacidade</h2>
        <p>O nome e o email de quem denuncia <strong>nunca</strong> aparecem nas páginas públicas — mesmo que a denúncia não seja anónima.</p>
        <p>Ao marcar a opção «Denúncia anónima», os responsáveis também não vêem a sua identidade, excepto o pessoal autorizado quando for estritamente necessário. Em qualquer caso, o sistema mantém a ligação interna à sua conta para que possa acompanhar a denúncia.</p>
        <p class="mb0">As fotografias de denúncias ainda não aprovadas ficam privadas.</p>
      </article>
      <article id="termos" class="card">
        <h2>Termos de utilização</h2>
        <p>Ao utilizar o ViaAlerta compromete-se a submeter apenas informação verdadeira, sem dados pessoais de terceiros nem imagens ofensivas. Denúncias falsas ou abusivas são rejeitadas.</p>
        <h3>Contactos</h3>
        <p class="mb0">contacto@viaalerta.co.mz (fictício) · Maputo, Moçambique</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.two { grid-template-columns: 1fr; }
@media (min-width: 860px) { .two { grid-template-columns: 1fr 1fr; } }
.mb0 { margin-bottom: 0; }
.perm td:not(:first-child), .perm th:not(:first-child) { text-align: center; width: 140px; }
.sim { color: var(--primary); font-weight: 800; }
.nao { color: var(--red); font-weight: 800; }
h2 { display: flex; align-items: center; gap: 8px; }
.lista { list-style: none; padding: 0; margin: 0 0 18px; display: flex; flex-direction: column; gap: 10px; }
.lista li { display: flex; gap: 10px; align-items: flex-start; }
.lista :deep(svg) { color: var(--primary); margin-top: 2px; }
.cats { display: flex; flex-wrap: wrap; gap: 8px; }
.cat { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: var(--surface-2); font-size: 0.85rem; }
.ponto { width: 12px; height: 12px; border-radius: 50%; border: 2px solid; }
.passos { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 700px) { .passos { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .passos { grid-template-columns: repeat(4, 1fr); } }
.num { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--primary); color: var(--primary-contrast); font-weight: 800; margin-bottom: 10px; }
</style>
