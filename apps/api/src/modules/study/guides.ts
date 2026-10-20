import { foundationGuides } from './foundationGuides'
import { scienceMathGuides } from './scienceMathGuides'
import { humanitiesGuides } from './humanitiesGuides'
import { languagesGuides } from './languagesGuides'
import { vestibularGuides } from './vestibularGuides'

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
      'Interpretar não é adivinhar o que o autor pensou. É construir uma resposta que possa ser defendida com marcas do próprio texto: palavras, relações entre frases e informações do contexto apresentado.',
      'Comece pelo comando. Localizar pede uma informação explícita; inferir pede uma conclusão apoiada em pistas; analisar efeito de linguagem pede explicar o que uma escolha de palavra ou estrutura produz naquele trecho.',
      'Na primeira leitura, identifique quem fala, sobre o quê e com qual intenção provável. Na segunda, observe conectivos e contrastes: “embora” introduz uma expectativa contrariada; “portanto” anuncia uma conclusão.',
      'Separe fato e inferência. Se o texto diz que uma biblioteca fecha cedo, você pode concluir que o horário limita certas visitas; não pode afirmar, sem outra pista, que ela nunca recebe leitores.',
      'Antes das alternativas, responda em uma frase sua. Então compare cada opção com o trecho: descarte a que contradiz uma informação, exagera uma possibilidade ou troca a causa pela consequência.',
      'Em textos literários ou publicitários, repare também no efeito da forma: ironia, repetição e escolha de imagens podem mudar o sentido de uma frase aparentemente literal.',
    ],
    example: {
      prompt: 'Trecho: “Embora a biblioteca fechasse cedo, Ana voltou no dia seguinte.” O que a palavra “embora” indica?',
      steps: ['Leia o comando e procure a relação pedida, não uma opinião sobre bibliotecas.', 'Separe os fatos: a biblioteca fechava cedo e Ana voltou no dia seguinte.', 'Pense na expectativa: o fechamento cedo poderia desanimar uma nova visita.', 'Confira o conectivo: “embora” mostra que a ação ocorreu apesar dessa dificuldade.', 'Formule a relação em suas palavras antes de escolher uma alternativa.'],
      answer: 'Uma relação de concessão: Ana voltou apesar do horário limitado.',
    },
    commonMistake: 'Escolher uma alternativa plausível sobre o tema, mas sem apoio no trecho. Volte à frase que sustenta sua resposta.',
    check: { question: 'Em “Mesmo cansada, Lia terminou a leitura”, a primeira expressão indica:', options: ['Causa da leitura', 'Contraste com a ação realizada', 'Conclusão inevitável'], correctIndex: 1, feedback: '“Mesmo cansada” cria a expectativa de interromper a leitura; “terminou” contraria essa expectativa. O cansaço não é a causa de ler nem torna o fim inevitável.' },
  },
  'Funções e Gráficos': {
    objective: 'Relacionar taxa de variação, valor inicial e representação gráfica de uma função afim.',
    explanation: [
      'Uma função associa cada valor de entrada x a um valor de saída f(x). Em uma função afim, f(x) = ax + b, a mudança da saída é constante para cada unidade acrescentada à entrada.',
      'O termo b é o valor inicial: substitua x por zero e obtenha f(0) = b. O coeficiente a é a taxa de variação, isto é, quanto a saída muda quando x aumenta uma unidade.',
      'Para descobrir a taxa a partir de dois pontos, calcule a diferença das saídas e divida pela diferença das entradas: a = (y₂ - y₁)/(x₂ - x₁), desde que as entradas sejam diferentes.',
      'No gráfico, confira o nome e a unidade dos eixos antes de calcular. Uma reta crescente tem a positivo; uma decrescente tem a negativo. A inclinação informa a taxa, não o valor inicial.',
      'Se a situação envolve tarifa fixa mais valor por quilômetro, o preço fixo é b e o custo de cada quilômetro é a. Verifique sua regra com um valor conhecido antes de extrapolar.',
      'Uma reta pode estar acima de outra e crescer mais devagar. Compare as taxas para saber qual cresce mais rápido; compare f(x) para saber qual é maior em um x específico.',
    ],
    example: {
      prompt: 'Uma tarifa custa R$ 5 fixos mais R$ 2 por quilômetro. Quanto custa uma viagem de 4 km?',
      steps: ['Defina x como a distância em quilômetros e C(x) como o custo em reais.', 'Identifique o valor fixo de R$ 5: ele é pago mesmo quando x = 0.', 'Identifique a taxa de R$ 2 por quilômetro: cada unidade a mais de x soma 2 ao custo.', 'Monte C(x) = 2x + 5 e substitua x = 4.', 'Calcule 2 × 4 + 5 = 13 e confira se a unidade final é reais.'],
      answer: 'R$ 13. O gráfico começa em 5 no eixo do custo e sobe 2 reais por quilômetro.',
    },
    commonMistake: 'Trocar o valor fixo pela taxa. Pergunte: “Quanto custa quando x vale zero?” para encontrar b.',
    check: { question: 'Uma função passa por (0, 3) e (2, 7). Qual é sua taxa de variação?', options: ['2', '3', '4'], correctIndex: 0, feedback: 'A saída aumenta 4 quando a entrada aumenta 2; por unidade, a taxa é 4 ÷ 2 = 2. O número 3 é o valor inicial, e 4 é apenas a variação total da saída.' },
  },
  'Probabilidade e Estatística': {
    objective: 'Distinguir probabilidade, média e interpretação de dados em tabelas.',
    explanation: [
      'Estatística descreve e compara dados; probabilidade modela a chance de um evento. Antes de calcular, identifique se a pergunta pede uma quantidade, uma proporção ou uma medida resumida.',
      'Quando os resultados são igualmente prováveis, P(evento) = casos favoráveis ÷ casos possíveis. Liste primeiro o universo inteiro: o denominador não é apenas o número de resultados desfavoráveis.',
      'A média aritmética soma todos os valores e divide pela quantidade observada. Se os valores são 2, 4 e 9, a média é 15 ÷ 3 = 5, mesmo que 5 não apareça na lista.',
      'A mediana é o valor central dos dados ordenados; ela pode ser mais informativa que a média quando um valor extremo puxa a média para cima ou para baixo.',
      'Em tabelas e gráficos, leia título, eixos, unidade, período e tamanho da amostra. Uma porcentagem sem dizer “de quantos” pode ocultar diferenças grandes em números absolutos.',
      'Confira se os casos são equiprováveis. Não aplique a contagem simples de fichas a uma situação em que alguns resultados têm chances diferentes.',
    ],
    example: {
      prompt: 'Em uma caixa há 3 fichas azuis e 2 verdes. Qual é a chance de retirar uma ficha verde?',
      steps: ['Defina o evento: sair uma ficha verde em uma retirada.', 'Conte todos os resultados possíveis: 3 azuis + 2 verdes = 5 fichas.', 'Conte os resultados favoráveis: as 2 fichas verdes.', 'Como cada ficha tem a mesma chance, divida 2 por 5.', 'Converta a fração: 2 ÷ 5 = 0,4 = 40%, e confira que a chance fica entre 0% e 100%.'],
      answer: '2/5, ou 40%, supondo que cada ficha tenha a mesma chance de ser retirada.',
    },
    commonMistake: 'Usar apenas o número de fichas da outra cor no denominador. O denominador representa todos os resultados possíveis.',
    check: { question: 'Dados 2, 4 e 9, qual é a média?', options: ['4', '5', '9'], correctIndex: 1, feedback: 'Some os três valores: 2 + 4 + 9 = 15; divida pela quantidade de observações, 3. O resultado é 5. Quatro é a mediana, pois fica no centro da lista ordenada.' },
  },
  'Cinemática e Dinâmica': {
    objective: 'Calcular velocidade média e diferenciar movimento de força resultante.',
    explanation: [
      'A cinemática descreve como um corpo se move; a dinâmica investiga por que sua velocidade muda. Separar essas perguntas evita confundir movimento com força.',
      'Velocidade média é deslocamento dividido pelo intervalo de tempo. Em uma trajetória de ida e volta, deslocamento pode ser zero mesmo que a distância percorrida não seja; observe qual grandeza o problema pede.',
      'Aceleração mede a mudança da velocidade por unidade de tempo. Mudar a rapidez ou a direção já significa acelerar, mesmo que o velocímetro mantenha o mesmo número durante uma curva.',
      'Pela segunda lei de Newton, força resultante = massa × aceleração. A resultante é a soma vetorial das forças, não apenas uma força isolada.',
      'Se um veículo anda em linha reta com velocidade constante, sua aceleração é zero e a resultante das forças também é zero. Isso não significa ausência de forças: elas podem se equilibrar.',
      'Antes de usar uma fórmula, desenhe as forças e padronize unidades. Para obter velocidade em m/s, use deslocamento em metros e tempo em segundos.',
    ],
    example: {
      prompt: 'Um ônibus segue em linha reta de A até B, com deslocamento de 120 km em 2 horas. Qual é sua velocidade média?',
      steps: ['Identifique a grandeza solicitada: velocidade média no percurso.', 'Registre a distância informada, 120 km, e o tempo, 2 h.', 'Como as unidades já combinam, divida 120 km por 2 h.', 'Obtenha 60 km/h e interprete: a cada hora, a média corresponde a 60 km.', 'Não conclua que o ônibus manteve 60 km/h em todos os instantes; paradas e variações podem ter ocorrido.'],
      answer: '60 km/h. Isso não informa a velocidade em cada instante da viagem.',
    },
    commonMistake: 'Concluir que um objeto em movimento precisa de força resultante na direção do movimento. Força resultante está ligada à aceleração.',
    check: { question: 'Um veículo mantém velocidade constante em linha reta. Sua aceleração é:', options: ['Zero', 'Igual à velocidade', 'Sempre positiva'], correctIndex: 0, feedback: 'A velocidade não muda nem em valor nem em direção, então sua variação por tempo é zero. Velocidade e aceleração são grandezas diferentes; mover-se não exige aceleração.' },
  },
  'Genética, Evolução e Biotecnologia': {
    objective: 'Distinguir gene, alelo e características observáveis sem confundir herança com destino.',
    explanation: [
      'O DNA contém informação usada pelas células. Um gene é uma região do DNA associada à produção de um produto funcional; alelos são variantes de um mesmo gene.',
      'Em organismos diploides, há geralmente duas cópias de cada gene autossômico, uma herdada de cada progenitor. O genótipo descreve essas variantes; o fenótipo descreve características observáveis.',
      'Nem toda característica segue uma regra simples de dominante e recessivo. Muitas dependem de vários genes e do ambiente; os cruzamentos de uma característica são modelos didáticos com hipóteses específicas.',
      'Na formação de gametas, os dois alelos de um gene se separam no modelo mendeliano. Um indivíduo Aa pode produzir gametas com A ou com a; um descendente recebe um de cada progenitor.',
      'Monte uma tabela de combinações para contar possibilidades e só então calcule a proporção. Em Aa × Aa, AA, Aa, aA e aa têm a mesma chance no modelo simples.',
      'Uma probabilidade de 25% não significa que exatamente um em cada quatro filhos terá o genótipo aa. Ela descreve a chance em cada evento sob as hipóteses adotadas.',
    ],
    example: {
      prompt: 'Dois indivíduos Aa produzem gametas A e a. Qual a chance de um descendente aa?',
      steps: ['Identifique o genótipo de cada progenitor: ambos são Aa.', 'Liste os gametas possíveis de cada um: A e a.', 'Combine cada gameta de um progenitor com cada gameta do outro.', 'Obtenha AA, Aa, aA e aa, quatro combinações equiprováveis no modelo.', 'Conte apenas aa: uma combinação em quatro, ou 25%.'],
      answer: '1/4, ou 25%, no modelo simples de segregação desses alelos.',
    },
    commonMistake: 'Tratar uma chance de 25% como “um a cada quatro filhos obrigatoriamente”. Cada nascimento é um evento com possibilidades próprias.',
    check: { question: 'Duas versões de um mesmo gene são chamadas de:', options: ['Alelos', 'Cromossomos', 'Fenótipos'], correctIndex: 0, feedback: 'Alelos são variantes da mesma região gênica. Cromossomos são estruturas que carregam muitos genes, enquanto fenótipo é a característica observada.' },
  },
  'Tema, Repertório e Projeto de Texto': {
    objective: 'Construir uma tese pertinente e planejar argumentos antes de escrever a redação.',
    explanation: [
      'O tema é o assunto delimitado pela proposta; o problema é a pergunta que seu texto precisa enfrentar. Copiar palavras do enunciado sem tomar posição ainda não constitui uma tese.',
      'Antes de escrever, anote o recorte: quem é afetado, em que contexto e qual conflito está em jogo. Isso impede que um texto sobre acesso à leitura vire uma discussão vaga sobre a importância dos livros.',
      'A tese é uma resposta defensável ao problema. Ela pode apontar causas, consequências ou uma tensão, desde que os parágrafos seguintes consigam demonstrá-la.',
      'Planeje dois argumentos distintos. Para cada um, escreva a ideia central, uma evidência pertinente e a frase que explica como essa evidência sustenta sua tese.',
      'Repertório não é enfeite. Uma obra, conceito ou dado precisa ser apresentado com precisão e ligado explicitamente à situação discutida; referências inventadas ou soltas enfraquecem o texto.',
      'Revise o plano perguntando: cada parágrafo acrescenta uma razão nova? A conclusão responde ao problema e decorre do que foi argumentado? Se não, ajuste a tese antes da versão final.',
    ],
    example: {
      prompt: 'Tema hipotético: obstáculos ao acesso à leitura em comunidades rurais. Como planejar uma tese?',
      steps: ['Reescreva o tema como pergunta: o que dificulta o acesso continuado à leitura nas comunidades rurais?', 'Delimite o contexto: acesso regular a livros e espaços de leitura, não o valor abstrato da leitura.', 'Liste causas que você consegue explicar: distância de equipamentos culturais e oferta insuficiente de acervos.', 'Transforme essas causas em uma posição clara que responda à pergunta.', 'Planeje um parágrafo para mostrar o efeito da distância e outro para explicar como a oferta de acervos interfere na frequência de leitura.'],
      answer: 'Exemplo de tese: a distância dos espaços culturais e a oferta restrita de acervos dificultam o acesso continuado à leitura nessas comunidades.',
    },
    commonMistake: 'Usar frases genéricas como “a sociedade precisa melhorar” sem indicar o problema e as causas que serão defendidas.',
    check: { question: 'Qual frase funciona melhor como tese para esse tema?', options: ['Ler é muito importante para todas as pessoas.', 'A distância dos espaços de leitura e a falta de acervos limitam o acesso nas áreas rurais.', 'Existem muitos livros diferentes no Brasil.'], correctIndex: 1, feedback: 'A segunda frase responde ao problema e antecipa dois argumentos explicáveis. As outras apenas fazem uma avaliação genérica ou constatam algo sem defender uma posição.' },
  },
  ...foundationGuides,
  ...scienceMathGuides,
  ...humanitiesGuides,
  ...languagesGuides,
  ...vestibularGuides,
}

const aliases: Record<string, string> = {
  'Interpretação e Análise de Texto': 'Interpretação de Texto',
  'Leitura e Interpretação': 'Interpretação de Texto',
  'Álgebra e Funções': 'Funções e Gráficos',
}

export function getStudyGuide(topicName: string): StudyGuide | null {
  return guides[aliases[topicName] ?? topicName] ?? null
}
