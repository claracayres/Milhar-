# Milhare

Site estatico com painel administrativo, backend em Vercel Functions e dados no Supabase.

## Estrutura

```txt
.
├── index.html                 # Site publico
├── admin.html                 # Painel administrativo
├── assets/
│   ├── css/
│   │   ├── site.css           # Estilos do site publico
│   │   └── admin.css          # Estilos do painel
│   └── js/
│       ├── site.js            # Interacoes e leitura publica
│       └── admin.js           # Auth e CRUD do painel
├── api/                       # Vercel Functions
│   ├── cardapio.js
│   ├── cardapio/[id].js
│   ├── venda-dia.js
│   ├── venda-dia/[id].js
│   └── config.js
├── lib/                       # Helpers server-side das APIs
├── supabase/
│   ├── migrations/            # Schema SQL
│   └── seed.sql               # Dados iniciais
├── vercel.json                # Rotas e headers da Vercel
└── package.json
```

## O que ficou integrado

- `GET /api/cardapio`: lista itens ativos para o site publico.
- `POST /api/cardapio` e `/api/cardapio/:id`: CRUD protegido para o admin.
- `GET /api/venda-dia`: venda ativa do dia para o site publico.
- `POST /api/venda-dia` e `/api/venda-dia/:id`: gerenciamento protegido para o admin.
- `GET /api/config`: entrega apenas a URL publica e anon key do Supabase para login no painel.

## Supabase

1. Crie um projeto no Supabase.
2. Rode `supabase/migrations/20260507170000_initial_schema.sql` no SQL Editor.
3. Rode `supabase/seed.sql` para popular o cardapio inicial.
4. Em Authentication, crie o usuario administrador com email e senha.
5. Copie em Project Settings > API:
   - Project URL para `SUPABASE_URL`
   - anon public para `SUPABASE_ANON_KEY`
   - service_role secret para `SUPABASE_SERVICE_ROLE_KEY`

## Vercel

Configure as variaveis de ambiente no projeto da Vercel:

```txt
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAILS
```

`ADMIN_EMAILS` deve ser uma lista separada por virgulas com os emails que podem usar o painel, por exemplo:

```txt
admin@milhare.com,maria@milhare.com
```

Pelo CLI:

```bash
vercel link
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ADMIN_EMAILS
vercel deploy --prod
```

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local
npm run local
```

Depois abra:

- Site: `http://localhost:3000`
- Painel: `http://localhost:3000/admin`

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` dentro de `index.html` ou `admin.html`; ela deve existir apenas no ambiente da Vercel/local.
