# Configuração: Supabase, EmailJS e GitHub Pages

## 1. Supabase (base de dados, autenticação e fotografias)

1. Criar conta em https://supabase.com → **New project** (região mais próxima: *South Africa* ou *West EU*).
2. **SQL Editor → New query** → colar todo o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) → **Run**.
   Cria as tabelas, as políticas RLS, as funções (`alterar_estado`, `responder_pedido`, `alterar_funcao`), os triggers, as vistas públicas, o canal de tempo real e o bucket privado `fotos`.
3. **Authentication → URL Configuration**:
   - *Site URL*: `https://nameless-258.github.io/pwebii-2026-grupo2-viaalerta/`
   - *Redirect URLs*: acrescentar também `http://localhost:5173/`
4. (Opcional, para testes rápidos) **Authentication → Providers → Email**: desactivar *Confirm email*.
5. **Project Settings → API**: copiar *Project URL* → `VITE_SUPABASE_URL` e *anon public key* → `VITE_SUPABASE_ANON_KEY`.
6. Criar a vossa conta na aplicação e torná-la administradora no SQL Editor:
   ```sql
   update public.profiles set funcao = 'admin' where email = 'o-vosso-email@exemplo.com';
   ```
   A partir daí, os restantes responsáveis são promovidos na página **Gestão de utilizadores**.

## 2. EmailJS (envio de emails)

1. Criar conta em https://www.emailjs.com (plano gratuito: 200 emails/mês).
2. **Email Services → Add New Service** → Gmail (ou outro) → ligar a conta → copiar o **Service ID**.
3. **Email Templates → Create New Template**:
   - *To Email*: `{{to_email}}`
   - *Subject*: `{{assunto}}`
   - *Content*:
     ```
     Olá {{to_name}},

     {{mensagem}}

     Referência: {{referencia}}
     Estado actual: {{estado}}
     Acompanhe aqui: {{link}}

     — ViaAlerta · A tua voz. A nossa infraestrutura.
     ```
   - Guardar e copiar o **Template ID**.
4. **Account → General**: copiar a **Public Key**.
5. **Account → Security**: em *Allowed origins* colocar apenas `https://UTILIZADOR.github.io` (e `http://localhost:5173` durante o desenvolvimento).
6. Colocar os três valores em `VITE_EMAILJS_PUBLIC_KEY`, `VITE_EMAILJS_SERVICE_ID` e `VITE_EMAILJS_TEMPLATE_ID`.

> Para a demonstração, usar os vossos próprios emails (nunca dados pessoais de terceiros).

## 3. Variáveis locais

```bash
cp .env.example .env   # preencher os 5 valores
npm run dev
```

## 4. GitHub Pages

1. **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret** — criar os 5 secrets com os mesmos nomes do `.env.example`.
3. Cada merge no `main` publica automaticamente (workflow `.github/workflows/deploy.yml`). O `base` do Vite é definido automaticamente com o nome do repositório.
4. O link fica em **Settings → Pages** (ex.: `https://nameless-258.github.io/pwebii-2026-grupo2-viaalerta/`). Actualizar o link no README e na capa do BRD.
