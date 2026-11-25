// Importa o banco de questões oficiais (prisma/official/*.json) para a tabela
// Question como source=OFFICIAL. Idempotente: cria as novas, atualiza tópico e
// texto das existentes e NUNCA apaga explicação já escrita. Roda no pré-deploy.
// Falha aqui não derruba o deploy: só avisa (exit 0).
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../prisma/official')
const prisma = new PrismaClient()

async function main() {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : []
  for (const file of files) {
    const { questions } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    const slug = path.basename(file, '.json')
    const topics = await prisma.topic.findMany({ where: { subject: { vestibular: { slug } } }, select: { id: true, name: true } })
    const topicId = new Map(topics.map((t) => [t.name, t.id]))
    const missing = new Set(questions.filter((q) => !topicId.has(q.topic)).map((q) => q.topic))
    if (missing.size) console.warn(`[official] ${slug}: tópicos inexistentes, questões ignoradas: ${[...missing].join(', ')}`)
    const rows = questions.filter((q) => topicId.has(q.topic))
    const existing = new Map((await prisma.question.findMany({ where: { id: { in: rows.map((q) => q.id) } }, select: { id: true, topicId: true, body: true, imageUrl: true, topicSource: true, options: true, topic: { select: { subject: { select: { slug: true } } } } } })).map((q) => [q.id, q]))
    // Matéria → área da prova, para detectar tópico escolhido dentro da área errada.
    const AREA_OF = { matematica: 'matematica', fisica: 'ciencias-natureza', quimica: 'ciencias-natureza', biologia: 'ciencias-natureza', 'ciencias-natureza': 'ciencias-natureza',
      historia: 'ciencias-humanas', geografia: 'ciencias-humanas', filosofia: 'ciencias-humanas', sociologia: 'ciencias-humanas', 'ciencias-humanas': 'ciencias-humanas',
      linguagens: 'linguagens', artes: 'linguagens', 'educacao-fisica': 'linguagens', ingles: 'ingles', espanhol: 'espanhol', redacao: 'linguagens' }
    const origin = (q) => `${slug.toUpperCase()} ${q.year} · questão ${q.number}${q.language === 'ingles' ? ' (inglês)' : q.language === 'espanhol' ? ' (espanhol)' : ''}`
    const media = (q) => (q.imageUrl ? { imageAlt: `Figura da questão: ${origin(q)}` } : undefined)
    const fresh = rows.filter((q) => !existing.has(q.id))
    for (let i = 0; i < fresh.length; i += 500) {
      await prisma.question.createMany({ skipDuplicates: true, data: fresh.slice(i, i + 500).map((q) => ({
        id: q.id, topicId: topicId.get(q.topic), body: q.body, options: q.options, explanation: '', difficulty: 3,
        source: 'OFFICIAL', year: q.year, origin: origin(q), active: true,
        imageUrl: q.imageUrl ?? null, media: media(q),
      })) })
    }
    let updated = 0
    for (const q of rows) {
      const cur = existing.get(q.id)
      // Tópico definido pela IA (topicSource = "ai") é mais preciso que as palavras-chave: não é sobrescrito.
      // Exceção: se a área da prova mudou (base de origem errava a área), volta para a fila de classificação.
      const wrongArea = cur && q.area && AREA_OF[cur.topic.subject.slug] !== q.area
      const keepTopic = cur?.topicSource === 'ai' && !wrongArea
      // Gabarito corrigido (INEP): a explicação antiga defendia a alternativa errada e é refeita.
      const correctOf = (opts) => (Array.isArray(opts) ? opts.find((o) => o.isCorrect)?.id : undefined)
      const keyChanged = cur && correctOf(cur.options) !== correctOf(q.options)
      if (cur && (keyChanged || (!keepTopic && cur.topicId !== topicId.get(q.topic)) || cur.body !== q.body || cur.imageUrl !== (q.imageUrl ?? null) || (wrongArea && cur.topicSource))) {
        await prisma.question.update({ where: { id: q.id }, data: { ...(keepTopic ? {} : { topicId: topicId.get(q.topic), ...(wrongArea ? { topicSource: null } : {}) }), body: q.body, options: q.options, origin: origin(q), imageUrl: q.imageUrl ?? null, media: media(q),
          ...(keyChanged ? { explanation: '', explanationByAi: false } : {}) } })
        updated++
      }
    }
    // Explicações de IA geradas com o primeiro prompt (tom informal, com saudação) voltam a ser escritas.
    const reset = await prisma.question.updateMany({
      where: { source: 'OFFICIAL', explanationByAi: true, OR: ['Fala', 'Salve', 'Olá', 'Ola', 'Oi', 'E aí', 'Bora'].map((g) => ({ explanation: { startsWith: g } })) },
      data: { explanation: '', explanationByAi: false },
    })
    console.log(`[official] ${slug}: ${fresh.length} novas, ${updated} atualizadas, ${rows.length} no arquivo, ${reset.count} explicações refeitas`)
  }
}

main().catch((error) => { console.warn('[official] importação falhou (deploy segue):', error.message) }).finally(() => prisma.$disconnect())
