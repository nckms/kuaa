# Entrega do TCC: o que foi implementado, testado e o que falta

Atualizado em 14/11/2026, a partir do branch `feat/redesign-claude-design` (base `971100f`) com as alterações desta rodada. Este documento separa três coisas que não podem ser confundidas:

- **Teste técnico**: o código faz o que promete, em ambiente controlado, com dados sintéticos.
- **Revisão pedagógica**: pessoas qualificadas julgam se as questões e explicações estão corretas e adequadas.
- **Pesquisa com participantes**: estudantes reais usam o sistema e respondem a instrumentos (SUS etc.).

Só a primeira foi realizada. Nenhuma pontuação SUS, revisão humana ou ganho de aprendizagem foi coletado; nada abaixo deve ser lido como resultado empírico.

## Como o sistema decide (descrição fiel ao código)

| Peça | Como funciona | Onde |
| --- | --- | --- |
| Diagnóstico inicial | 12 questões de vários níveis. O resultado define a dificuldade da primeira prática (1 a 3) enquanto não houver 5 respostas no tópico. | `modules/diagnostic` |
| Domínio por tópico (0 a 5) | **Regras fixas**, não aprendizado de máquina. Só reavalia com ≥ 5 respostas dos últimos 30 dias (respostas < 1 s não contam). Sobe 1 nível com acerto ≥ 80% em dificuldade ≥ nível atual; desce 1 com acerto < 40% em dificuldade ≤ nível atual. Sessões curtas acumulam evidência para a próxima. | `services/adaptive/DifficultyEngine.ts`, `PerformanceEngine.ts` |
| Reforço | Tópico com ≥ 5 respostas recentes e acerto < 70% vira reforço prioritário. A dificuldade do reforço é a média recente (−1 se acerto < 40%), **limitada** ao alvo normal do nível atual. | `services/adaptive/RecommendationEngine.ts` |
| Dificuldade alvo | Nível atual + 1 (1 a 5), ou a do diagnóstico, ou a de reforço. O mesmo número vai ao prompt da IA, é gravado nos metadados da sessão e filtra a reserva curada. | `RecommendationEngine.getTargetDifficulty`, `modules/quiz/quiz.service.ts` |
| Geração de questões | Gemini com prompt versionado (`few-shot-v1`) e **até 2 exemplos** escolhidos entre 6 referências de matemática. Saída validada por esquema (5 alternativas, 1 correta, dificuldade). Timeout absoluto de 24 s com novas tentativas. | `modules/quiz/fewShot.ts`, `quiz.service.ts` |
| Reserva (fallback) | Se a IA falhar ou não houver chave: 236 questões autorais curadas, filtradas por tópico e por dificuldade a até 1 nível do alvo. A sessão registra `source: CURATED` e o motivo; a tela informa a origem. | `modules/quiz/curatedQuestions.ts`, `src/data/` |
| Índice Kuaa | Média de acertos **ponderada pela dificuldade**, convertida para 300 a 1000. Mede desempenho nas atividades do Kuaa. **Não** é nota do vestibular nem probabilidade de aprovação. | `modules/index/index.service.ts` |
| Sabiá | Tutora de IA (Gemini) instruída a orientar sem entregar a resposta. Sem chave ou com falha, informa indisponibilidade. | `modules/sabia` |

## Matriz de objetivos

Objetivos conforme a seção 1.3.2 da monografia.

| Objetivo | Implementação | Teste técnico | Evidência | Limitação |
| --- | --- | --- | --- | --- |
| Mapear padrões de provas (meta do texto: 80% das áreas, dez anos de FUVEST, UNICAMP e ENEM) | Currículo cadastrado: ENEM 73, FUVEST 52, UNICAMP 43 tópicos. Corpus few-shot: **6 exemplos de matemática** (2 por vestibular, edições 2019, 2023, 2024), adaptados e rastreados. | `fewShot.test.ts` (7), `enemCurriculum*.test.ts` (4), `study.test.ts` (3) | `src/data/exam-references.json`, `docs/referencias-provas.md` | **Não houve análise de dez anos de provas.** Cobertura de 80% não foi medida. Os exemplos são só de matemática; para outras áreas o prompt reaproveita apenas o estilo. A monografia precisa ser corrigida neste ponto. |
| Arquitetura cliente-servidor com autenticação JWT (meta: 50 usuários simultâneos) | React + Vite; Express + Prisma; JWT de 15 min + refresh token; limites de taxa; recuperação de senha. | `auth.test.ts` (8), `rateLimit.test.ts` (1), `settings.test.ts` (14), `passwordReset.test.ts` (5) | Suíte local: 150/150 (ver abaixo) | **Teste de carga não executado.** Existe o roteiro `apps/api/loadtest/quiz-flow.js` (k6); não há medição de 50 usuários. Refresh token é guardado em texto no banco e no `localStorage` do navegador. |
| Integrar IA para gerar exercícios e feedback (metas: 75% de aprovação por especialistas; resposta < 3 s) | Gemini com few-shot, validação de esquema, metadados de origem; reserva curada como fallback. | `quizGeneration.test.ts` (6), `adaptiveJourney.test.ts` (5, com **mock**), `curatedQuestions.test.ts` (5) | Origem registrada por sessão (`generation.source`) e exibida ao aluno | **Sem revisão por especialistas.** Testes usam mock: não comprovam disponibilidade nem qualidade do Gemini real. Em ensaios anteriores o Gemini retornou 503/timeout várias vezes. Latência < 3 s **não** é atendida quando a IA é usada (timeout de até 24 s). |
| Lógica adaptativa e banco de dados (meta: melhora progressiva após 3 ciclos) | Regras descritas acima; progresso, respostas e evidência pendente persistidos no PostgreSQL. | `adaptive.test.ts` (14), `performance*.test.ts` (12), `diagnosticFlow.test.ts` (2), `adaptiveJourney.test.ts` (5) | `adaptiveJourney.test.ts` comprova, pela API: diagnóstico → 1ª dificuldade; poucas respostas não mudam o domínio; avanço; reforço; persistência após novo login; mesma dificuldade no prompt e nos metadados; origem IA x reserva. | Comprova o **comportamento das regras**, com aluno sintético. **Não** há medição de melhora de aprendizagem com estudantes reais. |
| Usabilidade (meta: SUS ≥ 70) | Questionário SUS adaptado em `/avaliacao`, com consentimento; cálculo no servidor. | `evaluation.test.ts` (23), `evaluationPersistence.test.ts` (1) | Protocolo em `docs/avaliacao.md` | **Nenhuma coleta realizada.** Não há pontuação SUS. A adaptação do instrumento não foi validada. |
| Recuperação de progresso pelo aluno (requisito de uso) | Fluxo "Esqueci minha senha": token aleatório de uso único, só o hash no banco, validade de 30 min, mesma resposta para e-mail existente ou não, encerra sessões ao redefinir. | `passwordReset.test.ts` (5) | Verificação local ponta a ponta com caixa SMTP de desenvolvimento e navegador (14/11/2026) | **Entrega real de e-mail em produção não verificada**: falta configurar um provedor SMTP (ver abaixo). |
| Ranking sem expor terceiros | Outros estudantes aparecem como "Estudante N", sem nome, foto ou id. | `ranking.test.ts` (1) | Resposta da API contém só `rank`, `displayName`, `xp`, `level` | Ver seção de privacidade: anonimato do ranking não equivale a conformidade com a LGPD. |

## Teste técnico: execução registrada

Ambiente: contêiner Linux, Node 22, PostgreSQL 16.15 local em `127.0.0.1:55433`, banco descartável `kuaa_test`.

```bash
createdb -h 127.0.0.1 -p 55433 -U postgres kuaa_test
TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55433/kuaa_test npm run test:local --workspace=apps/api
```

Resultado em 14/11/2026: **25 arquivos, 150 testes, 150 aprovados, 0 falhas.** Contagem por arquivo: adaptive 14, adaptiveJourney 5, auth 8, curatedQuestions 5, diagnosticFlow 2, enemCurriculum 2, enemCurriculumFlow 2, enrollments 3, essays 2, evaluation 23, evaluationPersistence 1, fewShot 7, passwordReset 5, performance 8, performanceFlow 4, questionMedia 3, questionMediaFlow 2, quiz 9, quizGeneration 6, ranking 1, rateLimit 1, sabia 6, settings 14, simulado 14, study 3.

Também executados: `npx tsc --noEmit` (API), `npm run build` (web e API) e `npm run lint` (web e API), sem erros. O lint e o build não substituem testes no navegador do site publicado, que ficaram a cargo de outra frente.

Guarda do banco de teste, verificada: `.../postgres` (sem `_test`) e um host remoto com `kuaa_test` foram recusados antes de qualquer migration.

Problemas reais encontrados e corrigidos nesta rodada:

1. **Suíte bloqueada**: o `globalSetup` apontava para um PostgreSQL remoto inacessível. Agora exige destino local `*_test` (ou schema `test_vitest` com permissão explícita) e mostra o destino antes de agir.
2. **Reforço com dificuldade maior que a das questões erradas**: acertos antigos em dificuldade alta (vindos do diagnóstico) elevavam a média, e o reforço pedia questões mais difíceis. Encontrado pelo `adaptiveJourney.test.ts`; corrigido em `getTargetDifficulty` com teste unitário.
3. **Testes desatualizados**: `study.test.ts` esperava 94 tópicos fixos, mas o currículo cresceu; `quiz.test.ts` assumia 3 questões de reserva num alvo em que a reserva só tem 2. Ambos ajustados para refletir as regras atuais.
4. **Link de redefinição não funcionava no navegador em modo de desenvolvimento**: a página apagava o token da URL ao lê-lo e, como o React chama o inicializador duas vezes no StrictMode, a segunda leitura via o link como "incompleto". Encontrado no teste de navegador local e corrigido.

O log bruto da primeira execução que falhou não foi preservado; os itens 1 a 3 estão documentados nos próprios testes.

## Revisão pedagógica: não realizada

Nenhuma questão gerada por IA, da reserva curada ou dos exemplos few-shot passou por revisão de especialistas. Para fazer: definir amostra (geradas e da reserva, separadas), rubrica (correção do gabarito, ambiguidade, distratores, adequação ao conteúdo, dificuldade, explicação), revisores, resolução de divergências e registrar aprovações e rejeições reais. A meta de 75% da monografia permanece **sem resultado**.

## Pesquisa com participantes: não realizada

Instrumento e protocolo prontos (`docs/avaliacao.md`). Nenhum participante, nenhuma resposta, nenhuma média SUS. Como o público são estudantes de ensino médio, possivelmente menores de idade, o protocolo precisa passar pelas exigências da instituição e pelo consentimento adequado (inclusive dos responsáveis, quando aplicável) antes de qualquer coleta. A ausência de coleta deve aparecer na monografia como limitação.

## Recuperação de senha

Fluxo para o aluno: Entrar → "Esqueci minha senha" → e-mail → link `/redefinir-senha#token=…` → nova senha → entrar. O token fica no fragmento `#`, que o navegador não envia ao servidor, e é removido da barra de endereço ao abrir a página.

Garantias implementadas e testadas: resposta idêntica (HTTP 202) para e-mail cadastrado ou não, sem esperar o envio; token de 256 bits, guardado só como hash SHA-256; validade configurável (padrão 30 min); uso único com consumo atômico (duas requisições simultâneas não usam o mesmo token); pedido novo invalida os anteriores; intervalo de 60 s entre e-mails para a mesma conta; limite por IP em memória (independe do Redis); redefinição encerra todas as sessões abertas; o token não aparece em log (antes aparecia).

Verificação local feita em 14/11/2026: API real + caixa SMTP de desenvolvimento + navegador. Pedido para e-mail cadastrado e não cadastrado com a mesma resposta; uma única mensagem entregue; redefinição aceita; reutilização recusada; senha antiga recusada no login e nova aceita; nenhuma ocorrência do token no log da API.

**Para produção (ação humana; nada disto foi feito):**

1. Escolher um provedor SMTP (ex.: o do domínio da escola, ou um serviço transacional) e obter credenciais. Nenhuma credencial foi criada ou incluída no repositório.
2. Definir no Railway: `MAIL_TRANSPORT=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (remetente autorizado pelo provedor) e `APP_URL=https://kuaa-web.vercel.app`.
3. Publicar a API para criar a tabela `PasswordResetToken` (migration `20261114000100_password_reset_tokens`). Atenção: o `railway.json` usa `prisma db push`, não `prisma migrate deploy`; conferir o histórico de migrations do banco antes de trocar o comando.
4. Conferir `GET /api/v1/health`: `passwordResetEmail: "configured"` indica só que há transporte configurado, **não** que o e-mail chega.
5. Fazer um pedido real para uma conta de teste e confirmar o recebimento (inclusive na caixa de spam). Só então afirmar que a recuperação funciona em produção.

Sem essa configuração, a API registra um aviso na inicialização e o pedido é aceito, mas nenhum e-mail é enviado.

## Privacidade: o que existe e o que falta

Isto é um inventário técnico, não um parecer jurídico. O sistema **não** deve ser descrito como "em conformidade com a LGPD".

Existe:

- Senhas com bcrypt (custo 12); tokens de redefinição só como hash.
- Ranking sem nome, foto ou identificador de outros estudantes (coberto por teste).
- Endpoints de dados pessoais exigem autenticação; os testes cobrem isolamento entre usuários.
- Cabeçalhos de segurança (`helmet`) e CORS restrito à origem configurada.
- Consentimento explícito antes de enviar redação para análise por IA e antes de responder ao SUS.
- Avisos na interface de que a IA pode errar e de que as questões não são oficiais.

Falta:

- Política de privacidade e termos de uso publicados, com base legal, finalidades e contato.
- Exclusão da conta e dos dados pelo próprio usuário; exportação dos dados.
- Política de retenção (respostas, conversas do Sabiá e redações ficam indefinidamente).
- Aviso claro, antes do uso do Sabiá, de que as mensagens são enviadas a um provedor externo (Google).
- Tratamento específico para menores de idade (o público-alvo inclui estudantes de ensino médio).
- Refresh token armazenado sem hash e mantido no `localStorage` do navegador.
- Registro auditável de consentimento (versão do termo, data de aceite, retirada).

## Pendências que exigem ação humana

1. Corrigir a monografia: substituir "análise de dez anos de provas" pelo corpus real (6 exemplos de matemática); descrever a adaptação como regras e a geração como IA com few-shot; descrever o Índice como medida de desempenho nas atividades; incluir o capítulo de resultados apenas com o que foi medido.
2. Configurar e verificar o envio de e-mail em produção (seção acima).
3. Revisar o diff, fazer commit e, quando decidirem, publicar a API e o site. Nenhum commit, push ou deploy foi feito nesta rodada; o banco de produção não foi tocado.
4. Se houver tempo e autorização: coleta SUS e revisão pedagógica conforme protocolos. Caso contrário, declarar como limitação.
