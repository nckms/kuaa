# Kuaa API

Backend Node.js + Express + TypeScript + Prisma + PostgreSQL.

## Banco de dados

### Desenvolvimento

Para criar ou evoluir o schema localmente, use:

```bash
npx prisma migrate dev --name <descricao-da-mudanca>
```

Isso gera um novo arquivo SQL versionado em `prisma/migrations/` e aplica a migration no banco de desenvolvimento. Execute esse comando sempre que alterar `prisma/schema.prisma`.

### Produção

O deploy aplica as migrations pendentes sem interação:

```bash
npx prisma migrate deploy
```

Esse comando é executado automaticamente no boot (via `Procfile` / `railway.json`) antes de iniciar o servidor.

### Seed

Popula vestibulares, matérias, tópicos e achievements. É idempotente — pode ser rodado múltiplas vezes sem duplicar dados:

```bash
npx prisma db seed
```

---

## Testes de integração

Os testes usam **Vitest + Supertest** e rodam contra um banco de teste isolado — **nunca** contra o Supabase de produção.

### Configurar banco de teste

Copie `.env.test.example` para `.env.test` e preencha:

```bash
cp .env.test.example .env.test
```

Edite `DATABASE_URL` em `.env.test` com uma das opções:

| Opção | Exemplo |
|-------|---------|
| Mesmo Supabase, schema separado | `...?schema=test_vitest&sslmode=require` |
| Outro projeto Supabase (grátis) | URL completa do projeto de teste |
| Postgres local | `postgresql://postgres:postgres@localhost:5432/kuaa_test` |

Deixe `OPENAI_API_KEY=` vazio — os testes usam fallback questions automaticamente (sem custo de API).

### Rodar testes

```bash
npm test
```

O `globalSetup` cria o schema de teste, aplica migrations e roda o seed automaticamente. O `teardown` descarta o schema ao final.

---

## Teste de carga (k6)

Script em `loadtest/quiz-flow.js` simula o fluxo completo de um usuário (register → quiz → finish) com N usuários virtuais simultâneos.

> **IMPORTANTE:** Execute APENAS contra um banco de staging isolado, **nunca contra produção**.

### Instalar k6

```bash
# Windows (Chocolatey)
choco install k6

# Windows (instalador direto)
# https://dl.k6.io/msi/k6-latest-amd64.msi

# macOS
brew install k6
```

### Rodar o script

```bash
# Teste rápido — 10 VUs por 1 minuto (staging local)
BASE_URL=http://localhost:3334 VUS=10 DURATION=1m k6 run apps/api/loadtest/quiz-flow.js

# Cenário do TCC — 50 VUs por 2 minutos
BASE_URL=http://localhost:3334 VUS=50 DURATION=2m k6 run apps/api/loadtest/quiz-flow.js
```

**Thresholds configurados** (critério de aceite do TCC):
- `p95 < 2s` — 95% das requests em menos de 2 segundos
- `error rate < 5%` — menos de 5% de falhas
