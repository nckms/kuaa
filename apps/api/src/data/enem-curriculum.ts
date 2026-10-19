export interface EnemTopic {
  name: string
  description: string
  order: number
}

export interface EnemSubject {
  name: string
  slug: string
  weight: number
  order: number
  iconSlug: string
  topics: EnemTopic[]
}

const topics = (entries: [string, string][], start = 1): EnemTopic[] =>
  entries.map(([name, description], index) => ({ name, description, order: start + index }))

// Slugs and orders are persistence keys. Append topics; never renumber existing ones.
export const ENEM_SUBJECTS: EnemSubject[] = [
  {
    name: 'Português e Literatura', slug: 'linguagens', weight: 0.15, order: 1, iconSlug: 'lang',
    topics: topics([
      ['Interpretação de Texto', 'Leitura, inferência, finalidade, ponto de vista e análise de textos verbais e não verbais.'],
      ['Literatura Brasileira', 'Formação literária, escolas literárias, autores, narrador, identidade nacional e relações entre literatura e sociedade.'],
      ['Gramática e Norma Culta', 'Morfossintaxe, concordância, regência, pontuação e norma-padrão em contextos de uso.'],
      ['Produção Textual', 'Gêneros textuais, tese, argumentação, planejamento, coesão e adequação ao interlocutor.'],
      ['Gêneros Textuais e Funções da Linguagem', 'Gêneros, suportes, tipologias, elementos da comunicação e funções da linguagem.'],
      ['Variação Linguística e Identidade', 'Variedades regionais, históricas e sociais, registros e combate ao preconceito linguístico.'],
      ['Semântica, Coesão e Intertextualidade', 'Polissemia, figuras de linguagem, humor, ironia, conectivos, referenciação, paráfrase e paródia.'],
      ['Comunicação Digital e Argumentação', 'Tecnologias da informação, multimodalidade, persuasão, confiabilidade de fontes e circulação social dos discursos.'],
    ]),
  },
  {
    name: 'Matemática', slug: 'matematica', weight: 0.25, order: 2, iconSlug: 'math',
    topics: topics([
      ['Funções e Gráficos', 'Funções afins, quadráticas, polinomiais, racionais, exponenciais e logarítmicas; gráficos, equações e inequações.'],
      ['Geometria Plana e Espacial', 'Figuras, ângulos, semelhança, congruência, áreas, volumes, simetrias e propriedades de sólidos.'],
      ['Probabilidade e Estatística', 'Amostragem, tabelas e gráficos, médias, mediana, moda, dispersão e probabilidade.'],
      ['Progressões e Sequências', 'Padrões numéricos, progressões aritméticas e geométricas e aplicações.'],
      ['Aritmética e Sistemas de Numeração', 'Naturais, inteiros, racionais e reais; divisibilidade, fatoração, conjuntos, operações e notação científica.'],
      ['Razões, Porcentagens e Matemática Financeira', 'Proporcionalidade direta e inversa, regra de três, taxas, juros simples e compostos.'],
      ['Grandezas, Medidas e Escalas', 'Unidades, conversões, estimativas, comprimento, superfície, volume, massa, tempo e escalas.'],
      ['Trigonometria e Geometria Analítica', 'Razões trigonométricas, ciclo, funções periódicas, coordenadas, distância, retas e circunferências.'],
      ['Álgebra e Análise Combinatória', 'Expressões algébricas, equações, inequações, sistemas, princípio multiplicativo, permutações e combinações.'],
    ]),
  },
  {
    name: 'Ciências da Natureza', slug: 'ciencias-natureza', weight: 0.01, order: 3, iconSlug: 'science',
    topics: topics([
      ['Cinemática e Dinâmica', 'Revisão integradora de movimento, forças, energia e aplicações tecnológicas.'],
      ['Termologia e Óptica', 'Revisão integradora de calor, temperatura, fenômenos ópticos e propagação da luz.'],
      ['Química Orgânica', 'Revisão integradora de compostos de carbono, funções orgânicas, reações e materiais.'],
      ['Biologia Celular e Genética', 'Revisão integradora de estrutura celular, hereditariedade, expressão gênica e biotecnologia.'],
    ]),
  },
  {
    name: 'Ciências Humanas', slug: 'ciencias-humanas', weight: 0.01, order: 4, iconSlug: 'humanities',
    topics: topics([
      ['História do Brasil República', 'Revisão integradora da Primeira República à democracia contemporânea.'],
      ['Geopolítica Mundial', 'Revisão integradora de poder, blocos econômicos, conflitos e organismos multilaterais.'],
      ['Filosofia e Sociologia', 'Revisão integradora de pensamento filosófico, estrutura social e movimentos culturais.'],
      ['Geografia Física e Humana', 'Revisão integradora de relevo, clima, biomas, urbanização e população.'],
    ]),
  },
  {
    name: 'Física', slug: 'fisica', weight: 0.08, order: 5, iconSlug: 'science',
    topics: topics([
      ['Mecânica, Trabalho e Energia', 'SI, vetores, gráficos do movimento, Newton, atrito, trabalho, potência, impulso e conservação de energia e momento.'],
      ['Gravitação, Estática e Fluidos', 'Equilíbrio, torque, gravitação, órbitas, pressão, Pascal, Arquimedes e hidrostática.'],
      ['Calor e Termodinâmica', 'Termometria, dilatação, calorimetria, mudanças de estado, gases, transferência de calor e leis da termodinâmica.'],
      ['Ondas, Som e Óptica', 'Oscilações, frequência, ondas, acústica, reflexão, refração, lentes, espelhos e instrumentos ópticos.'],
      ['Eletricidade e Magnetismo', 'Carga, campo, potencial, corrente, resistores, circuitos, consumo, magnetismo, indução e radiação eletromagnética.'],
    ]),
  },
  {
    name: 'Química', slug: 'quimica', weight: 0.08, order: 6, iconSlug: 'science',
    topics: topics([
      ['Matéria, Estrutura Atômica e Ligações', 'Materiais, misturas, separação, modelos atômicos, periodicidade, ligações, geometria e forças intermoleculares.'],
      ['Reações, Estequiometria e Soluções', 'Equações, mol, massas, gases, rendimento, pureza, solubilidade, concentrações e diluição.'],
      ['Energia, Cinética e Equilíbrio Químico', 'Termoquímica, velocidade, catalisadores, equilíbrio, ácidos, bases, sais, óxidos, pH e hidrólise.'],
      ['Eletroquímica e Radioatividade', 'Oxirredução, pilhas, eletrólise, corrosão, emissões, meia-vida, fissão, fusão e aplicações nucleares.'],
      ['Carbono, Polímeros e Química Ambiental', 'Funções orgânicas, isomeria, reações, biomoléculas, combustíveis, polímeros, água, atmosfera e resíduos.'],
    ]),
  },
  {
    name: 'Biologia', slug: 'biologia', weight: 0.08, order: 7, iconSlug: 'science',
    topics: topics([
      ['Citologia, Metabolismo e Histologia', 'Membranas, organelas, biomoléculas, enzimas, respiração, fermentação, fotossíntese, divisão celular e tecidos.'],
      ['Genética, Evolução e Biotecnologia', 'DNA, RNA, síntese proteica, Mendel, grupos sanguíneos, mutações, seleção, especiação, engenharia genética e bioética.'],
      ['Diversidade, Botânica e Zoologia', 'Classificação, vírus, bactérias, protistas, fungos, ciclos de plantas, fisiologia vegetal e grupos animais.'],
      ['Fisiologia Humana e Saúde', 'Sistemas do corpo, homeostase, reprodução, embriologia, imunidade, doenças, saneamento e qualidade de vida.'],
      ['Ecologia e Sustentabilidade', 'Ecossistemas, cadeias e teias, ciclos biogeoquímicos, populações, sucessão, biomas, conservação e impactos ambientais.'],
    ]),
  },
  {
    name: 'História', slug: 'historia', weight: 0.08, order: 8, iconSlug: 'humanities',
    topics: topics([
      ['Fontes, Patrimônio e Antiguidade', 'Fontes, memória, patrimônio, culturas africanas e indígenas, civilizações antigas, cidadania grega e romana.'],
      ['Mundo Medieval e Moderno', 'Feudalismo, islamismo, Renascimento, Reformas, absolutismo, expansão marítima e mercantilismo.'],
      ['Brasil Colonial e Imperial', 'Conquista, escravização, resistências, economia colonial, independências americanas, Império e abolição.'],
      ['Revoluções, Industrialização e Imperialismo', 'Iluminismo, revoluções burguesas, liberalismo, socialismo, trabalho industrial e colonialismo na África e Ásia.'],
      ['República, Guerras e Mundo Contemporâneo', 'República brasileira, Era Vargas, guerras mundiais, totalitarismos, revoluções do século XX, Guerra Fria, ditaduras e redemocratização.'],
    ]),
  },
  {
    name: 'Geografia', slug: 'geografia', weight: 0.08, order: 9, iconSlug: 'world',
    topics: topics([
      ['Cartografia e Dinâmicas Naturais', 'Coordenadas, projeções, fusos, geologia, relevo, solos, clima, hidrografia, vegetação e domínios naturais.'],
      ['População, Migrações e Urbanização', 'Demografia, transição demográfica, migrações, redes urbanas, segregação, mobilidade e planejamento.'],
      ['Espaço Agrário, Indústria e Trabalho', 'Estrutura fundiária, agricultura, conflitos, industrialização, produção, serviços, transportes e tecnologias.'],
      ['Globalização, Território e Geopolítica', 'Formação territorial brasileira, regionalização, redes, comércio, blocos, conflitos e organizações internacionais.'],
      ['Energia, Ambiente e Desenvolvimento', 'Fontes energéticas, recursos naturais, sustentabilidade, impactos, riscos, clima e políticas ambientais.'],
    ]),
  },
  {
    name: 'Filosofia', slug: 'filosofia', weight: 0.04, order: 10, iconSlug: 'humanities',
    topics: topics([
      ['Conhecimento, Lógica e Ciência', 'Mito e razão, filosofia antiga e medieval, lógica, racionalismo, empirismo e limites do conhecimento científico.'],
      ['Ética, Liberdade e Estética', 'Virtude, dever, consequências, autonomia, existência, juízos estéticos e responsabilidade.'],
      ['Filosofia Política e Direitos', 'Estado, poder, contrato social, liberalismo, democracia, justiça, cidadania e direitos humanos.'],
    ]),
  },
  {
    name: 'Sociologia', slug: 'sociologia', weight: 0.04, order: 11, iconSlug: 'humanities',
    topics: topics([
      ['Cultura, Identidade e Socialização', 'Durkheim, Weber e Marx; instituições, socialização, etnocentrismo, diversidade, cultura e indústria cultural.'],
      ['Trabalho, Desigualdade e Estratificação', 'Divisão do trabalho, classes, exploração, mobilidade, desigualdades de raça e gênero e transformações produtivas.'],
      ['Poder, Cidadania e Movimentos Sociais', 'Estado, democracia, participação, movimentos, direitos, políticas afirmativas e meios de comunicação.'],
    ]),
  },
  {
    name: 'Inglês', slug: 'ingles', weight: 0.025, order: 12, iconSlug: 'lang',
    topics: topics([
      ['Leitura e Inferência em Inglês', 'Estratégias de leitura, ideia central, inferências e compreensão de textos de diferentes gêneros.'],
      ['Vocabulário e Recursos Linguísticos em Inglês', 'Cognatos, falsos cognatos, conectores, referenciação e estruturas gramaticais em contexto.'],
      ['Cultura e Discursos em Inglês', 'Diversidade cultural, língua global, crítica social, publicidade e relações entre texto e contexto.'],
    ]),
  },
  {
    name: 'Espanhol', slug: 'espanhol', weight: 0.025, order: 13, iconSlug: 'lang',
    topics: topics([
      ['Leitura e Inferência em Espanhol', 'Ideia central, finalidade, informações explícitas e implícitas em gêneros variados.'],
      ['Vocabulário e Recursos Linguísticos em Espanhol', 'Falsos cognatos, conectores, pronomes e tempos verbais interpretados em contexto.'],
      ['Cultura e Discursos em Espanhol', 'Culturas hispânicas, identidades latino-americanas, diversidade e crítica social.'],
    ]),
  },
  {
    name: 'Artes', slug: 'artes', weight: 0.025, order: 14, iconSlug: 'lang',
    topics: topics([
      ['Artes Visuais e Linguagens Artísticas', 'Composição, representação, fotografia, cinema, arte digital, leitura de imagens e relações entre linguagens.'],
      ['Música, Teatro e Dança', 'Elementos musicais, corpo, espaço, performance, dramaturgia e contextos de produção e recepção.'],
      ['Patrimônio, Diversidade e Arte Brasileira', 'Patrimônio material e imaterial, matrizes indígenas e africanas, modernismo e arte contemporânea.'],
    ]),
  },
  {
    name: 'Educação Física', slug: 'educacao-fisica', weight: 0.025, order: 15, iconSlug: 'humanities',
    topics: topics([
      ['Cultura Corporal, Jogos e Esportes', 'Jogos, esportes, lutas, danças, regras, cooperação e produção cultural das práticas corporais.'],
      ['Corpo, Saúde e Atividade Física', 'Capacidades físicas, exercício, lazer, hábitos, padrões corporais e relações entre saúde e condições sociais.'],
      ['Inclusão, Mídia e Práticas Corporais', 'Acessibilidade, gênero, diversidade, esporte adaptado, mídia, consumo e participação.'],
    ]),
  },
  {
    name: 'Redação', slug: 'redacao', weight: 0, order: 16, iconSlug: 'write',
    topics: topics([
      ['Norma Escrita e Adequação Linguística', 'Preparação para a competência I: registro formal, sintaxe, pontuação e clareza; não constitui correção de texto.'],
      ['Tema, Repertório e Projeto de Texto', 'Preparação para a competência II: recorte temático, repertório pertinente e estrutura dissertativo-argumentativa.'],
      ['Tese, Argumentação e Autoria', 'Preparação para a competência III: seleção, organização e interpretação de evidências para defender um ponto de vista.'],
      ['Coesão e Progressão Argumentativa', 'Preparação para a competência IV: referenciação, conectivos e articulação entre períodos e parágrafos.'],
      ['Intervenção e Direitos Humanos', 'Preparação para a competência V: agente, ação, meio, finalidade e detalhamento, respeitando direitos humanos.'],
    ]),
  },
]
