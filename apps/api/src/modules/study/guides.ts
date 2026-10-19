export interface StudyGuide {
  objective: string
  explanation: string[]
  example: { prompt: string; steps: string[]; answer: string }
  commonMistake: string
  check: { question: string; options: string[]; correctIndex: number; feedback: string }
}

const guides: Record<string, StudyGuide> = {
  'Interpretação de Texto': {
    objective: 'Identificar a ideia central e justificar uma inferência com pistas do texto.',
    explanation: [
      'Leia primeiro o comando da questão: ele diz se você deve localizar uma informação, inferir uma ideia ou reconhecer um efeito de linguagem.',
      'Separe o que o texto afirma do que você conclui. Uma inferência precisa ser sustentada por uma palavra, relação ou contraste presente no trecho.',
      'Antes de olhar as alternativas, formule uma resposta curta. Depois elimine as opções que exageram, contradizem ou acrescentam algo que o texto não permite concluir.',
    ],
    example: {
      prompt: 'Trecho: “Embora a biblioteca fechasse cedo, Ana voltou no dia seguinte.” O que a palavra “embora” indica?',
      steps: ['Identifique os dois fatos: a biblioteca fechava cedo; Ana voltou.', 'Observe que “embora” apresenta um obstáculo que não impediu a ação seguinte.'],
      answer: 'Uma relação de concessão: Ana voltou apesar do horário limitado.',
    },
    commonMistake: 'Escolher uma alternativa plausível sobre o tema, mas sem apoio no trecho. Volte à frase que sustenta sua resposta.',
    check: { question: 'Em “Mesmo cansada, Lia terminou a leitura”, a primeira expressão indica:', options: ['Causa da leitura', 'Contraste com a ação realizada', 'Conclusão inevitável'], correctIndex: 1, feedback: '“Mesmo cansada” apresenta uma condição contrária à expectativa de terminar, mas a ação ocorreu.' },
  },
  'Funções e Gráficos': {
    objective: 'Relacionar taxa de variação, valor inicial e representação gráfica de uma função afim.',
    explanation: [
      'Na função afim f(x) = ax + b, b é o valor quando x = 0. O coeficiente a indica quanto o resultado muda quando x aumenta uma unidade.',
      'Em um gráfico, leia primeiro os eixos e as unidades. Dois pontos permitem calcular a taxa: variação em y dividida pela variação em x.',
      'Uma taxa positiva indica crescimento; negativa, decrescimento. Não confunda a altura do gráfico com a rapidez da mudança.',
    ],
    example: {
      prompt: 'Uma tarifa custa R$ 5 fixos mais R$ 2 por quilômetro. Quanto custa uma viagem de 4 km?',
      steps: ['Escreva a regra: C(x) = 2x + 5.', 'Substitua x por 4: C(4) = 2 × 4 + 5.'],
      answer: 'R$ 13. O gráfico começa em 5 no eixo do custo e sobe 2 reais por quilômetro.',
    },
    commonMistake: 'Trocar o valor fixo pela taxa. Pergunte: “Quanto custa quando x vale zero?” para encontrar b.',
    check: { question: 'Uma função passa por (0, 3) e (2, 7). Qual é sua taxa de variação?', options: ['2', '3', '4'], correctIndex: 0, feedback: 'A variação vertical é 7 − 3 = 4; a horizontal é 2 − 0 = 2. A taxa é 4 ÷ 2 = 2.' },
  },
  'Probabilidade e Estatística': {
    objective: 'Distinguir probabilidade, média e interpretação de dados em tabelas.',
    explanation: [
      'Para resultados igualmente prováveis, probabilidade é o número de casos favoráveis dividido pelo total de casos possíveis.',
      'A média aritmética é a soma dos valores dividida pela quantidade de valores. Ela pode ser afetada por um valor muito alto ou muito baixo.',
      'Antes de calcular, verifique o universo considerado, as unidades e se a pergunta pede contagem, proporção ou medida de tendência central.',
    ],
    example: {
      prompt: 'Em uma caixa há 3 fichas azuis e 2 verdes. Qual é a chance de retirar uma ficha verde?',
      steps: ['Conte os casos favoráveis: 2 fichas verdes.', 'Conte o total: 3 + 2 = 5 fichas.', 'Divida 2 por 5.'],
      answer: '2/5, ou 40%, supondo que cada ficha tenha a mesma chance de ser retirada.',
    },
    commonMistake: 'Usar apenas o número de fichas da outra cor no denominador. O denominador representa todos os resultados possíveis.',
    check: { question: 'Dados 2, 4 e 9, qual é a média?', options: ['4', '5', '9'], correctIndex: 1, feedback: 'Some 2 + 4 + 9 = 15 e divida por 3: média 5.' },
  },
  'Cinemática e Dinâmica': {
    objective: 'Calcular velocidade média e diferenciar movimento de força resultante.',
    explanation: [
      'Velocidade média é a variação da posição dividida pelo intervalo de tempo. Confira se distância e tempo estão em unidades compatíveis.',
      'Aceleração descreve mudança de velocidade. Um corpo pode estar em movimento e ainda ter força resultante nula quando sua velocidade é constante.',
      'No modelo de Newton, a força resultante é massa vezes aceleração. Faça primeiro um esquema das forças e só depois escolha a equação.',
    ],
    example: {
      prompt: 'Um ônibus percorre 120 km em 2 horas. Qual é sua velocidade média?',
      steps: ['Identifique distância e tempo: 120 km e 2 h.', 'Calcule 120 ÷ 2.'],
      answer: '60 km/h. Isso não informa a velocidade em cada instante da viagem.',
    },
    commonMistake: 'Concluir que um objeto em movimento precisa de força resultante na direção do movimento. Força resultante está ligada à aceleração.',
    check: { question: 'Um veículo mantém velocidade constante em linha reta. Sua aceleração é:', options: ['Zero', 'Igual à velocidade', 'Sempre positiva'], correctIndex: 0, feedback: 'Sem mudança de módulo ou direção da velocidade, a aceleração é zero.' },
  },
  'Genética, Evolução e Biotecnologia': {
    objective: 'Distinguir gene, alelo e características observáveis sem confundir herança com destino.',
    explanation: [
      'Genes são segmentos de DNA associados à produção de moléculas e a características; alelos são versões de um gene.',
      'O genótipo reúne variantes herdadas. O fenótipo é o que se observa e pode depender também do ambiente.',
      'Em cruzamentos simples, use um quadro de combinações para contar possibilidades. Probabilidade não garante o resultado de um indivíduo.',
    ],
    example: {
      prompt: 'Dois indivíduos Aa produzem gametas A e a. Qual a chance de um descendente aa?',
      steps: ['Liste as combinações: AA, Aa, aA e aa.', 'Apenas uma das quatro combinações é aa.'],
      answer: '1/4, ou 25%, no modelo simples de segregação desses alelos.',
    },
    commonMistake: 'Tratar uma chance de 25% como “um a cada quatro filhos obrigatoriamente”. Cada nascimento é um evento com possibilidades próprias.',
    check: { question: 'Duas versões de um mesmo gene são chamadas de:', options: ['Alelos', 'Cromossomos', 'Fenótipos'], correctIndex: 0, feedback: 'Alelos são variantes de um gene; cromossomos carregam muitos genes.' },
  },
  'Tema, Repertório e Projeto de Texto': {
    objective: 'Construir uma tese pertinente e planejar argumentos antes de escrever a redação.',
    explanation: [
      'Leia a proposta e delimite tema, problema e recorte. Uma redação pertinente responde ao problema apresentado, não apenas repete palavras do enunciado.',
      'A tese é a posição que o texto defenderá. Escolha dois argumentos diferentes que possam ser desenvolvidos com exemplos e relações de causa ou consequência.',
      'Repertório só ajuda quando é explicado e conectado à tese. Citar uma obra ou dado sem mostrar sua relação com o problema não sustenta o argumento.',
    ],
    example: {
      prompt: 'Tema hipotético: obstáculos ao acesso à leitura em comunidades rurais. Como planejar uma tese?',
      steps: ['Delimite o problema: acesso regular a livros e espaços de leitura.', 'Separe duas causas discutíveis: distância de equipamentos culturais e oferta insuficiente de acervos.', 'Formule uma posição que conecte as causas ao problema.'],
      answer: 'Exemplo de tese: a distância dos espaços culturais e a oferta restrita de acervos dificultam o acesso continuado à leitura nessas comunidades.',
    },
    commonMistake: 'Usar frases genéricas como “a sociedade precisa melhorar” sem indicar o problema e as causas que serão defendidas.',
    check: { question: 'Qual frase funciona melhor como tese para esse tema?', options: ['Ler é muito importante para todas as pessoas.', 'A distância dos espaços de leitura e a falta de acervos limitam o acesso nas áreas rurais.', 'Existem muitos livros diferentes no Brasil.'], correctIndex: 1, feedback: 'A segunda opção delimita o problema e apresenta dois eixos que podem ser desenvolvidos.' },
  },
}

export function getStudyGuide(topicName: string): StudyGuide | null {
  return guides[topicName] ?? null
}
