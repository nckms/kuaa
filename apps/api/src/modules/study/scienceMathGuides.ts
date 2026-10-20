import type { StudyGuide } from './guides'

export const scienceMathGuides: Record<string, StudyGuide> = {
  'Progressões e Sequências': {
    objective: 'Reconhecer padrões e calcular termos de progressões aritméticas e geométricas.',
    explanation: [
      'Em uma progressão aritmética (PA), a diferença entre termos consecutivos é constante: aₙ = a₁ + (n − 1)r.',
      'Em uma progressão geométrica (PG), a razão entre termos consecutivos não nulos é constante: aₙ = a₁qⁿ⁻¹.',
      'Antes de aplicar uma fórmula, verifique se o padrão é aditivo ou multiplicativo e conte corretamente os intervalos entre os termos.',
    ],
    example: { prompt: 'Uma PA começa em 5 e cresce 3 a cada termo. Qual é o quinto termo?', steps: ['Entre o primeiro e o quinto termos há quatro aumentos.', 'Calcule 5 + 4 × 3 = 17.'], answer: 'O quinto termo é 17.' },
    commonMistake: 'Multiplicar a razão pelo número do termo em vez de pelo número de intervalos, que é n − 1.',
    check: { question: 'Na PG 2, 6, 18, qual é o quarto termo?', options: ['24', '54', '36'], correctIndex: 1, feedback: 'A razão é 3; logo, 18 × 3 = 54.' },
  },
  'Aritmética e Sistemas de Numeração': {
    objective: 'Operar com inteiros e frações e reconhecer relações de divisibilidade.',
    explanation: [
      'Uma fração representa uma parte de uma unidade: para somar frações, reescreva-as com denominador comum.',
      'A fatoração em primos ajuda a identificar divisores e a simplificar frações sem alterar seu valor.',
      'Na notação científica, escreva um número não nulo como a × 10ⁿ, com 1 ≤ |a| < 10.',
    ],
    example: { prompt: 'Quanto é 1/2 + 1/3?', steps: ['Use o denominador comum 6: 1/2 = 3/6 e 1/3 = 2/6.', 'Some os numeradores: 3/6 + 2/6 = 5/6.'], answer: '5/6.' },
    commonMistake: 'Somar denominadores diretamente: 1/2 + 1/3 não é 2/5.',
    check: { question: 'Qual é a escrita científica de 0,0042?', options: ['4,2 × 10⁻³', '42 × 10⁻³', '4,2 × 10³'], correctIndex: 0, feedback: 'Mover a vírgula três casas para a direita produz 4,2; por isso o expoente é −3.' },
  },
  'Grandezas, Medidas e Escalas': {
    objective: 'Converter unidades e interpretar escalas preservando a grandeza medida.',
    explanation: [
      'Comprimento, área e volume têm dimensões distintas: uma conversão linear por fator 10 corresponde a fator 100 na área e 1.000 no volume.',
      'A escala 1:n indica que uma unidade no desenho corresponde a n unidades da mesma espécie no objeto real.',
      'Escreva a unidade em cada etapa para verificar se a resposta final é coerente com a pergunta.',
    ],
    example: { prompt: 'Um mapa em escala 1:50.000 mostra 3 cm entre dois locais. Qual é a distância real?', steps: ['Multiplique 3 cm por 50.000: 150.000 cm.', 'Converta: 150.000 cm = 1.500 m = 1,5 km.'], answer: '1,5 km.' },
    commonMistake: 'Tratar 1 m² como 100 cm²; na verdade 1 m² = 10.000 cm².',
    check: { question: 'Uma superfície de 2 m² corresponde a quantos cm²?', options: ['200', '2.000', '20.000'], correctIndex: 2, feedback: '1 m = 100 cm, então 1 m² = 100² = 10.000 cm²; 2 m² = 20.000 cm².' },
  },
  'Trigonometria e Geometria Analítica': {
    objective: 'Relacionar razões trigonométricas de um triângulo retângulo a coordenadas no plano.',
    explanation: [
      'Em um triângulo retângulo, seno é cateto oposto/hipotenusa; cosseno é cateto adjacente/hipotenusa.',
      'A distância entre (x₁, y₁) e (x₂, y₂) é √[(x₂ − x₁)² + (y₂ − y₁)²], pelo teorema de Pitágoras.',
      'Desenhe e identifique o ângulo de referência antes de nomear catetos; oposto e adjacente dependem desse ângulo.',
    ],
    example: { prompt: 'Qual é a distância entre A(1, 2) e B(4, 6)?', steps: ['Calcule as diferenças: Δx = 3 e Δy = 4.', 'Aplique Pitágoras: d = √(3² + 4²) = √25.'], answer: '5 unidades.' },
    commonMistake: 'Somar Δx e Δy para obter distância em diagonal, ignorando Pitágoras.',
    check: { question: 'Em um triângulo retângulo, o cateto oposto mede 3 e a hipotenusa mede 5. Qual é o seno do ângulo?', options: ['3/5', '4/5', '5/3'], correctIndex: 0, feedback: 'Seno = cateto oposto/hipotenusa = 3/5.' },
  },
  'Álgebra e Análise Combinatória': {
    objective: 'Resolver equações simples e usar o princípio multiplicativo em contagens.',
    explanation: [
      'Uma equação preserva a igualdade quando a mesma operação válida é feita dos dois lados.',
      'Se uma escolha tem m possibilidades e a escolha seguinte, independente da primeira, tem n, há m × n pares possíveis.',
      'Em contagem, decida se a ordem importa e se há repetição antes de escolher uma fórmula de permutação ou combinação.',
    ],
    example: { prompt: 'Uma senha tem uma letra entre A, B e C seguida de um dígito de 0 a 9. Quantas senhas existem?', steps: ['Há 3 escolhas para a letra.', 'Há 10 escolhas para o dígito.', 'Multiplique 3 × 10.'], answer: '30 senhas distintas.' },
    commonMistake: 'Somar escolhas de etapas sucessivas; a soma serve para alternativas excludentes, não para formar pares.',
    check: { question: 'Quantos pares (camiseta, calça) podem ser formados com 4 camisetas e 2 calças?', options: ['6', '8', '16'], correctIndex: 1, feedback: 'Cada uma das 4 camisetas pode ser usada com 2 calças: 4 × 2 = 8.' },
  },
  'Termologia e Óptica': {
    objective: 'Distinguir temperatura de calor e interpretar a reflexão da luz.',
    explanation: [
      'Temperatura está relacionada ao estado térmico de um sistema; calor é energia transferida por diferença de temperatura.',
      'Na troca térmica espontânea entre corpos isolados, a energia flui do mais quente para o mais frio até o equilíbrio.',
      'Na reflexão especular, o ângulo de incidência é igual ao ângulo de reflexão, ambos medidos em relação à normal à superfície.',
    ],
    example: { prompt: 'Um raio chega a um espelho plano fazendo 30° com a normal. Qual é o ângulo de reflexão?', steps: ['O enunciado já mede a incidência em relação à normal: 30°.', 'Use a lei da reflexão: ângulo refletido igual ao incidente.'], answer: '30° em relação à normal.' },
    commonMistake: 'Medir o ângulo a partir da superfície do espelho; nessa situação ele seria 60°, não 30°.',
    check: { question: 'Dois corpos a 80 °C e 20 °C entram em contato. A transferência espontânea de calor ocorre:', options: ['Do de 80 °C para o de 20 °C', 'Do de 20 °C para o de 80 °C', 'Em nenhuma direção até ambos congelarem'], correctIndex: 0, feedback: 'Calor flui espontaneamente do corpo de maior temperatura para o de menor temperatura.' },
  },
  'Química Orgânica': {
    objective: 'Reconhecer funções orgânicas por grupos funcionais, não apenas pelo número de carbonos.',
    explanation: [
      'Álcoois apresentam grupo hidroxila (−OH) ligado a carbono saturado; ácidos carboxílicos apresentam o grupo −COOH.',
      'Moléculas com a mesma fórmula molecular podem ter estruturas diferentes (isomeria) e propriedades distintas.',
      'Leia toda a fórmula estrutural: a presença de oxigênio por si só não define a função orgânica.',
    ],
    example: { prompt: 'Qual função está presente em CH₃COOH?', steps: ['Identifique o grupo terminal −COOH.', 'Associe esse grupo à função ácido carboxílico.'], answer: 'Ácido carboxílico; CH₃COOH é o ácido etanoico.' },
    commonMistake: 'Classificar CH₃COOH como álcool por conter −OH, sem observar que o grupo faz parte de −COOH.',
    check: { question: 'O grupo −COOH caracteriza qual função?', options: ['Ácido carboxílico', 'Hidrocarboneto', 'Éter'], correctIndex: 0, feedback: 'O grupo carboxila (−COOH) caracteriza ácidos carboxílicos.' },
  },
  'Biologia Celular e Genética': {
    objective: 'Relacionar DNA, genes e divisão celular à transmissão de informação hereditária.',
    explanation: [
      'O DNA contém genes, mas uma característica pode depender de vários genes e do ambiente; genótipo não é sinônimo de fenótipo.',
      'A mitose produz, em geral, células-filhas com o mesmo número de cromossomos; a meiose reduz esse número na formação de gametas.',
      'Em cruzamentos simples, conte combinações possíveis de gametas; a proporção prevista não determina a sequência de nascimentos.',
    ],
    example: { prompt: 'Uma célula diploide com 8 cromossomos forma gametas por meiose. Quantos cromossomos terá cada gameta?', steps: ['Identifique o número diploide: 2n = 8.', 'A meiose produz células haploides: n = 8 ÷ 2.'], answer: '4 cromossomos por gameta, antes de qualquer fecundação.' },
    commonMistake: 'Afirmar que meiose e mitose sempre mantêm o mesmo número de cromossomos nas células resultantes.',
    check: { question: 'Uma célula 2n = 6 origina gametas com quantos cromossomos?', options: ['3', '6', '12'], correctIndex: 0, feedback: 'Gametas são haploides: n é metade de 2n, logo n = 3.' },
  },
  'Mecânica, Trabalho e Energia': {
    objective: 'Relacionar força, deslocamento e variação de energia em situações simples.',
    explanation: [
      'No modelo de Newton, força resultante igual a massa vezes aceleração; velocidade constante em linha reta implica força resultante nula.',
      'Para uma força constante paralela ao deslocamento, trabalho é W = Fd. Trabalho mede transferência de energia, em joules.',
      'Sem dissipação, a energia mecânica pode transformar-se entre cinética e potencial mantendo a soma constante.',
    ],
    example: { prompt: 'Uma força constante de 10 N desloca uma caixa 3 m na mesma direção. Qual é o trabalho dessa força?', steps: ['Confirme que força e deslocamento têm a mesma direção.', 'Calcule W = 10 N × 3 m = 30 N·m.'], answer: '30 J.' },
    commonMistake: 'Tratar qualquer força presente como força resultante ou atribuir trabalho positivo a força perpendicular ao deslocamento.',
    check: { question: 'Uma força de 5 N paralela a um deslocamento de 2 m realiza quanto trabalho?', options: ['2,5 J', '7 J', '10 J'], correctIndex: 2, feedback: 'W = Fd = 5 × 2 = 10 J.' },
  },
  'Gravitação, Estática e Fluidos': {
    objective: 'Calcular pressão e reconhecer as condições básicas de equilíbrio.',
    explanation: [
      'Pressão é força normal dividida pela área: p = F/A. A mesma força produz maior pressão quando aplicada sobre área menor.',
      'Em um fluido em repouso, a pressão aumenta com a profundidade; em água de densidade aproximadamente constante, Δp = ρgΔh.',
      'Equilíbrio estático exige força resultante e torque resultante nulos; uma dessas condições sozinha não basta.',
    ],
    example: { prompt: 'Uma força normal de 100 N atua sobre área de 0,5 m². Qual é a pressão média?', steps: ['Use p = F/A.', 'Divida 100 N por 0,5 m².'], answer: '200 Pa (N/m²).' },
    commonMistake: 'Multiplicar força pela área, invertendo a relação da pressão.',
    check: { question: 'A mesma força aplicada em metade da área produz pressão:', options: ['Metade da original', 'Igual à original', 'Duas vezes a original'], correctIndex: 2, feedback: 'Com F fixa, p = F/A; dividir A por 2 dobra p.' },
  },
  'Calor e Termodinâmica': {
    objective: 'Calcular calor sensível e distinguir aquecimento de mudança de estado.',
    explanation: [
      'Calor sensível varia a temperatura sem mudança de fase: Q = mcΔT, quando o calor específico pode ser considerado constante.',
      'Durante uma mudança de estado a pressão constante, pode haver transferência de energia sem variação de temperatura: Q = mL.',
      'O sinal de Q depende da convenção: se positivo para o sistema que recebe calor, o resfriamento tem Q negativo.',
    ],
    example: { prompt: 'Qual calor é necessário para aquecer 200 g de água de 20 °C a 30 °C? Use c = 1 cal/(g·°C).', steps: ['Calcule ΔT = 30 − 20 = 10 °C.', 'Aplique Q = mcΔT = 200 × 1 × 10.'], answer: '2.000 cal, supondo ausência de perdas e de mudança de fase.' },
    commonMistake: 'Usar a temperatura final no lugar de ΔT ou misturar gramas com calor específico expresso por quilograma.',
    check: { question: 'Para aquecer 50 g de água em 2 °C, com c = 1 cal/(g·°C), são necessárias:', options: ['25 cal', '52 cal', '100 cal'], correctIndex: 2, feedback: 'Q = 50 × 1 × 2 = 100 cal.' },
  },
  'Ondas, Som e Óptica': {
    objective: 'Relacionar frequência, comprimento de onda e velocidade de propagação.',
    explanation: [
      'Para uma onda periódica, v = λf: velocidade é comprimento de onda vezes frequência.',
      'Ao mudar de meio, a frequência é determinada pela fonte e permanece constante; velocidade e comprimento de onda podem mudar.',
      'Som é onda mecânica e requer meio material; luz pode propagar-se no vácuo.',
    ],
    example: { prompt: 'Uma onda tem comprimento de 2 m e frequência de 5 Hz. Qual é sua velocidade?', steps: ['Use v = λf.', 'Multiplique 2 m por 5 s⁻¹.'], answer: '10 m/s.' },
    commonMistake: 'Supor que todo tipo de onda precisa de ar para se propagar; a luz viaja no vácuo.',
    check: { question: 'Uma onda de 4 Hz viaja a 12 m/s. Qual é seu comprimento de onda?', options: ['3 m', '8 m', '48 m'], correctIndex: 0, feedback: 'λ = v/f = 12/4 = 3 m.' },
  },
  'Eletricidade e Magnetismo': {
    objective: 'Calcular corrente, tensão e potência em circuitos resistivos simples.',
    explanation: [
      'Corrente elétrica é a carga que atravessa uma seção por unidade de tempo: I = ΔQ/Δt.',
      'Para um resistor ôhmico em condições constantes, U = RI. Potência elétrica é P = UI.',
      'Antes de operar um circuito, identifique se resistores estão em série (mesma corrente) ou em paralelo (mesma tensão).',
    ],
    example: { prompt: 'Um resistor de 6 Ω é submetido a 12 V. Qual é a corrente?', steps: ['Use U = RI.', 'Isole I = U/R = 12/6.'], answer: '2 A, supondo comportamento ôhmico.' },
    commonMistake: 'Somar resistências de ramos paralelos como se estivessem em série.',
    check: { question: 'Um aparelho opera a 10 V e 2 A. Qual é sua potência?', options: ['5 W', '12 W', '20 W'], correctIndex: 2, feedback: 'P = UI = 10 × 2 = 20 W.' },
  },
  'Matéria, Estrutura Atômica e Ligações': {
    objective: 'Distinguir número atômico, massa aproximada e tipos básicos de ligação.',
    explanation: [
      'O número atômico Z é o número de prótons; no átomo neutro, também é o número de elétrons.',
      'O número de massa A é prótons mais nêutrons de um núcleo específico, não a massa atômica média exibida na tabela periódica.',
      'Ligações iônicas envolvem atração entre íons; ligações covalentes envolvem compartilhamento de pares de elétrons.',
    ],
    example: { prompt: 'Um átomo neutro tem Z = 11 e A = 23. Quantos prótons, nêutrons e elétrons possui?', steps: ['Prótons = Z = 11; elétrons = 11 porque o átomo é neutro.', 'Nêutrons = A − Z = 23 − 11.'], answer: '11 prótons, 12 nêutrons e 11 elétrons.' },
    commonMistake: 'Usar A como número de elétrons ou esquecer que um íon não é eletricamente neutro.',
    check: { question: 'Um átomo neutro com Z = 8 possui quantos elétrons?', options: ['8', '16', '4'], correctIndex: 0, feedback: 'Em átomos neutros, elétrons e prótons têm a mesma quantidade: 8.' },
  },
  'Energia, Cinética e Equilíbrio Químico': {
    objective: 'Distinguir velocidade de reação, troca térmica e estado de equilíbrio.',
    explanation: [
      'Um catalisador diminui a energia de ativação e pode acelerar a chegada ao equilíbrio, mas não altera a posição de equilíbrio.',
      'No equilíbrio dinâmico, as velocidades das reações direta e inversa são iguais; as concentrações ficam constantes, não necessariamente iguais.',
      'Uma reação exotérmica libera energia térmica para o entorno; isso não significa que aconteça instantaneamente.',
    ],
    example: { prompt: 'Em A ⇌ B, no equilíbrio, a concentração de A é 2 mol/L e a de B é 1 mol/L. As velocidades são iguais?', steps: ['Equilíbrio não exige concentrações iguais.', 'A condição dinâmica é igualdade das velocidades direta e inversa.'], answer: 'Sim, desde que o sistema esteja em equilíbrio; as concentrações podem ser diferentes.' },
    commonMistake: 'Concluir que equilíbrio químico significa parada da reação ou quantidades iguais de reagentes e produtos.',
    check: { question: 'Adicionar um catalisador a uma reação reversível em equilíbrio, sem alterar outras condições:', options: ['Muda a posição de equilíbrio', 'Acelera as duas reações sem alterar a posição de equilíbrio', 'Interrompe a reação inversa'], correctIndex: 1, feedback: 'O catalisador atua nas duas direções e não modifica a constante de equilíbrio.' },
  },
  'Eletroquímica e Radioatividade': {
    objective: 'Reconhecer oxidação e calcular a fração remanescente após meias-vidas.',
    explanation: [
      'Oxidação é perda de elétrons; redução é ganho. Em uma pilha, a oxidação ocorre no ânodo e a redução no cátodo.',
      'Meia-vida é o tempo necessário para que metade dos núcleos radioativos de uma amostra decaia, em média.',
      'Após n meias-vidas, a fração de núcleos originais ainda não decaídos é (1/2)ⁿ; isso não implica desaparecimento de toda a matéria.',
    ],
    example: { prompt: 'Uma amostra tem 80 g de um isótopo radioativo com meia-vida de 5 anos. Qual massa do isótopo original resta após 10 anos?', steps: ['Dez anos correspondem a duas meias-vidas.', 'Aplique duas reduções pela metade: 80 → 40 → 20 g.'], answer: '20 g do isótopo original, em média.' },
    commonMistake: 'Subtrair sempre a mesma massa absoluta a cada meia-vida; a metade incide sobre o que resta.',
    check: { question: 'Após três meias-vidas, que fração dos núcleos originais ainda não decaiu?', options: ['1/3', '1/8', '3/4'], correctIndex: 1, feedback: 'A cada meia-vida resta metade do que havia antes: (1/2)³ = 1/8 dos núcleos originais.' },
  },
  'Carbono, Polímeros e Química Ambiental': {
    objective: 'Reconhecer a formação de polímeros e diferenciar propriedades do material de seu impacto ambiental.',
    explanation: [
      'Polímeros são macromoléculas formadas por unidades repetidas; a estrutura das unidades e das cadeias afeta propriedades como flexibilidade.',
      'Na polimerização por adição do eteno, a ligação dupla se abre e forma cadeias de polietileno sem liberação de uma molécula pequena nessa etapa.',
      'A possibilidade de reciclagem depende do tipo de material e de coleta, separação e processamento; não é propriedade garantida de todo polímero.',
    ],
    example: { prompt: 'Qual unidade se repete no polietileno produzido a partir de CH₂=CH₂?', steps: ['Identifique o monômero: eteno, CH₂=CH₂.', 'Abra a ligação dupla entre carbonos e conecte as unidades em cadeia.'], answer: 'A unidade repetitiva é −CH₂−CH₂−, representada por (−CH₂−CH₂−)ₙ.' },
    commonMistake: 'Afirmar que todo plástico é biodegradável ou que todo polímero tem exatamente as mesmas possibilidades de reciclagem.',
    check: { question: 'O monômero usado para produzir polietileno por adição é:', options: ['Eteno', 'Etanol', 'Ácido etanoico'], correctIndex: 0, feedback: 'O eteno (CH₂=CH₂) forma a unidade repetitiva −CH₂−CH₂−.' },
  },
  'Diversidade, Botânica e Zoologia': {
    objective: 'Comparar características de grupos biológicos sem supor uma escala de evolução.',
    explanation: [
      'Classificações biológicas agrupam organismos por relações de parentesco e características compartilhadas, não por superioridade.',
      'Briófitas não possuem vasos condutores verdadeiros; pteridófitas têm vasos, mas não sementes; gimnospermas produzem sementes sem frutos.',
      'Angiospermas produzem flores e frutos; o fruto se desenvolve do ovário da flor e envolve as sementes.',
    ],
    example: { prompt: 'Uma planta produz sementes, mas não forma frutos. A qual grupo pertence?', steps: ['A presença de sementes exclui briófitas e pteridófitas.', 'A ausência de fruto, no esquema escolar de classificação, aponta para gimnospermas.'], answer: 'Gimnospermas, como os pinheiros.' },
    commonMistake: 'Chamar gimnosperma de angiosperma apenas porque ambas produzem sementes.',
    check: { question: 'Qual grupo vegetal produz frutos envolvendo sementes?', options: ['Briófitas', 'Gimnospermas', 'Angiospermas'], correctIndex: 2, feedback: 'Frutos são característicos das angiospermas.' },
  },
  'Fisiologia Humana e Saúde': {
    objective: 'Relacionar a função dos sistemas respiratório e circulatório à manutenção da homeostase.',
    explanation: [
      'Nos alvéolos pulmonares, oxigênio difunde-se para o sangue e dióxido de carbono difunde-se do sangue para o ar alveolar.',
      'O sistema circulatório transporta gases, nutrientes e resíduos; as hemácias participam principalmente do transporte de oxigênio pela hemoglobina.',
      'A troca gasosa depende de gradientes de pressão parcial e de superfícies adequadas; respirar mais rápido não substitui automaticamente uma troca eficiente.',
    ],
    example: { prompt: 'Em qual direção o oxigênio se move nos alvéolos durante uma troca gasosa normal?', steps: ['Compare a pressão parcial de O₂ no ar alveolar e no sangue venoso que chega aos capilares.', 'O O₂ difunde-se do local de maior para o de menor pressão parcial.'], answer: 'Do ar alveolar para o sangue capilar.' },
    commonMistake: 'Afirmar que alvéolos bombeiam oxigênio diretamente para as células; o sangue faz o transporte até os tecidos.',
    check: { question: 'Durante a troca gasosa pulmonar normal, o CO₂ passa principalmente:', options: ['Do ar alveolar para o sangue', 'Do sangue para o ar alveolar', 'Dos ossos para os pulmões sem passar pelo sangue'], correctIndex: 1, feedback: 'O CO₂ difunde-se do sangue capilar para o ar alveolar, sendo eliminado na expiração.' },
  },
}
