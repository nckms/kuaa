# Kuaa

Plataforma de preparação para ENEM, FUVEST e UNICAMP, com plano gratuito e assinatura Kuaa Plus. Nasceu como TCC do curso Técnico em Desenvolvimento de Sistemas (ETEC Dr. Júlio Cardoso).

O que o sistema faz, em uma frase: um diagnóstico inicial e **regras de desempenho** escolhem o próximo tópico e a dificuldade das questões; as questões são **geradas por IA (Gemini) com exemplos few-shot** ou, se a IA falhar, vêm de uma **reserva autoral curada**. O detalhamento, com evidências e limitações, está em [`docs/entrega-tcc.md`](docs/entrega-tcc.md).

## Stack real

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18, Vite 6, TypeScript, React Router 6, TanStack Query 5, Zustand, CSS próprio + Bootstrap Icons (Tailwind e Bootstrap estão instalados, uso residual) |
| Backend | Node.js 20, Express 4, TypeScript, Zod, Prisma 5 |
| Banco | PostgreSQL (produção: Railway; testes: Postgres local descartável) |
| Pagamentos | Stripe Billing: assinatura mensal no Checkout hospedado, Pix Automático ou cartão; webhook assinado |
| IA | Google Gemini via `@google/genai` (modelo em `GEMINI_MODEL`/`SABIA_MODEL`), com fallback para reserva curada |
| E-mail | Nodemailer (SMTP). Desenvolvimento: caixa local `scripts/dev-mailbox.ts` |
| Cache | Redis **opcional** (cache da trilha). Sem Redis, a API funciona em modo degradado |
| Testes | Vitest + Supertest (integração contra Postgres real) |
| Hospedagem | Frontend na Vercel (proxy same-origin `/api/*` → Railway), API no Railway |

Não há fila (BullMQ) nem OpenAI no sistema atual.

## Rodando localmente

Pré-requisitos: Node.js 20+, um PostgreSQL acessível em localhost.

```bash
npm install

# API: copie e preencha (DATABASE_URL de um banco LOCAL, JWT_SECRET qualquer)
cp apps/api/.env.example apps/api/.env

cd apps/api
npx prisma migrate deploy   # aplica as migrations versionadas
npx prisma db seed          # vestibulares, matérias, tópicos e conquistas (idempotente)
cd ../..

npm run dev                 # API em :3333 e site em :5173
```

O `npm run dev` do site encaminha `/api` para a API **local** (`http://localhost:3333`). Apontar o site local para a API publicada (e, portanto, para o banco de produção) exige escolha explícita:

```bash
VITE_DEV_API_PROXY=https://kuaa-tcc-api-production-01b2.up.railway.app npm run dev --workspace=apps/web
```

| Serviço | URL |
| --- | --- |
| Site | http://localhost:5173 |
| API | http://localhost:3333/api/v1/health |
| Caixa de e-mail de desenvolvimento | http://127.0.0.1:8025 |

### Recuperação de senha em desenvolvimento

```bash
npm run mail:dev --workspace=apps/api     # SMTP em 127.0.0.1:1025, caixa em :8025
# em apps/api/.env:
#   MAIL_TRANSPORT=smtp  SMTP_HOST=127.0.0.1  SMTP_PORT=1025  APP_URL=http://localhost:5173
```

Em "Entrar" → "Esqueci minha senha", o link chega na caixa local. Configuração de produção: ver [`docs/entrega-tcc.md`](docs/entrega-tcc.md#recuperação-de-senha).

## Testes

A suíte é de integração e precisa de um PostgreSQL **local** com nome terminado em `_test`. O `globalSetup` imprime o destino e recusa qualquer outro antes de rodar migration, seed, `TRUNCATE` ou `DROP`.

```bash
# exemplo: Postgres em 127.0.0.1:55433 com um banco kuaa_test já criado
createdb -h 127.0.0.1 -p 55433 -U postgres kuaa_test

npm run test:local --workspace=apps/api
# ou com outro destino:
TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/kuaa_test npm run test:local --workspace=apps/api
```

No PowerShell: `$env:TEST_DATABASE_URL="postgresql://postgres@127.0.0.1:5432/kuaa_test"; npm run test:local --workspace=apps/api`.

Os testes nunca chamam o Gemini real (chave vazia ou mock) e nunca enviam e-mail real (`MAIL_TRANSPORT=memory`). Passar nos testes, portanto, **não** comprova disponibilidade nem qualidade da IA.

Outros comandos:

```bash
npm run lint                      # web + api
npm run build                     # web
npm run build --workspace=apps/api
```

## Planos e assinatura

| | Gratuito | Kuaa Plus |
| --- | --- | --- |
| Preço | R$ 0 | R$ 29,90/mês · estudante aprovado R$ 14,95/mês |
| Diagnóstico, trilha, explicação de todo erro, simulado semanal | sim | sim |
| Práticas | 5/dia | 40/dia |
| Perguntas ao Sabiá | 15/dia | 100/dia |
| Análise de redação | 2/mês | 15/mês |

- Cotas em `apps/api/src/modules/plans/entitlements.ts` (dia/mês no horário de Brasília).
- Assinatura em `modules/billing`: Checkout em modo `subscription` com mandato do Pix Automático; o webhook busca a assinatura na Stripe e recalcula o plano (fim do período + 8 dias de folga para o débito do Pix). Portal da Stripe para cancelar.
- Meia estudantil em `modules/students`: aluno envia carteirinha/declaração, admin (`ADMIN_USER_IDS`) aprova em `/admin/estudantes`; a imagem é apagada na análise ou após 30 dias; a aprovação vale 12 meses.
- Passo a passo de lançamento: [`docs/lancamento.md`](docs/lancamento.md).

### Scripts de operação (`apps/api`)

| Comando | O que faz |
| --- | --- |
| `npm run metrics` | Funil por semana de cadastro (somente leitura, sem contas de teste) |
| `npm run stripe-setup` | Cria produto, preços mensais e portal na Stripe (idempotente) |
| `npm run grant-plus -- --email … --until AAAA-MM-DD --ref … --yes` | Libera Plus manualmente (idempotente por referência) |
| `npm run weekly-email -- --send` | E-mail semanal de próximo passo (idempotente por semana) |
| `npm run db:migrate` | Reconciliação do histórico + `prisma migrate deploy` (roda no pré-deploy do Railway) |

## Vestibulares e conteúdo

ENEM (73 tópicos), FUVEST (52) e UNICAMP (43), cadastrados pelo seed. Reserva curada com 236 questões autorais. Seis exemplos few-shot de matemática adaptados de provas oficiais (ver [`docs/referencias-provas.md`](docs/referencias-provas.md)). Nenhuma questão é apresentada como oficial.

---

O essencial para estudar é gratuito; o Kuaa Plus amplia o volume de prática e de IA.
