# Kuaa

Plataforma gratuita de preparação para ENEM, FUVEST e UNICAMP, voltada a estudantes de escolas públicas. TCC do curso Técnico em Desenvolvimento de Sistemas (ETEC Dr. Júlio Cardoso).

O que o sistema faz, em uma frase: um diagnóstico inicial e **regras de desempenho** escolhem o próximo tópico e a dificuldade das questões; as questões são **geradas por IA (Gemini) com exemplos few-shot** ou, se a IA falhar, vêm de uma **reserva autoral curada**. O detalhamento, com evidências e limitações, está em [`docs/entrega-tcc.md`](docs/entrega-tcc.md).

## Stack real

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18, Vite 6, TypeScript, React Router 6, TanStack Query 5, Zustand, CSS próprio + Bootstrap Icons (Tailwind e Bootstrap estão instalados, uso residual) |
| Backend | Node.js 20, Express 4, TypeScript, Zod, Prisma 5 |
| Banco | PostgreSQL (produção: Supabase; testes: Postgres local descartável) |
| IA | Google Gemini via `@google/genai` (modelo em `GEMINI_MODEL`/`SABIA_MODEL`), com fallback para reserva curada |
| E-mail | Nodemailer (SMTP). Desenvolvimento: caixa local `scripts/dev-mailbox.ts` |
| Cache | Redis **opcional** (cache da trilha). Sem Redis, a API funciona em modo degradado |
| Testes | Vitest + Supertest (integração contra Postgres real) |
| Hospedagem | Frontend na Vercel, API no Railway |

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

## Vestibulares e conteúdo

ENEM (73 tópicos), FUVEST (52) e UNICAMP (43), cadastrados pelo seed. Reserva curada com 236 questões autorais. Seis exemplos few-shot de matemática adaptados de provas oficiais (ver [`docs/referencias-provas.md`](docs/referencias-provas.md)). Nenhuma questão é apresentada como oficial.

---

Kuaa é gratuito: sem planos pagos nem paywall.
