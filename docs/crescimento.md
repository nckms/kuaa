# Plano de crescimento (primeiros 90 dias)

Objetivo: alunos de ENEM que **terminam o diagnóstico, voltam na semana 2 e, depois, assinam**. Visualização sozinha não conta.

Regras que não mudam com a pressa:
- Nada de depoimento inventado, perfil falso de aluno ou "resultado" que ninguém mediu.
- Parceria paga sempre identificada como publicidade (#publi / "parceria paga com o Kuaa"), como exige o CONAR.
- Não prometer aprovação, nota nem "método comprovado".

## Métricas da semana (toda segunda, `npm run metrics`)

| Métrica | Linha de base (24/11) | Meta em 8 semanas |
| --- | --- | --- |
| Cadastros reais por semana | 1 a 11 | 50 |
| Diagnóstico concluído / cadastros | ~55% | 75% |
| Praticou após diagnóstico | 50% | 75% |
| Voltou na semana 2 | 0% | 25% |
| Assinantes | 0 | 10 |

## Canal 1 — Perfil do Kuaa (Instagram/TikTok), 4 posts por semana

Formato: tela do celular gravada + voz, 20–40 s, legenda com o link do site.

Roteiros prontos:
1. **"Errei essa no ENEM simulado — veja o porquê"**: mostra uma questão do acervo, a alternativa errada mais comum e a explicação do Kuaa. Final: "Faça o diagnóstico grátis, 5 minutos".
2. **"5 minutos para saber o que estudar"**: grava o diagnóstico inteiro acelerado e o resultado com o tópico recomendado.
3. **"Interpretação de texto: o erro que mais aparece"**: uma pegadinha por vídeo (série semanal).
4. **"Quanto tempo falta para o ENEM 2027?"**: contagem + rotina de 36 min/dia mostrada no app.
5. **"Pergunta pro Sabiá"**: alguém pergunta algo difícil e o Sabiá explica o raciocínio sem dar a resposta pronta.
6. **"Estudante paga meia"**: como funciona a meia do Plus com carteirinha (só quando a venda estiver aberta).

## Canal 2 — Diário do fundador (perfil pessoal do Nicolas), 2 posts por semana

Tom: bastidores honestos, números reais.
- "Lancei o Kuaa e ninguém voltou na segunda semana. Isso é o que mudei" (usar `docs/funil-retencao.md`).
- "Tenho 18 anos e estou construindo uma plataforma de estudos: o que dá certo e o que não dá".
- "Por que o Kuaa aceita Pix Automático e não exige cartão".
- Atualização mensal com o funil (antes → depois).

## Canal 3 — Escolas e cursinhos populares (piloto)

- Oferecer o Plus grátis por 30 dias para uma turma inteira (liberar com `grant-plus`, referência = nome da turma).
- Pedir em troca: 10 minutos em sala para o diagnóstico e um retorno do professor depois de 2 semanas.
- Medir a turma separada (domínio de e-mail da escola, se houver, ou lista de contas).

## Canal 4 — Convite entre alunos (no produto, já no ar)

Cada aluno tem um link `/?convite=<código>` no painel ("Estude com um amigo").
Quando o amigo entra pelo link e **conclui o diagnóstico**, os dois ganham 7
dias de Plus (quem convida: até 5 bônus por 30 dias). Os cadastros aparecem
como origem `convite` em `npm run metrics`.
- Em sala (piloto, Canal 3): pedir para cada aluno convidar um colega de outra turma.
- Nos posts: "Chama um amigo e ganhem 7 dias do Plus" no fim do vídeo.

## Canal 5 — Busca orgânica (proposta, não implementado)

Com 2.742 questões oficiais e explicações, dá para publicar uma página por questão
("ENEM 2022 questão 92 — resolução comentada"), que é exatamente o que estudantes buscam no
Google. Pré-requisitos: faturamento do Gemini (gerar as explicações de todas as questões),
revisão jurídica do uso das provas e páginas renderizadas no servidor (o site hoje é SPA).
Custo estimado da geração: poucos reais (2.742 chamadas de modelo flash-lite).

## Kit para micro-influenciadores (5 a 50 mil seguidores de estudo/ENEM)

**Proposta:** pagamento fixo pequeno ou Plus grátis + comissão por assinatura, com link rastreável `kuaa-web.vercel.app/?ref=<nome>` (o `ref` fica salvo no cadastro por 30 dias após o clique e aparece em `npm run metrics`, tabela "Cadastros por origem"). Para posts próprios use `?utm_source=instagram&utm_campaign=<roteiro>`.

**Briefing:**
- Use o Kuaa de verdade por pelo menos 3 dias antes de gravar.
- Mostre o diagnóstico e uma explicação de erro na tela.
- Diga o que achou com suas palavras, incluindo o que não gostou.
- Marque como publicidade no início do vídeo e na legenda.
- Não diga que o Kuaa garante aprovação ou aumento de nota.

**Mensagem de contato:**
> Oi, [nome]! Sou o Nicolas, criador do Kuaa, uma plataforma de estudo para o ENEM que faz um diagnóstico de 5 minutos e indica o que estudar. Queria te convidar para testar e, se fizer sentido pra você, fazer um vídeo de parceria paga (identificado como publicidade). Posso te mandar um acesso ao Plus para testar primeiro?

## Ordem de execução

1. Domínio + e-mail semanal (sem canal de volta, o resto vaza).
2. Perfil do Kuaa com os roteiros 1–3 por 2 semanas, medindo cadastros com `ref`.
3. Uma turma piloto.
4. Abrir a venda (checklist em `docs/lancamento.md`) e só então os influenciadores pagos.
