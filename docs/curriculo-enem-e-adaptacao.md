# Curriculo ENEM, adaptacao e imagens

## Conteudo

- 16 agrupamentos de materias e 73 topicos no ENEM: 14 disciplinas e duas revisoes integradas mantidas para preservar o historico.
- Banco compartilhado com 236 questoes autorais, incluindo as de outros vestibulares. Cada topico do ENEM tem pelo menos tres questoes de reserva.
- Referencia de organizacao: https://download.inep.gov.br/enem/outros_documentos/enem_matriz_referencia.pdf
- A cobertura organiza os assuntos de estudo; nao representa uma colecao exaustiva de aulas ou questoes oficiais do INEP.
- Ingles/Espanhol selecionavel nas configuracoes. O simulado usa somente a lingua escolhida e exclui os exercicios de preparacao de Redacao. Continua sendo uma pratica semanal de ate 45 questoes, nao uma prova oficial de 180 questoes.

## Adaptacao

Depois da matricula, o aluno responde quatro perguntas de perfil e 12 questoes de diagnostico. O fluxo salva cada resposta e pode ser retomado. No ENEM, ha tres questoes de cada area; nos outros vestibulares, as questoes se distribuem entre as materias cadastradas. A dificuldade das proximas questoes varia dentro do diagnostico conforme os acertos.

O resultado e uma estimativa inicial por area, com poucas evidencias. Ele ordena a recomendacao inicial da trilha e define a dificuldade das primeiras praticas de cada materia. A informacao declarada como materia dificil ajuda a desempatar prioridades; nao substitui respostas. O diagnostico nao pontua redacao escrita, nao concede XP e nao marca topicos como concluidos. Depois, evidencias da pratica real prevalecem sobre essa estimativa.

O nivel e reavaliado ao finalizar uma sessao. Sessoes curtas acumulam evidencias do mesmo usuario/topico ate atingir cinco respostas validas, dentro de 30 dias. Respostas com menos de um segundo nao sustentam evolucao. Sessoes inteiramente em branco nao reduzem o nivel.

O motor considera acertos e dificuldade: pelo menos 80% de acerto com dificuldade suficiente pode subir um nivel; abaixo de 40%, em dificuldade compativel, pode reduzir um nivel. A proxima sessao usa o dominio e o desempenho recente para selecionar sua dificuldade. A avaliacao consome as evidencias utilizadas e salva um resumo historico; finalizar duas vezes nao concede progresso novamente.

O banco de reserva tem variedade limitada, sobretudo nos niveis avancados. Nao ha garantia de questoes ineditas em todas as sessoes, nem calibracao psicometrica ou TRI oficial. A geracao por IA depende da disponibilidade e configuracao do provedor.

## Midia

`Question.imageUrl` continua suportado; `Question.media` guarda texto alternativo, legenda e grafico estruturado. Graficos de linha e barra usam pontos numericos, eixos identificados e tabela acessivel. Eixos X numericos de linhas preservam a distancia entre os valores.

Trilha, revisao e simulado exibem a mesma midia. O simulado salva uma copia da figura junto da questao. Imagens podem ser HTTPS ou arquivos locais em `/question-media/`; ha ampliacao e recuperacao de falha. Nao foi criado um painel de upload: a midia entra pelo banco/geracao de questoes.

## Atualizacao do ambiente publicado

1. Fazer backup do PostgreSQL e conferir o historico de migrations antes de atualizar.
2. Em bancos gerenciados por migrations, aplicar `npx prisma migrate deploy` a partir de `apps/api`. A migration `20261011000100_question_media` adiciona somente a coluna JSONB opcional.
3. Executar `npx prisma db seed` no mesmo ambiente. O seed faz upsert e preserva os IDs dos topicos existentes; nao renumerar suas chaves de ordem.
4. Publicar API e frontend. Conferir se o comando configurado diretamente no Railway nao sobrepoe o arquivo `railway.json`. O fluxo legado nesse arquivo usa `prisma db push` sem `--accept-data-loss`, seguido do seed; nao executar migrations sobre um banco legado nao baselined sem revisar seu estado.
5. Validar as 16 materias na trilha, responder duas sessoes curtas do mesmo topico e conferir resultado/painel. Abrir uma questao visual e sua revisao no celular.

## Validacao local

`npm run build:all`, `npm run lint` e `npm test --workspace=apps/api`.

Os testes precisam de PostgreSQL isolado. Definir `TEST_DATABASE_URL=postgresql://.../postgres?schema=test_vitest`; a suite cria e remove esse schema. Nunca usar banco de usuarios reais para os testes.
