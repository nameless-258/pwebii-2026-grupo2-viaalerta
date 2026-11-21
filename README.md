# ViaAlerta

> **A tua voz. A nossa infraestrutura.**

O **ViaAlerta** é uma plataforma web de participação cidadã que permite denunciar problemas de infraestrutura em Moçambique — buracos nas estradas, passeios danificados, iluminação pública avariada, semáforos e sinais danificados e estradas destruídas pela erosão —, visualizá-los num mapa interativo e acompanhar o processo até à resolução.

Projecto Final de **Programação Web II** · ISUTC · Turma LECC31 · 2.º semestre de 2026 · **Grupo 2**.

| | |
|---|---|
| 🌐 **Aplicação (GitHub Pages)** | https://nameless-258.github.io/pwebii-2026-grupo2-viaalerta/ |
| 📦 **Repositório** | https://github.com/nameless-258/pwebii-2026-grupo2-viaalerta |
| 📄 **BRD** | `PF_Grupo2_PWEBII_2026.pdf` (entregue no LMS) |

---

## 1. O problema

Os problemas de infraestrutura urbana e rodoviária afectam diariamente a segurança e a mobilidade das pessoas em Moçambique. Hoje as queixas ficam dispersas (redes sociais, chamadas, conversas), sem localização exacta, sem fotografia, sem registo e sem forma de o cidadão saber se alguém está a tratar do assunto.

O ViaAlerta resolve uma parte concreta deste problema:

1. O cidadão **denuncia** pelo telemóvel, com fotografia, categoria e ponto exacto no mapa (pode ser **anónimo**);
2. Um **responsável autorizado verifica** a denúncia (aprova, rejeita ou pede mais informação);
3. Se aprovada, é **publicada automaticamente** no mapa e nas estatísticas públicas;
4. Quando o problema é **resolvido**, o pin **desaparece do mapa**, mas o histórico fica guardado;
5. O cidadão é **avisado por email** e por notificação na aplicação a cada mudança de estado.

## 2. Membros do grupo

| Membro | N.º de estudante | GitHub | Responsabilidade |
|---|---|---|---|
| José Dinis | 8216 | @JoseDinis7 | Fase 1 — Fundação, sistema visual e navegação |
| Karen Chavana | 8077 | @Potassio-aren | Fase 2 — Dashboard, mapa e dados de Moçambique |
| Milena Nhapulo | 7968 | @nameless-258 | Fase 3 — Autenticação e denúncias |
| Rooney Reis | 8066 | @rooneyreis | Fase 4 — Moderação, notificações, base de dados e publicação |

O detalhe de **quem fez o quê e em que ficheiros** está em [`CONTRIBUICOES.md`](CONTRIBUICOES.md).

## 3. Funcionalidades

- **Mapa interactivo de Moçambique** (Leaflet + OpenStreetMap) com limites provinciais, zoom, pins coloridos por categoria, legenda, popups e pesquisa de locais;
- **Filtros** por província, distrito, categoria, estado e texto; vista em **mapa** ou **lista** com "carregar mais";
- **Estatísticas públicas** (publicadas, em resolução, total activo) — nunca mostram pendentes ou rejeitadas;
- **Moçambique — contexto e infraestrutura**: população, acesso a estradas transitáveis (ODS 9.1.1), água potável e electricidade, distribuição urbana/rural e comparação urbano vs. rural, com ano, fonte e link de cada valor;
- **Criar conta / iniciar sessão / recuperar palavra-passe** (Supabase Auth);
- **Formulário de denúncia com validação**: GPS ou toque no mapa, província detectada automaticamente pelos limites oficiais, endereço sugerido pelo OpenStreetMap, fotografia **comprimida no telemóvel** antes do envio (poupa dados), opção de anonimato, referência `VA-AAAA-NNNN`;
- **Minhas denúncias**: estado, histórico, comentários dos responsáveis e resposta a pedidos de informação;
- **Funções separadas**: só o **cidadão** cria denúncias. O **responsável** e o **administrador** não criam denúncias — apenas verificam e publicam as denúncias dos cidadãos, mudam o seu estado e avisam o cidadão quando faltam dados (regra aplicada na interface e na base de dados);
- **Permissões por função** (aplicadas na interface **e** na base de dados):

  | Funcionalidade | Administrador | Responsável |
  |---|:---:|:---:|
  | Consultar denúncias, analisar fotografias e descrições | ✓ | ✓ |
  | Aprovar, rejeitar e solicitar informações adicionais | ✓ | ✓ |
  | Alterar estado para em resolução / marcar como resolvida | ✓ | ✓ |
  | Criar contas de responsáveis | ✓ | ✕ |
  | Atribuir funções e permissões | ✓ | ✕ |
  | Desactivar contas de utilizadores | ✓ | ✕ |
  | Consultar registos de auditoria | ✓ | ✕ |
  | Configurar categorias e regras do sistema | ✓ | ✕ |

- **Painel administrativo**: estatísticas internas, menu lateral por estado, tabela de moderação, análise detalhada e acções (iniciar análise, pedir dados em falta, aprovar, rejeitar, em resolução, resolvida) com registo do responsável e da data;
- **Administração** (apenas administradores): criar contas de responsáveis, atribuir funções, desactivar/reactivar contas, **registo de auditoria** de todas as acções e **configuração** de categorias (nome, cor, ícone, activa) e regras (fotografia obrigatória, anonimato, descrição mínima, tamanho da fotografia);
- **Notificações** na aplicação (sino) e por **email** (EmailJS);
- **Light Mode / Dark Mode** (respeita o tema do dispositivo e guarda a preferência);
- **Mobile-first**, responsivo, em português; **página 404**.

## 4. Fontes de dados de Moçambique (requisito R2)

O acesso a dados está em dois composables próprios: `src/composables/useMozambiqueData.js` (limites das províncias, distritos e pesquisa de endereços no Nominatim) e `src/composables/useMozambiqueIndicators.js` (indicadores do Banco Mundial e da ONU). Ambos usam `fetch()`, mostram estados de carregamento, erro e lista vazia, e guardam os dados em cache durante 24 horas para evitar pedidos repetidos.

| Fonte | Utilização | Origem / licença | Recolha |
|---|---|---|---|
| **API do Banco Mundial** — `api.worldbank.org/v2/country/MOZ/indicator/...` | Secção «Moçambique — contexto e infraestrutura»: população (`SP.POP.TOTL`), urbana/rural (`SP.URB.TOTL.IN.ZS`, `SP.RUR.TOTL.ZS`), electricidade total/urbana/rural (`EG.ELC.ACCS.ZS`, `.UR.ZS`, `.RU.ZS`) e serviço básico de água total/urbano/rural (`SH.H2O.BASW.ZS`, `.UR.ZS`, `.RU.ZS`). Último ano disponível; cache de 24 h. | Banco Mundial, CC BY 4.0 | Em tempo real |
| **API dos ODS da ONU** — `unstats.un.org/sdgapi` (série `SP_ROD_R2KM`) | Indicador 9.1.1, *Rural Access Index*: população rural a menos de 2 km de uma estrada transitável todo o ano. Se a API não responder, usa `public/dados/acesso_rural_estradas.json` (estimativa de 20,4% (ano de referência 2010) publicada pelo Banco Mundial em *Measuring Rural Access*). | Nações Unidas / Banco Mundial | Em tempo real / 21/11/2026 |
| **Limites das 11 províncias** — `public/dados/limites_mocambique.geojson` | Contornos no mapa, foco por província e **detecção automática da província** do ponto escolhido (ponto-em-polígono). | Natural Earth (domínio público), via pacote npm `@highcharts/map-collection` 2.3.3, reprojectado para WGS84 | 21/11/2026 |
| **Distritos por província** — `public/dados/distritos.json` | Listas de distritos nos filtros e no formulário. | Divisão administrativa oficial (INE / Portal do Governo), compilada pelo grupo | 21/11/2026 |
| **OpenStreetMap / Nominatim** — `nominatim.openstreetmap.org` (`countrycodes=mz`) | Pesquisa de locais em Moçambique e sugestão de rua/bairro a partir das coordenadas. | © Contribuidores do OpenStreetMap, ODbL | Em tempo real |
| **Mosaicos OpenStreetMap** | Mapa de fundo. | © OpenStreetMap, ODbL | Em tempo real |

As fontes são também indicadas no rodapé da aplicação.

## 5. Serviço de email (requisito R3)

**EmailJS** (envio a partir do browser com **chave pública**; o modelo da mensagem está configurado no painel do EmailJS e os domínios autorizados estão limitados ao nosso GitHub Pages). Código em `src/services/email.js` e `src/composables/useNotifications.js`.

Emails enviados (sempre desencadeados por uma acção do utilizador):

1. **Confirmação de denúncia** — quando o cidadão submete uma denúncia (com a referência);
2. **Actualização de estado** — quando um responsável aprova, rejeita, pede informação, inicia a resolução ou marca como resolvida.

Configuração passo a passo: [`docs/CONFIGURACAO.md`](docs/CONFIGURACAO.md).

### Fotografias dos dados de demonstração

As denúncias fictícias usam fotografias reais de problemas de infraestrutura em Moçambique, **obtidas na Internet** (rostos e matrículas desfocados pelo grupo), em `public/images/demo/` (`buraco_estrada_1..5.jpg`, `erosao_1..3.jpg`, `passeio_danificado_1..2.jpg`, `semaforo_sinal_1..4.jpg`, `iluminacao_avariada_1..3.jpg`), reduzidas para no máximo 1280 px.

| Ficheiros | Origem | Uso |
|---|---|---|
| `buraco_estrada_1..5.jpg`, `erosao_1..3.jpg`, `passeio_danificado_1..2.jpg`, `semaforo_sinal_1..4.jpg`, `iluminacao_avariada_1..3.jpg` | Imagens recolhidas na Internet; as páginas de origem não foram registadas | Uso exclusivamente académico e ilustrativo. Os direitos pertencem aos autores originais; rostos e matrículas foram desfocados pelo grupo |

Em respeito pela secção 9 do enunciado («Dados pessoais»), os rostos e as matrículas legíveis foram desfocados pelo grupo.

## 6. Tecnologias

Vue 3 (Composition API, `<script setup>`) · Vite · Vue Router (`createWebHashHistory`) · Supabase (Auth, PostgreSQL com Row Level Security, Storage, Realtime) · Leaflet + OpenStreetMap · EmailJS · GitHub Actions + GitHub Pages.

Bibliotecas externas: `vue`, `vue-router`, `@supabase/supabase-js`, `leaflet`. Tipografia: Inter (Google Fonts). Ícones desenhados pelo grupo (`src/constants/icones.js`).

## 7. Correr o projecto localmente

Requisitos: Node.js 20 ou superior.

```bash
git clone https://github.com/nameless-258/pwebii-2026-grupo2-viaalerta.git
cd pwebii-2026-grupo2-viaalerta
npm install
cp .env.example .env      # preencher os valores (ver abaixo)
npm run dev               # abre em http://localhost:5173
```

Outros comandos: `npm run build` (gera `dist/`) e `npm run preview`.

> **Modo demonstração:** se o `.env` não tiver as chaves do Supabase, a aplicação arranca automaticamente em modo demonstração, com dados **fictícios** guardados apenas no navegador (contas `cidadao@viaalerta.demo`, `responsavel@viaalerta.demo`, `admin@viaalerta.demo` — os botões de preenchimento aparecem na página de login). Serve apenas para testar sem servidor.

### Variáveis de ambiente (sem valores)

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública *anon* do Supabase (a segurança está nas políticas RLS) |
| `VITE_EMAILJS_PUBLIC_KEY` | Chave pública do EmailJS |
| `VITE_EMAILJS_SERVICE_ID` | ID do serviço de email no EmailJS |
| `VITE_EMAILJS_TEMPLATE_ID` | ID do modelo de mensagem no EmailJS |

O ficheiro `.env` está no `.gitignore` e **nunca** é enviado para o repositório. No GitHub Pages, os valores vêm dos *Repository secrets* (ver `.github/workflows/deploy.yml`).

## 8. Estrutura do projecto

```
public/dados/            datasets de Moçambique (GeoJSON, distritos) e dados fictícios de demonstração
supabase/schema.sql      tabelas, RLS, funções, triggers e bucket de fotografias
src/
  assets/styles/         sistema visual (main, light, dark)
  constants/             categorias, estados, funções, ícones
  services/              supabase, backendSupabase, localDb (demo), api, email
  composables/           useAuth, useIncidents, useMozambiqueData, useTheme, useNotifications, useAdmin, ...
  components/
    layout/              AppHeader, AppFooter, AppSidebar, AppLogo
    dashboard/           WelcomeSection, StatsOverview, StatCard, MozambiqueIndicators
    map/                 MozambiqueMap, MapFilters, MapPin, IncidentPopup
    incidents/           IncidentCard, IncidentForm, RecentIncidents, badges, ImageUploader, LocationPicker, IncidentTimeline
    admin/               AdminIncidentTable
    common/              SearchBar, FilterPanel, ThemeToggle, NotificationBell, Loading/Error/EmptyState, ConfirmDialog, ...
  views/                 12 páginas (Home, Incidents, IncidentDetails, Report, MyIncidents, About, Login, Register, AdminDashboard, IncidentManagement, UserManagement, NotFound)
  router/index.js        rotas, rota com parâmetro (/denuncias/:id), 404 e guardas
```

## 9. Segurança e privacidade

- As permissões são aplicadas **no Supabase** (Row Level Security e funções `security definer`), não só na interface: um cidadão não consegue publicar, alterar estados nem dar-se permissões, mesmo chamando a API directamente;
- As páginas públicas lêem apenas **vistas** sem `user_id` nem dados pessoais (`denuncias_publicas`, `historico_publico`, `estatisticas_publicas`);
- O **nome e o email do denunciante nunca aparecem publicamente**; em denúncias anónimas só o administrador os pode consultar, e apenas quando necessário;
- As **fotografias** estão num bucket privado; as de denúncias não aprovadas só são visíveis ao autor e aos responsáveis;
- Nenhuma chave secreta está no código ou no histórico do repositório.

## 10. Uso de ferramentas de IA

Em conformidade com a secção 9 do enunciado: o grupo utilizou o assistente **Claude (Anthropic)** como apoio na geração inicial de código Vue, do esquema SQL e da documentação, a partir da especificação escrita pelo grupo. Todo o código foi revisto, testado e adaptado pelos membros, que são responsáveis por ele e o compreendem. A divisão de trabalho está em [`CONTRIBUICOES.md`](CONTRIBUICOES.md).

## 11. Licença dos dados e créditos

Mapas © contribuidores do OpenStreetMap (ODbL) · Limites provinciais: Natural Earth (domínio público) · Indicadores: Banco Mundial (CC BY 4.0) · Biblioteca de mapas: Leaflet (BSD-2). As imagens e pessoas dos dados de demonstração são fictícias.
