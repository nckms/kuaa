# Protocolo de avaliacao de usabilidade

Status: instrumento e procedimento preparados; coleta, participantes, resultados e validacao humana PENDENTES. Nao ha dados empiricos neste documento. Dados de testes automatizados sao sinteticos e nao constituem participantes ou resultados do TCC.

## Contrato de integracao

- Export nomeado `evaluationRouter` em `apps/api/src/modules/evaluation/evaluation.routes.ts`; montar em `/evaluation` no router existente (respeitando o prefixo global da API).
- Export default `EvaluationPage` em `apps/web/src/pages/Evaluation/EvaluationPage.tsx`; integrar `/avaliacao` dentro de `ProtectedRoute`. Retorno para `/dashboard`.
- Prisma esperado: `UsabilityEvaluation` com `id String @id @default(cuid())`, `userId String @unique`, `answers Json`, `score Float`, `feedback String?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`; inversa `User.usabilityEvaluation UsabilityEvaluation?`.
- Migration e geracao do client pertencem ao integrador. Nao foram executadas nesta entrega.
- GET `/evaluation/me`, autenticado: HTTP 200 com objeto proprio ou `null`.
- POST `/evaluation/me`, autenticado: HTTP 200 com avaliacao criada/atualizada. Corpo: `{ "answers": [1,2,3,4,5,1,2,3,4,5], "consent": true, "feedback": "opcional" }`. Este array e apenas exemplo tecnico, nao resultado de pesquisa.
- Dez inteiros JSON de 1 a 5, em ordem; sem coercao. Consentimento deve ser booleano `true` em cada envio. Comentario limitado a 2.000 caracteres antes de trim; omitido/vazio apaga comentario anterior. Campos extras (inclusive `score` e `userId`) sao rejeitados com 400. Falta de autenticacao: 401.
- Resposta: `id`, `answers`, `score`, `feedback`, `createdAt`, `updatedAt`; sem dados do usuario. Identidade vem exclusivamente de `requireAuth`. Nao ha endpoint de listagem, exportacao ou consulta de terceiros.
- Uma linha por usuario, ultima resposta prevalece; nao ha historico. Consentimento e exigido na API, mas o modelo acordado NAO guarda versao do termo/data de aceite separada. Para pesquisa formal, definir registro de consentimento e retirada fora deste modulo antes da coleta. Nao afirmar que existe trilha de auditoria de consentimento.

## Instrumento e calculo

Dez itens adaptados em portugues na pagina, alternando afirmacoes positivas e negativas. Escala: 1 discordo totalmente; 2 discordo; 3 nem concordo nem discordo; 4 concordo; 5 concordo totalmente. Nao ha respostas preselecionadas para novos envios.

SUS = 2,5 x soma das contribuicoes: itens impares (numeracao 1 a 10) usam resposta - 1; pares usam 5 - resposta. Intervalo 0 a 100, nao porcentagem nem nota de aprendizagem. Nao classificar usuario como aprovado/reprovado, nem interpretar resposta individual como resultado populacional. Esta adaptacao nao foi validada linguisticamente/psicometricamente nesta entrega; revisar instrumento e referencia bibliografica com orientador antes da coleta. Nao usar limiares normativos sem fonte e justificativa.

## Preparacao e consentimento

1. Definir publico, criterios de inclusao, recrutamento, tamanho pretendido e justificativa ANTES de coletar; registrar numeros reais depois. Submeter procedimento as exigencias institucionais aplicaveis com o orientador.
2. Fixar versao do sistema e instrumento, ambiente, dispositivo, tarefas, politica de retencao, responsavel e canal de retirada. Esses campos estao pendentes e devem constar no termo apresentado aos participantes.
3. Explicar voluntariedade, uso agregado e ausencia de prejuizo ao estudo. A coleta e vinculada a conta, portanto nao e anonima na origem. Nao prometer anonimato absoluto. Para menores, definir previamente as autorizacoes exigidas pela instituicao.
4. Usar contas de teste no ensaio tecnico; remover esses registros do conjunto de pesquisa. Nao coletar nome, e-mail, escola, cidade ou identificadores em planilha analitica. Nao incluir dados pessoais no comentario.

## Roteiro de uso observado

1. Cadastrar conta e entrar. Registrar conclusao, dificuldade observada, ajuda solicitada e tempo, sem capturar credenciais.
2. Escolher vestibular e realizar matricula; localizar trilha e assunto.
3. Iniciar atividade e responder questoes; localizar retorno sobre as respostas.
4. No ensaio funcional, usar uma questao controlada para responder incorretamente; localizar explicacao/revisao e atividade de reforco. Na coleta, nao induzir erro sem informar que faz parte do roteiro; distinguir erro provocado de dificuldade espontanea.
5. Realizar reforco e verificar retorno a trilha. Registrar comportamento observado, sem inferir melhoria da aprendizagem apenas pela conclusao.
6. Abrir simulado, responder, revisar e finalizar; consultar resultado. Registrar falhas/bloqueios sem completar tarefa pelo participante silenciosamente.
7. Responder ao questionario em `/avaliacao`, sem orientar escolhas; comentario opcional. Recusa/interrupcao deve ser respeitada. Nao transformar respostas ausentes em neutras.

## Analise agregada sem dados pessoais

Preparar planilha vazia com colunas `codigo_aleatorio`, `q1` a `q10`, `sus`, `tarefas_concluidas`, `tempo_total_segundos`, `ajuda_solicitada`, `tema_comentario`. Codigo aleatorio nao deve conter ID da conta. Nao publicar linhas individuais ou tabela de correspondencia. A extracao autorizada e minimizacao de dados precisam ser definidas pelo responsavel; nao ha exportador publico implementado.

Calcular SUS por linha valida usando a formula acima. Considerar uma avaliacao por participante conforme corte previamente definido: a API conserva somente a ultima. Documentar ausencias, exclusoes e duplicidades, sem preencher dados faltantes. Reportar n real, media, mediana, desvio-padrao amostral (somente n >= 2), minimo/maximo e distribuicao dos itens; com n = 0 escrever "nao coletado", nunca zero de usabilidade. Evitar subgrupos pequenos identificaveis. Nao extrapolar amostra de conveniencia para todos os estudantes.

Codificar comentarios por temas apos remocao de identificadores; revisar manualmente trechos antes de eventual citacao consentida. Manter planilha restrita e publicar apenas agregados. Resultados de usabilidade nao demonstram eficacia pedagogica ou qualidade factual de IA.

## Verificacao tecnica atualizada em 30/09/2026

A integracao foi concluida: schema e migration aplicados em PostgreSQL local isolado, rota autenticada `/api/v1/evaluation/me` e tela `/avaliacao`. `evaluationPersistence.test.ts` verifica gravacao real, atualizacao de uma unica avaliacao por usuario, consentimento e isolamento entre contas. O formulario e a formula nao sao resultados de pesquisa: ainda e necessaria coleta consentida com participantes reais.

Para executar a suite integrada, configure `TEST_DATABASE_URL` para um banco descartavel ou schema `test_vitest` e execute `npm test --workspace=apps/api`. Nunca use o banco de producao. Abaixo permanece o roteiro de teste unitario isolado; as notas sobre integracao pendente descrevem o estado anterior.

`apps/api/src/tests/evaluation.test.ts` usa Prisma e ambiente simulados, mas middleware real de autenticacao e tokens locais de teste. Abrange calculo, limites, consentimento, campos extras, ausencia de token e isolamento da consulta/upsert. Nao prova persistencia ou concorrencia em banco.

ATENCAO: a configuracao Vitest padrao possui globalSetup de banco. Nao executar `npm test` nem build da API (gera Prisma) durante integracao concorrente. Para rodar apenas esta suite sem config/globalSetup, a partir de `apps/api`:

```powershell
node --input-type=module -e "import { startVitest } from 'vitest/node'; const ctx = await startVitest('test', ['src/tests/evaluation.test.ts'], { config: false, watch: false, globals: true, environment: 'node' }); if (!ctx) process.exitCode = 1; else { if (ctx.state.getCountOfFailedTests()) process.exitCode = 1; await ctx.close(); }"
```

Apos integracao, verificar manualmente: GET vazio; envio completo; refresh e edicao; comentario no limite; falha de rede preservando formulario; dois usuarios sem acesso cruzado; logout/troca de conta; teclado e leitor de tela; radios agrupados por pergunta; consentimento inicialmente desmarcado; desktop/mobile sem sobreposicao. Testes de persistencia, exclusao em cascata, concorrencia e navegacao integrada permanecem pendentes ate schema/rotas estarem prontos.
