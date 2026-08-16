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
