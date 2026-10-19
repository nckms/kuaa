import type { CuratedQuestion } from '../modules/quiz/curatedQuestions'

export const visualQuestions: CuratedQuestion[] = [
  {
    id: 'enem-geometria-extra-01', topicTags: ['Geometria Plana e Espacial'], difficulty: 2,
    body: 'Uma caixa-d’água retangular tem medidas internas de 2 m de comprimento, 1,5 m de largura e 1 m de altura. Quantos litros ela armazena quando completamente cheia?',
    options: [{ id: 'A', text: '3 litros', isCorrect: false }, { id: 'B', text: '30 litros', isCorrect: false },
      { id: 'C', text: '300 litros', isCorrect: false }, { id: 'D', text: '3.000 litros', isCorrect: true }, { id: 'E', text: '4.500 litros', isCorrect: false }],
    explanation: 'O volume do paralelepípedo é comprimento × largura × altura: 2 × 1,5 × 1 = 3 m³. Como cada metro cúbico equivale a 1.000 litros, a capacidade é de 3.000 litros.',
  },
  {
    id: 'enem-progressoes-extra-01', topicTags: ['Progressões e Sequências'], difficulty: 2,
    body: 'Uma estudante guarda R$ 20 na primeira semana e aumenta o depósito em R$ 5 a cada semana seguinte. Qual será o total guardado ao fim de seis semanas?',
    options: [{ id: 'A', text: 'R$ 45', isCorrect: false }, { id: 'B', text: 'R$ 120', isCorrect: false },
      { id: 'C', text: 'R$ 150', isCorrect: false }, { id: 'D', text: 'R$ 180', isCorrect: false }, { id: 'E', text: 'R$ 195', isCorrect: true }],
    explanation: 'Os depósitos formam a PA 20, 25, 30, 35, 40, 45. A soma é (20 + 45) × 6/2 = 195 reais. O sexto depósito, 45 reais, não é o total acumulado.',
  },
  {
    id: 'visual-mru-01', topicTags: ['Cinemática e Dinâmica', 'Cinemática', 'Movimento e Forças', 'Mecânica, Trabalho e Energia'], difficulty: 2,
    body: 'O gráfico mostra a posição de uma bicicleta em movimento retilíneo uniforme. Qual é sua velocidade entre 1 s e 4 s?',
    visual: { type: 'line', title: 'Posição da bicicleta ao longo do tempo', xLabel: 'Tempo (s)', yLabel: 'Posição (m)',
      points: [{ label: '0', value: 0 }, { label: '1', value: 3 }, { label: '2', value: 6 }, { label: '3', value: 9 }, { label: '4', value: 12 }] },
    options: [
      { id: 'A', text: '3 m/s', isCorrect: true }, { id: 'B', text: '4 m/s', isCorrect: false },
      { id: 'C', text: '9 m/s', isCorrect: false }, { id: 'D', text: '12 m/s', isCorrect: false },
      { id: 'E', text: '0,25 m/s', isCorrect: false },
    ], explanation: 'No movimento uniforme, a velocidade é a variação da posição dividida pelo intervalo de tempo: (12 − 3)/(4 − 1) = 9/3 = 3 m/s. O gráfico é uma reta de inclinação constante.',
  },
  {
    id: 'visual-funcao-01', topicTags: ['Funções e Gráficos', 'Álgebra e Funções', 'Conjuntos e Funções'], difficulty: 2,
    body: 'Uma cooperativa cobra uma taxa fixa e um valor por quilômetro para transportar uma encomenda. O gráfico representa o custo total. Qual expressão relaciona o custo C, em reais, à distância d, em quilômetros?',
    visual: { type: 'line', title: 'Custo do transporte', xLabel: 'Distância (km)', yLabel: 'Custo (R$)',
      points: [{ label: '0', value: 10 }, { label: '1', value: 12 }, { label: '2', value: 14 }, { label: '3', value: 16 }, { label: '4', value: 18 }] },
    options: [
      { id: 'A', text: 'C = 10d + 2', isCorrect: false }, { id: 'B', text: 'C = 2d', isCorrect: false },
      { id: 'C', text: 'C = 2d + 10', isCorrect: true }, { id: 'D', text: 'C = d + 10', isCorrect: false },
      { id: 'E', text: 'C = 12d', isCorrect: false },
    ], explanation: 'Em d = 0, o custo é R$ 10: essa é a taxa fixa. Cada aumento de 1 km acrescenta R$ 2. Portanto, o coeficiente angular é 2 e a função afim é C = 2d + 10.',
  },
  {
    id: 'visual-estatistica-01', topicTags: ['Probabilidade e Estatística', 'Estatística', 'Interpretação de Gráficos e Tabelas'], difficulty: 2,
    body: 'O gráfico registra o número de livros emprestados por uma biblioteca durante quatro semanas. Qual foi a média semanal de empréstimos nesse período?',
    visual: { type: 'bar', title: 'Empréstimos da biblioteca', xLabel: 'Semana', yLabel: 'Livros emprestados',
      points: [{ label: '1', value: 20 }, { label: '2', value: 30 }, { label: '3', value: 40 }, { label: '4', value: 30 }] },
    options: [
      { id: 'A', text: '20 livros', isCorrect: false }, { id: 'B', text: '25 livros', isCorrect: false },
      { id: 'C', text: '30 livros', isCorrect: true }, { id: 'D', text: '40 livros', isCorrect: false },
      { id: 'E', text: '120 livros', isCorrect: false },
    ], explanation: 'Somam-se os empréstimos: 20 + 30 + 40 + 30 = 120. A média de quatro semanas é 120/4 = 30 livros. O total do período não é a média semanal.',
  },
  {
    id: 'visual-ecologia-01', topicTags: ['Ecologia', 'Ecologia e Meio Ambiente'], difficulty: 2,
    body: 'Na cadeia alimentar representada, as setas indicam a transferência de matéria e energia do alimento para quem o consome. Qual organismo ocupa o nível de consumidor secundário?',
    imageUrl: '/question-media/cadeia-alimentar.svg',
    imageAlt: 'Cadeia alimentar: capim → gafanhoto → sapo → cobra. As setas apontam do alimento para o consumidor.',
    imageCaption: 'Esquema autoral de uma cadeia alimentar.',
    options: [
      { id: 'A', text: 'Capim', isCorrect: false }, { id: 'B', text: 'Gafanhoto', isCorrect: false },
      { id: 'C', text: 'Sapo', isCorrect: true }, { id: 'D', text: 'Cobra', isCorrect: false },
      { id: 'E', text: 'Todos os organismos', isCorrect: false },
    ], explanation: 'O capim é produtor; o gafanhoto que o consome é consumidor primário. O sapo alimenta-se do gafanhoto e, por isso, é consumidor secundário. A cobra é o consumidor terciário dessa cadeia.',
  },
]
