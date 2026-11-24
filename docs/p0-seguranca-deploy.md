# P0: seguranca e publicacao sem perda de dados

## Escopo desta entrega

- Deploys usam Prisma 5.22 `migrate deploy`, nunca `db push`, reset ou accept-data-loss.
- Reinicios nao executam seed. Catalogo e dados de alunos permanecem independentes do boot.
- Cadastro/login possuem limite local permanente e teto compartilhado via Redis quando disponivel.
- Tokens de renovacao novos ficam em SHA-256 no banco. Tokens antigos sao convertidos no primeiro uso, sem alterar sua validade.
- API oferece rotacao opt-in para clientes atualizados: `{ refreshToken, rotate: true }`; o site usa sempre.
- Site usa refresh token em cookie HttpOnly de primeira parte via proxy same-origin; access token so em memoria.
- Erros inesperados nao expoem mensagens internas; logs HTTP omitem query strings e usam request ID.
- `/health` continua sendo liveness; `/ready` verifica Postgres e retorna 503 quando indisponivel.
- CI testa API em Postgres descartavel e compila frontend e backend.

Nenhuma migracao ou operacao de escrita em producao foi executada por esta sessao.

## Antes do primeiro deploy

1. Confirmar o servico/banco de producao, branch, comandos efetivos no painel e dominio do frontend. Configuracoes manuais no Railway podem sobrescrever arquivos do repositorio.
2. Criar backup completo com `pg_dump` em formato custom, sem colocar senha em argumentos, logs ou Git. Usar variaveis PGHOST/PGPORT/PGDATABASE/PGUSER e arquivo de senha protegido. Armazenar backup criptografado com acesso restrito.
3. Restaurar o backup em um banco DIFERENTE de homologacao usando `pg_restore --exit-on-error --no-owner --no-acl`. Nunca usar `--clean` apontando para producao.
4. Conferir quantidades e amostras de usuarios, respostas, progresso, redacoes e historico do Sabia antes/depois. Um arquivo de backup sem teste de restauracao nao basta.
5. Com DATABASE_URL apontando explicitamente para a copia, executar `npx prisma migrate status`. Se o banco foi criado com db push, pode faltar o historico de migrations, embora as tabelas existam.
6. Resolver historico APENAS depois de comparar os efeitos de cada migration com a copia. `migrate resolve --applied <migration>` registra historico, nao cria estrutura. Nao marcar todas como aplicadas por tentativa. Nao editar migrations ja publicadas nem usar reset.
7. Aplicar pendencias na copia com `npx prisma migrate deploy`; comparar schema com `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` (nao compartilhar comandos/logs contendo credenciais; preferir segredo de ambiente na pipeline).
8. Rodar jornadas de cadastro, login, senha, trilha, simulado, painel, Sabia e redacao na copia. Conferir novamente os registros preservados.
9. Somente depois, realizar o mesmo procedimento aprovado em producao, com backup recente e janela acompanhada. Se qualquer comando falhar, interromper; nao substituir por db push.

## Comandos e verificacoes do servico

- Diretorio da API: `apps/api`.
- Start: `npx prisma migrate deploy && node dist/index.js`.
- Docker entrypoint tambem protege inicio direto com `migrate deploy`; reaplicar sem pendencias e idempotente.
- Healthcheck de deploy: `/api/v1/ready`. Manter `/api/v1/health` para liveness.
- Em banco NOVO, executar seed como operacao explicita depois de migrations. Em banco existente, revisar o seed antes de decidir executa-lo: ele sincroniza o catalogo.
- Configurar alertas externos para readiness 503, erros HTTP 5xx, latencia e falhas de login. Este commit fornece logs/endpoints; nao cria uma conta de monitoramento nem configura alertas no provedor.
- Testar SIGTERM: servidor deixa de aceitar conexoes novas, encerra requisicoes em andamento e fecha conexoes. Ha limite de 25 segundos para desligamento.

## Proxy, Redis e escala

TRUST_PROXY aceita IPs/CIDRs conhecidos do proxy. Por padrao nao confia em cabecalhos enviados pelo cliente. Confirmar a cadeia real no provedor antes de configurar; nao habilitar trust proxy=true.

Sem configuracao correta, usuarios atras do proxy podem compartilhar a mesma cota por IP. Validar dois clientes com IPs distintos e tentar falsificar X-Forwarded-For antes de publicar.

O limite local continua ativo quando Redis falha. A cota local e por processo e reinicia com ele. Antes de operar varias replicas, disponibilizar Redis e monitorar falhas: durante indisponibilidade, o limite agregado pode chegar ao limite local multiplicado pelo numero de replicas. Nao confundir essa defesa com cotas comerciais ou protecao de borda contra DDoS.

## Sessoes e compatibilidade web/mobile

### Navegador (site Vercel)

- O site chama sempre `/api/v1/...` no proprio dominio. `vercel.json` (raiz) e `apps/web/vercel.json` reescrevem `/api/:path*` para `https://kuaa-tcc-api-production-01b2.up.railway.app/api/:path*`, preservando o `v1`. Os dois arquivos estao alinhados porque o painel Vercel decide qual raiz usa; `.vercel/` fica na raiz do repo, o que indica deploy pela raiz (`outputDirectory: apps/web/dist`). Confirmar em Project Settings > Root Directory.
- Toda chamada do site envia `X-Kuaa-Client: web`. Nesses pedidos a API exige `Origin` exata (FRONTEND_URL + APP_URL; em desenvolvimento tambem localhost/127.0.0.1 nas portas 5173/5190/5191) para login, cadastro, refresh e logout, e devolve o refresh token SOMENTE no cookie `kuaa_session` (`HttpOnly; SameSite=Lax; Path=/api/v1/auth; Secure` quando `NODE_ENV=production`, 7 dias). O JSON traz `user` e `accessToken`.
- O access token fica apenas em memoria (Zustand sem persistencia). Ao recarregar, o site chama `POST /api/v1/auth/refresh` com o cookie; a renovacao web sempre rotaciona.
- localStorage guarda so marcadores nao secretos: `kuaa_session_hint` (evita chamar /refresh para visitante anonimo, que chegaria pelo mesmo IP do proxy) e `kuaa_logout_pending` (logout que falhou na rede: a proxima carga conclui o logout em vez de restaurar a sessao).
- Migracao de quem ja estava logado: se existir `kuaa_refresh_token` legado, a primeira renovacao o envia no corpo (com o cabecalho web), recebe o cookie, e o site apaga `kuaa_token`/`kuaa_refresh_token`.
- Renovacoes sao serializadas entre abas com `navigator.locks` (Web Locks). Navegadores sem essa API dependem da janela de rotacao abaixo.
- Sem `X-Kuaa-Client: web`, o cookie e ignorado: o contrato mobile nao muda.

### Rotacao com janela curta

Com `rotate: true` (sempre usado pelo site), o token usado passa a expirar em 30 s (`ROTATION_GRACE_MS`) e um novo e emitido. Motivo observado no teste de navegador: uma renovacao cuja resposta se perde (recarga no meio do pedido, duas paginas) com rotacao de uso unico derrubava o aluno para o login. Dentro dos 30 s o token antigo ainda gera um substituto; depois, 401. Nao ha deteccao de reutilizacao/revogacao de familia; essa continua sendo melhoria futura.

### Apps Android/iOS (futuro)

Chamar a URL publica da API diretamente, sem `X-Kuaa-Client: web`. Login/cadastro devolvem `refreshToken` no JSON; guardar em Keychain/Keystore; usar `Authorization: Bearer`; renovar com `{ refreshToken, rotate: true }` e serializar renovacoes. Nenhum cliente nativo foi criado.

### Limites de tentativa atras do proxy

Pelo proxy Vercel, sem TRUST_PROXY, `req.ip` e o IP do proxy, igual para todos os alunos. Por isso as chaves deixaram de ser so IP:

| Rota | Chave | Limite |
| --- | --- | --- |
| login | IP + hash do e-mail | 10 / 15 min |
| cadastro | IP + hash do e-mail; e IP | 5 / h; 60 / h |
| refresh | hash do token de sessao (sem token: IP) | 30 / min |
| esqueci-senha | IP + hash do e-mail | 5 / h |
| redefinir-senha | IP | 10 / 15 min |

O teto de 60 cadastros/h por IP e as rotas por IP ainda podem virar teto global do site enquanto todos chegarem pelo mesmo IP. A Vercel envia `x-forwarded-for` com o IP do visitante, mas a Railway acrescenta seu proprio salto; medir a cadeia real em homologacao antes de configurar TRUST_PROXY (nunca `true`).

Logout e redefinicao de senha revogam refresh tokens. Access tokens emitidos continuam validos por ate 15 minutos.

Rollback do codigo para uma versao anterior a esta: o site antigo usa localStorage e chama a API Railway direto; quem tiver so o cookie precisara entrar de novo. Nunca reverter hash para texto puro.

## Reconciliacao do historico de migrations

Situacao relatada no handoff (24/11/2026), feita no computador do responsavel, NAO revalidada por esta sessao (o clone em 127.0.0.1:55434 nao e acessivel daqui):

- Backup binario da producao restaurado em `kuaa_production_restore` (Postgres 18.7 local). Contagens: 41 usuarios, 111 respostas, 49 sessoes de quiz, 2.909 progressos, 118 mensagens e 21 conversas do Sabia, 5 redacoes.
- `migrate status` mostrou 5 migrations com estrutura ja presente, mas sem registro em `_prisma_migrations`: `20260930000100_sabia_conversations`, `20261011000100_question_media`, `20261015000100_enrollment_diagnostic`, `20261020000100_essay_practice`, `20261020000200_essay_feedback`.
- No clone: `migrate resolve --applied` nessas 5, uma por vez; depois `migrate deploy` aplicou so `20261114000100_password_reset_tokens`, sem erro.

Falta, no clone, antes de tocar a producao (PowerShell, com `$env:DATABASE_URL` apontando para o CLONE, sem imprimir a URL):

```powershell
cd apps/api
npx prisma migrate status
npx prisma migrate diff --from-url "$env:DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code   # esperado: exit 0
# recontar as tabelas sensiveis e comparar com os numeros acima
```

### Automatizado no deploy (adotado)

`scripts/reconcile-migrations.mjs` roda no pre-deploy do Railway (`npm run db:migrate` = reconcile + `prisma migrate deploy`). Ele registra uma migration da lista so quando TODA a estrutura dela ja existe no banco, deixa para o migrate deploy as ausentes e aborta (exit 1, deploy falha e a versao anterior segue no ar) se encontrar estrutura parcial. Nunca cria nem apaga tabelas/dados. Ensaiado em 24/11/2026 num fork do ambiente de producao no Railway (copia copy-on-write do banco real): 5 migrations registradas, 3 aplicadas, schema sem diferenca, contagens iguais (42 usuarios, 118 respostas, 55 sessoes, 3.013 progressos, 122 mensagens e 23 conversas do Sabia, 6 redacoes, 56 matriculas, 18 simulados). Cenarios testados localmente: estado da producao, segundo boot, estrutura parcial, banco novo.

### Producao manual (alternativa; executar so com backup recente)

```powershell
# 1. Backup novo imediatamente antes (pg_dump -Fc, credenciais por variavel/arquivo protegido).
# 2. $env:DATABASE_URL = <producao>   (nao colar em chat/log)
cd apps/api
npx prisma migrate status
npx prisma migrate resolve --applied 20260930000100_sabia_conversations
npx prisma migrate resolve --applied 20261011000100_question_media
npx prisma migrate resolve --applied 20261015000100_enrollment_diagnostic
npx prisma migrate resolve --applied 20261020000100_essay_practice
npx prisma migrate resolve --applied 20261020000200_essay_feedback
npx prisma migrate deploy        # cria PasswordResetToken; NAO marcar essa como applied
npx prisma migrate status        # esperado: "Database schema is up to date"
npx prisma migrate diff --from-url "$env:DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code
```

Rollback realista: `resolve --applied` so grava historico; se algo der errado depois dele, nao apagar linhas de `_prisma_migrations` as cegas. Parar, manter a API antiga no ar e restaurar o backup em banco NOVO para comparar. A migration de reset de senha so cria a tabela `PasswordResetToken`; desfaze-la seria `DROP TABLE` dessa tabela vazia, decisao manual.

### Railway (depois da reconciliacao)

`NODE_ENV=production`; start `npx prisma migrate deploy && node dist/index.js`; healthcheck `/api/v1/ready`; `APP_URL=https://kuaa-web.vercel.app`; `FRONTEND_URL` so com os dominios realmente usados; `TRUST_PROXY` vazio ate medir a cadeia. Sem `NODE_ENV=production` o cookie sai sem `Secure` e a allowlist aceita localhost.

## Checklist de verificacao em producao

1. `GET https://kuaa-web.vercel.app/api/v1/health` e `/api/v1/ready` pelo proxy: 200.
2. Conta sintetica nova (e-mail controlado): cadastro pelo site; DevTools: resposta sem `refreshToken`, cookie `kuaa_session` HttpOnly+Secure, localStorage sem `kuaa_token`/`kuaa_refresh_token`. Se a Vercel nao repassar `Set-Cookie`, PARAR e planejar dominio proprio (ex.: api.dominio e site no mesmo site), sem voltar ao localStorage.
3. Recarregar: continua logado. Duas abas recarregando juntas: nenhuma cai no login.
4. Trilha, uma questao, painel, simulado, Sabia, redacao.
5. Logout; recarregar nao reautentica.
6. Celular (Chrome Android e Safari iOS): repetir 2, 3 e 5.
7. Conta antiga ja logada antes do deploy: abre logada e passa a usar cookie.
8. Remover so a conta sintetica, se houver rota segura; sem DELETE amplo.

## Validacao

Ultima execucao local (esta sessao, Linux, Postgres 16 descartavel):

- `npm run test:local --workspace=apps/api`: 27 arquivos, 170 testes passando, incluindo `browserSession.test.ts` (cookie HttpOnly, JSON sem refresh token, rotacao pelo cookie, origem invalida/ausente, migracao do token legado, logout, contrato mobile, limite por conta atras de proxy) e `security.test.ts`.
- `npm run build:all` e `npm run lint`: sem erros.
- `npm run test:backup --workspace=apps/api`: PASS, 20 tabelas iguais antes/depois de restore + migrate deploy.
- Navegador (Playwright, site Vite com proxy same-origin para a API local): login com cookie HttpOnly invisivel ao JS, localStorage sem tokens, reload logado, duas abas sem logout falso, logout sem reautenticacao, migracao de token legado, visitante anonimo sem chamada a /refresh; dashboard, trilha, simulado, Sabia, redacao, indice e perfil abriram sem 401/403/500 em 1366 px e 390 px.

Nao validado: proxy real da Vercel repassando Cookie/Set-Cookie/Origin, Safari/iOS, cadeia de IPs Railway, reconciliacao na producao.

`npm run test:local --workspace=apps/api` usa somente banco local com sufixo _test por padrao. Nunca apontar a suite para producao: os testes limpam dados.

`npm run test:backup --workspace=apps/api` exige banco *_test no loopback e nao substitui a restauracao do backup real.

Referencias: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining , https://expressjs.com/en/guide/behind-proxies/ , https://vercel.com/guides/vercel-reverse-proxy-rewrites-external .
