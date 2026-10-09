# Publicacao da entrega

## API no Railway

1. Autenticar o CLI com `railway login` e selecionar o projeto/servico correto com `railway link`.
2. Confirmar a raiz do servico em `apps/api` e as variaveis `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`. Incluir todos os dominios reais do frontend em `FRONTEND_URL`, separados por virgula.
3. `GEMINI_API_KEY` e `GEMINI_MODEL` habilitam geracao e Sabia. Sem provedor disponivel, quizzes usam banco autoral e Sabia retorna erro explicito. Redis e opcional.
4. Fazer backup do banco antes da migracao. O start usa `npx prisma migrate deploy && npx prisma db seed && node dist/index.js`. Nao usar `--accept-data-loss`. Um banco criado anteriormente com `db push` pode precisar de baseline conferido, nao de reset.
5. Publicar somente depois de conferir o servico selecionado. Validar `/api/v1/health`, `/api/v1/vestibulares`, cadastro/login, quiz, resultado, painel, simulado e preferencias.

Atualizacao em 30/09/2026: API publicada no servico `kuaa-tcc-api` do projeto `ample-clarity` (deploy `fe8f0dae-e11b-4086-a002-3595de766b63`). `DATABASE_URL` agora referencia `kuaa-postgres.DATABASE_URL`; quatro migrations aplicadas e seed executado no Postgres Railway. `/api/v1/health` e `/api/v1/vestibulares` responderam 200, cadastro 201 e login 200 com conta sintetica. Preflight CORS da URL de preview `kuaa-709z8az1s-nicolasmrts1325-5608s-projects.vercel.app` retornou 204 com origem permitida. A chave SSH temporaria foi removida da conta e do computador. O banco anterior Supabase estava inacessivel; usuarios cadastrados nele nao foram migrados e precisam cadastrar conta nova.

## Frontend

Atualizacao em 30/09/2026: frontend publicado na Vercel (deploy `dpl_FnCnP5N7MvHDGpEC9vizy2JFcYGy`) e associado a `https://kuaa-web.vercel.app`. `/cadastro` respondeu 200; o bundle publico contem a URL correta da API e a tela de avaliacao. O preflight de cadastro e login desse dominio retornou 204 com CORS autorizado. A URL de preview informada pelo usuario foi adicionada a `FRONTEND_URL` no Railway e tambem testada com preflight 204.

- Netlify: configuracao na raiz em `netlify.toml`, build `npm run build`, publicacao `apps/web/dist`, fallback SPA incluido.
- Vercel: configuracoes existentes agora incluem rewrite para rotas SPA.
- `VITE_API_URL` deve ser a URL da API com `/api/v1`. Sem variavel, o frontend usa o dominio Railway acima em producao e localhost:3333 em desenvolvimento.
- Nunca colocar senha do banco, JWT_SECRET ou chave Gemini em variaveis VITE.
- Publicar a API antes do frontend, pois as telas novas precisam das novas rotas e migration.

## Verificacao tecnica reproduzivel

Na raiz, executar `npm run build:all` e `npm run lint`. Para testes, definir `TEST_DATABASE_URL` apontando exclusivamente para banco descartavel/schema `test_vitest`, depois `npm test --workspace=apps/api`. A suite cria e remove o schema de teste. Nao usar credenciais de producao.

## Limites da entrega

O banco autoral cobre todos os topicos, mas tem volume limitado e nao substitui revisao docente. O indice nao e nota oficial nem TRI do ENEM. O SUS esta implementado, mas nao ha resultados de participantes. Se o provedor Gemini continuar retornando 503, o chat depende de recuperacao externa. Esses limites devem constar da apresentacao e do texto academico.
