import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TopicSeed {
  name: string
  description: string
  order: number
}

interface SubjectSeed {
  name: string
  slug: string
  weight: number
  order: number
  iconSlug: string
  topics: TopicSeed[]
}

interface VestibularSeed {
  slug: string
  name: string
  institution: string
  state: string
  year: number
  description: string
  subjects: SubjectSeed[]
}

const DATA: VestibularSeed[] = [
  {
    slug: 'enem',
    name: 'ENEM',
    institution: 'INEP',
    state: 'BR',
    year: 2024,
    description: 'Exame Nacional do Ensino Médio',
    subjects: [
      {
        name: 'Linguagens',
        slug: 'linguagens',
        weight: 0.25,
        order: 1,
        iconSlug: 'lang',
        topics: [
          { name: 'Interpretação de Texto', description: 'Desenvolvimento das habilidades de leitura e análise de textos variados.', order: 1 },
          { name: 'Literatura Brasileira', description: 'Estudo dos principais movimentos literários e autores da literatura brasileira.', order: 2 },
          { name: 'Gramática e Norma Culta', description: 'Estudo da língua portuguesa segundo a norma-padrão e usos contextuais.', order: 3 },
          { name: 'Produção Textual', description: 'Técnicas de redação dissertativa-argumentativa e diferentes gêneros textuais.', order: 4 },
        ],
      },
      {
        name: 'Matemática',
        slug: 'matematica',
        weight: 0.25,
        order: 2,
        iconSlug: 'math',
        topics: [
          { name: 'Funções e Gráficos', description: 'Estudo das funções reais, suas representações gráficas e propriedades.', order: 1 },
          { name: 'Geometria Plana e Espacial', description: 'Cálculo de áreas, volumes e propriedades de figuras planas e sólidos.', order: 2 },
          { name: 'Probabilidade e Estatística', description: 'Análise de dados, probabilidade e interpretação de gráficos estatísticos.', order: 3 },
          { name: 'Progressões e Sequências', description: 'Progressões aritméticas, geométricas e suas aplicações.', order: 4 },
        ],
      },
      {
        name: 'Ciências da Natureza',
        slug: 'ciencias-natureza',
        weight: 0.25,
        order: 3,
        iconSlug: 'science',
        topics: [
          { name: 'Cinemática e Dinâmica', description: 'Estudo do movimento dos corpos e das forças que os provocam.', order: 1 },
          { name: 'Termologia e Óptica', description: 'Calor, temperatura, fenômenos ópticos e propagação da luz.', order: 2 },
          { name: 'Química Orgânica', description: 'Compostos de carbono, funções orgânicas e reações químicas.', order: 3 },
          { name: 'Biologia Celular e Genética', description: 'Estrutura celular, hereditariedade e expressão gênica.', order: 4 },
        ],
      },
      {
        name: 'Ciências Humanas',
        slug: 'ciencias-humanas',
        weight: 0.25,
        order: 4,
        iconSlug: 'humanities',
        topics: [
          { name: 'História do Brasil República', description: 'Do período republicano à contemporaneidade brasileira.', order: 1 },
          { name: 'Geopolítica Mundial', description: 'Relações de poder, blocos econômicos e conflitos internacionais.', order: 2 },
          { name: 'Filosofia e Sociologia', description: 'Pensamento filosófico, estrutura social e movimentos culturais.', order: 3 },
          { name: 'Geografia Física e Humana', description: 'Relevo, clima, biomas, urbanização e dinâmicas populacionais.', order: 4 },
        ],
      },
    ],
  },
  {
    slug: 'fuvest',
    name: 'FUVEST',
    institution: 'USP',
    state: 'SP',
    year: 2024,
    description: 'Fundação Universitária para o Vestibular',
    subjects: [
      {
        name: 'Português',
        slug: 'portugues',
        weight: 0.30,
        order: 1,
        iconSlug: 'lang',
        topics: [
          { name: 'Interpretação e Análise de Texto', description: 'Leitura crítica e análise de obras literárias e textos não-literários.', order: 1 },
          { name: 'Gramática Contextualizada', description: 'Morfossintaxe, semântica e estilística na norma culta.', order: 2 },
          { name: 'Literatura Portuguesa e Brasileira', description: 'Cânones literários de Portugal e Brasil com análise das obras da lista.', order: 3 },
        ],
      },
      {
        name: 'Matemática',
        slug: 'matematica',
        weight: 0.30,
        order: 2,
        iconSlug: 'math',
        topics: [
          { name: 'Álgebra e Funções', description: 'Equações, inequações, funções polinomiais, exponenciais e logarítmicas.', order: 1 },
          { name: 'Geometria Analítica', description: 'Ponto, reta, circunferência e cônicas no plano cartesiano.', order: 2 },
          { name: 'Trigonometria', description: 'Razões trigonométricas, identidades e equações trigonométricas.', order: 3 },
        ],
      },
      {
        name: 'Redação',
        slug: 'redacao',
        weight: 0.20,
        order: 3,
        iconSlug: 'write',
        topics: [
          { name: 'Estrutura Dissertativa-Argumentativa', description: 'Construção de tese, argumentação e conclusão em texto dissertativo.', order: 1 },
          { name: 'Coesão e Coerência', description: 'Uso de conectivos, progressão temática e organização textual.', order: 2 },
          { name: 'Proposta de Intervenção', description: 'Desenvolvimento de soluções contextualizadas para problemas sociais.', order: 3 },
        ],
      },
      {
        name: 'Atualidades',
        slug: 'atualidades',
        weight: 0.20,
        order: 4,
        iconSlug: 'world',
        topics: [
          { name: 'Política e Economia Brasileira', description: 'Cenário político, econômico e social do Brasil contemporâneo.', order: 1 },
          { name: 'Cenário Internacional', description: 'Relações internacionais, conflitos e organismos multilaterais.', order: 2 },
          { name: 'Cultura e Sociedade', description: 'Tendências culturais, diversidade e transformações sociais recentes.', order: 3 },
        ],
      },
    ],
  },
  {
    slug: 'unicamp',
    name: 'UNICAMP',
    institution: 'UNICAMP',
    state: 'SP',
    year: 2024,
    description: 'Vestibular da Universidade Estadual de Campinas',
    subjects: [
      {
        name: 'Redação',
        slug: 'redacao',
        weight: 0.34,
        order: 1,
        iconSlug: 'write',
        topics: [
          { name: 'Gêneros Textuais Dissertativos', description: 'Domínio de diferentes gêneros dissertativos exigidos pela UNICAMP.', order: 1 },
          { name: 'Argumentação e Refutação', description: 'Técnicas de construção de argumentos e contra-argumentos sólidos.', order: 2 },
          { name: 'Adequação ao Tema', description: 'Leitura dos textos motivadores e pertinência temática da produção.', order: 3 },
        ],
      },
      {
        name: 'Língua Portuguesa',
        slug: 'lingua-portuguesa',
        weight: 0.33,
        order: 2,
        iconSlug: 'lang',
        topics: [
          { name: 'Leitura e Interpretação', description: 'Análise de textos de diferentes esferas de circulação social.', order: 1 },
          { name: 'Variação Linguística', description: 'Registros formais e informais, dialetos e preconceito linguístico.', order: 2 },
          { name: 'Intertextualidade', description: 'Relações entre textos, paródia, paráfrase e referências culturais.', order: 3 },
        ],
      },
      {
        name: 'Matemática',
        slug: 'matematica',
        weight: 0.33,
        order: 3,
        iconSlug: 'math',
        topics: [
          { name: 'Conjuntos e Funções', description: 'Teoria dos conjuntos, funções reais e suas representações.', order: 1 },
          { name: 'Geometria e Trigonometria', description: 'Geometria plana, espacial e razões trigonométricas aplicadas.', order: 2 },
          { name: 'Combinatória e Probabilidade', description: 'Contagem, arranjos, combinações e cálculo de probabilidades.', order: 3 },
        ],
      },
    ],
  },
]

function xpReward(order: number): number {
  return order <= 2 ? 20 : 30
}

async function main() {
  console.log('🌱 Iniciando seed do banco Kuaa…')

  for (const vest of DATA) {
    const { subjects: subjectData, ...vestData } = vest
    const vestibular = await prisma.vestibular.upsert({
      where: { slug: vestData.slug },
      create: vestData,
      update: vestData,
    })
    console.log(`  ✅ ${vestibular.name}`)

    for (const sub of subjectData) {
      const { topics: topicData, ...subData } = sub
      const subject = await prisma.subject.upsert({
        where: { vestibularId_slug: { vestibularId: vestibular.id, slug: subData.slug } },
        create: { ...subData, vestibularId: vestibular.id },
        update: { ...subData, vestibularId: vestibular.id },
      })
      console.log(`    📚 ${subject.name}`)

      for (const topic of topicData) {
        await prisma.topic.upsert({
          where: { subjectId_order: { subjectId: subject.id, order: topic.order } },
          create: { ...topic, xpReward: xpReward(topic.order), subjectId: subject.id },
          update: { name: topic.name, description: topic.description, xpReward: xpReward(topic.order) },
        })
        console.log(`      📖 ${topic.name} (${xpReward(topic.order)} XP)`)
      }
    }
  }

  // Seed achievements
  const achievements = [
    { slug: 'first_flight', name: 'Primeiro Voo', description: 'Complete sua primeira sessão de quiz', iconSlug: 'wing', xpBonus: 10 },
    { slug: 'perfect_wing', name: 'Asa Perfeita', description: 'Complete uma sessão com 100% de acerto', iconSlug: 'star', xpBonus: 20 },
    { slug: 'week_streak', name: 'Semana Consistente', description: 'Mantenha uma sequência de 7 dias', iconSlug: 'fire', xpBonus: 30 },
    { slug: 'century', name: 'Centenário', description: 'Responda 100 questões no total', iconSlug: 'lightning', xpBonus: 25 },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      create: ach,
      update: ach,
    })
  }
  console.log('  ✅ Achievements sincronizados')

  console.log('\n🦅 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
