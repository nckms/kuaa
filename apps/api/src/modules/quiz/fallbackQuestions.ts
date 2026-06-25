import type { GeneratedQuestion, QuestionOption } from './quiz.types'

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E'] as const

interface TopicProfile {
  match: string[]
  focus: string
  correctIdeas: string[]
  distractors: string[]
  explanation: string
  contexts: string[]
}

const PROFILES: TopicProfile[] = [
  {
    match: ['interpretacao', 'leitura', 'analise de texto'],
    focus: 'interpretacao textual',
    correctIdeas: [
      'A resposta deve ser sustentada por pistas do texto, sem extrapolar informacoes.',
      'A tese central organiza os argumentos e deve ser identificada pelo conjunto do texto.',
      'Inferir significa concluir algo provavel a partir de marcas presentes no enunciado.',
    ],
    distractors: [
      'Escolher uma informacao isolada e trata-la como ideia principal.',
      'Ignorar conectivos que indicam oposicao, causa ou conclusao.',
      'Usar opiniao pessoal em vez de evidencias textuais.',
      'Confundir exemplo do texto com argumento principal.',
    ],
    explanation: 'Em interpretacao, a alternativa correta precisa nascer do texto. O leitor deve localizar a tese, observar conectivos e distinguir fato, opiniao, exemplo e conclusao.',
    contexts: ['uma cronica sobre tecnologia', 'um artigo de opiniao sobre educacao', 'uma campanha publica', 'uma reportagem sobre desigualdade'],
  },
  {
    match: ['redacao', 'dissertativa', 'producao textual', 'coesao', 'coerencia', 'intervencao', 'argumentacao'],
    focus: 'redacao dissertativa',
    correctIdeas: [
      'A tese deve responder diretamente ao tema e orientar os argumentos.',
      'Conectivos ajudam a organizar causa, consequencia, oposicao e conclusao.',
      'Uma proposta de intervencao precisa indicar agente, acao, meio e finalidade.',
    ],
    distractors: [
      'Apresentar repertorio sem ligar ao argumento.',
      'Trocar desenvolvimento por uma lista de opinioes soltas.',
      'Concluir apenas repetindo o tema, sem fechamento argumentativo.',
      'Usar dados sem explicar como eles sustentam a tese.',
    ],
    explanation: 'Uma boa redacao tem projeto argumentativo: tese clara, argumentos articulados, repertorio pertinente e fechamento coerente. No ENEM, a intervencao tambem precisa ser executavel e detalhada.',
    contexts: ['um tema sobre acesso a cultura', 'um debate sobre educacao publica', 'uma proposta sobre tecnologia e cidadania', 'um problema social brasileiro'],
  },
  {
    match: ['gramatica', 'norma culta', 'lingua portuguesa', 'variacao linguistica'],
    focus: 'uso da lingua',
    correctIdeas: [
      'A adequacao linguistica depende do contexto, do interlocutor e da finalidade comunicativa.',
      'A norma-padrao e exigida em situacoes formais, mas nao invalida outras variedades.',
      'Coesao textual depende de referencias claras entre termos e ideias.',
    ],
    distractors: [
      'Tratar toda variacao como erro gramatical.',
      'Analisar uma palavra sem considerar o contexto da frase.',
      'Confundir formalidade com linguagem artificial.',
      'Eliminar marcas de oralidade quando elas sao relevantes ao efeito de sentido.',
    ],
    explanation: 'Questoes de lingua costumam avaliar uso em contexto. A resposta correta considera sentido, registro, interlocutor e funcao da estrutura gramatical.',
    contexts: ['um dialogo em rede social', 'um comunicado escolar', 'um trecho literario', 'uma noticia jornalistica'],
  },
  {
    match: ['literatura'],
    focus: 'literatura',
    correctIdeas: [
      'A leitura literaria relaciona forma, tema, contexto historico e efeito expressivo.',
      'Movimentos literarios se reconhecem por temas recorrentes e escolhas de linguagem.',
      'O eu lirico ou narrador nao deve ser confundido automaticamente com o autor.',
    ],
    distractors: [
      'Reduzir a obra a biografia do autor.',
      'Ignorar recursos de linguagem, como ironia e metafora.',
      'Aplicar caracteristicas de um movimento a qualquer periodo.',
      'Confundir narrador, personagem e autor.',
    ],
    explanation: 'A analise literaria observa quem fala, como fala, em que contexto e com que efeito. Forma e conteudo trabalham juntos na construcao de sentido.',
    contexts: ['um poema modernista', 'um trecho de romance realista', 'uma cronica contemporanea', 'um texto romantico'],
  },
  {
    match: ['funcao', 'funcoes', 'algebra', 'grafico', 'conjuntos'],
    focus: 'funcoes e algebra',
    correctIdeas: [
      'Uma funcao associa cada elemento do dominio a exatamente uma imagem.',
      'O grafico permite observar crescimento, decrescimento, zeros e interceptos.',
      'Em problemas aplicados, a variavel deve representar uma grandeza do contexto.',
    ],
    distractors: [
      'Confundir dominio com imagem.',
      'Achar que toda relacao entre conjuntos e funcao.',
      'Interpretar o coeficiente sem considerar a unidade do problema.',
      'Ler o grafico apenas pela aparencia, sem observar os eixos.',
    ],
    explanation: 'Em funcoes, o essencial e relacionar grandezas. A leitura correta combina definicao, dominio, imagem, taxa de variacao e interpretacao dos eixos.',
    contexts: ['uma tarifa de transporte', 'o crescimento de uma populacao', 'um grafico de consumo de energia', 'uma relacao entre tempo e distancia'],
  },
  {
    match: ['geometria', 'trigonometria'],
    focus: 'geometria',
    correctIdeas: [
      'A resolucao deve identificar medidas conhecidas, relacoes proporcionais e a figura adequada.',
      'Semelhanca de triangulos preserva angulos e cria razoes constantes entre lados.',
      'Area e volume dependem da unidade e da dimensao correta da figura.',
    ],
    distractors: [
      'Usar formula de area como se fosse perimetro.',
      'Ignorar a escala informada no enunciado.',
      'Misturar medidas lineares com medidas quadradas.',
      'Aplicar Pitagoras sem haver triangulo retangulo.',
    ],
    explanation: 'Questoes de geometria exigem traducao do desenho para relacoes matematicas. Conferir unidades e condicoes da figura evita respostas mecanicas.',
    contexts: ['um terreno em planta baixa', 'uma embalagem', 'uma rampa de acessibilidade', 'um mapa com escala'],
  },
  {
    match: ['probabilidade', 'estatistica', 'combinatoria'],
    focus: 'probabilidade e estatistica',
    correctIdeas: [
      'Probabilidade compara casos favoraveis com casos possiveis, quando eles sao equiprovaveis.',
      'Media, mediana e moda respondem perguntas diferentes sobre um conjunto de dados.',
      'Antes de contar possibilidades, e preciso definir se a ordem importa.',
    ],
    distractors: [
      'Somar possibilidades quando deveria multiplica-las.',
      'Usar media sem observar valores extremos.',
      'Confundir porcentagem com numero absoluto.',
      'Contar eventos repetidos mais de uma vez.',
    ],
    explanation: 'A analise de dados depende da pergunta. Em contagem, defina restricoes; em probabilidade, identifique o espaco amostral; em estatistica, escolha a medida adequada.',
    contexts: ['uma pesquisa escolar', 'um sorteio', 'uma tabela de notas', 'um levantamento de renda'],
  },
  {
    match: ['progressao', 'sequencia'],
    focus: 'sequencias',
    correctIdeas: [
      'Em uma PA, a diferenca entre termos consecutivos e constante.',
      'Em uma PG, a razao entre termos consecutivos e constante.',
      'O padrao da sequencia deve ser confirmado em mais de um intervalo.',
    ],
    distractors: [
      'Usar formula de PA em uma sequencia multiplicativa.',
      'Identificar padrao por apenas dois termos.',
      'Confundir termo geral com soma dos termos.',
      'Ignorar o primeiro termo da sequencia.',
    ],
    explanation: 'Sequencias exigem reconhecer o tipo de regularidade. PA soma uma razao constante; PG multiplica por uma razao constante.',
    contexts: ['depositos mensais', 'crescimento de bacterias', 'fileiras de cadeiras', 'parcelas de uma campanha'],
  },
  {
    match: ['cinematica', 'dinamica', 'fisica'],
    focus: 'mecanica',
    correctIdeas: [
      'Forca resultante diferente de zero altera o movimento do corpo.',
      'Velocidade media relaciona deslocamento e intervalo de tempo.',
      'A interpretacao de um grafico de movimento depende das grandezas nos eixos.',
    ],
    distractors: [
      'Confundir velocidade com aceleracao.',
      'Afirmar que todo movimento precisa de forca constante no mesmo sentido.',
      'Usar distancia percorrida como se fosse deslocamento em qualquer situacao.',
      'Ignorar unidades como metro, segundo e newton.',
    ],
    explanation: 'Em mecanica, defina sistema, grandezas e unidades. Leis de Newton e graficos de movimento explicam como velocidade e aceleracao se relacionam.',
    contexts: ['um onibus freando', 'uma bicicleta em ladeira', 'um objeto em queda', 'um grafico posicao-tempo'],
  },
  {
    match: ['termologia', 'optica'],
    focus: 'calor e luz',
    correctIdeas: [
      'Calor e energia em transito devido a diferenca de temperatura.',
      'Equilibrio termico ocorre quando corpos em contato deixam de trocar calor liquido.',
      'Fenomenos opticos dependem da propagacao da luz e da interacao com meios materiais.',
    ],
    distractors: [
      'Tratar temperatura como quantidade de calor.',
      'Confundir conducao, conveccao e radiacao.',
      'Afirmar que a luz sempre se propaga do mesmo modo em qualquer meio.',
      'Ignorar propriedades do material no isolamento termico.',
    ],
    explanation: 'Termologia distingue calor, temperatura e equilibrio. Optica exige analisar trajetoria da luz, meio de propagacao e formacao de imagens.',
    contexts: ['uma garrafa termica', 'um espelho', 'uma lente', 'uma casa quente no verao'],
  },
  {
    match: ['quimica', 'organica'],
    focus: 'quimica',
    correctIdeas: [
      'Funcoes organicas sao reconhecidas por grupos de atomos que determinam propriedades.',
      'Reacoes quimicas reorganizam atomos sem destruir a materia.',
      'A estrutura molecular ajuda a prever solubilidade, acidez e reatividade.',
    ],
    distractors: [
      'Identificar funcao organica apenas pelo nome comercial.',
      'Confundir mistura com substancia pura.',
      'Ignorar conservacao de massa em uma equacao.',
      'Achar que todo composto com carbono e organico no mesmo sentido escolar.',
    ],
    explanation: 'Em quimica, observe composicao, estrutura e transformacao. Grupos funcionais e balanceamento sao chaves para interpretar fenomenos.',
    contexts: ['um medicamento', 'um combustivel', 'um alimento', 'um produto de limpeza'],
  },
  {
    match: ['biologia', 'genetica', 'celular'],
    focus: 'biologia',
    correctIdeas: [
      'O DNA armazena informacoes hereditarias que orientam a sintese de proteinas.',
      'Celulas realizam processos integrados para obter energia e manter organizacao.',
      'Caracteristicas hereditarias dependem de genes, ambiente e interacoes biologicas.',
    ],
    distractors: [
      'Afirmar que todo carater biologico depende de um unico gene.',
      'Confundir mitose e meiose.',
      'Tratar celulas como estruturas sem metabolismo proprio.',
      'Ignorar relacao entre estrutura e funcao.',
    ],
    explanation: 'Biologia exige relacionar nivel molecular, celular e organismo. Genes, celulas e ambiente atuam juntos nos processos vitais.',
    contexts: ['heranca genetica familiar', 'divisao celular', 'vacinas', 'metabolismo energetico'],
  },
  {
    match: ['historia', 'brasil republica'],
    focus: 'historia',
    correctIdeas: [
      'Processos historicos devem ser analisados por continuidade, ruptura e conflito social.',
      'Fontes historicas precisam ser interpretadas considerando autoria, contexto e intencao.',
      'Mudancas politicas costumam envolver disputas entre grupos e projetos de sociedade.',
    ],
    distractors: [
      'Explicar um periodo por um unico personagem.',
      'Tratar fonte historica como verdade neutra.',
      'Ignorar interesses economicos e sociais.',
      'Misturar acontecimentos de periodos diferentes.',
    ],
    explanation: 'Historia avalia processos, nao datas isoladas. A resposta correta considera contexto, sujeitos sociais, conflitos e consequencias.',
    contexts: ['uma charge politica', 'um discurso presidencial', 'uma greve', 'uma mudanca constitucional'],
  },
  {
    match: ['geopolitica', 'internacional', 'politica', 'economia'],
    focus: 'geopolitica e economia',
    correctIdeas: [
      'Relacoes internacionais envolvem interesses economicos, territoriais e diplomaticos.',
      'Indicadores economicos precisam ser interpretados junto de desigualdade e contexto social.',
      'Blocos economicos buscam integrar mercados, mas tambem expressam disputas de poder.',
    ],
    distractors: [
      'Reduzir conflitos internacionais a diferencas culturais.',
      'Analisar PIB sem considerar distribuicao de renda.',
      'Achar que globalizacao elimina fronteiras e interesses nacionais.',
      'Ignorar dependencia tecnologica e comercial entre paises.',
    ],
    explanation: 'Geopolitica conecta territorio, poder, economia e sociedade. A analise correta evita explicacoes simplistas e observa interesses em disputa.',
    contexts: ['um mapa de fluxos comerciais', 'uma noticia sobre guerra', 'um grafico de renda', 'um bloco economico'],
  },
  {
    match: ['filosofia', 'sociologia', 'cultura', 'sociedade'],
    focus: 'filosofia e sociologia',
    correctIdeas: [
      'A sociologia estranha o cotidiano para explicar relacoes sociais e instituicoes.',
      'A filosofia formula problemas e examina argumentos antes de aceitar conclusoes.',
      'Cultura e construida historicamente e varia entre grupos sociais.',
    ],
    distractors: [
      'Tratar comportamento social como apenas escolha individual.',
      'Confundir opiniao pessoal com argumento filosofico.',
      'Achar que cultura e fixa e natural.',
      'Ignorar relacoes de poder nas instituicoes.',
    ],
    explanation: 'Filosofia e sociologia pedem pensamento critico: analisar conceitos, argumentos, normas sociais, cultura e poder.',
    contexts: ['uma regra escolar', 'um habito de consumo', 'um debate sobre cidadania', 'uma manifestacao cultural'],
  },
  {
    match: ['geografia'],
    focus: 'geografia',
    correctIdeas: [
      'O espaco geografico resulta da relacao entre sociedade e natureza.',
      'Urbanizacao envolve infraestrutura, mobilidade, moradia e desigualdade.',
      'Clima, relevo e vegetacao influenciam atividades humanas, mas nao determinam tudo sozinhos.',
    ],
    distractors: [
      'Explicar problemas urbanos apenas pelo crescimento populacional.',
      'Confundir tempo atmosferico com clima.',
      'Ignorar a acao humana na transformacao da paisagem.',
      'Tratar mapas como imagens neutras sem escala ou legenda.',
    ],
    explanation: 'Geografia interpreta territorio, paisagem, redes e escalas. A resposta correta relaciona processos naturais e sociais.',
    contexts: ['um mapa urbano', 'um climograma', 'uma imagem de satelite', 'um texto sobre migracao'],
  },
]

const DEFAULT_PROFILE: TopicProfile = {
  match: [],
  focus: 'conteudo do topico',
  correctIdeas: [
    'A resposta correta relaciona conceito, contexto e evidencias do enunciado.',
    'Resolver a questao exige identificar a ideia central antes de aplicar uma regra.',
    'A melhor alternativa evita generalizacoes e respeita as informacoes apresentadas.',
  ],
  distractors: [
    'Escolher uma alternativa ampla demais, sem apoio no enunciado.',
    'Aplicar uma regra fora do contexto pedido.',
    'Confundir exemplo com conclusao.',
    'Ignorar palavras-chave do comando da questao.',
  ],
  explanation: 'A resolucao fica mais segura quando voce identifica o comando, separa dados importantes e confere se a alternativa responde exatamente ao que foi pedido.',
  contexts: ['uma situacao-problema', 'um texto de apoio', 'uma tabela simples', 'um caso do cotidiano'],
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function pickProfile(topicName: string): TopicProfile {
  const normalized = normalize(topicName)
  return PROFILES.find((profile) => profile.match.some((term) => normalized.includes(normalize(term)))) ?? DEFAULT_PROFILE
}

function rotateOptions(correctText: string, distractors: string[], correctIndex: number): QuestionOption[] {
  const selectedDistractors = distractors.slice(0, 4)
  const texts = [...selectedDistractors]
  texts.splice(correctIndex, 0, correctText)

  return OPTION_IDS.map((id, index) => ({
    id,
    text: texts[index] ?? selectedDistractors[index % selectedDistractors.length],
    isCorrect: index === correctIndex,
  }))
}

export function generateFallbackQuestions(data: {
  topicName: string
  subjectName?: string
  vestibularName: string
  userMasteryLevel: number
  questionCount: number
}): GeneratedQuestion[] {
  const profile = pickProfile(data.topicName)
  const difficultyBase = Math.min(5, Math.max(1, data.userMasteryLevel + 1))

  return Array.from({ length: data.questionCount }, (_, index) => {
    const context = profile.contexts[index % profile.contexts.length]
    const correctIdea = profile.correctIdeas[index % profile.correctIdeas.length]
    const correctIndex = (index + 1) % OPTION_IDS.length
    const rotatedDistractors = [
      ...profile.distractors.slice(index % profile.distractors.length),
      ...profile.distractors.slice(0, index % profile.distractors.length),
    ]

    return {
      body: `(${data.vestibularName}) Em ${context}, uma questao sobre ${data.topicName} pede que o estudante reconheca ${profile.focus}. Qual alternativa apresenta a melhor analise?`,
      options: rotateOptions(correctIdea, rotatedDistractors, correctIndex),
      explanation: profile.explanation,
      difficulty: Math.min(5, difficultyBase + (index % 2)),
    }
  })
}
