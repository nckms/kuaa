import { PrismaClient } from '@prisma/client'
import { ENEM_SUBJECTS } from '../src/data/enem-curriculum'

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

const subjectFromEnem = (slug: string, order: number, weight: number): SubjectSeed => {
  const subject = ENEM_SUBJECTS.find((item) => item.slug === slug)
  if (!subject) throw new Error(`Materia base nao encontrada: ${slug}`)
  return { ...subject, order, weight, topics: subject.topics.map((topic) => ({ ...topic })) }
}

const fuvestAdditionalSubjects: SubjectSeed[] = [
  subjectFromEnem('fisica', 5, 0.08),
  subjectFromEnem('quimica', 6, 0.08),
  subjectFromEnem('biologia', 7, 0.08),
  subjectFromEnem('historia', 8, 0.08),
  subjectFromEnem('geografia', 9, 0.08),
  subjectFromEnem('ingles', 10, 0.06),
  subjectFromEnem('filosofia', 11, 0.04),
  subjectFromEnem('sociologia', 12, 0.04),
  subjectFromEnem('artes', 13, 0.03),
  subjectFromEnem('educacao-fisica', 14, 0.03),
]

const unicampAdditionalSubjects: SubjectSeed[] = [
  subjectFromEnem('fisica', 4, 0.09),
  subjectFromEnem('quimica', 5, 0.09),
  subjectFromEnem('biologia', 6, 0.09),
  subjectFromEnem('historia', 7, 0.09),
  subjectFromEnem('geografia', 8, 0.09),
  subjectFromEnem('ingles', 9, 0.09),
  subjectFromEnem('filosofia', 10, 0.04),
  subjectFromEnem('sociologia', 11, 0.04),
]

const DATA: VestibularSeed[] = [
  {
    slug: 'enem',
    name: 'ENEM',
    institution: 'INEP',
    state: 'BR',
    year: 2024,
    description: 'Exame Nacional do Ensino Médio',
    subjects: ENEM_SUBJECTS,
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
        weight: 0.12,
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
        weight: 0.12,
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
        weight: 0,
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
        weight: 0.04,
        order: 4,
        iconSlug: 'world',
        topics: [
          { name: 'Política e Economia Brasileira', description: 'Cenário político, econômico e social do Brasil contemporâneo.', order: 1 },
          { name: 'Cenário Internacional', description: 'Relações internacionais, conflitos e organismos multilaterais.', order: 2 },
          { name: 'Cultura e Sociedade', description: 'Tendências culturais, diversidade e transformações sociais recentes.', order: 3 },
        ],
      },
      ...fuvestAdditionalSubjects,
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
        weight: 0,
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
        weight: 0.15,
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
        weight: 0.15,
        order: 3,
        iconSlug: 'math',
        topics: [
          { name: 'Conjuntos e Funções', description: 'Teoria dos conjuntos, funções reais e suas representações.', order: 1 },
          { name: 'Geometria e Trigonometria', description: 'Geometria plana, espacial e razões trigonométricas aplicadas.', order: 2 },
          { name: 'Combinatória e Probabilidade', description: 'Contagem, arranjos, combinações e cálculo de probabilidades.', order: 3 },
        ],
      },
      ...unicampAdditionalSubjects,
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
