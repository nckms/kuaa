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
    const existing = new Map((await prisma.question.findMany({ where: { id: { in: rows.map((q) => q.id) } }, select: { id: true, topicId: true, body: true } })).map((q) => [q.id, q]))
    const origin = (q) => `${slug.toUpperCase()} ${q.year} · questão ${q.number}${q.language === 'ingles' ? ' (inglês)' : q.language === 'espanhol' ? ' (espanhol)' : ''}`
    const fresh = rows.filter((q) => !existing.has(q.id))
    for (let i = 0; i < fresh.length; i += 500) {
      await prisma.question.createMany({ skipDuplicates: true, data: fresh.slice(i, i + 500).map((q) => ({
        id: q.id, topicId: topicId.get(q.topic), body: q.body, options: q.options, explanation: '', difficulty: 3,
        source: 'OFFICIAL', year: q.year, origin: origin(q), active: true,
      })) })
    }
    let updated = 0
    for (const q of rows) {
      const cur = existing.get(q.id)
      if (cur && (cur.topicId !== topicId.get(q.topic) || cur.body !== q.body)) {
        await prisma.question.update({ where: { id: q.id }, data: { topicId: topicId.get(q.topic), body: q.body, options: q.options, origin: origin(q) } })
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
