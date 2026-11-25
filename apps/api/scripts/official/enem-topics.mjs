// Classificação das questões oficiais do ENEM nos tópicos da trilha.
// Heurística por palavras-chave dentro da área da questão; o resultado vai com
// `confidence` (alta/baixa) para revisão. Nomes de tópico = enem-curriculum.ts.

/** Tópicos permitidos por área do ENEM (discipline da base). */
export const AREA_TOPICS = {
  matematica: [
    'Funções e Gráficos', 'Geometria Plana e Espacial', 'Probabilidade e Estatística', 'Progressões e Sequências',
    'Aritmética e Sistemas de Numeração', 'Razões, Porcentagens e Matemática Financeira', 'Grandezas, Medidas e Escalas',
    'Trigonometria e Geometria Analítica', 'Álgebra e Análise Combinatória',
  ],
  'ciencias-natureza': [
    'Mecânica, Trabalho e Energia', 'Gravitação, Estática e Fluidos', 'Calor e Termodinâmica', 'Ondas, Som e Óptica', 'Eletricidade e Magnetismo',
    'Matéria, Estrutura Atômica e Ligações', 'Reações, Estequiometria e Soluções', 'Energia, Cinética e Equilíbrio Químico', 'Eletroquímica e Radioatividade', 'Carbono, Polímeros e Química Ambiental',
    'Citologia, Metabolismo e Histologia', 'Genética, Evolução e Biotecnologia', 'Diversidade, Botânica e Zoologia', 'Fisiologia Humana e Saúde', 'Ecologia e Sustentabilidade',
  ],
  'ciencias-humanas': [
    'Fontes, Patrimônio e Antiguidade', 'Mundo Medieval e Moderno', 'Brasil Colonial e Imperial', 'Revoluções, Industrialização e Imperialismo', 'República, Guerras e Mundo Contemporâneo',
    'Cartografia e Dinâmicas Naturais', 'População, Migrações e Urbanização', 'Espaço Agrário, Indústria e Trabalho', 'Globalização, Território e Geopolítica', 'Energia, Ambiente e Desenvolvimento',
    'Conhecimento, Lógica e Ciência', 'Ética, Liberdade e Estética', 'Filosofia Política e Direitos',
    'Cultura, Identidade e Socialização', 'Trabalho, Desigualdade e Estratificação', 'Poder, Cidadania e Movimentos Sociais',
  ],
  linguagens: [
    'Interpretação de Texto', 'Literatura Brasileira', 'Gramática e Norma Culta', 'Gêneros Textuais e Funções da Linguagem',
    'Variação Linguística e Identidade', 'Semântica, Coesão e Intertextualidade', 'Comunicação Digital e Argumentação',
    'Artes Visuais e Linguagens Artísticas', 'Música, Teatro e Dança', 'Patrimônio, Diversidade e Arte Brasileira',
    'Cultura Corporal, Jogos e Esportes', 'Corpo, Saúde e Atividade Física', 'Inclusão, Mídia e Práticas Corporais',
  ],
  ingles: ['Leitura e Inferência em Inglês', 'Vocabulário e Recursos Linguísticos em Inglês', 'Cultura e Discursos em Inglês'],
  espanhol: ['Leitura e Inferência em Espanhol', 'Vocabulário e Recursos Linguísticos em Espanhol', 'Cultura e Discursos em Espanhol'],
}

/** Tópico usado quando nenhuma palavra-chave decide (confiança baixa). */
export const AREA_DEFAULT = {
  matematica: 'Razões, Porcentagens e Matemática Financeira',
  'ciencias-natureza': 'Ecologia e Sustentabilidade',
  'ciencias-humanas': 'Cultura, Identidade e Socialização',
  linguagens: 'Interpretação de Texto',
  ingles: 'Leitura e Inferência em Inglês',
  espanhol: 'Leitura e Inferência em Espanhol',
}

// Palavras sem acento e em minúsculas; trechos curtos casam como prefixo de palavra.
// Peso 2 para termos muito específicos (prefixo "!").
export const KEYWORDS = {
  'Funções e Gráficos': ['funcao', 'grafico', '!f(x)', 'crescente', 'decrescente', 'parabola', 'exponencial', 'logaritm', 'eixo', 'reta que', 'coeficiente', 'vertice', 'maximo', 'minimo'],
  'Geometria Plana e Espacial': ['area', 'volume', 'cilindr', 'cone', 'esfera', 'prisma', 'piramide', 'cubo', 'triangulo', 'retangul', 'circunferencia', 'circulo', 'poligon', 'hexagon', 'angulo', 'aresta', 'solido', 'perimetro', 'semelhan', 'paralelepiped', 'planificac', 'vista superior'],
  'Probabilidade e Estatística': ['!probabilidade', 'media', 'mediana', '!moda', 'desvio padrao', 'variancia', 'tabela', 'frequencia', 'pesquisa', 'amostra', 'sorte', 'sorteio', 'aleatori', 'dado ', 'chance'],
  'Progressões e Sequências': ['!progressao', 'sequencia', 'termo geral', 'razao da', 'padrao', 'a cada', 'sucessiv'],
  'Aritmética e Sistemas de Numeração': ['divisor', 'multiplo', '!mdc', '!mmc', 'primo', 'notacao cientifica', 'potencia de 10', 'fracao', 'decimal', 'numero inteiro', 'algarismo', 'resto', 'divisivel', 'conjunto'],
  'Razões, Porcentagens e Matemática Financeira': ['!porcent', '%', 'juros', 'desconto', 'aumento', 'lucro', 'preco', 'reais', 'r$', 'taxa', 'parcela', 'proporcional', 'razao', 'regra de tres', 'investiment', 'salario', 'imposto', 'financ'],
  'Grandezas, Medidas e Escalas': ['!escala', 'unidade', 'metro', 'litro', 'quilometr', 'centimetr', 'milimetr', 'kg', 'grama', 'hora', 'minuto', 'velocidade media', 'conversao', 'medida', 'capacidade', 'consumo'],
  'Trigonometria e Geometria Analítica': ['!seno', '!cosseno', '!tangente', 'trigonometr', 'plano cartesiano', 'coordenada', 'ponto (', 'distancia entre', 'radiano', 'ciclo', 'periodic'],
  'Álgebra e Análise Combinatória': ['!combinac', '!permutac', '!arranjo', 'anagrama', 'maneiras', 'possibilidades', 'senha', 'equacao', 'sistema', 'incognita', 'inequac', 'expressao algebrica', 'fatorial', 'quantas formas'],

  'Mecânica, Trabalho e Energia': ['velocidade', 'aceleracao', 'forca', 'newton', 'atrito', 'massa', 'energia cinetica', 'energia potencial', 'trabalho', 'potencia', 'colisao', 'quantidade de movimento', 'impulso', 'movimento', 'freio', 'veiculo', 'mola'],
  'Gravitação, Estática e Fluidos': ['!empuxo', 'pressao', 'densidade', 'fluido', 'hidrostat', 'gravita', 'satelite', 'orbita', 'alavanca', 'equilibrio estatico', 'torque', 'arquimedes', 'pascal', 'flutua', 'submers'],
  'Calor e Termodinâmica': ['!calor', 'temperatura', 'termic', 'dilatac', 'caloria', 'termodinam', 'maquina termica', 'isolante', 'conducao', 'conveccao', 'irradiacao', 'ebulicao', 'fusao', 'aquecimento', 'refrigera', 'rendimento'],
  'Ondas, Som e Óptica': ['!onda', 'som', 'frequencia', 'comprimento de onda', 'luz', 'lente', 'espelho', 'refracao', 'reflexao', 'difracao', 'optic', 'radiacao', 'ultravioleta', 'infravermelho', 'eco', 'decibel', 'micro-ondas', 'cor '],
  'Eletricidade e Magnetismo': ['!eletric', 'corrente', 'tensao', 'resistor', 'resistencia', 'circuito', 'voltagem', 'volt', 'ampere', 'watt', 'pilha', 'bateria', 'lampada', 'magnet', 'ima', 'chuveiro', 'fio', 'kwh', 'gerador', 'transformador', 'inducao'],
  'Matéria, Estrutura Atômica e Ligações': ['!atomo', 'atomic', 'eletron', 'proton', 'neutron', 'ligacao', 'ionic', 'covalent', 'polaridade', 'molecula', 'tabela periodica', 'isotopo', 'separacao de misturas', 'destilac', 'decantac', 'filtrac', 'substancia', 'mistura', 'intermolecular'],
  'Reações, Estequiometria e Soluções': ['!estequiometr', 'mol', 'concentracao', 'solucao', 'solubilidade', 'diluic', 'massa molar', 'reacao', 'reagente', 'produto', 'balancea', 'ph', 'acido', 'base', 'neutraliza', 'sal', 'titulac'],
  'Energia, Cinética e Equilíbrio Químico': ['!entalpia', 'exotermic', 'endotermic', 'velocidade da reacao', 'catalisador', 'cinetica', 'equilibrio quimico', 'le chatelier', 'constante de equilibrio', 'combustao', 'energia de ativacao', 'calor de'],
  'Eletroquímica e Radioatividade': ['!oxidac', 'reducao', 'oxirreduc', 'eletrolise', 'pilha', 'corrosao', 'galvaniz', 'nox', 'radioativ', 'meia-vida', 'decaimento', 'nuclear', 'fissao', 'radiacao alfa', 'beta', 'gama'],
  'Carbono, Polímeros e Química Ambiental': ['!organic', 'carbono', 'hidrocarboneto', 'polimero', 'plastic', 'alcool', 'etanol', 'ester', 'funcao organica', 'isomer', 'petroleo', 'biodiesel', 'combustivel', 'chuva acida', 'poluente', 'efeito estufa', 'saponific', 'detergente', 'amina', 'cadeia carbonica'],
  'Citologia, Metabolismo e Histologia': ['!celula', 'celular', 'mitocondri', 'cloroplast', 'membrana', 'organela', 'respiracao celular', 'fermentac', 'fotossintese', 'atp', 'enzima', 'tecido', 'ribossomo', 'nucleo', 'citoplasma', 'mitose', 'meiose'],
  'Genética, Evolução e Biotecnologia': ['!gene', 'genetic', 'dna', 'rna', 'cromossomo', 'alelo', 'heredit', 'mutac', 'evoluc', 'selecao natural', 'darwin', 'lamarck', 'especiacao', 'transgenic', 'clonag', 'biotecnolog', 'heterozig', 'homozig', 'fenotipo', 'genotipo', 'crispr', 'pcr'],
  'Diversidade, Botânica e Zoologia': ['!planta', 'vegetal', 'folha', 'raiz', 'semente', 'flor', 'fruto', 'polinizac', 'animal', 'inseto', 'mamifer', 'anfibio', 'repteis', 'reptil', 'aves', 'peixe', 'fungo', 'bacteria', 'virus', 'protozoario', 'verme', 'classificacao', 'especie'],
  'Fisiologia Humana e Saúde': ['!saude', 'doenca', 'vacina', 'sangue', 'hormonio', 'insulina', 'sistema imun', 'anticorpo', 'digest', 'rim', 'figado', 'coracao', 'pulmao', 'neuron', 'infeccao', 'medicament', 'antibiotic', 'dengue', 'zika', 'covid', 'parasita', 'nutric', 'vitamina', 'diabetes', 'pressao arterial', 'corpo humano'],
  'Ecologia e Sustentabilidade': ['!ecossistema', 'ecolog', 'cadeia alimentar', 'teia alimentar', 'populacao de', 'bioma', 'biodiversidade', 'desmatamento', 'poluicao', 'sustentab', 'reciclag', 'lixo', 'residuo', 'aquecimento global', 'eutrofiz', 'agrotoxic', 'ciclo do', 'nicho', 'predador', 'mutualismo', 'parasitismo', 'ambiental'],

  'Fontes, Patrimônio e Antiguidade': ['!grecia', 'grego', 'roma', 'romano', 'egito', 'mesopotamia', 'antiguidade', 'pre-historia', 'patrimonio', 'arqueolog', 'fonte historica', 'democracia atenien', 'atenas', 'esparta', 'imperio romano'],
  'Mundo Medieval e Moderno': ['!medieval', 'feudal', 'idade media', 'igreja catolica', 'cruzada', 'renascimento', 'reforma protestante', 'absolutismo', 'mercantilismo', 'grandes navegac', 'iluminismo', 'humanismo', 'inquisic', 'monarquia', 'servo', 'senhor feudal'],
  'Brasil Colonial e Imperial': ['!colonia', 'colonial', 'engenho', 'acucar', 'escravid', 'escraviz', 'quilombo', 'bandeirante', 'jesuit', 'capitania', 'minerac', 'ouro', 'independencia do brasil', 'imperio', 'dom pedro', 'regencia', 'abolicion', 'lei aurea', 'portugal', 'metropole', 'indigena'],
  'Revoluções, Industrialização e Imperialismo': ['!revolucao industrial', 'revolucao francesa', 'industrializac', 'fabrica', 'operario', 'burguesia', 'imperialismo', 'neocolonial', 'partilha da africa', 'liberalismo', 'socialismo', 'marx', 'capitalismo', 'revolucao russa', 'iluminis'],
  'República, Guerras e Mundo Contemporâneo': ['!republica', 'vargas', 'estado novo', 'ditadura', 'golpe de 1964', 'regime militar', 'ai-5', 'redemocratiz', 'constituicao de 1988', 'guerra mundial', 'guerra fria', 'nazis', 'fascis', 'totalitar', 'holocausto', 'muro de berlim', 'coronelismo', 'cafe com leite', 'tenentis', 'diretas ja'],
  'Cartografia e Dinâmicas Naturais': ['!mapa', 'cartograf', 'escala', 'projecao', 'latitude', 'longitude', 'fuso', 'relevo', 'clima', 'chuva', 'massa de ar', 'vegetacao', 'solo', 'erosao', 'bacia hidrografica', 'rio', 'placa tectonica', 'terremoto', 'vulcan', 'el nino', 'geomorfolog', 'rocha'],
  'População, Migrações e Urbanização': ['!urbaniz', 'cidade', 'urbano', 'metropole', 'favela', 'periferia', 'migrac', 'migrante', 'imigra', 'emigra', 'exodo rural', 'populacao', 'demografic', 'natalidade', 'fecundidade', 'envelhecimento', 'refugiad', 'segregacao', 'moradia', 'mobilidade urbana'],
  'Espaço Agrário, Indústria e Trabalho': ['!agrari', 'agricultura', 'agronegocio', 'latifundio', 'reforma agraria', 'campo', 'rural', 'soja', 'pecuaria', 'industria', 'fordismo', 'toyotismo', 'globalizacao produtiva', 'trabalhador rural', 'mst', 'agricultura familiar', 'monocultura', 'revolucao verde'],
  'Globalização, Território e Geopolítica': ['!globaliz', 'geopolit', 'territorio', 'fronteira', 'bloco economico', 'mercosul', 'onu', 'conflito', 'guerra', 'estado nacao', 'soberania', 'multinacional', 'transnacional', 'comercio internacional', 'brics', 'otan'],
  'Energia, Ambiente e Desenvolvimento': ['!energia', 'hidreletric', 'usina', 'petroleo', 'pre-sal', 'matriz energetica', 'eolica', 'solar', 'biocombustiv', 'desenvolvimento sustentavel', 'recursos naturais', 'impacto ambiental', 'desmatamento', 'amazonia', 'cerrado', 'agua potavel'],
  'Conhecimento, Lógica e Ciência': ['!conhecimento', 'razao', 'racional', 'empiris', 'descartes', 'kant', 'hume', 'bacon', 'ciencia', 'metodo', 'verdade', 'duvida', 'socrates', 'platao', 'aristoteles', 'logica', 'mito', 'filosof'],
  'Ética, Liberdade e Estética': ['!etica', 'moral', 'virtude', 'liberdade', 'existencialis', 'sartre', 'nietzsche', 'felicidade', 'dever', 'estetica', 'belo', 'bioetica', 'utilitaris', 'epicur', 'estoic'],
  'Filosofia Política e Direitos': ['!contrato social', 'hobbes', 'locke', 'rousseau', 'maquiavel', 'montesquieu', 'estado de natureza', 'soberano', 'poder politico', 'direitos humanos', 'cidadao', 'tirania', 'democracia', 'arendt', 'politica'],
  'Cultura, Identidade e Socialização': ['!cultura', 'identidade', 'etnocentr', 'relativismo', 'socializac', 'tradic', 'religi', 'indigenas', 'diversidade cultural', 'industria cultural', 'midia', 'consumo', 'antropolog', 'costume', 'patrimonio imaterial'],
  'Trabalho, Desigualdade e Estratificação': ['!desigualdade', 'classe social', 'estratificac', 'pobreza', 'renda', 'trabalho', 'emprego', 'desemprego', 'precarizac', 'informalidade', 'mais-valia', 'proletari', 'divisao do trabalho', 'durkheim', 'weber', 'exploracao'],
  'Poder, Cidadania e Movimentos Sociais': ['!movimento social', 'movimentos sociais', 'cidadania', 'direitos', 'feminis', 'racismo', 'movimento negro', 'sindicato', 'greve', 'protesto', 'participacao politica', 'voto', 'eleic', 'estado', 'poder', 'lgbt', 'minorias'],

  'Interpretação de Texto': ['texto', 'autor', 'leitor', 'infer', 'sentido', 'objetivo', 'finalidade', 'ponto de vista'],
  'Literatura Brasileira': ['!poema', 'poeta', 'romance', 'literari', 'modernis', 'romantis', 'realismo', 'naturalismo', 'parnasian', 'simbolis', 'barroco', 'arcadismo', 'machado de assis', 'drummond', 'clarice', 'guimaraes rosa', 'verso', 'estrofe', 'narrador', 'personagem', 'conto', 'cronica'],
  'Gramática e Norma Culta': ['!norma-padrao', 'norma padrao', 'concordancia', 'regencia', 'crase', 'pontuacao', 'virgula', 'pronome', 'verbo', 'sujeito', 'oracao', 'conjuncao', 'adjetivo', 'substantivo', 'preposic', 'tempo verbal', 'colocacao'],
  'Gêneros Textuais e Funções da Linguagem': ['!genero textual', 'genero', 'funcao da linguagem', 'conativa', 'referencial', 'metalinguistic', 'fatica', 'emotiva', 'poetica', 'anuncio', 'propaganda', 'campanha', 'reportagem', 'noticia', 'editorial', 'carta', 'manual', 'receita', 'tirinha', 'charge'],
  'Variação Linguística e Identidade': ['!variacao linguistica', 'variedade', 'variante', 'regional', 'sotaque', 'dialeto', 'preconceito linguistico', 'informal', 'coloquial', 'girias', 'giria', 'oralidade', 'falante'],
  'Semântica, Coesão e Intertextualidade': ['!intertext', 'parodia', 'parafrase', 'ironia', 'metafora', 'metonimia', 'figura de linguagem', 'ambiguidade', 'polissemia', 'coesao', 'conectivo', 'humor', 'duplo sentido', 'eufemismo', 'hiperbole', 'antitese'],
  'Comunicação Digital e Argumentação': ['!internet', 'rede social', 'redes sociais', 'digital', 'tecnologia', 'fake news', 'desinformac', 'aplicativo', 'celular', 'algoritmo', 'virtual', 'online', 'argument', 'persuas'],
  'Artes Visuais e Linguagens Artísticas': ['!pintura', 'pintor', 'obra de arte', 'artista', 'escultura', 'fotografia', 'grafite', 'arte contemporanea', 'vanguarda', 'cubis', 'surrealis', 'impressionis', 'instalacao', 'tela', 'museu', 'exposic'],
  'Música, Teatro e Dança': ['!musica', 'cancao', 'samba', 'teatro', 'danca', 'coreograf', 'ritmo', 'melodia', 'compositor', 'espetaculo', 'cena', 'ator', 'atriz', 'bossa nova', 'tropicalis', 'cinema'],
  'Patrimônio, Diversidade e Arte Brasileira': ['!patrimonio', 'arte indigena', 'cultura popular', 'artesanato', 'folclore', 'capoeira', 'cordel', 'festa popular', 'afro-brasileir', 'tradicao'],
  'Cultura Corporal, Jogos e Esportes': ['!esporte', 'futebol', 'jogo', 'brincadeira', 'atleta', 'olimpi', 'competic', 'luta', 'capoeira', 'skate', 'basquete', 'volei', 'ginastica'],
  'Corpo, Saúde e Atividade Física': ['!atividade fisica', 'exercicio fisico', 'sedentaris', 'condicionamento', 'aerobic', 'musculac', 'alongamento', 'frequencia cardiaca', 'obesidade', 'corpo'],
  'Inclusão, Mídia e Práticas Corporais': ['!paralimpi', 'deficiencia', 'inclusao', 'acessibilidade', 'padrao de beleza', 'midia', 'estereotipo'],

  'Leitura e Inferência em Inglês': ['according', 'the text', 'author', 'main', 'purpose', 'suggest'],
  'Vocabulário e Recursos Linguísticos em Inglês': ['!the word', 'the expression', 'refers to', 'means', 'meaning', 'used to'],
  'Cultura e Discursos em Inglês': ['!poem', 'song', 'lyrics', 'cartoon', 'comic', 'culture', 'campaign', 'advert', 'movie'],
  'Leitura e Inferência em Espanhol': ['segun el texto', 'el texto', 'autor', 'objetivo', 'finalidad'],
  'Vocabulário e Recursos Linguísticos em Espanhol': ['!la palabra', 'expresion', 'termino', 'significa', 'se refiere', 'el uso de'],
  'Cultura e Discursos em Espanhol': ['!poema', 'cancion', 'historieta', 'vineta', 'cultura', 'campana', 'publicidad', 'pelicula'],
}

const norm = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function hits(text, keyword) {
  const k = norm(keyword)
  if (/^[a-z]/.test(k) && k.length <= 4 && !k.includes(' ')) {
    return (text.match(new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'g')) ?? []).length
  }
  let count = 0
  let index = text.indexOf(k)
  while (index !== -1) {
    const before = index === 0 ? ' ' : text[index - 1]
    if (!/[a-z]/.test(before)) count++
    index = text.indexOf(k, index + k.length)
  }
  return count
}

/** Retorna { topic, confidence, score } para a questão. */
export function classify({ discipline, language, text }) {
  const area = language === 'ingles' ? 'ingles' : language === 'espanhol' ? 'espanhol' : discipline
  const candidates = AREA_TOPICS[area]
  if (!candidates) return null
  const body = norm(text)
  let best = null
  let second = 0
  for (const topic of candidates) {
    let score = 0
    for (const raw of KEYWORDS[topic] ?? []) {
      const weight = raw.startsWith('!') ? 3 : 1
      score += Math.min(3, hits(body, raw.replace(/^!/, ''))) * weight
    }
    if (!best || score > best.score) { second = best?.score ?? 0; best = { topic, score } }
    else if (score > second) second = score
  }
  if (!best || best.score < 1) return { topic: AREA_DEFAULT[area], confidence: 'baixa', score: 0 }
  return { topic: best.topic, confidence: best.score >= 4 && best.score >= second * 1.5 ? 'alta' : 'baixa', score: best.score }
}
