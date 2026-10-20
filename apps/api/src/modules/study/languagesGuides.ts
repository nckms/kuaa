import type { StudyGuide } from './guides'

export const languagesGuides: Record<string, StudyGuide> = {
  'Gramática e Norma Culta': {
    objective: 'Avaliar concordância e pontuação conforme o sentido e a situação de uso.',
    explanation: [
      'A norma-padrão é uma variedade usada em contextos formais; analisar seu emprego não significa considerar inferiores outras variedades da língua.',
      'Na concordância verbal, identifique o núcleo do sujeito antes de escolher a forma do verbo. Termos entre sujeito e verbo não mudam esse núcleo.',
      'A pontuação organiza relações sintáticas e efeitos de sentido. Em regra, não separe sujeito e verbo com vírgula apenas por haver uma pausa na fala.',
    ],
    example: { prompt: 'Qual forma cabe em “Os resultados da pesquisa ___ publicados”?', steps: ['Localize o núcleo do sujeito: “resultados”, no plural.', 'Faça o verbo concordar com esse núcleo, não com “pesquisa”.'], answer: '“Os resultados da pesquisa foram publicados.”' },
    commonMistake: 'Concordar o verbo com o substantivo mais próximo, sem localizar o núcleo do sujeito.',
    check: { question: 'Qual frase segue a concordância da norma-padrão?', options: ['Os dados da escola foi divulgado.', 'Os dados da escola foram divulgados.', 'Os dados da escola foram divulgado.'], correctIndex: 1, feedback: '“Dados” é o núcleo plural do sujeito; verbo e particípio ficam no plural.' },
  },
  'Produção Textual': {
    objective: 'Planejar um texto adequado a gênero, finalidade e destinatário.',
    explanation: [
      'Antes de escrever, identifique o que se pede: informar, solicitar, relatar ou defender uma posição. A finalidade orienta a seleção das informações.',
      'Considere o destinatário e o suporte. Um aviso público requer informações objetivas; uma carta argumentativa precisa de interlocução e justificativas.',
      'Organize as ideias em sequência e revise se cada parte contribui para o objetivo do texto, sem trocar de gênero no meio da escrita.',
    ],
    example: { prompt: 'A escola pede um aviso sobre mudança de horário da biblioteca. O que incluir?', steps: ['Defina o público: pessoas que usam a biblioteca.', 'Anote a mudança, a data de início e o novo horário.', 'Escreva em linguagem direta, sem transformar o aviso em opinião pessoal.'], answer: 'Um aviso com data, novo horário e indicação clara de onde a informação se aplica.' },
    commonMistake: 'Produzir um texto bem escrito sobre o tema, mas que não cumpre a finalidade solicitada.',
    check: { question: 'Em um aviso de alteração de horário, qual informação é indispensável?', options: ['A opinião do autor sobre leitura', 'O novo horário e quando passa a valer', 'Uma tese sobre políticas públicas'], correctIndex: 1, feedback: 'O leitor precisa saber qual é a mudança e a partir de quando ela vale.' },
  },
  'Gêneros Textuais e Funções da Linguagem': {
    objective: 'Reconhecer a finalidade de um gênero e a função da linguagem predominante em contexto.',
    explanation: [
      'Gênero é uma forma social de comunicação, como notícia, receita ou anúncio; não se define apenas pelo tamanho ou pela presença de imagens.',
      'As funções da linguagem descrevem ênfases: a referencial privilegia informação sobre o contexto; a conativa busca influenciar o destinatário.',
      'Um texto pode combinar funções. Para identificar a predominante, observe a finalidade concreta e os recursos usados no trecho.',
    ],
    example: { prompt: 'Em “Vacine-se nesta semana. Procure a unidade de saúde”, qual função predomina?', steps: ['Observe os verbos no imperativo: “vacine-se” e “procure”.', 'Relacione as escolhas ao objetivo de orientar uma ação do leitor.'], answer: 'Função conativa (ou apelativa), voltada a influenciar o destinatário.' },
    commonMistake: 'Classificar um texto inteiro como referencial só porque contém dados, ignorando sua finalidade persuasiva.',
    check: { question: 'Em “A temperatura chegou a 32 °C às 14h”, qual função predomina?', options: ['Referencial', 'Conativa', 'Metalinguística'], correctIndex: 0, feedback: 'O enunciado privilegia uma informação verificável sobre o contexto.' },
  },
  'Variação Linguística e Identidade': {
    objective: 'Distinguir variedades da língua e avaliar a adequação de um registro sem reproduzir preconceito linguístico.',
    explanation: [
      'A língua varia entre regiões, grupos sociais, gerações e situações. Diferença de uso não equivale a incapacidade de pensar ou se comunicar.',
      'O registro formal é adequado em certos contextos, como documentos oficiais; conversas informais podem seguir outras convenções.',
      'Ao ler uma questão, identifique quem fala, para quem e com que propósito antes de julgar o efeito de uma escolha linguística.',
    ],
    example: { prompt: 'Uma personagem diz “a gente vai” em diálogo com amigos. O que essa forma indica?', steps: ['Identifique o contexto de conversa informal.', 'Observe que “a gente” tem valor de primeira pessoa do plural, com verbo no singular nessa construção.'], answer: 'Uma escolha corrente e adequada ao diálogo informal; por si só, não indica falta de conhecimento.' },
    commonMistake: 'Chamar toda variante diferente do registro formal de “erro” sem analisar contexto e intenção.',
    check: { question: 'Qual atitude evita preconceito linguístico?', options: ['Considerar uma região incapaz por sua fala', 'Analisar a adequação da variedade à situação', 'Exigir o mesmo registro em toda conversa'], correctIndex: 1, feedback: 'A adequação depende da situação de comunicação; variedades não definem a capacidade de seus falantes.' },
  },
  'Semântica, Coesão e Intertextualidade': {
    objective: 'Interpretar relações de sentido, referentes e diálogo entre textos.',
    explanation: [
      'Uma palavra pode adquirir sentidos diferentes conforme o contexto. Examine a frase e o gênero antes de escolher uma acepção.',
      'Conectivos e pronomes criam coesão: “porém” marca oposição; um pronome retoma um referente que precisa ser localizado.',
      'Intertextualidade ocorre quando um texto retoma outro. Paráfrase preserva a ideia central; paródia pode transformá-la com humor ou crítica.',
    ],
    example: { prompt: '“A campanha prometia economia. Porém, a conta aumentou.” O que “porém” faz?', steps: ['Leia a expectativa criada pela promessa de economia.', 'Compare-a ao aumento da conta, que contraria essa expectativa.'], answer: 'Marca oposição entre o que se esperava e o que ocorreu.' },
    commonMistake: 'Inferir o sentido de um conector isoladamente e ignorar as duas ideias que ele relaciona.',
    check: { question: 'Em “Joana comprou o livro e o leu ontem”, “o” retoma:', options: ['Joana', 'O livro', 'Ontem'], correctIndex: 1, feedback: 'O pronome substitui “o livro”, evitando repetir o nome do objeto lido.' },
  },
  'Comunicação Digital e Argumentação': {
    objective: 'Avaliar a confiabilidade de uma afirmação online e os recursos de persuasão usados para divulgá-la.',
    explanation: [
      'Mensagens digitais combinam texto, imagem, legenda e links. Leia esses elementos juntos: uma imagem pode ter sido publicada em outro contexto.',
      'Antes de compartilhar uma alegação, verifique autoria, data, fonte primária e se outras fontes independentes confirmam o fato.',
      'Números e depoimentos podem persuadir, mas não bastam sem contexto, método ou relação clara com a conclusão defendida.',
    ],
    example: { prompt: 'Uma postagem usa foto antiga para afirmar que um evento ocorreu hoje. Como verificar?', steps: ['Procure a origem e a data de publicação da imagem.', 'Compare a alegação com registros atuais e fontes independentes.', 'Separe o que a imagem mostra do que a legenda afirma.'], answer: 'A foto, sozinha, não comprova a data do evento; a legenda precisa de confirmação.' },
    commonMistake: 'Tomar curtidas ou aparência profissional como prova de veracidade.',
    check: { question: 'Qual dado é mais útil para verificar uma postagem sobre um fato recente?', options: ['Número de compartilhamentos', 'Fonte original e data do registro', 'Cor do layout'], correctIndex: 1, feedback: 'Origem e data ajudam a saber se o material sustenta a alegação no contexto correto.' },
  },
  'Vocabulário e Recursos Linguísticos em Inglês': {
    objective: 'Usar contexto, conectores e referentes para compreender inglês sem depender de tradução palavra por palavra.',
    explanation: [
      'Cognatos podem ajudar, mas falsos cognatos exigem cuidado: “actually” costuma significar “na verdade”, não “atualmente”.',
      'Conectores mostram relações: “although” introduz concessão; “because” apresenta causa. Leia também a oração seguinte.',
      'Pronomes como “they” e “it” retomam elementos do texto. Localize o referente para entender quem age ou sofre a ação.',
    ],
    example: { prompt: '“The store is small, although it serves many people.” Qual é a ideia?', steps: ['Leia “the store is small”: a loja é pequena.', 'Reconheça “although” como concessão e “it” como retomada de “the store”.'], answer: 'Embora pequena, a loja atende muitas pessoas.' },
    commonMistake: 'Traduzir “although” como causa e inverter a relação entre as ideias.',
    check: { question: 'Em “She is tired because she worked late”, “because” indica:', options: ['Causa', 'Contraste', 'Alternativa'], correctIndex: 0, feedback: 'Trabalhar até tarde explica o cansaço.' },
  },
  'Cultura e Discursos em Inglês': {
    objective: 'Relacionar escolhas de linguagem em inglês ao público, à cultura e à intenção social do texto.',
    explanation: [
      'Textos em inglês circulam em culturas diversas; não suponha que toda voz em inglês represente um único país.',
      'Em publicidade e campanhas, identifique quem fala, a quem se dirige e qual ação ou atitude busca estimular.',
      'Uma palavra ou imagem só ganha sentido completo no contexto. Compare slogan, fonte e situação social antes de inferir a mensagem.',
    ],
    example: { prompt: 'Uma campanha comunitária diz “Share the street”. A imagem mostra ciclistas e pedestres. Qual o apelo?', steps: ['Traduza o núcleo da frase: compartilhar a rua.', 'Relacione-o à imagem de diferentes usuários do espaço.'], answer: 'Incentivar convivência e respeito entre pessoas que usam a rua.' },
    commonMistake: 'Atribuir ao texto uma opinião sobre todos os falantes de inglês sem evidência no material.',
    check: { question: 'Em um anúncio, por que identificar o público-alvo?', options: ['Para ignorar a imagem', 'Para interpretar o apelo e as escolhas de linguagem', 'Para presumir que o inglês tem uma cultura única'], correctIndex: 1, feedback: 'Público e finalidade explicam como o texto tenta produzir um efeito.' },
  },
  'Leitura e Inferência em Espanhol': {
    objective: 'Inferir a ideia central de um texto em espanhol usando título, contexto e pistas internas.',
    explanation: [
      'Leia primeiro título, fonte e comando. O objetivo é compreender a mensagem, não traduzir todas as palavras.',
      'Diferencie informação explícita de inferência: esta precisa ser sustentada por elementos do texto.',
      'Conectores como “sin embargo” indicam contraste; observe as ideias ligadas por eles antes de responder.',
    ],
    example: { prompt: '“El museo es pequeño. Sin embargo, recibe miles de visitantes.” O que se conclui?', steps: ['Identifique as duas informações: tamanho pequeno e muitos visitantes.', 'Interprete “sin embargo” como marca de contraste.'], answer: 'O museu recebe muitos visitantes apesar de ser pequeno.' },
    commonMistake: 'Tratar o contraste como se a segunda frase explicasse a causa da primeira.',
    check: { question: 'Em “La entrada es gratis; por eso, muchas personas visitan el museo”, “por eso” indica:', options: ['Consequência', 'Oposição', 'Dúvida'], correctIndex: 0, feedback: 'A gratuidade é apresentada como razão para o grande número de visitantes.' },
  },
  'Vocabulário e Recursos Linguísticos em Espanhol': {
    objective: 'Interpretar falsos cognatos, conectores e pronomes em frases reais de espanhol.',
    explanation: [
      'Semelhança gráfica não garante mesmo sentido: “embarazada” significa grávida, não “embaraçada”. Confirme pelo contexto.',
      'Conectores marcam relações argumentativas: “pero” opõe ideias; “porque” apresenta causa.',
      'Pronomes e formas verbais indicam participantes e tempo da ação; relacione-os às frases próximas antes de traduzir.',
    ],
    example: { prompt: '“Lucía está embarazada y espera a su bebé.” O que significa “embarazada”?', steps: ['Observe a pista “espera a su bebé”.', 'Relacione a pista à situação de gestação, descartando a aparência com “embaraçada”.'], answer: 'Grávida.' },
    commonMistake: 'Escolher automaticamente a palavra parecida em português sem conferir o restante da frase.',
    check: { question: 'Em “Quería salir, pero llovía”, “pero” expressa:', options: ['Contraste', 'Causa', 'Finalidade'], correctIndex: 0, feedback: 'A chuva contrasta com a vontade de sair.' },
  },
  'Cultura e Discursos em Espanhol': {
    objective: 'Ler textos em espanhol considerando diversidade cultural, autoria e contexto social.',
    explanation: [
      'O espanhol é usado em diferentes países e comunidades, com variedades próprias. Não reduza identidades latino-americanas a uma cultura única.',
      'Em cartazes, poemas e notícias, observe quem se expressa e qual situação social é representada.',
      'Uma crítica cultural pode aparecer em imagens, ironia ou escolhas de voz. Sustente sua interpretação em pistas concretas do texto.',
    ],
    example: { prompt: 'Um cartaz diz “Nuestras lenguas, nuestra memoria” e mostra falantes de línguas indígenas. Qual é a mensagem?', steps: ['Identifique a associação entre línguas e memória coletiva.', 'Relacione a imagem aos grupos representados, sem supor que falem todos a mesma língua.'], answer: 'Valorizar línguas indígenas como parte da memória e identidade das comunidades.' },
    commonMistake: 'Supor que todos os povos hispano-americanos têm uma única língua, história ou identidade.',
    check: { question: 'Para interpretar uma campanha cultural, qual pergunta é mais pertinente?', options: ['Quem fala e quais grupos são representados?', 'Qual país fala o espanhol “correto”?', 'Todas as culturas da região são iguais?'], correctIndex: 0, feedback: 'Autoria e representação ajudam a entender a posição expressa pela campanha.' },
  },
  'Artes Visuais e Linguagens Artísticas': {
    objective: 'Analisar como composição, enquadramento e materiais produzem sentido em uma imagem.',
    explanation: [
      'Observe o que aparece em primeiro plano, os contrastes, as cores e a direção do olhar. Esses elementos orientam a atenção do público.',
      'Fotografia, pintura e arte digital têm recursos e contextos de produção diferentes; nenhum suporte garante neutralidade.',
      'Interprete a relação entre escolhas formais e tema, evitando atribuir intenção sem pistas na obra ou em seu contexto.',
    ],
    example: { prompt: 'Uma fotografia mostra uma pessoa pequena diante de edifícios enormes. Que efeito o enquadramento pode criar?', steps: ['Compare a escala da pessoa e dos prédios.', 'Observe como a composição enfatiza o espaço urbano em relação à figura humana.'], answer: 'Pode sugerir a dimensão da cidade e a sensação de pequenez da pessoa diante dela; a interpretação depende do contexto.' },
    commonMistake: 'Dizer que toda cor ou forma tem um significado fixo, independente da obra.',
    check: { question: 'Ao analisar uma fotografia, qual elemento ajuda a entender o destaque dado a uma personagem?', options: ['Enquadramento e posição no quadro', 'Apenas o preço da câmera', 'Somente a data de nascimento do autor'], correctIndex: 0, feedback: 'Enquadramento e posição orientam o olhar e podem enfatizar uma personagem.' },
  },
  'Música, Teatro e Dança': {
    objective: 'Relacionar ritmo, corpo, espaço e interpretação ao sentido de uma performance.',
    explanation: [
      'Na música, ritmo organiza durações e acentos; timbre distingue sonoridades. Música não se reduz à letra da canção.',
      'No teatro, gesto, voz, cenário e relação com o público participam da construção da cena.',
      'Na dança, movimentos, pausas e uso do espaço podem comunicar ideias sem uma narrativa verbal obrigatória.',
    ],
    example: { prompt: 'Uma cena teatral usa silêncio prolongado enquanto atores se afastam. O que analisar?', steps: ['Observe o silêncio como escolha expressiva, não como ausência de linguagem.', 'Relacione a distância entre os corpos à relação representada na cena.'], answer: 'Silêncio e deslocamento podem construir tensão ou afastamento entre personagens, conforme o contexto.' },
    commonMistake: 'Interpretar uma performance somente pelo texto falado e ignorar som, gesto e espaço.',
    check: { question: 'Qual elemento pode produzir sentido em uma dança sem palavras?', options: ['Movimentos e ocupação do espaço', 'Somente o título escrito', 'A ausência de qualquer escolha corporal'], correctIndex: 0, feedback: 'Movimentos e relações espaciais são recursos centrais da linguagem da dança.' },
  },
  'Patrimônio, Diversidade e Arte Brasileira': {
    objective: 'Distinguir patrimônio material e imaterial e reconhecer a diversidade de produções artísticas brasileiras.',
    explanation: [
      'Patrimônio material inclui bens físicos, como edifícios e objetos; imaterial envolve práticas e saberes transmitidos socialmente.',
      'Uma prática cultural não precisa ser antiga nem imóvel para ter valor. Considere as comunidades que a produzem e mantêm.',
      'A arte brasileira resulta de múltiplas matrizes e transformações históricas. Evite apresentar produções indígenas ou afro-brasileiras como uma única tradição homogênea.',
    ],
    example: { prompt: 'Uma comunidade mantém uma celebração com cantos e técnicas transmitidos entre gerações. O que pode ser preservado?', steps: ['Identifique a prática e os saberes compartilhados.', 'Diferencie a celebração dos objetos físicos usados nela.'], answer: 'Os saberes e a celebração podem integrar o patrimônio imaterial; objetos associados podem também ter valor material.' },
    commonMistake: 'Achar que só monumentos e museus são patrimônio cultural.',
    check: { question: 'Qual exemplo representa patrimônio imaterial?', options: ['Uma prática de canto transmitida pela comunidade', 'Um prédio histórico considerado apenas como estrutura física', 'Uma pedra sem vínculo cultural'], correctIndex: 0, feedback: 'A prática e os saberes transmitidos são bens culturais imateriais.' },
  },
  'Cultura Corporal, Jogos e Esportes': {
    objective: 'Reconhecer jogos e esportes como práticas culturais com regras e formas de participação.',
    explanation: [
      'Práticas corporais são construídas socialmente: regras, espaços e significados mudam entre grupos e épocas.',
      'Em jogos, cooperação e oposição podem coexistir. Observe o objetivo da prática antes de reduzi-la à competição.',
      'Uma regra adaptada pode ampliar a participação sem apagar o sentido da atividade; avalie quem participa e quais barreiras são removidas.',
    ],
    example: { prompt: 'Uma turma modifica um jogo para que todos possam receber a bola antes da pontuação. O que mudou?', steps: ['Identifique a nova regra: circulação da bola entre participantes.', 'Relacione a regra ao aumento de oportunidades de participação.'], answer: 'O jogo preserva uma meta coletiva, mas passa a favorecer a participação de mais pessoas.' },
    commonMistake: 'Tratar as regras esportivas como naturais e imutáveis em qualquer contexto.',
    check: { question: 'Por que uma turma pode adaptar regras de um jogo?', options: ['Para ampliar a participação e adequar a prática ao grupo', 'Porque toda regra deixa de existir', 'Para impedir qualquer cooperação'], correctIndex: 0, feedback: 'A adaptação pode reduzir barreiras e manter objetivos compreensíveis para o grupo.' },
  },
  'Corpo, Saúde e Atividade Física': {
    objective: 'Distinguir atividade física, exercício planejado e fatores sociais que influenciam a saúde.',
    explanation: [
      'Atividade física inclui movimentos do cotidiano que elevam o gasto energético; exercício é uma atividade planejada e repetida com objetivo definido.',
      'Benefícios e riscos dependem de intensidade, condições pessoais e acesso a ambientes seguros. Não existe prescrição única válida para todos.',
      'Saúde não se resume a aparência corporal ou decisão individual: trabalho, renda, lazer e infraestrutura também influenciam as possibilidades de cuidado.',
    ],
    example: { prompt: 'Uma pessoa caminha para ir ao trabalho; outra segue uma rotina planejada de caminhada. Como classificar?', steps: ['Reconheça que ambas realizam atividade física.', 'Observe que a segunda segue planejamento e repetição com objetivo específico.'], answer: 'Ambas se movimentam; a caminhada planejada também é exercício físico.' },
    commonMistake: 'Supor que um corpo com determinada aparência comprova boa saúde ou falta de atividade física.',
    check: { question: 'Qual afirmação distingue corretamente exercício de atividade física?', options: ['Todo movimento cotidiano é exercício planejado', 'Exercício é atividade física planejada e estruturada', 'Atividade física só ocorre em academias'], correctIndex: 1, feedback: 'Exercício é um subconjunto planejado e estruturado das atividades físicas.' },
  },
  'Inclusão, Mídia e Práticas Corporais': {
    objective: 'Analisar barreiras à participação em práticas corporais e representações midiáticas do corpo.',
    explanation: [
      'Inclusão exige observar barreiras físicas, comunicacionais e sociais, além de oferecer condições concretas de participação.',
      'Esporte adaptado não é uma versão inferior: regras e equipamentos podem ser ajustados às características da modalidade e dos participantes.',
      'Imagens midiáticas frequentemente selecionam corpos e desempenhos. Questione quem aparece, quem fica de fora e quais interesses comerciais são promovidos.',
    ],
    example: { prompt: 'Um evento esportivo tem quadra acessível, mas divulga informações só em formato não acessível. Está plenamente inclusivo?', steps: ['Reconheça a remoção de uma barreira física.', 'Identifique a barreira de comunicação que ainda impede parte do público de participar.'], answer: 'Não. A inclusão também requer informação acessível, além do espaço físico.' },
    commonMistake: 'Achar que uma única adaptação resolve todas as barreiras de participação.',
    check: { question: 'Qual medida amplia a inclusão em uma prática corporal?', options: ['Oferecer comunicação acessível e ajustar barreiras do espaço', 'Divulgar apenas um padrão corporal', 'Impedir ajustes nas regras'], correctIndex: 0, feedback: 'Acesso à informação e ao espaço são condições para participação efetiva.' },
  },
}
