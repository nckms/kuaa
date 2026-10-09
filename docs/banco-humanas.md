# Banco autoral de Humanas

## Escopo

`apps/api/src/data/curated-humanities.json` contém 24 questões originais em português para compor um banco de fallback. Esta entrega fornece apenas dados: não conecta o arquivo ao gerador, não modifica schema, backend ou frontend e não executa testes de banco de dados.

Cada objeto contém exclusivamente `id`, `topicTags`, `body`, `options`, `explanation` e `difficulty`. Há cinco alternativas identificadas de A a E, uma única resposta correta e dificuldade inteira de 1 a 5. Os identificadores estáveis vão de `humanas-001` a `humanas-024`.

## Cobertura

Os grupos abaixo são exclusivos para contagem; tags secundárias permitem relações entre conteúdos sem aumentar o total.

| Área principal | IDs | Quantidade | Conteúdos |
| --- | --- | --- | --- |
| Interpretação e inferência | 001–003 | 3 | Inferência de gesto, ironia e limites de dados |
| Gramática e linguagem | 004–007 | 4 | Oração restritiva, coesão, variação de registro e intertextualidade |
| Literatura brasileira e portuguesa | 008–010 | 3 | Ironia realista, cotidiano modernista e motivos da cantiga de amigo |
| Redação e argumentação | 011–014 | 4 | Tese, causalidade, refutação e carta aberta |
| História do Brasil República | 015–017 | 3 | Coronelismo, Estado Novo e Diretas Já |
| Geografia e geopolítica | 018–020 | 3 | Impermeabilização, mobilidade pendular e união aduaneira |
| Filosofia e sociologia | 021–022 | 2 | Universalização kantiana e fato social durkheimiano |
| Economia, política e cultura | 023–024 | 2 | Poder de compra e transmissão cultural |
| Total | 001–024 | 24 | |

As tags reproduzem nomes de tópicos de `apps/api/prisma/seed.ts` em minúsculas, sem acentos e separados por espaços. Não são slugs de disciplinas nem nomes inventados de subtemas. Literatura portuguesa recebe `literatura portuguesa e brasileira`; os textos sobre literatura brasileira também recebem `literatura brasileira`. Não se presume que todas as tags sejam exclusivas de uma disciplina ou vestibular.

## Autoria e revisão

Todos os trechos, poemas, falas e cenários foram redigidos para este banco. Os enunciados identificam material autoral, situações ficcionais, dados fictícios ou sínteses didáticas, conforme o caso. Aspas internas delimitam falas inventadas, não citações de obras publicadas. Os fragmentos literários ilustram recursos e motivos; não são atribuídos a autores históricos nem apresentados como textos medievais autênticos.

Foi realizada conferência individual do enunciado, da alternativa marcada e da explicação, incluindo leitura das quatro alternativas incorretas. Os pontos de atenção foram: distinção entre pontos percentuais e crescimento relativo (003), oração restritiva versus explicativa (004), ausência de inferência causal suficiente (012), reivindicação direta versus eleição indireta (017), tarifa externa comum (020) e renda nominal versus poder de compra (023). A conferência autoral não equivale a revisão independente por professores.

### Gabarito de conferência

| IDs | Respostas na ordem |
| --- | --- |
| 001–006 | B, D, A, C, E, B |
| 007–012 | D, A, C, E, B, D |
| 013–018 | A, C, E, B, D, A |
| 019–024 | C, E, B, D, A, C |

As explicações justificam a resposta e distinguem os distratores. Nenhuma questão é apresentada como oficial, retirada de prova, aprovada por instituição ou revisada por docentes. A relação com os vestibulares do seed é apenas temática.

## Validação e limites

A validação local deve conferir o parse do JSON, os campos exatos, IDs únicos, cinco alternativas A–E, textos não vazios, booleanos, uma resposta correta, dificuldade inteira no intervalo e correspondência das tags com o seed normalizado. Essa validação é de arquivo e não requer Prisma, migrações, API ou conexão com banco.

A dificuldade é editorial, não calibrada por desempenho: 11 itens de nível 2, 12 de nível 3 e um de nível 4. O banco não pretende cobrir integralmente as disciplinas nem todos os tópicos do seed. A cobertura de literatura trabalha recursos e tradições, não listas de leitura ou análise integral de obras. Os dados econômicos e geográficos são modelos didáticos, não estatísticas observadas. Os fatos históricos usados são consolidados; não há perguntas sobre acontecimentos correntes.

Não houve pesquisa de similaridade em bases externas: a autoria dos textos desta entrega não garante inexistência de formulações semelhantes em outros materiais. Também não houve revisão pedagógica independente, aplicação com estudantes, calibração psicométrica ou teste de integração do fallback. Uma revisão futura pode ampliar a variedade de gêneros, testar a força dos distratores e equilibrar a distribuição de dificuldades sem alterar o contrato do arquivo.
