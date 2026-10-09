# Corpus inicial de referencias de provas

Verificacao realizada em 2026-09-29. O arquivo `apps/api/src/data/exam-references.json` e um **array JSON** com seis adaptacoes autorais rastreaveis: duas por vestibular, todas de matematica. Nao e uma transcricao oficial, um banco representativo nem uma analise de dez anos de provas.

## Recorte efetivamente conferido

| Vestibular/edicao | Aplicacao e caderno | Questao | Pagina do PDF | Pagina impressa | Gabarito oficial | Resultado da adaptacao |
| --- | --- | --- | --- | --- | --- | --- |
| ENEM 2023 | Regular, dia 2, 7 azul | 144 | 19 | 19 | C | 0,9 m³/h |
| ENEM 2023 | Regular, dia 2, 7 azul | 147 | 20 | 20 | D | 7 pacotes |
| FUVEST 2024 | Primeira fase, V | 31 | 13 | Sem numero no rodape extraido | B | 2*pi - 3*sqrt(3)/2 m³ |
| FUVEST 2024 | Primeira fase, V | 33 | 13 | Sem numero no rodape extraido | A | R$ 9,25 |
| UNICAMP 2019 | Primeira fase, Q/X | 59 | 22 | 20 | B | p/1,21 |
| UNICAMP 2019 | Primeira fase, Q/X | 61 | 22 | 20 | C | 14 |

`sourcePage` usa indice de pagina do PDF iniciado em 1, contando capas e folhas em branco. `year` identifica a edicao do exame, nao necessariamente o ano civil da aplicacao: a primeira fase FUVEST 2024 ocorreu em 19/11/2023. Os seis gabaritos estao na pagina 1 dos respectivos PDFs de respostas, nas colunas dos cadernos indicados. Nao intercambiar numeracoes entre cadernos.

## Fontes oficiais abertas

- ENEM: [catalogo INEP 2023](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2023), [prova azul](https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD7.pdf#page=19) e [gabarito azul](https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD7.pdf#page=1).
- FUVEST: [acervo 2024](https://www.fuvest.br/acervo-vestibular-2024/), [prova V](https://www.fuvest.br/wp-content/uploads/fuvest2024_primeira_fase_prova_V.pdf#page=13) e [gabarito retificado em 24/11/2023](https://www.fuvest.br/wp-content/uploads/fuvest2024_gabarito_primeira_fase_retificado_2023-11-24.pdf#page=1).
- UNICAMP: [catalogo de provas 2019](https://www.comvest.unicamp.br/vestibulares-anteriores/ingresso-2019/vestibular-2019/provas-2019/), [prova Q/X](https://www.comvest.unicamp.br/vest2019/F1/f12019Q_X.pdf#page=22), [gabarito Q/X](https://www.comvest.unicamp.br/wp-content/uploads/2018/11/gabarito_2019-F1.pdf#page=1) e [comentarios oficiais de matematica](https://www.comvest.unicamp.br/wp-content/uploads/2019/08/Matematica2019F1_final.pdf), paginas 2 e 4 do PDF para as resolucoes de 59 e 61.

Os catalogos e PDFs acessiveis foram consultados com ferramenta web. Parte das aberturas web retornou timeout/502; os PDFs selecionados foram entao efetivamente obtidos dos mesmos hosts oficiais com `curl.exe`, sem desabilitar TLS, e lidos em memoria com `pypdf`. Foram conferidos os enunciados, as alternativas, a pagina e o gabarito do caderno correspondente. Nenhum espelho comercial foi utilizado como evidencia. Nao foram salvos PDFs ou arquivos auxiliares no projeto.

## Conferencia matematica independente

- ENEM 144: area 3 multiplicada pela taxa de subida 0,6/2 resulta em 0,9. Os outros intervalos da tabela confirmam a constancia.
- ENEM 147: 1800 g exigem 120 fatias; 6 pacotes fornecem 108 e 7 fornecem 126.
- FUVEST 31: raio 1 e distancia da corda ao centro 0,5 determinam setor de 120 graus. Volume vazio = 6*(pi/3 - sqrt(3)/4), positivo e menor que o volume total 6*pi. A fracao da altura nao e a fracao do volume.
- FUVEST 33: custos originais 140, 35, 39 e 12 reais; variacoes 9,80, -1,75, 0 e 1,20. A soma e 9,25.
- UNICAMP 59: dividir pelo produto dos fatores de aumento recupera o preco inicial.
- UNICAMP 61: as restricoes de algarismos deixam apenas o numero 27, cujo produto de algarismos e 14.

As explicacoes no JSON sao autorais. INEP e FUVEST confirmam as letras, nao a autoria dessas resolucoes. A Comvest fornece adicionalmente resolucoes oficiais compativeis.

## Adaptacao e limites

Todos os objetos usam `provenance: "adapted_reference"`, corpo rotulado e `adaptationNote`. Foram preservados dados matematicos, respostas e ordem das alternativas; foram reescritos os contextos e substituidos os elementos visuais por dados suficientes em texto. Em ENEM 147, a demanda e uma hipotese do exercicio, nao recomendacao nutricional. Em UNICAMP 61, a equacao explicita torna a modelagem mais facil que no original.

As quatro alternativas da UNICAMP foram mantidas, sem quinta alternativa artificial. Os dois itens pertencem a mesma primeira fase e ao mesmo conjunto Q/X. A questao 60 foi excluida: a [Comvest registra sua anulacao](https://www.comvest.unicamp.br/vestibulares-anteriores/ingresso-2019/vestibular-2019/respostas-esperadas-2019/). Nao se deve usar a resposta originalmente prevista como gabarito valido.

`difficulty`, `topicTags` e `skill` sao curadoria local para few-shot, nao classificacoes oficiais nem parametros TRI. A dificuldade descreve a adaptacao e nao foi calibrada com alunos. `sqrt` significa raiz quadrada e `pi` a constante circular.

Este recorte cobre somente tres edicoes dentro de 2016-2025. Nao cobre linguagens, segunda fase, distribuicao de assuntos ou evolucao historica. A busca inicial em 2025 nao constitui cobertura dessa edicao. A indisponibilidade intermitente da ferramenta web nao foi tratada como prova de inexistencia de documentos. Nao ha alegacao de revisao exaustiva das provas ou de todas as retificacoes historicas.

O pipeline deve preservar a proveniencia e a atribuicao, tratar os exemplos como adaptacoes e separar novas questoes geradas de referencias verificadas. A consulta publica nao e declaracao de dominio publico. Nao foram reproduzidos textos literarios, fotografias ou longos trechos das provas. A Comvest informa sua politica de reproducao parcial com atribuicao em [Provas Comentadas por Ano](https://www.comvest.unicamp.br/vestibulares-anteriores/1a-fase-2a-fase-comentadas/); este corpus usa adaptacoes mesmo assim.
