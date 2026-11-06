# Crowslot

Agenda, clientes, equipe e assinaturas para salões e barbearias.
SaaS **multi-tenant** feito com Next.js (App Router), Prisma, PostgreSQL e Stripe.

![CI](https://github.com/PabloHoDev/-SaaS-multi-tenant-com-assinaturas---Crowslot/actions/workflows/ci.yml/badge.svg)

> Projeto de portfólio. O foco está nos problemas reais de um SaaS B2B: isolamento de dados
> entre empresas, controle de acesso por papel, cobrança recorrente e integridade dos dados.

## Funcionalidades

- [x] Login sem senha (link mágico por e-mail) e com Google
- [x] Criação de espaço (organização) com slug único
- [x] Convite de membros por e-mail, com expiração e aceite seguro
- [x] Papéis `OWNER`, `ADMIN` e `MEMBER` (RBAC)
- [x] Limites por plano (Free: 50 clientes, 2 profissionais)
- [x] Painel com agendamentos do dia, atendimentos e receita do mês
- [x] Log de auditoria das ações sensíveis
- [x] Modo escuro
- [ ] Agenda: CRUD de clientes, serviços e agendamentos
- [ ] Dashboard completo com taxa de ocupação
- [ ] Stripe: checkout, portal de cobrança e webhooks idempotentes
- [ ] Exportação CSV
- [ ] Testes de integração e E2E
- [ ] Deploy na Vercel

## Stack

| Camada     | Tecnologia                                                 |
| ---------- | ---------------------------------------------------------- |
| Front/back | Next.js 16 (App Router, Server Components, Server Actions) |
| Linguagem  | TypeScript (strict)                                        |
| UI         | Tailwind CSS 4 + shadcn/ui (Base UI)                       |
| Banco      | PostgreSQL (Neon) + Prisma 7 com driver adapter            |
| Auth       | Auth.js v5 (sessões no banco)                              |
| Validação  | Zod 4                                                      |
| E-mail     | Resend                                                     |
| Pagamentos | Stripe                                                     |
| Qualidade  | Vitest, ESLint, Prettier, GitHub Actions                   |

## Decisões de arquitetura

### Multi-tenancy: o banco também protege

Toda tabela de negócio tem `organization_id`, e toda leitura ou escrita parte de um
`OrgContext` resolvido no servidor ([`src/server/tenant.ts`](src/server/tenant.ts)).
Esse contexto valida a sessão e a participação do usuário na organização. O ID da
organização **nunca** vem do cliente.

Isso cobre a aplicação. Para cobrir também bugs, as relações entre entidades de negócio
usam **chaves estrangeiras compostas** `(id, organization_id)`:

```sql
FOREIGN KEY (client_id, organization_id) REFERENCES clients (id, organization_id)
```

Um agendamento da organização A não consegue apontar para um cliente da organização B. O
Postgres rejeita a escrita, mesmo que algum código esqueça um filtro.

Quem tenta abrir o slug de uma organização da qual não participa recebe **404**, não 403,
para não revelar que o slug existe.

### Agenda sem sobreposição, garantida pelo Postgres

Checar conflito de horário só na aplicação tem condição de corrida: duas requisições
simultâneas passam pela checagem e as duas gravam. A migration cria uma
**exclusion constraint** com `btree_gist`:

```sql
EXCLUDE USING gist (
  professional_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status <> 'CANCELED');
```

O intervalo semiaberto `[início, fim)` permite marcar 10h–11h e 11h–12h em sequência.

### RBAC em um só lugar

A matriz de permissões fica em [`src/lib/rbac.ts`](src/lib/rbac.ts) e tem testes. Regras
relevantes:

- um usuário só gerencia membros de papel **estritamente inferior** (ADMIN não remove OWNER nem outro ADMIN);
- ninguém convida um novo OWNER;
- a interface esconde o que o usuário não pode fazer, mas é o servidor que decide.

### Convites seguros

- Token de 256 bits; o banco guarda só o **hash SHA-256**. Um vazamento do banco não gera convites válidos.
- Só o e-mail convidado pode aceitar.
- O aceite é atômico (`UPDATE ... WHERE accepted_at IS NULL`): dois cliques simultâneos não criam dois vínculos.
- Convites pendentes contam no limite do plano, para não dar para burlar o limite convidando várias pessoas de uma vez.

### Outros detalhes

- **Dinheiro em centavos** (inteiro), nunca float. O preço é **congelado no agendamento**: mudar o preço do serviço não reescreve a receita passada.
- **Fuso horário da organização**: o servidor roda em UTC; "hoje" e "este mês" são calculados no fuso do salão ([`src/lib/dates.ts`](src/lib/dates.ts)).
- **Variáveis de ambiente validadas com Zod** no boot ([`src/env.ts`](src/env.ts)).
- **Open redirect bloqueado** no `callbackUrl` do login ([`src/lib/safe-redirect.ts`](src/lib/safe-redirect.ts)).
- **Server Actions padronizadas** ([`src/server/action.ts`](src/server/action.ts)): erros de validação, permissão e plano viram mensagens para o usuário; erros inesperados são logados e nunca vazam detalhes.

## Estrutura

```
prisma/
  schema.prisma        # modelagem
  migrations/          # SQL versionado (inclui constraints manuais)
  seed.ts              # salão de demonstração com 3 meses de dados
src/
  app/                 # rotas (App Router)
    (auth)/login/      # login por link mágico e Google
    onboarding/        # criação da organização
    app/[slug]/        # área logada, por organização
    convite/[token]/   # aceite de convite
  lib/                 # funções puras: rbac, planos, datas, validações (com testes)
  server/              # acesso a dados e regras de negócio (server-only)
  components/          # UI compartilhada e shadcn/ui
  proxy.ts             # checagem otimista de sessão (antigo middleware)
```

## Rodando localmente

Requisitos: Node.js 22+ e um PostgreSQL (o [Neon](https://neon.tech) tem plano gratuito,
ou use `docker compose up -d`).

```bash
git clone https://github.com/PabloHoDev/-SaaS-multi-tenant-com-assinaturas---Crowslot.git crowslot
cd crowslot
npm install
cp .env.example .env          # preencha DATABASE_URL (e DIRECT_URL, se usar Neon)
npx auth secret               # gera AUTH_SECRET no .env
npm run db:deploy             # aplica as migrations
npm run db:seed               # opcional: dados de demonstração
npm run dev
```

Sem `RESEND_API_KEY`, o link de login aparece **no terminal**. Assim dá para rodar o
projeto sem nenhuma conta externa além do banco.

### Scripts

| Script               | O que faz                                 |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento               |
| `npm test`           | testes unitários (Vitest)                 |
| `npm run typecheck`  | gera tipos das rotas e roda `tsc`         |
| `npm run lint`       | ESLint                                    |
| `npm run db:migrate` | cria/aplica migrations em desenvolvimento |
| `npm run db:seed`    | popula o salão de demonstração            |
| `npm run db:studio`  | Prisma Studio                             |
