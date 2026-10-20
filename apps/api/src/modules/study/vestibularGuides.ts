import type { StudyGuide } from './guides'

export const vestibularGuides: Record<string, StudyGuide> = {
  'Gramática Contextualizada': {
    objective: 'Explicar o efeito de uma escolha sintática no sentido de um enunciado.',
    explanation: [
      'Uma análise gramatical começa pelo trecho completo. A mesma palavra pode exercer funções distintas conforme as relações que estabelece com as outras palavras.',
      'Orações introduzidas por embora, ainda que ou mesmo que exprimem concessão: apresentam uma circunstância que poderia impedir o fato principal, mas não o impede.',
      'Na FUVEST, identificar a classificação é só parte da tarefa. Relacione a construção ao contraste ou à ênfase produzidos no texto.',
    ],
    example: { prompt: 'Em “Embora chovesse, a feira abriu”, que relação há entre as orações?', steps: ['Localize o conectivo embora e o fato principal: a feira abriu.', 'A chuva seria um obstáculo esperado; a abertura ocorreu apesar dela.'], answer: 'A oração inicial exprime concessão, destacando que a chuva não impediu a abertura.' },
    commonMistake: 'Chamar toda oração iniciada por conectivo de causa. Teste se ela explica o fato ou contraria uma expectativa.',
    check: { question: 'Em “Apesar do atraso, ele compareceu”, a expressão inicial indica:', options: ['Concessão', 'Finalidade', 'Consequência'], correctIndex: 0, feedback: 'O atraso poderia impedir a presença, mas ele compareceu; há concessão.' },
  },
  'Literatura Portuguesa e Brasileira': {
    objective: 'Interpretar a voz narrativa e os efeitos de linguagem em uma obra, sem reduzir a leitura a rótulos de época.',
    explanation: [
      'Identifique quem enuncia, quem observa e o que cada personagem sabe. Narrador e autor não são equivalentes: a voz narrativa é uma construção da obra.',
      'Uma passagem pode dialogar com seu contexto histórico por meio da ironia, da escolha vocabular ou do conflito entre personagens. Observe primeiro as marcas do trecho.',
      'Nas leituras exigidas pela FUVEST, relacione a passagem ao conjunto da obra, mas fundamente a resposta nos elementos efetivamente presentes no excerto.',
    ],
    example: { prompt: 'Um narrador chama a personagem de generosa e logo informa que ela nunca repartia seus bens. Como ler essa tensão?', steps: ['Compare o elogio com a ação descrita: as informações se contradizem.', 'Considere que o elogio literal pode expor, por contraste, a avareza da personagem.'], answer: 'O elogio pode ser irônico; a interpretação depende do contraste construído no trecho.' },
    commonMistake: 'Atribuir ao autor toda opinião expressa pelo narrador ou escolher uma escola literária sem analisar o excerto.',
    check: { question: 'O narrador elogia uma atitude e descreve fatos que a desmentem. Qual recurso é provável?', options: ['Ironia', 'Enumeração neutra', 'Definição técnica'], correctIndex: 0, feedback: 'A contradição entre elogio e fatos pode produzir ironia.' },
  },
  'Geometria Analítica': {
    objective: 'Calcular a inclinação de uma reta a partir de dois pontos do plano cartesiano.',
    explanation: [
      'Um ponto é representado pelo par ordenado (x, y). Verifique a ordem das coordenadas antes de usar os valores em uma fórmula.',
      'Para dois pontos com x diferentes, o coeficiente angular é a variação de y dividida pela variação de x: m = (y2 - y1)/(x2 - x1).',
      'A inclinação positiva indica que y aumenta quando x aumenta. Se os dois valores de x são iguais, a reta é vertical e o coeficiente angular não é definido.',
    ],
    example: { prompt: 'Qual é a inclinação da reta que passa por (1, 2) e (3, 8)?', steps: ['Calcule a variação vertical: 8 - 2 = 6; a horizontal: 3 - 1 = 2.', 'Divida 6 por 2 e interprete o resultado como variação de y por unidade de x.'], answer: 'm = 3.' },
    commonMistake: 'Inverter apenas uma das subtrações; mantenha a mesma ordem dos pontos no numerador e no denominador.',
    check: { question: 'A reta que passa por (0, 1) e (2, 5) tem coeficiente angular:', options: ['2', '4', '1/2'], correctIndex: 0, feedback: '(5 - 1)/(2 - 0) = 4/2 = 2.' },
  },
  Trigonometria: {
    objective: 'Escolher seno, cosseno ou tangente conforme os lados de um triângulo retângulo.',
    explanation: [
      'Para um ângulo agudo, identifique primeiro a hipotenusa, sempre oposta ao ângulo reto. Os catetos oposto e adjacente dependem do ângulo escolhido.',
      'Seno é oposto/hipotenusa; cosseno é adjacente/hipotenusa; tangente é oposto/adjacente. Desenhar e marcar o ângulo evita trocar lados.',
      'Essas razões relacionam lados de triângulos retângulos semelhantes. Não aplique diretamente a razão a um triângulo sem ângulo reto.',
    ],
    example: { prompt: 'Num triângulo retângulo, em relação a um ângulo agudo, o cateto oposto mede 3 e o adjacente mede 4. Qual é a tangente?', steps: ['Associe os lados conhecidos à definição: tangente = oposto/adjacente.', 'Substitua as medidas: 3/4.'], answer: 'A tangente do ângulo é 3/4.' },
    commonMistake: 'Tratar “oposto” e “adjacente” como propriedades fixas do lado, sem observar qual ângulo está em questão.',
    check: { question: 'Cateto oposto 5 e hipotenusa 13: qual é o seno do ângulo?', options: ['5/13', '13/5', '5/12'], correctIndex: 0, feedback: 'Seno é a razão entre cateto oposto e hipotenusa: 5/13.' },
  },
  'Estrutura Dissertativa-Argumentativa': {
    objective: 'Organizar uma tese e parágrafos que a sustentem com razões verificáveis.',
    explanation: [
      'Uma dissertação argumentativa defende uma posição sobre uma questão. A introdução delimita o problema e apresenta uma tese discutível, não apenas anuncia o assunto.',
      'Cada desenvolvimento precisa de uma ideia principal, uma justificativa e sua ligação explícita com a tese. Evidências e exemplos devem ser interpretados, não apenas citados.',
      'A conclusão retoma o percurso argumentativo sem introduzir uma causa nova que não foi examinada no texto.',
    ],
    example: { prompt: 'Tema: preservação de bibliotecas de bairro. Como formular tese e um eixo de desenvolvimento?', steps: ['Defina uma posição: bibliotecas de bairro devem ser preservadas.', 'Escolha uma razão: elas oferecem acesso local a livros e espaços de estudo; explique por que isso sustenta a posição.'], answer: 'Tese possível: preservar bibliotecas de bairro amplia o acesso comunitário à leitura e ao estudo.' },
    commonMistake: 'Abrir cada parágrafo com um tema solto e não demonstrar como ele sustenta a tese.',
    check: { question: 'Qual frase apresenta uma tese argumentativa?', options: ['Existem bibliotecas em várias cidades.', 'Bibliotecas de bairro devem ser mantidas porque ampliam o acesso à leitura.', 'Biblioteca é uma palavra de origem antiga.'], correctIndex: 1, feedback: 'A segunda frase toma posição e oferece uma razão que pode ser desenvolvida.' },
  },
  'Coesão e Coerência': {
    objective: 'Escolher conectivos compatíveis com a relação lógica entre ideias.',
    explanation: [
      'Coesão diz respeito aos mecanismos que ligam partes do texto, como pronomes, retomadas vocabulares e conectivos. Coerência envolve a compatibilidade e a progressão das ideias.',
      '“Portanto” introduz conclusão; “porém” indica contraste; “porque” apresenta causa ou explicação. Um conectivo inadequado pode alterar o argumento.',
      'Ao revisar, pergunte a que termo cada pronome se refere e se a frase seguinte acrescenta, contradiz ou conclui a anterior.',
    ],
    example: { prompt: 'Complete: “A praça recebe muitos visitantes; ___, precisa de manutenção frequente.”', steps: ['Identifique a relação: o uso intenso justifica a necessidade de manutenção.', 'Escolha um conectivo conclusivo em vez de um adversativo.'], answer: '“Portanto” mantém a relação de conclusão: a praça recebe visitantes; portanto, precisa de manutenção.' },
    commonMistake: 'Inserir conectivos apenas para variar o vocabulário, sem verificar a relação lógica que eles estabelecem.',
    check: { question: '“O projeto era caro; ___, foi aprovado.” Qual conectivo marca contraste?', options: ['Porém', 'Porque', 'Logo'], correctIndex: 0, feedback: '“Porém” contrasta o custo elevado com a aprovação.' },
  },
  'Proposta de Intervenção': {
    objective: 'Formular uma medida coerente com o problema e identificar quem pode executá-la.',
    explanation: [
      'Uma proposta de intervenção precisa responder ao problema discutido. Declare a ação, o agente responsável, o meio de execução e o efeito esperado quando a tarefa pedir esse detalhamento.',
      'A medida deve ser plausível e respeitar direitos. Não basta escrever que “o governo deve resolver tudo”: indique qual esfera ou instituição tem atribuição pertinente.',
      'Na redação da FUVEST, siga antes de tudo o comando efetivo da proposta e a estrutura solicitada; uma solução não substitui argumentação nem deve ser acrescentada mecanicamente.',
    ],
    example: { prompt: 'Problema: pouco acesso a livros em um bairro sem biblioteca. Que medida é concreta?', steps: ['Associe um agente à ação: a prefeitura pode criar um ponto público de empréstimo.', 'Defina um meio: usar um equipamento municipal existente e formar acervo por compra e doação criteriosamente selecionada.'], answer: 'A prefeitura pode instalar um ponto de empréstimo em equipamento municipal, com acervo e atendimento regular, para ampliar o acesso local.' },
    commonMistake: 'Propor uma campanha vaga sem responsável, local, modo de execução ou relação com o problema demonstrado.',
    check: { question: 'Qual proposta é mais operacional para ampliar o acesso local a livros?', options: ['Todos precisam ler mais.', 'A prefeitura deve instalar um ponto de empréstimo no centro comunitário.', 'O problema desaparecera sozinho.'], correctIndex: 1, feedback: 'A segunda alternativa identifica agente, ação e local, permitindo avaliar a execução.' },
  },
  'Política e Economia Brasileira': {
    objective: 'Distinguir indicadores econômicos de decisões políticas ao interpretar uma notícia brasileira.',
    explanation: [
      'Inflação mede a variação de preços em um período; taxa de juros é o custo do crédito em certas operações. A elevação de uma não significa automaticamente a mesma variação da outra.',
      'Ao ler uma notícia, identifique data, instituição responsável e indicador citado. Uma porcentagem pode representar taxa, variação ou participação, e cada uso responde a pergunta diferente.',
      'Políticas públicas envolvem escolhas e competências de instituições específicas. Separe a medida anunciada de seus objetivos declarados e de seus efeitos observados.',
    ],
    example: { prompt: 'Um índice de preços sobe 4% em um ano. Isso significa que todos os produtos ficaram 4% mais caros?', steps: ['Reconheça que o índice agrega preços de uma cesta com pesos distintos.', 'Compare o resultado agregado com a variação individual: produtos podem subir, cair ou ficar estáveis em taxas diferentes.'], answer: 'Não. O índice resume uma cesta; a variação de cada produto pode ser diferente.' },
    commonMistake: 'Tratar uma média ou índice agregado como se descrevesse igualmente cada família ou produto.',
    check: { question: 'Um índice de inflação mede diretamente:', options: ['Variação de preços de uma cesta definida', 'Renda idêntica de todas as famílias', 'Quantidade de votos em uma eleição'], correctIndex: 0, feedback: 'O índice agrega variações de preços segundo metodologia e pesos definidos.' },
  },
  'Cenário Internacional': {
    objective: 'Analisar uma questão internacional distinguindo atores, interesses e fontes.',
    explanation: [
      'Estados, organizações internacionais e grupos sociais não desempenham o mesmo papel. Descubra quem toma a decisão e quem é afetado antes de atribuir responsabilidades.',
      'A ONU reúne Estados e atua por órgãos com competências diferentes. Uma resolução da Assembleia Geral não deve ser confundida com uma decisão do Conselho de Segurança.',
      'Questões internacionais mudam com o tempo. Verifique a data da notícia ou do mapa e evite transformar uma posição oficial em descrição neutra dos fatos.',
    ],
    example: { prompt: 'Uma notícia informa que a Assembleia Geral da ONU aprovou uma resolução recomendando cooperação. Isso obriga automaticamente todos os países a executar a recomendação?', steps: ['Identifique o órgão citado: Assembleia Geral.', 'Observe o verbo “recomendando” e distinga a manifestação política de uma obrigação automática.'], answer: 'Não. Uma recomendação da Assembleia Geral não impõe, por si só, execução automática a todos os Estados.' },
    commonMistake: 'Falar da ONU como um ator único e atribuir a todos os seus órgãos os mesmos poderes.',
    check: { question: 'Ao comparar duas notícias sobre um conflito, qual informação ajuda a situar cada relato?', options: ['Data e fonte da publicação', 'Tamanho da manchete', 'Cor do site'], correctIndex: 0, feedback: 'Data e fonte permitem reconhecer o contexto temporal e a perspectiva do relato.' },
  },
  'Cultura e Sociedade': {
    objective: 'Relacionar uma prática cultural ao seu contexto social sem hierarquizar grupos.',
    explanation: [
      'Práticas culturais são aprendidas e transformadas historicamente. Música, linguagem, alimentação e festas podem expressar pertencimentos distintos dentro de uma mesma sociedade.',
      'Diversidade cultural não significa ausência de conflitos: grupos podem ter visibilidade e acesso desiguais a meios de produção e circulação cultural.',
      'Ao analisar dados ou textos, diferencie a descrição de uma prática da avaliação moral feita sobre ela. Uma prática diferente da sua não é, por isso, inferior.',
    ],
    example: { prompt: 'Uma reportagem chama uma variedade regional de fala de “erro” por diferir da norma-padrão. Que pressuposto deve ser examinado?', steps: ['Distinga a variedade usada em uma comunidade da norma exigida em determinados contextos formais.', 'Identifique o julgamento de valor que transforma diferença linguística em suposta incapacidade.'], answer: 'A reportagem pode reproduzir preconceito linguístico ao confundir variação com falta de linguagem.' },
    commonMistake: 'Confundir o ensino da norma-padrão com a desvalorização de outras variedades culturais e linguísticas.',
    check: { question: 'Duas comunidades celebram a mesma data de maneiras diferentes. Isso evidencia:', options: ['Diversidade de práticas culturais', 'Ausência de cultura em uma delas', 'Erro obrigatório de uma tradição'], correctIndex: 0, feedback: 'Práticas diferentes podem ter sentidos próprios em cada contexto social.' },
  },
  'Argumentação e Refutação': {
    objective: 'Construir uma refutação que responda ao argumento contrário sem distorcê-lo.',
    explanation: [
      'Argumentar é apresentar uma posição sustentada por razões. Para refutar, identifique exatamente a tese contrária e a premissa que pretende questionar.',
      'Uma objeção forte pode reconhecer uma vantagem parcial do outro lado e mostrar por que ela não resolve o problema central. Dados ou exemplos precisam estar ligados ao raciocínio.',
      'Na redação da UNICAMP, adapte a argumentação ao gênero e ao interlocutor pedidos; uma resposta a um leitor específico difere de uma dissertação impessoal.',
    ],
    example: { prompt: 'Afirmação: “Uma biblioteca digital dispensa toda biblioteca física”. Como refutar sem negar as vantagens digitais?', steps: ['Reconheça que o acesso digital pode ampliar o acervo disponível.', 'Aponte a premissa limitada: nem todos dispõem de conexão e espaço de estudo; bibliotecas físicas também oferecem esses serviços.'], answer: 'O acervo digital amplia opções, mas não substitui integralmente o acesso público à internet, aos livros físicos e ao espaço de estudo.' },
    commonMistake: 'Atacar uma versão exagerada da opinião contrária em vez de responder ao argumento realmente apresentado.',
    check: { question: 'Qual resposta refuta melhor “aulas remotas dispensam qualquer encontro presencial”?', options: ['Tecnologia é sempre ruim.', 'Aulas remotas ajudam, mas certas atividades práticas exigem espaço e equipamento presencial.', 'Todo mundo concorda com isso.'], correctIndex: 1, feedback: 'A segunda resposta reconhece uma vantagem e contesta a conclusão absoluta com uma razão pertinente.' },
  },
  'Adequação ao Tema': {
    objective: 'Delimitar o recorte de uma proposta e manter a produção textual pertinente a ele.',
    explanation: [
      'Leia separadamente o tema, a situação de produção, o gênero e o destinatário. Os textos motivadores fornecem perspectivas, mas não autorizam copiar passagens como argumento próprio.',
      'Transforme o comando em uma pergunta: sobre qual problema exatamente devo me posicionar ou informar? Essa pergunta ajuda a selecionar exemplos pertinentes.',
      'Revise cada parágrafo verificando se contribui para a finalidade solicitada. Um texto bem escrito ainda pode fugir parcialmente ao tema se responder a outra questão.',
    ],
    example: { prompt: 'Proposta: escrever carta aos moradores sobre descarte de lixo na praça. Um parágrafo só sobre reciclagem industrial é suficiente?', steps: ['Localize o recorte: descarte na praça e moradores como destinatários.', 'Avalie a relação do parágrafo com o comportamento e as soluções locais exigidos pela carta.'], answer: 'Não, salvo se o assunto for explicitamente ligado ao descarte na praça; isolado, ele desvia do recorte.' },
    commonMistake: 'Tomar uma palavra dos textos motivadores como tema inteiro e ignorar destinatário, gênero ou problema delimitado.',
    check: { question: 'Para uma carta aos moradores sobre lixo na praça, qual enfoque é mais pertinente?', options: ['A história de toda a indústria mundial', 'Hábitos de descarte na praça e medidas possíveis no bairro', 'A definição abstrata de qualquer cidade'], correctIndex: 1, feedback: 'A segunda opção mantém problema, espaço e interlocutor da proposta.' },
  },
  'Variação Linguística': {
    objective: 'Reconhecer variedades linguísticas e adequação ao contexto sem reproduzir preconceito.',
    explanation: [
      'A língua varia entre regiões, grupos, gerações e situações de uso. Uma variedade popular possui regularidades próprias; não é ausência de regras.',
      'A norma-padrão é importante em contextos que a exigem, como certos documentos e provas. Adequação é escolher recursos conforme interlocutor e finalidade, não declarar uma comunidade superior.',
      'Em uma questão da UNICAMP, observe quem fala, para quem e em qual situação antes de avaliar o efeito de uma forma linguística.',
    ],
    example: { prompt: 'Uma mensagem entre amigos usa abreviações; um edital público evita abreviações. Por quê?', steps: ['Identifique os interlocutores e a finalidade de cada texto.', 'Relacione a informalidade da conversa à exigência de clareza e padronização no edital.'], answer: 'Os registros se adequam a situações comunicativas diferentes; a conversa informal não demonstra incapacidade linguística.' },
    commonMistake: 'Classificar uma variedade como inferior apenas por não seguir a norma-padrão escrita.',
    check: { question: 'O uso de abreviações em mensagem pessoal mostra necessariamente:', options: ['Adequação possível ao contexto informal', 'Desconhecimento completo da língua', 'Obrigação de usar as mesmas formas em um edital'], correctIndex: 0, feedback: 'A escolha do registro depende de interlocutores, finalidade e situação.' },
  },
  Intertextualidade: {
    objective: 'Identificar como um texto retoma outro e que efeito essa retomada produz.',
    explanation: [
      'Intertextualidade ocorre quando um texto evoca outro por citação, alusão, paráfrase ou paródia. Reconhecer a fonte ajuda, mas o sentido depende também da nova situação.',
      'A paráfrase reformula mantendo uma ideia central; a paródia transforma o texto anterior, frequentemente para produzir contraste ou crítica.',
      'Compare o que foi conservado e o que mudou: palavras, cenário, voz e finalidade. A mesma frase pode ganhar sentido diferente em outro gênero.',
    ],
    example: { prompt: 'Um anúncio troca “ser ou não ser” por “reciclar ou não reciclar”. O que faz?', steps: ['Reconheça a estrutura verbal conhecida que foi retomada.', 'Observe a substituição do conflito existencial por uma escolha ambiental.'], answer: 'Faz uma alusão transformada para chamar atenção ao tema da reciclagem.' },
    commonMistake: 'Dizer apenas de qual obra veio a referência e não explicar seu efeito no texto novo.',
    check: { question: 'Ao retomar uma frase conhecida e mudar palavras para criticar um problema, o texto pode produzir:', options: ['Paródia ou alusão crítica', 'Uma cópia sem novo sentido', 'Uma operação matemática'], correctIndex: 0, feedback: 'A transformação de uma referência conhecida pode criar efeito crítico no novo contexto.' },
  },
  'Conjuntos e Funções': {
    objective: 'Determinar domínio e imagem de uma função a partir de uma regra simples.',
    explanation: [
      'O domínio reúne os valores de entrada permitidos; a imagem reúne os resultados realmente obtidos. Não confunda imagem com contradomínio, que pode conter valores não atingidos.',
      'Em funções reais com frações, o denominador não pode ser zero. Em uma raiz quadrada real, o radicando não pode ser negativo.',
      'Antes de desenhar um gráfico, examine essas restrições. Elas explicam por que certos pontos não pertencem à curva.',
    ],
    example: { prompt: 'Qual é o domínio real de f(x) = 1/(x - 2)?', steps: ['Imponha denominador diferente de zero: x - 2 ≠ 0.', 'Resolva a restrição: x ≠ 2.'], answer: 'Todos os números reais, exceto 2.' },
    commonMistake: 'Tratar o número excluído do domínio como um valor de saída da função.',
    check: { question: 'Qual valor não pertence ao domínio real de g(x) = 1/(x + 3)?', options: ['-3', '0', '3'], correctIndex: 0, feedback: 'Para x = -3, o denominador se torna zero e a divisão não é definida.' },
  },
  'Geometria e Trigonometria': {
    objective: 'Relacionar medidas geométricas a uma razão trigonométrica em um problema de altura.',
    explanation: [
      'Modele a situação desenhando um triângulo retângulo e marcando o ângulo dado. A altura procurada costuma ser o cateto oposto; a distância horizontal, o adjacente.',
      'A tangente do ângulo é oposto/adjacente. Se o observador está acima do solo, some sua altura apenas depois de calcular a diferença vertical indicada pelo triângulo.',
      'Verifique se todas as medidas estão na mesma unidade. Uma razão trigonométrica não tem unidade, mas a altura calculada tem.',
    ],
    example: { prompt: 'Uma pessoa observa o topo de um muro sob ângulo de 45°, a 6 m da base, com os olhos ao nível do chão. Qual a altura?', steps: ['No triângulo, altura é cateto oposto e 6 m é adjacente.', 'Use tan 45° = 1 = altura/6 e multiplique por 6.'], answer: 'O muro mede 6 m nesse modelo.' },
    commonMistake: 'Usar seno com a distância horizontal como se ela fosse a hipotenusa.',
    check: { question: 'Com tan θ = 1/2 e distância horizontal de 8 m, qual é a altura relativa ao observador?', options: ['4 m', '8 m', '16 m'], correctIndex: 0, feedback: 'Altura/8 = 1/2; logo, altura = 4 m.' },
  },
  'Combinatória e Probabilidade': {
    objective: 'Contar resultados sem repetição antes de calcular uma probabilidade.',
    explanation: [
      'Para escolhas sucessivas sem reposição, o número de opções diminui a cada etapa. O princípio multiplicativo conta sequências: multiplique as opções de cada escolha.',
      'Se a ordem não importa, cada grupo foi contado várias vezes nas sequências; use combinações ou elimine explicitamente as duplicatas.',
      'Probabilidade é casos favoráveis divididos pelo total, desde que os resultados considerados sejam equiprováveis. Declare a hipótese quando necessário.',
    ],
    example: { prompt: 'Entre 4 estudantes, quantas duplas distintas podem ser formadas?', steps: ['Conte as escolhas ordenadas: 4 opções para o primeiro e 3 para o segundo, total 12.', 'Cada dupla apareceu duas vezes, como AB e BA; divida 12 por 2.'], answer: 'Há 6 duplas distintas.' },
    commonMistake: 'Multiplicar 4 por 3 e esquecer que a ordem não diferencia uma dupla.',
    check: { question: 'De 3 pessoas, quantas duplas diferentes podem ser escolhidas?', options: ['3', '6', '9'], correctIndex: 0, feedback: 'As duplas são AB, AC e BC; AB e BA representam a mesma dupla.' },
  },
}
