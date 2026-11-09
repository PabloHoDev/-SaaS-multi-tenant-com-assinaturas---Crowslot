# Crowslot — instruções para o Claude

@AGENTS.md
@CONTRIBUTING.md

## Fluxo de trabalho (obrigatório)

Trabalhamos como uma equipe profissional. O fluxo completo está no `CONTRIBUTING.md`. No dia a dia:

- **Antes de alterar qualquer arquivo**, confira a branch (`git branch --show-current`). Se
  estiver na `main`, atualize-a e crie uma branch `tipo/descricao` antes de começar.
- **Nunca** commite, faça merge ou force-push na `main`.
- Commits na branch de trabalho em Conventional Commits, **agrupados por assunto**.
- Ao concluir: format, lint, typecheck, testes e build verdes. Depois, push da branch e PR com
  o template preenchido. **O merge é sempre decisão do usuário**, depois da revisão.
- Uma tarefa = uma branch = um PR. Assunto novo no meio do caminho vira outra issue ou branch.
- Nunca use `--no-verify` nem pule hooks. Se o CI falhar, corrija a causa.

## Projeto

SaaS multi-tenant para salões e barbearias. Next.js 16 (App Router, Server Actions, Cache
Components), Prisma 7 + PostgreSQL (Neon), Auth.js v5, Zod 4, Tailwind 4 + shadcn/ui (Base UI).

### Regras de arquitetura

- **Multi-tenancy:** toda tabela de negócio tem `organizationId`, e toda query filtra por ele.
  O contexto vem de `getOrgContext(slug)` (`src/server/tenant.ts`), nunca de dado do cliente.
  Relações entre entidades de negócio usam FK composta `(id, organization_id)`.
- **Autorização no servidor:** `assertCan(ctx.role, "...")` em `src/server/*`. A UI só esconde.
- **Server Actions:** sempre via `runAction` (`src/server/action.ts`); entrada validada com Zod.
  IDs, slugs e tokens vindos do navegador passam por `src/lib/validations/common.ts`.
- **Cache Components:** acesso ao banco em render começa por `requireUser`/`getOrgContext`
  (que chamam `io()`). Dado de sessão fica dentro de `<Suspense>`.
- **Dinheiro em centavos** (inteiro); preço congelado no agendamento.
- **Datas no fuso da organização** (`src/lib/dates.ts`).
- **Limites de plano** em `src/lib/plans.ts`; checagem sob trava (`pg_advisory_xact_lock`).
- **Rate limit** em `src/server/rate-limit.ts` para login, convites e endpoints sensíveis.
- **Audit log** em toda ação sensível, sem dados pessoais no `metadata`.
- **Banco:** o app usa o papel `crowslot_app` (só DML); migrations usam o dono (`DIRECT_URL`).
  Constraints que o Prisma não expressa ficam em SQL na migration.

### Comandos

```bash
npm run dev            # desenvolvimento
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # next typegen + tsc
npm test               # Vitest
npm run build          # build de produção
npm run db:migrate     # nova migration (dev)
npm run db:deploy      # aplica migrations
npm run db:seed        # dados demo (login: demo@example.com)
```

Na rede corporativa (proxy Netskope), use `NODE_USE_SYSTEM_CA=1` para downloads do Prisma.
Nunca desative a verificação TLS.
