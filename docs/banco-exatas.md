# Banco autoral de exatas e ciências da natureza

## Origem e contrato

O arquivo `apps/api/src/data/curated-science.json` contém 30 exercícios originais em português, elaborados para o fallback educacional do Kuaa: 16 de matemática e 14 de ciências da natureza. São questões de estilo escolar e vestibular básico, não questões oficiais, reproduções de provas ou itens atribuídos a instituições. Biologia e química fazem parte da cobertura solicitada de ciências da natureza.

O documento JSON é um array. Cada item contém exclusivamente `id`, `topicTags`, `body`, `options`, `explanation` e `difficulty`. Cada questão tem cinco alternativas A a E, com textos distintos e exatamente um `isCorrect: true`. Os IDs estáveis seguem `kuaa-exatas-001` a `kuaa-exatas-030`. Não renumerar IDs já publicados ao ampliar o banco.

Os enunciados incluem os dados, as hipóteses e as convenções necessárias; nenhum depende de figura, tabela externa ou texto ausente. As explicações apresentam os cálculos ou o raciocínio conceitual. Valores fracionários e expressões com pi ou raízes preservam respostas exatas; vírgula é separador decimal e ponto é separador de milhar no texto em português.

## Cobertura e gabarito

| Área | IDs (sufixos) | Quantidade | Gabarito na ordem dos IDs |
| --- | --- | ---: | --- |
| Funções, álgebra e gráficos | 001 a 004 | 4 | B, D, A, E |
| Geometria plana, espacial e analítica | 005 a 008 | 4 | C, A, D, B |
| Trigonometria | 009 a 010 | 2 | C, E |
| Probabilidade, combinatória e estatística | 011 a 014 | 4 | B, D, A, C |
| Progressões e sequências | 015 a 016 | 2 | E, B |
| Cinemática e dinâmica | 017, 018, 025 | 3 | D, A, E |
| Termologia e óptica | 019, 020, 026, 027 | 4 | C, E, B, D |
| Química orgânica | 021, 022, 028, 029 | 4 | B, D, A, C |
| Biologia celular e genética | 023, 024, 030 | 3 | A, C, E |
| **Total** | **001 a 030** | **30** | |

Geometria inclui um problema plano, um espacial e dois analíticos. O grupo estatístico contém uma probabilidade sem reposição, uma combinação com restrição, média/mediana e variância populacional. Os pares de física contemplam individualmente movimento, força, calor sensível e formação de imagem. Química inclui estequiometria da combustão e isomeria de função; biologia inclui contagem cromossômica e probabilidade mendeliana condicional.

## Compatibilidade das tags

As tags são frases completas correspondentes a nomes de tópicos de `apps/api/prisma/seed.ts`, convertidos para minúsculas e sem diacríticos. Não são slugs com hífens, nomes de disciplinas ou fragmentos de tópicos. Itens podem ter mais de uma tag quando o conteúdo atende a tópicos de diferentes trilhas.

| Nome no seed | Tag |
| --- | --- |
| Funções e Gráficos | `funcoes e graficos` |
| Álgebra e Funções | `algebra e funcoes` |
| Conjuntos e Funções | `conjuntos e funcoes` |
| Geometria Plana e Espacial | `geometria plana e espacial` |
| Geometria Analítica | `geometria analitica` |
| Geometria e Trigonometria | `geometria e trigonometria` |
| Trigonometria | `trigonometria` |
| Probabilidade e Estatística | `probabilidade e estatistica` |
| Combinatória e Probabilidade | `combinatoria e probabilidade` |
| Progressões e Sequências | `progressoes e sequencias` |
| Cinemática e Dinâmica | `cinematica e dinamica` |
| Termologia e Óptica | `termologia e optica` |
| Química Orgânica | `quimica organica` |
| Biologia Celular e Genética | `biologia celular e genetica` |

## Dificuldade e manutenção

`difficulty` usa a escala inteira de 1 a 5. Neste conjunto, 1 indica aplicação direta; 2 exige encadeamento curto ou distinção conceitual; 3 envolve otimização, identidade, interseção, estequiometria ou condicionamento. São 6 itens de nível 1, 18 de nível 2 e 6 de nível 3. Níveis 4 e 5 não foram usados: a proposta é um fallback elementar, não uma coleção avançada. A classificação é editorial, sem calibração psicométrica.

Cada tópico de natureza tem pelo menos três itens de casamento direto. Todos os tópicos matemáticos cobertos têm pelo menos dois; geometria analítica, trigonometria e progressões têm exatamente dois. Uma questão com várias tags continua sendo um único item: o consumidor deve deduplicar por `id` e limitar o quiz ao número de questões únicas disponíveis para o filtro, sem repetir itens para completar uma quantidade solicitada. As 30 questões não implicam 30 questões disponíveis em cada tópico.

Ao revisar, conferir estrutura JSON, IDs únicos, alternativas A–E, uma única correta, tags contra o seed normalizado e contas independentes. Além de textos diferentes, alternativas devem representar respostas matematicamente diferentes no contexto: frações equivalentes, unidades convertidas ou expressões simplificáveis não podem criar outra resposta correta. Nas questões conceituais, revisar também as condições que tornam a resposta única.

## Limitações

Esta entrega fornece somente conteúdo e documentação. Não conecta o arquivo ao serviço de fallback, não altera código consumidor e não executa seed, migrações ou operações no banco de dados. A integração em tempo de execução e a normalização de tópicos pelo consumidor precisam ser verificadas separadamente.

As contas e o gabarito são verificáveis diretamente pelos dados fornecidos, mas o banco não recebeu revisão pedagógica externa nem aplicação piloto. A cobertura é mínima por área e não esgota os tópicos do seed. Não há diagramas, dificuldade avançada, parâmetros aleatórios ou variantes; repetição pode ocorrer em uso prolongado. Modelos físicos e genéticos são idealizados conforme as hipóteses explícitas de cada questão.
