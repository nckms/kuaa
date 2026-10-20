import type { StudyGuide } from './guides'

export const foundationGuides: Record<string, StudyGuide> = {
  'História do Brasil República': {
    objective: 'Relacionar mudanças políticas da República aos grupos sociais e aos interesses em disputa.',
    explanation: [
      'Uma questão histórica raramente pede só uma data. Identifique o período, os agentes envolvidos e o que mudou ou permaneceu na organização do poder.',
      'A Primeira República teve forte influência das elites regionais. Em 1930, a ruptura política não eliminou todas as desigualdades e práticas anteriores.',
      'Leia a fonte apresentada pela questão: autor, época e finalidade ajudam a perceber se ela descreve, defende ou critica uma situação.',
    ],
    example: {
      prompt: 'Um texto de época critica a concentração do poder nas oligarquias estaduais. A qual problema político da Primeira República ele se refere?',
      steps: ['Localize a pista “oligarquias estaduais”.', 'Relacione-a ao controle regional das decisões e das eleições.', 'Formule a resposta sem atribuir ao texto uma crítica que ele não faz.'],
      answer: 'À concentração do poder político em grupos regionais, que limitava a participação de outros setores da população.',
    },
    commonMistake: 'Tratar a mudança de governo como solução automática de todos os problemas sociais. Compare continuidades e rupturas.',
    check: { question: 'Ao analisar uma fonte histórica, qual pergunta vem primeiro?', options: ['Quem a produziu e em que contexto?', 'Qual alternativa é a mais longa?', 'Qual fato aconteceu por último?'], correctIndex: 0, feedback: 'Autoria e contexto permitem interpretar a intenção e os limites da fonte.' },
  },
  'Gêneros Textuais Dissertativos': {
    objective: 'Adequar a escrita ao gênero, ao destinatário e à finalidade pedidos na proposta.',
    explanation: [
      'Antes de escrever, identifique quem fala, para quem, com qual objetivo e em qual gênero. Uma carta, um artigo e um manifesto podem defender ideias, mas não têm a mesma forma de interlocução.',
      'Escolha uma tese ou posição pertinente ao tema. Cada parágrafo deve fazer avançar essa posição com justificativa, exemplo ou consequência.',
      'Na revisão, confira se o tom e a estrutura combinam com a situação proposta. Argumentar bem não compensa ignorar o gênero solicitado.',
    ],
    example: {
      prompt: 'A proposta pede uma carta aberta aos moradores defendendo a preservação de uma praça. Como iniciar o planejamento?',
      steps: ['Defina o destinatário: moradores do bairro.', 'Formule a posição: preservar a praça é importante.', 'Escolha razões concretas, como uso coletivo e espaço de convivência.'],
      answer: 'Planeje uma carta que se dirija aos moradores e sustente a preservação com argumentos ligados ao uso da praça.',
    },
    commonMistake: 'Entregar uma dissertação genérica quando a proposta exige interlocução explícita com um destinatário.',
    check: { question: 'Se a proposta pede uma carta aberta, o que não pode faltar no planejamento?', options: ['Um destinatário e uma finalidade definidos', 'Uma lista de fórmulas matemáticas', 'A ausência de qualquer posição'], correctIndex: 0, feedback: 'A carta aberta tem interlocutores e objetivo comunicativo claros.' },
  },
  'Literatura Brasileira': {
    objective: 'Interpretar uma obra a partir da voz narrativa, da linguagem e do contexto, sem decorar apenas escolas literárias.',
    explanation: [
      'Observe quem fala no texto e de que ponto de vista. O narrador não é automaticamente o autor, e uma personagem pode ser apresentada de forma crítica ou irônica.',
      'Forma e conteúdo trabalham juntos: escolhas de ritmo, imagens, vocabulário e estrutura produzem efeitos de sentido.',
      'O contexto histórico ajuda, mas não substitui a leitura do trecho. Use características de um período literário como hipótese a confirmar no texto.',
    ],
    example: {
      prompt: 'Um narrador elogia uma personagem, mas descreve atitudes que contradizem o elogio. O que pode ocorrer?',
      steps: ['Compare a avaliação do narrador com os fatos narrados.', 'Perceba o contraste entre o elogio literal e o comportamento descrito.'],
      answer: 'Pode haver ironia: o texto sugere uma crítica além do sentido literal do elogio.',
    },
    commonMistake: 'Escolher uma alternativa só porque cita uma escola literária conhecida, sem verificar o efeito no trecho.',
    check: { question: 'Narrador e autor são sempre a mesma voz?', options: ['Sim, em toda obra', 'Não, o narrador é uma construção do texto', 'Só quando há diálogo'], correctIndex: 1, feedback: 'Mesmo em primeira pessoa, a voz que narra é construída na obra e não deve ser confundida automaticamente com o autor.' },
  },
  'Geometria Plana e Espacial': {
    objective: 'Escolher a medida correta para calcular comprimento, área ou volume e conferir a unidade.',
    explanation: [
      'Desenhe ou identifique a figura e anote as medidas dadas. Comprimento usa uma dimensão, área usa duas e volume usa três.',
      'Para retângulos, área é base vezes altura. Para prismas retos, volume é área da base vezes altura. Essas regras dependem da figura; não aplique uma fórmula sem reconhecê-la.',
      'Ao final, confira as unidades: metros, metros quadrados e metros cúbicos representam grandezas diferentes.',
    ],
    example: {
      prompt: 'Uma caixa retangular mede 2 m de comprimento, 1 m de largura e 3 m de altura. Qual é seu volume?',
      steps: ['Calcule a área da base: 2 × 1 = 2 m².', 'Multiplique pela altura: 2 × 3 = 6 m³.'],
      answer: '6 m³. A resposta é volume, não área, porque considera as três dimensões.',
    },
    commonMistake: 'Somar lados quando a pergunta pede área ou usar m² para uma medida de volume.',
    check: { question: 'Um retângulo de 4 m por 3 m tem área igual a:', options: ['7 m', '12 m²', '12 m³'], correctIndex: 1, feedback: 'Área do retângulo = 4 × 3 = 12 m².' },
  },
  'Razões, Porcentagens e Matemática Financeira': {
    objective: 'Interpretar uma porcentagem em relação à sua base antes de calcular aumento ou desconto.',
    explanation: [
      'Porcentagem significa uma parte em cada cem. Sempre identifique “porcentagem de quê?”: esse valor é a base do cálculo.',
      'Um aumento de p% equivale a multiplicar a base por 1 + p/100. Um desconto de p% equivale a multiplicar por 1 − p/100.',
      'Aumentos e descontos sucessivos usam bases diferentes. Por isso, 20% de aumento seguido de 20% de desconto não retorna ao preço inicial.',
    ],
    example: {
      prompt: 'Um produto custa R$ 100. Após aumento de 20% e desconto de 20%, quanto custa?',
      steps: ['Aumente 20% sobre R$ 100: R$ 120.', 'Calcule o desconto sobre a nova base: 20% de R$ 120 são R$ 24.', 'Subtraia: R$ 120 − R$ 24.'],
      answer: 'R$ 96. As taxas são iguais, mas as bases são diferentes.',
    },
    commonMistake: 'Somar percentuais de etapas diferentes sem considerar que a base mudou.',
    check: { question: 'Quanto é 10% de R$ 80?', options: ['R$ 8', 'R$ 10', 'R$ 72'], correctIndex: 0, feedback: '10/100 × 80 = 8.' },
  },
  'Citologia, Metabolismo e Histologia': {
    objective: 'Relacionar estruturas celulares às funções que desempenham no organismo.',
    explanation: [
      'A membrana plasmática delimita a célula e regula a troca de substâncias. O material genético participa do controle das atividades celulares.',
      'Mitocôndrias estão associadas à respiração celular; ribossomos participam da síntese de proteínas. Associe cada estrutura ao processo pedido, não a uma palavra decorada.',
      'Tecidos são conjuntos organizados de células. Para interpretar uma questão de histologia, observe a função e a organização das células descritas.',
    ],
    example: {
      prompt: 'Uma célula muscular demanda muita energia para sua atividade. Que organela se relaciona à produção de ATP na respiração celular?',
      steps: ['Identifique o processo central: obtenção de ATP pela respiração celular.', 'Relacione o processo à organela predominante em células eucarióticas.'],
      answer: 'Mitocôndria, onde ocorrem etapas importantes da respiração celular.',
    },
    commonMistake: 'Afirmar que uma organela “cria energia”. A célula transforma energia de moléculas em formas utilizáveis, como ATP.',
    check: { question: 'Qual estrutura participa diretamente da síntese de proteínas?', options: ['Ribossomo', 'Membrana plasmática', 'Vacúolo'], correctIndex: 0, feedback: 'Ribossomos montam proteínas a partir de aminoácidos conforme a informação do RNA mensageiro.' },
  },
  'Cartografia e Dinâmicas Naturais': {
    objective: 'Ler escala e legenda para interpretar distâncias e informações de um mapa.',
    explanation: [
      'A escala relaciona a distância no mapa à distância real. Em 1:100.000, uma unidade no mapa corresponde a 100.000 unidades iguais no terreno.',
      'Leia título, legenda, orientação e fonte antes de tirar conclusões. Cores e símbolos só têm significado seguro quando interpretados pela legenda.',
      'Para comparar fenômenos naturais em mapas, considere também o período e a área representada; mapas de escalas diferentes mostram níveis distintos de detalhe.',
    ],
    example: {
      prompt: 'Em um mapa na escala 1:100.000, dois pontos estão separados por 2 cm. Qual é a distância real?',
      steps: ['Multiplique 2 por 100.000: 200.000 cm.', 'Converta 200.000 cm em quilômetros.'],
      answer: '2 km, pois 100.000 cm correspondem a 1 km.',
    },
    commonMistake: 'Interpretar 1:100.000 como se fossem 100.000 quilômetros; a unidade dos dois lados da razão deve ser a mesma antes da conversão.',
    check: { question: 'Na escala 1:100.000, 1 cm no mapa representa:', options: ['1 km no terreno', '100.000 km no terreno', '1 m no terreno'], correctIndex: 0, feedback: '100.000 cm equivalem a 1 km.' },
  },
  'Ecologia e Sustentabilidade': {
    objective: 'Interpretar relações tróficas e fluxo de energia em uma cadeia alimentar.',
    explanation: [
      'Produtores transformam energia luminosa ou química em matéria orgânica. Consumidores obtêm matéria e energia ao se alimentar de outros seres.',
      'A seta de uma cadeia alimentar indica a transferência de matéria e energia do organismo consumido para quem o consome.',
      'A energia disponível tende a diminuir entre níveis tróficos porque parte é usada no metabolismo e dissipada. A matéria, por sua vez, participa de ciclos.',
    ],
    example: {
      prompt: 'Na cadeia capim → gafanhoto → sapo, o que a seta entre capim e gafanhoto indica?',
      steps: ['Identifique quem é consumido: o capim.', 'Identifique quem recebe matéria e energia pela alimentação: o gafanhoto.'],
      answer: 'Transferência de matéria e energia do capim para o gafanhoto.',
    },
    commonMistake: 'Ler a seta como “quem caça quem” em vez de acompanhar a transferência de matéria e energia.',
    check: { question: 'Em uma cadeia alimentar, qual grupo inicia a produção de matéria orgânica a partir de fontes não orgânicas?', options: ['Produtores', 'Consumidores secundários', 'Predadores de topo'], correctIndex: 0, feedback: 'Produtores formam a base de muitas cadeias alimentares.' },
  },
  'Leitura e Inferência em Inglês': {
    objective: 'Inferir o sentido global de um texto curto em inglês usando contexto e conectores.',
    explanation: [
      'Leia título, fonte e palavras repetidas antes de traduzir frase por frase. A questão costuma exigir propósito, ideia principal ou uma informação localizada.',
      'Conectores ajudam a perceber relações: however indica contraste; because introduz uma razão; therefore aponta uma conclusão.',
      'Palavras parecidas com o português podem ajudar, mas confirme o sentido pelo contexto. Não dependa de uma única palavra isolada.',
    ],
    example: {
      prompt: 'Trecho: “The plan was expensive. However, the community supported it.” Qual a relação entre as frases?',
      steps: ['Identifique a primeira ideia: o plano era caro.', 'Observe however, que introduz uma ideia contrastante.'],
      answer: 'Apesar do custo, a comunidade apoiou o plano.',
    },
    commonMistake: 'Ler however como uma continuação sem contraste e perder a posição expressa no texto.',
    check: { question: 'Na frase “It rained; therefore, the event moved indoors”, therefore indica:', options: ['Conclusão', 'Contraste', 'Exemplo'], correctIndex: 0, feedback: 'Therefore liga a chuva à consequência de transferir o evento para um espaço fechado.' },
  },
  'Tese, Argumentação e Autoria': {
    objective: 'Desenvolver um argumento que sustente a tese com explicação, não apenas com afirmações.',
    explanation: [
      'A tese apresenta a posição central. Cada parágrafo argumentativo deve defender uma parte dessa posição.',
      'Uma estrutura útil é: afirmação do argumento, explicação do mecanismo, exemplo pertinente e ligação explícita com a tese.',
      'Autoria aparece nas escolhas de recorte e nas relações construídas entre ideias. Copiar uma frase conhecida sem explicá-la não substitui argumentação.',
    ],
    example: {
      prompt: 'Tese: a falta de bibliotecas dificulta o acesso à leitura. Como desenvolver um argumento?',
      steps: ['Afirme a razão: a distância reduz o contato frequente com livros.', 'Explique o mecanismo: deslocamentos caros ou longos dificultam visitas regulares.', 'Conecte ao efeito: a leitura deixa de integrar a rotina de parte da população.'],
      answer: 'Um argumento completo explica como a distância afeta o hábito de leitura, em vez de apenas repetir que faltam bibliotecas.',
    },
    commonMistake: 'Acumular exemplos sem explicar a relação deles com a tese.',
    check: { question: 'Qual frase desenvolve melhor um argumento?', options: ['Bibliotecas são importantes.', 'Quando o acesso exige deslocamento longo, visitas frequentes ficam mais difíceis, reduzindo as oportunidades de leitura.', 'Todo mundo deveria ler mais.'], correctIndex: 1, feedback: 'A segunda frase explica o mecanismo que liga distância e acesso à leitura.' },
  },
  'Reações, Estequiometria e Soluções': {
    objective: 'Usar proporções de uma equação balanceada para relacionar quantidades de reagentes e produtos.',
    explanation: [
      'Uma equação química balanceada conserva o número de átomos de cada elemento. Seus coeficientes indicam proporções entre quantidades de matéria.',
      'Antes de calcular, confira a unidade do enunciado. Massa não é número de mols; para converter, use a massa molar quando ela for fornecida ou conhecida.',
      'Em soluções, concentração comum relaciona massa de soluto ao volume da solução. Não confunda o volume de solvente com o volume final da solução.',
    ],
    example: {
      prompt: 'Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de água se formam a partir de 2 mols de H₂, com oxigênio suficiente?',
      steps: ['Leia a proporção dos coeficientes: 2 mols de H₂ produzem 2 mols de H₂O.', 'Aplique a proporção ao valor informado.'],
      answer: '2 mols de H₂O, considerando reação completa e oxigênio em quantidade suficiente.',
    },
    commonMistake: 'Usar índices das fórmulas como se fossem coeficientes da equação. O índice descreve a composição da substância; o coeficiente indica a proporção da reação.',
    check: { question: 'Na equação 2 H₂ + O₂ → 2 H₂O, a proporção H₂:O₂ em mols é:', options: ['2:1', '1:2', '1:1'], correctIndex: 0, feedback: 'Os coeficientes mostram 2 mols de H₂ para 1 mol de O₂.' },
  },
}
