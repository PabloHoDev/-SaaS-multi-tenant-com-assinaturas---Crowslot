# Como contribuir

Este repositório segue o fluxo de uma equipe de produto: a `main` está sempre estável, toda
mudança passa por branch, Pull Request, CI e revisão.

## Fluxo

1. **Issue primeiro.** Toda tarefa tem uma issue (funcionalidade, bug ou melhoria) com o
   objetivo e os critérios de aceite.
2. **Branch a partir da `main` atualizada:**
   ```bash
   git switch main && git pull
   git switch -c feat/servicos-crud
   ```
3. **Commits pequenos e com sentido**, no padrão [Conventional Commits](#commits).
4. **Antes do PR**, tudo verde localmente:
   ```bash
   npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
   ```
5. **Pull Request** para a `main`, preenchendo o template. O CI precisa passar.
6. **Revisão e merge** com _Squash and merge_. A branch é apagada depois do merge.

## Branches

`tipo/descricao-curta`, em minúsculas e com hífens:

| Tipo        | Uso                                       | Exemplo                    |
| ----------- | ----------------------------------------- | -------------------------- |
| `feat/`     | funcionalidade nova                       | `feat/agendamentos`        |
| `fix/`      | correção de bug                           | `fix/fuso-no-dashboard`    |
| `refactor/` | mudança interna sem alterar comportamento | `refactor/server-actions`  |
| `test/`     | só testes                                 | `test/e2e-login`           |
| `docs/`     | só documentação                           | `docs/adr-multi-tenancy`   |
| `chore/`    | manutenção, dependências, configuração    | `chore/atualiza-prisma`    |
| `ci/`       | pipeline                                  | `ci/preview-deploy`        |
| `perf/`     | desempenho                                | `perf/indice-agendamentos` |
| `hotfix/`   | correção urgente em produção              | `hotfix/webhook-stripe`    |

Uma branch trata de **um assunto**. Prefira PRs pequenos (até ~400 linhas alteradas).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português, no imperativo:

```
feat(clientes): adiciona busca por telefone
fix(auth): impede reenvio do link antes do intervalo mínimo
refactor(server): extrai validação de slug para schema comum
```

- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`, `style`, `build`.
- Escopo opcional: o módulo afetado (`clientes`, `auth`, `db`, `ui`…).
- Agrupe por assunto. **Não** faça um commit por arquivo nem misture assuntos.
- O corpo explica o _porquê_ quando ele não é óbvio. Mudança que quebra compatibilidade:
  `feat!:` ou rodapé `BREAKING CHANGE:`.
- Referencie a issue no PR (`Closes #12`), não é preciso em todo commit.

## Regras da `main`

- Ninguém commita direto na `main`. Tudo entra por PR.
- Nunca `push --force` na `main` nem reescrita de histórico compartilhado.
- CI verde é obrigatório para o merge.
- Segredos nunca entram no repositório (o CI roda o Gitleaks no histórico).

## Ambientes

| Ambiente | Banco                 | Deploy               |
| -------- | --------------------- | -------------------- |
| Local    | branch `dev` do Neon  | `npm run dev`        |
| Preview  | branch de preview     | Vercel, um por PR    |
| Produção | branch `main` do Neon | Vercel, a cada merge |

Seed e testes **nunca** rodam contra produção (o seed se recusa a rodar com `NODE_ENV=production`).

## Versões

Marcos fechados viram tag [SemVer](https://semver.org/lang/pt-BR/) (`v0.1.0`, `v0.2.0`…) com
release notes no GitHub geradas a partir dos PRs.
