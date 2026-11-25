# Funil e retenção (produção, 24/11/2026)

Fonte: fork copy-on-write do ambiente de produção no Railway (somente leitura, apagado em seguida). Contas cujo e-mail indica teste (`test`, `teste`, `example`, `qa.`, `kuaa-test`) foram excluídas; restam cerca de 35 contas, muitas de colegas de turma e do próprio fundador, então os números são indicativos, não estatística.

| Etapa | Alunos |
| --- | --- |
| Escolheram uma prova (matrículas) | 44 |
| Nunca iniciaram o diagnóstico | 18 |
| Pararam no meio do diagnóstico | 3 (com 0, 3 e 4 respostas) |
| Terminaram o diagnóstico | 23 (mediana de 2 min entre cadastro e fim) |
| Abriram uma prática depois do diagnóstico | 11 de 22 |
| Terminaram uma prática | 9 |
| Estudaram em mais de um dia | 3 de 16 (13 usaram só um dia) |
| Voltaram na 2ª semana | 0 de 24 com a janela fechada |
| Usaram o Sabiá / fizeram simulado | 13 / 11 |

Sessões de prática: 36 concluídas (média de 2,7 respostas registradas) e 13 abandonadas (média de 0,7).

## Leitura

1. **O maior vazamento é antes do diagnóstico**: 18 alunos escolheram a prova e não começaram. O perfil tinha 4 telas antes da primeira questão e um "Pular" visível no topo.
2. **Depois do diagnóstico, metade parava**: o botão levava para a trilha, não para uma prática.
3. **Ninguém volta**: não há nenhum motivo externo para voltar (e-mail semanal depende de domínio; não há notificação).
4. Diagnóstico em 2 minutos (mediana) sugere respostas no chute ou contas de teste; o resultado inicial pode estar pouco calibrado.

## O que já foi feito

- PR #7: resultado do diagnóstico abre direto "Fazer 5 questões de <tópico recomendado>"; perfil informa a duração; "Pular" virou "Fazer depois".
- PR seguinte: o painel mostra um lembrete do diagnóstico enquanto ele não estiver concluído, com o progresso ("Falta pouco: 4 de 12").

## Próximos experimentos (por impacto)

1. Domínio + e-mail semanal ligado (único canal de volta hoje).
2. Prática que abre mais rápido: sessões abandonadas têm em média menos de 1 resposta — medir o tempo até a primeira questão e servir do acervo enquanto a IA gera.
3. Medir de novo em 2 semanas com `npm run metrics -- --exclude-domain example.com` e comparar com esta tabela.
