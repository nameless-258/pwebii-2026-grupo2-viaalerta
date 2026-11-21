# Contribuições do grupo — Grupo 2 (LECC31)

O projecto foi desenvolvido em **4 fases**, uma por membro. Cada membro trabalhou no seu próprio *branch* e integrou o trabalho no `main` através de um *pull request* revisto por outro membro (opção *Create a merge commit*).

| Fase | Membro | Branch | Pull request | Revisto por |
|---|---|---|---|---|
| 1. Fundação, sistema visual e navegação | José Dinis (n.º 8216, @JoseDinis7) | `pessoa1/fundacao-e-layout` | #1 | Karen Chavana |
| 2. Dashboard, mapa interactivo e dados de Moçambique | Karen Chavana (n.º 8077, @Potassio-aren) | `pessoa2/mapa-e-dashboard` | #2 | Milena Nhapulo |
| 3. Autenticação e submissão/acompanhamento de denúncias | Milena Nhapulo (n.º 7968, @nameless-258) | `pessoa3/autenticacao-e-denuncias` | #3 | Rooney Reis |
| 4. Moderação, notificações, base de dados e publicação | Rooney Reis (n.º 8066, @rooneyreis) | `pessoa4/admin-notificacoes-deploy` | #4 | José Dinis |

## José Dinis (n.º 8216, @JoseDinis7)

**Fase 1: Fundação, sistema visual e navegação** · branch `pessoa1/fundacao-e-layout`

**Responsável por:**

- Configuração inicial do projecto Vue 3 + Vite (commit inicial no `main`)
- Sistema visual global: cores da bandeira, tipografia, Light/Dark Mode (`useTheme`)
- Cabeçalho responsivo com menu móvel, rodapé com fontes de dados, logótipo
- Vue Router com hash history, rota com parâmetro, página 404 e guardas de navegação
- Componentes de estado reutilizáveis (carregamento, erro, vazio), diálogo de confirmação e toasts
- Constantes de categorias/estados/funções e biblioteca de ícones SVG
- Páginas Sobre (processo, funções e permissões, anonimato, termos) e 404; README
- Configuração do sistema: categorias reactivas (nome, cor, ícone) e regras de submissão editáveis pelo administrador (`useConfiguracao`, página Configuração)

**Ficheiros:**

- `.env.example`
- `.gitignore`
- `.vscode/extensions.json`
- `README.md`
- `index.html`
- `package-lock.json`
- `package.json`
- `public/favicon.svg`
- `src/App.vue`
- `src/assets/styles/dark.css`
- `src/assets/styles/light.css`
- `src/assets/styles/main.css`
- `src/components/common/AppIcon.vue`
- `src/components/common/ConfirmDialog.vue`
- `src/components/common/EmptyState.vue`
- `src/components/common/ErrorState.vue`
- `src/components/common/LoadingState.vue`
- `src/components/common/ThemeToggle.vue`
- `src/components/common/ToastHost.vue`
- `src/components/layout/AppFooter.vue`
- `src/components/layout/AppHeader.vue`
- `src/components/layout/AppLogo.vue`
- `src/composables/useConfiguracao.js`
- `src/composables/useFormat.js`
- `src/composables/useTheme.js`
- `src/composables/useToast.js`
- `src/constants/categorias.js`
- `src/constants/estados.js`
- `src/constants/funcoes.js`
- `src/constants/icones.js`
- `src/main.js`
- `src/router/index.js`
- `src/views/About.vue`
- `src/views/NotFound.vue`
- `src/views/Settings.vue`
- `vite.config.js`

## Karen Chavana (n.º 8077, @Potassio-aren)

**Fase 2: Dashboard, mapa interactivo e dados de Moçambique** · branch `pessoa2/mapa-e-dashboard`

**Responsável por:**

- Integração dos dados de Moçambique (`useMozambiqueData`): GeoJSON das províncias, distritos, API do Banco Mundial e Nominatim, com carregamento/erro/vazio e cache
- Mapa interactivo com Leaflet: pins por categoria a partir das coordenadas reais, legenda, popups, limites provinciais, foco por província e pesquisa de locais
- Filtros (pesquisa, província, distrito, categoria, estado) e painel de filtros móvel
- Página inicial: boas-vindas, estatísticas públicas, mapa, secção «Moçambique — contexto e infraestrutura» (`useMozambiqueIndicators`, componentes em `components/context/`) e denúncias recentes
- Páginas Explorar denúncias (mapa/lista, paginação, filtros no URL) e Detalhes da denúncia com mini-mapa e histórico público
- Cartões e badges de categoria/estado

**Ficheiros:**

- `public/dados/acesso_rural_estradas.json`
- `public/dados/distritos.json`
- `public/dados/limites_mocambique.geojson`
- `src/components/common/FilterPanel.vue`
- `src/components/common/SearchBar.vue`
- `src/components/context/DataSources.vue`
- `src/components/context/ElectricityCard.vue`
- `src/components/context/InfrastructureContext.vue`
- `src/components/context/InfrastructureIndicatorCard.vue`
- `src/components/context/PopulationCard.vue`
- `src/components/context/PopulationDistribution.vue`
- `src/components/context/RoadAccessCard.vue`
- `src/components/context/SectionHeader.vue`
- `src/components/context/UrbanRuralComparison.vue`
- `src/components/context/WaterAccessCard.vue`
- `src/components/dashboard/StatCard.vue`
- `src/components/dashboard/StatsOverview.vue`
- `src/components/dashboard/WelcomeSection.vue`
- `src/components/incidents/CategoryBadge.vue`
- `src/components/incidents/IncidentCard.vue`
- `src/components/incidents/IncidentTimeline.vue`
- `src/components/incidents/RecentIncidents.vue`
- `src/components/incidents/StatusBadge.vue`
- `src/components/map/IncidentPopup.vue`
- `src/components/map/MapFilters.vue`
- `src/components/map/MapPin.vue`
- `src/components/map/MozambiqueMap.vue`
- `src/composables/useMozambiqueData.js`
- `src/composables/useMozambiqueIndicators.js`
- `src/views/Home.vue`
- `src/views/IncidentDetails.vue`
- `src/views/Incidents.vue`

## Milena Nhapulo (n.º 7968, @nameless-258)

**Fase 3: Autenticação e submissão/acompanhamento de denúncias** · branch `pessoa3/autenticacao-e-denuncias`

**Responsável por:**

- Camada de dados: cliente Supabase, backend Supabase (Auth, PostgreSQL, Storage, Realtime) e modo demonstração local com a mesma interface
- Autenticação (`useAuth`): criar conta, iniciar sessão, recuperar palavra-passe, perfil e funções
- Formulário de denúncia com validação completa, GPS/toque no mapa, detecção automática de província/endereço, upload e compressão de fotografia, anonimato
- Confirmação com referência `VA-AAAA-NNNN`
- Página Minhas denúncias: estado, histórico, comentários e resposta a pedidos de informação
- Dados fictícios de demonstração

**Ficheiros:**

- `public/dados/denuncias_demo.json`
- `public/images/demo/buraco_estrada_1.jpg`
- `public/images/demo/buraco_estrada_2.jpg`
- `public/images/demo/buraco_estrada_3.jpg`
- `public/images/demo/buraco_estrada_4.jpg`
- `public/images/demo/buraco_estrada_5.jpg`
- `public/images/demo/erosao_1.jpg`
- `public/images/demo/erosao_2.jpg`
- `public/images/demo/erosao_3.jpg`
- `public/images/demo/iluminacao_avariada_1.jpg`
- `public/images/demo/iluminacao_avariada_2.jpg`
- `public/images/demo/iluminacao_avariada_3.jpg`
- `public/images/demo/passeio_danificado_1.jpg`
- `public/images/demo/passeio_danificado_2.jpg`
- `public/images/demo/semaforo_sinal_1.jpg`
- `public/images/demo/semaforo_sinal_2.jpg`
- `public/images/demo/semaforo_sinal_3.jpg`
- `public/images/demo/semaforo_sinal_4.jpg`
- `src/components/incidents/ImageUploader.vue`
- `src/components/incidents/IncidentForm.vue`
- `src/components/incidents/LocationPicker.vue`
- `src/composables/useAuth.js`
- `src/composables/useIncidents.js`
- `src/services/api.js`
- `src/services/backendSupabase.js`
- `src/services/localDb.js`
- `src/services/supabase.js`
- `src/views/Login.vue`
- `src/views/MyIncidents.vue`
- `src/views/Register.vue`
- `src/views/Report.vue`

## Rooney Reis (n.º 8066, @rooneyreis)

**Fase 4: Moderação, notificações, base de dados e publicação** · branch `pessoa4/admin-notificacoes-deploy`

**Responsável por:**

- Esquema Supabase (`schema.sql`): tabelas, Row Level Security, funções `alterar_estado`/`responder_pedido`/`alterar_funcao`, triggers, vistas públicas sem dados pessoais, bucket privado de fotografias e tempo real
- Integração de email com EmailJS (confirmação de denúncia e mudança de estado) sem chaves secretas
- Notificações na aplicação (sino) e `useNotifications`
- Painel administrativo: estatísticas internas, menu lateral, tabela de moderação, página de análise com acções e registo
- Gestão de utilizadores: criar contas de responsáveis, atribuir funções, desactivar/reactivar contas
- Registo de auditoria de todas as acções de moderação e administração (tabela `auditoria`, página Auditoria)
- Publicação automática no GitHub Pages com GitHub Actions e documentação de configuração

**Ficheiros:**

- `.github/workflows/deploy.yml`
- `docs/CONFIGURACAO.md`
- `src/components/admin/AdminIncidentTable.vue`
- `src/components/common/NotificationBell.vue`
- `src/components/layout/AppSidebar.vue`
- `src/composables/useAdmin.js`
- `src/composables/useNotifications.js`
- `src/services/email.js`
- `src/views/AdminDashboard.vue`
- `src/views/AuditLog.vue`
- `src/views/IncidentManagement.vue`
- `src/views/UserManagement.vue`
- `supabase/schema.sql`
- `CONTRIBUICOES.md`

---

**Ordem de integração no `main`:** Fase 1 → Fase 2 → Fase 3 → Fase 4 (cada fase usa o trabalho das anteriores).

**Uso de IA:** ver a secção «Uso de ferramentas de IA» do README.
