# Kuaa 🦅

Plataforma 100% gratuita de preparação para vestibulares com IA adaptativa,
voltada a estudantes de escolas públicas brasileiras. TCC — 2025.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

## Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/nckms/kuaa && cd kuaa

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
# Edite os arquivos .env com suas credenciais

# 4. Execute a migration do banco
cd apps/api && npx prisma migrate dev --name init

# 5. Popule o banco com dados iniciais
npx prisma db seed

# 6. Volte à raiz e inicie tudo
cd ../.. && npm run dev
```

## URLs locais

| Serviço   | URL                                    |
|-----------|----------------------------------------|
| Frontend  | http://localhost:5173                  |
| API       | http://localhost:3333/api/v1/health    |

## Stack

| Camada    | Tecnologias                                      |
|-----------|--------------------------------------------------|
| Frontend  | React 18, Vite, TypeScript, Tailwind CSS v3      |
| Backend   | Node.js 20, Express, TypeScript, Prisma v5       |
| Banco     | PostgreSQL 15                                    |
| Cache     | Redis 7 + BullMQ                                 |
| IA        | OpenAI GPT-4o                                    |

## Vestibulares suportados

ENEM · FUVEST (USP) · UNICAMP

---

> Kuaa é 100% gratuito. Sem planos pagos, sem paywall, sem feature gate.
> Todo o conteúdo é aberto para qualquer estudante cadastrado.
