# Evidencias e fechamento do TCC

Este documento organiza pendencias; nao relata estudo executado. Nenhum participante, resposta, media SUS ou ganho de aprendizagem foi inventado.

## Referencias ao manuscrito

Segundo as referencias fornecidas pelo autor, o PDF tem 44 paginas: objetivos na p. 6, recorte de dez anos na p. 20, SUS na p. 24 e consideracoes finais na p. 41. A paginacao nao foi conferida nesta entrega e pode mudar. Falta inserir capitulo de resultados antes das consideracoes finais, somente apos coleta e analise reais.

| Frente | Evidencia necessaria | Situacao |
| --- | --- | --- |
| Objetivos (p. 6) | Matriz objetivo, funcionalidade, teste e evidencia verificavel | Pendente de confronto com texto integral |
| Recorte de dez anos (p. 20) | Corpus, anos exatos, fontes, criterios, exclusoes e procedimento reprodutivel | NAO afirmar analise realizada; pendente |
| Usabilidade/SUS (p. 24) | Protocolo, consentimento, instrumento revisado, n real e analise agregada | Instrumento implementado; coleta/validacao pendentes |
| Resultados | Evidencias tecnicas e empiricas separadas, limitacoes e discussao | Capitulo pendente antes das consideracoes finais |
| IA e few-shot | Regras documentadas, exemplos, versoes e avaliacao humana | Pendente; nao equivale a qualidade comprovada |

## Dossie de evidencias

1. Registrar versao/commit avaliado, data, ambiente e comandos executados, com resultado real e limitacoes. Capturas devem mostrar estado real do sistema, sem credenciais ou dados pessoais.
2. Mapear cadastro, matricula, atividade, erro, explicacao, reforco e simulado a objetivos especificos. Distinguir funcionalidade implementada, teste tecnico aprovado e validacao com usuarios.
3. Arquivar protocolo e instrumento versionados, aprovacao institucional quando aplicavel e registro apropriado de consentimento. Seguir `docs/avaliacao.md` antes de recrutar.
4. Registrar recrutamento, participantes reais, interrupcoes, exclusoes e dispositivo. Publicar apenas agregados; nao anexar dump do banco ou comentarios identificaveis.
5. Guardar planilha analitica restrita, formula, criterios e data de corte; preencher tabelas somente com dados reais. Ausencia de coleta deve aparecer como limitacao, nao como resultado positivo.

## IA, regras e few-shot: validacao pendente

- Documentar regras reais de adaptacao/dificuldade a partir do codigo integrado, entradas utilizadas, limites, fallback e casos de teste. Nao descrever regra planejada como implementada.
- Para few-shot, registrar exemplos efetivamente presentes no prompt e sua origem/autorizacao, separando-os das questoes usadas para avaliar. Se nao houver exemplos no fluxo real, nao afirmar uso de few-shot.
- Registrar provedor/modelo/versao, prompt, parametros disponiveis e tratamento de indisponibilidade; nao inferir qualidade pela resposta HTTP ou por testes com mocks.
- Definir amostra real e rubrica humana: corretude do enunciado/gabarito, ambiguidade, plausibilidade de distratores, adequacao curricular, dificuldade, explicacao, vieses e seguranca. Definir revisores e resolucao de divergencias antes da avaliacao; registrar concordancia e rejeicoes reais.
- Qualidade das questoes, eficacia de aprendizagem e usabilidade sao construtos distintos. SUS nao valida conteudo de IA nem demonstra ganho de aprendizagem. Avaliacao humana esta PENDENTE.

## Estrutura sugerida para resultados

Descrever primeiro as evidencias tecnicas verificadas e suas limitacoes; depois, quando houver coleta, caracterizar amostra sem identificacao, relatar execucao das tarefas, apresentar SUS agregado e temas qualitativos. Separar avaliacao humana de IA em secao propria. Discutir ameacas a validade, adaptacao do instrumento, amostra, versao do sistema e dados ausentes. Atualizar conclusoes para refletir apenas resultados observados.

## Integracao tecnica em 30/09/2026

Builds de frontend e backend e lint aprovados. No celular de 320 px, corrigido overflow do cabecalho do quiz e conferida revisao com respostas corretas, erradas e em branco. Concluir uma atividade respondida libera o topico seguinte sem atribuir dominio artificial. O simulado finalizado disponibiliza gabarito e explicacoes; antes de finalizar, esses campos nao sao enviados ao cliente.

Integrados schema, migration aditiva, Prisma Client, API `/evaluation/me` e tela protegida `/avaliacao`. Preferencias e vestibular ativo sao persistidos. Respostas do quiz e simulado alimentam dashboard, indice e lacunas. A retomada busca uma sessao aberta do proprio usuario; a revisao inclui questoes em branco. Ranking nao apresenta nome/foto de terceiros.

Validacao local: 104 testes aprovados em 14 arquivos, PostgreSQL isolado (schema descartavel `test_vitest`). A suite cobre autenticacao, isolamento entre usuarios, respostas simultaneas, finalizacao, retomada, configuracoes, avaliacao persistida, adaptacao e fallback. Testes com provedor simulado nao demonstram disponibilidade ou qualidade do Gemini real.

Banco de reserva: 54 questoes autorais distintas, com cobertura dos 37 topicos cadastrados. Sessoes podem ser menores quando ha poucas questoes disponiveis; simulados usam ate 45 questoes distintas. O banco nao e uma prova oficial e ainda requer revisao pedagogica independente. Os seis exemplos few-shot adaptados estao identificados em `referencias-provas.md` e efetivamente integram o prompt.

No navegador foram verificados cadastro, matricula, resposta, recarga, resultado, atualizacao do dashboard, troca de vestibular e telas em largura de 320/390 px. Esses ensaios com conta sintetica nao constituem coleta SUS. O provedor real Gemini retornou 503 nos ensaios: estudo utiliza reserva, enquanto Sabia informa indisponibilidade e preserva a pergunta.

Publicacao nao confirmada: Railway CLI retornou Unauthorized. Nenhum commit ou deploy foi realizado nesta entrega. A migracao em producao e a verificacao do endereco publico permanecem necessarias. Nao usar `db push --accept-data-loss`. Se o banco remoto foi criado com `db push`, conferir o baseline das migrations antes de executar o deploy; nao marcar migrations como aplicadas sem comparar o schema.
