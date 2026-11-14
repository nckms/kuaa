# Kuaa: ajustes finais para a entrega

## Atualizacao apos QA: trabalhar somente nas pendencias

Os itens numerados abaixo preservam o contexto original. Nao refaca o cartao nem a separacao das contagens: testes de navegador na previa confirmaram ENEM 300, FUVEST 300 e UNICAMP 316; ao retornar a FUVEST, o painel voltou a 300. A pratica ENEM registrou 5 respostas, 2 acertos, e recomendou revisao (40%). Mobile foi emulado, nao fisico.

Prioridades restantes: distinguir origem desconhecida na pratica e em sessoes antigas; cobrir falhas do provedor e selecao de exemplos nos tres vestibulares; completar testes de empate, adaptacao e isolamento; investigar a indicacao transitoria "Comece aqui" durante a atualizacao da trilha. Reutilize os testes existentes; documente o que foi comprovado, sem apresentar testes sinteticos como pesquisa. Nao responder SUS. Nao alterar infraestrutura, fazer deploy nem usar banco de producao. O envio real de email depende de SMTP e de uma caixa de teste autorizada.

Trabalhe no repositorio atual. Preserve as mudancas existentes. Use PostgreSQL descartavel nos testes; nao rode seeds ou resets em producao. Nao responda ao SUS, nao gere respostas sinteticas para ele e nao invente resultados de usabilidade.

Evidencia de navegador em producao: uma pratica ENEM mostrou "acervo"; uma pratica UNICAMP de Generos Textuais Dissertativos mostrou "IA". Isso nao e uma regra por vestibular. Na FUVEST, em um diagnostico empatado, a recomendacao indicou Linguagens e a trilha abriu em Fisica. Em uma pratica com tres respostas, apenas uma pareceu contar. Investigue antes de atribuir a causa.

1. Origem: rastreie quiz.service.ts ate QuizPage.tsx. Diferencie AI_GENERATED, CURATED e origem desconhecida, inclusive ao reabrir uma sessao antiga. Nao converta metadado ausente em "acervo". Troque "Gerando..." por "Preparando questoes..." quando a origem ainda nao for conhecida. Mantenha o banco como alternativa; registre motivo tecnico do fallback sem dados pessoais. Verifique separadamente o caminho do simulado.
2. Teste os tres vestibulares com provedor simulado: resposta valida, indisponibilidade, timeout e resposta invalida. Verifique origem persistida, alinhamento ao topico e dificuldade. Confirme que os exemplos few-shot sao enviados quando existem; documente o comportamento sem exemplos. Nao dependa de chave real no CI.
3. Diagnostico e progresso: reproduza o empate e confira se a recomendacao leva ao topico anunciado. Teste tres respostas distintas, incluindo rapidas, repeticao de envio e recarga. Diferencie respostas registradas de respostas elegiveis para dominio; trilha e painel devem concordar. Teste subida e descida de dificuldade e isolamento por vestibular.
4. Recuperacao de senha: confira se tokens ou links completos aparecem nos logs; remova-os e teste expiracao e uso unico. Nao divulgue credenciais.
5. Entregue mudancas, comandos e resultados reproduziveis. Diferencie comportamento observado, testes com mocks e itens ainda nao validados. Na documentacao, descreva adaptacao por regras e geracao few-shot separadamente, sem prometer eficacia pedagogica medida.

## Simulados semanais: falha reproduzida no painel

Na conta de QA em producao, ENEM e UNICAMP foram iniciados e entregues com uma resposta correta cada. A FUVEST ja tinha uma tentativa concluida, consultada sem refazer. Os tres resultados mostraram 316 pontos, 1 acerto e 44 em branco. Ao voltar ao painel de cada vestibular, o cartao continuou em "Disponivel / Fazer agora", sem a nota. A tentativa nao sumiu: o problema observado e a apresentacao no painel. O impacto no calculo do Indice nao foi medido isoladamente.

6. Em DashboardPage.tsx substitua o cartao fixo pelo estado da tentativa da semana para o vestibular ativo: iniciar, continuar ou ver resultado. Apos entregar, mostre nota e contagens de acertos, erros e em branco; preserve isso na recarga e ao alternar vestibulares. Carregamento ou falha de consulta nao devem parecer prova disponivel. Cubra tambem a virada da semana.
7. A montagem atual em simulado.service.ts combina registros CURATED/OFFICIAL do banco e acervo curado local, sem chamar Gemini ao iniciar a prova. Nao anuncie geracao por IA para o simulado. Na revisao, identifique a origem real quando disponivel; nao classifique toda a prova como oficial. Teste origem, persistencia da nota e efeito no Indice separadamente, inclusive contra dupla finalizacao. Nao use a conta de QA como participante do SUS.
